import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Camera,
  ChefHat,
  ChevronLeft,
  Image as ImageIcon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { FOODS_DATA, LACTASE_DATA, UNITS_DATA } from '../data/goodLactData';
import { defaultQuantityFor } from '../lib/dose';
import { searchItems } from '../lib/search';
import { prepareImage, type PreparedImage } from '../lib/image';
import { newId } from '../lib/storage';
import type { MealItem } from '../types';

const MAX_DESCRIPTION = 500;

/** Riga di anteprima nei risultati: aiuta a scegliere la voce giusta prima di aggiungerla. */
function lactoseHint(f: (typeof FOODS_DATA)[string]): string {
  if (f.isLactoseFree) return 'lattosio trascurabile';
  const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
  if (f.lactoseMode === 'perPortion' && f.lactosePerPortion != null) return `≈ ${fmt(f.lactosePerPortion)} g a porzione`;
  if (f.lactosePer100g != null) return `${fmt(f.lactosePer100g)} g / 100 g`;
  return '';
}
const MAX_SEARCH_RESULTS = 30;

interface Props {
  lactaseKey: string;
  customFcc: number | '';
  onLactaseChange: (key: string) => void;
  onCustomFccChange: (value: number | '') => void;
  meal: MealItem[];
  onMealChange: (items: MealItem[]) => void;
  isAnalyzing: boolean;
  analysisError: string | null;
  onAnalyze: (input: { description: string; image: PreparedImage | null }) => void;
  onCompose: () => void;
  onEditDish: (id: string) => void;
  onCalculate: () => void;
  canCalculate: boolean;
}

export function MainView(props: Props) {
  const { meal, onMealChange } = props;
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const canAnalyze = (description.trim().length > 0 || image) && !props.isAnalyzing;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    try {
      setImage(await prepareImage(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Immagine non valida.');
    }
  };

  const term = search.trim();
  const results = searchItems(
    Object.entries(FOODS_DATA).filter(([key]) => key !== 'custom-dish'),
    term,
    ([, f]) => f.name,
    ([, f]) => f.category ?? '',
    MAX_SEARCH_RESULTS,
  );

  const addFood = (foodKey: string) => {
    const food = FOODS_DATA[foodKey];
    if (!food) return;
    const { quantity, unit } = defaultQuantityFor(foodKey);
    onMealChange([...meal, { id: newId(), kind: 'food', foodKey, name: food.name, quantity, unit }]);
    setSearch('');
    setShowResults(false);
  };

  const updateItem = (id: string, patch: Partial<MealItem>) =>
    onMealChange(meal.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  return (
    <motion.div
      key="main"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      {/* Lattasi */}
      <div className="space-y-3">
        <div className="flex justify-between items-center h-5">
          <label htmlFor="lactase" className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Enzima utilizzato
          </label>
          <button
            type="button"
            aria-label="Azzera la scelta dell'enzima"
            onClick={() => props.onLactaseChange('')}
            className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-300 hover:text-primary"
          >
            <RotateCcw size={12} />
          </button>
        </div>
        <div className="relative">
          <select
            id="lactase"
            value={props.lactaseKey}
            onChange={(e) => props.onLactaseChange(e.target.value)}
            className="w-full p-4 pl-5 bg-slate-100/50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl outline-none transition-all appearance-none cursor-pointer font-semibold text-slate-700 shadow-inner"
          >
            <option value="" disabled>Seleziona prodotto...</option>
            {Object.entries(LACTASE_DATA).map(([key, data]) => (
              <option key={key} value={key}>{data.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronLeft className="-rotate-90" size={18} />
          </div>
        </div>
        {props.lactaseKey === 'custom' && (
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Inserisci gli FCC per compressa..."
            value={props.customFcc}
            onChange={(e) => props.onCustomFccChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-primary"
          />
        )}
      </div>

      {/* Descrivi o fotografa */}
      <div className="space-y-3">
        <label htmlFor="dish-description" className="text-xs font-black text-slate-400 uppercase tracking-widest block">
          Cosa stai mangiando?
        </label>
        <div className="p-4 bg-slate-100/50 rounded-3xl space-y-4 shadow-inner">
          <textarea
            id="dish-description"
            rows={3}
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrivi il piatto: es. tagliatelle ai funghi, una porzione abbondante"
            className="w-full p-4 bg-white rounded-2xl outline-none font-medium text-slate-700 resize-none border-2 border-transparent focus:border-primary/40"
          />

          {image && (
            <div className="relative w-28 h-28">
              <img src={image.previewUrl} alt="Anteprima del piatto" className="w-28 h-28 object-cover rounded-2xl border border-slate-200" />
              <button
                type="button"
                aria-label="Rimuovi la foto"
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {imageError && <p role="alert" className="text-sm font-semibold text-red-600">{imageError}</p>}

          <div className="flex flex-wrap gap-3">
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
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }} />
          <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }} />

          <button
            type="button"
            disabled={!canAnalyze}
            onClick={() => props.onAnalyze({ description, image })}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-40 flex items-center justify-center gap-3"
          >
            {props.isAnalyzing ? (
              <><RotateCcw size={20} className="animate-spin" /> Analizzo il piatto...</>
            ) : (
              <><Sparkles size={20} /> Analizza il piatto</>
            )}
          </button>
          {props.analysisError && (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {props.analysisError}{' '}
              <button type="button" onClick={props.onCompose} className="underline">Componi a mano</button>
            </p>
          )}
        </div>
      </div>

      {/* Ricerca alimento singolo */}
      <div className="space-y-3 relative">
        <label htmlFor="food-search" className="text-xs font-black text-slate-400 uppercase tracking-widest block">
          Oppure aggiungi un alimento
        </label>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            id="food-search"
            type="text"
            autoComplete="off"
            placeholder="Es. ricotta, latte, gelato..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl outline-none transition-all shadow-inner font-medium"
          />
        </div>
        <AnimatePresence>
          {showResults && term.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute z-50 left-0 right-0 bg-white rounded-2xl shadow-xl max-h-72 overflow-y-auto p-1 border border-slate-100"
            >
              {results.length === 0 && (
                <p className="p-3 text-center text-slate-400 font-bold text-xs">
                  Nessun risultato. Prova con un'altra parola, oppure descrivi il piatto e premi «Analizza», o usa «Componi un piatto a mano».
                </p>
              )}
              {results.map(([key, f]) => (
                <button key={key} onClick={() => addFood(key)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><Plus size={16} /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{f.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {[f.category, lactoseHint(f)].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button type="button" onClick={props.onCompose} className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 pt-1">
          <ChefHat size={14} /> Componi un piatto a mano
        </button>
      </div>

      {/* Pasto */}
      {meal.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Il tuo pasto</p>
          {meal.map((item) => (
            <div key={item.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.kind === 'dish' && <ChefHat size={14} className="text-primary shrink-0" />}
                  <span className="font-bold text-slate-800 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.kind === 'dish' && (
                    <button type="button" aria-label={`Modifica ${item.name}`} onClick={() => props.onEditDish(item.id)} className="p-2 text-slate-300 hover:text-primary rounded-xl">
                      <Pencil size={16} />
                    </button>
                  )}
                  <button type="button" aria-label={`Rimuovi ${item.name}`} onClick={() => onMealChange(meal.filter((m) => m.id !== item.id))} className="p-2 text-slate-300 hover:text-red-500 rounded-xl">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {item.kind === 'dish' ? (
                <p className="text-xs text-slate-400 font-medium">
                  {item.dish?.ingredients.filter((i) => i.active).length ?? 0} ingredienti considerati
                </p>
              ) : (
                <div className="flex gap-4 items-center">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    aria-label={FOODS_DATA[item.foodKey ?? '']?.lactoseMode === 'perPortion' ? 'Porzioni' : 'Quantità'}
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, { quantity: Math.max(0, Number(e.target.value)) })}
                    className="w-24 p-3 bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl text-sm font-bold outline-none text-center"
                  />
                  {FOODS_DATA[item.foodKey ?? '']?.lactoseMode === 'perPortion' ? (
                    <span className="flex-1 text-sm font-bold text-slate-500">
                      {item.quantity === 1 ? 'porzione' : 'porzioni'} <span className="text-xs font-medium text-slate-400">(porzione tipica da ricetta)</span>
                    </span>
                  ) : (
                  <select
                    aria-label="Unità di misura"
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                    className="flex-1 p-3 bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl text-sm font-bold outline-none"
                  >
                    {Object.entries(UNITS_DATA)
                      .filter(([k]) => k !== 'porzione')
                      .map(([k, u]) => (<option key={k} value={k}>{u.name}</option>))}
                  </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {meal.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={props.onCalculate}
            disabled={!props.canCalculate}
            className="w-full py-6 bg-gradient-to-r from-primary to-primary-dark text-white font-black rounded-3xl shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 text-xl disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Calculator size={28} /> Calcola la dose
          </button>
          {!props.canCalculate && (
            <p className="text-center text-xs font-semibold text-slate-400">
              Scegli prima l'enzima che usi{props.lactaseKey === 'custom' ? ' e inserisci gli FCC' : ''}.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
