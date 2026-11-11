import {segmentedControlStyles} from '../../../shared/card-theme.js';
export const energyFlowStyles=`
ha-card{border-radius:var(--ha-card-border-radius,12px)}
.content [data-ui-metric]:not(.circle-node){--ui-metric-radius:8px;background:var(--secondary-background-color,#eee)}
.content [data-ui-button],.content .period-trigger,.content .period-custom input,.content [data-ui-popup]{border-radius:8px}

:host{height:100%;min-height:0}ha-card{height:100%;min-height:0;overflow:auto;overscroll-behavior:auto;scrollbar-width:thin}
.content{--tone:#ffd45c;--solar:var(--energy-solar-color,#ffd45c);--grid:var(--energy-grid-consumption-color,#76cafa);--house:#74d8ac;--return:var(--energy-grid-return-color,#b8a7ff)}
.content[data-dark=false]{--tone:#f3b51b;--solar:var(--energy-solar-color,#f3b51b);--grid:var(--energy-grid-consumption-color,#269ad5);--house:#269b79;--return:var(--energy-grid-return-color,#8873dc)}
.content[data-color=waiting]{--tone:#82b8e8}.content[data-color=done]{--tone:#7ed79c}.content[data-color=planned]{--tone:#8fa5ff}.content[data-color=off]{--tone:#a7a9b2}
.content[data-dark=false][data-color=waiting]{--tone:#386c9b}.content[data-dark=false][data-color=done]{--tone:#277441}.content[data-dark=false][data-color=planned]{--tone:#4455ad}.content[data-dark=false][data-color=off]{--tone:#656975}
.header-region{display:grid;grid-template-columns:minmax(0,1fr);gap:16px 20px;align-items:start}
.energy-topline{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:start;gap:12px 20px;min-width:0}
.energy-heading{flex:0 1 auto;min-width:0;max-width:100%}
.energy-heading [data-ui-primary-value][data-primary-layout=uniform] .primary-label:not(button){min-height:0}
.toolbar{display:flex;align-items:start;flex:0 1 auto;width:auto;max-width:100%;min-width:0;margin-inline-start:auto;padding-top:2px}
.content[data-view=history] .toolbar{flex:1 1 260px;min-width:min(100%,260px)}
.toolbar .header-actions{margin:0;min-width:0;width:100%;max-width:100%}
.toolbar .chart-controls{flex-wrap:nowrap;gap:0;min-width:0;width:100%;max-width:100%}
.toolbar .view-period{display:flex;align-items:center;flex:1 1 auto;flex-wrap:nowrap;gap:0;min-width:0}
.toolbar .chart-controls>[data-period]{flex:none;width:36px;min-width:36px;padding:2px 4px}
.toolbar .chart-controls>[data-period=now]{width:36px}
.toolbar [data-view-button]{flex:none;min-height:36px;padding:2px 6px;font-size:12px;white-space:nowrap}
.toolbar .view-period .period-controls{position:relative;flex:1 1 auto;min-width:0;margin:0;padding:0;border:0}
.toolbar .view-period .period-trigger{width:100%;min-width:0;max-width:none;min-height:36px;padding:2px 6px;font-size:12px}
.toolbar .view-period .period-trigger>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.toolbar .view-period .period-trigger svg{width:14px;height:14px}
.circle-flow{grid-column:1/-1;min-width:0}
.circle-flow *{box-sizing:border-box}
/* Native labels and SVG routes use the same node size and gap geometry. */
.circle-scene{--flow-node-size:72px;--flow-node-top:56px;position:relative;display:block;width:100%;height:calc(var(--flow-node-top) + var(--flow-node-size) + 8px);margin:0 auto}
.content[data-compact=true] .circle-scene{--flow-node-top:48px}
.flow-routes{position:absolute;inset:0;pointer-events:none}
.flow-routes>svg{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible}
.circle-scene>.circle-node[data-ui-metric]{position:absolute;top:var(--flow-node-top);z-index:1;width:var(--flow-node-size);min-width:var(--flow-node-size);max-width:var(--flow-node-size);height:var(--flow-node-size);min-height:var(--flow-node-size)}
.circle-scene>[data-node=sun]{left:0}
.circle-scene>[data-node=home]{left:calc(50% - var(--flow-node-size)/2)}
.circle-scene>[data-node=grid]{right:0}
.circle-scene>[data-flow-value]{position:absolute;padding:0 2px;overflow-wrap:normal}
.circle-scene>[data-flow-value=return]{top:16px;left:calc(var(--flow-node-size)/2);right:calc(var(--flow-node-size)/2)}
.circle-scene>[data-flow-value=solar],.circle-scene>[data-flow-value=grid]{bottom:calc(20px + var(--flow-node-size)/2);width:calc(50% - var(--flow-node-size)*1.5)}
.circle-scene>[data-flow-value=solar]{left:var(--flow-node-size)}
.circle-scene>[data-flow-value=grid]{right:var(--flow-node-size)}
@container(max-width:340px){.circle-scene{--flow-node-size:60px}.circle-scene .flow-reading{font-size:14px}.circle-scene .flow-reading[data-long=true]{font-size:11px}.circle-scene .flow-unit{font-size:11px}}
.flow-route[data-route=solar]{color:var(--solar)}
.flow-route[data-route=return]{color:var(--return)}
.flow-route[data-route=grid]{color:var(--grid)}
.flow-bed{fill:none;stroke:currentColor;stroke-width:8;stroke-opacity:.16;stroke-linecap:round;stroke-linejoin:round}
.flow-wire{fill:none;stroke:currentColor;stroke-width:2.1;stroke-opacity:.9;stroke-linecap:round;stroke-linejoin:round}
.flow-route[data-active=false] .flow-bed{stroke:var(--divider-color,#ddd);stroke-width:2;stroke-opacity:.7}
.flow-route[data-active=false] .flow-wire{stroke-opacity:.12}
.flow-dot{fill:currentColor;r:3;offset-distance:0%;offset-rotate:0deg;animation:energy-flow-travel var(--route-duration,4s) linear infinite}
.circle-node[data-ui-metric]{--node-ink:var(--ui-metric-tone);width:max-content;max-width:none;min-width:72px;min-height:72px;height:auto;position:relative;isolation:isolate;grid-template-columns:minmax(0,1fr);grid-template-rows:22px auto;align-content:center;justify-items:center;row-gap:4px;column-gap:0;border:0;border-radius:8px}
.circle-node[data-ui-metric][data-density] .ui-metric-icon,.circle-node[data-ui-metric][data-density] .ui-metric-icon svg,.circle-node[data-ui-metric][data-density] .ui-metric-icon ha-icon{width:22px;height:22px;--mdc-icon-size:22px}
.circle-node .ui-metric-value{display:none}.circle-node[data-ui-metric] .ui-metric-title{grid-column:1;grid-row:2;justify-self:center;text-align:center;font-size:12px;font-weight:500;line-height:1.35;white-space:nowrap;overflow-wrap:normal;word-break:normal}
.circle-node[data-ui-metric][data-density] .ui-metric-icon{position:relative;grid-row:1;grid-column:1;justify-self:center;align-self:center;transform:none;color:var(--node-ink);overflow:visible}
.flow-reading{white-space:nowrap;position:relative;z-index:1;min-width:0;color:var(--primary-text-color,#20252b);font-family:inherit;font-size:16px;line-height:1.35;font-weight:600;letter-spacing:-.4px;text-align:center;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.flow-reading[data-long=true]{font-size:12px}.flow-unit{display:inline-block;margin-inline-start:4px;color:var(--secondary-text-color,#626a78);font-size:12px;font-weight:400;letter-spacing:0;white-space:nowrap}
.flow-arrow{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.flow-route[data-active=false] .flow-arrow{opacity:.24}
.header-region>[data-ui-metric]{grid-column:1/-1}
.flow-secondary{margin-top:12px}
.content .flow-secondary .ui-metric-title{overflow-wrap:normal;word-break:normal}
.toolbar [data-view-button]{min-height:36px}
@container(max-width:340px){.content .flow-secondary{grid-template-columns:minmax(0,1fr)}}
.content[data-animated=false] .flow-dot,.content[data-view=history] .flow-dot{display:none}
:host([data-motion-paused]) .flow-dot{animation-play-state:paused}
.content[data-compact=true] .header-region{row-gap:12px}
@keyframes energy-flow-travel{to{offset-distance:100%}}
@media(prefers-reduced-motion:reduce){.circle-scene .flow-dot{display:none}}
.toolbar .period-menu-navigation{display:none}
${segmentedControlStyles('.toolbar .chart-controls','.toolbar [data-view-button],.toolbar .period-trigger,.toolbar .chart-controls>[data-period]',{first:'.toolbar .period-trigger,.toolbar .view-period>[data-view-button]',last:'.toolbar [data-view-button]',dividers:'.toolbar .chart-controls>[data-period],.toolbar .chart-controls>[data-view-button]'})}
/* Keep navigation on one row; long period labels may wrap inside the picker. */
.toolbar .view-period .period-trigger>span{overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:anywhere;text-align:start}

`;
