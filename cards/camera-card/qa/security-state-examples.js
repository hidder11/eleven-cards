import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {securityWeatherArt} from './security-weather-art.js';
import {weatherArt} from '../../weather-card/src/weather-art.js';
import {uiPrimaryValue} from '../../../shared/ui-primary-value.js';
const states=[
 {id:'disarmed',title:'Uit',label:'Uit',subtitle:'Alarm uitgeschakeld',description:'Neutraal blauwgrijs met een open slot.',colors:['#748b9d','#a2b9cb'],members:['disarmed']},
 {id:'armed_away',title:'Aan',label:'Aan',subtitle:'Alarm ingeschakeld',description:'Zacht groen voor alle ingeschakelde standen: thuis, afwezig, nacht, vakantie en aangepast.',colors:['#39856d','#8cd6b7'],members:['armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass']},
 {id:'arming',title:'Inschakelen',label:'Inschakelen / uitschakelen',subtitle:'Alarm wordt ingeschakeld',description:'Warm amber met een klok voor in- en uitschakelen, inclusief een actieve vertraging.',colors:['#ac843a','#e8c477'],members:['arming','disarming','pending']},
 {id:'unknown',title:'Onbekend',label:'Onbekend / niet beschikbaar',subtitle:'Alarmstatus onbekend',description:'Gedempt grijs als de status onbekend of niet beschikbaar is, ook bij verbindingsverlies.',colors:['#7d8797','#a6b0c0'],members:['unknown','unavailable','offline']},
 {id:'triggered',title:'Alarm',label:'Alarm',subtitle:'Alarm geactiveerd',description:'Rustig rood met een herkenbare sirene voor een actief alarm.',colors:['#ba5f5b','#ed9690'],members:['triggered']}
];
window.loadCardHelpers=async()=>({createCardElement:()=>document.createElement('div')});
const light=()=>document.body.classList.contains('light');
class StateExampleCard extends customElements.get('eleven-camera-card'){
 cardBackgroundStatusColor(){return this.status?.colors[light()?0:1]??'#a6b0c0';}
 _renderSecurity(){
  super._renderSecurity();if(!this.status)return;
  if(!this.shadowRoot.querySelector('[data-state-example]')){const style=document.createElement('style');style.dataset.stateExample='';style.textContent='.camera-body,.camera-empty,.camera-navigation,.camera-security-tabs,.camera-alarm-controls{display:none!important}.camera-security-header{min-height:132px}.camera-security-art{flex:0 0 94px}.camera-security-art svg{display:block;width:94px;height:88px;filter:drop-shadow(0 2px 3px #1025360a);opacity:.92}.camera-security-content{display:none!important}.camera-primary[data-long-status=true] [data-ui-primary-value]{--ui-primary-size:26px}@container(max-width:300px){.camera-security-art{flex-basis:74px}.camera-security-art svg{width:74px;height:70px}.camera-primary [data-ui-primary-value]{--ui-primary-size:32px}.camera-primary[data-long-status=true] [data-ui-primary-value]{--ui-primary-size:22px}}';this.shadowRoot.append(style);}
  const state=this.status,color=this.cardBackgroundStatusColor(),root=this.shadowRoot.querySelector('.camera-security-header');
  root.innerHTML='<div class="camera-primary" data-long-status="'+(state.title.length>9)+'">'+uiPrimaryValue({value:state.title,subtitle:state.subtitle,compact:true,attrs:{'data-primary-layout':'uniform'}})+'</div><div class="camera-security-art">'+securityWeatherArt(state.id,color)+'</div>';
 }
}
customElements.define('state-example-card',StateExampleCard);
const samples=states.map(state=>{
 const article=document.createElement('article');article.className='status-item';
 const title=document.createElement('h2');title.className='status-label';const dot=document.createElement('span');dot.ariaHidden='true';title.append(dot,document.createTextNode(state.label));
 const description=document.createElement('p');description.className='status-caption';description.textContent=state.description;
 const card=document.createElement('state-example-card');card.status=state;
 const caption=document.createElement('code');caption.className='state-id';article.append(title,description,card,caption);document.querySelector('#states').append(article);return {state,card,article,caption};
});
const reference=document.querySelector('#reference');reference.innerHTML=weatherArt('partly');const referenceText=document.createElement('p');referenceText.textContent='Stijlreferentie: het originele klassieke weericoon uit deze repo. De security-iconen gebruiken hetzelfde zilverblauwe verloop, dezelfde zachte rand en dezelfde witte lichtaccenten.';reference.append(referenceText);
function backgroundSettings(){
 const number=Number(document.querySelector('#background-height').value);
 return {enabled:document.querySelector('#background-enabled').checked,variant:document.querySelector('#background').value,colorMode:'dynamic',transparency:Number(document.querySelector('#transparency').value),coverage:document.querySelector('#coverage').value,height:Math.min(2000,Math.max(24,Number.isFinite(number)&&number>0?number:220)),animated:document.querySelector('#background-animated').checked};
}
function update(){
 const background=backgroundSettings();
 document.querySelector('#transparency-value').textContent=background.transparency+'%';
 document.querySelector('#height-field').hidden=background.coverage!=='header';
 for(const input of document.querySelectorAll('#background-settings input:not(#background-enabled),#background-settings select'))input.disabled=!background.enabled;
 for(const {state,card,article,caption} of samples){
  const config={...structuredClone(securityDesignConfig),cameras:[],show_alarm:true,show_activity:false,show_contacts:true,compact:true,card_background:background};
  const hass=securityDesignHass('quiet',light());hass.states['alarm_control_panel.home'].state=state.id;
  card.setConfig(config);card.hass=hass;
  article.style.setProperty('--status-color',card.cardBackgroundStatusColor());caption.textContent=state.members.join(' / ')+' · '+card.cardBackgroundStatusColor();
 }
}
document.querySelector('#theme').onclick=event=>{const next=document.body.classList.toggle('light');event.target.textContent=next?'Donker thema':'Licht thema';};
document.querySelector('#background').onchange=update;
document.querySelector('#background-settings').addEventListener('input',update);
document.querySelector('#background-height').addEventListener('change',event=>{event.target.value=backgroundSettings().height;update();});document.querySelector('#width').onchange=event=>document.body.classList.toggle('narrow',event.target.value==='narrow');
await setupThemePreview(document.querySelector('.controls'),update);
window.securityStatesQA={states,samples};
