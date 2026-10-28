import {energyFlowSources,energyFlowStatisticIds,energyFlowNumber,energyFlowPower,energyFlowLive} from './energy-flow-data.js';

export function energyFlowGridMeters(prefs){
 return energyFlowSources(prefs).grid.flatMap(source=>['import','export'].flatMap(direction=>{
  const incoming=direction==='import',key=incoming?'stat_energy_from':'stat_energy_to';
  const entries=source[key]?[source]:(source[incoming?'flow_from':'flow_to']??[]);
  return entries.filter(entry=>typeof entry?.[key]==='string'&&entry[key]).map(entry=>({
   direction,energy:entry[key],name:source.name||entry.name,
   cost:entry[incoming?'stat_cost':'stat_compensation'],
   priceEntity:entry[incoming||!source[key]?'entity_energy_price':'entity_energy_price_export'],
   fixedPrice:entry[incoming||!source[key]?'number_energy_price':'number_energy_price_export'],
  }));
 }));
}
export function energyFlowDetailIds(prefs,info={}){
 return [...new Set([
  ...energyFlowStatisticIds(prefs),
  ...(prefs?.device_consumption??[]).map(device=>device.stat_consumption),
  ...energyFlowGridMeters(prefs).flatMap(meter=>[meter.energy,meter.cost||info.cost_sensors?.[meter.energy]]),
  ...energyFlowSources(prefs).solar.map(source=>source.stat_energy_from),
 ].filter(id=>typeof id==='string'&&id))];
}
export function energyFlowChange(statistics,id){
 const rows=Array.isArray(statistics?.[id])?statistics[id]:[];
 const values=rows.map(row=>energyFlowNumber(row.change)).filter(value=>value!=null);
 return values.length?values.reduce((sum,value)=>sum+value,0):null;
}
export function energyFlowDeviceRows(prefs,hass,history,statistics={}){
 const seen=new Set();
 return (Array.isArray(prefs?.device_consumption)?prefs.device_consumption:[]).filter(device=>{
  if(!device?.stat_consumption||seen.has(device.stat_consumption))return false;
  seen.add(device.stat_consumption);return true;
 }).map(device=>{
  const entity=hass?.states?.[device.stat_rate]??hass?.states?.[device.stat_consumption];
  const value=history?energyFlowChange(statistics,device.stat_consumption):energyFlowPower(hass,device.stat_rate);
  return {...device,label:device.name||entity?.attributes?.friendly_name||device.stat_consumption,value:value!=null&&value>=0?value:null};
 }).sort((a,b)=>(b.value??-1)-(a.value??-1)||a.label.localeCompare(b.label));
}
export function energyFlowDeviceTotal(rows){
 // Count a nested measurement only when none of its measured ancestors covers it.
 return rows.reduce((sum,row)=>{
  const visited=new Set([row.stat_consumption]);let id=row.included_in_stat;
  while(id&&!visited.has(id)){
   visited.add(id);const parent=rows.find(candidate=>candidate.stat_consumption===id);
   if(!parent)break;if(parent.value!=null)return sum;id=parent.included_in_stat;
  }
  return sum+(row.value??0);
 },0);
}
export function energyFlowCurrentPrice(meter,hass){
 if(meter.priceEntity){
  const state=hass?.states?.[meter.priceEntity],value=energyFlowNumber(state?.state);
  const match=String(state?.attributes?.unit_of_measurement??'').match(/^(.+)\/(Wh|kWh|MWh)$/);
  if(value==null||!match)return null;
  const factor={Wh:1000,kWh:1,MWh:.001}[match[2]];
  return {value:value*factor,currency:match[1]==='€'?'EUR':match[1]};
 }
 const value=energyFlowNumber(meter.fixedPrice),currency=hass?.config?.currency;
 return value==null||!currency?null:{value,currency};
}
export function energyFlowHistoricalCost(meter,info,statistics,metadata,hass){
 const id=meter.cost||info?.cost_sensors?.[meter.energy];
 const value=energyFlowChange(statistics,id);
 const currency=metadata?.[id]?.unit_of_measurement||hass?.states?.[id]?.attributes?.unit_of_measurement;
 // Do not apply today's price or assume the currency of an external statistic.
 return value==null||!currency?null:{value,currency};
}
export function energyFlowSolarRows(prefs,hass,history,statistics){
 return energyFlowSources(prefs).solar.map(source=>({
  label:source.name||hass?.states?.[source.stat_rate]?.attributes?.friendly_name||hass?.states?.[source.stat_energy_from]?.attributes?.friendly_name||source.stat_energy_from,
  value:history?energyFlowChange(statistics,source.stat_energy_from):energyFlowLive({energy_sources:[source]},hass).solar,
 }));
}

// Without storage, generated energy minus export is the solar share of home use.
// Reject inconsistent balances instead of silently clamping them into a convincing percentage.
export function energyFlowSolarCoverage(data){
 if(data.battery||![data.solar,data.home,data.export].every(value=>Number.isFinite(value)&&value>=0)||data.export>data.solar)return null;
 const used=data.solar-data.export;
 if(used>data.home+.01)return null;
 if(data.import!=null&&(!Number.isFinite(data.import)||data.import<0||Math.abs(used+data.import-data.home)>.01))return null;
 const own=Math.min(data.home,used);
 return {own,coverage:data.home>0?own/data.home*100:null,selfConsumption:data.solar>0?own/data.solar*100:null};
}
