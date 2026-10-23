import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evccSolarMethods, evccSolarHint} from '../../src/evcc/evcc-solar.js';
import {evccSolarRange, evccValidSolarValue, resolveEvccEntities, normalizeEvccConfig} from '../../src/evcc/evcc-utils.js';

const entity = {state:'60',attributes:{unit_of_measurement:'%',min:0,max:100,step:10}};
function host(callService) {
 return Object.assign({_config:{show_controls:true},_entities:{solar_share:'number.solar'},_hass:{language:'nl',states:{'number.solar':structuredClone(entity)},callService},_solarVersion:0,_offline:()=>false,_render(){}},evccSolarMethods);
}
test('solar share number entity resolves by stable key, independently of session solar percentage', () => {
 const hass={states:{'sensor.power':{state:'7'},'number.renamed':entity,'sensor.session':{state:'78'}}};
 const registry=[['sensor.power','charge_power'],['number.renamed','solar_share'],['sensor.session','session_solar_percentage']].map(([entity_id,key])=>({entity_id,platform:'evcc_intg',unique_id:'evcc_intg.evcc_car_'+key,config_entry_id:'first'}));
 const result=resolveEvccEntities(normalizeEvccConfig({entity:'sensor.power'}),hass,registry);
 assert.equal(result.solar_share,'number.renamed');assert.equal(result.solar_percentage,'sensor.session');
 assert.throws(()=>normalizeEvccConfig({entities:{solar_share:'sensor.wrong'}}));
});
test('solar range follows entity bounds and step; invalid/unavailable readings cannot be changed', () => {
 assert.deepEqual(evccSolarRange(entity),{min:0,max:100,step:10});
 for(const value of [0,10,60,100])assert.equal(evccValidSolarValue(entity,value),true);
 for(const value of [-10,110,55,NaN,'60',null])assert.equal(evccValidSolarValue(entity,value),false);
 for(const invalid of [{...entity,state:'unavailable'},{...entity,state:'101'},{...entity,attributes:{step:0}},{...entity,attributes:{min:100,max:0}},{...entity,attributes:{unit_of_measurement:'W'}}])assert.equal(evccSolarRange(invalid),null);
 const restricted={...entity,attributes:{min:20,max:80,step:5}};
 assert.equal(evccValidSolarValue(restricted,25),true);assert.equal(evccValidSolarValue(restricted,0),false);
});
test('solar hints describe the configured minimum charging power share, with explicit zero/full cases', () => {
 assert.match(evccSolarHint(60,true),/60%.*minimale laadvermogen/);
 assert.match(evccSolarHint(0,true),/zodra/);assert.match(evccSolarHint(100,false),/minimum charging power/);
 assert.match(evccSolarHint(null,false),/unavailable/);
});
test('solar writes HA percentage without conversion and waits for source confirmation',async()=>{
 let request;const card=host(async(...args)=>{request=args;});
 await card._changeSolar(70);
 assert.deepEqual(request,['number','set_value',{entity_id:'number.solar',value:70}]);
 assert.equal(card._pendingSolar.value,70);assert.equal(card._hass.states['number.solar'].state,'60');
 card._cancelSolar();
});
test('duplicate attempts do not invalidate the pending confirmation timeout',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 let calls=0;const card=host(async()=>{calls++;});
 await card._changeSolar(70);await card._changeSolar(80);assert.equal(calls,1);
 t.mock.timers.tick(15001);assert.equal(card._pendingSolar,null);assert.match(card._solarError,/Geen bevestiging/);
});
test('offline, read-only, unavailable, same-value and invalid requests never call a service',async()=>{
 let calls=0;const card=host(async()=>{calls++;});
 await card._changeSolar(60);await card._changeSolar(55);
 card._offline=()=>true;await card._changeSolar(70);card._offline=()=>false;
 card._config.show_controls=false;await card._changeSolar(70);card._config.show_controls=true;
 card._hass.states['number.solar'].state='unavailable';await card._changeSolar(70);
 assert.equal(calls,0);
});
test('rejected writes report errors and re-enable controls; stale failures after reconfiguration are ignored',async()=>{
 const card=host(async()=>{throw Error('Denied');});await card._changeSolar(70);
 assert.match(card._solarError,/Denied/);assert.equal(card._pendingSolar,null);
 let reject;card._solarError=null;card._hass.callService=()=>new Promise((_,no)=>{reject=no;});
 const request=card._changeSolar(80);card._cancelSolar();reject(Error('Old failure'));await request;
 assert.equal(card._solarError,null);assert.equal(card._pendingSolar,null);
});
