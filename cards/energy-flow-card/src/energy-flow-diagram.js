import {uiEscape} from '../../../shared/ui-button.js';
import {energyFlowIcon} from './energy-flow-icons.js';

export function energyFlowDiagram(data,history,nl,format){
 const text=(a,b)=>nl?a:b,unit=history?'kWh':'kW',number=value=>value==null?'—':format(value);
 const {solar,home,import:incoming,export:outgoing}=data;
 const direction=incoming==null||outgoing==null?'unknown':incoming>0&&outgoing>0?'both':incoming>0?'import':outgoing>0?'export':'idle';
 // Battery storage makes the source of home consumption ambiguous. Do not
 // invent a solar-to-home amount; imported/exported grid totals remain valid.
 const own=data.battery||solar==null||outgoing==null||home==null?null:Math.min(home,Math.max(0,solar-outgoing));
 const returned=data.battery||solar==null||outgoing==null?null:Math.min(solar,Math.max(0,outgoing));
 const total=(own||0)+(incoming||0)+(returned||0);
 const route=(name,path,amount)=>{
  const active=amount!=null&&amount>0,duration=6-Math.min(1,(amount||0)/Math.max(total,1))*4.5;
  return `<g class="flow-route" data-route="${name}" data-active="${active}"><path class="flow-bed" d="${path}"/><path class="flow-wire" d="${path}"/>${active&&!history?`<circle class="flow-dot" r="2.2" style="offset-path:path('${path}');--route-duration:${duration}s"/>`:''}</g>`;
 };
 const node=(kind,label,value)=>{
  const aria=kind==='grid'?`${text('Netafname','Grid import')} ${number(incoming)} ${unit}, ${text('Teruglevering','Grid export')} ${number(outgoing)} ${unit}`:`${label}: ${number(value)} ${unit}`;
  return `<div class="circle-node" data-node="${kind}" data-direction="${kind==='grid'?direction:''}" data-active="${value!=null&&value>0}" role="img" aria-label="${uiEscape(aria)}">${energyFlowIcon(kind)}<span>${uiEscape(label)}</span></div>`;
 };
 return `<div class="circle-flow" role="group" aria-label="${text('Energiestromen tussen zon, woning en net','Energy flows between solar, home and grid')}"><div class="circle-scene"><svg viewBox="0 0 360 200" aria-hidden="true">
  ${route('solar','M180 42V74C180 110 234 145 304 145',own)}
  ${route('return','M180 42V74C180 110 126 145 56 145',returned)}
  ${route('grid','M56 145H304',incoming)}
 </svg>${node('sun',text('Zon','Solar'),solar)}${node('home',text('Woning','Home'),home)}${node('grid',text('Net','Grid'),incoming==null||outgoing==null?null:incoming+outgoing)}</div></div>`;
}
