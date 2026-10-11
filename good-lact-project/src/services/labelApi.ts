// Client per le funzioni Firebase `label` (scanner etichette) e `menu` (modalità ristorante).
// Stessa gestione errori di services/api.ts; la risposta è validata a runtime.
import { callCloud, CloudError } from './cloud';

export class LabelApiError extends Error {}

export type LabelVerdict = 'ok' | 'caution' | 'avoid' | 'unreadable';
export type MenuRisk = 'low' | 'ask' | 'avoid';

export interface ApiImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Base64 puro, senza prefisso "data:". */
  data: string;
}

export interface DairyIngredient {
  term: string;
  note: string;
}

export interface LabelResult {
  productName: string;
  verdict: LabelVerdict;
  lactoseFreeClaim: boolean;
  dairyIngredients: DairyIngredient[];
  mayContainTraces: boolean;
  readable: boolean;
  summary: string;
  note: string;
}

export interface MenuDish {
  name: string;
  risk: MenuRisk;
  why: string;
  askStaff: string;
}

export interface MenuResult {
  dishes: MenuDish[];
  kitchenNote: string;
}

export interface MenuInput {
  text?: string;
  image?: ApiImage;
}

const TIMEOUT_MS = 45_000;
const VERDICTS: readonly string[] = ['ok', 'caution', 'avoid', 'unreadable'];
const RISKS: readonly string[] = ['low', 'ask', 'avoid'];

async function call(
  name: 'label' | 'menu',
  payload: unknown,
  signal: AbortSignal | undefined,
  messages: { timeout: string; failed: string },
): Promise<unknown> {
  try {
    return await callCloud(name, payload, {
      signal,
      timeoutMs: TIMEOUT_MS,
      timeoutMessage: messages.timeout,
      failedMessage: messages.failed,
    });
  } catch (error) {
    if (error instanceof CloudError) throw new LabelApiError(error.message);
    throw error;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isLabelResult(value: unknown): value is LabelResult {
  if (!isObject(value)) return false;
  return (
    typeof value.productName === 'string' &&
    typeof value.verdict === 'string' &&
    VERDICTS.includes(value.verdict) &&
    typeof value.lactoseFreeClaim === 'boolean' &&
    typeof value.mayContainTraces === 'boolean' &&
    typeof value.readable === 'boolean' &&
    typeof value.summary === 'string' &&
    typeof value.note === 'string' &&
    Array.isArray(value.dairyIngredients) &&
    value.dairyIngredients.every((d) => isObject(d) && typeof d.term === 'string' && typeof d.note === 'string')
  );
}

export function isMenuResult(value: unknown): value is MenuResult {
  if (!isObject(value)) return false;
  return (
    typeof value.kitchenNote === 'string' &&
    Array.isArray(value.dishes) &&
    value.dishes.every(
      (d) =>
        isObject(d) &&
        typeof d.name === 'string' &&
        typeof d.risk === 'string' &&
        RISKS.includes(d.risk) &&
        typeof d.why === 'string' &&
        typeof d.askStaff === 'string',
    )
  );
}

/** Legge l'etichetta di un prodotto. Il verdetto arriva calcolato dal server. */
export async function scanLabel(image: ApiImage, signal?: AbortSignal): Promise<LabelResult> {
  const body = await call('label', { image }, signal, {
    timeout: "La lettura dell'etichetta sta impiegando troppo tempo. Riprova.",
    failed: "La lettura dell'etichetta non è andata a buon fine. Riprova.",
  });
  if (!isLabelResult(body)) throw new LabelApiError('Risposta del servizio non valida. Riprova.');
  return body;
}

/** Legge un menu (foto e/o testo incollato) e classifica i piatti. */
export async function readMenu(input: MenuInput, signal?: AbortSignal): Promise<MenuResult> {
  const body = await call('menu', input, signal, {
    timeout: 'La lettura del menu sta impiegando troppo tempo. Riprova.',
    failed: 'La lettura del menu non è andata a buon fine. Riprova.',
  });
  if (!isMenuResult(body)) throw new LabelApiError('Risposta del servizio non valida. Riprova.');
  return body;
}
