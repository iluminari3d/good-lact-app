// Ridimensiona e ricomprime la foto prima dell'invio: più veloce, più
// economico e sotto il limite di dimensione delle funzioni serverless.

const MAX_SIDE = 1280;
const QUALITY = 0.82;

export interface PreparedImage {
  mimeType: 'image/jpeg';
  /** Base64 puro, senza il prefisso "data:". */
  data: string;
  /** Anteprima da mostrare nell'interfaccia. */
  previewUrl: string;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Il file scelto non è un\'immagine.');
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('Non riesco a leggere questa immagine.');

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Il browser non supporta l\'elaborazione delle immagini.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  return {
    mimeType: 'image/jpeg',
    data: dataUrl.slice(dataUrl.indexOf(',') + 1),
    previewUrl: dataUrl,
  };
}
