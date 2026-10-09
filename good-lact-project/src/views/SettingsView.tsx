import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { notificationsSupported } from '../hooks/useCoverageTimer';
import { BackButton } from './ui';

interface Props {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  notifications: boolean;
  onNotificationsChange: (value: boolean) => void;
  onBack: () => void;
}

export function SettingsView({ sensitivity, onSensitivityChange, notifications, onNotificationsChange, onBack }: Props) {
  const supported = notificationsSupported();

  const toggleNotifications = async () => {
    if (notifications) return onNotificationsChange(false);
    if (!supported) return;
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    onNotificationsChange(permission === 'granted');
  };

  return (
    <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
      <BackButton label="Menu" onClick={onBack} />
      <h2 className="text-3xl font-black text-slate-800">Impostazioni</h2>
      <div className="space-y-8">
        <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <label htmlFor="sensitivity" className="text-sm font-black text-slate-800">Fattore di sensibilità</label>
              <p className="text-xs text-slate-400">Moltiplica gli FCC calcolati in base a come reagisci tu</p>
            </div>
            <span className="text-2xl font-black text-primary">{sensitivity.toFixed(1).replace('.', ',')}x</span>
          </div>
          <input
            id="sensitivity"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <span>Poco sensibile (0,5x)</span>
            <span>Molto sensibile (2,0x)</span>
          </div>
        </div>
        <div className="p-8 bg-slate-50 rounded-[3rem] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">Notifiche di copertura</p>
            <p className="text-xs text-slate-400">
              {supported ? 'Avvisami quando il timer scade' : 'Non supportate da questo browser'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            aria-label="Notifiche di copertura"
            disabled={!supported}
            onClick={() => void toggleNotifications()}
            className={cn('w-14 h-8 rounded-full relative transition-all shrink-0 disabled:opacity-40', notifications ? 'bg-emerald-500' : 'bg-slate-200')}
          >
            <motion.div animate={{ x: notifications ? 24 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
