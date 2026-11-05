import {HEADER_BACKGROUNDS} from '../header-backgrounds.js';
import {WEATHER_CONDITIONS} from '../../cards/weather-card/src/weather-utils.js';

// Local, synthetic HA contracts. No real Home Assistant connection or service calls.
const iconPaths={sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',wind:'M3 8h12a3 3 0 1 0-3-3M3 12h17a2 2 0 1 1-2 2M3 16h7a3 3 0 1 1-3 3',water:'M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12Z',car:'M4 11l2-6h12l2 6M3 11h18v8H3zM6 19v2m12-2v2M6 14h2m8 0h2',clock:'M12 8v5l3 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18',bolt:'m13 2-8 12h6l-1 8 9-13h-6z',chart:'M4 3v17h17M8 16v-5m5 5V7m5 9V4',pin:'M12 21s7-8 7-12A7 7 0 0 0 5 9c0 4 7 12 7 12Zm0-15v6m-3-3h6'};
if(!customElements.get('ha-icon'))customElements.define('ha-icon',class extends HTMLElement{
 static get observedAttributes(){return ['icon'];}
 connectedCallback(){this.draw();}attributeChangedCallback(){this.draw();}
 draw(){const name=this.getAttribute('icon')||'',key=/wind/.test(name)?'wind':/water|humidity/.test(name)?'water':/sun/.test(name)?'sun':/timer|clock/.test(name)?'clock':/lightning/.test(name)?'bolt':/car/.test(name)?'car':/map|distance/.test(name)?'pin':'chart';this.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;width:100%;height:100%"><path d="'+iconPaths[key]+'"/></svg>';}
});
const sensor=(value,unit='',attributes={})=>({state:String(value),attributes:{unit_of_measurement:unit,...attributes}});
const baseStates={
 'image.car':sensor('2026-10-23','',{entity_picture:'/cards/car-card/qa/evcc/car.svg'}),
 'sensor.fuel':sensor(62,'%',''),'sensor.range':sensor(540,'km'),'sensor.odometer':sensor(98452,'km'),
 'sensor.vehicle_status':sensor('Geparkeerd'),'sensor.tire_pressure':sensor(2.5,'bar'),
 'sensor.service':sensor(8200,'km'),'sensor.rain':sensor(1.8,'mm'),
 'sensor.solar_power':sensor(4600,'W'),'sensor.grid_power':sensor(-800,'W'),
};
const entities={};
for(const [field,value] of Object.entries({power:sensor(7.1,'kW'),soc:sensor(62,'%'),target_soc:sensor(80,'%'),connected:sensor('on'),charging:sensor('on'),mode:sensor('pv','',{options:['off','pv','now']}),range:sensor(284,'km'),remaining_duration:sensor(95,'min'),charged_energy:sensor(12.4,'kWh'),session_price:sensor(2.38,'€'),session_price_per_kwh:sensor(.192,'€/kWh'),solar_percentage:sensor(78,'%'),charge_duration:sensor(7200,'s'),current:sensor(10.3,'A'),phases:sensor(3),vehicle_limit_soc:sensor(90,'%'),enabled:sensor('on'),smart_cost_active:sensor('off'),plan_active:sensor('off'),solar_share:sensor(60,'%',{min:0,max:100,step:10})})){
 const domain=field==='mode'?'select':field==='solar_share'?'number':['connected','charging','enabled','smart_cost_active','plan_active'].includes(field)?'binary_sensor':'sensor';
 entities[field]=domain+'.demo_'+field;baseStates[entities[field]]=value;
}
const forecast=type=>Array.from({length:8},(_,i)=>({datetime:new Date(Date.now()+(i+1)*(type==='daily'?86400000:3600000)).toISOString(),condition:['partlycloudy','sunny','cloudy','rainy','sunny','snowy','windy','clear-night'][i],temperature:[19,21,18,16,22,13,17,14][i],templow:8+i%4,precipitation_probability:[10,0,35,80,0,65,20,5][i],precipitation:i*.3,wind_speed:9+i*2,wind_gust_speed:14+i*3,humidity:60+i,uv_index:4-i%4}));
const prefs={energy_sources:[{type:'solar',stat_energy_from:'sensor.solar_energy',stat_rate:'sensor.solar_power'},{type:'grid',stat_energy_from:'sensor.grid_import_energy',stat_energy_to:'sensor.grid_export_energy',stat_rate:'sensor.grid_power'}]};
const samples=[];
const add=(kind,name,description,config,states={},extra={})=>samples.push({kind,name,description,config,states,extra});
const carBase={title:'Mijn auto',image_entity:'image.car',percentage_entity:'sensor.fuel',range_source:'entity',range_entity:'sensor.range',field_1_entity:'sensor.vehicle_status',field_1_label:'Status',field_2_entity:'sensor.range',field_2_label:'Actieradius',field_3_entity:'sensor.odometer',field_3_label:'Kilometerstand'};
const weatherBase={entity:'weather.demo',title:'Het weer',tabs:['hourly','daily']};
const evccBase={evcc_enabled:true,title:'Auto laden',image_entity:'image.car',entities,tabs:['controls','session','technical']};
const weatherState=(condition,temperature=21)=>sensor(condition,'',{temperature,temperature_unit:'°C',apparent_temperature:temperature-2,wind_speed:14,wind_speed_unit:'km/h',humidity:68,pressure:1017,pressure_unit:'hPa',visibility:12,visibility_unit:'km',uv_index:4,cloud_coverage:35,wind_gust_speed:28,wind_bearing:225,dew_point:9,supported_features:3,precipitation_unit:'mm'});
Object.entries(WEATHER_CONDITIONS).forEach(([condition,labels],i)=>add('weather',labels[0],['Uur- en dagverwachting','Glazen icoon, alleen per dag','Compact, alleen per uur'][i%3],{...weatherBase,background:HEADER_BACKGROUNDS[i%8].value,icon_style:['classic','glass','neon'][i%3],compact:i%3===2,...(i%3===1?{tabs:['daily']}:{})},{'weather.demo':weatherState(condition,condition.includes('snow')?-2:21-i%8)}));
add('weather','Alleen de hoofdwaarde','Alle drie informatievlakken en de verwachting verborgen',{...weatherBase,metric_status:'none',metric_primary:'none',metric_secondary:'none',tabs:[],background:'halo'},{'weather.demo':weatherState('sunny')});
add('weather','Eigen neerslagmeter','Eigen sensor in het brede vak, UV-index en zicht eronder',{...weatherBase,metric_status:'custom',metric_status_entity:'sensor.rain',metric_status_label:'Neerslag vandaag',metric_status_icon:'mdi:weather-rainy',metric_primary:'uv_index',metric_secondary:'visibility',background:'ribbon'},{'weather.demo':weatherState('rainy')});
add('weather','Rijke dagverwachting','Neerslag, windstoten en luchtvochtigheid per dag',{...weatherBase,tabs:['daily'],forecast_daily_fields:['condition','temperature','templow','precipitation','wind_gust_speed','humidity'],icon_style:'glass',background:'clouds'},{'weather.demo':weatherState('partlycloudy')});
add('weather','Compact · zonder verwachting','Alleen de status en één gegevensveld',{...weatherBase,compact:true,tabs:[],metric_secondary:'none',background:'aurora'},{'weather.demo':weatherState('clear-night',9)});
add('weather','Weer niet beschikbaar','Ontbrekende gegevens blijven herkenbaar',{...weatherBase,tabs:[],background:'isobars'},{'weather.demo':sensor('unavailable')});
add('weather','Offline weer','Laatst ontvangen waarden met melding',{...weatherBase,background:'clouds'},{'weather.demo':weatherState('rainy',13)},{connected:false});
add('car','Brandstof & eigen sensoren','Drie gedeelde informatievlakken met eigen labels',carBase);
add('car','Compacte auto','Compacte waarden, zonder tabbladen',{...carBase,compact:true,background:'halo'});
add('car','Berekend bereik','800 km bij 100%, herkenbaar als schatting',{...carBase,range_source:'calculated',range_full:800,background:'ribbon'});
add('car','Eigen tabbladen','Onderhoud en banden met eigen sensoren',{...carBase,background:'prism-glass',custom_tabs:[{id:'custom-service',title:'Onderhoud',entities:[{entity:'sensor.service',name:'Tot volgende beurt'},{entity:'sensor.odometer',name:'Kilometerstand'}]},{id:'custom-tires',title:'Banden',entities:[{entity:'sensor.tire_pressure',name:'Bandenspanning'}]}]});
add('car','Alleen de auto','Alle informatievlakken verborgen',{...carBase,show_field_1:false,show_field_2:false,show_field_3:false,background:'eclipse'});
add('car','Alleen een breed vak','Geen lege ruimte voor de verborgen onderste velden',{...carBase,show_field_2:false,show_field_3:false,background:'aurora'});
add('car','Eén onderste veld','De overgebleven waarde vult de beschikbare breedte',{...carBase,show_field_1:false,show_field_3:false,background:'clouds'});
add('car','Grote autoafbeelding','180%, iets omhoog en naar rechts verschoven',{...carBase,image_scale:180,image_offset_x:18,image_offset_y:-10,background:'isobars'});
add('car','Vast percentage','Handmatige waarde en geschat bereik in mijlen',{...carBase,percentage_entity:'',percentage:38,range_source:'calculated',range_full:440,range_unit:'mi',color:'waiting',background:'halo'});
add('car','Sensor niet beschikbaar','Een ontbrekend brandstofniveau wordt geen 0%',{...carBase,color:'off'},{'sensor.fuel':sensor('unavailable')});
add('car','Zonder afbeelding','Fallback wanneer geen image entity is ingesteld',{...carBase,image_entity:'',color:'done',background:'ribbon'});
add('car','Compact met eigen tabblad','Compact houdt het gekozen tabblad beschikbaar',{...carBase,compact:true,background:'prism-glass',custom_tabs:[{id:'custom-car',title:'Auto',entities:[{entity:'sensor.tire_pressure',name:'Banden'},{entity:'sensor.service',name:'Onderhoud over'}]}]});
for(const [name,description,overrides,config] of [
 ['Laden · slim','Bediening met zonnevoorkeur',{},{}],
 ['Laden · laadsessie','Sessiedetails en laadverloop',{}, {default_tab:'session',background:'ribbon'}],
 ['Laden · EVCC-details','Technische entiteiten in het derde tabblad',{}, {default_tab:'technical',background:'prism-glass'}],
 ['Niet aangesloten','Geen actieve laadsessie',{connected:'off',charging:'off',power:0},{background:'halo'}],
 ['Wachten op laden','Aangesloten, EVCC heeft nog niet gestart',{charging:'off',power:0},{background:'clouds'}],
 ['Laaddoel bereikt','De gewenste 80% is bereikt',{charging:'off',power:0,soc:80},{background:'eclipse'}],
 ['Laden uitgeschakeld','Modus Off, auto aangesloten',{charging:'off',power:0,mode:'off'},{background:'isobars'}],
 ['Laden volgens planning','Actieve planning met eigen accentkleur',{plan_active:'on'},{background:'aurora'}],
 ['Compact laden','Compacte waarden met geselecteerde bediening',{}, {compact:true,tabs:['controls'],background:'halo'}],
 ['Compacte sessie','Compact mét gekozen sessietab',{}, {compact:true,tabs:['session'],default_tab:'session',background:'ribbon'}],
 ['Alleen de laadstatus','EVCC zonder tabbladen',{}, {tabs:[],background:'prism-glass'}],
 ]){
 const states=Object.fromEntries(Object.entries(overrides).map(([key,value])=>[entities[key],{...baseStates[entities[key]],state:String(value)}]));
 add('evcc',name,description,{...evccBase,...config},states);
}
add('energy','Actueel · teruglevering','Zon levert aan woning en elektriciteitsnet',{default_view:'live',background:'ribbon'});
add('energy','Historisch · vandaag','Alle tijdknoppen samen, grote waarde in kWh',{default_view:'history',background:'halo'});
add('energy','Compact · netafname','Compact diagram zonder zonneproductie',{compact:true,background:'isobars'},{'sensor.solar_power':sensor(0,'W'),'sensor.grid_power':sensor(3800,'W')});
add('energy','Compact · historisch','Historisch met dezelfde compacte hoofdwaarde',{compact:true,default_view:'history',background:'aurora'});

const records=[];
for(const sample of samples){
 const article=document.createElement('article'),heading=document.createElement('h2'),description=document.createElement('p'),details=document.createElement('details'),summary=document.createElement('summary'),code=document.createElement('pre');
 article.dataset.kind=sample.kind;heading.textContent=sample.name;description.textContent=sample.description;summary.textContent='Configuratie bekijken';
 const tag=sample.kind==='weather'?'eleven-weather-card':sample.kind==='energy'?'eleven-energy-flow-card':'eleven-car-card',card=document.createElement(tag),config={type:'custom:'+tag,...sample.config};
 code.textContent=JSON.stringify(config,null,2);details.append(summary,code);article.append(heading,description,card,details);document.querySelector('#gallery').append(article);
 let hass={language:'nl',locale:{language:'nl'},themes:{darkMode:true},connected:true,config:{time_zone:'Europe/Amsterdam'},states:structuredClone({...baseStates,...sample.states}),...sample.extra};
 hass.connection={subscribeMessage:async(callback,request)=>{let active=true;queueMicrotask(()=>{if(active)callback({forecast:forecast(request.forecast_type)});});return()=>{active=false;};}};
 hass.callWS=async request=>{
  if(request.type==='config/entity_registry/list')return [];
  if(request.type==='energy/get_prefs')return structuredClone(prefs);
  if(request.type==='recorder/statistics_during_period')return Object.fromEntries(request.statistic_ids.map(id=>[id,[{start:Date.parse(request.start_time),change:id.includes('solar')?18.4:id.includes('import')?7.2:6.4}]]));
  throw Error('Unexpected gallery request '+request.type);
 };
 hass.callApi=async(method,url)=>{const id=new URL(url,location.origin).searchParams.get('filter_entity_id');return [[0,2,4,6,7.1,5,7.1].map((power,i)=>({entity_id:id,state:id?.startsWith('binary_sensor.')?'on':String(power),last_changed:new Date(Date.now()-(6-i)*1200000).toISOString()}))];};
 const record={sample,card,article,config,get hass(){return hass;},setHass(value){hass=value;card.hass=hass;}};
 hass.callService=async(domain,service,data)=>{const state=data.option??String(data.value);hass={...hass,states:{...hass.states,[data.entity_id]:{...hass.states[data.entity_id],state}}};card.hass=hass;document.querySelector('#event').textContent='Demo aangepast: '+state;};
 card.setConfig(config);card.hass=hass;records.push(record);
 card.addEventListener('hass-more-info',event=>document.querySelector('#event').textContent='Entiteitdetails: '+event.detail.entityId);
}
const updateCount=()=>{document.querySelector('#count').textContent=records.filter(r=>!r.article.hidden).length+' van '+records.length+' configuraties';};
document.querySelector('#filter').onchange=event=>{for(const r of records)r.article.hidden=event.target.value!=='all'&&r.sample.kind!==event.target.value;updateCount();};
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';event.currentTarget.setAttribute('aria-pressed',String(light));for(const r of records)r.setHass({...r.hass,themes:{darkMode:!light}});};
document.querySelector('#width').onclick=event=>{const narrow=document.querySelector('#gallery').classList.toggle('narrow');event.currentTarget.setAttribute('aria-pressed',String(narrow));event.currentTarget.textContent=narrow?'Normale breedte':'Smalle kaarten';};
document.querySelector('#motion').onclick=event=>{const moving=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(moving));event.currentTarget.textContent=moving?'Animatie pauzeren':'Animatie afspelen';for(const r of records)r.card.setConfig({...r.card._config,animate_background:moving,animate_icons:moving});};
window.configurationGallery=records;updateCount();
