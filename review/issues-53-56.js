import {configs,createFixture,calendarPreviewFixture,cardType} from './fixtures.js';
import {applyReviewTheme} from './theme.js';

window.issueCards={};
window.issueTheme=(dark=true,paint='material')=>{
 applyReviewTheme(dark,paint);
 for(const {card,hass} of Object.values(issueCards)){hass.themes={darkMode:dark};card.hass=hass;}
};
let dark=true;issueTheme(dark);
document.querySelector('#theme').onclick=()=>{dark=!dark;issueTheme(dark);document.querySelector('#theme').textContent=dark?'Licht thema':'Donker thema';};
function section(number,title){
 const el=document.createElement('section');el.id='issue-'+number;
 const h=document.createElement('h2');h.textContent='#'+number+' · '+title;el.append(h);document.querySelector('main').append(el);return el;
}
function card(key,name,parent,changes={},hass=createFixture(name)){
 const config=configs.find(row=>row[0]===name)[2],element=document.createElement(cardType(name).slice(7));
 element.dataset.card=name;element.setConfig({type:cardType(name),...config,...changes});hass.themes={darkMode:dark};element.hass=hass;parent.append(element);issueCards[key]={card:element,hass};return element;
}
function caption(parent,text){const p=document.createElement('p');p.className='caption';p.textContent=text;parent.append(p);}
const cars=section(53,'Gelijke afmetingen met en zonder EVCC');cars.classList.add('pair');
caption(cars,'Zonder EVCC');card('car','car-card',cars,{show_field_1:false,show_field_2:false,show_field_3:false});
caption(cars,'Met EVCC');card('evcc','car-evcc',cars,{tabs:[]});
const bars=section(54,'Energiebalken met dezelfde 12 px track als Car');
card('energy-bars','energy-flow-card',bars,{detail_view:'tabs',default_tab:'sun',tabs:['sun']});
caption(bars,'Dezelfde balk in Car');card('bar-car','car-card',bars,{show_field_1:false,show_field_2:false,show_field_3:false});
const units=section(55,'Vaste tussenruimte tussen waarde en kW');
card('energy-units','energy-flow-card',units);
const calendar=section(56,'Compactere afstand rond de kalenderlegenda');
const calendarHass=calendarPreviewFixture(createFixture('calendar-card'));
for(const [id,name] of [['work','Werk'],['school','School'],['waste','Afval']])calendarHass.states['calendar.'+id]={state:'on',attributes:{friendly_name:name}};
card('calendar','calendar-card',calendar,{title:'Afspraken',days_to_show:5,entities:[{entity:'calendar.family',name:'Gezamenlijk'},{entity:'calendar.work',name:'Werk'},{entity:'calendar.school',name:'School'},{entity:'calendar.waste',name:'Afval'}]},calendarHass).style.height='430px';
window.issueFixturesReady=true;
