import {applyReviewTheme} from './theme.js';
import {configs,createFixture,cardType,calendarPreviewFixture} from './fixtures.js';
const selected=new URLSearchParams(location.search).get('card'),entry=configs.find(([name])=>name===selected);
const example=(title,description,changes={},states={})=>({title,description,changes,states});
const programs=[{id:'eco',name:'Eco 40–60',minutes:150,kwh:1},{id:'short',name:'Kort',minutes:60,kwh:.7}];
const catalog={
 'history-graph-card':[
  example('Vermogen en temperatuur','Twee sensoren met elk een eigen eenheid en as.'),
  example('Alleen vermogen','Een overzicht over de afgelopen zes uur.',{entities:['sensor.power'],hours_to_show:6}),
  example('Twee dagen temperatuur','Een langere periode met één temperatuursensor.',{entities:['sensor.temperature'],hours_to_show:48})],
 'bar-chart':[
  example('Vermogen per periode','De standaard staafgrafiek over één dag.'),
  example('Korte periode','Alleen de afgelopen zes uur.',{hours_to_show:6}),
  example('Temperatuur over twee dagen','Een andere sensor en een langere periode.',{entities:['sensor.temperature'],hours_to_show:48})],
 'timeline-card':[
  example('Status van de verwarming','De bestaande tijdlijn over één dag.'),
  example('Met tijdsduur','Toon ook de totale duur van elke status.',{show_summary:true,show_state_labels:true}),
  example('Compact overzicht','Zes uur zonder extra sensorlabels of legenda.',{hours_to_show:6,show_labels:false,show_legend:false})],
 'dynamic-energy-price-card':[
  example('Dagprijzen','Prijsverloop met de standaardinstellingen.'),
  example('Twee voordelige uren','Zoek een aaneengesloten gunstige periode van twee uur.',{cheapest_hours:2,import_selection_mode:'contiguous',show_cheapest_table:true}),
  example('Zonder periodetabel','Alleen het prijsverloop en de samenvatting.',{show_cheapest_table:false})],
 'overview-card':[
  example('Twee sensoren','Vermogen en temperatuur met hun verloop.'),
  example('Alleen vermogen','Eén sensor met een kortere periode.',{entities:[{entity:'sensor.power',color:'#e78a14'}],hours_to_show:6}),
  example('Zonder grafiek en verschil','Een rustig overzicht van de actuele waarden.',{show_graph:false,show_delta:false})],
 'heatmap-card':[
  example('Een week vermogen','De bestaande kleurschaal met zeven dagen.'),
  example('Eén dag','Een korter overzicht over de laatste 24 uur.',{hours_to_show:24}),
  example('Temperatuur over vier weken','Een andere meetwaarde met een langere periode.',{entity:'sensor.temperature',hours_to_show:672})],
 'calendar-card':[
  {...example('Maandoverzicht','Het verdiepte raster met zacht gekleurde afspraken en een subtiele markering voor vandaag.',{view:'month'}),id:'month'},
  {...example('Daglijst','Zeven dagen onder elkaar met tijdkolom, verdiepte dagvlakken en dezelfde afspraakstijl.',{view:'list',days_to_show:7}),id:'list'},
  {...example('Dagkolommen','Vijf dagen naast elkaar met dezelfde dagvlakken en gekleurde afspraken.',{view:'columns',days_to_show:5}),id:'columns'}],
 'weather-card':[
  example('Weer met verwachting','De bestaande weerkaart met alle standaardgegevens.'),
  example('Compact, alleen per uur','Kleinere waarden en alleen de uurverwachting.',{compact:true,tabs:['hourly']}),
  example('Alleen de hoofdwaarde','Zonder informatievlakken en verwachting.',{metric_status:'none',metric_primary:'none',metric_secondary:'none',tabs:[]})],
 'car-card':[
  example('Status en kilometerstand','De bestaande autokaart met de gekoppelde sensoren.'),
  example('Compacte auto','Dezelfde configuratie met compacte waarden.',{compact:true}),
  example('Berekende actieradius','Bereik op basis van het percentage en 460 km bij een volle accu.',{range_source:'calculated',range_full:460,show_field_3:true,field_3_entity:'sensor.range',field_3_label:'Gemeten actieradius'})],
 'car-evcc':[
  example('Laadbediening','De bestaande Auto met EVCC-configuratie.'),
  example('Laadsessie','Start op het tabblad met sessiegegevens.',{tabs:['controls','session','technical'],default_tab:'session'}),
  example('Compacte laadbediening','Dezelfde bediening in compacte dichtheid.',{compact:true})],
 'energy-flow-card':[
  example('Actuele energiestromen','Het huidige, behouden diagram met actuele vermogens.'),
  example('Historische energie','Start bij de historische verdeling in kWh.',{default_view:'history'}),
  example('Details in tabbladen','Zon, woning en net als tabbladen onder het huidige diagram.',{detail_view:'tabs',default_tab:'sun'})],
 'scene-engine-card':[
  example('Aanvragen en status','De bestaande engine met de reset-knop.'),
  example('Zonder aanvraagdetails','Een rustiger overzicht van de actieve scène.',{show_details:false}),
  example('Eigen naam','Geef de engine een herkenbare naam.',{name:'Verlichting woonkamer',show_details:true})],
 'actions-card':[
  example('Drie kolommen','De bestaande scènes en acties.',{columns:3}),
  example('Twee kolommen','Dezelfde acties met meer ruimte per knop.',{columns:2}),
  example('Korte lijst met bevestiging','Drie acties in één kolom, met bevestiging voor uitvoeren.',{columns:1,confirmation:true,actions:['scene.evening','scene.movie','script.lights_off']})],
 'controls-card':[
  example('Thermostaat en verlichting','De bestaande combinatie van bedieningselementen.'),
  example('Alleen verlichting','Een kaart voor de dimbare verlichting.',{entities:['light.living']}),
  example('Alleen de thermostaat','Een aparte kaart voor de temperatuurinstelling.',{entities:['climate.living']})],
 'waste-card':[
  example('Papier','De bestaande ophaaldatum uit een sensor.'),
  example('Meerdere afvalstromen','Papier en GFT naast de eerstvolgende ophaaldatum.',{entities:[{entity:'sensor.waste',name:'Papier',source:'date',color:'#2196f3'},{entity:'sensor.waste_green',name:'GFT',source:'date',color:'#4c956c'}]},{'sensor.waste_green':{state:new Date(Date.now()+5*86400000).toISOString().slice(0,10),attributes:{friendly_name:'GFT'}}}),
  example('Aantal dagen als bron','Gebruik een sensor met het aantal resterende dagen.',{entities:[{entity:'sensor.waste_days',name:'Restafval',source:'days',color:'#8a8f99'}]},{'sensor.waste_days':{state:'3',attributes:{friendly_name:'Restafval'}}})],
 'room-card':[
  example('Woonkamer','Twee lampen, temperatuur en luchtvochtigheid, met dezelfde achtergrond en bediening als de overige kaarten.',{icon:'mdi:sofa-outline',lights:['light.living','light.reading']},{'light.reading':{state:'on',attributes:{friendly_name:'Leeslamp',brightness:190,supported_color_modes:['brightness']}}}),
  example('Slaapkamer','Een rustige kamer met uitgeschakelde verlichting en eigen temperatuur- en luchtvochtigheidssensoren.',{name:'Slaapkamer',show_scene_names:true,icon:'mdi:bed-outline',lights:['light.bedroom'],temperature_entity:'sensor.bedroom_temperature',humidity_entity:'sensor.bedroom_humidity'},{'light.bedroom':{state:'off',attributes:{friendly_name:'Slaapkamer',supported_color_modes:['brightness']}},'sensor.bedroom_humidity':{state:'52',attributes:{unit_of_measurement:'%',device_class:'humidity'}},'sensor.bedroom_temperature':{state:'18.4',attributes:{friendly_name:'Slaapkamer temperatuur',unit_of_measurement:'\u00b0C'}}}),
  example('Werkkamer','Een compacte samenvatting zonder temperatuur, met een korte toelichting.',{name:'Werkkamer',icon:'mdi:desk',lights:['light.office'],temperature_entity:'',humidity_entity:'',note:'Bureauverlichting'},{'light.office':{state:'on',attributes:{friendly_name:'Bureaulamp',brightness:200,supported_color_modes:['brightness']}}}),
  example('Keuken','Een deels onbereikbare lamp krijgt een duidelijke status; de beschikbare lamp blijft te openen.',{name:'Keuken',icon:'mdi:countertop-outline',lights:['light.kitchen','light.counter'],temperature_entity:'',humidity_entity:''},{'light.kitchen':{state:'on',attributes:{friendly_name:'Keuken',supported_color_modes:['brightness']}},'light.counter':{state:'unavailable',attributes:{friendly_name:'Werkblad'}}}),
  example('Nog niet gekoppeld','Dezelfde kaartstijl voor een kamer waarvoor de verlichting nog moet worden ingesteld.',{name:'Logeerkamer',icon:'mdi:bed-outline',lights:[],temperature_entity:'',humidity_entity:'',note:'Verlichting nog koppelen'})],
 'appliance-planner':[
  example('Eén wasprogramma','De bestaande planner met een Eco-programma.'),
  example('Meerdere programma’s','Kies tussen twee fictieve wasprogramma’s.',{appliances:[{id:'washer',name:'Wasmachine',kind:'washer',programs}]}),
  example('Twee apparaten','Wasmachine en vaatwasser met eigen programma’s.',{appliances:[{id:'washer',name:'Wasmachine',kind:'washer',programs},{id:'dishwasher',name:'Vaatwasser',kind:'dishwasher',programs:[{id:'eco',name:'Eco',minutes:180,kwh:.85}]}]})],
 'shopping-card':[
  example('Boodschappenlijst','De bestaande boodschappenkaart met toevoegen, afvinken en bewerken.'),
  example('Een andere lijst','Een tweede to-do-entiteit met een eigen titel.',{entity:'todo.weekend',title:'Boodschappen voor het weekend'},{'todo.weekend':{state:'2',attributes:{friendly_name:'Weekend',supported_features:127}}}),
  example('Lijst om te lezen','Dezelfde bestaande kaart met een provider die geen bewerkingen ondersteunt.',{entity:'todo.readonly',title:'Voorraadlijst'},{'todo.readonly':{state:'2',attributes:{friendly_name:'Voorraad',supported_features:0}}})]
};
window.records=[];window.detailExamples=[];
if(!entry){
 document.querySelector('#title').textContent='Kaart niet gevonden';document.querySelector('#intro').textContent='Ga terug naar het overzicht en kies een kaart.';document.querySelector('.settings').hidden=true;
}else{
 const [name,title,base,chart]=entry;document.title=title+' — configuraties | Eleven Material';document.querySelector('#title').textContent=title+' · configuraties';document.querySelector('#intro').textContent=(name==='room-card'?'Vijf':'Drie')+' configuraties van de bestaande kaart. Elke configuratie staat naast een werkend voorbeeld met fictieve gegevens.';document.querySelector('#back').href='./#card-'+name;
 if(name==='calendar-card'){const nav=document.createElement('nav');nav.className='view-links';nav.setAttribute('aria-label','Agendaweergaven');for(const [id,text] of [['month','Maand'],['list','Lijst'],['columns','Dagkolommen']]){const a=document.createElement('a');a.href='#'+id;a.textContent=text;nav.append(a);}document.querySelector('header>div').append(nav);document.querySelector('#width').value='640';document.documentElement.style.setProperty('--preview-width','640px');}
 for(const sample of catalog[name]){
  const section=document.createElement('section');section.className='example';if(sample.id)section.id=sample.id;const heading=document.createElement('h2');heading.textContent=sample.title;const text=document.createElement('p');text.textContent=sample.description;
  const layout=document.createElement('div');layout.className='example-layout';const frame=document.createElement('div');frame.className='card-frame';const card=document.createElement(cardType(name).slice(7));card.dataset.card=name;if(chart)card.dataset.chart='true';frame.append(card);
  const details=document.createElement('details');details.className='configuration';details.open=true;const summary=document.createElement('summary');summary.textContent='Configuratie (JSON)';const pre=document.createElement('pre'),code=document.createElement('code');const config={type:cardType(name),title,...structuredClone(base),...structuredClone(sample.changes)};if(sample.changes.entities&&config.series_options){const ids=config.entities.map(e=>typeof e==='string'?e:e.entity);config.series_options=config.series_options.filter(s=>ids.includes(s.entity));}code.textContent=JSON.stringify(config,null,2);pre.append(code);details.append(summary,pre);layout.append(frame,details);section.append(heading,text,layout);document.querySelector('main').append(section);
  card.setConfig(config);const hass=name==='calendar-card'?calendarPreviewFixture(createFixture(name,sample.states)):createFixture(name,sample.states);card.hass=hass;records.push({name,card,hass});detailExamples.push({card,config,title:sample.title});
 }
}
let dark=false;
function theme(){applyReviewTheme(dark);const button=document.querySelector('#mode');button.textContent=dark?'Licht thema':'Donker thema';button.setAttribute('aria-pressed',String(dark));for(const r of records){r.hass={...r.hass,themes:{darkMode:dark}};r.card.hass=r.hass;}}
document.querySelector('#mode').onclick=()=>{dark=!dark;theme();};document.querySelector('#width').onchange=e=>document.documentElement.style.setProperty('--preview-width',e.target.value+'px');theme();window.detailFixtureReady=true;
