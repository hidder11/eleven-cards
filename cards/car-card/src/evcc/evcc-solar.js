import {uiEscape} from '../../../../shared/ui-button.js';
import {evccPercent, evccSolarRange, evccValidSolarValue} from './evcc-utils.js';

const solarDutch = hass => String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
export function evccSolarHint(value, dutch) {
 if (value == null) return dutch ? 'Instelling niet beschikbaar.' : 'Setting unavailable.';
 if (value === 0) return dutch ? 'Start zodra er zonne-overschot is.' : 'Start as soon as solar surplus is available.';
 if (value === 100) return dutch ? 'Start bij voldoende zonne-overschot voor het minimale laadvermogen.' : 'Start when solar surplus covers the minimum charging power.';
 return dutch ? `Minimaal ${value}% van het minimale laadvermogen uit zonne-overschot.` : `At least ${value}% of the minimum charging power from solar surplus.`;
}

export const evccSolarMethods = {
 _cancelSolar() {
  clearTimeout(this._solarTimer); this._solarVersion = (this._solarVersion || 0) + 1;
  this._pendingSolar = null; this._solarDraft = null; this._solarEditing = false;
 },
 _solarValue(value) { return value==null?'\u2014':uiEscape(value)+' <span class="ui-metric-unit">%</span>'; },
 _solarMarkup(dutch) {
  const id = this._entities.solar_share;
  if (!id || !['pv', 'minpv', 'smart'].includes(this._hass.states?.[this._entities.mode]?.state)) return '';
  const entity = this._hass.states?.[id], range = evccSolarRange(entity), current = evccPercent(entity);
  const value = this._pendingSolar?.value ?? this._solarDraft ?? current;
  const disabled = !range || this._offline() || !!this._pendingSolar || typeof this._hass.callService !== 'function';
  const label = dutch ? 'Zonnevoorkeur' : 'Solar preference';
  return `<div class="solar-setting"><dl class="metrics solar-metric"><div><dt><label for="solar-share">${label}</label></dt><dd><output for="solar-share" data-solar-output>${this._config.show_controls ? this._solarValue(value) : this._reading('solar_share', dutch)}</output>${this._config.show_controls ? `<input id="solar-share" type="range" data-solar-share min="${range?.min ?? 0}" max="${range?.max ?? 100}" step="${range?.step ?? 10}" value="${value ?? 0}" aria-label="${label}" aria-valuetext="${uiEscape(value == null ? (dutch ? 'Niet beschikbaar' : 'Unavailable') : value + '%')}" aria-describedby="solar-preference-description"${disabled ? ' disabled' : ''}>` : ''}</dd></div></dl><span id="solar-preference-description" class="sr-only">${dutch ? 'Minimum aandeel zon' : 'Minimum solar share'}</span><p id="solar-hint" class="solar-hint" hidden>${uiEscape(evccSolarHint(value, dutch))}</p>${this._pendingSolar ? `<p class="notice" role="status">${dutch ? 'Solar share instellen…' : 'Setting solar share…'}</p>` : ''}${this._solarError ? `<p class="notice error" role="alert">${uiEscape(this._solarError)}</p>` : ''}</div>`;
 },
 _bindSolar() {
  const input = this.shadowRoot.querySelector('[data-solar-share]');
  if (!input) return;
  const progress = () => input.style.setProperty('--solar-position', ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100) + '%');
  progress();
  input.addEventListener('input', progress);
  input.addEventListener('pointerdown', () => { if (!input.disabled) this._solarEditing = true; });
  input.addEventListener('input', () => {
   this._solarDraft = Number(input.value);
   this.shadowRoot.querySelector('[data-solar-output]').innerHTML = this._solarValue(input.value);
   this.shadowRoot.querySelector('.solar-hint').textContent = evccSolarHint(this._solarDraft, solarDutch(this._hass));
   input.setAttribute('aria-valuetext', input.value + '%');
  });
  input.addEventListener('change', () => { this._solarEditing = false; this._changeSolar(Number(input.value)); });
  const release = () => { if (this._solarEditing) { this._solarEditing = false; this._solarDraft = null; this._solarVersion++; this._render(); } };
  input.addEventListener('pointercancel', release);
  input.addEventListener('blur', release);
  // A click without changing the value must also release deferred telemetry.
  input.addEventListener('pointerup', () => { setTimeout(release, 0); });
 },
 async _changeSolar(value) {
  const id = this._entities.solar_share, entity = this._hass.states?.[id];
  if (this._pendingSolar) return;
  this._solarDraft = null;
  if (!this._config.show_controls || this._offline() || !id?.startsWith('number.') || !evccValidSolarValue(entity, value) || typeof this._hass.callService !== 'function') { this._solarVersion++; this._render(); return; }
  if (evccPercent(entity) === value) { this._solarVersion++; this._render(); return; }
  const version = ++this._solarVersion;
  this._pendingSolar = {entity: id, value}; this._solarError = null; this._render();
  this._solarTimer = setTimeout(() => {
   if (this._solarVersion !== version) return;
   this._cancelSolar(); this._solarError = solarDutch(this._hass) ? 'Geen bevestiging van solar share ontvangen. Controleer EVCC voordat je opnieuw probeert.' : 'No solar share confirmation received. Check EVCC before retrying.'; this._render();
  }, 15000);
  try { await this._hass.callService('number', 'set_value', {entity_id: id, value}); }
  catch (error) {
   if (this._solarVersion !== version) return;
   this._cancelSolar(); this._solarError = (solarDutch(this._hass) ? 'Solar share wijzigen mislukt: ' : 'Could not change solar share: ') + (error?.message || error); this._render();
  }
 },
};
