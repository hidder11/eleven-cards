import {ElevenCardBackgroundEditor} from '../../../shared/card-background.js';
import {CameraCard} from './camera-card.js';
import {uiCardTitleStyles} from '../../../shared/ui-card-title.js';
import {cameraViewerChannel} from './camera-viewer-link.js';
import {cameraDutch,visibleCameras} from './camera-utils.js';

export class CameraViewerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(input){this._config={show_names:true,show_status:true,show_last_detection:true,show_fullscreen:true,compact:false,...input};this._render();}
 set hass(value){this._hass=value;this._render();}
 _render(){if(!this._config)return;const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b;
  if(!this._form){this.shadowRoot.innerHTML='<ha-form></ha-form>';this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config={...this._config,...event.detail.value};this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));});}
  this._form.hass=this._hass;this._form.data=this._config;this._form.schema=[{name:'title',selector:{text:{}}},{name:'viewer_id',selector:{text:{}}},...['show_names','show_status','show_last_detection','show_fullscreen','compact'].map(name=>({name,selector:{boolean:{}}}))];
  const labels={title:t('Titel','Title'),viewer_id:t('Viewer-ID','Viewer ID'),show_names:t('Cameranamen tonen','Show camera names'),show_status:t('Detecties tonen','Show detections'),show_last_detection:t('Laatste detectie tonen','Show last detection'),show_fullscreen:t('Knop voor groot beeld tonen','Show large view button'),compact:t('Compact','Compact')};this._form.computeLabel=field=>labels[field.name]??field.name;this._form.computeHelper=field=>field.name==='viewer_id'?t('Gebruik dezelfde ID als in de gekoppelde camerakaart.','Use the same ID as in the linked camera card.'):'';
 }
}
export class CameraViewerCard extends CameraCard{
 static getStubConfig(){return {viewer_id:'camera-viewer'};}
 static async getConfigElement(){await CameraCard.getConfigElement();if(!customElements.get('eleven-camera-viewer-editor'))customElements.define('eleven-camera-viewer-editor',CameraViewerEditor);if(!customElements.get('eleven-card-background-editor'))customElements.define('eleven-card-background-editor',ElevenCardBackgroundEditor);const editor=document.createElement('eleven-card-background-editor');editor.nativeEditor=document.createElement('eleven-camera-viewer-editor');return editor;}
 setConfig(input){this._unsubscribeViewer();this._viewerInput={...input};this._viewerId=typeof input.viewer_id==='string'?input.viewer_id.trim():'';this._refreshViewer();if(this.isConnected)this._subscribeViewer();}
 connectedCallback(){super.connectedCallback();this._subscribeViewer();}
 disconnectedCallback(){this._unsubscribeViewer();super.disconnectedCallback();}
 getCardSize(){const content=this.shadowRoot?.querySelector('.content');if(this.isConnected&&content?.getBoundingClientRect().width>0)return Math.max(2,Math.ceil(content.scrollHeight/50));return this._config?.cameras?.length?5:2;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 _subscribeViewer(){this._unsubscribeViewer();if(!this._viewerId)return;this._viewerChannel=cameraViewerChannel(this._viewerId);this._viewerListener=()=>this._refreshViewer();this._viewerChannel.listeners.add(this._viewerListener);this._refreshViewer();this._viewerChannel.source?._render();}
 _unsubscribeViewer(){const channel=this._viewerChannel;channel?.listeners.delete(this._viewerListener);this._viewerChannel=null;channel?.source?._render();}
 _refreshViewer(){
  const channel=this._viewerId?cameraViewerChannel(this._viewerId):null,source=channel?.source;
  const row=source?visibleCameras(source._config).find(row=>row.entity===channel.entity):null;
  const camera=row?{...row,camera_view:row.camera_view??source._config.camera_view,aspect_ratio:row.aspect_ratio??source._config.aspect_ratio,fit_mode:row.fit_mode??source._config.fit_mode,snapshot_interval:row.snapshot_interval??source._config.snapshot_interval}:null;
  super.setConfig({...this._viewerInput,viewer_target:'',cameras:camera?[camera]:[],entity:undefined,layout:'focus',profiles:[],actions:[],auto_cycle:false,auto_focus:false,doorbell_entity:'',alarm_entity:'',door_sensors:[],window_sensors:[],show_activity:false,show_security:false,show_alarm:false,show_contacts:false});
 }
 _renderSecurity(){super._renderSecurity();const title=this._viewerInput?.title||this._t('Cameraviewer','Camera viewer'),header=this.shadowRoot.querySelector('.camera-security-header'),heading=document.createElement('h2');heading.className='camera-viewer-title';heading.textContent=title;header.replaceChildren(heading);this.shadowRoot.querySelector('ha-card').setAttribute('aria-label',title);this.shadowRoot.querySelector('.camera-security-metrics').hidden=true;if(!this._viewerTitleStyle){const style=document.createElement('style');style.textContent=uiCardTitleStyles('.camera-viewer-title')+'.camera-viewer-title{margin:0}.camera-security-header{min-height:0}';this.shadowRoot.append(style);this._viewerTitleStyle=style;}}
 _render(){super._render();if(!this._config)return;const empty=this.shadowRoot.querySelector('.camera-empty');empty.textContent=this._viewerId?this._t('Klik op een camera in de gekoppelde camerakaart.','Select a camera in the linked camera card.'):this._t('Stel een viewer-ID in om een camerakaart te koppelen.','Set a viewer ID to link a camera card.');this.shadowRoot.querySelector('.camera-focus-picker')?.setAttribute('hidden','');for(const tile of this._tiles.values())tile.section.querySelector('[data-camera-expand]').hidden=!this._config.show_fullscreen;}
}
