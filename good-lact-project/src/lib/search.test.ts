import { describe, expect, it } from 'vitest';
import { FOODS_DATA } from '../data/goodLactData';
import { normalize, scoreMatch, searchItems } from './search';

describe('ricerca', () => {
  it('ignora accenti, maiuscole e punteggiatura', () => {
    expect(normalize("  Caffè-Latte  d'orzo ")).toBe('caffe latte d orzo');
    expect(scoreMatch('CAFFE', 'Caffè')).toBeGreaterThan(0);
  });

  it('tutte le parole devono comparire, in qualunque ordine', () => {
    expect(scoreMatch('pizza margherita', 'Pizza Margherita')).toBeGreaterThan(0);
    expect(scoreMatch('margherita pizza', 'Pizza Margherita')).toBeGreaterThan(0);
    expect(scoreMatch('pizza funghi', 'Pizza Margherita')).toBe(0);
  });

  it('tollera plurale e singolare', () => {
    expect(scoreMatch('gelati', 'Gelato alla crema')).toBeGreaterThan(0);
    expect(scoreMatch('gelato', 'Gelati assortiti')).toBeGreaterThan(0);
  });

  it('mette prima i nomi che iniziano con quello che scrivi', () => {
    const items = ['Torta al latte', 'Latte intero', 'Cioccolato al latte'];
    expect(searchItems(items, 'latte', (x) => x)[0]).toBe('Latte intero');
  });

  it('con tutto il database "latte" mostra latte tra i primi risultati', () => {
    const res = searchItems(Object.entries(FOODS_DATA), 'latte', ([, f]) => f.name, ([, f]) => f.category ?? '', 10);
    expect(res.slice(0, 5).some(([, f]) => /^latte\b/i.test(f.name))).toBe(true);
  });

  it('una ricerca vuota o fatta di soli simboli non restituisce nulla', () => {
    expect(searchItems(['a'], '   ', (x) => x)).toEqual([]);
    expect(searchItems(['a'], '!!!', (x) => x)).toEqual([]);
  });
});
