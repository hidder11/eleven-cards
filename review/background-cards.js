import {applyReviewTheme} from './theme.js';
import {configs,createFixture,calendarPreviewFixture,cardType} from './fixtures.js';
import {CARD_BACKGROUNDS} from '../shared/ui-card-background.js';
const $=selector=>document.querySelector(selector),records=[],groups=[];
const selected=[['aurora','1'],['ribbon','4'],['isobars','7'],['ink-bloom','9B'],['hologram','8']];
const types=[['history-graph-card','Historie'],['car-card','Auto'],['calendar-card','Agenda'],['weather-card','Weer'],['energy-flow-card','Energiestromen'],['car-evcc','Auto met EVCC']];
const settings=()=>({coverage:$('#coverage').value,height:Number($('#background-height').value),colorMode:$('#color-mode').value,transparency:Number($('#transparency').value),animated:$('#animated').checked,colors:[...document.querySelectorAll('#palette input')].map(n=>n.value)});
for(const [name,label]of types){const option=document.createElement('option');option.value=name;option.textContent=label;$('#card-type').append(option);}
for(const [variant,code]of selected){
 const background=CARD_BACKGROUNDS.find(row=>row.value===variant),section=document.createElement('section'),heading=document.createElement('h2'),intro=document.createElement('p'),grid=document.createElement('div'),option=document.createElement('option'),link=document.createElement('a');
 section.className='background-group';section.id='background-'+variant;heading.textContent=code+'. '+background.label;intro.textContent=variant==='isobars'?'Een stilstaande gloed met bewegende lichtaccenten op de lijnen.':variant==='hologram'?'Het perspectiefraster vult de hele kaart, inclusief de bovenrand.':background.description;grid.className='card-grid';section.append(heading,intro,grid);$('main').append(section);groups.push({variant,section});
 option.value=variant;option.textContent=code+'. '+background.label;$('#variant').append(option);link.href='#'+section.id;link.textContent=option.textContent;link.onclick=()=>{$('#variant').value=variant;update();};$('nav').append(link);
 for(const [name,label]of types){
  const source=configs.find(row=>row[0]===name),article=document.createElement('article'),title=document.createElement('h3'),card=document.createElement(cardType(name).slice(7));article.className='card-example';title.textContent=label;card.dataset.card=name;if(source[3])card.dataset.chart='true';article.append(title,card);grid.append(article);
  const config={type:cardType(name),title:label,...structuredClone(source[2]),...(name==='calendar-card'?{view:'list',days_to_show:3}:{})};
  card.setConfig(config);const hass=name==='calendar-card'?calendarPreviewFixture(createFixture(name)):createFixture(name);card.hass=hass;
  const record={name,variant,article,card,config,hass};record.background={update:()=>card.setCardBackground({variant,...settings()}),disconnect:()=>{}};record.background.update();records.push(record);
 }
}
function update(){
 const mode=$('#color-mode').value;$('#height-control').hidden=$('#coverage').value!=='header';$('#palette').hidden=mode!=='custom';$('#transparency-value').textContent=$('#transparency').value+'%';
 for(const r of records){r.article.hidden=$('#card-type').value!=='all'&&$('#card-type').value!==r.name;const view=$('#calendar-view').value;if(r.name==='calendar-card'&&r.config.view!==view){r.config={...r.config,view};r.card.setConfig(r.config);}r.background.update();}
 for(const g of groups)g.section.hidden=$('#variant').value!=='all'&&$('#variant').value!==g.variant;
 window.backgroundCardSettings=settings();
}
let dark=false;$('#mode').onclick=()=>{dark=!dark;applyReviewTheme(dark);$('#mode').textContent=dark?'Licht thema':'Donker thema';$('#mode').setAttribute('aria-pressed',String(dark));for(const r of records){r.hass={...r.hass,themes:{darkMode:dark}};r.card.hass=r.hass;}};
$('form').onsubmit=event=>event.preventDefault();$('form').oninput=update;applyReviewTheme(dark);update();window.backgroundCardExamples=records;window.backgroundCardsReady=true;
window.addEventListener('pagehide',()=>records.forEach(r=>r.background.disconnect()));
