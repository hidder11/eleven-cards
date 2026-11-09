import {withCardBackground} from '../../../shared/card-background.js';
import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiButton} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
import {uiSlider,syncUISlider,uiBarStyles} from '../../../shared/ui-bar.js';
import {available,finite,actionRequest} from './control-utils.mjs';
import {esc,icon,CSS,CSSescape} from './shared-ui.js';
import {normalizeItem,isNL,safeColor,controlRequest,wasteRows,groupWaste,dayKey} from './standalone-utils.mjs';

const TYPES={actions:'eleven-actions-card',controls:'eleven-controls-card',waste:'eleven-waste-card'};
const TITLES={actions:['Control Pad','Control Pad'],controls:['Bediening','Controls'],waste:['Afvalinzameling','Waste collection']};
const DOMAINS={actions:['scene','script'],controls:['climate','cover','light','fan','switch','input_boolean','number','input_number'],waste:['sensor','calendar']};
const GLYPHS={climate:'mdi:thermostat',cover:'mdi:blinds-horizontal',light:'mdi:lightbulb-outline',fan:'mdi:fan',switch:'mdi:power-socket-eu',input_boolean:'mdi:toggle-switch-outline',number:'mdi:tune',input_number:'mdi:tune'};
const STYLES=`${CSS}
.heading h2{font-size:16px;font-weight:600;line-height:1.3}
:host{height:auto;container-type:inline-size}.content{padding:16px}.heading{margin-bottom:12px}.heading h2{overflow-wrap:anywhere}.empty{padding:8px 0;color:var(--secondary-text-color);font-size:13px}.device{padding:12px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.device+.device{border-top:1px solid var(--divider-color)}.device:first-child{padding-top:0}.device:last-child{padding-bottom:0}.device .identity{flex:1 1 84px}.device .identity span{font-size:14px}.device .identity small{font-size:12px}.device .identity ha-icon{color:var(--primary-color)}.device-controls{display:flex;align-items:center;gap:4px;max-width:100%;margin-left:auto}.device-controls .target{font-size:15px;min-width:42px}.level{flex:1 0 100%;display:flex;align-items:center;gap:10px}.level input{flex:1;min-width:0;min-height:44px;accent-color:var(--primary-color);cursor:pointer}.level output{font-size:12px;font-variant-numeric:tabular-nums;min-width:34px;text-align:right}.device .current{font-size:22px;font-weight:550;font-variant-numeric:tabular-nums;line-height:1.3}.device .current small{display:inline;font-size:13px}.upcoming{padding:2px 0 14px}.eyebrow{text-transform:uppercase;letter-spacing:.06em;font-size:10px;font-weight:650;color:var(--secondary-text-color);margin-bottom:4px}.pickup-date{font-size:24px;font-weight:600;letter-spacing:-.025em;line-height:1.25;overflow-wrap:anywhere}.pickup-meta{font-size:12px;color:var(--secondary-text-color);margin-top:3px}.waste-items{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:12px}.waste-item{display:flex;gap:7px;align-items:center;min-height:44px;padding:0;background:transparent;text-align:left;min-width:0;max-width:100%;font-size:14px}.waste-item span{overflow-wrap:anywhere}.waste-item ha-icon{color:var(--waste-color,var(--primary-color))}.pickup-row{padding:11px 0;border-top:1px solid var(--divider-color);display:flex;gap:8px;align-items:center}.pickup-row .waste-items{flex:1;margin:0;gap:0 14px}.pickup-row .when{font-size:12px;color:var(--secondary-text-color);text-align:right;max-width:42%}.unresolved{border-top:1px solid var(--divider-color);padding-top:10px;font-size:12px;color:var(--secondary-text-color)}.unresolved button[data-info]{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;background:transparent;width:100%;padding:5px 0;font-size:12px}.unresolved button[data-info] span:last-child{text-align:right}.retry{margin-top:8px}.collection-error{color:var(--error-color)}.actions{grid-template-columns:repeat(2,minmax(0,1fr))}.action span{max-width:100%;overflow-wrap:break-word;hyphens:none}@container(min-width:340px){.actions{grid-template-columns:repeat(3,minmax(0,1fr))}}@container(max-width:339px){.device:has(.target) .identity{flex-basis:100%}}@media(max-width:380px){.content{padding:var(--eleven-card-padding,16px)}.device{gap:8px}.pickup-date{font-size:22px}}
`;
// Controls-only geometry and semantic roles; theme owns optional paint/depth.
const CONTROLS_STYLES=`
.content{padding-bottom:8px}
.heading{margin-bottom:16px}.heading h2{min-width:0;letter-spacing:normal;hyphens:auto;overflow-wrap:break-word}
.devices{display:grid;grid-auto-rows:1fr}
.devices .device{display:grid;grid-template-columns:minmax(0,1fr) minmax(158px,1.4fr);gap:10px;align-items:center;min-height:64px;box-sizing:border-box;padding:10px 0}
.device .identity{min-width:0;max-width:100%;min-height:44px;gap:9px;background:transparent;box-shadow:none;border-radius:0}
.device .identity:hover:not(:disabled){background:transparent}
.device .identity ha-icon{color:var(--secondary-text-color)}
.device .identity span{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.4}
.device .identity small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.5}
.device-controls{width:calc(100% + 12px);max-width:none;box-sizing:border-box;padding:6px;margin:-6px;min-width:0;gap:8px;flex-wrap:nowrap;justify-content:safe flex-end;overflow-x:auto;scrollbar-width:thin}
.device-controls .toggle{flex:none}
.device-controls .target{flex:none;white-space:nowrap;font-size:15px;min-width:54px;line-height:1.4}
.device-controls .target small{font-size:12px;line-height:1.5}




.device .identity:focus-visible,.level input:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:3px}
.device-controls input:focus-visible{outline-offset:-2px}
.level{box-sizing:border-box;flex:1 1 auto;min-width:86px;gap:8px;padding:0;margin:0}
.level input{flex:0 1 276px;width:0;min-width:44px}
.level input::-webkit-slider-runnable-track{height:8px;box-shadow:var(--eleven-material-well,none)}
.level input::-webkit-slider-thumb{margin-top:-5px}
.level input::-moz-range-track{height:8px;box-shadow:var(--eleven-material-well,none)}
.level input::-moz-range-progress{height:8px}
.level output{flex:none;line-height:1.5}
`;
// Calendar anatomy is Waste-only; concurrent Actions/Controls output is retained.
const WASTE_STYLES=`
.content{padding:16px}.heading{margin-bottom:12px}
.heading h2{hyphens:auto;overflow-wrap:break-word}
.waste-strip{display:grid;grid-template-columns:repeat(var(--waste-columns,3),minmax(0,1fr));padding:4px;background:var(--secondary-background-color,transparent)}
.pickup{display:grid;grid-template-rows:subgrid;grid-row:span 5;justify-items:center;align-items:center;row-gap:4px;min-width:44px;min-height:44px;padding:8px 4px;text-align:center;background:transparent;border-radius:0;overflow-wrap:normal}
.pickup:hover:not(:disabled){background:color-mix(in srgb,var(--primary-text-color) 5%,transparent)}
.pickup:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-2px}
.pickup .weekday{font-size:12px;font-weight:400;line-height:1.4;color:var(--secondary-text-color)}
.pickup .day{font-size:30px;font-weight:500;line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap}
.pickup.first .day{font-size:38px;font-weight:650}
.pickup .month{font-size:12px;line-height:1.4;color:var(--secondary-text-color)}
.pickup .name{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:400;line-height:1.4;margin-top:6px;min-width:0;max-width:100%}
.pickup.first .name{font-weight:650}.pickup.first .count{font-weight:600;color:var(--primary-text-color)}
.pickup .name ha-icon{align-self:center;--mdc-icon-size:20px;width:20px;height:20px;color:var(--waste-color,var(--secondary-text-color))}
.pickup .name-text{min-width:0;max-width:100%;hyphens:auto;overflow-wrap:break-word}.pickup .count{font-size:11px;line-height:1.4;color:var(--secondary-text-color)}
.pickup{position:relative}
.waste-word{position:absolute;inset:0 auto auto 0;display:block;width:max-content;max-width:none;white-space:pre;font:inherit;letter-spacing:inherit;visibility:hidden;pointer-events:none}.waste-word::before{content:attr(data-word)}
.pickup+.pickup{border-inline-start:1px solid var(--divider-color)}
.waste-strip[data-columns="3"] .pickup:nth-child(3n+1),.waste-strip[data-columns="2"] .pickup:nth-child(2n+1),.waste-strip[data-columns="1"] .pickup{border-inline-start:0}
.waste-strip[data-columns="1"] .pickup{overflow-wrap:anywhere}
.waste-strip[data-columns="3"] .pickup:nth-child(n+4),.waste-strip[data-columns="2"] .pickup:nth-child(n+3),.waste-strip[data-columns="1"] .pickup:nth-child(n+2){border-block-start:1px solid var(--divider-color)}
`;
const ACTION_STYLES=`
.heading{margin-bottom:16px}.heading h2{font-size:16px;font-weight:600;line-height:1.4;letter-spacing:normal;overflow-wrap:break-word}
.actions{grid-template-columns:repeat(var(--actions-columns,3),minmax(0,1fr));gap:8px}

.action{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:6px;padding:10px;min-height:76px;text-align:start;overflow-wrap:break-word}
.action ha-icon{--mdc-icon-size:28px;width:28px;height:28px;color:var(--secondary-text-color)}.action .split-label{min-width:0;width:100%;font-size:inherit;line-height:1.4}.action .split-label small{font-size:.923076923em;line-height:1.5;margin-top:4px}
.feedback{margin-top:12px;line-height:1.5}
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
 connectedCallback(){if(this.kind==='actions')this._fingerprint=null;this._render();this._refresh();if(this.kind==='waste'){this._observeWaste();if(!this._timer)this._timer=setInterval(()=>{this._render();this._refresh();},30000);}}
 disconnectedCallback(){clearInterval(this._timer);this._timer=null;this._generation++;this._fetching=false;this._lastFetch=0;this._actionsResize?.disconnect();this._wasteResize?.disconnect();}
 getCardSize(){return Math.max(2,(this._config?.entities?.length||this._config?.actions?.length||1)+1);}
 getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 get nl(){return isNL(this._hass?.locale?.language);}
 t(nl,en){return this.nl?nl:en;}
 state(id){return this._hass?.states?.[id];}
 name(e){return e.name||this.state(e.entity)?.attributes?.friendly_name||e.entity||this.t('Kies een entiteit','Choose an entity');}
 number(v){return finite(v)?new Intl.NumberFormat(this._hass?.locale?.language||'en',{maximumFractionDigits:2}).format(Number(v)):'—';}
 more(id){if(id)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));}
 button(i,action,label,ico,request){return uiButton({variant:'action-icon',label,title:label,content:icon(ico),disabled:!request||this._pending,attrs:{'data-index':i,'data-action':action,'data-key':`${i}-${action}`}});}
 async _refresh(force=false){
  if(this.kind!=='waste'||!this.isConnected||!this._hass?.callApi||!this._config||this._fetching||(!force&&this._lastFetch&&Date.now()-this._lastFetch<300000))return;
  const ids=[...new Set(this._config.entities.filter(e=>e.entity?.startsWith('calendar.')&&available(this.state(e.entity))).map(e=>e.entity))];if(!ids.length)return;
  const generation=this._generation;this._fetching=true;this._lastFetch=Date.now();this._render();const start=new Date();start.setUTCHours(0,0,0,0);start.setUTCDate(start.getUTCDate()-1);const end=new Date(start.getTime()+62*86400000);
  await Promise.all(ids.map(async id=>{try{const events=await this._hass.callApi('GET',`calendars/${encodeURIComponent(id)}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);if(!Array.isArray(events))throw Error('Invalid calendar response');if(generation===this._generation)this._cache[id]={events};}catch{if(generation===this._generation)this._cache[id]={error:true};}}));
  if(generation===this._generation){this._fetching=false;this._render();}
 }
 _render(){
  if(!this._config)return;const c=this._config,items=c[this.kind==='actions'?'actions':'entities'];
  const fp=JSON.stringify([c,this._cache,this._message,this._error,this._pending,this._hass?.locale,this._hass?.config?.time_zone,this.kind==='waste'?[Math.floor(Date.now()/30000),this._fetching]:null,items.map(e=>this.state(e.entity))]);if(fp===this._fingerprint)return;this._fingerprint=fp;
  const active=this.shadowRoot.activeElement,focus=active?.dataset.key;
  let body=this.kind==='actions'?this._actions(items):this.kind==='controls'?this._controls(items):this._waste(items);
  if(!items.length)body=`<div class="empty">${this.t('Voeg onderdelen toe via de kaartinstellingen.','Add items in the card settings.')}</div>`;
  const title=c.title??TITLES[this.kind][this.nl?0:1];
  this.shadowRoot.innerHTML=`<style>${STYLES}${uiBarStyles()}${cardThemeStyles(this.kind==='waste'?{wells:'.waste-strip'}:{})}${uiActionButtonStyles()}${this.kind==='actions'?ACTION_STYLES:this.kind==='waste'?WASTE_STYLES:CONTROLS_STYLES}</style><ha-card${this.kind==='waste'?' tabindex="-1"':''}><div class="content">${title?`<div class="heading"><h2>${esc(title)}</h2></div>`:''}${body}<div class="feedback ${this._error?'error':''}" role="status" aria-live="polite">${esc(this._message)}</div></div></ha-card>`;
  this.shadowRoot.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>this.more(b.dataset.info)));
  this.shadowRoot.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>this.activate(Number(b.dataset.index),b.dataset.action)));
  this.shadowRoot.querySelectorAll('input[data-level]').forEach(b=>{b.addEventListener('input',()=>{syncUISlider(b);b.nextElementSibling.value=b.value+'%';});b.addEventListener('change',()=>this.activate(Number(b.dataset.level),'level',Number(b.value)));});
  this.shadowRoot.querySelector('[data-retry]')?.addEventListener('click',()=>this._refresh(true));
  if(focus){const target=this.shadowRoot.querySelector(`[data-key="${CSSescape(focus)}"]`);
   (target||(this.kind==='waste'?(this.shadowRoot.querySelector('[data-info]')||this.shadowRoot.querySelector('ha-card')):null))?.focus();
  }
  if(this.kind==='actions'&&typeof ResizeObserver==='function'){
   this._actionsResize??=new ResizeObserver(()=>this._fitActions());this._actionsResize.disconnect();
   this._fitActions();this._actionsResize.observe(this);
   this.shadowRoot.querySelectorAll('.split-label,.split-label small').forEach(e=>this._actionsResize.observe(e));
  }
  if(this.kind==='waste')this._observeWaste();
 }
 _observeWaste(){
  this._wasteResize?.disconnect();
  const grid=this.shadowRoot.querySelector('.waste-strip');if(!grid||typeof getComputedStyle!=='function')return;
  // Intrinsic DOM probes mirror each actual label's computed font longhands.
  // Observe real text boxes plus unwrapped metrics, not only the host: text-only
  // zoom/font loading refits without canvas shorthand or line-height ambiguity.
  grid.querySelectorAll('.pickup').forEach(button=>button.querySelectorAll('.weekday,.day,.month,.name-text,.count').forEach(label=>{
   if(label._wasteWords)return;
   label._wasteWords=[];
   for(const word of label.textContent.split(/\s+/u).filter(Boolean)){
    const probe=document.createElement('span');probe.className='waste-word';probe.setAttribute('data-word',word);probe.setAttribute('aria-hidden','true');button.append(probe);label._wasteWords.push(probe);
   }
  }));
  this._fitWaste();
  if(typeof ResizeObserver==='function'){
   this._wasteResize??=new ResizeObserver(()=>this._fitWaste());
   this._wasteResize.observe(this);this._wasteResize.observe(grid);
   grid.querySelectorAll('.weekday,.day,.month,.name-text,.count,.waste-word').forEach(e=>this._wasteResize.observe(e));
  }
 }
 _fitWaste(){
  const grid=this.shadowRoot.querySelector('.waste-strip');if(!grid)return;
  const buttons=grid.querySelectorAll('.pickup'),gs=getComputedStyle(grid),n=v=>parseFloat(v)||0;
  let minimum=44;
  buttons.forEach(button=>{
   // The one-pixel divider disappears on single/row-leading cells. Reserve
   // that space for every candidate so the chosen column count cannot alter
   // its own fitting input and oscillate at the one/two-column threshold.
   const bs=getComputedStyle(button),chrome=n(bs.paddingLeft)+n(bs.paddingRight)+1;
   button.querySelectorAll('.weekday,.day,.month,.name-text,.count').forEach(label=>{
    let width=0;const textStyle=getComputedStyle(label);
    (label._wasteWords||[]).forEach(word=>{
     // Longhands deliberately avoid computed font shorthand with a line-height.
     for(const property of ['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','fontVariant','fontFeatureSettings','fontVariationSettings','lineHeight','letterSpacing','textTransform'])word.style[property]=textStyle[property];
     width=Math.max(width,word.getBoundingClientRect().width);
    });
    if(label.classList?.contains('name-text')){
     const name=button.querySelector('.name'),glyph=name?.querySelector('ha-icon');
     // The icon may wrap above the full name on narrow three-column strips.
     width=Math.max(width,glyph?.getBoundingClientRect().width||0);
    }
    minimum=Math.max(minimum,Math.ceil(width+chrome));
   });
  });
  const width=grid.clientWidth-n(gs.paddingLeft)-n(gs.paddingRight),gap=n(gs.columnGap);
  if(width<=0)return;
  const columns=String(Math.max(1,Math.min(3,buttons.length,Math.floor((width+gap)/(minimum+gap)))));
  if(grid.style.getPropertyValue('--waste-columns')!==columns)grid.style.setProperty('--waste-columns',columns);
  grid.dataset.columns=columns;
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
 _actions(items){return `<div class="actions" aria-busy="${this._pending}">${items.map((e,i)=>uiButton({variant:'action',className:'action',label:e.aria_label||this.name(e),disabled:!actionRequest(this.state(e.entity),e.entity)||this._pending,attrs:{'data-index':i,'data-action':'run','data-key':`${i}-run`},content:`${icon(e.icon||'mdi:play-outline')}<span class="split-label">${esc(this.name(e))}${e.description?`<small>${esc(e.description)}</small>`:''}${!available(this.state(e.entity))?`<small>${this.t('Niet beschikbaar','Unavailable')}</small>`:''}</span>`})).join('')}</div>`;}
 _controls(items){return `<div class="devices">${items.map((e,i)=>{
  const s=this.state(e.entity),a=s?.attributes||{},domain=e.entity?.split('.')[0],ok=available(s),name=this.name(e);let controls='',status=!ok?this.t('Niet beschikbaar','Unavailable'):({on:this.t('Aan','On'),off:this.t('Uit','Off'),open:this.t('Open','Open'),closed:this.t('Dicht','Closed'),opening:this.t('Gaat open','Opening'),closing:this.t('Gaat dicht','Closing')}[s.state]||s.state),extra='';
  const request=(act,v)=>controlRequest(s,e.entity,act,v),btn=(act,label,ico)=>this.button(i,act,`${name}: ${label}`,ico,request(act));
  if(domain==='climate'){
   status=ok?`${this.number(a.current_temperature)} ${this._hass?.config?.unit_system?.temperature||'°C'} · ${a.hvac_action==='heating'?this.t('Verwarmen','Heating'):a.hvac_action==='cooling'?this.t('Koelen','Cooling'):this.t('Huidig','Current')}`:status;
   if(Number(a.supported_features)&1)controls=btn('down',this.t('Lager','Decrease'),'mdi:minus')+`<span class="target">${ok?this.number(a.temperature)+' '+esc(this._hass?.config?.unit_system?.temperature||'°C'):'—'}<small>${this.t('ingesteld','target')}</small></span>`+btn('up',this.t('Hoger','Increase'),'mdi:plus');
  }else if(domain==='cover'){
   status=ok&&finite(a.current_position)?`${a.current_position}% · ${status}`:status;
   controls=btn('open',this.t('Openen','Open'),'mdi:arrow-up')+btn('stop',this.t('Stoppen','Stop'),'mdi:stop')+btn('close',this.t('Sluiten','Close'),'mdi:arrow-down');
  }else if(['number','input_number'].includes(domain)){
   status=ok?`${this.number(s.state)} ${a.unit_of_measurement||''}`:status;
   controls=btn('down',this.t('Lager','Decrease'),'mdi:minus')+btn('up',this.t('Hoger','Increase'),'mdi:plus');
  }else if(['light','fan','switch','input_boolean'].includes(domain)){
   controls=uiButton({variant:'action',className:`toggle ${s?.state==='on'?'on':''}`,label:name+': '+this.t('Schakelen','Toggle'),text:s?.state==='on'?this.t('Uit','Off'):this.t('Aan','On'),disabled:!request('toggle')||this._pending,attrs:{'data-index':i,'data-action':'toggle','data-key':`${i}-toggle`,'aria-pressed':s?.state==='on'}});
  }
  const level=domain==='light'&&finite(a.brightness)?Math.round(Number(a.brightness)/255*100):domain==='fan'?a.percentage:domain==='cover'?a.current_position:null;
  if(domain!=='cover'&&request('level',50))extra=`<label class="level">${uiSlider({value:finite(level)?Number(level):0,step:domain==='fan'&&finite(a.percentage_step)&&Number(a.percentage_step)>0?Number(a.percentage_step):1,disabled:this._pending,attrs:{'data-key':`${i}-level`,'data-level':String(i),'aria-label':name+': '+this.t('Niveau','Level')}})}<output>${finite(level)?esc(level)+'%':'—'}</output></label>`;
  return `<div class="device"><button type="button" class="identity" data-info="${esc(e.entity)}" data-key="${i}-info" title="${esc(name+': '+status)}" aria-label="${esc(name+': '+status)}">${icon(e.icon||GLYPHS[domain]||'mdi:tune')}<span>${esc(name)}<small>${esc(status)}</small></span></button><div class="device-controls">${extra}${controls}</div></div>`;
 }).join('')}</div>`;}
 _waste(items){
  const rows=wasteRows(items,this._hass?.states,this._cache,{locale:this._hass?.locale?.language,timeZone:this._hass?.config?.time_zone}),groups=groupWaste(rows),unresolved=rows.filter(e=>!e.date);
  const locale=this._hass?.locale?.language||'en';
  const format=(date,options)=>new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  const pickups=groups.flatMap(g=>g.items.map(e=>({g,e})));
  const pickup=({g,e},i)=>{
   // Identity matches groupWaste's existing entity/date/name deduplication, not position.
   const key='pickup-'+encodeURIComponent(JSON.stringify([e.entity,g.date,e.name]));
   const absolute=format(g.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
   const count=g.days<=1?g.label:this.t(`Over ${g.days} dagen`,`In ${g.days} days`);
   const todayYear=g.date.slice(0,4)!==dayKey(Date.now(),this._wasteTimeZone()).slice(0,4);
   return `<button type="button" class="pickup${i===0?' first':''}" data-info="${esc(e.entity)}" data-key="${esc(key)}" aria-label="${esc(e.name+': '+absolute+', '+count)}" style="${e.color?'--waste-color:'+esc(e.color):''}"><span class="weekday">${esc(format(g.date,{weekday:'long'}))}</span><span class="day">${esc(format(g.date,{day:'2-digit'}))}</span><span class="month">${esc(format(g.date,{month:'long',...(todayYear?{year:'numeric'}:{})}))}</span><span class="name">${icon(e.icon)}<span class="name-text">${esc(e.name)}</span></span><span class="count">${esc(count)}</span></button>`;
  };
  return `${pickups.length?`<section class="waste-strip" aria-label="${this.t('Volgende inzameling','Next collection')}" data-columns="${Math.min(3,pickups.length)}" style="--waste-columns:${Math.min(3,pickups.length)}">${pickups.map(pickup).join('')}</section>`:`<div class="empty">${this.t('Geen komende inzameling bekend.','No upcoming collection available.')}</div>`}${unresolved.length?`<div class="unresolved">${unresolved.map(e=>`<button type="button" data-info="${esc(e.entity)}" data-key="${esc('unresolved-'+encodeURIComponent(JSON.stringify([e.entity,e.name])))}"><span>${esc(e.name)}</span><span class="${e.status==='error'?'collection-error':''}">${esc(e.label)}</span></button>`).join('')}${unresolved.some(e=>e.status==='error')?uiButton({variant:'action',className:'retry',text:this.t('Opnieuw proberen','Retry'),attrs:{'data-retry':'','data-key':'waste-retry','aria-busy':!!this._fetching,'aria-disabled':!!this._fetching}}):''}</div>`:''}`;
 }
 _wasteTimeZone(){const zone=this._hass?.config?.time_zone||'UTC';try{dayKey(Date.now(),zone);return zone;}catch{return 'UTC';}}
 async activate(index,action,value){
  if(this._pending)return;const item=this._config[this.kind==='actions'?'actions':'entities'][index];if(!item)return;
  const request=this.kind==='actions'?actionRequest(this.state(item.entity),item.entity):controlRequest(this.state(item.entity),item.entity,action,value);if(!request||!this._hass?.callService)return;
  if(this._config.confirmation===true&&!window.confirm(item.confirmation||this.t(`${this.name(item)}: opdracht uitvoeren?`,`${this.name(item)}: execute command?`))){this._fingerprint=null;this._render();return;}
  const actionFocus=(this.kind==='actions'||this.kind==='controls')?this.shadowRoot.activeElement?.dataset.key:null;
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
  this.shadowRoot.innerHTML=`<style>:host{display:block;color:var(--primary-text-color)}.item{padding:16px 0;border-top:1px solid var(--divider-color)}.bar{display:flex;align-items:center;gap:4px}.bar strong{flex:1;font-size:14px;overflow-wrap:anywhere}${uiActionButtonStyles()}.add{padding:0 16px;margin-top:12px}p{font-size:12px;color:var(--secondary-text-color);line-height:1.5}ha-form{display:block}</style><div class="main"></div><p>${this.kind==='waste'?this.t('Gebruik een datumsensor, een aftelsensor of een kalender. Automatisch herkent ISO-datums en daysTo. Kalenderafspraken worden 60 dagen vooruit geladen.','Use a date sensor, day-count sensor or calendar. Auto recognizes ISO dates and daysTo. Calendar events are loaded 60 days ahead.'):this.kind==='controls'?this.t('Voeg alleen de apparaten toe die je hier wilt bedienen. De knoppen passen zich aan de mogelijkheden aan.','Add the devices you want to control. Controls follow each entity’s capabilities.'):this.t('Voeg scènes of scripts toe. Elke actie heeft een eigen naam en icoon.','Add scenes or scripts. Each action has its own name and icon.')}</p><div class="items"></div>${uiButton({variant:'action',className:'add',text:this.t('Onderdeel toevoegen','Add item')})}`;
  this.form(this.shadowRoot.querySelector('.main'),[{name:'title',selector:{text:{}}},...(this.kind==='waste'?[]:[{name:'confirmation',selector:{boolean:{}}}]),...(this.kind==='actions'?[{name:'columns',selector:{number:{min:1,max:6,step:1,mode:'box'}}}]:[])],this.kind==='actions'?{...this._config,columns:this._config.columns??3}:this._config,v=>{this.emit({...this._config,...v});});
  items.forEach((e,i)=>{
   const box=document.createElement('section');box.className='item';box.innerHTML=`<div class="bar"><strong>${esc(e.name||e.entity||this.t('Nieuw onderdeel','New item'))}</strong>${uiButton({variant:'action-icon',label:this.t('Omhoog','Move up'),text:'↑',disabled:i===0,attrs:{'data-move':-1}})}${uiButton({variant:'action-icon',label:this.t('Omlaag','Move down'),text:'↓',disabled:i===items.length-1,attrs:{'data-move':1}})}${uiButton({variant:'action-danger',label:this.t('Verwijderen','Remove'),text:'×',attrs:{'data-remove':''}})}</div><div class="fields"></div>`;
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
for(const [tag,cls] of [['eleven-controls-editor',ControlsEditor],[TYPES.actions,ActionsCard],[TYPES.controls,ControlsCard],[TYPES.waste,WasteCard]])if(!customElements.get(tag))customElements.define(tag,tag.endsWith('-editor')?cls:withCardBackground(cls));
// Home Assistant retains this array by reference: never replace it.
window.customCards=window.customCards||[];
// Clean stale picker metadata only; the retired element and mode editor are not implemented.
for(let i=window.customCards.length-1;i>=0;i--)if(window.customCards[i].type==='eleven-home-controls-card')window.customCards.splice(i,1);
for(const kind of Object.keys(TYPES))if(!window.customCards.some(c=>c.type===TYPES[kind]))window.customCards.push({type:TYPES[kind],name:'Eleven '+TITLES[kind][1],description:{actions:'Scenes and scripts at your fingertips',controls:'Configurable device controls',waste:'Upcoming waste collection from sensors and calendars'}[kind],preview:true});
