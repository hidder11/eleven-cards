import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {securityArt,SECURITY_ART_KINDS} from '../src/security-art.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';
const colors=[['charging','Goud','Warm en rustig'],['waiting','Blauw','Helder en vertrouwd'],['done','Groen','Zacht en natuurlijk'],['planned','Paars','Koel en ingetogen'],['off','Grijs','Neutraal en minimaal']];
const names={disarmed:'Uit',armed_home:'Thuis',armed_away:'Afwezig',armed_night:'Nacht',armed_vacation:'Vakantie',armed_custom_bypass:'Aangepast',arming:'Inschakelen',pending:'Vertraging',triggered:'Alarm actief',unknown:'Onbekend',camera:'Camera'};
let iconStyle='soft';
function illustration(kind,tone){
 const template=document.createElement('template');template.innerHTML=securityArt(kind);const svg=template.content.firstElementChild;
 svg.dataset.exampleStyle=iconStyle;svg.style.color=kind==='triggered'?'var(--error-color,#e98c8c)':kind==='pending'||kind==='arming'?'var(--warning-color,#f2c875)':tone;
 svg.style.opacity=iconStyle==='soft'?'.82':'.95';
 svg.style.filter=iconStyle==='soft'?'drop-shadow(0 2px 3px #0000000a)':'none';
 return svg;
}
class ExampleFeed extends HTMLElement{set hass(value){if(!this.firstChild){this.innerHTML=scene(false);this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}}}
customElements.define('color-example-feed',ExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{const feed=document.createElement('color-example-feed');feed.config=config;return feed;}});
class ColorExampleCard extends customElements.get('eleven-camera-card'){
 _renderSecurity(){
  super._renderSecurity();
  if(!this.shadowRoot.querySelector('[data-color-study]')){const style=document.createElement('style');style.dataset.colorStudy='';style.textContent='.camera-security-art{flex-basis:96px}.camera-security-art svg{width:96px;height:90px;filter:none}.camera-alarm-controls{display:none!important}.camera-security-header{min-height:116px}.security-art-body{animation:none!important}';this.shadowRoot.append(style);}
  const content=this.shadowRoot.querySelector('.content'),tone=getComputedStyle(content).getPropertyValue('--tone').trim();
  const kind=this.shadowRoot.querySelector('[data-security-art]')?.dataset.securityArt??'unknown';
  this.shadowRoot.querySelector('.camera-security-art').replaceChildren(illustration(kind,tone));
 }
}
customElements.define('color-example-card',ColorExampleCard);
const samples=colors.map(([color,name,description])=>{
 const article=document.createElement('article');article.className='color-item';
 const title=document.createElement('h2');title.className='color-title';const swatch=document.createElement('span');swatch.className='swatch';swatch.ariaHidden='true';title.append(swatch,document.createTextNode(name));
 const caption=document.createElement('p');caption.className='color-description';caption.textContent=description;
 const card=document.createElement('color-example-card'),value=document.createElement('code');article.append(title,caption,card,value);document.querySelector('#colors').append(article);
 return {color,card,article,value};
});
function update(){
 const light=document.body.classList.contains('light'),state=document.querySelector('#state').value;
 for(const {color,card,article,value} of samples){
  const config={...structuredClone(securityDesignConfig),color,compact:true,show_activity:false,show_contacts:true,show_alarm:true,cameras:[structuredClone(securityDesignConfig.cameras[0])],card_background:{enabled:true,variant:document.querySelector('#background').value,colorMode:'dynamic',transparency:72,coverage:'header',height:190,animated:false}};
  card.setConfig(config);card.hass=securityDesignHass(state==='triggered'?'alarm':state,light);
  const tone=getComputedStyle(card.shadowRoot.querySelector('.content')).getPropertyValue('--tone').trim();article.style.setProperty('--sample-tone',tone);value.textContent='Kleur van kaart · '+tone;
 }
 document.querySelector('#icons').replaceChildren(...SECURITY_ART_KINDS.map(kind=>{const item=document.createElement('div');item.className='icon-item';item.append(illustration(kind,'var(--accent-color,var(--primary-color))'),document.createTextNode(names[kind]));return item;}));
}
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';};
document.querySelector('#background').onchange=update;document.querySelector('#state').onchange=update;
document.querySelector('#width').onchange=event=>document.body.classList.toggle('narrow',event.target.value==='narrow');
for(const radio of document.querySelectorAll('[name=icon]'))radio.onchange=()=>{iconStyle=radio.value;update();};
await setupThemePreview(document.querySelector('.controls'),update);
window.colorExamplesQA={samples,get iconStyle(){return iconStyle;}};
