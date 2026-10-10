// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, createBackup, parseBackup } from './backup';
import { load, save } from './storage';

const settings = { sensitivity: 1.2, severe: true, notifications: false, lactaseKey: '', customFcc: '' };

describe('backup dei dati', () => {
  beforeEach(() => window.localStorage.clear());

  it('esporta e reimporta gli stessi dati', () => {
    save('settings', settings);
    save('experiences', [{ id: '1', name: 'gorgonzola', verdict: 'ok', createdAt: 1 }]);
    const text = JSON.stringify(createBackup());
    window.localStorage.clear();
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) applyBackup(parsed.backup);
    expect(load('settings', null)).toEqual(settings);
    expect(load<unknown[]>('experiences', [])).toHaveLength(1);
  });

  it('rifiuta file non validi, di altre app o enormi', () => {
    expect(parseBackup('non json').ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: 'altro', version: 1, data: {} })).ok).toBe(false);
    expect(parseBackup('x'.repeat(2_000_001)).ok).toBe(false);
  });

  it('rifiuta dati con forma sbagliata e ignora chiavi sconosciute', () => {
    const bad = { app: 'good-lact', version: 1, data: { settings: { sensitivity: 99, lactaseKey: '' } } };
    expect(parseBackup(JSON.stringify(bad)).ok).toBe(false);
    const extra = { app: 'good-lact', version: 1, data: { settings, evil: '<script>' } };
    const parsed = parseBackup(JSON.stringify(extra));
    expect(parsed.ok && Object.keys(parsed.backup.data)).toEqual(['settings']);
  });
});
