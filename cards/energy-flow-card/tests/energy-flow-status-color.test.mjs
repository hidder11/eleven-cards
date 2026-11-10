import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFlowStatusColor} from '../src/energy-flow-data.js';

test('the three approved live situations have distinct light and dark background colours',()=>{
 const cases=[
  [{solar:0,home:1.8,import:1.8,export:0},'#287edb','#70b7ff'],
  [{solar:.5,home:1.8,import:1.3,export:0},'#c58a12','#ffd45c'],
  [{solar:3.1,home:1.8,import:0,export:1.3},'#218457','#72d6a0']
 ];
 for(const [data,light,dark] of cases){assert.equal(energyFlowStatusColor(data),light);assert.equal(energyFlowStatusColor(data,true),dark);}
});

test('historical and multi-connection totals use the net grid balance for the displayed period',()=>{
 assert.equal(energyFlowStatusColor({solar:8,home:10,import:5,export:3}),'#c58a12');
 assert.equal(energyFlowStatusColor({solar:12,home:10,import:3,export:5}),'#218457');
 assert.equal(energyFlowStatusColor({solar:4,home:8,import:8,export:4}),'#287edb','solar that is all exported is not home solar use');
});

test('missing, invalid, idle, balanced and unattributable solar readings stay neutral',()=>{
 const base={solar:3,home:2,import:0,export:1};
 for(const data of [null,{},...['solar','home','import','export'].flatMap(key=>[null,NaN,Infinity,-1,'2'].map(value=>({...base,[key]:value}))),
  {solar:0,home:0,import:0,export:0},{solar:2,home:2,import:0,export:0},{solar:3,home:3,import:1,export:1},
  {...base,battery:true},{solar:3,home:0,import:0,export:3}]){
  assert.equal(energyFlowStatusColor(data),'#656975');assert.equal(energyFlowStatusColor(data,true),'#a7a9b2');
 }
 assert.equal(energyFlowStatusColor({solar:0,home:2,import:1,export:0,battery:true}),'#287edb');
});
