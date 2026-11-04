// Eleven Overview (beta) 0.1.0 — self-contained standalone module
(()=>{
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
 {value:'constellation',code:'15',label:'Constellation',description:'Een open netwerk van lichtpunten met accenten langs de verbindingen.'}

].map(Object.freeze));
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
[data-ui-background-coverage=header]{max-height:var(--ui-bg-height,240px);mask-image:linear-gradient(to bottom,#000 0%,#000 55%,transparent 100%)}
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
function cardBackgroundSettings(config={}){
 const input=config.card_background;
 if(input===false)return {...normalizeCardBackground({variant:'isobars',coverage:'header'}),enabled:false,legacy:false};
 if(input&&typeof input==='object'&&!Array.isArray(input))return {...normalizeCardBackground({variant:'isobars',coverage:'header',...input}),enabled:input.enabled!==false,legacy:false};
 const legacy=typeof config.background==='string'&&!CARD_BACKGROUNDS.some(row=>row.value===config.background)&&config.background!=='none';
 const strength=Number(config.background_strength);
 return {...normalizeCardBackground({variant:config.background??'isobars',coverage:'header',transparency:config.background_strength!=null&&Number.isFinite(strength)?100-strength:65,animated:config.animate_background!==false}),enabled:config.background!=='none',legacy};
}

const cardBackgroundHostStyles=uiCardBackgroundStyles()+`
[data-ui-background-host] :is(.header-background,.scene-background){display:none!important}
`;

// Wrap registrations rather than replacing each card's renderer. The original
// class retains its DOM patching, subscriptions, action handlers and editor.
const withCardBackground=Base=>class extends Base{
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
 _syncElevenBackground(){
  const root=this.shadowRoot,host=root?.querySelector('ha-card');if(!host||!this._elevenBackgroundConfig)return;
  const settings=cardBackgroundSettings(this._elevenBackgroundConfig);
  if(settings.legacy){
   host.removeAttribute('data-ui-background-host');
   this._elevenBackgroundLayer?.remove();this._elevenBackgroundLayer=null;
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
   if(this.isConnected&&!this._elevenBackgroundMotion)this._elevenBackgroundMotion=observeCardBackgroundMotion(this);return;
  }
  this._captureElevenBackgroundPlayback();
  this._elevenBackgroundSignature=signature;
  if(!settings.enabled){
   this._elevenBackgroundLayer?.remove();this._elevenBackgroundLayer=null;
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
  this._restoreElevenBackgroundPlayback();
  if(this.isConnected&&!this._elevenBackgroundMotion)this._elevenBackgroundMotion=observeCardBackgroundMotion(this);
 }
 static async getConfigElement(){
  if(!customElements.get('eleven-card-background-editor'))customElements.define('eleven-card-background-editor',ElevenCardBackgroundEditor);
  const editor=document.createElement('eleven-card-background-editor');
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
   this._config={...this._config,...event.detail.config};
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
  const legacy=cardBackgroundSettings(this._config).legacy;this._nativeBackgroundSchemas??=new WeakMap();
  const forms=this._nativeEditor?.shadowRoot?.querySelectorAll('ha-form')??[];
  for(const form of [...forms,...(this._nativeEditor?.tagName==='HA-FORM'?[this._nativeEditor]:[])]){
   const saved=this._nativeBackgroundSchemas.get(form);
   if(legacy){if(saved&&form.schema===saved.filtered)form.schema=saved.original;continue;}
   if(saved&&form.schema===saved.filtered)continue;
   const filtered=cardBackgroundEditorSchema(form.schema);
   if(filtered!==form.schema){this._nativeBackgroundSchemas.set(form,{original:form.schema,filtered});form.schema=filtered;}
  }
 }
 set nativeEditor(editor){this._nativeEditor=editor;this.shadowRoot.querySelector('.native').replaceChildren(editor);if(this._hass)editor.hass=this._hass;if(this._config)editor.setConfig(this._config);this._observeNativeBackgroundFields();}
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
  const nl=this._language==='nl',s=cardBackgroundSettings(this._config),t=(d,e)=>nl?d:e;
  const choices=['aurora','ribbon','isobars','ink-bloom','hologram'].map(value=>CARD_BACKGROUNDS.find(row=>row.value===value));
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
  const current=cardBackgroundSettings(this._config),next={...current};delete next.legacy;
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
${plots?`${plots}{box-shadow:var(--eleven-material-well,none);border-radius:var(--eleven-material-radius-well,0px);background:var(--eleven-material-plot-background,transparent)}`:''}
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

function retryDelay(failures, base = 60000, maximum = 300000) {
  return Math.min(maximum, base * 2 ** Math.max(0, failures - 1));
}

// Calendar periods use the Home Assistant timezone, including DST boundaries.
const periodZoneFormats=new Map();
function periodLocalParts(t,zone){
 let format=periodZoneFormats.get(zone);
 if(!format){format=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});periodZoneFormats.set(zone,format);}
 return Object.fromEntries(format.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
function periodLocalEpoch(t,zone){const p=periodLocalParts(t,zone);return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}
function periodMidnight(nominal,zone){
 let t=nominal;for(let i=0;i<6;i++){const next=nominal-(periodLocalEpoch(t,zone)-t);if(next===t)return t;t=next;}
 // Midnight can be skipped by a timezone transition. Use the first valid
 // instant of that local date rather than oscillating across the transition.
 let low=nominal-36*3600000,high=nominal+36*3600000;
 while(high-low>1000){const mid=Math.floor((low+high)/2000)*1000,p=periodLocalParts(mid,zone);if(Date.UTC(p.year,p.month-1,p.day)>=nominal)high=mid;else low=mid;}
 return high;
}
function calendarDayStart(key,zone='UTC'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return NaN;
 const nominal=Date.parse(`${key}T00:00:00Z`);
 return Number.isFinite(nominal)&&new Date(nominal).toISOString().slice(0,10)===key?periodMidnight(nominal,zone||'UTC'):NaN;
}
function graphPeriodBounds(t,period,zone='UTC'){
 zone ||= 'UTC';const p=periodLocalParts(t,zone),size={minute:60000,quarter_hour:900000,hour:3600000}[period];
 if(size){const local=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second),a=t-(local%size)-(t%1000);return [a,a+size];}
 let nominal=Date.UTC(p.year,p.month-1,period==='month'?1:p.day);let next;
 if(period==='week'){const day=new Date(nominal).getUTCDay();nominal-=((day+6)%7)*86400000;next=nominal+7*86400000;}
 else if(period==='month')next=Date.UTC(p.year,p.month,1);
 else next=nominal+86400000;
 return [periodMidnight(nominal,zone),periodMidnight(next,zone)];
}
const periodCalendarModes=['today','week','month','quarter','year'];
const periodPresetHours={'1h':1,'6h':6,'12h':12,'24h':24,'48h':48,'7d':168,'14d':336,'30d':720,'90d':2160,'365d':8760};
function periodDateTime(t,zone='UTC'){
 const p=periodLocalParts(t,zone),pad=n=>String(n).padStart(2,'0');
 return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}
function parsePeriodDateTime(value,zone='UTC',edge='start',previous){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return NaN;
 if(Number.isFinite(previous)&&periodDateTime(previous,zone)===value)return previous;
 const nominal=Date.parse(value+'Z');if(!Number.isFinite(nominal)||periodDateTime(nominal,'UTC')!==value)return NaN;
 // Collect the offsets on both sides of a transition. Reject skipped local
 // times; repeated times include both occurrences unless editing an existing bound.
 const candidates=new Set();
 for(let h=-48;h<=48;h+=6){const sample=nominal+h*3600000,offset=periodLocalEpoch(sample,zone)-sample,candidate=nominal-offset;if(periodDateTime(candidate,zone)===value)candidates.add(candidate);}
 const times=[...candidates].sort((a,b)=>a-b);return times.length?(edge==='end'?times.at(-1):times[0]):NaN;
}
function chooseCustomGraphPeriod(host,start,end){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>366*86400000)return false;
 resetGraphPeriod(host);host._periodMode='custom';host._periodHours=(end-start)/3600000;host._periodEnd=end;
 publishTimeframe(host);host._reloadPeriod();return true;
}
function timeframeSyncConfig(config,{draft=false}={}){
 if(!draft){
  if(config.sync_timeframe!==undefined&&typeof config.sync_timeframe!=='boolean')throw Error('sync_timeframe must be a boolean. / Tijdvak synchroniseren moet aan of uit zijn.');
  for(const key of ['hover_sync_group','timeframe_sync_group'])if(config[key]!=null&&typeof config[key]!=='string')throw Error(`${key} must be text. / De synchronisatiegroep moet tekst zijn.`);
 }
 return {sync_timeframe:config.sync_timeframe??false,hover_sync_group:config.hover_sync_group??config.timeframe_sync_group??''};
}
function timeframeGroup(host){return host._config?.sync_timeframe===true?((host._config.hover_sync_group??host._config.timeframe_sync_group)?.trim()||'default'):null;}
function timeframeGroups(){
 const root=globalThis.window??globalThis,key=Symbol.for('eleven-cards.timeframe-sync.v1');
 return root[key]??=new Map();
}
function applyTimeframe(host,selection){
 // Default is a group-wide reset to each card's own configured range (or
 // native price window), rather than a copy of the sender's hours.
 if(selection.mode==='configured'&&selection.offset===0){resetGraphPeriod(host);return;}
 host._sharedTimeframe=selection;
 Object.assign(host,{_periodMode:selection.mode,_periodHours:selection.hours,_periodEnd:selection.end,_periodOffset:selection.offset,_periodAnchor:selection.anchor});
}
function disconnectTimeframeSync(host){
 host._disconnectTimeframeSync?.();host._disconnectTimeframeSync=null;
}
function connectTimeframeSync(host){
 disconnectTimeframeSync(host);
 const group=timeframeGroup(host);if(group===null||!host._connected)return;
 const groups=timeframeGroups();let entry=groups.get(group);
 if(!entry){entry={selection:null,listeners:new Set()};groups.set(group,entry);}
 const receive=(selection,source)=>{
  if(source===host||host._sharedTimeframe===selection)return;
  applyTimeframe(host,selection);host._reloadPeriod();
 };
 entry.listeners.add(receive);
 host._disconnectTimeframeSync=()=>entry.listeners.delete(receive);
 // Joining never publishes this card's default over an existing selection.
 if(entry.selection)applyTimeframe(host,entry.selection);
}
function publishTimeframe(host){
 const group=timeframeGroup(host);if(group===null||!host._connected)return;
 const entry=timeframeGroups().get(group);if(!entry)return;
 const selection={group,mode:host._periodMode,hours:host._periodHours??host._config.hours_to_show,
  end:host._periodEnd,offset:host._periodOffset,anchor:host._periodAnchor,zone:host._hass?.config?.time_zone||'UTC',at:Date.now()};
 selection.range=localGraphPeriodRange(host,selection.at);
 entry.selection=selection;applyTimeframe(host,selection);
 for(const receive of entry.listeners)receive(selection,host);
}
function resetGraphPeriod(host){host._sharedTimeframe=null;host._periodMode='configured';host._periodHours=null;host._periodEnd=null;host._periodOffset=0;host._periodAnchor=null;host._periodMenuOpen=false;host._periodMenuPending=false;host._periodCustomDraft=null;host._periodTab=null;host._insightPending=null;}
function graphPeriodRange(host,now=Date.now()){
 const shared=host._sharedTimeframe;
 if(shared&&timeframeGroup(host)===shared.group){
  // One clock and timezone for the whole group, including separate bundles.
  // Live selections advance together on the minute; historical ranges stay fixed.
  if(shared.offset===0&&shared.end==null&&(Math.floor(now/60000)!==Math.floor(shared.at/60000))){
   shared.at=now;shared.range=localGraphPeriodRange({_periodMode:shared.mode,_periodHours:shared.hours,_periodOffset:0,_hass:{config:{time_zone:shared.zone}}},now);
  }
  return {...shared.range};
 }
 return localGraphPeriodRange(host,now);
}
function localGraphPeriodRange(host,now){
 const mode=host._periodMode,offset=host._periodOffset??0;
 if(periodCalendarModes.includes(mode)){
  const zone=host._hass?.config?.time_zone||'UTC',p=periodLocalParts(host._periodAnchor??now,zone);
  let nominal,finishNominal;
  if(mode==='week'){
   nominal=Date.UTC(p.year,p.month-1,p.day);nominal+=(offset*7-(new Date(nominal).getUTCDay()+6)%7)*86400000;finishNominal=nominal+7*86400000;
  }else if(mode==='month'||mode==='quarter'){
   const size=mode==='quarter'?3:1,month=(mode==='quarter'?Math.floor((p.month-1)/3)*3:p.month-1)+offset*size;
   nominal=Date.UTC(p.year,month,1);finishNominal=Date.UTC(p.year,month+size,1);
  }else if(mode==='year'){nominal=Date.UTC(p.year+offset,0,1);finishNominal=Date.UTC(p.year+offset+1,0,1);}
  else{nominal=Date.UTC(p.year,p.month-1,p.day+offset);finishNominal=nominal+86400000;}
  const start=periodMidnight(nominal,zone),finish=periodMidnight(finishNominal,zone);
  return {start,end:Math.max(start+1,Math.min(now,finish))};
 }
 const end=host._periodEnd??now;
 return {start:end-(host._periodHours??host._config.hours_to_show)*3600000,end};
}
function chooseGraphPeriod(host,value){
 const calendar=value==='configured'||periodCalendarModes.includes(value),hours=periodPresetHours[value]??Number(value);
 if(!calendar&&(!Number.isFinite(hours)||hours<1||hours>8760))return;
 resetGraphPeriod(host);
 host._periodMode=calendar?value:Object.entries(periodPresetHours).find(([,h])=>h===hours)?.[0]??String(value);
 if(!calendar)host._periodHours=hours;
 publishTimeframe(host);
 return host._reloadPeriod();
}
function moveGraphPeriod(host,direction){
 if(![-1,0,1].includes(direction))return;
 if(host._periodMode==='custom'){
  if(direction===0){host._periodEnd=null;host._periodOffset=0;}
  else{const end=(host._periodEnd??Date.now())+direction*host._periodHours*3600000;host._periodEnd=direction>0?Math.min(Date.now(),end):end;host._periodOffset=(host._periodOffset??0)+direction;}
  host._periodCustomDraft=null;host._periodTab=null;host._sharedTimeframe=null;publishTimeframe(host);return host._reloadPeriod();
 }
 if(direction===0){host._periodOffset=0;host._periodEnd=null;host._periodAnchor=null;}
 else{
  const previous=host._periodOffset??0;
  const calendar=periodCalendarModes.includes(host._periodMode);
  if(previous===0)host._periodAnchor=calendar?Date.now():host._status==='ready'?(host._end??Date.now()):Date.now();
  host._periodOffset=Math.min(0,previous+direction);
  if(host._periodOffset===0)host._periodAnchor=null;
  if(!calendar){
   host._periodEnd=host._periodOffset===0?null:host._periodAnchor+host._periodOffset*(host._periodHours??host._config.hours_to_show)*3600000;
  }
 }
 host._sharedTimeframe=null;
 publishTimeframe(host);
 return host._reloadPeriod();
}


function historyUrl(ids,start,end){return `history/period/${new Date(start).toISOString()}?filter_entity_id=${encodeURIComponent(ids.join(','))}&end_time=${encodeURIComponent(new Date(end).toISOString())}`;}
function historySeries(rows,start,end,unit){
 const data=(rows??[]).map(r=>({t:Date.parse(r.last_updated??r.last_changed),v:(r.attributes?.unit_of_measurement??'')===(unit??'')?numeric(r.state):null})).filter(r=>Number.isFinite(r.t)&&r.t<=end).sort((a,b)=>a.t-b.t);
 const before=data.filter(r=>r.t<=start).at(-1),points=before?[{t:start,v:before.v}]:[];
 for(const r of data)if(r.t>start)points.push(r);
 if(points.length)points.push({t:end,v:points.at(-1).v});
 return {points,baseline:before?.v??null};
}
function delta(series,current){return series?.baseline!=null&&current!=null?current-series.baseline:null;}
function sparkline(points,start,end){
 const values=points.filter(p=>p.v!=null).map(p=>p.v);if(!values.length||end<=start)return '';
 let min=Infinity,max=-Infinity;for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}
 const span=max-min;let path='',prior=null;
 for(const p of points){const x=2+Math.max(0,Math.min(1,(p.t-start)/(end-start)))*296;if(p.v==null){if(prior)path+=`H${x.toFixed(2)}`;prior=null;continue;}const y=span?44-(p.v-min)/span*40:24;
 path+=prior==null?`M${x.toFixed(2)},${y.toFixed(2)}`:`H${x.toFixed(2)}V${y.toFixed(2)}`;prior=p;}
 return path;
}
const PALETTE=['#2196f3','#e78a14','#ab70d9','#26a69a','#e66b91','#718cc2','#a18d3a','#718d78'];
function numeric(value){if(typeof value!=='number'&&(typeof value!=='string'||!value.trim()||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim())))return null;const n=Number(value);return Number.isFinite(n)?n:null;}
function color(value,fallback=PALETTE[0]){if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=255))return `rgb(${value.join(',')})`;return typeof value==='string'&&/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)?value:fallback;}
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalizeConfig(input,{draft=false}={}){
 const entities=(input.entities??[]).map((row,i)=>typeof row==='string'?{entity:row,color:PALETTE[i]}:{...row,color:Array.isArray(row.color)?[...row.color]:row.color??PALETTE[i]});
 if(!draft&&(!entities.length||entities.length>8||entities.some(r=>!/^sensor\.[a-z0-9_]+$/.test(r.entity))||new Set(entities.map(r=>r.entity)).size!==entities.length))throw Error('Select 1–8 unique sensor entities. / Kies 1–8 unieke sensoren.');
 const hours=input.hours_to_show??24,columns=String(input.columns??'auto');
 if(!Number.isFinite(hours)||hours<1||hours>168)throw Error('Period must be 1–168 hours. / Periode moet 1–168 uur zijn.');
 if(!['auto','1','2','3'].includes(columns))throw Error('Columns must be auto, 1, 2 or 3.');
 return {...input,...timeframeSyncConfig(input,{draft}),type:'custom:eleven-overview-card',title:input.title??'Eleven Overview (beta)',hours_to_show:hours,columns,show_graph:input.show_graph!==false,show_delta:input.show_delta!==false,entities};
}






const esc=escapeHtml;
const nl=h=>String(h?.locale?.language??h?.language??'en').startsWith('nl');
const labels={sync_timeframe:['Tijdvak synchroniseren','Synchronize timeframe'],hover_sync_group:['Synchronisatiegroep','Synchronization group'],title:['Titel','Title'],hours_to_show:['Periode (uur)','Period (hours)'],columns:['Kolommen','Columns'],show_graph:['Trendlijnen tonen','Show sparklines'],show_delta:['Verandering tonen','Show change'],entity:['Sensor','Sensor'],name:['Naam','Name'],color:['Kleur','Color']};
const helpers={sync_timeframe:['Deelt tijdvakkeuze en vorige/volgende/Nu met ingeschakelde kaarten in dezelfde groep.','Shares timeframe selection and previous/next/Now with enabled cards in the same group.'],hover_sync_group:['Kaarten met dezelfde groep delen hover en tijdvak als de bijbehorende synchronisatie aanstaat. Leeg gebruikt de standaardgroep.','Cards with the same group share hover and timeframe when the corresponding synchronization is enabled. Empty uses the default group.'],};
function form(schema){return {schema,computeLabel:function(s){return labels[s.name]?.[nl(this?.hass)?0:1]??s.name;},computeHelper:function(s){return helpers[s.name]?.[nl(this?.hass)?0:1];}};}
class OverviewEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(c){this._config=normalizeConfig(c,{draft:true});this._render();}
 set hass(h){this._hass=h;this._render();}get hass(){return this._hass;}
 _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,entities:this._config.entities.filter(r=>r.entity).map(r=>({...r,color:Array.isArray(r.color)?[...r.color]:r.color}))}},bubbles:true,composed:true}));}
 _bind(node,definition,data){node.hass=this._hass;node.schema=definition.schema;node.data=data;node.computeLabel=s=>definition.computeLabel.call(this,s);node.computeHelper=s=>definition.computeHelper?.call(this,s);}
 _render(){
  if(!this._config||!this._hass)return;const dutch=nl(this._hass);
  if(!this._form){this.shadowRoot.innerHTML=`<style>:host{display:block;min-width:0}h3{font-size:16px;margin:24px 0 12px}details{border:1px solid var(--divider-color);border-radius:12px;margin:12px 0;min-width:0}summary{padding:12px;min-height:44px;box-sizing:border-box;cursor:pointer;overflow-wrap:anywhere}.body{padding:0 12px 12px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{font:inherit;min-height:44px;border:1px solid var(--divider-color);border-radius:6px;padding:8px 12px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.4}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.remove{margin-left:auto}</style><ha-form class="global"></ha-form><h3></h3><div class="sensors"></div><button class="add" type="button"></button>`;
   this._form=this.shadowRoot.querySelector('.global');this._form.addEventListener('value-changed',e=>{e.stopPropagation();this._config=normalizeConfig({...this._config,...e.detail.value,entities:this._config.entities},{draft:true});this._emit();});
   this.shadowRoot.querySelector('.add').onclick=()=>{if(this._config.entities.length>=8)return;this._config={...this._config,entities:[...this._config.entities,{entity:'',color:PALETTE[this._config.entities.length]}]};this._render();this.shadowRoot.querySelector('.sensors').lastElementChild.open=true;};
  }
  this._bind(this._form,OverviewCard.getConfigForm(),this._config);this.shadowRoot.querySelector('h3').textContent=dutch?'Sensoren':'Sensors';const add=this.shadowRoot.querySelector('.add');add.textContent=dutch?'Sensor toevoegen':'Add sensor';add.disabled=this._config.entities.length>=8;
  const container=this.shadowRoot.querySelector('.sensors');while(container.children.length>this._config.entities.length)container.lastElementChild.remove();
  this._config.entities.forEach((r,i)=>{let entry=container.children[i];if(!entry){entry=document.createElement('details');entry.innerHTML='<summary></summary><div class="body"><ha-form></ha-form><div class="actions"><button class="up" type="button"></button><button class="down" type="button"></button><button class="remove" type="button"></button></div></div>';container.append(entry);entry.open=this._config.entities.length===1;
   entry.querySelector('ha-form').addEventListener('value-changed',e=>{e.stopPropagation();const rows=this._config.entities.map((row,j)=>j===i?{...row,...e.detail.value}:row);this._config={...this._config,entities:rows};this._render();this._emit();});
   for(const [key,d] of [['up',-1],['down',1],['remove',0]])entry.querySelector('.'+key).onclick=()=>{const rows=[...this._config.entities];if(key==='remove')rows.splice(i,1);else{const j=i+d;if(j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]];}this._config={...this._config,entities:rows};this._render();this._emit();};
  }
  entry.querySelector('summary').textContent=r.name||this._hass.states?.[r.entity]?.attributes?.friendly_name||r.entity||(dutch?'Nieuwe sensor':'New sensor');this._bind(entry.querySelector('ha-form'),OverviewCard.getSensorForm(),r);
  for(const [key,title] of [['up',dutch?'Omhoog':'Move up'],['down',dutch?'Omlaag':'Move down'],['remove',dutch?'Verwijderen':'Remove']]){const b=entry.querySelector('.'+key);b.textContent=title;b.disabled=key==='up'?i===0:key==='down'?i===this._config.entities.length-1:false;}
  });
 }
}
class OverviewCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._history={};this._units={};this._status='loading';this._connected=false;this._timer=null;this._readings=new Map();this._animationFrame=null;}
 static getConfigForm(){return form([{name:'title',selector:{text:{}}},{name:'hours_to_show',selector:{number:{min:1,max:168,step:1,mode:'box'}}},{name:'columns',selector:{select:{mode:'dropdown',options:[{value:'auto',label:'Auto'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'}]}}},{name:'show_graph',selector:{boolean:{}}},{name:'show_delta',selector:{boolean:{}}},{name:'sync_timeframe',default:false,selector:{boolean:{}}},{name:'hover_sync_group',selector:{text:{}}}]);}
 static getSensorForm(){return form([{name:'entity',required:true,selector:{entity:{domain:'sensor'}}},{name:'name',selector:{text:{}}},{name:'color',selector:{color_rgb:{}}}]);}
 static async getConfigElement(){if(!customElements.get('ha-form')){const helpers=await window.loadCardHelpers();const card=await helpers.createCardElement({type:'entities',entities:[]});await card.constructor.getConfigElement();await customElements.whenDefined('ha-form');}if(!customElements.get('eleven-overview-editor'))customElements.define('eleven-overview-editor',OverviewEditor);return document.createElement('eleven-overview-editor');}
 static getStubConfig(hass){return {title:'Eleven Overview (beta)',hours_to_show:24,entities:Object.entries(hass?.states??{}).filter(([id,s])=>id.startsWith('sensor.')&&numeric(s.state)!=null).slice(0,4).map(([id])=>id)};}
 setConfig(config){this._stopAnimation();this._config=normalizeConfig(config);this._generation++;this._promise=null;this._history={};this._status='loading';this._refreshFailures=0;resetGraphPeriod(this);clearTimeout(this._timer);connectTimeframeSync(this);this._render();if(this._connected)this._refresh();}
 set hass(h){
  this._hass=h;
  const signature=JSON.stringify([h?.locale?.language??h?.language,h?.config?.time_zone,this._config?.entities.map(row=>{const state=h?.states?.[row.entity];return [state?.state,state?.attributes?.friendly_name,state?.attributes?.unit_of_measurement];})]);
  if(signature!==this._hassSignature){this._hassSignature=signature;this._render();}
  if(this._connected&&!this._promise&&this._status==='loading')this._refresh();
 }get hass(){return this._hass;}
 connectedCallback(){this._connected=true;connectTimeframeSync(this);this._refresh();}
 disconnectedCallback(){this._layoutObserver?.disconnect();disconnectTimeframeSync(this);this._stopAnimation();this._connected=false;this._generation++;this._promise=null;clearTimeout(this._timer);this._timer=null;}
 getCardSize(){return 1+Math.ceil((this._config?.entities.length??1)/2)*2;}
 getGridOptions(){return {columns:12,min_columns:6,rows:Math.max(2,Math.ceil(this.getCardSize()*50/64)),min_rows:2};}
 // Only the visual reading is interpolated; sensor values remain authoritative.
 _stopAnimation(){if(this._animationFrame!=null)cancelAnimationFrame(this._animationFrame);this._animationFrame=null;this._readings.clear();}
 _reading(id,target,unit){
  const previous=this._readings.get(id),reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||globalThis.document?.hidden;
  if(!this._connected||typeof requestAnimationFrame!=='function'||reduced||target==null||previous?.value==null||previous.unit!==unit){this._readings.set(id,{value:target,target,unit});return target;}
  if(previous.target!==target){this._readings.set(id,{value:previous.value,from:previous.value,target,unit,start:null});this._queueAnimation();}
  return this._readings.get(id).value;
 }
 _queueAnimation(){
  if(this._animationFrame!=null||!this._connected)return;
  this._animationFrame=requestAnimationFrame(time=>{
   this._animationFrame=null;let pending=false;
   const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   for(const entry of this._readings.values()){
    if(entry.value===entry.target)continue;
    entry.start??=time;const progress=reduced?1:Math.min(1,(time-entry.start)/320);
    // Damped spring: quick acceleration, <1% overshoot, exact 320ms finish.
   const x=10*progress,damping=0.85,frequency=Math.sqrt(1-damping*damping);
   const eased=1-Math.exp(-damping*x)*(Math.cos(frequency*x)+damping/frequency*Math.sin(frequency*x));
   entry.value=progress===1?entry.target:entry.from+(entry.target-entry.from)*eased;
    pending ||= progress<1;
   }
   // Avoid rebuilding charts or disturbing focus on animation frames.
   this.shadowRoot.querySelectorAll('.metric').forEach(node=>{const entry=this._readings.get(node.dataset.entity);if(entry?.value!=null)node.querySelector('.value').textContent=this._format(entry.value,entry.target);});
   if(pending)this._queueAnimation();
  });
 }
 _format(value,target){const locale=this._hass?.locale?.language??this._hass?.language??'en',reference=target??value;try{const formatter=new Intl.NumberFormat(locale,Math.abs(reference)>0&&Math.abs(reference)<0.01?{maximumSignificantDigits:3}:{maximumFractionDigits:2});if(target===undefined)return formatter.format(value);const digits=formatter.formatToParts(reference).find(part=>part.type==='fraction')?.value.length??0;return new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(value);}catch{return String(value);}}
 _reloadPeriod(){this._stopAnimation();this._generation++;this._promise=null;this._history={};this._status='loading';this._refreshFailures=0;clearTimeout(this._timer);this._render();return this._refresh();}
 _refresh(){
  if(!this._connected||!this._hass||!this._config)return Promise.resolve();if(this._promise)return this._promise;
  clearTimeout(this._timer);const generation=this._generation,{start,end}=graphPeriodRange(this),ids=this._config.entities.map(r=>r.entity),hass=this._hass;
  const units=Object.fromEntries(ids.map(id=>[id,hass.states?.[id]?.attributes?.unit_of_measurement??'']));
  let requestTimer;const work=(async()=>{try{const data=await Promise.race([hass.callApi('GET',historyUrl(ids,start,end)),new Promise((_,reject)=>{requestTimer=setTimeout(()=>reject(Error('History timeout')),15000);})]);if(!this._connected||generation!==this._generation)return;
    if(!Array.isArray(data))throw Error('Invalid history');
    const grouped=new Map(data.filter(r=>Array.isArray(r)&&r.length).map(r=>[r[0].entity_id,r]));this._history=Object.fromEntries(ids.map(id=>[id,historySeries(grouped.get(id),start,end,units[id])]));this._units=units;this._start=start;this._end=end;this._status='ready';this._refreshFailures=0;
   }catch{if(generation===this._generation&&this._connected){this._status='error';this._refreshFailures=(this._refreshFailures??0)+1;}}
   finally{clearTimeout(requestTimer);if(generation===this._generation&&this._connected){this._promise=null;this._render();this._timer=setTimeout(()=>this._refresh(),retryDelay(this._refreshFailures??0));}}
  })();this._promise=work;return work;
 }
 // Fit the configured upper bound to atomic values and actual label fonts.
 // Observe text too: text enlargement need not resize the outer card.
 _observeLayout(){
  if(typeof ResizeObserver!=='function')return;
  this._layoutObserver??=new ResizeObserver(()=>this._fitColumns());
  this._layoutObserver.disconnect();
  const grid=this.shadowRoot.querySelector('.grid');if(!grid)return;
  this._layoutObserver.observe(grid);
  this.shadowRoot.querySelectorAll('.value,.label,.unit,.delta,h2,.period').forEach(node=>this._layoutObserver.observe(node));
  this._fitColumns();
 }
 _fitColumns(){
  const grid=this.shadowRoot.querySelector('.grid');if(!grid)return;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  const wordWidth=node=>{const style=getComputedStyle(node);ctx.font=style.font;return Math.max(0,...node.textContent.split(/[\s-]+/u).map(word=>ctx.measureText(word).width));};
  const title=this.shadowRoot.querySelector('h2'),period=this.shadowRoot.querySelector('.period');
  const titleMinimum=wordWidth(title);ctx.font=getComputedStyle(period).font;
  this.shadowRoot.querySelector('header').classList.toggle('stacked',titleMinimum+12+ctx.measureText(period.textContent).width>grid.clientWidth);
  let minimum=134;const values=[];
  this.shadowRoot.querySelectorAll('.metric').forEach(metric=>{
   const value=metric.querySelector('.value');value.style.removeProperty('font-size');
   const range=document.createRange();range.selectNodeContents(value);
   const scale=metric.getBoundingClientRect().width/metric.offsetWidth||1;
   let width=range.getBoundingClientRect().width/scale;
   values.push({node:value,width,font:parseFloat(getComputedStyle(value).fontSize)});
   for(const node of metric.querySelectorAll('.name,.unit,.delta'))width=Math.max(width,wordWidth(node)+(node.matches('.name')?15:0));
   minimum=Math.max(minimum,Math.ceil(width)+20);
  });
  const configured=this._config.columns==='auto'?2:Number(this._config.columns),columns=Math.max(1,Math.min(configured,this._config.entities.length,Math.floor((grid.clientWidth+16)/(minimum+16))));
  grid.style.setProperty('--overview-columns',String(columns));
  // Only a value wider than the full available reading needs smaller type.
  // Never split or round the authoritative numeric text to make it fit.
  const available=(grid.clientWidth-16*(columns-1))/columns-20;
  for(const value of values)if(value.width>available&&available>0)value.node.style.fontSize=`${value.font*available/value.width}px`;
 }
 _render(){
  if(!this._config)return;const c=this._config,dutch=nl(this._hass),active=this.shadowRoot.activeElement,focus=active?.dataset.entity,retryFocus=active?.classList.contains('retry');
  const synced=!!this._sharedTimeframe,range=this._status==='ready'?{start:this._start,end:this._end}:graphPeriodRange(this),formatter=new Intl.DateTimeFormat(dutch?'nl-NL':'en-GB',{timeZone:this._hass?.config?.time_zone||'UTC',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const period=synced?formatter.formatRange(range.start,range.end):`${c.hours_to_show} ${dutch?'uur':'hours'}`,cells=c.entities.map((row,i)=>{
   const s=this._hass?.states?.[row.entity],unit=s?.attributes?.unit_of_measurement??'',history=this._status==='ready'&&this._units[row.entity]===unit?this._history[row.entity]:null,v=synced?(history?.points.at(-1)?.v??null):numeric(s?.state),name=row.name||s?.attributes?.friendly_name||row.entity,displayValue=this._reading(row.entity,v,unit);
   const change=delta(history,v),path=history?sparkline(history.points,this._start,this._end):'';
   const status=!s?(dutch?'Sensor niet gevonden':'Entity not found'):v==null?(synced&&this._status==='loading'?(dutch?'Geschiedenis laden…':'Loading history…'):synced?(dutch?'Geen historische waarde':'No historical value'):(dutch?'Niet beschikbaar':'Unavailable')):'';
   const graphStatus=this._status==='loading'?(dutch?'Geschiedenis laden…':'Loading history…'):this._status==='error'?(dutch?'Geen geschiedenis geladen':'History not loaded'):dutch?'Geen geschiedenis':'No history';
   const difference=change==null?(dutch?'Geen vergelijkingspunt':'No comparison point'):`${change>0?'+':''}${this._format(change)}${unit?' '+(unit==='%'?'pp':unit):''}`;
   return `<button type="button" class="metric" data-entity="${esc(row.entity)}" aria-label="${esc(name+': '+(status||this._format(v)+' '+unit))}" style="--series-color:${color(row.color,PALETTE[i])}"><span class="label"><i></i><span class="name">${esc(name)}</span></span><span class="reading"><span class="value">${v==null?'—':esc(this._format(displayValue,v))}</span>${v!=null&&unit?`<span class="unit">${esc(unit)}</span>`:''}${status?`<span class="status">${status}</span>`:''}</span>${c.show_graph?`<span class="spark">${path?`<svg viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>`:`<span>${graphStatus}</span>`}</span>`:''}${c.show_delta?`<span class="delta">${v==null?'—':esc(difference)}</span><span class="caption">${dutch?'sinds begin periode':'since period start'}</span>`:''}</button>`;
  }).join('');
  this.shadowRoot.innerHTML=`<style>
:host{display:block;height:auto;min-width:0;min-height:0;container-type:inline-size}
ha-card{display:block;min-height:100%;font-family:inherit;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b)}
.content{padding:var(--eleven-card-padding,16px);box-sizing:border-box;min-width:0}
header{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px 12px;margin-bottom:16px}
h2{flex:1 1 160px;font-size:16px;font-weight:600;letter-spacing:normal;line-height:1.4;margin:0;overflow-wrap:anywhere}
header.stacked h2{flex-basis:100%}
header.stacked .period{text-align:start}
h2 small{font-size:.8em;font-weight:400;color:var(--secondary-text-color,#666);white-space:nowrap}
.period{font-size:12px;line-height:1.4;text-align:end;white-space:nowrap;flex:0 0 auto;color:var(--secondary-text-color,#666)}
.period.synced{flex:0 1 auto;white-space:normal;overflow-wrap:normal;max-width:100%;text-align:start}
.grid{display:grid;grid-template-columns:repeat(var(--overview-columns,1),minmax(0,1fr));column-gap:16px;row-gap:0;align-items:stretch}
.metric{appearance:none;font:inherit;color:inherit;background:var(--eleven-material-plot-background,transparent);border:0;border-radius:4px;text-align:start;min-width:0;min-height:44px;padding:10px;cursor:pointer;display:grid;grid-template-rows:subgrid;grid-row:span ${2+(c.show_graph?1:0)+(c.show_delta?2:0)};align-content:start;margin-bottom:20px}
.metric:focus-visible,.retry:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px}
.label{font-size:12px;color:var(--secondary-text-color,#666);line-height:1.4;overflow-wrap:anywhere;display:flex;align-items:baseline;gap:7px;min-width:0}
.label i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--series-color);flex-shrink:0}
.name{min-width:0}
.reading{display:flex;align-items:baseline;align-content:start;flex-wrap:wrap;gap:4px 6px;margin-top:6px;font-variant-numeric:tabular-nums;min-width:0}
.value{font-size:28px;font-weight:550;line-height:1.25;white-space:nowrap;flex:0 0 auto;letter-spacing:-.025em}
.unit{font-size:13px;line-height:1.4;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;min-width:0}
.spark{height:48px;box-sizing:border-box;display:flex;align-items:center;margin-top:8px;padding:2px;color:var(--secondary-text-color,#666);font-size:11px;line-height:1.4;min-width:0}
.spark svg{width:100%;height:44px;overflow:visible}
.spark path{fill:none;stroke:var(--series-color);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
.delta{font-size:12px;line-height:1.4;font-variant-numeric:tabular-nums;margin-top:8px;overflow-wrap:normal;min-width:0}
.caption{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin-top:2px;overflow-wrap:normal}
.status{font-size:12px;line-height:1.4;color:var(--secondary-text-color,#666);flex-basis:100%}
.error{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:16px;font-size:12px;color:var(--secondary-text-color,#666)}
.error>span{flex:1 1 140px}
.retry{font:inherit;min-height:44px;flex-shrink:0;padding:8px 12px;border:1px solid var(--divider-color,#ddd);border-radius:6px;background:transparent;color:inherit;cursor:pointer}
.grid{margin-bottom:-20px}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
${cardThemeStyles({wells:'.metric',controls:'.retry'})}</style><ha-card><div class="content"><header><h2>${esc(c.title)}${/\(beta\)/i.test(c.title)?'':' <small>(beta)</small>'}</h2><span class="period${synced?' synced':''}">${period}</span></header><div class="grid">${cells}</div>${this._status==='error'?`<div class="error" role="status"><span>${synced?(dutch?'Geschiedenis kon niet worden geladen.':'History could not be loaded.'):(dutch?'Geschiedenis kon niet worden geladen. Actuele waarden blijven beschikbaar.':'History could not be loaded. Live values remain available.')}</span><button type="button" class="retry">${dutch?'Opnieuw':'Retry'}</button></div>`:''}</div></ha-card>`;
  this.shadowRoot.querySelectorAll('.metric').forEach(b=>{b.onclick=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:b.dataset.entity},bubbles:true,composed:true}));if(b.dataset.entity===focus)b.focus();});const retry=this.shadowRoot.querySelector('.retry');if(retry)retry.onclick=()=>this._refresh();if(retryFocus)(retry??this.shadowRoot.querySelector('.metric'))?.focus();this._observeLayout();
 }
}

if(!customElements.get('eleven-overview-card'))customElements.define('eleven-overview-card',withCardBackground(OverviewCard));
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='eleven-overview-card'))window.customCards.push({type:'eleven-overview-card',name:'Eleven Overview (beta)',description:'Current sensor values, sparklines and change since period start.',preview:true});
})();
