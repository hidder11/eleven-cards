const conceptStyles=`
.concept-extra{font-size:12px}.concept-extra strong{color:var(--primary-text-color);font-weight:600}.concept-extra small{font-size:11px;color:var(--secondary-text-color)}
.dual-bars{margin-top:12px}.bar-labels{display:flex;justify-content:space-between;margin-bottom:6px;color:var(--secondary-text-color);font-size:11px}.bar-labels strong{font-size:12px}.fuel-track{height:5px;background:var(--secondary-background-color);border-radius:7px;overflow:hidden}.fuel-track span{display:block;height:100%;width:43%;background:#79b7cf;border-radius:inherit}.dual-bars+.status-line{margin-top:16px}
.maintenance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 16px}.maintenance>div{display:flex;align-items:center;gap:10px;padding:12px;background:var(--secondary-background-color);border-radius:7px;min-width:0}.maintenance svg{width:19px;height:19px;flex:none;stroke:var(--secondary-text-color);fill:none;stroke-width:1.6}.maintenance strong,.maintenance small{display:block}.maintenance [data-warning=true] svg,.maintenance [data-warning=true] strong{color:#e5a52d;stroke:#e5a52d}
.vehicle-info{position:absolute;inset:0;z-index:5;pointer-events:none}.vehicle-info .lock{position:absolute;top:38%;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:.03em;color:var(--secondary-text-color)}.tyre{position:absolute;bottom:4%;display:flex;align-items:center;gap:7px;padding:5px 9px;background:var(--secondary-background-color);border-radius:6px;font-size:11px;color:var(--primary-text-color)}.tyre.left{left:14%}.tyre.right{right:12%}.tyre::before{content:'';width:5px;height:5px;background:#69bc90;border-radius:50%}.tyre.warning::before{background:#e5a52d}.tyre.warning{color:#e5a52d}
.trip{margin-bottom:16px;padding:14px 0 0;border-top:1px solid var(--divider-color)}.trip-heading{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:18px}.trip-heading>span{color:var(--secondary-text-color);font-size:11px}.trip-heading strong{font-size:13px}.route{position:relative;height:5px;margin:0 5px 14px;background:var(--secondary-background-color);border-radius:6px}.route::before{content:'';position:absolute;inset:0 auto 0 0;width:var(--destination);background:var(--route-color);border-radius:inherit}.route i{position:absolute;top:50%;height:9px;width:9px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid var(--route-color);background:var(--ha-card-background)}.route i:first-child{left:0;background:var(--route-color)}.route i:nth-child(2){left:var(--destination);background:var(--route-color)}.route i:last-child{left:100%;border-color:var(--secondary-text-color)}.trip-labels{display:flex;justify-content:space-between;gap:12px;color:var(--secondary-text-color);font-size:11px}.trip-labels span:last-child{text-align:right}.trip-labels strong{display:block;font-size:13px}.trip-note{margin:12px 0 0;color:var(--route-color);font-size:11px}
.sparkline{display:block;width:100%;height:40px;margin-top:10px;overflow:visible}.trend-note{display:block;color:var(--secondary-text-color);font-size:10px;margin-top:5px}.live-readings .field-content:has(.sparkline){grid-row:auto;display:flex;flex-direction:column;gap:2px}
@container(max-width:320px){.tyre.left{left:6%}.tyre.right{right:5%}.maintenance{gap:8px}.maintenance>div{padding:10px;gap:6px}}
`;
const icon=(kind)=>kind==='service'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5a5 5 0 0 0-6 6L3 16a3 3 0 0 0 4 4l6-6a5 5 0 0 0 6-6l-3 3-3-3 3-3Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m6 6 3 3m6 6 3 3M6 18l3-3m6-6 3-3"/></svg>';
class CarConcept extends customElements.get('eleven-car-card'){
 _render(){
  super._render();if(!this._config||!this.shadowRoot.querySelector('.content'))return;
  this.shadowRoot.querySelectorAll('.concept-extra,.concept-style').forEach(el=>el.remove());
  const style=document.createElement('style');style.className='concept-style';style.textContent=conceptStyles;this.shadowRoot.append(style);
  const content=this.shadowRoot.querySelector('.content'),header=content.querySelector('.header-scene'),kind=this._config.concept,warning=this._config.attention;
  const extra=document.createElement('div');extra.className='concept-extra';
  if(kind==='hybrid'){
   extra.classList.add('dual-bars');extra.innerHTML='<div class="bar-labels"><span>Brandstof</span><strong>43% · 280 km</strong></div><div class="fuel-track"><span></span></div>';
   header.querySelector('.gallery-top').append(extra);
   const bar=header.querySelector('.battery-track');bar.setAttribute('aria-label','Accupercentage');
  }
  if(kind==='maintenance'){
   extra.classList.add('maintenance');extra.innerHTML=`<div data-warning="${warning}">${icon('service')}<span><small>Onderhoud</small><strong>${warning?'Over 180 km':'Over 2.400 km'}</strong></span></div><div data-warning="${warning}">${icon('tyre')}<span><small>Bandenspanning</small><strong>${warning?'Rechtsvoor laag':'Alles in orde'}</strong></span></div>`;header.after(extra);
  }
  if(kind==='vehicle'){
   extra.classList.add('vehicle-info');extra.innerHTML=`<span class="lock">${warning?'Portier open':'Auto vergrendeld'}</span><span class="tyre left">2,4 bar</span><span class="tyre right ${warning?'warning':''}">${warning?'1,8':'2,3'} bar</span>`;header.querySelector('.car-stage').append(extra);
  }
  if(kind==='trip'){
   const range=Math.round(this._config.percentage*5),remaining=range-185,color=remaining>=0?'#69bc90':'#e5a52d';extra.classList.add('trip');extra.style.setProperty('--destination',Math.min(100,185/Math.max(1,range)*100)+'%');extra.style.setProperty('--route-color',color);
   extra.innerHTML=`<div class="trip-heading"><span>Volgende rit</span><strong>Utrecht · 185 km</strong></div><div class="route" aria-hidden="true"><i></i><i></i><i></i></div><div class="trip-labels"><span><strong>${range} km</strong>Geschat bereik</span><span><strong>${Math.abs(remaining)} km ${remaining>=0?'over':'tekort'}</strong>Na aankomst</span></div><p class="trip-note">${remaining>=0?'Voldoende bereik voor deze enkele rit':'Bijladen nodig voor deze rit'}</p>`;header.after(extra);
  }
  if(kind==='trends'){
   const paths=['M0 22 L15 25 L30 12 L45 20 L60 18 L75 26 L90 24 L105 29 L120 25 L140 29','M0 5 L20 8 L40 12 L60 15 L80 20 L100 24 L120 29 L140 32'];
   content.querySelectorAll('.live-readings .field-content').forEach((field,index)=>{
    const chart=document.createElement('div');chart.className='concept-extra';chart.innerHTML=`<svg class="sparkline" viewBox="0 0 140 40" preserveAspectRatio="none" aria-label="Fictieve trend ${index?'actieradius':'verbruik'}"><defs><linearGradient id="fade${index}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${index?'#79b7cf':'#d9b267'}" stop-opacity=".22"/><stop offset="1" stop-color="${index?'#79b7cf':'#d9b267'}" stop-opacity="0"/></linearGradient></defs><path d="${paths[index]} L140 40 L0 40Z" fill="url(#fade${index})"/><path d="${paths[index]}" stroke="${index?'#79b7cf':'#d9b267'}" stroke-width="1.5" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg><span class="trend-note">${index?'Bereik tijdens de laatste rit':'Verbruik tijdens de laatste rit'}</span>`;field.append(chart);
   });
  }
 }
}
customElements.define('eleven-car-concept',CarConcept);
const proposals=[
 ['hybrid','Twee energiebronnen','Accu en brandstof samen in één header. De tweede balk krijgt een eigen kleur en bereik.'],
 ['maintenance','Onderhoud in één oogopslag','Twee rustige meldingen tussen de auto en de gegevens. Alleen aandachtspunten krijgen een waarschuwingskleur.'],
 ['vehicle','De auto als informatiebeeld','Bandenspanning en vergrendeling direct rond de auto. De gegevens blijven los van de afbeelding staan.'],
 ['trip','Bereik voor je volgende rit','Een afstandslijn koppelt het huidige bereik aan je bestemming. Verlaag het percentage om het bereiktekort te zien.'],
 ['trends','Waarden met een verhaal','Kleine grafieken bij verbruik en bereik geven context, terwijl de actuele waarden goed leesbaar blijven.'],
];
const entity=(state,unit)=>({state:String(state),attributes:{unit_of_measurement:unit}});
const hass={language:'nl',locale:{language:'nl'},themes:{darkMode:true},states:{'image.car':{state:'preview',attributes:{entity_picture:'/cards/car-card/qa/evcc/car.svg'}},'sensor.status':entity('Geparkeerd'),'sensor.range':entity(310,'km'),'sensor.consumption':entity(5.8,'l/100 km')}};
const cards=proposals.map(([concept,title,description],index)=>{
 const article=document.createElement('article');article.innerHTML=`<div class="caption"><span class="number">0${index+1}</span><h2>${title}</h2></div>`;
 const card=document.createElement('eleven-car-concept');article.append(card);const text=document.createElement('p');text.className='description';text.textContent=description;article.append(text);document.querySelector('.cards').append(article);
 const config={concept,title:concept==='hybrid'?'Mijn hybride':'Mijn auto',percentage:62,image_entity:'image.car',range_source:'calculated',range_full:500,background:'lanes',color:'charging',show_field_1:true,field_1_entity:'sensor.status',field_1_label:'Status',field_2_entity:'sensor.consumption',field_2_label:'Verbruik',field_3_entity:'sensor.range',field_3_label:'Actieradius'};
 card.hass=hass;card.setConfig(config);return {card,config};
});
let attention=false,darkMode=true;
function update(){
 const percentage=Number(document.querySelector('#percentage').value);document.querySelector('#percentage-value').textContent=percentage+'%';hass.themes={darkMode};hass.states={...hass.states,'sensor.range':entity(Math.round(percentage*5),'km')};
 for(const {card,config} of cards){card.hass={...hass};card.setConfig({...config,percentage,attention});}
}
document.querySelector('#percentage').addEventListener('input',update);
document.querySelector('#attention').addEventListener('click',event=>{attention=!attention;event.currentTarget.setAttribute('aria-pressed',String(attention));update();});
document.querySelector('#theme').addEventListener('click',event=>{darkMode=!darkMode;document.body.classList.toggle('light',!darkMode);event.currentTarget.setAttribute('aria-pressed',String(!darkMode));update();});
window.carConcepts=cards;update();
