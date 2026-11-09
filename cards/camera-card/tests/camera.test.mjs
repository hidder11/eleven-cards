import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCameraConfig,cameraUnavailable,cameraPictureConfig,visibleCameras,nextCamera,cameraDetections,CameraCycle} from '../src/camera-utils.js';
import {CameraPlayer} from '../src/camera-player.js';
import {HEADER_BACKGROUNDS} from '../../../shared/header-backgrounds.js';

test('camera config accepts single and multiple cameras and preserves names and ordering',()=>{
 assert.deepEqual(normalizeCameraConfig({entity:'camera.front'}).cameras,[{entity:'camera.front',name:''}]);
 const c=normalizeCameraConfig({cameras:['camera.front',{entity:'camera.garden',name:'Garden'}],layout:'tabs',default_camera:'camera.garden'});
 assert.equal(c.default_camera,'camera.garden');assert.equal(c.cameras[1].name,'Garden');assert.equal(c.camera_view,'live');
 assert.equal(normalizeCameraConfig({...c,default_camera:'camera.missing'}).default_camera,'camera.front');
 assert.deepEqual(normalizeCameraConfig({cameras:[]}).cameras,[]);
 for(const cameras of [['sensor.camera'],['camera.front','camera.front'],['camera.x" onclick="alert(1)'],{}])assert.throws(()=>normalizeCameraConfig({cameras}));
});

test('camera appearance uses the complete shared catalog and validates dimensions',()=>{
 for(const {value} of HEADER_BACKGROUNDS)assert.equal(normalizeCameraConfig({background:value}).background,value);
 const c=normalizeCameraConfig({background:'invalid',columns:'2',background_strength:150,aspect_ratio:'1:1',color:'planned'});
 assert.equal(c.background,'lanes');assert.equal(c.columns,2);assert.equal(c.background_strength,100);assert.equal(c.aspect_ratio,'1:1');assert.equal(c.color,'planned');
 assert.equal(normalizeCameraConfig({columns:0,aspect_ratio:'bad',background_strength:NaN}).columns,'auto');
});

test('camera availability distinguishes disconnect, missing, off and recoverable unknown state',()=>{
 assert.equal(cameraUnavailable({connected:false},'camera.a'),'offline');
 assert.equal(cameraUnavailable({states:{}},'camera.a'),'missing');
 for(const state of ['unknown','unavailable','off','idle','streaming','recording'])assert.equal(cameraUnavailable({states:{'camera.a':{state}}},'camera.a'),['unknown','unavailable','off'].includes(state)?state:null);
});

test('native camera config uses only view settings and details actions',()=>{
 const config=cameraPictureConfig('camera.front',normalizeCameraConfig({camera_view:'auto',fit_mode:'contain',aspect_ratio:'4:3'}));
 assert.equal(config.type,'picture-entity');assert.equal(config.entity,'camera.front');assert.equal(config.camera_view,'auto');
 assert.equal(config.fit_mode,'contain');assert.equal(config.aspect_ratio,'4:3');assert.deepEqual(config.tap_action,{action:'more-info'});
 assert.equal(JSON.stringify(config).includes('service'),false);
});

const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('per-camera settings override defaults and hidden cameras cannot be selected by default or navigation',()=>{
 const config=normalizeCameraConfig({layout:'focus',camera_view:'live',aspect_ratio:'16:9',cameras:[{entity:'camera.hidden',show:false},{entity:'camera.front',name:'Front',icon:'mdi:door',camera_view:'auto',aspect_ratio:'9:16',fit_mode:'contain'},'camera.garden'],default_camera:'camera.hidden'});
 assert.equal(config.layout,'focus');assert.equal(config.default_camera,'camera.front');assert.equal(visibleCameras(config).length,2);
 const picture=cameraPictureConfig('camera.front',config);assert.equal(picture.camera_view,'auto');assert.equal(picture.aspect_ratio,'9:16');assert.equal(picture.fit_mode,'contain');
 assert.equal(cameraPictureConfig('camera.garden',config).aspect_ratio,'16:9');
 assert.equal(nextCamera(config,'camera.front',-1),'camera.garden');assert.equal(nextCamera(config,'camera.garden',1),'camera.front');
 const hass={states:{'camera.front':{state:'unavailable'},'camera.garden':{state:'idle'}}};
 assert.equal(nextCamera(config,'camera.front',1,hass,true),'camera.garden');assert.equal(nextCamera(config,'camera.garden',1,{connected:false},true),'camera.garden');
});

test('camera overrides validate entity domains and empty values restore card defaults',()=>{
 const row=normalizeCameraConfig({cameras:[{entity:'camera.front',icon:'<script>',motion_entity:'sensor.motion',person_entity:'person.me',last_detection_entity:'binary_sensor.last',aspect_ratio:'',fit_mode:'',camera_view:''}]}).cameras[0];
 assert.deepEqual(row,{entity:'camera.front',name:''});
 assert.equal(normalizeCameraConfig({auto_cycle:true,cycle_interval:1}).cycle_interval,5);
 assert.equal(normalizeCameraConfig({cycle_interval:Infinity}).cycle_interval,10);
 assert.equal(normalizeCameraConfig({cycle_interval:9000}).cycle_interval,3600);
 assert.equal(normalizeCameraConfig({cameras:[{entity:'camera.front',show:false}]}).default_camera,'');
});

test('detection tracks ON events and never presents an OFF transition as the last detection',()=>{
 const row={motion_entity:'binary_sensor.motion',person_entity:'binary_sensor.person'},cache=new Map(),on='2026-01-01T10:00:00Z',off='2026-01-01T10:00:30Z',now=Date.parse('2026-01-02T00:00:00Z');
 let hass={states:{'binary_sensor.motion':{state:'off',last_changed:off},'binary_sensor.person':{state:'unknown'}}};
 let result=cameraDetections(hass,row,cache,now);assert.equal(result.last,null);assert.equal(result.entries[1].available,false);
 hass.states['binary_sensor.motion']={state:'on',last_changed:on};result=cameraDetections(hass,row,cache,now);assert.equal(result.last,Date.parse(on));assert.equal(result.entries[0].active,true);
 hass.states['binary_sensor.motion']={state:'off',last_changed:off};assert.equal(cameraDetections(hass,row,cache,now).last,Date.parse(on));
 result=cameraDetections({...hass,connected:false},row,cache,now);assert.equal(result.entries[0].active,false);assert.equal(result.entries[0].available,false);
});

test('explicit timestamp sensor supplies persisted detection time and rejects missing or future data',()=>{
 const row={last_detection_entity:'sensor.last'},now=Date.parse('2026-01-02T00:00:00Z');
 for(const state of ['unknown','unavailable','2030-01-01T00:00:00Z'])assert.equal(cameraDetections({states:{'sensor.last':{state}}},row,new Map(),now).last,null);
 const state='2026-01-01T10:00:00Z';assert.equal(cameraDetections({states:{'sensor.last':{state}}},row,new Map(),now).last,Date.parse(state));
});

test('auto cycle keeps a stable timer across sensor updates and cancels on pause or disconnect',()=>{
 const scheduled=[],cancelled=[];let advances=0;const cycle=new CameraCycle(()=>advances++,(callback,delay)=>{scheduled.push({callback,delay});return scheduled.length;},id=>cancelled.push(id));
 cycle.sync(true,10);cycle.sync(true,10);assert.equal(scheduled.length,1);assert.equal(scheduled[0].delay,10000);scheduled[0].callback();assert.equal(advances,1);
 cycle.sync(false,10);assert.deepEqual(cancelled,[1]);cycle.sync(true,20);assert.equal(scheduled[1].delay,20000);cycle.stop();assert.deepEqual(cancelled,[1,2]);
});
function fixture(create){const children=[],statuses=[],container={replaceChildren:card=>children.splice(0,children.length,card)},player=new CameraPlayer(container,create,status=>statuses.push(status));return {player,children,statuses};}
function native(){return {localName:'hui-picture-entity-card',style:{setProperty(){}},remove(){this.removed=true;}};}

test('sensor and cosmetic updates reuse the player and pass through the latest hass',async()=>{
 let count=0;const card=native(),{player}=fixture(async()=>{count++;return card;});
 const config={entity:'camera.a',camera_view:'live'};player.update({id:1},config,true);await tick();
 const hass={id:2};player.update(hass,config,true);await tick();assert.equal(count,1);assert.equal(card.hass,hass);
 player.stop();assert.equal(card.removed,true);
});

test('pending creations cannot attach after switching tabs or removing a card',async()=>{
 let resolve;const {player,children}=fixture(()=>new Promise(r=>resolve=r));
 player.update({id:1},{entity:'camera.a'},true);await tick();player.update({}, {entity:'camera.a'},false);
 resolve(native());await tick();assert.equal(children.length,0);assert.equal(player.card,null);
});

test('view changes recreate players while hidden feeds do not start requests',async()=>{
 const cards=[],{player}=fixture(async()=>{const card=native();cards.push(card);return card;});
 player.update({}, {camera_view:'live'},false);await tick();assert.equal(cards.length,0);
 player.update({}, {camera_view:'live'},true);await tick();
 player.update({}, {camera_view:'auto'},true);await tick();assert.equal(cards.length,2);assert.equal(cards[0].removed,true);
 player.stop();player.update({}, {camera_view:'auto'},true);await tick();assert.equal(cards.length,3);player.stop();
});

test('helper/player errors do not spin requests and can be retried',async()=>{
 let calls=0;const {player,statuses}=fixture(async()=>{if(++calls===1)throw Error('not ready');return native();});
 player.update({}, {},true);await tick();assert.equal(statuses.at(-1),'error');
 player.update({}, {},true);await tick();assert.equal(calls,1);
 player.retry();player.update({}, {},true);await tick();assert.equal(calls,2);assert.equal(statuses.at(-1),'ready');player.stop();
});
