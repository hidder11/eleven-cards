import {available,finite,temperatureRequest,coverRequest,actionRequest} from './control-utils.mjs';

export const normalizeItem=e=>typeof e==='string'?{entity:e}:e;
export const isNL=locale=>String(locale||'en').toLowerCase().startsWith('nl');
export function safeColor(value){if(Array.isArray(value)&&value.length===3&&value.every(v=>Number.isInteger(v)&&v>=0&&v<=255))return `rgb(${value.join(',')})`;return /^#[\da-f]{3}([\da-f]{3})?$/i.test(value||'')?value:null;}
export function controlRequest(state,entity,action,value){
 if(!available(state)||!/^([a-z_]+)\.[a-z0-9_]+$/.test(entity))return null;
 const domain=entity.split('.')[0],a=state.attributes||{},features=Number(a.supported_features)||0,data={entity_id:entity};
 const req=(service,extra={})=>({domain,service,data:{...data,...extra}});
 if(domain==='climate'&&['up','down'].includes(action)&&(features&1)){const target=temperatureRequest(state,action==='up'?1:-1);return target===null?null:req('set_temperature',{temperature:target});}
 if(domain==='cover'&&['open','stop','close'].includes(action))return coverRequest(state,entity,action);
 if(action==='toggle'&&['light','switch','input_boolean','fan'].includes(domain)&&['on','off'].includes(state.state)){
  const turnOn=state.state==='off';if(domain==='fan'&&!(features&(turnOn?32:16)))return null;
  return req(turnOn?'turn_on':'turn_off');
 }
 if(action==='level'&&finite(value)&&Number(value)>=0&&Number(value)<=100){
  if(domain==='light'&&Array.isArray(a.supported_color_modes)&&a.supported_color_modes.some(m=>!['onoff','unknown'].includes(m)))return req('turn_on',{brightness_pct:Number(value)});
  if(domain==='fan'&&(features&1))return req('set_percentage',{percentage:Number(value)});
  if(domain==='cover'&&(features&4))return req('set_cover_position',{position:Number(value)});
 }
 if(['number','input_number'].includes(domain)&&['up','down'].includes(action)&&finite(state.state)&&finite(a.step)&&Number(a.step)>0&&finite(a.min)&&finite(a.max)){
  const n=Number((Number(state.state)+(action==='up'?1:-1)*Number(a.step)).toFixed(8));
  return n>=Number(a.min)&&n<=Number(a.max)?req('set_value',{value:n}):null;
 }
 return null;
}
export function dayKey(value,timeZone='UTC'){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const get=t=>p.find(x=>x.type===t)?.value;return `${get('year')}-${get('month')}-${get('day')}`;
}
const ordinal=k=>Date.parse(k+'T12:00:00Z')/86400000;
const addDays=(k,n)=>new Date((ordinal(k)+n)*86400000).toISOString().slice(0,10);
export function isoDay(value,timeZone){
 if(typeof value!=='string')return null;
 const match=/^(\d{4}-\d{2}-\d{2})$/.exec(value);
 if(match){const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:null;}
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/.test(value)||!Number.isFinite(Date.parse(value))||!isoDay(value.slice(0,10),timeZone))return null;
 return dayKey(Date.parse(value),timeZone);
}
export function wasteRows(entries,states={},calendars={},options={}){
 let timeZone=options.timeZone||'UTC';try{dayKey(options.now??Date.now(),timeZone);}catch{timeZone='UTC';}
 const now=options.now??Date.now(),locale=options.locale||'en',nl=isNL(locale),today=dayKey(now,timeZone),rows=[];
 const row=(entry,state,date,status,name)=>{
  const days=date?Math.round(ordinal(date)-ordinal(today)):Infinity;
  const label=!date?({unavailable:nl?'Niet beschikbaar':'Unavailable',invalid:nl?'Geen geldige ophaaldatum':'No valid collection date',past:nl?'Ophaaldatum verstreken':'Collection date passed',empty:nl?'Geen inzameling in 60 dagen':'No collection within 60 days',error:nl?'Kalender kon niet laden':'Calendar could not load',loading:nl?'Kalender laden…':'Loading calendar…'}[status]):days===0?(nl?'Vandaag':'Today'):days===1?(nl?'Morgen':'Tomorrow'):new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',timeZone:'UTC',...(date.slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{})}).format(new Date(date+'T12:00:00Z'));
  rows.push({...entry,name:entry.name||name||state?.attributes?.friendly_name||entry.entity,date,days,label,status:status||'ready',color:safeColor(entry.color),icon:entry.icon||state?.attributes?.icon||'mdi:trash-can-outline'});
 };
 for(const raw of entries){
  const e=normalizeItem(raw),s=states[e.entity];
  if(!available(s)){row(e,s,null,'unavailable');continue;}
  if(e.entity?.startsWith('calendar.')){
   const cache=calendars[e.entity];if(!cache||cache.error){row(e,s,null,cache?.error?'error':'loading');continue;}
   const events=(cache.events||[]).filter(ev=>!e.filter||String(ev.summary||'').toLocaleLowerCase().includes(String(e.filter).toLocaleLowerCase()));let found=false;
   for(const ev of events){const date=isoDay(ev.start?.date||ev.start?.dateTime||ev.start,timeZone);if(!date||date<today)continue;row(e,s,date,null,ev.summary);found=true;}
   if(!found)row(e,s,null,'empty');continue;
  }
  const a=s.attributes||{},source=e.source||'auto';let value=e.attribute?a[e.attribute]:s.state,date=null;
  const usesDays=source==='days'||(source==='auto'&&!e.attribute&&finite(a.daysTo));
  if(usesDays){if(source==='auto')value=a.daysTo;const n=Number(value);if(finite(value)&&String(value).trim()!==''&&Number.isInteger(n)&&Math.abs(n)<36600){let origin=today;if(s.last_updated&&Number.isFinite(Date.parse(s.last_updated)))origin=dayKey(s.last_updated,timeZone);date=addDays(origin,n);}}
  else date=isoDay(value,timeZone);
  if(date&&date<today){row(e,s,null,'past');continue;}row(e,s,date,date?null:'invalid');
 }
 return rows.sort((a,b)=>a.days-b.days||a.name.localeCompare(b.name,locale));
}
export function groupWaste(rows){const groups=[];for(const row of rows){if(!row.date)continue;let g=groups.find(g=>g.date===row.date);if(!g){g={date:row.date,label:row.label,days:row.days,items:[]};groups.push(g);}if(!g.items.some(e=>e.entity===row.entity&&e.name===row.name))g.items.push(row);}return groups;}
