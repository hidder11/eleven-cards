const variants=[['classic','1 · Huidige balk','12 px, heldere lichtveeg.'],['slim','2 · Slanke capsule','8 px, dezelfde herkenbare beweging in een dunnere balk.'],['soft','3 · Zacht licht','8 px, zachtere kleur en een gedempte lichtveeg.'],['line','4 · Fijne lijn','4 px, een kleine lichtstreep als subtiel laadaccent.']];
const entity=(state,unit)=>({state:String(state),attributes:{unit_of_measurement:unit}});
const hass={language:'nl',themes:{darkMode:true},states:{'sensor.power':entity(6,'kW'),'sensor.soc':entity(62,'%'),'sensor.range':entity(310,'km'),'binary_sensor.connected':entity('on'),'binary_sensor.charging':entity('on'),'image.car':{state:'2026-10-23',attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg'}}}};
const cards=variants.map(([battery_style,title,description])=>{
 const article=document.createElement('article'),heading=document.createElement('h2'),text=document.createElement('p'),card=document.createElement('eleven-car-card');
 heading.textContent=title;text.textContent=description;article.append(heading,text,card);document.querySelector('.cards').append(article);
 const config={title:'Mijn auto',evcc_enabled:true,image_entity:'image.car',battery_style,tabs:[],entities:{soc:'sensor.soc',power:'sensor.power',range:'sensor.range',connected:'binary_sensor.connected',charging:'binary_sensor.charging'}};
 card.hass=hass;card.setConfig(config);return {card,config};
});
function update(){
 const power=Number(document.querySelector('#power').value),speed=Number(document.querySelector('#speed').value),maximum=Number(document.querySelector('#maximum').value);
 document.querySelector('#power-value').textContent=power+' kW';document.querySelector('#speed-value').textContent=speed+'×';
 hass.states={...hass.states,'sensor.power':entity(power,'kW')};
 for(const {card,config} of cards){card.hass=hass;card.setConfig({...config,animation_speed:speed,animation_max_kw:maximum});}
}
for(const input of document.querySelectorAll('input'))input.addEventListener('input',update);update();
window.barVariants=cards;
