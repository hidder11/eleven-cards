// Preview-only studies. Production card styles and configuration stay unchanged.
const studies=[
 {id:'soft',style:'soft',title:'3 · Zacht licht — origineel',description:'8 px, ter vergelijking met de nieuwe varianten.',height:8},
 {id:'line',style:'line',title:'4 · Fijne lijn — origineel',description:'4 px, ter vergelijking met de nieuwe varianten.',height:4},
 {id:'silk',style:'soft',title:'3A · Zijde',description:'6 px · een matte vulling met een brede, zachte lichtgolf.',height:6,end:'180%',beam:'60%',css:'.battery-fill{background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 65%,#fff),color-mix(in srgb,var(--primary-color) 48%,var(--secondary-background-color)));box-shadow:none}.battery-fill::before{background:linear-gradient(100deg,transparent,#ffffff55,transparent);filter:opacity(.4)}'},
 {id:'hairline',style:'line',title:'4A · Haarlijn',description:'2 px · de dunste variant, met een rustig lichtaccent.',height:2,end:'300%',beam:'36%',css:'.battery-track{background:color-mix(in srgb,var(--primary-text-color) 8%,var(--ha-card-background))}.battery-fill{background:color-mix(in srgb,var(--primary-color) 70%,var(--secondary-background-color));box-shadow:none}.battery-fill::before{background:linear-gradient(100deg,transparent,#ffffff99,transparent)}'},
 {id:'core',style:'soft',title:'3B · Lichtkern',description:'6 px · donkerder goud met een smalle lichtkern die erdoorheen loopt.',height:6,end:'800%',beam:'14%',css:'.battery-fill{background:color-mix(in srgb,var(--primary-color) 48%,var(--secondary-background-color));box-shadow:inset 0 1px 0 #ffffff16}.battery-fill::before{background:linear-gradient(100deg,transparent,#ffffffbb 50%,transparent);filter:opacity(.7)}'},
 {id:'twin',style:'line',title:'4B · Dubbele lijn',description:'5 px · twee dunne sporen met een gezamenlijke lichtveeg.',height:5,end:'260%',beam:'42%',css:'.battery-fill{background:color-mix(in srgb,var(--primary-color) 78%,var(--secondary-background-color))}.battery-track::after{content:"";position:absolute;inset:calc(50% - .5px) 0 auto;height:1px;background:var(--ha-card-background);z-index:4;pointer-events:none}.battery-fill::before{background:linear-gradient(100deg,transparent,#ffffffaa,transparent)}'},
 {id:'rim',style:'soft',title:'3C · Gloedrand',description:'5 px · een zachte randgloed en een heel subtiele lichtveeg.',height:5,end:'220%',beam:'50%',css:'.battery-track{overflow:visible}.battery-fill{background:color-mix(in srgb,var(--primary-color) 58%,var(--secondary-background-color));box-shadow:0 0 6px color-mix(in srgb,var(--primary-color) 25%,transparent),inset 0 1px 0 #ffffff35}.battery-fill::before{background:linear-gradient(100deg,transparent,#ffffff66,transparent);filter:opacity(.45)}'},
 {id:'comet',style:'line',title:'4C · Lichtpunt',description:'3 px · een rustige lijn met een klein, helder lichtpuntje.',height:3,end:'1100%',beam:'10%',css:'.battery-fill{background:color-mix(in srgb,var(--primary-color) 65%,var(--secondary-background-color));box-shadow:none}.battery-fill::before{background:linear-gradient(100deg,transparent,#ffffffdd 65%,transparent);filter:drop-shadow(0 0 2px #ffffff66)}'},
];

class BarStudyCard extends customElements.get('eleven-car-card'){
 _extraStyles(){
  const study=studies.find(item=>item.id===this._config?.bar_study);
  if(!study?.css)return super._extraStyles();
  const scoped=study.css.replaceAll(/(^|\})\s*(\.battery-[^{]+)/g,(_,prefix,selector)=>prefix+'.content[data-battery-style] '+selector);
  return super._extraStyles()+`
   .content[data-battery-style] .battery-track{height:${study.height}px}
   ${scoped}
   @media(prefers-reduced-motion:no-preference){
    .content:is([data-tone=charging],[data-tone=planned]) .battery-fill::before{width:${study.beam};animation-name:study-sweep}
   }
   @keyframes study-sweep{0%{transform:translateX(-110%);opacity:0}8%{opacity:1}90%{opacity:1}100%{transform:translateX(${study.end});opacity:0}}
  `;
 }
}
customElements.define('eleven-car-bar-study',BarStudyCard);
const entity=(state,unit)=>({state:String(state),attributes:{unit_of_measurement:unit}});
const hass={language:'nl',themes:{darkMode:true},states:{'sensor.power':entity(6,'kW'),'sensor.soc':entity(62,'%'),'sensor.range':entity(310,'km'),'binary_sensor.connected':entity('on'),'binary_sensor.charging':entity('on'),'image.car':{state:'2026-10-23',attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg'}}}};
const cards=studies.map(study=>{
 const article=document.createElement('article'),heading=document.createElement('h2'),description=document.createElement('p'),card=document.createElement('eleven-car-bar-study');
 heading.textContent=study.title;description.textContent=study.description;article.append(heading,description,card);document.querySelector('.cards').append(article);
 const config={title:'Mijn auto',evcc_enabled:true,image_entity:'image.car',battery_style:study.style,bar_study:study.id,tabs:[],entities:{soc:'sensor.soc',power:'sensor.power',range:'sensor.range',connected:'binary_sensor.connected',charging:'binary_sensor.charging'}};
 card.hass=hass;card.setConfig(config);return {card,config,study};
});
function update(){
 const power=Number(document.querySelector('#power').value),speed=Number(document.querySelector('#speed').value),maximum=Number(document.querySelector('#maximum').value);
 document.querySelector('#power-value').textContent=power+' kW';document.querySelector('#speed-value').textContent=speed+'×';
 hass.states={...hass.states,'sensor.power':entity(power,'kW')};
 for(const {card,config} of cards){card.hass=hass;card.setConfig({...config,animation_speed:speed,animation_max_kw:maximum});}
}
for(const input of document.querySelectorAll('input'))input.addEventListener('input',update);update();
window.barRefinements=cards;
