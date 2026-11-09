import {advise,canonicalPrices,localValue,localInputISO} from './planner.js';
import {fetchTariffs,SOURCES} from './providers.js';
import {classifyPriceLevel} from '../../dynamic-energy-price-card/src/price-utils.js';
import {plannerCSS} from './styles.js';
import {uiButton} from '../../../shared/ui-button.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));

const active=p=>['planned','reminded','running'].includes(p.status);
const kinds={washer:'Wasmachine',dryer:'Droger',washer_dryer:'Wasdroogcombi',dishwasher:'Vaatwasser'};

const EN={'Apparatenplanner':'Appliance planner','Apparaat':'Appliance','Programma':'Program','Klaar vóór':'Ready before','Datum':'Date','Tijd':'Time','Vandaag':'Today','Morgen':'Tomorrow','Start om':'Start at','Klaar om':'Finish at','Geschatte kosten':'Estimated cost','Gemiddeld':'Average','Goedkoop':'Cheap','Normaal':'Normal','Duur':'Expensive','Negatief':'Negative','Besparing t.o.v. direct starten':'Savings vs starting now','Vergelijking niet beschikbaar':'Comparison unavailable','Tarieven en geadviseerde draaibeurt':'Tariffs and advised run','Instellingen':'Settings','Inplannen':'Save plan','Ingepland':'Planned','Gestart':'Started','Klaar':'Done','Annuleren':'Cancel','Gelijkmatig verbruik':'Uniform consumption','Gesimuleerd profiel':'Simulated profile','Gemeten profiel':'Measured profile','Lineaire schatting — integratie niet beschikbaar. Planning en meting zijn uitgeschakeld.':'Linear estimate — integration unavailable. Planning and measurement are disabled.','Berekenen…':'Calculating…','Instellen via de dashboard-editor. Wijzigingen worden pas gedeeld na Opslaan in het dashboard.':'Configure through the dashboard editor. Changes are shared only after saving the dashboard.','Duur (minuten)':'Duration (minutes)','Totaal kWh':'Total kWh','Naam':'Name','Bewaar programma':'Save program','Nieuw programma':'New program','Apparaat toevoegen':'Add appliance','Prijsbron':'Price source','Prijssensor':'Price sensor','Goedkoop tot (ct/kWh)':'Cheap up to (ct/kWh)','Duur boven (ct/kWh)':'Expensive above (ct/kWh)','Integratie koppelen':'Link integration','Integratie ontkoppelen':'Unlink integration','Programma’s overdragen':'Transfer programs','Geen programma’s. Open Instellingen in de dashboard-editor.':'No programs. Open Settings in the dashboard editor.','Voorlopig — niet alle prijzen tot de eindtijd zijn bekend. Alleen volledig geprijsde draaibeurt; geen gegarandeerd goedkoopste moment over de hele periode.':'Provisional — not all prices up to the deadline are known. Fully priced run only; no guaranteed optimum across the whole period.','Alleen advies. Je zet het apparaat zelf aan.':'Advice only. You start the appliance yourself.','Profielmodus':'Profile mode','Vermogensmeter':'Power meter','Geen meter':'No meter','Bewaar apparaat':'Save appliance','Meldingsactie':'Notification action','Bewaar meldingsactie':'Save notification action','Ook integratieprogramma’s als eenvoudige instellingen kopiëren':'Also copy integration programs to simple settings','Conflicten expliciet vervangen (bestaande metingen blijven behouden)':'Explicitly replace conflicts (existing measurements are retained)','Expliciete koppeling; installatie alleen schakelt niets in.':'Explicit link; installation alone enables nothing.','Geen overdracht geselecteerd':'No transfer selected','Instellingen niet beschikbaar voor deze gebruiker.':'Settings unavailable for this user.'};
Object.assign(EN,{'Bewaar instellingen':'Save settings','Apparaten en programma’s':'Appliances and programs','Integratie (optioneel)':'Integration (optional)','Integratie':'Integration','Type':'Type','Tibber-woning':'Tibber home','Wasmachine':'Washing machine','Droger':'Dryer','Wasdroogcombi':'Washer dryer','Vaatwasser':'Dishwasher','Integratie beheert deze programma’s. Metingen blijven behouden bij wijzigingen.':'The integration owns these programs. Changes retain measurements.','Exacte woningnaam; leeg kiest de enige woning. Alleen een EUR-woning gebruiken.':'Exact home name; leave blank for a sole home. Only use an EUR-priced home.','Starttijd bereikt':'Start time reached','Bezig':'Running'});
EN['Klaar vóór einde van']='Ready by the end of';
function localize(root,en){if(!en)return;const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(n.parentElement?.closest('[data-user],style,script'))continue;const raw=n.textContent,key=raw.trim();if(EN[key])n.textContent=raw.replace(key,EN[key]);}for(const el of root.querySelectorAll('[aria-label]'))if(EN[el.getAttribute('aria-label')])el.setAttribute('aria-label',EN[el.getAttribute('aria-label')]);}
export {esc,clone,kinds,localize};
export function validateConfig(config){
 const c=clone(config);c.appliances??=[];c.tariff??={source:'sensor'};c.cheap_price??=.15;c.expensive_price??=.4;
 if(!SOURCES.includes(c.tariff.source||'sensor'))throw Error('Onbekende prijsbron');
 if(!Number.isFinite(c.cheap_price)||!Number.isFinite(c.expensive_price)||c.cheap_price>c.expensive_price)throw Error('Ongeldige prijsgrenzen');
 if(!Array.isArray(c.appliances)||c.appliances.length>30)throw Error('Ongeldige apparaten');
 const aids=new Set();for(const a of c.appliances){if(!a.id||aids.has(a.id)||!a.name?.trim()||!kinds[a.kind]||!Array.isArray(a.programs)||a.programs.length>30)throw Error('Ongeldig apparaat');aids.add(a.id);const pids=new Set();for(const p of a.programs){if(!p.id||pids.has(p.id)||!p.name?.trim()||!(Number(p.minutes)>=1&&Number(p.minutes)<=1440&&Number(p.kwh)>0&&Number(p.kwh)<=30))throw Error('Ongeldig programma');pids.add(p.id);}}
 return c;
}
export class ElevenAppliancePlanner extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.form={};this.epoch=0;this.message='';this.lastKnown=[];}
 static getStubConfig(){return {type:'custom:eleven-appliance-planner',appliances:[],tariff:{source:'sensor'}};}
 static getConfigElement(){return document.createElement('eleven-appliance-planner-editor');}
 getCardSize(){return 5;}getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
 setConfig(config){this.backendOutage=false;this.tariffRequest=null;this.config=validateConfig(config);this.epoch++;this.lastKnown=clone(this.config.integration?.programs_snapshot||[]);this.render();this.recompute();}
 set hass(h){const previous=this._hass;if(previous?.connection!==h.connection||previous?.connection?.connected===false||h.connection?.connected===false)this.tariffRequest=null;this._hass=h;if(this.online)this.lastKnown=clone(this.integrationData.appliances||[]);const signature=JSON.stringify([h.states?.[this.config?.tariff?.entity],this.config?.integration?.enabled?h.states?.[this.config.integration.entity]:null,h.connection?.connected,h.config?.time_zone,h.locale?.language,h.user?.is_admin]);if(signature!==this.signature||previous?.connection!==h.connection){this.signature=signature;this.recompute();}else if(!this.shadowRoot.firstChild)this.render();}
 get hass(){return this._hass;}get zone(){return this._hass?.config?.time_zone||'Europe/Amsterdam';}get en(){return this._hass?.locale?.language?.startsWith('en');}
 get linked(){return this.config?.integration?.enabled===true;}
 get integrationState(){return this._hass?.states?.[this.config?.integration?.entity];}
 get entityOnline(){return this.linked&&this._hass?.connection?.connected!==false&&this.integrationState&&this.integrationData.protocol_version>=2&&!['unknown','unavailable'].includes(this.integrationState.state);}
 get online(){return this.entityOnline&&!this.backendOutage;}
 get integrationData(){return this.integrationState?.attributes||{};}
 get appliances(){return this.linked?(this.online?this.integrationData.appliances||[]:this.lastKnown):this.config?.appliances||[];}
 connectedCallback(){this.render();this.recompute();this.timer=setInterval(()=>this.recompute(),60000);}
 disconnectedCallback(){clearInterval(this.timer);this.tariffRequest=null;this.epoch++;}
 format(n,digits=2){return new Intl.NumberFormat(this.en?'en-GB':'nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);}
 price(n){return new Intl.NumberFormat(this.en?'en-GB':'nl-NL',{style:'currency',currency:'EUR'}).format(n);}
 time(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));}
 day(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,weekday:'long',year:'numeric',day:'numeric',month:'long'}).format(new Date(s));}
 shortDay(s){return new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,day:'numeric',month:'short',year:'numeric'}).format(new Date(s));}
 today(offset=0){const day=localValue(Date.now(),this.zone).slice(0,10);return new Date(Date.parse(day+'T12:00Z')+offset*86400000).toISOString().slice(0,10);}
 selected(){const a=this.appliances.find(x=>x.id===this.form.aid)||this.appliances[0];this.form.aid=a?.id;const p=a?.programs.find(x=>x.id===this.form.pid)||a?.programs[0];this.form.pid=p?.id;return [a,p];}
 // Calendar arithmetic first; localInputISO resolves the zone's actual midnight.
 syncDay(){const previous=this.form.deadline,today=this.today();if(![today,this.today(1)].includes(this.form.day))this.form.day=today;const next=new Date(this.form.day+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);this.form.deadline=next.toISOString().slice(0,10)+'T00:00';return !!previous&&previous!==this.form.deadline;}
 payload(){this.syncDay();return {appliance_id:this.form.aid,program_id:this.form.pid,deadline:localInputISO(this.form.deadline,this.zone),tariff_source:clone(this.config.tariff)};}
 command(operation,payload={}){return this._hass.callWS({type:'eleven_appliance_planner/command',operation,payload});}
 async tariffs(now){
  if(['sensor','zonneplan'].includes(this.config.tariff.source||'sensor'))return fetchTariffs(this._hass,this.config.tariff,now);
  const key=JSON.stringify([this.config.tariff,this.zone,this._hass.config?.currency,this.today()]);
  if(this.tariffRequest?.key===key&&Date.now()-this.tariffRequest.created<300000)return this.tariffRequest.promise;
  const request={key,created:Date.now()};request.promise=fetchTariffs(this._hass,this.config.tariff,now).catch(error=>{if(this.tariffRequest===request)this.tariffRequest=null;throw error;});this.tariffRequest=request;return request.promise;
 }
 async recompute(){
  if(!this.config||!this._hass)return;
  if(this.entityOnline)this.lastKnown=clone(this.integrationData.appliances||[]);
  const epoch=++this.epoch;const [a,p]=this.selected();this.syncDay();
  if(!p){this.result=null;this.render();return;}
  this.loading=true;this.result=null;this.message='';this.error=false;this.render();
  try{
   const deadline=localInputISO(this.form.deadline,this.zone),now=new Date();
   const rows=await this.tariffs(now);
   if(epoch!==this.epoch)return;
   this.rows=rows;
   let result;
   if(this.entityOnline){
    try{result=await this.command('preview',this.payload());if(epoch!==this.epoch)return;this.backendOutage=false;}
    catch(error){if(!['not_loaded','connection_lost','disconnected','cannot_connect'].includes(error.code))throw error;if(epoch!==this.epoch)return;this.backendOutage=true;result=advise(rows,p,now,deadline);}
   }else result=advise(rows,p,now,deadline);
   if(epoch!==this.epoch)return;
   if(result.price_intervals)this.rows=canonicalPrices(result.price_intervals);
   this.result=result;
  }catch(err){if(epoch!==this.epoch)return;this.error=true;this.message=err.message||String(err);this.rows=[];}
  finally{if(epoch===this.epoch){this.loading=false;this.render();}}
 }
 async act(operation,id){
  if(this.pending||!this.online)return;
  if(operation==='save'&&(this.syncDay()||!this.result||this.loading)){this.recompute();return;}
  const previousFocus=this.shadowRoot.activeElement?.id;let changed;
  this.pending=true;this.message='';this.error=false;this.render();
  try{
   changed=await this.command(operation,operation==='save'?this.payload():{id});
   const fresh=await this.command('status');this.lastKnown=clone(fresh.appliances);
   this._hass={...this._hass,states:{...this._hass.states,[this.config.integration.entity]:{...this.integrationState,attributes:fresh}}};
   this.message=operation==='save'?'Ingepland. Je zet het apparaat zelf aan.':operation==='start'?'Als gestart geregistreerd; niets aangezet.':'Opgeslagen';
  }catch(err){this.error=true;this.message=err.message||String(err);}
  finally{
   this.pending=false;this.render();
   const action=[...this.shadowRoot.querySelectorAll('[data-op]')].find(el=>el.dataset.id===(changed?.id||id)&&el.dataset.op!=='cancel');
   (action||this.shadowRoot.getElementById(previousFocus)||this.shadowRoot.getElementById('program'))?.focus();
  }
 }
 graph(){
  if(!this.rows?.length||!this.result)return '';
  const rows=this.rows,from=+new Date(rows[0].start),to=+new Date(rows.at(-1).end),min=Math.min(...rows.map(r=>r.price)),max=Math.max(...rows.map(r=>r.price)),range=max-min||.1;
  const x=t=>20+(+new Date(t)-from)/(to-from)*460,y=p=>100-(p-min)/range*80;
  const paths=rows.map((r,i)=>`${i&&rows[i-1].end===r.start?'L':'M'}${x(r.start)},${y(r.price)}H${x(r.end)}`).join(' ');
  const axis=s=>new Intl.DateTimeFormat(this.en?'en-GB':'nl-NL',{timeZone:this.zone,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));
  return `<div class="tariff-detail"><p class="muted">Tarieven en geadviseerde draaibeurt</p><div class="graph-labels muted"><span>${this.format(max*100,1)} ct/kWh</span><span>${this.format(min*100,1)} ct/kWh</span></div><svg class="graph" viewBox="0 0 500 120" preserveAspectRatio="none" role="img" aria-label="Tarieven en geadviseerde draaibeurt"><rect class="highlight" x="${x(this.result.start)}" y="10" width="${x(this.result.end)-x(this.result.start)}" height="100"/><path class="tariff" d="${paths}"/></svg><div class="graph-labels muted"><span>${axis(rows[0].start)}</span><span>${axis(rows.at(-1).end)}</span></div></div>`;
 }
 render(){
  if(!this.config||!this._hass)return;
  // Read synchronously: native toggle events may still be queued during an update.
  const disclosure=this.shadowRoot.querySelector('#advice-details');if(disclosure)this.detailsOpen=disclosure.open;
  const [a,p]=this.selected();if(this.syncDay()){this.recompute();return;}
  const main=`<div class="selection"><label><span>Apparaat</span><select id="appliance" title="${esc(a?.name)}" aria-label="${this.en?'Appliance':'Apparaat'}: ${esc(a?.name)}">${this.appliances.map(item=>`<option data-user value="${esc(item.id)}" ${item.id===this.form.aid?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label><label><span>Programma</span><select id="program" title="${esc(p?.name)}" aria-label="${this.en?'Program':'Programma'}: ${esc(p?.name)}">${(a?.programs||[]).map(item=>`<option data-user value="${esc(item.id)}" ${item.id===this.form.pid?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label></div><fieldset class="deadline"><legend>Klaar vóór einde van</legend><div class="quick">${['Vandaag','Morgen'].map((l,i)=>uiButton({variant:'action-choice',text:l,className:'text',attrs:{id:`day-${i}`,'data-day':this.today(i),'aria-pressed':this.form.day===this.today(i)}})).join('')}</div></fieldset>`;
  const r=this.result;let advice='';
  if(r){const level=classifyPriceLevel(r.average,this.config.cheap_price,.25,this.config.expensive_price),label={cheap:'Goedkoop',normal:'Normaal',expensive:'Duur',negative:'Negatief'}[level];
   advice=`<section class="advice" aria-label="Startadvies"><div class="reading-well"><div class="run-times">${[['Start om',r.start],['Klaar om',r.end]].map(([title,stamp])=>`<div><span class="muted">${title}</span><strong>${this.time(stamp)}</strong><span class="muted" title="${esc(this.day(stamp))}">${this.shortDay(stamp)}</span></div>`).join('')}</div><div class="cost-line"><span><span class="muted">Geschatte kosten</span> <strong>${this.price(r.cost)}</strong></span><span class="price-level ${level}">${label}</span></div></div>${this.linked&&!this.online?'<p class="status warning">Lineaire schatting — integratie niet beschikbaar. Planning en meting zijn uitgeschakeld.</p>':''}${r.provisional?'<p class="status warning">Voorlopig — niet alle prijzen tot de eindtijd zijn bekend. Alleen volledig geprijsde draaibeurt; geen gegarandeerd goedkoopste moment over de hele periode.</p>':''}<details id="advice-details" ${this.detailsOpen?'open':''}><summary id="advice-summary">Details</summary><div class="detail-body"><div class="detail-row"><span>Gemiddeld</span><strong>${this.format(r.average*100,1)} ct/kWh</strong></div><p class="status">${r.savings===null?'Vergelijking niet beschikbaar':`<span>Besparing t.o.v. direct starten</span>: <strong>${this.price(r.savings)}</strong>`}</p><p class="status muted">${r.profile_mode==='measured'&&this.online?'Gemeten profiel':r.profile_mode==='simulated'&&this.online?'Gesimuleerd profiel':'Gelijkmatig verbruik'}</p>${this.graph()}</div></details>${this.online?uiButton({variant:'action',text:'Inplannen',className:'primary',disabled:this.pending||(this.integrationData.plans||[]).some(plan=>active(plan)&&plan.appliance_id===this.form.aid),attrs:{id:'save-plan'}}):''}</section>`;
  }
  const plans=this.online?(this.integrationData.plans||[]).filter(active):[];
  const content=`<style>${plannerCSS}</style><ha-card><header><h2 data-user>${esc(this.config.title||(this.en?'Appliance planner':'Apparatenplanner'))}</h2></header>${p?main:'<p class="empty">Geen programma’s. Open Instellingen in de dashboard-editor.</p>'}<div id="advice-slot" aria-live="polite">${advice}<p class="status ${this.error?'error':''}">${esc(this.loading?'Berekenen…':this.message)}</p></div>${plans.length?`<section><h3>Ingepland</h3>${plans.map(plan=>`<article class="plan"><strong data-user>${esc(this.appliances.find(a=>a.id===plan.appliance_id)?.name)} · ${esc(this.appliances.find(a=>a.id===plan.appliance_id)?.programs.find(p=>p.id===plan.program_id)?.name)}</strong><div class="date">${this.time(plan.start)} · ${this.day(plan.start)}</div><div class="muted"><span>${({planned:'Ingepland',reminded:'Starttijd bereikt',running:'Bezig'})[plan.status]}</span> · ${this.price(plan.cost)}</div><div class="actions">${uiButton({variant:'action',text:plan.status==='running'?'Klaar':'Gestart',disabled:this.pending,attrs:{id:`plan-${plan.id}-${plan.status==='running'?'done':'start'}`,'data-op':plan.status==='running'?'done':'start','data-id':plan.id}})}${uiButton({variant:'action',text:'Annuleren',disabled:this.pending,attrs:{id:`plan-${plan.id}-cancel`,'data-op':'cancel','data-id':plan.id}})}</div></article>`).join('')}</section>`:''}<p class="muted">Alleen advies. Je zet het apparaat zelf aan.</p></ha-card>`;
   const focus=this.shadowRoot.activeElement?.id;

  this.shadowRoot.innerHTML=content;
  const appliance=this.shadowRoot.querySelector('#appliance'),program=this.shadowRoot.querySelector('#program');
  if(appliance)appliance.onchange=()=>{this.form.aid=appliance.value;this.form.pid=null;this.recompute();};
  if(program)program.onchange=()=>{this.form.pid=program.value;this.recompute();};
  this.shadowRoot.querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>{this.form.day=el.dataset.day;this.recompute();});

  this.bindResult();this.shadowRoot.querySelectorAll('[data-op]').forEach(el=>el.onclick=()=>this.act(el.dataset.op,el.dataset.id));
  localize(this.shadowRoot,this.en);if(focus)this.shadowRoot.getElementById(focus)?.focus();
 }

 bindResult(){const save=this.shadowRoot.querySelector('#save-plan');if(save)save.onclick=()=>this.act('save');const details=this.shadowRoot.querySelector('#advice-details');if(details)details.addEventListener('toggle',()=>{if(details.isConnected)this.detailsOpen=details.open;});}
}
