// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RestaurantView } from './RestaurantView';
import { PHRASES } from '../data/phrases';

const KITCHEN =
  'Dalla foto non si può sapere cosa succede in cucina (utensili, friggitrice, burro nelle padelle): per un intollerante severo conferma sempre con il personale.';

const MENU = {
  dishes: [
    { name: 'Penne alla panna', risk: 'avoid', why: 'Panna nel sugo', askStaff: 'La salsa ha panna?' },
    { name: 'Risotto ai funghi', risk: 'ask', why: 'Di solito mantecato', askStaff: 'È mantecato col burro?' },
    { name: 'Orata alla griglia', risk: 'low', why: 'Pesce semplice', askStaff: '' },
  ],
  kitchenNote: KITCHEN,
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

describe('RestaurantView - frasi', () => {
  it('cambia lingua, mostra il testo grande e apre lo schermo intero', async () => {
    const user = userEvent.setup();
    render(<RestaurantView onBack={() => {}} />);

    await user.selectOptions(screen.getByLabelText(/lingua da mostrare/i), 'fr');
    const phrase = PHRASES.find((p) => p.id === 'butter')!;
    expect(screen.getByText(phrase.text.fr)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /mostra a schermo intero: burro/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(phrase.text.fr)).toBeTruthy();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('il pulsante copia scrive la frase negli appunti', async () => {
    const user = userEvent.setup();
    render(<RestaurantView onBack={() => {}} />);
    // user-event installa un clipboard finto dopo setup()
    await user.selectOptions(screen.getByLabelText(/lingua da mostrare/i), 'de');
    await user.click(screen.getByRole('button', { name: /copia la frase: burro/i }));
    expect(await navigator.clipboard.readText()).toBe(PHRASES.find((p) => p.id === 'butter')!.text.de);
    expect(screen.getAllByText('Copiato').length).toBe(1);
  });
});

describe('RestaurantView - menu', () => {
  it('legge il menu da testo e raggruppa per rischio con domanda e nota cucina', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(MENU);
    render(<RestaurantView onBack={() => {}} />);

    await user.click(screen.getByRole('tab', { name: /leggi il menu/i }));
    expect((screen.getByRole('button', { name: /leggi il menu/i }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByLabelText(/incolla il testo del menu/i), 'Penne alla panna, risotto ai funghi');
    await user.click(screen.getByRole('button', { name: /leggi il menu/i }));

    expect(await screen.findByText(KITCHEN)).toBeTruthy();
    const avoid = screen.getByRole('region', { name: /da evitare/i });
    expect(within(avoid).getByText('Penne alla panna')).toBeTruthy();
    const ask = screen.getByRole('region', { name: /chiedi prima di ordinare/i });
    expect(within(ask).getByText('Risotto ai funghi')).toBeTruthy();
    expect(within(ask).getByText(/mantecato col burro/i)).toBeTruthy();
    const low = screen.getByRole('region', { name: /rischio basso/i });
    expect(within(low).getByText('Orata alla griglia')).toBeTruthy();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/menu');
    expect(JSON.parse(String(init.body))).toEqual({ text: 'Penne alla panna, risotto ai funghi' });
  });

  it('mostra l\'errore se il servizio non risponde', async () => {
    const user = userEvent.setup();
    mockFetch({ error: 'Servizio non disponibile.' }, false, 502);
    render(<RestaurantView onBack={() => {}} />);
    await user.click(screen.getByRole('tab', { name: /leggi il menu/i }));
    await user.type(screen.getByLabelText(/incolla il testo del menu/i), 'Pizza');
    await user.click(screen.getByRole('button', { name: /leggi il menu/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Servizio non disponibile/);
  });
});
