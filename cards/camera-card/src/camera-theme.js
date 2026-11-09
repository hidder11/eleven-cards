import {cardThemeStyles} from '../../../shared/card-theme.js';
import {uiActionButtonStyles} from '../../../shared/ui-action-button.js';
import {uiBalancedTabsStyles} from '../../../shared/ui-balanced-tabs.js';
import {uiButtonStyles} from '../../../shared/ui-button.js';

// Opt in only this card: the active HA theme owns paint and depth. The camera
// footer and timeline are compact identity rows, not ordinary action buttons.
export const cameraThemeStyles=`
${cardThemeStyles({wells:'.camera-security-metrics [data-ui-metric],.camera-contact-surfaces [data-ui-detail-surface],.camera-alarm-controls'})}
:host{--eleven-surface-shadow:var(--eleven-material-surface-shadow,none)}
.content{padding:16px}
.camera-title,.camera-viewer-header h2{font-size:16px;font-weight:600}
.camera-icon::before{display:none}
.camera-security-metrics [data-ui-metric],.camera-alarm-controls{background:var(--secondary-background-color,#eee)}
.camera-tile:not(:fullscreen){position:relative;background:var(--secondary-background-color,#eee);border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));box-shadow:none}
/* Paint the inset above the player so its edge-to-edge image cannot cover it. */
.camera-tile:not(:fullscreen)::after{content:'';position:absolute;inset:0;z-index:3;border-radius:inherit;box-shadow:var(--eleven-material-well,none);pointer-events:none}
.camera-tile:not(:fullscreen) .camera-frame{border-radius:0;box-shadow:none}
.camera-primary{flex:1;max-width:none;--ui-primary-tone:var(--accent-color,var(--primary-color))}
.camera-security-art{flex:0 0 94px}
.camera-security-tabs>[data-ui-tab-panel]{padding-top:12px}
.camera-viewer,.camera-confirm{border:0;border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);background:var(--ha-card-background,var(--card-background-color,#fff))}
.camera-viewer-picker{border-top:0;background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,none)}
.camera-viewer .camera-tile:not(:fullscreen){background:transparent;border-radius:0;box-shadow:none}
.camera-viewer .camera-tile::after{display:none}
.camera-viewer-header{min-height:60px;padding:8px 16px}
.camera-alarm-code input{border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));background:var(--secondary-background-color);box-shadow:var(--eleven-material-well,none)}
${uiActionButtonStyles().slice(uiButtonStyles().length).replaceAll('[data-ui-button',':host [data-ui-button')}
:host .camera-alarm-modes [data-ui-button]{min-width:0;padding:8px 4px;gap:5px;font-weight:500}
:host .camera-focus-picker [data-ui-button]{width:auto;flex:none}
:host .camera-viewer-picker [data-ui-button]{display:grid;align-content:start;justify-content:stretch;flex:1 0 112px;min-width:0;gap:6px;padding:7px;text-align:start}
:host .camera-viewer-picker [data-ui-button]:hover{border:0}
:host .camera-alarm-submit[data-ui-button]{width:100%;margin-top:10px}
.camera-alarm-keypad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;max-width:280px;margin:0 auto}
:host .camera-alarm-keypad [data-ui-button]{width:100%;min-width:0;min-height:44px;padding:8px;font-size:20px;font-variant-numeric:tabular-nums;touch-action:manipulation}
.camera-alarm-keypad [data-alarm-key=clear] span{font-size:12px}
.camera-alarm-keypad ha-icon{--mdc-icon-size:20px}
.camera-alarm-code:has(+.camera-alarm-keypad) input{text-align:center;font-size:20px;letter-spacing:.25em}
.camera-event-symbol[data-kind=person],.camera-activity [data-camera-history-refresh],.camera-tile-footer .camera-expand{color:var(--accent-color,var(--primary-color))}
:host :is(button,input,select,summary):focus-visible{outline:2px solid var(--eleven-material-focus-color,var(--accent-color,var(--primary-color)));outline-offset:-2px}
/* One opt-in composition owns value, unit and subtitle geometry for all cards. */
[data-ui-primary-value][data-primary-layout=uniform]{--ui-primary-size:44px;--ui-primary-unit-size:16px}
[data-ui-primary-value][data-primary-layout=uniform][data-density=compact]{--ui-primary-size:36px;--ui-primary-unit-size:14px}
[data-ui-primary-value][data-primary-layout=uniform] .primary-value{display:flex;align-items:flex-start;flex-wrap:nowrap;gap:6px;min-height:44px;font-size:var(--ui-primary-size);line-height:1.1;font-weight:650;letter-spacing:-.035em;white-space:nowrap;overflow-wrap:normal}
[data-ui-primary-value][data-primary-layout=uniform] .primary-number{display:block;min-width:0;min-height:0;max-width:none;white-space:nowrap;overflow-wrap:normal;word-break:normal}
[data-ui-primary-value][data-primary-layout=uniform] button.primary-number{min-height:44px}
[data-ui-primary-value][data-primary-layout=uniform] .primary-value small{flex:none;margin:6px 0 0;font-size:var(--ui-primary-unit-size);line-height:1.4;letter-spacing:0;white-space:nowrap}
[data-ui-primary-value][data-primary-layout=uniform][data-unit-position=baseline] .primary-value{align-items:baseline}
[data-ui-primary-value][data-primary-layout=uniform][data-unit-position=baseline] .primary-value small{margin:0}
[data-ui-primary-value][data-primary-layout=uniform][data-unit-position=center] .primary-value{align-items:center}
[data-ui-primary-value][data-primary-layout=uniform][data-unit-position=center] .primary-value small{margin:0}
[data-ui-primary-value][data-primary-layout=uniform] .primary-label{position:relative;display:flex;align-items:flex-start;box-sizing:border-box;min-width:0;min-height:44px;max-width:100%;margin:2px 0 0;padding:0 0 0 8px;border:0;border-radius:0;background:none;font-family:inherit;font-size:12px;font-weight:400;line-height:1.4;letter-spacing:0;color:var(--secondary-text-color,#626a78);text-align:start;white-space:normal;overflow-wrap:anywhere;word-break:normal}
[data-ui-primary-value][data-primary-layout=uniform] .primary-label::before{content:'';position:absolute;inset-inline-start:0;top:2px;width:2px;height:12px;border-radius:1px;background:var(--_primary-tone)}

${uiBalancedTabsStyles()}
@container(max-width:340px){.camera-security-art{flex-basis:74px}.camera-primary [data-primary-layout=uniform]{--ui-primary-size:36px}.camera-primary[data-long-status=true] [data-primary-layout=uniform]{--ui-primary-size:24px}}
@media(max-width:600px){.camera-viewer-header h2{font-size:16px}:host .camera-viewer-picker [data-ui-button]{flex-basis:104px}}
`;
