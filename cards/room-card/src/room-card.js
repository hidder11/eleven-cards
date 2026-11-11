import {uiButton} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
import {cardThemeStyles} from '../../../shared/card-theme.js';
import {normalizeRoom,roomStatus,temperatureText,humidityText} from './room-utils.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class RoomCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 static getConfigForm(){return {schema:[
  {name:'name',required:true,selector:{text:{}}},
  {name:'icon',selector:{icon:{}}},
  {name:'scenes',selector:{entity:{domain:'scene',multiple:true}}},
  {name:'show_scene_names',selector:{boolean:{}}},
  {name:'lights',selector:{entity:{domain:'light',multiple:true}}},
  {name:'temperature_entity',selector:{entity:{domain:'sensor',device_class:'temperature'}}},
  {name:'humidity_entity',selector:{entity:{domain:'sensor',device_class:'humidity'}}},
  {name:'navigation_path',selector:{text:{}}},
  {name:'note',selector:{text:{}}}
 ],computeLabel:s=>({name:'Ruimtenaam',icon:'Icoon',scenes:'Scenes',show_scene_names:'Tekst bij sceneknoppen',lights:'Lampen (geen groepen én hun leden)',temperature_entity:'Temperatuursensor',humidity_entity:'Luchtvochtigheidssensor',navigation_path:'Pad naar ruimtepagina',note:'Toelichting / testkoppeling'}[s.name]??s.name)};}
 static getStubConfig(){return {name:'Nieuwe ruimte',icon:'mdi:home-outline',lights:[]};}
 setConfig(c){this._config=normalizeRoom(c);this._sceneError=false;this._render();}
 set hass(h){
  const c=this._config,signature=JSON.stringify([h?.connected,h?.connection?.connected,typeof h?.callService,h?.language,h?.locale?.language,c&&[...c.lights,...c.scenes,c.temperature_entity,c.humidity_entity].map(id=>h?.states?.[id])]);this._hass=h;
  // Keep a value snapshot: fixture/custom hosts can mutate their states in place.
  // Always retain the latest hass for actions, including ignored sensor updates.
  if(signature!==this._roomSignature){this._roomSignature=signature;this._render();}
 }get hass(){return this._hass;}
 getCardSize(){return 2;}
 getGridOptions(){return {columns:6,min_columns:6,rows:'auto',min_rows:2};}
 _moreInfo(entityId){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));}
 async _activateScene(entity){
  const hass=this._hass,state=hass?.states?.[entity];
  if(this._scenePending||!this._config.scenes.includes(entity)||!state||state.state==='unavailable'||hass.connected===false||!hass.callService)return;
  this._scenePending=true;this._sceneError=false;this._render();
  try{await hass.callService('scene','turn_on',{entity_id:entity});}catch{this._sceneError=true;}
  finally{this._scenePending=false;const restore=!this.shadowRoot.activeElement;this._render();if(restore)[...this.shadowRoot.querySelectorAll('[data-scene]')].find(button=>button.dataset.scene===entity)?.focus();}
 }
 _render(){
  if(!this._config)return;
  const c=this._config,s=roomStatus(c.lights,this._hass?.states),temp=temperatureText(this._hass?.states?.[c.temperature_entity],this._hass?.locale?.language||'nl-NL');
  const humidity=humidityText(this._hass?.states?.[c.humidity_entity],this._hass?.locale?.language||'nl-NL');
  const focused=this.shadowRoot.activeElement?.className,focusedScene=this.shadowRoot.activeElement?.dataset?.scene;
  const dutch=!this._hass?.language||this._hass.language.startsWith('nl');
  const scenes=c.scenes.length?`<div class="scene-row"><span class="scene-label">Scenes</span><div class="scene-actions" role="group" aria-label="Scenes" aria-busy="${Boolean(this._scenePending)}">${c.scenes.map(entity=>{const state=this._hass?.states?.[entity],name=state?.attributes?.friendly_name||entity,icon=state?.attributes?.icon||'mdi:palette-outline';return uiButton({content:`<ha-icon icon="${esc(icon)}" aria-hidden="true"></ha-icon>${c.show_scene_names?`<span>${esc(name)}</span>`:''}`,label:name,title:name,variant:'action',className:'scene-button room-button',disabled:Boolean(this._scenePending)||!state||state.state==='unavailable'||this._hass?.connected===false||!this._hass?.callService,attrs:{'data-scene':entity}});}).join('')}</div></div>`:'';
  this.shadowRoot.innerHTML=`<style>${uiActionButtonStyles()}
   :host{display:block;min-width:0;height:100%}ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color);border-radius:var(--ha-card-border-radius,16px)}
   .room{padding:var(--eleven-card-padding,16px);min-height:132px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;font-family:inherit}
   .head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.climate{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:4px 10px;margin-inline-start:auto;min-width:0;max-width:100%;font-size:13px;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}.temp,.humidity{white-space:nowrap}
   a,.identity{color:inherit;text-decoration:none;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0;border-radius:4px}a:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
   .name{font-size:16px;font-weight:600;line-height:1.25;letter-spacing:-.01em;overflow-wrap:anywhere}.note{position:relative;display:block;padding-inline-start:8px;font-size:12px;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78);line-height:1.4;overflow-wrap:anywhere}.note::before{content:'';position:absolute;inset-inline-start:0;top:2px;width:2px;height:12px;border-radius:1px;background:var(--accent-color,var(--primary-color,#2196f3))}
   .status{display:flex;align-items:center;gap:6px;font-size:12px;line-height:1.45;color:var(--secondary-text-color);overflow-wrap:anywhere;min-width:0}
   footer{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:auto}.room-button.on{color:color-mix(in srgb,var(--primary-color) 40%,var(--primary-text-color))}.room-button ha-icon{--mdc-icon-size:16px;flex:none;width:16px;height:16px}
   .scene-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px}.scene-label{font-size:12px;line-height:1.45;color:var(--secondary-text-color)}.scene-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px;min-width:0}.scene-actions .scene-button{max-width:100%}.scene-actions .scene-button:has(span){width:auto;padding-inline:8px}.scene-button span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.scene-error{margin:0;font-size:12px;line-height:1.4;color:var(--error-color)}
  ${cardThemeStyles()}</style><ha-card><div class="room"><div class="head">
  ${c.navigation_path?`<a class="identity" href="${esc(c.navigation_path)}" aria-label="Open ${esc(c.name)}">`:'<div class="identity">'}<span class="name">${esc(c.name)}</span>${c.note?`<span class="note">${esc(c.note)}</span>`:''}${c.navigation_path?'</a>':'</div>'}
  ${temp||humidity?`<div class="climate">${temp?`<span class="temp" aria-label="${dutch?'Temperatuur':'Temperature'} ${esc(temp)}">${esc(temp)}</span>`:''}${humidity?`<span class="humidity" aria-label="${dutch?'Luchtvochtigheid':'Humidity'} ${esc(humidity)}">${esc(humidity)}</span>`:''}</div>`:''}</div>
  ${scenes}${this._sceneError?`<p class="scene-error" role="alert">${dutch?'Scene kon niet worden gestart. Probeer opnieuw.':'Could not activate scene. Try again.'}</p>`:''}
  <footer><span class="status">${esc(s.label)}</span>${s.total?`${uiButton({variant:'action-icon',className:`control room-button ${s.on?'on':''}`,label:`Bedien verlichting ${c.name}`,disabled:s.unavailable===s.total,content:'<ha-icon icon="mdi:lightbulb-outline"></ha-icon>'})}`:''}</footer></div></ha-card>`;
  const link=this.shadowRoot.querySelector('a');if(link)link.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'',c.navigation_path);window.dispatchEvent(new Event('location-changed'));};
  const control=this.shadowRoot.querySelector('.control');if(control)control.onclick=()=>this._moreInfo(c.lights.find(id=>!['unknown','unavailable'].includes(this._hass?.states?.[id]?.state)&&this._hass?.states?.[id])||c.lights[0]);
  for(const button of this.shadowRoot.querySelectorAll('[data-scene]'))button.onclick=()=>this._activateScene(button.dataset.scene);
  if(focusedScene)[...this.shadowRoot.querySelectorAll('[data-scene]')].find(button=>button.dataset.scene===focusedScene)?.focus();
  else if(focused)this.shadowRoot.querySelector('.'+focused.split(' ')[0])?.focus();
 }
}
