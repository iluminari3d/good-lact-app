import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT } from './gemini.js';
import { CATEGORY_KEYS } from './reference.js';

describe('istruzioni per l\'analisi', () => {
  it('tratta gorgonzola e stagionati come formaggi senza lattosio', () => {
    expect(SYSTEM_PROMPT).toMatch(/gorgonzola/i);
    expect(SYSTEM_PROMPT).toMatch(/"formaggio_stagionato"/);
    expect(SYSTEM_PROMPT).toMatch(/cacio e pepe/i);
  });

  it('considera le salse da fast food come fonte probabile di lattosio', () => {
    expect(SYSTEM_PROMPT).toMatch(/salsa burger/i);
    expect(SYSTEM_PROMPT).toMatch(/"salsa_cremosa_con_latte"/);
  });

  it('cita solo categorie che esistono davvero', () => {
    const cited = [...SYSTEM_PROMPT.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
    const categories = cited.filter((c) => c.includes('_') && !['certain', 'probable', 'possible'].includes(c));
    for (const c of categories) expect(CATEGORY_KEYS).toContain(c);
  });
});
