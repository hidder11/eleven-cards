/* Eleven house: prerecorded lighting only; no rendering API. */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class ElevenHouseCard extends HTMLElement{
 constructor(){
  super();this.attachShadow({mode:'open'});this.pending=new Set();
  this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0;color:var(--primary-text-color,#202124)}
ha-card{display:block;box-sizing:border-box;overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,12px)}
.content{padding:16px;font-family:var(--ha-font-family-body,inherit);line-height:1.4}h2{font-size:18px;font-weight:650;letter-spacing:-.01em;line-height:1.25;margin:0 0 4px}
canvas,.floor-image{display:block;width:100%;height:auto;background:transparent;aspect-ratio:4/3;object-fit:contain}canvas[hidden],.floor-image[hidden]{display:none}
.navigation{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 8px}.navigation label{flex:1 1 125px;min-width:0;font-size:11px;color:var(--secondary-text-color,#616161)}.navigation select{display:block;box-sizing:border-box;width:100%;min-height:44px;margin-top:4px;padding:8px;border:0;border-radius:8px;background:var(--secondary-background-color,#f1f3f4);color:var(--primary-text-color,#202124);font:inherit;font-size:13px}.navigation select:focus-visible{outline:2px solid var(--primary-color,#03a9f4)}
.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.summary:empty{display:none}.summary-tile{min-height:56px}.summary[hidden]{display:none}
.controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:4px}
button{display:flex;align-items:center;gap:10px;min-width:0;min-height:52px;padding:10px 12px;appearance:none;border:0;border-radius:8px;text-align:left;font:inherit;color:inherit;cursor:pointer;background:var(--secondary-background-color,#f1f3f4);transition:background 120ms ease-out}
button[aria-pressed=true]{background:color-mix(in srgb,var(--primary-color,#03a9f4) 14%,var(--secondary-background-color,#f1f3f4))}button[aria-pressed=true] ha-icon{color:var(--primary-color,#0277bd)}button:hover:not(:disabled){background:color-mix(in srgb,var(--primary-color,#03a9f4) 20%,var(--secondary-background-color,#f1f3f4))}button:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}button:disabled{opacity:.5;cursor:default}
ha-icon{--mdc-icon-size:22px;width:22px;height:22px;flex:none;display:inline-flex;color:var(--secondary-text-color,#616161)}.label{min-width:0;font-size:13px;font-weight:550;overflow-wrap:anywhere}small{display:block;font-size:11px;font-weight:400;color:var(--secondary-text-color,#616161);margin-top:1px}
p{font-size:12px;color:var(--secondary-text-color,#616161);margin:10px 0 0;overflow-wrap:anywhere}p:empty{display:none}p[data-error=true]{color:var(--error-color,#b3261e)}
@media(max-width:380px){.content{padding:12px}button{padding:10px;gap:8px}}@media(prefers-reduced-motion:reduce){button{transition:none}}
.lighting-notice{display:none}:host([data-appearance=hero]) .lighting-notice:not(:empty){display:block;font-size:11px;color:var(--secondary-text-color,#616161);margin-bottom:8px}
.hero-meta,.stage-caption,.light-heading{display:none}.light-panel{border:0}:host([data-appearance=hero]) .navigation:empty{display:none}
:host{container-type:inline-size}
/* Standard cards share the image row with their title; controls stay below. */
:host([data-appearance=standard]) .content{display:grid;grid-template-columns:minmax(0,1fr);padding:0}
:host([data-appearance=standard]) .hero-header{grid-area:1/1;align-self:start;z-index:2;pointer-events:none;position:relative;padding:12px 14px;box-sizing:border-box}
:host([data-appearance=standard]) h2{margin:0}
:host([data-appearance=standard]) .stage{grid-area:1/1;min-width:0;position:relative}
:host([data-appearance=standard]) canvas,:host([data-appearance=standard]) .floor-image{width:100%;height:clamp(220px,75cqi,360px);object-fit:contain}
:host([data-appearance=standard]) .navigation:empty{display:none}
:host([data-appearance=standard]) .summary{grid-area:2/1;margin:0;padding:0 12px;gap:6px}
:host([data-appearance=standard]) .summary-tile{min-height:44px;padding:6px 8px}
:host([data-appearance=standard]) .light-panel{grid-area:3/1;margin:0 12px 8px}
:host([data-appearance=standard]) .controls{margin-top:6px;gap:6px}
:host([data-appearance=standard]) p{grid-area:4/1;margin:0 12px 10px}
:host([data-appearance=standard]) p:empty{display:none}

:host([data-appearance=hero]) .content{display:grid;grid-template-columns:minmax(0,1fr);padding:0}
:host([data-appearance=hero]) .hero-header{grid-area:1/1;align-self:start;z-index:2;pointer-events:none;position:relative;padding:14px 16px 8px;min-height:64px;box-sizing:border-box}
:host([data-appearance=hero]) h2{font-size:20px;font-weight:650;letter-spacing:-.01em;line-height:1.25;max-width:calc(100% - 100px);margin:0 0 3px}
:host([data-appearance=hero]) .hero-meta{display:block}.hero-date{font-size:11px;color:var(--secondary-text-color,#616161);text-transform:capitalize}
:host([data-appearance=hero]) .weather{pointer-events:auto;position:absolute;right:12px;top:10px;display:flex;flex-direction:column;gap:0;align-items:flex-end;background:transparent;padding:4px;min-height:44px;font-size:11px;color:var(--secondary-text-color,#616161);max-width:96px}.weather-temp{font-size:17px;color:var(--primary-text-color,#202124);font-weight:550;font-variant-numeric:tabular-nums}
:host([data-appearance=hero]) .stage{grid-area:1/1;min-width:0;position:relative;background:transparent;color:var(--secondary-text-color,#616161)}
:host([data-appearance=hero]) canvas,:host([data-appearance=hero]) .floor-image{position:relative;margin:0 auto -12px;height:clamp(240px,75cqi,360px);width:100%;object-fit:contain}
:host([data-appearance=hero]) .stage-caption{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 12px 6px;font-size:12px;min-height:16px}.view-label{max-width:42%;text-align:right}.light-state{display:flex;align-items:center;gap:6px;font-weight:550}.light-dot{width:6px;height:6px;flex:none;border-radius:50%;background:currentColor;opacity:.5}.light-dot.on{background:var(--primary-color,#03a9f4);opacity:1}
:host([data-appearance=hero]) .summary{order:3;gap:6px;margin:0;padding:4px 12px 0}:host([data-appearance=hero]) .summary-tile .label{line-height:1.25;overflow-wrap:break-word}
:host([data-appearance=hero]) .summary-tile{box-sizing:border-box;border-radius:8px;padding:6px 8px;gap:8px;min-height:44px;background:var(--secondary-background-color,#f1f3f4)}
:host([data-appearance=hero]) .summary-tile small{font-size:12px;margin-top:2px}
/* Without lighting disclosure, retain the inset below the final status row. */
:host([data-appearance=hero]) .summary:has(~ .light-panel[hidden]){padding-bottom:12px}
:host([data-appearance=hero]) .light-panel{order:4;margin:8px 12px 4px;border-top:1px solid var(--divider-color,#e0e0e0)}
:host([data-appearance=hero]) .light-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;font-size:13px;font-weight:550;cursor:pointer;list-style:none}.light-heading::-webkit-details-marker{display:none}.light-heading:after{content:'+';font-size:20px;font-weight:400;color:var(--secondary-text-color,#616161)}details[open]>.light-heading:after{content:'−'}summary:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px;border-radius:6px}
:host([data-appearance=hero]) .controls{margin:0}.light-panel[hidden]{display:none}:host([data-appearance=hero]) p{order:5;margin:0 20px 16px}:host([data-appearance=hero]) p:empty{display:none}
@container(min-width:620px){:host([data-appearance=hero]) .summary{grid-template-columns:repeat(4,minmax(0,1fr))}:host([data-appearance=hero]) .controls{grid-template-columns:repeat(3,minmax(0,1fr))}}
@container(max-width:350px){:host([data-appearance=hero]) canvas,:host([data-appearance=hero]) .floor-image{margin-bottom:-8px}:host([data-appearance=hero]) .hero-header{padding-left:12px}:host([data-appearance=hero]) h2{font-size:19px}:host([data-appearance=hero]) .summary-tile ha-icon{display:none}:host([data-appearance=hero]) .stage-caption{padding-left:12px;padding-right:12px;font-size:12px}}
.hero-avatar{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:650;background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent);color:var(--primary-text-color,#202124)}

.hero-avatar-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit}.hero-avatar-photo[hidden]{display:none}
.view-toggle{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:10px;background:var(--secondary-background-color,#f1f3f4);flex:none}.view-toggle button{display:inline-flex;justify-content:center;min-height:44px;min-width:58px;gap:0;padding:6px 10px;font-size:12px;font-weight:550;text-align:center;background:transparent}.view-toggle button[aria-pressed=true]{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-color,#03a9f4)}
:host([data-appearance=standard][data-view-toggle=true]) .stage-caption{display:flex;justify-content:flex-end;align-items:center;padding:0 12px 8px}
@media(prefers-reduced-motion:reduce){:host([data-appearance=hero]) canvas,:host([data-appearance=hero]) .floor-image{animation:none}button{transition:none}}
/* Approved compact welcome, isolated from existing hero and floor cards. */
:host([data-welcome-layout=compact]){--welcome-muted:var(--secondary-text-color,#616161);--welcome-accent:var(--primary-text-color,#202124);color:var(--primary-text-color,#202124)}
:host([data-welcome-layout=compact]) ha-card{background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,16px)}
:host([data-welcome-layout=compact]) .hero-header{grid-area:1/1;padding:16px 16px 0;pointer-events:none;min-height:0;display:flex;flex-direction:column;background:transparent;box-shadow:none}
:host([data-welcome-layout=compact]) h2{font-size:18px;max-width:none;margin:0 0 4px;letter-spacing:-.01em}
:host([data-welcome-layout=compact]) .hero-meta{display:contents}
:host([data-welcome-layout=compact]) .hero-date{order:0;font-size:11px;letter-spacing:normal;color:var(--welcome-muted);margin-bottom:2px;text-transform:none}
:host([data-welcome-layout=compact]) .home-caption{font-size:12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .stage{grid-area:1/1;margin-top:0;background:radial-gradient(ellipse at 65% 43%,#8c68452b,transparent 70%)}
:host([data-welcome-layout=compact][data-dark=false]) .stage{background:radial-gradient(ellipse at 65% 43%,#d5ad7433,transparent 70%)}
:host([data-welcome-layout=compact]) canvas,:host([data-welcome-layout=compact]) .floor-image{height:auto;aspect-ratio:4/3;margin:0 0 -24px}
:host([data-welcome-layout=compact]) .stage-caption{padding:0 16px 8px;font-size:12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .view-toggle{border-radius:8px;padding:2px;background:var(--secondary-background-color,#f1f3f4)}
:host([data-welcome-layout=compact]) .view-toggle button{border-radius:8px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .view-toggle button[aria-pressed=true]{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-color,#03a9f4)}
:host([data-welcome-layout=compact]) .summary{grid-area:3/1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin:0 16px;padding:0!important;border-top:1px solid var(--divider-color,#e0e0e0)}
:host([data-welcome-layout=compact]) .summary-tile{background:none;border-radius:0;padding:10px 0;min-height:44px;color:inherit}
:host([data-welcome-layout=compact]) .summary-tile small{font-size:11px;color:var(--welcome-muted);font-weight:400}
:host([data-welcome-layout=compact]) [data-summary=thermostat],:host([data-welcome-layout=compact]) [data-summary=weather]{order:0;display:block;border-bottom:1px solid var(--divider-color,#e0e0e0)}
:host([data-welcome-layout=compact]) [data-summary=weather]{padding-left:14px}
:host([data-welcome-layout=compact]) .temperature-main{display:flex;align-items:baseline;justify-content:space-between;gap:5px}
:host([data-welcome-layout=compact]) .temperature-label{font-size:12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .temperature-value{font-size:22px;letter-spacing:-.01em;font-weight:550;white-space:nowrap;font-variant-numeric:tabular-nums}
:host([data-welcome-layout=compact]) [data-summary=thermostat] .temperature-value{color:var(--welcome-accent)}
:host([data-welcome-layout=compact]) [data-summary=presence]{order:1;gap:8px;padding:10px 0}
:host([data-welcome-layout=compact]) .hero-avatar{width:29px;height:29px;border:1px solid var(--divider-color,#e0e0e0);background:none;color:inherit}
:host([data-welcome-layout=compact]) [data-summary=alarm]{order:2;grid-column:1/-1;border-top:1px solid var(--divider-color,#e0e0e0);padding:9px 0 12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) [data-summary=alarm] .label{display:flex;gap:7px;align-items:baseline;font-size:12px;font-weight:400}
:host([data-welcome-layout=compact]) [data-summary=alarm] ha-icon{display:inline-flex;--mdc-icon-size:16px;width:16px;height:16px}
:host([data-welcome-layout=compact]) .light-panel{grid-area:4/1}
:host([data-welcome-layout=compact]) p{grid-area:5/1}
@container(max-width:350px){:host([data-welcome-layout=compact]) .hero-header{padding-left:12px;padding-right:12px}:host([data-welcome-layout=compact]) .stage-caption{padding-left:12px;padding-right:12px}:host([data-welcome-layout=compact]) .summary{margin:0 12px}:host([data-welcome-layout=compact]) .temperature-value{font-size:21px}}
</style><ha-card><div class="content"><header class="hero-header"><h2></h2><div class="hero-meta"></div></header><div class="summary" aria-label="Woningstatus"></div><div class="navigation"></div><div class="stage"><canvas role="img" aria-label="3D-huis met actuele verlichting" hidden></canvas><img class="floor-image" alt="Verdiepingsaanzicht" hidden><div class="stage-caption"></div></div><details class="light-panel" open><summary class="light-heading">Verlichting</summary><div class="lighting-notice"></div><div class="controls"></div></details><p role="status" aria-live="polite">Beeldset laden…</p></div></ha-card>`;
  this.shadowRoot.querySelector('.stage-caption').addEventListener('click',e=>{const id=e.target.closest('button[data-house-view]')?.dataset.houseView;if(id&&this.cameraToggleViews().some(v=>v.id===id))this.selectView(id);});
  this.shadowRoot.addEventListener('error',e=>{if(e.target.matches?.('.hero-avatar-photo'))e.target.hidden=true;},true);
  this.shadowRoot.querySelector('.hero-meta').addEventListener('click',e=>{const id=e.target.closest('[data-weather]')?.dataset.weather;if(id)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));});
 }
 static getStubConfig(){return {title:'Huis',manifest:'/local/house/manifest.json',view:'cam-iso',mode:'auto'};}
 static getConfigForm(){return {schema:[{name:'appearance',selector:{select:{mode:'dropdown',options:[{value:'standard',label:'Standaard'},{value:'hero',label:'Living Home · openingskaart'}]}}},{name:'weather_entity',selector:{entity:{domain:'weather'}}},{name:'title',selector:{text:{}}},{name:'manifest',required:true,selector:{text:{}}},{name:'view_catalog',selector:{text:{}}},{name:'view',selector:{text:{}}},{name:'mode',selector:{select:{options:['auto','light','dark','morning','afternoon','evening','night']}}},{name:'show_view_toggle',selector:{boolean:{}}},{name:'controls',selector:{boolean:{}}},{name:'show_presence',selector:{boolean:{}}},{name:'presence_entities',selector:{entity:{domain:'person',multiple:true}}},{name:'show_alarm',selector:{boolean:{}}},{name:'alarm_entity',selector:{entity:{domain:'alarm_control_panel'}}},{name:'show_thermostat',selector:{boolean:{}}},{name:'thermostat_entity',selector:{entity:{domain:'climate'}}}],computeLabel:s=>({appearance:'Vormgeving',weather_entity:'Weer op openingskaart',title:'Titel',manifest:'Manifest-URL',view_catalog:'Extra verdiepingsaanzichten (catalogus-URL)',view:'Startaanzicht',mode:'Weergavemodus',show_view_toggle:'Voor/achter-schakelaar tonen',controls:'Lichtknoppen tonen',show_presence:'Aanwezigheid tonen',presence_entities:'Personen',show_alarm:'Alarm tonen',alarm_entity:'Alarm',show_thermostat:'Thermostaat tonen',thermostat_entity:'Thermostaat'}[s.name]||s.name)};}
 heroHeaderHTML(){
  const date=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  if(this.config.appearance==='hero'&&this.config.welcome_layout==='compact'){
   const names=(this.config.show_presence?this.config.presence_entities||[]:[]).map(id=>this._hass?.states?.[id]).filter(s=>s?.state==='home').map(s=>s.attributes?.friendly_name||'Iemand');
   return `<div class="hero-date">${esc(date)}</div><div class="home-caption">${esc(names.length?names.join(' en ')+(names.length===1?' is thuis':' zijn thuis'):'')}</div>`;
  }
  const id=this.config.weather_entity,s=this._hass?.states?.[id],known=s&&!['unknown','unavailable'].includes(s.state),a=s?.attributes||{};
  const labels={sunny:'Zonnig','clear-night':'Heldere nacht',cloudy:'Bewolkt',partlycloudy:'Half bewolkt',rainy:'Regen',pouring:'Zware regen',snowy:'Sneeuw','snowy-rainy':'Natte sneeuw',fog:'Mist',windy:'Winderig','windy-variant':'Winderig',lightning:'Onweer','lightning-rainy':'Onweer',hail:'Hagel',exceptional:'Bijzonder weer'};
  const temp=known&&typeof a.temperature==='number'&&Number.isFinite(a.temperature)?a.temperature.toLocaleString('nl-NL',{maximumFractionDigits:1})+' '+(a.temperature_unit||'°C'):'—';
  return `<div class="hero-date">${esc(date)}</div>${id?`<button type="button" class="weather" data-weather="${esc(id)}" aria-label="${esc('Weer: '+(known?(labels[s.state]||s.state)+' '+temp:'Niet beschikbaar'))}"><span class="weather-temp">${esc(known?temp:'—')}</span><span>${esc(known?(labels[s.state]||s.state):'Niet beschikbaar')}</span></button>`:''}`;
 }
 cameraToggleViews(){
  if(this.config?.show_view_toggle!==true)return [];
  const views=this.availableViews().filter(v=>(v.scope||'house')==='house');
  if(!views.some(v=>v.id===this.viewId))return [];
  const pair=['front','rear'].map(location=>views.find(v=>v.camera_location===location));
  return pair.every(Boolean)?pair:[];
 }
 cameraToggleHTML(){
  const views=this.cameraToggleViews();
  return views.length?`<span class="view-toggle" role="group" aria-label="Aanzicht woning">${views.map((v,i)=>`<button type="button" data-house-view="${esc(v.id)}" aria-pressed="${v.id===this.viewId}">${i?'Achter':'Voor'}</button>`).join('')}</span>`:'';
 }
 viewCaptionHTML(view){return this.cameraToggleHTML()||`<span class="view-label">${esc(view)}</span>`;}
 heroSceneHTML(){
  if(!this.loaded)return '<span>Beeldset laden…</span>'+this.cameraToggleHTML();
  const view=this.loaded.view?.camera_name||this.loaded.view?.name||this.loaded.name||'Huis';
  if(this.loaded.static)return `<span>Conceptbeeld</span><span class="view-label">${esc(view)}</span>`;
  const states=(this.loaded.manifest.lights||[]).map(l=>this.lightState(l)),on=states.filter(s=>s.on).length,known=states.filter(s=>s.known).length;
  const label=!known?'Lichtstatus niet beschikbaar':on?`${on} ${on===1?'ruimte':'ruimtes'} verlicht`:known<states.length?'Verlichting uit · deels bekend':'Verlichting uit';
  return `<span class="light-state"><span class="light-dot ${on?'on':''}" aria-hidden="true"></span>${esc(label)}</span>${this.viewCaptionHTML(view)}`;
 }
 drawHero(){
  const mode=this.loaded?.arrays?HousePixels.resolveMode(this.config.mode,this.loaded.arrays,this._hass):null;
  if(this.dataset){this.dataset.dark=String(!!this._hass?.themes?.darkMode);this.dataset.night=String(mode==='night'||mode==='dark');this.dataset.viewToggle=String(this.cameraToggleViews().length===2);}
  if(this.config.appearance!=='hero'&&this.config.show_view_toggle!==true)return;
  const root=this.shadowRoot,stage=root.querySelector('.stage-caption'),scene=this.config.appearance==='hero'?this.heroSceneHTML():this.cameraToggleHTML();
  if(stage.innerHTML!==scene){const focus=root.activeElement?.dataset.houseView;stage.innerHTML=scene;if(focus)Array.from(stage.querySelectorAll('[data-house-view]')).find(b=>b.dataset.houseView===focus)?.focus();}
  if(this.config.appearance!=='hero')return;
  const meta=root.querySelector('.hero-meta'),html=this.heroHeaderHTML();
  if(meta.innerHTML!==html){const focus=!!root.activeElement?.dataset.weather;meta.innerHTML=html;if(focus)meta.querySelector('[data-weather]')?.focus();}
  root.querySelector('.lighting-notice').textContent='';
  root.querySelector('.light-panel').hidden=!this.config.controls||!this.loaded||!!this.loaded.static;
 }
 availableViews(){return [...(this.renderManifest?.views||[]).map(v=>({...v,scope:v.scope||'house'})),...(this.extraViews||[])];}
 static getConfigElement(){return document.createElement('eleven-house-card-editor');}
 navigationHTML(){return '';}
 selectView(id){
  if(id===this.viewId||!this.availableViews().some(v=>v.id===id))return;
  // Keep the current exterior mounted until its replacement is completely loaded.
  // Floor/config navigation still clears unrelated imagery as before.
  const pair=this.cameraToggleViews(),retain=!!this.loaded&&!this.loaded.static&&pair.some(v=>v.id===id)&&pair.some(v=>v.id===this.loaded.view.id);
  this.viewId=id;if(!retain)this.loaded=null;this.failure='';this.drawKey=null;this.loadToken++;this.draw();this.load();
 }
 drawNavigation(){
  const root=this.shadowRoot,nav=root.querySelector('.navigation'),html=this.navigationHTML(),focus=root.activeElement?.dataset.nav;
  if(html===this.navHTML)return;this.navHTML=html;nav.innerHTML=html;
  nav.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{const views=this.availableViews(),id=s.dataset.nav==='camera'?s.value:s.dataset.nav==='floor'?views.find(v=>v.scope==='floor'&&v.floor_id===s.value)?.id:views.find(v=>v.scope===s.value)?.id;if(id)this.selectView(id);else{this.loaded=null;this.failure='Voor dit aanzicht zijn nog geen renders beschikbaar.';this.draw();}}));
  if(focus)nav.querySelector(`[data-nav="${focus}"]`)?.focus();
 }
 avatarHTML(id,label){
  const value=this._hass?.states?.[id]?.attributes?.entity_picture;
  const picture=typeof value==='string'&&/^(\/(?!\/)|https?:\/\/)/i.test(value.trim())?value.trim():'';
  return `<span class="hero-avatar" aria-hidden="true"><span class="hero-avatar-initial">${esc(Array.from(label)[0]?.toUpperCase()||'?')}</span>${picture?`<img class="hero-avatar-photo" src="${esc(picture)}" alt="" decoding="async" referrerpolicy="no-referrer">`:''}</span>`;
 }
 statusHTML(){
  const states=this._hass?.states||{},c=this.config,unknown=s=>!s||['unknown','unavailable'].includes(s.state);
  const tile=(kind,id,icon,label,value,detail='')=>{
   const hero=c.appearance==='hero',person=hero&&kind==='presence',climate=hero&&kind==='thermostat';
   if(hero&&c.welcome_layout==='compact'&&(climate||kind==='weather'))return `<button type="button" class="summary-tile temperature" data-summary="${kind}" data-info="${esc(id)}" ${id?'':'disabled'} aria-label="${esc((climate?'Binnen':'Buiten')+': '+value+(detail?' · '+detail:''))}"><span class="temperature-main"><span class="temperature-label">${climate?'Binnen':'Buiten'}</span><span class="temperature-value">${esc(value==='Niet beschikbaar'?'—':value)}</span></span><small>${esc(value==='Niet beschikbaar'?value:detail)}</small></button>`;
   const primary=climate?'Binnen · '+value:hero?label:value;
   const secondary=climate?detail:hero?value:label+(detail?' · '+detail:'');
   return `<button type="button" class="summary-tile" data-summary="${kind}" data-info="${esc(id)}" ${id?'':'disabled'} aria-label="${esc((climate?'Binnen':label)+': '+value+(detail?' · '+detail:''))}">${person?this.avatarHTML(id,label):`<ha-icon icon="${icon}" aria-hidden="true"></ha-icon>`}<span class="label">${esc(primary)}${secondary?`<small>${esc(secondary)}</small>`:''}</span></button>`;
  };
  let html='';
  if(c.show_presence){const ids=Array.isArray(c.presence_entities)?c.presence_entities:[];html+=ids.length?ids.map(id=>{const s=states[id];return tile('presence',id,s?.state==='home'?'mdi:account-check-outline':'mdi:account-outline',s?.attributes?.friendly_name||id,unknown(s)?'Niet beschikbaar':s.state==='home'?'Thuis':s.state==='not_home'?'Afwezig':Object.entries(states).find(([key,zone])=>key.startsWith('zone.')&&(key===s.state||key.slice(5)===s.state||zone.attributes?.friendly_name===s.state))?.[1].attributes?.friendly_name||s.state);}).join(''):tile('presence','','mdi:account-outline','Aanwezigheid','Geen personen gekozen');}
  if(c.show_alarm){const id=c.alarm_entity,s=states[id],labels={disarmed:'Uitgeschakeld',armed_home:'Thuis beveiligd',armed_away:'Ingeschakeld',armed_night:'Nachtstand',armed_vacation:'Vakantiestand',armed_custom_bypass:'Deels beveiligd',arming:'Inschakelen…',disarming:'Uitschakelen…',pending:'Vertraging',triggered:'Alarm!'};html+=tile('alarm',id,s?.state==='disarmed'?'mdi:shield-off-outline':'mdi:shield-home-outline','Alarm',unknown(s)?'Niet beschikbaar':labels[s.state]||'Onbekende status');}
  if(c.show_thermostat){const id=c.thermostat_entity,s=states[id],a=s?.attributes||{},unit=this._hass?.config?.unit_system?.temperature||'°C',fmt=v=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('nl-NL',{maximumFractionDigits:1})+' '+unit:null;html+=tile('thermostat',id,'mdi:thermometer','Thermostaat',unknown(s)?'Niet beschikbaar':fmt(a.current_temperature)||'Temperatuur onbekend',!unknown(s)&&fmt(a.temperature)?'Doel '+fmt(a.temperature):'');}
  if(c.appearance==='hero'&&c.welcome_layout==='compact'&&c.weather_entity){const id=c.weather_entity,s=states[id],a=s?.attributes||{},labels={sunny:'Zonnig','clear-night':'Heldere nacht',cloudy:'Bewolkt',partlycloudy:'Half bewolkt',rainy:'Regen',pouring:'Zware regen',snowy:'Sneeuw','snowy-rainy':'Natte sneeuw',fog:'Mist',windy:'Winderig','windy-variant':'Winderig',lightning:'Onweer','lightning-rainy':'Onweer',hail:'Hagel',exceptional:'Bijzonder weer'};html+=tile('weather',id,'mdi:thermometer','Buiten',unknown(s)||!Number.isFinite(a.temperature)?'Niet beschikbaar':a.temperature.toLocaleString('nl-NL',{maximumFractionDigits:1})+' '+(a.temperature_unit||'°C'),unknown(s)?'':labels[s.state]||s.state);}
  return html;
 }
 setConfig(c){this.stopLivingMotion();this.frameIdentity=null;if(!c.manifest)throw Error('manifest is verplicht');if(c.mode&&!['auto','light','dark','morning','afternoon','evening','night'].includes(c.mode))throw Error('Ongeldige modus');this.config={title:'Huis',view:'cam-iso',mode:'auto',controls:true,appearance:'standard',...c};this.dataset.appearance=this.config.appearance;this.dataset.welcomeLayout=this.config.appearance==='hero'&&this.config.welcome_layout==='compact'?'compact':'';this.shadowRoot.querySelector('.light-panel').open=this.config.appearance!=='hero';this.viewId=this.config.view;this.loaded=null;this.renderManifest=null;this.extraViews=[];this.loadToken=(this.loadToken||0)+1;this.drawKey=null;this.load();this.draw();}
 set hass(h){this._hass=h;this.refreshAreaRegistries();this.draw();}get hass(){return this._hass;}
 // Frontend registries are authoritative. Older hosts may provide read-only WS snapshots.
 refreshAreaRegistries(force=false){
  const h=this._hass,owner=h?.connection||h?.callWS;
  if(this.areaRegistryOwner!==owner){this.areaRegistryOwner=owner;this.areaEntities=null;this.areaDevices=null;this.areaRegistryRequest=null;this.areaRegistryAttempted='';}
  if(!h?.callWS||this.loaded?.static||!this.loaded?.manifest?.lights?.some(l=>Object.hasOwn(l,'area_id')))return Promise.resolve();
  const missing=[!h.entities&&'entity',!h.devices&&'device'].filter(Boolean),key=missing.join(',');
  if(!key)return Promise.resolve();if(this.areaRegistryRequest)return this.areaRegistryRequest;
  if(!force&&this.areaRegistryAttempted===key)return Promise.resolve();this.areaRegistryAttempted=key;
  const request=Promise.all(missing.map(async kind=>{
   const rows=await h.callWS({type:`config/${kind}_registry/list`});
   if(!Array.isArray(rows))throw Error('Ongeldig register');
   return [kind,Object.fromEntries(rows.map(row=>[kind==='entity'?row.entity_id:row.id,row]))];
  })).then(results=>{if(this.areaRegistryRequest!==request)return;for(const [kind,rows] of results)this[kind==='entity'?'areaEntities':'areaDevices']=rows;})
   .catch(()=>{if(this.areaRegistryRequest===request){this.areaEntities=null;this.areaDevices=null;}})
   .finally(()=>{if(this.areaRegistryRequest===request){this.areaRegistryRequest=null;this.draw();}});
  this.areaRegistryRequest=request;return request;
 }
 // Presence of area_id is authoritative, even when empty/invalid: never silently use entity.
 bindingKey(light){return Object.hasOwn(light,'area_id')?'area:'+String(light.area_id??''):light.entity;}
 lightState(light){
  if(!Object.hasOwn(light,'area_id'))return HousePixels.lightLevel(this._hass?.states?.[light.entity]);
  const area=light.area_id,entities=this._hass?.entities||this.areaEntities,devices=this._hass?.devices||this.areaDevices;
  if(typeof area!=='string'||!area||!entities||!devices)return {known:false,on:false,level:0};
  const states=Object.values(entities).filter(e=>e.entity_id?.startsWith('light.')&&!e.disabled_by&&!e.hidden_by&&!['config','diagnostic'].includes(e.entity_category)&&(e.area_id??devices[e.device_id]?.area_id)===area).map(e=>HousePixels.lightLevel(this._hass?.states?.[e.entity_id]));
  const active=states.filter(s=>s.on);
  return {known:states.some(s=>s.known),on:active.length>0,level:active.length?active.reduce((sum,s)=>sum+s.level,0)/active.length:0};
 }
 getCardSize(){return 6;}getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 connectedCallback(){if(this.config){this.draw();this.load();}this.refreshAreaRegistries(true);clearInterval(this.timer);this.timer=setInterval(()=>{this.refreshAreaRegistries(true);this.load();},30000);}
 disconnectedCallback(){clearInterval(this.timer);this.stopLivingMotion();this.loadToken=(this.loadToken||0)+1;this.loading=null;}
 stopLivingMotion(){
  this.lightAnimation?.cancel();this.lightAnimation=null;this.lightGhost?.remove();this.lightGhost=null;
  this.entryAnimation?.cancel();this.entryAnimation=null;
 }
 paintLivingFrame(canvas,pixels,width,height,identity){
  const animate=this.isConnected&&this.config.appearance==='hero'&&typeof canvas.animate==='function'&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const same=animate&&this.frameIdentity===identity&&canvas.width===width&&canvas.height===height;
  let ghost;
  if(same){
   ghost=document.createElement('canvas');ghost.width=width;ghost.height=height;
   const context=ghost.getContext('2d');context.drawImage(canvas,0,0);
   // Snapshot the currently visible blend when another state arrives mid-fade.
   if(this.lightGhost){context.globalAlpha=Number(getComputedStyle(this.lightGhost).opacity);context.drawImage(this.lightGhost,0,0);context.globalAlpha=1;}
  }
  this.stopLivingMotion();canvas.width=width;canvas.height=height;
  canvas.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);this.frameIdentity=identity;
  if(ghost){
   ghost.setAttribute('aria-hidden','true');ghost.className='light-transition';ghost.style.cssText='position:absolute;top:0;left:0;pointer-events:none';
   this.shadowRoot.querySelector('.stage').appendChild(ghost);this.lightGhost=ghost;
   const animation=ghost.animate([{opacity:1},{opacity:0}],{duration:650,easing:'ease-in-out',fill:'forwards'});this.lightAnimation=animation;
   animation.onfinish=()=>{if(this.lightAnimation===animation){ghost.remove();this.lightGhost=null;this.lightAnimation=null;}};
  }else if(animate&&!this.livingEntered){
   this.livingEntered=true;this.entryAnimation=canvas.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:'ease-out'});
  }
 }
 async load(){
  if(!this.config)return;const token=this.loadToken,config=this.config;if(this.loading===token)return;this.loading=token;
  try{
   const origin=new URL(config.manifest,document.baseURI),pointer=await HousePixels.json(origin),url=pointer.manifest?new URL(pointer.manifest,origin):origin;
   const manifest=pointer.manifest?await HousePixels.json(url,'default'):pointer;
   let extras=[];
   if(config.view_catalog){const catalogURL=new URL(config.view_catalog,document.baseURI),catalog=await HousePixels.json(catalogURL);if(catalog.schema!==1||!Array.isArray(catalog.views))throw Error('Ongeldige aanzichtcatalogus');extras=catalog.views.map(v=>{const field=v.manifest?'manifest':'image';if(!v[field])throw Error('Beeldbron ontbreekt');const source=new URL(v[field],catalogURL);if(source.origin!==origin.origin||v.scope!=='floor'||!v.floor_id||!v.id)throw Error('Ongeldig verdiepingsaanzicht');return {...v,[field]:source.href};});}
   if(token!==this.loadToken)return;this.renderManifest=manifest;this.extraViews=extras;
   const selected=this.availableViews().find(v=>v.id===this.viewId);if(!selected)throw Error('Aanzicht ontbreekt');this.drawNavigation();
   let next;
   if(selected.image){const image=new Image();image.src=selected.image;await image.decode();next={static:true,image:selected.image,name:selected.name,version:selected.version||'concept',view:selected,manifest};}
   else{if(this.loaded&&!this.loaded.static&&this.loaded.url?.href===(selected.manifest||url.href)&&this.loaded.view.id===selected.id&&this.loaded.manifest.release===(selected.manifest?this.loaded.manifest.release:manifest.release)){this.failure='';this.failedMode=null;this.draw();return;}next=await HousePixels.load(selected.manifest||url.href,selected.id,{mode:config.mode,hass:this._hass});if(!next.alpha)throw Error('Deze kaart vereist een transparante beeldset');next.view={...next.view,lighting_notice:selected.lighting_notice||next.view.lighting_notice};}
   if(token!==this.loadToken)return;this.loaded=next;this.refreshAreaRegistries();this.failure='';this.drawKey=null;this.draw();this.dispatchEvent(new CustomEvent('house-ready',{detail:{release:manifest.release,view:selected.id}}));
  }
  catch(e){if(token===this.loadToken){this.failure=e.message;this.draw();}}
  finally{if(this.loading===token)this.loading=null;}
 }
 draw(){
  if(!this.config)return;this.drawHero();const root=this.shadowRoot,title=root.querySelector('h2'),status=root.querySelector('p');title.textContent=this.config.title;title.hidden=!this.config.title;
  const summary=root.querySelector('.summary'),htmlSummary=this.statusHTML(),focusInfo=root.activeElement?.dataset.info;
  if(this.summaryHTML!==htmlSummary){summary.innerHTML=htmlSummary;this.summaryHTML=htmlSummary;summary.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.info)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:b.dataset.info},bubbles:true,composed:true}));}));if(focusInfo)Array.from(summary.querySelectorAll('[data-info]')).find(b=>b.dataset.info===focusInfo)?.focus();}
  summary.hidden=!htmlSummary;
  this.drawNavigation();const canvas=root.querySelector('canvas'),image=root.querySelector('.floor-image'),lightControls=root.querySelector('.controls');
  canvas.hidden=!this.loaded||!!this.loaded.static;image.hidden=!this.loaded?.static;lightControls.hidden=!this.loaded||!!this.loaded.static||!this.config.controls;
  if(!this.loaded){image.removeAttribute('src');status.textContent=this.failure||'Beeldset laden…';status.dataset.error=String(!!this.failure);return;}
  if(this.loaded.static){if(image.getAttribute('src')!==this.loaded.image)image.src=this.loaded.image;image.alt=this.loaded.name;status.textContent=[`${this.loaded.version} · Conceptbeeld; nog zonder live lichtlagen.`,this.failure?'Nieuw beeld niet geladen: '+this.failure:''].filter(Boolean).join(' — ');status.dataset.error=String(!!this.failure);return;}
  const {manifest,arrays,alpha}=this.loaded,mode=HousePixels.resolveMode(this.config.mode,arrays,this._hass);
  if(!arrays[mode]){
   const target=this.loaded,requestKey=manifest.release+target.view.id+mode;
   status.textContent=this.failure||'Lichtmoment laden…';status.dataset.error=String(!!this.failure);
   if(!this.modeLoad&&this.failedMode!==requestKey){
    this.modeLoad=requestKey;
    HousePixels.ensureMode(target,mode).then(()=>{if(this.loaded===target){this.failure='';this.failedMode=null;}}).catch(e=>{if(this.loaded===target){this.failure=e.message;this.failedMode=requestKey;}}).finally(()=>{if(this.modeLoad===requestKey)this.modeLoad=null;if(this.loaded===target)this.draw();});
   }
   return;
  }
  const states=manifest.lights.map(l=>this.lightState(l));
  const key=manifest.release+this.loaded.view.id+mode+JSON.stringify(states.map(s=>s.level));
  if(this.drawKey!==key){this.paintLivingFrame(canvas,HousePixels.compose(arrays[mode].base,arrays[mode].layers,states.map(s=>s.level),alpha),manifest.width,manifest.height,manifest.release+this.loaded.view.id);this.drawKey=key;}
  const controls=root.querySelector('.controls'),focused=root.activeElement?.dataset.entity;
  const html=this.config.controls?manifest.lights.map((l,i)=>{const id=this.bindingKey(l),s=states[i],name=this.config.names?.[l.id]||l.name.replace(/ verlichting$/,'');return `<button type="button" data-entity="${esc(id)}" aria-label="${esc(name)} ${s.on?'uitschakelen':'inschakelen'}" aria-pressed="${s.on}" ${!s.known||this.pending.has(id)?'disabled':''}><ha-icon icon="${s.on?'mdi:lightbulb':'mdi:lightbulb-outline'}" aria-hidden="true"></ha-icon><span class="label">${esc(name)}<small>${!s.known?'Niet beschikbaar':this.pending.has(id)?'Bezig…':s.on?'Aan':'Uit'}</small></span></button>`;}).join(''):'';
  if(this.controlsHTML!==html){controls.innerHTML=html;this.controlsHTML=html;controls.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>this.toggle(b.dataset.entity)));if(focused)Array.from(controls.querySelectorAll('button')).find(b=>b.dataset.entity===focused)?.focus();}
  controls.hidden=!this.config.controls;
  status.textContent=[this.failure?'Nieuwe beeldset niet geladen; vorige blijft zichtbaar: '+this.failure:'',this.actionError||''].filter(Boolean).join(' — ');status.dataset.error=String(!!this.failure||!!this.actionError);
 }
 async toggle(key){
  if(this.loaded?.static||this.pending.has(key))return;
  const light=this.loaded?.manifest.lights.find(l=>this.bindingKey(l)===key);if(!light)return;
  const area=Object.hasOwn(light,'area_id'),s=this.lightState(light),domain=area?'light':light.entity?.split('.')[0];
  if(!s.known||!['light','switch','input_boolean'].includes(domain)||!this._hass?.callService)return;
  this.pending.add(key);this.actionError='';this.draw();
  try{await this._hass.callService(domain,s.on?'turn_off':'turn_on',area?{area_id:light.area_id}:{entity_id:light.entity});}
  catch(e){this.actionError='Schakelen mislukt: '+(e.message||'verbinding verbroken');}
  finally{this.pending.delete(key);this.draw();}
 }
}
class ElevenHouseCardEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<ha-form></ha-form><p role="status"></p>';this.form=this.shadowRoot.querySelector('ha-form');this.form.addEventListener('value-changed',e=>this.changed(e.detail.value));}
 setConfig(c){this.config={...c};this.render();this.loadViews();}
 set hass(h){this._hass=h;this.render();}
 async loadViews(){
  const key=JSON.stringify([this.config.manifest,this.config.view_catalog]);if(this.catalogKey===key)return;this.catalogKey=key;const token=++this.token|| (this.token=1);
  try{const origin=new URL(this.config.manifest,document.baseURI),pointer=await HousePixels.json(origin),manifest=pointer.manifest?await HousePixels.json(new URL(pointer.manifest,origin)):pointer;let extras=[];if(this.config.view_catalog){const catalog=await HousePixels.json(new URL(this.config.view_catalog,document.baseURI));if(catalog.schema!==1||!Array.isArray(catalog.views))throw Error('Ongeldige aanzichtcatalogus');extras=catalog.views;}
   if(token!==this.token)return;this.views=[...(manifest.views||[]).map(v=>({...v,scope:v.scope||'house'})),...extras];this.error='';this.render();
  }catch(e){if(token===this.token){this.catalogKey=null;this.error='Aanzichten laden mislukt: '+e.message;this.render();}}
 }
 viewSchema(){
  const views=this.views||[],active=views.find(v=>v.id===this.config.view),scope=active?.scope||'house',floor=active?.floor_id;
  const field=(name,options)=>({name,selector:{select:{mode:'dropdown',options}}});
  const result=[field('view_scope',[{value:'house',label:'Hele huis'},{value:'floor',label:'Verdieping'}])];
  if(scope==='floor')result.push(field('view_floor',[...new Map(views.filter(v=>v.scope==='floor').map(v=>[v.floor_id,{value:v.floor_id,label:v.floor_name||v.name}])).values()]));
  result.push(field('view_camera',views.filter(v=>v.scope===scope&&(scope!=='floor'||v.floor_id===floor)).map(v=>({value:v.id,label:v.camera_name||(scope==='floor'?'Bovenaanzicht':v.name)}))));return result;
 }
 resolveView(value){const views=this.views||[],active=views.find(v=>v.id===this.config.view),scope=value.view_scope||active?.scope||'house';let choices=views.filter(v=>v.scope===scope);if(scope==='floor'){const floor=choices.some(v=>v.floor_id===value.view_floor)?value.view_floor:choices[0]?.floor_id;choices=choices.filter(v=>v.floor_id===floor);}return (choices.find(v=>v.id===value.view_camera)||choices[0])?.id;}
 changed(value){const view=this.resolveView(value),next={...this.config,...value};delete next.view_scope;delete next.view_floor;delete next.view_camera;if(view)next.view=view;this.config=next;this.render();this.loadViews();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));}
 render(){if(!this.config||!this.form)return;const base=ElevenHouseCard.getConfigForm(),active=(this.views||[]).find(v=>v.id===this.config.view);this.form.hass=this._hass;this.form.schema=[...this.viewSchema(),...base.schema.filter(s=>!['view','manifest','view_catalog'].includes(s.name)),{name:'sources',type:'expandable',title:'Geavanceerd · beeldbronnen',flatten:true,expanded:false,schema:base.schema.filter(s=>['manifest','view_catalog'].includes(s.name))}];this.form.data={...this.config,view_scope:active?.scope||'house',view_floor:active?.floor_id,view_camera:this.config.view};this.form.computeLabel=s=>({view_scope:'Aanzicht',view_floor:'Verdieping',view_camera:'Cameralocatie'}[s.name]||base.computeLabel(s));this.shadowRoot.querySelector('p').textContent=this.error||'';}
}
