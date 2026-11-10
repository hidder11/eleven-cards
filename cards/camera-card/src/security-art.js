// Classic Weather-style security artwork. Only fixed shapes and validated colours enter SVG.
import {securityStatusGroup} from './security-status.js';
let sequence=0;
export const SECURITY_ART_KINDS=['disarmed','armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass','arming','disarming','pending','triggered','unknown','camera'];
export function securityArt(state,color){
 const kind=SECURITY_ART_KINDS.includes(state)?state:'unknown';
 const group=kind==='camera'?'camera':securityStatusGroup(kind);
 color=/^#[0-9a-f]{6}$/i.test(color??'')?color:({disarmed:'#a2b9cb',armed:'#8cd6b7',transition:'#e8c477',unknown:'#a6b0c0',triggered:'#ed9690',camera:'#a2b9cb'}[group]);
 const id='security-weather-'+(++sequence),paint=name=>`url(#${id}-${name})`;
 const shell=paint('shell'),tone=paint('tone'),gold=paint('gold');
 const shield=`<path d="m80 28 39 16v34c0 26-22 43-39 51-17-8-39-25-39-51V44Z" fill="${tone}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="m52 50 26-11" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>`;
 const lock=(open=false)=>`<path d="M59 74V57a21 21 0 0 1 42 0${open?'':'v17'}" fill="none" stroke="${tone}" stroke-width="11" stroke-linecap="round"${open?' transform="rotate(18 59 74)"':''}/><rect x="47" y="72" width="66" height="49" rx="11" fill="${shell}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="M57 84h35" stroke="#fff" stroke-width="2" stroke-opacity=".5" stroke-linecap="round"/><circle cx="80" cy="93" r="5" fill="#526e89"/><path d="M80 96v10" stroke="#526e89" stroke-width="4" stroke-linecap="round"/>`;
 const clock=`<circle cx="108" cy="108" r="24" fill="${gold}" stroke="#ffe5a3" stroke-width="1.5"/><path d="M108 93v16l10 6" fill="none" stroke="#8c642f" stroke-width="3" stroke-linecap="round"/>`;
 const camera=`<rect x="32" y="52" width="90" height="65" rx="14" fill="${shell}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="M48 52v-9h29l8 9" fill="${tone}"/><path d="M44 63h29" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><circle cx="78" cy="85" r="23" fill="${tone}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="78" cy="85" r="13" fill="#476b87"/><path d="M71 81a8 8 0 0 1 11-3" stroke="#dff5ff" stroke-width="2" stroke-linecap="round"/>`;
 const objects={
  disarmed:lock(true),
  armed:shield+'<path d="m60 78 14 14 29-34" stroke="#f2f9ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  transition:shield+clock,
  triggered:`<path d="M46 112V77a34 34 0 0 1 68 0v35" fill="${tone}" stroke="#ffd5d1" stroke-width="1.5"/><rect x="36" y="108" width="88" height="16" rx="7" fill="${shell}" stroke="#ecf5ff" stroke-opacity=".5" stroke-width="1.5"/><path d="M58 75a22 22 0 0 1 20-20" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity=".45"/><path d="M80 20v10M29 44l9 7m93-7-9 7M19 83h11m111 0h-11" stroke="#ef9b94" stroke-width="3" stroke-linecap="round"/>`,
  unknown:'<circle cx="80" cy="70" r="34" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 8"/><path d="M70 58c0-16 25-16 25 0 0 11-15 9-15 20m0 10v3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  camera
 };
 return `<svg class="security-art" data-security-art="${kind}" data-security-group="${group}" style="color:${color}" viewBox="0 0 160 150" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-shell" x2=".2" y2="1"><stop stop-color="#f8fbff"/><stop offset=".5" stop-color="#c8d9ea"/><stop offset="1" stop-color="#91aac2"/></linearGradient><linearGradient id="${id}-tone" x2=".3" y2="1"><stop stop-color="#f0f6ff"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".7"/></linearGradient><linearGradient id="${id}-gold" x2=".3" y2="1"><stop stop-color="#fff0b4"/><stop offset=".5" stop-color="#f6ce6d"/><stop offset="1" stop-color="#eda743"/></linearGradient></defs><g class="security-art-body">${objects[group]}</g></svg>`;
}

export const securityArtStyles=`
.camera-security-header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:160px;position:relative;padding:0 0 16px}
.camera-primary{min-width:0;max-width:60%;position:relative;z-index:1;--ui-primary-size:48px}
.camera-security-art{display:grid;place-items:center;flex:0 0 94px;min-width:0;pointer-events:none}
.camera-security-art svg{display:block;width:94px;height:88px;max-width:100%;overflow:visible;filter:drop-shadow(0 2px 3px #1025360a);opacity:.92}
.content[data-animated=true] .security-art-body{animation:security-art-float 7s ease-in-out infinite;transform-origin:80px 80px}
@keyframes security-art-float{50%{transform:translateY(-3px)}}
@container(max-width:320px){.camera-security-header{min-height:136px}.camera-primary{--ui-primary-size:38px}.camera-security-art svg{height:70px;width:74px}}
.content[data-compact=true] .camera-security-header{min-height:112px}.content[data-compact=true] .camera-security-art svg{width:94px;height:88px}
:host([data-motion-paused]) .security-art-body{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){.security-art-body{animation:none!important}}
`;
