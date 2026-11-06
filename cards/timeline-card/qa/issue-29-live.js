import '../dist/eleven-timeline-card.js';
const card=document.querySelector('eleven-timeline-card');
const ids=['sensor.heating','sensor.annex','sensor.studio','sensor.ventilation','sensor.upstairs','sensor.office','light.living_room','light.kitchen','light.garden'];
const names=['Warmtepomp woning','Warmtepomp bijgebouw','Warmtepomp studio','Ventilatie beneden','Ventilatie boven','Ventilatie kantoor','Woonkamer','Keuken','Tuin'];
const changes=[
 [[0,'idle'],[.55,'heat'],[.72,'water'],[.8,'idle'],[.94,'heat']],
 [[0,'idle'],[.4,'heat'],[.7,'water'],[.96,'idle']],
 [[0,'heat'],[.15,'idle'],[.48,'heat'],[.61,'idle'],[.84,'water'],[.93,'idle']],
 [[0,'normal'],[.3,'recommended'],[.4,'normal'],[.67,'forced-off'],[.75,'normal'],[.92,'recommended']],
 [[0,'normal'],[.4,'forced-on'],[.5,'normal'],[.91,'recommended'],[.98,'normal']],
 [[0,'normal'],[.22,'forced-off'],[.31,'normal'],[.58,'recommended'],[.7,'normal'],[.84,'forced-on']],
 [[0,'off'],[.22,'on'],[.36,'off'],[.7,'on'],[.88,'off']],
 [[0,'off'],[.18,'on'],[.3,'off'],[.56,'on'],[.64,'off'],[.82,'on'],[.94,'off']],
 [[0,'on'],[.08,'off'],[.39,'on'],[.58,'off'],[.85,'on']]
];
const states=[['heat','Ruimte verwarmen','#e6a000'],['idle','Rust','#65768e'],['water','Tank verwarmen','#cc78aa'],['normal','Normaal','#65768e'],['recommended','Aanbevolen aan','#2cc2f3'],['forced-off','Gedwongen uit','#9674e1'],['forced-on','Gedwongen aan','#f5a000'],['on','Aan','#2cc2f3'],['off','Uit','#65768e']];
const groups=['Warmtepomp','Ventilatie','Verlichting'];
card.setConfig({entities:ids,title:'Statusoverzicht',background:'none',hours_to_show:48,bar_height:12,row_gap:16,show_grid:false,series_options:ids.map((entity,i)=>({entity,group:groups[Math.floor(i/3)]})),state_colors:states.map(([state,label,color])=>({state,label,color}))});
for(const [id,state] of [[ids[0],'heat'],[ids[3],'forced-off'],[ids[6],'off']])card._hiddenStates.add(card._stateLegendKey(id,{state}));
card.hass={language:'nl',config:{time_zone:'Europe/Amsterdam'},states:Object.fromEntries(ids.map((id,i)=>[id,{state:changes[i].at(-1)[1],attributes:{friendly_name:names[i]}}])),callApi:async(_,url)=>{
 const start=Date.parse(url.split('?')[0].replace('history/period/','')),end=Date.parse(new URLSearchParams(url.split('?')[1]).get('end_time'));
 return ids.map((entity_id,i)=>changes[i].map(([position,state])=>({entity_id,state,last_changed:new Date(start+(end-start)*position).toISOString()})));
}};
document.querySelector('#theme').onclick=()=>{const light=document.body.classList.toggle('light');document.querySelector('#theme').textContent=light?'Donker thema':'Licht thema';};
document.querySelector('#width').onclick=()=>{const narrow=card.classList.toggle('narrow');document.querySelector('#width').textContent=narrow?'Brede kaart':'Smalle kaart';document.querySelector('#width').setAttribute('aria-pressed',String(narrow));};
document.querySelector('#popup').onclick=()=>{card._tooltipGroup='Warmtepomp';card._pinned=true;card._showTooltip(card._viewStart+(card._viewEnd-card._viewStart)*.95,false);};
document.querySelector('#restore').onclick=()=>{card._hiddenStates.clear();card._hideTooltip();card._render();};
