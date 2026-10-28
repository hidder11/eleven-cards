import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowGridMeters,energyFlowDetailIds,energyFlowChange,energyFlowDeviceRows,energyFlowDeviceTotal,energyFlowCurrentPrice,energyFlowHistoricalCost,energyFlowSolarCoverage} from '../src/energy-flow-details-data.js';
import {energyFlowDetailContent,energyFlowDetailPopup} from '../src/energy-flow-details.js';
const state=(value,unit)=>({state:String(value),attributes:{unit_of_measurement:unit}});
test('grid discovery follows unified and legacy Energy pricing in both directions',()=>{
 const meters=energyFlowGridMeters({energy_sources:[{type:'grid',stat_energy_from:'new:in',stat_energy_to:'new:out',number_energy_price:0,number_energy_price_export:-.1},{type:'grid',flow_from:[{stat_energy_from:'old:in',entity_energy_price:'sensor.in'}],flow_to:[{stat_energy_to:'old:out',entity_energy_price:'sensor.out'}]}]});
 assert.deepEqual(meters.map(m=>m.energy),['new:in','new:out','old:in','old:out']);
 assert.equal(meters[0].fixedPrice,0);assert.equal(meters[1].fixedPrice,-.1);assert.equal(meters[3].priceEntity,'sensor.out');
});
test('current rates preserve negative and zero prices, convert energy units, and reject unavailable or non-price sensors',()=>{
 const hass={config:{currency:'EUR'},states:{'sensor.price':state(-120,'EUR/MWh')}};
 assert.deepEqual(energyFlowCurrentPrice({priceEntity:'sensor.price'},hass),{value:-.12,currency:'EUR'});
 hass.states['sensor.price']=state(.0003,'EUR/Wh');assert.deepEqual(energyFlowCurrentPrice({priceEntity:'sensor.price'},hass),{value:.3,currency:'EUR'});
 assert.deepEqual(energyFlowCurrentPrice({fixedPrice:0},hass),{value:0,currency:'EUR'});
 for(const value of [state('unavailable','EUR/kWh'),state(12,'kWh'),state(12,'')]){hass.states['sensor.price']=value;assert.equal(energyFlowCurrentPrice({priceEntity:'sensor.price',fixedPrice:.3},hass),null);}
 assert.equal(energyFlowCurrentPrice({fixedPrice:.3},{}),null);
});
test('detail statistics include devices, battery flows and configured or generated cost sensors exactly once',()=>{
 const prefs={energy_sources:[{type:'solar',stat_energy_from:'pv'},{type:'grid',stat_energy_from:'in',stat_energy_to:'out',stat_cost:'cost'},{type:'battery',stat_energy_from:'discharge',stat_energy_to:'charge'}],device_consumption:[{stat_consumption:'dryer'},{stat_consumption:'dryer'}]};
 assert.deepEqual(energyFlowDetailIds(prefs,{cost_sensors:{in:'unused',out:'revenue'}}).sort(),['charge','cost','discharge','dryer','in','out','pv','revenue']);
});
test('historical costs use recorded changes with known currency, never the current rate',()=>{
 const stats={cost:[{change:2},{change:-.5}],generated:[{change:4}]},info={cost_sensors:{in:'generated'}};
 assert.deepEqual(energyFlowHistoricalCost({energy:'in',cost:'cost',fixedPrice:999},info,stats,{cost:{unit_of_measurement:'USD'}},{}),{value:1.5,currency:'USD'});
 assert.deepEqual(energyFlowHistoricalCost({energy:'in'},info,stats,{generated:{unit_of_measurement:'EUR'}},{}),{value:4,currency:'EUR'});
 assert.equal(energyFlowHistoricalCost({energy:'in'},info,stats,{},{}),null);
 assert.equal(energyFlowChange({x:[{change:null},{change:'unavailable'}]},'x'),null);
 assert.equal(energyFlowChange({x:[{change:0}]},'x'),0);
});
test('device totals avoid duplicate and nested meters but retain measured children of unavailable parents',()=>{
 const prefs={device_consumption:[{stat_consumption:'parent',stat_rate:'sensor.parent'},{stat_consumption:'child',stat_rate:'sensor.child',included_in_stat:'parent'},{stat_consumption:'child',stat_rate:'sensor.child'},{stat_consumption:'unknown'}]};
 const hass={states:{'sensor.parent':state(2000,'W'),'sensor.child':state(1,'kW')}};
 let rows=energyFlowDeviceRows(prefs,hass,false);assert.equal(rows.length,3);assert.equal(energyFlowDeviceTotal(rows),2);assert.equal(rows.at(-1).value,null);
 hass.states['sensor.parent']=state('unavailable','W');rows=energyFlowDeviceRows(prefs,hass,false);assert.equal(energyFlowDeviceTotal(rows),1);
 const historical=energyFlowDeviceRows(prefs,hass,true,{parent:[{change:10}],child:[{change:4}]});assert.equal(energyFlowDeviceTotal(historical),10);
});
const host=(history=false)=>({_view:history?'history':'live',_hass:{language:'en',config:{currency:'EUR',time_zone:'UTC'},states:{}},_prefs:{energy_sources:[]},_offline:()=>false,_start:Date.now()-3600000,_end:Date.now()});
test('detail content escapes device/source names and explains absent devices without extra configuration',()=>{
 const h=host();h._prefs.device_consumption=[{name:'<img src=x onerror=alert(1)>',stat_consumption:'x',stat_rate:'sensor.x'}];h._hass.states['sensor.x']=state(1,'kW');
 const html=energyFlowDetailContent(h,'home',{home:2});assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('No measurement'));
 h._prefs.device_consumption=[];assert.ok(energyFlowDetailContent(h,'home',{home:0}).includes('No individual devices'));
 h._prefs.energy_sources=[{type:'solar',stat_energy_from:'pv',name:'<img src=x onerror=alert(1)>'},{type:'solar',stat_energy_from:'pv2',name:'Other roof'}];const solar=energyFlowDetailContent(h,'sun',{solar:3,home:2,export:1});assert.ok(solar.includes('&lt;img'));assert.ok(!solar.includes('<img'));
});
test('solar attribution is suppressed with battery storage, unknown balances and impossible exports',()=>{
 const h=host(),base={solar:4,home:3,export:1};
 assert.ok(energyFlowDetailContent(h,'sun',base).includes('Self-consumed generation'));
 for(const data of [{...base,battery:true},{...base,home:null},{...base,export:5}])assert.ok(!energyFlowDetailContent(h,'sun',data).includes(' %'));
 assert.ok(!energyFlowDetailContent(h,'sun',{solar:0,home:0,export:0}).includes('NaN'));
});
test('historical grid keeps currencies separate and never falls back to a present-day tariff',()=>{
 const h=host(true);h._prefs.energy_sources=[{type:'grid',stat_energy_from:'in',stat_energy_to:'out',stat_cost:'cost',stat_compensation:'revenue',number_energy_price:999}];
 h._detailResult={statistics:{in:[{change:10}],out:[{change:2}],cost:[{change:3}],revenue:[{change:.5}]},metadata:{cost:{unit_of_measurement:'EUR'},revenue:{unit_of_measurement:'USD'}}};
 let html=energyFlowDetailContent(h,'grid',{import:10,export:2});assert.ok(html.includes('€ 3'));assert.ok(!html.includes('999'));assert.ok(html.includes('0.5 USD'));assert.ok(!html.includes('€ 2.5'));
 h._detailResult.metadata.revenue.unit_of_measurement='EUR';html=energyFlowDetailContent(h,'grid',{import:10,export:2});assert.ok(html.includes('€ 3'));assert.ok(html.includes('€ 0.5'));assert.ok(!html.includes('€ 0.28/kWh'));
});

test('device comparison uses the home total and omits bars for missing or zero-total readings',()=>{
 const h=host();h._prefs.device_consumption=[{name:'Heater',stat_consumption:'heater',stat_rate:'sensor.heater'},{name:'Unknown',stat_consumption:'unknown'}];h._hass.states['sensor.heater']=state(1000,'W');
 const html=energyFlowDetailContent(h,'home',{home:4});
 assert.ok(html.includes('width:25%'));assert.ok(html.includes('width:75%'));assert.ok(html.includes('25 %'));assert.equal((html.match(/class="ui-detail-surface-track"/g)||[]).length,2);
 const zero=energyFlowDetailContent(h,'home',{home:0});assert.ok(!zero.includes('class="ui-detail-surface-track"'));assert.ok(!zero.includes('NaN'));assert.ok(!zero.includes('Infinity'));
});

test('each popup distinguishes live power from historical energy with appropriate sections',()=>{
 for(const kind of ['home','grid','sun']){
  const live=energyFlowDetailPopup(host(),kind,{home:2,solar:3,import:0,export:1});
  const historical=energyFlowDetailPopup(host(true),kind,{home:2,solar:3,import:0,export:1});
  assert.ok(live.includes('data-detail-view="live"'));assert.ok(live.includes(' · Live</strong>'));
  assert.ok(historical.includes('data-detail-view="history"'));assert.ok(historical.includes(' · History</strong>'));
  assert.ok(!live.includes('<span>kW</span>'));assert.ok(!historical.includes('<span>kWh</span>'));
  if(kind==='grid'){assert.ok(live.includes('Current import price'));assert.ok(historical.includes('Import costs'));assert.ok(!live.includes('Net energy cost'));}
 }
});

test('solar coverage distinguishes self-sufficiency from self-consumption and rejects unsafe attribution',()=>{
 const coverage=energyFlowSolarCoverage({solar:6,export:2,home:8});assert.equal(coverage.own,4);assert.equal(coverage.coverage,50);assert.ok(Math.abs(coverage.selfConsumption-100*4/6)<1e-10);
 for(const data of [{solar:6,export:2,home:8,battery:true},{solar:6,export:2,home:null},{solar:6,export:7,home:8},{solar:6,export:0,home:2},{solar:-1,export:0,home:2},{solar:6,export:2,home:8,import:10}])assert.equal(energyFlowSolarCoverage(data),null);
 assert.deepEqual(energyFlowSolarCoverage({solar:0,export:0,home:0}),{own:0,coverage:null,selfConsumption:null});
 const html=energyFlowDetailContent(host(),'sun',{solar:6,export:2,home:8});assert.ok(html.includes('Self-sufficiency'));assert.ok(html.includes('50 %'));assert.ok(html.includes('66.67 %'));assert.ok(html.includes('<dd>50 %</dd>'));assert.ok(html.includes('<dd>4 kW</dd>'));
 const noUse=energyFlowDetailContent(host(true),'sun',{solar:0,export:0,home:0});assert.ok(noUse.includes('No home consumption.'));assert.ok(!noUse.includes('Infinity'));
 const halves=energyFlowDetailContent(host(),'sun',{solar:5,export:0,home:8,import:3});assert.ok(halves.includes('62.5 %'));assert.ok(halves.includes('100 %'));
 assert.ok(halves.includes('width:62.5%'));assert.ok(halves.includes('width:100%'));
 assert.equal((halves.match(/class="ui-detail-surface-track"/g)||[]).length,2);assert.ok(!halves.includes('energy-detail-track'));
 assert.ok(!noUse.includes('class="energy-detail-supply"'));
});

test('grid pairs live kW with configured rates and historical kWh with recorded costs',()=>{
 const h=host();h._prefs.energy_sources=[{type:'grid',stat_energy_from:'in',stat_energy_to:'out',stat_cost:'cost',stat_compensation:'revenue',number_energy_price:.28,number_energy_price_export:-.05}];
 let html=energyFlowDetailContent(h,'grid',{import:2,export:0});
 assert.ok(html.includes('<dd>2 kW</dd>'));assert.ok(html.includes('€ 0.28/kWh'));assert.ok(html.includes('€ -0.05/kWh'));assert.ok(!html.includes('<span>kWh</span>'));
 h._view='history';h._detailResult={statistics:{in:[{change:10}],out:[{change:2}],cost:[{change:3}],revenue:[{change:.5}]},metadata:{cost:{unit_of_measurement:'EUR'},revenue:{unit_of_measurement:'EUR'}}};
 html=energyFlowDetailContent(h,'grid',{import:10,export:2});assert.ok(html.includes('<dd>10 kWh</dd>'));assert.ok(html.includes('<dd>2 kWh</dd>'));assert.ok(html.includes('€ 3'));assert.ok(html.includes('€ 0.5'));assert.ok(!html.includes('€ 0.28/kWh'));
});

test('different connection tariffs remain separate rather than inventing a combined live rate',()=>{
 const h=host();h._prefs.energy_sources=[{type:'grid',name:'First',stat_energy_from:'a',number_energy_price:.2},{type:'grid',name:'Second',stat_energy_from:'b',number_energy_price:.4}];
 const html=energyFlowDetailContent(h,'grid',{import:3,export:0});assert.ok(html.includes('€ 0.2/kWh'));assert.ok(html.includes('€ 0.4/kWh'));assert.ok(html.includes('First'));assert.ok(html.includes('Second'));assert.ok(!html.includes('€ 0.3/kWh'));
});

test('live grid is four label-value metrics without bars or unavailable-price messages',()=>{
 const h=host(),html=energyFlowDetailContent(h,'grid',{import:2,export:0});
 assert.equal((html.match(/<dt>/g)||[]).length,4);
 assert.ok(html.includes('<dd>2 kW</dd>'));assert.ok(html.includes('<dd>0 kW</dd>'));assert.ok(html.includes('<dd>—</dd>'));
 assert.ok(!html.includes('Price unavailable'));assert.ok(!html.includes('energy-detail-track'));assert.ok(!html.includes('energy-detail-supply'));
});

test('historical grid presents net costs first and two detail surfaces without percentage bars',()=>{
 const h=host(true),html=energyFlowDetailContent(h,'grid',{import:3,export:1});
 assert.equal((html.match(/<dt>/g)||[]).length,5);
 assert.equal((html.match(/data-ui-detail-surface=/g)||[]).length,2);
 assert.ok(html.indexOf('Net costs')<html.indexOf('Total import'));
 assert.ok(!html.includes(' %'));assert.ok(!html.includes('ui-detail-surface-track'));assert.ok(!html.includes('energy-grid-balance'));
 assert.ok(html.includes('3 kWh'));assert.ok(html.includes('1 kWh'));
});

test('net costs subtract complete recorded compensation, preserving zero and negative results',()=>{
 const h=host(true);h._prefs.energy_sources=[{type:'grid',stat_energy_from:'in',stat_energy_to:'out',stat_cost:'cost',stat_compensation:'revenue'}];
 const net=()=>energyFlowDetailContent(h,'grid',{import:3,export:1}).match(/class="energy-grid-net"><dt>Net costs<\/dt><dd>(.*?)<\/dd>/)[1];
 h._detailResult={statistics:{cost:[{change:2}],revenue:[{change:.5}]},metadata:{cost:{unit_of_measurement:'EUR'},revenue:{unit_of_measurement:'EUR'}}};
 assert.equal(net(),'€ 1.5');
 h._detailResult.statistics.revenue=[{change:2}];assert.equal(net(),'€ 0');
 h._detailResult.statistics.revenue=[{change:3}];assert.equal(net(),'€ -1');
 h._detailResult.metadata.revenue.unit_of_measurement='USD';assert.equal(net(),'—');
 h._detailResult.metadata.revenue.unit_of_measurement='EUR';delete h._detailResult.statistics.revenue;assert.equal(net(),'—');
 h._prefs.energy_sources.push({type:'grid',stat_energy_from:'second',stat_cost:'second_cost'});
 h._detailResult.statistics.revenue=[{change:.5}];h._detailResult.statistics.second_cost=[{change:4}];h._detailResult.metadata.second_cost={unit_of_measurement:'EUR'};
 assert.equal(net(),'€ 5.5');
});


test('home uses actual power in live mode and selected-period energy in history',()=>{
 const h=host();h._prefs.device_consumption=[{name:'Heat pump',stat_consumption:'hp',stat_rate:'sensor.hp'}];h._hass.states['sensor.hp']=state(1400,'W');
 let html=energyFlowDetailContent(h,'home',{home:2});assert.ok(html.includes('<dd>1.4 kW</dd>'));assert.ok(!html.includes('kWh'));
 h._view='history';h._detailResult={statistics:{hp:[{change:4},{change:2}]}};html=energyFlowDetailContent(h,'home',{home:10});assert.ok(html.includes('<dd>6 kWh</dd>'));assert.ok(html.includes('60 %'));assert.ok(!html.includes('<dd>1.4 kW</dd>'));
});

test('solar uses shared surfaces and bars only for known attribution',()=>{
 const html=energyFlowDetailContent(host(),'sun',{solar:4,home:3,export:1});
 assert.ok(html.includes('75 %'));assert.equal((html.match(/<dt>/g)||[]).length,8);assert.ok(html.includes('width:100%'));
 const unknown=energyFlowDetailContent(host(),'sun',{solar:4,home:null,export:1});assert.ok(!unknown.includes('class="ui-detail-surface-track"'));assert.ok(unknown.includes('Self-sufficiency unavailable.'));
});

test('home and solar label each energy reading with its mode unit while percentages keep their meaning',()=>{
 for(const history of [false,true])for(const kind of ['home','sun']){
  const h=host(history);h._prefs.device_consumption=[{name:'Heater',stat_consumption:'heater',stat_rate:'sensor.heater'}];h._hass.states['sensor.heater']=state(1000,'W');h._detailResult={statistics:{heater:[{change:1}]}};
  const html=energyFlowDetailContent(h,kind,{home:4,solar:3,import:2,export:1});
  const unit=history?'kWh':'kW';
  assert.ok((html.match(new RegExp('\\b'+unit+'\\b','g'))||[]).length>=3);
  assert.ok(!html.includes(history?' kW<':' kWh<'));
  if(kind==='home'){
   assert.ok(html.includes('energy-device-surfaces'));assert.ok(html.includes(`<dd>1 ${unit}</dd>`));assert.ok(html.includes('<dd>25 %</dd>'));
   assert.ok(html.includes('width:25%'));assert.ok(html.includes('width:75%'));
  }else assert.ok(html.indexOf('<dt>Solar generation</dt>')<html.indexOf('Self-sufficiency</h3>'));
 }
});

test('popup readings cap decimals for energy, percentages and tariffs, including locale fallback',()=>{
 for(const language of ['en','nl','invalid_locale'])for(const history of [false,true]){
  const h=host(history);h._hass.language=language;
  h._prefs.energy_sources=[{type:'grid',stat_energy_from:'in',number_energy_price:.284567}];
  h._prefs.device_consumption=[{name:'Heater',stat_consumption:'heater',stat_rate:'sensor.heater'}];h._hass.states['sensor.heater']=state(1.234567,'kW');
  h._detailResult={statistics:{heater:[{change:1.234567}]}};
  for(const kind of ['grid','home','sun']){
   const html=energyFlowDetailContent(h,kind,{solar:1.234567,export:.123456,import:2.345678,home:3.456789});
   const text=html.replace(/<[^>]*>/g,' ');
   assert.ok(!/\d[.,]\d{3,}/.test(text),text);
   assert.ok(text.includes(language==='nl'?'2,35':'2.35')||text.includes(language==='nl'?'1,23':'1.23'));
   if(kind==='grid'&&!history)assert.ok(text.includes(language==='nl'?'€ 0,28/kWh':'€ 0.28/kWh'));
  }
 }
});

test('home hides zero and missing device readings using the selected mode measurements',()=>{
 for(const history of [false,true]){
  const h=host(history);h._prefs.device_consumption=[{name:'Zero device',stat_consumption:'zero',stat_rate:'sensor.zero'},{name:'Unknown device',stat_consumption:'unknown'}];
  h._hass.states['sensor.zero']=state(0,'W');h._detailResult={statistics:{zero:[{change:0}]}};
  const html=energyFlowDetailContent(h,'home',{home:0});
  assert.ok(!html.includes('Zero device'));assert.ok(!html.includes('Unknown device'));assert.ok(!html.includes('aria-label="Other"'));assert.ok(!html.includes('energy-detail-track'));
  assert.ok(!html.includes('Power by device'));assert.ok(!html.includes('Consumption by device'));
  h._detailResult.statistics.unknown=[{change:1}];
  const measured=energyFlowDetailContent(h,'home',{home:2});assert.equal(measured.includes('Unknown device'),history);
 }
});
