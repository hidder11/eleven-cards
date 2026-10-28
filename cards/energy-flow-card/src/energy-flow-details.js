import {uiDetailSurface,uiDetailSurfaceStyles} from '../../../shared/ui-detail-surface.js';
import {energyFlowDeviceCosts} from './energy-flow-insights.js';
import {uiEscape,uiButton} from '../../../shared/ui-button.js';
import {uiPopup} from '../../../shared/ui-popup.js';
import {energyFlowSelectedPrice} from './energy-flow-prices.js';
import {energyFlowGridMeters,energyFlowDeviceRows,energyFlowDeviceTotal,energyFlowCurrentPrice,energyFlowHistoricalCost,energyFlowSolarRows,energyFlowSolarCoverage} from './energy-flow-details-data.js';

export function energyFlowDetailPopup(host,kind,data,{id,attrs={}}={}){
 const nl=String(host._hass?.locale?.language??host._hass?.language??'en').startsWith('nl'),history=host._view==='history';
 const title=kind==='home'?(nl?'Woning':'Home'):kind==='grid'?(nl?'Net':'Grid'):(nl?'Zon':'Solar');
 const mode=history?(nl?'Historisch':'History'):(nl?'Actueel':'Live');
 return uiPopup({id,title:title+' · '+mode,closeLabel:nl?'Sluiten':'Close',attrs:{...attrs,popover:'manual','data-energy-popup':kind},content:`<div class="energy-detail-body" data-detail-view="${history?'history':'live'}">${energyFlowDetailContent(host,kind,data)}</div>`});
}

export function energyFlowDetailContent(host,kind,data){
 const nl=String(host._hass?.locale?.language??host._hass?.language??'en').startsWith('nl'),t=(a,b)=>nl?a:b;
 const history=host._view==='history',hass=host._hass,prefs=host._prefs;
 const format=value=>{try{return new Intl.NumberFormat(hass?.locale?.language??hass?.language??'en',{maximumFractionDigits:2}).format(value);}catch{return new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(value);}};
 const reading=(value,suffix=history?'kWh':'kW')=>value==null?'—':suffix==='EUR'||suffix.startsWith('EUR/')?'€ '+format(value)+suffix.slice(3):format(value)+(suffix?' '+suffix:'');
 const balanceReading=(share,amount)=>uiEscape((share==null?'':reading(share,'%')+' · ')+reading(amount));
 const note=value=>`<p class="energy-detail-note">${uiEscape(value)}</p>`;
 const heading=label=>`<div class="energy-detail-section"><h3>${uiEscape(label)}</h3></div>`;
 const metric=(label,value,tone='home')=>`<div data-tone="${tone}"><dt>${uiEscape(label)}</dt><dd>${uiEscape(value)}</dd></div>`;
 const deviceMetric=(label,value,total,{tone='home',hint=''}={})=>{
  const comparable=Number.isFinite(value)&&value>=0&&Number.isFinite(total)&&total>0,percent=comparable?value/total*100:null;
  return `<div data-tone="${tone}"><dt>${uiEscape(label)}</dt><dd><strong>${uiEscape(reading(value))}</strong>${percent!=null&&percent<=100?`<small>${uiEscape(reading(percent,'%'))}</small>`:''}</dd>${comparable?`<div class="energy-detail-track" aria-hidden="true"><i style="width:${Math.min(100,percent)}%"></i></div>`:''}${hint?`<small class="energy-home-hint">${uiEscape(hint)}</small>`:''}</div>`;
 };
 const state=host._detailResult??{},stats=state.statistics??{},meta=state.metadata??{};
 let html='';
 if(host._offline())return html+note(t('Geen verbinding met Home Assistant.','Disconnected from Home Assistant.'));
 if(!prefs)return html+note(t('Energy-instellingen worden geladen.','Loading Energy preferences.'));
 if(history&&host._detailLoading)return html+note(t('Detailgegevens laden…','Loading details…'));
 if(history&&host._detailError)return html+note(t('Detailgegevens laden mislukt.','Could not load details.'))+uiButton({variant:'text',text:t('Opnieuw proberen','Retry'),attrs:{'data-detail-retry':true}});
 if(kind==='home'){
  html+=`<dl class="energy-grid-metrics energy-home-summary">${metric(t('Woning totaal','Home total'),reading(data.home))}${metric(t('Geschat basisverbruik','Estimated base consumption'),reading(host._baseResult?.value?.watts??null,'W'))}</dl>`;
  const devices=energyFlowDeviceRows(prefs,hass,history,stats),costs=history?energyFlowDeviceCosts(prefs,hass,state):{};
  if(!devices.length)return html+note(t('Geen afzonderlijke apparaten ingesteld in Home Assistant Energy.','No individual devices configured in Home Assistant Energy.'));
  const costReading=cost=>cost?.currency?reading(cost.value,cost.currency):'—';
  const surface=(label,value,{entity='',cost=null,hint='',id=''}={})=>{
   const share=Number.isFinite(data.home)&&data.home>0?value/data.home*100:null;
   return uiDetailSurface({title:label,entity,actionLabel:t('Details van ','Details for ')+label,percent:share,attrs:{style:'--ui-detail-tone:var(--detail-home)','data-device-stat':id},metrics:[
    {label:t('Aandeel','Share'),value:share==null?null:format(share),unit:'%'},
    {label:history?t('Verbruik','Consumption'):t('Vermogen','Power'),value:reading(value)},
    ...(history?[{label:t('Geschatte kosten','Estimated cost'),value:costReading(cost)}]:[])
   ]})+(hint?`<p class="energy-home-hint">${uiEscape(hint)}</p>`:'');
  };
  if(history)html+=`<label class="energy-device-sort">${t('Sorteren op','Sort by')}<select data-energy-device-sort><option value="energy"${host._deviceSort!=='cost'?' selected':''}>${t('Verbruik','Consumption')}</option><option value="cost"${host._deviceSort==='cost'?' selected':''}>${t('Geschatte kosten','Estimated cost')}</option></select></label>`;
  const ordered=[...devices].sort((a,b)=>history&&host._deviceSort==='cost'?((costs[b.stat_consumption]?.value??-Infinity)-(costs[a.stat_consumption]?.value??-Infinity))||a.label.localeCompare(b.label):(b.value??-1)-(a.value??-1)||a.label.localeCompare(b.label));
  html+='<div class="energy-device-surfaces">';
  for(const device of ordered){
   if(device.value==null||device.value===0)continue;
   const parent=devices.find(item=>item.stat_consumption===device.included_in_stat),id=history?device.stat_consumption:device.stat_rate;
   html+=surface(device.label,device.value,{id:device.stat_consumption,cost:costs[device.stat_consumption],entity:hass?.states?.[id]?id:'',hint:parent?t('Onderdeel van ','Included in ')+parent.label:''});
  }
  const measured=energyFlowDeviceTotal(devices),other=data.home==null?null:Math.max(0,data.home-measured);
  if(other!=null&&other>0)html+=surface(t('Overig','Other'),other,{cost:costs.__other,id:'__other'});
  html+='</div>';
  if(data.home!=null&&measured>data.home+.01)html+=note(t('Apparaatmetingen zijn samen hoger dan het woningtotaal. Meetmomenten of meters kunnen overlappen.','Device measurements exceed the home total. Measurements may overlap or differ in timing.'));
  return html;
 }
 if(kind==='grid'){
  const meters=energyFlowGridMeters(prefs),prices=meters.map(meter=>history?energyFlowHistoricalCost(meter,state.info,stats,meta,hass):energyFlowCurrentPrice(meter,hass));
  const amounts=[],costs=[],gridSurfaces=[];
  for(const direction of ['import','export']){
   const incoming=direction==='import',indices=meters.map((meter,i)=>meter.direction===direction?i:-1).filter(i=>i>=0),value=incoming?data.import:data.export;
   const label=history?(incoming?t('Totale afname','Total import'):t('Totale teruglevering','Total export')):(incoming?t('Actuele afname','Current import'):t('Actuele teruglevering','Current export'));
   const costLabel=incoming?t('Afnamekosten','Import costs'):t('Terugleververgoeding','Export compensation');
   const rateLabel=incoming?t('Actuele afnameprijs','Current import price'):t('Actuele terugleverprijs','Current export price');
   const sameCurrency=indices.length>0&&indices.every(i=>prices[i]&&prices[i].currency===prices[indices[0]].currency);
   const selected=history?{configured:false}:energyFlowSelectedPrice(host,direction);
   const price=selected.configured?selected.price:history&&sameCurrency?{value:indices.reduce((sum,i)=>sum+prices[i].value,0),currency:prices[indices[0]].currency}:indices.length===1?prices[indices[0]]:null;
   amounts.push(metric(label,reading(value),direction));
   if(history){
    const costMetrics=!price&&indices.length>1?indices.map(i=>({label:meters[i].name||hass?.states?.[meters[i].energy]?.attributes?.friendly_name||meters[i].energy,value:prices[i]?reading(prices[i].value,prices[i].currency):'—'})):[{label:costLabel,value:price?reading(price.value,price.currency):'—'}];
    gridSurfaces.push(uiDetailSurface({title:incoming?t('Afname','Import'):t('Teruglevering','Export'),attrs:{style:'--ui-detail-tone:var(--detail-home)'},metrics:[{label,value:reading(value)},...costMetrics]}));
   }
   if(!price&&indices.length>1&&!selected.configured){
    const connections=indices.map(i=>{
     const meter=meters[i],meterPrice=prices[i],name=meter.name||hass?.states?.[meter.energy]?.attributes?.friendly_name||meter.energy;
     return `<div class="energy-grid-connection"><span>${uiEscape(name)}</span><strong>${uiEscape(meterPrice?reading(meterPrice.value,meterPrice.currency+(history?'':'/kWh')):'—')}</strong></div>`;
    }).join('');
    costs.push(`<div data-tone="${direction}"><dt>${uiEscape(history?costLabel:rateLabel)}</dt><dd>${connections}</dd></div>`);
   }else costs.push(metric(history?costLabel:rateLabel,price?reading(price.value,price.currency+(history?'':'/kWh')):'—',direction));
  }
  let net='';
  if(history){
   const known=prices.length>0&&prices.every(price=>price&&price.currency===prices[0].currency);
   const value=known?prices.reduce((sum,price,i)=>sum+(meters[i].direction==='import'?price.value:-price.value),0):null;
   net=`<div class="energy-grid-net"><dt>${t('Netto kosten','Net costs')}</dt><dd>${uiEscape(known?reading(value,prices[0].currency):'—')}</dd></div>`;
  }
  html+=history?`<dl class="energy-grid-metrics energy-grid-summary">${net}</dl><div class="energy-detail-surfaces">${gridSurfaces.join('')}</div>`:`<dl class="energy-grid-metrics">${amounts.join('')}${costs.join('')}</dl>`;
  return html;
 }
 const coverage=energyFlowSolarCoverage(data);
 const percent=value=>reading(value,'%');
 html+=`<dl class="energy-grid-metrics energy-solar-metrics">${metric(t('Zonne-opwek','Solar generation'),reading(data.solar),'solar')}${metric(t('Zon naar net','Solar to grid'),reading(coverage?data.export:null),'export')}</dl><div class="energy-detail-surfaces">${uiDetailSurface({title:t('Zelfvoorziening','Self-sufficiency'),percent:coverage?.coverage,attrs:{style:'--ui-detail-tone:var(--detail-home)'},metrics:[{label:t('Aandeel','Share'),value:percent(coverage?.coverage)},{label:t('Gedekt door zon','Supplied by solar'),value:reading(coverage?.own)},{label:t('Woning totaal','Home total'),value:reading(data.home)}]})}${uiDetailSurface({title:t('Eigen gebruik van opwek','Self-consumed generation'),percent:coverage?.selfConsumption,attrs:{style:'--ui-detail-tone:var(--detail-home)'},metrics:[{label:t('Aandeel','Share'),value:percent(coverage?.selfConsumption)},{label:t('Zelf gebruikt','Self-consumed'),value:reading(coverage?.own)},{label:t('Zonne-opwek','Solar generation'),value:reading(data.solar)}]})}</div>`;
 if(!coverage)html+=note(data.battery?t('Zelfvoorziening onbekend met batterij.','Self-sufficiency unknown with battery.'):t('Zelfvoorziening niet beschikbaar.','Self-sufficiency unavailable.'));
 else if(data.home===0)html+=note(t('Geen woningverbruik.','No home consumption.'));
 const sources=energyFlowSolarRows(prefs,hass,history,stats);
 if(sources.length>1){
  html+=heading(history?t('Opbrengst per bron','Generation by source'):t('Vermogen per bron','Power by source'))+'<dl class="energy-grid-metrics energy-home-devices">';
  for(const source of sources)html+=deviceMetric(source.label,source.value,data.solar,{tone:'solar'});
  html+='</dl>';
 }
 if(!sources.length)html+=note(t('Geen zonnebronnen ingesteld in Energy.','No solar sources configured in Energy.'));

 return html;
}

export const energyFlowDetailStyles=uiDetailSurfaceStyles()+`
.energy-detail-surfaces,.energy-device-surfaces{display:grid;gap:10px;margin-top:12px}
.energy-device-sort{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0 0;font-size:11px;color:var(--secondary-text-color)}
.energy-device-sort select{min-height:32px;max-width:65%;border:1px solid var(--divider-color);border-radius:8px;padding:4px 8px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}
.energy-device-sort select:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}
@container(max-width:360px){.energy-home-summary dd{font-size:16px}}

:is([data-energy-popup],[data-energy-panel]){border-radius:8px;scrollbar-gutter:stable;scrollbar-width:thin;--detail-value-size:13px;--detail-value-weight:600;--detail-row-space:10px;--detail-bar-height:8px;--detail-bar-radius:8px;--detail-home:var(--house,var(--primary-color,#578d83));--detail-solar:var(--energy-solar-color,var(--solar,#c28a31));--detail-import:var(--energy-grid-consumption-color,var(--grid,#537dc0));--detail-export:var(--energy-grid-return-color,#9576bb)}
:is([data-energy-popup],[data-energy-panel]) .ui-popup-heading>strong{font-size:14px;font-weight:600}
:is([data-energy-popup],[data-energy-panel]) button{border-radius:8px}
.energy-grid-metrics>.energy-grid-net{grid-column:1/-1}
.energy-detail-note{font-size:11px;line-height:1.5;color:var(--secondary-text-color);margin:8px 0;overflow-wrap:anywhere}
:is([data-energy-popup],[data-energy-panel]) [data-tone=import]{--detail-tone:var(--detail-import)}
:is([data-energy-popup],[data-energy-panel]) [data-tone=export]{--detail-tone:var(--detail-export)}
:is([data-energy-popup],[data-energy-panel]) :is([data-tone=home],[data-tone=other]){--detail-tone:var(--detail-home)}
:is([data-energy-popup],[data-energy-panel]) [data-tone=solar]{--detail-tone:var(--detail-solar)}
.energy-detail-section{margin:16px 0 0}.energy-detail-section h3{font-size:12px;font-weight:650;line-height:1.4;margin:0;color:var(--primary-text-color)}
.energy-detail-track,.energy-detail-supply{display:flex;height:var(--detail-bar-height);margin:8px 0 0;border-radius:var(--detail-bar-radius);background:var(--divider-color,#ddd);overflow:hidden}
.energy-detail-track i,.energy-detail-supply i{display:block;height:100%;flex:none;border-radius:0;background:var(--detail-tone)}
.energy-detail-supply [data-supply=solar]{background:var(--detail-solar)}
.energy-detail-supply [data-supply=grid]{background:var(--detail-import)}
.energy-detail-supply [data-supply=import]{background:var(--detail-import)}
.energy-detail-supply [data-supply=export]{background:var(--detail-export)}
.energy-grid-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px;margin:16px 0 0}
.energy-grid-summary{margin-top:0}
.energy-grid-metrics>div{display:grid;grid-template-rows:subgrid;grid-row:span 2;min-width:0}
.energy-grid-metrics>div:nth-child(n+3){padding-top:14px}
.energy-grid-metrics dt{font-size:11px;color:var(--secondary-text-color,#666);overflow-wrap:anywhere;line-height:1.4}
.energy-grid-metrics dd{margin:0;min-width:0;font-size:18px;font-weight:600;line-height:1.35;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.energy-home-total>div{grid-column:1/-1}
.energy-home-devices{display:block;margin-top:8px}
.energy-home-devices>div{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto;gap:6px 12px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--divider-color,#ddd)}
.energy-home-devices>div:last-child{border-bottom:0}
.energy-home-devices>div:nth-child(n+3){padding-top:10px}
.energy-home-devices dt{grid-column:1;grid-row:1}
.energy-home-devices dd{grid-column:2;grid-row:1;display:grid;grid-template-columns:minmax(0,1fr) 56px;align-items:baseline;gap:8px;text-align:end;min-width:144px;max-width:180px}
.energy-home-devices dd strong{font:inherit;min-width:0}
.energy-home-devices dd small{font-size:13px;font-weight:600;letter-spacing:normal;white-space:nowrap;color:var(--secondary-text-color,#666)}
.energy-home-devices .energy-detail-track{grid-column:1/-1;grid-row:2;margin:0}
.energy-home-hint{grid-column:1/-1;grid-row:3;font-size:11px;font-weight:400;line-height:1.4;overflow-wrap:anywhere;color:var(--secondary-text-color,#666)}
.energy-home-devices>div:not(:has(.energy-detail-track)) .energy-home-hint{grid-row:2}
.energy-grid-connection+.energy-grid-connection{margin-top:8px}
.energy-grid-connection>span{display:block;font-size:11px;font-weight:400;letter-spacing:normal;color:var(--secondary-text-color,#666);line-height:1.4}
.energy-grid-connection>strong{font:inherit}
.energy-grid-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:8px;font-size:11px;line-height:1.4;color:var(--secondary-text-color,#666)}
.energy-grid-legend>span{position:relative;padding-inline-start:15px;overflow-wrap:anywhere}
.energy-grid-legend>span::before{content:'';position:absolute;inset-inline-start:0;top:.35em;width:8px;height:8px;border-radius:2px;background:var(--detail-tone)}
.energy-grid-legend strong{display:block;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--primary-text-color)}
@media(forced-colors:active){.energy-grid-balance [data-supply=import]{background:Highlight;forced-color-adjust:none}.energy-grid-balance [data-supply=export]{background:CanvasText;forced-color-adjust:none}}
button.circle-node:focus-visible{outline-offset:-3px}
@media(forced-colors:active){.energy-detail-track,.energy-detail-supply{background:Canvas;border:1px solid CanvasText}.energy-detail-track i,.energy-detail-supply [data-supply=grid]{background:CanvasText;forced-color-adjust:none}.energy-detail-supply [data-supply=solar]{background:Highlight;forced-color-adjust:none}}
`;
