import test from 'node:test';
import assert from 'node:assert/strict';
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
