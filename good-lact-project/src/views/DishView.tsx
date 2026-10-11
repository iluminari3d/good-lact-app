import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Plus, Search, Trash2 } from 'lucide-react';
import { FOODS_DATA } from '../data/goodLactData';
import { defaultQuantityFor, negligibleFor } from '../lib/dose';
import { cn } from '../lib/cn';
import { formatGrams } from '../lib/format';
import { newId } from '../lib/storage';
import type { Certainty, Dish, DishIngredient } from '../types';
import { BackButton, CertaintyBadge } from './ui';

interface Props {
  dish: Dish;
  isNew: boolean;
  severe: boolean;
  onChange: (dish: Dish) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function lactoseOf(ing: DishIngredient): number {
  return (Math.max(ing.grams, 0) / 100) * Math.max(ing.lactosePer100g, 0);
}

export function DishView({ dish, isNew, severe, onChange, onConfirm, onCancel }: Props) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const results =
    term.length > 0
      ? Object.entries(FOODS_DATA)
          .filter(([key, f]) => key !== 'custom-dish' && f.lactoseMode !== 'builder' && f.lactoseMode !== 'perPortion' && f.name.toLowerCase().includes(term))
          .slice(0, 20)
      : [];

  const update = (id: string, patch: Partial<DishIngredient>) =>
    onChange({ ...dish, ingredients: dish.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const addIngredient = (foodKey: string) => {
    const food = FOODS_DATA[foodKey];
    if (!food) return;
    const { quantity } = defaultQuantityFor(foodKey);
    const ingredient: DishIngredient = {
      id: newId(),
      name: food.name,
      grams: quantity,
      lactosePer100g: food.isLactoseFree ? 0 : (food.lactosePer100g ?? 0),
      certainty: 'certain',
      source: 'user',
      active: true,
    };
    onChange({ ...dish, ingredients: [...dish.ingredients, ingredient] });
    setSearch('');
  };

  const hasIngredients = dish.ingredients.length > 0;

  return (
    <motion.div
      key="dish"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="space-y-8"
    >
      <BackButton label="Annulla" onClick={onCancel} />

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800">{isNew ? 'Controlla il piatto' : 'Modifica il piatto'}</h2>
        <p className="text-sm text-slate-400 font-medium">
          Gli ingredienti sono stime: correggi i grammi o escludi quelli che sai non esserci.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="dish-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome del piatto</label>
        <input
          id="dish-name"
          type="text"
          maxLength={80}
          value={dish.name}
          onChange={(e) => onChange({ ...dish, name: e.target.value })}
          className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold text-slate-700 shadow-inner"
        />
        {dish.portionNote && <p className="text-xs text-slate-400 font-medium px-2">{dish.portionNote}</p>}
      </div>

      {!hasIngredients && (
        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-sm font-semibold text-emerald-700">
          Non ho trovato ingredienti con lattosio in questo piatto. Se sai che ce n'è, aggiungili qui sotto.
        </div>
      )}

      <div className="space-y-3">
        {dish.ingredients.map((ing) => {
          const lactose = lactoseOf(ing);
          const negligible = lactose < negligibleFor(severe) || lactose <= 0;
          return (
            <div
              key={ing.id}
              className={cn(
                'p-5 rounded-3xl border-2 transition-all space-y-3',
                ing.active ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ing.active}
                    onChange={(e) => update(ing.id, { active: e.target.checked })}
                    className="mt-1 w-5 h-5 accent-primary"
                    aria-label={`Includi ${ing.name} nel calcolo`}
                  />
                  <span className="flex flex-col min-w-0">
                    <span className={cn('font-bold text-slate-800', !ing.active && 'line-through')}>{ing.name}</span>
                    {ing.reason && <span className="text-xs text-slate-400 font-medium">{ing.reason}</span>}
                  </span>
                </label>
                <button
                  type="button"
                  aria-label={`Rimuovi ${ing.name}`}
                  onClick={() => onChange({ ...dish, ingredients: dish.ingredients.filter((i) => i.id !== ing.id) })}
                  className="p-2 text-slate-300 hover:text-red-500 rounded-xl shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {ing.source === 'ai' ? (
                  <label className="flex items-center gap-2">
                    <CertaintyBadge certainty={ing.certainty} />
                    <select
                      aria-label={`Quanto sei sicuro che ci sia ${ing.name}`}
                      value={ing.certainty}
                      onChange={(e) => update(ing.id, { certainty: e.target.value as Certainty })}
                      className="text-[11px] font-bold text-slate-500 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="certain">Sì, c'è</option>
                      <option value="probable">Probabile</option>
                      <option value="possible">Forse</option>
                    </select>
                  </label>
                ) : (
                  <span className="px-2 py-0.5 rounded-full border bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase tracking-wider">Aggiunto da te</span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    inputMode="decimal"
                    aria-label={`Grammi di ${ing.name}`}
                    value={ing.grams || ''}
                    onChange={(e) => update(ing.id, { grams: Math.min(2000, Math.max(0, Number(e.target.value))) })}
                    className="w-20 p-2 bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl text-sm font-bold outline-none text-center"
                  />
                  <span className="text-xs font-bold text-slate-400">g</span>
                </div>
                <span className="text-xs font-black text-slate-500 w-full text-right">
                  {negligible ? 'valore trascurabile (conta 0)' : `≈ ${formatGrams(lactose)} g di lattosio`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 relative">
        <label htmlFor="ingredient-search" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggiungi un ingrediente</label>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary" size={18} />
          <input
            id="ingredient-search"
            type="text"
            autoComplete="off"
            placeholder="Cerca (es. mozzarella, panna)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl outline-none shadow-inner font-medium text-sm"
          />
        </div>
        {results.length > 0 && (
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl max-h-56 overflow-y-auto p-2">
            {results.map(([key, f]) => (
              <button key={key} type="button" onClick={() => addIngredient(key)} className="w-full text-left p-3 hover:bg-primary/5 rounded-xl flex items-center justify-between">
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{f.name}</span>
                  {f.category && <span className="text-[9px] text-slate-400 uppercase font-black">{f.category}</span>}
                </span>
                <Plus size={14} className="text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="w-full py-6 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
      >
        <CheckCircle2 size={24} /> {isNew ? 'Aggiungi al pasto' : 'Salva modifiche'}
      </button>
    </motion.div>
  );
}
