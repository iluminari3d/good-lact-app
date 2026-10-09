import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Consumption, DailyLog } from '../types';
import { load, newId, save, todayKey } from '../lib/storage';

interface Today {
  date: string;
  consumptions: Consumption[];
}

interface LogData {
  today: Today;
  history: DailyLog[];
}

const MAX_HISTORY_DAYS = 30;
const DAY_CHECK_MS = 30_000;

const isToday = (v: unknown): v is Today =>
  !!v && typeof v === 'object' && typeof (v as Today).date === 'string' && Array.isArray((v as Today).consumptions);
const isHistory = (v: unknown): v is DailyLog[] => Array.isArray(v);

const sumPills = (list: Consumption[]) => list.reduce((acc, c) => acc + c.pills, 0);

/** Se è cambiato il giorno archivia quello vecchio e riparte da zero. */
function rollover(data: LogData): LogData {
  const key = todayKey();
  if (data.today.date === key) return data;
  const { date, consumptions } = data.today;
  const history =
    consumptions.length > 0
      ? [{ date, totalPills: sumPills(consumptions), consumptions }, ...data.history.filter((h) => h.date !== date)].slice(0, MAX_HISTORY_DAYS)
      : data.history;
  return { today: { date: key, consumptions: [] }, history };
}

export function useDailyLog() {
  const [data, setData] = useState<LogData>(() =>
    rollover({
      today: load<Today>('today', { date: todayKey(), consumptions: [] }, isToday),
      history: load<DailyLog[]>('history', [], isHistory),
    }),
  );

  // Controlla il cambio di giorno anche con l'app lasciata aperta.
  useEffect(() => {
    const check = () => setData((prev) => rollover(prev));
    const id = window.setInterval(check, DAY_CHECK_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  useEffect(() => save('today', data.today), [data.today]);
  useEffect(() => save('history', data.history), [data.history]);

  const addConsumption = useCallback((pills: number, foodNames: string[]) => {
    const entry: Consumption = {
      id: newId(),
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      pills,
      foodNames,
    };
    setData((prev) => {
      const current = rollover(prev);
      return { ...current, today: { ...current.today, consumptions: [entry, ...current.today.consumptions] } };
    });
  }, []);

  const dailyPills = useMemo(() => sumPills(data.today.consumptions), [data.today.consumptions]);

  return { consumptions: data.today.consumptions, dailyPills, history: data.history, addConsumption };
}
