import { isExperience } from './experiences';
import { isSymptomEntry } from './diary';
import { load, save } from './storage';

export const BACKUP_KEYS = ['settings', 'today', 'history', 'experiences', 'symptoms'] as const;
export type BackupKey = (typeof BACKUP_KEYS)[number];

const MAX_BACKUP_CHARS = 2_000_000;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const VALIDATORS: Record<BackupKey, (v: unknown) => boolean> = {
  settings: (v) => isObject(v) && typeof v.sensitivity === 'number' && v.sensitivity >= 0.5 && v.sensitivity <= 2 && typeof v.lactaseKey === 'string',
  today: (v) => isObject(v) && typeof v.date === 'string' && Array.isArray(v.consumptions),
  history: (v) => Array.isArray(v) && v.every((d) => isObject(d) && typeof d.date === 'string' && Array.isArray(d.consumptions)),
  experiences: (v) => Array.isArray(v) && v.every(isExperience),
  symptoms: (v) => Array.isArray(v) && v.every(isSymptomEntry),
};

/** True se il valore ha la forma attesa per quella chiave (usato anche per i dati arrivati dal cloud). */
export function isValidValue(key: BackupKey, value: unknown): boolean {
  return VALIDATORS[key](value);
}

export interface Backup {
  app: 'good-lact';
  version: 1;
  exportedAt: string;
  data: Partial<Record<BackupKey, unknown>>;
}

export function createBackup(now: Date = new Date()): Backup {
  const data: Backup['data'] = {};
  for (const key of BACKUP_KEYS) {
    const value = load<unknown>(key, undefined);
    if (value !== undefined) data[key] = value;
  }
  return { app: 'good-lact', version: 1, exportedAt: now.toISOString(), data };
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; error: string };

/** Il file importato è input non fidato: solo chiavi note, ognuna con la sua forma. */
export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_BACKUP_CHARS) return { ok: false, error: 'Il file è troppo grande.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Il file non è un backup valido.' };
  }
  if (!isObject(raw) || raw.app !== 'good-lact' || raw.version !== 1 || !isObject(raw.data)) {
    return { ok: false, error: 'Questo non sembra un backup di Good Lact.' };
  }
  const data: Backup['data'] = {};
  for (const key of BACKUP_KEYS) {
    const value = raw.data[key];
    if (value === undefined) continue;
    if (!VALIDATORS[key](value)) return { ok: false, error: `Il backup contiene dati non validi (${key}).` };
    data[key] = value;
  }
  if (Object.keys(data).length === 0) return { ok: false, error: 'Il backup è vuoto.' };
  return { ok: true, backup: { app: 'good-lact', version: 1, exportedAt: String(raw.exportedAt ?? ''), data } };
}

export function applyBackup(backup: Backup): void {
  for (const key of BACKUP_KEYS) {
    if (backup.data[key] !== undefined) save(key, backup.data[key]);
  }
}
