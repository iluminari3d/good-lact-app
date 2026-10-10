import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload } from 'lucide-react';
import { LACTASE_DATA } from '../data/goodLactData';
import { applyBackup, createBackup, parseBackup } from '../lib/backup';
import { cn } from '../lib/cn';
import { notificationsSupported } from '../hooks/useCoverageTimer';
import { AccountSection } from './AccountSection';
import { BackButton } from './ui';

interface Props {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  severe: boolean;
  onSevereChange: (value: boolean) => void;
  notifications: boolean;
  onNotificationsChange: (value: boolean) => void;
  lactaseKey: string;
  customFcc: number | '';
  onLactaseChange: (key: string) => void;
  onCustomFccChange: (value: number | '') => void;
  onBack: () => void;
}

export function SettingsView({
  sensitivity, onSensitivityChange, severe, onSevereChange, notifications, onNotificationsChange,
  lactaseKey, customFcc, onLactaseChange, onCustomFccChange, onBack,
}: Props) {
  const supported = notificationsSupported();
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `good-lact-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Backup scaricato. Conservalo in un posto sicuro: contiene i tuoi dati di salute.');
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setBackupMessage(parsed.error);
      return;
    }
    applyBackup(parsed.backup);
    window.location.reload();
  };

  const toggleNotifications = async () => {
    if (notifications) return onNotificationsChange(false);
    if (!supported) return;
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    onNotificationsChange(permission === 'granted');
  };

  return (
    <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
      <BackButton label="Menu" onClick={onBack} />
      <h2 className="text-3xl font-black text-slate-800">Il mio profilo</h2>
      <div className="space-y-8">
        <div className="p-8 bg-slate-50 rounded-[3rem] space-y-4">
          <div className="space-y-1">
            <label htmlFor="profile-lactase" className="text-sm font-black text-slate-800">Lattasi predefinita</label>
            <p className="text-xs text-slate-400">Viene scelta in automatico a ogni pasto.</p>
          </div>
          <select
            id="profile-lactase"
            value={lactaseKey}
            onChange={(e) => onLactaseChange(e.target.value)}
            className="w-full p-4 bg-white rounded-2xl outline-none font-semibold text-slate-700"
          >
            <option value="">Seleziona prodotto...</option>
            {Object.entries(LACTASE_DATA).map(([key, data]) => (
              <option key={key} value={key}>{data.name}</option>
            ))}
          </select>
          {lactaseKey === 'custom' && (
            <input
              type="number"
              min={1}
              aria-label="FCC per compressa"
              value={customFcc}
              onChange={(e) => onCustomFccChange(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
              placeholder="FCC per compressa"
              className="w-full p-4 bg-white rounded-2xl outline-none font-semibold text-slate-700"
            />
          )}
        </div>
        <div className="p-8 bg-slate-50 rounded-[3rem] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">Intolleranza severa</p>
            <p className="text-xs text-slate-400">
              Per chi reagisce anche a piccole quantità: conta anche le tracce, include gli ingredienti solo
              possibili e propone sempre la dose prudente.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={severe}
            aria-label="Intolleranza severa"
            onClick={() => onSevereChange(!severe)}
            className={cn('w-14 h-8 rounded-full relative transition-all shrink-0', severe ? 'bg-emerald-500' : 'bg-slate-200')}
          >
            <motion.div animate={{ x: severe ? 24 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" />
          </button>
        </div>
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
        <AccountSection />
        <div className="p-8 bg-slate-50 rounded-[3rem] space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">Backup dei dati</p>
            <p className="text-xs text-slate-400">
              Una copia dei tuoi dati in un file, utile anche senza account. Senza accesso
              i dati restano solo su questo dispositivo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={exportData} className="py-3 bg-white rounded-2xl font-black text-slate-600 flex items-center justify-center gap-2">
              <Download size={16} /> Esporta
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="py-3 bg-white rounded-2xl font-black text-slate-600 flex items-center justify-center gap-2">
              <Upload size={16} /> Importa
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            aria-label="File di backup"
            className="hidden"
            onChange={(e) => { void importData(e.target.files?.[0]); e.target.value = ''; }}
          />
          {backupMessage && <p role="status" className="text-xs font-semibold text-slate-500">{backupMessage}</p>}
        </div>
      </div>
    </motion.div>
  );
}
