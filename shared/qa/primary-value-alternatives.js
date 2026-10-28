import {uiMetric,uiMetricStyles} from '../ui-metric.js';
import {uiPrimaryValue,uiPrimaryValueStyles} from '../ui-primary-value.js';
const paths={drop:'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',in:'M12 3v14m-5-5 5 5 5-5M4 20h16',out:'M12 17V3m-5 5 5-5 5 5M4 20h16',bolt:'m14 2-9 12h6l-1 8 9-12h-6z',clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2',wind:'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5'};
const groups={
 energy:{name:'Energie',value:'3,8',unit:'kW',subtitle:'Actueel woningverbruik',fields:[['sun','Zonne-energie','4,6','kW','Opwek op dit moment','solar'],['in','Netafname','0','kW','Van net naar woning','blue'],['out','Teruglevering','0,8','kW','Terug naar het net','green']]},
 car:{name:'Auto',value:'64',unit:'%',subtitle:'320 km actieradius',fields:[['bolt','Laadstatus','Laden','','Auto wordt geladen','green'],['bolt','Laadvermogen','7,4','kW','3 fasen · 11 A','solar'],['clock','Resterende tijd','42','min','Geschat klaar om 15:32','blue']]},
 weather:{name:'Weer',value:'21',unit:'°C',subtitle:'Voelt als 22 °C',fields:[['sun','Weerbeeld','Zonnig','','Buiten gemeten','solar'],['wind','Wind','14','km/h','Uit het zuidwesten','blue'],['drop','Luchtvochtigheid','62','%','Buiten gemeten','green']]},
 history:{name:'Energie',value:'18,4',unit:'kWh',subtitle:'Woningverbruik vandaag',fields:[['sun','Zonne-energie','22,6','kWh','Opwek vandaag','solar'],['in','Netafname','3,2','kWh','Afgenomen vandaag','blue'],['out','Teruglevering','7,4','kWh','Teruggeleverd vandaag','green']]},
 edge:{name:'Energie',value:'12.345,67',unit:'kWh',subtitle:'Woningverbruik in de geselecteerde periode',fields:[['sun','Totale zonne-energie',null,'kWh','Sensor niet beschikbaar','solar'],['in','Netafname','0','kWh','Afgenomen in deze periode','blue'],['out','Teruglevering','123,45','kWh','Teruggeleverd in deze periode','green']]}
};
const designs=[
 ['classic','Rustige basis','De vertrouwde grote waarde, met de eenheid op de basislijn en de subtitel direct eronder.'],
 ['precision','Strak accent','Een steviger getal, de eenheid klein bovenaan en een fijne kleurstreep bij de subtitel.'],
 ['side','Eenheid en context ernaast','De waarde links, de eenheid en subtitel als een rustig tekstblok ernaast.'],
 ['soft','Zachte nadruk','Een wat groter, lichter getal met een zachte tint. De subtitel blijft neutraal en rustig.']
];
const style=document.createElement('style');style.textContent=uiMetricStyles()+uiPrimaryValueStyles()+`
.card-heading>[data-ui-primary-value]{flex:1 1 auto;min-width:0}
.card-heading>span{flex:none;padding-top:5px}
.card-heading{gap:12px}
.primary-number{display:inline-block;max-width:100%;overflow-wrap:anywhere;vertical-align:baseline}
.classic{--hero-tone:#eeb743}.precision{--hero-tone:#80b6ee}.side{--hero-tone:#82c9a3}.soft{--hero-tone:#eeb743}
.light .classic,.light .soft{--hero-tone:#996600}.light .precision{--hero-tone:#3678b5}.light .side{--hero-tone:#34785d}
.precision [data-ui-primary-value] .primary-value{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;font-size:60px;font-weight:650;letter-spacing:-.055em}
.precision [data-ui-primary-value] .primary-value small{margin:8px 0 0;font-size:16px;color:var(--secondary-text-color)}
.precision [data-ui-primary-value] .primary-label{border-inline-start:2px solid color-mix(in srgb,var(--hero-tone) 55%,transparent);padding-inline-start:8px;margin-top:6px}
.side [data-ui-primary-value]{display:grid;grid-template-columns:minmax(0,max-content) minmax(0,1fr);column-gap:12px;row-gap:1px;align-content:start}
.side [data-ui-primary-value] .primary-value{display:contents}
.side .primary-number{grid-column:1;grid-row:1/span 2;align-self:center;font-size:64px;line-height:1.15;min-width:0;overflow-wrap:anywhere}
.side [data-ui-primary-value] .primary-value small{grid-column:2;grid-row:1;align-self:end;margin:0;font-size:16px;letter-spacing:0;color:var(--primary-text-color)}
.side [data-ui-primary-value] .primary-label{grid-column:2;grid-row:2;align-self:start;margin:0;max-width:19ch}
.soft [data-ui-primary-value] .primary-value{font-size:72px;font-weight:400;letter-spacing:-.055em}
.soft .primary-number{color:color-mix(in srgb,var(--hero-tone) 22%,var(--primary-text-color))}
.soft [data-ui-primary-value] .primary-value small{font-size:18px;color:var(--secondary-text-color)}
.soft [data-ui-primary-value] .primary-label{margin-top:1px}
.precision [data-ui-primary-value][data-density=compact] .primary-value{font-size:46px}
.precision [data-ui-primary-value][data-density=compact] .primary-value small{font-size:14px;margin-top:5px}
.side [data-ui-primary-value][data-density=compact] .primary-number{font-size:46px}
.side [data-ui-primary-value][data-density=compact] .primary-value small{font-size:14px}
.soft [data-ui-primary-value][data-density=compact] .primary-value{font-size:52px}
.soft [data-ui-primary-value][data-density=compact] .primary-value small{font-size:16px}
.examples[data-compact=true] .card-heading{min-height:88px}
@container(max-width:280px){
 .side [data-ui-primary-value]{grid-template-columns:minmax(0,1fr);column-gap:0}
 .side .primary-number{grid-column:1;grid-row:1;font-size:54px}
 .side [data-ui-primary-value] .primary-value small{grid-column:1;grid-row:2;margin-top:0;font-size:13px}
 .side [data-ui-primary-value] .primary-label{grid-column:1;grid-row:3;max-width:none}
 .soft [data-ui-primary-value] .primary-value{font-size:60px}
}
`;document.head.append(style);
let compact=false;
function render(){
 const group=groups[document.querySelector('#dataset').value];
 const metric=([symbol,title,value,unit,info,tone])=>uiMetric({iconContent:`<svg viewBox="0 0 24 24"><path d="${paths[symbol]}"/></svg>`,title,value,unit,info,compact,attrs:{class:tone}});
 document.querySelector('.examples').dataset.compact=String(compact);
 document.querySelector('.examples').innerHTML=designs.map(([key,title,description],index)=>`<article class="${key}"><div class="proposal-heading"><span class="number">${index+1}</span><h2>${title}</h2></div><p class="description">${description}</p><div class="card"><div class="card-heading">${uiPrimaryValue({value:group.value,unit:group.unit,subtitle:group.subtitle,compact})}<span>${group.name}</span></div><div class="metric-stack">${metric(group.fields[0])}<div class="metric-pair" data-ui-metric-grid>${group.fields.slice(1).map(metric).join('')}</div></div></div></article>`).join('');
}
document.querySelector('#dataset').onchange=render;
document.querySelector('#theme').onclick=event=>{const enabled=document.body.classList.toggle('light');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Donker thema':'Licht thema';};
document.querySelector('#width').onclick=event=>{const enabled=document.querySelector('.examples').classList.toggle('narrow');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.textContent=enabled?'Normale kaarten':'Smalle kaarten';};
document.querySelector('#density').onclick=event=>{compact=!compact;event.currentTarget.setAttribute('aria-pressed',String(compact));event.currentTarget.textContent=compact?'Standaard':'Compact';render();};
render();window.primaryValueExamplesReady=true;
