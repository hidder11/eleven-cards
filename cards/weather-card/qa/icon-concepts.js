import {iconIdea,iconIdeaStyles} from './icon-art.js';
const conditions={sunny:['sun','Zonnig',23],partlycloudy:['partly','Halfbewolkt',19],rainy:['rain','Regen',14],'clear-night':['night','Heldere nacht',11],'lightning-rainy':['storm','Onweer',16]};
const style=document.createElement('style');style.textContent=iconIdeaStyles;document.head.append(style);
class WeatherIconStudy extends customElements.get('eleven-weather-card'){
 _render(){
  super._render();if(!this._config||!this._hass)return;if(['glass','neon'].includes(this._config.icon_style))return;
  const kind=conditions[this._hass.states?.[this._config.entity]?.state]?.[0]??'sun';
  if(!this.shadowRoot.querySelector('.idea-style')){const style=document.createElement('style');style.className='idea-style';style.textContent=iconIdeaStyles+'.hero{min-height:210px}.art{inset:40px 0 0}.art .idea-icon{height:168px;width:210px}.status-icon .idea-icon{height:30px;width:32px}@container(max-width:320px){.art .idea-icon{height:150px;width:180px}}';this.shadowRoot.append(style);}
  for(const node of this.shadowRoot.querySelectorAll('.art,.status-icon'))node.innerHTML=iconIdea(kind,this._config.icon_study);
 }
}
customElements.define('eleven-weather-icon-study',WeatherIconStudy);
const ideas=[['glass','Liquid glass','Gelaagd glas, zachte schaduwen en een bewegende glinstering. Het meest verwant aan de huidige kaart, met meer diepte.'],['plasma','Plasma','Een lichtgevende kern met draaiende banen en een pulserende halo. De meest uitgesproken, energieke variant.'],['neon','Neon','Heldere contouren met een lichtfront dat langs de vorm beweegt. Grafisch, scherp en opvallend op een donkere kaart.'],['globe','Weather globe','Een miniatuurweerbeeld in een glazen bol, met zwevende wolken, regen en een reflectie op de buitenkant.']];
const cards=ideas.map(([icon_study,title,description],i)=>{
 const article=document.createElement('article');article.innerHTML=`<div class="caption"><span class="number">0${i+1}</span><h2>${title}</h2></div>`;const card=document.createElement('eleven-weather-icon-study');article.append(card);const p=document.createElement('p');p.className='description';p.textContent=description;article.append(p);const samples=document.createElement('div');samples.className='samples';samples.innerHTML=Object.entries(conditions).map(([, [kind,label]])=>`<div class="sample" role="img" aria-label="${label}">${iconIdea(kind,icon_study)}<span>${label}</span></div>`).join('');article.append(samples);document.querySelector('.cards').append(article);
 return {card,config:{entity:'weather.example',title:'Het weer',tabs:[],icon_study,icon_style:['glass','neon'].includes(icon_study)?icon_study:'classic'}};
});
let moving=true,dark=true;
function update(){const condition=document.querySelector('#condition').value,background=document.querySelector('#background').value,temperature=conditions[condition][2];for(const {card,config} of cards){card.hass={language:'nl',locale:{language:'nl'},themes:{darkMode:dark},connected:true,states:{'weather.example':{state:condition,attributes:{temperature,temperature_unit:'°C',apparent_temperature:temperature-1,wind_speed:14,wind_speed_unit:'km/h',humidity:58}}}};card.setConfig({...config,background,animate_background:moving,animate_icons:moving});}}
for(const select of document.querySelectorAll('select'))select.addEventListener('change',update);
document.querySelector('#motion').addEventListener('click',event=>{moving=!moving;document.body.dataset.moving=String(moving);event.currentTarget.setAttribute('aria-pressed',String(moving));event.currentTarget.textContent=moving?'Animatie pauzeren':'Animatie afspelen';update();});
document.querySelector('#theme').addEventListener('click',event=>{dark=!dark;document.body.classList.toggle('light',!dark);event.currentTarget.setAttribute('aria-pressed',String(!dark));update();});
window.weatherIconStudies=cards;update();
