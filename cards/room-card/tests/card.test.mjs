import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('waarschuwingstekst behoudt themacontrast; alleen het icoon krijgt waarschuwingskleur',()=>{
 const source=readFileSync(new URL('../src/room-card.js',import.meta.url),'utf8');
 assert.match(source,/\.status\.warning\{color:var\(--primary-text-color\)\}/);
});
globalThis.HTMLElement=class extends EventTarget{};
globalThis.CustomEvent=class extends Event {constructor(name,options){super(name,options);this.detail=options.detail;}};
const {RoomCard}=await import('../src/room-card.js').catch(()=>({}));
test('native editor bevat alle instellingen en ruimtebediening opent alleen more-info',()=>{
 assert.ok(RoomCard,'RoomCard ontbreekt');
 const names=RoomCard.getConfigForm().schema.map(x=>x.name);
 for(const n of ['name','icon','lights','temperature_entity','navigation_path','note'])assert.ok(names.includes(n));
 const target=new EventTarget();let event;target.addEventListener('hass-more-info',e=>event=e);
 RoomCard.prototype._moreInfo.call(target,'light.a');assert.equal(event.detail.entityId,'light.a');assert.equal(event.bubbles,true);assert.equal(event.composed,true);
 assert.equal(RoomCard.prototype.getGridOptions().columns,6);
});
