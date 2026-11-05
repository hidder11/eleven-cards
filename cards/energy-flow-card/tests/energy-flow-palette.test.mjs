import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowStyles} from '../src/energy-flow-styles.js';
import {energyFlowMetrics} from '../src/energy-flow-metrics.js';
import {energyFlowDetailStyles} from '../src/energy-flow-details.js';

test('fresh semantic palette follows Weather hues, preserving HA Energy overrides',()=>{
 for(const value of ['#f3b51b','#ffd45c','#269ad5','#76cafa','#269b79','#74d8ac','#8873dc','#b8a7ff'])assert.ok(energyFlowStyles.includes(value),value);
 for(const role of ['solar','grid-consumption','grid-return'])assert.ok(energyFlowStyles.includes(`var(--energy-${role}-color,`),role);
 assert.match(energyFlowStyles,/data-route=return\]\{color:var\(--return\)\}/);
 assert.ok(!energyFlowStyles.includes('#946800'),'no muddy ochre solar');
});
test('export metrics and details share the return family rather than solar yellow',()=>{
 const m=energyFlowMetrics({solar:4,import:1,export:2},false,true,String);
 assert.match(m.grid,/data-metric="export" style="--ui-metric-tone:var\(--return\)"/);
 assert.ok(energyFlowDetailStyles.includes('--detail-export:var(--energy-grid-return-color,var(--return,'));
});
