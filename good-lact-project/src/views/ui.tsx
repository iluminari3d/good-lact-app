import { AlertTriangle, ChevronLeft, Info } from 'lucide-react';
import { REFERENCE_DATA_VERIFIED } from '../data/meta';
import { cn } from '../lib/cn';
import type { Certainty, Confidence } from '../types';

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-slate-600 hover:text-primary transition-all text-xs font-black uppercase tracking-widest"
    >
      <ChevronLeft size={16} /> {label}
    </button>
  );
}

const CERTAINTY_STYLE: Record<Certainty, { label: string; className: string }> = {
  certain: { label: 'Certo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  probable: { label: 'Probabile', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  possible: { label: 'Possibile', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export function CertaintyBadge({ certainty }: { certainty: Certainty }) {
  const style = CERTAINTY_STYLE[certainty];
  return (
    <span className={cn('px-2 py-0.5 rounded-full border text-xs font-black uppercase tracking-wider', style.className)}>
      {style.label}
    </span>
  );
}

const CONFIDENCE_STYLE: Record<Confidence, { label: string; className: string }> = {
  high: {
    label: 'Confidenza alta',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  medium: {
    label: 'Confidenza media',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  low: {
    label: 'Confidenza bassa',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const style = CONFIDENCE_STYLE[confidence];
  return (
    <span className={cn('inline-block px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider', style.className)}>
      {style.label}
    </span>
  );
}


/** La lattasi scompone il lattosio ma non protegge dalle tracce di latte per contaminazione. */
export function CrossContaminationNotice() {
  return (
    <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl text-left flex gap-3">
      <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 font-medium">
        <strong>Contaminazione:</strong> l'app non può sapere se il piatto è stato a contatto con latte
        (padelle, friggitrici, affettatrici o taglieri in comune). Se reagisci anche alle tracce, chiedi a chi
        lo prepara.
      </p>
    </div>
  );
}

/** Finché i valori non vengono verificati su fonti ufficiali l'app lo dice apertamente. */
export function DataStatusNotice() {
  if (REFERENCE_DATA_VERIFIED) return null;
  return (
    <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl text-left flex gap-3">
      <Info size={20} className="text-slate-600 shrink-0 mt-0.5" />
      <p className="text-sm text-slate-600 font-medium">
        I valori di lattosio sono <strong>indicativi</strong>: non sono ancora verificati su fonti ufficiali.
        Anche il rapporto tra lattasi e lattosio è una <strong>stima prudenziale</strong> (1.000 FCC per grammo; le
        fonti vanno da circa 200 a 1.500 e nessuna è uno studio clinico). Per questo il calcolo applica margini di
        sicurezza più ampi. Dettagli nelle FAQ.
      </p>
    </div>
  );
}
