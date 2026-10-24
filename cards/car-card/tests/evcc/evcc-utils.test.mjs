import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evccNumber, evccDuration, evccImageUrl, normalizeEvccConfig, resolveEvccEntities, evccLoadpoints, evccStatus, formatEvccValue, loadEvccRegistry, evccVehicleName, evccModeOptions} from '../../src/evcc/evcc-utils.js';

test('background selection is safe, persists the five designs and defaults existing cards to Energy Lanes', () => {
 assert.equal(normalizeEvccConfig({}).background,'lanes');
 assert.equal(normalizeEvccConfig({background:''}).background,'lanes');
 for(const background of ['lanes','halo','ribbon','prism-glass','eclipse']) assert.equal(normalizeEvccConfig({background}).background,background);
 for(const background of ['invalid','<script>',{},42]) assert.throws(()=>normalizeEvccConfig({background}),/background/);
});

test('image scale defaults to the current size, accepts bounds and strips the obsolete vehicle name', () => {
 assert.equal(normalizeEvccConfig({}).image_scale,100);
 assert.equal(normalizeEvccConfig({image_scale:50}).image_scale,50);
 assert.equal(normalizeEvccConfig({image_scale:'150'}).image_scale,150);
 assert.equal(normalizeEvccConfig({image_scale:'300'}).image_scale,300);
 assert.equal(normalizeEvccConfig({image_scale:''}).image_scale,100);
 assert.equal(Object.hasOwn(normalizeEvccConfig({vehicle_name:'Old name'}),'vehicle_name'),false);
 for(const image_scale of [0,49,301,'invalid',Infinity])assert.throws(()=>normalizeEvccConfig({image_scale}),/Image size/);
});

test('vertical image position defaults to zero and validates both directions', () => {
 assert.equal(normalizeEvccConfig({}).image_offset_y,0);
 assert.equal(normalizeEvccConfig({image_offset_y:''}).image_offset_y,0);
 for(const value of [-150,0,150,'-45'])assert.equal(normalizeEvccConfig({image_offset_y:value}).image_offset_y,Number(value));
 for(const image_offset_y of [-151,151,'invalid',Infinity])assert.throws(()=>normalizeEvccConfig({image_offset_y}),/vertical position/);
});

test('missing and unavailable readings stay distinct from a measured zero', () => {
 for (const state of [undefined, '', ' ', 'unknown', 'unavailable', 'NaN', 'Infinity']) assert.equal(evccNumber({state}), null);
 assert.equal(evccNumber({state: '0'}), 0);
 assert.equal(evccNumber({state: '-0.24'}), -.24);
});

const state = (value, unit) => ({state: String(value), attributes: {unit_of_measurement: unit}});
const entry = (entity_id, key, extra = {}) => ({entity_id, unique_id: 'evcc_intg.' + key, platform: 'evcc_intg', config_entry_id: 'installation1', ...extra});
test('registry ownership prevents conventional fallback across installations', () => {
 const power='sensor.renamed_power',mode='select.evcc_driveway_mode',soc='sensor.evcc_driveway_vehicle_soc';
 const registry=[entry(power,'evcc_driveway_charge_power',{config_entry_id:'installation2'}),entry(mode,'evcc_driveway_mode'),entry(soc,'evcc_driveway_vehicle_soc')];
 const hass={states:{[power]:state(7,'kW'),[mode]:state('pv'),[soc]:state(50,'%')}};
 assert.deepEqual(resolveEvccEntities({entity:power},hass,registry),{power});
 registry.push(entry('select.renamed_mode','evcc_driveway_mode',{config_entry_id:'installation2'}));
 hass.states['select.renamed_mode']=state('pv');
 assert.equal(resolveEvccEntities({entity:power},hass,registry).mode,'select.renamed_mode');
 assert.equal(resolveEvccEntities({entity:power,entities:{soc}},hass,registry).soc,soc);
 registry.push(entry('select.duplicate_mode','evcc_driveway_mode',{config_entry_id:'installation2'}));
 hass.states['select.duplicate_mode']=state('pv');
 assert.equal(resolveEvccEntities({entity:power},hass,registry).mode,undefined,'ambiguous keys cannot fall back');
 registry[0].config_entry_id=undefined;
 assert.equal(resolveEvccEntities({entity:power},hass,registry).mode,undefined,'unknown anchor ownership cannot resolve another installation');
});
test('stable ha-evcc keys resolve renamed entities without mixing loadpoints or installations', () => {
 const registry = [entry('sensor.renamed_power', 'evcc_driveway_charge_power'), entry('sensor.renamed_soc', 'evcc_driveway_vehicle_soc'), entry('sensor.garage_soc', 'evcc_garage_vehicle_soc'), entry('sensor.second_soc', 'evcc_driveway_vehicle_soc', {config_entry_id: 'installation2'}), entry('sensor.effective_limit', 'evcc_driveway_effective_limit_soc'), entry('number.configured_limit', 'evcc_driveway_limit_soc')];
 const hass = {states: Object.fromEntries(registry.map(item => [item.entity_id, state(40, '%')]))};
 const resolved = resolveEvccEntities({entity: 'sensor.renamed_power'}, hass, registry);
 assert.equal(resolved.soc, 'sensor.renamed_soc');
 assert.equal(resolved.target_soc, 'sensor.effective_limit');
 assert.equal(resolved.power, 'sensor.renamed_power');
 assert.deepEqual(evccLoadpoints(hass, registry), ['sensor.renamed_power']);
});

test('default entity ids work without registry access and manual overrides take priority', () => {
 const hass = {states: {'sensor.evcc_driveway_charge_power': state(0, 'kW'), 'sensor.evcc_driveway_vehicle_soc': state(50, '%'), 'sensor.evcc_other_vehicle_soc': state(80, '%'), 'select.evcc_driveway_mode': state('pv')}};
 const config = normalizeEvccConfig({entity: 'sensor.evcc_driveway_charge_power', entities: {soc: 'sensor.my_car'}});
 const resolved = resolveEvccEntities(config, hass);
 assert.equal(resolved.soc, 'sensor.my_car'); assert.equal(resolved.mode, 'select.evcc_driveway_mode');
 assert.equal(resolved.range, undefined);
 assert.deepEqual(resolveEvccEntities(config,hass,[],{allowFallback:false}),{soc:'sensor.my_car',power:config.entity},'pending registry discovery must not guess controls');
 assert.equal(resolveEvccEntities({entity: 'sensor.unrelated'}, hass).soc, undefined);
 assert.throws(() => normalizeEvccConfig({image_entity: 'sensor.car'}), /image_entity/);
 assert.throws(() => normalizeEvccConfig({entities: {soc: '<script>'}}), /soc/);
 assert.throws(() => normalizeEvccConfig({entities: ['sensor.car']}), /entities/);
});

test('charging state never infers charging or disconnection from zero or unavailable power', () => {
 const entities = {connected: 'connected', charging: 'charging', power: 'power'};
 assert.equal(evccStatus(entities, {connected: state('on'), charging: state('off'), power: state(0)}), 'connected');
 assert.equal(evccStatus(entities, {connected: state('unavailable'), charging: state('unavailable'), power: state(0)}), 'unknown');
 assert.equal(evccStatus(entities, {connected: state('off'), charging: state('off')}), 'disconnected');
 assert.equal(evccStatus(entities, {charging: state('on')}), 'charging');
});

test('readings honor source units, negative prices, percentage bounds and Home Assistant time zone', () => {
 const hass = {language: 'nl', config: {time_zone: 'Europe/Amsterdam'}};
 assert.equal(formatEvccValue('power', state(7100, 'W'), hass), '7,1 kW');
 assert.equal(formatEvccValue('power', state(7.1, 'kW'), hass), '7,1 kW');
 assert.equal(formatEvccValue('session_price', state(-1.2, '€'), hass), '-1,20 €');
 assert.equal(formatEvccValue('session_price_per_kwh', state(.123, '€/kWh'), hass), '0,123 €/kWh');
 assert.equal(formatEvccValue('solar_percentage', state(101, '%'), hass), null);
 assert.equal(formatEvccValue('soc', state(50, '°C'), hass), null);
 assert.equal(formatEvccValue('remaining_duration', state(-1, 'min'), hass), null);
 const time = {state: '2026-10-21T10:00:00Z', attributes: {device_class: 'timestamp'}};
 assert.match(formatEvccValue('pv_remaining', time, hass), /12:00/);
 assert.equal(formatEvccValue('pv_remaining', {...time, state: '0001-01-01T00:00:00Z'}, hass), null);
});

test('placeholder car names are hidden and mode options use available select values', () => {
 for (const value of ['-None-', 'null', 'unknown', 'unavailable']) assert.equal(evccVehicleName({state:value}), null);
 assert.equal(evccVehicleName({state:'db:7', attributes:{vehicle:{name:'Mijn auto'}}}), 'Mijn auto');
 assert.deepEqual(evccModeOptions({state:'pv',attributes:{options:['off','pv',null]}}), ['off','pv']);
 assert.deepEqual(evccModeOptions({state:'unavailable',attributes:{options:['off']}}), []);
});

test('obsolete planning configuration is removed without affecting charging mode or session readings', () => {
 const input = {show_plan:true,schedule_script:'script.old_helper',vehicle_id:'db:7',config_entry_id:'old',entities:{plan_time:'sensor.old_plan',plan_soc:'sensor.old_target',plan_start:'sensor.old_start',plan_end:'sensor.old_end',soc:'sensor.battery'}};
 const config = normalizeEvccConfig(input);
 for (const key of ['show_plan','schedule_script','vehicle_id','config_entry_id']) assert.equal(key in config, false);
 assert.deepEqual(config.entities,{soc:'sensor.battery'});
 assert.equal(config.show_controls,true);
 assert.equal(input.entities.plan_time,'sensor.old_plan');
});

test('card and editor share registry requests; failed reads recover on the next attempt', async () => {
 let calls = 0;
 const hass = {connection: {}, callWS: async () => { calls++; return []; }};
 await Promise.all([loadEvccRegistry(hass), loadEvccRegistry(hass)]); assert.equal(calls, 1);
 const other = {connection: {}, callWS: async () => { calls++; throw Error('Unavailable'); }};
 await loadEvccRegistry(other); await loadEvccRegistry(other); assert.equal(calls, 3);
});

test('durations honor the entity unit and do not guess unknown units', () => {
 for (const [state, unit] of [['5400', 's'], ['90', 'min'], ['1.5', 'h'], ['5400000', 'ms']]) {
  assert.equal(evccDuration({state, attributes: {unit_of_measurement: unit}}, 'nl'), '1 u 30 min');
 }
 assert.equal(evccDuration({state: '-1', attributes: {unit_of_measurement: 's'}}), null);
 assert.equal(evccDuration({state: '100', attributes: {}}), null);
});

test('image entity pictures retain their token and reject executable URLs', () => {
 const entity = {state: '2026-10-21T10:00:00Z', attributes: {entity_picture: '/api/image_proxy/image.car?token=test'}};
 assert.equal(evccImageUrl(entity, {hassUrl: path => 'https://ha.example' + path}), 'https://ha.example/api/image_proxy/image.car?token=test');
 assert.equal(evccImageUrl({...entity, state: 'unavailable'}), null);
 for (const picture of ['javascript:alert(1)', '//external.test/car', 'data:image/svg+xml,test', '']) assert.equal(evccImageUrl({...entity, attributes: {entity_picture: picture}}), null);
});

test('plan status resolves only the selected loadpoint and never uses the alternative plan flag', () => {
 const config={entity:'sensor.evcc_oprit_charge_power',entities:{}};
 const states={'sensor.evcc_oprit_charge_power':{state:'5',attributes:{unit_of_measurement:'kW'}},'binary_sensor.evcc_oprit_plan_active_alt':{state:'on'},'binary_sensor.evcc_garage_plan_active':{state:'on'}};
 assert.equal(resolveEvccEntities(config,{states}).plan_active,undefined);
 states['binary_sensor.evcc_oprit_plan_active']={state:'on'};
 assert.equal(resolveEvccEntities(config,{states}).plan_active,'binary_sensor.evcc_oprit_plan_active');
 assert.equal(formatEvccValue('plan_active',{state:'on'},{language:'nl'}),'Ja');
});
