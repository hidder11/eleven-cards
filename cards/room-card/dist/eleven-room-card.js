// Eleven Room Card - local beta
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

function normalizeRoom(c={}){
 if(!String(c.name??'').trim())throw Error('Geef de ruimte een naam');
 if(c.navigation_path&&!/^\/(?!\/)[a-zA-Z0-9_\-/]+$/.test(c.navigation_path))throw Error('Gebruik een lokaal dashboardpad');
 const lights=[...new Set(c.lights??[])];
 if(lights.some(id=>!/^light\.[a-z0-9_]+$/.test(id)))throw Error('Kies alleen lampen');
 if(c.scenes!=null&&!Array.isArray(c.scenes))throw Error('Kies een lijst met scenes');
 const scenes=[...new Set(c.scenes??[])];
 if(scenes.some(id=>typeof id!=='string'||!/^scene\.[a-z0-9_]+$/.test(id)))throw Error('Kies alleen scenes');
 return {...c,name:String(c.name),icon:c.icon||'mdi:home-outline',lights,scenes,show_scene_names:c.show_scene_names===true};
}
function temperatureText(s,locale='nl-NL'){
 if(!s||s.state==null||String(s.state).trim()===''||!Number.isFinite(Number(s.state)))return '';
 return new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(Number(s.state))+(s.attributes?.unit_of_measurement?' '+s.attributes.unit_of_measurement:'');
}
function roomStatus(ids=[],states={}){
 const unique=[...new Set(ids)],total=unique.length;
 const on=unique.filter(id=>states[id]?.state==='on').length;
 const unavailable=unique.filter(id=>!states[id]||['unknown','unavailable'].includes(states[id].state)).length;
 const label=!total?'Nog niet gekoppeld':[on?`${on} aan`:unavailable?'':'Licht uit',unavailable?`${unavailable} niet beschikbaar`:''].filter(Boolean).join(' · ');
 return {total,on,unavailable,label};
}

function humidityText(state,locale='nl-NL'){
 if(state?.state==null||String(state.state).trim()==='')return '';
 const value=Number(state.state);if(!Number.isFinite(value)||value<0||value>100)return '';
 return temperatureText({...state,attributes:{...state.attributes,unit_of_measurement:'%'}},locale);
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class RoomCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 static getConfigForm(){return {schema:[
  {name:'name',required:true,selector:{text:{}}},
  {name:'icon',selector:{icon:{}}},
  {name:'scenes',selector:{entity:{domain:'scene',multiple:true}}},
  {name:'show_scene_names',selector:{boolean:{}}},
  {name:'lights',selector:{entity:{domain:'light',multiple:true}}},
  {name:'temperature_entity',selector:{entity:{domain:'sensor',device_class:'temperature'}}},
  {name:'humidity_entity',selector:{entity:{domain:'sensor',device_class:'humidity'}}},
  {name:'navigation_path',selector:{text:{}}},
  {name:'note',selector:{text:{}}}
 ],computeLabel:s=>({name:'Ruimtenaam',icon:'Icoon',scenes:'Scenes',show_scene_names:'Tekst bij sceneknoppen',lights:'Lampen (geen groepen én hun leden)',temperature_entity:'Temperatuursensor',humidity_entity:'Luchtvochtigheidssensor',navigation_path:'Pad naar ruimtepagina',note:'Toelichting / testkoppeling'}[s.name]??s.name)};}
 static getStubConfig(){return {name:'Nieuwe ruimte',icon:'mdi:home-outline',lights:[]};}
 setConfig(c){this._config=normalizeRoom(c);this._sceneError=false;this._render();}
 set hass(h){this._hass=h;this._render();}get hass(){return this._hass;}
 getCardSize(){return 2;}
 getGridOptions(){return {columns:6,min_columns:6,rows:'auto',min_rows:2};}
 _moreInfo(entityId){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));}
 async _activateScene(entity){
  const hass=this._hass,state=hass?.states?.[entity];
  if(this._scenePending||!this._config.scenes.includes(entity)||!state||state.state==='unavailable'||hass.connected===false||!hass.callService)return;
  this._scenePending=true;this._sceneError=false;this._render();
  try{await hass.callService('scene','turn_on',{entity_id:entity});}catch{this._sceneError=true;}
  finally{this._scenePending=false;const restore=!this.shadowRoot.activeElement;this._render();if(restore)[...this.shadowRoot.querySelectorAll('[data-scene]')].find(button=>button.dataset.scene===entity)?.focus();}
 }
 _render(){
  if(!this._config)return;
  const c=this._config,s=roomStatus(c.lights,this._hass?.states),temp=temperatureText(this._hass?.states?.[c.temperature_entity],this._hass?.locale?.language||'nl-NL');
  const humidity=humidityText(this._hass?.states?.[c.humidity_entity],this._hass?.locale?.language||'nl-NL');
  const focused=this.shadowRoot.activeElement?.className,focusedScene=this.shadowRoot.activeElement?.dataset?.scene;
  const dutch=!this._hass?.language||this._hass.language.startsWith('nl');
  const scenes=c.scenes.length?`<div class="scene-row"><span class="scene-label">Scenes</span><div class="scene-actions" role="group" aria-label="Scenes" aria-busy="${Boolean(this._scenePending)}">${c.scenes.map(entity=>{const state=this._hass?.states?.[entity],name=state?.attributes?.friendly_name||entity,icon=state?.attributes?.icon||'mdi:palette-outline';return uiButton({content:`<ha-icon icon="${esc(icon)}" aria-hidden="true"></ha-icon>${c.show_scene_names?`<span>${esc(name)}</span>`:''}`,label:name,title:name,variant:'action',className:'scene-button room-button',disabled:Boolean(this._scenePending)||!state||state.state==='unavailable'||this._hass?.connected===false||!this._hass?.callService,attrs:{'data-scene':entity}});}).join('')}</div></div>`:'';
  this.shadowRoot.innerHTML=`<style>${uiActionButtonStyles()}
   :host{display:block;min-width:0;height:100%}ha-card{display:block;box-sizing:border-box;height:100%;overflow:hidden;background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color);border-radius:var(--ha-card-border-radius,16px)}
   .room{padding:var(--eleven-card-padding,16px);min-height:132px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;font-family:inherit}
   .head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.climate{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:4px 10px;margin-inline-start:auto;min-width:0;max-width:100%;font-size:13px;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}.temp,.humidity{white-space:nowrap}
   a,.identity{color:inherit;text-decoration:none;min-height:44px;display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0;border-radius:4px}a:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
   .name{font-size:16px;font-weight:600;line-height:1.25;letter-spacing:-.01em;overflow-wrap:anywhere}.note{position:relative;display:block;padding-inline-start:8px;font-size:12px;font-weight:400;letter-spacing:0;color:var(--secondary-text-color,#626a78);line-height:1.4;overflow-wrap:anywhere}.note::before{content:'';position:absolute;inset-inline-start:0;top:2px;width:2px;height:12px;border-radius:1px;background:var(--accent-color,var(--primary-color,#2196f3))}
   .status{display:flex;align-items:center;gap:6px;font-size:12px;line-height:1.45;color:var(--secondary-text-color);overflow-wrap:anywhere;min-width:0}
   footer{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:auto}.room-button.on{color:color-mix(in srgb,var(--primary-color) 40%,var(--primary-text-color))}.room-button ha-icon{--mdc-icon-size:16px;flex:none;width:16px;height:16px}
   .scene-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px}.scene-label{font-size:12px;line-height:1.45;color:var(--secondary-text-color)}.scene-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px;min-width:0}.scene-actions .scene-button{max-width:100%}.scene-actions .scene-button:has(span){width:auto;padding-inline:8px}.scene-button span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.scene-error{margin:0;font-size:12px;line-height:1.4;color:var(--error-color)}
  ${cardThemeStyles()}</style><ha-card><div class="room"><div class="head">
  ${c.navigation_path?`<a class="identity" href="${esc(c.navigation_path)}" aria-label="Open ${esc(c.name)}">`:'<div class="identity">'}<span class="name">${esc(c.name)}</span>${c.note?`<span class="note">${esc(c.note)}</span>`:''}${c.navigation_path?'</a>':'</div>'}
  ${temp||humidity?`<div class="climate">${temp?`<span class="temp" aria-label="${dutch?'Temperatuur':'Temperature'} ${esc(temp)}">${esc(temp)}</span>`:''}${humidity?`<span class="humidity" aria-label="${dutch?'Luchtvochtigheid':'Humidity'} ${esc(humidity)}">${esc(humidity)}</span>`:''}</div>`:''}</div>
  ${scenes}${this._sceneError?`<p class="scene-error" role="alert">${dutch?'Scene kon niet worden gestart. Probeer opnieuw.':'Could not activate scene. Try again.'}</p>`:''}
  <footer><span class="status">${esc(s.label)}</span>${s.total?`${uiButton({variant:'action-icon',className:`control room-button ${s.on?'on':''}`,label:`Bedien verlichting ${c.name}`,disabled:s.unavailable===s.total,content:'<ha-icon icon="mdi:lightbulb-outline"></ha-icon>'})}`:''}</footer></div></ha-card>`;
  const link=this.shadowRoot.querySelector('a');if(link)link.onclick=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,'',c.navigation_path);window.dispatchEvent(new Event('location-changed'));};
  const control=this.shadowRoot.querySelector('.control');if(control)control.onclick=()=>this._moreInfo(c.lights.find(id=>!['unknown','unavailable'].includes(this._hass?.states?.[id]?.state)&&this._hass?.states?.[id])||c.lights[0]);
  for(const button of this.shadowRoot.querySelectorAll('[data-scene]'))button.onclick=()=>this._activateScene(button.dataset.scene);
  if(focusedScene)[...this.shadowRoot.querySelectorAll('[data-scene]')].find(button=>button.dataset.scene===focusedScene)?.focus();
  else if(focused)this.shadowRoot.querySelector('.'+focused.split(' ')[0])?.focus();
 }
}

if(!customElements.get('eleven-room-card'))customElements.define('eleven-room-card',withCardBackground(RoomCard));
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-room-card'))window.customCards.push({type:'eleven-room-card',name:'Eleven Room (beta)',description:'Ruimtestatus en navigatie, met bestaande apparaten',preview:true});
})();
