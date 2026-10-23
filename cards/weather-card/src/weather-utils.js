import {WEATHER_BACKGROUNDS} from './weather-backgrounds.js';
export const WEATHER_CONDITIONS = {
 sunny:['Zonnig','Sunny','sun'], 'clear-night':['Heldere nacht','Clear night','night'],
 partlycloudy:['Halfbewolkt','Partly cloudy','partly'], cloudy:['Bewolkt','Cloudy','cloud'],
 rainy:['Regen','Rain','rain'], pouring:['Stortregen','Heavy rain','rain','pouring'],
 lightning:['Onweer','Thunderstorm','storm','lightning'], 'lightning-rainy':['Onweer met regen','Thunderstorm with rain','storm'],
 snowy:['Sneeuw','Snow','snow'], 'snowy-rainy':['Natte sneeuw','Sleet','snow','sleet'],
 fog:['Mist','Fog','fog'], windy:['Winderig','Windy','wind'], 'windy-variant':['Bewolkt en winderig','Cloudy and windy','wind','wind-cloud'],
 hail:['Hagel','Hail','snow','hail'], exceptional:['Uitzonderlijk weer','Exceptional weather','storm','exceptional'],
};
export const weatherDutch = hass => String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
export const WEATHER_METRICS = {
 wind_speed:['Wind','Wind','wind_speed_unit',1],wind_gust_speed:['Windstoten','Wind gusts','wind_speed_unit',1],
 humidity:['Luchtvochtigheid','Humidity','%',0],pressure:['Luchtdruk','Pressure','pressure_unit',0],
 apparent_temperature:['Gevoelstemperatuur','Feels like','temperature_unit',0],dew_point:['Dauwpunt','Dew point','temperature_unit',1],
 visibility:['Zicht','Visibility','visibility_unit',1],cloud_coverage:['Bewolking','Cloud coverage','%',0],
 uv_index:['UV-index','UV index','',1],wind_bearing:['Windrichting','Wind direction','°',0],
};
export const WEATHER_FORECAST_FIELDS={
 condition:['Weericoon','Weather icon'],temperature:['Temperatuur','Temperature'],templow:['Minimumtemperatuur (per dag)','Low temperature (daily)'],
 precipitation_probability:['Neerslagkans','Precipitation probability'],precipitation:['Neerslaghoeveelheid','Precipitation amount'],
 wind_speed:['Wind','Wind'],wind_gust_speed:['Windstoten','Wind gusts'],humidity:['Luchtvochtigheid','Humidity'],uv_index:['UV-index','UV index'],
};
export function normalizeWeatherConfig(input={}) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid weather configuration');
 if (input.entity && (typeof input.entity !== 'string' || !/^weather\.[a-z0-9_]+$/.test(input.entity))) throw Error('Kies een weather-entiteit / Choose a weather entity');
 const config={...input,type:input.type || 'custom:eleven-weather-card',forecast_type:input.forecast_type || 'auto',show_forecast:input.show_forecast !== false,forecast_count:input.forecast_count ?? 6};
 if (!['auto','hourly','daily'].includes(config.forecast_type)) throw Error('Invalid forecast type');
 if (!Number.isInteger(config.forecast_count) || config.forecast_count<3 || config.forecast_count>8) throw Error('Forecast count must be between 3 and 8');
 config.compact=(input.compact??(input.density==='compact'))===true;
 if(input.forecast_fields!=null&&(!Array.isArray(input.forecast_fields)||input.forecast_fields.some(key=>!Object.hasOwn(WEATHER_FORECAST_FIELDS,key))))throw Error('Invalid forecast fields');
 config.forecast_fields=[...new Set(input.forecast_fields??['condition','temperature','templow','precipitation_probability'])];
 for(const type of ['hourly','daily']){
  const key='forecast_'+type+'_fields';
  if(input[key]!=null){
   if(!Array.isArray(input[key])||input[key].some(field=>!Object.hasOwn(WEATHER_FORECAST_FIELDS,field)))throw Error('Invalid '+type+' forecast fields');
   config[key]=[...new Set(input[key])];
  }else delete config[key];
  for(const field of Object.keys(WEATHER_FORECAST_FIELDS).filter(field=>field!=='condition')){
   const precision='forecast_'+type+'_'+field+'_decimals',value=input[precision];
   config[precision]=value==null||value===''?null:Number.isFinite(Number(value))?Math.max(0,Math.min(3,Math.round(Number(value)))):null;
  }
 }
 config.background=input.background||'lanes';
 config.background_strength=input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength)));
 if(!WEATHER_BACKGROUNDS.some(option=>option.value===config.background))throw Error('Invalid weather background');
 config.animate_icons=input.animate_icons!==false;
 // Preserve the old combined animation switch until background motion is configured separately.
 config.animate_background=input.animate_background??config.animate_icons;
 for(const [key,fallback,min,max] of [['icon_scale',100,50,300],['icon_offset_x',0,-150,150],['icon_offset_y',0,-150,150]]){
  const value=input[key];config[key]=value==null||value===''||!Number.isFinite(Number(value))?fallback:Math.max(min,Math.min(max,Number(value)));
 }
 config.icon_style=input.icon_style??'classic';
 if(!['classic','glass','neon'].includes(config.icon_style))throw Error('Invalid weather icon style');
 config.compact_forecast=input.compact_forecast??(input.show_forecast===false?'none':input.forecast_type==='daily'?'daily':'hourly');
 if(!['hourly','daily','none'].includes(config.compact_forecast))throw Error('Invalid compact forecast');
 config.metric_status=input.metric_status??'condition';config.metric_primary=input.metric_primary??'wind_speed';config.metric_secondary=input.metric_secondary??'humidity';
 config.metric_status_icon=typeof input.metric_status_icon==='string'?input.metric_status_icon.trim():'';
 for(const field of ['metric_status','metric_primary','metric_secondary']){
  if(!['none','custom',...(field==='metric_status'?['condition']:[])].includes(config[field])&&!Object.hasOwn(WEATHER_METRICS,config[field]))throw Error('Invalid weather metric');
  for(const suffix of ['entity','attribute','unit','icon'])config[field+'_'+suffix]=typeof input[field+'_'+suffix]==='string'?input[field+'_'+suffix].trim():'';
  config[field+'_label']=typeof input[field+'_label']==='string'?input[field+'_label']:'';
  config[field+'_show_unit']=input[field+'_show_unit']!==false;
  const digits=input[field+'_decimals'];config[field+'_decimals']=digits==null||digits===''?null:Number.isFinite(Number(digits))?Math.max(0,Math.min(6,Math.round(Number(digits)))):null;
 }
 // An explicit tab list controls both densities. Omitted lists retain legacy behavior.
 if(Array.isArray(input.tabs))config.tabs=['hourly','daily'].filter(tab=>input.tabs.includes(tab));
 else delete config.tabs;
 return config;
}
export function weatherVisibleTabs(config={}){
 if(Array.isArray(config.tabs))return config.tabs;
 return config.compact?(config.compact_forecast==='none'?[]:[config.compact_forecast??'hourly']):config.show_forecast===false?[]:['hourly','daily'];
}
export function weatherField(config,field,attributes,hass,available=true){
 const key=config[field];if(key==='none')return null;
 let metric;
 if(key==='condition'){
  metric={label:weatherDutch(hass)?'Weerstatus':'Weather conditions',value:weatherCondition(available?hass?.states?.[config.entity]?.state:'unknown',weatherDutch(hass)).label};
 }else if(key==='custom'){
  const id=config[field+'_entity'],entity=hass?.states?.[id],attribute=config[field+'_attribute'];
  const valid=entity&&!['unknown','unavailable',''].includes(entity.state);
  const value=valid?(attribute?entity.attributes?.[attribute]:entity.state):null;
  const unit=config[field+'_show_unit']?(config[field+'_unit']||(!attribute?entity?.attributes?.unit_of_measurement:''))||'':'';
  const numeric=value!=null&&typeof value!=='boolean'&&String(value).trim()!==''&&Number.isFinite(Number(value));
  const text=value!=null&&typeof value!=='object'&&!['unknown','unavailable',''].includes(String(value))?String(value):'—';
  metric={label:entity?.attributes?.friendly_name||id||(weatherDutch(hass)?'Eigen gegevens':'Custom data'),value:numeric?weatherNumber(value,hass,unit,config[field+'_decimals']??2):text,entity:id};
 }else{
  metric=weatherMetric(key,attributes,hass,available);if(!metric)return null;
  const value=available?attributes[key]:null,digits=config[field+'_decimals'];
  if(typeof value!=='string'||Number.isFinite(Number(value))){
   const unitKey=WEATHER_METRICS[key][2],sourceUnit=unitKey.endsWith('_unit')?attributes[unitKey]:unitKey;
   metric.value=weatherNumber(value,hass,config[field+'_show_unit']?(config[field+'_unit']||sourceUnit||''):'',digits??WEATHER_METRICS[key][3]);
  }
 }
 metric.label=config[field+'_label']||metric.label;return metric;
}
export function weatherMetric(key,attributes,hass,available=true) {
 const definition=WEATHER_METRICS[key];if(!definition)return null;
 const [nl,en,unitKey,digits]=definition,value=available?attributes[key]:null;
 const unit=unitKey.endsWith('_unit')?(attributes[unitKey]??''):unitKey;
 const bearing=key==='wind_bearing'&&typeof value==='string'&&/^(N|NNE|NE|ENE|E|ESE|SE|SSE|S|SSW|SW|WSW|W|WNW|NW|NNW)$/i.test(value);
 return {label:weatherDutch(hass)?nl:en,value:bearing?value.toUpperCase():weatherNumber(value,hass,unit,digits)};
}
export function weatherNumber(value,hass,unit='',digits=0) {
 if (value == null || typeof value === 'boolean' || String(value).trim()==='' || !Number.isFinite(Number(value))) return '—';
 const language=hass?.locale?.language ?? hass?.language ?? 'en';
 let text;
 try { text=new Intl.NumberFormat(language,{maximumFractionDigits:digits}).format(Number(value)); }
 catch { text=String(Number(value)); }
 return text + (unit ? (unit.startsWith('°') ? '' : ' ') + unit : '');
}
export function weatherCondition(state,dutch) {
 const data=WEATHER_CONDITIONS[state];
 return {label:data?.[dutch?0:1] ?? (dutch?'Weer niet beschikbaar':'Weather unavailable'),kind:data?.[2] ?? 'unknown',iconKind:data?.[3]??data?.[2]??'unknown'};
}
export function weatherForecastType(config,entity) {
 if(Array.isArray(config.tabs)){
  const flags=Number(entity?.attributes?.supported_features)||0;
  const preferred=config.forecast_type==='auto'?(flags&2?'hourly':flags&1?'daily':'hourly'):config.forecast_type;
  return config.tabs.includes(preferred)?preferred:(config.tabs[0]??preferred);
 }
 if(config.compact)return config.compact_forecast==='daily'?'daily':'hourly';
 if (config.forecast_type !== 'auto') return config.forecast_type;
 const flags=Number(entity?.attributes?.supported_features) || 0;
 return flags & 2 ? 'hourly' : flags & 1 ? 'daily' : 'hourly';
}
export function weatherForecastFields(config,type){return config['forecast_'+type+'_fields']??config.forecast_fields??['condition','temperature','templow','precipitation_probability'];}
export function weatherDayKey(value,hass){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:hass?.config?.time_zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(type=>parts.find(part=>part.type===type)?.value).join('');
 }catch{return date.toISOString().slice(0,10).replaceAll('-','');}
}
export function weatherForecastRows(rows,count,now=Date.now(),type='hourly',hass) {
 if (!Array.isArray(rows)) return [];
 const today=type==='daily'?weatherDayKey(now,hass):null;
 return rows.filter(row=>row && Number.isFinite(Date.parse(row.datetime)) && (type==='daily'?weatherDayKey(row.datetime,hass)>=today:Date.parse(row.datetime)>now-3600000))
  .sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime)).slice(0,count);
}
export function weatherDate(value,hass,type) {
 const options=type==='hourly'?{hour:'2-digit',minute:'2-digit'}:{weekday:'short'};
 try { return new Intl.DateTimeFormat(hass?.locale?.language ?? hass?.language ?? 'en',{...options,timeZone:hass?.config?.time_zone}).format(new Date(value)); }
 catch { return '—'; }
}
