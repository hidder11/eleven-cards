import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEnergyFlowConfig} from '../src/energy-flow-data.js';
import {energyFlowDetailContent} from '../src/energy-flow-details.js';
import {energyFlowTabs} from '../src/energy-flow-tabs.js';
const host=(config={})=>({_id:'prices-test',_config:normalizeEnergyFlowConfig(config),_view:'live',_offline:()=>false,_hass:{language:'en',config:{currency:'EUR'},states:{'sensor.buy':{state:'.25',attributes:{unit_of_measurement:'EUR/kWh'}},'sensor.sell':{state:'-.05',attributes:{unit_of_measurement:'€/kWh'}}}},_prefs:{energy_sources:[{type:'grid',stat_energy_from:'in',stat_energy_to:'out',number_energy_price:99,number_energy_price_export:88}]}});
test('current price entities need only state and unit, preserving zero and negative prices',()=>{
 const h=host({price_entity:'sensor.buy',export_price_entity:'sensor.sell'});
 let html=energyFlowDetailContent(h,'grid',{import:1,export:0});
 assert.ok(html.includes('€ 0.25/kWh'));assert.ok(html.includes('€ -0.05/kWh'));assert.ok(!html.includes('99'));
 h._hass.states['sensor.buy'].state='0';html=energyFlowDetailContent(h,'grid',{});assert.ok(html.includes('€ 0/kWh'));
});
test('chosen missing or invalid price sensors show unknown without falling back to Energy',()=>{
 for(const state of ['unavailable','unknown','bad']){
  const h=host({price_entity:'sensor.buy'});h._hass.states['sensor.buy'].state=state;
  assert.ok(!energyFlowDetailContent(h,'grid',{}).includes('99'));
 }
 const h=host({price_entity:'sensor.missing'});assert.ok(!energyFlowDetailContent(h,'grid',{}).includes('99'));
 h._config=normalizeEnergyFlowConfig({price_entity:'sensor.buy'});h._hass.states['sensor.buy'].attributes.unit_of_measurement='kWh';assert.ok(!energyFlowDetailContent(h,'grid',{}).includes('0.25/kWh'));
});
test('Wh and MWh tariffs normalize to kWh; unselected directions retain Energy prices',()=>{
 const h=host({price_entity:'sensor.buy'});
 for(const [unit,value] of [['EUR/Wh','.00025'],['EUR/MWh','250']]){
  h._hass.states['sensor.buy']={state:value,attributes:{unit_of_measurement:unit}};
  const html=energyFlowDetailContent(h,'grid',{});assert.ok(html.includes('€ 0.25/kWh'));assert.ok(html.includes('€ 88/kWh'));
 }
});
test('historical recorded costs never use the current price overrides',()=>{
 const h=host({price_entity:'sensor.buy',export_price_entity:'sensor.sell'});h._view='history';h._prefs.energy_sources[0].stat_cost='cost';h._prefs.energy_sources[0].stat_compensation='return';
 h._detailResult={statistics:{cost:[{change:3}],return:[{change:1}]},metadata:{cost:{unit_of_measurement:'EUR'},return:{unit_of_measurement:'EUR'}}};
 const html=energyFlowDetailContent(h,'grid',{import:10,export:2});assert.ok(html.includes('€ 2'));assert.ok(!html.includes('/kWh'));
});
test('legacy price graph options cannot create a tab or reserve a default tab',()=>{
 const h=host({show_prices:true,price_card:{entity:'sensor.old'},default_tab:'prices'});
 assert.equal(energyFlowTabs(h,{},false),'');assert.equal(h._config.default_tab,'');assert.equal(h._config.price_card,undefined);assert.equal(h._config.show_prices,undefined);
 assert.throws(()=>normalizeEnergyFlowConfig({price_entity:'light.invalid'}));
});
