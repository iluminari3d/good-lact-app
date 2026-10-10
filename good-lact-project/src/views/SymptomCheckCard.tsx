import { SEVERITY_LABEL } from '../lib/diary';
import type { Consumption, SymptomSeverity } from '../types';

interface Props {
  consumption: Consumption;
  onAnswer: (severity: SymptomSeverity) => void;
  onSkip: () => void;
}

const OPTIONS: { severity: SymptomSeverity; className: string }[] = [
  { severity: 0, className: 'bg-emerald-600 text-white' },
  { severity: 1, className: 'bg-amber-100 text-amber-800' },
  { severity: 2, className: 'bg-orange-200 text-orange-900' },
  { severity: 3, className: 'bg-red-600 text-white' },
];

export function SymptomCheckCard({ consumption, onAnswer, onSkip }: Props) {
  return (
    <section aria-label="Come stai dopo il pasto" className="p-6 bg-sky-50 border border-sky-100 rounded-[2.5rem] space-y-4 print:hidden">
      <div className="space-y-1">
        <p className="text-sm font-black text-slate-800">Come è andata dopo il pasto delle {consumption.time}?</p>
        <p className="text-xs text-slate-500 font-medium">{consumption.foodNames.join(', ')}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {OPTIONS.map((o) => (
          <button key={o.severity} type="button" onClick={() => onAnswer(o.severity)} className={`py-3 rounded-2xl text-sm font-black ${o.className}`}>
            {SEVERITY_LABEL[o.severity]}
          </button>
        ))}
      </div>
      <button type="button" onClick={onSkip} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary">
        Salta
      </button>
    </section>
  );
}
