import { FOODS_DATA, UNITS_DATA } from '../data/goodLactData';
import type { Confidence, DishIngredient, DoseEstimate, MealItem } from '../types';

/** Quanti FCC servono per grammo di lattosio (formula storica di Good Lact). */
export const FCC_PER_GRAM_LACTOSE = 1000;

/** Tolleranza sui grammi: una stima AI sbaglia più di un peso dichiarato. */
const TOLERANCE_AI = 0.3;
const TOLERANCE_USER = 0.1;

/** Sotto questa quantità (g di lattosio per ingrediente) il contributo è trascurabile. */
export const NEGLIGIBLE_LACTOSE_G = 0.1;

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
}

function fromIngredient(ing: DishIngredient): Contribution {
  const raw = (Math.max(ing.grams, 0) / 100) * Math.max(ing.lactosePer100g, 0);
  const base = raw < NEGLIGIBLE_LACTOSE_G ? 0 : raw;
  const tol = ing.source === 'ai' ? TOLERANCE_AI : TOLERANCE_USER;
  const certain = ing.certainty === 'certain';
  return {
    name: ing.name,
    min: certain ? base * (1 - tol) : 0,
    expected: ing.certainty === 'possible' ? 0 : base,
    cautious: base * (1 + tol),
    certain,
  };
}

function fromFood(item: MealItem): Contribution | null {
  const food = item.foodKey ? FOODS_DATA[item.foodKey] : undefined;
  if (!food || food.isLactoseFree) return null;
  const lactose =
    food.lactoseMode === 'perPortion'
      ? (food.lactosePerPortion ?? 0) * item.quantity
      : ((item.quantity * (UNITS_DATA[item.unit]?.multiplier ?? 0)) / 100) * (food.lactosePer100g ?? 0);
  if (!(lactose >= NEGLIGIBLE_LACTOSE_G)) return null;
  // Un alimento scelto dal database con peso indicato è un dato certo.
  return {
    name: food.name,
    min: lactose * (1 - TOLERANCE_USER),
    expected: lactose,
    cautious: lactose * (1 + TOLERANCE_USER),
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

export function contributionsFor(items: MealItem[]): Contribution[] {
  const list: Contribution[] = [];
  for (const item of items) {
    if (item.kind === 'dish' && item.dish) {
      for (const ing of item.dish.ingredients) {
        if (ing.active) list.push(fromIngredient(ing));
      }
    } else {
      const c = fromFood(item);
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
): DoseEstimate {
  const parts = contributionsFor(items);
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
    pillsRecommended: confidence === 'low' ? pillsCautious : pillsExpected,
    confidence,
    uncertainShare,
    mainUncertainties,
  };
}

export function isLactoseFreeMeal(est: DoseEstimate): boolean {
  return est.lactoseCautious <= 0;
}
