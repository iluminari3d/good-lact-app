import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  ScanLine,
  X,
  XOctagon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CATEGORY_LABELS, LANGUAGES, PHRASES, type LanguageCode, type Phrase } from '../data/phrases';
import { cn } from '../lib/cn';
import { prepareImage, type PreparedImage } from '../lib/image';
import { readMenu, type MenuDish, type MenuResult, type MenuRisk } from '../services/labelApi';
import { BackButton } from './ui';

interface Props {
  onBack: () => void;
}

type Tab = 'phrases' | 'menu';

const MAX_MENU_TEXT = 3000;

const TABS: { id: Tab; label: string }[] = [
  { id: 'phrases', label: 'Frasi per il personale' },
  { id: 'menu', label: 'Leggi il menu' },
];

export function RestaurantView({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('phrases');

  return (
    <motion.div
      key="restaurant"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-8"
    >
      <BackButton label="Indietro" onClick={onBack} />

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">Al ristorante</h2>
        <p className="text-sm text-slate-500 font-medium">
          Frasi pronte da mostrare al personale e lettura del menu per capire cosa chiedere.
        </p>
      </div>

      <div role="tablist" aria-label="Sezioni" className="flex gap-2 p-1.5 bg-slate-100 rounded-3xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-3 px-2 rounded-2xl text-sm font-black transition-all',
              tab === t.id ? 'bg-white text-primary shadow' : 'text-slate-600 hover:text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'phrases' ? <PhrasesPanel /> : <MenuPanel />}
      </div>
    </motion.div>
  );
}

/* ------------------------------ Frasi ------------------------------ */

function PhrasesPanel() {
  const [lang, setLang] = useState<LanguageCode>('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [full, setFull] = useState<Phrase | null>(null);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeFull = useCallback(() => setFull(null), []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (phrase: Phrase) => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(phrase.text[lang]);
      setCopiedId(phrase.id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="phrase-lang" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Lingua da mostrare
        </label>
        <select
          id="phrase-lang"
          value={lang}
          onChange={(e) => setLang(e.target.value as LanguageCode)}
          className="w-full p-4 bg-slate-50 rounded-3xl outline-none font-bold text-slate-700 shadow-inner"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {copyError && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          Non riesco a copiare: usa «Schermo intero» e mostra il telefono.
        </p>
      )}

      <ul className="space-y-4">
        {PHRASES.map((phrase) => (
          <li key={phrase.id} className="glass-card p-6 space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {CATEGORY_LABELS[phrase.category]} · {phrase.title}
            </p>
            <p lang={lang} className="text-2xl font-black text-slate-900 leading-snug">
              {phrase.text[lang]}
            </p>
            {lang !== 'it' && <p className="text-xs text-slate-500 font-medium">{phrase.text.it}</p>}
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => void copy(phrase)}
                aria-label={`Copia la frase: ${phrase.title}`}
                className="flex-1 min-w-[8rem] py-3 bg-white rounded-2xl font-bold text-slate-700 hover:text-primary flex items-center justify-center gap-2 border border-slate-200"
              >
                {copiedId === phrase.id ? <Check size={18} /> : <Copy size={18} />}
                {copiedId === phrase.id ? 'Copiato' : 'Copia'}
              </button>
              <button
                type="button"
                onClick={() => setFull(phrase)}
                aria-label={`Mostra a schermo intero: ${phrase.title}`}
                className="flex-1 min-w-[8rem] py-3 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2"
              >
                <Maximize2 size={18} /> Schermo intero
              </button>
            </div>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {full && <FullScreenPhrase key="fs" text={full.text[lang]} lang={lang} onClose={closeFull} />}
      </AnimatePresence>
    </div>
  );
}

function FullScreenPhrase({ text, lang, onClose }: { text: string; lang: LanguageCode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Frase a schermo intero da mostrare al personale"
      className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Chiudi schermo intero"
        className="absolute top-5 right-5 p-4 bg-slate-100 rounded-full text-slate-700"
      >
        <X size={28} />
      </button>
      <p lang={lang} className="text-4xl sm:text-5xl font-black text-slate-900 text-center leading-tight max-w-3xl">
        {text}
      </p>
    </motion.div>
  );
}

/* ------------------------------ Menu ------------------------------ */

const RISK_UI: Record<MenuRisk, { heading: string; Icon: LucideIcon; box: string; icon: string; text: string }> = {
  avoid: {
    heading: 'Da evitare',
    Icon: XOctagon,
    box: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900',
  },
  ask: {
    heading: 'Chiedi prima di ordinare',
    Icon: AlertTriangle,
    box: 'bg-amber-50 border-amber-300',
    icon: 'text-amber-600',
    text: 'text-amber-900',
  },
  low: {
    heading: 'Rischio basso (conferma comunque)',
    Icon: CheckCircle2,
    box: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    text: 'text-emerald-900',
  },
};

const RISK_ORDER: MenuRisk[] = ['avoid', 'ask', 'low'];

function MenuPanel() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MenuResult | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const canRead = (text.trim().length > 0 || image) && !loading;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Immagine non valida.');
    }
  };

  const read = async () => {
    if (!canRead) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const trimmed = text.trim();
      const menu = await readMenu(
        {
          ...(trimmed ? { text: trimmed } : {}),
          ...(image ? { image: { mimeType: image.mimeType, data: image.data } } : {}),
        },
        controller.signal,
      );
      setResult(menu);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'La lettura del menu non è andata a buon fine.');
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const grouped: Record<MenuRisk, MenuDish[]> = { avoid: [], ask: [], low: [] };
  for (const dish of result?.dishes ?? []) grouped[dish.risk].push(dish);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="menu-text" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Incolla il testo del menu
          </label>
          <textarea
            id="menu-text"
            rows={5}
            maxLength={MAX_MENU_TEXT}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Es. Risotto ai funghi, Tagliata con rucola, Tiramisù..."
            className="w-full p-4 bg-slate-50 rounded-3xl outline-none font-medium text-slate-700 shadow-inner resize-none"
          />
          <p className="text-xs text-slate-500 text-right">
            {text.length}/{MAX_MENU_TEXT}
          </p>
        </div>

        {image && (
          <div className="relative">
            <img
              src={image.previewUrl}
              alt="Anteprima della foto del menu"
              className="w-full max-h-64 object-contain rounded-3xl bg-slate-100"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Rimuovi la foto del menu"
              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
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
          aria-label="Scatta una foto del menu"
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
          aria-label="Scegli una foto del menu dalla galleria"
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
          disabled={!canRead}
          onClick={() => void read()}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <RotateCcw size={20} className="animate-spin" /> Leggo il menu...
            </>
          ) : (
            <>
              <ScanLine size={20} /> Leggi il menu
            </>
          )}
        </button>
      </div>

      <div aria-live="polite" className="space-y-5">
        {error && (
          <div role="alert" className="p-5 bg-red-50 border border-red-200 rounded-3xl text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        {result && (
          <>
            <div
              role="note"
              className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl flex gap-3 text-amber-900"
            >
              <AlertTriangle size={24} className="shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm font-bold">{result.kitchenNote}</p>
            </div>

            {result.dishes.length === 0 && (
              <p className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-semibold text-slate-700">
                Non ho trovato piatti. Prova con una foto più nitida o incolla il testo del menu.
              </p>
            )}

            {RISK_ORDER.map((risk) => {
              const dishes = grouped[risk];
              if (dishes.length === 0) return null;
              const ui = RISK_UI[risk];
              return (
                <section key={risk} aria-label={ui.heading} className="space-y-3">
                  <h3 className={cn('flex items-center gap-2 text-lg font-black', ui.text)}>
                    <ui.Icon size={22} className={ui.icon} aria-hidden="true" />
                    {ui.heading} ({dishes.length})
                  </h3>
                  <ul className="space-y-3">
                    {dishes.map((dish, i) => (
                      <li key={`${dish.name}-${i}`} className={cn('p-5 rounded-3xl border-2 space-y-2', ui.box)}>
                        <p className={cn('font-black', ui.text)}>{dish.name}</p>
                        {dish.why && <p className={cn('text-sm font-medium', ui.text)}>{dish.why}</p>}
                        {dish.askStaff && (
                          <p className={cn('text-sm font-bold', ui.text)}>
                            <span className="uppercase text-[10px] tracking-widest">Chiedi: </span>
                            {dish.askStaff}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            <p className="text-xs text-slate-500 font-medium px-2">
              La classificazione è una stima automatica dai nomi dei piatti: è un aiuto pratico, non un parere medico.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
