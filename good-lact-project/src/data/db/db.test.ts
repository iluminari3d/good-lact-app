import { describe, expect, it } from 'vitest';
import { FOODS_DATA } from '../goodLactData';
import farmaci from './farmaci.json';
import fastfood from './fastfood.json';
import prodotti from './prodotti.json';
import { DB_ALIMENTI, DB_PIATTI, dishLactosePerPortion } from './index';

const RELIABILITY = ['measured', 'estimated', 'unverified'];
const isUrl = (u: unknown) => typeof u === 'string' && /^https?:\/\//.test(u);

describe('database offline: qualità dei dati', () => {
  it('ogni alimento ha chiave unica, fonte, affidabilità e valori plausibili', () => {
    const keys = new Set<string>();
    for (const e of DB_ALIMENTI) {
      expect(keys.has(e.key), `chiave duplicata ${e.key}`).toBe(false);
      keys.add(e.key);
      expect(RELIABILITY).toContain(e.reliability);
      expect(isUrl(e.sourceUrl), e.key).toBe(true);
      expect(e.source.length, e.key).toBeGreaterThan(2);
      expect(e.lactosePer100g, e.key).toBeGreaterThanOrEqual(0);
      expect(e.lactosePer100g, e.key).toBeLessThanOrEqual(60);
    }
    expect(DB_ALIMENTI.length).toBeGreaterThan(150);
  });

  it('ogni piatto ha fonte, ingredienti e intervalli di grammi coerenti', () => {
    const keys = new Set<string>();
    for (const d of DB_PIATTI) {
      expect(keys.has(d.key), `chiave duplicata ${d.key}`).toBe(false);
      keys.add(d.key);
      expect(RELIABILITY).toContain(d.reliability);
      expect(isUrl(d.sourceUrl), d.key).toBe(true);
      expect(d.ingredients.length, d.key).toBeGreaterThan(0);
      for (const i of d.ingredients) {
        expect(i.gramsMin, `${d.key}/${i.name}`).toBeLessThanOrEqual(i.gramsMax);
        expect(i.gramsMin, `${d.key}/${i.name}`).toBeGreaterThanOrEqual(0);
        expect(i.lactosePer100g, `${d.key}/${i.name}`).toBeGreaterThanOrEqual(0);
        expect(['certain', 'probable', 'possible']).toContain(i.certainty);
      }
      expect(dishLactosePerPortion(d), d.key).toBeLessThan(60);
    }
    expect(DB_PIATTI.length).toBeGreaterThan(100);
  });

  it('alimenti e piatti nuovi non sovrascrivono le voci di base e sono tutti in FOODS_DATA', () => {
    for (const e of [...DB_ALIMENTI, ...DB_PIATTI]) expect(FOODS_DATA[e.key], e.key).toBeDefined();
    expect(FOODS_DATA['parmigiano-24'].isLactoseFree).toBe(true);
    expect(FOODS_DATA['ricotta-vaccina'].lactosePer100g).toBe(3.5);
  });

  it('prodotti: fonte e data di controllo, claim e valori solo se letti', () => {
    for (const p of prodotti.products) {
      expect(RELIABILITY).toContain(p.reliability);
      expect(isUrl(p.sourceUrl), p.key).toBe(true);
      expect(p.checkedAt, p.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (p.lactosePer100g != null) expect(p.lactosePer100g, p.key).toBeGreaterThanOrEqual(0);
    }
  });

  it('farmaci: fonte, data e nessuna quantità negativa', () => {
    for (const d of farmaci.drugs) {
      expect(RELIABILITY).toContain(d.reliability);
      expect(isUrl(d.sourceUrl), d.key).toBe(true);
      expect(d.checkedAt, d.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (d.lactoseMgPerUnit != null) expect(d.lactoseMgPerUnit, d.key).toBeGreaterThanOrEqual(0);
    }
  });

  it('fast food: catene, chiavi uniche, stati validi, nessuna scheda estera', () => {
    const names = fastfood.chains.map((c) => c.name);
    expect(names).not.toContain("McDonald's"); // la scheda ricevuta è svizzera, non italiana
    expect(fastfood.chains.length).toBeGreaterThanOrEqual(10);
    for (const c of fastfood.chains) {
      const keys = new Set<string>();
      expect(c.docDate.length, c.name).toBeGreaterThan(3);
      for (const i of c.items) {
        expect(keys.has(i.k), `duplicato ${i.k}`).toBe(false);
        keys.add(i.k);
        expect([0, 1, null]).toContain(i.m);
        expect([0, 1, null]).toContain(i.t);
        expect(i.n.length, i.k).toBeGreaterThan(0);
      }
    }
    // Se la scheda cita ingredienti con latte, la voce non può risultare "non segnalato".
    for (const c of fastfood.chains) for (const i of c.items) {
      if (/^(Gli ingredienti riportano|Ingredienti con latte)/.test(i.x)) expect(i.m, i.k).toBe(1);
    }
  });
});
