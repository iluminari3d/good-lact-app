/**
 * Ricerca per codice a barre su Open Food Facts (dati collaborativi, non verificati).
 * Non restituisce mai un verdetto "sicuro": riporta solo ciò che è scritto nella scheda.
 */
export interface BarcodeProduct {
  code: string;
  name: string;
  brand: string;
  ingredients: string;
  milkAllergen: boolean;
  milkTraces: boolean;
  lactoseFreeLabel: boolean;
  /** true se la scheda non riporta alcuna informazione su allergeni e ingredienti */
  incomplete: boolean;
}

const LACTOSE_FREE_LABELS = ['en:no-lactose', 'en:lactose-free', 'it:senza-lattosio'];

export function isValidEan(code: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(code);
}

interface OffProduct {
  product_name?: string;
  product_name_it?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_text_it?: string;
  allergens_tags?: string[];
  traces_tags?: string[];
  labels_tags?: string[];
}

export function parseOffProduct(code: string, p: OffProduct): BarcodeProduct {
  const allergens = p.allergens_tags ?? [];
  const traces = p.traces_tags ?? [];
  const labels = p.labels_tags ?? [];
  const ingredients = (p.ingredients_text_it || p.ingredients_text || '').trim();
  return {
    code,
    name: (p.product_name_it || p.product_name || 'Prodotto senza nome').trim(),
    brand: (p.brands ?? '').split(',')[0]?.trim() ?? '',
    ingredients,
    milkAllergen: allergens.includes('en:milk'),
    milkTraces: traces.includes('en:milk'),
    lactoseFreeLabel: labels.some((l) => LACTOSE_FREE_LABELS.includes(l)),
    incomplete: !ingredients && allergens.length === 0,
  };
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<BarcodeProduct | null> {
  if (!isValidEan(code)) throw new Error('Il codice a barre non è valido: servono 8, 12, 13 o 14 cifre.');
  const fields = 'product_name,product_name_it,brands,ingredients_text,ingredients_text_it,allergens_tags,traces_tags,labels_tags';
  let res: Response;
  try {
    res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${fields}`, { signal });
  } catch {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    throw new Error('Non riesco a contattare Open Food Facts. Controlla la connessione.');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Open Food Facts non ha risposto. Riprova tra poco.');
  const json = (await res.json()) as { status?: number; product?: OffProduct };
  if (json.status !== 1 || !json.product) return null;
  return parseOffProduct(code, json.product);
}
