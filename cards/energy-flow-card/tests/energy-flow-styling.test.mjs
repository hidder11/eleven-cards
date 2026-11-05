import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowDiagram} from '../src/energy-flow-diagram.js';
import {energyFlowStyles} from '../src/energy-flow-styles.js';

test('noninteractive heading caption does not reserve an unused 44px touch row',()=>{
 assert.match(energyFlowStyles,/\.energy-heading \[data-ui-primary-value\]\[data-primary-layout=uniform\] \.primary-label:not\(button\)\{min-height:0\}/);
});

const data={solar:4.6,home:3.8,import:0,export:.8};
test('diagram keeps text and native detail buttons outside the scaled route SVG',()=>{
 const html=energyFlowDiagram(data,false,false,String);
 const svg=html.match(/<svg\b[^>]*viewBox="4 0 412 164"[\s\S]*?<\/svg>/)?.[0];
 assert.ok(svg,'the original routing viewport remains');
 assert.ok(!svg.includes('foreignObject'),'detail targets must not scale with routes');
 assert.ok(!svg.includes('flow-reading'),'readings must not scale with routes');
 assert.equal((html.match(/<button[^>]*class="circle-node"/g)||[]).length,3);
 assert.equal((html.match(/<div class="flow-reading"/g)||[]).length,3);
 assert.ok(html.includes('M40 78V18A8 8 0 0 1 48 10H372A8 8 0 0 1 380 18V78'));
});

test('HTML readings preserve unknown, zero, both grid totals, locale and escaping',()=>{
 const unknown=energyFlowDiagram({solar:null,home:null,import:null,export:null},false,true,String);
 assert.equal((unknown.match(/<div class="flow-reading"[^>]*>—<\/div>/g)||[]).length,3);
 const zero=energyFlowDiagram({solar:0,home:0,import:0,export:0},true,true,String);
 assert.equal((zero.match(/<div class="flow-reading"[^>]*>0<span class="flow-unit"> kWh<\/span><\/div>/g)||[]).length,3);
 const localized=energyFlowDiagram({solar:4.6,home:3.8,import:1,export:.8},false,true,value=>`<${String(value).replace('.',',')}>`);
 assert.ok(localized.includes('Netafname &lt;1&gt; kW, Teruglevering &lt;0,8&gt; kW'));
 assert.ok(localized.includes('data-direction="both"'));
 assert.ok(localized.includes('&lt;0,8&gt;<span class="flow-unit"> kW</span>'));
 assert.ok(!localized.includes('<0,8>'));
 const battery=energyFlowDiagram({...data,battery:true},false,false,String);
 for(const route of ['solar','return'])assert.ok(battery.includes(`data-route="${route}" data-active="false"`));
});
