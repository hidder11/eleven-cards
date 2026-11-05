import {applyReviewTheme} from './theme.js';
import {CARD_BACKGROUNDS,uiCardBackground,uiCardBackgroundStyles,observeCardBackgroundMotion} from '../shared/ui-card-background.js';
import {uiPrimaryValue,uiPrimaryValueStyles} from '../shared/ui-primary-value.js';
import {uiMetric,uiMetricStyles} from '../shared/ui-metric.js';
import {uiBar,uiBarStyles} from '../shared/ui-bar.js';
const styles=document.createElement('style');styles.textContent=uiCardBackgroundStyles()+uiPrimaryValueStyles()+uiMetricStyles()+uiBarStyles();document.head.append(styles);
const $=selector=>document.querySelector(selector),grid=$('main'),variant=$('#variant');
const statuses={charging:{color:'#35885a',label:'Laden'},parked:{color:'#64748b',label:'Geparkeerd'},warning:{color:'#be7530',label:'Aandacht nodig'}};
const families=[['aurora','1 · Aurora sky'],['ribbon','4 · Silk Flow'],['isobars','7 · Atmospheric flow'],['ink','9 · Liquid ink'],['hologram','8 · Holographic grid'],['new','Vijf nieuwe weergaven'],['other','Overige oorspronkelijke voorbeelden']];
const groups=new Map(),familyNav=document.querySelector('.background-family-nav');
for(const [id,label]of families){
 const section=document.createElement('section'),heading=document.createElement('h2'),cards=document.createElement('div'),options=document.createElement('optgroup'),familyOption=document.createElement('option'),link=document.createElement('a');
 section.id='family-'+id;section.className='background-family';heading.textContent=label;cards.className='background-grid';section.append(heading,cards);grid.append(section);
 options.label=label;familyOption.value='family:'+id;familyOption.textContent='Deze groep bekijken';options.append(familyOption);variant.append(options);groups.set(id,{section,cards,options});
 link.href='#family-'+id;link.textContent=label;link.onclick=()=>{variant.value='family:'+id;render();};familyNav.append(link);
}
const records=CARD_BACKGROUNDS.map((background,i)=>{
 const code=background.code??String(i+1),family=background.family??background.value,group=groups.get(family)??groups.get(Number(code)>=11?'new':'other');
 const option=document.createElement('option');option.value=background.value;option.textContent=code+'. '+background.label;group.options.append(option);
 const article=document.createElement('article'),title=document.createElement('h3'),description=document.createElement('p'),card=document.createElement('ha-card');
 title.textContent=code+'. '+background.label;description.textContent=background.description;card.className='demo-card';card.setAttribute('data-ui-background-host','');article.append(title,description,card);group.cards.append(article);return {background,code,group,article,card,cleanup:()=>{}};
});
function render(){
 const coverage=$('#coverage').value,height=Number($('#background-height').value),colorMode=$('#color-mode').value,status=statuses[$('#status').value],transparency=Number($('#transparency').value),animated=$('#animated').checked,colors=[...document.querySelectorAll('#palette input')].map(input=>input.value);
 $('#height-control').hidden=coverage!=='header';$('#palette').hidden=colorMode!=='custom';$('#status-control').hidden=colorMode!=='dynamic';$('#transparency-value').textContent=transparency+'%';
 for(const record of records){
  record.cleanup();record.article.hidden=variant.value!=='all'&&variant.value!==record.background.value&&variant.value!=='family:'+record.group.section.id.slice(7);
  record.card.innerHTML=uiCardBackground({variant:record.background.value,coverage,height,colorMode,colors,transparency,animated},{statusColor:status.color})+'<div class="demo-content"><h3>Auto</h3>'+uiPrimaryValue({value:'62',unit:'%',subtitle:'284 km actieradius',layout:'uniform'})+uiBar({value:62,target:80,charging:animated&&status===statuses.charging,decorative:true})+'<div class="demo-metrics">'+uiMetric({title:'Status',value:status.label,attrs:{'data-value-kind':'text'}})+uiMetric({title:'Kilometerstand',value:'98.452',unit:'km'})+'</div></div>';
  record.cleanup=observeCardBackgroundMotion(record.card);
 }
 for(const group of groups.values())group.section.hidden=records.filter(record=>record.group===group).every(record=>record.article.hidden);
 window.backgroundSettings={coverage,height,colorMode,transparency,animated,colors,status:$('#status').value};
}
let dark=false;$('#mode').onclick=()=>{dark=!dark;applyReviewTheme(dark);$('#mode').textContent=dark?'Licht thema':'Donker thema';$('#mode').setAttribute('aria-pressed',String(dark));};
$('form').onsubmit=event=>event.preventDefault();$('form').oninput=render;applyReviewTheme(dark);render();window.backgroundExamples=records;window.backgroundExamplesReady=true;
window.addEventListener('pagehide',()=>records.forEach(record=>record.cleanup()));
