import {test} from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement=class{attachShadow(){return this.shadowRoot={innerHTML:'',querySelector:()=>null};}};
globalThis.customElements={get:()=>undefined,define:()=>{}};
globalThis.window={};globalThis.document={querySelector:()=>null};
const {HistoryGraphCard}=await import('../src/history-graph-card.js');

function render({unit='kW',value=0,show_legend=true,count=1}={}){
 const card=new HistoryGraphCard(),entities=Array.from({length:count},(_,i)=>'sensor.axis_'+i);
 card.setConfig({entities,show_legend});
 card._hass={language:'en',states:Object.fromEntries(entities.map(id=>[id,{attributes:{friendly_name:id,unit_of_measurement:unit}}]))};
 card._series=entities.map(id=>({id,points:[{t:0,v:value},{t:50,v:value}]}));
 card._start=0;card._end=100;card._status='ready';card._render();
 return card.shadowRoot.innerHTML;
}

test('one axis places the unit after every legend value and inside the chart',()=>{
 for(const count of [1,2]){
  const html=render({count});
  assert.equal((html.match(/<strong>0 kW<\/strong>/g)??[]).length,count);
  assert.doesNotMatch(html,/<span class="unit">/);
  assert.match(html,/<div class="chart"[^>]*>[\s\S]*?<span class="axis-unit"[^>]*>kW<\/span>/);
  assert.equal((html.match(/class="axis-unit"/g)??[]).length,1);
 }
});

test('one axis retains its in-chart unit with the legend hidden',()=>{
 const html=render({show_legend:false});
 assert.doesNotMatch(html,/<div class="data-status">kW<\/div>/);
 assert.match(html,/<span class="axis-unit"[^>]*>kW<\/span>/);
 assert.doesNotMatch(html,/<button[^>]*class="legend-item/);
});

test('single-axis units stay escaped and missing or unitless values stay meaningful',()=>{
 assert.match(render({unit:'<W>'}),/<strong>0 &lt;W&gt;<\/strong>/);
 assert.match(render({unit:'<W>'}),/title="&lt;W&gt;"[^>]*>&lt;W&gt;<\/span>/);
 assert.match(render({value:null}),/<strong>Unavailable<\/strong>/);
 const unitless=render({unit:''});
 assert.match(unitless,/<strong>0<\/strong>/);
 assert.doesNotMatch(unitless,/class="axis-unit"/);
});
