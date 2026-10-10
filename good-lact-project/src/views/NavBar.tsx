import { FileText, Home, LayoutGrid, NotebookPen, ScanLine, Settings, ThumbsUp, UtensilsCrossed, History, HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { mobileTabFor, sidebarItemFor, type NavView } from './navigation';

interface Item { view: NavView; label: string; icon: ReactNode }

const TABS: Item[] = [
  { view: 'main', label: 'Pasto', icon: <Home size={22} /> },
  { view: 'label', label: 'Etichetta', icon: <ScanLine size={22} /> },
  { view: 'restaurant', label: 'Ristorante', icon: <UtensilsCrossed size={22} /> },
  { view: 'diary', label: 'Diario', icon: <NotebookPen size={22} /> },
  { view: 'more', label: 'Altro', icon: <LayoutGrid size={22} /> },
];

const SIDEBAR: Item[] = [
  { view: 'main', label: 'Pasto', icon: <Home size={20} /> },
  { view: 'label', label: 'Etichetta', icon: <ScanLine size={20} /> },
  { view: 'restaurant', label: 'Ristorante', icon: <UtensilsCrossed size={20} /> },
  { view: 'diary', label: 'Diario sintomi', icon: <NotebookPen size={20} /> },
  { view: 'experiences', label: 'Le mie esperienze', icon: <ThumbsUp size={20} /> },
  { view: 'report', label: 'Report medico', icon: <FileText size={20} /> },
  { view: 'history', label: 'Storico', icon: <History size={20} /> },
  { view: 'settings', label: 'Profilo', icon: <Settings size={20} /> },
  { view: 'faq', label: 'FAQ e guide', icon: <HelpCircle size={20} /> },
];

interface Props {
  view: string;
  onNavigate: (view: NavView) => void;
}

/** Barra fissa in basso su telefono, barra laterale su schermi grandi. */
export function NavBar({ view, onNavigate }: Props) {
  const activeTab = mobileTabFor(view);
  const activeSide = sidebarItemFor(view);

  return (
    <>
      <nav
        aria-label="Navigazione principale"
        className="lg:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5 max-w-xl mx-auto">
          {TABS.map((t) => (
            <li key={t.view}>
              <button
                type="button"
                onClick={() => onNavigate(t.view)}
                aria-current={activeTab === t.view ? 'page' : undefined}
                className={cn(
                  'w-full flex flex-col items-center gap-1 pt-3 pb-2 text-[10px] font-black uppercase tracking-wider transition-colors',
                  activeTab === t.view ? 'text-primary' : 'text-slate-400 hover:text-primary',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <aside
        aria-label="Barra laterale"
        className="hidden lg:flex print:hidden fixed inset-y-0 left-0 z-40 w-64 flex-col gap-6 bg-white border-r border-slate-100 p-5"
      >
        <button type="button" onClick={() => onNavigate('main')} aria-label="Vai alla schermata principale" className="px-2 pt-2">
          <img src="/Good Lact Lungo.svg" alt="Good Lact" className="h-14 w-auto" />
        </button>
        <nav aria-label="Menu laterale">
          <ul className="space-y-1">
            {SIDEBAR.map((item) => (
              <li key={item.view}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.view)}
                  aria-current={activeSide === item.view ? 'page' : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors text-left',
                    activeSide === item.view ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-primary',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
