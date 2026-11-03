import {headerSceneStyles} from '../../../shared/header-scene.js';
import {weatherBackgroundStyles} from './weather-backgrounds.js';
import {weatherAtmosphereStyles} from './weather-atmosphere.js';
import {weatherStyledIconStyles} from './weather-icon-styles.js';
export const weatherStyles=`
:host{display:block;min-width:0;container-type:inline-size;font:inherit}
*{box-sizing:border-box}ha-card{display:block;overflow:hidden;border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font:inherit}
/* Supplemental semantic glyphs have fresh paint; readable text is a separate theme role. */
.content{position:relative;isolation:isolate;padding:var(--eleven-card-padding,16px);--weather-icon-tone:#6599bb;--weather-text-tone:var(--secondary-text-color,#666);--tone:var(--weather-icon-tone)}.content[data-dark=true]{--weather-icon-tone:#add6ef}
.content[data-kind=sun],.content[data-kind=partly]{--weather-icon-tone:#f3b51b}.content[data-dark=true]:is([data-kind=sun],[data-kind=partly]){--weather-icon-tone:#ffd45c}
.content[data-kind=rain]{--weather-icon-tone:#269ad5}.content[data-dark=true][data-kind=rain]{--weather-icon-tone:#76cafa}
.content[data-kind=night],.content[data-kind=storm]{--weather-icon-tone:#8873dc}.content[data-dark=true]:is([data-kind=night],[data-kind=storm]){--weather-icon-tone:#b8a7ff}
.content[data-kind=snow]{--weather-icon-tone:#32a9bb}.content[data-dark=true][data-kind=snow]{--weather-icon-tone:#8bdeec}
.scene{position:relative;isolation:isolate;margin:-16px -16px 0;padding:16px 16px 16px;overflow:visible}
.hero{min-height:160px;position:relative;display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;align-content:start;padding-top:6px}
.temperature{font-size:76px;font-weight:500;line-height:1.15;letter-spacing:-.065em;font-variant-numeric:tabular-nums;margin-top:-20px}.temperature .unit{font-size:.53em;letter-spacing:-.03em;margin-left:2px}
header{text-align:right;min-width:0;padding-top:17px;margin-top:-20px;z-index:1}h2{font-size:18px;font-weight:650;line-height:1.25;margin:0;color:var(--primary-text-color,#20252b);overflow-wrap:anywhere}.feels{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin-top:2px}.feels strong{font-weight:600;color:var(--primary-text-color)}
.art{position:absolute;inset:46px 0 0;display:grid;place-items:center;pointer-events:none;color:var(--secondary-text-color)}.art svg{height:116px;width:150px;filter:none}
button{font:inherit;color:inherit;cursor:pointer}.status,.metric{background:var(--secondary-background-color,#eee);border-radius:7px;padding:12px}.status{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:0;min-height:0;margin:16px 0 0}.status-icon{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:10px;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent)}.status-icon svg{width:30px;height:30px}.status strong{font-size:13px;line-height:1.4;font-weight:600}.status small{display:block;font-size:11px;color:var(--secondary-text-color,#666);margin-top:2px}
.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:0}.metrics:has(.metric:only-child){grid-template-columns:minmax(0,1fr)}.metric{min-width:0;display:grid;grid-template-rows:auto auto;gap:2px;align-content:start}.metric dt{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin:0;overflow-wrap:anywhere}.metric dd{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:0;overflow-wrap:anywhere}
.forecast{margin-top:16px}.forecast h3{font-size:11px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#666);margin:0 0 10px}.forecast-list{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(46px,1fr);gap:6px;overflow-x:auto;scrollbar-width:thin;padding:0 0 3px;list-style:none;margin:0}.forecast-list li{text-align:center;min-width:0}.forecast-list time{font-size:11px;color:var(--secondary-text-color,#666)}.forecast-list svg{display:block;width:38px;height:36px;margin:4px auto}.forecast-value{font-size:18px;line-height:1.35;font-weight:600;letter-spacing:-.02em;white-space:nowrap;font-variant-numeric:tabular-nums}.forecast-low,.rain-chance{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);min-height:16px;margin-top:3px}.rain-chance{color:var(--weather-text-tone)}
.notice{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#666);margin:10px 0}.retry{background:transparent;color:var(--primary-color,#2196f3);border:0;min-height:32px;padding:4px 0}.status:focus-visible,.retry:focus-visible,.forecast-list:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}.status:hover{filter:brightness(1.05)}
@container(max-width:320px){.hero{min-height:150px}.temperature{font-size:65px;margin-top:-17px}header{margin-top:-17px;padding-top:14px}.art svg{height:100px}.forecast-list{grid-auto-columns:minmax(46px,1fr)}}
@supports(grid-template-rows:subgrid){.metrics{grid-template-rows:auto auto;row-gap:2px}.metric{grid-row:span 2;grid-template-rows:subgrid}}
.forecast-panel{padding-top:16px}.forecast-panel[hidden]{display:none!important}
.metric-entity{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;text-align:start;max-width:100%;overflow-wrap:anywhere}.metric-entity:hover{color:var(--primary-color)}.metric-entity:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:3px}
.status>span:last-child{min-width:0;overflow-wrap:anywhere}.status-label{display:block;font-size:11px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:2px}.status-data strong{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.status-icon ha-icon{--mdc-icon-size:22px}
.content[data-compact=true] .hero{min-height:112px}
.content[data-compact=true] .temperature{font-size:64px;margin-top:-16px}
.content[data-compact=true] header{padding-top:14px;margin-top:-16px}
.content[data-compact=true] .art{inset:38px 0 0}
.content[data-compact=true] .art svg{height:74px;width:100px}
.content[data-compact=true] .scene{padding-bottom:12px}
.content:not(:has(.weather-metrics)) .scene{padding-bottom:0}
.content[data-compact=true] .status{padding:10px;gap:10px;margin-top:12px}
.content[data-compact=true] .status-data strong{font-size:22px}
.content[data-compact=true] .status-icon{width:32px;height:32px;border-radius:8px}
.content[data-compact=true] .status-icon svg{width:26px;height:26px}
.content[data-compact=true] .metrics{column-gap:12px}
.content[data-compact=true] .metric{padding:10px}
.content[data-compact=true] .metric dd{font-size:22px}
.content[data-compact=true] .forecast{margin-top:12px}
.content[data-compact=true] .forecast-panel{padding-top:12px}
.content[data-compact=true] .forecast-list svg{width:32px;height:30px;margin:2px auto}
@container(max-width:320px){.content[data-compact=true] .hero{min-height:104px}.content[data-compact=true] .art svg{height:66px}.content[data-compact=true] .temperature{font-size:56px;margin-top:-14px}.content[data-compact=true] header{margin-top:-14px;padding-top:12px}}
.forecast-extra{font-size:11px;line-height:1.4;margin-top:5px;color:var(--primary-text-color)}.forecast-label{display:block;overflow-wrap:anywhere;font-size:10px;color:var(--secondary-text-color)}
${weatherBackgroundStyles}

.wx-rays{transform-origin:70px 55px}
@media(prefers-reduced-motion:no-preference){
 .content[data-animated=true] .wx-rays{animation:wx-rotate 24s linear infinite}

 .content[data-animated=true] .wx-cloud{animation:wx-float 6s ease-in-out infinite}
 .content[data-animated=true] .wx-drop{animation:wx-rain 1.5s linear infinite}
 .content[data-animated=true] .wx-flake{animation:wx-snow 4s ease-in-out infinite}
 .content[data-animated=true] .wx-drop-two{animation-delay:-.5s}
 .content[data-animated=true] .wx-drop-three{animation-delay:-1s}
 .content[data-animated=true] .wx-moon{animation:wx-float 7s ease-in-out infinite}
 .content[data-animated=true] .wx-star{animation:wx-twinkle 4s ease-in-out infinite}
 .content[data-animated=true] .wx-star-two{animation-delay:-1.5s}
 .content[data-animated=true] .wx-star-three{animation-delay:-2.5s}
 .content[data-animated=true] .wx-wind path{stroke-dasharray:90 160;animation:wx-wind 4s linear infinite}
 .content[data-animated=true] .wx-wind path:nth-child(2){animation-delay:-1.2s}
 .content[data-animated=true] .wx-wind path:nth-child(3){animation-delay:-2.4s}
 .content[data-animated=true] .wx-fog{animation:wx-fog 7s ease-in-out infinite}
 .content[data-animated=true] .wx-lightning{animation:wx-lightning 5s ease-in-out infinite}
}
@keyframes wx-rotate{to{transform:rotate(360deg)}}

@keyframes wx-float{50%{transform:translate(3px,-2px)}}
@keyframes wx-rain{0%{transform:translate(2px,-3px);opacity:0}15%,75%{opacity:1}100%{transform:translate(-4px,12px);opacity:0}}
@keyframes wx-snow{0%{transform:translate(-2px,-2px);opacity:0}20%,70%{opacity:1}100%{transform:translate(4px,9px);opacity:0}}
@keyframes wx-twinkle{50%{opacity:.35}}
@keyframes wx-wind{to{stroke-dashoffset:-250}}
@keyframes wx-fog{50%{transform:translateX(5px);opacity:.55}}
@keyframes wx-lightning{0%,50%,100%{opacity:.4}70%,80%{opacity:1}}
${weatherAtmosphereStyles}
${weatherStyledIconStyles}
${headerSceneStyles}
`;

// Weather-specific anatomy and neutral role mapping; theme paint stays owned upstream.
export const weatherCalmStyles=`
/* Theme-owned readings; condition color belongs to icons, not a decorative wash. */
[data-ui-metric]{background:var(--secondary-background-color,transparent)}
.content .hero{min-height:124px}
.content[data-compact=true] .hero{min-height:100px}
.content .hero[data-wide-reading=true]{padding-bottom:116px;min-height:0}
.content .hero[data-wide-reading=true] .temperature{max-width:100%}
.content[data-icon-style] .hero[data-wide-reading=true]>.art{top:auto;bottom:0;height:110px}
.content[data-compact=true] .hero[data-wide-reading=true]{padding-bottom:86px}
.content[data-compact=true][data-icon-style] .hero[data-wide-reading=true]>.art{height:80px}
.weather-metrics{grid-template-columns:repeat(var(--weather-reading-columns,1),minmax(0,1fr));column-gap:12px;row-gap:12px}
.weather-metrics>[data-ui-metric]{padding:12px;min-height:44px}
[data-ui-metric] .ui-metric-title,[data-ui-metric] .ui-metric-info{font-size:12px;overflow-wrap:normal;word-break:normal}
[data-ui-metric] .ui-metric-icon{transform:none;width:20px;height:20px}
[data-ui-metric] .ui-metric-value{white-space:nowrap;overflow-wrap:normal;word-break:normal}
.weather-status{min-height:44px}
.ui-metric-unit{font-size:12px;white-space:nowrap}
[data-ui-tabs] [role=tab]:focus-visible,.retry:focus-visible,button[data-ui-metric]:focus-visible,.forecast-list:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}
.forecast-list{grid-auto-columns:minmax(max-content,1fr);gap:8px;padding-bottom:4px}
.forecast-list li{min-width:max-content}
.forecast-list time{font-size:12px;white-space:nowrap}
.forecast-atomic{display:inline-block;white-space:nowrap;overflow-wrap:normal;word-break:normal}
.forecast-label{font-size:11px;white-space:normal;overflow-wrap:normal;word-break:normal}
.forecast-low,.rain-chance,.forecast-extra{font-size:12px}
.retry{min-height:44px;padding:8px 12px;border-radius:var(--eleven-material-control-radius,12px);color:var(--accent-color,var(--primary-color));background:var(--secondary-background-color);font-size:13px}
`;
