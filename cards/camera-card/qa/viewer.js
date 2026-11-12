import '../dist/eleven-camera-card.js';
if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{});
class ViewerDemoFeed extends HTMLElement{
 set hass(value){const name=value.states[this.config.entity]?.attributes.friendly_name??this.config.entity;this.textContent='Gesimuleerd camerabeeld · '+name;this.style.cssText='display:grid;place-items:center;min-height:150px;aspect-ratio:16/9;background:linear-gradient(145deg,#254b50,#132531);color:#d4eeef;font:16px system-ui';}
}
customElements.define('viewer-demo-feed',ViewerDemoFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{const feed=document.createElement('viewer-demo-feed');feed.config=config;return feed;}});
const source=document.querySelector('#source'),viewer=document.querySelector('#viewer');
const config={viewer_target:'woonkamer',layout:'grid',columns:1,show_activity:false,cameras:[{entity:'camera.front',name:'Voordeur'}, {entity:'camera.garden',name:'Tuin'}]};
source.setConfig(config);viewer.setConfig({viewer_id:'woonkamer'});
let offline=false;
function update(){const hass={connected:!offline,language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:!document.body.classList.contains('light')},states:{'camera.front':{state:'streaming',attributes:{friendly_name:'Voordeur'}},'camera.garden':{state:'idle',attributes:{friendly_name:'Tuin'}}}};source.hass=hass;viewer.hass=hass;}
update();
document.querySelector('#theme').onclick=()=>{document.body.classList.toggle('light');update();};
document.querySelector('#width').onclick=()=>document.querySelector('.cards').classList.toggle('narrow');
document.querySelector('#offline').onclick=()=>{offline=!offline;update();};
window.viewerQA={source,viewer,config,update};
