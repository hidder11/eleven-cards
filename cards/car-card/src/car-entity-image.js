import {carImageUrl} from './car-utils.js';

// Preload outside the rendered card. Keep the last successfully loaded element
// while an entity URL/token changes, rather than replacing it with a broken img.
export class CarEntityImage {
 constructor(onChange){this.onChange=onChange;this.version=0;this.reset();}
 reset(){
  this._cancel();this.id=null;this.connection=null;this.source=null;this.revision=null;this.image=null;
  this.status='idle';this.attempts=0;this.online=false;this.active=false;
 }
 _cancel(){
  this.version++;clearTimeout(this.timer);clearTimeout(this.timeout);
  this.timer=null;this.timeout=null;
  if(this.pending){this.pending.onload=null;this.pending.onerror=null;}
  this.pending=null;
 }
 update(hass,id,active=true){
  const connection=hass?.connection??hass?.callWS??null;
  if(id!==this.id||connection!==this.connection){this.reset();this.id=id;this.connection=connection;}
  const entity=hass?.states?.[id],source=carImageUrl(entity,hass),revision=entity?.state,online=hass?.connected!==false&&hass?.connection?.connected!==false;
  const changed=source!==this.source||revision!==this.revision,reconnected=online&&!this.online,resumed=active&&!this.active;
  this.hass=hass;this.source=source;this.revision=revision;this.online=online;this.active=active;
  if(!id)return;
  if(!active||!online){this._cancel();this.status=this.image?'ready':'loading';return;}
  if(changed||reconnected||resumed||this.status==='idle')this.retry(false);
 }
 retry(notify=true){
  this._cancel();this.attempts=0;this.status='loading';
  if(this.id&&this.active&&this.online)this._load();
  if(notify)this.onChange();
 }
 _load(){
  this.attempts++;
  const version=++this.version,entity=this.hass?.states?.[this.id],source=carImageUrl(entity,this.hass);
  if(!source){this._failed(version);return;}
  const image=new Image();this.pending=image;
  image.alt='';image.decoding='async';
  image.onload=()=>{
   if(version!==this.version)return;
   this._cancel();this.image=image;this.status='ready';this.attempts=0;this.onChange();
  };
  image.onerror=()=>this._failed(version);
  this.timeout=setTimeout(()=>this._failed(version),10000);this.timeout.unref?.();
  // HA's image proxy keeps its entity URL across image updates. Refresh that
  // resource on retries/revisions without altering external or signed URLs.
  let url=source;
  if(entity.attributes?.entity_picture?.startsWith('/api/image_proxy/')){
   const parsed=new URL(source,globalThis.location?.href??'http://localhost');
   parsed.searchParams.set('_eleven_image',String(Date.now()));
   url=source.startsWith('/')?parsed.pathname+parsed.search:parsed.href;
  }
  image.src=url;
 }
 _failed(version){
  if(version!==this.version)return;
  this._cancel();
  const delay=[1000,4000,15000][this.attempts-1];
  if(delay!=null){
   this.status='loading';this.timer=setTimeout(()=>{this.timer=null;this._load();},delay);this.timer.unref?.();
  }else this.status='error';
  this.onChange();
 }
}
