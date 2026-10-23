import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { cleanExperienceName } from '../lib/experiences';
import type { Experience, ExperienceVerdict } from '../types';
import { BackButton } from './ui';

interface Props {
  experiences: Experience[];
  onAdd: (name: string, verdict: ExperienceVerdict) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}

function Group({ title, tone, items, onRemove }: { title: string; tone: string; items: Experience[]; onRemove: (id: string) => void }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600 font-medium">Ancora niente.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((e) => (
            <li key={e.id} className={`pl-4 pr-2 py-2 rounded-full border text-sm font-bold flex items-center gap-1 ${tone}`}>
              {e.name}
              <button type="button" aria-label={`Rimuovi ${e.name}`} onClick={() => onRemove(e.id)} className="p-1 rounded-full hover:bg-black/5">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ExperiencesView({ experiences, onAdd, onRemove, onBack }: Props) {
  const [name, setName] = useState('');
  const clean = cleanExperienceName(name);
  const add = (verdict: ExperienceVerdict) => {
    if (clean.length < 2) return;
    onAdd(clean, verdict);
    setName('');
  };

  return (
    <motion.div key="experiences" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
      <BackButton label="Menu" onClick={onBack} />
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">Le mie esperienze</h2>
        <p className="text-sm text-slate-600 font-medium">
          Segna cosa ti va bene e cosa ti dà fastidio. Quando un piatto contiene qualcosa che hai segnato,
          lo vedrai nel risultato. La dose non viene abbassata in automatico: decidi sempre tu.
        </p>
      </div>

      <div className="p-6 bg-slate-50 rounded-[2.5rem] space-y-4">
        <label htmlFor="exp-name" className="text-xs font-black text-slate-600 uppercase tracking-widest">Alimento o ingrediente</label>
        <input
          id="exp-name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add('ok'); }}
          placeholder="es. gorgonzola, salsa burger, fette biscottate"
          className="w-full p-4 bg-white border-2 border-transparent focus:border-primary/50 rounded-2xl outline-none font-semibold text-slate-700"
        />
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => add('ok')} disabled={clean.length < 2} className="py-4 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40">
            <ThumbsUp size={18} /> Mi va bene
          </button>
          <button type="button" onClick={() => add('bad')} disabled={clean.length < 2} className="py-4 rounded-2xl bg-red-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-40">
            <ThumbsDown size={18} /> Mi dà fastidio
          </button>
        </div>
      </div>

      <Group title="Mi dà fastidio" tone="bg-red-50 text-red-700 border-red-200" items={experiences.filter((e) => e.verdict === 'bad')} onRemove={onRemove} />
      <Group title="Mi va bene" tone="bg-emerald-50 text-emerald-700 border-emerald-200" items={experiences.filter((e) => e.verdict === 'ok')} onRemove={onRemove} />
      <p className="text-xs text-slate-600 font-medium">
        Restano sul tuo dispositivo. "Mi va bene" è solo un promemoria: contaminazioni e ricette diverse possono cambiare l'esito.
      </p>
    </motion.div>
  );
}
