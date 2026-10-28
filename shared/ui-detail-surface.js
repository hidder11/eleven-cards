import {uiEscape,uiAttributes} from './ui-button.js';
import {uiSurfaceStyles} from './ui-surface.js';

// Informational detail surface. Callers format/translate text and compute percentages.
// All content is escaped; this component deliberately accepts no trusted HTML.
export function uiDetailSurface({title='',metrics=[],percent=null,entity='',actionLabel='',attrs={}}={}){
 const progress=Number.isFinite(percent)?Math.max(0,Math.min(100,percent)):null;
 return `<section${uiAttributes({...attrs,'data-ui-detail-surface':'','aria-label':title})}>
  <h3 class="ui-detail-surface-title">${entity?`<button type="button" class="ui-detail-surface-action" data-entity="${uiEscape(entity)}" aria-label="${uiEscape(actionLabel||title)}">${uiEscape(title)} <span aria-hidden="true">›</span></button>`:uiEscape(title)}</h3>
  <dl class="ui-detail-surface-metrics">${metrics.map(({label='',value,unit='',hint=''})=>{
   const missing=value==null||value==='';
   return `<div><dt>${uiEscape(label)}</dt><dd>${uiEscape(missing?'—':value)}${!missing&&unit?' '+uiEscape(unit):''}${hint?`<small class="ui-detail-surface-hint">${uiEscape(hint)}</small>`:''}</dd></div>`;
  }).join('')}</dl>
  ${progress==null?'':`<div class="ui-detail-surface-track" aria-hidden="true"><i style="width:${progress}%"></i></div>`}
 </section>`;
}

export function uiDetailSurfaceStyles(){return uiSurfaceStyles('[data-ui-detail-surface]')+`
[data-ui-detail-surface]{box-sizing:border-box;min-width:0;padding:12px;border-radius:8px;color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--ui-detail-tone,var(--primary-color,#2196f3)) 5%,transparent)}
[data-ui-detail-surface] .ui-detail-surface-title{font-family:inherit;font-size:12px;font-weight:600;line-height:1.4;color:inherit;margin:0 0 8px;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-action{font:inherit;line-height:1.4;color:inherit;background:none;border:0;border-radius:4px;padding:4px 0;margin:-4px 0;text-align:start;cursor:pointer}
[data-ui-detail-surface] .ui-detail-surface-action:hover{text-decoration:underline}[data-ui-detail-surface] .ui-detail-surface-action:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
[data-ui-detail-surface] .ui-detail-surface-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,68px),1fr));gap:8px 12px;margin:0}
[data-ui-detail-surface] .ui-detail-surface-metrics>div{min-width:0}
[data-ui-detail-surface] dt{font-size:10px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere;margin:0 0 2px}
[data-ui-detail-surface] dd{margin:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-hint{display:block;margin-top:3px;font-size:10px;font-weight:400;line-height:1.4;letter-spacing:normal;color:var(--secondary-text-color,#626a78)}
[data-ui-detail-surface] .ui-detail-surface-track{height:8px;border-radius:8px;background:var(--divider-color,#ddd);overflow:hidden;margin-top:8px}
[data-ui-detail-surface] .ui-detail-surface-track>i{display:block;height:100%;background:var(--ui-detail-tone,var(--primary-color,#2196f3))}
@container(max-width:360px){[data-ui-detail-surface] dd{font-size:15px}}
@media(forced-colors:active){[data-ui-detail-surface]{border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track{background:Canvas;border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track>i{background:Highlight;forced-color-adjust:none}}
`;}
