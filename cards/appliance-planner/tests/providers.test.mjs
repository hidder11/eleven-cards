import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fetchTariffs} from '../src/providers.js';
const now=new Date('2026-10-28T10:00Z');
const points=[{start_time:'2026-10-28T10:00Z',price_per_kwh:0},{start_time:'2026-10-28T10:15Z',price_per_kwh:-.1}];
const base={config:{time_zone:'Europe/Amsterdam',currency:'EUR'},states:{}};
test('Energy sensor data contract and negative/zero values',async()=>{
 const h={...base,states:{'sensor.p':{state:'0',attributes:{unit_of_measurement:'EUR/kWh',data:points}}}};
 assert.equal((await fetchTariffs(h,{source:'sensor',entity:'sensor.p'},now))[1].price,-.1);
 await assert.rejects(()=>fetchTariffs({...h,config:{...h.config,currency:'USD'}},{entity:'sensor.p'},now));
});
test('Tibber built-in exact service/home and custom exact entry contracts remain distinct',async()=>{
 for(const source of ['tibber','tibber_prices']){let request;
  const response=source==='tibber'?{prices:{Home:points.map(p=>({start_time:p.start_time,price:p.price_per_kwh}))}}:{price_info:points.map(p=>({startsAt:p.start_time,total:p.price_per_kwh}))};
  const rows=await fetchTariffs({...base,callWS:async r=>{request=r;return {response};}},{source,tibber_home:'Home',tibber_entry:'custom-entry'},now);
  assert.equal(rows[0].price,0);assert.equal(request.domain,source);assert.equal(request.return_response,true);
  assert.equal(request.service,source==='tibber'?'get_prices':'get_price');
  if(source==='tibber'){assert.equal(request.service_data.entry_id,undefined);assert.ok(request.service_data.start);}else{assert.equal(request.service_data.entry_id,'custom-entry');assert.ok(request.service_data.start_time);}
 }
});
test('Zonneplan fixed-point current/legacy fields are scaled only once',async()=>{
 const forecast=[{start_date:points[0].start_time,price_tax_included:{amount:0}},{datetime:points[1].start_time,electricity_price:-1000000}];
 const rows=await fetchTariffs({...base,states:{'sensor.z':{state:'.2',attributes:{forecast}}}},{source:'zonneplan',entity:'sensor.z'},now);
 assert.equal(rows[1].price,-.1);
});
test('EnergyZero requests separate days; unavailable tomorrow retains fully priced today',async()=>{
 const calls=[];const rows=await fetchTariffs({...base,callWS:async r=>{calls.push(r);if(calls.length===2)throw Error('not published');return {response:{prices:[{start:'2026-10-28T10:00Z',end:'2026-10-28T10:15Z',price:.15}]}};}},{source:'energyzero',energyzero_entry:'entry'},now);
 assert.equal(rows.length,1);assert.equal(calls.length,2);assert.deepEqual(calls[0].service_data,{config_entry:'entry',incl_vat:true,price_type:'all_in',interval:'quarter',start:'2026-10-28',end:'2026-10-28'});
});
test('null/malformed providers are rejected, never interpreted as zero tariffs',async()=>{
 await assert.rejects(()=>fetchTariffs({...base,callWS:async()=>({response:{success:false,price_info:[]}})},{source:'tibber_prices'},now));
 await assert.rejects(()=>fetchTariffs({...base,states:{'sensor.p':{state:'0',attributes:{unit_of_measurement:'EUR/kWh',data:[{start_time:points[0].start_time,price_per_kwh:null}]}}}},{entity:'sensor.p'},now));
});
