// Test delle regole Firestore (firestore.rules).
// Si lanciano con:  cd tests/firestore && npm install && npm test
// (richiede Java per l'emulatore Firestore)

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const here = path.dirname(fileURLToPath(import.meta.url));
const rules = fs.readFileSync(path.join(here, '../../firestore.rules'), 'utf8');

const CHIAVI = ['settings', 'today', 'history', 'experiences', 'symptoms'];
const valido = () => ({ json: '{"ok":true}', updatedAt: 1730000000000 });

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-good-lact',
    firestore: { rules },
  });
});

after(async () => {
  await env.cleanup();
});

// Dati di partenza: scritti saltando le regole
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const k of CHIAVI) await setDoc(doc(db, `users/alice/data/${k}`), valido());
    await setDoc(doc(db, 'users/alice'), { nome: 'Alice' });
    await setDoc(doc(db, 'altro/x'), { a: 1 });
  });
});

const comeAlice = () => env.authenticatedContext('alice').firestore();
const comeBob = () => env.authenticatedContext('bob').firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

test('il proprietario legge i propri 5 documenti', async () => {
  for (const k of CHIAVI) {
    const snap = await assertSucceeds(getDoc(doc(comeAlice(), `users/alice/data/${k}`)));
    assert.equal(snap.data().json, '{"ok":true}');
  }
});

test('il proprietario scrive (crea e aggiorna) i propri 5 documenti', async () => {
  // aggiornamento di documenti esistenti
  for (const k of CHIAVI) {
    await assertSucceeds(setDoc(doc(comeAlice(), `users/alice/data/${k}`), { json: '[]', updatedAt: 1 }));
  }
  // creazione su database vuoto
  await env.clearFirestore();
  for (const k of CHIAVI) {
    await assertSucceeds(setDoc(doc(comeAlice(), `users/alice/data/${k}`), valido()));
  }
});

test('il proprietario cancella i propri 5 documenti', async () => {
  for (const k of CHIAVI) {
    await assertSucceeds(deleteDoc(doc(comeAlice(), `users/alice/data/${k}`)));
  }
});

test('un altro utente non può leggere i documenti altrui', async () => {
  for (const k of CHIAVI) {
    await assertFails(getDoc(doc(comeBob(), `users/alice/data/${k}`)));
  }
});

test('un altro utente non può scrivere né cancellare i documenti altrui', async () => {
  for (const k of CHIAVI) {
    await assertFails(setDoc(doc(comeBob(), `users/alice/data/${k}`), valido()));
    await assertFails(deleteDoc(doc(comeBob(), `users/alice/data/${k}`)));
  }
});

test('un utente non autenticato è rifiutato', async () => {
  await assertFails(getDoc(doc(anonimo(), 'users/alice/data/settings')));
  await assertFails(setDoc(doc(anonimo(), 'users/alice/data/settings'), valido()));
  await assertFails(deleteDoc(doc(anonimo(), 'users/alice/data/settings')));
});

test('una chiave non ammessa è rifiutata', async () => {
  await assertFails(setDoc(doc(comeAlice(), 'users/alice/data/altro'), valido()));
});

test('un campo extra è rifiutato', async () => {
  await assertFails(setDoc(doc(comeAlice(), 'users/alice/data/settings'),
    { ...valido(), extra: 'no' }));
});

test('campi richiesti mancanti: rifiutato', async () => {
  await assertFails(setDoc(doc(comeAlice(), 'users/alice/data/settings'), { json: '{}' }));
  await assertFails(setDoc(doc(comeAlice(), 'users/alice/data/settings'), { updatedAt: 1 }));
});

test('json non stringa è rifiutato', async () => {
  const db = comeAlice();
  await assertFails(setDoc(doc(db, 'users/alice/data/settings'), { json: { a: 1 }, updatedAt: 1 }));
  await assertFails(setDoc(doc(db, 'users/alice/data/settings'), { json: 5, updatedAt: 1 }));
});

test('json oltre il limite è rifiutato, appena sotto è accettato', async () => {
  const db = comeAlice();
  await assertFails(setDoc(doc(db, 'users/alice/data/history'),
    { json: 'x'.repeat(200000), updatedAt: 1 }));
  await assertFails(setDoc(doc(db, 'users/alice/data/history'),
    { json: 'x'.repeat(250000), updatedAt: 1 }));
  await assertSucceeds(setDoc(doc(db, 'users/alice/data/history'),
    { json: 'x'.repeat(199999), updatedAt: 1 }));
});

test('updatedAt non numerico è rifiutato', async () => {
  const db = comeAlice();
  await assertFails(setDoc(doc(db, 'users/alice/data/today'), { json: '{}', updatedAt: '1' }));
  await assertFails(setDoc(doc(db, 'users/alice/data/today'), { json: '{}', updatedAt: null }));
});

test('qualunque altro percorso è rifiutato', async () => {
  const db = comeAlice();
  await assertFails(getDoc(doc(db, 'users/alice')));
  await assertFails(setDoc(doc(db, 'users/alice'), { nome: 'A' }));
  await assertFails(getDoc(doc(db, 'altro/x')));
  await assertFails(setDoc(doc(db, 'altro/x'), { a: 1 }));
  await assertFails(setDoc(doc(db, 'users/alice/altro/settings'), valido()));
  await assertFails(setDoc(doc(db, 'users/alice/data/settings/sotto/doc'), valido()));
});
