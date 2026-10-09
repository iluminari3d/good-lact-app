import { describe, expect, it } from 'vitest';
import { confidenceFor, defaultQuantityFor, estimateDose, pillsFor, roundToHalf } from './dose';
import type { DishIngredient, MealItem } from '../types';

const ing = (over: Partial<DishIngredient>): DishIngredient => ({
  id: 'x',
  name: 'Ingrediente',
  grams: 100,
  lactosePer100g: 1,
  certainty: 'certain',
  source: 'ai',
  active: true,
  ...over,
});

const dishOf = (ingredients: DishIngredient[]): MealItem => ({
  id: 'd',
  kind: 'dish',
  name: 'Piatto',
  quantity: 1,
  unit: 'porzione',
  dish: { name: 'Piatto', ingredients },
});

describe('arrotondamento', () => {
  it('arrotonda sempre per eccesso a mezza compressa', () => {
    expect(roundToHalf(0.01)).toBe(0.5);
    expect(roundToHalf(0.5)).toBe(0.5);
    expect(roundToHalf(0.51)).toBe(1);
    expect(roundToHalf(1.2)).toBe(1.5);
    expect(roundToHalf(2)).toBe(2);
  });

  it('non genera mezze compresse fantasma sui numeri esatti', () => {
    expect(pillsFor(15000, 15000)).toBe(1);
    expect(pillsFor(30000, 15000)).toBe(2);
  });

  it('restituisce 0 se mancano FCC o lattosio', () => {
    expect(pillsFor(1000, 0)).toBe(0);
    expect(pillsFor(0, 3000)).toBe(0);
  });
});

describe('confidenza', () => {
  it('usa le soglie 20% e 50%', () => {
    expect(confidenceFor(0)).toBe('high');
    expect(confidenceFor(0.2)).toBe('high');
    expect(confidenceFor(0.21)).toBe('medium');
    expect(confidenceFor(0.5)).toBe('medium');
    expect(confidenceFor(0.51)).toBe('low');
  });
});

describe('stima della dose', () => {
  it('piatto con solo ingredienti certi: confidenza alta', () => {
    const meal = [dishOf([ing({ grams: 100, lactosePer100g: 4, certainty: 'certain' })])];
    const est = estimateDose(meal, 3000, 1);
    expect(est.lactoseExpected).toBeCloseTo(4);
    expect(est.confidence).toBe('high');
    expect(est.pillsRecommended).toBe(est.pillsExpected);
    expect(est.fccExpected).toBeCloseTo(4000);
  });

  it('i "possibili" non entrano nella stima attesa ma sì in quella prudente', () => {
    const meal = [dishOf([ing({ grams: 50, lactosePer100g: 3, certainty: 'possible' })])];
    const est = estimateDose(meal, 3000, 1);
    expect(est.lactoseExpected).toBe(0);
    expect(est.lactoseCautious).toBeGreaterThan(0);
    expect(est.pillsCautious).toBeGreaterThan(est.pillsExpected);
  });

  it('con confidenza bassa consiglia la dose prudente', () => {
    const meal = [
      dishOf([
        ing({ name: 'Panna', grams: 40, lactosePer100g: 3.2, certainty: 'possible' }),
        ing({ name: 'Burro', grams: 15, lactosePer100g: 0.6, certainty: 'probable' }),
      ]),
    ];
    const est = estimateDose(meal, 3000, 1);
    expect(est.confidence).toBe('low');
    expect(est.pillsRecommended).toBe(est.pillsCautious);
    expect(est.mainUncertainties[0]).toBe('Panna');
  });

  it('ingredienti disattivati o a zero lattosio non pesano', () => {
    const meal = [
      dishOf([
        ing({ grams: 200, lactosePer100g: 5, active: false }),
        ing({ grams: 80, lactosePer100g: 0 }),
      ]),
    ];
    const est = estimateDose(meal, 3000, 1);
    expect(est.lactoseCautious).toBe(0);
    expect(est.pillsRecommended).toBe(0);
  });

  it('min <= atteso <= prudente', () => {
    const meal = [
      dishOf([
        ing({ grams: 100, lactosePer100g: 2, certainty: 'certain' }),
        ing({ grams: 30, lactosePer100g: 4, certainty: 'probable' }),
        ing({ grams: 30, lactosePer100g: 3, certainty: 'possible' }),
      ]),
    ];
    const est = estimateDose(meal, 3000, 1);
    expect(est.lactoseMin).toBeLessThanOrEqual(est.lactoseExpected);
    expect(est.lactoseExpected).toBeLessThanOrEqual(est.lactoseCautious);
    expect(est.pillsMin).toBeLessThanOrEqual(est.pillsExpected);
    expect(est.pillsExpected).toBeLessThanOrEqual(est.pillsCautious);
  });

  it('la sensibilità scala gli FCC richiesti', () => {
    const meal = [dishOf([ing({ grams: 100, lactosePer100g: 4 })])];
    const base = estimateDose(meal, 3000, 1);
    const sens = estimateDose(meal, 3000, 1.5);
    expect(sens.fccExpected).toBeCloseTo(base.fccExpected * 1.5);
  });

  it('alimento del database: peso dichiarato = dato certo', () => {
    const meal: MealItem[] = [
      { id: 'f', kind: 'food', name: 'Ricotta vaccina', foodKey: 'ricotta-vaccina', quantity: 100, unit: 'grammi' },
    ];
    const est = estimateDose(meal, 3000, 1);
    expect(est.lactoseExpected).toBeCloseTo(3);
    expect(est.confidence).toBe('high');
  });

  it('alimento senza lattosio non genera dose', () => {
    const meal: MealItem[] = [
      { id: 'f', kind: 'food', name: 'Parmigiano 24 mesi', foodKey: 'parmigiano-24', quantity: 50, unit: 'grammi' },
    ];
    expect(estimateDose(meal, 3000, 1).lactoseCautious).toBe(0);
  });
});

describe('tracce trascurabili', () => {
  it('15 g di burro (0,09 g di lattosio) non fanno scattare mezza compressa', () => {
    const meal = [dishOf([ing({ name: 'Burro', grams: 15, lactosePer100g: 0.6, certainty: 'probable' })])];
    const est = estimateDose(meal, 3000, 1);
    expect(est.lactoseCautious).toBe(0);
    expect(est.pillsRecommended).toBe(0);
  });

  it('una quantità maggiore di burro invece conta', () => {
    const meal = [dishOf([ing({ name: 'Burro', grams: 40, lactosePer100g: 0.6, certainty: 'probable' })])];
    expect(estimateDose(meal, 3000, 1).lactoseExpected).toBeGreaterThan(0);
  });
});

describe('quantità iniziale', () => {
  it('parte da una porzione realistica, non da 1 grammo', () => {
    expect(defaultQuantityFor('latte-intero-vaccino')).toEqual({ quantity: 200, unit: 'grammi' });
    expect(defaultQuantityFor('mozzarella-fior-di-latte').quantity).toBeGreaterThanOrEqual(100);
  });

  it('usa 100 g se mancano i dati', () => {
    expect(defaultQuantityFor('inesistente')).toEqual({ quantity: 100, unit: 'grammi' });
  });
});

describe('correzione dati: besciamella non è più "senza lattosio"', () => {
  it('una porzione di besciamella richiede lattasi', () => {
    const meal: MealItem[] = [
      { id: 'b', kind: 'food', name: 'Besciamella', foodKey: 'besciamella', quantity: 100, unit: 'grammi' },
    ];
    expect(estimateDose(meal, 3000, 1).pillsRecommended).toBeGreaterThan(0);
  });
});
