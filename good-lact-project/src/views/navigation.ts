export type NavView =
  | 'main' | 'label' | 'restaurant' | 'diary' | 'more'
  | 'experiences' | 'report' | 'history' | 'settings' | 'faq';

/** Schermate che fanno parte del flusso "pasto": per la barra restano sotto "Pasto". */
export const MEAL_FLOW = ['main', 'dish', 'results', 'timer', 'lactose-free'] as const;

const MOBILE_TABS = ['main', 'label', 'restaurant', 'diary'] as const;

/** Quale scheda della barra in basso è attiva per la vista corrente. */
export function mobileTabFor(view: string): NavView {
  if ((MEAL_FLOW as readonly string[]).includes(view)) return 'main';
  if ((MOBILE_TABS as readonly string[]).includes(view)) return view as NavView;
  return 'more';
}

/** Voce attiva nella barra laterale del desktop. */
export function sidebarItemFor(view: string): NavView {
  if ((MEAL_FLOW as readonly string[]).includes(view)) return 'main';
  return view === 'more' ? 'main' : (view as NavView);
}
