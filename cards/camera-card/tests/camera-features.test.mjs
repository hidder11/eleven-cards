import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCameraConfig} from '../src/camera-utils.js';
import {CAMERA_LAYOUTS,effectiveCameraConfig,cameraPrivacy,CameraActivity,cameraHistoryEvents,cameraActionRequest} from '../src/camera-features.js';
import {CameraSnapshot} from '../src/camera-snapshot.js';

const config=extra=>normalizeCameraConfig({cameras:[{entity:'camera.front',motion_entity:'binary_sensor.motion',person_entity:'binary_sensor.person'},'camera.garden'],...extra});
test('contact activity records opening and closing, excluding initial states, repeated states and reconnect baselines',()=>{
 const c=config({door_sensors:['binary_sensor.door'],window_sensors:['binary_sensor.window']}),tracker=new CameraActivity(),now=Date.now();
 const states={'binary_sensor.door':{state:'off',last_changed:new Date(now-3000).toISOString()},'binary_sensor.window':{state:'on',last_changed:new Date(now-3000).toISOString()}};
 assert.deepEqual(tracker.ingest(c,{states},now),[]);
 states['binary_sensor.door']={state:'on',last_changed:new Date(now-2000).toISOString()};
 let events=tracker.ingest(c,{states},now);assert.equal(events.length,1);assert.equal(events[0].kind,'door');assert.equal(events[0].state,'on');assert.equal(events[0].camera,'');
 states['binary_sensor.door']={state:'on',last_changed:new Date(now-1500).toISOString()};assert.deepEqual(tracker.ingest(c,{states},now),[]);
 states['binary_sensor.door']={state:'off',last_changed:new Date(now-1000).toISOString()};states['binary_sensor.window']={state:'off',last_changed:new Date(now-1000).toISOString()};
 events=tracker.ingest(c,{states},now);assert.equal(events.length,2);assert.ok(events.every(event=>event.state==='off'));
 tracker.ingest(c,{connected:false,states},now);assert.deepEqual(tracker.ingest(c,{states},now),[]);
 states['binary_sensor.window']={state:'unavailable'};tracker.ingest(c,{states},now);states['binary_sensor.window']={state:'on',last_changed:new Date(now).toISOString()};assert.deepEqual(tracker.ingest(c,{states},now),[]);
});
test('contact Recorder history includes open and closed transitions, rejecting old and unavailable readings',()=>{
 const c=config({door_sensors:['binary_sensor.door']}),now=Date.now(),start=now-3000;
 const events=cameraHistoryEvents([[{entity_id:'binary_sensor.door',state:'off',last_changed:new Date(start-1000).toISOString()},{state:'on',last_changed:new Date(now-2000).toISOString()},{state:'off',last_changed:new Date(now-1000).toISOString()},{state:'unavailable',last_changed:new Date(now).toISOString()}]],c,start,now);
 assert.equal(events.length,2);assert.deepEqual(events.map(event=>event.state),['off','on']);assert.ok(events.every(event=>event.kind==='door'));
});
test('advanced configuration validates mappings, all layouts, bounded durations and inherited snapshot intervals',()=>{
 for(const layout of CAMERA_LAYOUTS)assert.equal(config({layout}).layout,layout);
 const c=config({doorbell_entity:'event.doorbell',doorbell_camera:'camera.front',doorbell_secondary_camera:'camera.other',alarm_entity:'switch.alarm',door_sensors:['binary_sensor.door','binary_sensor.door','sensor.bad'],window_sensors:[{entity:'binary_sensor.window',name:'Window'}],focus_duration:0,activity_limit:500,snapshot_interval:-1});
 assert.equal(c.doorbell_entity,'event.doorbell');assert.equal(c.doorbell_secondary_camera,'');assert.equal(c.alarm_entity,'');assert.equal(c.door_sensors.length,1);assert.equal(c.window_sensors[0].name,'Window');assert.equal(c.focus_duration,5);assert.equal(c.activity_page_size,50);assert.equal(c.snapshot_interval,0);
});
test('profiles preserve base configuration, filter visible cameras and support automatic and manual selection',()=>{
 const c=config({layout:'grid',profiles:[{id:'night',name:'Night',entity:'input_select.mode',state:'night',cameras:['camera.garden'],layout:'sidebar',auto_cycle:false},{id:'away',layout:'wall'}]});
 const hass={states:{'input_select.mode':{state:'night'}}},result=effectiveCameraConfig(c,hass);
 assert.equal(result.profile.id,'night');assert.equal(result.config.layout,'sidebar');assert.equal(result.config.cameras[0].show,false);assert.equal(result.config.default_camera,'camera.garden');assert.equal(c.cameras[0].show,undefined);assert.equal(c.layout,'grid');
 assert.equal(effectiveCameraConfig(c,hass,'base').config,c);assert.equal(effectiveCameraConfig(c,hass,'away').config.layout,'wall');assert.equal(effectiveCameraConfig(c,{states:{}}).profile,null);
});
test('privacy fails closed for missing, unavailable and offline states, supports inverted switches',()=>{
 const row={privacy_entity:'switch.privacy'};
 assert.equal(cameraPrivacy({states:{'switch.privacy':{state:'on'}}},row),'privacy');assert.equal(cameraPrivacy({states:{'switch.privacy':{state:'off'}}},row),null);
 assert.equal(cameraPrivacy({states:{}},row),'privacy_unknown');assert.equal(cameraPrivacy({connected:false,states:{'switch.privacy':{state:'off'}}},row),'privacy_unknown');assert.equal(cameraPrivacy({states:{'switch.privacy':{state:'off'}}},{...row,privacy_state:'off'}),'privacy');
 assert.equal(cameraPrivacy({},{}),null);
});
test('activity establishes a baseline, deduplicates updates and never alerts on reconnect',()=>{
 const c=config(),tracker=new CameraActivity(),now=Date.now(),states={'binary_sensor.motion':{state:'off',last_changed:new Date(now-1000).toISOString()}};
 assert.deepEqual(tracker.ingest(c,{states},now),[]);
 states['binary_sensor.motion']={state:'on',last_changed:new Date(now).toISOString()};assert.equal(tracker.ingest(c,{states},now).length,1);assert.equal(tracker.ingest(c,{states},now).length,0);assert.equal(tracker.events.length,1);
 tracker.ingest(c,{connected:false,states},now);assert.equal(tracker.ingest(c,{states},now).length,0);
 states['binary_sensor.motion']={state:'unknown'};tracker.ingest(c,{states},now);states['binary_sensor.motion']={state:'on',last_changed:new Date(now).toISOString()};assert.equal(tracker.ingest(c,{states},now).length,0);assert.equal(tracker.observed.length,1);
});
test('timestamp doorbell entities support repeated rings; binary doorbells require a new ON',()=>{
 const now=Date.now(),tracker=new CameraActivity(),c=config({doorbell_entity:'event.ring',doorbell_camera:'camera.front'}),hass={states:{'event.ring':{state:new Date(now-1000).toISOString()}}};
 tracker.ingest(c,hass,now);hass.states['event.ring'].state=new Date(now).toISOString();const [event]=tracker.ingest(c,hass,now);assert.equal(event.kind,'doorbell');assert.equal(event.camera,'camera.front');
 assert.equal(tracker.ingest(c,hass,now).length,0);
});
test('history parses minimal responses, ignores initial old ON states and unknown values, merges without duplicates',()=>{
 const now=Date.now(),start=now-3600000,c=config(),time=new Date(now-1000).toISOString();
 const events=cameraHistoryEvents([[{entity_id:'binary_sensor.motion',state:'on',last_changed:new Date(start-1000).toISOString()},{state:'off',last_changed:time},{state:'on',last_changed:time},{state:'unknown',last_changed:time}]],c,start,now);
 assert.equal(events.length,1);assert.equal(events[0].entity,'binary_sensor.motion');const tracker=new CameraActivity();tracker.merge(events);tracker.merge(events);assert.equal(tracker.events.length,1);
 assert.equal(tracker.observed.length,0);
});
test('custom controls resolve only configured HA actions with existing services and retain data/targets',()=>{
 const hass={states:{'light.outside':{state:'off'},'script.gate':{state:'off'}},services:{light:{turn_on:{}},script:{turn_on:{}}}};
 assert.deepEqual(cameraActionRequest({entity:'light.outside',action:'turn_on',data:{brightness:100}},hass),{domain:'light',service:'turn_on',data:{brightness:100},target:{entity_id:'light.outside'}});
 assert.equal(cameraActionRequest({entity:'script.gate',action:'run'},hass).service,'turn_on');assert.deepEqual(cameraActionRequest({entity:'alarm_control_panel.home',action:'more-info'},hass),{entity:'alarm_control_panel.home'});
 assert.throws(()=>cameraActionRequest({entity:'light.outside',action:'turn_off'},hass));assert.throws(()=>cameraActionRequest({entity:'camera.front',action:'toggle'},hass));
});

const tick=()=>new Promise(resolve=>setImmediate(resolve));
function snapshotFixture(api){
 const images=[],revoked=[],scheduled=[],cancelled=[],statuses=[],loaded=[],container={replaceChildren(button){this.child=button;}};
 const snapshot=new CameraSnapshot(container,state=>statuses.push(state),time=>loaded.push(time),{image:()=>{const image={style:{},set src(value){this.url=value;images.push(this);}};return image;},url:{createObjectURL:()=> 'blob:test-'+images.length,revokeObjectURL:value=>revoked.push(value)},schedule:(callback,delay)=>{scheduled.push({callback,delay});return scheduled.length;},cancel:id=>cancelled.push(id)});
 return {snapshot,images,revoked,scheduled,cancelled,statuses,loaded,container,hass:{callApiRaw:api}};
}
test('managed snapshots abort hidden requests and revoke stale blobs without attaching private images',async()=>{
 let resolve;const f=snapshotFixture(()=>new Promise(done=>resolve=done));f.snapshot.update(f.hass,'camera.front',{interval:10,fit_mode:'cover',alt:'Front'},true);await tick();f.snapshot.stop();resolve({ok:true,blob:async()=>({type:'image/jpeg'})});await tick();assert.equal(f.images.length,0);assert.equal(f.container.child,undefined);assert.equal(f.loaded.length,0);
});
test('a decoded snapshot reports load time, avoids parallel requests and releases resources on privacy/disconnect',async()=>{
 const original=globalThis.document;globalThis.document={createElement:()=>({dataset:{},append(){},remove(){this.removed=true;}})};
 try{
  let calls=0;const f=snapshotFixture(async()=>{calls++;return {ok:true,blob:async()=>({type:'image/jpeg'})};});
  const options={interval:12,fit_mode:'contain',alt:'Front'};f.snapshot.update(f.hass,'camera.front',options,true);await tick();f.snapshot.refresh();assert.equal(calls,1);assert.equal(f.loaded.length,0);
  f.images[0].onload();await tick();assert.equal(f.loaded.length,1);assert.equal(f.statuses.at(-1),'ready');assert.equal(f.scheduled.at(-1).delay,12000);
  f.snapshot.update(f.hass,'camera.front',options,true);assert.equal(calls,1);f.snapshot.stop();assert.equal(f.container.child.removed,true);assert.equal(f.revoked.length,1);assert.equal(f.snapshot.lastLoaded,null);
 }finally{globalThis.document=original;}
});
test('failed or invalid snapshot responses never claim a successful update and remain retryable',async()=>{
 const f=snapshotFixture(async()=>({ok:false}));f.snapshot.update(f.hass,'camera.front',{interval:0},true);await tick();assert.equal(f.statuses.at(-1),'error');assert.equal(f.loaded.length,0);assert.equal(f.images.length,0);f.snapshot.stop();
});

test('thumbnail snapshots render a plain image without nested controls or polling and release it on stop',async()=>{
 const f=snapshotFixture(async()=>({ok:true,blob:async()=>({type:'image/jpeg'})}));
 f.snapshot.update(f.hass,'camera.front',{interval:0,fit_mode:'cover',alt:'',interactive:false},true);await tick();
 f.images[0].remove=function(){this.removed=true;};f.images[0].onload();await tick();
 assert.equal(f.container.child,f.images[0]);assert.equal(f.snapshot.button,null);assert.equal(f.scheduled.length,0);
 f.snapshot.stop();assert.equal(f.images[0].removed,true);assert.equal(f.revoked.length,1);assert.equal(f.snapshot.picture,null);
});
