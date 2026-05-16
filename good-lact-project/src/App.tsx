import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Calculator, 
  Clock, 
  ChevronLeft, 
  Info, 
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  History,
  ChefHat,
  Calendar,
  Settings as SettingsIcon,
  Bell,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LACTASE_DATA, FOODS_DATA, UNITS_DATA } from './data/goodLactData';
import type { FoodInfo } from './data/goodLactData';
import { callApi } from './services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface SelectedFood {
  id: string;
  foodKey: string;
  name: string;
  quantity: number;
  unit: string;
  lactoseAmount?: number;
  isCustomDish?: boolean;
  dishData?: DishData;
}

interface DishData {
  baseName: string;
  weight: number;
  ingredients: { name: string; quantity: number; isAuto?: boolean; lactoseAmount?: number }[];
  hiddenIngredients: { name: string; estimatedGrams: number; lactoseAmount: number; isActive: boolean }[];
}

interface Consumption {
  id: string;
  time: string;
  pills: number;
  foodNames: string[];
}

interface DailyLog {
  date: string;
  totalPills: number;
  consumptions: Consumption[];
}

type View = 'main' | 'builder' | 'results' | 'timer' | 'lactose-free' | 'history' | 'settings' | 'faq';

const FAQ_DATA = [
  {
    category: "L'Intolleranza al Lattosio: Le Basi",
    items: [
      {
        q: "Cos'è esattamente l'intolleranza al lattosio?",
        a: "Si verifica quando l'intestino tenue non produce una quantità sufficiente di lattasi, l'enzima fondamentale per digerire il lattosio (il principale zucchero del latte e dei suoi derivati). Il lattosio non digerito arriva nell'intestino crasso dove fermenta, causando gonfiore, crampi, meteorismo e altri fastidi gastrointestinali."
      },
      {
        q: "L'intolleranza al lattosio è uguale all'allergia al latte?",
        a: "Assolutamente no, ed è una distinzione vitale. L'intolleranza coinvolge l'apparato digerente e riguarda uno zucchero. L'allergia al latte è una risposta anomala del sistema immunitario alle proteine del latte (come caseina o siero) e può scatenare reazioni gravi o anafilattiche. Le compresse di lattasi sono del tutto inutili in caso di allergia."
      },
      {
        q: "Tutti i formaggi contengono lattosio?",
        a: "No. I formaggi a pasta dura stagionati a lungo (come Parmigiano Reggiano, Grana Padano o Pecorino molto stagionato) sono naturalmente privi di lattosio o ne contengono tracce irrilevanti, perché viene consumato dai batteri durante la stagionatura."
      }
    ]
  },
  {
    category: "Gli Enzimi di Lattasi (Le Compresse)",
    items: [
      {
        q: "Cosa significa la sigla FCC sulle confezioni di lattasi?",
        a: "FCC sta per \"Food Chemical Codex\". È l'unità di misura internazionale che indica il livello di attività e il potere digestivo dell'enzima lattasi. Più alto è il valore FCC, maggiore è la quantità di lattosio che la singola compressa o capsula è in grado di scomporre."
      },
      {
        q: "Quando è il momento esatto per assumere l'integratore?",
        a: "Il momento perfetto è in concomitanza con il primissimo boccone o sorso del pasto contenente lattosio (o al massimo 5-10 minuti prima). L'enzima deve trovarsi fisicamente nello stomaco per \"accogliere\" il cibo e iniziare a scindere lo zucchero."
      },
      {
        q: "Cosa succede se assumo troppe unità FCC? Posso andare in sovradosaggio?",
        a: "L'enzima lattasi agisce esclusivamente sul lattosio e non viene assorbito o metabolizzato dal resto dell'organismo. Le quantità in eccesso vengono semplicemente eliminate senza causare danni. Nel dubbio, è preferibile abbondare leggermente piuttosto che rischiare una copertura enzimatica insufficiente."
      },
      {
        q: "Perché a volte sto male anche se ho preso la pillola?",
        a: "I motivi possono essere diversi: la dose di FCC era troppo bassa rispetto all'effettiva quantità di lattosio ingerito, il pasto è durato a lungo (se mangi per più di 30-45 minuti, spesso è necessaria una seconda compressa), oppure il cibo conteneva elevate quantità di \"lattosio nascosto\" (spesso usato come addensante in salumi, salse, snack o come eccipiente nei farmaci)."
      }
    ]
  },
  {
    category: "I Formaggi Naturalmente Senza Lattosio",
    items: [
      {
        q: "Perché alcuni formaggi normali non contengono lattosio?",
        a: "Il miracolo avviene grazie alla fermentazione e alla stagionatura. Durante la produzione del formaggio, vengono aggiunti dei batteri lattici che si nutrono del lattosio, trasformandolo in acido lattico. Più il formaggio è stagionato (e quindi a pasta dura), meno lattosio conterrà, arrivando a livelli prossimi allo zero (inferiori a 0,1g o 0,01g su 100g), che sono tollerati dalla stragrande maggioranza delle persone intolleranti."
      },
      {
        q: "Quali sono i formaggi naturalmente privi di lattosio che posso mangiare senza prendere l'integratore?",
        a: "La lista è molto più lunga di quanto si pensi! Tra i più noti e sicuri troviamo:\n\n• I grandi stagionati: Parmigiano Reggiano (dai 24 mesi in su la sicurezza è pressoché totale), Grana Padano e Pecorino molto stagionato.\n• A pasta filata e semi-dura: Il Provolone (come il classico Auricchio, sia dolce che piccante), il Caciocavallo e la Scamorza (comprese le produzioni pugliesi del Caseificio Montrone).\n• Gli erborinati: Il Gorgonzola.\n• Oltre confine: Emmentaler, Gruyère, Fontina, Brie e Camembert."
      }
    ]
  }
];

const GoodLactApp: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [lactaseKey, setLactaseKey] = useState('');
  const [customFcc, setCustomFcc] = useState<number | ''>('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Settings
  const [sensitivityFactor, setSensitivityFactor] = useState(1.0);
  const [enableNotifications, setEnableNotifications] = useState(false);

  const [results, setResults] = useState({
    lactoseGrams: 0,
    requiredFcc: 0,
    recommendedPills: 0,
    autoAddedIngredients: [] as string[]
  });

  // Timer State
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerExpiry, setTimerExpiry] = useState<number | null>(null);

  // Daily Stats & History
  const [dailyPills, setDailyPills] = useState<number>(0);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [history, setHistory] = useState<DailyLog[]>([]);

  // Dish Builder State
  const [isAnalyzingDish, setIsAnalyzingDish] = useState(false);
  const [builderData, setBuilderData] = useState<DishData>({
    baseName: '',
    weight: 0,
    ingredients: [],
    hiddenIngredients: []
  });
  const [builderSearch, setBuilderSearch] = useState('');
  const [showBuilderSearch, setShowBuilderSearch] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // --- Persistence Logic ---
  useEffect(() => {
    const savedPills = localStorage.getItem('goodlact_daily_pills');
    const savedDate = localStorage.getItem('goodlact_last_date');
    const savedTimer = localStorage.getItem('goodlact_timer_expiry');
    const savedConsumptions = localStorage.getItem('goodlact_consumptions');
    const savedLactase = localStorage.getItem('goodlact_default_lactase');
    const savedHistory = localStorage.getItem('goodlact_full_history');
    const savedSensitivity = localStorage.getItem('goodlact_sensitivity');
    const savedNotifs = localStorage.getItem('goodlact_notifs_enabled');

    const today = new Date().toLocaleDateString();

    if (savedLactase && LACTASE_DATA[savedLactase]) setLactaseKey(savedLactase);
    if (savedSensitivity) setSensitivityFactor(Number(savedSensitivity));
    if (savedNotifs === 'true') setEnableNotifications(true);
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    if (savedDate !== today) {
      if (savedDate && savedPills && Number(savedPills) > 0) {
          const oldHistory = savedHistory ? JSON.parse(savedHistory) : [];
          const yesterdayLog: DailyLog = {
              date: savedDate,
              totalPills: Number(savedPills),
              consumptions: savedConsumptions ? JSON.parse(savedConsumptions) : []
          };
          const newHistory = [yesterdayLog, ...oldHistory].slice(0, 30);
          setHistory(newHistory);
          localStorage.setItem('goodlact_full_history', JSON.stringify(newHistory));
      }
      setDailyPills(0);
      setConsumptions([]);
      localStorage.setItem('goodlact_daily_pills', '0');
      localStorage.setItem('goodlact_consumptions', '[]');
      localStorage.setItem('goodlact_last_date', today);
    } else {
      if (savedPills) setDailyPills(Number(savedPills));
      if (savedConsumptions) setConsumptions(JSON.parse(savedConsumptions));
    }

    if (savedTimer) {
      const expiry = Number(savedTimer);
      if (expiry > Date.now()) {
        setTimerExpiry(expiry);
        setTimeLeft(Math.floor((expiry - Date.now()) / 1000));
        setIsTimerRunning(true);
      } else {
        localStorage.removeItem('goodlact_timer_expiry');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('goodlact_sensitivity', sensitivityFactor.toString());
    localStorage.setItem('goodlact_notifs_enabled', enableNotifications.toString());
    localStorage.setItem('goodlact_daily_pills', dailyPills.toString());
    localStorage.setItem('goodlact_consumptions', JSON.stringify(consumptions));
    if (lactaseKey) localStorage.setItem('goodlact_default_lactase', lactaseKey);
    if (timerExpiry) localStorage.setItem('goodlact_timer_expiry', timerExpiry.toString());
    else localStorage.removeItem('goodlact_timer_expiry');
  }, [sensitivityFactor, enableNotifications, dailyPills, consumptions, lactaseKey, timerExpiry]);

  // Click outside search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Timer Tick ---
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        const newTime = Math.max(0, Math.floor(((timerExpiry || 0) - Date.now()) / 1000));
        setTimeLeft(newTime);
        if (newTime === 0) {
          setIsTimerRunning(false);
          setTimerExpiry(null);
          if (enableNotifications && "Notification" in window && Notification.permission === "granted") {
              new Notification("GoodLact", { body: "La tua copertura è terminata!", icon: "/Good Lact Pittogramma.svg" });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isTimerPaused, timerExpiry, timeLeft, enableNotifications]);

  // --- Handlers ---
  const handleAddFood = (foodKey: string) => {
    if (foodKey === 'custom-dish') {
      setBuilderData({ baseName: '', weight: 0, ingredients: [], hiddenIngredients: [] });
      setView('builder');
    } else {
      const food = FOODS_DATA[foodKey];
      const newFood: SelectedFood = {
        id: Math.random().toString(36).substr(2, 9),
        foodKey,
        name: food.name,
        quantity: 1,
        unit: food.defaultUnit || (food.lactoseMode === 'perPortion' ? 'porzione' : 'grammi')
      };
      setSelectedFoods([...selectedFoods, newFood]);
    }
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const calculateResults = async () => {
    setIsCalculating(true);
    let totalLactose = 0;
    let autoAdded: string[] = [];
    
    for (const item of selectedFoods) {
      if (item.isCustomDish && item.dishData) {
        let dishLactose = 0;
        item.dishData.ingredients.forEach(ing => { dishLactose += (ing.lactoseAmount || 0); });
        item.dishData.hiddenIngredients.forEach(ing => {
            if (ing.isActive) {
                dishLactose += (ing.lactoseAmount || 0);
                autoAdded.push(`${ing.name} (~${Math.round(ing.estimatedGrams)}g)`);
            }
        });
        totalLactose += dishLactose;
      } else {
        const food = FOODS_DATA[item.foodKey];
        if (!food || food.isLactoseFree) continue;
        if (food.lactoseMode === 'perPortion') {
          totalLactose += (food.lactosePerPortion || 0) * item.quantity;
        } else {
          const unit = UNITS_DATA[item.unit];
          const weight = item.quantity * (unit?.multiplier || 0);
          totalLactose += (weight / 100) * (food.lactosePer100g || 0);
        }
      }
    }

    const fccPerPill = lactaseKey === 'custom' ? Number(customFcc) : (LACTASE_DATA[lactaseKey]?.fcc as number || 0);
    const requiredFcc = totalLactose * 1000 * sensitivityFactor;
    const recommendedPills = fccPerPill > 0 ? Math.ceil((requiredFcc / fccPerPill) * 2) / 2 : 0;

    setResults({ lactoseGrams: totalLactose, requiredFcc, recommendedPills, autoAddedIngredients: autoAdded });
    
    setTimeout(() => {
      setIsCalculating(false);
      if (totalLactose === 0 && selectedFoods.length > 0) setView('lactose-free');
      else setView('results');
    }, 1000);
  };

  const startTimer = (pillsToTake: number) => {
    const durationMs = 40 * 60 * 1000;
    const expiry = Date.now() + durationMs;
    setTimerExpiry(expiry);
    setTimeLeft(40 * 60);
    setIsTimerRunning(true);
    setIsTimerPaused(false);
    setDailyPills(prev => prev + pillsToTake);
    
    const newConsumption: Consumption = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pills: pillsToTake,
      foodNames: selectedFoods.map(f => f.name)
    };
    setConsumptions([newConsumption, ...consumptions]);
    setView('timer');
  };

  const handleAddIngredientToBuilder = (foodKey: string) => {
      const food = FOODS_DATA[foodKey];
      if (!food) return;
      const lactose = food.lactoseMode === 'perPortion' ? (food.lactosePerPortion || 0) : ((food.lactosePer100g || 0) * (100 / 100)); // Default 100g or 1 portion
      setBuilderData({
          ...builderData,
          ingredients: [...builderData.ingredients, { name: food.name, quantity: 1, lactoseAmount: lactose }]
      });
      setBuilderSearch('');
      setShowBuilderSearch(false);
  };

  const analyzeBaseDish = async (name: string) => {
    if (name.length < 3) return;
    setIsAnalyzingDish(true);
    const weightRes = await callApi('getBaseDishWeight', { dishName: name });
    const analysisRes = await callApi('analyzeBaseDish', { name, weight: weightRes.weight });
    const hidden = (analysisRes.hiddenIngredients || []).map((h: any) => ({ ...h, isActive: true }));
    setBuilderData(prev => ({ ...prev, weight: weightRes.weight, hiddenIngredients: hidden }));
    setIsAnalyzingDish(false);
  };

  const confirmDish = () => {
    const newFood: SelectedFood = {
      id: Math.random().toString(36).substr(2, 9),
      foodKey: 'custom-dish',
      name: builderData.baseName || 'Piatto Personalizzato',
      quantity: 1,
      unit: 'porzione',
      isCustomDish: true,
      dishData: builderData
    };
    setSelectedFoods([...selectedFoods, newFood]);
    setView('main');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Search logic
  const filteredFoods = Object.entries(FOODS_DATA).filter(([key, f]) => {
      if (key === 'custom-dish') return false;
      const term = searchTerm.toLowerCase();
      return f.name.toLowerCase().includes(term) || (f.category && f.category.toLowerCase().includes(term));
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 min-h-screen flex flex-col font-montserrat antialiased relative">
      <motion.div layout className="w-full relative z-10">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary-light/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Integrated Status Area (No Box) */}
        <div className="flex justify-between items-center mb-12 relative z-10">
          <div className="flex items-center gap-4">
             <div className={cn("w-2.5 h-2.5 rounded-full", isTimerRunning && !isTimerPaused ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Status</span>
               <span className="text-xs font-bold text-slate-600 mt-1">
                 {isTimerRunning ? `Protetto (${formatTime(timeLeft)})` : 'Non protetto'}
               </span>
             </div>
             {isTimerRunning && (
               <button onClick={() => { setIsTimerRunning(false); setTimerExpiry(null); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-all">
                 <X size={14} strokeWidth={3} />
               </button>
             )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
                <button onClick={() => setView('history')} className="flex flex-col items-end group">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Pillole Oggi</span>
                  <span className="text-sm font-black text-primary mt-1 group-hover:scale-110 transition-transform">{dailyPills}</span>
                </button>
                <button onClick={() => setView('history')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                  <History size={20} />
                </button>
            </div>
            <button onClick={() => setView('settings')} className="p-2 text-slate-300 hover:text-primary transition-all">
                <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-4">
              <img src="/Good Lact Lungo.svg" alt="Good Lact Logo" className="h-24 md:h-28 w-auto hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => setView('main')} />
           </motion.div>
           <p className="text-slate-400 mt-2 font-medium">Il tuo compagno intelligente per l'intolleranza</p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'main' && (
            <motion.div key="main" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center h-5">
                      Enzima Utilizzato
                      <button onClick={() => { setLactaseKey(''); }} className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-300 hover:text-primary"><RotateCcw size={12} /></button>
                    </label>
                    <div className="relative group">
                      <select value={lactaseKey} onChange={(e) => setLactaseKey(e.target.value)} className="w-full p-4 pl-5 bg-slate-100/50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl outline-none transition-all appearance-none cursor-pointer font-semibold text-slate-700 shadow-inner">
                        <option value="" disabled>Seleziona prodotto...</option>
                        {Object.entries(LACTASE_DATA).map(([key, data]) => (<option key={key} value={key}>{data.name}</option>))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronLeft className="-rotate-90" size={18} /></div>
                    </div>
                    {lactaseKey === 'custom' && (
                        <motion.input initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} type="number" placeholder="Inserisci FCC manuale..." value={customFcc} onChange={(e) => setCustomFcc(Number(e.target.value))} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-primary" />
                    )}
                </div>
                <div className="space-y-3" ref={searchRef}>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block h-5">Menu del Pasto</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input type="text" placeholder="Aggiungi alimento o piatto..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)} className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl outline-none transition-all shadow-inner font-medium" />
                    </div>
                    <AnimatePresence>
                      {showSearchResults && (
                        <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} className="absolute z-50 left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-y-auto overflow-x-hidden p-1 border border-slate-100">
                          {/* Integrated Dish Builder Row */}
                          <button onClick={() => handleAddFood('custom-dish')} className="w-full text-left p-3 hover:bg-primary/5 rounded-xl flex items-center justify-between transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><ChefHat size={16} /></div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">Crea un Piatto Composto</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Analisi ingredienti multipli</span>
                              </div>
                            </div>
                            <Sparkles size={14} className="text-primary/20 group-hover:text-primary transition-colors" />
                          </button>

                          <div className="h-px bg-slate-100/50 mx-2 my-1" />

                          {searchTerm.length > 0 ? (
                            filteredFoods.map(([key, f]) => (
                                <button key={key} onClick={() => handleAddFood(key)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><Plus size={16} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{f.name}</span>
                                        {f.category && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{f.category}</span>}
                                    </div>
                                  </div>
                                  <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">Inizia a scrivere o usa il builder</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4">
                {selectedFoods.map((item) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-slate-800">{item.name}</span>
                           {item.isCustomDish && <ChefHat size={14} className="text-primary" />}
                        </div>
                        <button onClick={() => setSelectedFoods(selectedFoods.filter(f => f.id !== item.id))} className="p-2 text-slate-200 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                      <div className="flex gap-4">
                        <input type="number" value={item.quantity} onChange={(e) => setSelectedFoods(selectedFoods.map(f => f.id === item.id ? { ...f, quantity: Number(e.target.value) } : f))} className="w-24 p-3 bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl text-sm font-bold outline-none text-center" />
                        <select value={item.unit} onChange={(e) => setSelectedFoods(selectedFoods.map(f => f.id === item.id ? { ...f, unit: e.target.value } : f))} className="flex-1 p-3 bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl text-sm font-bold outline-none">
                          {FOODS_DATA[item.foodKey]?.lactoseMode === 'perPortion' || item.isCustomDish ? <option value="porzione">porzione/i standard</option> : Object.entries(UNITS_DATA).map(([k, u]) => <option key={k} value={k}>{u.name}</option>)}
                        </select>
                      </div>
                    </motion.div>
                ))}
              </div>

              {selectedFoods.length > 0 && (
                <button onClick={calculateResults} disabled={!lactaseKey || isCalculating} className="w-full py-6 bg-gradient-to-r from-primary to-primary-dark text-white font-black rounded-3xl shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 text-xl disabled:opacity-50">
                    {isCalculating ? <RotateCcw size={28} className="animate-spin" /> : <><Calculator size={28} /> Analizza e Calcola</>}
                </button>
              )}
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center space-y-10">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-800">Analisi Completata</h2>
                <p className="text-slate-400 font-medium">"Calcolo basato sulla tua sensibilità"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-[3rem] space-y-2 relative overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattosio nel Pasto</p>
                  <p className="text-5xl font-black text-slate-800">{results.lactoseGrams.toFixed(1)}g</p>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/20 rounded-full translate-x-12 -translate-y-12" />
                </div>
                <div className="p-8 bg-emerald-50 rounded-[3rem] space-y-2 relative overflow-hidden ring-4 ring-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dose Consigliata</p>
                  <p className="text-7xl font-black text-emerald-700">{results.recommendedPills}</p>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/20 rounded-full translate-x-12 -translate-y-12" />
                </div>
              </div>

              {results.autoAddedIngredients.length > 0 && (
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={12} className="text-primary" /> Rilevati nel Piatto</p>
                    <div className="flex flex-wrap gap-2">
                        {results.autoAddedIngredients.map((ing, i) => (
                            <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-600 border border-slate-200">{ing}</span>
                        ))}
                    </div>
                </div>
              )}

              <div className="space-y-6 pt-4">
                <button onClick={() => startTimer(results.recommendedPills)} className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-xl hover:bg-emerald-700 hover:shadow-emerald-500/20 transition-all flex flex-col items-center">
                  <span className="text-lg">Assumi {results.recommendedPills} Pillole</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-80">E Avvia Copertura di 40min</span>
                </button>
                <div className="flex gap-4">
                    <button onClick={() => setView('main')} className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <Plus size={18} /> Altro Cibo
                    </button>
                    <button onClick={() => { setSelectedFoods([]); setView('main'); }} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-3xl hover:bg-slate-200 transition-all">Nuovo Pasto</button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
               <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all text-xs font-black uppercase tracking-widest group">
                 <ChevronLeft size={16} /> Dashboard
               </button>
               <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><BookOpen size={28} className="text-primary" /> FAQ & Guide</h2>
               
               <div className="space-y-10 pb-10">
                 {FAQ_DATA.map((cat, idx) => (
                   <div key={idx} className="space-y-4">
                     <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">{cat.category}</h3>
                     <div className="space-y-3">
                       {cat.items.map((item, i) => (
                         <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                           <p className="font-bold text-slate-800 mb-3">{item.q}</p>
                           <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{item.a}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
               <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all text-xs font-black uppercase tracking-widest group">
                 <ChevronLeft size={16} /> Dashboard
               </button>
               <div className="space-y-10">
                 <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ultimi 7 Giorni</p>
                    <div className="flex items-end justify-between h-32 px-2">
                      {Array.from({ length: 7 }).map((_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (6 - i));
                          const log = history.find(h => h.date === date.toLocaleDateString()) || (date.toLocaleDateString() === new Date().toLocaleDateString() ? { totalPills: dailyPills } : null);
                          const height = log ? Math.min(100, (log.totalPills / 10) * 100) : 0;
                          return (
                            <div key={i} className="flex flex-col items-center gap-2 w-full">
                                <div className="w-3 md:w-5 bg-slate-200 rounded-full relative h-24 overflow-hidden">
                                    <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} className="absolute bottom-0 w-full bg-primary" />
                                </div>
                                <span className="text-[8px] font-bold text-slate-400">{date.toLocaleDateString('it-IT', { weekday: 'narrow' })}</span>
                            </div>
                          );
                      })}
                    </div>
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Calendar size={20} className="text-primary" /> Assunzioni Oggi</h3>
                   {consumptions.length === 0 ? <p className="text-center py-10 text-slate-300 font-bold">Nessun dato registrato oggi.</p> : consumptions.map(c => (
                     <div key={c.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center justify-between">
                       <div className="space-y-1 flex flex-col"><p className="text-xs font-black text-slate-300 uppercase tracking-widest">{c.time}</p><p className="font-bold text-slate-800 leading-tight">{c.foodNames.join(', ')}</p></div>
                       <div className="px-5 py-2 bg-primary/10 text-primary rounded-2xl font-black text-sm">{c.pills} {c.pills === 1 ? 'pillola' : 'pillole'}</div>
                     </div>
                   ))}
                 </div>
               </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
               <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all text-xs font-black uppercase tracking-widest group">
                 <ChevronLeft size={16} /> Dashboard
               </button>
               <h2 className="text-3xl font-black text-slate-800">Impostazioni</h2>
               <div className="space-y-8">
                 <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-800">Fattore di Sensibilità</p>
                            <p className="text-xs text-slate-400">Moltiplica il calcolo FCC per il tuo metabolismo</p>
                        </div>
                        <span className="text-2xl font-black text-primary">{sensitivityFactor.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={sensitivityFactor} onChange={(e) => setSensitivityFactor(Number(e.target.value))} className="w-full accent-primary h-2 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span>Poco Sensibile (0.5x)</span>
                        <span>Molto Sensibile (2.0x)</span>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-[3rem] flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800">Notifiche Copertura</p>
                        <p className="text-xs text-slate-400">Avvisami quando il timer scade</p>
                    </div>
                    <button onClick={async () => { if (Notification.permission !== 'granted') await Notification.requestPermission(); setEnableNotifications(!enableNotifications); }} className={cn("w-14 h-8 rounded-full relative transition-all", enableNotifications ? "bg-emerald-500" : "bg-slate-200")}>
                        <motion.div animate={{ x: enableNotifications ? 24 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" />
                    </button>
                 </div>
               </div>
            </motion.div>
          )}

          {view === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
               <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all text-xs font-black uppercase tracking-widest group">
                 <ChevronLeft size={16} /> Annulla
               </button>
               <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome del Piatto</label>
                        <input type="text" placeholder="Es: Pizza con Salame e..." value={builderData.baseName} onChange={(e) => setBuilderData({ ...builderData, baseName: e.target.value })} onBlur={(e) => analyzeBaseDish(e.target.value)} className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold text-slate-700 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggiungi Ingredienti/Topping</label>
                        <div className="relative group">
                          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input type="text" placeholder="Cerca topping (es. mozzarella)..." value={builderSearch} onChange={(e) => { setBuilderSearch(e.target.value); setShowBuilderSearch(true); }} onFocus={() => setShowBuilderSearch(true)} className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-2xl outline-none transition-all shadow-inner font-medium text-sm" />
                          <AnimatePresence>
                            {showBuilderSearch && builderSearch.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 w-full mt-3 bg-white border border-slate-200 shadow-2xl rounded-3xl max-h-48 overflow-y-auto p-2 scrollbar-thin">
                                {Object.entries(FOODS_DATA).filter(([_, f]) => f.name.toLowerCase().includes(builderSearch.toLowerCase()) && f.lactoseMode !== 'builder').map(([key, f]) => (
                                    <button key={key} onClick={() => handleAddIngredientToBuilder(key)} className="w-full text-left p-3 hover:bg-primary/5 rounded-xl flex items-center justify-between transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{f.name}</span>
                                            {f.category && <span className="text-[9px] text-slate-400 uppercase font-black">{f.category}</span>}
                                        </div>
                                        <Plus size={14} className="text-primary" />
                                    </button>
                                ))}
                                </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                    </div>
                  </div>
                  
                  {(builderData.ingredients.length > 0 || builderData.hiddenIngredients.length > 0) && (
                    <div className="space-y-6">
                        {builderData.ingredients.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingredienti Aggiunti</p>
                                <div className="flex flex-wrap gap-2">
                                    {builderData.ingredients.map((ing, idx) => (
                                        <div key={idx} className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-xs flex items-center gap-2">
                                            {ing.name}
                                            <button onClick={() => setBuilderData({...builderData, ingredients: builderData.ingredients.filter((_, i) => i !== idx)})} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {builderData.hiddenIngredients.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} className="text-primary" /> Componenti Rilevati (Tocca per escludere)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {builderData.hiddenIngredients.map((ing, idx) => (
                                        <button key={idx} onClick={() => {
                                            const newHidden = [...builderData.hiddenIngredients];
                                            newHidden[idx].isActive = !newHidden[idx].isActive;
                                            setBuilderData({...builderData, hiddenIngredients: newHidden});
                                        }} className={cn("p-5 rounded-2xl border-2 transition-all flex items-center justify-between group", ing.isActive ? "bg-white border-primary/20 text-slate-700 shadow-sm" : "bg-slate-50 border-transparent text-slate-300")}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full", ing.isActive ? "bg-emerald-500" : "bg-slate-200")} />
                                                <span className={cn("font-bold text-sm", !ing.isActive && "line-through")}>{ing.name}</span>
                                            </div>
                                            {ing.isActive ? <CheckCircle2 size={16} className="text-emerald-500" /> : <X size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  )}
                  <button onClick={confirmDish} className="w-full py-6 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                    <CheckCircle2 size={24} /> Conferma Piatto Composto
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center relative z-10">
           <button onClick={() => setView('faq')} className="text-slate-400 hover:text-primary transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest group"><HelpCircle size={16} /> FAQ & Guide</button>
           <div className="flex flex-col items-end gap-2">
             <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">GoodLact v3.0</p>
             <div className="flex items-center gap-2 text-slate-200/50">
               <span className="text-[8px] font-bold uppercase tracking-wider">Powered by</span>
               <svg id="Avatar_Logo" viewBox="0 0 304.55 55.49" className="h-4 w-auto fill-current opacity-80" xmlns="http://www.w3.org/2000/svg">
                 <g>
                    <path d="M.96,1.04h-.96v2.37h.96c1.47,0,1.82,0,1.82,1.98v44.81c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V5.38c0-1.98.35-1.98,1.82-1.98h.96V1.04H.96Z"/><path d="M50.95,41.8h-.96v.96c0,8.26-.53,8.75-4.72,8.75h-9.43V5.38c0-1.98.35-1.98,1.82-1.98h.96V1.04h-9.88v2.37h.96c1.47,0,1.82,0,1.82,1.98v44.81c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h23.45v-12.67h-1.25Z"/><path d="M83.32,47.68h-.96v.96c0,2.4-1.07,3.89-2.79,3.89-1.62,0-2.44-3.22-2.44-9.56V1.04h-7.09v2.29h.96c1.36,0,1.82,0,1.82,1.98v28.69c0,12.04-4.36,18.53-8.47,18.53-4.85,0-5.23-6.98-5.23-9.12V1.04h-7.09v2.29h.96c1.36,0,1.82,0,1.82,1.98v37.08c0,7.59,4.01,13.1,9.54,13.1,3.7,0,6.82-2.22,9.14-6.48,1.19,5.26,3.75,6.48,5.86,6.48,3.9,0,5.68-3.55,5.68-6.85v-.96h-1.7Z"/><path d="M115.7,1.04h-.66l-.24.61-11.59,29.7L93.1,1.69l-.22-.65h-7.39v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h8.29v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V9.22s.02.05.03.08c1.71,4.99,4.55,13.32,9.4,27.63l-3.17,8.28c-1.05,2.55-.78,5.84.66,7.98.99,1.48,2.49,2.3,4.22,2.3,1.88,0,3.46-.82,4.58-2.38,1.55-2.16,1.98-5.58,1.05-8.31l-3.18-9.38,10.62-27.14v41.91c0,1.98-.39,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V5.31c0-1.98.46-1.98,1.82-1.98h.96V1.04h-6.59ZM103.72,51.35c-.58.9-1.45,1.17-1.61,1.19-.73,0-1.3-.31-1.73-.93-1.05-1.51-.98-4.35-.47-5.71l1.92-4.87c.59,1.77,1.24,3.68,1.95,5.67.67,1.96.65,3.57-.05,4.66Z"/><path d="M130.01,7.75c.27,0,.54-.04.8-.12,1.66-.51,2.68-2.54,2.31-4.62-.33-1.78-1.6-3.01-3.1-3.01h0c-.27,0-.54.04-.8.12-1.72.51-2.74,2.49-2.37,4.62.32,1.75,1.65,3.01,3.16,3.01Z"/><path d="M132.17,50.19V13.62c0-2.27-1.47-4.05-3.35-4.05h-3.75v2.29h.96c1.47,0,1.82,0,1.82,1.98v36.35c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98Z"/><path d="M167.39,1.04h-7.32v2.29h.96c1.36,0,1.82,0,1.82,1.98v36.94L144.53,1.6l-.26-.57h-6.53v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h8.29v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V9.5l20.47,45.41h1.85V5.31c0-1.98.39-1.98,1.82-1.98h.96V1.04h-.96Z"/><path d="M205.62,47.68h-.96v.96c0,2.87-1.41,3.89-2.73,3.89-1.66,0-2.5-3.22-2.5-9.56V15.68C199.42,8.45,195.91,0,186.02,0c-4.81,0-11.28,2.6-13.69,9.93l-.28.85.83.34,2.5,1.03,1.01.42.29-1.05c1.72-6.32,6.2-8.56,9.52-8.56,7.86,0,8.92,7.06,8.92,13.97v2.95c-9.7.18-24.82,3.27-24.82,20.67,0,8.8,5.07,14.94,12.32,14.94,5.54,0,9.81-3.14,12.72-9.34.66,6.2,2.79,9.34,6.37,9.34,4.12,0,5.62-4.1,5.62-6.85v-.96h-1.7ZM182.61,52.54c-5.09,0-8.01-4.37-8.01-11.99,0-15.83,14.62-17.89,20.51-18.08v4.61c0,5.97-.9,25.45-12.5,25.45Z"/><path d="M234.87,49.28l-12.8-19.41c.2.01.4.02.59.02,5.99,0,12.04-4.92,12.04-15.9,0-8.23-4.91-12.96-13.46-12.96h-12.55v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98v-21.49l14.76,22.24c1.47,2.24,3.67,3.52,6.03,3.52h2.78v-2.29h-.96c-1.25,0-1.72-.27-3.52-2.89ZM221.58,26.49c-1.74,0-3.55-.61-5.37-1.83l-.42-.28V5.31c0-.84,2.07-1.32,5.68-1.32,3.17,0,8.52,2.14,8.52,10.15,0,7.16-3.54,12.35-8.41,12.35Z"/><path d="M246.22,7.75c.27,0,.54-.04.8-.12,1.66-.51,2.68-2.54,2.31-4.62-.33-1.78-1.6-3.01-3.1-3.01h0c-.27,0-.54.04-.8.12-1.72.51-2.74,2.49-2.37,4.62.32,1.75,1.65,3.01,3.16,3.01Z"/><path d="M250.21,52.17c-1.36,0-1.82,0-1.82-1.98V13.62c0-2.27-1.47-4.05-3.35-4.05h-3.75v2.29h.96c1.47,0,1.82,0,1.82,1.98v36.35c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96Z"/><path d="M272.67,15.88c2.22-1.52,3.69-4.12,3.69-7.08,0-4.97-4.03-8.31-10.04-8.31-4.38,0-7.91,1.94-9.2,5.06-1.13,2.73-.32,5.84,2.16,8.32l.57.57,2.39-.9-.62-1.24c-1.17-2.32-1.26-4.51-.24-6.15.99-1.6,2.94-2.56,5.21-2.56,3.64,0,5.48,1.73,5.48,5.14,0,5.49-5.51,5.91-7.2,5.91h-1.24v3.13h1.24c4.09,0,8.45.51,8.45,6.6,0,4.77-3.38,6.9-6.73,6.9-2.27,0-4.22-.96-5.21-2.56-1.01-1.64-.93-3.83.24-6.15l.62-1.24-2.39-.9-.57.57c-2.48,2.48-3.29,5.59-2.16,8.32,1.29,3.12,4.82,5.06,9.2,5.06,4.69,0,11.29-3.1,11.29-9.99,0-4.67-2.36-7.22-4.94-8.48Z"/><path d="M287.53,1.09h-10.04v2.75h1.24c.48,0,.72.02.83.05.02.07.04.2.04.43v26.25c0,.23-.02.36-.04.42-.1.03-.32.06-.83.06h-1.24v2.7h10.04c12.55,0,17.02-8.41,17.02-16.29s-4.47-16.37-17.02-16.37ZM287.71,30.66c-2.55,0-3.47-.21-3.8-.35V4.56c.31-.13,1.22-.38,3.8-.38,5.65,0,12.25,3.48,12.25,13.28s-6.33,13.2-12.25,13.2Z"/><path d="M264.3,41.89h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M290.3,41.89h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M277.3,50.17h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M303.3,50.17h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/>
                 </g>
               </svg>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GoodLactApp;
