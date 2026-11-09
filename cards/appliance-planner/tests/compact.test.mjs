import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/appliance-planner.js',import.meta.url),'utf8');
test('daily planner uses labeled compact selectors, not expanding button grids',()=>{
 assert.match(src,/<select id="appliance"/);
 assert.match(src,/<select id="program"/);
 assert.doesNotMatch(src,/class="choices"/);
});
test('one persistent Details disclosure owns supplemental metrics and graph',()=>{
 assert.match(src,/<details id="advice-details"/);
 assert.match(src,/this\.detailsOpen/);
 assert.doesNotMatch(src,/<details id="tariff-graph"/);
 assert.match(src,/class="price-level \$\{level\}"/);
});
