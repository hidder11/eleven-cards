import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCarConfig} from '../cards/car-card/src/car-utils.js';
import {normalizeWeatherConfig} from '../cards/weather-card/src/weather-utils.js';
import {normalizeEvccConfig} from '../cards/car-card/src/evcc/evcc-utils.js';
import {normalizeEnergyFlowConfig} from '../cards/energy-flow-card/src/energy-flow-data.js';
import {normalizeCalendarConfig} from '../cards/calendar-card/src/calendar-utils.js';
import {energyFlowMetrics} from '../cards/energy-flow-card/src/energy-flow-metrics.js';

for(const [name,normalize] of Object.entries({car:normalizeCarConfig,weather:normalizeWeatherConfig,evcc:normalizeEvccConfig,energy:normalizeEnergyFlowConfig})){
 test(name+': background intensity preserves zero, clamps and defaults safely',()=>{
  assert.equal(normalize({}).background_strength,100);
  for(const [input,expected] of [[0,0],[35,35],[150,100],[-5,0],['invalid',100]])assert.equal(normalize({background_strength:input}).background_strength,expected);
 });
 test(name+': compact alias keeps explicit compact precedence',()=>{
  assert.equal(normalize({density:'compact'}).compact,true);
  assert.equal(normalize({density:'compact',compact:false}).compact,false);
  assert.equal(normalize({density:'expanded',compact:true}).compact,true);
 });
}
test('calendar accepts both density and compact without persisting conflicting aliases',()=>{
 const base={entities:['calendar.home']};
 const config=normalizeCalendarConfig({...base,compact:true});
 assert.equal(config.density,'compact');
 assert.equal(config.compact,undefined);
 assert.equal(normalizeCalendarConfig({...config,density:'expanded'}).density,'expanded');
 assert.equal(normalizeCalendarConfig({...config,compact:false}).density,'expanded');
 assert.throws(()=>normalizeCalendarConfig({...base,compact:'true'}));
});
test('all energy field visibility combinations omit empty lower grids',()=>{
 for(let mask=0;mask<8;mask++){
  const fields=Object.fromEntries([1,2,3].map((i)=>['show_field_'+i,!!(mask&(1<<(i-1)))]));
  const {solar,grid}=energyFlowMetrics({solar:0,import:1,export:2},false,true,String,false,fields);
  assert.equal(!!solar,!!(mask&1));
  assert.equal(!!grid,!!(mask&6));
  assert.equal((grid.match(/data-ui-metric=/g)||[]).length,Number(!!(mask&2))+Number(!!(mask&4)));
  if(grid)assert.ok(grid.includes('--ui-metric-columns:'+((mask&6)===6?2:1)));
 }
});
test('energy synchronization is opt-in, validates settings and supports the existing group alias',()=>{
 assert.equal(normalizeEnergyFlowConfig({}).sync_timeframe,false);
 assert.equal(normalizeEnergyFlowConfig({sync_timeframe:true,timeframe_sync_group:' home '}).hover_sync_group,'home');
 assert.equal(normalizeEnergyFlowConfig({hover_sync_group:'first',timeframe_sync_group:'other'}).hover_sync_group,'first');
 assert.throws(()=>normalizeEnergyFlowConfig({sync_timeframe:'true'}));
 assert.throws(()=>normalizeEnergyFlowConfig({hover_sync_group:4}));
 for(let i=1;i<=3;i++)assert.throws(()=>normalizeEnergyFlowConfig({['show_field_'+i]:'false'}));
});
