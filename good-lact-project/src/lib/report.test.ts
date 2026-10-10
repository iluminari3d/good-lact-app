import { describe, expect, it } from 'vitest';
import { buildReport } from './report';
import { todayKey } from './storage';

const NOW = new Date(2026, 9, 10, 15, 0, 0);

describe('report medico', () => {
  it('somma compresse e sintomi degli ultimi 30 giorni', () => {
    const today = [{ id: 'a', time: '13:00', pills: 2, foodNames: ['pizza'] }];
    const y = new Date(NOW); y.setDate(y.getDate() - 1);
    const history = [{ date: todayKey(y), totalPills: 1, consumptions: [{ id: 'b', time: '20:00', pills: 1, foodNames: ['risotto'] }] }];
    const entries = [
      { id: 's1', at: NOW.getTime() - 3600_000, severity: 2 as const, foodNames: ['pizza'], pills: 2 },
      { id: 's2', at: NOW.getTime(), severity: 0 as const, foodNames: [], pills: 0, skipped: true },
    ];
    const r = buildReport(today, history, entries, NOW);
    expect(r.totalPills).toBe(3);
    expect(r.daysWithData).toBe(2);
    expect(r.symptomCounts[2]).toBe(1);
    expect(r.symptomCounts[0]).toBe(0);
  });

  it('esclude i giorni oltre 30', () => {
    const old = new Date(NOW); old.setDate(old.getDate() - 45);
    const r = buildReport([], [{ date: todayKey(old), totalPills: 1, consumptions: [{ id: 'z', time: '1', pills: 1, foodNames: [] }] }], [], NOW);
    expect(r.days).toHaveLength(0);
  });
});
