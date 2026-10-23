import {EVCC_BACKGROUNDS} from './evcc-backgrounds.js';
// Home Assistant remains the source of truth; unknown values are never zero.
export const EVCC_FIELDS = {
 connected: ['Aangesloten', 'Connected', 'binary_sensor'],
 charging: ['Laden', 'Charging', 'binary_sensor'],
 vehicle: ['Auto', 'Vehicle', ['select', 'sensor']],
 soc: ['Accu', 'Battery', 'sensor'],
 target_soc: ['Laaddoel', 'Charge target', ['sensor', 'number']],
 range: ['Actieradius', 'Range', 'sensor'],
 mode: ['Laadmodus', 'Charge mode', ['select', 'sensor']],
 power: ['Laadvermogen', 'Charge power', 'sensor'],
 remaining_duration: ['Resterende laadtijd', 'Time remaining', 'sensor'],
 charged_energy: ['Geladen energie', 'Charged energy', 'sensor'],
 remaining_energy: ['Resterende energie', 'Energy remaining', 'sensor'],
 session_price: ['Sessiekosten', 'Session cost', 'sensor'],
 session_price_per_kwh: ['Gemiddelde laadprijs', 'Average charge price', 'sensor'],
 solar_percentage: ['Zonne-aandeel sessie', 'Session solar share', 'sensor'],
 solar_share: ['Solar share', 'Solar share', 'number'],
 charge_duration: ['Laadduur', 'Charge duration', 'sensor'],
 current: ['Laadstroom', 'Charge current', 'sensor'],
 phases: ['Actieve fasen', 'Active phases', 'sensor'],
 pv_action: ['Zonneladen: actie', 'Solar charging: action', 'sensor'],
 pv_remaining: ['Zonneladen: wachttijd', 'Solar charging: delay', 'sensor'],
 vehicle_limit_soc: ['Acculimiet auto', 'Vehicle charge limit', 'sensor'],
 co2: ['CO₂-uitstoot sessie', 'Session CO₂ intensity', 'sensor'],
 enabled: ['Laden vrijgegeven', 'Charging enabled', 'binary_sensor'],
 smart_cost_active: ['Slim laden actief', 'Smart charging active', 'binary_sensor'],
 plan_active: ['Laadplanning actief', 'Charging plan active', 'binary_sensor'],
};

// Stable ha-evcc keys, independent of translated friendly names. Order is
// intentional: effective targets take precedence over configured limits.
export const EVCC_KEYS = {
 connected: ['connected'], charging: ['charging'], vehicle: ['vehicle_name'],
 soc: ['vehicle_soc'], target_soc: ['effective_limit_soc', 'limit_soc'],
 range: ['vehicle_range'], mode: ['mode'], power: ['charge_power'],
 remaining_duration: ['charge_remaining_duration'], charged_energy: ['charged_energy'],
 remaining_energy: ['charge_remaining_energy'], session_price: ['session_price'],
 session_price_per_kwh: ['session_price_per_kwh'], solar_percentage: ['session_solar_percentage'],
 solar_share: ['solar_share'],
 charge_duration: ['charge_duration'], current: ['charge_current'], phases: ['phases_active'],
 pv_action: ['pv_action_value', 'pv_action'], pv_remaining: ['pv_remaining'],
 vehicle_limit_soc: ['vehicle_limit_soc'], co2: ['session_co2_per_kwh'],
 enabled: ['enabled'], smart_cost_active: ['smart_cost_active'],
 plan_active: ['plan_active'],
};

export function normalizeEvccConfig(input = {}) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid EVCC configuration / Ongeldige EVCC-configuratie');
 if (input.entities != null && (typeof input.entities !== 'object' || Array.isArray(input.entities))) throw Error('Invalid entities / Ongeldige entiteiten');
 const config = {...input, type: input.type || 'custom:eleven-car-card', entities: {...input.entities}};
 config.compact = (input.compact??(input.density==='compact')) === true;
 config.animate_background = input.animate_background !== false;
 config.background_strength=input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength)));
 config.background = input.background || 'lanes';
 if (!EVCC_BACKGROUNDS.some(option => option.value === config.background)) throw Error('Invalid background / Ongeldige achtergrond');
 for (const key of ['show_plan', 'vehicle_id', 'config_entry_id', 'schedule_script', 'vehicle_name']) delete config[key];
 const imageScale = input.image_scale == null || input.image_scale === '' ? 100 : Number(input.image_scale);
 if (!Number.isFinite(imageScale) || imageScale < 50 || imageScale > 300) throw Error('Image size must be between 50 and 300% / Afbeeldingsgrootte moet tussen 50 en 300% liggen');
 config.image_scale = imageScale;
 const imageOffsetY = input.image_offset_y == null || input.image_offset_y === '' ? 0 : Number(input.image_offset_y);
 if (!Number.isFinite(imageOffsetY) || imageOffsetY < -150 || imageOffsetY > 150) throw Error('Image vertical position must be between -150 and 150 px / Verticale positie moet tussen -150 en 150 px liggen');
 config.image_offset_y = imageOffsetY;
 for (const key of ['plan_time', 'plan_soc', 'plan_start', 'plan_end']) delete config.entities[key];
 for (const [key, domains] of [['entity', 'sensor'], ['image_entity', 'image'], ...Object.entries(EVCC_FIELDS).map(([key, value]) => [key, value[2]])]) {
  const value = ['entity', 'image_entity'].includes(key) ? input[key] : config.entities?.[key];
  if (value != null && value !== '' && (typeof value !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(value) || ![domains].flat().includes(value.split('.')[0]))) throw Error(`Invalid entity: ${key} / Ongeldige entiteit: ${key}`);
 }
 for (const key of ['show_session', 'show_details', 'show_controls']) config[key] = input[key] !== false;
 return config;
}

const registryKey = entry => entry?.platform === 'evcc_intg' && entry.unique_id?.startsWith('evcc_intg.') ? entry.unique_id.slice('evcc_intg.'.length) : null;
export function evccLoadpoints(hass, registry = []) {
 const ids = new Set(registry.filter(entry => !entry.disabled_by && registryKey(entry)?.endsWith('_charge_power')).map(entry => entry.entity_id));
 for (const id of Object.keys(hass?.states ?? {})) if (/^sensor\..*evcc.*_charge_power$/.test(id)) ids.add(id);
 return [...ids].filter(id => id.startsWith('sensor.') && hass?.states?.[id]).sort();
}

export function resolveEvccEntities(config, hass, registry = []) {
 const states = hass?.states ?? {}, anchor = registry.find(entry => entry.entity_id === config.entity);
 const objectId = registryKey(anchor) ?? config.entity?.split('.')[1];
 const prefix = objectId?.endsWith('_charge_power') ? objectId.slice(0, -'_charge_power'.length) : null;
 const result = {};
 for (const [field, definition] of Object.entries(EVCC_FIELDS)) {
  if (config.entities?.[field]) { result[field] = config.entities[field]; continue; }
  if (!prefix) continue;
  for (const suffix of EVCC_KEYS[field]) {
   for (const domain of [definition[2]].flat()) {
    const matches = registry.filter(entry => !entry.disabled_by && registryKey(entry) === `${prefix}_${suffix}` && entry.entity_id.startsWith(domain + '.') && (!anchor?.config_entry_id || entry.config_entry_id === anchor.config_entry_id));
    // Do not resolve an ambiguous registry key or fall back to another device.
    if (matches.length > 1) continue;
    const id = matches[0]?.entity_id ?? `${domain}.${prefix}_${suffix}`;
    if (states[id]) { result[field] = id; break; }
   }
   if (result[field]) break;
  }
 }
 if (config.entity && !config.entities?.power) result.power = config.entity;
 return result;
}

// Cache one registry read per connection, shared by card and visual editor.
const evccRegistries = new WeakMap();
export function loadEvccRegistry(hass) {
 const connection = hass?.connection ?? hass?.callWS;
 if (!connection || typeof hass?.callWS !== 'function') return Promise.resolve([]);
 if (!evccRegistries.has(connection)) {
  const request = Promise.resolve().then(() => hass.callWS({type: 'config/entity_registry/list'})).catch(() => { evccRegistries.delete(connection); return []; });
  evccRegistries.set(connection, request);
 }
 return evccRegistries.get(connection);
}

export function evccBoolean(entity) {
 if (!evccAvailable(entity)) return null;
 if (['on', 'true'].includes(entity.state)) return true;
 if (['off', 'false'].includes(entity.state)) return false;
 return null;
}

export function evccStatus(entities, states) {
 const connected = evccBoolean(states[entities.connected]), charging = evccBoolean(states[entities.charging]);
 if (charging === true) return 'charging';
 if (connected === false) return 'disconnected';
 if (connected === true && charging === false) return 'connected';
 return 'unknown';
}

export function evccPercent(entity) {
 const number = evccNumber(entity), unit = entity?.attributes?.unit_of_measurement;
 return number != null && number >= 0 && number <= 100 && (!unit || unit === '%') ? number : null;
}

export function evccVehicleName(entity) {
 if (!evccAvailable(entity)) return null;
 const value = String(entity.state).trim();
 return /^(?:[-_\s]*(?:none|null|unknown|unavailable)[-_\s]*|not available)$/i.test(value) ? null : (entity.attributes?.vehicle?.name || value);
}

export function evccModeOptions(entity) {
 return evccAvailable(entity) && Array.isArray(entity.attributes?.options) ? entity.attributes.options.filter(option => typeof option === 'string' && option.length > 0) : [];
}

export function evccSolarRange(entity) {
 if (evccPercent(entity) == null) return null;
 const min = Number(entity.attributes?.min ?? 0), max = Number(entity.attributes?.max ?? 100), step = Number(entity.attributes?.step ?? 10);
 return Number.isFinite(min) && Number.isFinite(max) && Number.isFinite(step) && min >= 0 && max <= 100 && min < max && step > 0 && step <= max - min ? {min, max, step} : null;
}

export function evccValidSolarValue(entity, value) {
 const range = evccSolarRange(entity);
 return !!range && typeof value === 'number' && Number.isFinite(value) && value >= range.min && value <= range.max && Math.abs((value - range.min) / range.step - Math.round((value - range.min) / range.step)) < 1e-6;
}

export function formatEvccValue(field, entity, hass) {
 if (!evccAvailable(entity)) return null;
 const language = hass?.locale?.language ?? hass?.language ?? 'en', dutch = language.startsWith('nl');
 const unit = entity.attributes?.unit_of_measurement;
 if (['remaining_duration', 'charge_duration'].includes(field)) return evccDuration(entity, language) ?? (evccNumber(entity) != null && evccNumber(entity) >= 0 ? `${entity.state}${unit ? ' ' + unit : ''}` : null);
 if (field === 'pv_remaining' && entity.attributes?.device_class === 'timestamp') {
  const time = Date.parse(entity.state);
  if (!Number.isFinite(time) || time <= 0) return null;
  return new Intl.DateTimeFormat(language, {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: hass?.config?.time_zone ?? 'UTC'}).format(time);
 }
 if (['connected', 'charging', 'enabled', 'smart_cost_active', 'plan_active'].includes(field)) {
  const value = evccBoolean(entity);
  return value == null ? null : value ? (dutch ? 'Ja' : 'Yes') : (dutch ? 'Nee' : 'No');
 }
 if (['soc', 'target_soc', 'vehicle_limit_soc', 'solar_percentage', 'solar_share'].includes(field) && evccPercent(entity) == null) return null;
 if (field === 'mode') return ({off: ['Off', 'Off'], pv: ['Zon', 'Solar'], minpv: ['Min + zon', 'Min + solar'], now: ['Snel', 'Fast'], smart: ['Smart', 'Smart']})[entity.state]?.[dutch ? 0 : 1] ?? entity.state;
 const number = evccNumber(entity);
 if (number != null) {
  const converted = field === 'power' && unit === 'W' ? number / 1000 : number;
  const displayUnit = field === 'power' && unit === 'W' ? 'kW' : unit;
  const digits = field === 'session_price_per_kwh' ? 3 : ['soc', 'target_soc', 'solar_percentage', 'solar_share', 'range', 'phases', 'vehicle_limit_soc'].includes(field) ? 0 : 2;
  return new Intl.NumberFormat(language, {maximumFractionDigits: digits, minimumFractionDigits: field === 'session_price' ? 2 : 0}).format(converted) + (displayUnit ? ' ' + displayUnit : '');
 }
 return hass?.formatEntityState?.(entity) ?? entity.state;
}

export function evccNumber(entity) {
 const value = entity?.state;
 if (value == null || String(value).trim() === '' || ['unknown', 'unavailable'].includes(value)) return null;
 const number = Number(value);
 return Number.isFinite(number) ? number : null;
}

export function evccAvailable(entity) {
 return entity?.state != null && !['unknown', 'unavailable', ''].includes(String(entity.state));
}

export function evccDuration(entity, language = 'en') {
 const value = evccNumber(entity);
 if (value == null || value < 0) return null;
 const unit = entity.attributes?.unit_of_measurement;
 const factors = {s: 1, sec: 1, min: 60, h: 3600, ms: .001};
 if (!(unit in factors)) return null;
 const minutes = Math.round(value * factors[unit] / 60);
 const hours = Math.floor(minutes / 60);
 return hours ? `${hours} ${language.startsWith('nl') ? 'u' : 'h'} ${minutes % 60} min` : `${minutes} min`;
}

// Image entities expose a tokenized entity_picture; never embed credentials or
// manufacture an unauthenticated /api/image_proxy URL.
export function evccImageUrl(entity, hass) {
 if (!evccAvailable(entity)) return null;
 const picture = entity.attributes?.entity_picture;
 if (typeof picture !== 'string' || !picture.trim()) return null;
 if (picture.startsWith('/') && !picture.startsWith('//')) return hass?.hassUrl ? hass.hassUrl(picture) : picture;
 try {
  const url = new URL(picture);
  return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
 } catch { return null; }
}
