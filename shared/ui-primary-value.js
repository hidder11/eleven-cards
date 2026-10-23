import {uiEscape,uiAttributes} from './ui-button.js';

// The caller formats measurements and translates the subtitle. All text is escaped.
export function uiPrimaryValue({value,unit='',subtitle='',subtitleEntity='',compact=false,entity='',attrs={}}={}){
 const missing=value==null||value==='';
 const number=uiEscape(missing?'—':value);
 const label=subtitle!==''&&subtitle!=null?(subtitleEntity?`<button type="button" class="primary-label" data-entity="${uiEscape(subtitleEntity)}">${uiEscape(subtitle)}</button>`:`<div class="primary-label">${uiEscape(subtitle)}</div>`):'';
 return `<div${uiAttributes({...attrs,'data-ui-primary-value':'','data-density':compact?'compact':'standard','data-unavailable':String(missing)})}><div class="primary-value">${entity?`<button type="button" class="primary-number" data-entity="${uiEscape(entity)}" aria-label="${uiEscape((missing?'—':value)+(!missing&&unit?' '+unit:''))}">${number}</button>`:`<span class="primary-number">${number}</span>`}${!missing&&unit?`<small>${uiEscape(unit)}</small>`:''}</div>${label}</div>`;
}

export function uiPrimaryValueStyles(){return `
[data-ui-primary-value]{--_primary-tone:var(--ui-primary-tone,var(--tone,var(--primary-color,#2196f3)));min-width:0;color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
[data-ui-primary-value] .primary-value{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin:0;font-size:var(--ui-primary-size,60px);line-height:1.15;font-weight:650;letter-spacing:-.055em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-primary-value] .primary-number{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-number{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}[data-ui-primary-value] button:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px;border-radius:3px}
[data-ui-primary-value] .primary-value small{display:block;margin:8px 0 0;font-size:var(--ui-primary-unit-size,16px);line-height:1.4;font-weight:400;letter-spacing:-.03em;color:var(--secondary-text-color,#626a78)}
[data-ui-primary-value] .primary-label{margin-top:6px;padding-inline-start:8px;border-inline-start:2px solid color-mix(in srgb,var(--_primary-tone) 55%,transparent);font-size:11px;line-height:1.4;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-label{display:block;max-width:100%;min-height:0;margin-bottom:0;padding-block:0;padding-inline-end:0;border-block:0;border-inline-end:0;border-radius:0;background:none;font-family:inherit;text-align:start;cursor:pointer}
[data-ui-primary-value][data-density=compact] .primary-value{font-size:var(--ui-primary-size,46px)}
[data-ui-primary-value][data-density=compact] .primary-value small{font-size:var(--ui-primary-unit-size,14px);margin-top:5px}
`;}
