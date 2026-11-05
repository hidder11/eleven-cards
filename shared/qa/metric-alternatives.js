import {uiMetric,uiMetricStyles} from '../ui-metric.js';
const paths={sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',in:'M12 3v14m-5-5 5 5 5-5M4 20h16',out:'M12 17V3m-5 5 5-5 5 5M4 20h16',bolt:'m14 2-9 12h6l-1 8 9-12h-6z',clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2',plug:'M8 3v5m8-5v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',wind:'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5',drop:'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13'};
const datasets={
 energy:{headline:'3,8 kW',context:'Woningverbruik',fields:[['sun','Zonne-energie','4,6','kW','Opwek op dit moment','solar'],['in','Netafname','0','kW','Van net naar woning','blue'],['out','Teruglevering','0,8','kW','Terug naar het net','green']]},
 car:{headline:'64 %',context:'Accuniveau',fields:[['plug','Laadstatus','Laden','','Auto wordt geladen','green'],['bolt','Laadvermogen','7,4','kW','3 fasen · 11 A','solar'],['clock','Resterende tijd','42','min','Geschat klaar om 15:32','blue']]},
 weather:{headline:'21°',context:'Buiten',fields:[['sun','Weerbeeld','Zonnig','','Voelt als 22 °C','solar'],['wind','Wind','14','km/h','Uit het zuidwesten','blue'],['drop','Luchtvochtigheid','62','%','Buiten gemeten','purple']]},
 edge:{headline:'Historisch',context:'Voorbeeld',fields:[['sun','Totale opwek in de gekozen periode','12.345,67','kWh','Gemeten over de geselecteerde periode','solar'],['in','Huidig netvermogen',null,'kW','Sensor niet beschikbaar','blue'],['out','Teruggeleverde energie','123,45','kWh','Teruggeleverd in de geselecteerde periode','green']]}
};
const colorStudy=new URLSearchParams(location.search).has('colors');
const designs=colorStudy?[
 ['tint tone-neutral','Alleen het icoon','Een neutraal vlak. Alleen het icoon houdt kleur; de scheidingslijn blijft neutraal.'],
 ['tint tone-whisper','Bijna neutraal','Een heel lichte kleurzweem van 2%, met een rustig gekleurd icoon.'],
 ['tint tone-soft','Zachte zweem','Dezelfde kleurovergang als de gekozen stijl, teruggebracht van 9% naar 4%.'],
 ['tint tone-local','Gloed bij het icoon','Een kleine, zachte gloed rechtsboven. De rest van het vlak blijft neutraal.']
]:[
 ['focus','Heldere hiërarchie \u00b7 huidige stijl','Icoon dichter bij de rechterbovenhoek, met een subtiele kleurgloed die naar linksonder vervaagt.'],
 ['rail','Icoonrail','Icoon en meting naast elkaar, met de extra informatie op dezelfde tekstlijn eronder.'],
 ['inline','In één oogopslag','Een horizontale indeling voor brede vlakken. Op smalle vlakken schuift de waarde netjes onder de titel.'],
 ['tint','Zachte kleur','Een zachte kleurgloed en een afgescheiden informatieregel geven meer karakter zonder extra drukte.']
];
const style=document.createElement('style');style.textContent=uiMetricStyles()+`
/* Only composition and colour vary; production typography, icons and spacing are shared. */
.variant [data-ui-metric]{--ui-metric-radius:8px}
.tint [data-ui-metric]{background:radial-gradient(ellipse 120px 90px at 100% 0%,color-mix(in srgb,var(--_metric-tone) 6%,transparent),transparent 100%),var(--secondary-background-color);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--_metric-tone) 10%,transparent)}
.tint [data-ui-metric] .ui-metric-icon{background:color-mix(in srgb,var(--_metric-tone) 9%,transparent)}
:is(.rail,.inline,.tint) [data-ui-metric] .ui-metric-icon{transform:none}
.rail [data-ui-metric]{grid-template-columns:26px minmax(0,1fr)}
.rail [data-ui-metric] .ui-metric-icon{grid-column:1;grid-row:1/span 2}
.rail [data-ui-metric] .ui-metric-title,.rail [data-ui-metric] .ui-metric-value{grid-column:2}
.inline .metric-stack>[data-ui-metric]{grid-template-columns:26px minmax(0,1fr) auto}
.inline .metric-stack>[data-ui-metric] .ui-metric-icon{grid-column:1;grid-row:1}
.inline .metric-stack>[data-ui-metric] .ui-metric-title{grid-column:2;grid-row:1;align-self:center}
.inline .metric-stack>[data-ui-metric] .ui-metric-value{grid-column:3;grid-row:1;text-align:end}
.inline .metric-stack>[data-ui-metric] .ui-metric-info{grid-column:2/-1;grid-row:2}
@container(max-width:300px){
 .inline .metric-stack>[data-ui-metric]{grid-template-columns:minmax(0,1fr) auto}
 .inline .metric-stack>[data-ui-metric] .ui-metric-icon{grid-column:2;grid-row:1/span 2}
 .inline .metric-stack>[data-ui-metric] .ui-metric-title{grid-column:1;grid-row:1;align-self:start}
 .inline .metric-stack>[data-ui-metric] .ui-metric-value{grid-column:1;grid-row:2;text-align:start}
 .inline .metric-stack>[data-ui-metric] .ui-metric-info{grid-column:1/-1;grid-row:3}
}
.tone-neutral [data-ui-metric]{background:var(--secondary-background-color)}
.tone-whisper [data-ui-metric]{background:linear-gradient(135deg,color-mix(in srgb,var(--_metric-tone) 2%,transparent),transparent 90%),var(--secondary-background-color)}
.tone-soft [data-ui-metric]{background:linear-gradient(135deg,color-mix(in srgb,var(--_metric-tone) 4%,transparent),transparent 90%),var(--secondary-background-color)}
`;document.head.append(style);
if(colorStudy){
 document.title='Eleven · subtielere verkleuring';
 document.querySelector('h1').textContent='Dezelfde indeling. Minder kleur.';
 document.querySelector('.intro').textContent='Vier subtielere varianten van optie 4. De ruimte tussen titel en waarde blijft klein. Vergelijk de kleur in licht en donker thema, met energie-, auto- of weergegevens.';
 document.querySelector('.examples').setAttribute('aria-label','Vier subtielere kleurvarianten');
 document.querySelector('.note').innerHTML='Fictieve gegevens. Optie 4 is gekozen en voorzien van een subtiele rand. <a href="metric-examples.html">Bekijk de gekozen stijl en de kleinere compacte versie</a>.';
}
let compact=false;
function render(){
 const group=datasets[document.querySelector('#dataset').value];
 let fieldIndex=0;
 const metric=([symbol,title,value,unit,info,tone])=>uiMetric({iconContent:`<svg viewBox="0 0 24 24"><path d="${paths[symbol]}"/></svg>`,title,value,unit,info:document.querySelector('#info').value==='none'||document.querySelector('#info').value==='mixed'&&fieldIndex++%3===2?'':info,compact,attrs:{class:tone}});
 document.querySelector('.examples').innerHTML=designs.map(([key,title,description],index)=>`<article class="variant ${key}"><div class="proposal-heading"><span class="number">${index+1}</span><h2>${title}</h2></div><p class="description">${description}</p><div class="card"><div class="card-heading"><strong>${group.headline}</strong><span>${group.context}</span></div><div class="metric-stack">${metric(group.fields[0])}<div class="metric-pair" data-ui-metric-grid>${group.fields.slice(1).map(metric).join('')}</div></div></div></article>`).join('');
}
document.querySelector('#dataset').onchange=render;
document.querySelector('#info').onchange=render;
document.querySelector('#theme').onclick=event=>{const enabled=document.body.classList.toggle('light');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Donker thema':'Licht thema';};
document.querySelector('#width').onclick=event=>{const enabled=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Normale kaarten':'Smalle kaarten';};
document.querySelector('#density').onclick=event=>{compact=!compact;event.currentTarget.setAttribute('aria-pressed',String(compact));event.currentTarget.textContent=compact?'Standaard':'Compact';render();};
render();window.metricAlternativesReady=true;
