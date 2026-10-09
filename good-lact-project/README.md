# Good Lact

App web (PWA) in italiano che dice **quanta lattasi prendere prima di un pasto**.
Descrivi il piatto o fotografalo: l'analisi stima gli ingredienti che contengono
lattosio, compresi quelli nascosti (burro nel risotto, panna nella carbonara,
besciamella nella lasagna), e calcola la dose con un intervallo e un livello di
confidenza.

## Come funziona

1. **Scegli l'enzima** che usi (Lactoint, Lactojoy, Intoleran…) o inserisci gli FCC a mano.
2. **Descrivi o fotografa** il piatto, oppure aggiungi un alimento dal database (448 voci).
3. **Controlla gli ingredienti** stimati: correggi i grammi, escludi quelli che sai non esserci, conferma quelli certi.
4. **Calcola**: ottieni dose consigliata, dose minima e dose prudente.
5. **Assumi** e parte la copertura di 40 minuti.

### Come nasce la stima

- L'AI (Gemini) riconosce gli ingredienti e sceglie una **categoria** (burro, panna, besciamella…) e i grammi.
- **Il lattosio per 100 g non lo decide l'AI**: arriva da una tabella di riferimento fidata (`api/_lib/reference.js`). Solo per la categoria "altro" l'AI propone un valore, limitato a un massimo.
- Ogni ingrediente ha una certezza:
  - **Certo** (nominato o visibile): entra in tutte le stime.
  - **Probabile** (tipico della ricetta): entra nella dose consigliata.
  - **Possibile** (dipende dalla ricetta): entra solo nella dose prudente.
- La **confidenza** dipende da quanta parte del lattosio viene da ingredienti non certi (≤20% alta, ≤50% media, oltre bassa). Con confidenza bassa l'app consiglia direttamente la dose prudente.
- Sotto 0,1 g di lattosio per ingrediente il contributo è trascurabile (15 g di burro non fanno scattare mezza compressa).
- Formula: `FCC = lattosio (g) × 1000 × fattore di sensibilità`, compresse arrotondate per eccesso a ½. La costante è `FCC_PER_GRAM_LACTOSE` in `src/lib/dose.ts`.

> È un aiuto pratico, non un parere medico. Va ricordato in ogni schermata di risultato.

## Sviluppo

```bash
npm install
cp .env.example .env.local   # poi inserisci GEMINI_API_KEY
npx vercel dev               # app + funzione /api/analyze insieme
```

`npm run dev` avvia solo il frontend (senza `/api`, l'analisi mostrerà un errore e si può comporre il piatto a mano).

| Comando | Cosa fa |
| --- | --- |
| `npm test` | test del calcolo e del flusso completo dell'interfaccia |
| `npm run lint` | ESLint |
| `npm run build` | typecheck + build di produzione |

## Pubblicazione su Vercel

1. Importa la repo su Vercel e imposta **Root Directory** = `good-lact-project`.
2. In *Settings → Environment Variables* aggiungi `GEMINI_API_KEY` (e, se vuoi, `GEMINI_MODEL`, `ALLOWED_ORIGINS`, `RATE_LIMIT_PER_MINUTE`, vedi `.env.example`).
3. Deploy. Il tema WordPress (`/goodlacttheme`) mostra l'app in un iframe: aggiorna l'URL con quello di Vercel.

## Sicurezza

- La chiave Gemini esiste **solo lato server** (mai con prefisso `VITE_`) e viaggia in un header, non nell'URL.
- `/api/analyze` valida metodo, `Content-Type`, origine, formato e dimensione dell'immagine, lunghezza del testo.
- Testo e foto dell'utente sono trattati come dati, non come istruzioni; la risposta del modello viene ripulita campo per campo prima di arrivare all'app.
- Limite di richieste per IP (in memoria: basta contro abusi banali; per quote giornaliere o Premium serve un archivio condiviso come Upstash Redis).
- Header di sicurezza e Content-Security-Policy in `vercel.json`.
- Gli errori dei servizi esterni restano nei log del server, non vengono mai mostrati all'utente.

## Struttura

```
api/analyze.js          funzione serverless: validazione, chiamata a Gemini, ripulitura
api/_lib/               riferimento lattosio, validazione, rate limit, client Gemini
src/lib/dose.ts         calcolo della dose (testato in dose.test.ts)
src/views/              schermate: principale, piatto, risultato, timer, storico…
src/hooks/              timer di copertura e registro giornaliero
src/data/               database alimenti, enzimi, FAQ
```

## Prossimi passi pensati (non ancora attivi)

- Account e piano Premium (senza pubblicità, analisi illimitate) con Stripe.
- Versione gratuita con limite giornaliero di analisi e annunci solo nelle schermate neutre, mai accanto alla dose.
- Quota condivisa su Upstash Redis al posto del limite in memoria.
