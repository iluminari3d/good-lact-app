import { useEffect, useState } from 'react';

/** Avviso quando manca la connessione. */
export function OfflineBar() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[60] bg-amber-100 text-amber-900 px-3 py-1.5 text-center text-xs font-bold print:hidden">
      Sei offline: il calcolo con gli alimenti, il timer e il diario funzionano. Analisi AI, etichette e menu richiedono la connessione.
    </div>
  );
}
