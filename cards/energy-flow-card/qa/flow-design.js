import '../dist/eleven-energy-flow-card.js';
import {energyFlowLive,energyFlowHistorical} from '../src/energy-flow-data.js';

// Design example only: the installed card and test collection stay unchanged.
const flowDesignStyles=`
.distribution[data-layout=routes]{grid-template-columns:42% 16% 42%;grid-template-rows:172px 172px;gap:16px 0;height:360px}.distribution[data-layout=routes] .solar-node{grid-column:1;grid-row:1}.distribution[data-layout=routes] .grid-node{grid-column:1;grid-row:2}.distribution[data-layout=routes] .home-node{grid-column:3;grid-row:1/3;width:100%;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:10px;padding:14px 8px}.distribution[data-layout=routes] .home-node .node-head{flex-direction:column;gap:12px!important}.distribution[data-layout=routes] .home-node .node-head svg{width:54px;height:54px;padding:11px}.distribution[data-layout=routes] .home-node .node-value{align-self:auto;text-align:center;font-size:30px}.distribution[data-layout=routes] .home-node .node-note{text-align:center;align-self:auto}.distribution[data-layout=routes] .source-connectors{left:42%;width:16%;top:0;height:360px}.distribution[data-layout=routes] .flow-line{opacity:.45}.distribution[data-layout=routes] .flow-node:not(.home-node){justify-content:center}.distribution[data-layout=routes] .node-pair{flex-wrap:wrap;gap:3px 8px}
.distribution[data-layout=spine]{grid-template-columns:minmax(0,1fr);grid-template-rows:82px 124px 82px;row-gap:36px;height:360px}.distribution[data-layout=spine] .solar-node{grid-row:1}.distribution[data-layout=spine] .home-node{grid-row:2}.distribution[data-layout=spine] .grid-node{grid-row:3}.distribution[data-layout=spine] .flow-node{grid-column:1;display:grid;grid-template-columns:minmax(0,1fr) max-content;grid-template-rows:1fr auto;align-items:center;text-align:left;padding:14px 16px;gap:0 10px}.distribution[data-layout=spine] .node-head{grid-row:1/3;grid-column:1;flex-direction:row;justify-content:flex-start;gap:10px!important}.distribution[data-layout=spine] .node-head svg{width:38px;height:38px;padding:8px;flex:none}.distribution[data-layout=spine] .node-value,.distribution[data-layout=spine] .node-pair{grid-column:2;grid-row:1;align-self:end;font-size:26px;text-align:right}.distribution[data-layout=spine] .node-note{grid-column:2;grid-row:2;text-align:right;align-self:start;margin-top:3px}.distribution[data-layout=spine] .source-connectors{left:0;top:82px;width:100%;height:196px}.distribution[data-layout=spine] .home-node{grid-template-rows:1fr auto 36px}.distribution[data-layout=spine] .home-node .node-head{grid-row:1/3}.source-mix{grid-column:1/-1;grid-row:3;align-self:end;min-width:0}.mix-labels{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:var(--secondary-text-color);margin:0 0 5px}.mix-labels strong{color:var(--primary-text-color);font-weight:600;margin-left:4px}.mix-track{height:5px;border-radius:7px;background:linear-gradient(90deg,var(--solar) 0 var(--solar-share),var(--grid) var(--solar-share) 100%)}
.energy-heading{padding-top:0}.energy-heading header{padding-top:6px}.energy-heading .primary-label{max-width:150px;line-height:1.5}.primary-value{font-size:60px}
.distribution{grid-template-rows:152px 112px;row-gap:64px;column-gap:4%;margin-top:24px}
.flow-node{--node-tone:var(--solar);padding:16px 12px;gap:5px;justify-content:flex-start;overflow:hidden;border-radius:12px;border:1px solid color-mix(in srgb,var(--node-tone) 17%,var(--divider-color));background:radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--node-tone) 9%,transparent),transparent 75%),var(--secondary-background-color)}
.flow-node:before{content:'';position:absolute;left:calc(50% - 24px);top:0;width:48px;height:1px;background:var(--node-tone);opacity:.65}
.node-head{flex-direction:column;gap:9px!important}.node-head svg{width:40px;height:40px;padding:9px;border-radius:12px;background:color-mix(in srgb,var(--node-tone) 10%,transparent);stroke-width:1.4;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--node-tone) 12%,transparent)}
.node-name{font-size:11px}.node-value{font-size:26px;font-weight:650;line-height:1.25}.node-value small{font-size:12px}.node-note{font-size:10px;line-height:1.4}.grid-node{--node-tone:var(--grid)}.grid-node .node-pair{gap:10px;flex-wrap:nowrap}.grid-node .node-pair .node-value{font-size:20px}.grid-node .node-pair small{font-size:10px}
.home-node{--node-tone:#8bbcab;color:var(--node-tone);width:100%;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) max-content;grid-template-rows:1fr auto;column-gap:12px;row-gap:0;text-align:left;align-items:center;background:radial-gradient(ellipse at 0% 50%,color-mix(in srgb,var(--node-tone) 8%,transparent),transparent 75%),var(--secondary-background-color)}
.home-node:before{left:calc(50% - 32px);width:64px}.home-node .node-head{grid-column:1;grid-row:1/3;flex-direction:row;justify-content:flex-start;gap:12px!important}.home-node .node-head svg{width:46px;height:46px;padding:10px;flex:none}.home-node .node-name{font-size:12px;color:var(--primary-text-color);font-weight:600}.home-node .node-value{grid-column:2;grid-row:1;align-self:end;font-size:28px;text-align:right}.home-node .node-note{grid-column:2;grid-row:2;align-self:start;text-align:right;margin-top:3px}
.source-connectors{top:152px;height:64px}.flow-bed{stroke-width:3;opacity:.65}.flow-line{stroke-width:1.3;opacity:.65}.flow-pulse{stroke-width:3;stroke-dasharray:2 44;opacity:.9;filter:drop-shadow(0 0 2px currentColor);animation-name:flow-design}.flow-static{opacity:.8}.flow-idle .flow-bed{opacity:.3}.flow-idle .flow-line{opacity:.12}@keyframes flow-design{to{stroke-dashoffset:-92}}@media(prefers-reduced-motion:reduce){.flow-pulse{animation:none;opacity:0}}
.content[data-dark=false] .home-node{--node-tone:#33775f}.content[data-dark=false] .flow-node{border-color:color-mix(in srgb,var(--node-tone) 13%,var(--divider-color))}
@container(max-width:340px){.primary-value{font-size:46px}.distribution{column-gap:4%;grid-template-rows:150px 106px;row-gap:56px;margin-top:20px}.flow-node{padding:16px 8px}.source-connectors{top:150px;height:56px}.node-value{font-size:24px}.grid-node .node-pair{gap:6px}.grid-node .node-pair .node-value{font-size:17px}.home-node{padding:16px 12px;column-gap:6px}.home-node .node-head{gap:8px!important}.home-node .node-head svg{width:36px;height:36px;padding:7px}.home-node .node-name{font-size:11px}.home-node .node-value{font-size:24px}.home-node .node-note{font-size:9px}.unified-toolbar .period-trigger{max-width:160px}}
`;

class EnergyFlowDesign extends customElements.get('eleven-energy-flow-card'){
 render(){
  super.render();if(!this._config)return;
  const root=this.shadowRoot,layout=this.dataset.layout||'gather';
  root.querySelector('.distribution').dataset.layout=layout;
  const style=document.createElement('style');style.textContent=flowDesignStyles;root.append(style);
  // More breathing room for the junctions; paths still enter each tile at its centre.
  const wires=root.querySelector('.source-connectors');wires.setAttribute('viewBox','0 0 400 64');
  const paths=[
   'M96 0V14Q96 28 110 28H168Q184 28 184 44V64',
   'M304 0V14Q304 28 290 28H232Q216 28 216 44V64',
   'M232 64V48Q232 36 244 36H308Q320 36 320 24V0'
  ];
  wires.querySelectorAll('g').forEach((group,index)=>{
   group.querySelectorAll('.flow-bed,.flow-line,.flow-pulse').forEach(path=>path.setAttribute('d',paths[index]));
   group.querySelector('.flow-static')?.setAttribute('transform',index===0?'translate(184 54)':index===1?'translate(216 54)':'translate(320 10)');
  });
  const solar=root.querySelector('.solar-node .node-head svg');
  solar.innerHTML='<path d="M3 14h16l2 8H1l2-8Zm1 4h14m-9-4-1 8m7-8 1 8M13 7a4 4 0 0 1 8 0M17 1V0m6 6h1M11 7h-1m3-5-1-1m9 1 1-1"/>';
  const house=root.querySelector('.home-node .node-head svg');
  house.innerHTML='<path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7M9 10h6"/>';
  this._variant(layout);
 }
 _variant(layout){
  const root=this.shadowRoot,history=this._view==='history';
  const data=!this._prefs?null:history?(this._statistics?energyFlowHistorical(this._prefs,this._statistics):null):energyFlowLive(this._prefs,this._hass,this._config);
  const wires=root.querySelector('.source-connectors'),groups=[...wires.querySelectorAll('g')];
  if(layout==='routes'){
   wires.setAttribute('viewBox','0 0 64 360');
   const paths=['M0 86H16Q26 86 26 102V158Q26 172 42 172H64','M0 274H16Q26 274 26 258V202Q26 188 42 188H64','M64 204H48Q42 204 42 220V298Q42 312 28 312H0'];
   groups.forEach((g,i)=>{
    g.querySelectorAll('.flow-bed,.flow-line,.flow-pulse').forEach(path=>path.setAttribute('d',paths[i]));
    const amount=data?.[['solar','import','export'][i]],max=Math.max(1,data?.solar||0,data?.import||0,data?.export||0);
    g.querySelector('.flow-line').style.strokeWidth=String(1.5+(amount||0)/max*5);
    g.querySelector('.flow-static')?.setAttribute('d',i===2?'M5-3 0 0 5 3':'M-5-3 0 0-5 3');
    g.querySelector('.flow-static')?.setAttribute('transform',i===0?'translate(52 172)':i===1?'translate(52 188)':'translate(10 312)');
   });
  }
  if(layout==='spine'){
   wires.setAttribute('viewBox','0 0 400 196');
   const paths=['M200 0V36','M208 196V160','M192 160V196'];
   groups.forEach((g,i)=>{
    g.querySelectorAll('.flow-bed,.flow-line,.flow-pulse').forEach(path=>path.setAttribute('d',paths[i]));
    g.querySelector('.flow-static')?.setAttribute('d',i===1?'m-3 3 3-3 3 3':'m-3-3 3 3 3-3');
    g.querySelector('.flow-static')?.setAttribute('transform',i===0?'translate(200 23)':i===1?'translate(208 170)':'translate(192 186)');
   });
   if(data?.home>0&&!data.battery){
    const solar=Math.min(data.home,Math.max(0,(data.solar||0)-(data.export||0))),share=Math.round(solar/data.home*100);
    const mix=document.createElement('div');mix.className='source-mix';mix.style.setProperty('--solar-share',share+'%');
    mix.innerHTML='<div class="mix-labels"><span>Zon <strong>'+share+'%</strong></span><span>Net <strong>'+(100-share)+'%</strong></span></div><div class="mix-track" role="img" aria-label="Berekende bronnenmix: '+share+' procent zon, '+(100-share)+' procent net"></div>';
    root.querySelector('.home-node').append(mix);
   }
  }
 }
}
customElements.define('eleven-energy-flow-design',EnergyFlowDesign);
