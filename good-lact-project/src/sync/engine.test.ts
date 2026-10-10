// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { load, save } from '../lib/storage';
import { noteLocalChange, syncNow, type RemoteApi } from './engine';
import type { RemoteDoc } from './firebaseClient';

const settings = (sensitivity: number) => ({ sensitivity, severe: true, notifications: false, lactaseKey: '', customFcc: '' });
const sym = (id: string, at: number) => ({ id, at, severity: 1, foodNames: ['x'], pills: 1 });

function fakeCloud(initial: Record<string, RemoteDoc> = {}) {
  const docs = { ...initial };
  const writes: string[] = [];
  const api: RemoteApi = {
    readRemote: async () => ({ ...docs }),
    writeRemote: async (_uid, key, value) => { docs[key] = value; writes.push(key); },
  };
  return { api, docs, writes };
}

beforeEach(() => window.localStorage.clear());

describe('sincronizzazione locale <-> cloud', () => {
  it('primo accesso con cloud vuoto: carica i dati locali', async () => {
    save('settings', settings(1.3));
    save('symptoms', [sym('a', 1)]);
    const cloud = fakeCloud();
    const out = await syncNow('u1', cloud.api, 100);
    expect(out.localChanged).toBe(false);
    expect(cloud.writes.sort()).toEqual(['settings', 'symptoms']);
    expect(JSON.parse(cloud.docs.settings.json).sensitivity).toBe(1.3);
  });

  it('nuovo dispositivo: scarica ciò che c\'è nel cloud e lo segnala', async () => {
    const cloud = fakeCloud({
      settings: { json: JSON.stringify(settings(1.6)), updatedAt: 50 },
      experiences: { json: JSON.stringify([{ id: '1', name: 'gorgonzola', verdict: 'ok', createdAt: 1 }]), updatedAt: 50 },
    });
    const out = await syncNow('u1', cloud.api, 100);
    expect(out.localChanged).toBe(true);
    expect(load<{ sensitivity: number } | null>('settings', null)?.sensitivity).toBe(1.6);
    expect(load<unknown[]>('experiences', [])).toHaveLength(1);
    expect(cloud.writes).toEqual([]);
  });

  it('due dispositivi: le voci del diario si sommano', async () => {
    save('symptoms', [sym('a', 2)]);
    const cloud = fakeCloud({ symptoms: { json: JSON.stringify([sym('b', 1)]), updatedAt: 50 } });
    await syncNow('u1', cloud.api, 100);
    expect(load<{ id: string }[]>('symptoms', []).map((s) => s.id)).toEqual(['a', 'b']);
    expect(JSON.parse(cloud.docs.symptoms.json)).toHaveLength(2);
  });

  it('modifica locale dopo la sincronizzazione: vince sulle impostazioni del cloud più vecchie', async () => {
    save('settings', settings(1));
    const cloud = fakeCloud();
    await syncNow('u1', cloud.api, 100);
    save('settings', settings(1.8));
    noteLocalChange('settings', 200);
    cloud.docs.settings = { json: JSON.stringify(settings(1.2)), updatedAt: 150 };
    await syncNow('u1', cloud.api, 300);
    expect(JSON.parse(cloud.docs.settings.json).sensitivity).toBe(1.8);
  });

  it('modifica remota più recente: arriva sul dispositivo', async () => {
    save('settings', settings(1));
    const cloud = fakeCloud();
    await syncNow('u1', cloud.api, 100);
    cloud.docs.settings = { json: JSON.stringify(settings(1.5)), updatedAt: 200 };
    const out = await syncNow('u1', cloud.api, 300);
    expect(out.localChanged).toBe(true);
    expect(load<{ sensitivity: number } | null>('settings', null)?.sensitivity).toBe(1.5);
  });

  it('dati del cloud corrotti o con forma sbagliata vengono ignorati', async () => {
    save('settings', settings(1.1));
    const cloud = fakeCloud({
      settings: { json: '{non json', updatedAt: 999 },
      symptoms: { json: JSON.stringify([{ id: 1 }]), updatedAt: 999 },
      history: { json: JSON.stringify('boom'), updatedAt: 999 },
    });
    await syncNow('u1', cloud.api, 1000);
    expect(load<{ sensitivity: number } | null>('settings', null)?.sensitivity).toBe(1.1);
    expect(load('symptoms', undefined)).toBeUndefined();
  });

  it('senza modifiche non scrive nulla nel cloud', async () => {
    save('settings', settings(1));
    const cloud = fakeCloud();
    await syncNow('u1', cloud.api, 100);
    cloud.writes.length = 0;
    await syncNow('u1', cloud.api, 200);
    expect(cloud.writes).toEqual([]);
  });
});
