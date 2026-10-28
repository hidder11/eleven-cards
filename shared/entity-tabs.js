import {uiEscape} from './ui-button.js';
const entityTabText=value=>typeof value==='string'?value.trim():'';
const entityTabClamp=(value,fallback,min,max)=>value!==''&&value!=null&&Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
export function normalizeEntityTabs(input,maxDecimals=6){
 const used=new Set();return (Array.isArray(input)?input:[]).filter(tab=>tab&&typeof tab==='object').map((tab,index)=>{
  let id=/^custom-[a-z0-9_-]+$/.test(tab.id)?tab.id:'custom-'+(index+1);let n=1;while(used.has(id))id='custom-'+(index+1)+'-'+n++;used.add(id);
  return {id,title:typeof tab.title==='string'?tab.title:'',show:tab.show!==false,entities:(Array.isArray(tab.entities)?tab.entities:[]).map(row=>{
   row=typeof row==='string'?{entity:row}:row??{};
   return {entity:entityTabText(row.entity),name:typeof row.name==='string'?row.name:'',attribute:entityTabText(row.attribute),unit:entityTabText(row.unit),show_unit:row.show_unit!==false,decimals:row.decimals==null||row.decimals===''?null:Math.round(entityTabClamp(row.decimals,2,0,maxDecimals))};
  })};
 });
}

export function entityTabReading(row,hass){
 const entity=hass?.states?.[row.entity];
 if(!entity||entity.state==null||['','unknown','unavailable'].includes(String(entity.state).trim()))return '—';
 const raw=row.attribute?entity.attributes?.[row.attribute]:entity.state;
 if(raw==null||typeof raw==='object')return '—';
 const unit=row.show_unit===false?'':row.unit||(row.attribute?'':entity.attributes?.unit_of_measurement);
 let value=String(raw);
 if(value.trim()!==''&&Number.isFinite(Number(value))){
  try{value=new Intl.NumberFormat(hass?.locale?.language??hass?.language??'en',{maximumFractionDigits:row.decimals??2,...(row.decimals!=null?{minimumFractionDigits:row.decimals}:{})}).format(Number(value));}catch{value=String(Number(value));}
 }else if(!row.attribute&&typeof hass?.formatEntityState==='function')return hass.formatEntityState(entity);
 return value+(unit?' '+unit:'');
}
export function entityTabContent(tab,hass,nl){
 const rows=tab.entities.filter(row=>row.entity);
 if(!rows.length)return '<p class="energy-detail-note">'+(nl?'Voeg entiteiten toe aan dit tabblad in de kaartconfiguratie.':'Add entities to this tab in the card configuration.')+'</p>';
 return '<dl class="energy-grid-metrics">'+rows.map(row=>{
  const label=row.name||hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity;
  return '<div><dt>'+uiEscape(label)+'</dt><dd><button type="button" class="energy-entity-value" data-entity="'+uiEscape(row.entity)+'">'+uiEscape(entityTabReading(row,hass))+'</button></dd></div>';
 }).join('')+'</dl>';
}
