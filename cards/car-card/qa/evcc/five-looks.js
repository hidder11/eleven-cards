import {statusSymbol,galleryStatusStyles,powerMotion} from './gallery-status.js';
// Five isolated visual proposals. No network history or real vehicle controls.
const designs=[
 ['horizon','Horizon','De auto breed bovenaan, met een lichtlijn eronder. Het percentage en bereik staan als een rustige, brede meetstrook onder de auto.'],
 ['orbit','Orbit','Het accuniveau als een grote ring naast de auto. Een herkenbaar visueel middelpunt, met bereik en laaddoel direct onder het percentage.'],
 ['telemetry','Telemetrie','Laadvermogen is de hoofdzaak: grote cijfers, scherpe lijnen en een compacte autozone. Een technisch instrumentenpaneel voor je dashboard.'],
 ['tower','Laadzuil','Een verticale accukolom naast de auto. De doelmarkering en het laadniveau krijgen zo een heel andere, maar direct leesbare vorm.'],
 ['gallery','Galerie','Groot percentage en de auto op een verlicht podium. Daaronder een statuskaart en twee bijpassende vlakjes voor laadvermogen en resterende tijd.'],
];
const grid=document.getElementById('examples');
grid.innerHTML=designs.map(([key,name,description],index)=>`<article class="concept" data-design="${key}"><h2><span>0${index+1}</span>${name}</h2><p>${description}</p><eleven-car-card data-look="${key}"></eleven-car-card><button class="pick" data-pick="${key}" aria-pressed="false">Mijn voorkeur: ${name}</button></article>`).join('');
const common=`
 ha-card{overflow:hidden}.content{height:auto;min-height:0}.picture img{filter:drop-shadow(0 12px 8px #0004)}
 .evcc-panel .metrics dt{font-size:11px}.evcc-panel .metrics dd{font-size:18px}.plot{height:112px}
 .live-sub{min-height:16px}.live-readings>div{background:transparent;padding:8px 0}.live-readings{gap:16px;border-bottom:1px solid var(--divider-color);padding-bottom:8px}
 .status-line{border-left:0;padding:8px 10px;background:color-mix(in srgb,var(--evcc-glow) 8%,transparent)}
 @media(prefers-reduced-motion:reduce){*,:before,:after{animation:none!important}}
`;
const styles={
 horizon:`
 .car-stage{display:flex;flex-direction:column-reverse;align-items:stretch;min-height:0;padding:0 0 12px}
 .car-stage::before{background:radial-gradient(ellipse at 50% 49%,color-mix(in srgb,var(--evcc-glow) 27%,transparent),transparent 68%)}
 .car-stage::after{left:8%;right:8%;bottom:95px}.picture{height:158px;min-height:0}.picture img{width:100%;height:158px;margin:0}
 .battery-row{flex-direction:row;align-items:center;justify-content:space-between;gap:12px;padding-top:8px}.battery-value{font-size:48px}.battery-meta{text-align:right}.range,.target{justify-content:flex-end}
 .battery-track{height:3px}.target-marker{height:9px}.car-name{text-transform:uppercase;letter-spacing:.12em;font-size:10px}
 .status-line{padding:8px 0;background:none}.live-value{font-size:26px}
 @container(max-width:320px){.battery-value{font-size:40px}.picture,.picture img{height:138px}.car-stage::after{bottom:87px}}
 `,
 orbit:`
 .car-stage{grid-template-columns:minmax(0,148px) minmax(0,1fr);gap:4px;padding:10px 0 48px;min-height:202px}
 .car-stage::before{background:radial-gradient(ellipse at 60% 45%,color-mix(in srgb,var(--evcc-glow) 18%,transparent),transparent 70%)}.car-stage::after{display:none}
 .battery-row{position:relative;isolation:isolate;aspect-ratio:1;width:100%;align-items:center;justify-content:center;gap:0}.battery-row::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:50%;background:conic-gradient(from 0deg,var(--primary-color) var(--soc-angle),var(--secondary-background-color) 0);mask:radial-gradient(transparent 62%,#000 63%);-webkit-mask:radial-gradient(transparent 62%,#000 63%)}
 .battery-value{font-size:40px;letter-spacing:-.04em}.battery-meta{position:absolute;top:calc(100% + 7px);left:0;right:0;text-align:center}.range,.target{justify-content:center}
 .picture{height:148px;min-height:0}.picture img{height:138px;width:119%;margin:0 0 0 -12%}
 .battery-track{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
 .status-line{border-radius:20px}.status-line strong{font-size:13px}.live-readings{border-bottom:0}.live-readings>div{padding:10px;border:1px solid var(--divider-color);border-radius:10px}
 @container(max-width:320px){.car-stage{grid-template-columns:minmax(0,120px) minmax(0,1fr);min-height:178px}.battery-value{font-size:32px}.picture img{height:115px}}
 `,
 telemetry:`
 header{margin-bottom:16px}h2{text-transform:uppercase;font-size:14px;letter-spacing:.1em;font-weight:600}
 .live-readings{border:0;gap:12px;margin-bottom:12px}.live-readings>div{border-top:2px solid var(--divider-color);padding:10px 0 0}.live-readings>div:first-child{border-top-color:var(--primary-color)}.live-value{font-size:40px;font-weight:500;letter-spacing:-.045em}.live-readings>div:first-child .live-value{color:var(--primary-color)}
 .hero{padding:10px 12px;border:1px solid var(--divider-color);border-radius:7px;margin-bottom:12px}.car-name{font-size:10px;letter-spacing:.05em}.car-stage{min-height:90px;padding:0 0 6px;grid-template-columns:1fr 1fr}.car-stage::before,.car-stage::after{display:none}.battery-value{font-size:34px;font-weight:500}.picture{min-height:76px}.picture img{height:85px;width:112%;margin-left:-8%}
 .battery-track{height:3px}.status-line{padding:0 0 10px;background:none;border-bottom:1px solid var(--divider-color);border-radius:0;margin-bottom:0}.evcc-tabs{margin-top:14px}
 @container(max-width:320px){.live-value{font-size:31px}.battery-value{font-size:30px}}
 `,
 tower:`
 .hero{display:grid;grid-template-columns:14px minmax(0,1fr);gap:0 16px;margin-bottom:16px}.car-name{grid-column:1/-1}.car-stage{display:contents}
 .battery-row{grid-column:1/-1;grid-row:2;flex-direction:row;justify-content:space-between;align-items:center;padding:12px 0 4px;gap:12px}.battery-value{font-size:48px}.battery-meta{text-align:right}.range,.target{justify-content:flex-end}
 .battery-track{grid-column:1;grid-row:3;width:8px;height:134px;margin:10px 0;align-self:center;background:var(--secondary-background-color);border-radius:8px}.battery-fill{position:absolute;bottom:0;width:100%!important;height:var(--soc-percent);border-radius:8px;background:linear-gradient(0deg,color-mix(in srgb,var(--primary-color) 60%,var(--ha-card-background)),var(--primary-color))}
 .target-marker{left:50%!important;top:auto;bottom:var(--target-percent);width:16px;height:2px;transform:translate(-50%,1px)}
 .picture{position:relative;isolation:isolate;grid-column:2;grid-row:3;min-height:154px}.picture::before{content:'';position:absolute;inset:12px -12px;z-index:-1;background:radial-gradient(ellipse at 50% 66%,color-mix(in srgb,var(--evcc-glow) 26%,transparent),transparent 69%)}.picture img{width:105%;height:150px;margin-left:-3%}
 .status-line{border-left:2px solid var(--evcc-glow);border-radius:0;padding-left:10px}.live-value{font-size:28px}
 @container(max-width:320px){.battery-value{font-size:40px}.hero{gap:0 12px}.battery-track{height:120px}.picture img{height:130px}.picture{min-height:140px}}
 `,
 gallery:`
 .gallery-top{position:relative;isolation:isolate;margin:-16px -16px 16px;padding:16px 16px 0;background:linear-gradient(150deg,color-mix(in srgb,var(--evcc-glow) 5%,transparent),color-mix(in srgb,var(--evcc-glow) 5%,transparent) 36%,color-mix(in srgb,var(--evcc-glow) 14%,transparent) 36.2%,color-mix(in srgb,var(--evcc-glow) 4%,transparent) 78%,transparent 78.2%)}
 .hero{position:relative;isolation:isolate;padding:6px 16px 0;margin:0 -16px;background:none}
 .car-name{font-size:11px;text-transform:uppercase;letter-spacing:.12em}.car-stage{display:block;min-height:268px;padding:0}.car-stage::before{inset:50px -16px 0;background:radial-gradient(ellipse at 65% 65%,color-mix(in srgb,var(--evcc-glow) 23%,transparent),transparent 69%)}.car-stage::after{bottom:18px;left:10%;right:2%}
 .battery-row{position:relative;z-index:1;gap:0;pointer-events:none}.battery-row button{pointer-events:auto}.battery-value{font-size:76px;font-weight:500;letter-spacing:-.065em;line-height:1.15}.battery-meta{margin-top:1px}.range,.target{font-size:11px}
 .picture{position:absolute;right:-12px;bottom:0;width:86%;height:145px;min-height:0}.picture img{width:112%;height:145px;margin-left:-12%}.battery-track{height:3px}.hero>.battery-track{margin-top:0}
 .status-line{padding:10px 12px;background:var(--secondary-background-color);border:0;border-radius:7px;margin-bottom:8px}
 .live-readings{gap:8px;border:0;padding:0}.live-readings>div{padding:10px 12px;background:var(--secondary-background-color);border:0;border-radius:7px}.live-value{font-size:24px}
 .mode-options{margin-top:0}.solar-setting{margin-top:16px;padding:12px;background:var(--secondary-background-color);border-radius:7px}.solar-setting-head{gap:10px;align-items:center}.solar-setting-head label{display:flex;align-items:center;gap:9px;min-width:0;font-size:11px}.solar-setting-head ha-icon{--mdc-icon-size:18px;flex:none;padding:7px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 12%,transparent);color:var(--primary-color)}.solar-title{display:flex;flex-direction:column;gap:1px}.solar-title strong{font-size:11px;font-weight:600;line-height:1.4;color:var(--primary-text-color)}.solar-title small{font-size:10px;line-height:1.4;color:var(--secondary-text-color)}.solar-setting-head output{flex:none;color:var(--primary-color);font-size:18px;font-weight:600;letter-spacing:-.02em;padding:5px 8px;border-radius:6px;background:var(--ha-card-background)}
 input[data-solar-share]{appearance:none;-webkit-appearance:none;height:32px;margin:8px 0 0;background:transparent;--solar-position:60%;touch-action:pan-y}
 input[data-solar-share]::-webkit-slider-runnable-track{height:6px;border-radius:6px;background:linear-gradient(90deg,var(--primary-color) var(--solar-position),var(--divider-color) var(--solar-position))}
 input[data-solar-share]::-moz-range-track{height:6px;border-radius:6px;background:var(--divider-color)}input[data-solar-share]::-moz-range-progress{height:6px;border-radius:6px;background:var(--primary-color)}
 input[data-solar-share]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--primary-color);border:3px solid var(--ha-card-background);box-shadow:0 0 0 1px var(--primary-color);margin-top:-6px}
 input[data-solar-share]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--primary-color);border:3px solid var(--ha-card-background);box-shadow:0 0 0 1px var(--primary-color)}
 .solar-scale{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:10px;color:var(--secondary-text-color);margin:0 1px 10px;font-variant-numeric:tabular-nums}.solar-scale span:first-child,.solar-scale span:last-child{display:flex;flex-direction:column;gap:1px}.solar-scale span:last-child{text-align:right}.solar-scale b{font-size:10px;font-weight:400;color:var(--primary-text-color)}.solar-hint{line-height:1.5;padding-top:10px;border-top:1px solid var(--divider-color)}
 .solar-setting{padding:0;background:transparent;border:0;border-radius:0}.solar-scale{margin-bottom:0}
 .car-stage{min-height:264px}.session-summary [data-field=solar_percentage]{grid-column:1;grid-row:3}
 @container(max-width:320px){.battery-value{font-size:65px}.car-stage{min-height:246px}.picture{width:94%;height:125px}.picture img{height:125px}}
 `,
};
const value=(state,unit,extra={})=>({state:String(state),attributes:{unit_of_measurement:unit,...extra}});
const sample={soc:value(62,'%'),target_soc:value(80,'%'),range:value(238,'km'),power:value(7.1,'kW'),connected:value('on'),charging:value('on'),enabled:value('on'),mode:value('pv',undefined,{options:['off','pv','minpv','now']}),remaining_duration:value(45,'min'),charged_energy:value(20.72,'kWh'),session_price:value(7.06,'€'),charge_duration:value(7560,'s'),session_price_per_kwh:value(.34,'€/kWh'),solar_percentage:value(78,'%'),solar_share:value(60,'%',{min:0,max:100,step:10}),current:value(10.3,'A'),phases:value(3),vehicle_limit_soc:value(100,'%')};
const cards=[...document.querySelectorAll('eleven-car-card')],chosen=new Set();
function decorate(card){
 const root=card.shadowRoot;
 if(!card.hass||!root.querySelector('.hero')||root.querySelector('[data-look-style]'))return;
 const style=document.createElement('style');style.dataset.lookStyle='';style.textContent=common+styles[card.dataset.look]+(card.dataset.look==='gallery'?galleryStatusStyles:'');root.append(style);
 const soc=Number(card.hass.states['sensor.demo_soc'].state),target=Number(card.hass.states['sensor.demo_target_soc'].state);
 const content=root.querySelector('.content');content.style.setProperty('--soc-angle',Number.isFinite(soc)?soc*3.6+'deg':'0deg');content.style.setProperty('--soc-percent',Number.isFinite(soc)?soc+'%':'0%');content.style.setProperty('--target-percent',target+'%');
 if(card.dataset.look==='telemetry'){const hero=root.querySelector('.hero');hero.before(root.querySelector('.live-readings'));}
 if(card.dataset.look==='gallery'){
  const state=content.dataset.view;
  if(card._symbolState!==state){card._symbolState=state;card._symbolStartedAt=Date.now();card._vehicleClock=null;}
  content.style.setProperty('--status-delay',-(Date.now()-card._symbolStartedAt)/1000+'s');
  const speed=powerMotion(card.hass.states[card._config.entities.power]),now=Date.now(),previous=card._vehicleClock;
  const moving=speed.moving&&['solar','charging'].includes(state);
  const phase=previous?previous.phase+(previous.moving?(now-previous.time)/1000/previous.seconds:0):0;
  card._vehicleClock={phase,time:now,seconds:speed.seconds,moving};
  content.style.setProperty('--power-duration',speed.seconds+'s');content.style.setProperty('--power-glow-duration',speed.seconds*1.5+'s');content.style.setProperty('--power-delay',-phase*speed.seconds+'s');content.style.setProperty('--power-motion',moving?'running':'paused');
  const icon=root.querySelector('.status-line>ha-icon');
  if(icon){const symbol=document.createElement('div');symbol.className='status-symbol';symbol.setAttribute('aria-hidden','true');symbol.innerHTML=statusSymbol(state);icon.replaceWith(symbol);}
  const phases=root.querySelector('.live-sub [data-entity="'+card._config.entities.phases+'"]');if(phases&&!phases.nextSibling?.textContent.startsWith(' fasen'))phases.after(document.createTextNode(' fasen'));
  root.querySelectorAll('.hero .target,.car-name,header .status,.mode>.eyebrow').forEach(element=>element.remove());
  const hero=root.querySelector('.hero'),header=root.querySelector('header');if(!root.querySelector('.gallery-top')){const top=document.createElement('div');top.className='gallery-top';header.before(top);top.append(header,hero);}
  const vehicleMotion=document.createElement('div');vehicleMotion.className='vehicle-motion';vehicleMotion.setAttribute('aria-hidden','true');if(!root.querySelector('.car-stage .vehicle-motion'))root.querySelector('.car-stage').append(vehicleMotion);
  const solarMode=root.querySelector('[data-mode="pv"]');if(solarMode)solarMode.textContent='Slim';root.querySelector('[data-mode="minpv"]')?.remove();
  const detailsTab=root.querySelector('[data-ui-tab="technical"]');if(detailsTab)detailsTab.textContent='Details';
  const solarSession=root.querySelector('.solar-session'),sessionMetrics=root.querySelector('.session-summary .metrics');
  if(solarSession&&sessionMetrics){
   const metric=document.createElement('div'),label=document.createElement('dt'),reading=document.createElement('dd');metric.dataset.field='solar_percentage';
   label.textContent=solarSession.querySelector('.solar-session-head>span').textContent;
   reading.append(solarSession.querySelector('.solar-session-head>button'));metric.append(label,reading);sessionMetrics.append(metric);solarSession.remove();
  }
  const setting=root.querySelector('.solar-setting');if(setting)setting.hidden=card.hass.states[card._config.entities.mode]?.state!=='pv';
  const label=root.querySelector('.solar-setting-head label');if(label)label.innerHTML='<span class="solar-title"><strong>Zonnevoorkeur</strong><small id="solar-preference-description">Minimum aandeel zon</small></span>';
  const hint=root.querySelector('.solar-hint');if(hint)hint.hidden=true;
  const slider=root.querySelector('[data-solar-share]');
  if(slider){
   slider.setAttribute('aria-label','Zonnevoorkeur');
   slider.setAttribute('aria-describedby','solar-preference-description');
   const progress=()=>slider.style.setProperty('--solar-position',((Number(slider.value)-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100)+'%');progress();slider.addEventListener('input',progress);
  }
 }
}
for(const card of cards){
 const entities=Object.fromEntries(Object.keys(sample).map(field=>[field,(field==='mode'?'select':field==='solar_share'?'number':['connected','charging','enabled'].includes(field)?'binary_sensor':'sensor')+'.demo_'+field]));
 const states=Object.fromEntries(Object.entries(sample).map(([field,entity])=>[entities[field],{...entity,attributes:{...entity.attributes}}]));
 states['image.demo_car']=value('2026-10-21',undefined,{entity_picture:'/cards/car-card/qa/evcc/car.svg'});
 const hass={language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},connected:true,states,hassUrl:path=>location.origin+path,callService:async(domain,service,data)=>{card.hass={...card.hass,states:{...card.hass.states,[data.entity_id]:{...card.hass.states[data.entity_id],state:domain==='select'?data.option:String(data.value)}}}}};
 card._syncHistory=()=>{};card._activeTab='session';
 const render=card._render.bind(card);card._render=()=>{render();decorate(card)};
 card.setConfig({evcc_enabled:true,entity:entities.power,entities,image_entity:'image.demo_car',vehicle_name:'Elektrische auto'});
 const end=Date.now(),start=end-3600000;card._historyRange={start,end};card._historyData=[0,0,3.6,4.2,5.8,2.3,0,0,3.9,5.1,6.4,7.1,7.1].map((power,index)=>({time:start+index*300000,value:power}));card._historyRevision=1;
 card.hass=hass;
}
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';event.currentTarget.setAttribute('aria-pressed',String(light))};
function view(){const key=document.getElementById('design').value;grid.classList.toggle('focus',key!=='all');grid.style.setProperty('--width',document.getElementById('width').value+'px');document.getElementById('width').disabled=key==='all';document.querySelectorAll('[data-design]').forEach(article=>article.hidden=key!=='all'&&article.dataset.design!==key)}
document.getElementById('design').onchange=view;document.getElementById('width').onchange=view;
document.getElementById('tab').onchange=event=>cards.forEach(card=>{card._activeTab=event.target.value;card._signature=null;card._render()});
document.getElementById('state').add(new Option('Niet aangesloten','disconnected'),3);
document.getElementById('state').add(new Option('Aangesloten · gepauzeerd','connected'),3);
const motionLabel=document.createElement('label');motionLabel.innerHTML='<input type="checkbox" checked> Animaties';document.querySelector('.tools').append(motionLabel);
motionLabel.querySelector('input').onchange=event=>cards.forEach(card=>card.dataset.motion=event.target.checked?'on':'paused');
const powerLabel=document.createElement('label');powerLabel.innerHTML='Laadvermogen <input id="demo-power" type="range" min="0" max="11" step="0.1" value="7.1" style="width:120px;accent-color:var(--primary-color)"><output for="demo-power">7,1 kW</output>';document.querySelector('.tools').append(powerLabel);
const powerInput=powerLabel.querySelector('input');
powerInput.oninput=()=>{
 const kw=Number(powerInput.value);powerLabel.querySelector('output').textContent=new Intl.NumberFormat('nl',{maximumFractionDigits:1}).format(kw)+' kW';powerInput.setAttribute('aria-valuetext',kw+' kW');
 cards.forEach(card=>{const power=card._config.entities.power,current=card._config.entities.current;card.hass={...card.hass,states:{...card.hass.states,[power]:{...card.hass.states[power],state:String(kw)},[current]:{...card.hass.states[current],state:String(Math.round(kw*1000/(3*230)*10)/10)}}}});
};
document.getElementById('state').onchange=event=>cards.forEach(card=>{
 const state=event.target.value,states={...card.hass.states},unknown=state==='unknown';
 powerInput.disabled=state!=='charging';
 for(const [id,reading] of Object.entries({soc:unknown?'unavailable':state==='done'?'80':'62',range:unknown?'unavailable':state==='done'?'307':'238',charging:unknown?'unavailable':state==='charging'?'on':'off',connected:unknown?'unavailable':state==='disconnected'?'off':'on',enabled:unknown?'unavailable':['charging','connected'].includes(state)?'on':'off',mode:state==='waiting'?'pv':states[card._config.entities.mode].state,power:unknown?'unavailable':state==='charging'?powerInput.value:'0',current:unknown?'unavailable':state==='charging'?String(Math.round(Number(powerInput.value)*1000/(3*230)*10)/10):'0',phases:unknown?'unavailable':state==='disconnected'?'0':'3'})){
  const entity=card._config.entities[id];states[entity]={...states[entity],state:reading};
 }
 card.hass={...card.hass,states};
});
document.querySelectorAll('[data-pick]').forEach(button=>button.onclick=()=>{const key=button.dataset.pick;if(chosen.has(key))chosen.delete(key);else chosen.add(key);button.setAttribute('aria-pressed',String(chosen.has(key)));document.querySelector('.selection').textContent=chosen.size?'Je voorkeur: '+designs.filter(([key])=>chosen.has(key)).map(([,name])=>name).join(' + '):''});
window.evccLooks={cards,designs};
const initialDesign=new URLSearchParams(location.search).get('design');
if(designs.some(([key])=>key===initialDesign)){document.getElementById('design').value=initialDesign;view();}
const initialTab=new URLSearchParams(location.search).get('tab');
if(['session','controls','technical'].includes(initialTab)){document.getElementById('tab').value=initialTab;cards.forEach(card=>{card._activeTab=initialTab;card._signature=null;card._render()});}
if(initialDesign==='gallery')document.querySelector('#tab option[value="technical"]').textContent='Details';
const initialState=new URLSearchParams(location.search).get('state');
if(['charging','waiting','done','unknown','disconnected','connected'].includes(initialState)){document.getElementById('state').value=initialState;document.getElementById('state').dispatchEvent(new Event('change'));}
