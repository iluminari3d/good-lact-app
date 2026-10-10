import { describe, expect, it } from 'vitest';
import { CHECK_AFTER_MS, CHECK_EXPIRES_MS, highDoseSymptoms, pendingCheck, sensitivitySuggestion } from './diary';
import type { Consumption, SymptomEntry, SymptomSeverity } from '../types';

const NOW = 1_000_000_000_000;
const cons = (id: string, ago: number): Consumption => ({ id, time: '12:00', at: NOW - ago, pills: 1, foodNames: ['pasta'] });
const entry = (severity: SymptomSeverity, i: number, extra: Partial<SymptomEntry> = {}): SymptomEntry => ({
  id: `e${i}`, at: NOW - i * 1000, severity, foodNames: ['x'], pills: 1, ...extra,
});

describe('domanda sui sintomi', () => {
  it('compare dopo 90 minuti e non prima', () => {
    expect(pendingCheck([cons('a', CHECK_AFTER_MS - 1)], [], NOW)).toBeNull();
    expect(pendingCheck([cons('a', CHECK_AFTER_MS)], [], NOW)?.id).toBe('a');
  });

  it('scade dopo 20 ore e ignora le assunzioni senza orario esatto', () => {
    expect(pendingCheck([cons('a', CHECK_EXPIRES_MS + 1)], [], NOW)).toBeNull();
    expect(pendingCheck([{ id: 'old', time: '12:00', pills: 1, foodNames: [] }], [], NOW)).toBeNull();
  });

  it('non richiede se già risposto o saltato', () => {
    const c = cons('a', CHECK_AFTER_MS + 10);
    expect(pendingCheck([c], [entry(0, 1, { consumptionId: 'a' })], NOW)).toBeNull();
    expect(pendingCheck([c], [entry(0, 1, { consumptionId: 'a', skipped: true })], NOW)).toBeNull();
  });
});

describe('suggerimento di sensibilità', () => {
  it('non suggerisce nulla con pochi sintomi', () => {
    expect(sensitivitySuggestion([entry(0, 1), entry(1, 2), entry(2, 3)], 1)).toBeNull();
  });

  it('suggerisce di aumentare dopo sintomi ripetuti', () => {
    const s = sensitivitySuggestion([entry(2, 1), entry(3, 2), entry(0, 3)], 1);
    expect(s?.suggested).toBe(1.2);
  });

  it('non supera 2 e non scende mai', () => {
    expect(sensitivitySuggestion([entry(3, 1), entry(3, 2), entry(3, 3)], 2)).toBeNull();
    expect(sensitivitySuggestion([entry(3, 1), entry(3, 2), entry(3, 3)], 1.9)?.suggested).toBe(2);
    expect(sensitivitySuggestion([entry(0, 1), entry(0, 2), entry(0, 3), entry(0, 4)], 1.5)).toBeNull();
  });

  it('le voci saltate non contano', () => {
    const skipped = [1, 2, 3].map((i) => entry(3, i, { skipped: true }));
    expect(sensitivitySuggestion(skipped, 1)).toBeNull();
  });

  it('segnala sintomi nonostante dose alta', () => {
    expect(highDoseSymptoms([entry(2, 1, { pills: 2 }), entry(3, 2, { pills: 3 })])).toBe(true);
    expect(highDoseSymptoms([entry(2, 1, { pills: 1 }), entry(3, 2, { pills: 1 })])).toBe(false);
  });
});
