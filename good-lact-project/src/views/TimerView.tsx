import { motion } from 'framer-motion';
import { formatTime } from '../lib/format';
import { BackButton } from './ui';

interface Props {
  timeLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  onStop: () => void;
  onBack: () => void;
}

export function TimerView({ timeLeft, totalSeconds, isRunning, onStop, onBack }: Props) {
  const progress = isRunning ? Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100) : 100;
  return (
    <motion.div key="timer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 text-center">
      <div className="text-left"><BackButton label="Menu" onClick={onBack} /></div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-slate-800">{isRunning ? 'Sei protetto' : 'Copertura terminata'}</h2>
        <p className="text-slate-400 font-medium">
          {isRunning ? 'La lattasi sta lavorando: goditi il pasto.' : 'Se il pasto continua, valuta un\'altra compressa.'}
        </p>
      </div>
      <div className="p-10 bg-emerald-50 rounded-[3rem] space-y-6">
        <p className="text-7xl font-black text-emerald-700 tabular-nums" role="timer" aria-live="off">{formatTime(timeLeft)}</p>
        <div className="h-3 bg-emerald-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {isRunning && (
        <button type="button" onClick={onStop} className="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200">
          Interrompi la copertura
        </button>
      )}
    </motion.div>
  );
}
