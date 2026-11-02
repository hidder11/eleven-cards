import {cardThemeStyles} from '../../../shared/card-theme.js';
import {normalizeRoom,roomStatus,temperatureText} from './room-utils.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class RoomCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 static getConfigForm(){return {schema:[
  {name:'name',required:true,selector:{text:{}}},
  {name:'icon',selector:{icon:{}}},
  {name:'lights',selector:{entity:{domain:'light',multiple:true}}},
  {name:'temperature_entity',selector:{entity:{domain:'sensor',device_class:'temperature'}}},
  {name:'navigation_path',selector:{text:{}}},
  {name:'note',selector:{text:{}}}
 ],computeLabel:s=>({name:'Ruimtenaam',icon:'Icoon',lights:'Lampen (geen groepen én hun leden)',temperature_entity:'Temperatuursensor',navigation_path:'Pad naar ruimtepagina',note:'Toelichting / testkoppeling'}[s.name]??s.name)};}
 static getStubConfig(){return {name:'Nieuwe ruimte',icon:'mdi:home-outline',lights:[]};}
 setConfig(c){this._config=normalizeRoom(c);this._render();}
 set hass(h){this._hass=h;this._render();}get hass(){return this._hass;}
 getCardSize(){return 2;}
 getGridOptions(){return {columns:6,min_columns:6,rows:'auto',min_rows:2};}
 _moreInfo(entityId){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));}
 _render(){
  if(!this._config)return;
  const c=this._config,s=roomStatus(c.lights,this._hass?.states),temp=temperatureText(this._hass?.states?.[c.temperature_entity],this._hass?.locale?.language||'nl-NL');
  const focused=this.shadowRoot.activeElement?.className;
  this.shadowRoot.innerHTML=`<style>
   :host{display:block;min-width:0;height:100%}ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color);border-radius:var(--ha-card-border-radius,16px)}
   .room{padding:14px 16px 10px;min-height:132px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;font-family:inherit}
   .head{display:flex;align-items:center;justify-content:space-between;gap:8px}.room-icon{color:var(--primary-color);--mdc-icon-size:24px}.temp{font-size:13px;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}
   a,.identity{color:inherit;text-decoration:none;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0;border-radius:4px}a:focus-visible,button:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
   .name{font-size:16px;font-weight:600;line-height:1.35;overflow-wrap:anywhere}.note{font-size:11px;color:var(--secondary-text-color);line-height:1.4;overflow-wrap:anywhere}
   .status{display:flex;align-items:center;gap:6px;font-size:12px;line-height:1.45;color:var(--secondary-text-color);overflow-wrap:anywhere;min-width:0}.status ha-icon{--mdc-icon-size:17px;flex-shrink:0}.status.warning{color:var(--primary-text-color)}.status.warning ha-icon{color:var(--warning-color,var(--primary-text-color))}
   footer{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:auto}button{appearance:none;flex-shrink:0;display:grid;place-items:center;min-width:44px;min-height:44px;border:0;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer}button.on{background:var(--primary-color);color:var(--text-primary-color,#fff)}button:disabled{opacity:.45;cursor:default}button ha-icon{--mdc-icon-size:20px}
  ${cardThemeStyles({controls:'.control:not(.on)',selected:'.control.on'})}</style><ha-card><div class="room"><div class="head"><ha-icon class="room-icon" icon="${esc(c.icon)}"></ha-icon>${temp?`<span class="temp">${esc(temp)}</span>`:''}</div>
  ${c.navigation_path?`<a class="identity" href="${esc(c.navigation_path)}" aria-label="Open ${esc(c.name)}">`:'<div class="identity">'}<span class="name">${esc(c.name)}</span>${c.note?`<span class="note">${esc(c.note)}</span>`:''}${c.navigation_path?'</a>':'</div>'}
  <footer><span class="status ${s.unavailable?'warning':''}">${s.unavailable?'<ha-icon icon="mdi:alert-circle-outline"></ha-icon>':''}${esc(s.label)}</span>${s.total?`<button class="control ${s.on?'on':''}" type="button" aria-label="Bedien verlichting ${esc(c.name)}" ${s.unavailable===s.total?'disabled':''}><ha-icon icon="mdi:lightbulb-outline"></ha-icon></button>`:''}</footer></div></ha-card>`;
  const link=this.shadowRoot.querySelector('a');if(link)link.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'',c.navigation_path);window.dispatchEvent(new Event('location-changed'));};
  const control=this.shadowRoot.querySelector('button');if(control)control.onclick=()=>this._moreInfo(c.lights.find(id=>!['unknown','unavailable'].includes(this._hass?.states?.[id]?.state)&&this._hass?.states?.[id])||c.lights[0]);
  if(focused)this.shadowRoot.querySelector('.'+focused.split(' ')[0])?.focus();
 }
}
