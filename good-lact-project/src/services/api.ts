import type { Certainty, Dish, DishIngredient } from '../types';
import { newId } from '../lib/storage';

interface AnalyzeInput {
  description?: string;
  image?: { mimeType: 'image/jpeg'; data: string };
}

interface RawIngredient {
  name: string;
  grams: number;
  lactosePer100g: number;
  certainty: Certainty;
  reason?: string;
}

interface RawAnalysis {
  dishName: string;
  portionNote?: string;
  ingredients: RawIngredient[];
}

export class AnalysisError extends Error {}

const TIMEOUT_MS = 30_000;

/** Chiede al server di analizzare il piatto (testo e/o foto). */
export async function analyzeDish(input: AnalyzeInput, signal?: AbortSignal): Promise<Dish> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AnalysisError(
      timeout.aborted
        ? "L'analisi sta impiegando troppo tempo. Riprova."
        : 'Impossibile contattare il servizio. Controlla la connessione.',
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : "L'analisi non è andata a buon fine. Riprova.";
    throw new AnalysisError(message);
  }
  if (!isRawAnalysis(body)) {
    throw new AnalysisError('Risposta del servizio non valida. Riprova.');
  }

  const ingredients: DishIngredient[] = body.ingredients.map((i) => ({
    id: newId(),
    name: i.name,
    grams: i.grams,
    lactosePer100g: i.lactosePer100g,
    certainty: i.certainty,
    reason: i.reason,
    source: 'ai',
    active: true,
  }));
  return { name: body.dishName, portionNote: body.portionNote, ingredients };
}

function isRawAnalysis(value: unknown): value is RawAnalysis {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.dishName === 'string' &&
    Array.isArray(v.ingredients) &&
    v.ingredients.every(
      (i) =>
        i &&
        typeof i === 'object' &&
        typeof (i as RawIngredient).name === 'string' &&
        Number.isFinite((i as RawIngredient).grams) &&
        Number.isFinite((i as RawIngredient).lactosePer100g) &&
        ['certain', 'probable', 'possible'].includes((i as RawIngredient).certainty),
    )
  );
}
