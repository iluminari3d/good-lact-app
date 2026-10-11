# Good Lact

App web (PWA) in italiano che calcola quanta lattasi prendere prima di un pasto. Questa repository contiene l'app, le regole del database e gli strumenti di rilascio. Per la descrizione completa dell'app vedi [`good-lact-project/README.md`](good-lact-project/README.md).

## Albero della repository
```
.
├── good-lact-project/       # L'app (Vite + React + TypeScript, PWA) e le funzioni Firebase in functions/
├── .github/workflows/       # CI (lint, test, build) e test delle regole Firestore
├── docs/                    # Documenti operativi (RILASCIO.md: rilascio, backup, ritorno indietro)
├── tests/firestore/         # Test delle regole Firestore con l'emulatore
├── firestore.rules          # Regole di sicurezza di Firestore
└── firebase.json            # Configurazione Firebase (Firestore, funzioni, emulatori; l'hosting è su Vercel)
```
Le altre voci in radice (immagini, grafiche, tema) sono materiali di design.

## Flusso di lavoro
- `main` è la produzione: ogni unione viene pubblicata da Vercel.
- Si lavora su `staging/<nome>` (lavori grandi) o `fix/<nome>` (correzioni). Vercel crea un'anteprima per ogni ramo.
- Si apre una Pull Request verso `main`, si guarda l'anteprima e la CI, e solo dopo si unisce.
- Le regole Firestore non si pubblicano da sole: vedi [`docs/RILASCIO.md`](docs/RILASCIO.md).

## Eseguire controlli in locale
App (da `good-lact-project/`, serve Node 22):
```
npm ci
npm run lint
npm test
npm run build      # include il controllo dei tipi (tsc -b)
```
Regole Firestore (da `tests/firestore/`, serve Java per l'emulatore, che al primo avvio scarica un file da Google):
```
npm install
npm test
```
La CI esegue gli stessi controlli a ogni push su `main`, `staging/**`, `fix/**` e su ogni Pull Request.

## Segreti
Nessuna chiave nel repository. La chiave Gemini è un segreto di Firebase (`firebase functions:secrets:set GEMINI_API_KEY`); i parametri sono in `good-lact-project/functions/.env.example` (vedi `docs/RILASCIO.md`).

## Documenti
- [`good-lact-project/README.md`](good-lact-project/README.md): come funziona l'app.
- [`docs/RILASCIO.md`](docs/RILASCIO.md): rilascio, variabili, Firebase, backup, come tornare indietro.
