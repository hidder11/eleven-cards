import {uiTabs} from '../../../shared/ui-tabs.js';
import {uiEscape} from '../../../shared/ui-button.js';
import {entityTabContent} from '../../../shared/entity-tabs.js';
import {energyFlowDetailContent} from './energy-flow-details.js';

export const ENERGY_FLOW_TABS=[{value:'sun',nl:'Zon',en:'Solar'},{value:'home',nl:'Woning',en:'Home'},{value:'grid',nl:'Net',en:'Grid'}];
export function energyFlowTabs(host,data,nl){
 const items=host._config.detail_view==='tabs'?ENERGY_FLOW_TABS.filter(tab=>host._config.tabs.includes(tab.value)).map(tab=>({value:tab.value,label:tab[nl?'nl':'en'],content:`<div data-energy-panel="${tab.value}"><div class="energy-detail-body" aria-busy="${host._view==='history'&&!!host._detailLoading}">${energyFlowDetailContent(host,tab.value,data)}</div></div>`})):[];
 for(const [index,tab] of host._config.custom_tabs.entries())if(tab.show)items.push({value:tab.id,label:tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(index+1),content:entityTabContent(tab,host._hass,nl)});
 if(!items.length){host._activeTab=null;return '';}
 if(!items.some(tab=>tab.value===host._activeTab))host._activeTab=items.find(tab=>tab.value===host._config.default_tab)?.value??items[0].value;
 if(items.length===1)return `<div data-energy-tabs><section id="${uiEscape(host._id+'-tabs-panel-'+encodeURIComponent(items[0].value))}" class="energy-tab-panel energy-single-tab" aria-label="${uiEscape(items[0].label)}">${items[0].content}</section></div>`;
 return `<div data-energy-tabs>${uiTabs({variant:'card',id:host._id+'-tabs',label:nl?'Energiegegevens':'Energy information',items,selected:host._activeTab,className:'energy-tabs',panelClassName:'energy-tab-panel'})}</div>`;
}
export const energyFlowTabStyles=`
[data-energy-tabs]{min-width:0}
.energy-tab-panel{margin:0;padding:16px 0 0;border:0;min-width:0}
.energy-single-tab{margin-top:16px}
.energy-tab-panel>.energy-grid-metrics:first-child,.energy-tab-panel .energy-detail-body>.energy-grid-metrics:first-child{margin-top:0}
.energy-entity-value{font:inherit;color:inherit;text-align:start;overflow-wrap:anywhere;border:0;background:none;padding:0;cursor:pointer;border-radius:8px}
.energy-entity-value:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
@container(max-width:300px){.energy-home-devices dd{min-width:0;max-width:none;grid-template-columns:minmax(0,1fr) auto;font-size:15px}.energy-home-devices dd small{font-size:11px}}
`;
