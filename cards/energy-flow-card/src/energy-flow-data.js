export const energyFlowDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
export const energyFlowNumber=value=>value==null||value===''||typeof value==='boolean'||!Number.isFinite(Number(value))?null:Number(value);
export function normalizeEnergyFlowConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid energy flow configuration');
 const config={...input,title:typeof input.title==='string'?input.title:'',default_view:input.default_view==='history'?'history':'live',hours_to_show:Math.min(8784,Math.max(1,energyFlowNumber(input.hours_to_show)??24)),show_navigation:true,animate_background:input.animate_background!==false,compact:(input.compact??(input.density==='compact'))===true,grid_power_inverted:input.grid_power_inverted===true};
 for(const key of ['sync_timeframe','show_field_1','show_field_2','show_field_3'])if(input[key]!=null&&typeof input[key]!=='boolean')throw Error('Invalid '+key);
 config.background_strength=input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength)));
 config.sync_timeframe=input.sync_timeframe===true;
 const group=input.hover_sync_group??input.timeframe_sync_group;
 if(group!=null&&typeof group!=='string')throw Error('Invalid synchronization group');
 config.hover_sync_group=group?.trim()||'';
 for(let i=1;i<=3;i++)config['show_field_'+i]=input['show_field_'+i]!==false;
 config.background=['lanes','halo','ribbon','prism-glass','eclipse','aurora','clouds','isobars'].includes(input.background)?input.background:'lanes';
 for(const key of ['solar_power_entity','grid_power_entity','grid_import_power_entity','grid_export_power_entity','home_power_entity']){
  if(input[key]&&!(typeof input[key]==='string'&&/^sensor\.[a-z0-9_]+$/.test(input[key])))throw Error('Invalid '+key);
  config[key]=input[key]||'';
 }
 return config;
}
const total=values=>values.some(value=>value==null)?null:values.reduce((a,b)=>a+b,0);
const ids=values=>[...new Set(values.filter(value=>typeof value==='string'&&value))];
export function energyFlowSources(prefs){
 const sources=Array.isArray(prefs?.energy_sources)?prefs.energy_sources:[];
 return Object.fromEntries(['solar','grid','battery'].map(type=>[type,sources.filter(source=>source?.type===type)]));
}
export function energyFlowMeters(prefs){
 const sources=energyFlowSources(prefs);
 const grid=(key,legacy)=>ids(sources.grid.flatMap(source=>source[key]?[source[key]]:(source[legacy]??[]).map(flow=>flow[key])));
 return {solar:ids(sources.solar.map(source=>source.stat_energy_from)),import:grid('stat_energy_from','flow_from'),export:grid('stat_energy_to','flow_to'),discharge:ids(sources.battery.map(source=>source.stat_energy_from)),charge:ids(sources.battery.map(source=>source.stat_energy_to))};
}
export const energyFlowStatisticIds=prefs=>ids(Object.values(energyFlowMeters(prefs)).flat());
export function energyFlowPower(hass,id){
 const state=hass?.states?.[id],value=energyFlowNumber(state?.state),factor={W:.001,kW:1,MW:1000}[state?.attributes?.unit_of_measurement];
 return value==null||factor==null?null:value*factor;
}
// HA normalizes grid power to positive import and battery power to positive discharge.
function sourcePower(source,hass){
 const read=id=>energyFlowPower(hass,id),config=source.power_config??{};
 if(source.stat_rate)return read(source.stat_rate);
 if(config.stat_rate)return read(config.stat_rate);
 if(config.stat_rate_inverted){const value=read(config.stat_rate_inverted);return value==null?null:-value;}
 if(config.stat_rate_from||config.stat_rate_to){const from=config.stat_rate_from?read(config.stat_rate_from):0,to=config.stat_rate_to?read(config.stat_rate_to):0;return from==null||to==null?null:from-to;}
 return null;
}
const balance=data=>Object.values(data).some(value=>value==null)?null:Math.max(0,data.solar+data.import-data.export+data.discharge-data.charge);
export function energyFlowLive(prefs,hass,config={}){
 const sources=energyFlowSources(prefs),read=id=>energyFlowPower(hass,id);
 const solar=config.solar_power_entity?read(config.solar_power_entity):total(sources.solar.map(source=>sourcePower(source,hass)));
 let incoming,outgoing;
 if(config.grid_power_entity){const net=read(config.grid_power_entity),value=net==null?null:net*(config.grid_power_inverted?-1:1);incoming=value==null?null:Math.max(0,value);outgoing=value==null?null:Math.max(0,-value);}
 else if(config.grid_import_power_entity||config.grid_export_power_entity){incoming=config.grid_import_power_entity?read(config.grid_import_power_entity):0;outgoing=config.grid_export_power_entity?read(config.grid_export_power_entity):0;}
 else {const powers=sources.grid.map(source=>sourcePower(source,hass));incoming=total(powers.map(value=>value==null?null:Math.max(0,value)));outgoing=total(powers.map(value=>value==null?null:Math.max(0,-value)));}
 const battery=sources.battery.map(source=>sourcePower(source,hass)),data={solar,import:incoming,export:outgoing,discharge:total(battery.map(value=>value==null?null:Math.max(0,value))),charge:total(battery.map(value=>value==null?null:Math.max(0,-value)))};
 return {...data,home:config.home_power_entity?read(config.home_power_entity):balance(data),battery:sources.battery.length>0};
}
export function energyFlowHistorical(prefs,statistics){
 const meters=energyFlowMeters(prefs),sources=energyFlowSources(prefs),data={};
 for(const [key,list] of Object.entries(meters))data[key]=total(list.map(id=>{
  const changes=(Array.isArray(statistics?.[id])?statistics[id]:[]).map(row=>energyFlowNumber(row.change)).filter(value=>value!=null);
  return changes.length?changes.reduce((a,b)=>a+b,0):null;
 }));
 if(sources.solar.some(source=>!source.stat_energy_from))data.solar=null;
 if(sources.grid.some(source=>!source.stat_energy_from&&!source.stat_energy_to&&!(source.flow_from?.length||source.flow_to?.length)))data.import=data.export=null;
 if(sources.battery.some(source=>!source.stat_energy_from))data.discharge=null;
 if(sources.battery.some(source=>!source.stat_energy_to))data.charge=null;
 return {...data,home:balance(data),battery:sources.battery.length>0};
}
export function energyFlowStatisticsRequest(prefs,start,end){
 return {type:'recorder/statistics_during_period',start_time:new Date(start).toISOString(),end_time:new Date(Math.min(end,Date.now())).toISOString(),statistic_ids:energyFlowStatisticIds(prefs),period:'hour',units:{energy:'kWh'},types:['change']};
}
