import {HEADER_BACKGROUNDS} from '../../../shared/header-backgrounds.js';
import {CAMERA_LAYOUTS,cameraEntity,cameraSnapshotInterval,normalizeCameraFeatures} from './camera-features.js';

export const CAMERA_COLORS=[{value:'charging',label:'Goud / Gold'},{value:'waiting',label:'Blauw / Blue'},{value:'done',label:'Groen / Green'},{value:'planned',label:'Paars / Purple'},{value:'off',label:'Grijs / Gray'}];
export const cameraDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
export const CAMERA_RATIOS=['16:9','4:3','1:1','21:9','9:16'];
export const visibleCameras=config=>config.cameras.filter(row=>row.show!==false);
export function normalizeCameraConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid camera configuration');
 const source=input.cameras??(input.entity?[input.entity]:[]);
 if(!Array.isArray(source))throw Error('Cameras must be a list / Camera’s moeten een lijst zijn');
 const used=new Set(),cameras=source.map(row=>{
  const entity=typeof row==='string'?row:row?.entity;
  if(typeof entity!=='string'||!/^camera\.[a-z0-9_]+$/.test(entity))throw Error('Choose camera entities / Kies camera-entiteiten');
  if(used.has(entity))throw Error('Duplicate camera / Dubbele camera: '+entity);
  used.add(entity);
  const item={entity,name:typeof row?.name==='string'?row.name:''};
  if(row&&typeof row==='object'){
   if(row.show===false)item.show=false;
   if(typeof row.icon==='string'&&/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(row.icon))item.icon=row.icon;
   if(CAMERA_RATIOS.includes(row.aspect_ratio))item.aspect_ratio=row.aspect_ratio;
   if(['cover','contain'].includes(row.fit_mode))item.fit_mode=row.fit_mode;
   if(['auto','live'].includes(row.camera_view))item.camera_view=row.camera_view;
   if(cameraEntity(row.privacy_entity,['switch','input_boolean','binary_sensor'])){item.privacy_entity=row.privacy_entity;item.privacy_state=row.privacy_state==='off'?'off':'on';}
   if(row.snapshot_interval!=null&&row.snapshot_interval!=='')item.snapshot_interval=cameraSnapshotInterval(row.snapshot_interval);
   for(const field of ['motion_entity','person_entity','last_detection_entity']){
    const value=row[field],domain=field==='last_detection_entity'?'sensor':'binary_sensor';
    if(typeof value==='string'&&new RegExp('^'+domain+'\\.[a-z0-9_]+$').test(value))item[field]=value;
   }
  }
  return item;
 });
 const {activity_limit:legacyLimit,...settings}=input;
 return {...settings,...normalizeCameraFeatures(input,cameras),cameras,title:typeof input.title==='string'?input.title:'',layout:CAMERA_LAYOUTS.includes(input.layout)?input.layout:'grid',
  columns:[1,2,3].includes(Number(input.columns))?Number(input.columns):'auto',camera_view:input.camera_view==='auto'?'auto':'live',
  aspect_ratio:CAMERA_RATIOS.includes(input.aspect_ratio)?input.aspect_ratio:'16:9',fit_mode:input.fit_mode==='contain'?'contain':'cover',
  show_status:input.show_status!==false,show_last_detection:input.show_last_detection!==false,show_navigation:input.show_navigation!==false,show_fullscreen:input.show_fullscreen!==false,
  auto_cycle:input.auto_cycle===true,cycle_interval:Number.isFinite(Number(input.cycle_interval))?Math.max(5,Math.min(3600,Number(input.cycle_interval))):10,
  show_names:input.show_names!==false,compact:(input.compact??(input.density==='compact'))===true,
  color:CAMERA_COLORS.some(item=>item.value===input.color)?input.color:'charging',
  background:HEADER_BACKGROUNDS.some(item=>item.value===input.background)?input.background:'lanes',
  background_strength:input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength))),
  animate_background:input.animate_background!==false,
  default_camera:cameras.some(row=>row.show!==false&&row.entity===input.default_camera)?input.default_camera:(cameras.find(row=>row.show!==false)?.entity??'')};
}
export function cameraUnavailable(hass,entity){
 if(hass?.connected===false||hass?.connection?.connected===false)return 'offline';
 const state=hass?.states?.[entity];
 if(!state)return 'missing';
 return ['unavailable','unknown','off'].includes(state.state)?state.state:null;
}
export function cameraPictureConfig(entity,config){
 const row=config.cameras?.find(row=>row.entity===entity)??{};
 return {type:'picture-entity',entity,camera_view:row.camera_view??config.camera_view,aspect_ratio:row.aspect_ratio??config.aspect_ratio,fit_mode:row.fit_mode??config.fit_mode,
  show_name:false,show_state:false,tap_action:{action:'more-info'},hold_action:{action:'none'},double_tap_action:{action:'none'}};
}

export function nextCamera(config,current,direction=1,hass,skipUnavailable=false){
 const rows=visibleCameras(config).filter(row=>!skipUnavailable||!cameraUnavailable(hass,row.entity));
 if(!rows.length)return current;
 const index=rows.findIndex(row=>row.entity===current);
 return rows[index<0?0:(index+direction+rows.length)%rows.length].entity;
}

// Only an ON transition is a detection. An OFF last_changed is its clearing time.
export function cameraDetections(hass,row,cache=new Map(),now=Date.now()){
 const valid=value=>{const time=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(time)&&time<=now?time:null;};
 const entries=['motion_entity','person_entity'].filter(field=>row[field]).map(field=>{
  const entity=row[field],state=hass?.states?.[entity],available=hass?.connected!==false&&hass?.connection?.connected!==false&&['on','off'].includes(state?.state);
  if(available&&state.state==='on'){
   const time=valid(state.last_changed);if(time!==null)cache.set(entity,Math.max(cache.get(entity)??0,time));
  }
  return {kind:field==='motion_entity'?'motion':'person',entity,active:available&&state.state==='on',available};
 });
 const times=entries.map(entry=>cache.get(entry.entity)).filter(Number.isFinite);
 const last=row.last_detection_entity?valid(hass?.states?.[row.last_detection_entity]?.state):(times.length?Math.max(...times):null);
 return {entries,last};
}

// Stable across frequent hass updates; only explicit interaction resets the interval.
export class CameraCycle{
 constructor(advance,schedule=(callback,ms)=>setInterval(callback,ms),cancel=id=>clearInterval(id)){this.advance=advance;this.schedule=schedule;this.cancel=cancel;}
 sync(enabled,seconds){
  const key=enabled?seconds:0;if(key===this.key)return;this.stop();this.key=key;
  if(enabled)this.timer=this.schedule(this.advance,seconds*1000);
 }
 stop(){if(this.timer!=null)this.cancel(this.timer);this.timer=null;this.key=0;}
}
