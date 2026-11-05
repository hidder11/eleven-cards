import {applyReviewTheme,readReviewPreferences,saveReviewPreferences} from './theme.js';
let {dark,paint}=readReviewPreferences();
function applyTheme(dark){applyReviewTheme(dark,paint);document.querySelector('#paint').value=paint;document.querySelector('#mode').textContent=dark?'Licht thema':'Donker thema';document.querySelector('#mode').setAttribute('aria-pressed',String(dark));for(const r of window.records||[]){r.hass={...r.hass,themes:{...r.hass.themes,darkMode:dark}};r.card.hass=r.hass;}window.reviewDark=dark;}
applyTheme(dark);document.querySelector('#mode').addEventListener('click',()=>{dark=!window.reviewDark;saveReviewPreferences({dark,paint});applyTheme(dark);});
document.querySelector('#paint').addEventListener('change',e=>{paint=e.target.value;saveReviewPreferences({dark,paint});applyTheme(dark);});

import {configs,createFixture,cardType} from './fixtures.js';
window.records=[];
for(const [name,title,config,chart] of configs){
 const article=document.createElement('article'),heading=document.createElement('h2'),card=document.createElement(cardType(name).slice(7));
 heading.textContent=title;card.dataset.card=name;if(chart)card.dataset.chart='true';article.append(heading,card);document.querySelector('main').append(article);
 card.setConfig({type:cardType(name),title,...config});const hass=createFixture(name);card.hass={...hass,themes:{...hass.themes,darkMode:dark}};records.push({name,card,hass:card._hass||card.hass});
 const link=document.createElement('a');link.className='card-detail-link';link.href='detail.html?card='+encodeURIComponent(name);link.textContent='Configuraties bekijken →';link.setAttribute('aria-label','Configuraties van '+title);article.append(link);
}

for(const [i,r] of records.entries()){
 const article=r.card.parentElement;article.id='card-'+r.name;
 const a=document.createElement('a');a.href='#'+article.id;a.textContent=configs[i][1];document.querySelector('nav').append(a);
}
window.themeFixtureReady=true;
