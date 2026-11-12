import {cameraThemeStyles} from './camera-theme.js';
import {cameraActivityStyles} from './camera-activity-styles.js';
import {uiPrimaryValueStyles} from '../../../shared/ui-primary-value.js';
import {uiMetricStyles} from '../../../shared/ui-metric.js';
import {headerSceneStyles} from '../../../shared/header-scene.js';
import {headerBackgroundStyles} from '../../../shared/header-backgrounds.js';
import {headerAtmosphereStyles} from '../../../shared/header-atmosphere.js';
import {cameraFeatureStyles} from './camera-feature-styles.js';
import {uiSurfaceStyles} from '../../../shared/ui-surface.js';
import {uiDetailSurfaceStyles} from '../../../shared/ui-detail-surface.js';
import {securityArtStyles} from './security-art.js';
import {cameraAlarmStyles} from './camera-alarm.js';
export const cameraStyles=`
:host{display:block;min-width:0;height:100%;container-type:inline-size;font:inherit}
*{box-sizing:border-box}ha-card{display:block;min-height:0;height:100%;overflow:auto;border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font:inherit}
.content{position:relative;isolation:isolate;padding:var(--eleven-card-padding,16px);--tone:#896400}
.content[data-dark=true]{--tone:#f2c451}
.content[data-color=waiting]{--tone:#386c9b}.content[data-color=done]{--tone:#277441}.content[data-color=planned]{--tone:#4455ad}.content[data-color=off]{--tone:#656975}
.content[data-dark=true][data-color=waiting]{--tone:#82b8e8}.content[data-dark=true][data-color=done]{--tone:#7ed79c}.content[data-dark=true][data-color=planned]{--tone:#8fa5ff}.content[data-dark=true][data-color=off]{--tone:#a7a9b2}
.camera-header{display:flex;align-items:center;gap:12px;min-height:56px;padding-bottom:16px}
.camera-icon{display:grid;place-items:center;position:relative;isolation:isolate;width:32px;height:32px;color:var(--tone);flex:none}
.camera-icon::before{content:'';position:absolute;inset:-20px;border-radius:50%;z-index:-1;background:radial-gradient(ellipse,color-mix(in srgb,var(--tone) 13%,transparent),transparent 75%)}
.camera-icon ha-icon{--mdc-icon-size:24px}.camera-title{font-size:18px;font-weight:600;line-height:1.35;margin:0;overflow-wrap:anywhere}
.camera-count{font-size:11px;line-height:1.5;color:var(--secondary-text-color,#666);margin:2px 0 0}
.camera-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;min-width:0}
.camera-grid[data-columns="1"]{grid-template-columns:minmax(0,1fr)}.camera-grid[data-columns="2"]{grid-template-columns:repeat(2,minmax(0,1fr))}.camera-grid[data-columns="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
.camera-tile{min-width:0;margin:0}.camera-tile-header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px;margin-bottom:8px}.camera-name{display:flex;align-items:center;gap:6px;font:inherit;font-size:12px;font-weight:600;color:var(--primary-text-color,#20252b);background:none;border:0;padding:0;min-height:32px;text-align:start;cursor:pointer;overflow-wrap:anywhere;max-width:100%;min-width:0;border-radius:8px}.camera-name ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color);flex:none}
.camera-name:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}
.camera-frame{position:relative;aspect-ratio:var(--camera-ratio,16/9);background:var(--secondary-background-color,#eee);border-radius:8px;overflow:hidden;min-width:0}
.camera-native{width:100%;height:100%}.camera-native>*{display:block;width:100%;height:100%}
.camera-message{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px;text-align:center;font-size:12px;line-height:1.5;color:var(--secondary-text-color,#666)}
[hidden]{display:none!important}.camera-empty{font-size:12px;color:var(--secondary-text-color,#666);margin:0;line-height:1.5}
.camera-tabs [data-ui-card-tabs]{margin-top:0}.camera-panel{padding-top:16px}
.camera-status{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.camera-badge{font-size:11px;line-height:1.5;padding:3px 8px;border-radius:8px;background:var(--secondary-background-color,#eee);color:var(--secondary-text-color,#666)}.camera-badge[data-active=true]{color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--warning-color,#c77500) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}.camera-badge[data-active=true]::before{content:'';display:inline-block;width:6px;height:6px;margin-inline-end:6px;vertical-align:middle;border-radius:50%;background:var(--warning-color,#c77500)}
.camera-fullscreen{margin-inline-start:auto}.camera-tile-header:has(.camera-name[hidden]):has(.camera-fullscreen[hidden]){display:none}
.camera-last-detection,.camera-action-error{font-size:11px;line-height:1.5;color:var(--secondary-text-color,#666);margin:8px 0 0;overflow-wrap:anywhere}.camera-action-error{color:var(--error-color,#db4437)}
.camera-focus-picker{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 12px;scrollbar-width:thin}.camera-focus-picker [data-ui-button]{width:auto;white-space:nowrap;border-radius:8px;min-height:36px}.camera-focus-picker [data-ui-button]{min-height:44px;padding:8px 12px;border:1px solid var(--divider-color);background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);box-shadow:none}.camera-focus-picker [aria-pressed=true]{border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 20%,var(--ha-card-background,var(--card-background-color,#fff)));box-shadow:inset 0 0 0 1px var(--primary-color);font-weight:600}.camera-focus-picker:has(>:only-child){display:none}
.camera-navigation{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px}.camera-position{font-size:12px;font-variant-numeric:tabular-nums;min-width:40px;text-align:center;color:var(--secondary-text-color)}.camera-navigation ha-icon,.camera-fullscreen ha-icon{--mdc-icon-size:20px}.camera-navigation [data-ui-button],.camera-fullscreen[data-ui-button]{border-radius:8px}.camera-navigation [data-camera-cycle]{width:auto;padding:0 8px;font-size:12px;color:var(--primary-color)}
.camera-tile:fullscreen{display:flex;flex-direction:column;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);padding:16px;overflow:auto}.camera-tile:fullscreen .camera-frame{flex:1;min-height:0;aspect-ratio:auto}.camera-tile:fullscreen .camera-tile-header{flex:none}.camera-tile:fullscreen .camera-name{font-size:16px}
.content[data-compact=true] .camera-header{min-height:44px;padding-bottom:12px}.content[data-compact=true] .camera-title{font-size:16px}.content[data-compact=true] .camera-grid{gap:12px}
@container(max-width:400px){.camera-grid[data-columns]{grid-template-columns:minmax(0,1fr)}}
${headerSceneStyles}${headerBackgroundStyles}${headerAtmosphereStyles}
${uiSurfaceStyles('.camera-frame,.camera-alarm[data-ui-button],.camera-contact[data-ui-button]')}
${uiPrimaryValueStyles()}${uiMetricStyles()}
${cameraFeatureStyles}
${uiDetailSurfaceStyles()}${securityArtStyles}
.camera-contact-surfaces{display:grid;gap:12px}.camera-contact-surfaces[hidden]{display:none}
.camera-contact-surfaces [data-ui-detail-surface]{padding:12px}.camera-contact-surfaces .ui-detail-surface-title{font-size:12px;margin-bottom:12px}
.camera-contact-surfaces .ui-detail-surface-metrics{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:12px}.camera-contact-surfaces dd{font-size:16px}
.camera-contact-surfaces .ui-detail-surface-metrics>div:last-child dd{font-size:14px;line-height:calc(16px * 1.35);white-space:nowrap;letter-spacing:normal}
.camera-status{display:flex;justify-content:flex-end;align-items:center;gap:4px}
.camera-detection-indicator{flex:none;width:36px;height:36px;padding:6px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;box-shadow:none;color:var(--secondary-text-color);font:inherit;cursor:pointer}
.camera-detection-symbol{display:grid;place-items:center;width:24px;height:24px}.camera-detection-symbol svg{width:22px;height:22px}
.camera-detection-indicator[data-detection-state=active]{color:var(--warning-color,#ff9800)}
.camera-detection-indicator[data-detection-state=unknown]{opacity:.4}
.camera-detection-indicator:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.camera-detection-indicator:hover{filter:brightness(1.08)}
${uiSurfaceStyles('.camera-tile:not(:fullscreen)')}
.camera-tile:not(:fullscreen){padding:0;border-radius:8px;overflow:hidden;background:color-mix(in srgb,var(--primary-color,#2196f3) 5%,transparent)}
.camera-tile:not(:fullscreen) .camera-frame{border-radius:8px 8px 0 0;box-shadow:none}
.camera-tile .camera-status{margin-top:8px;padding:0}
.camera-tile-footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px;padding:6px 10px}
.camera-tile-footer .camera-status{margin:0;gap:0}
.camera-tile-footer .camera-expand{display:flex;align-items:center;gap:5px;min-height:36px;padding:4px;border:0;border-radius:6px;background:transparent;color:var(--primary-color);font:inherit;font-size:11px;cursor:pointer}
.camera-tile-footer .camera-expand ha-icon{--mdc-icon-size:18px}
.camera-tile-footer .camera-expand:hover{background:color-mix(in srgb,var(--primary-color) 10%,transparent)}
.camera-tile-footer .camera-expand:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}

.camera-viewer{box-sizing:border-box;width:min(1120px,calc(100vw - 32px));max-width:none;max-height:calc(100dvh - 32px);overflow:auto;margin:auto;padding:0;border:1px solid var(--divider-color,#ddd);border-radius:12px;color:var(--primary-text-color);background:var(--ha-card-background,var(--card-background-color,#fff));box-shadow:0 20px 80px #0006}
.camera-viewer::backdrop{background:#080f18ce}.camera-viewer:not([open]){display:none}.camera-viewer>.camera-action-error{padding:0 16px 12px;margin:0}
.camera-viewer-header{display:flex;align-items:center;gap:10px;min-height:60px;padding:10px 16px}.camera-viewer-header>div:first-child{flex:1;min-width:0}.camera-viewer-header h2{font:inherit;font-size:15px;font-weight:500;line-height:20px;margin:0;overflow-wrap:anywhere}.camera-viewer-header p{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);margin:0}
.camera-viewer-close{display:grid;place-items:center;flex:none;width:30px;height:30px;min-height:30px;padding:0;border:0;border-radius:5px;line-height:1;color:inherit;background:transparent;box-shadow:none;cursor:pointer}
.camera-viewer-close svg{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.camera-viewer-tools{display:flex;align-items:center;flex:none;gap:0}.camera-viewer-tools .camera-detection-indicator{width:32px;height:32px;padding:4px}.camera-viewer-tools .camera-detection-symbol svg{width:19px;height:19px}.camera-viewer-tools>[data-ui-button]{width:32px;height:32px;min-width:32px;min-height:32px;padding:4px;background:none;border:0;color:var(--secondary-text-color);box-shadow:none;--mdc-icon-size:19px}
.camera-viewer-close:focus-visible,.camera-viewer-picker button:focus-visible,.camera-viewer-tools>[data-ui-button]:focus-visible{outline:2px solid var(--primary-color);outline-offset:-3px}
.camera-viewer-body{min-width:0;background:#111820;overflow:hidden}.camera-viewer .camera-tile:not(:fullscreen){padding:0;border-radius:0;background:transparent;box-shadow:none}.camera-viewer .camera-tile .camera-frame{max-height:calc(100dvh - 220px);margin:auto;width:100%;border-radius:0}.camera-viewer .camera-native{--ha-card-border-radius:0px}.camera-viewer .camera-tile-footer,.camera-viewer .camera-last-detection,.camera-viewer-footer{display:none}
.camera-viewer-picker{display:flex;align-items:stretch;gap:8px;padding:12px;overflow-x:auto;overscroll-behavior-inline:contain;min-width:0;border-top:1px solid var(--divider-color);background:var(--secondary-background-color)}
.camera-viewer-picker button{display:grid;align-content:start;gap:6px;flex:1 0 112px;min-width:0;padding:7px;border:1px solid var(--divider-color);border-radius:7px;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);font:inherit;font-size:12px;text-align:start;cursor:pointer;overflow-wrap:anywhere}.camera-viewer-picker button[aria-pressed=true]{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}.camera-viewer-picker button:hover{border-color:var(--primary-color)}
.camera-viewer-thumbnail{display:grid;place-items:center;width:96px;max-width:100%;height:54px;border-radius:4px;overflow:hidden;background:var(--secondary-background-color);color:var(--secondary-text-color);--mdc-icon-size:23px}.camera-viewer-thumbnail img{display:block;width:100%;height:100%;object-fit:cover}.camera-viewer-camera-name{line-height:17px}
@media(max-width:600px){.camera-viewer{width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}.camera-viewer-header{padding:8px 12px;gap:6px}.camera-viewer-header h2{font-size:14px}.camera-viewer-picker{padding:8px;gap:6px}.camera-viewer-picker button{flex-basis:104px}.camera-viewer .camera-tile .camera-frame{max-height:calc(100dvh - 200px)}}
.camera-tile .camera-last-detection,.camera-tile .camera-snapshot-time{padding:0 12px 10px;margin:0}
.camera-alarm-controls{min-width:0;border-radius:8px;padding:0;overflow:hidden;margin-bottom:12px;background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--primary-color,#2196f3) 10%,transparent),color-mix(in srgb,var(--primary-color,#2196f3) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee);box-shadow:var(--eleven-surface-shadow)}
.camera-alarm-controls[data-available=false]{opacity:.55}.camera-alarm-controls>p{padding:12px;margin:0;font-size:12px;color:var(--secondary-text-color)}
${cameraAlarmStyles}
.camera-tile-footer{padding:2px 8px;flex-wrap:wrap;gap:2px}.camera-tile-actions{display:flex;align-items:center;gap:0;margin-left:auto;flex:none}.camera-tile:not(:fullscreen) .camera-tile-footer .camera-name{position:static;min-width:0;max-width:100%;padding:0;min-height:28px;background:none;color:var(--primary-text-color);text-shadow:none;font-size:12px;font-weight:500;overflow-wrap:anywhere}.camera-tile-footer .camera-name ha-icon{display:none}.camera-tile-footer .camera-name span{white-space:normal;overflow-wrap:anywhere}.camera-tile-actions>button[data-ui-button]{display:grid;place-items:center;width:28px;min-width:28px;min-height:28px;height:28px;padding:5px;border:0;background:none;color:var(--secondary-text-color)}.camera-tile-actions ha-icon{--mdc-icon-size:17px}.camera-tile-actions .camera-status{margin:0;gap:0}.camera-tile-actions .camera-detection-indicator{width:28px;min-width:28px;height:28px;padding:5px}.camera-tile-actions .camera-detection-symbol{width:18px;height:18px}.camera-tile-actions .camera-detection-symbol svg{width:17px;height:17px}
${uiSurfaceStyles('.camera-tile-header>button[data-ui-button],.camera-confirm')}
.camera-confirm{border:0}
.camera-tile .camera-tile-header>button[data-ui-button]{border:0;border-radius:8px;background:var(--secondary-background-color,#eee);color:var(--primary-text-color,#20252b);text-shadow:none}
.camera-tile .camera-tile-header>button[data-ui-button]:not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 12%,var(--secondary-background-color,#eee))}
@media(forced-colors:active){.camera-alarm[data-triggered=true],.camera-contact[data-open=true]{box-shadow:none}}
${cameraThemeStyles}
${cameraActivityStyles}
.camera-viewer-feedback{margin:12px 0 0;font-size:12px;color:var(--secondary-text-color);overflow-wrap:anywhere}
`;