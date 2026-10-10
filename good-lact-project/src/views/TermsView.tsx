import { motion } from 'framer-motion';
import { TERMS_SECTIONS, TERMS_UPDATED } from '../data/terms';
import { BackButton } from './ui';

export function TermsText() {
  return (
    <div className="space-y-5 text-sm text-slate-600 font-medium leading-relaxed">
      <p className="text-xs text-slate-400">Ultimo aggiornamento: {TERMS_UPDATED}</p>
      {TERMS_SECTIONS.map((s) => (
        <section key={s.title} className="space-y-2">
          <h3 className="font-black text-slate-800">{s.title}</h3>
          {s.paragraphs.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
    </div>
  );
}

export function TermsView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div key="terms" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-6">
      <BackButton label="Indietro" onClick={onBack} />
      <h2 className="text-3xl font-black text-slate-800">Termini e privacy</h2>
      <TermsText />
    </motion.div>
  );
}
