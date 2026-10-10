import { motion } from 'framer-motion';
import { ChevronRight, FileText, HelpCircle, History, Settings, ShieldCheck, ThumbsUp } from 'lucide-react';
import { InstallButton } from '../components/InstallButton';
import type { ReactNode } from 'react';
import type { NavView } from './navigation';

const ITEMS: { view: NavView; label: string; hint: string; icon: ReactNode }[] = [
  { view: 'experiences', label: 'Le mie esperienze', hint: 'Cosa ti va bene e cosa ti dà fastidio', icon: <ThumbsUp size={22} /> },
  { view: 'report', label: 'Report medico', hint: 'Ultimi 30 giorni, da stampare o salvare in PDF', icon: <FileText size={22} /> },
  { view: 'history', label: 'Storico', hint: 'Compresse prese oggi e negli ultimi giorni', icon: <History size={22} /> },
  { view: 'settings', label: 'Profilo e account', hint: 'Lattasi, sensibilità, sincronizzazione, backup', icon: <Settings size={22} /> },
  { view: 'faq', label: 'FAQ e guide', hint: 'Etichette, farmaci, mangiare fuori', icon: <HelpCircle size={22} /> },
  { view: 'terms', label: 'Termini e privacy', hint: 'Come usiamo i tuoi dati', icon: <ShieldCheck size={22} /> },
];

export function MoreView({ onOpen }: { onOpen: (view: NavView) => void }) {
  return (
    <motion.div key="more" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800">Altro</h2>
      <ul className="space-y-3">
        {ITEMS.map((i) => (
          <li key={i.view}>
            <button type="button" onClick={() => onOpen(i.view)} className="w-full p-5 bg-slate-50 hover:bg-primary/10 rounded-[2rem] flex items-center gap-4 text-left transition-colors">
              <span className="text-primary shrink-0">{i.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-800">{i.label}</span>
                <span className="block text-xs text-slate-400 font-medium">{i.hint}</span>
              </span>
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
      <InstallButton />
    </motion.div>
  );
}
