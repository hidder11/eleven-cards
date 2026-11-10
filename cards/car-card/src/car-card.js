import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiPrimaryValue} from '../../../shared/ui-primary-value.js';
import {uiMetric} from '../../../shared/ui-metric.js';
import {uiBar} from '../../../shared/ui-bar.js';
import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {uiButtonStyles} from '../../../shared/ui-button.js';
import {uiTabsStyles,bindUITabs,uiBalancedTabsStyles} from '../../../shared/ui-tabs.js';
import {evccCardStyles} from './evcc/evcc-styles.js';
import {EvccCard} from './evcc/evcc-card.js';
import {CarEditor} from './car-editor.js';
import {normalizeCarConfig,carPercentage,carReading,carFieldReading,carRange} from './car-utils.js';
import {headerAtmosphere} from '../../../shared/header-atmosphere.js';
import {CarMediaImage} from './car-media-image.js';
import {CarEntityImage} from './car-entity-image.js';
const carDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');

export class CarCard extends EvccCard {
 constructor(){super();const changed=()=>{this._signature=null;this._render();};this._mediaImage=new CarMediaImage(changed);this._entityImage=new CarEntityImage(changed);}
 disconnectedCallback(){this._carLayoutObserver?.disconnect();this._mediaImage.reset();this._entityImage.reset();super.disconnectedCallback();}
 _hasVehicleImage(){return this._config.image_source==='media'?!!this._config.image_media?.media_content_id:!!this._config.image_entity;}
 _vehicleImage(){return this._config.image_source==='media'?this._mediaImage.url:this._entityImage.image?.src;}
 _vehicleImageMarkup(title,nl){
  const image=this._vehicleImage(),entity=this._config.image_source!=='media',failed=entity&&this._entityImage.status==='error';
  if(image&&!failed)return `<img src="${uiEscape(image)}" alt="${uiEscape(title)}"><small hidden>${nl?'Autoafbeelding niet beschikbaar':'Vehicle image unavailable'}</small>`;
  if(!this._hasVehicleImage())return '<ha-icon icon="mdi:car" aria-hidden="true"></ha-icon>';
  const loading=entity&&!failed;
  return `<div class="car-image-message" role="status"><small>${loading?(nl?'Autoafbeelding laden…':'Loading vehicle image…'):(nl?'Autoafbeelding niet beschikbaar':'Vehicle image unavailable')}</small>${failed?uiButton({variant:'text',text:nl?'Opnieuw proberen':'Retry',attrs:{'data-car-image-retry':true}}):''}</div>`;
 }
 _bindVehicleImage(){
  const root=this.shadowRoot,placeholder=root.querySelector('.picture img');
  if(this._config.image_source!=='media'){
   const image=this._entityImage.image;
   if(placeholder&&image){image.alt=placeholder.alt;placeholder.replaceWith(image);}
   const retry=root.querySelector('[data-car-image-retry]');
   // EVCC can render again without replacing its DOM when nothing changed.
   if(retry)retry.onclick=()=>this._entityImage.retry();
  }else if(placeholder)placeholder.onerror=()=>{placeholder.hidden=true;placeholder.nextElementSibling.hidden=false;};
 }
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
 _extraSignature(){return [this._entityImage.version,this._entityImage.status,...this._config.custom_tabs.flatMap(tab=>tab.entities.map(row=>this._hass?.states?.[row.entity]))];}
 _extraStyles(){return `
  .car-stage .picture:has(.car-image-message){min-height:88px;aspect-ratio:auto}
  .car-image-message{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px;text-align:center}
  .car-image-message small{font-size:12px;line-height:1.4}
  .hero>.battery-progress{margin-top:10px}
  .content[data-battery-style=slim] .battery-progress{--ui-bar-height:8px}
  .content[data-battery-style=line] .battery-progress{--ui-bar-height:4px}
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
  const numeric=plain!=='\u2014'&&Number.isFinite(Number(config['field_'+i+'_attribute']?entity?.attributes?.[config['field_'+i+'_attribute']]:entity?.state));
  return uiMetric({title:label,value:plain==='\u2014'?null:split?plain:value,valueContent:plain==='\u2014'?'':`<span class="${numeric?'car-number':'car-text'}">${uiEscape(split?plain:value)}</span>`,unit:split?value.slice(plain.length).trim():'',icon:config['field_'+i+'_icon']||(i===2?'mdi:map-marker-distance':'mdi:counter'),compact:config.compact,action:!!id,attrs:{class:i===1?'car-status':'car-field','data-value-kind':numeric?'number':'text','data-entity':id||'','data-car-field':String(i)}});
 }
 _fitCarReadings(){
  this._carLayoutObserver?.disconnect();
  if(this._config.evcc_enabled||!this.isConnected)return;
  const root=this.shadowRoot,grid=root.querySelector('.car-readings'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');

  const fit=()=>{
   const stage=root.querySelector('.car-stage'),primary=root.querySelector('.primary-value'),number=primary?.querySelector('.primary-number');
   if(stage&&number){
    // Keep ordinary hero tracks 1:2; enlarged text may use the full row.
    // Measure from the stable parent font so fitting cannot compound itself.
    const s=getComputedStyle(primary),base=parseFloat(s.fontSize),unit=primary.querySelector('small');
    ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const natural=ctx.measureText(number.textContent).width+Math.max(0,number.textContent.length-1)*(parseFloat(s.letterSpacing)||0);
    const reserve=unit?unit.getBoundingClientRect().width+(parseFloat(s.columnGap)||0):0;
    const slot=(stage.clientWidth-12)/3,normal=parseFloat(getComputedStyle(root.querySelector('.content')).getPropertyValue('--ui-primary-size'));
    const stacked=base>normal*1.1&&natural+reserve>slot;
    stage.toggleAttribute('data-hero-stacked',stacked);
    const available=stacked?stage.clientWidth:slot,size=Math.floor(base*Math.min(1,Math.max(44,available-reserve)/Math.max(1,natural))*100)/100+'px';
    if(number.style.fontSize!==size)number.style.fontSize=size;
   }
   if(grid){const fields=[...grid.children].filter(field=>field.dataset.carField!=='1'),available=grid.clientWidth;
    const needed=Math.max(0,...fields.map(field=>{const number=field.querySelector('.car-number'),value=field.querySelector('.ui-metric-value'),label=field.querySelector('.ui-metric-title');let n=0;
     if(number){const s=getComputedStyle(value);ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;n=ctx.measureText(number.textContent).width+Math.max(0,number.textContent.length-1)*(parseFloat(s.letterSpacing)||0);}
     const s=getComputedStyle(label);ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const word=Math.max(0,...label.textContent.split(/\s+/).map(w=>ctx.measureText(w).width));return Math.max(n,word+34)+24;}));
    const columns=fields.length>1&&needed*fields.length+12*(fields.length-1)<=available?fields.length:1;
    if(grid.style.getPropertyValue('--ui-metric-columns')!==String(columns))grid.style.setProperty('--ui-metric-columns',String(columns));
   }
   for(const number of root.querySelectorAll('.car-number')){const value=number.parentElement,s=getComputedStyle(value),base=parseFloat(s.fontSize);ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const natural=ctx.measureText(number.textContent).width+Math.max(0,number.textContent.length-1)*(parseFloat(s.letterSpacing)||0),size=base*Math.min(1,value.clientWidth/Math.max(1,natural));const px=Math.floor(size*100)/100+'px';if(number.style.fontSize!==px)number.style.fontSize=px;}
  };
  fit();this._carLayoutObserver=new ResizeObserver(fit);
  for(const node of [root.querySelector('.content'),...root.querySelectorAll('.primary-value,.primary-value small,.ui-metric-value,.ui-metric-title')])if(node)this._carLayoutObserver.observe(node);
 }
 _render(){
  if(!this._config)return;
  if(this.isConnected)this._mediaImage.update(this._hass,this._config.image_source==='media'?this._config.image_media:null);
  this._entityImage.update(this._hass,this._config.image_source==='entity'?this._config.image_entity:'',this.isConnected===true);
  if(this._config.evcc_enabled){this._carLayoutObserver?.disconnect();super._render();this._applyPresentation();this._bindVehicleImage();return;}
  const config=this._config,hass=this._hass,states=hass?.states??{},nl=carDutch(hass),percent=carPercentage(config,states);
  const offline=hass?.connected===false||hass?.connection?.connected===false;
  const signature=JSON.stringify([config,hass?.themes?.darkMode,hass?.locale,hass?.language,offline,...[config.percentage_entity,config.range_entity,config.image_entity,config.field_1_entity,config.field_2_entity,config.field_3_entity].map(id=>states[id]),this._extraSignature()]);
  if(signature===this._signature)return;this._signature=signature;
  const scroll=this.shadowRoot.querySelector('.content')?.scrollTop??0,focused=this.shadowRoot.activeElement?.dataset.entity,focusedTab=this.shadowRoot.activeElement?.dataset.uiTab;
  const title=config.title||(nl?'Mijn auto':'My car'),percentage=percent==null?'\u2014':carReading({state:String(percent),attributes:{unit_of_measurement:'%'}},hass);
  const fields=[1,2,3].filter(i=>config['show_field_'+i]);
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${uiTabsStyles()}${evccCardStyles()}${this._extraStyles()}
   /* Regular Auto only: EVCC keeps its independent presentation. */
   :host,ha-card{height:auto;min-height:0}.content{height:auto;overflow:visible}
   .gallery-top{margin:0;padding:0;background:none}.hero{margin:0;padding:0}
   .car-stage{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:12px;padding:0;min-height:0}
   .car-stage .battery-row{grid-column:1;grid-row:1;align-items:stretch}
   .car-stage::before,.car-stage::after{content:none}
   .battery-row [data-ui-primary-value]{max-width:100%}
   .car-stage .picture{position:relative;inset:auto;grid-column:2;grid-row:1;width:100%;height:auto;aspect-ratio:3.05;min-height:0;margin:0;overflow:hidden}
   .car-stage .picture img{position:absolute;inset:0;left:var(--evcc-image-offset-x,0px);bottom:auto;top:var(--evcc-image-offset-y,0px);width:100%;height:100%;max-width:none;margin:0;object-fit:contain;transform:scale(var(--evcc-image-scale,1));transform-origin:center;filter:none}
   .car-stage[data-hero-stacked]{grid-template-columns:minmax(0,1fr)}
   .car-stage[data-hero-stacked] .picture{grid-column:1;grid-row:2}
   .content[data-density=compact] .car-stage .picture{height:auto;aspect-ratio:3.5}
   .car-stage .picture:has(ha-icon),.car-stage .picture:has(img[hidden]){min-height:88px;aspect-ratio:auto}
   .picture small{font-size:12px;line-height:1.4;overflow-wrap:break-word}.picture:has(img[hidden]) small{padding:12px}
   .car-status,.content[data-density=compact] .car-status{margin-top:0}
   .car-readings{margin-top:12px;row-gap:12px;grid-template-columns:repeat(var(--ui-metric-columns,2),minmax(0,1fr))}
   .car-readings>[data-car-field="1"],.car-readings:has(>[data-car-field="1"])>[data-ui-metric]:last-child:nth-child(2){grid-column:1/-1}
   [data-ui-metric]{background:var(--secondary-background-color);padding:12px;min-height:44px;row-gap:4px}
   [data-ui-metric] .ui-metric-title{font-size:12px;overflow-wrap:break-word;line-height:1.4}
   [data-ui-metric] .ui-metric-value{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 6px;white-space:normal;overflow-wrap:break-word;word-break:normal;line-height:1.3}
   [data-ui-metric] .car-text{min-width:0;max-width:100%;overflow-wrap:break-word}
   [data-ui-metric] .car-number{display:inline-block;white-space:nowrap;overflow-wrap:normal;word-break:normal}
   [data-ui-metric] .ui-metric-unit{font-size:12px;line-height:1.4;margin:0;white-space:normal;overflow-wrap:break-word}
   [data-ui-metric] .ui-metric-icon{color:var(--secondary-text-color);transform:none;width:22px;height:22px}
   .content[data-density=compact] [data-ui-metric]{padding:10px}
   .content .header-scene{padding-bottom:0}.car-readings:empty{display:none}
   .content button[data-entity],.metrics button{min-height:44px}
   .content button:focus-visible{outline-color:var(--accent-color,var(--primary-color))}
   .metrics{grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))}.metrics dt{font-size:12px;overflow-wrap:break-word}.metrics dd{overflow-wrap:break-word}.metrics button{overflow-wrap:break-word}
  ${cardThemeStyles({wells:'[data-ui-metric],.live-readings>div',plots:'.plot',controls:'[data-ui-button=surface]',selected:'[data-ui-tabs] [role=tab][aria-selected=true]'})}${uiBalancedTabsStyles()}</style><ha-card aria-label="${uiEscape(title)}"><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-density="${config.compact?'compact':'standard'}" data-theme="${hass?.themes?.darkMode?'dark':'light'}" data-tone="${config.color}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&percent!=null}">
   <div class="header-region"><div class="header-background" aria-hidden="true">${headerAtmosphere(config.background)}</div><div class="header-scene" ${fields.length?'':'data-no-readings'}><div class="gallery-top">
    ${offline?`<p class="notice warning" role="status">${nl?'Geen verbinding met Home Assistant. Getoonde waarden zijn de laatst ontvangen gegevens.':'Disconnected from Home Assistant. Values shown are the last received readings.'}</p>`:''}
    <div class="hero"><div class="car-stage"><div class="battery-row">${uiPrimaryValue({layout:'uniform',value:percent==null?null:percentage.replace(/\s*%$/,''),unit:'%',...this._rangePrimary(config,states,nl),entity:config.percentage_entity,compact:config.compact,attrs:{class:'battery-value'}})}
    </div>
     <div class="picture">${this._vehicleImageMarkup(title,nl)}</div>
   </div>${uiBar({value:percent,label:percent==null?(nl?'Percentage niet beschikbaar':'Percentage unavailable'):(nl?'Accuniveau':'Battery level'),attrs:{class:'battery-progress'}})}</div>
   </div></div>
   ${fields.length?`<div class="car-readings" data-ui-metric-grid style="--ui-metric-columns:2">${fields.map(i=>this._field(i,nl)).join('')}</div>`:''}</div>${this._tabsMarkup(nl)}</div></ha-card>`;
  const content=this.shadowRoot.querySelector('.content');content.style.setProperty('--evcc-image-scale',String(config.image_scale/100));content.style.setProperty('--evcc-image-offset-y',config.image_offset_y+'px');content.scrollTop=scroll;
  for(const button of this.shadowRoot.querySelectorAll('[data-entity]'))button.addEventListener('click',()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:button.dataset.entity},bubbles:true,composed:true})));
  if(focused)Array.from(this.shadowRoot.querySelectorAll('[data-entity]')).find(button=>button.dataset.entity===focused)?.focus({preventScroll:true});
  this._tabController?.disconnect();
  this._tabController=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>{this._activeTab=value;}});
  if(focusedTab)(Array.from(this.shadowRoot.querySelectorAll('[data-ui-tab]')).find(tab=>tab.dataset.uiTab===focusedTab)??this.shadowRoot.querySelector('[role=tab][aria-selected=true]'))?.focus({preventScroll:true});
  this._applyPresentation();
  this._fitCarReadings();
  this._bindVehicleImage();
 }
}
