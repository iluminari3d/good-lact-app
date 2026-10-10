// Estrae il lattosio MISURATO dai CSV di USDA FoodData Central.
//
// Uso:
//   1. Scarica da https://fdc.nal.usda.gov/download-datasets i dataset
//      "Foundation Foods" e "SR Legacy" (CSV) e decomprimili.
//   2. node scripts/usda.mjs <cartella1> [<cartella2> ...] [--out file.json]
//
// Ogni cartella deve contenere food.csv, nutrient.csv e food_nutrient.csv.
// Un alimento senza riga "Lactose" NON viene elencato: significa "non
// analizzato", che è diverso da "zero". Solo gli alimenti con un valore
// misurato (anche 0) compaiono nel risultato.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALLOWED_DATA_TYPES = new Set(['foundation_food', 'sr_legacy_food']);

/** Parser CSV (RFC 4180): campi tra virgolette, virgolette raddoppiate, a capo nei campi. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function readTable(dir, name) {
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) throw new Error(`File mancante: ${file}`);
  return toObjects(parseCsv(fs.readFileSync(file, 'utf8')));
}

/** Legge una cartella FDC e restituisce gli alimenti con lattosio misurato. */
export function extractLactose(dir) {
  const nutrients = readTable(dir, 'nutrient.csv');
  const lactoseIds = new Set(
    nutrients.filter((n) => n.name.trim().toLowerCase() === 'lactose').map((n) => n.id),
  );
  if (lactoseIds.size === 0) throw new Error(`Nessun nutriente "Lactose" in ${dir}/nutrient.csv`);

  const foods = new Map();
  for (const f of readTable(dir, 'food.csv')) {
    if (ALLOWED_DATA_TYPES.has(f.data_type)) foods.set(f.fdc_id, f);
  }

  const out = [];
  for (const fn of readTable(dir, 'food_nutrient.csv')) {
    if (!lactoseIds.has(fn.nutrient_id)) continue;
    const food = foods.get(fn.fdc_id);
    if (!food) continue;
    const amount = Number(fn.amount);
    if (!Number.isFinite(amount) || amount < 0) continue;
    out.push({
      fdcId: Number(fn.fdc_id),
      description: food.description.trim(),
      dataType: food.data_type,
      lactosePer100g: Math.round(amount * 1000) / 1000,
    });
  }
  return out;
}

export function buildTable(dirs) {
  const byId = new Map();
  for (const dir of dirs) for (const item of extractLactose(dir)) byId.set(item.fdcId, item);
  return [...byId.values()].sort((a, b) => a.description.localeCompare(b.description, 'en'));
}

function main(argv) {
  const outIndex = argv.indexOf('--out');
  const out = outIndex >= 0 ? argv[outIndex + 1] : 'src/data/usda-lactose.json';
  const dirs = argv.filter((a, i) => !a.startsWith('--') && i !== outIndex + 1);
  if (dirs.length === 0) {
    console.error('Uso: node scripts/usda.mjs <cartella-fdc> [<altra-cartella>] [--out file.json]');
    process.exit(1);
  }
  const foods = buildTable(dirs);
  const payload = {
    source: 'USDA FoodData Central',
    url: 'https://fdc.nal.usda.gov/',
    note: 'Lactose in g per 100 g. Gli alimenti non elencati non sono stati analizzati (valore sconosciuto, non zero).',
    generatedAt: new Date().toISOString(),
    count: foods.length,
    foods,
  };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(payload, null, 2) + '\n');
  console.log(`${foods.length} alimenti con lattosio misurato scritti in ${out}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2));
}
