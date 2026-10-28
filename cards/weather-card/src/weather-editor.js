import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
import {normalizeWeatherConfig,weatherDutch,weatherVisibleTabs,weatherForecastFields,WEATHER_METRICS,WEATHER_FORECAST_FIELDS} from './weather-utils.js';
import {WEATHER_BACKGROUNDS} from './weather-backgrounds.js';

const weatherEditorLabels={entity:['Weerentiteit','Weather entity'],title:['Kaartnaam (toegankelijkheid)','Card name (accessibility)'],background_strength:['Achtergrondsterkte','Background intensity'],background:['Achtergrond','Background'],animate_icons:['Weericonen animeren','Animate weather icons'],compact:['Compacte weergave','Compact layout'],tabs:['Zichtbare tabbladen','Visible tabs'],forecast_type:['Standaardtabblad','Default tab'],forecast_count:['Aantal voorspellingen','Forecast count']};
weatherEditorLabels.metric_status_icon=['Icoon (optioneel)','Icon (optional)'];
weatherEditorLabels.icon_scale=['Grootte weericoon','Weather icon size'];
weatherEditorLabels.icon_offset_x=['Horizontale positie weericoon','Weather icon horizontal position'];
weatherEditorLabels.icon_offset_y=['Verticale positie weericoon','Weather icon vertical position'];
weatherEditorLabels.icon_style=['Icoonstijl','Icon style'];
weatherEditorLabels.forecast_fields=['Velden in weersverwachting','Forecast fields'];
weatherEditorLabels.animate_background=['Achtergrond animeren','Animate background'];
for(const type of ['hourly','daily']){
 weatherEditorLabels['forecast_'+type+'_fields']=['Zichtbare velden','Visible fields'];
 for(const [field,labels] of Object.entries(WEATHER_FORECAST_FIELDS))if(field!=='condition')weatherEditorLabels['forecast_'+type+'_'+field+'_decimals']=[labels[0]+' · decimalen',labels[1]+' · decimals'];
}
for(const field of ['metric_status','metric_primary','metric_secondary'])for(const [suffix,labels] of Object.entries({
 icon:['Icoon (optioneel)','Icon (optional)'],source:['Gegevensbron','Data source'],entity:['Entiteit','Entity'],label:['Label (optioneel)','Label (optional)'],attribute:['Attribuut (optioneel)','Attribute (optional)'],unit:['Eigen eenheid (optioneel)','Custom unit (optional)'],show_unit:['Eenheid tonen','Show unit'],decimals:['Decimalen (optioneel)','Decimal places (optional)'],
}))weatherEditorLabels[suffix==='source'?field:field+'_'+suffix]=labels;

export class WeatherEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(config){this._config=normalizeWeatherConfig(config);this._render();}
 set hass(hass){this._hass=hass;this._render();}get hass(){return this._hass;}
 _schema(nl){
  const config=this._config,text=name=>({name,selector:{text:{}}}),boolean=name=>({name,selector:{boolean:{}}});
  const select=(name,options,multiple=false)=>({name,selector:{select:{mode:multiple?'list':'dropdown',multiple,options}}});
  const number=(name,min,max)=>({name,selector:{number:{min,max,step:1,mode:'box'}}});
  const slider=(name,min,max,step,unit)=>({name,selector:{number:{min,max,step,mode:'slider',unit_of_measurement:unit}}});
  const group=(name,title,schema,expanded=false)=>({type:'expandable',name,title,flatten:true,expanded,schema});
  const metrics=[{value:'none',label:nl?'Niet tonen':'Hide'},{value:'custom',label:nl?'Eigen entiteit':'Custom entity'},...Object.entries(WEATHER_METRICS).map(([value,labels])=>({value,label:labels[nl?0:1]}))];
  const schema=[group('general',nl?'Algemeen':'General',[text('title'),{name:'entity',required:true,selector:{entity:{domain:'weather'}}}],true),
   group('weather_icon',nl?'Weericoon':'Weather icon',[slider('icon_scale',50,300,5,'%'),slider('icon_offset_x',-150,150,1,'px'),slider('icon_offset_y',-150,150,1,'px')]),
   group('appearance',nl?'Weergave':'Appearance',[boolean('compact'),select('background',headerBackgroundOptions(nl)),{name:'background_strength',selector:{number:{min:0,max:100,step:5,mode:'slider',unit_of_measurement:'%'}}},select('icon_style',[{value:'classic',label:nl?'Klassiek':'Classic'},{value:'glass',label:'Liquid glass'},{value:'neon',label:'Neon'}]),boolean('animate_background'),boolean('animate_icons')])];
  for(const [field,title] of [['metric_status',nl?'Breed gegevensveld':'Wide data field'],['metric_primary',nl?'Gegevensveld links':'Left data field'],['metric_secondary',nl?'Gegevensveld rechts':'Right data field']]){
   const fields=[select(field,field==='metric_status'?[...metrics.slice(0,2),{value:'condition',label:nl?'Weerstatus':'Weather conditions'},...metrics.slice(2)]:metrics)];
   if(config[field]!=='none')fields.push(...(config[field]==='custom'?[{name:field+'_entity',selector:{entity:{}}},text(field+'_attribute')]:[]),text(field+'_label'),boolean(field+'_show_unit'),...(config[field+'_show_unit']?[text(field+'_unit')]:[]),number(field+'_decimals',0,6));
   if(config[field]!=='none')fields.push({name:field+'_icon',selector:{icon:{}}});
   schema.push(group(field+'_settings',title,fields));
  }
  const choices=[{value:'hourly',label:nl?'Per uur':'Hourly'},{value:'daily',label:nl?'Per dag':'Daily'}],visible=weatherVisibleTabs(config);
  schema.push(group('tab_settings',nl?'Weersverwachting':'Forecast',[select('tabs',choices,true),...(visible.length?[...(visible.length>1?[select('forecast_type',[{value:'auto',label:nl?'Automatisch':'Automatic'},...choices.filter(choice=>visible.includes(choice.value))])]:[]),number('forecast_count',3,8)]:[])],true));
  for(const type of visible){
   const fields=weatherForecastFields(config,type),options=Object.entries(WEATHER_FORECAST_FIELDS).filter(([field])=>type==='daily'||field!=='templow').map(([value,labels])=>({value,label:labels[nl?0:1]}));
   schema.push(group('forecast_'+type+'_settings',type==='hourly'?(nl?'Verwachting per uur':'Hourly forecast'):(nl?'Verwachting per dag':'Daily forecast'),[
    select('forecast_'+type+'_fields',options,true),...fields.filter(field=>field!=='condition'&&(type==='daily'||field!=='templow')).map(field=>number('forecast_'+type+'_'+field+'_decimals',0,3)),
   ]));
  }
  return schema;
 }
 _helper(item,nl){
  const name=item.name,helpers={
   title:nl?'Naam voor toegankelijkheid; verschijnt niet als zichtbare titel.':'Name for accessibility; not shown as a visible title.',
   entity:nl?'Kies je Home Assistant-weerentiteit voor temperatuur, weerstatus en verwachting.':'Choose your Home Assistant weather entity for temperature, conditions and forecasts.',
   icon_scale:nl?'Vergroot het grote weericoon binnen de vaste headerhoogte. De andere iconen blijven even groot.':'Scale the large weather icon within the fixed header height. Other icons keep their size.',
   icon_offset_x:nl?'Negatief = naar links, positief = naar rechts. Nul plaatst het icoon horizontaal in het midden van de kaart.':'Negative moves left, positive moves right. Zero centers the icon horizontally in the card.',
   icon_offset_y:nl?'Negatief = omhoog, positief = omlaag. De headerhoogte blijft gelijk.':'Negative moves up, positive moves down. Header height stays fixed.',
   compact:nl?'Kleinere afbeeldingruimte en gegevensvlakken. Je tabkeuze blijft behouden.':'Smaller illustration area and data panels. Your tab selection is preserved.',
   background:nl?'Kies een van de vijf vertrouwde achtergronden of Aurora sky, Cloud layers en Atmospheric flow met extra animatie. Kleuren volgen de weerstatus.':'Choose one of the five familiar backgrounds or Aurora sky, Cloud layers and Atmospheric flow with extra animation. Colors follow weather conditions.',
   animate_icons:nl?'Animatie stopt ook bij geen verbinding, ontbrekende gegevens of de voorkeur voor minder beweging.':'Animation also stops when offline, data is missing or reduced motion is preferred.',
   animate_background:nl?'Onafhankelijk van de weericonen. Animatie pauzeert buiten beeld en bij een verborgen browsertabblad.':'Independent of weather icons. Animation pauses outside the viewport and in hidden browser tabs.',
   icon_style:nl?'Dezelfde stijl voor de header, het statusveld en de verwachting. Liquid glass en Neon hebben iconen voor alle 15 weerstatussen, plus ontbrekende gegevens.':'The same style for the header, status field and forecast. Liquid glass and Neon cover all 15 weather conditions, plus missing data.',
   tabs:nl?'Kies welke tabbladen zichtbaar zijn, ook in compact. Leeg = geen verwachting. Je weerentiteit moet de gekozen verwachting ondersteunen.':'Choose visible tabs, including in compact. Empty means no forecast. Your weather entity must support the selected forecast.',
   forecast_type:nl?'Dit tabblad opent bij het laden van de kaart. Automatisch kiest een ondersteunde verwachting uit de zichtbare tabs.':'Opens when the card loads. Automatic chooses a supported forecast from the visible tabs.',
   forecast_count:nl?'Aantal uren of dagen, van 3 tot 8. Op een smalle kaart kun je horizontaal scrollen.':'Number of hours or days, from 3 to 8. Narrow cards can scroll horizontally.',
   forecast_fields:nl?'Kies de gegevens per uur en dag. Tijd of dag blijft zichtbaar. Minimumtemperatuur geldt alleen per dag. Ontbrekende gegevens tonen een streepje; een leeg veld zorgt niet voor een lege rij.':'Choose hourly and daily data. Time or day remains visible. Low temperature applies to daily forecasts only. Missing values show a dash; hidden fields leave no empty row.',
  };
  if(helpers[name])return helpers[name];
  if(/^forecast_(hourly|daily)_fields$/.test(name))return nl?'Kies de velden voor deze verwachting. Wijzig de volgorde onderaan. Leeg toont alleen tijd of dag. Niet aangeleverde waarden tonen een streepje.':'Choose fields for this forecast. Change their order below. Empty shows time or day only. Unsupported values show a dash.';
  if(/^forecast_.*_decimals$/.test(name))return nl?'Leeg = automatisch. Kies 0 tot 3 decimalen voor dit veld.':'Empty uses automatic precision. Choose 0 to 3 decimal places for this field.';
  if(name.endsWith('_label'))return nl?'Leeg = de naam van de weerwaarde of entiteit.':'Empty uses the weather metric or entity name.';
  if(name.endsWith('_attribute'))return nl?'Leeg = de entiteitwaarde. Vul anders de exacte attribuutnaam in.':'Empty uses the entity state. Otherwise enter the exact attribute name.';
  if(name.endsWith('_unit'))return nl?'Leeg = de broneenheid. Bij een attribuut wordt geen eenheid aangenomen.':'Empty uses the source unit. Attribute values have no assumed unit.';
  if(name.endsWith('_decimals'))return nl?'Leeg = automatisch. Alleen voor numerieke waarden.':'Empty uses automatic formatting. Numeric values only.';
 }
 _render(){
  if(!this._config||!this._hass)return;
  if(!this._form){
   this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;line-height:1.5;color:var(--secondary-text-color);margin:0 0 12px}details{margin-top:12px;border:1px solid var(--divider-color);border-radius:10px;padding:12px}summary{cursor:pointer;font-weight:500}.order-row{display:flex;align-items:center;gap:6px;margin-top:8px}.order-row span{flex:1;min-width:0;overflow-wrap:anywhere}button{min-width:36px;min-height:36px;border:0;border-radius:6px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.35;cursor:default}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><p></p><ha-form></ha-form><div class="forecast-order"></div>';
   this._form=this.shadowRoot.querySelector('ha-form');
   this._form.addEventListener('value-changed',event=>{
    event.stopPropagation();const next={...this._config};
    for(const key of Object.keys(weatherEditorLabels))if(Object.hasOwn(event.detail.value,key))next[key]=event.detail.value[key];
    this._config=normalizeWeatherConfig(next);this._render();
    this._emit();
   });
  }
  const nl=weatherDutch(this._hass),schema=this._schema(nl),key=JSON.stringify([nl,schema]);
  this.shadowRoot.querySelector('p').textContent=nl?'Stel je weerbron, weergave en gegevensvelden in. Kies zelf welke verwachtingstabbladen zichtbaar zijn.':'Configure your weather source, appearance and data fields. Choose which forecast tabs are visible.';
  this._form.hass=this._hass;
  if(this._schemaKey!==key){this._schemaKey=key;this._form.schema=schema;this._form.computeLabel=item=>weatherEditorLabels[item.name]?.[nl?0:1]??item.name;this._form.computeHelper=item=>this._helper(item,nl);}
  this._form.data={...this._config,tabs:weatherVisibleTabs(this._config),...Object.fromEntries(['hourly','daily'].map(type=>['forecast_'+type+'_fields',weatherForecastFields(this._config,type)]))};
  this._renderOrder(nl);
 }
 _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));}
 _renderOrder(nl){
  const root=this.shadowRoot.querySelector('.forecast-order'),types=weatherVisibleTabs(this._config),signature=JSON.stringify([nl,types,...types.map(type=>weatherForecastFields(this._config,type))]);
  if(signature===this._orderSignature)return;this._orderSignature=signature;
  const open=new Set([...root.querySelectorAll('details[open]')].map(node=>node.dataset.type));root.replaceChildren();
  for(const type of types){
   const fields=weatherForecastFields(this._config,type).filter(field=>type==='daily'||field!=='templow');if(fields.length<2)continue;
   const details=document.createElement('details');details.dataset.type=type;details.open=open.has(type);
   const summary=document.createElement('summary');summary.textContent=(nl?'Volgorde · ':'Order · ')+(type==='hourly'?(nl?'Per uur':'Hourly'):(nl?'Per dag':'Daily'));details.append(summary);
   for(const [index,field] of fields.entries()){
    const row=document.createElement('div');row.className='order-row';const label=document.createElement('span');label.textContent=WEATHER_FORECAST_FIELDS[field][nl?0:1];row.append(label);
    for(const delta of [-1,1]){
     const button=document.createElement('button');button.type='button';button.textContent=delta<0?'↑':'↓';button.disabled=index+delta<0||index+delta>=fields.length;button.dataset.field=field;button.dataset.direction=String(delta);
     button.setAttribute('aria-label',label.textContent+' '+(delta<0?(nl?'omhoog':'move up'):(nl?'omlaag':'move down')));
     button.onclick=()=>{const next=[...fields];[next[index],next[index+delta]]=[next[index+delta],next[index]];this._config=normalizeWeatherConfig({...this._config,['forecast_'+type+'_fields']:next});this._render();this._emit();const selector='details[data-type="'+type+'"] button[data-field="'+field+'"]';const preferred=this.shadowRoot.querySelector(selector+'[data-direction="'+delta+'"]');(preferred&&!preferred.disabled?preferred:this.shadowRoot.querySelector(selector+':not(:disabled)'))?.focus();};row.append(button);
    }
    details.append(row);
   }
   root.append(details);
  }
 }
}
