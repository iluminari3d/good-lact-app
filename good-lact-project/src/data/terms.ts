export interface TermsSection { title: string; paragraphs: string[] }

export const TERMS_UPDATED = '11 ottobre 2026';

export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: "Che cos'è Good Lact",
    paragraphs: [
      "Good Lact è uno strumento di supporto per chi ha intolleranza al lattosio: stima quanta lattasi prendere in base a ciò che mangi. La stima è indicativa. Non è un dispositivo medico, non è un parere medico e non sostituisce il medico o il farmacista.",
      "L'app non può sapere se un alimento è stato contaminato con latte durante la preparazione, né garantire l'assenza totale di lattosio. Se hai sintomi forti o diversi da quelli digestivi (per esempio orticaria o gonfiore di labbra e gola) contatta un medico; in caso di difficoltà a respirare chiama il 112.",
    ],
  },
  {
    title: 'Quali dati usa e dove restano',
    paragraphs: [
      "Sul tuo dispositivo: impostazioni, assunzioni di lattasi, esperienze sui cibi e diario dei sintomi sono salvati nella memoria del browser di questo dispositivo.",
      "Analisi di piatti, etichette e menu: il testo o la foto che invii vengono trasmessi al nostro server e da lì al servizio Gemini di Google per essere elaborati. Non conserviamo né i testi né le foto. Google li tratta secondo i termini del servizio Gemini API in vigore. Evita di fotografare persone.",
      "Ricerca per codice a barre: se la usi, il codice che scrivi viene inviato a Open Food Facts (openfoodfacts.org) per ottenere la scheda del prodotto. Non inviamo altri dati.",
      "Account facoltativo: se accedi, l'indirizzo email e i dati da sincronizzare (impostazioni, esperienze, diario e storico) sono salvati su Firebase, un servizio di Google, e sono leggibili solo dal tuo account.",
      "Non usiamo pubblicità, profilazione o strumenti di analisi del comportamento, e non vendiamo né cediamo i tuoi dati.",
    ],
  },
  {
    title: 'Dati relativi alla salute e consenso',
    paragraphs: [
      "Il diario dei sintomi e lo storico delle assunzioni possono essere dati relativi alla salute. Li trattiamo solo per offrirti le funzioni dell'app. Accettando questi termini ci dai il consenso a questo trattamento. Puoi revocarlo in qualsiasi momento cancellando i dati dalle impostazioni.",
    ],
  },
  {
    title: 'I tuoi diritti',
    paragraphs: [
      "Puoi esportare i tuoi dati (Profilo → Backup), cancellare quelli di questo dispositivo, eliminare l'account e i dati nel cloud, e chiedere informazioni scrivendo a info@iluminari3d.com.",
      "Titolare del trattamento: I Luminari S.R.L.S., Via Annunziata 32, 72019 San Vito dei Normanni (BR).",
    ],
  },
  {
    title: 'Uso corretto e responsabilità',
    paragraphs: [
      "Usa l'app come aiuto e non come unica fonte di decisione: la dose consigliata è una stima, e i valori di lattosio degli alimenti sono indicativi finché non sono verificati su fonti ufficiali. Nei limiti consentiti dalla legge, il titolare non risponde di danni derivanti da un uso dell'app diverso da quello descritto.",
    ],
  },
  {
    title: 'Modifiche',
    paragraphs: [
      "Se questi termini cambiano in modo sostanziale ti chiederemo di accettarli di nuovo al prossimo avvio. La data di ultimo aggiornamento è indicata in alto.",
    ],
  },
];
