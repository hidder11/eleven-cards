// Production cards with synthetic fixture data, no preview style overrides.
const qa=window.evccQA,cards=[qa.card,document.getElementById('session-card')];
qa.hass={...qa.hass,themes:{darkMode:true},states:{...qa.hass.states,'select.evcc_driveway_mode':{state:'smart',attributes:{options:['off','smart','now']}}}};
const sync=()=>{for(const card of cards)card.hass=qa.hass;if(qa.editor)qa.editor.hass=qa.hass;};
const update=qa.update.bind(qa);qa.update=(id,value)=>{update(id,value);sync();};
for(const [index,card] of cards.entries()){
 card.hass=qa.hass;card._registry=qa.registry;card._activeTab='controls';card.setConfig({evcc_enabled:true,...qa.config,compact:index===1,show_controls:true,show_session:true,show_details:true});
}
document.getElementById('theme').onclick=event=>{const darkMode=document.body.classList.toggle('dark');event.currentTarget.textContent=darkMode?'Licht thema':'Donker thema';qa.hass={...qa.hass,themes:{darkMode}};sync();};
document.getElementById('width').onclick=event=>{const narrow=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
sync();window.evccCompactPreview={cards,sync};
