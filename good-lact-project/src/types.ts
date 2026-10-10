export type Certainty = 'certain' | 'probable' | 'possible';

export interface DishIngredient {
  id: string;
  name: string;
  grams: number;
  /** Grammi di lattosio ogni 100 g di ingrediente. */
  lactosePer100g: number;
  certainty: Certainty;
  /** Perché l'ingrediente è stato incluso (spiegazione dell'analisi). */
  reason?: string;
  /** "ai" = stimato dall'analisi, "user" = aggiunto o pesato dall'utente. */
  source: 'ai' | 'user';
  /** Se false l'ingrediente è escluso dal calcolo. */
  active: boolean;
}

export interface Dish {
  name: string;
  portionNote?: string;
  ingredients: DishIngredient[];
}

export interface MealItem {
  id: string;
  /** Alimento singolo del database (foodKey) oppure un piatto composto. */
  kind: 'food' | 'dish';
  name: string;
  foodKey?: string;
  quantity: number;
  unit: string;
  dish?: Dish;
}

export interface Consumption {
  id: string;
  time: string;
  pills: number;
  foodNames: string[];
}

export interface DailyLog {
  date: string;
  totalPills: number;
  consumptions: Consumption[];
}

export type Confidence = 'high' | 'medium' | 'low';

export interface DoseEstimate {
  lactoseMin: number;
  lactoseExpected: number;
  lactoseCautious: number;
  fccMin: number;
  fccExpected: number;
  fccCautious: number;
  pillsMin: number;
  pillsExpected: number;
  pillsCautious: number;
  /** Dose finale consigliata: se la confidenza è bassa (o in modalità severa) coincide con la prudente. */
  pillsRecommended: number;
  /** True se il calcolo è stato fatto con il profilo di intolleranza severa. */
  severe: boolean;
  confidence: Confidence;
  /** Quota (0-1) del lattosio massimo che dipende da ingredienti non certi. */
  uncertainShare: number;
  /** Ingredienti che pesano di più sull'incertezza. */
  mainUncertainties: string[];
}
