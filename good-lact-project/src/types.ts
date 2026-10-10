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
  /** Istante dell'assunzione (ms); assente nelle registrazioni più vecchie. */
  at?: number;
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

/** Cibo che l'utente ha provato: 'ok' = lo tollera, 'bad' = gli ha dato fastidio. */
export type ExperienceVerdict = 'ok' | 'bad';

export interface Experience {
  id: string;
  name: string;
  verdict: ExperienceVerdict;
  createdAt: number;
}

/** 0 = nessun sintomo, 1 = lieve, 2 = medio, 3 = forte. */
export type SymptomSeverity = 0 | 1 | 2 | 3;

export interface SymptomEntry {
  id: string;
  at: number;
  severity: SymptomSeverity;
  consumptionId?: string;
  foodNames: string[];
  pills: number;
  /** True se l'utente ha scelto di non rispondere: non conta nelle statistiche. */
  skipped?: boolean;
}
