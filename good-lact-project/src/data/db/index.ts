// Database offline ampliato: alimenti da fonti pubbliche (USDA SR28, studi sui formaggi DOP)
// e piatti tipici derivati da ricette. Le voci già presenti in goodLactData hanno la precedenza.
// Fonti, discrepanze e lacune: docs/DATABASE.md. Non sono dati clinici certificati.
import type { FoodInfo, Reliability } from '../goodLactData';
import alimentiJson from './alimenti.json';
import piattiJson from './piatti.json';

export interface DbFoodEntry {
  key: string;
  name: string;
  lactosePer100g: number;
  portionGrams: number | null;
  category: string;
  reliability: Reliability;
  source: string;
  sourceUrl: string;
  note?: string;
}

export interface DbDishIngredient {
  name: string;
  refKey: string | null;
  lactosePer100g: number;
  gramsMin: number;
  gramsMax: number;
  certainty: 'certain' | 'probable' | 'possible';
}

export interface DbDish {
  key: string;
  name: string;
  category: string;
  cuisine: string;
  ingredients: DbDishIngredient[];
  hiddenLactoseNote?: string;
  askAtRestaurant?: string;
  reliability: Reliability;
  source: string;
  sourceUrl: string;
}

/** Sotto questa soglia (g/100 g) vale la definizione italiana di "senza lattosio". */
export const LACTOSE_FREE_THRESHOLD = 0.1;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Lattosio di una porzione tipica: grammi a metà dell'intervallo di ogni ingrediente,
 * compresi quelli solo "possibili" (scelta prudente per chi è severo).
 */
export function dishLactosePerPortion(dish: DbDish): number {
  return round2(
    dish.ingredients.reduce((sum, ing) => sum + (((ing.gramsMin + ing.gramsMax) / 2) / 100) * ing.lactosePer100g, 0),
  );
}

export function foodFromEntry(e: DbFoodEntry): FoodInfo {
  const free = e.lactosePer100g <= LACTOSE_FREE_THRESHOLD;
  return {
    name: e.name,
    lactosePer100g: e.lactosePer100g,
    lactosePerPortion: e.portionGrams ? round2((e.portionGrams / 100) * e.lactosePer100g) : undefined,
    lactoseMode: 'weight',
    isLactoseFree: free || undefined,
    category: e.category,
    note: e.note,
    reliability: e.reliability,
    source: e.source,
    sourceUrl: e.sourceUrl,
  };
}

export function foodFromDish(d: DbDish): FoodInfo {
  const perPortion = dishLactosePerPortion(d);
  return {
    name: d.name,
    lactosePerPortion: perPortion,
    lactoseMode: 'perPortion',
    isLactoseFree: perPortion <= 0 || undefined,
    category: d.category,
    note: [d.hiddenLactoseNote, 'Stima da ricetta tipica: la porzione reale può variare.'].filter(Boolean).join(' '),
    reliability: d.reliability,
    source: d.source,
    sourceUrl: d.sourceUrl,
  };
}

export const DB_ALIMENTI = alimentiJson as DbFoodEntry[];
export const DB_PIATTI = piattiJson as DbDish[];

export const EXTRA_FOODS: Record<string, FoodInfo> = {};
for (const e of DB_ALIMENTI) EXTRA_FOODS[e.key] = foodFromEntry(e);
for (const d of DB_PIATTI) EXTRA_FOODS[d.key] = foodFromDish(d);
