import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiBalancedTabsStyles} from '../../../shared/ui-tabs.js';
import {connectTimeframeSync,disconnectTimeframeSync} from '../../../shared/periods.js';
import {normalizeConfig, numeric, escapeHtml, loadHeatmapData, buildHeatmap, colorScale, summarizeHeatmap, heatmapColumns} from './heatmap-utils.js';
import {cardHeader, cardHeaderStyles} from '../../../shared/card-header.js';
import {periodControls, bindPeriodControls, disconnectPeriodControls, periodControlsStyles} from '../../../shared/period-controls.js';
import {graphPeriodRange, resetGraphPeriod} from '../../../shared/periods.js';
import {chartDataInformation, captureChartInsights, bindChartInsights, disconnectChartInsights, chartInsightStyles} from '../../../shared/chart-insights.js';
import {SharedGraph} from '../../../shared/graph.js';
import {retryDelay} from '../../../shared/request.js';
import {uiButton} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';

const esc=escapeHtml;
const isDutch=hass=>String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
const dataContext=(hass,config)=>JSON.stringify([hass?.config?.time_zone,isDutch(hass),[config?.entity,...(config?.sum_entities??[])].map(id=>{
  const state=hass?.states?.[id],attributes=state?.attributes;
  return [id,!!state,attributes?.unit_of_measurement,attributes?.friendly_name,attributes?.state_class,attributes?.device_class];
})]);
const labels={sync_timeframe:['Tijdvak synchroniseren','Synchronize timeframe'],hover_sync_group:['Synchronisatiegroep','Synchronization group'],
  sum_entities:['Sensoren optellen','Add sensors'],
  title:['Titel','Title'],entity:['Sensor','Sensor'],name:['Sensornaam','Sensor name'],hours_to_show:['Aantal uren','Hours to show'],mode:['Waarde per tijdvak','Value per interval'],aggregation_period:['Aggregatieperiode','Aggregation period'],
  show_title:['Titel tonen','Show title'],show_legend:['Legenda tonen','Show legend'],show_labels:['Rij- en kolomlabels tonen','Show row and column labels'],show_navigation:['Tijdvakselectie tonen','Show timeframe selection'],
  graph_settings:['Grafiek','Graph'],data_processing:['Dataverwerking','Data processing'],color_settings:['Kleuren','Colors'],matrix_settings:['Rasteropmaak','Grid appearance'],
  scale_min:['Minimum kleurschaal','Color scale minimum'],scale_max:['Maximum kleurschaal','Color scale maximum'],
  low_color:['Kleur lage waarden','Low value color'],high_color:['Kleur hoge waarden','High value color'],
  color_mode:['Kleurmodus','Color mode'],gradient_mode:['Kleurovergang','Color transitions'],gradient_stops:['Kleurovergangen','Color stops'],
  cell_width:['Voorkeursbreedte vak','Preferred cell width'],cell_height:['Vakhoogte','Cell height'],cell_gap:['Tussenruimte','Cell gap'],border_radius:['Hoekafronding','Border radius'],max_height:['Oude rasterhoogte (compatibiliteit)','Legacy grid height (compatibility)']
};
const helpers={sync_timeframe:['Deelt tijdvakkeuze en vorige/volgende/Nu met ingeschakelde kaarten in dezelfde groep.','Shares timeframe selection and previous/next/Now with enabled cards in the same group.'],hover_sync_group:['Kaarten met dezelfde groep delen hover en tijdvak als de bijbehorende synchronisatie aanstaat. Leeg gebruikt de standaardgroep.','Cards with the same group share hover and timeframe when the corresponding synchronization is enabled. Empty uses the default group.'],
  sum_entities:['Tel maximaal 7 extra sensoren bij de hoofdsensor op (maximaal 8 totaal). Dezelfde eenheid is vereist; ontbrekende waarden zijn geen nul. Sensornaam benoemt het totaal.','Add up to 7 additional sensors to the primary sensor (8 total). The same unit is required; missing values are not zero. Sensor name labels the total.'],
  hours_to_show:['Standaardperiode: 1–8760 uur. De tijdvakselectie kan deze tijdelijk wijzigen.','Default range: 1–8760 hours. The timeframe menu can change it temporarily.'],
  mode:['Gemiddelde weegt waarden naar hun duur. Verbruik telt de uurwijzigingen uit tellerstatistieken op, inclusief tellerresets.','Average weights values by their duration. Consumption sums hourly counter changes from statistics, including counter resets.'],
  aggregation_period:['Uren per dag, dagen per week, weken per ISO-jaar of maanden per jaar. Kalendergrenzen volgen de Home Assistant-tijdzone; weken beginnen op maandag.','Hours per day, days per week, weeks per ISO year or months per year. Calendar boundaries follow the Home Assistant timezone; weeks start on Monday.'],
  scale_min:['Optioneel, in de sensoreenheid. Leeg schaalt automatisch.','Optional, in the sensor unit. Empty scales automatically.'],
  scale_max:['Optioneel, in de sensoreenheid. Moet hoger zijn dan het minimum.','Optional, in the sensor unit. Must exceed the minimum.'],
  color_mode:['De kleurschaal volgt het waardenbereik. Kleurovergangen gebruiken vaste sensorwaarden en blijven tussen perioden vergelijkbaar.','The color scale follows the value range. Color stops use fixed sensor values and remain comparable across periods.'],
  gradient_stops:['Stel 2–32 unieke waarden in de sensoreenheid in, geen percentages. Pas de beginwaarden aan je sensor aan.','Set 2–32 distinct values in the sensor unit, not percentages. Adjust the initial values to your sensor.'],
  cell_width:['Voorkeursbreedte in pixels. Alle kolommen delen de beschikbare breedte; op smalle kaarten worden vakken smaller en kolomlabels schaarser.','Preferred width in pixels. All columns share the available width; narrow cards use smaller cells and fewer column captions.'],
  max_height:['Bewaard voor bestaande configuraties; begrenst het raster niet meer. De kaart groeit met alle rijen, zonder intern scrollen.','Retained for existing configurations; no longer caps the grid. The card grows with all rows, without internal scrolling.']
};

export class HeatmapEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});}
  setConfig(config){this._config=normalizeConfig(config,{draft:true});this._render();}
  set hass(hass){this._hass=hass;this._render();}
  get hass(){return this._hass;}
  connectedCallback(){this._render();}
  _render(){
    if(!this._config || !this._hass)return;
    if(!this._form){
      this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}ha-form{display:block;min-width:0}.error{color:var(--error-color,#db4437);font-size:14px;overflow-wrap:anywhere}.error[hidden]{display:none}</style><ha-form></ha-form><p class="error" role="alert" hidden></p>';
      this._form=this.shadowRoot.querySelector('ha-form');
      this._form.addEventListener('value-changed',event=>{
        event.stopPropagation();
        const next={...this._config,...event.detail.value};
        if(next.color_mode==='gradient' && this._config.color_mode!=='gradient' && !next.gradient_stops?.length){
          const low=numeric(next.scale_min)??((numeric(next.scale_max)??1)-1),upper=numeric(next.scale_max),high=upper!=null&&upper>low?upper:low+1;
          next.gradient_stops=[{value:low,color:[...this._config.low_color]},{value:high,color:[...this._config.high_color]}];
        }
        // Preserve incomplete edits. Runtime validation protects the card while
        // the native form retains its focus, expansion state and entered values.
        this._config=normalizeConfig(next,{draft:true});
        this._render();
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));
      });
    }
    const dutch=isDutch(this._hass),definition=HeatmapCard.getConfigForm(this._config,dutch);
    this._form.hass=this._hass;
    this._form.data=this._config;
    this._form.schema=definition.schema;
    this._form.computeLabel=s=>definition.computeLabel.call(this,s);
    this._form.computeHelper=s=>definition.computeHelper.call(this,s);
    const error=this.shadowRoot.querySelector('.error');
    try{if(this._config.entity)normalizeConfig(this._config);error.hidden=true;error.textContent='';}
    catch(problem){error.textContent=problem.message.split(' / ')[dutch?1:0]??problem.message;error.hidden=false;}
  }
}

export class HeatmapCard extends HTMLElement {
  constructor(){
    super();this.attachShadow({mode:'open'});
    this._generation=0;this._connected=false;this._status='loading';this._data=null;this._rows=[];this._timer=null;this._promise=null;
  }
  static getConfigForm(config={},dutch=isDutch(globalThis.document?.querySelector('home-assistant')?.hass)){
    const data=normalizeConfig(config,{draft:true}),label=key=>labels[key]?.[dutch?0:1]??key;
    const select=options=>({select:{mode:'dropdown',options:options.map(([value,nl,en])=>({value,label:dutch?nl:en}))}});
    const group=(name,schema,expanded=false)=>({type:'expandable',name,title:label(name),flatten:true,expanded,schema});
    const number=(name,min,max)=>({name,default:{cell_width:24,cell_height:24,cell_gap:2,border_radius:3,max_height:800}[name],selector:{number:{min,max,step:1,mode:'box',unit_of_measurement:'px'}}});
    const stops={object:{multiple:true,label_field:'value',fields:{
      value:{label:dutch?'Sensorwaarde':'Sensor value',required:true,selector:{number:{step:'any',mode:'box'}}},
      color:{label:dutch?'Kleur':'Color',required:true,selector:{color_rgb:{}}}
    }}};
    return {schema:[
      {name:'entity',required:true,selector:{entity:{domain:'sensor'}}},
      {name:'sum_entities',selector:{entity:{domain:'sensor',multiple:true}}},
      {name:'name',selector:{text:{}}},
      {name:'title',selector:{text:{}}},
      {name:'show_title',default:true,selector:{boolean:{}}},
      {name:'hours_to_show',default:672,selector:{number:{min:1,max:8760,step:1,mode:'box'}}},
      group('graph_settings',[...['show_legend','show_navigation','show_labels'].map(name=>({name,default:true,selector:{boolean:{}}})),{name:'sync_timeframe',default:false,selector:{boolean:{}}},{name:'hover_sync_group',selector:{text:{}}}]),
      group('data_processing',[
        {name:'aggregation_period',default:'hour',selector:select([['hour','Uur','Hour'],['day','Dag','Day'],['week','Week (maandag)','Week (Monday)'],['month','Maand','Month']])},
        {name:'mode',default:'average',selector:select([['average','Gemiddelde','Average'],['consumption','Verbruik','Consumption']])}
      ]),
      group('color_settings',[
        {name:'color_mode',required:true,selector:select([['scale','Kleurschaal','Color scale'],['gradient','Kleurovergangen','Color stops']])},
        ...(data.color_mode==='gradient'?[
          {name:'gradient_mode',required:true,selector:select([['smooth','Vloeiende gradiënt','Smooth gradient'],['steps','Harde overgangen','Hard transitions']])},
          {name:'gradient_stops',selector:stops}
        ]:[
          {name:'scale_min',selector:{number:{step:'any',mode:'box'}}},{name:'scale_max',selector:{number:{step:'any',mode:'box'}}},
          {name:'low_color',selector:{color_rgb:{}}},{name:'high_color',selector:{color_rgb:{}}}
        ])
      ],true),
      group('matrix_settings',[number('cell_width',6,64),number('cell_height',16,64),number('cell_gap',0,8),number('border_radius',0,16),number('max_height',100,2000)])
    ],computeLabel:function(item){return labels[item?.name]?.[isDutch(this?.hass??{language:dutch?'nl':'en'})?0:1]??item?.name;},
    computeHelper:function(item){return helpers[item?.name]?.[isDutch(this?.hass??{language:dutch?'nl':'en'})?0:1];}};
  }
  static async getConfigElement(){
    if(!customElements.get('ha-form')){
      const helpers=await window.loadCardHelpers();
      const card=await helpers.createCardElement({type:'entities',entities:[]});
      await card.constructor.getConfigElement();
      await customElements.whenDefined('ha-form');
    }
    if(!customElements.get('eleven-heatmap-editor'))customElements.define('eleven-heatmap-editor',HeatmapEditor);
    return document.createElement('eleven-heatmap-editor');
  }
  static getStubConfig(hass){return {entity:Object.keys(hass?.states ?? {}).find(id=>id.startsWith('sensor.') && numeric(hass.states[id].state)!=null) ?? '',hours_to_show:672,mode:'average',aggregation_period:'hour'};}
  setConfig(config){
    if(!config?.entity){
      disconnectTimeframeSync(this);this._config=null;this._emptyConfig=true;resetGraphPeriod(this);this._invalidate();
      disconnectPeriodControls(this);disconnectChartInsights(this);this._disconnectTooltip();this._render();return;
    }
    this._emptyConfig=false;
    this._config=normalizeConfig(config);resetGraphPeriod(this);this._invalidate();connectTimeframeSync(this);this._render();if(this._connected)this._refresh();
  }
  set hass(hass){
    const previous=this._context;
    this._hass=hass;
    const state=hass?.states?.[this._config?.entity];
    this._context=dataContext(hass,this._config);
    if(previous!==this._context){
      const unit=state?.attributes?.unit_of_measurement ?? '',zone=hass?.config?.time_zone || 'UTC';
      if((previous!==undefined && this._config?.sum_entities?.length) || (this._data && (this._data.unit!==unit || this._zone!==zone)))this._invalidate();
      this._render();
    }
    if(this._connected && !this._promise && this._status==='loading')this._refresh();
  }
  get hass(){return this._hass;}
  connectedCallback(){this._connected=true;connectTimeframeSync(this);this._refresh();}
  disconnectedCallback(){globalThis.document?.removeEventListener?.('pointerdown',this._chartToolsOutside);disconnectTimeframeSync(this);this._connected=false;this._generation++;this._promise=null;clearTimeout(this._timer);this._timer=null;disconnectPeriodControls(this);disconnectChartInsights(this);this._disconnectTooltip();this._hideTooltip();}
  getCardSize(){
    const c=this._config??{},hours=c.hours_to_show??672,period=c.aggregation_period??'hour';
    const rows=this._rows.length || Math.ceil(hours/({hour:24,day:168,week:8760,month:8760}[period]))+(period==='hour'||period==='day'?1:2);
    const estimate=150+(rows+(c.show_labels!==false?1:0))*((this._matrixRowHeight??c.cell_height??24)+(c.cell_gap??2));
    return Math.ceil(Math.max(estimate,this.shadowRoot?.querySelector('.content')?.offsetHeight??0)/50);
  }
  getGridOptions(){return {columns:12,min_columns:6,rows:Math.max(3,Math.ceil(this.getCardSize()*50/64)),min_rows:3};}
  _invalidate(){this._hideTooltip();this._insightOpen=null;this._insightPending=null;this._generation++;this._promise=null;this._data=null;this._rows=[];this._status='loading';this._refreshFailures=0;clearTimeout(this._timer);this._timer=null;}
  _reloadPeriod(){this._invalidate();this._render();return this._refresh();}
  _refresh(){
    if(!this._connected || !this._hass || !this._config)return Promise.resolve();
    if(this._promise)return this._promise;
    clearTimeout(this._timer);
    const generation=this._generation,hass=this._hass,config=this._config,range=graphPeriodRange(this),zone=hass.config?.time_zone || 'UTC',context=dataContext(hass,config);
    let timeout;
    const work=Promise.race([loadHeatmapData(hass,config,range.start,range.end),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('timeout')),20000);})])
      .then(data=>{
        if(!this._connected || generation!==this._generation)return;
        const currentUnit=this._hass.states?.[config.entity]?.attributes?.unit_of_measurement ?? '';
        if(data.unit!==currentUnit || zone!==(this._hass.config?.time_zone || 'UTC') || (config.sum_entities?.length && context!==dataContext(this._hass,config))){this._invalidate();return;}
        this._rows=buildHeatmap(data,range.start,range.end,zone,config.mode,config.aggregation_period);
        this._data=data;this._zone=zone;this._start=range.start;this._end=range.end;this._viewStart=range.start;this._viewEnd=range.end;
        this._status='ready';this._refreshFailures=0;
      }).catch(error=>{
        if(this._connected && generation===this._generation){this._status='error';this._error=error.message;this._refreshFailures=(this._refreshFailures??0)+1;}
      }).finally(()=>{
        clearTimeout(timeout);
        if(this._connected && generation===this._generation){
          this._promise=null;this._render();this._timer=setTimeout(()=>this._refresh(),retryDelay(this._refreshFailures??0));
        } else if(this._connected && this._status==='loading' && !this._promise)this._refresh();
      });
    this._promise=work;return work;
  }
  _number(value){const locale=isDutch(this._hass)?'nl-NL':'en-GB';if(this._numberLocale!==locale){this._numberLocale=locale;this._numberFormat=new Intl.NumberFormat(locale,{maximumFractionDigits:2});this._smallNumberFormat=new Intl.NumberFormat(locale,{maximumSignificantDigits:3});}return (Math.abs(value)>0&&Math.abs(value)<0.01?this._smallNumberFormat:this._numberFormat).format(value);}
  _cellDate(cell){
    const period=this._config.aggregation_period,locale=isDutch(this._hass)?'nl-NL':'en-GB',zone=this._zone || this._hass?.config?.time_zone || 'UTC';
    if(period==='hour')return this._dateLabels.get(cell.key.split('/')[0]);
    if(period==='week')return `Week ${cell.column+1}, ${cell.rowKey}`;
    if(period==='month')return (this._monthFormatter??=new Intl.DateTimeFormat(locale,{timeZone:zone,month:'long',year:'numeric'})).format(cell.timestamp??Date.UTC(Number(cell.rowKey),cell.column,15));
    const row=this._rowByKey?.get(cell.rowKey);
    return (this._dayFormatter??=new Intl.DateTimeFormat(locale,{timeZone:zone,weekday:'short',day:'numeric',month:'short',year:'numeric'})).format(cell.timestamp??row.timestamp+(cell.column+.5)*86400000);
  }
  _label(cell){
    const dutch=isDutch(this._hass),date=this._cellDate(cell),hour=this._config.aggregation_period==='hour'?`, ${String(cell.hour).padStart(2,'0')}:00`:'';
    return `${date}${hour} · ${cell.value==null?(dutch?'Geen gegevens':'No data'):`${this._number(cell.value)} ${this._data.unit}`}${cell.partial?(dutch?' · Onvolledig':' · Incomplete'):''}`;
  }
  _information(language){
    this._insightLanguage=language;
    const summary={rows:[{id:this._config.entity,unit:this._data?.unit,...summarizeHeatmap(this._rows,this._config.mode)}]};
    // Adapt the single sensor to the shared information popup without adding
    // internal collection fields to the card's saved configuration.
    return chartDataInformation({_config:{entities:[this._config.entity],series_options:[{entity:this._config.entity,name:this._sensorName()}]},_hass:this._hass,
      _insightOpen:this._insightOpen,_status:this._status,_inFlight:!!this._promise || this._status==='loading',_loadFailed:this._status==='error',
      _lastLoad:this._data?{sources:[{id:this._config.entity,source:this._data.source}],summary}:null,
      _isSeriesVisible:()=>true,_dataInformation:()=>summary,
      _insightColor:()=>{const scale=colorScale(this._rows,this._config),average=summary.rows[0].average;return scale.color(Number.isFinite(average)?average:(scale.min+scale.max)/2);}},language);
  }
  _sensorName(){return this._config.name?.trim()||[this._config.entity,...(this._config.sum_entities??[])].map(id=>this._hass?.states?.[id]?.attributes?.friendly_name||id).join(' + ');}
  _cellBounds(cell){
    const intervals=cell.records.length?cell.records:cell.intervals;
    if(this._config.aggregation_period!=='hour'){
      if(!intervals.length)return '';
      const format=new Intl.DateTimeFormat(isDutch(this._hass)?'nl-NL':'en-GB',{timeZone:this._zone,day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
      return `${format.format(intervals[0].start)}–${format.format(intervals.at(-1).end)}`;
    }
    const locale=isDutch(this._hass)?'nl-NL':'en-GB',options={timeZone:this._zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'};
    const offset=new Intl.DateTimeFormat(locale,{timeZone:this._zone,timeZoneName:'shortOffset'});
    const zone=t=>offset.formatToParts(t).find(part=>part.type==='timeZoneName')?.value;
    const showOffset=intervals.length>1 || intervals.some(row=>zone(row.start)!==zone(row.end));
    const clock=new Intl.DateTimeFormat(locale,{...options,...(showOffset?{timeZoneName:'shortOffset'}:{})});
    return intervals.map(row=>`${clock.format(row.start)}–${clock.format(row.end)}`).join(', ') || `${String(cell.hour).padStart(2,'0')}:00–${String(cell.hour+1).padStart(2,'0')}:00`;
  }
  _hideTooltip(){
    this._tooltipKey=null;
    const tooltip=this.shadowRoot.querySelector('.tooltip');if(tooltip)tooltip.hidden=true;
    this._tooltipButton?.removeAttribute('aria-describedby');this._tooltipButton=null;
  }
  _showTooltip(key){
    if(this._periodMenuOpen || this._insightOpen){this._hideTooltip();return;}
    const root=this.shadowRoot,cell=this._cells?.get(key),button=this._cellElements?.get(key)??[...root.querySelectorAll('[data-cell]')].find(button=>button.dataset.cell===key);
    const tooltip=root.querySelector('.tooltip'),chart=root.querySelector('.chart'),scroll=root.querySelector('.matrix-scroll');
    if(!cell || !button || !tooltip || !chart || !scroll){this._hideTooltip();return;}
    const box=chart.getBoundingClientRect(),target=button.getBoundingClientRect(),grid=scroll.getBoundingClientRect();
    const left=Math.max(box.left,8),right=Math.min(box.right,window.innerWidth-8),top=8,bottom=window.innerHeight-8;
    if(target.right<=Math.max(grid.left,left) || target.left>=Math.min(grid.right,right) || target.bottom<=top || target.top>=bottom) {this._hideTooltip();return;}
    this._tooltipKey=key;
    const dutch=isDutch(this._hass),name=this._sensorName();
    const value=cell.value==null?(dutch?'Geen gegevens':'No data'):`${this._number(cell.value)} ${this._data.unit}`;
    const date=this._cellDate(cell),bounds=this._cellBounds(cell),color=cell.value==null?'var(--divider-color,#ddd)':(this._scale??colorScale(this._rows,this._config)).color(cell.value);
    tooltip.innerHTML=`<strong>${esc(date)}${bounds?` · ${esc(bounds)}`:''}</strong><span><i style="background:${color}"></i><b class="tooltip-label">${esc(name)} <em class="tooltip-value">${esc(value)}</em></b>${cell.partial?`<small>${dutch?'Onvolledig':'Incomplete'}</small>`:''}</span>`;
    tooltip.style.width='max-content';tooltip.style.maxWidth=`${Math.max(0,Math.min(360,right-left-8))}px`;tooltip.style.maxHeight=`${Math.max(0,bottom-top-8)}px`;
    tooltip.hidden=false;
    const measured=tooltip.getBoundingClientRect();
    let x=target.right+10;if(x+measured.width>right-4)x=target.left-measured.width-10;
    const y=target.bottom+measured.height+8<=bottom?target.bottom+8:target.top-measured.height-8;
    tooltip.style.left=`${Math.max(left+4,Math.min(x,right-measured.width-4))-box.left}px`;
    tooltip.style.top=`${Math.max(top+4,Math.min(y,bottom-measured.height-4))-box.top}px`;
    if(this._tooltipButton!==button)this._tooltipButton?.removeAttribute('aria-describedby');this._tooltipButton=button;
    button.setAttribute('aria-describedby','heatmap-tooltip');
  }
  _disconnectTooltip(){this._tooltipCleanup?.();this._tooltipCleanup=null;}
  _bindTooltip(){
    this._disconnectTooltip();
    const root=this.shadowRoot,chart=root.querySelector('.chart');if(!chart)return;
    const cleanups=[],listen=(target,event,handler,capture=false)=>{target?.addEventListener?.(event,handler,capture);cleanups.push(()=>target?.removeEventListener?.(event,handler,capture));};
    this._tooltipCleanup=()=>cleanups.splice(0).forEach(remove=>remove());
    const viewportChange=()=>this._hideTooltip();
    listen(window,'resize',viewportChange);
    const scroll=root.querySelector('.matrix-scroll');let scrollLeft=scroll?.scrollLeft ?? 0,scrollTop=scroll?.scrollTop ?? 0;
    const updateHint=()=>this._layoutMatrixLabels();
    updateHint();
    if(scroll&&typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(updateHint);observer.observe(scroll);cleanups.push(()=>observer.disconnect());}
    const targets=new Set([window,root]);for(let node=this;node;){const tree=node.getRootNode?.();if(!tree || targets.has(tree))break;targets.add(tree);node=tree.host;}
    for(const target of targets)listen(target,'scroll',event=>{
      if(event.composedPath().includes(root.querySelector('.tooltip')))return;
      if(event.target===scroll){
        const x=scroll.scrollLeft ?? 0,y=scroll.scrollTop ?? 0;
        if(x===scrollLeft && y===scrollTop)return;
        scrollLeft=x;scrollTop=y;
      }
      viewportChange();
    },true);
    listen(document,'pointerdown',event=>{if(!event.composedPath().includes(chart))this._hideTooltip();},true);
    listen(document,'keydown',event=>{if(event.key==='Escape' && this._tooltipKey){event.preventDefault();this._hideTooltip();}});
    chart.onpointerleave=()=>this._hideTooltip();
  }
  _matrixRow(row,index){
    const c=this._config,scale=this._scale,locale=isDutch(this._hass)?'nl-NL':'en-GB';
    const fmt=this._rowFormatter??=new Intl.DateTimeFormat(locale,{timeZone:this._zone||this._hass?.config?.time_zone||'UTC',weekday:'short',day:'numeric',month:'short'});
    return `<div class="matrix-row" role="row" aria-rowindex="${index+2}"><span class="day" role="rowheader">${esc(['week','month'].includes(c.aggregation_period)?row.key:fmt.format(row.timestamp))}</span>${row.cells.map(cell=>`<div role="cell" data-cell="${cell.key}" aria-label="${esc(this._label(cell))}" class="cell ${cell.value==null?'missing':''} ${!cell.intervals.length?'outside':''} ${cell.partial?'partial':''}"${cell.value!=null?` style="background-color:${scale.color(cell.value)}"`:''}></div>`).join('')}</div>`;
  }
  _heatmapHeader(options){
    const label=options.language==='nl'?'Grafiekopties':'Graph tools',open=this.shadowRoot.querySelector('.chart-tools')?.open;
    return cardHeader({...options,periods:{}}).replace('<div class="header-actions">',`<details class="chart-tools"${open?' open':''}><summary aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg></summary><div class="header-actions chart-tools-panel">`).replace('</div></header>',`</div></details>${options.periods.picker?`<div class="header-actions primary-timeframe"><div class="chart-controls" role="group" aria-label="${options.language==='nl'?'Tijdvak':'Timeframe'}">${options.periods.picker}${options.periods.navigation??''}</div></div>`:''}</header>`);
  }
  _layoutMatrixLabels(){
    const root=this.shadowRoot,scroll=root.querySelector('.matrix-scroll');if(!scroll||!globalThis.getComputedStyle)return;
    const ctx=document.createElement('canvas').getContext('2d');if(!ctx)return;
    const labels=[...root.querySelectorAll('.day,.hours span')];let rowHeight=this._config.cell_height;
    for(const node of labels)rowHeight=Math.max(rowHeight,Math.ceil(parseFloat(getComputedStyle(node).fontSize)*1.4));
    const measure=node=>{ctx.font=getComputedStyle(node).font;return Math.ceil(ctx.measureText(node.dataset.visualCaption??node.dataset.caption??node.textContent).width);};
    let column=Math.max(82,...labels.filter(n=>n.classList.contains('day')).map(n=>measure(n)+16));
    const reference=root.querySelector('.day');if(reference){ctx.font=getComputedStyle(reference).font;for(const row of this._rows)column=Math.max(column,Math.ceil(ctx.measureText(['week','month'].includes(this._config.aggregation_period)?row.key:this._rowFormatter.format(row.timestamp)).width)+16);}
    const captions=[...root.querySelectorAll('.hours span')].slice(1),count=captions.length;
    captions.forEach((node,i)=>{
      node.dataset.caption??=node.textContent;
      // The corner already identifies weeks; numeric captions preserve both
      // range endpoints even with enlarged text in a narrow dashboard column.
      node.dataset.visualCaption=this._config.aggregation_period==='week'?String(i+1):node.dataset.caption;
      node.setAttribute('aria-label',node.dataset.caption);
    });
    const available=scroll.clientWidth-(this._config.show_labels?column:0);
    // Saved gaps remain preferred, but never consume the complete data width.
    const gap=Math.min(this._config.cell_gap,Math.max(0,available/(count*3)));
    scroll.style.setProperty('--heatmap-label-width',column+'px');scroll.style.setProperty('--heatmap-gap',gap+'px');scroll.style.setProperty('--heatmap-row-height',rowHeight+'px');this._matrixLabelWidth=column;this._matrixRowHeight=rowHeight;
    const width=Math.max(0,(available-gap*(count-(this._config.show_labels?0:1)))/count);
    // Omit only visual captions. Column names and all cells stay accessible.
    // Keep boundary captions aligned inward; greedily retain legible intermediates.
    let edge=-Infinity;
    const lastWidth=captions.length?measure(captions.at(-1)):0;
    const end=available-gap-(this._config.show_labels?gap:0);
    captions.forEach((node,i)=>{

      const ink=measure(node),center=(i+.5)*(width+gap),start=i===0?0:i===count-1?end-ink:center-ink/2;
      const fits=i===0 || (start>=edge+8 && (i===count-1 || start+ink+8<=end-lastWidth));
      node.textContent=fits?node.dataset.visualCaption:'';
      node.style.justifySelf=i===0?'start':i===count-1?'end':'center';
      node.style.width='max-content';
      if(fits)edge=start+ink;
    });
  }
  _render(){
    if(!this._config){
      if(this._emptyConfig)this.shadowRoot.innerHTML=`<ha-card style="display:block;padding:16px">${isDutch(this._hass)?'Kies een sensor in de editor.':'Select a sensor in the editor.'}</ha-card>`;
      return;
    }
    const c=this._config,dutch=isDutch(this._hass),text=(en,nl)=>dutch?nl:en,language=dutch?'nl':'en';
    const toolsHadFocus=this.shadowRoot.activeElement?.matches?.('.chart-tools summary');
    const header=this._heatmapHeader;
    const tooltipKey=this._tooltipKey;
    captureChartInsights(this);
    const periods=periodControls(this,language),range=this._data?{start:this._start,end:this._end}:graphPeriodRange(this);
    const historyUrl=`/history?entity_id=${encodeURIComponent([c.entity,...(c.sum_entities??[])].join(','))}&start_date=${encodeURIComponent(new Date(range.start).toISOString())}&end_date=${encodeURIComponent(new Date(range.end).toISOString())}`;
    const name=this._sensorName();
    const scale=colorScale(this._rows,c);this._scale=scale;
    this._rowByKey=new Map(this._rows.map(row=>[row.key,row]));this._monthFormatter=null;this._dayFormatter=null;
    const zone=this._zone || this._hass?.config?.time_zone || 'UTC',locale=dutch?'nl-NL':'en-GB';
    const columns=heatmapColumns(c.aggregation_period,locale),columnCount=columns.length;
    const corner={hour:text('Day / hour','Dag / uur'),day:text('Week / day','Week / dag'),week:text('Year / week','Jaar / week'),month:text('Year / month','Jaar / maand')}[c.aggregation_period];
    const fmt=new Intl.DateTimeFormat(locale,{timeZone:zone,weekday:'short',day:'numeric',month:'short'});this._rowFormatter=fmt;
    const fullDate=new Intl.DateTimeFormat(locale,{timeZone:zone,weekday:'short',day:'numeric',month:'short',year:'numeric'});
    this._dateLabels=new Map(this._rows.map(row=>[row.key,fullDate.format(row.timestamp)]));
    this._virtualRows=false;
    this._cells=new Map(this._rows.flatMap(row=>row.cells).map(cell=>[cell.key,cell]));
    const matrix=this._rows.map((row,index)=>this._matrixRow(row,index)).join('');
    const sumErrors={sum_entity_missing:text('A selected sensor does not exist.','Een geselecteerde sensor bestaat niet.'),sum_unit_mismatch:text('All added sensors must have the same exact unit.','Alle opgetelde sensoren moeten exact dezelfde eenheid hebben.')};
    const status=this._status==='error'?(sumErrors[this._error]??(this._error==='consumption_statistics_required'?text('No counter statistics for one or more selected sensors.','Geen tellerstatistieken voor één of meer geselecteerde sensoren.'):text('Could not load data.','Laden mislukt.'))):text('Loading…','Laden…');
    const hasValues=this._rows.some(row=>row.cells.some(cell=>cell.value!=null)),information=this._information(language);
    disconnectPeriodControls(this,true);disconnectChartInsights(this,true);this._disconnectTooltip();
    this.shadowRoot.innerHTML=`<style>${cardHeaderStyles()}${uiActionButtonStyles()}${periodControlsStyles()}${chartInsightStyles()}${SharedGraph.tooltipStyles()}
      :host{display:block;height:auto!important;min-width:0;min-height:0;container-type:inline-size}
      ha-card{display:block;min-height:0;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));font-family:inherit}
      .content{display:flex;flex-direction:column;padding:var(--eleven-card-padding,16px);min-width:0;box-sizing:border-box}.content>.card-header,.content>.legend,.content>.status{flex-shrink:0}.chart{position:relative;display:flex;flex-direction:column;min-width:0}

      .matrix-well{display:flex;flex-direction:column;min-width:0;box-sizing:border-box;padding:10px}
      .matrix-scroll{min-width:0;overflow:visible;box-sizing:border-box;padding:0}
      .matrix{min-width:0;width:100%;display:grid;gap:var(--heatmap-gap,${c.cell_gap}px)}.matrix-row{display:grid;min-width:0;grid-template-columns:${c.show_labels?'var(--heatmap-label-width,82px) ':''}repeat(${columnCount},minmax(0,1fr));gap:var(--heatmap-gap,${c.cell_gap}px)}
      .hours{${c.show_labels?'':'display:none;'}margin-bottom:4px}
      .hours span{min-width:0;font-size:11px;text-align:center;color:var(--secondary-text-color,#666);line-height:var(--heatmap-row-height,${c.cell_height}px);white-space:nowrap}.hours span:first-child{text-align:start;padding-inline:0 8px;box-sizing:border-box;white-space:normal}.hours span:not(:first-child){align-self:end}
      .day{${c.show_labels?'':'display:none;'}font-size:11px;line-height:var(--heatmap-row-height,${c.cell_height}px);white-space:nowrap;color:var(--secondary-text-color,#666);padding-inline:0 8px;box-sizing:border-box}
      .cell{appearance:none;position:relative;border:0;border-radius:${c.border_radius}px;min-width:0;height:var(--heatmap-row-height,${c.cell_height}px);padding:0;cursor:default}
      .cell:hover{box-shadow:inset 0 0 0 2px var(--primary-text-color,#20252b)}
      .missing{background:repeating-linear-gradient(135deg,transparent,transparent 3px,var(--divider-color,#ddd) 3px,var(--divider-color,#ddd) 5px);box-shadow:inset 0 0 0 1px var(--divider-color,#ddd)}.outside{opacity:.35}
      .partial:after{content:'';position:absolute;right:0;bottom:2px;width:min(4px,100%);height:4px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 1px #20252b}
      .legend{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:6px 8px;font-size:11px;color:var(--secondary-text-color,#666);margin:8px 0 12px;font-variant-numeric:tabular-nums}
      .ramp{grid-column:1/-1;grid-row:1;width:100%;height:10px;border-radius:3px;background:${scale.gradient}}
      .legend-value{min-width:min-content;max-width:100%}.scale-number{display:inline-block;white-space:nowrap}.scale-unit{overflow-wrap:anywhere}.legend-value{grid-row:2}.legend-value:last-child{margin-inline-start:auto}
      .tooltip{pointer-events:auto}.tooltip .tooltip-label{color:var(--secondary-text-color,#666)}.tooltip .tooltip-value{color:var(--primary-text-color,#20252b);font-style:normal}
      .status{font-size:12px;line-height:1.5;margin:12px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      @media(forced-colors:active){.cell{border:1px solid CanvasText}.missing{border-style:dashed}}
    ${cardThemeStyles({chartUI:true,plots:'.matrix-well',wells:'.insight-sensor[data-ui-detail-surface]',controls:'.chart-controls>.period-controls>.period-trigger,.chart-controls>[data-period],.zoom-controls,.chart-links,.period-options [data-ui-button=surface],.period-custom [type=submit]',surfaces:'.tooltip,[data-ui-popup]'})}${uiBalancedTabsStyles()}
.content>.card-header{display:flex;align-items:center;gap:12px 8px;margin:0 0 4px;position:relative}
.content>.card-header h2{font-size:16px;line-height:24px;font-weight:600;flex:1 1 0;margin:0}
.chart-tools{margin-inline-start:auto;flex:none;height:24px}
.chart-tools summary{display:flex;align-items:center;justify-content:center;list-style:none;width:44px;height:44px;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));cursor:pointer;color:var(--secondary-text-color)}
.chart-tools summary{position:relative;top:-10px}
.chart-tools summary::-webkit-details-marker{display:none}
.chart-tools summary svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round}
.chart-tools summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}
.chart-tools-panel.header-actions{position:absolute;z-index:5;inset-inline-end:0;top:48px;width:max-content;max-width:100%;padding:8px;box-sizing:border-box;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);box-shadow:var(--eleven-material-surface-shadow,var(--ha-card-box-shadow,none));gap:8px;justify-content:flex-start}
.chart-tools:not([open])>.chart-tools-panel{display:none}
.primary-timeframe.header-actions{width:100%;flex:1 1 100%;margin:0;gap:0}
.primary-timeframe .chart-controls{width:100%;flex:1 1 100%}
.primary-timeframe .period-controls{min-width:0;flex:1 1 auto}
.primary-timeframe .period-trigger{font-size:12px}
</style><ha-card><div class="content">${header.call(this,{title:c.title,showTitle:c.show_title,historyUrl,language,periods,information})}
    ${this._status!=='ready'?`<div class="status" role="status"><span>${esc(status)}${this._data?' '+text('Previous data shown.','Vorige gegevens worden getoond.'):''}</span>${this._status==='error'?`${uiButton({variant:'action',className:'retry',text:text('Retry','Opnieuw')})}`:''}</div>`:''}
    ${this._data?`${!hasValues?`<p class="status" role="status">${text('No data','Geen gegevens')}</p>`:''}${c.show_legend?`<div class="legend" aria-label="${text('Color scale','Kleurschaal')}"><span class="legend-value"><span class="scale-number">${this._number(scale.min)}</span> <span class="scale-unit">${esc(this._data.unit)}</span></span><span class="ramp" aria-hidden="true"></span><span class="legend-value"><span class="scale-number">${this._number(scale.max)}</span> <span class="scale-unit">${esc(this._data.unit)}</span></span></div>`:''}<div class="chart"><div class="matrix-well"><div class="matrix-scroll" role="region" aria-label="${esc(name)}"><div class="matrix" role="table" aria-label="${esc(name)}" aria-rowcount="${this._rows.length+(c.show_labels?1:0)}" aria-colcount="${columnCount+(c.show_labels?1:0)}"><div class="matrix-row hours" role="row"><span role="columnheader">${corner}</span>${columns.map(label=>`<span role="columnheader">${esc(label)}</span>`).join('')}</div>${matrix}</div></div></div><div class="tooltip" id="heatmap-tooltip" role="tooltip" hidden></div></div>`:''}</div></ha-card>`;
    bindPeriodControls(this);bindChartInsights(this);this._layoutMatrixLabels();
    const tools=this.shadowRoot.querySelector('.chart-tools');if(tools){tools.onkeydown=e=>{if(e.key==='Escape'&&!e.target.closest?.('[popover]')){e.preventDefault();tools.open=false;tools.querySelector('summary').focus();}};this._chartToolsOutside??=e=>{const current=this.shadowRoot.querySelector('.chart-tools');if(current?.open&&!e.composedPath().includes(current)&&!e.composedPath().some(n=>n?.matches?.('[popover]')))current.open=false;};globalThis.document?.addEventListener?.('pointerdown',this._chartToolsOutside);if(toolsHadFocus)tools.querySelector('summary').focus({preventScroll:true});}
    const retry=this.shadowRoot.querySelector('.retry');if(retry)retry.onclick=()=>this._refresh();

    this._bindTooltip();
    const grid=this.shadowRoot.querySelector('.matrix');
    if(grid){
      this._cellElements=new Map([...grid.querySelectorAll('[data-cell]')].map(element=>[element.dataset.cell,element]));
      const target=e=>e.target.closest('[data-cell]');
      grid.onpointerover=e=>{const cell=target(e);if(cell && e.pointerType!=='touch')this._showTooltip(cell.dataset.cell);};
      const cell=this._cellElements.get(tooltipKey);
      if(cell?.matches(':hover'))this._showTooltip(tooltipKey);else this._hideTooltip();
    }
  }
}
