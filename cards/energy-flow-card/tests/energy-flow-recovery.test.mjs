import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement=class{attachShadow(){this.shadowRoot={};}hasAttribute(){return false;}};
globalThis.document={hidden:false};
const {EnergyFlowCard}=await import('../src/energy-flow-card.js');
const {energyFlowDetailContent}=await import('../src/energy-flow-details.js');
const prefs={energy_sources:[{type:'grid',stat_energy_from:'sensor.import'}],device_consumption:[]};
function card(){
 const c=new EnergyFlowCard();c.render=()=>{};c._refreshDetailContent=()=>{};
 c._config={detail_view:'popup'};c._attached=true;c._view='history';
 c._start=Date.parse('2026-10-01T00:00:00Z');c._end=Date.parse('2026-10-02T00:00:00Z');
 c._prefs=prefs;c._hass={language:'en',config:{currency:'EUR',time_zone:'UTC'},states:{}};
 return c;
}
test('a failed energy info request recovers on the next normal detail refresh',async()=>{
 const c=card(),requests=[];let recovered=false;
 c._request=async message=>{
  requests.push(message);
  if(message.type==='energy/info'){
   if(!recovered)throw Error('temporary failure');
   return {cost_sensors:{'sensor.import':'sensor.cost'}};
  }
  if(message.type==='recorder/get_statistics_metadata')return [{statistic_id:'sensor.cost',unit_of_measurement:'EUR'}];
  return {'sensor.import':[{start:c._start,change:2}],'sensor.cost':[{start:c._start,change:.6}]};
 };
 await c._loadDetails();recovered=true;
 if(c._detailResult)c._detailResult.time-=61000;
 await c._loadDetails();
 assert.equal(requests.filter(message=>message.type==='energy/info').length,2);
 assert.ok(requests.filter(message=>message.type==='recorder/statistics_during_period').at(-1).statistic_ids.includes('sensor.cost'));
 assert.equal(c._detailError,false);
 assert.match(energyFlowDetailContent(c,'grid',{import:2,export:0}),/Net costs<\/dt><dd>€ 0.6<\/dd>/);
 c._detailResult.time-=61000;await c._loadDetails();
 assert.equal(requests.filter(message=>message.type==='energy/info').length,2,'successful info is reused');
});

test('base consumption retries a failed request for the same historical period',async()=>{
 const c=card();let calls=0,recovered=false;
 c._request=async()=>{
  calls++;if(!recovered)throw Error('temporary failure');
  const end=c._end;
  return {'sensor.import':Array.from({length:8*24},(_,index)=>({start:end-(8*24-index)*3600000,change:.2}))};
 };
 await c._loadBaseConsumption();recovered=true;
 await c._loadBaseConsumption();
 assert.equal(calls,2);
 assert.ok(c._baseResult?.value,'base consumption is available after recovery');
 assert.equal(c._baseResult.value.watts,200);
 await c._loadBaseConsumption();
 assert.equal(calls,2,'successful result is reused');
});
