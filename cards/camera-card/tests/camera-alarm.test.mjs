import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraAlarmModes,cameraAlarmNeedsCode,cameraAlarmRequest} from '../src/camera-alarm.js';
const entity='alarm_control_panel.home';
const hass=(state='armed_away',attributes={supported_features:55})=>({connected:true,states:{[entity]:{state,attributes}}});
test('alarm modes include off and precisely the supported arming modes, never trigger',()=>{
 assert.deepEqual(cameraAlarmModes(hass().states[entity]).map(row=>row.value),['disarmed','armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass']);
 assert.deepEqual(cameraAlarmModes(hass('disarmed',{supported_features:10}).states[entity]).map(row=>row.value),['disarmed','armed_away']);
 assert.deepEqual(cameraAlarmModes(undefined).map(row=>row.value),['disarmed']);
});
test('alarm actions map every supported mode to its HA service and entity',()=>{
 for(const mode of cameraAlarmModes(hass().states[entity])){
  const request=cameraAlarmRequest(hass(mode.value==='disarmed'?'armed_home':'disarmed'),entity,mode.value);
  assert.deepEqual(request,{domain:'alarm_control_panel',service:mode.service,data:{entity_id:entity}});
 }
 assert.throws(()=>cameraAlarmRequest(hass('disarmed',{supported_features:2}),entity,'armed_night'),/unsupported/);
 assert.throws(()=>cameraAlarmRequest(hass(),entity,'armed_away'),/unchanged/);
});
test('disarming supports an optional code; code-required arming uses native HA instead of an incomplete request',()=>{
 const secured=hass('armed_away',{supported_features:55,code_format:'number',code_arm_required:false});
 assert.ok(cameraAlarmNeedsCode(secured.states[entity],'disarmed'));
 assert.ok(!cameraAlarmNeedsCode(secured.states[entity],'armed_home'));
 assert.throws(()=>cameraAlarmRequest(secured,entity,'disarmed'),/code/);
 assert.throws(()=>cameraAlarmRequest(secured,entity,'disarmed','12a4'),/code/);
 assert.equal(cameraAlarmRequest(secured,entity,'disarmed','0012').data.code,'0012');
 assert.ok(!('code' in cameraAlarmRequest(secured,entity,'disarmed','',false).data));
 assert.ok(!('code' in cameraAlarmRequest(secured,entity,'armed_home','1234').data));
 const text=hass('disarmed',{supported_features:1,code_format:'text',code_arm_required:true});
 assert.throws(()=>cameraAlarmRequest(text,entity,'armed_home','secret phrase'),/native/);
 text.states[entity].state='armed_home';
 assert.equal(cameraAlarmRequest(text,entity,'disarmed','secret phrase').data.code,'secret phrase');
});
test('offline, missing, unavailable and invalid-domain alarms cannot issue requests',()=>{
 for(const input of [{...hass(),connected:false},{...hass(),connection:{connected:false}},hass('unavailable'),hass('unknown'),{states:{}}])assert.throws(()=>cameraAlarmRequest(input,entity,'disarmed'),/unavailable/);
 assert.throws(()=>cameraAlarmRequest(hass(),'switch.home','disarmed'),/unavailable/);
});
