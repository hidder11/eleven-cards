import test from 'node:test';
import assert from 'node:assert/strict';
import {powerMotion} from '../cards/car-card/src/evcc/evcc-gallery.js';
test('EVCC motion requires valid positive measured charging power',()=>{
 assert.deepEqual(powerMotion({state:'7100',attributes:{unit_of_measurement:'W'}}),{kw:7.1,seconds:12-10*7.1/11,moving:true});
 for(const state of ['0','unavailable','unknown'])assert.equal(powerMotion({state,attributes:{unit_of_measurement:'W'}}).moving,false);
});
