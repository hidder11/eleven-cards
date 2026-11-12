import {withCardBackground} from '../../../shared/card-background.js';
import {uiSlider,syncUISlider} from '../../../shared/ui-bar.js';
import {uiButton,uiButtonStyles} from '../../../shared/ui-button.js';
import {headerAtmosphere,observeCardMotion} from '../../../shared/header-atmosphere.js';
import {mediaStyles} from './media-styles.js';
import {MediaPlayerEditor} from './media-editor.js';
import {normalizeMediaConfig,mediaDutch,mediaAvailability,mediaCan,mediaPosition,mediaTime,mediaNumber,mediaArtwork,mediaRequest} from './media-utils.js';

class MediaPlayerCardBase extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._version=0;}
 static getStubConfig(hass){return {entity:Object.keys(hass?.states??{}).find(id=>id.startsWith('media_player.'))??'',layout:'studio',radio_mode:true};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers(),card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-media-player-editor'))customElements.define('eleven-media-player-editor',MediaPlayerEditor);
  return document.createElement('eleven-media-player-editor');
 }
 setConfig(input){const next=normalizeMediaConfig(input);this._config=next;this._version++;this._busy=false;this._error='';this._render();}
 set hass(value){this._hass=value;this._render();}get hass(){return this._hass;}
 getCardSize(){const content=this.shadowRoot?.querySelector('.player');if(this.isConnected&&content?.getBoundingClientRect().width>0)return Math.max(1,Math.ceil(content.scrollHeight/50));const config=this._config??{},state=this._hass?.states?.[config.entity],hasMedia=!this._hass||(!mediaAvailability(this._hass,config.entity)&&['playing','paused','buffering'].includes(state?.state));const artwork=config.show_artwork!==false&&config.layout!=='minimal'&&hasMedia&&!this._imageFailed&&(!this._hass||!!mediaArtwork(this._hass,state));let rows=artwork?(config.layout==='studio'?(config.compact?5:6):config.layout==='horizontal'?3:5):3;if(config.radio_mode&&config.stations?.length)rows+=Math.ceil(config.stations.length/3);return rows;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 connectedCallback(){this._attached=true;this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>this._syncClock());this._render();}
 disconnectedCallback(){this._attached=false;this._version++;this._busy=false;clearInterval(this._clock);this._clock=null;this._motionCleanup?.();this._motionCleanup=null;}
 _shell(){
  if(this._shellReady)return;this._shellReady=true;
  const button=(service,icon,primary=false)=>uiButton({variant:'surface',className:primary?'primary':'',content:`<ha-icon icon="mdi:${icon}" aria-hidden="true"></ha-icon>`,attrs:{'data-service':service}});
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${mediaStyles}</style><ha-card><div class="content player"><div class="header-region"><div class="header-background" aria-hidden="true"></div><div class="header-scene"><header class="device"><h2 class="device-heading"><button class="device-name" type="button" data-details></button></h2></header><p class="notice" role="status" hidden></p><div class="stage"><div class="artwork"><ha-icon icon="mdi:music" aria-hidden="true"></ha-icon><img alt="" hidden></div><div class="metadata"><h3 class="track"></h3><p class="artist"></p><p class="album"></p></div></div><div class="transport">${button('media_previous_track','skip-previous')}${button('playback','play',true)}${button('volume_mute','volume-high')}${button('power','power')}${button('media_next_track','skip-next')}${button('media_stop','stop')}</div></div></div><div class="progress"><div class="progress-heading"><label for="media-progress"></label></div><div class="range-reading"><output for="media-progress"><span data-position></span> / <span data-duration></span></output>${uiSlider({attrs:{id:'media-progress','data-seek':''}})}</div></div><div class="footer"><div class="volume"><div class="volume-heading"><label for="media-volume"></label></div><div class="range-reading"><output data-volume-value for="media-volume"><span data-volume-number></span> <span class="range-unit">%</span></output>${uiSlider({attrs:{id:'media-volume','data-volume':''}})}</div></div><section class="stations"><h3></h3><div class="station-options"></div><p class="station-help"></p></section><label class="source"><span></span><select data-source></select></label></div><p class="error" role="status" hidden></p></div></ha-card>`;
  this.shadowRoot.addEventListener('click',event=>{if(event.target.closest?.('[data-details]')){if(this._config.entity)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:this._config.entity},bubbles:true,composed:true}));return;}const station=event.target.closest?.('[data-station]');if(station&&!station.disabled){const row=this._config.stations[Number(station.dataset.station)];if(row)this._command('play_media',row);return;}const button=event.target.closest?.('[data-service]');if(!button||button.disabled)return;let service=button.dataset.service,value;const state=this._hass?.states?.[this._config.entity];if(service==='playback')service=this._playbackService(state);if(service==='play_media')value=this._config.stations.find(row=>row.media_content_id.trim()===state?.attributes?.media_content_id);if(service==='power')service=state?.state==='off'?'turn_on':'turn_off';if(service==='volume_mute')value=!state?.attributes?.is_volume_muted;this._command(service,value);});
  this.shadowRoot.addEventListener('input',event=>{if(event.target.matches('input[type=range]'))this._updateRange(event.target);if(event.target.matches('[data-volume]'))this._renderVolumeValue(event.target.value);if(event.target.matches('[data-seek]'))this.shadowRoot.querySelector('[data-position]').textContent=mediaTime(Number(event.target.value));});
  this.shadowRoot.addEventListener('change',event=>{const input=event.target;if(input.matches('[data-volume]'))this._command('volume_set',Number(input.value)/100);if(input.matches('[data-seek]'))this._command('media_seek',Number(input.value));if(input.matches('[data-source]'))this._command('select_source',input.value);});
  this.shadowRoot.addEventListener('focusout',()=>queueMicrotask(()=>this._render()));
  const image=this.shadowRoot.querySelector('img');image.addEventListener('error',()=>{this._imageFailed=true;image.hidden=true;this._render();});image.addEventListener('load',()=>{this._imageFailed=false;image.hidden=false;this._render();});
 }
 _renderVolumeValue(value){const root=this.shadowRoot;root.querySelector('[data-volume-number]').textContent=value===null?'—':String(value);root.querySelector('.range-unit').hidden=value===null;}
 _updateRange(input){syncUISlider(input);}
 _playbackService(state){if(state?.state==='playing')return mediaCan(this._hass,this._config.entity,'media_pause')?'media_pause':'media_stop';if(this._config.radio_mode&&this._config.stations.some(row=>row.media_content_id.trim()&&row.media_content_id.trim()===state?.attributes?.media_content_id)&&mediaCan(this._hass,this._config.entity,'play_media')&&(state?.state==='idle'||!mediaCan(this._hass,this._config.entity,'media_play')))return 'play_media';return 'media_play';}
 _t(nl,en){return mediaDutch(this._hass)?nl:en;}
 _render(){
  if(!this._config)return;this._shell();
  const root=this.shadowRoot,config=this._config,state=this._hass?.states?.[config.entity],attrs=state?.attributes??{},unavailable=mediaAvailability(this._hass,config.entity),t=(a,b)=>this._t(a,b),active=!unavailable&&state?.state!=='off';
  const player=root.querySelector('.player');player.dataset.layout=config.layout;player.dataset.background=config.background;player.dataset.animated=String(config.animate_background&&!unavailable);player.style.setProperty('--header-background-opacity',String(config.background_strength/100));const backdrop=root.querySelector('.header-background');if(this._background!==config.background){this._background=config.background;backdrop.innerHTML=headerAtmosphere(config.background);}player.dataset.compact=String(config.compact);player.dataset.artwork=String(config.show_artwork&&config.layout!=='minimal');
  root.querySelector('.artwork>ha-icon').setAttribute('icon',config.radio_mode?'mdi:radio':'mdi:music');
  const name=config.title||attrs.friendly_name||t('Mediaspeler','Media player');root.querySelector('.device-name').textContent=name;root.querySelector('.device-name').disabled=!config.entity;root.querySelector('ha-card').setAttribute('aria-label',name);
  const notice=root.querySelector('.notice');notice.hidden=!unavailable;notice.textContent=({setup:t('Kies een mediaspeler in de kaartconfiguratie.','Choose a media player in the card configuration.'),missing:t('Mediaspeler niet gevonden. Controleer de entiteit.','Media player not found. Check the entity.'),offline:t('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'),unavailable:t('Mediaspeler niet beschikbaar.','Media player unavailable.'),unknown:t('Status van de mediaspeler onbekend.','Media player state unknown.')})[unavailable]??'';
  const hasMedia=active&&['playing','paused','buffering'].includes(state?.state),currentStation=config.stations.find(row=>row.media_content_id.trim()===attrs.media_content_id);player.dataset.empty=String(!hasMedia);
  root.querySelector('.track').textContent=active?(hasMedia?(config.radio_mode?(attrs.media_channel||currentStation?.name||attrs.media_title||t('Radio','Radio')):(attrs.media_title||t('Niets aan het afspelen','Nothing playing'))):(config.radio_mode?t('Kies een zender','Choose a station'):t('Niets aan het afspelen','Nothing playing'))):state?.state==='off'?t('Mediaspeler staat uit','Media player is off'):t('Geen media beschikbaar','No media available');
  for(const [selector,value] of [['.artist',config.radio_mode?attrs.media_title:attrs.media_artist||attrs.media_series_title||attrs.app_name],['.album',config.radio_mode?'':attrs.media_album_name]]){const node=root.querySelector(selector);node.textContent=hasMedia&&typeof value==='string'&&value!==root.querySelector('.track').textContent?value:'';node.hidden=!node.textContent;}
  const image=root.querySelector('img'),url=hasMedia&&config.show_artwork&&config.layout!=='minimal'?mediaArtwork(this._hass,state):'';
  if(this._artworkUrl!==url){this._artworkUrl=url;this._imageFailed=false;image.hidden=true;if(url)image.src=url;else image.removeAttribute('src');}
  player.dataset.imageMissing=String(!url||!!this._imageFailed);
  const names={media_previous_track:t('Vorig nummer','Previous track'),media_next_track:t('Volgend nummer','Next track'),media_stop:t('Stoppen','Stop'),media_play:t('Afspelen','Play'),play_media:t('Afspelen','Play'),media_pause:t('Pauzeren','Pause'),turn_on:t('Inschakelen','Turn on'),turn_off:t('Uitschakelen','Turn off'),volume_mute:attrs.is_volume_muted?t('Geluid aan','Unmute'):t('Dempen','Mute')};
  for(const button of root.querySelectorAll('[data-service]')){const kind=button.dataset.service,service=kind==='playback'?this._playbackService(state):kind==='power'?(state?.state==='off'?'turn_on':'turn_off'):kind;button.hidden=!mediaCan(this._hass,config.entity,service)||(config.radio_mode&&['media_previous_track','media_next_track'].includes(kind))||(kind==='power'&&!config.show_power)||(kind==='volume_mute'&&(!config.show_volume||typeof attrs.is_volume_muted!=='boolean'));button.disabled=!!this._busy;button.setAttribute('aria-label',names[service]);if(kind==='playback')button.querySelector('ha-icon').setAttribute('icon',service==='media_stop'?'mdi:stop':state?.state==='playing'?'mdi:pause':'mdi:play');if(kind==='volume_mute'){button.setAttribute('aria-pressed',String(!!attrs.is_volume_muted));button.querySelector('ha-icon').setAttribute('icon',attrs.is_volume_muted?'mdi:volume-off':'mdi:volume-high');}}
  if(config.radio_mode&&!root.querySelector('[data-service=playback]').hidden)root.querySelector('[data-service=media_stop]').hidden=true;
  root.querySelector('.transport').hidden=![...root.querySelectorAll('.transport button')].some(button=>!button.hidden);
  root.querySelector('.volume-heading label').textContent=t('Volume','Volume');root.querySelector('.progress-heading label').textContent=t('Voortgang','Progress');
  const volume=root.querySelector('[data-volume]'),level=mediaNumber(attrs.volume_level),volumeSupported=config.show_volume&&mediaCan(this._hass,config.entity,'volume_set');volume.hidden=!volumeSupported;volume.disabled=!!this._busy||level===null;volume.setAttribute('aria-label',t('Volume','Volume'));
  if(root.activeElement!==volume){volume.value=level===null?'0':String(Math.round(Math.max(0,Math.min(1,level))*100));this._renderVolumeValue(level===null?null:volume.value);}this._updateRange(volume);root.querySelector('[data-volume-value]').hidden=!volumeSupported;
  root.querySelector('.volume').hidden=!volumeSupported;
  const select=root.querySelector('[data-source]'),sources=Array.isArray(attrs.source_list)?attrs.source_list.filter(value=>typeof value==='string'):[];root.querySelector('.source').hidden=!config.show_source||!mediaCan(this._hass,config.entity,'select_source')||!sources.length;
  root.querySelector('.source>span').textContent=t('Bron','Source');select.setAttribute('aria-label',t('Bron','Source'));select.disabled=!!this._busy;
  if(root.activeElement!==select){const list=[...new Set(sources)],key=JSON.stringify([list,attrs.source,t('Kies een bron','Choose source')]);if(key!==this._sourceKey){this._sourceKey=key;select.replaceChildren();if(!list.includes(attrs.source)){const option=document.createElement('option');option.value='';option.textContent=t('Kies een bron','Choose source');option.disabled=true;select.append(option);}for(const value of list){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);}select.value=list.includes(attrs.source)?attrs.source:'';}}
  this._renderStations();root.querySelector('.footer').hidden=root.querySelector('.volume').hidden&&root.querySelector('.source').hidden&&root.querySelector('.stations').hidden;
  const error=root.querySelector('.error');error.hidden=!this._error;error.textContent=this._error??'';
  this._renderProgress();this._syncClock();
 }
 _renderStations(){
  const root=this.shadowRoot,config=this._config,section=root.querySelector('.stations'),container=root.querySelector('.station-options'),state=this._hass?.states?.[config.entity];section.hidden=!config.radio_mode;
  section.querySelector('h3').textContent=this._t('Zenders','Stations');
  const key=JSON.stringify(config.stations);if(key!==this._stationKey){this._stationKey=key;container.replaceChildren();config.stations.forEach((station,index)=>{const button=document.createElement('button');button.type='button';button.dataset.station=String(index);button.setAttribute('data-ui-button','surface');button.textContent=station.name||this._t('Nieuwe zender','New station');container.append(button);});}
  for(const button of container.children){const row=config.stations[Number(button.dataset.station)];button.disabled=!!this._busy||!mediaCan(this._hass,config.entity,'play_media')||!row.media_content_id.trim()||!row.media_content_type.trim();button.setAttribute('aria-pressed',String(!!row.media_content_id.trim()&&row.media_content_id.trim()===state?.attributes?.media_content_id));}
  const help=section.querySelector('.station-help');help.textContent=!config.stations.length?this._t('Voeg favoriete radiozenders toe in de kaartconfiguratie.','Add favourite radio stations in the card configuration.'):!mediaCan(this._hass,config.entity,'play_media')?this._t('Zenders starten is niet beschikbaar op deze mediaspeler.','Starting stations is unavailable on this media player.'):'';help.hidden=!help.textContent;
 }
 _renderProgress(){
  if(!this._config||!this._shellReady)return;
  const root=this.shadowRoot,state=this._hass?.states?.[this._config.entity],{duration,position}=mediaPosition(state),range=root.querySelector('[data-seek]');
  root.querySelector('.progress').hidden=this._config.radio_mode||!this._config.show_progress||!!mediaAvailability(this._hass,this._config.entity)||!['playing','paused','buffering'].includes(state?.state)||duration===null;
  range.disabled=!!this._busy||position===null||!mediaCan(this._hass,this._config.entity,'media_seek');range.setAttribute('aria-label',this._t('Afspeelpositie','Playback position'));range.max=String(duration??100);
  if(root.activeElement!==range){range.value=String(position??0);root.querySelector('[data-position]').textContent=mediaTime(position);}
  this._updateRange(range);root.querySelector('[data-duration]').textContent=mediaTime(duration);if(position===null){range.removeAttribute('aria-valuenow');range.setAttribute('aria-valuetext',this._t('Afspeelpositie onbekend','Playback position unknown'));}else range.setAttribute('aria-valuetext',mediaTime(Number(range.value))+' / '+mediaTime(duration));
 }
 _syncClock(){
  const shouldRun=this._attached&&this._shellReady&&!this.hasAttribute('data-motion-paused')&&!document.hidden&&!this._config?.radio_mode&&this._config?.show_progress&&!mediaAvailability(this._hass,this._config?.entity)&&this._hass?.states?.[this._config?.entity]?.state==='playing'&&mediaPosition(this._hass.states[this._config.entity]).position!==null;
  if(shouldRun&&!this._clock)this._clock=setInterval(()=>this._renderProgress(),1000);else if(!shouldRun&&this._clock){clearInterval(this._clock);this._clock=null;}
 }
 async _command(service,value){
  if(this._busy||!this._attached)return;
  const version=this._version;this._busy=true;this._error='';this._render();
  try{const request=mediaRequest(this._hass,this._config.entity,service,value);await this._hass.callService(request.domain,request.service,request.data,request.target);}
  catch{if(version===this._version)this._error=this._t('Bediening mislukt. Controleer de verbinding en probeer opnieuw.','Action failed. Check the connection and try again.');}
  finally{if(version===this._version){this._busy=false;this._render();}}
 }
}

export class MediaPlayerCard extends withCardBackground(MediaPlayerCardBase){}
