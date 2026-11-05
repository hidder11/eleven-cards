import '../dist/eleven-energy-flow-card.js';
import {energyFlowLive,energyFlowHistorical} from '../src/energy-flow-data.js';

// Design proposals only. The real card and its controls remain unchanged.
const icons={
 sun:'M12 3V1m0 22v-2M3 12H1m22 0h-2M4.2 4.2 2.8 2.8m18.4 18.4-1.4-1.4M4.2 19.8l-1.4 1.4M21.2 2.8l-1.4 1.4M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0',
 home:'m2 11 10-8 10 8M5 10v12h14V10M10 22v-8h4v8',
 grid:'m12 2-8 20M12 2l8 20M8 8h8M6 14h12M2 22h20M12 2v20M8 8l10 6M16 8 6 14',
 arrow:'M4 12h16m-6-6 6 6-6 6'
};
const icon=(kind,extra='')=>`<svg class="design-icon ${extra}" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[kind]}"/></svg>`;
const styles=`
.designer-flow{--sun:var(--solar);--net:var(--grid);--house:#9bc9b2;margin-top:24px;min-width:0;font-variant-numeric:tabular-nums}
.content[data-dark=false] .designer-flow{--house:#34785d}
.designer-flow *{box-sizing:border-box}.design-icon{display:block;width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}.sun-ink{color:var(--sun)}.net-ink{color:var(--net)}.house-ink{color:var(--house)}
.design-label{font-size:12px;line-height:1.5;color:var(--secondary-text-color)}.design-value{font-size:25px;line-height:1.25;font-weight:600;letter-spacing:-.035em;color:var(--primary-text-color);overflow-wrap:anywhere}.design-value small{margin-left:5px;font-size:12px;font-weight:400;letter-spacing:0;color:var(--secondary-text-color)}
.metric-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.metric-pair>div{min-width:0}.metric-pair dt,.metric-pair dd{margin:0}.metric-pair dd{margin-top:5px}.metric-pair dt{display:flex;align-items:center;gap:7px}.metric-pair .design-icon{width:16px;height:16px}
.house-source{display:flex;align-items:center;justify-content:space-between;gap:12px}.source-caption{display:flex;gap:10px;align-items:center}.source-caption .design-icon{width:26px;height:26px}.house-figure{position:relative;margin:8px 0 0}.house-figure>svg{width:100%;height:180px;display:block;overflow:visible}.house-figure figcaption{font-size:12px;line-height:1.5;text-align:center;color:var(--house);margin-top:-2px;min-height:18px}.house-ground{fill:var(--house);opacity:.045}.house-wall{fill:var(--secondary-background-color);stroke:var(--divider-color);stroke-width:1}.house-roof{fill:var(--secondary-background-color);stroke:var(--sun);stroke-opacity:.5;stroke-width:1.2}.house-detail{fill:none;stroke:var(--secondary-text-color);stroke-opacity:.34;stroke-width:1}.house-window{fill:var(--sun);fill-opacity:.12;stroke:var(--sun);stroke-opacity:.4;stroke-width:1}.house-panel{fill:var(--sun);fill-opacity:.09;stroke:var(--sun);stroke-opacity:.65;stroke-width:.8}.house-wire{fill:none;stroke:currentColor;stroke-opacity:.3;stroke-width:1.4}.house-pulse{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-dasharray:2 32;animation:design-travel 4s linear infinite;filter:drop-shadow(0 0 2px currentColor)}.house-idle{opacity:.2}.net-pair{padding-top:18px;border-top:1px solid var(--divider-color);margin:18px 0 0}.net-pair>div+div{padding-left:16px;border-left:1px solid var(--divider-color)}
.solar-allocation{padding:0}.allocation-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.allocation-top .design-icon{width:24px;height:24px}.allocation-hero{display:flex;align-items:baseline;gap:12px;margin:18px 0}.allocation-percent{font-size:52px;line-height:1;letter-spacing:-.06em;font-weight:500;color:var(--sun)}.allocation-copy{font-size:12px;line-height:1.5;color:var(--secondary-text-color);max-width:110px}.allocation-bar{display:flex;height:44px;gap:4px;border-radius:7px;overflow:hidden;background:var(--secondary-background-color)}.allocation-bar>span{position:relative;display:block;min-width:0;height:100%;overflow:hidden}.allocation-own{background:var(--sun);background:color-mix(in srgb,var(--sun) 72%,var(--secondary-background-color))}.allocation-export{background:var(--net);background:color-mix(in srgb,var(--net) 65%,var(--secondary-background-color))}.allocation-bar[data-empty=true]{background:repeating-linear-gradient(120deg,transparent 0 8px,var(--divider-color) 8px 9px)}.allocation-bar .allocation-light{position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,#ffffff45 50%,transparent 80%);transform:translateX(-100%);animation:design-light 4s ease-in-out infinite}.allocation-export .allocation-light{animation-delay:1.2s}.allocation-metrics{margin:16px 0 0}.allocation-metrics dt:before{content:'';display:block;width:7px;height:7px;border-radius:2px;background:var(--ink);flex:none}.allocation-metrics>div:first-child{--ink:var(--sun)}.allocation-metrics>div:last-child{--ink:var(--net)}.allocation-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--divider-color);padding-top:16px;margin-top:22px}.allocation-footer .source-caption{gap:8px}.allocation-footer .design-icon{width:18px;height:18px}
.route-list{display:grid;gap:20px;margin:0;padding:0;list-style:none}.route-row{--route:var(--sun);padding:0 0 19px;border-bottom:1px solid var(--divider-color)}.route-row:last-child{border:0;padding-bottom:0}.route-row[data-source=grid]{--route:var(--net)}.route-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.route-name{display:flex;align-items:center;gap:9px;min-width:0}.route-symbol{width:32px;height:32px;border-radius:7px;display:grid;place-items:center;color:var(--route);background:color-mix(in srgb,var(--route) 9%,var(--secondary-background-color));flex:none}.route-symbol .design-icon{width:18px;height:18px}.route-text{min-width:0;font-size:12px;line-height:1.5;color:var(--secondary-text-color)}.route-text strong{display:block;font-weight:500;font-size:13px;color:var(--primary-text-color)}.route-top .design-value{font-size:25px;text-align:right;flex:none}.route-track{position:relative;height:5px;border-radius:5px;background:var(--secondary-background-color);overflow:hidden}.route-fill{display:block;width:var(--portion);height:100%;border-radius:inherit;background:var(--route);opacity:.8;min-width:0;position:relative;overflow:hidden}.route-fill:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 15%,#ffffff95 50%,transparent 85%);transform:translateX(-100%);animation:design-light 3.8s ease-in-out infinite}.route-endpoints{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:7px;font-size:11px;color:var(--secondary-text-color)}.route-endpoints .design-icon{width:13px;height:13px;color:var(--route)}.route-endpoints>span{display:flex;align-items:center;gap:5px}.route-idle .route-symbol{opacity:.6}.route-idle .route-fill{background:none}.route-idle .route-fill:after{display:none}.route-footnote{font-size:11px;color:var(--secondary-text-color);margin:18px 0 0;line-height:1.5}
.content[data-view=history] .house-pulse,.content[data-animated=false] .house-pulse{display:none}.content[data-view=history] .allocation-light,.content[data-view=history] .route-fill:after,.content[data-animated=false] .allocation-light,.content[data-animated=false] .route-fill:after{display:none}:host([data-motion-paused]) .house-pulse,:host([data-motion-paused]) .allocation-light,:host([data-motion-paused]) .route-fill:after{animation-play-state:paused}
@keyframes design-travel{to{stroke-dashoffset:-68}}@keyframes design-light{0%,15%{transform:translateX(-100%)}75%,100%{transform:translateX(100%)}}
@media(prefers-reduced-motion:reduce){.house-pulse,.allocation-light,.route-fill:after{display:none}}
@container(max-width:300px){.designer-flow{margin-top:20px}.house-figure>svg{height:160px}.design-value,.route-top .design-value{font-size:22px}.design-value small{font-size:11px;margin-left:3px}.metric-pair{gap:12px}.net-pair>div+div{padding-left:12px}.route-top{gap:8px}.route-name{gap:7px}.route-symbol{width:28px;height:28px}.allocation-percent{font-size:46px}.allocation-copy{max-width:100px}.allocation-bar{height:36px}}
`;

function designMarkup(kind,data,history){
 const {solar,home,import:incoming,export:outgoing}=data,unit=history?'kWh':'kW';
 const n=value=>value==null?'—':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(value);
 const amount=value=>`<span class="design-value">${n(value)}<small>${unit}</small></span>`;
 const own=solar==null||outgoing==null||home==null?null:Math.min(home,Math.max(0,solar-outgoing));
 const ownPercent=solar>0&&own!=null?Math.max(0,Math.min(100,Math.round(own/solar*100))):null;
 const allocationKnown=solar>0&&own!=null&&outgoing!=null;
 const exportPercent=allocationKnown?Math.max(0,Math.min(100,outgoing/solar*100)):0;
 if(kind==='house'){
  const wire=(path,color,value)=>`<g class="${color}${value>0?'':' house-idle'}"><path class="house-wire" d="${path}"/>${value>0?`<path class="house-pulse" d="${path}"/>`:''}</g>`;
  const note=own==null||incoming==null?'Bronnen nog niet beschikbaar':home===0?'Geen woningverbruik':incoming===0?'Woning gevoed door eigen zon':own>0?'Woning gevoed door zon en net':'Woning gevoed vanuit het net';
  return `<div class="house-source"><div class="source-caption">${icon('sun','sun-ink')}<span class="design-label">Zonnepanelen</span></div>${amount(solar)}</div>
  <figure class="house-figure"><svg viewBox="0 0 360 190" aria-hidden="true">
   <ellipse class="house-ground" cx="183" cy="167" rx="130" ry="17"/>
   ${wire('M21 148H84Q100 148 100 136V127H123','net-ink',incoming)}
   ${wire('M237 127H258Q270 127 270 139V148H339','sun-ink',outgoing)}
   <path class="house-wall" d="M107 89 181 44l75 45v68l-75 19-74-19Z"/>
   <path class="house-wall" d="M181 94 256 89v68l-75 19Z"/>
   <path class="house-roof" d="m94 88 88-56 89 56-16 9-73-42-73 42Z"/>
   <path class="house-detail" d="M181 99v77M107 157l74 19 75-19M120 115v33"/>
   <path class="house-panel" d="m187 44 18 11-17 10-17-10Zm21 13 18 11-17 10-18-11Zm21 13 18 11-17 10-18-11Z"/>
   <path class="house-window" d="m128 107 30 5v28l-30-5Zm68 3 39-8v30l-39 9Z"/>
   <path class="house-detail" d="m143 110 0 28m-15-17 30 5m57-20v30m-19-10 39-9"/>
   <path class="house-wall" d="m166 142 11 2v30l-11-3Z"/>
   ${wire('M213 78V91Q213 100 203 102L195 104V130','sun-ink',own)}
   <g class="net-ink" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="${incoming>0?'.8':'.35'}"><path d="m13 148 8-27 8 27M16 131h10m-13 9h16M9 148h24"/></g>
   <g class="net-ink" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="${outgoing>0?'.8':'.35'}"><path d="m331 148 8-27 8 27m-13-17h10m-13 9h16m-20 8h24"/></g>
  </svg><figcaption>${history?'Verbruik uit zon en net in deze periode':note}</figcaption></figure>
  <dl class="metric-pair net-pair"><div><dt class="design-label">${icon('arrow','net-ink')}Netafname</dt><dd>${amount(incoming)}</dd></div><div><dt class="design-label">${icon('arrow','sun-ink')}Teruglevering</dt><dd>${amount(outgoing)}</dd></div></dl>`;
 }
 if(kind==='solar')return `<div class="solar-allocation">
  <div class="allocation-top"><div class="source-caption">${icon('sun','sun-ink')}<span class="design-label">Je zonneopwek verdeeld</span></div>${amount(solar)}</div>
  <div class="allocation-hero"><span class="allocation-percent">${ownPercent==null?'—':ownPercent+'<small style="font-size:.5em;margin-left:3px">%</small>'}</span><span class="allocation-copy">${solar===0?(history?'Geen zonneopwek in deze periode':'Er is nu geen zonneopwek'):!allocationKnown?'Verdeling nog niet beschikbaar':'van je opwek gebruikt in huis'}</span></div>
  <div class="allocation-bar" data-empty="${!allocationKnown}" role="img" aria-label="${allocationKnown?`${ownPercent}% van de zonneopwek naar de woning, ${Math.round(exportPercent)}% naar het net`:'Geen verdeling beschikbaar'}"><span class="allocation-own" style="width:${allocationKnown?own/solar*100:0}%"><i class="allocation-light"></i></span><span class="allocation-export" style="width:${exportPercent}%"><i class="allocation-light"></i></span></div>
  <dl class="metric-pair allocation-metrics"><div><dt class="design-label">Naar je woning</dt><dd>${amount(own)}</dd></div><div><dt class="design-label">Naar het net</dt><dd>${amount(outgoing)}</dd></div></dl>
  <div class="allocation-footer"><div class="source-caption">${icon('grid','net-ink')}<span class="design-label">Aanvulling uit net</span></div>${amount(incoming)}</div>
  </div>`;
 const max=Math.max(1,own||0,incoming||0,outgoing||0);
 const rows=[{source:'sun',icon:'sun',label:'Zon naar woning',from:'Zonnepanelen',to:'Woning',value:own},{source:'sun',icon:'sun',label:'Teruglevering',from:'Zonnepanelen',to:'Elektriciteitsnet',value:outgoing},{source:'grid',icon:'grid',label:'Afname uit net',from:'Elektriciteitsnet',to:'Woning',value:incoming}];
 return `<ol class="route-list">${rows.map(row=>`<li class="route-row${row.value>0?'':' route-idle'}" data-source="${row.source}"><div class="route-top"><div class="route-name"><span class="route-symbol">${icon(row.icon)}</span><span class="route-text"><strong>${row.label}</strong></span></div>${amount(row.value)}</div><div class="route-track"><i class="route-fill" style="--portion:${Math.max(0,row.value||0)/max*100}%"></i></div><div class="route-endpoints"><span>${row.from}</span>${icon('arrow')}<span>${row.to}</span></div></li>`).join('')}</ol><p class="route-footnote">De balken vergelijken de drie stromen op dezelfde schaal.</p>`;
}

class DesignerFlowLayouts extends customElements.get('eleven-energy-flow-card'){
 render(){
  super.render();if(!this._config)return;
  const history=this._view==='history',empty={solar:null,import:null,export:null,home:null};
  const data=!this._prefs?empty:history?(this._statistics?energyFlowHistorical(this._prefs,this._statistics):empty):energyFlowLive(this._prefs,this._hass,this._config);
  const root=this.shadowRoot,flow=document.createElement('div');flow.className='designer-flow';flow.dataset.layout=this.dataset.layout;flow.innerHTML=designMarkup(this.dataset.layout,data,history);
  root.querySelector('.distribution').replaceWith(flow);
  const style=document.createElement('style');style.textContent=styles;root.append(style);
 }
}
customElements.define('eleven-designer-flow-layouts',DesignerFlowLayouts);
