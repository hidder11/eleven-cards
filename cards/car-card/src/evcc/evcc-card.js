import {uiPrimaryValue} from '../../../../shared/ui-primary-value.js';
import {uiMetric} from '../../../../shared/ui-metric.js';
import {headerAtmosphere,observeCardMotion} from '../../../../shared/header-atmosphere.js';
import {statusSymbol,powerMotion} from './evcc-gallery.js';
import {uiEscape,uiButton,uiButtonStyles} from '../../../../shared/ui-button.js';
import {uiTabs,bindUITabs,uiTabsStyles} from '../../../../shared/ui-tabs.js';
import {graphStyles,SharedGraph} from '../../../../shared/graph.js';
import {evccChargingView,evccFinishTime} from './evcc-presentation.js';
import {evccHistoryMethods} from './evcc-history.js';
import {EVCC_FIELDS, normalizeEvccConfig, resolveEvccEntities, loadEvccRegistry, evccStatus, evccPercent, evccImageUrl, formatEvccValue, evccNumber, evccDuration, evccVehicleName, evccModeOptions, evccSolarRange} from './evcc-utils.js';
import {evccCardStyles} from './evcc-styles.js';
import {evccSolarMethods} from './evcc-solar.js';

const evccDutch = hass => String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
const evccLabel = (field, dutch) => EVCC_FIELDS[field][dutch ? 0 : 1];
const EVCC_SESSION = ['charged_energy', 'session_price', 'charge_duration', 'session_price_per_kwh', 'solar_percentage'];
const EVCC_DETAILS = ['current', 'phases', 'vehicle_limit_soc', 'connected', 'charging', 'enabled', 'smart_cost_active', 'pv_action', 'pv_remaining'];
// Registry loading shared by the Car editor; public configuration belongs to Car.
export class EvccEditor extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this._registry=[];}
 set hass(hass){
  this._hass=hass;
  const connection=hass?.connection??hass?.callWS;
  if(connection&&connection!==this._connection){
   this._connection=connection;this._registry=[];
   loadEvccRegistry(hass).then(registry=>{if(this._connection===connection){this._registry=registry;this._render();}});
  }
  this._render();
 }
 get hass(){return this._hass;}
}

export class EvccCard extends HTMLElement {
 constructor() { super(); this.attachShadow({mode: 'open'}); this._registry = []; this._actionVersion = 0; this._solarVersion = 0; }
 setConfig(config) { this._cancelMode(); this._cancelSolar(); this._actionError = null; this._solarError = null; this._config = normalizeEvccConfig(config); this._signature = null; this._render(); }
 connectedCallback() { this._observeMotion(); this._ensureClock(); this._render(); }
 _observeMotion() { this._motionCleanup?.(); this._motionCleanup=observeCardMotion(this); }
 _ensureClock() {
  if (!this.isConnected || this._clockTimer) return;
  this._clockTimer = setInterval(() => { this._render(); this._syncHistory(); }, 1000);
 }
 set hass(hass) {
  this._hass = hass;
  const connection = hass?.connection ?? hass?.callWS;
  if (connection && connection !== this._connection) {
   this._cancelMode(); this._cancelSolar(); this._resetHistory(); this._connection = connection; this._registry = []; this._registryLoading = true;
   loadEvccRegistry(hass).then(registry => { if (this._connection === connection) { this._registry = registry; this._registryLoading = false; this._render(); } });
  }
  if (this._pendingMode && hass.states?.[this._pendingMode.entity]?.state === this._pendingMode.option) this._cancelMode();
  if (this._pendingSolar && evccPercent(hass.states?.[this._pendingSolar.entity]) === this._pendingSolar.value) this._cancelSolar();
  this._render();
 }
 get hass() { return this._hass; }
 disconnectedCallback() { this._motionCleanup?.(); this._motionCleanup=null; this._cancelMode(); this._cancelSolar(); this._tabController?.disconnect(); clearInterval(this._clockTimer); this._clockTimer = null; this._resetHistory(); this._signature = null; }
 _cancelMode() { clearTimeout(this._modeTimer); this._pendingMode = null; this._actionVersion++; }
 getCardSize() { return this._config?.compact ? 8 : 12; }
 getGridOptions() { return {columns: 12, min_columns: 6, rows: this._config?.compact ? 10 : 12, min_rows: 3}; }
 _value(field) { return formatEvccValue(field, this._hass.states?.[this._entities[field]], this._hass); }
 _metrics(fields, dutch, primary = false) {
  const rows = fields.filter(field => this._entities[field]);
  return rows.length ? `<dl class="metrics${primary ? ' primary' : ''}">${rows.map(field => `<div data-field="${field}"><dt>${uiEscape(evccLabel(field, dutch))}</dt><dd>${this._reading(field, dutch)}</dd></div>`).join('')}</dl>` : '';
 }
 _reading(field, dutch, interactive=true) {
  const value = this._value(field), id = this._entities[field];
  const unavailable = dutch ? 'Niet beschikbaar' : 'Unavailable';
  const entity=this._hass.states?.[id],sourceUnit=entity?.attributes?.unit_of_measurement;
  const unit=field==='power'&&sourceUnit==='W'?'kW':sourceUnit;
  let markup=uiEscape(value??'\u2014');
  if(value!=null&&['remaining_duration','charge_duration'].includes(field)&&evccDuration(entity,dutch?'nl':'en')){
   markup=markup.replace(/(\d+) (u|h|min)\b/g,'$1 <span class="ui-metric-unit">$2</span>');
  }else if(value!=null&&evccNumber(entity)!=null&&unit&&value.endsWith(' '+unit)){
   markup=uiEscape(value.slice(0,-unit.length).trimEnd())+' <span class="ui-metric-unit">'+uiEscape(unit)+'</span>';
  }
  if(!interactive)return id?markup:'\u2014';
  return id ? `<button type="button" data-entity="${uiEscape(id)}" title="${uiEscape(id)}" aria-label="${uiEscape(evccLabel(field, dutch) + ': ' + (value ?? unavailable))}">${markup}${value == null ? `<span class="sr-only"> ${unavailable}</span>` : ''}</button>` : '—';
 }
 _offline() { return this._hass?.connected === false || this._hass?.connection?.connected === false; }
 _modeMarkup(dutch) {
  const id = this._entities.mode, entity = this._hass.states?.[id];
  if (!id) return '';
  const options = id.startsWith('select.') && this._config.show_controls ? evccModeOptions(entity) : [];
  const disabled = this._offline() || !!this._pendingMode || typeof this._hass.callService !== 'function';
  return `<div class="mode">${options.length ? `<div class="mode-options" role="group" aria-label="${evccLabel('mode', dutch)}">${options.filter(option => option !== (entity.state === 'minpv' ? 'pv' : 'minpv') || !options.includes(entity.state === 'minpv' ? 'minpv' : 'pv')).map(option => uiButton({text: ['pv','minpv'].includes(option) ? (dutch ? 'Slim' : 'Smart') : formatEvccValue('mode', {...entity, state: option}, this._hass), variant: 'surface', disabled, attrs: {'data-mode': option, 'aria-pressed': entity.state === option}})).join('')}</div>` : `<div class="mode-reading">${this._reading('mode', dutch)}</div>`}</div>`;
 }
 async _changeMode(option) {
  const id = this._entities.mode, entity = this._hass.states?.[id];
  if (!this._config.show_controls || this._offline() || this._pendingMode || !id?.startsWith('select.') || !evccModeOptions(entity).includes(option) || entity.state === option || typeof this._hass.callService !== 'function') return;
  const version = ++this._actionVersion;
  this._pendingMode = {entity: id, option}; this._actionError = null; this._render();
  this._modeTimer = setTimeout(() => {
   if (this._actionVersion !== version) return;
   this._cancelMode(); this._actionError = evccDutch(this._hass) ? 'Nog geen bevestiging van de laadmodus ontvangen. Controleer EVCC en probeer opnieuw.' : 'No charge mode confirmation received yet. Check EVCC and try again.'; this._render();
  }, 15000);
  try { await this._hass.callService('select', 'select_option', {entity_id: id, option}); }
  catch (error) {
   if (this._actionVersion !== version) return;
   this._cancelMode(); this._actionError = (evccDutch(this._hass) ? 'Laadmodus wijzigen mislukt: ' : 'Could not change charge mode: ') + (error?.message || error); this._render();
  }
 }
 _tabItems(dutch) {
  const items = [];
  const controls = this._config.show_controls ? this._modeMarkup(dutch) + this._solarMarkup(dutch) : '';
  if (controls) items.push({value: 'controls', label: dutch ? 'Bediening' : 'Controls', content: `<div class="charging-controls">${controls}</div>${this._pendingMode ? `<p class="notice" role="status">${dutch ? 'Laadmodus wijzigen…' : 'Changing charge mode…'}</p>` : ''}${this._actionError ? `<p class="notice error" role="alert">${uiEscape(this._actionError)}</p>` : ''}`});

  const session = this._config.show_session ? this._sessionMarkup(dutch) : '';
  if (session) items.push({value: 'session', label: dutch ? 'Laadsessie' : 'Session', content: session});
  if (this._config.show_details && EVCC_DETAILS.some(field => this._entities[field])) items.push({value: 'technical', label: 'EVCC', content: this._metrics(EVCC_DETAILS, dutch)});
  return items;
 }
 _tabsMarkup(dutch) {
  const items = this._tabItems(dutch);
  if (!items.length) return '';
  // Keep the requested tab while uiTabs displays a temporary fallback.
  if (!this._registryLoading && !items.some(item => item.value === this._activeTab)) this._activeTab = items[0].value;
  if(items.length===1)return `<section class="evcc-tabs evcc-panel" aria-label="${uiEscape(items[0].label)}">${items[0].content}</section>`;
  return uiTabs({id: 'evcc', label: dutch ? 'Laadinformatie' : 'Charging information', items, selected: this._activeTab, className: 'evcc-tabs', panelClassName: 'evcc-panel'});
 }
 _sessionMarkup(dutch) {
  const metrics = this._metrics(EVCC_SESSION, dutch);
  if (!metrics && !this._entities.power) return '';
  return `<div class="session" aria-label="${dutch ? 'Laadsessie' : 'Charging session'}"><div class="session-summary">${metrics}</div>${this._historyMarkup(dutch)}</div>`;
 }
 _title(dutch) { return this._config.title || (dutch ? 'Auto laden' : 'EV charging'); }
 _statusMarkup(view) {
  return uiMetric({title:'Status',value:view.title,info:view.reason,iconContent:statusSymbol(view.kind),compact:this._config.compact,attrs:{class:'charging-status',role:'status'}});
 }
 _liveMarkup(dutch, view, now) {
  const duration = this._hass.states?.[this._entities.remaining_duration];
  if (!this._durationObserved || this._durationObserved.entity !== duration) this._durationObserved = {entity: duration, time: now};
  const finish = evccFinishTime(duration, view, this._hass, this._durationObserved.time, now);
  const charging = view.status === 'charging';
  const time = view.kind === 'done' ? (dutch ? 'Bereikt' : 'Reached') : charging ? this._reading('remaining_duration', dutch, false) : '—';
  const hint = finish ? (dutch ? 'Geschat klaar ±' : 'Estimated finish ±') + finish : (view.kind === 'done' ? (dutch ? 'Geen resterende laadtijd' : 'No remaining charge time') : view.status === 'disconnected' ? (dutch ? 'Geen actieve laadsessie' : 'No active charging session') : (dutch ? 'Geen betrouwbare schatting' : 'No reliable estimate'));
  const technical = (this._config.compact ? [] : ['phases', 'current']).filter(field => this._entities[field]).map(field => this._reading(field, dutch) + (field === 'phases' ? (dutch ? ' fasen' : ' phases') : ''));
  return '<div class="charging-readings" data-ui-metric-grid>'+uiMetric({title:evccLabel('power',dutch),valueContent:this._reading('power',dutch,technical.length>0),action:!technical.length&&!!this._entities.power,attrs:!technical.length?{'data-entity':this._entities.power||''}:{},infoContent:technical.join(' &middot; '),icon:'mdi:lightning-bolt-outline',compact:this._config.compact})+uiMetric({title:view.kind==='done'?(dutch?'Laaddoel':'Charge target'):evccLabel('remaining_duration',dutch),valueContent:time,action:charging&&!!this._entities.remaining_duration,attrs:charging?{'data-entity':this._entities.remaining_duration||''}:{},info:this._config.compact?'':hint,icon:'mdi:timer-outline',compact:this._config.compact})+'</div>';
 }

 _render() {
  if (!this._config) return;
  if (!this._hass) { this.shadowRoot.innerHTML = `<style>${evccCardStyles()}</style><ha-card aria-label="${uiEscape(this._title(false))}"><div class="content"><p class="notice">EVCC…</p></div></ha-card>`; return; }
  const hass = this._hass, states = hass.states ?? {}, dutch = evccDutch(hass), config = this._config;
  this._ensureClock();
  const previousSolar = this._entities?.solar_share, previousPower = this._entities?.power;
  this._entities = resolveEvccEntities(config, hass, this._registry, {allowFallback: !this._registryLoading});
  if (previousPower !== this._entities.power) this._resetHistory();
  if (this._historyKey && this._historyKey !== `${this._entities.power}|${states[this._entities.power]?.attributes?.unit_of_measurement}`) this._resetHistory();
  const now = Date.now(), view = evccChargingView(this._entities, states, {offline: this._offline(), dutch, now});
  const offline = hass.connected === false || hass.connection?.connected === false;
  if (previousSolar !== this._entities.solar_share) { this._cancelSolar(); this._solarError = null; }
  if (this._solarEditing) {
   if (!offline && evccSolarRange(states[this._entities.solar_share])) return;
   this._cancelSolar();
  }
  const signature = JSON.stringify([view, this._registryLoading, hass.themes?.darkMode, Math.floor(now / 30000), this._historyRevision, config, this._entities, Object.values(this._entities).map(id => states[id]), states[config.image_entity], hass.locale?.language ?? hass.language, hass.config?.time_zone, offline, this._actionVersion, this._pendingMode, this._actionError, this._solarVersion, this._pendingSolar, this._solarError, typeof hass.callService === 'function', this._extraSignature?.()]);
  if (signature === this._signature) return;
  this._signature = signature;
  const scrollTop = this.shadowRoot.querySelector('.content')?.scrollTop ?? 0;
  const focus = this.shadowRoot.activeElement, focusedEntity = focus?.dataset?.entity, focusedMode = focus?.dataset?.mode, focusedTab = focus?.dataset?.uiTab;
  const focusedSolar = focus?.hasAttribute('data-solar-share'), focusedGraph = focus?.classList?.contains('plot');
  const configured = Object.values(this._entities).some(Boolean), status = offline ? 'unknown' : evccStatus(this._entities, states);
  const vehicle = evccVehicleName(states[this._entities.vehicle]) || (dutch ? 'Elektrische auto' : 'Electric vehicle');
  const soc = evccPercent(states[this._entities.soc]), target = evccPercent(states[this._entities.target_soc]);
  const image = evccImageUrl(states[config.image_entity], hass);
  const imageWarning = dutch ? 'Autoafbeelding niet beschikbaar' : 'Vehicle image unavailable';
  this.shadowRoot.innerHTML = `<style>${uiButtonStyles()}${uiTabsStyles()}${graphStyles()}${SharedGraph.tooltipStyles()}${evccCardStyles()}${this._extraStyles?.()??''}</style><ha-card aria-label="${uiEscape(this._title(dutch))}"><div class="content" style="--header-background-opacity:${config.background_strength/100}" data-density="${config.compact ? 'compact' : 'standard'}" data-state="${status}" data-view="${view.kind}" data-tone="${view.tone}" data-theme="${hass.themes?.darkMode ? 'dark' : 'light'}" data-background="${config.background}" data-animated="${config.animate_background&&!offline&&configured&&!['disconnected','unknown'].includes(view.tone)}">
   <div class="header-region"><div class="header-background" aria-hidden="true">${headerAtmosphere(config.background)}</div><div class="header-scene"><div class="gallery-top">${!configured ? `<header><h2>${uiEscape(this._title(dutch))}</h2></header>` : ''}
   ${offline ? `<p class="notice warning" role="status">${dutch ? 'Geen verbinding met Home Assistant. Getoonde waarden zijn de laatst ontvangen gegevens.' : 'Disconnected from Home Assistant. Values shown are the last received readings.'}</p>` : ''}
   ${configured ? `<div class="hero"><div class="car-stage"><div class="battery-row">${uiPrimaryValue({value:soc==null?null:formatEvccValue('soc',states[this._entities.soc],hass).replace(/\s*%$/,''),unit:'%',subtitle:this._entities.range?(this._value('range')??'\u2014')+' '+(dutch?'actieradius':'range'):'',subtitleEntity:this._entities.range||'',entity:this._entities.soc,compact:config.compact,attrs:{class:'battery-value'}})}<div class="battery-meta"></div></div><div class="picture">${image ? `<img src="${uiEscape(image)}" alt="${uiEscape(vehicle)}"><small hidden>${imageWarning}</small>` : `<ha-icon icon="mdi:car-electric" aria-hidden="true"></ha-icon>${config.image_entity ? `<small>${imageWarning}</small>` : ''}`}</div></div>${soc != null ? `<div class="battery-track" role="progressbar" aria-label="${dutch ? 'Accuniveau' : 'Battery level'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${soc}"><div class="battery-fill" style="width:${soc}%"></div>${target != null ? `<span class="target-marker" style="left:${target}%"></span>` : ''}</div>` : ''}</div>
    </div>${this._statusMarkup(view)}</div>${this._liveMarkup(dutch, view, now)}</div>
    ${this._tabsMarkup(dutch)}` : `<p class="empty">${dutch ? 'Kies de EVCC-laadvermogensensor van je laadpunt in de configuratie. Je kunt ook afzonderlijke entiteiten opgeven.' : 'Select your loadpoint’s EVCC charge power sensor in the editor, or configure individual entities.'}</p>`}
   ${configured ? '' : '</div></div></div>'}</div></ha-card>`;
  const content = this.shadowRoot.querySelector('.content');
  content.style.setProperty('--evcc-image-scale', String(config.image_scale / 100));
  content.style.setProperty('--evcc-image-offset-y', `${config.image_offset_y}px`);
  if (this._motionState !== view.kind || this._motionEntity !== this._entities.power) {
   this._motionState = view.kind; this._motionEntity = this._entities.power; this._powerClock = null;
  }
  const speed = powerMotion(states[this._entities.power], {maxKw: config.animation_max_kw, speed: config.animation_speed}), previous = this._powerClock;
  const moving = !offline && speed.moving && ['solar', 'charging'].includes(view.kind);
  const phase = previous ? previous.phase + (previous.moving ? (now - previous.time) / 1000 / previous.seconds : 0) : 0;
  this._powerClock = {phase, time: now, seconds: speed.seconds, moving};
  content.style.setProperty('--power-duration', speed.seconds + 's');
  content.style.setProperty('--power-delay', -phase * speed.seconds + 's');
  content.style.setProperty('--power-motion', moving ? 'running' : 'paused');
  this.shadowRoot.querySelectorAll('[data-entity]').forEach(button => button.addEventListener('click', () => this.dispatchEvent(new CustomEvent('hass-more-info', {detail: {entityId: button.dataset.entity}, bubbles: true, composed: true}))));
  this.shadowRoot.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => this._changeMode(button.dataset.mode)));
  this._bindSolar(); this._bindHistory();
  this._tabController?.disconnect();
  this._tabController = bindUITabs({tabs: this.shadowRoot.querySelectorAll('[data-ui-tab]'), panels: this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'), onSelect: value => { this._activeTab = value; this._syncHistory(); }});
  const img = this.shadowRoot.querySelector('img');
  if (img) img.onerror = () => { img.hidden = true; img.nextElementSibling.hidden = false; };
  this.shadowRoot.querySelector('.content').scrollTop = scrollTop;
  if (focusedGraph) this.shadowRoot.querySelector('.plot')?.focus({preventScroll: true});
  else if (focusedSolar) this.shadowRoot.querySelector('[data-solar-share]')?.focus({preventScroll: true});
  else if (focusedEntity) [...this.shadowRoot.querySelectorAll('[data-entity]')].find(button => button.dataset.entity === focusedEntity)?.focus({preventScroll: true});
  else if (focusedMode) [...this.shadowRoot.querySelectorAll('[data-mode]')].find(button => button.dataset.mode === focusedMode)?.focus({preventScroll: true});
  else if (focusedTab) ([...this.shadowRoot.querySelectorAll('[data-ui-tab]')].find(tab => tab.dataset.uiTab === focusedTab) ?? this.shadowRoot.querySelector('[role="tab"][aria-selected="true"]'))?.focus({preventScroll: true});
  this._syncHistory();
 }
}
Object.assign(EvccCard.prototype, evccSolarMethods, evccHistoryMethods);
