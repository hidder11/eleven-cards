import {CameraCard} from '../src/camera-card.js';
import {cameraDetections,visibleCameras} from '../src/camera-utils.js';
import {cameraDetectionIndicators} from '../src/camera-security.js';
import {uiEscape} from '../../../shared/ui-button.js';
import {securityDesignConfig,securityDesignHass} from './security-design-data.js';
import {scene} from './security-scene.js';
import './fixture-icons.js';

// Synthetic-only design studies; reuse the real viewer and player lifecycle.
class PopupStudyFeed extends HTMLElement{
 set hass(value){if(this.firstChild)return;this.innerHTML=scene(this.config.entity==='camera.garden');this.style.cssText='display:block;height:100%';this.firstChild.style.cssText='display:block;width:100%;height:100%';}
}
if(!customElements.get('popup-study-feed'))customElements.define('popup-study-feed',PopupStudyFeed);
window.loadCardHelpers=async()=>({createCardElement:config=>{const feed=document.createElement('popup-study-feed');feed.config=config;return feed;}});

class SecurityPopupStudy extends CameraCard{
 connectedCallback(){
  super.connectedCallback();
  if(!this._studyBound){
   this._studyBound=true;
   this.shadowRoot.addEventListener('click',event=>{
    const pick=event.target.closest?.('[data-study-pick]'),open=event.target.closest?.('[data-study-open]');
    if(pick&&visibleCameras(this._config).some(row=>row.entity===pick.dataset.studyPick)){
     this._viewerEntity=pick.dataset.studyPick;this._render();
    }
    if(open)this._openViewer(open.dataset.studyOpen,open);
   });
  }
  this.refreshStudy();
 }
 refreshStudy(){
  const config=structuredClone(securityDesignConfig);config.show_activity=false;config.alarm_entity='';
  if(this.scenario==='long')config.cameras[0].name='Voordeur en toegang naast de garage';
  this.setConfig(config);this.hass=securityDesignHass(this.scenario==='long'?'person':this.scenario??'person',document.body.classList.contains('light'));
 }
 _render(){
  super._render();if(!this._featureShell||!this._hass)return;
  if(!this.shadowRoot.querySelector('[data-popup-study-styles]')){
   const style=document.createElement('style');style.dataset.popupStudyStyles='';style.textContent=styles;this.shadowRoot.append(style);
  }
  this._renderSample();
 }
 _indicators(entity){return cameraDetectionIndicators(cameraDetections(this._hass,this._config.cameras.find(row=>row.entity===entity)).entries,(a,b)=>a);}
 _picker(active,sample=false){
  return `<nav class="study-picker" aria-label="Camera kiezen">${visibleCameras(this._config).map(row=>`<button type="button" ${sample?'data-study-open':'data-study-pick'}="${uiEscape(row.entity)}" aria-pressed="${row.entity===active}"><span class="study-thumbnail" aria-hidden="true">${scene(row.entity==='camera.garden')}</span><span>${uiEscape(this._cameraName(row.entity))}</span></button>`).join('')}</nav>`;
 }
 _renderSample(){
  if(!this._sample){this._sample=document.createElement('section');this._sample.className='camera-viewer popup-sample';this._sample.setAttribute('open','');this._sample.setAttribute('aria-label','Voorbeeld van de camerapopup');this.shadowRoot.append(this._sample);}
  const entity='camera.front',name=uiEscape(this._cameraName(entity)),variant=this.getAttribute('variant');this._sample.dataset.design=variant;
  const unavailable=['unknown','offline'].includes(this.scenario);
  const picture=unavailable?'<div class="study-unavailable">Camerabeeld niet beschikbaar</div>':scene(entity==='camera.garden');
  const markup=`<header class="camera-viewer-header"><div><h2>${name}</h2></div><div class="study-detections">${this._indicators(entity)}</div><button class="camera-viewer-close" data-study-open="${uiEscape(entity)}" aria-label="Optie vergroten"><ha-icon icon="mdi:arrow-expand" aria-hidden="true"></ha-icon></button></header><div class="camera-viewer-body"><button class="study-picture-open" data-study-open="${uiEscape(entity)}" aria-label="Popup openen: ${name}">${picture}</button></div><footer class="camera-viewer-footer"><button data-study-open="camera.garden" aria-label="Andere camera openen"><ha-icon icon="mdi:chevron-left"></ha-icon></button><span class="camera-viewer-position">${entity==='camera.front'?1:2} / 2</span><button data-study-open="camera.garden" aria-label="Andere camera openen"><ha-icon icon="mdi:chevron-right"></ha-icon></button></footer>${this._picker(entity,true)}`;
  if(this._sampleMarkup!==markup){this._sampleMarkup=markup;this._sample.innerHTML=markup;}
 }
 _renderViewer(){
  super._renderViewer();if(!this._viewerEntity||!this._viewer)return;
  const dialog=this._viewer;dialog.dataset.design=this.getAttribute('variant');
  let indicators=dialog.querySelector('.study-detections');
  if(!indicators){indicators=document.createElement('div');indicators.className='study-detections';dialog.querySelector('.camera-viewer-close').before(indicators);}
  const markup=this._indicators(this._viewerEntity);if(indicators.innerHTML!==markup)indicators.innerHTML=markup;
  const previous=dialog.querySelector('.study-picker'),next=this._picker(this._viewerEntity);
  // Keep the actual picker buttons and focus stable while states change.
  if(!previous){dialog.insertAdjacentHTML('beforeend',next);}
  else for(const button of previous.querySelectorAll('[data-study-pick]')){
   button.setAttribute('aria-pressed',String(button.dataset.studyPick===this._viewerEntity));
   button.lastElementChild.textContent=this._cameraName(button.dataset.studyPick);
  }
  for(const button of dialog.querySelectorAll('[data-camera-view-step]'))button.setAttribute('aria-label',button.dataset.cameraViewStep==='-1'?'Vorige camera':'Volgende camera');
 }
}

const styles=`
:host{display:block;height:auto;min-width:0}.camera-viewer-tools,.camera-viewer-picker{display:none}.camera-viewer-footer{display:flex}.camera-viewer[data-design]:not([open]){display:none}ha-card{display:none!important}.camera-viewer{position:relative;isolation:isolate}.camera-viewer[data-design]{width:min(1120px,calc(100vw - 32px));border:1px solid var(--divider-color);border-radius:12px}.camera-viewer-header{grid-area:heading;gap:10px;padding:10px 16px;min-height:60px}.camera-viewer-header>div:first-child{flex:1}.camera-viewer-header h2{font-size:15px;line-height:20px;font-weight:500}.camera-viewer-header p{display:none}.camera-viewer-close{width:40px;height:40px;--mdc-icon-size:20px}.study-detections{display:flex;flex:none;gap:0}.study-detections .camera-detection-indicator{width:32px;height:32px;padding:4px}.study-detections .camera-detection-symbol svg{width:19px;height:19px}.camera-viewer-body{grid-area:picture;min-width:0;background:#111820;overflow:hidden}.camera-viewer .camera-tile:not(:fullscreen){padding:0;border-radius:0;box-shadow:none}.camera-viewer .camera-tile .camera-frame{border-radius:0;max-height:calc(100dvh - 180px)}.camera-viewer .camera-tile-footer{display:none}.camera-viewer-footer{grid-area:controls;padding:10px 16px;gap:6px;border:0}.camera-viewer-footer [data-camera-view-step]{display:grid;place-items:center;width:40px;min-height:40px;border:1px solid var(--divider-color);border-radius:7px;padding:6px}.camera-viewer-footer [data-camera-view-step]>span{display:none}.camera-viewer-footer ha-icon{display:block}.camera-viewer>.camera-action-error{grid-area:feedback}.study-picker{grid-area:picker;display:flex;gap:8px;padding:12px;min-width:0;overflow:auto;border-top:1px solid var(--divider-color);background:var(--secondary-background-color)}.study-picker button{display:grid;gap:6px;flex:1;min-width:0;align-content:start;padding:7px;border:1px solid var(--divider-color);border-radius:7px;background:var(--ha-card-background);color:var(--primary-text-color);font:inherit;font-size:12px;text-align:start;cursor:pointer;overflow-wrap:anywhere}.study-picker button[aria-pressed=true]{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,var(--ha-card-background))}.study-thumbnail{display:block;width:96px;max-width:100%;border-radius:4px;overflow:hidden}.study-thumbnail svg{display:block;width:100%;height:auto;aspect-ratio:16/9}.study-picker button:focus-visible,.study-picture-open:focus-visible{outline:2px solid var(--primary-color);outline-offset:-3px}.camera-viewer[data-design=cinema]{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:'picture picture' 'heading controls' 'feedback feedback'}.camera-viewer[data-design=cinema] .camera-viewer-header{padding-inline-end:0}.camera-viewer[data-design=cinema] .camera-viewer-close{position:absolute;z-index:3;top:12px;right:12px;background:#111820dd;color:#fff;border:1px solid #ffffff40}.camera-viewer[data-design=cinema] .study-picker{display:none}.camera-viewer[data-design=dock]{display:grid;grid-template-areas:'heading' 'picture' 'picker' 'feedback'}.camera-viewer[data-design=dock] .camera-viewer-footer,.camera-viewer[data-design=sidebar] .camera-viewer-footer{display:none}.camera-viewer[data-design=sidebar]{display:grid;grid-template-columns:minmax(0,1fr) 220px;grid-template-areas:'heading heading' 'picture picker' 'feedback feedback'}.camera-viewer[data-design=sidebar] .study-picker{display:grid;align-content:start;border-top:0;border-left:1px solid var(--divider-color)}.camera-viewer[data-design=sidebar] .study-picker button{grid-template-columns:68px minmax(0,1fr);align-items:center;min-height:62px;gap:10px}.study-picture-open{display:block;width:100%;padding:0;border:0;background:#111820;color:var(--primary-text-color);cursor:pointer}.study-picture-open>svg{display:block;width:100%;height:auto;aspect-ratio:16/9}.study-unavailable{display:grid;place-items:center;aspect-ratio:16/9;padding:16px;font-size:12px;color:var(--secondary-text-color);background:var(--secondary-background-color)}
.camera-viewer.popup-sample[data-design]{width:100%;max-height:none;margin:0;padding:0;box-shadow:none}.popup-sample .camera-viewer-header{padding:8px;min-height:44px;gap:4px}.popup-sample .camera-viewer-header h2{font-size:11px;line-height:16px}.popup-sample .camera-viewer-close{width:28px;height:28px;--mdc-icon-size:16px}.popup-sample .study-detections .camera-detection-indicator{width:24px;height:28px;padding:2px}.popup-sample .study-detections .camera-detection-symbol{width:20px;height:20px}.popup-sample .study-detections .camera-detection-symbol svg{width:16px;height:16px}.popup-sample .camera-viewer-footer{padding:6px;gap:2px}.popup-sample .camera-viewer-footer>button{display:grid;place-items:center;width:24px;height:28px;padding:2px;border:0;border-radius:4px;color:var(--primary-text-color);background:none;cursor:pointer;--mdc-icon-size:16px}.popup-sample .camera-viewer-position{font-size:10px}.popup-sample .study-picker{padding:7px;gap:6px}.popup-sample .study-picker button{padding:5px;gap:4px;font-size:10px}.popup-sample .study-thumbnail{width:64px}.camera-viewer.popup-sample[data-design=sidebar]{grid-template-columns:minmax(0,1fr) 108px}.popup-sample[data-design=sidebar] .study-picker button{grid-template-columns:minmax(0,1fr);min-height:0;gap:4px}.popup-sample[data-design=sidebar] .camera-viewer-body{align-self:stretch;display:grid;align-items:center}.popup-sample[data-design=cinema] .camera-viewer-close{top:8px;right:8px}
@media(max-width:720px){dialog.camera-viewer[data-design=sidebar]{grid-template-columns:minmax(0,1fr);grid-template-areas:'heading' 'picture' 'picker' 'feedback'}dialog.camera-viewer[data-design=sidebar] .study-picker{display:flex;border-left:0;border-top:1px solid var(--divider-color)}dialog.camera-viewer[data-design=sidebar] .study-picker button{grid-template-columns:minmax(0,1fr)}dialog.camera-viewer[data-design]{width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}dialog.camera-viewer .camera-viewer-header{padding:8px 12px}dialog.camera-viewer[data-design=cinema]{grid-template-columns:minmax(0,1fr);grid-template-areas:'picture' 'heading' 'controls' 'feedback'}dialog.camera-viewer[data-design=cinema] .camera-viewer-header{padding-right:12px}dialog.camera-viewer[data-design=cinema] .camera-viewer-footer{justify-content:center;padding-top:0}}
@container(max-width:300px){.popup-sample[data-design=cinema]{grid-template-columns:minmax(0,1fr);grid-template-areas:'picture' 'heading' 'controls'}.popup-sample[data-design=cinema] .camera-viewer-footer{justify-content:center;padding-top:0}}
`;

if(!customElements.get('security-popup-study'))customElements.define('security-popup-study',SecurityPopupStudy);
const studies=[...document.querySelectorAll('security-popup-study')];
document.querySelectorAll('[data-demo]').forEach(button=>button.onclick=()=>studies.find(card=>card.getAttribute('variant')===button.dataset.demo)._openViewer('camera.front',button));
document.querySelector('#scenario').onchange=event=>studies.forEach(card=>{card.scenario=event.target.value;card.refreshStudy();});
document.querySelector('#width').onchange=event=>document.querySelector('.examples').dataset.width=event.target.value;
document.querySelector('#theme').onchange=event=>{document.body.classList.toggle('light',event.target.value==='light');studies.forEach(card=>card.refreshStudy());};
window.popupStudies=studies;
document.querySelector('#checks').textContent='3 interactieve ontwerpen geladen. Open een optie om te wisselen tussen camera’s. Escape sluit het venster.';

if(new URLSearchParams(location.search).has('checks'))import('./security-popup-checks.js').then(module=>module.runPopupChecks(studies));
