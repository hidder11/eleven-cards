import '../dist/eleven-energy-flow-card.js';
import {energyFlowLive,energyFlowHistorical} from '../src/energy-flow-data.js';
import {uiEscape} from '../../../shared/ui-button.js';

// These five layouts are proposals, backed only by the explicitly labelled QA fixture.
const fiveLayoutStyles=`
.new-flow{position:relative;margin-top:22px;min-width:0;color:var(--primary-text-color);--sun:var(--solar);--net:var(--grid);--house:#8bbcab}
.new-flow>svg{display:block;width:100%;height:auto;overflow:visible;font:inherit}.new-flow text{fill:var(--primary-text-color);font-family:inherit;font-variant-numeric:tabular-nums}.new-flow .muted{fill:var(--secondary-text-color);font-size:12px}.new-flow .amount{font-size:26px;font-weight:650;letter-spacing:-.6px}.new-flow .small-amount{font-size:19px;font-weight:650}.new-flow .unit{fill:var(--secondary-text-color);font-size:12px}.new-flow .plate{fill:var(--secondary-background-color);stroke:var(--divider-color);stroke-width:1}.new-flow .sun{color:var(--sun)}.new-flow .net{color:var(--net)}.new-flow .house{color:var(--house)}.new-flow .outline{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.new-flow .wire{fill:none;stroke:currentColor;stroke-width:2;opacity:.32}.new-flow .packet{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-dasharray:2 44;animation:five-flow 5s linear infinite;filter:drop-shadow(0 0 2px currentColor)}.new-flow .faint{opacity:.12}.new-flow .flow-label{font-size:11px;fill:var(--secondary-text-color)}
.content[data-view=history] .new-flow .packet,.content[data-animated=false] .new-flow .packet{animation:none;stroke-dasharray:none;stroke-width:1;opacity:.5}:host([data-motion-paused]) .new-flow .packet{animation-play-state:paused}.content[data-dark=false] .new-flow{--house:#33775f}
.balance-list{display:grid;gap:18px;margin:0;padding:14px 0}.balance-row{display:grid;grid-template-columns:26px minmax(0,1fr) max-content;gap:5px 10px;align-items:baseline}.balance-row .sign{grid-column:1;grid-row:1/3;font-size:23px;font-weight:300;align-self:center;color:var(--secondary-text-color)}.balance-row dt{font-size:12px;color:var(--secondary-text-color);margin:0}.balance-row dd{font-size:24px;font-weight:650;letter-spacing:-.6px;margin:0;grid-column:3;grid-row:1}.balance-row dd small{font-size:11px;font-weight:400;letter-spacing:0;color:var(--secondary-text-color);margin-left:4px}.balance-track{grid-column:2/-1;height:7px;border-radius:7px;background:var(--secondary-background-color);overflow:hidden}.balance-track i{display:block;width:var(--fill);height:100%;background:var(--ink);border-radius:inherit}.balance-total{margin-top:4px;padding-top:18px;border-top:1px solid var(--divider-color)}.balance-total dd{font-size:30px}.balance-caption{font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:18px 0 0 36px}
@keyframes five-flow{to{stroke-dashoffset:-92}}@media(prefers-reduced-motion:reduce){.new-flow .packet{animation:none;stroke-dasharray:none;stroke-width:1;opacity:.5}}
`;
const shapes={sun:'M12 2V0m0 24v-2M2 12H0m24 0h-2M4 4 2 2m20 20-2-2M4 20l-2 2M22 2l-2 2M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0',house:'m2 11 10-8 10 8M5 10v12h14V10M10 22v-8h4v8',net:'m12 1-8 22m8-22 8 22M8 7h8M6 13h12M2 23h20M12 1v22M8 7l10 6M16 7 6 13'};
const glyph=(kind,x,y,size=24)=>`<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path class="outline" d="${shapes[kind]}"/></svg>`;
const path=(d,kind,value)=>`<g class="${kind}${value>0?'':' faint'}"><path class="wire" d="${d}"/>${value>0?`<path class="packet" d="${d}"/>`:''}</g>`;
function layoutMarkup(kind,data,history){
 const n=value=>value==null?'—':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(value),unit=history?'kWh':'kW';
 const {solar,home,import:incoming,export:outgoing}=data;
 const own=solar==null||outgoing==null?0:Math.min(home||0,Math.max(0,solar-outgoing)),share=home>0?Math.round(own/home*100):0;
 const grid=history?`↓ ${n(incoming)} · ↑ ${n(outgoing)}`:n(incoming>0?incoming:outgoing);
 const direction=history?'Afname · teruglevering':incoming>0?'Afname uit net':outgoing>0?'Terug naar net':'Geen netuitwisseling';
 const svg=body=>`<svg viewBox="0 0 400 360" role="img" aria-label="${uiEscape(kind+' · zon '+n(solar)+' '+unit+', woning '+n(home)+' '+unit+', netafname '+n(incoming)+' '+unit+', teruglevering '+n(outgoing)+' '+unit)}">${body}</svg>`;
 if(kind==='orbit')return svg(`
  <circle cx="200" cy="180" r="110" fill="none" stroke="var(--divider-color)" stroke-dasharray="2 8"/>
  ${path('M180 78C50 92 56 180 132 180','sun',solar)}${path('M268 180C344 180 340 266 220 282','net',outgoing)}${path('M180 282C98 266 110 228 154 222','net',incoming)}
  <rect class="plate" x="131" y="0" width="138" height="78" rx="20"/><g class="sun">${glyph('sun',148,14,20)}</g><text class="muted" x="177" y="24">Zonnepanelen</text><text class="amount" x="200" y="62" text-anchor="middle">${n(solar)}<tspan class="unit"> ${unit}</tspan></text>
  <circle class="plate" cx="200" cy="180" r="67"/><circle cx="200" cy="180" r="66" fill="none" stroke="var(--house)" stroke-opacity=".35"/><g class="house">${glyph('house',188,133)}</g><text class="amount" x="200" y="187" text-anchor="middle">${n(home)}</text><text class="unit" x="200" y="208" text-anchor="middle">${unit}</text><text class="muted" x="200" y="230" text-anchor="middle">Je woning</text>
  <rect class="plate" x="119" y="282" width="162" height="78" rx="20"/><g class="net">${glyph('net',137,297,20)}</g><text class="muted" x="166" y="306">${history?'Elektriciteitsnet':direction}</text><text class="${history?'small-amount':'amount'}" x="200" y="344" text-anchor="middle">${grid}<tspan class="unit"> ${unit}</tspan></text>`);
 if(kind==='ribbons'){
  const max=Math.max(1,own,incoming||0,outgoing||0),ribbon=(d,ink,value)=>`<path d="${d}" fill="none" stroke="var(--${ink})" stroke-width="${Math.max(1,(value||0)/max*54)}" stroke-opacity="${value>0?'.32':'.05'}"/>${path(d,ink==='sun'?'sun':'net',value)}`;
  return svg(`
   ${ribbon('M98 91C190 91 187 130 302 130','sun',own)}${ribbon('M98 110C213 110 180 305 302 305','sun',outgoing)}${ribbon('M98 275C195 275 185 163 302 163','net',incoming)}
   <rect class="plate" x="0" y="32" width="98" height="112" rx="14"/><g class="sun">${glyph('sun',37,46)}</g><text class="muted" x="49" y="91" text-anchor="middle">Zon</text><text class="small-amount" x="49" y="117" text-anchor="middle">${n(solar)}</text><text class="unit" x="49" y="135" text-anchor="middle">${unit}</text>
   <rect class="plate" x="0" y="222" width="98" height="108" rx="14"/><g class="net">${glyph('net',37,235)}</g><text class="muted" x="49" y="277" text-anchor="middle">Netafname</text><text class="small-amount" x="49" y="303" text-anchor="middle">${n(incoming)}</text><text class="unit" x="49" y="320" text-anchor="middle">${unit}</text>
   <rect class="plate" x="302" y="76" width="98" height="120" rx="14"/><g class="house">${glyph('house',339,90)}</g><text class="muted" x="351" y="136" text-anchor="middle">Woning</text><text class="small-amount" x="351" y="165" text-anchor="middle">${n(home)}</text><text class="unit" x="351" y="185" text-anchor="middle">${unit}</text>
   <rect class="plate" x="302" y="267" width="98" height="78" rx="14"/><text class="muted" x="351" y="290" text-anchor="middle">Terug naar net</text><text class="small-amount" x="351" y="315" text-anchor="middle">${n(outgoing)}</text><text class="unit" x="351" y="335" text-anchor="middle">${unit}</text>`);
 }
 if(kind==='balance'){
  const max=Math.max(1,solar||0,incoming||0,outgoing||0,home||0),rows=[['+','Zonnepanelen',solar,'var(--sun)'],['+','Afname uit net',incoming,'var(--net)'],['−','Teruglevering',outgoing,'var(--net)'],['=','Verbruik in je woning',home,'var(--house)']];
  return '<dl class="balance-list">'+rows.map(([sign,label,value,color],i)=>`<div class="balance-row${i===3?' balance-total':''}"><span class="sign" aria-hidden="true">${sign}</span><dt>${label}</dt><dd>${n(value)}<small>${unit}</small></dd><div class="balance-track" style="--ink:${color};--fill:${Math.max(0,(value||0)/max*100)}%"><i></i></div></div>`).join('')+'</dl><p class="balance-caption">Opwek + netafname − teruglevering = woningverbruik.</p>';
 }
 if(kind==='metro')return svg(`
  <path d="M45 40V320" fill="none" stroke="var(--divider-color)" stroke-width="2"/>
  ${path('M37 45V175','sun',solar)}${path('M53 315V185','net',incoming)}${path('M65 185V315','net',outgoing)}
  ${[[45,'sun','Zonnepanelen','Opwek',solar],[180,'house','Je woning','Verbruik',home],[315,'net','Elektriciteitsnet',direction,null]].map(([y,ink,label,note,amount])=>`<circle cx="45" cy="${y}" r="12" fill="var(--ha-card-background)" stroke="var(--${ink})" stroke-width="2"/><circle cx="45" cy="${y}" r="4" fill="var(--${ink})"/><g class="${ink}">${glyph(ink==='sun'?'sun':ink==='house'?'house':'net',96,y-17,30)}</g><text x="140" y="${y-7}" style="font-size:14px;font-weight:600">${label}</text><text class="muted" x="140" y="${y+15}">${note}</text><text class="${y===315&&history?'small-amount':'amount'}" x="393" y="${y+2}" text-anchor="end">${amount==null?grid:n(amount)}</text><text class="unit" x="393" y="${y+23}" text-anchor="end">${unit}</text>`).join('')}`);
 // A quantitative view of the calculated home mix; no battery in this fixture.
 const circumference=2*Math.PI*98,part=circumference*share/100;
 return svg(`
  <circle cx="200" cy="145" r="119" fill="none" stroke="var(--divider-color)" stroke-dasharray="1 9"/><circle cx="200" cy="145" r="98" fill="none" stroke="var(--net)" stroke-width="18" opacity=".65"/>
  <circle cx="200" cy="145" r="98" fill="none" stroke="var(--sun)" stroke-width="18" stroke-dasharray="${part} ${circumference-part}" transform="rotate(-90 200 145)"/>
  <g class="house">${glyph('house',186,91,28)}</g><text class="amount" x="200" y="156" text-anchor="middle" style="font-size:36px">${n(home)}</text><text class="unit" x="200" y="180" text-anchor="middle">${unit} in je woning</text><text class="muted" x="200" y="203" text-anchor="middle">${share}% uit eigen zon</text>
  <circle cx="32" cy="286" r="5" fill="var(--sun)"/><text class="muted" x="46" y="290">Zon naar woning</text><text class="small-amount" x="32" y="319">${n(own)}<tspan class="unit"> ${unit}</tspan></text>
  <circle cx="228" cy="286" r="5" fill="var(--net)"/><text class="muted" x="242" y="290">Net naar woning</text><text class="small-amount" x="228" y="319">${n(incoming)}<tspan class="unit"> ${unit}</tspan></text>
  <text class="flow-label" x="200" y="353" text-anchor="middle">↑ ${n(outgoing)} ${unit} teruggeleverd aan het net</text>`);
}
class FiveFlowLayouts extends customElements.get('eleven-energy-flow-card'){
 render(){
  super.render();if(!this._config)return;
  const history=this._view==='history',empty={solar:null,import:null,export:null,home:null};
  const data=!this._prefs?empty:history?(this._statistics?energyFlowHistorical(this._prefs,this._statistics):empty):energyFlowLive(this._prefs,this._hass,this._config);
  const root=this.shadowRoot,flow=document.createElement('div');flow.className='new-flow';flow.dataset.layout=this.dataset.layout;flow.innerHTML=layoutMarkup(this.dataset.layout,data,history);root.querySelector('.distribution').replaceWith(flow);
  const style=document.createElement('style');style.textContent=fiveLayoutStyles;root.append(style);
 }
}
customElements.define('eleven-five-flow-layouts',FiveFlowLayouts);
