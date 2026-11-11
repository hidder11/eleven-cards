import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowGeometry,layoutEnergyFlowDiagram} from '../src/energy-flow-diagram.js';

test('flow segments meet endpoint edges and return at endpoint centres at every width',()=>{
 for(const [width,size] of [[286,60],[326,72],[606,72],[966,72]])for(const top of [48,56]){
  const geometry=energyFlowGeometry(width,size,top),middle=width/2;
  assert.deepEqual(geometry.solar,[size,middle-size/2]);
  assert.deepEqual(geometry.grid,[middle+size/2,width-size]);
  assert.match(geometry.paths.solar,new RegExp(`^M${size} ${top+size/2}H`));
  assert.ok(geometry.paths.return.startsWith(`M${size/2} ${top}V16`));
  assert.ok(geometry.paths.return.endsWith(` ${width-size/2} 16V${top}`));
  assert.equal(geometry.height,top+8+size);
 }
});
test('hidden or unrendered flow diagrams do not need a measurable SVG',()=>{
 assert.doesNotThrow(()=>layoutEnergyFlowDiagram({querySelector:()=>null}));
 assert.doesNotThrow(()=>layoutEnergyFlowDiagram({querySelector:()=>({clientWidth:0,querySelector:()=>({})})}));
});
