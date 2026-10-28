export const energyFlowStyles=`
ha-card{border-radius:var(--ha-card-border-radius,12px)}
.content [data-ui-metric]{--ui-metric-radius:8px}
.content [data-ui-button],.content .period-trigger,.content .period-custom input,.content [data-ui-popup]{border-radius:8px}

:host{height:100%;min-height:0}ha-card{height:100%;min-height:0;overflow:auto;overscroll-behavior:auto;scrollbar-width:thin}
.content{--tone:#d9b77c;--solar:#d9b77c;--grid:#91a9c7;--house:#9bc9b2}
.content[data-dark=false]{--tone:#92641c;--solar:#946800;--grid:#356da6;--house:#34785d}
.content[data-color=waiting]{--tone:#82b8e8}.content[data-color=done]{--tone:#7ed79c}.content[data-color=planned]{--tone:#8fa5ff}.content[data-color=off]{--tone:#a7a9b2}
.content[data-dark=false][data-color=waiting]{--tone:#386c9b}.content[data-dark=false][data-color=done]{--tone:#277441}.content[data-dark=false][data-color=planned]{--tone:#4455ad}.content[data-dark=false][data-color=off]{--tone:#656975}
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
.circle-scene{position:relative;width:100%;aspect-ratio:412/164;margin:0 auto}
.circle-scene foreignObject{overflow:visible}
.circle-scene>svg{display:block;width:100%;height:100%;overflow:visible}
.flow-route[data-route=solar]{color:var(--solar)}
.flow-route[data-route=return]{color:#b4a0db}.content[data-dark=false] .flow-route[data-route=return]{color:#8060b1}
.flow-route[data-route=grid]{color:var(--grid)}
.flow-bed{fill:none;stroke:currentColor;stroke-width:8;stroke-opacity:.16;stroke-linecap:round;stroke-linejoin:round}
.flow-wire{fill:none;stroke:currentColor;stroke-width:2.1;stroke-opacity:.9;stroke-linecap:round;stroke-linejoin:round}
.flow-route[data-active=false] .flow-bed{stroke:var(--divider-color,#ddd);stroke-width:2;stroke-opacity:.7}
.flow-route[data-active=false] .flow-wire{stroke-opacity:.12}
.flow-dot{fill:currentColor;r:3;offset-distance:0%;offset-rotate:0deg;animation:energy-flow-travel var(--route-duration,4s) linear infinite}
.circle-node[data-ui-metric]{--node-ink:var(--ui-metric-tone);width:100%;height:100%;position:relative;isolation:isolate;grid-template-columns:minmax(0,1fr);grid-template-rows:22px 16px;align-content:center;justify-items:center;row-gap:4px;column-gap:0;border:0;border-radius:8px;background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--node-ink) 10%,transparent),color-mix(in srgb,var(--node-ink) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee)}
.circle-node[data-ui-metric][data-density] .ui-metric-icon,.circle-node[data-ui-metric][data-density] .ui-metric-icon svg{width:22px;height:22px}
.circle-node .ui-metric-value{display:none}.circle-node[data-ui-metric] .ui-metric-title{grid-column:1;grid-row:2;justify-self:center;text-align:center;font-size:11px;font-weight:500;line-height:16px}
.circle-node[data-ui-metric][data-density] .ui-metric-icon{position:relative;grid-row:1;grid-column:1;justify-self:center;align-self:center;transform:none;color:var(--node-ink);overflow:visible}
.circle-node[data-ui-metric] .ui-metric-icon::before{content:'';position:absolute;inset:-29px -31px;border-radius:50%;background:radial-gradient(ellipse,color-mix(in srgb,var(--node-ink) 13%,transparent),color-mix(in srgb,var(--node-ink) 4%,transparent) 48%,transparent 76%);z-index:-1;pointer-events:none}
.flow-reading{fill:var(--primary-text-color,#20252b);font-family:inherit;font-size:18px;font-weight:600;letter-spacing:-.4px;font-variant-numeric:tabular-nums}.flow-reading[data-long=true]{font-size:12px}.flow-unit{fill:var(--secondary-text-color,#626a78);font-size:11px;font-weight:400;letter-spacing:0}
.flow-arrow{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.flow-route[data-active=false] .flow-arrow{opacity:.24}
.header-region>[data-ui-metric]{grid-column:1/-1;grid-row:3}
.flow-secondary{margin-top:12px}
.content[data-animated=false] .flow-dot,.content[data-view=history] .flow-dot{display:none}
:host([data-motion-paused]) .flow-dot{animation-play-state:paused}
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
 .toolbar .view-period>[data-view-button],.toolbar .view-period .period-controls{background:var(--secondary-background-color,#eee);border-radius:8px}
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
