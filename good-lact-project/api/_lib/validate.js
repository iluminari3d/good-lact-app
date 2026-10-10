// Validazione e sanificazione di tutto ciò che entra ed esce dall'API.

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_DESCRIPTION = 500;
// ~3 MB di immagine in base64. Vercel accetta body fino a ~4,5 MB.
const MAX_IMAGE_BASE64 = 4_000_000;

// Rimuove caratteri di controllo e spazi in eccesso.
export function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Validazione di un'immagine { mimeType, data } (base64 puro). Condivisa da tutti gli endpoint.
export function parseImage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Immagine non valida.' };
  }
  const { mimeType, data } = value;
  if (!ALLOWED_MIME.has(mimeType)) {
    return { error: 'Formato immagine non supportato (usa JPEG, PNG o WebP).' };
  }
  if (typeof data !== 'string' || data.length === 0) {
    return { error: 'Immagine vuota.' };
  }
  if (data.length > MAX_IMAGE_BASE64) {
    return { error: 'Immagine troppo grande.' };
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    return { error: 'Immagine non valida.' };
  }
  return { image: { mimeType, data } };
}

export function parseRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Richiesta non valida.' };
  }

  const description = cleanText(body.description, MAX_DESCRIPTION);
  let image = null;

  if (body.image != null) {
    const parsedImage = parseImage(body.image);
    if (parsedImage.error) return { error: parsedImage.error };
    image = parsedImage.image;
  }

  if (!description && !image) {
    return { error: 'Descrivi il piatto o scatta una foto.' };
  }
  return { description, image };
}

const CERTAINTY = new Set(['certain', 'probable', 'possible']);

// Il modello è trattato come input non fidato: ogni campo viene
// controllato, limitato e normalizzato prima di arrivare al client.
export function sanitizeAnalysis(raw, reference, maxOther) {
  if (!raw || typeof raw !== 'object') return null;
  const list = Array.isArray(raw.ingredients) ? raw.ingredients.slice(0, 25) : [];

  const ingredients = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const name = cleanText(item.name, 60);
    if (!name) continue;

    const grams = Number(item.grams);
    if (!Number.isFinite(grams) || grams <= 0) continue;

    const categoryKey = typeof item.category === 'string' ? item.category : 'altro';
    let per100g;
    let category;
    if (Object.prototype.hasOwnProperty.call(reference, categoryKey)) {
      per100g = reference[categoryKey].per100g;
      category = categoryKey;
    } else {
      const estimate = Number(item.lactosePer100g);
      per100g = Number.isFinite(estimate)
        ? Math.min(Math.max(estimate, 0), maxOther)
        : 0;
      category = 'altro';
    }

    ingredients.push({
      name,
      grams: Math.round(Math.min(grams, 2000)),
      category,
      lactosePer100g: Math.round(per100g * 100) / 100,
      certainty: CERTAINTY.has(item.certainty) ? item.certainty : 'possible',
      reason: cleanText(item.reason, 140),
    });
  }

  return {
    dishName: cleanText(raw.dishName, 80) || 'Piatto',
    portionNote: cleanText(raw.portionNote, 160),
    ingredients,
  };
}
