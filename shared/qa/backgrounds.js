import '../../dist/eleven-cards.js';
import {CARD_BACKGROUND_CHOICES} from '../ui-card-background.js';
if(!customElements.get('ha-form'))customElements.define('ha-form',class extends HTMLElement{});
const slugs=['dynamic-energy-price-card','history-graph-card','timeline-card','overview-card','bar-chart','heatmap-card','calendar-card','weather-card','car-card','energy-flow-card','camera-card'];
const selected=['satin-waves','isometric-depth','comet-trails','lenticular-glow'];
const state=(state,attributes={})=>({state,attributes,last_changed:new Date().toISOString(),last_updated:new Date().toISOString()});
const hass={language:'nl',locale:{language:'nl'},connected:true,config:{time_zone:'Europe/Amsterdam',unit_system:{temperature:'C'}},states:{'sensor.example':state('12',{unit_of_measurement:'kWh',friendly_name:'Voorbeeld'}),'binary_sensor.door':state('off',{device_class:'door'}),'weather.home':state('sunny',{temperature:18,temperature_unit:'C'}),'calendar.home':state('off'), 'camera.home':state('idle')},connection:{connected:true,subscribeMessage:async()=>()=>{}},callWS:async request=>request.type==='energy/get_prefs'?{energy_sources:[],device_consumption:[]}:request.type==='config/entity_registry/list'?[]:{},callApi:async()=>[]};
const checks=[],tick=()=>new Promise(resolve=>setTimeout(resolve,40));
const check=(name,condition)=>{if(!condition)throw Error(name);checks.push(name);};
try{
 for(const [index,slug] of slugs.entries()){
  const type='eleven-'+slug,Class=customElements.get(type),card=document.createElement(type);
  const config={...Class.getStubConfig(hass),entities:slug==='timeline-card'?['binary_sensor.door']:slug==='calendar-card'?[{entity:'calendar.home'}]:['sensor.example'],entity:slug==='weather-card'?'weather.home':'sensor.example',cameras:[],import_entity:'sensor.example'};
  const article=document.createElement('article');article.innerHTML='<h2>'+slug+'</h2>';document.querySelector('main').append(article);article.append(card);card.setConfig(config);card.hass=hass;await tick();
  check(slug+': shared adapter',!!Class.backgroundBaseCard);
  check(slug+': shared background host',!!card.shadowRoot.querySelector('[data-ui-background-host]'));
  for(const variant of selected){
   const background={variant,coverage:'header',height:280,transparency:45,colorMode:'custom',colors:['#85baaf','#8ca9e5','#c49ac8'],animated:true};
   card.setConfig({...config,card_background:background});card.hass=hass;await tick();
   const layer=card.shadowRoot.querySelector('[data-ui-card-background]');
   check(slug+'/'+variant+': one layer',layer?.dataset.uiCardBackground===variant&&card.shadowRoot.querySelectorAll('[data-ui-card-background]').length===1);
   const style=getComputedStyle(layer);
   check(slug+'/'+variant+': opacity and height',style.opacity==='0.55'&&style.maxHeight==='280px');
   check(slug+'/'+variant+': extended fade',style.maskImage.includes('45%')&&style.maskImage.includes('78%'));
   check(slug+'/'+variant+': artwork animated',layer.getAnimations({subtree:true}).length>0);
   card.setCardBackground({...background,animated:false});
   check(slug+'/'+variant+': animation switch',layer.getAnimations({subtree:true}).length===0);
   card.setCardBackground({...background,coverage:'card'});
   check(slug+'/'+variant+': full card has no mask',getComputedStyle(layer).maskImage==='none');
  }
  const editor=await Class.getConfigElement();editor.setConfig({...config,card_background:{variant:'satin-waves',enabled:true}});editor.hass=hass;article.append(editor);await tick();
  check(slug+': same nine editor choices',JSON.stringify([...editor.shadowRoot.querySelector('[data-bg=variant]').options].map(row=>row.value))===JSON.stringify(CARD_BACKGROUND_CHOICES.map(row=>row.value)));
  check(slug+': native editor retained',!!editor._nativeEditor);
  let changed;editor.addEventListener('config-changed',event=>{changed=event.detail.config;});
  const picker=editor.shadowRoot.querySelector('[data-bg=variant]');picker.value='lenticular-glow';picker.dispatchEvent(new Event('change',{bubbles:true}));
  check(slug+': editor stores choice and native settings',changed?.card_background.variant==='lenticular-glow'&&changed.entity===config.entity);
  editor._nativeEditor.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...config,title:'Aangepast'}},bubbles:true,composed:true}));
  check(slug+': native edits retain shared settings',changed?.title==='Aangepast'&&changed.card_background.variant==='lenticular-glow');
  editor.remove();card.setCardBackground({variant:selected[index%4],transparency:50,coverage:'header',height:280});
 }
 document.querySelector('#checks').textContent=JSON.stringify({pass:true,checks},null,2);
}catch(error){document.querySelector('#checks').textContent=JSON.stringify({pass:false,error:error.stack,checks},null,2);}
