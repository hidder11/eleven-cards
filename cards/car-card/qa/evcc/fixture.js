// All values and the illustration in this fixture are synthetic.
const qaState = (state, unit, extra = {}) => ({state: String(state), attributes: {unit_of_measurement: unit, ...extra}});
const values = {
 charge_power: qaState(7.1, 'kW'), vehicle_soc: qaState(62, '%'), effective_limit_soc: qaState(80, '%'),
 connected: qaState('on'), charging: qaState('on'), vehicle_name: qaState('db:7', undefined, {vehicle:{evccName:'db:7',name:'Voorbeeldauto'}}), mode: qaState('pv', undefined, {options:['off','pv','minpv','now','smart']}),
 vehicle_range: qaState(284, 'km'), charge_remaining_duration: qaState(95, 'min'), charged_energy: qaState(12.4, 'kWh'),
 charge_remaining_energy: qaState(11.2, 'kWh'), session_price: qaState(2.38, '€'), session_price_per_kwh: qaState(.192, '€/kWh'),
 session_solar_percentage: qaState(78, '%'), charge_duration: qaState(7200, 's'), charge_current: qaState(10.3, 'A'),
 solar_share: qaState(60, '%', {min:0,max:100,step:10}),
 phases_active: qaState(3), vehicle_limit_soc: qaState(90, '%'), enabled: qaState('on'), smart_cost_active: qaState('off'),
 pv_action_value: qaState('inactive'),
 session_co2_per_kwh: qaState(43, 'g/kWh'),
};
const registry = [], states = {};
for (const [key, value] of Object.entries(values)) {
 const domain = ['connected', 'charging', 'enabled', 'smart_cost_active'].includes(key) ? 'binary_sensor' : ['mode', 'vehicle_name'].includes(key) ? 'select' : key === 'solar_share' ? 'number' : 'sensor';
 const id = key === 'charge_power' ? 'sensor.renamed_evcc_power' : `${domain}.evcc_driveway_${key}`;
 states[id] = value;
 registry.push({entity_id: id, unique_id: `evcc_intg.evcc_driveway_${key}`, platform: 'evcc_intg', config_entry_id: 'synthetic'});
}
states['sensor.evcc_garage_charge_power'] = qaState(0, 'kW');
registry.push({entity_id: 'sensor.evcc_garage_charge_power', unique_id: 'evcc_intg.evcc_garage_charge_power', platform: 'evcc_intg', config_entry_id: 'synthetic'});
states['image.example_car'] = qaState('2026-10-21T10:00:00Z', undefined, {entity_picture: '/cards/car-card/qa/evcc/car.svg'});
window.evccQA = {
 card: document.querySelector('eleven-car-card'), registry,
 config: {evcc_enabled:true,battery_style:'classic',type: 'custom:eleven-car-card', entity: 'sensor.renamed_evcc_power', image_entity: 'image.example_car'},
 calls: [], historyCalls: [],
 hass: {language: 'nl', locale: {language: 'nl'}, connected: true, config: {time_zone: 'Europe/Amsterdam'}, connection: {}, states, hassUrl: path => location.origin + path,
  callApi: async (method, url) => {
   const qa = window.evccQA; qa.historyCalls.push({method, url});
   if (qa.historyError) throw Error('Synthetic history unavailable');
   const now = Date.now(), id = new URL(url, location.origin).searchParams.get('filter_entity_id');
   if(id==='binary_sensor.evcc_driveway_connected')return [[{entity_id:id,state:'on',last_changed:new Date(now-10800000).toISOString()}]];
   if (qa.historyEmpty) return [];
   return [[0, 0, 3.6, 4.2, 5.8, 2.3, 0, 0, 3.9, 5.1, 6.4, 7.1, 7.1].map((power, index) => ({entity_id: id, state: String(power), last_changed: new Date(now - (12 - index) * 900000).toISOString()}))];
  },
  callService: async (domain, service, data) => {
   const qa = window.evccQA;qa.calls.push({domain,service,service_data:data});
   if (qa.serviceError) throw Error(qa.serviceError);
   if (domain === 'select' && !qa.holdMode) qa.update(data.entity_id,{state:data.option});
   if (domain === 'number' && !qa.holdSolar) qa.update(data.entity_id,{state:String(data.value)});
  },
  callWS: async request => {
   if (request.type === 'config/entity_registry/list') return registry;
   const qa = window.evccQA;qa.calls.push(request);
   if (qa.serviceError) throw Error(qa.serviceError);
   throw Error('Unexpected WebSocket request in EVCC fixture');
  }},
 update(id, value) { this.hass = {...this.hass, states: {...this.hass.states, [id]: {...this.hass.states[id], ...value}}}; this.card.hass = this.hass; this.editor.hass = this.hass; },
};
const qa = window.evccQA;
qa.card.setConfig(qa.config); qa.card.hass = qa.hass;
customElements.get('eleven-car-card').getConfigElement().then(editor => {
 qa.editor = editor; editor.setConfig(qa.config); editor.hass = qa.hass;
 document.querySelector('#editor').append(editor);
 editor.addEventListener('config-changed', event => { qa.config = event.detail.config; qa.card.setConfig(qa.config); });
});
qa.card.addEventListener('hass-more-info', event => { qa.lastEntity = event.detail.entityId; document.querySelector('#last-event').textContent = `Entiteitdetails: ${qa.lastEntity}`; });
document.querySelector('#theme').onclick = () => {const darkMode=document.body.classList.toggle('dark');qa.hass={...qa.hass,themes:{darkMode}};qa.card.hass=qa.hass;qa.editor.hass=qa.hass;};
document.querySelector('#charging').onclick = () => qa.update('binary_sensor.evcc_driveway_charging', {state: qa.hass.states['binary_sensor.evcc_driveway_charging'].state === 'on' ? 'off' : 'on'});
document.querySelector('#unknown').onclick = () => {
 const missing = qa.hass.states['sensor.evcc_driveway_vehicle_soc'].state !== 'unavailable';
 qa.update('sensor.evcc_driveway_vehicle_soc', {state: missing ? 'unavailable' : '62'});
 qa.update('binary_sensor.evcc_driveway_charging', {state: missing ? 'unavailable' : 'on'});
};
document.querySelector('#offline').onclick = () => { qa.hass = {...qa.hass, connected: !qa.hass.connected}; qa.card.hass = qa.hass; };
document.querySelector('#image').onclick = () => qa.update('image.example_car', {attributes: {entity_picture: qa.hass.states['image.example_car'].attributes.entity_picture.includes('?') ? '/cards/car-card/qa/evcc/car.svg' : '/cards/car-card/qa/evcc/car.svg?variant=2'}});
document.querySelector('#width').onclick = () => { const host = document.querySelector('#host'); host.style.width = host.style.width === '280px' ? '100%' : '280px'; };
