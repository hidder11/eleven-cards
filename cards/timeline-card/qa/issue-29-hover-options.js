// Design comparison only: production behavior is unchanged until a variant is chosen.
import './issue-29-live.js';
import {SharedGraph} from '../../../shared/graph.js';
const card=document.querySelector('eleven-timeline-card');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=card._timelineTooltipRows,show=card._showTooltip,hide=card._hideTooltip;
let mode='combined';
card._hiddenStates.clear();
function groupRows(t,group){return card._timelineTooltipGroupRows(card._timelineGroups().find(g=>g.name===group)?.indices??[],t);}
function style(){if(card.shadowRoot.querySelector('#qa-hover-styles'))return;const s=document.createElement('style');s.id='qa-hover-styles';s.textContent='.tooltip .qa-heading{font-size:11px;font-weight:600;margin:10px 0 2px;color:var(--secondary-text-color)}.tooltip .qa-section:first-of-type .qa-heading{margin-top:0}.tooltip .tooltip-entry{padding:4px 0}.tooltip .tooltip-interval{font-size:10px}.tooltip.qa-split{z-index:5}.tooltip .qa-split-heading{margin-top:0}';card.shadowRoot.append(s);}
card._timelineTooltipRows=function(t){return this._timelineGroups().map(g=>'<div class="qa-section"><h4 class="qa-heading">'+esc(g.name)+'</h4>'+groupRows(t,g.name)+'</div>').join('');};
card._showTooltip=function(t,publish=true){
 style();show.call(this,t,publish);
 const chart=this.shadowRoot.querySelector('.chart'),main=chart?.querySelector('.tooltip');if(!main||main.hidden)return;
 chart.querySelectorAll('.qa-split').forEach(p=>p.remove());
 if(mode==='combined')return;
 main.hidden=true;
 const box=chart.getBoundingClientRect(),track=chart.querySelector('.track').getBoundingClientRect(),x=track.left-box.left+(t-this._viewStart)/(this._viewEnd-this._viewStart)*track.width;
 for(const g of this._timelineGroups()){
 const group=[...chart.querySelectorAll('[data-timeline-group]')].find(el=>el.dataset.timelineGroup===g.name),r=group.querySelector('.track').getBoundingClientRect(),tip=document.createElement('div');
 tip.className='tooltip qa-split';tip.innerHTML='<strong>'+esc(this._time(t))+'</strong><h4 class="qa-heading qa-split-heading">'+esc(g.name)+'</h4>'+groupRows(t,g.name);chart.append(tip);tip.style.pointerEvents=this._pinned?'auto':'none';
 // Each popup uses the common time on its own group's vertical track.
 const pointer=this._tooltipPointer;this._tooltipPointer=null;SharedGraph.positionTooltip(this,{chart,tooltip:tip,x,y:r.top-box.top+r.height/2,local:false});this._tooltipPointer=pointer;const gr=group.getBoundingClientRect(),tr=tip.getBoundingClientRect(),content=this.shadowRoot.querySelector('.card-content,.content').getBoundingClientRect();const top=Math.max(content.top+4,8,Math.min(gr.top,Math.min(content.bottom-4,innerHeight-8)-tr.height));tip.style.top=(top-box.top)+'px';
 }
};
card._hideTooltip=function(publish=true){hide.call(this,publish);this.shadowRoot.querySelectorAll('.qa-split').forEach(p=>p.remove());};
function example(){card._pinned=true;const g=card.shadowRoot.querySelectorAll('.timeline-group')[1],r=g?.querySelector('.track').getBoundingClientRect();card._tooltipGroup='Ventilatie';card._tooltipPointer=r?{x:r.left+r.width*.72,y:r.top+r.height/2}:null;card._showTooltip(card._viewStart+(card._viewEnd-card._viewStart)*.72,false);}
function choose(next){mode=next;document.querySelector('#combined').setAttribute('aria-pressed',String(next==='combined'));document.querySelector('#separate').setAttribute('aria-pressed',String(next==='separate'));document.querySelector('#variant-note').textContent=next==='combined'?'A · Eén tijdstip, alle groepen onder elkaar. Mijn voorkeur voor overzicht en vergelijken.':'B · Eén popup naast elke groep. Duidelijke koppeling met de balken, maar meer vlakken over de grafiek.';example();}
document.querySelector('#combined').onclick=()=>choose('combined');document.querySelector('#separate').onclick=()=>choose('separate');document.querySelector('#popup').onclick=example;
window.hoverComparison={choose,example,get mode(){return mode;}};
const ready=setInterval(()=>{if(card._status==='ready'){clearInterval(ready);card._render();style();example();}},50);
