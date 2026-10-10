// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimerView } from './TimerView';

const base = { totalSeconds: 2400, onStop: vi.fn(), onBack: vi.fn() };

afterEach(cleanup);

describe('TimerView', () => {
  it('mostra il tempo e il pulsante di stop mentre è attivo', () => {
    render(<TimerView {...base} timeLeft={125} isRunning canExtend={false} onTakeAnother={vi.fn()} />);
    expect(screen.getByRole('timer').textContent).toBe('2:05');
    expect(screen.getByText('Sei protetto')).toBeTruthy();
    expect(screen.getByRole('button', { name: /interrompi/i })).toBeTruthy();
  });

  it('a copertura finita da poco propone un\'altra compressa', () => {
    const onTakeAnother = vi.fn();
    render(<TimerView {...base} timeLeft={0} isRunning={false} canExtend onTakeAnother={onTakeAnother} />);
    fireEvent.click(screen.getByRole('button', { name: /altra compressa/i }));
    expect(onTakeAnother).toHaveBeenCalledOnce();
  });

  it('non propone nulla se la copertura è finita da tempo', () => {
    render(<TimerView {...base} timeLeft={0} isRunning={false} canExtend={false} onTakeAnother={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /altra compressa/i })).toBeNull();
  });
});
