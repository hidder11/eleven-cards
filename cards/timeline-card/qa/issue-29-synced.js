import './issue-29-live.js';
import '../../bar-chart/dist/eleven-bar-chart.js';
import '../../history-graph-card/dist/eleven-history-graph-card.js';
const timeline=document.querySelector('eleven-timeline-card'),bar=document.querySelector('eleven-bar-chart'),graph=document.querySelector('eleven-history-graph-card');
const base=timeline._hass,history=base.callApi;
const powers=['sensor.heat_power','sensor.annex_power','sensor.studio_power'],temps=['sensor.flow','sensor.return','sensor.room'];
const names=['Warmtepomp woning','Warmtepomp bijgebouw','Warmtepomp studio','Uitgaand','Ingaand','Woonkamer'];
const hass={...base,locale:{language:'nl'},states:{...base.states,...Object.fromEntries([...powers,...temps].map((id,i)=>[id,{state:'20',attributes:{friendly_name:names[i],unit_of_measurement:i<3?'kW':'°C'}}]))},callApi:async(method,url)=>{
 const query=new URLSearchParams(url.split('?')[1]),ids=(query.get('filter_entity_id')??'').split(',');
 if(!ids.some(id=>powers.includes(id)||temps.includes(id)))return history(method,url);
 const start=Date.parse(decodeURIComponent(url.split('?')[0].split('period/')[1])),end=Date.parse(query.get('end_time'));
 return ids.map(id=>{const i=[...powers,...temps].indexOf(id);return Array.from({length:193},(_,n)=>({entity_id:id,state:(i<3?Math.max(.1,1.6-i*.35+Math.sin(n/9+i)*.85):i===5?19.5+Math.sin(n/24)*.7:35-(i-3)*5+Math.sin(n/13)*4).toFixed(2),last_changed:new Date(start+(end-start)*n/192).toISOString()}));});
}};
const common={hours_to_show:48,sync_hover:true,hover_sync_group:'issue-29',background:'none'};
timeline.setConfig({...timeline._config,...common});timeline.hass=hass;
bar.setConfig({...common,entities:powers,title:'Elektrisch vermogen',data_source:'history'});bar.hass=hass;
graph.setConfig({...common,entities:temps,title:'Temperaturen',data_source:'history'});graph.hass=hass;
window.demoCards=[timeline,bar,graph];
function preview(){for(const c of demoCards)c._hideTooltip();const r=timeline.shadowRoot.querySelectorAll('.timeline-group')[1]?.querySelector('.track').getBoundingClientRect();timeline._tooltipGroup='Ventilatie';timeline._tooltipPointer=r?{x:r.left+r.width*.72,y:r.top+r.height/2}:null;timeline._pinned=true;timeline._showTooltip(timeline._viewStart+(timeline._viewEnd-timeline._viewStart)*.72);}
document.querySelector('#preview').onclick=preview;
document.querySelector('#layout').onclick=()=>{const narrow=document.body.classList.toggle('narrow');document.querySelector('#layout').setAttribute('aria-pressed',String(narrow));document.querySelector('#layout').textContent=narrow?'Naast elkaar':'Onder elkaar';demoCards.forEach(c=>c._hideTooltip());};
window.syncedDemo={preview};
