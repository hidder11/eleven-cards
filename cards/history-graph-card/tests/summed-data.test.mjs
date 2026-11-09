import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadHistorySeries,aggregateSeries,valueAt} from '../src/history-utils.js';
const start=Date.parse('2026-10-28T00:00:00Z'),hour=3600000,end=start+hour;
const config=(extra={})=>({entities:['sensor.a'],hours_to_show:1,data_source:'statistics',aggregation_period:'hour',aggregation_method:'avg',series_options:[{entity:'sensor.a',sum_entities:['sensor.b']}],...extra});
function fixture({method='mean',missing=false}={}){
 const calls=[],states=Object.fromEntries(['a','b'].map(id=>['sensor.'+id,{attributes:{unit_of_measurement:'W'}}]));
 return {calls,states,callWS:async request=>{calls.push(request);if(request.type.endsWith('metadata'))return ['a',...(!missing?['b']:[])].map(id=>({statistic_id:'sensor.'+id,has_mean:true,has_sum:true,unit_of_measurement:'W'}));return Object.fromEntries(request.statistic_ids.map((id,i)=>[id,[{start,end,[method]:2+i}]]));},
 callApi:async(method,url)=>{calls.push(url);return ['a','b'].map((id,i)=>[{entity_id:'sensor.'+id,last_updated:new Date(start).toISOString(),state:String(2+i),attributes:{unit_of_measurement:'W'}}]);}};
}
test('minimum of a sum is calculated before aggregation, auto uses raw history rather than summing separate minima',async()=>{
 const hass=fixture({method:'min'});
 hass.callApi=async()=>[[{entity_id:'sensor.a',last_updated:new Date(start).toISOString(),state:'0',attributes:{unit_of_measurement:'W'}},{entity_id:'sensor.a',last_updated:new Date(start+hour/2).toISOString(),state:'10',attributes:{unit_of_measurement:'W'}}],[{entity_id:'sensor.b',last_updated:new Date(start).toISOString(),state:'10',attributes:{unit_of_measurement:'W'}},{entity_id:'sensor.b',last_updated:new Date(start+hour/2).toISOString(),state:'0',attributes:{unit_of_measurement:'W'}}]];
 const c=config({data_source:'auto',hours_to_show:100,aggregation_method:'min'}),raw=await loadHistorySeries(hass,c,start,end);
 assert.equal(aggregateSeries(raw,start,end,'hour','min','UTC')[0].points[0].v,10);
 await assert.rejects(loadHistorySeries(hass,{...c,data_source:'statistics'},start,end),/sum_statistics/);
});
test('complete statistic means and reset-aware changes are added with exclusive bin end gaps',async()=>{
 for(const [method,field] of [['avg','mean'],['delta','change']]){
  const hass=fixture({method:field}),raw=await loadHistorySeries(hass,config({aggregation_method:method}),start,end);
  assert.equal(raw[0].source,'statistics');assert.equal(valueAt(raw[0].points,start),5);assert.equal(valueAt(raw[0].points,end),null);
  assert.equal(aggregateSeries(raw,start,end,'hour',method,'UTC')[0],raw[0]);
 }
});
test('mixed statistics and raw counters fall back to raw for the whole sum, never add a counter to an interval change',async()=>{
 const hass=fixture({method:'change',missing:true}),raw=await loadHistorySeries(hass,config({data_source:'auto',hours_to_show:100,aggregation_method:'delta'}),start,end);
 assert.equal(aggregateSeries(raw,start,end,'hour','delta','UTC')[0].points[0].v,0);
});
test('historical unit changes become gaps and summed history requests full attributes',async()=>{
 const hass=fixture();let request;
 hass.callApi=async(method,url)=>{request=url;return ['a','b'].map(id=>[{entity_id:'sensor.'+id,last_updated:new Date(start).toISOString(),state:'2',attributes:{unit_of_measurement:id==='b'?'kW':'W'}}]);};
 const raw=await loadHistorySeries(hass,config({data_source:'history'}),start,end);
 assert.equal(valueAt(raw[0].points,start),null);
 assert.equal(new URL(request,'https://fixture.test/').searchParams.has('no_attributes'),false);
 assert.equal(new URL(request,'https://fixture.test/').searchParams.has('minimal_response'),false);
});
test('missing source or incompatible live units fail before fetching any data',async()=>{
 const hass=fixture();hass.states['sensor.b'].attributes.unit_of_measurement='kW';
 await assert.rejects(loadHistorySeries(hass,config(),start,end),/sum_unit/);assert.equal(hass.calls.length,0);
 delete hass.states['sensor.b'];await assert.rejects(loadHistorySeries(hass,config(),start,end),/missing/);
});
