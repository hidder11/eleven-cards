import '../dist/eleven-energy-flow-card.js';
import {energyFlowLive,energyFlowHistorical} from '../src/energy-flow-data.js';
import {uiEscape} from '../../../shared/ui-button.js';

// Three QA proposals using the existing card's HA data helpers and period controls.
// The housing illustrations are SVG, so they stay sharp in both HA themes.
const styles=`
.home-flow{--sun:var(--solar);--net:var(--grid);--house:#9bc9b2;--wall-front:#484d58;--wall-side:#343944;--roof-front:#373c47;--roof-edge:#222630;--glass:#9bc9b2;min-width:0;font-variant-numeric:tabular-nums}
.content[data-dark=false] .home-flow{--house:#34785d;--wall-front:#e2e6e9;--wall-side:#bdc6cd;--roof-front:#59636e;--roof-edge:#3f4853;--glass:#5d9d9b}
.home-flow *{box-sizing:border-box}
.home-flow-heading header{margin:0;padding:0;text-align:right}
.home-flow-heading h2{font-size:18px;font-weight:650;line-height:1.25;letter-spacing:0}
.home-flow-heading .feels{margin-top:2px}
.home-scene{position:relative;width:100%;max-width:400px;aspect-ratio:360/260;margin:16px auto 0}
.home-scene>svg{display:block;width:100%;height:100%;overflow:visible}
.home-scene .front-wall{fill:var(--wall-front);stroke:var(--roof-edge);stroke-width:1.2;stroke-linejoin:round}
.home-scene .side-wall{fill:var(--wall-side);stroke:var(--roof-edge);stroke-width:1.2;stroke-linejoin:round}
.home-scene .roof-front{fill:var(--roof-front);stroke:var(--roof-edge);stroke-width:1.5;stroke-linejoin:round}
.home-scene .roof-side{fill:var(--roof-edge);stroke:var(--roof-edge);stroke-width:1.2;stroke-linejoin:round}
.home-scene .roof-ridge{fill:none;stroke:var(--secondary-text-color);stroke-width:1;stroke-opacity:.5}
.home-scene .window{fill:var(--glass);fill-opacity:.25;stroke:var(--house);stroke-width:1;stroke-opacity:.7}
.home-scene .window-frame{fill:none;stroke:var(--wall-front);stroke-width:2}
.home-scene .door{fill:var(--roof-edge);stroke:var(--secondary-text-color);stroke-opacity:.3;stroke-width:1}
.home-scene .panel{fill:#1c3546;stroke:var(--sun);stroke-width:.8;stroke-opacity:.8}
.home-scene .panel-lines{fill:none;stroke:var(--sun);stroke-width:.65;stroke-opacity:.45}
.home-scene .foundation{fill:var(--wall-side);stroke:var(--divider-color);stroke-width:1}
.home-scene .house-shadow{fill:var(--primary-text-color);opacity:.045}
.home-scene .garden{fill:var(--house);fill-opacity:.12;stroke:var(--house);stroke-opacity:.25;stroke-width:.8}
.home-scene .terrace{fill:var(--wall-side);opacity:.45}
.home-scene .step{fill:var(--wall-front);stroke:var(--roof-edge);stroke-width:.7}
.home-scene .plant{fill:var(--house);fill-opacity:.2;stroke:var(--house);stroke-opacity:.55;stroke-width:1}
.flow-route[data-route=solar],.flow-route[data-route=return],.flow-endpoint[data-node=sun]{color:var(--sun)}
.flow-route[data-route=grid],.flow-endpoint[data-node=grid]{color:var(--net)}
.flow-wire{fill:none;stroke:currentColor;stroke-width:1.25;stroke-opacity:.6;stroke-linecap:round;stroke-linejoin:round}
.flow-route[data-active=false] .flow-wire{stroke-opacity:.15}
.flow-endpoint .endpoint-disc{fill:var(--ha-card-background,var(--card-background-color));stroke:currentColor;stroke-width:1.5}
.flow-endpoint[data-node=grid][data-direction=export]{color:var(--sun)}
.flow-endpoint[data-direction=idle],.flow-endpoint[data-direction=unknown]{opacity:.5}
.flow-endpoint .endpoint-icon{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.home-ring{fill:none;stroke:var(--divider-color);stroke-width:1.5}
.home-ring-part{fill:none;stroke-width:2.5;transform:rotate(-90deg);transform-origin:268px 166px}
.flow-dot{fill:currentColor;offset-distance:0%;offset-rotate:0deg;animation:home-route-travel var(--route-duration,4s) linear infinite}
.scene-label{position:absolute;display:block;font-size:11px;line-height:1.4;text-align:center;color:var(--secondary-text-color);transform:translateX(-50%);white-space:nowrap;pointer-events:none}
.scene-label[data-label=solar]{left:48.89%;top:0}
.scene-label[data-label=grid]{left:12.22%;top:78.08%}
.scene-label[data-label=home]{left:74.44%;top:93.85%}
.flow-caption{display:flex;align-items:center;justify-content:center;gap:7px;font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:12px 0 16px;min-height:17px;text-align:center}
.flow-caption svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.5;flex:none;stroke-linecap:round;stroke-linejoin:round}
.home-readings{display:grid;gap:12px;margin:0}
.home-secondary-readings{margin-top:12px}
.reading-wide{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:auto auto;column-gap:12px;row-gap:2px;background:var(--secondary-background-color);border-radius:7px;padding:12px;margin:0}
.reading-wide>div{min-width:0;display:grid;grid-template-rows:subgrid;grid-row:span 2}
.home-readings .metrics{column-gap:12px}
.home-readings dt{font-size:11px;line-height:1.4;font-weight:400;color:var(--secondary-text-color);margin:0;overflow-wrap:anywhere}
.home-readings dd{font-size:24px;font-weight:650;line-height:1.25;letter-spacing:-.03em;color:var(--primary-text-color);margin:0;overflow-wrap:anywhere}
.home-readings dd small{font-size:11px;font-weight:400;letter-spacing:0;color:var(--secondary-text-color);margin-left:4px}
.content[data-animated=false] .flow-dot,.content[data-view=history] .flow-dot{display:none}
:host([data-motion-paused]) .flow-dot{animation-play-state:paused}
@keyframes home-route-travel{to{offset-distance:100%}}
@media(prefers-reduced-motion:reduce){.home-scene .flow-dot{display:none}}
@container(max-width:300px){.home-flow-heading h2{font-size:16px}.home-readings dd{font-size:22px}.home-scene{margin-top:12px}}
`;
const symbols={sun:'M12 3V1m0 22v-2M3 12H1m22 0h-2M4.2 4.2 2.8 2.8m18.4 18.4-1.4-1.4M4.2 19.8l-1.4 1.4M21.2 2.8l-1.4 1.4M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0',home:'m2 11 10-8 10 8M5 10v12h14V10M10 22v-8h4v8',grid:'m12 2-8 20M12 2l8 20M8 8h8M6 14h12M2 22h20M12 2v20M8 8l10 6M16 8 6 14'};
const endpoint=(node,x,y,direction='')=>`<g class="flow-endpoint" data-node="${node}" data-direction="${direction}" transform="translate(${x} ${y})"><circle class="endpoint-disc" r="26"/><g class="endpoint-icon" transform="translate(-12 -12)"><path d="${symbols[node]}"/></g></g>`;
const route=(name,path,amount,total,history)=>{
 const active=amount!=null&&amount>0,duration=6-Math.min(1,(amount||0)/Math.max(total,1))*4.5;
 return `<g class="flow-route" data-route="${name}" data-active="${active}"><path class="flow-wire" d="${path}"/>${active&&!history?`<circle class="flow-dot" r="2" style="offset-path:path('${path}');--route-duration:${duration}s"/>`:''}</g>`;
};

function perspective(){return `
 <ellipse class="house-shadow" cx="216" cy="190" rx="100" ry="18"/>
 <path class="garden" d="m115 174 87-43 116 44-88 38Z"/>
 <path class="foundation" d="m142 164 63-35 74 40v15l-63 22-74-34Z"/>
 <path class="front-wall" d="M144 112 202 72l13 43v77l-71-31Z"/>
 <path class="side-wall" d="m215 115 62-24v78l-62 23Z"/>
 <path class="roof-side" d="m202 61 79 30-66 35-71-37Z"/>
 <path class="roof-front" d="m131 108 71-47 21 60-12 7-13-44-57 35Z"/>
 <path class="roof-front" d="m202 61 79 30-58 30Z"/>
 <path class="roof-ridge" d="m202 61 79 30m-66 35 66-35"/>
 <path class="panel" d="m220 78 43 16-30 15Z"/><path class="panel-lines" d="m231 82 10 23m1-19 7 15m-24-10 22 8m-17-15 24 9"/>
 <path class="window" d="m153 119 23 10v25l-23-10Zm79 11 29-11v27l-29 11Z"/>
 <path class="window-frame" d="m164 124 0 25m-11-17 23 10m70-17v27m-14-8 29-11"/>
 <path class="door" d="m187 143 16 7v36l-16-7Z"/><path class="roof-ridge" d="m198 164 1 0"/>
 <path class="step" d="m183 179 21 9-9 5-22-9Z"/>
 <path class="plant" d="M297 161v29m-10-19c-8-15 4-30 10-21 7-8 19 9 8 23-5 5-11 5-18-2Z"/>
 `;}

function facade(){return `
 <ellipse class="house-shadow" cx="175" cy="191" rx="105" ry="13"/>
 <path class="garden" d="M78 184h198l12 17H67Z"/>
 <path class="foundation" d="M102 176h145v17H102Z"/>
 <path class="front-wall" d="M103 111 174 58l71 53v68H103Z"/>
 <path class="roof-side" d="m88 112 86-66 86 66-10 10-76-57-76 57Z"/>
 <path class="roof-front" d="m92 110 82-62 82 62-12 7-70-51-70 51Z"/>
 <path class="panel" d="m182 67 23 17-12 12-23-17Zm26 19 22 16-12 12-22-16Z"/>
 <path class="panel-lines" d="m176 73 23 17m-12-18-12 12m27 8 22 16m-11-17-12 12"/>
 <path class="window" d="M116 127h31v31h-31Zm85 0h31v31h-31ZM165 94h19v20h-19Z"/>
 <path class="window-frame" d="M131.5 127v31M116 142.5h31m69.5-15.5v31M201 142.5h31M174.5 94v20"/>
 <path class="door" d="M159 137h31v42h-31Z"/><path class="window" d="M165 143h19v15h-19Z"/>
 <circle cx="184" cy="167" r="1.4" fill="var(--sun)"/>
 <path class="step" d="M154 179h41v8h-41Zm-5 8h51v6h-51Z"/>
 <path class="plant" d="M79 172v15m-6-12c-12-9-1-22 6-15 7-7 18 6 6 15Zm190-3v15m-6-12c-12-9-1-22 6-15 7-7 18 6 6 15Z"/>
 `;}

function platform(){return `
 <ellipse class="house-shadow" cx="204" cy="190" rx="110" ry="18"/>
 <path class="garden" d="m85 167 113-51 120 50-113 48Z"/>
 <path class="foundation" d="m104 159 98-43 90 39v20l-97 37-91-41Z"/>
 <path class="terrace" d="m190 182 87-33 15 6v20l-97 37Z"/>
 <path class="front-wall" d="m124 110 76-32 71 29v63l-77 29-70-31Z"/>
 <path class="side-wall" d="m194 139 77-32v63l-77 29Z"/>
 <path class="roof-side" d="m116 99 82-35 82 34v16l-86 35-78-35Z"/>
 <path class="roof-front" d="m116 99 82-35 82 34-86 35Z"/>
 <path class="roof-ridge" d="m122 99 76-30 74 29-78 30Z"/>
 <path class="panel" d="m149 94 48-20 49 20-48 20Z"/>
 <path class="panel-lines" d="m161 89 49 20m-37-25 49 20m-37-25 49 20m-73 0 48-20m-36 25 48-20m-36 25 48-20"/>
 <path class="window" d="m135 127 46 20v32l-46-20Zm72 17 47-19v34l-47 18Z"/>
 <path class="window-frame" d="m150 134v32m16-25v32m57-36v34m15-40v34"/>
 <path class="door" d="m184 148 10 4v45l-10-5Z"/>
 <path class="step" d="m176 194 20 9-12 5-20-9Z"/>
 <path class="plant" d="M296 136v39m-12-23c-11-21 5-41 12-26 8-15 23 6 12 26-5 8-18 8-24 0Z"/>
 `;}

const scenes={
 perspective:{transform:'translate(96 54) scale(.80)',house:perspective},
 facade:{transform:'translate(126 67) scale(.80)',house:facade},
 platform:{transform:'translate(120 66) scale(.72)',house:platform}
};

function markup(kind,data,history){
 const {solar,home,import:incoming,export:outgoing}=data,scene=scenes[kind]??scenes.perspective;
 const direction=incoming==null||outgoing==null?'unknown':incoming>0&&outgoing>0?'both':incoming>0?'import':outgoing>0?'export':'idle';
 const caption=history?'Afname en teruglevering in de gekozen periode':direction==='import'?'Van het net naar je woning':direction==='export'?'Van je woning terug naar het net':direction==='both'?'Afname en teruglevering':direction==='idle'?'Geen uitwisseling met het net':'Netuitwisseling niet beschikbaar';
 const unit=history?'kWh':'kW',n=value=>value==null?'—':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(value);
 const amount=value=>`${n(value)}<small>${unit}</small>`;
 const arrow=history||direction==='both'?'M4 12h16m-5-5 5 5-5 5M9 7l-5 5 5 5':direction==='export'?'M17 17V7H7m10 0L7 17':direction==='import'?'M5 12h14m-6-6 6 6-6 6':'M5 12h14';
 // Like HA's distribution card: solar above, grid left, home right. Export and
 // import meet the SAME grid node, each on its own traceable source-to-sink path.
 // This fixture has no battery; do not infer a solar share for battery systems.
 const own=data.battery||solar==null||outgoing==null||home==null?null:Math.min(home,Math.max(0,solar-outgoing));
 const total=(own||0)+(incoming||0)+(outgoing||0),circumference=2*Math.PI*72,share=own!=null&&home>0?own/home:null;
 const ring=share==null?'':`<circle class="home-ring-part" cx="268" cy="166" r="72" stroke="var(--net)"/><circle class="home-ring-part" cx="268" cy="166" r="72" stroke="var(--sun)" stroke-dasharray="${share*circumference} ${circumference}"/>`;
 return `<figure class="home-scene"><svg viewBox="0 0 360 260" role="img" aria-label="${uiEscape(`Zonnepanelen ${n(solar)} ${unit}, woningverbruik ${n(home)} ${unit}, netafname ${n(incoming)} ${unit}, teruglevering ${n(outgoing)} ${unit}. ${caption}.`)}">
  ${route('solar','M176 71V83C176 103 192 108 214 118',own,total,history)}
  ${route('return','M176 71V89C176 109 165 116 145 116H98C68 116 44 119 44 140',outgoing,total,history)}
  ${route('grid','M70 166H196',incoming,total,history)}
  <g class="home-node" data-node="home"><circle class="home-ring" cx="268" cy="166" r="72"/>${ring}<g transform="${scene.transform}">${scene.house()}</g></g>
  ${endpoint('sun',176,45)}${endpoint('grid',44,166,history?'both':direction)}
 </svg><span class="scene-label" data-label="solar" aria-hidden="true">Zon</span><span class="scene-label" data-label="grid" aria-hidden="true">Net</span><span class="scene-label" data-label="home" aria-hidden="true">Woning</span></figure>
 <p class="flow-caption" data-direction="${history?'both':direction}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${arrow}"/></svg>${caption}</p>
 <div class="home-readings"><dl class="reading-surface reading-wide"><div data-metric="import"><dt>Netafname</dt><dd>${amount(incoming)}</dd></div><div data-metric="export"><dt>Teruglevering</dt><dd>${amount(outgoing)}</dd></div></dl><dl class="metrics"><div class="metric reading-small" data-metric="solar"><dt>Opgewekt</dt><dd>${amount(solar)}</dd></div><div class="metric reading-small" data-metric="home"><dt>Verbruikt</dt><dd>${amount(home)}</dd></div></dl></div>`;
}

class HomeFlowLayouts extends customElements.get('eleven-energy-flow-card'){
 render(){
  super.render();if(!this._config)return;
  const history=this._view==='history',empty={solar:null,import:null,export:null,home:null};
  const data=this._offline()||this._error||!this._prefs?empty:history?(this._statistics?energyFlowHistorical(this._prefs,this._statistics):empty):energyFlowLive(this._prefs,this._hass,this._config);
  const root=this.shadowRoot,flow=document.createElement('div');flow.className='home-flow';flow.dataset.layout=this.dataset.layout;flow.innerHTML=markup(this.dataset.layout,data,history);
  root.querySelector('.distribution').replaceWith(flow);
  // Match Weather/Car: the common header fade ends after the wide surface.
  // The lower pair sits outside that region, with the same 12px separation.
  const lower=document.createElement('div');lower.className='home-readings home-secondary-readings';lower.append(flow.querySelector('.metrics'));root.querySelector('.header-region').after(lower);
  const heading=root.querySelector('.energy-heading'),header=document.createElement('div');header.className='home-flow-heading';header.innerHTML=`<header><h2>${uiEscape(this._config.title||'Energieverdeling')}</h2><div class="feels">${history?'Energie in deze periode':'Actueel vermogen'}</div></header>`;heading.replaceWith(header);
  const style=document.createElement('style');style.textContent=styles;root.append(style);
 }
}
customElements.define('eleven-home-flow-layouts',HomeFlowLayouts);
