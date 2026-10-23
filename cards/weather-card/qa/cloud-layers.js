// Synthetic data only. Production cards, with the previous cloud motion for comparison.
const cards=[...document.querySelectorAll('eleven-weather-card')];
const forecasts=Array.from({length:6},(_,i)=>({datetime:new Date(Date.now()+(i+1)*3600000).toISOString(),condition:i%2?'cloudy':'partlycloudy',temperature:18+i%3,precipitation_probability:i*10,precipitation:i*.2,wind_speed:12+i,humidity:65+i}));
let moving=true,dark=true;
function update(){
 for(const [i,card] of cards.entries()){
  card.setConfig({entity:'weather.example',title:'Het weer',background:'clouds',icon_style:'glass',compact:i===2,tabs:['hourly'],animate_background:moving,animate_icons:moving,forecast_fields:['condition','temperature','precipitation','wind_speed']});
  card.hass={language:'nl',locale:{language:'nl'},themes:{darkMode:dark},connected:true,states:{'weather.example':{state:'partlycloudy',attributes:{temperature:19,temperature_unit:'°C',apparent_temperature:18,wind_speed:14,wind_speed_unit:'km/h',precipitation_unit:'mm',humidity:65,supported_features:3}}},connection:{subscribeMessage:async callback=>{callback({forecast:forecasts});return()=>{};}}};
  if(i===0){const style=document.createElement('style');style.textContent='[data-background=clouds] .header-atmosphere::before{animation:clouds-previous 18s ease-in-out infinite alternate}[data-background=clouds] .header-atmosphere::after{animation:clouds-previous 27s ease-in-out -12s infinite alternate-reverse}@keyframes clouds-previous{from{transform:translateX(-6%)}to{transform:translate(12%,-8%)}}';card.shadowRoot.append(style);}
 }
}
document.querySelector('#motion').onclick=event=>{moving=!moving;event.currentTarget.textContent=moving?'Animatie pauzeren':'Animatie afspelen';event.currentTarget.setAttribute('aria-pressed',String(moving));update();};
document.querySelector('#theme').onclick=()=>{dark=!dark;document.body.classList.toggle('light',!dark);update();};
window.cloudLayerExamples=cards;update();
