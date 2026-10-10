import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import analyze from '../analyze.js';
import label from '../label.js';
import menu from '../menu.js';
import { guardRequest } from './http.js';

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
  };
  return res;
}

const req = (over = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', host: 'app.test', 'x-forwarded-for': '1.1.1.1' },
  body: {},
  ...over,
});

const IMG = { mimeType: 'image/jpeg', data: 'QUJD' };

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  delete process.env.GEMINI_MODEL;
  delete process.env.RATE_LIMIT_PER_MINUTE;
  delete process.env.ALLOWED_ORIGINS;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function geminiReturns(json) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('guardRequest', () => {
  it('rifiuta metodi diversi da POST', () => {
    const res = makeRes();
    expect(guardRequest(req({ method: 'GET' }), res, 't1')).toBeNull();
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
  });
  it('rifiuta origini estranee e Content-Type sbagliato', () => {
    let res = makeRes();
    expect(guardRequest(req({ headers: { origin: 'https://evil.test', host: 'app.test', 'content-type': 'application/json' } }), res, 't2')).toBeNull();
    expect(res.statusCode).toBe(403);
    res = makeRes();
    expect(guardRequest(req({ headers: { host: 'app.test', 'content-type': 'text/plain' } }), res, 't2')).toBeNull();
    expect(res.statusCode).toBe(415);
  });
  it('senza chiave risponde 500 generico', () => {
    delete process.env.GEMINI_API_KEY;
    const res = makeRes();
    expect(guardRequest(req(), res, 't3')).toBeNull();
    expect(res.statusCode).toBe(500);
  });
  it('rate limit con chiavi separate per endpoint', () => {
    process.env.RATE_LIMIT_PER_MINUTE = '2';
    const r = () => req({ headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' } });
    expect(guardRequest(r(), makeRes(), 'a')).not.toBeNull();
    expect(guardRequest(r(), makeRes(), 'a')).not.toBeNull();
    const blocked = makeRes();
    expect(guardRequest(r(), blocked, 'a')).toBeNull();
    expect(blocked.statusCode).toBe(429);
    expect(guardRequest(r(), makeRes(), 'b')).not.toBeNull();
  });
  it('usa il modello da env o il predefinito', () => {
    expect(guardRequest(req({ headers: { 'content-type': 'application/json', 'x-forwarded-for': '2.2.2.2' } }), makeRes(), 'm').model).toBe('gemini-flash-latest');
    process.env.GEMINI_MODEL = 'altro-modello';
    expect(guardRequest(req({ headers: { 'content-type': 'application/json', 'x-forwarded-for': '2.2.2.3' } }), makeRes(), 'm').model).toBe('altro-modello');
  });
});

describe('endpoint con Gemini simulato', () => {
  it('/api/label: chiave in header, verdetto calcolato dal server', async () => {
    const fetchMock = geminiReturns({
      productName: 'Merendina',
      readable: true,
      lactoseFreeClaim: false,
      claimText: '',
      dairyIngredients: [{ term: 'LATTE scremato in polvere', note: 'derivato' }],
      mayContainTraces: false,
      summary: 'Merendina al latte.',
    });
    const res = makeRes();
    await label(req({ body: { image: IMG }, headers: { 'content-type': 'application/json', 'x-forwarded-for': '3.3.3.3' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.verdict).toBe('avoid');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).not.toContain('test-key');
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    expect(JSON.parse(init.body).generationConfig.responseSchema).toBeTruthy();
  });

  it('/api/label: richiesta senza foto = 400, nessuna chiamata a Gemini', async () => {
    const fetchMock = geminiReturns({});
    const res = makeRes();
    await label(req({ body: { text: 'x' }, headers: { 'content-type': 'application/json', 'x-forwarded-for': '3.3.3.4' } }), res);
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('/api/menu: sanifica e aggiunge kitchenNote', async () => {
    geminiReturns({ dishes: [{ name: 'Fritto misto', risk: 'weird', why: 'x', askStaff: '' }] });
    const res = makeRes();
    await menu(req({ body: { text: 'Fritto misto' }, headers: { 'content-type': 'application/json', 'x-forwarded-for': '4.4.4.4' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.dishes[0].risk).toBe('ask');
    expect(res.body.kitchenNote).toMatch(/conferma sempre con il personale/);
  });

  it('errori di Gemini: 502 generico senza dettagli upstream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => 'SECRET upstream detail' })));
    for (const [handler, body] of [
      [label, { image: IMG }],
      [menu, { text: 'Pizza' }],
    ]) {
      const res = makeRes();
      await handler(req({ body, headers: { 'content-type': 'application/json', 'x-forwarded-for': `5.5.5.${Math.random()}` } }), res);
      expect(res.statusCode).toBe(502);
      expect(JSON.stringify(res.body)).not.toContain('SECRET');
    }
  });

  it('risposta del modello non valida = 502', async () => {
    geminiReturns({ dishes: 'no' });
    const res = makeRes();
    await menu(req({ body: { text: 'Pizza' }, headers: { 'content-type': 'application/json', 'x-forwarded-for': '6.6.6.6' } }), res);
    expect(res.statusCode).toBe(502);
  });

  it('/api/analyze continua a funzionare dopo il refactor', async () => {
    geminiReturns({ dishName: 'Risotto', portionNote: '', ingredients: [{ name: 'Burro', category: 'burro', grams: 20, certainty: 'probable', reason: 'x' }] });
    const res = makeRes();
    await analyze(req({ body: { description: 'risotto' }, headers: { 'content-type': 'application/json', 'x-forwarded-for': '7.7.7.7' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ingredients[0].category).toBe('burro');
    const bad = makeRes();
    await analyze(req({ body: {}, headers: { 'content-type': 'application/json', 'x-forwarded-for': '7.7.7.7' } }), bad);
    expect(bad.statusCode).toBe(400);
  });
});
