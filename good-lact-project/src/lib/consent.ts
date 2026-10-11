import { load, save } from './storage';

/**
 * Versione dei termini e dell'informativa. Quando il testo cambia in modo sostanziale
 * si aggiorna questa data: tutti dovranno accettare di nuovo al prossimo avvio.
 */
export const TERMS_VERSION = '2026-10-11';

export interface Consent {
  version: string;
  acceptedAt: number;
}

const isConsent = (v: unknown): v is Consent =>
  !!v && typeof v === 'object' && typeof (v as Consent).version === 'string' && typeof (v as Consent).acceptedAt === 'number';

export const loadConsent = (): Consent | null => load<Consent | null>('terms', null, (v): v is Consent | null => v === null || isConsent(v));

export const needsConsent = (consent: Consent | null): boolean => consent?.version !== TERMS_VERSION;

export function acceptTerms(now: number = Date.now()): Consent {
  const consent = { version: TERMS_VERSION, acceptedAt: now };
  save('terms', consent);
  return consent;
}
