// House-only native HA adapter. Material paint recipes belong to the theme.
export function houseThemeStyles(){
const root='[data-eleven-material]';
const role=name=>`${root} [data-material="${name}"]`;
const dimensions={'radius-card':'var(--ha-card-border-radius,12px)','radius-well':'var(--ha-card-border-radius,12px)','radius-button':'var(--ha-card-border-radius,12px)','radius-canvas':'var(--ha-card-border-radius,12px)','padding-card':'22px','padding-card-mobile':'18px','padding-well':'16px','padding-canvas':'24px','padding-canvas-mobile':'14px','padding-button':'11px 17px','gap':'9px','gap-title':'10px','gap-button':'8px','duration-color':'160ms','duration-press':'120ms','press-distance':'1px'};
return `
${root}{${Object.entries(dimensions).map(([key,value])=>`--_em-${key}:var(--eleven-material-${key},${value});`).join('')}--_em-canvas:var(--eleven-material-canvas,var(--primary-background-color,Canvas));--_em-surface:var(--eleven-material-surface,var(--card-background-color,Canvas));--_em-inset:var(--eleven-material-inset,var(--secondary-background-color,var(--card-background-color,Canvas)));--_em-fg:var(--eleven-material-fg,var(--primary-text-color,CanvasText));--_em-muted:var(--eleven-material-muted,var(--secondary-text-color,CanvasText));--_em-accent:var(--eleven-material-accent,var(--_house-accent,var(--accent-color,Highlight)));--_em-tint1:var(--eleven-material-tint1,var(--_house-tint1,var(--_em-inset)));--_em-tint2:var(--eleven-material-tint2,var(--_house-tint2,var(--_em-inset)));--_em-edge:var(--eleven-material-edge,var(--ha-card-border-color,var(--divider-color,transparent)));--_em-face1:var(--eleven-material-face1,var(--_em-surface));--_em-face2:var(--eleven-material-face2,var(--_em-inset));--_em-shadow:var(--eleven-material-shadow,transparent);--_em-well:var(--eleven-material-well,none);--_em-selection-well:var(--eleven-material-selection-well,none);--_em-success:var(--eleven-material-success,var(--success-color,CanvasText));--_em-error:var(--eleven-material-error,var(--error-color,CanvasText));--_em-switch-on:var(--eleven-material-switch-on,var(--accent-color,Highlight));--_em-switch-knob:var(--eleven-material-switch-knob,var(--primary-background-color,Canvas));--_em-series-edge:var(--eleven-material-series-edge,var(--divider-color,transparent));box-sizing:border-box;color:var(--_em-fg);font:15px/1.5 system-ui,sans-serif;color-scheme:light}
${root}[data-material-theme=dark]{color-scheme:dark}
${root} *,${root} *::before,${root} *::after{box-sizing:border-box}
${role('canvas')}{background:var(--_em-canvas);padding:var(--_em-padding-canvas);border-radius:var(--_em-radius-canvas)}
${role('card')}{min-width:0;padding:var(--_em-padding-card);background:var(--_house-recipe-card-background,var(--ha-card-background,var(--_em-surface)));border:1px solid var(--_em-edge);border-radius:var(--_em-radius-card);box-shadow:var(--_house-recipe-card-shadow,var(--ha-card-box-shadow,none))}
${role('title')}{display:flex;align-items:center;gap:var(--_em-gap-title);margin:0 0 20px;font-size:16px;font-weight:600}
${role('title-icon')}{flex:none;width:20px;height:20px;color:var(--_em-muted);background:none;border:0;box-shadow:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
${role('well')},${role('plot')}{min-width:0;background:var(--_em-inset);border-radius:var(--_em-radius-well);padding:var(--_em-padding-well);box-shadow:var(--_em-well)}
${role('value')}{font-size:34px;font-weight:600;line-height:1.25;font-variant-numeric:tabular-nums}
${role('unit')}{font-size:16px;font-weight:400;color:var(--_em-muted)}
${role('muted')}{color:var(--_em-muted)}
${role('row')}{display:flex;flex-wrap:wrap;gap:var(--_em-gap);align-items:center}
${role('button')},${role('switch')}{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:var(--_em-gap-button);min-width:44px;min-height:44px;max-width:100%;padding:var(--_em-padding-button);font:500 13px/1.3 system-ui,sans-serif;overflow-wrap:anywhere;border:1px solid var(--_em-edge);border-radius:var(--_em-radius-button);color:var(--_em-muted);background:var(--_house-recipe-button-background,var(--_em-face1));box-shadow:var(--_house-recipe-button-shadow,none);text-decoration:none;cursor:pointer;transition:background var(--_em-duration-color),color var(--_em-duration-color),transform var(--_em-duration-press),box-shadow var(--_em-duration-press)}
${role('button')}[aria-pressed="true"],${role('button')}[aria-selected="true"]{background:var(--_house-recipe-selected-background,var(--_em-tint1));color:var(--_em-accent);box-shadow:var(--_em-selection-well);transform:translateY(var(--_em-press-distance))}
${role('button')}:not(:disabled):hover{background:var(--_house-recipe-button-hover-background,var(--_house-recipe-button-background,var(--_em-face1)))}
${role('button')}[aria-pressed="true"]:not(:disabled):hover,${role('button')}[aria-selected="true"]:not(:disabled):hover{background:var(--_house-recipe-selected-background,var(--_em-tint1))}
${role('button')}:focus-visible,${role('switch')}:focus-visible{outline:2px solid var(--_em-accent);outline-offset:3px}
${role('button')}:not(:disabled):active,${role('button')}[aria-pressed="true"]:not(:disabled):active,${role('button')}[aria-selected="true"]:not(:disabled):active,${role('button')}[data-material-state="pressed"]:not(:disabled),${role('button')}[data-material-state="pressed"]:not(:disabled):hover{background:var(--_house-recipe-button-pressed-background,var(--_em-inset));transform:translateY(var(--_em-press-distance));box-shadow:var(--_em-well)}
${role('button')}[data-material-state="hover"]:not(:disabled){background:var(--_house-recipe-button-hover-background,var(--_house-recipe-button-background,var(--_em-face1)))}
${role('button')}[data-material-state="focus"]{outline:2px solid var(--_em-accent);outline-offset:3px}
${role('button')}:disabled,${role('switch')}:disabled{color:var(--_em-muted);background:var(--_em-inset);box-shadow:none;cursor:not-allowed;transform:none;opacity:1}
${role('switch')}{background:none;border-color:transparent;box-shadow:none;padding:4px;justify-content:flex-start}
${role('track')}{display:inline-flex;align-items:center;flex:none;width:48px;height:28px;padding:3px;background:var(--_em-inset);border-radius:20px;box-shadow:var(--_em-well)}
${role('knob')}{width:22px;height:22px;border-radius:50%;background:var(--_house-recipe-button-background,var(--_em-face1));box-shadow:var(--_house-recipe-button-shadow,none);transition:transform var(--_em-duration-press)}
${role('switch')}[aria-checked="true"] ${'[data-material="track"]'}{background:var(--_em-switch-on);box-shadow:var(--_house-recipe-switch-shadow,none)}
${role('switch')}[aria-checked="true"] ${'[data-material="track"]'}::before{content:'✓';position:absolute;margin-left:4px;font-size:12px;font-weight:700;color:var(--_em-switch-knob)}
${role('switch')}[aria-checked="true"] ${'[data-material="knob"]'}{transform:translateX(20px);background:var(--_em-switch-knob)}
${role('chart-axis')}{fill:var(--_em-muted);font:11px system-ui,sans-serif;font-variant-numeric:tabular-nums}
${role('chart-grid')}{stroke:var(--_em-muted);stroke-opacity:.15;stroke-width:1;fill:none}
${role('series-edge')}{stroke:var(--_em-series-edge);stroke-width:4;fill:none;stroke-linecap:round;stroke-linejoin:round}
${role('chart-cursor')}{stroke:var(--_em-muted);stroke-width:1;stroke-dasharray:3 4;fill:none}
${role('chart-focus')}:focus-visible{outline:2px solid var(--_em-accent);outline-offset:3px;border-radius:6px}
${role('status')}{color:var(--_em-muted);font-size:13px}
${role('status')}[data-status="success"]{color:var(--_em-success)}
${role('status')}[data-status="error"]{color:var(--_em-error)}
@media(max-width:600px){${role('card')}{padding:var(--_em-padding-card-mobile)}${role('canvas')}{padding:var(--_em-padding-canvas-mobile)}}
@media(prefers-reduced-motion:reduce){${role('button')},${role('switch')},${role('knob')}{transition:none}}
@media(forced-colors:active){${role('card')},${role('well')},${role('plot')},${role('track')}{background:Canvas;border:1px solid CanvasText;box-shadow:none}${role('button')},${role('knob')}{background:ButtonFace;color:ButtonText;border:1px solid ButtonText;box-shadow:none}${role('button')}[aria-pressed="true"],${role('button')}[aria-selected="true"]{background:Highlight;color:HighlightText}${role('button')}:disabled{color:GrayText;border-color:GrayText}${role('button')}:focus-visible,${role('switch')}:focus-visible{outline-color:Highlight}${role('status')}{color:CanvasText}${role('switch')}[aria-checked="true"] ${'[data-material="track"]'}{background:Highlight;border:1px solid Highlight}${role('switch')}[aria-checked="true"] ${'[data-material="knob"]'}{background:HighlightText}${role('switch')}[aria-checked="true"] ${'[data-material="track"]'}::before{color:HighlightText}${role('chart-axis')}{fill:CanvasText}${role('chart-grid')},${role('chart-cursor')}{stroke:CanvasText}${role('series-edge')}{stroke:CanvasText}}
`;
}
