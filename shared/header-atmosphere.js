// Decorative header layers; all paint inherits the weather state's --tone.
export function observeCardMotion(host,onVisibility=()=>{}){
 if(typeof document==='undefined'||typeof host.toggleAttribute!=='function')return ()=>{};
 let visible=true;
 const update=()=>{host.toggleAttribute('data-motion-paused',document.hidden||!visible);onVisibility();};
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);update();}):null;
 observer?.observe(host);document.addEventListener('visibilitychange',update);update();
 return ()=>{observer?.disconnect();document.removeEventListener('visibilitychange',update);};
}
export function headerAtmosphere(background){
 if(!['aurora','clouds','isobars'].includes(background))return '';
 let body='';
 if(background==='aurora')body=Array.from({length:32},(_,i)=>`<i style="--star-x:${i*37%100}%;--star-y:${i*19%72}%;--star-duration:${2+i%5}s;--star-delay:${-i*.37}s"></i>`).join('');
 if(background==='isobars')body='<svg class="weather-isobars" viewBox="0 0 600 340" preserveAspectRatio="none" focusable="false">'+Array.from({length:10},(_,i)=>`<path d="M-40 ${40+i*27}C100 ${-90+i*27} 235 ${270+i*10} 370 ${105+i*15}S580 ${-20+i*28} 650 ${85+i*29}"/>`).join('')+Array.from({length:4},(_,i)=>`<path class="weather-front" d="M-40 ${67+i*54}C100 ${-63+i*54} 235 ${280+i*20} 370 ${120+i*30}S580 ${8+i*56} 650 ${114+i*58}"/>`).join('')+'</svg>';
 return `<div class="header-atmosphere" aria-hidden="true">${body}</div>`;
}

export const headerAtmosphereStyles=`
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
