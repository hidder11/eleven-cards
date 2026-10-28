import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEnergyFlowConfig} from '../src/energy-flow-data.js';
import {energyFlowTabs} from '../src/energy-flow-tabs.js';
import {energyFlowDetailContent} from '../src/energy-flow-details.js';
import {entityTabReading} from '../../../shared/entity-tabs.js';
const prefs={energy_sources:[{type:'solar',stat_energy_from:'solar',stat_rate:'sensor.solar'},{type:'grid',stat_energy_from:'import',stat_energy_to:'export',stat_cost:'cost',stat_compensation:'revenue'}],device_consumption:[{name:'Warmtepomp',stat_consumption:'heatpump'}]};
const data={solar:4,home:3,import:0,export:1};
function host(config={}){return {_id:'energy-test',_view:'live',_hass:{language:'nl',states:{}},_prefs:prefs,_offline:()=>false,_config:normalizeEnergyFlowConfig(config)};}

test('existing dashboards retain popups; built-in and custom tab defaults select only visible IDs',()=>{
 assert.equal(normalizeEnergyFlowConfig({}).detail_view,'popup');
 assert.equal(energyFlowTabs(host(),data,true),'');
 assert.equal(energyFlowTabs(host({show_prices:false}),data,true),'');
 const config=normalizeEnergyFlowConfig({detail_view:'tabs',tabs:['grid','invalid'],default_tab:'sun',custom_tabs:[{id:'custom-one',show:false}]});
 assert.deepEqual(config.tabs,['grid']);assert.equal(config.default_tab,'grid');
 assert.equal(normalizeEnergyFlowConfig({detail_view:'tabs',tabs:[],show_prices:false,custom_tabs:[{id:'custom-one'}]}).default_tab,'custom-one');
 assert.equal(normalizeEnergyFlowConfig({detail_view:'tabs',tabs:[]}).default_tab,'');
 assert.equal(normalizeEnergyFlowConfig({detail_view:'tabs',tabs:[],show_prices:false}).default_tab,'');
});

test('built-in tabs reuse popup contents and preserve selection across sensor/view changes',()=>{
 const h=host({detail_view:'tabs',default_tab:'home'});
 let html=energyFlowTabs(h,data,true);assert.equal(h._activeTab,'home');
 for(const kind of ['sun','home','grid'])assert.ok(html.includes(energyFlowDetailContent(h,kind,data)));
 h._activeTab='grid';h._view='history';h._start=0;h._end=1000;
 h._detailResult={statistics:{cost:[{change:2}],revenue:[{change:.5}]},metadata:{cost:{unit_of_measurement:'EUR'},revenue:{unit_of_measurement:'EUR'}}};h._hass.config={currency:'EUR'};
 html=energyFlowTabs(h,data,true);assert.equal(h._activeTab,'grid');assert.ok(html.includes('Netto kosten'));assert.ok(html.includes('€ 1,5'));
 h._config=normalizeEnergyFlowConfig({detail_view:'tabs',tabs:['home'],show_prices:false});
 html=energyFlowTabs(h,data,true);assert.equal(h._activeTab,'home');assert.ok(!html.includes('role="tablist"'));assert.ok(html.includes('id="energy-test-tabs-panel-home"'));
});

test('custom tabs preserve IDs and order, escape user data and cap Energy precision at two',()=>{
 const h=host({detail_view:'tabs',tabs:[],custom_tabs:[{id:'custom-a',title:'<img src=x>',entities:[{entity:'sensor.a',name:'<label>',decimals:6}]},{id:'custom-a',show:false}]});
 assert.equal(h._config.custom_tabs[0].entities[0].decimals,2);
 assert.notEqual(h._config.custom_tabs[0].id,h._config.custom_tabs[1].id);
 h._hass.states['sensor.a']={state:'1.23456',attributes:{unit_of_measurement:'kW'}};
 const html=energyFlowTabs(h,data,true);assert.ok(html.includes('&lt;img src=x&gt;'));assert.ok(html.includes('&lt;label&gt;'));assert.ok(html.includes('1,23 kW'));assert.ok(!html.includes('<img'));
 h._config=normalizeEnergyFlowConfig({...h._config,custom_tabs:h._config.custom_tabs.map(tab=>({...tab,title:'Hernoemd'}))});
 assert.equal(h._config.custom_tabs[0].id,'custom-a');
});

test('one custom tab hides navigation and multiple custom tabs retain it',()=>{
 const h=host({custom_tabs:[{id:'custom-a',title:'Meters'}]});
 let html=energyFlowTabs(h,data,true);assert.ok(!html.includes('role="tablist"'));assert.ok(html.includes('energy-single-tab'));assert.ok(html.includes('Meters'));
 h._config=normalizeEnergyFlowConfig({custom_tabs:[{id:'custom-a'},{id:'custom-b'}]});assert.ok(energyFlowTabs(h,data,true).includes('role="tablist"'));
});

test('custom readings distinguish zero, missing attributes, structured values, units and unavailable states',()=>{
 const hass={language:'en',states:{a:{state:'0',attributes:{unit_of_measurement:'kW',temperature:20.555,object:{x:1}}}}};
 assert.equal(entityTabReading({entity:'a'},hass),'0 kW');
 assert.equal(entityTabReading({entity:'a',attribute:'temperature',unit:'°C',decimals:1},hass),'20.6 °C');
 assert.equal(entityTabReading({entity:'a',attribute:'temperature',show_unit:false},hass),'20.56');
 for(const attribute of ['missing','object'])assert.equal(entityTabReading({entity:'a',attribute},hass),'—');
 hass.states.a.state='unavailable';assert.equal(entityTabReading({entity:'a'},hass),'—');
});

globalThis.HTMLElement=class{attachShadow(){this.shadowRoot={};}hasAttribute(){return false;}};
globalThis.document={hidden:false};
const {EnergyFlowCard}=await import('../src/energy-flow-card.js');
test('mode and default changes preserve loaded history, while manual tab selection survives ordinary updates',()=>{
 const c=new EnergyFlowCard();c.render=()=>{};c.setConfig({detail_view:'tabs',default_tab:'home'});
 c._statistics={cached:true};const cached=c._statistics;c._activeTab='grid';
 c.setConfig({...c._config,color:'done'});assert.equal(c._activeTab,'grid');assert.equal(c._statistics,cached);
 c.setConfig({...c._config,default_tab:'sun'});assert.equal(c._activeTab,'sun');
 c.setConfig({...c._config,detail_view:'popup'});assert.equal(c._detailNode,null);assert.equal(c._statistics,cached);
});

test('historical tabs load device and cost details once and reuse the cache across tabs',async()=>{
 const requests=[],c=new EnergyFlowCard();c.render=()=>{};c._refreshDetailContent=()=>{};
 c.setConfig({detail_view:'tabs',default_view:'history'});c._attached=true;c._prefs=prefs;
 c._hass={callWS:async request=>{requests.push(request);return request.type==='energy/info'?{}:request.type==='recorder/get_statistics_metadata'?[]:{};}};
 await c._loadDetails();assert.equal(requests.length,3);
 assert.deepEqual(requests.find(r=>r.type==='recorder/statistics_during_period').statistic_ids.sort(),['cost','export','heatpump','import','revenue','solar']);
 c._activeTab='grid';await c._loadDetails();assert.equal(requests.length,3);
 c._attached=false;c._reset();
});
