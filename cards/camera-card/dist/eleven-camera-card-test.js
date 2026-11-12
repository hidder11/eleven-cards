// Eleven Camera (beta) - self-contained module
(()=>{
function retryDelay(failures, base = 60000, maximum = 300000) {
  return Math.min(maximum, base * 2 ** Math.max(0, failures - 1));
}

// Bound read operations even when the HA transport never settles. A timeout
// releases the caller; it does not cancel an underlying HA WebSocket request.
async function requestWithTimeout(work, milliseconds = 15000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(work),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Request timeout')), milliseconds); }),
    ]);
  } finally { clearTimeout(timer); }
}

// HA unsubscribe callbacks may throw or return a rejected promise while the
// connection is closing. Teardown must still release the other resources.
function stopSubscription(unsubscribe) {
  if (typeof unsubscribe !== 'function') return;
  try { Promise.resolve(unsubscribe()).catch(() => {}); } catch {}
}

// Shared typography for text titles; the caller owns the heading and its content.
function uiCardTitleStyles(selector){return `${selector}{font-size:18px;line-height:1.25;font-weight:650;letter-spacing:-.01em;margin:0;overflow-wrap:anywhere}`;}


// Opt-in ordinary actions. Legacy uiButtonStyles() and its callers stay unchanged.
// The active HA theme supplies paint; variants distinguish commands from choices.
function uiActionButtonStyles(){return uiButtonStyles()+`
[data-ui-button^="action"]{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;flex:none;gap:8px;min-width:44px;min-height:44px;width:auto;max-width:100%;overflow-wrap:break-word;height:auto;padding:8px 12px;border:0;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));font:inherit;font-size:13px;font-weight:500;line-height:1.4;text-align:center;white-space:normal;color:var(--primary-text-color);background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);transform:none;text-decoration:none;cursor:pointer;transition:background 120ms ease-out,transform 120ms ease-out,box-shadow 120ms ease-out}
[data-ui-button="action-icon"]{width:44px;padding:8px}
[data-ui-button^="action"]:not(:disabled):hover{background:var(--eleven-material-control-hover-background,color-mix(in srgb,var(--primary-text-color) 5%,var(--secondary-background-color,transparent)))}
[data-ui-button^="action"]:not(:disabled):active{transform:translateY(1px);box-shadow:var(--eleven-material-well,none)}
[data-ui-button^="action"]:focus-visible{outline:2px solid var(--eleven-material-focus-color,color-mix(in srgb,var(--accent-color,var(--primary-color,#2196f3)) 60%,var(--primary-text-color,currentColor)));outline-offset:-2px}
[data-ui-button^="action"]:disabled{opacity:.45;cursor:default;transform:none}
[data-ui-button="action-choice"][aria-pressed="true"]{color:var(--eleven-material-selection-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 40%,var(--primary-text-color)));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);transform:translateY(1px)}
[data-ui-button="action-choice"][aria-pressed="true"]:not(:disabled):hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
[data-ui-button="action-choice"][aria-pressed="true"]:not(:disabled):active{transform:translateY(1px);box-shadow:var(--eleven-material-selection-well,none)}
[data-ui-button="action-danger"]{color:var(--eleven-material-danger-color,color-mix(in srgb,var(--error-color) 55%,var(--primary-text-color)));border:1px solid var(--error-color)}
@media(prefers-reduced-motion:reduce){[data-ui-button^="action"]{transition:none}}
@media(forced-colors:active){[data-ui-button^="action"]{color:ButtonText;background:ButtonFace;border:1px solid ButtonText;box-shadow:none}[data-ui-button^="action"]:focus-visible{outline-color:Highlight}[data-ui-button="action-choice"][aria-pressed="true"]{color:HighlightText;background:Highlight;box-shadow:none}}
`;}

// Paint only, scoped to each caller's shadow root and explicit semantic roles.
// Material recipes/palettes belong to the optional YAML theme, never this helper.
// Do not use generic control selectors: swatches, state tracks and chart colors
// must keep their functional paint. chartUI is an explicit non-House opt-in
// for shared chart-control geometry. No behavior or public-token writes.
function cardThemeStyles({wells='',controls='',selected='',plots='',surfaces='',chartUI=false,periodUI=chartUI}={}) {
 // Segmented groups own their paint; descendants pressing must not press the group.
 if(chartUI)controls=controls.split(',').filter(selector=>!['.zoom-controls','.chart-links'].includes(selector.trim())).join(',');
 if(periodUI)controls=[controls,'.period-default [data-ui-button=surface]'].filter(Boolean).join(',');
 const well=selector=>selector?`${selector}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px))}`:'';
 return `
ha-card{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none)}
${well(wells)}
${wells?`:is(${wells}):is([data-ui-detail-surface]){background:var(--secondary-background-color,#eee)}`:''}
${plots?`${plots}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,0px);background:var(--eleven-material-plot-background,var(--eleven-material-inset,transparent))}`:''}
${surfaces?`${surfaces}{box-shadow:var(--eleven-material-surface-shadow,none)}`:''}
${controls?`${controls}{background:var(--eleven-material-control-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-control-shadow,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
:is(${controls}):not(:disabled):hover{background:var(--eleven-material-control-hover-background,var(--secondary-background-color,transparent))}
:is(${controls}):not(:disabled):active{box-shadow:var(--eleven-material-well,none)}`:''}
${selected?`${selected}{box-shadow:var(--eleven-material-selection-well,none);border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}`:''}
${periodUI?`
.period-menu [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.period-menu [data-period-option][aria-checked=true]{border:0;color:var(--accent-color,var(--primary-color));background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);text-decoration:none;transform:translateY(1px)}
.period-menu [data-period-option][aria-checked=true]:hover{background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)))}
.period-menu [data-period-option]{min-width:0}
.period-menu .period-options{grid-template-columns:repeat(5,minmax(0,1fr))}
.period-menu .period-calendar{grid-template-columns:repeat(3,minmax(0,1fr))}
.period-menu .ui-popup-heading [data-ui-button]{min-width:44px}
`:''}
${chartUI?`
/* Opt-in only: House's shared primitive defaults remain unchanged. */
.card-header{margin:0 0 12px;gap:12px;align-items:center}
.card-header h2{margin:0;flex:1 1 100%}
.header-actions{width:100%;gap:8px;justify-content:space-between}
.header-actions [data-ui-button]{min-width:44px;min-height:44px;height:auto;box-sizing:border-box}
.chart-controls{flex:1 1 100%;width:100%}
.chart-controls>[data-period]{position:relative;flex:none}
.chart-controls>.period-controls{flex:1 1 auto;margin-inline-end:0;padding-inline-end:0}
.chart-controls>.period-controls::after{display:none}
.header-actions .period-trigger{width:100%;justify-content:space-between;padding:4px 6px;flex:1 1 auto}
.period-trigger span{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;line-height:1.35;text-align:start}
.legend [data-ui-legend]{min-height:44px;min-width:44px;box-sizing:border-box}
${segmentedControlStyles('.chart-controls','.chart-controls>.period-controls>.period-trigger,.chart-controls>[data-period]',{first:'.chart-controls>.period-controls>.period-trigger'})}
${segmentedControlStyles('.zoom-controls','.zoom-controls>[data-zoom]')}
${segmentedControlStyles('.chart-links','.chart-links>.history-link,.chart-links>.insight-control>.insight-trigger',{last:'.chart-links>.insight-control>.insight-trigger'})}
@container(min-width:600px){.card-header h2{flex:1 1 110px}.header-actions{width:auto;flex:0 1 auto;justify-content:flex-end}.chart-controls{flex:0 1 auto;width:auto}}
`:''}
@media(forced-colors:active){ha-card${[wells,controls,selected,plots,surfaces].filter(Boolean).map(s=>','+s).join('')}{box-shadow:none}}
`;
}

// A single raised group with separate native button press states; no parent :active.
function segmentedControlStyles(group,buttons,{first=`:is(${group})>:is(button,a):first-child`,last=`:is(${group})>:is(button,a):last-child`,dividers=`:is(${group})>:not(:first-child)`}={}){return `
${group}{gap:0;align-items:stretch;background:var(--eleven-material-control-background,var(--secondary-background-color,#eee));box-shadow:var(--eleven-material-control-shadow,var(--eleven-surface-shadow,none));border-radius:var(--eleven-material-radius-button,9px)}
:is(${buttons}){position:relative;align-self:stretch;height:auto;padding:2px 6px;background:transparent;box-shadow:none;border:0;border-radius:0;min-height:36px;min-width:36px;font-size:12px;box-sizing:border-box}
:is(${buttons}) svg{width:14px;height:14px}
${first?`:is(${buttons}):is(${first}){border-start-start-radius:var(--eleven-material-radius-button,9px);border-end-start-radius:var(--eleven-material-radius-button,9px)}`:''}
${last?`:is(${buttons}):is(${last}){border-start-end-radius:var(--eleven-material-radius-button,9px);border-end-end-radius:var(--eleven-material-radius-button,9px)}`:''}
:is(${dividers}){position:relative}
:is(${dividers})::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:1px;background:color-mix(in srgb,var(--divider-color,#ddd) 55%,transparent);pointer-events:none;z-index:1}
:is(${buttons}):disabled{opacity:1;color:color-mix(in srgb,var(--primary-text-color,#20252b) 35%,transparent);cursor:default}
:is(${buttons}):not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none}
:is(${buttons}):not(:disabled):active{background:color-mix(in srgb,var(--primary-text-color,#20252b) 7%,transparent);box-shadow:var(--eleven-material-well,inset 0 2px 3px rgb(0 0 0 / 15%))}
:is(${buttons}):focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
@media(forced-colors:active){${group}{box-shadow:none;outline:1px solid CanvasText}:is(${buttons}):not(:disabled):active{background:Highlight;color:HighlightText;box-shadow:none}}
`;}

// One recipe for raised information surfaces across all cards.
const UI_SURFACE_SHADOW='inset 0 1px 0 color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent),inset 0 -1px 0 rgb(0 0 0 / 4%),0 4px 10px rgb(0 0 0 / 12%)';
function uiSurfaceStyles(selector){return `
:host{--eleven-surface-shadow:${UI_SURFACE_SHADOW}}
${selector}{box-shadow:var(--eleven-surface-shadow)}
@media(forced-colors:active){${selector}{box-shadow:none;outline:1px solid CanvasText;outline-offset:-1px}}
`;}

// Native controls: text/attributes are escaped; content is trusted, caller-owned HTML.
function uiEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uiAttributes(values={}){
 return Object.entries(values).map(([key,value])=>{
  if(!/^[a-zA-Z_:][\w:.-]*$/.test(key)||/^on/i.test(key))throw Error('Invalid UI attribute: '+key);
  if(value==null)return '';
  if(['disabled','hidden','required','autofocus','multiple','readonly'].includes(key))return value?` ${key}`:'';
  return ` ${key}="${uiEscape(value)}"`;
 }).join('');
}
function uiButton({text='',content,label,title,variant='icon',className='',type='button',href,disabled=false,attrs={}}={}){
 const classes=className?` class="${uiEscape(className)}"`:'';
 const body=content??uiEscape(text),attributes=uiAttributes({...attrs,...(label==null?{}:{'aria-label':label}),...(title==null?{}:{title}),...(disabled?{disabled:true}:{})});
 return href==null?`<button type="${uiEscape(type)}"${classes} data-ui-button="${uiEscape(variant)}"${attributes}>${body}</button>`:`<a${classes} data-ui-button="${uiEscape(variant)}" href="${uiEscape(href)}"${attributes}>${body}</a>`;
}
function uiButtonStyles(){return `
[data-ui-button]{display:flex;align-items:center;justify-content:center;box-sizing:border-box;font:inherit;font-size:12px;font-weight:400;padding:0;border:0;border-radius:4px;background:transparent;color:var(--primary-text-color,#20252b);text-decoration:none;cursor:pointer;flex:none}
[data-ui-button="icon"]{width:32px;height:32px}
[data-ui-button]:not(:disabled):hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 12%,var(--ha-card-background,var(--card-background-color,#fff)))}
[data-ui-button]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:-2px}
[data-ui-button="icon"]:focus-visible{background:var(--secondary-background-color,#eee)}
[data-ui-button]:disabled{opacity:.35;cursor:default}
[data-ui-button="surface"]{height:auto;width:100%;justify-content:space-between;gap:8px;min-height:34px;text-align:start;padding:6px 8px;border-radius:5px;background:var(--secondary-background-color,#eee)}
[data-ui-button="surface"][aria-checked="true"],[data-ui-button="surface"][aria-pressed="true"]{color:var(--primary-color,#2196f3);background:color-mix(in srgb,var(--primary-color,#2196f3) 14%,var(--ha-card-background,var(--card-background-color,#fff)));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--primary-color,#2196f3) 55%,transparent)}
[data-ui-button="text"]{min-height:30px;height:auto;width:auto;border-radius:5px}
[data-ui-button="close"]{width:30px;height:30px;min-height:30px;border-radius:5px;font-size:20px;color:inherit}
`;}


// The caller formats measurements and translates the subtitle. All text is escaped.
function uiPrimaryValue({value,unit='',subtitle='',subtitleEntity='',compact=false,entity='',layout='',unitPosition='raised',attrs={}}={}){
 const missing=value==null||value==='';
 const number=uiEscape(missing?'—':value);
 const label=subtitle!==''&&subtitle!=null?(subtitleEntity?`<button type="button" class="primary-label" data-entity="${uiEscape(subtitleEntity)}">${uiEscape(subtitle)}</button>`:`<div class="primary-label">${uiEscape(subtitle)}</div>`):'';
 return `<div${uiAttributes({...attrs,'data-ui-primary-value':'','data-density':compact?'compact':'standard','data-unavailable':String(missing),'data-primary-layout':layout==='uniform'?'uniform':null,'data-unit-position':layout==='uniform'&&['raised','baseline','center'].includes(unitPosition)?unitPosition:null})}><div class="primary-value">${entity?`<button type="button" class="primary-number" data-entity="${uiEscape(entity)}" aria-label="${uiEscape((missing?'—':value)+(!missing&&unit?' '+unit:''))}">${number}</button>`:`<span class="primary-number">${number}</span>`}${!missing&&unit?`<small>${uiEscape(unit)}</small>`:''}</div>${label}</div>`;
}

function uiPrimaryValueStyles(){return `
[data-ui-primary-value]{--_primary-tone:var(--accent-color,var(--primary-color,#2196f3));min-width:0;color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
[data-ui-primary-value] .primary-value{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;margin:0;font-size:var(--ui-primary-size,60px);line-height:1.15;font-weight:650;letter-spacing:-.055em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-primary-value] .primary-number{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere}
[data-ui-primary-value] button.primary-number{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}[data-ui-primary-value] button:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px;border-radius:3px}
[data-ui-primary-value] .primary-value small{display:block;margin:8px 0 0;font-size:var(--ui-primary-unit-size,16px);line-height:1.4;font-weight:400;letter-spacing:-.03em;color:var(--secondary-text-color,#626a78)}
[data-ui-primary-value] .primary-label{margin-top:6px;padding-inline-start:8px;border-inline-start:2px solid var(--_primary-tone);font-size:11px;line-height:1.4;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere}
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
[data-ui-primary-value][data-primary-layout=uniform] .primary-label::before{content:'';position:absolute;inset-inline-start:0;top:2px;width:2px;height:12px;border-radius:1px;background:var(--_primary-tone)}
`;}



// Text is escaped. *Content options are trusted markup owned by the calling card.
// action renders a native button; do not nest other controls in that variant.
function uiMetric({icon='',iconContent='',title='',value,valueContent='',unit='',info='',infoContent='',compact=false,action=false,attrs={}}={}){
 const missing=!valueContent&&(value==null||value==='');
 const symbol=iconContent||(icon?`<ha-icon icon="${uiEscape(icon)}"></ha-icon>`:'');
 const tag=action?'button':'div';
 return `<${tag}${uiAttributes({...attrs,...(action?{type:'button'}:{}),'data-ui-metric':'','data-density':compact?'compact':'standard','data-unavailable':String(missing)})}>
  ${symbol?`<span class="ui-metric-icon" aria-hidden="true">${symbol}</span>`:''}
  <div class="ui-metric-reading"><div class="ui-metric-title">${uiEscape(title)}</div><div class="ui-metric-value">${valueContent||uiEscape(missing?'—':value)}${!missing&&unit?` <span class="ui-metric-unit">${uiEscape(unit)}</span>`:''}</div></div>
  ${infoContent||info!==''&&info!=null?`<div class="ui-metric-info">${infoContent||uiEscape(info)}</div>`:''}
 </${tag}>`;
}

function uiMetricStyles(){return uiSurfaceStyles('[data-ui-metric]')+`
[data-ui-metric]{--_metric-tone:var(--ui-metric-tone,var(--primary-color,#2196f3));box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:8px;row-gap:2px;align-content:start;align-items:start;min-width:0;padding:12px;border-radius:var(--ui-metric-radius,8px);background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--_metric-tone) 10%,transparent),color-mix(in srgb,var(--_metric-tone) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee);color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
[data-ui-metric]:has(.ui-metric-info){grid-template-rows:auto auto auto}
[data-ui-metric] .ui-metric-icon{box-sizing:border-box;display:grid;place-items:center;grid-column:2;grid-row:1/span 2;width:26px;height:26px;border-radius:7px;color:var(--_metric-tone);background:transparent;transform:translate(4px,-4px)}
[data-ui-metric] .ui-metric-icon svg,[data-ui-metric] .ui-metric-icon ha-icon{display:block;width:18px;height:18px;--mdc-icon-size:18px}
[data-ui-metric] .ui-metric-icon svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
[data-ui-metric] .ui-metric-reading{display:contents}
[data-ui-metric] .ui-metric-title{grid-column:1;grid-row:1;min-width:0}
[data-ui-metric]:not(:has(.ui-metric-icon)) :is(.ui-metric-title,.ui-metric-value){grid-column:1/-1}
[data-ui-metric] .ui-metric-title,[data-ui-metric] .ui-metric-info{font-size:11px;line-height:1.4;font-weight:400;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere}
[data-ui-metric] .ui-metric-value{grid-column:1;grid-row:2;align-self:stretch;min-width:0;margin:0;font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.ui-metric-unit{display:inline-block;margin-inline-start:4px;font-size:11px;line-height:1.4;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78)}
[data-ui-metric] .ui-metric-info{grid-column:1/-1;grid-row:3;align-self:stretch;margin-top:6px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--_metric-tone) 8%,transparent)}
[data-ui-metric][data-density=compact]{padding:8px;column-gap:6px}
[data-ui-metric][data-density=compact] .ui-metric-icon{width:20px;height:20px;border-radius:6px;transform:translate(2px,-2px)}
[data-ui-metric][data-density=compact] .ui-metric-icon svg,[data-ui-metric][data-density=compact] .ui-metric-icon ha-icon{width:16px;height:16px;--mdc-icon-size:16px}
[data-ui-metric][data-density=compact] .ui-metric-value{font-size:20px}
[data-ui-metric][data-value-kind=text] .ui-metric-value{font-size:18px;font-weight:600;line-height:1.3;letter-spacing:-.03em;white-space:normal;overflow-wrap:break-word}
[data-ui-metric][data-density=compact] .ui-metric-info{margin-top:4px;padding-top:4px}
[data-ui-metric][data-unavailable=true]{--_metric-tone:var(--secondary-text-color,#626a78)}
button[data-ui-metric]{width:100%;border:0;cursor:pointer}button[data-ui-metric]:not(:disabled):hover{background:color-mix(in srgb,var(--secondary-background-color,#eee) 94%,var(--primary-text-color,#20252b));color:var(--primary-text-color,#20252b);filter:none}button[data-ui-metric]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px}
[data-ui-metric-grid]{--_metric-rows:2;display:grid;grid-template-columns:repeat(var(--ui-metric-columns,2),minmax(0,1fr));column-gap:12px;row-gap:2px;align-items:stretch}
[data-ui-metric-grid]:has(.ui-metric-info){--_metric-rows:3}
@supports(grid-template-rows:subgrid){[data-ui-metric-grid]>[data-ui-metric]{grid-row:span var(--_metric-rows);grid-template-rows:subgrid}}
/* Compact header readings share one geometry across Weather, Energy and Car.
   Keep diagram endpoints and standard-density card layouts independent. */
.header-region [data-ui-metric][data-density=compact]:not(.circle-node){padding:8px;min-height:44px;column-gap:6px;row-gap:2px}
.header-region [data-ui-metric][data-density=compact]:not(.circle-node) .ui-metric-title,.header-region [data-ui-metric][data-density=compact]:not(.circle-node) .ui-metric-info{font-size:11px;line-height:1.4}
.header-region [data-ui-metric][data-density=compact]:not(.circle-node) .ui-metric-value{display:block;grid-column:1;font-size:20px;line-height:1.25}
.header-region [data-ui-metric][data-density=compact][data-value-kind=text]:not(.circle-node) .ui-metric-value{font-size:18px;line-height:1.3}
.header-region [data-ui-metric][data-density=compact]:not(.circle-node) .ui-metric-unit{font-size:11px;line-height:1.4;margin-inline-start:4px}
.header-region [data-ui-metric][data-density=compact]:not(.circle-node) .ui-metric-icon{grid-row:1/span 2;width:20px;height:20px;transform:translate(2px,-2px)}
`;}


const barBounds=(min,max)=>Number.isFinite(min)&&Number.isFinite(max)&&max>min?{min,max}:{min:0,max:100};
const barPercent=(value,min,max)=>Math.max(0,Math.min(100,(value-min)/(max-min)*100));

// All text/attributes are escaped; only finite measurements become fill widths.
function uiBar({value=null,min=0,max=100,target=null,charging=false,label='',valueText='',decorative=false,attrs={}}={}){
 ({min,max}=barBounds(min,max));
 const known=Number.isFinite(value),amount=known?Math.max(min,Math.min(max,value)):null;
 const percent=known?barPercent(amount,min,max):0,marker=Number.isFinite(target)?barPercent(target,min,max):null;
 const active=!!charging&&known&&amount<max&&(!Number.isFinite(target)||amount<target);
 return `<div${uiAttributes({...attrs,'data-ui-bar':'','data-charging':String(active),'data-unavailable':String(!known),...(decorative?{'aria-hidden':'true'}:{'aria-label':label,...(known?{role:'progressbar','aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':amount,...(valueText?{'aria-valuetext':valueText}:{})}:{})})})}><span class="ui-bar-fill" style="width:${percent}%">${active?'<span class="ui-bar-motion" aria-hidden="true"></span>':''}</span>${marker==null?'':`<span class="ui-bar-marker" style="left:${marker}%" aria-hidden="true"></span>`}</div>`;
}

function uiSlider({value=0,min=0,max=100,step=1,disabled=false,attrs={}}={}){
 ({min,max}=barBounds(min,max));
 const amount=Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;
 return `<input${uiAttributes({...attrs,type:'range','data-ui-slider':'',min,max,step:Number.isFinite(step)&&step>0?step:1,value:amount,...(disabled?{disabled:true}:{}),style:(attrs.style?attrs.style+';':'')+`--ui-bar-position:${barPercent(amount,min,max)}%`})}>`;
}

// Call alongside existing input handlers; never sends a command or replaces events.
function syncUISlider(input){
 const min=Number(input.min),max=Number(input.max),value=Number(input.value);
 input.style.setProperty('--ui-bar-position',Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min?barPercent(value,min,max)+'%':'0%');
}

function uiBarStyles(){return `
[data-ui-bar]{--_bar-tone:var(--ui-bar-tone,var(--accent-color,var(--primary-color,#2196f3)));position:relative;box-sizing:border-box;display:block;min-width:0;width:100%;height:var(--ui-bar-height,12px);border-radius:999px;background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%),inset -1px -1px 0 rgb(255 255 255 / 20%));isolation:isolate}
[data-ui-bar]>.ui-bar-fill{display:block;position:relative;overflow:hidden;isolation:isolate;height:100%;border-radius:inherit;background:var(--_bar-tone);box-shadow:inset 0 1px 0 #ffffff30}
[data-ui-bar]>.ui-bar-marker{position:absolute;top:-5px;width:2px;height:calc(100% + 10px);transform:translateX(-50%);max-width:100%;border-radius:2px;background:var(--primary-text-color,#20252b);pointer-events:none}
[data-ui-bar]>.ui-bar-marker[style*="left:0%"]{transform:none}
[data-ui-bar]>.ui-bar-marker[style*="left:100%"]{transform:translateX(-100%)}
[data-ui-bar] .ui-bar-motion{position:absolute;inset:0 auto 0 0;width:65%;pointer-events:none;background:linear-gradient(90deg,transparent,#ffffff4d 50%,transparent);animation:ui-bar-charge var(--ui-bar-duration,3.8s) linear infinite;animation-delay:var(--ui-bar-delay,0s)}
@keyframes ui-bar-charge{from{transform:translateX(-110%)}to{transform:translateX(260%)}}
input[data-ui-slider]{--_bar-tone:var(--ui-bar-tone,var(--accent-color,var(--primary-color,#2196f3)));box-sizing:border-box;appearance:none;-webkit-appearance:none;display:block;width:100%;height:44px;min-height:44px;min-width:0;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:var(--primary-text-color,#20252b);cursor:pointer;touch-action:pan-y}
input[data-ui-slider]::-webkit-slider-runnable-track{height:12px;border-radius:999px;background:linear-gradient(var(--_bar-tone),var(--_bar-tone)) 0 / var(--ui-bar-position,0%) 100% no-repeat,var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%))}
input[data-ui-slider]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;box-sizing:border-box;width:18px;height:18px;margin-top:-3px;border-radius:50%;border:2px solid var(--card-background-color,#fff);background:var(--_bar-tone);box-shadow:0 0 0 1px var(--_bar-tone)}
input[data-ui-slider]::-moz-range-track{height:12px;border-radius:999px;background:var(--secondary-background-color,#eee);box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%))}
input[data-ui-slider]::-moz-range-progress{height:12px;border-radius:999px;background:var(--_bar-tone)}
input[data-ui-slider]::-moz-range-thumb{box-sizing:border-box;width:18px;height:18px;border-radius:50%;border:2px solid var(--card-background-color,#fff);background:var(--_bar-tone);box-shadow:0 0 0 1px var(--_bar-tone)}
input[data-ui-slider]:focus-visible{outline:2px solid var(--_bar-tone);outline-offset:3px}
input[data-ui-slider]:disabled{opacity:.45;cursor:default}
@media(prefers-reduced-motion:reduce){[data-ui-bar] .ui-bar-motion{display:none;animation:none}}
@media(forced-colors:active){[data-ui-bar]{background:Canvas;border:1px solid CanvasText;box-shadow:none}[data-ui-bar]>.ui-bar-fill{background:Highlight;box-shadow:none;forced-color-adjust:none}[data-ui-bar]>.ui-bar-marker{background:CanvasText}[data-ui-bar] .ui-bar-motion{display:none}input[data-ui-slider]{appearance:auto;accent-color:Highlight}}
`;}




// Informational detail surface. Callers format/translate text and compute percentages.
// All content is escaped; this component deliberately accepts no trusted HTML.
function uiDetailSurface({title='',metrics=[],percent=null,entity='',actionLabel='',attrs={}}={}){
 const progress=Number.isFinite(percent)?Math.max(0,Math.min(100,percent)):null;
 return `<section${uiAttributes({...attrs,'data-ui-detail-surface':'','aria-label':title})}>
  <h3 class="ui-detail-surface-title">${entity?`<button type="button" class="ui-detail-surface-action" data-entity="${uiEscape(entity)}" aria-label="${uiEscape(actionLabel||title)}">${uiEscape(title)} <span aria-hidden="true">›</span></button>`:uiEscape(title)}</h3>
  <dl class="ui-detail-surface-metrics">${metrics.map(({label='',value,unit='',hint=''})=>{
   const missing=value==null||value==='';
   return `<div><dt>${uiEscape(label)}</dt><dd>${uiEscape(missing?'—':value)}${!missing&&unit?' '+uiEscape(unit):''}${hint?`<small class="ui-detail-surface-hint">${uiEscape(hint)}</small>`:''}</dd></div>`;
  }).join('')}</dl>
  ${progress==null?'':uiBar({value:progress,decorative:true,attrs:{class:'ui-detail-surface-track',style:'--ui-bar-tone:var(--ui-detail-tone,var(--primary-color,#2196f3))'}})}
 </section>`;
}

function uiDetailSurfaceStyles(){return uiSurfaceStyles('[data-ui-detail-surface]')+uiBarStyles()+`
[data-ui-detail-surface]{box-sizing:border-box;min-width:0;padding:12px;border-radius:8px;color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--ui-detail-tone,var(--primary-color,#2196f3)) 5%,transparent)}
[data-ui-detail-surface] .ui-detail-surface-title{font-family:inherit;font-size:12px;font-weight:600;line-height:1.4;color:inherit;margin:0 0 8px;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-action{font:inherit;line-height:1.4;color:inherit;background:none;border:0;border-radius:4px;padding:4px 0;margin:-4px 0;text-align:start;cursor:pointer}
[data-ui-detail-surface] .ui-detail-surface-action:hover{text-decoration:underline}[data-ui-detail-surface] .ui-detail-surface-action:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
[data-ui-detail-surface] .ui-detail-surface-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,68px),1fr));gap:8px 12px;margin:0}
[data-ui-detail-surface] .ui-detail-surface-metrics>div{min-width:0}
[data-ui-detail-surface] dt{font-size:10px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#626a78);overflow-wrap:anywhere;margin:0 0 2px}
[data-ui-detail-surface] dd{margin:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
[data-ui-detail-surface] .ui-detail-surface-hint{display:block;margin-top:3px;font-size:10px;font-weight:400;line-height:1.4;letter-spacing:normal;color:var(--secondary-text-color,#626a78)}
[data-ui-detail-surface] .ui-detail-surface-track{margin-top:8px}
@container(max-width:360px){[data-ui-detail-surface] dd{font-size:15px}}
@media(forced-colors:active){[data-ui-detail-surface]{border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track{background:Canvas;border:1px solid CanvasText}[data-ui-detail-surface] .ui-detail-surface-track>i{background:Highlight;forced-color-adjust:none}}
`;}


function uiTabs({id,label,items,selected,className='',panelClassName='',variant=''}={}){
 if(typeof id!=='string'||!id||!items?.length||items.some(item=>typeof item.value!=='string'||!item.value)||new Set(items.map(item=>item.value)).size!==items.length)throw Error('Tabs need an id and distinct text values.');
 const active=items.find(item=>item.value===selected&&!item.disabled)??items.find(item=>!item.disabled);
 const tabId=value=>`${id}-tab-${encodeURIComponent(value)}`,panelId=value=>`${id}-panel-${encodeURIComponent(value)}`;
 const bar=`<div${uiAttributes({class:className||null,'data-ui-tabs':'','data-ui-card-tabs':variant==='card'?true:null,role:'tablist','aria-label':label})}>${items.map(item=>uiButton({variant:'tab',text:item.label,disabled:item.disabled,attrs:{role:'tab',id:tabId(item.value),'data-ui-tab':item.value,'aria-controls':panelId(item.value),'aria-selected':item===active,tabindex:item===active?0:-1,...item.tabAttrs}})).join('')}</div>`;
 const panels=items.map(item=>`<section${uiAttributes({class:[panelClassName,item.className].filter(Boolean).join(' ')||null,id:panelId(item.value),role:'tabpanel','aria-labelledby':tabId(item.value),'data-ui-tab-panel':item.value,'data-ui-card-tab-panel':variant==='card'?true:null,...item.panelAttrs,hidden:item!==active})}>${item.content??''}</section>`).join('');
 return bar+panels;
}
function bindUITabs({tabs,panels,onSelect=()=>{}}){
 const buttons=[...tabs],sections=[...panels],cleanups=[];
 const select=(value,{focus=false,notify=true}={})=>{
  const target=buttons.find(tab=>tab.dataset.uiTab===value&&!tab.disabled);if(!target)return false;
  for(const tab of buttons){const active=tab===target;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  for(const panel of sections)panel.hidden=panel.dataset.uiTabPanel!==value;
  if(focus)target.focus({preventScroll:true});
  // Keep a selected tab visible within a scrolling strip without moving the page.
  const list=target.parentElement;
  if(list&&list.scrollWidth>list.clientWidth&&target.getBoundingClientRect){const box=target.getBoundingClientRect(),view=list.getBoundingClientRect();list.scrollLeft+=box.left<view.left?box.left-view.left:box.right>view.right?box.right-view.right:0;}
  if(notify)onSelect(value,target);return true;
 };
 for(const tab of buttons){
  const click=()=>select(tab.dataset.uiTab,{focus:true});
  const keydown=e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();e.stopPropagation();const enabled=buttons.filter(button=>!button.disabled),index=enabled.indexOf(tab);
   const next=e.key==='Home'?0:e.key==='End'?enabled.length-1:(index+(e.key==='ArrowRight'?1:-1)+enabled.length)%enabled.length;
   if(enabled[next])select(enabled[next].dataset.uiTab,{focus:true});
  };
  tab.onclick=click;tab.onkeydown=keydown;
  cleanups.push(()=>{if(tab.onclick===click)tab.onclick=null;if(tab.onkeydown===keydown)tab.onkeydown=null;});
 }
 return {select,disconnect(){cleanups.splice(0).forEach(remove=>remove());}};
}
// One underline recipe for standard and balanced card tabs. Keep the accent
// above the divider; a negative margin would make the two lines overlap.
function uiTabIndicatorStyles({strip='[data-ui-tabs]',tab=strip+' [role=tab]',color='var(--primary-color,#2196f3)'}={}){return `
${strip}{border-bottom:1px solid var(--divider-color,#ddd)}
${tab}{margin-bottom:0;border-bottom:2px solid transparent}
${tab}[aria-selected=true]{border-bottom-color:${color}}
`;}
function uiTabsStyles(){return `
[data-ui-tabs]{display:flex;align-items:flex-end;gap:8px}
[data-ui-tabs] [role="tab"]{flex:1;justify-content:center;min-width:0;min-height:36px;padding:8px 3px;border:0;border-radius:0;background:transparent;color:var(--secondary-text-color,#666);white-space:nowrap}
[data-ui-tabs] [role="tab"]:hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,var(--ha-card-background,var(--card-background-color,#fff)));color:var(--primary-text-color,#20252b)}
[data-ui-tabs] [role="tab"][aria-selected="true"]{color:var(--primary-color,#2196f3);font-weight:600}
${uiTabIndicatorStyles()}
[data-ui-tab-panel][hidden]{display:none!important}
[data-ui-tabs][data-ui-card-tabs]{margin-top:16px;overflow-x:auto;scrollbar-width:thin}
[data-ui-tabs][data-ui-card-tabs] [role=tab]{flex:1 0 auto;min-width:64px;max-width:220px;display:block;overflow:hidden;text-overflow:ellipsis;text-align:center;font:inherit;line-height:inherit;border-radius:0}
[data-ui-tabs][data-ui-card-tabs] [role=tab][aria-selected=true]{font-weight:600}
[data-ui-card-tab-panel]{margin:0;padding:16px 0 0;border:0;min-width:0}
`;}

function uiBalancedTabsStyles(){
 const strip=':host [data-ui-tabs][role=tablist]';
 const tab=strip+' [role=tab][data-ui-tab]';
 return `
${strip}{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:stretch;gap:0;width:100%;box-sizing:border-box;padding:0;border:0;background:transparent;box-shadow:none;overflow:visible}
${strip}:has(>[role=tab]:nth-child(4)){display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
${strip}::-webkit-scrollbar{display:none}
${strip}:has(>[role=tab]:nth-child(4)) [role=tab][data-ui-tab]{flex:1 0 88px}
${tab}{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:44px;max-width:none;min-height:44px;height:auto;margin:0;padding:5px 6px 3px;border:0;border-radius:0;background:transparent;box-shadow:none;color:var(--secondary-text-color,#666);font-family:inherit;font-size:13px;font-weight:400;line-height:1.3;text-align:center;white-space:normal;overflow:visible;overflow-wrap:anywhere;text-overflow:clip;text-decoration:none;transform:none}
${tab}:not(:disabled):hover{color:var(--primary-text-color,#20252b);background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,transparent);box-shadow:none;transform:none}
${tab}[aria-selected=true],${tab}[aria-selected=true]:not(:disabled):hover{color:var(--primary-text-color,#20252b);font-weight:400;background:transparent;box-shadow:none;text-decoration:none;transform:none}
${uiTabIndicatorStyles({strip,tab,color:'var(--accent-color,var(--primary-color))'})}
${tab}:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-3px}
${strip}~[data-ui-tab-panel]{border:0;padding-block-start:12px;background:transparent}
@media(forced-colors:active){${strip}{border-bottom-color:CanvasText}${tab}[aria-selected=true]{border-bottom-color:Highlight;outline:1px solid Highlight;outline-offset:-2px;box-shadow:none}${tab}:focus-visible{outline:2px solid CanvasText;outline-offset:-4px}}
`;
}

// Decorative header layers; all paint inherits the weather state's --tone.
function observeCardMotion(host,onVisibility=()=>{}){
 if(typeof document==='undefined'||typeof host.toggleAttribute!=='function')return ()=>{};
 let visible=true;
 const update=()=>{host.toggleAttribute('data-motion-paused',document.hidden||!visible);onVisibility();};
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);update();}):null;
 observer?.observe(host);document.addEventListener('visibilitychange',update);update();
 return ()=>{observer?.disconnect();document.removeEventListener('visibilitychange',update);};
}
function headerAtmosphere(background){
 if(background==='terrain')return '<div class="header-pattern" aria-hidden="true">'+Array.from({length:10},(_,n)=>`<i style="--n:${n}"></i>`).join('')+'</div>';
 if(background==='hologram'||background==='ink')return '<div class="header-pattern" aria-hidden="true">'+'<i></i>'.repeat(background==='ink'?3:2)+'</div>';

 if(!['aurora','clouds','isobars'].includes(background))return '';
 let body='';
 if(background==='aurora')body=Array.from({length:32},(_,i)=>`<i style="--star-x:${i*37%100}%;--star-y:${i*19%72}%;--star-duration:${2+i%5}s;--star-delay:${-i*.37}s"></i>`).join('');
 if(background==='isobars')body='<svg class="weather-isobars" viewBox="0 0 600 340" preserveAspectRatio="none" focusable="false">'+Array.from({length:10},(_,i)=>`<path d="M-40 ${40+i*27}C100 ${-90+i*27} 235 ${270+i*10} 370 ${105+i*15}S580 ${-20+i*28} 650 ${85+i*29}"/>`).join('')+Array.from({length:4},(_,i)=>`<path class="weather-front" d="M-40 ${67+i*54}C100 ${-63+i*54} 235 ${280+i*20} 370 ${120+i*30}S580 ${8+i*56} 650 ${114+i*58}"/>`).join('')+'</svg>';
 return `<div class="header-atmosphere" aria-hidden="true">${body}</div>`;
}

const headerAtmosphereStyles=`
.header-atmosphere{position:absolute;inset:0;overflow:hidden;pointer-events:none;--sky-light:color-mix(in srgb,var(--tone) 42%,transparent)}
.content:is([data-background=aurora],[data-background=clouds],[data-background=isobars]) :is(.scene-background,.header-background)::after{display:none}
.content[data-background=aurora] :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 60% 20%,color-mix(in srgb,var(--tone) 32%,transparent),transparent 80%)}
[data-background=aurora] .header-atmosphere::before,[data-background=aurora] .header-atmosphere::after{content:'';position:absolute;width:170%;height:72%;left:-35%;top:0;border-radius:50%;background:conic-gradient(from 75deg at 50% 100%,transparent,color-mix(in srgb,var(--tone) 70%,#58ddb6) 10deg,transparent 42deg);filter:blur(13px);animation:weather-aurora 13s ease-in-out infinite alternate;transform:rotate(-18deg)}
[data-background=aurora] .header-atmosphere::after{top:20%;opacity:.7;animation-delay:-7s;animation-duration:17s;transform:rotate(15deg);background:conic-gradient(from 260deg at 50% 0%,transparent,color-mix(in srgb,var(--tone) 75%,#e1a0d9) 15deg,transparent 55deg)}
[data-background=aurora] .header-atmosphere i{position:absolute;left:var(--star-x);top:var(--star-y);width:2px;height:2px;border-radius:50%;background:var(--tone);box-shadow:0 0 8px var(--tone);opacity:.55;animation:weather-star var(--star-duration) ease-in-out infinite alternate;animation-delay:var(--star-delay)}
.content[data-background=clouds] :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 65% 20%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 76%)}
[data-background=clouds] .header-atmosphere::before,[data-background=clouds] .header-atmosphere::after{content:'';position:absolute;left:-40%;top:32%;width:180%;height:75%;background:radial-gradient(ellipse at 18% 53%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 28%),radial-gradient(ellipse at 46% 40%,color-mix(in srgb,var(--tone) 33%,transparent),transparent 38%),radial-gradient(ellipse at 82% 62%,color-mix(in srgb,var(--tone) 44%,transparent),transparent 31%);animation:weather-clouds 8s ease-in-out infinite alternate}
[data-background=clouds] .header-atmosphere::after{top:12%;opacity:.55;animation-duration:13s;animation-delay:-5s;animation-direction:alternate-reverse}
.content[data-background=isobars] :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 50% 35%,color-mix(in srgb,var(--tone) 42%,transparent),transparent 70%)}
.weather-isobars{position:absolute;width:155%;height:135%;left:-28%;top:-10%;fill:none;stroke:var(--tone);stroke-width:.8;opacity:.36}
.weather-isobars .weather-front{stroke-width:2;stroke-dasharray:38 540;opacity:1;animation:weather-front 9s linear infinite}
.weather-isobars .weather-front:nth-child(2n){animation-duration:13s;animation-delay:-5s}
@keyframes weather-aurora{to{transform:translate(9%,20%) rotate(9deg) scale(1.16)}}
@keyframes weather-star{from{opacity:.2}to{opacity:.9;transform:scale(1.4)}}
@keyframes weather-clouds{0%{transform:translate(-16%,6%) scale(1);opacity:.6}50%{opacity:1}100%{transform:translate(22%,-16%) scale(1.16);opacity:.85}}
@keyframes weather-front{to{stroke-dashoffset:-578}}
.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere,.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere *,.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere::before,.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-atmosphere::after{animation:none!important}
:host([data-motion-paused]) *,:host([data-motion-paused]) *::before,:host([data-motion-paused]) *::after{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.header-atmosphere,.header-atmosphere *,.header-atmosphere::before,.header-atmosphere::after{animation:none!important}}

.header-pattern{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.header-pattern i{position:absolute;display:block;pointer-events:none}
.content:is([data-background=hologram],[data-background=ink],[data-background=terrain]) :is(.scene-background,.header-background)::before,.content:is([data-background=hologram],[data-background=ink],[data-background=terrain]) :is(.scene-background,.header-background)::after{display:none}
[data-background=hologram] .header-pattern{perspective:380px;background:radial-gradient(ellipse at 50% 60%,color-mix(in srgb,var(--tone) 15%,transparent),transparent 70%)}
[data-background=hologram] .header-pattern i:first-child{inset:-25%;background:repeating-linear-gradient(0deg,transparent 0 35px,color-mix(in srgb,var(--tone) 17%,transparent) 36px,transparent 37px),repeating-linear-gradient(90deg,transparent 0 35px,color-mix(in srgb,var(--tone) 17%,transparent) 36px,transparent 37px);transform:rotateX(52deg);transform-origin:50% 80%;animation:energy-background-grid 26s linear infinite}
[data-background=hologram] .header-pattern i:last-child{inset:0;background:linear-gradient(180deg,transparent 25%,color-mix(in srgb,var(--tone) 14%,transparent) 48%,transparent 65%);animation:energy-background-scan 16s ease-in-out infinite alternate}
[data-background=ink] .header-pattern i{width:100%;height:100%;left:-20%;top:-35%;border-radius:36% 64% 55% 45% / 65% 45% 55% 35%;background:radial-gradient(ellipse,color-mix(in srgb,var(--tone) 25%,transparent),transparent 70%);filter:blur(15px);animation:energy-background-ink 29s ease-in-out infinite alternate}
[data-background=ink] .header-pattern i:nth-child(2){left:35%;top:-20%;opacity:.75;animation-delay:-14s;animation-duration:37s}
[data-background=ink] .header-pattern i:nth-child(3){left:5%;top:25%;opacity:.45;animation-delay:-24s;animation-duration:41s}
[data-background=terrain] .header-pattern i{width:calc(130px + var(--n)*38px);height:calc(80px + var(--n)*25px);left:65%;top:20%;border:1px solid color-mix(in srgb,var(--tone) 20%,transparent);border-radius:42% 58% 63% 37% / 52% 37% 63% 48%;transform:translate(-50%,-50%) rotate(-18deg);animation:energy-background-terrain 24s ease-in-out infinite alternate;animation-delay:calc(var(--n)*-1.5s)}
@keyframes energy-background-grid{to{background-position:0 72px,0 72px}}
@keyframes energy-background-scan{from{transform:translateY(-25%)}to{transform:translateY(25%)}}
@keyframes energy-background-ink{from{transform:rotate(-12deg) scale(.9)}to{transform:translate(10%,8%) rotate(25deg) scale(1.15)}}
@keyframes energy-background-terrain{from{translate:-2% -2%;rotate:-2deg}to{translate:3% 5%;rotate:5deg}}
.content:is([data-background-animated=false],[data-animated=false]:not([data-background-animated])) .header-pattern i{animation:none!important}
:host([data-motion-paused]) .header-pattern i{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.header-pattern i{animation:none!important}}
`;

// Shared designs; each card supplies its own state color through --tone.
const HEADER_BACKGROUNDS = [
 {
  "value": "lanes",
  "label": "Energy Lanes"
 },
 {
  "value": "halo",
  "label": "Halo"
 },
 {
  "value": "ribbon",
  "label": "Silk Flow"
 },
 {
  "value": "prism-glass",
  "label": "Prism Glass"
 },
 {
  "value": "eclipse",
  "label": "Eclipse"
 },
 {
  "value": "aurora",
  "label": "Aurora sky"
 },
 {
  "value": "clouds",
  "label": "Cloud layers"
 },
 {
  "value": "isobars",
  "label": "Atmospheric flow"
 },
 {value:'hologram',label:'Holographic grid',labelNl:'Holografisch raster'},
 {value:'ink',label:'Liquid ink',labelNl:'Vloeibare inkt'},
 {value:'terrain',label:'Relief map',labelNl:'Reliëfkaart'}
].map(item=>({...item,animated:['aurora','clouds','isobars','hologram','ink','terrain'].includes(item.value)}));
function headerBackgroundOptions(nl){
 return HEADER_BACKGROUNDS.map(item=>({value:item.value,label:`${nl?(item.labelNl??item.label):item.label} · ${nl?(item.animated?'Geanimeerd':'Statisch'):(item.animated?'Animated':'Static')}`}));
}


const headerBackgroundStyles = `
:is(.scene-background,.header-background)::before,:is(.scene-background,.header-background)::after{content:"";position:absolute;z-index:-1;pointer-events:none;inset:auto;transform:none;border:0;box-shadow:none;border-radius:0;width:auto;height:auto}
:where(.content[data-background="lanes"]) :is(.scene-background,.header-background)::before{inset:0;background:linear-gradient(143deg,transparent 0 43%,color-mix(in srgb,var(--tone) 19%,transparent) 43.2% 70%,color-mix(in srgb,var(--tone) 5%,transparent) 70.2% 88%,transparent 88.2%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 11%,transparent),transparent 75%)}:where(.content[data-background="lanes"]) :is(.scene-background,.header-background)::after{inset:20% -16% -30% 24%;transform:skewY(-36deg);background:repeating-linear-gradient(0deg,transparent 0 25px,color-mix(in srgb,var(--tone) 13%,transparent) 26px,transparent 27px 58px)}
:where(.content[data-background="halo"]) :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 75% 68%,color-mix(in srgb,var(--tone) 20%,transparent),transparent 61%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 11%,transparent),transparent 65%)}:where(.content[data-background="halo"]) :is(.scene-background,.header-background)::after{width:88%;height:60%;right:-11%;bottom:20%;border:1px solid color-mix(in srgb,var(--tone) 39%,transparent);border-radius:50%;transform:rotate(-16deg);box-shadow:0 0 0 19px color-mix(in srgb,var(--tone) 4%,transparent),0 0 0 39px color-mix(in srgb,var(--tone) 3%,transparent),inset 0 0 45px color-mix(in srgb,var(--tone) 8%,transparent);background:radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--tone) 7%,transparent),transparent 70%)}
:where(.content[data-background="ribbon"]) :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 95% 32%,color-mix(in srgb,var(--tone) 24%,transparent),transparent 59%),linear-gradient(155deg,color-mix(in srgb,var(--tone) 10%,transparent),transparent 65%)}:where(.content[data-background="ribbon"]) :is(.scene-background,.header-background)::after{width:145%;height:60%;right:-32%;top:22%;border-radius:50%;transform:rotate(-21deg);border-top:1px solid color-mix(in srgb,var(--tone) 49%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--tone) 25%,transparent),color-mix(in srgb,var(--tone) 3%,transparent) 65%,transparent);box-shadow:0 -16px 0 color-mix(in srgb,var(--tone) 5%,transparent),0 -35px 0 color-mix(in srgb,var(--tone) 3%,transparent)}
:where(.content[data-background="prism-glass"]) :is(.scene-background,.header-background)::before{inset:0;background:linear-gradient(119deg,transparent 37%,color-mix(in srgb,var(--tone) 12%,transparent) 37.3%,color-mix(in srgb,var(--tone) 3%,transparent) 76%,transparent 76.3%),linear-gradient(34deg,transparent 42%,color-mix(in srgb,var(--tone) 11%,transparent) 42.3%,transparent 83%),radial-gradient(ellipse at 82% 30%,color-mix(in srgb,var(--tone) 20%,transparent),transparent 63%)}:where(.content[data-background="prism-glass"]) :is(.scene-background,.header-background)::after{inset:0;background:linear-gradient(119deg,transparent 37%,color-mix(in srgb,var(--tone) 23%,transparent) 37.2%,transparent 37.5%),linear-gradient(34deg,transparent 42%,color-mix(in srgb,var(--tone) 19%,transparent) 42.2%,transparent 42.5%)}
:where(.content[data-background="eclipse"]) :is(.scene-background,.header-background)::before{inset:0;background:radial-gradient(ellipse at 82% 24%,color-mix(in srgb,var(--tone) 28%,transparent),transparent 57%),linear-gradient(180deg,color-mix(in srgb,var(--tone) 5%,transparent),transparent 78%)}:where(.content[data-background="eclipse"]) :is(.scene-background,.header-background)::after{width:76%;height:auto;aspect-ratio:1;right:-5%;top:-12%;border-radius:50%;background:radial-gradient(circle at 47% 46%,color-mix(in srgb,var(--ha-card-background,var(--card-background-color,#fff)) 95%,transparent) 0 55%,color-mix(in srgb,var(--tone) 58%,transparent) 57%,color-mix(in srgb,var(--tone) 12%,transparent) 61%,transparent 70%)}
`;

// The backdrop belongs to the header region, never to the entire card or a tab.
// Relative stops follow the header's intrinsic height, including wrapped content.
const headerSceneStyles=`
.header-region{position:relative;isolation:isolate;margin:calc(-1 * var(--eleven-card-padding,16px)) calc(-1 * var(--eleven-card-padding,16px)) 0;padding:var(--eleven-card-padding,16px) var(--eleven-card-padding,16px) 0}
.header-region>.header-scene,.header-region>.scene{margin:0;padding-left:0;padding-right:0;padding-top:0;padding-bottom:12px;isolation:auto;overflow:visible}
.header-region>.header-background,.header-region>.scene-background{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;opacity:var(--header-background-opacity,1);
--header-fade:linear-gradient(180deg,#000 0%,#000 25%,rgba(0,0,0,.9) 40%,rgba(0,0,0,.65) 55%,rgba(0,0,0,.32) 72%,rgba(0,0,0,.08) 88%,transparent 100%);
-webkit-mask-image:var(--header-fade);mask-image:var(--header-fade)}
`;


const CARD_BACKGROUNDS=Object.freeze([
 {value:'aurora',label:'Aurora sky',description:'Langzaam golvende lichtgordijnen met kleine sterren.'},
 {value:'lanes',label:'Energy Lanes',description:'Diagonale banen met een rustige lichtstroom.'},
 {value:'halo',label:'Halo orbit',description:'Dunne ringen die langzaam om elkaar bewegen.'},
 {value:'ribbon',label:'Silk Flow',description:'Zachte linten die langs de kaart glijden.'},
 {value:'eclipse',label:'Eclipse',description:'Een zwevende cirkel met een verlichte rand.'},
 {value:'clouds',label:'Cloud layers',description:'Drie transparante wolkenlagen met verschillende snelheden.'},
 {value:'isobars',label:'Atmospheric flow',description:'Fijne contourlijnen met bewegende lichtaccenten.'},
 {value:'hologram',label:'Holographic grid',description:'Een perspectiefraster met een zachte scanlijn.'},
 {value:'ink',label:'Liquid ink',description:'Organische kleurvelden die rustig van vorm veranderen.'},
 {value:'terrain',label:'Relief map',description:'Gelaagde hoogtelijnen die langzaam verschuiven.'},
 {value:'aurora-curtains',family:'aurora',code:'1A',label:'Aurora curtains',description:'Smallere, verticale lichtgordijnen met een rustige zijwaartse golf.'},
 {value:'aurora-horizon',family:'aurora',code:'1B',label:'Aurora horizon',description:'Brede lichtbogen laag op de kaart, met meer open ruimte bovenin.'},
 {value:'ribbon-pleats',family:'ribbon',code:'4A',label:'Silk pleats',description:'Fijn gevouwen linten met meerdere zachte randen.'},
 {value:'ribbon-sweep',family:'ribbon',code:'4B',label:'Silk sweep',description:'Twee brede, diagonale linten die in tegengestelde richting bewegen.'},
 {value:'isobars-stream',family:'isobars',code:'7A',label:'Open jetstream',description:'Ruim uit elkaar liggende luchtstromen met lange bewegende accenten.'},
 {value:'isobars-vortex',family:'isobars',code:'7B',label:'Atmospheric vortex',description:'Gesloten druklijnen die rustig rond een centrum rechts draaien.'},
 {value:'ink-marble',family:'ink',code:'9A',label:'Ink marble',description:'Vloeibare kleuraders met een fijnere, gemarmerde structuur.'},
 {value:'ink-bloom',family:'ink',code:'9B',label:'Ink bloom',description:'Drie zachte inktbloemen die langzaam openen en samenvloeien.'},
 {value:'hologram-dots',family:'hologram',code:'8A',label:'Holographic dots',description:'Een ruimtelijk puntenraster met een brede lichtgolf.'},
 {value:'hologram-hex',family:'hologram',code:'8B',label:'Holographic honeycomb',description:'Een bewegend honingraatraster met een rustige diagonale scan.'},
 {value:'caustics',code:'11',label:'Caustic light',description:'Gebroken licht op water: een netwerk van vervormende lichtcellen.'},
 {value:'stardrift',code:'12',label:'Stardrift',description:'Losse lichtsporen die langzaam diagonaal door de kaart trekken.'},
 {value:'dunes',code:'13',label:'Quiet dunes',description:'Drie golvende duinsilhouetten die zacht langs elkaar schuiven.'},
 {value:'moire',code:'14',label:'Moire silk',description:'Twee fijne lijnweefsels die langzaam kruisen en nieuwe patronen vormen.'},
 {value:'satin-waves',label:'Satin waves',description:'Brede satijngolven met langzaam bewegende lichtnaden.'},
 {value:'isometric-depth',label:'Isometric depth',description:'Ruimtelijke blokken met een zachte lichtgolf.'},
 {value:'comet-trails',label:'Comet trails',description:'Gebogen lichtsporen met langzaam voorbijglijdende accenten.'},
 {value:'lenticular-glow',label:'Lenticular glow',description:'Overlappende lichtlenzen die rustig vervormen.'},
 {value:'constellation',code:'15',label:'Constellation',description:'Een open netwerk van lichtpunten met accenten langs de verbindingen.'}

].map(Object.freeze));
const CARD_BACKGROUND_CHOICES=Object.freeze(['aurora','ribbon','isobars','ink-bloom','hologram','satin-waves','isometric-depth','comet-trails','lenticular-glow'].map(value=>CARD_BACKGROUNDS.find(row=>row.value===value)));
const backgroundHex=value=>typeof value==='string'&&/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)?value:null;
function normalizeCardBackground(input={}){
 const source=input&&typeof input==='object'?input:{};
 const number=source.transparency==null?65:Number(source.transparency);
 const height=source.height==null?240:Number(source.height);
 return {variant:CARD_BACKGROUNDS.some(item=>item.value===source.variant)?source.variant:'aurora',colorMode:['accent','custom','dynamic'].includes(source.colorMode)?source.colorMode:'accent',colors:Array.isArray(source.colors)?source.colors.map(backgroundHex).filter(Boolean).slice(0,3):[],transparency:Number.isFinite(number)?Math.min(100,Math.max(0,number)):65,animated:source.animated!==false,coverage:source.coverage==='header'?'header':'card',height:Number.isFinite(height)?Math.min(2000,Math.max(24,Math.round(height))):240};
}
// Purely decorative markup. The calling card decides which status colour to supply.
function uiCardBackground(input={}, {statusColor}={}){
 const config=normalizeCardBackground(input),accent='var(--accent-color,var(--primary-color,#03a9f4))';
 const colors=config.colorMode==='custom'&&config.colors.length?config.colors:config.colorMode==='dynamic'&&backgroundHex(statusColor)?[statusColor]:[accent];
 const palette=Array.from({length:3},(_,i)=>colors[i%colors.length]);
 const style=palette.map((color,i)=>`--ui-bg-${i+1}:${color}`).join(';')+`;--ui-bg-opacity:${(100-config.transparency)/100};--ui-bg-height:${config.height}px`;
 const family=CARD_BACKGROUNDS.find(item=>item.value===config.variant).family??config.variant;
 const curves=cardBackgroundGeometry(config.variant,family);
 const stars=(family==='aurora'&&config.variant!=='aurora-horizon'||config.variant==='stardrift')?Array.from({length:16},(_,i)=>`<b style="left:${i*37%100}%;top:${i*19%80}%;animation-delay:${-i*.7}s"></b>`).join(''):'';
 return `<div${uiAttributes({'data-ui-card-background':config.variant,'data-ui-background-family':family,'data-ui-background-coverage':config.coverage,'data-animated':String(config.animated),'aria-hidden':'true',style})}><i></i><i></i><i></i>${curves}${stars}</div>`;

}

function cardBackgroundGeometry(variant,family){
 if(variant==='satin-waves')return "<svg focusable=\"false\" viewBox=\"0 0 500 260\" preserveAspectRatio=\"none\"><path opacity=\".2\" d=\"M0 0H500V260H0Z\"/><path opacity=\".28\" d=\"M0 25C110 165 240-90 500 45V260H0Z\"/><path opacity=\".3\" d=\"M0 80C160 250 320-65 500 105V260H0Z\"/><path opacity=\".32\" d=\"M0 145C160 295 300 20 500 160V260H0Z\"/><path opacity=\".3\" d=\"M0 215C190 325 320 110 500 220V260H0Z\"/><path class=\"ui-bg-satin-seam\" d=\"M0 80C160 250 320-65 500 105M0 145C160 295 300 20 500 160\"/></svg>";
 if(variant==='isometric-depth'){
  const blocks=Array.from({length:12},(_,i)=>{const x=i%4*155-70+(Math.floor(i/4)%2)*78,y=Math.floor(i/4)*135-55;return `<g transform="translate(${x} ${y})"><path opacity=".18" d="m78 0 78 45-78 45L0 45Z"/><path opacity=".3" d="m0 45 78 45v90L0 135Z"/><path opacity=".43" d="m78 90 78-45v90l-78 45Z"/></g>`;}).join('');
  return `<svg viewBox="0 0 500 260" preserveAspectRatio="none" focusable="false"><path opacity=".16" d="M0 0H500V260H0Z"/>${blocks}</svg>`;
 }
 if(variant==='comet-trails'){
  const curves=Array.from({length:9},(_,i)=>`M-120 ${i*45-90}Q160 ${i*22+80} 620 ${i*40-120}`);
  return `<svg viewBox="0 0 500 260" preserveAspectRatio="none" focusable="false"><path opacity=".2" d="M0 0H500V260H0Z"/><g class="ui-bg-comet-base">${curves.map(d=>`<path d="${d}"/>`).join('')}</g><g class="ui-bg-comet-stream">${curves.map((d,i)=>`<path style="animation-delay:${-i*4}s" d="${d}"/>`).join('')}</g></svg>`;
 }
 let paths='';
 if(family==='isobars'){
  const count=variant==='isobars-stream'?6:9;
  paths=Array.from({length:count},(_,i)=>variant==='isobars-vortex'?`<path d="M${330-i*23} 150C${260-i*23} ${40-i*13} ${510+i*12} ${45-i*16} ${525+i*21} 150S${380-i*18} ${290+i*16} ${330-i*23} 150Z"/>`:`<path d="M-60 ${i*38}C95 ${i*25-80} 260 ${i*30+140} 390 ${i*27+30}S580 ${i*38-50} 660 ${i*35+20}"/>`).join('');
 }else if(variant==='hologram'){
  paths=Array.from({length:19},(_,i)=>{const x=-240+i*60;return `<path d="M${x} 0L${300+(x-300)*1.6} 320"/>`;}).join('');
  paths+='<g class="ui-bg-grid-rows">'+[0,18,42,74,116,170,238,320,400].map(y=>`<path d="M-400 ${y}H1000"/>`).join('')+'</g>';
 }else if(variant==='hologram-hex'){
  paths=Array.from({length:48},(_,i)=>{const x=i%8*88+(Math.floor(i/8)%2)*44,y=Math.floor(i/8)*54;return `<path d="M${x} ${y-32}l28 16v32l-28 16-28-16v-32Z"/>`;}).join('');
 }else if(variant==='caustics'){
  paths=Array.from({length:35},(_,i)=>{const x=i%7*100,y=Math.floor(i/7)*85;return `<path d="M${x} ${y}q45 -35 100 0q-35 35 0 85q-60 -30 -100 0q30 -45 0 -85Z"/>`;}).join('');
 }else if(variant==='constellation'){
  const points=[[20,60],[110,100],[180,35],[275,125],[360,55],[475,90],[570,25],[80,225],[210,270],[330,210],[440,280],[565,200]];
  paths='<path d="M20 60L110 100L180 35L275 125L360 55L475 90L570 25M110 100L80 225L210 270L275 125L330 210L440 280L565 200L475 90M330 210L360 55"/>';
  paths+=points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3+1.5}" style="animation-delay:${-i*.6}s"/>`).join('');
 }
 return paths?`<svg viewBox="0 0 600 320" preserveAspectRatio="none" focusable="false">${paths}</svg>`:'';
}

function uiCardBackgroundStyles(){return `
/* Explicit radius also works through ha-card slots, where inherit follows the slot.
   The parent keeps its theme surface; only the decorative layer clips and fades. */
[data-ui-background-host]{position:relative;isolation:isolate}
:where([data-ui-background-host]>:not([data-ui-card-background])){position:relative;z-index:1}
[data-ui-background-host]>[data-ui-card-background]{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:var(--ui-background-radius,var(--ha-card-border-radius,12px));clip-path:inset(0 round var(--ui-background-radius,var(--ha-card-border-radius,12px)));pointer-events:none;user-select:none;contain:paint;opacity:var(--ui-bg-opacity,.35);color:var(--ui-bg-1);--ui-bg-a:color-mix(in srgb,var(--ui-bg-1) 65%,transparent);--ui-bg-b:color-mix(in srgb,var(--ui-bg-2) 55%,transparent);--ui-bg-c:color-mix(in srgb,var(--ui-bg-3) 50%,transparent)}
[data-ui-background-coverage=header]{max-height:var(--ui-bg-height,240px);mask-image:linear-gradient(to bottom,#000 0% 45%,rgb(0 0 0 / .45) 78%,transparent 100%)}
[data-ui-card-background]>i{position:absolute;display:block;pointer-events:none;animation:ui-bg-drift 18s ease-in-out infinite alternate}
[data-ui-card-background]>i:nth-child(2){animation-delay:-7s;animation-duration:23s}
[data-ui-card-background]>i:nth-child(3){animation-delay:-13s;animation-duration:29s}
[data-ui-background-family=aurora]>i{inset:-30%;border-radius:50%;background:conic-gradient(from 70deg at 50% 90%,transparent 0deg,var(--ui-bg-a) 17deg,transparent 65deg);filter:blur(16px);transform:rotate(-18deg)}
[data-ui-background-family=aurora]>i:nth-child(2){background:conic-gradient(from 230deg at 50% 10%,transparent,var(--ui-bg-b) 25deg,transparent 70deg)}
[data-ui-background-family=aurora]>i:nth-child(3){background:radial-gradient(ellipse at 80% 5%,var(--ui-bg-c),transparent 60%)}
[data-ui-background-family=aurora]>b{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--ui-bg-3);animation:ui-bg-star 5s ease-in-out infinite alternate}
[data-ui-card-background=lanes]>i{inset:-50%;background:linear-gradient(135deg,transparent 30%,var(--ui-bg-a) 30.2% 42%,transparent 42.2% 55%,var(--ui-bg-b) 55.2% 61%,transparent 61.2%);animation:ui-bg-lanes 16s ease-in-out infinite alternate}
[data-ui-card-background=lanes]>i:nth-child(2){background:repeating-linear-gradient(135deg,transparent 0 42px,var(--ui-bg-c) 43px,transparent 44px 90px);opacity:.35}
[data-ui-card-background=lanes]>i:nth-child(3){display:none}
[data-ui-card-background=halo]>i{width:80%;height:95%;right:-20%;top:-20%;border:1px solid var(--ui-bg-a);border-radius:50%;box-shadow:0 0 0 20px color-mix(in srgb,var(--ui-bg-2) 12%,transparent),0 0 0 45px color-mix(in srgb,var(--ui-bg-3) 8%,transparent);animation:ui-bg-orbit 22s ease-in-out infinite alternate}
[data-ui-card-background=halo]>i:nth-child(2){right:5%;top:25%;width:65%;height:65%;border-color:var(--ui-bg-b);box-shadow:none}
[data-ui-card-background=halo]>i:nth-child(3){display:none}
[data-ui-background-family=ribbon]>i{width:150%;height:85%;top:15%;left:-20%;border-radius:50%;border-top:1px solid var(--ui-bg-a);background:linear-gradient(var(--ui-bg-a),transparent 60%);transform:rotate(-20deg);animation:ui-bg-ribbon 19s ease-in-out infinite alternate}
[data-ui-background-family=ribbon]>i:nth-child(2){top:30%;background:linear-gradient(var(--ui-bg-b),transparent 60%)}
[data-ui-background-family=ribbon]>i:nth-child(3){top:45%;background:linear-gradient(var(--ui-bg-c),transparent 60%)}
[data-ui-card-background=eclipse]>i{width:80%;aspect-ratio:1;right:-10%;top:-20%;border-radius:50%;background:radial-gradient(circle,transparent 52%,var(--ui-bg-a) 54%,var(--ui-bg-b) 57%,transparent 66%);animation:ui-bg-orbit 26s ease-in-out infinite alternate}
[data-ui-card-background=eclipse]>i:nth-child(2){inset:0;width:auto;aspect-ratio:auto;background:radial-gradient(ellipse at 90% 0,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=eclipse]>i:nth-child(3){display:none}
[data-ui-card-background=clouds]>i{inset:-25%;background:radial-gradient(ellipse at 20% 25%,var(--ui-bg-a),transparent 45%),radial-gradient(ellipse at 80% 65%,var(--ui-bg-b),transparent 40%);filter:blur(12px);animation:ui-bg-clouds 24s ease-in-out infinite alternate}
[data-ui-card-background=clouds]>i:nth-child(2){transform:rotate(160deg);opacity:.7}
[data-ui-card-background=clouds]>i:nth-child(3){background:radial-gradient(ellipse at 60% 50%,var(--ui-bg-c),transparent 55%);opacity:.6}
[data-ui-background-family=isobars]>i{inset:0;background:radial-gradient(ellipse at 80% 10%,var(--ui-bg-b),transparent 65%);animation:none}
[data-ui-background-family=isobars]>i:not(:first-child){display:none}
[data-ui-background-family=isobars]>svg{position:absolute;inset:-10%;width:120%;height:120%;fill:none;stroke:var(--ui-bg-1);stroke-width:1;opacity:.5}
[data-ui-background-family=isobars] path:nth-child(2n){stroke:var(--ui-bg-2);stroke-dasharray:30 230;stroke-width:2;animation:ui-bg-front 14s linear infinite}
[data-ui-background-family=hologram]{perspective:380px}
[data-ui-background-family=hologram]>i:first-child{inset:-50%;background:repeating-linear-gradient(0deg,transparent 0 34px,var(--ui-bg-a) 35px,transparent 36px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-bg-b) 35px,transparent 36px);transform:rotateX(50deg);animation:ui-bg-grid 24s linear infinite}
[data-ui-background-family=hologram]>i:nth-child(2){inset:-50% 0;background:linear-gradient(transparent 35%,var(--ui-bg-c) 50%,transparent 65%);animation:ui-bg-scan 14s ease-in-out infinite alternate}
[data-ui-background-family=hologram]>i:nth-child(3){display:none}
[data-ui-background-family=ink]>i{width:110%;height:130%;left:-20%;top:-40%;border-radius:36% 64% 55% 45%;background:radial-gradient(ellipse,var(--ui-bg-a),transparent 65%);filter:blur(14px);animation:ui-bg-ink 24s ease-in-out infinite alternate}
[data-ui-background-family=ink]>i:nth-child(2){left:20%;top:0;background:radial-gradient(ellipse,var(--ui-bg-b),transparent 65%)}
[data-ui-background-family=ink]>i:nth-child(3){left:40%;top:-20%;background:radial-gradient(ellipse,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=terrain]>i{inset:-50%;border-radius:42%;background:repeating-radial-gradient(ellipse at 65% 35%,transparent 0 17px,var(--ui-bg-a) 18px,transparent 19px 35px);animation:ui-bg-terrain 30s ease-in-out infinite alternate}
[data-ui-card-background=terrain]>i:nth-child(2){inset:-30%;opacity:.3;background:repeating-radial-gradient(ellipse at 20% 70%,transparent 0 25px,var(--ui-bg-b) 26px,transparent 27px 50px)}
[data-ui-card-background=terrain]>i:nth-child(3){inset:0;background:radial-gradient(ellipse at 90% 0,var(--ui-bg-c),transparent 65%)}
/* The selected grid spans the full card, including its upper edge. */
[data-ui-card-background=hologram]{perspective:none}
[data-ui-card-background=hologram]>i:first-child{display:none}
[data-ui-card-background=hologram]>i:nth-child(2){opacity:.25}
[data-ui-card-background=hologram]>svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--ui-bg-1);stroke-width:.8;opacity:.5}
[data-ui-card-background=hologram] .ui-bg-grid-rows{stroke:var(--ui-bg-2);animation:ui-bg-grid-rows 24s ease-in-out infinite alternate}
@keyframes ui-bg-grid-rows{to{transform:translateY(-18px)}}
/* Alternatives reuse their family's structure and palette. */
[data-ui-card-background=aurora-curtains]>i{inset:-35% -20%;border-radius:35%;background:repeating-conic-gradient(from 18deg at 50% 110%,transparent 0deg 12deg,var(--ui-bg-a) 16deg,transparent 23deg 40deg);filter:blur(10px);animation:ui-bg-curtains 24s ease-in-out infinite alternate}
[data-ui-card-background=aurora-curtains]>i:nth-child(2){background:repeating-conic-gradient(from -12deg at 50% 100%,transparent 0deg 18deg,var(--ui-bg-b) 23deg,transparent 31deg 48deg);opacity:.65}
[data-ui-card-background=aurora-curtains]>i:nth-child(3){background:radial-gradient(ellipse at 90% 0,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=aurora-horizon]>i{inset:35% -25% -65%;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,transparent 36%,var(--ui-bg-a) 43%,transparent 55%);filter:blur(9px);animation:ui-bg-horizon 28s ease-in-out infinite alternate}
[data-ui-card-background=aurora-horizon]>i:nth-child(2){inset:20% -30% -80%;background:radial-gradient(ellipse,transparent 40%,var(--ui-bg-b) 46%,transparent 56%)}
[data-ui-card-background=aurora-horizon]>i:nth-child(3){inset:50% -20% -50%;background:radial-gradient(ellipse,transparent 35%,var(--ui-bg-c) 45%,transparent 55%)}
[data-ui-card-background=ribbon-pleats]>i{height:110%;top:5%;border-top:1px solid var(--ui-bg-a);background:repeating-linear-gradient(180deg,var(--ui-bg-a) 0,transparent 9px 23px,var(--ui-bg-b) 24px,transparent 25px 48px);opacity:.65;animation:ui-bg-pleats 28s ease-in-out infinite alternate}
[data-ui-card-background=ribbon-pleats]>i:nth-child(2){top:20%;background:repeating-linear-gradient(180deg,var(--ui-bg-b),transparent 12px 32px);opacity:.35}
[data-ui-card-background=ribbon-pleats]>i:nth-child(3){display:none}
[data-ui-card-background=ribbon-sweep]>i{width:175%;height:70%;left:-30%;top:-10%;border-radius:45%;transform:rotate(35deg);background:linear-gradient(180deg,var(--ui-bg-a),transparent 75%);animation:ui-bg-sweep 25s ease-in-out infinite alternate}
[data-ui-card-background=ribbon-sweep]>i:nth-child(2){top:60%;transform:rotate(-30deg);background:linear-gradient(180deg,var(--ui-bg-b),transparent 75%);animation-direction:alternate-reverse}
[data-ui-card-background=ribbon-sweep]>i:nth-child(3){display:none}
[data-ui-card-background=isobars-stream]>svg{width:140%;left:-20%;opacity:.45;animation:ui-bg-stream 30s ease-in-out infinite alternate}
[data-ui-card-background=isobars-stream] path{stroke-width:.8}
[data-ui-card-background=isobars-stream] path:nth-child(2n){stroke-width:2;stroke-dasharray:100 400;animation:ui-bg-jetstream 21s linear infinite}
[data-ui-card-background=isobars-vortex]>svg{inset:-15%;width:130%;height:130%;transform-origin:70% 50%;animation:ui-bg-vortex 38s ease-in-out infinite alternate}
[data-ui-card-background=isobars-vortex] path:nth-child(2n){stroke-dasharray:55 360;animation-duration:26s}
[data-ui-card-background=ink-marble]>i{inset:-50%;width:auto;height:auto;border-radius:40%;filter:blur(5px);background:repeating-conic-gradient(from 35deg at 65% 40%,transparent 0deg 20deg,var(--ui-bg-a) 24deg,transparent 30deg 44deg,var(--ui-bg-b) 47deg,transparent 53deg 85deg);animation:ui-bg-marble 35s ease-in-out infinite alternate}
[data-ui-card-background=ink-marble]>i:nth-child(2){inset:-20%;background:repeating-conic-gradient(from 150deg at 70% 50%,transparent 0deg 35deg,var(--ui-bg-c) 40deg,transparent 47deg 90deg);opacity:.5}
[data-ui-card-background=ink-marble]>i:nth-child(3){display:none}
[data-ui-card-background=ink-bloom]>i{width:85%;height:110%;left:30%;top:-30%;border-radius:60% 40% 65% 35%;filter:blur(7px);background:radial-gradient(ellipse at 60% 50%,var(--ui-bg-a),transparent 65%);animation:ui-bg-bloom 24s ease-in-out infinite alternate}
[data-ui-card-background=ink-bloom]>i:nth-child(2){left:0;top:25%;background:radial-gradient(ellipse,var(--ui-bg-b),transparent 65%);animation-direction:alternate-reverse}
[data-ui-card-background=ink-bloom]>i:nth-child(3){left:60%;top:10%;background:radial-gradient(ellipse,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=hologram-dots]>i:first-child{background:radial-gradient(circle,var(--ui-bg-a) 1.4px,transparent 2px) 0 0/24px 24px;transform:rotateX(45deg) rotateZ(-12deg);animation:ui-bg-dots 30s linear infinite}
[data-ui-card-background=hologram-dots]>i:nth-child(2){background:radial-gradient(ellipse at 60% 50%,var(--ui-bg-b),transparent 55%);animation-duration:20s}
[data-ui-card-background=hologram-hex]>i:first-child{display:none}
[data-ui-card-background=hologram-hex]>svg{position:absolute;inset:-10%;width:120%;height:120%;fill:none;stroke:var(--ui-bg-1);stroke-width:.8;opacity:.45;animation:ui-bg-hex 32s ease-in-out infinite alternate}
[data-ui-card-background=hologram-hex] path:nth-child(3n){stroke:var(--ui-bg-2)}
[data-ui-card-background=hologram-hex]>i:nth-child(2){inset:-50%;background:linear-gradient(120deg,transparent 40%,var(--ui-bg-c) 50%,transparent 60%);animation:ui-bg-hexscan 26s ease-in-out infinite alternate}
/* Five new patterns. */
[data-ui-card-background=caustics]>svg{position:absolute;inset:-15%;width:130%;height:130%;fill:none;stroke:var(--ui-bg-1);stroke-width:1.3;opacity:.4;animation:ui-bg-caustics 27s ease-in-out infinite alternate}
[data-ui-card-background=caustics] path:nth-child(3n){stroke:var(--ui-bg-2);stroke-width:2}
[data-ui-card-background=caustics]>i{inset:-20%;background:radial-gradient(ellipse at 80% 10%,var(--ui-bg-c),transparent 65%);animation:ui-bg-clouds 32s ease-in-out infinite alternate}
[data-ui-card-background=caustics]>i:not(:first-child){display:none}
[data-ui-card-background=stardrift]>b{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--ui-bg-1);animation:ui-bg-stardrift 22s linear infinite}
[data-ui-card-background=stardrift]>b::before{content:'';position:absolute;width:52px;height:1px;left:0;top:0;transform-origin:left;transform:rotate(35deg);background:linear-gradient(90deg,transparent,var(--ui-bg-2))}
[data-ui-card-background=stardrift]>b:nth-of-type(3n){animation-duration:31s;opacity:.5}
[data-ui-card-background=stardrift]>i{inset:0;background:radial-gradient(ellipse at 80% 0,var(--ui-bg-c),transparent 70%)}
[data-ui-card-background=stardrift]>i:not(:first-child){display:none}
[data-ui-card-background=dunes]>i{width:160%;height:95%;left:-25%;top:65%;border-radius:55% 65% 0 0;transform:rotate(-12deg);background:linear-gradient(var(--ui-bg-a),transparent 80%);animation:ui-bg-dunes 32s ease-in-out infinite alternate}
[data-ui-card-background=dunes]>i:nth-child(2){top:48%;left:10%;transform:rotate(14deg);background:linear-gradient(var(--ui-bg-b),transparent 75%);animation-direction:alternate-reverse}
[data-ui-card-background=dunes]>i:nth-child(3){top:80%;left:-50%;background:linear-gradient(var(--ui-bg-c),transparent 75%)}
[data-ui-card-background=moire]>i{inset:-80%;background:repeating-linear-gradient(90deg,transparent 0 7px,var(--ui-bg-a) 7.5px,transparent 8px 15px);transform:rotate(25deg);opacity:.45;animation:ui-bg-weave 40s ease-in-out infinite alternate}
[data-ui-card-background=moire]>i:nth-child(2){background:repeating-linear-gradient(90deg,transparent 0 9px,var(--ui-bg-b) 9.5px,transparent 10px 19px);transform:rotate(-18deg);animation-direction:alternate-reverse}
[data-ui-card-background=moire]>i:nth-child(3){inset:0;background:radial-gradient(ellipse at 90% 20%,var(--ui-bg-c),transparent 65%);opacity:.6;animation:ui-bg-drift 30s ease-in-out infinite alternate}
[data-ui-card-background=constellation]>svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--ui-bg-1);stroke-width:.8;opacity:.6}
[data-ui-card-background=constellation] path{stroke-dasharray:80 200;animation:ui-bg-network 24s linear infinite}
[data-ui-card-background=constellation] circle{fill:var(--ui-bg-2);stroke:none;animation:ui-bg-star 8s ease-in-out infinite alternate}
[data-ui-card-background=constellation]>i{inset:0;background:radial-gradient(ellipse at 80% 40%,var(--ui-bg-c),transparent 65%)}
[data-ui-card-background=constellation]>i:not(:first-child){display:none}
@keyframes ui-bg-curtains{to{transform:translate(8%,6%) skewX(12deg) scale(1.1)}}
@keyframes ui-bg-horizon{to{transform:translate(-5%,-15%) scale(1.15,.9)}}
@keyframes ui-bg-pleats{to{transform:translate(4%,8%) rotate(-6deg) scaleY(.9)}}
@keyframes ui-bg-sweep{to{transform:translate(10%,15%) rotate(15deg)}}
@keyframes ui-bg-stream{to{transform:translate(7%,-6%) rotate(4deg)}}
@keyframes ui-bg-jetstream{to{stroke-dashoffset:-500}}
@keyframes ui-bg-vortex{to{transform:rotate(20deg) scale(.95)}}
@keyframes ui-bg-marble{to{transform:rotate(25deg) scale(1.15,.9);border-radius:60% 40% 50% 50%}}
@keyframes ui-bg-bloom{to{transform:translate(-10%,12%) scale(1.2,.8);border-radius:35% 65% 40% 60%}}
@keyframes ui-bg-dots{from{transform:rotateX(45deg) rotateZ(-12deg) translateY(-24px)}to{transform:rotateX(45deg) rotateZ(-12deg) translateY(0)}}
@keyframes ui-bg-hex{to{transform:translate(-5%,8%) rotate(6deg)}}
@keyframes ui-bg-hexscan{to{transform:translate(20%,-5%)}}
@keyframes ui-bg-caustics{to{transform:translate(4%,5%) scale(1.12,.88) skewX(8deg)}}
@keyframes ui-bg-stardrift{from{transform:translate(50px,35px);opacity:0}20%{opacity:.8}80%{opacity:.6}to{transform:translate(-100px,-70px);opacity:0}}
@keyframes ui-bg-dunes{to{transform:translate(8%,-6%) rotate(-3deg)}}
@keyframes ui-bg-weave{to{transform:translate(3%,2%) rotate(8deg)}}
@keyframes ui-bg-network{to{stroke-dashoffset:-280}}

@keyframes ui-bg-drift{to{transform:translate(8%,12%) rotate(10deg) scale(1.12)}}
@keyframes ui-bg-star{from{opacity:.15}to{opacity:.85}}
@keyframes ui-bg-lanes{to{transform:translate(12%,-12%)}}
@keyframes ui-bg-orbit{to{transform:translate(-12%,18%) rotate(25deg)}}
@keyframes ui-bg-ribbon{to{transform:translate(5%,12%) rotate(5deg)}}
@keyframes ui-bg-clouds{to{transform:translate(15%,-10%) scale(1.2)}}
@keyframes ui-bg-front{to{stroke-dashoffset:-260}}
@keyframes ui-bg-grid{from{transform:rotateX(50deg) translateY(-36px)}to{transform:rotateX(50deg) translateY(0)}}
@keyframes ui-bg-scan{to{transform:translateY(25%)}}
@keyframes ui-bg-ink{to{transform:translate(15%,10%) rotate(40deg) scale(1.18);border-radius:64% 36% 35% 65%}}
@keyframes ui-bg-terrain{to{transform:translate(5%,8%) rotate(18deg) scale(1.08)}}

/* Approved full-surface designs; all motion follows the common pause controls. */
[data-ui-card-background=satin-waves],[data-ui-card-background=isometric-depth],[data-ui-card-background=comet-trails],[data-ui-card-background=lenticular-glow]{background:color-mix(in srgb,var(--ui-bg-1) 12%,transparent)}
:is([data-ui-card-background=satin-waves],[data-ui-card-background=isometric-depth],[data-ui-card-background=comet-trails])>svg{position:absolute;inset:-5%;width:110%;height:110%;fill:var(--ui-bg-1);stroke:none}
:is([data-ui-card-background=satin-waves],[data-ui-card-background=comet-trails])>i,[data-ui-card-background=isometric-depth]>i:not(:first-child){display:none}
[data-ui-card-background=satin-waves]{background:linear-gradient(130deg,color-mix(in srgb,var(--ui-bg-1) 22%,transparent),transparent 70%)}
[data-ui-card-background=satin-waves]>svg{animation:ui-bg-full-drift 32s ease-in-out infinite alternate}
[data-ui-card-background=satin-waves] .ui-bg-satin-seam{fill:none;stroke:color-mix(in srgb,var(--ui-bg-2) 45%,white);stroke-width:1;opacity:.35;animation:ui-bg-satin-light 28s ease-in-out infinite alternate}
[data-ui-card-background=isometric-depth]>i:first-child{inset:-40%;background:linear-gradient(115deg,transparent 25%,var(--ui-bg-2) 50%,transparent 75%);opacity:.14;filter:blur(14px);animation:ui-bg-block-sweep 42s ease-in-out infinite alternate}
[data-ui-card-background=comet-trails] .ui-bg-comet-base,[data-ui-card-background=comet-trails] .ui-bg-comet-stream{fill:none;stroke:var(--ui-bg-1);stroke-linecap:round;stroke-width:1;opacity:.16}
[data-ui-card-background=comet-trails] .ui-bg-comet-stream{stroke:var(--ui-bg-2);stroke-width:3;opacity:.38;stroke-dasharray:45 750}
[data-ui-card-background=comet-trails] .ui-bg-comet-stream path{animation:ui-bg-comet-flow 54s linear infinite}
[data-ui-card-background=lenticular-glow]>i{width:120%;height:150%;border-radius:50%;background:radial-gradient(ellipse,transparent 20%,var(--ui-bg-1) 55%,transparent 69%);filter:blur(5px);opacity:.3;left:-50%;top:-70%;transform:rotate(-25deg);animation:ui-bg-lens-stretch 36s ease-in-out infinite alternate}
[data-ui-card-background=lenticular-glow]>i:nth-child(2){left:25%;top:-5%;transform:rotate(25deg);opacity:.35;background:radial-gradient(ellipse,transparent 20%,var(--ui-bg-2) 55%,transparent 69%);animation-duration:44s;animation-direction:alternate-reverse}
[data-ui-card-background=lenticular-glow]>i:nth-child(3){left:-10%;top:20%;opacity:.18;background:radial-gradient(ellipse,transparent 20%,var(--ui-bg-3) 55%,transparent 69%);animation-duration:48s}
@keyframes ui-bg-full-drift{from{transform:translate(-2px,-2px) scale(1.01)}to{transform:translate(3px,3px) scale(1.025)}}
@keyframes ui-bg-satin-light{from{opacity:.25}to{opacity:.42}}
@keyframes ui-bg-block-sweep{from{transform:translateX(-15%)}to{transform:translateX(15%)}}
@keyframes ui-bg-comet-flow{to{stroke-dashoffset:-795}}
@keyframes ui-bg-lens-stretch{to{transform:translate(3%,2%) rotate(5deg) scale(1.04,.95)}}

[data-ui-card-background][data-animated=false],[data-ui-card-background][data-animated=false] *{animation:none!important}
[data-ui-card-background][data-motion-paused],[data-ui-card-background][data-motion-paused] *{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){[data-ui-card-background],[data-ui-card-background] *{animation:none!important}}
`;}
// Observe a stable card container, so re-rendering its decorative layer is safe.
function observeCardBackgroundMotion(container){
 const doc=container?.ownerDocument;if(!doc)return ()=>{};
 let visible=true;
 const update=()=>{for(const layer of (container.shadowRoot??container).querySelectorAll('[data-ui-card-background]'))layer.toggleAttribute('data-motion-paused',doc.hidden||!visible);};
 const Observer=doc.defaultView?.IntersectionObserver;
 const observer=Observer?new Observer(entries=>{visible=entries.some(entry=>entry.isIntersecting);update();}):null;
 observer?.observe(container);doc.addEventListener('visibilitychange',update);update();
 return ()=>{observer?.disconnect();doc.removeEventListener('visibilitychange',update);};
}



// Retain legacy YAML when the new object is absent. Unsupported legacy designs
// continue to use their original renderer until the user chooses a shared style.
function cardBackgroundSettings(config={}, {preserveNative=false}={}){
 const input=config.card_background;
 if(preserveNative&&input===undefined)return {...normalizeCardBackground({variant:config.background,coverage:'header'}),enabled:config.background!=='none',legacy:true};
 if(input===false)return {...normalizeCardBackground({variant:'isobars',coverage:'header'}),enabled:false,legacy:false};
 if(input&&typeof input==='object'&&!Array.isArray(input))return {...normalizeCardBackground({variant:'isobars',coverage:'header',...input}),enabled:input.enabled!==false,legacy:false};
 const legacy=typeof config.background==='string'&&!CARD_BACKGROUNDS.some(row=>row.value===config.background)&&config.background!=='none';
 const strength=Number(config.background_strength);
 return {...normalizeCardBackground({variant:config.background??'isobars',coverage:'header',transparency:config.background_strength!=null&&Number.isFinite(strength)?100-strength:65,animated:config.animate_background!==false}),enabled:(input===true||typeof config.background==='string')&&config.background!=='none',legacy};
}

const cardBackgroundHostStyles=uiCardBackgroundStyles()+`
[data-ui-background-host] :is(.header-background,.scene-background){display:none!important}
[data-ui-background-host]>[data-ui-card-background]{clip-path:var(--ui-background-graph-clip,inset(0 round var(--ui-background-radius,var(--ha-card-border-radius,12px))))}
`;
const cardBackgroundPlotSelector='.chart,.plot,.history-chart,.graph,.matrix-well,.timeline-well,.timeline-panel,.spark';

// Disjoint horizontal strips represent the exact union, not a bounding box.
// Overlapping nonzero-winding holes would otherwise paint decoration again.
function cardBackgroundCutoutRects(rectangles,box,width,height){
 if(![box.left,box.top,box.width,box.height,width,height].every(Number.isFinite)||box.width<=0||box.height<=0||width<=0||height<=0)return [];
 const scaleX=width/box.width,scaleY=height/box.height;
 const rects=[];
 for(const rect of rectangles){
  if(![rect.left,rect.top,rect.right,rect.bottom].every(Number.isFinite)||rect.right<=rect.left||rect.bottom<=rect.top)continue;
  const left=Math.max(0,Math.floor((rect.left-box.left)*scaleX)),top=Math.max(0,Math.floor((rect.top-box.top)*scaleY));
  const right=Math.min(width,Math.ceil((rect.right-box.left)*scaleX)),bottom=Math.min(height,Math.ceil((rect.bottom-box.top)*scaleY));
  if(right>left&&bottom>top)rects.push({left,top,right,bottom});
 }
 const edges=[...new Set(rects.flatMap(rect=>[rect.top,rect.bottom]))].sort((a,b)=>a-b),result=[];
 for(let i=1;i<edges.length;i++){
  const top=edges[i-1],bottom=edges[i];
  const spans=rects.filter(rect=>rect.top<bottom&&rect.bottom>top).sort((a,b)=>a.left-b.left||a.right-b.right);
  let strip;
  for(const span of spans){
   if(strip&&span.left<=strip.right)strip.right=Math.max(strip.right,span.right);
   else{strip={left:span.left,top,right:span.right,bottom};result.push(strip);}
  }
 }
 return result;
}

// Wrap registrations rather than replacing each card's renderer. The original
// class retains its DOM patching, subscriptions, action handlers and editor.
const withCardBackground=(Base,options={})=>class extends Base{
 static get backgroundBaseCard(){return Base;}
 set hass(hass){this._captureElevenBackgroundPlayback();super.hass=hass;this._syncElevenBackground();}
 get hass(){return super.hass;}
 setConfig(config){
  this._captureElevenBackgroundPlayback();
  super.setConfig(config);
  this._elevenBackgroundConfig={...config};
  this._syncElevenBackground();
 }
 connectedCallback(){
  super.connectedCallback?.();
  this._elevenBackgroundObserver?.disconnect();
  const root=this.shadowRoot;
  if(root&&globalThis.MutationObserver){
   this._elevenBackgroundObserver=new MutationObserver(()=>this._syncElevenBackground());
   // Attribute changes include live status/theme changes in patched card DOM.
   this._elevenBackgroundObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-kind','data-tone','data-state','data-dark','data-theme','data-color']});
  }
  this._syncElevenBackground();
 }
 disconnectedCallback(){
  this._captureElevenBackgroundPlayback();
  this._elevenBackgroundObserver?.disconnect();this._elevenBackgroundObserver=null;
  this._disconnectElevenBackgroundClip();
  this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;
  super.disconnectedCallback?.();
 }
 setCardBackground(background){
  this._elevenBackgroundConfig={...this._elevenBackgroundConfig,card_background:background};this._syncElevenBackground();
 }
 // Capture before native renderers replace their DOM, including timer updates.
 _render(...args){this._captureElevenBackgroundPlayback();const result=super._render?.(...args);this._syncElevenBackground();return result;}
 render(...args){this._captureElevenBackgroundPlayback();const result=super.render?.(...args);this._syncElevenBackground();return result;}
 _captureElevenBackgroundPlayback(){
  const layer=this._elevenBackgroundLayer;if(!layer?.isConnected)return;
  const animations=(layer.getAnimations?.({subtree:true})??[]).filter(animation=>Number.isFinite(animation.currentTime));
  if(!animations.length)return;
  this._elevenBackgroundPlayback={variant:layer.getAttribute('data-ui-card-background'),at:layer.ownerDocument.timeline?.currentTime??0,animations:animations.map(animation=>({name:animation.animationName,time:animation.currentTime,running:animation.playState==='running'}))};
 }
 _restoreElevenBackgroundPlayback(){
  const layer=this._elevenBackgroundLayer,saved=this._elevenBackgroundPlayback;
  if(!saved||!layer||saved.variant!==layer.getAttribute('data-ui-card-background'))return;
  const elapsed=Math.max(0,(layer.ownerDocument.timeline?.currentTime??saved.at)-saved.at),remaining=[...saved.animations];
  for(const animation of layer.getAnimations?.({subtree:true})??[]){
   const index=remaining.findIndex(item=>item.name===animation.animationName);if(index<0)continue;
   const item=remaining.splice(index,1)[0];animation.currentTime=item.time+(item.running?elapsed:0);
  }
 }
 _disconnectElevenBackgroundClip(){
  this._elevenBackgroundResize?.disconnect();this._elevenBackgroundResize=null;this._elevenBackgroundPlots=null;
  this._elevenBackgroundScrollRoot?.removeEventListener('scroll',this._elevenBackgroundScroll,true);
  this._elevenBackgroundScrollRoot=null;this._elevenBackgroundScroll=null;
  if(this._elevenBackgroundClipFrame!=null)globalThis.cancelAnimationFrame?.(this._elevenBackgroundClipFrame);
  this._elevenBackgroundClipFrame=null;
 }
 _syncElevenBackgroundClip(){
  const layer=this._elevenBackgroundLayer,host=layer?.parentElement;
  if(!host){this._disconnectElevenBackgroundClip();return;}
  const root=this.shadowRoot;
  if(this.isConnected&&root&&this._elevenBackgroundScrollRoot!==root){
   this._disconnectElevenBackgroundClip();
   this._elevenBackgroundScrollRoot=root;
   // Scroll does not bubble: capture catches internal Timeline/EVCC scrollers.
   this._elevenBackgroundScroll=()=>{
    if(!this.isConnected||this._elevenBackgroundClipFrame!=null)return;
    if(!globalThis.requestAnimationFrame){this._syncElevenBackgroundClip();return;}
    this._elevenBackgroundClipFrame=requestAnimationFrame(()=>{
     this._elevenBackgroundClipFrame=null;
     if(this.isConnected)this._syncElevenBackgroundClip();
    });
   };
   root.addEventListener('scroll',this._elevenBackgroundScroll,{capture:true,passive:true});
  }
  const candidates=[...host.querySelectorAll(cardBackgroundPlotSelector)];
  // Outermost graph surfaces include axes and prevent nested plots cutting twice.
  const plots=candidates.filter(plot=>!candidates.some(parent=>parent!==plot&&parent.contains(plot)));
  const observed=[host,...plots];
  if(this.isConnected&&globalThis.ResizeObserver&&(!this._elevenBackgroundPlots||observed.some((node,i)=>this._elevenBackgroundPlots[i]!==node)||observed.length!==this._elevenBackgroundPlots.length)){
   this._elevenBackgroundResize?.disconnect();
   this._elevenBackgroundPlots=observed;
   this._elevenBackgroundResize=new ResizeObserver(()=>this._syncElevenBackgroundClip());
   for(const node of observed)this._elevenBackgroundResize.observe(node);
  }
  const box=layer.getBoundingClientRect(),style=getComputedStyle(layer),width=parseFloat(style.width),height=parseFloat(style.height);
  if(!box.width||!box.height||!width||!height)return;
  let path=`M0 0H${width}V${height}H0Z`;
  const holes=cardBackgroundCutoutRects(plots.map(plot=>plot.getBoundingClientRect()),box,width,height);
  for(const {left,top,right,bottom} of holes)path+=`M${left} ${top}V${bottom}H${right}V${top}Z`;
  const clip=holes.length?`path(nonzero, "${path}")`:'';
  if(host.style.getPropertyValue('--ui-background-graph-clip')!==clip){
   if(clip)host.style.setProperty('--ui-background-graph-clip',clip);else host.style.removeProperty('--ui-background-graph-clip');
  }
 }
 _syncElevenBackground(){
  const root=this.shadowRoot,host=root?.querySelector('ha-card');if(!host||!this._elevenBackgroundConfig)return;
  const settings=cardBackgroundSettings(this._elevenBackgroundConfig,options);
  if(settings.legacy){
   host.removeAttribute('data-ui-background-host');
   this._elevenBackgroundLayer?.remove();this._elevenBackgroundLayer=null;
   this._syncElevenBackgroundClip();
   this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;return;
  }
  host.setAttribute('data-ui-background-host','');
  if(!root.querySelector('style[data-ui-background-styles]')){
   const style=document.createElement('style');style.dataset.uiBackgroundStyles='';style.textContent=cardBackgroundHostStyles;root.append(style);
  }
  const hass=this._hass??this.hass,entity=this._elevenBackgroundConfig.entity??this._elevenBackgroundConfig.percentage_entity;
  const unavailable=['unknown','unavailable'].includes(hass?.states?.[entity]?.state);
  const background={...settings,animated:settings.animated&&hass?.connected!==false&&hass?.connection?.connected!==false&&!unavailable};
  // Cards already own their state-to-tone mapping. Read only their computed,
  // hex-valued tone, never configuration or sensor text as a CSS fragment.
  const content=host.querySelector('.content,[data-tone],.room')??host;
  const statusColor=this.cardBackgroundStatusColor?.()??globalThis.getComputedStyle?.(content).getPropertyValue('--tone').trim();
  const signature=JSON.stringify([background,statusColor]);
  if(this._elevenBackgroundLayer?.parentNode===host&&this._elevenBackgroundSignature===signature){
   this._syncElevenBackgroundClip();
   if(this.isConnected&&!this._elevenBackgroundMotion)this._elevenBackgroundMotion=observeCardBackgroundMotion(this);return;
  }
  this._captureElevenBackgroundPlayback();
  this._elevenBackgroundSignature=signature;
  if(!settings.enabled){
   this._elevenBackgroundLayer?.remove();this._elevenBackgroundLayer=null;
   this._syncElevenBackgroundClip();
   this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;return;
  }
  const template=document.createElement('template');template.innerHTML=uiCardBackground(background,{statusColor});
  const next=template.content.firstElementChild,previous=this._elevenBackgroundLayer;
  // Keep the decorative nodes when colours, coverage or native content change.
  const reuse=previous?.getAttribute('data-ui-card-background')===background.variant;
  if(reuse){
   for(const attribute of next.attributes)if(previous.getAttribute(attribute.name)!==attribute.value)previous.setAttribute(attribute.name,attribute.value);
  }else{
   previous?.remove();this._elevenBackgroundLayer=next;
   this._elevenBackgroundMotion?.();this._elevenBackgroundMotion=null;
  }
  if(this._elevenBackgroundLayer.parentNode!==host)host.prepend(this._elevenBackgroundLayer);
  this._syncElevenBackgroundClip();
  this._restoreElevenBackgroundPlayback();
  if(this.isConnected&&!this._elevenBackgroundMotion)this._elevenBackgroundMotion=observeCardBackgroundMotion(this);
 }
 static async getConfigElement(){
  if(!customElements.get('eleven-camera-background-editor-test'))customElements.define('eleven-camera-background-editor-test',ElevenCardBackgroundEditor);
  const editor=document.createElement('eleven-camera-background-editor-test');editor.backgroundOptions=options;
  if(super.getConfigElement)editor.nativeEditor=await super.getConfigElement();
  else if(super.getConfigForm){
   if(!customElements.get('ha-form')&&window.loadCardHelpers){
    const helpers=await window.loadCardHelpers(),entities=await helpers.createCardElement({type:'entities',entities:[]});
    await entities.constructor.getConfigElement();await customElements.whenDefined('ha-form');
   }
   editor.nativeForm=super.getConfigForm();
  }
  return editor;
 }
};

// Hide superseded fields in native forms while keeping all other schema data.
function cardBackgroundEditorSchema(schema){
 if(!Array.isArray(schema))return schema;
 let changed=false;const result=[];
 for(const field of schema){
  if(['background','background_strength','animate_background'].includes(field.name)){changed=true;continue;}
  const children=cardBackgroundEditorSchema(field.schema);
  if(children!==field.schema){result.push({...field,schema:children});changed=true;}else result.push(field);
 }
 return changed?result:schema;
}

class ElevenCardBackgroundEditor extends HTMLElement{
 constructor(){
  super();this.attachShadow({mode:'open'});
  this.shadowRoot.innerHTML=`<style>
:host{display:block;color:var(--primary-text-color);font:inherit}details{border:1px solid var(--divider-color,#ddd);border-radius:8px;margin:0 0 16px}summary{cursor:pointer;min-height:44px;box-sizing:border-box;padding:12px 16px;font-weight:500}.settings{display:grid;gap:12px;padding:0 16px 16px}label{display:flex;flex-direction:column;gap:6px;font-size:14px}label.check{flex-direction:row;align-items:center;min-height:44px}input,select{font:inherit;color:inherit;box-sizing:border-box;max-width:100%;min-height:44px;border:1px solid var(--divider-color,#ddd);border-radius:8px;background:var(--card-background-color,#fff);padding:8px}input[type=checkbox]{min-height:20px;width:20px;height:20px;accent-color:var(--accent-color,var(--primary-color))}input[type=range]{width:100%;accent-color:var(--accent-color,var(--primary-color));padding:0;border:0}input[type=color]{width:64px;padding:4px}.colors{display:flex;gap:8px;flex-wrap:wrap}.help{color:var(--secondary-text-color);font-size:12px;margin:0;line-height:1.5}input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}[hidden]{display:none!important}
</style><details><summary></summary><div class="settings"></div></details><div class="native"></div>`;
  this.shadowRoot.addEventListener('change',event=>this._changeBackground(event));
  this.shadowRoot.addEventListener('config-changed',event=>{
   if(event.target===this)return;
   event.stopPropagation();
   const background=this._config?.card_background;
   // Native editors emit a complete replacement, including deleted fields.
   // Retain only the setting owned by this wrapper, never old native keys.
   this._config={...event.detail.config};
   if(background!==undefined)this._config.card_background=background;
   this._syncNativeBackgroundFields();this._emitBackgroundConfig();
  });
 }
 connectedCallback(){this._observeNativeBackgroundFields();}
 disconnectedCallback(){this._nativeBackgroundObserver?.disconnect();this._nativeBackgroundObserver=null;}
 _observeNativeBackgroundFields(){
  this._nativeBackgroundObserver?.disconnect();
  if(this.isConnected&&this._nativeEditor?.shadowRoot&&globalThis.MutationObserver){
   this._nativeBackgroundObserver=new MutationObserver(()=>this._syncNativeBackgroundFields());
   this._nativeBackgroundObserver.observe(this._nativeEditor.shadowRoot,{childList:true,subtree:true});
  }
  this._syncNativeBackgroundFields();
 }
 _syncNativeBackgroundFields(){
  if(!this._config)return;
  const legacy=cardBackgroundSettings(this._config,this.backgroundOptions).legacy;this._nativeBackgroundSchemas??=new WeakMap();
  const forms=this._nativeEditor?.shadowRoot?.querySelectorAll('ha-form')??[];
  for(const form of [...forms,...(this._nativeEditor?.tagName==='HA-FORM'?[this._nativeEditor]:[])]){
   const saved=this._nativeBackgroundSchemas.get(form);
   if(legacy){if(saved&&form.schema===saved.filtered)form.schema=saved.original;continue;}
   if(saved&&form.schema===saved.filtered)continue;
   const filtered=cardBackgroundEditorSchema(form.schema);
   if(filtered!==form.schema){this._nativeBackgroundSchemas.set(form,{original:form.schema,filtered});form.schema=filtered;}
  }
 }
 set nativeEditor(editor){
  this._nativeEditor=editor;this.shadowRoot.querySelector('.native').replaceChildren(editor);
  // Opt-in placement: keep the shared controls/events in this shadow tree while
  // the card editor slots them into its own Appearance group.
  if(editor.cardBackgroundSlot){
   const section=this.shadowRoot.querySelector('details');section.slot=editor.cardBackgroundSlot;editor.append(section);
   const style=document.createElement('style');style.textContent='details[slot]{border:0;border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));background:var(--secondary-background-color);box-shadow:var(--eleven-material-well,none);margin:0;min-width:0}details[slot]>summary{display:grid;grid-template-columns:10px minmax(0,1fr);gap:10px;align-items:center;list-style:none;min-height:52px;padding:12px;font-size:13px}details[slot]>summary::-webkit-details-marker{display:none}details[slot]>summary::before{content:"";width:7px;height:7px;border-right:2px solid var(--secondary-text-color);border-bottom:2px solid var(--secondary-text-color);transform:rotate(-45deg)}details[slot][open]>summary::before{transform:rotate(45deg)}details[slot]>.settings{padding:0 12px 12px 32px}';this.shadowRoot.append(style);
  }
  if(this._hass)editor.hass=this._hass;if(this._config)editor.setConfig(this._config);this._observeNativeBackgroundFields();
 }
 set nativeForm(form){
  // Cards using Home Assistant's schema-only editor retain all native fields.
  const editor=document.createElement('ha-form');editor.schema=form.schema;editor.computeLabel=form.computeLabel;editor.computeHelper=form.computeHelper;
  editor.setConfig=config=>{editor.data=config;};
  editor.addEventListener('value-changed',event=>{event.stopPropagation();this._config={...this._config,...event.detail.value};this._emitBackgroundConfig();});
  this.nativeEditor=editor;
 }
 setConfig(config){this._config={...config};this._nativeEditor?.setConfig(config);this._renderBackgroundSettings();this._syncNativeBackgroundFields();}
 set hass(hass){const changed=this._language!==String(hass?.locale?.language??hass?.language??'en').slice(0,2);this._hass=hass;this._language=String(hass?.locale?.language??hass?.language??'en').slice(0,2);if(this._nativeEditor)this._nativeEditor.hass=hass;if(changed)this._renderBackgroundSettings();this._syncNativeBackgroundFields();}
 get hass(){return this._hass;}
 _emitBackgroundConfig(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));}
 _renderBackgroundSettings(){
  if(!this._config)return;
  const nl=this._language==='nl',s=cardBackgroundSettings(this._config,this.backgroundOptions),t=(d,e)=>nl?d:e;
  const choices=[...CARD_BACKGROUND_CHOICES];
  if(!s.legacy&&!choices.some(row=>row.value===s.variant))choices.push(CARD_BACKGROUNDS.find(row=>row.value===s.variant));
  this.shadowRoot.querySelector('summary').textContent=t('Kaartachtergrond','Card background');
  const pickerColor=index=>{const color=(s.colors.length?s.colors[index%s.colors.length]:['#4db6ac','#7287ed','#c77dbd'][index]);return color.length<=5?'#'+color.slice(1,4).split('').map(c=>c+c).join(''):color.slice(0,7);};
  const option=(value,label,selected)=>`<option value="${uiEscape(value)}"${selected?' selected':''}>${uiEscape(label)}</option>`;
  this.shadowRoot.querySelector('.settings').innerHTML=`
<label class="check"><input data-bg="enabled" type="checkbox"${s.enabled?' checked':''}>${t('Achtergrond tonen','Show background')}</label>
<label>${t('Weergave','Style')}<select data-bg="variant">${s.legacy?option('legacy',t('Bestaande achtergrond','Existing background'),true):''}${choices.map(row=>option(row.value,row.label,!s.legacy&&s.variant===row.value)).join('')}</select></label>
<label>${t('Kleurbron','Colour source')}<select data-bg="colorMode">${[['accent',t('Home Assistant-accent','Home Assistant accent')],['custom',t('Eigen kleuren','Custom colours')],['dynamic',t('Statuskleur van de kaart','Card status colour')]].map(([v,l])=>option(v,l,s.colorMode===v)).join('')}</select></label>
<div class="colors" data-colors${s.colorMode!=='custom'?' hidden':''}>${[0,1,2].map((i)=>`<label>${t('Kleur','Colour')} ${i+1}<input type="color" data-bg="color-${i}" value="${uiEscape(pickerColor(i))}"></label>`).join('')}</div>
<label>${t('Transparantie','Transparency')} <span><output>${s.transparency}%</output><input data-bg="transparency" type="range" min="0" max="100" value="${s.transparency}"></span></label>
<label>${t('Bereik','Coverage')}<select data-bg="coverage">${option('card',t('Hele kaart','Whole card'),s.coverage==='card')}${option('header',t('Bovenste strook','Top section'),s.coverage==='header')}</select></label>
<label data-height${s.coverage!=='header'?' hidden':''}>${t('Hoogte (px)','Height (px)')}<input data-bg="height" type="number" min="24" max="2000" step="1" value="${s.height}"></label>
<p class="help">${t('De bovenste strook vloeit onderaan zacht uit. Dynamische kleuren volgen de kaartstatus wanneer de kaart die aanbiedt.','The top section fades smoothly at the bottom. Dynamic colours follow the card status when available.')}</p>
<label class="check"><input data-bg="animated" type="checkbox"${s.animated?' checked':''}>${t('Achtergrond animeren','Animate background')}</label>`;
 }
 _changeBackground(event){
  const field=event.target.dataset.bg;if(!field)return;
  const current=cardBackgroundSettings(this._config,this.backgroundOptions),next={...current};delete next.legacy;
  if(field.startsWith('color-'))next.colors=[...this.shadowRoot.querySelectorAll('input[type=color]')].map(input=>input.value);
  else next[field]=event.target.type==='checkbox'?event.target.checked:['height','transparency'].includes(field)?Number(event.target.value):event.target.value;
  if(field==='colorMode'&&next.colorMode==='custom'&&!next.colors.length)next.colors=[...this.shadowRoot.querySelectorAll('input[type=color]')].map(input=>input.value);
  this._config={...this._config,card_background:{...normalizeCardBackground(next),enabled:next.enabled}};
  if(current.legacy){this.shadowRoot.querySelector('option[value=legacy]')?.remove();this.shadowRoot.querySelector('[data-bg=variant]').value=next.variant;}
  if(field==='height')event.target.value=this._config.card_background.height;
  // Update dependent controls without replacing the focused control.
  this.shadowRoot.querySelector('[data-colors]').hidden=next.colorMode!=='custom';
  this.shadowRoot.querySelector('[data-height]').hidden=next.coverage!=='header';
  this.shadowRoot.querySelector('output').textContent=this._config.card_background.transparency+'%';
  this._syncNativeBackgroundFields();this._emitBackgroundConfig();
 }
}

// Configuration and state logic shared by the card, editor and tests.
const CAMERA_LAYOUTS=['grid','tabs','focus','sidebar','filmstrip','wall'];
const cameraEntity=(value,domains)=>typeof value==='string'&&/^[a-z_]+\.[a-z0-9_]+$/.test(value)&&(!domains||domains.includes(value.split('.')[0]));
const cameraNumber=(value,fallback,min,max)=>value==null||value===''||!Number.isFinite(Number(value))?fallback:Math.max(min,Math.min(max,Number(value)));
const cameraSnapshotInterval=value=>{const seconds=cameraNumber(value,0,0,3600);return seconds===0?0:Math.max(5,seconds);};
const cameraText=value=>typeof value==='string'?value:'';
const cameraIcon=value=>typeof value==='string'&&/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(value)?value:'';
function normalizeCameraActions(source=[]){
 if(!Array.isArray(source))return [];
 const used=new Set();return source.filter(row=>row&&typeof row==='object').map((row,index)=>{
  let id=cameraText(row.id)||'action-'+(index+1);while(used.has(id))id+='-copy';used.add(id);
  const data=row.data&&typeof row.data==='object'&&!Array.isArray(row.data)?structuredClone(row.data):{};
  return {id,name:cameraText(row.name),icon:cameraIcon(row.icon)||'mdi:gesture-tap-button',entity:cameraEntity(row.entity)?row.entity:'',camera:cameraEntity(row.camera,['camera'])?row.camera:'',service:typeof row.service==='string'&&/^[a-z_]+\.[a-z0-9_]+$/.test(row.service)?row.service:'',action:['toggle','turn_on','turn_off','press','run','more-info'].includes(row.action)?row.action:'more-info',confirmation:row.confirmation!==false,data};
 });
}
function normalizeCameraFeatures(input,cameras){
 const contacts=source=>Array.isArray(source)?[...new Map(source.map(value=>typeof value==='string'?{entity:value}:value).filter(row=>cameraEntity(row?.entity,['binary_sensor'])).map(row=>[row.entity,{entity:row.entity,name:cameraText(row.name)}])).values()]:[];
 const used=new Set(),profiles=(Array.isArray(input.profiles)?input.profiles:[]).filter(row=>row&&typeof row==='object').map((row,index)=>{
  let id=cameraText(row.id)||'profile-'+(index+1);if(['auto','base'].includes(id))id+='-profile';while(used.has(id))id+='-copy';used.add(id);
  const profile={id,name:cameraText(row.name),entity:cameraEntity(row.entity)?row.entity:'',state:cameraText(row.state),cameras:Array.isArray(row.cameras)?[...new Set(row.cameras.filter(id=>cameras.some(row=>row.entity===id)))]:[]};
  if(CAMERA_LAYOUTS.includes(row.layout))profile.layout=row.layout;
  if(typeof row.auto_cycle==='boolean')profile.auto_cycle=row.auto_cycle;
  if(row.cycle_interval!=null&&row.cycle_interval!=='')profile.cycle_interval=cameraNumber(row.cycle_interval,10,5,3600);
  return profile;
 });
 return {auto_focus:input.auto_focus===true,focus_duration:cameraNumber(input.focus_duration,30,5,600),doorbell_entity:cameraEntity(input.doorbell_entity,['binary_sensor','event','input_button'])?input.doorbell_entity:'',doorbell_camera:cameras.some(row=>row.entity===input.doorbell_camera)?input.doorbell_camera:'',doorbell_secondary_camera:input.doorbell_secondary_camera!==input.doorbell_camera&&cameras.some(row=>row.entity===input.doorbell_secondary_camera)?input.doorbell_secondary_camera:'',doorbell_duration:cameraNumber(input.doorbell_duration,45,5,600),
  alarm_disarm_code:input.alarm_disarm_code!==false,alarm_entity:cameraEntity(input.alarm_entity,['alarm_control_panel'])?input.alarm_entity:'',door_sensors:contacts(input.door_sensors),window_sensors:contacts(input.window_sensors),show_security:input.show_security!==false,show_alarm:typeof input.show_alarm==='boolean'?input.show_alarm:undefined,show_contacts:typeof input.show_contacts==='boolean'?input.show_contacts:undefined,
  profiles,default_profile:profiles.some(row=>row.id===input.default_profile)?input.default_profile:'',
  actions:normalizeCameraActions(input.actions),show_activity:input.show_activity!==false,activity_source:input.activity_source==='history'?'history':'session',activity_hours:cameraNumber(input.activity_hours,24,1,72),activity_page_size:Math.round(cameraNumber(input.activity_page_size??input.activity_limit,10,1,50)),snapshot_interval:cameraSnapshotInterval(input.snapshot_interval)};
}
function effectiveCameraConfig(config,hass,selection='auto'){
 const profile=selection==='base'?null:selection==='auto'?(config.profiles.find(row=>row.entity&&row.state&&!['unknown','unavailable'].includes(hass?.states?.[row.entity]?.state)&&hass?.states?.[row.entity]?.state===row.state)??config.profiles.find(row=>row.id===config.default_profile)):config.profiles.find(row=>row.id===selection);
 if(!profile)return {config,profile:null};
 const cameras=config.cameras.map(row=>({...row,show:row.show!==false&&(!profile.cameras.length||profile.cameras.includes(row.entity))}));
 const next={...config,cameras,layout:profile.layout??config.layout,auto_cycle:profile.auto_cycle??config.auto_cycle,cycle_interval:profile.cycle_interval??config.cycle_interval};
 next.default_camera=cameras.some(row=>row.show!==false&&row.entity===config.default_camera)?config.default_camera:(cameras.find(row=>row.show!==false)?.entity??'');
 return {config:next,profile};
}
const cameraShowAlarm=config=>config.show_alarm??(config.show_security!==false);
const cameraShowContacts=config=>config.show_contacts??(config.show_security!==false);
function cameraActivitySources(config){
 const sources=[];
 for(const row of config.cameras){
  if(row.motion_entity)sources.push({entity:row.motion_entity,camera:row.entity,kind:'motion'});
  if(row.person_entity)sources.push({entity:row.person_entity,camera:row.entity,kind:'person'});
 }
 if(config.doorbell_entity)sources.push({entity:config.doorbell_entity,camera:config.doorbell_camera,kind:'doorbell'});
 for(const row of config.door_sensors??[])sources.push({entity:row.entity,camera:'',kind:'door'});
 for(const row of config.window_sensors??[])sources.push({entity:row.entity,camera:'',kind:'window'});
 return sources;
}
function cameraActivityEvent(source,state,now=Date.now()){
 if(!state||['unknown','unavailable'].includes(state.state))return null;
 const contact=['door','window'].includes(source.kind);
 const timestampSource=source.entity.startsWith('event.')||source.entity.startsWith('input_button.');
 if(!timestampSource&&(contact?!['on','off'].includes(state.state):state.state!=='on'))return null;
 const time=Date.parse(timestampSource?state.state:state.last_changed);
 if(!Number.isFinite(time)||time>now)return null;
 return {...source,...(contact?{state:state.state}:{}),time,id:[source.entity,source.camera,source.kind,time,...(contact?[state.state]:[])].join('|')};
}
// Keep complete minute groups before applying the visible row limit. Raw IDs
// remain available for deduplication against Recorder and direct event actions.
const cameraActivityGroupKey=event=>JSON.stringify([event.entity,event.camera,event.kind,event.state,Math.floor(event.time/60000)]);
function cameraRetainActivity(events,limit=Infinity){
 const groups=new Set();
 return [...new Map(events.map(event=>[event.id,event])).values()].filter(event=>Number.isFinite(event.time)).sort((a,b)=>b.time-a.time).filter(event=>{
  const key=cameraActivityGroupKey(event);
  if(groups.has(key))return true;
  if(groups.size>=limit)return false;
  groups.add(key);return true;
 });
}
class CameraActivity{
 constructor(){this.previous=new Map();this.events=[];this.observed=[];this.lastEvent=new Map();this.lastOpened=new Map();}
 rememberOpenings(events,now=Date.now()){
  for(const event of events)if(['door','window'].includes(event.kind)&&event.state==='on'&&Number.isFinite(event.time)&&event.time<=now&&event.time>(this.lastOpened.get(event.entity)??-Infinity))this.lastOpened.set(event.entity,event.time);
 }
 ingest(config,hass,now=Date.now()){
  if(hass?.connected===false||hass?.connection?.connected===false){this.previous.clear();return [];}
  const sources=cameraActivitySources(config),keys=new Set(),added=[];
  for(const source of sources){
   const key=[source.entity,source.camera,source.kind].join('|');keys.add(key);
   const state=hass?.states?.[source.entity],event=cameraActivityEvent(source,state,now),signature=event?.id??state?.state??'missing',previous=this.previous.get(key);
   this.previous.set(key,signature);
   // First observations and reconnects establish a baseline, never a fresh alert.
   const initialized=previous==='off'||(typeof previous==='string'&&previous.includes('|'));
   const contact=['door','window'].includes(source.kind),changed=!contact||!previous?.endsWith('|'+state?.state);
   if(initialized&&changed&&previous!==signature&&event&&this.lastEvent.get(key)!==event.id)added.push(event);
   if(event){this.lastEvent.set(key,event.id);this.rememberOpenings([event],now);}
  }
  for(const key of this.previous.keys())if(!keys.has(key)){this.previous.delete(key);this.lastEvent.delete(key);}
  const contacts=new Set(sources.filter(source=>['door','window'].includes(source.kind)).map(source=>source.entity));
  for(const entity of this.lastOpened.keys())if(!contacts.has(entity))this.lastOpened.delete(entity);
  this.observed=cameraRetainActivity([...this.observed,...added]);
  this.merge(added);return added;
 }
 merge(events,limit=Infinity){this.rememberOpenings(events);this.events=cameraRetainActivity([...this.events,...events],limit);}
}
function cameraHistoryEvents(response,config,start,end=Date.now()){
 const sources=cameraActivitySources(config),events=[];
 if(!Array.isArray(response))return events;
 for(const series of response){
  if(!Array.isArray(series))continue;
  const entity=series.find(row=>row.entity_id)?.entity_id;
  for(const row of series)for(const source of sources.filter(source=>source.entity===entity)){
   const event=cameraActivityEvent(source,row,end);if(event&&event.time>=start)events.push(event);
  }
 }
 return [...new Map(events.map(event=>[event.id,event])).values()].sort((a,b)=>b.time-a.time);
}
function cameraActionRequest(action,hass){
 if(action.action==='more-info'&&!action.service)return {entity:action.entity};
 let service=action.service;
 if(!service){
  const domain=action.entity.split('.')[0];
  if(action.action==='run'&&domain==='script')service='script.turn_on';
  else if(action.action==='press'&&['button','input_button'].includes(domain))service=domain+'.press';
  else if(['toggle','turn_on','turn_off'].includes(action.action)&&['light','switch','input_boolean','fan','siren','cover','automation'].includes(domain))service=domain+'.'+action.action;
 }
 if(!service)throw Error('Choose an action / Kies een actie');
 const [domain,name]=service.split('.');
 if(!hass?.services?.[domain]?.[name])throw Error('Action unavailable / Actie niet beschikbaar');
 if(action.entity&&(!hass?.states?.[action.entity]||['unavailable','unknown'].includes(hass.states[action.entity].state)))throw Error('Entity unavailable / Entiteit niet beschikbaar');
 return {domain,service:name,data:structuredClone(action.data??{}),target:action.entity?{entity_id:action.entity}:undefined};
}

// Existing YAML remains fail-closed until its owner explicitly removes the mapping.
function cameraPrivacy(hass,row){
 if(!row?.privacy_entity)return null;
 const value=hass?.states?.[row.privacy_entity]?.state;
 if(hass?.connected===false||hass?.connection?.connected===false||!['on','off'].includes(value))return 'privacy_unknown';
 return value===(row.privacy_state??'on')?'privacy':null;
}


// Browsing older pages freezes the rows, not collection of incoming events.
class CameraActivityPages{
 reset(){this.index=0;this.snapshot=null;}
 constructor(){this.reset();}
 view(events,size,{since=0}={}){
  if(this.size!==size){this.reset();this.size=size;}
  const keys=new Set(events.map(cameraActivityGroupKey));
  if(this.snapshot)this.snapshot=this.snapshot.filter(event=>event.time>=since&&keys.has(cameraActivityGroupKey(event)));
  let rows=this.snapshot??events,pages=Math.max(1,Math.ceil(rows.length/size));
  this.index=Math.min(this.index,pages-1);
  if(this.index===0&&this.snapshot){this.reset();rows=events;pages=Math.max(1,Math.ceil(rows.length/size));}
  const baseline=new Map((this.snapshot??[]).map(event=>[cameraActivityGroupKey(event),event]));
  const hasNew=!!this.snapshot&&events.some(event=>{
   const old=baseline.get(cameraActivityGroupKey(event));
   return !old||event.time>old.time||event.count>old.count;
  });
  return {events:rows.slice(this.index*size,(this.index+1)*size),page:this.index+1,pages,hasNew};
 }
 move(step,events,size,options){
  const current=this.view(events,size,options),index=Math.max(0,Math.min(current.pages-1,this.index+step));
  if(index===0)this.reset();
  else{this.snapshot??=events.map(event=>({...event}));this.index=index;}
  return this.view(events,size,options);
 }
}



const CAMERA_COLORS=[{value:'charging',label:'Goud / Gold'},{value:'waiting',label:'Blauw / Blue'},{value:'done',label:'Groen / Green'},{value:'planned',label:'Paars / Purple'},{value:'off',label:'Grijs / Gray'}];
const cameraDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
const CAMERA_RATIOS=['16:9','4:3','1:1','21:9','9:16'];
const visibleCameras=config=>config.cameras.filter(row=>row.show!==false);
function normalizeCameraConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid camera configuration');
 const source=input.cameras??(input.entity?[input.entity]:[]);
 if(!Array.isArray(source))throw Error('Cameras must be a list / Camera’s moeten een lijst zijn');
 const used=new Set(),cameras=source.map(row=>{
  const entity=typeof row==='string'?row:row?.entity;
  if(typeof entity!=='string'||!/^camera\.[a-z0-9_]+$/.test(entity))throw Error('Choose camera entities / Kies camera-entiteiten');
  if(used.has(entity))throw Error('Duplicate camera / Dubbele camera: '+entity);
  used.add(entity);
  const item={entity,name:typeof row?.name==='string'?row.name:''};
  if(row&&typeof row==='object'){
   if(row.show===false)item.show=false;
   // Retain legacy feed protection when editing existing YAML; no privacy controls are exposed.
   if(cameraEntity(row.privacy_entity,['switch','input_boolean','binary_sensor'])){
    item.privacy_entity=row.privacy_entity;
    item.privacy_state=row.privacy_state==='off'?'off':'on';
   }
   if(typeof row.icon==='string'&&/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(row.icon))item.icon=row.icon;
   if(CAMERA_RATIOS.includes(row.aspect_ratio))item.aspect_ratio=row.aspect_ratio;
   if(['cover','contain'].includes(row.fit_mode))item.fit_mode=row.fit_mode;
   if(['auto','live'].includes(row.camera_view))item.camera_view=row.camera_view;
   if(row.snapshot_interval!=null&&row.snapshot_interval!=='')item.snapshot_interval=cameraSnapshotInterval(row.snapshot_interval);
   for(const field of ['motion_entity','person_entity','last_detection_entity']){
    const value=row[field],domain=field==='last_detection_entity'?'sensor':'binary_sensor';
    if(typeof value==='string'&&new RegExp('^'+domain+'\\.[a-z0-9_]+$').test(value))item[field]=value;
   }
  }
  return item;
 });
 const {activity_limit:legacyLimit,background,...settings}=input;
 return {...settings,...normalizeCameraFeatures(input,cameras),cameras,viewer_target:typeof input.viewer_target==='string'?input.viewer_target.trim():'',viewer_id:typeof input.viewer_id==='string'?input.viewer_id.trim():'',title:typeof input.title==='string'?input.title:'',layout:CAMERA_LAYOUTS.includes(input.layout)?input.layout:'grid',
  columns:[1,2,3].includes(Number(input.columns))?Number(input.columns):'auto',camera_view:input.camera_view==='auto'?'auto':'live',
  aspect_ratio:CAMERA_RATIOS.includes(input.aspect_ratio)?input.aspect_ratio:'16:9',fit_mode:input.fit_mode==='contain'?'contain':'cover',
  show_status:input.show_status!==false,show_last_detection:input.show_last_detection!==false,show_navigation:input.show_navigation!==false,show_fullscreen:input.show_fullscreen!==false,
  auto_cycle:input.auto_cycle===true,cycle_interval:Number.isFinite(Number(input.cycle_interval))?Math.max(5,Math.min(3600,Number(input.cycle_interval))):10,
  show_names:input.show_names!==false,compact:(input.compact??(input.density==='compact'))===true,
  color:CAMERA_COLORS.some(item=>item.value===input.color)?input.color:'charging',
  // Absence is meaningful: only an explicit background choice opts into decoration.
  ...(background===undefined?{}:{background:background==='none'||HEADER_BACKGROUNDS.some(item=>item.value===background)?background:'lanes'}),
  background_strength:input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength))),
  animate_background:input.animate_background!==false,
  default_camera:cameras.some(row=>row.show!==false&&row.entity===input.default_camera)?input.default_camera:(cameras.find(row=>row.show!==false)?.entity??'')};
}
function cameraUnavailable(hass,entity){
 if(hass?.connected===false||hass?.connection?.connected===false)return 'offline';
 const state=hass?.states?.[entity];
 if(!state)return 'missing';
 return ['unavailable','unknown','off'].includes(state.state)?state.state:null;
}
function cameraPictureConfig(entity,config){
 const row=config.cameras?.find(row=>row.entity===entity)??{};
 return {type:'picture-entity',entity,camera_view:row.camera_view??config.camera_view,aspect_ratio:row.aspect_ratio??config.aspect_ratio,fit_mode:row.fit_mode??config.fit_mode,
  show_name:false,show_state:false,tap_action:{action:'more-info'},hold_action:{action:'none'},double_tap_action:{action:'none'}};
}

function nextCamera(config,current,direction=1,hass,skipUnavailable=false){
 const rows=visibleCameras(config).filter(row=>!skipUnavailable||!cameraUnavailable(hass,row.entity));
 if(!rows.length)return current;
 const index=rows.findIndex(row=>row.entity===current);
 return rows[index<0?0:(index+direction+rows.length)%rows.length].entity;
}

// Only an ON transition is a detection. An OFF last_changed is its clearing time.
function cameraDetections(hass,row,cache=new Map(),now=Date.now()){
 const valid=value=>{const time=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(time)&&time<=now?time:null;};
 const entries=['motion_entity','person_entity'].filter(field=>row[field]).map(field=>{
  const entity=row[field],state=hass?.states?.[entity],available=hass?.connected!==false&&hass?.connection?.connected!==false&&['on','off'].includes(state?.state);
  if(available&&state.state==='on'){
   const time=valid(state.last_changed);if(time!==null)cache.set(entity,Math.max(cache.get(entity)??0,time));
  }
  return {kind:field==='motion_entity'?'motion':'person',entity,active:available&&state.state==='on',available};
 });
 const times=entries.map(entry=>cache.get(entry.entity)).filter(Number.isFinite);
 const last=row.last_detection_entity?valid(hass?.states?.[row.last_detection_entity]?.state):(times.length?Math.max(...times):null);
 return {entries,last};
}

// Stable across frequent hass updates; only explicit interaction resets the interval.
class CameraCycle{
 constructor(advance,schedule=(callback,ms)=>setInterval(callback,ms),cancel=id=>clearInterval(id)){this.advance=advance;this.schedule=schedule;this.cancel=cancel;}
 sync(enabled,seconds){
  const key=enabled?seconds:0;if(key===this.key)return;this.stop();this.key=key;
  if(enabled)this.timer=this.schedule(this.advance,seconds*1000);
 }
 stop(){if(this.timer!=null)this.cancel(this.timer);this.timer=null;this.key=0;}
}

// Own the native HA card without replacing a running stream on sensor updates.
class CameraPlayer{
 constructor(container,create,onStatus=()=>{}){this.container=container;this.create=create;this.onStatus=onStatus;this.version=0;}
 update(hass,config,active){
  this.hass=hass;
  const signature=JSON.stringify(config);
  if(!active){this.stop();return;}
  if(this.signature!==signature){this.stop();this.signature=signature;}
  if(this.card){this.card.hass=hass;return;}
  if(this.pending||this.failed)return;
  const version=++this.version;this.pending=true;this.onStatus('loading');
  Promise.resolve().then(()=>this.create(config)).then(card=>{
   if(version!==this.version)return;
   if(!card||card.localName==='hui-error-card')throw Error('Camera card unavailable');
   card.hass=this.hass;
   // The enclosing tile clips the top corners; the feed joins its footer square.
   card.style.setProperty('--ha-card-border-width','0px');card.style.setProperty('--ha-card-border-radius','0px');
   this.container.replaceChildren(card);this.card=card;this.onStatus('ready');
  }).catch(()=>{if(version===this.version){this.failed=true;this.onStatus('error');}}).finally(()=>{if(version===this.version)this.pending=false;});
 }
 stop(){this.version++;this.pending=false;this.failed=false;this.signature=null;this.card?.remove();this.card=null;}
 retry(){this.stop();}
}

// Managed still images use HA authentication; URLs/tokens are never configured or persisted.
class CameraSnapshot{
 constructor(container,onStatus=()=>{},onLoaded=()=>{},dependencies={}){
  this.container=container;this.onStatus=onStatus;this.onLoaded=onLoaded;this.version=0;
  this.image=dependencies.image??(()=>new Image());this.url=dependencies.url??URL;this.schedule=dependencies.schedule??((callback,ms)=>setTimeout(callback,ms));this.cancel=dependencies.cancel??(id=>clearTimeout(id));
 }
 update(hass,entity,options,active){
  this.hass=hass;this.options=options;
  if(!active){this.stop();return;}
  if(this.entity!==entity){this.stop();this.entity=entity;}
  this.active=true;
  if(this.picture){this.picture.alt=options.alt;this.picture.style.objectFit=options.fit_mode;}
  if(this.interval!==options.interval){this.interval=options.interval;this._schedule();}
  if(!this.picture&&!this.pending&&!this.failed)this.refresh();
 }
 async refresh(){
  if(!this.active||this.pending)return;
  this.pending=true;this.failed=false;const version=++this.version,controller=new AbortController();this.abort=controller;this.onStatus('loading');
  let nextUrl,picture,rejectAbort;
  const aborted=new Promise((_,reject)=>{rejectAbort=()=>reject(Error('Snapshot aborted'));controller.signal.addEventListener('abort',rejectAbort,{once:true});});
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   if(typeof this.hass?.callApiRaw!=='function')throw Error('HA snapshot API unavailable');
   const response=await Promise.race([this.hass.callApiRaw('GET','camera_proxy/'+this.entity+'?time='+Date.now(),undefined,{'Cache-Control':'no-cache'},controller.signal),aborted]);
   if(!response?.ok)throw Error('Image request failed');
   const blob=await Promise.race([response.blob(),aborted]);if(!blob.type.startsWith('image/'))throw Error('Invalid image response');
   if(version!==this.version)return;
   nextUrl=this.url.createObjectURL(blob);picture=this.image();picture.alt=this.options.alt;picture.style.objectFit=this.options.fit_mode;
   const loaded=new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=()=>reject(Error('Image decode failed'));});
   picture.src=nextUrl;await Promise.race([loaded,aborted]);
   if(version!==this.version)return;
   if(this.options.interactive===false){this.container.replaceChildren(picture);this.button=null;}
   else{const button=document.createElement('button');button.type='button';button.className='camera-snapshot';button.dataset.cameraDetails=this.entity;button.append(picture);this.container.replaceChildren(button);this.button=button;}
   this.picture=picture;
   if(this.currentUrl)this.url.revokeObjectURL(this.currentUrl);this.currentUrl=nextUrl;nextUrl=null;
   this.lastLoaded=Date.now();this.onLoaded(this.lastLoaded);this.onStatus('ready');
  }catch{if(version===this.version){this.failed=true;this.onStatus('error');}}
  finally{clearTimeout(timeout);controller.signal.removeEventListener('abort',rejectAbort);if(picture){picture.onload=null;picture.onerror=null;}if(nextUrl)this.url.revokeObjectURL(nextUrl);if(version===this.version){this.pending=false;this.abort=null;this._schedule();}}
 }
 _schedule(){if(this.timer!=null)this.cancel(this.timer);this.timer=null;if(this.active&&this.interval>0&&!this.pending)this.timer=this.schedule(()=>{this.timer=null;this.refresh();},Math.max(5,this.interval)*1000);}
 stop(){
  this.active=false;this.version++;this.abort?.abort();this.abort=null;this.pending=false;this.failed=false;
  if(this.timer!=null)this.cancel(this.timer);this.timer=null;this.interval=null;this.entity=null;
  if(this.button)this.button.remove();else this.picture?.remove();this.button=null;this.picture=null;if(this.currentUrl)this.url.revokeObjectURL(this.currentUrl);this.currentUrl=null;this.lastLoaded=null;
 }
}


// One authenticated still per camera while the viewer is open; no extra streams.
class CameraViewerPicker{
 constructor(node){this.node=node;this.rows=new Map();}
 update(hass,cameras,options){
  this.options=options;this.node.setAttribute('aria-label',options.t('Camera kiezen','Choose camera'));this.node.hidden=cameras.length<2;
  const visible=new Set(cameras.map(row=>row.entity));
  for(const [entity,item] of this.rows)if(!visible.has(entity)){item.snapshot.stop();item.button.remove();this.rows.delete(entity);}
  cameras.forEach((row,index)=>{
   let item=this.rows.get(row.entity);
   if(!item){
    const button=document.createElement('button');button.type='button';button.dataset.uiButton='action-choice';button.dataset.cameraViewPick=row.entity;
    const image=document.createElement('span');image.className='camera-viewer-thumbnail';image.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='camera-viewer-camera-name';button.append(image,label);
    item={button,image,label,row};item.snapshot=new CameraSnapshot(image,status=>{image.dataset.state=status;if(status==='error')this.fallback(item);});
    this.rows.set(row.entity,item);
   }
   item.row=row;item.label.textContent=options.name(row.entity);item.button.setAttribute('aria-pressed',String(row.entity===options.selected));item.button.setAttribute('aria-label',options.t('Camera openen: ','Open camera: ')+options.name(row.entity));
   if(this.node.children[index]!==item.button)this.node.insertBefore(item.button,this.node.children[index]??null);
  });
  this.sync(hass,options.active);
 }
 fallback(item){
  const existing=item.image.querySelector('ha-icon'),icon=existing??document.createElement('ha-icon');icon.setAttribute('icon','mdi:cctv');if(!existing)item.image.replaceChildren(icon);
 }
 sync(hass,active){
  for(const item of this.rows.values()){
   const enabled=active&&!this.node.hidden&&!this.options.blocked(item.row)&&typeof hass?.callApiRaw==='function';
   item.snapshot.update(hass,item.row.entity,{interval:0,fit_mode:'cover',alt:'',interactive:false},enabled);
   if(!item.snapshot.picture)this.fallback(item);
  }
 }
 stop(){for(const item of this.rows.values()){item.snapshot.stop();this.fallback(item);}}
}

const cameraFeatureStyles=`
.camera-security-header{padding:4px 0 24px}.camera-security-metrics{display:grid;gap:12px;margin-bottom:18px}.camera-primary[data-triggered=true]{--ui-primary-tone:var(--error-color,#db4437)}
.camera-security-tabs{margin-bottom:0}.camera-security-tabs>[data-ui-tab-panel]{padding:16px 0 0}.camera-security-tabs .camera-security{margin-bottom:0}.camera-security{gap:6px}.camera-security h3,.camera-activity h3{font:inherit;font-size:13px;font-weight:600;margin:0}.camera-security p{font-size:12px;color:var(--secondary-text-color)}
.camera-activity-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.camera-activity-heading [data-ui-button]{width:auto;color:var(--primary-color);font-size:12px;padding:4px 8px;border-radius:8px}
.camera-detection-filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:12px}.camera-detection-filters:has(>label[hidden]){grid-template-columns:minmax(0,1fr)}.camera-detection-filters label{display:grid;gap:4px;font-size:11px;color:var(--secondary-text-color);min-width:0}.camera-detection-filters select{width:100%;min-width:0;min-height:36px;padding:6px 8px;border:0;border-radius:8px;font:inherit;font-size:12px;color:var(--primary-text-color);background:var(--secondary-background-color)}.camera-detection-filters select:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
.camera-current-detections{display:grid;gap:6px;margin-bottom:12px}.camera-current-detections h4{font-size:12px;font-weight:500;margin:0 0 2px}.camera-current-detections [data-ui-button]{justify-content:space-between;gap:12px;min-height:40px;border-radius:8px;font-size:11px}.camera-current-detections strong,.camera-current-detections small{display:block;overflow-wrap:anywhere}.camera-current-detections small{color:var(--secondary-text-color)}.camera-current-detections [data-active=true]{border-inline-start:3px solid var(--warning-color,#ff9800)}
.camera-event{display:grid;grid-template-columns:minmax(0,1fr) 32px;gap:6px;align-items:stretch;min-width:0}.camera-event>[data-camera-activity]{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;min-width:0;min-height:52px;padding:8px 10px;text-align:start}.camera-event>[data-camera-details]{width:32px;height:100%;min-height:52px;padding:0;display:grid;place-items:center}.camera-event [data-camera-activity]>span{min-width:0}.camera-event time{display:grid;gap:2px;white-space:nowrap;text-align:end;font-variant-numeric:tabular-nums}.camera-event time>span{font-size:11px;line-height:1.4;color:var(--primary-text-color)}.camera-event time>small{font-size:10px;line-height:1.4;font-weight:400}.camera-event>[data-camera-details] ha-icon{--mdc-icon-size:18px}.camera-current-detections [data-ui-button]{text-align:start}.camera-current-detections [data-ui-button]>span:first-child{min-width:0}.camera-current-detections [data-ui-button]>span:last-child{flex:none;text-align:end}
.camera-tile:not(:fullscreen) .camera-tile-header{position:absolute;inset:0 0 auto;z-index:2;margin:0;padding:8px;gap:4px;background:linear-gradient(#000b,#0008 70%,transparent);color:#fff;flex-wrap:wrap;pointer-events:none}.camera-tile:not(:fullscreen) .camera-tile-header button{pointer-events:auto;color:#fff;text-shadow:0 1px 3px #000}.camera-tile:not(:fullscreen) .camera-name{order:0;flex:1 1 45%;color:#fff;font-size:11px;min-height:32px}.camera-tile:not(:fullscreen) .camera-name ha-icon{display:none}.camera-tile-header:has(.camera-feed-status:not([hidden])){display:flex}.camera-feed-status{order:1;margin-inline-start:auto;font-size:10px;line-height:1.5;text-shadow:0 1px 3px #000;color:inherit}.camera-tile:not(:fullscreen) .camera-tile-header>[data-ui-button]{order:2;flex:none;width:28px;min-height:32px;padding:4px}.camera-tile:fullscreen .camera-tile-header{position:relative;min-height:40px}.camera-tile:fullscreen .camera-frame{padding-top:48px}.camera-tile:fullscreen .camera-tile-header{position:absolute;inset:0 0 auto;z-index:2}
@container(max-width:320px){.camera-primary{--ui-primary-size:46px}.camera-event time{font-size:10px}.camera-detection-filters{grid-template-columns:minmax(0,1fr)}}
.camera-focus-picker [aria-pressed=true]{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--secondary-background-color));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--primary-color) 25%,transparent)}.camera-feature-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px;min-width:0}.camera-profile-label{display:flex;align-items:center;gap:8px;font-size:12px;min-width:0}.camera-profile-label select{font:inherit;color:var(--primary-text-color);background:var(--secondary-background-color);border:0;border-radius:8px;padding:6px 8px;min-height:32px;max-width:220px;min-width:0}.camera-profile-label select:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
.camera-alert-label{font-size:12px;color:var(--primary-text-color);padding:6px 8px;border-radius:8px;background:color-mix(in srgb,var(--warning-color,#ff9800) 15%,var(--ha-card-background,var(--card-background-color,#fff)))}
.camera-feature-toolbar [data-ui-button]{padding:6px 8px;border-radius:8px;color:var(--primary-color)}
[data-ui-tab][data-detection=true]::after,[data-camera-select][data-detection=true]::after{content:'';display:inline-block;width:6px;height:6px;vertical-align:middle;margin-inline-start:7px;border-radius:50%;background:var(--warning-color,#ff9800)}
.camera-tile[data-detection=true] .camera-name ha-icon{color:var(--warning-color,#ff9800)}
.camera-tile-header>[data-ui-button]{border-radius:8px}.camera-tile-header>[data-ui-button] ha-icon{--mdc-icon-size:18px}.camera-name{flex:1}.camera-fullscreen{margin-inline-start:0}
.camera-tile-header:has(.camera-name[hidden]):has(.camera-fullscreen[hidden]):has(>[data-ui-button]:not([hidden])){display:flex}.camera-tile:fullscreen .camera-expand{display:none}
.camera-grid[data-layout=sidebar][data-columns]{grid-template-columns:minmax(0,3fr) minmax(0,1fr);align-items:stretch}.camera-grid[data-layout=sidebar]>.camera-tile[data-primary=true]{grid-column:1;grid-row:1 / span var(--camera-secondary-count,1);display:flex;flex-direction:column}.camera-grid[data-layout=sidebar]>.camera-tile[data-primary=true] .camera-frame{flex:1;min-height:180px}.camera-grid[data-layout=sidebar]>.camera-tile:not([data-primary=true]){grid-column:2}.camera-grid[data-layout=sidebar] .camera-tile-header{flex-wrap:wrap;gap:2px}.camera-grid[data-layout=sidebar]>.camera-tile:not([data-primary=true]) .camera-name{flex-basis:100%}
.camera-grid[data-layout=filmstrip][data-columns]{display:flex;align-items:flex-start;overflow-x:auto;scroll-snap-type:x proximity;padding:2px 2px 8px}.camera-grid[data-layout=filmstrip]>.camera-tile{flex:0 0 min(85%,360px);scroll-snap-align:start}
.camera-grid[data-layout=wall][data-columns]{grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:12px}.camera-grid[data-layout=wall] .camera-tile-header{flex-wrap:wrap;gap:0}.camera-grid[data-layout=wall] .camera-name{flex-basis:100%;font-size:11px}.camera-grid[data-layout=wall] .camera-status{gap:4px}.camera-grid[data-layout=wall] .camera-badge{padding:2px 6px}
.camera-security{display:grid;gap:8px;margin-bottom:16px;min-width:0}.camera-alarm[data-ui-button],.camera-contact[data-ui-button]{display:flex;gap:8px;justify-content:flex-start;border-radius:8px;min-height:36px;padding:8px;font-size:12px}.camera-security ha-icon{--mdc-icon-size:20px;flex:none}.camera-security span{min-width:0;overflow-wrap:anywhere}.camera-security strong{font-weight:600;text-align:end;margin-inline-start:auto;max-width:55%;overflow-wrap:anywhere}.camera-alarm[data-triggered=true],.camera-contact[data-open=true]{box-shadow:inset 3px 0 var(--warning-color,#ff9800),var(--eleven-surface-shadow)}.camera-alarm[data-triggered=true]{box-shadow:inset 3px 0 var(--error-color,#db4437),var(--eleven-surface-shadow)}
.camera-contacts summary,.camera-activity summary{font-size:12px;cursor:pointer;min-height:32px;padding:6px 0;color:var(--secondary-text-color);overflow-wrap:anywhere}.camera-contacts>div{display:grid;gap:6px;margin-top:4px}.camera-contacts summary:focus-visible,.camera-activity summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:8px}
.camera-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.camera-actions [data-ui-button]{width:auto;gap:8px;justify-content:flex-start;border-radius:8px;max-width:100%;min-height:36px}.camera-actions ha-icon{--mdc-icon-size:18px}.camera-actions span{overflow-wrap:anywhere}
.camera-activity{margin-top:0}.camera-activity-source,.camera-history-status,.camera-activity-list>p{font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:4px 0 8px}.camera-activity-list{display:grid;gap:6px}.camera-activity-list [data-ui-button]{align-items:center;border-radius:8px;gap:12px;min-height:40px}.camera-activity-list strong{display:block;font-size:12px;font-weight:600;overflow-wrap:anywhere}.camera-activity-list small{display:block;font-size:11px;color:var(--secondary-text-color)}.camera-activity-list time{font-size:11px;font-variant-numeric:tabular-nums;text-align:end;flex:none}.camera-activity [data-camera-history-refresh]{color:var(--primary-color);padding:4px 8px;border-radius:8px}
.camera-snapshot{display:block;width:100%;height:100%;padding:0;border:0;background:transparent;cursor:pointer}.camera-snapshot img{display:block;width:100%;height:100%;object-fit:cover}.camera-snapshot:focus-visible{outline:2px solid var(--primary-color);outline-offset:-3px}.camera-snapshot-time{font-size:11px;line-height:1.5;margin:8px 0 0;color:var(--secondary-text-color)}
.camera-activity-list .camera-event>[data-camera-activity]{min-height:56px;padding:10px 12px;align-items:start;column-gap:12px}
.camera-event [data-camera-activity]>span,.camera-event time{display:grid;gap:2px;align-content:start}
.camera-activity-list .camera-event strong,.camera-activity-list .camera-event small,.camera-event time>span,.camera-event time>small{line-height:16px}
.camera-activity-list .camera-event>[data-camera-details]{min-height:56px;align-self:stretch}
.camera-event>[data-camera-details] ha-icon{display:block;width:18px;height:18px}
.camera-activity-list{gap:14px}.camera-activity-day{min-width:0}.camera-activity-day h4{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 6px;font-size:11px;line-height:16px;font-weight:600}.camera-activity-day h4 small{font-size:10px;font-weight:400;color:var(--secondary-text-color)}.camera-activity-day>div{display:grid}.camera-activity-day .camera-event{position:relative;grid-template-columns:minmax(0,1fr);gap:0}.camera-activity-list .camera-timeline-open[data-ui-button]{display:grid;grid-template-columns:38px 22px minmax(0,1fr);align-items:start;gap:8px;min-height:52px;padding:6px 4px 6px 0;border:0;border-radius:0;background:none;box-shadow:none;text-align:start}.camera-timeline-open time{align-self:start;text-align:start;font-size:10px;line-height:16px}.camera-event-symbol{display:grid;place-items:center;position:relative;z-index:1;width:22px;height:22px;border:1px solid var(--divider-color);border-radius:50%;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--secondary-text-color)}.camera-event-symbol ha-icon{--mdc-icon-size:14px}.camera-event-symbol[data-kind=person]{color:var(--primary-color)}.camera-timeline-open .camera-event-description{display:grid;gap:1px;min-width:0;align-content:start}.camera-event-description strong{font-size:12px;font-weight:500;line-height:16px}.camera-event-description small{font-size:11px;line-height:16px}.camera-activity-day .camera-event:before{content:'';position:absolute;left:57px;top:17px;bottom:-17px;border-left:1px solid var(--divider-color);pointer-events:none}.camera-activity-day .camera-event:last-child:before{display:none}.camera-activity-day .camera-event>[data-camera-details]{width:26px;min-width:26px;min-height:52px;height:auto;padding:4px;border:0;border-radius:0;box-shadow:none;background:none;color:var(--secondary-text-color)}.camera-activity-day .camera-event>[data-camera-details] ha-icon{--mdc-icon-size:16px}.camera-activity-day .camera-event button:not(:disabled):hover{background:color-mix(in srgb,var(--primary-color) 5%,transparent)}.camera-activity-source{margin:0 0 10px}.camera-history-status:empty{display:none}.camera-current-detections{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.camera-current-detections h4{flex-basis:100%;font-size:11px;font-weight:500;margin:0;color:var(--secondary-text-color)}.camera-current-detections [data-ui-button]{width:auto;min-height:34px;padding:5px 8px;gap:10px;box-shadow:none}.camera-current-detections strong{font-size:11px}.camera-current-detections small,.camera-current-detections [data-ui-button]>span:last-child{font-size:10px}
@container(max-width:340px){.camera-activity-list .camera-timeline-open[data-ui-button]{grid-template-columns:36px 20px minmax(0,1fr);gap:6px}.camera-event-symbol{width:20px;height:20px}.camera-activity-day .camera-event:before{left:52px}.camera-event-description strong{font-size:11px}.camera-event-description small{font-size:10px}.camera-activity-day .camera-event>[data-camera-details]{width:24px;min-width:24px}}
.camera-confirm{color:var(--primary-text-color,#20252b);background:var(--ha-card-background,var(--card-background-color,#fff));border:1px solid var(--divider-color,#ddd);border-radius:8px;padding:20px;width:min(420px,calc(100vw - 32px));box-shadow:var(--eleven-surface-shadow)}.camera-confirm::backdrop{background:#0006}.camera-confirm h3{font:inherit;font-size:16px;font-weight:600;margin:0 0 12px}.camera-confirm p{font-size:14px;line-height:1.5;overflow-wrap:anywhere;margin:0 0 20px}.camera-confirm>div{display:flex;justify-content:flex-end;gap:12px}.camera-confirm [data-ui-button]{width:auto;min-height:36px;padding:6px 12px;border-radius:8px;color:var(--primary-color)}
@container(max-width:600px){.camera-grid[data-layout=sidebar][data-columns]{grid-template-columns:minmax(0,1fr)}.camera-grid[data-layout=sidebar]>.camera-tile[data-primary=true]{grid-row:auto;grid-column:auto;order:-1}.camera-grid[data-layout=sidebar]>.camera-tile:not([data-primary=true]){grid-column:auto}.camera-grid[data-layout=sidebar]>.camera-tile[data-primary=true] .camera-frame{min-height:0;flex:auto}.camera-grid[data-layout=sidebar]>.camera-tile:not([data-primary=true]) .camera-name{flex-basis:auto}}
`;


// One visual group for all armed modes and one for all transition states.
function securityStatusGroup(state){
 if(['armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass'].includes(state))return 'armed';
 if(['arming','disarming','pending'].includes(state))return 'transition';
 return state==='disarmed'?'disarmed':state==='triggered'?'triggered':'unknown';
}
function cameraSecurityStatus(config={},hass){
 if(!config.alarm_entity||!cameraShowAlarm(config))return 'camera';
 if(hass?.connected===false||hass?.connection?.connected===false)return 'unknown';
 return securityStatusGroup(hass?.states?.[config.alarm_entity]?.state);
}
function cameraSecurityStatusColor(config,hass){
 const colors={disarmed:['#748b9d','#a2b9cb'],armed:['#39856d','#8cd6b7'],transition:['#ac843a','#e8c477'],unknown:['#7d8797','#a6b0c0'],triggered:['#ba5f5b','#ed9690'],camera:['#748b9d','#a2b9cb']};
 return colors[cameraSecurityStatus(config,hass)][hass?.themes?.darkMode?1:0];
}

// Classic Weather-style security artwork. Only fixed shapes and validated colours enter SVG.

let sequence=0;
const SECURITY_ART_KINDS=['disarmed','armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass','arming','disarming','pending','triggered','unknown','camera'];
function securityArt(state,color){
 const kind=SECURITY_ART_KINDS.includes(state)?state:'unknown';
 const group=kind==='camera'?'camera':securityStatusGroup(kind);
 color=/^#[0-9a-f]{6}$/i.test(color??'')?color:({disarmed:'#a2b9cb',armed:'#8cd6b7',transition:'#e8c477',unknown:'#a6b0c0',triggered:'#ed9690',camera:'#a2b9cb'}[group]);
 const id='security-weather-'+(++sequence),paint=name=>`url(#${id}-${name})`;
 const shell=paint('shell'),tone=paint('tone'),gold=paint('gold');
 const shield=`<path d="m80 28 39 16v34c0 26-22 43-39 51-17-8-39-25-39-51V44Z" fill="${tone}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="m52 50 26-11" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>`;
 const lock=(open=false)=>`<path d="M59 74V57a21 21 0 0 1 42 0${open?'':'v17'}" fill="none" stroke="${tone}" stroke-width="11" stroke-linecap="round"${open?' transform="rotate(18 59 74)"':''}/><rect x="47" y="72" width="66" height="49" rx="11" fill="${shell}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="M57 84h35" stroke="#fff" stroke-width="2" stroke-opacity=".5" stroke-linecap="round"/><circle cx="80" cy="93" r="5" fill="#526e89"/><path d="M80 96v10" stroke="#526e89" stroke-width="4" stroke-linecap="round"/>`;
 const clock=`<circle cx="108" cy="108" r="24" fill="${gold}" stroke="#ffe5a3" stroke-width="1.5"/><path d="M108 93v16l10 6" fill="none" stroke="#8c642f" stroke-width="3" stroke-linecap="round"/>`;
 const camera=`<rect x="32" y="52" width="90" height="65" rx="14" fill="${shell}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="M48 52v-9h29l8 9" fill="${tone}"/><path d="M44 63h29" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><circle cx="78" cy="85" r="23" fill="${tone}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="78" cy="85" r="13" fill="#476b87"/><path d="M71 81a8 8 0 0 1 11-3" stroke="#dff5ff" stroke-width="2" stroke-linecap="round"/>`;
 const objects={
  disarmed:lock(true),
  armed:shield+'<path d="m60 78 14 14 29-34" stroke="#f2f9ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  transition:shield+clock,
  triggered:`<path d="M46 112V77a34 34 0 0 1 68 0v35" fill="${tone}" stroke="#ffd5d1" stroke-width="1.5"/><rect x="36" y="108" width="88" height="16" rx="7" fill="${shell}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="M58 75a22 22 0 0 1 20-20" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity=".45"/><path d="M80 20v10M29 44l9 7m93-7-9 7M19 83h11m111 0h-11" stroke="#ef9b94" stroke-width="3" stroke-linecap="round"/>`,
  unknown:'<circle cx="80" cy="70" r="34" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 8"/><path d="M70 58c0-16 25-16 25 0 0 11-15 9-15 20m0 10v3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  camera
 };
 return `<svg class="security-art" data-security-art="${kind}" data-security-group="${group}" style="color:${color}" viewBox="0 0 160 150" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-shell" x2=".2" y2="1"><stop stop-color="#f8fbff"/><stop offset=".5" stop-color="#c8d9ea"/><stop offset="1" stop-color="#91aac2"/></linearGradient><linearGradient id="${id}-tone" x2=".3" y2="1"><stop stop-color="#f0f6ff"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".7"/></linearGradient><linearGradient id="${id}-gold" x2=".3" y2="1"><stop stop-color="#fff0b4"/><stop offset=".5" stop-color="#f6ce6d"/><stop offset="1" stop-color="#eda743"/></linearGradient></defs><g class="security-art-body">${objects[group]}</g></svg>`;
}

const securityArtStyles=`
.camera-security-header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:160px;position:relative;padding:0 0 16px}
.camera-primary{min-width:0;max-width:60%;position:relative;z-index:1;--ui-primary-size:48px}
.camera-security-art{display:grid;place-items:center;flex:0 0 94px;min-width:0;pointer-events:none}
.camera-security-art svg{display:block;width:94px;height:88px;max-width:100%;overflow:visible;filter:drop-shadow(0 2px 3px #1025360a);opacity:.92}
.content[data-animated=true] .security-art-body{animation:security-art-float 7s ease-in-out infinite;transform-origin:80px 80px}
@keyframes security-art-float{50%{transform:translateY(-3px)}}
@container(max-width:320px){.camera-security-header{min-height:136px}.camera-primary{--ui-primary-size:38px}.camera-security-art svg{height:70px;width:74px}}
.content[data-compact=true] .camera-security-header{min-height:112px}.content[data-compact=true] .camera-security-art svg{width:94px;height:88px}
:host([data-motion-paused]) .security-art-body{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.security-art-body{animation:none!important}}
`;


// HA alarm_control_panel feature bits; trigger is an action, not an armed mode.
const CAMERA_ALARM_MODES=[
 {value:'disarmed',service:'alarm_disarm',icon:'mdi:shield-off-outline',nl:'Uit',en:'Off'},
 {value:'armed_home',feature:1,service:'alarm_arm_home',icon:'mdi:home-outline',nl:'Thuis',en:'Home'},
 {value:'armed_away',feature:2,service:'alarm_arm_away',icon:'mdi:shield-check-outline',nl:'Afwezig',en:'Away'},
 {value:'armed_night',feature:4,service:'alarm_arm_night',icon:'mdi:weather-night',nl:'Nacht',en:'Night'},
 {value:'armed_vacation',feature:32,service:'alarm_arm_vacation',icon:'mdi:airplane',nl:'Vakantie',en:'Vacation'},
 {value:'armed_custom_bypass',feature:16,service:'alarm_arm_custom_bypass',icon:'mdi:shield-outline',nl:'Aangepast',en:'Custom'}
];
function cameraAlarmModes(state){return CAMERA_ALARM_MODES.filter(mode=>!mode.feature||((Number(state?.attributes?.supported_features)||0)&mode.feature)!==0);}
function cameraAlarmAvailable(hass,entity){return !!hass?.states?.[entity]&&!['unknown','unavailable'].includes(hass.states[entity].state)&&hass.connected!==false&&hass.connection?.connected!==false;}
function cameraAlarmNeedsNative(state,mode){return mode!=='disarmed'&&state?.attributes?.code_arm_required===true;}
function cameraAlarmNeedsCode(state,mode,disarmCode=true){return mode==='disarmed'&&disarmCode&&['number','text'].includes(state?.attributes?.code_format);}
function cameraAlarmRequest(hass,entity,mode,code='',disarmCode=true){
 if(!entity?.startsWith('alarm_control_panel.')||!cameraAlarmAvailable(hass,entity))throw Error('unavailable');
 const state=hass.states[entity],target=cameraAlarmModes(state).find(row=>row.value===mode);
 if(!target)throw Error('unsupported');
 if(mode===state.state)throw Error('unchanged');
 if(cameraAlarmNeedsNative(state,mode))throw Error('native');
 const data={entity_id:entity};
 if(cameraAlarmNeedsCode(state,mode,disarmCode)){
  if(!code||(state.attributes.code_format==='number'&&!/^\d+$/.test(code)))throw Error('code');
  data.code=code;
 }
 return {domain:'alarm_control_panel',service:target.service,data};
}

class CameraAlarmControls{
 constructor(node){this.node=node;this.selected=null;this.version=0;this.error='';this.pending=null;}
 disconnect(){this.version++;clearTimeout(this.timer);this.pending=null;const input=this.node.querySelector('input');if(input)input.value='';this.markup=null;}
 update(hass,entity,t,disarmCode=true){
  if(this.entity!==entity){this.disconnect();this.entity=entity;this.selected=null;this.error='';this.state=null;}
  if(this.disarmCode!==disarmCode){this.disconnect();this.disarmCode=disarmCode;}
  this.hass=hass;this.t=t;
  const state=hass?.states?.[entity],available=cameraAlarmAvailable(hass,entity),requested=this.pending?.mode;
  if(!available){if(this.pending)this.disconnect();this.error='';}
  if(this.pending&&(state?.state!==this.pending.from||!cameraAlarmModes(state).some(mode=>mode.value===this.pending.mode))){this.pending=null;clearTimeout(this.timer);this.version++;}
  if(this.state!==state?.state){this.selected=cameraAlarmModes(state).some(mode=>mode.value===state?.state)?state.state:requested??this.selected??'disarmed';this.error='';}
  this.state=state?.state;
  if(!cameraAlarmModes(state).some(mode=>mode.value===this.selected))this.selected='disarmed';
  this.render();
 }
 openNative(){const input=this.node.querySelector('input');if(input)input.value='';if(cameraAlarmAvailable(this.hass,this.entity)&&!this.pending)this.node.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:this.entity},bubbles:true,composed:true}));}
 pressKey(key){
  const input=this.node.querySelector('input'),state=this.hass?.states?.[this.entity];
  if(!input||input.disabled||this.pending||!cameraAlarmAvailable(this.hass,this.entity)||state?.attributes?.code_format!=='number'||!cameraAlarmNeedsCode(state,this.selected,this.disarmCode))return;
  const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
  if(key==='clear'){input.value='';input.setSelectionRange(0,0);}
  else if(key==='backspace'){input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');}
  else if(/^\d$/.test(key))input.setRangeText(key,start,end,'end');
 }
 render(){
  const node=this.node,t=this.t,state=this.hass?.states?.[this.entity],available=cameraAlarmAvailable(this.hass,this.entity),modes=cameraAlarmModes(state),busy=!!this.pending;
  node.hidden=!this.entity;node.inert=!available;node.dataset.available=String(available);node.setAttribute('aria-label',t('Alarmbediening','Alarm controls'));node.setAttribute('aria-disabled',String(!available));
  if(!this.entity)return;
  const current=CAMERA_ALARM_MODES.find(mode=>mode.value===state?.state),other={arming:t('Inschakelen…','Arming…'),disarming:t('Uitschakelen…','Disarming…'),pending:t('Vertraging actief','Delay active'),triggered:t('Alarm geactiveerd','Alarm triggered')};
  const status=!available?t('Alarm niet beschikbaar','Alarm unavailable'):current?t(current.nl,current.en):other[state?.state]??t('Alarmstatus onbekend','Alarm status unknown');
  const same=state?.state===this.selected,needsCode=cameraAlarmNeedsCode(state,this.selected,this.disarmCode),canSubmit=available&&!busy&&!same&&typeof this.hass?.callService==='function';
  const nativeArming=cameraAlarmNeedsNative(state,'armed_away')&&modes.some(mode=>mode.feature);
  const nativeHint=nativeArming?`<div class="camera-alarm-native"><p>${t('Dit alarm vereist een code bij inschakelen. Kies de stand in Home Assistant.','This alarm requires a code to arm. Choose the mode in Home Assistant.')}</p><button type="button" data-ui-button="action" data-alarm-native ${!available||busy?'disabled':''}>${t('Alarmbediening openen','Open alarm controls')}</button></div>`:'';
  const numeric=state?.attributes?.code_format==='number';
  const keypad=needsCode&&!same&&numeric?'<div class="camera-alarm-keypad" role="group" aria-label="'+t('Pincode invoeren','Enter PIN')+'">'+['1','2','3','4','5','6','7','8','9','clear','0','backspace'].map(key=>'<button type="button" data-ui-button="action" data-alarm-key="'+key+'" '+(!canSubmit?'disabled':'')+' aria-label="'+(key==='clear'?t('Code wissen','Clear code'):key==='backspace'?t('Laatste cijfer verwijderen','Delete last digit'):key)+'">'+(key==='clear'?'<span>'+t('Wissen','Clear')+'</span>':key==='backspace'?'<ha-icon icon="mdi:backspace-outline" aria-hidden="true"></ha-icon>':key)+'</button>').join('')+'</div>':'';
  const markup=`<form class="camera-alarm-form"><div class="camera-alarm-status"><span>${t('Alarm','Alarm')}</span><strong role="status">${uiEscape(status)}</strong></div><div class="camera-alarm-modes" role="group" aria-label="${t('Alarmstand kiezen','Choose alarm mode')}" style="--alarm-columns:${Math.min(modes.length,3)}">${modes.map(mode=>`<button type="button" data-ui-button="action-choice" data-alarm-mode="${mode.value}" aria-pressed="${this.selected===mode.value}" ${!available||busy?'disabled':''}><ha-icon icon="${mode.icon}" aria-hidden="true"></ha-icon><span>${t(mode.nl,mode.en)}</span></button>`).join('')}</div>${nativeHint}${needsCode&&!same?`<label class="camera-alarm-code">${t('Pincode','Code')}<input type="password" name="alarm_code" autocomplete="off" ${state.attributes.code_format==='number'?'inputmode="none" pattern="[0-9]+"':'inputmode="text"'} required ${!canSubmit?'disabled':''}></label>`:''}${keypad}${needsCode&&!same?`<button type="submit" data-ui-button="action" class="camera-alarm-submit" ${!canSubmit?'disabled':''}><ha-icon icon="mdi:shield-off-outline" aria-hidden="true"></ha-icon><span>${busy?t('Opdracht verstuurd\u2026','Command sent\u2026'):t('Uitschakelen','Disarm')}</span></button>`:''}${busy?`<p class="camera-alarm-pending" role="status">${t('Wachten op alarmstatus\u2026','Waiting for alarm state\u2026')}</p>`:''}<p class="camera-alarm-feedback" role="status">${uiEscape(this.error)}</p></form>`;
  if(this.markup===markup)return;
  const focused=node.getRootNode().activeElement,focus=focused&&node.contains(focused)?focused.dataset.alarmMode??(focused.name==='alarm_code'?'code':focused.dataset.alarmKey?'key:'+focused.dataset.alarmKey:focused.type==='submit'?'submit':null):null;
  const previousInput=node.querySelector('input');if(previousInput)previousInput.value='';
  this.markup=markup;node.innerHTML=markup;
  node.querySelectorAll('[data-alarm-mode]').forEach(button=>button.onclick=()=>{if(!cameraAlarmAvailable(this.hass,this.entity)||this.pending)return;const mode=button.dataset.alarmMode;if(mode!==this.state&&cameraAlarmNeedsNative(this.hass.states[this.entity],mode)){this.openNative();return;}this.selected=mode;this.error='';this.render();if(this.selected===this.state)return;if(cameraAlarmNeedsCode(this.hass.states[this.entity],this.selected,this.disarmCode))this.node.querySelector('input')?.focus();else this.submit();});
  const nativeButton=node.querySelector('[data-alarm-native]');if(nativeButton)nativeButton.onclick=()=>this.openNative();
  node.querySelector('form').onsubmit=event=>{event.preventDefault();this.submit();};
  node.querySelectorAll('[data-alarm-key]').forEach(button=>button.onclick=()=>this.pressKey(button.dataset.alarmKey));
  if(focus){const next=focus==='code'?node.querySelector('input'):focus==='submit'?node.querySelector('[type="submit"]'):focus.startsWith('key:')?node.querySelector('[data-alarm-key="'+focus.slice(4)+'"]'):node.querySelector(`[data-alarm-mode="${focus}"]`);next?.focus({preventScroll:true});}
 }
 async submit(){
  if(this.pending||typeof this.hass?.callService!=='function')return;
  if(cameraAlarmNeedsNative(this.hass?.states?.[this.entity],this.selected)){this.openNative();return;}
  const input=this.node.querySelector('input');let request;
  try{request=cameraAlarmRequest(this.hass,this.entity,this.selected,input?.value??'',this.disarmCode);}
  catch(error){this.error=error.message==='code'?this.t('Vul een geldige pincode in.','Enter a valid code.'):this.t('Deze alarmstand is niet beschikbaar.','This alarm mode is unavailable.');this.render();return;}
  if(input)input.value='';
  const version=++this.version;this.pending={from:this.state,mode:this.selected};this.error='';this.render();
  // A resolved service call is not proof of a changed alarm state. Wait for HA.
  this.timer=setTimeout(()=>{if(this.version!==version||!this.pending)return;this.pending=null;this.error=this.t('Nog geen statuswijziging ontvangen. Controleer het alarm of probeer opnieuw.','No state change received yet. Check the alarm or try again.');this.render();},15000);
  try{await this.hass.callService(request.domain,request.service,request.data);}
  catch{if(this.version!==version)return;clearTimeout(this.timer);this.pending=null;this.error=this.t('Alarmopdracht mislukt. Controleer de code en je rechten en probeer opnieuw.','Alarm command failed. Check the code and your permissions and try again.');this.render();}
 }
}

const cameraAlarmStyles=`
.camera-alarm-native{display:grid;gap:8px;margin-top:10px}.camera-alarm-native p{margin:0;color:var(--secondary-text-color);font-size:12px;line-height:1.5}.camera-alarm-native button{justify-self:start}.camera-alarm-form{padding:8px}.camera-alarm-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.camera-alarm-controls[data-available=false] .camera-alarm-status{position:static;width:auto;height:auto;margin:0 0 8px;clip-path:none;white-space:normal}.camera-alarm-status>span{font-size:11px;color:var(--secondary-text-color)}.camera-alarm-status strong{font-size:12px;font-weight:500;text-align:end;overflow-wrap:anywhere}.camera-alarm-modes{display:grid;grid-template-columns:repeat(var(--alarm-columns,3),minmax(0,1fr));gap:6px;padding:0;margin-bottom:0;border-radius:7px}.camera-alarm-modes button{display:flex;align-items:center;justify-content:center;gap:5px;min-width:0;min-height:44px;padding:6px 3px;border:1px solid var(--divider-color);border-radius:6px;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);font:inherit;font-size:11px;cursor:pointer}.camera-alarm-modes button[aria-pressed=true]{background:color-mix(in srgb,var(--primary-color) 24%,var(--ha-card-background,var(--card-background-color,#fff)));border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);color:var(--primary-text-color);font-weight:700}.camera-alarm-modes button:not(:disabled):hover{border-color:var(--primary-color)}.camera-alarm-modes ha-icon{--mdc-icon-size:17px;flex:none}.camera-alarm-submit{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;width:100%;padding:8px;border:1px solid var(--primary-color);border-radius:7px;background:color-mix(in srgb,var(--primary-color) 16%,var(--ha-card-background,var(--card-background-color,#fff)));color:var(--primary-color);font:inherit;font-size:12px;font-weight:600;cursor:pointer}.camera-alarm-submit ha-icon{--mdc-icon-size:19px}.camera-alarm-form button:disabled{opacity:.45;cursor:default}.camera-alarm-form button:focus-visible,.camera-alarm-code input:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.camera-alarm-code{display:grid;gap:6px;font-size:11px;margin:0 0 10px;color:var(--secondary-text-color)}.camera-alarm-code input{width:100%;min-width:0;min-height:44px;box-sizing:border-box;padding:8px 10px;border:1px solid var(--divider-color);border-radius:6px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}.camera-alarm-feedback{font-size:11px;line-height:1.5;color:var(--error-color,#b34545);margin:10px 0 0}.camera-alarm-feedback:empty{display:none}.camera-alarm-pending{font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:8px 0 0}.camera-alarm-modes{margin-bottom:0}.camera-alarm-code{margin-top:10px}
@container(max-width:340px){.camera-alarm-modes button{flex-direction:column;gap:4px}.camera-alarm-status{gap:6px}.camera-alarm-status strong{font-size:11px}}
@media(forced-colors:active){.camera-alarm-modes button[aria-pressed=true]{border-color:Highlight}.camera-alarm-submit{border-color:ButtonText}}
`;





// Opt in only this card: the active HA theme owns paint and depth. The camera
// footer and timeline are compact identity rows, not ordinary action buttons.
const cameraThemeStyles=`
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

// A shared grid for every event. The rail follows row height, including wrapped
// names, and the symbol centre aligns with the first line of the description.
const cameraActivityStyles=`
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













const cameraStyles=`
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




class CameraEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._rows=new Map();this._contactRows=new Map();}
 get cardBackgroundSlot(){return 'card-background';}
 setConfig(config){this._config=normalizeCameraConfig(config);this._render();}
 set hass(value){this._hass=value;this._render();}get hass(){return this._hass;}
 _save(input){
  const next={...input};
  for(const [field,key] of [['camera_entities','cameras'],['door_entities','door_sensors'],['window_entities','window_sensors']]){
   if(Array.isArray(next[field]))next[key]=next[field].map(entity=>this._config[key].find(row=>row.entity===entity)??{entity});delete next[field];
  }
  this._config=normalizeCameraConfig(next);this._render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));
 }
 _group(parent,key,title,summary='',nested=false){
  let node=[...parent.children].find(node=>node.dataset?.group===key);
  if(!node){node=document.createElement('details');node.dataset.group=key;node.className=nested?'subsection':'section';node.innerHTML='<summary><span></span><small></small></summary><div class="group-body"></div>';parent.append(node);if(key==='cameras')node.open=true;}
  node.querySelector(':scope > summary > span').textContent=title;node.querySelector(':scope > summary > small').textContent=summary;node.querySelector(':scope > summary > small').hidden=!summary;
  return node.querySelector(':scope > .group-body');
 }
 _formAt(parent,key,schema,data,change){
  let form=[...parent.children].find(node=>node.dataset?.form===key);
  if(!form){form=document.createElement('ha-form');form.dataset.form=key;parent.append(form);form.addEventListener('value-changed',event=>{event.stopPropagation();change(event.detail.value);});}
  Object.assign(form,{hass:this._hass,schema,data,computeLabel:item=>this._labels[item.name]??item.name,computeHelper:item=>this._helpers[item.name]});return form;
 }
 _render(){
  if(!this._config||!this._hass)return;
  const c=this._config,t=(nl,en)=>cameraDutch(this._hass)?nl:en;
  const entity=(name,domain,multiple=false)=>({name,selector:{entity:{domain,...(multiple?{multiple:true}:{})}}}),bool=name=>({name,selector:{boolean:{}}}),text=name=>({name,selector:{text:{}}});
  const number=(name,min,max)=>({name,selector:{number:{min,max,step:1,mode:'box'}}}),select=(name,options)=>({name,selector:{select:{mode:'dropdown',options}}});
  const option=(value,nl,en=nl)=>({value,label:t(nl,en)}),inherit=option('','Kaartinstelling','Card default');
  const views=[option('live','Live'),option('auto','Momentopnamen','Snapshots')],fits=[option('cover','Vullen (bijsnijden)','Fill (crop)'),option('contain','Volledig beeld (met randen)','Full image (with borders)')];
  this._labels={viewer_target:t('Viewer-ID (optioneel)','Viewer ID (optional)'),title:t('Kaartnaam (voor schermlezers)','Card name (for screen readers)'),camera_entities:t('Camera-entiteiten','Camera entities'),name:t('Eigen naam (optioneel)','Custom name (optional)'),motion_entity:t('Sensor voor beweging','Motion sensor'),person_entity:t('Sensor voor personen','Person sensor'),last_detection_entity:t('Tijdstip laatste detectie (optioneel)','Last detection timestamp (optional)'),show:t('Camera tonen','Show camera'),icon:t('Icoon','Icon'),camera_view:t('Beeldbron','Image source'),aspect_ratio:t('Beeldverhouding','Aspect ratio'),fit_mode:t('Beeldvulling','Image fit'),snapshot_interval:t('Momentopname vernieuwen (seconden)','Snapshot refresh (seconds)'),show_alarm:t('Alarm tonen','Show alarm'),alarm_entity:t('Alarm-entiteit','Alarm entity'),alarm_disarm_code:t('Code vragen bij uitschakelen','Ask for a code when disarming'),show_contacts:t('Deuren en ramen tonen','Show doors and windows'),door_entities:t('Deursensoren','Door sensors'),window_entities:t('Raamsensoren','Window sensors'),show_activity:t('Activiteiten tonen','Show activity'),activity_source:t('Gebeurtenissen ophalen uit','Get events from'),activity_hours:t('Terugkijken (uren)','Look back (hours)'),activity_page_size:t('Gebeurtenissen per pagina','Events per page'),layout:t('Indeling camerabeelden','Camera layout'),columns:t('Aantal kolommen','Number of columns'),default_camera:t('Camera bij openen','Initial camera'),compact:t('Compacte kaartweergave','Compact card layout'),show_names:t('Cameranamen tonen','Show camera names'),show_status:t('Status en detectie-iconen tonen','Show status and detection icons'),show_last_detection:t('Laatste detectie tonen','Show last detection'),show_navigation:t('Navigatieknoppen tonen','Show navigation buttons'),auto_cycle:t('Automatisch wisselen','Automatically switch cameras'),cycle_interval:t('Wisselinterval (seconden)','Switch interval (seconds)'),background:t('Bestaande achtergrond','Existing background'),background_strength:t('Achtergrondsterkte','Background intensity'),animate_background:t('Achtergrond animeren','Animate background')};
  this._helpers={name:t('Laat leeg om de naam uit Home Assistant te gebruiken.','Leave empty to use the Home Assistant name.'),camera_entities:t('Kies camera’s; pas de volgorde hieronder aan.','Choose cameras; reorder them below.'),snapshot_interval:t('Leeg = kaartinstelling; 0 = normale HA-weergave; vanaf 5 seconden automatisch vernieuwen.','Empty = card default; 0 = native HA view; automatic refresh from 5 seconds.'),alarm_disarm_code:t('Inschakelen gebeurt direct, behalve als de integratie een code vereist; dan opent de HA-alarmbediening. Bij uitschakelen vraagt de kaart een code, met een numpad voor cijfercodes. De alarmintegratie controleert de code.','Arming is immediate unless the integration requires a code; then HA alarm controls open. Disarming asks for a code, with a keypad for numeric codes. The alarm integration validates it.'),show_contacts:t('Verbergt alleen het overzicht en de tabbladen. De sensoren blijven beschikbaar voor Activiteiten.','Only hides the overview and tabs. Sensors remain available for Activity.'),activity_source:t('Eerdere gebeurtenissen vereisen Recorder-geschiedenis voor de gekoppelde sensoren. De kaart bewaart geen beelden of videoclips.','Earlier events require Recorder history for mapped sensors. The card stores no images or clips.'),activity_page_size:t('Herhalingen van dezelfde bron, gebeurtenis en status binnen één minuut delen één regel. Openen en sluiten blijven apart.','Repeats of the same source, event and state within one minute share one row. Opening and closing remain separate.'),last_detection_entity:t('Optionele tijdstipsensor voor eerdere detecties.','Optional timestamp sensor for earlier detections.')};
  if(!this._shell){
   this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}
    :host{display:block;min-width:0;color:var(--primary-text-color);container-type:inline-size}*{box-sizing:border-box}ha-form{display:block;min-width:0}details{min-width:0}summary{display:grid;grid-template-columns:10px minmax(0,1fr);gap:2px 10px;align-items:center;min-height:52px;padding:12px;cursor:pointer;list-style:none;font-size:13px;font-weight:500;overflow-wrap:anywhere}summary::-webkit-details-marker{display:none}summary::before{content:'';grid-column:1;grid-row:1;width:7px;height:7px;border-right:2px solid var(--secondary-text-color);border-bottom:2px solid var(--secondary-text-color);transform:rotate(-45deg)}details[open]>summary::before{transform:rotate(45deg)}summary>span,summary>small{grid-column:2}summary>small{font-size:12px;font-weight:400;color:var(--secondary-text-color)}.section{border-bottom:1px solid var(--divider-color)}.section>summary{padding:12px 0;min-height:72px;font-size:14px;font-weight:600}.section:last-child{border-bottom:0}.group-body{display:grid;gap:12px;min-width:0;padding:0 0 16px 20px}.subsection,.camera-row,.contact-row{border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));background:var(--secondary-background-color);box-shadow:var(--eleven-material-well,none)}.subsection>.group-body,.camera-row>.group-body,.contact-row>.group-body{padding:0 12px 12px 32px}.camera-row .subsection{background:transparent;box-shadow:none;border:1px solid var(--divider-color)}.camera-settings{display:grid;gap:8px;min-width:0}.row-actions{display:flex;justify-content:flex-end;gap:8px}.row-actions button{min-width:44px;min-height:44px}.row-actions ha-icon{--mdc-icon-size:20px}summary:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}[hidden]{display:none!important}@container(max-width:340px){.section>.group-body{padding-left:0}.subsection>.group-body,.camera-row>.group-body,.contact-row>.group-body{padding-left:12px}}
   </style><div class="editor-sections"></div>`;this._shell=this.shadowRoot.querySelector('.editor-sections');
  }
  const save=value=>this._save({...this._config,...value});
  this._form=this._formAt(this._shell,'title',[text('title'),text('viewer_target')],c,save);
  const cameras=this._group(this._shell,'cameras',t('Camera’s','Cameras'),c.cameras.length+' '+t('ingesteld','configured'));
  this._formAt(cameras,'camera-picker',[entity('camera_entities','camera',true)],{camera_entities:c.cameras.map(row=>row.entity)},save);
  if(!this._cameraList){this._cameraList=document.createElement('div');this._cameraList.className='camera-settings';cameras.append(this._cameraList);}
  this._renderRows(t,select,entity,bool,text,number,inherit,views,fits);
  const defaults=this._group(cameras,'defaults',t('Standaard beeldinstellingen','Default image settings'),'',true);
  this._formAt(defaults,'defaults',[select('camera_view',views),select('aspect_ratio',CAMERA_RATIOS.map(value=>option(value,value))),select('fit_mode',fits),...(c.camera_view==='auto'?[number('snapshot_interval',0,3600)]:[])],c,save);
  const alarm=this._group(this._shell,'alarm',t('Alarm','Alarm'),!cameraShowAlarm(c)?t('Verborgen','Hidden'):c.alarm_entity?t('Gekoppeld','Configured'):t('Niet ingesteld','Not configured'));
  this._formAt(alarm,'alarm',[bool('show_alarm'),entity('alarm_entity','alarm_control_panel'),...(c.alarm_entity?[bool('alarm_disarm_code')]:[])],{...c,show_alarm:cameraShowAlarm(c)},save);
  const contacts=this._group(this._shell,'contacts',t('Deuren en ramen','Doors and windows'),cameraShowContacts(c)?c.door_sensors.length+' '+t('deuren','doors')+' · '+c.window_sensors.length+' '+t('ramen','windows'):t('Verborgen','Hidden'));
  this._formAt(contacts,'contacts',[bool('show_contacts')],{show_contacts:cameraShowContacts(c)},save);
  for(const [key,field,nl,en] of [['door_sensors','door_entities','Deuren','Doors'],['window_sensors','window_entities','Ramen','Windows']]){
   const body=this._group(contacts,key,t(nl,en),c[key].length+' '+t('ingesteld','configured'),true);
   this._formAt(body,key,[entity(field,'binary_sensor',true)],{[field]:c[key].map(row=>row.entity)},save);this._renderContacts(body,key,text);
  }
  const activity=this._group(this._shell,'activity',t('Activiteiten','Activity'),c.show_activity?(c.activity_source==='history'?c.activity_hours+' '+t('uur','hours'):t('Sinds openen','Since opening'))+' · '+c.activity_page_size+' '+t('per pagina','per page'):t('Verborgen','Hidden'));
  this._formAt(activity,'activity',[bool('show_activity'),...(c.show_activity?[select('activity_source',[option('history','Home Assistant-geschiedenis','Home Assistant history'),option('session','Sinds openen van de kaart','Since opening the card')]),...(c.activity_source==='history'?[number('activity_hours',1,72)]:[]),number('activity_page_size',1,50)]:[])],c,save);
  const layoutLabels={grid:t('Raster','Grid'),focus:t('Focus (één camera tegelijk)','Focus (one camera at a time)'),tabs:t('Tabbladen','Tabs'),sidebar:t('Groot beeld met zijbeelden','Large feed with side feeds'),filmstrip:t('Filmstrip','Filmstrip'),wall:t('Camerawand','Camera wall')},layouts=['grid','focus'];if(!layouts.includes(c.layout))layouts.push(c.layout);
  const appearance=this._group(this._shell,'appearance',t('Weergave','Appearance'),layoutLabels[c.layout]);
  this._formAt(appearance,'appearance',[select('layout',layouts.map(value=>({value,label:layoutLabels[value]}))),...(c.layout==='grid'?[select('columns',[option('auto','Automatisch','Automatic'),...[1,2,3].map(value=>option(String(value),String(value)))])]:visibleCameras(c).length>1?[select('default_camera',visibleCameras(c).map(row=>({value:row.entity,label:this._name(row)})))]:[]),bool('compact')],{...c,columns:String(c.columns)},save);
  const extra=this._group(appearance,'extra',t('Extra weergave-instellingen','Additional display settings'),'',true);
  this._formAt(extra,'extra',[bool('show_names'),bool('show_status'),...(c.show_status?[bool('show_last_detection')]:[]),...(['focus','tabs'].includes(c.layout)?[bool('show_navigation'),bool('auto_cycle'),...(c.auto_cycle?[number('cycle_interval',5,3600)]:[])]:[]),...(c.card_background===undefined?[select('background',headerBackgroundOptions(cameraDutch(this._hass))),number('background_strength',0,100),bool('animate_background')]:[])],c,save);
  if(!this._backgroundSlot){this._backgroundSlot=document.createElement('slot');this._backgroundSlot.name=this.cardBackgroundSlot;appearance.append(this._backgroundSlot);}
 }
 _name(row){return row.name||this._hass.states?.[row.entity]?.attributes?.friendly_name||row.entity;}
 _renderRows(t,select,entity,bool,text,number,inherit,views,fits){
  const c=this._config,list=this._cameraList;
  for(const [id,node] of this._rows)if(!c.cameras.some(row=>row.entity===id)){node.remove();this._rows.delete(id);}
  c.cameras.forEach((row,index)=>{
   let node=this._rows.get(row.entity);
   if(!node){node=document.createElement('details');node.className='camera-row';node.innerHTML='<summary><span></span><small></small></summary><div class="group-body"></div>';this._rows.set(row.entity,node);}
   if(list.children[index]!==node)list.insertBefore(node,list.children[index]??null);
   node.querySelector('summary span').textContent=this._name(row)+(row.show===false?t(' · Verborgen',' · Hidden'):'');node.querySelector('summary small').textContent=row.entity;
   const body=node.querySelector('.group-body'),save=value=>this._save({...this._config,cameras:this._config.cameras.map(item=>item.entity===row.entity?{...item,...value}:item)});
   this._formAt(body,'main',[text('name'),entity('motion_entity','binary_sensor'),entity('person_entity','binary_sensor')],{...row,motion_entity:row.motion_entity??'',person_entity:row.person_entity??''},save);
   const extra=this._group(body,'image',t('Beeld','Image'),'',true),snapshot=(row.camera_view??c.camera_view)==='auto';
   this._formAt(extra,'image',[select('camera_view',[inherit,...views]),select('aspect_ratio',[inherit,...CAMERA_RATIOS.map(value=>({value,label:value}))]),select('fit_mode',[inherit,...fits]),...(snapshot?[number('snapshot_interval',0,3600)]:[]),{name:'icon',selector:{icon:{}}},bool('show'),{name:'last_detection_entity',selector:{entity:{domain:'sensor',device_class:'timestamp'}}}],{...row,show:row.show!==false,camera_view:row.camera_view??'',aspect_ratio:row.aspect_ratio??'',fit_mode:row.fit_mode??'',last_detection_entity:row.last_detection_entity??''},save);
   let actions=body.querySelector('.row-actions');
   if(!actions){actions=document.createElement('div');actions.className='row-actions';actions.innerHTML=[-1,1,0].map(move=>uiButton({content:`<ha-icon icon="${move===-1?'mdi:arrow-up':move===1?'mdi:arrow-down':'mdi:delete'}"></ha-icon>`,attrs:{'data-move':String(move)}})).join('');body.append(actions);actions.addEventListener('click',event=>{const button=event.target.closest?.('[data-move]');if(!button)return;const move=Number(button.dataset.move),rows=[...this._config.cameras],from=rows.findIndex(item=>item.entity===row.entity),to=from+move;if(!move)rows.splice(from,1);else if(to>=0&&to<rows.length)[rows[from],rows[to]]=[rows[to],rows[from]];else return;this._save({...this._config,cameras:rows});if(move)button.focus();else this._form.focus();});}
   for(const [move,label,disabled] of [['-1',t('Camera omhoog','Move camera up'),index===0],['1',t('Camera omlaag','Move camera down'),index===c.cameras.length-1],['0',t('Camera verwijderen','Remove camera'),false]]){const button=actions.querySelector(`[data-move="${move}"]`);button.setAttribute('aria-label',label);button.title=label;button.disabled=disabled;}
  });
 }
 _renderContacts(parent,key,text){
  for(const [id,node] of this._contactRows)if(id.startsWith(key+':')&&!this._config[key].some(row=>id===key+':'+row.entity)){node.remove();this._contactRows.delete(id);}
  this._config[key].forEach((row,index)=>{
   const id=key+':'+row.entity;let node=this._contactRows.get(id);
   if(!node){node=document.createElement('details');node.className='contact-row';node.innerHTML='<summary><span></span><small></small></summary><div class="group-body"></div>';this._contactRows.set(id,node);}
   const existing=parent.children[index+1];if(existing!==node)parent.insertBefore(node,existing??null);
   node.querySelector('summary span').textContent=this._name(row);node.querySelector('summary small').textContent=row.entity;
   this._formAt(node.querySelector('.group-body'),id,[text('name')],{name:row.name??''},value=>this._save({...this._config,[key]:this._config[key].map(item=>item.entity===row.entity?{...item,name:value.name??''}:item)}));
  });
 }
}








function cameraContactRows(rows,hass){
 const online=hass?.connected!==false&&hass?.connection?.connected!==false;
 return rows.map((row,index)=>{const state=online?hass?.states?.[row.entity]?.state:null;return {...row,index,state:['on','off'].includes(state)?state:'unknown',label:row.name||hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity};}).sort((a,b)=>({on:0,unknown:1,off:2}[a.state]-{on:0,unknown:1,off:2}[b.state])||a.index-b.index);
}
function cameraSecurityHeader(config,hass,t,renderArt=securityArt){
 const online=hass?.connected!==false&&hass?.connection?.connected!==false,state=cameraShowAlarm(config)&&online?hass?.states?.[config.alarm_entity]?.state:null;
 const modes={disarmed:[t('Uit','Off'),t('Alarm uitgeschakeld','Alarm disarmed')],armed_home:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_away:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_night:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_vacation:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],armed_custom_bypass:[t('Aan','On'),t('Alarm ingeschakeld','Alarm armed')],arming:[t('Inschakelen','Arming'),t('Alarm wordt ingeschakeld','Alarm is arming')],disarming:[t('Uitschakelen','Disarming'),t('Alarm wordt uitgeschakeld','Alarm is disarming')],pending:[t('Vertraging','Pending'),t('Alarmvertraging actief','Alarm delay active')],triggered:[t('Alarm','Alarm'),t('Alarm geactiveerd','Alarm triggered')]};
 const rows=visibleCameras(config),alarm=!!config.alarm_entity&&cameraShowAlarm(config);
 const [value,subtitle]=alarm?(modes[state]??[t('Onbekend','Unknown'),t('Alarmstatus onbekend','Alarm status unknown')]):[online?String(rows.filter(row=>!cameraUnavailable(hass,row.entity)).length):null,t('Camera’s beschikbaar','Cameras available')];
 return `<div class="camera-primary" data-long-status="${String(value??'').length>8}" data-triggered="${state==='triggered'}">${uiPrimaryValue({value,subtitle,compact:config.compact,attrs:{'data-primary-layout':'uniform'},entity:alarm?config.alarm_entity:''})}</div><div class="camera-security-art">${renderArt(alarm?(modes[state]?state:'unknown'):'camera')}</div>`;
}
function cameraSecurityTabs(config,t){
 return [{value:'cameras',label:t('Camera’s','Cameras')},...(cameraShowContacts(config)&&config.door_sensors.length?[{value:'doors',label:t('Deuren','Doors')}]:[]),...(cameraShowContacts(config)&&config.window_sensors.length?[{value:'windows',label:t('Ramen','Windows')}]:[]),...(config.show_activity?[{value:'activity',label:t('Activiteiten','Activity')}]:[])];
}
function cameraSecurityMetrics(config,hass,t){
 const online=hass?.connected!==false&&hass?.connection?.connected!==false,rows=visibleCameras(config),available=rows.filter(row=>!cameraUnavailable(hass,row.entity)).length;
 const camera=uiMetric({title:t('Camera’s','Cameras'),value:online?String(available):null,unit:t('beschikbaar','available'),icon:'mdi:cctv',action:true,attrs:{'data-security-view':'cameras'}});
 const metric=(kind,items)=>{const contacts=cameraContactRows(items,hass),unknown=contacts.filter(row=>row.state==='unknown').length,open=contacts.filter(row=>row.state==='on').length;
  return uiMetric({title:kind==='doors'?t('Deuren','Doors'):t('Ramen','Windows'),value:!items.length||unknown===items.length?null:String(open),unit:t('open','open'),info:unknown&&unknown<items.length?unknown+' '+t('onbekend','unknown'):'',icon:kind==='doors'?'mdi:door':'mdi:window-closed-variant',action:true,attrs:{'data-security-contacts':kind}});
 };
 if(!cameraShowContacts(config)||(!config.door_sensors.length&&!config.window_sensors.length))return camera;
 const groups=[['doors',config.door_sensors],['windows',config.window_sensors]].filter(([,items])=>items.length);
 return `<div data-ui-metric-grid style="--ui-metric-columns:${groups.length}">${groups.map(([kind,items])=>metric(kind,items)).join('')}</div>`;
}
function cameraContactList(config,hass,t,kind,lastOpened=new Map()){
 const rows=cameraContactRows(kind==='doors'?config.door_sensors:config.window_sensors,hass);
 return rows.length?rows.map(row=>{
  const state=hass?.states?.[row.entity],current=row.state==='on'?Date.parse(state?.last_changed):NaN;
  const time=Math.max(...[current,lastOpened.get(row.entity)].filter(value=>Number.isFinite(value)&&value<=Date.now()));
  const zone=hass?.config?.time_zone;
  let value=null;
  if(Number.isFinite(time)){
   const format=options=>{try{return new Intl.DateTimeFormat('en-GB',{...options,...(zone?{timeZone:zone}:{})}).format(time);}catch{return new Intl.DateTimeFormat('en-GB',options).format(time);}};
   value=format({hour:'2-digit',minute:'2-digit',hourCycle:'h23'})+' '+format({day:'2-digit',month:'2-digit',year:'numeric'}).replaceAll('/','-');
  }
  return uiDetailSurface({title:row.label,entity:row.entity,actionLabel:t('Details van ','Details for ')+row.label,attrs:{'data-security-contact':row.entity,'data-contact-state':row.state},metrics:[{label:t('Status','Status'),value:row.state==='on'?t('Open','Open'):row.state==='off'?t('Dicht','Closed'):t('Onbekend','Unknown')},{label:t('Laatst geopend','Last opened'),value}]});
 }).join(''):`<p>${t('Geen sensoren ingesteld.','No sensors configured.')}</p>`;
}
function cameraDetectionIndicators(entries,t){
 return entries.map(entry=>{
  const title=entry.kind==='person'?t('Persoon','Person'):t('Beweging','Motion'),status=!entry.available?t('Onbekend','Unknown'):entry.active?t('Gedetecteerd','Detected'):t('Geen detectie','No detection');
  const drawing=entry.kind==='person'?'<circle cx="12" cy="6" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M12 15v6"/>':'<path d="M4 7a10 10 0 0 1 16 0M7 10a6 6 0 0 1 10 0M10 13a2 2 0 0 1 4 0"/><circle cx="12" cy="18" r="2"/>';
  return `<button type="button" class="camera-detection-indicator" data-camera-details="${uiEscape(entry.entity)}" data-detection-kind="${entry.kind}" data-detection-state="${!entry.available?'unknown':entry.active?'active':'clear'}" aria-label="${uiEscape(title+': '+status)}" title="${uiEscape(title+': '+status)}"><span class="camera-detection-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg></span></button>`;
 }).join('');
}
function cameraVisibleEvents(events,config,{camera='',kind='',since=0}={}){
 const visible=new Set(visibleCameras(config).map(row=>row.entity));
 const rows=events.filter(event=>(!event.camera||visible.has(event.camera))&&(!camera||(camera==='doors'?event.kind==='door':camera==='windows'?event.kind==='window':event.camera===camera))&&(!kind||event.kind===kind)&&Number.isFinite(event.time)&&event.time>=since).sort((a,b)=>b.time-a.time);
 const groups=new Map(),seen=new Set();
 for(const event of rows){
  if(event.id&&seen.has(event.id))continue;if(event.id)seen.add(event.id);
  const key=cameraActivityGroupKey(event),group=groups.get(key);
  if(group)group.count++;else groups.set(key,{...event,count:1});
 }
 return [...groups.values()];
}
function cameraActivityTimeline(events,{name,type,t,timeZone,now=Date.now()}={}){
 const format=options=>{try{return new Intl.DateTimeFormat('en-GB',{...options,...(timeZone?{timeZone}:{})});}catch{return new Intl.DateTimeFormat('en-GB',options);}};
 const date=format({year:'numeric',month:'2-digit',day:'2-digit'}),clock=format({hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const key=time=>date.format(time).replaceAll('/','-'),today=key(now);
 // Calendar arithmetic keeps Yesterday correct across daylight-saving changes.
 const parts=date.formatToParts(now),part=kind=>Number(parts.find(item=>item.type===kind).value);
 const yesterday=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.UTC(part('year'),part('month')-1,part('day')-1)).replaceAll('/','-');
 const groups=new Map();for(const event of events){if(!Number.isFinite(event.time))continue;const day=key(event.time);if(!groups.has(day))groups.set(day,[]);groups.get(day).push(event);}
 const symbols={motion:'mdi:motion-sensor',person:'mdi:account-outline',door:'mdi:door',window:'mdi:window-closed-variant',doorbell:'mdi:bell-outline'};
 return [...groups].map(([day,rows])=>`<section class="camera-activity-day"><h4><span>${day===today?t('Vandaag','Today'):day===yesterday?t('Gisteren','Yesterday'):day}</span>${[today,yesterday].includes(day)?`<small>${day}</small>`:''}</h4><div>${rows.map(event=>{
  const title=name(event),description=type(event)+(event.count>1?' · '+event.count+'×':''),when=clock.format(event.time);
  return `<div class="camera-event">${uiButton({variant:'text',className:'camera-timeline-open',label:title+' · '+description+' · '+day+' '+when+(event.camera?' · '+t('Camera openen','Open camera'):''),content:`<time datetime="${new Date(event.time).toISOString()}"><span>${when}</span></time><span class="camera-event-symbol" data-kind="${uiEscape(event.kind)}"><ha-icon icon="${symbols[event.kind]??'mdi:circle-outline'}" aria-hidden="true"></ha-icon></span><span class="camera-event-description"><strong>${uiEscape(title)}</strong><small>${uiEscape(description)}</small></span>`,attrs:{'data-camera-activity':event.id}})}</div>`;
 }).join('')}</div></section>`).join('');
}















function cameraReplaceMarkup(node,markup){
 if(node._cameraMarkup===markup)return;node._cameraMarkup=markup;
 const focused=node.getRootNode().activeElement,identity=focused&&node.contains(focused)?['cameraAction','cameraDetails','cameraRefresh','cameraActivity','cameraActivityPage','securityContacts','securityView','entity'].find(key=>focused.dataset[key]):null,value=identity?focused.dataset[identity]:null;
 node.innerHTML=markup;
 if(identity)[...node.querySelectorAll('button')].find(button=>button.dataset[identity]===value)?.focus({preventScroll:true});
}

const cameraFeaturesView=Base=>class extends Base{
 constructor(){super();this._activity=new CameraActivity();this._profileSelection='auto';this._manualUntil=0;this._historyVersion=0;this._securityView='cameras';this._contactKind='';this._activityCamera='';this._activityKind='';}
 setConfig(input){
  const next=normalizeCameraConfig(input),previous=this._baseConfig;
  this._activityPages??=new CameraActivityPages();
  const pageKey=config=>config?JSON.stringify([cameraActivitySources(config),config.cameras.map(row=>[row.entity,row.show]),config.activity_source,config.activity_hours,config.activity_page_size,config.show_activity]):'';
  if(pageKey(previous)!==pageKey(next))this._activityPages.reset();
  const historyKey=config=>config?JSON.stringify([cameraActivitySources(config),config.activity_source,config.activity_hours,config.show_activity]):'';
  if(historyKey(previous)!==historyKey(next)){this._historyVersion++;this._historyKey=null;this._historyLoading=false;this._historyError=false;this._historyHasLoaded=false;}
  this._pendingAction=null;this.shadowRoot.querySelector('dialog')?.close();
  this._baseConfig=next;
  if(!previous||previous.default_camera!==next.default_camera)this._activeCamera=next.default_camera;
  this._applyProfile();this._observeActivity();this._render();this._loadHistory();
 }
 set hass(value){this._hass=value;this._applyProfile();this._observeActivity();this._render();this._loadHistory();}
 get hass(){return this._hass;}
 connectedCallback(){super.connectedCallback();this._loadHistory();}
 disconnectedCallback(){
  this._closeViewer(false);
  super.disconnectedCallback();clearTimeout(this._temporaryTimer);this._temporary=null;this._activity.previous.clear();
  this._alarmControls?.disconnect();
  this._securityTabs?.disconnect();this._securityTabsKey=null;
  this._historyVersion++;this._historyKey=null;this._historyLoading=false;
  clearTimeout(this._historyRefreshTimer);this._historyRefreshTimer=null;
  for(const tile of this._tiles.values())tile.snapshot?.stop();
  this.shadowRoot.querySelector('dialog')?.close();this._pendingAction=null;
 }
 _applyProfile(){
  if(!this._baseConfig)return;
  const config={...this._baseConfig,profiles:[],actions:[],auto_focus:false,doorbell_entity:''},profile=null,key='base';
  if(this._profileKey!==key){this._cancelTemporary();this._expanded=false;this._cycle.stop();this._manualUntil=0;this._profileKey=key;}
  this._config=config;this._profile=profile;
  if(!cameraSecurityTabs(config,(nl,en)=>en).some(tab=>tab.value===this._securityView))this._securityView='cameras';
  if(!visibleCameras(config).some(row=>row.entity===this._activeCamera))this._activeCamera=config.default_camera;
 }
 _layout(){return this._temporary?.kind==='doorbell'&&visibleCameras(this._config).some(row=>row.entity===this._config.doorbell_secondary_camera&&row.entity!==this._activeCamera)?'doorbell':this._temporary||this._expanded?'focus':super._layout();}
 _feedVisible(row){if(this._viewerEntity)return row.entity===this._viewerEntity;if(this._securityView!=='cameras')return false;if(this._layout()==='doorbell')return [this._activeCamera,this._config.doorbell_secondary_camera].includes(row.entity);return super._feedVisible(row);}
 _playbackBlocked(row){return cameraPrivacy(this._hass,row)??super._playbackBlocked(row);}
 _cancelTemporary(){clearTimeout(this._temporaryTimer);this._temporaryTimer=null;this._temporary=null;}
 _manualInteraction(){this._cancelTemporary();this._manualUntil=Date.now()+Math.max(this._config?.focus_duration??30,this._config?.doorbell_duration??45)*1000;}
 _selectCamera(entity,manual=true){if(manual)this._manualInteraction();super._selectCamera(entity,manual);}
 _observeActivity(){
  if(!this._baseConfig||!this._hass)return;
  const events=this._activity.ingest(this._config,this._hass),now=Date.now();
  const allowed=new Set(cameraActivitySources(this._config).map(source=>source.entity+'|'+source.camera+'|'+source.kind));
  const since=this._config.activity_source==='history'?now-this._config.activity_hours*3600000:0;
  this._activity.events=cameraRetainActivity(this._activity.events.filter(event=>event.time>=since&&allowed.has(event.entity+'|'+event.camera+'|'+event.kind)));
  this._activity.observed=cameraRetainActivity(this._activity.observed.filter(event=>allowed.has(event.entity+'|'+event.camera+'|'+event.kind)));
  const candidates=events.filter(event=>now-event.time<30000&&(event.kind==='doorbell'||this._config.auto_focus)&&visibleCameras(this._config).some(row=>row.entity===event.camera&&!this._playbackBlocked(row)));
  if(!candidates.length||this._viewerEntity||!this._attached||document.hidden||this.hasAttribute('data-motion-paused')||this._focused||this.shadowRoot.activeElement||this.shadowRoot.fullscreenElement||now<this._manualUntil)return;
  const rank={motion:1,person:2,doorbell:3};candidates.sort((a,b)=>rank[b.kind]-rank[a.kind]||b.time-a.time);
  const event=candidates[0];if(this._temporary&&rank[this._temporary.kind]>rank[event.kind])return;
  const restore=this._temporary?.restore??{camera:this._activeCamera,expanded:this._expanded,view:this._securityView,scroll:this.shadowRoot.querySelector('ha-card')?.scrollTop??0};
  this._cancelTemporary();this._securityView='cameras';this._activeCamera=event.camera;this._temporary={kind:event.kind,restore};this._cycle.stop();
  this._temporaryTimer=setTimeout(()=>{
   const saved=this._temporary?.restore;this._cancelTemporary();if(!saved)return;
   this._activeCamera=saved.camera;this._expanded=saved.expanded;this._securityView=saved.view??'cameras';this._render();this.shadowRoot.querySelector('ha-card').scrollTop=saved.scroll;
  },(event.kind==='doorbell'?this._config.doorbell_duration:this._config.focus_duration)*1000);
 }
 _ensureFeatures(){
  if(this._featureShell)return;this._featureShell=true;
  const body=this.shadowRoot.querySelector('.camera-body'),toolbar=document.createElement('div');toolbar.className='camera-feature-toolbar';
  toolbar.innerHTML='<label class="camera-profile-label"><span></span><select data-camera-profile></select></label><button type="button" data-ui-button="text" data-camera-back hidden></button><span class="camera-alert-label" role="status" hidden></span>';
  body.before(toolbar);
  const security=document.createElement('div');security.className='camera-security';body.before(security);
  const header=this.shadowRoot.querySelector('.camera-header');header.className='camera-security-header';
  const metrics=document.createElement('div');metrics.className='camera-security-metrics';header.after(metrics);
  const alarmControls=document.createElement('section');alarmControls.className='camera-alarm-controls';metrics.before(alarmControls);
  const tabs=document.createElement('div');tabs.className='camera-security-tabs';security.before(tabs);
  const actions=document.createElement('div');actions.className='camera-actions';this.shadowRoot.querySelector('.camera-navigation').after(actions);
  const activity=document.createElement('section');activity.className='camera-activity';activity.innerHTML='<div class="camera-activity-list"></div><div class="camera-activity-pagination"></div><p class="camera-history-status" role="status"></p>';actions.after(activity);
  const dialog=document.createElement('dialog');dialog.className='camera-confirm';dialog.innerHTML='<h3></h3><p></p><div><button type="button" data-ui-button="action" data-camera-cancel></button><button type="button" data-ui-button="action" data-camera-confirm></button></div>';this.shadowRoot.append(dialog);
  dialog.addEventListener('cancel',()=>{this._pendingAction=null;});
  this.shadowRoot.addEventListener('change',event=>{if(event.target.matches('[data-camera-profile]')){this._profileSelection=event.target.value;this._manualInteraction();this._expanded=false;this._applyProfile();this._render();}if(event.target.matches('[data-activity-filter]')){this[event.target.dataset.activityFilter==='camera'?'_activityCamera':'_activityKind']=event.target.value;this._renderActivity();}});
  this.shadowRoot.addEventListener('click',event=>this._featureClick(event));
  this._securityContent=document.createElement('div');this._securityContent.className='camera-security-content';
  for(const node of [security,body,this.shadowRoot.querySelector('.camera-navigation'),actions,activity,this.shadowRoot.querySelector('.camera-action-error')])this._securityContent.append(node);
  tabs.after(this._securityContent);
 }
 _makeTile(row){
  const tile=super._makeTile(row),header=tile.section.querySelector('.camera-tile-header');
  tile.frame.prepend(header);
  const feedStatus=document.createElement('span');feedStatus.className='camera-feed-status';header.append(feedStatus);
  header.insertAdjacentHTML('beforeend',uiButton({className:'camera-expand',content:'<ha-icon icon="mdi:arrow-expand" aria-hidden="true"></ha-icon>',attrs:{'data-camera-expand':row.entity}})+uiButton({content:'<ha-icon icon="mdi:refresh" aria-hidden="true"></ha-icon>',attrs:{'data-camera-refresh':row.entity}}));
  const loaded=document.createElement('p');loaded.className='camera-snapshot-time';loaded.hidden=true;tile.section.append(loaded);tile.loaded=loaded;
  const footer=document.createElement('div');footer.className='camera-tile-footer';
  const actions=document.createElement('div');actions.className='camera-tile-actions';
  actions.append(tile.section.querySelector('.camera-status'),header.querySelector('[data-camera-refresh]'),header.querySelector('[data-camera-expand]'));
  footer.append(tile.name,actions);tile.frame.after(footer);header.hidden=true;
  tile.snapshot=new CameraSnapshot(tile.section.querySelector('.camera-native'),status=>{tile.status=status;this._updateMessage(tile,row.entity);queueMicrotask(()=>{const button=tile.section.querySelector('[data-camera-refresh]');button.disabled=!!this._playbackBlocked(this._config.cameras.find(item=>item.entity===row.entity)??row)||!!tile.snapshot?.pending;this._renderViewer();});},()=>this._updateSnapshotTime(tile));
  return tile;
 }
 _syncTile(tile,row,active){
  const picture=cameraPictureConfig(row.entity,this._config),interval=row.snapshot_interval??this._config.snapshot_interval;
  const managed=picture.camera_view==='auto'&&(interval>0||tile.manualSnapshot);
  tile.managedSnapshot=managed;
  if(managed){tile.player.stop();tile.snapshot.update(this._hass,row.entity,{interval,fit_mode:picture.fit_mode,alt:row.name||this._hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity},active);}
  else{tile.snapshot.stop();super._syncTile(tile,row,active);}
  this._updateSnapshotTime(tile);
 }
 _updateSnapshotTime(tile){
  if(!tile.loaded)return;tile.loaded.hidden=true;tile.loaded.textContent='';
 }
 _retryTile(entity){const tile=this._tiles.get(entity);if(tile?.managedSnapshot){tile.snapshot.refresh();return;}super._retryTile(entity);}
 _t(nl,en){return cameraDutch(this._hass)?nl:en;}
 _time(time){return new Intl.DateTimeFormat(cameraDutch(this._hass)?'nl-NL':'en-GB',{timeZone:this._hass?.config?.time_zone,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time));}
 _cameraName(entity){return this._config.cameras.find(row=>row.entity===entity)?.name||this._hass?.states?.[entity]?.attributes?.friendly_name||entity;}
 _render(){
  if(!this._config)return;
  if(this._viewerEntity&&!visibleCameras(this._config).some(row=>row.entity===this._viewerEntity))this._closeViewer(false);
  if(!cameraSecurityTabs(this._config,(nl,en)=>en).some(tab=>tab.value===this._securityView))this._securityView='cameras';
  // Stop removed/hidden images before the base adapter discards their tiles.
  for(const [entity,tile] of this._tiles)if(!visibleCameras(this._config).some(row=>row.entity===entity))tile.snapshot?.stop();
  super._render();this._ensureFeatures();this._renderFeatures();this._renderViewer();
  this.shadowRoot.querySelector('.camera-grid')?.style.setProperty('--camera-secondary-count',String(Math.max(1,visibleCameras(this._config).filter(row=>this._feedVisible(row)).length-1)));
 }
 _renderFeatures(){
  const config=this._config,t=(a,b)=>this._t(a,b),toolbar=this.shadowRoot.querySelector('.camera-feature-toolbar'),select=toolbar.querySelector('select');
  const options=[{value:'auto',label:t('Automatisch','Automatic')+(this._profile?' · '+(this._profile.name||this._profile.id):'')},{value:'base',label:t('Kaartinstelling','Card default')},...config.profiles.map(row=>({value:row.id,label:row.name||row.id}))];
  const markup=options.map(row=>`<option value="${uiEscape(row.value)}">${uiEscape(row.label)}</option>`).join('');if(select.innerHTML!==markup)select.innerHTML=markup;select.value=this._profileSelection;select.parentNode.hidden=!config.profiles.length;select.parentNode.querySelector('span').textContent=t('Profiel','Profile');
  const back=toolbar.querySelector('[data-camera-back]');back.hidden=!this._expanded&&!this._temporary;back.textContent=this._temporary?t('Terug naar camera’s','Return to cameras'):t('Terug','Back');
  const online=this._hass?.connected!==false&&this._hass?.connection?.connected!==false;
  const detected=online?visibleCameras(config).find(row=>cameraDetections(this._hass,row,this._detections).entries.some(entry=>entry.active)):null;
  const alarm=online&&cameraShowAlarm(config)&&this._hass?.states?.[config.alarm_entity]?.state==='triggered';
  const alert=toolbar.querySelector('.camera-alert-label');alert.hidden=!this._temporary&&!detected&&!alarm;
  const alertText=alarm?t('Alarm geactiveerd','Alarm triggered'):this._temporary?(this._temporary.kind==='doorbell'?t('Er wordt aangebeld','Doorbell ringing'):t('Detectie','Detection'))+' · '+this._cameraName(this._activeCamera):detected?t('Detectie','Detection')+' · '+this._cameraName(detected.entity):'';if(alert.textContent!==alertText)alert.textContent=alertText;
  alert.hidden=true;toolbar.hidden=back.hidden;
  for(const row of visibleCameras(config)){
   const tile=this._tiles.get(row.entity),view=cameraPictureConfig(row.entity,config).camera_view;
   const expand=tile.section.querySelector('[data-camera-expand]');expand.hidden=this._viewerEntity===row.entity;expand.setAttribute('aria-label',t('Groot beeld: ','Large view: ')+this._cameraName(row.entity));expand.title=t('Groot beeld','Large view');expand.innerHTML='<ha-icon icon="mdi:arrow-expand" aria-hidden="true"></ha-icon>';
   const refresh=tile.section.querySelector('[data-camera-refresh]');refresh.hidden=view!=='auto';refresh.disabled=!!this._playbackBlocked(row)||tile.snapshot.pending;refresh.setAttribute('aria-label',t('Beeld vernieuwen: ','Refresh image: ')+this._cameraName(row.entity));
   const entries=cameraDetections(this._hass,row,this._detections).entries,active=entries.some(entry=>entry.active);
   for(const choice of this.shadowRoot.querySelectorAll('[data-ui-tab],[data-camera-select]'))if((choice.dataset.uiTab??choice.dataset.cameraSelect)===row.entity){choice.dataset.detection=String(active);choice.setAttribute('aria-label',this._cameraName(row.entity)+(active?t(' · Detectie',' · Detection'):''));}
   tile.section.dataset.detection=String(active);
   const feedStatus=tile.section.querySelector('.camera-feed-status'),blocked=this._playbackBlocked(row),state=this._hass?.states?.[row.entity]?.state;
   feedStatus.hidden=true;feedStatus.textContent='';
   const badges=tile.section.querySelector('.camera-status');badges.hidden=!config.show_status||!entries.length;
  }
  this._renderSecurity();this._renderAlarmControls();this._renderActions();this._renderActivity();
 }
 _renderAlarmControls(){
  this._alarmControls??=new CameraAlarmControls(this.shadowRoot.querySelector('.camera-alarm-controls'));
  this._alarmControls.update(this._hass,cameraShowAlarm(this._config)?this._config.alarm_entity:'',(nl,en)=>this._t(nl,en),this._config.alarm_disarm_code);
 }
 cardBackgroundStatusColor(){return cameraSecurityStatusColor(this._config,this._hass);}
 _renderSecurity(){
  const config=this._config,t=(a,b)=>this._t(a,b),root=this.shadowRoot;
  const items=cameraSecurityTabs(config,t);
  if(!items.some(item=>item.value===this._securityView))this._securityView='cameras';
  this._securityArtCache??=new Map();
  const color=this.cardBackgroundStatusColor();
  const art=kind=>{const key=kind+color;if(!this._securityArtCache.has(key))this._securityArtCache.set(key,securityArt(kind,color));return this._securityArtCache.get(key);};
  cameraReplaceMarkup(root.querySelector('.camera-security-header'),cameraSecurityHeader(config,this._hass,t,art));
  cameraReplaceMarkup(root.querySelector('.camera-security-metrics'),cameraSecurityMetrics(config,this._hass,t));
  const contacts=root.querySelector('.camera-security'),contactView=['doors','windows'].includes(this._securityView);contacts.hidden=!contactView;
  if(contactView)cameraReplaceMarkup(contacts,`<div class="camera-contact-surfaces">${cameraContactList(config,this._hass,t,this._securityView,this._activity.lastOpened)}</div>`);
  const key=JSON.stringify(items),tabs=root.querySelector('.camera-security-tabs');
  if(key!==this._securityTabsKey){
   this._securityTabs?.disconnect();
   tabs.after(this._securityContent);
   tabs.innerHTML=uiTabs({id:this._id+'-security',label:t('Beveiligingsoverzicht','Security overview'),variant:'card',selected:this._securityView,items});
   this._securityTabs=bindUITabs({tabs:tabs.querySelectorAll('[data-ui-tab]'),panels:tabs.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>this._selectSecurityView(value)});this._securityTabsKey=key;
  }
  tabs.querySelector('[data-ui-tabs]').hidden=items.length===1;
  this._securityTabs?.select(this._securityView,{notify:false});
  const panel=[...tabs.querySelectorAll('[data-ui-tab-panel]')].find(node=>node.dataset.uiTabPanel===this._securityView);if(panel&&!panel.contains(this._securityContent))panel.append(this._securityContent);
  root.querySelector('.camera-body').hidden=this._securityView!=='cameras';
  root.querySelector('.camera-navigation').hidden=this._securityView!=='cameras'||root.querySelector('.camera-navigation').hidden;
 }
 _selectSecurityView(value){
  this._securityView=value;this._manualInteraction();this._render();
  const tab=this.shadowRoot.querySelector('.camera-security-tabs [aria-selected=true]'),strip=tab?.parentElement;
  if(strip&&strip.scrollWidth>strip.clientWidth){
   const box=strip.getBoundingClientRect(),target=tab.getBoundingClientRect();
   if(target.left<box.left)strip.scrollLeft-=box.left-target.left;
   else if(target.right>box.right)strip.scrollLeft+=target.right-box.right;
  }
 }
 _syncPlayers(){super._syncPlayers();this._viewerPicker?.sync(this._hass,!!this._viewerEntity&&!!this._attached&&!document.hidden);this._syncHistoryRefresh();}
 _historyRefreshActive(){
  return !!this._attached&&!document.hidden&&!this.hasAttribute('data-motion-paused')&&this._securityView==='activity'&&!this._viewerEntity&&!!this._hass&&this._hass.connected!==false&&this._hass.connection?.connected!==false&&!!this._config?.show_activity&&this._config.activity_source==='history'&&cameraActivitySources(this._config).length>0;
 }
 _syncHistoryRefresh(){
  clearTimeout(this._historyRefreshTimer);this._historyRefreshTimer=null;
  if(!this._historyRefreshActive()||this._historyLoading)return;
  const delay=Math.max(0,30000-(Date.now()-(this._historyLastAttempt??0)));
  this._historyRefreshTimer=setTimeout(()=>{
   this._historyRefreshTimer=null;
   if(this._historyRefreshActive())this._loadHistory(true);
  },delay);
 }
 _syncCycle(){if(this._viewerEntity||this._securityView!=='cameras'){this._cycle.stop();return;}super._syncCycle();}
 _openViewer(entity,opener){
  if(this._openLinkedViewer(entity))return;
  if(!visibleCameras(this._config).some(row=>row.entity===entity))return;
  this._manualInteraction();this._viewerOpener=opener??this.shadowRoot.activeElement;this._viewerEntity=entity;
  if(!this._viewer){
   const dialog=document.createElement('dialog');dialog.className='camera-viewer';
   dialog.innerHTML='<header class="camera-viewer-header"><div><h2 id="'+this._id+'-viewer-title"></h2><p></p></div><div class="camera-viewer-tools"></div><button type="button" class="camera-viewer-close" data-camera-view-close autofocus><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header><div class="camera-viewer-body"></div><nav class="camera-viewer-picker"></nav><footer class="camera-viewer-footer"><button type="button" data-ui-button="text" data-camera-view-step="-1"><ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon><span></span></button><span class="camera-viewer-position" aria-live="polite"></span><button type="button" data-ui-button="text" data-camera-view-step="1"><span></span><ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon></button></footer>';
   dialog.setAttribute('aria-labelledby',this._id+'-viewer-title');
   dialog.addEventListener('cancel',event=>{event.preventDefault();this._closeViewer();});
   dialog.addEventListener('close',()=>{if(this._viewerEntity)this._closeViewer();});
   this.shadowRoot.append(dialog);this._viewer=dialog;
  }
  this._viewer.append(this.shadowRoot.querySelector('.camera-action-error'));
  this._render();this._viewer.showModal();this._viewer.querySelector('[data-camera-view-close]').focus();
 }
 _renderViewer(){
  if(!this._viewerEntity||!this._viewer)return;
  const rows=visibleCameras(this._config),row=rows.find(row=>row.entity===this._viewerEntity),tile=this._tiles.get(this._viewerEntity);if(!row||!tile)return;
  const body=this._viewer.querySelector('.camera-viewer-body');
  // Return the previous camera before selecting another one; no duplicate players.
  for(const previous of [...body.children])if(previous!==tile.section){this.shadowRoot.querySelector('.camera-body').append(previous);previous.hidden=true;}
  if(tile.section.parentNode!==body)body.append(tile.section);tile.section.hidden=false;
  this._viewer.querySelector('h2').textContent=this._cameraName(row.entity);
  this._viewer.querySelector('.camera-viewer-header p').textContent=this._t('Actueel camerabeeld','Current camera feed');
  this._viewer.querySelector('[data-camera-view-close]').setAttribute('aria-label',this._t('Groot beeld sluiten','Close large view'));
  const tools=this._viewer.querySelector('.camera-viewer-tools'),entries=this._config.show_status?cameraDetections(this._hass,row,this._detections).entries:[];
  const controls=['[data-camera-refresh]'].map(selector=>tile.section.querySelector(selector)).filter(button=>button&&!button.hidden).map(button=>button.outerHTML).join('');
  cameraReplaceMarkup(tools,cameraDetectionIndicators(entries,(nl,en)=>this._t(nl,en))+controls);
  this._viewerPicker??=new CameraViewerPicker(this._viewer.querySelector('.camera-viewer-picker'));
  this._viewerPicker.update(this._hass,rows,{selected:row.entity,name:entity=>this._cameraName(entity),blocked:camera=>this._playbackBlocked(camera),active:!!this._attached&&!document.hidden,t:(nl,en)=>this._t(nl,en)});
  this._viewer.querySelector('.camera-viewer-position').textContent=(rows.indexOf(row)+1)+' / '+rows.length;
  for(const button of this._viewer.querySelectorAll('[data-camera-view-step]')){button.hidden=rows.length<2;button.querySelector('span').textContent=button.dataset.cameraViewStep==='-1'?this._t('Vorige camera','Previous camera'):this._t('Volgende camera','Next camera');}
 }
 _closeViewer(restore=true){
  if(!this._viewerEntity)return;
  const opener=this._viewerOpener;this._viewerEntity=null;this._viewerOpener=null;
  if(this.shadowRoot.fullscreenElement&&this._viewer?.contains(this.shadowRoot.fullscreenElement))document.exitFullscreen?.().catch(()=>{});
  this._viewerPicker?.stop();
  this._viewer?.close();
  const error=this._viewer?.querySelector('.camera-action-error');if(error)this._securityContent.append(error);
  const body=this._viewer?.querySelector('.camera-viewer-body');
  for(const section of [...(body?.children??[])])this.shadowRoot.querySelector('.camera-body')?.append(section);
  this._layoutKey=null;
  if(restore&&this._attached){this._render();(opener?.isConnected?opener:this.shadowRoot.querySelector('.camera-feature-toolbar select'))?.focus({preventScroll:true});}
 }
 _renderActions(){
  const node=this.shadowRoot.querySelector('.camera-actions'),single=['tabs','focus','doorbell'].includes(this._layout()),ids=new Set(visibleCameras(this._config).map(row=>row.entity));
  const actions=this._config.actions.filter(row=>!row.camera||(ids.has(row.camera)&&(!single||row.camera===this._activeCamera)));
  node.hidden=!actions.length||this._securityView!=='cameras';
  cameraReplaceMarkup(node,actions.map(action=>{let disabled=!!this._actionBusy||this._hass?.connected===false||this._hass?.connection?.connected===false;try{const request=cameraActionRequest(action,this._hass);if(request.entity&&!this._hass?.states?.[request.entity])disabled=true;}catch{disabled=true;}
   return uiButton({variant:'action',content:`<ha-icon icon="${uiEscape(action.icon)}" aria-hidden="true"></ha-icon><span>${uiEscape(action.name||this._hass?.states?.[action.entity]?.attributes?.friendly_name||action.service||this._t('Actie','Action'))}</span>`,disabled,attrs:{'data-camera-action':action.id}});
  }).join(''));
 }
 _activityName(event){
  if(['door','window'].includes(event.kind)){const row=[...this._config.door_sensors,...this._config.window_sensors].find(row=>row.entity===event.entity);return row?.name||this._hass?.states?.[event.entity]?.attributes?.friendly_name||event.entity;}
  return this._cameraName(event.camera)||this._t('Deurbel','Doorbell');
 }
 _activityType(event,types){
  if(event.kind==='door')return event.state==='on'?this._t('Deur geopend','Door opened'):this._t('Deur gesloten','Door closed');
  if(event.kind==='window')return event.state==='on'?this._t('Raam geopend','Window opened'):this._t('Raam gesloten','Window closed');
  return types[event.kind];
 }
 _eventTime(time){
  const options={timeZone:this._hass?.config?.time_zone},locale=cameraDutch(this._hass)?'nl-NL':'en-GB';
  const date=new Intl.DateTimeFormat(locale,{...options,day:'2-digit',month:'2-digit'}).format(new Date(time));
  const clock=new Intl.DateTimeFormat(locale,{...options,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time));
  return '<time datetime="'+new Date(time).toISOString()+'"><span>'+uiEscape(clock)+'</span><small>'+uiEscape(date)+'</small></time>';
 }
 _renderActivity(){
  if(!this._featureShell)return;
  const config=this._config,node=this.shadowRoot.querySelector('.camera-activity'),t=(a,b)=>this._t(a,b);
  node.hidden=!config.show_activity||this._securityView!=='activity';if(node.hidden)return;
  const sources=cameraActivitySources(config);
  const types={motion:t('Beweging gedetecteerd','Motion detected'),person:t('Persoon gedetecteerd','Person detected'),doorbell:t('Aangebeld','Doorbell'),door:t('Deuren','Doors'),window:t('Ramen','Windows')};
  const events=cameraVisibleEvents(config.activity_source==='history'?this._activity.events:this._activity.observed,config,{since:config.activity_source==='history'?Date.now()-config.activity_hours*3600000:0});
  this._activityPages??=new CameraActivityPages();
  const page=this._activityPages.view(events,config.activity_page_size,{since:config.activity_source==='history'?Date.now()-config.activity_hours*3600000:0});
  const empty=!sources.length?t('Koppel detectie-, deur- of raamsensoren in de kaartconfiguratie.','Configure detection, door or window sensors in the card settings.'):this._historyError?t('Geen waargenomen gebeurtenissen.','No observed events.'):config.activity_source==='session'?t('Nog geen gebeurtenissen sinds het openen van de kaart. Kies Geschiedenis in de configuratie voor eerdere activiteiten.','No events since opening the card. Select History in the settings for earlier activity.'):t('Geen gebeurtenissen.','No events.');
  cameraReplaceMarkup(node.querySelector('.camera-activity-list'),page.events.length?cameraActivityTimeline(page.events,{name:event=>this._activityName(event),type:event=>this._activityType(event,types),t,timeZone:this._hass?.config?.time_zone}):this._historyLoading&&!this._historyHasLoaded?'':'<p>'+empty+'</p>');
  const pagination=node.querySelector('.camera-activity-pagination');
  pagination.hidden=page.pages<=1;
  cameraReplaceMarkup(pagination,page.pages>1?`${page.hasNew?uiButton({variant:'action',text:t('Nieuwe activiteiten','New activity'),attrs:{'data-camera-activity-page':'latest',class:'camera-activity-latest'}}):''}<nav aria-label="${t('Activiteitenpagina’s','Activity pages')}">${uiButton({variant:'action',label:t('Vorige pagina','Previous page'),content:'<ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon><span>'+t('Vorige','Previous')+'</span>',disabled:page.page===1,attrs:{'data-camera-activity-page':'previous'}})}<span data-activity-page-status tabindex="-1" role="status">${page.page} ${t('van','of')} ${page.pages}</span>${uiButton({variant:'action',label:t('Volgende pagina','Next page'),content:'<span>'+t('Volgende','Next')+'</span><ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>',disabled:page.page===page.pages,attrs:{'data-camera-activity-page':'next'}})}</nav>`:'');
  node.querySelector('.camera-history-status').textContent=this._historyError?t('Geschiedenis niet beschikbaar. We proberen het automatisch opnieuw. Waargenomen detecties blijven zichtbaar.','History unavailable. Retrying automatically. Observed detections remain visible.'):this._historyLoading&&!this._historyHasLoaded&&!events.length?t('Geschiedenis laden…','Loading history…'):'';
 }
 async _loadHistory(force=false){
  const config=this._config;if(!config||!this._attached||!this._hass||this._hass.connected===false||this._hass.connection?.connected===false||!config.show_activity||config.activity_source!=='history'||this._historyLoading)return;
  const ids=[...new Set(cameraActivitySources(config).map(source=>source.entity))];if(!ids.length)return;
  const key=JSON.stringify([ids,config.activity_hours]);if(!force&&key===this._historyKey)return;
  this._historyKey=key;const version=++this._historyVersion,start=Date.now()-config.activity_hours*3600000,end=Date.now();this._historyLastAttempt=end;this._historyLoading=true;this._syncHistoryRefresh();this._renderActivity();
  try{
   if(typeof this._hass.callApi!=='function')throw Error('History API unavailable');
   const query=new URLSearchParams({filter_entity_id:ids.join(','),end_time:new Date(end).toISOString(),minimal_response:'',no_attributes:'',skip_initial_state:''});
   const hass=this._hass;
   const response=await requestWithTimeout(()=>hass.callApi('GET','history/period/'+encodeURIComponent(new Date(start).toISOString())+'?'+query));
   if(version!==this._historyVersion)return;this._historyError=false;this._historyHasLoaded=true;const events=cameraHistoryEvents(response,config,start,end);this._activity.merge(events);this._activity.events=this._activity.events.filter(event=>event.time>=start);
   for(const event of events)if(['motion','person'].includes(event.kind))this._detections.set(event.entity,Math.max(this._detections.get(event.entity)??0,event.time));
  }catch{if(version===this._historyVersion)this._historyError=true;}
  finally{if(version===this._historyVersion){this._historyLoading=false;this._render();}}
 }
 _featureClick(event){
  const find=selector=>event.target.closest?.(selector),expand=find('[data-camera-expand]');
  const entity=find('[data-entity]');if(entity)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:entity.dataset.entity},bubbles:true,composed:true}));
  const view=find('[data-security-view]');if(view)this._selectSecurityView(view.dataset.securityView);
  const contacts=find('[data-security-contacts]');if(contacts)this._selectSecurityView(contacts.dataset.securityContacts);
  if(expand)this._openViewer(expand.dataset.cameraExpand,expand);
  if(find('[data-camera-view-close]'))this._closeViewer();
  const pick=find('[data-camera-view-pick]');if(pick&&this._viewerEntity&&visibleCameras(this._config).some(row=>row.entity===pick.dataset.cameraViewPick)){this._viewerEntity=pick.dataset.cameraViewPick;this._render();pick.focus({preventScroll:true});}
  const step=find('[data-camera-view-step]');if(step&&this._viewerEntity){const rows=visibleCameras(this._config),index=rows.findIndex(row=>row.entity===this._viewerEntity);this._viewerEntity=rows[(index+Number(step.dataset.cameraViewStep)+rows.length)%rows.length].entity;this._render();step.focus({preventScroll:true});}
  if(find('[data-camera-back]')){const saved=this._temporary?.restore;this._manualInteraction();this._expanded=saved?.expanded??false;this._activeCamera=saved?.camera??this._overviewCamera??this._config.default_camera;this._securityView=saved?.view??this._securityView;this._render();this.shadowRoot.querySelector('ha-card').scrollTop=saved?.scroll??this._overviewScroll??0;}
  const refresh=find('[data-camera-refresh]');if(refresh){const tile=this._tiles.get(refresh.dataset.cameraRefresh);if(tile){tile.manualSnapshot=true;this._syncPlayers();tile.snapshot.refresh();}}
  const action=find('[data-camera-action]');if(action){const config=this._config.actions.find(row=>row.id===action.dataset.cameraAction);if(config)this._requestAction(config);}
  if(find('[data-camera-cancel]')){this._pendingAction=null;this.shadowRoot.querySelector('dialog').close();}
  if(find('[data-camera-confirm]')){const action=this._pendingAction;this._pendingAction=null;this.shadowRoot.querySelector('dialog').close();if(action)this._runAction(action);}
  const pageAction=find('[data-camera-activity-page]');if(pageAction){
   const config=this._config,since=config.activity_source==='history'?Date.now()-config.activity_hours*3600000:0;
   const events=cameraVisibleEvents(config.activity_source==='history'?this._activity.events:this._activity.observed,config,{since});
   if(pageAction.dataset.cameraActivityPage==='latest')this._activityPages.reset();
   else this._activityPages.move(pageAction.dataset.cameraActivityPage==='next'?1:-1,events,config.activity_page_size,{since});
   this._renderActivity();
   const next=this.shadowRoot.querySelector(`[data-camera-activity-page="${pageAction.dataset.cameraActivityPage}"]`);
   if(next&&!next.disabled)next.focus({preventScroll:true});else (this.shadowRoot.querySelector('[data-activity-page-status]')??this.shadowRoot.querySelector('[data-camera-activity]'))?.focus({preventScroll:true});
  }
  const activity=find('[data-camera-activity]');if(activity){const item=[...this._activity.events,...this._activity.observed].find(row=>row.id===activity.dataset.cameraActivity);if(item?.camera&&visibleCameras(this._config).some(row=>row.entity===item.camera)){this._openViewer(item.camera,activity);}else if(item)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:item.entity},bubbles:true,composed:true}));}
 }
 _requestAction(action){
  if(this._actionBusy)return;
  if(action.confirmation&&!(action.action==='more-info'&&!action.service)){
   this._pendingAction=action;const dialog=this.shadowRoot.querySelector('dialog');dialog.querySelector('h3').textContent=this._t('Actie bevestigen','Confirm action');dialog.querySelector('p').textContent=action.name||action.service||action.entity;dialog.querySelector('[data-camera-cancel]').textContent=this._t('Annuleren','Cancel');dialog.querySelector('[data-camera-confirm]').textContent=this._t('Uitvoeren','Run');if(!dialog.open)dialog.showModal();dialog.querySelector('[data-camera-cancel]').focus();
  }else this._runAction(action);
 }
 async _runAction(action){
  if(this._actionBusy||!this._attached)return;
  const status=this.shadowRoot.querySelector('.camera-action-error');status.hidden=true;this._actionBusy=true;this._renderActions();
  try{
   if(this._hass?.connected===false||this._hass?.connection?.connected===false)throw Error('Offline');
   const request=cameraActionRequest(action,this._hass);
   if(request.entity){if(!this._hass?.states?.[request.entity])throw Error('Missing');this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:request.entity},bubbles:true,composed:true}));}
   else await this._hass.callService(request.domain,request.service,request.data,request.target);
  }catch{status.textContent=this._t('Actie mislukt. Controleer de entiteit, actie en je Home Assistant-rechten.','Action failed. Check the entity, action and your Home Assistant permissions.');status.hidden=false;}
  finally{this._actionBusy=false;this._renderFeatures();}
 }
};












let cameraCardSequence=0;
class CameraCardBase extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._id='eleven-camera-'+(++cameraCardSequence);this._tiles=new Map();this._detections=new Map();this._cycle=new CameraCycle(()=>this._advanceCycle());this._fullscreenChange=()=>this._updateFullscreen();}
 static getStubConfig(hass){const entity=Object.keys(hass?.states??{}).find(id=>id.startsWith('camera.'));return {cameras:entity?[entity]:[]};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-camera-editor-test'))customElements.define('eleven-camera-editor-test',CameraEditor);
  return document.createElement('eleven-camera-editor-test');
 }
 setConfig(input){const next=normalizeCameraConfig(input),previous=this._config;this._config=next;if(!previous||previous.default_camera!==next.default_camera)this._activeCamera=next.default_camera;this._render();}
 set hass(hass){this._hass=hass;this._render();}get hass(){return this._hass;}
 getCardSize(){const count=this._config?visibleCameras(this._config).length:0,layout=this._config?this._layout():'grid',rows=['grid','wall'].includes(layout)?Math.ceil(count/(this._config?.columns==='auto'?2:this._config?.columns||1)):layout==='sidebar'?Math.max(1,count-1):1;return Math.max(3,1+rows*4);}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 _layout(){return this._config.layout;}
 _advanceCycle(){if(this.shadowRoot.activeElement||this._hovered||this._focused||this.hasAttribute('data-motion-paused')||document.hidden||this.shadowRoot.fullscreenElement){this._syncCycle();return;}this._selectCamera(nextCamera({...this._config,cameras:this._cycleCameras()},this._activeCamera),false);}
 _feedVisible(row){return !['focus','tabs'].includes(this._layout())||row.entity===this._activeCamera;}
 _playbackBlocked(row){return cameraUnavailable(this._hass,row.entity);}
 _syncTile(tile,row,active){tile.player.update(this._hass,cameraPictureConfig(row.entity,this._config),active);}
 _retryTile(entity){this._tiles.get(entity)?.player.retry();this._syncPlayers();}
 connectedCallback(){this._attached=true;this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>this._syncPlayers());document.addEventListener('fullscreenchange',this._fullscreenChange);this._render();}
 disconnectedCallback(){this._attached=false;releaseCameraViewer(this._viewerTarget,this);this._motionCleanup?.();this._motionCleanup=null;this._tabs?.disconnect();this._layoutKey=null;this._cycle.stop();this._hovered=false;this._focused=false;document.removeEventListener('fullscreenchange',this._fullscreenChange);for(const tile of this._tiles.values())tile.player.stop();this._helpers=null;}
 async _createNative(config){
  if(!this._helpers)this._helpers=Promise.resolve().then(()=>{if(typeof window.loadCardHelpers!=='function')throw Error('HA helpers unavailable');return window.loadCardHelpers();}).catch(error=>{this._helpers=null;throw error;});
  const helpers=await this._helpers;return helpers.createCardElement(config);
 }
 _ensureShell(){
  if(this._shell)return;
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${uiTabsStyles()}${cameraStyles}</style><ha-card><div class="content"><div class="header-region"><div class="scene-background" aria-hidden="true"></div><header class="camera-header"><span class="camera-icon" aria-hidden="true"><ha-icon icon="mdi:cctv"></ha-icon></span><div><h2 class="camera-title"></h2><p class="camera-count"></p></div></header></div><p class="camera-empty" role="status"></p><div class="camera-body"></div><div class="camera-navigation">${uiButton({variant:'action-icon',content:'<ha-icon icon="mdi:chevron-left"></ha-icon>',attrs:{'data-camera-prev':true}})}<span class="camera-position" aria-live="polite"></span>${uiButton({variant:'action-icon',content:'<ha-icon icon="mdi:chevron-right"></ha-icon>',attrs:{'data-camera-next':true}})}${uiButton({variant:'action',attrs:{'data-camera-cycle':true}})}</div><p class="camera-viewer-feedback" role="status" hidden></p><p class="camera-action-error" role="status" hidden></p></div></ha-card>`;
  this._shell=true;
  this.shadowRoot.addEventListener('click',event=>{
   const details=event.target.closest?.('[data-camera-details]');
   if(details&&!this._openLinkedViewer(details.dataset.cameraDetails))this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:details.dataset.cameraDetails},bubbles:true,composed:true}));
   const retry=event.target.closest?.('[data-camera-retry]');
   if(retry)this._retryTile(retry.dataset.cameraRetry);
   const fullscreen=event.target.closest?.('[data-camera-fullscreen]');if(fullscreen)this._toggleFullscreen(fullscreen.dataset.cameraFullscreen);
   const select=event.target.closest?.('[data-camera-select]');if(select)this._selectCamera(select.dataset.cameraSelect);
   if(event.target.closest?.('[data-camera-prev]'))this._selectCamera(nextCamera(this._config,this._activeCamera,-1));
   if(event.target.closest?.('[data-camera-next]'))this._selectCamera(nextCamera(this._config,this._activeCamera,1));
   if(event.target.closest?.('[data-camera-cycle]')){this._cyclePaused=!this._cyclePaused;this._syncPlayers();}
  });
  this.addEventListener('pointerenter',()=>{this._hovered=true;this._syncCycle();});
  this.addEventListener('pointerleave',()=>{this._hovered=false;this._syncCycle();});
  this.shadowRoot.addEventListener('focus',()=>{this._focused=true;this._syncCycle();},true);
  this.shadowRoot.addEventListener('blur',()=>queueMicrotask(()=>{this._focused=!!this.shadowRoot.activeElement;this._syncCycle();}),true);
 }
 _openLinkedViewer(entity){
  if(!this._attached||!this._config.viewer_target||!visibleCameras(this._config).some(row=>row.entity===entity))return false;
  this._manualInteraction?.();updateCameraViewer(this._config.viewer_target,this,entity);this._render();return true;
 }
 _makeTile(row){
  const section=document.createElement('section');section.className='camera-tile';
  section.innerHTML=`<div class="camera-tile-header"><button type="button" class="camera-name" data-camera-details="${uiEscape(row.entity)}"><ha-icon aria-hidden="true"></ha-icon><span></span></button>${uiButton({className:'camera-fullscreen',content:'<ha-icon icon="mdi:fullscreen" aria-hidden="true"></ha-icon>',attrs:{'data-camera-fullscreen':row.entity}})}</div><div class="camera-frame"><div class="camera-native"></div><div class="camera-message" role="status"><span></span>${uiButton({variant:'action',text:'',attrs:{'data-camera-retry':row.entity,hidden:true}})}</div></div><div class="camera-status"></div><p class="camera-last-detection"></p>`;
  const tile={section,name:section.querySelector('.camera-name'),frame:section.querySelector('.camera-frame'),message:section.querySelector('.camera-message'),status:'idle'};
  tile.frame.addEventListener('click',event=>{if(!this._config.viewer_target||event.composedPath().some(node=>node.matches?.('button,[data-ui-button],a')))return;if(this._openLinkedViewer(row.entity)){event.preventDefault();event.stopPropagation();}},true);
  tile.frame.addEventListener('hass-more-info',event=>{if(this._openLinkedViewer(row.entity))event.stopPropagation();});
  tile.player=new CameraPlayer(section.querySelector('.camera-native'),config=>this._createNative(config),status=>{tile.status=status;this._updateMessage(tile,row.entity);});
  return tile;
 }
 _updateMessage(tile,entity){
  const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b,row=this._config.cameras.find(row=>row.entity===entity),unavailable=this._playbackBlocked(row??{entity});
  const paused=!this._attached||document.hidden||(!this._viewerEntity&&!this.shadowRoot.fullscreenElement&&this.hasAttribute('data-motion-paused'));
  const status=unavailable??(paused?'paused':tile.status);
  const messages={offline:t('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'),missing:t('Camera niet gevonden.','Camera not found.'),off:t('Camera uit.','Camera is off.'),unknown:t('Camera niet beschikbaar.','Camera unavailable.'),unavailable:t('Camera niet beschikbaar.','Camera unavailable.'),paused:t('Camerabeeld gepauzeerd.','Camera view paused.'),idle:t('Camerabeeld laden…','Loading camera view…'),loading:t('Camerabeeld laden…','Loading camera view…'),error:t('Camerabeeld laden mislukt.','Could not load camera view.')};
  messages.privacy=t('Privacymodus actief.','Privacy mode active.');messages.privacy_unknown=t('Privacystatus onbekend. Beeld verborgen.','Privacy status unknown. Feed hidden.');
  tile.message.hidden=status==='ready';const message=tile.message.querySelector('span'),text=messages[status]??'';if(message.textContent!==text)message.textContent=text;
  const retry=tile.message.querySelector('button');retry.hidden=status!=='error';retry.textContent=t('Opnieuw proberen','Retry');
  tile.frame.setAttribute('aria-busy',String(status==='loading'));
 }
 _render(){
  if(!this._config)return;this._ensureShell();
  if(this._viewerTarget!==this._config.viewer_target){releaseCameraViewer(this._viewerTarget,this);this._viewerTarget=this._config.viewer_target;}
  if(this._attached)updateCameraViewer(this._viewerTarget,this);
  const feedback=this.shadowRoot.querySelector('.camera-viewer-feedback'),missingViewer=this._config.viewer_target&&!cameraViewerChannel(this._config.viewer_target).listeners.size;feedback.hidden=!missingViewer;feedback.textContent=missingViewer?this._t('Geen cameraviewer gevonden met ID: ','No camera viewer found with ID: ')+this._config.viewer_target:'';
  const config=this._config,layout=this._layout(),nl=cameraDutch(this._hass),content=this.shadowRoot.querySelector('.content'),title=config.title||(nl?'Camera’s':'Cameras');
  content.dataset.dark=String(!!this._hass?.themes?.darkMode);content.dataset.color=config.color;content.dataset.compact=String(config.compact);
  content.dataset.animated=String(config.animate_background&&this._hass?.connected!==false&&this._hass?.connection?.connected!==false);
  content.style.setProperty('--header-background-opacity',String(config.background_strength/100));content.style.setProperty('--camera-ratio',config.aspect_ratio.replace(':','/'));
  if(content.dataset.background!==config.background){content.dataset.background=config.background;this.shadowRoot.querySelector('.scene-background').innerHTML=headerAtmosphere(config.background);}
  const heading=this.shadowRoot.querySelector('.camera-title');if(heading)heading.textContent=title;this.shadowRoot.querySelector('ha-card').setAttribute('aria-label',title);
  const rows=visibleCameras(config);
  const count=this.shadowRoot.querySelector('.camera-count');if(count)count.textContent=rows.length+' '+(nl?(rows.length===1?'camera':'camera’s'):(rows.length===1?'camera':'cameras'));
  const empty=this.shadowRoot.querySelector('.camera-empty');empty.hidden=!!rows.length;empty.textContent=nl?'Kies zichtbare camera’s in de kaartconfiguratie.':'Choose visible cameras in the card configuration.';
  for(const [entity,tile] of this._tiles)if(!rows.some(row=>row.entity===entity)){tile.player.stop();tile.section.remove();this._tiles.delete(entity);}
  const items=rows.map(row=>{
   let tile=this._tiles.get(row.entity);if(!tile){tile=this._makeTile(row);this._tiles.set(row.entity,tile);}
   const label=row.name||this._hass?.states?.[row.entity]?.attributes?.friendly_name||row.entity;tile.name.querySelector('span').textContent=label;tile.name.querySelector('ha-icon').setAttribute('icon',row.icon||'mdi:cctv');tile.name.hidden=!config.show_names;tile.section.setAttribute('aria-label',label);
   tile.frame.style.setProperty('--camera-ratio',(row.aspect_ratio??config.aspect_ratio).replace(':','/'));
   const button=tile.section.querySelector('[data-camera-fullscreen]'),full=!!this.shadowRoot.fullscreenElement&&tile.section.contains(this.shadowRoot.fullscreenElement);button.hidden=true;button.setAttribute('aria-label',(full?(nl?'Volledig scherm sluiten: ':'Exit full screen: '):(nl?'Volledig scherm: ':'Full screen: '))+label);
   this._updateDetections(tile,row);
   return {value:row.entity,label,content:`<div data-camera-slot="${uiEscape(row.entity)}"></div>`};
  });
  if(!items.some(item=>item.value===this._activeCamera))this._activeCamera=config.default_camera;
  const key=JSON.stringify([layout,nl,items.map(item=>item.value)]);
  if(key!==this._layoutKey){
   const focused=this.shadowRoot.activeElement?.dataset.uiTab;this._tabs?.disconnect();
   const body=this.shadowRoot.querySelector('.camera-body');
   body.innerHTML=layout==='tabs'&&items.length>1?`<div class="camera-tabs">${uiTabs({id:this._id,label:nl?'Camera’s':'Cameras',items,selected:this._activeCamera,variant:'card',panelClassName:'camera-panel'})}</div>`:layout==='focus'?`<div class="camera-focus-picker" role="group" aria-label="${nl?'Camera kiezen':'Choose camera'}">${items.map(item=>uiButton({variant:'action-choice',text:item.label,attrs:{'data-camera-select':item.value}})).join('')}</div><div class="camera-focus"></div>`:`<div class="camera-grid" data-layout="${uiEscape(layout==='doorbell'?'sidebar':layout)}"></div>`;
   for(const row of rows){const slot=layout==='tabs'&&items.length>1?[...body.querySelectorAll('[data-camera-slot]')].find(node=>node.dataset.cameraSlot===row.entity):body.querySelector('.camera-grid,.camera-focus');slot.append(this._tiles.get(row.entity).section);}
   this._tabs=bindUITabs({tabs:body.querySelectorAll('[data-ui-tab]'),panels:body.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>this._selectCamera(value)});
   if(focused)[...body.querySelectorAll('[data-ui-tab]')].find(tab=>tab.dataset.uiTab===focused)?.focus({preventScroll:true});
   this._layoutKey=key;
  }
  this._tabs?.select(this._activeCamera,{notify:false});
  for(const item of items){const tab=[...this.shadowRoot.querySelectorAll('[data-ui-tab]')].find(node=>node.dataset.uiTab===item.value),choice=[...this.shadowRoot.querySelectorAll('[data-camera-select]')].find(node=>node.dataset.cameraSelect===item.value);if(tab)tab.textContent=item.label;if(choice){choice.textContent=item.label;choice.setAttribute('aria-pressed',String(item.value===this._activeCamera));}}
  for(const row of rows){const tile=this._tiles.get(row.entity);tile.section.hidden=layout==='tabs'?false:!this._feedVisible(row);tile.section.dataset.primary=String(row.entity===this._activeCamera);}
  const grid=this.shadowRoot.querySelector('.camera-grid');if(grid)grid.dataset.columns=String(config.columns);
  this._syncPlayers();
 }
 _selectCamera(entity,manual=true){
  if(!visibleCameras(this._config).some(row=>row.entity===entity))return;
  this._activeCamera=entity;if(manual)this._cycle.stop();
  this._tabs?.select(entity,{notify:false});
  this._render();
 }
 _updateDetections(tile,row){
  const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b,config=this._config,{entries,last}=cameraDetections(this._hass,row,this._detections);
  const status=tile.section.querySelector('.camera-status');status.hidden=!config.show_status||!entries.length;const markup=cameraDetectionIndicators(entries,t);if(status.innerHTML!==markup)status.innerHTML=markup;
  const detection=tile.section.querySelector('.camera-last-detection');detection.hidden=!config.show_last_detection||(!entries.length&&!row.last_detection_entity);
  const formatted=last===null?'—':new Intl.DateTimeFormat(nl?'nl-NL':'en-GB',{timeZone:this._hass?.config?.time_zone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(last));
  detection.textContent=t('Laatste detectie: ','Last detection: ')+formatted;
 }
 _cycleCameras(){return visibleCameras(this._config).filter(row=>!this._playbackBlocked(row));}
 _syncCycle(){
  if(!this._config)return;
  const eligible=this._cycleCameras();
  const enabled=this._attached&&!this.hasAttribute('data-motion-paused')&&!this._hovered&&!this._focused&&!this.shadowRoot.activeElement&&!this.shadowRoot.fullscreenElement&&['tabs','focus'].includes(this._layout())&&this._config.auto_cycle&&!this._cyclePaused&&!this._temporary&&(eligible.length>1||(eligible.length===1&&eligible[0].entity!==this._activeCamera));
  this._cycle.sync(enabled,this._config.cycle_interval);
 }
 _updateNavigation(){
  const config=this._config,rows=visibleCameras(config),nl=cameraDutch(this._hass),nav=this.shadowRoot.querySelector('.camera-navigation');
  nav.hidden=!['tabs','focus'].includes(this._layout())||rows.length<2||(!config.show_navigation&&!config.auto_cycle);
  const index=rows.findIndex(row=>row.entity===this._activeCamera),position=this.shadowRoot.querySelector('.camera-position');position.textContent=(index+1)+' / '+rows.length;position.hidden=!config.show_navigation;
  for(const [selector,label] of [['[data-camera-prev]',nl?'Vorige camera':'Previous camera'],['[data-camera-next]',nl?'Volgende camera':'Next camera']]){const button=this.shadowRoot.querySelector(selector);button.setAttribute('aria-label',label);button.hidden=!config.show_navigation;}
  const cycle=this.shadowRoot.querySelector('[data-camera-cycle]');cycle.hidden=!config.auto_cycle;cycle.setAttribute('aria-pressed',String(!this._cyclePaused));cycle.setAttribute('aria-label',nl?'Automatisch wisselen':'Auto cycle');cycle.textContent=this._cyclePaused?(nl?'Hervatten':'Resume'):(nl?'Pauzeren':'Pause');
  for(const button of this.shadowRoot.querySelectorAll('[data-camera-select]'))button.setAttribute('aria-pressed',String(button.dataset.cameraSelect===this._activeCamera));
 }
 async _toggleFullscreen(entity){
  const tile=this._tiles.get(entity);if(!tile)return;
  const error=this.shadowRoot.querySelector('.camera-action-error');error.hidden=true;
  try{if(this.shadowRoot.fullscreenElement)await document.exitFullscreen();else await tile.section.requestFullscreen();}
  catch{error.textContent=cameraDutch(this._hass)?'Volledig scherm is hier niet beschikbaar.':'Full screen is unavailable here.';error.hidden=false;}
 }
 _updateFullscreen(){
  for(const tile of this._tiles.values()){
   const active=!!this.shadowRoot.fullscreenElement&&tile.section.contains(this.shadowRoot.fullscreenElement),button=tile.section.querySelector('[data-camera-fullscreen]');button.querySelector('ha-icon').setAttribute('icon',active?'mdi:fullscreen-exit':'mdi:fullscreen');button.setAttribute('aria-label',(active?(cameraDutch(this._hass)?'Volledig scherm sluiten: ':'Exit full screen: '):(cameraDutch(this._hass)?'Volledig scherm: ':'Full screen: '))+tile.section.getAttribute('aria-label'));
  }
  this._syncPlayers();
 }
 _syncPlayers(){
  if(!this._config)return;
  for(const row of this._config.cameras){
   const tile=this._tiles.get(row.entity);if(!tile)continue;
   const fullscreen=this.shadowRoot.fullscreenElement;
   const active=row.show!==false&&!!this._attached&&!document.hidden&&(!!this._viewerEntity||!!fullscreen||!this.hasAttribute('data-motion-paused'))&&!this._playbackBlocked(row)&&(!fullscreen||tile.section.contains(fullscreen))&&this._feedVisible(row);
   this._syncTile(tile,row,active);this._updateMessage(tile,row.entity);
  }
  this._updateNavigation();this._syncCycle();
 }
}
class CameraCard extends withCardBackground(cameraFeaturesView(CameraCardBase)){}

// Shared across standalone/collection loads. Only mounted sources are retained.
const cameraViewerKey=Symbol.for('eleven-camera-viewer-card-test.links');
const cameraViewerLinks=globalThis[cameraViewerKey]??=new Map();
function cameraViewerChannel(id){
 if(!cameraViewerLinks.has(id))cameraViewerLinks.set(id,{source:null,entity:'',sources:new Set(),listeners:new Set()});
 return cameraViewerLinks.get(id);
}
function updateCameraViewer(id,source,entity){
 if(!id)return;
 const channel=cameraViewerChannel(id);
 channel.sources.add(source);
 if(entity){channel.source=source;channel.entity=entity;}
 if(channel.source!==source)return;
 for(const listener of [...channel.listeners])listener();
}
function releaseCameraViewer(id,source){
 if(!id)return;
 const channel=cameraViewerChannel(id);
 channel.sources.delete(source);
 if(channel.source===source){channel.source=null;channel.entity='';for(const listener of [...channel.listeners])listener();}
 if(!channel.sources.size&&!channel.listeners.size)cameraViewerLinks.delete(id);
}
function subscribeCameraViewer(id,listener){
 const channel=cameraViewerChannel(id);channel.listeners.add(listener);
 for(const source of [...channel.sources])source._render();
 return ()=>{
  channel.listeners.delete(listener);
  for(const source of [...channel.sources])source._render();
  if(!channel.sources.size&&!channel.listeners.size)cameraViewerLinks.delete(id);
 };
}






class CameraViewerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(input){this._config={show_names:true,show_status:true,show_last_detection:true,show_fullscreen:true,compact:false,...input};this._render();}
 set hass(value){this._hass=value;this._render();}
 _render(){if(!this._config)return;const nl=cameraDutch(this._hass),t=(a,b)=>nl?a:b;
  if(!this._form){this.shadowRoot.innerHTML='<ha-form></ha-form>';this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config={...this._config,...event.detail.value};this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));});}
  this._form.hass=this._hass;this._form.data=this._config;this._form.schema=[{name:'title',selector:{text:{}}},{name:'viewer_id',selector:{text:{}}},...['show_names','show_status','show_last_detection','show_fullscreen','compact'].map(name=>({name,selector:{boolean:{}}}))];
  const labels={title:t('Titel','Title'),viewer_id:t('Viewer-ID','Viewer ID'),show_names:t('Cameranamen tonen','Show camera names'),show_status:t('Detecties tonen','Show detections'),show_last_detection:t('Laatste detectie tonen','Show last detection'),show_fullscreen:t('Knop voor groot beeld tonen','Show large view button'),compact:t('Compact','Compact')};this._form.computeLabel=field=>labels[field.name]??field.name;this._form.computeHelper=field=>field.name==='viewer_id'?t('Gebruik dezelfde ID als in de gekoppelde camerakaart.','Use the same ID as in the linked camera card.'):'';
 }
}
class CameraViewerCard extends CameraCard{
 static getStubConfig(){return {viewer_id:'camera-viewer'};}
 static async getConfigElement(){await CameraCard.getConfigElement();if(!customElements.get('eleven-camera-viewer-editor-test'))customElements.define('eleven-camera-viewer-editor-test',CameraViewerEditor);if(!customElements.get('eleven-camera-background-editor-test'))customElements.define('eleven-camera-background-editor-test',ElevenCardBackgroundEditor);const editor=document.createElement('eleven-camera-background-editor-test');editor.nativeEditor=document.createElement('eleven-camera-viewer-editor-test');return editor;}
 setConfig(input){this._unsubscribeViewer();this._viewerInput={...input};this._viewerId=typeof input.viewer_id==='string'?input.viewer_id.trim():'';this._refreshViewer();if(this.isConnected)this._subscribeViewer();}
 connectedCallback(){super.connectedCallback();this._subscribeViewer();}
 disconnectedCallback(){this._unsubscribeViewer();super.disconnectedCallback();}
 getCardSize(){const content=this.shadowRoot?.querySelector('.content');if(this.isConnected&&content?.getBoundingClientRect().width>0)return Math.max(2,Math.ceil(content.scrollHeight/50));return this._config?.cameras?.length?5:2;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 _subscribeViewer(){this._unsubscribeViewer();if(!this._viewerId)return;this._viewerCleanup=subscribeCameraViewer(this._viewerId,()=>this._refreshViewer());this._refreshViewer();}
 _unsubscribeViewer(){this._viewerCleanup?.();this._viewerCleanup=null;}
 _refreshViewer(){
  const channel=this._viewerId?cameraViewerChannel(this._viewerId):null,source=channel?.source;
  const row=source?visibleCameras(source._config).find(row=>row.entity===channel.entity):null;
  const camera=row?{...row,camera_view:row.camera_view??source._config.camera_view,aspect_ratio:row.aspect_ratio??source._config.aspect_ratio,fit_mode:row.fit_mode??source._config.fit_mode,snapshot_interval:row.snapshot_interval??source._config.snapshot_interval}:null;
  super.setConfig({...this._viewerInput,viewer_target:'',cameras:camera?[camera]:[],entity:undefined,layout:'focus',profiles:[],actions:[],auto_cycle:false,auto_focus:false,doorbell_entity:'',alarm_entity:'',door_sensors:[],window_sensors:[],show_activity:false,show_security:false,show_alarm:false,show_contacts:false});
 }
 _renderSecurity(){super._renderSecurity();const title=this._viewerInput?.title||this._t('Cameraviewer','Camera viewer'),header=this.shadowRoot.querySelector('.camera-security-header'),heading=document.createElement('h2');heading.className='camera-viewer-title';heading.textContent=title;header.replaceChildren(heading);this.shadowRoot.querySelector('ha-card').setAttribute('aria-label',title);this.shadowRoot.querySelector('.camera-security-metrics').hidden=true;if(!this._viewerTitleStyle){const style=document.createElement('style');style.textContent=uiCardTitleStyles('.camera-viewer-title')+'.camera-viewer-title{margin:0}.camera-security-header{min-height:0}';this.shadowRoot.append(style);this._viewerTitleStyle=style;}}
 _render(){super._render();if(!this._config)return;const empty=this.shadowRoot.querySelector('.camera-empty');empty.textContent=this._viewerId?this._t('Klik op een camera in de gekoppelde camerakaart.','Select a camera in the linked camera card.'):this._t('Stel een viewer-ID in om een camerakaart te koppelen.','Set a viewer ID to link a camera card.');this.shadowRoot.querySelector('.camera-focus-picker')?.setAttribute('hidden','');for(const tile of this._tiles.values())tile.section.querySelector('[data-camera-expand]').hidden=!this._config.show_fullscreen;}
}

if(!customElements.get('eleven-camera-card-test'))customElements.define('eleven-camera-card-test',CameraCard);
if(!customElements.get('eleven-camera-viewer-card-test'))customElements.define('eleven-camera-viewer-card-test',CameraViewerCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-camera-card-test'))window.customCards.push({type:'eleven-camera-card-test',name:'Eleven Camera (beta)',description:'One or more Home Assistant camera feeds in a grid or tabs.',preview:true});
if(!window.customCards.some(card=>card.type==='eleven-camera-viewer-card-test'))window.customCards.push({type:'eleven-camera-viewer-card-test',name:'Eleven Camera Viewer (beta)',description:'Show the camera selected in a linked Camera card.',preview:true});
})();
