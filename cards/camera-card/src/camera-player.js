// Own the native HA card without replacing a running stream on sensor updates.
export class CameraPlayer{
 constructor(container,create,onStatus=()=>{}){this.container=container;this.create=create;this.onStatus=onStatus;this.version=0;}
 update(hass,config,active){
  this.hass=hass;
  const signature=JSON.stringify(config);
  if(!active){this.stop();return;}
  if(this.signature!==signature){this.stop();this.signature=signature;}
  if(this.card){this.card.hass=hass;return;}
  if(this.pending||this.failed)return;
  const version=++this.version;this.pending=true;this.onStatus('loading');
  Promise.resolve().then(()=>this.create(config)).then(card=>{
   if(version!==this.version)return;
   if(!card||card.localName==='hui-error-card')throw Error('Camera card unavailable');
   card.hass=this.hass;
   // The enclosing tile clips the top corners; the feed joins its footer square.
   card.style.setProperty('--ha-card-border-width','0px');card.style.setProperty('--ha-card-border-radius','0px');
   this.container.replaceChildren(card);this.card=card;this.onStatus('ready');
  }).catch(()=>{if(version===this.version){this.failed=true;this.onStatus('error');}}).finally(()=>{if(version===this.version)this.pending=false;});
 }
 stop(){this.version++;this.pending=false;this.failed=false;this.signature=null;this.card?.remove();this.card=null;}
 retry(){this.stop();}
}
