import './flow-design.js';
// Only this QA fixture supplies synthetic data. The production card always reads HA.
const prefs={energy_sources:[{type:'solar',stat_energy_from:'sensor.solar_energy',stat_rate:'sensor.solar_power'},{type:'grid',stat_energy_from:'sensor.grid_import_energy',stat_energy_to:'sensor.grid_export_energy',stat_rate:'sensor.grid_power'}]};
const cards=[...document.querySelectorAll('eleven-energy-flow-design')];
const state=(value,unit)=>({state:String(value),attributes:{unit_of_measurement:unit}});
const mock={language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:true},states:{'sensor.solar_power':state(4600,'W'),'sensor.grid_power':state(-.8,'kW')},callWS:async message=>{
 if(message.type==='energy/get_prefs')return structuredClone(prefs);
 if(message.type==='recorder/statistics_during_period'){
  const factor=Math.max(.01,(Date.parse(message.end_time)-Date.parse(message.start_time))/86400000),amounts={'sensor.solar_energy':18.4,'sensor.grid_import_energy':7.2,'sensor.grid_export_energy':6.4};
  return Object.fromEntries(message.statistic_ids.map(id=>[id,[{start:Date.parse(message.start_time),change:amounts[id]*factor}]]));
 }
 throw Error('Unexpected QA request');
}};
for(const card of cards){card.setConfig({default_view:card.dataset.initial});card.hass=mock;}
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.setAttribute('aria-pressed',String(light));event.currentTarget.textContent=light?'Donker thema':'Licht thema';cards.forEach(card=>{card.hass={...mock,themes:{darkMode:!light}};});};
document.querySelector('#motion').onclick=event=>{const moving=event.currentTarget.getAttribute('aria-pressed')!=='true';event.currentTarget.setAttribute('aria-pressed',String(moving));event.currentTarget.textContent=moving?'Animatie pauzeren':'Animatie afspelen';cards.forEach(card=>card.setConfig({...card._config,animate_background:moving}));};
document.querySelector('#width').onclick=event=>{const narrow=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.setAttribute('aria-pressed',String(narrow));event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
document.querySelector('#background').onchange=event=>cards.forEach(card=>card.setConfig({...card._config,background:event.target.value}));
window.energyFlowConcepts=cards;
