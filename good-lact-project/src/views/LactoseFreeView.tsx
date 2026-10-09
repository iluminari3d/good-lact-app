import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export function LactoseFreeView({ onNewMeal, onEdit }: { onNewMeal: () => void; onEdit: () => void }) {
  return (
    <motion.div key="lactose-free" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center space-y-8">
      <div className="p-10 bg-emerald-50 rounded-[3rem] space-y-4 ring-4 ring-emerald-500/10">
        <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
        <h2 className="text-3xl font-black text-emerald-700">Nessuna lattasi necessaria</h2>
        <p className="text-sm text-emerald-700/80 font-medium">
          In questo pasto non risulta lattosio, oppure solo tracce trascurabili.
        </p>
      </div>
      <p className="text-[11px] text-slate-300 font-medium leading-relaxed px-4">
        Se nel piatto ci sono ingredienti che non conosci (salse, impasti, condimenti pronti), controlla l'etichetta o chiedi a chi l'ha preparato.
      </p>
      <div className="flex gap-4">
        <button type="button" onClick={onEdit} className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-50">Modifica pasto</button>
        <button type="button" onClick={onNewMeal} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl hover:bg-slate-200">Nuovo pasto</button>
      </div>
    </motion.div>
  );
}
