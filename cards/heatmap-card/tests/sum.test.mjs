import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConfig,loadHeatmapData,buildHeatmap} from '../src/heatmap-utils.js';

const start=Date.parse('2026-01-01T00:00:00Z'),hour=3600000,end=start+3*hour;
const config=(patch={})=>normalizeConfig({entity:'sensor.a',sum_entities:['sensor.b'],...patch});
const states=Object.fromEntries(['a','b','c'].map(id=>[`sensor.${id}`,{attributes:{unit_of_measurement:'W',friendly_name:id.toUpperCase()}}]));
const row=(id,h,value,unit='W')=>({entity_id:id,last_updated:new Date(start+h*hour).toISOString(),state:String(value),attributes:{unit_of_measurement:unit}});
const cells=(data,mode='average')=>buildHeatmap(data,start,end,'UTC',mode)[0].cells.slice(0,3);
const stat=(h,value,field='mean',length=1)=>({start:start+h*hour,end:start+(h+length)*hour,[field]:value});
function fixture({statistics={},history={},metadata=null}={}){
 const requests=[];
 return {states,requests,callWS:async request=>{
  requests.push(request);const id=request.statistic_ids[0];
  if(request.type.endsWith('metadata'))return metadata??(statistics[id]?[{statistic_id:id,has_mean:true,has_sum:true,unit_of_measurement:'W'}]:[]);
  return {[id]:statistics[id]??[]};
 },callApi:async(_method,url)=>{requests.push(url);const id=new URL('http://fixture/'+url).searchParams.get('filter_entity_id');return [history[id]??[]];}};
}

test('sum config validates additional sensor IDs without mutating frozen configurations',()=>{
 const extra=Object.freeze(['sensor.b']);const input=Object.freeze({entity:'sensor.a',sum_entities:extra});
 const normalized=normalizeConfig(input);assert.deepEqual(normalized.sum_entities,['sensor.b']);assert.notEqual(normalized.sum_entities,extra);
 for(const invalid of ['sensor.b',null,42,{},['sensor.a'],['sensor.b','sensor.b'],['light.b'],[42],['sensor.bad-id'],Array.from({length:8},(_,i)=>`sensor.extra_${i}`)]){
  assert.throws(()=>normalizeConfig({entity:'sensor.a',sum_entities:invalid}),/sum_entities/);
 }
 const draft=normalizeConfig(Object.freeze({entity:'',sum_entities:Object.freeze(['',undefined])}),{draft:true});
 assert.deepEqual(draft.sum_entities,['',undefined]);assert.doesNotThrow(()=>normalizeConfig({entity:'sensor.a',sum_entities:[]}));
});

test('sum config rejects sparse arrays rather than treating missing IDs as sensors',()=>{
 assert.throws(()=>config({sum_entities:Array(1)}),/sum_entities/);
});

test('raw sum aligns asynchronous held readings before averaging and keeps common-coverage gaps',async()=>{
 const hass=fixture({history:{
  'sensor.a':[row('sensor.a',0,10),row('sensor.a',.5,20),row('sensor.a',1,'unavailable'),row('sensor.a',2,30)],
  'sensor.b':[row('sensor.b',.25,1),row('sensor.b',.75,3),row('sensor.b',1.5,5),row('sensor.b',2.5,7)]
 }});
 const data=await loadHeatmapData(hass,config(),start,end),result=cells(data);
 assert.equal(data.source,'history');assert.equal(result[0].value,(11+21+23)/3);assert.equal(result[0].coverage,.75*hour);assert.equal(result[0].partial,true);
 assert.equal(result[1].value,null);assert.equal(result[1].coverage,0);assert.equal(result[2].value,36);
 assert.ok(data.intervals.some(r=>r.value===null));
 assert.equal(hass.requests.filter(r=>typeof r==='string').length,2);
 const baseline=await loadHeatmapData(hass,normalizeConfig({entity:'sensor.a'}),start,end);
 const empty=await loadHeatmapData(hass,config({sum_entities:[]}),start,end);
 assert.deepEqual(empty,baseline);assert.equal(cells(baseline)[0].value,15);
});


test('sum requires actual entities and identical exact current units, including unitless sensors',async()=>{
 for(const replacement of [undefined,{attributes:{unit_of_measurement:'kW'}},{attributes:{}}]){
  const hass=fixture();hass.states={...states,'sensor.b':replacement};
  await assert.rejects(loadHeatmapData(hass,config(),start,end),/sum_(entity_missing|unit_mismatch)/);
  assert.equal(hass.requests.length,0);
 }
 const hass=fixture({history:{'sensor.a':[row('sensor.a',0,1,'')],'sensor.b':[row('sensor.b',0,2,'')]}});
 hass.states={'sensor.a':{attributes:{}},'sensor.b':{attributes:{}}};
 assert.equal(cells(await loadHeatmapData(hass,config(),start,end))[0].value,3);
});

test('mixed statistics/history reloads statistics contributors as raw instead of inventing held means',async()=>{
 const hass=fixture({statistics:{'sensor.a':[stat(0,100)]},history:{
  'sensor.a':[row('sensor.a',0,10),row('sensor.a',.5,20),row('sensor.a',1,'unavailable')],
  'sensor.b':[row('sensor.b',.25,1),row('sensor.b',.75,3)]
 }});
 const data=await loadHeatmapData(hass,config(),start,end);
 assert.equal(data.source,'history');assert.equal(cells(data)[0].value,(11+21+23)/3);
 assert.equal(cells(data)[1].value,null);
 assert.equal(hass.requests.filter(r=>typeof r==='string' && r.includes('sensor.a')).length,1);
 const noRaw=fixture({statistics:{'sensor.a':[stat(0,100)]},history:{'sensor.b':[row('sensor.b',0,2)]}});
 assert.ok(cells(await loadHeatmapData(noRaw,config(),start,end)).every(c=>c.value===null));
});

test('consumption adds reset-aware changes only for matching complete hourly bins without prorating',async()=>{
 const hass=fixture({statistics:{
  'sensor.a':[stat(0,2,'change'),stat(1,0,'change'),stat(2,5,'change',.5)],
  'sensor.b':[stat(0,-1,'change'),stat(1,3,'change'),stat(2,7,'change',.5)]
 }});
 const data=await loadHeatmapData(hass,config({mode:'consumption'}),start,end);
 assert.equal(data.source,'statistics');assert.deepEqual(cells(data,'consumption').map(c=>c.value),[1,3,null]);
 const clipped=buildHeatmap(data,start+.5*hour,end,'UTC','consumption')[0].cells[0];
 assert.equal(clipped.value,1);assert.equal(clipped.partial,true);assert.equal(clipped.coverage,hour);
 assert.ok(hass.requests.filter(r=>r.type==='recorder/statistics_during_period').every(r=>r.period==='hour' && r.types[0]==='change'));
 const missing=fixture({statistics:{'sensor.a':[stat(0,1,'change')],'sensor.b':[]}});
 assert.ok(cells(await loadHeatmapData(missing,config({mode:'consumption'}),start,end),'consumption').every(c=>c.value===null));
 const unsupported=fixture({statistics:{'sensor.a':[stat(0,1,'change')]}});
 await assert.rejects(loadHeatmapData(unsupported,config({mode:'consumption'}),start,end),/consumption_statistics_required/);
 assert.equal(unsupported.requests.filter(r=>typeof r==='string').length,0);
});

test('eight contributors load independently and one failed history request rejects the entire sum',async()=>{
 const ids=Array.from({length:8},(_,i)=>`sensor.part_${i}`),history=Object.fromEntries(ids.map((id,i)=>[id,[row(id,0,i)]]));
 const hass=fixture({history});hass.states=Object.fromEntries(ids.map(id=>[id,states['sensor.a']]));
 const data=await loadHeatmapData(hass,config({entity:ids[0],sum_entities:ids.slice(1)}),start,end);
 assert.equal(cells(data)[0].value,28);assert.equal(hass.requests.filter(r=>typeof r==='string').length,8);
 const previous=hass.callApi;hass.callApi=async(method,url)=>{if(url.includes(ids[7]))throw Error('offline');return previous(method,url);};
 await assert.rejects(loadHeatmapData(hass,config({entity:ids[0],sum_entities:ids.slice(1)}),start,end),/offline/);
});

test('incompatible contributor statistics units fall back to raw and historical unit changes preserve gaps',async()=>{
 const hass=fixture({statistics:{'sensor.a':[stat(0,100)]},metadata:[
  {statistic_id:'sensor.a',has_mean:true,display_unit_of_measurement:'W',statistics_unit_of_measurement:'kW'},
  {statistic_id:'sensor.b',has_mean:true,display_unit_of_measurement:'kW'}
 ],history:{
  'sensor.a':[row('sensor.a',0,10)],
  'sensor.b':[row('sensor.b',0,1),row('sensor.b',.5,2,'kW'),row('sensor.b',2,3)]
 }});
 const data=await loadHeatmapData(hass,config(),start,end),result=cells(data);
 assert.equal(data.source,'history');assert.deepEqual(result.map(c=>c.value),[11,null,13]);
 assert.equal(result[0].coverage,hour/2);assert.equal(result[0].partial,true);
 assert.ok(hass.requests.filter(r=>typeof r==='string').every(url=>url.includes('significant_changes_only=0')));
});

test('consumption with a missing contributor bin never publishes a partial total',async()=>{
 const hass=fixture({statistics:{'sensor.a':[stat(0,100,'change'),stat(1,2,'change'),stat(2,3,'change')],'sensor.b':[stat(1,4,'change')]}});
 const data=await loadHeatmapData(hass,config({mode:'consumption'}),start,end);
 assert.deepEqual(cells(data,'consumption').map(c=>c.value),[null,6,null]);
 const day=buildHeatmap(data,start,end,'UTC','consumption','day')[0].cells.find(c=>c.intervals.length);
 assert.equal(day.value,6);assert.equal(day.coverage,hour);assert.equal(day.partial,true);
});

test('average statistics sum only exact shared bins; absent rows remain missing',async()=>{
 const hass=fixture({statistics:{
  'sensor.a':[stat(0,10),stat(1,20),stat(2,30)],
  'sensor.b':[stat(0,1),stat(1,null),stat(2.25,3)]
 }});
 const data=await loadHeatmapData(hass,config(),start,end);
 assert.equal(data.source,'statistics');assert.deepEqual(cells(data).map(c=>c.value),[11,null,null]);
 const clipped=buildHeatmap(data,start+.25*hour,end,'UTC')[0].cells[0];
 assert.equal(clipped.value,11);assert.equal(clipped.coverage,hour);assert.equal(clipped.partial,true);
});
