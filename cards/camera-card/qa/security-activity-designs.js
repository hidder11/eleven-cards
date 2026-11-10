import {CameraCard} from '../src/camera-card.js';
import {CameraActivity} from '../src/camera-features.js';
import {cameraVisibleEvents} from '../src/camera-security.js';
import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {scene} from './security-scene.js';
import './fixture-icons.js';

// Isolated source-card studies: synthetic Recorder records, drawn feeds, no network.
class ActivityStudyFeed extends HTMLElement{
 set hass(value){if(this.childNodes.length)return;this.innerHTML=scene(this.config.entity==='camera.garden');this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}
}
if(!customElements.get('activity-study-feed'))customElements.define('activity-study-feed',ActivityStudyFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{const feed=document.createElement('activity-study-feed');feed.config=config;return feed;}});
const dateFormat=new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',day:'2-digit',month:'2-digit',year:'numeric'});
const clockFormat=new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit'});
const dayKey=time=>dateFormat.format(time),clock=time=>clockFormat.format(time);
const dayLabel=time=>dayKey(time)===dayKey(Date.now())?'Vandaag':dayKey(time)===dayKey(Date.now()-86400000)?'Gisteren':dayKey(time);
const symbols={person:'mdi:account-outline',motion:'mdi:motion-sensor',door:'mdi:door',window:'mdi:window-closed-variant'};
function records(){
 const now=Date.now(),list=[['binary_sensor.front_person',90,1],['binary_sensor.front_motion',95,1],['binary_sensor.front_door',600,40],['binary_sensor.kitchen',1800,90],['binary_sensor.garden_motion',3600,2],['binary_sensor.front_person',7200,1],['binary_sensor.front_door',80000,60],['binary_sensor.kitchen',81000,120]];
 const groups=new Map();
 for(const [entity,ago,length] of list){if(!groups.has(entity))groups.set(entity,[{entity_id:entity,state:'off',last_changed:new Date(now-90000000).toISOString()}]);const rows=groups.get(entity);rows.push({entity_id:entity,state:'on',last_changed:new Date(now-ago*1000).toISOString()},{entity_id:entity,state:'off',last_changed:new Date(now-(ago-length)*1000).toISOString()});}
 return [...groups.values()].map(rows=>rows.sort((a,b)=>Date.parse(a.last_changed)-Date.parse(b.last_changed)));
}
class SecurityActivityStudy extends CameraCard{
 constructor(){super();this.scenario='person';this._securityView='activity';this.background='lanes';this.studyAlarm='disarmed';}
 connectedCallback(){super.connectedCallback();this.refreshStudy();}
 refreshStudy(){
  const config=structuredClone(securityDesignConfig);config.activity_source='history';config.activity_hours=24;config.activity_limit=20;config.background=this.background;
  if(this.scenario==='long'){config.cameras[0].name='Voordeur en toegang naast de garage';config.door_sensors[0].name='Dubbele toegangsdeur bij de bijkeuken';}
  this._historyVersion++;this._historyKey=null;this._historyLoading=false;this._historyError=false;this._activity=new CameraActivity();
  this.setConfig(config);
  const hass=securityDesignHass(this.scenario==='unknown'?'offline':this.scenario,document.body.classList.contains('light'));
  hass.states[config.alarm_entity]={state:this.studyAlarm,attributes:{supported_features:55,code_format:'number',code_arm_required:true}};
  hass.callApi=async()=>{if(this.scenario==='error')throw Error('Synthetic Recorder error');return this.scenario==='empty'?[]:records();};
  hass.callService=async(domain,service,data)=>{if(domain!=='alarm_control_panel'||(service==='alarm_disarm'&&data.code!=='1234'))throw Error('Synthetic alarm command rejected');this.studyAlarm=service==='alarm_disarm'?'disarmed':service.replace('alarm_arm_','armed_');this.hass={...this.hass,states:{...this.hass.states,[config.alarm_entity]:{...this.hass.states[config.alarm_entity],state:this.studyAlarm}}};};
  this.hass=hass;
 }
 _renderActivity(){
  super._renderActivity();if(!this._featureShell||this._securityView!=='activity')return;
  if(!this.shadowRoot.querySelector('[data-study-style]')){const style=document.createElement('style');style.dataset.studyStyle='';style.textContent=styles;this.shadowRoot.append(style);}
  this.shadowRoot.querySelector('.camera-activity').dataset.study=this.getAttribute('variant');
  const events=cameraVisibleEvents(this._activity.events,this._config,{camera:this._activityCamera,kind:this._activityKind,since:Date.now()-this._config.activity_hours*3600000}),node=this.shadowRoot.querySelector('.camera-activity-list');
  const all=this.shadowRoot.querySelector('[data-activity-filter="kind"] option[value=""]');if(all)all.textContent='Alle gebeurtenissen';
  const types={motion:'Beweging gedetecteerd',person:'Persoon gedetecteerd',door:'Deur',window:'Raam'};
  if(!events.length){
   if(this.hass?.connected===false)this.shadowRoot.querySelector('.camera-history-status').textContent='Geen verbinding met Home Assistant. Geschiedenis kan niet worden geladen.';
   const empty=node.querySelector('p');if(empty)empty.textContent=this._historyError?'Geen waargenomen gebeurtenissen.':'Geen gebeurtenissen in deze periode.';
   return;
  }
  const variant=this.getAttribute('variant'),groups=new Map();
  for(const event of events){const key=variant==='sources'?(event.camera||event.entity):dayKey(event.time);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(event);}
  node.innerHTML=[...groups.values()].map(rows=>{
   if(variant==='sources')return `<details class="source-group" data-source="${uiEscape(rows[0].camera||rows[0].entity)}" open><summary><ha-icon icon="${(rows[0].camera?'mdi:cctv':symbols[rows[0].kind])}" aria-hidden="true"></ha-icon><strong>${uiEscape(this._activityName(rows[0]))}</strong><span>${rows.length}</span></summary><div>${rows.map(event=>this.studyEvent(event,types,variant)).join('')}</div></details>`;
   return `<section class="day-group" aria-label="${uiEscape(dayKey(rows[0].time))}"><h3>${dayLabel(rows[0].time)}<small>${dayKey(rows[0].time)}</small></h3><div class="day-events">${rows.map(event=>this.studyEvent(event,types,variant)).join('')}</div></section>`;
  }).join('');
  node.querySelectorAll('details').forEach(details=>{const key='study:'+details.dataset.source;if(this[key]===false)details.open=false;details.ontoggle=()=>this[key]=details.open;});
 }
 studyEvent(event,types,variant){
  const name=this._activityName(event),type=this._activityType(event,types),when=variant==='sources'?clock(event.time)+' '+dayKey(event.time):clock(event.time);
  const label=name+' · '+type+' · '+dayKey(event.time)+' '+clock(event.time)+(event.camera?' · Actueel camerabeeld openen':' · Sensorgegevens openen');
  const glyph=`<span class="event-symbol" data-kind="${event.kind}"><ha-icon icon="${symbols[event.kind]}" aria-hidden="true"></ha-icon></span>`;
  const content=variant==='timeline'?`<time datetime="${new Date(event.time).toISOString()}">${clock(event.time)}</time>${glyph}<span class="event-description"><strong>${uiEscape(name)}</strong><small>${uiEscape(type)}</small></span>`:variant==='sources'?`<span class="event-description"><strong>${uiEscape(type)}</strong><small>${uiEscape(when)}</small></span>`:`${glyph}<span class="event-description"><strong>${uiEscape(name)}</strong><small>${uiEscape(type)}</small></span><time datetime="${new Date(event.time).toISOString()}">${clock(event.time)}</time>`;
  return `<div class="study-event">${uiButton({variant:'text',className:'study-event-main',content,label,attrs:{'data-camera-activity':event.id}})}${uiButton({className:'study-event-info',label:'Sensorgegevens: '+name,content:'<ha-icon icon="mdi:information-outline" aria-hidden="true"></ha-icon>',attrs:{'data-camera-details':event.entity}})}</div>`;
 }
}
const styles=`
:host{height:auto}.camera-activity-source{margin:0 0 14px}.camera-history-status:empty{display:none}.camera-current-detections{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.camera-current-detections h4{flex-basis:100%;font-size:11px;font-weight:500;margin:0 0 2px;color:var(--secondary-text-color)}.camera-current-detections [data-ui-button]{width:auto;min-height:36px;padding:6px 10px;gap:12px;background:color-mix(in srgb,var(--warning-color,#e5ad58) 9%,transparent);border:1px solid color-mix(in srgb,var(--warning-color,#e5ad58) 22%,transparent);box-shadow:none}.camera-current-detections strong{font-size:11px}.camera-current-detections small{font-size:10px}.camera-current-detections [data-ui-button]>span:last-child{font-size:10px}.camera-detection-filters{gap:10px;margin-bottom:14px}.camera-detection-filters select{min-height:38px}.camera-activity-list{display:grid;gap:20px}.day-group{min-width:0}.day-group h3{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 8px;font-size:12px;font-weight:600}.day-group h3>small{font-size:10px;font-weight:400;color:var(--secondary-text-color)}.day-events{display:grid}.study-event{display:flex;position:relative;min-width:0}.study-event-main[data-ui-button]{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;width:100%;min-width:0;min-height:62px;padding:10px 8px 10px 0;gap:10px;background:none;box-shadow:none;border:0;border-bottom:1px solid var(--divider-color);border-radius:0;text-align:start}.event-description{display:grid;align-content:center;gap:3px;min-width:0}.event-description strong{font-size:12px;font-weight:500;line-height:17px;overflow-wrap:anywhere}.event-description small{font-size:11px;line-height:16px;color:var(--secondary-text-color)}.event-symbol{display:grid;place-items:center;width:28px;height:32px;color:var(--secondary-text-color);border-radius:6px;background:var(--secondary-background-color)}.event-symbol ha-icon{--mdc-icon-size:18px}.event-symbol[data-kind=person]{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,transparent)}.study-event time{font-size:11px;white-space:nowrap;color:var(--secondary-text-color);font-variant-numeric:tabular-nums;align-self:center}.study-event-info[data-ui-button]{width:28px;min-width:28px;min-height:48px;align-self:stretch;padding:4px;border-radius:0;border:0;border-bottom:1px solid var(--divider-color);background:none;box-shadow:none;color:var(--secondary-text-color)}.study-event-info ha-icon{--mdc-icon-size:16px}.study-event-main:hover,.study-event-info:hover{background:color-mix(in srgb,var(--primary-color) 5%,transparent)}
[data-study=timeline] .study-event-main{grid-template-columns:38px 24px minmax(0,1fr);gap:10px;border:0;min-height:72px;align-items:start;padding-top:12px;padding-bottom:12px}[data-study=timeline] .study-event time{align-self:start;padding-top:5px;text-align:start}[data-study=timeline] .event-symbol{width:24px;height:28px;position:relative;z-index:1;background:var(--ha-card-background,var(--card-background-color));border:1px solid var(--divider-color);border-radius:50%}[data-study=timeline] .event-symbol ha-icon{--mdc-icon-size:16px}[data-study=timeline] .study-event:before{content:'';position:absolute;left:59px;top:18px;bottom:-18px;border-left:1px solid var(--divider-color)}[data-study=timeline] .study-event:last-child:before{display:none}[data-study=timeline] .event-description{padding-top:2px}[data-study=timeline] .study-event-info{border:0}
.source-group{border:0;border-radius:8px;min-width:0;background:color-mix(in srgb,var(--primary-color) 5%,transparent);box-shadow:var(--eleven-surface-shadow);padding:0 12px}.source-group summary{display:flex;align-items:center;gap:9px;min-height:48px;padding:10px 0;list-style:none;cursor:pointer}.source-group summary::-webkit-details-marker{display:none}.source-group summary:before{content:'›';font-size:18px;color:var(--secondary-text-color);transform:rotate(0deg)}.source-group[open] summary:before{transform:rotate(90deg)}.source-group summary ha-icon{--mdc-icon-size:18px;color:var(--primary-color)}.source-group summary strong{font-size:12px;min-width:0;overflow-wrap:anywhere;font-weight:500}.source-group summary>span{font-size:10px;font-variant-numeric:tabular-nums;color:var(--secondary-text-color);margin-left:auto}.source-group .study-event-main{grid-template-columns:minmax(0,1fr);gap:0;padding:8px 6px 8px 0;min-height:52px}.source-group .study-event:last-child button{border-bottom:0}.source-group summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.source-group>div{padding-bottom:4px}
.study-event-main[data-ui-button]{flex:1 1 0;width:auto}.study-event-info[data-ui-button]{height:auto}
@container(max-width:340px){.study-event-main[data-ui-button]{gap:7px;grid-template-columns:26px minmax(0,1fr) auto}.study-event-info[data-ui-button]{min-width:24px;width:24px}.event-description strong{font-size:11px}.event-description small{font-size:10px}.study-event time{font-size:10px}[data-study=timeline] .study-event-main{grid-template-columns:32px 22px minmax(0,1fr);gap:7px}[data-study=timeline] .study-event:before{left:50px}.source-group .study-event-main{grid-template-columns:minmax(0,1fr)}}
`;
if(!customElements.get('security-activity-study'))customElements.define('security-activity-study',SecurityActivityStudy);
const cards=[...document.querySelectorAll('security-activity-study')];
cards.forEach(card=>card.addEventListener('hass-more-info',event=>{let feedback=card.parentNode.querySelector('[data-study-feedback]');if(!feedback){feedback=document.createElement('p');feedback.dataset.studyFeedback='';feedback.className='try';feedback.setAttribute('role','status');card.after(feedback);}feedback.textContent='Voorbeeld van sensorgegevens: '+event.detail.entityId;}));
document.querySelector('#scenario').onchange=event=>cards.forEach(card=>{card.scenario=event.target.value;card.refreshStudy();});
document.querySelector('#width').onchange=event=>document.querySelector('.examples').dataset.width=event.target.value;
document.querySelector('#theme').onchange=event=>{document.body.classList.toggle('light',event.target.value==='light');cards.forEach(card=>card.refreshStudy());};
const backgrounds=document.querySelector('#background');backgrounds.innerHTML=headerBackgroundOptions('nl').map(item=>`<option value="${uiEscape(item.value)}">${uiEscape(item.label)}</option>`).join('');backgrounds.value='lanes';
backgrounds.onchange=event=>cards.forEach(card=>{card.background=event.target.value;card.refreshStudy();});
document.querySelectorAll('[data-study-camera]').forEach(button=>button.onclick=()=>cards.find(card=>card.getAttribute('variant')===button.dataset.studyCamera)._openViewer('camera.front',button));
document.querySelectorAll('[data-study-return]').forEach(button=>button.onclick=()=>{const card=cards.find(card=>card.getAttribute('variant')===button.dataset.studyReturn);card._expanded=false;card._selectSecurityView('activity');});
