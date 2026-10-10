// Collega lo storage locale al cloud usando la logica pura di lib/sync.ts.
import { isValidValue } from '../lib/backup';
import { mergeAll, SYNC_KEYS, type SyncKey } from '../lib/sync';
import { load, save, saveSilently } from '../lib/storage';
import type { RemoteDoc } from './firebaseClient';

export interface RemoteApi {
  readRemote: (uid: string) => Promise<Record<string, RemoteDoc>>;
  writeRemote: (uid: string, key: string, value: RemoteDoc) => Promise<void>;
}

/** Ultimo contenuto noto per chiave e quando è stato modificato: serve a capire cosa è cambiato davvero. */
type Meta = Partial<Record<SyncKey, { at: number; json: string }>>;

const META_KEY = 'sync_meta';
const isMeta = (v: unknown): v is Meta => !!v && typeof v === 'object' && !Array.isArray(v);

const currentJson = (key: SyncKey): string | undefined => {
  const value = load<unknown>(key, undefined);
  return value === undefined ? undefined : JSON.stringify(value);
};

/** Da chiamare a ogni salvataggio locale (se l'account è attivo): registra l'istante della modifica. */
export function noteLocalChange(key: string, now: number = Date.now()): void {
  if (!(SYNC_KEYS as readonly string[]).includes(key)) return;
  const k = key as SyncKey;
  const json = currentJson(k);
  if (json === undefined) return;
  const meta = load<Meta>(META_KEY, {}, isMeta);
  if (meta[k]?.json === json) return;
  save(META_KEY, { ...meta, [k]: { at: now, json } });
}

export interface SyncOutcome {
  /** True se arrivati dati nuovi dal cloud: la schermata va ricaricata dallo storage. */
  localChanged: boolean;
  syncedAt: number;
}

export async function syncNow(uid: string, api: RemoteApi, now: number = Date.now()): Promise<SyncOutcome> {
  const remoteDocs = await api.readRemote(uid);
  const meta = load<Meta>(META_KEY, {}, isMeta);

  const local: Partial<Record<SyncKey, unknown>> = {};
  const localStamps: Partial<Record<SyncKey, number>> = {};
  const remote: Partial<Record<SyncKey, unknown>> = {};
  const remoteStamps: Partial<Record<SyncKey, number>> = {};

  for (const key of SYNC_KEYS) {
    const value = load<unknown>(key, undefined);
    if (value !== undefined) local[key] = value;
    localStamps[key] = meta[key]?.at ?? 0;

    const doc = remoteDocs[key];
    if (!doc) continue;
    try {
      const parsed: unknown = JSON.parse(doc.json);
      // Dati cloud non validi vengono ignorati: non devono mai rompere l'app.
      if (isValidValue(key, parsed)) {
        remote[key] = parsed;
        remoteStamps[key] = doc.updatedAt;
      }
    } catch {
      /* documento corrotto: ignorato */
    }
  }

  const { values, pullKeys, pushKeys } = mergeAll({ local, localStamps, remote, remoteStamps });

  for (const key of pullKeys) saveSilently(key, values[key]);
  for (const key of pushKeys) {
    await api.writeRemote(uid, key, { json: JSON.stringify(values[key]), updatedAt: now });
  }

  const nextMeta: Meta = {};
  for (const key of SYNC_KEYS) {
    const json = values[key] === undefined ? undefined : JSON.stringify(values[key]);
    if (json === undefined) continue;
    nextMeta[key] = { at: pushKeys.includes(key) ? now : (remoteStamps[key] ?? meta[key]?.at ?? now), json };
  }
  saveSilently(META_KEY, nextMeta);

  return { localChanged: pullKeys.length > 0, syncedAt: now };
}

export function clearSyncMeta(): void {
  saveSilently(META_KEY, {});
}
