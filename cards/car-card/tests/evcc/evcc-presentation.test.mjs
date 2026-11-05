import test from 'node:test';
import assert from 'node:assert/strict';
import {evccChargingView, evccFinishTime, evccEnergySplit, evccPvSeconds} from '../../src/evcc/evcc-presentation.js';

const sensor = (state, unit, extra = {}) => ({state: String(state), attributes: {unit_of_measurement: unit, ...extra}});
const now = Date.parse('2026-10-21T10:00:00Z');
const entities = Object.fromEntries(['connected','charging','enabled','soc','target_soc','mode','pv_action','pv_remaining','smart_cost_active','plan_active'].map(key => [key,key]));
const states = {connected:sensor('on'),charging:sensor('off'),enabled:sensor('off'),soc:sensor(62,'%'),target_soc:sensor(80,'%'),mode:sensor('pv')};
const view = (changes = {}, options = {}) => evccChargingView(entities, {...states,...changes}, {now,...options});
test('explicit status distinguishes solar waiting, charging, completion and unavailable data', () => {
 assert.equal(view().kind, 'waiting');
 assert.equal(view({charging:sensor('on')}).kind,'solar');
 assert.equal(view({soc:sensor(80,'%')}).kind,'done');
 assert.equal(view({connected:sensor('off')}).kind,'disconnected');
 assert.equal(view({connected:sensor('unavailable'),charging:sensor('unavailable')}).kind,'unknown');
 assert.equal(view({}, {offline:true}).kind,'unknown');
 assert.equal(view({mode:sensor('off')}).kind,'connected');
 assert.equal(view({smart_cost_active:sensor('on')}).title,'Waiting to charge');
 assert.doesNotMatch(view({smart_cost_active:sensor('on')}).reason,/tariff|solar/);
});
test('PV timestamps count down and contradictory stale actions do not override charging state', () => {
 const deadline = sensor('2026-10-21T10:01:05Z',undefined,{device_class:'timestamp'});
 assert.equal(evccPvSeconds(deadline,now),65);
 assert.equal(evccPvSeconds(deadline,now+66000),0);
 assert.equal(evccPvSeconds(sensor('unavailable'),now),null);
 assert.equal(view({pv_action:sensor('enable'),pv_remaining:deadline}).reason,'Starts in 1:05');
 assert.equal(view({pv_action:sensor('enable'),pv_remaining:deadline,charging:sensor('on')}).title,'Charging');
 assert.equal(view({pv_action:sensor('disable'),pv_remaining:deadline}).kind,'waiting');
 assert.equal(view({pv_action:sensor('disable'),pv_remaining:deadline,charging:sensor('on')}).reason,'Stops in 1:05');
});
test('finish estimate uses observation timestamp and HA timezone only while actively charging', () => {
 const duration = {...sensor(90,'min'),last_updated:'2026-10-21T10:00:00Z'};
 const hass = {language:'en-GB',config:{time_zone:'Europe/Amsterdam'}};
 assert.equal(evccFinishTime(duration,view({charging:sensor('on')}),hass,now,now),'13:30');
 assert.equal(evccFinishTime(duration,view(),hass,now,now),null);
 assert.equal(evccFinishTime(duration,view({charging:sensor('on')}),hass,now,now+5400001),null);
 assert.equal(evccFinishTime(sensor(90,'unknown'),view({charging:sensor('on')}),hass,now,now),null);
});
test('session energy split respects units, known zero and missing readings', () => {
 assert.deepEqual(evccEnergySplit(sensor(12000,'Wh'),sensor(75,'%')),{solar:9,other:3});
 assert.deepEqual(evccEnergySplit(sensor(12,'kWh'),sensor(0,'%')),{solar:0,other:12});
 assert.equal(evccEnergySplit(sensor(12,'MWh'),sensor(75,'%')),null);
 assert.equal(evccEnergySplit(sensor(12,'kWh'),sensor('unavailable','%')),null);
});

test('charging plans require an explicit active signal and actual charging', () => {
 for(const mode of ['pv','minpv','now','smart']) {
  for(const state of ['off','unknown','unavailable']) assert.equal(view({charging:sensor('on'),mode:sensor(mode),plan_active:sensor(state)}).tone,'charging');
  assert.equal(view({charging:sensor('on'),mode:sensor(mode)}).title,'Charging');
  const planned=view({charging:sensor('on'),mode:sensor(mode),plan_active:sensor('on')},{dutch:true});
  assert.equal(planned.title,'Laden');assert.equal(planned.reason,'Volgens laadplanning');assert.equal(planned.tone,'planned');
 }
 assert.equal(view({charging:sensor('on'),plan_active:sensor('on'),pv_action:sensor('disable'),pv_remaining:sensor(60,'s')}).tone,'planned');
 assert.notEqual(view({plan_active:sensor('on')}).tone,'planned');
 assert.equal(view({plan_active:sensor('on'),connected:sensor('off')}).kind,'disconnected');
 assert.equal(view({charging:sensor('on'),plan_active:sensor('on')},{offline:true}).kind,'unknown');
});

test('waiting is distinct from Off and never guesses a reason from charge permission or cost activity', () => {
 for(const mode of ['smart','now','pv','minpv'])for(const enabled of ['on','off','unavailable']) {
  const waiting=view({mode:sensor(mode),enabled:sensor(enabled),smart_cost_active:sensor('on')},{dutch:true});
  assert.equal(waiting.title,'Wachten op laden');assert.equal(waiting.tone,'waiting');
  assert.doesNotMatch(waiting.reason,/tarief|zon/);
 }
 assert.equal(view({mode:sensor('off')}).tone,'off');
 assert.equal(view({mode:sensor('off'),charging:sensor('on')}).tone,'charging');
 assert.equal(view({soc:sensor(80,'%')}).tone,'done');
 assert.notEqual(view({soc:sensor('unavailable','%')}).tone,'done');
 assert.notEqual(view({target_soc:sensor('unavailable','%')}).tone,'done');
});
