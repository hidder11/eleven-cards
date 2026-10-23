import {uiPrimaryValue} from '../../../shared/ui-primary-value.js';
import {uiMetric} from '../../../shared/ui-metric.js';
import {uiEscape} from '../../../shared/ui-button.js';
import {uiButtonStyles} from '../../../shared/ui-button.js';
import {uiTabsStyles,bindUITabs} from '../../../shared/ui-tabs.js';
import {evccCardStyles} from './evcc/evcc-styles.js';
import {EvccCard} from './evcc/evcc-card.js';
import {CarEditor} from './car-editor.js';
import {normalizeCarConfig,carPercentage,carReading,carImageUrl,carFieldReading,carRange} from './car-utils.js';
import {headerAtmosphere} from '../../../shared/header-atmosphere.js';
const carDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');

export class CarCard extends EvccCard {
 constructor(){super();}
 static async getConfigElement(){
  if(!customElements.get('ha-form')){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();await customElements.whenDefined('ha-form');}
  if(!customElements.get('eleven-car-editor'))customElements.define('eleven-car-editor',CarEditor);
  return document.createElement('eleven-car-editor');
 }
 static getStubConfig(){return {title:'',percentage:50,field_1_entity:'',field_2_entity:'',field_3_entity:''};}
 setConfig(config){
  const next=normalizeCarConfig(config),switching=this._config?.evcc_enabled!==next.evcc_enabled,defaultChanged=this._config?.default_tab!==next.default_tab;
  this._cancelMode();this._cancelSolar();this._actionError=null;this._solarError=null;this._tabController?.disconnect();
  if(switching){clearInterval(this._clockTimer);this._clockTimer=null;this._resetHistory();this._connection=null;this._registry=[];this._activeTab=null;}
  if(switching||defaultChanged)this._activeTab=next.default_tab;
  this._config=next;this._signature=null;
  if(next.evcc_enabled&&this._hass)super.hass=this._hass;else this._render();
 }
 set hass(hass){if(this._config?.evcc_enabled)super.hass=hass;else{this._hass=hass;this._render();}}get hass(){return this._hass;}
 connectedCallback(){this._signature=null;if(this._config?.evcc_enabled)super.connectedCallback();else{this._observeMotion();this._render();}}
 getCardSize(){return this._config?.evcc_enabled?super.getCardSize():(this._config?.compact?6:8);}
 getGridOptions(){return this._config?.evcc_enabled?super.getGridOptions():{columns:12,min_columns:6,rows:this._config?.compact?7:9,min_rows:3};}
 _title(dutch){return this._config.title||(dutch?'Mijn auto':'My car');}
 _carReading(id,value,label,unit=''){
  const markup=unit&&value.endsWith(' '+unit)?uiEscape(value.slice(0,-unit.length).trimEnd())+' <span class="ui-metric-unit">'+uiEscape(unit)+'</span>':uiEscape(value);
  return id?`<button type="button" data-entity="${uiEscape(id)}" aria-label="${uiEscape(label+': '+value)}">${markup}</button>`:markup;}
 _extraSignature(){return this._config.custom_tabs.flatMap(tab=>tab.entities.map(row=>this._hass?.states?.[row.entity]));}
 _extraStyles(){return `
  .evcc-tabs{overflow-x:auto;scrollbar-width:thin}.evcc-tabs [role=tab]{flex:1 0 auto;min-width:64px;max-width:220px;overflow:hidden;text-overflow:ellipsis;text-align:center;display:block}
  .content[data-battery-style=slim] .battery-track,.content[data-battery-style=soft] .battery-track{height:8px}
  .content[data-battery-style=line] .battery-track{height:4px}
  .content:is([data-battery-style=slim],[data-battery-style=soft],[data-battery-style=line]) .target-marker{top:-2px;height:calc(100% + 4px);width:1px}
  .content[data-battery-style=soft] .battery-fill{background:color-mix(in srgb,var(--primary-color) 65%,var(--secondary-background-color));box-shadow:0 0 8px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .content[data-battery-style=soft] .battery-fill::before{filter:opacity(.45)}
  .content[data-battery-style=line] .battery-fill::before{background:linear-gradient(100deg,transparent,#ffffff99,transparent)}
 `;}
 _applyPresentation(){
  const content=this.shadowRoot.querySelector('.content');if(!content)return;
  content.dataset.batteryStyle=this._config.battery_style;
  content.style.setProperty('--evcc-image-offset-x',this._config.image_offset_x+'px');
 }
 _tabItems(nl){
  const items=this._config.evcc_enabled?super._tabItems(nl):[];
  for(const [index,tab] of this._config.custom_tabs.entries()){
   if(!tab.show)continue;
   const label=tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(index+1);
   const rows=tab.entities.filter(row=>row.entity);
   const content=rows.length?`<dl class="metrics">${rows.map(row=>{
    const entity=this._hass?.states?.[row.entity],name=row.name||entity?.attributes?.friendly_name||row.entity;
    const value=carFieldReading(entity,this._hass,{field_1_attribute:row.attribute,field_1_unit:row.unit,field_1_show_unit:row.show_unit,field_1_decimals:row.decimals},1);
    const plain=carFieldReading(entity,this._hass,{field_1_attribute:row.attribute,field_1_show_unit:false,field_1_decimals:row.decimals},1);
    const unit=value.startsWith(plain)?value.slice(plain.length).trim():'';
    return `<div><dt>${uiEscape(name)}</dt><dd>${this._carReading(row.entity,value,name,unit)}</dd></div>`;
   }).join('')}</dl>`:`<p class="notice">${nl?'Voeg entiteiten toe aan dit tabblad in de kaartconfiguratie.':'Add entities to this tab in the card configuration.'}</p>`;
   items.push({value:tab.id,label,content,tabAttrs:{title:label}});
  }
  return items;
 }
 _rangePrimary(config,states,nl){
  const range=carRange(config,states);if(!range)return {};
  const label=range.estimated?(nl?'geschat bereik':'estimated range'):(nl?'actieradius':'range');
  const value=range.value==null?'\u2014':carReading({state:String(range.value),attributes:{unit_of_measurement:range.unit}},this._hass,0);
  return {subtitle:value+' '+label,subtitleEntity:range.entity||''};
 }
 _field(i,nl){
  const config=this._config,id=config['field_'+i+'_entity'],entity=this._hass?.states?.[id];
  const label=config['field_'+i+'_label']||entity?.attributes?.friendly_name||id||(nl?'Gegevensveld '+i:'Data field '+i);
  const value=carFieldReading(entity,this._hass,config,i);
  const plain=carFieldReading(entity,this._hass,{...config,['field_'+i+'_show_unit']:false},i),split=value.startsWith(plain);
  return uiMetric({title:label,value:plain==='\u2014'?null:split?plain:value,unit:split?value.slice(plain.length).trim():'',icon:config['field_'+i+'_icon']||(i===2?'mdi:map-marker-distance':'mdi:counter'),compact:config.compact,action:!!id,attrs:{class:i===1?'car-status':'car-field','data-entity':id||'','data-car-field':String(i)}});
 }
 _render(){
  if(!this._config)return;
  if(this._config.evcc_enabled){super._render();this._applyPresentation();return;}
  const config=this._config,hass=this._hass,states=hass?.states??{},nl=carDutch(hass),percent=carPercentage(config,states);
  const offline=hass?.connected===false||hass?.connection?.connected===false;
  const signature=JSON.stringify([config,hass?.themes?.darkMode,hass?.locale,hass?.language,offline,...[config.percentage_entity,config.range_entity,config.image_entity,config.field_1_entity,config.field_2_entity,config.field_3_entity].map(id=>states[id]),this._extraSignature()]);
  if(signature===this._signature)return;this._signature=signature;
  const scroll=this.shadowRoot.querySelector('.content')?.scrollTop??0,focused=this.shadowRoot.activeElement?.dataset.entity,focusedTab=this.shadowRoot.activeElement?.dataset.uiTab;
  const title=config.title||(nl?'Mijn auto':'My car'),image=carImageUrl(states[config.image_entity],hass),percentage=percent==null?'\u2014':carReading({state:String(percent),attributes:{unit_of_measurement:'%'}},hass);
  const fields=[2,3].filter(i=>config['show_field_'+i]);
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${uiTabsStyles()}${evccCardStyles()}${this._extraStyles()}
   .car-status{margin-top:16px}.car-readings{margin:0}.content{--ui-metric-tone:var(--tone)}
   .content[data-density=compact] .car-status{margin-top:12px}
   .content .header-scene[data-no-readings]{padding-bottom:0}
   .range-value{font-size:12px;font-weight:600;color:var(--primary-text-color,#20252b)}
  </style><ha-card aria-label="${uiEscape(title)}"><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-density="${config.compact?'compact':'standard'}" data-theme="${hass?.themes?.darkMode?'dark':'light'}" data-tone="${config.color}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&percent!=null}">
   <div class="header-region"><div class="header-background" aria-hidden="true">${headerAtmosphere(config.background)}</div><div class="header-scene" ${fields.length?'':'data-no-readings'}><div class="gallery-top">
    ${offline?`<p class="notice warning" role="status">${nl?'Geen verbinding met Home Assistant. Getoonde waarden zijn de laatst ontvangen gegevens.':'Disconnected from Home Assistant. Values shown are the last received readings.'}</p>`:''}
    <div class="hero"><div class="car-stage"><div class="battery-row">${uiPrimaryValue({value:percent==null?null:percentage.replace(/\s*%$/,''),unit:'%',...this._rangePrimary(config,states,nl),entity:config.percentage_entity,compact:config.compact,attrs:{class:'battery-value'}})}</div>
     <div class="picture">${image?`<img src="${uiEscape(image)}" alt="${uiEscape(title)}"><small hidden>${nl?'Autoafbeelding niet beschikbaar':'Vehicle image unavailable'}</small>`:`<ha-icon icon="mdi:car" aria-hidden="true"></ha-icon>${config.image_entity?`<small>${nl?'Autoafbeelding niet beschikbaar':'Vehicle image unavailable'}</small>`:''}`}</div>
    </div><div class="battery-track" ${percent==null?`aria-label="${nl?'Percentage niet beschikbaar':'Percentage unavailable'}"`:`role="progressbar" aria-label="Percentage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"`}><div class="battery-fill" style="width:${percent??0}%"></div></div></div>
   </div>${config.show_field_1?`${this._field(1,nl)}`:''}</div>
   ${fields.length?`<div class="car-readings" data-ui-metric-grid style="--ui-metric-columns:${fields.length}">${fields.map(i=>this._field(i,nl)).join('')}</div>`:''}</div>${this._tabsMarkup(nl)}</div></ha-card>`;
  const content=this.shadowRoot.querySelector('.content');content.style.setProperty('--evcc-image-scale',String(config.image_scale/100));content.style.setProperty('--evcc-image-offset-y',config.image_offset_y+'px');content.scrollTop=scroll;
  for(const button of this.shadowRoot.querySelectorAll('[data-entity]'))button.addEventListener('click',()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:button.dataset.entity},bubbles:true,composed:true})));
  if(focused)Array.from(this.shadowRoot.querySelectorAll('[data-entity]')).find(button=>button.dataset.entity===focused)?.focus({preventScroll:true});
  this._tabController?.disconnect();
  this._tabController=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>{this._activeTab=value;}});
  if(focusedTab)(Array.from(this.shadowRoot.querySelectorAll('[data-ui-tab]')).find(tab=>tab.dataset.uiTab===focusedTab)??this.shadowRoot.querySelector('[role=tab][aria-selected=true]'))?.focus({preventScroll:true});
  this._applyPresentation();
  const img=this.shadowRoot.querySelector('img');if(img)img.addEventListener('error',()=>{img.hidden=true;const hint=this.shadowRoot.querySelector('.picture small');if(hint)hint.hidden=false;},{once:true});
 }
}
