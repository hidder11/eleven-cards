export async function runCameraViewerChecks(){
 const {source,viewer,config,update}=window.viewerQA,checks=[];
 const tick=()=>new Promise(resolve=>setTimeout(resolve,60));
 const check=(name,condition)=>{if(!condition)throw Error(name);checks.push(name);};
 const select=entity=>source.shadowRoot.querySelector(`[data-camera-details="${entity}"]`).click();
 const hasPlayer=()=>[...viewer._tiles.values()].some(tile=>tile.player.card);
 await tick();check('Viewer starts empty',viewer._config.cameras.length===0);
 const lateSource=document.createElement('eleven-camera-card'),lateViewer=document.createElement('eleven-camera-viewer-card'),lateOther=document.createElement('eleven-camera-card');
 lateSource.setConfig({...config,viewer_target:'late-viewer'});lateOther.setConfig({...config,viewer_target:'late-viewer'});lateSource.hass=source.hass;lateOther.hass=source.hass;document.body.append(lateSource,lateOther);
 const missing=card=>!card.shadowRoot.querySelector('.camera-viewer-feedback').hidden;
 check('Sources mounted first report missing viewer before any selection',missing(lateSource)&&missing(lateOther));
 lateViewer.setConfig({viewer_id:'late-viewer'});lateViewer.hass=source.hass;document.body.append(lateViewer);
 check('Viewer attachment clears every source warning synchronously without hass update',!missing(lateSource)&&!missing(lateOther)&&lateViewer._config.cameras.length===0);
 lateViewer.remove();check('Viewer removal restores every source warning without hass update',missing(lateSource)&&missing(lateOther));
 document.body.append(lateViewer);lateSource.setConfig({...config,viewer_target:'different-viewer'});check('Retargeting unregisters source from old viewer',missing(lateSource)&&!missing(lateOther));
 lateSource.remove();lateOther.remove();lateViewer.remove();
 const heading=()=>viewer.shadowRoot.querySelector('.camera-security-header').textContent;
 check('Default viewer title is generic Dutch',heading()==='Cameraviewer');
 viewer.hass={...viewer.hass,language:'en',locale:{language:'en'}};check('Default viewer title follows frontend language',heading()==='Camera viewer');update();
 viewer.setConfig({viewer_id:'woonkamer',title:'Eigen titel'});check('Viewer title can be customized',heading()==='Eigen titel');viewer.setConfig({viewer_id:'woonkamer'});
 let details=0;source.addEventListener('hass-more-info',()=>details++);
 select('camera.front');await tick();check('Name selects camera',viewer._activeCamera==='camera.front'&&hasPlayer());check('Linked name suppresses native details',details===0);
 const player=viewer._tiles.get('camera.front').player.card;update();await tick();check('State updates preserve running player',viewer._tiles.get('camera.front').player.card===player);
 source._tiles.get('camera.garden').frame.click();await tick();check('Feed click switches viewer',viewer._activeCamera==='camera.garden'&&hasPlayer()&&player.isConnected===false);
 const other=document.createElement('eleven-camera-viewer-card');other.setConfig({viewer_id:'other'});other.hass=viewer.hass;document.body.append(other);await tick();select('camera.front');await tick();check('Other IDs remain empty',other._config.cameras.length===0);other.remove();
 source.setConfig({...config,cameras:[{...config.cameras[0],show:false},config.cameras[1]]});await tick();check('Hidden source camera clears viewer',viewer._config.cameras.length===0&&!hasPlayer());source.setConfig(config);await tick();
 const parent=source.parentNode;source.remove();await tick();check('Removing source clears viewer',!hasPlayer()&&viewer._config.cameras.length===0);parent.append(source);await tick();select('camera.garden');await tick();check('Reattached source selects again',hasPlayer());
 viewer.remove();await tick();check('Removing viewer stops streams',!hasPlayer());document.querySelector('.cards article:last-child').append(viewer);await tick();check('Remounted viewer follows selection',hasPlayer());
 source.setConfig({...config,viewer_target:''});await tick();check('Unlink clears viewer',!hasPlayer());select('camera.front');check('Unlinked name opens native details',details===1);source.setConfig(config);select('camera.front');await tick();
 const backgroundEditor=await viewer.constructor.getConfigElement(),editor=backgroundEditor._nativeEditor;editor.setConfig({viewer_id:'woonkamer'});editor.hass=source.hass;const fields=editor._form.schema.flatMap(group=>group.schema??[group]);check('Viewer editor exposes ID and appearance',fields.some(field=>field.name==='viewer_id')&&!fields.some(field=>field.name==='cameras')&&!fields.some(field=>field.name==='camera_entities'));
 check('Viewer editor exposes name, status, detection time and fullscreen', ['show_names','show_status','show_last_detection','show_fullscreen'].every(name=>fields.some(field=>field.name===name)&&editor._form.data[name]===true));
 const normalSize=viewer.getCardSize();source.setConfig({...config,aspect_ratio:'9:16'});select('camera.front');await tick();check('Portrait viewer measures its real height',viewer.getGridOptions().rows==='auto'&&viewer.getCardSize()>normalSize);source.setConfig(config);select('camera.front');await tick();
 source.setConfig({...config,viewer_target:'missing-review-viewer'});source._openLinkedViewer('camera.front');await tick();check('Missing viewer gives visible feedback',!source.shadowRoot.querySelector('.camera-viewer-feedback').hidden&&source.shadowRoot.querySelector('.camera-viewer-feedback').textContent.includes('missing-review-viewer'));source.setConfig(config);select('camera.front');await tick();check('Connected viewer clears feedback',source.shadowRoot.querySelector('.camera-viewer-feedback').hidden);
 const viewerInput=viewer._viewerInput;viewer.setConfig({...viewerInput,card_background:{variant:'isobars',enabled:true,animated:false}});await tick();check('Viewer uses shared background',!!viewer.shadowRoot.querySelector('[data-ui-card-background]'));viewer.setConfig({...viewerInput,card_background:false});await tick();check('Viewer disables shared background',!viewer.shadowRoot.querySelector('[data-ui-card-background]'));viewer.setConfig(viewerInput);
 const savedViewer=viewer._viewerInput;viewer.setConfig({...savedViewer,show_names:false,show_status:false,show_last_detection:false,show_fullscreen:false});await tick();const selectedTile=viewer._tiles.get('camera.front');check('Viewer display options affect the selected camera',selectedTile.name.hidden&&selectedTile.section.querySelector('.camera-status').hidden&&selectedTile.section.querySelector('.camera-last-detection').hidden&&selectedTile.section.querySelector('[data-camera-fullscreen]').hidden);viewer.setConfig(savedViewer);
 backgroundEditor.setConfig({...savedViewer,card_background:{variant:'isobars',enabled:true}});backgroundEditor.hass=source.hass;let savedEdit;backgroundEditor.addEventListener('config-changed',event=>savedEdit=event.detail.config);editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{show_names:false}}}));check('Viewer editor retains shared background and selected fields',savedEdit?.show_names===false&&savedEdit.card_background.variant==='isobars');
 for(const light of [true,false]){document.body.classList.toggle('light',light);document.querySelector('.cards').classList.add('narrow');update();await tick();check('Narrow layout fits '+(light?'light':'dark'),[source,viewer].every(card=>card.shadowRoot.querySelector('ha-card').scrollWidth<=card.getBoundingClientRect().width+1));}
 document.querySelector('.cards').classList.remove('narrow');update();
 const offline={...viewer.hass,connected:false};source.hass=offline;viewer.hass=offline;await tick();check('Offline stops playback',!hasPlayer());update();await tick();
 const unavailable={...viewer.hass,states:{...viewer.hass.states,'camera.front':{state:'unavailable'}}};source.hass=unavailable;viewer.hass=unavailable;await tick();check('Unavailable selection stops playback',!hasPlayer());update();await tick();
 const privacyConfig={...config,cameras:config.cameras.map(row=>row.entity==='camera.front'?{...row,privacy_entity:'switch.legacy_privacy'}:row)};
 source.setConfig(privacyConfig);
 for(const state of ['on','unknown','unavailable',null,'off']){
  const h={...source.hass,states:{...source.hass.states}};if(state===null)delete h.states['switch.legacy_privacy'];else h.states['switch.legacy_privacy']={state};source.hass=h;viewer.hass=h;await tick();
  check('Linked viewer respects legacy privacy '+state,hasPlayer()===(state==='off'));
 }
 check('Legacy mapping remains in source and viewer configurations',source._config.cameras[0].privacy_entity==='switch.legacy_privacy'&&viewer._config.cameras[0].privacy_entity==='switch.legacy_privacy');source.setConfig(config);update();await tick();
 source.setConfig({...config,profiles:[{id:'garden',cameras:['camera.garden']}]});source._profileSelection='garden';source._applyProfile();source._render();await tick();check('Viewer follows the effective source configuration',viewer._config.cameras[0]?.entity===source._config.cameras.find(row=>row.show!==false&&row.entity==='camera.front')?.entity);source._profileSelection='auto';source.setConfig(config);select('camera.front');await tick();
 await import('/cards/camera-card/dist/eleven-camera-card-test.js');
 const testSource=document.createElement('eleven-camera-card-test'),testViewer=document.createElement('eleven-camera-viewer-card-test');testSource.setConfig(config);testViewer.setConfig({viewer_id:'woonkamer'});testSource.hass=source.hass;testViewer.hass=source.hass;document.body.append(testSource,testViewer);await tick();check('Test viewer does not follow production source',testViewer._config.cameras.length===0);testSource._openLinkedViewer('camera.garden');await tick();check('Test links stay isolated from production',testViewer._activeCamera==='camera.garden'&&viewer._activeCamera==='camera.front');testSource.remove();testViewer.remove();
 document.querySelector('#checks').textContent=JSON.stringify({pass:true,checks},null,2);
 return checks;
}
