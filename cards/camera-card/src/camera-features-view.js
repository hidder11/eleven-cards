import {cameraSecurityStatusColor} from './security-status.js';
import {cameraShowAlarm} from './camera-features.js';
import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {cameraDutch,cameraPictureConfig,visibleCameras,cameraDetections} from './camera-utils.js';
import {normalizeCameraConfig} from './camera-utils.js';
import {effectiveCameraConfig,cameraPrivacy,CameraActivity,cameraActivitySources,cameraHistoryEvents,cameraActionRequest,cameraRetainActivity} from './camera-features.js';
import {CameraSnapshot} from './camera-snapshot.js';
import {CameraViewerPicker} from './camera-viewer-picker.js';
import {uiTabs,bindUITabs} from '../../../shared/ui-tabs.js';
import {cameraSecurityHeader,cameraSecurityMetrics,cameraContactList,cameraSecurityTabs,cameraVisibleEvents,cameraActivityTimeline,cameraDetectionIndicators} from './camera-security.js';
import {securityArt} from './security-art.js';
import {CameraAlarmControls} from './camera-alarm.js';
import {CameraActivityPages} from './camera-activity-pages.js';

function cameraReplaceMarkup(node,markup){
 if(node._cameraMarkup===markup)return;node._cameraMarkup=markup;
 const focused=node.getRootNode().activeElement,identity=focused&&node.contains(focused)?['cameraAction','cameraDetails','cameraRefresh','cameraPrivacy','cameraActivity','cameraActivityPage','securityContacts','securityView','entity'].find(key=>focused.dataset[key]):null,value=identity?focused.dataset[identity]:null;
 node.innerHTML=markup;
 if(identity)[...node.querySelectorAll('button')].find(button=>button.dataset[identity]===value)?.focus({preventScroll:true});
}

export const cameraFeaturesView=Base=>class extends Base{
 constructor(){super();this._activity=new CameraActivity();this._profileSelection='auto';this._manualUntil=0;this._historyVersion=0;this._securityView='cameras';this._contactKind='';this._activityCamera='';this._activityKind='';}
 setConfig(input){
  const next=normalizeCameraConfig(input),previous=this._baseConfig;
  this._activityPages??=new CameraActivityPages();
  const pageKey=config=>config?JSON.stringify([cameraActivitySources(config),config.cameras.map(row=>[row.entity,row.show]),config.activity_source,config.activity_hours,config.activity_page_size,config.show_activity]):'';
  if(pageKey(previous)!==pageKey(next))this._activityPages.reset();
  const historyKey=config=>config?JSON.stringify([cameraActivitySources(config),config.activity_source,config.activity_hours,config.show_activity]):'';
  if(historyKey(previous)!==historyKey(next)){this._historyVersion++;this._historyKey=null;this._historyLoading=false;this._historyError=false;this._historyHasLoaded=false;}
  this._pendingAction=null;this.shadowRoot.querySelector('dialog')?.close();
  this._baseConfig=next;
  if(!previous||previous.default_camera!==next.default_camera)this._activeCamera=next.default_camera;
  this._applyProfile();this._observeActivity();this._render();this._loadHistory();
 }
 set hass(value){this._hass=value;this._applyProfile();this._observeActivity();this._render();this._loadHistory();}
 get hass(){return this._hass;}
 connectedCallback(){super.connectedCallback();this._loadHistory();}
 disconnectedCallback(){
  this._closeViewer(false);
  super.disconnectedCallback();clearTimeout(this._temporaryTimer);this._temporary=null;this._activity.previous.clear();
  this._alarmControls?.disconnect();
  this._securityTabs?.disconnect();this._securityTabsKey=null;
  this._historyVersion++;this._historyKey=null;this._historyLoading=false;
  clearTimeout(this._historyRefreshTimer);this._historyRefreshTimer=null;
  for(const tile of this._tiles.values())tile.snapshot?.stop();
  this.shadowRoot.querySelector('dialog')?.close();this._pendingAction=null;
 }
 _applyProfile(){
  if(!this._baseConfig)return;
  const config={...this._baseConfig,profiles:[],actions:[],auto_focus:false,doorbell_entity:''},profile=null,key='base';
  if(this._profileKey!==key){this._cancelTemporary();this._expanded=false;this._cycle.stop();this._manualUntil=0;this._profileKey=key;}
  this._config=config;this._profile=profile;
  if(!cameraSecurityTabs(config,(nl,en)=>en).some(tab=>tab.value===this._securityView))this._securityView='cameras';
  if(!visibleCameras(config).some(row=>row.entity===this._activeCamera))this._activeCamera=config.default_camera;
 }
 _layout(){return this._temporary?.kind==='doorbell'&&visibleCameras(this._config).some(row=>row.entity===this._config.doorbell_secondary_camera&&row.entity!==this._activeCamera)?'doorbell':this._temporary||this._expanded?'focus':super._layout();}
 _feedVisible(row){if(this._viewerEntity)return row.entity===this._viewerEntity;if(this._securityView!=='cameras')return false;if(this._layout()==='doorbell')return [this._activeCamera,this._config.doorbell_secondary_camera].includes(row.entity);return super._feedVisible(row);}
 _playbackBlocked(row){return cameraPrivacy(this._hass,row)??super._playbackBlocked(row);}
 _cancelTemporary(){clearTimeout(this._temporaryTimer);this._temporaryTimer=null;this._temporary=null;}
 _manualInteraction(){this._cancelTemporary();this._manualUntil=Date.now()+Math.max(this._config?.focus_duration??30,this._config?.doorbell_duration??45)*1000;}
 _selectCamera(entity,manual=true){if(manual)this._manualInteraction();super._selectCamera(entity,manual);}
 _observeActivity(){
  if(!this._baseConfig||!this._hass)return;
  const events=this._activity.ingest(this._config,this._hass),now=Date.now();
  const allowed=new Set(cameraActivitySources(this._config).map(source=>source.entity+'|'+source.camera+'|'+source.kind));
  const since=this._config.activity_source==='history'?now-this._config.activity_hours*3600000:0;
  this._activity.events=cameraRetainActivity(this._activity.events.filter(event=>event.time>=since&&allowed.has(event.entity+'|'+event.camera+'|'+event.kind)));
  this._activity.observed=cameraRetainActivity(this._activity.observed.filter(event=>allowed.has(event.entity+'|'+event.camera+'|'+event.kind)));
  const candidates=events.filter(event=>now-event.time<30000&&(event.kind==='doorbell'||this._config.auto_focus)&&visibleCameras(this._config).some(row=>row.entity===event.camera&&!this._playbackBlocked(row)));
  if(!candidates.length||this._viewerEntity||!this._attached||document.hidden||this.hasAttribute('data-motion-paused')||this._focused||this.shadowRoot.activeElement||this.shadowRoot.fullscreenElement||now<this._manualUntil)return;
  const rank={motion:1,person:2,doorbell:3};candidates.sort((a,b)=>rank[b.kind]-rank[a.kind]||b.time-a.time);
  const event=candidates[0];if(this._temporary&&rank[this._temporary.kind]>rank[event.kind])return;
  const restore=this._temporary?.restore??{camera:this._activeCamera,expanded:this._expanded,view:this._securityView,scroll:this.shadowRoot.querySelector('ha-card')?.scrollTop??0};
  this._cancelTemporary();this._securityView='cameras';this._activeCamera=event.camera;this._temporary={kind:event.kind,restore};this._cycle.stop();
  this._temporaryTimer=setTimeout(()=>{
   const saved=this._temporary?.restore;this._cancelTemporary();if(!saved)return;
   this._activeCamera=saved.camera;this._expanded=saved.expanded;this._securityView=saved.view??'cameras';this._render();this.shadowRoot.querySelector('ha-card').scrollTop=saved.scroll;
  },(event.kind==='doorbell'?this._config.doorbell_duration:this._config.focus_duration)*1000);
 }
 _ensureFeatures(){
  if(this._featureShell)return;this._featureShell=true;
  const body=this.shadowRoot.querySelector('.camera-body'),toolbar=document.createElement('div');toolbar.className='camera-feature-toolbar';
  toolbar.innerHTML='<label class="camera-profile-label"><span></span><select data-camera-profile></select></label><button type="button" data-ui-button="text" data-camera-back hidden></button><span class="camera-alert-label" role="status" hidden></span>';
  body.before(toolbar);
  const security=document.createElement('div');security.className='camera-security';body.before(security);
  const header=this.shadowRoot.querySelector('.camera-header');header.className='camera-security-header';
  const metrics=document.createElement('div');metrics.className='camera-security-metrics';header.after(metrics);
  const alarmControls=document.createElement('section');alarmControls.className='camera-alarm-controls';metrics.before(alarmControls);
  const tabs=document.createElement('div');tabs.className='camera-security-tabs';security.before(tabs);
  const actions=document.createElement('div');actions.className='camera-actions';this.shadowRoot.querySelector('.camera-navigation').after(actions);
  const activity=document.createElement('section');activity.className='camera-activity';activity.innerHTML='<div class="camera-activity-list"></div><div class="camera-activity-pagination"></div><p class="camera-history-status" role="status"></p>';actions.after(activity);
  const dialog=document.createElement('dialog');dialog.className='camera-confirm';dialog.innerHTML='<h3></h3><p></p><div><button type="button" data-ui-button="action" data-camera-cancel></button><button type="button" data-ui-button="action" data-camera-confirm></button></div>';this.shadowRoot.append(dialog);
  dialog.addEventListener('cancel',()=>{this._pendingAction=null;});
  this.shadowRoot.addEventListener('change',event=>{if(event.target.matches('[data-camera-profile]')){this._profileSelection=event.target.value;this._manualInteraction();this._expanded=false;this._applyProfile();this._render();}if(event.target.matches('[data-activity-filter]')){this[event.target.dataset.activityFilter==='camera'?'_activityCamera':'_activityKind']=event.target.value;this._renderActivity();}});
  this.shadowRoot.addEventListener('click',event=>this._featureClick(event));
  this._securityContent=document.createElement('div');this._securityContent.className='camera-security-content';
  for(const node of [security,body,this.shadowRoot.querySelector('.camera-navigation'),actions,activity,this.shadowRoot.querySelector('.camera-action-error')])this._securityContent.append(node);
  tabs.after(this._securityContent);
 }
 _makeTile(row){
  const tile=super._makeTile(row),header=tile.section.querySelector('.camera-tile-header');
  tile.frame.prepend(header);
  const feedStatus=document.createElement('span');feedStatus.className='camera-feed-status';header.append(feedStatus);
  header.insertAdjacentHTML('beforeend',uiButton({className:'camera-expand',content:'<ha-icon icon="mdi:arrow-expand" aria-hidden="true"></ha-icon>',attrs:{'data-camera-expand':row.entity}})+uiButton({content:'<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>',attrs:{'data-camera-refresh':row.entity}})+uiButton({content:'<ha-icon icon="mdi:shield-lock" aria-hidden="true"></ha-icon>',attrs:{'data-camera-privacy':row.entity}}));
  const loaded=document.createElement('p');loaded.className='camera-snapshot-time';loaded.hidden=true;tile.section.append(loaded);tile.loaded=loaded;
  const footer=document.createElement('div');footer.className='camera-tile-footer';
  const actions=document.createElement('div');actions.className='camera-tile-actions';
  actions.append(tile.section.querySelector('.camera-status'),header.querySelector('[data-camera-refresh]'),header.querySelector('[data-camera-privacy]'),header.querySelector('[data-camera-expand]'));
  footer.append(tile.name,actions);tile.frame.after(footer);header.hidden=true;
  tile.snapshot=new CameraSnapshot(tile.section.querySelector('.camera-native'),status=>{tile.status=status;this._updateMessage(tile,row.entity);queueMicrotask(()=>{const button=tile.section.querySelector('[data-camera-refresh]');button.disabled=!!this._playbackBlocked(this._config.cameras.find(item=>item.entity===row.entity)??row)||!!tile.snapshot?.pending;this._renderViewer();});},()=>this._updateSnapshotTime(tile));
  return tile;
 }
 _syncTile(tile,row,active){
  const picture=cameraPictureConfig(row.entity,this._config),interval=row.snapshot_interval??this._config.snapshot_interval;
  const managed=picture.camera_view==='auto'&&(interval>0||tile.manualSnapshot);
  tile.managedSnapshot=managed;
  if(managed){tile.player.stop();tile.snapshot.update(this._hass,row.entity,{interval,fit_mode:picture.fit_mode,alt:row.name||this._hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity},active);}
  else{tile.snapshot.stop();super._syncTile(tile,row,active);}
  this._updateSnapshotTime(tile);
 }
 _updateSnapshotTime(tile){
  if(!tile.loaded)return;tile.loaded.hidden=true;tile.loaded.textContent='';
 }
 _retryTile(entity){const tile=this._tiles.get(entity);if(tile?.managedSnapshot){tile.snapshot.refresh();return;}super._retryTile(entity);}
 _t(nl,en){return cameraDutch(this._hass)?nl:en;}
 _time(time){return new Intl.DateTimeFormat(cameraDutch(this._hass)?'nl-NL':'en-GB',{timeZone:this._hass?.config?.time_zone,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time));}
 _cameraName(entity){return this._config.cameras.find(row=>row.entity===entity)?.name||this._hass?.states?.[entity]?.attributes?.friendly_name||entity;}
 _render(){
  if(!this._config)return;
  if(this._viewerEntity&&!visibleCameras(this._config).some(row=>row.entity===this._viewerEntity))this._closeViewer(false);
  if(!cameraSecurityTabs(this._config,(nl,en)=>en).some(tab=>tab.value===this._securityView))this._securityView='cameras';
  // Stop removed/hidden images before the base adapter discards their tiles.
  for(const [entity,tile] of this._tiles)if(!visibleCameras(this._config).some(row=>row.entity===entity))tile.snapshot?.stop();
  super._render();this._ensureFeatures();this._renderFeatures();this._renderViewer();
  this.shadowRoot.querySelector('.camera-grid')?.style.setProperty('--camera-secondary-count',String(Math.max(1,visibleCameras(this._config).filter(row=>this._feedVisible(row)).length-1)));
 }
 _renderFeatures(){
  const config=this._config,t=(a,b)=>this._t(a,b),toolbar=this.shadowRoot.querySelector('.camera-feature-toolbar'),select=toolbar.querySelector('select');
  const options=[{value:'auto',label:t('Automatisch','Automatic')+(this._profile?' · '+(this._profile.name||this._profile.id):'')},{value:'base',label:t('Kaartinstelling','Card default')},...config.profiles.map(row=>({value:row.id,label:row.name||row.id}))];
  const markup=options.map(row=>`<option value="${uiEscape(row.value)}">${uiEscape(row.label)}</option>`).join('');if(select.innerHTML!==markup)select.innerHTML=markup;select.value=this._profileSelection;select.parentNode.hidden=!config.profiles.length;select.parentNode.querySelector('span').textContent=t('Profiel','Profile');
  const back=toolbar.querySelector('[data-camera-back]');back.hidden=!this._expanded&&!this._temporary;back.textContent=this._temporary?t('Terug naar camera’s','Return to cameras'):t('Terug','Back');
  const online=this._hass?.connected!==false&&this._hass?.connection?.connected!==false;
  const detected=online?visibleCameras(config).find(row=>cameraDetections(this._hass,row,this._detections).entries.some(entry=>entry.active)):null;
  const alarm=online&&cameraShowAlarm(config)&&this._hass?.states?.[config.alarm_entity]?.state==='triggered';
  const alert=toolbar.querySelector('.camera-alert-label');alert.hidden=!this._temporary&&!detected&&!alarm;
  const alertText=alarm?t('Alarm geactiveerd','Alarm triggered'):this._temporary?(this._temporary.kind==='doorbell'?t('Er wordt aangebeld','Doorbell ringing'):t('Detectie','Detection'))+' · '+this._cameraName(this._activeCamera):detected?t('Detectie','Detection')+' · '+this._cameraName(detected.entity):'';if(alert.textContent!==alertText)alert.textContent=alertText;
  alert.hidden=true;toolbar.hidden=back.hidden;
  for(const row of visibleCameras(config)){
   const tile=this._tiles.get(row.entity),privacy=cameraPrivacy(this._hass,row),view=cameraPictureConfig(row.entity,config).camera_view;
   const expand=tile.section.querySelector('[data-camera-expand]');expand.hidden=this._viewerEntity===row.entity;expand.setAttribute('aria-label',t('Groot beeld: ','Large view: ')+this._cameraName(row.entity));expand.title=t('Groot beeld','Large view');expand.innerHTML='<ha-icon icon="mdi:arrow-expand" aria-hidden="true"></ha-icon>';
   const refresh=tile.section.querySelector('[data-camera-refresh]');refresh.hidden=view!=='auto';refresh.disabled=!!this._playbackBlocked(row)||tile.snapshot.pending;refresh.setAttribute('aria-label',t('Beeld vernieuwen: ','Refresh image: ')+this._cameraName(row.entity));
   const button=tile.section.querySelector('[data-camera-privacy]');button.hidden=!row.privacy_entity;button.disabled=!!this._actionBusy||row.privacy_entity?.startsWith('binary_sensor.')||privacy==='privacy_unknown';button.setAttribute('aria-label',(privacy==='privacy'?t('Privacy uitschakelen: ','Disable privacy: '):t('Privacy inschakelen: ','Enable privacy: '))+this._cameraName(row.entity));button.setAttribute('aria-pressed',String(privacy==='privacy'));
   const entries=cameraDetections(this._hass,row,this._detections).entries,active=entries.some(entry=>entry.active);
   for(const choice of this.shadowRoot.querySelectorAll('[data-ui-tab],[data-camera-select]'))if((choice.dataset.uiTab??choice.dataset.cameraSelect)===row.entity){choice.dataset.detection=String(active);choice.setAttribute('aria-label',this._cameraName(row.entity)+(active?t(' · Detectie',' · Detection'):''));}
   tile.section.dataset.detection=String(active);
   const feedStatus=tile.section.querySelector('.camera-feed-status'),blocked=this._playbackBlocked(row),state=this._hass?.states?.[row.entity]?.state;
   feedStatus.hidden=true;feedStatus.textContent='';
   const badges=tile.section.querySelector('.camera-status');badges.hidden=!config.show_status||!entries.length;
  }
  this._renderSecurity();this._renderAlarmControls();this._renderActions();this._renderActivity();
 }
 _renderAlarmControls(){
  this._alarmControls??=new CameraAlarmControls(this.shadowRoot.querySelector('.camera-alarm-controls'));
  this._alarmControls.update(this._hass,cameraShowAlarm(this._config)?this._config.alarm_entity:'',(nl,en)=>this._t(nl,en),this._config.alarm_disarm_code);
 }
 cardBackgroundStatusColor(){return cameraSecurityStatusColor(this._config,this._hass);}
 _renderSecurity(){
  const config=this._config,t=(a,b)=>this._t(a,b),root=this.shadowRoot;
  const items=cameraSecurityTabs(config,t);
  if(!items.some(item=>item.value===this._securityView))this._securityView='cameras';
  this._securityArtCache??=new Map();
  const color=this.cardBackgroundStatusColor();
  const art=kind=>{const key=kind+color;if(!this._securityArtCache.has(key))this._securityArtCache.set(key,securityArt(kind,color));return this._securityArtCache.get(key);};
  cameraReplaceMarkup(root.querySelector('.camera-security-header'),cameraSecurityHeader(config,this._hass,t,art));
  cameraReplaceMarkup(root.querySelector('.camera-security-metrics'),cameraSecurityMetrics(config,this._hass,t));
  const contacts=root.querySelector('.camera-security'),contactView=['doors','windows'].includes(this._securityView);contacts.hidden=!contactView;
  if(contactView)cameraReplaceMarkup(contacts,`<div class="camera-contact-surfaces">${cameraContactList(config,this._hass,t,this._securityView,this._activity.lastOpened)}</div>`);
  const key=JSON.stringify(items),tabs=root.querySelector('.camera-security-tabs');
  if(key!==this._securityTabsKey){
   this._securityTabs?.disconnect();
   tabs.after(this._securityContent);
   tabs.innerHTML=uiTabs({id:this._id+'-security',label:t('Beveiligingsoverzicht','Security overview'),variant:'card',selected:this._securityView,items});
   this._securityTabs=bindUITabs({tabs:tabs.querySelectorAll('[data-ui-tab]'),panels:tabs.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>this._selectSecurityView(value)});this._securityTabsKey=key;
  }
  tabs.querySelector('[data-ui-tabs]').hidden=items.length===1;
  this._securityTabs?.select(this._securityView,{notify:false});
  const panel=[...tabs.querySelectorAll('[data-ui-tab-panel]')].find(node=>node.dataset.uiTabPanel===this._securityView);if(panel&&!panel.contains(this._securityContent))panel.append(this._securityContent);
  root.querySelector('.camera-body').hidden=this._securityView!=='cameras';
  root.querySelector('.camera-navigation').hidden=this._securityView!=='cameras'||root.querySelector('.camera-navigation').hidden;
 }
 _selectSecurityView(value){
  this._securityView=value;this._manualInteraction();this._render();
  const tab=this.shadowRoot.querySelector('.camera-security-tabs [aria-selected=true]'),strip=tab?.parentElement;
  if(strip&&strip.scrollWidth>strip.clientWidth){
   const box=strip.getBoundingClientRect(),target=tab.getBoundingClientRect();
   if(target.left<box.left)strip.scrollLeft-=box.left-target.left;
   else if(target.right>box.right)strip.scrollLeft+=target.right-box.right;
  }
 }
 _syncPlayers(){super._syncPlayers();this._viewerPicker?.sync(this._hass,!!this._viewerEntity&&!!this._attached&&!document.hidden);this._syncHistoryRefresh();}
 _historyRefreshActive(){
  return !!this._attached&&!document.hidden&&!this.hasAttribute('data-motion-paused')&&this._securityView==='activity'&&!this._viewerEntity&&!!this._hass&&this._hass.connected!==false&&this._hass.connection?.connected!==false&&!!this._config?.show_activity&&this._config.activity_source==='history'&&cameraActivitySources(this._config).length>0;
 }
 _syncHistoryRefresh(){
  clearTimeout(this._historyRefreshTimer);this._historyRefreshTimer=null;
  if(!this._historyRefreshActive()||this._historyLoading)return;
  const delay=Math.max(0,30000-(Date.now()-(this._historyLastAttempt??0)));
  this._historyRefreshTimer=setTimeout(()=>{
   this._historyRefreshTimer=null;
   if(this._historyRefreshActive())this._loadHistory(true);
  },delay);
 }
 _syncCycle(){if(this._viewerEntity||this._securityView!=='cameras'){this._cycle.stop();return;}super._syncCycle();}
 _openViewer(entity,opener){
  if(!visibleCameras(this._config).some(row=>row.entity===entity))return;
  this._manualInteraction();this._viewerOpener=opener??this.shadowRoot.activeElement;this._viewerEntity=entity;
  if(!this._viewer){
   const dialog=document.createElement('dialog');dialog.className='camera-viewer';
   dialog.innerHTML='<header class="camera-viewer-header"><div><h2 id="'+this._id+'-viewer-title"></h2><p></p></div><div class="camera-viewer-tools"></div><button type="button" class="camera-viewer-close" data-camera-view-close autofocus><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header><div class="camera-viewer-body"></div><nav class="camera-viewer-picker"></nav><footer class="camera-viewer-footer"><button type="button" data-ui-button="text" data-camera-view-step="-1"><ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon><span></span></button><span class="camera-viewer-position" aria-live="polite"></span><button type="button" data-ui-button="text" data-camera-view-step="1"><span></span><ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon></button></footer>';
   dialog.setAttribute('aria-labelledby',this._id+'-viewer-title');
   dialog.addEventListener('cancel',event=>{event.preventDefault();this._closeViewer();});
   dialog.addEventListener('close',()=>{if(this._viewerEntity)this._closeViewer();});
   this.shadowRoot.append(dialog);this._viewer=dialog;
  }
  this._viewer.append(this.shadowRoot.querySelector('.camera-action-error'));
  this._render();this._viewer.showModal();this._viewer.querySelector('[data-camera-view-close]').focus();
 }
 _renderViewer(){
  if(!this._viewerEntity||!this._viewer)return;
  const rows=visibleCameras(this._config),row=rows.find(row=>row.entity===this._viewerEntity),tile=this._tiles.get(this._viewerEntity);if(!row||!tile)return;
  const body=this._viewer.querySelector('.camera-viewer-body');
  // Return the previous camera before selecting another one; no duplicate players.
  for(const previous of [...body.children])if(previous!==tile.section){this.shadowRoot.querySelector('.camera-body').append(previous);previous.hidden=true;}
  if(tile.section.parentNode!==body)body.append(tile.section);tile.section.hidden=false;
  this._viewer.querySelector('h2').textContent=this._cameraName(row.entity);
  this._viewer.querySelector('.camera-viewer-header p').textContent=this._t('Actueel camerabeeld','Current camera feed');
  this._viewer.querySelector('[data-camera-view-close]').setAttribute('aria-label',this._t('Groot beeld sluiten','Close large view'));
  const tools=this._viewer.querySelector('.camera-viewer-tools'),entries=this._config.show_status?cameraDetections(this._hass,row,this._detections).entries:[];
  const controls=['[data-camera-refresh]','[data-camera-privacy]'].map(selector=>tile.section.querySelector(selector)).filter(button=>button&&!button.hidden).map(button=>button.outerHTML).join('');
  cameraReplaceMarkup(tools,cameraDetectionIndicators(entries,(nl,en)=>this._t(nl,en))+controls);
  this._viewerPicker??=new CameraViewerPicker(this._viewer.querySelector('.camera-viewer-picker'));
  this._viewerPicker.update(this._hass,rows,{selected:row.entity,name:entity=>this._cameraName(entity),blocked:camera=>this._playbackBlocked(camera),active:!!this._attached&&!document.hidden,t:(nl,en)=>this._t(nl,en)});
  this._viewer.querySelector('.camera-viewer-position').textContent=(rows.indexOf(row)+1)+' / '+rows.length;
  for(const button of this._viewer.querySelectorAll('[data-camera-view-step]')){button.hidden=rows.length<2;button.querySelector('span').textContent=button.dataset.cameraViewStep==='-1'?this._t('Vorige camera','Previous camera'):this._t('Volgende camera','Next camera');}
 }
 _closeViewer(restore=true){
  if(!this._viewerEntity)return;
  const opener=this._viewerOpener;this._viewerEntity=null;this._viewerOpener=null;
  if(this.shadowRoot.fullscreenElement&&this._viewer?.contains(this.shadowRoot.fullscreenElement))document.exitFullscreen?.().catch(()=>{});
  this._viewerPicker?.stop();
  this._viewer?.close();
  const error=this._viewer?.querySelector('.camera-action-error');if(error)this._securityContent.append(error);
  const body=this._viewer?.querySelector('.camera-viewer-body');
  for(const section of [...(body?.children??[])])this.shadowRoot.querySelector('.camera-body')?.append(section);
  this._layoutKey=null;
  if(restore&&this._attached){this._render();(opener?.isConnected?opener:this.shadowRoot.querySelector('.camera-feature-toolbar select'))?.focus({preventScroll:true});}
 }
 _renderActions(){
  const node=this.shadowRoot.querySelector('.camera-actions'),single=['tabs','focus','doorbell'].includes(this._layout()),ids=new Set(visibleCameras(this._config).map(row=>row.entity));
  const actions=this._config.actions.filter(row=>!row.camera||(ids.has(row.camera)&&(!single||row.camera===this._activeCamera)));
  node.hidden=!actions.length||this._securityView!=='cameras';
  cameraReplaceMarkup(node,actions.map(action=>{let disabled=!!this._actionBusy||this._hass?.connected===false||this._hass?.connection?.connected===false;try{const request=cameraActionRequest(action,this._hass);if(request.entity&&!this._hass?.states?.[request.entity])disabled=true;}catch{disabled=true;}
   return uiButton({variant:'action',content:`<ha-icon icon="${uiEscape(action.icon)}" aria-hidden="true"></ha-icon><span>${uiEscape(action.name||this._hass?.states?.[action.entity]?.attributes?.friendly_name||action.service||this._t('Actie','Action'))}</span>`,disabled,attrs:{'data-camera-action':action.id}});
  }).join(''));
 }
 _activityName(event){
  if(['door','window'].includes(event.kind)){const row=[...this._config.door_sensors,...this._config.window_sensors].find(row=>row.entity===event.entity);return row?.name||this._hass?.states?.[event.entity]?.attributes?.friendly_name||event.entity;}
  return this._cameraName(event.camera)||this._t('Deurbel','Doorbell');
 }
 _activityType(event,types){
  if(event.kind==='door')return event.state==='on'?this._t('Deur geopend','Door opened'):this._t('Deur gesloten','Door closed');
  if(event.kind==='window')return event.state==='on'?this._t('Raam geopend','Window opened'):this._t('Raam gesloten','Window closed');
  return types[event.kind];
 }
 _eventTime(time){
  const options={timeZone:this._hass?.config?.time_zone},locale=cameraDutch(this._hass)?'nl-NL':'en-GB';
  const date=new Intl.DateTimeFormat(locale,{...options,day:'2-digit',month:'2-digit'}).format(new Date(time));
  const clock=new Intl.DateTimeFormat(locale,{...options,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time));
  return '<time datetime="'+new Date(time).toISOString()+'"><span>'+uiEscape(clock)+'</span><small>'+uiEscape(date)+'</small></time>';
 }
 _renderActivity(){
  if(!this._featureShell)return;
  const config=this._config,node=this.shadowRoot.querySelector('.camera-activity'),t=(a,b)=>this._t(a,b);
  node.hidden=!config.show_activity||this._securityView!=='activity';if(node.hidden)return;
  const sources=cameraActivitySources(config);
  const types={motion:t('Beweging gedetecteerd','Motion detected'),person:t('Persoon gedetecteerd','Person detected'),doorbell:t('Aangebeld','Doorbell'),door:t('Deuren','Doors'),window:t('Ramen','Windows')};
  const events=cameraVisibleEvents(config.activity_source==='history'?this._activity.events:this._activity.observed,config,{since:config.activity_source==='history'?Date.now()-config.activity_hours*3600000:0});
  this._activityPages??=new CameraActivityPages();
  const page=this._activityPages.view(events,config.activity_page_size,{since:config.activity_source==='history'?Date.now()-config.activity_hours*3600000:0});
  const empty=!sources.length?t('Koppel detectie-, deur- of raamsensoren in de kaartconfiguratie.','Configure detection, door or window sensors in the card settings.'):this._historyError?t('Geen waargenomen gebeurtenissen.','No observed events.'):config.activity_source==='session'?t('Nog geen gebeurtenissen sinds het openen van de kaart. Kies Geschiedenis in de configuratie voor eerdere activiteiten.','No events since opening the card. Select History in the settings for earlier activity.'):t('Geen gebeurtenissen.','No events.');
  cameraReplaceMarkup(node.querySelector('.camera-activity-list'),page.events.length?cameraActivityTimeline(page.events,{name:event=>this._activityName(event),type:event=>this._activityType(event,types),t,timeZone:this._hass?.config?.time_zone}):this._historyLoading&&!this._historyHasLoaded?'':'<p>'+empty+'</p>');
  const pagination=node.querySelector('.camera-activity-pagination');
  pagination.hidden=page.pages<=1;
  cameraReplaceMarkup(pagination,page.pages>1?`${page.hasNew?uiButton({variant:'action',text:t('Nieuwe activiteiten','New activity'),attrs:{'data-camera-activity-page':'latest',class:'camera-activity-latest'}}):''}<nav aria-label="${t('Activiteitenpagina’s','Activity pages')}">${uiButton({variant:'action',label:t('Vorige pagina','Previous page'),content:'<ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon><span>'+t('Vorige','Previous')+'</span>',disabled:page.page===1,attrs:{'data-camera-activity-page':'previous'}})}<span data-activity-page-status tabindex="-1" role="status">${page.page} ${t('van','of')} ${page.pages}</span>${uiButton({variant:'action',label:t('Volgende pagina','Next page'),content:'<span>'+t('Volgende','Next')+'</span><ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>',disabled:page.page===page.pages,attrs:{'data-camera-activity-page':'next'}})}</nav>`:'');
  node.querySelector('.camera-history-status').textContent=this._historyError?t('Geschiedenis niet beschikbaar. We proberen het automatisch opnieuw. Waargenomen detecties blijven zichtbaar.','History unavailable. Retrying automatically. Observed detections remain visible.'):this._historyLoading&&!this._historyHasLoaded&&!events.length?t('Geschiedenis laden…','Loading history…'):'';
 }
 async _loadHistory(force=false){
  const config=this._config;if(!config||!this._attached||!this._hass||this._hass.connected===false||this._hass.connection?.connected===false||!config.show_activity||config.activity_source!=='history'||this._historyLoading)return;
  const ids=[...new Set(cameraActivitySources(config).map(source=>source.entity))];if(!ids.length)return;
  const key=JSON.stringify([ids,config.activity_hours]);if(!force&&key===this._historyKey)return;
  this._historyKey=key;const version=++this._historyVersion,start=Date.now()-config.activity_hours*3600000,end=Date.now();this._historyLastAttempt=end;this._historyLoading=true;this._syncHistoryRefresh();this._renderActivity();
  try{
   if(typeof this._hass.callApi!=='function')throw Error('History API unavailable');
   const query=new URLSearchParams({filter_entity_id:ids.join(','),end_time:new Date(end).toISOString(),minimal_response:'',no_attributes:'',skip_initial_state:''});
   const response=await this._hass.callApi('GET','history/period/'+encodeURIComponent(new Date(start).toISOString())+'?'+query);
   if(version!==this._historyVersion)return;this._historyError=false;this._historyHasLoaded=true;const events=cameraHistoryEvents(response,config,start,end);this._activity.merge(events);this._activity.events=this._activity.events.filter(event=>event.time>=start);
   for(const event of events)if(['motion','person'].includes(event.kind))this._detections.set(event.entity,Math.max(this._detections.get(event.entity)??0,event.time));
  }catch{if(version===this._historyVersion)this._historyError=true;}
  finally{if(version===this._historyVersion){this._historyLoading=false;this._render();}}
 }
 _featureClick(event){
  const find=selector=>event.target.closest?.(selector),expand=find('[data-camera-expand]');
  const entity=find('[data-entity]');if(entity)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:entity.dataset.entity},bubbles:true,composed:true}));
  const view=find('[data-security-view]');if(view)this._selectSecurityView(view.dataset.securityView);
  const contacts=find('[data-security-contacts]');if(contacts)this._selectSecurityView(contacts.dataset.securityContacts);
  if(expand)this._openViewer(expand.dataset.cameraExpand,expand);
  if(find('[data-camera-view-close]'))this._closeViewer();
  const pick=find('[data-camera-view-pick]');if(pick&&this._viewerEntity&&visibleCameras(this._config).some(row=>row.entity===pick.dataset.cameraViewPick)){this._viewerEntity=pick.dataset.cameraViewPick;this._render();pick.focus({preventScroll:true});}
  const step=find('[data-camera-view-step]');if(step&&this._viewerEntity){const rows=visibleCameras(this._config),index=rows.findIndex(row=>row.entity===this._viewerEntity);this._viewerEntity=rows[(index+Number(step.dataset.cameraViewStep)+rows.length)%rows.length].entity;this._render();step.focus({preventScroll:true});}
  if(find('[data-camera-back]')){const saved=this._temporary?.restore;this._manualInteraction();this._expanded=saved?.expanded??false;this._activeCamera=saved?.camera??this._overviewCamera??this._config.default_camera;this._securityView=saved?.view??this._securityView;this._render();this.shadowRoot.querySelector('ha-card').scrollTop=saved?.scroll??this._overviewScroll??0;}
  const refresh=find('[data-camera-refresh]');if(refresh){const tile=this._tiles.get(refresh.dataset.cameraRefresh);if(tile){tile.manualSnapshot=true;this._syncPlayers();tile.snapshot.refresh();}}
  const privacy=find('[data-camera-privacy]');if(privacy){const row=this._config.cameras.find(row=>row.entity===privacy.dataset.cameraPrivacy);if(row?.privacy_entity&&!row.privacy_entity.startsWith('binary_sensor.')&&cameraPrivacy(this._hass,row)!=='privacy_unknown'){const active=cameraPrivacy(this._hass,row)==='privacy',target=active?(row.privacy_state==='off'?'on':'off'):(row.privacy_state??'on');this._requestAction({id:'privacy:'+row.entity,name:(active?this._t('Privacy uitschakelen: ','Disable privacy: '):this._t('Privacy inschakelen: ','Enable privacy: '))+this._cameraName(row.entity),entity:row.privacy_entity,action:'turn_'+target,confirmation:true,data:{}});}}
  const action=find('[data-camera-action]');if(action){const config=this._config.actions.find(row=>row.id===action.dataset.cameraAction);if(config)this._requestAction(config);}
  if(find('[data-camera-cancel]')){this._pendingAction=null;this.shadowRoot.querySelector('dialog').close();}
  if(find('[data-camera-confirm]')){const action=this._pendingAction;this._pendingAction=null;this.shadowRoot.querySelector('dialog').close();if(action)this._runAction(action);}
  const pageAction=find('[data-camera-activity-page]');if(pageAction){
   const config=this._config,since=config.activity_source==='history'?Date.now()-config.activity_hours*3600000:0;
   const events=cameraVisibleEvents(config.activity_source==='history'?this._activity.events:this._activity.observed,config,{since});
   if(pageAction.dataset.cameraActivityPage==='latest')this._activityPages.reset();
   else this._activityPages.move(pageAction.dataset.cameraActivityPage==='next'?1:-1,events,config.activity_page_size,{since});
   this._renderActivity();
   const next=this.shadowRoot.querySelector(`[data-camera-activity-page="${pageAction.dataset.cameraActivityPage}"]`);
   if(next&&!next.disabled)next.focus({preventScroll:true});else (this.shadowRoot.querySelector('[data-activity-page-status]')??this.shadowRoot.querySelector('[data-camera-activity]'))?.focus({preventScroll:true});
  }
  const activity=find('[data-camera-activity]');if(activity){const item=[...this._activity.events,...this._activity.observed].find(row=>row.id===activity.dataset.cameraActivity);if(item?.camera&&visibleCameras(this._config).some(row=>row.entity===item.camera)){this._openViewer(item.camera,activity);}else if(item)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:item.entity},bubbles:true,composed:true}));}
 }
 _requestAction(action){
  if(this._actionBusy)return;
  if(action.confirmation&&!(action.action==='more-info'&&!action.service)){
   this._pendingAction=action;const dialog=this.shadowRoot.querySelector('dialog');dialog.querySelector('h3').textContent=this._t('Actie bevestigen','Confirm action');dialog.querySelector('p').textContent=action.name||action.service||action.entity;dialog.querySelector('[data-camera-cancel]').textContent=this._t('Annuleren','Cancel');dialog.querySelector('[data-camera-confirm]').textContent=this._t('Uitvoeren','Run');if(!dialog.open)dialog.showModal();dialog.querySelector('[data-camera-cancel]').focus();
  }else this._runAction(action);
 }
 async _runAction(action){
  if(this._actionBusy||!this._attached)return;
  const status=this.shadowRoot.querySelector('.camera-action-error');status.hidden=true;this._actionBusy=true;this._renderActions();
  try{
   if(this._hass?.connected===false||this._hass?.connection?.connected===false)throw Error('Offline');
   const request=cameraActionRequest(action,this._hass);
   if(request.entity){if(!this._hass?.states?.[request.entity])throw Error('Missing');this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:request.entity},bubbles:true,composed:true}));}
   else await this._hass.callService(request.domain,request.service,request.data,request.target);
  }catch{status.textContent=this._t('Actie mislukt. Controleer de entiteit, actie en je Home Assistant-rechten.','Action failed. Check the entity, action and your Home Assistant permissions.');status.hidden=false;}
  finally{this._actionBusy=false;this._renderFeatures();}
 }
};
