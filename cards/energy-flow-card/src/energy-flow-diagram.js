import {uiEscape} from '../../../shared/ui-button.js';
import {uiMetric} from '../../../shared/ui-metric.js';
import {energyFlowIcon} from './energy-flow-icons.js';

export function energyFlowDiagram(data,history,nl,format,{detailView='popup',tabs=[],id='energy-flow'}={}){
 const text=(a,b)=>nl?a:b,unit=history?'kWh':'kW',number=value=>value==null?'—':format(value);
 const {solar,home,import:incoming,export:outgoing}=data;
 const direction=incoming==null||outgoing==null?'unknown':incoming>0&&outgoing>0?'both':incoming>0?'import':outgoing>0?'export':'idle';
 // Battery storage makes the source of home consumption ambiguous. Do not
 // invent a solar-to-home amount; imported/exported grid totals remain valid.
 const own=data.battery||solar==null||outgoing==null||home==null?null:Math.min(home,Math.max(0,solar-outgoing));
 const returned=data.battery||solar==null||outgoing==null?null:Math.min(solar,Math.max(0,outgoing));
 const total=(own||0)+(incoming||0)+(returned||0);
 const route=(name,path,amount,arrow)=>{
  const active=amount!=null&&amount>0,duration=6-Math.min(1,(amount||0)/Math.max(total,1))*4.5;
  return `<g class="flow-route" data-route="${name}" data-active="${active}"><path class="flow-bed" d="${path}"/><path class="flow-wire" d="${path}"/><path class="flow-arrow" d="${arrow}"/>${active&&!history?`<circle class="flow-dot" r="2.7" style="offset-path:path('${path}');--route-duration:${duration}s"/>`:''}</g>`;
 };
 const node=(kind,label,value,x,tone)=>{
  const aria=kind==='grid'?`${text('Netafname','Grid import')} ${number(incoming)} ${unit}, ${text('Teruglevering','Grid export')} ${number(outgoing)} ${unit}`:`${label}: ${number(value)} ${unit}`;
  return `<foreignObject x="${x-36}" y="68" width="72" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="height:100%">${uiMetric({action:true,title:label,value:label,iconContent:energyFlowIcon(kind),compact:true,attrs:{class:'circle-node','data-node':kind,'data-direction':kind==='grid'?direction:'','data-active':String(value!=null&&value>0),'data-energy-detail':kind,'aria-haspopup':detailView==='popup'?'dialog':null,'aria-controls':detailView==='tabs'&&tabs.includes(kind)?id+'-tabs-panel-'+kind:null,disabled:detailView==='tabs'&&!tabs.includes(kind),'aria-label':aria,style:`--ui-metric-tone:var(--${tone})`}})}</div></foreignObject>`;
 };
 const reading=(name,value,x,y)=>`<text class="flow-reading" data-flow-value="${name}" data-long="${number(value).length>6}" x="${x}" y="${y}" text-anchor="middle">${uiEscape(number(value))}${value==null?'':`<tspan class="flow-unit"> ${unit}</tspan>`}</text>`;
 return `<div class="circle-flow" role="group" aria-label="${text('Energiestromen tussen zon, woning en net','Energy flows between solar, home and grid')}"><div class="circle-scene"><svg viewBox="4 0 412 164">
  ${route('solar','M66 104H184',own,'M126 100l5 4-5 4')}
  ${route('return','M40 78V18A8 8 0 0 1 48 10H372A8 8 0 0 1 380 18V78',returned,'M126 6l5 4-5 4M289 6l5 4-5 4')}
  ${route('grid','M354 104H236',incoming,'M294 100l-5 4 5 4')}
  ${node('sun',text('Zon','Solar'),solar,40,'solar')}${node('home',text('Woning','Home'),home,210,'house')}${node('grid',text('Net','Grid'),incoming==null||outgoing==null?null:incoming+outgoing,380,'grid')}
  ${reading('return',returned,210,36)}${reading('solar',own,128,89)}${reading('grid',incoming,292,89)}
 </svg></div></div>`;
}
