// Eleven House — self-contained standalone module
(()=>{
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
function uiPrimaryValue({value,unit='',subtitle='',subtitleEntity='',compact=false,entity='',attrs={}}={}){
 const missing=value==null||value==='';
 const number=uiEscape(missing?'—':value);
 const label=subtitle!==''&&subtitle!=null?(subtitleEntity?`<button type="button" class="primary-label" data-entity="${uiEscape(subtitleEntity)}">${uiEscape(subtitle)}</button>`:`<div class="primary-label">${uiEscape(subtitle)}</div>`):'';
 return `<div${uiAttributes({...attrs,'data-ui-primary-value':'','data-density':compact?'compact':'standard','data-unavailable':String(missing)})}><div class="primary-value">${entity?`<button type="button" class="primary-number" data-entity="${uiEscape(entity)}" aria-label="${uiEscape((missing?'—':value)+(!missing&&unit?' '+unit:''))}">${number}</button>`:`<span class="primary-number">${number}</span>`}${!missing&&unit?`<small>${uiEscape(unit)}</small>`:''}</div>${label}</div>`;
}

function uiPrimaryValueStyles(){return `
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
[data-ui-metric][data-density=compact] .ui-metric-info{margin-top:4px;padding-top:4px}
[data-ui-metric][data-unavailable=true]{--_metric-tone:var(--secondary-text-color,#626a78)}
button[data-ui-metric]{width:100%;border:0;cursor:pointer}button[data-ui-metric]:hover{filter:brightness(1.04)}button[data-ui-metric]:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:3px}
[data-ui-metric-grid]{--_metric-rows:2;display:grid;grid-template-columns:repeat(var(--ui-metric-columns,2),minmax(0,1fr));column-gap:12px;row-gap:2px;align-items:stretch}
[data-ui-metric-grid]:has(.ui-metric-info){--_metric-rows:3}
@supports(grid-template-rows:subgrid){[data-ui-metric-grid]>[data-ui-metric]{grid-row:span var(--_metric-rows);grid-template-rows:subgrid}}
`;}

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

/* No gamma-space blending. Scene-linear float32 RGB -> one display transform. */
const HousePixels={
 // sun.sun is a read-only render selector; never infer illumination from the HA theme.
 solarPhase(hass){
  const sun=hass?.states?.['sun.sun'],a=sun?.attributes,e=a?.elevation;
  if(!sun||['unknown','unavailable'].includes(sun.state)||typeof e!=='number'||!Number.isFinite(e))return null;
  if(e < -6)return 'night';
  if(e >= 20)return 'afternoon';
  const rising=typeof a.rising==='boolean'?a.rising:typeof a.azimuth==='number'&&Number.isFinite(a.azimuth)?((a.azimuth%360+360)%360)<180:null;
  return rising===null?'afternoon':rising?'morning':'evening';
 },
 resolveMode(requested,arrays,hass){
  const solar=['morning','afternoon','evening','night'].every(m=>Object.hasOwn(arrays,m));
  let mode=requested||'auto';
  if(mode==='auto'){
   const phase=this.solarPhase(hass);
   mode=solar?(phase||'afternoon'):phase?(phase==='night'?'dark':'light'):(hass?.themes?.darkMode?'dark':'light');
  }
  if(solar)mode=({light:'afternoon',dark:'night'})[mode]||mode;
  else mode=({morning:'light',afternoon:'light',evening:'light',night:'dark'})[mode]||mode;
  return mode;
 },
 state(value){return {known:value==='on'||value==='off',on:value==='on'};},
 lightLevel(entity){
  const s=this.state(entity?.state),b=entity?.attributes?.brightness;
  return {...s,level:s.on?(typeof b==='number'&&Number.isFinite(b)?Math.min(1,Math.max(0,b/255)):1):0};
 },
 compose(base,layers,on,alpha=null){
  if(alpha&&(alpha.length!==base.length/3||!alpha.every(a=>Number.isFinite(a)&&a>=0&&a<=1)))throw Error('Invalid alpha coverage');
  const out=new Uint8ClampedArray(base.length/3*4);
  const weights=layers.map((_,i)=>on[i]===true?1:typeof on[i]==='number'&&Number.isFinite(on[i])?Math.min(1,Math.max(0,on[i])):0);
  for(let p=0,q=0;p<base.length;p+=3,q+=4){
   for(let c=0;c<3;c++){
    let x=base[p+c];
    for(let i=0;i<layers.length;i++)if(weights[i])x+=layers[i][p+c]*weights[i];
    if(alpha)x=alpha[q/4]>0?x/alpha[q/4]:0;
    x=Math.max(0,x);x=x/(1+x);x=x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
    out[q+c]=Math.floor(Math.min(1,Math.max(0,x))*255+.5);
   }
   out[q+3]=alpha?Math.floor(alpha[q/4]*255+.5):255;
  }
  return out;
 },
 async json(url,cache='no-store'){
  const r=await fetch(url,{cache});if(!r.ok)throw Error('HTTP '+r.status);return r.json();
 },
 // Web Crypto needs a secure context; LAN HTTP still verifies every supplied checksum.
 async sha256(data){
  if(globalThis.crypto?.subtle)return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
  const bytes=ArrayBuffer.isView(data)?new Uint8Array(data.buffer,data.byteOffset,data.byteLength):new Uint8Array(data);
  const padded=new Uint8Array(Math.ceil((bytes.length+9)/64)*64);padded.set(bytes);padded[bytes.length]=0x80;
  const input=new DataView(padded.buffer),bits=bytes.length*8;
  input.setUint32(padded.length-8,Math.floor(bits/0x100000000));input.setUint32(padded.length-4,bits>>>0);
  const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
   0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
   0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
   0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
   0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
   0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
   0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
   0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64);
  const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let offset=0;offset<padded.length;offset+=64){
   for(let i=0;i<16;i++)w[i]=input.getUint32(offset+i*4);
   for(let i=16;i<64;i++){
    const x=w[i-15],y=w[i-2],s0=rotate(x,7)^rotate(x,18)^(x>>>3),s1=rotate(y,17)^rotate(y,19)^(y>>>10);
    w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
   }
   let [a,b,c,d,e,f,g,z]=h;
   for(let i=0;i<64;i++){
    const t1=(z+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0;
    const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
    z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
   }
   const block=[a,b,c,d,e,f,g,z];for(let i=0;i<8;i++)h[i]=(h[i]+block[i])>>>0;
  }
  return Array.from(h,n=>n.toString(16).padStart(8,'0')).join('');
 },
 // Bounded shared cache: deduplicate downloads, hashing and float validation across cards.
 assetCache:new Map(),assetBytes:0,assetBudget:96*1024*1024,
 async asset(url,kind,manifest,file=String(url)){
  const metadata=manifest.files?.[file],gzip=typeof globalThis.DecompressionStream==='function'?metadata?.gzip:null;
  const key=String(url)+'|'+(metadata?.sha256||'')+'|'+JSON.stringify(gzip?[gzip.file,gzip.sha256,gzip.bytes]:null)+'|'+kind+'|'+manifest.width+'x'+manifest.height;
  let entry=this.assetCache.get(key);
  if(entry){this.assetCache.delete(key);this.assetCache.set(key,entry);return entry.promise;}
  entry={bytes:0};
  entry.promise=(async()=>{
   const response=await fetch(gzip?new URL(gzip.file,url):url);if(!response.ok)throw Error('Onvolledige beeldset: '+file);
   let data=await response.arrayBuffer();const channels=kind==='alpha'?1:3;
   if(gzip){
    if(gzip.bytes!==undefined&&data.byteLength!==gzip.bytes)throw Error('Gzip-afmetingen ongelijk');
    const digest=await this.sha256(data);
    if(digest!==gzip.sha256)throw Error('Gzip-checksum wijkt af');
    data=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   }
   if(data.byteLength!==manifest.width*manifest.height*channels*4)throw Error('Laagafmetingen ongelijk');
   if(metadata){
    const digest=await this.sha256(data);
    if(digest!==metadata.sha256)throw Error('Checksum wijkt af');
   }
   const a=new Float32Array(data);if(!a.every(v=>Number.isFinite(v)&&(kind!=='alpha'||v>=0&&v<=1)))throw Error('Ongeldige pixels');
   entry.bytes=data.byteLength;this.assetBytes+=entry.bytes;
   for(const [k,e] of this.assetCache){if(this.assetBytes<=this.assetBudget)break;if(e.bytes){this.assetCache.delete(k);this.assetBytes-=e.bytes;}}
   return a;
  })().catch(e=>{if(this.assetCache.get(key)===entry)this.assetCache.delete(key);throw e;});
  this.assetCache.set(key,entry);return entry.promise;
 },
 async ensureMode(loaded,mode){
  if(loaded.arrays[mode])return loaded.arrays[mode];
  if(!loaded.view.modes[mode])throw Error('Ongeldige modus');
  loaded.modeRequests??={};if(loaded.modeRequests[mode])return loaded.modeRequests[mode];
  const spec=loaded.view.modes[mode];
  const request=Promise.all([spec.base,...spec.layers].map(file=>this.asset(new URL(file,loaded.url),'rgb',loaded.manifest,file)))
   .then(values=>{const value={base:values[0],layers:values.slice(1)};for(const [name,s] of Object.entries(loaded.view.modes))if(s.base===spec.base&&JSON.stringify(s.layers)===JSON.stringify(spec.layers))loaded.arrays[name]=value;return value;})
   .finally(()=>{delete loaded.modeRequests[mode];});
  loaded.modeRequests[mode]=request;return request;
 },
 async load(url,viewId,options=null){
  const origin=new URL(url,document.baseURI);let manifest=await this.json(origin);
  const manifestURL=manifest.manifest?new URL(manifest.manifest,origin):origin;
  if(manifest.manifest)manifest=await this.json(manifestURL,'default');
  if(manifest.schema!==1||manifest.dtype!=='float32-le'||manifest.channels!==3)throw Error('Onbekend beeldformaat');
  const view=manifest.views.find(v=>v.id===viewId);if(!view)throw Error('Aanzicht ontbreekt');
  const arrays=Object.fromEntries(Object.keys(view.modes).map(mode=>[mode,null]));
  const loaded={manifest,view,arrays,alpha:null,url:manifestURL};
  const modes=options?[this.resolveMode(options.mode,arrays,options.hass)]:Object.keys(view.modes);
  await Promise.all([
   ...modes.map(mode=>this.ensureMode(loaded,mode)),
   view.alpha?this.asset(new URL(view.alpha,manifestURL),'alpha',manifest,view.alpha).then(a=>{loaded.alpha=a;}):Promise.resolve()
  ]);
  return loaded;
 }
};

/* Weather is decorative and read-only. See README for mapping/product thresholds. */
const houseWeatherSchema=[{name:'weather_overlay',selector:{boolean:{}}},{name:'animate_weather',selector:{boolean:{}}},{name:'weather_intensity',selector:{number:{min:0,max:100,step:5,mode:'slider'}}},{name:'wind_threshold',selector:{number:{min:1,max:100,step:1,unit_of_measurement:'m/s'}}}];
const weatherConditions=new Set(['clear-night','cloudy','exceptional','fog','hail','lightning','lightning-rainy','partlycloudy','pouring','rainy','snowy','snowy-rainy','sunny','windy','windy-variant']);
function windMetersPerSecond(value,unit){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0)return null;
 // Same Beaufort conversion as HA SpeedConverter._beaufort_to_ms.
 if(unit==='Beaufort')return .836*value**1.5;
 const factors={'m/s':1,'km/h':1/3.6,mph:.44704,kn:.5144444444444445,'ft/s':.3048,'in/s':.0254,'m/min':1/60};
 return Object.hasOwn(factors,unit)?value*factors[unit]:null;
}
function houseWeatherState(config={},entity){
 const none={mode:'none',amount:0,wind:0};
 if(config.weather_overlay===false||!entity||!weatherConditions.has(entity.state))return none;
 const a=entity.attributes||{},speed=windMetersPerSecond(a.wind_speed,a.wind_speed_unit);
 const threshold=typeof config.wind_threshold==='number'&&Number.isFinite(config.wind_threshold)?Math.max(1,Math.min(100,config.wind_threshold)):10.8;
 const windy=['windy','windy-variant','lightning','lightning-rainy'].includes(entity.state)||(speed!==null&&speed>=threshold);
 const rain=['rainy','pouring','lightning-rainy'].includes(entity.state),snow=['snowy','snowy-rainy'].includes(entity.state);
 const mode=snow?'snow':rain?(windy?'storm':'rain'):windy?'wind':'none';
 const amount=typeof config.weather_intensity==='number'&&Number.isFinite(config.weather_intensity)?Math.max(0,Math.min(1,config.weather_intensity/100)):.65;
 return {mode,amount:mode==='none'?0:amount,wind:speed===null?.65:Math.min(1,speed/25)};
}
const houseWeatherRandom=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const houseWindSpeed=amount=>.35+2.4*amount;
function houseSnowPosition(i,t,w,h){
 const r=houseWeatherRandom;
 return {x:((r(i+400)*w+t*(.4+r(i+700)*.8)+Math.sin(t*.35+i)*2.5)%(w+70)+w+70)%(w+70)-35,y:((r(i+200)*h+t*(13+r(i+1)*15))%(h+30))-15};
}
class HouseWeather{
 constructor(host){
  this.host=host;this.clock=0;this.windClock=0;this.last=null;this.frame=0;this.visible=true;this.state={mode:'none',amount:0,wind:0};
  const root=host.shadowRoot,style=document.createElement('style');
  style.textContent=`.house-weather{position:absolute;left:0;top:0;pointer-events:none;z-index:1;overflow:hidden}.house-weather>canvas{position:static!important;display:block!important;width:100%!important;height:100%!important;margin:0!important;aspect-ratio:auto!important;transform:none!important;background:none!important}.stage-caption{position:relative;z-index:2}`;
  root.append(style);this.layer=document.createElement('div');this.layer.className='house-weather';this.layer.setAttribute('aria-hidden','true');this.canvas=document.createElement('canvas');this.layer.append(this.canvas);root.querySelector('.stage').append(this.layer);this.ctx=this.canvas.getContext('2d');
  this.resume=()=>{this.last=null;cancelAnimationFrame(this.frame);this.frame=0;this.paint();if(this.active())this.frame=requestAnimationFrame(now=>this.tick(now));};
 }
 connect(){
  this.disconnect();this.connected=true;this.visible=true;
  this.media=matchMedia('(prefers-reduced-motion: reduce)');this.media.addEventListener('change',this.resume);document.addEventListener('visibilitychange',this.resume);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.host.shadowRoot.querySelector('.stage'));this.resizeObserver.observe(this.host.shadowRoot.querySelector('.stage-caption'));
  this.intersection=new IntersectionObserver(entries=>{this.visible=entries.some(e=>e.isIntersecting);this.resume();});this.intersection.observe(this.host);
  // Window resize also covers moving between monitors with different DPR.
  this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);this.resize();this.update();
 }
 disconnect(){
  this.connected=false;cancelAnimationFrame(this.frame);this.frame=0;this.last=null;this.resizeObserver?.disconnect();this.intersection?.disconnect();this.media?.removeEventListener('change',this.resume);document.removeEventListener('visibilitychange',this.resume);if(this.onResize)window.removeEventListener('resize',this.onResize);
 }
 active(){return this.connected&&this.host.isConnected&&this.visible&&!document.hidden&&!this.media?.matches&&this.host.config?.animate_weather!==false&&this.host._hass?.connected!==false&&this.state.mode!=='none'&&this.state.amount>0&&this.w>0&&this.h>0;}
 update(){
  this.state=houseWeatherState(this.host.config,this.host._hass?.states?.[this.host.config?.weather_entity]);
  // HA updates unrelated entities frequently: never restart an active clock.
  if(this.active()&&this.frame)this.paint();else this.resume();
 }
 resize(){
  const root=this.host.shadowRoot,s=root.querySelector('.stage').getBoundingClientRect(),cap=root.querySelector('.stage-caption').getBoundingClientRect();
  this.w=Math.max(0,s.width);this.h=Math.max(0,Math.min(s.height,cap.top-s.top));const dpr=Math.min(window.devicePixelRatio||1,2);
  const width=Math.round(this.w*dpr),height=Math.round(this.h*dpr);this.layer.style.width=this.w+'px';this.layer.style.height=this.h+'px';
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.ctx?.setTransform(dpr,0,0,dpr,0,0);}this.resume();
 }
 tick(now){
  this.frame=0;if(!this.active()){this.last=null;return;}
  if(this.last!==null){const dt=Math.max(0,Math.min((now-this.last)/1000,.05));this.clock+=dt;this.windClock+=dt*houseWindSpeed(this.state.wind*this.state.amount);}this.last=now;this.paint();this.frame=requestAnimationFrame(time=>this.tick(time));
 }
 paint(t=this.clock,windT=this.windClock){
  const ctx=this.ctx,w=this.w||0,h=this.h||0;if(!ctx)return;
  // Suspended cards retain pixels until visible again; no painting on HA updates.
  if(this.connected===false||this.host.isConnected===false||this.visible===false||globalThis.document?.hidden)return;
  ctx.clearRect(0,0,w,h);
  const {mode,amount}=this.state;if(mode==='none'||amount<=0||h<=0||w<=0)return;
  const dark=this.host._hass?.themes?.darkMode===true,r=houseWeatherRandom,snow=mode==='snow',storm=mode==='storm';ctx.save();
  const fade=ctx.createLinearGradient(0,0,0,h);fade.addColorStop(0,'rgba(255,255,255,1)');fade.addColorStop(.8,'rgba(255,255,255,1)');fade.addColorStop(1,'rgba(255,255,255,0)');
  const count=Math.round((snow?55:85)*amount*w/440);
  if(mode!=='wind')for(let i=0;i<count;i++){
   const seed=r(i+1),p=snow?houseSnowPosition(i,t,w,h):{x:((r(i+400)*w+t*(storm?100:20))%(w+70)+w+70)%(w+70)-35,y:((r(i+200)*h+t*(175+seed*120))%(h+30))-15};
   ctx.beginPath();if(snow){ctx.fillStyle=dark?`rgba(240,247,255,${.45+seed*.4})`:`rgba(204,222,235,${.65+seed*.3})`;ctx.shadowColor='rgba(255,255,255,.3)';ctx.shadowBlur=2;ctx.arc(p.x,p.y,1+seed*1.8,0,Math.PI*2);ctx.fill();}
   else{ctx.strokeStyle=dark?`rgba(157,197,226,${.17+seed*.27})`:`rgba(67,115,148,${.24+seed*.25})`;ctx.lineWidth=.7+seed*.5;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(storm?8:2),p.y+8+seed*8);ctx.stroke();}
  }
  ctx.shadowBlur=0;
  if(mode==='wind'||storm)for(let i=0;i<6;i++){
   const phase=(windT*(.22+r(i+20)*.12)+i*.21)%1,x=-w*.7+phase*w*2,y=h*(.15+r(i+60)*.7),len=w*(.18+r(i+90)*.2);ctx.globalAlpha=Math.sin(phase*Math.PI);ctx.strokeStyle=dark?'rgba(190,214,225,.42)':'rgba(84,119,137,.4)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+len*.3,y-9,x+len*.6,y+10,x+len,y-3);ctx.stroke();if(i%2===0){ctx.beginPath();ctx.moveTo(x+16,y+7);ctx.quadraticCurveTo(x+len*.65,y+13,x+len*.85,y+6);ctx.stroke();}
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);ctx.restore();
 }
}

/* Eleven house: prerecorded lighting only; no rendering API. */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class ElevenHouseCard extends HTMLElement{
 constructor(){
  super();this.attachShadow({mode:'open'});this.pending=new Set();
  this.shadowRoot.innerHTML=`<style>
:host{display:block;min-width:0;color:var(--primary-text-color,#202124)}
ha-card{display:block;box-sizing:border-box;overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,12px)}
.content{padding:16px;font-family:var(--ha-font-family-body,inherit);line-height:1.4}h2{font-size:18px;font-weight:650;letter-spacing:-.01em;line-height:1.25;margin:0 0 4px}
canvas,.floor-image{display:block;width:100%;height:auto;background:transparent;aspect-ratio:4/3;object-fit:contain}canvas[hidden],.floor-image[hidden]{display:none}
.navigation{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 8px}.navigation label{flex:1 1 125px;min-width:0;font-size:11px;color:var(--secondary-text-color,#616161)}.navigation select{display:block;box-sizing:border-box;width:100%;min-height:44px;margin-top:4px;padding:8px;border:0;border-radius:8px;background:var(--secondary-background-color,#f1f3f4);color:var(--primary-text-color,#202124);font:inherit;font-size:13px}.navigation select:focus-visible{outline:2px solid var(--primary-color,#03a9f4)}
.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.summary:empty{display:none}.summary-tile{min-height:56px}.summary[hidden]{display:none}
.controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:4px}
button{display:flex;align-items:center;gap:10px;min-width:0;min-height:52px;padding:10px 12px;appearance:none;border:0;border-radius:8px;text-align:left;font:inherit;color:inherit;cursor:pointer;background:var(--secondary-background-color,#f1f3f4);transition:background 120ms ease-out}
button[aria-pressed=true]{background:color-mix(in srgb,var(--primary-color,#03a9f4) 14%,var(--secondary-background-color,#f1f3f4))}button[aria-pressed=true] ha-icon{color:var(--primary-color,#0277bd)}button:hover:not(:disabled){background:color-mix(in srgb,var(--primary-color,#03a9f4) 20%,var(--secondary-background-color,#f1f3f4))}button:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}button:disabled{opacity:.5;cursor:default}
ha-icon{--mdc-icon-size:22px;width:22px;height:22px;flex:none;display:inline-flex;color:var(--secondary-text-color,#616161)}.label{min-width:0;font-size:13px;font-weight:550;overflow-wrap:anywhere}small{display:block;font-size:11px;font-weight:400;color:var(--secondary-text-color,#616161);margin-top:1px}
p{font-size:12px;color:var(--secondary-text-color,#616161);margin:10px 0 0;overflow-wrap:anywhere}p:empty{display:none}p[data-error=true]{color:var(--error-color,#b3261e)}
@media(max-width:380px){.content{padding:12px}button{padding:10px;gap:8px}}@media(prefers-reduced-motion:reduce){button{transition:none}}
.lighting-notice{display:none}:host([data-appearance=hero]) .lighting-notice:not(:empty){display:block;font-size:11px;color:var(--secondary-text-color,#616161);margin-bottom:8px}
.hero-meta,.stage-caption,.light-heading{display:none}.light-panel{border:0}:host([data-appearance=hero]) .navigation:empty{display:none}
:host{container-type:inline-size}
/* Standard cards share the image row with their title; controls stay below. */
:host([data-appearance=standard]) .content{display:grid;grid-template-columns:minmax(0,1fr);padding:0}
:host([data-appearance=standard]) .hero-header{grid-area:1/1;align-self:start;z-index:2;pointer-events:none;position:relative;padding:12px 14px;box-sizing:border-box}
:host([data-appearance=standard]) h2{margin:0}
:host([data-appearance=standard]) .stage{grid-area:1/1;min-width:0;position:relative}
:host([data-appearance=standard]) canvas,:host([data-appearance=standard]) .floor-image{width:100%;height:clamp(220px,75cqi,360px);object-fit:contain}
:host([data-appearance=standard]) .navigation:empty{display:none}
:host([data-appearance=standard]) .summary{grid-area:2/1;margin:0;padding:0 12px;gap:6px}
:host([data-appearance=standard]) .summary-tile{min-height:44px;padding:6px 8px}
:host([data-appearance=standard]) .light-panel{grid-area:3/1;margin:0 12px 8px}
:host([data-appearance=standard]) .controls{margin-top:6px;gap:6px}
:host([data-appearance=standard]) p{grid-area:4/1;margin:0 12px 10px}
:host([data-appearance=standard]) p:empty{display:none}

:host([data-appearance=hero]) .content{display:grid;grid-template-columns:minmax(0,1fr);padding:0}
:host([data-appearance=hero]) .hero-header{grid-area:1/1;align-self:start;z-index:2;pointer-events:none;position:relative;padding:14px 16px 8px;min-height:64px;box-sizing:border-box}
:host([data-appearance=hero]) h2{font-size:20px;font-weight:650;letter-spacing:-.01em;line-height:1.25;max-width:calc(100% - 100px);margin:0 0 3px}
:host([data-appearance=hero]) .hero-meta{display:block}.hero-date{font-size:11px;color:var(--secondary-text-color,#616161);text-transform:capitalize}
:host([data-appearance=hero]) .weather{pointer-events:auto;position:absolute;right:12px;top:10px;display:flex;flex-direction:column;gap:0;align-items:flex-end;background:transparent;padding:4px;min-height:44px;font-size:11px;color:var(--secondary-text-color,#616161);max-width:96px}.weather-temp{font-size:17px;color:var(--primary-text-color,#202124);font-weight:550;font-variant-numeric:tabular-nums}
:host([data-appearance=hero]) .stage{grid-area:1/1;min-width:0;position:relative;background:transparent;color:var(--secondary-text-color,#616161)}
:host([data-appearance=hero]) canvas,:host([data-appearance=hero]) .floor-image{position:relative;margin:0 auto -12px;height:clamp(240px,75cqi,360px);width:100%;object-fit:contain}
:host([data-appearance=hero]) .stage-caption{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 12px 6px;font-size:12px;min-height:16px}.view-label{max-width:42%;text-align:right}.light-state{display:flex;align-items:center;gap:6px;font-weight:550}.light-dot{width:6px;height:6px;flex:none;border-radius:50%;background:currentColor;opacity:.5}.light-dot.on{background:var(--primary-color,#03a9f4);opacity:1}
:host([data-appearance=hero]) .summary{order:3;gap:6px;margin:0;padding:4px 12px 0}:host([data-appearance=hero]) .summary-tile .label{line-height:1.25;overflow-wrap:break-word}
:host([data-appearance=hero]) .summary-tile{box-sizing:border-box;border-radius:8px;padding:6px 8px;gap:8px;min-height:44px;background:var(--secondary-background-color,#f1f3f4)}
:host([data-appearance=hero]) .summary-tile small{font-size:12px;margin-top:2px}
/* Without lighting disclosure, retain the inset below the final status row. */
:host([data-appearance=hero]) .summary:has(~ .light-panel[hidden]){padding-bottom:12px}
:host([data-appearance=hero]) .light-panel{order:4;margin:8px 12px 4px;border-top:1px solid var(--divider-color,#e0e0e0)}
:host([data-appearance=hero]) .light-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;font-size:13px;font-weight:550;cursor:pointer;list-style:none}.light-heading::-webkit-details-marker{display:none}.light-heading:after{content:'+';font-size:20px;font-weight:400;color:var(--secondary-text-color,#616161)}details[open]>.light-heading:after{content:'−'}summary:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px;border-radius:6px}
:host([data-appearance=hero]) .controls{margin:0}.light-panel[hidden]{display:none}:host([data-appearance=hero]) p{order:5;margin:0 20px 16px}:host([data-appearance=hero]) p:empty{display:none}
@container(min-width:620px){:host([data-appearance=hero]) .summary{grid-template-columns:repeat(4,minmax(0,1fr))}:host([data-appearance=hero]) .controls{grid-template-columns:repeat(3,minmax(0,1fr))}}
@container(max-width:350px){:host([data-appearance=hero]) canvas,:host([data-appearance=hero]) .floor-image{margin-bottom:-8px}:host([data-appearance=hero]) .hero-header{padding-left:12px}:host([data-appearance=hero]) h2{font-size:19px}:host([data-appearance=hero]) .summary-tile ha-icon{display:none}:host([data-appearance=hero]) .stage-caption{padding-left:12px;padding-right:12px;font-size:12px}}
.hero-avatar{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:650;background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent);color:var(--primary-text-color,#202124)}

.hero-avatar-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit}.hero-avatar-photo[hidden]{display:none}
.view-toggle{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:10px;background:var(--secondary-background-color,#f1f3f4);flex:none}.view-toggle button{display:inline-flex;justify-content:center;min-height:44px;min-width:58px;gap:0;padding:6px 10px;font-size:12px;font-weight:550;text-align:center;background:transparent}.view-toggle button[aria-pressed=true]{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-color,#03a9f4)}
:host([data-appearance=standard][data-view-toggle=true]) .stage-caption{display:flex;justify-content:flex-end;align-items:center;padding:0 12px 8px}
@media(prefers-reduced-motion:reduce){:host([data-appearance=hero]) canvas,:host([data-appearance=hero]) .floor-image{animation:none}button{transition:none}}
/* Approved compact welcome, isolated from existing hero and floor cards. */
:host([data-welcome-layout=compact]){--welcome-muted:var(--secondary-text-color,#616161);--welcome-accent:var(--primary-text-color,#202124);color:var(--primary-text-color,#202124)}
:host([data-welcome-layout=compact]) ha-card{background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:var(--ha-card-border-radius,16px)}
:host([data-welcome-layout=compact]) .hero-header{grid-area:1/1;padding:16px 16px 0;pointer-events:none;min-height:0;display:flex;flex-direction:column;background:transparent;box-shadow:none}
:host([data-welcome-layout=compact]) h2{font-size:18px;max-width:none;margin:0 0 4px;letter-spacing:-.01em}
:host([data-welcome-layout=compact]) .hero-meta{display:contents}
:host([data-welcome-layout=compact]) .hero-date{order:0;font-size:11px;letter-spacing:normal;color:var(--welcome-muted);margin-bottom:2px;text-transform:none}
:host([data-welcome-layout=compact]) .home-caption{font-size:12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .stage{grid-area:1/1;margin-top:0;background:radial-gradient(ellipse at 65% 43%,#8c68452b,transparent 70%)}
:host([data-welcome-layout=compact][data-dark=false]) .stage{background:radial-gradient(ellipse at 65% 43%,#d5ad7433,transparent 70%)}
:host([data-welcome-layout=compact]) canvas,:host([data-welcome-layout=compact]) .floor-image{height:auto;aspect-ratio:4/3;margin:0 0 -24px}
:host([data-welcome-layout=compact]) .stage-caption{padding:0 16px 8px;font-size:12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .view-toggle{border-radius:8px;padding:2px;background:var(--secondary-background-color,#f1f3f4)}
:host([data-welcome-layout=compact]) .view-toggle button{border-radius:8px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .view-toggle button[aria-pressed=true]{background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-color,#03a9f4)}
:host([data-welcome-layout=compact]) .summary{grid-area:3/1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin:0 16px;padding:0!important;border-top:1px solid var(--divider-color,#e0e0e0)}
:host([data-welcome-layout=compact]) .summary-tile{background:none;border-radius:0;padding:10px 0;min-height:44px;color:inherit}
:host([data-welcome-layout=compact]) .summary-tile small{font-size:11px;color:var(--welcome-muted);font-weight:400}
:host([data-welcome-layout=compact]) [data-summary=thermostat],:host([data-welcome-layout=compact]) [data-summary=weather]{order:0;display:block;border-bottom:1px solid var(--divider-color,#e0e0e0)}
:host([data-welcome-layout=compact]) [data-summary=weather]{padding-left:14px}
:host([data-welcome-layout=compact]) .temperature-main{display:flex;align-items:baseline;justify-content:space-between;gap:5px}
:host([data-welcome-layout=compact]) .temperature-label{font-size:12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) .temperature-value{font-size:22px;letter-spacing:-.01em;font-weight:550;white-space:nowrap;font-variant-numeric:tabular-nums}
:host([data-welcome-layout=compact]) [data-summary=thermostat] .temperature-value{color:var(--welcome-accent)}
:host([data-welcome-layout=compact]) [data-summary=presence]{order:1;gap:8px;padding:10px 0}
:host([data-welcome-layout=compact]) .hero-avatar{width:29px;height:29px;border:1px solid var(--divider-color,#e0e0e0);background:none;color:inherit}
:host([data-welcome-layout=compact]) [data-summary=alarm]{order:2;grid-column:1/-1;border-top:1px solid var(--divider-color,#e0e0e0);padding:9px 0 12px;color:var(--welcome-muted)}
:host([data-welcome-layout=compact]) [data-summary=alarm] .label{display:flex;gap:7px;align-items:baseline;font-size:12px;font-weight:400}
:host([data-welcome-layout=compact]) [data-summary=alarm] ha-icon{display:inline-flex;--mdc-icon-size:16px;width:16px;height:16px}
:host([data-welcome-layout=compact]) .light-panel{grid-area:4/1}
:host([data-welcome-layout=compact]) p{grid-area:5/1}
@container(max-width:350px){:host([data-welcome-layout=compact]) .hero-header{padding-left:12px;padding-right:12px}:host([data-welcome-layout=compact]) .stage-caption{padding-left:12px;padding-right:12px}:host([data-welcome-layout=compact]) .summary{margin:0 12px}:host([data-welcome-layout=compact]) .temperature-value{font-size:21px}}
</style><ha-card><div class="content"><header class="hero-header"><h2></h2><div class="hero-meta"></div></header><div class="summary" aria-label="Woningstatus"></div><div class="navigation"></div><div class="stage"><canvas role="img" aria-label="3D-huis met actuele verlichting" hidden></canvas><img class="floor-image" alt="Verdiepingsaanzicht" hidden><div class="stage-caption"></div></div><details class="light-panel" open><summary class="light-heading">Verlichting</summary><div class="lighting-notice"></div><div class="controls"></div></details><p role="status" aria-live="polite">Beeldset laden…</p></div></ha-card>`;
  this.shadowRoot.querySelector('.stage-caption').addEventListener('click',e=>{const id=e.target.closest('button[data-house-view]')?.dataset.houseView;if(id&&this.cameraToggleViews().some(v=>v.id===id))this.selectView(id);});
  this.shadowRoot.addEventListener('error',e=>{if(e.target.matches?.('.hero-avatar-photo'))e.target.hidden=true;},true);
  this.shadowRoot.querySelector('.hero-meta').addEventListener('click',e=>{const id=e.target.closest('[data-weather]')?.dataset.weather;if(id)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));});
 }
 static getStubConfig(){return {title:'Huis',manifest:'/local/house/manifest.json',view:'cam-iso',mode:'auto'};}
 static getConfigForm(){return {schema:[{name:'appearance',selector:{select:{mode:'dropdown',options:[{value:'standard',label:'Standaard'},{value:'hero',label:'Living Home · openingskaart'}]}}},{name:'weather_entity',selector:{entity:{domain:'weather'}}},{name:'title',selector:{text:{}}},{name:'manifest',required:true,selector:{text:{}}},{name:'view_catalog',selector:{text:{}}},{name:'view',selector:{text:{}}},{name:'mode',selector:{select:{options:['auto','light','dark','morning','afternoon','evening','night']}}},{name:'show_view_toggle',selector:{boolean:{}}},{name:'controls',selector:{boolean:{}}},{name:'show_presence',selector:{boolean:{}}},{name:'presence_entities',selector:{entity:{domain:'person',multiple:true}}},{name:'show_alarm',selector:{boolean:{}}},{name:'alarm_entity',selector:{entity:{domain:'alarm_control_panel'}}},{name:'show_thermostat',selector:{boolean:{}}},{name:'thermostat_entity',selector:{entity:{domain:'climate'}}}],computeLabel:s=>({appearance:'Vormgeving',weather_entity:'Weer op openingskaart',title:'Titel',manifest:'Manifest-URL',view_catalog:'Extra verdiepingsaanzichten (catalogus-URL)',view:'Startaanzicht',mode:'Weergavemodus',show_view_toggle:'Voor/achter-schakelaar tonen',controls:'Lichtknoppen tonen',show_presence:'Aanwezigheid tonen',presence_entities:'Personen',show_alarm:'Alarm tonen',alarm_entity:'Alarm',show_thermostat:'Thermostaat tonen',thermostat_entity:'Thermostaat'}[s.name]||s.name)};}
 heroHeaderHTML(){
  const date=new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  if(this.config.appearance==='hero'&&this.config.welcome_layout==='compact'){
   const names=(this.config.show_presence?this.config.presence_entities||[]:[]).map(id=>this._hass?.states?.[id]).filter(s=>s?.state==='home').map(s=>s.attributes?.friendly_name||'Iemand');
   return `<div class="hero-date">${esc(date)}</div><div class="home-caption">${esc(names.length?names.join(' en ')+(names.length===1?' is thuis':' zijn thuis'):'')}</div>`;
  }
  const id=this.config.weather_entity,s=this._hass?.states?.[id],known=s&&!['unknown','unavailable'].includes(s.state),a=s?.attributes||{};
  const labels={sunny:'Zonnig','clear-night':'Heldere nacht',cloudy:'Bewolkt',partlycloudy:'Half bewolkt',rainy:'Regen',pouring:'Zware regen',snowy:'Sneeuw','snowy-rainy':'Natte sneeuw',fog:'Mist',windy:'Winderig','windy-variant':'Winderig',lightning:'Onweer','lightning-rainy':'Onweer',hail:'Hagel',exceptional:'Bijzonder weer'};
  const temp=known&&typeof a.temperature==='number'&&Number.isFinite(a.temperature)?a.temperature.toLocaleString('nl-NL',{maximumFractionDigits:1})+' '+(a.temperature_unit||'°C'):'—';
  return `<div class="hero-date">${esc(date)}</div>${id?`<button type="button" class="weather" data-weather="${esc(id)}" aria-label="${esc('Weer: '+(known?(labels[s.state]||s.state)+' '+temp:'Niet beschikbaar'))}"><span class="weather-temp">${esc(known?temp:'—')}</span><span>${esc(known?(labels[s.state]||s.state):'Niet beschikbaar')}</span></button>`:''}`;
 }
 cameraToggleViews(){
  if(this.config?.show_view_toggle!==true)return [];
  const views=this.availableViews().filter(v=>(v.scope||'house')==='house');
  if(!views.some(v=>v.id===this.viewId))return [];
  const pair=['front','rear'].map(location=>views.find(v=>v.camera_location===location));
  return pair.every(Boolean)?pair:[];
 }
 cameraToggleHTML(){
  const views=this.cameraToggleViews();
  return views.length?`<span class="view-toggle" role="group" aria-label="Aanzicht woning">${views.map((v,i)=>`<button type="button" data-house-view="${esc(v.id)}" aria-pressed="${v.id===this.viewId}">${i?'Achter':'Voor'}</button>`).join('')}</span>`:'';
 }
 viewCaptionHTML(view){return this.cameraToggleHTML()||`<span class="view-label">${esc(view)}</span>`;}
 heroSceneHTML(){
  if(!this.loaded)return '<span>Beeldset laden…</span>'+this.cameraToggleHTML();
  const view=this.loaded.view?.camera_name||this.loaded.view?.name||this.loaded.name||'Huis';
  if(this.loaded.static)return `<span>Conceptbeeld</span><span class="view-label">${esc(view)}</span>`;
  const states=(this.loaded.manifest.lights||[]).map(l=>this.lightState(l)),on=states.filter(s=>s.on).length,known=states.filter(s=>s.known).length;
  const label=!known?'Lichtstatus niet beschikbaar':on?`${on} ${on===1?'ruimte':'ruimtes'} verlicht`:known<states.length?'Verlichting uit · deels bekend':'Verlichting uit';
  return `<span class="light-state"><span class="light-dot ${on?'on':''}" aria-hidden="true"></span>${esc(label)}</span>${this.viewCaptionHTML(view)}`;
 }
 drawHero(){
  const mode=this.loaded?.arrays?HousePixels.resolveMode(this.config.mode,this.loaded.arrays,this._hass):null;
  if(this.dataset){this.dataset.dark=String(!!this._hass?.themes?.darkMode);this.dataset.night=String(mode==='night'||mode==='dark');this.dataset.viewToggle=String(this.cameraToggleViews().length===2);}
  if(this.config.appearance!=='hero'&&this.config.show_view_toggle!==true)return;
  const root=this.shadowRoot,stage=root.querySelector('.stage-caption'),scene=this.config.appearance==='hero'?this.heroSceneHTML():this.cameraToggleHTML();
  if(stage.innerHTML!==scene){const focus=root.activeElement?.dataset.houseView;stage.innerHTML=scene;if(focus)Array.from(stage.querySelectorAll('[data-house-view]')).find(b=>b.dataset.houseView===focus)?.focus();}
  if(this.config.appearance!=='hero')return;
  const meta=root.querySelector('.hero-meta'),html=this.heroHeaderHTML();
  if(meta.innerHTML!==html){const focus=!!root.activeElement?.dataset.weather;meta.innerHTML=html;if(focus)meta.querySelector('[data-weather]')?.focus();}
  root.querySelector('.lighting-notice').textContent='';
  root.querySelector('.light-panel').hidden=!this.config.controls||!this.loaded||!!this.loaded.static;
 }
 availableViews(){return [...(this.renderManifest?.views||[]).map(v=>({...v,scope:v.scope||'house'})),...(this.extraViews||[])];}
 static getConfigElement(){return document.createElement('eleven-house-card-editor');}
 navigationHTML(){return '';}
 selectView(id){
  if(id===this.viewId||!this.availableViews().some(v=>v.id===id))return;
  // Keep the current exterior mounted until its replacement is completely loaded.
  // Floor/config navigation still clears unrelated imagery as before.
  const pair=this.cameraToggleViews(),retain=!!this.loaded&&!this.loaded.static&&pair.some(v=>v.id===id)&&pair.some(v=>v.id===this.loaded.view.id);
  this.viewId=id;if(!retain)this.loaded=null;this.failure='';this.drawKey=null;this.loadToken++;this.draw();this.load();
 }
 drawNavigation(){
  const root=this.shadowRoot,nav=root.querySelector('.navigation'),html=this.navigationHTML(),focus=root.activeElement?.dataset.nav;
  if(html===this.navHTML)return;this.navHTML=html;nav.innerHTML=html;
  nav.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{const views=this.availableViews(),id=s.dataset.nav==='camera'?s.value:s.dataset.nav==='floor'?views.find(v=>v.scope==='floor'&&v.floor_id===s.value)?.id:views.find(v=>v.scope===s.value)?.id;if(id)this.selectView(id);else{this.loaded=null;this.failure='Voor dit aanzicht zijn nog geen renders beschikbaar.';this.draw();}}));
  if(focus)nav.querySelector(`[data-nav="${focus}"]`)?.focus();
 }
 avatarHTML(id,label){
  const value=this._hass?.states?.[id]?.attributes?.entity_picture;
  const picture=typeof value==='string'&&/^(\/(?!\/)|https?:\/\/)/i.test(value.trim())?value.trim():'';
  return `<span class="hero-avatar" aria-hidden="true"><span class="hero-avatar-initial">${esc(Array.from(label)[0]?.toUpperCase()||'?')}</span>${picture?`<img class="hero-avatar-photo" src="${esc(picture)}" alt="" decoding="async" referrerpolicy="no-referrer">`:''}</span>`;
 }
 statusHTML(){
  const states=this._hass?.states||{},c=this.config,unknown=s=>!s||['unknown','unavailable'].includes(s.state);
  const tile=(kind,id,icon,label,value,detail='')=>{
   const hero=c.appearance==='hero',person=hero&&kind==='presence',climate=hero&&kind==='thermostat';
   if(hero&&c.welcome_layout==='compact'&&(climate||kind==='weather'))return `<button type="button" class="summary-tile temperature" data-summary="${kind}" data-info="${esc(id)}" ${id?'':'disabled'} aria-label="${esc((climate?'Binnen':'Buiten')+': '+value+(detail?' · '+detail:''))}"><span class="temperature-main"><span class="temperature-label">${climate?'Binnen':'Buiten'}</span><span class="temperature-value">${esc(value==='Niet beschikbaar'?'—':value)}</span></span><small>${esc(value==='Niet beschikbaar'?value:detail)}</small></button>`;
   const primary=climate?'Binnen · '+value:hero?label:value;
   const secondary=climate?detail:hero?value:label+(detail?' · '+detail:'');
   return `<button type="button" class="summary-tile" data-summary="${kind}" data-info="${esc(id)}" ${id?'':'disabled'} aria-label="${esc((climate?'Binnen':label)+': '+value+(detail?' · '+detail:''))}">${person?this.avatarHTML(id,label):`<ha-icon icon="${icon}" aria-hidden="true"></ha-icon>`}<span class="label">${esc(primary)}${secondary?`<small>${esc(secondary)}</small>`:''}</span></button>`;
  };
  let html='';
  if(c.show_presence){const ids=Array.isArray(c.presence_entities)?c.presence_entities:[];html+=ids.length?ids.map(id=>{const s=states[id];return tile('presence',id,s?.state==='home'?'mdi:account-check-outline':'mdi:account-outline',s?.attributes?.friendly_name||id,unknown(s)?'Niet beschikbaar':s.state==='home'?'Thuis':s.state==='not_home'?'Afwezig':Object.entries(states).find(([key,zone])=>key.startsWith('zone.')&&(key===s.state||key.slice(5)===s.state||zone.attributes?.friendly_name===s.state))?.[1].attributes?.friendly_name||s.state);}).join(''):tile('presence','','mdi:account-outline','Aanwezigheid','Geen personen gekozen');}
  if(c.show_alarm){const id=c.alarm_entity,s=states[id],labels={disarmed:'Uitgeschakeld',armed_home:'Thuis beveiligd',armed_away:'Ingeschakeld',armed_night:'Nachtstand',armed_vacation:'Vakantiestand',armed_custom_bypass:'Deels beveiligd',arming:'Inschakelen…',disarming:'Uitschakelen…',pending:'Vertraging',triggered:'Alarm!'};html+=tile('alarm',id,s?.state==='disarmed'?'mdi:shield-off-outline':'mdi:shield-home-outline','Alarm',unknown(s)?'Niet beschikbaar':labels[s.state]||'Onbekende status');}
  if(c.show_thermostat){const id=c.thermostat_entity,s=states[id],a=s?.attributes||{},unit=this._hass?.config?.unit_system?.temperature||'°C',fmt=v=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('nl-NL',{maximumFractionDigits:1})+' '+unit:null;html+=tile('thermostat',id,'mdi:thermometer','Thermostaat',unknown(s)?'Niet beschikbaar':fmt(a.current_temperature)||'Temperatuur onbekend',!unknown(s)&&fmt(a.temperature)?'Doel '+fmt(a.temperature):'');}
  if(c.appearance==='hero'&&c.welcome_layout==='compact'&&c.weather_entity){const id=c.weather_entity,s=states[id],a=s?.attributes||{},labels={sunny:'Zonnig','clear-night':'Heldere nacht',cloudy:'Bewolkt',partlycloudy:'Half bewolkt',rainy:'Regen',pouring:'Zware regen',snowy:'Sneeuw','snowy-rainy':'Natte sneeuw',fog:'Mist',windy:'Winderig','windy-variant':'Winderig',lightning:'Onweer','lightning-rainy':'Onweer',hail:'Hagel',exceptional:'Bijzonder weer'};html+=tile('weather',id,'mdi:thermometer','Buiten',unknown(s)||!Number.isFinite(a.temperature)?'Niet beschikbaar':a.temperature.toLocaleString('nl-NL',{maximumFractionDigits:1})+' '+(a.temperature_unit||'°C'),unknown(s)?'':labels[s.state]||s.state);}
  return html;
 }
 setConfig(c){this.stopLivingMotion();this.frameIdentity=null;if(!c.manifest)throw Error('manifest is verplicht');if(c.mode&&!['auto','light','dark','morning','afternoon','evening','night'].includes(c.mode))throw Error('Ongeldige modus');this.config={title:'Huis',view:'cam-iso',mode:'auto',controls:true,appearance:'standard',...c};this.dataset.appearance=this.config.appearance;this.dataset.welcomeLayout=this.config.appearance==='hero'&&this.config.welcome_layout==='compact'?'compact':'';this.shadowRoot.querySelector('.light-panel').open=this.config.appearance!=='hero';this.viewId=this.config.view;this.loaded=null;this.renderManifest=null;this.extraViews=[];this.loadToken=(this.loadToken||0)+1;this.drawKey=null;this.load();this.draw();}
 set hass(h){this._hass=h;this.refreshAreaRegistries();this.draw();}get hass(){return this._hass;}
 // Frontend registries are authoritative. Older hosts may provide read-only WS snapshots.
 refreshAreaRegistries(force=false){
  const h=this._hass,owner=h?.connection||h?.callWS;
  if(this.areaRegistryOwner!==owner){this.areaRegistryOwner=owner;this.areaEntities=null;this.areaDevices=null;this.areaRegistryRequest=null;this.areaRegistryAttempted='';}
  if(!h?.callWS||this.loaded?.static||!this.loaded?.manifest?.lights?.some(l=>Object.hasOwn(l,'area_id')))return Promise.resolve();
  const missing=[!h.entities&&'entity',!h.devices&&'device'].filter(Boolean),key=missing.join(',');
  if(!key)return Promise.resolve();if(this.areaRegistryRequest)return this.areaRegistryRequest;
  if(!force&&this.areaRegistryAttempted===key)return Promise.resolve();this.areaRegistryAttempted=key;
  const request=Promise.all(missing.map(async kind=>{
   const rows=await h.callWS({type:`config/${kind}_registry/list`});
   if(!Array.isArray(rows))throw Error('Ongeldig register');
   return [kind,Object.fromEntries(rows.map(row=>[kind==='entity'?row.entity_id:row.id,row]))];
  })).then(results=>{if(this.areaRegistryRequest!==request)return;for(const [kind,rows] of results)this[kind==='entity'?'areaEntities':'areaDevices']=rows;})
   .catch(()=>{if(this.areaRegistryRequest===request){this.areaEntities=null;this.areaDevices=null;}})
   .finally(()=>{if(this.areaRegistryRequest===request){this.areaRegistryRequest=null;this.draw();}});
  this.areaRegistryRequest=request;return request;
 }
 // Presence of area_id is authoritative, even when empty/invalid: never silently use entity.
 bindingKey(light){return Object.hasOwn(light,'area_id')?'area:'+String(light.area_id??''):light.entity;}
 lightState(light){
  if(!Object.hasOwn(light,'area_id'))return HousePixels.lightLevel(this._hass?.states?.[light.entity]);
  const area=light.area_id,entities=this._hass?.entities||this.areaEntities,devices=this._hass?.devices||this.areaDevices;
  if(typeof area!=='string'||!area||!entities||!devices)return {known:false,on:false,level:0};
  const states=Object.values(entities).filter(e=>e.entity_id?.startsWith('light.')&&!e.disabled_by&&!e.hidden_by&&!['config','diagnostic'].includes(e.entity_category)&&(e.area_id??devices[e.device_id]?.area_id)===area).map(e=>HousePixels.lightLevel(this._hass?.states?.[e.entity_id]));
  const active=states.filter(s=>s.on);
  return {known:states.some(s=>s.known),on:active.length>0,level:active.length?active.reduce((sum,s)=>sum+s.level,0)/active.length:0};
 }
 getCardSize(){return 6;}getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 connectedCallback(){if(this.config){this.draw();this.load();}this.refreshAreaRegistries(true);clearInterval(this.timer);this.timer=setInterval(()=>{this.refreshAreaRegistries(true);this.load();},30000);}
 disconnectedCallback(){clearInterval(this.timer);this.stopLivingMotion();this.loadToken=(this.loadToken||0)+1;this.loading=null;}
 stopLivingMotion(){
  this.lightAnimation?.cancel();this.lightAnimation=null;this.lightGhost?.remove();this.lightGhost=null;
  this.entryAnimation?.cancel();this.entryAnimation=null;
 }
 paintLivingFrame(canvas,pixels,width,height,identity){
  const animate=this.isConnected&&this.config.appearance==='hero'&&typeof canvas.animate==='function'&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const same=animate&&this.frameIdentity===identity&&canvas.width===width&&canvas.height===height;
  let ghost;
  if(same){
   ghost=document.createElement('canvas');ghost.width=width;ghost.height=height;
   const context=ghost.getContext('2d');context.drawImage(canvas,0,0);
   // Snapshot the currently visible blend when another state arrives mid-fade.
   if(this.lightGhost){context.globalAlpha=Number(getComputedStyle(this.lightGhost).opacity);context.drawImage(this.lightGhost,0,0);context.globalAlpha=1;}
  }
  this.stopLivingMotion();canvas.width=width;canvas.height=height;
  canvas.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);this.frameIdentity=identity;
  if(ghost){
   ghost.setAttribute('aria-hidden','true');ghost.className='light-transition';ghost.style.cssText='position:absolute;top:0;left:0;pointer-events:none';
   this.shadowRoot.querySelector('.stage').appendChild(ghost);this.lightGhost=ghost;
   const animation=ghost.animate([{opacity:1},{opacity:0}],{duration:650,easing:'ease-in-out',fill:'forwards'});this.lightAnimation=animation;
   animation.onfinish=()=>{if(this.lightAnimation===animation){ghost.remove();this.lightGhost=null;this.lightAnimation=null;}};
  }else if(animate&&!this.livingEntered){
   this.livingEntered=true;this.entryAnimation=canvas.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:'ease-out'});
  }
 }
 async load(){
  if(!this.config)return;const token=this.loadToken,config=this.config;if(this.loading===token)return;this.loading=token;
  try{
   const origin=new URL(config.manifest,document.baseURI),pointer=await HousePixels.json(origin),url=pointer.manifest?new URL(pointer.manifest,origin):origin;
   const manifest=pointer.manifest?await HousePixels.json(url,'default'):pointer;
   let extras=[];
   if(config.view_catalog){const catalogURL=new URL(config.view_catalog,document.baseURI),catalog=await HousePixels.json(catalogURL);if(catalog.schema!==1||!Array.isArray(catalog.views))throw Error('Ongeldige aanzichtcatalogus');extras=catalog.views.map(v=>{const field=v.manifest?'manifest':'image';if(!v[field])throw Error('Beeldbron ontbreekt');const source=new URL(v[field],catalogURL);if(source.origin!==origin.origin||v.scope!=='floor'||!v.floor_id||!v.id)throw Error('Ongeldig verdiepingsaanzicht');return {...v,[field]:source.href};});}
   if(token!==this.loadToken)return;this.renderManifest=manifest;this.extraViews=extras;
   const selected=this.availableViews().find(v=>v.id===this.viewId);if(!selected)throw Error('Aanzicht ontbreekt');this.drawNavigation();
   let next;
   if(selected.image){const image=new Image();image.src=selected.image;await image.decode();next={static:true,image:selected.image,name:selected.name,version:selected.version||'concept',view:selected,manifest};}
   else{if(this.loaded&&!this.loaded.static&&this.loaded.url?.href===(selected.manifest||url.href)&&this.loaded.view.id===selected.id&&this.loaded.manifest.release===(selected.manifest?this.loaded.manifest.release:manifest.release)){this.failure='';this.failedMode=null;this.draw();return;}next=await HousePixels.load(selected.manifest||url.href,selected.id,{mode:config.mode,hass:this._hass});if(!next.alpha)throw Error('Deze kaart vereist een transparante beeldset');next.view={...next.view,lighting_notice:selected.lighting_notice||next.view.lighting_notice};}
   if(token!==this.loadToken)return;this.loaded=next;this.refreshAreaRegistries();this.failure='';this.drawKey=null;this.draw();this.dispatchEvent(new CustomEvent('house-ready',{detail:{release:manifest.release,view:selected.id}}));
  }
  catch(e){if(token===this.loadToken){this.failure=e.message;this.draw();}}
  finally{if(this.loading===token)this.loading=null;}
 }
 draw(){
  if(!this.config)return;this.drawHero();const root=this.shadowRoot,title=root.querySelector('h2'),status=root.querySelector('p');title.textContent=this.config.title;title.hidden=!this.config.title;
  const summary=root.querySelector('.summary'),htmlSummary=this.statusHTML(),focusInfo=root.activeElement?.dataset.info;
  if(this.summaryHTML!==htmlSummary){summary.innerHTML=htmlSummary;this.summaryHTML=htmlSummary;summary.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.info)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:b.dataset.info},bubbles:true,composed:true}));}));if(focusInfo)Array.from(summary.querySelectorAll('[data-info]')).find(b=>b.dataset.info===focusInfo)?.focus();}
  summary.hidden=!htmlSummary;
  this.drawNavigation();const canvas=root.querySelector('canvas'),image=root.querySelector('.floor-image'),lightControls=root.querySelector('.controls');
  canvas.hidden=!this.loaded||!!this.loaded.static;image.hidden=!this.loaded?.static;lightControls.hidden=!this.loaded||!!this.loaded.static||!this.config.controls;
  if(!this.loaded){image.removeAttribute('src');status.textContent=this.failure||'Beeldset laden…';status.dataset.error=String(!!this.failure);return;}
  if(this.loaded.static){if(image.getAttribute('src')!==this.loaded.image)image.src=this.loaded.image;image.alt=this.loaded.name;status.textContent=[`${this.loaded.version} · Conceptbeeld; nog zonder live lichtlagen.`,this.failure?'Nieuw beeld niet geladen: '+this.failure:''].filter(Boolean).join(' — ');status.dataset.error=String(!!this.failure);return;}
  const {manifest,arrays,alpha}=this.loaded,mode=HousePixels.resolveMode(this.config.mode,arrays,this._hass);
  if(!arrays[mode]){
   const target=this.loaded,requestKey=manifest.release+target.view.id+mode;
   status.textContent=this.failure||'Lichtmoment laden…';status.dataset.error=String(!!this.failure);
   if(!this.modeLoad&&this.failedMode!==requestKey){
    this.modeLoad=requestKey;
    HousePixels.ensureMode(target,mode).then(()=>{if(this.loaded===target){this.failure='';this.failedMode=null;}}).catch(e=>{if(this.loaded===target){this.failure=e.message;this.failedMode=requestKey;}}).finally(()=>{if(this.modeLoad===requestKey)this.modeLoad=null;if(this.loaded===target)this.draw();});
   }
   return;
  }
  const states=manifest.lights.map(l=>this.lightState(l));
  const key=manifest.release+this.loaded.view.id+mode+JSON.stringify(states.map(s=>s.level));
  if(this.drawKey!==key){this.paintLivingFrame(canvas,HousePixels.compose(arrays[mode].base,arrays[mode].layers,states.map(s=>s.level),alpha),manifest.width,manifest.height,manifest.release+this.loaded.view.id);this.drawKey=key;}
  const controls=root.querySelector('.controls'),focused=root.activeElement?.dataset.entity;
  const html=this.config.controls?manifest.lights.map((l,i)=>{const id=this.bindingKey(l),s=states[i],name=this.config.names?.[l.id]||l.name.replace(/ verlichting$/,'');return `<button type="button" data-entity="${esc(id)}" aria-label="${esc(name)} ${s.on?'uitschakelen':'inschakelen'}" aria-pressed="${s.on}" ${!s.known||this.pending.has(id)?'disabled':''}><ha-icon icon="${s.on?'mdi:lightbulb':'mdi:lightbulb-outline'}" aria-hidden="true"></ha-icon><span class="label">${esc(name)}<small>${!s.known?'Niet beschikbaar':this.pending.has(id)?'Bezig…':s.on?'Aan':'Uit'}</small></span></button>`;}).join(''):'';
  if(this.controlsHTML!==html){controls.innerHTML=html;this.controlsHTML=html;controls.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>this.toggle(b.dataset.entity)));if(focused)Array.from(controls.querySelectorAll('button')).find(b=>b.dataset.entity===focused)?.focus();}
  controls.hidden=!this.config.controls;
  status.textContent=[this.failure?'Nieuwe beeldset niet geladen; vorige blijft zichtbaar: '+this.failure:'',this.actionError||''].filter(Boolean).join(' — ');status.dataset.error=String(!!this.failure||!!this.actionError);
 }
 async toggle(key){
  if(this.loaded?.static||this.pending.has(key))return;
  const light=this.loaded?.manifest.lights.find(l=>this.bindingKey(l)===key);if(!light)return;
  const area=Object.hasOwn(light,'area_id'),s=this.lightState(light),domain=area?'light':light.entity?.split('.')[0];
  if(!s.known||!['light','switch','input_boolean'].includes(domain)||!this._hass?.callService)return;
  this.pending.add(key);this.actionError='';this.draw();
  try{await this._hass.callService(domain,s.on?'turn_off':'turn_on',area?{area_id:light.area_id}:{entity_id:light.entity});}
  catch(e){this.actionError='Schakelen mislukt: '+(e.message||'verbinding verbroken');}
  finally{this.pending.delete(key);this.draw();}
 }
}
class ElevenHouseCardEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<ha-form></ha-form><p role="status"></p>';this.form=this.shadowRoot.querySelector('ha-form');this.form.addEventListener('value-changed',e=>this.changed(e.detail.value));}
 setConfig(c){this.config={...c};this.render();this.loadViews();}
 set hass(h){this._hass=h;this.render();}
 async loadViews(){
  const key=JSON.stringify([this.config.manifest,this.config.view_catalog]);if(this.catalogKey===key)return;this.catalogKey=key;const token=++this.token|| (this.token=1);
  try{const origin=new URL(this.config.manifest,document.baseURI),pointer=await HousePixels.json(origin),manifest=pointer.manifest?await HousePixels.json(new URL(pointer.manifest,origin)):pointer;let extras=[];if(this.config.view_catalog){const catalog=await HousePixels.json(new URL(this.config.view_catalog,document.baseURI));if(catalog.schema!==1||!Array.isArray(catalog.views))throw Error('Ongeldige aanzichtcatalogus');extras=catalog.views;}
   if(token!==this.token)return;this.views=[...(manifest.views||[]).map(v=>({...v,scope:v.scope||'house'})),...extras];this.error='';this.render();
  }catch(e){if(token===this.token){this.catalogKey=null;this.error='Aanzichten laden mislukt: '+e.message;this.render();}}
 }
 viewSchema(){
  const views=this.views||[],active=views.find(v=>v.id===this.config.view),scope=active?.scope||'house',floor=active?.floor_id;
  const field=(name,options)=>({name,selector:{select:{mode:'dropdown',options}}});
  const result=[field('view_scope',[{value:'house',label:'Hele huis'},{value:'floor',label:'Verdieping'}])];
  if(scope==='floor')result.push(field('view_floor',[...new Map(views.filter(v=>v.scope==='floor').map(v=>[v.floor_id,{value:v.floor_id,label:v.floor_name||v.name}])).values()]));
  result.push(field('view_camera',views.filter(v=>v.scope===scope&&(scope!=='floor'||v.floor_id===floor)).map(v=>({value:v.id,label:v.camera_name||(scope==='floor'?'Bovenaanzicht':v.name)}))));return result;
 }
 resolveView(value){const views=this.views||[],active=views.find(v=>v.id===this.config.view),scope=value.view_scope||active?.scope||'house';let choices=views.filter(v=>v.scope===scope);if(scope==='floor'){const floor=choices.some(v=>v.floor_id===value.view_floor)?value.view_floor:choices[0]?.floor_id;choices=choices.filter(v=>v.floor_id===floor);}return (choices.find(v=>v.id===value.view_camera)||choices[0])?.id;}
 changed(value){const view=this.resolveView(value),next={...this.config,...value};delete next.view_scope;delete next.view_floor;delete next.view_camera;if(view)next.view=view;this.config=next;this.render();this.loadViews();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));}
 render(){if(!this.config||!this.form)return;const base=ElevenHouseCard.getConfigForm(),active=(this.views||[]).find(v=>v.id===this.config.view);this.form.hass=this._hass;this.form.schema=[...this.viewSchema(),...base.schema.filter(s=>!['view','manifest','view_catalog'].includes(s.name)),{name:'sources',type:'expandable',title:'Geavanceerd · beeldbronnen',flatten:true,expanded:false,schema:base.schema.filter(s=>['manifest','view_catalog'].includes(s.name))}];this.form.data={...this.config,view_scope:active?.scope||'house',view_floor:active?.floor_id,view_camera:this.config.view};this.form.computeLabel=s=>({view_scope:'Aanzicht',view_floor:'Verdieping',view_camera:'Cameralocatie'}[s.name]||base.computeLabel(s));this.shadowRoot.querySelector('p').textContent=this.error||'';}
}

const HOUSE_PREVIEW_TONES={warm:'#d2a365',charging:'#d9ac43',waiting:'#6fa9ee',done:'#68b695',planned:'#b49ade',off:'#89919c'};
function houseStyleOptions(c={}){
 const finite=(v,d,min,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):d;
 return {...c,background:HEADER_BACKGROUNDS.some(b=>b.value===c.background)?c.background:'halo',color:Object.hasOwn(HOUSE_PREVIEW_TONES,c.color)?c.color:'warm',background_strength:finite(c.background_strength,100,0,100),image_scale:finite(c.image_scale,100,50,300),image_offset_x:finite(c.image_offset_x,0,-150,150),image_offset_y:finite(c.image_offset_y,0,-150,150),compact:c.compact!==false,animate_background:c.animate_background!==false};
}

class HouseCard extends ElevenHouseCard{
 constructor(){
  super();const style=document.createElement('style');
  style.textContent=headerBackgroundStyles+headerAtmosphereStyles+uiMetricStyles()+`
:host([data-welcome-layout=compact]) .content{--tone:#d2a365;--ui-metric-tone:var(--tone);--ui-metric-radius:8px}
:host([data-welcome-layout=compact]) .stage{isolation:isolate;overflow:hidden;background:transparent!important}
.scene-background{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;isolation:isolate;opacity:var(--header-background-opacity,1);--header-fade:linear-gradient(180deg,#000 0%,#000 25%,rgba(0,0,0,.9) 40%,rgba(0,0,0,.65) 55%,rgba(0,0,0,.32) 72%,rgba(0,0,0,.08) 88%,transparent 100%);mask-image:var(--header-fade);-webkit-mask-image:var(--header-fade)}
:host([data-welcome-layout=compact]) .stage>canvas:not(.house-weather),:host([data-welcome-layout=compact]) .stage>.floor-image{transform:translate(var(--house-image-x,0px),var(--house-image-y,0px)) scale(var(--house-image-scale,1));transform-origin:center;aspect-ratio:4/3;margin:0;width:100%;height:auto}
:host([data-welcome-layout=compact]) .summary{gap:8px;margin:0 12px 12px;border:0;align-items:stretch}
:host([data-welcome-layout=compact]) .summary-tile{background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--tone) 10%,transparent),color-mix(in srgb,var(--tone) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee);border:0;border-radius:8px;padding:12px;min-height:72px;order:1;display:grid;gap:2px 8px}
:host([data-welcome-layout=compact]) .summary-tile[data-density=compact]{padding:8px;min-height:64px}
:host([data-welcome-layout=compact]) [data-summary=weather]{padding-left:12px}
:host([data-welcome-layout=compact]) [data-summary=thermostat],:host([data-welcome-layout=compact]) [data-summary=weather]{order:0}
:host([data-welcome-layout=compact]) [data-summary=presence] .ui-metric-value,:host([data-welcome-layout=compact]) [data-summary=alarm] .ui-metric-value{font-size:15px;letter-spacing:normal;font-weight:550}
:host([data-welcome-layout=compact]) [data-summary=alarm]{order:2;grid-column:1/-1;min-height:56px}
:host([data-welcome-layout=compact]) .summary-tile .hero-avatar{width:24px;height:24px}
:host([data-welcome-layout=compact]) .summary-tile .ui-metric-icon{display:grid}
:host([data-welcome-layout=compact]) .summary-tile .ui-metric-icon ha-icon{display:block}
:host([data-welcome-layout=compact]) .summary-tile:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}
:host([data-density=standard]) .hero-header{padding:20px 20px 0}
:host([data-density=standard]) .summary{gap:12px;margin:0 16px 16px}
:host([data-density=standard]) .stage-caption{padding:4px 16px 12px}
:host([data-density=standard]) .stage>canvas:not(.house-weather){aspect-ratio:1.2}
`;
  this.shadowRoot.append(style);this.weather=new HouseWeather(this);
  const background=document.createElement('div');background.className='scene-background';background.setAttribute('aria-hidden','true');this.shadowRoot.querySelector('.stage').prepend(background);
 }
 static getConfigForm(){const base=ElevenHouseCard.getConfigForm();base.schema.push(...houseWeatherSchema);return {...base,schema:[...base.schema,{name:'presentation',type:'expandable',title:'Vormgeving',flatten:true,schema:[{name:'background',selector:{select:{mode:'dropdown',options:headerBackgroundOptions(true)}}},{name:'color',selector:{select:{options:Object.keys(HOUSE_PREVIEW_TONES).map(value=>({value,label:({warm:'Warm',charging:'Goud',waiting:'Blauw',done:'Groen',planned:'Paars',off:'Grijs'})[value]}))}}},{name:'background_strength',selector:{number:{min:0,max:100,step:1,mode:'slider'}}},{name:'animate_background',selector:{boolean:{}}},{name:'compact',selector:{boolean:{}}},{name:'image_scale',selector:{number:{min:50,max:300,step:5,mode:'slider'}}},{name:'image_offset_x',selector:{number:{min:-150,max:150,step:1,mode:'slider'}}},{name:'image_offset_y',selector:{number:{min:-150,max:150,step:1,mode:'slider'}}}]}],computeLabel:s=>({weather_overlay:'Weerlaag tonen',animate_weather:'Weerlaag animeren',weather_intensity:'Weerintensiteit (%)',wind_threshold:'Drempel harde wind (m/s)',background:'Achtergrond',color:'Accentkleur',background_strength:'Achtergrondsterkte (%)',animate_background:'Achtergrond animeren',compact:'Compact',image_scale:'Huisgrootte (%)',image_offset_x:'Horizontale positie (px)',image_offset_y:'Verticale positie (px)'}[s.name]||base.computeLabel(s))};}
 static getConfigElement(){return document.createElement('eleven-house-styled-card-editor');}
 setConfig(c){super.setConfig({...houseStyleOptions(c),appearance:'hero',welcome_layout:'compact'});}
 connectedCallback(){super.connectedCallback();this.stopBackdrop?.();this.stopBackdrop=observeCardMotion(this);this.weather.connect();}
 disconnectedCallback(){this.weather.disconnect();this.stopBackdrop?.();this.stopBackdrop=null;super.disconnectedCallback();}
 drawHero(){
  super.drawHero();if(!this.config)return;this.weather?.update();const c=houseStyleOptions(this.config),content=this.shadowRoot.querySelector('.content');
  content.dataset.background=c.background;content.dataset.backgroundAnimated=String(c.animate_background&&this._hass?.connected!==false);content.dataset.density=c.compact?'compact':'standard';this.dataset.density=content.dataset.density;
  content.style.setProperty('--tone',HOUSE_PREVIEW_TONES[c.color]);content.style.setProperty('--header-background-opacity',String(c.background_strength/100));
  content.style.setProperty('--house-image-scale',String(c.image_scale/100));content.style.setProperty('--house-image-x',c.image_offset_x+'px');content.style.setProperty('--house-image-y',c.image_offset_y+'px');
  const bg=this.shadowRoot.querySelector('.scene-background');if(bg.dataset.background!==c.background){bg.innerHTML=headerAtmosphere(c.background);bg.dataset.background=c.background;}
 }
 statusHTML(){
  const source=document.createElement('template');source.innerHTML=super.statusHTML();
  return [...source.content.querySelectorAll('.summary-tile')].map(tile=>{
   const kind=tile.dataset.summary,id=tile.dataset.info||'',temperature=!!tile.querySelector('.temperature-main');
   const title=temperature?tile.querySelector('.temperature-label').textContent:tile.querySelector('.label')?.firstChild?.textContent?.trim()||'';
   let value=temperature?tile.querySelector('.temperature-value').textContent:tile.querySelector('small')?.textContent||'—',unit='';
   if(temperature){const split=value.match(/^(.*?)(\s*°[CF])$/);if(split){value=split[1].trim();unit=split[2].trim();}}
   const unavailable=['—','Niet beschikbaar','Temperatuur onbekend','Geen personen gekozen'].includes(value);
   return uiMetric({title,value:unavailable?null:value,unit,info:temperature?tile.querySelector('small')?.textContent||'':unavailable&&value!=='—'?value:'',icon:tile.querySelector('ha-icon')?.getAttribute('icon')||'',iconContent:kind==='presence'?this.avatarHTML(id,title):'',compact:this.config.compact!==false,action:true,attrs:{class:'summary-tile','data-summary':kind,'data-info':id,disabled:!id,'aria-label':tile.getAttribute('aria-label')}});
  }).join('');
 }
}
class HouseCardEditor extends ElevenHouseCardEditor{
 setConfig(c){super.setConfig({...houseStyleOptions(c),weather_overlay:c.weather_overlay!==false,animate_weather:c.animate_weather!==false,weather_intensity:typeof c.weather_intensity==='number'?c.weather_intensity:65,wind_threshold:typeof c.wind_threshold==='number'?c.wind_threshold:10.8});}
 render(){super.render();if(!this.config||!this.form)return;const base=HouseCard.getConfigForm();this.form.schema=[...this.form.schema.filter(s=>s.name!=='presentation'),base.schema.find(s=>s.name==='presentation'),...houseWeatherSchema];const label=this.form.computeLabel;this.form.computeLabel=s=>base.computeLabel(s)===s.name?label(s):base.computeLabel(s);}
}

class HouseCardAlias extends HouseCard {}
class HouseEditorAlias extends HouseCardEditor {}
for(const [name,Class] of [['eleven-house-styled-card',HouseCard],['eleven-house-card',HouseCardAlias],['eleven-house-styled-card-editor',HouseCardEditor],['eleven-house-card-editor',HouseEditorAlias]])if(!customElements.get(name))customElements.define(name,Class);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-house-card'))window.customCards.push({type:'eleven-house-card',name:'Eleven House (beta)',description:'Configurable house rendering with live weather',preview:true});

})();
