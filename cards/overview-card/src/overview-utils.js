import {timeframeSyncConfig} from '../../../shared/periods.js';
export function historyUrl(ids,start,end){return `history/period/${new Date(start).toISOString()}?filter_entity_id=${encodeURIComponent(ids.join(','))}&end_time=${encodeURIComponent(new Date(end).toISOString())}`;}
export function historySeries(rows,start,end,unit){
 const data=(rows??[]).map(r=>({t:Date.parse(r.last_updated??r.last_changed),v:(r.attributes?.unit_of_measurement??'')===(unit??'')?numeric(r.state):null})).filter(r=>Number.isFinite(r.t)&&r.t<=end).sort((a,b)=>a.t-b.t);
 const before=data.filter(r=>r.t<=start).at(-1),points=before?[{t:start,v:before.v}]:[];
 for(const r of data)if(r.t>start)points.push(r);
 if(points.length)points.push({t:end,v:points.at(-1).v});
 return {points,baseline:before?.v??null};
}
export function delta(series,current){return series?.baseline!=null&&current!=null?current-series.baseline:null;}
export function sparkline(points,start,end){
 const values=points.filter(p=>p.v!=null).map(p=>p.v);if(!values.length||end<=start)return '';
 let min=Infinity,max=-Infinity;for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}
 const span=max-min;let path='',prior=null;
 for(const p of points){const x=2+Math.max(0,Math.min(1,(p.t-start)/(end-start)))*296;if(p.v==null){if(prior)path+=`H${x.toFixed(2)}`;prior=null;continue;}const y=span?44-(p.v-min)/span*40:24;
 path+=prior==null?`M${x.toFixed(2)},${y.toFixed(2)}`:`H${x.toFixed(2)}V${y.toFixed(2)}`;prior=p;}
 return path;
}
export const PALETTE=['#2196f3','#e78a14','#ab70d9','#26a69a','#e66b91','#718cc2','#a18d3a','#718d78'];
export function numeric(value){if(typeof value!=='number'&&(typeof value!=='string'||!value.trim()||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim())))return null;const n=Number(value);return Number.isFinite(n)?n:null;}
export function color(value,fallback=PALETTE[0]){if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=255))return `rgb(${value.join(',')})`;return typeof value==='string'&&/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)?value:fallback;}
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function overviewSectionLayout(config={}){
 const layout={compact:{padding:10,gap:8,value:24,graph:32,minimum:118},standard:{padding:14,gap:12,value:28,graph:40,minimum:134},spacious:{padding:20,gap:16,value:36,graph:64,minimum:166}}[config.section_size??'standard'];
 return {...layout,graph:config.graph_height??layout.graph};
}
export function normalizeConfig(input,{draft=false}={}){
 const entities=(input.entities??[]).map((row,i)=>typeof row==='string'?{entity:row,color:PALETTE[i%PALETTE.length]}:{...row,color:Array.isArray(row.color)?[...row.color]:row.color??PALETTE[i%PALETTE.length]});
 if(!draft&&(!entities.length||entities.some(r=>!/^sensor\.[a-z0-9_]+$/.test(r.entity))||new Set(entities.map(r=>r.entity)).size!==entities.length))throw Error('Select at least one unique sensor entity. / Kies minstens één unieke sensor.');
 const hours=input.hours_to_show??24,columns=String(input.columns??'auto');
 if(!Number.isFinite(hours)||hours<1||hours>168)throw Error('Period must be 1–168 hours. / Periode moet 1–168 uur zijn.');
 if(!['auto','1','2','3'].includes(columns))throw Error('Columns must be auto, 1, 2 or 3.');
 const section_size=input.section_size??'standard',graph_height=input.graph_height??undefined;
 if(!['compact','standard','spacious'].includes(section_size))throw Error('Section size must be compact, standard or spacious. / Kies compact, standaard of ruim.');
 if(graph_height!==undefined&&(!Number.isInteger(graph_height)||graph_height<24||graph_height>160))throw Error('Graph height must be 24–160 pixels. / Grafiekhoogte moet 24–160 pixels zijn.');
 return {...input,...timeframeSyncConfig(input,{draft}),type:'custom:eleven-overview-card',title:input.title==='Eleven Overview (beta)'?'Eleven Overview':input.title??'Eleven Overview',hours_to_show:hours,columns,section_size,graph_height,show_graph:input.show_graph!==false,show_delta:input.show_delta!==false,entities};
}
