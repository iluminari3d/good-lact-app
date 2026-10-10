import { describe, expect, it } from 'vitest';
import { mobileTabFor, sidebarItemFor } from './navigation';

describe('navigazione', () => {
  it('le schermate del flusso pasto restano sotto "Pasto"', () => {
    for (const v of ['main', 'dish', 'results', 'timer', 'lactose-free']) {
      expect(mobileTabFor(v)).toBe('main');
      expect(sidebarItemFor(v)).toBe('main');
    }
  });

  it('le schede principali sono se stesse e il resto finisce in "Altro"', () => {
    expect(mobileTabFor('label')).toBe('label');
    expect(mobileTabFor('diary')).toBe('diary');
    for (const v of ['experiences', 'report', 'history', 'settings', 'faq', 'more']) expect(mobileTabFor(v)).toBe('more');
  });

  it('la barra laterale evidenzia la voce esatta', () => {
    expect(sidebarItemFor('report')).toBe('report');
    expect(sidebarItemFor('settings')).toBe('settings');
  });
});
