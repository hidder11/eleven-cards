import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SharedGraph} from '../shared/graph.js';
test('all chart tooltips consume the shared compact list surface and row style',()=>{
 const css=SharedGraph.tooltipStyles();
 for(const rule of ['padding:12px','border-radius:8px','border:0','box-shadow:var(--eleven-surface-shadow)','grid-template-columns:7px minmax(0,1fr)','grid-template-columns:minmax(0,1fr) auto'])assert.ok(css.includes(rule));
 for(const path of ['timeline-card/src/timeline-view.js','history-graph-card/src/history-graph-card.js','dynamic-energy-price-card/src/dynamic-energy-price-card.js']){
  assert.ok(readFileSync(new URL('../cards/'+path,import.meta.url),'utf8').includes('${SharedGraph.tooltipStyles()}'),path+' must use shared Timeline tooltip styles');
 }
});
