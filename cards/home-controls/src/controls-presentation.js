import {uiEscape} from '../../../shared/ui-button.js';

export function controlItemState(domain,state){
 if(!state||['unknown','unavailable'].includes(state.state))return 'unavailable';
 if(domain==='climate')return ({heating:'heating',cooling:'cooling',drying:'active',fan:'active'})[state.attributes?.hvac_action]??'idle';
 if(['opening','closing'].includes(state.state))return 'moving';
 return ['on','open'].includes(state.state)?'active':'idle';
}

// Only fixed geometry enters SVG; caller-provided icons use escaped HA markup.
export function controlItemIcon(domain,state,status,customIcon){
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

export const controlPowerIcon='<svg class="power-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5.5a8 8 0 1 0 10 0M12 3v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';

export const controlsPresentationStyles=`
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
