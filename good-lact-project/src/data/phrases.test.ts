import { describe, expect, it } from 'vitest';
import { LANGUAGE_CODES, PHRASES } from './phrases';

describe('frasi per il personale', () => {
  it('copre le 5 lingue richieste', () => {
    expect(LANGUAGE_CODES).toEqual(['it', 'en', 'fr', 'es', 'de']);
  });

  it('ogni frase esiste, non è vuota ed è distinta in tutte e 5 le lingue', () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(8);
    for (const phrase of PHRASES) {
      expect(Object.keys(phrase.text).sort()).toEqual([...LANGUAGE_CODES].sort());
      for (const code of LANGUAGE_CODES) {
        expect(phrase.text[code].trim().length, `${phrase.id}/${code}`).toBeGreaterThan(5);
      }
      // nessuna lingua è un copia-incolla dell'italiano (tranne eventuali termini identici brevi)
      for (const code of LANGUAGE_CODES.filter((c) => c !== 'it')) {
        expect(phrase.text[code]).not.toBe(phrase.text.it);
      }
    }
  });

  it('gli id sono unici', () => {
    const ids = PHRASES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('include i temi richiesti', () => {
    const ids = PHRASES.map((p) => p.id);
    for (const id of ['intolerance', 'butter', 'cream', 'milk', 'cheese', 'shared-pans', 'shared-fryer', 'lactose-free-option', 'thanks']) {
      expect(ids).toContain(id);
    }
    const intolerance = PHRASES.find((p) => p.id === 'intolerance')!;
    expect(intolerance.text.en).toMatch(/traces/i);
    expect(intolerance.text.de).toMatch(/Spuren/);
  });
});
