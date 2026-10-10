// Frasi da mostrare al personale di un ristorante, in 5 lingue.
// Volutamente semplici e prudenti: niente termini medici, niente promesse.

export type LanguageCode = 'it' | 'en' | 'fr' | 'es' | 'de';

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
];

export const LANGUAGE_CODES: LanguageCode[] = LANGUAGES.map((l) => l.code);

export type PhraseCategory = 'intro' | 'ingredients' | 'kitchen' | 'options' | 'thanks';

export interface Phrase {
  id: string;
  category: PhraseCategory;
  /** Titolo breve in italiano, per l'utente. */
  title: string;
  text: Record<LanguageCode, string>;
}

export const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  intro: 'Presentati',
  ingredients: 'Ingredienti',
  kitchen: 'Cucina',
  options: 'Alternative',
  thanks: 'Cortesia',
};

export const PHRASES: Phrase[] = [
  {
    id: 'intolerance',
    category: 'intro',
    title: 'Intolleranza severa',
    text: {
      it: 'Ho una intolleranza severa al lattosio: anche le tracce di latte mi fanno stare male.',
      en: 'I have a severe lactose intolerance: even traces of milk make me ill.',
      fr: "J'ai une intolérance sévère au lactose : même des traces de lait me rendent malade.",
      es: 'Tengo una intolerancia grave a la lactosa: incluso las trazas de leche me sientan mal.',
      de: 'Ich habe eine schwere Laktoseintoleranz: Schon Spuren von Milch machen mich krank.',
    },
  },
  {
    id: 'any-dairy',
    category: 'ingredients',
    title: 'Latticini in generale',
    text: {
      it: 'Questo piatto contiene latte, burro, panna o formaggio, anche in salsa o nella cottura?',
      en: 'Does this dish contain milk, butter, cream or cheese, even in the sauce or in the cooking?',
      fr: 'Ce plat contient-il du lait, du beurre, de la crème ou du fromage, même dans la sauce ou la cuisson ?',
      es: '¿Este plato lleva leche, mantequilla, nata o queso, incluso en la salsa o en la cocción?',
      de: 'Enthält dieses Gericht Milch, Butter, Sahne oder Käse, auch in der Soße oder beim Braten?',
    },
  },
  {
    id: 'butter',
    category: 'ingredients',
    title: 'Burro',
    text: {
      it: 'Questo piatto contiene burro?',
      en: 'Does this dish contain butter?',
      fr: 'Ce plat contient-il du beurre ?',
      es: '¿Este plato lleva mantequilla?',
      de: 'Enthält dieses Gericht Butter?',
    },
  },
  {
    id: 'cream',
    category: 'ingredients',
    title: 'Panna',
    text: {
      it: 'Questo piatto contiene panna?',
      en: 'Does this dish contain cream?',
      fr: 'Ce plat contient-il de la crème ?',
      es: '¿Este plato lleva nata?',
      de: 'Enthält dieses Gericht Sahne?',
    },
  },
  {
    id: 'milk',
    category: 'ingredients',
    title: 'Latte',
    text: {
      it: 'Questo piatto contiene latte?',
      en: 'Does this dish contain milk?',
      fr: 'Ce plat contient-il du lait ?',
      es: '¿Este plato lleva leche?',
      de: 'Enthält dieses Gericht Milch?',
    },
  },
  {
    id: 'cheese',
    category: 'ingredients',
    title: 'Formaggio',
    text: {
      it: 'Questo piatto contiene formaggio?',
      en: 'Does this dish contain cheese?',
      fr: 'Ce plat contient-il du fromage ?',
      es: '¿Este plato lleva queso?',
      de: 'Enthält dieses Gericht Käse?',
    },
  },
  {
    id: 'shared-pans',
    category: 'kitchen',
    title: 'Padelle e utensili in comune',
    text: {
      it: 'Le padelle, le pentole e gli utensili sono usati anche per piatti con latte, burro o formaggio?',
      en: 'Are the pans, pots and utensils also used for dishes with milk, butter or cheese?',
      fr: 'Les poêles, les casseroles et les ustensiles servent-ils aussi pour des plats avec du lait, du beurre ou du fromage ?',
      es: '¿Las sartenes, las ollas y los utensilios se usan también para platos con leche, mantequilla o queso?',
      de: 'Werden die Pfannen, Töpfe und Küchenutensilien auch für Gerichte mit Milch, Butter oder Käse verwendet?',
    },
  },
  {
    id: 'shared-fryer',
    category: 'kitchen',
    title: 'Friggitrice in comune',
    text: {
      it: 'La friggitrice è usata anche per alimenti con latte o formaggio, ad esempio impanati o pastellati?',
      en: 'Is the fryer also used for food containing milk or cheese, such as breaded or battered items?',
      fr: 'La friteuse sert-elle aussi à cuire des aliments contenant du lait ou du fromage, par exemple des produits panés ?',
      es: '¿La freidora se usa también para alimentos con leche o queso, por ejemplo empanados o rebozados?',
      de: 'Wird die Fritteuse auch für Speisen mit Milch oder Käse verwendet, zum Beispiel für panierte Gerichte?',
    },
  },
  {
    id: 'lactose-free-option',
    category: 'options',
    title: 'Opzione senza lattosio',
    text: {
      it: "C'è un'opzione senza lattosio?",
      en: 'Is there a lactose-free option?',
      fr: 'Y a-t-il une option sans lactose ?',
      es: '¿Hay alguna opción sin lactosa?',
      de: 'Gibt es eine laktosefreie Option?',
    },
  },
  {
    id: 'without-dairy',
    category: 'options',
    title: 'Preparare senza latticini',
    text: {
      it: 'Potete preparare questo piatto senza burro, panna e latte?',
      en: 'Could you prepare this dish without butter, cream and milk?',
      fr: 'Pouvez-vous préparer ce plat sans beurre, sans crème et sans lait ?',
      es: '¿Pueden preparar este plato sin mantequilla, sin nata y sin leche?',
      de: 'Können Sie dieses Gericht ohne Butter, Sahne und Milch zubereiten?',
    },
  },
  {
    id: 'thanks',
    category: 'thanks',
    title: 'Ringraziamento',
    text: {
      it: 'Grazie mille per la vostra attenzione e il vostro aiuto.',
      en: 'Thank you very much for your care and help.',
      fr: 'Merci beaucoup pour votre attention et votre aide.',
      es: 'Muchas gracias por su atención y su ayuda.',
      de: 'Vielen Dank für Ihre Aufmerksamkeit und Ihre Hilfe.',
    },
  },
];
