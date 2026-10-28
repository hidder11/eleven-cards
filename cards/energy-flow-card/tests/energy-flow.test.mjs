import {test} from 'node:test';
import {ENERGY_FLOW_BACKGROUNDS,energyFlowBackgroundOptions,energyFlowBackground} from '../src/energy-flow-backgrounds.js';
import {chooseCustomGraphPeriod} from '../../../shared/periods.js';
import assert from 'node:assert/strict';
import {normalizeEnergyFlowConfig,energyFlowPower,energyFlowMeters,energyFlowLive,energyFlowHistorical,energyFlowStatisticsRequest} from '../src/energy-flow-data.js';
const state=(value,unit='W')=>({state:String(value),attributes:{unit_of_measurement:unit}});
const prefs={energy_sources:[{type:'solar',stat_energy_from:'solar:one',stat_rate:'sensor.solar'},{type:'grid',stat_energy_from:'sensor.import',stat_energy_to:'sensor.export',stat_rate:'sensor.grid'}]};
test('automatic configuration needs no entities and validates overrides',()=>{
 assert.equal(normalizeEnergyFlowConfig().default_view,'live');assert.equal(normalizeEnergyFlowConfig({default_view:'history'}).default_view,'history');
 assert.equal(normalizeEnergyFlowConfig({hours_to_show:Infinity}).hours_to_show,24);
 assert.throws(()=>normalizeEnergyFlowConfig({grid_power_entity:'switch.grid'}));
});

test('accent colours accept the Car presets and safely fall back to existing gold',()=>{
 assert.equal(normalizeEnergyFlowConfig().color,'charging');
 for(const color of ['charging','waiting','done','planned','off'])assert.equal(normalizeEnergyFlowConfig({color}).color,color);
 for(const color of ['red','"><img src=x>',null,{},42])assert.equal(normalizeEnergyFlowConfig({color}).color,'charging');
});
test('power units are converted while unavailable and non-power values remain unknown',()=>{
 const hass={states:{a:state(3500),b:state(3.5,'kW'),c:state(.0035,'MW'),d:state('unavailable'),e:state(10,'kWh')}};
 for(const id of ['a','b','c'])assert.equal(energyFlowPower(hass,id),3.5);
 for(const id of ['d','e','missing'])assert.equal(energyFlowPower(hass,id),null);
});
test('live import/export and home consumption follow signed HA power',()=>{
 const hass={states:{'sensor.solar':state(4600),'sensor.grid':state(-800)}};
 const data=energyFlowLive(prefs,hass);assert.ok(Math.abs(data.home-3.8)<1e-9);assert.equal(data.import,0);assert.equal(data.export,.8);
 hass.states['sensor.grid']=state(1200);assert.ok(Math.abs(energyFlowLive(prefs,hass).home-5.8)<1e-9);
});
test('multiple sources aggregate, including simultaneous import and export',()=>{
 const p={energy_sources:[...prefs.energy_sources,{type:'solar',stat_rate:'sensor.solar2'},{type:'grid',stat_rate:'sensor.grid2'}]},h={states:{'sensor.solar':state(4000),'sensor.solar2':state(1000),'sensor.grid':state(-800),'sensor.grid2':state(300)}};
 const d=energyFlowLive(p,h);assert.equal(d.solar,5);assert.equal(d.import,.3);assert.equal(d.export,.8);assert.equal(d.home,4.5);
});
test('missing configured power propagates instead of fabricating a total',()=>{
 const data=energyFlowLive(prefs,{states:{'sensor.grid':state(100)}});assert.equal(data.solar,null);assert.equal(data.home,null);assert.equal(data.import,.1);
 assert.equal(energyFlowLive(prefs,{states:{'sensor.home':state(2000)}},{home_power_entity:'sensor.home'}).home,2);
});
test('power_config supports inverted and separate mixed-unit sensors',()=>{
 const p={energy_sources:[{type:'grid',power_config:{stat_rate_inverted:'sensor.grid'}},{type:'battery',power_config:{stat_rate_from:'sensor.discharge',stat_rate_to:'sensor.charge'}}]};
 const h={states:{'sensor.grid':state(-2000),'sensor.discharge':state(1,'kW'),'sensor.charge':state(200)}};
 const d=energyFlowLive(p,h);assert.equal(d.import,2);assert.equal(d.discharge,.8);assert.equal(d.home,2.8);
});
test('manual power overrides support reversed signed grid and separate sensors',()=>{
 const h={states:{a:state(1000),b:state(200),c:state(3000)}};
 assert.equal(energyFlowLive(prefs,h,{solar_power_entity:'c',grid_power_entity:'a',grid_power_inverted:true}).home,2);
 const d=energyFlowLive(prefs,h,{solar_power_entity:'c',grid_import_power_entity:'a',grid_export_power_entity:'b'});assert.equal(d.home,3.8);
});
test('old and new energy source configurations produce deduplicated meter lists',()=>{
 const p={energy_sources:[...prefs.energy_sources,{type:'grid',flow_from:[{stat_energy_from:'sensor.import'},{stat_energy_from:'sensor.import2'}],flow_to:[{stat_energy_to:'sensor.export2'}]},{type:'gas',stat_energy_from:'sensor.gas'}]};
 assert.deepEqual(energyFlowMeters(p),{solar:['solar:one'],import:['sensor.import','sensor.import2'],export:['sensor.export','sensor.export2'],charge:[],discharge:[]});
});
test('history uses change totals, including external statistics and battery balance',()=>{
 const p={energy_sources:[...prefs.energy_sources,{type:'battery',stat_energy_from:'battery:out',stat_energy_to:'battery:in'}]};
 const data=energyFlowHistorical(p,{'solar:one':[{change:10},{change:8.4}],'sensor.import':[{change:7.2}],'sensor.export':[{change:6.4}],'battery:out':[{change:2}],'battery:in':[{change:4}]});
 assert.ok(Math.abs(data.home-17.2)<.000001);assert.equal(data.battery,true);
});
test('a missing configured statistic makes the affected total unknown, while real zero stays zero',()=>{
 const d=energyFlowHistorical(prefs,{'solar:one':[{change:0}],'sensor.import':[{change:null}],'sensor.export':[]});assert.equal(d.solar,0);assert.equal(d.import,null);assert.equal(d.home,null);
});
test('power-only Energy sources cannot fabricate historical zero consumption',()=>{
 const d=energyFlowHistorical({energy_sources:[{type:'grid',stat_rate:'sensor.grid'}]},{});assert.equal(d.import,null);assert.equal(d.export,null);assert.equal(d.home,null);
});
test('history requests energy statistics in kWh with the selected bounds and no gas/cost sensors',()=>{
 const request=energyFlowStatisticsRequest(prefs,Date.parse('2025-01-01Z'),Date.parse('2025-01-03Z'));
 assert.equal(request.type,'recorder/statistics_during_period');assert.deepEqual(request.units,{energy:'kWh'});assert.deepEqual(request.types,['change']);assert.equal(request.period,'hour');assert.equal(request.start_time,'2025-01-01T00:00:00.000Z');assert.equal(request.end_time,'2025-01-03T00:00:00.000Z');assert.equal(request.statistic_ids.length,3);
});

globalThis.HTMLElement=class{attachShadow(){this.shadowRoot={};}hasAttribute(){return false;}};
globalThis.document={hidden:false};
const {EnergyFlowCard}=await import('../src/energy-flow-card.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function card(hass,view='history'){
 const c=new EnergyFlowCard();c.render=()=>{};c._hass=hass;c.setConfig({default_view:view});c._attached=true;return c;
}
test('production requests prefs before querying the configured statistics',async()=>{
 const calls=[],c=card({callWS:async request=>{calls.push(request);return request.type==='energy/get_prefs'?prefs:{'solar:one':[{change:3}]};}});
 c._sync();await tick();assert.deepEqual(calls.map(r=>r.type),['energy/get_prefs','recorder/statistics_during_period']);assert.equal(c._statistics['solar:one'][0].change,3);c._attached=false;c._reset();
});

test('changing accent colour retains loaded statistics and the open detail selection',async()=>{
 const calls=[],c=card({callWS:async request=>{calls.push(request);return request.type==='energy/get_prefs'?prefs:{'solar:one':[{change:3}]};}});
 c._sync();await tick();const statistics=c._statistics,count=calls.length;c._detailNode='grid';
 c.setConfig({...c._config,color:'planned'});await tick();
 assert.equal(c._config.color,'planned');assert.equal(c._statistics,statistics);assert.equal(calls.length,count);assert.equal(c._detailNode,'grid');
 c._attached=false;c._reset();
});
test('switching periods ignores stale responses',async()=>{
 const deferred=[];const c=card({callWS:request=>request.type==='energy/get_prefs'?Promise.resolve(prefs):new Promise(resolve=>deferred.push(resolve))});
 c._sync();await tick();c._periodMode='24h';c._reloadPeriod();await tick();assert.equal(deferred.length,2);
 deferred[1]({new:[{change:2}]});await tick();deferred[0]({old:[{change:9}]});await tick();assert.ok(c._statistics.new);assert.equal(c._statistics.old,undefined);c._attached=false;c._reset();
});
test('errors expose a retryable state and do not retain old statistics',async()=>{
 const c=card({callWS:async()=>{throw Error('denied');}});c._statistics={old:[]};c._sync();await tick();assert.equal(c._error,true);assert.equal(c._statistics,null);assert.equal(c._loading,false);c._attached=false;c._reset();
});
test('hidden, detached and disconnected cards issue no requests',()=>{
 let calls=0;const c=card({connected:false,callWS:()=>{calls++;}});c._sync();assert.equal(calls,0);c._hass.connected=true;document.hidden=true;c._sync();document.hidden=false;c._attached=false;c._sync();assert.equal(calls,0);c._reset();
});
test('live mode only loads preferences and waits for hass state changes',async()=>{
 const calls=[],c=card({callWS:async request=>{calls.push(request.type);return prefs;}},'live');c._sync();await tick();assert.deepEqual(calls,['energy/get_prefs']);c._sync();assert.equal(calls.length,1);c._attached=false;c._reset();
});

test('popup day navigation preserves the active popup and requests the selected HA day',async()=>{
 const calls=[],c=card({config:{time_zone:'Europe/Amsterdam'},callWS:async request=>{calls.push(request);return request.type==='energy/get_prefs'?prefs:{'solar:one':[{change:3}]};}},'live');
 c._sync();await tick();c._detailNode='grid';c._detailResult={old:true};c._detailError=true;
 c._view='history';chooseCustomGraphPeriod(c,Date.parse('2025-10-25T22:00:00Z'),Date.parse('2025-10-26T23:00:00Z'));await tick();
 assert.equal(c._view,'history');assert.equal(c._detailNode,'grid');assert.equal(c._detailResult,null);assert.equal(c._detailError,false);
 assert.equal(c._end-c._start,25*3600000);
 const request=calls.find(request=>request.type==='recorder/statistics_during_period');
 assert.equal(request.start_time,'2025-10-25T22:00:00.000Z');assert.equal(request.end_time,'2025-10-26T23:00:00.000Z');
 const start=c._start;chooseCustomGraphPeriod(c,NaN,NaN);assert.equal(c._start,start);assert.equal(c._detailNode,'grid');
 // Navigation from the card keeps the detail selection; disconnect still clears it.
 c._reloadPeriod();assert.equal(c._detailNode,'grid');c._attached=false;c._reset();assert.equal(c._detailNode,null);
});

test('background choices preserve existing YAML and label animation in both languages',()=>{
 assert.equal(normalizeEnergyFlowConfig().background,'lanes');
 assert.equal(normalizeEnergyFlowConfig({background:'unknown'}).background,'lanes');
 for(const item of ENERGY_FLOW_BACKGROUNDS){
  assert.equal(normalizeEnergyFlowConfig({background:item.value}).background,item.value);
  for(const nl of [true,false])assert.ok(energyFlowBackgroundOptions(nl).find(option=>option.value===item.value).label.endsWith(nl?(item.animated?'Geanimeerd':'Statisch'):(item.animated?'Animated':'Static')));
 }
 for(const background of ['hologram','ink','terrain']){
  assert.ok(energyFlowBackground(background).includes('class="header-pattern"'));
  assert.equal(normalizeEnergyFlowConfig({background,animate_background:false}).animate_background,false);
 }
 assert.equal(energyFlowBackground('<img src=x>'),'');
});
