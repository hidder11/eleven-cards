import {uiButton} from '../../../../shared/ui-button.js';

// Isolated proposals: synthetic values, no connection or services outside this page.
const value=(state,unit,attributes={})=>({state:String(state),attributes:{unit_of_measurement:unit,...attributes}});
const sample={soc:value(62,'%'),target_soc:value(80,'%'),range:value(238,'km'),power:value(7.1,'kW'),connected:value('on'),charging:value('on'),enabled:value('on'),mode:value('pv',undefined,{options:['off','pv','minpv','now']}),remaining_duration:value(45,'min'),charged_energy:value(20.72,'kWh'),session_price:value(7.06,'€'),charge_duration:value(7560,'s'),session_price_per_kwh:value(.34,'€/kWh'),solar_percentage:value(78,'%'),solar_share:value(60,'%',{min:0,max:100,step:10}),current:value(10.3,'A'),phases:value(3),vehicle_limit_soc:value(100,'%')};
const cards=[...document.querySelectorAll('eleven-car-card')], histories=new Map(), selections=new Set();
const commonStyles=`
 .proposal-range{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px;padding-top:12px;border-top:1px solid var(--divider-color)}
 .proposal-range dl{display:block}.proposal-range summary{font-size:11px;line-height:1.4;color:var(--secondary-text-color);cursor:pointer;min-height:24px}.proposal-range details{grid-column:1/-1;margin-top:-8px}.proposal-range details p{font-size:11px;color:var(--secondary-text-color);margin:3px 0 0}
 .window-options{display:flex;gap:4px;margin:0 0 12px}.window-options [data-ui-button]{flex:1;justify-content:center;min-height:32px;font-size:12px;padding:5px}.window-options [aria-pressed=true]{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color))}
 .window-stats{margin-top:12px}.pause-note{font-size:11px;margin:8px 0 0;color:var(--secondary-text-color);line-height:1.4}
 :host([data-density=compact]) .hero{margin-bottom:12px}:host([data-density=compact]) .car-stage{min-height:96px;padding-bottom:8px}:host([data-density=compact]) .picture{min-height:80px}:host([data-density=compact]) .picture img{height:90px}:host([data-density=compact]) .battery-value{font-size:36px}:host([data-density=compact]) .status-line{padding:7px 10px;margin-bottom:8px}:host([data-density=compact]) .live-readings>div{padding:8px 10px}:host([data-density=compact]) .live-value{font-size:22px}:host([data-density=compact]) .evcc-tabs{margin-top:12px}:host([data-density=compact]) .evcc-panel{padding-top:12px}:host([data-density=compact]) .plot{height:105px}:host([data-density=compact]) .solar-session,:host([data-density=compact]) .history{margin-top:12px}
`;
const pair=(label,reading)=>`<div><dt>${label}</dt><dd>${reading}</dd></div>`;
function seedHistory(card,minutes=60){
 const end=Date.now(),start=end-minutes*60000;
 const powers=Array.from({length:minutes/5+1},(_,index)=>[0,0,3.6,4.2,5.8,2.3,0,0,3.9,5.1,6.4,7.1,7.1][index%13]);
 card._historyData=powers.map((power,index)=>({time:start+index*300000,value:power}));card._historyRange={start,end};
 card._historyRevision=(card._historyRevision||0)+1;
 const mean=powers.slice(0,-1).reduce((sum,power)=>sum+power,0)/(powers.length-1);
 const pauses=powers.slice(1).filter((power,index)=>power===0&&powers[index]>0).length;
 histories.set(card,{minutes,mean,peak:Math.max(...powers),pauses});
}
function enhance(card){
 const root=card.shadowRoot;
 if(!card.hass||!root.querySelector('.hero')||root.querySelector('[data-proposal-style]'))return;
 const style=document.createElement('style');style.dataset.proposalStyle='';style.textContent=commonStyles;root.append(style);
 if(card.id==='range-card'){
  const soc=Number(card.hass.states['sensor.demo_soc'].state),target=Number(card.hass.states['sensor.demo_target_soc'].state),range=Number(card.hass.states['sensor.demo_range'].state);
  const atTarget=Math.round(range/soc*target),extra=Math.round(atTarget-range);
  root.querySelector('.hero').insertAdjacentHTML('beforeend',`<div class="proposal-range"><dl class="metrics">${pair('Bereik bij laaddoel','≈ '+atTarget+' km')}</dl><dl class="metrics">${pair('Extra bereik','≈ +'+extra+' km')}</dl><details><summary>Hoe is dit geschat?</summary><p>Huidig bereik gedeeld door accuniveau, vermenigvuldigd met het laaddoel. Afhankelijk van verbruik en omstandigheden.</p></details></div>`);
 }
 if(card.id==='history-card'){
  const {minutes,mean,peak,pauses}=histories.get(card),format=number=>new Intl.NumberFormat('nl',{maximumFractionDigits:1}).format(number);
  const history=root.querySelector('.history');
  history.insertAdjacentHTML('afterbegin',`<div class="window-options" role="group" aria-label="Grafiektijdvak">${[[15,'15 min'],[60,'1 uur'],[180,'3 uur']].map(([duration,text])=>uiButton({text,variant:'surface',attrs:{'data-window':duration,'aria-pressed':duration===minutes}})).join('')}</div>`);
  history.insertAdjacentHTML('beforeend',`<dl class="metrics window-stats">${pair('Piek · tijdvak',format(peak)+' kW')}${pair('Gemiddeld · tijdvak',format(mean)+' kW')}</dl><p class="pause-note">${pauses===1?'1 laadpauze':pauses+' laadpauzes'} in dit tijdvak</p>`);
  history.querySelectorAll('[data-window]').forEach(button=>button.onclick=()=>{
   const duration=Number(button.dataset.window);seedHistory(card,duration);card._signature=null;card._render();root.querySelector('[data-window="'+duration+'"]').focus({preventScroll:true});
  });
 }
}
for(const card of cards){
 const entities=Object.fromEntries(Object.keys(sample).map(field=>[field,(field==='mode'?'select':field==='solar_share'?'number':['connected','charging','enabled'].includes(field)?'binary_sensor':'sensor')+'.demo_'+field]));
 const states=Object.fromEntries(Object.entries(sample).map(([field,entity])=>[entities[field],{...entity,attributes:{...entity.attributes}}]));
 states['image.demo_car']=value('2026-10-21',undefined,{entity_picture:'/cards/car-card/qa/evcc/car.svg'});
 const hass={language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},states,connected:true,hassUrl:path=>location.origin+path,callService:async(domain,service,data)=>{
  const next=domain==='select'?data.option:String(data.value);card.hass={...card.hass,states:{...card.hass.states,[data.entity_id]:{...card.hass.states[data.entity_id],state:next}}};
 }};
 // Keep prototype additions separate from production sources and network history.
 card._syncHistory=()=>{};
 card._activeTab=card.id==='range-card'?'controls':'session';
 const render=card._render.bind(card);card._render=()=>{render();enhance(card)};
 card.setConfig({evcc_enabled:true,entity:entities.power,entities,image_entity:'image.demo_car',vehicle_name:'Elektrische auto'});
 seedHistory(card);card.hass=hass;
}
document.getElementById('compact-card').dataset.density='compact';
document.querySelectorAll('[data-density]').forEach(button=>{if(button.tagName!=='BUTTON')return;button.onclick=()=>{
 document.getElementById('compact-card').dataset.density=button.dataset.density;document.querySelectorAll('button[data-density]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
}});
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';event.currentTarget.setAttribute('aria-pressed',String(light))};
document.getElementById('controls').onchange=event=>cards.forEach(card=>card.setConfig({evcc_enabled:true,...card._config,show_controls:event.target.checked}));
const grid=document.getElementById('examples');
function view(){const choice=document.getElementById('view').value;grid.classList.toggle('focus',choice!=='all');grid.style.setProperty('--width',document.getElementById('width').value+'px');document.getElementById('width').disabled=choice==='all';document.querySelectorAll('[data-example]').forEach(article=>article.hidden=choice!=='all'&&article.dataset.example!==choice)}
document.getElementById('view').onchange=view;document.getElementById('width').onchange=view;
document.querySelectorAll('[data-pick]').forEach(button=>button.onclick=()=>{
 const choice=button.dataset.pick;if(selections.has(choice))selections.delete(choice);else selections.add(choice);
 button.setAttribute('aria-pressed',String(selections.has(choice)));document.querySelector('.selection').textContent=selections.size?'Je voorkeur: '+[...selections].join(' + '):'';
});
window.evccIdeas={cards,histories};
