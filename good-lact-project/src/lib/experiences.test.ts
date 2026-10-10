import { describe, expect, it } from 'vitest';
import { cleanExperienceName, matchExperiences, normalizeName, upsertExperience } from './experiences';
import type { Experience } from '../types';

const exp = (name: string, verdict: 'ok' | 'bad', id = name): Experience => ({ id, name, verdict, createdAt: 1 });

describe('esperienze personali', () => {
  it('normalizza accenti e punteggiatura', () => {
    expect(normalizeName('  Gorgonzola!  ')).toBe('gorgonzola');
    expect(normalizeName('Pecorino-Romano')).toBe('pecorino romano');
  });

  it('un nome ha un solo verdetto: il nuovo sostituisce il vecchio', () => {
    let list = upsertExperience([], 'Gorgonzola', 'ok', 'a', 1);
    list = upsertExperience(list, 'gorgonzola', 'bad', 'b', 2);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ verdict: 'bad', id: 'b' });
  });

  it('ignora nomi troppo corti e pulisce i caratteri di controllo', () => {
    expect(upsertExperience([], 'a', 'ok', 'x', 1)).toEqual([]);
    expect(cleanExperienceName('sal\u0000sa   burger')).toBe('sal sa burger');
  });

  it('trova le esperienze nei nomi del pasto, non il contrario', () => {
    const list = [exp('gorgonzola', 'ok'), exp('salsa burger', 'bad'), exp('pasta al forno', 'bad')];
    const m = matchExperiences(['Pizza al gorgonzola', 'Panino con Salsa Burger', 'Pasta'], list);
    expect(m.ok).toEqual(['gorgonzola']);
    expect(m.bad).toEqual(['salsa burger']);
  });

  it('non fa scattare avvisi su parole troppo brevi', () => {
    expect(matchExperiences(['riso al latte'], [exp('al', 'bad')])).toEqual({ bad: [], ok: [] });
  });
});
