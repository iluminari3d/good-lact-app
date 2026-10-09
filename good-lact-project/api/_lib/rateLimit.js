// Limite di richieste per IP, finestra scorrevole di 1 minuto.
// ATTENZIONE: è in memoria, quindi vale per singola istanza serverless.
// Basta contro abusi banali; per limiti rigidi (quote giornaliere,
// piano Premium) servirà un archivio condiviso (es. Upstash Redis).

const WINDOW_MS = 60_000;
const hits = new Map();

export function isRateLimited(ip, limit) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);

  // Pulizia occasionale per non far crescere la mappa.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return first || req.socket?.remoteAddress || 'unknown';
}
