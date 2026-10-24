import '../dist/eleven-energy-flow-card.js';

// Preview-only compositions around the production card and generic period popup.
const bolt='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h6l-1 8 9-13h-6z"/></svg>';
const styles=`
.header-region{grid-template-columns:minmax(0,1fr) 100px;column-gap:8px}
.content[data-view=history] .toolbar,.toolbar{grid-column:2;grid-row:1;max-width:100%;width:100%;justify-self:end}
.content[data-view=history] .circle-flow{grid-row:2}
.content[data-view=history] .header-region>[data-ui-metric]{grid-row:3}
.energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:42px;--ui-primary-unit-size:12px}
.energy-heading:has([data-long=true]){--ui-primary-size:25px}
.toolbar .header-actions,.toolbar .chart-controls,.toolbar .view-period{width:100%}
.toolbar .view-period .period-trigger{padding:4px 6px;gap:3px;min-height:32px}
.toolbar .view-period .period-trigger>span{font-size:11px}
.toolbar .view-period>[data-view-button]{min-height:32px;font-size:11px}
.preview-navigation{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:12px;margin-top:12px;border-top:1px solid var(--divider-color)}
.preview-navigation>[data-period]{width:36px;height:32px}
.preview-navigation [data-period=now]{width:auto;padding:4px 12px}
.preview-navigation>[data-view-button]{padding:4px 10px;min-height:32px;margin-inline-end:auto}
.preview-navigation svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2}
:host([data-layout=stack]) .toolbar .chart-controls{background:none}
:host([data-layout=stack]) .toolbar .view-period{flex-direction:column;align-items:stretch;gap:4px}
:host([data-layout=stack]) .toolbar .view-period>[data-view-button],:host([data-layout=stack]) .toolbar .period-controls{background:var(--secondary-background-color);border-radius:5px}
:host([data-layout=stack]) .toolbar .view-period .period-controls{border:0}
:host([data-layout=inline]) .toolbar .view-period>[data-view-button]{width:30px;padding:4px 6px}
:host([data-layout=inline]) .toolbar .view-period>[data-view-button] svg{width:17px;height:17px}
:host([data-layout=inline]) .toolbar .period-trigger{padding-inline:4px}
:host([data-layout=inline]) .content[data-view=live] .toolbar .view-period>[data-view-button]{width:100%;padding-inline:8px}
:host([data-layout=single]) .toolbar .view-period .period-controls{border:0}
@container(max-width:300px){.energy-heading{--ui-primary-size:36px}}
@container(max-width:270px){.energy-heading{--ui-primary-size:32px}}
@container(min-width:320px){.energy-heading{--ui-primary-size:46px;--ui-primary-unit-size:14px}.energy-heading:has([data-long=true]){--ui-primary-size:30px}}
`;
class HeaderOption extends customElements.get('eleven-energy-flow-card'){
 render(){
  super.render();
  const root=this.shadowRoot,toolbar=root.querySelector('.toolbar');if(!toolbar)return;
  let style=root.querySelector('#preview-layout');if(!style){style=document.createElement('style');style.id='preview-layout';root.append(style);}style.textContent=styles;
  const switcher=root.querySelector('[data-view-button]'),menu=root.querySelector('.period-menu');
  if(!menu)return;
  root.querySelector('.period-menu-navigation')?.remove();
  const footer=document.createElement('div');footer.className='preview-navigation';
  if(this.dataset.layout==='single')footer.append(switcher);
  for(const button of toolbar.querySelectorAll('.chart-controls>[data-period]'))footer.append(button);
  menu.append(footer);
  if(this.dataset.layout==='inline'){
   switcher.innerHTML=bolt;switcher.title='Toon actueel vermogen';
  }
 }
}
customElements.define('eleven-header-option',HeaderOption);

const prefs={energy_sources:[{type:'solar',stat_energy_from:'sensor.solar_energy',stat_rate:'sensor.solar_power'},{type:'grid',stat_energy_from:'sensor.grid_import_energy',stat_energy_to:'sensor.grid_export_energy',stat_rate:'sensor.grid_power'}]};
const state=(value,unit)=>({state:String(value),attributes:{unit_of_measurement:unit}});
const mock={language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:true},states:{'sensor.solar_power':state(4600,'W'),'sensor.grid_power':state(-800,'W')},callWS:async message=>{
 if(message.type==='energy/get_prefs')return structuredClone(prefs);
 if(message.type==='recorder/statistics_during_period'){
  const days=Math.max(.01,(Date.parse(message.end_time)-Date.parse(message.start_time))/86400000),amounts={'sensor.solar_energy':18.4,'sensor.grid_import_energy':7.2,'sensor.grid_export_energy':6.4};
  return Object.fromEntries(message.statistic_ids.map(id=>[id,[{start:Date.parse(message.start_time),change:amounts[id]*days}]]));
 }
 throw Error('Unexpected preview request');
}};
const cards=[...document.querySelectorAll('eleven-header-option')];
for(const card of cards){card.setConfig({default_view:'history',background:'lanes',animate_background:false});card.hass={...mock};}
document.querySelector('#width').onchange=event=>document.documentElement.style.setProperty('--example-width',event.target.value+'px');
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.setAttribute('aria-pressed',String(light));event.currentTarget.textContent=light?'Donker thema':'Licht thema';cards.forEach(card=>card.hass={...mock,themes:{darkMode:!light}});};
document.querySelector('#views').onclick=event=>{const history=cards.some(card=>card._view==='live');cards.forEach(card=>{if((card._view==='history')!==history)card.shadowRoot.querySelector('[data-view-button]').click();});event.currentTarget.textContent=history?'Toon actueel':'Toon historisch';};
window.energyHeaderOptions=cards;
