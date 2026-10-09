// Valori di riferimento del lattosio (g ogni 100 g di alimento) per le
// categorie che l'AI può riconoscere. Sono la fonte "fidata": il modello
// sceglie la categoria e i grammi, ma NON inventa il contenuto di lattosio.
// Sono medie indicative da tabelle di composizione degli alimenti; i valori
// vanno rivisti con il database ufficiale di Francesco prima dell'uso reale.

export const LACTOSE_REFERENCE = {
  latte: { label: 'Latte', per100g: 4.8 },
  latte_senza_lattosio: { label: 'Latte senza lattosio', per100g: 0 },
  panna: { label: 'Panna', per100g: 3.2 },
  burro: { label: 'Burro', per100g: 0.6 },
  burro_chiarificato: { label: 'Burro chiarificato', per100g: 0 },
  besciamella: { label: 'Besciamella', per100g: 4.2 },
  yogurt: { label: 'Yogurt', per100g: 4.0 },
  gelato_al_latte: { label: 'Gelato al latte', per100g: 5.0 },
  sorbetto: { label: 'Sorbetto', per100g: 0 },
  crema_pasticcera: { label: 'Crema pasticcera', per100g: 4.0 },
  cioccolato_al_latte: { label: 'Cioccolato al latte', per100g: 8.0 },
  mozzarella: { label: 'Mozzarella', per100g: 0.64 },
  ricotta: { label: 'Ricotta', per100g: 3.0 },
  mascarpone: { label: 'Mascarpone', per100g: 4.4 },
  formaggio_fresco_spalmabile: { label: 'Formaggio fresco spalmabile', per100g: 3.0 },
  stracchino_crescenza: { label: 'Stracchino / crescenza', per100g: 3.5 },
  formaggio_fuso: { label: 'Formaggio fuso / sottilette', per100g: 4.5 },
  formaggio_semistagionato: { label: 'Formaggio semistagionato', per100g: 0.5 },
  formaggio_stagionato: { label: 'Formaggio stagionato', per100g: 0 },
  salsa_cremosa_con_latte: { label: 'Salsa cremosa con latte', per100g: 2.5 },
  impasto_con_latte: { label: 'Impasto con latte', per100g: 2.5 },
  salume_con_latte: { label: 'Salume con latte', per100g: 0.5 },
  nessun_lattosio: { label: 'Senza lattosio', per100g: 0 },
};

export const CATEGORY_KEYS = [...Object.keys(LACTOSE_REFERENCE), 'altro'];

// Limite di sicurezza per i valori stimati dal modello nella categoria "altro".
export const MAX_OTHER_PER100G = 8;
