// Eleven Calendar (beta) — self-contained standalone module
(()=>{
// Paint only, scoped to each caller's shadow root and explicit semantic roles.
// Material recipes/palettes belong to the optional YAML theme, never this helper.
// Do not use generic control selectors: swatches, state tracks and chart colors
// must keep their functional paint. chartUI is an explicit non-House opt-in
// for shared chart-control geometry. No behavior or public-token writes.
function cardThemeStyles({wells='',controls='',selected='',plots='',surfaces='',chartUI=false,periodUI=chartUI}={}) {
 // Segmented groups own their paint; descendants pressing must not press the group.
 if(chartUI)controls=controls.split(',').filter(selector=>!['.zoom-controls','.chart-links'].includes(selector.trim())).join(',');
 if(periodUI)controls=[controls,'.period-default [data-ui-button=surface]'].filter(Boolean).join(',');
 const well=selector=>selector?`${selector}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px))}`:'';
 return `
ha-card{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none)}
${well(wells)}
${wells?`:is(${wells}):is([data-ui-detail-surface]){background:var(--secondary-background-color,#eee)}`:''}
${plots?`${plots}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,0px);background:var(--eleven-material-plot-background,transparent)}`:''}
${surfaces?`${surfaces}{box-shadow:var(--eleven-material-surface-shadow,none)}`:''}
${controls?`${controls}{background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
:is(${controls}):not(:disabled):hover{background:var(--eleven-material-control-hover-background,var(--secondary-background-color,transparent))}
:is(${controls}):not(:disabled):active{box-shadow:var(--eleven-material-well,none)}`:''}
${selected?`${selected}{box-shadow:var(--eleven-material-selection-well,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}`:''}
${periodUI?`
.period-menu [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.period-menu [data-period-option][aria-checked=true]{border:0;color:var(--accent-color,var(--primary-color));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);text-decoration:none;transform:translateY(1px)}
.period-menu [data-period-option][aria-checked=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.period-menu [data-period-option]{min-width:0}
.period-menu .period-options{grid-template-columns:repeat(5,minmax(0,1fr))}
.period-menu .period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-menu .ui-popup-heading [data-ui-button]{min-width:44px}
`:''}
${chartUI?`
/* Opt-in only: House's shared primitive defaults remain unchanged. */
.card-header{margin:0 0 12px;gap:12px;align-items:center}
.card-header h2{margin:0;flex:1 1 100%}
.header-actions{width:100%;gap:8px;justify-content:space-between}
.header-actions [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.chart-controls{flex:1 1 100%;width:100%}
.chart-controls>[data-period]{position:relative;flex:none}
.chart-controls>.period-controls{flex:1 1 auto;margin-inline-end:0;padding-inline-end:0}
.chart-controls>.period-controls::after{display:none}
.header-actions .period-trigger{width:100%;justify-content:space-between;padding:4px 6px;flex:1 1 auto}
.period-trigger span{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;line-height:1.35;text-align:start}
.legend [data-ui-legend]{min-height:44px;min-width:44px;box-sizing:border-box}
${segmentedControlStyles('.chart-controls','.chart-controls>.period-controls>.period-trigger,.chart-controls>[data-period]',{first:'.chart-controls>.period-controls>.period-trigger'})}
${segmentedControlStyles('.zoom-controls','.zoom-controls>[data-zoom]')}
${segmentedControlStyles('.chart-links','.chart-links>.history-link,.chart-links>.insight-control>.insight-trigger',{last:'.chart-links>.insight-control>.insight-trigger'})}
@container(min-width:600px){.card-header h2{flex:1 1 110px}.header-actions{width:auto;flex:0 1 auto;justify-content:flex-end}.chart-controls{flex:0 1 auto;width:auto}}
`:''}
@media(forced-colors:active){ha-card${[wells,controls,selected,plots,surfaces].filter(Boolean).map(s=>','+s).join('')}{box-shadow:none}}
`;
}

// A single raised group with separate native button press states; no parent :active.
function segmentedControlStyles(group,buttons,{first=`:is(${group})>:is(button,a):first-child`,last=`:is(${group})>:is(button,a):last-child`,dividers=`:is(${group})>:not(:first-child)`}={}){return `
${group}{gap:0;align-items:stretch;background:var(--eleven-material-control-background,var(--secondary-background-color,#eee));box-shadow:var(--eleven-material-control-shadow,var(--eleven-surface-shadow,none));border-radius:var(--eleven-material-radius-button,9px)}
:is(${buttons}){position:relative;align-self:stretch;height:auto;padding:2px 6px;background:transparent;box-shadow:none;border:0;border-radius:0;min-height:36px;min-width:36px;font-size:12px;box-sizing:border-box}
:is(${buttons}) svg{width:14px;height:14px}
${first?`:is(${buttons}):is(${first}){border-start-start-radius:var(--eleven-material-radius-button,9px);border-end-start-radius:var(--eleven-material-radius-button,9px)}`:''}
${last?`:is(${buttons}):is(${last}){border-start-end-radius:var(--eleven-material-radius-button,9px);border-end-end-radius:var(--eleven-material-radius-button,9px)}`:''}
:is(${dividers}){position:relative}
:is(${dividers})::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:1px;background:color-mix(in srgb,var(--divider-color,#ddd) 55%,transparent);pointer-events:none;z-index:1}
:is(${buttons}):disabled{opacity:1;color:color-mix(in srgb,var(--primary-text-color,#20252b) 35%,transparent);cursor:default}
:is(${buttons}):not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none}
:is(${buttons}):not(:disabled):active{background:color-mix(in srgb,var(--primary-text-color,#20252b) 7%,transparent);box-shadow:var(--eleven-material-well,inset 0 2px 3px rgb(0 0 0 / 15%))}
:is(${buttons}):focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
@media(forced-colors:active){${group}{box-shadow:none;outline:1px solid CanvasText}:is(${buttons}):not(:disabled):active{background:Highlight;color:HighlightText;box-shadow:none}}
`;}

function retryDelay(failures, base = 60000, maximum = 300000) {
  return Math.min(maximum, base * 2 ** Math.max(0, failures - 1));
}

// Calendar periods use the Home Assistant timezone, including DST boundaries.
const periodZoneFormats=new Map();
function periodLocalParts(t,zone){
 let format=periodZoneFormats.get(zone);
 if(!format){format=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});periodZoneFormats.set(zone,format);}
 return Object.fromEntries(format.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
function periodLocalEpoch(t,zone){const p=periodLocalParts(t,zone);return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}
function periodMidnight(nominal,zone){
 let t=nominal;for(let i=0;i<6;i++){const next=nominal-(periodLocalEpoch(t,zone)-t);if(next===t)return t;t=next;}
 // Midnight can be skipped by a timezone transition. Use the first valid
 // instant of that local date rather than oscillating across the transition.
 let low=nominal-36*3600000,high=nominal+36*3600000;
 while(high-low>1000){const mid=Math.floor((low+high)/2000)*1000,p=periodLocalParts(mid,zone);if(Date.UTC(p.year,p.month-1,p.day)>=nominal)high=mid;else low=mid;}
 return high;
}
function calendarDayStart(key,zone='UTC'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return NaN;
 const nominal=Date.parse(`${key}T00:00:00Z`);
 return Number.isFinite(nominal)&&new Date(nominal).toISOString().slice(0,10)===key?periodMidnight(nominal,zone||'UTC'):NaN;
}
function graphPeriodBounds(t,period,zone='UTC'){
 zone ||= 'UTC';const p=periodLocalParts(t,zone),size={minute:60000,quarter_hour:900000,hour:3600000}[period];
 if(size){const local=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second),a=t-(local%size)-(t%1000);return [a,a+size];}
 let nominal=Date.UTC(p.year,p.month-1,period==='month'?1:p.day);let next;
 if(period==='week'){const day=new Date(nominal).getUTCDay();nominal-=((day+6)%7)*86400000;next=nominal+7*86400000;}
 else if(period==='month')next=Date.UTC(p.year,p.month,1);
 else next=nominal+86400000;
 return [periodMidnight(nominal,zone),periodMidnight(next,zone)];
}
const periodCalendarModes=['today','week','month','quarter','year'];
const periodPresetHours={'1h':1,'6h':6,'12h':12,'24h':24,'48h':48,'7d':168,'14d':336,'30d':720,'90d':2160,'365d':8760};
function periodDateTime(t,zone='UTC'){
 const p=periodLocalParts(t,zone),pad=n=>String(n).padStart(2,'0');
 return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
function parsePeriodDateTime(value,zone='UTC',edge='start',previous){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return NaN;
 if(Number.isFinite(previous)&&periodDateTime(previous,zone)===value)return previous;
 const nominal=Date.parse(value+'Z');if(!Number.isFinite(nominal)||periodDateTime(nominal,'UTC')!==value)return NaN;
 // Collect the offsets on both sides of a transition. Reject skipped local
 // times; repeated times include both occurrences unless editing an existing bound.
 const candidates=new Set();
 for(let h=-48;h<=48;h+=6){const sample=nominal+h*3600000,offset=periodLocalEpoch(sample,zone)-sample,candidate=nominal-offset;if(periodDateTime(candidate,zone)===value)candidates.add(candidate);}
 const times=[...candidates].sort((a,b)=>a-b);return times.length?(edge==='end'?times.at(-1):times[0]):NaN;
}
function chooseCustomGraphPeriod(host,start,end){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*86400000)return false;
 resetGraphPeriod(host);host._periodMode='custom';host._periodHours=(end-start)/3600000;host._periodEnd=end;
 publishTimeframe(host);host._reloadPeriod();return true;
}
function timeframeSyncConfig(config,{draft=false}={}){
 if(!draft){
  if(config.sync_timeframe!==undefined&&typeof config.sync_timeframe!=='boolean')throw Error('sync_timeframe must be a boolean. / Tijdvak synchroniseren moet aan of uit zijn.');
  for(const key of ['hover_sync_group','timeframe_sync_group'])if(config[key]!=null&&typeof config[key]!=='string')throw Error(`${key} must be text. / De synchronisatiegroep moet tekst zijn.`);
 }
 return {sync_timeframe:config.sync_timeframe??false,hover_sync_group:config.hover_sync_group??config.timeframe_sync_group??''};
}
function timeframeGroup(host){return host._config?.sync_timeframe===true?((host._config.hover_sync_group??host._config.timeframe_sync_group)?.trim()||'default'):null;}
function timeframeGroups(){
 const root=globalThis.window??globalThis,key=Symbol.for('eleven-cards.timeframe-sync.v1');
 return root[key]??=new Map();
}
function applyTimeframe(host,selection){
 // Default is a group-wide reset to each card's own configured range (or
 // native price window), rather than a copy of the sender's hours.
 if(selection.mode==='configured'&&selection.offset===0){resetGraphPeriod(host);return;}
 host._sharedTimeframe=selection;
 Object.assign(host,{_periodMode:selection.mode,_periodHours:selection.hours,_periodEnd:selection.end,_periodOffset:selection.offset,_periodAnchor:selection.anchor});
}
function disconnectTimeframeSync(host){
 host._disconnectTimeframeSync?.();host._disconnectTimeframeSync=null;
}
function connectTimeframeSync(host){
 disconnectTimeframeSync(host);
 const group=timeframeGroup(host);if(group===null||!host._connected)return;
 const groups=timeframeGroups();let entry=groups.get(group);
 if(!entry){entry={selection:null,listeners:new Set()};groups.set(group,entry);}
 const receive=(selection,source)=>{
  if(source===host||host._sharedTimeframe===selection)return;
  applyTimeframe(host,selection);host._reloadPeriod();
 };
 entry.listeners.add(receive);
 host._disconnectTimeframeSync=()=>entry.listeners.delete(receive);
 // Joining never publishes this card's default over an existing selection.
 if(entry.selection)applyTimeframe(host,entry.selection);
}
function publishTimeframe(host){
 const group=timeframeGroup(host);if(group===null||!host._connected)return;
 const entry=timeframeGroups().get(group);if(!entry)return;
 const selection={group,mode:host._periodMode,hours:host._periodHours??host._config.hours_to_show,
  end:host._periodEnd,offset:host._periodOffset,anchor:host._periodAnchor,zone:host._hass?.config?.time_zone||'UTC',at:Date.now()};
 selection.range=localGraphPeriodRange(host,selection.at);
 entry.selection=selection;applyTimeframe(host,selection);
 for(const receive of entry.listeners)receive(selection,host);
}
function resetGraphPeriod(host){host._sharedTimeframe=null;host._periodMode='configured';host._periodHours=null;host._periodEnd=null;host._periodOffset=0;host._periodAnchor=null;host._periodMenuOpen=false;host._periodMenuPending=false;host._periodCustomDraft=null;host._periodTab=null;host._insightPending=null;}
function graphPeriodRange(host,now=Date.now()){
 const shared=host._sharedTimeframe;
 if(shared&&timeframeGroup(host)===shared.group){
  // One clock and timezone for the whole group, including separate bundles.
  // Live selections advance together on the minute; historical ranges stay fixed.
  if(shared.offset===0&&shared.end==null&&(Math.floor(now/60000)!==Math.floor(shared.at/60000))){
   shared.at=now;shared.range=localGraphPeriodRange({_periodMode:shared.mode,_periodHours:shared.hours,_periodOffset:0,_hass:{config:{time_zone:shared.zone}}},now);
  }
  return {...shared.range};
 }
 return localGraphPeriodRange(host,now);
}
function localGraphPeriodRange(host,now){
 const mode=host._periodMode,offset=host._periodOffset??0;
 if(periodCalendarModes.includes(mode)){
  const zone=host._hass?.config?.time_zone||'UTC',p=periodLocalParts(host._periodAnchor??now,zone);
  let nominal,finishNominal;
  if(mode==='week'){
   nominal=Date.UTC(p.year,p.month-1,p.day);nominal+=(offset*7-(new Date(nominal).getUTCDay()+6)%7)*86400000;finishNominal=nominal+7*86400000;
  }else if(mode==='month'||mode==='quarter'){
   const size=mode==='quarter'?3:1,month=(mode==='quarter'?Math.floor((p.month-1)/3)*3:p.month-1)+offset*size;
   nominal=Date.UTC(p.year,month,1);finishNominal=Date.UTC(p.year,month+size,1);
  }else if(mode==='year'){nominal=Date.UTC(p.year+offset,0,1);finishNominal=Date.UTC(p.year+offset+1,0,1);}
  else{nominal=Date.UTC(p.year,p.month-1,p.day+offset);finishNominal=nominal+86400000;}
  const start=periodMidnight(nominal,zone),finish=periodMidnight(finishNominal,zone);
  return {start,end:Math.max(start+1,Math.min(now,finish))};
 }
 const end=host._periodEnd??now;
 return {start:end-(host._periodHours??host._config.hours_to_show)*3600000,end};
}
function chooseGraphPeriod(host,value){
 const calendar=value==='configured'||periodCalendarModes.includes(value),hours=periodPresetHours[value]??Number(value);
 if(!calendar&&(!Number.isFinite(hours)||hours<1||hours>8760))return;
 resetGraphPeriod(host);
 host._periodMode=calendar?value:Object.entries(periodPresetHours).find(([,h])=>h===hours)?.[0]??String(value);
 if(!calendar)host._periodHours=hours;
 publishTimeframe(host);
 return host._reloadPeriod();
}
function moveGraphPeriod(host,direction){
 if(![-1,0,1].includes(direction))return;
 if(host._periodMode==='custom'){
  if(direction===0){host._periodEnd=null;host._periodOffset=0;}
  else{const end=(host._periodEnd??Date.now())+direction*host._periodHours*3600000;host._periodEnd=direction>0?Math.min(Date.now(),end):end;host._periodOffset=(host._periodOffset??0)+direction;}
  host._periodCustomDraft=null;host._periodTab=null;host._sharedTimeframe=null;publishTimeframe(host);return host._reloadPeriod();
 }
 if(direction===0){host._periodOffset=0;host._periodEnd=null;host._periodAnchor=null;}
 else{
  const previous=host._periodOffset??0;
  const calendar=periodCalendarModes.includes(host._periodMode);
  if(previous===0)host._periodAnchor=calendar?Date.now():host._status==='ready'?(host._end??Date.now()):Date.now();
  host._periodOffset=Math.min(0,previous+direction);
  if(host._periodOffset===0)host._periodAnchor=null;
  if(!calendar){
   host._periodEnd=host._periodOffset===0?null:host._periodAnchor+host._periodOffset*(host._periodHours??host._config.hours_to_show)*3600000;
  }
 }
 host._sharedTimeframe=null;
 publishTimeframe(host);
 return host._reloadPeriod();
}

// One recipe for raised information surfaces across all cards.
const UI_SURFACE_SHADOW='inset 0 1px 0 color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent),inset 0 -1px 0 rgb(0 0 0 / 4%),0 4px 10px rgb(0 0 0 / 12%)';
function uiSurfaceStyles(selector){return `
:host{--eleven-surface-shadow:${UI_SURFACE_SHADOW}}
${selector}{box-shadow:var(--eleven-surface-shadow)}
@media(forced-colors:active){${selector}{box-shadow:none;outline:1px solid CanvasText;outline-offset:-1px}}
`;}


const barBounds=(min,max)=>Number.isFinite(min)&&Number.isFinite(max)&&max>min?{min,max}:{min:0,max:100};
const barPercent=(value,min,max)=>Math.max(0,Math.min(100,(value-min)/(max-min)*100));

// All text/attributes are escaped; only finite measurements become fill widths.
function uiBar({value=null,min=0,max=100,target=null,charging=false,label='',valueText='',decorative=false,attrs={}}={}){
 ({min,max}=barBounds(min,max));
 const known=Number.isFinite(value),amount=known?Math.max(min,Math.min(max,value)):null;
 const percent=known?barPercent(amount,min,max):0,marker=Number.isFinite(target)?barPercent(target,min,max):null;
 const active=!!charging&&known&&amount<max&&(!Number.isFinite(target)||amount<target);
 return `<div${uiAttributes({...attrs,'data-ui-bar':'','data-charging':String(active),'data-unavailable':String(!known),...(decorative?{'aria-hidden':'true'}:{'aria-label':label,...(known?{role:'progressbar','aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':amount,...(valueText?{'aria-valuetext':valueText}:{})}:{})})})}><span class="ui-bar-fill" style="width:${percent}%">${active?'<span class="ui-bar-motion" aria-hidden="true"></span>':''}</span>${marker==null?'':`<span class="ui-bar-marker" style="left:${marker}%" aria-hidden="true"></span>`}</div>`;
}

function uiSlider({value=0,min=0,max=100,step=1,disabled=false,attrs={}}={}){
 ({min,max}=barBounds(min,max));
 const amount=Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;
 return `<input${uiAttributes({...attrs,type:'range','data-ui-slider':'',min,max,step:Number.isFinite(step)&&step>0?step:1,value:amount,...(disabled?{disabled:true}:{}),style:(attrs.style?attrs.style+';':'')+`--ui-bar-position:${barPercent(amount,min,max)}%`})}>`;
}

// Call alongside existing input handlers; never sends a command or replaces events.
function syncUISlider(input){
 const min=Number(input.min),max=Number(input.max),value=Number(input.value);
 input.style.setProperty('--ui-bar-position',Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min?barPercent(value,min,max)+'%':'0%');
}

function uiBarStyles(){return `
[data-ui-bar]{--_bar-tone:var(--ui-bar-tone,var(--accent-color,var(--primary-color,#2196f3)));position:relative;box-sizing:border-box;display:block;min-width:0;width:100%;height:var(--ui-bar-height,12px);border-radius:999px;background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%),inset -1px -1px 0 rgb(255 255 255 / 20%));isolation:isolate}
[data-ui-bar]>.ui-bar-fill{display:block;position:relative;overflow:hidden;isolation:isolate;height:100%;border-radius:inherit;background:var(--_bar-tone);box-shadow:inset 0 1px 0 #ffffff30}
[data-ui-bar]>.ui-bar-marker{position:absolute;top:-5px;width:2px;height:calc(100% + 10px);transform:translateX(-50%);max-width:100%;border-radius:2px;background:var(--primary-text-color,#20252b);pointer-events:none}
[data-ui-bar]>.ui-bar-marker[style*="left:0%"]{transform:none}
[data-ui-bar]>.ui-bar-marker[style*="left:100%"]{transform:translateX(-100%)}
[data-ui-bar] .ui-bar-motion{position:absolute;inset:0 auto 0 0;width:65%;pointer-events:none;background:linear-gradient(90deg,transparent,#ffffff4d 50%,transparent);animation:ui-bar-charge var(--ui-bar-duration,3.8s) linear infinite;animation-delay:var(--ui-bar-delay,0s)}
@keyframes ui-bar-charge{from{transform:translateX(-110%)}to{transform:translateX(260%)}}
input[data-ui-slider]{--_bar-tone:var(--ui-bar-tone,var(--accent-color,var(--primary-color,#2196f3)));box-sizing:border-box;appearance:none;-webkit-appearance:none;display:block;width:100%;height:44px;min-height:44px;min-width:0;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:var(--primary-text-color,#20252b);cursor:pointer;touch-action:pan-y}
input[data-ui-slider]::-webkit-slider-runnable-track{height:12px;border-radius:999px;background:linear-gradient(var(--_bar-tone),var(--_bar-tone)) 0 / var(--ui-bar-position,0%) 100% no-repeat,var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%))}
input[data-ui-slider]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;box-sizing:border-box;width:18px;height:18px;margin-top:-3px;border-radius:50%;border:2px solid var(--card-background-color,#fff);background:var(--_bar-tone);box-shadow:0 0 0 1px var(--_bar-tone)}
input[data-ui-slider]::-moz-range-track{height:12px;border-radius:999px;background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%))}
input[data-ui-slider]::-moz-range-progress{height:12px;border-radius:999px;background:var(--_bar-tone)}
input[data-ui-slider]::-moz-range-thumb{box-sizing:border-box;width:18px;height:18px;border-radius:50%;border:2px solid var(--card-background-color,#fff);background:var(--_bar-tone);box-shadow:0 0 0 1px var(--_bar-tone)}
input[data-ui-slider]:focus-visible{outline:2px solid var(--_bar-tone);outline-offset:3px}
input[data-ui-slider]:disabled{opacity:.45;cursor:default}
@media(prefers-reduced-motion:reduce){[data-ui-bar] .ui-bar-motion{display:none;animation:none}}
@media(forced-colors:active){[data-ui-bar]{background:Canvas;border:1px solid CanvasText;box-shadow:none}[data-ui-bar]>.ui-bar-fill{background:Highlight;box-shadow:none;forced-color-adjust:none}[data-ui-bar]>.ui-bar-marker{background:CanvasText}[data-ui-bar] .ui-bar-motion{display:none}input[data-ui-slider]{appearance:auto;accent-color:Highlight}}
`;}




// Informational detail surface. Callers format/translate text and compute percentages.
// All content is escaped; this component deliberately accepts no trusted HTML.
function uiDetailSurface({title='',metrics=[],percent=null,entity='',actionLabel='',attrs={}}={}){
 const progress=Number.isFinite(percent)?Math.max(0,Math.min(100,percent)):null;
 return `<section${uiAttributes({...attrs,'data-ui-detail-surface':'','aria-label':title})}>
  <h3 class="ui-detail-surface-title">${entity?`<button type="button" class="ui-detail-surface-action" data-entity="${uiEscape(entity)}" aria-label="${uiEscape(actionLabel||title)}">${uiEscape(title)} <span aria-hidden="true">›</span></button>`:uiEscape(title)}</h3>
  <dl class="ui-detail-surface-metrics">${metrics.map(({label='',value,unit='',hint=''})=>{
   const missing=value==null||value==='';
   return `<div><dt>${uiEscape(label)}</dt><dd>${uiEscape(missing?'—':value)}${!missing&&unit?' '+uiEscape(unit):''}${hint?`<small class="ui-detail-surface-hint">${uiEscape(hint)}</small>`:''}</dd></div>`;
  }).join('')}</dl>
  ${progress==null?'':uiBar({value:progress,decorative:true,attrs:{class:'ui-detail-surface-track',style:'--ui-bar-tone:var(--ui-detail-tone,var(--primary-color,#2196f3))'}})}
 </section>`;
}

function uiDetailSurfaceStyles(){return uiSurfaceStyles('[data-ui-detail-surface]')+uiBarStyles()+`
[data-ui-detail-surface]{box-sizing:border-box;min-width:0;padding:12px;border-radius:8px;color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--ui-detail-tone,var(--primary-color,#2196f3)) 5%,transparent)}
[data-ui-detail-surface] .ui-detail-surface-title{font-family:inherit;font-size:12px;font-weight:600;line-height:1.4;color:inherit;margin:0 0 8px;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-action{font:inherit;line-height:1.4;color:inherit;background:none;border:0;border-radius:4px;padding:4px 0;margin:-4px 0;text-align:start;cursor:pointer}
[data-ui-detail-surface] .ui-detail-surface-action:hover{text-decoration:underline}[data-ui-detail-surface] .ui-detail-surface-action:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
[data-ui-detail-surface] .ui-detail-surface-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,68px),1fr));gap:8px 12px;margin:0}
[data-ui-detail-surface] .ui-detail-surface-metrics>div{min-width:0}
[data-ui-detail-surface] dt{font-size:10px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere;margin:0 0 2px}
[data-ui-detail-surface] dd{margin:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-hint{display:block;margin-top:3px;font-size:10px;font-weight:400;line-height:1.4;letter-spacing:normal;color:var(--secondary-text-color,#626a78)}
[data-ui-detail-surface] .ui-detail-surface-track{margin-top:8px}
@container(max-width:360px){[data-ui-detail-surface] dd{font-size:15px}}
@media(forced-colors:active){[data-ui-detail-surface]{border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track{background:Canvas;border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track>i{background:Highlight;forced-color-adjust:none}}
`;}

// Native controls: text/attributes are escaped; content is trusted, caller-owned HTML.
function uiEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uiAttributes(values={}){
 return Object.entries(values).map(([key,value])=>{
  if(!/^[a-zA-Z_:][\w:.-]*$/.test(key)||/^on/i.test(key))throw Error('Invalid UI attribute: '+key);
  if(value==null)return '';
  if(['disabled','hidden','required','autofocus','multiple','readonly'].includes(key))return value?` ${key}`:'';
  return ` ${key}="${uiEscape(value)}"`;
 }).join('');
}
function uiButton({text='',content,label,title,variant='icon',className='',type='button',href,disabled=false,attrs={}}={}){
 const classes=className?` class="${uiEscape(className)}"`:'';
 const body=content??uiEscape(text),attributes=uiAttributes({...attrs,...(label==null?{}:{'aria-label':label}),...(title==null?{}:{title}),...(disabled?{disabled:true}:{})});
 return href==null?`<button type="${uiEscape(type)}"${classes} data-ui-button="${uiEscape(variant)}"${attributes}>${body}</button>`:`<a${classes} data-ui-button="${uiEscape(variant)}" href="${uiEscape(href)}"${attributes}>${body}</a>`;
}
function uiButtonStyles(){return `
[data-ui-button]{display:flex;align-items:center;justify-content:center;box-sizing:border-box;font:inherit;font-size:12px;font-weight:400;padding:0;border:0;border-radius:4px;background:transparent;color:var(--primary-text-color,#20252b);text-decoration:none;cursor:pointer;flex:none}
[data-ui-button="icon"]{width:32px;height:32px}
[data-ui-button]:not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}
[data-ui-button]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:-2px}
[data-ui-button="icon"]:focus-visible{background:var(--secondary-background-color,#eee)}
[data-ui-button]:disabled{opacity:.35;cursor:default}
[data-ui-button="surface"]{height:auto;width:100%;justify-content:space-between;gap:8px;min-height:34px;text-align:start;padding:6px 8px;border-radius:5px;background:var(--secondary-background-color,#eee)}
[data-ui-button="surface"][aria-checked="true"],[data-ui-button="surface"][aria-pressed="true"]{color:var(--primary-color,#2196f3);background:color-mix(in srgb,var(--primary-color,#2196f3) 14%,var(--ha-card-background,var(--card-background-color,#fff)));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--primary-color,#2196f3) 55%,transparent)}
[data-ui-button="text"]{min-height:30px;height:auto;width:auto;border-radius:5px}
[data-ui-button="close"]{width:30px;height:30px;min-height:30px;border-radius:5px;font-size:20px;color:inherit}
`;}


// Opt-in ordinary actions. Legacy uiButtonStyles() and its callers stay unchanged.
// The active HA theme supplies paint; variants distinguish commands from choices.
function uiActionButtonStyles(){return uiButtonStyles()+`
[data-ui-button^="action"]{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;flex:none;gap:8px;min-width:44px;min-height:44px;width:auto;max-width:100%;overflow-wrap:break-word;height:auto;padding:8px 12px;border:0;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));font:inherit;font-size:13px;font-weight:500;line-height:1.4;text-align:center;white-space:normal;color:var(--primary-text-color);background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);transform:none;text-decoration:none;cursor:pointer;transition:background 120ms ease-out,transform 120ms ease-out,box-shadow 120ms ease-out}
[data-ui-button="action-icon"]{width:44px;padding:8px}
[data-ui-button^="action"]:not(:disabled):hover{background:var(--eleven-material-control-hover-background,color-mix(in srgb,var(--primary-text-color) 5%,var(--secondary-background-color,transparent)))}
[data-ui-button^="action"]:not(:disabled):active{transform:translateY(1px);box-shadow:var(--eleven-material-well,none)}
[data-ui-button^="action"]:focus-visible{outline:2px solid var(--eleven-material-focus-color,color-mix(in srgb,var(--accent-color,var(--primary-color,#2196f3)) 60%,var(--primary-text-color,currentColor)));outline-offset:-2px}
[data-ui-button^="action"]:disabled{opacity:.45;cursor:default;transform:none}
[data-ui-button="action-choice"][aria-pressed="true"]{color:var(--eleven-material-selection-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 40%,var(--primary-text-color)));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);transform:translateY(1px)}
[data-ui-button="action-choice"][aria-pressed="true"]:not(:disabled):hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
[data-ui-button="action-choice"][aria-pressed="true"]:not(:disabled):active{transform:translateY(1px);box-shadow:var(--eleven-material-selection-well,none)}
[data-ui-button="action-danger"]{color:var(--eleven-material-danger-color,color-mix(in srgb,var(--error-color) 55%,var(--primary-text-color)));border:1px solid var(--error-color)}
@media(prefers-reduced-motion:reduce){[data-ui-button^="action"]{transition:none}}
@media(forced-colors:active){[data-ui-button^="action"]{color:ButtonText;background:ButtonFace;border:1px solid ButtonText;box-shadow:none}[data-ui-button^="action"]:focus-visible{outline-color:Highlight}[data-ui-button="action-choice"][aria-pressed="true"]{color:HighlightText;background:Highlight;box-shadow:none}}
`;}


const CARD_BACKGROUNDS=Object.freeze([
 {value:'aurora',label:'Aurora sky',description:'Langzaam golvende lichtgordijnen met kleine sterren.'},
 {value:'lanes',label:'Energy Lanes',description:'Diagonale banen met een rustige lichtstroom.'},
 {value:'halo',label:'Halo orbit',description:'Dunne ringen die langzaam om elkaar bewegen.'},
 {value:'ribbon',label:'Silk Flow',description:'Zachte linten die langs de kaart glijden.'},
 {value:'eclipse',label:'Eclipse',description:'Een zwevende cirkel met een verlichte rand.'},
 {value:'clouds',label:'Cloud layers',description:'Drie transparante wolkenlagen met verschillende snelheden.'},
 {value:'isobars',label:'Atmospheric flow',description:'Fijne contourlijnen met bewegende lichtaccenten.'},
 {value:'hologram',label:'Holographic grid',description:'Een perspectiefraster met een zachte scanlijn.'},
 {value:'ink',label:'Liquid ink',description:'Organische kleurvelden die rustig van vorm veranderen.'},
 {value:'terrain',label:'Relief map',description:'Gelaagde hoogtelijnen die langzaam verschuiven.'},
 {value:'aurora-curtains',family:'aurora',code:'1A',label:'Aurora curtains',description:'Smallere, verticale lichtgordijnen met een rustige zijwaartse golf.'},
 {value:'aurora-horizon',family:'aurora',code:'1B',label:'Aurora horizon',description:'Brede lichtbogen laag op de kaart, met meer open ruimte bovenin.'},
 {value:'ribbon-pleats',family:'ribbon',code:'4A',label:'Silk pleats',description:'Fijn gevouwen linten met meerdere zachte randen.'},
 {value:'ribbon-sweep',family:'ribbon',code:'4B',label:'Silk sweep',description:'Twee brede, diagonale linten die in tegengestelde richting bewegen.'},
 {value:'isobars-stream',family:'isobars',code:'7A',label:'Open jetstream',description:'Ruim uit elkaar liggende luchtstromen met lange bewegende accenten.'},
 {value:'isobars-vortex',family:'isobars',code:'7B',label:'Atmospheric vortex',description:'Gesloten druklijnen die rustig rond een centrum rechts draaien.'},
 {value:'ink-marble',family:'ink',code:'9A',label:'Ink marble',description:'Vloeibare kleuraders met een fijnere, gemarmerde structuur.'},
 {value:'ink-bloom',family:'ink',code:'9B',label:'Ink bloom',description:'Drie zachte inktbloemen die langzaam openen en samenvloeien.'},
 {value:'hologram-dots',family:'hologram',code:'8A',label:'Holographic dots',description:'Een ruimtelijk puntenraster met een brede lichtgolf.'},
 {value:'hologram-hex',family:'hologram',code:'8B',label:'Holographic honeycomb',description:'Een bewegend honingraatraster met een rustige diagonale scan.'},
 {value:'caustics',code:'11',label:'Caustic light',description:'Gebroken licht op water: een netwerk van vervormende lichtcellen.'},
 {value:'stardrift',code:'12',label:'Stardrift',description:'Losse lichtsporen die langzaam diagonaal door de kaart trekken.'},
 {value:'dunes',code:'13',label:'Quiet dunes',description:'Drie golvende duinsilhouetten die zacht langs elkaar schuiven.'},
 {value:'moire',code:'14',label:'Moire silk',description:'Twee fijne lijnweefsels die langzaam kruisen en nieuwe patronen vormen.'},
 {value:'constellation',code:'15',label:'Constellation',description:'Een open netwerk van lichtpunten met accenten langs de verbindingen.'}

].map(Object.freeze));
const backgroundHex=value=>typeof value==='string'&&/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)?value:null;
function normalizeCardBackground(input={}){
 const source=input&&typeof input==='object'?input:{};
 const number=source.transparency==null?65:Number(source.transparency);
 const height=source.height==null?240:Number(source.height);
 return {variant:CARD_BACKGROUNDS.some(item=>item.value===source.variant)?source.variant:'aurora',colorMode:['accent','custom','dynamic'].includes(source.colorMode)?source.colorMode:'accent',colors:Array.isArray(source.colors)?source.colors.map(backgroundHex).filter(Boolean).slice(0,3):[],transparency:Number.isFinite(number)?Math.min(100,Math.max(0,number)):65,animated:source.animated!==false,coverage:source.coverage==='header'?'header':'card',height:Number.isFinite(height)?Math.min(2000,Math.max(24,Math.round(height))):240};
}
// Purely decorative markup. The calling card decides which status colour to supply.
function uiCardBackground(input={}, {statusColor}={}){
 const config=normalizeCardBackground(input),accent='var(--accent-color,var(--primary-color,#03a9f4))';
 const colors=config.colorMode==='custom'&&config.colors.length?config.colors:config.colorMode==='dynamic'&&backgroundHex(statusColor)?[statusColor]:[accent];
 const palette=Array.from({length:3},(_,i)=>colors[i%colors.length]);
 const style=palette.map((color,i)=>`--ui-bg-${i+1}:${color}`).join(';')+`;--ui-bg-opacity:${(100-config.transparency)/100};--ui-bg-height:${config.height}px`;
 const family=CARD_BACKGROUNDS.find(item=>item.value===config.variant).family??config.variant;
 const curves=cardBackgroundGeometry(config.variant,family);
 const stars=(family==='aurora'&&config.variant!=='aurora-horizon'||config.variant==='stardrift')?Array.from({length:16},(_,i)=>`<b style="left:${i*37%100}%;top:${i*19%80}%;animation-delay:${-i*.7}s"></b>`).join(''):'';
 return `<div${uiAttributes({'data-ui-card-background':config.variant,'data-ui-background-family':family,'data-ui-background-coverage':config.coverage,'data-animated':String(config.animated),'aria-hidden':'true',style})}><i></i><i></i><i></i>${curves}${stars}</div>`;

}

function cardBackgroundGeometry(variant,family){
 let paths='';
 if(family==='isobars'){
  const count=variant==='isobars-stream'?6:9;
  paths=Array.from({length:count},(_,i)=>variant==='isobars-vortex'?`<path d="M${330-i*23} 150C${260-i*23} ${40-i*13} ${510+i*12} ${45-i*16} ${525+i*21} 150S${380-i*18} ${290+i*16} ${330-i*23} 150Z"/>`:`<path d="M-60 ${i*38}C95 ${i*25-80} 260 ${i*30+140} 390 ${i*27+30}S580 ${i*38-50} 660 ${i*35+20}"/>`).join('');
 }else if(variant==='hologram'){
  paths=Array.from({length:19},(_,i)=>{const x=-240+i*60;return `<path d="M${x} 0L${300+(x-300)*1.6} 320"/>`;}).join('');
  paths+='<g class="ui-bg-grid-rows">'+[0,18,42,74,116,170,238,320,400].map(y=>`<path d="M-400 ${y}H1000"/>`).join('')+'</g>';
 }else if(variant==='hologram-hex'){
  paths=Array.from({length:48},(_,i)=>{const x=i%8*88+(Math.floor(i/8)%2)*44,y=Math.floor(i/8)*54;return `<path d="M${x} ${y-32}l28 16v32l-28 16-28-16v-32Z"/>`;}).join('');
 }else if(variant==='caustics'){
  paths=Array.from({length:35},(_,i)=>{const x=i%7*100,y=Math.floor(i/7)*85;return `<path d="M${x} ${y}q45 -35 100 0q-35 35 0 85q-60 -30 -100 0q30 -45 0 -85Z"/>`;}).join('');
 }else if(variant==='constellation'){
  const points=[[20,60],[110,100],[180,35],[275,125],[360,55],[475,90],[570,25],[80,225],[210,270],[330,210],[440,280],[565,200]];
  paths='<path d="M20 60L110 100L180 35L275 125L360 55L475 90L570 25M110 100L80 225L210 270L275 125L330 210L440 280L565 200L475 90M330 210L360 55"/>';
  paths+=points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3+1.5}" style="animation-delay:${-i*.6}s"/>`).join('');
 }
 return paths?`<svg viewBox="0 0 600 320" preserveAspectRatio="none" focusable="false">${paths}</svg>`:'';
}

function uiCardBackgroundStyles(){return `
/* Explicit radius also works through ha-card slots, where inherit follows the slot.
   The parent keeps its theme surface; only the decorative layer clips and fades. */
[data-ui-background-host]{position:relative;isolation:isolate}
:where([data-ui-background-host]>:not([data-ui-card-background])){position:relative;z-index:1}
[data-ui-background-host]>[data-ui-card-background]{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:var(--ui-background-radius,var(--ha-card-border-radius,12px));clip-path:inset(0 round var(--ui-background-radius,var(--ha-card-border-radius,12px)));pointer-events:none;user-select:none;contain:paint;opacity:var(--ui-bg-opacity,.35);color:var(--ui-bg-1);--ui-bg-a:color-mix(in srgb,var(--ui-bg-1) 65%,transparent);--ui-bg-b:color-mix(in srgb,var(--ui-bg-2) 55%,transparent);--ui-bg-c:color-mix(in srgb,var(--ui-bg-3) 50%,transparent)}
[data-ui-background-coverage=header]{max-height:var(--ui-bg-height,240px);mask-image:linear-gradient(to bottom,#000 0%,#000 55%,transparent 100%)}
[data-ui-card-background]>i{position:absolute;display:block;pointer-events:none;animation:ui-bg-drift 18s ease-in-out infinite alternate}
[data-ui-card-background]>i:nth-child(2){animation-delay:-7s;animation-duration:23s}
[data-ui-card-background]>i:nth-child(3){animation-delay:-13s;animation-duration:29s}
[data-ui-background-family=aurora]>i{inset:-30%;border-radius:50%;background:conic-gradient(from 70deg at 50% 90%,transparent 0deg,var(--ui-bg-a) 17deg,transparent 65deg);filter:blur(16px);transform:rotate(-18deg)}
[data-ui-background-family=aurora]>i:nth-child(2){background:conic-gradient(from 230deg at 50% 10%,transparent,var(--ui-bg-b) 25deg,transparent 70deg)}
[data-ui-background-family=aurora]>i:nth-child(3){background:radial-gradient(ellipse at 80% 5%,var(--ui-bg-c),transparent 60%)}
[data-ui-background-family=aurora]>b{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--ui-bg-3);animation:ui-bg-star 5s ease-in-out infinite alternate}
[data-ui-card-background=lanes]>i{inset:-50%;background:linear-gradient(135deg,transparent 30%,var(--ui-bg-a) 30.2% 42%,transparent 42.2% 55%,var(--ui-bg-b) 55.2% 61%,transparent 61.2%);animation:ui-bg-lanes 16s ease-in-out infinite alternate}
[data-ui-card-background=lanes]>i:nth-child(2){background:repeating-linear-gradient(135deg,transparent 0 42px,var(--ui-bg-c) 43px,transparent 44px 90px);opacity:.35}
[data-ui-card-background=lanes]>i:nth-child(3){display:none}
[data-ui-card-background=halo]>i{width:80%;height:95%;right:-20%;top:-20%;border:1px solid var(--ui-bg-a);border-radius:50%;box-shadow:0 0 0 20px color-mix(in srgb,var(--ui-bg-2) 12%,transparent),0 0 0 45px color-mix(in srgb,var(--ui-bg-3) 8%,transparent);animation:ui-bg-orbit 22s ease-in-out infinite alternate}
[data-ui-card-background=halo]>i:nth-child(2){right:5%;top:25%;width:65%;height:65%;border-color:var(--ui-bg-b);box-shadow:none}
[data-ui-card-background=halo]>i:nth-child(3){display:none}
[data-ui-background-family=ribbon]>i{width:150%;height:85%;top:15%;left:-20%;border-radius:50%;border-top:1px solid var(--ui-bg-a);background:linear-gradient(var(--ui-bg-a),transparent 60%);transform:rotate(-20deg);animation:ui-bg-ribbon 19s ease-in-out infinite alternate}
[data-ui-background-family=ribbon]>i:nth-child(2){top:30%;background:linear-gradient(var(--ui-bg-b),transparent 60%)}
[data-ui-background-family=ribbon]>i:nth-child(3){top:45%;background:linear-gradient(var(--ui-bg-c),transparent 60%)}
[data-ui-card-background=eclipse]>i{width:80%;aspect-ratio:1;right:-10%;top:-20%;border-radius:50%;background:radial-gradient(circle,transparent 52%,var(--ui-bg-a) 54%,var(--ui-bg-b) 57%,transparent 66%);animation:ui-bg-orbit 26s ease-in-out infinite alternate}
[data-ui-card-background=eclipse]>i:nth-child(2){inset:0;width:auto;aspect-ratio:auto;background:radial-gradient(ellipse at 90% 0,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=eclipse]>i:nth-child(3){display:none}
[data-ui-card-background=clouds]>i{inset:-25%;background:radial-gradient(ellipse at 20% 25%,var(--ui-bg-a),transparent 45%),radial-gradient(ellipse at 80% 65%,var(--ui-bg-b),transparent 40%);filter:blur(12px);animation:ui-bg-clouds 24s ease-in-out infinite alternate}
[data-ui-card-background=clouds]>i:nth-child(2){transform:rotate(160deg);opacity:.7}
[data-ui-card-background=clouds]>i:nth-child(3){background:radial-gradient(ellipse at 60% 50%,var(--ui-bg-c),transparent 55%);opacity:.6}
[data-ui-background-family=isobars]>i{inset:0;background:radial-gradient(ellipse at 80% 10%,var(--ui-bg-b),transparent 65%);animation:none}
[data-ui-background-family=isobars]>i:not(:first-child){display:none}
[data-ui-background-family=isobars]>svg{position:absolute;inset:-10%;width:120%;height:120%;fill:none;stroke:var(--ui-bg-1);stroke-width:1;opacity:.5}
[data-ui-background-family=isobars] path:nth-child(2n){stroke:var(--ui-bg-2);stroke-dasharray:30 230;stroke-width:2;animation:ui-bg-front 14s linear infinite}
[data-ui-background-family=hologram]{perspective:380px}
[data-ui-background-family=hologram]>i:first-child{inset:-50%;background:repeating-linear-gradient(0deg,transparent 0 34px,var(--ui-bg-a) 35px,transparent 36px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-bg-b) 35px,transparent 36px);transform:rotateX(50deg);animation:ui-bg-grid 24s linear infinite}
[data-ui-background-family=hologram]>i:nth-child(2){inset:-50% 0;background:linear-gradient(transparent 35%,var(--ui-bg-c) 50%,transparent 65%);animation:ui-bg-scan 14s ease-in-out infinite alternate}
[data-ui-background-family=hologram]>i:nth-child(3){display:none}
[data-ui-background-family=ink]>i{width:110%;height:130%;left:-20%;top:-40%;border-radius:36% 64% 55% 45%;background:radial-gradient(ellipse,var(--ui-bg-a),transparent 65%);filter:blur(14px);animation:ui-bg-ink 24s ease-in-out infinite alternate}
[data-ui-background-family=ink]>i:nth-child(2){left:20%;top:0;background:radial-gradient(ellipse,var(--ui-bg-b),transparent 65%)}
[data-ui-background-family=ink]>i:nth-child(3){left:40%;top:-20%;background:radial-gradient(ellipse,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=terrain]>i{inset:-50%;border-radius:42%;background:repeating-radial-gradient(ellipse at 65% 35%,transparent 0 17px,var(--ui-bg-a) 18px,transparent 19px 35px);animation:ui-bg-terrain 30s ease-in-out infinite alternate}
[data-ui-card-background=terrain]>i:nth-child(2){inset:-30%;opacity:.3;background:repeating-radial-gradient(ellipse at 20% 70%,transparent 0 25px,var(--ui-bg-b) 26px,transparent 27px 50px)}
[data-ui-card-background=terrain]>i:nth-child(3){inset:0;background:radial-gradient(ellipse at 90% 0,var(--ui-bg-c),transparent 65%)}
/* The selected grid spans the full card, including its upper edge. */
[data-ui-card-background=hologram]{perspective:none}
[data-ui-card-background=hologram]>i:first-child{display:none}
[data-ui-card-background=hologram]>i:nth-child(2){opacity:.25}
[data-ui-card-background=hologram]>svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--ui-bg-1);stroke-width:.8;opacity:.5}
[data-ui-card-background=hologram] .ui-bg-grid-rows{stroke:var(--ui-bg-2);animation:ui-bg-grid-rows 24s ease-in-out infinite alternate}
@keyframes ui-bg-grid-rows{to{transform:translateY(-18px)}}
/* Alternatives reuse their family's structure and palette. */
[data-ui-card-background=aurora-curtains]>i{inset:-35% -20%;border-radius:35%;background:repeating-conic-gradient(from 18deg at 50% 110%,transparent 0deg 12deg,var(--ui-bg-a) 16deg,transparent 23deg 40deg);filter:blur(10px);animation:ui-bg-curtains 24s ease-in-out infinite alternate}
[data-ui-card-background=aurora-curtains]>i:nth-child(2){background:repeating-conic-gradient(from -12deg at 50% 100%,transparent 0deg 18deg,var(--ui-bg-b) 23deg,transparent 31deg 48deg);opacity:.65}
[data-ui-card-background=aurora-curtains]>i:nth-child(3){background:radial-gradient(ellipse at 90% 0,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=aurora-horizon]>i{inset:35% -25% -65%;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,transparent 36%,var(--ui-bg-a) 43%,transparent 55%);filter:blur(9px);animation:ui-bg-horizon 28s ease-in-out infinite alternate}
[data-ui-card-background=aurora-horizon]>i:nth-child(2){inset:20% -30% -80%;background:radial-gradient(ellipse,transparent 40%,var(--ui-bg-b) 46%,transparent 56%)}
[data-ui-card-background=aurora-horizon]>i:nth-child(3){inset:50% -20% -50%;background:radial-gradient(ellipse,transparent 35%,var(--ui-bg-c) 45%,transparent 55%)}
[data-ui-card-background=ribbon-pleats]>i{height:110%;top:5%;border-top:1px solid var(--ui-bg-a);background:repeating-linear-gradient(180deg,var(--ui-bg-a) 0,transparent 9px 23px,var(--ui-bg-b) 24px,transparent 25px 48px);opacity:.65;animation:ui-bg-pleats 28s ease-in-out infinite alternate}
[data-ui-card-background=ribbon-pleats]>i:nth-child(2){top:20%;background:repeating-linear-gradient(180deg,var(--ui-bg-b),transparent 12px 32px);opacity:.35}
[data-ui-card-background=ribbon-pleats]>i:nth-child(3){display:none}
[data-ui-card-background=ribbon-sweep]>i{width:175%;height:70%;left:-30%;top:-10%;border-radius:45%;transform:rotate(35deg);background:linear-gradient(180deg,var(--ui-bg-a),transparent 75%);animation:ui-bg-sweep 25s ease-in-out infinite alternate}
[data-ui-card-background=ribbon-sweep]>i:nth-child(2){top:60%;transform:rotate(-30deg);background:linear-gradient(180deg,var(--ui-bg-b),transparent 75%);animation-direction:alternate-reverse}
[data-ui-card-background=ribbon-sweep]>i:nth-child(3){display:none}
[data-ui-card-background=isobars-stream]>svg{width:140%;left:-20%;opacity:.45;animation:ui-bg-stream 30s ease-in-out infinite alternate}
[data-ui-card-background=isobars-stream] path{stroke-width:.8}
[data-ui-card-background=isobars-stream] path:nth-child(2n){stroke-width:2;stroke-dasharray:100 400;animation:ui-bg-jetstream 21s linear infinite}
[data-ui-card-background=isobars-vortex]>svg{inset:-15%;width:130%;height:130%;transform-origin:70% 50%;animation:ui-bg-vortex 38s ease-in-out infinite alternate}
[data-ui-card-background=isobars-vortex] path:nth-child(2n){stroke-dasharray:55 360;animation-duration:26s}
[data-ui-card-background=ink-marble]>i{inset:-50%;width:auto;height:auto;border-radius:40%;filter:blur(5px);background:repeating-conic-gradient(from 35deg at 65% 40%,transparent 0deg 20deg,var(--ui-bg-a) 24deg,transparent 30deg 44deg,var(--ui-bg-b) 47deg,transparent 53deg 85deg);animation:ui-bg-marble 35s ease-in-out infinite alternate}
[data-ui-card-background=ink-marble]>i:nth-child(2){inset:-20%;background:repeating-conic-gradient(from 150deg at 70% 50%,transparent 0deg 35deg,var(--ui-bg-c) 40deg,transparent 47deg 90deg);opacity:.5}
[data-ui-card-background=ink-marble]>i:nth-child(3){display:none}
[data-ui-card-background=ink-bloom]>i{width:85%;height:110%;left:30%;top:-30%;border-radius:60% 40% 65% 35%;filter:blur(7px);background:radial-gradient(ellipse at 60% 50%,var(--ui-bg-a),transparent 65%);animation:ui-bg-bloom 24s ease-in-out infinite alternate}
[data-ui-card-background=ink-bloom]>i:nth-child(2){left:0;top:25%;background:radial-gradient(ellipse,var(--ui-bg-b),transparent 65%);animation-direction:alternate-reverse}
[data-ui-card-background=ink-bloom]>i:nth-child(3){left:60%;top:10%;background:radial-gradient(ellipse,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=hologram-dots]>i:first-child{background:radial-gradient(circle,var(--ui-bg-a) 1.4px,transparent 2px) 0 0/24px 24px;transform:rotateX(45deg) rotateZ(-12deg);animation:ui-bg-dots 30s linear infinite}
[data-ui-card-background=hologram-dots]>i:nth-child(2){background:radial-gradient(ellipse at 60% 50%,var(--ui-bg-b),transparent 55%);animation-duration:20s}
[data-ui-card-background=hologram-hex]>i:first-child{display:none}
[data-ui-card-background=hologram-hex]>svg{position:absolute;inset:-10%;width:120%;height:120%;fill:none;stroke:var(--ui-bg-1);stroke-width:.8;opacity:.45;animation:ui-bg-hex 32s ease-in-out infinite alternate}
[data-ui-card-background=hologram-hex] path:nth-child(3n){stroke:var(--ui-bg-2)}
[data-ui-card-background=hologram-hex]>i:nth-child(2){inset:-50%;background:linear-gradient(120deg,transparent 40%,var(--ui-bg-c) 50%,transparent 60%);animation:ui-bg-hexscan 26s ease-in-out infinite alternate}
/* Five new patterns. */
[data-ui-card-background=caustics]>svg{position:absolute;inset:-15%;width:130%;height:130%;fill:none;stroke:var(--ui-bg-1);stroke-width:1.3;opacity:.4;animation:ui-bg-caustics 27s ease-in-out infinite alternate}
[data-ui-card-background=caustics] path:nth-child(3n){stroke:var(--ui-bg-2);stroke-width:2}
[data-ui-card-background=caustics]>i{inset:-20%;background:radial-gradient(ellipse at 80% 10%,var(--ui-bg-c),transparent 65%);animation:ui-bg-clouds 32s ease-in-out infinite alternate}
[data-ui-card-background=caustics]>i:not(:first-child){display:none}
[data-ui-card-background=stardrift]>b{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--ui-bg-1);animation:ui-bg-stardrift 22s linear infinite}
[data-ui-card-background=stardrift]>b::before{content:'';position:absolute;width:52px;height:1px;left:0;top:0;transform-origin:left;transform:rotate(35deg);background:linear-gradient(90deg,transparent,var(--ui-bg-2))}
[data-ui-card-background=stardrift]>b:nth-of-type(3n){animation-duration:31s;opacity:.5}
[data-ui-card-background=stardrift]>i{inset:0;background:radial-gradient(ellipse at 80% 0,var(--ui-bg-c),transparent 70%)}
[data-ui-card-background=stardrift]>i:not(:first-child){display:none}
[data-ui-card-background=dunes]>i{width:160%;height:95%;left:-25%;top:65%;border-radius:55% 65% 0 0;transform:rotate(-12deg);background:linear-gradient(var(--ui-bg-a),transparent 80%);animation:ui-bg-dunes 32s ease-in-out infinite alternate}
[data-ui-card-background=dunes]>i:nth-child(2){top:48%;left:10%;transform:rotate(14deg);background:linear-gradient(var(--ui-bg-b),transparent 75%);animation-direction:alternate-reverse}
[data-ui-card-background=dunes]>i:nth-child(3){top:80%;left:-50%;background:linear-gradient(var(--ui-bg-c),transparent 75%)}
[data-ui-card-background=moire]>i{inset:-80%;background:repeating-linear-gradient(90deg,transparent 0 7px,var(--ui-bg-a) 7.5px,transparent 8px 15px);transform:rotate(25deg);opacity:.45;animation:ui-bg-weave 40s ease-in-out infinite alternate}
[data-ui-card-background=moire]>i:nth-child(2){background:repeating-linear-gradient(90deg,transparent 0 9px,var(--ui-bg-b) 9.5px,transparent 10px 19px);transform:rotate(-18deg);animation-direction:alternate-reverse}
[data-ui-card-background=moire]>i:nth-child(3){inset:0;background:radial-gradient(ellipse at 90% 20%,var(--ui-bg-c),transparent 65%);opacity:.6;animation:ui-bg-drift 30s ease-in-out infinite alternate}
[data-ui-card-background=constellation]>svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--ui-bg-1);stroke-width:.8;opacity:.6}
[data-ui-card-background=constellation] path{stroke-dasharray:80 200;animation:ui-bg-network 24s linear infinite}
[data-ui-card-background=constellation] circle{fill:var(--ui-bg-2);stroke:none;animation:ui-bg-star 8s ease-in-out infinite alternate}
[data-ui-card-background=constellation]>i{inset:0;background:radial-gradient(ellipse at 80% 40%,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=constellation]>i:not(:first-child){display:none}
@keyframes ui-bg-curtains{to{transform:translate(8%,6%) skewX(12deg) scale(1.1)}}
@keyframes ui-bg-horizon{to{transform:translate(-5%,-15%) scale(1.15,.9)}}
@keyframes ui-bg-pleats{to{transform:translate(4%,8%) rotate(-6deg) scaleY(.9)}}
@keyframes ui-bg-sweep{to{transform:translate(10%,15%) rotate(15deg)}}
@keyframes ui-bg-stream{to{transform:translate(7%,-6%) rotate(4deg)}}
@keyframes ui-bg-jetstream{to{stroke-dashoffset:-500}}
@keyframes ui-bg-vortex{to{transform:rotate(20deg) scale(.95)}}
@keyframes ui-bg-marble{to{transform:rotate(25deg) scale(1.15,.9);border-radius:60% 40% 50% 50%}}
@keyframes ui-bg-bloom{to{transform:translate(-10%,12%) scale(1.2,.8);border-radius:35% 65% 40% 60%}}
@keyframes ui-bg-dots{from{transform:rotateX(45deg) rotateZ(-12deg) translateY(-24px)}to{transform:rotateX(45deg) rotateZ(-12deg) translateY(0)}}
@keyframes ui-bg-hex{to{transform:translate(-5%,8%) rotate(6deg)}}
@keyframes ui-bg-hexscan{to{transform:translate(20%,-5%)}}
@keyframes ui-bg-caustics{to{transform:translate(4%,5%) scale(1.12,.88) skewX(8deg)}}
@keyframes ui-bg-stardrift{from{transform:translate(50px,35px);opacity:0}20%{opacity:.8}80%{opacity:.6}to{transform:translate(-100px,-70px);opacity:0}}
@keyframes ui-bg-dunes{to{transform:translate(8%,-6%) rotate(-3deg)}}
@keyframes ui-bg-weave{to{transform:translate(3%,2%) rotate(8deg)}}
@keyframes ui-bg-network{to{stroke-dashoffset:-280}}

@keyframes ui-bg-drift{to{transform:translate(8%,12%) rotate(10deg) scale(1.12)}}
@keyframes ui-bg-star{from{opacity:.15}to{opacity:.85}}
@keyframes ui-bg-lanes{to{transform:translate(12%,-12%)}}
@keyframes ui-bg-orbit{to{transform:translate(-12%,18%) rotate(25deg)}}
@keyframes ui-bg-ribbon{to{transform:translate(5%,12%) rotate(5deg)}}
@keyframes ui-bg-clouds{to{transform:translate(15%,-10%) scale(1.2)}}
@keyframes ui-bg-front{to{stroke-dashoffset:-260}}
@keyframes ui-bg-grid{from{transform:rotateX(50deg) translateY(-36px)}to{transform:rotateX(50deg) translateY(0)}}
@keyframes ui-bg-scan{to{transform:translateY(25%)}}
@keyframes ui-bg-ink{to{transform:translate(15%,10%) rotate(40deg) scale(1.18);border-radius:64% 36% 35% 65%}}
@keyframes ui-bg-terrain{to{transform:translate(5%,8%) rotate(18deg) scale(1.08)}}
[data-ui-card-background][data-animated=false],[data-ui-card-background][data-animated=false] *{animation:none!important}
[data-ui-card-background][data-motion-paused],[data-ui-card-background][data-motion-paused] *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){[data-ui-card-background],[data-ui-card-background] *{animation:none!important}}
`;}
// Observe a stable card container, so re-rendering its decorative layer is safe.
function observeCardBackgroundMotion(container){
 const doc=container?.ownerDocument;if(!doc)return ()=>{};
 let visible=true;
 const update=()=>{for(const layer of (container.shadowRoot??container).querySelectorAll('[data-ui-card-background]'))layer.toggleAttribute('data-motion-paused',doc.hidden||!visible);};
 const Observer=doc.defaultView?.IntersectionObserver;
 const observer=Observer?new Observer(entries=>{visible=entries.some(entry=>entry.isIntersecting);update();}):null;
 observer?.observe(container);doc.addEventListener('visibilitychange',update);update();
 return ()=>{observer?.disconnect();doc.removeEventListener('visibilitychange',update);};
}



// Retain legacy YAML when the new object is absent. Unsupported legacy designs
// continue to use their original renderer until the user chooses a shared style.
function cardBackgroundSettings(config={}){
 const input=config.card_background;
 if(input===false)return {...normalizeCardBackground({variant:'isobars',coverage:'header'}),enabled:false,legacy:false};
 if(input&&typeof input==='object'&&!Array.isArray(input))return {...normalizeCardBackground({variant:'isobars',coverage:'header',...input}),enabled:input.enabled!==false,legacy:false};
 const legacy=typeof config.background==='string'&&!CARD_BACKGROUNDS.some(row=>row.value===config.background)&&config.background!=='none';
 const strength=Number(config.background_strength);
 return {...normalizeCardBackground({variant:config.background??'isobars',coverage:'header',transparency:config.background_strength!=null&&Number.isFinite(strength)?100-strength:65,animated:config.animate_background!==false}),enabled:config.background!=='none',legacy};
}

const cardBackgroundHostStyles=uiCardBackgroundStyles()+`
[data-ui-background-host] :is(.header-background,.scene-background){display:none!important}
`;

// Wrap registrations rather than replacing each card's renderer. The original
// class retains its DOM patching, subscriptions, action handlers and editor.
const withCardBackground=Base=>class extends Base{
 static get backgroundBaseCard(){return Base;}
 set hass(hass){this._captureElevenBackgroundPlayback();super.hass=hass;this._syncElevenBackground();}
 get hass(){return super.hass;}
 setConfig(config){
  this._captureElevenBackgroundPlayback();
  super.setConfig(config);
  this._elevenBackgroundConfig={...config};
  this._syncElevenBackground();
 }
 connectedCallback(){
  super.connectedCallback?.();
  this._elevenBackgroundObserver?.disconnect();
  const root=this.shadowRoot;
  if(root&&globalThis.MutationObserver){
   this._elevenBackgroundObserver=new MutationObserver(()=>this._syncElevenBackground());
   // Attribute changes include live status/theme changes in patched card DOM.
   this._elevenBackgroundObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-kind','data-tone','data-state','data-dark','data-theme','data-color']});
  }
  this._syncElevenBackground();
 }
 disconnectedCallback(){
  this._captureElevenBackgroundPlayback();
  this._elevenBackgroundObserver?.disconnect();this._elevenBackgroundObserver=null;
  this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;
  super.disconnectedCallback?.();
 }
 setCardBackground(background){
  this._elevenBackgroundConfig={...this._elevenBackgroundConfig,card_background:background};this._syncElevenBackground();
 }
 // Capture before native renderers replace their DOM, including timer updates.
 _render(...args){this._captureElevenBackgroundPlayback();const result=super._render?.(...args);this._syncElevenBackground();return result;}
 render(...args){this._captureElevenBackgroundPlayback();const result=super.render?.(...args);this._syncElevenBackground();return result;}
 _captureElevenBackgroundPlayback(){
  const layer=this._elevenBackgroundLayer;if(!layer?.isConnected)return;
  const animations=(layer.getAnimations?.({subtree:true})??[]).filter(animation=>Number.isFinite(animation.currentTime));
  if(!animations.length)return;
  this._elevenBackgroundPlayback={variant:layer.getAttribute('data-ui-card-background'),at:layer.ownerDocument.timeline?.currentTime??0,animations:animations.map(animation=>({name:animation.animationName,time:animation.currentTime,running:animation.playState==='running'}))};
 }
 _restoreElevenBackgroundPlayback(){
  const layer=this._elevenBackgroundLayer,saved=this._elevenBackgroundPlayback;
  if(!saved||!layer||saved.variant!==layer.getAttribute('data-ui-card-background'))return;
  const elapsed=Math.max(0,(layer.ownerDocument.timeline?.currentTime??saved.at)-saved.at),remaining=[...saved.animations];
  for(const animation of layer.getAnimations?.({subtree:true})??[]){
   const index=remaining.findIndex(item=>item.name===animation.animationName);if(index<0)continue;
   const item=remaining.splice(index,1)[0];animation.currentTime=item.time+(item.running?elapsed:0);
  }
 }
 _syncElevenBackground(){
  const root=this.shadowRoot,host=root?.querySelector('ha-card');if(!host||!this._elevenBackgroundConfig)return;
  const settings=cardBackgroundSettings(this._elevenBackgroundConfig);
  if(settings.legacy){
   host.removeAttribute('data-ui-background-host');
   this._elevenBackgroundLayer?.remove();this._elevenBackgroundLayer=null;
   this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;return;
  }
  host.setAttribute('data-ui-background-host','');
  if(!root.querySelector('style[data-ui-background-styles]')){
   const style=document.createElement('style');style.dataset.uiBackgroundStyles='';style.textContent=cardBackgroundHostStyles;root.append(style);
  }
  const hass=this._hass??this.hass,entity=this._elevenBackgroundConfig.entity??this._elevenBackgroundConfig.percentage_entity;
  const unavailable=['unknown','unavailable'].includes(hass?.states?.[entity]?.state);
  const background={...settings,animated:settings.animated&&hass?.connected!==false&&hass?.connection?.connected!==false&&!unavailable};
  // Cards already own their state-to-tone mapping. Read only their computed,
  // hex-valued tone, never configuration or sensor text as a CSS fragment.
  const content=host.querySelector('.content,[data-tone],.room')??host;
  const statusColor=this.cardBackgroundStatusColor?.()??globalThis.getComputedStyle?.(content).getPropertyValue('--tone').trim();
  const signature=JSON.stringify([background,statusColor]);
  if(this._elevenBackgroundLayer?.parentNode===host&&this._elevenBackgroundSignature===signature){
   if(this.isConnected&&!this._elevenBackgroundMotion)this._elevenBackgroundMotion=observeCardBackgroundMotion(this);return;
  }
  this._captureElevenBackgroundPlayback();
  this._elevenBackgroundSignature=signature;
  if(!settings.enabled){
   this._elevenBackgroundLayer?.remove();this._elevenBackgroundLayer=null;
   this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;return;
  }
  const template=document.createElement('template');template.innerHTML=uiCardBackground(background,{statusColor});
  const next=template.content.firstElementChild,previous=this._elevenBackgroundLayer;
  // Keep the decorative nodes when colours, coverage or native content change.
  const reuse=previous?.getAttribute('data-ui-card-background')===background.variant;
  if(reuse){
   for(const attribute of next.attributes)if(previous.getAttribute(attribute.name)!==attribute.value)previous.setAttribute(attribute.name,attribute.value);
  }else{
   previous?.remove();this._elevenBackgroundLayer=next;
   this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;
  }
  if(this._elevenBackgroundLayer.parentNode!==host)host.prepend(this._elevenBackgroundLayer);
  this._restoreElevenBackgroundPlayback();
  if(this.isConnected&&!this._elevenBackgroundMotion)this._elevenBackgroundMotion=observeCardBackgroundMotion(this);
 }
 static async getConfigElement(){
  if(!customElements.get('eleven-card-background-editor'))customElements.define('eleven-card-background-editor',ElevenCardBackgroundEditor);
  const editor=document.createElement('eleven-card-background-editor');
  if(super.getConfigElement)editor.nativeEditor=await super.getConfigElement();
  else if(super.getConfigForm){
   if(!customElements.get('ha-form')&&window.loadCardHelpers){
    const helpers=await window.loadCardHelpers(),entities=await helpers.createCardElement({type:'entities',entities:[]});
    await entities.constructor.getConfigElement();await customElements.whenDefined('ha-form');
   }
   editor.nativeForm=super.getConfigForm();
  }
  return editor;
 }
};

// Hide superseded fields in native forms while keeping all other schema data.
function cardBackgroundEditorSchema(schema){
 if(!Array.isArray(schema))return schema;
 let changed=false;const result=[];
 for(const field of schema){
  if(['background','background_strength','animate_background'].includes(field.name)){changed=true;continue;}
  const children=cardBackgroundEditorSchema(field.schema);
  if(children!==field.schema){result.push({...field,schema:children});changed=true;}else result.push(field);
 }
 return changed?result:schema;
}

class ElevenCardBackgroundEditor extends HTMLElement{
 constructor(){
  super();this.attachShadow({mode:'open'});
  this.shadowRoot.innerHTML=`<style>
:host{display:block;color:var(--primary-text-color);font:inherit}details{border:1px solid var(--divider-color,#ddd);border-radius:8px;margin:0 0 16px}summary{cursor:pointer;min-height:44px;box-sizing:border-box;padding:12px 16px;font-weight:500}.settings{display:grid;gap:12px;padding:0 16px 16px}label{display:flex;flex-direction:column;gap:6px;font-size:14px}label.check{flex-direction:row;align-items:center;min-height:44px}input,select{font:inherit;color:inherit;box-sizing:border-box;max-width:100%;min-height:44px;border:1px solid var(--divider-color,#ddd);border-radius:8px;background:var(--card-background-color,#fff);padding:8px}input[type=checkbox]{min-height:20px;width:20px;height:20px;accent-color:var(--accent-color,var(--primary-color))}input[type=range]{width:100%;accent-color:var(--accent-color,var(--primary-color));padding:0;border:0}input[type=color]{width:64px;padding:4px}.colors{display:flex;gap:8px;flex-wrap:wrap}.help{color:var(--secondary-text-color);font-size:12px;margin:0;line-height:1.5}input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}[hidden]{display:none!important}
</style><details><summary></summary><div class="settings"></div></details><div class="native"></div>`;
  this.shadowRoot.addEventListener('change',event=>this._changeBackground(event));
  this.shadowRoot.addEventListener('config-changed',event=>{
   if(event.target===this)return;
   event.stopPropagation();
   const background=this._config?.card_background;
   // Native editors emit a complete replacement, including deleted fields.
   // Retain only the setting owned by this wrapper, never old native keys.
   this._config={...event.detail.config};
   if(background!==undefined)this._config.card_background=background;
   this._syncNativeBackgroundFields();this._emitBackgroundConfig();
  });
 }
 connectedCallback(){this._observeNativeBackgroundFields();}
 disconnectedCallback(){this._nativeBackgroundObserver?.disconnect();this._nativeBackgroundObserver=null;}
 _observeNativeBackgroundFields(){
  this._nativeBackgroundObserver?.disconnect();
  if(this.isConnected&&this._nativeEditor?.shadowRoot&&globalThis.MutationObserver){
   this._nativeBackgroundObserver=new MutationObserver(()=>this._syncNativeBackgroundFields());
   this._nativeBackgroundObserver.observe(this._nativeEditor.shadowRoot,{childList:true,subtree:true});
  }
  this._syncNativeBackgroundFields();
 }
 _syncNativeBackgroundFields(){
  if(!this._config)return;
  const legacy=cardBackgroundSettings(this._config).legacy;this._nativeBackgroundSchemas??=new WeakMap();
  const forms=this._nativeEditor?.shadowRoot?.querySelectorAll('ha-form')??[];
  for(const form of [...forms,...(this._nativeEditor?.tagName==='HA-FORM'?[this._nativeEditor]:[])]){
   const saved=this._nativeBackgroundSchemas.get(form);
   if(legacy){if(saved&&form.schema===saved.filtered)form.schema=saved.original;continue;}
   if(saved&&form.schema===saved.filtered)continue;
   const filtered=cardBackgroundEditorSchema(form.schema);
   if(filtered!==form.schema){this._nativeBackgroundSchemas.set(form,{original:form.schema,filtered});form.schema=filtered;}
  }
 }
 set nativeEditor(editor){this._nativeEditor=editor;this.shadowRoot.querySelector('.native').replaceChildren(editor);if(this._hass)editor.hass=this._hass;if(this._config)editor.setConfig(this._config);this._observeNativeBackgroundFields();}
 set nativeForm(form){
  // Cards using Home Assistant's schema-only editor retain all native fields.
  const editor=document.createElement('ha-form');editor.schema=form.schema;editor.computeLabel=form.computeLabel;editor.computeHelper=form.computeHelper;
  editor.setConfig=config=>{editor.data=config;};
  editor.addEventListener('value-changed',event=>{event.stopPropagation();this._config={...this._config,...event.detail.value};this._emitBackgroundConfig();});
  this.nativeEditor=editor;
 }
 setConfig(config){this._config={...config};this._nativeEditor?.setConfig(config);this._renderBackgroundSettings();this._syncNativeBackgroundFields();}
 set hass(hass){const changed=this._language!==String(hass?.locale?.language??hass?.language??'en').slice(0,2);this._hass=hass;this._language=String(hass?.locale?.language??hass?.language??'en').slice(0,2);if(this._nativeEditor)this._nativeEditor.hass=hass;if(changed)this._renderBackgroundSettings();this._syncNativeBackgroundFields();}
 get hass(){return this._hass;}
 _emitBackgroundConfig(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));}
 _renderBackgroundSettings(){
  if(!this._config)return;
  const nl=this._language==='nl',s=cardBackgroundSettings(this._config),t=(d,e)=>nl?d:e;
  const choices=['aurora','ribbon','isobars','ink-bloom','hologram'].map(value=>CARD_BACKGROUNDS.find(row=>row.value===value));
  if(!s.legacy&&!choices.some(row=>row.value===s.variant))choices.push(CARD_BACKGROUNDS.find(row=>row.value===s.variant));
  this.shadowRoot.querySelector('summary').textContent=t('Kaartachtergrond','Card background');
  const pickerColor=index=>{const color=(s.colors.length?s.colors[index%s.colors.length]:['#4db6ac','#7287ed','#c77dbd'][index]);return color.length<=5?'#'+color.slice(1,4).split('').map(c=>c+c).join(''):color.slice(0,7);};
  const option=(value,label,selected)=>`<option value="${uiEscape(value)}"${selected?' selected':''}>${uiEscape(label)}</option>`;
  this.shadowRoot.querySelector('.settings').innerHTML=`
<label class="check"><input data-bg="enabled" type="checkbox"${s.enabled?' checked':''}>${t('Achtergrond tonen','Show background')}</label>
<label>${t('Weergave','Style')}<select data-bg="variant">${s.legacy?option('legacy',t('Bestaande achtergrond','Existing background'),true):''}${choices.map(row=>option(row.value,row.label,!s.legacy&&s.variant===row.value)).join('')}</select></label>
<label>${t('Kleurbron','Colour source')}<select data-bg="colorMode">${[['accent',t('Home Assistant-accent','Home Assistant accent')],['custom',t('Eigen kleuren','Custom colours')],['dynamic',t('Statuskleur van de kaart','Card status colour')]].map(([v,l])=>option(v,l,s.colorMode===v)).join('')}</select></label>
<div class="colors" data-colors${s.colorMode!=='custom'?' hidden':''}>${[0,1,2].map((i)=>`<label>${t('Kleur','Colour')} ${i+1}<input type="color" data-bg="color-${i}" value="${uiEscape(pickerColor(i))}"></label>`).join('')}</div>
<label>${t('Transparantie','Transparency')} <span><output>${s.transparency}%</output><input data-bg="transparency" type="range" min="0" max="100" value="${s.transparency}"></span></label>
<label>${t('Bereik','Coverage')}<select data-bg="coverage">${option('card',t('Hele kaart','Whole card'),s.coverage==='card')}${option('header',t('Bovenste strook','Top section'),s.coverage==='header')}</select></label>
<label data-height${s.coverage!=='header'?' hidden':''}>${t('Hoogte (px)','Height (px)')}<input data-bg="height" type="number" min="24" max="2000" step="1" value="${s.height}"></label>
<p class="help">${t('De bovenste strook vloeit onderaan zacht uit. Dynamische kleuren volgen de kaartstatus wanneer de kaart die aanbiedt.','The top section fades smoothly at the bottom. Dynamic colours follow the card status when available.')}</p>
<label class="check"><input data-bg="animated" type="checkbox"${s.animated?' checked':''}>${t('Achtergrond animeren','Animate background')}</label>`;
 }
 _changeBackground(event){
  const field=event.target.dataset.bg;if(!field)return;
  const current=cardBackgroundSettings(this._config),next={...current};delete next.legacy;
  if(field.startsWith('color-'))next.colors=[...this.shadowRoot.querySelectorAll('input[type=color]')].map(input=>input.value);
  else next[field]=event.target.type==='checkbox'?event.target.checked:['height','transparency'].includes(field)?Number(event.target.value):event.target.value;
  if(field==='colorMode'&&next.colorMode==='custom'&&!next.colors.length)next.colors=[...this.shadowRoot.querySelectorAll('input[type=color]')].map(input=>input.value);
  this._config={...this._config,card_background:{...normalizeCardBackground(next),enabled:next.enabled}};
  if(current.legacy){this.shadowRoot.querySelector('option[value=legacy]')?.remove();this.shadowRoot.querySelector('[data-bg=variant]').value=next.variant;}
  if(field==='height')event.target.value=this._config.card_background.height;
  // Update dependent controls without replacing the focused control.
  this.shadowRoot.querySelector('[data-colors]').hidden=next.colorMode!=='custom';
  this.shadowRoot.querySelector('[data-height]').hidden=next.coverage!=='header';
  this.shadowRoot.querySelector('output').textContent=this._config.card_background.transparency+'%';
  this._syncNativeBackgroundFields();this._emitBackgroundConfig();
 }
}


// The caller owns each item's trusted HTML (swatch, label and optional value).
function uiLegendButton({id,visible=true,content='',title='',className='legend-item',attrs={}}={}){
 return `<button type="button" class="${uiEscape(className)}"${uiAttributes({...attrs,'data-ui-legend':id,'aria-pressed':visible,title})}>${content}</button>`;
}
function uiLegend({items=[],className='legend',attrs={},afterContent=''}={}){
 return `<div class="${uiEscape(className)}"${uiAttributes(attrs)}>${items.map(uiLegendButton).join('')}${afterContent}</div>`;
}
function cancelUILegendClicks(host){
 for(const timer of host._legendClickTimers?.values()??[])clearTimeout(timer);
 host._legendClickTimers?.clear();
}
function focusUILegend(host,id,selector='[data-ui-legend]',getId=button=>button.dataset.uiLegend){
 queueMicrotask(()=>[...host.shadowRoot.querySelectorAll(selector)].find(button=>getId(button)===id)?.focus({preventScroll:true}));
}
function bindUILegend(host,{selector='[data-ui-legend]',getId=button=>button.dataset.uiLegend,hint='',toggle,isolate}={}){
 for(const button of host.shadowRoot.querySelectorAll?.(selector)??[]){
  const id=getId(button);
  if(hint&&!button.title?.includes(hint))button.title=[button.title,hint].filter(Boolean).join(' ');
  if(hint)button.setAttribute('aria-description',hint);
  button.setAttribute('aria-keyshortcuts','Shift+Enter Shift+Space');
  button.onclick=event=>{
   clearTimeout(host._legendClickTimers?.get(id));host._legendClickTimers?.delete(id);
   if(event.shiftKey||event.detail>1){event.preventDefault();isolate?.(id);return;}
   if(!event.detail){(toggle??isolate)?.(id);return;}
   // Wait for the second click before a rerender replaces the clicked button.
   if(toggle){const config=host._config;host._legendClickTimers??=new Map();host._legendClickTimers.set(id,setTimeout(()=>{host._legendClickTimers.delete(id);if(host._config===config)toggle(id);},300));}
  };
  button.ondblclick=event=>event.preventDefault();
  button.onkeydown=event=>{if(event.shiftKey&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();isolate?.(id);}};
 }
}



function uiPopup({id,title,label=title,closeLabel='Close',content='',className='',attrs={},closeAttrs={}}){
 return `<div${uiAttributes({id,class:className||null,'data-ui-popup':'',popover:'auto',role:'dialog','aria-label':label,...attrs})}><div class="ui-popup-heading"><strong>${uiEscape(title)}</strong>${uiButton({variant:'close',content:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>',label:closeLabel,attrs:{'data-ui-popup-close':'',...closeAttrs}})}</div>${content}</div>`;
}
function bindUIPopupPosition({trigger,popup,isRequested,onShow,ready,width=380,maxHeight=560,topBoundary=()=>8,align='end'}){
 let active=true;
 const position=()=>{
  if(!active||!isRequested())return;
  const box=trigger.getBoundingClientRect();
  if(!box.width||!box.height){popup.style.visibility='hidden';return;}
  const actualWidth=Math.min(width,window.innerWidth-16),minimumTop=Math.max(8,Math.min(topBoundary(),window.innerHeight-80));
  popup.style.width=actualWidth+'px';popup.style.maxHeight=Math.min(maxHeight,window.innerHeight-minimumTop-8)+'px';
  popup.style.visibility='';onShow?.();
  const height=popup.getBoundingClientRect().height,below=window.innerHeight-box.bottom-8,above=box.top-8;
  const left=align==='center'?(box.left+box.right-actualWidth)/2:box.right-actualWidth;
  popup.style.left=Math.max(8,Math.min(left,window.innerWidth-actualWidth-8))+'px';
  popup.style.top=Math.max(minimumTop,Math.min(below>=height||below>=above?box.bottom+6:box.top-height-6,window.innerHeight-height-8))+'px';
 };
 if(ready?.then)ready.then(position,()=>{});
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(position):null;
 observer?.observe(trigger);
 return {position,disconnect(){active=false;observer?.disconnect();}};
}
// Domain state lives in callbacks; this controller also works without a card host.
function bindUIPopup({trigger,popup,container=popup,ready,isRequested,isCurrent=()=>true,beforeOpen=()=>{},onOpen=()=>{},onClose=()=>{},onShown=()=>{},onToggle=()=>{},focusTarget,closeWhenAnchorHidden=false,keepOpenOnOutside=()=>false,topBoundary,align}){
 let requested=false,pending=false,focusPending=false,pointerWasOpen;
 const wantsOpen=isRequested??(()=>requested),native=typeof popup.showPopover==='function';
 const isOpen=()=>native?popup.matches(':popover-open'):popup.hasAttribute('data-fallback-open');
 trigger.setAttribute('aria-haspopup','dialog');if(popup.id)trigger.setAttribute('aria-controls',popup.id);trigger.setAttribute('aria-expanded',String(isOpen()));
 const cleanups=[],listen=(target,type,handler,capture=false)=>{target?.addEventListener?.(type,handler,capture);cleanups.push(()=>target?.removeEventListener?.(type,handler,capture));};
 const property=(target,key,handler)=>{if(!target)return;target[key]=handler;cleanups.push(()=>{if(target[key]===handler)target[key]=null;});};
 const closeButton=popup.querySelector('[data-ui-popup-close]');
 const placement=bindUIPopupPosition({trigger,popup,ready,topBoundary,align,isRequested:wantsOpen,onShow:()=>{
  pending=false;if(native){if(!isOpen())popup.showPopover();}else popup.setAttribute('data-fallback-open','');
  if(focusPending){(focusTarget?.()??closeButton)?.focus({preventScroll:true});focusPending=false;}
  onShown();
 }});
 const close=(focus=false)=>{
  requested=false;pending=false;focusPending=false;onClose();trigger.setAttribute('aria-expanded','false');
  if(native){if(isOpen())popup.hidePopover();}else popup.removeAttribute('data-fallback-open');
  if(focus)trigger.focus({preventScroll:true});
 };
 const open=(focus=true)=>{beforeOpen();requested=true;pending=true;focusPending=focus;onOpen(focus);trigger.setAttribute('aria-expanded','true');placement.position();};
 property(trigger,'onpointerdown',()=>{pointerWasOpen=wantsOpen();});
 property(trigger,'onpointercancel',()=>{pointerWasOpen=undefined;});
 property(trigger,'onclick',()=>{const wasOpen=pointerWasOpen??wantsOpen();pointerWasOpen=undefined;wasOpen?close(true):open();});
 property(closeButton,'onclick',()=>close(true));
 listen(popup,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}});
 listen(popup,'toggle',e=>{if(!isCurrent())return;const opened=e.newState==='open';if(!opened){if(wantsOpen())onClose();pending=false;focusPending=false;}requested=opened;trigger.setAttribute('aria-expanded',String(opened));onToggle(opened);});
 listen(window,'resize',()=>{if(wantsOpen()){if(closeWhenAnchorHidden&&trigger.getClientRects?.().length===0)close();else placement.position();}});
 listen(window,'scroll',e=>{if(isOpen()&&!e.composedPath().includes(popup))close();},true);
 listen(document,'pointerdown',e=>{if((!native||popup.getAttribute?.('popover')==='manual'||pending)&&(isOpen()||wantsOpen())&&!e.composedPath().includes(container)&&!keepOpenOnOutside(e))close();});
 return {open,close,isOpen,position:placement.position,disconnect(){placement.disconnect();cleanups.splice(0).forEach(remove=>remove());}};
}
function uiPopupStyles(){return uiSurfaceStyles('[data-ui-popup]')+`
[data-ui-popup]{display:none;position:fixed;inset:auto;margin:0;padding:12px;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;z-index:20;max-width:calc(100vw - 16px);border:0;border-radius:8px;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font:inherit;font-size:12px;line-height:1.35}
[data-ui-popup]:popover-open,[data-ui-popup][data-fallback-open]{display:block}
[data-ui-popup] [hidden]{display:none!important}
[data-ui-popup]>:last-child{margin-block-end:0}
.ui-popup-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:30px}
.ui-popup-heading>strong{font-size:14px;font-weight:600}
.ui-popup-heading [data-ui-popup-close]{display:grid;place-items:center;width:30px;height:30px;min-height:30px;padding:0;line-height:1;flex:none}
.ui-popup-heading [data-ui-popup-close] svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
`;}




// Shared markup stays in each card's shadow root: native links and existing
// data-zoom handlers work without cross-bundle custom-element registration.
const headerEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function bindCardPopupPosition(host,trigger,popup,isRequested,show){
 return bindUIPopupPosition({trigger,popup,isRequested,onShow:show,ready:host.shadowRoot.querySelector('ha-card')?.updateComplete});
}
// Native toggle events are asynchronous. Clear the other popup's restore
// state synchronously, also for browsers using the attribute fallback.
function closeOtherCardPopups(host,kind){
 const period=kind==='period',root=host.shadowRoot;
 if(period){host._insightOpen=null;host._insightPending=null;host._insightFocus=null;}
 else{host._periodMenuOpen=false;host._periodMenuPending=false;host._periodFocus=null;}
 for(const panel of root.querySelectorAll?.(period?'.insight-popup':'.period-menu')??[]){
  if(typeof panel.showPopover==='function'){if(panel.matches(':popover-open'))panel.hidePopover();}
  else panel.removeAttribute('data-fallback-open');
 }
 for(const trigger of root.querySelectorAll?.(period?'[data-insight]':'[data-period="menu"]')??[])trigger.setAttribute('aria-expanded','false');
}
function cardHeaderIcon(name){
 const paths={in:'M5 12h14M12 5v14',out:'M5 12h14',reset:'M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6',previous:'m15 6-6 6 6 6',next:'m9 6 6 6-6 6',info:'M12 17v-5M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',history:'M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',down:'m6 9 6 6 6-6'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name]}"/></svg>`;
}
function cardHeader({title,showTitle=true,ready=false,historyUrl,language='en',periods={},zoomState={in:true,out:true,reset:true,zoomed:false},information=''}){
 const nl=language.startsWith('nl'),label=nl?['Inzoomen','Uitzoomen','Zoom herstellen','Open in Home Assistant Geschiedenis']:['Zoom in','Zoom out','Reset zoom','Open in Home Assistant History'];
 const zoom=ready?`<div class="zoom-controls" role="group" aria-label="Zoom">${['out','in','reset'].map(action=>uiButton({content:cardHeaderIcon(action),disabled:!zoomState[action],title:label[['in','out','reset'].indexOf(action)],label:label[['in','out','reset'].indexOf(action)],attrs:{'data-zoom':action}})).join('')}</div>`:'';
 const group=periods.picker||periods.navigation?`<div class="chart-controls" role="group" aria-label="${nl?'Tijdvak':'Timeframe'}">${periods.picker??''}${periods.navigation??''}</div>`:'';
 const showZoomStatus=zoomState.zoomed&&!periods.picker;
 return `<header class="card-header">${showTitle&&title?`<h2>${headerEscape(title)}</h2>`:''}<div class="header-actions">${group}${zoom}<div class="chart-links" role="group" aria-label="${nl?'Geschiedenis en informatie':'History and information'}">${uiButton({href:historyUrl??'',className:'history-link',content:cardHeaderIcon('history'),title:label[3],label:label[3]})}${information}</div></div></header>${showZoomStatus?`<div class="chart-context"><div class="chart-range"><span class="zoom-status">${nl?'Ingezoomd':'Zoomed in'}</span></div></div>`:''}`;
}
function cardHeaderStyles(){return uiButtonStyles()+uiPopupStyles()+uiSurfaceStyles('.chart-controls,.zoom-controls,.chart-links')+`
.card-header{display:flex;align-items:flex-start;flex-wrap:wrap;gap:8px;min-height:32px;flex:none;margin:-6px -4px 10px 0}
.card-header h2{flex:1 1 110px;min-width:0;margin:4.75px 0 0;font-size:18px;line-height:1.25;font-weight:650;letter-spacing:-.01em;overflow-wrap:anywhere}
.header-actions{--chart-action-gap:8px;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:var(--chart-action-gap);flex:0 1 auto;min-width:0;max-width:100%;margin-inline-start:auto}
.chart-controls{display:flex;align-items:center;gap:0;min-width:0;max-width:100%}
.chart-links{display:flex;align-items:center;gap:0;flex:none}
.zoom-controls{display:flex;gap:0;position:relative}
.chart-controls,.zoom-controls,.chart-links{background:var(--secondary-background-color,#eee);border:0;border-radius:8px}
.chart-controls>[data-period="now"]{width:36px}
.chart-controls>.period-controls{position:relative;margin-inline-end:8px;padding-inline-end:8px}
.chart-controls>.period-controls::after{content:"";position:absolute;inset-inline-end:0;top:8px;height:16px;width:1px;background:var(--divider-color,#ddd)}
.header-actions svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
`;}


function uiTabs({id,label,items,selected,className='',panelClassName='',variant=''}={}){
 if(typeof id!=='string'||!id||!items?.length||items.some(item=>typeof item.value!=='string'||!item.value)||new Set(items.map(item=>item.value)).size!==items.length)throw Error('Tabs need an id and distinct text values.');
 const active=items.find(item=>item.value===selected&&!item.disabled)??items.find(item=>!item.disabled);
 const tabId=value=>`${id}-tab-${encodeURIComponent(value)}`,panelId=value=>`${id}-panel-${encodeURIComponent(value)}`;
 const bar=`<div${uiAttributes({class:className||null,'data-ui-tabs':'','data-ui-card-tabs':variant==='card'?true:null,role:'tablist','aria-label':label})}>${items.map(item=>uiButton({variant:'tab',text:item.label,disabled:item.disabled,attrs:{role:'tab',id:tabId(item.value),'data-ui-tab':item.value,'aria-controls':panelId(item.value),'aria-selected':item===active,tabindex:item===active?0:-1,...item.tabAttrs}})).join('')}</div>`;
 const panels=items.map(item=>`<section${uiAttributes({class:[panelClassName,item.className].filter(Boolean).join(' ')||null,id:panelId(item.value),role:'tabpanel','aria-labelledby':tabId(item.value),'data-ui-tab-panel':item.value,'data-ui-card-tab-panel':variant==='card'?true:null,...item.panelAttrs,hidden:item!==active})}>${item.content??''}</section>`).join('');
 return bar+panels;
}
function bindUITabs({tabs,panels,onSelect=()=>{}}){
 const buttons=[...tabs],sections=[...panels],cleanups=[];
 const select=(value,{focus=false,notify=true}={})=>{
  const target=buttons.find(tab=>tab.dataset.uiTab===value&&!tab.disabled);if(!target)return false;
  for(const tab of buttons){const active=tab===target;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  for(const panel of sections)panel.hidden=panel.dataset.uiTabPanel!==value;
  if(focus)target.focus({preventScroll:true});
  // Keep a selected tab visible within a scrolling strip without moving the page.
  const list=target.parentElement;
  if(list&&list.scrollWidth>list.clientWidth&&target.getBoundingClientRect){const box=target.getBoundingClientRect(),view=list.getBoundingClientRect();list.scrollLeft+=box.left<view.left?box.left-view.left:box.right>view.right?box.right-view.right:0;}
  if(notify)onSelect(value,target);return true;
 };
 for(const tab of buttons){
  const click=()=>select(tab.dataset.uiTab,{focus:true});
  const keydown=e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();e.stopPropagation();const enabled=buttons.filter(button=>!button.disabled),index=enabled.indexOf(tab);
   const next=e.key==='Home'?0:e.key==='End'?enabled.length-1:(index+(e.key==='ArrowRight'?1:-1)+enabled.length)%enabled.length;
   if(enabled[next])select(enabled[next].dataset.uiTab,{focus:true});
  };
  tab.onclick=click;tab.onkeydown=keydown;
  cleanups.push(()=>{if(tab.onclick===click)tab.onclick=null;if(tab.onkeydown===keydown)tab.onkeydown=null;});
 }
 return {select,disconnect(){cleanups.splice(0).forEach(remove=>remove());}};
}
function uiTabsStyles(){return `
[data-ui-tabs]{display:flex;align-items:flex-end;gap:8px;border-bottom:1px solid var(--divider-color,#ddd)}
[data-ui-tabs] [role="tab"]{flex:1;justify-content:center;min-width:0;min-height:36px;padding:8px 3px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--secondary-text-color,#666);white-space:nowrap}
[data-ui-tabs] [role="tab"]:hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,var(--ha-card-background,var(--card-background-color,#fff)));color:var(--primary-text-color,#20252b)}
[data-ui-tabs] [role="tab"][aria-selected="true"]{border-bottom-color:var(--primary-color,#2196f3);color:var(--primary-color,#2196f3);font-weight:600}
[data-ui-tab-panel][hidden]{display:none!important}
[data-ui-tabs][data-ui-card-tabs]{margin-top:16px;overflow-x:auto;scrollbar-width:thin}
[data-ui-tabs][data-ui-card-tabs] [role=tab]{flex:1 0 auto;min-width:64px;max-width:220px;display:block;overflow:hidden;text-overflow:ellipsis;text-align:center;font:inherit;line-height:inherit;border-radius:0}
[data-ui-tabs][data-ui-card-tabs] [role=tab][aria-selected=true]{font-weight:600}
[data-ui-card-tab-panel]{margin:0;padding:16px 0 0;border:0;min-width:0}
`;}

// Approved 2A-1 appearance. Retain the existing helper name for consumers.
function uiBalancedTabsStyles(){
 const strip=':host [data-ui-tabs][role=tablist]';
 const tab=strip+' [role=tab][data-ui-tab]';
 return `
${strip}{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:stretch;gap:0;width:100%;box-sizing:border-box;padding:0;border:0;border-bottom:1px solid var(--divider-color,#ddd);background:transparent;box-shadow:none;overflow:visible}
${strip}:has(>[role=tab]:nth-child(4)){display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
${strip}::-webkit-scrollbar{display:none}
${strip}:has(>[role=tab]:nth-child(4)) [role=tab][data-ui-tab]{flex:1 0 88px}
${tab}{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:44px;max-width:none;min-height:44px;height:auto;margin:0 0 -1px;padding:5px 6px 3px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;box-shadow:none;color:var(--secondary-text-color,#666);font-family:inherit;font-size:13px;font-weight:400;line-height:1.3;text-align:center;white-space:normal;overflow:visible;overflow-wrap:anywhere;text-overflow:clip;text-decoration:none;transform:none}
${tab}:not(:disabled):hover{color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none;transform:none}
${tab}[aria-selected=true],${tab}[aria-selected=true]:not(:disabled):hover{color:var(--primary-text-color,#20252b);font-weight:400;background:transparent;box-shadow:none;border-bottom:2px solid var(--accent-color,var(--primary-color));text-decoration:none;transform:none}
${tab}:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
${strip}~[data-ui-tab-panel]{border:0;padding-block-start:12px;background:transparent}
@media(forced-colors:active){${strip}{border-bottom-color:CanvasText}${tab}[aria-selected=true]{border-bottom-color:Highlight;outline:1px solid Highlight;outline-offset:-2px;box-shadow:none}${tab}:focus-visible{outline:2px solid CanvasText;outline-offset:-4px}}
`;
}






const periodEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function compactPeriodName({start,end,mode,past,zoomed,hours,name,locale,zone}){
 const format=options=>new Intl.DateTimeFormat(locale,{timeZone:zone,...options});
 const dates=format({year:'numeric',month:'numeric',day:'numeric'});
 const parts=t=>Object.fromEntries(dates.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
 const a=parts(start),b=parts(end),currentYear=parts(Date.now()).year;
 const dayMonth=format({day:'numeric',month:'short'}),dayYear=format({day:'numeric',month:'short',year:'numeric'});
 const sameDay=a.year===b.year&&a.month===b.month&&a.day===b.day;
 const dateRange=(from,to)=>{
  const first=parts(from),last=parts(to),year=first.year!==currentYear?` ${first.year}`:'';
  if(first.year!==last.year)return `${dayYear.format(from)}–${dayYear.format(to)}`;
  if(first.month===last.month)return `${first.day===last.day?'':`${first.day}–`}${dayMonth.format(to)}${year}`;
  return `${dayMonth.format(from)}–${dayMonth.format(to)}${year}`;
 };
 if(mode==='custom'||zoomed||(past&&!['today','week','month','quarter','year'].includes(mode)&&hours<24)){
  const time=format({hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  if(sameDay){
   const offsets=format({timeZoneName:'shortOffset'}),offset=t=>offsets.formatToParts(t).find(p=>p.type==='timeZoneName')?.value;
   const clock=offset(start)!==offset(end)?format({hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'}):time;
   return `${(a.year===currentYear?dayMonth:dayYear).format(start)} · ${clock.format(start)}–${clock.format(end)}`;
  }
  if(end-start<48*3600000)return `${(a.year===b.year&&a.year===currentYear?dayMonth:dayYear).format(start)} ${time.format(start)}–${(a.year===b.year&&a.year===currentYear?dayMonth:dayYear).format(end)} ${time.format(end)}`;
  return dateRange(start,end);
 }
 if(mode==='month'){const month=format({month:'long',year:'numeric'}).format(start);return month[0].toLocaleUpperCase(locale)+month.slice(1);}
 if(mode==='quarter')return `Q${Math.ceil(a.month/3)} ${a.year}`;
 if(mode==='year')return String(a.year);
 if(mode==='week')return dateRange(start,Math.max(start,end-1));
 if(mode==='today')return past?dateRange(start,Math.max(start,end-1)):name;
 if(past)return `${dateRange(start,end)} · ${hours>=168&&hours%24===0?`${hours/24} ${locale==='nl-NL'?'dagen':'days'}`:`${hours} ${locale==='nl-NL'?'uur':hours===1?'hour':'hours'}`}`;
 return name;
}
function periodControls(host,language='en',{popupNavigation=false,tabVariant=''}={}){
 const adapter=host._periodAdapter,active=host.shadowRoot.activeElement;
 if(!host._periodMenuPending)host._periodFocus=null;
 if(active?.closest?.('.header-actions'))host._periodFocus=active.dataset.periodTab!=null?`tab:${active.dataset.periodTab}`:active.dataset.customField!=null?`custom:${active.dataset.customField}`:active.dataset.periodOption!=null?`option:${active.dataset.periodOption}`:active.dataset.zoom!=null?`zoom:${active.dataset.zoom}`:active.classList.contains('history-link')?'history':active.dataset.period;
 if(host._config.show_navigation===false){host._periodMenuOpen=false;host._periodMenuPending=false;return {};}
 const previousMenu=host.shadowRoot.querySelector('.period-menu');
 if(previousMenu){
  if(!host._periodMenuPending)host._periodMenuScroll=previousMenu.scrollTop;
  host._periodMenuOpen=!!host._periodMenuPending||(typeof previousMenu.showPopover==='function'?previousMenu.matches(':popover-open'):previousMenu.hasAttribute('data-fallback-open'));
 }
 const nl=language.startsWith('nl'),label=(en,nlText)=>nl?nlText:en,mode=host._periodMode??'configured',past=(host._periodOffset??0)<0;
 const standard=adapter?.standard??label(`Default (${host._config.hours_to_show} hours)`,`Standaard (${host._config.hours_to_show} uur)`);
 const rolling=adapter?.rolling??[['1h',1],['6h',6],['12h',12],['24h',24],['48h',48],['7d',168],['14d',336],['30d',720],['90d',2160],['365d',8760]].map(([id,hours])=>[id,hours<168?label(`${hours} ${hours===1?'hour':'hours'}`,`${hours} uur`):label(`${hours/24} days`,`${hours/24} dagen`),hours<168?`${hours} ${nl?'u':'h'}`:`${hours/24} d`]);
 const calendar=adapter?.calendar??[['today',label('Today','Vandaag'),label('Day','Dag')],['week',label('This week','Deze week'),label('Week','Week')],['month',label('This month','Deze maand'),label('Month','Maand')],['quarter',label('This quarter','Dit kwartaal'),label('Quarter','Kwartaal')],['year',label('This year','Dit jaar'),label('Year','Jaar')]];
 const calendarChoice=calendar.find(([id])=>id===mode);
 if(!calendarChoice&&mode!=='configured'&&mode!=='custom'&&host._periodHours!=null&&!rolling.some(([id])=>id===mode))rolling.push([mode,label(`${host._periodHours} hours`,`${host._periodHours} uur`)]);
 const selectedStandard=adapter?.standard??label(`Default (${host._periodHours??host._config.hours_to_show} hours)`,`Standaard (${host._periodHours??host._config.hours_to_show} uur)`);
 const name=mode==='configured'?selectedStandard:calendarChoice?.[past?2:1]??rolling.find(([id])=>id===mode)?.[1]??standard;
 const tabIds=['rolling','calendar','custom'];
 const selectedTab=host._periodMenuOpen&&tabIds.includes(host._periodTab)?host._periodTab:mode==='custom'?'custom':calendarChoice?'calendar':'rolling';
 host._periodTab=selectedTab;
 const choice=([value,text,compact])=>uiButton({variant:'surface',content:`<span>${periodEscape(compact??text)}</span><span aria-hidden="true">${value===mode?'✓':''}</span>`,attrs:{role:'menuitemradio','aria-checked':value===mode,tabindex:-1,'aria-label':text,title:text,'data-period-option':value}});

 const {start,end}=adapter?.range()??(host._status==='ready'&&Number.isFinite(host._viewStart)&&Number.isFinite(host._viewEnd)?{start:host._viewStart,end:host._viewEnd}:graphPeriodRange(host));
 const locale=nl?'nl-NL':'en-GB',zone=host._hass?.config?.time_zone||'UTC';
 const zoomed=host._status==='ready'&&(start>host._start+1||end<host._end-1);
 const compactName=adapter?.name()??compactPeriodName({start,end,mode,past,zoomed,hours:host._periodHours??host._config.hours_to_show,name,locale,zone});
 const format=new Intl.DateTimeFormat(locale,{timeZone:zone,day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'});
 const range=`${format.format(start)} – ${format.format(end)}`;
 const customRange=adapter?.range()??graphPeriodRange(host),draft=host._periodCustomDraft??{start:periodDateTime(customRange.start,zone),end:periodDateTime(customRange.end,zone)};
 const canGoNext=adapter?true:mode==='custom'?host._periodEnd!=null&&customRange.end<Date.now():past;
 const custom=`<form data-custom-range><div class="period-custom-fields">${[['start',label('Start','Begin')],['end',label('End','Einde')]].map(([key,text])=>`<label>${text}<input type="datetime-local" name="${key}" data-custom-field="${key}" value="${periodEscape(draft[key])}" step="60" required></label>`).join('')}</div><p class="period-custom-zone">${periodEscape(zone)}</p><p class="period-custom-error" role="alert"${draft.error?'':' hidden'}>${periodEscape(draft.error??'')}</p>${uiButton({variant:'surface',type:'submit',text:label('Apply','Toepassen'),attrs:{'data-custom-field':'apply'}})}</form>`;
 const contents=uiTabs({id:'eleven-period',variant:tabVariant,label:label('Period type','Soort tijdvak'),selected:selectedTab,className:'period-tabs',panelClassName:'period-panel',items:[
  {value:'rolling',label:adapter?.rollingLabel??label('Last','Afgelopen'),content:`<div class="period-options" role="menu" aria-label="${label('Last','Afgelopen')}">${rolling.map(choice).join('')}</div>`},
  {value:'calendar',label:label('Calendar','Kalender'),content:`<div class="period-options period-calendar" role="menu" aria-label="${label('Calendar','Kalender')}">${calendar.map(([id,text])=>choice([id,text])).join('')}</div>`},
  {value:'custom',label:label('Custom range','Eigen bereik'),content:custom,className:'period-custom'}
 ].map(item=>({...item,tabAttrs:{'data-period-tab':item.value},panelAttrs:{'data-period-panel':item.value}}))});
 const navigation=[['previous',label('Previous period','Vorige periode')],['now',label('Return to the current period','Terug naar de huidige periode')],['next',label('Next period','Volgende periode')]].map(([key,title])=>uiButton({text:key==='now'?label('Now','Nu'):'',content:key==='now'?undefined:cardHeaderIcon(key),disabled:key==='next'&&!canGoNext,title,label:title,attrs:{'data-period':key}})).join('');
 const popup=uiPopup({id:'eleven-period-menu',className:'period-menu',title:label('Timeframe','Tijdvak'),label:label('Choose a period','Kies een periode'),closeLabel:label('Close','Sluiten'),closeAttrs:{'data-period':'close'},content:`<div class="period-current-range">${periodEscape(range)}${zoomed?`<span class="zoom-status">${label('Zoomed in','Ingezoomd')}</span>`:''}</div><div class="period-default" role="menu" aria-label="${label('Default','Standaard')}">${choice(['configured',standard])}</div>${contents}${popupNavigation?`<div class="period-menu-navigation" role="group" aria-label="${label('Period navigation','Periode navigeren')}">${navigation}</div>`:''}`});
 const trigger=uiButton({className:'period-trigger',content:`<span>${periodEscape(compactName)}</span>${cardHeaderIcon('down')}`,attrs:{'data-period':'menu','aria-haspopup':'dialog','aria-controls':'eleven-period-menu','aria-expanded':host._periodMenuOpen===true,title:range,'aria-label':label('Timeframe','Tijdvak')+': '+compactName,'aria-description':range+(zoomed?'. '+label('Zoomed in','Ingezoomd'):'')}});

 return {picker:`<div class="period-controls">${trigger}${popup}</div>`,navigation};

}
function restorePeriodFocus(host,items=[]){
 const key=host._periodFocus;if(!key)return;const root=host.shadowRoot;
 const target=key.startsWith('tab:')?root.querySelector(host._periodMenuOpen?'[data-period-tab="'+key.slice(4)+'"]':'[data-period="menu"]'):key.startsWith('custom:')&&host._periodMenuOpen?root.querySelector('[data-custom-field="'+key.slice(7)+'"]'):key==='history'?root.querySelector('.history-link'):key.startsWith('zoom:')?root.querySelector('[data-zoom="'+key.slice(5)+'"]'):key.startsWith('option:')&&host._periodMenuOpen?items.find(item=>item.dataset.periodOption===key.slice(7)):root.querySelector('[data-period="'+(key.startsWith('option:')?'menu':key)+'"]');
 (target?.disabled?root.querySelector('[data-period="now"], [data-zoom="in"]:not(:disabled), .history-link'):target)?.focus?.({preventScroll:true});host._periodFocus=null;
}
function disconnectPeriodControls(host,preserveState=false){host._periodMenuCleanup?.();host._periodMenuCleanup=null;if(!preserveState)host._periodMenuPending=false;}
function bindPeriodControls(host){
 disconnectPeriodControls(host,true);
 const adapter=host._periodAdapter,root=host.shadowRoot,nav=root.querySelector('.period-controls');if(!nav){restorePeriodFocus(host);return;}
 const menu=nav.querySelector('.period-menu'),trigger=nav.querySelector('[data-period="menu"]'),items=[...menu.querySelectorAll('[data-period-option]')];
 const nl=(host._hass?.language??'en').startsWith('nl'),label=(en,nlText)=>nl?nlText:en;
 const form=menu.querySelector('form[data-custom-range]'),tabs=[...menu.querySelectorAll('[data-period-tab]')],panels=[...menu.querySelectorAll('[data-period-panel]')];
 const visibleItems=()=>items.filter(item=>!item.closest?.('[data-period-panel]')?.hidden);
 const updateOptionFocus=()=>{
  const visible=visibleItems();for(const item of items)item.tabIndex=-1;
  const standard=visible.find(item=>item.dataset.periodOption==='configured');if(standard)standard.tabIndex=0;
  const options=visible.filter(item=>item!==standard),selected=options.find(item=>item.getAttribute('aria-checked')==='true')??options[0];if(selected)selected.tabIndex=0;
 };
 updateOptionFocus();
 const cleanups=[];
 const listen=(target,event,handler,capture=false)=>{target?.addEventListener?.(event,handler,capture);cleanups.push(()=>target?.removeEventListener?.(event,handler,capture));};
 host._periodMenuCleanup=()=>cleanups.splice(0).forEach(remove=>remove());
 let scrollPending=false;
 const controller=bindUIPopup({trigger,popup:menu,container:nav,ready:root.querySelector('ha-card')?.updateComplete,
  isRequested:()=>host._periodMenuOpen,isCurrent:()=>root.querySelector('.period-menu')===menu,
  beforeOpen:()=>closeOtherCardPopups(host,'period'),
  onOpen:focus=>{host._periodMenuOpen=true;host._periodMenuPending=true;scrollPending=!focus;},
  onClose:()=>{host._periodMenuOpen=false;host._periodMenuPending=false;},
  onToggle:open=>{host._periodMenuOpen=open;},
  focusTarget:()=>visibleItems().find(item=>item.getAttribute('aria-checked')==='true')??tabs.find(tab=>tab.getAttribute('aria-selected')==='true')??items[0],
  onShown:()=>{host._periodMenuPending=false;restorePeriodFocus(host,items);if(scrollPending){menu.scrollTop=host._periodMenuScroll??0;scrollPending=false;}}
 });
 const {open,close,position}=controller;cleanups.push(()=>controller.disconnect());
 trigger.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open();if(e.key==='ArrowUp')visibleItems().at(-1)?.focus({preventScroll:true});}};
 for(const item of items)item.onclick=()=>{close(true);if(adapter)adapter.choose(item.dataset.periodOption);else chooseGraphPeriod(host,item.dataset.periodOption);};
 const tabController=bindUITabs({tabs,panels,onSelect:value=>{
  host._periodTab=value;updateOptionFocus();host._periodMenuScroll=0;menu.scrollTop=0;position();
 }});cleanups.push(()=>tabController.disconnect());
 if(form?.tagName==='FORM'){
  const fields=Object.fromEntries(['start','end'].map(key=>[key,form.elements.namedItem(key)]));
  const readDraft=()=>host._periodCustomDraft={start:fields.start.value,end:fields.end.value};
  listen(form,'input',()=>{readDraft();const error=form.querySelector('.period-custom-error');error.hidden=true;error.textContent='';});
  listen(form,'submit',e=>{
   e.preventDefault();const draft=readDraft(),zone=host._hass?.config?.time_zone||'UTC',previous=graphPeriodRange(host);
   const start=parsePeriodDateTime(draft.start,zone,'start',previous.start),end=parsePeriodDateTime(draft.end,zone,'end',previous.end);
   let message;
   if(!Number.isFinite(start)||!Number.isFinite(end))message=label('Choose valid dates and times in the displayed timezone.','Kies geldige datums en tijden in de getoonde tijdzone.');
   else if(end<=start)message=label('End must be after start.','Einde moet na begin liggen.');
   else if(end-start>366*86400000)message=label('Choose a range of at most 366 days.','Kies een bereik van maximaal 366 dagen.');
   if(message){draft.error=message;const error=form.querySelector('.period-custom-error');error.textContent=message;error.hidden=false;position();return;}
   close(true);if(adapter)adapter.custom(start,end);else chooseCustomGraphPeriod(host,start,end);
  });
 }
 menu.onkeydown=e=>{
  if(e.target?.closest?.('.period-custom, .period-tabs'))return;
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   const visible=visibleItems();if(!visible.length)return;e.preventDefault();const index=visible.indexOf(host.shadowRoot.activeElement),next=e.key==='Home'?0:e.key==='End'?visible.length-1:index<0?(e.key==='ArrowUp'?visible.length-1:0):(index+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;
   visible[next].focus();
  }
 };
 for(const [key,direction]of [['previous',-1],['next',1],['now',0]])for(const button of root.querySelectorAll(`[data-period="${key}"]`))button.onclick=()=>{close();if(adapter)adapter.move(direction);else moveGraphPeriod(host,direction);};
 if(host._periodMenuOpen)open(false);
 if(!host._periodMenuPending)restorePeriodFocus(host,items);
}
function periodControlsStyles(){return uiTabsStyles()+`
.period-menu-navigation{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:12px;margin-top:12px;border-top:1px solid var(--divider-color,#ddd)}
.period-menu-navigation>[data-period]{width:36px;height:32px}.period-menu-navigation>[data-period=now]{width:auto;padding:4px 12px}
.period-controls{display:flex;min-width:0;max-width:100%;flex:0 1 auto}
.header-actions .period-trigger{width:auto;min-width:0;max-width:100%;flex:0 1 auto;gap:6px;padding:4px 6px;border:0;border-radius:4px;background:transparent;font-weight:400}
.header-actions .period-trigger:hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}
.period-trigger span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.period-current-range{font-size:11px;line-height:1.5;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums;overflow-wrap:anywhere;margin:2px 0 10px}
.period-current-range .zoom-status{display:table;margin-top:4px}
.period-tabs{margin:10px 0 0}
.period-menu:has([data-ui-card-tabs]){font-size:inherit;line-height:inherit}
.period-panel{padding-top:12px}
.period-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-bottom:0}
.period-options button{position:relative;justify-content:center;padding:7px 3px;gap:0;min-width:0;white-space:nowrap}
.period-options button>span:last-child{position:absolute;inset-inline-end:2px;top:1px;font-size:9px;line-height:1}
.period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-custom-fields{display:grid;gap:10px}
.period-custom-fields label{display:grid;gap:4px;font-size:12px}
.period-custom input{box-sizing:border-box;width:100%;min-width:0;padding:8px;border:1px solid var(--divider-color,#ddd);border-radius:5px;font:inherit;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));color-scheme:inherit}
.period-custom input:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:-1px}
.period-custom p{font-size:11px;line-height:1.5;color:var(--secondary-text-color,#666);margin:8px 0;overflow-wrap:anywhere}
.period-custom .period-custom-error{color:var(--error-color,#db4437)}
.period-custom button[type="submit"]{justify-content:center;margin-top:10px}
`;}


const CALENDAR_COLORS=['#82adf5','#e7af67','#8ac6a6','#b99cf0','#eb8d9f','#80c6d6','#d8bd68','#a5b7d3'];
const escapeCalendarHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function calendarRgb(value){
 if(Array.isArray(value))return [...value];
 if(typeof value!=='string'||!/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value))return null;
 const hex=value.length===4?value.slice(1).split('').map(ch=>ch+ch).join(''):value.slice(1);
 return [0,2,4].map(index=>parseInt(hex.slice(index,index+2),16));
}
function calendarColor(value,fallback=CALENDAR_COLORS[0]){
 if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=255))return `rgb(${value.join(',')})`;
 return typeof value==='string'&&/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)?value:fallback;
}
const validColor=value=>Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=255)||typeof value==='string'&&/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value);
function normalizeCalendarConfig(input={}, {draft=false}={}){
 const source=input.entities??input.calendars??[];
 if(!Array.isArray(source))throw Error('Calendars must be a list. / Agenda’s moeten een lijst zijn.');
 const entities=source.map((row,index)=>{
  const item=typeof row==='string'?{entity:row}:row&&typeof row==='object'&&!Array.isArray(row)?row:{};
  const color=item.color??calendarRgb(CALENDAR_COLORS[index%CALENDAR_COLORS.length]);
  if(!draft&&!validColor(color))throw Error('Choose an RGB color for each calendar. / Kies een RGB-kleur voor elke agenda.');
  return {...item,entity:item.entity??'',name:item.name??'',color:Array.isArray(color)?[...color]:color};
 });
 const days=input.days_to_show??5,view=input.view??'list',density=input.compact!=null?(input.compact?'compact':'expanded'):(input.density??'expanded'),weather=input.weather_entity??'';
 if(!draft){
  if(!entities.length||entities.length>12||entities.some(row=>!/^calendar\.[a-z0-9_]+$/.test(row.entity))||new Set(entities.map(row=>row.entity)).size!==entities.length)throw Error('Choose 1–12 different calendar entities. / Kies 1–12 verschillende agenda-entiteiten.');
  if(!Number.isInteger(days)||days<1||days>14)throw Error('Days must be 1–14. / Aantal dagen moet 1–14 zijn.');
  if(!['list','columns','month'].includes(view))throw Error('Choose list, columns or month. / Kies lijst, kolommen of maand.');
  if(!['expanded','compact'].includes(density))throw Error('Choose expanded or compact density. / Kies uitgebreide of compacte weergave.');
  if(weather&&!/^weather\.[a-z0-9_]+$/.test(weather))throw Error('Choose a weather entity. / Kies een weerentiteit.');
  for(const field of ['compact','show_title','show_legend','show_navigation','hide_empty_days'])if(input[field]!==undefined&&typeof input[field]!=='boolean')throw Error(`${field} must be true or false.`);
 }
 const {show_view_switcher: _legacyViewSwitcher,...settings}=input;
 delete settings.compact;
 return {...settings,type:'custom:eleven-calendar-card',title:input.title??'',entities,weather_entity:weather,days_to_show:draft&&Object.hasOwn(input,'days_to_show')&&input.days_to_show===undefined?undefined:days,view,density,
  show_title:input.show_title!==false,show_legend:input.show_legend!==false,show_navigation:input.show_navigation!==false,hide_empty_days:input.hide_empty_days===true};
}
const dayMs=86400000,zoneFormats=new Map();
function dateFormatter(zone){
 let formatter=zoneFormats.get(zone);
 if(!formatter){formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});zoneFormats.set(zone,formatter);}
 return formatter;
}
function localCalendarDayKey(value,zone='UTC'){
 const t=typeof value==='number'?value:Date.parse(value);
 if(!Number.isFinite(t))return null;
 const parts=Object.fromEntries(dateFormatter(zone).formatToParts(t).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
function nextCalendarDayKey(key,step=1){return new Date(Date.parse(`${key}T00:00:00Z`)+step*dayMs).toISOString().slice(0,10);}
const mondayIndex=nominal=>(new Date(nominal).getUTCDay()+6)%7;
function calendarDisplayRange(view,daysToShow,offset,todayKey,zone='UTC'){
 const today=Date.parse(`${todayKey}T00:00:00Z`);
 let first,last,monthKey=null;
 if(view==='month'){
  const current=new Date(today),monthStart=Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+offset,1),nextMonth=Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+offset+1,1);
  first=monthStart-mondayIndex(monthStart)*dayMs;
  last=nextMonth+(6-mondayIndex(nextMonth-dayMs))*dayMs;
  monthKey=new Date(monthStart).toISOString().slice(0,10);
 }else{
  first=today+offset*daysToShow*dayMs;last=first+daysToShow*dayMs;
 }
 const count=Math.round((last-first)/dayMs),keys=Array.from({length:count},(_,index)=>new Date(first+index*dayMs).toISOString().slice(0,10));
 const startKey=keys[0],endKey=new Date(last).toISOString().slice(0,10);
 return {startKey,endKey,monthKey,keys,start:calendarDayStart(startKey,zone),end:calendarDayStart(endKey,zone)};
}
function normalizeCalendarEvent(raw,calendar,zone='UTC'){
 if(!raw||typeof raw.start!=='string'||typeof raw.end!=='string')return null;
 const allDay=/^\d{4}-\d{2}-\d{2}$/.test(raw.start)&&/^\d{4}-\d{2}-\d{2}$/.test(raw.end);
 const start=allDay?calendarDayStart(raw.start,zone):Date.parse(raw.start),end=allDay?calendarDayStart(raw.end,zone):Date.parse(raw.end);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return null;
 return {calendar,summary:String(raw.summary??''),description:String(raw.description??''),location:String(raw.location??''),allDay,
  start,end,startKey:allDay?raw.start:localCalendarDayKey(start,zone),endKey:allDay?raw.end:localCalendarDayKey(end-1,zone)};
}
function calendarDaysWithEvents(range,eventsByEntity,entities,zone='UTC'){
 const events=entities.flatMap(row=>(eventsByEntity[row.entity]??[]).map(event=>normalizeCalendarEvent(event,row.entity,zone)).filter(Boolean));
 const days=range.keys.map(key=>({key,start:calendarDayStart(key,zone),end:calendarDayStart(nextCalendarDayKey(key),zone),events:[]}));
 for(const event of events){
  let low=0,high=days.length;
  while(low<high){const mid=(low+high)>>1;if(days[mid].end<=event.start)low=mid+1;else high=mid;}
  for(let index=low;index<days.length&&days[index].start<event.end;index++)days[index].events.push(event);
 }
 for(const day of days)day.events.sort((a,b)=>Number(b.allDay)-Number(a.allDay)||Math.max(a.start,day.start)-Math.max(b.start,day.start)||a.summary.localeCompare(b.summary));
 return days;
}
function forecastByCalendarDay(forecast,zone='UTC'){
 const days=new Map();
 for(const entry of Array.isArray(forecast)?forecast:[]){
  const key=localCalendarDayKey(entry?.datetime,zone);
  if(key&&!days.has(key))days.set(key,entry);
 }
 return days;
}
const calendarEventKey=event=>JSON.stringify([event.calendar,event.start,event.end,event.summary]);
function nextCalendarEvent(events,now=Date.now()){
 return events.reduce((next,event)=>event.start>now&&(!next||event.start<next.start)?event:next,null);
}



// Calendar windows move in local days, including future dates and DST changes.
function calendarSelectedRange(host){
 const mode=host._periodMode??'configured',zone=host._zone(),today=host._todayKey??localCalendarDayKey(Date.now(),zone),offset=host._offset??0;
 if(mode==='configured')return calendarDisplayRange(host._view,host._config.days_to_show,offset,today,zone);
 let start,end;
 if(mode==='custom'&&host._calendarCustom){({start,end}=host._calendarCustom);}
 else if(mode==='month'){
  const date=new Date(today+'T00:00:00Z'),key=step=>new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+offset+step,1)).toISOString().slice(0,10);
  start=calendarDayStart(key(0),zone);end=calendarDayStart(key(1),zone);
 }else if(mode==='week'){
  [start,end]=graphPeriodBounds(calendarDayStart(nextCalendarDayKey(today,offset*7),zone),'week',zone);
 }else{
  const count=mode==='today'?1:Number(mode.replace('d',''))||host._config.days_to_show;
  start=calendarDayStart(nextCalendarDayKey(today,offset*count),zone);end=calendarDayStart(nextCalendarDayKey(today,(offset+1)*count),zone);
 }
 let startKey=localCalendarDayKey(start,zone),endKey=nextCalendarDayKey(localCalendarDayKey(end-1,zone)),monthKey=startKey.slice(0,7)+'-01';
 if(host._view==='month'){
  const weekday=key=>(new Date(key+'T12:00:00Z').getUTCDay()+6)%7;
  startKey=nextCalendarDayKey(startKey,-weekday(startKey));endKey=nextCalendarDayKey(endKey,(7-weekday(endKey))%7);
  start=calendarDayStart(startKey,zone);end=calendarDayStart(endKey,zone);
 }
 const keys=[];for(let key=startKey;key<endKey;key=nextCalendarDayKey(key))keys.push(key);
 return {start,end,startKey,endKey,monthKey,keys};
}

function calendarPeriodAdapter(host){
 const nl=String(host._hass?.locale?.language??host._hass?.language??'en').startsWith('nl'),t=(a,b)=>nl?a:b;
 const reload=()=>{host._periodCustomDraft=null;host._startCalendars();host._render();};
 return {
  standard:t('Standaard','Default'),rollingLabel:t('Dagen','Days'),
  rolling:[1,3,5,7,14,30].map(days=>[days+'d',`${days} ${t(days===1?'dag':'dagen',days===1?'day':'days')}`,`${days} d`]),
  calendar:[['today',t('Vandaag','Today'),t('Dag','Day')],['week',t('Deze week','This week'),t('Week','Week')],['month',t('Deze maand','This month'),t('Maand','Month')]],
  range:()=>host._range(),name:()=>host._rangeLabel(host._range()),
  choose:mode=>{if(!['configured','today','week','month','1d','3d','5d','7d','14d','30d'].includes(mode))return;host._periodMode=mode;host._offset=0;host._calendarCustom=null;reload();},
  custom:(start,end)=>{if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*86400000)return;host._periodMode='custom';host._calendarCustom={start,end};host._offset=0;reload();},
  move:direction=>{
   if(![-1,0,1].includes(direction))return;
   if(host._periodMode==='custom'&&host._calendarCustom){
    if(direction===0){host._periodMode='configured';host._calendarCustom=null;host._offset=0;}
    else{const span=host._calendarCustom.end-host._calendarCustom.start;host._calendarCustom={start:host._calendarCustom.start+direction*span,end:host._calendarCustom.end+direction*span};}
   }else host._offset=direction===0?0:(host._offset??0)+direction;
   reload();
  }
 };
}




function calendarCardStyles(){return uiDetailSurfaceStyles()+uiSurfaceStyles('.navigation,.info-button')+`
:host{display:block;height:100%;min-width:0;min-height:0;container-type:inline-size}
ha-card{display:block;height:100%;min-width:0;min-height:0;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));font:inherit}
.content{display:flex;flex-direction:column;height:100%;padding:var(--eleven-card-padding,16px);min-width:0;min-height:0;box-sizing:border-box}
.content>.header,.content>.legend,.content>.status{flex-shrink:0}
.calendar-body{flex:1;min-height:0;overflow:auto;scrollbar-width:thin}
.legend-error{display:inline-grid;place-items:center;width:13px;height:13px;border:1px solid currentColor;border-radius:50%;color:var(--error-color,#db4437);font-size:10px;line-height:1;flex:none}
.event-button[data-next-event] .event-title{font-weight:650}
.header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 12px;margin-bottom:12px}
.header h2{font-size:18px;line-height:1.25;font-weight:650;margin:0;min-width:72px;flex:1}
.header-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0;margin-inline-start:auto}
.navigation{display:flex;align-items:center;min-width:0;border-radius:8px;background:var(--secondary-background-color,#f3f3f3)}
.navigation .range{padding:0 9px;white-space:nowrap;font-size:11px;font-variant-numeric:tabular-nums;border-inline-end:1px solid var(--divider-color,#ddd)}
.navigation [data-nav=now]{width:auto;padding:0 9px}
.header-actions svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.info-button{background:var(--secondary-background-color,#f3f3f3);border-radius:8px}
.legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 15px;margin:0 0 12px;font-size:11px;color:var(--secondary-text-color,#666)}
.legend-item{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;min-height:26px;padding:3px 0;border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}.legend-item[aria-pressed="false"]{opacity:.45}.legend-item[aria-pressed="false"] span{text-decoration:line-through}.legend-item:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}.legend-item span{overflow-wrap:anywhere}.dot{width:7px;height:7px;border-radius:2px;flex:none;background:var(--event-color)}
.status{font-size:12px;line-height:1.45;color:var(--secondary-text-color,#666);margin:6px 0 12px}
.status.error{color:var(--error-color,#db4437)}.status button{margin-inline-start:8px}
.day-list{display:grid}

.day-title time{font-size:11px;font-weight:400;color:var(--secondary-text-color,#666)}
.weather{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-size:11px;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums}
.weather svg{width:21px;height:21px;flex:none;stroke:currentColor;stroke-width:1.5;fill:none;stroke-linecap:round;stroke-linejoin:round}
.weather b{font-weight:600;color:var(--primary-text-color,#20252b)}

.event-time{font-size:11px;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums;line-height:1.4}
.list-event>.event-time small{display:block;font-size:10px}

.horizontal{overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--divider-color,#ddd) transparent}

.column-heading time{font-size:11px;color:var(--secondary-text-color,#666);font-weight:400;margin-inline-start:4px}

.month-cell.outside{background:color-mix(in srgb,var(--secondary-text-color,#666) 4%,transparent)}
.month-cell.past{background:color-mix(in srgb,var(--secondary-text-color,#666) 4%,transparent)}
.month-cell.past .month-cell-head,.month-cell.past .weather b{color:var(--secondary-text-color,#666)}

.month-cell.outside .month-cell-head time{color:var(--secondary-text-color,#666)}
.month-cell .weather{gap:2px;font-size:10px}
.month-cell .weather svg{width:17px;height:17px}
.month-cell .weather .low{display:none}

.compact .content{padding:var(--eleven-card-padding,16px)}.compact .header{margin-bottom:8px}.compact .legend{margin-bottom:7px}

.compact .empty-day{padding:3px 0}
.compact .column-heading{min-height:48px;margin-bottom:5px;gap:3px}

.compact .column .event-time{margin-bottom:2px}
.compact .month-cell{min-height:74px;padding:3px 4px 5px}
.compact .month-cell-head{min-height:19px;margin-bottom:2px}

.compact .month-more{min-height:23px;padding:3px 5px;font-size:10px}
.calendar-event-popup{width:min(380px,calc(100vw - 16px))}.calendar-event-popup .ui-popup-heading>strong{min-width:0;overflow-wrap:anywhere}
.popup-calendar{display:flex;align-items:center;gap:7px;margin:5px 0 12px;color:var(--secondary-text-color,#666);font-size:11px}
.popup-when{padding:10px 12px;background:var(--secondary-background-color,#f3f3f3);border-radius:6px}
.popup-date,.popup-date-range{display:flex;flex-wrap:wrap;gap:3px 6px;overflow-wrap:anywhere;font-size:12px;font-weight:600}
.popup-date-range{display:grid;gap:2px}.popup-date-range .popup-date-separator{color:var(--secondary-text-color,#666)}
.popup-time{margin-top:3px;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}.popup-field{padding:10px 0 0;margin-top:10px;border-top:1px solid var(--divider-color,#ddd)}
.popup-field-label{display:block;margin-bottom:3px;color:var(--secondary-text-color,#666);font-size:10px}.popup-location,.popup-description{font-size:12px;overflow-wrap:anywhere}.popup-description{white-space:pre-wrap}
.popup-more{list-style:none;padding:0;margin:9px 0}.popup-more li{padding:5px 0;border-top:1px solid var(--divider-color,#ddd);font-size:11px}.popup-more summary{cursor:pointer}.popup-more small{display:block;color:var(--secondary-text-color,#666)}.popup-more-detail{padding:8px 0 10px 12px}
.calendar-info .insight-sensors{display:grid;gap:10px}
.calendar-info .calendar-agenda-metrics{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}
.calendar-info .calendar-agenda-metrics>div:last-child dd{font-size:14px;line-height:1.5;letter-spacing:0}

.calendar-info .calendar-agenda-metrics dd small{display:block;margin-top:2px;font-size:10px;font-weight:400;color:var(--secondary-text-color,#666)}

.calendar-info .insight-sensor-heading{display:flex;align-items:center;gap:8px;min-width:0}.calendar-info .insight-sensor-heading strong{flex:1;min-width:0;overflow-wrap:anywhere}
.calendar-info .insight-states{font-size:10px;color:var(--secondary-text-color,#666);margin-top:4px}
@container(max-width:420px){.content{padding:var(--eleven-card-padding,16px)}.header{align-items:flex-start}.header-actions{gap:5px}.navigation .range{font-size:10px;padding:0 6px}.navigation [data-nav=now]{padding:0 6px}.list-event{grid-template-columns:50px minmax(0,1fr);gap:8px}.weather{font-size:10px}}
.header-actions [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}.legend-item{min-height:44px;min-width:44px}
/* Calendar-local calm agenda anatomy; paint remains theme-owned. */
:host,ha-card,.content{height:auto;min-height:100%}
.calendar-body{flex:none;overflow:visible;min-width:0}
.header,.compact .header{gap:12px;margin-bottom:12px;align-items:center;flex-wrap:nowrap}
.header h2{font-size:16px;font-weight:600;line-height:24px;min-width:0;overflow-wrap:anywhere}
.header svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.header{position:relative}
.calendar-tools{margin-inline-start:auto;flex:none;height:24px}
.calendar-tools summary{display:flex;align-items:center;justify-content:center;list-style:none;width:44px;height:44px;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));cursor:pointer;color:var(--secondary-text-color)}
.calendar-tools summary{position:relative;top:-10px}
.calendar-tools summary::-webkit-details-marker{display:none}
.calendar-tools summary svg{width:22px;height:22px;stroke-width:3}
.calendar-tools summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}
.calendar-tools-panel{position:absolute;z-index:5;inset-inline-end:0;top:48px;width:max-content;max-width:100%;padding:8px;box-sizing:border-box;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);box-shadow:var(--eleven-material-surface-shadow,var(--ha-card-box-shadow,none))}
.calendar-tools:not([open])>.calendar-tools-panel{display:none}
.calendar-tools-panel .info-button{display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;min-height:44px;padding:8px 10px;font-size:13px;white-space:normal;text-align:start}
.calendar-tools-panel .info-button span{min-width:0;overflow-wrap:anywhere}
.calendar-tools-panel .info-button svg{flex:none}
.header-actions{width:100%;margin:0 0 12px;flex-shrink:0}
.header-actions:empty{display:none}
.navigation{width:100%;gap:0;background:var(--secondary-background-color,#eee);box-shadow:none;border-radius:8px;flex-wrap:wrap}
.navigation-actions{display:flex;align-items:center;gap:0;flex:none;margin-inline-start:auto}
.navigation .range{flex:1 1 6em;min-width:0;white-space:normal;overflow-wrap:anywhere;border:0;padding:8px;font-size:13px;line-height:1.4;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
.navigation [data-nav=now]{padding:8px;min-width:44px;font-size:13px}
.navigation [data-nav]{flex:none}
.legend,.compact .legend{gap:8px;margin-bottom:16px;font-size:12px}
.legend-item{padding:8px 10px;gap:7px;line-height:1.4;box-sizing:border-box;min-width:44px;min-height:44px}
.legend-item[aria-pressed=false]{opacity:1;color:var(--secondary-text-color)}
.legend-item[aria-pressed=false] .dot{opacity:.45}
.legend-item[aria-pressed=true]{color:var(--eleven-material-selection-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 40%,var(--primary-text-color)));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);transform:translateY(1px)}
.legend-item[aria-pressed=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.compact .list-day+.list-day{border-top:0;margin-top:16px;padding-top:0}
.day-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px 10px}
.day-title time,.weather{font-size:12px}
.day-list .day-heading{padding-bottom:6px;border-bottom:1px solid var(--divider-color)}
.list-event{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:start;padding:4px 0;font-size:12px}
.list-event>.event-time{min-width:0;font-size:11px;line-height:1.5;padding-top:7px;overflow-wrap:normal}
.event-button .event-title{display:block;font-weight:500;overflow-wrap:anywhere;font-size:13px;line-height:1.45;white-space:normal;overflow:visible;text-overflow:clip}
.column .event-title{font-size:13px;line-height:1.45;white-space:normal;overflow:visible;text-overflow:clip}
.event-button .event-meta{display:block;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;font-size:12px;line-height:1.45;margin-top:3px}
.column .event-meta{font-size:12px;line-height:1.45;margin-top:3px}
.column .event-time{display:block;margin-bottom:4px;font-size:12px;color:var(--secondary-text-color)}
.event-button{display:block!important;min-width:0;width:100%;text-align:start;padding:0 0 0 9px!important;border-inline-start:3px solid var(--event-color)!important;border-radius:0!important;line-height:1.35;min-height:44px!important}
.compact .column .event-button{margin-bottom:4px;padding:4px 6px 4px 8px!important;min-height:44px!important}
.empty-day{color:var(--secondary-text-color,#666);margin:0;font-size:12px;line-height:1.5;padding:8px 0}
.day-list .empty-day{font-size:11px;line-height:1.3;padding:2px 0}

.compact .month-more,.popup-more summary{min-height:44px;min-width:44px;box-sizing:border-box}
.popup-calendar{overflow-wrap:anywhere;font-size:12px}.popup-calendar .dot{flex:none}
.popup-date time,.popup-date-range time{min-width:0;overflow-wrap:anywhere}
.content [data-ui-popup] [data-ui-button]{min-height:44px;min-width:44px;box-sizing:border-box}
.popup-field-label{font-size:12px}.popup-location,.popup-description{font-size:13px;line-height:1.5}
${cardThemeStyles({periodUI:true,wells:'.calendar-info [data-ui-detail-surface]',controls:'.info-button,.period-options [data-ui-button=surface],.period-custom [type=submit]',surfaces:'[data-ui-popup],.tooltip,[data-ui-detail-surface]'})}
/* Match chart legends: functional swatches and plain labels. */
.legend,.compact .legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;margin:0 0 12px;font-size:12px}
.legend-item{padding:4px 0;gap:6px;min-width:0;justify-content:flex-start;border:0;border-radius:4px;background:transparent;box-shadow:none;color:var(--secondary-text-color);font-weight:400;line-height:1.3}
.legend-item[aria-pressed=true],.legend-item[aria-pressed=true]:hover,.legend-item[aria-pressed=false],.legend-item[aria-pressed=false]:hover{background:transparent;box-shadow:none;color:var(--secondary-text-color)}
.legend-item .dot{width:9px;height:9px;border-radius:3px}
.navigation{flex-wrap:nowrap}
.navigation .range{display:flex;align-items:center;flex:1 1 auto;min-width:0;padding:8px 12px;box-sizing:border-box;white-space:normal;overflow-wrap:anywhere;line-height:1.35;border:0}
.navigation>.period-controls{flex:1 1 auto;min-width:0}
.navigation>.period-controls>.period-trigger{width:100%;padding:4px 6px;font-size:12px;justify-content:space-between}
.navigation>[data-period]{flex:none;font-size:12px}
.period-menu .period-options [data-ui-button]{min-width:0;min-height:44px}
${segmentedControlStyles('.navigation','.navigation>.period-controls>.period-trigger,.navigation>[data-period]',{first:'.navigation>.period-controls>.period-trigger',dividers:'.navigation>[data-period]'})}

/* Recessed calendar grid, day surfaces and softly tinted appointments. */
.month-grid{display:grid;grid-template-columns:repeat(7,minmax(76px,1fr));min-width:532px;background:var(--eleven-material-inset,var(--secondary-background-color));box-shadow:var(--eleven-material-well,none);border:0;border-radius:var(--eleven-material-radius-well,12px);overflow:hidden}

.month-weekday{text-align:center;font-size:11px;font-weight:400;padding:10px 5px;color:var(--secondary-text-color);border:0;border-bottom:1px solid color-mix(in srgb,var(--secondary-text-color) 14%,transparent);border-inline-end:1px solid color-mix(in srgb,var(--secondary-text-color) 10%,transparent)}
.month-grid>:nth-child(7n){border-inline-end:0}
.month-grid>:nth-last-child(-n+7){border-bottom:0}
.month-cell{min-width:0;border:0;border-bottom:1px solid color-mix(in srgb,var(--secondary-text-color) 14%,transparent);border-inline-end:1px solid color-mix(in srgb,var(--secondary-text-color) 10%,transparent);min-height:100px;padding:6px;box-sizing:border-box}
.month-cell-head{display:flex;align-items:center;justify-content:space-between;gap:2px;font-size:12px;margin-bottom:6px;min-height:28px}
.month-cell-head time{position:relative;display:inline-grid;place-items:center;width:28px;height:28px;font-weight:400;border:0;border-radius:0;background:transparent;box-shadow:none}
.month-cell.today{box-shadow:none}
.month-cell.today .month-cell-head time{color:var(--accent-color,var(--primary-color));background:transparent;box-shadow:none;font-weight:600}
.month-cell.today .month-cell-head time::after{content:'';position:absolute;bottom:0;left:9px;width:10px;height:2px;border-radius:1px;background:currentColor}
.month-cell.outside:not(.past){color:var(--secondary-text-color);background:color-mix(in srgb,var(--secondary-text-color) 2%,transparent)}

.month-chip .month-event-time{display:block;font-size:10px;line-height:12px;color:var(--secondary-text-color);font-variant-numeric:tabular-nums;margin-bottom:2px}
.month-chip .month-event-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:16px;overflow:hidden;text-overflow:ellipsis}
.event-button:hover{color:var(--primary-text-color)}
.month-cell.past .month-chip:hover{background:color-mix(in srgb,var(--secondary-text-color,#666) 14%,transparent);color:var(--secondary-text-color)}
.month-more{display:block;min-height:44px;min-width:44px;padding:4px 6px;border:0;background:transparent;color:var(--secondary-text-color,#666);font:inherit;cursor:pointer;text-align:start;font-size:11px}
.column{min-width:0;background:var(--eleven-material-inset,var(--secondary-background-color));box-shadow:var(--eleven-material-well,none);border:0;border-radius:var(--eleven-material-radius-well,12px);padding:10px!important}
.list-day{background:var(--eleven-material-inset,var(--secondary-background-color));box-shadow:var(--eleven-material-well,none);border:0;border-radius:var(--eleven-material-radius-well,12px);padding:10px!important}

.day-columns{display:grid;grid-template-columns:repeat(var(--days),minmax(132px,1fr));min-width:calc(var(--days)*132px);gap:8px}
.day-title{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 7px;line-height:1.4;font-size:12px;font-weight:500}
.column-heading{display:flex;flex-direction:column;gap:6px;min-height:64px;margin-bottom:9px;font-size:12px;font-weight:500}

.column .event-button:hover,.list-event .event-button:hover{background:color-mix(in srgb,var(--event-color) 17%,transparent)}
.month-chip:hover{color:var(--primary-text-color);background:color-mix(in srgb,var(--event-color) 17%,transparent)}
.list-day+.list-day{margin-top:8px;border-top:0;padding-top:10px!important}
.column+.column{border-inline-start:0}
.month-cell.past .month-chip{color:var(--secondary-text-color,#666);border-inline-start-color:color-mix(in srgb,var(--secondary-text-color,#666) 50%,transparent)!important;background:color-mix(in srgb,var(--secondary-text-color,#666) 6%,transparent)}

/* Appointment surfaces share one tint, colour rail and outer shadow. */
.column .event-button{padding:7px 7px 7px 9px!important;margin-bottom:7px}
.month-chip{width:100%;min-width:0;text-align:start;margin:0 0 4px;border:0!important;white-space:normal;text-overflow:clip;overflow-wrap:anywhere;display:block!important;min-height:56px!important;height:56px;max-height:56px;margin-bottom:5px;padding:5px 6px!important;font-size:12px;line-height:16px;overflow:hidden;box-sizing:border-box}
.list-event .event-button{font-size:13px;min-height:44px!important;padding:6px 4px 6px 9px!important}
.month-chip,.list-event .event-button,.column .event-button{background:color-mix(in srgb,var(--event-color) 10%,transparent);border-inline-start:2px solid var(--event-color)!important;border-radius:0 6px 6px 0!important;box-shadow:0 2px 4px color-mix(in srgb,var(--eleven-material-shadow,rgba(0,0,0,.18)) 85%,transparent)}
.month-chip[data-past-event],.list-event .event-button[data-past-event],.column .event-button[data-past-event]{box-shadow:0 1px 3px color-mix(in srgb,var(--eleven-material-shadow,rgba(0,0,0,.18)) 45%,transparent)}
.compact .event-meta{display:none}
/* Compact day lists keep readable rows without expanded-mode whitespace. */
.compact .day-list .list-day{padding:8px!important}
.compact .day-list .list-day+.list-day{margin-top:8px;padding-top:8px!important}
.compact .day-list .day-heading{margin-bottom:4px;padding-bottom:4px}
.compact .day-list .list-event{padding:2px 0}
.compact .day-list .list-event>.event-time{padding-top:4px}
.compact .day-list .event-button{min-height:32px!important;padding:4px 4px 4px 9px!important}
`;}













const isDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
const words={
 calendarUnavailable:['Agenda niet beschikbaar','Calendar unavailable'],nextEvent:['Eerstvolgende afspraak','Next event'],
 title:['Agenda','Calendar'],list:['Daglijst','Day list'],columns:['Dagkolommen','Day columns'],month:['Maand','Month'],today:['Vandaag','Today'],tomorrow:['Morgen','Tomorrow'],
 now:['Nu','Now'],previous:['Vorige periode','Previous period'],next:['Volgende periode','Next period'],info:['Informatie','Information'],close:['Sluiten','Close'],
 allDay:['Hele dag','All day'],noEvents:['Geen afspraken','No events'],loading:['Afspraken laden…','Loading events…'],failed:['Afspraken konden niet worden geladen.','Could not load calendar events.'],
 retry:['Opnieuw','Retry'],select:['Kies een agenda in de configuratie.','Select a calendar in the editor.'],more:['meer','more'],weather:['Weer','Weather'],
 hideCalendar:['Verberg agenda','Hide calendar'],showCalendar:['Toon agenda','Show calendar'],allHidden:['Alle agenda’s zijn verborgen.','All calendars are hidden.'],
 soloHint:['Dubbelklik of Shift+Enter: toon alleen deze agenda. Herhaal om alle agenda’s te tonen.','Double-click or Shift+Enter: show only this calendar. Repeat to show all calendars.'],
 continuing:['Doorlopend','Continuing'],until:['Tot','Until'],from:['Vanaf','From'],
 appointments:['Afspraken','Events'],hidden:['Verborgen','Hidden'],noData:['Nog geen gegevens','No data yet'],
 nextAppointment:['Eerstvolgende','Next event'],location:['Locatie','Location'],description:['Beschrijving','Description']
};
const label=(key,dutch)=>words[key]?.[dutch?0:1]??key;
const fieldLabels={title:['Titel','Title'],view:['Weergave','View'],compact:['Compacte weergave','Compact layout'],density:['Dichtheid','Density'],days_to_show:['Aantal dagen','Days to show'],weather_entity:['Weerentiteit','Weather entity'],
 show_title:['Titel tonen','Show title'],show_legend:['Agendalegenda tonen','Show calendar legend'],show_navigation:['Navigatie tonen','Show navigation'],hide_empty_days:['Lege dagen verbergen in daglijst','Hide empty days in day list'],
 entity:['Agenda','Calendar'],name:['Naam','Name'],color:['Kleur','Color']};
const fieldHelp={compact:['Compact toont minder details; open een afspraak voor alle informatie.','Compact shows fewer details; open an event for full information.'],days_to_show:['Voor daglijst en dagkolommen; de maandweergave toont altijd een hele maand.','For list and columns; the month view always shows a full month.'],
 weather_entity:['Optioneel. Dagtemperaturen komen uit de dagelijkse voorspelling van deze weerentiteit.','Optional. Daily temperatures come from this weather entity’s daily forecast.'],
 color:['Kleur van afspraken en de legenda.','Color for events and the legend.']};
const selectorOptions=(dutch,items)=>({select:{mode:'dropdown',options:items.map(([value,nl,en])=>({value,label:dutch?nl:en}))}});

class CalendarEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(config){this._config=normalizeCalendarConfig(config,{draft:true});this._render();}
 set hass(hass){this._hass=hass;this._render();}get hass(){return this._hass;}
 _formDefinition(fields){const dutch=isDutch(this._hass);return {schema:fields,computeLabel:item=>fieldLabels[item.name]?.[dutch?0:1]??item.name,computeHelper:item=>fieldHelp[item.name]?.[dutch?0:1]};}
 _bind(form,fields,data){const definition=this._formDefinition(fields);form.hass=this._hass;form.schema=definition.schema;form.data=data;form.computeLabel=definition.computeLabel;form.computeHelper=definition.computeHelper;}
 _emit(){const entities=this._config.entities.filter(row=>row.entity).map(row=>({...row,color:Array.isArray(row.color)?[...row.color]:row.color}));this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,entities}},bubbles:true,composed:true}));}
 _render(){
  if(!this._config||!this._hass)return;
  const dutch=isDutch(this._hass);
  if(!this._form){
   this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}ha-form{display:block;min-width:0}h3{font-size:16px;margin:24px 0 12px}details{border:1px solid var(--divider-color,#ddd);border-radius:10px;margin:10px 0;min-width:0}summary{padding:12px;min-height:44px;box-sizing:border-box;cursor:pointer;overflow-wrap:anywhere}.body{padding:0 12px 12px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{font:inherit;min-height:36px;border:1px solid var(--divider-color,#ddd);border-radius:6px;padding:6px 12px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#20252b);cursor:pointer}button:disabled{opacity:.4}.remove{margin-inline-start:auto}.error{font-size:12px;color:var(--error-color,#db4437);overflow-wrap:anywhere}.error[hidden]{display:none}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color,#2196f3)}</style><ha-form class="global"></ha-form><h3></h3><div class="calendars"></div><button class="add" type="button"></button><p class="error" role="alert" hidden></p>`;
   this._form=this.shadowRoot.querySelector('.global');
   this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config=normalizeCalendarConfig({...this._config,...event.detail.value,entities:this._config.entities},{draft:true});this._render();this._emit();});
   this.shadowRoot.querySelector('.add').onclick=()=>{if(this._config.entities.length>=12)return;this._config={...this._config,entities:[...this._config.entities,{entity:'',name:'',color:calendarRgb(CALENDAR_COLORS[this._config.entities.length%CALENDAR_COLORS.length])}]};this._render();this.shadowRoot.querySelector('.calendars').lastElementChild.open=true;};
  }
  const global=CalendarCard.getConfigForm(dutch);this._form.hass=this._hass;this._form.schema=global.schema;this._form.data={...this._config,compact:this._config.density==='compact'};this._form.computeLabel=global.computeLabel;this._form.computeHelper=global.computeHelper;
  this.shadowRoot.querySelector('h3').textContent=dutch?'Agenda’s':'Calendars';
  const add=this.shadowRoot.querySelector('.add');add.textContent=dutch?'Agenda toevoegen':'Add calendar';add.disabled=this._config.entities.length>=12;
  const container=this.shadowRoot.querySelector('.calendars');while(container.children.length>this._config.entities.length)container.lastElementChild.remove();
  this._config.entities.forEach((row,index)=>{
   let entry=container.children[index];
   if(!entry){entry=document.createElement('details');entry.open=this._config.entities.length===1;entry.innerHTML='<summary></summary><div class="body"><ha-form></ha-form><div class="actions"><button class="up" type="button"></button><button class="down" type="button"></button><button class="remove" type="button"></button></div></div>';container.append(entry);
    entry.querySelector('ha-form').addEventListener('value-changed',event=>{event.stopPropagation();const entities=this._config.entities.map((item,i)=>i===index?{...item,...event.detail.value}:item);this._config={...this._config,entities};this._render();this._emit();});
    for(const [action,delta] of [['up',-1],['down',1],['remove',0]])entry.querySelector('.'+action).onclick=()=>{const entities=[...this._config.entities];if(action==='remove')entities.splice(index,1);else{const other=index+delta;if(other<0||other>=entities.length)return;[entities[index],entities[other]]=[entities[other],entities[index]];}this._config={...this._config,entities};this._render();this._emit();};
   }
   entry.querySelector('summary').textContent=row.name||this._hass.states?.[row.entity]?.attributes?.friendly_name||row.entity||(dutch?'Nieuwe agenda':'New calendar');
   this._bind(entry.querySelector('ha-form'),[{name:'entity',required:true,selector:{entity:{domain:'calendar'}}},{name:'name',selector:{text:{}}},{name:'color',selector:{color_rgb:{}}}],{...row,color:calendarRgb(row.color)??row.color});
   for(const [action,nl,en] of [['up','Omhoog','Move up'],['down','Omlaag','Move down'],['remove','Verwijderen','Remove']]){const button=entry.querySelector('.'+action);button.textContent=dutch?nl:en;button.disabled=action==='up'?index===0:action==='down'?index===this._config.entities.length-1:false;}
  });
  const error=this.shadowRoot.querySelector('.error');try{if(this._config.entities.some(row=>row.entity))normalizeCalendarConfig(this._config);error.hidden=true;error.textContent='';}catch(problem){error.hidden=false;error.textContent=problem.message.split(' / ')[dutch?1:0]??problem.message;}
 }
}

class CalendarCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._connected=false;this._calendarGeneration=0;this._weatherGeneration=0;this._calendarUnsubs=[];this._events={};this._statuses={};this._forecast=null;this._weatherError=false;this._view='list';this._offset=0;this._hiddenCalendars=new Set();this._legendClickTimers=new Map();this._popupControllers=[];this._todayKey=null;}
 static getConfigForm(dutch=false){return {schema:[
  {name:'title',selector:{text:{}}},{name:'view',default:'list',selector:selectorOptions(dutch,[['list','Daglijst','Day list'],['columns','Dagkolommen','Day columns'],['month','Maand','Month']])},
  {name:'days_to_show',default:5,selector:{number:{min:1,max:14,step:1,mode:'box'}}},{name:'weather_entity',selector:{entity:{domain:'weather'}}},
  {type:'expandable',name:'appearance',title:dutch?'Weergave':'Appearance',flatten:true,schema:[{name:'compact',selector:{boolean:{}}},{name:'show_title',default:true,selector:{boolean:{}}},{name:'show_legend',default:true,selector:{boolean:{}}},{name:'show_navigation',default:true,selector:{boolean:{}}},{name:'hide_empty_days',default:false,selector:{boolean:{}}}]}
 ],computeLabel:item=>fieldLabels[item.name]?.[dutch?0:1]??item.name,computeHelper:item=>fieldHelp[item.name]?.[dutch?0:1]};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();await customElements.whenDefined('ha-form');}
  if(!customElements.get('eleven-calendar-editor'))customElements.define('eleven-calendar-editor',CalendarEditor);
  return document.createElement('eleven-calendar-editor');
 }
 static getStubConfig(hass){const entity=Object.keys(hass?.states??{}).find(id=>id.startsWith('calendar.'));return {entities:entity?[{entity,color:calendarRgb(CALENDAR_COLORS[0])}]:[],days_to_show:5,view:'list'};}
 setConfig(input){
  const empty=!input?.entities?.length&&!input?.calendars?.length;
  const config=normalizeCalendarConfig(input,{draft:empty}),previous=this._config,wasEmpty=this._emptyConfig;
  if(!empty)normalizeCalendarConfig(input);
  this._cancelLegendClicks();
  this._config=config;this._emptyConfig=empty;
  this._hiddenCalendars=new Set(config.show_legend?config.entities.map(row=>row.entity).filter(id=>this._hiddenCalendars.has(id)):[]);
  const priorIds=previous?.entities?.map(row=>row.entity).join('|'),nextIds=config.entities.map(row=>row.entity).join('|');
  if(!previous||previous.view!==config.view)this._view=config.view;
  if(!previous||previous.days_to_show!==config.days_to_show||previous.view!==config.view){this._offset=0;this._periodMode='configured';this._calendarCustom=null;}
  if(this._connected&&this._hass){
   if(empty){this._stopCalendars();this._stopWeather();}
   else{if(priorIds!==nextIds||previous?.days_to_show!==config.days_to_show||previous?.view!==config.view)this._startCalendars();
    if(wasEmpty||previous?.weather_entity!==config.weather_entity)this._startWeather();}
  }
  this._render();
 }
 set hass(hass){
  const previous=this._hass,zone=hass?.config?.time_zone||'UTC',oldZone=previous?.config?.time_zone||'UTC',connectionChanged=previous?.connection!==hass?.connection;
  this._hass=hass;
  const context=JSON.stringify([this._config?.entities?.map(row=>[hass?.states?.[row.entity]?.attributes?.friendly_name,hass?.states?.[row.entity]?.state]),this._config?.weather_entity&&[hass?.states?.[this._config.weather_entity]?.state,hass?.states?.[this._config.weather_entity]?.attributes?.temperature,hass?.states?.[this._config.weather_entity]?.attributes?.temperature_unit]]);
  const displayChanged=context!==this._displayContext;this._displayContext=context;
  const today=localCalendarDayKey(Date.now(),zone);
  if(this._todayKey!==today){this._todayKey=today;this._offset=0;if(this._connected&&this._config&&!this._emptyConfig)this._startCalendars();}
  else if(this._connected&&this._config&&!this._emptyConfig&&(connectionChanged||zone!==oldZone))this._startCalendars();
  if(this._connected&&this._config&&!this._emptyConfig&&(connectionChanged||zone!==oldZone))this._startWeather();
  if(!previous||zone!==oldZone||isDutch(previous)!==isDutch(hass)||connectionChanged||displayChanged)this._render();
  this._scheduleMidnight();
 }
 get hass(){return this._hass;}
 connectedCallback(){this._connected=true;this._todayKey=localCalendarDayKey(Date.now(),this._zone());if(this._config&&!this._emptyConfig){this._startCalendars();this._startWeather();}this._scheduleMidnight();this._render();}
 disconnectedCallback(){this._connected=false;this._cancelLegendClicks();this._stopCalendars();this._stopWeather();this._cleanupUI();clearTimeout(this._midnightTimer);this._midnightTimer=null;clearTimeout(this._nextEventTimer);this._nextEventTimer=null;}
 getCardSize(){const compact=this._config?.density==='compact';return this._view==='month'?(compact?11:14):this._view==='columns'?(compact?6:8):Math.max(3,Math.ceil(((compact?105:130)+(this._config?.days_to_show??5)*(compact?70:100))/50));}
 getGridOptions(){return {columns:12,min_columns:6,rows:Math.max(3,Math.ceil(this.getCardSize()*50/64)),min_rows:3};}
 _zone(){return this._hass?.config?.time_zone||'UTC';}
 _queueRender(){if(this._renderQueued)return;this._renderQueued=true;queueMicrotask(()=>{this._renderQueued=false;if(this._connected)this._render();});}
 _range(){return calendarSelectedRange(this);}
 _stopCalendars(){this._calendarGeneration++;clearTimeout(this._calendarRetryTimer);this._calendarRetryTimer=null;for(const unsubscribe of this._calendarUnsubs)try{unsubscribe();}catch{}this._calendarUnsubs=[];}
 _retryCalendars(){if(this._calendarRetryTimer||!this._connected)return;const generation=this._calendarGeneration;this._calendarRetryFailures=(this._calendarRetryFailures??0)+1;this._calendarRetryTimer=setTimeout(()=>{this._calendarRetryTimer=null;if(this._connected&&generation===this._calendarGeneration&&Object.values(this._statuses).includes('error')){this._startCalendars();this._queueRender();}},retryDelay(this._calendarRetryFailures,30000));this._calendarRetryTimer.unref?.();}
 _startCalendars(){
  this._stopCalendars();if(!this._connected||!this._hass||!this._config||this._emptyConfig)return;
  const generation=this._calendarGeneration,range=this._range(),connection=this._hass.connection;
  const rangeKey=`${range.start}/${range.end}`;this._events=this._eventRangeKey===rangeKey?Object.fromEntries(this._config.entities.filter(row=>this._events[row.entity]).map(row=>[row.entity,this._events[row.entity]])):{};this._eventRangeKey=rangeKey;
  this._statuses=Object.fromEntries(this._config.entities.map(row=>[row.entity,'loading']));
  for(const row of this._config.entities){
   const entity=row.entity;
   if(typeof connection?.subscribeMessage!=='function'){this._statuses[entity]='error';this._retryCalendars();continue;}
   try{
    const promise=connection.subscribeMessage(payload=>{
     if(!this._connected||generation!==this._calendarGeneration)return;
     const events=payload?.event?.events??payload?.events;
     this._statuses[entity]=Array.isArray(events)?'ready':'error';if(Array.isArray(events)){this._events[entity]=events;this._eventRevision=(this._eventRevision??0)+1;if(Object.values(this._statuses).every(status=>status==='ready')){this._calendarRetryFailures=0;clearTimeout(this._calendarRetryTimer);this._calendarRetryTimer=null;}}else this._retryCalendars();this._queueRender();
    },{type:'calendar/event/subscribe',entity_id:entity,start:new Date(range.start).toISOString(),end:new Date(range.end).toISOString()});
    Promise.resolve(promise).then(unsubscribe=>{if(typeof unsubscribe!=='function')return;if(!this._connected||generation!==this._calendarGeneration)unsubscribe();else this._calendarUnsubs.push(unsubscribe);},()=>{if(this._connected&&generation===this._calendarGeneration){this._statuses[entity]='error';this._retryCalendars();this._queueRender();}});
   }catch{this._statuses[entity]='error';this._retryCalendars();}
  }
 }
 _stopWeather(){this._weatherGeneration++;clearTimeout(this._weatherRetryTimer);this._weatherRetryTimer=null;this._weatherUnsub?.();this._weatherUnsub=null;}
 _retryWeather(){if(this._weatherRetryTimer||!this._connected)return;const generation=this._weatherGeneration;this._weatherRetryFailures=(this._weatherRetryFailures??0)+1;this._weatherRetryTimer=setTimeout(()=>{this._weatherRetryTimer=null;if(this._connected&&generation===this._weatherGeneration&&this._weatherError)this._startWeather();},retryDelay(this._weatherRetryFailures,30000));this._weatherRetryTimer.unref?.();}
 _startWeather(){
  this._stopWeather();if(this._forecastEntity!==this._config?.weather_entity)this._forecast=null;this._forecastEntity=this._config?.weather_entity;this._weatherError=false;
  if(!this._connected||!this._hass||!this._config?.weather_entity)return;
  const generation=this._weatherGeneration,entity=this._config.weather_entity,state=this._hass.states?.[entity],legacy=state?.attributes?.forecast;
  if(Array.isArray(legacy))this._forecast=legacy;
  const subscribe=this._hass.connection?.subscribeMessage;
  if(typeof subscribe!=='function'){this._weatherError=!this._forecast?.length;if(this._weatherError)this._retryWeather();return;}
  try{
   const promise=subscribe.call(this._hass.connection,payload=>{
    if(!this._connected||generation!==this._weatherGeneration)return;
    if(Array.isArray(payload?.forecast)){this._forecast=payload.forecast;this._weatherError=false;this._weatherRetryFailures=0;clearTimeout(this._weatherRetryTimer);this._weatherRetryTimer=null;}
    else{this._weatherError=true;this._retryWeather();}
    this._queueRender();
   },{type:'weather/subscribe_forecast',forecast_type:'daily',entity_id:entity});
   Promise.resolve(promise).then(unsubscribe=>{if(typeof unsubscribe!=='function')return;if(!this._connected||generation!==this._weatherGeneration)unsubscribe();else this._weatherUnsub=unsubscribe;},()=>{if(this._connected&&generation===this._weatherGeneration){this._weatherError=true;this._retryWeather();this._queueRender();}});
  }catch{this._weatherError=true;this._retryWeather();}
 }
 _scheduleMidnight(){
  clearTimeout(this._midnightTimer);if(!this._connected||!this._hass)return;
  const today=localCalendarDayKey(Date.now(),this._zone()),next=calendarDayStart(nextCalendarDayKey(today),this._zone());
  this._midnightTimer=setTimeout(()=>{const current=localCalendarDayKey(Date.now(),this._zone());if(current!==this._todayKey){this._todayKey=current;this._offset=0;this._startCalendars();this._render();}this._scheduleMidnight();},Math.max(1000,Math.min(86400000,next-Date.now()+100)));
 }
 _calendarName(entity){const row=this._config.entities.find(item=>item.entity===entity);return row?.name||this._hass?.states?.[entity]?.attributes?.friendly_name||entity;}
 _calendarFailed(entity){return this._statuses[entity]==='error'||['unavailable','unknown'].includes(this._hass?.states?.[entity]?.state);}
 _updateNextEvent(){
  this._nextEvent=nextCalendarEvent(this._displayEvents??[]);
  const next=this._nextEvent?calendarEventKey(this._nextEvent):null;
  for(const button of this.shadowRoot.querySelectorAll('[data-calendar-event]')){
   const selected=button.dataset.calendarEvent===next;
   button.toggleAttribute('data-next-event',selected);
   if(selected)button.setAttribute('aria-description',label('nextEvent',isDutch(this._hass)));else button.removeAttribute('aria-description');
  }
  clearTimeout(this._nextEventTimer);this._nextEventTimer=null;
  if(this._connected&&this._nextEvent)this._nextEventTimer=setTimeout(()=>this._updateNextEvent(),Math.max(1,Math.min(2147483647,this._nextEvent.start-Date.now()+1)));
 }
 _eventColor(entity){return calendarColor(this._config.entities.find(item=>item.entity===entity)?.color);}
 _cancelLegendClicks(){cancelUILegendClicks(this);}
 _focusLegend(id){focusUILegend(this,id,'[data-calendar]',button=>button.dataset.calendar);}
 _toggleCalendar(id){if(!this._config.show_legend||!this._config.entities.some(row=>row.entity===id))return;
  if(this._hiddenCalendars.has(id))this._hiddenCalendars.delete(id);else this._hiddenCalendars.add(id);
  this._render();this._focusLegend(id);
 }
 _toggleCalendarIsolation(id){if(!this._config.show_legend||!this._config.entities.some(row=>row.entity===id))return;
  this._cancelLegendClicks();
  const only=this._config.entities.every(row=>this._hiddenCalendars.has(row.entity)===(row.entity!==id));
  this._hiddenCalendars=only?new Set():new Set(this._config.entities.filter(row=>row.entity!==id).map(row=>row.entity));
  this._render();this._focusLegend(id);
 }
 _formatter(options){return new Intl.DateTimeFormat(isDutch(this._hass)?'nl-NL':'en-GB',options);}
 _dayFormatter(options){return this._formatter({timeZone:'UTC',...options});}
 _time(value){return this._formatter({timeZone:this._zone(),hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(value);}
 _dayTitle(key){const dutch=isDutch(this._hass);if(key===this._todayKey)return label('today',dutch);if(key===nextCalendarDayKey(this._todayKey))return label('tomorrow',dutch);return this._dayFormatter({weekday:'long'}).format(Date.parse(`${key}T12:00:00Z`));}
 _eventTime(event,day){
  const dutch=isDutch(this._hass);if(event.allDay)return label('allDay',dutch);
  if(event.start<day.start&&event.end>day.end)return label('continuing',dutch);
  if(event.start<day.start)return `${label('until',dutch)} ${this._time(event.end)}`;
  if(event.end>day.end)return `${label('from',dutch)} ${this._time(event.start)}`;
  return `${this._time(event.start)}–${this._time(event.end)}`;
 }
 _weatherIcon(condition){
  const sun='<circle cx="9" cy="8" r="3"/><path d="M9 1v2M9 13v2M2 8H0M16 8h2M3.3 2.3l1.4 1.4M13.3 12.3l1.4 1.4M3.3 13.7l1.4-1.4M13.3 3.7l1.4-1.4"/>';
  const cloud='<path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.5 12a3 3 0 1 1 .5 6Z"/>';
  const kind=/rain|pouring|lightning|hail|snow/.test(condition)?'rain':/cloud|fog/.test(condition)?'cloud':'sun';
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${kind==='sun'?`<g transform="translate(3 4)">${sun}</g>`:kind==='cloud'?sun+cloud:cloud+'<path d="m9 20-1 2m5-2-1 2m5-2-1 2"/>'}</svg>`;
 }
 _weatherFor(key,forecast){
  if(!this._config.weather_entity)return '';
  const row=forecast.get(key),state=this._hass?.states?.[this._config.weather_entity],current=key===this._todayKey?state:null;
  if(!row&&!current)return '';
  const high=Number(row?.temperature??current?.attributes?.temperature),low=row?.templow==null?NaN:Number(row.templow),condition=String(row?.condition??current?.state??''),unit=state?.attributes?.temperature_unit??'°';
  if(!Number.isFinite(high))return '';
  const text=`${Math.round(high)}${unit}`,description=`${condition||label('weather',isDutch(this._hass))}, ${text}${Number.isFinite(low)?` / ${Math.round(low)}${unit}`:''}`;
  return `<span class="weather" title="${escapeCalendarHtml(description)}" aria-label="${escapeCalendarHtml(description)}">${this._weatherIcon(condition)}<span><b>${escapeCalendarHtml(text)}</b>${Number.isFinite(low)?`<span class="low"> / ${Math.round(low)}${escapeCalendarHtml(unit)}</span>`:''}</span></span>`;
 }
 _detailTime(event){
  const dutch=isDutch(this._hass),options={weekday:'long',day:'numeric',month:'long',year:'numeric'};
  if(event.allDay){
   const format=this._dayFormatter(options),first=event.startKey,last=nextCalendarDayKey(event.endKey,-1);
   return `<div class="popup-date"><time datetime="${first}">${escapeCalendarHtml(format.format(Date.parse(`${first}T12:00:00Z`)))}</time>${last!==first?`<span class="popup-date-separator">–</span><time datetime="${last}">${escapeCalendarHtml(format.format(Date.parse(`${last}T12:00:00Z`)))}</time>`:''}</div><div class="popup-time">${label('allDay',dutch)}</div>`;
  }
  const format=this._formatter({timeZone:this._zone(),...options}),startKey=localCalendarDayKey(event.start,this._zone()),endKey=localCalendarDayKey(event.end,this._zone());
  if(startKey===endKey)return `<div class="popup-date"><time datetime="${new Date(event.start).toISOString()}">${escapeCalendarHtml(format.format(event.start))}</time></div><div class="popup-time">${escapeCalendarHtml(this._time(event.start))}–${escapeCalendarHtml(this._time(event.end))}</div>`;
  return `<div class="popup-date-range"><time datetime="${new Date(event.start).toISOString()}">${escapeCalendarHtml(format.format(event.start))} · ${escapeCalendarHtml(this._time(event.start))}</time><span class="popup-date-separator">–</span><time datetime="${new Date(event.end).toISOString()}">${escapeCalendarHtml(format.format(event.end))} · ${escapeCalendarHtml(this._time(event.end))}</time></div>`;
 }
 _eventButton(event,day,variant='list'){
  const dutch=isDutch(this._hass),name=this._calendarName(event.calendar),title=event.summary||(dutch?'Afspraak':'Event'),time=this._eventTime(event,day),id=`calendar-event-${this._popupSeq++}`;
  const content=variant==='month'?`${!event.allDay?`<span class="month-event-time">${escapeCalendarHtml(this._time(event.start))}</span>`:''}<span class="month-event-title">${escapeCalendarHtml(title)}</span>`:
   `${variant==='columns'?`<span class="event-time">${escapeCalendarHtml(time)}</span>`:''}<span class="event-title">${escapeCalendarHtml(title)}</span><span class="event-meta">${escapeCalendarHtml(name)}${event.location?' · '+escapeCalendarHtml(event.location):''}</span>`;
  const popup=uiPopup({id,title,className:'calendar-event-popup',closeLabel:label('close',dutch),content:`<div class="popup-calendar" style="--event-color:${this._eventColor(event.calendar)}"><i class="dot"></i>${escapeCalendarHtml(name)}</div><div class="popup-when">${this._detailTime(event)}</div>${event.location?`<div class="popup-field"><span class="popup-field-label">${label('location',dutch)}</span><div class="popup-location">${escapeCalendarHtml(event.location)}</div></div>`:''}${event.description?`<div class="popup-field"><span class="popup-field-label">${label('description',dutch)}</span><div class="popup-description">${escapeCalendarHtml(event.description)}</div></div>`:''}`});
  this._popupMarkup.push(popup);
  return uiButton({variant:'text',className:variant==='month'?'month-chip':'event-button',content,label:`${title}, ${time}, ${name}`,title:`${title} · ${time}`,attrs:{'data-event-popup-id':id,'data-calendar-event':calendarEventKey(event),'data-past-event':day.key<this._todayKey?'':null,'aria-controls':id,'aria-haspopup':'dialog',style:`--event-color:${this._eventColor(event.calendar)}`}});
 }
 _list(days,forecast){
  const short=this._dayFormatter({day:'numeric',month:'short'}),dutch=isDutch(this._hass);
  if(this._config.hide_empty_days)days=days.filter(day=>day.events.length);
  if(!days.length)return `<p class="status" role="status">${label('noEvents',dutch)}</p>`;
  return `<div class="day-list">${days.map(day=>`<section class="list-day"><div class="day-heading"><div class="day-title">${escapeCalendarHtml(this._dayTitle(day.key))}<time datetime="${day.key}">${short.format(Date.parse(`${day.key}T12:00:00Z`))}</time></div>${this._weatherFor(day.key,forecast)}</div>${day.events.length?day.events.map(event=>`<div class="list-event"><span class="event-time">${event.allDay?label('allDay',dutch):escapeCalendarHtml(this._eventTime(event,day))}</span>${this._eventButton(event,day)}</div>`).join(''):`<p class="empty-day">${label('noEvents',dutch)}</p>`}</section>`).join('')}</div>`;
 }
 _columns(days,forecast){
  const short=this._dayFormatter({weekday:'short'}),date=this._dayFormatter({day:'numeric',month:'short'}),dutch=isDutch(this._hass);
  return `<div class="horizontal" tabindex="0" role="region" aria-label="${label('columns',dutch)}"><div class="day-columns" style="--days:${days.length}">${days.map(day=>`<section class="column"><div class="column-heading"><div>${short.format(Date.parse(`${day.key}T12:00:00Z`))}<time datetime="${day.key}">${date.format(Date.parse(`${day.key}T12:00:00Z`))}</time></div>${this._weatherFor(day.key,forecast)}</div>${day.events.length?day.events.map(event=>this._eventButton(event,day,'columns')).join(''):`<p class="empty-day">${label('noEvents',dutch)}</p>`}</section>`).join('')}</div></div>`;
 }
 _month(days,range,forecast){
  const dutch=isDutch(this._hass),weekday=this._dayFormatter({weekday:'short'}),names=Array.from({length:7},(_,index)=>weekday.format(Date.UTC(2024,0,1+index)));
  const rows=days.map(day=>{
   const outside=day.key.slice(0,7)!==range.monthKey.slice(0,7),visible=day.events.slice(0,this._config.density==='compact'?2:3),remaining=day.events.length-visible.length;
   let more='';
   if(remaining){const id=`calendar-more-${this._popupSeq++}`,title=this._dayFormatter({weekday:'long',day:'numeric',month:'long'}).format(Date.parse(`${day.key}T12:00:00Z`));
    this._popupMarkup.push(uiPopup({id,title,closeLabel:label('close',dutch),content:`<ul class="popup-more">${day.events.map(event=>`<li data-calendar-event="${escapeCalendarHtml(calendarEventKey(event))}" style="--event-color:${this._eventColor(event.calendar)}"><details><summary><strong>${escapeCalendarHtml(event.summary||label('title',dutch))}</strong><small>${escapeCalendarHtml(this._eventTime(event,day))} · ${escapeCalendarHtml(this._calendarName(event.calendar))}</small></summary><div class="popup-more-detail"><div class="popup-when">${this._detailTime(event)}</div>${event.location?`<div class="popup-field"><span class="popup-field-label">${label('location',dutch)}</span><div class="popup-location">${escapeCalendarHtml(event.location)}</div></div>`:''}${event.description?`<div class="popup-field"><span class="popup-field-label">${label('description',dutch)}</span><div class="popup-description">${escapeCalendarHtml(event.description)}</div></div>`:''}</div></details></li>`).join('')}</ul>`}));
    more=uiButton({variant:'text',className:'month-more',text:`+${remaining} ${label('more',dutch)}`,label:`+${remaining} ${label('more',dutch)}`,attrs:{'data-event-popup-id':id,'aria-controls':id,'aria-haspopup':'dialog'}});
   }
   return `<section class="month-cell ${outside?'outside':''} ${day.key<this._todayKey?'past':''} ${day.key===this._todayKey?'today':''}" aria-label="${escapeCalendarHtml(this._dayFormatter({weekday:'long',day:'numeric',month:'long'}).format(Date.parse(`${day.key}T12:00:00Z`)))}"><div class="month-cell-head"><time datetime="${day.key}"${day.key===this._todayKey?' aria-current="date"':''}>${Number(day.key.slice(8))}</time>${this._weatherFor(day.key,forecast)}</div>${visible.map(event=>this._eventButton(event,day,'month')).join('')}${more}</section>`;
  }).join('');
  return `<div class="horizontal" tabindex="0" role="region" aria-label="${label('month',dutch)}"><div class="month-grid">${names.map(name=>`<div class="month-weekday">${escapeCalendarHtml(name)}</div>`).join('')}${rows}</div></div>`;
 }
 _status(){const dutch=isDutch(this._hass),states=Object.values(this._statuses);if(states.includes('error'))return `<p class="status error" role="status">${label('failed',dutch)}${uiButton({variant:'action',text:label('retry',dutch),attrs:{'data-retry':''}})}</p>`;
  if(states.includes('loading'))return `<p class="status" role="status">${label('loading',dutch)}</p>`;return '';}
 _rangeLabel(range){const short=this._dayFormatter({day:'numeric',month:'short'});if(this._view==='month'&&['configured','month'].includes(this._periodMode??'configured'))return this._dayFormatter({month:'long',year:'numeric'}).format(Date.parse(`${range.monthKey}T12:00:00Z`));return `${short.format(Date.parse(`${range.startKey}T12:00:00Z`))}–${short.format(Date.parse(`${nextCalendarDayKey(range.endKey,-1)}T12:00:00Z`))}`;}
 _infoPopup(dutch,range,days){
  const unique=events=>[...new Map(events.map(event=>[calendarEventKey(event),event])).values()];
  const periodDays=this._view==='month'?days.filter(day=>day.key.slice(0,7)===range.monthKey.slice(0,7)):days;
  const all=unique(periodDays.flatMap(day=>day.events));
  const locale=dutch?'nl-NL':'en-GB',nextFormat=new Intl.DateTimeFormat(locale,{timeZone:this._zone(),weekday:'short',day:'numeric',month:'short'});
  const rows=this._config.entities.map(row=>{
   const id=row.entity,events=all.filter(event=>event.calendar===id),next=nextCalendarEvent(events),hidden=this._hiddenCalendars.has(id),status=this._statuses[id],failed=this._calendarFailed(id);
   const states=[hidden?label('hidden',dutch):'',failed?label('calendarUnavailable',dutch):status==='loading'?label('loading',dutch):status!=='ready'?label('noData',dutch):''].filter(Boolean);
   const nextText=next?escapeCalendarHtml(next.summary||label('title',dutch)):'—',nextWhen=next?`${nextFormat.format(next.start)}${next.allDay?` · ${label('allDay',dutch)}`:` · ${this._time(next.start)}`}`:'';
   return `<section class="insight-sensor" data-information-entity="${escapeCalendarHtml(id)}" data-ui-detail-surface><div class="insight-sensor-heading ui-detail-surface-title"><i class="dot" style="--event-color:${this._eventColor(id)}" aria-hidden="true"></i><strong>${escapeCalendarHtml(this._calendarName(id))}</strong></div><dl class="ui-detail-surface-metrics insight-metrics calendar-agenda-metrics"><div><dt>${label('appointments',dutch)}</dt><dd>${status==='ready'?events.length:'—'}</dd></div><div><dt>${label('nextAppointment',dutch)}</dt><dd>${status==='ready'?nextText:'—'}${status==='ready'&&next?`<small>${escapeCalendarHtml(nextWhen)}</small>`:''}</dd></div></dl>${states.length?`<div class="insight-states" role="status">${escapeCalendarHtml(states.join(' · '))}</div>`:''}</section>`;
  }).join('');
  const content=`<div class="calendar-info"><div class="insight-sensors">${rows}</div></div>`;
  return uiPopup({id:'calendar-info',className:'insight-popup',title:dutch?'Gegevens':'Data information',closeLabel:label('close',dutch),content});
 }
 _monthPeriods(range,dutch){
  this._periodMenuOpen=false;this._periodMenuPending=false;
  return {picker:`<span class="range">${escapeCalendarHtml(this._rangeLabel(range))}</span>`,navigation:[['previous',-1,dutch?'Vorige maand':'Previous month'],['now',0,dutch?'Huidige maand':'Current month'],['next',1,dutch?'Volgende maand':'Next month']].map(([key,direction,title])=>uiButton({text:key==='now'?(dutch?'Nu':'Now'):'',content:key==='now'?undefined:cardHeaderIcon(key),label:title,title,attrs:{'data-period':key,'data-month-direction':direction}})).join('')};
 }
 _cleanupUI(){disconnectPeriodControls(this,true);globalThis.document?.removeEventListener?.('pointerdown',this._toolsOutside);for(const controller of this._popupControllers){controller.close();controller.disconnect();}this._popupControllers=[];}
 _render(){
  if(!this._config)return;
  const dutch=isDutch(this._hass),range=this._range(),renderKey=`${this._view}/${range.startKey}/${range.endKey}`,sameRange=this._renderKey===renderKey,scroll=sameRange?this.shadowRoot.querySelector('.horizontal')?.scrollLeft??0:0,scrollTop=sameRange?this.shadowRoot.querySelector('.calendar-body')?.scrollTop??0:0;
  const active=this.shadowRoot.activeElement,focusCalendar=active?.dataset?.calendar,focusEvent=active?.dataset?.calendarEvent,focusInfo=active?.hasAttribute?.('data-info'),focusRetry=active?.hasAttribute?.('data-retry');
  const toolsOpen=Boolean(this.shadowRoot.querySelector('.calendar-tools')?.open),focusTools=active?.matches?.('.calendar-tools summary');
  const openInfo=this.shadowRoot.querySelector('#calendar-info:popover-open,#calendar-info[data-fallback-open]'),infoPopupFocus=Boolean(openInfo?.contains(active));
  this._periodAdapter=calendarPeriodAdapter(this);const periods=this._view==='month'?this._monthPeriods(range,dutch):periodControls(this,dutch?'nl':'en',{tabVariant:'card'});
  this._renderKey=renderKey;
  this._cleanupUI();
  if(this._emptyConfig){this._displayEvents=[];this._updateNextEvent();this.shadowRoot.innerHTML=`<style>${calendarCardStyles()}</style><ha-card><div class="content"><div class="status">${label('select',dutch)}</div></div></ha-card>`;return;}
  const visibleEntities=this._config.entities.filter(row=>!this._hiddenCalendars.has(row.entity));
  const daysKey=`${range.start}/${range.end}/${this._zone()}/${this._eventRevision??0}/${this._config.entities.map(row=>row.entity).join('|')}`;
  if(this._daysKey!==daysKey){this._daysCache=calendarDaysWithEvents(range,this._events,this._config.entities,this._zone());this._daysKey=daysKey;}
  const days=this._daysCache,visibleDays=days.map(day=>({...day,events:day.events.filter(event=>!this._hiddenCalendars.has(event.calendar))})),forecast=forecastByCalendarDay(this._forecast,this._zone());
  this._displayEvents=visibleDays.flatMap(day=>day.events);
  this._popupSeq=0;this._popupMarkup=[];
  const loadingOnly=Object.values(this._statuses).length>0&&Object.values(this._statuses).every(status=>status==='loading')&&!Object.values(this._events).some(events=>events.length);
  const body=!visibleEntities.length?`<p class="status" role="status">${label('allHidden',dutch)}</p>`:loadingOnly?'':this._view==='columns'?this._columns(visibleDays,forecast):this._view==='month'?this._month(visibleDays,range,forecast):this._list(visibleDays,forecast);
  const navigation=this._config.show_navigation?`<div class="navigation chart-controls" role="group" aria-label="${dutch?'Datumnavigatie':'Date navigation'}">${periods.picker}${periods.navigation}</div>`:'';
  const info=uiButton({content:cardHeaderIcon('info')+`<span>${label('info',dutch)}</span>`,className:'info-button',label:label('info',dutch),attrs:{'data-info':'','aria-controls':'calendar-info','aria-haspopup':'dialog'}});
  const toolsLabel=dutch?'Agendaopties':'Calendar tools',tools=`<details class="calendar-tools"${toolsOpen?' open':''}><summary aria-label="${toolsLabel}" title="${toolsLabel}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg></summary><div class="calendar-tools-panel">${info}</div></details>`;
  const legend=this._config.show_legend?uiLegend({items:this._config.entities.map(row=>{const name=this._calendarName(row.entity),visible=!this._hiddenCalendars.has(row.entity),failed=this._calendarFailed(row.entity),failure=failed?label('calendarUnavailable',dutch):'';return {id:row.entity,visible,title:label(visible?'hideCalendar':'showCalendar',dutch)+' '+name+'.'+(failure?' '+failure+'.':''),attrs:{'data-calendar':row.entity,'data-calendar-error':failed?'':null,'aria-label':failure?name+'. '+failure:null,style:`--event-color:${this._eventColor(row.entity)}`},content:`<i class="dot"></i><span>${escapeCalendarHtml(name)}</span>${failed?'<b class="legend-error" aria-hidden="true">!</b>':''}`};})}):'';
  this.shadowRoot.innerHTML=`<style>${uiActionButtonStyles()}${uiPopupStyles()}${periodControlsStyles()}${calendarCardStyles()}${uiBalancedTabsStyles()}</style><ha-card class="${this._config.density==='compact'?'compact':''}"><div class="content"><header class="header">${this._config.show_title?`<h2>${escapeCalendarHtml(this._config.title||label('title',dutch))}</h2>`:''}${tools}</header><div class="header-actions">${navigation}</div>${legend}${this._status()}<div class="calendar-body">${body}</div>${this._infoPopup(dutch,range,days)}${this._popupMarkup.join('')}</div></ha-card>`;
  const horizontal=this.shadowRoot.querySelector('.horizontal');if(horizontal)horizontal.scrollLeft=scroll;
  const calendarBody=this.shadowRoot.querySelector('.calendar-body');if(calendarBody)calendarBody.scrollTop=scrollTop;
  this._updateNextEvent();
  bindUILegend(this,{selector:'[data-calendar]',getId:button=>button.dataset.calendar,hint:label('soloHint',dutch),toggle:id=>this._toggleCalendar(id),isolate:id=>this._toggleCalendarIsolation(id)});
  if(this._view==='month'){
   for(const button of this.shadowRoot.querySelectorAll('[data-month-direction]'))button.onclick=()=>{const key=button.dataset.period;this._periodAdapter.move(Number(button.dataset.monthDirection));this.shadowRoot.querySelector(`[data-period="${key}"]`)?.focus({preventScroll:true});};
   if(active?.dataset.period)this.shadowRoot.querySelector(`[data-period="${active.dataset.period}"]`)?.focus({preventScroll:true});
  }else bindPeriodControls(this);
  if(focusCalendar)this._focusLegend(focusCalendar);
  else if(focusEvent){const target=[...this.shadowRoot.querySelectorAll('[data-calendar-event]')].find(e=>e.dataset.calendarEvent===focusEvent);(target??this.shadowRoot.querySelector('.calendar-tools summary'))?.focus({preventScroll:true});}
  else if(focusInfo||focusRetry||focusTools)this.shadowRoot.querySelector(focusInfo&&toolsOpen?'[data-info]':'.calendar-tools summary')?.focus({preventScroll:true});
  const toolsEl=this.shadowRoot.querySelector('.calendar-tools'),summary=toolsEl.querySelector('summary');
  const closeTools=()=>{if(toolsEl.contains(this.shadowRoot.activeElement))summary.focus({preventScroll:true});toolsEl.open=false;};
  toolsEl.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeTools();}};
  this._toolsOutside=e=>{if(toolsEl.open&&!e.composedPath().includes(toolsEl)&&!e.composedPath().some(n=>n?.matches?.('[popover]')))closeTools();};
  globalThis.document?.addEventListener?.('pointerdown',this._toolsOutside);
  const makePopup=(trigger,popup)=>{let control;control=bindUIPopup({trigger,popup,container:this.shadowRoot.querySelector('ha-card'),beforeOpen:()=>this._popupControllers.forEach(item=>{if(item!==control)item.close();})});this._popupControllers.push(control);if(openInfo&&popup.id==='calendar-info'){control.open(false);if(infoPopupFocus)popup.querySelector('[data-ui-popup-close]')?.focus({preventScroll:true});}};
  makePopup(this.shadowRoot.querySelector('[data-info]'),this.shadowRoot.querySelector('#calendar-info'));
  for(const trigger of this.shadowRoot.querySelectorAll('[data-event-popup-id]'))makePopup(trigger,this.shadowRoot.getElementById(trigger.dataset.eventPopupId));
  this.shadowRoot.querySelector('[data-retry]')?.addEventListener('click',()=>{this._calendarRetryFailures=0;this._startCalendars();this._render();});
 }
}

if(!customElements.get('eleven-calendar-card'))customElements.define('eleven-calendar-card',withCardBackground(CalendarCard));
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-calendar-card'))window.customCards.push({type:'eleven-calendar-card',name:'Eleven Calendar (beta)',description:'Calendar events in a list, day columns or month view, with optional weather.',preview:true});
})();
