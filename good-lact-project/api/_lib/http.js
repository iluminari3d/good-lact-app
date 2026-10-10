// Controlli comuni a tutti gli endpoint: metodo, origine, Content-Type,
// chiave configurata, rate limit. Ogni endpoint ha un "bucket" separato
// così uno scanner di etichette non consuma il budget dell'analisi piatti.
import { clientIp, isRateLimited } from './rateLimit.js';

export function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // chiamate same-origin del browser senza header Origin
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowed.includes(origin)) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/**
 * Esegue i controlli comuni. Se uno fallisce risponde già al client e
 * restituisce null; altrimenti restituisce { apiKey, model }.
 */
export function guardRequest(req, res, bucket) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Metodo non consentito.' });
    return null;
  }
  if (!originAllowed(req)) {
    res.status(403).json({ error: 'Origine non autorizzata.' });
    return null;
  }
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    res.status(415).json({ error: 'Content-Type non supportato.' });
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY mancante');
    res.status(500).json({ error: 'Servizio non configurato.' });
    return null;
  }

  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE) || 8;
  if (isRateLimited(`${bucket}:${clientIp(req)}`, limit)) {
    res.status(429).json({ error: 'Troppe richieste. Riprova tra un minuto.' });
    return null;
  }

  return { apiKey, model: process.env.GEMINI_MODEL || 'gemini-flash-latest' };
}

/** Risposta uniforme agli errori del modello: nessun dettaglio upstream al client. */
export function sendUpstreamFailure(res, error, UpstreamError, unavailableMessage) {
  if (error instanceof UpstreamError || error?.name === 'TimeoutError') {
    return res.status(502).json({ error: unavailableMessage });
  }
  return res.status(500).json({ error: 'Errore interno.' });
}
