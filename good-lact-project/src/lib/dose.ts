import { FOODS_DATA, UNITS_DATA } from '../data/goodLactData';
import type { FoodInfo, Reliability } from '../data/goodLactData';
import type { Confidence, DishIngredient, DoseEstimate, MealItem } from '../types';

/**
 * Quanti FCC si stimano per grammo di lattosio. NON è un dato clinico certo:
 * le fonti consultate danno valori diversi e nessuna è uno studio dose-risposta.
 * - ~200 FCC/g: valore di riferimento di laboratorio / indicazione di un produttore
 *   (1.000 FCC ogni 5 g di lattosio, sanotact.de);
 * - 1.000-1.500 FCC/g: stima pratica (5-7 volte il laboratorio) del portale nmi
 *   (nahrungsmittel-intoleranz.com), coerente con 5.000-15.000 FCC a pasto riferiti
 *   dalla maggior parte di 500+ intervistati (sondaggio nmi 2014, non peer-reviewed).
 * Usiamo 1.000 come stima prudenziale. L'app lo dichiara nei risultati e nelle FAQ.
 */
export const FCC_PER_GRAM_LACTOSE = 1000;
/** Intervallo delle fonti (FCC per g di lattosio), mostrato nelle FAQ. */
export const FCC_PER_GRAM_RANGE = { lab: 200, practicalMax: 1500 } as const;
/** Dose minima proposta (mezza compressa): il passo più piccolo dell'app. */
export const MINIMUM_PILLS = 0.5;

export interface DoseOptions {
  /** Intolleranza severa: nessun margine di rischio accettato. */
  severe?: boolean;
}

interface Profile {
  /** Sotto questa quantità (g di lattosio per ingrediente) il contributo è trascurabile. */
  negligible: number;
  /** Tolleranza sui grammi: una stima AI sbaglia più di un peso dichiarato. */
  tolAi: number;
  tolUser: number;
  /** Tolleranza sui valori di un alimento del database, per affidabilità del dato. */
  tolFood: Record<Reliability, number>;
  /** Gli ingredienti "possibili" entrano nella dose attesa. */
  includePossible: boolean;
}

const STANDARD: Profile = {
  negligible: 0.1,
  tolAi: 0.3,
  tolUser: 0.1,
  tolFood: { measured: 0.1, estimated: 0.1, unverified: 0.1 },
  includePossible: false,
};

/**
 * Profilo per chi reagisce anche a quantità minime. Scelte da confermare:
 * 0,02 g è meno di mezzo cucchiaino di latte (circa 0,25 g di lattosio ogni 5 ml).
 */
const SEVERE: Profile = {
  negligible: 0.02,
  tolAi: 0.5,
  tolUser: 0.2,
  tolFood: { measured: 0.2, estimated: 0.3, unverified: 0.5 },
  includePossible: true,
};

const profileFor = (severe?: boolean): Profile => (severe ? SEVERE : STANDARD);

/** Soglia sotto cui un ingrediente viene mostrato come "tracce trascurabili". */
export function negligibleFor(severe?: boolean): number {
  return profileFor(severe).negligible;
}

export function reliabilityOf(food: FoodInfo): Reliability {
  return food.reliability ?? 'unverified';
}

/** Soglie per la confidenza, sulla quota di lattosio non certo. */
const HIGH_CONFIDENCE_MAX_SHARE = 0.2;
const MEDIUM_CONFIDENCE_MAX_SHARE = 0.5;

export function roundToHalf(pills: number): number {
  return Math.ceil(pills * 2 - 1e-9) / 2;
}

export function pillsFor(fcc: number, fccPerPill: number): number {
  if (!(fccPerPill > 0) || !(fcc > 0)) return 0;
  return roundToHalf(fcc / fccPerPill);
}

interface Contribution {
  name: string;
  min: number;
  expected: number;
  cautious: number;
  certain: boolean;
  /** Ingrediente non certo con lattosio sotto soglia: conta 0 ma lascia un dubbio. */
  doubtful?: boolean;
}

function fromIngredient(ing: DishIngredient, profile: Profile): Contribution {
  const raw = (Math.max(ing.grams, 0) / 100) * Math.max(ing.lactosePer100g, 0);
  const base = raw < profile.negligible ? 0 : raw;
  const tol = ing.source === 'ai' ? profile.tolAi : profile.tolUser;
  const certain = ing.certainty === 'certain';
  const counted = ing.certainty !== 'possible' || profile.includePossible;
  return {
    name: ing.name,
    min: certain ? base * (1 - tol) : 0,
    expected: counted ? base : 0,
    cautious: base * (1 + tol),
    certain,
    doubtful: !certain && raw > 0 && base === 0,
  };
}

function fromFood(item: MealItem, profile: Profile): Contribution | null {
  const food = item.foodKey ? FOODS_DATA[item.foodKey] : undefined;
  if (!food) return null;
  // Gli alimenti segnati "senza lattosio" (es. gorgonzola, formaggi stagionati) valgono zero,
  // anche in modalità severa: è la regola che segue chi usa l'app.
  if (food.isLactoseFree) return null;
  const lactose =
    food.lactoseMode === 'perPortion'
      ? (food.lactosePerPortion ?? 0) * item.quantity
      : ((item.quantity * (UNITS_DATA[item.unit]?.multiplier ?? 0)) / 100) * (food.lactosePer100g ?? 0);
  if (!(lactose >= profile.negligible) || !(lactose > 0)) return null;
  // Un alimento scelto dal database con peso indicato è un dato certo,
  // ma il margine dipende da quanto è affidabile il valore nel database.
  const tol = profile.tolFood[reliabilityOf(food)];
  return {
    name: food.name,
    min: lactose * (1 - tol),
    expected: lactose,
    cautious: lactose * (1 + tol),
    certain: true,
  };
}

/** Quantità iniziale sensata quando si aggiunge un alimento dal database. */
export function defaultQuantityFor(foodKey: string): { quantity: number; unit: string } {
  const food = FOODS_DATA[foodKey];
  const per100 = food?.lactosePer100g ?? 0;
  const perPortion = food?.lactosePerPortion ?? 0;
  if (per100 > 0 && perPortion > 0) {
    const grams = Math.round((perPortion / per100) * 100 / 5) * 5;
    if (grams >= 10 && grams <= 500) return { quantity: grams, unit: 'grammi' };
  }
  return { quantity: 100, unit: 'grammi' };
}

export function contributionsFor(items: MealItem[], severe?: boolean): Contribution[] {
  const profile = profileFor(severe);
  const list: Contribution[] = [];
  for (const item of items) {
    if (item.kind === 'dish' && item.dish) {
      for (const ing of item.dish.ingredients) {
        if (ing.active) list.push(fromIngredient(ing, profile));
      }
    } else {
      const c = fromFood(item, profile);
      if (c) list.push(c);
    }
  }
  return list;
}

export function confidenceFor(share: number): Confidence {
  if (share <= HIGH_CONFIDENCE_MAX_SHARE) return 'high';
  if (share <= MEDIUM_CONFIDENCE_MAX_SHARE) return 'medium';
  return 'low';
}

export function estimateDose(
  items: MealItem[],
  fccPerPill: number,
  sensitivity: number,
  options: DoseOptions = {},
): DoseEstimate {
  const severe = options.severe === true;
  const parts = contributionsFor(items, severe);
  const sum = (pick: (c: Contribution) => number) => parts.reduce((acc, c) => acc + pick(c), 0);

  const lactoseMin = sum((c) => c.min);
  const lactoseExpected = sum((c) => c.expected);
  const lactoseCautious = sum((c) => c.cautious);

  const toFcc = (g: number) => g * FCC_PER_GRAM_LACTOSE * sensitivity;
  const fccMin = toFcc(lactoseMin);
  const fccExpected = toFcc(lactoseExpected);
  const fccCautious = toFcc(lactoseCautious);

  const uncertainLactose = parts.filter((c) => !c.certain).reduce((acc, c) => acc + c.cautious, 0);
  const uncertainShare = lactoseCautious > 0 ? uncertainLactose / lactoseCautious : 0;
  const confidence = confidenceFor(uncertainShare);

  const pillsMin = pillsFor(fccMin, fccPerPill);
  const pillsExpected = pillsFor(fccExpected, fccPerPill);
  const pillsCautious = pillsFor(fccCautious, fccPerPill);

  const mainUncertainties = parts
    .filter((c) => !c.certain && c.cautious > 0)
    .sort((a, b) => b.cautious - a.cautious)
    .slice(0, 3)
    .map((c) => c.name);

  // Profilo severo: nel dubbio (nulla di calcolabile ma ingredienti incerti sotto soglia) si propone il minimo.
  const doubtMinimum = severe && pillsCautious === 0 && parts.some((c) => c.doubtful);
  const pillsRecommended = doubtMinimum
    ? MINIMUM_PILLS
    : severe || confidence === 'low'
      ? pillsCautious
      : pillsExpected;
  const pillsRaw = fccPerPill > 0 ? fccCautious / fccPerPill : 0;
  const minimumApplied = pillsRecommended > 0 && pillsRaw < MINIMUM_PILLS - 1e-9;

  return {
    lactoseMin,
    lactoseExpected,
    lactoseCautious,
    fccMin,
    fccExpected,
    fccCautious,
    pillsMin,
    pillsExpected,
    pillsCautious,
    pillsRecommended,
    pillsRaw,
    minimumApplied,
    doubtMinimum,
    severe,
    confidence,
    uncertainShare,
    mainUncertainties,
  };
}

export function isLactoseFreeMeal(est: DoseEstimate): boolean {
  return est.lactoseCautious <= 0 && !est.doubtMinimum;
}
