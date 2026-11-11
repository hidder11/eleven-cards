import {configs,createFixture,calendarPreviewFixture,cardType} from './fixtures.js';
import {applyReviewTheme} from './theme.js';
// This stub demonstrates disclosure geometry only. HA owns the real selectors.
if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 set schema(value){this._schema=value;this.paint();} set data(value){this._data=value;this.paint();}
 set computeLabel(value){this._label=value;this.paint();}
 paint(){this.shadowRoot.innerHTML='<style>:host{display:block}label{display:block;padding:10px 0;font-size:12px}input{display:block;box-sizing:border-box;width:100%;margin-top:4px;min-height:36px;background:var(--secondary-background-color);color:inherit;border:0;padding:8px}</style>';for(const field of this._schema??[]){const label=document.createElement('label'),input=document.createElement('input');label.textContent=this._label?.(field)??field.name;input.value=this._data?.[field.name]??'';input.readOnly=true;label.append(input);this.shadowRoot.append(label);}}
});
window.issueCards={};let dark=true;
function theme(){applyReviewTheme(dark,'native');for(const {card,hass} of Object.values(issueCards)){hass.themes={darkMode:dark};card.hass=hass;}document.querySelector('#theme').textContent=dark?'Licht thema':'Donker thema';}
theme();document.querySelector('#theme').onclick=()=>{dark=!dark;theme();};
function section(number,title,description){const section=document.createElement('section'),h=document.createElement('h2'),p=document.createElement('p');section.id='issue-'+number;h.textContent='#'+number+' · '+title;p.textContent=description;section.append(h,p);document.querySelector('main').append(section);return section;}
function card(name,parent,changes={},hass=createFixture(name)){
 const config=configs.find(row=>row[0]===name)[2],element=document.createElement(cardType(name).slice(7));element.dataset.card=name;
 element.setConfig({type:cardType(name),...config,...changes});hass.themes={darkMode:dark};element.hass=hass;parent.append(element);issueCards[name]={card:element,hass};return element;
}
const calendarSection=section(41,'Agenda blijft binnen de kaart','Een vaste hoogte met 14 dagen: afspraken scrollen binnen de agenda. De weerkaart blijft eronder.');
const calendar=card('calendar-card',calendarSection,{view:'list',days_to_show:14,compact:true},calendarPreviewFixture(createFixture('calendar-card')));calendar.style.height='390px';
const following=document.createElement('div');following.className='following';calendarSection.append(following);card('weather-card',following,{compact:true,tabs:[]});
const wasteSection=section(42,'Afvalbronnen inklappen','Open of sluit een bron via de kop. Bewerk-, verplaats- en verwijderacties behouden hun eigen gedrag.');
const wasteConfig={type:'custom:eleven-waste-card',title:'Afvalinzameling',entities:[{entity:'sensor.organic',name:'GFT',icon:'mdi:leaf'},{entity:'sensor.paper',name:'Papier',icon:'mdi:package-variant'},{entity:'calendar.waste',name:'Plastic',icon:'mdi:recycle'}]};
const wasteHass=createFixture('waste-card');wasteHass.themes={darkMode:dark};wasteHass.locale={...wasteHass.locale,language:'nl'};
const wasteEditor=await customElements.get('eleven-waste-card').getConfigElement();wasteEditor.className='editor';wasteEditor.setConfig(wasteConfig);wasteEditor.hass=wasteHass;wasteSection.append(wasteEditor);window.issueWasteEditor=wasteEditor;
wasteEditor.addEventListener('config-changed',event=>{wasteEditor.setConfig(event.detail.config);});
const overviewSection=section(46,'Overzicht zonder rand rond de inleg','De sensorvlakken gebruiken dezelfde themarollen als de grafiekinleg.');
card('overview-card',overviewSection,{section_size:'standard'});
const carSection=section(47,'Autoafbeelding direct laden','Image-entiteit met actueel toegangstoken, zonder entity_picture en zonder eerst de editor te openen.');
const carHass=createFixture('car-card');carHass.states['image.issue_car']={entity_id:'image.issue_car',state:'unknown',attributes:{access_token:'synthetic-current-token'}};
carHass.hassUrl=path=>{const url=new URL(path,location.origin);return url.pathname==='/api/image_proxy/image.issue_car'&&url.searchParams.get('token')==='synthetic-current-token'?new URL('issue-fixes/car.svg'+url.search,import.meta.url).href:new URL('issue-fixes/missing.svg',import.meta.url).href;};
card('car-card',carSection,{image_entity:'image.issue_car',compact:true},carHass);
const energySection=section(48,'Compacter energiediagram','Minder lege ruimte boven de knooppunten. Teruglevering staat onder de bovenste route.');
card('energy-flow-card',energySection,{compact:true,animate_background:false});
window.issueFixturesReady=true;
