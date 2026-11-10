import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraSecurityStatus,cameraSecurityStatusColor} from '../src/security-status.js';
import {securityArt} from '../src/security-art.js';
import {cameraSecurityHeader} from '../src/camera-security.js';
import {normalizeCameraConfig} from '../src/camera-utils.js';
const config=normalizeCameraConfig({alarm_entity:'alarm_control_panel.home'});
const hass=(state,darkMode=false)=>({connected:true,themes:{darkMode},states:{'alarm_control_panel.home':{state}}});
test('five status groups share colours and shapes across modes and transitions in both themes',()=>{
 const groups=[['disarmed',['disarmed']],['armed',['armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass']],['transition',['arming','disarming','pending']],['unknown',['unknown','unavailable',undefined,'invalid']],['triggered',['triggered']]];
 for(const dark of [false,true]){
  const colors=[];
  for(const [group,states] of groups){
   const color=cameraSecurityStatusColor(config,hass(states[0],dark));colors.push(color);
   const shapes=states.map(state=>{
    assert.equal(cameraSecurityStatus(config,hass(state,dark)),group);
    assert.equal(cameraSecurityStatusColor(config,hass(state,dark)),color);
    const art=securityArt(state,color);assert.ok(art.includes('data-security-group="'+group+'"'));
    return art.match(/<g class="security-art-body">([\s\S]*)<\/g>/)[1].replaceAll(/security-weather-\d+/g,'id');
   });
   assert.equal(new Set(shapes).size,1);
  }
  assert.equal(new Set(colors).size,5);
 }
});
test('offline alarms cannot retain an armed or triggered colour; hidden alarms use neutral camera fallback',()=>{
 for(const offline of [{connected:false},{connection:{connected:false}}]){
  const value={...hass('triggered'),...offline};
  assert.equal(cameraSecurityStatus(config,value),'unknown');
  assert.equal(cameraSecurityStatusColor(config,value),cameraSecurityStatusColor(config,hass('unknown')));
 }
 for(const value of [{...config,show_alarm:false},{...config,alarm_entity:''}])assert.equal(cameraSecurityStatus(value,hass('triggered')),'camera');
 const t=(nl,en)=>en;
 for(const state of ['armed_home','armed_night','armed_away'])assert.match(cameraSecurityHeader(config,hass(state),t),/>On</);
 assert.match(cameraSecurityHeader(config,hass('disarming'),t),/>Disarming</);
 assert.match(cameraSecurityHeader(config,{...hass('armed_home'),connected:false},t),/>Unknown</);
});
