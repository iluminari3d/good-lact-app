import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Camera, CheckCircle2, CircleHelp, Image as ImageIcon, RotateCcw, ScanLine, XOctagon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { prepareImage, type PreparedImage } from '../lib/image';
import { scanLabel, type LabelResult, type LabelVerdict } from '../services/labelApi';
import { BackButton } from './ui';

interface Props {
  onBack: () => void;
}

const VERDICT_UI: Record<LabelVerdict, { title: string; Icon: LucideIcon; box: string; icon: string; text: string }> = {
  ok: {
    title: 'Nessun derivato del latte trovato',
    Icon: CheckCircle2,
    box: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    text: 'text-emerald-900',
  },
  caution: {
    title: 'Prudenza: possibili tracce di latte',
    Icon: AlertTriangle,
    box: 'bg-amber-50 border-amber-300',
    icon: 'text-amber-600',
    text: 'text-amber-900',
  },
  avoid: {
    title: 'Da evitare: contiene latte o derivati',
    Icon: XOctagon,
    box: 'bg-red-50 border-red-300',
    icon: 'text-red-600',
    text: 'text-red-900',
  },
  unreadable: {
    title: 'Etichetta non leggibile',
    Icon: CircleHelp,
    box: 'bg-slate-100 border-slate-300',
    icon: 'text-slate-500',
    text: 'text-slate-800',
  },
};

export function LabelView({ onBack }: Props) {
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LabelResult | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    setResult(null);
    setError(null);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Immagine non valida.');
    }
  };

  const scan = async () => {
    if (!image || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const label = await scanLabel({ mimeType: image.mimeType, data: image.data }, controller.signal);
      setResult(label);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "La lettura dell'etichetta non è andata a buon fine.");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setImage(null);
    setResult(null);
    setError(null);
    setImageError(null);
    setLoading(false);
  };

  const ui = result ? VERDICT_UI[result.verdict] : null;

  return (
    <motion.div
      key="label"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-8"
    >
      <BackButton label="Indietro" onClick={onBack} />

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">Scanner etichette</h2>
        <p className="text-sm text-slate-500 font-medium">
          Fotografa l'elenco degli ingredienti di un prodotto confezionato: cerco latte e derivati, anche tra gli allergeni.
        </p>
      </div>

      <div className="glass-card p-6 space-y-5">
        {image && (
          <img
            src={image.previewUrl}
            alt="Anteprima della foto dell'etichetta"
            className="w-full max-h-72 object-contain rounded-3xl bg-slate-100"
          />
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 min-w-[8rem] py-3 bg-white rounded-2xl font-bold text-slate-600 hover:text-primary flex items-center justify-center gap-2 border border-slate-200"
          >
            <Camera size={18} /> Scatta foto
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex-1 min-w-[8rem] py-3 bg-white rounded-2xl font-bold text-slate-600 hover:text-primary flex items-center justify-center gap-2 border border-slate-200"
          >
            <ImageIcon size={18} /> Galleria
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          aria-label="Scatta una foto dell'etichetta"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          hidden
          aria-label="Scegli una foto dell'etichetta dalla galleria"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {imageError && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {imageError}
          </p>
        )}

        <button
          type="button"
          disabled={!image || loading}
          onClick={() => void scan()}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <RotateCcw size={20} className="animate-spin" /> Leggo l'etichetta...
            </>
          ) : (
            <>
              <ScanLine size={20} /> Leggi l'etichetta
            </>
          )}
        </button>
      </div>

      <div aria-live="polite" className="space-y-4">
        {error && (
          <div role="alert" className="p-5 bg-red-50 border border-red-200 rounded-3xl text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        {result && ui && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            aria-label="Esito della lettura"
            className="space-y-4"
          >
            <div className={cn('p-6 rounded-[3rem] border-2 space-y-3', ui.box)}>
              <div className="flex items-center gap-3">
                <ui.Icon size={36} className={cn('shrink-0', ui.icon)} aria-hidden="true" />
                <h3 className={cn('text-xl font-black leading-tight', ui.text)}>
                  {result.verdict === 'ok' && result.lactoseFreeClaim ? "L'etichetta dichiara «senza lattosio»" : ui.title}
                </h3>
              </div>
              <p className={cn('text-sm font-bold', ui.text)}>{result.productName}</p>
              <p className={cn('text-sm font-medium', ui.text)}>{result.note}</p>
            </div>

            {result.dairyIngredients.length > 0 && (
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Latte e derivati trovati ({result.dairyIngredients.length})
                </h4>
                <ul className="space-y-2">
                  {result.dairyIngredients.map((d, i) => (
                    <li key={`${d.term}-${i}`} className="flex flex-col">
                      <span className="font-bold text-slate-800">{d.term}</span>
                      {d.note && <span className="text-xs text-slate-500 font-medium">{d.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.mayContainTraces && (
              <p className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-semibold text-amber-900">
                Sull'etichetta c'è un'avvertenza su possibili tracce di latte.
              </p>
            )}

            {result.summary && <p className="text-xs text-slate-500 font-medium px-2">Letto: {result.summary}</p>}

            <button
              type="button"
              onClick={reset}
              className="w-full py-3 bg-white rounded-2xl font-bold text-slate-600 hover:text-primary border border-slate-200 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Scansiona un altro prodotto
            </button>
          </motion.section>
        )}
      </div>

      <p className="text-xs text-slate-500 font-medium px-2">
        La lettura è automatica e può sbagliare: non sostituisce il controllo dell'etichetta. È un aiuto pratico, non un
        parere medico.
      </p>
    </motion.div>
  );
}
