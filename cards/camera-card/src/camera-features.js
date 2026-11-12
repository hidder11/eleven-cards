// Configuration and state logic shared by the card, editor and tests.
export const CAMERA_LAYOUTS=['grid','tabs','focus','sidebar','filmstrip','wall'];
export const cameraEntity=(value,domains)=>typeof value==='string'&&/^[a-z_]+\.[a-z0-9_]+$/.test(value)&&(!domains||domains.includes(value.split('.')[0]));
export const cameraNumber=(value,fallback,min,max)=>value==null||value===''||!Number.isFinite(Number(value))?fallback:Math.max(min,Math.min(max,Number(value)));
export const cameraSnapshotInterval=value=>{const seconds=cameraNumber(value,0,0,3600);return seconds===0?0:Math.max(5,seconds);};
const cameraText=value=>typeof value==='string'?value:'';
const cameraIcon=value=>typeof value==='string'&&/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(value)?value:'';
export function normalizeCameraActions(source=[]){
 if(!Array.isArray(source))return [];
 const used=new Set();return source.filter(row=>row&&typeof row==='object').map((row,index)=>{
  let id=cameraText(row.id)||'action-'+(index+1);while(used.has(id))id+='-copy';used.add(id);
  const data=row.data&&typeof row.data==='object'&&!Array.isArray(row.data)?structuredClone(row.data):{};
  return {id,name:cameraText(row.name),icon:cameraIcon(row.icon)||'mdi:gesture-tap-button',entity:cameraEntity(row.entity)?row.entity:'',camera:cameraEntity(row.camera,['camera'])?row.camera:'',service:typeof row.service==='string'&&/^[a-z_]+\.[a-z0-9_]+$/.test(row.service)?row.service:'',action:['toggle','turn_on','turn_off','press','run','more-info'].includes(row.action)?row.action:'more-info',confirmation:row.confirmation!==false,data};
 });
}
export function normalizeCameraFeatures(input,cameras){
 const contacts=source=>Array.isArray(source)?[...new Map(source.map(value=>typeof value==='string'?{entity:value}:value).filter(row=>cameraEntity(row?.entity,['binary_sensor'])).map(row=>[row.entity,{entity:row.entity,name:cameraText(row.name)}])).values()]:[];
 const used=new Set(),profiles=(Array.isArray(input.profiles)?input.profiles:[]).filter(row=>row&&typeof row==='object').map((row,index)=>{
  let id=cameraText(row.id)||'profile-'+(index+1);if(['auto','base'].includes(id))id+='-profile';while(used.has(id))id+='-copy';used.add(id);
  const profile={id,name:cameraText(row.name),entity:cameraEntity(row.entity)?row.entity:'',state:cameraText(row.state),cameras:Array.isArray(row.cameras)?[...new Set(row.cameras.filter(id=>cameras.some(row=>row.entity===id)))]:[]};
  if(CAMERA_LAYOUTS.includes(row.layout))profile.layout=row.layout;
  if(typeof row.auto_cycle==='boolean')profile.auto_cycle=row.auto_cycle;
  if(row.cycle_interval!=null&&row.cycle_interval!=='')profile.cycle_interval=cameraNumber(row.cycle_interval,10,5,3600);
  return profile;
 });
 return {auto_focus:input.auto_focus===true,focus_duration:cameraNumber(input.focus_duration,30,5,600),doorbell_entity:cameraEntity(input.doorbell_entity,['binary_sensor','event','input_button'])?input.doorbell_entity:'',doorbell_camera:cameras.some(row=>row.entity===input.doorbell_camera)?input.doorbell_camera:'',doorbell_secondary_camera:input.doorbell_secondary_camera!==input.doorbell_camera&&cameras.some(row=>row.entity===input.doorbell_secondary_camera)?input.doorbell_secondary_camera:'',doorbell_duration:cameraNumber(input.doorbell_duration,45,5,600),
  alarm_disarm_code:input.alarm_disarm_code!==false,alarm_entity:cameraEntity(input.alarm_entity,['alarm_control_panel'])?input.alarm_entity:'',door_sensors:contacts(input.door_sensors),window_sensors:contacts(input.window_sensors),show_security:input.show_security!==false,show_alarm:typeof input.show_alarm==='boolean'?input.show_alarm:undefined,show_contacts:typeof input.show_contacts==='boolean'?input.show_contacts:undefined,
  profiles,default_profile:profiles.some(row=>row.id===input.default_profile)?input.default_profile:'',
  actions:normalizeCameraActions(input.actions),show_activity:input.show_activity!==false,activity_source:input.activity_source==='history'?'history':'session',activity_hours:cameraNumber(input.activity_hours,24,1,72),activity_page_size:Math.round(cameraNumber(input.activity_page_size??input.activity_limit,10,1,50)),snapshot_interval:cameraSnapshotInterval(input.snapshot_interval)};
}
export function effectiveCameraConfig(config,hass,selection='auto'){
 const profile=selection==='base'?null:selection==='auto'?(config.profiles.find(row=>row.entity&&row.state&&!['unknown','unavailable'].includes(hass?.states?.[row.entity]?.state)&&hass?.states?.[row.entity]?.state===row.state)??config.profiles.find(row=>row.id===config.default_profile)):config.profiles.find(row=>row.id===selection);
 if(!profile)return {config,profile:null};
 const cameras=config.cameras.map(row=>({...row,show:row.show!==false&&(!profile.cameras.length||profile.cameras.includes(row.entity))}));
 const next={...config,cameras,layout:profile.layout??config.layout,auto_cycle:profile.auto_cycle??config.auto_cycle,cycle_interval:profile.cycle_interval??config.cycle_interval};
 next.default_camera=cameras.some(row=>row.show!==false&&row.entity===config.default_camera)?config.default_camera:(cameras.find(row=>row.show!==false)?.entity??'');
 return {config:next,profile};
}
export const cameraShowAlarm=config=>config.show_alarm??(config.show_security!==false);
export const cameraShowContacts=config=>config.show_contacts??(config.show_security!==false);
export function cameraActivitySources(config){
 const sources=[];
 for(const row of config.cameras){
  if(row.motion_entity)sources.push({entity:row.motion_entity,camera:row.entity,kind:'motion'});
  if(row.person_entity)sources.push({entity:row.person_entity,camera:row.entity,kind:'person'});
 }
 if(config.doorbell_entity)sources.push({entity:config.doorbell_entity,camera:config.doorbell_camera,kind:'doorbell'});
 for(const row of config.door_sensors??[])sources.push({entity:row.entity,camera:'',kind:'door'});
 for(const row of config.window_sensors??[])sources.push({entity:row.entity,camera:'',kind:'window'});
 return sources;
}
export function cameraActivityEvent(source,state,now=Date.now()){
 if(!state||['unknown','unavailable'].includes(state.state))return null;
 const contact=['door','window'].includes(source.kind);
 const timestampSource=source.entity.startsWith('event.')||source.entity.startsWith('input_button.');
 if(!timestampSource&&(contact?!['on','off'].includes(state.state):state.state!=='on'))return null;
 const time=Date.parse(timestampSource?state.state:state.last_changed);
 if(!Number.isFinite(time)||time>now)return null;
 return {...source,...(contact?{state:state.state}:{}),time,id:[source.entity,source.camera,source.kind,time,...(contact?[state.state]:[])].join('|')};
}
// Keep complete minute groups before applying the visible row limit. Raw IDs
// remain available for deduplication against Recorder and direct event actions.
export const cameraActivityGroupKey=event=>JSON.stringify([event.entity,event.camera,event.kind,event.state,Math.floor(event.time/60000)]);
export function cameraRetainActivity(events,limit=Infinity){
 const groups=new Set();
 return [...new Map(events.map(event=>[event.id,event])).values()].filter(event=>Number.isFinite(event.time)).sort((a,b)=>b.time-a.time).filter(event=>{
  const key=cameraActivityGroupKey(event);
  if(groups.has(key))return true;
  if(groups.size>=limit)return false;
  groups.add(key);return true;
 });
}
export class CameraActivity{
 constructor(){this.previous=new Map();this.events=[];this.observed=[];this.lastEvent=new Map();this.lastOpened=new Map();}
 rememberOpenings(events,now=Date.now()){
  for(const event of events)if(['door','window'].includes(event.kind)&&event.state==='on'&&Number.isFinite(event.time)&&event.time<=now&&event.time>(this.lastOpened.get(event.entity)??-Infinity))this.lastOpened.set(event.entity,event.time);
 }
 ingest(config,hass,now=Date.now()){
  if(hass?.connected===false||hass?.connection?.connected===false){this.previous.clear();return [];}
  const sources=cameraActivitySources(config),keys=new Set(),added=[];
  for(const source of sources){
   const key=[source.entity,source.camera,source.kind].join('|');keys.add(key);
   const state=hass?.states?.[source.entity],event=cameraActivityEvent(source,state,now),signature=event?.id??state?.state??'missing',previous=this.previous.get(key);
   this.previous.set(key,signature);
   // First observations and reconnects establish a baseline, never a fresh alert.
   const initialized=previous==='off'||(typeof previous==='string'&&previous.includes('|'));
   const contact=['door','window'].includes(source.kind),changed=!contact||!previous?.endsWith('|'+state?.state);
   if(initialized&&changed&&previous!==signature&&event&&this.lastEvent.get(key)!==event.id)added.push(event);
   if(event){this.lastEvent.set(key,event.id);this.rememberOpenings([event],now);}
  }
  for(const key of this.previous.keys())if(!keys.has(key)){this.previous.delete(key);this.lastEvent.delete(key);}
  const contacts=new Set(sources.filter(source=>['door','window'].includes(source.kind)).map(source=>source.entity));
  for(const entity of this.lastOpened.keys())if(!contacts.has(entity))this.lastOpened.delete(entity);
  this.observed=cameraRetainActivity([...this.observed,...added]);
  this.merge(added);return added;
 }
 merge(events,limit=Infinity){this.rememberOpenings(events);this.events=cameraRetainActivity([...this.events,...events],limit);}
}
export function cameraHistoryEvents(response,config,start,end=Date.now()){
 const sources=cameraActivitySources(config),events=[];
 if(!Array.isArray(response))return events;
 for(const series of response){
  if(!Array.isArray(series))continue;
  const entity=series.find(row=>row.entity_id)?.entity_id;
  for(const row of series)for(const source of sources.filter(source=>source.entity===entity)){
   const event=cameraActivityEvent(source,row,end);if(event&&event.time>=start)events.push(event);
  }
 }
 return [...new Map(events.map(event=>[event.id,event])).values()].sort((a,b)=>b.time-a.time);
}
export function cameraActionRequest(action,hass){
 if(action.action==='more-info'&&!action.service)return {entity:action.entity};
 let service=action.service;
 if(!service){
  const domain=action.entity.split('.')[0];
  if(action.action==='run'&&domain==='script')service='script.turn_on';
  else if(action.action==='press'&&['button','input_button'].includes(domain))service=domain+'.press';
  else if(['toggle','turn_on','turn_off'].includes(action.action)&&['light','switch','input_boolean','fan','siren','cover','automation'].includes(domain))service=domain+'.'+action.action;
 }
 if(!service)throw Error('Choose an action / Kies een actie');
 const [domain,name]=service.split('.');
 if(!hass?.services?.[domain]?.[name])throw Error('Action unavailable / Actie niet beschikbaar');
 if(action.entity&&(!hass?.states?.[action.entity]||['unavailable','unknown'].includes(hass.states[action.entity].state)))throw Error('Entity unavailable / Entiteit niet beschikbaar');
 return {domain,service:name,data:structuredClone(action.data??{}),target:action.entity?{entity_id:action.entity}:undefined};
}
