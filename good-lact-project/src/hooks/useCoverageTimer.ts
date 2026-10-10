import { useCallback, useEffect, useState } from 'react';
import { load, remove, save } from '../lib/storage';

export const COVERAGE_MINUTES = 40;
/** Dopo la fine della copertura, per quanto tempo proponiamo "un'altra compressa". */
export const EXTEND_WINDOW_MS = 45 * 60 * 1000;

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function useCoverageTimer(notify: boolean) {
  const [expiry, setExpiry] = useState<number | null>(() => {
    const saved = load<number | null>('timer', null, (v): v is number | null => v === null || isNumber(v));
    return saved && saved > Date.now() ? saved : null;
  });
  const [now, setNow] = useState(() => Date.now());
  // Fine dell'ultima copertura: serve a proporre una seconda compressa se il pasto continua.
  const [endedAt, setEndedAt] = useState<number | null>(() => {
    const saved = load<number | null>('timer_end', null, (v): v is number | null => v === null || isNumber(v));
    return saved && Date.now() - saved < EXTEND_WINDOW_MS ? saved : null;
  });

  useEffect(() => {
    if (expiry == null) return;
    const tick = () => {
      const t = Date.now();
      if (t < expiry) {
        setNow(t);
        return;
      }
      setExpiry(null);
      setEndedAt(expiry);
      if (notify && notificationsSupported() && Notification.permission === 'granted') {
        new Notification('Good Lact', {
          body: "La copertura è terminata. Se stai ancora mangiando, valuta un'altra compressa.",
          icon: '/Good Lact Pittogramma.svg',
        });
      }
    };
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiry, notify]);

  const timeLeft = expiry == null ? 0 : Math.max(0, Math.ceil((expiry - now) / 1000));
  const isRunning = expiry != null && timeLeft > 0;

  useEffect(() => {
    if (expiry == null) remove('timer');
    else save('timer', expiry);
  }, [expiry]);

  useEffect(() => {
    if (endedAt == null) {
      remove('timer_end');
      return;
    }
    save('timer_end', endedAt);
    const id = window.setTimeout(() => setEndedAt(null), Math.max(0, EXTEND_WINDOW_MS - (Date.now() - endedAt)));
    return () => window.clearTimeout(id);
  }, [endedAt]);

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setEndedAt(null);
    setExpiry(t + COVERAGE_MINUTES * 60 * 1000);
  }, []);

  const stop = useCallback(() => {
    setExpiry(null);
    setEndedAt(null);
  }, []);

  return {
    timeLeft,
    isRunning,
    /** True se la copertura è finita da poco: ha senso chiedere se serve un'altra compressa. */
    canExtend: !isRunning && endedAt != null,
    start,
    stop,
    totalSeconds: COVERAGE_MINUTES * 60,
  };
}
