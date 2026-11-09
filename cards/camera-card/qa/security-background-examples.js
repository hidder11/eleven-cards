import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';
const proposals=[
 {id:'spotlight',name:'1. Soft spotlight',description:'Een brede lichtvlek achter het icoon, met veel rustige ruimte naast de tekst. Mijn voorkeur voor een subtiele achtergrond.'},
 {id:'arcs',name:'2. Quiet arcs',description:'Fijne, ruime bogen vanaf de rechterbovenhoek. Meer structuur, met een zachte gloed langs de buitenste boog.'},
 {id:'prism',name:'3. Folded light',description:'Brede doorschijnende vlakken met een fijne lichtkant. Een iets strakker alternatief dat goed bij de inset oppervlakken past.'},
 {id:'dots',name:'4. Signal field',description:'Een verfijnd puntenveld dat richting de tekst vervaagt. Technisch en rustig, zonder een volledig raster.'}
];
const geometry={spotlight:'<i></i><b></b>',arcs:'<svg viewBox="0 0 500 260" preserveAspectRatio="xMaxYMin slice"><ellipse cx="450" cy="-10" rx="105" ry="92"/><ellipse cx="450" cy="-10" rx="158" ry="137"/><ellipse cx="450" cy="-10" rx="211" ry="182"/><ellipse cx="450" cy="-10" rx="264" ry="227"/></svg><i></i>',prism:'<svg viewBox="0 0 500 260" preserveAspectRatio="none"><path d="M170 0H500V260H380Z"/><path d="M330 0H500V260H150Z"/><path d="M330 0 150 260M170 0l210 260"/></svg>',dots:'<i></i><b></b>'};
const styles=`
ha-card{position:relative;isolation:isolate}.content{position:relative;z-index:1}.camera-alarm-controls{display:none!important}.camera-security-header{min-height:132px}
.study-background{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none;opacity:var(--study-opacity);color:var(--study-color)}
.study-background[data-coverage=header]{height:var(--study-height);max-height:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;mask-image:linear-gradient(#000 0 45%,transparent 100%)}
.study-background svg{width:100%;height:100%;position:absolute;inset:0;fill:none;stroke:currentColor;stroke-width:1;overflow:visible}
.study-background[data-proposal=spotlight] i{position:absolute;inset:-30%;background:radial-gradient(ellipse at 77% 29%,color-mix(in srgb,currentColor 85%,transparent),transparent 43%);filter:blur(14px)}
.study-background[data-proposal=spotlight] b{position:absolute;inset:0;background:radial-gradient(ellipse at 100% 0,currentColor,transparent 65%);opacity:.18}
.study-background[data-proposal=arcs] svg{opacity:.55}.study-background[data-proposal=arcs] ellipse:nth-child(3){stroke-width:8;opacity:.18;filter:blur(4px)}
.study-background[data-proposal=arcs] i{position:absolute;inset:0;background:radial-gradient(ellipse at 98% 0,currentColor,transparent 60%);opacity:.35}
.study-background[data-proposal=prism] svg{stroke:none}.study-background[data-proposal=prism] path:nth-child(1){fill:currentColor;opacity:.26}.study-background[data-proposal=prism] path:nth-child(2){fill:currentColor;opacity:.14}.study-background[data-proposal=prism] path:nth-child(3){stroke:currentColor;opacity:.42;stroke-width:.8}
.study-background[data-proposal=dots] i{position:absolute;inset:0;background:radial-gradient(circle,currentColor 1px,transparent 1.5px) 0 0/15px 15px;mask-image:radial-gradient(ellipse at 90% 10%,#000,transparent 70%);opacity:.75}
.study-background[data-proposal=dots] b{position:absolute;inset:0;background:radial-gradient(ellipse at 95% 8%,currentColor,transparent 65%);opacity:.16}
.study-background[data-animated=true]>:first-child{animation:study-drift 22s ease-in-out infinite alternate;transform-origin:80% 20%}
@keyframes study-drift{to{transform:translate(-8px,6px) scale(1.04)}}
:host([data-motion-paused]) .study-background *{animation-play-state:paused!important}@media(prefers-reduced-motion:reduce){.study-background *{animation:none!important}}
`;
class ExampleFeed extends HTMLElement{set hass(value){if(!this.firstChild){this.innerHTML=scene(false);this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}}}
customElements.define('background-example-feed',ExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:()=>document.createElement('background-example-feed')});
class BackgroundExample extends customElements.get('eleven-camera-card'){
 _renderSecurity(){
  super._renderSecurity();if(!this.proposal)return;
  if(!this.shadowRoot.querySelector('[data-background-study]')){const style=document.createElement('style');style.dataset.backgroundStudy='';style.textContent=styles;this.shadowRoot.append(style);}
  let layer=this.shadowRoot.querySelector('.study-background');
  if(!layer){layer=document.createElement('div');layer.className='study-background';layer.ariaHidden='true';layer.dataset.proposal=this.proposal.id;layer.innerHTML=geometry[this.proposal.id];this.shadowRoot.querySelector('ha-card').prepend(layer);}
  const settings=this.settings;layer.dataset.coverage=settings.coverage;layer.dataset.animated=String(settings.animated);
  layer.style.setProperty('--study-color',this.cardBackgroundStatusColor());layer.style.setProperty('--study-opacity',(100-settings.transparency)/100);layer.style.setProperty('--study-height',settings.height+'px');
 }
}
customElements.define('security-background-example',BackgroundExample);
const samples=proposals.map(proposal=>{
 const article=document.createElement('article');article.className='background-item';
 const title=document.createElement('h2');title.textContent=proposal.name;
 const description=document.createElement('p');description.className='background-description';description.textContent=proposal.description;
 const card=document.createElement('security-background-example');card.proposal=proposal;card.settings={coverage:'header',transparency:55,height:220,animated:false};
 article.append(title,description,card);document.querySelector('#examples').append(article);return {proposal,card};
});
function update(){
 const light=document.body.classList.contains('light'),coverage=document.querySelector('#coverage').value;
 const settings={coverage,transparency:Number(document.querySelector('#transparency').value),height:Math.min(2000,Math.max(24,Number(document.querySelector('#height').value)||220)),animated:document.querySelector('#animated').checked};
 document.querySelector('#opacity-value').textContent=settings.transparency+'%';document.querySelector('#height-field').hidden=coverage!=='header';
 for(const {card} of samples){
  card.settings=settings;
  const config={...structuredClone(securityDesignConfig),cameras:[{entity:'camera.front',name:'Voordeur',motion_entity:'binary_sensor.front_motion',person_entity:'binary_sensor.front_person'}],show_alarm:true,show_contacts:false,show_activity:false,compact:true,card_background:false};
  const hass=securityDesignHass('quiet',light);hass.states[config.alarm_entity].state=document.querySelector('#state').value;
  card.setConfig(config);card.hass=hass;
 }
}
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';};
for(const id of ['state','coverage','animated'])document.querySelector('#'+id).onchange=update;
for(const id of ['transparency','height'])document.querySelector('#'+id).oninput=update;
document.querySelector('#height').onchange=event=>{event.target.value=samples[0].card.settings.height;update();};
document.querySelector('#width').onchange=event=>document.body.classList.toggle('narrow',event.target.value==='narrow');
await setupThemePreview(document.querySelector('.controls'),update);
window.securityBackgroundQA={samples};
