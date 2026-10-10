// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { acceptTerms, loadConsent, needsConsent, TERMS_VERSION } from './consent';
import { clearAll } from './storage';

beforeEach(() => window.localStorage.clear());

describe('consenso ai termini', () => {
  it('senza scelta salvata serve il consenso', () => {
    expect(needsConsent(loadConsent())).toBe(true);
  });

  it('dopo l\'accettazione non serve più, finché la versione non cambia', () => {
    acceptTerms(5);
    expect(loadConsent()).toEqual({ version: TERMS_VERSION, acceptedAt: 5 });
    expect(needsConsent(loadConsent())).toBe(false);
    expect(needsConsent({ version: 'vecchia', acceptedAt: 1 })).toBe(true);
  });

  it('un valore corrotto vale come nessun consenso', () => {
    window.localStorage.setItem('goodlact_terms', '{"version":3}');
    expect(needsConsent(loadConsent())).toBe(true);
  });

  it('clearAll cancella solo i dati dell\'app', () => {
    window.localStorage.setItem('goodlact_settings', '1');
    window.localStorage.setItem('altro_sito', '1');
    clearAll();
    expect(window.localStorage.getItem('goodlact_settings')).toBeNull();
    expect(window.localStorage.getItem('altro_sito')).toBe('1');
  });
});
