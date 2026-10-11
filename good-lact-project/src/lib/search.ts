/**
 * Ricerca per l'app: ignora maiuscole, accenti e punteggiatura, accetta più parole
 * (tutte devono comparire), tollera il plurale/singolare ("gelati" trova "gelato")
 * e mette in cima i risultati che iniziano con quello che scrivi.
 */
export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** "gelati" -> "gelat", "ricotta" -> "ricott": confronta la radice, non la desinenza. */
const stem = (token: string): string => (token.length >= 4 ? token.replace(/[aeiou]$/, '') : token);

/** 0 = nessuna corrispondenza; più alto = più pertinente. */
export function scoreMatch(query: string, name: string, extra = ''): number {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;
  const n = normalize(name);
  const words = n.split(' ');
  const hay = `${n} ${normalize(extra)}`;
  const hayWords = hay.split(' ');
  let score = 0;
  for (const raw of tokens) {
    const t = stem(raw);
    if (words.some((w) => w.startsWith(t))) score += 30; // parola del nome che inizia così
    else if (n.includes(t)) score += 15; // dentro una parola del nome
    else if (hayWords.some((w) => w.startsWith(t))) score += 8; // solo nella categoria o nei dettagli
    else return 0; // ogni parola cercata deve comparire
  }
  const whole = normalize(query);
  if (n === whole) score += 100;
  else if (n.startsWith(whole)) score += 60;
  else if (words[0]?.startsWith(stem(tokens[0]))) score += 20;
  return score - Math.min(n.length, 80) / 100; // a parità, il nome più corto
}

export function searchItems<T>(
  items: readonly T[],
  query: string,
  getName: (item: T) => string,
  getExtra: (item: T) => string = () => '',
  limit = 30,
): T[] {
  if (!normalize(query)) return [];
  return items
    .map((item) => ({ item, score: scoreMatch(query, getName(item), getExtra(item)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}
