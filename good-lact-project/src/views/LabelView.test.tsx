// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabelView } from './LabelView';
import { isLabelResult, isMenuResult, readMenu, scanLabel } from '../services/labelApi';

vi.mock('../lib/image', () => ({
  prepareImage: async () => ({
    mimeType: 'image/jpeg',
    data: 'QUJD',
    previewUrl: 'data:image/jpeg;base64,QUJD',
  }),
}));

const RESULT = {
  productName: 'Biscotti frollini',
  verdict: 'avoid',
  lactoseFreeClaim: false,
  dairyIngredients: [
    { term: 'Burro', note: 'derivato del latte' },
    { term: 'Siero di latte in polvere', note: 'contiene lattosio' },
  ],
  mayContainTraces: true,
  readable: true,
  summary: 'Frollini con burro.',
  note: 'Tra gli ingredienti ci sono derivati del latte.',
};

function mockFetch(json: unknown, ok = true, status = 200) {
  const fn = vi.fn(async () => ({ ok, status, json: async () => json }) as Response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function pickPhoto(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(['x'], 'e.jpg', { type: 'image/jpeg' });
  await user.upload(screen.getByLabelText(/scegli una foto dell'etichetta/i), file);
}

describe('LabelView', () => {
  it('scatta, invia la foto e mostra verdetto, derivati e nota', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(RESULT);
    render(<LabelView onBack={() => {}} />);

    expect((screen.getByRole('button', { name: /leggi l'etichetta/i }) as HTMLButtonElement).disabled).toBe(true);
    await pickPhoto(user);
    await user.click(screen.getByRole('button', { name: /leggi l'etichetta/i }));

    expect(await screen.findByText(/da evitare/i)).toBeTruthy();
    expect(screen.getByText('Burro')).toBeTruthy();
    expect(screen.getByText('Siero di latte in polvere')).toBeTruthy();
    expect(screen.getByText(RESULT.note)).toBeTruthy();
    expect(screen.getByText(/tracce di latte/i)).toBeTruthy();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/label');
    expect(JSON.parse(String(init.body))).toEqual({ image: { mimeType: 'image/jpeg', data: 'QUJD' } });
  });

  it('mostra l\'errore del server', async () => {
    const user = userEvent.setup();
    mockFetch({ error: 'La lettura non è disponibile.' }, false, 502);
    render(<LabelView onBack={() => {}} />);
    await pickPhoto(user);
    await user.click(screen.getByRole('button', { name: /leggi l'etichetta/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/non è disponibile/);
  });

  it('una risposta non valida non viene mostrata come verdetto', async () => {
    const user = userEvent.setup();
    mockFetch({ verdict: 'perfetto' });
    render(<LabelView onBack={() => {}} />);
    await pickPhoto(user);
    await user.click(screen.getByRole('button', { name: /leggi l'etichetta/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/non valida/i);
  });

  it('il pulsante indietro chiama onBack', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<LabelView onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: /indietro/i }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('validazione risposte labelApi', () => {
  it('scanLabel/readMenu rifiutano forme sbagliate', async () => {
    expect(isLabelResult({ ...RESULT, verdict: 'ok' })).toBe(true);
    expect(isLabelResult({ ...RESULT, verdict: 'safe' })).toBe(false);
    expect(isLabelResult({ ...RESULT, dairyIngredients: [{ term: 1 }] })).toBe(false);
    expect(isMenuResult({ dishes: [{ name: 'a', risk: 'ask', why: '', askStaff: '' }], kitchenNote: 'n' })).toBe(true);
    expect(isMenuResult({ dishes: [{ name: 'a', risk: 'safe', why: '', askStaff: '' }], kitchenNote: 'n' })).toBe(false);
    mockFetch({ nope: 1 });
    await expect(scanLabel({ mimeType: 'image/jpeg', data: 'QUJD' })).rejects.toThrow(/non valida/);
    await expect(readMenu({ text: 'pizza' })).rejects.toThrow(/non valida/);
  });

  it('errore di rete e timeout danno messaggi in italiano', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    await expect(readMenu({ text: 'pizza' })).rejects.toThrow(/Impossibile contattare/);
  });
});
