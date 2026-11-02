// Eleven Room Card - local beta
(()=>{
// Paint only, scoped to each caller's shadow root and explicit semantic roles.
// Material recipes/palettes belong to the optional YAML theme, never this helper.
// Do not use generic control selectors: swatches, state tracks and chart colors
// must keep their functional paint. chartUI is an explicit non-House opt-in
// for shared chart-control geometry. No behavior or public-token writes.
function cardThemeStyles({wells='',controls='',selected='',plots='',surfaces='',chartUI=false}={}) {
 // Segmented groups own their paint; descendants pressing must not press the group.
 if(chartUI)controls=[...controls.split(',').filter(selector=>!['.zoom-controls','.chart-links'].includes(selector.trim())),'.period-default [data-ui-button=surface]'].filter(Boolean).join(',');
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
${chartUI?`
/* Opt-in only: House's shared primitive defaults remain unchanged. */
.card-header{margin:0 0 12px;gap:12px;align-items:center}
.card-header h2{margin:0;flex:1 1 100%}
.header-actions{width:100%;gap:8px;justify-content:space-between}
.header-actions [data-ui-button],.period-menu [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.chart-controls{flex:1 1 100%;width:100%}
.chart-controls>[data-period]{position:relative;flex:none}
.chart-controls>.period-controls{flex:1 1 auto;margin-inline-end:0;padding-inline-end:0}
.chart-controls>.period-controls::after{display:none}
.header-actions .period-trigger{width:100%;justify-content:space-between;padding:8px;flex:1 1 auto}
.period-trigger span{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;line-height:1.35;text-align:start}
.period-menu [data-period-option][aria-checked=true]{border:0;color:var(--accent-color,var(--primary-color));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);text-decoration:none;transform:translateY(1px)}
.period-menu [data-period-option][aria-checked=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.period-menu [data-period-option]{min-width:0}
.period-menu .period-options{grid-template-columns:repeat(5,minmax(0,1fr))}
.period-menu .period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-menu .ui-popup-heading [data-ui-button]{min-width:44px}
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
${group}{gap:0;align-items:stretch;background:var(--eleven-material-control-background,var(--secondary-background-color,#eee));box-shadow:var(--eleven-material-control-shadow,var(--eleven-surface-shadow,none));border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
:is(${buttons}){position:relative;align-self:stretch;height:auto;background:transparent;box-shadow:none;border:0;border-radius:0;min-height:44px;min-width:44px;box-sizing:border-box}
${first?`:is(${buttons}):is(${first}){border-start-start-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));border-end-start-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}`:''}
${last?`:is(${buttons}):is(${last}){border-start-end-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));border-end-end-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}`:''}
:is(${dividers}){position:relative}
:is(${dividers})::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:1px;background:color-mix(in srgb,var(--divider-color,#ddd) 55%,transparent);pointer-events:none;z-index:1}
:is(${buttons}):disabled{opacity:1;color:color-mix(in srgb,var(--primary-text-color,#20252b) 35%,transparent);cursor:default}
:is(${buttons}):not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none}
:is(${buttons}):not(:disabled):active{background:color-mix(in srgb,var(--primary-text-color,#20252b) 7%,transparent);box-shadow:var(--eleven-material-well,inset 0 2px 3px rgb(0 0 0 / 15%))}
:is(${buttons}):focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
@media(forced-colors:active){${group}{box-shadow:none;outline:1px solid CanvasText}:is(${buttons}):not(:disabled):active{background:Highlight;color:HighlightText;box-shadow:none}}
`;}

function normalizeRoom(c={}){
 if(!String(c.name??'').trim())throw Error('Geef de ruimte een naam');
 if(c.navigation_path&&!/^\/(?!\/)[a-zA-Z0-9_\-/]+$/.test(c.navigation_path))throw Error('Gebruik een lokaal dashboardpad');
 const lights=[...new Set(c.lights??[])];
 if(lights.some(id=>!/^light\.[a-z0-9_]+$/.test(id)))throw Error('Kies alleen lampen');
 return {...c,name:String(c.name),icon:c.icon||'mdi:home-outline',lights};
}
function temperatureText(s,locale='nl-NL'){
 if(!s||s.state==null||String(s.state).trim()===''||!Number.isFinite(Number(s.state)))return '';
 return new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(Number(s.state))+(s.attributes?.unit_of_measurement?' '+s.attributes.unit_of_measurement:'');
}
function roomStatus(ids=[],states={}){
 const unique=[...new Set(ids)],total=unique.length;
 const on=unique.filter(id=>states[id]?.state==='on').length;
 const unavailable=unique.filter(id=>!states[id]||['unknown','unavailable'].includes(states[id].state)).length;
 const label=!total?'Nog niet gekoppeld':[on?`${on} aan`:unavailable?'':'Licht uit',unavailable?`${unavailable} niet beschikbaar`:''].filter(Boolean).join(' · ');
 return {total,on,unavailable,label};
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class RoomCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 static getConfigForm(){return {schema:[
  {name:'name',required:true,selector:{text:{}}},
  {name:'icon',selector:{icon:{}}},
  {name:'lights',selector:{entity:{domain:'light',multiple:true}}},
  {name:'temperature_entity',selector:{entity:{domain:'sensor',device_class:'temperature'}}},
  {name:'navigation_path',selector:{text:{}}},
  {name:'note',selector:{text:{}}}
 ],computeLabel:s=>({name:'Ruimtenaam',icon:'Icoon',lights:'Lampen (geen groepen én hun leden)',temperature_entity:'Temperatuursensor',navigation_path:'Pad naar ruimtepagina',note:'Toelichting / testkoppeling'}[s.name]??s.name)};}
 static getStubConfig(){return {name:'Nieuwe ruimte',icon:'mdi:home-outline',lights:[]};}
 setConfig(c){this._config=normalizeRoom(c);this._render();}
 set hass(h){this._hass=h;this._render();}get hass(){return this._hass;}
 getCardSize(){return 2;}
 getGridOptions(){return {columns:6,min_columns:6,rows:'auto',min_rows:2};}
 _moreInfo(entityId){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));}
 _render(){
  if(!this._config)return;
  const c=this._config,s=roomStatus(c.lights,this._hass?.states),temp=temperatureText(this._hass?.states?.[c.temperature_entity],this._hass?.locale?.language||'nl-NL');
  const focused=this.shadowRoot.activeElement?.className;
  this.shadowRoot.innerHTML=`<style>
   :host{display:block;min-width:0;height:100%}ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color);border-radius:var(--ha-card-border-radius,16px)}
   .room{padding:var(--eleven-card-padding,16px);min-height:132px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;font-family:inherit}
   .head{display:flex;align-items:center;justify-content:space-between;gap:8px}.room-icon{color:var(--primary-color);--mdc-icon-size:24px}.temp{font-size:13px;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}
   a,.identity{color:inherit;text-decoration:none;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0;border-radius:4px}a:focus-visible,button:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
   .name{font-size:16px;font-weight:600;line-height:1.35;overflow-wrap:anywhere}.note{font-size:11px;color:var(--secondary-text-color);line-height:1.4;overflow-wrap:anywhere}
   .status{display:flex;align-items:center;gap:6px;font-size:12px;line-height:1.45;color:var(--secondary-text-color);overflow-wrap:anywhere;min-width:0}.status ha-icon{--mdc-icon-size:17px;flex-shrink:0}.status.warning{color:var(--primary-text-color)}.status.warning ha-icon{color:var(--warning-color,var(--primary-text-color))}
   footer{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:auto}button{appearance:none;flex-shrink:0;display:grid;place-items:center;min-width:44px;min-height:44px;border:0;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer}button.on{background:var(--primary-color);color:var(--text-primary-color,#fff)}button:disabled{opacity:.45;cursor:default}button ha-icon{--mdc-icon-size:20px}
  ${cardThemeStyles({controls:'.control:not(.on)',selected:'.control.on'})}</style><ha-card><div class="room"><div class="head"><ha-icon class="room-icon" icon="${esc(c.icon)}"></ha-icon>${temp?`<span class="temp">${esc(temp)}</span>`:''}</div>
  ${c.navigation_path?`<a class="identity" href="${esc(c.navigation_path)}" aria-label="Open ${esc(c.name)}">`:'<div class="identity">'}<span class="name">${esc(c.name)}</span>${c.note?`<span class="note">${esc(c.note)}</span>`:''}${c.navigation_path?'</a>':'</div>'}
  <footer><span class="status ${s.unavailable?'warning':''}">${s.unavailable?'<ha-icon icon="mdi:alert-circle-outline"></ha-icon>':''}${esc(s.label)}</span>${s.total?`<button class="control ${s.on?'on':''}" type="button" aria-label="Bedien verlichting ${esc(c.name)}" ${s.unavailable===s.total?'disabled':''}><ha-icon icon="mdi:lightbulb-outline"></ha-icon></button>`:''}</footer></div></ha-card>`;
  const link=this.shadowRoot.querySelector('a');if(link)link.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'',c.navigation_path);window.dispatchEvent(new Event('location-changed'));};
  const control=this.shadowRoot.querySelector('button');if(control)control.onclick=()=>this._moreInfo(c.lights.find(id=>!['unknown','unavailable'].includes(this._hass?.states?.[id]?.state)&&this._hass?.states?.[id])||c.lights[0]);
  if(focused)this.shadowRoot.querySelector('.'+focused.split(' ')[0])?.focus();
 }
}

if(!customElements.get('eleven-room-card'))customElements.define('eleven-room-card',RoomCard);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-room-card'))window.customCards.push({type:'eleven-room-card',name:'Eleven Room (beta)',description:'Ruimtestatus en navigatie, met bestaande apparaten',preview:true});
})();
