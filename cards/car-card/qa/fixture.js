import {EVCC_BACKGROUNDS} from '../src/evcc/evcc-backgrounds.js';
const car=document.querySelector('eleven-car-card'),evcc=document.querySelector('eleven-car-card[data-evcc]');
const entity=(state,unit,name)=>({state:String(state),attributes:{unit_of_measurement:unit,friendly_name:name}});
const hass={language:'nl',locale:{language:'nl'},themes:{darkMode:true},states:{
 'sensor.fuel':entity(62,'%','Brandstofniveau'),'sensor.status':entity('Geparkeerd',null,'Status'),
 'sensor.range':entity(540,'km','Actieradius'),'sensor.odometer':entity(98452,'km','Kilometerstand'),
 'image.car':{state:'2026-10-22',attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg'}},
 'sensor.power':entity(6.4,'kW','Laadvermogen'),'sensor.soc':entity(62,'%','Accu'),
}};
let config={title:'Mijn auto',percentage_entity:'sensor.fuel',image_entity:'image.car',field_1_entity:'sensor.status',field_1_label:'Status',field_2_entity:'sensor.range',field_2_label:'Actieradius',field_3_entity:'sensor.odometer',field_3_label:'Kilometerstand'};
let evccConfig={evcc_enabled:true,title:'Auto laden',image_entity:'image.car',show_controls:false,show_session:false,show_details:false,entities:{soc:'sensor.soc',power:'sensor.power'}};
car.hass=hass;car.setConfig(config);evcc.hass=hass;evcc.setConfig(evccConfig);
car.addEventListener('hass-more-info',event=>document.querySelector('#event').textContent='Entiteit: '+event.detail.entityId);
const backgrounds=document.querySelector('#background');for(const item of EVCC_BACKGROUNDS){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;backgrounds.append(option);}
backgrounds.onchange=()=>{config={...config,background:backgrounds.value};evccConfig={...evccConfig,background:backgrounds.value};car.setConfig(config);evcc.setConfig(evccConfig);};
document.querySelector('#compact').onclick=()=>{config={...config,compact:!config.compact};evccConfig={...evccConfig,compact:config.compact};car.setConfig(config);evcc.setConfig(evccConfig);};
document.querySelector('#theme').onclick=()=>{hass.themes={darkMode:!hass.themes.darkMode};document.body.style.cssText=hass.themes.darkMode?'':'background:#f2f4f7;color:#20252b;--primary-text-color:#20252b;--secondary-text-color:#626b78;--ha-card-background:#fff;--card-background-color:#fff;--secondary-background-color:#edf0f4;color-scheme:light';car.hass=hass;evcc.hass=hass;};
window.carQA={car,evcc,hass,config,evccConfig};
