/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';


const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/index.css', 'utf8');

describe('regressioni mobile', () => {
  it('il viewport blocca lo zoom e segue la larghezza del telefono', () => {
    expect(html).toMatch(/width=device-width/);
    expect(html).toMatch(/maximum-scale=1\.0/);
    expect(html).toMatch(/user-scalable=no/);
  });
  it('la pagina non scorre in orizzontale', () => {
    expect(css).toMatch(/overflow-x:\s*hidden/);
    expect(css).toMatch(/max-width:\s*100%/);
  });
  it('i campi di testo restano a 16px almeno (niente zoom automatico di iOS)', () => {
    expect(css).toMatch(/font-size:\s*max\(16px,\s*1rem\)/);
  });
});

