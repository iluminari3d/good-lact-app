// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OfflineBar } from './OfflineBar';

afterEach(cleanup);

describe('OfflineBar', () => {
  it('compare quando manca la connessione e sparisce al ritorno', () => {
    render(<OfflineBar />);
    expect(screen.queryByRole('status')).toBeNull();
    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(screen.getByRole('status').textContent).toMatch(/sei offline/i);
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
