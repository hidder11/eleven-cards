import {uiDetailSurfaceStyles} from '../../../shared/ui-detail-surface.js';
import {uiSurfaceStyles} from '../../../shared/ui-surface.js';
import {cardThemeStyles,segmentedControlStyles} from '../../../shared/card-theme.js';
export function calendarCardStyles(){return uiDetailSurfaceStyles()+uiSurfaceStyles('.navigation,.info-button')+`
:host{display:block;height:100%;min-width:0;min-height:0;container-type:inline-size}
ha-card{display:flex;flex-direction:column;height:100%;min-width:0;min-height:0;overflow:hidden;box-sizing:border-box;color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));font:inherit}
.content{display:flex;flex:1;flex-direction:column;padding:var(--eleven-card-padding,16px);min-width:0;min-height:0;box-sizing:border-box;overflow:hidden}
.content>.header,.content>.legend,.content>.status{flex-shrink:0}
.calendar-body{flex:1;min-height:0;overflow:auto;scrollbar-width:thin}
.legend-error{display:inline-grid;place-items:center;width:13px;height:13px;border:1px solid currentColor;border-radius:50%;color:var(--error-color,#db4437);font-size:10px;line-height:1;flex:none}
.event-button[data-next-event] .event-title{font-weight:650}
.header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 12px;margin-bottom:12px}
.header h2{font-size:18px;line-height:1.25;font-weight:650;margin:0;min-width:72px;flex:1}
.header-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0;margin-inline-start:auto}
.navigation{display:flex;align-items:center;min-width:0;border-radius:8px;background:var(--secondary-background-color,#f3f3f3)}
.navigation .range{padding:0 9px;white-space:nowrap;font-size:11px;font-variant-numeric:tabular-nums;border-inline-end:1px solid var(--divider-color,#ddd)}
.navigation [data-nav=now]{width:auto;padding:0 9px}
.header-actions svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.info-button{background:var(--secondary-background-color,#f3f3f3);border-radius:8px}
.legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 15px;margin:0 0 12px;font-size:11px;color:var(--secondary-text-color,#666)}
.legend-item{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;min-height:26px;padding:3px 0;border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;text-align:start;cursor:pointer}.legend-item[aria-pressed="false"]{opacity:.45}.legend-item[aria-pressed="false"] span{text-decoration:line-through}.legend-item:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}.legend-item span{overflow-wrap:anywhere}.dot{width:7px;height:7px;border-radius:2px;flex:none;background:var(--event-color)}
.status{font-size:12px;line-height:1.45;color:var(--secondary-text-color,#666);margin:6px 0 12px}
.status.error{color:var(--error-color,#db4437)}.status button{margin-inline-start:8px}
.day-list{display:grid}

.day-title time{font-size:11px;font-weight:400;color:var(--secondary-text-color,#666)}
.weather{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-size:11px;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums}
.weather svg{width:21px;height:21px;flex:none;stroke:currentColor;stroke-width:1.5;fill:none;stroke-linecap:round;stroke-linejoin:round}
.weather b{font-weight:600;color:var(--primary-text-color,#20252b)}

.event-time{font-size:11px;color:var(--secondary-text-color,#666);font-variant-numeric:tabular-nums;line-height:1.4}
.list-event>.event-time small{display:block;font-size:10px}

.horizontal{overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--divider-color,#ddd) transparent}

.column-heading time{font-size:11px;color:var(--secondary-text-color,#666);font-weight:400;margin-inline-start:4px}

.month-cell.outside{background:color-mix(in srgb,var(--secondary-text-color,#666) 4%,transparent)}
.month-cell.past{background:color-mix(in srgb,var(--secondary-text-color,#666) 4%,transparent)}
.month-cell.past .month-cell-head,.month-cell.past .weather b{color:var(--secondary-text-color,#666)}

.month-cell.outside .month-cell-head time{color:var(--secondary-text-color,#666)}
.month-cell .weather{gap:2px;font-size:10px}
.month-cell .weather svg{width:17px;height:17px}
.month-cell .weather .low{display:none}

.compact .content{padding:var(--eleven-card-padding,16px)}.compact .header{margin-bottom:8px}.compact .legend{margin-bottom:7px}

.compact .empty-day{padding:3px 0}
.compact .column-heading{min-height:48px;margin-bottom:5px;gap:3px}

.compact .column .event-time{margin-bottom:2px}
.compact .month-cell{min-height:74px;padding:3px 4px 5px}
.compact .month-cell-head{min-height:19px;margin-bottom:2px}

.compact .month-more{min-height:23px;padding:3px 5px;font-size:10px}
.calendar-event-popup{width:min(380px,calc(100vw - 16px))}.calendar-event-popup .ui-popup-heading>strong{min-width:0;overflow-wrap:anywhere}
.popup-calendar{display:flex;align-items:center;gap:7px;margin:5px 0 12px;color:var(--secondary-text-color,#666);font-size:11px}
.popup-when{padding:10px 12px;background:var(--secondary-background-color,#f3f3f3);border-radius:6px}
.popup-date,.popup-date-range{display:flex;flex-wrap:wrap;gap:3px 6px;overflow-wrap:anywhere;font-size:12px;font-weight:600}
.popup-date-range{display:grid;gap:2px}.popup-date-range .popup-date-separator{color:var(--secondary-text-color,#666)}
.popup-time{margin-top:3px;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}.popup-field{padding:10px 0 0;margin-top:10px;border-top:1px solid var(--divider-color,#ddd)}
.popup-field-label{display:block;margin-bottom:3px;color:var(--secondary-text-color,#666);font-size:10px}.popup-location,.popup-description{font-size:12px;overflow-wrap:anywhere}.popup-description{white-space:pre-wrap}
.popup-more{list-style:none;padding:0;margin:9px 0}.popup-more li{padding:5px 0;border-top:1px solid var(--divider-color,#ddd);font-size:11px}.popup-more summary{cursor:pointer}.popup-more small{display:block;color:var(--secondary-text-color,#666)}.popup-more-detail{padding:8px 0 10px 12px}
.calendar-info .insight-sensors{display:grid;gap:10px}
.calendar-info .calendar-agenda-metrics{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}
.calendar-info .calendar-agenda-metrics>div:last-child dd{font-size:14px;line-height:1.5;letter-spacing:0}

.calendar-info .calendar-agenda-metrics dd small{display:block;margin-top:2px;font-size:10px;font-weight:400;color:var(--secondary-text-color,#666)}

.calendar-info .insight-sensor-heading{display:flex;align-items:center;gap:8px;min-width:0}.calendar-info .insight-sensor-heading strong{flex:1;min-width:0;overflow-wrap:anywhere}
.calendar-info .insight-states{font-size:10px;color:var(--secondary-text-color,#666);margin-top:4px}
@container(max-width:420px){.content{padding:var(--eleven-card-padding,16px)}.header{align-items:flex-start}.header-actions{gap:5px}.navigation .range{font-size:10px;padding:0 6px}.navigation [data-nav=now]{padding:0 6px}.list-event{grid-template-columns:50px minmax(0,1fr);gap:8px}.weather{font-size:10px}}
.header-actions [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}.legend-item{min-height:44px;min-width:44px}
/* Calendar-local calm agenda anatomy; paint remains theme-owned. */
.calendar-body{min-width:0}
.header,.compact .header{gap:12px;margin-bottom:12px;align-items:center;flex-wrap:nowrap}
.header h2{font-size:16px;font-weight:600;line-height:24px;min-width:0;overflow-wrap:anywhere}
.header svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.header{position:relative}
.calendar-tools{margin-inline-start:auto;flex:none;height:24px}
.calendar-tools summary{display:flex;align-items:center;justify-content:center;list-style:none;width:44px;height:44px;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));cursor:pointer;color:var(--secondary-text-color)}
.calendar-tools summary{position:relative;top:-10px}
.calendar-tools summary::-webkit-details-marker{display:none}
.calendar-tools summary svg{width:22px;height:22px;stroke-width:3}
.calendar-tools summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}
.calendar-tools-panel{position:absolute;z-index:5;inset-inline-end:0;top:48px;width:max-content;max-width:100%;padding:8px;box-sizing:border-box;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color);box-shadow:var(--eleven-material-surface-shadow,var(--ha-card-box-shadow,none))}
.calendar-tools:not([open])>.calendar-tools-panel{display:none}
.calendar-tools-panel .info-button{display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;min-height:44px;padding:8px 10px;font-size:13px;white-space:normal;text-align:start}
.calendar-tools-panel .info-button span{min-width:0;overflow-wrap:anywhere}
.calendar-tools-panel .info-button svg{flex:none}
.header-actions{width:100%;margin:0 0 12px;flex-shrink:0}
.header-actions:empty{display:none}
.navigation{width:100%;gap:0;background:var(--secondary-background-color,#eee);box-shadow:none;border-radius:8px;flex-wrap:wrap}
.navigation-actions{display:flex;align-items:center;gap:0;flex:none;margin-inline-start:auto}
.navigation .range{flex:1 1 6em;min-width:0;white-space:normal;overflow-wrap:anywhere;border:0;padding:8px;font-size:13px;line-height:1.4;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
.navigation [data-nav=now]{padding:8px;min-width:44px;font-size:13px}
.navigation [data-nav]{flex:none}
.legend,.compact .legend{gap:8px;margin-bottom:16px;font-size:12px}
.legend-item{padding:8px 10px;gap:7px;line-height:1.4;box-sizing:border-box;min-width:44px;min-height:44px}
.legend-item[aria-pressed=false]{opacity:1;color:var(--secondary-text-color)}
.legend-item[aria-pressed=false] .dot{opacity:.45}
.legend-item[aria-pressed=true]{color:var(--eleven-material-selection-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 40%,var(--primary-text-color)));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);transform:translateY(1px)}
.legend-item[aria-pressed=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.compact .list-day+.list-day{border-top:0;margin-top:16px;padding-top:0}
.day-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px 10px}
.day-title time,.weather{font-size:12px}
.day-list .day-heading{padding-bottom:6px;border-bottom:1px solid var(--divider-color)}
.list-event{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:start;padding:4px 0;font-size:12px}
.list-event>.event-time{min-width:0;font-size:11px;line-height:1.5;padding-top:7px;overflow-wrap:normal}
.event-button .event-title{display:block;font-weight:500;overflow-wrap:anywhere;font-size:13px;line-height:1.45;white-space:normal;overflow:visible;text-overflow:clip}
.column .event-title{font-size:13px;line-height:1.45;white-space:normal;overflow:visible;text-overflow:clip}
.event-button .event-meta{display:block;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;font-size:12px;line-height:1.45;margin-top:3px}
.column .event-meta{font-size:12px;line-height:1.45;margin-top:3px}
.column .event-time{display:block;margin-bottom:4px;font-size:12px;color:var(--secondary-text-color)}
.event-button{display:block!important;min-width:0;width:100%;text-align:start;padding:0 0 0 9px!important;border-inline-start:3px solid var(--event-color)!important;border-radius:0!important;line-height:1.35;min-height:44px!important}
.compact .column .event-button{margin-bottom:4px;padding:4px 6px 4px 8px!important;min-height:44px!important}
.empty-day{color:var(--secondary-text-color,#666);margin:0;font-size:12px;line-height:1.5;padding:8px 0}
.day-list .empty-day{font-size:11px;line-height:1.3;padding:2px 0}

.compact .month-more,.popup-more summary{min-height:44px;min-width:44px;box-sizing:border-box}
.popup-calendar{overflow-wrap:anywhere;font-size:12px}.popup-calendar .dot{flex:none}
.popup-date time,.popup-date-range time{min-width:0;overflow-wrap:anywhere}
.content [data-ui-popup] [data-ui-button]{min-height:44px;min-width:44px;box-sizing:border-box}
.popup-field-label{font-size:12px}.popup-location,.popup-description{font-size:13px;line-height:1.5}
${cardThemeStyles({periodUI:true,wells:'.calendar-info [data-ui-detail-surface]',controls:'.info-button,.period-options [data-ui-button=surface],.period-custom [type=submit]',surfaces:'[data-ui-popup],.tooltip,[data-ui-detail-surface]'})}
/* Match chart legends: functional swatches and plain labels. */
.header-actions:has(+.legend){margin-bottom:4px}
.legend,.compact .legend{display:flex;flex-wrap:wrap;gap:4px 12px;margin:0 0 8px;font-size:12px}
.legend-item{padding:4px 0;gap:6px;min-width:24px;min-height:28px;justify-content:flex-start;border:0;border-radius:4px;background:transparent;box-shadow:none;color:var(--secondary-text-color);font-weight:400;line-height:1.3}
@media(pointer:coarse){.legend-item{min-width:44px;min-height:44px}}
.legend-item[aria-pressed=true],.legend-item[aria-pressed=true]:hover,.legend-item[aria-pressed=false],.legend-item[aria-pressed=false]:hover{background:transparent;box-shadow:none;color:var(--secondary-text-color)}
.legend-item .dot{width:9px;height:9px;border-radius:3px}
.navigation{flex-wrap:nowrap}
.navigation .range{display:flex;align-items:center;flex:1 1 auto;min-width:0;padding:8px 12px;box-sizing:border-box;white-space:normal;overflow-wrap:anywhere;line-height:1.35;border:0}
.navigation>.period-controls{flex:1 1 auto;min-width:0}
.navigation>.period-controls>.period-trigger{width:100%;padding:4px 6px;font-size:12px;justify-content:space-between}
.navigation>[data-period]{flex:none;font-size:12px}
.period-menu .period-options [data-ui-button]{min-width:0;min-height:44px}
${segmentedControlStyles('.navigation','.navigation>.period-controls>.period-trigger,.navigation>[data-period]',{first:'.navigation>.period-controls>.period-trigger',dividers:'.navigation>[data-period]'})}

/* Recessed calendar grid, day surfaces and softly tinted appointments. */
.month-grid{display:grid;grid-template-columns:repeat(7,minmax(76px,1fr));min-width:532px;background:var(--eleven-material-inset,var(--secondary-background-color));box-shadow:var(--eleven-material-well,none);border:0;border-radius:var(--eleven-material-radius-well,12px);overflow:hidden}

.month-weekday{text-align:center;font-size:11px;font-weight:400;padding:10px 5px;color:var(--secondary-text-color);border:0;border-bottom:1px solid color-mix(in srgb,var(--secondary-text-color) 14%,transparent);border-inline-end:1px solid color-mix(in srgb,var(--secondary-text-color) 10%,transparent)}
.month-grid>:nth-child(7n){border-inline-end:0}
.month-grid>:nth-last-child(-n+7){border-bottom:0}
.month-cell{min-width:0;border:0;border-bottom:1px solid color-mix(in srgb,var(--secondary-text-color) 14%,transparent);border-inline-end:1px solid color-mix(in srgb,var(--secondary-text-color) 10%,transparent);min-height:100px;padding:4px;box-sizing:border-box}
.month-cell-head{display:flex;align-items:center;justify-content:space-between;gap:2px;font-size:12px;margin-bottom:3px;min-height:28px}
.month-cell-head time{position:relative;display:inline-grid;place-items:center;width:28px;height:28px;font-weight:400;border:0;border-radius:0;background:transparent;box-shadow:none}
.month-cell.today{box-shadow:none}
.month-cell.today .month-cell-head time{color:var(--accent-color,var(--primary-color));background:transparent;box-shadow:none;font-weight:600}
.month-cell.today .month-cell-head time::after{content:'';position:absolute;bottom:0;left:9px;width:10px;height:2px;border-radius:1px;background:currentColor}
.month-cell.outside:not(.past){color:var(--secondary-text-color);background:color-mix(in srgb,var(--secondary-text-color) 2%,transparent)}

.month-chip .month-event-time{display:block;font-size:10px;line-height:12px;color:var(--secondary-text-color);font-variant-numeric:tabular-nums;margin:0;white-space:nowrap}
.month-chip .month-event-title{display:block;min-width:0;white-space:nowrap;line-height:16px;overflow:hidden;text-overflow:ellipsis}
.event-button:hover{color:var(--primary-text-color)}
.month-cell.past .month-chip:hover{background:color-mix(in srgb,var(--secondary-text-color,#666) 14%,transparent);color:var(--secondary-text-color)}
.month-more{display:block;min-height:44px;min-width:44px;padding:4px 6px;border:0;background:transparent;color:var(--secondary-text-color,#666);font:inherit;cursor:pointer;text-align:start;font-size:11px}
.column{min-width:0;background:var(--eleven-material-inset,var(--secondary-background-color));box-shadow:var(--eleven-material-well,none);border:0;border-radius:var(--eleven-material-radius-well,12px);padding:10px!important}
.list-day{background:var(--eleven-material-inset,var(--secondary-background-color));box-shadow:var(--eleven-material-well,none);border:0;border-radius:var(--eleven-material-radius-well,12px);padding:10px!important}

.day-columns{display:grid;grid-template-columns:repeat(var(--days),minmax(132px,1fr));min-width:calc(var(--days)*132px);gap:8px}
.day-title{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 7px;line-height:1.4;font-size:12px;font-weight:500}
.column-heading{display:flex;flex-direction:column;gap:6px;min-height:64px;margin-bottom:9px;font-size:12px;font-weight:500}

.column .event-button:hover,.list-event .event-button:hover{background:color-mix(in srgb,var(--event-color) 17%,transparent)}
.month-chip:hover{color:var(--primary-text-color);background:color-mix(in srgb,var(--event-color) 17%,transparent)}
.list-day+.list-day{margin-top:8px;border-top:0;padding-top:10px!important}
.column+.column{border-inline-start:0}
.month-cell.past .month-chip{color:var(--secondary-text-color,#666);border-inline-start-color:color-mix(in srgb,var(--secondary-text-color,#666) 50%,transparent)!important;background:color-mix(in srgb,var(--secondary-text-color,#666) 6%,transparent)}

/* Appointment surfaces share one tint, colour rail and outer shadow. */
.column .event-button{padding:7px 7px 7px 9px!important;margin-bottom:7px}
.month-chip{width:100%;min-width:0;text-align:start;margin:0 0 4px;border:0!important;white-space:normal;text-overflow:clip;overflow-wrap:anywhere;display:block!important;min-height:40px!important;height:40px;max-height:40px;margin-bottom:5px;padding:4px 5px!important;font-size:12px;line-height:16px;overflow:hidden;box-sizing:border-box}
.list-event .event-button{font-size:13px;min-height:44px!important;padding:6px 4px 6px 9px!important}
.month-chip,.list-event .event-button,.column .event-button{background:color-mix(in srgb,var(--event-color) 10%,transparent);border-inline-start:2px solid var(--event-color)!important;border-radius:0 6px 6px 0!important;box-shadow:0 2px 4px color-mix(in srgb,var(--eleven-material-shadow,rgba(0,0,0,.18)) 85%,transparent)}
.month-chip[data-past-event],.list-event .event-button[data-past-event],.column .event-button[data-past-event]{box-shadow:0 1px 3px color-mix(in srgb,var(--eleven-material-shadow,rgba(0,0,0,.18)) 45%,transparent)}
.compact .event-meta{display:none}
/* Compact day lists keep readable rows without expanded-mode whitespace. */
.compact .day-list .list-day{padding:8px!important}
.compact .day-list .list-day+.list-day{margin-top:8px;padding-top:8px!important}
.compact .day-list .day-heading{margin-bottom:4px;padding-bottom:4px}
.compact .day-list .list-event{padding:2px 0}
.compact .day-list .list-event>.event-time{padding-top:4px}
.compact .day-list .event-button{min-height:32px!important;padding:4px 4px 4px 9px!important}
`;}
