import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';
const proposals=[
 {
  "id": "velvet",
  "name": "1. Orbit light",
  "description": "Een brede lichtbundel draait langzaam over een gevuld kleurvlak. Een doorlopende rotatie in plaats van schuivende lagen."
 },
 {
  "id": "satin",
  "name": "2. Satin waves",
  "description": "De behouden satijngolven, nu met een rustige golfbeweging en een zacht verschuivende lichtkant."
 },
 {
  "id": "clouds",
  "name": "3. Ripple field",
  "description": "Grote zachte rimpels groeien vanuit verschillende punten en vervagen. Elke ring heeft een eigen ritme."
 },
 {
  "id": "chevrons",
  "name": "4. Folding planes",
  "description": "Brede vlakken kantelen onafhankelijk rond hun eigen rand. De lichtkanten bewegen mee met de kleine vouwbeweging."
 },
 {
  "id": "opal",
  "name": "5. Liquid shapes",
  "description": "Organische kleurvelden veranderen langzaam van vorm. De contouren vervormen, terwijl het oppervlak gevuld blijft."
 },
 {
  "id": "curtains",
  "name": "6. Woven flow",
  "description": "Twee brede lijnweefsels stromen in verschillende richtingen. Een rustige, doorlopende beweging over het hele vlak."
 }
];
const geometry={
 "velvet": "<i class=\"orbit-bed\"></i><b class=\"orbit-beam\"></b>",
 "satin": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".2\" d=\"M0 0H500V260H0Z\"/><path opacity=\".28\" d=\"M0 25C110 165 240-90 500 45V260H0Z\"/><path opacity=\".3\" d=\"M0 80C160 250 320-65 500 105V260H0Z\"/><path opacity=\".32\" d=\"M0 145C160 295 300 20 500 160V260H0Z\"/><path opacity=\".3\" d=\"M0 215C190 325 320 110 500 220V260H0Z\"/><path class=\"seam\" d=\"M0 80C160 250 320-65 500 105M0 145C160 295 300 20 500 160\"/></svg>",
 "clouds": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".25\" d=\"M0 0H500V260H0Z\"/><g class=\"ripples\"><ellipse cx=\"110\" cy=\"140\" rx=\"155\" ry=\"100\"/><ellipse cx=\"350\" cy=\"65\" rx=\"170\" ry=\"110\"/><ellipse cx=\"310\" cy=\"230\" rx=\"185\" ry=\"120\"/></g></svg>",
 "chevrons": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".22\" d=\"M0 0H500V260H0Z\"/><g class=\"fold-one\"><path opacity=\".35\" d=\"M-30-30H310L175 290H-30Z\"/><path class=\"seam\" d=\"m310-30-135 320\"/></g><g class=\"fold-two\"><path opacity=\".3\" d=\"M210-30H530V290H325Z\"/><path class=\"seam\" d=\"m210-30 115 320\"/></g><g class=\"fold-three\"><path opacity=\".18\" d=\"m-30 105 560 65v120H-30Z\"/><path class=\"seam\" d=\"m-30 105 560 65\"/></g></svg>",
 "opal": "<i class=\"liquid-one\"></i><b class=\"liquid-two\"></b><em class=\"liquid-three\"></em>",
 "curtains": "<i class=\"weave-one\"></i><b class=\"weave-two\"></b>"
};
const styles=`
ha-card{position:relative;isolation:isolate}.content{position:relative;z-index:1}.camera-alarm-controls{display:none!important}.camera-security-header{min-height:132px}
.study-background{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none;opacity:var(--study-opacity);color:var(--study-color);background:color-mix(in srgb,currentColor 12%,transparent)}
.study-background[data-coverage=header]{height:var(--study-height);max-height:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;mask-image:linear-gradient(#000 0 45%,rgb(0 0 0 / .45) 78%,transparent 100%)}
.study-background svg{width:110%;height:110%;position:absolute;inset:-5%;fill:currentColor;stroke:none;transform-origin:center}
.study-background .seam{fill:none;stroke:color-mix(in srgb,currentColor 45%,#fff);stroke-width:1;opacity:.35}
.study-background[data-proposal=satin]{background:linear-gradient(130deg,color-mix(in srgb,currentColor 22%,transparent),transparent 70%)}

.study-background[data-proposal=velvet] .orbit-bed{position:absolute;inset:0;background:linear-gradient(135deg,currentColor,transparent);opacity:.25}
.study-background[data-proposal=velvet] .orbit-beam{position:absolute;width:220%;height:360%;left:-60%;top:-130%;background:conic-gradient(from 0deg,transparent 0deg,color-mix(in srgb,currentColor 75%,transparent) 65deg,transparent 140deg,transparent 220deg,currentColor 280deg,transparent 340deg);filter:blur(18px);opacity:.26;transform-origin:center}
.study-background[data-proposal=clouds] .ripples ellipse{fill:none;stroke:currentColor;stroke-width:26;opacity:.12;filter:blur(5px);transform-box:fill-box;transform-origin:center}
.study-background[data-proposal=chevrons] .fold-one{transform-origin:0 0}.study-background[data-proposal=chevrons] .fold-two{transform-origin:500px 0}.study-background[data-proposal=chevrons] .fold-three{transform-origin:250px 260px}
.study-background[data-proposal=opal]>i,.study-background[data-proposal=opal]>b,.study-background[data-proposal=opal]>em{position:absolute;width:90%;height:140%;border-radius:40% 60% 65% 35% / 60% 30% 70% 40%;background:currentColor;filter:blur(10px)}
.study-background[data-proposal=opal] .liquid-one{left:-30%;top:-35%;opacity:.32}.study-background[data-proposal=opal] .liquid-two{left:25%;top:5%;opacity:.27}.study-background[data-proposal=opal] .liquid-three{left:60%;top:-55%;opacity:.38}
.study-background[data-proposal=curtains]>i,.study-background[data-proposal=curtains]>b{position:absolute;inset:-30%;background:repeating-linear-gradient(120deg,transparent 0 35px,color-mix(in srgb,currentColor 60%,transparent) 45px,transparent 65px 110px);filter:blur(5px);opacity:.48}
.study-background[data-proposal=curtains] .weave-two{background:repeating-linear-gradient(25deg,transparent 0 45px,currentColor 65px,transparent 85px 140px);opacity:.2}
:host([data-feed=hidden]) .camera-body,:host([data-feed=hidden]) .camera-empty,:host([data-feed=hidden]) .camera-security-tabs,:host([data-feed=hidden]) .camera-navigation{display:none!important}:host([data-feed=hidden]) .camera-security-header{padding-bottom:0;min-height:140px}

.study-background[data-animated=true][data-proposal=satin]>svg{animation:full-drift 32s ease-in-out infinite alternate}
.study-background[data-animated=true][data-proposal=satin] .seam{animation:satin-light 28s ease-in-out infinite alternate}
.study-background[data-animated=true] .orbit-beam{animation:orbit-turn 56s linear infinite}
.study-background[data-animated=true] .ripples ellipse{animation:ripple-grow 24s ease-out infinite}.study-background[data-animated=true] .ripples ellipse:nth-child(2){animation-delay:-8s}.study-background[data-animated=true] .ripples ellipse:nth-child(3){animation-delay:-16s}
.study-background[data-animated=true] .fold-one{animation:fold-left 30s ease-in-out infinite alternate}.study-background[data-animated=true] .fold-two{animation:fold-right 36s ease-in-out infinite alternate}.study-background[data-animated=true] .fold-three{animation:fold-low 40s ease-in-out infinite alternate}
.study-background[data-animated=true] .liquid-one{animation:liquid-morph 32s ease-in-out infinite alternate}.study-background[data-animated=true] .liquid-two{animation:liquid-morph 39s ease-in-out infinite alternate-reverse}.study-background[data-animated=true] .liquid-three{animation:liquid-morph 44s ease-in-out infinite alternate}
.study-background[data-animated=true] .weave-one{animation:weave-forward 38s ease-in-out infinite alternate}.study-background[data-animated=true] .weave-two{animation:weave-cross 46s ease-in-out infinite alternate}
@keyframes full-drift{from{transform:translate(-2px,-2px) scale(1.01)}to{transform:translate(3px,3px) scale(1.025)}}
@keyframes satin-light{from{opacity:.25}to{opacity:.42}}
@keyframes orbit-turn{to{transform:rotate(360deg)}}
@keyframes ripple-grow{0%{transform:scale(.65);opacity:0}25%{opacity:.14}100%{transform:scale(1.6);opacity:0}}
@keyframes fold-left{from{transform:skewX(-1deg)}to{transform:skewX(3deg)}}@keyframes fold-right{from{transform:skewX(1deg)}to{transform:skewX(-2deg)}}@keyframes fold-low{to{transform:rotate(2deg)}}
@keyframes liquid-morph{to{border-radius:65% 35% 40% 60% / 35% 70% 30% 65%;transform:translate(8px,5px) rotate(3deg)}}
@keyframes weave-forward{to{background-position:220px 0}}@keyframes weave-cross{to{background-position:0 280px}}
:host([data-motion-paused]) .study-background *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.study-background *{animation:none!important}}
`;
class ExampleFeed extends HTMLElement{set hass(value){if(!this.firstChild){this.innerHTML=scene(false);this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}}}
customElements.define('background-example-feed',ExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:()=>document.createElement('background-example-feed')});
class BackgroundExample extends customElements.get('eleven-camera-card'){
 _renderSecurity(){
  super._renderSecurity();if(!this.proposal)return;
  if(!this.shadowRoot.querySelector('[data-background-study]')){const style=document.createElement('style');style.dataset.backgroundStudy='';style.textContent=styles;this.dataset.feed='hidden';this.shadowRoot.append(style);}
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
 const card=document.createElement('security-background-example');card.proposal=proposal;card.settings={coverage:'card',transparency:40,height:220,animated:true};
 article.append(title,description,card);document.querySelector('#examples').append(article);return {proposal,card};
});
function update(){
 const light=document.body.classList.contains('light'),coverage=document.querySelector('#coverage').value;
 const settings={coverage,transparency:Number(document.querySelector('#transparency').value),height:Math.min(2000,Math.max(24,Number(document.querySelector('#height').value)||220)),animated:document.querySelector('#animated').checked};
 document.querySelector('#opacity-value').textContent=settings.transparency+'%';document.querySelector('#height-field').hidden=coverage!=='header';
 for(const {card} of samples){
  card.settings=settings;card.dataset.feed=document.querySelector('#show-feed').checked?'visible':'hidden';
  const config={...structuredClone(securityDesignConfig),cameras:[{entity:'camera.front',name:'Voordeur',motion_entity:'binary_sensor.front_motion',person_entity:'binary_sensor.front_person'}],show_alarm:true,show_contacts:false,show_activity:false,compact:true,card_background:false};
  const hass=securityDesignHass('quiet',light);hass.states[config.alarm_entity].state=document.querySelector('#state').value;
  card.setConfig(config);card.hass=hass;
 }
}
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.target.textContent=light?'Donker thema':'Licht thema';};
for(const id of ['state','coverage','animated','show-feed'])document.querySelector('#'+id).onchange=update;
for(const id of ['transparency','height'])document.querySelector('#'+id).oninput=update;
document.querySelector('#height').onchange=event=>{event.target.value=samples[0].card.settings.height;update();};
document.querySelector('#width').onchange=event=>document.body.classList.toggle('narrow',event.target.value==='narrow');
await setupThemePreview(document.querySelector('.controls'),update);
window.securityBackgroundQA={samples};
