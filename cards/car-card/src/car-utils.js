import {normalizeEvccConfig} from './evcc/evcc-utils.js';
export const CAR_COLORS = [
 {value:'charging',label:'Goud / Gold'}, {value:'waiting',label:'Blauw / Blue'},
 {value:'done',label:'Groen / Green'}, {value:'planned',label:'Paars / Purple'}, {value:'off',label:'Grijs / Gray'},
];
const carText = value => typeof value === 'string' ? value.trim() : '';
const carClamp = (value, fallback, min, max) => value !== '' && value != null && Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Number(value))) : fallback;
export function normalizeCarTabs(input){
 const used=new Set();return (Array.isArray(input)?input:[]).filter(tab=>tab&&typeof tab==='object').map((tab,index)=>{
  let id=/^custom-[a-z0-9_-]+$/.test(tab.id)?tab.id:'custom-'+(index+1);let n=1;while(used.has(id))id='custom-'+(index+1)+'-'+n++;used.add(id);
  return {id,title:typeof tab.title==='string'?tab.title:'',show:tab.show!==false,entities:(Array.isArray(tab.entities)?tab.entities:[]).map(row=>{
   row=typeof row==='string'?{entity:row}:row??{};
   return {entity:carText(row.entity),name:typeof row.name==='string'?row.name:'',attribute:carText(row.attribute),unit:carText(row.unit),show_unit:row.show_unit!==false,decimals:row.decimals==null||row.decimals===''?null:Math.round(carClamp(row.decimals,2,0,6))};
  })};
 });
}
export function normalizeCarConfig(config={}) {
 const evcc=config.evcc_enabled===true;
 const tabs=Array.isArray(config.tabs)?['controls','session','technical'].filter(tab=>config.tabs.includes(tab)):['controls','session','technical'].filter((tab,i)=>config[['show_controls','show_session','show_details'][i]]!==false);
 const normalized=evcc?normalizeEvccConfig(config):config;
 const custom_tabs=normalizeCarTabs(config.custom_tabs),availableTabs=[...(evcc?tabs:[]),...custom_tabs.filter(tab=>tab.show).map(tab=>tab.id)];
 const fields={};for(let i=1;i<=3;i++)Object.assign(fields,{
  ['show_field_'+i]:config['show_field_'+i]!==false,['field_'+i+'_attribute']:carText(config['field_'+i+'_attribute']),
  ['field_'+i+'_icon']:carText(config['field_'+i+'_icon']),['field_'+i+'_unit']:carText(config['field_'+i+'_unit']),['field_'+i+'_show_unit']:config['field_'+i+'_show_unit']!==false,
  ['field_'+i+'_decimals']:config['field_'+i+'_decimals']==null||config['field_'+i+'_decimals']===''?null:Math.round(carClamp(config['field_'+i+'_decimals'],2,0,6)),
 });
 return {...normalized,...fields,type:config.type||'custom:eleven-car-card',evcc_enabled:evcc,tabs,custom_tabs,default_tab:availableTabs.includes(config.default_tab)?config.default_tab:(availableTabs[0]??'controls'),show_controls:tabs.includes('controls'),show_session:tabs.includes('session'),show_details:tabs.includes('technical'),title:carText(config.title),percentage_entity:carText(config.percentage_entity),
  percentage:carClamp(config.percentage,0,0,100),image_entity:carText(config.image_entity),
  range_source:['none','entity','calculated'].includes(config.range_source)?config.range_source:(config.range_entity?'entity':config.range_full>0?'calculated':'none'),
  range_entity:carText(config.range_entity),range_full:carClamp(config.range_full,null,0,100000),range_unit:config.range_unit==='mi'?'mi':'km',
  image_scale:carClamp(config.image_scale,100,50,300),image_offset_y:carClamp(config.image_offset_y,0,-150,150),
  image_offset_x:carClamp(config.image_offset_x,0,-150,150),animation_speed:carClamp(config.animation_speed,1,0.25,3),animation_max_kw:carClamp(config.animation_max_kw,11,0.1,500),
  battery_style:['classic','slim','soft','line'].includes(config.battery_style)?config.battery_style:'soft',
  animate_background:config.animate_background!==false,background_strength:carClamp(config.background_strength,100,0,100),
  background:['lanes','halo','ribbon','prism-glass','eclipse','aurora','clouds','isobars'].includes(config.background)?config.background:'lanes',
  color:CAR_COLORS.some(item=>item.value===config.color)?config.color:'charging',compact:(config.compact??(config.density==='compact'))===true,
  field_1_entity:carText(config.field_1_entity),field_1_label:carText(config.field_1_label),field_1_icon:carText(config.field_1_icon)||'mdi:car',
  field_2_entity:carText(config.field_2_entity),field_2_label:carText(config.field_2_label),
  field_3_entity:carText(config.field_3_entity),field_3_label:carText(config.field_3_label)};
}
export function carAvailable(entity){return entity?.state!=null&&!['','unknown','unavailable'].includes(String(entity.state).trim());}
export function carPercentage(config,states={}) {
 const entity=states[config.percentage_entity];
 if(config.percentage_entity&&(!carAvailable(entity)||!Number.isFinite(Number(entity.state))))return null;
 return Math.max(0,Math.min(100,config.percentage_entity?Number(entity.state):config.percentage));
}
export function carRange(config,states={}){
 if(config.range_source==='none')return null;
 if(config.range_source==='calculated'){
  const percent=carPercentage(config,states),full=config.range_full;
  return {value:percent==null||full==null||full<=0?null:full*percent/100,unit:config.range_unit,estimated:true,entity:null};
 }
 const entity=states[config.range_entity],raw=entity?.state;
 return {value:carAvailable(entity)&&Number.isFinite(Number(raw))&&Number(raw)>=0?Number(raw):null,
  unit:entity?.attributes?.unit_of_measurement||'km',estimated:false,entity:config.range_entity};
}
export function carReading(entity,hass,decimals=null) {
 if(!carAvailable(entity))return '\u2014';
 const raw=String(entity.state), unit=entity.attributes?.unit_of_measurement;
 if(!Number.isFinite(Number(raw)))return typeof hass?.formatEntityState==='function'?hass.formatEntityState(entity):raw;
 const locale=hass?.locale?.language??hass?.language??'en';
 let value;try{value=new Intl.NumberFormat(locale,{maximumFractionDigits:decimals??2,...(decimals!=null?{minimumFractionDigits:decimals}:{})}).format(Number(raw));}catch{value=String(Number(raw));}
 return value+(unit?' '+unit:'');
}
export function carFieldReading(entity,hass,config,index){
 const attribute=config['field_'+index+'_attribute'];
 if(!carAvailable(entity))return '\u2014';
 const state=attribute?entity.attributes?.[attribute]:entity.state;
 if(state==null||typeof state==='object')return '\u2014';
 const unit=config['field_'+index+'_show_unit']===false?'':config['field_'+index+'_unit']||(attribute?'':entity.attributes?.unit_of_measurement);
 return carReading({...entity,state:String(state),attributes:{...entity.attributes,unit_of_measurement:unit}},attribute?{...hass,formatEntityState:undefined}:hass,config['field_'+index+'_decimals']);
}
export function carImageUrl(entity,hass) {
 if(!carAvailable(entity))return null;
 const picture=entity.attributes?.entity_picture;
 if(typeof picture!=='string'||!picture.trim())return null;
 if(picture.startsWith('/')&&!picture.startsWith('//'))return hass?.hassUrl?hass.hassUrl(picture):picture;
 try{const url=new URL(picture);return ['http:','https:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
