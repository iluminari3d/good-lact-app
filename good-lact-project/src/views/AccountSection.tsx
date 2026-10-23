import { useState } from 'react';
import { Cloud, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import { useSync } from '../sync/context';

export function AccountSection() {
  const sync = useSync();
  const [email, setEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (sync.status === 'unavailable') return null;

  return (
    <section aria-label="Account e sincronizzazione" className="p-8 bg-slate-50 rounded-[3rem] space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Cloud size={16} /> Account e sincronizzazione</p>
        <p className="text-xs text-slate-600">
          Accedi per ritrovare profilo, esperienze e diario su tutti i tuoi dispositivi. Senza accesso l'app funziona
          come sempre, con i dati solo su questo telefono.
        </p>
      </div>

      {sync.status === 'loading' && <p className="text-xs text-slate-600 font-medium">Controllo l'account…</p>}

      {sync.status === 'signedOut' && (
        <div className="space-y-3">
          <button type="button" onClick={() => void sync.signInGoogle()} className="w-full py-3 bg-white rounded-2xl font-black text-slate-700 shadow-sm">
            Accedi con Google
          </button>
          <div className="space-y-2">
            <label htmlFor="account-email" className="text-xs font-black text-slate-600 uppercase tracking-widest">Oppure ricevi un link via email</label>
            <div className="flex gap-2">
              <input
                id="account-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.it"
                className="flex-1 min-w-0 p-3 bg-white rounded-2xl outline-none font-semibold text-slate-700"
              />
              <button type="button" disabled={!email.includes('@')} onClick={() => void sync.sendLink(email)} className="px-4 bg-primary text-white rounded-2xl font-black disabled:opacity-40">
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {sync.status === 'signedIn' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 break-all">Collegato come {sync.email ?? 'utente'}</p>
          <p className="text-xs text-slate-600 font-medium" role="status">
            {sync.syncing
              ? 'Sincronizzazione in corso…'
              : sync.lastSync
                ? `Ultima sincronizzazione: ${new Date(sync.lastSync).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                : 'Non ancora sincronizzato.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => void sync.syncNow()} disabled={sync.syncing} className="py-3 bg-white rounded-2xl font-black text-slate-600 flex items-center justify-center gap-2 disabled:opacity-40">
              <RefreshCw size={16} /> Sincronizza
            </button>
            <button type="button" onClick={() => void sync.signOut()} className="py-3 bg-white rounded-2xl font-black text-slate-600 flex items-center justify-center gap-2">
              <LogOut size={16} /> Esci
            </button>
          </div>
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-black text-slate-600 uppercase tracking-widest hover:text-red-500 flex items-center gap-2">
              <Trash2 size={14} /> Elimina account e dati nel cloud
            </button>
          ) : (
            <div className="p-4 bg-red-50 rounded-2xl space-y-3" role="alertdialog" aria-label="Conferma eliminazione">
              <p className="text-xs font-semibold text-red-800">
                Verranno cancellati l'account e tutti i dati salvati nel cloud. I dati su questo telefono restano.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} className="py-2 bg-white rounded-xl font-black text-slate-600">Annulla</button>
                <button type="button" onClick={() => { setConfirmDelete(false); void sync.deleteAccount(); }} className="py-2 bg-red-600 text-white rounded-xl font-black">Elimina</button>
              </div>
            </div>
          )}
        </div>
      )}

      {sync.message && <p role="status" className="text-xs font-semibold text-slate-600">{sync.message}</p>}
      <p className="text-xs text-slate-600 font-medium">
        I dati sono salvati su Firebase (Google) e visibili solo al tuo account. Sono dati di salute: non vengono
        usati per pubblicità né condivisi.
      </p>
    </section>
  );
}
