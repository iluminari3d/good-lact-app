// Chiamate alle funzioni Firebase (analisi piatti, etichette, menu).
// Firebase si carica solo quando serve, così chi non usa l'AI non scarica nulla in più.

export type CloudFunction = 'analyze' | 'label' | 'menu';

export class CloudError extends Error {}

export const LOGIN_REQUIRED_MESSAGE =
  "Per usare le funzioni con l'AI devi accedere: apri Impostazioni e accedi con Google o con il link via email.";

// Codici che il server usa con messaggi già scritti per l'utente.
const SERVER_MESSAGE_CODES = ['unauthenticated', 'resource-exhausted', 'invalid-argument', 'unavailable'];

function userMessage(error: unknown, fallback: string): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';
  if (SERVER_MESSAGE_CODES.some((c) => code === `functions/${c}`) && message) return message;
  if (code === 'functions/deadline-exceeded') return 'Il servizio sta impiegando troppo tempo. Riprova.';
  return fallback;
}

/**
 * Chiama la funzione e restituisce il risultato non ancora validato.
 * `signal` interrompe l'attesa (la richiesta già partita non si può annullare).
 */
export async function callCloud(
  name: CloudFunction,
  data: unknown,
  options: { signal?: AbortSignal; timeoutMs: number; timeoutMessage: string; failedMessage: string },
): Promise<unknown> {
  const { signal, timeoutMs, timeoutMessage, failedMessage } = options;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new CloudError('Sei offline: questa funzione ha bisogno della connessione.');
  }

  const aborted = new Promise<never>((_, reject) => {
    if (!signal) return;
    const abort = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });

  let outcome;
  try {
    const { callFunction } = await import('../sync/firebaseClient');
    outcome = await Promise.race([callFunction(name, data, timeoutMs), aborted]);
  } catch (error) {
    if (signal?.aborted) throw error;
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
    if (code === 'functions/deadline-exceeded') throw new CloudError(timeoutMessage);
    throw new CloudError(userMessage(error, failedMessage));
  }
  if (outcome.signedOut) throw new CloudError(LOGIN_REQUIRED_MESSAGE);
  return outcome.data;
}
