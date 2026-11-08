import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/dynamic-energy-price-card.js',import.meta.url),'utf8');
test('legend separates graph while remaining grouped with header',()=>{
 assert.match(source,/\.legend\s*\{[^}]*margin:\s*0 0 10px/);
 assert.doesNotMatch(source,/\.legend\s*\{[^}]*margin-top:\s*9px/);
});
test('native periods disclosure reuses theme control and inset plot roles',()=>{
 assert.match(source,/cardThemeStyles\(\{plots:'\.chart,\.price-periods \.price-table-wrap',controls:'\.price-periods>summary'/);
 assert.match(source,/\.price-periods>summary\{[^}]*padding:10px 12px/);
 assert.match(source,/\.price-periods \.price-table-wrap\{[^}]*margin-top:8px[^}]*padding:8px/);
 assert.doesNotMatch(source,/\.price-periods\[open\]>summary\{[^}]*box-shadow/);
});
