// Accesso sicuro a localStorage: dati corrotti o storage bloccato
// (navigazione privata, iframe di terze parti) non devono mai rompere l'app.

const PREFIX = 'goodlact_';

export function load<T>(key: string, fallback: T, isValid?: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** Evento emesso a ogni salvataggio: la sincronizzazione lo usa per accorgersi delle modifiche. */
export const SAVE_EVENT = 'goodlact:save';

/** Scrive senza emettere l'evento (usato quando i dati arrivano dal cloud). */
export function saveSilently(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota piena o storage non disponibile: si continua senza salvare */
  }
}

export function save(key: string, value: unknown): void {
  saveSilently(key, value);
  try {
    window.dispatchEvent(new CustomEvent(SAVE_EVENT, { detail: { key } }));
  } catch {
    /* ambiente senza eventi: nessun problema */
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignorato */
  }
}

/** Cancella tutti i dati dell'app da questo dispositivo (impostazioni, storico, diario...). */
export function clearAll(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignorato */
  }
}

/** Data locale in formato AAAA-MM-GG, indipendente dalla lingua del browser. */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
