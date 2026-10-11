// Tetto giornaliero di richieste con AI per utente, conservato in Firestore
// (collezione "usage", un documento per utente e per giorno). Le regole di
// Firestore chiudono questa collezione ai client: la scrivono solo le funzioni.

export const TIME_ZONE = 'Europe/Rome';

/** Giorno corrente (AAAA-MM-GG) nel fuso italiano: il contatore riparte a mezzanotte di Roma. */
export function dayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function parseEmailList(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Tetto giornaliero per questo utente. L'uso illimitato vale solo per email
 * presenti nell'elenco E verificate da Firebase Auth (un indirizzo scritto
 * a mano e non verificato non basta).
 */
export function limitFor(token, { freeLimit, unlimitedCap, unlimited }) {
  const email = typeof token?.email === 'string' ? token.email.toLowerCase() : '';
  if (token?.email_verified === true && email && unlimited.has(email)) {
    return { limit: unlimitedCap, unlimited: true };
  }
  return { limit: freeLimit, unlimited: false };
}

const refFor = (db, uid, day) => db.collection('usage').doc(`${uid}_${day}`);

/** Prenota una richiesta. Restituisce { ok, used }. Atomico: due richieste insieme non superano il tetto. */
export function reserve(db, uid, day, limit, now = new Date()) {
  const ref = refFor(db, uid, day);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = snap.exists ? Number(snap.data().count) || 0 : 0;
    if (used >= limit) return { ok: false, used };
    tx.set(ref, {
      uid,
      day,
      count: used + 1,
      updatedAt: now.getTime(),
      // Per chi vuole attivare in Firestore la cancellazione automatica (criterio TTL su "expireAt").
      expireAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
    return { ok: true, used: used + 1 };
  });
}

/** Restituisce una richiesta prenotata (usata quando il servizio AI fallisce: non è colpa dell'utente). */
export function release(db, uid, day) {
  const ref = refFor(db, uid, day);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const used = Number(snap.data().count) || 0;
    tx.set(ref, { ...snap.data(), count: Math.max(0, used - 1) });
  });
}
