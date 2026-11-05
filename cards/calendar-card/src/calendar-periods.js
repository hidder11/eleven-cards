import {calendarDayStart,graphPeriodBounds} from '../../../shared/periods.js';
import {calendarDisplayRange,localCalendarDayKey,nextCalendarDayKey} from './calendar-utils.js';

// Calendar windows move in local days, including future dates and DST changes.
export function calendarSelectedRange(host){
 const mode=host._periodMode??'configured',zone=host._zone(),today=host._todayKey??localCalendarDayKey(Date.now(),zone),offset=host._offset??0;
 if(mode==='configured')return calendarDisplayRange(host._view,host._config.days_to_show,offset,today,zone);
 let start,end;
 if(mode==='custom'&&host._calendarCustom){({start,end}=host._calendarCustom);}
 else if(mode==='month'){
  const date=new Date(today+'T00:00:00Z'),key=step=>new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+offset+step,1)).toISOString().slice(0,10);
  start=calendarDayStart(key(0),zone);end=calendarDayStart(key(1),zone);
 }else if(mode==='week'){
  [start,end]=graphPeriodBounds(calendarDayStart(nextCalendarDayKey(today,offset*7),zone),'week',zone);
 }else{
  const count=mode==='today'?1:Number(mode.replace('d',''))||host._config.days_to_show;
  start=calendarDayStart(nextCalendarDayKey(today,offset*count),zone);end=calendarDayStart(nextCalendarDayKey(today,(offset+1)*count),zone);
 }
 let startKey=localCalendarDayKey(start,zone),endKey=nextCalendarDayKey(localCalendarDayKey(end-1,zone)),monthKey=startKey.slice(0,7)+'-01';
 if(host._view==='month'){
  const weekday=key=>(new Date(key+'T12:00:00Z').getUTCDay()+6)%7;
  startKey=nextCalendarDayKey(startKey,-weekday(startKey));endKey=nextCalendarDayKey(endKey,(7-weekday(endKey))%7);
  start=calendarDayStart(startKey,zone);end=calendarDayStart(endKey,zone);
 }
 const keys=[];for(let key=startKey;key<endKey;key=nextCalendarDayKey(key))keys.push(key);
 return {start,end,startKey,endKey,monthKey,keys};
}

export function calendarPeriodAdapter(host){
 const nl=String(host._hass?.locale?.language??host._hass?.language??'en').startsWith('nl'),t=(a,b)=>nl?a:b;
 const reload=()=>{host._periodCustomDraft=null;host._startCalendars();host._render();};
 return {
  standard:t('Standaard','Default'),rollingLabel:t('Dagen','Days'),
  rolling:[1,3,5,7,14,30].map(days=>[days+'d',`${days} ${t(days===1?'dag':'dagen',days===1?'day':'days')}`,`${days} d`]),
  calendar:[['today',t('Vandaag','Today'),t('Dag','Day')],['week',t('Deze week','This week'),t('Week','Week')],['month',t('Deze maand','This month'),t('Maand','Month')]],
  range:()=>host._range(),name:()=>host._rangeLabel(host._range()),
  choose:mode=>{if(!['configured','today','week','month','1d','3d','5d','7d','14d','30d'].includes(mode))return;host._periodMode=mode;host._offset=0;host._calendarCustom=null;reload();},
  custom:(start,end)=>{if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*86400000)return;host._periodMode='custom';host._calendarCustom={start,end};host._offset=0;reload();},
  move:direction=>{
   if(![-1,0,1].includes(direction))return;
   if(host._periodMode==='custom'&&host._calendarCustom){
    if(direction===0){host._periodMode='configured';host._calendarCustom=null;host._offset=0;}
    else{const span=host._calendarCustom.end-host._calendarCustom.start;host._calendarCustom={start:host._calendarCustom.start+direction*span,end:host._calendarCustom.end+direction*span};}
   }else host._offset=direction===0?0:(host._offset??0)+direction;
   reload();
  }
 };
}
