// Eleven Weather (beta) — self-contained module
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

function uiMetricStyles(){return `
[data-ui-metric]{--_metric-tone:var(--ui-metric-tone,var(--primary-color,#2196f3));box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:8px;row-gap:2px;align-content:start;align-items:start;min-width:0;padding:12px;border-radius:var(--ui-metric-radius,8px);background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--_metric-tone) 10%,transparent),color-mix(in srgb,var(--_metric-tone) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee);box-shadow:none;color:var(--primary-text-color,#20252b);font:inherit;text-align:start}
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


function uiTabs({id,label,items,selected,className='',panelClassName=''}={}){
 if(typeof id!=='string'||!id||!items?.length||items.some(item=>typeof item.value!=='string'||!item.value)||new Set(items.map(item=>item.value)).size!==items.length)throw Error('Tabs need an id and distinct text values.');
 const active=items.find(item=>item.value===selected&&!item.disabled)??items.find(item=>!item.disabled);
 const tabId=value=>`${id}-tab-${encodeURIComponent(value)}`,panelId=value=>`${id}-panel-${encodeURIComponent(value)}`;
 const bar=`<div${uiAttributes({class:className||null,'data-ui-tabs':'',role:'tablist','aria-label':label})}>${items.map(item=>uiButton({variant:'tab',text:item.label,disabled:item.disabled,attrs:{role:'tab',id:tabId(item.value),'data-ui-tab':item.value,'aria-controls':panelId(item.value),'aria-selected':item===active,tabindex:item===active?0:-1,...item.tabAttrs}})).join('')}</div>`;
 const panels=items.map(item=>`<section${uiAttributes({class:[panelClassName,item.className].filter(Boolean).join(' ')||null,id:panelId(item.value),role:'tabpanel','aria-labelledby':tabId(item.value),'data-ui-tab-panel':item.value,...item.panelAttrs,hidden:item!==active})}>${item.content??''}</section>`).join('');
 return bar+panels;
}
function bindUITabs({tabs,panels,onSelect=()=>{}}){
 const buttons=[...tabs],sections=[...panels],cleanups=[];
 const select=(value,{focus=false,notify=true}={})=>{
  const target=buttons.find(tab=>tab.dataset.uiTab===value&&!tab.disabled);if(!target)return false;
  for(const tab of buttons){const active=tab===target;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  for(const panel of sections)panel.hidden=panel.dataset.uiTabPanel!==value;
  if(focus)target.focus({preventScroll:true});if(notify)onSelect(value,target);return true;
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
function uiTabsStyles(){return `
[data-ui-tabs]{display:flex;align-items:flex-end;gap:8px;border-bottom:1px solid var(--divider-color,#ddd)}
[data-ui-tabs] [role="tab"]{flex:1;justify-content:center;min-width:0;min-height:36px;padding:8px 3px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--secondary-text-color,#666);white-space:nowrap}
[data-ui-tabs] [role="tab"]:hover{background:color-mix(in srgb,var(--primary-text-color,#20252b) 5%,var(--ha-card-background,var(--card-background-color,#fff)));color:var(--primary-text-color,#20252b)}
[data-ui-tabs] [role="tab"][aria-selected="true"]{border-bottom-color:var(--primary-color,#2196f3);color:var(--primary-color,#2196f3);font-weight:600}
[data-ui-tab-panel][hidden]{display:none!important}
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
 }
];
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


const WEATHER_BACKGROUNDS=HEADER_BACKGROUNDS;
const weatherBackgroundStyles=headerBackgroundStyles;


const WEATHER_CONDITIONS = {
 sunny:['Zonnig','Sunny','sun'], 'clear-night':['Heldere nacht','Clear night','night'],
 partlycloudy:['Halfbewolkt','Partly cloudy','partly'], cloudy:['Bewolkt','Cloudy','cloud'],
 rainy:['Regen','Rain','rain'], pouring:['Stortregen','Heavy rain','rain','pouring'],
 lightning:['Onweer','Thunderstorm','storm','lightning'], 'lightning-rainy':['Onweer met regen','Thunderstorm with rain','storm'],
 snowy:['Sneeuw','Snow','snow'], 'snowy-rainy':['Natte sneeuw','Sleet','snow','sleet'],
 fog:['Mist','Fog','fog'], windy:['Winderig','Windy','wind'], 'windy-variant':['Bewolkt en winderig','Cloudy and windy','wind','wind-cloud'],
 hail:['Hagel','Hail','snow','hail'], exceptional:['Uitzonderlijk weer','Exceptional weather','storm','exceptional'],
};
const weatherDutch = hass => String(hass?.locale?.language ?? hass?.language ?? 'en').startsWith('nl');
const WEATHER_METRICS = {
 wind_speed:['Wind','Wind','wind_speed_unit',1],wind_gust_speed:['Windstoten','Wind gusts','wind_speed_unit',1],
 humidity:['Luchtvochtigheid','Humidity','%',0],pressure:['Luchtdruk','Pressure','pressure_unit',0],
 apparent_temperature:['Gevoelstemperatuur','Feels like','temperature_unit',0],dew_point:['Dauwpunt','Dew point','temperature_unit',1],
 visibility:['Zicht','Visibility','visibility_unit',1],cloud_coverage:['Bewolking','Cloud coverage','%',0],
 uv_index:['UV-index','UV index','',1],wind_bearing:['Windrichting','Wind direction','°',0],
};
const WEATHER_FORECAST_FIELDS={
 condition:['Weericoon','Weather icon'],temperature:['Temperatuur','Temperature'],templow:['Minimumtemperatuur (per dag)','Low temperature (daily)'],
 precipitation_probability:['Neerslagkans','Precipitation probability'],precipitation:['Neerslaghoeveelheid','Precipitation amount'],
 wind_speed:['Wind','Wind'],wind_gust_speed:['Windstoten','Wind gusts'],humidity:['Luchtvochtigheid','Humidity'],uv_index:['UV-index','UV index'],
};
function normalizeWeatherConfig(input={}) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid weather configuration');
 if (input.entity && (typeof input.entity !== 'string' || !/^weather\.[a-z0-9_]+$/.test(input.entity))) throw Error('Kies een weather-entiteit / Choose a weather entity');
 const config={...input,type:input.type || 'custom:eleven-weather-card-test',forecast_type:input.forecast_type || 'auto',show_forecast:input.show_forecast !== false,forecast_count:input.forecast_count ?? 6};
 if (!['auto','hourly','daily'].includes(config.forecast_type)) throw Error('Invalid forecast type');
 if (!Number.isInteger(config.forecast_count) || config.forecast_count<3 || config.forecast_count>8) throw Error('Forecast count must be between 3 and 8');
 config.compact=(input.compact??(input.density==='compact'))===true;
 if(input.forecast_fields!=null&&(!Array.isArray(input.forecast_fields)||input.forecast_fields.some(key=>!Object.hasOwn(WEATHER_FORECAST_FIELDS,key))))throw Error('Invalid forecast fields');
 config.forecast_fields=[...new Set(input.forecast_fields??['condition','temperature','templow','precipitation_probability'])];
 for(const type of ['hourly','daily']){
  const key='forecast_'+type+'_fields';
  if(input[key]!=null){
   if(!Array.isArray(input[key])||input[key].some(field=>!Object.hasOwn(WEATHER_FORECAST_FIELDS,field)))throw Error('Invalid '+type+' forecast fields');
   config[key]=[...new Set(input[key])];
  }else delete config[key];
  for(const field of Object.keys(WEATHER_FORECAST_FIELDS).filter(field=>field!=='condition')){
   const precision='forecast_'+type+'_'+field+'_decimals',value=input[precision];
   config[precision]=value==null||value===''?null:Number.isFinite(Number(value))?Math.max(0,Math.min(3,Math.round(Number(value)))):null;
  }
 }
 config.background=input.background||'lanes';
 config.background_strength=input.background_strength==null||!Number.isFinite(Number(input.background_strength))?100:Math.max(0,Math.min(100,Number(input.background_strength)));
 if(!WEATHER_BACKGROUNDS.some(option=>option.value===config.background))throw Error('Invalid weather background');
 config.animate_icons=input.animate_icons!==false;
 // Preserve the old combined animation switch until background motion is configured separately.
 config.animate_background=input.animate_background??config.animate_icons;
 for(const [key,fallback,min,max] of [['icon_scale',100,50,300],['icon_offset_x',0,-150,150],['icon_offset_y',0,-150,150]]){
  const value=input[key];config[key]=value==null||value===''||!Number.isFinite(Number(value))?fallback:Math.max(min,Math.min(max,Number(value)));
 }
 config.icon_style=input.icon_style??'classic';
 if(!['classic','glass','neon'].includes(config.icon_style))throw Error('Invalid weather icon style');
 config.compact_forecast=input.compact_forecast??(input.show_forecast===false?'none':input.forecast_type==='daily'?'daily':'hourly');
 if(!['hourly','daily','none'].includes(config.compact_forecast))throw Error('Invalid compact forecast');
 config.metric_status=input.metric_status??'condition';config.metric_primary=input.metric_primary??'wind_speed';config.metric_secondary=input.metric_secondary??'humidity';
 config.metric_status_icon=typeof input.metric_status_icon==='string'?input.metric_status_icon.trim():'';
 for(const field of ['metric_status','metric_primary','metric_secondary']){
  if(!['none','custom',...(field==='metric_status'?['condition']:[])].includes(config[field])&&!Object.hasOwn(WEATHER_METRICS,config[field]))throw Error('Invalid weather metric');
  for(const suffix of ['entity','attribute','unit','icon'])config[field+'_'+suffix]=typeof input[field+'_'+suffix]==='string'?input[field+'_'+suffix].trim():'';
  config[field+'_label']=typeof input[field+'_label']==='string'?input[field+'_label']:'';
  config[field+'_show_unit']=input[field+'_show_unit']!==false;
  const digits=input[field+'_decimals'];config[field+'_decimals']=digits==null||digits===''?null:Number.isFinite(Number(digits))?Math.max(0,Math.min(6,Math.round(Number(digits)))):null;
 }
 // An explicit tab list controls both densities. Omitted lists retain legacy behavior.
 if(Array.isArray(input.tabs))config.tabs=['hourly','daily'].filter(tab=>input.tabs.includes(tab));
 else delete config.tabs;
 return config;
}
function weatherVisibleTabs(config={}){
 if(Array.isArray(config.tabs))return config.tabs;
 return config.compact?(config.compact_forecast==='none'?[]:[config.compact_forecast??'hourly']):config.show_forecast===false?[]:['hourly','daily'];
}
function weatherField(config,field,attributes,hass,available=true){
 const key=config[field];if(key==='none')return null;
 let metric;
 if(key==='condition'){
  metric={label:weatherDutch(hass)?'Weerstatus':'Weather conditions',value:weatherCondition(available?hass?.states?.[config.entity]?.state:'unknown',weatherDutch(hass)).label};
 }else if(key==='custom'){
  const id=config[field+'_entity'],entity=hass?.states?.[id],attribute=config[field+'_attribute'];
  const valid=entity&&!['unknown','unavailable',''].includes(entity.state);
  const value=valid?(attribute?entity.attributes?.[attribute]:entity.state):null;
  const unit=config[field+'_show_unit']?(config[field+'_unit']||(!attribute?entity?.attributes?.unit_of_measurement:''))||'':'';
  const numeric=value!=null&&typeof value!=='boolean'&&String(value).trim()!==''&&Number.isFinite(Number(value));
  const text=value!=null&&typeof value!=='object'&&!['unknown','unavailable',''].includes(String(value))?String(value):'—';
  metric={label:entity?.attributes?.friendly_name||id||(weatherDutch(hass)?'Eigen gegevens':'Custom data'),value:numeric?weatherNumber(value,hass,unit,config[field+'_decimals']??2):text,entity:id};
 }else{
  metric=weatherMetric(key,attributes,hass,available);if(!metric)return null;
  const value=available?attributes[key]:null,digits=config[field+'_decimals'];
  if(typeof value!=='string'||Number.isFinite(Number(value))){
   const unitKey=WEATHER_METRICS[key][2],sourceUnit=unitKey.endsWith('_unit')?attributes[unitKey]:unitKey;
   metric.value=weatherNumber(value,hass,config[field+'_show_unit']?(config[field+'_unit']||sourceUnit||''):'',digits??WEATHER_METRICS[key][3]);
  }
 }
 metric.label=config[field+'_label']||metric.label;return metric;
}
function weatherMetric(key,attributes,hass,available=true) {
 const definition=WEATHER_METRICS[key];if(!definition)return null;
 const [nl,en,unitKey,digits]=definition,value=available?attributes[key]:null;
 const unit=unitKey.endsWith('_unit')?(attributes[unitKey]??''):unitKey;
 const bearing=key==='wind_bearing'&&typeof value==='string'&&/^(N|NNE|NE|ENE|E|ESE|SE|SSE|S|SSW|SW|WSW|W|WNW|NW|NNW)$/i.test(value);
 return {label:weatherDutch(hass)?nl:en,value:bearing?value.toUpperCase():weatherNumber(value,hass,unit,digits)};
}
function weatherNumber(value,hass,unit='',digits=0) {
 if (value == null || typeof value === 'boolean' || String(value).trim()==='' || !Number.isFinite(Number(value))) return '—';
 const language=hass?.locale?.language ?? hass?.language ?? 'en';
 let text;
 try { text=new Intl.NumberFormat(language,{maximumFractionDigits:digits}).format(Number(value)); }
 catch { text=String(Number(value)); }
 return text + (unit ? (unit.startsWith('°') ? '' : ' ') + unit : '');
}
function weatherCondition(state,dutch) {
 const data=WEATHER_CONDITIONS[state];
 return {label:data?.[dutch?0:1] ?? (dutch?'Weer niet beschikbaar':'Weather unavailable'),kind:data?.[2] ?? 'unknown',iconKind:data?.[3]??data?.[2]??'unknown'};
}
function weatherForecastType(config,entity) {
 if(Array.isArray(config.tabs)){
  const flags=Number(entity?.attributes?.supported_features)||0;
  const preferred=config.forecast_type==='auto'?(flags&2?'hourly':flags&1?'daily':'hourly'):config.forecast_type;
  return config.tabs.includes(preferred)?preferred:(config.tabs[0]??preferred);
 }
 if(config.compact)return config.compact_forecast==='daily'?'daily':'hourly';
 if (config.forecast_type !== 'auto') return config.forecast_type;
 const flags=Number(entity?.attributes?.supported_features) || 0;
 return flags & 2 ? 'hourly' : flags & 1 ? 'daily' : 'hourly';
}
function weatherForecastFields(config,type){return config['forecast_'+type+'_fields']??config.forecast_fields??['condition','temperature','templow','precipitation_probability'];}
function weatherDayKey(value,hass){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:hass?.config?.time_zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(type=>parts.find(part=>part.type===type)?.value).join('');
 }catch{return date.toISOString().slice(0,10).replaceAll('-','');}
}
function weatherForecastRows(rows,count,now=Date.now(),type='hourly',hass) {
 if (!Array.isArray(rows)) return [];
 const today=type==='daily'?weatherDayKey(now,hass):null;
 return rows.filter(row=>row && Number.isFinite(Date.parse(row.datetime)) && (type==='daily'?weatherDayKey(row.datetime,hass)>=today:Date.parse(row.datetime)>now-3600000))
  .sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime)).slice(0,count);
}
function weatherDate(value,hass,type) {
 const options=type==='hourly'?{hour:'2-digit',minute:'2-digit'}:{weekday:'short'};
 try { return new Intl.DateTimeFormat(hass?.locale?.language ?? hass?.language ?? 'en',{...options,timeZone:hass?.config?.time_zone}).format(new Date(value)); }
 catch { return '—'; }
}

// Liquid glass and Neon: complete icon families for HA weather conditions.
let weatherStyledArtId=0;
function weatherStyledArt(requestedKind,style,idPrefix='wx-styled'){
 const kinds=['sun','night','partly','cloud','rain','pouring','lightning','storm','snow','sleet','hail','fog','wind','wind-cloud','exceptional'];
 const kind=kinds.includes(requestedKind)?requestedKind:'unknown';
 const id=idPrefix+'-'+(++weatherStyledArtId),paint=name=>`url(#${id}-${name})`;
 const sun=`<g class="wxi-sun"><g class="wxi-rays" stroke="#ffd37b" stroke-width="3" stroke-linecap="round">${Array.from({length:12},(_,i)=>`<path transform="rotate(${i*30} 80 60)" d="M80 18v-7"/>`).join('')}</g><circle class="wxi-core" cx="80" cy="60" r="29" fill="${paint('sun')}" stroke="#ffe5ae"/><path class="wxi-highlight" d="M59 57a22 22 0 0 1 28-18" stroke="#fff7d4" stroke-width="3.5" stroke-linecap="round"/></g>`;
 const cloud=`<g class="wxi-cloud-layer"><path class="wxi-cloud" d="M39 109C10 107 15 68 43 68C43 28 100 22 113 63C146 59 152 106 121 109Z" fill="${paint('cloud')}" stroke="#e1f2ff" stroke-width="1.6"/><path class="wxi-highlight" d="M50 66C53 41 91 39 101 60" stroke="#ffffffbe" stroke-width="3" stroke-linecap="round"/><path class="wxi-shadow" d="M33 95c20 10 63 12 95 0" stroke="#43689430" stroke-width="5"/></g>`;
 const moon=`<g class="wxi-moon"><path class="wxi-core" d="M108 91C70 108 42 62 68 29C19 42 25 110 72 114C88 116 101 106 108 91Z" fill="${paint('moon')}" stroke="#e7e8ff" stroke-width="1.5"/><path class="wxi-highlight" d="M48 55C40 80 58 99 74 101" stroke="#fff9" stroke-width="3" stroke-linecap="round"/></g><g class="wxi-stars" fill="#e5dfff"><path d="m113 27 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><circle cx="130" cy="73" r="2.3"/><circle cx="88" cy="15" r="1.7"/></g>`;
 const rain=(heavy=false)=>`<g class="wxi-rain${heavy?' wxi-heavy':''}" stroke="#7bcaff" stroke-width="${heavy?5:4}" stroke-linecap="round">${(heavy?[38,59,80,101,122]:[49,80,111]).map((x,i)=>`<path class="wxi-drop" style="--wxi-delay:${-i*.4}s" d="m${x} 117-5 11"/>`).join('')}</g>`;
 const snow=`<g class="wxi-snow" stroke="#cfecff" stroke-width="2" stroke-linecap="round">${[49,80,111].map((x,i)=>`<path class="wxi-flake" style="--wxi-delay:${-i*1.2}s" d="M${x} 117v14m-7-7h14m-12-5 10 10m-10 0 10-10"/>`).join('')}</g>`;
 const hail='<g class="wxi-hail" fill="#d2ecff" stroke="#ecf7ff" stroke-width="1.5"><circle class="wxi-pellet" cx="48" cy="122" r="4"/><circle class="wxi-pellet" cx="80" cy="129" r="4"/><circle class="wxi-pellet" cx="112" cy="120" r="4"/></g>';
 const bolt=`<path class="wxi-bolt" d="m89 94-24 28h17l-8 20 29-32H87l9-16Z" fill="${paint('sun')}" stroke="#ffe9ae"/>`;
 const wind='<g class="wxi-wind" stroke="#9ad8ed" stroke-width="4" stroke-linecap="round"><path d="M24 56h76c25 0 25-25 7-25"/><path d="M18 78h106c24 0 24 25 5 25"/><path d="M38 101h45c21 0 21 23 4 23"/></g>';
 const fog='<g class="wxi-fog" stroke="#b6cadc" stroke-width="4" stroke-linecap="round"><path d="M26 108h108m-94 13h80m-66 13h64"/></g>';
 const warning=`<g class="wxi-warning"><path d="M73 28a8 8 0 0 1 14 0l49 86a8 8 0 0 1-7 12H31a8 8 0 0 1-7-12Z" fill="${paint('sun')}" fill-opacity=".3" stroke="#ffd37b" stroke-width="3"/><path d="M80 58v34m0 13v3" stroke="#ffe4a7" stroke-width="5" stroke-linecap="round"/></g>`;
 const unknown='<g class="wxi-unknown" stroke="currentColor"><circle cx="80" cy="75" r="42" stroke-width="2" stroke-dasharray="4 7"/><path d="M67 64c0-20 27-20 27-2 0 12-14 10-14 24m0 12v2" stroke-width="4" stroke-linecap="round"/></g>';
 const bodies={sun,night:moon,partly:`<g transform="translate(10 -5) scale(.85)">${sun}</g>`+cloud,cloud,rain:cloud+rain(),pouring:cloud+rain(true),lightning:cloud+bolt,storm:cloud+rain()+bolt,snow:cloud+snow,sleet:cloud+`<g class="wxi-sleet">${snow}${rain()}</g>`,hail:cloud+hail,fog:`<g transform="translate(15 0) scale(.82)">${cloud}</g>`+fog,wind,'wind-cloud':`<g transform="translate(21 -8) scale(.72)">${cloud}</g><g transform="translate(0 47) scale(1 .7)">${wind}</g>`,exceptional:warning,unknown};
 const accent=kind==='unknown'?'#9da5b4':kind==='night'?'#b3a6ff':['rain','pouring'].includes(kind)?'#73c3ff':['snow','sleet','hail'].includes(kind)?'#a7e2ff':['lightning','storm'].includes(kind)?'#b1a0ff':['cloud','fog','wind','wind-cloud'].includes(kind)?'#98c5df':'#ffc760';
 return `<svg class="weather-icon wxi-icon wxi-${style==='neon'?'neon':'glass'}" data-icon-kind="${kind}" style="--wxi-accent:${accent}" viewBox="0 0 160 150" fill="none" aria-hidden="true" focusable="false"><defs><radialGradient id="${id}-sun" cx=".3" cy=".2" r=".95"><stop stop-color="#fff5cb"/><stop offset=".45" stop-color="#ffd36f"/><stop offset="1" stop-color="#e58d30"/></radialGradient><linearGradient id="${id}-cloud" x2=".15" y2="1"><stop stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#d1e9ff" stop-opacity=".8"/><stop offset="1" stop-color="#668bab" stop-opacity=".7"/></linearGradient><linearGradient id="${id}-moon" x2=".6" y2="1"><stop stop-color="#f5edff"/><stop offset="1" stop-color="#8d8ad8"/></linearGradient><radialGradient id="${id}-halo"><stop stop-color="${accent}" stop-opacity=".6"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><circle class="wxi-halo" cx="80" cy="73" r="66" fill="${paint('halo')}"/><g class="wxi-body">${bodies[kind]}</g><path class="wxi-glint" d="m118 49 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#fff"/></svg>`;
}
const weatherStyledIconStyles=`
.content:is([data-icon-style=glass],[data-icon-style=neon]) .hero{min-height:210px}.content:is([data-icon-style=glass],[data-icon-style=neon]) .art{inset:40px 0 0}.content:is([data-icon-style=glass],[data-icon-style=neon]) .art svg{width:210px;height:168px}
@container(max-width:320px){.content:is([data-icon-style=glass],[data-icon-style=neon]) .hero{min-height:190px}.content:is([data-icon-style=glass],[data-icon-style=neon]) .art svg{width:180px;height:150px}}
.content[data-compact=true]:is([data-icon-style=glass],[data-icon-style=neon]) .hero{min-height:132px}.content[data-compact=true]:is([data-icon-style=glass],[data-icon-style=neon]) .art{inset:38px 0 0}.content[data-compact=true]:is([data-icon-style=glass],[data-icon-style=neon]) .art svg{width:120px;height:94px}
.content[data-dark=false] .wxi-icon{--wxi-stroke:#946500}.content[data-dark=false] .wxi-icon:is([data-icon-kind=cloud],[data-icon-kind=fog],[data-icon-kind=wind],[data-icon-kind=wind-cloud]){--wxi-stroke:#416c88}.content[data-dark=false] .wxi-icon:is([data-icon-kind=rain],[data-icon-kind=pouring],[data-icon-kind=snow],[data-icon-kind=sleet],[data-icon-kind=hail]){--wxi-stroke:#24799e}.content[data-dark=false] .wxi-icon:is([data-icon-kind=night],[data-icon-kind=lightning],[data-icon-kind=storm]){--wxi-stroke:#6e55ac}
.wxi-icon{overflow:visible;color:var(--secondary-text-color,#9da5b4)}.wxi-glint{display:none}.wxi-rays{transform-origin:80px 60px;animation:wxi-spin 30s linear infinite}.wxi-cloud-layer{animation:wxi-float 6s ease-in-out infinite}.wxi-moon{animation:wxi-float 8s ease-in-out infinite}.wxi-stars{animation:wxi-twinkle 4s ease-in-out infinite alternate}.wxi-drop{animation:wxi-rain 1.6s linear infinite;animation-delay:var(--wxi-delay,0s)}.wxi-heavy .wxi-drop{animation-duration:1.05s}.wxi-bolt{animation:wxi-light 5s ease-in-out infinite}.wxi-flake{animation:wxi-snow 4s linear infinite;animation-delay:var(--wxi-delay,0s)}.wxi-pellet{animation:wxi-hail 2s ease-in infinite}.wxi-pellet:nth-child(2){animation-delay:-.7s}.wxi-pellet:nth-child(3){animation-delay:-1.3s}.wxi-fog{animation:wxi-fog 7s ease-in-out infinite}.wxi-wind{stroke-dasharray:85 160;animation:wxi-wind 4s linear infinite}
.wxi-sleet .wxi-flake:nth-child(2),.wxi-sleet .wxi-drop:first-child,.wxi-sleet .wxi-drop:last-child{display:none}
.wxi-glass .wxi-body{filter:drop-shadow(0 8px 5px #07162540)}.wxi-glass .wxi-glint{display:block;transform-origin:118px 58px;animation:wxi-glint 4s ease-in-out infinite}.wxi-glass .wxi-halo{opacity:.25}.wxi-glass .wxi-cloud{stroke-width:2.2}
.wxi-neon .wxi-core,.wxi-neon .wxi-cloud{fill:transparent;stroke:var(--wxi-stroke,var(--wxi-accent));stroke-width:2.3;stroke-dasharray:180 24;animation:wxi-trace 9s linear infinite}.wxi-neon .wxi-body{filter:drop-shadow(0 0 4px var(--wxi-stroke,var(--wxi-accent)))}.wxi-neon .wxi-highlight{opacity:.25}.wxi-neon .wxi-shadow{display:none}.wxi-neon .wxi-halo{opacity:.18}.wxi-neon .wxi-rays{stroke:var(--wxi-stroke,var(--wxi-accent));stroke-width:2}.wxi-neon .wxi-rain,.wxi-neon .wxi-snow,.wxi-neon .wxi-wind,.wxi-neon .wxi-fog{stroke:var(--wxi-stroke,var(--wxi-accent))}.wxi-neon .wxi-warning path:first-child,.wxi-neon .wxi-pellet{fill:transparent}
.wxi-icon:is([data-icon-kind=unknown],[data-icon-kind=exceptional]) .wxi-glint{display:none}
@keyframes wxi-spin{to{transform:rotate(360deg)}}@keyframes wxi-float{50%{transform:translate(3px,-4px)}}@keyframes wxi-twinkle{to{opacity:.3}}@keyframes wxi-rain{0%{transform:translate(2px,-4px);opacity:0}20%,70%{opacity:1}100%{transform:translate(-4px,12px);opacity:0}}@keyframes wxi-light{0%,100%{opacity:.4}60%{opacity:1}}@keyframes wxi-glint{0%,70%,100%{opacity:.2;transform:scale(.55)}35%{opacity:.95;transform:scale(1.15)}}@keyframes wxi-trace{to{stroke-dashoffset:-204}}@keyframes wxi-snow{0%{transform:translate(-2px,-4px);opacity:0}20%,70%{opacity:1}100%{transform:translate(3px,8px);opacity:0}}@keyframes wxi-hail{0%,100%{transform:translateY(-4px);opacity:.3}65%{transform:translateY(8px);opacity:1}80%{transform:translateY(3px)}}@keyframes wxi-fog{50%{transform:translateX(5px);opacity:.55}}@keyframes wxi-wind{to{stroke-dashoffset:-245}}
.content[data-animated=false] .wxi-icon *{animation:none!important}
@media(prefers-reduced-motion:reduce){.wxi-icon *{animation:none!important}}
`;

﻿// Layered vector illustrations with CSS motion; unique paint IDs per instance.

let weatherArtId=0;
function weatherArt(kind,style='classic',iconKind=kind) {
 if(style==='glass'||style==='neon')return weatherStyledArt(iconKind,style);
 const id=`wx-${++weatherArtId}`,paint=name=>`url(#${id}-${name})`;
 const sun=`<g class="wx-sun"><circle class="wx-corona" cx="70" cy="55" r="32" fill="${paint('glow')}"/><g class="wx-rays" stroke="#f8cd70" stroke-width="3.5" stroke-linecap="round"><path d="M70 14v-6m0 94v-6M29 55h-6m94 0h-6M41 26l-5-5m68 68-5-5M41 84l-5 5m68-68-5 5"/></g><circle cx="70" cy="55" r="25" fill="${paint('sun')}" stroke="#ffe5a3" stroke-width="1.5"/><path d="M51 53a20 20 0 0 1 25-17" stroke="#fff6d6" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>`;
 const cloud=`<g class="wx-cloud"><path d="M43 101a23 23 0 0 1 1-46 32 32 0 0 1 60-10 27 27 0 0 1 8 54H43z" fill="${paint('cloud')}" stroke="#ecf5ff" stroke-opacity=".65" stroke-width="1.5"/><path d="M47 62a26 26 0 0 1 49-11" stroke="#fff" stroke-opacity=".8" stroke-width="2.5" stroke-linecap="round"/><path d="M29 87c21 10 59 14 91 0" stroke="#65829f" stroke-opacity=".16" stroke-width="4" stroke-linecap="round"/></g>`;
 const rain='<g class="wx-rain" stroke="#8dcfff" stroke-width="5" stroke-linecap="round"><path class="wx-drop wx-drop-one" d="m54 109-6 12"/><path class="wx-drop wx-drop-two" d="m80 109-6 12"/><path class="wx-drop wx-drop-three" d="m106 109-6 12"/></g>';
 const snow='<g class="wx-snow" fill="#e0f7ff" stroke="#d0efff" stroke-width="1.5"><path class="wx-flake wx-drop-one" d="M52 108v12m-6-6h12m-10-4 8 8m-8 0 8-8"/><path class="wx-flake wx-drop-two" d="M80 116v12m-6-6h12m-10-4 8 8m-8 0 8-8"/><path class="wx-flake wx-drop-three" d="M108 106v12m-6-6h12m-10-4 8 8m-8 0 8-8"/></g>';
 const night=`<g class="wx-moon"><path d="M102 91a39 39 0 0 1-38-64 40 40 0 1 0 38 64" fill="${paint('moon')}" stroke="#dce4ff" stroke-width="1.5"/><path d="M43 49a33 33 0 0 0 7 40" stroke="#f5f4ff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/></g><g fill="#e6e6ff"><path class="wx-star wx-star-one" d="m114 24 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path class="wx-star wx-star-two" d="m128 64 1.5 4.5L134 70l-4.5 1.5L128 76l-1.5-4.5L122 70l4.5-1.5z"/><circle class="wx-star wx-star-three" cx="93" cy="17" r="2"/></g>`;
 const wind=`<g class="wx-wind" fill="none" stroke="${paint('wind')}" stroke-width="5" stroke-linecap="round"><path d="M25 54h70c23 0 23-27 5-27"/><path d="M19 76h106c22 0 22 27 4 27"/><path d="M39 99h43c20 0 20 26 2 26"/></g>`;
 const fog='<g class="wx-fog" stroke="#c6dbe9" stroke-width="5" stroke-linecap="round"><path d="M30 110h100"/><path d="M43 122h74"/><path d="M52 134h63"/></g>';
 const lightning=`<path class="wx-lightning" d="m84 94-20 27h15l-6 20 27-31H84l8-16z" fill="${paint('sun')}" stroke="#ffe9b1" stroke-width="1"/>`;
 const unknown='<circle cx="80" cy="70" r="34" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 8"/><path d="M70 58c0-16 25-16 25 0 0 11-15 9-15 20m0 10v3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>';
 const body=kind==='sun'?sun:kind==='night'?night:kind==='wind'?wind:kind==='unknown'?unknown:(kind==='partly'?sun:'')+cloud+(kind==='rain'?rain:kind==='snow'?snow:kind==='storm'?rain+lightning:kind==='fog'?fog:'');
 return `<svg class="weather-icon" viewBox="0 0 160 150" fill="none" aria-hidden="true" focusable="false"><defs><radialGradient id="${id}-glow"><stop stop-color="#ffd775" stop-opacity=".3"/><stop offset="1" stop-color="#ffd775" stop-opacity="0"/></radialGradient><linearGradient id="${id}-sun" x2=".3" y2="1"><stop stop-color="#fff0b4"/><stop offset=".5" stop-color="#f6ce6d"/><stop offset="1" stop-color="#eda743"/></linearGradient><linearGradient id="${id}-cloud" x2=".2" y2="1"><stop stop-color="#f8fbff"/><stop offset=".5" stop-color="#c8d9ea"/><stop offset="1" stop-color="#91aac2"/></linearGradient><linearGradient id="${id}-moon" x2=".6" y2="1"><stop stop-color="#f0edff"/><stop offset="1" stop-color="#9aadee"/></linearGradient><linearGradient id="${id}-wind"><stop stop-color="#88b1cb" stop-opacity=".6"/><stop offset="1" stop-color="#d4efff"/></linearGradient></defs>${body}</svg>`;
}


const weatherAtmosphere=headerAtmosphere;
// Background selection never changes the header or illustration dimensions.
const weatherAtmosphereStyles=headerAtmosphereStyles;





const weatherStyles=`
:host{display:block;min-width:0;container-type:inline-size;font:inherit}
*{box-sizing:border-box}ha-card{display:block;overflow:hidden;border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#20252b);font:inherit}
.content{position:relative;isolation:isolate;padding:var(--eleven-card-padding,16px);--tone:#536b82}.content[data-dark=true]{--tone:#a8c9eb}
.content[data-kind=sun],.content[data-kind=partly]{--tone:#946800}.content[data-dark=true]:is([data-kind=sun],[data-kind=partly]){--tone:#f2c451}
.content[data-kind=rain]{--tone:#427fac}.content[data-dark=true][data-kind=rain]{--tone:#82b8e8}
.content[data-kind=night],.content[data-kind=storm]{--tone:#6553a3}.content[data-dark=true]:is([data-kind=night],[data-kind=storm]){--tone:#aca3f1}
.content[data-kind=snow]{--tone:#45858c}.content[data-dark=true][data-kind=snow]{--tone:#a2dce6}
.scene{position:relative;isolation:isolate;margin:-16px -16px 0;padding:16px 16px 16px;overflow:visible}
.hero{min-height:160px;position:relative;display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;align-content:start;padding-top:6px}
.temperature{font-size:76px;font-weight:500;line-height:1.15;letter-spacing:-.065em;font-variant-numeric:tabular-nums;margin-top:-20px}.temperature .unit{font-size:.53em;letter-spacing:-.03em;margin-left:2px}
header{text-align:right;min-width:0;padding-top:17px;margin-top:-20px;z-index:1}h2{font-size:18px;font-weight:650;line-height:1.25;margin:0;color:color-mix(in srgb,var(--tone) 88%,#fff);overflow-wrap:anywhere}.feels{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin-top:2px}.feels strong{font-weight:600;color:var(--primary-text-color)}
.art{position:absolute;inset:46px 0 0;display:grid;place-items:center;pointer-events:none;color:var(--secondary-text-color)}.art svg{height:116px;width:150px;filter:drop-shadow(0 8px 14px color-mix(in srgb,var(--tone) 25%,transparent))}
button{font:inherit;color:inherit;cursor:pointer}.status,.metric{background:var(--secondary-background-color,#eee);border-radius:7px;padding:12px}.status{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:0;min-height:0;margin:16px 0 0}.status-icon{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:10px;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent)}.status-icon svg{width:30px;height:30px}.status strong{font-size:13px;line-height:1.4;font-weight:600}.status small{display:block;font-size:11px;color:var(--secondary-text-color,#666);margin-top:2px}
.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:0}.metrics:has(.metric:only-child){grid-template-columns:minmax(0,1fr)}.metric{min-width:0;display:grid;grid-template-rows:auto auto;gap:2px;align-content:start}.metric dt{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);margin:0;overflow-wrap:anywhere}.metric dd{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:0;overflow-wrap:anywhere}
.forecast{margin-top:16px}.forecast h3{font-size:11px;font-weight:400;line-height:1.4;color:var(--secondary-text-color,#666);margin:0 0 10px}.forecast-list{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(46px,1fr);gap:6px;overflow-x:auto;scrollbar-width:thin;padding:0 0 3px;list-style:none;margin:0}.forecast-list li{text-align:center;min-width:0}.forecast-list time{font-size:11px;color:var(--secondary-text-color,#666)}.forecast-list svg{display:block;width:38px;height:36px;margin:4px auto}.forecast-value{font-size:18px;line-height:1.35;font-weight:600;letter-spacing:-.02em;white-space:nowrap;font-variant-numeric:tabular-nums}.forecast-low,.rain-chance{font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666);min-height:16px;margin-top:3px}.rain-chance{color:var(--tone)}
.notice{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#666);margin:10px 0}.retry{background:transparent;color:var(--primary-color,#2196f3);border:0;min-height:32px;padding:4px 0}.status:focus-visible,.retry:focus-visible,.forecast-list:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}.status:hover{filter:brightness(1.05)}
@container(max-width:320px){.hero{min-height:150px}.temperature{font-size:65px;margin-top:-17px}header{margin-top:-17px;padding-top:14px}.art svg{height:100px}.forecast-list{grid-auto-columns:minmax(46px,1fr)}}
@supports(grid-template-rows:subgrid){.metrics{grid-template-rows:auto auto;row-gap:2px}.metric{grid-row:span 2;grid-template-rows:subgrid}}
.forecast-panel{padding-top:16px}.forecast-panel[hidden]{display:none!important}
.metric-entity{font:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;text-align:start;max-width:100%;overflow-wrap:anywhere}.metric-entity:hover{color:var(--primary-color)}.metric-entity:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px;border-radius:3px}
.status>span:last-child{min-width:0;overflow-wrap:anywhere}.status-label{display:block;font-size:11px;line-height:1.4;color:var(--secondary-text-color);margin-bottom:2px}.status-data strong{font-size:24px;line-height:1.25;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.status-icon ha-icon{--mdc-icon-size:22px}
.content[data-compact=true] .hero{min-height:112px}
.content[data-compact=true] .temperature{font-size:64px;margin-top:-16px}
.content[data-compact=true] header{padding-top:14px;margin-top:-16px}
.content[data-compact=true] .art{inset:38px 0 0}
.content[data-compact=true] .art svg{height:74px;width:100px;filter:drop-shadow(0 5px 10px color-mix(in srgb,var(--tone) 20%,transparent))}
.content[data-compact=true] .scene{padding-bottom:12px}
.content:not(:has(.weather-metrics)) .scene{padding-bottom:0}
.content[data-compact=true] .status{padding:10px;gap:10px;margin-top:12px}
.content[data-compact=true] .status-data strong{font-size:22px}
.content[data-compact=true] .status-icon{width:32px;height:32px;border-radius:8px}
.content[data-compact=true] .status-icon svg{width:26px;height:26px}
.content[data-compact=true] .metrics{column-gap:12px}
.content[data-compact=true] .metric{padding:10px}
.content[data-compact=true] .metric dd{font-size:22px}
.content[data-compact=true] .forecast{margin-top:12px}
.content[data-compact=true] .forecast-panel{padding-top:12px}
.content[data-compact=true] .forecast-list svg{width:32px;height:30px;margin:2px auto}
@container(max-width:320px){.content[data-compact=true] .hero{min-height:104px}.content[data-compact=true] .art svg{height:66px}.content[data-compact=true] .temperature{font-size:56px;margin-top:-14px}.content[data-compact=true] header{margin-top:-14px;padding-top:12px}}
.forecast-extra{font-size:11px;line-height:1.4;margin-top:5px;color:var(--primary-text-color)}.forecast-label{display:block;overflow-wrap:anywhere;font-size:10px;color:var(--secondary-text-color)}
${weatherBackgroundStyles}

.wx-rays{transform-origin:70px 55px}.wx-corona{transform-origin:70px 55px}
@media(prefers-reduced-motion:no-preference){
 .content[data-animated=true] .wx-rays{animation:wx-rotate 24s linear infinite}
 .content[data-animated=true] .wx-corona{animation:wx-glow 5s ease-in-out infinite}
 .content[data-animated=true] .wx-cloud{animation:wx-float 6s ease-in-out infinite}
 .content[data-animated=true] .wx-drop{animation:wx-rain 1.5s linear infinite}
 .content[data-animated=true] .wx-flake{animation:wx-snow 4s ease-in-out infinite}
 .content[data-animated=true] .wx-drop-two{animation-delay:-.5s}
 .content[data-animated=true] .wx-drop-three{animation-delay:-1s}
 .content[data-animated=true] .wx-moon{animation:wx-float 7s ease-in-out infinite}
 .content[data-animated=true] .wx-star{animation:wx-twinkle 4s ease-in-out infinite}
 .content[data-animated=true] .wx-star-two{animation-delay:-1.5s}
 .content[data-animated=true] .wx-star-three{animation-delay:-2.5s}
 .content[data-animated=true] .wx-wind path{stroke-dasharray:90 160;animation:wx-wind 4s linear infinite}
 .content[data-animated=true] .wx-wind path:nth-child(2){animation-delay:-1.2s}
 .content[data-animated=true] .wx-wind path:nth-child(3){animation-delay:-2.4s}
 .content[data-animated=true] .wx-fog{animation:wx-fog 7s ease-in-out infinite}
 .content[data-animated=true] .wx-lightning{animation:wx-lightning 5s ease-in-out infinite}
}
@keyframes wx-rotate{to{transform:rotate(360deg)}}
@keyframes wx-glow{50%{transform:scale(1.12);opacity:.6}}
@keyframes wx-float{50%{transform:translate(3px,-2px)}}
@keyframes wx-rain{0%{transform:translate(2px,-3px);opacity:0}15%,75%{opacity:1}100%{transform:translate(-4px,12px);opacity:0}}
@keyframes wx-snow{0%{transform:translate(-2px,-2px);opacity:0}20%,70%{opacity:1}100%{transform:translate(4px,9px);opacity:0}}
@keyframes wx-twinkle{50%{opacity:.35}}
@keyframes wx-wind{to{stroke-dashoffset:-250}}
@keyframes wx-fog{50%{transform:translateX(5px);opacity:.55}}
@keyframes wx-lightning{0%,50%,100%{opacity:.4}70%,80%{opacity:1}}
${weatherAtmosphereStyles}
${weatherStyledIconStyles}
${headerSceneStyles}
`;

// Retain live nodes, focus, scroll offsets and running SVG animations on telemetry updates.
function patchWeatherDOM(root,markup){
 const template=document.createElement('template');template.innerHTML=markup;
 const key=node=>node.nodeType===1?node.localName+'|'+(node.getAttribute('data-weather-key')??node.getAttribute('data-ui-tab')??node.getAttribute('data-ui-tab-panel')??node.getAttribute('data-forecast-field')??node.getAttribute('class')?.split(' ')[0]??''):String(node.nodeType);
 const patch=(parent,incoming)=>{
  let cursor=parent.firstChild;
  for(const next of [...incoming.childNodes]){
   let current=cursor;
   if(!current||key(current)!==key(next)){
    current=cursor?.nextSibling;
    while(current&&key(current)!==key(next))current=current.nextSibling;
    if(current)parent.insertBefore(current,cursor);else{current=next.cloneNode(true);parent.insertBefore(current,cursor);}
   }
   if(!current.isEqualNode(next)){
    if(current.nodeType===3)current.nodeValue=next.nodeValue;
    else if(current.nodeType===1){
     for(const attribute of [...current.attributes])if(!next.hasAttribute(attribute.name))current.removeAttribute(attribute.name);
     for(const attribute of [...next.attributes])if(current.getAttribute(attribute.name)!==attribute.value)current.setAttribute(attribute.name,attribute.value);
     patch(current,next);
    }
   }
   cursor=current.nextSibling;
  }
  while(cursor){const next=cursor.nextSibling;parent.removeChild(cursor);cursor=next;}
 };
 patch(root,template.content);
}



const weatherEditorLabels={entity:['Weerentiteit','Weather entity'],title:['Kaartnaam (toegankelijkheid)','Card name (accessibility)'],background_strength:['Achtergrondsterkte','Background intensity'],background:['Achtergrond','Background'],animate_icons:['Weericonen animeren','Animate weather icons'],compact:['Compacte weergave','Compact layout'],tabs:['Zichtbare tabbladen','Visible tabs'],forecast_type:['Standaardtabblad','Default tab'],forecast_count:['Aantal voorspellingen','Forecast count']};
weatherEditorLabels.metric_status_icon=['Icoon (optioneel)','Icon (optional)'];
weatherEditorLabels.icon_scale=['Grootte weericoon','Weather icon size'];
weatherEditorLabels.icon_offset_x=['Horizontale positie weericoon','Weather icon horizontal position'];
weatherEditorLabels.icon_offset_y=['Verticale positie weericoon','Weather icon vertical position'];
weatherEditorLabels.icon_style=['Icoonstijl','Icon style'];
weatherEditorLabels.forecast_fields=['Velden in weersverwachting','Forecast fields'];
weatherEditorLabels.animate_background=['Achtergrond animeren','Animate background'];
for(const type of ['hourly','daily']){
 weatherEditorLabels['forecast_'+type+'_fields']=['Zichtbare velden','Visible fields'];
 for(const [field,labels] of Object.entries(WEATHER_FORECAST_FIELDS))if(field!=='condition')weatherEditorLabels['forecast_'+type+'_'+field+'_decimals']=[labels[0]+' · decimalen',labels[1]+' · decimals'];
}
for(const field of ['metric_status','metric_primary','metric_secondary'])for(const [suffix,labels] of Object.entries({
 icon:['Icoon (optioneel)','Icon (optional)'],source:['Gegevensbron','Data source'],entity:['Entiteit','Entity'],label:['Label (optioneel)','Label (optional)'],attribute:['Attribuut (optioneel)','Attribute (optional)'],unit:['Eigen eenheid (optioneel)','Custom unit (optional)'],show_unit:['Eenheid tonen','Show unit'],decimals:['Decimalen (optioneel)','Decimal places (optional)'],
}))weatherEditorLabels[suffix==='source'?field:field+'_'+suffix]=labels;

class WeatherEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(config){this._config=normalizeWeatherConfig(config);this._render();}
 set hass(hass){this._hass=hass;this._render();}get hass(){return this._hass;}
 _schema(nl){
  const config=this._config,text=name=>({name,selector:{text:{}}}),boolean=name=>({name,selector:{boolean:{}}});
  const select=(name,options,multiple=false)=>({name,selector:{select:{mode:multiple?'list':'dropdown',multiple,options}}});
  const number=(name,min,max)=>({name,selector:{number:{min,max,step:1,mode:'box'}}});
  const slider=(name,min,max,step,unit)=>({name,selector:{number:{min,max,step,mode:'slider',unit_of_measurement:unit}}});
  const group=(name,title,schema,expanded=false)=>({type:'expandable',name,title,flatten:true,expanded,schema});
  const metrics=[{value:'none',label:nl?'Niet tonen':'Hide'},{value:'custom',label:nl?'Eigen entiteit':'Custom entity'},...Object.entries(WEATHER_METRICS).map(([value,labels])=>({value,label:labels[nl?0:1]}))];
  const schema=[group('general',nl?'Algemeen':'General',[text('title'),{name:'entity',required:true,selector:{entity:{domain:'weather'}}}],true),
   group('weather_icon',nl?'Weericoon':'Weather icon',[slider('icon_scale',50,300,5,'%'),slider('icon_offset_x',-150,150,1,'px'),slider('icon_offset_y',-150,150,1,'px')]),
   group('appearance',nl?'Weergave':'Appearance',[boolean('compact'),select('background',WEATHER_BACKGROUNDS),{name:'background_strength',selector:{number:{min:0,max:100,step:5,mode:'slider',unit_of_measurement:'%'}}},select('icon_style',[{value:'classic',label:nl?'Klassiek':'Classic'},{value:'glass',label:'Liquid glass'},{value:'neon',label:'Neon'}]),boolean('animate_background'),boolean('animate_icons')])];
  for(const [field,title] of [['metric_status',nl?'Breed gegevensveld':'Wide data field'],['metric_primary',nl?'Gegevensveld links':'Left data field'],['metric_secondary',nl?'Gegevensveld rechts':'Right data field']]){
   const fields=[select(field,field==='metric_status'?[...metrics.slice(0,2),{value:'condition',label:nl?'Weerstatus':'Weather conditions'},...metrics.slice(2)]:metrics)];
   if(config[field]!=='none')fields.push(...(config[field]==='custom'?[{name:field+'_entity',selector:{entity:{}}},text(field+'_attribute')]:[]),text(field+'_label'),boolean(field+'_show_unit'),...(config[field+'_show_unit']?[text(field+'_unit')]:[]),number(field+'_decimals',0,6));
   if(config[field]!=='none')fields.push({name:field+'_icon',selector:{icon:{}}});
   schema.push(group(field+'_settings',title,fields));
  }
  const choices=[{value:'hourly',label:nl?'Per uur':'Hourly'},{value:'daily',label:nl?'Per dag':'Daily'}],visible=weatherVisibleTabs(config);
  schema.push(group('tab_settings',nl?'Weersverwachting':'Forecast',[select('tabs',choices,true),...(visible.length?[...(visible.length>1?[select('forecast_type',[{value:'auto',label:nl?'Automatisch':'Automatic'},...choices.filter(choice=>visible.includes(choice.value))])]:[]),number('forecast_count',3,8)]:[])],true));
  for(const type of visible){
   const fields=weatherForecastFields(config,type),options=Object.entries(WEATHER_FORECAST_FIELDS).filter(([field])=>type==='daily'||field!=='templow').map(([value,labels])=>({value,label:labels[nl?0:1]}));
   schema.push(group('forecast_'+type+'_settings',type==='hourly'?(nl?'Verwachting per uur':'Hourly forecast'):(nl?'Verwachting per dag':'Daily forecast'),[
    select('forecast_'+type+'_fields',options,true),...fields.filter(field=>field!=='condition'&&(type==='daily'||field!=='templow')).map(field=>number('forecast_'+type+'_'+field+'_decimals',0,3)),
   ]));
  }
  return schema;
 }
 _helper(item,nl){
  const name=item.name,helpers={
   title:nl?'Naam voor toegankelijkheid; verschijnt niet als zichtbare titel.':'Name for accessibility; not shown as a visible title.',
   entity:nl?'Kies je Home Assistant-weerentiteit voor temperatuur, weerstatus en verwachting.':'Choose your Home Assistant weather entity for temperature, conditions and forecasts.',
   icon_scale:nl?'Vergroot het grote weericoon binnen de vaste headerhoogte. De andere iconen blijven even groot.':'Scale the large weather icon within the fixed header height. Other icons keep their size.',
   icon_offset_x:nl?'Negatief = naar links, positief = naar rechts. Nul plaatst het icoon horizontaal in het midden van de kaart.':'Negative moves left, positive moves right. Zero centers the icon horizontally in the card.',
   icon_offset_y:nl?'Negatief = omhoog, positief = omlaag. De headerhoogte blijft gelijk.':'Negative moves up, positive moves down. Header height stays fixed.',
   compact:nl?'Kleinere afbeeldingruimte en gegevensvlakken. Je tabkeuze blijft behouden.':'Smaller illustration area and data panels. Your tab selection is preserved.',
   background:nl?'Kies een van de vijf vertrouwde achtergronden of Aurora sky, Cloud layers en Atmospheric flow met extra animatie. Kleuren volgen de weerstatus.':'Choose one of the five familiar backgrounds or Aurora sky, Cloud layers and Atmospheric flow with extra animation. Colors follow weather conditions.',
   animate_icons:nl?'Animatie stopt ook bij geen verbinding, ontbrekende gegevens of de voorkeur voor minder beweging.':'Animation also stops when offline, data is missing or reduced motion is preferred.',
   animate_background:nl?'Onafhankelijk van de weericonen. Animatie pauzeert buiten beeld en bij een verborgen browsertabblad.':'Independent of weather icons. Animation pauses outside the viewport and in hidden browser tabs.',
   icon_style:nl?'Dezelfde stijl voor de header, het statusveld en de verwachting. Liquid glass en Neon hebben iconen voor alle 15 weerstatussen, plus ontbrekende gegevens.':'The same style for the header, status field and forecast. Liquid glass and Neon cover all 15 weather conditions, plus missing data.',
   tabs:nl?'Kies welke tabbladen zichtbaar zijn, ook in compact. Leeg = geen verwachting. Je weerentiteit moet de gekozen verwachting ondersteunen.':'Choose visible tabs, including in compact. Empty means no forecast. Your weather entity must support the selected forecast.',
   forecast_type:nl?'Dit tabblad opent bij het laden van de kaart. Automatisch kiest een ondersteunde verwachting uit de zichtbare tabs.':'Opens when the card loads. Automatic chooses a supported forecast from the visible tabs.',
   forecast_count:nl?'Aantal uren of dagen, van 3 tot 8. Op een smalle kaart kun je horizontaal scrollen.':'Number of hours or days, from 3 to 8. Narrow cards can scroll horizontally.',
   forecast_fields:nl?'Kies de gegevens per uur en dag. Tijd of dag blijft zichtbaar. Minimumtemperatuur geldt alleen per dag. Ontbrekende gegevens tonen een streepje; een leeg veld zorgt niet voor een lege rij.':'Choose hourly and daily data. Time or day remains visible. Low temperature applies to daily forecasts only. Missing values show a dash; hidden fields leave no empty row.',
  };
  if(helpers[name])return helpers[name];
  if(/^forecast_(hourly|daily)_fields$/.test(name))return nl?'Kies de velden voor deze verwachting. Wijzig de volgorde onderaan. Leeg toont alleen tijd of dag. Niet aangeleverde waarden tonen een streepje.':'Choose fields for this forecast. Change their order below. Empty shows time or day only. Unsupported values show a dash.';
  if(/^forecast_.*_decimals$/.test(name))return nl?'Leeg = automatisch. Kies 0 tot 3 decimalen voor dit veld.':'Empty uses automatic precision. Choose 0 to 3 decimal places for this field.';
  if(name.endsWith('_label'))return nl?'Leeg = de naam van de weerwaarde of entiteit.':'Empty uses the weather metric or entity name.';
  if(name.endsWith('_attribute'))return nl?'Leeg = de entiteitwaarde. Vul anders de exacte attribuutnaam in.':'Empty uses the entity state. Otherwise enter the exact attribute name.';
  if(name.endsWith('_unit'))return nl?'Leeg = de broneenheid. Bij een attribuut wordt geen eenheid aangenomen.':'Empty uses the source unit. Attribute values have no assumed unit.';
  if(name.endsWith('_decimals'))return nl?'Leeg = automatisch. Alleen voor numerieke waarden.':'Empty uses automatic formatting. Numeric values only.';
 }
 _render(){
  if(!this._config||!this._hass)return;
  if(!this._form){
   this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;line-height:1.5;color:var(--secondary-text-color);margin:0 0 12px}details{margin-top:12px;border:1px solid var(--divider-color);border-radius:10px;padding:12px}summary{cursor:pointer;font-weight:500}.order-row{display:flex;align-items:center;gap:6px;margin-top:8px}.order-row span{flex:1;min-width:0;overflow-wrap:anywhere}button{min-width:36px;min-height:36px;border:0;border-radius:6px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.35;cursor:default}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><p></p><ha-form></ha-form><div class="forecast-order"></div>';
   this._form=this.shadowRoot.querySelector('ha-form');
   this._form.addEventListener('value-changed',event=>{
    event.stopPropagation();const next={...this._config};
    for(const key of Object.keys(weatherEditorLabels))if(Object.hasOwn(event.detail.value,key))next[key]=event.detail.value[key];
    this._config=normalizeWeatherConfig(next);this._render();
    this._emit();
   });
  }
  const nl=weatherDutch(this._hass),schema=this._schema(nl),key=JSON.stringify([nl,schema]);
  this.shadowRoot.querySelector('p').textContent=nl?'Stel je weerbron, weergave en gegevensvelden in. Kies zelf welke verwachtingstabbladen zichtbaar zijn.':'Configure your weather source, appearance and data fields. Choose which forecast tabs are visible.';
  this._form.hass=this._hass;
  if(this._schemaKey!==key){this._schemaKey=key;this._form.schema=schema;this._form.computeLabel=item=>weatherEditorLabels[item.name]?.[nl?0:1]??item.name;this._form.computeHelper=item=>this._helper(item,nl);}
  this._form.data={...this._config,tabs:weatherVisibleTabs(this._config),...Object.fromEntries(['hourly','daily'].map(type=>['forecast_'+type+'_fields',weatherForecastFields(this._config,type)]))};
  this._renderOrder(nl);
 }
 _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));}
 _renderOrder(nl){
  const root=this.shadowRoot.querySelector('.forecast-order'),types=weatherVisibleTabs(this._config),signature=JSON.stringify([nl,types,...types.map(type=>weatherForecastFields(this._config,type))]);
  if(signature===this._orderSignature)return;this._orderSignature=signature;
  const open=new Set([...root.querySelectorAll('details[open]')].map(node=>node.dataset.type));root.replaceChildren();
  for(const type of types){
   const fields=weatherForecastFields(this._config,type).filter(field=>type==='daily'||field!=='templow');if(fields.length<2)continue;
   const details=document.createElement('details');details.dataset.type=type;details.open=open.has(type);
   const summary=document.createElement('summary');summary.textContent=(nl?'Volgorde · ':'Order · ')+(type==='hourly'?(nl?'Per uur':'Hourly'):(nl?'Per dag':'Daily'));details.append(summary);
   for(const [index,field] of fields.entries()){
    const row=document.createElement('div');row.className='order-row';const label=document.createElement('span');label.textContent=WEATHER_FORECAST_FIELDS[field][nl?0:1];row.append(label);
    for(const delta of [-1,1]){
     const button=document.createElement('button');button.type='button';button.textContent=delta<0?'↑':'↓';button.disabled=index+delta<0||index+delta>=fields.length;button.dataset.field=field;button.dataset.direction=String(delta);
     button.setAttribute('aria-label',label.textContent+' '+(delta<0?(nl?'omhoog':'move up'):(nl?'omlaag':'move down')));
     button.onclick=()=>{const next=[...fields];[next[index],next[index+delta]]=[next[index+delta],next[index]];this._config=normalizeWeatherConfig({...this._config,['forecast_'+type+'_fields']:next});this._render();this._emit();const selector='details[data-type="'+type+'"] button[data-field="'+field+'"]';const preferred=this.shadowRoot.querySelector(selector+'[data-direction="'+delta+'"]');(preferred&&!preferred.disabled?preferred:this.shadowRoot.querySelector(selector+':not(:disabled)'))?.focus();};row.append(button);
    }
    details.append(row);
   }
   root.append(details);
  }
 }
}












class WeatherCard extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._forecast=[];this._iconCache=new Map();}
 static async getConfigElement(){if(!customElements.get('eleven-weather-editor-test'))customElements.define('eleven-weather-editor-test',WeatherEditor);return document.createElement('eleven-weather-editor-test');}
 static getStubConfig(hass){return {entity:Object.keys(hass?.states??{}).find(id=>id.startsWith('weather.'))??'',tabs:['hourly','daily']};}
 setConfig(config){
  const next=normalizeWeatherConfig(config),previous=this._config;
  if(!previous||previous.entity!==next.entity||previous.forecast_type!==next.forecast_type||!weatherVisibleTabs(next).includes(this._forecastSelection))this._forecastSelection=null;
  this._config=next;this._syncForecast();this._ensureForecastClock();this._render();
 }
 set hass(hass){this._hass=hass;this._syncForecast();this._render();}
 get hass(){return this._hass;}
 connectedCallback(){this._attached=true;this._motionCleanup?.();this._motionCleanup=observeCardMotion(this,()=>{this._ensureForecastClock();this._render();});this._syncForecast();this._ensureForecastClock();this._render();}
 disconnectedCallback(){this._attached=false;this._motionCleanup?.();this._motionCleanup=null;clearInterval(this._forecastClock);this._forecastClock=null;this._stopForecast();this._tabs?.disconnect();this._key=null;}
 _ensureForecastClock(){
  const active=this._attached&&!!this._config?.entity&&this._forecastEnabled()&&(typeof document==='undefined'||!document.hidden);
  if(!active){clearInterval(this._forecastClock);this._forecastClock=null;return;}
  if(!this._forecastClock){this._forecastClock=setInterval(()=>this._render(),60000);this._forecastClock.unref?.();}
 }
 _weatherArt(kind,style,iconKind,slot){
  const signature=kind+'|'+style+'|'+iconKind,cached=this._iconCache.get(slot);
  if(cached?.signature===signature)return cached.markup;
  const markup=weatherArt(kind,style,iconKind);this._iconCache.set(slot,{signature,markup});
  if(this._iconCache.size>32)this._iconCache.delete(this._iconCache.keys().next().value);
  return markup;
 }
 getCardSize(){return (this._forecastEnabled()?9:7)-(this._config?.compact?1:0);}
 getGridOptions(){return {columns:12,min_columns:6,rows:this.getCardSize(),min_rows:3};}
 _offline(){return this._hass?.connected===false||this._hass?.connection?.connected===false;}
 _forecastEnabled(){return weatherVisibleTabs(this._config).length>0;}
 _stopForecast(){this._generation++;try{this._unsubscribe?.();}catch{}this._unsubscribe=null;}
 _statusMarkup(attributes,available,state,nl){
  const metric=weatherField(this._config,'metric_status',attributes,this._hass,available);if(!metric)return '';
  const condition=this._config.metric_status==='condition',id=metric.entity||(this._config.metric_status==='custom'?'':this._config.entity);
  const label=condition?this._config.metric_status_label:metric.label;
  const plain=weatherField({...this._config,metric_status_show_unit:false},'metric_status',attributes,this._hass,available),split=metric.value.startsWith(plain.value);
  const value=plain.value==='\u2014'?null:split?plain.value:metric.value,unit=split?metric.value.slice(plain.value.length).trim():'';
  const icon=this._config.metric_status_icon?`<ha-icon icon="${uiEscape(this._config.metric_status_icon)}"></ha-icon>`:this._weatherArt(state.kind,this._config.icon_style,state.iconKind,'status');
  return uiMetric({title:label||metric.label,value,unit,iconContent:icon,compact:this._config.compact,action:!!id,info:this._offline()?(nl?'Geen verbinding · laatst ontvangen gegevens':'Offline · last received readings'):'',attrs:{class:'weather-status', 'data-status-entity':id||'', 'aria-label':(label?label+': ':'')+metric.value}});
 }
 _metricsMarkup(attributes,available){
  const icons={wind_speed:'mdi:weather-windy',humidity:'mdi:water-percent',pressure:'mdi:gauge',visibility:'mdi:eye-outline',uv_index:'mdi:sun-wireless-outline',cloud_coverage:'mdi:weather-cloudy',wind_gust_speed:'mdi:weather-windy',dew_point:'mdi:thermometer-water',temperature:'mdi:thermometer'};
  const metrics=['metric_primary','metric_secondary'].map(field=>{
   const metric=weatherField(this._config,field,attributes,this._hass,available);if(!metric)return '';
   const plain=weatherField({...this._config,[field+'_show_unit']:false},field,attributes,this._hass,available),split=metric.value.startsWith(plain.value);
   return uiMetric({title:metric.label,value:plain.value==='\u2014'?null:split?plain.value:metric.value,unit:split?metric.value.slice(plain.value.length).trim():'',icon:this._config[field+'_icon']||icons[this._config[field]]||'mdi:chart-box-outline',compact:this._config.compact,action:!!(metric.entity||(this._config[field]==='custom'?'':this._config.entity)),attrs:{'data-entity':metric.entity||(this._config[field]==='custom'?'':this._config.entity)||'','data-weather-field':field}});
  }).filter(Boolean);
  return metrics.length?'<div class="weather-metrics" data-ui-metric-grid style="--ui-metric-columns:'+metrics.length+'">'+metrics.join('')+'</div>':'';
 }
 _syncForecast(){
  if(!this._config||!this._hass||!this._attached)return;
  const entity=this._hass.states?.[this._config.entity],type=this._forecastSelection??weatherForecastType(this._config,entity),connection=this._hass.connection;
  const key=JSON.stringify([this._config.entity,type,this._forecastEnabled(),this._offline()]);
  if(this._key===key&&this._connection===connection)return;
  this._stopForecast();this._key=key;this._connection=connection;
  this._forecast=[];this._forecastStatus='loading';this._forecastType=type;
  if(!this._forecastEnabled()||!this._config.entity||this._offline())return;
  if(typeof connection?.subscribeMessage!=='function'){this._forecastStatus='error';return;}
  const generation=this._generation;
  const fail=()=>{if(!this._attached||generation!==this._generation)return;this._forecastStatus='error';this._render();};
  try {
   Promise.resolve(connection.subscribeMessage(payload=>{
    if(!this._attached||generation!==this._generation)return;
    this._forecastStatus=Array.isArray(payload?.forecast)?'ready':'error';
    this._forecast=Array.isArray(payload?.forecast)?payload.forecast:[];this._render();
   },{type:'weather/subscribe_forecast',entity_id:this._config.entity,forecast_type:type})).then(unsubscribe=>{
    if(typeof unsubscribe!=='function')return;
    if(!this._attached||generation!==this._generation){try{unsubscribe();}catch{}}else this._unsubscribe=unsubscribe;
   },fail);
  }catch{fail();}
 }
 _forecastMarkup(nl,attributes){
  if(!this._forecastEnabled())return '';
  const heading=this._forecastType==='daily'?(nl?'Komende dagen':'Coming days'):(nl?'Komende uren':'Coming hours');
  const rows=weatherForecastRows(this._forecast,this._config.forecast_count,Date.now(),this._forecastType,this._hass);
  let body;
  if(this._offline())body=`<p class="notice">${nl?'Verwachting niet beschikbaar zonder verbinding.':'Forecast unavailable while offline.'}</p>`;
  else if(this._forecastStatus==='error')body=`<p class="notice" role="status">${nl?'Verwachting niet beschikbaar.':'Forecast unavailable.'}</p><button class="retry">${nl?'Opnieuw proberen':'Retry'}</button>`;
  else if(this._forecastStatus==='loading')body=`<p class="notice" role="status">${nl?'Verwachting laden…':'Loading forecast…'}</p>`;
  else if(!rows.length)body=`<p class="notice">${nl?'Geen verwachting beschikbaar.':'No forecast available.'}</p>`;
  else body=`<ol class="forecast-list" tabindex="0" aria-label="${heading}">${rows.map(row=>{
   const state=weatherCondition(row.condition,nl);
   const when=weatherDate(row.datetime,this._hass,this._forecastType);
   const fields=weatherForecastFields(this._config,this._forecastType).map(key=>{
    if(key==='condition')return '<span data-forecast-field="condition" role="img" aria-label="'+uiEscape(state.label)+'">'+this._weatherArt(state.kind,this._config.icon_style,state.iconKind,row.datetime)+'</span>';
    if(key==='templow'&&this._forecastType!=='daily')return '';
    const units={temperature:attributes.temperature_unit||'°C',templow:attributes.temperature_unit||'°C',precipitation_probability:'%',precipitation:attributes.precipitation_unit||'',wind_speed:attributes.wind_speed_unit||'',wind_gust_speed:attributes.wind_speed_unit||'',humidity:'%',uv_index:''};
    const label=WEATHER_FORECAST_FIELDS[key][nl?0:1],value=weatherNumber(row[key],this._hass,units[key],this._config['forecast_'+this._forecastType+'_'+key+'_decimals']??(['precipitation','wind_speed','wind_gust_speed','uv_index'].includes(key)?1:0));
    const className=key==='temperature'?'forecast-value':key==='templow'?'forecast-low':key==='precipitation_probability'?'rain-chance':'forecast-extra';
    return '<div class="'+className+'" data-forecast-field="'+key+'" aria-label="'+uiEscape(label)+'" title="'+uiEscape(label)+'">'+(!['temperature','templow','precipitation_probability'].includes(key)?'<span class="forecast-label">'+uiEscape(label)+'</span>':'')+uiEscape(value)+'</div>';
   }).join('');
   return '<li data-weather-key="'+uiEscape(row.datetime)+'"><time datetime="'+uiEscape(row.datetime)+'">'+uiEscape(when)+'</time>'+fields+'</li>';
  }).join('')}</ol>`;
  if(weatherVisibleTabs(this._config).length===1)return `<section class="forecast" aria-label="${heading}">${body}</section>`;
  const items=[{value:'hourly',label:nl?'Per uur':'Hourly'},{value:'daily',label:nl?'Per dag':'Daily'}].filter(item=>weatherVisibleTabs(this._config).includes(item.value)).map(item=>({...item,content:item.value===this._forecastType?body:''}));
  return `<section class="forecast" aria-label="${nl?'Weersverwachting':'Weather forecast'}">${uiTabs({id:'weather-forecast',label:nl?'Weersverwachting':'Weather forecast',items,selected:this._forecastType,panelClassName:'forecast-panel'})}</section>`;
 }
 _render(){
  if(!this._config)return;
  const hass=this._hass,nl=weatherDutch(hass),entity=hass?.states?.[this._config.entity],attributes=entity?.attributes??{};
  const available=entity&&!['unknown','unavailable'].includes(entity.state),state=weatherCondition(available?entity.state:'unknown',nl);
  const signature=JSON.stringify([this._config,entity,weatherForecastRows(this._forecast,this._config.forecast_count,Date.now(),this._forecastType,hass),this._forecastStatus,this._forecastType,hass?.themes?.darkMode,hass?.locale,hass?.language,hass?.config?.time_zone,this._offline(),...['metric_status','metric_primary','metric_secondary'].map(field=>this._config[field]==='custom'?hass?.states?.[this._config[field+'_entity']]:null)]);
  if(signature===this._signature)return;this._signature=signature;
  const focusedTab=this.shadowRoot.activeElement?.dataset?.uiTab;
  const focusedEntity=this.shadowRoot.activeElement?.dataset?.entity,focusedStatus=this.shadowRoot.activeElement?.classList.contains('weather-status');
  const number=(value,unit='',digits=0)=>weatherNumber(available?value:null,hass,unit,digits);
  const unit=attributes.temperature_unit||'°C';
  patchWeatherDOM(this.shadowRoot,`<style>${uiButtonStyles()}${uiTabsStyles()}${weatherStyles}${uiPrimaryValueStyles()}${uiMetricStyles()}
.weather-status{margin-top:16px}.weather-metrics{margin:0}.header-region{--ui-metric-tone:var(--tone)}.content:not(:has(.weather-metrics)) .scene{padding-bottom:0}.content[data-compact=true] .weather-status{margin-top:12px}.hero{padding-top:0;grid-template-columns:minmax(0,1fr)}.hero .temperature{max-width:50%;position:relative;z-index:1}.content[data-icon-style] .hero>.art{inset:0 auto 0 50%;width:50%;transform:translate(calc(-50% + var(--weather-icon-x,0px)),var(--weather-icon-y,0px)) scale(var(--weather-icon-scale,1));transform-origin:center;min-width:0}.hero .art svg{max-width:100%}.hero .temperature{margin-top:0;font-size:inherit;letter-spacing:inherit}.content[data-compact=true] .hero .temperature{margin-top:0}
</style><ha-card aria-label="${uiEscape(this._config.title||(nl?'Het weer':'Weather'))}"><div class="content" style="--header-background-opacity:${this._config.background_strength/100};--weather-icon-scale:${this._config.icon_scale/100};--weather-icon-x:${this._config.icon_offset_x}px;--weather-icon-y:${this._config.icon_offset_y}px" data-background="${this._config.background}" data-icon-style="${this._config.icon_style}" data-animated="${!!available&&state.kind!=='unknown'&&this._config.animate_icons&&!this._offline()}" data-background-animated="${!!available&&state.kind!=='unknown'&&this._config.animate_background&&!this._offline()}" data-compact="${this._config.compact}" data-kind="${state.kind}" data-dark="${!!hass?.themes?.darkMode}"><div class="header-region"><div class="scene-background" aria-hidden="true">${weatherAtmosphere(this._config.background)}</div><div class="scene"><div class="hero">${uiPrimaryValue({value:available?number(attributes.temperature):null,unit,subtitle:attributes.apparent_temperature!=null&&available?(nl?'Voelt als ':'Feels like ')+number(attributes.apparent_temperature,unit):'',compact:this._config.compact,attrs:{class:'temperature'}})}<div class="art">${this._weatherArt(state.kind,this._config.icon_style,state.iconKind,'hero')}</div></div>${this._statusMarkup(attributes,available,state,nl)}</div>${this._metricsMarkup(attributes,available)}</div>${!this._config.entity?`<p class="notice">${nl?'Kies een weerentiteit in de configuratie.':'Choose a weather entity in the editor.'}</p>`:`${this._forecastMarkup(nl,attributes)}`}</div></ha-card>`);
  this._tabs?.disconnect();
  this._tabs=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[data-ui-tab]'),panels:this.shadowRoot.querySelectorAll('[data-ui-tab-panel]'),onSelect:value=>{
   this._forecastSelection=value;this._syncForecast();this._render();
   this.shadowRoot.querySelector(`[data-ui-tab="${value}"]`)?.focus({preventScroll:true});
  }});
  if(focusedTab)this.shadowRoot.querySelector(`[data-ui-tab="${focusedTab}"]`)?.focus({preventScroll:true});
  if(focusedEntity)[...this.shadowRoot.querySelectorAll('[data-entity]')].find(button=>button.dataset.entity===focusedEntity)?.focus({preventScroll:true});
  if(focusedStatus)this.shadowRoot.querySelector('.weather-status')?.focus({preventScroll:true});
  if(!this._eventsBound){
   this._eventsBound=true;
   this.shadowRoot.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-status-entity],[data-entity],.retry');if(!target)return;
    if(target.classList.contains('retry')){this._key=null;this._syncForecast();this._render();return;}
    const id=target.dataset.statusEntity||target.dataset.entity;
    if(id&&!target.disabled)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));
   });
  }
 }
}

if(!customElements.get('eleven-weather-card-test'))customElements.define('eleven-weather-card-test',WeatherCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='eleven-weather-card-test'))window.customCards.push({type:'eleven-weather-card-test',name:'Eleven Weather (beta)',description:'Compact current weather and forecast with state-aware illustrations.',preview:true});
})();
