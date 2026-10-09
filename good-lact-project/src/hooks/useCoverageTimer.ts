import { useCallback, useEffect, useState } from 'react';
import { load, remove, save } from '../lib/storage';

export const COVERAGE_MINUTES = 40;

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

  useEffect(() => {
    if (expiry == null) return;
    const tick = () => {
      const t = Date.now();
      if (t < expiry) {
        setNow(t);
        return;
      }
      setExpiry(null);
      if (notify && notificationsSupported() && Notification.permission === 'granted') {
        new Notification('Good Lact', {
          body: 'La copertura è terminata.',
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

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setExpiry(t + COVERAGE_MINUTES * 60 * 1000);
  }, []);

  const stop = useCallback(() => setExpiry(null), []);

  return { timeLeft, isRunning, start, stop, totalSeconds: COVERAGE_MINUTES * 60 };
}
