import { ChevronLeft } from 'lucide-react';
import { cn } from '../lib/cn';
import type { Certainty, Confidence } from '../types';

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all text-xs font-black uppercase tracking-widest"
    >
      <ChevronLeft size={16} /> {label}
    </button>
  );
}

const CERTAINTY_STYLE: Record<Certainty, { label: string; className: string }> = {
  certain: { label: 'Certo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  probable: { label: 'Probabile', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  possible: { label: 'Possibile', className: 'bg-slate-50 text-slate-500 border-slate-200' },
};

export function CertaintyBadge({ certainty }: { certainty: Certainty }) {
  const style = CERTAINTY_STYLE[certainty];
  return (
    <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider', style.className)}>
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

