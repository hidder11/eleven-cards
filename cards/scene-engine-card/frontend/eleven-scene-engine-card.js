import {withCardBackground} from '../../../shared/card-background.js';
import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiButton} from '../../../shared/ui-button.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
/* Eleven Scene Engine — local proposal, no dependencies or automatic actions. */
const text = (value, fallback = '—') => value === null || value === undefined || value === '' ? fallback : String(value);
const node = (tag, value, cls) => { const n = document.createElement(tag); if (value !== undefined) n.textContent = text(value); if (cls) n.className = cls; return n; };
const validConfig = c => {
  if (!c || typeof c.entity !== 'string' || !/^(?:eleven_scene_engine|scene_engine)\.[a-z0-9_]+$/.test(c.entity)) throw new Error('Kies een scene_engine of eleven_scene_engine entiteit.');
  if (typeof c.reset_entity !== 'string' || !/^button\.[a-z0-9_]+$/.test(c.reset_entity)) throw new Error('Kies expliciet een reset-knop (button.*).');
  if (c.name !== undefined && typeof c.name !== 'string') throw new Error('Naam moet tekst zijn.');
  if (c.show_details !== undefined && typeof c.show_details !== 'boolean') throw new Error('show_details moet true of false zijn.');
};
export class ElevenSceneEngineCard extends HTMLElement {
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
    this.shadowRoot.innerHTML = `<style>${uiActionButtonStyles()}
      :host{display:block;color:var(--primary-text-color,#202124);font-family:var(--ha-font-family,system-ui,sans-serif);font-size:14px;line-height:1.45;--ese-border:var(--divider-color,#dadce0);--ese-muted:var(--secondary-text-color,#5f6368);--ese-accent:var(--accent-color,var(--primary-color,#006b96))}
      *{box-sizing:border-box}ha-card{display:block;padding:var(--eleven-card-padding,16px);border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--ese-border))}
      h2,h3,p,dl{margin:0}h2{font-size:16px;line-height:1.3;font-weight:600;overflow-wrap:anywhere}h3{font-size:18px}header{margin-bottom:12px}
      .muted,.raw,dt{color:var(--ese-muted)}.raw,.muted,.diagnostics{font-size:12px;overflow-wrap:anywhere}.raw{margin-top:4px}.status{font-size:12px;color:var(--ese-muted);margin-bottom:6px}.status:empty{display:none}
      .winner{display:grid;grid-template-columns:32px minmax(0,1fr);column-gap:12px;row-gap:8px;padding:12px;background:var(--eleven-material-plot-background,var(--secondary-background-color,transparent))}
      .winner ha-icon{display:block;width:32px;height:32px;--mdc-icon-size:32px;align-self:center;color:var(--ese-accent);background:none;box-shadow:none}.winner[data-kind=idle] ha-icon,.winner[data-kind=default] ha-icon{color:var(--ese-muted)}
      .winner.scene-wide{grid-template-columns:minmax(0,1fr);margin-inline:calc(-1 * max(0px,calc(var(--eleven-card-padding,16px) - 4px)));padding-inline:2px}.footer.stacked #details-slot>details>summary{width:100%}.footer.stacked #reset{top:calc(var(--ese-summary-height,44px) + 8px)}.footer.stacked{min-height:calc(var(--ese-summary-height,44px) + var(--ese-reset-height,44px) + 8px)}.footer.stacked #details-slot>details>.detail-body{margin-top:calc(var(--ese-reset-height,44px) + 16px)}
      .scene{font-size:24px;line-height:1.25;font-weight:600;overflow-wrap:anywhere;min-width:0}
      .meta{grid-column:1/-1;display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px;font-size:12px}.meta>div{display:flex;align-items:baseline;gap:6px;min-width:0}.meta>div:first-child{flex:1 1 max-content}.meta dt{font-size:inherit;flex:none}.meta dd{margin:0;overflow-wrap:anywhere;min-width:0}.meta>div:last-child dd{font-variant-numeric:tabular-nums}
      .counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0;font-size:12px}.counts>div{display:flex;align-items:baseline;gap:8px;min-width:0}.counts strong{font-size:22px;line-height:1.2;font-weight:600;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.counts span{color:var(--ese-muted);overflow-wrap:anywhere}
      .request-overview{padding:0;background:transparent}
      table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;line-height:1.45}th,td{padding:8px 6px;text-align:start;vertical-align:top;overflow-wrap:anywhere}thead th{font-size:12px;font-weight:500;color:var(--ese-muted);padding-top:0}thead th:nth-child(1){width:32%}thead th:nth-child(2){width:14%}thead th:nth-child(3){width:36%}thead th:nth-child(4){width:18%}tbody tr+tr{border-top:1px solid var(--ese-border)}td:nth-child(2){text-align:end;font-variant-numeric:tabular-nums}thead th:nth-child(2){text-align:end}td:first-child{font-weight:500}td:last-child{color:var(--ese-muted)}td::before{display:none}
      .request-overview.reflow table,.request-overview.reflow tbody{display:block}.request-overview.reflow thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.request-overview.reflow tr{display:grid;grid-template-columns:minmax(0,1fr);padding:8px 0}.request-overview.reflow td{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:12px;text-align:start;padding:3px 0}.request-overview.reflow td::before{content:attr(data-label);display:block;font-size:12px;font-weight:400;color:var(--ese-muted)}.cell-value{min-width:0}.request-overview.reflow.value-wide td{grid-template-columns:minmax(0,1fr);gap:2px}.request-overview.reflow.value-wide td+td{padding-top:8px}
      /* Independent raised controls above a separate inset reading surface.
         The native details wrapper never paints behind the Reset action. */
      .footer{position:relative;font-size:13px;min-height:44px}#details-slot>details{background:transparent;box-shadow:none;border-radius:0}
      summary{display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none;width:calc(100% - 7em - 8px);min-height:44px;padding:10px 12px;cursor:pointer;font-weight:500;border:1px solid var(--ese-border);font-size:inherit;overflow-wrap:anywhere}summary::-webkit-details-marker{display:none}summary::after{content:'';width:8px;height:8px;flex:none;margin:0 2px 4px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg)}details[open]>summary::after{transform:rotate(225deg);margin-bottom:0}
      .detail-body{padding:12px;margin-top:8px;background:var(--eleven-material-plot-background,var(--secondary-background-color,transparent))}.request-group+.request-group{margin-top:16px}.request-group h3{display:flex;justify-content:space-between;gap:12px;font-size:12px;font-weight:500;margin:0 0 4px;color:var(--ese-muted)}.requests{list-style:none;padding:0;margin:0}.requests li{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:9px 0;overflow-wrap:anywhere}.requests li+li{border-top:1px solid var(--ese-border)}.request-title{font-size:13px;font-weight:600}.request-scene{font-size:12px;color:var(--ese-muted);margin-top:2px}.request-priority{font-size:14px;font-weight:500;font-variant-numeric:tabular-nums;text-align:end}.diagnostics{padding-top:12px;white-space:pre-line}.technical-requests{list-style:none;padding:0;margin:0}.technical-requests li{margin-top:12px}.technical-body{padding:0 0 8px;overflow-wrap:anywhere}
      summary:focus-visible{outline:2px solid var(--ese-accent);outline-offset:3px}#reset{position:absolute;inset-inline-end:0;top:0;width:7em}.feedback{margin-top:8px;color:var(--ese-muted);font-size:12px;overflow-wrap:anywhere}.feedback:empty,[hidden]{display:none!important}.feedback.error{color:var(--error-color,#b3261e)}.unavailable{padding:12px 0;font-size:14px;overflow-wrap:anywhere}
      dialog{color:var(--primary-text-color,#202124);background:var(--card-background-color,#fff);border:1px solid var(--ese-border);border-radius:var(--ha-card-border-radius,12px);width:min(420px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:20px;overflow:auto;font:inherit}dialog::backdrop{background:rgb(0 0 0 / .45)}dialog p{margin:12px 0;overflow-wrap:anywhere}.dialog-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:20px}
      ${cardThemeStyles({wells:'.winner,.detail-body',controls:'summary',surfaces:'dialog'})}
      /* Open is disclosure, not a pressed/selected or partly squared face. */
      summary:not(:disabled):active{box-shadow:var(--eleven-material-disclosure-pressed-shadow,none)}
      .footer details.technical{margin-top:8px;border-top:1px solid var(--ese-border);border-radius:0;background:none;box-shadow:none}.footer .technical>summary{width:100%;min-height:44px;padding:8px 0;border:0;border-radius:0;background:none;box-shadow:none;color:var(--ese-muted);font-size:12px}.footer .technical>summary:hover,.footer .technical>summary:active{background:none;box-shadow:none}.technical>summary::after{width:6px;height:6px}
      @media(forced-colors:active){.winner,.detail-body{background:Canvas;box-shadow:none;border:1px solid CanvasText}summary{background:ButtonFace;color:ButtonText}.winner ha-icon{color:CanvasText}button:focus-visible,summary:focus-visible{outline-color:Highlight}}
    </style><ha-card><header><h2 id="title"></h2></header><p class="status" id="state"></p><section id="content"></section><section class="footer"><div id="details-slot"></div>${uiButton({variant:'action',text:'Reset',attrs:{id:'reset'}})}</section><p id="feedback" class="feedback" role="status" aria-live="polite"></p></ha-card><dialog aria-labelledby="dialog-title" aria-describedby="dialog-description"><h3 id="dialog-title">Engine resetten?</h3><p id="dialog-description"></p><p class="raw" id="target"></p><div class="dialog-actions">${uiButton({variant:'action',text:'Annuleren',attrs:{id:'cancel',autofocus:true}})}${uiButton({variant:'action-danger',text:'Ja, resetten',className:'confirm',attrs:{id:'confirm'}})}</div></dialog>`;
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
  connectedCallback() {
    this._layoutObserver ||= new ResizeObserver(()=>this._fitLayout());
    this._observeLayout();
  }
  disconnectedCallback() { this._layoutObserver?.disconnect(); }
  _observeLayout() {
    this._layoutObserver?.disconnect();
    for (const target of [this.$('content'),this.shadowRoot.querySelector('.scene'),...this.shadowRoot.querySelectorAll('.request-overview,thead th,.cell-value'),this.shadowRoot.querySelector('.footer'),this.shadowRoot.querySelector('summary')]) {
      if (target) this._layoutObserver?.observe(target);
    }
    this._fitLayout();
  }
  _fitLayout() {
    if (!this.isConnected) return;
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
    const width = element=>{ context.font = getComputedStyle(element).font; return Math.max(0,...element.textContent.split(/\s+/u).map(word=>context.measureText(word).width)); };
    const scene = this.shadowRoot.querySelector('.scene'), winner = scene?.parentElement;
    if (scene) {
      const inner = this.$('content').clientWidth - 24;
      // Compare to the original 12px-padded, two-column budget, never the
      // expanded surface. This avoids a resize/unwrap oscillation at the edge.
      winner.classList.toggle('scene-wide',width(scene) > inner - 44);
    }
    const overview = this.shadowRoot.querySelector('.request-overview');
    if (overview) {
      // Always compare against the un-reflowed four-column budget: no feedback
      // from the chosen layout, so resize/text fitting cannot oscillate.
      const fractions = [.32,.14,.36,.18];
      const paint = getComputedStyle(overview);
      const budget = overview.clientWidth - parseFloat(paint.paddingLeft) - parseFloat(paint.paddingRight);
      const cells = [...overview.querySelectorAll('thead th')];
      const minimums = cells.map(width);
      for (const row of overview.querySelectorAll('tbody tr')) [...row.querySelectorAll('.cell-value')].forEach((cell,i)=>minimums[i]=Math.max(minimums[i],width(cell)));
      overview.classList.toggle('reflow',minimums.some((w,i)=>w+12 > budget*fractions[i]));
      overview.classList.toggle('value-wide',Math.max(...minimums) > (budget-12)*1.4/2.4);
    }
    const footer = this.shadowRoot.querySelector('.footer'), summary = footer.querySelector('summary');
    if (summary) {
      const budget = footer.clientWidth - this.$('reset').getBoundingClientRect().width - 8;
      footer.classList.toggle('stacked',budget < width(summary) + 24 + 12 + 8);
      // Enlarged labels may need two control rows. Reserve both before the
      // independent detail surface, including when native details is closed.
      footer.style.setProperty('--ese-summary-height',`${Math.ceil(summary.getBoundingClientRect().height)}px`);
      footer.style.setProperty('--ese-reset-height',`${Math.ceil(this.$('reset').getBoundingClientRect().height)}px`);
    } else footer.classList.remove('stacked');
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
    const content = this.$('content'), slot = this.$('details-slot'), wasOpen = slot.querySelector('details')?.open;
    const technicalOpen = slot.querySelector('.technical')?.open;
    // A focused disclosure must survive frequent hass updates.
    const focusedSummary = this.shadowRoot.activeElement?.tagName === 'SUMMARY' ? (this.shadowRoot.activeElement.parentElement.classList.contains('technical') ? 'technical' : 'main') : null;
    content.replaceChildren(); slot.replaceChildren();
    if (!available) content.append(node('p',!this._hass ? 'Wachten op de engine' : 'Geen actuele scene','unavailable'));
    else {
      const scene = effective?.scene || (e.state !== 'idle' ? e.state : null);
      const win = node('section',undefined,'winner');
      win.dataset.kind = !scene ? 'idle' : effective?.is_default ? 'default' : 'active';
      win.setAttribute('aria-label','Gekozen scene');
      const icon = node('ha-icon');
      icon.setAttribute('icon',this._hass?.states?.[scene]?.attributes?.icon || a.icon || 'mdi:palette-outline');
      icon.setAttribute('aria-hidden','true');
      win.append(icon,node('p',scene ? this._name(scene) : 'Geen actieve scene','scene'));
      const meta = node('dl',undefined,'meta');
      for (const [label,value] of [['Bron',effective?.is_default ? 'Standaard (fallback)' : effective?.identifier],['Prioriteit',effective?.priority]]) {
        const cell = node('div'); cell.append(node('dt',label),node('dd',text(value))); meta.append(cell);
      }
      win.append(meta); content.append(win);
      const counts = node('div',undefined,'counts');
      counts.setAttribute('aria-label','Aanvragen');
      for (const [label,count] of [['actief',a.active_request_count ?? a.active_requests?.length],['niet actief',a.non_active_request_count ?? a.non_active_requests?.length]]) {
        const item = node('div'); item.append(node('strong',text(count)),node('span',' '+label)); counts.append(item);
      }
      content.append(counts);
      if (this._config.show_details !== false) {
        const details = node('details'); details.open = !!wasOpen;
        details.append(node('summary','Details'));
        details.addEventListener('toggle',()=>this._fitLayout());
        const body = node('div',undefined,'detail-body');
        const requests = this._requests(a);
      const overview = node('section',undefined,'request-overview');
      const table = node('table'); table.setAttribute('aria-label','Requests'); table.setAttribute('role','table');
      const labels = ['Request','Prio','Afhankelijk van','Actief'];
      const head = node('thead'), headings = node('tr'); headings.setAttribute('role','row');
      for (const label of labels) { const th=node('th',label);th.scope='col';th.setAttribute('role','columnheader');headings.append(th); }
      head.append(headings); table.append(head);
      const tbody=node('tbody'); tbody.setAttribute('role','rowgroup');
      for (const request of requests) {
        const row=node('tr'); row.setAttribute('role','row');
        const values=[request.identifier,request.priority,request.requires,request.active];
        values.forEach((value,i)=>{const cell=node('td');cell.setAttribute('role','cell');cell.dataset.label=labels[i];cell.append(node('span',text(value),'cell-value')); row.append(cell);});
        tbody.append(row);
      }
      table.append(tbody); overview.append(table);
      if (!requests.length) overview.append(node('p',Array.isArray(a.requests)||Array.isArray(a.active_requests)||Array.isArray(a.non_active_requests)?'Geen aanvragen.':'Aanvraagdetails ontbreken.','muted'));
        body.append(overview);
        const technical = node('details',undefined,'technical'); technical.open = !!technicalOpen;
        technical.append(node('summary','Technisch'));
        const technicalBody = node('div',undefined,'technical-body');
        if (scene) technicalBody.append(node('p',scene,'raw'));
        const technicalList=node('ul',undefined,'technical-requests');
        for (const request of requests) {
          const raw=node('li');raw.append(node('div',text(request.identifier),'request-title'));
          if (request.scene) raw.append(node('div',request.scene,'raw'));
          if (request.requires) raw.append(node('div',`Vereist: ${text(request.requires)}`,'raw'));
          if (request.until) raw.append(node('div',`Tot: ${this._date(request.until)}`,'raw'));
          technicalList.append(raw);
        }
        technicalBody.append(technicalList);
        technicalBody.append(node('p','Niet actief kan ook een ondersteunende aanvraag zonder scene zijn.','muted'));
        technicalBody.append(node('p',`Revisie ${text(a.revision)} · bron ${text(a.snapshot_source)}\nStandaard: ${text(a.default_scene)}`,'diagnostics muted'));
        technical.append(technicalBody); body.append(technical);
        details.append(body); slot.append(details);
        // Restore keyboard focus without scrolling the reader back to the grip.
        if (focusedSummary) (focusedSummary === 'technical' ? technical : details).querySelector('summary').focus({preventScroll:true});
      }
    }
    this.$('reset').disabled = this._pending || !!this._reason();
    this.$('reset').textContent = this._pending ? 'Bezig…' : 'Reset';
    this.$('feedback').classList.toggle('error',!!this._error);
    this.$('feedback').textContent = this._feedback ? this._feedback + (this._refreshed && !this._error ? ' Nieuwe status ontvangen; dit bevestigt niet dat de opbouw klaar is.' : '') : this._reason();
    if (this._reason() && this.shadowRoot.querySelector('dialog').open) this._close();
    this._observeLayout();
  }
  _requests(a) {
    const active = Array.isArray(a.active_requests) ? a.active_requests : [];
    const inactive = Array.isArray(a.non_active_requests) ? a.non_active_requests : [];
    const source = Array.isArray(a.requests) ? a.requests : [...active,...inactive];
    const identifier = r=>typeof r === 'string' ? r : r && typeof r.identifier === 'string' && r.identifier ? r.identifier : null;
    const yes = new Set(active.map(identifier).filter(Boolean)), no = new Set(inactive.map(identifier).filter(Boolean));
    const seen = new Set();
    return source.flatMap(raw=>{
      const r=raw && typeof raw==='object' && !Array.isArray(raw) ? raw : {identifier:typeof raw==='string'?raw:null};
      const id=identifier(r);
      if (id && seen.has(id)) return [];
      if (id) seen.add(id);
      return [{...r,active:id && yes.has(id) && !no.has(id) ? 'Ja' : id && no.has(id) && !yes.has(id) ? 'Nee' : '—'}];
    });
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
if (!customElements.get('eleven-scene-engine-card')) customElements.define('eleven-scene-engine-card',withCardBackground(ElevenSceneEngineCard));
window.customCards = window.customCards || [];
if (!window.customCards.some(c=>c.type === 'eleven-scene-engine-card')) window.customCards.push({type:'eleven-scene-engine-card',name:'Eleven Scene Engine',description:'Actieve scene, aanvragen en een bevestigde reset.',preview:false});
