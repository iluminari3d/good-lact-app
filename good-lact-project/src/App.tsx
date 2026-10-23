import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Settings as SettingsIcon, HelpCircle, X } from 'lucide-react';
import { AvatarLogo } from './components/AvatarLogo';
import { LACTASE_DATA } from './data/goodLactData';
import { useCoverageTimer } from './hooks/useCoverageTimer';
import { useDailyLog } from './hooks/useDailyLog';
import { useExperiences } from './hooks/useExperiences';
import { useSymptoms } from './hooks/useSymptoms';
import { cn } from './lib/cn';
import { pendingCheck } from './lib/diary';
import { estimateDose, isLactoseFreeMeal } from './lib/dose';
import { acceptTerms, loadConsent, needsConsent, type Consent } from './lib/consent';
import { matchExperiences } from './lib/experiences';
import { formatTime } from './lib/format';
import { buildReport } from './lib/report';
import type { PreparedImage } from './lib/image';
import { load, newId, save } from './lib/storage';
import { AnalysisError, analyzeDish } from './services/api';
import type { Dish, DoseEstimate, MealItem } from './types';
import { DiaryView } from './views/DiaryView';
import { DishView } from './views/DishView';
import { ExperiencesView } from './views/ExperiencesView';
import { FaqView } from './views/FaqView';
const DatabaseView = lazy(() => import('./views/DatabaseView').then((m) => ({ default: m.DatabaseView })));
import { HistoryView } from './views/HistoryView';
import { LabelView } from './views/LabelView';
import { LactoseFreeView } from './views/LactoseFreeView';
import { MainView } from './views/MainView';
import { ReportView } from './views/ReportView';
import { RestaurantView } from './views/RestaurantView';
import { ResultsView } from './views/ResultsView';
import { SettingsView } from './views/SettingsView';
import { SymptomCheckCard } from './views/SymptomCheckCard';
import { TimerView } from './views/TimerView';
import { OfflineBar } from './components/OfflineBar';
import { ConsentGate } from './views/ConsentGate';
import { MoreView } from './views/MoreView';
import { TermsView } from './views/TermsView';
import { NavBar } from './views/NavBar';
import type { NavView } from './views/navigation';
import { applyTextScale, isTextScale, type TextScale } from './lib/textScale';

type View = 'dish' | 'results' | 'timer' | 'lactose-free' | NavView;

interface Settings {
  sensitivity: number;
  /** Profilo di intolleranza severa (attivo di default, per prudenza). */
  severe: boolean;
  notifications: boolean;
  lactaseKey: string;
  customFcc: number | '';
  /** Dimensione del testo: l'app non si può ingrandire con il pizzico, quindi si sceglie qui. */
  textScale?: TextScale;
}

interface DishDraft {
  /** Se valorizzato si sta modificando un piatto già nel pasto. */
  itemId?: string;
  dish: Dish;
}

const DEFAULT_SETTINGS: Settings = { sensitivity: 1, severe: true, notifications: false, lactaseKey: '', customFcc: '', textScale: 'normal' };

function isSettings(v: unknown): v is Settings {
  if (!v || typeof v !== 'object') return false;
  const s = v as Settings;
  return (
    typeof s.sensitivity === 'number' && s.sensitivity >= 0.5 && s.sensitivity <= 2 &&
    (s.severe === undefined || typeof s.severe === 'boolean') &&
    typeof s.notifications === 'boolean' &&
    typeof s.lactaseKey === 'string' &&
    (s.customFcc === '' || typeof s.customFcc === 'number') &&
    (s.textScale === undefined || isTextScale(s.textScale))
  );
}

function initialSettings(): Settings {
  const saved: Settings = { ...DEFAULT_SETTINGS, ...load<Settings>('settings', DEFAULT_SETTINGS, isSettings) };
  return saved.lactaseKey && !LACTASE_DATA[saved.lactaseKey] ? { ...saved, lactaseKey: '' } : saved;
}

export default function App() {
  const [view, setView] = useState<View>('main');
  const [consent, setConsent] = useState<Consent | null>(loadConsent);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [meal, setMeal] = useState<MealItem[]>([]);
  const [draft, setDraft] = useState<DishDraft | null>(null);
  const [estimate, setEstimate] = useState<DoseEstimate | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const timer = useCoverageTimer(settings.notifications);
  const log = useDailyLog();
  const experiences = useExperiences();
  const symptoms = useSymptoms();
  // "Adesso" cambia ogni minuto: basta per far comparire la domanda sui sintomi.
  const [minuteNow, setMinuteNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setMinuteNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => applyTextScale(settings.textScale ?? 'normal'), [settings.textScale]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const fccPerPill = useMemo(() => {
    if (settings.lactaseKey === 'custom') return Number(settings.customFcc) || 0;
    return LACTASE_DATA[settings.lactaseKey]?.fcc ?? 0;
  }, [settings.lactaseKey, settings.customFcc]);

  const patchSettings = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const goMain = useCallback(() => setView('main'), []);

  const handleAnalyze = async ({ description, image }: { description: string; image: PreparedImage | null }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const dish = await analyzeDish(
        {
          description: description.trim() || undefined,
          image: image ? { mimeType: image.mimeType, data: image.data } : undefined,
        },
        controller.signal,
      );
      setDraft({ dish });
      setView('dish');
    } catch (error) {
      if (controller.signal.aborted) return;
      setAnalysisError(error instanceof AnalysisError ? error.message : "Qualcosa è andato storto. Riprova.");
    } finally {
      if (abortRef.current === controller) setIsAnalyzing(false);
    }
  };

  const handleCompose = () => {
    setDraft({ dish: { name: '', ingredients: [] } });
    setView('dish');
  };

  const handleEditDish = (id: string) => {
    const item = meal.find((m) => m.id === id);
    if (!item?.dish) return;
    setDraft({ itemId: id, dish: structuredClone(item.dish) });
    setView('dish');
  };

  const handleConfirmDish = () => {
    if (!draft) return;
    const name = draft.dish.name.trim() || 'Piatto personalizzato';
    const dish: Dish = { ...draft.dish, name };
    if (draft.itemId) {
      setMeal((prev) => prev.map((m) => (m.id === draft.itemId ? { ...m, name, dish } : m)));
    } else {
      setMeal((prev) => [...prev, { id: newId(), kind: 'dish', name, quantity: 1, unit: 'porzione', dish }]);
    }
    setDraft(null);
    setView('main');
  };

  const handleCalculate = () => {
    const result = estimateDose(meal, fccPerPill, settings.sensitivity, { severe: settings.severe });
    setEstimate(result);
    setView(isLactoseFreeMeal(result) ? 'lactose-free' : 'results');
  };

  const handleTake = (pills: number) => {
    log.addConsumption(pills, meal.map((m) => m.name));
    timer.start();
    setView('timer');
  };

  const handleTakeAnother = () => {
    log.addConsumption(1, meal.length > 0 ? meal.map((m) => m.name) : ['Altra compressa']);
    timer.start();
  };

  const experienceMatches = useMemo(() => {
    const names = meal.flatMap((m) => [m.name, ...(m.dish?.ingredients.filter((i) => i.active).map((i) => i.name) ?? [])]);
    return matchExperiences(names, experiences.experiences);
  }, [meal, experiences.experiences]);

  const pending = useMemo(
    () => pendingCheck([...log.consumptions, ...log.history.flatMap((h) => h.consumptions)], symptoms.entries, minuteNow),
    [log.consumptions, log.history, symptoms.entries, minuteNow],
  );

  const report = useMemo(
    () => (view === 'report' ? buildReport(log.consumptions, log.history, symptoms.entries) : null),
    [view, log.consumptions, log.history, symptoms.entries],
  );

  const handleNewMeal = () => {
    setMeal([]);
    setEstimate(null);
    setAnalysisError(null);
    setView('main');
  };

  const canCalculate = meal.length > 0 && fccPerPill > 0;

  return (
    <>
    {needsConsent(consent) && <ConsentGate updated={consent !== null} onAccept={() => setConsent(acceptTerms())} />}
    <OfflineBar />
    <NavBar view={view} onNavigate={setView} />
    <div className="lg:pl-64 min-h-screen">
    <div className="max-w-3xl mx-auto p-4 md:p-8 lg:p-12 pb-32 lg:pb-12 min-h-screen flex flex-col font-montserrat antialiased relative">
      <div className="w-full relative z-10">
        <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none">
          <div aria-hidden className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div aria-hidden className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary-light/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Stato e scorciatoie */}
        <div className="flex justify-between items-center mb-12 relative z-10 print:hidden">
          <div className="flex items-center gap-4">
            <div className={cn('w-2.5 h-2.5 rounded-full', timer.isRunning ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300')} />
            <button type="button" onClick={() => setView('timer')} className="flex flex-col text-left">
              <span className="text-xs font-black text-slate-600 uppercase tracking-[0.15em] leading-none">Stato</span>
              <span className="text-xs font-bold text-slate-600 mt-1">
                {timer.isRunning ? `Protetto (${formatTime(timer.timeLeft)})` : 'Non protetto'}
              </span>
            </button>
            {timer.isRunning && (
              <button type="button" aria-label="Interrompi la copertura" onClick={timer.stop} className="p-1.5 text-slate-600 hover:text-red-500 transition-all">
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setView('history')} className="flex items-center gap-3 group" aria-label="Storico assunzioni">
              <span className="flex flex-col items-end">
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest leading-none">Compresse oggi</span>
                <span className="text-sm font-black text-primary mt-1">{log.dailyPills}</span>
              </span>
              <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <History size={20} />
              </span>
            </button>
            <button type="button" aria-label="Impostazioni" onClick={() => setView('settings')} className="p-2 text-slate-600 hover:text-primary transition-all">
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {/* Intestazione */}
        <div className="text-center mb-12 print:hidden lg:hidden">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-4">
            <button type="button" onClick={goMain} aria-label="Torna alla schermata iniziale">
              <img src="/Good Lact Lungo.svg" alt="Good Lact" className="h-24 md:h-28 w-auto hover:scale-105 transition-transform duration-500" />
            </button>
          </motion.div>
        </div>

        {view === 'main' && pending && (
          <div className="mb-10">
            <SymptomCheckCard
              consumption={pending}
              onAnswer={(severity) => symptoms.answer(pending, severity)}
              onSkip={() => symptoms.skip(pending)}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'main' && (
            <MainView
              key="main"
              lactaseKey={settings.lactaseKey}
              customFcc={settings.customFcc}
              onLactaseChange={(lactaseKey) => patchSettings({ lactaseKey })}
              onCustomFccChange={(customFcc) => patchSettings({ customFcc })}
              meal={meal}
              onMealChange={setMeal}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              onAnalyze={(input) => void handleAnalyze(input)}
              onCompose={handleCompose}
              onEditDish={handleEditDish}
              onCalculate={handleCalculate}
              canCalculate={canCalculate}
            />
          )}
          {view === 'dish' && draft && (
            <DishView
              key="dish"
              dish={draft.dish}
              isNew={!draft.itemId}
              severe={settings.severe}
              onChange={(dish) => setDraft({ ...draft, dish })}
              onConfirm={handleConfirmDish}
              onCancel={() => { setDraft(null); setView('main'); }}
            />
          )}
          {view === 'results' && estimate && (
            <ResultsView key="results" estimate={estimate} experiences={experienceMatches} onTake={handleTake} onAddMore={goMain} onNewMeal={handleNewMeal} />
          )}
          {view === 'lactose-free' && <LactoseFreeView key="lactose-free" onEdit={goMain} onNewMeal={handleNewMeal} />}
          {view === 'timer' && (
            <TimerView
              key="timer"
              timeLeft={timer.timeLeft}
              totalSeconds={timer.totalSeconds}
              isRunning={timer.isRunning}
              canExtend={timer.canExtend}
              onStop={timer.stop}
              onTakeAnother={handleTakeAnother}
              onBack={goMain}
            />
          )}
          {view === 'history' && (
            <HistoryView key="history" history={log.history} consumptions={log.consumptions} dailyPills={log.dailyPills} onBack={goMain} />
          )}
          {view === 'settings' && (
            <SettingsView
              key="settings"
              sensitivity={settings.sensitivity}
              severe={settings.severe}
              onSevereChange={(severe) => patchSettings({ severe })}
              onSensitivityChange={(sensitivity) => patchSettings({ sensitivity })}
              notifications={settings.notifications}
              onNotificationsChange={(notifications) => patchSettings({ notifications })}
              lactaseKey={settings.lactaseKey}
              customFcc={settings.customFcc}
              onLactaseChange={(lactaseKey) => patchSettings({ lactaseKey })}
              onCustomFccChange={(customFcc) => patchSettings({ customFcc })}
              textScale={settings.textScale ?? 'normal'}
              onTextScaleChange={(textScale) => patchSettings({ textScale })}
              onBack={goMain}
            />
          )}
          {view === 'label' && <LabelView key="label" onBack={goMain} />}
          {view === 'restaurant' && <RestaurantView key="restaurant" onBack={goMain} />}
          {view === 'experiences' && (
            <ExperiencesView key="experiences" experiences={experiences.experiences} onAdd={experiences.add} onRemove={experiences.remove} onBack={goMain} />
          )}
          {view === 'diary' && (
            <DiaryView
              key="diary"
              entries={symptoms.entries}
              sensitivity={settings.sensitivity}
              onApplySensitivity={(sensitivity) => patchSettings({ sensitivity })}
              onMarkBad={(name) => experiences.add(name, 'bad')}
              onRemove={symptoms.remove}
              onBack={goMain}
            />
          )}
          {view === 'report' && report && (
            <ReportView
              key="report"
              report={report}
              experiences={experiences.experiences}
              severe={settings.severe}
              sensitivity={settings.sensitivity}
              lactaseName={settings.lactaseKey === 'custom' ? `Personalizzata (${Number(settings.customFcc) || 0} FCC)` : (LACTASE_DATA[settings.lactaseKey]?.name ?? '')}
              onBack={goMain}
            />
          )}
          {view === 'faq' && <FaqView key="faq" onBack={goMain} />}
          {view === 'database' && (
            <Suspense key="database" fallback={<p className="text-sm text-slate-600 font-medium">Caricamento…</p>}>
              <DatabaseView onBack={() => setView('more')} />
            </Suspense>
          )}
          {view === 'more' && <MoreView key="more" onOpen={setView} />}
          {view === 'terms' && <TermsView key="terms" onBack={() => setView('more')} />}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center relative z-10 print:hidden">
          <button type="button" onClick={() => setView('faq')} className="text-slate-600 hover:text-primary transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest">
            <HelpCircle size={16} /> FAQ e guide
          </button>
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-slate-600 uppercase tracking-[0.2em] font-black">Good Lact v4.0</p>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Powered by</span>
              <AvatarLogo />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}
