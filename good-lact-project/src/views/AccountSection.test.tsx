// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_SYNC, SyncContext, type SyncState } from '../sync/context';
import { AccountSection } from './AccountSection';

afterEach(cleanup);

const renderWith = (patch: Partial<SyncState>) =>
  render(
    <SyncContext.Provider value={{ ...DEFAULT_SYNC, ...patch }}>
      <AccountSection />
    </SyncContext.Provider>,
  );

describe('AccountSection', () => {
  it('non compare se il servizio non è disponibile', () => {
    const { container } = renderWith({ status: 'unavailable' });
    expect(container.textContent).toBe('');
  });

  it('da disconnesso offre Google e link via email', async () => {
    const user = userEvent.setup();
    const signInGoogle = vi.fn(async () => {});
    const sendLink = vi.fn(async () => {});
    renderWith({ status: 'signedOut', signInGoogle, sendLink });

    await user.click(screen.getByRole('button', { name: /accedi con google/i }));
    expect(signInGoogle).toHaveBeenCalledOnce();

    const send = screen.getByRole('button', { name: /invia/i });
    expect((send as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByLabelText(/link via email/i), 'a@b.it');
    await user.click(send);
    expect(sendLink).toHaveBeenCalledWith('a@b.it');
  });

  it('da collegato mostra email e ultima sincronizzazione, e chiede conferma prima di eliminare', async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn(async () => {});
    renderWith({ status: 'signedIn', email: 'francesco@example.com', lastSync: Date.now(), deleteAccount });

    expect(screen.getByText(/collegato come francesco@example.com/i)).toBeTruthy();
    expect(screen.getByText(/ultima sincronizzazione/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /elimina account e dati/i }));
    expect(deleteAccount).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Elimina' }));
    expect(deleteAccount).toHaveBeenCalledOnce();
  });

  it('mostra i messaggi di errore', () => {
    renderWith({ status: 'signedOut', message: 'Accesso annullato.' });
    expect(screen.getByText('Accesso annullato.')).toBeTruthy();
  });
});
