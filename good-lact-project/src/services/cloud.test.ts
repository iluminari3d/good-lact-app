// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { callCloud, CloudError, LOGIN_REQUIRED_MESSAGE } from './cloud';

const callFunction = vi.fn();
vi.mock('../sync/firebaseClient', () => ({ callFunction: (...args: unknown[]) => callFunction(...args) }));

const options = { timeoutMs: 1000, timeoutMessage: 'troppo tempo', failedMessage: 'non riuscita' };

afterEach(() => {
  callFunction.mockReset();
  vi.restoreAllMocks();
});

describe('callCloud', () => {
  it('restituisce i dati della funzione', async () => {
    callFunction.mockResolvedValue({ signedOut: false, data: { ok: 1 } });
    await expect(callCloud('analyze', { a: 1 }, options)).resolves.toEqual({ ok: 1 });
    expect(callFunction).toHaveBeenCalledWith('analyze', { a: 1 }, 1000);
  });

  it('senza accesso dice di accedere', async () => {
    callFunction.mockResolvedValue({ signedOut: true });
    await expect(callCloud('label', {}, options)).rejects.toThrow(LOGIN_REQUIRED_MESSAGE);
  });

  it('mostra il messaggio del server per il tetto giornaliero', async () => {
    callFunction.mockRejectedValue(Object.assign(new Error('Hai usato le 10 richieste di oggi.'), { code: 'functions/resource-exhausted' }));
    await expect(callCloud('menu', {}, options)).rejects.toThrow('Hai usato le 10 richieste di oggi.');
  });

  it('nasconde i dettagli degli errori imprevisti', async () => {
    callFunction.mockRejectedValue(Object.assign(new Error('stack segreto'), { code: 'functions/internal' }));
    const error: unknown = await callCloud('menu', {}, options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CloudError);
    expect((error as CloudError).message).toBe('non riuscita');
  });

  it('segnala il timeout con il messaggio dedicato', async () => {
    callFunction.mockRejectedValue(Object.assign(new Error('x'), { code: 'functions/deadline-exceeded' }));
    await expect(callCloud('analyze', {}, options)).rejects.toThrow('troppo tempo');
  });

  it('da offline non prova nemmeno', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(callCloud('analyze', {}, options)).rejects.toThrow(/offline/i);
    expect(callFunction).not.toHaveBeenCalled();
  });

  it("l'annullamento interrompe l'attesa", async () => {
    callFunction.mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();
    const pending = callCloud('analyze', {}, { ...options, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toBeDefined();
  });
});
