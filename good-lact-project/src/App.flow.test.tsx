// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const FAKE_ANALYSIS = {
  dishName: 'Tagliatelle ai funghi',
  portionNote: 'Porzione normale da circa 300 g',
  ingredients: [
    { name: 'Burro', grams: 30, lactosePer100g: 0.6, certainty: 'probable', reason: 'Tipico per mantecare' },
    { name: 'Panna', grams: 50, lactosePer100g: 3.2, certainty: 'possible', reason: 'Alcune ricette la usano' },
  ],
};

function mockFetch(handler: (body: unknown) => { ok: boolean; status?: number; json: unknown }) {
  const fn = vi.fn(async (_url: string, init?: RequestInit) => {
    const result = handler(init?.body ? JSON.parse(String(init.body)) : null);
    return { ok: result.ok, status: result.status ?? 200, json: async () => result.json } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function pickLactase(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/enzima utilizzato/i), 'lactoint');
}

describe('flusso completo', () => {
  it('descrivo il piatto, controllo gli ingredienti, calcolo, assumo e vedo il timer', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(() => ({ ok: true, json: FAKE_ANALYSIS }));
    render(<App />);

    await pickLactase(user);
    await user.type(screen.getByLabelText(/cosa stai mangiando/i), 'tagliatelle ai funghi');
    await user.click(screen.getByRole('button', { name: /analizza il piatto/i }));

    // Vista di controllo con ingredienti stimati e livelli di certezza
    expect(await screen.findByText('Controlla il piatto')).toBeTruthy();
    expect(screen.getByText('Burro')).toBeTruthy();
    expect(screen.getByText('Panna')).toBeTruthy();
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent.description).toBe('tagliatelle ai funghi');

    await user.click(screen.getByRole('button', { name: /aggiungi al pasto/i }));
    expect(await screen.findByText('Il tuo pasto')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /calcola la dose/i }));

    // Risultato con confidenza e dose
    expect(await screen.findByText('La tua dose')).toBeTruthy();
    expect(screen.getByText(/confidenza/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /^assumo/i }));

    // Prima dell'ultima versione questa schermata era vuota
    expect(await screen.findByText('Sei protetto')).toBeTruthy();
    expect(screen.getByRole('timer').textContent).toMatch(/^\d+:\d{2}$/);
    expect(window.localStorage.getItem('goodlact_timer')).not.toBeNull();
  });

  it('mostra l\'errore se l\'analisi fallisce e permette di comporre a mano', async () => {
    const user = userEvent.setup();
    mockFetch(() => ({ ok: false, status: 502, json: { error: "L'analisi non è disponibile al momento." } }));
    render(<App />);

    await user.type(screen.getByLabelText(/cosa stai mangiando/i), 'risotto');
    await user.click(screen.getByRole('button', { name: /analizza il piatto/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain("L'analisi non è disponibile");

    await user.click(within(alert).getByRole('button', { name: /componi a mano/i }));
    expect(await screen.findByText('Controlla il piatto')).toBeTruthy();
  });

  it('piatto senza lattosio porta alla schermata dedicata (prima era vuota)', async () => {
    const user = userEvent.setup();
    mockFetch(() => ({ ok: true, json: { dishName: 'Insalata', portionNote: '', ingredients: [] } }));
    render(<App />);

    await pickLactase(user);
    await user.type(screen.getByLabelText(/cosa stai mangiando/i), 'insalata');
    await user.click(screen.getByRole('button', { name: /analizza il piatto/i }));
    await user.click(await screen.findByRole('button', { name: /aggiungi al pasto/i }));
    await user.click(await screen.findByRole('button', { name: /calcola la dose/i }));

    expect(await screen.findByText('Nessuna lattasi necessaria')).toBeTruthy();
  });

  it('non calcola senza aver scelto l\'enzima', async () => {
    const user = userEvent.setup();
    mockFetch(() => ({ ok: true, json: FAKE_ANALYSIS }));
    render(<App />);

    await user.type(screen.getByLabelText(/cosa stai mangiando/i), 'tagliatelle');
    await user.click(screen.getByRole('button', { name: /analizza il piatto/i }));
    await user.click(await screen.findByRole('button', { name: /aggiungi al pasto/i }));

    const calc = await screen.findByRole('button', { name: /calcola la dose/i });
    expect((calc as HTMLButtonElement).disabled).toBe(true);
  });

  it('dati corrotti nel localStorage non rompono l\'app', async () => {
    window.localStorage.setItem('goodlact_settings', '{non è json');
    window.localStorage.setItem('goodlact_history', '"nope"');
    window.localStorage.setItem('goodlact_today', '123');
    window.localStorage.setItem('goodlact_timer', 'abc');
    render(<App />);
    await waitFor(() => expect(screen.getByText(/cosa stai mangiando/i)).toBeTruthy());
  });
});
