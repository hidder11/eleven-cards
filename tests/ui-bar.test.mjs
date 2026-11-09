import test from 'node:test';
import assert from 'node:assert/strict';
import {uiBar,uiSlider,syncUISlider} from '../shared/ui-bar.js';

test('bars clamp finite measurements, preserve zero and distinguish missing values',()=>{
 for(const [value,expected] of [[-1,0],[0,0],[62,62],[120,100]]){
  const html=uiBar({value});assert.ok(html.includes(`width:${expected}%`));assert.ok(html.includes(`aria-valuenow="${expected}"`));
 }
 for(const value of [null,undefined,NaN,Infinity,'62; color:red']){
  const html=uiBar({value,charging:true});assert.ok(html.includes('data-unavailable="true"'));assert.ok(!html.includes('aria-valuenow'));assert.ok(!html.includes('ui-bar-motion'));
 }
});
test('setpoints and measurements share the real numeric domain',()=>{
 const html=uiBar({value:5,min:-10,max:10,target:8});
 assert.ok(html.includes('width:75%'));assert.ok(html.includes('left:90%'));assert.ok(html.includes('aria-valuenow="5"'));
 assert.ok(uiBar({value:0,target:200}).includes('left:100%'));
 assert.ok(uiBar({value:0,target:-2}).includes('left:0%'));
 assert.ok(!uiBar({value:1,target:NaN}).includes('ui-bar-marker'));
});
test('charging motion stops at the target, full battery or non-charging state',()=>{
 assert.ok(uiBar({value:62,target:80,charging:true}).includes('ui-bar-motion'));
 for(const options of [{value:80,target:80,charging:true},{value:90,target:80,charging:true},{value:100,charging:true},{value:62,charging:false}])assert.ok(!uiBar(options).includes('ui-bar-motion'));
});
test('bar and slider labels are escaped and event attributes are rejected',()=>{
 const html=uiBar({value:62,label:'<Accu>',valueText:'62% "laden"',attrs:{'data-entity':'sensor."x'}});
 assert.ok(html.includes('&lt;Accu&gt;'));assert.ok(html.includes('&quot;laden&quot;'));assert.ok(!html.includes('<Accu>'));
 assert.throws(()=>uiSlider({attrs:{onclick:'unsafe'}}),/Invalid UI attribute/);
 assert.throws(()=>uiBar({attrs:{onmouseover:'unsafe'}}),/Invalid UI attribute/);
 assert.ok(uiBar({value:50,decorative:true}).includes('aria-hidden="true"'));
});
test('native sliders retain limits, fractional steps, focus attributes and disabled state',()=>{
 const html=uiSlider({value:15,min:10,max:30,step:.5,disabled:true,attrs:{id:'solar-share','data-key':'test','aria-label':'Solar'}});
 for(const fragment of ['type="range"','min="10"','max="30"','step="0.5"','value="15"','--ui-bar-position:25%',' disabled','data-key="test"'])assert.ok(html.includes(fragment),fragment);
 assert.ok(uiSlider({value:100,min:0,max:50}).includes('value="50"'));
 assert.ok(uiSlider({value:NaN}).includes('value="0"'));
});
test('slider paint updates independently without sending device commands',()=>{
 let paint;const input={min:'20',max:'80',value:'50',style:{setProperty:(name,value)=>{assert.equal(name,'--ui-bar-position');paint=value;}}};
 syncUISlider(input);assert.equal(paint,'50%');input.value='0';syncUISlider(input);assert.equal(paint,'0%');
 input.max='20';syncUISlider(input);assert.equal(paint,'0%');input.value='unavailable';syncUISlider(input);assert.equal(paint,'0%');
});
