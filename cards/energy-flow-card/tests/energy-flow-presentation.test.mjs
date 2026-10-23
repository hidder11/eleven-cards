import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowDiagram} from '../src/energy-flow-diagram.js';
import {energyFlowMetrics} from '../src/energy-flow-metrics.js';
const format=value=>String(value);
const active=(html,name)=>html.includes(`data-route="${name}" data-active="true"`);

test('export uses the solar route; import follows the grid-to-home route',()=>{
 const exported=energyFlowDiagram({solar:4.6,home:3.8,import:0,export:.8},false,true,format);
 assert.ok(active(exported,'solar'));
 assert.ok(active(exported,'return'));
 assert.ok(!active(exported,'grid'));
 const imported=energyFlowDiagram({solar:0,home:3.8,import:3.8,export:0},false,true,format);
 assert.ok(active(imported,'grid'));
 assert.ok(!active(imported,'solar'));
 assert.ok(!active(imported,'return'));
});
test('storage and missing solar data cannot imply a known solar source',()=>{
 for(const data of [{solar:2,home:3,import:0,export:1,battery:true},{solar:null,home:null,import:0,export:1}]){
  const html=energyFlowDiagram(data,false,true,format);
  assert.ok(!active(html,'solar'));
  assert.ok(!active(html,'return'));
 }
});
test('history keeps both import/export totals accessible without animated dots',()=>{
 const html=energyFlowDiagram({solar:20,home:15,import:5,export:10},true,false,format);
 assert.ok(!html.includes('class="flow-dot"'));
 assert.ok(html.includes('Grid import 5 kWh, Grid export 10 kWh'));
 assert.ok(html.includes('data-direction="both"'));
});
test('shared metrics preserve unknown, zero, localization and safe formatted values',()=>{
 const metrics=energyFlowMetrics({solar:null,import:0,export:.8},false,false,value=>`<${value}>`,true);
 assert.ok(metrics.solar.includes('data-unavailable="true"'));
 assert.ok(!metrics.solar.includes('ui-metric-unit'));
 assert.ok(metrics.grid.includes('&lt;0&gt;'));
 assert.ok(metrics.grid.includes('Grid export'));
 assert.ok(metrics.grid.includes('data-energy-icon="import"'));
 assert.ok(metrics.grid.includes('data-energy-icon="export"'));
 assert.ok(metrics.grid.includes('data-density="compact"'));
 assert.ok(!metrics.grid.includes('<0>'));
});
