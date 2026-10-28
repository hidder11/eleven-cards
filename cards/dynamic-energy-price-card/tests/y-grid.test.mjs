import * as periods from '../../../shared/periods.js';
import * as header from '../../../shared/card-header.js';
import * as insights from '../../../shared/chart-insights.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as utils from '../src/price-utils.js';
import * as graph from '../../../shared/graph.js';
import * as localization from '../src/localization.js';
let Card;
const source=readFileSync(new URL('../src/dynamic-energy-price-card.js',import.meta.url),'utf8');
vm.runInNewContext(source.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm,''),{
 ...periods,...header,...insights,...graph,...utils,...localization,URLSearchParams,setTimeout,clearTimeout,console,
 Date:class extends Date {constructor(...args){super(...(args.length?args:['2026-10-11T12:00:00+02:00']));}},Intl,
 HTMLElement:class {attachShadow(){this.shadowRoot={querySelector:()=>null,querySelectorAll:()=>[]};}},
 customElements:{get:()=>undefined,define:(_,c)=>Card=c},window:{addEventListener(){},removeEventListener(){}},
});
const make=config=>{const c=new Card();c.setConfig({entity:'sensor.price',...config});return c;};
const base=Date.parse('2026-10-11T00:00:00+02:00');
function render(c){
 const data=Array.from({length:96},(_,i)=>({start_time:new Date(base+i*900000).toISOString(),price_per_kwh:-.1+i*.004}));
 c._hass={language:'en',config:{time_zone:'Europe/Amsterdam'},states:{'sensor.price':{attributes:{data}},'sensor.export':{attributes:{data}}}};
 c._render();return c.shadowRoot.innerHTML;
}
test('Y grid defaults off, validates booleans and has localized native General control',()=>{
 assert.equal(make()._config.show_y_grid,false);
 assert.equal(make({show_y_grid:undefined})._config.show_y_grid,false);
 assert.equal(Card.editorConfig().show_y_grid,false);
 for(const value of [null,'false',0,1,{}])assert.throws(()=>make({show_y_grid:value}),/show_y_grid/);
 for(const value of [true,false])assert.equal(make({show_y_grid:value})._config.show_y_grid,value);
 const form=Card.getConfigForm(),field=form.schema.find(s=>s.name==='graph_settings').schema.find(s=>s.name==='show_y_grid');
 assert.ok(field?.selector.boolean);assert.equal(field.default,false);
 assert.equal(form.computeLabel.call({hass:{language:'en'}},field),'Horizontal Y grid');
 assert.equal(form.computeLabel.call({hass:{language:'nl'}},field),'Horizontaal Y-raster');
 assert.match(form.computeHelper.call({hass:{language:'en'}},field),/tick/);
});
test('enabled grid matches every displayed price tick and stays behind series in all tariff modes',()=>{
 for(const graph_mode of ['import','export','both']){
  const c=make({show_y_grid:true,show_price_levels:false,export_entity:'sensor.export',graph_mode});
  const html=render(c),grid=[...html.matchAll(/<line class="y-grid-line"[^>]*y1="([^"]+)"[^>]*y2="([^"]+)"[^>]*>/g)];
  const labels=[...html.matchAll(/class="chart-label y-label" style="top:([^%]+)%"/g)];
  assert.equal(grid.length,labels.length);assert.ok(grid.length>0);
  grid.forEach((line,i)=>{assert.equal(line[1],line[2]);assert.ok(Math.abs(Number(line[1])/330*100-Number(labels[i][1]))<1e-8);});
  assert.ok(html.indexOf('class="y-grid-line"')<html.indexOf('class="price-line'));
  assert.match(c._styles(),/\.y-grid-line\s*\{[^}]*stroke: var\(--divider-color,#ddd\);[^}]*stroke-width: 0\.8;[^}]*vector-effect: non-scaling-stroke/);
  c._config.show_y_grid=false;assert.doesNotMatch(render(c),/<line class="y-grid-line"/);
 }
});
test('legend labels stay muted, compact latest value is neutral and swatches retain series colors',()=>{
 const c=make({import_line_color:[123,45,67]});
 const legend=c._seriesLegendItem('import','Import');
 assert.match(legend,/--series-color:rgb\(123, 45, 67\)/);
 assert.match(legend,/<span class="legend-label">Import<\/span>/);
 const compact=c._compactCurrentMetric('Import',{price:.2,timestamp:base},'import',new Set(),false);
 assert.match(compact,/<strong class="legend-value[^\"]*">20\.00<\/strong>/);
 assert.match(c._styles(),/\.legend-value\s*\{[^}]*color: var\(--primary-text-color,#20252b\)/);
 assert.doesNotMatch(c._styles(),/\.compact-current strong\.(negative|cheap|normal|expensive|unavailable)\s*\{/);
 assert.match(c._styles(),/\.legend-label\s*\{[^}]*color: var\(--secondary-text-color\)/);
});
test('tariff and consumption tooltips separate label and value inside the existing bold row',()=>{
 const c=make({show_consumption:true});
 c._chart={graphShowsConsumption:true,timeZone:'Europe/Amsterdam',consumptionPoints:[{timestamp:base,endTimestamp:base+3600000,energy:.6}],consumptionAppearance:c._seriesAppearance('consumption')};
 assert.match(c._consumptionTooltip(base).html,/<b><em class="tooltip-label">Grid import: <\/em><em class="tooltip-value">0\.600 kWh<\/em><\/b>/);
 assert.match(source,/<b><em class="tooltip-label">\$\{type === 'import'[\s\S]*?<\/em><em class="tooltip-value">\$\{this\._formatPrice\(price\)\} ct\/kWh<\/em><\/b>/);
});
