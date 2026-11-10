import {uiLegend,bindUILegend,focusUILegend} from '../../../shared/ui-legend.js';

const escapeTimelinePresentation=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TimelinePresentation={
 _timelineGroup(id){return this._config.series_options.find(row=>row.entity===id)?.group?.trim()??'';},
 _timelineGroups(){
  const groups=new Map();
  this._config.entities.forEach((id,index)=>{const name=this._timelineGroup(id);if(!groups.has(name))groups.set(name,{name,indices:[]});groups.get(name).indices.push(index);});
  return [...groups.values()];
 },
 _stateLegendKey(id,segment){const v=this._segmentAppearance(segment,id);return JSON.stringify([this._timelineGroup(id),segment.missing?'missing':'state',segment.missing?'':String(segment.state),v.label,v.color]);},
 _stateVisible(id,segment){return !this._hiddenStates?.has(this._stateLegendKey(id,segment));},
 _timelineStateEntries(indices){
  const entries=new Map();
  for(const i of indices){if(!this._isSeriesVisible(i)||this._stateLimits?.[i])continue;const id=this._config.entities[i];for(const segment of this._series[i]??[]){if(segment.end<=this._viewStart||segment.start>=this._viewEnd)continue;const key=this._stateLegendKey(id,segment);entries.set(key,{key,...this._segmentAppearance(segment,id)});}}
  return [...entries.values()];
 },
 _timelineLegend(indices){
  return uiLegend({items:this._timelineStateEntries(indices).map(v=>({id:v.key,visible:!this._hiddenStates?.has(v.key),title:`${this._nl()?(!this._hiddenStates?.has(v.key)?'Verberg':'Toon'):(!this._hiddenStates?.has(v.key)?'Hide':'Show')} ${v.label}`,content:`<i style="background:${v.color}"></i><span>${escapeTimelinePresentation(v.label)}</span>`}))});
 },
 _toggleTimelineState(key,isolate=false){
  const group=JSON.parse(key)[0],indices=this._timelineGroups().find(g=>g.name===group)?.indices??[];
  const entries=this._timelineStateEntries(indices);if(!entries.some(v=>v.key===key))return;
  this._hiddenStates??=new Set();
  if(isolate){const isolated=entries.every(v=>(!this._hiddenStates.has(v.key))===(v.key===key));for(const v of entries){if(isolated||v.key===key)this._hiddenStates.delete(v.key);else this._hiddenStates.add(v.key);}}
  else if(this._hiddenStates.has(key))this._hiddenStates.delete(key);else this._hiddenStates.add(key);
  this._hideTooltip();this._render();focusUILegend(this,key);
 },
 _bindTimelineLegend(){bindUILegend(this,{hint:this._nl()?'Dubbelklik of Shift+Enter om alleen deze status te tonen.':'Double-click or Shift+Enter to show only this state.',toggle:key=>this._toggleTimelineState(key),isolate:key=>this._toggleTimelineState(key,true)});},
 _timelineCurrentValue(id){
  const entity=this._hass?.states?.[id];
  if(entity?.state==null||entity.state==='')return '\u2014';
  const state=String(entity.state),appearance=this._appearance(state,id);
  const rule=this._config.state_colors.find(row=>String(row.state)===state&&row.entity===id)??this._config.state_colors.find(row=>String(row.state)===state&&!row.entity);
  if(rule?.label!=null||['unknown','unavailable'].includes(state))return appearance.label;
  return this._hass?.formatEntityState?.(entity)??appearance.label;
 },
 _timelineRow(i){
  if(!this._isSeriesVisible(i))return '';
  const c=this._config,id=c.entities[i],name=this._name(id),label=`<button type="button" class="row-label" data-series="${escapeTimelinePresentation(id)}"><span>${escapeTimelinePresentation(name)}</span><strong>${escapeTimelinePresentation(this._timelineCurrentValue(id))}</strong></button>`;
  if(this._stateLimits?.[i])return `<div class="row">${label}<div class="state-limit" role="status">${escapeTimelinePresentation(this._stateLimitMessage())}</div></div>`;
  const a=this._viewStart,b=this._viewEnd;
  const bars=(this._series[i]??[]).filter(s=>s.end>a&&s.start<b).map(s=>{
   const v=this._segmentAppearance(s,id),start=Math.max(a,s.start),end=Math.min(b,s.end),visible=this._stateVisible(id,s);
   const description=`${name}: ${v.label}, ${this._time(s.start)} – ${this._time(s.end)} · ${this._duration(s.end-s.start)}`;
   return `<button class="segment ${['unknown','unavailable'].includes(s.state)?'gap':''}${visible?'':' filtered'}" style="left:${(start-a)/(b-a)*100}%;width:${(end-start)/(b-a)*100}%;background-color:${v.color};color:${v.textColor??'inherit'}" aria-label="${escapeTimelinePresentation(description)}" data-entity="${escapeTimelinePresentation(id)}" data-time="${start}"${visible?'':' tabindex="-1" aria-hidden="true"'}>${c.show_state_labels?`<span>${escapeTimelinePresentation(v.label)}</span>`:''}</button>`;
  }).join('');
  return `<div class="row">${c.show_labels?label:''}<div class="track">${bars}</div>${c.show_summary?`<div class="summary">${escapeTimelinePresentation(this._summary(i))}</div>`:''}</div>`;
 },
 _exactTimelineTime(t,label){
  const options={day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:this._hass?.config?.time_zone};
  let text;try{text=new Intl.DateTimeFormat(this._nl()?'nl-NL':'en-GB',options).format(t);}catch{text=new Date(t).toISOString();}
  return `<time datetime="${new Date(t).toISOString()}" aria-label="${escapeTimelinePresentation(label+': '+text)}">${escapeTimelinePresentation(text)}</time>`;
 },
 _timelineTooltipRows(t){
  return this._timelineGroups().map(group=>{
   const rows=this._timelineTooltipGroupRows(group.indices,t);if(!rows)return '';
   return `<div class="tooltip-group">${group.name?`<h4 class="tooltip-group-title">${escapeTimelinePresentation(group.name)}</h4>`:''}${rows}</div>`;
  }).join('');
 },
 _timelineTooltipGroupRows(indices,t){
  const nl=this._nl();return indices.map(i=>{const id=this._config.entities[i];
   if(!this._isSeriesVisible(i)||this._stateLimits?.[i])return '';
   const s=this._segmentAt(this._series[i]??[],t,this._viewEnd),v=s?this._segmentAppearance(s,id):{label:nl?'Geen geschiedenis':'No history',color:'transparent'};
   if(s&&!this._stateVisible(id,s))return '';
   return `<span class="tooltip-entry"><i style="background:${v.color}"></i><b class="tooltip-label">${escapeTimelinePresentation(this._name(id))} <em class="tooltip-value">${escapeTimelinePresentation(v.label)}</em></b>${s?`<small class="tooltip-interval">${this._exactTimelineTime(s.start,'Start')} <em aria-hidden="true">–</em> ${this._exactTimelineTime(s.end,nl?'Einde':'End')}</small>`:''}</span>`;
  }).join('');
 }
};
