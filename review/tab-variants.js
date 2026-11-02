import {uiTabs,bindUITabs,uiTabsStyles} from '../shared/ui-tabs.js';
import {uiButton,uiButtonStyles} from '../shared/ui-button.js';
import {cardThemeStyles} from '../shared/card-theme.js';

// Read the actual theme's flat scalar mapping and its two modes; no copied palette.
const source=await (await fetch('../themes/eleven_material.yaml')).text();
const theme={},modes={light:{},dark:{}};let mode=null;
for(const line of source.split(/\r?\n/)){
 if(!line.trim()||line.trimStart().startsWith('#'))continue;
 if(/^    (light|dark):/.test(line)){mode=line.trim().slice(0,-1);continue;}
 if(['Eleven Material:','modes:'].includes(line.trim()))continue;
 const colon=line.indexOf(':');if(colon<0)continue;
 const key=line.slice(0,colon).trim(),value=line.slice(colon+1).trim();
 (mode?modes[mode]:theme)[key]=value.startsWith('"')?JSON.parse(value):value;
}
let dark=false;
function applyTheme(){
 const native={
  'ha-card-border-radius':'12px','ha-card-box-shadow':'none',
  'ha-card-background':'var(--card-background-color)',
  'primary-color':'#03a9f4','accent-color':'#8961b5',
  ...(dark?{'primary-background-color':'#111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'}:{'primary-background-color':'#fafafa','card-background-color':'#fff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})
 };
 const values=document.querySelector('#theme').value==='material'?{...native,...theme,...modes[dark?'dark':'light']}:native;
 for(const key of [...document.body.style])if(key.startsWith('--'))document.body.style.removeProperty(key);
 for(const [key,value]of Object.entries(values))document.body.style.setProperty('--'+key,value);
 document.body.style.colorScheme=dark?'dark':'light';
 for(const card of document.querySelectorAll('[data-weather-demo]'))if(card._hass)card.hass={...card._hass,themes:{darkMode:dark}};
 const button=document.querySelector('#mode');button.textContent=dark?'Licht thema':'Donker thema';button.setAttribute('aria-pressed',String(dark));
}
const icons={rolling:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/>',custom:'<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>'};
const choices=(values)=>`<div class="choices" role="group" aria-label="Periodekeuze">${values.map(text=>uiButton({variant:'surface',text,attrs:{'data-choice':text,'aria-pressed':'false'}})).join('')}</div>`;
class TabExample extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 connectedCallback(){
  if(this.shadowRoot.childElementCount)return;
  const variant=this.getAttribute('variant');
  const family=variant.startsWith('joined-a-set-')?'a-series':variant.startsWith('refined-')?'text text-equal refined':variant.startsWith('rail-')?'rail':variant.startsWith('text-')?'text':'';
  this.shadowRoot.innerHTML=`<style>
   ${uiButtonStyles()}${uiTabsStyles()}
   :host{font:13px/1.45 system-ui,sans-serif;color:var(--primary-text-color);container-type:inline-size}
   *{box-sizing:border-box}
   .example{padding:18px;border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color));box-shadow:var(--ha-card-box-shadow,none)}
   .workspace{min-width:0}
   .tab-strip{gap:4px;border:0;align-items:stretch}
   .tab-strip [role=tab]{flex:1 1 0;min-height:44px;padding:8px 6px;white-space:normal;overflow-wrap:anywhere;font-size:13px;line-height:1.35;border:0;border-radius:var(--eleven-material-radius-button,8px);background:transparent;box-shadow:none;transform:none;color:var(--secondary-text-color);font-weight:500}
   .tab-strip [role=tab]:not(:disabled):hover{color:var(--primary-text-color);background:color-mix(in srgb,var(--primary-text-color) 5%,transparent)}
   .tab-strip [role=tab][aria-selected=true],.tab-strip [role=tab][aria-selected=true]:hover{color:var(--accent-color);font-weight:600;background:var(--eleven-material-selection-background,color-mix(in srgb,var(--accent-color) 12%,var(--secondary-background-color)));box-shadow:var(--eleven-material-selection-well,none);transform:translateY(1px)}
   .tab-strip [role=tab]:focus-visible{outline:2px solid var(--accent-color);outline-offset:-3px}
   .tab-content{padding:16px 0 0;min-height:136px}
   .tab-content p{margin:0 0 12px;color:var(--secondary-text-color);font-size:12px}
   .choices{display:flex;flex-wrap:wrap;gap:8px}
   .choices [data-ui-button],form [data-ui-button]{flex:1 1 60px;width:auto;min-height:44px;justify-content:center}
   .status{margin:12px 0 0;font-size:12px;color:var(--secondary-text-color)}
   form{display:grid;gap:10px}form label{display:grid;gap:4px;font-size:12px}input{min-width:0;width:100%;min-height:44px;border:1px solid var(--divider-color);border-radius:8px;padding:8px;color:inherit;background:var(--secondary-background-color);font:inherit}input:focus-visible{outline:2px solid var(--accent-color);outline-offset:2px}
   ${cardThemeStyles({controls:'.choices [data-ui-button],form [data-ui-button]',selected:'.choices [aria-pressed=true]'})}
   .choices [aria-pressed=true],.choices [aria-pressed=true]:not(:disabled):hover{background:color-mix(in srgb,var(--accent-color) 12%,var(--secondary-background-color));color:var(--accent-color);box-shadow:var(--eleven-material-selection-well,none)}
   /* Preview-only variants; shared component defaults remain untouched. */
   .rail .tab-strip{padding:4px;background:var(--secondary-background-color);border-radius:var(--eleven-material-radius-button,10px)}
   .folder .tab-strip{gap:4px;padding:0 4px;position:relative;z-index:1}
   .folder .tab-strip [role=tab]{border-radius:12px 12px 0 0;background:color-mix(in srgb,var(--secondary-background-color) 65%,transparent);min-height:48px}
   .folder .tab-strip [role=tab][aria-selected=true]{border-radius:12px 12px 0 0;background:var(--secondary-background-color)}
   .folder .tab-content{padding:16px 12px;background:var(--secondary-background-color);border-radius:0 0 12px 12px}
   .header .workspace{border:1px solid var(--divider-color);border-radius:12px;overflow:hidden}
   .header .tab-strip{gap:0;padding:4px;background:var(--secondary-background-color)}
   .header .tab-strip [role=tab]{border-radius:6px}
   .header .tab-strip [role=tab]+[role=tab]{border-inline-start:1px solid var(--divider-color)}
   .header .tab-content{padding:16px 12px}
   .text .tab-strip{gap:12px;justify-content:flex-start;padding:0 0 8px}
   .text .tab-strip [role=tab]{flex:0 1 auto;padding:8px 10px;border-radius:6px;font-size:12px}
   .text .tab-content{padding-top:12px;border-top:1px solid var(--divider-color)}
   .icons .tab-strip{gap:4px;padding:4px;background:var(--secondary-background-color);border-radius:12px}
   .icons .tab-strip [role=tab]{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px 6px;min-height:70px;border-radius:8px;font-size:12px}
   .icons .tab-strip svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
   @container(max-width:340px){.example{padding:12px}.tab-strip [role=tab]{font-size:12px;padding:8px 4px}.text .tab-strip{gap:4px}.text .tab-strip [role=tab]{padding:8px 6px}}
   /* Follow-ups to 1 and 4: explicit text alignment and no vertical label jump. */
   .rail-equal .tab-strip,.rail-start .tab-strip,.rail-segments .tab-strip,.text-equal .tab-strip,.text-divided .tab-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch}
   .example:is(.rail-equal,.rail-start,.rail-segments,.text-equal,.text-compact,.text-divided) .tab-strip [role=tab]{height:auto;min-height:48px;min-width:0;text-align:center;align-items:center;justify-content:center;line-height:1.3;transform:none}
   .example:is(.rail-equal,.rail-start,.rail-segments,.text-equal,.text-compact,.text-divided) .tab-strip [role=tab][aria-selected=true]{transform:none}
   .rail-equal .tab-strip,.rail-start .tab-strip{padding:4px;gap:4px;border-radius:12px}
   .rail-equal .tab-strip [role=tab],.rail-start .tab-strip [role=tab]{border-radius:8px;padding:8px 10px}
   .example.rail-start .tab-strip [role=tab]{justify-content:flex-start;text-align:start}
   .rail-segments .tab-strip{gap:0;padding:4px;border-radius:10px}
   .rail-segments .tab-strip [role=tab]{border-radius:6px;padding:8px 6px;position:relative}
   .rail-segments .tab-strip [role=tab]+[role=tab]::before{content:'';position:absolute;inset-inline-start:0;top:14px;bottom:14px;width:1px;background:var(--divider-color)}
   .text-equal .tab-strip{gap:6px;padding:0 0 8px}
   .text-equal .tab-strip [role=tab]{padding:8px 6px;border-radius:8px;font-size:13px}
   .text-compact .tab-strip{gap:4px;padding:0 0 8px}
   .text-compact .tab-strip [role=tab]{flex:0 1 auto;padding:8px 10px;border-radius:10px;font-size:12px}
   .text-divided .tab-strip{gap:0;padding:0}
   .text-divided .tab-strip [role=tab]{position:relative;padding:8px 6px;border-radius:6px}
   .text-divided .tab-strip [role=tab]+[role=tab]::before{content:'';position:absolute;inset-inline-start:0;top:16px;bottom:16px;width:1px;background:var(--divider-color)}
   .text-divided .tab-content{border:0;padding-top:16px}
   @container(max-width:340px){.example:is(.rail-equal,.rail-start,.rail-segments,.text-equal,.text-compact,.text-divided) .tab-strip [role=tab]{font-size:12px;padding:8px 5px}}
   /* Refinements of 4A. Use exactly the ordinary control's radius token. */
   .example.refined .tab-strip [role=tab]{border-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));font-weight:500;min-height:48px;padding:8px 6px}
   .example.refined .tab-strip [role=tab][aria-selected=true]{font-weight:600}
   .refined-balanced .tab-strip{gap:8px;padding-bottom:10px}
   .refined-balanced .tab-content{padding-top:14px}
   .refined-airy .tab-strip{gap:10px;padding-bottom:12px}
   .example.refined-airy .tab-strip [role=tab]{min-height:52px;padding:10px 6px}
   .refined-airy .tab-content{padding-top:18px}
   .refined-compact .tab-strip{gap:4px;padding-bottom:0}
   .example.refined-compact .tab-strip [role=tab]{min-height:44px;padding:6px 4px;font-size:12px}
   .refined-compact .tab-content{border:0;padding-top:12px;min-height:124px}
   .refined-divider .tab-strip{gap:6px;padding-bottom:12px}
   .refined-divider .tab-content{position:relative;border:0;padding-top:18px}
   .refined-divider .tab-content::before{content:'';position:absolute;inset-inline:8px;top:0;height:1px;background:color-mix(in srgb,var(--divider-color) 65%,transparent)}
   .refined-type .tab-strip{gap:8px;padding-bottom:0}
   .example.refined-type .tab-strip [role=tab]{font-weight:400;letter-spacing:.01em}
   .example.refined-type .tab-strip [role=tab][aria-selected=true]{font-weight:650;letter-spacing:0}
   .refined-type .tab-content{border:0;padding-top:20px}
   @container(max-width:340px){.example.refined .tab-strip [role=tab]{font-size:12px;padding-inline:4px}}
   /* Connected tabs: the active lip interrupts the panel's continuous top edge. */
   .example[class*=joined-] .tab-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;align-items:stretch;padding:0 0 0;border-bottom:1px solid var(--divider-color)}
   .example[class*=joined-] .tab-strip [role=tab]{position:relative;z-index:1;min-width:0;min-height:48px;height:auto;margin:0 0 -1px;padding:10px 6px;border:1px solid transparent;border-bottom:1px solid var(--divider-color);border-radius:var(--eleven-material-radius-button,12px) var(--eleven-material-radius-button,12px) 0 0;transform:none;box-shadow:none;line-height:1.3;text-align:center}
   .example[class*=joined-] .tab-strip [role=tab][aria-selected=true]{border-color:var(--divider-color);border-bottom-color:var(--card-background-color);background:var(--card-background-color);color:var(--accent-color);transform:none;box-shadow:none}
   .example[class*=joined-] .tab-content{border:0;padding:16px 4px 4px;background:var(--card-background-color)}
   .example.joined-panel .workspace{--joined-fill:var(--secondary-background-color)}
   .example.joined-panel .tab-strip [role=tab][aria-selected=true]{background:var(--joined-fill);border-bottom-color:var(--joined-fill)}
   .example.joined-panel .tab-content{background:var(--joined-fill);padding:16px 12px;border:1px solid var(--divider-color);border-top:0;border-radius:0 0 12px 12px}
   .example.joined-soft .workspace{--joined-edge:color-mix(in srgb,var(--accent-color) 40%,var(--divider-color))}
   .example.joined-soft .tab-strip{border-bottom-color:var(--joined-edge);gap:8px}
   .example.joined-soft .tab-strip [role=tab]{border-bottom-color:var(--joined-edge)}
   .example.joined-soft .tab-strip [role=tab][aria-selected=true]{border-color:var(--joined-edge);border-bottom-color:var(--card-background-color);box-shadow:inset 0 3px 5px color-mix(in srgb,var(--primary-text-color) 6%,transparent)}
   .example.joined-compact .tab-strip{display:flex;gap:2px}
   .example.joined-compact .tab-strip [role=tab]{flex:0 1 auto;padding-inline:14px;font-size:12px;border-top-left-radius:8px;border-top-right-radius:8px}
   @container(max-width:340px){.example[class*=joined-] .tab-strip [role=tab]{font-size:12px;padding-inline:5px}}
   /* Five follow-ups to connected A/C; preview-only, same tab binding. */
   .example.joined-a-fine .tab-strip{gap:6px;border-bottom-color:color-mix(in srgb,var(--primary-text-color) 18%,var(--card-background-color))}
   .example.joined-a-fine .tab-strip [role=tab]{border-bottom-color:color-mix(in srgb,var(--primary-text-color) 18%,var(--card-background-color));border-top-left-radius:8px;border-top-right-radius:8px}
   .example.joined-a-fine .tab-strip [role=tab][aria-selected=true]{border-color:color-mix(in srgb,var(--primary-text-color) 18%,var(--card-background-color));border-bottom-color:var(--card-background-color)}
   .example.joined-a-arc .tab-strip{gap:8px}
   .example.joined-a-arc .tab-strip [role=tab]{min-height:52px;padding-block:12px;border-top-left-radius:16px;border-top-right-radius:16px}
   .example.joined-a-arc .tab-content{padding-top:20px}
   .example.joined-c-shallow .workspace{--joined-edge:color-mix(in srgb,var(--accent-color) 25%,var(--divider-color))}
   .example.joined-c-shallow .tab-strip,.example.joined-c-shallow .tab-strip [role=tab]{border-bottom-color:var(--joined-edge)}
   .example.joined-c-shallow .tab-strip [role=tab][aria-selected=true]{border-color:var(--joined-edge);border-bottom-color:var(--card-background-color);box-shadow:inset 0 2px 3px color-mix(in srgb,var(--primary-text-color) 5%,transparent)}
   .example.joined-c-sides .workspace{--joined-edge:color-mix(in srgb,var(--accent-color) 30%,var(--divider-color))}
   .example.joined-c-sides .tab-strip{gap:8px;border-bottom-color:var(--joined-edge)}
   .example.joined-c-sides .tab-strip [role=tab]{border-bottom-color:var(--joined-edge);border-top-left-radius:10px;border-top-right-radius:10px}
   .example.joined-c-sides .tab-strip [role=tab][aria-selected=true]{border-color:var(--joined-edge);border-bottom-color:var(--card-background-color);box-shadow:inset 3px 2px 5px -2px color-mix(in srgb,var(--primary-text-color) 14%,transparent),inset -3px 2px 5px -2px color-mix(in srgb,var(--primary-text-color) 9%,transparent)}
   .example.joined-ac-balanced .tab-strip{gap:6px}
   .example.joined-ac-balanced .tab-strip [role=tab][aria-selected=true]{box-shadow:inset 0 2px 4px color-mix(in srgb,var(--primary-text-color) 7%,transparent);color:var(--primary-text-color)}
   .example.joined-ac-balanced .tab-strip [role=tab][aria-selected=true]::after{content:'';position:absolute;top:7px;inset-inline:calc(50% - 8px);height:2px;border-radius:1px;background:var(--accent-color)}
   /* A3–A12: open outlines, with no content fill or masking surface. */
   .example.a-series .workspace{--a-edge:var(--divider-color)}
   .example.a-series .tab-strip{gap:0;border:0;padding:0;align-items:stretch}
   .example.a-series .tab-strip [role=tab]{margin:0;padding:10px 8px;border:1px solid transparent;border-bottom-color:var(--a-edge);background:transparent;border-top-left-radius:12px;border-top-right-radius:12px}
   .example.a-series .tab-strip [role=tab][aria-selected=true]{border-color:var(--a-edge);border-bottom-color:transparent;background:transparent;box-shadow:none;transform:none}
   .example.a-series .tab-content{background:transparent;padding:16px 0 0;border:0}
   .example.joined-a-set-precise .tab-strip [role=tab]{border-top-left-radius:6px;border-top-right-radius:6px}
   .example.joined-a-set-arch .tab-strip [role=tab]{min-height:52px;border-top-left-radius:18px;border-top-right-radius:18px}
   .example.joined-a-set-square .tab-strip [role=tab]{border-top-left-radius:2px;border-top-right-radius:2px}
   .example.joined-a-set-compact .tab-strip [role=tab]{min-height:44px;padding-block:7px;font-size:12px;border-top-left-radius:8px;border-top-right-radius:8px}
   .example.joined-a-set-airy .tab-strip [role=tab]{min-height:56px;padding-block:14px;border-top-left-radius:14px;border-top-right-radius:14px}
   .example.joined-a-set-airy .tab-content{padding-top:20px}
   .example.joined-a-set-natural .tab-strip{display:flex}
   .example.joined-a-set-natural .tab-strip [role=tab]{flex:0 1 auto;padding-inline:12px}
   .example.joined-a-set-natural .tab-strip::after{content:'';flex:1 0 0;min-width:8px;border-bottom:1px solid var(--a-edge)}
   .example.joined-a-set-start .tab-strip [role=tab]{justify-content:flex-start;text-align:start;padding-inline:12px}
   .example.joined-a-set-accent .tab-strip [role=tab]{border-top-left-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px));border-top-right-radius:var(--eleven-material-radius-button,var(--ha-card-border-radius,12px))}
   .example.joined-a-set-accent .workspace{--a-edge:color-mix(in srgb,var(--accent-color) 35%,var(--divider-color))}
   .example.joined-a-set-defined .workspace{--a-edge:color-mix(in srgb,var(--primary-text-color) 35%,var(--card-background-color))}
   .example.joined-a-set-defined .tab-strip [role=tab]{border-width:2px;border-bottom-width:1px;border-top-left-radius:10px;border-top-right-radius:10px}
   .example.joined-a-set-defined .tab-strip [role=tab][aria-selected=true]{color:var(--primary-text-color)}
   @container(max-width:340px){.example.a-series .tab-strip [role=tab]{padding-inline:5px;font-size:12px}}
   @media(forced-colors:active){.tab-strip [role=tab][aria-selected=true]{outline:1px solid Highlight;outline-offset:-2px;box-shadow:none}}
  </style><div class="example ${family} ${variant}"><div class="workspace">${uiTabs({id:'period-'+variant,label:'Soort tijdvak',className:'tab-strip',panelClassName:'tab-content',selected:'rolling',items:[
   {value:'rolling',label:'Afgelopen',content:'<p>Kies hoe ver je terug wilt kijken.</p>'+choices(['6 uur','12 uur','24 uur'])},
   {value:'calendar',label:'Kalender',content:'<p>Kies een vaste kalenderperiode.</p>'+choices(['Vandaag','Deze week','Deze maand'])},
   {value:'custom',label:'Eigen bereik',content:`<form><label>Begin<input name="start" type="date" required></label><label>Einde<input name="end" type="date" required></label>${uiButton({variant:'surface',type:'submit',text:'Toepassen'})}</form>`}
  ]})}</div><p class="status" role="status">Nog geen periode gekozen.</p></div>`;
  this.tabs=bindUITabs({tabs:this.shadowRoot.querySelectorAll('[role=tab]'),panels:this.shadowRoot.querySelectorAll('[role=tabpanel]')});
  if(variant==='icons'||variant==='fresh-icons'||variant==='underline-icons')for(const tab of this.shadowRoot.querySelectorAll('[role=tab]'))tab.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[tab.dataset.uiTab]}</svg>`);
  for(const button of this.shadowRoot.querySelectorAll('[data-choice]'))button.onclick=()=>{
   for(const option of this.shadowRoot.querySelectorAll('[data-choice]'))option.setAttribute('aria-pressed',String(option===button));
   this.shadowRoot.querySelector('.status').textContent='Periode: '+button.dataset.choice;
  };
  this.shadowRoot.querySelector('form').onsubmit=event=>{
   event.preventDefault();const form=event.currentTarget;
   this.shadowRoot.querySelector('.status').textContent=form.elements.end.value<form.elements.start.value?'Einde moet op of na begin liggen.':`Periode: ${form.elements.start.value} tot ${form.elements.end.value}`;
  };
 }
 disconnectedCallback(){this.tabs?.disconnect();}
}
customElements.define('eleven-tab-example',TabExample);
document.querySelector('#mode').onclick=()=>{dark=!dark;applyTheme();};
document.querySelector('#theme').onchange=applyTheme;
applyTheme();

// Weather examples inherit the actual card and its forecast subscription/binding.
// The only differences from production are synthetic data and appended tab CSS.
const WeatherBase=customElements.get('eleven-weather-card');
const weatherList=':host .forecast [data-ui-tabs][role=tablist]';
const weatherTab=weatherList+' [role=tab][data-ui-tab]';
// Use the same surface color and theme-owned inset recipe as Weather information.
const weatherInfoLine=weatherList+'{--ui-tab-edge:var(--secondary-background-color)}';
const weatherInfoInset=weatherTab+'[aria-selected=true],'+weatherTab+'[aria-selected=true]:hover{box-shadow:var(--eleven-material-well,inset 0 2px 4px color-mix(in srgb,var(--primary-text-color) 7%,transparent))}';
// W4-5 follow-ups keep one 2px information-colored contour for comparison.
const weatherDeepVariant=shadow=>weatherInfoLine+weatherTab+'{border-width:2px}'+weatherTab+'[aria-selected=true],'+weatherTab+'[aria-selected=true]:hover{box-shadow:'+shadow+'}';

// A fresh comparison set: navigation structure and selection language vary.
const freshActive=weatherTab+'[aria-selected=true],'+weatherTab+'[aria-selected=true]:hover';
const freshBase=weatherList+'{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;width:100%;margin:0;overflow:visible}'+weatherTab+'{display:flex;flex-direction:row;gap:6px;justify-content:center;align-items:center;flex:1;min-width:44px;min-height:48px;height:auto;padding:10px 8px;margin:0;border:0;border-radius:0;background:transparent;box-shadow:none;font-size:13px;font-weight:500;line-height:1.3;color:var(--secondary-text-color);white-space:normal;overflow-wrap:anywhere;transform:none}'+freshActive+'{border:0;background:transparent;box-shadow:none;color:var(--accent-color,var(--primary-color));font-size:13px;font-weight:650;transform:none}'+':host .forecast [data-ui-tab-panel]{min-width:0;padding-top:16px;border:0;background:transparent}';
const tint='color-mix(in srgb,var(--accent-color,var(--primary-color)) 12%,var(--card-background-color))';
const sidebar=weatherList+'{display:flex;flex-direction:column;gap:4px;align-self:start;border-right:1px solid var(--divider-color);padding-right:8px}'+weatherTab+'{justify-content:flex-start;text-align:start;border-left:3px solid transparent;padding-inline:8px}'+freshActive+'{border-left:3px solid var(--accent-color,var(--primary-color));background:'+tint+'}';
const freshVariants={
 'fresh-switch':freshBase+weatherList+'{padding:4px;gap:4px;background:var(--secondary-background-color);border-radius:999px}'+weatherTab+'{border-radius:999px}'+freshActive+'{background:var(--accent-color,var(--primary-color));color:var(--text-primary-color,#fff)}',
 'fresh-underline':freshBase+weatherList+'{gap:0;border-bottom:1px solid var(--divider-color)}'+weatherTab+'{margin-bottom:-1px;border-bottom:3px solid transparent;padding-bottom:12px}'+freshActive+'{border-bottom:3px solid var(--accent-color,var(--primary-color))}',
 'fresh-sidebar':freshBase+':host .forecast{display:grid;grid-template-columns:104px minmax(0,1fr);gap:12px}'+sidebar+':host .forecast [data-ui-tab-panel]{grid-column:2;grid-row:1;padding-top:0}',
 'fresh-pills':freshBase+weatherList+'{display:flex;justify-content:flex-start;gap:10px}'+weatherTab+'{flex:0 1 auto;min-width:88px;border:1px solid var(--divider-color);border-radius:999px;padding-inline:18px}'+freshActive+'{border:1px solid var(--accent-color,var(--primary-color));background:'+tint+'}',
 'fresh-folder':freshBase+weatherList+'{gap:4px;padding-inline:4px;border-bottom:1px solid var(--divider-color)}'+weatherTab+'{border-radius:12px 12px 0 0;background:var(--secondary-background-color);margin-bottom:-1px;border:1px solid transparent}'+freshActive+'{background:var(--card-background-color);border:1px solid var(--divider-color);border-bottom-color:var(--card-background-color)}',
 'fresh-icons':freshBase+weatherList+'{gap:12px}'+weatherTab+'{flex-direction:column;gap:8px;min-height:82px;border-radius:12px}'+weatherTab+' svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}'+freshActive+'{background:'+tint+';box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent-color,var(--primary-color)) 35%,transparent)}',
 'fresh-cards':freshBase+weatherList+'{gap:12px}'+weatherTab+'{min-height:64px;justify-content:flex-start;border:1px solid var(--divider-color);border-radius:8px;padding:12px}'+weatherTab+'::before{content:"";width:15px;height:15px;flex:none;border:1px solid currentColor;border-radius:50%;box-sizing:border-box}'+freshActive+'{border:1px solid var(--accent-color,var(--primary-color));background:'+tint+'}'+weatherTab+'[aria-selected=true]::before{background:currentColor;box-shadow:inset 0 0 0 3px var(--card-background-color)}',
 'fresh-type':freshBase+weatherList+'{gap:16px;display:flex;justify-content:flex-start}'+weatherTab+'{flex:0 1 auto;min-height:56px;justify-content:flex-start;padding-inline:0;min-width:88px}'+freshActive+'{font-size:22px;letter-spacing:-.03em;color:var(--primary-text-color);font-weight:700}',
 'fresh-menu':freshBase+weatherList+'{display:flex;flex-direction:column;gap:0;border-block:1px solid var(--divider-color)}'+weatherTab+'{justify-content:space-between;min-height:48px;text-align:start;padding-inline:12px}'+weatherTab+'+ [role=tab]{border-top:1px solid var(--divider-color)}'+weatherTab+'::after{content:"›";font-size:22px;line-height:1}'+freshActive+'{background:'+tint+';border-left:3px solid var(--accent-color,var(--primary-color));padding-left:9px}',
 'fresh-select':freshBase+weatherList+'{display:none}'+':host .weather-demo-picker{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;color:var(--secondary-text-color)}:host .weather-demo-picker select{font:inherit;font-size:13px;min-height:48px;min-width:120px;max-width:100%;padding:10px 32px 10px 12px;border:1px solid var(--divider-color);border-radius:8px;color:var(--primary-text-color);background:var(--secondary-background-color)}:host .weather-demo-picker select:focus-visible{outline:2px solid var(--accent-color,var(--primary-color));outline-offset:2px}'
};


// Ten variations on direction 2: underline remains the selection cue.
const underlineBase=freshBase+weatherList+'{gap:0;border-bottom:1px solid var(--divider-color)}'+weatherTab+'{position:relative;margin-bottom:-1px;border-bottom:3px solid transparent;padding-bottom:12px}'+freshActive+'{border-bottom:3px solid var(--accent-color,var(--primary-color))}';
const shortUnderline=(width,offset)=>weatherTab+'{border-bottom-color:transparent}'+freshActive+'{border-bottom-color:transparent}'+weatherTab+'[aria-selected=true]::after{content:"";position:absolute;bottom:0;height:3px;width:'+width+';'+offset+'background:var(--accent-color,var(--primary-color));border-radius:3px}';
const underlineVariants={
 'underline-fine':underlineBase+weatherTab+'{border-bottom-width:2px;padding-block:12px}'+freshActive+'{border-bottom-width:2px}',
 'underline-bold':underlineBase+weatherTab+'{border-bottom-width:4px}'+freshActive+'{border-bottom-width:4px}',
 'underline-round':underlineBase+shortUnderline('calc(100% - 24px)','left:12px;'),
 'underline-natural':underlineBase+weatherList+'{display:flex;justify-content:flex-start}'+weatherTab+'{flex:0 1 auto;min-width:88px;padding-inline:16px}',
 'underline-short':underlineBase+weatherList+'{border-bottom:0}'+shortUnderline('32px','left:calc(50% - 16px);'),
 'underline-wash':underlineBase+freshActive+'{background:color-mix(in srgb,var(--accent-color,var(--primary-color)) 8%,transparent)}',
 'underline-type':underlineBase+weatherTab+'{min-height:52px}'+freshActive+'{font-size:16px;font-weight:700;color:var(--primary-text-color)}',
 'underline-icons':underlineBase+weatherTab+'{gap:7px}'+weatherTab+' svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}',
 'underline-double':underlineBase+weatherTab+'{border-bottom-width:4px;border-bottom-style:double}'+freshActive+'{border-bottom-width:4px;border-bottom-style:double}',
 'underline-start':underlineBase+weatherTab+'{justify-content:flex-start;text-align:start;padding-inline:10px}'+shortUnderline('40px','left:10px;')
};

const weatherVariants={
 ...Object.fromEntries([
  // Compact labels need a 1px optical shift toward the underline.
  ['compact',7,5,44],['original',12,12,48],['roomy',14,14,48],
  ['airy',18,18,48],['lower',6,18,48],['upper',18,6,48]
 ].map(([name,top,bottom,height])=>['padding-'+name,underlineVariants['underline-fine']+weatherTab+'{min-height:'+height+'px;padding:'+top+'px 8px '+bottom+'px}'])),
 ...underlineVariants,
 ...freshVariants,
 'deep-balanced':weatherDeepVariant('var(--eleven-material-selection-well,inset 1px 2px 4px rgb(0 0 0 / 22%),inset -1px -1px 0 rgb(255 255 255 / 20%))'),
 'deep-top':weatherDeepVariant('inset 0 3px 3px -1px var(--eleven-material-shadow,rgb(0 0 0 / 22%)),inset 0 1px 2px var(--eleven-material-shadow,rgb(0 0 0 / 16%))'),
 'deep-sides':weatherDeepVariant('inset 3px 2px 5px -2px var(--eleven-material-shadow,rgb(0 0 0 / 24%)),inset -3px 2px 5px -2px var(--eleven-material-shadow,rgb(0 0 0 / 24%)),inset 0 1px 2px var(--eleven-material-shadow,rgb(0 0 0 / 12%))'),
 'deep-soft':weatherDeepVariant('inset 0 5px 10px -2px var(--eleven-material-shadow,rgb(0 0 0 / 25%)),inset 0 1px 2px var(--eleven-material-shadow,rgb(0 0 0 / 12%))'),
 'deep-layered':weatherDeepVariant('inset 0 2px 3px var(--eleven-material-shadow,rgb(0 0 0 / 20%)),inset 2px 4px 7px var(--eleven-material-shadow,rgb(0 0 0 / 18%)),inset -1px -1px 0 color-mix(in srgb,var(--eleven-material-face1,#fff) 35%,transparent)'),
 'well-exact':weatherInfoLine+weatherInfoInset,
 'well-line':weatherInfoLine+weatherInfoInset+weatherTab+'{border-bottom-width:2px}',
 'well-compact':weatherInfoLine+weatherInfoInset+weatherList+'{display:flex}'+weatherTab+'{flex:0 1 auto;min-width:88px;padding-inline:16px}'+weatherList+'::after{content:"";flex:1;min-width:0;border-bottom:1px solid var(--ui-tab-edge)}',
 'well-airy':weatherInfoLine+weatherInfoInset+weatherTab+'{min-height:54px;padding-block:13px}',
 'well-deep':weatherInfoLine+weatherTab+'[aria-selected=true],'+weatherTab+'[aria-selected=true]:hover{box-shadow:var(--eleven-material-selection-well,var(--eleven-material-well,inset 0 3px 5px color-mix(in srgb,var(--primary-text-color) 12%,transparent)))}',
 quiet:weatherTab+'{min-height:44px;padding-block:8px;font-size:12px}',
 compact:weatherList+'{display:flex}'+weatherTab+'{flex:0 1 auto;min-width:88px;padding-inline:16px}'+weatherList+'::after{content:"";flex:1;min-width:0;border-bottom:1px solid var(--ui-tab-edge)}',
 icons:weatherTab+'{gap:7px}'+weatherTab+' svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}',
 inset:weatherTab+'[aria-selected=true],'+weatherTab+'[aria-selected=true]:hover{box-shadow:inset 0 2px 4px color-mix(in srgb,var(--primary-text-color) 7%,transparent)}',
 centered:weatherList+'{width:min(100%,280px);margin-inline:auto}'+weatherTab+'{font-size:12px;padding-inline:6px}'
};
for(const [variant,css]of Object.entries(weatherVariants)){
 customElements.define('eleven-weather-demo-'+variant,class extends WeatherBase{
  _render(){
   const pickerFocused=this.shadowRoot.activeElement?.matches?.('.weather-demo-picker select');
   super._render();if(!this.shadowRoot.querySelector('.forecast'))return;
   let style=this.shadowRoot.querySelector('[data-weather-variant]');if(!style){style=document.createElement('style');style.dataset.weatherVariant=variant;this.shadowRoot.append(style);}style.textContent=css;
   if(variant==='icons')for(const tab of this.shadowRoot.querySelectorAll('[role=tab]')){tab.querySelector('[data-weather-demo-icon]')?.remove();tab.insertAdjacentHTML('afterbegin','<svg data-weather-demo-icon viewBox="0 0 24 24" aria-hidden="true">'+icons[tab.dataset.uiTab==='hourly'?'rolling':'calendar']+'</svg>');}
   if(variant==='fresh-sidebar'||variant==='fresh-menu'){
    this.shadowRoot.querySelector('[role=tablist]').setAttribute('aria-orientation','vertical');
    for(const tab of this.shadowRoot.querySelectorAll('[role=tab]')){const original=tab.onkeydown;tab.onkeydown=event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();original?.({key:event.key==='ArrowDown'?'ArrowRight':'ArrowLeft',preventDefault(){},stopPropagation(){event.stopPropagation();}});}else original?.(event);};}
   }
   if(variant==='fresh-select'){
    this.shadowRoot.querySelector('[role=tablist]').setAttribute('aria-hidden','true');
    for(const panel of this.shadowRoot.querySelectorAll('[data-ui-tab-panel]')){panel.setAttribute('role','region');panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label',panel.dataset.uiTabPanel==='hourly'?'Uurverwachting':'Dagverwachting');}
    let picker=this.shadowRoot.querySelector('.weather-demo-picker');if(!picker){picker=document.createElement('label');picker.className='weather-demo-picker';picker.innerHTML='Verwachting<select aria-label="Weersverwachting"><option value="hourly">Per uur</option><option value="daily">Per dag</option></select>';this.shadowRoot.querySelector('.forecast').prepend(picker);}
    const select=picker.querySelector('select');select.value=this._forecastType;select.onchange=()=>{this.shadowRoot.querySelector('[data-ui-tab="'+select.value+'"]').click();this.shadowRoot.querySelector('.weather-demo-picker select')?.focus({preventScroll:true});};
    if(pickerFocused)select.focus({preventScroll:true});
   }
  }
 });
}
const demoWeather={language:'nl',locale:{language:'nl'},connected:true,config:{time_zone:'Europe/Amsterdam'},states:{'weather.demo':{state:'partlycloudy',attributes:{friendly_name:'Het weer',temperature:16,temperature_unit:'°C',apparent_temperature:14,wind_speed:14,wind_speed_unit:'km/h',humidity:68,pressure:1017,pressure_unit:'hPa',supported_features:3}}},connection:{subscribeMessage(callback,message){queueMicrotask(()=>callback({forecast:Array.from({length:8},(_,i)=>({datetime:new Date(Date.now()+(i+1)*(message.forecast_type==='daily'?86400000:3600000)).toISOString(),condition:['partlycloudy','sunny','rainy'][i%3],temperature:15+i,templow:8+i%3,precipitation_probability:20+i*5,precipitation:i*.2,wind_speed:12+i}))}));return Promise.resolve(()=>{});}}};
for(const card of document.querySelectorAll('[data-weather-demo]')){card.setConfig({entity:'weather.demo',title:'Het weer',background:'halo',background_strength:0,animate_icons:false,animate_background:false,forecast_count:4});card.hass=demoWeather;card.style.display='block';}
