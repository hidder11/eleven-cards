export const energyFlowStyles=`
:host{height:100%;min-height:0}ha-card{height:100%;min-height:0;overflow:auto;overscroll-behavior:auto;scrollbar-width:thin}
.content{--tone:#d9b77c;--solar:#d9b77c;--grid:#91a9c7;--house:#9bc9b2;--primary-color:var(--tone)}
.content[data-dark=false]{--tone:#92641c;--solar:#946800;--grid:#356da6;--house:#34785d}
.header-region{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px 12px;align-items:start}
.energy-heading{grid-column:1;grid-row:1;min-width:0;--ui-primary-size:60px;--ui-primary-unit-size:16px}
.energy-heading:has([data-long=true]){--ui-primary-size:34px}
.toolbar{grid-column:2;grid-row:1;display:flex;justify-content:flex-end;align-items:start;max-width:280px;min-width:0;margin:0!important}
.toolbar .header-actions{margin:0;min-width:0;max-width:100%}
.toolbar .chart-controls{flex-wrap:nowrap;justify-content:flex-end;gap:0;min-width:0;max-width:100%}
.toolbar .view-period{display:flex;align-items:center;flex:1 1 auto;flex-wrap:nowrap;gap:0;min-width:0}
.toolbar .chart-controls>[data-period]{flex:none;width:28px;min-width:0;padding:4px}
.toolbar .chart-controls>[data-period=now]{width:30px}
.toolbar .view-period>[data-view-button]{flex:none;min-height:32px;padding:4px 8px;white-space:nowrap}
.toolbar .view-period .period-controls{position:relative;flex:1 1 auto;min-width:0;margin:0;padding:0;border-inline-start:1px solid var(--divider-color,#ddd)}
.toolbar .view-period .period-trigger{width:100%;min-width:0;max-width:190px}
.toolbar .view-period .period-trigger>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.toolbar .view-period .period-trigger svg{width:14px;height:14px}
.circle-flow{grid-column:1/-1;grid-row:2;min-width:0}
.circle-flow *{box-sizing:border-box}
.circle-scene{position:relative;width:100%;max-width:400px;aspect-ratio:360/200;margin:0 auto}
.circle-scene>svg{display:block;width:100%;height:100%;overflow:visible}
.flow-route[data-route=solar],.flow-route[data-route=return]{color:var(--solar)}
.flow-route[data-route=grid]{color:var(--grid)}
.flow-bed{fill:none;stroke:var(--divider-color,#ddd);stroke-width:4;stroke-opacity:.55;stroke-linecap:round;stroke-linejoin:round}
.flow-wire{fill:none;stroke:currentColor;stroke-width:1.2;stroke-opacity:.55;stroke-linecap:round;stroke-linejoin:round}
.flow-route[data-active=false] .flow-wire{stroke-opacity:.12}
.flow-dot{fill:currentColor;offset-distance:0%;offset-rotate:0deg;animation:energy-flow-travel var(--route-duration,4s) linear infinite}
.circle-node{--node-tone:var(--house);position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:clamp(58px,20%,76px);aspect-ratio:1;border:1px solid color-mix(in srgb,var(--node-tone) 35%,transparent);border-radius:50%;background:radial-gradient(ellipse at 50% 15%,color-mix(in srgb,var(--node-tone) 9%,transparent),transparent 75%),var(--ha-card-background,var(--card-background-color,#fff));box-shadow:0 0 0 4px color-mix(in srgb,var(--node-tone) 4%,transparent);transform:translate(-50%,-50%);color:var(--node-tone)}
.circle-node::after{content:'';position:absolute;inset:4px;border:1px solid color-mix(in srgb,var(--node-tone) 9%,transparent);border-radius:50%;pointer-events:none}
.circle-node svg{display:block;width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.circle-node span{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#626a78)}
.circle-node[data-node=sun]{left:50%;top:21%;--node-tone:var(--solar)}
.circle-node[data-node=grid]{left:15.56%;top:72.5%;--node-tone:var(--grid)}
.circle-node[data-node=home]{left:84.44%;top:72.5%}
.circle-node[data-node=grid][data-direction=export]{--node-tone:var(--solar)}
.circle-node[data-direction=unknown]{opacity:.5}
.header-region>[data-ui-metric]{grid-column:1/-1;grid-row:3}
.flow-secondary{margin-top:12px}
.content[data-animated=false] .flow-dot,.content[data-view=history] .flow-dot{display:none}
:host([data-motion-paused]) .flow-dot{animation-play-state:paused}
.content[data-compact=true] .circle-scene{max-width:300px}
.content[data-compact=true] .circle-node{width:clamp(54px,19%,64px)}
.content[data-compact=true] .header-region{row-gap:12px}
.content[data-compact=true] .energy-heading{--ui-primary-size:46px;--ui-primary-unit-size:14px}
@keyframes energy-flow-travel{to{offset-distance:100%}}
@media(prefers-reduced-motion:reduce){.circle-scene .flow-dot{display:none}}
.toolbar .period-menu-navigation{display:none}
@container(max-width:480px){
 .header-region{grid-template-columns:minmax(0,1fr) 100px;column-gap:8px}
 .toolbar{width:100%;max-width:100%;justify-self:end}
 .toolbar .header-actions,.toolbar .chart-controls,.toolbar .view-period{width:100%}
 .toolbar .chart-controls{background:none}
 .toolbar .chart-controls>[data-period]{display:none}
 .toolbar .view-period{flex-direction:column;align-items:stretch;gap:4px}
 .toolbar .view-period>[data-view-button],.toolbar .view-period .period-controls{background:var(--secondary-background-color,#eee);border-radius:5px}
 .toolbar .view-period .period-controls{border:0}
 .toolbar .view-period .period-trigger{padding:4px 6px;gap:3px;min-height:32px}
 .toolbar .view-period .period-trigger>span,.toolbar .view-period>[data-view-button]{font-size:11px}
 .toolbar .period-menu-navigation{display:flex}
 .energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:46px;--ui-primary-unit-size:14px}
 .energy-heading:has([data-long=true]){--ui-primary-size:30px}
}
@container(max-width:319px){
 .header-region{row-gap:12px}
 .energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:36px;--ui-primary-unit-size:12px}
 .energy-heading:has([data-long=true]){--ui-primary-size:25px}
}
@container(max-width:270px){.energy-heading,.content[data-compact=true] .energy-heading{--ui-primary-size:32px}}
`;
