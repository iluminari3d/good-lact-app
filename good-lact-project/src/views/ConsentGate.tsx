import { useState } from 'react';
import { TermsText } from './TermsView';

/** Schermata a pieno schermo da accettare al primo avvio (e quando i termini cambiano). */
export function ConsentGate({ onAccept, updated }: { onAccept: () => void; updated: boolean }) {
  const [healthConsent, setHealthConsent] = useState(false);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="consent-title" className="fixed inset-0 z-[100] bg-white flex flex-col print:hidden">
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4 max-w-2xl w-full mx-auto space-y-5">
        <h1 id="consent-title" className="text-2xl font-black text-slate-800">
          {updated ? 'Abbiamo aggiornato i termini' : 'Prima di iniziare'}
        </h1>
        <p className="text-sm text-slate-600 font-medium">
          Good Lact è un aiuto pratico, non un parere medico. Leggi come usiamo i tuoi dati: sono anche dati di salute.
        </p>
        <TermsText />
      </div>
      <div className="border-t border-slate-100 p-4 max-w-2xl w-full mx-auto space-y-3" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <label className="flex items-start gap-3 text-sm text-slate-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={healthConsent}
            onChange={(e) => setHealthConsent(e.target.checked)}
            className="mt-0.5 w-6 h-6 shrink-0 accent-primary"
          />
          <span>
            Acconsento al trattamento dei miei dati sulla salute (assunzioni di lattasi, sintomi, diario) per far funzionare l'app, come spiegato sopra.
            Posso revocarlo in ogni momento cancellando i dati da Impostazioni.
          </span>
        </label>
        <button
          type="button"
          onClick={onAccept}
          disabled={!healthConsent}
          className="w-full py-4 bg-primary text-white font-black rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ho letto e accetto
        </button>
      </div>
    </div>
  );
}
