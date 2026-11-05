import {evccStatus, evccBoolean, evccNumber, evccPercent, evccAvailable} from './evcc-utils.js';

export function evccSeconds(entity) {
 const number = evccNumber(entity), factor = {s: 1, sec: 1, min: 60, h: 3600, ms: .001}[entity?.attributes?.unit_of_measurement];
 return number != null && number >= 0 && factor != null ? number * factor : null;
}
export function evccPvSeconds(entity, now) {
 if (!evccAvailable(entity)) return null;
 if (entity.attributes?.device_class === 'timestamp') {
  const deadline = Date.parse(entity.state);
  return Number.isFinite(deadline) && deadline > 0 ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
 }
 return evccSeconds(entity);
}
export function evccChargingView(entities, states, {offline = false, dutch = false, now = Date.now()} = {}) {
 const entity = field => states[entities[field]], status = offline ? 'unknown' : evccStatus(entities, states);
 const text = (nl, en) => dutch ? nl : en;
 const result = (kind, title, reason, icon, tone = ({solar:'charging',countdown:'waiting',connected:'off'}[kind] ?? kind)) => ({kind, title, reason, icon, status, tone});
 if (status === 'unknown') return result('unknown', text('Status onbekend', 'Status unknown'), text('Wacht op actuele gegevens van EVCC', 'Waiting for current EVCC data'), 'mdi:help-circle-outline');
 if (status === 'disconnected') return result('disconnected', text('Niet aangesloten', 'Disconnected'), text('Sluit de laadkabel aan om te laden', 'Connect the cable to charge'), 'mdi:ev-plug-type2');
 const soc = evccPercent(entity('soc')), target = evccPercent(entity('target_soc'));
 const mode = entity('mode')?.state, solar = ['pv', 'minpv'].includes(mode);
 const action = String(entity('pv_action')?.state ?? '').toLowerCase();
 const seconds = evccPvSeconds(entity('pv_remaining'), now);
 const clock = seconds != null ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '';
 if (status !== 'charging' && soc != null && target > 0 && soc >= target) return result('done', text('Laaddoel bereikt', 'Charge target reached'), text('Auto aangesloten · laden voltooid', 'Vehicle connected · charging complete'), 'mdi:check-circle-outline');
 if (mode === 'off' && status !== 'charging') return result('connected', text('Laden uitgeschakeld', 'Charging switched off'), text('Laadmodus staat op Off', 'Charge mode is Off'), 'mdi:pause-circle-outline');
 // Only the explicit planActive signal identifies a currently active plan slot.
 // effectivePlanTime / planActiveAlt merely indicate that a plan exists.
 if (status === 'charging' && evccBoolean(entity('plan_active')) === true) return result('charging', text('Laden', 'Charging'), text('Volgens laadplanning', 'According to charging plan'), 'mdi:calendar-clock', 'planned');
 if (seconds > 0 && ((action === 'enable' && status !== 'charging') || (action === 'disable' && status === 'charging'))) {
  const enabling = action === 'enable';
  return result(enabling ? 'countdown' : (solar ? 'solar' : 'charging'), text(enabling ? 'Wachten op laden' : 'Laden', enabling ? 'Waiting to charge' : 'Charging'), text(enabling ? `Start over ${clock}` : `Stopt over ${clock}`, enabling ? `Starts in ${clock}` : `Stops in ${clock}`), 'mdi:timer-outline');
 }
 if (status === 'charging') return result(solar ? 'solar' : 'charging', text('Laden', 'Charging'), text('EVCC regelt het laden', 'EVCC controls charging'), 'mdi:lightning-bolt');
 if (['smart','now','pv','minpv'].includes(mode)) return result('waiting', text('Wachten op laden', 'Waiting to charge'), text('Auto aangesloten · laden nog niet gestart', 'Vehicle connected · charging has not started'), 'mdi:timer-sand');
 return result('connected', text('Aangesloten · laadt niet', 'Connected · not charging'), text('Wacht op vrijgave of de auto', 'Waiting for charging permission or the vehicle'), 'mdi:pause-circle-outline');
}
export function evccFinishTime(entity, view, hass, observedAt, now) {
 const seconds = evccSeconds(entity);
 if (!['solar', 'charging'].includes(view.kind) || view.status !== 'charging' || seconds == null || seconds <= 0) return null;
 const reported = Date.parse(entity?.last_updated), base = Number.isFinite(reported) ? reported : observedAt;
 const end = base + seconds * 1000;
 if (!Number.isFinite(end) || end <= now) return null;
 return new Intl.DateTimeFormat(hass.locale?.language ?? hass.language ?? 'en', {hour: '2-digit', minute: '2-digit', timeZone: hass.config?.time_zone ?? 'UTC'}).format(end);
}
export function evccEnergySplit(energy, percentage) {
 const amount = evccNumber(energy), share = evccPercent(percentage), unit = energy?.attributes?.unit_of_measurement;
 if (amount == null || amount < 0 || share == null || !['Wh', 'kWh'].includes(unit)) return null;
 const total = amount / (unit === 'Wh' ? 1000 : 1), solar = total * share / 100;
 return {solar, other: total - solar};
}
