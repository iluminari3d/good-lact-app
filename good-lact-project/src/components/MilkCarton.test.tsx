// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MilkCarton } from './MilkCarton';

const surface = (c: HTMLElement) => c.querySelector('g[clip-path] > g')!.getAttribute('style') ?? '';

afterEach(cleanup);

describe('MilkCarton', () => {
  it('è decorativo e nasconde il contenuto alle tecnologie assistive', () => {
    const { container } = render(<MilkCarton level={0.5} />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('il livello scende al diminuire del tempo e resta nei limiti', () => {
    const y = (level: number) => Number(/translateY\(([\d.]+)px\)/.exec(surface(render(<MilkCarton level={level} />).container))?.[1]);
    expect(y(1)).toBeLessThan(y(0.5));
    expect(y(0.5)).toBeLessThan(y(0));
    expect(y(5)).toBe(y(1));
    expect(y(-3)).toBe(y(0));
  });
});
