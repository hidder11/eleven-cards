// Eleven standalone Actions, Controls and Waste
(()=>{
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
  if(!customElements.get('eleven-card-background-editor'))customElements.define('eleven-card-background-editor',ElevenCardBackgroundEditor);
  const editor=document.createElement('eleven-card-background-editor');editor.backgroundOptions=options;
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

function coverRequest(state,entity,action){
 const bit={open:1,close:2,stop:8}[action];
 if(!available(state)||!/^cover\.[a-z0-9_]+$/.test(entity)||!bit||!(Number(state.attributes?.supported_features)&bit))return null;
 return {domain:'cover',service:action+'_cover',data:{entity_id:entity}};
}
function actionRequest(state,entity){
 if(!available(state)||!/^(scene|script)\.[a-z0-9_]+$/.test(entity))return null;
 return {domain:entity.split('.')[0],service:'turn_on',data:{entity_id:entity}};
}

const available=s=>!!s&&!['unknown','unavailable'].includes(s.state);
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
function temperatureRequest(state,direction){
 if(!available(state)||![-1,1].includes(direction))return null;
 const a=state.attributes??{};if(!finite(a.temperature))return null;
 const step=finite(a.target_temp_step)&&Number(a.target_temp_step)>0?Number(a.target_temp_step):0.5;
 const value=Number((Number(a.temperature)+direction*step).toFixed(6));
 if((finite(a.min_temp)&&value<Number(a.min_temp))||(finite(a.max_temp)&&value>Number(a.max_temp)))return null;
 return value;
}

// Presentation helpers shared by Actions, Controls and Waste; no card registration.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<ha-icon icon="${esc(name)}" aria-hidden="true"></ha-icon>`;
const CSS=`
:host{display:block;min-width:0;height:100%;color:var(--primary-text-color)}
ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));border-radius:var(--ha-card-border-radius,12px)}
.content{padding:16px;font-family:var(--ha-font-family-body,inherit);line-height:1.4}.heading{display:flex;align-items:baseline;gap:8px;margin-bottom:14px}h2{font-size:18px;font-weight:650;letter-spacing:-.01em;line-height:1.25;margin:0;flex:1}
button:where(:not([data-ui-button])){font:inherit;color:inherit;cursor:pointer;appearance:none;border:0;border-radius:8px;background:var(--secondary-background-color);min-width:44px;min-height:44px;box-sizing:border-box;transition:background 120ms ease-out}button:where(:not([data-ui-button])):hover:not(:disabled){background:color-mix(in srgb,var(--primary-color) 12%,var(--secondary-background-color))}button:where(:not([data-ui-button])):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}button:where(:not([data-ui-button])):disabled{opacity:.45;cursor:default}ha-icon{--mdc-icon-size:22px;display:inline-flex;width:22px;height:22px;flex:none}
.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.split-label{display:block}.split-label small{display:block;color:var(--secondary-text-color);font-size:11px;font-weight:400;margin-top:1px}.feedback:empty{display:none}.feedback{font-size:12px;margin-top:10px;color:var(--secondary-text-color);overflow-wrap:anywhere}.feedback.error{color:var(--error-color)}
.target{text-align:center;min-width:49px;font-size:16px;font-weight:550;font-variant-numeric:tabular-nums}.target small{display:block;font-weight:400;font-size:10px;color:var(--secondary-text-color)}
.identity{background:transparent;text-align:left;flex:1;min-width:0;padding:0;display:flex;gap:9px;align-items:center}.identity ha-icon{color:var(--secondary-text-color)}.identity span{min-width:0;overflow-wrap:anywhere;font-size:13px}.identity small{display:block;font-size:11px;color:var(--secondary-text-color)}
@media(max-width:380px){.content{padding:12px}}@media(prefers-reduced-motion:reduce){button:where(:not([data-ui-button])){transition:none}}
`;
function CSSescape(s){return String(s).replace(/["\\]/g,'\\$&');}


const normalizeItem=e=>typeof e==='string'?{entity:e}:e;
const isNL=locale=>String(locale||'en').toLowerCase().startsWith('nl');
function safeColor(value){if(Array.isArray(value)&&value.length===3&&value.every(v=>Number.isInteger(v)&&v>=0&&v<=255))return `rgb(${value.join(',')})`;return /^#[\da-f]{3}([\da-f]{3})?$/i.test(value||'')?value:null;}
function controlRequest(state,entity,action,value){
 if(!available(state)||!/^([a-z_]+)\.[a-z0-9_]+$/.test(entity))return null;
 const domain=entity.split('.')[0],a=state.attributes||{},features=Number(a.supported_features)||0,data={entity_id:entity};
 const req=(service,extra={})=>({domain,service,data:{...data,...extra}});
 if(domain==='climate'&&['up','down'].includes(action)&&(features&1)){const target=temperatureRequest(state,action==='up'?1:-1);return target===null?null:req('set_temperature',{temperature:target});}
 if(domain==='cover'&&['open','stop','close'].includes(action))return coverRequest(state,entity,action);
 if(action==='toggle'&&['light','switch','input_boolean','fan'].includes(domain)&&['on','off'].includes(state.state)){
  const turnOn=state.state==='off';if(domain==='fan'&&!(features&(turnOn?32:16)))return null;
  return req(turnOn?'turn_on':'turn_off');
 }
 if(action==='level'&&finite(value)&&Number(value)>=0&&Number(value)<=100){
  if(domain==='light'&&Array.isArray(a.supported_color_modes)&&a.supported_color_modes.some(m=>!['onoff','unknown'].includes(m)))return req('turn_on',{brightness_pct:Number(value)});
  if(domain==='fan'&&(features&1))return req('set_percentage',{percentage:Number(value)});
  if(domain==='cover'&&(features&4))return req('set_cover_position',{position:Number(value)});
 }
 if(['number','input_number'].includes(domain)&&['up','down'].includes(action)&&finite(state.state)&&finite(a.step)&&Number(a.step)>0&&finite(a.min)&&finite(a.max)){
  const n=Number((Number(state.state)+(action==='up'?1:-1)*Number(a.step)).toFixed(8));
  return n>=Number(a.min)&&n<=Number(a.max)?req('set_value',{value:n}):null;
 }
 return null;
}
function dayKey(value,timeZone='UTC'){
 const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const get=t=>p.find(x=>x.type===t)?.value;return `${get('year')}-${get('month')}-${get('day')}`;
}
const ordinal=k=>Date.parse(k+'T12:00:00Z')/86400000;
const addDays=(k,n)=>new Date((ordinal(k)+n)*86400000).toISOString().slice(0,10);
function isoDay(value,timeZone){
 if(typeof value!=='string')return null;
 const match=/^(\d{4}-\d{2}-\d{2})$/.exec(value);
 if(match){const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:null;}
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:?\d{2})$/.test(value)||!Number.isFinite(Date.parse(value))||!isoDay(value.slice(0,10),timeZone))return null;
 return dayKey(Date.parse(value),timeZone);
}
function wasteRows(entries,states={},calendars={},options={}){
 let timeZone=options.timeZone||'UTC';try{dayKey(options.now??Date.now(),timeZone);}catch{timeZone='UTC';}
 const now=options.now??Date.now(),locale=options.locale||'en',nl=isNL(locale),today=dayKey(now,timeZone),rows=[];
 const row=(entry,state,date,status,name)=>{
  const days=date?Math.round(ordinal(date)-ordinal(today)):Infinity;
  const label=!date?({unavailable:nl?'Niet beschikbaar':'Unavailable',invalid:nl?'Geen geldige ophaaldatum':'No valid collection date',past:nl?'Ophaaldatum verstreken':'Collection date passed',empty:nl?'Geen inzameling in 60 dagen':'No collection within 60 days',error:nl?'Kalender kon niet laden':'Calendar could not load',loading:nl?'Kalender laden…':'Loading calendar…'}[status]):days===0?(nl?'Vandaag':'Today'):days===1?(nl?'Morgen':'Tomorrow'):new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',timeZone:'UTC',...(date.slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{})}).format(new Date(date+'T12:00:00Z'));
  rows.push({...entry,name:entry.name||name||state?.attributes?.friendly_name||entry.entity,date,days,label,status:status||'ready',color:safeColor(entry.color),icon:entry.icon||state?.attributes?.icon||'mdi:trash-can-outline'});
 };
 for(const raw of entries){
  const e=normalizeItem(raw),s=states[e.entity];
  if(!available(s)){row(e,s,null,'unavailable');continue;}
  if(e.entity?.startsWith('calendar.')){
   const cache=calendars[e.entity];if(!cache||cache.error){row(e,s,null,cache?.error?'error':'loading');continue;}
   const events=(cache.events||[]).filter(ev=>!e.filter||String(ev.summary||'').toLocaleLowerCase().includes(String(e.filter).toLocaleLowerCase()));let found=false;
   for(const ev of events){const date=isoDay(ev.start?.date||ev.start?.dateTime||ev.start,timeZone);if(!date||date<today)continue;row(e,s,date,null,ev.summary);found=true;}
   if(!found)row(e,s,null,'empty');continue;
  }
  const a=s.attributes||{},source=e.source||'auto';let value=e.attribute?a[e.attribute]:s.state,date=null;
  const usesDays=source==='days'||(source==='auto'&&!e.attribute&&finite(a.daysTo));
  if(usesDays){if(source==='auto')value=a.daysTo;const n=Number(value);if(finite(value)&&String(value).trim()!==''&&Number.isInteger(n)&&Math.abs(n)<36600){let origin=today;if(s.last_updated&&Number.isFinite(Date.parse(s.last_updated)))origin=dayKey(s.last_updated,timeZone);date=addDays(origin,n);}}
  else date=isoDay(value,timeZone);
  if(date&&date<today){row(e,s,null,'past');continue;}row(e,s,date,date?null:'invalid');
 }
 return rows.sort((a,b)=>a.days-b.days||a.name.localeCompare(b.name,locale));
}
function groupWaste(rows){const groups=[];for(const row of rows){if(!row.date)continue;let g=groups.find(g=>g.date===row.date);if(!g){g={date:row.date,label:row.label,days:row.days,items:[]};groups.push(g);}if(!g.items.some(e=>e.entity===row.entity&&e.name===row.name))g.items.push(row);}return groups;}


function controlItemState(domain,state){
 if(!state||['unknown','unavailable'].includes(state.state))return 'unavailable';
 if(domain==='climate')return ({heating:'heating',cooling:'cooling',drying:'active',fan:'active'})[state.attributes?.hvac_action]??'idle';
 if(['opening','closing'].includes(state.state))return 'moving';
 return ['on','open'].includes(state.state)?'active':'idle';
}

// Only fixed geometry enters SVG; caller-provided icons use escaped HA markup.
function controlItemIcon(domain,state,status,customIcon){
 if(customIcon)return `<span class="item-state-icon" aria-hidden="true"><ha-icon icon="${uiEscape(customIcon)}"></ha-icon></span>`;
 const parts=[],active=['active','moving','heating','cooling'].includes(status);
 const add=(tag,attrs)=>parts.push(`<${tag} ${Object.entries(attrs).map(([key,value])=>`${key}="${uiEscape(value)}"`).join(' ')}></${tag}>`);
 const line=d=>add('path',{d,fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'});
 if(domain==='light'){add('path',{d:'M8 16v-1.5a6 6 0 1 1 8 0V16Z',fill:active?'currentColor':'none','fill-opacity':active?.2:1,stroke:'currentColor','stroke-width':1.7});line('M9 19h6M10 22h4');if(active)line('M12 1v1M2 8H1M23 8h-1M4 3l1 1M20 3l-1 1');}
 else if(domain==='fan'){add('circle',{cx:12,cy:12,r:2,fill:'currentColor'});for(const angle of [0,120,240])add('path',{d:'M12 9C7 5 12 0 16 3c3 2 0 7-4 6Z',fill:active?'currentColor':'none','fill-opacity':active?.22:1,stroke:'currentColor','stroke-width':1.5,transform:`rotate(${angle} 12 12)`});}
 else if(domain==='cover'){line('M4 3h16v18H4Z');for(const y of state?.state==='closed'?[6,9,12,15,18]:[6,9])line(`M5 ${y}h14`);if(state?.state!=='closed')line('M12 12v6m-2-2 2 2 2-2');}
 else if(domain==='climate'){line('M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Z');add('circle',{cx:12,cy:18,r:2.2,fill:'currentColor'});line(`M12 17V${active?7:12}`);}
 else if(['number','input_number'].includes(domain)){line('M4 6h16M4 12h16M4 18h16');for(const [cx,cy]of [[8,6],[16,12],[10,18]])add('circle',{cx,cy,r:2,fill:'var(--card-background-color)',stroke:'currentColor','stroke-width':1.5});}
 else if(domain==='input_boolean'){add('rect',{x:3,y:6,width:18,height:12,rx:6,fill:'none',stroke:'currentColor','stroke-width':1.7});add('circle',{cx:active?16:8,cy:12,r:3,fill:'currentColor'});}
 else {line('M5 4h14v16H5Z');add('circle',{cx:9,cy:10,r:1,fill:'currentColor'});add('circle',{cx:15,cy:10,r:1,fill:'currentColor'});line('M10 15h4');if(active)add('circle',{cx:18,cy:5,r:3,fill:'currentColor',stroke:'var(--card-background-color)','stroke-width':1.5});}
 if(status==='idle'&&domain==='fan')line('M4 20 20 4');
 if(status==='unavailable')line('M3 21 21 3');
 return `<svg class="item-state-icon" viewBox="0 0 24 24" aria-hidden="true">${parts.join('')}</svg>`;
}

const controlPowerIcon='<svg class="power-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5.5a8 8 0 1 0 10 0M12 3v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';

const controlsPresentationStyles=`
.content{container-type:inline-size;--control-width:clamp(172px,55cqw,320px);padding:16px}
.heading{margin-bottom:8px}.heading h2{min-width:0;letter-spacing:normal;overflow-wrap:anywhere}
.devices{display:grid;grid-auto-rows:auto;gap:0}
.devices .device{position:relative;display:grid;grid-template-columns:minmax(0,1fr) var(--control-width);align-items:center;min-height:54px;gap:8px;box-sizing:border-box;padding:5px 0;border:0}
.devices .device::after{content:'';position:absolute;left:44px;right:0;bottom:0;height:1px;background:color-mix(in srgb,var(--divider-color) 65%,transparent);pointer-events:none}.devices .device:last-child::after{display:none}
.device .identity{min-width:0;max-width:100%;min-height:44px;gap:12px;background:transparent;box-shadow:none;border-radius:0}.device .identity:hover:not(:disabled){background:transparent}
.device .identity span{min-width:0;font-size:13px;font-weight:500;line-height:18px;white-space:normal;overflow-wrap:anywhere}.device .identity small{display:block;font-size:12px;font-weight:400;line-height:16px;margin-top:1px}
.item-state-icon{display:block;flex:none;width:32px;height:32px;box-sizing:border-box;padding:5px;border-radius:8px;color:var(--secondary-text-color);background:color-mix(in srgb,var(--secondary-text-color) 5%,transparent)}
.device .identity .item-state-icon{min-width:32px}.item-state-icon ha-icon{--mdc-icon-size:22px;width:22px;height:22px;color:inherit!important}
.device[data-domain=light]{--item-active:var(--state-light-active-color,var(--state-active-color,var(--primary-color)))}.device[data-domain=fan]{--item-active:var(--state-fan-active-color,var(--state-active-color,var(--primary-color)))}.device[data-domain=cover]{--item-active:var(--state-cover-active-color,var(--state-active-color,var(--primary-color)))}.device[data-domain=switch],.device[data-domain=input_boolean]{--item-active:var(--state-switch-active-color,var(--state-active-color,var(--primary-color)))}
.device[data-item-state=active] .item-state-icon,.device[data-item-state=moving] .item-state-icon{color:var(--item-active,var(--primary-color));background:color-mix(in srgb,var(--item-active,var(--primary-color)) 9%,transparent)}
.device[data-item-state=heating] .item-state-icon{color:var(--state-climate-heat-color,var(--error-color));background:color-mix(in srgb,var(--state-climate-heat-color,var(--error-color)) 9%,transparent)}
.device[data-item-state=cooling] .item-state-icon{color:var(--state-climate-cool-color,var(--primary-color));background:color-mix(in srgb,var(--state-climate-cool-color,var(--primary-color)) 9%,transparent)}
.device[data-item-state=unavailable] .item-state-icon{color:var(--disabled-text-color,var(--secondary-text-color));background:transparent}
.device-controls{display:flex;align-items:center;justify-content:flex-end;box-sizing:border-box;max-width:none;width:100%;min-width:0;padding:0;margin:0;gap:6px;flex-wrap:nowrap;overflow:visible}
.device-controls .target{order:0;flex:0 0 64px;width:64px;min-width:64px;max-width:64px;margin:0;text-align:center;white-space:nowrap;font-size:17px;font-weight:600;line-height:20px;font-variant-numeric:tabular-nums}
.device-controls .toggle{flex:none}.power-icon{width:19px;height:19px;pointer-events:none}
.device:has(.level){grid-template-columns:minmax(0,1fr) minmax(0,calc(var(--control-width) - 52px)) 44px}.device:has(.level) .device-controls{display:contents}.device:has(.level) .level{grid-column:2}.device:has(.level) .toggle{grid-column:3}
.level{display:flex;box-sizing:border-box;flex-direction:row-reverse;flex:1 1 auto;min-width:0;gap:8px;padding:0;margin:0}.level input{flex:1;width:0;min-width:44px;max-width:100%;border-radius:6px}.level output{flex:none;min-width:38px;text-align:end;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.5}
.device[data-power=off] .level{--ui-bar-tone:var(--secondary-text-color)}
.level input::-webkit-slider-runnable-track{height:8px;box-shadow:var(--eleven-material-well,none)}.level input::-webkit-slider-thumb{margin-top:-5px}.level input::-moz-range-track,.level input::-moz-range-progress{height:8px}
.device .identity:focus-visible,.level input:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:0;border-radius:6px}
@container(max-width:279px){.devices .device{grid-template-columns:minmax(0,1fr)}.device-controls{grid-column:1;justify-self:end;width:var(--control-width)}.device:has(.level){grid-template-columns:minmax(0,1fr) 44px}.device:has(.level) .identity{grid-column:1/-1}.device:has(.level) .level{grid-column:1}.device:has(.level) .toggle{grid-column:2}}
`;


const TYPES={actions:'eleven-actions-card',controls:'eleven-controls-card',waste:'eleven-waste-card'};
const TITLES={actions:['Control Pad','Control Pad'],controls:['Bediening','Controls'],waste:['Afvalinzameling','Waste collection']};
const DOMAINS={actions:['scene','script'],controls:['climate','cover','light','fan','switch','input_boolean','number','input_number'],waste:['sensor','calendar']};
const GLYPHS={climate:'mdi:thermostat',cover:'mdi:blinds-horizontal',light:'mdi:lightbulb-outline',fan:'mdi:fan',switch:'mdi:power-socket-eu',input_boolean:'mdi:toggle-switch-outline',number:'mdi:tune',input_number:'mdi:tune'};
const STYLES=`${CSS}
.heading h2{font-size:16px;font-weight:600;line-height:1.3}
:host{height:auto;container-type:inline-size}.content{padding:16px}.heading{margin-bottom:12px}.heading h2{overflow-wrap:anywhere}.empty{padding:8px 0;color:var(--secondary-text-color);font-size:13px}.device{padding:12px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.device+.device{border-top:1px solid var(--divider-color)}.device:first-child{padding-top:0}.device:last-child{padding-bottom:0}.device .identity{flex:1 1 84px}.device .identity span{font-size:14px}.device .identity small{font-size:12px}.device .identity ha-icon{color:var(--primary-color)}.device-controls{display:flex;align-items:center;gap:4px;max-width:100%;margin-left:auto}.device-controls .target{font-size:15px;min-width:42px}.level{flex:1 0 100%;display:flex;align-items:center;gap:10px}.level input{flex:1;min-width:0;min-height:44px;accent-color:var(--primary-color);cursor:pointer}.level output{font-size:12px;font-variant-numeric:tabular-nums;min-width:34px;text-align:right}.device .current{font-size:22px;font-weight:550;font-variant-numeric:tabular-nums;line-height:1.3}.device .current small{display:inline;font-size:13px}.upcoming{padding:2px 0 14px}.eyebrow{text-transform:uppercase;letter-spacing:.06em;font-size:10px;font-weight:650;color:var(--secondary-text-color);margin-bottom:4px}.pickup-date{font-size:24px;font-weight:600;letter-spacing:-.025em;line-height:1.25;overflow-wrap:anywhere}.pickup-meta{font-size:12px;color:var(--secondary-text-color);margin-top:3px}.waste-items{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:12px}.waste-item{display:flex;gap:7px;align-items:center;min-height:44px;padding:0;background:transparent;text-align:left;min-width:0;max-width:100%;font-size:14px}.waste-item span{overflow-wrap:anywhere}.waste-item ha-icon{color:var(--waste-color,var(--primary-color))}.pickup-row{padding:11px 0;border-top:1px solid var(--divider-color);display:flex;gap:8px;align-items:center}.pickup-row .waste-items{flex:1;margin:0;gap:0 14px}.pickup-row .when{font-size:12px;color:var(--secondary-text-color);text-align:right;max-width:42%}.unresolved{border-top:1px solid var(--divider-color);padding-top:10px;font-size:12px;color:var(--secondary-text-color)}.unresolved button[data-info]{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;background:transparent;width:100%;padding:5px 0;font-size:12px}.unresolved button[data-info] span:last-child{text-align:right}.retry{margin-top:8px}.collection-error{color:var(--error-color)}.actions{grid-template-columns:repeat(2,minmax(0,1fr))}.action span{max-width:100%;overflow-wrap:break-word;hyphens:none}@container(min-width:340px){.actions{grid-template-columns:repeat(3,minmax(0,1fr))}}@container(max-width:339px){.device:has(.target) .identity{flex-basis:100%}}@media(max-width:380px){.content{padding:var(--eleven-card-padding,16px)}.device{gap:8px}.pickup-date{font-size:22px}}
`;
// Controls-only geometry and semantic roles; theme owns optional paint/depth.
const CONTROLS_STYLES=controlsPresentationStyles;
// Calendar anatomy is Waste-only; concurrent Actions/Controls output is retained.
const WASTE_STYLES=`
.content{padding:16px}.heading{margin-bottom:12px}
.heading h2{hyphens:auto;overflow-wrap:break-word}
.waste-strip{display:grid;grid-template-columns:repeat(var(--waste-columns,3),minmax(0,1fr));padding:4px;background:var(--secondary-background-color,transparent)}
.pickup{display:grid;grid-template-rows:subgrid;grid-row:span 5;justify-items:center;align-items:center;row-gap:4px;min-width:44px;min-height:44px;padding:8px 4px;text-align:center;background:transparent;border-radius:0;overflow-wrap:normal}
.pickup:hover:not(:disabled){background:color-mix(in srgb,var(--primary-text-color) 5%,transparent)}
.pickup:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:-2px}
.pickup .weekday{font-size:12px;font-weight:400;line-height:1.4;color:var(--secondary-text-color)}
.pickup .day{font-size:30px;font-weight:500;line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap}
.pickup.first .day{font-size:38px;font-weight:650}
.pickup .month{font-size:12px;line-height:1.4;color:var(--secondary-text-color)}
.pickup .name{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:400;line-height:1.4;margin-top:6px;min-width:0;max-width:100%}
.pickup.first .name{font-weight:650}.pickup.first .count{font-weight:600;color:var(--primary-text-color)}
.pickup .name ha-icon{align-self:center;--mdc-icon-size:20px;width:20px;height:20px;color:var(--waste-color,var(--secondary-text-color))}
.pickup .name-text{min-width:0;max-width:100%;hyphens:auto;overflow-wrap:break-word}.pickup .count{font-size:11px;line-height:1.4;color:var(--secondary-text-color)}
.pickup{position:relative}
.waste-word{position:absolute;inset:0 auto auto 0;display:block;width:max-content;max-width:none;white-space:pre;font:inherit;letter-spacing:inherit;visibility:hidden;pointer-events:none}.waste-word::before{content:attr(data-word)}
.pickup+.pickup{border-inline-start:1px solid var(--divider-color)}
.waste-strip[data-columns="3"] .pickup:nth-child(3n+1),.waste-strip[data-columns="2"] .pickup:nth-child(2n+1),.waste-strip[data-columns="1"] .pickup{border-inline-start:0}
.waste-strip[data-columns="1"] .pickup{overflow-wrap:anywhere}
.waste-strip[data-columns="3"] .pickup:nth-child(n+4),.waste-strip[data-columns="2"] .pickup:nth-child(n+3),.waste-strip[data-columns="1"] .pickup:nth-child(n+2){border-block-start:1px solid var(--divider-color)}
`;
const ACTION_STYLES=`
.heading{margin-bottom:16px}.heading h2{font-size:16px;font-weight:600;line-height:1.4;letter-spacing:normal;overflow-wrap:break-word}
.actions{grid-template-columns:repeat(var(--actions-columns,3),minmax(0,1fr));gap:8px}

.action{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:6px;padding:10px;min-height:76px;text-align:start;overflow-wrap:break-word}
.action ha-icon{--mdc-icon-size:28px;width:28px;height:28px;color:var(--secondary-text-color)}.action .split-label{min-width:0;width:100%;font-size:inherit;line-height:1.4}.action .split-label small{font-size:.923076923em;line-height:1.5;margin-top:4px}
.feedback{margin-top:12px;line-height:1.5}
`;
class StandaloneCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._cache={};this._generation=0;this._message='';this._pending=false;}
 get kind(){return this.constructor.kind;}
 static getConfigElement(){const e=document.createElement('eleven-controls-editor');e.kind=this.kind;return e;}
 static getStubConfig(){return {type:'custom:'+TYPES[this.kind],title:TITLES[this.kind][1],...(this.kind==='waste'?{}:{confirmation:false}),[this.kind==='actions'?'actions':'entities']:[]};}
 setConfig(config){
  if(this.kind==='actions'&&config.columns!==undefined&&(!Number.isInteger(config.columns)||config.columns<1||config.columns>6))throw Error('columns: expected an integer from 1 to 6');
  const key=this.kind==='actions'?'actions':'entities';if(config[key]!==undefined&&!Array.isArray(config[key]))throw Error(`${key}: expected a list`);
  const c=structuredClone(config);c[key]=(c[key]||[]).map(normalizeItem);for(const e of c[key]){if(e.entity&&(!/^[a-z_]+\.[a-z0-9_]+$/.test(e.entity)||!DOMAINS[this.kind].includes(e.entity.split('.')[0])))throw Error('Unsupported entity: '+e.entity);}
  this._config=c;this._generation++;this._fetching=false;this._cache={};this._lastFetch=0;this._fingerprint=null;this._message='';this._render();this._refresh();
 }
 set hass(h){this._hass=h;this._render();this._refresh();}get hass(){return this._hass;}
 connectedCallback(){if(this.kind==='actions')this._fingerprint=null;this._render();this._refresh();if(this.kind==='waste'){this._observeWaste();if(!this._timer)this._timer=setInterval(()=>{this._render();this._refresh();},30000);}}
 disconnectedCallback(){clearInterval(this._timer);this._timer=null;this._generation++;this._fetching=false;this._lastFetch=0;this._actionsResize?.disconnect();this._wasteResize?.disconnect();}
 getCardSize(){return Math.max(2,(this._config?.entities?.length||this._config?.actions?.length||1)+1);}
 getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 get nl(){return isNL(this._hass?.locale?.language);}
 t(nl,en){return this.nl?nl:en;}
 state(id){return this._hass?.states?.[id];}
 name(e){return e.name||this.state(e.entity)?.attributes?.friendly_name||e.entity||this.t('Kies een entiteit','Choose an entity');}
 number(v){return finite(v)?new Intl.NumberFormat(this._hass?.locale?.language||'en',{maximumFractionDigits:2}).format(Number(v)):'—';}
 more(id){if(id)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));}
 button(i,action,label,ico,request){return uiButton({variant:'action-icon',label,title:label,content:icon(ico),disabled:!request||this._pending,attrs:{'data-index':i,'data-action':action,'data-key':`${i}-${action}`}});}
 async _refresh(force=false){
  if(this.kind!=='waste'||!this.isConnected||!this._hass?.callApi||!this._config||this._fetching||(!force&&this._lastFetch&&Date.now()-this._lastFetch<300000))return;
  const ids=[...new Set(this._config.entities.filter(e=>e.entity?.startsWith('calendar.')&&available(this.state(e.entity))).map(e=>e.entity))];if(!ids.length)return;
  const generation=this._generation;this._fetching=true;this._lastFetch=Date.now();this._render();const start=new Date();start.setUTCHours(0,0,0,0);start.setUTCDate(start.getUTCDate()-1);const end=new Date(start.getTime()+62*86400000);
  await Promise.all(ids.map(async id=>{try{const events=await this._hass.callApi('GET',`calendars/${encodeURIComponent(id)}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);if(!Array.isArray(events))throw Error('Invalid calendar response');if(generation===this._generation)this._cache[id]={events};}catch{if(generation===this._generation)this._cache[id]={error:true};}}));
  if(generation===this._generation){this._fetching=false;this._render();}
 }
 _render(){
  if(!this._config)return;const c=this._config,items=c[this.kind==='actions'?'actions':'entities'];
  const fp=JSON.stringify([c,this._cache,this._message,this._error,this._pending,this._hass?.locale,this._hass?.config?.time_zone,this.kind==='waste'?[Math.floor(Date.now()/30000),this._fetching]:null,items.map(e=>this.state(e.entity))]);if(fp===this._fingerprint)return;this._fingerprint=fp;
  const active=this.shadowRoot.activeElement,focus=active?.dataset.key;
  let body=this.kind==='actions'?this._actions(items):this.kind==='controls'?this._controls(items):this._waste(items);
  if(!items.length)body=`<div class="empty">${this.t('Voeg onderdelen toe via de kaartinstellingen.','Add items in the card settings.')}</div>`;
  const title=c.title??TITLES[this.kind][this.nl?0:1];
  this.shadowRoot.innerHTML=`<style>${STYLES}${uiBarStyles()}${cardThemeStyles(this.kind==='waste'?{wells:'.waste-strip'}:{})}${uiActionButtonStyles()}${this.kind==='actions'?ACTION_STYLES:this.kind==='waste'?WASTE_STYLES:CONTROLS_STYLES}</style><ha-card${this.kind==='waste'?' tabindex="-1"':''}><div class="content">${title?`<div class="heading"><h2>${esc(title)}</h2></div>`:''}${body}<div class="feedback ${this._error?'error':''}" role="status" aria-live="polite">${esc(this._message)}</div></div></ha-card>`;
  this.shadowRoot.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>this.more(b.dataset.info)));
  this.shadowRoot.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>this.activate(Number(b.dataset.index),b.dataset.action)));
  this.shadowRoot.querySelectorAll('input[data-level]').forEach(b=>{b.addEventListener('input',()=>{syncUISlider(b);b.nextElementSibling.value=b.value+'%';});b.addEventListener('change',()=>this.activate(Number(b.dataset.level),'level',Number(b.value)));});
  this.shadowRoot.querySelector('[data-retry]')?.addEventListener('click',()=>this._refresh(true));
  if(focus){const target=this.shadowRoot.querySelector(`[data-key="${CSSescape(focus)}"]`);
   (target||(this.kind==='waste'?(this.shadowRoot.querySelector('[data-info]')||this.shadowRoot.querySelector('ha-card')):null))?.focus();
  }
  if(this.kind==='actions'&&typeof ResizeObserver==='function'){
   this._actionsResize??=new ResizeObserver(()=>this._fitActions());this._actionsResize.disconnect();
   this._fitActions();this._actionsResize.observe(this);
   this.shadowRoot.querySelectorAll('.split-label,.split-label small').forEach(e=>this._actionsResize.observe(e));
  }
  if(this.kind==='waste')this._observeWaste();
 }
 _observeWaste(){
  this._wasteResize?.disconnect();
  const grid=this.shadowRoot.querySelector('.waste-strip');if(!grid||typeof getComputedStyle!=='function')return;
  // Intrinsic DOM probes mirror each actual label's computed font longhands.
  // Observe real text boxes plus unwrapped metrics, not only the host: text-only
  // zoom/font loading refits without canvas shorthand or line-height ambiguity.
  grid.querySelectorAll('.pickup').forEach(button=>button.querySelectorAll('.weekday,.day,.month,.name-text,.count').forEach(label=>{
   if(label._wasteWords)return;
   label._wasteWords=[];
   for(const word of label.textContent.split(/\s+/u).filter(Boolean)){
    const probe=document.createElement('span');probe.className='waste-word';probe.setAttribute('data-word',word);probe.setAttribute('aria-hidden','true');button.append(probe);label._wasteWords.push(probe);
   }
  }));
  this._fitWaste();
  if(typeof ResizeObserver==='function'){
   this._wasteResize??=new ResizeObserver(()=>this._fitWaste());
   this._wasteResize.observe(this);this._wasteResize.observe(grid);
   grid.querySelectorAll('.weekday,.day,.month,.name-text,.count,.waste-word').forEach(e=>this._wasteResize.observe(e));
  }
 }
 _fitWaste(){
  const grid=this.shadowRoot.querySelector('.waste-strip');if(!grid)return;
  const buttons=grid.querySelectorAll('.pickup'),gs=getComputedStyle(grid),n=v=>parseFloat(v)||0;
  let minimum=44;
  buttons.forEach(button=>{
   // The one-pixel divider disappears on single/row-leading cells. Reserve
   // that space for every candidate so the chosen column count cannot alter
   // its own fitting input and oscillate at the one/two-column threshold.
   const bs=getComputedStyle(button),chrome=n(bs.paddingLeft)+n(bs.paddingRight)+1;
   button.querySelectorAll('.weekday,.day,.month,.name-text,.count').forEach(label=>{
    let width=0;const textStyle=getComputedStyle(label);
    (label._wasteWords||[]).forEach(word=>{
     // Longhands deliberately avoid computed font shorthand with a line-height.
     for(const property of ['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','fontVariant','fontFeatureSettings','fontVariationSettings','lineHeight','letterSpacing','textTransform'])word.style[property]=textStyle[property];
     width=Math.max(width,word.getBoundingClientRect().width);
    });
    if(label.classList?.contains('name-text')){
     const name=button.querySelector('.name'),glyph=name?.querySelector('ha-icon');
     // The icon may wrap above the full name on narrow three-column strips.
     width=Math.max(width,glyph?.getBoundingClientRect().width||0);
    }
    minimum=Math.max(minimum,Math.ceil(width+chrome));
   });
  });
  const width=grid.clientWidth-n(gs.paddingLeft)-n(gs.paddingRight),gap=n(gs.columnGap);
  if(width<=0)return;
  const columns=String(Math.max(1,Math.min(3,buttons.length,Math.floor((width+gap)/(minimum+gap)))));
  if(grid.style.getPropertyValue('--waste-columns')!==columns)grid.style.setProperty('--waste-columns',columns);
  grid.dataset.columns=columns;
 }
 _fitActions(){
  const grid=this.shadowRoot.querySelector('.actions');if(!grid)return;
  // Vertical chrome excludes the icon: labels use the full inner width.
  // Configured columns are a maximum; retain empty cells for short/single lists.
  const ctx=document.createElement('canvas').getContext('2d');let minimum=44;
  grid.querySelectorAll('.action').forEach(button=>{
   const bs=getComputedStyle(button),icon=button.querySelector('ha-icon');
   const chrome=parseFloat(bs.paddingLeft)+parseFloat(bs.paddingRight)+parseFloat(bs.borderLeftWidth)+parseFloat(bs.borderRightWidth);
   minimum=Math.max(minimum,chrome+parseFloat(getComputedStyle(icon).width));
   button.querySelectorAll('.split-label,.split-label small').forEach(label=>{
    const s=getComputedStyle(label);ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const text=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ');
    for(const word of text.split(/\s+/).filter(Boolean))minimum=Math.max(minimum,chrome+ctx.measureText(word).width+(parseFloat(s.letterSpacing)||0)*word.length+2);
   });
  });
  const gap=parseFloat(getComputedStyle(grid).columnGap)||0;
  const columns=Math.max(1,Math.min(this._config.columns??3,Math.floor((grid.clientWidth+gap)/(Math.ceil(minimum)+gap))));
  const value=String(columns);if(grid.style.getPropertyValue('--actions-columns')!==value)grid.style.setProperty('--actions-columns',value);
 }
 _actions(items){return `<div class="actions" aria-busy="${this._pending}">${items.map((e,i)=>uiButton({variant:'action',className:'action',label:e.aria_label||this.name(e),disabled:!actionRequest(this.state(e.entity),e.entity)||this._pending,attrs:{'data-index':i,'data-action':'run','data-key':`${i}-run`},content:`${icon(e.icon||'mdi:play-outline')}<span class="split-label">${esc(this.name(e))}${e.description?`<small>${esc(e.description)}</small>`:''}${!available(this.state(e.entity))?`<small>${this.t('Niet beschikbaar','Unavailable')}</small>`:''}</span>`})).join('')}</div>`;}
 _controls(items){return `<div class="devices">${items.map((e,i)=>{
  const s=this.state(e.entity),a=s?.attributes||{},domain=e.entity?.split('.')[0],ok=available(s),name=this.name(e);let controls='',status=!ok?this.t('Niet beschikbaar','Unavailable'):({on:this.t('Aan','On'),off:this.t('Uit','Off'),open:this.t('Open','Open'),closed:this.t('Dicht','Closed'),opening:this.t('Gaat open','Opening'),closing:this.t('Gaat dicht','Closing')}[s.state]||s.state),extra='';
  const request=(act,v)=>controlRequest(s,e.entity,act,v),btn=(act,label,ico)=>this.button(i,act,`${name}: ${label}`,ico,request(act));
  if(domain==='climate'){
   status=ok?`${this.number(a.current_temperature)} ${this._hass?.config?.unit_system?.temperature||'°C'} · ${a.hvac_action==='heating'?this.t('Verwarmen','Heating'):a.hvac_action==='cooling'?this.t('Koelen','Cooling'):this.t('Huidig','Current')}`:status;
   if(Number(a.supported_features)&1)controls=btn('down',this.t('Lager','Decrease'),'mdi:minus')+`<span class="target" title="${this.t('Ingestelde temperatuur','Target temperature')}">${ok?this.number(a.temperature)+' '+esc(this._hass?.config?.unit_system?.temperature||'°C'):'—'}</span>`+btn('up',this.t('Hoger','Increase'),'mdi:plus');
  }else if(domain==='cover'){
   status=ok&&finite(a.current_position)?`${a.current_position}% · ${status}`:status;
   controls=btn('open',this.t('Openen','Open'),'mdi:arrow-up')+btn('stop',this.t('Stoppen','Stop'),'mdi:stop')+btn('close',this.t('Sluiten','Close'),'mdi:arrow-down');
  }else if(['number','input_number'].includes(domain)){
   status=ok?`${this.number(s.state)} ${a.unit_of_measurement||''}`:status;
   controls=btn('down',this.t('Lager','Decrease'),'mdi:minus')+btn('up',this.t('Hoger','Increase'),'mdi:plus');
  }else if(['light','fan','switch','input_boolean'].includes(domain)){
   controls=uiButton({variant:'action-icon',className:'toggle',label:name+': '+(s?.state==='on'?this.t('Uitschakelen','Turn off'):this.t('Inschakelen','Turn on')),content:controlPowerIcon,disabled:!request('toggle')||this._pending,attrs:{'data-index':i,'data-action':'toggle','data-key':`${i}-toggle`,'aria-pressed':s?.state==='on'}});
  }
  const level=domain==='light'&&finite(a.brightness)?Math.round(Number(a.brightness)/255*100):domain==='fan'?a.percentage:domain==='cover'?a.current_position:null;
  if(domain!=='cover'&&request('level',50))extra=`<label class="level">${uiSlider({value:finite(level)?Number(level):0,step:domain==='fan'&&finite(a.percentage_step)&&Number(a.percentage_step)>0?Number(a.percentage_step):1,disabled:this._pending,attrs:{'data-key':`${i}-level`,'data-level':String(i),'aria-label':name+': '+this.t('Niveau','Level')}})}<output>${finite(level)?esc(level)+'%':'—'}</output></label>`;
  const itemState=controlItemState(domain,s);
  return `<div class="device" data-domain="${esc(domain)}" data-item-state="${itemState}" data-power="${s?.state==='off'?'off':'on'}"><button type="button" class="identity" data-info="${esc(e.entity)}" data-key="${i}-info" title="${esc(name+': '+status)}" aria-label="${esc(name+': '+status)}">${controlItemIcon(domain,s,itemState,e.icon)}<span>${esc(name)}<small>${esc(status)}</small></span></button><div class="device-controls">${extra}${controls}</div></div>`;
 }).join('')}</div>`;}
 _waste(items){
  const rows=wasteRows(items,this._hass?.states,this._cache,{locale:this._hass?.locale?.language,timeZone:this._hass?.config?.time_zone}),groups=groupWaste(rows),unresolved=rows.filter(e=>!e.date);
  const locale=this._hass?.locale?.language||'en';
  const format=(date,options)=>new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  const pickups=groups.flatMap(g=>g.items.map(e=>({g,e})));
  const pickup=({g,e},i)=>{
   // Identity matches groupWaste's existing entity/date/name deduplication, not position.
   const key='pickup-'+encodeURIComponent(JSON.stringify([e.entity,g.date,e.name]));
   const absolute=format(g.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
   const count=g.days<=1?g.label:this.t(`Over ${g.days} dagen`,`In ${g.days} days`);
   const todayYear=g.date.slice(0,4)!==dayKey(Date.now(),this._wasteTimeZone()).slice(0,4);
   return `<button type="button" class="pickup${i===0?' first':''}" data-info="${esc(e.entity)}" data-key="${esc(key)}" aria-label="${esc(e.name+': '+absolute+', '+count)}" style="${e.color?'--waste-color:'+esc(e.color):''}"><span class="weekday">${esc(format(g.date,{weekday:'long'}))}</span><span class="day">${esc(format(g.date,{day:'2-digit'}))}</span><span class="month">${esc(format(g.date,{month:'long',...(todayYear?{year:'numeric'}:{})}))}</span><span class="name">${icon(e.icon)}<span class="name-text">${esc(e.name)}</span></span><span class="count">${esc(count)}</span></button>`;
  };
  return `${pickups.length?`<section class="waste-strip" aria-label="${this.t('Volgende inzameling','Next collection')}" data-columns="${Math.min(3,pickups.length)}" style="--waste-columns:${Math.min(3,pickups.length)}">${pickups.map(pickup).join('')}</section>`:`<div class="empty">${this.t('Geen komende inzameling bekend.','No upcoming collection available.')}</div>`}${unresolved.length?`<div class="unresolved">${unresolved.map(e=>`<button type="button" data-info="${esc(e.entity)}" data-key="${esc('unresolved-'+encodeURIComponent(JSON.stringify([e.entity,e.name])))}"><span>${esc(e.name)}</span><span class="${e.status==='error'?'collection-error':''}">${esc(e.label)}</span></button>`).join('')}${unresolved.some(e=>e.status==='error')?uiButton({variant:'action',className:'retry',text:this.t('Opnieuw proberen','Retry'),attrs:{'data-retry':'','data-key':'waste-retry','aria-busy':!!this._fetching,'aria-disabled':!!this._fetching}}):''}</div>`:''}`;
 }
 _wasteTimeZone(){const zone=this._hass?.config?.time_zone||'UTC';try{dayKey(Date.now(),zone);return zone;}catch{return 'UTC';}}
 async activate(index,action,value){
  if(this._pending)return;const item=this._config[this.kind==='actions'?'actions':'entities'][index];if(!item)return;
  const request=this.kind==='actions'?actionRequest(this.state(item.entity),item.entity):controlRequest(this.state(item.entity),item.entity,action,value);if(!request||!this._hass?.callService)return;
  if(this._config.confirmation===true&&!window.confirm(item.confirmation||this.t(`${this.name(item)}: opdracht uitvoeren?`,`${this.name(item)}: execute command?`))){this._fingerprint=null;this._render();return;}
  const actionFocus=(this.kind==='actions'||this.kind==='controls')?this.shadowRoot.activeElement?.dataset.key:null;
  this._pending=true;this._error=false;this._message=this.kind==='actions'?'':this.t('Bezig…','Sending…');this._render();
  try{await this._hass.callService(request.domain,request.service,request.data);this._message=this.kind==='actions'?'':this.t('Opdracht verstuurd','Command sent');}catch(e){this._error=true;this._message=this.t('Niet uitgevoerd: ','Not executed: ')+(e?.message||this.t('verbindingsfout','connection failed'));}finally{this._pending=false;this._render();
   // Disabled native action buttons lose focus. Restore only if focus was not moved elsewhere.
   if(actionFocus&&(document.activeElement===document.body||document.activeElement===this))this.shadowRoot.querySelector(`[data-key="${CSSescape(actionFocus)}"]`)?.focus();
  }
 }
}
class ActionsCard extends StandaloneCard{static kind='actions';}
class ControlsCard extends StandaloneCard{static kind='controls';}
class WasteCard extends StandaloneCard{static kind='waste';}

class ControlsEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.kind='controls';}
 setConfig(config){this._config=structuredClone(config);this.kind=Object.keys(TYPES).find(k=>'custom:'+TYPES[k]===config.type)||this.kind;this.render();}
 set hass(h){this._hass=h;this.render();}get hass(){return this._hass;}
 get nl(){return isNL(this._hass?.locale?.language);}t(n,en){return this.nl?n:en;}
 emit(c){this._config=c;this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(c)},bubbles:true,composed:true}));}
 form(host,schema,data,onChange){const form=document.createElement('ha-form');form.hass=this._hass;form.schema=schema;form.data=data;form.computeLabel=s=>({title:this.t('Titel','Title'),confirmation:this.t('Bevestigen vóór bedienen','Confirm before commands'),columns:this.t('Maximum aantal kolommen','Maximum columns'),entity:this.t('Entiteit','Entity'),name:this.t('Naam (optioneel)','Name (optional)'),icon:this.t('Icoon (optioneel)','Icon (optional)'),description:this.t('Onderschrift','Description'),source:this.t('Datumbron','Date source'),attribute:this.t('Attribuut (optioneel)','Attribute (optional)'),color:this.t('Kleur (optioneel)','Color (optional)'),filter:this.t('Kalender bevat (optioneel)','Calendar summary contains (optional)')}[s.name]||s.name);form.addEventListener('value-changed',ev=>{ev.stopPropagation();onChange(ev.detail.value);});host.append(form);}
 render(){
  if(!this._config)return;const focus=this.shadowRoot.activeElement; // Do not rebuild native HA selectors on ordinary hass updates.
  if(this._builtConfig===this._config){this.shadowRoot.querySelectorAll('ha-form').forEach(f=>{f.hass=this._hass;});return;}
  this._builtConfig=this._config;const key=this.kind==='actions'?'actions':'entities',items=(this._config[key]||[]).map(normalizeItem);
  this.shadowRoot.innerHTML=`<style>:host{display:block;color:var(--primary-text-color)}.item{padding:16px 0;border-top:1px solid var(--divider-color)}.bar{display:flex;align-items:center;gap:4px}.bar strong{flex:1;font-size:14px;overflow-wrap:anywhere}${uiActionButtonStyles()}.add{padding:0 16px;margin-top:12px}p{font-size:12px;color:var(--secondary-text-color);line-height:1.5}ha-form{display:block}</style><div class="main"></div><p>${this.kind==='waste'?this.t('Gebruik een datumsensor, een aftelsensor of een kalender. Automatisch herkent ISO-datums en daysTo. Kalenderafspraken worden 60 dagen vooruit geladen.','Use a date sensor, day-count sensor or calendar. Auto recognizes ISO dates and daysTo. Calendar events are loaded 60 days ahead.'):this.kind==='controls'?this.t('Voeg alleen de apparaten toe die je hier wilt bedienen. De knoppen passen zich aan de mogelijkheden aan.','Add the devices you want to control. Controls follow each entity’s capabilities.'):this.t('Voeg scènes of scripts toe. Elke actie heeft een eigen naam en icoon.','Add scenes or scripts. Each action has its own name and icon.')}</p><div class="items"></div>${uiButton({variant:'action',className:'add',text:this.t('Onderdeel toevoegen','Add item')})}`;
  this.form(this.shadowRoot.querySelector('.main'),[{name:'title',selector:{text:{}}},...(this.kind==='waste'?[]:[{name:'confirmation',selector:{boolean:{}}}]),...(this.kind==='actions'?[{name:'columns',selector:{number:{min:1,max:6,step:1,mode:'box'}}}]:[])],this.kind==='actions'?{...this._config,columns:this._config.columns??3}:this._config,v=>{this.emit({...this._config,...v});});
  items.forEach((e,i)=>{
   const box=document.createElement('section');box.className='item';box.innerHTML=`<div class="bar"><strong>${esc(e.name||e.entity||this.t('Nieuw onderdeel','New item'))}</strong>${uiButton({variant:'action-icon',label:this.t('Omhoog','Move up'),text:'↑',disabled:i===0,attrs:{'data-move':-1}})}${uiButton({variant:'action-icon',label:this.t('Omlaag','Move down'),text:'↓',disabled:i===items.length-1,attrs:{'data-move':1}})}${uiButton({variant:'action-danger',label:this.t('Verwijderen','Remove'),text:'×',attrs:{'data-remove':''}})}</div><div class="fields"></div>`;
   const schema=[{name:'entity',required:true,selector:{entity:{domain:DOMAINS[this.kind]}}},{name:'name',selector:{text:{}}},{name:'icon',selector:{icon:{}}}];
   if(this.kind==='actions')schema.push({name:'description',selector:{text:{}}});
   if(this.kind==='waste')schema.push({name:'source',selector:{select:{options:[{value:'auto',label:this.t('Automatisch','Auto')},{value:'date',label:this.t('Datum','Date')},{value:'days',label:this.t('Aantal dagen','Day count')}]}}},{name:'attribute',selector:{text:{}}},{name:'color',selector:{color_rgb:{}}},{name:'filter',selector:{text:{}}});
   this.form(box.querySelector('.fields'),schema,{...e,...(this.kind==='waste'?{source:e.source||'auto',color:Array.isArray(e.color)?e.color:/^#[\da-f]{6}$/i.test(e.color||'')?[1,3,5].map(n=>parseInt(e.color.slice(n,n+2),16)):undefined}:{})},v=>{const next=(this._config[key]||[]).map(normalizeItem);next[i]={...next[i],...v};this.emit({...this._config,[key]:next});});
   box.querySelector('[data-remove]').onclick=()=>{const next=(this._config[key]||[]).filter((_,n)=>n!==i);this.emit({...this._config,[key]:next});this.render();};
   box.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const next=[...this._config[key]],j=i+Number(b.dataset.move);[next[i],next[j]]=[next[j],next[i]];this.emit({...this._config,[key]:next});this.render();});
   this.shadowRoot.querySelector('.items').append(box);
  });
  this.shadowRoot.querySelector('.add').onclick=()=>{this.emit({...this._config,[key]:[...(this._config[key]||[]),{entity:''}]});this.render();};
 }
}
for(const [tag,cls] of [['eleven-controls-editor',ControlsEditor],[TYPES.actions,ActionsCard],[TYPES.controls,ControlsCard],[TYPES.waste,WasteCard]])if(!customElements.get(tag))customElements.define(tag,tag.endsWith('-editor')?cls:withCardBackground(cls));
// Home Assistant retains this array by reference: never replace it.
window.customCards=window.customCards||[];
// Clean stale picker metadata only; the retired element and mode editor are not implemented.
for(let i=window.customCards.length-1;i>=0;i--)if(window.customCards[i].type==='eleven-home-controls-card')window.customCards.splice(i,1);
for(const kind of Object.keys(TYPES))if(!window.customCards.some(c=>c.type===TYPES[kind]))window.customCards.push({type:TYPES[kind],name:'Eleven '+TITLES[kind][1],description:{actions:'Scenes and scripts at your fingertips',controls:'Configurable device controls',waste:'Upcoming waste collection from sensors and calendars'}[kind],preview:true});

})();
