import { motion } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { confidenceHint, formatGrams, formatPills, pillsLabel } from '../lib/format';
import type { DoseEstimate } from '../types';
import { ConfidenceBadge } from './ui';

interface Props {
  estimate: DoseEstimate;
  onTake: (pills: number) => void;
  onAddMore: () => void;
  onNewMeal: () => void;
}

export function ResultsView({ estimate, onTake, onAddMore, onNewMeal }: Props) {
  const { pillsRecommended, pillsMin, pillsCautious, confidence } = estimate;
  const showCautiousOption = pillsCautious > pillsRecommended;
  const showRange = pillsCautious > pillsMin;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-8"
    >
      <div className="space-y-3">
        <h2 className="text-4xl font-black text-slate-800">La tua dose</h2>
        <ConfidenceBadge confidence={confidence} />
        <p className="text-sm text-slate-400 font-medium">{confidenceHint(confidence)}</p>
      </div>

      <div className="p-8 bg-emerald-50 rounded-[3rem] space-y-2 ring-4 ring-emerald-500/10">
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dose consigliata</p>
        <p className="text-7xl font-black text-emerald-700">{formatPills(pillsRecommended)}</p>
        <p className="text-sm font-bold text-emerald-700">{pillsLabel(pillsRecommended)}</p>
      </div>

      {showRange && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-4 bg-slate-50 rounded-3xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Minima</p>
            <p className="text-2xl font-black text-slate-700">{formatPills(pillsMin)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattosio</p>
            <p className="text-lg font-black text-slate-700">
              {formatGrams(estimate.lactoseMin)}–{formatGrams(estimate.lactoseCautious)} g
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prudente</p>
            <p className="text-2xl font-black text-slate-700">{formatPills(pillsCautious)}</p>
          </div>
        </div>
      )}

      {estimate.mainUncertainties.length > 0 && (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl text-left flex gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            La stima è meno sicura per: <strong>{estimate.mainUncertainties.join(', ')}</strong>.
            Se sai che ci sono o non ci sono, modifica il piatto per un risultato più preciso.
          </p>
        </div>
      )}

      <div className="space-y-4 pt-2">
        <button
          type="button"
          onClick={() => onTake(pillsRecommended)}
          className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-xl hover:bg-emerald-700 transition-all flex flex-col items-center"
        >
          <span className="text-lg">Assumo {formatPills(pillsRecommended)} {pillsLabel(pillsRecommended)}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-80">e avvia la copertura di 40 minuti</span>
        </button>
        {showCautiousOption && (
          <button
            type="button"
            onClick={() => onTake(pillsCautious)}
            className="w-full py-4 bg-white border-2 border-emerald-200 text-emerald-700 font-black rounded-3xl hover:bg-emerald-50 transition-all"
          >
            Preferisco stare tranquillo: {formatPills(pillsCautious)} {pillsLabel(pillsCautious)}
          </button>
        )}
        <div className="flex gap-4">
          <button type="button" onClick={onAddMore} className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-50 flex items-center justify-center gap-2">
            <Plus size={18} /> Modifica pasto
          </button>
          <button type="button" onClick={onNewMeal} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl hover:bg-slate-200">
            Nuovo pasto
          </button>
        </div>
        <p className="text-[11px] text-slate-300 font-medium leading-relaxed px-4">
          Stima indicativa, non è un parere medico. Se hai sintomi importanti o dubbi sulla dose, parlane con il tuo medico o farmacista.
        </p>
      </div>
    </motion.div>
  );
}
