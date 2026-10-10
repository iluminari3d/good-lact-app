import { guardRequest, sendUpstreamFailure } from './_lib/http.js';
import { UpstreamError } from './_lib/gemini.js';
import { parseLabelRequest, readLabelWithGemini, sanitizeLabel } from './_lib/label.js';

export default async function handler(req, res) {
  const ctx = guardRequest(req, res, 'label');
  if (!ctx) return;

  const parsed = parseLabelRequest(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const raw = await readLabelWithGemini(parsed, { apiKey: ctx.apiKey, model: ctx.model });
    const label = sanitizeLabel(raw);
    if (!label) throw new UpstreamError('etichetta non valida');
    return res.status(200).json(label);
  } catch (error) {
    console.error('label failed', error instanceof Error ? error.message : error);
    return sendUpstreamFailure(
      res,
      error,
      UpstreamError,
      'La lettura dell\'etichetta non è disponibile al momento. Riprova.',
    );
  }
}
