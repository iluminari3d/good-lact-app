import type { Experience, ExperienceVerdict } from '../types';

const MAX_NAME = 60;
export const MAX_EXPERIENCES = 200;

/** Minuscolo, senza accenti né punteggiatura: "Gorgonzola!" e "gorgonzola" coincidono. */
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function cleanExperienceName(value: string): string {
  return value.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

export function isExperience(v: unknown): v is Experience {
  if (!v || typeof v !== 'object') return false;
  const e = v as Experience;
  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' && e.name.length > 0 && e.name.length <= MAX_NAME &&
    (e.verdict === 'ok' || e.verdict === 'bad') &&
    typeof e.createdAt === 'number'
  );
}

/** Aggiunge o aggiorna un'esperienza (un nome ha un solo verdetto). */
export function upsertExperience(list: Experience[], name: string, verdict: ExperienceVerdict, id: string, now: number): Experience[] {
  const clean = cleanExperienceName(name);
  const key = normalizeName(clean);
  if (key.length < 2) return list;
  const rest = list.filter((e) => normalizeName(e.name) !== key);
  return [{ id, name: clean, verdict, createdAt: now }, ...rest].slice(0, MAX_EXPERIENCES);
}

export interface ExperienceMatches {
  bad: string[];
  ok: string[];
}

/**
 * Cerca nei nomi del pasto le esperienze salvate. Il nome del pasto deve
 * CONTENERE quello salvato (es. "pizza al gorgonzola" contiene "gorgonzola"),
 * mai il contrario, per non far scattare avvisi su parole generiche.
 */
export function matchExperiences(names: string[], experiences: Experience[]): ExperienceMatches {
  const candidates = names.map(normalizeName).filter(Boolean);
  const bad = new Set<string>();
  const ok = new Set<string>();
  for (const exp of experiences) {
    const key = normalizeName(exp.name);
    if (key.length < 3) continue;
    const padded = ` ${key} `;
    const hit = candidates.some((c) => ` ${c} `.includes(padded) || (key.length >= 5 && c.includes(key)));
    if (!hit) continue;
    (exp.verdict === 'bad' ? bad : ok).add(exp.name);
  }
  // Se lo stesso nome compare in entrambi (non dovrebbe), vince l'avviso.
  for (const name of bad) ok.delete(name);
  return { bad: [...bad], ok: [...ok] };
}
