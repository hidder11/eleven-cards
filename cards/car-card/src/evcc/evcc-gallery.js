// State symbols and battery charging motion shared by the dashboard card and preview.
const paths={
 solar:'<g class="sun-rays"><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g><circle cx="12" cy="12" r="4"/>',
 charging:'<path d="m13 2-8 12h6l-1 8 9-13h-6z"/>',
 waiting:'<path d="M7 3h10M7 21h10M8 3v5l8 8v5M16 3v5l-8 8v5"/><path d="M10 6h4m-4 12h4"/>',
 countdown:'<circle cx="12" cy="13" r="8"/><path d="M10 2h4m-2 0v3"/><path class="clock-hand" d="M12 13V8"/>',
 connected:'<path d="M8 3v5m8-5v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
 disconnected:'<g class="plug-top"><path d="M8 2v4m8-4v4M6 6h12v3a6 6 0 0 1-12 0z"/></g><g class="plug-bottom"><path d="M9 19h6m-3 0v3"/></g>',
 done:'<path class="check-mark" d="m5 12 4.5 4.5L19 7"/>',
 unknown:'<circle class="dot dot-one" cx="5" cy="12" r="1"/><circle class="dot dot-two" cx="12" cy="12" r="1"/><circle class="dot dot-three" cx="19" cy="12" r="1"/>',
};
export function statusSymbol(state){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[state]??paths.unknown}</svg>`;}
export function powerMotion(entity,{maxKw=11,speed=1}={}){
 maxKw=Number.isFinite(maxKw)&&maxKw>0?maxKw:11;speed=Number.isFinite(speed)&&speed>0?speed:1;
 const raw=entity?.state,unit=entity?.attributes?.unit_of_measurement;
 const valid=raw!=null&&String(raw).trim()!==''&&Number.isFinite(Number(raw))&&['W','kW'].includes(unit);
 const kw=valid?Math.max(0,Math.min(maxKw,Number(raw)/(unit==='W'?1000:1))):null;
 return {kw,seconds:(12-10*(kw??0)/maxKw)/speed,moving:kw!=null&&kw>0};
}
export const galleryStatusStyles=`
 .content{--status-accent:var(--primary-color)}
 .content[data-view=solar],.content[data-view=done]{--status-accent:var(--success-color,#6aaa63)}
 .content[data-view=waiting],.content[data-view=countdown],.content[data-view=unknown]{--status-accent:var(--warning-color,var(--primary-color))}
 .content[data-view=connected]{--status-accent:var(--info-color,#579dd1)}
 .content[data-view=disconnected]{--status-accent:var(--secondary-text-color)}
 .status-line{gap:12px;min-height:0;padding:12px;box-sizing:border-box;align-items:center}.status-line>div:not(.status-symbol){min-width:0}.status-line strong{font-size:13px;line-height:1.4}.status-line p{font-size:11px;line-height:1.4;margin-top:2px}
 .status-symbol{display:grid;place-items:center;position:relative;isolation:isolate;overflow:hidden;flex:0 0 38px;width:38px;height:38px;box-sizing:border-box;border-radius:10px;background:color-mix(in srgb,var(--status-accent) 13%,transparent);color:var(--status-accent)}
 .status-symbol svg{display:block;width:22px;height:22px;position:relative;z-index:1}.status-symbol::after{content:none}
 .car-stage::before{animation:none!important}
 .live-readings{align-items:stretch}.live-readings>div{display:grid;grid-template-rows:auto auto auto;gap:2px;align-content:start;box-sizing:border-box;min-height:0;padding:12px}
 .live-readings .eyebrow{font-size:11px;line-height:1.4;margin:0}.live-readings .live-value{font-size:24px;line-height:1.25;font-weight:650;margin:0;letter-spacing:-.03em}.live-readings .live-sub{font-size:11px;line-height:24px;align-self:stretch;min-height:24px;margin:0}
 @supports(grid-template-rows:subgrid){.live-readings{grid-template-rows:auto auto auto;row-gap:2px}.live-readings>div{grid-row:span 3;grid-template-rows:subgrid}}
 .battery-track{height:12px;border-radius:7px;background:color-mix(in srgb,var(--secondary-background-color) 80%,var(--ha-card-background,var(--card-background-color,#fff)));isolation:isolate}
 .battery-fill{position:relative;overflow:hidden;isolation:isolate;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color,#2196f3) 85%,#fff),var(--primary-color,#2196f3))}
 .target-marker{top:-3px;height:18px;z-index:3;pointer-events:none}
 .battery-fill::before{content:none;position:absolute;inset:0 auto 0 0;width:42%;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 0%,#ffffff22 20%,#ffffffbb 43%,#fffffff2 52%,#ffffff88 63%,transparent 100%)}
 @media(prefers-reduced-motion:no-preference){
  .content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{content:'';animation:battery-sweep var(--power-duration,6s) linear infinite;animation-play-state:var(--power-motion,paused);animation-delay:var(--power-delay,0s)}
 }
 @keyframes battery-sweep{0%{transform:translateX(-110%);opacity:0}8%{opacity:1}90%{opacity:1}100%{transform:translateX(250%);opacity:0}}
 :host([data-motion=paused]) *,:host([data-motion=paused]) ::before,:host([data-motion=paused]) ::after{animation-play-state:paused!important}
`;

export const evccGalleryStyles=`
 .gallery-top{position:relative;isolation:isolate;margin:-16px -16px 16px;padding:16px 16px 0;background:linear-gradient(150deg,color-mix(in srgb,var(--evcc-glow) 5%,transparent),color-mix(in srgb,var(--evcc-glow) 5%,transparent) 36%,color-mix(in srgb,var(--evcc-glow) 14%,transparent) 36.2%,color-mix(in srgb,var(--evcc-glow) 4%,transparent) 78%,transparent 78.2%)}
 .hero{position:relative;isolation:isolate;padding:6px 16px 0;margin:0 -16px;background:none}
 .car-name{font-size:11px;text-transform:uppercase;letter-spacing:.12em}.car-stage{display:block;min-height:268px;padding:0}.car-stage::before{inset:50px -16px 0;background:radial-gradient(ellipse at 65% 65%,color-mix(in srgb,var(--evcc-glow) 23%,transparent),transparent 69%)}.car-stage::after{bottom:18px;left:10%;right:2%}
 .battery-row{position:relative;z-index:1;gap:0;pointer-events:none}.battery-row button{pointer-events:auto}.battery-value{font-size:76px;font-weight:500;letter-spacing:-.065em;line-height:1.15}.battery-meta{margin-top:1px}.range,.target{font-size:11px}
 .picture{position:absolute;right:-12px;bottom:0;width:86%;height:145px;min-height:0}.picture img{width:112%;height:145px;margin-left:-12%}.battery-track{height:3px}.hero>.battery-track{margin-top:0}
 .status-line{padding:10px 12px;background:var(--secondary-background-color);border:0;border-radius:7px;margin-bottom:8px}
 .live-readings{gap:16px;border:0;padding:0}.live-readings>div{padding:10px 12px;background:var(--secondary-background-color);border:0;border-radius:7px}.live-value{font-size:24px}
 .mode-options{margin-top:0}.solar-setting{margin-top:16px;padding:12px;background:var(--secondary-background-color);border-radius:7px}.solar-setting-head{gap:10px;align-items:center}.solar-setting-head label{display:flex;align-items:center;gap:9px;min-width:0;font-size:11px}.solar-setting-head ha-icon{--mdc-icon-size:18px;flex:none;padding:7px;border-radius:50%;background:color-mix(in srgb,var(--primary-color) 12%,transparent);color:var(--primary-color)}.solar-title{display:flex;flex-direction:column;gap:1px}.solar-title strong{font-size:11px;font-weight:600;line-height:1.4;color:var(--primary-text-color)}.solar-title small{font-size:10px;line-height:1.4;color:var(--secondary-text-color)}.solar-setting-head output{flex:none;color:var(--primary-color);font-size:18px;font-weight:600;letter-spacing:-.02em;padding:5px 8px;border-radius:6px;background:var(--ha-card-background)}
 input[data-solar-share]{appearance:none;-webkit-appearance:none;height:36px;margin:6px 0 0;background:transparent;--solar-position:60%;--solar-track:color-mix(in srgb,var(--secondary-background-color) 80%,var(--ha-card-background,var(--card-background-color,#fff)));touch-action:pan-y}
 input[data-solar-share]::-webkit-slider-runnable-track{height:12px;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 85%,#fff),var(--primary-color)) left / var(--solar-position) 100% no-repeat,var(--solar-track)}
 input[data-solar-share]::-moz-range-track{height:12px;border-radius:7px;background:var(--solar-track)}input[data-solar-share]::-moz-range-progress{height:12px;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 85%,#fff),var(--primary-color))}
 input[data-solar-share]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;box-sizing:border-box;width:16px;height:22px;border-radius:5px;background:var(--ha-card-background,var(--card-background-color,#fff));border:2px solid var(--primary-color);box-shadow:0 1px 3px #0002;margin-top:-5px}
 input[data-solar-share]::-moz-range-thumb{box-sizing:border-box;width:16px;height:22px;border-radius:5px;background:var(--ha-card-background,var(--card-background-color,#fff));border:2px solid var(--primary-color);box-shadow:0 1px 3px #0002}
 .solar-setting-head output{padding:0;border-radius:0;background:transparent;font-variant-numeric:tabular-nums}
 .solar-scale{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:10px;color:var(--secondary-text-color);margin:0 1px 10px;font-variant-numeric:tabular-nums}.solar-scale span:first-child,.solar-scale span:last-child{display:flex;flex-direction:column;gap:1px}.solar-scale span:last-child{text-align:right}.solar-scale b{font-size:10px;font-weight:400;color:var(--primary-text-color)}.solar-hint{line-height:1.5;padding-top:10px;border-top:1px solid var(--divider-color)}
 .solar-setting{padding:0;background:transparent;border:0;border-radius:0}.solar-scale{margin-bottom:0}
 .car-stage{min-height:264px}.session-summary [data-field=solar_percentage]{grid-column:1;grid-row:3}
 @container(max-width:320px){.battery-value{font-size:65px}.car-stage{min-height:246px}.picture{width:94%;height:125px}.picture img{height:125px}}

.plot{height:112px}.solar-title{display:flex;flex-direction:column}.solar-setting [data-solar-output]{color:inherit;flex:none;min-width:52px}.solar-metric{grid-template-columns:minmax(0,1fr)}.solar-metric dd{display:flex;align-items:center;gap:16px}.solar-metric input[data-solar-share]{flex:1;min-width:0;width:0;margin:0}
 /* Zoom the image inside a fixed viewport; scaling must not resize the header. */
 .car-stage{min-height:240px}
 .picture{width:100%;height:auto;top:0;left:0;right:0;bottom:8px;overflow:hidden;z-index:2;pointer-events:none}
 .picture img{position:absolute;inset:auto auto 0 50%;left:calc(50% + var(--evcc-image-offset-x,0px));bottom:calc(-1 * var(--evcc-image-offset-y,0px));margin:0;width:86%;height:145px;max-width:none;max-height:none;min-width:0;min-height:0;object-fit:contain;transform:translateX(-50%) scale(var(--evcc-image-scale,1));transform-origin:center bottom}
 @container(max-width:320px){.car-stage{min-height:222px}.picture img{width:94%;height:125px}}
 /* Share the top row so title and SOC stay aligned, including offline notices. */
 .car-stage{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;align-content:start;align-items:start}
 .car-stage .battery-row{grid-column:1;grid-row:1;margin-top:-20px}
 .car-stage header{grid-column:2;grid-row:1;align-self:start;flex-direction:column;align-items:flex-end;justify-content:flex-start;gap:2px;min-width:0;margin:-20px 0 0;padding-top:17px;text-align:right}
 .car-stage header h2{max-width:100%}
 .car-stage header .range{justify-content:flex-end;text-align:right;max-width:100%}
 /* Optical alignment compensates for the larger SOC font's space above its digits. */
 @container(max-width:320px){.car-stage .battery-row,.car-stage header{margin-top:-17px}.car-stage header{padding-top:14px}}
`;
