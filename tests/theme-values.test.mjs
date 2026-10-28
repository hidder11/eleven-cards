import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SharedGraph} from '../shared/graph.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('graph value hierarchy and grid use inherited HA theme tokens in both themes',()=>{
 const css=SharedGraph.tooltipStyles();
 assert.match(css,/\.tooltip \.tooltip-value\{[^}]*color:var\(--primary-text-color,#20252b\)/);
 assert.match(css,/\.tooltip \.tooltip-label\{font-style:normal;color:var\(--secondary-text-color,#9ca3af\)\}/);
 const grid=SharedGraph.yGrid([{min:-1,max:1,ticks:[-1,0,1]}]);
 assert.match(grid,/stroke="var\(--divider-color,#ddd\)"/);
 assert.equal((grid.match(/stroke-width="0.8"/g)||[]).length,3);
 assert.equal((grid.match(/stroke-opacity="1"/g)||[]).length,1);
 const history=read('cards/history-graph-card/src/history-graph-card.js');
 assert.match(history,/\.legend-item strong\{color:var\(--primary-text-color,#20252b\);/);
 const energy=read('cards/dynamic-energy-price-card/src/dynamic-energy-price-card.js');
 assert.match(energy,/\.legend-value\s*\{ color: var\(--primary-text-color,#20252b\); \}/);
 assert.match(energy,/\.y-grid-line\s*\{ stroke: var\(--divider-color,#ddd\); stroke-width: 0\.8; vector-effect: non-scaling-stroke; \}/);
});
