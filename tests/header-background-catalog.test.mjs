import test from 'node:test';
import assert from 'node:assert/strict';
import {HEADER_BACKGROUNDS,headerBackgroundOptions} from '../shared/header-backgrounds.js';
import {normalizeCarConfig} from '../cards/car-card/src/car-utils.js';
import {normalizeWeatherConfig} from '../cards/weather-card/src/weather-utils.js';
import {normalizeEnergyFlowConfig} from '../cards/energy-flow-card/src/energy-flow-data.js';
import {headerAtmosphere} from '../shared/header-atmosphere.js';

test('Car, Weather and Energy accept the complete shared background catalog without changing YAML IDs',()=>{
 assert.equal(new Set(HEADER_BACKGROUNDS.map(item=>item.value)).size,HEADER_BACKGROUNDS.length);
 for(const {value} of HEADER_BACKGROUNDS){
  assert.equal(normalizeCarConfig({background:value}).background,value);
  assert.equal(normalizeWeatherConfig({entity:'weather.test',background:value}).background,value);
  assert.equal(normalizeEnergyFlowConfig({background:value}).background,value);
 }
 for(const value of ['hologram','ink','terrain'])assert.ok(headerAtmosphere(value).includes('class="header-pattern"'));
 assert.equal(headerAtmosphere('invalid'), '');
});

test('shared editor labels expose localized motion names and preserve underlying background values',()=>{
 for(const nl of [true,false]){
  const options=headerBackgroundOptions(nl);
  assert.deepEqual(options.map(item=>item.value),HEADER_BACKGROUNDS.map(item=>item.value));
  for(const item of HEADER_BACKGROUNDS)assert.ok(options.find(option=>option.value===item.value).label.endsWith(nl?(item.animated?'Geanimeerd':'Statisch'):(item.animated?'Animated':'Static')));
 }
});
