import {uiPrimaryValue,uiPrimaryValueStyles} from '../../../shared/ui-primary-value.js';
import {uiMetric,uiMetricStyles} from '../../../shared/ui-metric.js';
import {uiEscape,uiButtonStyles} from '../../../shared/ui-button.js';
import {uiTabs,bindUITabs,uiTabsStyles} from '../../../shared/ui-tabs.js';
import {normalizeWeatherConfig,weatherDutch,weatherCondition,weatherNumber,weatherForecastType,weatherForecastRows,weatherDate,weatherVisibleTabs,weatherField,WEATHER_FORECAST_FIELDS,weatherForecastFields} from './weather-utils.js';
import {WeatherEditor} from './weather-editor.js';
import {weatherArt} from './weather-art.js';
import {weatherStyles} from './weather-styles.js';
import {weatherAtmosphere} from './weather-atmosphere.js';
import {patchWeatherDOM} from './weather-dom.js';
import {observeCardMotion} from '../../../shared/header-atmosphere.js';

export class WeatherCard extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._forecast=[];this._iconCache=new Map();}
 static async getConfigElement(){if(!customElements.get('eleven-weather-editor'))customElements.define('eleven-weather-editor',WeatherEditor);return document.createElement('eleven-weather-editor');}
 static getStubConfig(hass){return {entity:Object.keys(hass?.states??{}).find(id=>id.startsWith('weather.'))??'',tabs:['hourly','daily']};}
 setConfig(config){
  const next=normalizeWeatherConfig(config),previous=this._config;
  if(!previous||previous.entity!==next.entity||previous.forecast_type!==next.forecast_type||!weatherVisibleTabs(next).includes(this._forecastSelection))this._forecastSelection=null;
  this._config=next;this._syncForecast();this._ensureForecastClock();this._render();
 }
 set hass(hass){this._hass=hass;this._syncForecast();this._render();}
 get hass(){return this._hass;}
 connectedCallback(){this._attached=true;this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>{this._ensureForecastClock();this._render();});this._syncForecast();this._ensureForecastClock();this._render();}
 disconnectedCallback(){this._attached=false;this._motionCleanup?.();this._motionCleanup=null;clearInterval(this._forecastClock);this._forecastClock=null;this._stopForecast();this._tabs?.disconnect();this._key=null;}
 _ensureForecastClock(){
  const active=this._attached&&!!this._config?.entity&&this._forecastEnabled()&&(typeof document==='undefined'||!document.hidden);
  if(!active){clearInterval(this._forecastClock);this._forecastClock=null;return;}
  if(!this._forecastClock){this._forecastClock=setInterval(()=>this._render(),60000);this._forecastClock.unref?.();}
 }
 _weatherArt(kind,style,iconKind,slot){
  const signature=kind+'|'+style+'|'+iconKind,cached=this._iconCache.get(slot);
  if(cached?.signature===signature)return cached.markup;
  const markup=weatherArt(kind,style,iconKind);this._iconCache.set(slot,{signature,markup});
  if(this._iconCache.size>32)this._iconCache.delete(this._iconCache.keys().next().value);
  return markup;
 }
 getCardSize(){return (this._forecastEnabled()?9:7)-(this._config?.compact?1:0);}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 _offline(){return this._hass?.connected===false||this._hass?.connection?.connected===false;}
 _forecastEnabled(){return weatherVisibleTabs(this._config).length>0;}
 _stopForecast(){this._generation++;try{this._unsubscribe?.();}catch{}this._unsubscribe=null;}
 _statusMarkup(attributes,available,state,nl){
  const metric=weatherField(this._config,'metric_status',attributes,this._hass,available);if(!metric)return '';
  const condition=this._config.metric_status==='condition',id=metric.entity||(this._config.metric_status==='custom'?'':this._config.entity);
  const label=condition?this._config.metric_status_label:metric.label;
  const plain=weatherField({...this._config,metric_status_show_unit:false},'metric_status',attributes,this._hass,available),split=metric.value.startsWith(plain.value);
  const value=plain.value==='\u2014'?null:split?plain.value:metric.value,unit=split?metric.value.slice(plain.value.length).trim():'';
  const icon=this._config.metric_status_icon?`<ha-icon icon="${uiEscape(this._config.metric_status_icon)}"></ha-icon>`:this._weatherArt(state.kind,this._config.icon_style,state.iconKind,'status');
  return uiMetric({title:label||metric.label,value,unit,iconContent:icon,compact:this._config.compact,action:!!id,info:this._offline()?(nl?'Geen verbinding · laatst ontvangen gegevens':'Offline · last received readings'):'',attrs:{class:'weather-status', 'data-status-entity':id||'', 'aria-label':(label?label+': ':'')+metric.value}});
 }
 _metricsMarkup(attributes,available){
  const icons={wind_speed:'mdi:weather-windy',humidity:'mdi:water-percent',pressure:'mdi:gauge',visibility:'mdi:eye-outline',uv_index:'mdi:sun-wireless-outline',cloud_coverage:'mdi:weather-cloudy',wind_gust_speed:'mdi:weather-windy',dew_point:'mdi:thermometer-water',temperature:'mdi:thermometer'};
  const metrics=['metric_primary','metric_secondary'].map(field=>{
   const metric=weatherField(this._config,field,attributes,this._hass,available);if(!metric)return '';
   const plain=weatherField({...this._config,[field+'_show_unit']:false},field,attributes,this._hass,available),split=metric.value.startsWith(plain.value);
   return uiMetric({title:metric.label,value:plain.value==='\u2014'?null:split?plain.value:metric.value,unit:split?metric.value.slice(plain.value.length).trim():'',icon:this._config[field+'_icon']||icons[this._config[field]]||'mdi:chart-box-outline',compact:this._config.compact,action:!!(metric.entity||(this._config[field]==='custom'?'':this._config.entity)),attrs:{'data-entity':metric.entity||(this._config[field]==='custom'?'':this._config.entity)||'','data-weather-field':field}});
  }).filter(Boolean);
  return metrics.length?'<div class="weather-metrics" data-ui-metric-grid style="--ui-metric-columns:'+metrics.length+'">'+metrics.join('')+'</div>':'';
 }
 _syncForecast(){
  if(!this._config||!this._hass||!this._attached)return;
  const entity=this._hass.states?.[this._config.entity],type=this._forecastSelection??weatherForecastType(this._config,entity),connection=this._hass.connection;
  const key=JSON.stringify([this._config.entity,type,this._forecastEnabled(),this._offline()]);
  if(this._key===key&&this._connection===connection)return;
  this._stopForecast();this._key=key;this._connection=connection;
  this._forecast=[];this._forecastStatus='loading';this._forecastType=type;
  if(!this._forecastEnabled()||!this._config.entity||this._offline())return;
  if(typeof connection?.subscribeMessage!=='function'){this._forecastStatus='error';return;}
  const generation=this._generation;
  const fail=()=>{if(!this._attached||generation!==this._generation)return;this._forecastStatus='error';this._render();};
  try {
   Promise.resolve(connection.subscribeMessage(payload=>{
    if(!this._attached||generation!==this._generation)return;
    this._forecastStatus=Array.isArray(payload?.forecast)?'ready':'error';
    this._forecast=Array.isArray(payload?.forecast)?payload.forecast:[];this._render();
   },{type:'weather/subscribe_forecast',entity_id:this._config.entity,forecast_type:type})).then(unsubscribe=>{
    if(typeof unsubscribe!=='function')return;
    if(!this._attached||generation!==this._generation){try{unsubscribe();}catch{}}else this._unsubscribe=unsubscribe;
   },fail);
  }catch{fail();}
 }
 _forecastMarkup(nl,attributes){
  if(!this._forecastEnabled())return '';
  const heading=this._forecastType==='daily'?(nl?'Komende dagen':'Coming days'):(nl?'Komende uren':'Coming hours');
  const rows=weatherForecastRows(this._forecast,this._config.forecast_count,Date.now(),this._forecastType,this._hass);
  let body;
  if(this._offline())body=`<p class="notice">${nl?'Verwachting niet beschikbaar zonder verbinding.':'Forecast unavailable while offline.'}</p>`;
  else if(this._forecastStatus==='error')body=`<p class="notice" role="status">${nl?'Verwachting niet beschikbaar.':'Forecast unavailable.'}</p><button class="retry">${nl?'Opnieuw proberen':'Retry'}</button>`;
  else if(this._forecastStatus==='loading')body=`<p class="notice" role="status">${nl?'Verwachting laden…':'Loading forecast…'}</p>`;
  else if(!rows.length)body=`<p class="notice">${nl?'Geen verwachting beschikbaar.':'No forecast available.'}</p>`;
  else body=`<ol class="forecast-list" tabindex="0" aria-label="${heading}">${rows.map(row=>{
   const state=weatherCondition(row.condition,nl);
   const when=weatherDate(row.datetime,this._hass,this._forecastType);
   const fields=weatherForecastFields(this._config,this._forecastType).map(key=>{
    if(key==='condition')return '<span data-forecast-field="condition" role="img" aria-label="'+uiEscape(state.label)+'">'+this._weatherArt(state.kind,this._config.icon_style,state.iconKind,row.datetime)+'</span>';
    if(key==='templow'&&this._forecastType!=='daily')return '';
    const units={temperature:attributes.temperature_unit||'°C',templow:attributes.temperature_unit||'°C',precipitation_probability:'%',precipitation:attributes.precipitation_unit||'',wind_speed:attributes.wind_speed_unit||'',wind_gust_speed:attributes.wind_speed_unit||'',humidity:'%',uv_index:''};
    const label=WEATHER_FORECAST_FIELDS[key][nl?0:1],value=weatherNumber(row[key],this._hass,units[key],this._config['forecast_'+this._forecastType+'_'+key+'_decimals']??(['precipitation','wind_speed','wind_gust_speed','uv_index'].includes(key)?1:0));
    const className=key==='temperature'?'forecast-value':key==='templow'?'forecast-low':key==='precipitation_probability'?'rain-chance':'forecast-extra';
    return '<div class="'+className+'" data-forecast-field="'+key+'" aria-label="'+uiEscape(label)+'" title="'+uiEscape(label)+'">'+(!['temperature','templow','precipitation_probability'].includes(key)?'<span class="forecast-label">'+uiEscape(label)+'</span>':'')+uiEscape(value)+'</div>';
   }).join('');
   return '<li data-weather-key="'+uiEscape(row.datetime)+'"><time datetime="'+uiEscape(row.datetime)+'">'+uiEscape(when)+'</time>'+fields+'</li>';
  }).join('')}</ol>`;
  if(weatherVisibleTabs(this._config).length===1)return `<section class="forecast" aria-label="${heading}">${body}</section>`;
  const items=[{value:'hourly',label:nl?'Per uur':'Hourly'},{value:'daily',label:nl?'Per dag':'Daily'}].filter(item=>weatherVisibleTabs(this._config).includes(item.value)).map(item=>({...item,content:item.value===this._forecastType?body:''}));
  return `<section class="forecast" aria-label="${nl?'Weersverwachting':'Weather forecast'}">${uiTabs({id:'weather-forecast',label:nl?'Weersverwachting':'Weather forecast',items,selected:this._forecastType,panelClassName:'forecast-panel'})}</section>`;
 }
 _render(){
  if(!this._config)return;
  const hass=this._hass,nl=weatherDutch(hass),entity=hass?.states?.[this._config.entity],attributes=entity?.attributes??{};
  const available=entity&&!['unknown','unavailable'].includes(entity.state),state=weatherCondition(available?entity.state:'unknown',nl);
  const signature=JSON.stringify([this._config,entity,weatherForecastRows(this._forecast,this._config.forecast_count,Date.now(),this._forecastType,hass),this._forecastStatus,this._forecastType,hass?.themes?.darkMode,hass?.locale,hass?.language,hass?.config?.time_zone,this._offline(),...['metric_status','metric_primary','metric_secondary'].map(field=>this._config[field]==='custom'?hass?.states?.[this._config[field+'_entity']]:null)]);
  if(signature===this._signature)return;this._signature=signature;
  const focusedTab=this.shadowRoot.activeElement?.dataset?.uiTab;
  const focusedEntity=this.shadowRoot.activeElement?.dataset?.entity,focusedStatus=this.shadowRoot.activeElement?.classList.contains('weather-status');
  const number=(value,unit='',digits=0)=>weatherNumber(available?value:null,hass,unit,digits);
  const unit=attributes.temperature_unit||'°C';
  patchWeatherDOM(this.shadowRoot,`<style>${uiButtonStyles()}${uiTabsStyles()}${weatherStyles}${uiPrimaryValueStyles()}${uiMetricStyles()}
.weather-status{margin-top:16px}.weather-metrics{margin:0}.header-region{--ui-metric-tone:var(--tone)}.content:not(:has(.weather-metrics)) .scene{padding-bottom:0}.content[data-compact=true] .weather-status{margin-top:12px}.hero{padding-top:0;grid-template-columns:minmax(0,1fr)}.hero .temperature{max-width:50%;position:relative;z-index:1}.content[data-icon-style] .hero>.art{inset:0 auto 0 50%;width:50%;transform:translate(calc(-50% + var(--weather-icon-x,0px)),var(--weather-icon-y,0px)) scale(var(--weather-icon-scale,1));transform-origin:center;min-width:0}.hero .art svg{max-width:100%}.hero .temperature{margin-top:0;font-size:inherit;letter-spacing:inherit}.content[data-compact=true] .hero .temperature{margin-top:0}
</style><ha-card aria-label="${uiEscape(this._config.title||(nl?'Het weer':'Weather'))}"><div class="content" style="--header-background-opacity:${this._config.background_strength/100};--weather-icon-scale:${this._config.icon_scale/100};--weather-icon-x:${this._config.icon_offset_x}px;--weather-icon-y:${this._config.icon_offset_y}px" data-background="${this._config.background}" data-icon-style="${this._config.icon_style}" data-animated="${!!available&&state.kind!=='unknown'&&this._config.animate_icons&&!this._offline()}" data-background-animated="${!!available&&state.kind!=='unknown'&&this._config.animate_background&&!this._offline()}" data-compact="${this._config.compact}" data-kind="${state.kind}" data-dark="${!!hass?.themes?.darkMode}"><div class="header-region"><div class="scene-background" aria-hidden="true">${weatherAtmosphere(this._config.background)}</div><div class="scene"><div class="hero">${uiPrimaryValue({value:available?number(attributes.temperature):null,unit,subtitle:attributes.apparent_temperature!=null&&available?(nl?'Voelt als ':'Feels like ')+number(attributes.apparent_temperature,unit):'',compact:this._config.compact,attrs:{class:'temperature'}})}<div class="art">${this._weatherArt(state.kind,this._config.icon_style,state.iconKind,'hero')}</div></div>${this._statusMarkup(attributes,available,state,nl)}</div>${this._metricsMarkup(attributes,available)}</div>${!this._config.entity?`<p class="notice">${nl?'Kies een weerentiteit in de configuratie.':'Choose a weather entity in the editor.'}</p>`:`${this._forecastMarkup(nl,attributes)}`}</div></ha-card>`);
  this._tabs?.disconnect();
  this._tabs=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>{
   this._forecastSelection=value;this._syncForecast();this._render();
   this.shadowRoot.querySelector(`[data-ui-tab="${value}"]`)?.focus({preventScroll:true});
  }});
  if(focusedTab)this.shadowRoot.querySelector(`[data-ui-tab="${focusedTab}"]`)?.focus({preventScroll:true});
  if(focusedEntity)[...this.shadowRoot.querySelectorAll('[data-entity]')].find(button=>button.dataset.entity===focusedEntity)?.focus({preventScroll:true});
  if(focusedStatus)this.shadowRoot.querySelector('.weather-status')?.focus({preventScroll:true});
  if(!this._eventsBound){
   this._eventsBound=true;
   this.shadowRoot.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-status-entity],[data-entity],.retry');if(!target)return;
    if(target.classList.contains('retry')){this._key=null;this._syncForecast();this._render();return;}
    const id=target.dataset.statusEntity||target.dataset.entity;
    if(id&&!target.disabled)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));
   });
  }
 }
}
