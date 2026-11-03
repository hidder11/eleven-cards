import {uiEscape,uiAttributes} from './ui-button.js';

// The caller formats measurements and translates the subtitle. All text is escaped.
export function uiPrimaryValue({value,unit='',subtitle='',subtitleEntity='',compact=false,entity='',layout='',unitPosition='raised',attrs={}}={}){
 const missing=value==null||value==='';
 const number=uiEscape(missing?'—':value);
 const label=subtitle!==''&&subtitle!=null?(subtitleEntity?`<button type="button" class="primary-label" data-entity="${uiEscape(subtitleEntity)}">${uiEscape(subtitle)}</button>`:`<div class="primary-label">${uiEscape(subtitle)}</div>`):'';
 return `<div${uiAttributes({...attrs,'data-ui-primary-value':'','data-density':compact?'compact':'standard','data-unavailable':String(missing),'data-primary-layout':layout==='uniform'?'uniform':null,'data-unit-position':layout==='uniform'&&['raised','baseline','center'].includes(unitPosition)?unitPosition:null})}><div class="primary-value">${entity?`<button type="button" class="primary-number" data-entity="${uiEscape(entity)}" aria-label="${uiEscape((missing?'—':value)+(!missing&&unit?' '+unit:''))}">${number}</button>`:`<span class="primary-number">${number}</span>`}${!missing&&unit?`<small>${uiEscape(unit)}</small>`:''}</div>${label}</div>`;
}

export function uiPrimaryValueStyles(){return `
[data-ui-primary-value]{--_primary-tone:var(--ui-primary-tone,var(--tone,var(--primary-color,#2196f3)));min-width:0;color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
[data-ui-primary-value] .primary-value{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin:0;font-size:var(--ui-primary-size,60px);line-height:1.15;font-weight:650;letter-spacing:-.055em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-primary-value] .primary-number{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-number{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}[data-ui-primary-value] button:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px;border-radius:3px}
[data-ui-primary-value] .primary-value small{display:block;margin:8px 0 0;font-size:var(--ui-primary-unit-size,16px);line-height:1.4;font-weight:400;letter-spacing:-.03em;color:var(--secondary-text-color,#626a78)}
[data-ui-primary-value] .primary-label{margin-top:6px;padding-inline-start:8px;border-inline-start:2px solid color-mix(in srgb,var(--_primary-tone) 55%,transparent);font-size:11px;line-height:1.4;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-label{display:flex;align-items:center;box-sizing:border-box;max-width:100%;min-width:44px;min-height:44px;margin-bottom:0;padding-block:6px;padding-inline-end:0;border-block:0;border-inline-end:0;border-radius:0;background:none;font-family:inherit;text-align:start;cursor:pointer}
[data-ui-primary-value][data-density=compact] .primary-value{font-size:var(--ui-primary-size,46px)}
[data-ui-primary-value][data-density=compact] .primary-value small{font-size:var(--ui-primary-unit-size,14px);margin-top:5px}
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
[data-ui-primary-value][data-primary-layout=uniform] .primary-label::before{content:'';position:absolute;inset-inline-start:0;top:2px;width:2px;height:12px;border-radius:1px;background:color-mix(in srgb,var(--_primary-tone) 55%,transparent)}
`;}
