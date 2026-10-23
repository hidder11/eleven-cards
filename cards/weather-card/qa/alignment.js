import './fixture.js';
const qa=window.evccQA,weather=window.weatherQA,evccCards=[qa.card,document.getElementById('compact-evcc')];
qa.hass={...qa.hass,themes:{darkMode:true}};
for(const [index,card] of evccCards.entries()){card.hass=qa.hass;card._registry=qa.registry;card._activeTab='controls';card.setConfig({...qa.config,compact:index===1});}
weather.cards[1].setConfig({...weather.cards[1]._config,compact:true});
window.weatherAlignment={evccCards,weatherCards:weather.cards};
document.getElementById('theme').addEventListener('click',()=>{qa.hass={...qa.hass,themes:{darkMode:document.body.classList.contains('dark')}};for(const card of evccCards)card.hass=qa.hass;});
