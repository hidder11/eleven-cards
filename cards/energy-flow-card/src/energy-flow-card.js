import {bindUITabs} from '../../../shared/ui-tabs.js';
import {energyFlowTabs,energyFlowTabStyles} from './energy-flow-tabs.js';
import {uiMetricStyles} from '../../../shared/ui-metric.js';
import {energyFlowMetrics} from './energy-flow-metrics.js';
import {uiPrimaryValue,uiPrimaryValueStyles} from '../../../shared/ui-primary-value.js';
import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {observeCardMotion} from '../../../shared/header-atmosphere.js';
import {cardHeaderStyles} from '../../../shared/card-header.js';
import {periodControls,periodControlsStyles,bindPeriodControls,disconnectPeriodControls} from '../../../shared/period-controls.js';
import {graphPeriodRange,connectTimeframeSync,disconnectTimeframeSync} from '../../../shared/periods.js';
import {weatherStyles} from '../../weather-card/src/weather-styles.js';
import {patchWeatherDOM} from '../../weather-card/src/weather-dom.js';
import {normalizeEnergyFlowConfig,energyFlowDutch,energyFlowSources,energyFlowStatisticIds,energyFlowLive,energyFlowHistorical,energyFlowStatisticsRequest} from './energy-flow-data.js';
import {energyFlowBackground,energyFlowBackgroundStyles} from './energy-flow-backgrounds.js';
import {energyFlowStyles} from './energy-flow-styles.js';
import {energyFlowDiagram} from './energy-flow-diagram.js';
import {EnergyFlowEditor} from './energy-flow-editor.js';
import {bindUIPopup} from '../../../shared/ui-popup.js';
import {energyFlowDetailIds,energyFlowGridMeters} from './energy-flow-details-data.js';
import {energyFlowDetailContent,energyFlowDetailPopup,energyFlowDetailStyles} from './energy-flow-details.js';
import {energyFlowBaseConsumption} from './energy-flow-insights.js';

let energyFlowSequence=0;
export class EnergyFlowCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._id='energy-flow-'+(++energyFlowSequence);this._version=0;this._periodMode='today';this._statistics=null;}
 static getStubConfig(){return {default_view:'live'};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-energy-flow-editor'))customElements.define('eleven-energy-flow-editor',EnergyFlowEditor);
  return document.createElement('eleven-energy-flow-editor');
 }
 getCardSize(){const config=this._config,hasTabs=(config?.detail_view==='tabs'&&config.tabs.length)||config?.custom_tabs?.some(tab=>tab.show);return (config?.compact?5:6)+(hasTabs?4:0);}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 setConfig(input){
  const previous=this._config,next=normalizeEnergyFlowConfig(input);this._config=next;
  if(!previous||previous.default_tab!==next.default_tab||previous.detail_view!==next.detail_view)this._activeTab=next.default_tab;
  if(previous?.detail_view!==next.detail_view)this._dismissDetails();
  const changedGroup=previous&&(previous.sync_timeframe!==next.sync_timeframe||previous.hover_sync_group!==next.hover_sync_group);
  if(changedGroup)this._sharedTimeframe=null;
  const changedView=!previous||previous.default_view!==next.default_view;
  if(changedView)this._view=next.default_view;
  if(!previous||changedView||changedGroup||previous.hours_to_show!==next.hours_to_show)this._reloadPeriod();else this.render();
  this._sync();
 }
 set hass(hass){const changed=this._hass?.connection!==hass?.connection||this._offline()!==(hass?.connected===false||hass?.connection?.connected===false);this._hass=hass;if(changed)this._reset();this.render();this._sync();}
 get hass(){return this._hass;}
 _offline(){return this._hass?.connected===false||this._hass?.connection?.connected===false;}
 connectedCallback(){this._attached=true;this._connectTimeframe();if(this._view==='history')this._reloadPeriod();this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>this._sync());this.render();this._sync();}
 disconnectedCallback(){this._tabController?.disconnect();this._attached=false;this._connected=false;this._timeframeKey=null;disconnectTimeframeSync(this);this._motionCleanup?.();this._motionCleanup=null;disconnectPeriodControls(this);this._reset();}
 _reset(){this._dismissDetails();this._baseVersion=(this._baseVersion??0)+1;this._baseResult=null;this._basePendingKey=null;this._detailVersion=(this._detailVersion??0)+1;this._detailResult=null;this._detailLoading=false;this._detailError=false;this._detailInfo=null;this._version++;clearTimeout(this._timer);this._timer=null;this._loading=false;this._prefs=null;this._statistics=null;this._error=null;this._requested=0;}
 _connectTimeframe(){
  this._connected=!!this._attached&&this._view==='history';
  const key=this._connected&&this._config?.sync_timeframe?(this._config.hover_sync_group?.trim()||'default'):null;
  if(key===this._timeframeKey)return;
  this._timeframeKey=key;connectTimeframeSync(this);
 }
 _reloadPeriod(){this._detailVersion=(this._detailVersion??0)+1;this._detailResult=null;this._detailLoading=false;this._detailError=false;this._connectTimeframe();const range=graphPeriodRange(this);this._start=range.start;this._end=range.end;this._viewStart=range.start;this._viewEnd=range.end;this._status='ready';this._version++;this._loading=false;this._statistics=null;this._requested=0;this.render();this._sync();}
 _dismissDetails(){
  this._detailNode=null;
  for(const binding of Object.values(this._detailBindings??{})){binding.close();binding.disconnect();}
  this._detailBindings={};
 }
 _refreshDetailContent(){
  const focusedSort=this.shadowRoot.activeElement?.matches?.('[data-energy-device-sort]');
  const focusedDevice=this.shadowRoot.activeElement?.closest?.('[data-device-stat]')?this.shadowRoot.activeElement?.dataset.entity:null;
  for(const popup of this.shadowRoot.querySelectorAll('[data-energy-popup],[data-energy-panel]')){
   const body=popup.querySelector('.energy-detail-body');
   body.innerHTML=energyFlowDetailContent(this,popup.dataset.energyPopup??popup.dataset.energyPanel,this._displayData??{});
   body.setAttribute('aria-busy',String(this._view==='history'&&!!this._detailLoading));
  }
  // Opening a controller can synchronously refresh loading content. Position
  // afterwards so native showPopover is never re-entered during that open.
  queueMicrotask(()=>this._detailBindings?.[this._detailNode]?.position());
  if(focusedSort)this.shadowRoot.querySelector('[data-energy-device-sort]')?.focus({preventScroll:true});
  if(focusedDevice)[...this.shadowRoot.querySelectorAll('[data-device-stat] [data-entity]')].find(button=>button.dataset.entity===focusedDevice)?.focus({preventScroll:true});
 }
 async _loadBaseConsumption(){
  if(!this._prefs||this._offline()||!this._attached||document.hidden||this.hasAttribute('data-motion-paused'))return;
  const end=Math.floor(Math.min(this._view==='history'?this._end:Date.now(),Date.now())/3600000)*3600000;
  const key=JSON.stringify([end,this._prefs,this._hass?.config?.time_zone]);
  if(this._basePendingKey===key||this._baseResult?.key===key)return;
  const ids=energyFlowStatisticIds(this._prefs);if(!ids.length)return;
  const prefs=this._prefs,zone=this._hass?.config?.time_zone??'UTC',version=this._baseVersion=(this._baseVersion??0)+1;
  this._basePendingKey=key;this._baseResult=null;
  try{
   const statistics=await this._request({type:'recorder/statistics_during_period',start_time:new Date(end-8*86400000).toISOString(),end_time:new Date(end).toISOString(),statistic_ids:ids,period:'hour',units:{energy:'kWh'},types:['change']});
   if(version===this._baseVersion&&this._attached)this._baseResult={key,value:energyFlowBaseConsumption(prefs,statistics,zone,end)};
  }catch{if(version===this._baseVersion)this._baseResult=null;}
  finally{if(version===this._baseVersion){this._basePendingKey=null;this._refreshDetailContent();}}
 }
 async _loadDetails(){
  if(this._detailNode==='home'||this._config.detail_view==='tabs'&&this._activeTab==='home')this._loadBaseConsumption();
  if(this._view!=='history'||!this._prefs||this._offline()){this._refreshDetailContent();return;}
  if(!this._attached||document.hidden||this.hasAttribute('data-motion-paused'))return;
  const key=JSON.stringify([this._start,this._end,this._prefs]);
  if(this._detailLoading&&this._detailPendingKey===key)return;
  if(this._detailResult?.key===key&&Date.now()-this._detailResult.time<60000){this._refreshDetailContent();return;}
  const version=this._detailVersion=(this._detailVersion??0)+1,prefs=this._prefs,start=this._start,end=Math.min(this._end,Date.now());
  this._detailLoading=true;this._detailError=false;this._detailPendingKey=key;this._refreshDetailContent();
  try{
   const info=this._detailInfo??await this._request({type:'energy/info'});
   const ids=energyFlowDetailIds(prefs,info),costIds=[...new Set(energyFlowGridMeters(prefs).map(m=>m.cost||info.cost_sensors?.[m.energy]).filter(Boolean))];
   const results=await Promise.all([
    ids.length?this._request({type:'recorder/statistics_during_period',start_time:new Date(start).toISOString(),end_time:new Date(end).toISOString(),statistic_ids:ids,period:'hour',units:{energy:'kWh'},types:['change']}):{},
    costIds.length?this._request({type:'recorder/get_statistics_metadata',statistic_ids:costIds}).catch(()=>[]):[],
   ]);
   if(version!==this._detailVersion||!this._attached)return;
   this._detailInfo=info;
   const metadata=Object.fromEntries((Array.isArray(results[1])?results[1]:[]).map(item=>[item.statistic_id,item]));
   this._detailResult={key,time:Date.now(),statistics:results[0],metadata,info};
  }catch{if(version===this._detailVersion)this._detailError=true;}
  finally{if(version===this._detailVersion){this._detailLoading=false;this._refreshDetailContent();}}
 }
 _bindDetails(){
  if(this._config.detail_view==='tabs')return;
  const open=this._detailNode;
  for(const kind of ['home','grid','sun']){
   const trigger=this.shadowRoot.querySelector(`[data-energy-detail=${kind}]`),popup=this.shadowRoot.querySelector(`[data-energy-popup=${kind}]`);
   let controller;
   controller=bindUIPopup({trigger,popup,container:popup,align:'center',
    topBoundary:()=>Math.max(8,(this.shadowRoot.querySelector('.toolbar')?.getBoundingClientRect().bottom??0)+8),
    keepOpenOnOutside:event=>event.composedPath().some(node=>node?.getRootNode?.()===this.shadowRoot&&node.matches?.('.toolbar,.period-menu,[data-energy-detail]')),
    isRequested:()=>this._detailNode===kind,isCurrent:()=>this._detailBindings?.[kind]===controller,
    beforeOpen:()=>{for(const [name,binding] of Object.entries(this._detailBindings??{}))if(name!==kind)binding.close();},
     onOpen:()=>{this._detailNode=kind;this._loadDetails();},
    onClose:()=>{if(this._detailNode===kind)this._detailNode=null;},
   });
   this._detailBindings??={};this._detailBindings[kind]=controller;
  }
  // Let closed period menus and replaced popup nodes leave the native top layer
  // before restoring the requested detail popup.
  if(open){const binding=this._detailBindings[open];requestAnimationFrame(()=>{if(this._detailBindings[open]===binding&&this._detailNode===open)binding.open(false);});}
 }
 async _request(message){let timer;try{return await Promise.race([Promise.resolve().then(()=>this._hass.callWS(message)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),15000);})]);}finally{clearTimeout(timer);}}
 _sync(){
  clearTimeout(this._timer);this._timer=null;
  if(!this._attached||!this._config||!this._hass||this._offline()||document.hidden||this.hasAttribute('data-motion-paused')||this._loading)return;
  const interval=this._view==='history'?60000:300000,elapsed=Date.now()-(this._requested??0);
  if(elapsed<interval){this._timer=setTimeout(()=>this._sync(),interval-elapsed);return;}
  if(typeof this._hass.callWS!=='function')return;
  const version=++this._version;this._loading=true;this._error=null;this._requested=Date.now();this.render();
  (async()=>{
   // Refresh preferences periodically so edits in HA Energy are picked up too.
   const prefs=await this._request({type:'energy/get_prefs'});
   if(version!==this._version||!this._attached)return;
   if(!Array.isArray(prefs?.energy_sources))throw Error('invalid preferences');
   if(JSON.stringify(prefs)!==JSON.stringify(this._prefs)){this._statistics=null;this._detailResult=null;this._detailInfo=null;this._detailVersion=(this._detailVersion??0)+1;this._detailLoading=false;}
   this._prefs=prefs;
   if(this._view==='history'){
    const range=graphPeriodRange(this);this._start=range.start;this._end=range.end;this._viewStart=range.start;this._viewEnd=range.end;
    const request=energyFlowStatisticsRequest(prefs,range.start,range.end);
    const statistics=request.statistic_ids.length?await this._request(request):{};
    if(version!==this._version||!this._attached)return;
    this._statistics=statistics;
   }
  })().catch(()=>{if(version===this._version){this._error=true;this._statistics=null;}}).finally(()=>{
   if(version!==this._version)return;this._loading=false;this.render();this._sync();
  });
 }
 render(){
  if(!this._config)return;
  const config=this._config,nl=energyFlowDutch(this._hass),text=(a,b)=>nl?a:b,history=this._view==='history',offline=this._offline();
  const empty={solar:null,import:null,export:null,home:null},data=offline||!this._prefs||this._error||!Object.values(energyFlowSources(this._prefs)).some(list=>list.length)?empty:history?(this._statistics?energyFlowHistorical(this._prefs,this._statistics):empty):energyFlowLive(this._prefs,this._hass,config);
  const unit=history?'kWh':'kW',format=value=>{if(value==null)return '—';try{return new Intl.NumberFormat(this._hass?.locale?.language??this._hass?.language??'en',{maximumFractionDigits:2}).format(value);}catch{return new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(value);}};
  const metrics=energyFlowMetrics(data,history,nl,format,config.compact,config);
  const sources=energyFlowSources(this._prefs),configured=Object.values(sources).some(list=>list.length),period=history?periodControls(this,nl?'nl':'en',{popupNavigation:true,tabVariant:'card'}):null;
  const focusedTab=this.shadowRoot.activeElement?.dataset.uiTab,focusedEntity=this.shadowRoot.activeElement?.dataset.entity;
  this._tabController?.disconnect();
  const focused=this.shadowRoot.activeElement?.dataset.viewButton;
  const focusedDetail=this.shadowRoot.activeElement?.dataset.energyDetail;
  const active=this.shadowRoot.activeElement;
  const focusedPopupControl=active?.hasAttribute('data-ui-popup-close')?'[data-ui-popup-close]':active?.hasAttribute('data-detail-retry')?'[data-detail-retry]':null;
  const openedDetail=this._detailNode,detailScroll=this.shadowRoot.querySelector(`[data-energy-popup=${openedDetail}]`)?.scrollTop??0;
  for(const binding of Object.values(this._detailBindings??{})){binding.disconnect();binding.close();}
  this._detailBindings={};this._detailNode=openedDetail;
  // Recreate closed native popovers before patching their bodies. Reusing a
  // focused top-layer node across period changes can stall Chromium layout.
  for(const popup of this.shadowRoot.querySelectorAll('[data-energy-popup]'))popup.remove();
  this._displayData=data;
  const tabs=energyFlowTabs(this,data,nl);
  const details=(config.detail_view==='tabs'?'':['home','grid','sun'].map(kind=>energyFlowDetailPopup(this,kind,data,{id:this._id+'-detail-'+kind})).join(''));
  const switchButton=uiButton({text:history?text('Actueel','Live'):text('Historisch','History'),variant:'text',attrs:{'data-view-button':history?'live':'history','aria-label':history?text('Toon actueel vermogen','Show live power'):text('Toon historische energie','Show historical energy')}});
  const toolbar=`<div class="toolbar"><div class="header-actions"><div class="chart-controls" role="group" aria-label="${text('Weergave en tijdvak','View and timeframe')}"><div class="view-period">${switchButton}${history?period.picker:''}</div>${history?period.navigation:''}</div></div></div>`;
  let notice=offline?text('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'):this._error?text('Energy-gegevens laden mislukt. Controleer de Energy-configuratie en Recorder.','Could not load Energy data. Check Energy configuration and Recorder.'):!this._prefs?text('Energy-configuratie laden…','Loading Energy configuration…'):!configured?text('Stel elektriciteitsbronnen in via het Home Assistant Energy-dashboard.','Configure electricity sources in the Home Assistant Energy dashboard.'):this._loading&&history&&!this._statistics?text('Energiestatistieken laden…','Loading energy statistics…'):Object.values({solar:data.solar,import:data.import,export:data.export,home:data.home}).some(value=>value==null)?history?text('Niet alle energiestatistieken zijn beschikbaar voor deze periode.','Some energy statistics are unavailable for this period.'):text('Actueel vermogen ontbreekt. Stel vermogenssensoren in bij Energy of kies ze in de kaartconfiguratie.','Live power is missing. Configure power sensors in Energy or select them in the card editor.'):'';
  if(data.battery)notice+=(notice?' ':'')+text('Thuisbatterij meegerekend in woningverbruik.','Home consumption includes the battery balance.');
  patchWeatherDOM(this.shadowRoot,`<style>${cardHeaderStyles()}${periodControlsStyles()}${weatherStyles}${energyFlowStyles}${energyFlowBackgroundStyles}${energyFlowDetailStyles}${energyFlowTabStyles}${uiPrimaryValueStyles()}${uiMetricStyles()}</style><ha-card><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-view="${this._view}" data-color="${config.color}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&!this._error}" data-compact="${config.compact}" data-dark="${!!this._hass?.themes?.darkMode}"><div class="header-region"><div class="scene-background" aria-hidden="true">${energyFlowBackground(config.background)}</div>${toolbar}<div class="energy-heading">${uiPrimaryValue({value:data.home==null?null:format(data.home),unit,subtitle:config.title||text('Woningverbruik','Home consumption'),compact:config.compact,attrs:{'data-metric':'home','data-long':String(data.home!=null&&format(data.home).length>6)}})}</div>${energyFlowDiagram(data,history,nl,format,{detailView:config.detail_view,tabs:config.tabs,id:this._id})}${metrics.solar}</div>${metrics.grid}${notice?`<p class="notice" role="status">${uiEscape(notice)}</p>`:''}${this._error&&!offline?uiButton({text:text('Opnieuw proberen','Retry'),variant:'text',className:'retry',attrs:{'data-retry':true}}):''}${tabs}${details}</div></ha-card>`);
  if(!this._bound){this._bound=true;this.shadowRoot.addEventListener('click',event=>{
   const entity=event.target.closest?.('[data-entity]');
   if(entity){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:entity.dataset.entity},bubbles:true,composed:true}));return;}
   const endpoint=event.target.closest?.('[data-energy-detail]');
   if(endpoint&&this._config.detail_view==='tabs'){
    const kind=endpoint.dataset.energyDetail;
    if(this._config.tabs.includes(kind)){this._activeTab=kind;this._tabController?.select(kind,{focus:true});this._loadDetails();}
    return;
   }
   const button=event.target.closest?.('[data-view-button]');
   if(button){if(button.dataset.viewButton===this._view)return;disconnectPeriodControls(this);this._periodMenuOpen=false;this._periodMenuPending=false;this._view=button.dataset.viewButton;this._reloadPeriod();}
   else if(event.target.closest?.('[data-detail-retry]')){this._detailResult=null;this._loadDetails();}
   else if(event.target.closest?.('[data-retry]')){this._requested=0;this._sync();}
  });this.shadowRoot.addEventListener('change',event=>{if(event.target.matches?.('[data-energy-device-sort]')){this._deviceSort=event.target.value==='cost'?'cost':'energy';this._refreshDetailContent();}});this.shadowRoot.addEventListener('keydown',event=>{if(event.key==='Escape'&&this._detailNode&&!this._periodMenuOpen){event.preventDefault();event.stopPropagation();this._detailBindings[this._detailNode]?.close(true);}});}
  this._tabController=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-energy-tabs] [data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-energy-tabs] [data-ui-tab-panel]'),onSelect:value=>{this._activeTab=value;this.render();}});
  if(focusedTab)([...this.shadowRoot.querySelectorAll('[data-energy-tabs] [data-ui-tab]')].find(tab=>tab.dataset.uiTab===focusedTab)??this.shadowRoot.querySelector('[data-energy-tabs] [aria-selected=true]'))?.focus({preventScroll:true});
  if(focusedEntity)[...this.shadowRoot.querySelectorAll('[data-entity]')].find(button=>button.dataset.entity===focusedEntity)?.focus({preventScroll:true});
  this._bindDetails();
  if(this._config.detail_view==='tabs'&&this._config.tabs.includes(this._activeTab))this._loadDetails();
  bindPeriodControls(this);
  if(openedDetail&&config.detail_view!=='tabs'){const popup=this.shadowRoot.querySelector(`[data-energy-popup=${openedDetail}]`);requestAnimationFrame(()=>{if(!popup.isConnected||this._detailNode!==openedDetail)return;popup.scrollTop=detailScroll;if(focusedPopupControl)popup.querySelector(focusedPopupControl)?.focus({preventScroll:true});else if(focusedEntity)[...popup.querySelectorAll('[data-entity]')].find(button=>button.dataset.entity===focusedEntity)?.focus({preventScroll:true});});}
  if(focusedDetail&&!openedDetail)this.shadowRoot.querySelector(`[data-energy-detail=${focusedDetail}]`)?.focus({preventScroll:true});
  if(focused&&!this._periodMenuOpen)this.shadowRoot.querySelector('[data-view-button]')?.focus({preventScroll:true});
 }
}
