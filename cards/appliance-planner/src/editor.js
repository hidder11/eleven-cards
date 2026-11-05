// Native Lovelace editor: only config-changed; the native dashboard Save owns persistence.
import {SOURCES} from './providers.js';
import {plannerCSS} from './styles.js';
import {uiButton} from '../../../shared/ui-button.js';
import {validateConfig,esc,clone,kinds,localize} from './appliance-planner.js';
const uid=()=>globalThis.crypto?.randomUUID?.()||`p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export class ElevenAppliancePlannerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.entries=[];this.message='';}
 setConfig(c){const next=validateConfig(c),same=JSON.stringify(next)===JSON.stringify(this.config);this.config=next;if(!same||!this.shadowRoot.firstChild)this.render();}
 set hass(h){const adminChanged=this.lastAdmin!==h.user?.is_admin;this.lastAdmin=h.user?.is_admin;this._hass=h;if(adminChanged||!this.shadowRoot.activeElement?.matches('input,select'))this.render();if(h.user?.is_admin&&!this.entriesAsked){this.entriesAsked=true;h.callWS({type:'config_entries/get'}).then(entries=>{this.entries=entries;if(!this.shadowRoot.activeElement?.matches('input,select'))this.render();}).catch(error=>{this.message=(this.en?'Cannot load integration configurations: ':'Integratieconfiguraties ophalen mislukt: ')+(error.message||String(error));if(!this.shadowRoot.activeElement?.matches('input,select'))this.render();});}}
 get hass(){return this._hass;}get en(){return this._hass?.locale?.language?.startsWith('en');}get linked(){return this.config.integration?.enabled===true;}
 get data(){const s=this._hass?.states?.[this.config?.integration?.entity];return s&&!['unknown','unavailable'].includes(s.state)?s.attributes:null;}
 get appliances(){return this.linked?this.data?.appliances||this.config.integration.programs_snapshot||[]:this.config.appliances;}
 emit(){if(!this._hass?.user?.is_admin)throw Error('Alleen beheerders');this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:clone(this.config)},bubbles:true,composed:true}));}
 // Backend v2 previews/plans resolve stored IDs, not dashboard overrides. Never
 // mutate its records from a draft; linked settings remain explicitly read-only.
 async run(fn){if(this.pending)return;this.pending=true;this.message='';try{await fn();}catch(e){this.message=e.message||String(e);}finally{this.pending=false;this.render();}}
 async link(){
  const entity=this.shadowRoot.querySelector('#integration-entity').value;
  if(!entity)throw Error('Kies de planner-integratie');
  const state=this._hass.states?.[entity];
  if(!state||['unknown','unavailable'].includes(state.state)||!(state.attributes?.protocol_version>=2))throw Error('Werk de optionele integratie bij voor expliciete profielen en prijsbronnen');
  this.config.integration={enabled:true,entity,programs_snapshot:clone(state.attributes.appliances||[])};this.emit();
 }
 unlink(){
  const copy=this.shadowRoot.querySelector('#copy-unlink').checked;

  if(copy)this.config.appliances=this.appliances.map(a=>({id:a.id,name:a.name,kind:a.kind,programs:a.programs.map(p=>({id:p.id,name:p.name,minutes:p.minutes,kwh:p.kwh}))}));
  this.config.integration={...this.config.integration,enabled:false};this.emit();this.render();
 }
 render(){
  if(!this.config||!this._hass)return;
  if(!this._hass.user?.is_admin){this.shadowRoot.innerHTML='<p>Instellingen niet beschikbaar voor deze gebruiker.</p>';return;}
  const disclosures=new Map([...this.shadowRoot.querySelectorAll('details[id]')].map(el=>[el.id,el.open]));
  const drafts={};this.shadowRoot.querySelectorAll('[data-draft]').forEach(el=>{if(!el.closest('.appliance-edit,.program-edit'))drafts[el.dataset.draft]=el.type==='checkbox'?el.checked:el.value;});const focus=this.shadowRoot.activeElement?.id;
  const option=(value,label,selected)=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`;
  const states=Object.values(this._hass.states||{}),tariff=this.config.tariff;
  const priceSensors=states.filter(s=>s.entity_id?.startsWith('sensor.'));
  const plannerSensors=states.filter(s=>s.entity_id?.startsWith('sensor.eleven_appliance_planner')||(s.attributes?.protocol_version>=2&&Array.isArray(s.attributes.appliances)));
  const meters=states.filter(s=>s.attributes?.device_class==='power'&&['W','kW'].includes(s.attributes.unit_of_measurement)&&s.attributes.calculation_mode!=='fixed');
  let html=`<style>${plannerCSS}</style><div class="fields"><label>Naam<input id="title" data-config="title" value="${esc(this.config.title||'')}" maxlength="80"></label><label>Prijsbron<select id="source" data-tariff="source">${SOURCES.map(s=>option(s,s,tariff.source||'sensor')).join('')}</select></label>`;
  if(['sensor','zonneplan'].includes(tariff.source||'sensor'))html+=`<label>Prijssensor<select id="price-entity" data-tariff="entity">${option('','—',tariff.entity)}${priceSensors.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,tariff.entity)).join('')}</select></label>`;
  if(['energyzero','tibber_prices'].includes(tariff.source)){
   const domain=tariff.source,key=domain==='energyzero'?'energyzero_entry':'tibber_entry';
   html+=`<label>${esc(domain)}<select id="provider-entry" data-tariff="${key}">${option('','—',tariff[key])}${this.entries.filter(e=>e.domain===domain).map(e=>option(e.entry_id,e.title,tariff[key])).join('')}</select></label>`;
  }
  if(tariff.source==='tibber')html+=`<label>Tibber-woning<input id="tibber-home" data-tariff="tibber_home" value="${esc(tariff.tibber_home||'')}"></label><small>Exacte woningnaam; leeg kiest de enige woning. Alleen een EUR-woning gebruiken.</small>`;
  html+=`<div class="program-fields thresholds"><label>Goedkoop tot (ct/kWh)<input id="cheap" type="number" step="any" data-threshold="cheap_price" value="${this.config.cheap_price*100}"></label><label>Duur boven (ct/kWh)<input id="expensive" type="number" step="any" data-threshold="expensive_price" value="${this.config.expensive_price*100}"></label></div></div><details id="programs-section" open><summary>Apparaten en programma’s</summary>${this.linked?'<p class="owned">Integratie beheert deze programma’s. Metingen blijven behouden bij wijzigingen.</p>':''}`;
  html+=this.appliances.map(a=>`<div class="editor-group"><form class="appliance-edit fields" data-aid="${esc(a.id)}"><label>Apparaat<input name="name" data-draft="${esc(a.id)}-name" required maxlength="80" value="${esc(a.name)}"></label>${this.linked?`<label>Vermogensmeter<select name="power_sensor" data-draft="${esc(a.id)}-meter">${option('','Geen meter',a.power_sensor||'')}${meters.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,a.power_sensor)).join('')}</select></label>`:''}</form>${a.programs.map(p=>`<form class="program-edit fields editor-group" data-aid="${esc(a.id)}" data-pid="${esc(p.id)}"><div class="program-fields"><label>Programma<input name="name" data-draft="${esc(a.id+p.id)}-name" required maxlength="80" value="${esc(p.name)}"></label><label>Duur (minuten)<input name="minutes" data-draft="${esc(a.id+p.id)}-minutes" type="number" min="1" max="1440" step="any" required value="${p.minutes}"></label><label>Totaal kWh<input name="kwh" data-draft="${esc(a.id+p.id)}-kwh" type="number" min="0.001" max="30" step="any" required value="${p.kwh}"></label></div>${this.linked?`<label>Profielmodus<select name="profile_mode" data-draft="${esc(a.id+p.id)}-mode">${option('uniform','Gelijkmatig verbruik',p.profile_mode)}${option('simulated','Gesimuleerd profiel',p.profile_mode)}${p.has_measured_profile?option('measured','Gemeten profiel',p.profile_mode):''}</select></label>`:''}</form>`).join('')}<form class="program-add fields editor-group" data-aid="${esc(a.id)}"><div class="program-fields"><label>Nieuw programma<input name="name" data-draft="${esc(a.id)}-new-name" required maxlength="80"></label><label>Duur (minuten)<input name="minutes" data-draft="${esc(a.id)}-new-minutes" type="number" min="1" max="1440" step="any" required></label><label>Totaal kWh<input name="kwh" data-draft="${esc(a.id)}-new-kwh" type="number" min=".001" max="30" step="any" required></label></div>${uiButton({variant:'action',type:'submit',text:'Nieuw programma'})}</form></div>`).join('');
  html+=`<form id="add-appliance" class="fields editor-group"><label>Apparaat<input name="name" data-draft="new-appliance" required maxlength="80"></label><label>Type<select name="kind" data-draft="new-appliance-kind">${Object.entries(kinds).map(([k,l])=>option(k,l,'washer')).join('')}</select></label>${uiButton({variant:'action',type:'submit',text:'Apparaat toevoegen'})}</form></details><details id="integration-section"><summary>Integratie (optioneel)</summary><p class="muted">Expliciete koppeling; installatie alleen schakelt niets in.</p>`;
  if(this.linked){
   html+=`<label class="check"><input id="copy-unlink" data-draft="copy-unlink" type="checkbox">Ook integratieprogramma’s als eenvoudige instellingen kopiëren</label>${uiButton({variant:'action',text:'Integratie ontkoppelen',attrs:{id:'unlink'}})}`;
   if(this.data)html+=`<label>Meldingsactie<input id="notification-action" disabled value="${esc(this.data.settings?.notification_action||'persistent_notification.create')}"></label>`;
  }else{
   html+=`<label>Integratie<select id="integration-entity" data-draft="integration-entity">${option('','—','')}${plannerSensors.map(s=>option(s.entity_id,s.attributes.friendly_name||s.entity_id,'')).join('')}</select></label>${uiButton({variant:'action',text:'Integratie koppelen',attrs:{id:'link'}})}`;
  }
  const help=this.en?'Changes are drafts. Use Home Assistant Save to persist them, or Cancel to discard them. Linking does not transfer or change backend records.':'Wijzigingen zijn concepten. Gebruik Opslaan van Home Assistant om ze te bewaren, of Annuleren om ze te verwerpen. Koppelen draagt geen backendgegevens over en wijzigt ze niet.';
  html+=`</details><p class="status error" role="status">${esc(this.message)}</p><p class="muted">${esc(help)}</p>`;
  this.shadowRoot.innerHTML=html;
  this.shadowRoot.querySelectorAll('details[id]').forEach(el=>{if(disclosures.has(el.id))el.open=disclosures.get(el.id);});
  this.shadowRoot.querySelectorAll('[data-draft]').forEach(el=>{if(el.dataset.draft in drafts){if(el.type==='checkbox')el.checked=drafts[el.dataset.draft];else el.value=drafts[el.dataset.draft];}});
  const status=()=>{this.shadowRoot.querySelector('[role=status]').textContent=this.message;};
  this.shadowRoot.querySelectorAll('[data-config],[data-tariff],[data-threshold]').forEach(el=>{
   const update=()=>{if(!el.checkValidity()||el.type==='number'&&el.value==='')return;const next=clone(this.config);try{if(el.dataset.config)next[el.dataset.config]=el.value;if(el.dataset.tariff)next.tariff[el.dataset.tariff]=el.value;if(el.dataset.threshold)next[el.dataset.threshold]=Number(el.value)/100;this.config=validateConfig(next);this.emit();this.message='';}catch(e){this.message=e.message;}status();if(el.id==='source')this.render();};
   if(el.tagName==='SELECT')el.onchange=update;else el.oninput=update;
  });
  this.shadowRoot.querySelectorAll('form').forEach(form=>{
   const edit=form.matches('.appliance-edit,.program-edit');
   const update=()=>{
    if(this.linked||!this._hass?.user?.is_admin||!form.checkValidity())return;
    const values=Object.fromEntries(new FormData(form)),aid=form.dataset.aid,pid=form.dataset.pid,next=clone(this.config);
    try{
     if(form.id==='add-appliance')next.appliances.push({id:uid(),name:values.name,kind:values.kind,programs:[]});
     else{const a=next.appliances.find(a=>a.id===aid);if(form.classList.contains('appliance-edit'))a.name=values.name;else{const p=pid?a.programs.find(p=>p.id===pid):{id:uid()};Object.assign(p,{name:values.name,minutes:Number(values.minutes),kwh:Number(values.kwh)});if(!pid)a.programs.push(p);}}
     this.config=validateConfig(next);this.message='';this.emit();
     if(!edit){form.querySelectorAll('[data-draft]').forEach(el=>el.removeAttribute('data-draft'));this.render();}else status();
    }catch(e){this.message=e.message||String(e);status();}
   };
   form.onsubmit=e=>{e.preventDefault();if(!edit)update();};
   if(edit){if(this.linked)form.querySelectorAll('input,select').forEach(el=>el.disabled=true);else form.oninput=update;}
   else if(this.linked)form.remove();
  });
  const owned=this.shadowRoot.querySelector('.owned');if(owned)owned.textContent=this.en?'Integration settings are read-only: the backend cannot apply dashboard drafts on native Save. Unlink to edit simple card settings; backend programs, measurements and plans stay unchanged.':'Integratie-instellingen zijn alleen-lezen: de backend kan dashboardconcepten niet bij native Opslaan toepassen. Ontkoppel om eenvoudige kaartinstellingen te bewerken; backendprogramma’s, metingen en plannen blijven ongewijzigd.';
  const link=this.shadowRoot.querySelector('#link');if(link)link.onclick=()=>this.run(()=>this.link());
  const unlink=this.shadowRoot.querySelector('#unlink');if(unlink)unlink.onclick=()=>this.unlink();

  this.shadowRoot.querySelectorAll('button').forEach(el=>el.disabled=this.pending);
  localize(this.shadowRoot,this._hass.locale?.language?.startsWith('en'));if(focus)this.shadowRoot.getElementById(focus)?.focus();
 }
}
