// Eleven Appliance Planner — standalone advice; optional explicit integration
(()=>{
'use strict';
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

// Observed boundary deltas only: never interpolate a meter or split hourly energy.
function consumptionFromHistory(history, start, end, intervalMinutes, now = Date.now()) {
  const step = intervalMinutes * 60000;
  if (![15, 60].includes(intervalMinutes) || !Array.isArray(history)) return [];
  const samples = history.map(row => ({
    timestamp: Date.parse(row.last_updated ?? row.last_changed),
    value: row.state === null || row.state === '' ? NaN : Number(row.state),
  })).filter(row => Number.isFinite(row.timestamp)).sort((a, b) => a.timestamp - b.timestamp);
  const points = [];
  let cursor = -1;
  for (let timestamp = start; timestamp + step <= Math.min(end, now); timestamp += step) {
    while (cursor + 1 < samples.length && samples[cursor + 1].timestamp <= timestamp) cursor++;
    const first = cursor;
    while (cursor + 1 < samples.length && samples[cursor + 1].timestamp <= timestamp + step) cursor++;
    const last = cursor;
    const a = samples[first];
    const b = samples[last];
    let valid = a && b && timestamp - a.timestamp <= 300000 && timestamp + step - b.timestamp <= 300000;
    for (let i = first; valid && i <= last; i++) {
      const sample = samples[i];
      valid = Number.isFinite(sample.value) && sample.value >= 0
        && (i === first || (sample.value >= samples[i - 1].value && sample.timestamp - samples[i - 1].timestamp <= 300000));
    }
    points.push({ timestamp, endTimestamp: timestamp + step, energy: valid ? b.value - a.value : null });
  }
  return points;
}

// HA recorder change is already reset-normalized and expressed in requested kWh.
function consumptionFromStatistics(rows, start, end, now = Date.now()) {
  if (!Array.isArray(rows)) return [];
  const byStart = new Map(rows.map(row => [row.start, row]));
  const points = [];
  // Hour boundaries in absolute time; do not turn these into quarter-hour samples.
  for (let timestamp = Math.ceil(start / 3600000) * 3600000; timestamp + 3600000 <= Math.min(end, now); timestamp += 3600000) {
    const row = byStart.get(timestamp);
    const valid = row?.end === timestamp + 3600000 && typeof row.change === 'number' && Number.isFinite(row.change) && row.change >= 0;
    points.push({ timestamp, endTimestamp: timestamp + 3600000, energy: valid ? row.change : null });
  }
  return points;
}

// Overlay-only placement: preserve the established price-only tooltip geometry.
function placeEnergyTooltip(width, height, boxWidth, boxHeight, anchorX, anchorY, markers) {
  const edge = 4;
  const gap = 12;
  const clamp = (value, max) => Math.max(edge, Math.min(max - edge, value));
  const xs = [anchorX + gap, anchorX - boxWidth - gap, clamp(anchorX - boxWidth / 2, width - boxWidth), edge, width - boxWidth - edge];
  const ys = [anchorY + gap, anchorY - boxHeight - gap, ...markers.flatMap(m => [m.bottom + gap, m.top - boxHeight - gap]), edge, height - boxHeight - edge];
  for (const left of xs) {
    for (const top of ys) {
      if (left < edge || top < edge || left + boxWidth > width - edge || top + boxHeight > height - edge) continue;
      if (markers.every(m => left + boxWidth <= m.left - 4 || left >= m.right + 4 || top + boxHeight <= m.top - 4 || top >= m.bottom + 4)) return { left, top };
    }
  }
  return { left: clamp(anchorX - boxWidth / 2, width - boxWidth), top: clamp(anchorY - boxHeight / 2, height - boxHeight) };
}

function zonedParts(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function localDayKey(value, timeZone) {
  const parts = zonedParts(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localHour(value, timeZone) {
  return Number(zonedParts(value, timeZone).hour);
}

function addDaysToKey(dayKey, days) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateAveragePrice(points) {
  if (!points.length) return null;
  return points.reduce((total, point) => total + Number(point.price), 0) / points.length;
}

function offsetPriceData(data, offset) {
  const amount = Number(offset);
  if (!Array.isArray(data) || !Number.isFinite(amount)) return [];
  return data.map((entry) => ({
    ...entry,
    price_per_kwh: Number((Number(entry?.price_per_kwh) + amount).toFixed(10)),
  }));
}

function mergePriceSeries(importPoints = [], exportPoints = []) {
  const merged = new Map();
  for (const point of importPoints) {
    merged.set(point.timestamp, {
      timestamp: point.timestamp,
      startTime: point.startTime,
      dayKey: point.dayKey,
      importPrice: point.price,
    });
  }
  for (const point of exportPoints) {
    const existing = merged.get(point.timestamp) ?? {
      timestamp: point.timestamp,
      startTime: point.startTime,
      dayKey: point.dayKey,
    };
    existing.exportPrice = point.price;
    merged.set(point.timestamp, existing);
  }
  return [...merged.values()].sort((left, right) => left.timestamp - right.timestamp);
}

function classifyPrice(price, threshold = 0.25) {
  return Number(price) < Number(threshold) ? 'cheap' : 'expensive';
}

function classifyPriceLevel(price, cheapPrice = 0.15, normalPrice = 0.25, expensivePrice = 0.40) {
  const value = Number(price);
  if (value < 0) return 'negative';
  if (value <= Number(cheapPrice)) return 'cheap';
  if (value <= Number(expensivePrice)) return 'normal';
  return 'expensive';
}

function isCheapestHoursEnabled(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function normalizeLineStyle(value, fallback = 'solid') {
  const allowed = new Set(['solid', 'dashed', 'dotted']);
  return allowed.has(value) ? value : allowed.has(fallback) ? fallback : 'solid';
}

function normalizeSelectionMode(value) {
  return ['individual', 'contiguous', 'minimum_blocks'].includes(value) ? value : 'individual';
}

function normalizeLineWidth(value, fallback = 3.5) {
  const parsed = Number(value);
  const fallbackValue = Number(fallback);
  const width = Number.isFinite(parsed) ? parsed : Number.isFinite(fallbackValue) ? fallbackValue : 3.5;
  return Math.round(Math.min(8, Math.max(1, width)) * 2) / 2;
}

function rgbColorToCss(value) {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const channels = value.map(Number);
  if (!channels.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) return null;
  return `rgb(${channels.join(', ')})`;
}

function countMissingIntervals(points, intervalMinutes = inferIntervalMinutes(points)) {
  const intervalMs = Number(intervalMinutes) * 60000;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0 || points.length < 2) return 0;
  const timestamps = [...new Set(points.map((point) => Number(point.timestamp)).filter(Number.isFinite))]
    .sort((left, right) => left - right);
  let missing = 0;
  for (let index = 1; index < timestamps.length; index += 1) {
    const steps = Math.round((timestamps[index] - timestamps[index - 1]) / intervalMs);
    if (steps > 1) missing += steps - 1;
  }
  return missing;
}

function relativeAgeLabel(value, now = new Date()) {
  const timestamp = new Date(value).getTime();
  const nowTimestamp = new Date(now).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(nowTimestamp)) return 'onbekend';
  const minutes = Math.max(0, Math.floor((nowTimestamp - timestamp) / 60000));
  if (minutes < 1) return 'zojuist';
  if (minutes < 60) return `${minutes} min geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'dag' : 'dagen'} geleden`;
}

function groupSelectedPeriods(points, selected, intervalMinutes) {
  const intervalMs = Number(intervalMinutes) * 60000;
  const periods = [];
  const chosen = points
    .filter((point) => selected.has(point.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  for (const point of chosen) {
    const last = periods.at(-1);
    const endTimestamp = point.timestamp + intervalMs;
    if (last && last.dayKey === point.dayKey && last.endTimestamp === point.timestamp) {
      last.averagePrice = (last.averagePrice * last.durationMinutes + point.price * Number(intervalMinutes))
        / (last.durationMinutes + Number(intervalMinutes));
      last.endTimestamp = endTimestamp;
      last.durationMinutes += Number(intervalMinutes);
    } else {
      periods.push({
        dayKey: point.dayKey,
        startTimestamp: point.timestamp,
        endTimestamp,
        durationMinutes: Number(intervalMinutes),
        averagePrice: point.price,
      });
    }
  }
  return periods;
}

function createPriceTicks(minimum, maximum, count = 5) {
  const size = Math.max(2, Math.trunc(count));
  const step = (Number(maximum) - Number(minimum)) / (size - 1);
  return Array.from({ length: size }, (_, index) => Number((Number(maximum) - step * index).toFixed(10)));
}

// get_price returns unscaled base-currency totals, not chartdata metadata.
function tibberPriceData(response, source = 'tibber_prices', home) {
  if(source==='tibber') {
    const prices=response?.prices;
    if(!prices || typeof prices!=='object' || Array.isArray(prices))throw Error('format');
    const homes=Object.keys(prices);
    if(!home && homes.length!==1)throw Error('home');
    const selected=home || homes[0];
    if(!Object.hasOwn(prices,selected) || !Array.isArray(prices[selected]))throw Error('home');
    return prices[selected].flatMap(row=>{
      if(typeof row?.price!=='number' || !Number.isFinite(row.price) || typeof row.start_time!=='string' || !Number.isFinite(Date.parse(row.start_time)))return [];
      return [{start_time:row.start_time,price_per_kwh:row.price}];
    });
  }
  if(response?.success===false)throw Error('unavailable');
  if(!Array.isArray(response?.price_info))throw Error('format');
  return response.price_info.flatMap(row=>{
    if(typeof row?.total!=='number' || !Number.isFinite(row.total) || typeof row.startsAt!=='string' || !Number.isFinite(Date.parse(row.startsAt)))return [];
    return [{start_time:row.startsAt,price_per_kwh:row.total}];
  });
}

function tibberPriceRange(now, timeZone) {
  const day=localDayKey(now,timeZone);
  const midnight=key=>{
    const target=Date.parse(`${key}T00:00:00Z`);
    let instant=target;
    // Resolve each midnight independently: a two-day range can span 47/49 hours.
    for(let i=0;i<4;i++) {
      const p=zonedParts(instant,timeZone);
      const local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
      if(local===target)return new Date(instant).toISOString();
      instant+=target-local;
    }
    throw Error('timezone');
  };
  return {start_time:midnight(day),end_time:midnight(addDaysToKey(day,2))};
}

// Zonneplan One exposes raw fixed-point amounts in forecast, not its scaled sensor state.
function zonneplanPriceData(forecast) {
  if(!Array.isArray(forecast))return [];
  return forecast.flatMap(row=>{
    const start_time=row?.start_date ?? row?.datetime;
    const amount=row?.price_tax_included?.amount ?? row?.electricity_price;
    if(typeof amount!=='number' || !Number.isFinite(amount) || !Number.isFinite(Date.parse(start_time)))return [];
    return [{start_time,price_per_kwh:amount/10000000}];
  });
}

function normalizePoints(data, timeZone) {
  if (!Array.isArray(data)) return [];
  return data
    .map((entry) => {
      const timestamp = new Date(entry?.start_time).getTime();
      const price = Number(entry?.price_per_kwh);
      if (!Number.isFinite(timestamp) || !Number.isFinite(price)) return null;
      return {
        startTime: entry.start_time,
        timestamp,
        price,
        dayKey: localDayKey(timestamp, timeZone),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.timestamp - right.timestamp);
}

function getVisiblePoints(data, now = new Date(), timeZone = 'Europe/Amsterdam', tomorrowAfterHour = 14) {
  const today = localDayKey(now, timeZone);
  const tomorrow = addDaysToKey(today, 1);
  const showTomorrow = localHour(now, timeZone) >= Number(tomorrowAfterHour);
  return normalizePoints(data, timeZone).filter(
    (point) => point.dayKey === today || (showTomorrow && point.dayKey === tomorrow),
  );
}

function splitByLocalDay(points) {
  const groups = new Map();
  for (const point of points) {
    if (!groups.has(point.dayKey)) groups.set(point.dayKey, []);
    groups.get(point.dayKey).push(point);
  }
  return groups;
}

function inferIntervalMinutes(points) {
  const differences = [];
  for (let index = 1; index < points.length; index += 1) {
    const minutes = (points[index].timestamp - points[index - 1].timestamp) / 60000;
    if (minutes > 0 && minutes <= 180) differences.push(minutes);
  }
  if (!differences.length) return 60;
  differences.sort((a, b) => a - b);
  return differences[Math.floor(differences.length / 2)];
}

function findCurrentPoint(points, now = new Date()) {
  if (!points.length) return null;
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const intervalMs = inferIntervalMinutes(points) * 60000;
  return points.find((point) => point.timestamp <= timestamp && timestamp < point.timestamp + intervalMs) ?? null;
}

// The graph and Energy grid details must select the same active interval.
function currentPricePoint(data, now = new Date(), timeZone = 'Europe/Amsterdam', tomorrowAfter = 14, offset = 0) {
  return findCurrentPoint(getVisiblePoints(offsetPriceData(data, offset), now, timeZone, tomorrowAfter), now);
}

function selectCheapestDuration(points, totalMinutes = 240, options = {}) {
  return selectDurationByPrice(points, totalMinutes, 'lowest', options);
}

function selectHighestDuration(points, totalMinutes = 240, options = {}) {
  return selectDurationByPrice(points, totalMinutes, 'highest', options);
}

function compareScore(candidate, current, direction) {
  if (!current) return true;
  return direction === 'highest' ? candidate > current.score : candidate < current.score;
}

function selectContiguousDuration(points, count, intervalMinutes, direction) {
  let best = null;
  for (let start = 0; start + count <= points.length; start += 1) {
    const window = points.slice(start, start + count);
    const contiguous = window.every((point, index) => (
      index === 0 || point.timestamp - window[index - 1].timestamp === intervalMinutes * 60000
    ));
    if (!contiguous) continue;
    const score = window.reduce((total, point) => total + point.price, 0);
    if (compareScore(score, best, direction)) best = { score, window };
  }
  return new Set((best?.window ?? []).map((point) => point.timestamp));
}

function selectMinimumBlocks(points, count, intervalMinutes, minimumBlockMinutes, direction) {
  const requestedMinimum = Number(minimumBlockMinutes);
  const minimumCount = Math.max(1, Math.min(
    count,
    Number.isFinite(requestedMinimum) ? Math.ceil(requestedMinimum / intervalMinutes) : 2,
  ));
  let states = new Map([['0|0', { selected: 0, run: 0, score: 0, indices: [] }]]);
  for (let index = 0; index < points.length; index += 1) {
    const contiguous = index === 0 || points[index].timestamp - points[index - 1].timestamp === intervalMinutes * 60000;
    const next = new Map();
    const save = (state) => {
      const key = `${state.selected}|${state.run}`;
      if (compareScore(state.score, next.get(key), direction)) next.set(key, state);
    };
    for (const original of states.values()) {
      if (!contiguous && original.run > 0 && original.run < minimumCount) continue;
      const state = !contiguous && original.run >= minimumCount ? { ...original, run: 0 } : original;
      if (state.run === 0 || state.run >= minimumCount) save({ ...state, run: 0 });
      if (state.selected < count) {
        const run = state.run === 0 ? 1 : Math.min(minimumCount, state.run + 1);
        save({
          selected: state.selected + 1,
          run,
          score: state.score + points[index].price,
          indices: [...state.indices, index],
        });
      }
    }
    states = next;
  }
  const candidates = [...states.values()].filter((state) => (
    state.selected === count && (state.run === 0 || state.run >= minimumCount)
  ));
  const best = candidates.reduce((current, candidate) => (
    compareScore(candidate.score, current, direction) ? candidate : current
  ), null);
  return new Set((best?.indices ?? []).map((index) => points[index].timestamp));
}

function selectDurationByPrice(points, totalMinutes, direction, options = {}) {
  const selected = new Set();
  if (!points.length || totalMinutes <= 0) return selected;
  const intervalMinutes = inferIntervalMinutes(points);
  const count = Math.min(points.length, Math.ceil(totalMinutes / intervalMinutes));
  const mode = normalizeSelectionMode(options.mode);
  if (mode === 'contiguous') return selectContiguousDuration(points, count, intervalMinutes, direction);
  if (mode === 'minimum_blocks') {
    return selectMinimumBlocks(points, count, intervalMinutes, options.minimumBlockMinutes, direction);
  }
  const ordered = [...points].sort(
    direction === 'highest'
      ? (left, right) => right.price - left.price || left.timestamp - right.timestamp
      : (left, right) => left.price - right.price || left.timestamp - right.timestamp,
  );
  for (const point of ordered.slice(0, count).sort((left, right) => left.timestamp - right.timestamp)) {
    selected.add(point.timestamp);
  }
  return selected;
}

// Pure advisory calculations. All elapsed durations use instants, not wall-clock arithmetic.
function instant(value) {
 if(typeof value==='string'&&!/(Z|[+-]\d\d:\d\d)$/i.test(value))throw Error('Tijdzone ontbreekt');
 const n=+new Date(value);if(!Number.isFinite(n))throw Error('Ongeldige datum');return n;
}
function localValue(date,zone){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(date)).replace(' ','T');}
function localInputISO(value,zone){
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw Error('Kies een geldige datum en tijd');
 const parsed=Date.parse(value+'Z');let target=parsed;
 for(let i=0;i<4;i++)target+=parsed-Date.parse(localValue(target,zone)+'Z');
 if(!Number.isFinite(target)||localValue(target,zone)!==value)throw Error('Deze lokale tijd bestaat niet');
 for(const delta of [-3600000,3600000])if(localValue(target+delta,zone)===value)throw Error('Deze lokale tijd is dubbel door wintertijd');
 return new Date(target).toISOString();
}
function canonicalPrices(data,intervalMinutes){
 if(!Array.isArray(data)||!data.length)throw Error('Geen prijsintervallen beschikbaar');
 const rows=data.map(r=>({start:instant(r.start??r.start_time),end:r.end?instant(r.end):null,price:Object.hasOwn(r,'price')?r.price:r.price_per_kwh})).sort((a,b)=>a.start-b.start);
 if(rows.some(r=>typeof r.price!=='number'||!Number.isFinite(r.price)))throw Error('Ongeldige prijs');
 // Start-only contracts need a demonstrated cadence. Never stretch a gap to the next start.
 const diffs=rows.slice(1).map((r,i)=>(r.start-rows[i].start)/60000).filter(n=>n>0&&n<=60);
 const cadence=intervalMinutes??(diffs.length?Math.min(...diffs):null);
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(r.end===null){if(![15,30,60].includes(cadence))throw Error('Prijsinterval onbekend; geef expliciete eindtijden');r.end=r.start+cadence*60000;}
  if(r.end<=r.start||i&&rows[i-1].end>r.start)throw Error('Ongeldige of overlappende prijsintervallen');
 }
 return rows.map(r=>({start:new Date(r.start).toISOString(),end:new Date(r.end).toISOString(),price:r.price}));
}
function advise(data,program,earliest,deadline){
 const start=instant(earliest),limit=instant(deadline),minutes=Number(program.minutes),kwh=Number(program.kwh),duration=minutes*60000;
 if(!(minutes>=1&&minutes<=1440&&kwh>0&&kwh<=30))throw Error('Vul duur en totaal kWh in');
 if(limit-start>7*86400000)throw Error('Kies maximaal zeven dagen vooruit');
 if(duration>limit-start)throw Error('Dit programma past niet vóór de eindtijd');
 const rows=canonicalPrices(data).map(r=>({...r,start:instant(r.start),end:instant(r.end)}));
 const costAt=(a,b)=>{
  let cursor=a,area=0;
  for(const r of rows){if(r.end<=cursor)continue;if(r.start>cursor)return null;const end=Math.min(b,r.end);area+=(end-cursor)*r.price;cursor=end;if(cursor>=b)return area/duration*kwh;}
  return null;
 };
 const candidates=new Set([start,limit-duration]);
 for(const r of rows)for(const t of [r.start,r.end,r.start-duration,r.end-duration])if(t>=start&&t<=limit-duration)candidates.add(t);
 let best=null;
 for(const t of [...candidates].sort((a,b)=>a-b)){const cost=costAt(t,t+duration);if(cost!==null&&(!best||cost<best.cost-1e-10))best={start:new Date(t).toISOString(),end:new Date(t+duration).toISOString(),cost};}
 if(!best)throw Error('Nog geen volledig geprijsd tijdvak beschikbaar');
 const immediate=costAt(start,start+duration);
 return {...best,kwh,average:best.cost/kwh,savings:immediate===null?null:Math.max(0,immediate-best.cost),immediate_cost:immediate,provisional:costAt(start,limit)===null,profile_source:'uniform'};
}



const SOURCES=['sensor','energyzero','tibber','tibber_prices','zonneplan'];
async function fetchTariffs(hass,config,now=new Date()){
 const source=config.source||'sensor',zone=hass.config?.time_zone||'Europe/Amsterdam';
 if(hass.config?.currency&&hass.config.currency!=='EUR')throw Error('Alleen EUR/kWh wordt ondersteund');
 if(source==='sensor'||source==='zonneplan'){
  const state=hass.states?.[config.entity];
  if(!state||['unavailable','unknown'].includes(state.state))throw Error('Kies een beschikbare prijsbron');
  if(source==='zonneplan'){const raw=state.attributes.forecast,parsed=zonneplanPriceData(raw);if(!Array.isArray(raw)||parsed.length!==raw.length)throw Error('Ongeldige Zonneplan-prijsgegevens');return canonicalPrices(parsed);}
  if(!['EUR/kWh','€/kWh'].includes(state.attributes.unit_of_measurement))throw Error('Prijssensor moet EUR/kWh gebruiken');
  return canonicalPrices(state.attributes.data??state.attributes.prices);
 }
 if(source==='energyzero'){
  if(!config.energyzero_entry)throw Error('Kies een EnergyZero-configuratie');
  const today=localValue(now,zone).slice(0,10),days=[today,new Date(Date.parse(today+'T12:00Z')+86400000).toISOString().slice(0,10)];let rows=[];
  for(let i=0;i<days.length;i++)try{
   const {response}=await hass.callWS({type:'call_service',domain:'energyzero',service:'get_energy_prices',service_data:{config_entry:config.energyzero_entry,incl_vat:true,price_type:'all_in',interval:'quarter',start:days[i],end:days[i]},return_response:true});
   rows.push(...response.prices.map(r=>({start:r.start??r.timestamp,end:r.end,price:r.price})));
  }catch(error){if(!i)throw error;}
  return canonicalPrices(rows,15);
 }
 if(source==='tibber'||source==='tibber_prices'){
  const range=tibberPriceRange(now,zone),service_data=source==='tibber'?{start:range.start_time,end:range.end_time}:{...range,...(config.tibber_entry?{entry_id:config.tibber_entry}:{})};
  const {response}=await hass.callWS({type:'call_service',domain:source,service:source==='tibber'?'get_prices':'get_price',service_data,return_response:true});
  const parsed=tibberPriceData(response,source,config.tibber_home);
  const raw=source==='tibber'?response.prices[config.tibber_home||Object.keys(response.prices)[0]]:response.price_info;
  if(parsed.length!==raw.length)throw Error('Ongeldige Tibber-prijsgegevens');
  return canonicalPrices(parsed);
 }
 throw Error('Onbekende prijsbron');
}


const plannerCSS=`
:host{display:block;color:var(--primary-text-color,#20252b);font-family:var(--ha-font-family-body,system-ui)}*{box-sizing:border-box}ha-card{display:block;padding:var(--eleven-card-padding,16px);background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,12px);overflow:hidden}header{display:flex;gap:8px;align-items:center;margin-bottom:16px}h2{margin:0;flex:1;font-size:16px;font-weight:600;line-height:1.3}h3{font-size:14px;margin:16px 0 8px}.muted,small{color:var(--secondary-text-color,#626873);font-size:12px;line-height:1.5}fieldset{border:0;padding:0;margin:0 0 16px;min-width:0}legend,label{font-size:13px;line-height:1.5}legend{color:var(--secondary-text-color,#626873);padding:0;margin-bottom:8px}.choices,.actions{display:flex;flex-wrap:wrap;gap:8px}.choices button{flex:1 1 110px;display:flex;align-items:center;justify-content:center;gap:8px;white-space:normal;overflow-wrap:normal;word-break:normal}.choices ha-icon{--mdc-icon-size:20px;flex:0 0 20px}.choices [aria-pressed=true]{border-color:transparent}button,input,select{font:inherit;color:inherit;font-size:14px;min-height:44px;border-radius:8px;max-width:100%}button{border:1px solid transparent;padding:10px 12px;background:var(--secondary-background-color,#f4f5f7);cursor:pointer;font-weight:550}input,select{width:100%;min-width:0;border:1px solid var(--divider-color,#ddd);padding:8px;background:var(--secondary-background-color,#f4f5f7);color-scheme:var(--planner-color-scheme,inherit)}button.primary{background:var(--primary-color,#3973ca);color:var(--text-primary-color,#fff)}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color,#3973ca);outline-offset:2px}button.text{background:transparent;color:var(--secondary-text-color,#626873);font-size:12px}.date-time{display:grid;grid-template-columns:minmax(0,1fr) 145px;gap:8px}.quick{display:flex;gap:8px}.quick [aria-pressed=true]{text-decoration:none}.advice{border-top:1px solid var(--divider-color,#ddd);padding-top:16px}.time{font-size:32px;line-height:1.2;font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:4px 0}.date{font-size:13px;line-height:1.5}.metrics{display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;margin:16px 0 8px}.metrics span{display:block;font-size:12px;color:var(--secondary-text-color,#626873)}.metrics strong{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums}.status{font-size:13px;line-height:1.5;margin:8px 0}.warning{color:var(--primary-text-color,#20252b);border-left:3px solid var(--warning-color,#b26a00);padding-left:8px}.error{color:var(--error-color,#bb2424)}details{margin-top:12px;border-top:1px solid var(--divider-color,#ddd)}summary{min-height:44px;align-content:center;cursor:pointer;font-size:13px}.graph{width:100%;height:132px;display:block}.graph line{stroke:var(--divider-color,#ddd)}.graph .tariff{stroke:var(--primary-color,#3973ca);stroke-width:2;fill:none;vector-effect:non-scaling-stroke}.graph .highlight{fill:var(--primary-color,#3973ca);opacity:.12}.graph text{fill:var(--secondary-text-color,#626873);font-size:11px}.graph-labels{display:flex;justify-content:space-between}.plan{border-top:1px solid var(--divider-color,#ddd);padding:12px 0}.plan strong{font-size:14px}.plan .actions{margin-top:8px}.fields{display:grid;gap:12px}.program-fields{display:grid;grid-template-columns:minmax(0,1fr) 80px 80px;gap:8px}.program-fields label{font-size:12px}.editor-group{padding:12px 0;border-top:1px solid var(--divider-color,#ddd)}.check{display:flex;align-items:center;gap:8px}.check input{width:20px;min-height:44px}.feedback:empty{display:none}.empty{font-size:14px;line-height:1.5}.owned{font-size:12px;color:var(--secondary-text-color,#626873)}@media(max-width:350px){ha-card{padding:var(--eleven-card-padding,16px)}.program-fields{grid-template-columns:1fr 1fr}.program-fields label:first-child{grid-column:1/-1}.choices button{flex-basis:100px}}
@media(max-width:350px){.date-time{grid-template-columns:1fr}.program-fields.thresholds{grid-template-columns:1fr 1fr}.program-fields.thresholds label:first-child{grid-column:auto}}
.program-fields.thresholds{grid-template-columns:1fr 1fr}
/* Daily layout: compact controls and one supplementary disclosure. */
:host{container-type:inline-size}header{margin-bottom:12px}.selection{display:grid;gap:8px;margin-bottom:12px}.selection label{display:grid;gap:4px;min-width:0}.selection label>span{color:var(--secondary-text-color,#626873);font-size:12px}.deadline{margin-bottom:4px}.deadline legend{font-size:12px;margin-bottom:4px}.quick{gap:0}.quick button{padding:8px 12px}.advice{padding-top:12px}.run-times{display:grid;grid-template-columns:1fr 1fr;gap:12px}.run-times>div{display:grid;gap:2px}.run-times strong{font-size:22px;line-height:1.3;font-weight:600;font-variant-numeric:tabular-nums}.cost-line{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:12px}.cost-line strong{font-size:16px;font-variant-numeric:tabular-nums}.price-level{font-size:12px;line-height:1.5;font-weight:600;padding:2px 8px;border-radius:6px;background:var(--secondary-background-color,#f4f5f7)}.price-level.cheap,.price-level.negative{color:var(--primary-text-color,#20252b);border-left:3px solid var(--success-color,#18733c);background:color-mix(in srgb,var(--success-color,#18733c) 15%,var(--ha-card-background,var(--card-background-color,#fff)))}.price-level.expensive{color:var(--primary-text-color,#20252b);border-left:3px solid var(--error-color,#bb2424);background:color-mix(in srgb,var(--error-color,#bb2424) 15%,var(--ha-card-background,var(--card-background-color,#fff)))}#advice-details{margin-top:8px}.detail-row{display:flex;justify-content:space-between;gap:8px;font-size:13px}.tariff-detail{margin-top:12px}.tariff-detail>p{margin:0 0 8px}.advice>.primary{width:100%;margin-top:8px}#advice-slot>.status:empty{display:none}ha-card>p.muted{margin:8px 0 0;font-size:11px}.graph-labels{gap:8px}.graph-labels span:last-child{text-align:right}
@container(min-width:420px){.selection{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
@container(max-width:305px){.date-time{grid-template-columns:1fr}}
.choices [aria-pressed=true],.quick [aria-pressed=true]{border-color:transparent;color:var(--accent-color,var(--primary-color));text-decoration:none;background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--secondary-background-color)));transform:translateY(1px)}
/* Planner's daily form: spacing belongs here; depth belongs to the theme. */
.selection{gap:8px}h2{min-width:0;overflow-wrap:anywhere}.date-time{grid-template-columns:minmax(0,1fr) minmax(96px,.65fr)}.quick{gap:8px;margin:8px 0 4px}.quick button{min-width:44px;font-size:13px;flex:1}.advice{border:0;padding-top:0}.reading-well{padding:8px 12px;background:var(--eleven-material-plot-background,transparent)}.run-times{grid-template-columns:repeat(auto-fit,minmax(min(100%,7em),1fr))}.run-times>div{min-width:0}.cost-line>span:first-child{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.cost-line{margin-top:8px}.detail-row{flex-wrap:wrap}.detail-body{padding:12px}.plan strong{overflow-wrap:anywhere}.status{overflow-wrap:anywhere}
#advice-details{margin-top:12px;border:0;border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}#advice-details[open]{background:var(--eleven-material-plot-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-well,none)}summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;min-width:44px;padding:10px 12px;list-style:none;border:1px solid var(--divider-color,#ddd);font-weight:500}summary::-webkit-details-marker{display:none}summary::after{content:'';width:8px;height:8px;flex:none;margin:0 2px 4px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg)}details[open]>summary::after{transform:rotate(225deg);margin-bottom:0}
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline-color:var(--accent-color,var(--primary-color,#3973ca))}.field-error{margin:4px 0 0;color:var(--error-color,#bb2424);font-size:12px;line-height:1.5}.field-error:empty{display:none}.deadline label{display:grid;gap:4px;min-width:0}.deadline label>span{font-size:12px;color:var(--secondary-text-color,#626873)}
${cardThemeStyles({wells:'input:not([type=range]):not([type=checkbox]),select,.reading-well',plots:'.graph',controls:'.choices button:not([aria-pressed=true]),.quick button:not([aria-pressed=true]),.actions button,summary',selected:'.choices [aria-pressed=true],.quick [aria-pressed=true]'})}
#advice-details[open]{background:transparent;box-shadow:none}#advice-details>.detail-body{margin-top:8px;border-radius:var(--eleven-material-radius-well,var(--ha-card-border-radius,12px));background:var(--eleven-material-plot-background,var(--secondary-background-color,transparent));box-shadow:var(--eleven-material-well,none)}#advice-details>summary{border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}summary:not(:disabled):active{box-shadow:var(--eleven-material-disclosure-pressed-shadow,none)}
ha-card>p.muted{margin:12px 0 0;font-size:12px;line-height:1.5}
.price-level,.price-level:is(.cheap,.negative,.expensive){display:inline-flex;align-items:center;gap:6px;padding:0;border:0;border-radius:0;background:none;box-shadow:none;color:var(--secondary-text-color,#626873);font-weight:500}
.price-level::before{content:'';flex:none;width:6px;height:6px;border-radius:50%;background:var(--secondary-text-color,#626873)}.price-level:is(.cheap,.negative)::before{background:var(--success-color,#18733c)}.price-level.expensive::before{background:var(--error-color,#bb2424)}
/* Flex bases scale with text: ordinary fields stay together; enlarged text wraps. */
.date-time{display:flex;flex-wrap:wrap;gap:8px}.date-time label{flex:1 1 10em}.date-time label:last-child{flex:1 1 6em}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}@media(forced-colors:active){.reading-well,#advice-details>.detail-body{box-shadow:none;background:Canvas;border:1px solid CanvasText}.price-level::before{background:CanvasText}}
`;





const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));

const active=p=>['planned','reminded','running'].includes(p.status);
const kinds={washer:'Wasmachine',dryer:'Droger',washer_dryer:'Wasdroogcombi',dishwasher:'Vaatwasser'};

const EN={'Apparatenplanner':'Appliance planner','Apparaat':'Appliance','Programma':'Program','Klaar vóór':'Ready before','Datum':'Date','Tijd':'Time','Vandaag':'Today','Morgen':'Tomorrow','Start om':'Start at','Klaar om':'Finish at','Geschatte kosten':'Estimated cost','Gemiddeld':'Average','Goedkoop':'Cheap','Normaal':'Normal','Duur':'Expensive','Negatief':'Negative','Besparing t.o.v. direct starten':'Savings vs starting now','Vergelijking niet beschikbaar':'Comparison unavailable','Tarieven en geadviseerde draaibeurt':'Tariffs and advised run','Instellingen':'Settings','Inplannen':'Save plan','Ingepland':'Planned','Gestart':'Started','Klaar':'Done','Annuleren':'Cancel','Gelijkmatig verbruik':'Uniform consumption','Gesimuleerd profiel':'Simulated profile','Gemeten profiel':'Measured profile','Lineaire schatting — integratie niet beschikbaar. Planning en meting zijn uitgeschakeld.':'Linear estimate — integration unavailable. Planning and measurement are disabled.','Berekenen…':'Calculating…','Instellen via de dashboard-editor. Wijzigingen worden pas gedeeld na Opslaan in het dashboard.':'Configure through the dashboard editor. Changes are shared only after saving the dashboard.','Duur (minuten)':'Duration (minutes)','Totaal kWh':'Total kWh','Naam':'Name','Bewaar programma':'Save program','Nieuw programma':'New program','Apparaat toevoegen':'Add appliance','Prijsbron':'Price source','Prijssensor':'Price sensor','Goedkoop tot (ct/kWh)':'Cheap up to (ct/kWh)','Duur boven (ct/kWh)':'Expensive above (ct/kWh)','Integratie koppelen':'Link integration','Integratie ontkoppelen':'Unlink integration','Programma’s overdragen':'Transfer programs','Geen programma’s. Open Instellingen in de dashboard-editor.':'No programs. Open Settings in the dashboard editor.','Voorlopig — niet alle prijzen tot de eindtijd zijn bekend. Alleen volledig geprijsde draaibeurt; geen gegarandeerd goedkoopste moment over de hele periode.':'Provisional — not all prices up to the deadline are known. Fully priced run only; no guaranteed optimum across the whole period.','Alleen advies. Je zet het apparaat zelf aan.':'Advice only. You start the appliance yourself.','Profielmodus':'Profile mode','Vermogensmeter':'Power meter','Geen meter':'No meter','Bewaar apparaat':'Save appliance','Meldingsactie':'Notification action','Bewaar meldingsactie':'Save notification action','Ook integratieprogramma’s als eenvoudige instellingen kopiëren':'Also copy integration programs to simple settings','Conflicten expliciet vervangen (bestaande metingen blijven behouden)':'Explicitly replace conflicts (existing measurements are retained)','Expliciete koppeling; installatie alleen schakelt niets in.':'Explicit link; installation alone enables nothing.','Geen overdracht geselecteerd':'No transfer selected','Instellingen niet beschikbaar voor deze gebruiker.':'Settings unavailable for this user.'};
Object.assign(EN,{'Bewaar instellingen':'Save settings','Apparaten en programma’s':'Appliances and programs','Integratie (optioneel)':'Integration (optional)','Integratie':'Integration','Type':'Type','Tibber-woning':'Tibber home','Wasmachine':'Washing machine','Droger':'Dryer','Wasdroogcombi':'Washer dryer','Vaatwasser':'Dishwasher','Integratie beheert deze programma’s. Metingen blijven behouden bij wijzigingen.':'The integration owns these programs. Changes retain measurements.','Exacte woningnaam; leeg kiest de enige woning. Alleen een EUR-woning gebruiken.':'Exact home name; leave blank for a sole home. Only use an EUR-priced home.','Starttijd bereikt':'Start time reached','Bezig':'Running'});
EN['Klaar vóór einde van']='Ready by the end of';
function localize(root,en){if(!en)return;const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(n.parentElement?.closest('[data-user],style,script'))continue;const raw=n.textContent,key=raw.trim();if(EN[key])n.textContent=raw.replace(key,EN[key]);}for(const el of root.querySelectorAll('[aria-label]'))if(EN[el.getAttribute('aria-label')])el.setAttribute('aria-label',EN[el.getAttribute('aria-label')]);}

function validateConfig(config){
 const c=clone(config);c.appliances??=[];c.tariff??={source:'sensor'};c.cheap_price??=.15;c.expensive_price??=.4;
 if(!SOURCES.includes(c.tariff.source||'sensor'))throw Error('Onbekende prijsbron');
 if(!Number.isFinite(c.cheap_price)||!Number.isFinite(c.expensive_price)||c.cheap_price>c.expensive_price)throw Error('Ongeldige prijsgrenzen');
 if(!Array.isArray(c.appliances)||c.appliances.length>30)throw Error('Ongeldige apparaten');
 const aids=new Set();for(const a of c.appliances){if(!a.id||aids.has(a.id)||!a.name?.trim()||!kinds[a.kind]||!Array.isArray(a.programs)||a.programs.length>30)throw Error('Ongeldig apparaat');aids.add(a.id);const pids=new Set();for(const p of a.programs){if(!p.id||pids.has(p.id)||!p.name?.trim()||!(Number(p.minutes)>=1&&Number(p.minutes)<=1440&&Number(p.kwh)>0&&Number(p.kwh)<=30))throw Error('Ongeldig programma');pids.add(p.id);}}
 return c;
}
class ElevenAppliancePlanner extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.form={};this.epoch=0;this.message='';this.lastKnown=[];}
 static getStubConfig(){return {type:'custom:eleven-appliance-planner',appliances:[],tariff:{source:'sensor'}};}
 static getConfigElement(){return document.createElement('eleven-appliance-planner-editor');}
 getCardSize(){return 5;}getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 setConfig(config){this.backendOutage=false;this.tariffRequest=null;this.config=validateConfig(config);this.epoch++;this.lastKnown=clone(this.config.integration?.programs_snapshot||[]);this.render();this.recompute();}
 set hass(h){const previous=this._hass;if(previous?.connection!==h.connection||previous?.connection?.connected===false||h.connection?.connected===false)this.tariffRequest=null;this._hass=h;if(this.online)this.lastKnown=clone(this.integrationData.appliances||[]);const signature=JSON.stringify([h.states?.[this.config?.tariff?.entity],this.config?.integration?.enabled?h.states?.[this.config.integration.entity]:null,h.connection?.connected,h.config?.time_zone,h.locale?.language,h.user?.is_admin]);if(signature!==this.signature||previous?.connection!==h.connection){this.signature=signature;this.recompute();}else if(!this.shadowRoot.firstChild)this.render();}
 get hass(){return this._hass;}get zone(){return this._hass?.config?.time_zone||'Europe/Amsterdam';}get en(){return this._hass?.locale?.language?.startsWith('en');}
 get linked(){return this.config?.integration?.enabled===true;}
 get integrationState(){return this._hass?.states?.[this.config?.integration?.entity];}
 get entityOnline(){return this.linked&&this._hass?.connection?.connected!==false&&this.integrationState&&this.integrationData.protocol_version>=2&&!['unknown','unavailable'].includes(this.integrationState.state);}
 get online(){return this.entityOnline&&!this.backendOutage;}
 get integrationData(){return this.integrationState?.attributes||{};}
 get appliances(){return this.linked?(this.online?this.integrationData.appliances||[]:this.lastKnown):this.config?.appliances||[];}
 connectedCallback(){this.render();this.recompute();this.timer=setInterval(()=>this.recompute(),60000);}
 disconnectedCallback(){clearInterval(this.timer);this.tariffRequest=null;this.epoch++;}
 format(n,digits=2){return new Intl.NumberFormat(this.en?'en-GB':'nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);}
 price(n){return new Intl.NumberFormat(this.en?'en-GB':'nl-NL',{style:'currency',currency:'EUR'}).format(n);}
 time(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));}
 day(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,weekday:'long',year:'numeric',day:'numeric',month:'long'}).format(new Date(s));}
 shortDay(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,day:'numeric',month:'short',year:'numeric'}).format(new Date(s));}
 today(offset=0){const day=localValue(Date.now(),this.zone).slice(0,10);return new Date(Date.parse(day+'T12:00Z')+offset*86400000).toISOString().slice(0,10);}
 selected(){const a=this.appliances.find(x=>x.id===this.form.aid)||this.appliances[0];this.form.aid=a?.id;const p=a?.programs.find(x=>x.id===this.form.pid)||a?.programs[0];this.form.pid=p?.id;return [a,p];}
 // Calendar arithmetic first; localInputISO resolves the zone's actual midnight.
 syncDay(){const previous=this.form.deadline,today=this.today();if(![today,this.today(1)].includes(this.form.day))this.form.day=today;const next=new Date(this.form.day+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);this.form.deadline=next.toISOString().slice(0,10)+'T00:00';return !!previous&&previous!==this.form.deadline;}
 payload(){this.syncDay();return {appliance_id:this.form.aid,program_id:this.form.pid,deadline:localInputISO(this.form.deadline,this.zone),tariff_source:clone(this.config.tariff)};}
 command(operation,payload={}){return this._hass.callWS({type:'eleven_appliance_planner/command',operation,payload});}
 async tariffs(now){
  if(['sensor','zonneplan'].includes(this.config.tariff.source||'sensor'))return fetchTariffs(this._hass,this.config.tariff,now);
  const key=JSON.stringify([this.config.tariff,this.zone,this._hass.config?.currency,this.today()]);
  if(this.tariffRequest?.key===key&&Date.now()-this.tariffRequest.created<300000)return this.tariffRequest.promise;
  const request={key,created:Date.now()};request.promise=fetchTariffs(this._hass,this.config.tariff,now).catch(error=>{if(this.tariffRequest===request)this.tariffRequest=null;throw error;});this.tariffRequest=request;return request.promise;
 }
 async recompute(){
  if(!this.config||!this._hass)return;
  if(this.entityOnline)this.lastKnown=clone(this.integrationData.appliances||[]);
  const epoch=++this.epoch;const [a,p]=this.selected();this.syncDay();
  if(!p){this.result=null;this.render();return;}
  this.loading=true;this.result=null;this.message='';this.error=false;this.render();
  try{
   const deadline=localInputISO(this.form.deadline,this.zone),now=new Date();
   const rows=await this.tariffs(now);
   if(epoch!==this.epoch)return;
   this.rows=rows;
   let result;
   if(this.entityOnline){
    try{result=await this.command('preview',this.payload());if(epoch!==this.epoch)return;this.backendOutage=false;}
    catch(error){if(!['not_loaded','connection_lost','disconnected','cannot_connect'].includes(error.code))throw error;if(epoch!==this.epoch)return;this.backendOutage=true;result=advise(rows,p,now,deadline);}
   }else result=advise(rows,p,now,deadline);
   if(epoch!==this.epoch)return;
   if(result.price_intervals)this.rows=canonicalPrices(result.price_intervals);
   this.result=result;
  }catch(err){if(epoch!==this.epoch)return;this.error=true;this.message=err.message||String(err);this.rows=[];}
  finally{if(epoch===this.epoch){this.loading=false;this.render();}}
 }
 async act(operation,id){
  if(this.pending||!this.online)return;
  if(operation==='save'&&(this.syncDay()||!this.result||this.loading)){this.recompute();return;}
  const previousFocus=this.shadowRoot.activeElement?.id;let changed;
  this.pending=true;this.message='';this.error=false;this.render();
  try{
   changed=await this.command(operation,operation==='save'?this.payload():{id});
   const fresh=await this.command('status');this.lastKnown=clone(fresh.appliances);
   this._hass={...this._hass,states:{...this._hass.states,[this.config.integration.entity]:{...this.integrationState,attributes:fresh}}};
   this.message=operation==='save'?'Ingepland. Je zet het apparaat zelf aan.':operation==='start'?'Als gestart geregistreerd; niets aangezet.':'Opgeslagen';
  }catch(err){this.error=true;this.message=err.message||String(err);}
  finally{
   this.pending=false;this.render();
   const action=[...this.shadowRoot.querySelectorAll('[data-op]')].find(el=>el.dataset.id===(changed?.id||id)&&el.dataset.op!=='cancel');
   (action||this.shadowRoot.getElementById(previousFocus)||this.shadowRoot.getElementById('program'))?.focus();
  }
 }
 graph(){
  if(!this.rows?.length||!this.result)return '';
  const rows=this.rows,from=+new Date(rows[0].start),to=+new Date(rows.at(-1).end),min=Math.min(...rows.map(r=>r.price)),max=Math.max(...rows.map(r=>r.price)),range=max-min||.1;
  const x=t=>20+(+new Date(t)-from)/(to-from)*460,y=p=>100-(p-min)/range*80;
  const paths=rows.map((r,i)=>`${i&&rows[i-1].end===r.start?'L':'M'}${x(r.start)},${y(r.price)}H${x(r.end)}`).join(' ');
  const axis=s=>new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));
  return `<div class="tariff-detail"><p class="muted">Tarieven en geadviseerde draaibeurt</p><div class="graph-labels muted"><span>${this.format(max*100,1)} ct/kWh</span><span>${this.format(min*100,1)} ct/kWh</span></div><svg class="graph" viewBox="0 0 500 120" preserveAspectRatio="none" role="img" aria-label="Tarieven en geadviseerde draaibeurt"><rect class="highlight" x="${x(this.result.start)}" y="10" width="${x(this.result.end)-x(this.result.start)}" height="100"/><path class="tariff" d="${paths}"/></svg><div class="graph-labels muted"><span>${axis(rows[0].start)}</span><span>${axis(rows.at(-1).end)}</span></div></div>`;
 }
 render(){
  if(!this.config||!this._hass)return;
  // Read synchronously: native toggle events may still be queued during an update.
  const disclosure=this.shadowRoot.querySelector('#advice-details');if(disclosure)this.detailsOpen=disclosure.open;
  const [a,p]=this.selected();if(this.syncDay()){this.recompute();return;}
  const main=`<div class="selection"><label><span>Apparaat</span><select id="appliance" title="${esc(a?.name)}" aria-label="${this.en?'Appliance':'Apparaat'}: ${esc(a?.name)}">${this.appliances.map(item=>`<option data-user value="${esc(item.id)}" ${item.id===this.form.aid?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label><label><span>Programma</span><select id="program" title="${esc(p?.name)}" aria-label="${this.en?'Program':'Programma'}: ${esc(p?.name)}">${(a?.programs||[]).map(item=>`<option data-user value="${esc(item.id)}" ${item.id===this.form.pid?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label></div><fieldset class="deadline"><legend>Klaar vóór einde van</legend><div class="quick">${['Vandaag','Morgen'].map((l,i)=>`<button id="day-${i}" class="text" data-day="${this.today(i)}" aria-pressed="${this.form.day===this.today(i)}">${l}</button>`).join('')}</div></fieldset>`;
  const r=this.result;let advice='';
  if(r){const level=classifyPriceLevel(r.average,this.config.cheap_price,.25,this.config.expensive_price),label={cheap:'Goedkoop',normal:'Normaal',expensive:'Duur',negative:'Negatief'}[level];
   advice=`<section class="advice" aria-label="Startadvies"><div class="reading-well"><div class="run-times">${[['Start om',r.start],['Klaar om',r.end]].map(([title,stamp])=>`<div><span class="muted">${title}</span><strong>${this.time(stamp)}</strong><span class="muted" title="${esc(this.day(stamp))}">${this.shortDay(stamp)}</span></div>`).join('')}</div><div class="cost-line"><span><span class="muted">Geschatte kosten</span> <strong>${this.price(r.cost)}</strong></span><span class="price-level ${level}">${label}</span></div></div>${this.linked&&!this.online?'<p class="status warning">Lineaire schatting — integratie niet beschikbaar. Planning en meting zijn uitgeschakeld.</p>':''}${r.provisional?'<p class="status warning">Voorlopig — niet alle prijzen tot de eindtijd zijn bekend. Alleen volledig geprijsde draaibeurt; geen gegarandeerd goedkoopste moment over de hele periode.</p>':''}<details id="advice-details" ${this.detailsOpen?'open':''}><summary id="advice-summary">Details</summary><div class="detail-body"><div class="detail-row"><span>Gemiddeld</span><strong>${this.format(r.average*100,1)} ct/kWh</strong></div><p class="status">${r.savings===null?'Vergelijking niet beschikbaar':`<span>Besparing t.o.v. direct starten</span>: <strong>${this.price(r.savings)}</strong>`}</p><p class="status muted">${r.profile_mode==='measured'&&this.online?'Gemeten profiel':r.profile_mode==='simulated'&&this.online?'Gesimuleerd profiel':'Gelijkmatig verbruik'}</p>${this.graph()}</div></details>${this.online?`<button id="save-plan" class="primary" ${this.pending||(this.integrationData.plans||[]).some(plan=>active(plan)&&plan.appliance_id===this.form.aid)?'disabled':''}>Inplannen</button>`:''}</section>`;
  }
  const plans=this.online?(this.integrationData.plans||[]).filter(active):[];
  const content=`<style>${plannerCSS}</style><ha-card><header><h2 data-user>${esc(this.config.title||(this.en?'Appliance planner':'Apparatenplanner'))}</h2></header>${p?main:'<p class="empty">Geen programma’s. Open Instellingen in de dashboard-editor.</p>'}<div id="advice-slot" aria-live="polite">${advice}<p class="status ${this.error?'error':''}">${esc(this.loading?'Berekenen…':this.message)}</p></div>${plans.length?`<section><h3>Ingepland</h3>${plans.map(plan=>`<article class="plan"><strong data-user>${esc(this.appliances.find(a=>a.id===plan.appliance_id)?.name)} · ${esc(this.appliances.find(a=>a.id===plan.appliance_id)?.programs.find(p=>p.id===plan.program_id)?.name)}</strong><div class="date">${this.time(plan.start)} · ${this.day(plan.start)}</div><div class="muted"><span>${({planned:'Ingepland',reminded:'Starttijd bereikt',running:'Bezig'})[plan.status]}</span> · ${this.price(plan.cost)}</div><div class="actions"><button id="plan-${esc(plan.id)}-${plan.status==='running'?'done':'start'}" data-op="${plan.status==='running'?'done':'start'}" data-id="${esc(plan.id)}" ${this.pending?'disabled':''}>${plan.status==='running'?'Klaar':'Gestart'}</button><button id="plan-${esc(plan.id)}-cancel" data-op="cancel" data-id="${esc(plan.id)}" ${this.pending?'disabled':''}>Annuleren</button></div></article>`).join('')}</section>`:''}<p class="muted">Alleen advies. Je zet het apparaat zelf aan.</p></ha-card>`;
   const focus=this.shadowRoot.activeElement?.id;

  this.shadowRoot.innerHTML=content;
  const appliance=this.shadowRoot.querySelector('#appliance'),program=this.shadowRoot.querySelector('#program');
  if(appliance)appliance.onchange=()=>{this.form.aid=appliance.value;this.form.pid=null;this.recompute();};
  if(program)program.onchange=()=>{this.form.pid=program.value;this.recompute();};
  this.shadowRoot.querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>{this.form.day=el.dataset.day;this.recompute();});

  this.bindResult();this.shadowRoot.querySelectorAll('[data-op]').forEach(el=>el.onclick=()=>this.act(el.dataset.op,el.dataset.id));
  localize(this.shadowRoot,this.en);if(focus)this.shadowRoot.getElementById(focus)?.focus();
 }

 bindResult(){const save=this.shadowRoot.querySelector('#save-plan');if(save)save.onclick=()=>this.act('save');const details=this.shadowRoot.querySelector('#advice-details');if(details)details.addEventListener('toggle',()=>{if(details.isConnected)this.detailsOpen=details.open;});}
}

// Native Lovelace editor: only config-changed; the native dashboard Save owns persistence.



const uid=()=>globalThis.crypto?.randomUUID?.()||`p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
class ElevenAppliancePlannerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.entries=[];this.message='';}
 setConfig(c){const next=validateConfig(c),same=JSON.stringify(next)===JSON.stringify(this.config);this.config=next;if(!same||!this.shadowRoot.firstChild)this.render();}
 set hass(h){const adminChanged=this.lastAdmin!==h.user?.is_admin;this.lastAdmin=h.user?.is_admin;this._hass=h;if(adminChanged||!this.shadowRoot.activeElement?.matches('input,select'))this.render();if(h.user?.is_admin&&!this.entriesAsked){this.entriesAsked=true;h.callWS({type:'config_entries/get'}).then(entries=>{this.entries=entries;if(!this.shadowRoot.activeElement?.matches('input,select'))this.render();}).catch(error=>{this.message=(this.en?'Cannot load integration configurations: ':'Integratieconfiguraties ophalen mislukt: ')+(error.message||String(error));if(!this.shadowRoot.activeElement?.matches('input,select'))this.render();});}}
 get hass(){return this._hass;}get en(){return this._hass?.locale?.language?.startsWith('en');}get linked(){return this.config.integration?.enabled===true;}
 get data(){const s=this._hass?.states?.[this.config?.integration?.entity];return s&&!['unknown','unavailable'].includes(s.state)?s.attributes:null;}
 get appliances(){return this.linked?this.data?.appliances||this.config.integration.programs_snapshot||[]:this.config.appliances;}
 emit(){if(!this._hass?.user?.is_admin)throw Error('Alleen beheerders');this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:clone(this.config)},bubbles:true,composed:true}));}
 // Backend v2 previews/plans resolve stored IDs, not dashboard overrides. Never
 // mutate its records from a draft; linked settings remain explicitly read-only.
 async run(fn){if(this.pending)return;this.pending=true;this.message='';try{await fn();}catch(e){this.message=e.message||String(e);}finally{this.pending=false;this.render();}}
 async link(){
  const entity=this.shadowRoot.querySelector('#integration-entity').value;
  if(!entity)throw Error('Kies de planner-integratie');
  const state=this._hass.states?.[entity];
  if(!state||['unknown','unavailable'].includes(state.state)||!(state.attributes?.protocol_version>=2))throw Error('Werk de optionele integratie bij voor expliciete profielen en prijsbronnen');
  this.config.integration={enabled:true,entity,programs_snapshot:clone(state.attributes.appliances||[])};this.emit();
 }
 unlink(){
  const copy=this.shadowRoot.querySelector('#copy-unlink').checked;

  if(copy)this.config.appliances=this.appliances.map(a=>({id:a.id,name:a.name,kind:a.kind,programs:a.programs.map(p=>({id:p.id,name:p.name,minutes:p.minutes,kwh:p.kwh}))}));
  this.config.integration={...this.config.integration,enabled:false};this.emit();this.render();
 }
 render(){
  if(!this.config||!this._hass)return;
  if(!this._hass.user?.is_admin){this.shadowRoot.innerHTML='<p>Instellingen niet beschikbaar voor deze gebruiker.</p>';return;}
  const disclosures=new Map([...this.shadowRoot.querySelectorAll('details[id]')].map(el=>[el.id,el.open]));
  const drafts={};this.shadowRoot.querySelectorAll('[data-draft]').forEach(el=>{if(!el.closest('.appliance-edit,.program-edit'))drafts[el.dataset.draft]=el.type==='checkbox'?el.checked:el.value;});const focus=this.shadowRoot.activeElement?.id;
  const option=(value,label,selected)=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`;
  const states=Object.values(this._hass.states||{}),tariff=this.config.tariff;
  const priceSensors=states.filter(s=>s.entity_id?.startsWith('sensor.'));
  const plannerSensors=states.filter(s=>s.entity_id?.startsWith('sensor.eleven_appliance_planner')||(s.attributes?.protocol_version>=2&&Array.isArray(s.attributes.appliances)));
  const meters=states.filter(s=>s.attributes?.device_class==='power'&&['W','kW'].includes(s.attributes.unit_of_measurement)&&s.attributes.calculation_mode!=='fixed');
  let html=`<style>${plannerCSS}</style><div class="fields"><label>Naam<input id="title" data-config="title" value="${esc(this.config.title||'')}" maxlength="80"></label><label>Prijsbron<select id="source" data-tariff="source">${SOURCES.map(s=>option(s,s,tariff.source||'sensor')).join('')}</select></label>`;
  if(['sensor','zonneplan'].includes(tariff.source||'sensor'))html+=`<label>Prijssensor<select id="price-entity" data-tariff="entity">${option('','—',tariff.entity)}${priceSensors.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,tariff.entity)).join('')}</select></label>`;
  if(['energyzero','tibber_prices'].includes(tariff.source)){
   const domain=tariff.source,key=domain==='energyzero'?'energyzero_entry':'tibber_entry';
   html+=`<label>${esc(domain)}<select id="provider-entry" data-tariff="${key}">${option('','—',tariff[key])}${this.entries.filter(e=>e.domain===domain).map(e=>option(e.entry_id,e.title,tariff[key])).join('')}</select></label>`;
  }
  if(tariff.source==='tibber')html+=`<label>Tibber-woning<input id="tibber-home" data-tariff="tibber_home" value="${esc(tariff.tibber_home||'')}"></label><small>Exacte woningnaam; leeg kiest de enige woning. Alleen een EUR-woning gebruiken.</small>`;
  html+=`<div class="program-fields thresholds"><label>Goedkoop tot (ct/kWh)<input id="cheap" type="number" step="any" data-threshold="cheap_price" value="${this.config.cheap_price*100}"></label><label>Duur boven (ct/kWh)<input id="expensive" type="number" step="any" data-threshold="expensive_price" value="${this.config.expensive_price*100}"></label></div></div><details id="programs-section" open><summary>Apparaten en programma’s</summary>${this.linked?'<p class="owned">Integratie beheert deze programma’s. Metingen blijven behouden bij wijzigingen.</p>':''}`;
  html+=this.appliances.map(a=>`<div class="editor-group"><form class="appliance-edit fields" data-aid="${esc(a.id)}"><label>Apparaat<input name="name" data-draft="${esc(a.id)}-name" required maxlength="80" value="${esc(a.name)}"></label>${this.linked?`<label>Vermogensmeter<select name="power_sensor" data-draft="${esc(a.id)}-meter">${option('','Geen meter',a.power_sensor||'')}${meters.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,a.power_sensor)).join('')}</select></label>`:''}</form>${a.programs.map(p=>`<form class="program-edit fields editor-group" data-aid="${esc(a.id)}" data-pid="${esc(p.id)}"><div class="program-fields"><label>Programma<input name="name" data-draft="${esc(a.id+p.id)}-name" required maxlength="80" value="${esc(p.name)}"></label><label>Duur (minuten)<input name="minutes" data-draft="${esc(a.id+p.id)}-minutes" type="number" min="1" max="1440" step="any" required value="${p.minutes}"></label><label>Totaal kWh<input name="kwh" data-draft="${esc(a.id+p.id)}-kwh" type="number" min="0.001" max="30" step="any" required value="${p.kwh}"></label></div>${this.linked?`<label>Profielmodus<select name="profile_mode" data-draft="${esc(a.id+p.id)}-mode">${option('uniform','Gelijkmatig verbruik',p.profile_mode)}${option('simulated','Gesimuleerd profiel',p.profile_mode)}${p.has_measured_profile?option('measured','Gemeten profiel',p.profile_mode):''}</select></label>`:''}</form>`).join('')}<form class="program-add fields editor-group" data-aid="${esc(a.id)}"><div class="program-fields"><label>Nieuw programma<input name="name" data-draft="${esc(a.id)}-new-name" required maxlength="80"></label><label>Duur (minuten)<input name="minutes" data-draft="${esc(a.id)}-new-minutes" type="number" min="1" max="1440" step="any" required></label><label>Totaal kWh<input name="kwh" data-draft="${esc(a.id)}-new-kwh" type="number" min=".001" max="30" step="any" required></label></div><button type="submit">Nieuw programma</button></form></div>`).join('');
  html+=`<form id="add-appliance" class="fields editor-group"><label>Apparaat<input name="name" data-draft="new-appliance" required maxlength="80"></label><label>Type<select name="kind" data-draft="new-appliance-kind">${Object.entries(kinds).map(([k,l])=>option(k,l,'washer')).join('')}</select></label><button type="submit">Apparaat toevoegen</button></form></details><details id="integration-section"><summary>Integratie (optioneel)</summary><p class="muted">Expliciete koppeling; installatie alleen schakelt niets in.</p>`;
  if(this.linked){
   html+=`<label class="check"><input id="copy-unlink" data-draft="copy-unlink" type="checkbox">Ook integratieprogramma’s als eenvoudige instellingen kopiëren</label><button id="unlink">Integratie ontkoppelen</button>`;
   if(this.data)html+=`<label>Meldingsactie<input id="notification-action" disabled value="${esc(this.data.settings?.notification_action||'persistent_notification.create')}"></label>`;
  }else{
   html+=`<label>Integratie<select id="integration-entity" data-draft="integration-entity">${option('','—','')}${plannerSensors.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,'')).join('')}</select></label><button id="link">Integratie koppelen</button>`;
  }
  const help=this.en?'Changes are drafts. Use Home Assistant Save to persist them, or Cancel to discard them. Linking does not transfer or change backend records.':'Wijzigingen zijn concepten. Gebruik Opslaan van Home Assistant om ze te bewaren, of Annuleren om ze te verwerpen. Koppelen draagt geen backendgegevens over en wijzigt ze niet.';
  html+=`</details><p class="status error" role="status">${esc(this.message)}</p><p class="muted">${esc(help)}</p>`;
  this.shadowRoot.innerHTML=html;
  this.shadowRoot.querySelectorAll('details[id]').forEach(el=>{if(disclosures.has(el.id))el.open=disclosures.get(el.id);});
  this.shadowRoot.querySelectorAll('[data-draft]').forEach(el=>{if(el.dataset.draft in drafts){if(el.type==='checkbox')el.checked=drafts[el.dataset.draft];else el.value=drafts[el.dataset.draft];}});
  const status=()=>{this.shadowRoot.querySelector('[role=status]').textContent=this.message;};
  this.shadowRoot.querySelectorAll('[data-config],[data-tariff],[data-threshold]').forEach(el=>{
   const update=()=>{if(!el.checkValidity()||el.type==='number'&&el.value==='')return;const next=clone(this.config);try{if(el.dataset.config)next[el.dataset.config]=el.value;if(el.dataset.tariff)next.tariff[el.dataset.tariff]=el.value;if(el.dataset.threshold)next[el.dataset.threshold]=Number(el.value)/100;this.config=validateConfig(next);this.emit();this.message='';}catch(e){this.message=e.message;}status();if(el.id==='source')this.render();};
   if(el.tagName==='SELECT')el.onchange=update;else el.oninput=update;
  });
  this.shadowRoot.querySelectorAll('form').forEach(form=>{
   const edit=form.matches('.appliance-edit,.program-edit');
   const update=()=>{
    if(this.linked||!this._hass?.user?.is_admin||!form.checkValidity())return;
    const values=Object.fromEntries(new FormData(form)),aid=form.dataset.aid,pid=form.dataset.pid,next=clone(this.config);
    try{
     if(form.id==='add-appliance')next.appliances.push({id:uid(),name:values.name,kind:values.kind,programs:[]});
     else{const a=next.appliances.find(a=>a.id===aid);if(form.classList.contains('appliance-edit'))a.name=values.name;else{const p=pid?a.programs.find(p=>p.id===pid):{id:uid()};Object.assign(p,{name:values.name,minutes:Number(values.minutes),kwh:Number(values.kwh)});if(!pid)a.programs.push(p);}}
     this.config=validateConfig(next);this.message='';this.emit();
     if(!edit){form.querySelectorAll('[data-draft]').forEach(el=>el.removeAttribute('data-draft'));this.render();}else status();
    }catch(e){this.message=e.message||String(e);status();}
   };
   form.onsubmit=e=>{e.preventDefault();if(!edit)update();};
   if(edit){if(this.linked)form.querySelectorAll('input,select').forEach(el=>el.disabled=true);else form.oninput=update;}
   else if(this.linked)form.remove();
  });
  const owned=this.shadowRoot.querySelector('.owned');if(owned)owned.textContent=this.en?'Integration settings are read-only: the backend cannot apply dashboard drafts on native Save. Unlink to edit simple card settings; backend programs, measurements and plans stay unchanged.':'Integratie-instellingen zijn alleen-lezen: de backend kan dashboardconcepten niet bij native Opslaan toepassen. Ontkoppel om eenvoudige kaartinstellingen te bewerken; backendprogramma’s, metingen en plannen blijven ongewijzigd.';
  const link=this.shadowRoot.querySelector('#link');if(link)link.onclick=()=>this.run(()=>this.link());
  const unlink=this.shadowRoot.querySelector('#unlink');if(unlink)unlink.onclick=()=>this.unlink();

  this.shadowRoot.querySelectorAll('button').forEach(el=>el.disabled=this.pending);
  localize(this.shadowRoot,this._hass.locale?.language?.startsWith('en'));if(focus)this.shadowRoot.getElementById(focus)?.focus();
 }
}

if(!customElements.get('eleven-appliance-planner'))customElements.define('eleven-appliance-planner',withCardBackground(ElevenAppliancePlanner));
if(!customElements.get('eleven-appliance-planner-editor'))customElements.define('eleven-appliance-planner-editor',ElevenAppliancePlannerEditor);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-appliance-planner'))window.customCards.push({type:'eleven-appliance-planner',name:'Eleven Appliance Planner',description:'Standalone appliance start advice with optional integration',preview:true});
})();
