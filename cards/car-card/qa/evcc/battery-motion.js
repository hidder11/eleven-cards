// Isolated animation proposals; the underlying fill always remains the measured SOC.
import './battery-concepts.js';
const motion=`
 .battery-fill{position:relative;overflow:hidden;isolation:isolate}
 .battery-fill::before{content:none;pointer-events:none;position:absolute;inset:0;border-radius:inherit;z-index:1}
 @media(prefers-reduced-motion:no-preference){
  .content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{content:'';animation-duration:var(--power-duration,6s);animation-timing-function:linear;animation-iteration-count:infinite;animation-play-state:var(--power-motion,paused);animation-delay:var(--power-delay,0s)}
 }
`;
const effects={
 'sweep-selected':`.battery-track{height:12px;border-radius:12px}.battery-fill{border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 85%,#fff),var(--primary-color))}.target-marker{top:-3px;height:18px}.vehicle-motion{display:none}.vehicle-motion::before,.vehicle-motion::after,.car-stage::before,.car-stage::after{animation:none!important}.battery-fill::before{inset:0 auto 0 0;width:42%;background:linear-gradient(105deg,transparent 0%,#ffffff22 20%,#ffffffbb 43%,#fffffff2 52%,#ffffff88 63%,transparent 100%)}@media(prefers-reduced-motion:no-preference){.content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{animation-name:bar-sweep-selected}}@keyframes bar-sweep-selected{0%{transform:translateX(-110%);opacity:0}8%{opacity:1}90%{opacity:1}100%{transform:translateX(250%);opacity:0}}`,
 sweep:`.battery-fill::before{inset:0 auto 0 0;width:35%;background:linear-gradient(90deg,transparent,#ffffff88,transparent)}@media(prefers-reduced-motion:no-preference){.content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{animation-name:bar-sweep}}@keyframes bar-sweep{0%,10%{transform:translateX(-110%);opacity:0}20%{opacity:1}85%{opacity:1}100%{transform:translateX(390%);opacity:0}}`,
 stripes:`.battery-fill::before{background:repeating-linear-gradient(115deg,transparent 0 12px,#ffffff44 12px 24px);background-size:53px 100%;opacity:.65}@media(prefers-reduced-motion:no-preference){.content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{animation-name:bar-stripes}}@keyframes bar-stripes{from{background-position:-53px 0}to{background-position:53px 0}}`,
 particles:`.battery-fill::before{background-image:radial-gradient(circle at 5px 50%,#ffffffcc 0 1.2px,transparent 2px);background-size:26px 100%;opacity:.85}@media(prefers-reduced-motion:no-preference){.content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{animation-name:bar-particles}}@keyframes bar-particles{from{background-position:-26px 0}to{background-position:78px 0}}`,
 breath:`.battery-fill::before{background:linear-gradient(90deg,transparent,#ffffff66 75%,#ffffff99)}@media(prefers-reduced-motion:no-preference){.content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{animation-name:bar-breathe;animation-timing-function:ease-in-out}}@keyframes bar-breathe{0%,100%{opacity:.05}50%{opacity:.65}}`
};
for(const card of window.evccBattery.cards){
 const render=card._render.bind(card);
 card._render=()=>{render();const root=card.shadowRoot;if(!root.querySelector('.battery-fill')||root.querySelector('[data-bar-motion]'))return;const style=document.createElement('style');style.dataset.barMotion='';style.textContent=motion+effects[card.dataset.effect];root.append(style);};
}
window.evccBattery.sync();
