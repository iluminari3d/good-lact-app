import { motion } from 'framer-motion';
import { MilkCarton } from '../components/MilkCarton';
import { formatTime } from '../lib/format';
import { BackButton } from './ui';

interface Props {
  timeLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  /** La copertura è finita da poco: si può proporre un'altra compressa. */
  canExtend: boolean;
  onStop: () => void;
  onTakeAnother: () => void;
  onBack: () => void;
}

export function TimerView({ timeLeft, totalSeconds, isRunning, canExtend, onStop, onTakeAnother, onBack }: Props) {
  const level = isRunning ? Math.min(1, Math.max(0, timeLeft / totalSeconds)) : 0;
  const percent = Math.round((1 - level) * 100);

  return (
    <motion.div key="timer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 text-center">
      <div className="text-left"><BackButton label="Menu" onClick={onBack} /></div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-slate-800">{isRunning ? 'Sei protetto' : 'Copertura terminata'}</h2>
        <p className="text-slate-600 font-medium">
          {isRunning
            ? 'La lattasi sta lavorando: il latte scende mentre la copertura si consuma.'
            : "Se il pasto continua, valuta un'altra compressa."}
        </p>
      </div>

      <div
        className="p-8 bg-sky-50 rounded-[3rem] space-y-4"
        role="progressbar"
        aria-label="Copertura trascorsa"
        aria-valuenow={isRunning ? percent : 100}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <MilkCarton level={level} className="mx-auto h-72 w-auto drop-shadow-sm" />
        <p className="text-6xl font-black text-primary tabular-nums" role="timer" aria-live="off">{formatTime(timeLeft)}</p>
      </div>

      {canExtend && (
        <div className="space-y-3">
          <button type="button" onClick={onTakeAnother} className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-lg hover:bg-emerald-700">
            Ho preso un'altra compressa
          </button>
          <p className="text-xs text-slate-600 font-medium">Registra 1 compressa e riavvia i 40 minuti di copertura.</p>
        </div>
      )}
      {isRunning && (
        <button type="button" onClick={onStop} className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200">
          Interrompi la copertura
        </button>
      )}
    </motion.div>
  );
}
