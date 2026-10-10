import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<unknown>;
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/** "Installa l'app": Android e computer usano il prompt di sistema, iPhone mostra le istruzioni. */
export function InstallButton() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [hint, setHint] = useState(false);
  const ios = isIos();

  useEffect(() => {
    const before = (e: Event) => { e.preventDefault(); setEvent(e as InstallPromptEvent); };
    const done = () => { setInstalled(true); setEvent(null); };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  if (installed || (!event && !ios)) return null;

  const click = async () => {
    if (event) {
      await event.prompt();
      try { await event.userChoice; } catch { /* ignorato */ }
      setEvent(null);
    } else {
      setHint((h) => !h);
    }
  };

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => void click()} className="w-full p-5 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center gap-3 font-black">
        <Download size={20} /> Installa l'app sul telefono
      </button>
      {hint && <p className="text-xs text-slate-400 font-medium px-2">Su iPhone: tocca Condividi in Safari, poi «Aggiungi alla schermata Home».</p>}
    </div>
  );
}
