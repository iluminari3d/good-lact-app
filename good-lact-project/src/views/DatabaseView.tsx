import { motion } from 'framer-motion';
import { Database, ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import farmaciJson from '../data/db/farmaci.json';
import prodottiJson from '../data/db/prodotti.json';
import { cn } from '../lib/cn';
import { BackButton } from './ui';

type Reliability = 'measured' | 'estimated' | 'unverified';
interface Product {
  key: string; brand: string; name: string; category: string; claim: string;
  lactosePer100g: number | null; traces: boolean | null; reliability: Reliability;
  source: string; sourceUrl: string; checkedAt: string; note?: string;
}
interface Drug {
  key: string; name: string; form: string; lactoseMgPerUnit: number | null;
  containsLactose: boolean | null; lactoseFreeAlternative?: string | null; avviso?: string;
  reliability: Reliability; source: string; sourceUrl: string; checkedAt: string; note?: string;
}

const PRODUCTS = prodottiJson.products as Product[];
const DRUGS = farmaciJson.drugs as Drug[];

const RELIABILITY: Record<Reliability, { label: string; cls: string }> = {
  measured: { label: 'Fonte ufficiale', cls: 'bg-emerald-50 text-emerald-700' },
  estimated: { label: 'Stimato', cls: 'bg-amber-50 text-amber-700' },
  unverified: { label: 'Da verificare', cls: 'bg-slate-100 text-slate-500' },
};

const CLAIMS: Record<string, string> = {
  'senza-lattosio': 'Senza lattosio (dichiarato)',
  'naturalmente-privo': 'Naturalmente privo di lattosio',
  'ridotto-lattosio': 'A ridotto contenuto di lattosio',
  nessuno: 'Nessuna dichiarazione',
};

function Badge({ r }: { r: Reliability }) {
  const b = RELIABILITY[r];
  return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider', b.cls)}>{b.label}</span>;
}

function SourceLink({ url, source, checkedAt }: { url: string; source: string; checkedAt: string }) {
  return (
    <p className="text-[11px] text-slate-400 font-medium flex flex-wrap items-center gap-1">
      Fonte: {source} · letto il {checkedAt}
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary font-bold">
        apri <ExternalLink size={11} />
      </a>
    </p>
  );
}

export function DatabaseView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'prodotti' | 'farmaci'>('prodotti');
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();

  const products = useMemo(
    () => PRODUCTS.filter((p) => !term || `${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(term)),
    [term],
  );
  const drugs = useMemo(() => DRUGS.filter((d) => !term || `${d.name} ${d.form}`.toLowerCase().includes(term)), [term]);

  return (
    <motion.div key="database" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <BackButton label="Menu" onClick={onBack} />
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Database size={28} className="text-primary" /> Banca dati</h2>
      <p className="text-sm text-slate-500 font-medium">
        Funziona anche senza rete. I dati vengono da fonti pubbliche e i prodotti cambiano formulazione: controlla
        sempre l'etichetta o il foglietto illustrativo. Non è un parere medico.
      </p>

      <div className="flex gap-2" role="tablist" aria-label="Sezioni della banca dati">
        {(['prodotti', 'farmaci'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('flex-1 py-3 rounded-2xl font-black text-sm', tab === t ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500')}
          >
            {t === 'prodotti' ? `Prodotti (${PRODUCTS.length})` : `Farmaci (${DRUGS.length})`}
          </button>
        ))}
      </div>

      <label className="relative block">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'prodotti' ? 'Cerca marca o prodotto…' : 'Cerca farmaco o principio attivo…'}
          aria-label="Cerca nella banca dati"
          className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <ul className="space-y-3 pb-10">
        {tab === 'prodotti' && products.map((p) => (
          <li key={p.key} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-slate-800">{p.brand} · {p.name}</p>
              <Badge r={p.reliability} />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {CLAIMS[p.claim] ?? p.claim}
              {p.lactosePer100g != null && ` · lattosio fino a ${String(p.lactosePer100g).replace('.', ',')} g/100 g`}
            </p>
            {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
            <SourceLink url={p.sourceUrl} source={p.source} checkedAt={p.checkedAt} />
          </li>
        ))}
        {tab === 'farmaci' && drugs.map((d) => (
          <li key={d.key} className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-slate-800">{d.name}</p>
              <Badge r={d.reliability} />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {d.containsLactose === false ? 'Lattosio non presente tra gli eccipienti' : d.containsLactose ? 'Contiene lattosio' : 'Lattosio: da verificare'}
              {d.lactoseMgPerUnit != null && ` · circa ${String(d.lactoseMgPerUnit).replace('.', ',')} mg per ${d.form}`}
            </p>
            {d.lactoseFreeAlternative && <p className="text-xs text-slate-500">Alternativa documentata: {d.lactoseFreeAlternative}</p>}
            <p className="text-xs text-slate-400">La formulazione varia tra produttori e nel tempo: controlla il foglietto. Non modificare la terapia senza sentire medico o farmacista.</p>
            <SourceLink url={d.sourceUrl} source={d.source} checkedAt={d.checkedAt} />
          </li>
        ))}
        {((tab === 'prodotti' && products.length === 0) || (tab === 'farmaci' && drugs.length === 0)) && (
          <li className="p-5 text-sm text-slate-400 font-medium">Nessun risultato. Prova con un altro termine.</li>
        )}
      </ul>
    </motion.div>
  );
}
