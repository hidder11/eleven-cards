import {cardThemeStyles} from '../../../shared/card-theme.js';
import {connectTimeframeSync,disconnectTimeframeSync} from '../../../shared/periods.js';
import {graphPeriodRange,resetGraphPeriod} from '../../../shared/periods.js';
import {normalizeConfig,numeric,color,escapeHtml,PALETTE,historyUrl,historySeries,delta,sparkline,overviewSectionLayout} from './overview-utils.js';
import {retryDelay} from '../../../shared/request.js';
import {uiButton} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
const esc=escapeHtml;
const nl=h=>String(h?.locale?.language??h?.language??'en').startsWith('nl');
const labels={sync_timeframe:['Tijdvak synchroniseren','Synchronize timeframe'],hover_sync_group:['Synchronisatiegroep','Synchronization group'],title:['Titel','Title'],hours_to_show:['Periode (uur)','Period (hours)'],columns:['Kolommen','Columns'],show_graph:['Trendlijnen tonen','Show sparklines'],show_delta:['Verandering tonen','Show change'],entity:['Sensor','Sensor'],name:['Naam','Name'],color:['Kleur','Color']};
const helpers={sync_timeframe:['Deelt tijdvakkeuze en vorige/volgende/Nu met ingeschakelde kaarten in dezelfde groep.','Shares timeframe selection and previous/next/Now with enabled cards in the same group.'],hover_sync_group:['Kaarten met dezelfde groep delen hover en tijdvak als de bijbehorende synchronisatie aanstaat. Leeg gebruikt de standaardgroep.','Cards with the same group share hover and timeframe when the corresponding synchronization is enabled. Empty uses the default group.'],};
labels.section_size=['Grootte sensorsecties','Sensor section size'];
labels.graph_height=['Grafiekhoogte (px)','Graph height (px)'];
helpers.section_size=['Past de ruimte, getalgrootte en standaard grafiekhoogte voor alle sensoren aan.','Adjusts spacing, value size and default graph height for all sensors.'];
helpers.graph_height=['Optioneel, 24–160 px. Leeg volgt de gekozen sectiegrootte.','Optional, 24–160 px. Leave empty to follow the section size.'];
function form(schema){return {schema,computeLabel:function(s){return labels[s.name]?.[nl(this?.hass)?0:1]??s.name;},computeHelper:function(s){return helpers[s.name]?.[nl(this?.hass)?0:1];}};}
export class OverviewEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(c){this._config=normalizeConfig(c,{draft:true});this._render();}
 set hass(h){this._hass=h;this._render();}get hass(){return this._hass;}
 _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,entities:this._config.entities.filter(r=>r.entity).map(r=>({...r,color:Array.isArray(r.color)?[...r.color]:r.color}))}},bubbles:true,composed:true}));}
 _bind(node,definition,data){node.hass=this._hass;node.schema=definition.schema.map(field=>field.name==='section_size'?{...field,selector:{select:{...field.selector.select,options:field.selector.select.options.map(option=>({...option,label:nl(this._hass)?{compact:'Compact',standard:'Standaard',spacious:'Ruim'}[option.value]:option.label}))}}}:field);node.data=data;node.computeLabel=s=>definition.computeLabel.call(this,s);node.computeHelper=s=>definition.computeHelper?.call(this,s);}
 _render(){
  if(!this._config||!this._hass)return;const dutch=nl(this._hass);
  if(!this._form){this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}h3{font-size:16px;margin:24px 0 12px}details{border:1px solid var(--divider-color);border-radius:12px;margin:12px 0;min-width:0}summary{padding:12px;min-height:44px;box-sizing:border-box;cursor:pointer;overflow-wrap:anywhere}.body{padding:0 12px 12px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{font:inherit;min-height:44px;border:1px solid var(--divider-color);border-radius:6px;padding:8px 12px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.4}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.remove{margin-left:auto}</style><ha-form class="global"></ha-form><h3></h3><div class="sensors"></div><button class="add" type="button"></button>`;
   this._form=this.shadowRoot.querySelector('.global');this._form.addEventListener('value-changed',e=>{e.stopPropagation();this._config=normalizeConfig({...this._config,...e.detail.value,entities:this._config.entities},{draft:true});this._emit();});
   this.shadowRoot.querySelector('.add').onclick=()=>{this._config={...this._config,entities:[...this._config.entities,{entity:'',color:PALETTE[this._config.entities.length%PALETTE.length]}]};this._render();this.shadowRoot.querySelector('.sensors').lastElementChild.open=true;};
  }
  this._bind(this._form,OverviewCard.getConfigForm(),this._config);this.shadowRoot.querySelector('h3').textContent=dutch?'Sensoren':'Sensors';const add=this.shadowRoot.querySelector('.add');add.textContent=dutch?'Sensor toevoegen':'Add sensor';
  const container=this.shadowRoot.querySelector('.sensors');while(container.children.length>this._config.entities.length)container.lastElementChild.remove();
  this._config.entities.forEach((r,i)=>{let entry=container.children[i];if(!entry){entry=document.createElement('details');entry.innerHTML='<summary></summary><div class="body"><ha-form></ha-form><div class="actions"><button class="up" type="button"></button><button class="down" type="button"></button><button class="remove" type="button"></button></div></div>';container.append(entry);entry.open=this._config.entities.length===1;
   entry.querySelector('ha-form').addEventListener('value-changed',e=>{e.stopPropagation();const rows=this._config.entities.map((row,j)=>j===i?{...row,...e.detail.value}:row);this._config={...this._config,entities:rows};this._render();this._emit();});
   for(const [key,d] of [['up',-1],['down',1],['remove',0]])entry.querySelector('.'+key).onclick=()=>{const rows=[...this._config.entities];if(key==='remove')rows.splice(i,1);else{const j=i+d;if(j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]];}this._config={...this._config,entities:rows};this._render();this._emit();};
  }
  entry.querySelector('summary').textContent=r.name||this._hass.states?.[r.entity]?.attributes?.friendly_name||r.entity||(dutch?'Nieuwe sensor':'New sensor');this._bind(entry.querySelector('ha-form'),OverviewCard.getSensorForm(),r);
  for(const [key,title] of [['up',dutch?'Omhoog':'Move up'],['down',dutch?'Omlaag':'Move down'],['remove',dutch?'Verwijderen':'Remove']]){const b=entry.querySelector('.'+key);b.textContent=title;b.disabled=key==='up'?i===0:key==='down'?i===this._config.entities.length-1:false;}
  });
 }
}
export class OverviewCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._history={};this._units={};this._status='loading';this._connected=false;this._timer=null;this._readings=new Map();this._animationFrame=null;}
 static getConfigForm(){return form([{name:'title',selector:{text:{}}},{name:'hours_to_show',selector:{number:{min:1,max:168,step:1,mode:'box'}}},{name:'columns',selector:{select:{mode:'dropdown',options:[{value:'auto',label:'Auto'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'}]}}},{name:'section_size',selector:{select:{mode:'dropdown',options:[{value:'compact',label:'Compact'},{value:'standard',label:'Standard'},{value:'spacious',label:'Spacious'}]}}},{name:'graph_height',selector:{number:{min:24,max:160,step:1,mode:'box'}}},{name:'show_graph',selector:{boolean:{}}},{name:'show_delta',selector:{boolean:{}}},{name:'sync_timeframe',default:false,selector:{boolean:{}}},{name:'hover_sync_group',selector:{text:{}}}]);}
 static getSensorForm(){return form([{name:'entity',required:true,selector:{entity:{domain:'sensor'}}},{name:'name',selector:{text:{}}},{name:'color',selector:{color_rgb:{}}}]);}
 static async getConfigElement(){if(!customElements.get('ha-form')){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();await customElements.whenDefined('ha-form');}if(!customElements.get('eleven-overview-editor'))customElements.define('eleven-overview-editor',OverviewEditor);return document.createElement('eleven-overview-editor');}
 static getStubConfig(hass){return {title:'Eleven Overview',hours_to_show:24,entities:Object.entries(hass?.states??{}).filter(([id,s])=>id.startsWith('sensor.')&&numeric(s.state)!=null).slice(0,4).map(([id])=>id)};}
 setConfig(config){this._stopAnimation();this._config=normalizeConfig(config);this._generation++;this._promise=null;this._history={};this._status='loading';this._refreshFailures=0;resetGraphPeriod(this);clearTimeout(this._timer);connectTimeframeSync(this);this._render();if(this._connected)this._refresh();}
 set hass(h){
  this._hass=h;
  const signature=JSON.stringify([h?.locale?.language??h?.language,h?.config?.time_zone,this._config?.entities.map(row=>{const state=h?.states?.[row.entity];return [state?.state,state?.attributes?.friendly_name,state?.attributes?.unit_of_measurement];})]);
  if(signature!==this._hassSignature){this._hassSignature=signature;this._render();}
  if(this._connected&&!this._promise&&this._status==='loading')this._refresh();
 }get hass(){return this._hass;}
 connectedCallback(){this._connected=true;connectTimeframeSync(this);this._refresh();}
 disconnectedCallback(){this._layoutObserver?.disconnect();disconnectTimeframeSync(this);this._stopAnimation();this._connected=false;this._generation++;this._promise=null;clearTimeout(this._timer);this._timer=null;}
 getCardSize(){const c=this._config??{},layout=overviewSectionLayout(c),columns=c.columns&&c.columns!=='auto'?Number(c.columns):2,rows=Math.ceil((c.entities?.length??1)/columns),height=layout.padding*2+24+layout.value*1.25+(c.show_graph!==false?layout.graph+8:0)+(c.show_delta!==false?40:0);return Math.ceil((60+rows*(height+layout.gap))/50);}
 getGridOptions(){return {columns:12,min_columns:6,rows:Math.max(2,Math.ceil(this.getCardSize()*50/64)),min_rows:2};}
 // Only the visual reading is interpolated; sensor values remain authoritative.
 _stopAnimation(){if(this._animationFrame!=null)cancelAnimationFrame(this._animationFrame);this._animationFrame=null;this._readings.clear();}
 _reading(id,target,unit){
  const previous=this._readings.get(id),reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||globalThis.document?.hidden;
  if(!this._connected||typeof requestAnimationFrame!=='function'||reduced||target==null||previous?.value==null||previous.unit!==unit){this._readings.set(id,{value:target,target,unit});return target;}
  if(previous.target!==target){this._readings.set(id,{value:previous.value,from:previous.value,target,unit,start:null});this._queueAnimation();}
  return this._readings.get(id).value;
 }
 _queueAnimation(){
  if(this._animationFrame!=null||!this._connected)return;
  this._animationFrame=requestAnimationFrame(time=>{
   this._animationFrame=null;let pending=false;
   const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   for(const entry of this._readings.values()){
    if(entry.value===entry.target)continue;
    entry.start??=time;const progress=reduced?1:Math.min(1,(time-entry.start)/320);
    // Damped spring: quick acceleration, <1% overshoot, exact 320ms finish.
   const x=10*progress,damping=0.85,frequency=Math.sqrt(1-damping*damping);
   const eased=1-Math.exp(-damping*x)*(Math.cos(frequency*x)+damping/frequency*Math.sin(frequency*x));
   entry.value=progress===1?entry.target:entry.from+(entry.target-entry.from)*eased;
    pending ||= progress<1;
   }
   // Avoid rebuilding charts or disturbing focus on animation frames.
   this.shadowRoot.querySelectorAll('.metric').forEach(node=>{const entry=this._readings.get(node.dataset.entity);if(entry?.value!=null)node.querySelector('.value').textContent=this._format(entry.value,entry.target);});
   if(pending)this._queueAnimation();
  });
 }
 _format(value,target){const locale=this._hass?.locale?.language??this._hass?.language??'en',reference=target??value;try{const formatter=new Intl.NumberFormat(locale,Math.abs(reference)>0&&Math.abs(reference)<0.01?{maximumSignificantDigits:3}:{maximumFractionDigits:2});if(target===undefined)return formatter.format(value);const digits=formatter.formatToParts(reference).find(part=>part.type==='fraction')?.value.length??0;return new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(value);}catch{return String(value);}}
 _reloadPeriod(){this._stopAnimation();this._generation++;this._promise=null;this._history={};this._status='loading';this._refreshFailures=0;clearTimeout(this._timer);this._render();return this._refresh();}
 _refresh(){
  if(!this._connected||!this._hass||!this._config)return Promise.resolve();if(this._promise)return this._promise;
  clearTimeout(this._timer);const generation=this._generation,{start,end}=graphPeriodRange(this),ids=this._config.entities.map(r=>r.entity),hass=this._hass;
  const units=Object.fromEntries(ids.map(id=>[id,hass.states?.[id]?.attributes?.unit_of_measurement??'']));
  let requestTimer;const work=(async()=>{try{const data=await Promise.race([hass.callApi('GET',historyUrl(ids,start,end)),new Promise((_,reject)=>{requestTimer=setTimeout(()=>reject(Error('History timeout')),15000);})]);if(!this._connected||generation!==this._generation)return;
    if(!Array.isArray(data))throw Error('Invalid history');
    const grouped=new Map(data.filter(r=>Array.isArray(r)&&r.length).map(r=>[r[0].entity_id,r]));this._history=Object.fromEntries(ids.map(id=>[id,historySeries(grouped.get(id),start,end,units[id])]));this._units=units;this._start=start;this._end=end;this._status='ready';this._refreshFailures=0;
   }catch{if(generation===this._generation&&this._connected){this._status='error';this._refreshFailures=(this._refreshFailures??0)+1;}}
   finally{clearTimeout(requestTimer);if(generation===this._generation&&this._connected){this._promise=null;this._render();this._timer=setTimeout(()=>this._refresh(),retryDelay(this._refreshFailures??0));}}
  })();this._promise=work;return work;
 }
 // Fit the configured upper bound to atomic values and actual label fonts.
 // Observe text too: text enlargement need not resize the outer card.
 _observeLayout(){
  if(typeof ResizeObserver!=='function')return;
  this._layoutObserver??=new ResizeObserver(()=>this._fitColumns());
  this._layoutObserver.disconnect();
  const grid=this.shadowRoot.querySelector('.grid');if(!grid)return;
  this._layoutObserver.observe(grid);
  this.shadowRoot.querySelectorAll('.value,.label,.unit,.delta,h2,.period').forEach(node=>this._layoutObserver.observe(node));
  this._fitColumns();
 }
 _fitColumns(){
  const grid=this.shadowRoot.querySelector('.grid');if(!grid)return;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  const wordWidth=node=>{const style=getComputedStyle(node);ctx.font=style.font;return Math.max(0,...node.textContent.split(/[\s-]+/u).map(word=>ctx.measureText(word).width));};
  const title=this.shadowRoot.querySelector('h2'),period=this.shadowRoot.querySelector('.period');
  const titleMinimum=wordWidth(title);ctx.font=getComputedStyle(period).font;
  this.shadowRoot.querySelector('header').classList.toggle('stacked',titleMinimum+12+ctx.measureText(period.textContent).width>grid.clientWidth);
  const layout=overviewSectionLayout(this._config),gap=layout.gap,inset=layout.padding*2+2;
  let minimum=layout.minimum;const values=[];
  this.shadowRoot.querySelectorAll('.metric').forEach(metric=>{
   const value=metric.querySelector('.value');value.style.removeProperty('font-size');
   const range=document.createRange();range.selectNodeContents(value);
   const scale=metric.getBoundingClientRect().width/metric.offsetWidth||1;
   let width=range.getBoundingClientRect().width/scale;
   values.push({node:value,width,font:parseFloat(getComputedStyle(value).fontSize)});
   for(const node of metric.querySelectorAll('.name,.unit,.delta'))width=Math.max(width,wordWidth(node)+(node.matches('.name')?15:0));
   minimum=Math.max(minimum,Math.ceil(width)+inset);
  });
  const configured=this._config.columns==='auto'?2:Number(this._config.columns),columns=Math.max(1,Math.min(configured,this._config.entities.length,Math.floor((grid.clientWidth+gap)/(minimum+gap))));
  grid.style.setProperty('--overview-columns',String(columns));
  // Only a value wider than the full available reading needs smaller type.
  // Never split or round the authoritative numeric text to make it fit.
  const available=(grid.clientWidth-gap*(columns-1))/columns-inset;
  for(const value of values)if(value.width>available&&available>0)value.node.style.fontSize=`${value.font*available/value.width}px`;
 }
 _render(){
  if(!this._config)return;const c=this._config,layout=overviewSectionLayout(c),dutch=nl(this._hass),active=this.shadowRoot.activeElement,focus=active?.dataset.entity,retryFocus=active?.classList.contains('retry');
  const synced=!!this._sharedTimeframe,range=this._status==='ready'?{start:this._start,end:this._end}:graphPeriodRange(this),formatter=new Intl.DateTimeFormat(dutch?'nl-NL':'en-GB',{timeZone:this._hass?.config?.time_zone||'UTC',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const period=synced?formatter.formatRange(range.start,range.end):`${c.hours_to_show} ${dutch?'uur':'hours'}`,cells=c.entities.map((row,i)=>{
   const s=this._hass?.states?.[row.entity],unit=s?.attributes?.unit_of_measurement??'',history=this._status==='ready'&&this._units[row.entity]===unit?this._history[row.entity]:null,v=synced?(history?.points.at(-1)?.v??null):numeric(s?.state),name=row.name||s?.attributes?.friendly_name||row.entity,displayValue=this._reading(row.entity,v,unit);
   const change=delta(history,v),path=history?sparkline(history.points,this._start,this._end):'';
   const status=!s?(dutch?'Sensor niet gevonden':'Entity not found'):v==null?(synced&&this._status==='loading'?(dutch?'Geschiedenis laden…':'Loading history…'):synced?(dutch?'Geen historische waarde':'No historical value'):(dutch?'Niet beschikbaar':'Unavailable')):'';
   const graphStatus=this._status==='loading'?(dutch?'Geschiedenis laden…':'Loading history…'):this._status==='error'?(dutch?'Geen geschiedenis geladen':'History not loaded'):dutch?'Geen geschiedenis':'No history';
   const difference=change==null?(dutch?'Geen vergelijkingspunt':'No comparison point'):`${change>0?'+':''}${this._format(change)}${unit?' '+(unit==='%'?'pp':unit):''}`;
   const label=`<span class="label"><i></i><span class="name">${esc(name)}</span></span>`;
   const reading=`<span class="reading"><span class="value">${v==null?'—':esc(this._format(displayValue,v))}</span>${v!=null&&unit?`<span class="unit">${esc(unit)}</span>`:''}${status?`<span class="status">${status}</span>`:''}</span>`;
   const compact=c.section_size==='compact',heading=compact?`<span class="compact-heading">${label}${reading}</span>`:label+reading;
   const changeMarkup=`<span class="delta">${v==null?'—':esc(difference)}</span><span class="caption">${dutch?'sinds begin periode':'since period start'}</span>`;
   return `<button type="button" class="metric" data-entity="${esc(row.entity)}" aria-label="${esc(name+': '+(status||this._format(v)+' '+unit))}" style="--series-color:${color(row.color,PALETTE[i%PALETTE.length])}">${heading}${c.show_graph?`<span class="spark">${path?`<svg viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>`:`<span>${graphStatus}</span>`}</span>`:''}${c.show_delta?(compact?`<span class="compact-change">${changeMarkup}</span>`:changeMarkup):''}</button>`;
  }).join('');
  this.shadowRoot.innerHTML=`<style>${uiActionButtonStyles()}
:host{display:block;height:auto;min-width:0;min-height:0;container-type:inline-size}
ha-card{display:block;min-height:100%;font-family:inherit;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b)}
.content{padding:var(--eleven-card-padding,16px);box-sizing:border-box;min-width:0}
header{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px 12px;margin-bottom:16px}
h2{flex:1 1 160px;font-size:16px;font-weight:600;letter-spacing:normal;line-height:1.4;margin:0;overflow-wrap:anywhere}
header.stacked h2{flex-basis:100%}
header.stacked .period{text-align:start}
.period{font-size:12px;line-height:1.4;text-align:end;white-space:nowrap;flex:0 0 auto;color:var(--secondary-text-color,#666)}
.period.synced{flex:0 1 auto;white-space:normal;overflow-wrap:normal;max-width:100%;text-align:start}
.grid{display:grid;grid-template-columns:repeat(var(--overview-columns,1),minmax(0,1fr));column-gap:${layout.gap}px;row-gap:0;align-items:stretch}
.metric{appearance:none;font:inherit;color:inherit;background:var(--eleven-material-plot-background,transparent);border:1px solid var(--divider-color,#ddd);border-radius:10px;text-align:start;min-width:0;min-height:44px;padding:${layout.padding}px;cursor:pointer;display:grid;grid-template-rows:subgrid;grid-row:span ${2+(c.show_graph?1:0)+(c.show_delta?2:0)};align-content:start;margin-bottom:${layout.gap}px}
.metric:focus-visible,.retry:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px}
.label{font-size:13px;color:var(--secondary-text-color,#666);line-height:1.4;overflow-wrap:anywhere;display:flex;align-items:baseline;gap:7px;min-width:0}
.label i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--series-color);flex-shrink:0}
.name{min-width:0}
.reading{display:flex;align-items:baseline;align-content:start;flex-wrap:wrap;gap:4px 6px;margin-top:6px;font-variant-numeric:tabular-nums;min-width:0}
.value{font-size:${layout.value}px;font-weight:600;line-height:1.25;white-space:nowrap;flex:0 0 auto;letter-spacing:-.025em}
.unit{font-size:13px;line-height:1.4;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;min-width:0}
.spark{height:${layout.graph}px;box-sizing:border-box;display:flex;align-items:center;margin-top:8px;padding:2px;color:var(--secondary-text-color,#666);font-size:11px;line-height:1.4;min-width:0}
.spark svg{width:100%;height:${layout.graph-4}px;overflow:visible}
.spark path{fill:none;stroke:var(--series-color);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.delta{font-size:12px;line-height:1.4;font-variant-numeric:tabular-nums;margin-top:8px;overflow-wrap:normal;min-width:0}
.caption{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin-top:2px;overflow-wrap:normal}
.status{font-size:12px;line-height:1.4;color:var(--secondary-text-color,#666);flex-basis:100%}
.error{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:16px;font-size:12px;color:var(--secondary-text-color,#666)}
.error>span{flex:1 1 140px}

.grid{margin-bottom:-${layout.gap}px}
${c.section_size==='compact'?`
.grid{row-gap:8px;margin-bottom:0}
.metric{display:flex;flex-direction:column;grid-row:auto;margin-bottom:0}
.compact-heading{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:4px 10px;min-width:0;width:100%}
.compact-heading .label{flex:1 1 70px;align-self:flex-start;align-items:flex-start}
.compact-heading .label i{margin-top:5px}
.compact-heading .reading{margin:0 0 0 auto;justify-content:flex-end;max-width:100%}
.spark{width:100%}
.compact-change{display:flex;align-items:baseline;gap:8px;margin-top:8px;width:100%}
.compact-change .delta,.compact-change .caption{margin:0;overflow-wrap:anywhere}
.compact-change .delta{flex:0 1 auto;max-width:55%}
.compact-change .caption{flex:1 1 0;min-width:0}
`:''}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
${cardThemeStyles({wells:'.metric',controls:'.retry'})}</style><ha-card><div class="content"><header><h2>${esc(c.title)}</h2><span class="period${synced?' synced':''}">${period}</span></header><div class="grid">${cells}</div>${this._status==='error'?`<div class="error" role="status"><span>${synced?(dutch?'Geschiedenis kon niet worden geladen.':'History could not be loaded.'):(dutch?'Geschiedenis kon niet worden geladen. Actuele waarden blijven beschikbaar.':'History could not be loaded. Live values remain available.')}</span>${uiButton({variant:'action',className:'retry',text:dutch?'Opnieuw':'Retry'})}</div>`:''}</div></ha-card>`;
  this.shadowRoot.querySelectorAll('.metric').forEach(b=>{b.onclick=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:b.dataset.entity},bubbles:true,composed:true}));if(b.dataset.entity===focus)b.focus();});const retry=this.shadowRoot.querySelector('.retry');if(retry)retry.onclick=()=>this._refresh();if(retryFocus)(retry??this.shadowRoot.querySelector('.metric'))?.focus();this._observeLayout();
 }
}
