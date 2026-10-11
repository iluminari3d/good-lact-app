// Logica comune delle tre funzioni: accesso obbligatorio, validazione, tetto
// giornaliero, esecuzione e restituzione della richiesta se il servizio AI fallisce.
// Non importa Firebase: così si prova con dati finti.
import { UpstreamError } from './gemini.js';
import { dayKey, limitFor, release, reserve } from './quota.js';

export class CallError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const LOGIN_MESSAGE =
  "Per usare le funzioni con l'AI devi accedere: apri Impostazioni e accedi con Google o con il link via email.";

export async function guardedCall({ auth, data, parse, work, unavailableMessage, config, db, now = new Date() }) {
  if (!auth?.uid) throw new CallError('unauthenticated', LOGIN_MESSAGE);

  const parsed = parse(data);
  if (parsed.error) throw new CallError('invalid-argument', parsed.error);

  const { limit, unlimited } = limitFor(auth.token, config);
  const day = dayKey(now);
  const slot = await reserve(db, auth.uid, day, limit, now);
  if (!slot.ok) {
    throw new CallError(
      'resource-exhausted',
      unlimited
        ? 'Hai raggiunto il limite tecnico giornaliero. Riprova domani.'
        : `Hai usato le ${limit} richieste con l'AI di oggi. Tornano domani. Intanto puoi comporre il piatto a mano.`,
    );
  }

  try {
    return await work(parsed);
  } catch (error) {
    await release(db, auth.uid, day).catch(() => {});
    if (error instanceof UpstreamError || error?.name === 'TimeoutError') {
      throw new CallError('unavailable', unavailableMessage);
    }
    throw error;
  }
}
