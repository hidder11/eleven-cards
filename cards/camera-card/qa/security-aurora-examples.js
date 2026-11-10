import '../dist/eleven-camera-card.js';
import './fixture-icons.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {setupThemePreview} from './security-theme-preview.js';
import {scene} from './security-scene.js';
import {uiCardBackground,uiCardBackgroundStyles} from '../../../shared/ui-card-background.js';
const proposals=[
 {
  "id": "original",
  "name": "1. Aurora sky",
  "description": "De bestaande Aurora sky als referentie: lichtgordijnen en kleine sterren, met de huidige statuskleur."
 },
 {
  "id": "satin",
  "name": "2. Satin waves - behouden",
  "description": "Jouw gekozen satijngolven blijven ongewijzigd beschikbaar om de Aurora-varianten mee te vergelijken."
 },
 {
  "id": "curtains",
  "name": "3. Aurora curtains",
  "description": "Brede, verticale lichtgordijnen vullen het oppervlak. De lagen wiegen langzaam in tegengestelde richting."
 },
 {
  "id": "horizon",
  "name": "4. Aurora horizon",
  "description": "Een brede lichtboog met gloed vanaf de onderrand. De boog komt langzaam omhoog en zakt weer terug."
 },
 {
  "id": "veil",
  "name": "5. Aurora veil",
  "description": "Een diffuus noorderlicht dat als zachte nevel door de hele kaart beweegt. De rustigste, meest egale variant."
 },
 {
  "id": "ribbons",
  "name": "6. Aurora ribbons",
  "description": "Twee gebogen lichtbanen lopen diagonaal door het vlak. Ze vervormen langzaam, met een zachte lichte rand."
 },
 {
  "id": "fan",
  "name": "7. Paper fans",
  "description": "Brede waaiervlakken liggen als gevouwen papier over de hele kaart. De vlakken kantelen langzaam rond hun onderste punt."
 },
 {
  "id": "isometric",
  "name": "8. Isometric depth",
  "description": "Grote driedimensionale blokken vormen een rustig reliëf. Een zachte lichtlaag glijdt over de vlakken."
 },
 {
  "id": "trails",
  "name": "9. Comet trails",
  "description": "Fijne lichtsporen volgen lange gebogen banen. De accenten stromen rustig door een gevuld kleurveld."
 },
 {
  "id": "lenses",
  "name": "10. Lenticular glow",
  "description": "Grote overlappende lenzen breken het licht in zachte randen. De ovale vormen rekken langzaam uit en schuiven langs elkaar."
 },
 {
  "id": "honeycomb",
  "name": "11. Honeycomb satin",
  "description": "Grote gevulde zeshoeken vormen een satijnachtig oppervlak. Hun lichtaccenten wisselen geleidelijk, zonder dat het raster beweegt."
 }
];
const geometry={
 "original": "",
 "satin": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".2\" d=\"M0 0H500V260H0Z\"/><path opacity=\".28\" d=\"M0 25C110 165 240-90 500 45V260H0Z\"/><path opacity=\".3\" d=\"M0 80C160 250 320-65 500 105V260H0Z\"/><path opacity=\".32\" d=\"M0 145C160 295 300 20 500 160V260H0Z\"/><path opacity=\".3\" d=\"M0 215C190 325 320 110 500 220V260H0Z\"/><path class=\"seam\" d=\"M0 80C160 250 320-65 500 105M0 145C160 295 300 20 500 160\"/></svg>",
 "curtains": "<i></i><b></b><em></em>",
 "horizon": "<i></i><b></b><em></em>",
 "veil": "<i></i><b></b><em></em>",
 "ribbons": "<i></i><b></b><em></em>",
 "fan": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".2\" d=\"M0 0H500V260H0Z\"/><g class=\"fan-panels\"><path d=\"M250 340 -160 -60 -40 -60Z\" opacity=\"0.15\"/><path d=\"M250 340 -40 -60 80 -60Z\" opacity=\"0.25\"/><path d=\"M250 340 80 -60 200 -60Z\" opacity=\"0.35\"/><path d=\"M250 340 200 -60 320 -60Z\" opacity=\"0.15\"/><path d=\"M250 340 320 -60 440 -60Z\" opacity=\"0.25\"/><path d=\"M250 340 440 -60 560 -60Z\" opacity=\"0.35\"/><path d=\"M250 340 560 -60 680 -60Z\" opacity=\"0.15\"/></g></svg>",
 "isometric": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".16\" d=\"M0 0H500V260H0Z\"/><g transform=\"translate(-70 -55)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(85 -55)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(240 -55)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(395 -55)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(8 80)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(163 80)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(318 80)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(473 80)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(-70 215)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(85 215)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(240 215)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g><g transform=\"translate(395 215)\"><path opacity=\".18\" d=\"m78 0 78 45-78 45L0 45Z\"/><path opacity=\".3\" d=\"m0 45 78 45v90L0 135Z\"/><path opacity=\".43\" d=\"m78 90 78-45v90l-78 45Z\"/></g></svg><i class=\"block-light\"></i>",
 "trails": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".2\" d=\"M0 0H500V260H0Z\"/><g class=\"trail-base\"><path d=\"M-120 -90Q160 80 620 -120\"/><path d=\"M-120 -45Q160 102 620 -80\"/><path d=\"M-120 0Q160 124 620 -40\"/><path d=\"M-120 45Q160 146 620 0\"/><path d=\"M-120 90Q160 168 620 40\"/><path d=\"M-120 135Q160 190 620 80\"/><path d=\"M-120 180Q160 212 620 120\"/><path d=\"M-120 225Q160 234 620 160\"/><path d=\"M-120 270Q160 256 620 200\"/></g><g class=\"trail-stream\"><path style=\"animation-delay:-0s\" d=\"M-120 -90Q160 80 620 -120\"/><path style=\"animation-delay:-4s\" d=\"M-120 -45Q160 102 620 -80\"/><path style=\"animation-delay:-8s\" d=\"M-120 0Q160 124 620 -40\"/><path style=\"animation-delay:-12s\" d=\"M-120 45Q160 146 620 0\"/><path style=\"animation-delay:-16s\" d=\"M-120 90Q160 168 620 40\"/><path style=\"animation-delay:-20s\" d=\"M-120 135Q160 190 620 80\"/><path style=\"animation-delay:-24s\" d=\"M-120 180Q160 212 620 120\"/><path style=\"animation-delay:-28s\" d=\"M-120 225Q160 234 620 160\"/><path style=\"animation-delay:-32s\" d=\"M-120 270Q160 256 620 200\"/></g></svg>",
 "lenses": "<i></i><b></b><em></em>",
 "honeycomb": "<svg viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".16\" d=\"M0 0H500V260H0Z\"/><path class=\"hex-cell\" style=\"animation-delay:-0s\" opacity=\"0.16\" d=\"m-10 -10 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-5s\" opacity=\"0.215\" d=\"m90 -10 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-10s\" opacity=\"0.27\" d=\"m190 -10 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-15s\" opacity=\"0.325\" d=\"m290 -10 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-20s\" opacity=\"0.16\" d=\"m390 -10 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-25s\" opacity=\"0.215\" d=\"m490 -10 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-30s\" opacity=\"0.27\" d=\"m40 76 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-0s\" opacity=\"0.325\" d=\"m140 76 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-5s\" opacity=\"0.16\" d=\"m240 76 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-10s\" opacity=\"0.215\" d=\"m340 76 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-15s\" opacity=\"0.27\" d=\"m440 76 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-20s\" opacity=\"0.325\" d=\"m540 76 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-25s\" opacity=\"0.16\" d=\"m-10 162 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-30s\" opacity=\"0.215\" d=\"m90 162 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-0s\" opacity=\"0.27\" d=\"m190 162 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-5s\" opacity=\"0.325\" d=\"m290 162 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-10s\" opacity=\"0.16\" d=\"m390 162 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-15s\" opacity=\"0.215\" d=\"m490 162 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-20s\" opacity=\"0.27\" d=\"m40 248 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-25s\" opacity=\"0.325\" d=\"m140 248 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-30s\" opacity=\"0.16\" d=\"m240 248 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-0s\" opacity=\"0.215\" d=\"m340 248 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-5s\" opacity=\"0.27\" d=\"m440 248 48 27v54l-48 27-48-27v-54Z\"/><path class=\"hex-cell\" style=\"animation-delay:-10s\" opacity=\"0.325\" d=\"m540 248 48 27v54l-48 27-48-27v-54Z\"/></svg>"
};
const styles=`

ha-card{position:relative;isolation:isolate}.content{position:relative;z-index:1}.camera-alarm-controls{display:none!important}.camera-security-header{min-height:132px}
.study-background{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none;opacity:var(--study-opacity);color:var(--study-color);background:color-mix(in srgb,currentColor 12%,transparent)}
.study-background[data-coverage=header]{height:var(--study-height);max-height:100%;border-bottom-left-radius:0;border-bottom-right-radius:0;mask-image:linear-gradient(#000 0 45%,rgb(0 0 0 / .45) 78%,transparent 100%)}
.study-background svg{width:110%;height:110%;position:absolute;inset:-5%;fill:currentColor;stroke:none;transform-origin:center}
.study-background .seam{fill:none;stroke:color-mix(in srgb,currentColor 45%,#fff);stroke-width:1;opacity:.35}

.study-background[data-proposal=satin]{background:linear-gradient(130deg,color-mix(in srgb,currentColor 22%,transparent),transparent 70%)}
.study-background[data-proposal=original]{background:transparent}.study-background[data-proposal=original] [data-ui-card-background]{--ui-bg-1:currentColor!important;--ui-bg-2:currentColor!important;--ui-bg-3:currentColor!important}
.study-background[data-proposal=curtains]>i,.study-background[data-proposal=curtains]>b{position:absolute;inset:-35% -20%;border-radius:35%;background:repeating-conic-gradient(from 18deg at 50% 110%,transparent 0deg 12deg,currentColor 16deg,transparent 23deg 40deg);filter:blur(12px);opacity:.48}
.study-background[data-proposal=curtains]>b{background:repeating-conic-gradient(from -12deg at 50% 100%,transparent 0deg 18deg,currentColor 23deg,transparent 31deg 48deg);opacity:.24}
.study-background[data-proposal=curtains]>em{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 15%,currentColor,transparent 75%);opacity:.2}
.study-background[data-proposal=horizon]>i,.study-background[data-proposal=horizon]>b{position:absolute;inset:-10% -30% -75%;border-radius:50%;background:radial-gradient(ellipse,transparent 36%,currentColor 44%,transparent 57%);filter:blur(10px);opacity:.58}
.study-background[data-proposal=horizon]>b{inset:-25% -40% -90%;opacity:.28;transform:rotate(8deg)}
.study-background[data-proposal=horizon]>em{position:absolute;inset:0;background:linear-gradient(0deg,currentColor,transparent 85%);opacity:.18}
.study-background[data-proposal=veil]>i,.study-background[data-proposal=veil]>b,.study-background[data-proposal=veil]>em{position:absolute;inset:-30%;border-radius:45%;filter:blur(24px);background:conic-gradient(from 65deg at 50% 90%,transparent,currentColor 35deg,transparent 110deg);opacity:.5}
.study-background[data-proposal=veil]>b{background:conic-gradient(from 215deg at 65% 15%,transparent,currentColor 50deg,transparent 140deg);opacity:.35}.study-background[data-proposal=veil]>em{background:radial-gradient(ellipse at 45% 70%,currentColor,transparent 65%);opacity:.22}
.study-background[data-proposal=ribbons]>i,.study-background[data-proposal=ribbons]>b{position:absolute;width:160%;height:85%;left:-30%;top:-15%;border-radius:50%;transform:rotate(-18deg);background:linear-gradient(180deg,currentColor,transparent 75%);border-top:1px solid color-mix(in srgb,currentColor 55%,#fff);filter:blur(7px);opacity:.45}
.study-background[data-proposal=ribbons]>b{top:48%;transform:rotate(15deg);opacity:.32}
.study-background[data-proposal=ribbons]>em{position:absolute;inset:0;background:radial-gradient(ellipse at 85% 25%,currentColor,transparent 70%);opacity:.18}
:host([data-feed=hidden]) .camera-body,:host([data-feed=hidden]) .camera-empty,:host([data-feed=hidden]) .camera-security-tabs,:host([data-feed=hidden]) .camera-navigation{display:none!important}:host([data-feed=hidden]) .camera-security-header{padding-bottom:0;min-height:140px}
.study-background[data-animated=true][data-proposal=satin]>svg{animation:full-drift 32s ease-in-out infinite alternate}.study-background[data-animated=true][data-proposal=satin] .seam{animation:satin-light 28s ease-in-out infinite alternate}
.study-background[data-animated=true][data-proposal=curtains]>i{animation:aurora-sway 32s ease-in-out infinite alternate}.study-background[data-animated=true][data-proposal=curtains]>b{animation:aurora-sway 40s ease-in-out infinite alternate-reverse}
.study-background[data-animated=true][data-proposal=horizon]>i{animation:aurora-rise 36s ease-in-out infinite alternate}.study-background[data-animated=true][data-proposal=horizon]>b{animation:aurora-rise 44s ease-in-out infinite alternate-reverse}
.study-background[data-animated=true][data-proposal=veil]>i{animation:aurora-mist 38s ease-in-out infinite alternate}.study-background[data-animated=true][data-proposal=veil]>b{animation:aurora-mist 46s ease-in-out infinite alternate-reverse}
.study-background[data-animated=true][data-proposal=ribbons]>i{animation:aurora-ribbon 34s ease-in-out infinite alternate}.study-background[data-animated=true][data-proposal=ribbons]>b{animation:aurora-ribbon-back 42s ease-in-out infinite alternate-reverse}
@keyframes full-drift{from{transform:translate(-2px,-2px) scale(1.01)}to{transform:translate(3px,3px) scale(1.025)}}@keyframes satin-light{from{opacity:.25}to{opacity:.42}}
@keyframes aurora-sway{to{transform:translate(4%,2%) skewX(5deg)}}@keyframes aurora-rise{to{transform:translateY(-4%) scale(1.04,.97)}}@keyframes aurora-mist{to{transform:translate(3%,2%) rotate(4deg) scale(1.04)}}@keyframes aurora-ribbon{to{transform:translate(2%,3%) rotate(-14deg) scaleY(.94)}}@keyframes aurora-ribbon-back{to{transform:translate(-2%,-3%) rotate(11deg) scaleY(1.04)}}

.study-background[data-proposal=fan] .fan-panels{transform-origin:250px 340px}.study-background[data-proposal=fan] .fan-panels path{stroke:currentColor;stroke-width:.6}
.study-background[data-proposal=isometric] .block-light{position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 25%,currentColor 50%,transparent 75%);opacity:.14;filter:blur(14px)}
.study-background[data-proposal=trails] .trail-base,.study-background[data-proposal=trails] .trail-stream{fill:none;stroke:currentColor;stroke-linecap:round}.study-background[data-proposal=trails] .trail-base{stroke-width:1;opacity:.16}.study-background[data-proposal=trails] .trail-stream{stroke-width:3;opacity:.38;stroke-dasharray:45 750}
.study-background[data-proposal=lenses]>i,.study-background[data-proposal=lenses]>b,.study-background[data-proposal=lenses]>em{position:absolute;width:120%;height:150%;border-radius:50%;background:radial-gradient(ellipse,transparent 20%,currentColor 55%,transparent 69%);filter:blur(5px);opacity:.3}
.study-background[data-proposal=lenses]>i{left:-50%;top:-70%;transform:rotate(-25deg)}.study-background[data-proposal=lenses]>b{left:25%;top:-5%;transform:rotate(25deg);opacity:.35}.study-background[data-proposal=lenses]>em{left:-10%;top:20%;opacity:.18}
.study-background[data-proposal=honeycomb] .hex-cell{stroke:color-mix(in srgb,currentColor 65%,#fff);stroke-width:.7}
.study-background[data-animated=true][data-proposal=fan] .fan-panels{animation:fan-rock 40s ease-in-out infinite alternate}
.study-background[data-animated=true] .block-light{animation:block-sweep 42s ease-in-out infinite alternate}
.study-background[data-animated=true] .trail-stream path{animation:comet-flow 54s linear infinite}
.study-background[data-animated=true][data-proposal=lenses]>i{animation:lens-stretch 36s ease-in-out infinite alternate}.study-background[data-animated=true][data-proposal=lenses]>b{animation:lens-stretch 44s ease-in-out infinite alternate-reverse}.study-background[data-animated=true][data-proposal=lenses]>em{animation:lens-stretch 48s ease-in-out infinite alternate}
.study-background[data-animated=true] .hex-cell{animation:hex-light 35s ease-in-out infinite alternate}
@keyframes fan-rock{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}@keyframes block-sweep{from{transform:translateX(-15%)}to{transform:translateX(15%)}}@keyframes comet-flow{to{stroke-dashoffset:-795}}@keyframes lens-stretch{to{transform:translate(3%,2%) rotate(5deg) scale(1.04,.95)}}@keyframes hex-light{from{fill-opacity:.65}to{fill-opacity:1}}

.study-background[data-animated=false] *{animation:none!important}:host([data-motion-paused]) .study-background *{animation-play-state:paused!important}@media(prefers-reduced-motion:reduce){.study-background *{animation:none!important}}
`;
class ExampleFeed extends HTMLElement{set hass(value){if(!this.firstChild){this.innerHTML=scene(false);this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}}}
customElements.define('background-example-feed',ExampleFeed);
window.loadCardHelpers=async()=>({createCardElement:()=>document.createElement('background-example-feed')});
class BackgroundExample extends customElements.get('eleven-camera-card'){
 _renderSecurity(){
  super._renderSecurity();if(!this.proposal)return;
  if(!this.shadowRoot.querySelector('[data-background-study]')){const style=document.createElement('style');style.dataset.backgroundStudy='';style.textContent=uiCardBackgroundStyles()+styles;this.dataset.feed='hidden';this.shadowRoot.append(style);}
  let layer=this.shadowRoot.querySelector('.study-background');
  if(!layer){layer=document.createElement('div');layer.className='study-background';layer.ariaHidden='true';layer.dataset.proposal=this.proposal.id;layer.innerHTML=geometry[this.proposal.id];this.shadowRoot.querySelector('ha-card').prepend(layer);}
  const settings=this.settings;layer.dataset.coverage=settings.coverage;layer.dataset.animated=String(settings.animated);
  if(this.proposal.id==='original'){
   const key=String(settings.animated);if(layer.dataset.originalKey!==key){layer.innerHTML=uiCardBackground({variant:'aurora',colorMode:'dynamic',transparency:0,coverage:'card',animated:settings.animated},{statusColor:'#ffffff'});layer.dataset.originalKey=key;}
  }
  layer.style.setProperty('--study-color',this.cardBackgroundStatusColor());layer.style.setProperty('--study-opacity',(100-settings.transparency)/100);layer.style.setProperty('--study-height',settings.height+'px');
 }
}
customElements.define('security-background-example',BackgroundExample);
const samples=proposals.map(proposal=>{
 if(proposal.id==='fan'){const heading=document.createElement('h2');heading.id='new-alternatives';heading.style.gridColumn='1 / -1';heading.textContent='Vijf nieuwe alternatieven';document.querySelector('#examples').append(heading);}
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
