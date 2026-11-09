import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('room title matches the collection heading size and weight in source and standalone',()=>{
 for(const path of ['../src/room-card.js','../dist/eleven-room-card.js']){
  const css=readFileSync(new URL(path,import.meta.url),'utf8').match(/\.name\{([^}]+)\}/)?.[1];
  assert.ok(css,`${path}: room title rule exists`);
  assert.match(css,/(?:^|;)font-size:16px(?:;|$)/,path);
  assert.match(css,/(?:^|;)font-weight:600(?:;|$)/,path);
 }
});
const mod = await import('../src/room-utils.js').catch(()=>({}));
test('config weigert externe navigatie en niet-lampen; temperatuur respecteert eenheid en ontbrekende data',()=>{
 assert.equal(typeof mod.normalizeRoom,'function');
 assert.throws(()=>mod.normalizeRoom({name:'Test',navigation_path:'https://example.org'}));
 assert.throws(()=>mod.normalizeRoom({name:'Test',lights:['switch.x']}));
 assert.deepEqual(mod.normalizeRoom({name:'Test',lights:['light.a','light.a']} ).lights,['light.a']);
 assert.equal(mod.temperatureText(undefined),'');
 assert.equal(mod.temperatureText({state:'unavailable',attributes:{unit_of_measurement:'°C'}}),'');
 assert.equal(mod.temperatureText({state:'20.8',attributes:{unit_of_measurement:'°C'}}),'20,8 °C');
});
test('ruimte vat alleen expliciete unieke lampen samen en verbergt geen uitval',()=>{
 assert.equal(typeof mod.roomStatus,'function','roomStatus ontbreekt');
 const states={'light.a':{state:'on'},'light.b':{state:'off'},'light.c':{state:'unavailable'}};
 assert.deepEqual(mod.roomStatus(['light.a','light.a','light.b','light.c','light.missing'],states),{total:4,on:1,unavailable:2,label:'1 aan · 2 niet beschikbaar'});
 assert.equal(mod.roomStatus([],states).label,'Nog niet gekoppeld');
 assert.equal(mod.roomStatus(['light.b'],states).label,'Licht uit');
 assert.equal(mod.roomStatus(['light.c'],states).label,'1 niet beschikbaar');
});

test('optional scenes preserve order, deduplicate and reject invalid entities',()=>{
 assert.deepEqual(mod.normalizeRoom({name:'Kamer'}).scenes,[]);
 assert.deepEqual(mod.normalizeRoom({name:'Kamer',scenes:['scene.evening','scene.movie','scene.evening']}).scenes,['scene.evening','scene.movie']);
 for(const scenes of ['scene.evening',['light.living'],[{}],['scene.bad" onclick="test']])assert.throws(()=>mod.normalizeRoom({name:'Kamer',scenes}));
});

test('humidity is optional, localized, preserves zero and hides invalid measurements',()=>{
 assert.equal(mod.humidityText({state:'46.5'}),'46,5 %');
 assert.equal(mod.humidityText({state:'46.5'},'en-US'),'46.5 %');
 assert.equal(mod.humidityText({state:'0'}),'0 %');
 assert.equal(mod.humidityText({state:'100'}),'100 %');
 for(const state of [undefined,{state:null},...['',' ','unknown','unavailable','NaN','-1','101'].map(state=>({state}))])assert.equal(mod.humidityText(state),'');
});
