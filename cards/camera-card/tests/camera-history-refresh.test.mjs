import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFeaturesView} from '../src/camera-features-view.js';
import {normalizeCameraConfig} from '../src/camera-utils.js';
import {CameraActivity} from '../src/camera-features.js';

function fixture(t){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:100000});
 const saved=globalThis.document;globalThis.document={hidden:false};
 t.after(()=>{if(saved===undefined)delete globalThis.document;else globalThis.document=saved;});
 const card=new (cameraFeaturesView(class{}))();
 Object.assign(card,{_attached:true,_securityView:'activity',_hass:{connected:true},_config:normalizeCameraConfig({cameras:[{entity:'camera.front',motion_entity:'binary_sensor.motion'}],activity_source:'history'}),hasAttribute:()=>false,_historyLastAttempt:Date.now()});
 return card;
}
test('visible activity refreshes at 30 seconds without being delayed by frequent hass renders',t=>{
 const card=fixture(t);let calls=0;
 card._loadHistory=()=>{calls++;card._historyLastAttempt=Date.now();card._syncHistoryRefresh();};
 card._syncHistoryRefresh();
 for(let i=0;i<29;i++){t.mock.timers.tick(1000);card._syncHistoryRefresh();}
 assert.equal(calls,0);t.mock.timers.tick(1000);assert.equal(calls,1);
 t.mock.timers.tick(30000);assert.equal(calls,2);
 card._securityView='cameras';card._syncHistoryRefresh();t.mock.timers.tick(60000);assert.equal(calls,2);
 card._securityView='activity';card._syncHistoryRefresh();t.mock.timers.tick(0);assert.equal(calls,3);
});
test('history polling pauses for document visibility, intersection, offline, modal, session and removal',t=>{
 const card=fixture(t);let calls=0;card._loadHistory=()=>calls++;
 const cases=[()=>{document.hidden=true;},()=>{card.hasAttribute=()=>true;},()=>{card._hass.connected=false;},()=>{card._hass.connection={connected:false};},()=>{card._viewerEntity='camera.front';},()=>{card._attached=false;},()=>{card._config.activity_source='session';},()=>{card._config.show_activity=false;}];
 for(const pause of cases){
  document.hidden=false;card.hasAttribute=()=>false;card._hass={connected:true};card._viewerEntity=null;card._attached=true;card._config.activity_source='history';card._config.show_activity=true;
  card._syncHistoryRefresh();pause();card._syncHistoryRefresh();t.mock.timers.tick(60000);assert.equal(calls,0);
 }
});
test('background history reloads never overlap and recover from errors without discarding observed events',async t=>{
 const card=fixture(t);let release,calls=0;
 card._activity=new CameraActivity();card._activity.events=[{id:'observed',time:99000}];card._detections=new Map();
 card._renderActivity=()=>{};card._render=()=>card._syncHistoryRefresh();
 card._hass.callApi=()=>{calls++;return new Promise(resolve=>release=resolve);};
 const first=card._loadHistory(true);await card._loadHistory(true);assert.equal(calls,1);
 t.mock.timers.tick(60000);assert.equal(calls,1);release([]);await first;
 card._hass.callApi=async()=>{calls++;throw Error('Fixture failure');};await card._loadHistory(true);
 assert.equal(card._historyError,true);assert.equal(card._activity.events[0].id,'observed');
 card._hass.callApi=async()=>{calls++;return [];};t.mock.timers.tick(30000);await Promise.resolve();await Promise.resolve();
 assert.equal(calls,3);assert.equal(card._historyError,false);assert.equal(card._activity.events[0].id,'observed');
});
