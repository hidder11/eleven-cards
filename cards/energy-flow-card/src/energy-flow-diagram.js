import {uiEscape} from '../../../shared/ui-button.js';
import {uiMetric} from '../../../shared/ui-metric.js';
import {energyFlowIcon} from './energy-flow-icons.js';

// All coordinates are CSS pixels in the same scene as the native endpoint
// buttons. A wider card changes the gaps, never the alignment of text and wire.
export function energyFlowGeometry(width,nodeSize=72,nodeTop=56){
 const middle=width/2,right=width-nodeSize/2,y=nodeTop+nodeSize/2;
 const solar=[nodeSize,middle-nodeSize/2],grid=[middle+nodeSize/2,width-nodeSize];
 return {height:nodeTop+nodeSize+8,y,solar,grid,paths:{
  solar:`M${solar[0]} ${y}H${solar[1]}`,
  grid:`M${grid[1]} ${y}H${grid[0]}`,
  return:`M${nodeSize/2} ${nodeTop}V16A8 8 0 0 1 ${nodeSize/2+8} 8H${right-8}A8 8 0 0 1 ${right} 16V${nodeTop}`
 }};
}
export function layoutEnergyFlowDiagram(root){
 const scene=root?.querySelector('.circle-scene'),svg=scene?.querySelector('.flow-routes>svg');
 if(!svg||!scene.clientWidth)return;
 const nodeSize=scene.querySelector('[data-node=sun]')?.offsetWidth||72;
 const geometry=energyFlowGeometry(scene.clientWidth,nodeSize,scene.querySelector('[data-node=sun]')?.offsetTop??56);
 svg.setAttribute('viewBox',`0 0 ${scene.clientWidth} ${geometry.height}`);
 for(const [name,path] of Object.entries(geometry.paths)){
  const group=svg.querySelector(`[data-route="${name}"]`);if(!group)continue;
  group.querySelectorAll('.flow-bed,.flow-wire').forEach(node=>node.setAttribute('d',path));
  const dot=group.querySelector('.flow-dot');if(dot)dot.style.offsetPath=`path('${path}')`;
  const centres=name==='return'?[...['solar','grid'].map(key=>(geometry[key][0]+geometry[key][1])/2)]:[(geometry[name][0]+geometry[name][1])/2];
  const y=name==='return'?8:geometry.y,sign=name==='grid'?-1:1;
  group.querySelector('.flow-arrow')?.setAttribute('d',centres.map(x=>`M${x-3*sign} ${y-4}l${5*sign} 4 ${-5*sign} 4`).join(''));
 }
}

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
 const node=(kind,label,value,tone)=>{
  const aria=kind==='grid'?`${text('Netafname','Grid import')} ${number(incoming)} ${unit}, ${text('Teruglevering','Grid export')} ${number(outgoing)} ${unit}`:`${label}: ${number(value)} ${unit}`;
  return uiMetric({action:true,title:label,value:label,iconContent:energyFlowIcon(kind),compact:true,attrs:{class:'circle-node','data-node':kind,'data-direction':kind==='grid'?direction:'','data-active':String(value!=null&&value>0),'data-energy-detail':kind,'aria-haspopup':detailView==='popup'?'dialog':null,'aria-controls':detailView==='tabs'&&tabs.includes(kind)?id+'-tabs-panel-'+kind:null,disabled:detailView==='tabs'&&!tabs.includes(kind),'aria-label':aria,style:`--ui-metric-tone:var(--${tone})`}});
 };
 const reading=(name,value)=>`<div class="flow-reading" data-flow-value="${name}" data-long="${number(value).length>6}">${uiEscape(number(value))}${value==null?'':`<span class="flow-unit"> ${unit}</span>`}</div>`;
 return `<div class="circle-flow" role="group" aria-label="${text('Energiestromen tussen zon, woning en net','Energy flows between solar, home and grid')}"><div class="circle-scene"><div class="flow-routes" aria-hidden="true"><svg viewBox="4 0 412 164" preserveAspectRatio="none">
  ${route('solar','M66 104H184',own,'M126 100l5 4-5 4')}
  ${route('return','M40 78V18A8 8 0 0 1 48 10H372A8 8 0 0 1 380 18V78',returned,'M126 6l5 4-5 4M289 6l5 4-5 4')}
  ${route('grid','M354 104H236',incoming,'M294 100l-5 4 5 4')}
  </svg></div>
  ${node('sun',text('Zon','Solar'),solar,'solar')}${node('home',text('Woning','Home'),home,'house')}${node('grid',text('Net','Grid'),incoming==null||outgoing==null?null:incoming+outgoing,'grid')}
  ${reading('return',returned)}${reading('solar',own)}${reading('grid',incoming)}
 </div></div>`;
}
