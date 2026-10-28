import {energyFlowHistorical,energyFlowStatisticIds,energyFlowNumber} from './energy-flow-data.js';
import {energyFlowGridMeters,energyFlowDeviceRows,energyFlowDeviceTotal} from './energy-flow-details-data.js';

const HOUR=3600000;
function insightTimestamp(value){
 const number=typeof value==='number'?value:Date.parse(value);
 return Number.isFinite(number)?(number<1e12?number*1000:number):null;
}
function insightHours(statistics){
 const hours=new Map();
 for(const [id,rows] of Object.entries(statistics??{}))for(const row of Array.isArray(rows)?rows:[]){
  const start=insightTimestamp(row.start);if(start==null)continue;
  if(!hours.has(start))hours.set(start,{});
  hours.get(start)[id]=[row];
 }
 return [...hours].sort((a,b)=>a[0]-b[0]);
}
// Median of the quietest full hour in each of up to seven complete local nights.
// Requiring all four local hour labels excludes gaps and incomplete nights.
export function energyFlowBaseConsumption(prefs,statistics,zone='UTC',end=Date.now()){
 const ids=energyFlowStatisticIds(prefs);if(!ids.length)return null;
 let date;try{date=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});}catch{return null;}
 const nights=new Map();
 for(const [start,stats] of insightHours(statistics)){
  if(start+HOUR>end||ids.some(id=>energyFlowNumber(stats[id]?.[0]?.change)==null))continue;
  const parts=Object.fromEntries(date.formatToParts(start).map(part=>[part.type,part.value])),hour=Number(parts.hour);
  if(hour<1||hour>=5)continue;
  const home=energyFlowHistorical(prefs,stats).home;if(!Number.isFinite(home)||home<0)continue;
  const day=parts.year+'-'+parts.month+'-'+parts.day;
  if(!nights.has(day))nights.set(day,[]);nights.get(day).push({hour,watts:home*1000});
 }
 const values=[...nights].filter(([,rows])=>[1,2,3,4].every(hour=>rows.some(row=>row.hour===hour))).slice(-7).map(([,rows])=>Math.min(...rows.map(row=>row.watts))).sort((a,b)=>a-b);
 if(values.length<3)return null;
 const middle=Math.floor(values.length/2);
 return {watts:values.length%2?values[middle]:(values[middle-1]+values[middle])/2,nights:values.length};
}

// Preserve hourly tariffs; value gaps at the period's energy-weighted import tariff.
// This is an estimate of consumption value, not an allocation of the household bill.
export function energyFlowDeviceCosts(prefs,hass,state={}){
 const meters=energyFlowGridMeters(prefs).filter(meter=>meter.direction==='import'),statistics=state.statistics??{},totals=new Map(),hours=[];
 let periodEnergy=0,periodCost=0,periodCurrency=null,incompatible=false;
 for(const [start,stats] of insightHours(statistics)){
  let energy=0,cost=0,currency=null,known=meters.length>0;
  for(const meter of meters){
   const costId=meter.cost||state.info?.cost_sensors?.[meter.energy],used=energyFlowNumber(stats[meter.energy]?.[0]?.change),paid=energyFlowNumber(stats[costId]?.[0]?.change),unit=state.metadata?.[costId]?.unit_of_measurement||hass?.states?.[costId]?.attributes?.unit_of_measurement;
   if(used==null||used<0){known=false;break;}
   if(used===0){if(paid!=null&&paid!==0)known=false;continue;}
   if(currency&&unit&&unit!==currency){incompatible=true;known=false;break;}
   if(paid==null||!unit){known=false;break;}
   energy+=used;cost+=paid;currency=unit;
  }
  const rate=known&&energy>0?cost/energy:null;
  if(rate!=null){
   if(periodCurrency&&currency!==periodCurrency)incompatible=true;
   periodEnergy+=energy;periodCost+=cost;periodCurrency=currency;
  }
  hours.push({start,stats,rate,currency});
 }
 const average=!incompatible&&periodEnergy>0?periodCost/periodEnergy:null;
 for(const {start,stats,rate,currency} of hours){
  const devices=energyFlowDeviceRows(prefs,hass,true,stats),home=energyFlowHistorical(prefs,stats).home,measured=energyFlowDeviceTotal(devices);
  // Clamping an overmeasured hour to zero would inflate the period's residual costs.
  const other=Number.isFinite(home)&&devices.every(device=>device.value!=null)&&measured<=home+.01?Math.max(0,home-measured):null;
  for(const row of [...devices.map(device=>({id:device.stat_consumption,value:device.value})),{id:'__other',value:other}]){
   if(!totals.has(row.id))totals.set(row.id,{value:0,currency:null,known:!incompatible,energy:0,estimatedEnergy:0,hours:new Set()});
   const total=totals.get(row.id);total.hours.add(start);
   if(row.value==null||row.value<0){total.known=false;continue;}
   if(row.value===0)continue;
   total.energy+=row.value;
   const applied=rate??average,unit=rate==null?periodCurrency:currency;
   if(applied==null||total.currency&&unit!==total.currency){total.known=false;continue;}
   total.value+=row.value*applied;total.currency=unit;
   if(rate==null)total.estimatedEnergy+=row.value;
  }
 }
 // A positive device interval must also be represented among the priced hours.
 const positiveHours=id=>(statistics[id]??[]).filter(row=>energyFlowNumber(row.change)>0).every(row=>{const start=insightTimestamp(row.start);return start!=null&&totals.get(id)?.hours.has(start);});
 const home=energyFlowHistorical(prefs,statistics).home,devices=energyFlowDeviceRows(prefs,hass,true,statistics);
 const residual=Number.isFinite(home)&&devices.every(device=>device.value!=null)?Math.max(0,home-energyFlowDeviceTotal(devices)):null;
 return Object.fromEntries([...totals].map(([id,total])=>{
  const consistent=id==='__other'?residual!=null&&Math.abs(total.energy-residual)<=.01:positiveHours(id);
  return [id,total.known&&consistent?{value:total.value,currency:total.currency??hass?.config?.currency,estimatedShare:total.energy>0?total.estimatedEnergy/total.energy*100:0}:null];
 }));
}
