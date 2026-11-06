import '../dist/eleven-timeline-card.js';
const ids=['sensor.heating','sensor.annex'];
const changes=[[[0,'idle'],[.55,'heat'],[.72,'water'],[.8,'idle'],[.94,'heat']],[[0,'idle'],[.4,'heat'],[.7,'water'],[.96,'idle']]];
const variants={
 fade:'',
 outline:'.segment.filtered{opacity:1;background:transparent!important;box-shadow:inset 0 0 0 1px var(--secondary-text-color);border:0;pointer-events:none}.segment.filtered span{visibility:hidden}.legend .legend-item[aria-pressed=false]{opacity:1;text-decoration:none}.legend-item[aria-pressed=false] i{background:transparent!important;box-shadow:inset 0 0 0 1px var(--secondary-text-color)}.legend-item[aria-pressed=false]::after{content:"Uit";font-size:10px;border:1px solid var(--divider-color);border-radius:3px;padding:0 4px}',
 hide:'.segment.filtered{visibility:hidden}.legend .legend-item[aria-pressed=false]{opacity:1;text-decoration:none}.legend-item[aria-pressed=false] i{background:transparent!important;box-shadow:inset 0 0 0 1px var(--secondary-text-color)}.legend-item[aria-pressed=false]::after{content:"Verborgen";font-size:10px;color:var(--secondary-text-color)}'
};
for(const section of document.querySelectorAll('.option')){
 const card=section.querySelector('eleven-timeline-card'),render=card._render;
 // Preview-only alternatives: production filtering and interactions stay intact.
 card._render=function(){render.call(this);const style=document.createElement('style');style.textContent=':host,ha-card,.content{height:auto}'+variants[section.dataset.option];this.shadowRoot.append(style);};
 card.setConfig({entities:ids,title:'Warmtepomp',background:'none',hours_to_show:48,bar_height:12,row_gap:12,show_grid:false,show_title:false,show_navigation:false,series_options:ids.map(entity=>({entity,group:'Warmtepomp'})),state_colors:[{state:'heat',label:'Ruimte verwarmen',color:'#e6a000'},{state:'idle',label:'Rust',color:'#65768e'},{state:'water',label:'Tank verwarmen',color:'#cc78aa'}]});
 card._hiddenStates.add(card._stateLegendKey(ids[0],{state:'heat'}));
 card.hass={language:'nl',config:{time_zone:'Europe/Amsterdam'},states:Object.fromEntries(ids.map((id,i)=>[id,{state:'idle',attributes:{friendly_name:['Bedrijfsmodus','Warmtepomp bijgebouw'][i]}}])),callApi:async(_,url)=>{
  const start=Date.parse(url.split('?')[0].replace('history/period/','')),end=Date.parse(new URLSearchParams(url.split('?')[1]).get('end_time'));
  return ids.map((entity_id,i)=>changes[i].map(([position,state])=>({entity_id,state,last_changed:new Date(start+(end-start)*position).toISOString()})));
 }};
}
document.querySelector('#theme').onclick=()=>{const light=document.body.classList.toggle('light');document.querySelector('#theme').textContent=light?'Donker thema':'Licht thema';};
document.querySelector('#width').onclick=()=>{const narrow=document.body.classList.toggle('narrow');document.querySelector('#width').textContent=narrow?'Brede kaarten':'Smalle kaarten';document.querySelector('#width').setAttribute('aria-pressed',String(narrow));};
