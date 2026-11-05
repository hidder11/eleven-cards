// Synthetic weather only; no production connection or service calls.
import {WEATHER_BACKGROUNDS} from '../src/weather-backgrounds.js';
import {WEATHER_METRICS} from '../src/weather-utils.js';
const cards=[...document.querySelectorAll('eleven-weather-card')],subscriptions=new Set();
const makeForecast=type=>Array.from({length:8},(_,i)=>({datetime:new Date(Date.now()+(i+1)*(type==='daily'?86400000:3600000)).toISOString(),condition:['partlycloudy','sunny','sunny','cloudy','rainy','partlycloudy','sunny','cloudy'][i],temperature:[19,20,22,21,18,17,16,15][i],templow:11+i%3,precipitation:i*.2,wind_speed:12+i,humidity:65+i,precipitation_probability:[10,0,0,20,75,25,10,10][i]}));
const states=Object.fromEntries(cards.map((card,i)=>['weather.example_'+i,{state:card.dataset.weather,attributes:{temperature:[21,14,18,12][i],temperature_unit:'°C',precipitation_unit:'mm',apparent_temperature:[22,12,17,11][i],wind_speed:[9,24,15,6][i],wind_speed_unit:'km/h',humidity:[52,86,65,72][i],pressure:1017,pressure_unit:'hPa',visibility:12,visibility_unit:'km',uv_index:3,cloud_coverage:35,wind_gust_speed:28,wind_bearing:225,dew_point:9,supported_features:3}}]));
let hass={language:'nl',locale:{language:'nl'},themes:{darkMode:true},config:{time_zone:'Europe/Amsterdam'},connected:true,states,connection:{subscribeMessage:async(callback,request)=>{const sub={callback,request};subscriptions.add(sub);callback({forecast:makeForecast(request.forecast_type)});return()=>subscriptions.delete(sub);}}};
const sync=()=>cards.forEach(card=>{card.hass=hass;});
for(const [i,card] of cards.entries()){
 card.setConfig({type:'custom:eleven-weather-card',entity:'weather.example_'+i,title:'Het weer',forecast_type:'hourly'});
 card.addEventListener('hass-more-info',event=>{document.getElementById('last-event').textContent='Entiteitdetails: '+event.detail.entityId;});
}
sync();
document.getElementById('theme').onclick=event=>{const darkMode=document.body.classList.toggle('dark');event.currentTarget.textContent=darkMode?'Licht thema':'Donker thema';hass={...hass,themes:{darkMode}};sync();};
document.getElementById('width').onclick=event=>{const narrow=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
document.getElementById('forecast').onchange=event=>{for(const card of cards)card.setConfig({...card._config,show_forecast:event.target.value!=='none',forecast_type:event.target.value==='none'?card._config.forecast_type:event.target.value,compact_forecast:event.target.value});};
document.getElementById('offline').onclick=event=>{hass={...hass,connected:!hass.connected};event.currentTarget.textContent=hass.connected?'Verbinding verbreken':'Opnieuw verbinden';sync();};
window.weatherQA={cards,subscriptions,get hass(){return hass;},setHass(value){hass=value;sync();},makeForecast};

document.getElementById('compact').onclick=event=>{const compact=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(compact));event.currentTarget.textContent=compact?'Standaardweergave':'Compacte weergave';for(const card of cards)card.setConfig({...card._config,compact});};
for(const [id,key] of [['metric-primary','metric_primary'],['metric-secondary','metric_secondary']]){
 const select=document.getElementById(id);
 for(const [value,label] of [['none','Verbergen'],...Object.entries(WEATHER_METRICS).map(([key,labels])=>[key,labels[0]])]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
 select.value=key==='metric_primary'?'wind_speed':'humidity';
 select.onchange=()=>{for(const card of cards)card.setConfig({...card._config,[key]:select.value});};
}

const backgrounds=document.getElementById('background');
if(backgrounds){for(const item of WEATHER_BACKGROUNDS){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;backgrounds.append(option);}backgrounds.onchange=()=>{for(const card of cards)card.setConfig({...card._config,background:backgrounds.value});};}
const motion=document.getElementById('motion');if(motion)motion.onclick=()=>{const animate_icons=motion.getAttribute('aria-pressed')!=='true';motion.setAttribute('aria-pressed',String(animate_icons));motion.textContent=animate_icons?'Animatie uit':'Animatie aan';for(const card of cards)card.setConfig({...card._config,animate_icons,animate_background:animate_icons});};
