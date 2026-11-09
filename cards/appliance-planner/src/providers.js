import {canonicalPrices, localValue, localInputISO} from './planner.js';
import {tibberPriceData, tibberPriceRange, zonneplanPriceData} from '../../dynamic-energy-price-card/src/price-utils.js';
export const SOURCES=['sensor','energyzero','tibber','tibber_prices','zonneplan'];
export async function fetchTariffs(hass,config,now=new Date()){
 const source=config.source||'sensor',zone=hass.config?.time_zone||'Europe/Amsterdam';
 if(hass.config?.currency&&hass.config.currency!=='EUR')throw Error('Alleen EUR/kWh wordt ondersteund');
 if(source==='sensor'||source==='zonneplan'){
  const state=hass.states?.[config.entity];
  if(!state||['unavailable','unknown'].includes(state.state))throw Error('Kies een beschikbare prijsbron');
  if(source==='zonneplan'){const raw=state.attributes.forecast,parsed=zonneplanPriceData(raw);if(!Array.isArray(raw)||parsed.length!==raw.length)throw Error('Ongeldige Zonneplan-prijsgegevens');return canonicalPrices(parsed);}
  if(!['EUR/kWh','€/kWh'].includes(state.attributes.unit_of_measurement))throw Error('Prijssensor moet EUR/kWh gebruiken');
  return canonicalPrices(state.attributes.data??state.attributes.prices);
 }
 if(source==='energyzero'){
  if(!config.energyzero_entry)throw Error('Kies een EnergyZero-configuratie');
  const today=localValue(now,zone).slice(0,10),days=[today,new Date(Date.parse(today+'T12:00Z')+86400000).toISOString().slice(0,10)];let rows=[];
  for(let i=0;i<days.length;i++)try{
   const {response}=await hass.callWS({type:'call_service',domain:'energyzero',service:'get_energy_prices',service_data:{config_entry:config.energyzero_entry,incl_vat:true,price_type:'all_in',interval:'quarter',start:days[i],end:days[i]},return_response:true});
   rows.push(...response.prices.map(r=>({start:r.start??r.timestamp,end:r.end,price:r.price})));
  }catch(error){if(!i)throw error;}
  return canonicalPrices(rows,15);
 }
 if(source==='tibber'||source==='tibber_prices'){
  const range=tibberPriceRange(now,zone),service_data=source==='tibber'?{start:range.start_time,end:range.end_time}:{...range,...(config.tibber_entry?{entry_id:config.tibber_entry}:{})};
  const {response}=await hass.callWS({type:'call_service',domain:source,service:source==='tibber'?'get_prices':'get_price',service_data,return_response:true});
  const parsed=tibberPriceData(response,source,config.tibber_home);
  const raw=source==='tibber'?response.prices[config.tibber_home||Object.keys(response.prices)[0]]:response.price_info;
  if(parsed.length!==raw.length)throw Error('Ongeldige Tibber-prijsgegevens');
  return canonicalPrices(parsed);
 }
 throw Error('Onbekende prijsbron');
}
