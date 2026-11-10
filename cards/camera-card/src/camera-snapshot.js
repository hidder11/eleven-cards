// Managed still images use HA authentication; URLs/tokens are never configured or persisted.
export class CameraSnapshot{
 constructor(container,onStatus=()=>{},onLoaded=()=>{},dependencies={}){
  this.container=container;this.onStatus=onStatus;this.onLoaded=onLoaded;this.version=0;
  this.image=dependencies.image??(()=>new Image());this.url=dependencies.url??URL;this.schedule=dependencies.schedule??((callback,ms)=>setTimeout(callback,ms));this.cancel=dependencies.cancel??(id=>clearTimeout(id));
 }
 update(hass,entity,options,active){
  this.hass=hass;this.options=options;
  if(!active){this.stop();return;}
  if(this.entity!==entity){this.stop();this.entity=entity;}
  this.active=true;
  if(this.picture){this.picture.alt=options.alt;this.picture.style.objectFit=options.fit_mode;}
  if(this.interval!==options.interval){this.interval=options.interval;this._schedule();}
  if(!this.picture&&!this.pending&&!this.failed)this.refresh();
 }
 async refresh(){
  if(!this.active||this.pending)return;
  this.pending=true;this.failed=false;const version=++this.version;this.abort=new AbortController();this.onStatus('loading');
  let nextUrl;
  try{
   if(typeof this.hass?.callApiRaw!=='function')throw Error('HA snapshot API unavailable');
   const response=await this.hass.callApiRaw('GET','camera_proxy/'+this.entity+'?time='+Date.now(),undefined,{'Cache-Control':'no-cache'},this.abort.signal);
   if(!response?.ok)throw Error('Image request failed');
   const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('Invalid image response');
   if(version!==this.version)return;
   nextUrl=this.url.createObjectURL(blob);const picture=this.image();picture.alt=this.options.alt;picture.style.objectFit=this.options.fit_mode;
   const loaded=new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=()=>reject(Error('Image decode failed'));this.abort.signal.addEventListener('abort',()=>reject(Error('Aborted')),{once:true});});
   picture.src=nextUrl;await loaded;
   if(version!==this.version)return;
   if(this.options.interactive===false){this.container.replaceChildren(picture);this.button=null;}
   else{const button=document.createElement('button');button.type='button';button.className='camera-snapshot';button.dataset.cameraDetails=this.entity;button.append(picture);this.container.replaceChildren(button);this.button=button;}
   this.picture=picture;
   if(this.currentUrl)this.url.revokeObjectURL(this.currentUrl);this.currentUrl=nextUrl;nextUrl=null;
   this.lastLoaded=Date.now();this.onLoaded(this.lastLoaded);this.onStatus('ready');
  }catch{if(version===this.version){this.failed=true;this.onStatus('error');}}
  finally{if(nextUrl)this.url.revokeObjectURL(nextUrl);if(version===this.version){this.pending=false;this.abort=null;this._schedule();}}
 }
 _schedule(){if(this.timer!=null)this.cancel(this.timer);this.timer=null;if(this.active&&this.interval>0&&!this.pending)this.timer=this.schedule(()=>{this.timer=null;this.refresh();},Math.max(5,this.interval)*1000);}
 stop(){
  this.active=false;this.version++;this.abort?.abort();this.abort=null;this.pending=false;this.failed=false;
  if(this.timer!=null)this.cancel(this.timer);this.timer=null;this.interval=null;this.entity=null;
  if(this.button)this.button.remove();else this.picture?.remove();this.button=null;this.picture=null;if(this.currentUrl)this.url.revokeObjectURL(this.currentUrl);this.currentUrl=null;this.lastLoaded=null;
 }
}
