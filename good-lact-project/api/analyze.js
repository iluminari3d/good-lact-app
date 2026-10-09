import { LACTOSE_REFERENCE, MAX_OTHER_PER100G } from './_lib/reference.js';
import { parseRequest, sanitizeAnalysis } from './_lib/validate.js';
import { clientIp, isRateLimited } from './_lib/rateLimit.js';
import { analyzeWithGemini, UpstreamError } from './_lib/gemini.js';

function originAllowed(req) {
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non consentito.' });
  }
  if (!originAllowed(req)) {
    return res.status(403).json({ error: 'Origine non autorizzata.' });
  }
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type non supportato.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY mancante');
    return res.status(500).json({ error: 'Servizio non configurato.' });
  }

  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE) || 8;
  if (isRateLimited(clientIp(req), limit)) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra un minuto.' });
  }

  const parsed = parseRequest(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const raw = await analyzeWithGemini(parsed, {
      apiKey,
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    });
    const analysis = sanitizeAnalysis(raw, LACTOSE_REFERENCE, MAX_OTHER_PER100G);
    if (!analysis) throw new UpstreamError('analisi non valida');
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('analyze failed', error instanceof Error ? error.message : error);
    if (error instanceof UpstreamError || error?.name === 'TimeoutError') {
      return res.status(502).json({ error: "L'analisi non è disponibile al momento. Riprova o componi il piatto a mano." });
    }
    return res.status(500).json({ error: 'Errore interno.' });
  }
}
