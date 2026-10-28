import {test} from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement=class{attachShadow(){return this.shadowRoot={innerHTML:'',querySelector:()=>null};}};
globalThis.customElements={get:()=>undefined,define:()=>{}};
globalThis.window=new EventTarget();
globalThis.document={querySelector:()=>null,addEventListener(){},removeEventListener(){}};
const {HistoryGraphCard}=await import('../src/history-graph-card.js');
const {BarChartCard}=await import('../../bar-chart/src/bar-chart.js');
const config={entities:['sensor.a'],hours_to_show:1,data_source:'history',series_options:[{entity:'sensor.a',sum_entities:['sensor.b']}]};
const states=unit=>Object.fromEntries(['a','b'].map(id=>['sensor.'+id,{state:'2',attributes:{unit_of_measurement:unit}}]));
for(const Class of [HistoryGraphCard,BarChartCard])test(`${Class.name}: live statistics legend sums all contributors and updates with them`,()=>{
 const card=new Class();card.setConfig(config);
 const base={language:'en',config:{time_zone:'UTC'},states:states('W')};
 card.hass=base;
 card._start=Date.now()-3600000;card._end=card._start+3600000;
 card._series=[{id:'sensor.a',source:'statistics',points:[{t:card._start,v:4}]}];card._rawSeries=card._series;card._status='ready';
 card.hass=base; // Establish the ready-series signature before changing only a contributor.
 try{
  assert.equal(card._legendValue(card._series[0]),4);
  card.hass={...base,states:{...base.states,'sensor.b':{state:'3',attributes:{unit_of_measurement:'W'}}}};
  assert.equal(card._legendValue(card._series[0]),5);
  assert.match(card.shadowRoot.innerHTML,/<strong>5<\/strong>/);
  card.hass={...base,states:{...base.states,'sensor.b':{state:'unavailable',attributes:{unit_of_measurement:'W'}}}};
  assert.equal(card._legendValue(card._series[0]),null,'missing contributor is not zero');
 }finally{card.disconnectedCallback();}
});
for(const Class of [HistoryGraphCard,BarChartCard])test(`${Class.name}: first load discards old-unit totals when hass precedes config`,async()=>{
 const card=new Class();let resolve;
 const before={language:'en',config:{time_zone:'UTC'},states:states('W'),callApi:()=>new Promise(r=>{resolve=r;})};
 card.hass=before;card.setConfig(config);card._connected=true;
 const pending=card._refresh(),generation=card._generation;
 const after={...before,states:states('kW'),callApi:async()=>['a','b'].map(id=>[{entity_id:'sensor.'+id,state:'0.002',last_updated:new Date(Date.now()-3600000).toISOString(),attributes:{unit_of_measurement:'kW'}}])};
 try{
  card.hass=after;
  resolve(['a','b'].map(id=>[{entity_id:'sensor.'+id,state:'2',last_updated:new Date(Date.now()-3600000).toISOString(),attributes:{unit_of_measurement:'W'}}]));
  await pending;await new Promise(r=>setImmediate(r));
  assert.ok(card._generation>generation,'unit change must invalidate the first request');
  assert.equal(card._status,'ready');
  assert.equal(card._series[0].points.find(p=>p.v!==null).v,0.004,'never relabel old W readings as kW');
 }finally{card.disconnectedCallback();}
});
