// Funzioni Firebase (Cloud Functions, 2ª generazione) di Good Lact.
// Tre funzioni "callable": il client le chiama con l'SDK Firebase, che allega
// da solo il token di accesso. Senza accesso non si arriva a Gemini.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineInt, defineSecret, defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

import { analyzeWithGemini, UpstreamError } from './lib/gemini.js';
import { CallError, guardedCall } from './lib/guard.js';
import { parseLabelRequest, readLabelWithGemini, sanitizeLabel } from './lib/label.js';
import { parseMenuRequest, readMenuWithGemini, sanitizeMenu } from './lib/menu.js';
import { parseEmailList } from './lib/quota.js';
import { LACTOSE_REFERENCE, MAX_OTHER_PER100G } from './lib/reference.js';
import { parseRequest, sanitizeAnalysis } from './lib/validate.js';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

// La chiave si imposta con: firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-flash-latest' });
const UNLIMITED_EMAILS = defineString('UNLIMITED_EMAILS', { default: '' });
const FREE_DAILY_LIMIT = defineInt('FREE_DAILY_LIMIT', { default: 10 });
const UNLIMITED_DAILY_CAP = defineInt('UNLIMITED_DAILY_CAP', { default: 500 });

const OPTIONS = { secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '256MiB' };

const config = () => ({
  freeLimit: FREE_DAILY_LIMIT.value(),
  unlimitedCap: UNLIMITED_DAILY_CAP.value(),
  unlimited: parseEmailList(UNLIMITED_EMAILS.value()),
});
const gemini = () => ({ apiKey: GEMINI_API_KEY.value(), model: GEMINI_MODEL.value() });

function callable(name, buildSpec) {
  return onCall(OPTIONS, async (request) => {
    try {
      return await guardedCall({
        auth: request.auth,
        data: request.data,
        db: getFirestore(),
        config: config(),
        ...buildSpec(gemini()),
      });
    } catch (error) {
      if (error instanceof CallError) throw new HttpsError(error.code, error.message);
      logger.error(`${name} failed`, error instanceof Error ? error.message : error);
      throw new HttpsError('internal', 'Errore interno.');
    }
  });
}

export const analyze = callable('analyze', (g) => ({
  parse: parseRequest,
  unavailableMessage: "L'analisi non è disponibile al momento. Riprova o componi il piatto a mano.",
  work: async (parsed) => {
    const raw = await analyzeWithGemini(parsed, g);
    const analysis = sanitizeAnalysis(raw, LACTOSE_REFERENCE, MAX_OTHER_PER100G);
    if (!analysis) throw new UpstreamError('analisi non valida');
    return analysis;
  },
}));

export const label = callable('label', (g) => ({
  parse: parseLabelRequest,
  unavailableMessage: "La lettura dell'etichetta non è disponibile al momento. Riprova.",
  work: async (parsed) => {
    const raw = await readLabelWithGemini(parsed, g);
    const result = sanitizeLabel(raw);
    if (!result) throw new UpstreamError('etichetta non valida');
    return result;
  },
}));

export const menu = callable('menu', (g) => ({
  parse: parseMenuRequest,
  unavailableMessage: 'La lettura del menu non è disponibile al momento. Riprova.',
  work: async (parsed) => {
    const raw = await readMenuWithGemini(parsed, g);
    const result = sanitizeMenu(raw);
    if (!result) throw new UpstreamError('menu non valido');
    return result;
  },
}));
