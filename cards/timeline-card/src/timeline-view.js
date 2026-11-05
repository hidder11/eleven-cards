import {SharedGraph} from '../../../shared/graph.js';
import {uiButton} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
import {timelineStateDurations} from './timeline-utils.js';
import {cardHeader,cardHeaderStyles} from '../../../shared/card-header.js';
import {graphPeriodRange,chooseGraphPeriod,moveGraphPeriod} from '../../../shared/periods.js';
import {periodControls,periodControlsStyles,bindPeriodControls,disconnectPeriodControls} from '../../../shared/period-controls.js';
import {chartZoomState,chartDataInformation,captureChartInsights,bindChartInsights,chartInsightStyles} from '../../../shared/chart-insights.js';
const escapeTimeline=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TimelineView={
 _historyUrl(){const range=graphPeriodRange(this),ready=this._status==='ready';const end=this._viewport?.[1]??(ready?this._end:range.end)??range.end,start=this._viewport?.[0]??(ready?this._start:range.start)??range.start;return `/history?entity_id=${encodeURIComponent(this._config.entities.join(','))}&start_date=${encodeURIComponent(new Date(start).toISOString())}&end_date=${encodeURIComponent(new Date(end).toISOString())}`;},
 _setPeriod(hours){return chooseGraphPeriod(this,String(hours));},
 _navigate(direction){return moveGraphPeriod(this,direction);},
  _reloadPeriod(){this._generation++;this._inFlight=false;this._viewport=null;this._hideTooltip();clearTimeout(this._timer);this._status='loading';this._refreshFailures=0;this._render();return this._refresh();},
 _ticks(){const width=this.shadowRoot.host?.clientWidth??600,count=width<400?3:5;return Array.from({length:count},(_,i)=>i/(count-1));},
 _segmentAppearance(s,id){return s.missing?{label:this._nl()?'Geen geschiedenis':'No history',color:'transparent'}:this._appearance(s.state,id);},
 _insightColor(index){
  const id=this._config.entities[index],segments=this._series[index]??[];
  for(let i=segments.length-1;i>=0;i--){const segment=segments[i];if(!segment.missing&&segment.start<this._viewEnd&&segment.end>this._viewStart)return this._appearance(String(segment.state),id).color;}
  return 'var(--primary-color,#2196f3)';
 },
 _dataInformation(){
  const start=this._viewStart,end=this._viewEnd;
  return {start,end,rows:this._config.entities.map((id,i)=>{
   const durations=timelineStateDurations(this._series[i]??[],start,end).map(s=>({...s,label:this._segmentAppearance(s,id).label}));
   const known=durations.filter(s=>!s.missing);
   return {id,durations,count:known.length,missing:known.reduce((sum,s)=>sum+s.duration,0)<end-start-1,limited:!!this._stateLimits?.[i]};
  })};
 },
 _summary(index){const totals=new Map();for(const s of this._series[index]??[]){const ms=Math.max(0,Math.min(s.end,this._viewEnd)-Math.max(s.start,this._viewStart)),label=this._segmentAppearance(s,this._config.entities[index]).label;if(ms)totals.set(label,(totals.get(label)??0)+ms);}return [...totals].map(([label,ms])=>`${label}: ${this._duration(ms)}`).join(' · ');},
 _stateLimitMessage(){return this._nl()?'Maximaal 20 verschillende statussen per entiteit. Deze entiteit heeft er meer in de gekozen periode.':'Maximum 20 distinct states per entity. This entity has more in the selected period.';},
 _name(id){return this._config.series_options.find(x=>x.entity===id)?.name??this._hass?.states?.[id]?.attributes?.friendly_name??id;},
 _duration(ms){const minutes=Math.floor(ms/60000);return minutes<1?'<1 min':minutes<60?`${minutes} min`:`${Math.floor(minutes/60)}${this._nl()?'u':'h'} ${minutes%60} min`;},
 _zoom(factor){
  this._hideTooltip();if(!factor)this._viewport=null;
  else{const a=this._viewport?.[0]??this._start,b=this._viewport?.[1]??this._end,width=Math.min(this._end-this._start,Math.max(60000,(b-a)*factor)),center=(a+b)/2,start=Math.max(this._start,Math.min(this._end-width,center-width/2));this._viewport=[start,start+width];}
  this._render();
 },
 _receiveHover(t){if(t===null||!Number.isFinite(t)||t<this._viewStart||t>this._viewEnd){this._hideTooltip(false);return;}this._showTooltip(t,false);},
 _segmentAt(segments,t,end){let low=0,high=segments.length;while(low<high){const mid=(low+high)>>1;if(segments[mid].start<=t)low=mid+1;else high=mid;}const segment=segments[low-1];return segment&&(t<segment.end||(t===end&&segment.end===end))?segment:null;},
 _hideTooltip(publish=true){if(this._hoverFrame!=null)globalThis.cancelAnimationFrame?.(this._hoverFrame);this._hoverFrame=null;this._hoverTime=null;if(publish)SharedGraph.clearHover(this);this._pointerFocusPending=null;this._cursor=null;this._pinned=false;for(const cls of ['tooltip','guide']){const el=this.shadowRoot.querySelector('.'+cls);if(el)el.hidden=true;}},
 _showTooltip(t,publish=true){
  if(!SharedGraph.tooltipInView(this)){this._hideTooltip(publish);return;}
  const chart=this.shadowRoot.querySelector('.chart'),tooltip=chart?.querySelector('.tooltip'),guide=chart?.querySelector('.guide');if(!tooltip)return;
  this._cursor=t;const nl=this._nl(),a=this._viewStart,b=this._viewEnd,esc=escapeTimeline;
  tooltip.innerHTML=`<strong>${esc(this._time(t))}</strong>`+this._config.entities.map((id,i)=>{if(!this._isSeriesVisible(i)||this._stateLimits?.[i])return '';const s=this._segmentAt(this._series[i]??[],t,b),v=s?this._segmentAppearance(s,id):{label:nl?'Geen geschiedenis':'No history',color:'transparent'};return `<span><i style="background:${v.color}"></i><b class="tooltip-label">${esc(this._name(id))} <em class="tooltip-value">${esc(v.label)}</em></b>${s?`<small>${esc(this._time(s.start))} – ${esc(this._time(s.end))} · ${esc(this._duration(s.end-s.start))}</small>`:''}</span>`;}).join('');
  tooltip.hidden=false;tooltip.style.pointerEvents=this._pinned?'auto':'none';const box=chart.getBoundingClientRect(),px=(t-a)/(b-a)*box.width;
  if(guide){guide.hidden=false;guide.style.left=`${px}px`;}
  tooltip.style.maxHeight=`${Math.min(360,(window.innerHeight??480)-16)}px`;
  const measured=tooltip.getBoundingClientRect();let left=px+14;if(left+measured.width>box.width-4)left=px-measured.width-14;tooltip.style.left=`${Math.max(4,Math.min(box.width-measured.width-4,left))}px`;tooltip.style.top=`${Math.max(8-box.top,Math.min(0,(window.innerHeight??480)-box.top-measured.height-8))}px`;
  if(publish)SharedGraph.publishHover(this,t);
 },
 _endTouch(pointerId){
  if(this._touchPointer!==pointerId)return;
  this._touchPointer=null;
  if(this._touchRenderPending){this._touchRenderPending=false;this._render();}
 },
 _bindInteractions(){
  const chart=this.shadowRoot.querySelector('.chart');if(!chart)return;
  const timestamp=e=>{const r=chart.getBoundingClientRect();return this._viewStart+Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*(this._viewEnd-this._viewStart);};
  let drag=null;const selection=chart.querySelector('.zoom-selection');
  chart.onpointermove=e=>{if(this._touchPointer!=null&&e.pointerId===this._touchPointer){this._showTooltip(timestamp(e));return;}if(drag&&Math.abs(e.clientX-drag.x)>=6){this._hideTooltip();const r=chart.getBoundingClientRect(),x=Math.max(r.left,Math.min(r.right,e.clientX));selection.hidden=false;selection.style.left=`${(Math.min(drag.x,x)-r.left)/r.width*100}%`;selection.style.width=`${Math.abs(x-drag.x)/r.width*100}%`;}else if(!this._pinned&&e.pointerType!=='touch'){this._hoverTime=timestamp(e);if(this._hoverFrame==null){if(typeof requestAnimationFrame==='function')this._hoverFrame=requestAnimationFrame(()=>{this._hoverFrame=null;if(this.shadowRoot.querySelector('.chart')===chart&&!this._pinned&&this._hoverTime!=null)this._showTooltip(this._hoverTime);});else this._showTooltip(this._hoverTime);}}};
  chart.onpointerdown=e=>{if(e.target?.closest?.('[data-series],.tooltip')||(e.button??0)!==0)return;if(e.pointerType==='touch')this._touchPointer=e.pointerId;this._pointerFocusPending=e.target?.closest?.('.segment')??null;this._pinned=true;this._showTooltip(timestamp(e));if(e.pointerType==='mouse'){drag={x:e.clientX,t:timestamp(e)};chart.setPointerCapture?.(e.pointerId);}};
  chart.onpointerup=e=>{selection.hidden=true;if(drag){const d=drag;drag=null;if(Math.abs(e.clientX-d.x)>=6){const t=timestamp(e),a=Math.min(d.t,t),b=Math.max(d.t,t);if(b-a>=60000){this._hideTooltip();this._viewport=[a,b];this._render();}}}this._endTouch(e.pointerId);};
  chart.onpointercancel=e=>{drag=null;selection.hidden=true;this._hideTooltip();this._endTouch(e.pointerId);};chart.onlostpointercapture=e=>{drag=null;selection.hidden=true;this._endTouch(e.pointerId);};chart.onpointerleave=()=>{if(!this._pinned&&!drag)this._hideTooltip();};
  chart.onkeydown=e=>{this._pointerFocusPending=null;if(e.key==='Escape'){drag=null;selection.hidden=true;this._hideTooltip();return;}if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const times=[...new Set([this._viewStart,...this._series.flatMap((s,i)=>this._isSeriesVisible(i)?s.map(v=>v.start):[]).filter(t=>t>this._viewStart&&t<this._viewEnd),this._viewEnd])].sort((a,b)=>a-b);let i=times.findIndex(t=>t>=(this._cursor??this._viewStart));if(i<0)i=times.length-1;i=e.key==='Home'?0:e.key==='End'?times.length-1:Math.max(0,Math.min(times.length-1,i+(e.key==='ArrowRight'?1:-1)));this._pinned=true;this._showTooltip(times[i]);};
  chart.onfocusout=e=>{if(!chart.contains(e.relatedTarget))this._hideTooltip();};this.shadowRoot.querySelectorAll('.segment').forEach(button=>{button.onfocus=()=>{const fromPointer=this._pointerFocusPending===button;this._pointerFocusPending=null;if(fromPointer&&this._cursor!=null)return;this._pinned=true;this._showTooltip(Number(button.dataset.time));};});
 },
 _timelineHeader(options){
  const label=options.language==='nl'?'Grafiekopties':'Graph tools',open=this.shadowRoot.querySelector('.chart-tools')?.open;
  const header=cardHeader({...options,periods:{},zoomState:{...options.zoomState,zoomed:options.zoomState.zoomed&&!options.periods.picker}});
  return header.replace('<div class="header-actions">',`<details class="chart-tools"${open?' open':''}><summary aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg></summary><div class="header-actions chart-tools-panel">`).replace('</div></header>',`</div></details>${options.periods.picker?`<div class="header-actions primary-timeframe"><div class="chart-controls" role="group" aria-label="${options.language==='nl'?'Tijdvak':'Timeframe'}">${options.periods.picker}${options.periods.navigation??''}</div></div>`:''}</header>`);
 },
 _layoutTimeline(){
  // Measure complete captions, not clipped word fragments. Preserve accessible
  // segment names and tooltip content even when the visible caption cannot fit.
  for(const text of this.shadowRoot.querySelectorAll('.segment span')){
   text.hidden=false;
   const segment=text.parentElement,style=getComputedStyle(segment),range=document.createRange();range.selectNodeContents(text);
   const track=segment.parentElement,scale=track.getBoundingClientRect().width/track.clientWidth||1;
   text.hidden=range.getBoundingClientRect().width/scale+12>segment.clientWidth||parseFloat(style.lineHeight)>segment.clientHeight;
  }
  const axis=this.shadowRoot.querySelector('.axis');if(!axis?.getBoundingClientRect)return;
  const ticks=[...axis.children],width=axis.clientWidth,scale=axis.getBoundingClientRect().width/width||1;
  for(const [i,node]of ticks.entries()){const ratio=i/(ticks.length-1);node.hidden=false;node.style.left=ratio*100+'%';node.style.transform=ratio===0?'none':ratio===1?'translateX(-100%)':'translateX(-50%)';node.style.maxWidth=Math.max(40,(width-8)/2)+'px';node.style.textAlign=ratio===0?'left':ratio===1?'right':'center';}
  let previous=null;for(const node of ticks){const box=node.getBoundingClientRect(),last=ticks.at(-1).getBoundingClientRect();if(node!==ticks[0]&&node!==ticks.at(-1)&&((previous&&box.left<previous.right+8*scale)||box.right+8*scale>last.left)){node.hidden=true;continue;}previous=box;}
  axis.style.height=Math.max(0,...ticks.filter(n=>!n.hidden).map(n=>n.getBoundingClientRect().height/scale))+'px';
 },
 _bindTimelineTools(hadFocus){
  const tools=this.shadowRoot.querySelector('.chart-tools');if(!tools)return;
  tools.onkeydown=e=>{if(e.key==='Escape'&&!e.target.closest?.('[popover]')){e.preventDefault();tools.open=false;tools.querySelector('summary').focus();}};
  this._chartToolsOutside??=e=>{const current=this.shadowRoot.querySelector('.chart-tools');if(current?.open&&!e.composedPath().includes(current)&&!e.composedPath().some(n=>n?.matches?.('[popover]')))current.open=false;};globalThis.document?.addEventListener?.('pointerdown',this._chartToolsOutside);
  if(hadFocus)tools.querySelector('summary').focus({preventScroll:true});
 },
 _render(){
  if(!this._config)return;if(this._touchPointer!=null){this._touchRenderPending=true;return;}this._touchRenderPending=false;if(this._hoverFrame!=null){cancelAnimationFrame(this._hoverFrame);this._hoverFrame=null;}captureChartInsights(this);const c=this._config,nl=this._nl(),esc=escapeTimeline;this._viewStart=this._viewport?.[0]??this._start;this._viewEnd=this._viewport?.[1]??this._end;const a=this._viewStart,b=this._viewEnd;let body='';const toolsHadFocus=this.shadowRoot.activeElement?.matches?.('.chart-tools summary');const controls=this._timelineHeader({title:c.title??(nl?'Statustijdlijn':'Status timeline'),showTitle:c.show_title!==false,ready:this._status==='ready',historyUrl:this._historyUrl(),language:nl?'nl':'en',periods:periodControls(this,nl?'nl':'en'),zoomState:chartZoomState(this),information:chartDataInformation(this,nl?'nl':'en')});
  if(this._status!=='ready')body=`<div class="message" role="status">${this._status==='error'?(nl?'Geschiedenis kon niet worden geladen.':'Unable to load history.'):(nl?'Geschiedenis laden…':'Loading history…')}${this._status==='error'?uiButton({variant:'action',className:'retry',text:nl?'Opnieuw proberen':'Retry'}):''}</div>`;
  else{

   const legend=new Map(),rows=c.entities.map((id,i)=>{if(!this._isSeriesVisible(i))return '';const name=this._name(id),label=`<button type="button" class="row-label" data-series="${esc(id)}">${esc(name)}</button>`;if(this._stateLimits?.[i])return `<div class="row">${label}<div class="state-limit" role="status">${esc(this._stateLimitMessage())}</div></div>`;const bars=(this._series[i]??[]).filter(s=>s.end>a&&s.start<b).map(s=>{const v=this._segmentAppearance(s,id);legend.set(v.label+'|'+v.color,v);const start=Math.max(a,s.start),end=Math.min(b,s.end),description=`${name}: ${v.label}, ${this._time(s.start)} – ${this._time(s.end)} · ${this._duration(s.end-s.start)}`;return `<button class="segment ${['unknown','unavailable'].includes(s.state)?'gap':''}" style="left:${(start-a)/(b-a)*100}%;width:${(end-start)/(b-a)*100}%;background-color:${v.color};color:${v.textColor??'inherit'}" aria-label="${esc(description)}" data-time="${start}">${c.show_state_labels?`<span>${esc(v.label)}</span>`:''}</button>`;}).join('');return `<div class="row">${c.show_labels?`${label}`:''}<div class="track">${bars}</div>${c.show_summary?`<div class="summary">${esc(this._summary(i))}</div>`:''}</div>`;}).join('');
   body=`<div class="chart" tabindex="0" role="group" aria-label="${nl?'Statustijdlijn':'Status timeline'}">${c.show_grid!==false?this._ticks().map(r=>`<div class="grid-line" style="left:${r*100}%"></div>`).join(''):''}${rows}<div class="guide" hidden></div><div class="zoom-selection" hidden></div><div class="tooltip" role="status" hidden></div></div>`;
   if(c.show_axis){
    const dates=new Intl.DateTimeFormat('en-CA',{timeZone:this._hass?.config?.time_zone,year:'numeric',month:'2-digit',day:'2-digit'});
    const spansDates=dates.format(a)!==dates.format(b),ticks=this._ticks();
    body+=`<div class="axis">${ticks.map((r,i)=>`<span>${esc(this._time(a+(b-a)*r,spansDates&&(i===0||i===ticks.length-1)))}</span>`).join('')}</div>`;
   }
   body='<div class="timeline-well">'+body+'</div>';
   if(c.show_legend)body=`<div class="legend">${[...legend.values()].map(v=>`<span><i style="background:${v.color}"></i>${esc(v.label)}</span>`).join('')}</div>`+body;
  }
  this.shadowRoot.innerHTML=`<style>:host{display:block;container-type:inline-size;height:100%;min-width:0;min-height:0}ha-card{display:block;min-height:0;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font-family:inherit;height:100%}
.content{height:100%;min-height:0;overflow:auto;padding:var(--eleven-card-padding,16px);box-sizing:border-box;position:relative;scrollbar-width:thin}
${cardHeaderStyles()}${uiActionButtonStyles()}
${periodControlsStyles()}
${chartInsightStyles()}
.content>.card-header{display:flex;align-items:center;gap:12px 8px;margin:0 0 12px;position:relative}
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
.timeline-well{padding:10px;min-width:0}
.axis{position:relative;display:block}
.axis span{position:absolute;top:0;width:max-content;white-space:normal;overflow-wrap:anywhere}
@container(max-width:480px){.content{padding:var(--eleven-card-padding,16px)}}
.chart{position:relative;touch-action:pan-y;min-width:0}
.grid-line{position:absolute;top:0;bottom:0;border-left:1px solid var(--divider-color,#ddd);opacity:.45;pointer-events:none}
.row{position:relative}
.row-label{position:relative;background:transparent}
.summary{margin-top:6px;font-size:11px;color:var(--secondary-text-color,#666);background:transparent;position:relative;overflow-wrap:anywhere}
.row+.row{margin-top:${c.row_gap}px}
.row-label{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#666);margin-bottom:${c.label_gap}px;overflow-wrap:anywhere}
.row-label[data-series]{display:flex;align-items:flex-end;width:100%;min-height:24px;box-sizing:border-box;padding:0;border:0;text-align:start;font-family:inherit;cursor:pointer}
.row-label[data-series]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}
.track{position:relative;height:${c.bar_height}px;border-radius:${c.border_radius}px;overflow:hidden;background:var(--divider-color,#ddd)}
.segment{position:absolute;top:0;height:100%;padding:0;border:0;border-right:1px solid #ffffff24;box-sizing:border-box;cursor:pointer;color:white;min-width:0;overflow:hidden;font-family:inherit;font-size:11px;line-height:14px}
.segment span{display:inline-block;padding:0 6px;white-space:nowrap}
.segment span[hidden]{display:none}
.segment:focus-visible{outline:2px solid var(--primary-text-color,#222);outline-offset:-2px;z-index:1}
.gap{background-image:repeating-linear-gradient(135deg,transparent,transparent 4px,#ffffff40 4px,#ffffff40 8px)}
.axis{position:relative;display:block;margin-top:10px;font-size:11px;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums}
.legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 12px;padding-inline:10px;font-size:12px;color:var(--secondary-text-color,#666)}
.legend span{display:flex;align-items:center;gap:6px;overflow-wrap:anywhere}
.legend i,.tooltip i{width:9px;height:9px;border-radius:3px;flex-shrink:0}
.guide{position:absolute;top:0;bottom:0;border-left:1px solid var(--primary-text-color,#20252b);opacity:.6;pointer-events:none;z-index:2}
.zoom-selection{position:absolute;top:0;bottom:0;background:color-mix(in srgb,var(--primary-color,#2196f3) 18%,transparent);border-inline:1px solid var(--primary-color,#2196f3);pointer-events:none;z-index:3}
${SharedGraph.tooltipStyles()}
.tooltip .tooltip-label{color:var(--secondary-text-color,#666)}
.tooltip .tooltip-value{color:var(--primary-text-color,#20252b);font-style:normal}
.state-limit{font-size:12px;color:var(--error-color,#db4437);overflow-wrap:anywhere;position:relative}
.message{font-size:14px;color:var(--secondary-text-color,#666);min-height:60px}
.retry{display:block;margin-top:12px}[hidden]{display:none}${cardThemeStyles({chartUI:true,plots:'.timeline-well',wells:'.insight-sensor[data-ui-detail-surface]',controls:'.chart-controls>.period-controls>.period-trigger,.chart-controls>[data-period],.zoom-controls,.chart-links,.period-options [data-ui-button=surface],.period-custom [type=submit]',surfaces:'.tooltip,[data-ui-popup]'})}${uiBalancedTabsStyles()}</style><ha-card><div class="content">${controls}${body}</div></ha-card>`;
  bindPeriodControls(this);bindChartInsights(this);this._bindTimelineTools(toolsHadFocus);this._layoutTimeline();this._timelineResize?.disconnect();if(typeof ResizeObserver!=='undefined'){this._timelineResize=new ResizeObserver(()=>this._layoutTimeline());const well=this.shadowRoot.querySelector('.timeline-well');if(well)this._timelineResize.observe(well);}
  const retry=this.shadowRoot.querySelector('.retry');if(retry)retry.onclick=()=>this._refresh();this.shadowRoot.querySelectorAll('[data-zoom]').forEach(button=>button.onclick=()=>this._zoom({in:.5,out:2,reset:0}[button.dataset.zoom]));this._bindInteractions();const renderedChart=this.shadowRoot.querySelector('.chart'),restoreTooltip=()=>{if(this.shadowRoot.querySelector('.chart')===renderedChart){SharedGraph.restoreHover(this);if(this._cursor!=null)this._showTooltip(this._cursor,false);}};const ready=this.shadowRoot.querySelector('ha-card')?.updateComplete;if(ready?.then)ready.then(restoreTooltip);else restoreTooltip();
 }
};
import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiBalancedTabsStyles} from '../../../shared/ui-tabs.js';
