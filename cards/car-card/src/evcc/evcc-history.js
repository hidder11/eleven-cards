import {uiEscape} from '../../../../shared/ui-button.js';
import {SharedGraph, graphLineStyle} from '../../../../shared/graph.js';

// Close each known interval independently so Recorder gaps remain empty.
export function evccHistoryArea(points, baseline) {
 const areas = []; let segment = [];
 const close = () => {
  if (segment.length > 1) areas.push(`${SharedGraph.path(segment, 'step')} L ${segment.at(-1)[0]} ${baseline} H ${segment[0][0]} Z`);
  segment = [];
 };
 for (const point of points) { if (Number.isFinite(point[1])) segment.push(point); else close(); }
 close(); return areas.join(' ');
}

export function evccSessionWindow(response, id, now) {
 if (!Array.isArray(response?.[0])) return null;
 const rows = response[0].filter(row => !row.entity_id || row.entity_id === id).map(row => ({time: Date.parse(row.last_changed ?? row.last_updated), state: row.state})).filter(row => Number.isFinite(row.time) && row.time > 0 && row.time <= now).sort((a,b) => a.time-b.time);
 let start = null, end = null, previous;
 for (const row of rows) {
  if (['on','true'].includes(row.state)) {
   if (previous !== true) { start = row.time; end = null; }
   previous = true;
  } else if (['off','false'].includes(row.state)) {
   if (previous === true && start != null) end = row.time;
   previous = false;
  } else { start = null; end = null; previous = undefined; }
 }
 if (start == null) return null;
 const finish = previous === true ? now : end;
 return finish > start ? {start, end: finish, active: previous === true} : null;
}

export function evccHistoryPoints(response, id, unit, start, end) {
 if (!['W', 'kW'].includes(unit) || !Array.isArray(response) || !Array.isArray(response[0])) return [];
 const values = response[0].filter(item => !item.entity_id || item.entity_id === id).map(item => {
  const time = Date.parse(item.last_updated ?? item.last_changed), raw = item.state;
  const value = raw != null && String(raw).trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) / (unit === 'W' ? 1000 : 1) : null;
  return {time, value};
 }).filter(item => Number.isFinite(item.time) && item.time <= end).sort((a, b) => a.time - b.time);
 const previous = values.filter(item => item.time <= start).at(-1), points = values.filter(item => item.time > start);
 if (previous) points.unshift({...previous, time: start});
 if (points.length && points.at(-1).time < end) points.push({...points.at(-1), time: end});
 return points;
}
export const evccHistoryMethods = {
 _resetHistory() {
  this._historyVersion = (this._historyVersion || 0) + 1; this._historyKey = null; this._historyConnectionKey = null; this._historySession = null; this._historyMissingSession = false; this._historyData = []; this._historyLoading = false; this._historyError = false; this._historyRequestedAt = 0; this._historyIndex = null;
 },
 _syncHistory() {
  if (!this.isConnected || this._offline() || !this._config?.show_session || this._activeTab !== 'session') return;
  const id = this._entities.power, unit = this._hass.states?.[id]?.attributes?.unit_of_measurement;
  const key = `${id}|${unit}`;
  const connectedId = this._entities.connected, connected = this._hass.states?.[connectedId];
  const connectionKey = `${connectedId}|${connected?.state}|${connected?.last_changed}`;
  if (this._historyKey !== key || this._historyConnectionKey !== connectionKey) { this._resetHistory(); this._historyKey = key; this._historyConnectionKey = connectionKey; }
  if (!id || !['W', 'kW'].includes(unit) || typeof this._hass.callApi !== 'function' || this._historyLoading || Date.now() - this._historyRequestedAt < 60000) return;
  const version = this._historyVersion, now = Date.now();
  this._historyRequestedAt = now; this._historyLoading = true; this._historyRevision = (this._historyRevision || 0) + 1;
  const request = (entity, start, end, significant = '0') => {
   const params = new URLSearchParams({filter_entity_id: entity, end_time: new Date(end).toISOString(), minimal_response: '', no_attributes: '', significant_changes_only: significant});
   return this._hass.callApi('GET', `history/period/${encodeURIComponent(new Date(start).toISOString())}?${params}`);
  };
  let timeout;
  const load = async () => {
   let session = this._historySession;
   if (!session && connectedId) {
    // Connection history includes pauses and survives reopening the dashboard.
    session = evccSessionWindow(await request(connectedId, 0, now, '1'), connectedId, now);
    if (version !== this._historyVersion) return;
    const changed = Date.parse(connected?.last_changed);
    // Recorder can lag behind the current connection state. Do not cache a
    // previous session as the new one, or extend an unplugged session to now.
    let recorderCurrent = true;
    if (['on','true'].includes(connected?.state) && session && (!session.active || changed > session.start)) { session = null; recorderCurrent = false; }
    if (!session) recorderCurrent = false;
    if (!session && ['on','true'].includes(connected?.state) && changed > 0 && changed < now) session = {start: changed, end: now, active: true};
    // A newer live disconnect means Recorder has not stored the latest cycle.
    // Its start is unknown: wait for discovery instead of caching an older end.
    if (['off','false'].includes(connected?.state) && session && !session.active && changed > session.end && changed <= now) {
     session = null; recorderCurrent = false;
    }
    if (['off','false'].includes(connected?.state) && session?.active) {
     session = changed > session.start && changed <= now ? {...session, end: changed, active: false} : null;
     recorderCurrent = false;
    }
    // Provisional live-state windows must retry Recorder discovery.
    this._historySession = recorderCurrent ? session : null;
   }
   if (!session) return {points: [], range: null};
   const start = session.start, end = session.active ? now : session.end;
   const response = await request(id, start, end);
   return {points: evccHistoryPoints(response, id, unit, start, end), range: {start, end}};
  };
  Promise.race([Promise.resolve().then(load), new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('history timeout')), 10000); })]).then(result => {
   if (version !== this._historyVersion) return;
   this._historyData = result.points; this._historyRange = result.range; this._historyMissingSession = !result.range; this._historyError = false;
  }).catch(() => { if (version === this._historyVersion) { this._historyError = true; this._historyData = []; } }).finally(() => {
   clearTimeout(timeout);
   if (version !== this._historyVersion) return;
   this._historyLoading = false; this._historyRevision++; this._render();
  });
  this._render();
 },
 _historyMarkup(dutch) {
  if (!this._entities.power) return '';
  const title = dutch ? 'Laadverloop' : 'Charging power';
  const points = this._historyData ?? [];
  if (!points.some(point => point.value != null)) return `<div class="history"><div class="chart-head"><span>${title}</span><span>kW</span></div><p class="notice">${this._historyLoading ? (dutch ? 'Laadverloop laden…' : 'Loading charge history…') : this._historyMissingSession ? (dutch ? 'Sessiebegin niet beschikbaar. Controleer de historie van de aangesloten-sensor.' : 'Session start unavailable. Check the connection sensor history.') : (dutch ? 'Geen vermogenshistorie beschikbaar.' : 'No power history available.')}</p></div>`;
  const {start, end} = this._historyRange, max = Math.max(2, Math.ceil(points.reduce((maximum, p) => Math.max(maximum, p.value ?? 0), 0) / 2) * 2);
  const x = time => 38 + (time - start) / (end - start) * 256, y = value => value == null ? NaN : 100 - value / max * 88;
  const graph = this._historyGraph ??= new SharedGraph();
  const coordinates = points.map(p => [x(p.time), y(p.value)]);
  const svg = graph.render({shadowRoot: this.shadowRoot, isConnected: false}, {viewBox: '0 0 300 120', defs: '<defs><linearGradient id="evcc-power-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary-color,#2196f3)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--primary-color,#2196f3)" stop-opacity="0"/></linearGradient></defs>', before: '<path class="grid-line" d="M38 12H294M38 56H294"/><path class="grid-line grid-zero" d="M38 100H294"/>', fills: [{d: evccHistoryArea(coordinates, 100), className: 'power-area', fill: 'url(#evcc-power-fade)'}], lines: [{d: SharedGraph.path(coordinates, 'step'), className: 'series-line', appearance: {...graphLineStyle('solid', 2), stroke: 'var(--primary-color,#2196f3)'}}], after: '<path class="cursor" hidden/>'});
  const format = time => new Intl.DateTimeFormat(this._hass.locale?.language ?? this._hass.language ?? 'en', {...(end-start >= 86400000 ? {day:'numeric',month:'short'} : {}),hour: '2-digit', minute: '2-digit', timeZone: this._hass.config?.time_zone ?? 'UTC'}).format(time);
  this._historyGeometry = {x, y, points};
  return `<div class="history"><div class="chart-head"><span>${title}</span><span>kW</span></div><div class="plot" tabindex="0" role="group" aria-label="${dutch ? 'Laadvermogen. Gebruik links en rechts voor meetpunten.' : 'Charging power. Use left and right for readings.'}">${svg}<span class="point hover-dot" aria-hidden="true" hidden></span>${[max, max / 2, 0].map((value, index) => `<span class="axis-y" style="top:${10 + index * 36.6667}%">${value}</span>`).join('')}<div class="tooltip" hidden><strong></strong><span><i style="--series-color:var(--primary-color)"></i><b></b></span></div></div><div class="chart-axis">${[start, (start + end) / 2, end].map(time => `<span>${uiEscape(format(time))}</span>`).join('')}</div><p class="sr-only chart-readout" aria-live="polite"></p></div>`;
 },
 _bindHistory() {
  const plot = this.shadowRoot.querySelector('.plot');
  if (!plot) return;
  const {points, x, y} = this._historyGeometry, tooltip = plot.querySelector('.tooltip');
  const hide = () => { tooltip.hidden = true; plot.querySelector('.cursor').setAttribute('hidden', ''); plot.querySelector('.point').setAttribute('hidden', ''); };
  const select = index => {
   this._historyIndex = Math.max(0, Math.min(points.length - 1, index));
   const point = points[this._historyIndex];
   if (point.value == null) { hide(); return; }
   const cursor = plot.querySelector('.cursor'), dot = plot.querySelector('.point');
   cursor.removeAttribute('hidden'); dot.removeAttribute('hidden'); cursor.setAttribute('d', `M${x(point.time)} 12V100`); dot.style.left = `${x(point.time) / 300 * 100}%`; dot.style.top = `${y(point.value) / 120 * 100}%`;
   const language = this._hass.locale?.language ?? this._hass.language ?? 'en';
   tooltip.hidden = false; tooltip.querySelector('strong').textContent = new Intl.DateTimeFormat(language, {...(this._historyRange.end-this._historyRange.start >= 86400000 ? {day:'numeric',month:'short'} : {}),hour: '2-digit', minute: '2-digit', timeZone: this._hass.config?.time_zone ?? 'UTC'}).format(point.time);
   tooltip.querySelector('b').textContent = new Intl.NumberFormat(language, {maximumFractionDigits: 2}).format(point.value) + ' kW';
   tooltip.style.left = x(point.time) < 166 ? 'auto' : '38px'; tooltip.style.right = x(point.time) < 166 ? '6px' : 'auto';
   this.shadowRoot.querySelector('.chart-readout').textContent = tooltip.textContent;
  };
  plot.addEventListener('pointermove', event => {
   const rect = plot.getBoundingClientRect(), position = (event.clientX - rect.left) / rect.width * 300;
   select(points.reduce((best, point, index) => Math.abs(x(point.time) - position) < Math.abs(x(points[best].time) - position) ? index : best, 0));
  });
  plot.addEventListener('pointerleave', hide); plot.addEventListener('blur', hide);
  plot.addEventListener('focus', () => select(this._historyIndex ?? points.length - 1));
  plot.addEventListener('keydown', event => {
   const index = this._historyIndex ?? points.length - 1;
   const next = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: points.length - 1}[event.key];
   if (event.key === 'Escape') hide();
   if (next != null) { event.preventDefault(); select(next); }
  });
 },
};
