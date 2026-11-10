import {withCardBackground} from '../../../shared/card-background.js';
import {uiEscape,uiButton,uiButtonStyles} from '../../../shared/ui-button.js';
import {uiTabs,uiTabsStyles,bindUITabs} from '../../../shared/ui-tabs.js';
import {headerAtmosphere,observeCardMotion} from '../../../shared/header-atmosphere.js';
import {normalizeCameraConfig,cameraDutch,cameraUnavailable,cameraPictureConfig,visibleCameras,nextCamera,cameraDetections,CameraCycle} from './camera-utils.js';
import {CameraPlayer} from './camera-player.js';
import {cameraStyles} from './camera-styles.js';
import {CameraEditor} from './camera-editor.js';
import {cameraFeaturesView} from './camera-features-view.js';
import {cameraDetectionIndicators} from './camera-security.js';

let cameraCardSequence=0;
class CameraCardBase extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._id='eleven-camera-'+(++cameraCardSequence);this._tiles=new Map();this._detections=new Map();this._cycle=new CameraCycle(()=>this._advanceCycle());this._fullscreenChange=()=>this._updateFullscreen();}
 static getStubConfig(hass){const entity=Object.keys(hass?.states??{}).find(id=>id.startsWith('camera.'));return {cameras:entity?[entity]:[]};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-camera-editor'))customElements.define('eleven-camera-editor',CameraEditor);
  return document.createElement('eleven-camera-editor');
 }
 setConfig(input){const next=normalizeCameraConfig(input),previous=this._config;this._config=next;if(!previous||previous.default_camera!==next.default_camera)this._activeCamera=next.default_camera;this._render();}
 set hass(hass){this._hass=hass;this._render();}get hass(){return this._hass;}
 getCardSize(){const count=this._config?visibleCameras(this._config).length:0,layout=this._config?this._layout():'grid',rows=['grid','wall'].includes(layout)?Math.ceil(count/(this._config?.columns==='auto'?2:this._config?.columns||1)):layout==='sidebar'?Math.max(1,count-1):1;return Math.max(3,1+rows*4);}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 _layout(){return this._config.layout;}
 _advanceCycle(){if(this.shadowRoot.activeElement||this._hovered||this._focused||this.hasAttribute('data-motion-paused')||document.hidden||this.shadowRoot.fullscreenElement){this._syncCycle();return;}this._selectCamera(nextCamera({...this._config,cameras:this._cycleCameras()},this._activeCamera),false);}
 _feedVisible(row){return !['focus','tabs'].includes(this._layout())||row.entity===this._activeCamera;}
 _playbackBlocked(row){return cameraUnavailable(this._hass,row.entity);}
 _syncTile(tile,row,active){tile.player.update(this._hass,cameraPictureConfig(row.entity,this._config),active);}
 _retryTile(entity){this._tiles.get(entity)?.player.retry();this._syncPlayers();}
 connectedCallback(){this._attached=true;this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>this._syncPlayers());document.addEventListener('fullscreenchange',this._fullscreenChange);this._render();}
 disconnectedCallback(){this._attached=false;this._motionCleanup?.();this._motionCleanup=null;this._tabs?.disconnect();this._layoutKey=null;this._cycle.stop();this._hovered=false;this._focused=false;document.removeEventListener('fullscreenchange',this._fullscreenChange);for(const tile of this._tiles.values())tile.player.stop();this._helpers=null;}
 async _createNative(config){
  if(!this._helpers)this._helpers=Promise.resolve().then(()=>{if(typeof window.loadCardHelpers!=='function')throw Error('HA helpers unavailable');return window.loadCardHelpers();}).catch(error=>{this._helpers=null;throw error;});
  const helpers=await this._helpers;return helpers.createCardElement(config);
 }
 _ensureShell(){
  if(this._shell)return;
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${uiTabsStyles()}${cameraStyles}</style><ha-card><div class="content"><div class="header-region"><div class="scene-background" aria-hidden="true"></div><header class="camera-header"><span class="camera-icon" aria-hidden="true"><ha-icon icon="mdi:cctv"></ha-icon></span><div><h2 class="camera-title"></h2><p class="camera-count"></p></div></header></div><p class="camera-empty" role="status"></p><div class="camera-body"></div><div class="camera-navigation">${uiButton({variant:'action-icon',content:'<ha-icon icon="mdi:chevron-left"></ha-icon>',attrs:{'data-camera-prev':true}})}<span class="camera-position" aria-live="polite"></span>${uiButton({variant:'action-icon',content:'<ha-icon icon="mdi:chevron-right"></ha-icon>',attrs:{'data-camera-next':true}})}${uiButton({variant:'action',attrs:{'data-camera-cycle':true}})}</div><p class="camera-action-error" role="status" hidden></p></div></ha-card>`;
  this._shell=true;
  this.shadowRoot.addEventListener('click',event=>{
   const details=event.target.closest?.('[data-camera-details]');
   if(details)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:details.dataset.cameraDetails},bubbles:true,composed:true}));
   const retry=event.target.closest?.('[data-camera-retry]');
   if(retry)this._retryTile(retry.dataset.cameraRetry);
   const fullscreen=event.target.closest?.('[data-camera-fullscreen]');if(fullscreen)this._toggleFullscreen(fullscreen.dataset.cameraFullscreen);
   const select=event.target.closest?.('[data-camera-select]');if(select)this._selectCamera(select.dataset.cameraSelect);
   if(event.target.closest?.('[data-camera-prev]'))this._selectCamera(nextCamera(this._config,this._activeCamera,-1));
   if(event.target.closest?.('[data-camera-next]'))this._selectCamera(nextCamera(this._config,this._activeCamera,1));
   if(event.target.closest?.('[data-camera-cycle]')){this._cyclePaused=!this._cyclePaused;this._syncPlayers();}
  });
  this.addEventListener('pointerenter',()=>{this._hovered=true;this._syncCycle();});
  this.addEventListener('pointerleave',()=>{this._hovered=false;this._syncCycle();});
  this.shadowRoot.addEventListener('focus',()=>{this._focused=true;this._syncCycle();},true);
  this.shadowRoot.addEventListener('blur',()=>queueMicrotask(()=>{this._focused=!!this.shadowRoot.activeElement;this._syncCycle();}),true);
 }
 _makeTile(row){
  const section=document.createElement('section');section.className='camera-tile';
  section.innerHTML=`<div class="camera-tile-header"><button type="button" class="camera-name" data-camera-details="${uiEscape(row.entity)}"><ha-icon aria-hidden="true"></ha-icon><span></span></button>${uiButton({className:'camera-fullscreen',content:'<ha-icon icon="mdi:fullscreen" aria-hidden="true"></ha-icon>',attrs:{'data-camera-fullscreen':row.entity}})}</div><div class="camera-frame"><div class="camera-native"></div><div class="camera-message" role="status"><span></span>${uiButton({variant:'action',text:'',attrs:{'data-camera-retry':row.entity,hidden:true}})}</div></div><div class="camera-status"></div><p class="camera-last-detection"></p>`;
  const tile={section,name:section.querySelector('.camera-name'),frame:section.querySelector('.camera-frame'),message:section.querySelector('.camera-message'),status:'idle'};
  tile.player=new CameraPlayer(section.querySelector('.camera-native'),config=>this._createNative(config),status=>{tile.status=status;this._updateMessage(tile,row.entity);});
  return tile;
 }
 _updateMessage(tile,entity){
  const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b,row=this._config.cameras.find(row=>row.entity===entity),unavailable=this._playbackBlocked(row??{entity});
  const paused=!this._attached||document.hidden||(!this._viewerEntity&&!this.shadowRoot.fullscreenElement&&this.hasAttribute('data-motion-paused'));
  const status=unavailable??(paused?'paused':tile.status);
  const messages={offline:t('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'),missing:t('Camera niet gevonden.','Camera not found.'),off:t('Camera uit.','Camera is off.'),unknown:t('Camera niet beschikbaar.','Camera unavailable.'),unavailable:t('Camera niet beschikbaar.','Camera unavailable.'),paused:t('Camerabeeld gepauzeerd.','Camera view paused.'),idle:t('Camerabeeld laden…','Loading camera view…'),loading:t('Camerabeeld laden…','Loading camera view…'),error:t('Camerabeeld laden mislukt.','Could not load camera view.')};
  messages.privacy=t('Privacymodus actief.','Privacy mode active.');messages.privacy_unknown=t('Privacystatus onbekend. Beeld verborgen.','Privacy status unknown. Feed hidden.');
  tile.message.hidden=status==='ready';const message=tile.message.querySelector('span'),text=messages[status]??'';if(message.textContent!==text)message.textContent=text;
  const retry=tile.message.querySelector('button');retry.hidden=status!=='error';retry.textContent=t('Opnieuw proberen','Retry');
  tile.frame.setAttribute('aria-busy',String(status==='loading'));
 }
 _render(){
  if(!this._config)return;this._ensureShell();
  const config=this._config,layout=this._layout(),nl=cameraDutch(this._hass),content=this.shadowRoot.querySelector('.content'),title=config.title||(nl?'Camera’s':'Cameras');
  content.dataset.dark=String(!!this._hass?.themes?.darkMode);content.dataset.color=config.color;content.dataset.compact=String(config.compact);
  content.dataset.animated=String(config.animate_background&&this._hass?.connected!==false&&this._hass?.connection?.connected!==false);
  content.style.setProperty('--header-background-opacity',String(config.background_strength/100));content.style.setProperty('--camera-ratio',config.aspect_ratio.replace(':','/'));
  if(content.dataset.background!==config.background){content.dataset.background=config.background;this.shadowRoot.querySelector('.scene-background').innerHTML=headerAtmosphere(config.background);}
  const heading=this.shadowRoot.querySelector('.camera-title');if(heading)heading.textContent=title;this.shadowRoot.querySelector('ha-card').setAttribute('aria-label',title);
  const rows=visibleCameras(config);
  const count=this.shadowRoot.querySelector('.camera-count');if(count)count.textContent=rows.length+' '+(nl?(rows.length===1?'camera':'camera’s'):(rows.length===1?'camera':'cameras'));
  const empty=this.shadowRoot.querySelector('.camera-empty');empty.hidden=!!rows.length;empty.textContent=nl?'Kies zichtbare camera’s in de kaartconfiguratie.':'Choose visible cameras in the card configuration.';
  for(const [entity,tile] of this._tiles)if(!rows.some(row=>row.entity===entity)){tile.player.stop();tile.section.remove();this._tiles.delete(entity);}
  const items=rows.map(row=>{
   let tile=this._tiles.get(row.entity);if(!tile){tile=this._makeTile(row);this._tiles.set(row.entity,tile);}
   const label=row.name||this._hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity;tile.name.querySelector('span').textContent=label;tile.name.querySelector('ha-icon').setAttribute('icon',row.icon||'mdi:cctv');tile.name.hidden=!config.show_names;tile.section.setAttribute('aria-label',label);
   tile.frame.style.setProperty('--camera-ratio',(row.aspect_ratio??config.aspect_ratio).replace(':','/'));
   const button=tile.section.querySelector('[data-camera-fullscreen]'),full=!!this.shadowRoot.fullscreenElement&&tile.section.contains(this.shadowRoot.fullscreenElement);button.hidden=true;button.setAttribute('aria-label',(full?(nl?'Volledig scherm sluiten: ':'Exit full screen: '):(nl?'Volledig scherm: ':'Full screen: '))+label);
   this._updateDetections(tile,row);
   return {value:row.entity,label,content:`<div data-camera-slot="${uiEscape(row.entity)}"></div>`};
  });
  if(!items.some(item=>item.value===this._activeCamera))this._activeCamera=config.default_camera;
  const key=JSON.stringify([layout,nl,items.map(item=>item.value)]);
  if(key!==this._layoutKey){
   const focused=this.shadowRoot.activeElement?.dataset.uiTab;this._tabs?.disconnect();
   const body=this.shadowRoot.querySelector('.camera-body');
   body.innerHTML=layout==='tabs'&&items.length>1?`<div class="camera-tabs">${uiTabs({id:this._id,label:nl?'Camera’s':'Cameras',items,selected:this._activeCamera,variant:'card',panelClassName:'camera-panel'})}</div>`:layout==='focus'?`<div class="camera-focus-picker" role="group" aria-label="${nl?'Camera kiezen':'Choose camera'}">${items.map(item=>uiButton({variant:'action-choice',text:item.label,attrs:{'data-camera-select':item.value}})).join('')}</div><div class="camera-focus"></div>`:`<div class="camera-grid" data-layout="${uiEscape(layout==='doorbell'?'sidebar':layout)}"></div>`;
   for(const row of rows){const slot=layout==='tabs'&&items.length>1?[...body.querySelectorAll('[data-camera-slot]')].find(node=>node.dataset.cameraSlot===row.entity):body.querySelector('.camera-grid,.camera-focus');slot.append(this._tiles.get(row.entity).section);}
   this._tabs=bindUITabs({tabs:body.querySelectorAll('[data-ui-tab]'),panels:body.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>this._selectCamera(value)});
   if(focused)[...body.querySelectorAll('[data-ui-tab]')].find(tab=>tab.dataset.uiTab===focused)?.focus({preventScroll:true});
   this._layoutKey=key;
  }
  this._tabs?.select(this._activeCamera,{notify:false});
  for(const item of items){const tab=[...this.shadowRoot.querySelectorAll('[data-ui-tab]')].find(node=>node.dataset.uiTab===item.value),choice=[...this.shadowRoot.querySelectorAll('[data-camera-select]')].find(node=>node.dataset.cameraSelect===item.value);if(tab)tab.textContent=item.label;if(choice){choice.textContent=item.label;choice.setAttribute('aria-pressed',String(item.value===this._activeCamera));}}
  for(const row of rows){const tile=this._tiles.get(row.entity);tile.section.hidden=layout==='tabs'?false:!this._feedVisible(row);tile.section.dataset.primary=String(row.entity===this._activeCamera);}
  const grid=this.shadowRoot.querySelector('.camera-grid');if(grid)grid.dataset.columns=String(config.columns);
  this._syncPlayers();
 }
 _selectCamera(entity,manual=true){
  if(!visibleCameras(this._config).some(row=>row.entity===entity))return;
  this._activeCamera=entity;if(manual)this._cycle.stop();
  this._tabs?.select(entity,{notify:false});
  this._render();
 }
 _updateDetections(tile,row){
  const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b,config=this._config,{entries,last}=cameraDetections(this._hass,row,this._detections);
  const status=tile.section.querySelector('.camera-status');status.hidden=!config.show_status||!entries.length;const markup=cameraDetectionIndicators(entries,t);if(status.innerHTML!==markup)status.innerHTML=markup;
  const detection=tile.section.querySelector('.camera-last-detection');detection.hidden=!config.show_last_detection||(!entries.length&&!row.last_detection_entity);
  const formatted=last===null?'—':new Intl.DateTimeFormat(nl?'nl-NL':'en-GB',{timeZone:this._hass?.config?.time_zone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(last));
  detection.textContent=t('Laatste detectie: ','Last detection: ')+formatted;
 }
 _cycleCameras(){return visibleCameras(this._config).filter(row=>!this._playbackBlocked(row));}
 _syncCycle(){
  if(!this._config)return;
  const eligible=this._cycleCameras();
  const enabled=this._attached&&!this.hasAttribute('data-motion-paused')&&!this._hovered&&!this._focused&&!this.shadowRoot.activeElement&&!this.shadowRoot.fullscreenElement&&['tabs','focus'].includes(this._layout())&&this._config.auto_cycle&&!this._cyclePaused&&!this._temporary&&(eligible.length>1||(eligible.length===1&&eligible[0].entity!==this._activeCamera));
  this._cycle.sync(enabled,this._config.cycle_interval);
 }
 _updateNavigation(){
  const config=this._config,rows=visibleCameras(config),nl=cameraDutch(this._hass),nav=this.shadowRoot.querySelector('.camera-navigation');
  nav.hidden=!['tabs','focus'].includes(this._layout())||rows.length<2||(!config.show_navigation&&!config.auto_cycle);
  const index=rows.findIndex(row=>row.entity===this._activeCamera),position=this.shadowRoot.querySelector('.camera-position');position.textContent=(index+1)+' / '+rows.length;position.hidden=!config.show_navigation;
  for(const [selector,label] of [['[data-camera-prev]',nl?'Vorige camera':'Previous camera'],['[data-camera-next]',nl?'Volgende camera':'Next camera']]){const button=this.shadowRoot.querySelector(selector);button.setAttribute('aria-label',label);button.hidden=!config.show_navigation;}
  const cycle=this.shadowRoot.querySelector('[data-camera-cycle]');cycle.hidden=!config.auto_cycle;cycle.setAttribute('aria-pressed',String(!this._cyclePaused));cycle.setAttribute('aria-label',nl?'Automatisch wisselen':'Auto cycle');cycle.textContent=this._cyclePaused?(nl?'Hervatten':'Resume'):(nl?'Pauzeren':'Pause');
  for(const button of this.shadowRoot.querySelectorAll('[data-camera-select]'))button.setAttribute('aria-pressed',String(button.dataset.cameraSelect===this._activeCamera));
 }
 async _toggleFullscreen(entity){
  const tile=this._tiles.get(entity);if(!tile)return;
  const error=this.shadowRoot.querySelector('.camera-action-error');error.hidden=true;
  try{if(this.shadowRoot.fullscreenElement)await document.exitFullscreen();else await tile.section.requestFullscreen();}
  catch{error.textContent=cameraDutch(this._hass)?'Volledig scherm is hier niet beschikbaar.':'Full screen is unavailable here.';error.hidden=false;}
 }
 _updateFullscreen(){
  for(const tile of this._tiles.values()){
   const active=!!this.shadowRoot.fullscreenElement&&tile.section.contains(this.shadowRoot.fullscreenElement),button=tile.section.querySelector('[data-camera-fullscreen]');button.querySelector('ha-icon').setAttribute('icon',active?'mdi:fullscreen-exit':'mdi:fullscreen');button.setAttribute('aria-label',(active?(cameraDutch(this._hass)?'Volledig scherm sluiten: ':'Exit full screen: '):(cameraDutch(this._hass)?'Volledig scherm: ':'Full screen: '))+tile.section.getAttribute('aria-label'));
  }
  this._syncPlayers();
 }
 _syncPlayers(){
  if(!this._config)return;
  for(const row of this._config.cameras){
   const tile=this._tiles.get(row.entity);if(!tile)continue;
   const fullscreen=this.shadowRoot.fullscreenElement;
   const active=row.show!==false&&!!this._attached&&!document.hidden&&(!!this._viewerEntity||!!fullscreen||!this.hasAttribute('data-motion-paused'))&&!this._playbackBlocked(row)&&(!fullscreen||tile.section.contains(fullscreen))&&this._feedVisible(row);
   this._syncTile(tile,row,active);this._updateMessage(tile,row.entity);
  }
  this._updateNavigation();this._syncCycle();
 }
}
export class CameraCard extends withCardBackground(cameraFeaturesView(CameraCardBase)){}
