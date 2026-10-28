import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
import {customTabsEditor} from '../../../shared/entity-tabs-editor.js';
import {EvccEditor} from './evcc/evcc-card.js';
import {EVCC_FIELDS,resolveEvccEntities} from './evcc/evcc-utils.js';
import {EVCC_BACKGROUNDS} from './evcc/evcc-backgrounds.js';
import {CAR_COLORS,normalizeCarConfig} from './car-utils.js';

const carEditorDutch=hass=>String(hass?.locale?.language??hass?.language??'en').startsWith('nl');
const CAR_EDITOR_LABELS={
 title:['Kaartnaam (toegankelijkheid)','Card name (accessibility)'],evcc_enabled:['EVCC-koppeling gebruiken','Use EVCC integration'],entity:['Laadvermogensensor van het laadpunt','Loadpoint charge power sensor'],
 percentage_entity:['Percentage-entiteit (optioneel)','Percentage entity (optional)'],percentage:['Vast percentage','Fixed percentage'],
 range_source:['Actieradius tonen','Show range'],range_entity:['Resterende actieradius-entiteit','Remaining range entity'],range_full:['Totaal bereik bij 100%','Total range at 100%'],range_unit:['Afstandseenheid','Distance unit'],
 image_source:['Afbeeldingsbron','Image source'],image_media:['Afbeelding uit Media','Image from Media'],image_entity:['Afbeeldingsentiteit auto (optioneel)','Vehicle image entity (optional)'],image_scale:['Grootte autoafbeelding','Vehicle image size'],image_offset_y:['Verticale positie auto','Vehicle vertical position'],
 image_offset_x:['Horizontale positie auto','Vehicle horizontal position'],battery_style:['Stijl percentagebalk','Percentage bar style'],animation_speed:['Animatiesnelheid','Animation speed'],animation_max_kw:['Maximaal laadvermogen voor animatie','Maximum charge power for animation'],
 background_strength:['Achtergrondsterkte','Background intensity'],background:['Achtergrond','Background'],color:['Accentkleur','Accent color'],animate_background:['Achtergrond animeren','Animate background'],compact:['Compacte weergave','Compact layout'],tabs:['Zichtbare tabbladen','Visible tabs'],default_tab:['Standaardtabblad','Default tab'],
};
for(let i=1;i<=3;i++)Object.assign(CAR_EDITOR_LABELS,{
 ['show_field_'+i]:['Gegevensveld tonen','Show data field'],['field_'+i+'_entity']:['Entiteit','Entity'],['field_'+i+'_label']:['Label (optioneel)','Label (optional)'],
 ['field_'+i+'_attribute']:['Attribuut (optioneel)','Attribute (optional)'],['field_'+i+'_unit']:['Eigen eenheid (optioneel)','Custom unit (optional)'],
 ['field_'+i+'_decimals']:['Decimalen (optioneel)','Decimal places (optional)'],['field_'+i+'_show_unit']:['Eenheid tonen','Show unit'],
});
for(let i=1;i<=3;i++)CAR_EDITOR_LABELS['field_'+i+'_icon']=['Icoon','Icon'];
const CAR_EDITOR_HELPERS={
 title:['Naam voor toegankelijkheid en de afbeeldingsbeschrijving; verschijnt niet als zichtbare titel.','Name for accessibility and the image description; not shown as a visible title.'],
 animate_background:['Bewegende lichtsluiers, wolken en weerlijnen. Animatie stopt bij geen verbinding en de voorkeur voor minder beweging.','Moving light ribbons, clouds and contours. Animation stops when offline or reduced motion is preferred.'],
 evcc_enabled:['Aan: laadgegevens en bediening via EVCC. Uit: een eigen percentage en drie vrije gegevensvelden. Instellingen blijven bewaard bij omschakelen.','On: EVCC charging data and controls. Off: your own percentage and three custom fields. Switching preserves both sets of settings.'],
 entity:['Kies de vermogenssensor van één laadpunt. De overige EVCC-entiteiten worden automatisch binnen dat laadpunt herkend.','Choose the power sensor of one loadpoint. Other EVCC entities are detected within that loadpoint.'],
 percentage_entity:['Gebruik een entiteit met een waarde van 0 tot 100. Laat leeg voor een vast percentage.','Use an entity with a value from 0 to 100. Leave empty for a fixed percentage.'],
 percentage:['Alleen voor de weergave; dit wijzigt geen sensor.','Display only; this does not change a sensor.'],
 range_source:['Toont de resterende actieradius onder het percentage, net als bij EVCC. Kies een sensor of een schatting op basis van het percentage.','Shows remaining range below the percentage, as with EVCC. Choose a sensor or an estimate based on the percentage.'],
 range_entity:['Gebruik een sensor met de resterende afstand. De sensoreenheid wordt overgenomen; zonder eenheid wordt km gebruikt.','Use a sensor with the remaining distance. The sensor unit is retained; km is used if no unit is provided.'],
 range_full:['Schatting = totaal bereik × huidig percentage / 100. Bijvoorbeeld: 800 km bij 100% en 50% resterend geeft circa 400 km.','Estimate = total range × current percentage / 100. For example: 800 km at 100% and 50% remaining gives approximately 400 km.'],
 image_entity:['Kies een image-entiteit met de afbeelding van je auto. Zonder afbeelding verschijnt een auto-icoon.','Choose an image entity with your vehicle picture. Without an image a car icon is shown.'],
 image_source:['Kies een afbeelding-entiteit of een afbeelding uit Home Assistant Media. Beide keuzes blijven bewaard bij omschakelen.','Choose an image entity or a picture from Home Assistant Media. Switching preserves both selections.'],
 image_media:['Kies een afbeelding in je Home Assistant-mediabibliotheek.','Choose an image in your Home Assistant media library.'],
 image_scale:['Vergroot de auto binnen de vaste headerhoogte. Een grote afbeelding kan vóór het percentage komen.','Scale the car within the fixed header height. A large image may overlap the percentage.'],
 image_offset_y:['Negatief = omhoog, positief = omlaag. De headerhoogte blijft gelijk.','Negative moves up, positive moves down. Header height stays fixed.'],
 image_offset_x:['Negatief = naar links, positief = naar rechts. Nul plaatst de afbeelding horizontaal in het midden van de kaart.','Negative moves left, positive moves right. Zero centers the image horizontally in the card.'],
 battery_style:['Kies een klassieke balk, slanke capsule, zacht licht (standaard) of fijne lijn.','Choose a classic bar, slim capsule, soft light (default) or fine line.'],
 animation_speed:['Snelheidsfactor: 0,5× is half zo snel, 2× is dubbel zo snel. Bij nul of onbekend laadvermogen pauzeert de animatie.','Speed factor: 0.5× is half speed, 2× is double speed. Zero or unknown charge power pauses animation.'],
 animation_max_kw:['Vermogen waarbij de animatie de hoogste snelheid bereikt. Dit verandert geen EVCC-laadlimiet.','Power at which animation reaches its maximum speed. This does not change EVCC charge limits.'],
 color:['Vaste accentkleur voor eigen gegevens. Met EVCC volgt de kleur de laadstatus.','Fixed accent for custom data. With EVCC the color follows charging state.'],
 compact:['Kleinere afbeeldingruimte en gegevensvlakken. Je tabkeuze blijft behouden.','Smaller image area and data panels. Your tab selection is preserved.'],
 tabs:['Kies welke tabbladen zichtbaar zijn, ook in compact. Leeg = geen tabbladen. Een tab zonder beschikbare entiteiten wordt niet getoond.','Choose visible tabs, including in compact. Empty means no tabs. Tabs without source entities are omitted.'],
 default_tab:['Dit tabblad opent bij het laden van de kaart. Een handmatige tabkeuze blijft behouden bij sensorupdates.','Opens when the card loads. Manual tab selection is preserved during sensor updates.'],
};
export class CarEditor extends customTabsEditor(EvccEditor) {
 setConfig(config){this._config=normalizeCarConfig(config);if(this._hass&&this._config.evcc_enabled)this.hass=this._hass;else this._render();}
 set hass(hass){if(this._config?.evcc_enabled)super.hass=hass;else{this._hass=hass;this._render();}}get hass(){return this._hass;}
 _schema(nl){
  const text=name=>({name,selector:{text:{}}}),boolean=name=>({name,selector:{boolean:{}}});
  const entity=(name,domain)=>({name,selector:{entity:domain?{domain}:{}}});
  const group=(name,title,schema,expanded=false)=>({type:'expandable',name,title,flatten:true,expanded,schema});
  const select=(name,options,multiple=false)=>({name,selector:{select:{mode:multiple?'list':'dropdown',multiple,options}}});
  const number=(name,min,max,step,unit,mode='slider')=>({name,selector:{number:{min,max,step,mode,...(unit?{unit_of_measurement:unit}:{})}}});
  const config=this._config,evcc=config.evcc_enabled;
  const schema=[group('general',nl?'Algemeen':'General',[text('title'),boolean('evcc_enabled')],true),
   group('vehicle_image',nl?'Autoafbeelding':'Vehicle image',[select('image_source',[{value:'entity',label:nl?'Afbeelding-entiteit':'Image entity'},{value:'media',label:'Media'}]),...(config.image_source==='media'?[{name:'image_media',selector:{media:{accept:['image/*']}}}]:[entity('image_entity','image')]),number('image_scale',50,300,5,'%'),number('image_offset_x',-150,150,1,'px'),number('image_offset_y',-150,150,1,'px')]),
   group('appearance',nl?'Weergave':'Appearance',[boolean('compact'),select('background',headerBackgroundOptions(nl)),number('background_strength',0,100,5,'%'),boolean('animate_background'),select('battery_style',[{value:'classic',label:nl?'Klassiek · 12 px':'Classic · 12 px'},{value:'slim',label:nl?'Slanke capsule · 8 px':'Slim capsule · 8 px'},{value:'soft',label:nl?'Zacht licht · 8 px (standaard)':'Soft light · 8 px (default)'},{value:'line',label:nl?'Fijne lijn · 4 px':'Fine line · 4 px'}]),...(!evcc?[select('color',CAR_COLORS.map(item=>({...item,label:item.label.split(' / ')[nl?0:1]})))]:[]),...(evcc?[number('animation_speed',0.25,3,0.25,'×'),number('animation_max_kw',0.1,500,0.1,'kW','box')]:[])])];
  if(!evcc){
   schema.push(group('percentage_settings',nl?'Percentage':'Percentage',[entity('percentage_entity'),...(!config.percentage_entity?[number('percentage',0,100,1,'%')]:[])],true));
   schema.push(group('range_settings',nl?'Actieradius':'Range',[
    select('range_source',[{value:'none',label:nl?'Niet tonen':'Hide'},{value:'entity',label:nl?'Van een entiteit':'From an entity'},{value:'calculated',label:nl?'Berekenen uit percentage':'Calculate from percentage'}]),
    ...(config.range_source==='entity'?[entity('range_entity','sensor')]:[]),
    ...(config.range_source==='calculated'?[select('range_unit',[{value:'km',label:'km'},{value:'mi',label:'mi'}]),number('range_full',1,100000,1,config.range_unit,'box')]:[]),
   ]));
   for(let i=1;i<=3;i++){
    const fields=[boolean('show_field_'+i)];
    if(config['show_field_'+i])fields.push(entity('field_'+i+'_entity'),text('field_'+i+'_label'),{name:'field_'+i+'_icon',selector:{icon:{}}},text('field_'+i+'_attribute'),boolean('field_'+i+'_show_unit'),...(config['field_'+i+'_show_unit']?[text('field_'+i+'_unit')]:[]),number('field_'+i+'_decimals',0,6,1,null,'box'));
    schema.push(group('field_'+i,nl?['Breed gegevensveld','Gegevensveld links','Gegevensveld rechts'][i-1]:['Wide data field','Left data field','Right data field'][i-1],fields));
   }
  }else{
   schema.push(group('evcc_connection',nl?'EVCC-koppeling':'EVCC integration',[{...entity('entity','sensor'),selector:{entity:{domain:'sensor',device_class:'power'}}}],true));
   const tabs=[{value:'controls',label:nl?'Bediening':'Controls'},{value:'session',label:nl?'Laadsessie':'Session'},{value:'technical',label:'EVCC'}];
   const defaults=[...tabs.filter(tab=>config.tabs.includes(tab.value)),...config.custom_tabs.filter(tab=>tab.show).map((tab,i)=>({value:tab.id,label:tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(i+1)}))];
   schema.push(group('tab_settings',nl?'Tabbladen':'Tabs',[select('tabs',tabs,true),...(defaults.length?[select('default_tab',defaults)]:[])],true));
   const override=(name,title,fields)=>group(name,title,fields.map(field=>entity(field,EVCC_FIELDS[field][2])));
   schema.push(group('overrides',nl?'EVCC-entiteiten aanpassen (optioneel)':'Override EVCC entities (optional)',[
    override('evcc_vehicle',nl?'Auto en laadstatus':'Vehicle and charging state',['vehicle','soc','target_soc','range','connected','charging','enabled','plan_active']),
    override('evcc_live',nl?'Actuele laadgegevens':'Live charging data',['power','remaining_duration','current','phases']),
    override('evcc_controls',nl?'Bediening':'Controls',['mode','solar_share']),
    override('evcc_session',nl?'Laadsessie':'Session',['charged_energy','session_price','charge_duration','session_price_per_kwh','solar_percentage']),
    override('evcc_details','EVCC',['vehicle_limit_soc','smart_cost_active','pv_action','pv_remaining']),
   ]));
  }
  if(!evcc&&config.custom_tabs.some(tab=>tab.show))schema.push(group('tab_settings',nl?'Tabbladen':'Tabs',[select('default_tab',config.custom_tabs.filter(tab=>tab.show).map((tab,i)=>({value:tab.id,label:tab.title||(nl?'Eigen tabblad ':'Custom tab ')+(i+1)})))],true));
  return schema;
 }
 _helper(item,nl,resolved){
  const name=item.name;if(CAR_EDITOR_HELPERS[name])return CAR_EDITOR_HELPERS[name][nl?0:1];
  if(Object.hasOwn(EVCC_FIELDS,name)){
   const auto=resolved[name];return (nl?'Leeg = automatische herkenning.':'Empty uses automatic detection.')+(auto?' '+(nl?'Herkend: ':'Detected: ')+auto:'');
  }
  if(/^field_\d_label$/.test(name))return nl?'Leeg = de naam van de entiteit.':'Empty uses the entity name.';
  if(/^field_\d_attribute$/.test(name))return nl?'Leeg = de entiteitwaarde. Vul anders de exacte attribuutnaam in.':'Empty uses the entity state. Otherwise enter the exact attribute name.';
  if(/^field_\d_unit$/.test(name))return nl?'Leeg = de sensoreenheid. Bij een attribuut wordt geen eenheid aangenomen.':'Empty uses the sensor unit. Attribute values have no assumed unit.';
  if(/^field_\d_decimals$/.test(name))return nl?'Leeg = automatisch, maximaal 2 decimalen. Alleen voor numerieke waarden.':'Empty uses automatic formatting, up to 2 decimals. Numeric values only.';
 }
 _changed(event){
  event.stopPropagation();const next={...this._config,entities:{...this._config.entities}};
  for(const [key,value] of Object.entries(event.detail.value)){
   if(Object.hasOwn(EVCC_FIELDS,key)){if(value)next.entities[key]=value;else delete next.entities[key];}
   else if(Object.hasOwn(CAR_EDITOR_LABELS,key))next[key]=value;
  }
  this._config=normalizeCarConfig(next);if(this._config.evcc_enabled)this.hass=this._hass;else this._render();
  this._emitConfig();
 }
 _emitConfig(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,entities:{...this._config.entities},custom_tabs:this._config.custom_tabs.map(tab=>({...tab,entities:tab.entities.map(row=>({...row}))}))}},bubbles:true,composed:true}));}
 _setCustomTabs(tabs){this._config=normalizeCarConfig({...this._config,custom_tabs:tabs});this._render();this._emitConfig();}

 _render(){
  if(!this._config||!this._hass)return;
  if(!this._form){
   this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;line-height:1.5;color:var(--secondary-text-color);margin:0 0 12px}h3{font-size:16px;margin:24px 0 12px}details{border:1px solid var(--divider-color);border-radius:12px;margin:12px 0;min-width:0}summary{padding:12px;min-height:44px;box-sizing:border-box;cursor:pointer;overflow-wrap:anywhere}.tab-body{padding:0 12px 12px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{font:inherit;min-height:44px;border:1px solid var(--divider-color);border-radius:6px;padding:8px 12px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer}button:disabled{opacity:.4}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}</style><p></p><ha-form></ha-form><h3></h3><p class="tabs-help"></p><div class="custom-tabs"></div><button type="button" data-action="tab-add"></button>';
   this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>this._changed(event));
   this.shadowRoot.querySelector('[data-action=tab-add]').onclick=()=>this._customAction('tab-add');
  }
  const nl=carEditorDutch(this._hass),automatic=resolveEvccEntities({...this._config,entities:{}},this._hass,this._registry);
  this.shadowRoot.querySelector('p').textContent=nl?'Stel je auto, afbeelding en weergave in. Kies EVCC voor laadgegevens of gebruik je eigen sensoren.':'Configure your car, image and appearance. Choose EVCC for charging data or use your own sensors.';
  Object.assign(this._form,{hass:this._hass,data:{...this._config,...this._config.entities},schema:this._schema(nl),computeLabel:item=>(CAR_EDITOR_LABELS[item.name]??EVCC_FIELDS[item.name])?.[nl?0:1]??item.name,computeHelper:item=>this._helper(item,nl,automatic)});
  this._renderCustomTabs(nl);
 }
}
