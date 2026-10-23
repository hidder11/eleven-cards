// Preview-only effects. No changes to production animations or external connections.
const motionStyles=`
.hero{min-height:210px}.art{inset:48px 0 0}.art svg{width:205px;height:158px;filter:drop-shadow(0 12px 22px color-mix(in srgb,var(--tone) 35%,transparent))}.scene-background::after{display:none}.atmosphere{position:absolute;inset:0;overflow:hidden;pointer-events:none}.atmosphere i{position:absolute;display:block}.scene-background{--sky-light:color-mix(in srgb,var(--tone) 42%,transparent)}
/* A slow moving sun with wide luminous shafts. */
[data-study=solar] .scene-background::before{background:radial-gradient(ellipse at 50% 36%,color-mix(in srgb,var(--tone) 55%,transparent),transparent 67%)}
[data-study=solar] .atmosphere::before{content:'';position:absolute;width:155%;aspect-ratio:1;left:-27%;top:-51%;background:repeating-conic-gradient(from 0deg at 50% 50%,transparent 0deg 13deg,var(--sky-light) 15deg 18deg,transparent 23deg 36deg);mask-image:radial-gradient(circle,#0003 8%,#000 20%,transparent 64%);animation:solar-turn 50s linear infinite}
[data-study=solar] .atmosphere::after{content:'';position:absolute;width:200px;height:200px;left:calc(50% - 100px);top:30px;background:radial-gradient(circle,var(--sky-light),transparent 70%);animation:sun-breathe 6s ease-in-out infinite}
/* Rain crosses the entire header; drops on glass have a second, slower rhythm. */
[data-study=rain] .scene-background::before{background:radial-gradient(ellipse at 50% 16%,var(--sky-light),transparent 80%),linear-gradient(150deg,color-mix(in srgb,var(--tone) 18%,transparent),transparent)}
[data-study=rain] .atmosphere i{left:var(--x);top:-30%;width:1px;height:var(--length);background:linear-gradient(transparent,color-mix(in srgb,var(--tone) 75%,#fff));opacity:.55;transform:rotate(18deg);animation:rainfall var(--duration) linear infinite;animation-delay:var(--delay)}
[data-study=rain] .atmosphere i:nth-child(4n){width:4px;height:12px;border-radius:70% 70% 55% 55%;background:linear-gradient(150deg,#ffffff60,#ffffff08);box-shadow:inset 1px 1px 0 #ffffff60;animation:glass-drop 9s ease-in infinite;animation-delay:var(--delay)}
/* Broad translucent ribbons drift independently of the central illustration. */
[data-study=aurora] .scene-background::before{background:radial-gradient(ellipse at 60% 20%,color-mix(in srgb,var(--tone) 32%,transparent),transparent 80%)}
[data-study=aurora] .atmosphere::before,[data-study=aurora] .atmosphere::after{content:'';position:absolute;width:170%;height:72%;left:-35%;top:0;border-radius:50%;background:conic-gradient(from 75deg at 50% 100%,transparent,color-mix(in srgb,var(--tone) 70%,#58ddb6) 10deg,transparent 42deg);filter:blur(13px);animation:aurora-drift 13s ease-in-out infinite alternate;transform:rotate(-18deg)}
[data-study=aurora] .atmosphere::after{top:20%;opacity:.7;animation-delay:-7s;animation-duration:17s;transform:rotate(15deg);background:conic-gradient(from 260deg at 50% 0%,transparent,color-mix(in srgb,var(--tone) 75%,#e1a0d9) 15deg,transparent 55deg)}
[data-study=aurora] .atmosphere i{left:var(--x);top:var(--y);width:2px;height:2px;border-radius:50%;background:var(--tone);box-shadow:0 0 8px var(--tone);animation:star-breathe var(--duration) ease-in-out infinite alternate;animation-delay:var(--delay)}
/* Two banks of clouds move at different depths beneath a soft light source. */
[data-study=clouds] .scene-background::before{background:radial-gradient(ellipse at 65% 20%,var(--sky-light),transparent 76%)}
[data-study=clouds] .atmosphere::before,[data-study=clouds] .atmosphere::after{content:'';position:absolute;left:-30%;top:32%;width:160%;height:75%;background:radial-gradient(ellipse at 18% 53%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 28%),radial-gradient(ellipse at 46% 40%,color-mix(in srgb,var(--tone) 33%,transparent),transparent 38%),radial-gradient(ellipse at 82% 62%,color-mix(in srgb,var(--tone) 44%,transparent),transparent 31%);animation:cloud-sail 18s ease-in-out infinite alternate}
[data-study=clouds] .atmosphere::after{top:12%;opacity:.55;animation-duration:27s;animation-delay:-12s;animation-direction:alternate-reverse}
/* Atmospheric contour lines carry small light fronts through the header. */
[data-study=isobars] .scene-background::before{background:radial-gradient(ellipse at 50% 35%,var(--sky-light),transparent 70%)}
.isobar-map{position:absolute;width:155%;height:135%;left:-28%;top:-10%;fill:none;stroke:var(--tone);stroke-width:.8;opacity:.36}.isobar-map .front{stroke-width:2;stroke-dasharray:38 540;opacity:1;animation:front-flow 9s linear infinite}.isobar-map .front:nth-child(2n){animation-duration:13s;animation-delay:-5s}
@keyframes solar-turn{to{transform:rotate(360deg)}}@keyframes sun-breathe{50%{transform:scale(1.5);opacity:.55}}@keyframes rainfall{from{transform:translateY(-50px) translateX(0) rotate(18deg)}to{transform:translateY(440px) translateX(-110px) rotate(18deg)}}@keyframes glass-drop{0%{transform:translateY(30px);opacity:0}15%,50%{opacity:.65}90%,100%{transform:translateY(370px);opacity:0}}@keyframes aurora-drift{to{transform:translate(9%,20%) rotate(9deg) scale(1.16)}}@keyframes star-breathe{from{opacity:.2}to{opacity:.9;transform:scale(1.4)}}@keyframes cloud-sail{from{transform:translateX(-6%)}to{transform:translateX(12%) translateY(-8%)}}@keyframes front-flow{to{stroke-dashoffset:-578}}
.content[data-animated=false] .atmosphere,.content[data-animated=false] .atmosphere *,.content[data-animated=false] .atmosphere::before,.content[data-animated=false] .atmosphere::after{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.atmosphere,.atmosphere *,.atmosphere::before,.atmosphere::after{animation:none!important}}
@container(max-width:320px){.hero{min-height:190px}.art svg{width:175px;height:145px}}
`;
class WeatherHeaderStudy extends customElements.get('eleven-weather-card'){
 _render(){
  super._render();if(['aurora','clouds','isobars'].includes(this._config?.background))return;const content=this.shadowRoot.querySelector('.content');if(!content)return;
  const study=this._config.study;content.dataset.study=study;
  if(!this.shadowRoot.querySelector('.study-style')){const style=document.createElement('style');style.className='study-style';style.textContent=motionStyles;this.shadowRoot.append(style);}
  if(content.querySelector('.atmosphere'))return;
  const layer=document.createElement('div');layer.className='atmosphere';layer.setAttribute('aria-hidden','true');
  if(study==='rain'||study==='aurora')for(let i=0;i<32;i++){
   const dot=document.createElement('i');dot.style.cssText=`--x:${(i*37)%100}%;--y:${(i*19)%72}%;--length:${22+i%4*12}px;--duration:${study==='rain'?1.1+i%5*.35:2+i%5}s;--delay:${-i*.37}s`;layer.append(dot);
  }
  if(study==='isobars')layer.innerHTML='<svg class="isobar-map" viewBox="0 0 600 340" preserveAspectRatio="none">'+Array.from({length:10},(_,i)=>`<path d="M-40 ${40+i*27}C100 ${-90+i*27} 235 ${270+i*10} 370 ${105+i*15}S580 ${-20+i*28} 650 ${85+i*29}"/>`).join('')+Array.from({length:4},(_,i)=>`<path class="front" d="M-40 ${67+i*54}C100 ${-63+i*54} 235 ${280+i*20} 370 ${120+i*30}S580 ${8+i*56} 650 ${114+i*58}"/>`).join('')+'</svg>';
  content.querySelector('.scene-background').append(layer);
 }
}
customElements.define('eleven-weather-header-study',WeatherHeaderStudy);
const proposals=[['solar','Solar theater','Zonnelicht over de hele header, met langzaam draaiende lichtbanen en een ademende gloed.','sunny',23],['rain','Rain on glass','Fijne regensporen op de achtergrond met tragere druppels op een denkbeeldige glaslaag.','rainy',14],['aurora','Aurora sky','Brede, bewegende lichtsluiers en fonkelende sterren geven de nacht meer diepte.','clear-night',11],['clouds','Cloud layers','Wolkenvelden schuiven op verschillende snelheden achter het grote weericoon langs.','partlycloudy',19],['isobars','Atmospheric flow','Bewegende lichtfronten volgen vloeiende weerlijnen over de hele achtergrond.','windy',17]];
const cards=proposals.map(([study,title,description,state,temperature],i)=>{
 const article=document.createElement('article');article.innerHTML=`<div class="caption"><span class="number">0${i+1}</span><h2>${title}</h2></div>`;const card=document.createElement('eleven-weather-header-study');article.append(card);const p=document.createElement('p');p.className='description';p.textContent=description;article.append(p);document.querySelector('.cards').append(article);
 const config={entity:'weather.example',title:'Het weer',tabs:[],study,background:['aurora','clouds','isobars'].includes(study)?study:'lanes'};return {card,config,state,temperature};
});
let moving=true,dark=true,fields=true;
function update(){
 const choice=document.querySelector('#condition').value;
 for(const {card,config,state,temperature} of cards){card.hass={language:'nl',locale:{language:'nl'},themes:{darkMode:dark},connected:true,states:{'weather.example':{state:choice==='examples'?state:choice,attributes:{temperature,temperature_unit:'°C',apparent_temperature:temperature-1,wind_speed:state==='windy'?32:14,wind_speed_unit:'km/h',humidity:state==='rainy'?86:58}}}};card.setConfig({...config,animate_background:moving,animate_icons:moving,metric_status:fields?'condition':'none',metric_primary:fields?'wind_speed':'none',metric_secondary:fields?'humidity':'none'});}
}
document.querySelector('#condition').addEventListener('change',update);
document.querySelector('#motion').addEventListener('click',event=>{moving=!moving;event.currentTarget.setAttribute('aria-pressed',String(moving));event.currentTarget.textContent=moving?'Animatie pauzeren':'Animatie afspelen';update();});
document.querySelector('#theme').addEventListener('click',event=>{dark=!dark;document.body.classList.toggle('light',!dark);event.currentTarget.setAttribute('aria-pressed',String(!dark));update();});
document.querySelector('#fields').addEventListener('click',event=>{fields=!fields;event.currentTarget.setAttribute('aria-pressed',String(fields));event.currentTarget.textContent=fields?'Gegevensvelden verbergen':'Gegevensvelden tonen';update();});
window.weatherHeaderStudies=cards;update();
