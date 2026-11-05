import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCarConfig,carPercentage,carReading,carImageUrl,carFieldReading,carRange} from '../src/car-utils.js';

test('percentage uses fixed input or configured entity without falling back on unavailable data',()=>{
 const config=normalizeCarConfig({percentage:62});
 assert.equal(carPercentage(config),62);
 assert.equal(carPercentage({...config,percentage_entity:'sensor.fuel'},{'sensor.fuel':{state:'0'}}),0);
 for(const state of ['unavailable','unknown','','bad'])assert.equal(carPercentage({...config,percentage_entity:'sensor.fuel'},{'sensor.fuel':{state}}),null);
 assert.equal(carPercentage({...config,percentage_entity:'sensor.fuel'}),null);
 assert.equal(carPercentage({...config,percentage_entity:'sensor.fuel'},{'sensor.fuel':{state:'150'}}),100);
});
test('normalization bounds image controls, keeps custom labels and restricts background presets',()=>{
 const config=normalizeCarConfig({image_scale:1000,image_offset_y:-400,background:'bad',color:'bad',percentage:-1,field_2_label:' Actieradius ',field_2_entity:'sensor.range'});
 assert.equal(config.image_scale,300);assert.equal(config.image_offset_y,-150);assert.equal(config.percentage,0);
 for(const evcc_enabled of [false,true])for(const background of ['aurora','clouds','isobars']){const selected=normalizeCarConfig({evcc_enabled,background,animate_background:false});assert.equal(selected.background,background);assert.equal(selected.animate_background,false);}
 assert.equal(config.background,'lanes');assert.equal(config.color,'charging');assert.equal(config.field_2_label,'Actieradius');assert.equal(config.field_2_entity,'sensor.range');
});
test('optional EVCC integration keeps explicit tab choices independent of compact density',()=>{
 for(const compact of [false,true]){
  const config=normalizeCarConfig({evcc_enabled:true,compact,tabs:['session','technical'],entity:'sensor.evcc_driveway_charge_power',field_2_label:'Bereik'});
  assert.equal(config.type,'custom:eleven-car-card');assert.equal(config.evcc_enabled,true);
  assert.equal(config.show_controls,false);assert.equal(config.show_session,true);assert.equal(config.show_details,true);
  assert.deepEqual(config.tabs,['session','technical']);assert.equal(config.field_2_label,'Bereik');
 }
 assert.deepEqual(normalizeCarConfig({evcc_enabled:true,tabs:[]}).tabs,[]);
 assert.deepEqual(normalizeCarConfig({evcc_enabled:true,show_session:false}).tabs,['controls','technical']);
 assert.equal(normalizeCarConfig({evcc_enabled:false,entity:'invalid dormant EVCC input'}).evcc_enabled,false);
});
test('readings preserve zero, units, text and locale and mark unavailable values',()=>{
 const hass={language:'nl'};
 assert.equal(carReading({state:'0',attributes:{unit_of_measurement:'km'}},hass),'0 km');
 assert.equal(carReading({state:'12.5',attributes:{unit_of_measurement:'L'}},hass),'12,5 L');
 assert.equal(carReading({state:'Geparkeerd'},hass),'Geparkeerd');
 assert.equal(carReading({state:'unavailable'},hass),'\u2014');
 assert.equal(carReading(null,hass),'\u2014');
});
test('image entities support HA URLs and reject executable or protocol-relative sources',()=>{
 const image=source=>({state:'2026-01-01',attributes:{entity_picture:source}});
 assert.equal(carImageUrl(image('/api/image/1'),{hassUrl:path=>'https://ha.test'+path}),'https://ha.test/api/image/1');
 for(const source of ['javascript:alert(1)','//example.test/car.png','data:image/svg+xml,abc'])assert.equal(carImageUrl(image(source)),null);
 assert.equal(carImageUrl(image('https://example.test/car.png')),'https://example.test/car.png');
});
test('custom fields support optional attributes, display precision, units and missing values',()=>{
 const hass={language:'nl'},entity={state:'12.45',attributes:{unit_of_measurement:'L',range:340.7,zero:0,nested:{value:1}}};
 let config=normalizeCarConfig({field_2_decimals:1});
 assert.equal(carFieldReading(entity,hass,config,2),'12,5 L');
 config=normalizeCarConfig({field_2_attribute:'range',field_2_unit:'km',field_2_decimals:2});
 assert.equal(carFieldReading(entity,hass,config,2),'340,70 km');
 assert.equal(carFieldReading(entity,hass,{...config,field_2_show_unit:false},2),'340,70');
 assert.equal(carFieldReading(entity,hass,{...config,field_2_unit:''},2),'340,70');
 assert.equal(carFieldReading(entity,hass,{...config,field_2_attribute:'zero'},2),'0,00 km');
 for(const field_2_attribute of ['missing','nested'])assert.equal(carFieldReading(entity,hass,{...config,field_2_attribute},2),'\u2014');
 assert.equal(carFieldReading({...entity,state:'unavailable'},hass,config,2),'\u2014');
 const bounds=normalizeCarConfig({field_1_decimals:100,field_2_decimals:'',field_3_decimals:-3,show_field_1:false});
 assert.equal(bounds.field_1_decimals,6);assert.equal(bounds.field_2_decimals,null);assert.equal(bounds.field_3_decimals,0);assert.equal(bounds.show_field_1,false);assert.equal(bounds.show_field_2,true);
});
test('default tab is restricted to selected tabs and survives compact configuration',()=>{
 assert.equal(normalizeCarConfig({evcc_enabled:true,tabs:['session','technical'],default_tab:'technical',compact:true}).default_tab,'technical');
 assert.equal(normalizeCarConfig({evcc_enabled:true,tabs:['session'],default_tab:'controls'}).default_tab,'session');
});
test('custom tabs retain stable distinct IDs, row formatting and default selection in either mode',()=>{
 for(const evcc_enabled of [false,true]){
  const config=normalizeCarConfig({evcc_enabled,default_tab:'custom-status',custom_tabs:[{id:'custom-status',title:'Status',entities:['sensor.car',{entity:'sensor.range',name:'Bereik',decimals:0}]},{id:'custom-status',title:'Andere',show:false}]});
  assert.equal(config.custom_tabs[0].id,'custom-status');assert.notEqual(config.custom_tabs[0].id,config.custom_tabs[1].id);
  assert.equal(config.custom_tabs[0].entities[1].decimals,0);assert.equal(config.custom_tabs[0].entities[0].entity,'sensor.car');
  assert.equal(config.default_tab,'custom-status');assert.equal(normalizeCarConfig(config).custom_tabs[0].id,'custom-status');
 }
 const bounds=normalizeCarConfig({image_offset_x:300,animation_max_kw:0,animation_speed:100,battery_style:'invalid'});
 assert.equal(bounds.image_offset_x,150);assert.equal(bounds.animation_max_kw,0.1);assert.equal(bounds.animation_speed,3);assert.equal(bounds.battery_style,'soft');
 assert.equal(normalizeCarConfig({}).battery_style,'soft');
 assert.equal(normalizeCarConfig({battery_style:'classic'}).battery_style,'classic');
});
test('remaining range uses an explicit entity and preserves its units and zero',()=>{
 const config=normalizeCarConfig({range_source:'entity',range_entity:'sensor.range',range_full:800});
 assert.equal(carRange(config,{'sensor.range':{state:'420',attributes:{unit_of_measurement:'mi'}}}).value,420);
 assert.equal(carRange(config,{'sensor.range':{state:'420',attributes:{unit_of_measurement:'mi'}}}).unit,'mi');
 assert.equal(carRange(config,{'sensor.range':{state:'0'}}).value,0);
 for(const state of ['unavailable','unknown','bad','',-1])assert.equal(carRange(config,{'sensor.range':{state}}).value,null);
 assert.equal(carRange(config).value,null,'unavailable source must not silently fall back to estimated range');
 assert.equal(carRange(normalizeCarConfig()),null);
});
test('estimated range uses the authoritative percentage and full range, never inventing unavailable data',()=>{
 const config=normalizeCarConfig({range_source:'calculated',range_full:800,percentage:50});
 assert.equal(carRange(config).value,400);assert.equal(carRange(config).estimated,true);
 assert.equal(carRange({...config,percentage:0}).value,0);
 assert.equal(carRange({...config,percentage:100}).value,800);
 assert.equal(carRange({...config,range_full:0}).value,null);
 assert.equal(carRange({...config,range_full:null}).value,null);
 assert.equal(carRange({...config,percentage_entity:'sensor.fuel'}).value,null);
 assert.equal(carRange({...config,percentage_entity:'sensor.fuel'},{'sensor.fuel':{state:'25'}}).value,200);
 assert.equal(carRange({...config,range_unit:'mi'}).unit,'mi');
 assert.equal(normalizeCarConfig({range_entity:'sensor.range'}).range_source,'entity');
 assert.equal(normalizeCarConfig({range_full:800}).range_source,'calculated');
});
