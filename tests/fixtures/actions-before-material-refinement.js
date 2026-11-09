// Eleven standalone Actions, Controls and Waste
(()=>{
// Paint only, scoped to each caller's shadow root and explicit semantic roles.
// Material recipes/palettes belong to the optional YAML theme, never this helper.
// Do not use generic control selectors: swatches, state tracks and chart colors
// must keep their functional paint. chartUI is an explicit non-House opt-in
// for shared chart-control geometry. No behavior or public-token writes.
function cardThemeStyles({wells='',controls='',selected='',plots='',surfaces='',chartUI=false}={}) {
 const well=selector=>selector?`${selector}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px))}`:'';
 return `
ha-card{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none)}
${well(wells)}
${plots?`${plots}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,0px);background:var(--eleven-material-plot-background,transparent)}`:''}
${surfaces?`${surfaces}{box-shadow:var(--eleven-material-surface-shadow,none)}`:''}
${controls?`${controls}{background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
:is(${controls}):not(:disabled):hover{background:var(--eleven-material-control-hover-background,var(--secondary-background-color,transparent))}
:is(${controls}):not(:disabled):active{box-shadow:var(--eleven-material-well,none)}`:''}
${selected?`${selected}{box-shadow:var(--eleven-material-selection-well,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}`:''}
${chartUI?`
/* Opt-in only: House's shared primitive defaults remain unchanged. */
.card-header{margin:0 0 12px;gap:12px;align-items:center}
.card-header h2{margin:0;flex:1 1 100%}
.header-actions{width:100%;gap:8px;justify-content:space-between}
.header-actions [data-ui-button],.period-menu [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.chart-controls{flex:1 1 100%;width:100%}
.chart-controls>.period-controls{flex:1 1 auto;margin-inline-end:0;padding-inline-end:0}
.chart-controls>.period-controls::after{display:none}
.header-actions .period-trigger{width:100%;justify-content:space-between;padding:8px;flex:1 1 auto}
.period-trigger span{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;line-height:1.35;text-align:start}
.period-menu [data-ui-tabs]{border-bottom:0;gap:6px}
.period-menu [role=tab]{border-bottom:0;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));white-space:normal;padding:8px 4px;background:var(--eleven-material-control-background,var(--secondary-background-color));box-shadow:var(--eleven-material-control-shadow,none)}
.period-menu [role=tab][aria-selected=true],.period-menu [data-period-option][aria-checked=true]{border:0;color:var(--accent-color,var(--primary-color));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);text-decoration:none;transform:translateY(1px)}
.period-menu [data-period-option][aria-checked=true]:hover,.period-menu [role=tab][aria-selected=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.period-menu [data-period-option]{min-width:0}
.period-menu .period-options{grid-template-columns:repeat(5,minmax(0,1fr))}
.period-menu .period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-menu .ui-popup-heading [data-ui-button]{min-width:44px}
.legend [data-ui-legend]{min-height:44px;min-width:44px;box-sizing:border-box}
@container(min-width:600px){.card-header h2{flex:1 1 110px}.header-actions{width:auto;flex:0 1 auto;justify-content:flex-end}.chart-controls{flex:0 1 auto;width:auto}}
`:''}
@media(forced-colors:active){ha-card${[wells,controls,selected,plots,surfaces].filter(Boolean).map(s=>','+s).join('')}{box-shadow:none}}
`;
}

function coverRequest(state,entity,action){
 const bit={open:1,close:2,stop:8}[action];
 if(!available(state)||!/^cover\.[a-z0-9_]+$/.test(entity)||!bit||!(Number(state.attributes?.supported_features)&bit))return null;
 return {domain:'cover',service:action+'_cover',data:{entity_id:entity}};
}
function actionRequest(state,entity){
 if(!available(state)||!/^(scene|script)\.[a-z0-9_]+$/.test(entity))return null;
 return {domain:entity.split('.')[0],service:'turn_on',data:{entity_id:entity}};
}

const available=s=>!!s&&!['unknown','unavailable'].includes(s.state);
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
function temperatureRequest(state,direction){
 if(!available(state)||![-1,1].includes(direction))return null;
 const a=state.attributes??{};if(!finite(a.temperature))return null;
 const step=finite(a.target_temp_step)&&Number(a.target_temp_step)>0?Number(a.target_temp_step):0.5;
 const value=Number((Number(a.temperature)+direction*step).toFixed(6));
 if((finite(a.min_temp)&&value<Number(a.min_temp))||(finite(a.max_temp)&&value>Number(a.max_temp)))return null;
 return value;
}

// Presentation helpers shared by Actions, Controls and Waste; no card registration.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<ha-icon icon="${esc(name)}" aria-hidden="true"></ha-icon>`;
const CSS=`
:host{display:block;min-width:0;height:100%;color:var(--primary-text-color)}
ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));border-radius:var(--ha-card-border-radius,12px)}
.content{padding:16px;font-family:var(--ha-font-family-body,inherit);line-height:1.4}.heading{display:flex;align-items:baseline;gap:8px;margin-bottom:14px}h2{font-size:18px;font-weight:650;letter-spacing:-.01em;line-height:1.25;margin:0;flex:1}
button{font:inherit;color:inherit;cursor:pointer;appearance:none;border:0;border-radius:8px;background:var(--secondary-background-color);min-width:44px;min-height:44px;box-sizing:border-box;transition:background 120ms ease-out}button:hover:not(:disabled){background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color))}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:disabled{opacity:.45;cursor:default}ha-icon{--mdc-icon-size:22px;display:inline-flex;width:22px;height:22px;flex:none}
.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.action{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding:12px;min-height:76px;text-align:left;font-size:13px;font-weight:550;overflow-wrap:anywhere}.action ha-icon{color:var(--primary-color)}.action:nth-child(n+4){background:transparent;border:1px solid var(--divider-color)}
.split-label{display:block}.split-label small{display:block;color:var(--secondary-text-color);font-size:11px;font-weight:400;margin-top:1px}.feedback:empty{display:none}.feedback{font-size:12px;margin-top:10px;color:var(--secondary-text-color);overflow-wrap:anywhere}.feedback.error{color:var(--error-color)}
.target{text-align:center;min-width:49px;font-size:16px;font-weight:550;font-variant-numeric:tabular-nums}.target small{display:block;font-weight:400;font-size:10px;color:var(--secondary-text-color)}
.identity{background:transparent;text-align:left;flex:1;min-width:0;padding:0;display:flex;gap:9px;align-items:center}.identity ha-icon{color:var(--secondary-text-color)}.identity span{min-width:0;overflow-wrap:anywhere;font-size:13px}.identity small{display:block;font-size:11px;color:var(--secondary-text-color)}
@media(max-width:380px){.content{padding:12px}.action{padding:10px;min-height:72px}}@media(prefers-reduced-motion:reduce){button{transition:none}}
`;
function CSSescape(s){return String(s).replace(/["\\]/g,'\\$&');}


const normalizeItem=e=>typeof e==='string'?{entity:e}:e;
const isNL=locale=>String(locale||'en').toLowerCase().startsWith('nl');
function safeColor(value){if(Array.isArray(value)&&value.length===3&&value.every(v=>Number.isInteger(v)&&v>=0&&v<=255))return `rgb(${value.join(',')})`;return /^#[\da-f]{3}([\da-f]{3})?$/i.test(value||'')?value:null;}
function controlRequest(state,entity,action,value){
 if(!available(state)||!/^([a-z_]+)\.[a-z0-9_]+$/.test(entity))return null;
 const domain=entity.split('.')[0],a=state.attributes||{},features=Number(a.supported_features)||0,data={entity_id:entity};
 const req=(service,extra={})=>({domain,service,data:{...data,...extra}});
 if(domain==='climate'&&['up','down'].includes(action)&&(features&1)){const target=temperatureRequest(state,action==='up'?1:-1);return target===null?null:req('set_temperature',{temperature:target});}
 if(domain==='cover'&&['open','stop','close'].includes(action))return coverRequest(state,entity,action);
 if(action==='toggle'&&['light','switch','input_boolean','fan'].includes(domain)&&['on','off'].includes(state.state)){
  const turnOn=state.state==='off';if(domain==='fan'&&!(features&(turnOn?32:16)))return null;
  return req(turnOn?'turn_on':'turn_off');
 }
 if(action==='level'&&finite(value)&&Number(value)>=0&&Number(value)<=100){
  if(domain==='light'&&Array.isArray(a.supported_color_modes)&&a.supported_color_modes.some(m=>!['onoff','unknown'].includes(m)))return req('turn_on',{brightness_pct:Number(value)});
  if(domain==='fan'&&(features&1))return req('set_percentage',{percentage:Number(value)});
  if(domain==='cover'&&(features&4))return req('set_cover_position',{position:Number(value)});
 }
 if(['number','input_number'].includes(domain)&&['up','down'].includes(action)&&finite(state.state)&&finite(a.step)&&Number(a.step)>0&&finite(a.min)&&finite(a.max)){
  const n=Number((Number(state.state)+(action==='up'?1:-1)*Number(a.step)).toFixed(8));
  return n>=Number(a.min)&&n<=Number(a.max)?req('set_value',{value:n}):null;
 }
 return null;
}
function dayKey(value,timeZone='UTC'){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const get=t=>p.find(x=>x.type===t)?.value;return `${get('year')}-${get('month')}-${get('day')}`;
}
const ordinal=k=>Date.parse(k+'T12:00:00Z')/86400000;
const addDays=(k,n)=>new Date((ordinal(k)+n)*86400000).toISOString().slice(0,10);
function isoDay(value,timeZone){
 if(typeof value!=='string')return null;
 const match=/^(\d{4}-\d{2}-\d{2})$/.exec(value);
 if(match){const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:null;}
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/.test(value)||!Number.isFinite(Date.parse(value))||!isoDay(value.slice(0,10),timeZone))return null;
 return dayKey(Date.parse(value),timeZone);
}
function wasteRows(entries,states={},calendars={},options={}){
 let timeZone=options.timeZone||'UTC';try{dayKey(options.now??Date.now(),timeZone);}catch{timeZone='UTC';}
 const now=options.now??Date.now(),locale=options.locale||'en',nl=isNL(locale),today=dayKey(now,timeZone),rows=[];
 const row=(entry,state,date,status,name)=>{
  const days=date?Math.round(ordinal(date)-ordinal(today)):Infinity;
  const label=!date?({unavailable:nl?'Niet beschikbaar':'Unavailable',invalid:nl?'Geen geldige ophaaldatum':'No valid collection date',past:nl?'Ophaaldatum verstreken':'Collection date passed',empty:nl?'Geen inzameling in 60 dagen':'No collection within 60 days',error:nl?'Kalender kon niet laden':'Calendar could not load',loading:nl?'Kalender laden…':'Loading calendar…'}[status]):days===0?(nl?'Vandaag':'Today'):days===1?(nl?'Morgen':'Tomorrow'):new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',timeZone:'UTC',...(date.slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{})}).format(new Date(date+'T12:00:00Z'));
  rows.push({...entry,name:entry.name||name||state?.attributes?.friendly_name||entry.entity,date,days,label,status:status||'ready',color:safeColor(entry.color),icon:entry.icon||state?.attributes?.icon||'mdi:trash-can-outline'});
 };
 for(const raw of entries){
  const e=normalizeItem(raw),s=states[e.entity];
  if(!available(s)){row(e,s,null,'unavailable');continue;}
  if(e.entity?.startsWith('calendar.')){
   const cache=calendars[e.entity];if(!cache||cache.error){row(e,s,null,cache?.error?'error':'loading');continue;}
   const events=(cache.events||[]).filter(ev=>!e.filter||String(ev.summary||'').toLocaleLowerCase().includes(String(e.filter).toLocaleLowerCase()));let found=false;
   for(const ev of events){const date=isoDay(ev.start?.date||ev.start?.dateTime||ev.start,timeZone);if(!date||date<today)continue;row(e,s,date,null,ev.summary);found=true;}
   if(!found)row(e,s,null,'empty');continue;
  }
  const a=s.attributes||{},source=e.source||'auto';let value=e.attribute?a[e.attribute]:s.state,date=null;
  const usesDays=source==='days'||(source==='auto'&&!e.attribute&&finite(a.daysTo));
  if(usesDays){if(source==='auto')value=a.daysTo;const n=Number(value);if(finite(value)&&String(value).trim()!==''&&Number.isInteger(n)&&Math.abs(n)<36600){let origin=today;if(s.last_updated&&Number.isFinite(Date.parse(s.last_updated)))origin=dayKey(s.last_updated,timeZone);date=addDays(origin,n);}}
  else date=isoDay(value,timeZone);
  if(date&&date<today){row(e,s,null,'past');continue;}row(e,s,date,date?null:'invalid');
 }
 return rows.sort((a,b)=>a.days-b.days||a.name.localeCompare(b.name,locale));
}
function groupWaste(rows){const groups=[];for(const row of rows){if(!row.date)continue;let g=groups.find(g=>g.date===row.date);if(!g){g={date:row.date,label:row.label,days:row.days,items:[]};groups.push(g);}if(!g.items.some(e=>e.entity===row.entity&&e.name===row.name))g.items.push(row);}return groups;}


const TYPES={actions:'eleven-actions-card',controls:'eleven-controls-card',waste:'eleven-waste-card'};
const TITLES={actions:['Scènes en acties','Scenes & actions'],controls:['Bediening','Controls'],waste:['Afvalinzameling','Waste collection']};
const DOMAINS={actions:['scene','script'],controls:['climate','cover','light','fan','switch','input_boolean','number','input_number'],waste:['sensor','calendar']};
const GLYPHS={climate:'mdi:thermostat',cover:'mdi:blinds-horizontal',light:'mdi:lightbulb-outline',fan:'mdi:fan',switch:'mdi:power-socket-eu',input_boolean:'mdi:toggle-switch-outline',number:'mdi:tune',input_number:'mdi:tune'};
const STYLES=`${CSS}
:host{height:auto;container-type:inline-size}.content{padding:16px}.heading{margin-bottom:12px}.heading h2{overflow-wrap:anywhere}.empty{padding:8px 0;color:var(--secondary-text-color);font-size:13px}.device{padding:12px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.device+.device{border-top:1px solid var(--divider-color)}.device:first-child{padding-top:0}.device:last-child{padding-bottom:0}.device .identity{flex:1 1 84px}.device .identity span{font-size:14px}.device .identity small{font-size:12px}.device .identity ha-icon{color:var(--primary-color)}.device-controls{display:flex;align-items:center;gap:4px;max-width:100%;margin-left:auto}.device-controls button{padding:8px;flex:none}.device-controls .target{font-size:15px;min-width:42px}.device-controls .toggle{font-size:12px;padding:8px 14px}.device-controls .toggle.on{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color))}.level{flex:1 0 100%;display:flex;align-items:center;gap:10px}.level input{flex:1;min-width:0;min-height:44px;accent-color:var(--primary-color);cursor:pointer}.level output{font-size:12px;font-variant-numeric:tabular-nums;min-width:34px;text-align:right}.device .current{font-size:22px;font-weight:550;font-variant-numeric:tabular-nums;line-height:1.3}.device .current small{display:inline;font-size:13px}.upcoming{padding:2px 0 14px}.eyebrow{text-transform:uppercase;letter-spacing:.06em;font-size:10px;font-weight:650;color:var(--secondary-text-color);margin-bottom:4px}.pickup-date{font-size:24px;font-weight:600;letter-spacing:-.025em;line-height:1.25;overflow-wrap:anywhere}.pickup-meta{font-size:12px;color:var(--secondary-text-color);margin-top:3px}.waste-items{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:12px}.waste-item{display:flex;gap:7px;align-items:center;min-height:44px;padding:0;background:transparent;text-align:left;min-width:0;max-width:100%;font-size:14px}.waste-item span{overflow-wrap:anywhere}.waste-item ha-icon{color:var(--waste-color,var(--primary-color))}.pickup-row{padding:11px 0;border-top:1px solid var(--divider-color);display:flex;gap:8px;align-items:center}.pickup-row .waste-items{flex:1;margin:0;gap:0 14px}.pickup-row .when{font-size:12px;color:var(--secondary-text-color);text-align:right;max-width:42%}.unresolved{border-top:1px solid var(--divider-color);padding-top:10px;font-size:12px;color:var(--secondary-text-color)}.unresolved button{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;background:transparent;width:100%;padding:5px 0;font-size:12px}.unresolved button span:last-child{text-align:right}.retry{font-size:12px;padding:6px 12px;margin-top:8px}.collection-error{color:var(--error-color)}.actions{grid-template-columns:repeat(2,minmax(0,1fr))}.action:nth-child(n+4){background:var(--secondary-background-color);border:0}.action{min-height:84px}.action span{max-width:100%;overflow-wrap:break-word;hyphens:none}.action .split-label small{font-size:11px}@container(min-width:340px){.actions{grid-template-columns:repeat(3,minmax(0,1fr))}}@container(max-width:339px){.device:has(.target) .identity{flex-basis:100%}}@media(max-width:380px){.content{padding:12px}.device{gap:8px}.pickup-date{font-size:22px}}
`;
class StandaloneCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._cache={};this._generation=0;this._message='';this._pending=false;}
 get kind(){return this.constructor.kind;}
 static getConfigElement(){const e=document.createElement('eleven-controls-editor');e.kind=this.kind;return e;}
 static getStubConfig(){return {type:'custom:'+TYPES[this.kind],title:TITLES[this.kind][1],...(this.kind==='waste'?{}:{confirmation:false}),[this.kind==='actions'?'actions':'entities']:[]};}
 setConfig(config){
  const key=this.kind==='actions'?'actions':'entities';if(config[key]!==undefined&&!Array.isArray(config[key]))throw Error(`${key}: expected a list`);
  const c=structuredClone(config);c[key]=(c[key]||[]).map(normalizeItem);for(const e of c[key]){if(e.entity&&(!/^[a-z_]+\.[a-z0-9_]+$/.test(e.entity)||!DOMAINS[this.kind].includes(e.entity.split('.')[0])))throw Error('Unsupported entity: '+e.entity);}
  this._config=c;this._generation++;this._fetching=false;this._cache={};this._lastFetch=0;this._fingerprint=null;this._message='';this._render();this._refresh();
 }
 set hass(h){this._hass=h;this._render();this._refresh();}get hass(){return this._hass;}
 connectedCallback(){this._render();this._refresh();if(this.kind==='waste'&&!this._timer)this._timer=setInterval(()=>{this._render();this._refresh();},30000);}
 disconnectedCallback(){clearInterval(this._timer);this._timer=null;this._generation++;this._fetching=false;this._lastFetch=0;}
 getCardSize(){return Math.max(2,(this._config?.entities?.length||this._config?.actions?.length||1)+1);}
 getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 get nl(){return isNL(this._hass?.locale?.language);}
 t(nl,en){return this.nl?nl:en;}
 state(id){return this._hass?.states?.[id];}
 name(e){return e.name||this.state(e.entity)?.attributes?.friendly_name||e.entity||this.t('Kies een entiteit','Choose an entity');}
 number(v){return finite(v)?new Intl.NumberFormat(this._hass?.locale?.language||'en',{maximumFractionDigits:2}).format(Number(v)):'—';}
 more(id){if(id)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));}
 button(i,action,label,ico,request){return `<button type="button" data-index="${i}" data-action="${action}" data-key="${i}-${action}" aria-label="${esc(label)}" title="${esc(label)}" ${!request||this._pending?'disabled':''}>${icon(ico)}</button>`;}
 async _refresh(force=false){
  if(this.kind!=='waste'||!this.isConnected||!this._hass?.callApi||!this._config||this._fetching||(!force&&this._lastFetch&&Date.now()-this._lastFetch<300000))return;
  const ids=[...new Set(this._config.entities.filter(e=>e.entity?.startsWith('calendar.')&&available(this.state(e.entity))).map(e=>e.entity))];if(!ids.length)return;
  const generation=this._generation;this._fetching=true;this._lastFetch=Date.now();const start=new Date();start.setUTCHours(0,0,0,0);start.setUTCDate(start.getUTCDate()-1);const end=new Date(start.getTime()+62*86400000);
  await Promise.all(ids.map(async id=>{try{const events=await this._hass.callApi('GET',`calendars/${encodeURIComponent(id)}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);if(!Array.isArray(events))throw Error('Invalid calendar response');if(generation===this._generation)this._cache[id]={events};}catch{if(generation===this._generation)this._cache[id]={error:true};}}));
  if(generation===this._generation){this._fetching=false;this._render();}
 }
 _render(){
  if(!this._config)return;const c=this._config,items=c[this.kind==='actions'?'actions':'entities'];
  const fp=JSON.stringify([c,this._cache,this._message,this._error,this._pending,this._hass?.locale,this._hass?.config?.time_zone,this.kind==='waste'?Math.floor(Date.now()/30000):null,items.map(e=>this.state(e.entity))]);if(fp===this._fingerprint)return;this._fingerprint=fp;
  const active=this.shadowRoot.activeElement,focus=active?.dataset.key;
  let body=this.kind==='actions'?this._actions(items):this.kind==='controls'?this._controls(items):this._waste(items);
  if(!items.length)body=`<div class="empty">${this.t('Voeg onderdelen toe via de kaartinstellingen.','Add items in the card settings.')}</div>`;
  const title=c.title??TITLES[this.kind][this.nl?0:1];
  this.shadowRoot.innerHTML=`<style>${STYLES}${cardThemeStyles({controls:'.action,.device-controls button:not(.toggle.on)',selected:'.device-controls .toggle.on'})}</style><ha-card><div class="content">${title?`<div class="heading"><h2>${esc(title)}</h2></div>`:''}${body}<div class="feedback ${this._error?'error':''}" role="status" aria-live="polite">${esc(this._message)}</div></div></ha-card>`;
  this.shadowRoot.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>this.more(b.dataset.info)));
  this.shadowRoot.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>this.activate(Number(b.dataset.index),b.dataset.action)));
  this.shadowRoot.querySelectorAll('input[data-level]').forEach(b=>{b.addEventListener('input',()=>{b.nextElementSibling.value=b.value+'%';});b.addEventListener('change',()=>this.activate(Number(b.dataset.level),'level',Number(b.value)));});
  this.shadowRoot.querySelector('[data-retry]')?.addEventListener('click',()=>this._refresh(true));
  if(focus)this.shadowRoot.querySelector(`[data-key="${CSSescape(focus)}"]`)?.focus();
 }
 _actions(items){return `<div class="actions">${items.map((e,i)=>`<button type="button" class="action" data-index="${i}" data-action="run" data-key="${i}-run" aria-label="${esc(e.aria_label||this.name(e))}" ${!actionRequest(this.state(e.entity),e.entity)||this._pending?'disabled':''}>${icon(e.icon||'mdi:play-outline')}<span class="split-label">${esc(this.name(e))}${e.description?`<small>${esc(e.description)}</small>`:''}${!available(this.state(e.entity))?`<small>${this.t('Niet beschikbaar','Unavailable')}</small>`:''}</span></button>`).join('')}</div>`;}
 _controls(items){return items.map((e,i)=>{
  const s=this.state(e.entity),a=s?.attributes||{},domain=e.entity?.split('.')[0],ok=available(s),name=this.name(e);let controls='',status=!ok?this.t('Niet beschikbaar','Unavailable'):({on:this.t('Aan','On'),off:this.t('Uit','Off'),open:this.t('Open','Open'),closed:this.t('Dicht','Closed'),opening:this.t('Gaat open','Opening'),closing:this.t('Gaat dicht','Closing')}[s.state]||s.state),extra='';
  const request=(act,v)=>controlRequest(s,e.entity,act,v),btn=(act,label,ico)=>this.button(i,act,`${name}: ${label}`,ico,request(act));
  if(domain==='climate'){
   status=ok?`${this.number(a.current_temperature)} ${this._hass?.config?.unit_system?.temperature||'°C'} · ${a.hvac_action==='heating'?this.t('Verwarmen','Heating'):a.hvac_action==='cooling'?this.t('Koelen','Cooling'):this.t('Huidig','Current')}`:status;
   if(Number(a.supported_features)&1)controls=btn('down',this.t('Lager','Decrease'),'mdi:minus')+`<span class="target">${ok?this.number(a.temperature):'—'}<small>${this.t('ingesteld','target')}</small></span>`+btn('up',this.t('Hoger','Increase'),'mdi:plus');
  }else if(domain==='cover'){
   status=ok&&finite(a.current_position)?`${a.current_position}% · ${status}`:status;
   controls=btn('open',this.t('Openen','Open'),'mdi:arrow-up')+btn('stop',this.t('Stoppen','Stop'),'mdi:stop')+btn('close',this.t('Sluiten','Close'),'mdi:arrow-down');
  }else if(['number','input_number'].includes(domain)){
   status=ok?`${this.number(s.state)} ${a.unit_of_measurement||''}`:status;
   controls=btn('down',this.t('Lager','Decrease'),'mdi:minus')+btn('up',this.t('Hoger','Increase'),'mdi:plus');
  }else if(['light','fan','switch','input_boolean'].includes(domain)){
   controls=`<button class="toggle ${s?.state==='on'?'on':''}" type="button" data-index="${i}" data-action="toggle" data-key="${i}-toggle" aria-label="${esc(name+': '+this.t('Schakelen','Toggle'))}" aria-pressed="${s?.state==='on'}" ${!request('toggle')||this._pending?'disabled':''}>${s?.state==='on'?this.t('Uit','Off'):this.t('Aan','On')}</button>`;
  }
  const level=domain==='light'&&finite(a.brightness)?Math.round(Number(a.brightness)/255*100):domain==='fan'?a.percentage:domain==='cover'?a.current_position:null;
  if(domain!=='cover'&&request('level',50))extra=`<label class="level"><input type="range" min="0" max="100" step="${domain==='fan'&&finite(a.percentage_step)&&Number(a.percentage_step)>0?esc(a.percentage_step):1}" value="${finite(level)?esc(level):0}" data-key="${i}-level" data-level="${i}" aria-label="${esc(name+': '+this.t('Niveau','Level'))}" ${this._pending?'disabled':''}><output>${finite(level)?esc(level)+'%':'—'}</output></label>`;
  return `<div class="device"><button type="button" class="identity" data-info="${esc(e.entity)}" data-key="${i}-info">${icon(e.icon||GLYPHS[domain]||'mdi:tune')}<span>${esc(name)}<small>${esc(status)}</small></span></button><div class="device-controls">${controls}</div>${extra}</div>`;
 }).join('');}
 _waste(items){
  const rows=wasteRows(items,this._hass?.states,this._cache,{locale:this._hass?.locale?.language,timeZone:this._hass?.config?.time_zone}),groups=groupWaste(rows),first=groups[0],unresolved=rows.filter(e=>!e.date);
  const item=e=>`<button type="button" class="waste-item" data-info="${esc(e.entity)}" style="${e.color?'--waste-color:'+esc(e.color):''}">${icon(e.icon)}<span>${esc(e.name)}</span></button>`;
  const dateDetail=g=>new Intl.DateTimeFormat(this._hass?.locale?.language||'en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(g.date+'T12:00:00Z'));
  return `${first?`<section class="upcoming"><div class="eyebrow">${this.t('Volgende inzameling','Next collection')}</div><div class="pickup-date">${esc(first.label)}</div><div class="pickup-meta">${first.days<=1?esc(dateDetail(first)):this.t(`Over ${first.days} dagen`,`In ${first.days} days`)}</div><div class="waste-items">${first.items.map(item).join('')}</div></section>`:`<div class="empty">${this.t('Geen komende inzameling bekend.','No upcoming collection available.')}</div>`}${groups.slice(1).map(g=>`<div class="pickup-row"><div class="waste-items">${g.items.map(item).join('')}</div><span class="when">${esc(g.label)}</span></div>`).join('')}${unresolved.length?`<div class="unresolved">${unresolved.map(e=>`<button type="button" data-info="${esc(e.entity)}"><span>${esc(e.name)}</span><span class="${e.status==='error'?'collection-error':''}">${esc(e.label)}</span></button>`).join('')}${unresolved.some(e=>e.status==='error')?`<button type="button" class="retry" data-retry>${this.t('Opnieuw proberen','Retry')}</button>`:''}</div>`:''}`;
 }
 async activate(index,action,value){
  if(this._pending)return;const item=this._config[this.kind==='actions'?'actions':'entities'][index];if(!item)return;
  const request=this.kind==='actions'?actionRequest(this.state(item.entity),item.entity):controlRequest(this.state(item.entity),item.entity,action,value);if(!request||!this._hass?.callService)return;
  if(this._config.confirmation===true&&!window.confirm(item.confirmation||this.t(`${this.name(item)}: opdracht uitvoeren?`,`${this.name(item)}: execute command?`))){this._fingerprint=null;this._render();return;}
  this._pending=true;this._error=false;this._message=this.t('Bezig…','Sending…');this._render();
  try{await this._hass.callService(request.domain,request.service,request.data);this._message=this.t('Opdracht verstuurd','Command sent');}catch(e){this._error=true;this._message=this.t('Niet uitgevoerd: ','Not executed: ')+(e?.message||this.t('verbindingsfout','connection failed'));}finally{this._pending=false;this._render();}
 }
}
class ActionsCard extends StandaloneCard{static kind='actions';}
class ControlsCard extends StandaloneCard{static kind='controls';}
class WasteCard extends StandaloneCard{static kind='waste';}

class ControlsEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.kind='controls';}
 setConfig(config){this._config=structuredClone(config);this.kind=Object.keys(TYPES).find(k=>'custom:'+TYPES[k]===config.type)||this.kind;this.render();}
 set hass(h){this._hass=h;this.render();}get hass(){return this._hass;}
 get nl(){return isNL(this._hass?.locale?.language);}t(n,en){return this.nl?n:en;}
 emit(c){this._config=c;this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(c)},bubbles:true,composed:true}));}
 form(host,schema,data,onChange){const form=document.createElement('ha-form');form.hass=this._hass;form.schema=schema;form.data=data;form.computeLabel=s=>({title:this.t('Titel','Title'),confirmation:this.t('Bevestigen vóór bedienen','Confirm before commands'),entity:this.t('Entiteit','Entity'),name:this.t('Naam (optioneel)','Name (optional)'),icon:this.t('Icoon (optioneel)','Icon (optional)'),description:this.t('Onderschrift','Description'),source:this.t('Datumbron','Date source'),attribute:this.t('Attribuut (optioneel)','Attribute (optional)'),color:this.t('Kleur (optioneel)','Color (optional)'),filter:this.t('Kalender bevat (optioneel)','Calendar summary contains (optional)')}[s.name]||s.name);form.addEventListener('value-changed',ev=>{ev.stopPropagation();onChange(ev.detail.value);});host.append(form);}
 render(){
  if(!this._config)return;const focus=this.shadowRoot.activeElement; // Do not rebuild native HA selectors on ordinary hass updates.
  if(this._builtConfig===this._config){this.shadowRoot.querySelectorAll('ha-form').forEach(f=>{f.hass=this._hass;});return;}
  this._builtConfig=this._config;const key=this.kind==='actions'?'actions':'entities',items=(this._config[key]||[]).map(normalizeItem);
  this.shadowRoot.innerHTML=`<style>:host{display:block;color:var(--primary-text-color)}.item{padding:16px 0;border-top:1px solid var(--divider-color)}.bar{display:flex;align-items:center;gap:4px}.bar strong{flex:1;font-size:14px;overflow-wrap:anywhere}button{font:inherit;color:inherit;background:var(--secondary-background-color);border:0;border-radius:8px;min-width:44px;min-height:44px;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color)}button:disabled{opacity:.4;cursor:default}.add{padding:0 16px;margin-top:12px}p{font-size:12px;color:var(--secondary-text-color);line-height:1.5}ha-form{display:block}</style><div class="main"></div><p>${this.kind==='waste'?this.t('Gebruik een datumsensor, een aftelsensor of een kalender. Automatisch herkent ISO-datums en daysTo. Kalenderafspraken worden 60 dagen vooruit geladen.','Use a date sensor, day-count sensor or calendar. Auto recognizes ISO dates and daysTo. Calendar events are loaded 60 days ahead.'):this.kind==='controls'?this.t('Voeg alleen de apparaten toe die je hier wilt bedienen. De knoppen passen zich aan de mogelijkheden aan.','Add the devices you want to control. Controls follow each entity’s capabilities.'):this.t('Voeg scènes of scripts toe. Elke actie heeft een eigen naam en icoon.','Add scenes or scripts. Each action has its own name and icon.')}</p><div class="items"></div><button type="button" class="add">${this.t('Onderdeel toevoegen','Add item')}</button>`;
  this.form(this.shadowRoot.querySelector('.main'),[{name:'title',selector:{text:{}}},...(this.kind==='waste'?[]:[{name:'confirmation',selector:{boolean:{}}}])],this._config,v=>{this.emit({...this._config,...v});});
  items.forEach((e,i)=>{
   const box=document.createElement('section');box.className='item';box.innerHTML=`<div class="bar"><strong>${esc(e.name||e.entity||this.t('Nieuw onderdeel','New item'))}</strong><button type="button" data-move="-1" aria-label="${this.t('Omhoog','Move up')}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="1" aria-label="${this.t('Omlaag','Move down')}" ${i===items.length-1?'disabled':''}>↓</button><button type="button" data-remove aria-label="${this.t('Verwijderen','Remove')}">×</button></div><div class="fields"></div>`;
   const schema=[{name:'entity',required:true,selector:{entity:{domain:DOMAINS[this.kind]}}},{name:'name',selector:{text:{}}},{name:'icon',selector:{icon:{}}}];
   if(this.kind==='actions')schema.push({name:'description',selector:{text:{}}});
   if(this.kind==='waste')schema.push({name:'source',selector:{select:{options:[{value:'auto',label:this.t('Automatisch','Auto')},{value:'date',label:this.t('Datum','Date')},{value:'days',label:this.t('Aantal dagen','Day count')}]}}},{name:'attribute',selector:{text:{}}},{name:'color',selector:{color_rgb:{}}},{name:'filter',selector:{text:{}}});
   this.form(box.querySelector('.fields'),schema,{...e,...(this.kind==='waste'?{source:e.source||'auto',color:Array.isArray(e.color)?e.color:/^#[\da-f]{6}$/i.test(e.color||'')?[1,3,5].map(n=>parseInt(e.color.slice(n,n+2),16)):undefined}:{})},v=>{const next=(this._config[key]||[]).map(normalizeItem);next[i]={...next[i],...v};this.emit({...this._config,[key]:next});});
   box.querySelector('[data-remove]').onclick=()=>{const next=(this._config[key]||[]).filter((_,n)=>n!==i);this.emit({...this._config,[key]:next});this.render();};
   box.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const next=[...this._config[key]],j=i+Number(b.dataset.move);[next[i],next[j]]=[next[j],next[i]];this.emit({...this._config,[key]:next});this.render();});
   this.shadowRoot.querySelector('.items').append(box);
  });
  this.shadowRoot.querySelector('.add').onclick=()=>{this.emit({...this._config,[key]:[...(this._config[key]||[]),{entity:''}]});this.render();};
 }
}
for(const [tag,cls] of [['eleven-controls-editor',ControlsEditor],[TYPES.actions,ActionsCard],[TYPES.controls,ControlsCard],[TYPES.waste,WasteCard]])if(!customElements.get(tag))customElements.define(tag,cls);
// Home Assistant retains this array by reference: never replace it.
window.customCards=window.customCards||[];
// Clean stale picker metadata only; the retired element and mode editor are not implemented.
for(let i=window.customCards.length-1;i>=0;i--)if(window.customCards[i].type==='eleven-home-controls-card')window.customCards.splice(i,1);
for(const kind of Object.keys(TYPES))if(!window.customCards.some(c=>c.type===TYPES[kind]))window.customCards.push({type:TYPES[kind],name:'Eleven '+TITLES[kind][1],description:{actions:'Scenes and script buttons',controls:'Configurable device controls',waste:'Upcoming waste collection from sensors and calendars'}[kind],preview:true});

})();
