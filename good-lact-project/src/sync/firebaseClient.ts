// Unico file che importa Firebase: viene caricato solo quando serve (import dinamico),
// così chi non usa l'account non scarica nulla in più.
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, initializeFirestore, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig } from './firebaseConfig';

export interface RemoteDoc {
  json: string;
  updatedAt: number;
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
// Il long polling automatico evita problemi con reti e proxy che bloccano i WebSocket.
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

export interface AccountUser {
  uid: string;
  email: string | null;
}

const toUser = (u: User | null): AccountUser | null => (u ? { uid: u.uid, email: u.email } : null);

export function watchUser(callback: (user: AccountUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u) => callback(toUser(u)));
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function sendEmailLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, { url: `${window.location.origin}/`, handleCodeInApp: true });
}

export const isEmailLink = (url: string) => isSignInWithEmailLink(auth, url);

export async function completeEmailLink(email: string, url: string): Promise<void> {
  await signInWithEmailLink(auth, email, url);
}

export const signOut = () => fbSignOut(auth);

export async function readRemote(uid: string): Promise<Record<string, RemoteDoc>> {
  const snapshot = await getDocs(collection(db, 'users', uid, 'data'));
  const out: Record<string, RemoteDoc> = {};
  snapshot.forEach((d) => {
    const data = d.data();
    if (typeof data.json === 'string' && typeof data.updatedAt === 'number') {
      out[d.id] = { json: data.json, updatedAt: data.updatedAt };
    }
  });
  return out;
}

export async function writeRemote(uid: string, key: string, value: RemoteDoc): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'data', key), { json: value.json, updatedAt: value.updatedAt });
}

/** Cancella i dati nel cloud e poi l'account. Può richiedere un nuovo accesso recente. */
export async function deleteAccountAndData(keys: readonly string[]): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await Promise.all(keys.map((k) => deleteDoc(doc(db, 'users', user.uid, 'data', k))));
  await deleteUser(user);
}

/** Regione delle funzioni (vedi functions/index.js). */
const FUNCTIONS_REGION = 'europe-west1';

/**
 * Chiama una funzione Firebase. L'SDK allega da solo il token dell'utente.
 * Se non c'è un accesso restituisce { signedOut: true } senza fare alcuna richiesta.
 */
export async function callFunction(
  name: string,
  data: unknown,
  timeoutMs: number,
): Promise<{ signedOut: true } | { signedOut: false; data: unknown }> {
  await auth.authStateReady();
  if (!auth.currentUser) return { signedOut: true };
  const call = httpsCallable(getFunctions(app, FUNCTIONS_REGION), name, { timeout: timeoutMs });
  const result = await call(data);
  return { signedOut: false, data: result.data };
}
