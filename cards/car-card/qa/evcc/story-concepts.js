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
const common=`
 .content{height:auto;min-height:0;--source-solar:#e5b644;--source-battery:#a99af0;--source-grid:#7cb6e9}.content[data-theme=light]{--source-solar:#896400;--source-battery:#7255b3;--source-grid:#386c9b}.story-muted{font-size:11px;color:var(--secondary-text-color);line-height:1.5}.story-note{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--divider-color);font-size:11px;color:var(--secondary-text-color);line-height:1.5}
 .flow-sources{position:absolute;top:93px;left:0;right:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;z-index:3;pointer-events:none}.flow-source{text-align:center;min-width:0;color:var(--source);font-size:10px;line-height:1.4}.flow-source strong{display:block;font-size:13px;font-weight:600}.flow-source span{display:inline-block;padding:3px 6px;border-radius:5px;background:color-mix(in srgb,var(--ha-card-background) 85%,transparent)}
 .flow-map{position:absolute;inset:130px 0 17px;z-index:1;pointer-events:none}.flow-map svg{width:100%;height:100%;overflow:visible}.flow-path{fill:none;stroke:var(--source);vector-effect:non-scaling-stroke;opacity:.65}.flow-particles{fill:none;stroke:var(--source);stroke-width:1.4;stroke-dasharray:3 18;stroke-linecap:round;vector-effect:non-scaling-stroke}
 @media(prefers-reduced-motion:no-preference){.flow-particles{animation:source-current var(--power-duration,5s) linear infinite}@keyframes source-current{to{stroke-dashoffset:-84}}}
 .decision-facts{margin-top:14px;padding:12px;border-radius:7px;background:color-mix(in srgb,var(--tone) 7%,transparent)}.decision-facts .eyebrow{margin-bottom:6px}.decision-flow{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--secondary-text-color)}.decision-flow strong{font-size:20px;color:var(--primary-text-color);letter-spacing:-.03em}.decision-flow b{color:var(--tone);font-weight:600}.decision-copy{font-size:12px;line-height:1.5;margin:0;color:var(--primary-text-color)}
 .receipt .battery-value{font-size:62px;line-height:1.2}.receipt-stamp{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--secondary-text-color);margin-bottom:4px}.receipt-date{display:block;margin-top:4px;font-size:10px;line-height:1.5;color:var(--secondary-text-color)}.receipt .battery-meta{max-width:60%}.receipt .evcc-tabs{margin-top:0}.receipt [role=tablist]{display:none}.receipt .history{border-top:0;margin-top:0;padding-top:0}.receipt .session-summary{display:none}.receipt .battery-track{display:none}.receipt .live-readings{margin-top:0}.receipt-footer{display:flex;justify-content:space-between;gap:8px;margin-top:14px;padding-top:10px;border-top:1px dashed var(--divider-color);font-size:10px;color:var(--secondary-text-color)}
 .impact-value{font-size:64px;letter-spacing:-.06em;line-height:1.15;font-weight:500}.impact-value small{font-size:22px;letter-spacing:-.02em}.impact-caption{font-size:11px;color:var(--secondary-text-color);line-height:1.4;margin-top:3px}.impact-cost{font-size:11px;color:var(--secondary-text-color);margin-top:8px}.impact-cost strong{color:var(--primary-text-color)}.impact-battery{font-size:10px;color:var(--secondary-text-color);margin-bottom:5px}.impact-road{margin-top:16px;display:flex;align-items:center;gap:10px;font-size:11px;color:var(--secondary-text-color)}.impact-road i{display:block;flex:1;height:4px;border-radius:4px;background:var(--secondary-background-color);position:relative}.impact-road i::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,var(--tone) 0 7px,transparent 7px 12px);border-radius:4px}
 @container(max-width:320px){.receipt .battery-value{font-size:52px}.impact-value{font-size:54px}.flow-source strong{font-size:12px}}
`;
let receiptDisconnected=true;
const cards=[...document.querySelectorAll('eleven-car-card')];
const element=(className,html)=>{const node=document.createElement('div');node.className=className;node.innerHTML=html;return node;};
const time=value=>new Intl.DateTimeFormat('nl',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'}).format(value);
for(const card of cards){
 card._syncHistory=()=>{};
 const render=card._render.bind(card);
 card._render=()=>{
  render();const root=card.shadowRoot,content=root.querySelector('.content');
  if(!root.querySelector('.live-readings')||root.querySelector('[data-story]'))return;
  const style=document.createElement('style');style.dataset.story='';style.textContent=common;root.append(style);
  const missing=document.getElementById('missing').checked;
  if(card.dataset.idea==='flow'){
   const mode=document.getElementById('flow-case').value,active=mode!=='waiting';
   const sources=[['Zon',4.2,'var(--source-solar)'],['Thuisbatterij',mode==='solar'?0:1.4,'var(--source-battery)'],['Net',mode==='solar'?0:1.5,'var(--source-grid)']].map(([name,power,color])=>({name,power:active?power:0,color}));
   const stage=root.querySelector('.car-stage');
   stage.append(element('flow-sources',sources.map(s=>`<div class="flow-source" style="--source:${s.color}"><span>${s.name}<strong>${missing?'—':format(s.power)+' kW'}</strong></span></div>`).join('')));
   const paths=sources.map((s,i)=>{if(missing||s.power===0)return '';const path=`M${[50,150,250][i]} 0 C${[50,150,250][i]} 55 150 45 150 95`;return `<path class="flow-path" d="${path}" style="--source:${s.color};stroke-width:${1+s.power*.6}"/><path class="flow-particles" d="${path}" style="--source:${s.color}"/>`;}).join('');
   stage.append(element('flow-map',`<svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`));
   root.querySelector('.live-readings').after(element('story-note',missing?'Herkomst van het laadvermogen niet beschikbaar. De kaart schat geen verdeling uit woningmetingen.':active?'De drie bronvermogens vormen samen het actuele laadvermogen.':'Geen actieve energiestroom naar de auto.'));
  }
  if(card.dataset.idea==='reason'){
   const reason=document.getElementById('reason-case').value;
   const messages={plan:['Actief laadvenster','EVCC gebruikt nu een actief tijdvak van je laadplan.'],limit:['Vermogenslimiet actief','Het beschikbare laadvermogen wordt begrensd.'],auth:['Autorisatie nodig','De laadpaal wacht op toestemming om te starten.'],unknown:['Reden niet beschikbaar','De auto is aangesloten, maar de precieze wachtreden is niet bekend.']};
   const [title,copy]=messages[missing?'unknown':reason];
   if(!missing&&reason==='auth'){root.querySelector('.status-line strong').textContent='Wachten op autorisatie';root.querySelector('.status-line p').textContent='Toestemming van de laadpaal nodig';}
   if(!missing&&reason==='limit')root.querySelector('.status-line p').textContent='Begrensd door beschikbaar vermogen';
   const detail=!missing&&reason==='limit'?'<div class="decision-flow"><span>Verzoek</span><strong>11 kW</strong><span>→</span><b>Beschikbaar 4,1 kW</b></div>':`<p class="decision-copy">${copy}</p>`;
   root.querySelector('.live-readings').after(element('decision-facts',`<span class="eyebrow">${title}</span>${detail}`));
  }
  if(card.dataset.idea==='receipt'&&receiptDisconnected){
   content.classList.add('receipt');
   root.querySelector('header h2').textContent='Laatste laadsessie';
   root.querySelector('.battery-row').prepend(element('receipt-stamp','Sessie afgerond'));
   root.querySelector('.battery-value').textContent=`${format(energy*.192,2)} €`;
   root.querySelector('.battery-meta').innerHTML=`<div class="range">${format(energy,2)} kWh geladen</div><span class="receipt-date">${time(start)}<br>tot ${time(end)}</span>`;
   root.querySelector('.status-line p').textContent='Hieronder staat de laatst afgeronde sessie';
   root.querySelector('.live-readings').innerHTML=`<div><span class="eyebrow">Laadduur</span><div class="live-value">2 u 0 min</div><span class="live-sub">3 uur aangesloten</span></div><div><span class="eyebrow">Zonneaandeel</span><div class="live-value">78 %</div><span class="live-sub">Van deze sessie</span></div>`;
   root.querySelector('.content').append(element('receipt-footer','<span>Afgerond bij loskoppelen</span><span>0,192 €/kWh</span>'));
  }
  if(card.dataset.idea==='impact'){
   const consumption=Number(document.getElementById('consumption').value),km=energy/consumption*100;
   if(missing){root.querySelector('.live-readings').after(element('story-note','Geen verbruikscijfer beschikbaar. Bijgeladen kilometers kunnen niet worden geschat.'));}
   else{
    root.querySelector('.battery-value').innerHTML=`<div class="impact-value">≈ ${format(km,0)} <small>km</small></div>`;
    root.querySelector('.battery-meta').innerHTML=`<div class="impact-caption">bijgeladen deze sessie · geschat</div><div class="impact-cost"><strong>${format(energy*.192,2)} €</strong> · ≈ ${format(consumption*.192,2)} €/100 km</div>`;
    root.querySelector('.battery-track').before(element('impact-battery','Accu 62%'));
    root.querySelector('.live-readings').after(element('impact-road',`<span>+0 km</span><i aria-hidden="true"></i><span>≈ +${format(km,0)} km</span>`));
    content.append(element('story-note',`Schatting bij ${format(consumption)} kWh/100 km, op basis van ${format(energy,2)} kWh geladen energie.`));
   }
  }
 };
 card.setConfig({evcc_enabled:true,entity:entities.power,entities,image_entity:'image.demo_car',show_controls:false,show_details:false,show_session:card.dataset.idea==='receipt'});
}
function sync(){
 const missing=document.getElementById('missing').checked,darkMode=!document.body.classList.contains('light');
 for(const card of cards){
  const flow=document.getElementById('flow-case').value,reason=document.getElementById('reason-case').value;
  const disconnected=card.dataset.idea==='receipt'&&receiptDisconnected;
  const charging=card.dataset.idea==='flow'?flow!=='waiting':card.dataset.idea==='reason'?!missing&&['plan','limit'].includes(reason):!disconnected;
  const power=charging?(card.dataset.idea==='flow'&&flow==='solar'?4.2:card.dataset.idea==='reason'&&reason==='limit'?4.1:7.1):0;
  const states={...readings,[entities.charging]:field(charging?'on':'off'),[entities.connected]:field(disconnected?'off':'on'),[entities.plan_active]:field(card.dataset.idea==='reason'&&charging&&reason==='plan'?'on':'off'),[entities.power]:field(power,'kW'),[entities.current]:field(power*1000/690,'A')};
  card.hass={language:'nl',locale:{language:'nl'},themes:{darkMode},config:{time_zone:'Europe/Amsterdam'},connected:true,states,hassUrl:path=>location.origin+path};
  card._historyData=points;card._historyRange={start,end};card._historyRevision=(card._historyRevision??0)+1;card._render();
 }
 document.getElementById('consumption-value').textContent=`${format(Number(document.getElementById('consumption').value))} kWh/100 km`;
}
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';sync();};
document.getElementById('width').onclick=event=>{const narrow=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
document.getElementById('receipt-toggle').onclick=event=>{receiptDisconnected=!receiptDisconnected;event.currentTarget.textContent=receiptDisconnected?'Auto aansluiten':'Auto loskoppelen';sync();};
for(const id of ['flow-case','reason-case','missing'])document.getElementById(id).onchange=sync;
document.getElementById('consumption').oninput=sync;
sync();window.evccStory={cards,sync};
