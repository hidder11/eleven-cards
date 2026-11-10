// Optional browser regression checks: ?checks=1. Never captures images.
export async function runPopupChecks(studies){
 const checks=[],tick=()=>new Promise(resolve=>setTimeout(resolve,60));
 const check=(name,pass)=>{if(!pass)throw Error(name);checks.push(name);};
 const output=document.querySelector('#checks');
 try{
  for(const card of studies){
   const variant=card.getAttribute('variant'),opener=document.querySelector(`[data-demo="${variant}"]`);
   opener.focus();opener.click();await tick();
   const dialog=card._viewer,player=card._tiles.get('camera.front').player.card;
   check(variant+': native modal opens with one active camera',dialog.open&&dialog.matches(':modal')&&!!player&&[...card._tiles.values()].filter(tile=>!!tile.player.card).length===1);
   check(variant+': media and controls fit the window',dialog.scrollWidth<=dialog.clientWidth&&dialog.getBoundingClientRect().height<=innerHeight&&dialog.querySelector('.camera-frame').clientHeight>0);
   check(variant+': only the compact detection pair is visible',dialog.querySelectorAll('.study-detections .camera-detection-indicator').length===2&&getComputedStyle(dialog.querySelector('.camera-tile-footer')).display==='none');
   card.hass={...card.hass};await tick();check(variant+': state updates preserve the current player',card._tiles.get('camera.front').player.card===player);
   const select=variant==='cinema'?dialog.querySelector('[data-camera-view-step="1"]'):dialog.querySelector('[data-study-pick="camera.garden"]');
   select.focus();select.click();await tick();
   check(variant+': switching selects one matching camera',card._viewerEntity==='camera.garden'&&!!card._tiles.get('camera.garden').player.card&&!card._tiles.get('camera.front').player.card&&dialog.querySelector('h2').textContent==='Tuin');
   check(variant+': switching retains control focus',card.shadowRoot.activeElement===select);
   card.scenario='offline';card.refreshStudy();await tick();
   check(variant+': offline stops playback and shows its message',[...card._tiles.values()].every(tile=>!tile.player.card)&&!!dialog.querySelector('.camera-message:not([hidden])'));
   card.scenario='person';card.refreshStudy();await tick();
   dialog.dispatchEvent(new Event('cancel',{cancelable:true}));await tick();
   check(variant+': cancel closes the modal and restores focus',!dialog.open&&getComputedStyle(dialog).display==='none'&&document.activeElement===opener);
   const sampleOpener=card._sample.querySelector('.study-picture-open');sampleOpener.focus();sampleOpener.click();await tick();
   card._closeViewer();await tick();
   check(variant+': opening from the small preview also restores focus',sampleOpener.isConnected&&card.shadowRoot.activeElement===sampleOpener);
  }
  const examples=document.querySelector('.examples');examples.dataset.width='narrow';document.body.classList.add('light');
  for(const card of studies){card.scenario='long';card.refreshStudy();}await tick();
  for(const card of studies){check(card.getAttribute('variant')+': long names fit a narrow light preview',card._sample.scrollWidth<=card._sample.clientWidth&&card._sample.querySelector('h2').textContent.includes('garage'));}
  document.body.classList.remove('light');examples.dataset.width='standard';for(const card of studies){card.scenario='person';card.refreshStudy();}
  output.textContent=JSON.stringify({pass:true,checks},null,2);
 }catch(error){output.textContent=JSON.stringify({pass:false,checks,error:error.message},null,2);}
}
