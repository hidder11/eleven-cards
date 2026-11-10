import {cameraShowAlarm} from './camera-features.js';

// One visual group for all armed modes and one for all transition states.
export function securityStatusGroup(state){
 if(['armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass'].includes(state))return 'armed';
 if(['arming','disarming','pending'].includes(state))return 'transition';
 return state==='disarmed'?'disarmed':state==='triggered'?'triggered':'unknown';
}
export function cameraSecurityStatus(config={},hass){
 if(!config.alarm_entity||!cameraShowAlarm(config))return 'camera';
 if(hass?.connected===false||hass?.connection?.connected===false)return 'unknown';
 return securityStatusGroup(hass?.states?.[config.alarm_entity]?.state);
}
export function cameraSecurityStatusColor(config,hass){
 const colors={disarmed:['#748b9d','#a2b9cb'],armed:['#39856d','#8cd6b7'],transition:['#ac843a','#e8c477'],unknown:['#7d8797','#a6b0c0'],triggered:['#ba5f5b','#ed9690'],camera:['#748b9d','#a2b9cb']};
 return colors[cameraSecurityStatus(config,hass)][hass?.themes?.darkMode?1:0];
}
