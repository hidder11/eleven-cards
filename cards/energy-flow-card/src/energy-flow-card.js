import {uiMetricStyles} from '../../../shared/ui-metric.js';
import {energyFlowMetrics} from './energy-flow-metrics.js';
import {uiPrimaryValue,uiPrimaryValueStyles} from '../../../shared/ui-primary-value.js';
import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {headerAtmosphere,observeCardMotion} from '../../../shared/header-atmosphere.js';
import {cardHeaderStyles} from '../../../shared/card-header.js';
import {periodControls,periodControlsStyles,bindPeriodControls,disconnectPeriodControls} from '../../../shared/period-controls.js';
import {graphPeriodRange,connectTimeframeSync,disconnectTimeframeSync} from '../../../shared/periods.js';
import {weatherStyles} from '../../weather-card/src/weather-styles.js';
import {patchWeatherDOM} from '../../weather-card/src/weather-dom.js';
import {normalizeEnergyFlowConfig,energyFlowDutch,energyFlowSources,energyFlowStatisticIds,energyFlowLive,energyFlowHistorical,energyFlowStatisticsRequest} from './energy-flow-data.js';
import {energyFlowStyles} from './energy-flow-styles.js';
import {energyFlowDiagram} from './energy-flow-diagram.js';
import {EnergyFlowEditor} from './energy-flow-editor.js';

let energyFlowSequence=0;
export class EnergyFlowCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._id='energy-flow-'+(++energyFlowSequence);this._version=0;this._periodMode='today';this._statistics=null;}
 static getStubConfig(){return {default_view:'live'};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-energy-flow-editor'))customElements.define('eleven-energy-flow-editor',EnergyFlowEditor);
  return document.createElement('eleven-energy-flow-editor');
 }
 getCardSize(){return this._config?.compact?5:6;}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 setConfig(input){
  const previous=this._config,next=normalizeEnergyFlowConfig(input);this._config=next;
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
 disconnectedCallback(){this._attached=false;this._connected=false;this._timeframeKey=null;disconnectTimeframeSync(this);this._motionCleanup?.();this._motionCleanup=null;disconnectPeriodControls(this);this._reset();}
 _reset(){this._version++;clearTimeout(this._timer);this._timer=null;this._loading=false;this._prefs=null;this._statistics=null;this._error=null;this._requested=0;}
 _connectTimeframe(){
  this._connected=!!this._attached&&this._view==='history';
  const key=this._connected&&this._config?.sync_timeframe?(this._config.hover_sync_group?.trim()||'default'):null;
  if(key===this._timeframeKey)return;
  this._timeframeKey=key;connectTimeframeSync(this);
 }
 _reloadPeriod(){this._connectTimeframe();const range=graphPeriodRange(this);this._start=range.start;this._end=range.end;this._viewStart=range.start;this._viewEnd=range.end;this._status='ready';this._version++;this._loading=false;this._statistics=null;this._requested=0;this.render();this._sync();}
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
   if(JSON.stringify(prefs)!==JSON.stringify(this._prefs))this._statistics=null;
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
  const unit=history?'kWh':'kW',format=value=>{if(value==null)return '—';try{return new Intl.NumberFormat(this._hass?.locale?.language??this._hass?.language??'en',{maximumFractionDigits:2}).format(value);}catch{return String(value);}};
  const metrics=energyFlowMetrics(data,history,nl,format,config.compact,config);
  const sources=energyFlowSources(this._prefs),configured=Object.values(sources).some(list=>list.length),period=history?periodControls(this,nl?'nl':'en',{popupNavigation:true}):null;
  const focused=this.shadowRoot.activeElement?.dataset.viewButton;
  const switchButton=uiButton({text:history?text('Actueel','Live'):text('Historisch','History'),variant:'text',attrs:{'data-view-button':history?'live':'history','aria-label':history?text('Toon actueel vermogen','Show live power'):text('Toon historische energie','Show historical energy')}});
  const toolbar=`<div class="toolbar"><div class="header-actions"><div class="chart-controls" role="group" aria-label="${text('Weergave en tijdvak','View and timeframe')}"><div class="view-period">${switchButton}${history?period.picker:''}</div>${history?period.navigation:''}</div></div></div>`;
  let notice=offline?text('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'):this._error?text('Energy-gegevens laden mislukt. Controleer de Energy-configuratie en Recorder.','Could not load Energy data. Check Energy configuration and Recorder.'):!this._prefs?text('Energy-configuratie laden…','Loading Energy configuration…'):!configured?text('Stel elektriciteitsbronnen in via het Home Assistant Energy-dashboard.','Configure electricity sources in the Home Assistant Energy dashboard.'):this._loading&&history&&!this._statistics?text('Energiestatistieken laden…','Loading energy statistics…'):Object.values({solar:data.solar,import:data.import,export:data.export,home:data.home}).some(value=>value==null)?history?text('Niet alle energiestatistieken zijn beschikbaar voor deze periode.','Some energy statistics are unavailable for this period.'):text('Actueel vermogen ontbreekt. Stel vermogenssensoren in bij Energy of kies ze in de kaartconfiguratie.','Live power is missing. Configure power sensors in Energy or select them in the card editor.'):'';
  if(data.battery)notice+=(notice?' ':'')+text('Thuisbatterij meegerekend in woningverbruik.','Home consumption includes the battery balance.');
  patchWeatherDOM(this.shadowRoot,`<style>${cardHeaderStyles()}${periodControlsStyles()}${weatherStyles}${energyFlowStyles}${uiPrimaryValueStyles()}${uiMetricStyles()}</style><ha-card><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-view="${this._view}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&!this._error}" data-compact="${config.compact}" data-dark="${!!this._hass?.themes?.darkMode}"><div class="header-region"><div class="scene-background" aria-hidden="true">${headerAtmosphere(config.background)}</div>${toolbar}<div class="energy-heading">${uiPrimaryValue({value:data.home==null?null:format(data.home),unit,subtitle:config.title||text('Woningverbruik','Home consumption'),compact:config.compact,attrs:{'data-metric':'home','data-long':String(data.home!=null&&format(data.home).length>6)}})}</div>${energyFlowDiagram(data,history,nl,format)}${metrics.solar}</div>${metrics.grid}${notice?`<p class="notice" role="status">${uiEscape(notice)}</p>`:''}${this._error&&!offline?uiButton({text:text('Opnieuw proberen','Retry'),variant:'text',className:'retry',attrs:{'data-retry':true}}):''}</div></ha-card>`);
  if(!this._bound){this._bound=true;this.shadowRoot.addEventListener('click',event=>{
   const button=event.target.closest?.('[data-view-button]');
   if(button){if(button.dataset.viewButton===this._view)return;disconnectPeriodControls(this);this._periodMenuOpen=false;this._periodMenuPending=false;this._view=button.dataset.viewButton;this._reloadPeriod();}
   else if(event.target.closest?.('[data-retry]')){this._requested=0;this._sync();}
  });}
  bindPeriodControls(this);
  if(focused&&!this._periodMenuOpen)this.shadowRoot.querySelector('[data-view-button]')?.focus({preventScroll:true});
 }
}
