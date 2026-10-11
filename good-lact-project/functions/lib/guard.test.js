import { describe, expect, it } from 'vitest';
import { UpstreamError } from './gemini.js';
import { CallError, guardedCall } from './guard.js';
import { dayKey, limitFor, parseEmailList } from './quota.js';

/** Firestore finto in memoria: basta per collection().doc() e runTransaction(). */
function fakeDb() {
  const store = new Map();
  let queue = Promise.resolve(); // Firestore esegue le transazioni in conflitto una dopo l'altra
  return {
    store,
    collection: (c) => ({ doc: (id) => ({ key: `${c}/${id}` }) }),
    runTransaction: (fn) => {
      const run = queue.then(() =>
        fn({
          get: async (ref) => ({ exists: store.has(ref.key), data: () => store.get(ref.key) }),
          set: (ref, data) => store.set(ref.key, data),
        }),
      );
      queue = run.catch(() => {});
      return run;
    },
  };
}

const config = { freeLimit: 3, unlimitedCap: 5, unlimited: parseEmailList(' Boss@Example.com , altro@example.com ') };
const user = { uid: 'u1', token: { email: 'x@example.com', email_verified: true } };
const base = (over = {}) => ({
  auth: user,
  data: {},
  parse: () => ({ ok: true }),
  work: async () => ({ done: true }),
  unavailableMessage: 'non disponibile',
  config,
  db: fakeDb(),
  now: new Date('2026-10-11T10:00:00Z'),
  ...over,
});
const code = async (p) => p.then(() => null, (e) => (e instanceof CallError ? e.code : e));

describe('tetto giornaliero', () => {
  it('senza accesso non si chiama il servizio', async () => {
    let called = false;
    const r = await code(guardedCall(base({ auth: undefined, work: async () => { called = true; } })));
    expect(r).toBe('unauthenticated');
    expect(called).toBe(false);
  });

  it('una richiesta non valida non consuma il tetto', async () => {
    const db = fakeDb();
    const r = await code(guardedCall(base({ db, parse: () => ({ error: 'no' }) })));
    expect(r).toBe('invalid-argument');
    expect(db.store.size).toBe(0);
  });

  it('blocca alla richiesta oltre il tetto e conta per giorno', async () => {
    const db = fakeDb();
    for (let i = 0; i < 3; i++) await guardedCall(base({ db }));
    expect(await code(guardedCall(base({ db })))).toBe('resource-exhausted');
    // il giorno dopo il contatore riparte
    await expect(guardedCall(base({ db, now: new Date('2026-10-12T10:00:00Z') }))).resolves.toEqual({ done: true });
  });

  it('due richieste insieme non superano il tetto', async () => {
    const db = fakeDb();
    const results = await Promise.all(Array.from({ length: 6 }, () => code(guardedCall(base({ db })))));
    expect(results.filter((r) => r === null)).toHaveLength(3);
    expect(results.filter((r) => r === 'resource-exhausted')).toHaveLength(3);
  });

  it('se il servizio AI fallisce la richiesta viene restituita', async () => {
    const db = fakeDb();
    const r = await code(guardedCall(base({ db, work: async () => { throw new UpstreamError('x'); } })));
    expect(r).toBe('unavailable');
    expect([...db.store.values()][0].count).toBe(0);
  });

  it('un errore imprevisto viene rilanciato così com\'è', async () => {
    const boom = new Error('boom');
    await expect(guardedCall(base({ work: async () => { throw boom; } }))).rejects.toBe(boom);
  });
});

describe('uso illimitato', () => {
  it('vale per le email in elenco se verificate, senza badare alle maiuscole', () => {
    const t = { email: 'BOSS@example.com', email_verified: true };
    expect(limitFor(t, config)).toEqual({ limit: 5, unlimited: true });
  });
  it('non vale se l\'email non è verificata o non è in elenco', () => {
    expect(limitFor({ email: 'boss@example.com', email_verified: false }, config).unlimited).toBe(false);
    expect(limitFor({ email: 'boss@example.com' }, config).unlimited).toBe(false);
    expect(limitFor({ email: 'nessuno@example.com', email_verified: true }, config).unlimited).toBe(false);
    expect(limitFor({}, config).unlimited).toBe(false);
  });
  it('anche gli illimitati hanno il tetto tecnico', async () => {
    const db = fakeDb();
    const boss = { uid: 'b', token: { email: 'boss@example.com', email_verified: true } };
    for (let i = 0; i < 5; i++) await guardedCall(base({ db, auth: boss }));
    expect(await code(guardedCall(base({ db, auth: boss })))).toBe('resource-exhausted');
  });
});

describe('giorno', () => {
  it('usa il fuso di Roma', () => {
    expect(dayKey(new Date('2026-10-11T21:30:00Z'))).toBe('2026-10-11');
    expect(dayKey(new Date('2026-10-11T22:30:00Z'))).toBe('2026-10-12');
  });
});
