import {cardBackgroundSettings} from '../shared/card-background.js';

// Exercise the active renderer: supported legacy YAML is migrated to the shared
// background, while unsupported designs still use the native header renderer.
export async function assertCardBackground(card, check) {
 const root=card.shadowRoot,settings=cardBackgroundSettings(card._elevenBackgroundConfig);
 const shared=root.querySelector('[data-ui-card-background]');
 const native=root.querySelector('.scene-background,.header-background');
 if(settings.legacy){
  check('legacy background remains visible',!shared&&getComputedStyle(native).display!=='none');
  check('legacy header fades as a single layer',getComputedStyle(native).maskImage.includes('88%')&&getComputedStyle(native,'::before').maskImage==='none'&&getComputedStyle(native,'::after').maskImage==='none');
  check('legacy background follows header height',Math.abs(native.getBoundingClientRect().bottom-root.querySelector('.header-region').getBoundingClientRect().bottom)<1);
 }else{
  check('shared renderer hides the native background',getComputedStyle(native).display==='none');
  check('background enabled setting is respected',!!shared===settings.enabled);
  if(shared){
   const style=getComputedStyle(shared),box=shared.getBoundingClientRect();
   check('selected shared background is visible',shared.dataset.uiCardBackground===settings.variant&&box.width>0&&box.height>0&&style.display!=='none');
   check('shared header background fades before clipping',shared.dataset.uiBackgroundCoverage==='header'&&style.maskImage.includes('gradient')&&style.maskImage.includes('100%')&&style.clipPath!=='none');
  }
 }
}
