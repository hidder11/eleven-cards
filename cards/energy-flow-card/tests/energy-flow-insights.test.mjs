import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowBaseConsumption,energyFlowDeviceCosts} from '../src/energy-flow-insights.js';
import {energyFlowDetailContent} from '../src/energy-flow-details.js';
const hour=3600000,start=Date.parse('2026-10-01T01:00:00Z');
const prefs={energy_sources:[{type:'grid',stat_energy_from:'in',stat_cost:'cost'}],device_consumption:[{name:'A',stat_consumption:'sensor.a'},{name:'B',stat_consumption:'sensor.b'}]};
const hass={language:'en',config:{currency:'EUR'},states:{'sensor.a':{state:'1',attributes:{unit_of_measurement:'kWh'}}}};
const row=(offset,change)=>({start:start+offset*hour,change});
test('base estimate uses full nights and a robust median, retaining zero',()=>{
 const stats={in:[0,1,2,3,4,5,6].flatMap((night)=>[.14,.18,.3,.4].map((value,i)=>row(night*24+i,value+(night===3?2:0))))};
 assert.deepEqual(energyFlowBaseConsumption(prefs,stats,'UTC',start+7*86400000),{watts:140,nights:7});
 assert.equal(energyFlowBaseConsumption(prefs,{in:stats.in.slice(0,8)},'UTC',start+7*86400000),null);
 assert.equal(energyFlowBaseConsumption(prefs,stats,'invalid-zone'),null);
 assert.equal(energyFlowBaseConsumption(prefs,stats,'UTC',start+hour),null);
 assert.deepEqual(energyFlowBaseConsumption(prefs,{in:stats.in.map(r=>({...r,change:0}))},'UTC',start+7*86400000),{watts:0,nights:7});
});
test('base estimate uses local night hours and rejects incomplete source data',()=>{
 const stats={in:Array.from({length:7},(_,night)=>[0,1,2,3].map(i=>row(night*24+i,.1))).flat()};
 assert.equal(energyFlowBaseConsumption(prefs,stats,'Europe/Amsterdam',start+7*86400000),null);
 const configured={...prefs,energy_sources:[...prefs.energy_sources,{type:'solar',stat_energy_from:'pv'}]};
 assert.equal(energyFlowBaseConsumption(configured,stats,'UTC',start+7*86400000),null);
});
const priced=()=>({statistics:{in:[row(0,2),row(1,1)],cost:[row(0,.6),row(1,-.1)],'sensor.a':[row(0,1),row(1,2)],'sensor.b':[row(0,1),row(1,0)]},metadata:{cost:{unit_of_measurement:'EUR'}}});
test('device estimates use each recorded hourly tariff including negatives and zero',()=>{
 const costs=energyFlowDeviceCosts(prefs,hass,priced());
 assert.ok(Math.abs(costs['sensor.a'].value-.1)<1e-10);assert.equal(costs['sensor.a'].currency,'EUR');
 assert.equal(costs['sensor.b'].value,.3);
 const state=priced();state.statistics.cost.forEach(row=>row.change=0);assert.equal(energyFlowDeviceCosts(prefs,hass,state)['sensor.a'].value,0);
});
test('no usable tariff, timestamps or currency do not invent device costs',()=>{
 for(const alter of [s=>delete s.statistics.cost,s=>s.metadata={},s=>s.statistics['sensor.a'][1].start=undefined,s=>s.statistics.in.forEach(row=>row.change=0)]){
  const state=priced();alter(state);assert.equal(energyFlowDeviceCosts(prefs,hass,state)['sensor.a'],null);
 }
 const state=priced();state.statistics.in[1].change=0;state.statistics['sensor.a'][1].change=0;state.statistics.cost[1].change=0;
 assert.equal(energyFlowDeviceCosts(prefs,hass,state)['sensor.a'].value,.3);
});

test('fills only missing device tariff hours and reports the energy share, not hour share',()=>{
 const state=priced();state.statistics['sensor.a']=[row(0,4),row(1,1)];state.statistics.in[1].change=0;state.statistics.cost[1].change=0;
 const cost=energyFlowDeviceCosts(prefs,hass,state)['sensor.a'];
 assert.ok(Math.abs(cost.value-1.5)<1e-10);assert.equal(cost.estimatedShare,20);assert.equal(cost.currency,'EUR');
 state.statistics['sensor.a']=[row(0,0),row(1,1)];
 const entirelyEstimated=energyFlowDeviceCosts(prefs,hass,state)['sensor.a'];
 assert.equal(entirelyEstimated.estimatedShare,100);assert.equal(entirelyEstimated.value,.3);
 assert.equal(energyFlowDeviceCosts(prefs,hass,priced())['sensor.a'].estimatedShare,0);
});

test('fallback is weighted by recorded import energy across the whole selected period',()=>{
 const state=priced();state.statistics.in=[row(0,2),row(1,1),row(2,0)];state.statistics.cost=[row(0,.2),row(1,.7),row(2,0)];
 state.statistics['sensor.a']=[row(0,4),row(1,0),row(2,1)];state.statistics['sensor.b']=[row(0,0),row(1,0),row(2,0)];
 const cost=energyFlowDeviceCosts(prefs,hass,state)['sensor.a'];
 assert.ok(Math.abs(cost.value-.7)<1e-10);assert.equal(cost.estimatedShare,20);
 state.statistics.cost[0].change=-.4;state.statistics.cost[1].change=-.2;
 assert.ok(Math.abs(energyFlowDeviceCosts(prefs,hass,state)['sensor.a'].value+1)<1e-10);
 state.statistics.cost.forEach(row=>row.change=0);
 assert.equal(energyFlowDeviceCosts(prefs,hass,state)['sensor.a'].value,0);
});

test('fallback combines compatible connections and refuses incompatible currencies',()=>{
 const configured={...prefs,energy_sources:[...prefs.energy_sources,{type:'grid',stat_energy_from:'in2',stat_cost:'cost2'}]},state=priced();
 state.statistics.in=[row(0,2),row(1,0)];state.statistics.cost=[row(0,.4),row(1,0)];
 state.statistics.in2=[row(0,1),row(1,0)];state.statistics.cost2=[row(0,.5),row(1,0)];state.metadata.cost2={unit_of_measurement:'EUR'};
 assert.ok(Math.abs(energyFlowDeviceCosts(configured,hass,state)['sensor.a'].value-.9)<1e-10);
 state.metadata.cost2.unit_of_measurement='USD';assert.equal(energyFlowDeviceCosts(configured,hass,state)['sensor.a'],null);
});

test('fallback remains unavailable for missing device consumption rather than estimating energy',()=>{
 const state=priced();state.statistics['sensor.a'].pop();
 assert.equal(energyFlowDeviceCosts(prefs,hass,state)['sensor.a'],null);
});

test('Other costs do not overstate a residual when hourly device totals exceed the home',()=>{
 const state=priced();state.statistics.in=[row(0,1),row(1,3)];state.statistics.cost=[row(0,.2),row(1,.9)];
 state.statistics['sensor.a']=[row(0,2),row(1,1)];state.statistics['sensor.b']=[row(0,0),row(1,0)];
 const costs=energyFlowDeviceCosts(prefs,hass,state);
 assert.equal(costs.__other,null);assert.ok(Math.abs(costs['sensor.a'].value-.7)<1e-10);
});

test('Other costs account for battery charging and discharge without attributing storage tariffs',()=>{
 const configured={...prefs,energy_sources:[...prefs.energy_sources,{type:'battery',stat_energy_from:'discharge',stat_energy_to:'charge'}]},state=priced();
 state.statistics.in=[row(0,2),row(1,1)];state.statistics.cost=[row(0,.6),row(1,.3)];
 state.statistics.charge=[row(0,1),row(1,0)];state.statistics.discharge=[row(0,0),row(1,1)];
 state.statistics['sensor.a']=[row(0,1),row(1,.5)];state.statistics['sensor.b']=[row(0,0),row(1,0)];
 const cost=energyFlowDeviceCosts(configured,hass,state).__other;
 assert.ok(Math.abs(cost.value-.45)<1e-10);assert.equal(cost.estimatedShare,0);
 delete state.statistics.discharge;assert.equal(energyFlowDeviceCosts(configured,hass,state).__other,null);
});

test('Other avoids charging twice for a device included in its parent meter',()=>{
 const configured={...prefs,device_consumption:[prefs.device_consumption[0],{...prefs.device_consumption[1],included_in_stat:'sensor.a'}]},state=priced();
 state.statistics.in=[row(0,3),row(1,2)];state.statistics.cost=[row(0,.6),row(1,.6)];
 state.statistics['sensor.a']=[row(0,2),row(1,1)];state.statistics['sensor.b']=[row(0,1),row(1,.5)];
 assert.ok(Math.abs(energyFlowDeviceCosts(configured,hass,state).__other.value-.5)<1e-10);
});

test('popup and tab content retain filled costs without a per-device fallback note in both languages',()=>{
 const state=priced();state.statistics['sensor.a']=[row(0,4),row(1,1)];state.statistics.in[1].change=0;state.statistics.cost[1].change=0;
 const host={_view:'history',_hass:hass,_prefs:prefs,_offline:()=>false,_detailResult:state};
 const en=energyFlowDetailContent(host,'home',{home:6});
 assert.ok(en.includes('€ 1.5'));assert.ok(!en.includes('filled using average tariff'));assert.ok(!en.includes('class="ui-detail-surface-hint"'));
 assert.ok(!en.includes('Cost estimated using recorded hourly tariffs'));
 host._hass={...hass,language:'nl'};
 const nl=energyFlowDetailContent(host,'home',{home:6});
 assert.ok(nl.includes('€ 1,5'));assert.ok(!nl.includes('aangevuld met gemiddeld tarief'));assert.ok(!nl.includes('class="ui-detail-surface-hint"'));
 assert.ok(!nl.includes('Kosten geschat met geregistreerde uurtarieven'));
 assert.ok(!energyFlowDetailContent({...host,_detailResult:priced()},'home',{home:6}).includes('class="ui-detail-surface-hint"'));
});
test('devices sort on available estimated costs, remain safe to click and keep untracked last',()=>{
 const h={_view:'history',_hass:hass,_prefs:prefs,_offline:()=>false,_deviceSort:'cost',_detailResult:priced()};
 const html=energyFlowDetailContent(h,'home',{home:5});
 assert.ok(html.indexOf('aria-label="B"')<html.indexOf('aria-label="A"'));
 assert.ok(html.includes('data-entity="sensor.a"'));assert.ok(!html.includes('data-entity="sensor.b"'));
 assert.ok(html.lastIndexOf('aria-label="Other"')>html.indexOf('aria-label="A"'));
 assert.ok(html.includes('Estimated base consumption'));assert.ok(!html.includes('1970'));
 assert.ok(html.includes('data-energy-device-sort'));assert.ok(html.includes('Estimated cost'));
 assert.ok(html.includes('€ 0.3'));
});

test('historical costs stay visible as unknown when tariffs are missing; Live has no historical costs',()=>{
 const h={_view:'history',_hass:hass,_prefs:prefs,_offline:()=>false,_detailResult:{statistics:priced().statistics}};
 const history=energyFlowDetailContent(h,'home',{home:5});
 assert.ok(history.includes('data-energy-device-sort'));assert.ok(history.includes('Estimated cost'));
 assert.ok(history.includes('<dd>—</dd>'));
 h._view='live';h._prefs={...prefs,device_consumption:[{name:'A',stat_consumption:'sensor.a',stat_rate:'sensor.power'}]};
 h._hass={...hass,states:{'sensor.power':{state:'500',attributes:{unit_of_measurement:'W'}}}};
 const live=energyFlowDetailContent(h,'home',{home:1});
 assert.ok(live.includes('0.5 kW'));assert.ok(!live.includes('Estimated cost'));
});
