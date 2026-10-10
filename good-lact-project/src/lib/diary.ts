import type { Consumption, SymptomEntry, SymptomSeverity } from '../types';

export const CHECK_AFTER_MS = 90 * 60 * 1000;
export const CHECK_EXPIRES_MS = 20 * 60 * 60 * 1000;
export const MAX_SYMPTOM_ENTRIES = 300;

export const SEVERITY_LABEL: Record<SymptomSeverity, string> = {
  0: 'Nessun sintomo',
  1: 'Lieve',
  2: 'Medio',
  3: 'Forte',
};

export function isSymptomEntry(v: unknown): v is SymptomEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as SymptomEntry;
  return (
    typeof e.id === 'string' &&
    typeof e.at === 'number' && Number.isFinite(e.at) &&
    (e.severity === 0 || e.severity === 1 || e.severity === 2 || e.severity === 3) &&
    Array.isArray(e.foodNames) && e.foodNames.every((n) => typeof n === 'string') &&
    typeof e.pills === 'number'
  );
}

/** Voci a cui l'utente ha davvero risposto, dalla più recente. */
export function answered(entries: SymptomEntry[]): SymptomEntry[] {
  return entries.filter((e) => !e.skipped).sort((a, b) => b.at - a.at);
}

/**
 * Prima assunzione per cui ha senso chiedere "come stai?": passata da almeno
 * 90 minuti, non più di 20 ore, senza risposta (né "salta") già registrata.
 */
export function pendingCheck(consumptions: Consumption[], entries: SymptomEntry[], now: number): Consumption | null {
  const done = new Set(entries.map((e) => e.consumptionId).filter(Boolean));
  const candidates = consumptions
    .filter((c) => typeof c.at === 'number' && !done.has(c.id))
    .filter((c) => now - (c.at as number) >= CHECK_AFTER_MS && now - (c.at as number) <= CHECK_EXPIRES_MS)
    .sort((a, b) => (b.at as number) - (a.at as number));
  return candidates[0] ?? null;
}

export interface SensitivitySuggestion {
  suggested: number;
  reason: string;
}

/**
 * Suggerisce di AUMENTARE la sensibilità se i sintomi medi/forti si ripetono.
 * Non abbassa mai il valore da sola: una dose più bassa è una decisione
 * che spetta all'utente (e al suo medico).
 */
export function sensitivitySuggestion(entries: SymptomEntry[], sensitivity: number): SensitivitySuggestion | null {
  if (sensitivity >= 2) return null;
  const recent = answered(entries).slice(0, 10);
  const bad = recent.filter((e) => e.severity >= 2).length;
  const lastFourBad = recent.slice(0, 4).filter((e) => e.severity >= 2).length;
  if (bad < 3 && lastFourBad < 2) return null;
  const suggested = Math.min(2, Math.round((sensitivity + 0.2) * 10) / 10);
  return {
    suggested,
    reason:
      `Negli ultimi ${recent.length} pasti registrati ${bad} volte hai avuto sintomi medi o forti. ` +
      `Potrebbe servire una copertura più ampia, ma anche tracce di latte o altre cause: è un indizio, non una diagnosi.`,
  };
}

/** Sintomi nonostante una dose alta: più probabile contaminazione o altra causa. */
export function highDoseSymptoms(entries: SymptomEntry[]): boolean {
  return answered(entries).slice(0, 5).filter((e) => e.severity >= 2 && e.pills >= 2).length >= 2;
}
