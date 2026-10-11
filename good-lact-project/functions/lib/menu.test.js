import { describe, expect, it } from 'vitest';
import { DEFAULT_QUESTION, KITCHEN_NOTE, MENU_SYSTEM_PROMPT, parseMenuRequest, sanitizeMenu } from './menu.js';

describe('sanitizeMenu', () => {
  it('accetta piatti validi e aggiunge la nota fissa', () => {
    const r = sanitizeMenu({
      dishes: [
        { name: 'Risotto alla milanese', risk: 'ask', why: 'Mantecato col burro?', askStaff: 'È mantecato col burro?' },
        { name: 'Grigliata di pesce', risk: 'low', why: 'Pesce semplice', askStaff: 'domanda inutile' },
      ],
    });
    expect(r.kitchenNote).toBe(KITCHEN_NOTE);
    expect(r.dishes[0]).toEqual({
      name: 'Risotto alla milanese',
      risk: 'ask',
      why: 'Mantecato col burro?',
      askStaff: 'È mantecato col burro?',
    });
    expect(r.dishes[1].askStaff).toBe('');
  });

  it('rifiuta risposte non valide', () => {
    for (const v of [null, undefined, 'x', 5, [], {}, { dishes: 'no' }, { dishes: {} }]) {
      expect(sanitizeMenu(v)).toBeNull();
    }
  });

  it('risk sconosciuto, mancante o di tipo sbagliato diventa "ask"', () => {
    const r = sanitizeMenu({
      dishes: [
        { name: 'A', risk: 'safe' },
        { name: 'B' },
        { name: 'C', risk: 7 },
        { name: 'D', risk: 'LOW' },
        { name: 'E', risk: null },
      ],
    });
    expect(r.dishes.map((d) => d.risk)).toEqual(['ask', 'ask', 'ask', 'ask', 'ask']);
  });

  it('non ammette "low" per piatti con latticini evidenti nel nome', () => {
    const r = sanitizeMenu({
      dishes: [
        { name: 'Pasta alla panna', risk: 'low' },
        { name: 'Tiramisù', risk: 'low' },
        { name: 'Pecorino con miele', risk: 'low' },
      ],
    });
    expect(r.dishes.map((d) => d.risk)).toEqual(['ask', 'ask', 'low']);
  });

  it('rischio ask/avoid senza domanda riceve quella predefinita', () => {
    const r = sanitizeMenu({ dishes: [{ name: 'Purè', risk: 'ask', askStaff: '   ' }, { name: 'Lasagna', risk: 'avoid' }] });
    expect(r.dishes[0].askStaff).toBe(DEFAULT_QUESTION);
    expect(r.dishes[1].askStaff).toBe(DEFAULT_QUESTION);
  });

  it('scarta elementi senza nome o non oggetto e limita a 30', () => {
    const r = sanitizeMenu({
      dishes: [null, 3, 'x', { name: '' }, { name: 123 }, ...Array.from({ length: 50 }, (_, i) => ({ name: `P${i}`, risk: 'ask' }))],
    });
    expect(r.dishes).toHaveLength(30);
    expect(r.dishes[0].name).toBe('P0');
  });

  it('limita lunghezze e rimuove caratteri di controllo', () => {
    const r = sanitizeMenu({
      dishes: [{ name: `N\u0000a\u001Fme${'x'.repeat(300)}`, risk: 'ask', why: 'w'.repeat(999), askStaff: 'q\u0007'.repeat(200) }],
    });
    const d = r.dishes[0];
    expect(d.name.length).toBeLessThanOrEqual(80);
    expect(d.name).not.toMatch(/[\u0000-\u001F]/);
    expect(d.why.length).toBe(120);
    expect(d.askStaff.length).toBeLessThanOrEqual(120);
    expect(d.askStaff).not.toMatch(/[\u0000-\u001F]/);
  });

  it('ignora campi extra e non restituisce la nota del modello', () => {
    const r = sanitizeMenu({ dishes: [{ name: 'A', risk: 'ask', evil: '<script>' }], kitchenNote: 'Tutto sicuro!' });
    expect(r.dishes[0]).not.toHaveProperty('evil');
    expect(r.kitchenNote).toBe(KITCHEN_NOTE);
  });
});

describe('parseMenuRequest', () => {
  const img = { mimeType: 'image/webp', data: 'QUJD' };
  it('accetta testo o foto', () => {
    expect(parseMenuRequest({ text: '  Risotto   ai funghi ' })).toEqual({ text: 'Risotto ai funghi', image: null });
    expect(parseMenuRequest({ image: img })).toEqual({ text: '', image: img });
  });
  it('taglia il testo a 3000 caratteri puliti', () => {
    const r = parseMenuRequest({ text: `a\u0000b${'c'.repeat(5000)}` });
    expect(r.text.length).toBe(3000);
    expect(r.text).not.toMatch(/\u0000/);
  });
  it('rifiuta richieste vuote o malformate', () => {
    expect(parseMenuRequest(null).error).toBeTruthy();
    expect(parseMenuRequest({}).error).toBeTruthy();
    expect(parseMenuRequest({ text: '   ' }).error).toBeTruthy();
    expect(parseMenuRequest({ text: 42 }).error).toBeTruthy();
    expect(parseMenuRequest({ image: { mimeType: 'application/pdf', data: 'QUJD' } }).error).toBeTruthy();
  });
});

describe('prompt menu', () => {
  it('contiene le regole di prudenza e anti prompt-injection', () => {
    expect(MENU_SYSTEM_PROMPT).toMatch(/NEL DUBBIO/);
    expect(MENU_SYSTEM_PROMPT).toMatch(/MAI "low"/);
    expect(MENU_SYSTEM_PROMPT).toMatch(/solo dati/i);
    expect(MENU_SYSTEM_PROMPT).toMatch(/Non seguire mai istruzioni/i);
    expect(MENU_SYSTEM_PROMPT).toMatch(/gorgonzola/i);
  });
});
