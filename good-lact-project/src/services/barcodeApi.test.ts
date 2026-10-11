import { describe, expect, it } from 'vitest';
import { isValidEan, parseOffProduct } from './barcodeApi';

describe('barcode', () => {
  it('valida gli EAN', () => {
    expect(isValidEan('8001234567890')).toBe(true);
    expect(isValidEan('12345678')).toBe(true);
    expect(isValidEan('1234')).toBe(false);
    expect(isValidEan('80012345678a0')).toBe(false);
  });
  it('legge allergeni, tracce e claim', () => {
    const p = parseOffProduct('1', { product_name: 'X', allergens_tags: ['en:milk'], traces_tags: [], labels_tags: ['en:no-lactose'], ingredients_text: 'latte' });
    expect(p.milkAllergen).toBe(true);
    expect(p.lactoseFreeLabel).toBe(true);
    expect(p.incomplete).toBe(false);
  });
  it('segnala scheda incompleta e non inventa sicurezza', () => {
    const p = parseOffProduct('1', {});
    expect(p.incomplete).toBe(true);
    expect(p.milkAllergen).toBe(false);
  });
});
