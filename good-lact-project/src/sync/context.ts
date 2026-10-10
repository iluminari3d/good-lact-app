import { createContext, useContext } from 'react';

export type SyncStatus =
  /** Servizio non attivo in questa schermata (es. nei test). */
  | 'unavailable'
  | 'loading'
  | 'signedOut'
  | 'signedIn';

export interface SyncState {
  status: SyncStatus;
  email: string | null;
  syncing: boolean;
  lastSync: number | null;
  /** Messaggio da mostrare all'utente (errore o conferma), già in italiano. */
  message: string | null;
  /** Cambia quando arrivano dati nuovi dal cloud: serve a ricaricare la schermata. */
  version: number;
  signInGoogle: () => Promise<void>;
  sendLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const noop = async () => {};

export const DEFAULT_SYNC: SyncState = {
  status: 'unavailable',
  email: null,
  syncing: false,
  lastSync: null,
  message: null,
  version: 0,
  signInGoogle: noop,
  sendLink: noop,
  signOut: noop,
  syncNow: noop,
  deleteAccount: noop,
};

export const SyncContext = createContext<SyncState>(DEFAULT_SYNC);

export const useSync = () => useContext(SyncContext);
