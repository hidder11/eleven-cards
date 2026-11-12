// Eleven Media Player (beta) - self-contained module
(()=>{

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

// Shared typography for text titles; the caller owns the heading and its content.
function uiCardTitleStyles(selector){return `${selector}{font-size:18px;line-height:1.25;font-weight:650;letter-spacing:-.01em;margin:0;overflow-wrap:anywhere}`;}

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


const MEDIA_LAYOUTS=['classic','poster','horizontal','studio','minimal'];
const MEDIA_FEATURES={media_pause:1,media_seek:2,volume_set:4,volume_mute:8,media_previous_track:16,media_next_track:32,turn_on:128,turn_off:256,play_media:512,select_source:2048,media_stop:4096,media_play:16384};
const mediaDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
function normalizeMediaConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid media player configuration');
 const entity=input.entity??'';
 if(typeof entity!=='string'||(entity&&!/^media_player\.[a-z0-9_]+$/.test(entity)))throw Error('Choose a media_player entity / Kies een media_player-entiteit');
 const stations=Array.isArray(input.stations)?input.stations.map(row=>({name:typeof row?.name==='string'?row.name:'',media_content_id:typeof row?.media_content_id==='string'?row.media_content_id:'',media_content_type:typeof row?.media_content_type==='string'?row.media_content_type:'music'})):[];
 return {...input,entity,stations,title:typeof input.title==='string'?input.title:'',layout:MEDIA_LAYOUTS.includes(input.layout)?input.layout:'studio',compact:input.compact===true,radio_mode:input.radio_mode===true,background:input.background==null||input.background==='none'?'none':HEADER_BACKGROUNDS.some(item=>item.value===input.background)?input.background:'lanes',background_strength:typeof input.background_strength==='number'&&Number.isFinite(input.background_strength)?Math.max(0,Math.min(100,input.background_strength)):100,animate_background:input.animate_background!==false,...Object.fromEntries(['show_artwork','show_progress','show_volume','show_source','show_power'].map(key=>[key,input[key]!==false]))};
}
const mediaNumber=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
function mediaAvailability(hass,entity){
 if(!entity)return 'setup';
 if(hass?.connected===false||hass?.connection?.connected===false)return 'offline';
 const state=hass?.states?.[entity]?.state;
 return state==null?'missing':['unavailable','unknown'].includes(state)?state:null;
}
function mediaCan(hass,entity,service){
 if(mediaAvailability(hass,entity)||!MEDIA_FEATURES[service]||!hass?.services?.media_player?.[service])return false;
 const state=hass.states[entity];
 if(state.state==='off'&&service!=='turn_on')return false;
 if(state.state!=='off'&&service==='turn_on')return false;
 return (Number(state.attributes?.supported_features)&MEDIA_FEATURES[service])!==0;
}
function mediaPosition(state,now=Date.now()){
 const attrs=state?.attributes??{},duration=mediaNumber(attrs.media_duration),reported=mediaNumber(attrs.media_position);
 if(duration===null||duration<=0)return {duration:null,position:null};
 if(reported===null)return {duration,position:null};
 const updated=Date.parse(attrs.media_position_updated_at),elapsed=state.state==='playing'&&Number.isFinite(updated)?Math.max(0,(now-updated)/1000):0;
 return {duration,position:Math.max(0,Math.min(duration,reported+elapsed))};
}
function mediaTime(seconds){if(mediaNumber(seconds)===null)return '—';const value=Math.max(0,Math.floor(seconds));return value>=3600?Math.floor(value/3600)+':'+String(Math.floor(value/60)%60).padStart(2,'0')+':'+String(value%60).padStart(2,'0'):Math.floor(value/60)+':'+String(value%60).padStart(2,'0');}
function mediaArtwork(hass,state){
 const value=state?.attributes?.entity_picture_local||state?.attributes?.entity_picture;
 if(typeof value!=='string'||!value.trim()||/[\u0000-\u0020\\]/.test(value)||value.startsWith('//'))return '';
 if(value.startsWith('/'))return typeof hass?.hassUrl==='function'?hass.hassUrl(value):value;
 try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}
}
function mediaRequest(hass,entity,service,value){
 if(!mediaCan(hass,entity,service))throw Error('Unsupported or unavailable action');
 const attrs=hass.states[entity].attributes??{};let data={};
 if(service==='volume_set'){const volume=mediaNumber(value);if(volume===null||volume<0||volume>1)throw Error('Invalid volume');data={volume_level:volume};}
 if(service==='volume_mute'){if(typeof value!=='boolean')throw Error('Invalid mute state');data={is_volume_muted:value};}
 if(service==='media_seek'){const {duration}=mediaPosition(hass.states[entity]);if(duration===null||mediaNumber(value)===null||value<0||value>duration)throw Error('Invalid seek');data={seek_position:value};}
 if(service==='select_source'){if(typeof value!=='string'||!Array.isArray(attrs.source_list)||!attrs.source_list.includes(value))throw Error('Invalid source');data={source:value};}
 if(service==='play_media'){if(!value||typeof value.media_content_id!=='string'||!value.media_content_id.trim()||typeof value.media_content_type!=='string'||!value.media_content_type.trim())throw Error('Invalid station');data={media_content_id:value.media_content_id.trim(),media_content_type:value.media_content_type.trim()};}
 return {domain:'media_player',service,data,target:{entity_id:entity}};
}







const mediaStyles=uiCardTitleStyles('.device-name')+headerBackgroundStyles+headerSceneStyles+headerAtmosphereStyles+uiBarStyles()+`
:host{font:inherit;display:block;height:100%;min-width:0;container-type:inline-size;color:var(--primary-text-color,#20252b)}
*{box-sizing:border-box}[hidden]{display:none!important}ha-card{font:inherit;display:block;height:100%;overflow:auto;border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));color:inherit;overscroll-behavior:auto}
.player{--tone:var(--primary-color,#2196f3);padding:var(--eleven-card-padding,16px);display:grid;gap:16px;min-width:0}.player[data-compact=true]{gap:12px}.device{display:flex;align-items:center;gap:8px;min-width:0}.device-heading{font:inherit;margin:0;flex:1;min-width:0;line-height:1.25}.device-name{font-family:inherit;color:var(--primary-text-color);text-align:left;flex:1;min-width:0;overflow-wrap:anywhere;border:0;background:none;padding:0;cursor:pointer}[data-ui-button] ha-icon{--mdc-icon-size:18px;width:18px;height:18px}
.stage{display:grid;grid-template-columns:112px minmax(0,1fr);gap:16px;align-items:center;min-width:0}.artwork{position:relative;display:grid;place-items:center;aspect-ratio:1;background:var(--secondary-background-color,#f0f1f4);border-radius:8px;overflow:hidden;color:var(--secondary-text-color)}.artwork>ha-icon{--mdc-icon-size:40px}.artwork img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.metadata{min-width:0}.track{min-width:0;font-size:24px;font-weight:650;line-height:1.25;letter-spacing:-.03em;margin:0;overflow-wrap:anywhere}.artist,.album{font-size:11px;color:var(--secondary-text-color);line-height:1.5;overflow-wrap:anywhere;margin:4px 0 0}.album{font-size:11px;margin-top:4px}.header-scene{display:grid;gap:16px}.transport{display:flex;align-items:center;justify-content:center;justify-self:center;gap:4px;flex-wrap:wrap}.transport [data-ui-button],.volume [data-ui-button]{width:34px;min-width:34px;height:34px;min-height:34px;padding:6px;justify-content:center;border-radius:5px}.transport button.primary{color:var(--primary-color,#2196f3)}select:disabled{opacity:.45;cursor:default}
.progress,.volume{display:grid;gap:2px;min-width:0}.progress-heading,.volume-heading{font-size:11px;line-height:1.4;color:var(--secondary-text-color)}.range-reading{display:flex;align-items:center;gap:16px;min-width:0}.range-reading output{flex:none;min-width:52px;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--primary-text-color)}.range-unit{font-size:11px;font-weight:400;line-height:1.4;letter-spacing:0;color:var(--secondary-text-color)}.range-reading input[type=range]{flex:1;min-width:0;width:0;margin:0}.source{display:flex;align-items:center;gap:12px;font-size:11px;color:var(--secondary-text-color)}select{flex:1;min-width:0;max-width:100%;font:inherit;font-size:12px;padding:9px;border:0;border-radius:8px;background:var(--secondary-background-color,#f0f1f4);color:var(--primary-text-color)}.device-name:focus-visible,select:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px;border-radius:4px}.notice,.error{margin:0;font-size:12px;color:var(--secondary-text-color);line-height:1.4;overflow-wrap:anywhere}.error{color:var(--error-color,#c62828)}.footer{display:grid;gap:16px}.transport:empty{display:none}
.player[data-layout=poster] .stage{position:relative;display:block;isolation:isolate;border-radius:8px;overflow:hidden;background:#17242d}.player[data-layout=poster] .artwork{width:100%;aspect-ratio:16/11;border-radius:0}.player[data-layout=poster] .metadata{position:absolute;inset:auto 0 0;padding:44px 20px 20px;background:linear-gradient(transparent,#101820 50%);color:#fff}.player[data-layout=poster] :is(.artist,.album){color:#e0e6eb}.player[data-layout=poster] .track{font-size:clamp(20px,6cqi,30px)}
.player[data-layout=horizontal]{gap:16px}.player:is([data-layout=horizontal],[data-layout=minimal]) .header-scene{grid-template-columns:minmax(0,1fr) auto;align-items:center}.player:is([data-layout=horizontal],[data-layout=minimal]) .header-scene>:is(.device,.notice){grid-column:1/-1}.player[data-layout=horizontal] .device,.player[data-layout=horizontal] :is(.progress,.footer,.notice,.error){grid-column:1/-1}.player[data-layout=horizontal] .stage{grid-template-columns:64px minmax(0,1fr);gap:14px}.player[data-layout=horizontal] .track{font-size:17px}.player[data-layout=horizontal] .album{display:none}.player[data-layout=horizontal] .transport{gap:4px}
.player[data-layout=studio] .stage{grid-template-columns:minmax(0,1fr);text-align:center;gap:16px}.player[data-layout=studio] .artwork{width:64%;max-width:200px;margin:auto;border-radius:8px}.player[data-layout=studio] .artwork img{object-fit:contain}
.player[data-layout=minimal]{gap:16px}.player[data-layout=minimal] .device,.player[data-layout=minimal] :is(.progress,.footer,.notice,.error){grid-column:1/-1}.player[data-layout=minimal] .stage{display:block}.player[data-layout=minimal] .artwork{display:none}.player[data-layout=minimal] .track{font-size:18px}.player[data-layout=minimal] .album{display:none}.player[data-layout=minimal] .transport{gap:4px}
.player[data-artwork=false] .stage{display:block}.player[data-artwork=false] .artwork{display:none}.player[data-layout=poster][data-artwork=false] .metadata{position:static;background:var(--secondary-background-color);color:var(--primary-text-color);padding:20px}.player[data-layout=poster][data-artwork=false] :is(.artist,.album){color:var(--secondary-text-color)}.player[data-compact=true][data-layout=classic] .stage{grid-template-columns:80px minmax(0,1fr);gap:14px}
.stations{min-width:0}.stations h3{font-size:11px;font-weight:400;line-height:1.4;color:var(--secondary-text-color);margin:0 0 8px}.station-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,110px),1fr));gap:4px}.station-options [data-ui-button]{justify-content:center;text-align:center;overflow-wrap:anywhere;min-height:34px}.station-help{font-size:11px;line-height:1.4;color:var(--secondary-text-color);margin:8px 0 0}.player[data-compact=true][data-layout=studio] .artwork{width:40%;max-width:120px}.player[data-layout]:is([data-empty=true],[data-image-missing=true]) .artwork{width:48px;height:48px;aspect-ratio:1;margin:auto;border-radius:8px}.player:is([data-empty=true],[data-image-missing=true]) .stage{grid-template-columns:48px minmax(0,1fr);gap:12px;text-align:start}.player[data-artwork=false] .stage{display:block}.player[data-layout=poster]:is([data-empty=true],[data-image-missing=true]) .stage{background:none;overflow:visible}.player[data-layout=poster]:is([data-empty=true],[data-image-missing=true]) .metadata{position:static;padding:0;background:none;color:var(--primary-text-color)}.player[data-layout=poster]:is([data-empty=true],[data-image-missing=true]) :is(.artist,.album){color:var(--secondary-text-color)}
@container(max-width:370px){.player:is([data-layout=horizontal],[data-layout=minimal]) .header-scene{grid-template-columns:minmax(0,1fr)}.player[data-layout=horizontal],.player[data-layout=minimal]{grid-template-columns:minmax(0,1fr)}.player[data-layout=horizontal] .transport,.player[data-layout=minimal] .transport{justify-content:flex-start}.player{padding:var(--eleven-card-padding,16px)}.stage{grid-template-columns:88px minmax(0,1fr);gap:14px}.device{flex-wrap:wrap}}
${uiSurfaceStyles('.transport,select')}
.player[data-layout] .artwork{border-radius:var(--eleven-material-radius-well,8px);box-shadow:none;background:var(--eleven-material-plot-background,var(--eleven-material-inset,var(--secondary-background-color,#f0f1f4)))}
.artwork::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:var(--eleven-material-well,inset 1px 2px 4px rgb(0 0 0 / 14%))}
@media(forced-colors:active){.artwork::after{box-shadow:none;outline:1px solid CanvasText;outline-offset:-1px}}
`;




class MediaPlayerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(input){this._config=normalizeMediaConfig(input);this._render();}
 set hass(value){this._hass=value;this._render();}get hass(){return this._hass;}
 _render(){
  if(!this._config||!this._hass)return;
  const nl=mediaDutch(this._hass),t=(a,b)=>nl?a:b;
  if(!this._form){this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;color:var(--secondary-text-color);line-height:1.5}</style><p></p><ha-form></ha-form>';this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config=normalizeMediaConfig({...this._config,...event.detail.value});this._render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));});}
  this.shadowRoot.querySelector('p').textContent=t('Kies een mediaspeler. Alleen ondersteunde bediening wordt getoond.','Choose a media player. Only supported controls are shown.');
  const labels={entity:t('Mediaspeler','Media player'),title:t('Eigen titel','Custom title'),layout:t('Ontwerp','Layout'),background:t('Achtergrond','Background'),background_strength:t('Achtergrondsterkte','Background intensity'),animate_background:t('Achtergrond animeren','Animate background'),compact:t('Compact','Compact'),radio_mode:t('Radiomodus','Radio mode'),show_artwork:t('Albumhoes tonen','Show artwork'),show_progress:t('Voortgang tonen','Show progress'),show_volume:t('Volume tonen','Show volume'),show_source:t('Bronkeuze tonen','Show source selector'),show_power:t('Aan/uitknop tonen','Show power button')};
  const names=nl?['Klassiek','Poster','Horizontaal','Studio','Minimaal']:['Classic','Poster','Horizontal','Studio','Minimal'];
  Object.assign(this._form,{hass:this._hass,data:this._config,computeLabel:field=>labels[field.name]??field.name,schema:[{name:'general',title:t('Algemeen','General'),type:'expandable',flatten:true,expanded:true,schema:[{name:'entity',selector:{entity:{domain:'media_player'}}},{name:'title',selector:{text:{}}},{name:'layout',selector:{select:{mode:'dropdown',options:MEDIA_LAYOUTS.map((value,i)=>({value,label:names[i]}))}}}]},{name:'appearance',title:t('Weergave','Appearance'),type:'expandable',flatten:true,schema:[{name:'background',selector:{select:{mode:'dropdown',options:headerBackgroundOptions(nl)}}},{name:'background_strength',selector:{number:{min:0,max:100,step:5,mode:'slider',unit_of_measurement:'%'}}},{name:'animate_background',selector:{boolean:{}}},...['radio_mode','compact','show_artwork','show_progress','show_volume','show_source','show_power'].map(name=>({name,selector:{boolean:{}}}))]}]});
  this._renderStations(nl);
 }
 _saveStations(stations){this._config=normalizeMediaConfig({...this._config,stations});this._render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));}
 _renderStations(nl){
  const t=(a,b)=>nl?a:b;
  if(!this._stations){
   const style=document.createElement('style');style.textContent=uiButtonStyles()+'.stations{margin-top:16px}.stations h3{font-size:12px;font-weight:600;margin:0 0 8px}.stations p{font-size:12px;line-height:1.4}.station-rows{display:grid;gap:8px}details{border-radius:8px;padding:12px;background:var(--secondary-background-color)}summary{cursor:pointer;font-size:12px;font-weight:600;overflow-wrap:anywhere}.station-rows ha-form{margin-top:12px}.station-actions{display:flex;gap:8px;margin-top:12px}.station-actions [data-ui-button]{padding:4px 8px}.stations>[data-ui-button]{margin-top:8px;padding:4px 8px}';this.shadowRoot.append(style);
   this._stations=document.createElement('section');this._stations.className='stations';this._stations.innerHTML='<h3></h3><p></p><div class="station-rows"></div><button type="button" data-ui-button="text" data-add-station></button>';this.shadowRoot.append(this._stations);
   this._stations.querySelector('[data-add-station]').addEventListener('click',()=>{this._saveStations([...this._config.stations,{name:'',media_content_id:'',media_content_type:'music'}]);this._stations.querySelector('.station-rows').lastElementChild.open=true;});
  }
  const section=this._stations;section.hidden=!this._config.radio_mode;section.querySelector('h3').textContent=t('Radiozenders','Radio stations');section.querySelector('p').textContent=t('Voeg favoriete zenders toe met een stream-URL of Home Assistant media-ID. Het mediatype hangt af van je integratie; muziek is de standaard.','Add favourite stations using a stream URL or Home Assistant media ID. The media type depends on your integration; music is the default.');section.querySelector('[data-add-station]').textContent=t('Zender toevoegen','Add station');
  const container=section.querySelector('.station-rows');while(container.children.length>this._config.stations.length)container.lastElementChild.remove();
  this._config.stations.forEach((station,index)=>{
   let row=container.children[index];if(!row){row=document.createElement('details');row.innerHTML='<summary></summary><ha-form></ha-form><div class="station-actions"><button type="button" data-ui-button="text" data-move="-1"></button><button type="button" data-ui-button="text" data-move="1"></button><button type="button" data-ui-button="text" data-remove></button></div>';container.append(row);
    row.querySelector('ha-form').addEventListener('value-changed',event=>{event.stopPropagation();const i=Number(row.dataset.index);this._saveStations(this._config.stations.map((value,j)=>j===i?{...value,...event.detail.value}:value));});
    row.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;const stations=this._config.stations.map(value=>({...value})),i=Number(row.dataset.index);if(button.hasAttribute('data-remove'))stations.splice(i,1);else{const next=i+Number(button.dataset.move);if(next<0||next>=stations.length)return;[stations[i],stations[next]]=[stations[next],stations[i]];}this._saveStations(stations);});
   }
   row.dataset.index=String(index);row.querySelector('summary').textContent=station.name||t('Nieuwe zender','New station');
   const labels={name:t('Zendernaam','Station name'),media_content_id:t('Stream-URL of media-ID','Stream URL or media ID'),media_content_type:t('Mediatype','Media type')};Object.assign(row.querySelector('ha-form'),{hass:this._hass,data:station,schema:Object.keys(labels).map(name=>({name,selector:{text:{}}})),computeLabel:field=>labels[field.name]});
   const up=row.querySelector('[data-move="-1"]'),down=row.querySelector('[data-move="1"]');up.textContent=t('Omhoog','Move up');up.disabled=index===0;down.textContent=t('Omlaag','Move down');down.disabled=index===this._config.stations.length-1;row.querySelector('[data-remove]').textContent=t('Verwijderen','Remove');
  });
 }
}








class MediaPlayerCardBase extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._version=0;}
 static getStubConfig(hass){return {entity:Object.keys(hass?.states??{}).find(id=>id.startsWith('media_player.'))??'',layout:'studio',radio_mode:true};}
 static async getConfigElement(){
  if(!customElements.get('ha-form')&&window.loadCardHelpers){const helpers=await window.loadCardHelpers(),card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();}
  if(!customElements.get('eleven-media-player-editor'))customElements.define('eleven-media-player-editor',MediaPlayerEditor);
  return document.createElement('eleven-media-player-editor');
 }
 setConfig(input){const next=normalizeMediaConfig(input);this._config=next;this._version++;this._busy=false;this._error='';this._render();}
 set hass(value){this._hass=value;this._render();}get hass(){return this._hass;}
 getCardSize(){const content=this.shadowRoot?.querySelector('.player');if(this.isConnected&&content?.getBoundingClientRect().width>0)return Math.max(1,Math.ceil(content.scrollHeight/50));const config=this._config??{},state=this._hass?.states?.[config.entity],hasMedia=!this._hass||(!mediaAvailability(this._hass,config.entity)&&['playing','paused','buffering'].includes(state?.state));const artwork=config.show_artwork!==false&&config.layout!=='minimal'&&hasMedia&&!this._imageFailed&&(!this._hass||!!mediaArtwork(this._hass,state));let rows=artwork?(config.layout==='studio'?(config.compact?5:6):config.layout==='horizontal'?3:5):3;if(config.radio_mode&&config.stations?.length)rows+=Math.ceil(config.stations.length/3);return rows;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 connectedCallback(){this._attached=true;this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>this._syncClock());this._render();}
 disconnectedCallback(){this._attached=false;this._version++;this._busy=false;clearInterval(this._clock);this._clock=null;this._motionCleanup?.();this._motionCleanup=null;}
 _shell(){
  if(this._shellReady)return;this._shellReady=true;
  const button=(service,icon,primary=false)=>uiButton({variant:'surface',className:primary?'primary':'',content:`<ha-icon icon="mdi:${icon}" aria-hidden="true"></ha-icon>`,attrs:{'data-service':service}});
  this.shadowRoot.innerHTML=`<style>${uiButtonStyles()}${mediaStyles}</style><ha-card><div class="content player"><div class="header-region"><div class="header-background" aria-hidden="true"></div><div class="header-scene"><header class="device"><h2 class="device-heading"><button class="device-name" type="button" data-details></button></h2></header><p class="notice" role="status" hidden></p><div class="stage"><div class="artwork"><ha-icon icon="mdi:music" aria-hidden="true"></ha-icon><img alt="" hidden></div><div class="metadata"><h3 class="track"></h3><p class="artist"></p><p class="album"></p></div></div><div class="transport">${button('media_previous_track','skip-previous')}${button('playback','play',true)}${button('volume_mute','volume-high')}${button('power','power')}${button('media_next_track','skip-next')}${button('media_stop','stop')}</div></div></div><div class="progress"><div class="progress-heading"><label for="media-progress"></label></div><div class="range-reading"><output for="media-progress"><span data-position></span> / <span data-duration></span></output>${uiSlider({attrs:{id:'media-progress','data-seek':''}})}</div></div><div class="footer"><div class="volume"><div class="volume-heading"><label for="media-volume"></label></div><div class="range-reading"><output data-volume-value for="media-volume"><span data-volume-number></span> <span class="range-unit">%</span></output>${uiSlider({attrs:{id:'media-volume','data-volume':''}})}</div></div><section class="stations"><h3></h3><div class="station-options"></div><p class="station-help"></p></section><label class="source"><span></span><select data-source></select></label></div><p class="error" role="status" hidden></p></div></ha-card>`;
  this.shadowRoot.addEventListener('click',event=>{if(event.target.closest?.('[data-details]')){if(this._config.entity)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:this._config.entity},bubbles:true,composed:true}));return;}const station=event.target.closest?.('[data-station]');if(station&&!station.disabled){const row=this._config.stations[Number(station.dataset.station)];if(row)this._command('play_media',row);return;}const button=event.target.closest?.('[data-service]');if(!button||button.disabled)return;let service=button.dataset.service,value;const state=this._hass?.states?.[this._config.entity];if(service==='playback')service=this._playbackService(state);if(service==='play_media')value=this._config.stations.find(row=>row.media_content_id.trim()===state?.attributes?.media_content_id);if(service==='power')service=state?.state==='off'?'turn_on':'turn_off';if(service==='volume_mute')value=!state?.attributes?.is_volume_muted;this._command(service,value);});
  this.shadowRoot.addEventListener('input',event=>{if(event.target.matches('input[type=range]'))this._updateRange(event.target);if(event.target.matches('[data-volume]'))this._renderVolumeValue(event.target.value);if(event.target.matches('[data-seek]'))this.shadowRoot.querySelector('[data-position]').textContent=mediaTime(Number(event.target.value));});
  this.shadowRoot.addEventListener('change',event=>{const input=event.target;if(input.matches('[data-volume]'))this._command('volume_set',Number(input.value)/100);if(input.matches('[data-seek]'))this._command('media_seek',Number(input.value));if(input.matches('[data-source]'))this._command('select_source',input.value);});
  this.shadowRoot.addEventListener('focusout',()=>queueMicrotask(()=>this._render()));
  const image=this.shadowRoot.querySelector('img');image.addEventListener('error',()=>{this._imageFailed=true;image.hidden=true;this._render();});image.addEventListener('load',()=>{this._imageFailed=false;image.hidden=false;this._render();});
 }
 _renderVolumeValue(value){const root=this.shadowRoot;root.querySelector('[data-volume-number]').textContent=value===null?'—':String(value);root.querySelector('.range-unit').hidden=value===null;}
 _updateRange(input){syncUISlider(input);}
 _playbackService(state){if(state?.state==='playing')return mediaCan(this._hass,this._config.entity,'media_pause')?'media_pause':'media_stop';if(this._config.radio_mode&&this._config.stations.some(row=>row.media_content_id.trim()&&row.media_content_id.trim()===state?.attributes?.media_content_id)&&mediaCan(this._hass,this._config.entity,'play_media')&&(state?.state==='idle'||!mediaCan(this._hass,this._config.entity,'media_play')))return 'play_media';return 'media_play';}
 _t(nl,en){return mediaDutch(this._hass)?nl:en;}
 _render(){
  if(!this._config)return;this._shell();
  const root=this.shadowRoot,config=this._config,state=this._hass?.states?.[config.entity],attrs=state?.attributes??{},unavailable=mediaAvailability(this._hass,config.entity),t=(a,b)=>this._t(a,b),active=!unavailable&&state?.state!=='off';
  const player=root.querySelector('.player');player.dataset.layout=config.layout;player.dataset.background=config.background;player.dataset.animated=String(config.animate_background&&!unavailable);player.style.setProperty('--header-background-opacity',String(config.background_strength/100));const backdrop=root.querySelector('.header-background');if(this._background!==config.background){this._background=config.background;backdrop.innerHTML=headerAtmosphere(config.background);}player.dataset.compact=String(config.compact);player.dataset.artwork=String(config.show_artwork&&config.layout!=='minimal');
  root.querySelector('.artwork>ha-icon').setAttribute('icon',config.radio_mode?'mdi:radio':'mdi:music');
  const name=config.title||attrs.friendly_name||t('Mediaspeler','Media player');root.querySelector('.device-name').textContent=name;root.querySelector('.device-name').disabled=!config.entity;root.querySelector('ha-card').setAttribute('aria-label',name);
  const notice=root.querySelector('.notice');notice.hidden=!unavailable;notice.textContent=({setup:t('Kies een mediaspeler in de kaartconfiguratie.','Choose a media player in the card configuration.'),missing:t('Mediaspeler niet gevonden. Controleer de entiteit.','Media player not found. Check the entity.'),offline:t('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'),unavailable:t('Mediaspeler niet beschikbaar.','Media player unavailable.'),unknown:t('Status van de mediaspeler onbekend.','Media player state unknown.')})[unavailable]??'';
  const hasMedia=active&&['playing','paused','buffering'].includes(state?.state),currentStation=config.stations.find(row=>row.media_content_id.trim()===attrs.media_content_id);player.dataset.empty=String(!hasMedia);
  root.querySelector('.track').textContent=active?(hasMedia?(config.radio_mode?(attrs.media_channel||currentStation?.name||attrs.media_title||t('Radio','Radio')):(attrs.media_title||t('Niets aan het afspelen','Nothing playing'))):(config.radio_mode?t('Kies een zender','Choose a station'):t('Niets aan het afspelen','Nothing playing'))):state?.state==='off'?t('Mediaspeler staat uit','Media player is off'):t('Geen media beschikbaar','No media available');
  for(const [selector,value] of [['.artist',config.radio_mode?attrs.media_title:attrs.media_artist||attrs.media_series_title||attrs.app_name],['.album',config.radio_mode?'':attrs.media_album_name]]){const node=root.querySelector(selector);node.textContent=hasMedia&&typeof value==='string'&&value!==root.querySelector('.track').textContent?value:'';node.hidden=!node.textContent;}
  const image=root.querySelector('img'),url=hasMedia&&config.show_artwork&&config.layout!=='minimal'?mediaArtwork(this._hass,state):'';
  if(this._artworkUrl!==url){this._artworkUrl=url;this._imageFailed=false;image.hidden=true;if(url)image.src=url;else image.removeAttribute('src');}
  player.dataset.imageMissing=String(!url||!!this._imageFailed);
  const names={media_previous_track:t('Vorig nummer','Previous track'),media_next_track:t('Volgend nummer','Next track'),media_stop:t('Stoppen','Stop'),media_play:t('Afspelen','Play'),play_media:t('Afspelen','Play'),media_pause:t('Pauzeren','Pause'),turn_on:t('Inschakelen','Turn on'),turn_off:t('Uitschakelen','Turn off'),volume_mute:attrs.is_volume_muted?t('Geluid aan','Unmute'):t('Dempen','Mute')};
  for(const button of root.querySelectorAll('[data-service]')){const kind=button.dataset.service,service=kind==='playback'?this._playbackService(state):kind==='power'?(state?.state==='off'?'turn_on':'turn_off'):kind;button.hidden=!mediaCan(this._hass,config.entity,service)||(config.radio_mode&&['media_previous_track','media_next_track'].includes(kind))||(kind==='power'&&!config.show_power)||(kind==='volume_mute'&&(!config.show_volume||typeof attrs.is_volume_muted!=='boolean'));button.disabled=!!this._busy;button.setAttribute('aria-label',names[service]);if(kind==='playback')button.querySelector('ha-icon').setAttribute('icon',service==='media_stop'?'mdi:stop':state?.state==='playing'?'mdi:pause':'mdi:play');if(kind==='volume_mute'){button.setAttribute('aria-pressed',String(!!attrs.is_volume_muted));button.querySelector('ha-icon').setAttribute('icon',attrs.is_volume_muted?'mdi:volume-off':'mdi:volume-high');}}
  if(config.radio_mode&&!root.querySelector('[data-service=playback]').hidden)root.querySelector('[data-service=media_stop]').hidden=true;
  root.querySelector('.transport').hidden=![...root.querySelectorAll('.transport button')].some(button=>!button.hidden);
  root.querySelector('.volume-heading label').textContent=t('Volume','Volume');root.querySelector('.progress-heading label').textContent=t('Voortgang','Progress');
  const volume=root.querySelector('[data-volume]'),level=mediaNumber(attrs.volume_level),volumeSupported=config.show_volume&&mediaCan(this._hass,config.entity,'volume_set');volume.hidden=!volumeSupported;volume.disabled=!!this._busy||level===null;volume.setAttribute('aria-label',t('Volume','Volume'));
  if(root.activeElement!==volume){volume.value=level===null?'0':String(Math.round(Math.max(0,Math.min(1,level))*100));this._renderVolumeValue(level===null?null:volume.value);}this._updateRange(volume);root.querySelector('[data-volume-value]').hidden=!volumeSupported;
  root.querySelector('.volume').hidden=!volumeSupported;
  const select=root.querySelector('[data-source]'),sources=Array.isArray(attrs.source_list)?attrs.source_list.filter(value=>typeof value==='string'):[];root.querySelector('.source').hidden=!config.show_source||!mediaCan(this._hass,config.entity,'select_source')||!sources.length;
  root.querySelector('.source>span').textContent=t('Bron','Source');select.setAttribute('aria-label',t('Bron','Source'));select.disabled=!!this._busy;
  if(root.activeElement!==select){const list=[...new Set(sources)],key=JSON.stringify([list,attrs.source,t('Kies een bron','Choose source')]);if(key!==this._sourceKey){this._sourceKey=key;select.replaceChildren();if(!list.includes(attrs.source)){const option=document.createElement('option');option.value='';option.textContent=t('Kies een bron','Choose source');option.disabled=true;select.append(option);}for(const value of list){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);}select.value=list.includes(attrs.source)?attrs.source:'';}}
  this._renderStations();root.querySelector('.footer').hidden=root.querySelector('.volume').hidden&&root.querySelector('.source').hidden&&root.querySelector('.stations').hidden;
  const error=root.querySelector('.error');error.hidden=!this._error;error.textContent=this._error??'';
  this._renderProgress();this._syncClock();
 }
 _renderStations(){
  const root=this.shadowRoot,config=this._config,section=root.querySelector('.stations'),container=root.querySelector('.station-options'),state=this._hass?.states?.[config.entity];section.hidden=!config.radio_mode;
  section.querySelector('h3').textContent=this._t('Zenders','Stations');
  const key=JSON.stringify(config.stations);if(key!==this._stationKey){this._stationKey=key;container.replaceChildren();config.stations.forEach((station,index)=>{const button=document.createElement('button');button.type='button';button.dataset.station=String(index);button.setAttribute('data-ui-button','surface');button.textContent=station.name||this._t('Nieuwe zender','New station');container.append(button);});}
  for(const button of container.children){const row=config.stations[Number(button.dataset.station)];button.disabled=!!this._busy||!mediaCan(this._hass,config.entity,'play_media')||!row.media_content_id.trim()||!row.media_content_type.trim();button.setAttribute('aria-pressed',String(!!row.media_content_id.trim()&&row.media_content_id.trim()===state?.attributes?.media_content_id));}
  const help=section.querySelector('.station-help');help.textContent=!config.stations.length?this._t('Voeg favoriete radiozenders toe in de kaartconfiguratie.','Add favourite radio stations in the card configuration.'):!mediaCan(this._hass,config.entity,'play_media')?this._t('Zenders starten is niet beschikbaar op deze mediaspeler.','Starting stations is unavailable on this media player.'):'';help.hidden=!help.textContent;
 }
 _renderProgress(){
  if(!this._config||!this._shellReady)return;
  const root=this.shadowRoot,state=this._hass?.states?.[this._config.entity],{duration,position}=mediaPosition(state),range=root.querySelector('[data-seek]');
  root.querySelector('.progress').hidden=this._config.radio_mode||!this._config.show_progress||!!mediaAvailability(this._hass,this._config.entity)||!['playing','paused','buffering'].includes(state?.state)||duration===null;
  range.disabled=!!this._busy||position===null||!mediaCan(this._hass,this._config.entity,'media_seek');range.setAttribute('aria-label',this._t('Afspeelpositie','Playback position'));range.max=String(duration??100);
  if(root.activeElement!==range){range.value=String(position??0);root.querySelector('[data-position]').textContent=mediaTime(position);}
  this._updateRange(range);root.querySelector('[data-duration]').textContent=mediaTime(duration);if(position===null){range.removeAttribute('aria-valuenow');range.setAttribute('aria-valuetext',this._t('Afspeelpositie onbekend','Playback position unknown'));}else range.setAttribute('aria-valuetext',mediaTime(Number(range.value))+' / '+mediaTime(duration));
 }
 _syncClock(){
  const shouldRun=this._attached&&this._shellReady&&!this.hasAttribute('data-motion-paused')&&!document.hidden&&!this._config?.radio_mode&&this._config?.show_progress&&!mediaAvailability(this._hass,this._config?.entity)&&this._hass?.states?.[this._config?.entity]?.state==='playing'&&mediaPosition(this._hass.states[this._config.entity]).position!==null;
  if(shouldRun&&!this._clock)this._clock=setInterval(()=>this._renderProgress(),1000);else if(!shouldRun&&this._clock){clearInterval(this._clock);this._clock=null;}
 }
 async _command(service,value){
  if(this._busy||!this._attached)return;
  const version=this._version;this._busy=true;this._error='';this._render();
  try{const request=mediaRequest(this._hass,this._config.entity,service,value);await this._hass.callService(request.domain,request.service,request.data,request.target);}
  catch{if(version===this._version)this._error=this._t('Bediening mislukt. Controleer de verbinding en probeer opnieuw.','Action failed. Check the connection and try again.');}
  finally{if(version===this._version){this._busy=false;this._render();}}
 }
}

class MediaPlayerCard extends withCardBackground(MediaPlayerCardBase){}

if(!customElements.get('eleven-media-player-card'))customElements.define('eleven-media-player-card',MediaPlayerCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-media-player-card'))window.customCards.push({type:'eleven-media-player-card',name:'Eleven Media Player (beta)',description:'Media player with five layouts and supported playback controls.',preview:true});
})();
