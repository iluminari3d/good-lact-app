// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { applyTextScale, isTextScale, TEXT_SCALE_PX } from './textScale';

describe('dimensione del testo', () => {
  it('imposta la dimensione base sull\'elemento radice', () => {
    const root = document.createElement('html');
    applyTextScale('large', root);
    expect(root.style.fontSize).toBe(`${TEXT_SCALE_PX.large}px`);
    applyTextScale('normal', root);
    expect(root.style.fontSize).toBe('16px');
  });
  it('riconosce solo i valori ammessi', () => {
    expect(isTextScale('xlarge')).toBe(true);
    expect(isTextScale('gigante')).toBe(false);
    expect(isTextScale(undefined)).toBe(false);
  });
});
