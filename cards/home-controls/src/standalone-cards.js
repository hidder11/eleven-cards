import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiSlider,syncUISlider,uiBarStyles} from '../../../shared/ui-bar.js';
import {available,finite,actionRequest} from './control-utils.mjs';
import {esc,icon,CSS,CSSescape} from './shared-ui.js';
import {normalizeItem,isNL,safeColor,controlRequest,wasteRows,groupWaste,dayKey} from './standalone-utils.mjs';

const TYPES={actions:'eleven-actions-card',controls:'eleven-controls-card',waste:'eleven-waste-card'};
const TITLES={actions:['Scènes en acties','Scenes & actions'],controls:['Bediening','Controls'],waste:['Afvalinzameling','Waste collection']};
const DOMAINS={actions:['scene','script'],controls:['climate','cover','light','fan','switch','input_boolean','number','input_number'],waste:['sensor','calendar']};
const GLYPHS={climate:'mdi:thermostat',cover:'mdi:blinds-horizontal',light:'mdi:lightbulb-outline',fan:'mdi:fan',switch:'mdi:power-socket-eu',input_boolean:'mdi:toggle-switch-outline',number:'mdi:tune',input_number:'mdi:tune'};
const STYLES=`${CSS}
.heading h2{font-size:16px;font-weight:600;line-height:1.3}
:host{height:auto;container-type:inline-size}.content{padding:16px}.heading{margin-bottom:12px}.heading h2{overflow-wrap:anywhere}.empty{padding:8px 0;color:var(--secondary-text-color);font-size:13px}.device{padding:12px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.device+.device{border-top:1px solid var(--divider-color)}.device:first-child{padding-top:0}.device:last-child{padding-bottom:0}.device .identity{flex:1 1 84px}.device .identity span{font-size:14px}.device .identity small{font-size:12px}.device .identity ha-icon{color:var(--primary-color)}.device-controls{display:flex;align-items:center;gap:4px;max-width:100%;margin-left:auto}.device-controls button{padding:8px;flex:none}.device-controls .target{font-size:15px;min-width:42px}.device-controls .toggle{font-size:12px;padding:8px 14px}.device-controls .toggle.on{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color))}.level{flex:1 0 100%;display:flex;align-items:center;gap:10px}.level input{flex:1;min-width:0;min-height:44px;accent-color:var(--primary-color);cursor:pointer}.level output{font-size:12px;font-variant-numeric:tabular-nums;min-width:34px;text-align:right}.device .current{font-size:22px;font-weight:550;font-variant-numeric:tabular-nums;line-height:1.3}.device .current small{display:inline;font-size:13px}.upcoming{padding:2px 0 14px}.eyebrow{text-transform:uppercase;letter-spacing:.06em;font-size:10px;font-weight:650;color:var(--secondary-text-color);margin-bottom:4px}.pickup-date{font-size:24px;font-weight:600;letter-spacing:-.025em;line-height:1.25;overflow-wrap:anywhere}.pickup-meta{font-size:12px;color:var(--secondary-text-color);margin-top:3px}.waste-items{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:12px}.waste-item{display:flex;gap:7px;align-items:center;min-height:44px;padding:0;background:transparent;text-align:left;min-width:0;max-width:100%;font-size:14px}.waste-item span{overflow-wrap:anywhere}.waste-item ha-icon{color:var(--waste-color,var(--primary-color))}.pickup-row{padding:11px 0;border-top:1px solid var(--divider-color);display:flex;gap:8px;align-items:center}.pickup-row .waste-items{flex:1;margin:0;gap:0 14px}.pickup-row .when{font-size:12px;color:var(--secondary-text-color);text-align:right;max-width:42%}.unresolved{border-top:1px solid var(--divider-color);padding-top:10px;font-size:12px;color:var(--secondary-text-color)}.unresolved button{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;background:transparent;width:100%;padding:5px 0;font-size:12px}.unresolved button span:last-child{text-align:right}.retry{font-size:12px;padding:6px 12px;margin-top:8px}.collection-error{color:var(--error-color)}.actions{grid-template-columns:repeat(2,minmax(0,1fr))}.action:nth-child(n+4){background:var(--secondary-background-color);border:0}.action{min-height:84px}.action span{max-width:100%;overflow-wrap:break-word;hyphens:none}.action .split-label small{font-size:11px}@container(min-width:340px){.actions{grid-template-columns:repeat(3,minmax(0,1fr))}}@container(max-width:339px){.device:has(.target) .identity{flex-basis:100%}}@media(max-width:380px){.content{padding:var(--eleven-card-padding,16px)}.device{gap:8px}.pickup-date{font-size:22px}}
`;
// Actions-only layout: shared Controls/Waste styles and behavior remain unchanged.
const ACTION_STYLES=`
.heading{margin-bottom:16px}.heading h2{font-size:16px;font-weight:600;line-height:1.4;letter-spacing:normal;overflow-wrap:break-word}
.actions{grid-template-columns:repeat(var(--actions-columns,3),minmax(0,1fr));gap:8px}
.actions .action{background:var(--eleven-material-control-background,var(--secondary-background-color,transparent))}
.action{flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;padding:10px;min-height:80px;font-size:13px;font-weight:550;line-height:1.4;text-align:center;overflow-wrap:anywhere}
.action ha-icon{--mdc-icon-size:32px;width:32px;height:32px;color:var(--secondary-text-color)}.action .split-label{min-width:0;width:100%;font-size:inherit;line-height:1.4}.action .split-label small{font-size:.923076923em;line-height:1.5;margin-top:4px}
.action:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}.feedback{margin-top:12px;line-height:1.5}
`;
class StandaloneCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._cache={};this._generation=0;this._message='';this._pending=false;}
 get kind(){return this.constructor.kind;}
 static getConfigElement(){const e=document.createElement('eleven-controls-editor');e.kind=this.kind;return e;}
 static getStubConfig(){return {type:'custom:'+TYPES[this.kind],title:TITLES[this.kind][1],...(this.kind==='waste'?{}:{confirmation:false}),[this.kind==='actions'?'actions':'entities']:[]};}
 setConfig(config){
  if(this.kind==='actions'&&config.columns!==undefined&&(!Number.isInteger(config.columns)||config.columns<1||config.columns>6))throw Error('columns: expected an integer from 1 to 6');
  const key=this.kind==='actions'?'actions':'entities';if(config[key]!==undefined&&!Array.isArray(config[key]))throw Error(`${key}: expected a list`);
  const c=structuredClone(config);c[key]=(c[key]||[]).map(normalizeItem);for(const e of c[key]){if(e.entity&&(!/^[a-z_]+\.[a-z0-9_]+$/.test(e.entity)||!DOMAINS[this.kind].includes(e.entity.split('.')[0])))throw Error('Unsupported entity: '+e.entity);}
  this._config=c;this._generation++;this._fetching=false;this._cache={};this._lastFetch=0;this._fingerprint=null;this._message='';this._render();this._refresh();
 }
 set hass(h){this._hass=h;this._render();this._refresh();}get hass(){return this._hass;}
 connectedCallback(){if(this.kind==='actions')this._fingerprint=null;this._render();this._refresh();if(this.kind==='waste'&&!this._timer)this._timer=setInterval(()=>{this._render();this._refresh();},30000);}
 disconnectedCallback(){clearInterval(this._timer);this._timer=null;this._generation++;this._fetching=false;this._lastFetch=0;this._actionsResize?.disconnect();}
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
  this.shadowRoot.innerHTML=`<style>${STYLES}${uiBarStyles()}${cardThemeStyles({controls:'.action,.device-controls button:not(.toggle.on)',selected:'.device-controls .toggle.on'})}${this.kind==='actions'?ACTION_STYLES:''}</style><ha-card><div class="content">${title?`<div class="heading"><h2>${esc(title)}</h2></div>`:''}${body}<div class="feedback ${this._error?'error':''}" role="status" aria-live="polite">${esc(this._message)}</div></div></ha-card>`;
  this.shadowRoot.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>this.more(b.dataset.info)));
  this.shadowRoot.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>this.activate(Number(b.dataset.index),b.dataset.action)));
  this.shadowRoot.querySelectorAll('input[data-level]').forEach(b=>{b.addEventListener('input',()=>{syncUISlider(b);b.nextElementSibling.value=b.value+'%';});b.addEventListener('change',()=>this.activate(Number(b.dataset.level),'level',Number(b.value)));});
  this.shadowRoot.querySelector('[data-retry]')?.addEventListener('click',()=>this._refresh(true));
  if(focus)this.shadowRoot.querySelector(`[data-key="${CSSescape(focus)}"]`)?.focus();
  if(this.kind==='actions'&&typeof ResizeObserver==='function'){
   this._actionsResize??=new ResizeObserver(()=>this._fitActions());this._actionsResize.disconnect();
   this._fitActions();this._actionsResize.observe(this);
   this.shadowRoot.querySelectorAll('.split-label,.split-label small').forEach(e=>this._actionsResize.observe(e));
  }
 }
 _fitActions(){
  const grid=this.shadowRoot.querySelector('.actions');if(!grid)return;
  // Vertical chrome excludes the icon: labels use the full inner width.
  // Configured columns are a maximum; retain empty cells for short/single lists.
  const ctx=document.createElement('canvas').getContext('2d');let minimum=44;
  grid.querySelectorAll('.action').forEach(button=>{
   const bs=getComputedStyle(button),icon=button.querySelector('ha-icon');
   const chrome=parseFloat(bs.paddingLeft)+parseFloat(bs.paddingRight)+parseFloat(bs.borderLeftWidth)+parseFloat(bs.borderRightWidth);
   minimum=Math.max(minimum,chrome+parseFloat(getComputedStyle(icon).width));
   button.querySelectorAll('.split-label,.split-label small').forEach(label=>{
    const s=getComputedStyle(label);ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const text=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ');
    for(const word of text.split(/\s+/).filter(Boolean))minimum=Math.max(minimum,chrome+ctx.measureText(word).width+(parseFloat(s.letterSpacing)||0)*word.length+2);
   });
  });
  const gap=parseFloat(getComputedStyle(grid).columnGap)||0;
  const columns=Math.max(1,Math.min(this._config.columns??3,Math.floor((grid.clientWidth+gap)/(Math.ceil(minimum)+gap))));
  const value=String(columns);if(grid.style.getPropertyValue('--actions-columns')!==value)grid.style.setProperty('--actions-columns',value);
 }
 _actions(items){return `<div class="actions" aria-busy="${this._pending}">${items.map((e,i)=>`<button type="button" class="action" data-index="${i}" data-action="run" data-key="${i}-run" aria-label="${esc(e.aria_label||this.name(e))}" ${!actionRequest(this.state(e.entity),e.entity)||this._pending?'disabled':''}>${icon(e.icon||'mdi:play-outline')}<span class="split-label">${esc(this.name(e))}${e.description?`<small>${esc(e.description)}</small>`:''}${!available(this.state(e.entity))?`<small>${this.t('Niet beschikbaar','Unavailable')}</small>`:''}</span></button>`).join('')}</div>`;}
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
  if(domain!=='cover'&&request('level',50))extra=`<label class="level">${uiSlider({value:finite(level)?Number(level):0,step:domain==='fan'&&finite(a.percentage_step)&&Number(a.percentage_step)>0?Number(a.percentage_step):1,disabled:this._pending,attrs:{'data-key':`${i}-level`,'data-level':String(i),'aria-label':name+': '+this.t('Niveau','Level')}})}<output>${finite(level)?esc(level)+'%':'—'}</output></label>`;
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
  const actionFocus=this.kind==='actions'?this.shadowRoot.activeElement?.dataset.key:null;
  this._pending=true;this._error=false;this._message=this.kind==='actions'?'':this.t('Bezig…','Sending…');this._render();
  try{await this._hass.callService(request.domain,request.service,request.data);this._message=this.kind==='actions'?'':this.t('Opdracht verstuurd','Command sent');}catch(e){this._error=true;this._message=this.t('Niet uitgevoerd: ','Not executed: ')+(e?.message||this.t('verbindingsfout','connection failed'));}finally{this._pending=false;this._render();
   // Disabled native action buttons lose focus. Restore only if focus was not moved elsewhere.
   if(actionFocus&&(document.activeElement===document.body||document.activeElement===this))this.shadowRoot.querySelector(`[data-key="${CSSescape(actionFocus)}"]`)?.focus();
  }
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
 form(host,schema,data,onChange){const form=document.createElement('ha-form');form.hass=this._hass;form.schema=schema;form.data=data;form.computeLabel=s=>({title:this.t('Titel','Title'),confirmation:this.t('Bevestigen vóór bedienen','Confirm before commands'),columns:this.t('Maximum aantal kolommen','Maximum columns'),entity:this.t('Entiteit','Entity'),name:this.t('Naam (optioneel)','Name (optional)'),icon:this.t('Icoon (optioneel)','Icon (optional)'),description:this.t('Onderschrift','Description'),source:this.t('Datumbron','Date source'),attribute:this.t('Attribuut (optioneel)','Attribute (optional)'),color:this.t('Kleur (optioneel)','Color (optional)'),filter:this.t('Kalender bevat (optioneel)','Calendar summary contains (optional)')}[s.name]||s.name);form.addEventListener('value-changed',ev=>{ev.stopPropagation();onChange(ev.detail.value);});host.append(form);}
 render(){
  if(!this._config)return;const focus=this.shadowRoot.activeElement; // Do not rebuild native HA selectors on ordinary hass updates.
  if(this._builtConfig===this._config){this.shadowRoot.querySelectorAll('ha-form').forEach(f=>{f.hass=this._hass;});return;}
  this._builtConfig=this._config;const key=this.kind==='actions'?'actions':'entities',items=(this._config[key]||[]).map(normalizeItem);
  this.shadowRoot.innerHTML=`<style>:host{display:block;color:var(--primary-text-color)}.item{padding:16px 0;border-top:1px solid var(--divider-color)}.bar{display:flex;align-items:center;gap:4px}.bar strong{flex:1;font-size:14px;overflow-wrap:anywhere}button{font:inherit;color:inherit;background:var(--secondary-background-color);border:0;border-radius:8px;min-width:44px;min-height:44px;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color)}button:disabled{opacity:.4;cursor:default}.add{padding:0 16px;margin-top:12px}p{font-size:12px;color:var(--secondary-text-color);line-height:1.5}ha-form{display:block}</style><div class="main"></div><p>${this.kind==='waste'?this.t('Gebruik een datumsensor, een aftelsensor of een kalender. Automatisch herkent ISO-datums en daysTo. Kalenderafspraken worden 60 dagen vooruit geladen.','Use a date sensor, day-count sensor or calendar. Auto recognizes ISO dates and daysTo. Calendar events are loaded 60 days ahead.'):this.kind==='controls'?this.t('Voeg alleen de apparaten toe die je hier wilt bedienen. De knoppen passen zich aan de mogelijkheden aan.','Add the devices you want to control. Controls follow each entity’s capabilities.'):this.t('Voeg scènes of scripts toe. Elke actie heeft een eigen naam en icoon.','Add scenes or scripts. Each action has its own name and icon.')}</p><div class="items"></div><button type="button" class="add">${this.t('Onderdeel toevoegen','Add item')}</button>`;
  this.form(this.shadowRoot.querySelector('.main'),[{name:'title',selector:{text:{}}},...(this.kind==='waste'?[]:[{name:'confirmation',selector:{boolean:{}}}]),...(this.kind==='actions'?[{name:'columns',selector:{number:{min:1,max:6,step:1,mode:'box'}}}]:[])],this.kind==='actions'?{...this._config,columns:this._config.columns??3}:this._config,v=>{this.emit({...this._config,...v});});
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
