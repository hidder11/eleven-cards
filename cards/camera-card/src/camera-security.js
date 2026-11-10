import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {uiMetric} from '../../../shared/ui-metric.js';
import {uiPrimaryValue} from '../../../shared/ui-primary-value.js';
import {uiDetailSurface} from '../../../shared/ui-detail-surface.js';
import {securityArt} from './security-art.js';
import {cameraUnavailable,visibleCameras} from './camera-utils.js';
import {cameraShowAlarm,cameraShowContacts,cameraActivityGroupKey} from './camera-features.js';

export function cameraContactRows(rows,hass){
 const online=hass?.connected!==false&&hass?.connection?.connected!==false;
 return rows.map((row,index)=>{const state=online?hass?.states?.[row.entity]?.state:null;return {...row,index,state:['on','off'].includes(state)?state:'unknown',label:row.name||hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity};}).sort((a,b)=>({on:0,unknown:1,off:2}[a.state]-{on:0,unknown:1,off:2}[b.state])||a.index-b.index);
}
export function cameraSecurityHeader(config,hass,t,renderArt=securityArt){
 const online=hass?.connected!==false&&hass?.connection?.connected!==false,state=cameraShowAlarm(config)&&online?hass?.states?.[config.alarm_entity]?.state:null;
 const modes={disarmed:[t('Uit','Off'),t('Alarm uitgeschakeld','Alarm disarmed')],armed_home:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_away:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_night:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_vacation:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_custom_bypass:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],arming:[t('Inschakelen','Arming'),t('Alarm wordt ingeschakeld','Alarm is arming')],disarming:[t('Uitschakelen','Disarming'),t('Alarm wordt uitgeschakeld','Alarm is disarming')],pending:[t('Vertraging','Pending'),t('Alarmvertraging actief','Alarm delay active')],triggered:[t('Alarm','Alarm'),t('Alarm geactiveerd','Alarm triggered')]};
 const rows=visibleCameras(config),alarm=!!config.alarm_entity&&cameraShowAlarm(config);
 const [value,subtitle]=alarm?(modes[state]??[t('Onbekend','Unknown'),t('Alarmstatus onbekend','Alarm status unknown')]):[online?String(rows.filter(row=>!cameraUnavailable(hass,row.entity)).length):null,t('Camera’s beschikbaar','Cameras available')];
 return `<div class="camera-primary" data-long-status="${String(value??'').length>8}" data-triggered="${state==='triggered'}">${uiPrimaryValue({value,subtitle,compact:config.compact,attrs:{'data-primary-layout':'uniform'},entity:alarm?config.alarm_entity:''})}</div><div class="camera-security-art">${renderArt(alarm?(modes[state]?state:'unknown'):'camera')}</div>`;
}
export function cameraSecurityTabs(config,t){
 return [{value:'cameras',label:t('Camera’s','Cameras')},...(cameraShowContacts(config)&&config.door_sensors.length?[{value:'doors',label:t('Deuren','Doors')}]:[]),...(cameraShowContacts(config)&&config.window_sensors.length?[{value:'windows',label:t('Ramen','Windows')}]:[]),...(config.show_activity?[{value:'activity',label:t('Activiteiten','Activity')}]:[])];
}
export function cameraSecurityMetrics(config,hass,t){
 const online=hass?.connected!==false&&hass?.connection?.connected!==false,rows=visibleCameras(config),available=rows.filter(row=>!cameraUnavailable(hass,row.entity)).length;
 const camera=uiMetric({title:t('Camera’s','Cameras'),value:online?String(available):null,unit:t('beschikbaar','available'),icon:'mdi:cctv',action:true,attrs:{'data-security-view':'cameras'}});
 const metric=(kind,items)=>{const contacts=cameraContactRows(items,hass),unknown=contacts.filter(row=>row.state==='unknown').length,open=contacts.filter(row=>row.state==='on').length;
  return uiMetric({title:kind==='doors'?t('Deuren','Doors'):t('Ramen','Windows'),value:!items.length||unknown===items.length?null:String(open),unit:t('open','open'),info:unknown&&unknown<items.length?unknown+' '+t('onbekend','unknown'):'',icon:kind==='doors'?'mdi:door':'mdi:window-closed-variant',action:true,attrs:{'data-security-contacts':kind}});
 };
 if(!cameraShowContacts(config)||(!config.door_sensors.length&&!config.window_sensors.length))return camera;
 const groups=[['doors',config.door_sensors],['windows',config.window_sensors]].filter(([,items])=>items.length);
 return `<div data-ui-metric-grid style="--ui-metric-columns:${groups.length}">${groups.map(([kind,items])=>metric(kind,items)).join('')}</div>`;
}
export function cameraContactList(config,hass,t,kind,lastOpened=new Map()){
 const rows=cameraContactRows(kind==='doors'?config.door_sensors:config.window_sensors,hass);
 return rows.length?rows.map(row=>{
  const state=hass?.states?.[row.entity],current=row.state==='on'?Date.parse(state?.last_changed):NaN;
  const time=Math.max(...[current,lastOpened.get(row.entity)].filter(value=>Number.isFinite(value)&&value<=Date.now()));
  const zone=hass?.config?.time_zone;
  let value=null;
  if(Number.isFinite(time)){
   const format=options=>{try{return new Intl.DateTimeFormat('en-GB',{...options,...(zone?{timeZone:zone}:{})}).format(time);}catch{return new Intl.DateTimeFormat('en-GB',options).format(time);}};
   value=format({hour:'2-digit',minute:'2-digit',hourCycle:'h23'})+' '+format({day:'2-digit',month:'2-digit',year:'numeric'}).replaceAll('/','-');
  }
  return uiDetailSurface({title:row.label,entity:row.entity,actionLabel:t('Details van ','Details for ')+row.label,attrs:{'data-security-contact':row.entity,'data-contact-state':row.state},metrics:[{label:t('Status','Status'),value:row.state==='on'?t('Open','Open'):row.state==='off'?t('Dicht','Closed'):t('Onbekend','Unknown')},{label:t('Laatst geopend','Last opened'),value}]});
 }).join(''):`<p>${t('Geen sensoren ingesteld.','No sensors configured.')}</p>`;
}
export function cameraDetectionIndicators(entries,t){
 return entries.map(entry=>{
  const title=entry.kind==='person'?t('Persoon','Person'):t('Beweging','Motion'),status=!entry.available?t('Onbekend','Unknown'):entry.active?t('Gedetecteerd','Detected'):t('Geen detectie','No detection');
  const drawing=entry.kind==='person'?'<circle cx="12" cy="6" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M12 15v6"/>':'<path d="M4 7a10 10 0 0 1 16 0M7 10a6 6 0 0 1 10 0M10 13a2 2 0 0 1 4 0"/><circle cx="12" cy="18" r="2"/>';
  return `<button type="button" class="camera-detection-indicator" data-camera-details="${uiEscape(entry.entity)}" data-detection-kind="${entry.kind}" data-detection-state="${!entry.available?'unknown':entry.active?'active':'clear'}" aria-label="${uiEscape(title+': '+status)}" title="${uiEscape(title+': '+status)}"><span class="camera-detection-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg></span></button>`;
 }).join('');
}
export function cameraVisibleEvents(events,config,{camera='',kind='',since=0}={}){
 const visible=new Set(visibleCameras(config).map(row=>row.entity));
 const rows=events.filter(event=>(!event.camera||visible.has(event.camera))&&(!camera||(camera==='doors'?event.kind==='door':camera==='windows'?event.kind==='window':event.camera===camera))&&(!kind||event.kind===kind)&&Number.isFinite(event.time)&&event.time>=since).sort((a,b)=>b.time-a.time);
 const groups=new Map(),seen=new Set();
 for(const event of rows){
  if(event.id&&seen.has(event.id))continue;if(event.id)seen.add(event.id);
  const key=cameraActivityGroupKey(event),group=groups.get(key);
  if(group)group.count++;else groups.set(key,{...event,count:1});
 }
 return [...groups.values()];
}
export function cameraActivityTimeline(events,{name,type,t,timeZone,now=Date.now()}={}){
 const format=options=>{try{return new Intl.DateTimeFormat('en-GB',{...options,...(timeZone?{timeZone}:{})});}catch{return new Intl.DateTimeFormat('en-GB',options);}};
 const date=format({year:'numeric',month:'2-digit',day:'2-digit'}),clock=format({hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const key=time=>date.format(time).replaceAll('/','-'),today=key(now);
 // Calendar arithmetic keeps Yesterday correct across daylight-saving changes.
 const parts=date.formatToParts(now),part=kind=>Number(parts.find(item=>item.type===kind).value);
 const yesterday=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.UTC(part('year'),part('month')-1,part('day')-1)).replaceAll('/','-');
 const groups=new Map();for(const event of events){if(!Number.isFinite(event.time))continue;const day=key(event.time);if(!groups.has(day))groups.set(day,[]);groups.get(day).push(event);}
 const symbols={motion:'mdi:motion-sensor',person:'mdi:account-outline',door:'mdi:door',window:'mdi:window-closed-variant',doorbell:'mdi:bell-outline'};
 return [...groups].map(([day,rows])=>`<section class="camera-activity-day"><h4><span>${day===today?t('Vandaag','Today'):day===yesterday?t('Gisteren','Yesterday'):day}</span>${[today,yesterday].includes(day)?`<small>${day}</small>`:''}</h4><div>${rows.map(event=>{
  const title=name(event),description=type(event)+(event.count>1?' · '+event.count+'×':''),when=clock.format(event.time);
  return `<div class="camera-event">${uiButton({variant:'text',className:'camera-timeline-open',label:title+' · '+description+' · '+day+' '+when+(event.camera?' · '+t('Camera openen','Open camera'):''),content:`<time datetime="${new Date(event.time).toISOString()}"><span>${when}</span></time><span class="camera-event-symbol" data-kind="${uiEscape(event.kind)}"><ha-icon icon="${symbols[event.kind]??'mdi:circle-outline'}" aria-hidden="true"></ha-icon></span><span class="camera-event-description"><strong>${uiEscape(title)}</strong><small>${uiEscape(description)}</small></span>`,attrs:{'data-camera-activity':event.id}})}</div>`;
 }).join('')}</div></section>`).join('');
}
