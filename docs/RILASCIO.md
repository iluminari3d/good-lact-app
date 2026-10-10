# Rilascio di Good Lact (piano operativo)

Hosting: Vercel (progetto della cartella `good-lact-project/`). Account e sincronizzazione: Firebase, progetto `good-lact` (facoltativo per chi usa l'app).
Questo documento dice come si porta una modifica in produzione, cosa salvare prima e come tornare indietro.

## Modello dei rami
- `main` = **produzione**. Ogni cosa unita a `main` viene pubblicata in automatico da Vercel sul dominio dell'app.
- `staging/<nome>` per lavori più grandi (nuove funzioni, cambi di dati o di regole) e `fix/<nome>` per correzioni. Ogni ramo laterale ha una **anteprima Vercel** con un indirizzo suo, da provare prima di unire.
- Si lavora sul ramo laterale, si apre una **Pull Request** verso `main` e la si rivede (anche da soli: leggere il "Files changed" e guardare l'anteprima). Si unisce solo con CI verde.
- Niente push diretto su `main` per cambiamenti importanti. Solo per correzioni minime (testo, refusi) e a CI locale verde.

## Checklist prima di unire
1. CI verde sulla PR: lint, test, build (workflow "CI") e, se si toccano le regole, "Test regole Firestore".
2. Anteprima Vercel aperta e provata: caricamento, un'analisi di prova, timer, profilo, installazione PWA.
3. Nessuna chiave, token o dato personale nel diff (`git diff main...HEAD`). Le chiavi stanno solo su Vercel.
4. Se cambiano `firestore.rules`: test regole verdi e piano per pubblicarle (vedi Firebase).
5. Se cambiano le variabili d'ambiente: aggiornarle su Vercel **prima** di unire.
6. Piano di ritorno scritto nella PR (di solito: Instant Rollback, vedi sotto).

## Variabili d'ambiente su Vercel
Project > Settings > Environment Variables (le stesse sono elencate in `good-lact-project/.env.example`).

| Variabile | Note |
|---|---|
| `GEMINI_API_KEY` | Chiave Google AI Studio. **Solo lato server**, mai con prefisso `VITE_` (finirebbe nel browser). |
| `GEMINI_MODEL` | Opzionale. Default `gemini-flash-latest`; per bloccare una versione scrivere il nome esatto. |
| `ALLOWED_ORIGINS` | Opzionale. Origini ammesse per le chiamate alle funzioni `/api/*`, separate da virgola. Vuoto = solo lo stesso dominio. Le anteprime hanno indirizzi diversi: vedi sotto. |
| `RATE_LIMIT_PER_MINUTE` | Opzionale. Richieste massime per IP al minuto (default 8). |

Dopo aver cambiato una variabile serve un **Redeploy**: i valori vengono letti alla pubblicazione.

## Firebase (progetto `good-lact`)
- **Authentication > Settings > Domini autorizzati**: aggiungere ogni indirizzo da cui si accede (dominio di produzione, eventuali domini personalizzati).
- **Authentication > Metodi di accesso**: devono restare attivi Google e "Link via email".
- **Regole Firestore**: dopo la modifica di `firestore.rules`, pubblicarle dalla console (Firestore > Regole > Pubblica) oppure da terminale:
  `firebase deploy --only firestore:rules --project good-lact`
  Le regole **non** si pubblicano da sole con Vercel: l'unione a `main` non basta.
- **Anteprime Vercel**: hanno un indirizzo diverso a ogni ramo, quindi l'accesso Firebase (Google/link email) lì **non funziona** finché quel dominio non è nei domini autorizzati. Le alternative sono autorizzarlo a mano oppure creare un progetto Firebase di staging (con la sua configurazione). L'app senza account funziona comunque nell'anteprima.
- I dati in Firestore stanno in `users/{uid}/data/{settings|today|history|experiences|symptoms}`, con campi `json` (stringa) e `updatedAt` (numero).

## Backup (prima di una modifica importante)
- **Dall'app**: Il mio profilo > esporta dati (JSON). Conservare il file lontano dal repository.
- **Firestore**: console Google Cloud > Firestore > Importa/Esporta (richiede un bucket), oppure `gcloud firestore export gs://<bucket>/backup-rilascio --project good-lact`.
- **Non salvare mai file di backup nel repository** (`good-lact-backup-*.json` è ignorato da `.gitignore`, ma non affidarsi solo a quello).

## Se qualcosa va storto
- **Sito**: Vercel > Deployments > scegliere l'ultimo deploy funzionante > **Instant Rollback** (oppure "Promote to Production"). È immediato e non tocca il codice: poi si corregge su un ramo `fix/<nome>`.
- **Regole Firestore**: console > Firestore > Regole > cronologia, e ripubblicare la versione precedente (oppure `git show main~N:firestore.rules`).
- **Chiavi compromesse**: revocare **subito** la chiave in Google AI Studio, crearne una nuova, aggiornarla in Vercel e fare **Redeploy**.
- **Dati**: importare un backup solo se i dati sono stati alterati.

## Dopo il rilascio
Controllare sul dominio di produzione:
1. L'app si carica (anche da finestra privata) e non ci sono errori in console.
2. Un'analisi di prova funziona (testo, e se toccata la parte, foto).
3. L'installazione come PWA è proposta e l'app installata si apre.
4. L'accesso (Google o link email) funziona e i dati si risincronizzano.
5. In Vercel i log delle funzioni `/api/*` non mostrano errori.

## Avvertenza sulla chiave trapelata
In passato una chiave Google è finita nel repository: **è ancora nella cronologia git** (cancellarla dal codice non la rimuove dalla storia). Va considerata **compromessa e revocata**: verificare in Google AI Studio / Google Cloud che quella vecchia sia stata davvero eliminata e che in uso ci sia solo la nuova, impostata su Vercel. Riscrivere la cronologia non rende sicura la chiave: conta solo la revoca.
