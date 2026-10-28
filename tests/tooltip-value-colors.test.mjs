import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
for(const path of ['cards/timeline-card/src/timeline-view.js','cards/history-graph-card/src/history-graph-card.js','cards/dynamic-energy-price-card/src/dynamic-energy-price-card.js'])test(path+' separates tooltip series labels and values',()=>{
 const src=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(src.includes('class="tooltip-label"'));assert.ok(src.includes('class="tooltip-value"'));
});
