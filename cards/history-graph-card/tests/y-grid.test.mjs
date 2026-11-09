import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedGraph} from '../../../shared/graph.js';
globalThis.HTMLElement=class{attachShadow(){return this.shadowRoot={innerHTML:'',querySelector:()=>null};}};
globalThis.customElements={get:()=>undefined,define:()=>{}};globalThis.window={};globalThis.document={querySelector:()=>null};
const {HistoryGraphCard}=await import('../src/history-graph-card.js');
const {BarChartCard}=await import('../../bar-chart/src/bar-chart.js');
for(const C of [HistoryGraphCard,BarChartCard]){
 test(C.name+' grid defaults off and exposes localized native switch',()=>{
  const c=new C();c.setConfig({entities:['sensor.a']});assert.equal(c._config.show_y_grid,false);
  const f=C.getConfigForm(),s=f.schema.find(s=>s.name==='y_axis').schema.find(s=>s.name==='show_y_grid');
  assert.deepEqual(s,{name:'show_y_grid',default:false,selector:{boolean:{}}});
  assert.equal(f.computeLabel.call({hass:{language:'nl'}},s),'Horizontaal raster tonen');
  assert.equal(f.computeLabel.call({hass:{language:'en'}},s),'Show horizontal grid');
  assert.throws(()=>c.setConfig({entities:['sensor.a'],show_y_grid:'true'}));
 });
 test(C.name+' renders tick-aligned grid only when enabled, behind data',()=>{
  const c=new C();c.setConfig({entities:['sensor.a','sensor.b'],show_y_grid:true,sync_hover:false});
  c._hass={language:'en',states:{'sensor.a':{attributes:{unit_of_measurement:'°C'}},'sensor.b':{attributes:{unit_of_measurement:'W'}}}};
  c._series=[{id:'sensor.a',points:[{t:0,v:-10},{t:1,v:20}]},{id:'sensor.b',points:[{t:0,v:-200},{t:1,v:50}]}];c._start=0;c._end=2;c._status='ready';c._render();
  const html=c.shadowRoot.innerHTML, lines=[...html.matchAll(/<line class="y-grid-line"[^>]*y1="([^"]+)"/g)];
  const expected=[...new Set(c._axes.flatMap(a=>a.ticks.map(v=>Number(((a.max-v)/(a.max-a.min)*300).toFixed(6)))))];
  assert.equal(lines.length,expected.length);assert.deepEqual(lines.map(m=>Number(m[1])).sort((a,b)=>a-b),expected.sort((a,b)=>a-b));
  assert.ok(html.indexOf('<line class="y-grid-line"')<html.indexOf('class="chart-series'));
  c._config.show_y_grid=false;c._render();assert.ok(!c.shadowRoot.innerHTML.includes('<line class="y-grid-line"'));
  assert.ok(c.shadowRoot.innerHTML.includes('class="grid-edges"'),'develop plot boundaries survive');
  c._config.show_grid=false;c._render();assert.doesNotMatch(c.shadowRoot.innerHTML,/<(?:line|g) class="(?:grid-|y-grid)/);
  c._config.show_y_grid=true;c._render();assert.match(c.shadowRoot.innerHTML,/<line class="y-grid-line"/);assert.doesNotMatch(c.shadowRoot.innerHTML,/class="grid-edges"/);
  assert.match(c._styles(),/\.legend-item strong\{color:var\(--primary-text-color,#20252b\)/);
 });
}
test('shared tooltip separates grey labels from theme-aware values without changing surface',()=>{
 const css=SharedGraph.tooltipStyles();assert.match(css,/\.tooltip \.tooltip-label\{[^}]*color:var\(--secondary-text-color/);assert.match(css,/\.tooltip \.tooltip-value\{[^}]*color:var\(--primary-text-color,#20252b\)/);
 assert.ok(css.includes('padding:12px'));assert.ok(css.includes('border-radius:8px'));assert.ok(css.includes('grid-template-columns:minmax(0,1fr) auto'));
});
