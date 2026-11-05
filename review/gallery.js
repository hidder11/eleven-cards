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

const approved=new Set(['appliance-planner','shopping-card','scene-engine-card','history-graph-card','bar-chart','dynamic-energy-price-card','timeline-card','heatmap-card','overview-card','calendar-card','weather-card','actions-card','car-card','car-evcc','energy-flow-card','room-card','waste-card']);
const main=document.querySelector('main');main.classList.add('review-groups');
const groups={};
for(const [key,title,description] of [['approved','Goedgekeurd','Deze kaarten zijn afzonderlijk door jou beoordeeld en goedgekeurd.'],['pending','Nog te beoordelen','Deze voorbeelden zijn nog niet afzonderlijk goedgekeurd. We pakken ze één voor één op.']]){const section=document.createElement('section');section.className='review-section';section.id=key;const heading=document.createElement('h2');heading.textContent=title;const intro=document.createElement('p');intro.textContent=description;const grid=document.createElement('div');grid.className='review-grid';section.append(heading,intro,grid);main.append(section);const navGroup=document.createElement('div');navGroup.className='review-nav-group';const label=document.createElement('span');label.textContent=title;navGroup.append(label);document.querySelector('nav').append(navGroup);groups[key]={grid,navGroup,heading,count:0};}
for(const [i,r] of records.entries()){const article=r.card.parentElement;article.id='card-'+r.name;const group=groups[approved.has(r.name)?'approved':'pending'];group.grid.append(article);group.count++;article.dataset.reviewStatus=approved.has(r.name)?'approved':'pending';const a=document.createElement('a');a.href='#'+article.id;a.textContent=configs[i][1];group.navGroup.append(a);}
for(const group of Object.values(groups))group.heading.textContent+=' · '+group.count;
window.themeFixtureReady=true;
// New appearance is a separate, unapproved preview; retain the approved card here.
const controlPadArticle=records.find(r=>r.name==='actions-card').card.parentElement;
const proposalLink=document.createElement('a');proposalLink.className='card-detail-link';proposalLink.href='control-pad.html';proposalLink.textContent='Nieuw uiterlijkvoorstel bekijken →';controlPadArticle.append(proposalLink);
