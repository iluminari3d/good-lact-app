import { motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { answered, highDoseSymptoms, SEVERITY_LABEL, sensitivitySuggestion } from '../lib/diary';
import { formatPills, pillsLabel } from '../lib/format';
import type { SymptomEntry, SymptomSeverity } from '../types';
import { BackButton } from './ui';

interface Props {
  entries: SymptomEntry[];
  sensitivity: number;
  onApplySensitivity: (value: number) => void;
  onMarkBad: (foodName: string) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}

const TONE: Record<SymptomSeverity, string> = {
  0: 'bg-emerald-50 text-emerald-700',
  1: 'bg-amber-50 text-amber-700',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-red-100 text-red-700',
};

export function DiaryView({ entries, sensitivity, onApplySensitivity, onMarkBad, onRemove, onBack }: Props) {
  const list = answered(entries);
  const suggestion = sensitivitySuggestion(entries, sensitivity);
  const highDose = highDoseSymptoms(entries);

  return (
    <motion.div key="diary" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
      <BackButton label="Menu" onClick={onBack} />
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">Diario sintomi</h2>
        <p className="text-sm text-slate-600 font-medium">
          Circa un'ora e mezza dopo ogni assunzione ti chiedo come stai. Con qualche pasto registrato si vedono gli andamenti.
        </p>
      </div>

      {suggestion && (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2.5rem] space-y-4">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 font-medium">{suggestion.reason}</p>
          </div>
          <button type="button" onClick={() => onApplySensitivity(suggestion.suggested)} className="w-full py-3 bg-amber-600 text-white font-black rounded-2xl">
            Porta la sensibilità a {suggestion.suggested.toFixed(1).replace('.', ',')}x
          </button>
        </div>
      )}

      {highDose && (
        <div className="p-6 bg-slate-50 rounded-[2.5rem]">
          <p className="text-sm text-slate-600 font-medium">
            Hai avuto sintomi anche con 2 o più compresse. In questi casi può contare più la contaminazione da tracce di latte
            (o un'altra causa) che la dose: ne vale la pena parlare con il medico, portando il report.
          </p>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-center py-10 text-slate-600 font-bold">Nessuna risposta registrata.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((e) => (
            <li key={e.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    {new Date(e.at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="font-bold text-slate-800 leading-tight">{e.foodNames.join(', ') || 'Pasto'}</p>
                  <p className="text-xs text-slate-600 font-medium">{formatPills(e.pills)} {pillsLabel(e.pills)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${TONE[e.severity]}`}>{SEVERITY_LABEL[e.severity]}</span>
              </div>
              {e.severity >= 2 && e.foodNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {e.foodNames.map((n) => (
                    <button key={n} type="button" onClick={() => onMarkBad(n)} className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-black border border-red-200">
                      Segna "{n}" come fastidio
                    </button>
                  ))}
                </div>
              )}
              <button type="button" aria-label="Elimina voce" onClick={() => onRemove(e.id)} className="text-slate-600 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
