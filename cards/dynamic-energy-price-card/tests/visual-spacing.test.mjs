import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/dynamic-energy-price-card.js',import.meta.url),'utf8');
test('legend separates graph while remaining grouped with header',()=>{
 assert.match(source,/\.legend\s*\{[^}]*margin:\s*0 0 10px/);
 assert.doesNotMatch(source,/\.legend\s*\{[^}]*margin-top:\s*9px/);
});
test('native periods disclosure delegates grip and attached tray geometry to the shared stylesheet',()=>{
 assert.match(source,/uiCassetteStyles\(\)/);
 assert.doesNotMatch(source,/\.price-periods(?:\[open\])?>summary[\w:\-()]*\s*\{/);
 assert.doesNotMatch(source,/cardThemeStyles\([^\n]*price-periods/);
 assert.match(source,/\.price-table-wrap\s*\{[^}]*max-height:\s*190px[^}]*overflow:\s*auto/);
 assert.doesNotMatch(source,/\.price-table-wrap\s*\{[^}]*(?:margin-top|padding|border-top)/);
});
