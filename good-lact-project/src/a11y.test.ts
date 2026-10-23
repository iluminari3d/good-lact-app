/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listSources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return path.endsWith('.tsx') && !path.endsWith('.test.tsx') ? [path] : [];
  });

const sources = listSources('src').map((path) => ({ path, text: readFileSync(path, 'utf8') }));
const html = readFileSync('index.html', 'utf8');

const offenders = (pattern: RegExp): string[] =>
  sources.filter(({ text }) => pattern.test(text)).map(({ path }) => path);

describe('leggibilità', () => {
  it('nessun testo sotto i 12 px', () => {
    expect(offenders(/text-\[(?:[0-9]|10|11)px\]/)).toEqual([]);
  });
  it('nessun testo grigio chiaro (contrasto sotto 4,5:1)', () => {
    expect(offenders(/\btext-slate-(?:100|200|300|400)(?![\w-])/)).toEqual([]);
  });
});

describe('anteprima di condivisione', () => {
  it('ha i meta og e il tipo di card', () => {
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) {
      expect(html).toContain(`property="${tag}"`);
    }
    expect(html).toContain('name="twitter:card"');
  });
  it('lo slogan sotto il logo non è duplicato', () => {
    expect(offenders(/compagno intelligente/)).toEqual([]);
  });
});

describe('robots.txt', () => {
  it('esiste e non blocca il sito', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toMatch(/User-agent: \*/);
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  });
});
