import type { Certainty, Dish, DishIngredient } from '../types';
import { newId } from '../lib/storage';
import { callCloud, CloudError } from './cloud';

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

const TIMEOUT_MS = 45_000;

/** Chiede al server di analizzare il piatto (testo e/o foto). */
export async function analyzeDish(input: AnalyzeInput, signal?: AbortSignal): Promise<Dish> {
  let body: unknown;
  try {
    body = await callCloud('analyze', input, {
      signal,
      timeoutMs: TIMEOUT_MS,
      timeoutMessage: "L'analisi sta impiegando troppo tempo. Riprova.",
      failedMessage: "L'analisi non è andata a buon fine. Riprova.",
    });
  } catch (error) {
    if (error instanceof CloudError) throw new AnalysisError(error.message);
    throw error;
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
