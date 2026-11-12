import '../dist/eleven-media-player-card.js';
import {MEDIA_LAYOUTS,MEDIA_FEATURES} from '../src/media-utils.js';
// Only the fixture supplies icons/forms; real Home Assistant supplies its own elements.
if(!customElements.get('ha-icon'))customElements.define('ha-icon',class extends HTMLElement{
 static get observedAttributes(){return ['icon'];}connectedCallback(){this.draw();}attributeChangedCallback(){this.draw();}
 draw(){const icon=this.getAttribute('icon')?.split(':')[1],shapes={play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M7 5h4v14H7zm6 0h4v14h-4z"/>',stop:'<path d="M6 6h12v12H6z"/>','skip-next':'<path d="m5 5 10 7-10 7zm11 0h3v14h-3z"/>','skip-previous':'<path d="m19 5-10 7 10 7zM5 5h3v14H5z"/>',power:'<path d="M11 2h2v11h-2zM7 4l1 2a7 7 0 1 0 8 0l1-2a9 9 0 1 1-10 0z"/>','volume-high':'<path d="m3 9 4 0 5-5v16l-5-5H3zm12-2a7 7 0 0 1 0 10l-1-2a4 4 0 0 0 0-6zm3-3a11 11 0 0 1 0 16l-1-2a8 8 0 0 0 0-12z"/>','volume-off':'<path d="M3 9h4l5-5v16l-5-5H3zm12-1 6 6-1 2-6-6zm5 0 1 2-6 6-1-2z"/>',music:'<path d="M10 3h9v12a4 4 0 1 1-2-3V7h-5v11a4 4 0 1 1-2-3z"/>'};this.innerHTML='<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">'+(shapes[icon]??shapes.music)+'</svg>';this.style.cssText='display:inline-flex;align-items:center;justify-content:center;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);flex:none';}
});
if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{});
const names=['Klassiek','Poster','Horizontaal','Studio','Minimaal'],descriptions=['Vierkante albumhoes naast titel en artiest. De bediening staat eronder.','Een brede albumhoes met de titel in het beeld. Bediening op een rustig vlak.','Kleine hoes, titel en bediening naast elkaar. Past in een smaller dashboardvak.','Een vierkante albumhoes met afgeronde hoeken en inset-schaduw, met titel en artiest. Afzonderlijke knoppen en een volumebalk.','Titel, artiest en bediening als uitgangspunt. Geen albumhoes.'];
const cards=[],calls=[];let states={},mode='music',connected=true,cover='light';
const services={media_player:Object.fromEntries(Object.keys(MEDIA_FEATURES).map(name=>[name,{}]))};
const allFeatures=Object.values(MEDIA_FEATURES).reduce((value,bit)=>value|bit,0);
function reset(){connected=mode!=='offline';states=Object.fromEntries(MEDIA_LAYOUTS.map(layout=>['media_player.demo_'+layout,{state:['idle','off','unavailable'].includes(mode)?mode:'playing',attributes:{friendly_name:'Woonkamer',supported_features:mode==='tv'?MEDIA_FEATURES.turn_on|MEDIA_FEATURES.turn_off|MEDIA_FEATURES.volume_set|MEDIA_FEATURES.volume_mute|MEDIA_FEATURES.select_source:allFeatures,media_title:mode==='tv'?'De wereld van dichtbij':'The Long Way Home',media_artist:mode==='tv'?'Documentaire':'North of Here',media_album_name:mode==='music'||mode==='offline'?'Quiet Horizons':'',entity_picture:'/cards/media-player-card/qa/'+(cover==='light'?'cover-light.svg':'cover.svg'),media_duration:['tv','idle','off'].includes(mode)?undefined:248,media_position:81,media_position_updated_at:new Date().toISOString(),volume_level:.38,is_volume_muted:false,source:mode==='tv'?'HDMI 1':'Muziek',source_list:mode==='tv'?['HDMI 1','HDMI 2','TV']:['Muziek','Radio','Bluetooth']}}]));update();}
async function callService(domain,service,data,target){
 calls.push({domain,service,data,target});document.querySelector('#last-command').textContent=JSON.stringify(calls.at(-1),null,2);
 const state=states[target.entity_id],attrs=state.attributes;
 if(service==='media_pause'){attrs.media_position+=Math.max(0,(Date.now()-Date.parse(attrs.media_position_updated_at))/1000);state.state='paused';}
 if(service==='media_play'){state.state='playing';attrs.media_position_updated_at=new Date().toISOString();}
 if(service==='media_stop')state.state='idle';if(service==='turn_off')state.state='off';if(service==='turn_on')state.state='idle';
 if(service==='volume_set')attrs.volume_level=data.volume_level;if(service==='volume_mute')attrs.is_volume_muted=data.is_volume_muted;
 if(service==='select_source')attrs.source=data.source;
 if(service==='media_seek'){attrs.media_position=data.seek_position;attrs.media_position_updated_at=new Date().toISOString();}
 if(service==='media_next_track'||service==='media_previous_track'){attrs.media_title=attrs.media_title==='The Long Way Home'?'A Quiet Morning':'The Long Way Home';attrs.media_position=0;attrs.media_position_updated_at=new Date().toISOString();}
 update();
}
function update(){for(const card of cards)card.hass={connected,locale:{language:'nl'},language:'nl',themes:{darkMode:!document.body.classList.contains('light')},states,services,callService};}
for(const layout of ['studio','horizontal']){
 const index=MEDIA_LAYOUTS.indexOf(layout);
 const article=document.createElement('article'),heading=document.createElement('h2'),description=document.createElement('p'),card=document.createElement('eleven-media-player-card'),details=document.createElement('details');heading.textContent=(index+1)+'. '+names[index];description.textContent=descriptions[index];
 const config={entity:'media_player.demo_'+layout,layout};card.setConfig(config);details.innerHTML='<summary>YAML-configuratie</summary><pre></pre>';details.querySelector('pre').textContent='type: custom:eleven-media-player-card\nentity: media_player.woonkamer\nlayout: '+layout;if(layout==='studio')article.style.order='-1';article.append(heading,description,card,details);document.querySelector('.examples').append(article);cards.push(card);
}
document.querySelector('#theme').onclick=()=>{document.body.classList.toggle('light');update();};document.querySelector('#width').onclick=()=>document.querySelector('.examples').classList.toggle('narrow');document.querySelector('#state').onchange=event=>{mode=event.target.value;reset();};
document.querySelector('#cover').onchange=event=>{cover=event.target.value;for(const state of Object.values(states))state.attributes.entity_picture='/cards/media-player-card/qa/'+(cover==='light'?'cover-light.svg':'cover.svg');update();};
reset();window.mediaQA={cards,calls,get states(){return states;},get mode(){return mode;},setMode(value){mode=value;document.querySelector('#state').value=value;reset();},update,reset};
