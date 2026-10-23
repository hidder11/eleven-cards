// Isolated proposals. All readings are synthetic; no HA connection or service calls.
const field=(state,unit,extra={})=>({state:String(state),attributes:{unit_of_measurement:unit,...extra}});
const sample={power:field(7.1,'kW'),soc:field(62,'%'),target_soc:field(80,'%'),range:field(238,'km'),connected:field('on'),charging:field('on'),enabled:field('on'),mode:field('smart'),plan_active:field('off'),remaining_duration:field(45,'min'),current:field(10.3,'A'),phases:field(3),charged_energy:field(12.4,'kWh'),session_price:field(2.38,'€'),session_price_per_kwh:field(.192,'€/kWh'),solar_percentage:field(78,'%'),charge_duration:field(7200,'s')};
const entities=Object.fromEntries(Object.keys(sample).map(key=>[key,(['connected','charging','enabled','plan_active'].includes(key)?'binary_sensor':key==='mode'?'select':'sensor')+'.demo_'+key]));
const readings=Object.fromEntries(Object.entries(sample).map(([key,value])=>[entities[key],value]));
readings['image.demo_car']=field('2026-10-22',undefined,{entity_picture:'/cards/car-card/qa/evcc/car.svg'});
const end=Date.now(),start=end-10800000;
const points=[0,0,3.6,4.2,5.8,2.3,0,0,3.9,5.1,6.4,7.1,7.1].map((value,i)=>({time:start+i*900000,value}));
let energy=0,known=0,idle=0;
for(let i=0;i<points.length-1;i++){
 const seconds=(points[i+1].time-points[i].time)/1000;
 energy+=points[i].value*seconds/3600;known+=seconds;if(points[i].value===0)idle+=seconds;
}
readings[entities.charged_energy]=field(energy,'kWh');
readings[entities.session_price]=field(energy*.192,'€');
const format=(value,digits=1)=>new Intl.NumberFormat('nl',{maximumFractionDigits:digits}).format(value);
const common=`.content{height:auto;min-height:0}.proposal-caption{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--secondary-text-color);margin-bottom:8px}.proposal-caption strong{color:var(--tone);font-weight:600}.proposal-power{margin-top:14px}.proposal-track{height:4px;background:var(--secondary-background-color);border-radius:4px;overflow:hidden}.proposal-track span{display:block;height:100%;background:var(--tone);border-radius:inherit}.proposal-metrics{padding-top:16px;margin-top:16px;border-top:1px solid var(--divider-color);grid-template-columns:repeat(2,minmax(0,1fr))}.proposal-range{display:block;margin-top:6px;font-size:11px;color:var(--secondary-text-color);line-height:1.4}.proposal-range strong{color:var(--primary-text-color);font-weight:600}.proposal-expand{padding:3px 8px;border:1px solid var(--divider-color);border-radius:5px;font-size:11px;min-height:28px;text-align:center}.history[data-expanded=true] .plot{height:230px}`;
const cards=[...document.querySelectorAll('eleven-car-card')];
for(const card of cards){
 card._syncHistory=()=>{};
 const render=card._render.bind(card);
 card._render=()=>{
  render();const root=card.shadowRoot;
  if(!root.querySelector('.live-readings')||root.querySelector('[data-polish]'))return;
  const style=document.createElement('style');style.dataset.polish='';style.textContent=common;root.append(style);
  if(card.dataset.idea==='power'){
   const value=Number(card.hass.states[entities.power].state),share=Math.max(0,Math.min(100,value/11*100));
   const section=document.createElement('div');section.className='proposal-power';
   section.innerHTML=`<div class="proposal-caption"><span>Benut laadvermogen · maximaal 11 kW</span><strong>${format(share,0)}%</strong></div><div class="proposal-track" role="meter" aria-label="Benut laadvermogen" aria-valuemin="0" aria-valuemax="11" aria-valuenow="${value}"><span style="width:${share}%"></span></div>`;
   root.querySelector('.live-readings').after(section);
  }
  if(card.dataset.idea==='session'&&root.querySelector('.history .plot')){
   const metrics=document.createElement('dl');metrics.className='metrics proposal-metrics';
   metrics.innerHTML=[['Gemiddeld vermogen',`${format(energy/(known/3600))} kW`],['Piekvermogen',`${format(Math.max(...points.map(p=>p.value)))} kW`],['Tijd zonder laadvermogen',`${format(idle/60,0)} min`]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
   root.querySelector('.history').append(metrics);
  }
  if(card.dataset.idea==='graph'&&root.querySelector('.history .plot')){
   const history=root.querySelector('.history'),button=document.createElement('button');button.className='proposal-expand';
   const update=()=>{history.dataset.expanded=String(!!card._proposalExpanded);button.textContent=card._proposalExpanded?'Verkleinen':'Vergroten';button.setAttribute('aria-expanded',String(!!card._proposalExpanded));};
   button.onclick=()=>{card._proposalExpanded=!card._proposalExpanded;update();};
   history.querySelector('.chart-head').append(button);update();
  }
  if(card.dataset.idea==='range'){
   const soc=Number(card.hass.states[entities.soc].state),range=Number(card.hass.states[entities.range].state),target=Number(card.hass.states[entities.target_soc].state);
   if(soc>0&&soc<=100&&range>=0&&Number.isFinite(range)&&target>=soc&&target<=100){
    const hint=document.createElement('span');hint.className='proposal-range';hint.innerHTML=`Bij laaddoel <strong>≈ ${format(range/soc*target,0)} km</strong>`;root.querySelector('.battery-meta').append(hint);
   }
  }
 };
 card.setConfig({evcc_enabled:true,entity:entities.power,entities,image_entity:'image.demo_car',show_controls:false,show_details:false,show_session:['session','graph'].includes(card.dataset.idea)});
}
function sync(){
 const selected=document.getElementById('state').value,charging=['charging','planned'].includes(selected),connected=selected!=='disconnected',darkMode=!document.body.classList.contains('light');
 const states={...readings,[entities.charging]:field(charging?'on':'off'),[entities.connected]:field(connected?'on':'off'),[entities.plan_active]:field(selected==='planned'?'on':'off'),[entities.power]:field(charging?7.1:0,'kW'),[entities.current]:field(charging?10.3:0,'A')};
 for(const card of cards){
  card.hass={language:'nl',locale:{language:'nl'},themes:{darkMode},config:{time_zone:'Europe/Amsterdam'},connected:true,states,hassUrl:path=>location.origin+path};
  card._historyData=points;card._historyRange={start,end};card._historyRevision=(card._historyRevision??0)+1;card._render();
 }
}
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';sync();};
document.getElementById('state').onchange=sync;
document.getElementById('width').onclick=event=>{const narrow=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
sync();window.evccPolish={cards,sync};
