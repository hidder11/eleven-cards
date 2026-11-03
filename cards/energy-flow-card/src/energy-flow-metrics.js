import {uiMetric} from '../../../shared/ui-metric.js';
import {energyFlowIcon} from './energy-flow-icons.js';

export function energyFlowMetrics(data,history,nl,format,compact=false,config={}){
 const text=(a,b)=>nl?a:b,unit=history?'kWh':'kW';
 const field=(key,title,icon,tone)=>uiMetric({title,iconContent:energyFlowIcon(icon),value:data[key]==null?null:format(data[key]),unit,compact,attrs:{'data-metric':key,style:`--ui-metric-tone:var(--${tone})`}});
 return {
  solar:config.show_field_1===false?'':field('solar',text('Zonne-energie','Solar generation'),'solar','solar'),
  grid:config.show_field_2===false&&config.show_field_3===false?'':`<div class="flow-secondary" data-ui-metric-grid style="--ui-metric-columns:${config.show_field_2===false||config.show_field_3===false?1:2}">${config.show_field_2===false?'':field('import',text('Netafname','Grid import'),'import','grid')}${config.show_field_3===false?'':field('export',text('Teruglevering','Grid export'),'export','solar')}</div>`
 };
}
