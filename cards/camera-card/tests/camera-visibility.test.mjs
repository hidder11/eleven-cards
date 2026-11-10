import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCameraConfig} from '../src/camera-utils.js';
import {cameraShowAlarm,cameraShowContacts,cameraActivitySources} from '../src/camera-features.js';
import {cameraSecurityHeader,cameraSecurityTabs,cameraSecurityMetrics} from '../src/camera-security.js';
const t=(nl,en)=>en;
const base={alarm_entity:'alarm_control_panel.home',door_sensors:['binary_sensor.door'],window_sensors:['binary_sensor.window']};
const hass={states:{'alarm_control_panel.home':{state:'armed_away'}}};
test('separate visibility falls back to legacy security settings and overrides independently',()=>{
 for(const legacy of [true,false])for(const alarm of [undefined,true,false])for(const contacts of [undefined,true,false]){
  const c=normalizeCameraConfig({...base,show_security:legacy,show_alarm:alarm,show_contacts:contacts});
  assert.equal(cameraShowAlarm(c),alarm??legacy);assert.equal(cameraShowContacts(c),contacts??legacy);
  assert.equal(cameraSecurityHeader(c,hass,t).includes('Alarm armed'),alarm??legacy);
  assert.equal(cameraSecurityTabs(c,t).some(tab=>tab.value==='doors'),contacts??legacy);
  assert.equal(cameraSecurityMetrics(c,hass,t).includes('data-security-contacts'),contacts??legacy);
 }
});
test('hiding contact UI retains sensors and their activity sources through serialization',()=>{
 const c=normalizeCameraConfig({...base,show_contacts:false,show_alarm:true});
 const saved=normalizeCameraConfig(JSON.parse(JSON.stringify(c)));
 assert.deepEqual(saved.door_sensors,c.door_sensors);assert.deepEqual(saved.window_sensors,c.window_sensors);
 assert.deepEqual(cameraActivitySources(saved).map(row=>row.entity),['binary_sensor.door','binary_sensor.window']);
 assert.equal(saved.alarm_entity,base.alarm_entity);assert.equal(cameraShowAlarm(saved),true);
});
