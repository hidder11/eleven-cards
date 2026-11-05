// Isolated header proposals, using the actual card with local synthetic states.
const designs=[
 ['aurora','Aurora Flow','Een zachte kleurnevel die tot boven de titel doorloopt. De auto staat in een brede gloed; de achtergrond wordt rustig grijs als de kabel los is.'],
 ['lanes','Energy Lanes','Diagonale lichtbanen geven het laden richting. Een uitgesproken kleurvlak achter de auto, met dezelfde kleur subtiel terug in de titel.'],
 ['halo','Halo','Een grote lichtboog vormt een podium achter de auto. Meer diepte en focus op de auto, met een gekleurde header en een rustige overgang naar de gegevens.'],
 ['horizon','Solar Horizon','Een lage lichtbron achter de auto, met een brede horizon en een zachte reflectie. Warm en ruimtelijk tijdens laden; koel en rustig tijdens wachten.'],
 ['ribbon','Silk Flow','Een brede, gebogen lichtsluier loopt schuin achter de auto. De zachte lagen geven beweging en diepte zonder de cijfers te verdringen.'],
 ['prism','Prism','Grote transparante lichtvlakken vormen een helder, architectonisch podium. Een scherp lichtaccent rechts contrasteert met een rustige ruimte achter het percentage.'],
 ['contour','Contour Glow','Fijne elliptische contouren omringen de auto als hoogtelijnen. Een kleine lichtkern en subtiele gloed geven detail zonder een groot kleurvlak.'],
 ['lanes-soft','Energy Lanes · Soft','Variant op 2. Twee brede diagonale lichtbanen met zachte randen en een diffuse gloed achter de auto. Minder lijnen, meer rust.'],
 ['lanes-edge','Energy Lanes · Edge','Variant op 2. Drie smalle lichtbanen met heldere randen lopen achter de auto langs. Strakker en uitgesprokener, met een rustig vlak achter het percentage.'],
 ['prism-glass','Prism · Glass','Variant op 6. Brede overlappende glasvlakken met een zachte lichtbron en subtiele randen. Meer diepte, minder harde contrasten.'],
 ['prism-beam','Prism · Beam','Variant op 6. Een smalle lichtbundel valt van rechtsboven achter de auto. Een helder snijpunt en zachte reflectie maken de auto het middelpunt.'],
 ['eclipse','Eclipse','Een grote donkere schijf met een verlichte rand achter de auto. Een rustig, bijna fotografisch tegenlicht; de statuskleur vormt een zachte krans rondom het silhouet.'],
 ['grid','Light Deck','De auto staat boven een lichtvloer in perspectief. Fijne lijnen verdwijnen richting de horizon, met een lichte reflectie onder de auto. Technischer en ruimtelijker dan de diagonale banen.'],
];
const states={
 charging:['Laden','Goudgeel · EVCC bevestigt dat de auto laadt. De lichtstroom versnelt met het laadvermogen.'],
 planned:['Laden · volgens planning','Indigo · dezelfde hoofdstatus Laden, met de bevestigde toelichting Volgens laadplanning.'],
 waiting:['Wachten op laden','Zacht blauw · aangesloten en laden staat aan. Er wordt geen onbekende wachtreden ingevuld.'],
 done:['Laaddoel bereikt','Groen · het laaddoel is bereikt. Een rustige, afgeronde gloed.'],
 off:['Laden uitgeschakeld','Neutraal grijs · de auto is aangesloten en de laadmodus staat op Off.'],
 disconnected:['Niet aangesloten','Grijs · een rustige achtergrond zonder actieve lichtstroom.'],
 unknown:['Status onbekend','Gedempt grijs · onvoldoende gegevens om de laadstatus vast te stellen. Dit betekent niet automatisch een storing.'],
};
// Preview-only wording: preserve real card behaviour and synthetic EVCC signals.
const statusCopy={
 charging:['Laden','EVCC regelt het laden'],
 planned:['Laden','Volgens laadplanning'],
 waiting:['Wachten op laden','Auto aangesloten · laden nog niet gestart'],
 done:['Laaddoel bereikt','Auto aangesloten · laden voltooid'],
 off:['Laden uitgeschakeld','Laadmodus staat op Off'],
 disconnected:['Niet aangesloten','Sluit de laadkabel aan om te laden'],
 unknown:['Status onbekend','Wacht op actuele gegevens van EVCC'],
};
const common=`
 ha-card{overflow:hidden}.content{height:auto;min-height:0;--tone:inherit!important;--evcc-glow:var(--tone)!important;--status-accent:var(--tone)!important}
 .header-scene{position:relative;isolation:isolate;overflow:hidden;margin:-16px -16px 0;padding:16px 16px 16px}
 .gallery-top{margin:0;padding:0;background:none;border:0}
 .status-line{position:relative;margin:16px 0 0;background:color-mix(in srgb,var(--secondary-background-color) 50%,transparent)}
 .header-scene::before,.header-scene::after{content:'';position:absolute;pointer-events:none;z-index:-1;mask-image:linear-gradient(180deg,#000 0%,#000 calc(100% - 64px),transparent 100%)}
 header{position:relative;z-index:1}header h2{color:var(--tone)}.hero{background:none}.car-stage::before{background:none}.car-stage::after{background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--tone) 50%,transparent),transparent)}
 .vehicle-motion::before{background:radial-gradient(ellipse at 60% 65%,color-mix(in srgb,var(--tone) 24%,transparent),transparent 66%)}
 .evcc-tabs{display:none}.live-readings{margin-bottom:0}
 :host([data-tone=disconnected]) .gallery-top,:host([data-tone=unknown]) .gallery-top{border-bottom:0}
 :host([data-tone=disconnected]) .header-scene::before,:host([data-tone=disconnected]) .header-scene::after{opacity:.38}
 :host([data-tone=unknown]) .header-scene::before,:host([data-tone=unknown]) .header-scene::after{opacity:.16}
 :host([data-tone=unknown]) .vehicle-motion::before,:host([data-tone=unknown]) .vehicle-motion::after{animation:none!important;opacity:.1}
 :host([data-motion=paused]) *,:host([data-motion=paused]) ::before,:host([data-motion=paused]) ::after{animation-play-state:paused!important}
`;
const backgrounds={
 aurora:`.header-scene::before{inset:0;background:radial-gradient(ellipse at 87% 70%,color-mix(in srgb,var(--tone) 30%,transparent),transparent 64%),radial-gradient(ellipse at 2% 0%,color-mix(in srgb,var(--tone) 15%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 8%,transparent),transparent)}.header-scene::after{width:120%;height:110px;bottom:1px;right:-15%;border-top:1px solid color-mix(in srgb,var(--tone) 17%,transparent);border-radius:50%;transform:rotate(-9deg);background:linear-gradient(180deg,color-mix(in srgb,var(--tone) 5%,transparent),transparent)}`,
 lanes:`.header-scene::before{inset:0;background:linear-gradient(143deg,transparent 0 43%,color-mix(in srgb,var(--tone) 19%,transparent) 43.2% 70%,color-mix(in srgb,var(--tone) 5%,transparent) 70.2% 88%,transparent 88.2%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 11%,transparent),transparent 75%)}.header-scene::after{inset:20% -16% -30% 24%;transform:skewY(-36deg);background:repeating-linear-gradient(0deg,transparent 0 25px,color-mix(in srgb,var(--tone) 13%,transparent) 26px,transparent 27px 58px)}.vehicle-motion::after{height:3px}`,
 halo:`.header-scene::before{inset:0;background:radial-gradient(ellipse at 75% 68%,color-mix(in srgb,var(--tone) 20%,transparent),transparent 61%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 11%,transparent),transparent 65%)}.header-scene::after{width:88%;height:190px;right:-11%;bottom:105px;border:1px solid color-mix(in srgb,var(--tone) 39%,transparent);border-radius:50%;transform:rotate(-16deg);box-shadow:0 0 0 19px color-mix(in srgb,var(--tone) 4%,transparent),0 0 0 39px color-mix(in srgb,var(--tone) 3%,transparent),inset 0 0 45px color-mix(in srgb,var(--tone) 8%,transparent);background:radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--tone) 7%,transparent),transparent 70%)}`,
 horizon:`.header-scene::before{inset:0;background:radial-gradient(ellipse at 74% 51%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 37%),radial-gradient(ellipse at 75% 15%,color-mix(in srgb,var(--tone) 12%,transparent),transparent 68%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 7%,transparent),transparent 80%)}.header-scene::after{inset:0;background:linear-gradient(180deg,transparent 55%,color-mix(in srgb,var(--tone) 40%,transparent) 55.3%,transparent 56.2%),radial-gradient(ellipse at 74% 58%,color-mix(in srgb,var(--tone) 17%,transparent),transparent 26%)}.car-stage::after{opacity:.35}`,
 ribbon:`.header-scene::before{inset:0;background:radial-gradient(ellipse at 95% 32%,color-mix(in srgb,var(--tone) 24%,transparent),transparent 59%),linear-gradient(155deg,color-mix(in srgb,var(--tone) 10%,transparent),transparent 65%)}.header-scene::after{width:145%;height:185px;right:-32%;top:22%;border-radius:50%;transform:rotate(-21deg);border-top:1px solid color-mix(in srgb,var(--tone) 49%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--tone) 25%,transparent),color-mix(in srgb,var(--tone) 3%,transparent) 65%,transparent);box-shadow:0 -16px 0 color-mix(in srgb,var(--tone) 5%,transparent),0 -35px 0 color-mix(in srgb,var(--tone) 3%,transparent)}.car-stage::after{opacity:.3}`,
 prism:`.header-scene::before{inset:0;background:linear-gradient(122deg,transparent 42%,color-mix(in srgb,var(--tone) 17%,transparent) 42.2%,color-mix(in srgb,var(--tone) 4%,transparent) 74%,transparent 74.2%),linear-gradient(28deg,transparent 44%,color-mix(in srgb,var(--tone) 13%,transparent) 44.2%,transparent 81%),radial-gradient(ellipse at 90% 0%,color-mix(in srgb,var(--tone) 18%,transparent),transparent 66%)}.header-scene::after{inset:0;background:linear-gradient(122deg,transparent 63.7%,color-mix(in srgb,var(--tone) 46%,transparent) 64%,transparent 64.4%);opacity:.7}.car-stage::after{opacity:.25}`,
 contour:`.header-scene::before{inset:0;background:radial-gradient(ellipse at 76% 42%,color-mix(in srgb,var(--tone) 25%,transparent),transparent 44%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 6%,transparent),transparent 80%)}.header-scene::after{inset:0;background:repeating-radial-gradient(ellipse at 83% 36%,transparent 0 22px,color-mix(in srgb,var(--tone) 16%,transparent) 23px,transparent 24px 43px);opacity:.8}.car-stage::after{opacity:.35}`,
};
const grid=document.getElementById('examples');
backgrounds['lanes-soft']=`.header-scene::before{inset:0;background:linear-gradient(140deg,transparent 35%,color-mix(in srgb,var(--tone) 15%,transparent) 44%,color-mix(in srgb,var(--tone) 6%,transparent) 63%,transparent 72%),radial-gradient(ellipse at 84% 40%,color-mix(in srgb,var(--tone) 17%,transparent),transparent 65%)}.header-scene::after{inset:0;background:linear-gradient(140deg,transparent 58%,color-mix(in srgb,var(--tone) 16%,transparent) 64%,transparent 75%)}.car-stage::after{opacity:.3}`;
backgrounds['lanes-edge']=`.header-scene::before{inset:0;background:linear-gradient(139deg,transparent 44%,color-mix(in srgb,var(--tone) 19%,transparent) 44.2%,color-mix(in srgb,var(--tone) 5%,transparent) 62%,transparent 62.2%),radial-gradient(ellipse at 95% 15%,color-mix(in srgb,var(--tone) 16%,transparent),transparent 65%)}.header-scene::after{inset:0;background:linear-gradient(139deg,transparent 43.7%,color-mix(in srgb,var(--tone) 60%,transparent) 44%,transparent 44.4%,transparent 58.7%,color-mix(in srgb,var(--tone) 36%,transparent) 59%,transparent 59.4%,transparent 72.7%,color-mix(in srgb,var(--tone) 20%,transparent) 73%,transparent 73.4%)}.car-stage::after{opacity:.25}`;
backgrounds['prism-glass']=`.header-scene::before{inset:0;background:linear-gradient(119deg,transparent 37%,color-mix(in srgb,var(--tone) 12%,transparent) 37.3%,color-mix(in srgb,var(--tone) 3%,transparent) 76%,transparent 76.3%),linear-gradient(34deg,transparent 42%,color-mix(in srgb,var(--tone) 11%,transparent) 42.3%,transparent 83%),radial-gradient(ellipse at 82% 30%,color-mix(in srgb,var(--tone) 20%,transparent),transparent 63%)}.header-scene::after{inset:0;background:linear-gradient(119deg,transparent 37%,color-mix(in srgb,var(--tone) 23%,transparent) 37.2%,transparent 37.5%),linear-gradient(34deg,transparent 42%,color-mix(in srgb,var(--tone) 19%,transparent) 42.2%,transparent 42.5%)}.car-stage::after{opacity:.2}`;
backgrounds['prism-beam']=`.header-scene::before{inset:0;background:conic-gradient(from 201deg at 95% -8%,transparent 0deg,color-mix(in srgb,var(--tone) 4%,transparent) 9deg,color-mix(in srgb,var(--tone) 24%,transparent) 22deg,color-mix(in srgb,var(--tone) 7%,transparent) 30deg,transparent 39deg),radial-gradient(ellipse at 74% 48%,color-mix(in srgb,var(--tone) 23%,transparent),transparent 42%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 6%,transparent),transparent 75%)}.header-scene::after{inset:0;background:linear-gradient(128deg,transparent 61.7%,color-mix(in srgb,var(--tone) 48%,transparent) 62%,transparent 62.4%),radial-gradient(ellipse at 75% 60%,color-mix(in srgb,var(--tone) 13%,transparent),transparent 27%)}.car-stage::after{opacity:.3}`;
backgrounds.eclipse=`.header-scene::before{inset:0;background:radial-gradient(ellipse at 82% 24%,color-mix(in srgb,var(--tone) 28%,transparent),transparent 57%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 5%,transparent),transparent 78%)}.header-scene::after{width:270px;height:270px;max-width:76%;right:-5%;top:-50px;border-radius:50%;background:radial-gradient(circle at 47% 46%,color-mix(in srgb,var(--ha-card-background) 95%,transparent) 0 55%,color-mix(in srgb,var(--tone) 58%,transparent) 57%,color-mix(in srgb,var(--tone) 12%,transparent) 61%,transparent 70%)}.car-stage::after{opacity:.2}`;
backgrounds.grid=`.header-scene::before{inset:0;background:radial-gradient(ellipse at 75% 52%,color-mix(in srgb,var(--tone) 26%,transparent),transparent 38%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 6%,transparent),transparent 68%)}.header-scene::after{left:-20%;right:-20%;height:150px;bottom:88px;transform:perspective(230px) rotateX(57deg);transform-origin:50% 100%;background:repeating-linear-gradient(0deg,transparent 0 23px,color-mix(in srgb,var(--tone) 24%,transparent) 24px,transparent 25px 48px),repeating-linear-gradient(90deg,transparent 0 42px,color-mix(in srgb,var(--tone) 20%,transparent) 43px,transparent 44px 86px);border-top:1px solid color-mix(in srgb,var(--tone) 25%,transparent)}.car-stage::after{opacity:.2}`;
const groups={comparison:['lanes','halo','ribbon','prism-glass','eclipse'],alternatives:['lanes','eclipse','grid'],new:['horizon','ribbon','prism','contour'],variants:['lanes','prism','lanes-soft','lanes-edge','prism-glass','prism-beam']};
document.getElementById('design').innerHTML='<option value="comparison">Vergelijk 2, 3, 5, 10 en 12</option><option value="alternatives">Optie 2 + twee andere richtingen</option><option value="variants">Varianten op 2 en 6</option><option value="new">Vorige vier nieuwe</option><option value="all">Alle ontwerpen</option>'+designs.map(([id,name],index)=>`<option value="${id}">${index+1} · ${name}</option>`).join('');
grid.innerHTML=designs.map(([id,name,description],index)=>`<article class="concept" data-design="${id}"><h2><span>${String(index+1).padStart(2,'0')}</span>${name}</h2><p>${description}</p><eleven-car-card data-design="${id}"></eleven-car-card></article>`).join('');
document.querySelector('.legend').innerHTML=Object.entries(states).map(([id,[name]])=>`<button data-tone="${id}" aria-pressed="false">${name}</button>`).join('');
const value=(state,unit,extra={})=>({state:String(state),attributes:{unit_of_measurement:unit,...extra}});
const sample={power:value(7.1,'kW'),soc:value(62,'%'),target_soc:value(80,'%'),range:value(238,'km'),connected:value('on'),charging:value('on'),enabled:value('on'),mode:value('smart',undefined,{options:['off','smart','now']}),plan_active:value('off'),smart_cost_active:value('off'),remaining_duration:value(45,'min'),current:value(10.3,'A'),phases:value(3)};
const cards=[...document.querySelectorAll('eleven-car-card')];
for(const card of cards){
 const entities=Object.fromEntries(Object.keys(sample).map(field=>[field,(['connected','charging','enabled','plan_active','smart_cost_active'].includes(field)?'binary_sensor':field==='mode'?'select':'sensor')+'.demo_'+field]));
 const readings=Object.fromEntries(Object.entries(sample).map(([field,entity])=>[entities[field],{...entity,attributes:{...entity.attributes}}]));
 readings['image.demo_car']=value('2026-10-22',undefined,{entity_picture:'/cards/car-card/qa/evcc/car.svg'});
 const render=card._render.bind(card);card._render=()=>{
  render();
  const root=card.shadowRoot,copy=statusCopy[card.dataset.tone];
  if(copy&&root.querySelector('.status-line')){
   root.querySelector('.status-line strong').textContent=copy[0];
   root.querySelector('.status-line p').textContent=copy[1];
  }
  if(!root.querySelector('.gallery-top')||root.querySelector('[data-header-proposal]'))return;
  if(!root.querySelector('.header-scene')){const scene=document.createElement('div');scene.className='header-scene';const top=root.querySelector('.gallery-top');top.before(scene);scene.append(top,root.querySelector('.status-line'));}
  const style=document.createElement('style');style.dataset.headerProposal='';style.textContent=common+backgrounds[card.dataset.design];root.append(style);
 };
 card._syncHistory=()=>{};
 card.setConfig({evcc_enabled:true,entity:entities.power,entities,image_entity:'image.demo_car',show_controls:false,show_session:false,show_details:false});
 card.hass={language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},connected:true,states:readings,hassUrl:path=>location.origin+path};
}
let selected='charging';
function applyState(state){
 selected=state;document.getElementById('power').disabled=!['charging','planned'].includes(state);
 document.querySelectorAll('.legend button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tone===state)));
 document.getElementById('state-description').textContent=states[state][1];
 for(const card of cards){
  card.dataset.tone=state;const readings={...card.hass.states},active=['charging','planned'].includes(state),unknown=state==='unknown',kw=Number(document.getElementById('power').value);
  const updates={connected:unknown?'unavailable':state==='disconnected'?'off':'on',charging:unknown?'unavailable':active?'on':'off',power:unknown?'unavailable':active?kw:0,current:unknown?'unavailable':active?Math.round(kw*1000/(3*230)*10)/10:0,enabled:unknown?'unavailable':active?'on':'off',mode:state==='off'?'off':'smart',soc:unknown?'unavailable':state==='done'?80:62,range:unknown?'unavailable':state==='done'?307:238,plan_active:state==='planned'?'on':'off',smart_cost_active:'off'};
  for(const [field,reading] of Object.entries(updates)){const id=card._config.entities[field];readings[id]={...readings[id],state:String(reading)};}
  card.hass={...card.hass,states:readings};
 }
}
document.querySelectorAll('.legend button').forEach(button=>button.onclick=()=>applyState(button.dataset.tone));
document.getElementById('power').oninput=event=>{document.querySelector('output[for=power]').textContent=new Intl.NumberFormat('nl',{maximumFractionDigits:1}).format(Number(event.target.value))+' kW';applyState(selected)};
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';event.currentTarget.setAttribute('aria-pressed',String(light))};
document.getElementById('motion').onchange=event=>cards.forEach(card=>card.dataset.motion=event.target.checked?'on':'paused');
function layout(){const design=document.getElementById('design').value,multiple=design==='all'||Object.hasOwn(groups,design);grid.classList.toggle('focus',!multiple);grid.classList.toggle('comparison',design==='comparison');document.body.classList.toggle('comparison-mode',design==='comparison');grid.classList.toggle('new-designs',Object.hasOwn(groups,design));grid.style.setProperty('--width',document.getElementById('width').value+'px');document.getElementById('width').disabled=multiple;document.querySelectorAll('.concept').forEach(article=>article.hidden=Object.hasOwn(groups,design)?!groups[design].includes(article.dataset.design):design!=='all'&&article.dataset.design!==design)}
document.getElementById('design').onchange=layout;document.getElementById('width').onchange=layout;
const params=new URLSearchParams(location.search);if(['all',...Object.keys(groups),...designs.map(([id])=>id)].includes(params.get('design')))document.getElementById('design').value=params.get('design');layout();applyState(Object.hasOwn(states,params.get('state'))?params.get('state'):'charging');
window.evccHeaders={cards,states};
