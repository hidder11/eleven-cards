import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as u from '../src/history-utils.js';
const start=Date.parse('2026-10-28T00:00:00Z'),end=start+3600000;
const row=(id,t,v,unit='W')=>({entity_id:id,last_updated:new Date(start+t).toISOString(),state:String(v),attributes:{unit_of_measurement:unit}});
const config=(extra={})=>({entities:['sensor.a'],data_source:'history',hours_to_show:1,series_options:[{entity:'sensor.a',name:'Total',sum_entities:['sensor.b']}],...extra});
function fixture(history){const calls=[];return {calls,states:Object.fromEntries(['a','b','c'].map(id=>['sensor.'+id,{attributes:{unit_of_measurement:'W',friendly_name:id}}])),callApi:async(method,url)=>{calls.push(url);return history;}};}
test('one summed series merges held readings on timestamps, not row indices, preserving gaps and zero',async()=>{
 const hass=fixture([[row('sensor.a',0,2),row('sensor.a',1200000,4),row('sensor.a',1800000,'unavailable'),row('sensor.a',2400000,-3)],[row('sensor.b',0,3),row('sensor.b',600000,5),row('sensor.b',2400000,3)]]);
 const result=await u.loadHistorySeries(hass,config(),start,end);
 assert.deepEqual(result.map(s=>s.id),['sensor.a']);
 assert.deepEqual(result[0].points.map(p=>[p.t-start,p.v]),[[0,5],[600000,7],[1200000,9],[1800000,null],[2400000,0]]);
 const ids=new URL(hass.calls[0],'https://fixture.test/').searchParams.get('filter_entity_id');assert.equal(ids,'sensor.a,sensor.b');
});
test('sum configuration rejects malformed, repeated, primary and oversized contributors without mutating frozen input',()=>{
 const input=config();Object.freeze(input.series_options[0].sum_entities);Object.freeze(input.series_options[0]);Object.freeze(input.series_options);Object.freeze(input);
 const validated=u.validateConfig(input),draft=u.editorConfig(validated),saved=u.cardConfig(draft);
 assert.deepEqual(saved.series_options[0].sum_entities,['sensor.b']);
 assert.notEqual(draft.entities[0].sum_entities,input.series_options[0].sum_entities);
 for(const sum_entities of ['sensor.b',null,['light.b'],['sensor.a'],['sensor.b','sensor.b'],Array.from({length:8},(_,i)=>'sensor.x'+i)]){
  assert.throws(()=>u.validateConfig(config({series_options:[{entity:'sensor.a',sum_entities}]})),/sum_entities/);
 }
 assert.deepEqual(u.historyEntityIds(config({entities:['sensor.a','sensor.b']})),['sensor.a','sensor.b']);
});
test('sum metadata validates every source and defaults to contributor names, while an explicit name wins',()=>{
 const hass=fixture([]),c=config();
 assert.equal(u.seriesMetadata(hass,c.entities,c.series_options).items[0].name,'Total');
 assert.equal(u.seriesMetadata(hass,c.entities,[{entity:'sensor.a',sum_entities:['sensor.b']}]).items[0].name,'a + b');
 hass.states['sensor.b'].attributes.unit_of_measurement='kW';
 assert.throws(()=>u.seriesMetadata(hass,c.entities,c.series_options),/sum_unit/);
 delete hass.states['sensor.b'];assert.throws(()=>u.seriesMetadata(hass,c.entities,c.series_options),/missing/);
});
