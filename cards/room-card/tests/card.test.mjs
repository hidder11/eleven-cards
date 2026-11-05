import test from 'node:test';import assert from 'node:assert/strict';
globalThis.HTMLElement=class extends EventTarget{};
globalThis.CustomEvent=class extends Event {constructor(name,options){super(name,options);this.detail=options.detail;}};
const {RoomCard}=await import('../src/room-card.js').catch(()=>({}));
test('native editor bevat alle instellingen en ruimtebediening opent alleen more-info',()=>{
 assert.ok(RoomCard,'RoomCard ontbreekt');
 const names=RoomCard.getConfigForm().schema.map(x=>x.name);
 for(const n of ['name','icon','scenes','lights','temperature_entity','humidity_entity','navigation_path','note'])assert.ok(names.includes(n));
 const target=new EventTarget();let event;target.addEventListener('hass-more-info',e=>event=e);
 RoomCard.prototype._moreInfo.call(target,'light.a');assert.equal(event.detail.entityId,'light.a');assert.equal(event.bubbles,true);assert.equal(event.composed,true);
 assert.equal(RoomCard.prototype.getGridOptions().columns,6);
});

test('scene activation sends one configured request and guards pending/missing/offline scenes',async()=>{
 let complete;const calls=[];
 const target={_config:{scenes:['scene.evening']},_hass:{connected:true,states:{'scene.evening':{state:'unknown'}},callService:(...args)=>{calls.push(args);return new Promise(resolve=>complete=resolve);}},shadowRoot:{activeElement:null,querySelectorAll:()=>[]},_render(){}};
 const run=entity=>RoomCard.prototype._activateScene.call(target,entity);
 const first=run('scene.evening');assert.equal(target._scenePending,true);await run('scene.evening');await run('scene.other');assert.deepEqual(calls,[['scene','turn_on',{entity_id:'scene.evening'}]]);complete();await first;assert.equal(target._scenePending,false);
 target._hass.connected=false;await run('scene.evening');target._hass.connected=true;target._hass.states['scene.evening'].state='unavailable';await run('scene.evening');delete target._hass.states['scene.evening'];await run('scene.evening');assert.equal(calls.length,1);
});

test('failed scene requests reset pending state and can be retried',async()=>{
 const target={_config:{scenes:['scene.evening']},_hass:{states:{'scene.evening':{state:'unknown'}},callService:async()=>{throw Error('offline');}},shadowRoot:{activeElement:null,querySelectorAll:()=>[]},_render(){}};
 await RoomCard.prototype._activateScene.call(target,'scene.evening');assert.equal(target._sceneError,true);assert.equal(target._scenePending,false);
 target._hass.callService=async()=>{};await RoomCard.prototype._activateScene.call(target,'scene.evening');assert.equal(target._sceneError,false);
});
