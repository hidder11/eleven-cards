import {uiEscape} from '../../../shared/ui-button.js';
import {uiTabs,bindUITabs} from '../../../shared/ui-tabs.js';
import {headerAtmosphere} from '../../../shared/header-atmosphere.js';
import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
import {cameraStyles} from '../src/camera-styles.js';
import {cameraSecurityHeader,cameraSecurityMetrics,cameraSecurityTabs,cameraContactList,cameraDetectionIndicators} from '../src/camera-security.js';
import {cameraDetections} from '../src/camera-utils.js';
import {securityDesignConfig as config,securityDesignHass} from './security-design-data.js';
import {scene} from './security-scene.js';

// Design studies only: no HA connection, service calls or real camera feeds.
const t=nl=>nl;
const modes=[['disarmed','Uit','shield-off'],['armed_home','Thuis','home'],['armed_away','Afwezig','shield'],['armed_night','Nacht','moon']];
const modeLabel=mode=>modes.find(row=>row[0]===mode)?.[1]??'Onbekend';
const icon=kind=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
 expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
 'shield-off':'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 9 8 8M16 9l-8 8"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
 }[kind]??''}</svg>`;
let sequence=0;
class SecurityRefinement extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.idKey='refinement-'+(++sequence);this.scenario='person';this.background='lanes';this.alarm='disarmed';this.selectedMode='armed_away';this.tab='cameras';this.pin=true;this.busy=false;this.error='';}
 connectedCallback(){this.render();}
 disconnectedCallback(){this.tabs?.disconnect();clearTimeout(this.timer);}
 get variant(){return this.getAttribute('variant');}
 get available(){return this.scenario!=='unknown';}
 get hass(){const hass=securityDesignHass(this.scenario,document.body.classList.contains('light'));if(this.available)hass.states[config.alarm_entity].state=this.busy?'arming':this.alarm;return hass;}
 alarmButtons(rows,kind='modes'){
  return `<div class="${kind}" aria-label="Alarmstand">${rows.map(([mode,label,glyph])=>`<button type="button" data-mode="${mode}" aria-pressed="${this.alarm===mode}" ${!this.available||this.busy?'disabled':''}>${icon(glyph)}<span>${label}</span>${this.alarm===mode?'<span class="chosen" aria-hidden="true">'+icon('check')+'</span>':''}</button>`).join('')}</div>`;
 }
 alarmControls(){
  const disabled=!this.available||this.busy,status=this.available?(this.busy?'Opdracht verwerken…':this.alarm==='disarmed'?'Alarm uit':'Ingeschakeld · '+modeLabel(this.alarm)):'Alarm niet beschikbaar';
  let controls;
  if(this.variant==='rail')controls=this.alarmButtons(modes.slice(0,3));
  else if(this.variant==='overlay')controls=`<div class="mode-picker" aria-label="Stand bij inschakelen">${modes.slice(1).map(([mode,label,glyph])=>`<button data-select="${mode}" aria-pressed="${mode===this.selectedMode}" ${disabled||this.alarm!=='disarmed'?'disabled':''}>${icon(glyph)}${label}</button>`).join('')}</div><button class="primary" data-mode="${this.alarm==='disarmed'?this.selectedMode:'disarmed'}" ${disabled?'disabled':''}>${icon(this.alarm==='disarmed'?'shield':'shield-off')}<span>${this.alarm==='disarmed'?'Inschakelen':'Uitschakelen'}</span></button>`;
  else controls=`<button class="manage" data-manage ${disabled?'disabled':''}>${icon(this.alarm==='disarmed'?'shield':'shield-off')}<span>${this.alarm==='disarmed'?'Inschakelen':'Alarm bedienen'}</span>${icon('chevron')}</button>`;
  return `<section class="alarm-surface ${this.variant}" aria-label="Alarmbediening"><div class="alarm-status"><span>Alarm</span><strong role="status">${status}</strong></div>${controls}<p class="alarm-feedback" role="status">${uiEscape(this.error)}</p></section>`;
 }
 image(row){return this.available?scene(row.entity==='camera.garden'):'<div class="unavailable">Camerabeeld niet beschikbaar</div>';}
 tile(row){
  const name=uiEscape(row.name),detectors=cameraDetectionIndicators(cameraDetections(this.hass,row).entries,t);
  return `<section class="feed ${this.variant}"><button class="feed-picture" data-camera="${row.entity}" aria-label="Camera openen: ${name}">${this.image(row)}</button><div class="feed-info"><strong>${name}</strong><div class="feed-actions"><div class="detectors">${detectors}</div><button class="expand" data-camera="${row.entity}" aria-label="Vergroten: ${name}" title="Vergroten">${icon('expand')}</button></div></div></section>`;
 }
 render(){
  this.tabs?.disconnect();
  const items=cameraSecurityTabs({...config,show_activity:false},t).map(item=>({...item,content:item.value==='cameras'?`<div class="feeds">${config.cameras.map(row=>this.tile(row)).join('')}</div>`:`<div class="camera-contact-surfaces">${cameraContactList(config,this.hass,t,item.value,new Map([['binary_sensor.front_door',Date.parse('2026-10-28T12:22:00Z')]]))}</div>`}));
  this.shadowRoot.innerHTML=`<style>${cameraStyles}${styles}</style><ha-card><div class="content" data-dark="${!document.body.classList.contains('light')}" data-color="waiting" data-background="${this.background}" data-animated="false"><div class="header-region"><div class="scene-background" aria-hidden="true">${headerAtmosphere(this.background)}</div><header class="camera-security-header">${cameraSecurityHeader(config,this.hass,t)}</header>${this.alarmControls()}<div class="camera-security-metrics">${cameraSecurityMetrics(config,this.hass,t)}</div></div><div class="camera-security-tabs">${uiTabs({id:this.idKey,label:'Beveiliging',variant:'card',selected:this.tab,items})}</div></div></ha-card><dialog class="alarm-dialog" aria-label="Alarm bedienen"></dialog><dialog class="viewer" aria-label="Camerabeeld"></dialog>`;
  const root=this.shadowRoot;
  this.tabs=bindUITabs({tabs:root.querySelectorAll('[data-ui-tab]'),panels:root.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>this.tab=value});
  root.querySelectorAll('[data-security-contacts]').forEach(button=>button.onclick=()=>this.tabs.select(button.dataset.securityContacts,{focus:true}));
  root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{if(this.alarm!==button.dataset.mode)this.openAlarm(button.dataset.mode,button);});
  root.querySelectorAll('[data-select]').forEach(button=>button.onclick=()=>{this.selectedMode=button.dataset.select;this.render();root.querySelector(`[data-select="${this.selectedMode}"]`).focus();});
  root.querySelector('[data-manage]')?.addEventListener('click',event=>this.openAlarm('',event.currentTarget));
  root.querySelectorAll('[data-camera]').forEach(button=>button.onclick=()=>this.openCamera(button.dataset.camera,button));
  root.querySelectorAll('[data-camera-details]').forEach(button=>button.onclick=()=>{button.title=button.getAttribute('aria-label');});
 }
 openAlarm(mode,opener){
  if(!this.available||this.busy)return;
  this.opener=opener;const dialog=this.shadowRoot.querySelector('.alarm-dialog');this.targetMode=mode;
  const modeChoices=this.variant==='detail'?`<div class="dialog-choices">${modes.map(([value,label,glyph])=>`<button type="button" data-choice="${value}" aria-pressed="${value===(mode||this.alarm)}">${icon(glyph)}${label}</button>`).join('')}</div>`:'';
  dialog.innerHTML=`<form><header><div><small>ALARM BEDIENEN</small><h2>${mode?mode==='disarmed'?'Alarm uitschakelen':'Inschakelen · '+modeLabel(mode):'Kies een alarmstand'}</h2></div><button type="button" data-close aria-label="Sluiten">${icon('close')}</button></header>${modeChoices}<p>Dit is een ontwerpvoorbeeld. Er wordt geen echte alarmopdracht verstuurd.</p>${this.pin?'<label class="pin-label">Pincode<input name="code" type="password" inputmode="numeric" autocomplete="off" required aria-describedby="pin-help"><small id="pin-help">Demopincode: 1234</small></label>':''}<p class="dialog-error" role="alert"></p><footer><button type="button" data-cancel>Annuleren</button><button class="primary" type="submit">${mode==='disarmed'?'Uitschakelen':'Bevestigen'}</button></footer></form>`;
  if(!mode)this.targetMode=this.alarm;
  dialog.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{this.targetMode=button.dataset.choice;dialog.querySelectorAll('[data-choice]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));dialog.querySelector('button[type="submit"]').textContent=this.targetMode==='disarmed'?'Uitschakelen':'Inschakelen · '+modeLabel(this.targetMode);});
  dialog.querySelectorAll('[data-close],[data-cancel]').forEach(button=>button.onclick=()=>dialog.close());
  dialog.querySelector('form').onsubmit=event=>{
   event.preventDefault();if(this.targetMode===this.alarm){dialog.close();return;}
   const input=dialog.querySelector('input');
   if(this.pin&&input.value!=='1234'){input.setAttribute('aria-invalid','true');dialog.querySelector('.dialog-error').textContent='Pincode onjuist. Probeer 1234.';input.focus();return;}
   const target=this.targetMode;dialog.close();this.busy=true;this.error='';this.render();
   this.timer=setTimeout(()=>{this.busy=false;if(this.scenario==='error')this.error='Opdracht mislukt. Probeer opnieuw.';else this.alarm=target;this.render();(this.shadowRoot.querySelector(`[data-mode="${target}"]`)??this.shadowRoot.querySelector('[data-manage]')??this.shadowRoot.querySelector('.primary'))?.focus();},650);
  };
  dialog.onclose=()=>opener.focus({preventScroll:true});dialog.showModal();(dialog.querySelector('input')??dialog.querySelector('[data-choice]')??dialog.querySelector('[data-close]')).focus();
 }
 openCamera(entity,opener){
  const row=config.cameras.find(row=>row.entity===entity),dialog=this.shadowRoot.querySelector('.viewer');
  dialog.innerHTML=`<header><h2>${uiEscape(row.name)}</h2><button data-close aria-label="Camerabeeld sluiten">${icon('close')}</button></header>${this.image(row)}<p>Getekend voorbeeldbeeld</p>`;
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>opener.focus({preventScroll:true});dialog.showModal();
 }
}

const styles=`
:host{display:block;container-type:inline-size}*{box-sizing:border-box}ha-card{height:auto}button,input{font:inherit}button{cursor:pointer;color:inherit}button:disabled{cursor:default;opacity:.45}button:focus-visible,input:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}button:hover:not(:disabled){filter:brightness(1.12)}svg{display:block;flex:none;width:20px;height:20px}button>svg{pointer-events:none}.content{padding:16px;--eleven-card-padding:16px}.camera-primary{--ui-primary-size:48px}.camera-security-header{padding-bottom:20px}.camera-security-metrics{margin-bottom:0}
.alarm-surface{position:relative;padding:12px;margin-bottom:12px;border-radius:8px;background:color-mix(in srgb,var(--primary-color) 5%,transparent);box-shadow:var(--eleven-surface-shadow)}.alarm-status{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}.alarm-status>span{font-size:11px;color:var(--secondary-text-color)}.alarm-status strong{font-size:12px;font-weight:500;text-align:end}.modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.modes button{position:relative;display:grid;place-items:center;gap:6px;min-height:66px;border:1px solid var(--divider-color);border-radius:7px;background:var(--ha-card-background);font-size:11px}.modes button[aria-pressed=true]{background:color-mix(in srgb,var(--primary-color) 14%,var(--ha-card-background));border-color:var(--primary-color);color:var(--primary-color)}.chosen{position:absolute;top:5px;right:5px}.chosen svg{width:11px;height:11px}.alarm-feedback:empty{display:none}.alarm-feedback{font-size:11px;color:var(--error-color);margin:10px 0 0}.mode-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;padding:3px;margin-bottom:10px;background:var(--ha-card-background);border-radius:7px}.mode-picker button{border:0;border-radius:5px;background:transparent;font-size:11px;min-height:40px;display:flex;align-items:center;justify-content:center;gap:5px}.mode-picker svg{width:16px;height:16px}.mode-picker button[aria-pressed=true]{background:var(--secondary-background-color);color:var(--primary-color)}.primary{display:flex;align-items:center;justify-content:center;gap:9px;min-height:44px;width:100%;border:1px solid var(--primary-color);border-radius:7px;background:color-mix(in srgb,var(--primary-color) 16%,var(--ha-card-background));color:var(--primary-color);font-size:12px;font-weight:600}.manage{display:flex;align-items:center;gap:10px;min-height:44px;width:100%;padding:8px 10px;border:1px solid var(--divider-color);border-radius:7px;background:var(--ha-card-background);font-size:12px}.manage>svg:last-child{margin-left:auto;width:16px}
.feeds{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.feed{min-width:0;overflow:hidden;border-radius:8px;background:color-mix(in srgb,var(--primary-color) 5%,transparent);box-shadow:var(--eleven-surface-shadow)}.feed-picture{display:block;width:100%;padding:0;border:0;background:#263a42}.scene{display:block;width:100%;height:auto;aspect-ratio:16/9}.feed-info{padding:8px 10px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px}.feed-info strong{min-width:0;font-size:12px;font-weight:500;overflow-wrap:anywhere}.feed-actions{display:flex;align-items:center;margin-left:auto;gap:2px}.detectors{display:flex}.expand,.camera-detection-indicator{display:grid;place-items:center;padding:6px;width:28px;height:32px;min-height:32px;min-width:28px;border:0;background:none;color:var(--secondary-text-color)}.expand svg,.camera-detection-symbol svg{width:17px;height:17px}.camera-detection-indicator[data-detection-state=active]{color:var(--warning-color)}.camera-detection-indicator[data-detection-state=unknown]{opacity:.5}.camera-detection-symbol{display:block}.feed.overlay{position:relative;background:#263a42}.feed.overlay .feed-info{position:absolute;inset:auto 0 0;padding:24px 10px 6px;background:linear-gradient(transparent,#09131be8);pointer-events:none;color:#fff}.feed.overlay .feed-info button{pointer-events:auto;color:#dce4ec}.feed.overlay .feed-info .camera-detection-indicator[data-detection-state=active]{color:#ffd28e}.feed.overlay .scene{aspect-ratio:4/3;object-fit:cover}.feed.detail .scene{aspect-ratio:4/3;object-fit:cover}.feed.detail .feed-info{display:block;padding:10px 12px 6px}.feed.detail .feed-actions{justify-content:space-between;margin-top:6px;padding-top:5px;border-top:1px solid var(--divider-color)}.feed.detail .detectors{gap:6px}.unavailable{display:grid;place-items:center;min-height:120px;aspect-ratio:16/9;font-size:11px;line-height:1.5;color:var(--secondary-text-color);background:var(--secondary-background-color);padding:12px;text-align:center}.feed.overlay .unavailable{padding-bottom:60px;aspect-ratio:4/3}
dialog{padding:20px;border:1px solid var(--divider-color);border-radius:12px;background:var(--ha-card-background);color:var(--primary-text-color);width:min(400px,calc(100vw - 24px));max-width:none;max-height:calc(100dvh - 24px);overflow:auto;box-shadow:0 20px 80px #0006}dialog::backdrop{background:#080f18cc}dialog:not([open]){display:none}dialog header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}dialog h2{margin:4px 0;font-size:18px;font-weight:550}dialog header small{font-size:9px;letter-spacing:.12em;color:var(--secondary-text-color)}dialog header button{display:grid;place-items:center;width:40px;height:40px;flex:none;border:0;border-radius:6px;background:var(--secondary-background-color)}dialog p{font-size:12px;line-height:1.6;color:var(--secondary-text-color);margin:12px 0}.pin-label{display:grid;gap:8px;font-size:12px;margin-top:20px}.pin-label input{width:100%;padding:10px 12px;min-height:44px;background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:6px;color:var(--primary-text-color)}.pin-label small{font-size:11px;color:var(--secondary-text-color)}.dialog-error{color:var(--error-color)}dialog footer{display:flex;justify-content:end;gap:8px;margin-top:20px}dialog footer button{width:auto;min-height:44px;padding:8px 14px;border:1px solid var(--divider-color);border-radius:7px;background:var(--secondary-background-color)}.dialog-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.dialog-choices button{display:flex;align-items:center;gap:10px;border:1px solid var(--divider-color);border-radius:7px;background:var(--secondary-background-color);min-height:48px;padding:10px;font-size:12px}.dialog-choices button[aria-pressed=true]{border-color:var(--primary-color);color:var(--primary-color)}.viewer{width:min(1000px,calc(100vw - 24px));padding:0}.viewer header{padding:12px 16px;margin:0}.viewer>.scene{max-height:70dvh;object-fit:contain;background:#16222c}.viewer>p{padding:0 16px}.viewer .unavailable{aspect-ratio:auto;min-height:240px}
.feed.rail .feed-info{padding:6px 8px;gap:2px}.feed.rail .feed-actions{gap:0}
.feed.overlay .feed-info{padding:24px 8px 6px;gap:2px;flex-wrap:nowrap}.feed.overlay .feed-info strong{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.feed.overlay .feed-actions{gap:0;flex-shrink:0}
@container(max-width:340px){.feeds{grid-template-columns:minmax(0,1fr)}.camera-primary{--ui-primary-size:40px}.feed.overlay .scene{aspect-ratio:16/9}.mode-picker button{flex-direction:column;gap:4px;padding:6px 2px}.alarm-status{gap:6px}.alarm-status strong{font-size:11px}}
`;
if(!customElements.get('security-refinement'))customElements.define('security-refinement',SecurityRefinement);
const cards=[...document.querySelectorAll('security-refinement')];
document.querySelector('#scenario').onchange=event=>cards.forEach(card=>{clearTimeout(card.timer);card.busy=false;card.error='';card.scenario=event.target.value;card.render();});
document.querySelector('#width').onchange=event=>document.querySelector('.examples').dataset.width=event.target.value;
document.querySelector('#theme').onchange=event=>{document.body.classList.toggle('light',event.target.value==='light');cards.forEach(card=>card.render());};
document.querySelector('#pin').onchange=event=>cards.forEach(card=>{card.pin=event.target.value==='yes';});
const backgrounds=document.querySelector('#background');backgrounds.innerHTML=headerBackgroundOptions('nl').map(item=>`<option value="${uiEscape(item.value)}">${uiEscape(item.label)}</option>`).join('');backgrounds.value='lanes';
backgrounds.onchange=event=>cards.forEach(card=>{card.background=event.target.value;card.render();});
document.querySelectorAll('[data-demo-alarm]').forEach(button=>button.onclick=()=>{const card=cards.find(card=>card.variant===button.dataset.demoAlarm);card.openAlarm(card.variant==='detail'?'':card.alarm==='disarmed'?card.selectedMode:'disarmed',button);});
document.querySelectorAll('[data-demo-camera]').forEach(button=>button.onclick=()=>cards.find(card=>card.variant===button.dataset.demoCamera).openCamera('camera.front',button));
