// A shared grid for every event. The rail follows row height, including wrapped
// names, and the symbol centre aligns with the first line of the description.
export const cameraActivityStyles=`
:host .camera-activity{--activity-time-width:40px;--activity-symbol-size:24px;--activity-gap:10px;min-width:0}
:host .camera-activity-list{gap:16px}
:host .camera-activity-day h4{align-items:baseline;margin:0 0 8px;font-size:12px;line-height:18px;font-weight:600}
:host .camera-activity-day h4 small{font-size:11px;line-height:18px;font-weight:400;font-variant-numeric:tabular-nums}
:host .camera-activity-day>div{padding:4px 12px;border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,none)}
:host .camera-activity-list .camera-timeline-open[data-ui-button]{display:grid;grid-template-columns:var(--activity-time-width) var(--activity-symbol-size) minmax(0,1fr);align-items:start;gap:var(--activity-gap);width:100%;min-height:52px;padding:8px 0;border:0;border-radius:0;background:transparent;box-shadow:none;text-align:start}
:host .camera-timeline-open time{display:block;align-self:start;min-width:0;margin:0;padding:3px 0 0;font-size:11px;line-height:18px;font-weight:400;text-align:start;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}
:host .camera-timeline-open time>span{display:block;font:inherit;line-height:18px;color:inherit}
:host .camera-timeline-open .camera-event-symbol{display:grid;place-items:center;align-content:center;position:relative;z-index:1;width:var(--activity-symbol-size);height:var(--activity-symbol-size);padding:0;border:0;border-radius:50%;background:var(--secondary-background-color,#eee);color:var(--secondary-text-color)}
:host .camera-event-symbol ha-icon{display:block;width:18px;height:18px;--mdc-icon-size:18px}
:host .camera-event-symbol[data-kind=person]{color:var(--accent-color,var(--primary-color))}
:host .camera-timeline-open .camera-event-description{display:grid;align-content:start;gap:2px;min-width:0;margin:0;padding:3px 0 0}
:host .camera-event-description strong{font-size:13px;line-height:18px;font-weight:500;overflow-wrap:anywhere}
:host .camera-event-description small{font-size:11px;line-height:16px;font-weight:400;color:var(--secondary-text-color);overflow-wrap:anywhere}
:host .camera-activity-day .camera-event::before{content:'';position:absolute;left:auto;right:auto;inset-inline-start:calc(var(--activity-time-width) + var(--activity-gap) + var(--activity-symbol-size)/2);top:20px;bottom:-20px;width:0;border:0;border-inline-start:1px solid var(--divider-color);pointer-events:none}
:host .camera-activity-day .camera-event:last-child::before{display:none}
:host .camera-activity-day .camera-event button:not(:disabled):hover{background:color-mix(in srgb,var(--accent-color,var(--primary-color)) 5%,transparent)}
:host .camera-activity-list>p{margin:0;padding:16px 12px;border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,none);font-size:12px;line-height:18px}
:host .camera-history-status{margin:10px 0 0;font-size:12px;line-height:18px}
:host .camera-activity-pagination{display:grid;gap:8px;margin-top:12px;min-width:0}
:host .camera-activity-pagination[hidden]{display:none}
:host .camera-activity-pagination nav{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px}
:host .camera-activity-pagination [data-ui-button]{min-width:0;padding:8px 6px;gap:2px;font-size:12px}
:host .camera-activity-pagination ha-icon{--mdc-icon-size:18px;flex:none}
:host [data-activity-page-status]{font-size:11px;text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}
:host .camera-activity-latest{width:100%}
@container(max-width:340px){:host .camera-activity{--activity-time-width:34px;--activity-gap:8px}:host .camera-activity-day>div{padding-inline:10px}}
@media(forced-colors:active){:host .camera-activity-day>div{box-shadow:none;outline:1px solid CanvasText}}
`;
