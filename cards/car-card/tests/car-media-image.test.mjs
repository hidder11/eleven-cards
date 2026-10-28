import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CarMediaImage} from '../src/car-media-image.js';
import {normalizeCarConfig} from '../src/car-utils.js';

const media={media_content_id:'media-source://media_source/local/car.png',media_content_type:'image/png',metadata:{title:'Car'}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const resolved={url:'/api/media_source/local/car.png?authSig=test',mime_type:'image/png'};

test('both image selections survive source and EVCC switches without changing legacy entity configs',()=>{
 assert.equal(normalizeCarConfig({image_entity:'image.car'}).image_source,'entity');
 for(const evcc_enabled of [false,true]){
  let config=normalizeCarConfig({evcc_enabled,image_entity:'image.car',image_media:media});
  assert.equal(config.image_source,'media');assert.deepEqual(config.image_media,media);
  config=normalizeCarConfig({...config,image_source:'entity'});
  assert.equal(config.image_entity,'image.car');assert.deepEqual(config.image_media,media);
  assert.equal(normalizeCarConfig({...config,image_source:'media'}).image_entity,'image.car');
 }
 assert.equal(normalizeCarConfig({image_media:media.media_content_id}).image_media.media_content_id,media.media_content_id);
 assert.equal(normalizeCarConfig({image_media:[]}).image_media,undefined);
});

test('media resolves through HA and reuses its authenticated URL across telemetry updates',async()=>{
 const calls=[],changed=[];
 const hass={connection:{},hassUrl:path=>'https://ha.test'+path,callWS:async request=>{calls.push(request);return resolved;}};
 const image=new CarMediaImage(()=>changed.push(image.url));
 try{
  image.update(hass,media);image.update({...hass,states:{}},media);await flush();
  assert.deepEqual(calls,[{type:'media_source/resolve_media',media_content_id:media.media_content_id}]);
  assert.equal(image.url,'https://ha.test'+resolved.url);assert.deepEqual(changed,[image.url]);
  image.update({...hass,states:{updated:{state:1}}},media);await flush();assert.equal(calls.length,1);
  assert.equal(media.media_content_id,'media-source://media_source/local/car.png','signed URL is never written to the selection');
 }finally{image.reset();}
});

test('media rejects unsafe URLs and non-image content, with retry backoff',async()=>{
 for(const result of [{url:'javascript:alert(1)',mime_type:'image/png'},{url:'//outside.test/car.png',mime_type:'image/png'},{url:'/movie.mp4',mime_type:'video/mp4'},null]){
  let calls=0;const hass={callWS:async()=>{calls++;return result;}},image=new CarMediaImage(()=>{});
  try{image.update(hass,media);await flush();assert.equal(image.url,null);image.update(hass,media);await flush();assert.equal(calls,1);assert.ok(image.retry>Date.now());}finally{image.reset();}
 }
});

test('obsolete media requests cannot replace a new selection or a restored entity image',async()=>{
 const requests=[];let changes=0;
 const hass={callWS:request=>new Promise(resolve=>requests.push({request,resolve}))},image=new CarMediaImage(()=>changes++);
 try{
  image.update(hass,media);await flush();image.update(hass,{...media,media_content_id:'media-source://media_source/local/new.png'});await flush();
  requests[1].resolve({...resolved,url:'/new.png'});await flush();assert.equal(image.url,'/new.png');
  requests[0].resolve(resolved);await flush();assert.equal(image.url,'/new.png');assert.equal(changes,1);
  image.update(hass,media);await flush();image.update(hass,null);requests[2].resolve(resolved);await flush();assert.equal(image.url,null);assert.equal(changes,1);
 }finally{image.reset();}
});

test('disconnection cancels renewal and ignores in-flight responses; reconnection resolves again',async()=>{
 let resolve,calls=0;const connection={},hass={connection,callWS:()=>{calls++;return new Promise(done=>{resolve=done;});}},image=new CarMediaImage(()=>{});
 try{
  image.update(hass,media);await flush();image.update({...hass,connected:false},media);resolve(resolved);await flush();
  assert.equal(image.url,null);assert.equal(image.pending,false);assert.equal(image.timer,null);
  image.update(hass,media);await flush();assert.equal(calls,2);resolve(resolved);await flush();assert.equal(image.url,resolved.url);
  image.reset();assert.equal(image.timer,null);assert.equal(image.url,null);
 }finally{image.reset();}
});

test('signed URLs renew before expiry and requests time out and recover automatically',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:1000});
 let calls=0,fail=false;
 const hass={callWS:async()=>{calls++;if(fail)return new Promise(()=>{});return {...resolved,url:'/car-'+calls+'.png'};}},image=new CarMediaImage(()=>{});
 try{
  image.update(hass,media);await flush();assert.equal(image.url,'/car-1.png');
  t.mock.timers.tick(23*60*60*1000);await flush();assert.equal(image.url,'/car-2.png');assert.equal(calls,2);
  fail=true;t.mock.timers.tick(23*60*60*1000);await flush();t.mock.timers.tick(10000);await flush();
  assert.equal(image.url,null);assert.equal(image.pending,false);
  fail=false;t.mock.timers.tick(60000);await flush();assert.equal(image.url,'/car-4.png');
 }finally{image.reset();t.mock.timers.reset();}
});

test('connection changes discard previous authenticated URLs',async()=>{
 let calls=0;const hass={connection:{},callWS:async()=>{calls++;return {...resolved,url:'/account-'+calls+'.png'};}},image=new CarMediaImage(()=>{});
 try{image.update(hass,media);await flush();image.update({...hass,connection:{}},media);assert.equal(image.url,null);await flush();assert.equal(image.url,'/account-2.png');}finally{image.reset();}
});

test('manual media image URLs use the same safe URL policy without a WebSocket request',()=>{
 const image=new CarMediaImage(()=>{}),hass={hassUrl:path=>'https://ha.test'+path,callWS:()=>assert.fail('no media resolution for a URL')};
 try{
  image.update(hass,{media_content_id:'/local/car.png'});assert.equal(image.url,'https://ha.test/local/car.png');
  image.update(hass,{media_content_id:'javascript:alert(1)'});assert.equal(image.url,null);
 }finally{image.reset();}
});
