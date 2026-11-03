// Local isolated Scene Engine frontend; backend unchanged.
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

/* Eleven Scene Engine — local proposal, no dependencies or automatic actions. */
const text = (value, fallback = '—') => value === null || value === undefined || value === '' ? fallback : String(value);
const node = (tag, value, cls) => { const n = document.createElement(tag); if (value !== undefined) n.textContent = text(value); if (cls) n.className = cls; return n; };
const validConfig = c => {
  if (!c || typeof c.entity !== 'string' || !/^(?:eleven_scene_engine|scene_engine)\.[a-z0-9_]+$/.test(c.entity)) throw new Error('Kies een scene_engine of eleven_scene_engine entiteit.');
  if (typeof c.reset_entity !== 'string' || !/^button\.[a-z0-9_]+$/.test(c.reset_entity)) throw new Error('Kies expliciet een reset-knop (button.*).');
  if (c.name !== undefined && typeof c.name !== 'string') throw new Error('Naam moet tekst zijn.');
  if (c.show_details !== undefined && typeof c.show_details !== 'boolean') throw new Error('show_details moet true of false zijn.');
};
class ElevenSceneEngineCard extends HTMLElement {
  static getConfigForm() {
    const labels = {entity:'Scene engine', reset_entity:'Reset-knop', name:'Naam (optioneel)', show_details:'Aanvraagdetails tonen'};
    return {schema:[
      {name:'entity', required:true, selector:{entity:{domain:['eleven_scene_engine','scene_engine']}}},
      {name:'reset_entity', required:true, selector:{entity:{domain:'button'}}},
      {name:'name', selector:{text:{}}}, {name:'show_details', selector:{boolean:{}}}
    ], computeLabel:s=>labels[s.name], computeHelper:s=>s.name === 'reset_entity' ? 'Kies de reset-knop van deze engine. De kaart raadt geen doel.' : undefined, assertConfig:config=>{ for (const key of ['entity','reset_entity','name']) if (config[key] !== undefined && typeof config[key] !== 'string') throw new Error(`${key} moet tekst zijn.`); if (config.show_details !== undefined && typeof config.show_details !== 'boolean') throw new Error('show_details moet true of false zijn.'); }};
  }
  static getStubConfig() { return {entity:'', reset_entity:'', show_details:true}; }
  constructor() {
    super(); this.attachShadow({mode:'open'}); this._generation = 0; this._pending = false;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#202124);font-family:var(--ha-font-family,system-ui,sans-serif);font-size:14px;line-height:1.45;--ese-border:var(--divider-color,#dadce0);--ese-muted:var(--secondary-text-color,#5f6368);--ese-accent:var(--primary-color,#006b96)}
      *{box-sizing:border-box}ha-card{display:block;padding:20px;background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--ese-border));border-radius:var(--ha-card-border-radius,16px);box-shadow:var(--ha-card-box-shadow,none)}
      h2,h3,p,dl{margin:0}h2{font-size:17px;line-height:1.4;font-weight:600}h3{font-size:18px} .eyebrow,.muted,dt{color:var(--ese-muted);font-size:12px}.eyebrow{margin-bottom:4px}.winner{border-left:3px solid var(--ese-accent);padding-left:12px;margin:20px 0 16px}.scene{font-size:22px;line-height:1.3;font-weight:600;margin:4px 0;overflow-wrap:anywhere}.raw{font-size:12px;color:var(--ese-muted);overflow-wrap:anywhere}.status{font-size:12px;color:var(--ese-muted);margin-top:4px}.meta{display:grid;grid-template-columns:1fr auto;gap:12px}.meta div{min-width:0}.meta dd{margin:2px 0 0;overflow-wrap:anywhere}.counts{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;font-variant-numeric:tabular-nums}.counts span{color:var(--ese-muted)}.counts strong{color:var(--primary-text-color,#202124);font-weight:600}
      details{border-top:1px solid var(--ese-border);padding-top:4px}summary{min-height:44px;cursor:pointer;align-content:center;font-weight:500}.requests{list-style:none;padding:0;margin:0}.requests li{padding:12px 0;border-top:1px solid var(--ese-border);overflow-wrap:anywhere}.request-title{font-weight:600}.diagnostics{padding:12px 0;overflow-wrap:anywhere;white-space:pre-line}.actions{margin-top:12px;padding-top:16px;border-top:1px solid var(--ese-border)}button{font:inherit;color:inherit;background:transparent;border:1px solid var(--ese-border);border-radius:8px;padding:10px 16px;min-height:44px;cursor:pointer}button:hover:not(:disabled){background:var(--secondary-background-color,#f1f3f5)}button:disabled{cursor:not-allowed;opacity:.5}button:focus-visible,summary:focus-visible{outline:3px solid var(--ese-accent);outline-offset:3px}.feedback{margin-top:8px;color:var(--ese-muted);font-size:12px;overflow-wrap:anywhere}.feedback.error{color:var(--error-color,#b3261e)}.unavailable{padding:16px 0}.hidden,[hidden]{display:none!important}
      dialog{color:var(--primary-text-color,#202124);background:var(--card-background-color,#fff);border:1px solid var(--ese-border);border-radius:12px;width:min(420px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:20px;overflow:auto;font:inherit}dialog::backdrop{background:rgb(0 0 0 / .45)}dialog p{margin:12px 0;overflow-wrap:anywhere}.dialog-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:20px}.confirm{border-color:var(--error-color,#b3261e);color:var(--error-color,#b3261e)}@media(max-width:360px){ha-card{padding:16px}.meta{grid-template-columns:minmax(0,1fr) auto;gap:8px}}
      ha-card{padding:var(--eleven-card-padding,16px)}header{display:flex;align-items:center;justify-content:space-between;gap:8px}h2{font-size:16px;line-height:1.3;color:var(--primary-text-color,#20252b);min-width:0;overflow-wrap:anywhere}.status:empty{display:none}.status{margin:0}.winner{border:0;padding:0;margin:0}.scene{font-size:18px;margin:0;font-weight:600}.counts{font-size:12px;margin:6px 0 0;gap:12px}.meta{margin:8px 0 12px}.actions{margin:0;padding:0;border:0}.feedback:empty{display:none}details{margin-top:8px;padding:0}summary{font-size:12px;color:var(--ese-muted)}#reset{font-size:12px;padding:6px 10px}#state{font-size:12px}@media(max-width:360px){ha-card{padding:var(--eleven-card-padding,16px)}}
    ${cardThemeStyles({controls:'#reset,#cancel',surfaces:'dialog'})}</style><ha-card><header><h2 id="title"></h2><button id="reset" type="button">Reset</button></header><p class="status" id="state"></p><section id="content"></section><section class="actions"><p id="feedback" class="feedback" role="status" aria-live="polite"></p></section></ha-card><dialog aria-labelledby="dialog-title" aria-describedby="dialog-description"><h3 id="dialog-title">Engine resetten?</h3><p id="dialog-description"></p><p class="raw" id="target"></p><div class="dialog-actions"><button id="cancel" type="button" autofocus>Annuleren</button><button id="confirm" class="confirm" type="button">Ja, resetten</button></div></dialog>`;
    this.$('reset').addEventListener('click',()=>this._open());
    this.$('cancel').addEventListener('click',()=>this._close());
    this.shadowRoot.querySelector('dialog').addEventListener('close',()=>this.$('reset').focus());
    this.$('confirm').addEventListener('click',()=>this._reset());
    this.shadowRoot.querySelector('dialog').addEventListener('keydown', event=>{
      if (event.key !== 'Tab') return;
      const active = this.shadowRoot.activeElement;
      if (event.shiftKey && active === this.$('cancel')) { event.preventDefault(); this.$('confirm').focus(); }
      else if (!event.shiftKey && active === this.$('confirm')) { event.preventDefault(); this.$('cancel').focus(); }
    });
  }
  $(id) { return this.shadowRoot.getElementById(id); }
  setConfig(config) {
    validConfig(config); this._config = {...config}; this._generation++; this._feedback = ''; this._error = false; this._refreshed = false; this._watch = null; this._close(); this._render();
  }
  set hass(hass) {
    this._hass = hass;
    if (this._watch && this._fingerprint() !== this._watch && this._entityAvailable()) this._refreshed = true;
    this._render();
  }
  getCardSize() { return 2; }
  getGridOptions() { return {columns:12, min_columns:6, rows:'auto'}; }
  _entity() { return this._hass?.states?.[this._config?.entity]; }
  _fingerprint() { const e = this._entity(); return JSON.stringify([e?.last_updated,e?.state,e?.attributes]); }
  _entityAvailable() { const e = this._entity(); return !!e && !['unknown','unavailable'].includes(e.state) && this._hass?.connected !== false && this._hass?.connection?.connected !== false; }
  _reason() {
    if (!this._hass) return 'Status laden…';
    if (this._hass.connected === false || this._hass.connection?.connected === false) return 'Geen verbinding. Laatste waarden worden niet getoond.';
    if (!this._entity()) return 'Engine-entiteit niet gevonden. Controleer de configuratie.';
    if (this._entity().state === 'unknown') return 'Engine-status is nog onbekend.';
    if (!this._entityAvailable()) return 'Engine is niet beschikbaar.';
    const b = this._hass.states?.[this._config.reset_entity];
    if (!b || b.state === 'unavailable') return 'Reset-knop niet beschikbaar. Controleer het gekozen doel.';
    if (!this._hass.services?.button?.press || typeof this._hass.callService !== 'function') return 'Geen toegang tot button.press. Controleer rechten of verbinding.';
    return '';
  }
  _name(value) { return this._hass?.states?.[value]?.attributes?.friendly_name || value; }
  _render() {
    if (!this._config) return;
    const e = this._entity(), a = e?.attributes || {}, effective = a.effective_request;
    const available = this._entityAvailable();
    this.$('title').textContent = this._config.name || a.engine || 'Scene engine';
    this.$('state').textContent = !this._hass ? 'Status laden…' : e?.state === 'unknown' ? 'Status onbekend' : !available ? 'Niet beschikbaar' : effective?.is_default ? 'Standaardscene' : '';
    const content = this.$('content'), wasOpen = content.querySelector('details')?.open;
    // A focused disclosure must survive frequent hass updates.
    const focusSummary = this.shadowRoot.activeElement?.tagName === 'SUMMARY';
    content.replaceChildren();
    if (!available) content.append(node('p',this._reason(),'unavailable'));
    else {
      const win = node('div',undefined,'winner');
      const scene = effective?.scene || (e.state !== 'idle' ? e.state : null);
      win.append(node('p',scene ? this._name(scene) : 'Geen actieve scene','scene'));

      content.append(win);
      const meta = node('dl',undefined,'meta');
      for (const [label,value] of [['Winnende aanvraag',effective?.is_default ? 'Standaard (fallback)' : effective?.identifier],['Prioriteit',effective?.priority]]) {
        const cell = node('div'); cell.append(node('dt',label),node('dd',text(value))); meta.append(cell);
      }

      const counts = node('div',undefined,'counts');
      for (const [label,count] of [['actief',a.active_request_count ?? a.active_requests?.length],['niet actief',a.non_active_request_count ?? a.non_active_requests?.length]]) {
        const item = node('span'); item.append(node('strong',text(count)),document.createTextNode(' '+label)); counts.append(item);
      }
      content.append(counts);
      if (this._config.show_details !== false) {
        const details = node('details'); details.open = !!wasOpen; details.append(node('summary','Details'));
        if (scene) details.append(node('p',scene,'raw'));
        details.append(meta);
        const list = node('ul',undefined,'requests');
        const groups = [['Actief',a.active_requests],['Niet actief',a.non_active_requests]];
        let total = 0;
        for (const [label,requests] of groups) for (const request of Array.isArray(requests) ? requests : []) {
          if (!request || typeof request !== 'object') continue;
          total++; const row = node('li'); row.append(node('div',text(request.identifier),'request-title'));
          row.append(node('div',`${label} · prioriteit ${text(request.priority)}`,'muted'));
          if (request.scene) row.append(node('div',request.scene,'raw'));
          if (request.requires) row.append(node('div',`Vereist: ${text(request.requires)}`,'raw'));
          if (request.until) row.append(node('div',`Tot: ${this._date(request.until)}`,'raw'));
          list.append(row);
        }
        if (!total) list.append(node('li',a.requests?.length ? 'Aanvraagdetails ontbreken.' : 'Geen aanvragen.'));
        details.append(list,node('p','Niet actief kan ook een ondersteunende aanvraag zonder scene zijn.','muted'));
        details.append(node('p',`Revisie ${text(a.revision)} · bron ${text(a.snapshot_source)}\nStandaard: ${text(a.default_scene)}`,'diagnostics muted'));
        content.append(details); if (focusSummary) details.querySelector('summary').focus();
      }
    }
    this.$('reset').disabled = this._pending || !!this._reason();
    this.$('reset').textContent = this._pending ? 'Bezig…' : 'Reset';
    this.$('feedback').classList.toggle('error',!!this._error);
    this.$('feedback').textContent = this._feedback ? this._feedback + (this._refreshed && !this._error ? ' Nieuwe status ontvangen; dit bevestigt niet dat de opbouw klaar is.' : '') : this._reason();
    if (this._reason() && this.shadowRoot.querySelector('dialog').open) this._close();
  }
  _date(value) { const d = new Date(value); if (Number.isNaN(d.getTime())) return text(value); try { return d.toLocaleString(this._hass?.locale?.language || 'nl-NL'); } catch { return d.toLocaleString('nl-NL'); } }
  _open() {
    if (this._pending || this._reason()) return;
    this.$('dialog-description').textContent = `Reset ${this.$('title').textContent}? Aanvragen worden opnieuw opgebouwd. Hierdoor kan de actieve scene veranderen.`;
    this.$('target').textContent = `Doel: ${this._config.reset_entity}`;
    this.shadowRoot.querySelector('dialog').showModal();
  }
  _close() { this.shadowRoot.querySelector('dialog').close(); }
  async _reset() {
    if (!this.shadowRoot.querySelector('dialog').open || this._pending || this._reason()) return;
    const target = this._config.reset_entity, generation = this._generation, hass = this._hass;
    this._pending = true; this._feedback = 'Reset wordt verstuurd. Wacht op bevestiging.'; this._error = false; this._refreshed = false; this._watch = this._fingerprint(); this._close(); this._render();
    try {
      await hass.callService('button','press',{entity_id:target});
      if (generation === this._generation) this._feedback = 'Resetverzoek bevestigd.' + (!this._refreshed ? ' Wacht op nieuwe status; opbouw nog niet bevestigd.' : '');
    } catch (error) {
      if (generation === this._generation) { this._feedback = `Reset mislukt: ${text(error?.message || error)}. Controleer de status voordat je opnieuw probeert.`; this._error = true; this._watch = null; }
    } finally { this._pending = false; this._render(); }
  }
}
if (!customElements.get('eleven-scene-engine-card')) customElements.define('eleven-scene-engine-card',ElevenSceneEngineCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c=>c.type === 'eleven-scene-engine-card')) window.customCards.push({type:'eleven-scene-engine-card',name:'Eleven Scene Engine',description:'Actieve scene, aanvragen en een bevestigde reset.',preview:false});

})();
