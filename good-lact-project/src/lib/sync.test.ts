import { describe, expect, it } from 'vitest';
import { mergeAll } from './sync';

const settingsA = { sensitivity: 1, severe: true, notifications: false, lactaseKey: 'a', customFcc: '' };
const settingsB = { ...settingsA, sensitivity: 1.4 };
const sym = (id: string, at: number) => ({ id, at, severity: 1, foodNames: [], pills: 1 });
const cons = (id: string, at: number, pills = 1) => ({ id, time: '12:00', at, pills, foodNames: ['x'] });

describe('unione dei dati tra dispositivi', () => {
  it('impostazioni: vince la modifica più recente', () => {
    const newerRemote = mergeAll({ local: { settings: settingsA }, localStamps: { settings: 10 }, remote: { settings: settingsB }, remoteStamps: { settings: 20 } });
    expect(newerRemote.values.settings).toEqual(settingsB);
    expect(newerRemote.pullKeys).toContain('settings');
    expect(newerRemote.pushKeys).not.toContain('settings');

    const newerLocal = mergeAll({ local: { settings: settingsA }, localStamps: { settings: 20 }, remote: { settings: settingsB }, remoteStamps: { settings: 10 } });
    expect(newerLocal.values.settings).toEqual(settingsA);
    expect(newerLocal.pushKeys).toContain('settings');
  });

  it('esperienze: la cancellazione più recente non viene riportata indietro', () => {
    const e = { id: '1', name: 'burro', verdict: 'bad', createdAt: 1 };
    const r = mergeAll({ local: { experiences: [] }, localStamps: { experiences: 50 }, remote: { experiences: [e] }, remoteStamps: { experiences: 40 } });
    expect(r.values.experiences).toEqual([]);
  });

  it('diario: unisce per id senza perdere voci di nessun dispositivo', () => {
    const r = mergeAll({ local: { symptoms: [sym('a', 3), sym('b', 1)] }, localStamps: {}, remote: { symptoms: [sym('c', 2), sym('a', 3)] }, remoteStamps: {} });
    expect((r.values.symptoms as { id: string }[]).map((s) => s.id)).toEqual(['a', 'c', 'b']);
    expect(r.pullKeys).toContain('symptoms');
    expect(r.pushKeys).toContain('symptoms');
  });

  it('assunzioni: oggi e storico si fondono e i totali sono ricalcolati', () => {
    const r = mergeAll({
      local: { today: { date: '2026-10-10', consumptions: [cons('a', 5)] }, history: [{ date: '2026-10-09', totalPills: 1, consumptions: [cons('h1', 1)] }] },
      localStamps: {},
      remote: { today: { date: '2026-10-10', consumptions: [cons('b', 6, 2)] }, history: [{ date: '2026-10-09', totalPills: 3, consumptions: [cons('h2', 2, 2)] }] },
      remoteStamps: {},
    });
    expect((r.values.today as { consumptions: { id: string }[] }).consumptions.map((c) => c.id)).toEqual(['b', 'a']);
    const history = r.values.history as { date: string; totalPills: number }[];
    expect(history).toHaveLength(1);
    expect(history[0].totalPills).toBe(3);
  });

  it('se il cloud ha un giorno più recente, quello di ieri finisce nello storico', () => {
    const r = mergeAll({
      local: { today: { date: '2026-10-09', consumptions: [cons('a', 1)] }, history: [] },
      localStamps: {},
      remote: { today: { date: '2026-10-10', consumptions: [cons('b', 2)] }, history: [] },
      remoteStamps: {},
    });
    expect((r.values.today as { date: string }).date).toBe('2026-10-10');
    expect((r.values.history as { date: string }[])[0].date).toBe('2026-10-09');
  });

  it('cloud vuoto: tutto il locale va in cloud; locale vuoto: tutto il cloud arriva', () => {
    const up = mergeAll({ local: { settings: settingsA }, localStamps: {}, remote: {}, remoteStamps: {} });
    expect(up.pushKeys).toEqual(['settings']);
    expect(up.pullKeys).toEqual([]);
    const down = mergeAll({ local: {}, localStamps: {}, remote: { settings: settingsB }, remoteStamps: { settings: 5 } });
    expect(down.pullKeys).toEqual(['settings']);
    expect(down.pushKeys).toEqual([]);
  });

  it('dati identici: niente da scrivere da nessuna parte', () => {
    const r = mergeAll({ local: { settings: settingsA, symptoms: [sym('a', 1)] }, localStamps: {}, remote: { settings: settingsA, symptoms: [sym('a', 1)] }, remoteStamps: {} });
    expect(r.pullKeys).toEqual([]);
    expect(r.pushKeys).toEqual([]);
  });
});
