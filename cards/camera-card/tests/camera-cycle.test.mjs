import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function fixture(privacy='on',active='on'){
 const registry=new Map();
 const context=vm.createContext({HTMLElement:class{},window:{},document:{hidden:false},customElements:{get:name=>registry.get(name),define:(name,Class)=>registry.set(name,Class)}});
 vm.runInContext(readFileSync(new URL('../dist/eleven-camera-card.js',import.meta.url),'utf8'),context);
 const card=Object.create(registry.get('eleven-camera-card').prototype);
 const cameras=[{entity:'camera.a'},{entity:'camera.b',privacy_entity:'switch.privacy',privacy_state:active},{entity:'camera.c'}];
 Object.assign(card,{_config:{cameras,layout:'focus',auto_cycle:true,cycle_interval:5},_activeCamera:'camera.a',_attached:true,_securityView:'cameras',
  shadowRoot:{activeElement:null},hasAttribute:()=>false,_hass:{states:Object.fromEntries(cameras.map(row=>[row.entity,{state:'idle'}]))},
  _cycle:{sync(enabled){card.timerEnabled=enabled;}},_selectCamera(entity){card._activeCamera=entity;}});
 if(privacy!==null)card._hass.states['switch.privacy']={state:privacy};
 card._hass.states['camera.b'].state=privacy===active||!['on','off'].includes(privacy)?'unavailable':'idle';
 return card;
}

test('automatic selection and timer eligibility both exclude unavailable feeds',()=>{
 for(const [privacy,active,expected] of [['on','on','camera.c'],['off','on','camera.b'],['off','off','camera.c'],['on','off','camera.b'],['unknown','on','camera.c'],['unavailable','on','camera.c'],[null,'on','camera.c']]){
  const card=fixture(privacy,active);card._syncCycle();assert.equal(card.timerEnabled,true);
  card._advanceCycle();assert.equal(card._activeCamera,expected,privacy+'/'+active);
 }
});

test('rotation stops with no alternative and can leave a blocked current feed for the only playable one',()=>{
 const card=fixture();card._hass.states['camera.c'].state='unavailable';
 card._syncCycle();assert.equal(card.timerEnabled,false);card._advanceCycle();assert.equal(card._activeCamera,'camera.a');
 card._hass.states['camera.a'].state='off';card._syncCycle();assert.equal(card.timerEnabled,false);
 card._advanceCycle();assert.equal(card._activeCamera,'camera.a');
 card._hass.states['camera.c'].state='idle';card._syncCycle();assert.equal(card.timerEnabled,true);
 card._advanceCycle();assert.equal(card._activeCamera,'camera.c');card._syncCycle();assert.equal(card.timerEnabled,false);
});
