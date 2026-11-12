import {HEADER_BACKGROUNDS} from '../../../shared/header-backgrounds.js';
export const MEDIA_LAYOUTS=['classic','poster','horizontal','studio','minimal'];
export const MEDIA_FEATURES={media_pause:1,media_seek:2,volume_set:4,volume_mute:8,media_previous_track:16,media_next_track:32,turn_on:128,turn_off:256,play_media:512,select_source:2048,media_stop:4096,media_play:16384};
export const mediaDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
export function normalizeMediaConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid media player configuration');
 const entity=input.entity??'';
 if(typeof entity!=='string'||(entity&&!/^media_player\.[a-z0-9_]+$/.test(entity)))throw Error('Choose a media_player entity / Kies een media_player-entiteit');
 const stations=Array.isArray(input.stations)?input.stations.map(row=>({name:typeof row?.name==='string'?row.name:'',media_content_id:typeof row?.media_content_id==='string'?row.media_content_id:'',media_content_type:typeof row?.media_content_type==='string'?row.media_content_type:'music'})):[];
 return {...input,entity,stations,title:typeof input.title==='string'?input.title:'',layout:MEDIA_LAYOUTS.includes(input.layout)?input.layout:'studio',compact:input.compact===true,radio_mode:input.radio_mode===true,background:input.background==null||input.background==='none'?'none':HEADER_BACKGROUNDS.some(item=>item.value===input.background)?input.background:'lanes',background_strength:typeof input.background_strength==='number'&&Number.isFinite(input.background_strength)?Math.max(0,Math.min(100,input.background_strength)):100,animate_background:input.animate_background!==false,...Object.fromEntries(['show_artwork','show_progress','show_volume','show_source','show_power'].map(key=>[key,input[key]!==false]))};
}
export const mediaNumber=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
export function mediaAvailability(hass,entity){
 if(!entity)return 'setup';
 if(hass?.connected===false||hass?.connection?.connected===false)return 'offline';
 const state=hass?.states?.[entity]?.state;
 return state==null?'missing':['unavailable','unknown'].includes(state)?state:null;
}
export function mediaCan(hass,entity,service){
 if(mediaAvailability(hass,entity)||!MEDIA_FEATURES[service]||!hass?.services?.media_player?.[service])return false;
 const state=hass.states[entity];
 if(state.state==='off'&&service!=='turn_on')return false;
 if(state.state!=='off'&&service==='turn_on')return false;
 return (Number(state.attributes?.supported_features)&MEDIA_FEATURES[service])!==0;
}
export function mediaPosition(state,now=Date.now()){
 const attrs=state?.attributes??{},duration=mediaNumber(attrs.media_duration),reported=mediaNumber(attrs.media_position);
 if(duration===null||duration<=0)return {duration:null,position:null};
 if(reported===null)return {duration,position:null};
 const updated=Date.parse(attrs.media_position_updated_at),elapsed=state.state==='playing'&&Number.isFinite(updated)?Math.max(0,(now-updated)/1000):0;
 return {duration,position:Math.max(0,Math.min(duration,reported+elapsed))};
}
export function mediaTime(seconds){if(mediaNumber(seconds)===null)return '—';const value=Math.max(0,Math.floor(seconds));return value>=3600?Math.floor(value/3600)+':'+String(Math.floor(value/60)%60).padStart(2,'0')+':'+String(value%60).padStart(2,'0'):Math.floor(value/60)+':'+String(value%60).padStart(2,'0');}
export function mediaArtwork(hass,state){
 const value=state?.attributes?.entity_picture_local||state?.attributes?.entity_picture;
 if(typeof value!=='string'||!value.trim()||/[\u0000-\u0020\\]/.test(value)||value.startsWith('//'))return '';
 if(value.startsWith('/'))return typeof hass?.hassUrl==='function'?hass.hassUrl(value):value;
 try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}
}
export function mediaRequest(hass,entity,service,value){
 if(!mediaCan(hass,entity,service))throw Error('Unsupported or unavailable action');
 const attrs=hass.states[entity].attributes??{};let data={};
 if(service==='volume_set'){const volume=mediaNumber(value);if(volume===null||volume<0||volume>1)throw Error('Invalid volume');data={volume_level:volume};}
 if(service==='volume_mute'){if(typeof value!=='boolean')throw Error('Invalid mute state');data={is_volume_muted:value};}
 if(service==='media_seek'){const {duration}=mediaPosition(hass.states[entity]);if(duration===null||mediaNumber(value)===null||value<0||value>duration)throw Error('Invalid seek');data={seek_position:value};}
 if(service==='select_source'){if(typeof value!=='string'||!Array.isArray(attrs.source_list)||!attrs.source_list.includes(value))throw Error('Invalid source');data={source:value};}
 if(service==='play_media'){if(!value||typeof value.media_content_id!=='string'||!value.media_content_id.trim()||typeof value.media_content_type!=='string'||!value.media_content_type.trim())throw Error('Invalid station');data={media_content_id:value.media_content_id.trim(),media_content_type:value.media_content_type.trim()};}
 return {domain:'media_player',service,data,target:{entity_id:entity}};
}
