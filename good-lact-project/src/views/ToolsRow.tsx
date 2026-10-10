import { FileText, NotebookPen, ScanLine, ThumbsUp, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';

export type ToolView = 'label' | 'restaurant' | 'diary' | 'experiences' | 'report';

const TOOLS: { view: ToolView; label: string; icon: ReactNode }[] = [
  { view: 'label', label: 'Etichetta', icon: <ScanLine size={22} /> },
  { view: 'restaurant', label: 'Ristorante', icon: <UtensilsCrossed size={22} /> },
  { view: 'diary', label: 'Diario', icon: <NotebookPen size={22} /> },
  { view: 'experiences', label: 'Esperienze', icon: <ThumbsUp size={22} /> },
  { view: 'report', label: 'Report', icon: <FileText size={22} /> },
];

export function ToolsRow({ onOpen }: { onOpen: (view: ToolView) => void }) {
  return (
    <nav aria-label="Strumenti" className="grid grid-cols-5 gap-2 print:hidden">
      {TOOLS.map((t) => (
        <button key={t.view} type="button" onClick={() => onOpen(t.view)} className="flex flex-col items-center gap-2 py-4 bg-slate-50 rounded-3xl text-slate-500 hover:bg-primary/10 hover:text-primary transition-all">
          {t.icon}
          <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
