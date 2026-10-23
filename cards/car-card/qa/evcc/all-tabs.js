// Real production markup/styles, with synthetic fixture data only.
const qa=window.evccQA,cards=[qa.card,document.getElementById('session-card'),document.getElementById('details-card')];
qa.hass={...qa.hass,themes:{darkMode:true},states:{...qa.hass.states,'select.evcc_driveway_mode':{state:'smart',attributes:{options:['off','smart','now']}}}};
const sync=()=>{for(const card of cards)card.hass=qa.hass;if(qa.editor)qa.editor.hass=qa.hass;};
const update=qa.update.bind(qa);qa.update=(id,value)=>{update(id,value);sync();};
for(const [i,card] of cards.entries()){
 card._activeTab=['controls','session','technical'][i];
 card.setConfig({evcc_enabled:true,...qa.config,show_controls:true,show_session:true,show_details:true});
 if(i)card.addEventListener('hass-more-info',event=>{document.getElementById('last-event').textContent='Entiteitdetails: '+event.detail.entityId;});
}
document.getElementById('theme').onclick=event=>{const darkMode=document.body.classList.toggle('dark');event.currentTarget.textContent=darkMode?'Licht thema':'Donker thema';qa.hass={...qa.hass,themes:{darkMode}};sync();};
document.getElementById('width').onclick=event=>{const narrow=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.textContent=narrow?'Brede kaarten':'Smalle kaarten';};
sync();window.evccAllTabs={cards,sync};
