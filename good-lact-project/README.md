# Good Lact

App web (PWA) in italiano che dice **quanta lattasi prendere prima di un pasto**.
Descrivi il piatto o fotografalo: l'analisi stima gli ingredienti che contengono
lattosio, compresi quelli nascosti (burro nel risotto, panna nella carbonara,
besciamella nella lasagna), e calcola la dose con un intervallo e un livello di
confidenza.

## Come funziona

1. **Scegli l'enzima** che usi (Lactoint, Lactojoy, Intoleran…) o inserisci gli FCC a mano.
2. **Descrivi o fotografa** il piatto, oppure aggiungi un alimento dal database (448 voci di partenza, ancora da verificare: vedi "Dati e fonti").
3. **Controlla gli ingredienti** stimati: correggi i grammi, escludi quelli che sai non esserci, conferma quelli certi.
4. **Calcola**: ottieni dose consigliata, dose minima e dose prudente.
5. **Assumi** e parte la copertura di 40 minuti.

### Intolleranza severa (attiva di default)

Pensata per chi reagisce anche a piccole quantità. Si disattiva dalle impostazioni.
Rispetto al profilo standard:

- Soglia di tracce trascurabili ridotta da 0,1 g a **0,02 g** di lattosio per ingrediente (`SEVERE.negligible` in `src/lib/dose.ts`).
- Gli ingredienti **"possibili"** (es. panna nella carbonara) entrano nella dose.
- La dose consigliata è **sempre quella prudente**, mai la minima.
- Margini più larghi: 50% sui grammi stimati dall'AI, 20% su quelli inseriti da te, fino al 50% sui valori del database non verificati.
- Gli alimenti segnati "senza lattosio" (gorgonzola, formaggi stagionati) valgono zero anche in modalità severa: è la regola di chi usa l'app. Per questo il flag `isLactoseFree` va assegnato solo con una fonte.
- Test: la dose severa non è mai inferiore a quella standard.

L'app avvisa sempre che **non può sapere della contaminazione** (padelle, friggitrici, affettatrici in comune): la lattasi scompone il lattosio ma non protegge dalle tracce di latte.

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

## Funzioni per l'intolleranza

- **Timer a cartone di latte**: il latte scende durante i 40 minuti di copertura. Alla fine, se il pasto continua, un tasto registra un'altra compressa e riavvia il timer.
- **Il mio profilo**: lattasi predefinita, profilo severo, sensibilità, notifiche, backup (esporta/importa JSON). I dati restano sul dispositivo (localStorage); l'import accetta solo chiavi note e dati della forma giusta.
- **Le mie esperienze**: elenco personale "mi va bene" / "mi dà fastidio". Compare come avviso nel risultato, ma non cambia mai la dose da solo.
- **Diario sintomi**: 90 minuti dopo l'assunzione chiede come stai. Se i sintomi medi o forti si ripetono suggerisce di *aumentare* la sensibilità (mai di ridurla), ricordando che possono contare tracce di latte o altre cause.
- **Scanner etichette** (`/api/label`): la foto viene letta dall'AI, ma il verdetto (ok / attenzione / evita) è calcolato dal server con regole fisse. "Senza lattosio" conta solo se il modello cita la frase presente sull'etichetta.
- **Modalità ristorante** (`/api/menu` + frasi in 5 lingue): foto o testo del menu con piatti ok / chiedi / evita e una nota fissa: dalla foto non si sa cosa succede in cucina.
- **Report per il medico**: ultimi 30 giorni di compresse, pasti e sintomi, stampabile o salvabile in PDF.
- **Schede informative** nelle FAQ: etichette, farmaci, fuori casa, quando parlare con il medico.

- **Account e sincronizzazione (Firebase)**: accesso facoltativo con Google o link via email. Con l'account profilo, esperienze, diario e storico si ritrovano su tutti i dispositivi. Impostazioni ed esperienze: vince la modifica più recente; diario e assunzioni: unione per id. I dati stanno in Firestore (`users/{uid}/data/{chiave}`), protetti da `firestore.rules`. Firebase si carica solo se c'è un account. Si può eliminare account e dati dal cloud. Firebase Analytics non è usato. La configurazione web in `src/sync/firebaseConfig.ts` è pubblica per progettazione.

- **Termini e privacy** con consenso versionato al primo avvio (e quando cambiano: si aggiorna `TERMS_VERSION` in `src/lib/consent.ts`), cancellazione dei dati del dispositivo, avviso offline e pulsante "Installa l'app". Il testo è in `src/data/terms.ts` e va fatto rivedere prima della pubblicazione.

## Dati e fonti

I valori di lattosio di partenza (448 alimenti in `src/data/goodLactData.ts` e la tabella
per categoria in `api/_lib/reference.js`) **non derivano da fonti ufficiali verificate**.
Finché `REFERENCE_DATA_VERIFIED` in `src/data/meta.ts` è `false`, l'app lo scrive nei
risultati e usa margini più ampi. Ogni voce può avere `reliability`
(`measured` | `estimated` | `unverified`, predefinito `unverified`) e `source`.

Per sostituirli con dati veri:

1. Scarica gratis da <https://fdc.nal.usda.gov/download-datasets> i CSV di **Foundation Foods** e **SR Legacy**.
2. `npm run db:usda -- <cartella-foundation> <cartella-sr-legacy> --out src/data/usda-lactose.json`
3. Il file contiene solo gli alimenti con lattosio **misurato** (zero compreso). Un alimento assente è "non analizzato", cioè sconosciuto, non zero.
4. Associa le voci dell'app ai record USDA (`reliability: 'measured'`, `source: 'USDA FDC <id>'`). Per i prodotti italiani assenti da USDA (stracchino, burrata, ecc.) servono la banca dati BDA dell'IEO (<https://bda.ieo.it>) o le tabelle CREA, oppure l'etichetta del prodotto.
5. Quando i dati principali sono verificati, imposta `REFERENCE_DATA_VERIFIED = true`.

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
src/data/               database alimenti, enzimi, FAQ, frasi per il personale, stato di verifica dei dati
api/label.js, api/menu.js   scanner etichette e lettura menu (stesse protezioni di api/analyze.js)
scripts/usda.mjs        importatore del lattosio misurato da USDA FoodData Central
```

## Prossimi passi pensati (non ancora attivi)

- Account e piano Premium (senza pubblicità, analisi illimitate) con Stripe.
- Versione gratuita con limite giornaliero di analisi e annunci solo nelle schermate neutre, mai accanto alla dose.
- Quota condivisa su Upstash Redis al posto del limite in memoria.
