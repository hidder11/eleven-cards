import {uiAttributes} from './ui-button.js';

const barBounds=(min,max)=>Number.isFinite(min)&&Number.isFinite(max)&&max>min?{min,max}:{min:0,max:100};
const barPercent=(value,min,max)=>Math.max(0,Math.min(100,(value-min)/(max-min)*100));

// All text/attributes are escaped; only finite measurements become fill widths.
export function uiBar({value=null,min=0,max=100,target=null,charging=false,label='',valueText='',decorative=false,attrs={}}={}){
 ({min,max}=barBounds(min,max));
 const known=Number.isFinite(value),amount=known?Math.max(min,Math.min(max,value)):null;
 const percent=known?barPercent(amount,min,max):0,marker=Number.isFinite(target)?barPercent(target,min,max):null;
 const active=!!charging&&known&&amount<max&&(!Number.isFinite(target)||amount<target);
 return `<div${uiAttributes({...attrs,'data-ui-bar':'','data-charging':String(active),'data-unavailable':String(!known),...(decorative?{'aria-hidden':'true'}:{'aria-label':label,...(known?{role:'progressbar','aria-valuemin':min,'aria-valuemax':max,'aria-valuenow':amount,...(valueText?{'aria-valuetext':valueText}:{})}:{})})})}><span class="ui-bar-fill" style="width:${percent}%">${active?'<span class="ui-bar-motion" aria-hidden="true"></span>':''}</span>${marker==null?'':`<span class="ui-bar-marker" style="left:${marker}%" aria-hidden="true"></span>`}</div>`;
}

export function uiSlider({value=0,min=0,max=100,step=1,disabled=false,attrs={}}={}){
 ({min,max}=barBounds(min,max));
 const amount=Number.isFinite(value)?Math.max(min,Math.min(max,value)):min;
 return `<input${uiAttributes({...attrs,type:'range','data-ui-slider':'',min,max,step:Number.isFinite(step)&&step>0?step:1,value:amount,...(disabled?{disabled:true}:{}),style:(attrs.style?attrs.style+';':'')+`--ui-bar-position:${barPercent(amount,min,max)}%`})}>`;
}

// Call alongside existing input handlers; never sends a command or replaces events.
export function syncUISlider(input){
 const min=Number(input.min),max=Number(input.max),value=Number(input.value);
 input.style.setProperty('--ui-bar-position',Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min?barPercent(value,min,max)+'%':'0%');
}

export function uiBarStyles(){return `
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
