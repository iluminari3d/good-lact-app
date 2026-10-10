import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SYNC_KEYS } from '../lib/sync';
import { SAVE_EVENT, load, remove, save } from '../lib/storage';
import { clearSyncMeta, noteLocalChange, syncNow as runSync } from './engine';
import { SyncContext, type SyncState, type SyncStatus } from './context';

type Client = typeof import('./firebaseClient');

const HINT_KEY = 'account_hint';
const EMAIL_KEY = 'account_email_pending';
const PUSH_DELAY_MS = 3000;

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function friendlyError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Accesso annullato.';
    case 'auth/popup-blocked':
      return 'Il browser ha bloccato la finestra di accesso. Consentila e riprova.';
    case 'auth/unauthorized-domain':
      return 'Questo indirizzo non è autorizzato in Firebase. Aggiungilo in Authentication → Impostazioni → Domini autorizzati.';
    case 'auth/operation-not-allowed':
      return 'Questo metodo di accesso non è ancora attivo nel progetto Firebase.';
    case 'auth/invalid-email':
      return "L'indirizzo email non è valido.";
    case 'auth/expired-action-code':
    case 'auth/invalid-action-code':
      return 'Il link non è più valido. Richiedine uno nuovo.';
    case 'auth/requires-recent-login':
      return 'Per eliminare l\'account devi prima accedere di nuovo: esci, rientra e riprova.';
    case 'auth/network-request-failed':
      return 'Connessione assente. Riprova.';
    case 'permission-denied':
      return 'Il cloud ha rifiutato la richiesta (regole di sicurezza). Controlla le regole di Firestore.';
    default:
      return 'Qualcosa è andato storto. Riprova.';
  }
}

/** Firebase si carica all'avvio solo se c'è già un account o si rientra da un link email. */
const needsFirebaseAtStart = () =>
  load<boolean>(HINT_KEY, false, isBool) || /[?&]oobCode=/.test(window.location.search);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(() => (needsFirebaseAtStart() ? 'loading' : 'signedOut'));
  const [email, setEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const clientRef = useRef<Client | null>(null);
  const uidRef = useRef<string | null>(null);
  const lockRef = useRef<Promise<void>>(Promise.resolve());
  const timerRef = useRef<number | undefined>(undefined);

  const ensureClient = useCallback(async (): Promise<Client> => {
    clientRef.current ??= await import('./firebaseClient');
    return clientRef.current;
  }, []);

  const doSync = useCallback(async () => {
    const client = clientRef.current;
    const uid = uidRef.current;
    if (!client || !uid) return;
    // Un solo ciclo alla volta: gli altri aspettano e poi ne fanno uno nuovo.
    const run = lockRef.current.then(async () => {
      setSyncing(true);
      try {
        const outcome = await runSync(uid, client);
        setLastSync(outcome.syncedAt);
        if (outcome.localChanged) setVersion((v) => v + 1);
        setMessage(null);
      } catch (error) {
        console.error('sync fallita', error instanceof Error ? error.message : error);
        setMessage(friendlyError(error));
      } finally {
        setSyncing(false);
      }
    });
    lockRef.current = run.catch(() => {});
    await run;
  }, []);

  // All'avvio: si carica Firebase solo se c'è già un account o si sta rientrando da un link email.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    if (!needsFirebaseAtStart()) return;
    const looksLikeEmailLink = /[?&]oobCode=/.test(window.location.search);

    void (async () => {
      try {
        const client = await ensureClient();
        if (cancelled) return;
        if (looksLikeEmailLink && client.isEmailLink(window.location.href)) {
          const pending = load<string>(EMAIL_KEY, '', (v): v is string => typeof v === 'string');
          const address = pending || window.prompt("Conferma la tua email per completare l'accesso") || '';
          try {
            if (address) await client.completeEmailLink(address, window.location.href);
            remove(EMAIL_KEY);
          } catch (error) {
            setMessage(friendlyError(error));
          }
          window.history.replaceState({}, '', window.location.pathname);
        }
        unsubscribe = client.watchUser((user) => {
          uidRef.current = user?.uid ?? null;
          setEmail(user?.email ?? null);
          setStatus(user ? 'signedIn' : 'signedOut');
          if (user) {
            save(HINT_KEY, true);
            void doSync();
          }
        });
      } catch (error) {
        console.error('Firebase non disponibile', error instanceof Error ? error.message : error);
        setStatus('signedOut');
        setMessage('Servizio account non raggiungibile.');
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [ensureClient, doSync]);

  // Con l'account attivo: sincronizza poco dopo ogni modifica e quando l'app torna in primo piano.
  useEffect(() => {
    if (status !== 'signedIn') return;
    const onSave = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (!key || !(SYNC_KEYS as readonly string[]).includes(key)) return;
      noteLocalChange(key);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => void doSync(), PUSH_DELAY_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void doSync();
    };
    window.addEventListener(SAVE_EVENT, onSave);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(SAVE_EVENT, onSave);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearTimeout(timerRef.current);
    };
  }, [status, doSync]);

  const signInGoogle = useCallback(async () => {
    setMessage(null);
    try {
      const client = await ensureClient();
      await client.signInWithGoogle();
      // Dopo il reload l'app riconosce l'account e fa la prima sincronizzazione.
      save(HINT_KEY, true);
      window.location.reload();
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }, [ensureClient]);

  const sendLink = useCallback(async (address: string) => {
    setMessage(null);
    try {
      const client = await ensureClient();
      await client.sendEmailLink(address.trim());
      save(EMAIL_KEY, address.trim());
      setMessage('Ti ho inviato un link: aprilo da questo stesso telefono per accedere.');
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }, [ensureClient]);

  const signOut = useCallback(async () => {
    const client = await ensureClient();
    await client.signOut();
    remove(HINT_KEY);
    clearSyncMeta();
    uidRef.current = null;
    setLastSync(null);
    setMessage(null);
  }, [ensureClient]);

  const deleteAccount = useCallback(async () => {
    setMessage(null);
    try {
      const client = await ensureClient();
      await client.deleteAccountAndData(SYNC_KEYS);
      remove(HINT_KEY);
      clearSyncMeta();
      setMessage('Account e dati nel cloud eliminati. I dati su questo telefono restano.');
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }, [ensureClient]);

  const value = useMemo<SyncState>(
    () => ({ status, email, syncing, lastSync, message, version, signInGoogle, sendLink, signOut, syncNow: doSync, deleteAccount }),
    [status, email, syncing, lastSync, message, version, signInGoogle, sendLink, signOut, doSync, deleteAccount],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
