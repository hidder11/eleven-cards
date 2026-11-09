import {normalizeCameraConfig} from '../src/camera-utils.js';
export const securityDesignConfig=normalizeCameraConfig({
 alarm_entity:'alarm_control_panel.home',background:'lanes',color:'waiting',layout:'grid',columns:2,
 door_sensors:[{entity:'binary_sensor.front_door',name:'Voordeur'},{entity:'binary_sensor.back_door',name:'Achterdeur'}],
 window_sensors:[{entity:'binary_sensor.living',name:'Woonkamer'},{entity:'binary_sensor.kitchen',name:'Keuken'},{entity:'binary_sensor.bedroom',name:'Slaapkamer'}],
 cameras:[{entity:'camera.front',name:'Voordeur',motion_entity:'binary_sensor.front_motion',person_entity:'binary_sensor.front_person'},{entity:'camera.garden',name:'Tuin',motion_entity:'binary_sensor.garden_motion',person_entity:'binary_sensor.garden_person'}]
});
export function securityDesignHass(scenario='quiet',light=false){
 const sensor=state=>({state,last_changed:'2026-10-28T13:22:00Z'}),states={
  'alarm_control_panel.home':sensor(scenario==='open'?'disarmed':scenario==='alarm'?'triggered':scenario.startsWith('armed_')||['disarmed','arming','pending'].includes(scenario)?scenario:'armed_away'),
  'camera.front':sensor('streaming'),'camera.garden':sensor('streaming'),
  'binary_sensor.front_motion':sensor('off'),'binary_sensor.front_person':sensor(scenario==='person'?'on':'off'),
  'binary_sensor.garden_motion':sensor(scenario==='motion'?'on':'off'),'binary_sensor.garden_person':sensor('off'),
  'binary_sensor.front_door':sensor('off'),'binary_sensor.back_door':sensor('off'),
  'binary_sensor.living':sensor('off'),'binary_sensor.kitchen':sensor(scenario==='open'?'on':'off'),'binary_sensor.bedroom':sensor('off')
 };
 if(scenario==='unknown')for(const entity of Object.values(states))entity.state='unavailable';
 return {connected:scenario!=='offline',language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:!light},states};
}
