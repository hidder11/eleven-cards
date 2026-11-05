import {carImageUrl} from './car-utils.js';

// Media URLs are authenticated, expiring URLs, not the persisted media-source ID.
export class CarMediaImage {
 constructor(onChange){this.onChange=onChange;this.version=0;}
 reset(){
  this.version++;clearTimeout(this.timer);clearTimeout(this.timeout);
  this.timer=null;this.timeout=null;this.pending=false;this.url=null;this.id=null;this.connection=null;this.expires=0;this.retry=0;
 }
 update(hass,media){
  const id=media?.media_content_id||'',connection=hass?.connection??hass?.callWS;
  if(id!==this.id||connection!==this.connection){this.reset();this.id=id;this.connection=connection;}
  this.hass=hass;this.media=media;
  if(!id)return;
  if(!id.startsWith('media-source://')){this.url=carImageUrl({state:'available',attributes:{entity_picture:id}},hass);return;}
  if(!hass?.callWS)return;
  if(hass.connected===false||hass.connection?.connected===false){
   clearTimeout(this.timer);this.timer=null;
   if(this.pending){this.version++;clearTimeout(this.timeout);this.pending=false;}
   return;
  }
  if(this.pending||Date.now()<this.retry)return;
  if(this.url&&Date.now()<this.expires){if(!this.timer)this._schedule(this.expires-Date.now());return;}
  this._resolve(hass,id);
 }
 _schedule(delay){
  clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;this.update(this.hass,this.media);},delay);
  this.timer.unref?.();
 }
 async _resolve(hass,id){
  const version=++this.version;this.pending=true;
  try{
   const result=await Promise.race([
    Promise.resolve().then(()=>hass.callWS({type:'media_source/resolve_media',media_content_id:id})),
    new Promise((_,reject)=>{this.timeout=setTimeout(()=>reject(new Error('Media timeout')),10000);this.timeout.unref?.();}),
   ]);
   if(version!==this.version)return;
   const url=carImageUrl({state:'available',attributes:{entity_picture:result?.url}},hass);
   if(!url||(result.mime_type&&!result.mime_type.startsWith('image/')))throw new Error('Invalid media image');
   this.url=url;this.expires=Date.now()+23*60*60*1000;this.retry=0;this._schedule(this.expires-Date.now());
  }catch{
   if(version!==this.version)return;
   this.url=null;this.expires=0;this.retry=Date.now()+60000;this._schedule(60000);
  }finally{
   if(version===this.version){clearTimeout(this.timeout);this.timeout=null;this.pending=false;this.onChange();}
  }
 }
}
