import { motion } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { confidenceHint, formatGrams, formatPills, pillsLabel } from '../lib/format';
import type { ExperienceMatches } from '../lib/experiences';
import type { DoseEstimate } from '../types';
import { ConfidenceBadge, CrossContaminationNotice, DataStatusNotice } from './ui';

interface Props {
  estimate: DoseEstimate;
  /** Cibi del pasto che l'utente ha segnato come "fastidio" o "ok". */
  experiences?: ExperienceMatches;
  onTake: (pills: number) => void;
  onAddMore: () => void;
  onNewMeal: () => void;
}

export function ResultsView({ estimate, experiences, onTake, onAddMore, onNewMeal }: Props) {
  const { pillsRecommended, pillsMin, pillsCautious, confidence } = estimate;
  const { severe } = estimate;
  const showCautiousOption = !severe && pillsCautious > pillsRecommended;
  const showRange = !severe && pillsCautious > pillsMin;

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
        <p className="text-sm text-slate-600 font-medium">{confidenceHint(confidence)}</p>
      </div>

      <div className="p-8 bg-emerald-50 rounded-[3rem] space-y-2 ring-4 ring-emerald-500/10">
        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Dose consigliata</p>
        <p className="text-7xl font-black text-emerald-700">{formatPills(pillsRecommended)}</p>
        <p className="text-sm font-bold text-emerald-700">{pillsLabel(pillsRecommended)}</p>
        {severe && (
          <p className="text-xs font-semibold text-emerald-700/70 pt-2">
            Calcolata per intolleranza severa, con margine di sicurezza.
          </p>
        )}
      </div>

      {estimate.doubtMinimum && (
        <p className="text-xs font-semibold text-slate-600 -mt-4">
          Nel dubbio proponiamo la dose minima: ci sono ingredienti incerti con pochissimo lattosio.
        </p>
      )}
      {estimate.minimumApplied && !estimate.doubtMinimum && (
        <p className="text-xs font-semibold text-slate-600 -mt-4">
          Il calcolo darebbe circa il {Math.max(1, Math.round(estimate.pillsRaw * 100))}% di una compressa: mezza
          compressa è la dose minima che proponiamo.
        </p>
      )}

      {showRange && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-4 bg-slate-50 rounded-3xl">
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Minima</p>
            <p className="text-2xl font-black text-slate-700">{formatPills(pillsMin)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl">
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Lattosio</p>
            <p className="text-lg font-black text-slate-700">
              {formatGrams(estimate.lactoseMin)}–{formatGrams(estimate.lactoseCautious)} g
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl">
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Prudente</p>
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

      {experiences && experiences.bad.length > 0 && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-3xl text-left flex gap-3" role="alert">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">
            In passato ti hanno dato fastidio: <strong>{experiences.bad.join(', ')}</strong>. La dose non lo tiene in
            conto: valuta se mangiarli.
          </p>
        </div>
      )}
      {experiences && experiences.ok.length > 0 && (
        <p className="text-xs text-slate-600 font-medium text-left px-2">
          Di solito ti vanno bene: {experiences.ok.join(', ')}. Resta un promemoria: la dose non cambia.
        </p>
      )}

      <CrossContaminationNotice />
      <DataStatusNotice />

      <div className="space-y-4 pt-2">
        <button
          type="button"
          onClick={() => onTake(pillsRecommended)}
          className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-xl hover:bg-emerald-700 transition-all flex flex-col items-center"
        >
          <span className="text-lg">Assumo {formatPills(pillsRecommended)} {pillsLabel(pillsRecommended)}</span>
          <span className="text-xs uppercase tracking-widest opacity-80">e avvia la copertura di 40 minuti</span>
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
          <button type="button" onClick={onNewMeal} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200">
            Nuovo pasto
          </button>
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed px-4">
          Stima indicativa, non è un parere medico. Se hai sintomi importanti o dubbi sulla dose, parlane con il tuo medico o farmacista.
        </p>
      </div>
    </motion.div>
  );
}
