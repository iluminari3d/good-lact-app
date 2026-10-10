import { LACTOSE_REFERENCE, MAX_OTHER_PER100G } from './_lib/reference.js';
import { parseRequest, sanitizeAnalysis } from './_lib/validate.js';
import { guardRequest, sendUpstreamFailure } from './_lib/http.js';
import { analyzeWithGemini, UpstreamError } from './_lib/gemini.js';

export default async function handler(req, res) {
  const ctx = guardRequest(req, res, 'analyze');
  if (!ctx) return;

  const parsed = parseRequest(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const raw = await analyzeWithGemini(parsed, { apiKey: ctx.apiKey, model: ctx.model });
    const analysis = sanitizeAnalysis(raw, LACTOSE_REFERENCE, MAX_OTHER_PER100G);
    if (!analysis) throw new UpstreamError('analisi non valida');
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('analyze failed', error instanceof Error ? error.message : error);
    return sendUpstreamFailure(
      res,
      error,
      UpstreamError,
      "L'analisi non è disponibile al momento. Riprova o componi il piatto a mano.",
    );
  }
}
