import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { formatPills, pillsLabel } from '../lib/format';
import { todayKey } from '../lib/storage';
import type { Consumption, DailyLog } from '../types';
import { BackButton } from './ui';

interface Props {
  history: DailyLog[];
  consumptions: Consumption[];
  dailyPills: number;
  onBack: () => void;
}

export function HistoryView({ history, consumptions, dailyPills, onBack }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = todayKey(date);
    const pills = key === todayKey() ? dailyPills : (history.find((h) => h.date === key)?.totalPills ?? 0);
    return { key, pills, label: date.toLocaleDateString('it-IT', { weekday: 'narrow' }) };
  });
  const max = Math.max(4, ...days.map((d) => d.pills));

  return (
    <motion.div key="history" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
      <BackButton label="Menu" onClick={onBack} />
      <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6 shadow-inner">
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Ultimi 7 giorni</p>
        <div className="flex items-end justify-between h-32 px-2">
          {days.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-2 w-full" title={`${d.pills} ${pillsLabel(d.pills)}`}>
              <div className="w-3 md:w-5 bg-slate-200 rounded-full relative h-24 overflow-hidden">
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.pills / max) * 100}%` }} className="absolute bottom-0 w-full bg-primary" />
              </div>
              <span className="text-xs font-bold text-slate-600">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3"><Calendar size={20} className="text-primary" /> Assunzioni di oggi</h2>
        {consumptions.length === 0 ? (
          <p className="text-center py-10 text-slate-600 font-bold">Nessuna assunzione registrata oggi.</p>
        ) : (
          consumptions.map((c) => (
            <div key={c.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1 flex flex-col min-w-0">
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{c.time}</p>
                <p className="font-bold text-slate-800 leading-tight">{c.foodNames.join(', ')}</p>
              </div>
              <div className="px-5 py-2 bg-primary/10 text-primary rounded-2xl font-black text-sm shrink-0">
                {formatPills(c.pills)} {pillsLabel(c.pills)}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
