// Logica pura di sincronizzazione: nessun accesso a rete o storage, solo
// l'unione di due versioni degli stessi dati (locale e cloud).
import { BACKUP_KEYS, type BackupKey } from './backup';

export type SyncKey = BackupKey;
export const SYNC_KEYS: readonly SyncKey[] = BACKUP_KEYS;

type Values = Partial<Record<SyncKey, unknown>>;
type Stamps = Partial<Record<SyncKey, number>>;

const MAX_HISTORY_DAYS = 30;
const MAX_SYMPTOMS = 300;

interface WithId { id: string; at?: number }
interface Day { date: string; totalPills?: number; consumptions: WithId[] & { pills?: number }[] }
interface Today { date: string; consumptions: WithId[] }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...b, ...a]) if (item && typeof item.id === 'string') map.set(item.id, item);
  return [...map.values()];
}

const byTimeDesc = <T extends { at?: number }>(list: T[]) =>
  [...list].sort((x, y) => (y.at ?? 0) - (x.at ?? 0));

function mergeLog(localToday: unknown, localHistory: unknown, remoteToday: unknown, remoteHistory: unknown) {
  const days = new Map<string, WithId[]>();
  const add = (date: string, list: unknown[]) => {
    days.set(date, unionById((days.get(date) ?? []) as WithId[], list as WithId[]));
  };
  const todays = [localToday, remoteToday].filter((t): t is Today => !!t && typeof t === 'object' && typeof (t as Today).date === 'string');
  for (const t of todays) add(t.date, asArray(t.consumptions));
  for (const h of [...asArray(localHistory), ...asArray(remoteHistory)] as Day[]) {
    if (h && typeof h.date === 'string') add(h.date, asArray(h.consumptions));
  }
  if (days.size === 0) return { today: undefined, history: undefined };

  const todayDate = todays.length > 0 ? todays.map((t) => t.date).sort().at(-1)! : [...days.keys()].sort().at(-1)!;
  const today = { date: todayDate, consumptions: byTimeDesc(days.get(todayDate) ?? []) };
  const history = [...days.entries()]
    .filter(([date, list]) => date !== todayDate && list.length > 0)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, MAX_HISTORY_DAYS)
    .map(([date, list]) => {
      const consumptions = byTimeDesc(list);
      return {
        date,
        totalPills: consumptions.reduce((acc, c) => acc + (Number((c as { pills?: number }).pills) || 0), 0),
        consumptions,
      };
    });
  return { today, history };
}

export interface MergeInput {
  local: Values;
  /** Quando ogni chiave locale è stata modificata l'ultima volta (0 se mai tracciata). */
  localStamps: Stamps;
  remote: Values;
  remoteStamps: Stamps;
}

export interface MergeResult {
  values: Values;
  /** Chiavi da scrivere in locale perché il cloud aveva qualcosa di nuovo. */
  pullKeys: SyncKey[];
  /** Chiavi da scrivere nel cloud perché il locale aveva qualcosa di nuovo. */
  pushKeys: SyncKey[];
}

/**
 * Regole:
 * - impostazioni ed esperienze: vince la modifica più recente (così le cancellazioni valgono);
 * - diario sintomi, assunzioni di oggi e storico: unione per id, non si perde nulla.
 */
export function mergeAll({ local, localStamps, remote, remoteStamps }: MergeInput): MergeResult {
  const values: Values = {};

  for (const key of ['settings', 'experiences'] as const) {
    const l = local[key];
    const r = remote[key];
    if (r === undefined) values[key] = l;
    else if (l === undefined) values[key] = r;
    else values[key] = (remoteStamps[key] ?? 0) > (localStamps[key] ?? 0) ? r : l;
  }

  const ls = local.symptoms;
  const rs = remote.symptoms;
  if (ls !== undefined || rs !== undefined) {
    const union = unionById(asArray(ls) as WithId[], asArray(rs) as WithId[]);
    values.symptoms = byTimeDesc(union).slice(0, MAX_SYMPTOMS);
  }

  const log = mergeLog(local.today, local.history, remote.today, remote.history);
  if (log.today !== undefined) values.today = log.today;
  if (log.history !== undefined) values.history = log.history;

  const pullKeys: SyncKey[] = [];
  const pushKeys: SyncKey[] = [];
  for (const key of SYNC_KEYS) {
    const merged = values[key];
    if (merged === undefined) continue;
    if (!same(merged, local[key])) pullKeys.push(key);
    if (!same(merged, remote[key])) pushKeys.push(key);
  }
  return { values, pullKeys, pushKeys };
}
