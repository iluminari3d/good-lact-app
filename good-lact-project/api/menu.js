import { guardRequest, sendUpstreamFailure } from './_lib/http.js';
import { UpstreamError } from './_lib/gemini.js';
import { parseMenuRequest, readMenuWithGemini, sanitizeMenu } from './_lib/menu.js';

export default async function handler(req, res) {
  const ctx = guardRequest(req, res, 'menu');
  if (!ctx) return;

  const parsed = parseMenuRequest(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const raw = await readMenuWithGemini(parsed, { apiKey: ctx.apiKey, model: ctx.model });
    const menu = sanitizeMenu(raw);
    if (!menu) throw new UpstreamError('menu non valido');
    return res.status(200).json(menu);
  } catch (error) {
    console.error('menu failed', error instanceof Error ? error.message : error);
    return sendUpstreamFailure(
      res,
      error,
      UpstreamError,
      'La lettura del menu non è disponibile al momento. Riprova.',
    );
  }
}
