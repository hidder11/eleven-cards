import '../dist/eleven-camera-card.js';
import {alarmFixture} from './alarm-fixture.js';
import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
import {CameraEditor} from '../src/camera-editor.js';
class SimulatedCamera extends HTMLElement{
 set hass(hass){this._hass=hass;if(this.childNodes.length)return;this.innerHTML='<div style="height:100%;min-height:120px;display:grid;place-items:center;background:linear-gradient(150deg,#253c4d,#12222c);color:#c5d8dd;text-align:center;font:12px system-ui"><div><svg width="72" height="48" viewBox="0 0 72 48" aria-hidden="true"><path d="M8 40V20L26 5l18 15v20M4 42h64M50 42V27h13v15M22 42V28h10v14" fill="none" stroke="currentColor" stroke-width="2"/></svg><div>Gesimuleerd camerabeeld</div></div></div>';}
}
customElements.define('simulated-eleven-camera',SimulatedCamera);
let creations=0;
window.loadCardHelpers=async()=>({createCardElement:config=>{if(config.type==='alarm-panel')return alarmFixture(config);creations++;const player=document.createElement('simulated-eleven-camera');player.config=config;return player;}});
const cards=[document.querySelector('#grid'),document.querySelector('#tabs')];
const rows=[{entity:'camera.front',name:'Voordeur'},{entity:'camera.garden',name:'Achtertuin'}];
let offline=false,unavailable=false;
function update(){for(const card of cards)card.hass={...card.hass,connected:!offline,language:'nl',locale:{language:'nl'},config:{time_zone:'Europe/Amsterdam'},themes:{darkMode:!document.body.classList.contains('light')},states:{...card.hass?.states,'camera.front':{state:unavailable?'unavailable':'idle',attributes:{friendly_name:'Voordeur'}},'camera.garden':{state:'streaming',attributes:{friendly_name:'Achtertuin'}}}};}
cards.forEach((card,index)=>card.setConfig({cameras:rows,layout:index?'tabs':'grid',background:'ink'}));update();
document.querySelector('#theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';update();};
document.querySelector('#width').onclick=event=>{const narrow=document.querySelector('.cards').classList.toggle('narrow');event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
document.querySelector('#availability').onclick=event=>{unavailable=!unavailable;event.currentTarget.textContent=unavailable?'Voordeur herstellen':'Voordeur onbeschikbaar';update();};
document.querySelector('#offline').onclick=event=>{offline=!offline;event.currentTarget.textContent=offline?'Opnieuw verbinden':'Verbinding verbreken';update();};
const select=document.querySelector('#background');for(const option of headerBackgroundOptions(true)){const element=document.createElement('option');element.value=option.value;element.textContent=option.label;select.append(element);}select.value='ink';select.onchange=()=>{for(const card of cards)card.setConfig({...card._baseConfig,background:select.value});};
const tick=()=>new Promise(resolve=>setTimeout(resolve,30));
const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
try{
 await tick();
 check('Grid loads both native players',cards[0].shadowRoot.querySelectorAll('simulated-eleven-camera').length===2);
 check('Tabs load only one native player',cards[1].shadowRoot.querySelectorAll('simulated-eleven-camera').length===1);
 const before=creations,player=cards[0]._tiles.get('camera.front').player.card;update();await tick();
 check('Sensor updates preserve active players',creations===before&&cards[0]._tiles.get('camera.front').player.card===player);
 cards[1].shadowRoot.querySelector('[data-ui-tab="camera.garden"]').click();await tick();
 check('Switching tabs releases the previous stream',!cards[1]._tiles.get('camera.front').player.card&&!!cards[1]._tiles.get('camera.garden').player.card);
 unavailable=true;update();await tick();check('Unavailable camera releases its player',!cards[0]._tiles.get('camera.front').player.card);
 unavailable=false;update();await tick();
 const tabs=cards[1],parent=tabs.parentNode;tabs.remove();await tick();check('Removing the card releases all streams',[...tabs._tiles.values()].every(tile=>!tile.player.card));parent.append(tabs);await tick();
 tabs.shadowRoot.querySelector('[data-ui-tab="camera.front"]').click();await tick();check('Reattached cards retain working tabs',tabs._activeCamera==='camera.front'&&!!tabs._tiles.get('camera.front').player.card);
 offline=true;update();await tick();check('Disconnect releases every stream',cards.every(card=>[...card._tiles.values()].every(tile=>!tile.player.card)));
 offline=false;update();await tick();
 customElements.define('camera-editor-qa',CameraEditor);const editor=document.createElement('camera-editor-qa');editor.setConfig({cameras:rows});editor.hass=cards[0].hass;
 let saved;editor.addEventListener('config-changed',event=>saved=event.detail.config);
 editor._form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{camera_entities:['camera.garden','camera.front'],layout:'tabs',default_camera:'camera.front',columns:'2'}}}));
 check('Visual editor preserves camera names and order',saved.cameras[0].name==='Achtertuin'&&saved.cameras[1].name==='Voordeur'&&saved.columns===2);
 const schema=[...editor.shadowRoot.querySelectorAll('ha-form')].flatMap(form=>form.schema??[]);
 check('Visual editor only selects multiple camera entities',schema.find(field=>field.name==='camera_entities').selector.entity.domain==='camera'&&schema.find(field=>field.name==='camera_entities').selector.entity.multiple===true);
 check('Visual editor shares all background names',JSON.stringify(schema.find(field=>field.name==='background').selector.select.options)===JSON.stringify(headerBackgroundOptions(true)));
 document.querySelector('#checks').textContent=JSON.stringify({pass:true,checks},null,2);
}catch(error){document.querySelector('#checks').textContent=JSON.stringify({pass:false,error:String(error),stack:error.stack,checks},null,2);}
window.cameraQA={cards,get creations(){return creations;}};
if(JSON.parse(document.querySelector('#checks').textContent).pass)await import('./camera-options.js');
if(JSON.parse(document.querySelector('#checks').textContent).pass)await import('./camera-advanced.js');
