import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTable, extractLactose, parseCsv } from './usda.mjs';

let dir;
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fdc-')); });
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

const write = (name, text) => fs.writeFileSync(path.join(dir, name), text);

function fixture() {
  write('nutrient.csv', [
    'id,name,unit_name,nutrient_nbr,rank',
    '1003,Protein,G,203,600',
    '1013,Lactose,G,213,1',
  ].join('\n'));
  write('food.csv', [
    'fdc_id,data_type,description,food_category_id,publication_date',
    '100,sr_legacy_food,"Cheese, mozzarella, whole milk",1,2019-04-01',
    '101,sr_legacy_food,"Cheese, parmesan, hard",1,2019-04-01',
    '102,sr_legacy_food,"Butter, ""salted""",1,2019-04-01',
    '103,branded_food,Marca Qualunque Latte,1,2021-01-01',
    '104,sr_legacy_food,"Cheese, feta",1,2019-04-01',
    '105,foundation_food,"Milk, whole\nfluid",1,2020-01-01',
  ].join('\n'));
  write('food_nutrient.csv', [
    'id,fdc_id,nutrient_id,amount,data_points,derivation_id',
    '1,100,1013,0.00,1,1',
    '2,100,1003,22.2,1,1',
    '3,101,1013,0.9,1,1',
    '4,102,1013,0.06,1,1',
    '5,103,1013,4.7,1,1',
    '6,104,1003,14.2,1,1',
    '7,105,1013,4.8,1,1',
  ].join('\n'));
}

describe('parseCsv', () => {
  it('gestisce virgole, virgolette raddoppiate e a capo nei campi', () => {
    const rows = parseCsv('a,b\n"x, y","say ""hi"""\n"due\nrighe",z\r\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', 'say "hi"'], ['due\nrighe', 'z']]);
  });

  it('ignora il BOM iniziale', () => {
    expect(parseCsv('﻿id,name\n1,A')[0]).toEqual(['id', 'name']);
  });
});

describe('extractLactose', () => {
  it('elenca solo alimenti con lattosio misurato dei tipi ammessi', () => {
    fixture();
    const foods = extractLactose(dir);
    const names = foods.map((f) => f.description);
    expect(names).toContain('Cheese, mozzarella, whole milk');
    expect(names).toContain('Butter, "salted"');
    expect(names).not.toContain('Marca Qualunque Latte'); // prodotto di marca: escluso
  });

  it('distingue "zero misurato" da "non analizzato"', () => {
    fixture();
    const foods = extractLactose(dir);
    const mozzarella = foods.find((f) => f.fdcId === 100);
    expect(mozzarella?.lactosePer100g).toBe(0); // misurato, zero
    expect(foods.find((f) => f.fdcId === 104)).toBeUndefined(); // feta: nessun dato -> sconosciuto
  });

  it('gestisce descrizioni con a capo', () => {
    fixture();
    expect(extractLactose(dir).find((f) => f.fdcId === 105)?.description).toBe('Milk, whole\nfluid');
  });

  it('trova il nutriente per nome e non per numero', () => {
    fixture();
    write('nutrient.csv', 'id,name,unit_name,nutrient_nbr,rank\n9999,Lactose,G,213,1\n');
    write('food_nutrient.csv', 'id,fdc_id,nutrient_id,amount\n1,101,9999,0.9\n');
    expect(extractLactose(dir).map((f) => f.fdcId)).toEqual([101]);
  });

  it('segnala file mancanti o assenza del nutriente', () => {
    expect(() => extractLactose(dir)).toThrow(/mancante/);
    fixture();
    write('nutrient.csv', 'id,name,unit_name,nutrient_nbr,rank\n1003,Protein,G,203,600\n');
    expect(() => extractLactose(dir)).toThrow(/Lactose/);
  });
});

describe('buildTable', () => {
  it('unisce più cartelle senza duplicati e ordina per nome', () => {
    fixture();
    const table = buildTable([dir, dir]);
    expect(new Set(table.map((f) => f.fdcId)).size).toBe(table.length);
    const names = table.map((f) => f.description);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });
});
