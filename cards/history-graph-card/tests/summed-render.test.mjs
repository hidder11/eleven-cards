import {test} from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement=class{attachShadow(){return this.shadowRoot={innerHTML:'',querySelector:()=>null};}};
globalThis.customElements={get:()=>undefined,define:()=>{}};globalThis.window=new EventTarget();globalThis.document={querySelector:()=>null,addEventListener(){},removeEventListener(){}};
const {HistoryGraphCard:C}=await import('../src/history-graph-card.js');
const {BarChartCard:B}=await import('../../bar-chart/src/bar-chart.js');
const {text}=await import('../src/localization.js');
function hass(){return {language:'en',config:{time_zone:'UTC'},states:Object.fromEntries(['a','b'].map(id=>['sensor.'+id,{attributes:{unit_of_measurement:'W',friendly_name:id}}])),callApi:async()=>['a','b'].map((id,i)=>[{entity_id:'sensor.'+id,last_updated:new Date(Date.now()-3600000).toISOString(),state:String(2+i),attributes:{unit_of_measurement:'W'}}])};}
const config={entities:['sensor.a'],hours_to_show:1,data_source:'history',series_options:[{entity:'sensor.a',name:'Total',sum_entities:['sensor.b']}]};
test('Graph and Bar native forms expose additional sensors with localized helper',()=>{
 for(const Class of [C,B]){
  const form=Class.getSeriesConfigForm(),field=form.schema.find(s=>s.name==='sum_entities');
  assert.equal(field?.selector.entity.multiple,true);assert.equal(field.selector.entity.domain,'sensor');
  assert.match(form.computeLabel.call({hass:{language:'nl'}},field),/optellen/);
  assert.match(form.computeHelper.call({hass:{language:'en'}},field),/primary/);
 }
});
test('Graph and Bar refresh, legend, tooltip data, history link and toggle operate on one summed series',async()=>{
 for(const Class of [C,B]){
  const c=new Class();c.setConfig(config);c._hass=hass();c._connected=true;
  await c._refresh();
  assert.equal(c._status,'ready');assert.equal(c._series.length,1);assert.equal(c._series[0].points.find(p=>p.v!==null).v,5);
  assert.equal(c._meta.items[0].name,'Total');assert.match(c.shadowRoot.innerHTML,/Total/);
  assert.match(decodeURIComponent(c._historyUrl()),/sensor.a,sensor.b/);
  c._toggleSeries('sensor.a');assert.equal(c._isSeriesVisible(0),false);assert.equal(c._series.length,1);
  c.disconnectedCallback();
 }
});
test('contributor units are checked at runtime and recover after correction',async()=>{
 const c=new C();c.setConfig(config);const h=hass();h.states['sensor.b'].attributes.unit_of_measurement='kW';c._hass=h;c._connected=true;
 await c._refresh();assert.equal(c._status,'sum_unit');assert.match(c.shadowRoot.innerHTML,/same unit/);
 h.states['sensor.b'].attributes.unit_of_measurement='W';await c._refresh();assert.equal(c._status,'ready');c.disconnectedCallback();
 assert.notEqual(text('sum_entities_error','nl'),'sum_entities_error');
});
test('sum contributor context changes invalidate cached and in-flight data and recover without waiting for timer',async()=>{
 const c=new C();c.setConfig(config);const h=hass();c.hass=h;c._connected=true;await c._refresh();
 const generation=c._generation;
 c.hass={...h,states:{...h.states,'sensor.b':{attributes:{unit_of_measurement:'kW'}}}};
 assert.ok(c._generation>generation);assert.equal(c._rawSeries,null);assert.equal(c._status,'sum_unit');
 c.hass=h;await new Promise(resolve=>setImmediate(resolve));assert.equal(c._status,'ready');assert.equal(c._series[0].points.find(p=>p.v!==null).v,5);c.disconnectedCallback();
});
