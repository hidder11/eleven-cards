import {uiPrimaryValue,uiPrimaryValueStyles} from '../ui-primary-value.js';
import {uiMetric,uiMetricStyles} from '../ui-metric.js';
const paths={sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',in:'M12 3v14m-5-5 5 5 5-5M4 20h16',out:'M12 17V3m-5 5 5-5 5 5M4 20h16',bolt:'m14 2-9 12h6l-1 8 9-12h-6z',clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2',plug:'M8 3v5m8-5v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',wind:'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5',drop:'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13'};
const icon=key=>`<svg viewBox="0 0 24 24"><path d="${paths[key]}"/></svg>`;
const groups=[
 {name:'Energie',value:'3,8',unit:'kW',subtitle:'Actueel woningverbruik',context:'Woningverbruik',fields:[['sun','Zonne-energie','4,6','kW','Opwek op dit moment','solar'],['in','Netafname','0','kW','Van net naar woning','blue'],['out','Teruglevering','0,8','kW','Terug naar het net','green']]},
 {name:'Auto',value:'64',unit:'%',subtitle:'320 km actieradius',context:'Accuniveau',fields:[['plug','Laadstatus','Laden','','Auto wordt geladen','green'],['bolt','Laadvermogen','7,4','kW','3 fasen · 11 A','solar'],['clock','Resterende tijd','42','min','Geschat klaar om 15:32','blue']]},
 {name:'Weer',value:'21',unit:'\u00b0C',subtitle:'Voelt als 22 \u00b0C',context:'Buiten',fields:[['sun','Weerbeeld','Zonnig','','Voelt als 22 °C','solar'],['wind','Wind','14','km/h','Uit het zuidwesten','blue'],['drop','Luchtvochtigheid','62','%','Buiten gemeten','purple']]}
];
const style=document.createElement('style');style.textContent=uiMetricStyles()+uiPrimaryValueStyles();document.head.append(style);
let compact=false;
const field=([symbol,title,value,unit,info,tone])=>uiMetric({iconContent:icon(symbol),title,value,unit,info,compact,attrs:{class:tone}});
function render(){
 document.querySelector('.examples').innerHTML=groups.map(group=>`<article><h2>${group.name}</h2><div class="card"><div class="card-heading">${uiPrimaryValue({value:group.value,unit:group.unit,subtitle:group.subtitle,compact})}<span>${group.name}</span></div><div class="metric-stack">${field(group.fields[0])}<div class="metric-pair" data-ui-metric-grid>${group.fields.slice(1).map(field).join('')}</div></div></div></article>`).join('');
 document.querySelector('.edge-grid').innerHTML=uiMetric({iconContent:icon('bolt'),title:'Vermogen',value:null,unit:'kW',info:'Sensor niet beschikbaar',compact})+uiMetric({title:'Totale opwek in de gekozen periode',value:'12.345,67',unit:'kWh',info:'Een lange waarde blijft leesbaar, ook op een smalle kaart.',compact});
}
document.querySelector('#theme').onclick=event=>{const enabled=document.body.classList.toggle('light');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Donker thema':'Licht thema';};
document.querySelector('#width').onclick=event=>{const enabled=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Normale kaarten':'Smalle kaarten';};
document.querySelector('#density').onclick=event=>{compact=!compact;event.currentTarget.setAttribute('aria-pressed',String(compact));event.currentTarget.textContent=compact?'Standaard vlakken':'Compacte vlakken';render();};
render();window.metricExamplesReady=true;
