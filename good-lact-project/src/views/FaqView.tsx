import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { FAQ_DATA } from '../data/faq';
import { BackButton } from './ui';

export function FaqView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div key="faq" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <BackButton label="Menu" onClick={onBack} />
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><BookOpen size={28} className="text-primary" /> FAQ e guide</h2>
      <div className="space-y-10 pb-10">
        {FAQ_DATA.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">{cat.category}</h3>
            <div className="space-y-3">
              {cat.items.map((item) => (
                <div key={item.q} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                  <p className="font-bold text-slate-800 mb-3">{item.q}</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
