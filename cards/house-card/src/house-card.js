const HOUSE_PREVIEW_TONES={warm:'#d2a365',charging:'#d9ac43',waiting:'#6fa9ee',done:'#68b695',planned:'#b49ade',off:'#89919c'};
function houseStyleOptions(c={}){
 const finite=(v,d,min,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):d;
 return {...c,background:HEADER_BACKGROUNDS.some(b=>b.value===c.background)?c.background:'halo',color:Object.hasOwn(HOUSE_PREVIEW_TONES,c.color)?c.color:'warm',background_strength:finite(c.background_strength,100,0,100),image_scale:finite(c.image_scale,100,50,300),image_offset_x:finite(c.image_offset_x,0,-150,150),image_offset_y:finite(c.image_offset_y,0,-150,150),compact:c.compact!==false,animate_background:c.animate_background!==false};
}

class HouseCard extends ElevenHouseCard{
 constructor(){
  super();const style=document.createElement('style');
  style.textContent=headerBackgroundStyles+headerAtmosphereStyles+uiMetricStyles()+`
:host([data-welcome-layout=compact]) .content{--tone:#d2a365;--ui-metric-tone:var(--tone);--ui-metric-radius:8px}
:host([data-welcome-layout=compact]) .stage{isolation:isolate;overflow:hidden;background:transparent!important}
.scene-background{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;isolation:isolate;opacity:var(--header-background-opacity,1);--header-fade:linear-gradient(180deg,#000 0%,#000 25%,rgba(0,0,0,.9) 40%,rgba(0,0,0,.65) 55%,rgba(0,0,0,.32) 72%,rgba(0,0,0,.08) 88%,transparent 100%);mask-image:var(--header-fade);-webkit-mask-image:var(--header-fade)}
:host([data-welcome-layout=compact]) .stage>canvas:not(.house-weather),:host([data-welcome-layout=compact]) .stage>.floor-image{transform:translate(var(--house-image-x,0px),var(--house-image-y,0px)) scale(var(--house-image-scale,1));transform-origin:center;aspect-ratio:4/3;margin:0;width:100%;height:auto}
:host([data-welcome-layout=compact]) .summary{gap:8px;margin:0 12px 12px;border:0;align-items:stretch}
:host([data-welcome-layout=compact]) .summary-tile{background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--tone) 10%,transparent),color-mix(in srgb,var(--tone) 3%,transparent) 30%,transparent 70%),var(--secondary-background-color,#eee);border:0;border-radius:8px;padding:12px;min-height:72px;order:1;display:grid;gap:2px 8px}
:host([data-welcome-layout=compact]) .summary-tile[data-density=compact]{padding:8px;min-height:64px}
:host([data-welcome-layout=compact]) [data-summary=weather]{padding-left:12px}
:host([data-welcome-layout=compact]) [data-summary=thermostat],:host([data-welcome-layout=compact]) [data-summary=weather]{order:0}
:host([data-welcome-layout=compact]) [data-summary=presence] .ui-metric-value,:host([data-welcome-layout=compact]) [data-summary=alarm] .ui-metric-value{font-size:15px;letter-spacing:normal;font-weight:550}
:host([data-welcome-layout=compact]) [data-summary=alarm]{order:2;grid-column:1/-1;min-height:56px}
:host([data-welcome-layout=compact]) .summary-tile .hero-avatar{width:24px;height:24px}
:host([data-welcome-layout=compact]) .summary-tile .ui-metric-icon{display:grid}
:host([data-welcome-layout=compact]) .summary-tile .ui-metric-icon ha-icon{display:block}
:host([data-welcome-layout=compact]) .summary-tile:focus-visible{outline:2px solid var(--primary-color,#2196f3);outline-offset:2px}
:host([data-density=standard]) .hero-header{padding:20px 20px 0}
:host([data-density=standard]) .summary{gap:12px;margin:0 16px 16px}
:host([data-density=standard]) .stage-caption{padding:4px 16px 12px}
:host([data-density=standard]) .stage>canvas:not(.house-weather){aspect-ratio:1.2}
`;
  this.shadowRoot.append(style);this.weather=new HouseWeather(this);
  const background=document.createElement('div');background.className='scene-background';background.setAttribute('aria-hidden','true');this.shadowRoot.querySelector('.stage').prepend(background);
 }
 static getConfigForm(){const base=ElevenHouseCard.getConfigForm();base.schema.push(...houseWeatherSchema);return {...base,schema:[...base.schema,{name:'presentation',type:'expandable',title:'Vormgeving',flatten:true,schema:[{name:'background',selector:{select:{mode:'dropdown',options:headerBackgroundOptions(true)}}},{name:'color',selector:{select:{options:Object.keys(HOUSE_PREVIEW_TONES).map(value=>({value,label:({warm:'Warm',charging:'Goud',waiting:'Blauw',done:'Groen',planned:'Paars',off:'Grijs'})[value]}))}}},{name:'background_strength',selector:{number:{min:0,max:100,step:1,mode:'slider'}}},{name:'animate_background',selector:{boolean:{}}},{name:'compact',selector:{boolean:{}}},{name:'image_scale',selector:{number:{min:50,max:300,step:5,mode:'slider'}}},{name:'image_offset_x',selector:{number:{min:-150,max:150,step:1,mode:'slider'}}},{name:'image_offset_y',selector:{number:{min:-150,max:150,step:1,mode:'slider'}}}]}],computeLabel:s=>({weather_overlay:'Weerlaag tonen',animate_weather:'Weerlaag animeren',weather_intensity:'Weerintensiteit (%)',wind_threshold:'Drempel harde wind (m/s)',background:'Achtergrond',color:'Accentkleur',background_strength:'Achtergrondsterkte (%)',animate_background:'Achtergrond animeren',compact:'Compact',image_scale:'Huisgrootte (%)',image_offset_x:'Horizontale positie (px)',image_offset_y:'Verticale positie (px)'}[s.name]||base.computeLabel(s))};}
 static getConfigElement(){return document.createElement('eleven-house-styled-card-editor');}
 setConfig(c){super.setConfig({...houseStyleOptions(c),appearance:'hero',welcome_layout:'compact'});}
 connectedCallback(){super.connectedCallback();this.stopBackdrop?.();this.stopBackdrop=observeCardMotion(this);this.weather.connect();}
 disconnectedCallback(){this.weather.disconnect();this.stopBackdrop?.();this.stopBackdrop=null;super.disconnectedCallback();}
 drawHero(){
  super.drawHero();if(!this.config)return;this.weather?.update();const c=houseStyleOptions(this.config),content=this.shadowRoot.querySelector('.content');
  content.dataset.background=c.background;content.dataset.backgroundAnimated=String(c.animate_background&&this._hass?.connected!==false);content.dataset.density=c.compact?'compact':'standard';this.dataset.density=content.dataset.density;
  content.style.setProperty('--tone',HOUSE_PREVIEW_TONES[c.color]);content.style.setProperty('--header-background-opacity',String(c.background_strength/100));
  content.style.setProperty('--house-image-scale',String(c.image_scale/100));content.style.setProperty('--house-image-x',c.image_offset_x+'px');content.style.setProperty('--house-image-y',c.image_offset_y+'px');
  const bg=this.shadowRoot.querySelector('.scene-background');if(bg.dataset.background!==c.background){bg.innerHTML=headerAtmosphere(c.background);bg.dataset.background=c.background;}
 }
 statusHTML(){
  const source=document.createElement('template');source.innerHTML=super.statusHTML();
  return [...source.content.querySelectorAll('.summary-tile')].map(tile=>{
   const kind=tile.dataset.summary,id=tile.dataset.info||'',temperature=!!tile.querySelector('.temperature-main');
   const title=temperature?tile.querySelector('.temperature-label').textContent:tile.querySelector('.label')?.firstChild?.textContent?.trim()||'';
   let value=temperature?tile.querySelector('.temperature-value').textContent:tile.querySelector('small')?.textContent||'—',unit='';
   if(temperature){const split=value.match(/^(.*?)(\s*°[CF])$/);if(split){value=split[1].trim();unit=split[2].trim();}}
   const unavailable=['—','Niet beschikbaar','Temperatuur onbekend','Geen personen gekozen'].includes(value);
   return uiMetric({title,value:unavailable?null:value,unit,info:temperature?tile.querySelector('small')?.textContent||'':unavailable&&value!=='—'?value:'',icon:tile.querySelector('ha-icon')?.getAttribute('icon')||'',iconContent:kind==='presence'?this.avatarHTML(id,title):'',compact:this.config.compact!==false,action:true,attrs:{class:'summary-tile','data-summary':kind,'data-info':id,disabled:!id,'aria-label':tile.getAttribute('aria-label')}});
  }).join('');
 }
}
class HouseCardEditor extends ElevenHouseCardEditor{
 setConfig(c){super.setConfig({...houseStyleOptions(c),weather_overlay:c.weather_overlay!==false,animate_weather:c.animate_weather!==false,weather_intensity:typeof c.weather_intensity==='number'?c.weather_intensity:65,wind_threshold:typeof c.wind_threshold==='number'?c.wind_threshold:10.8});}
 render(){super.render();if(!this.config||!this.form)return;const base=HouseCard.getConfigForm();this.form.schema=[...this.form.schema.filter(s=>s.name!=='presentation'),base.schema.find(s=>s.name==='presentation'),...houseWeatherSchema];const label=this.form.computeLabel;this.form.computeLabel=s=>base.computeLabel(s)===s.name?label(s):base.computeLabel(s);}
}

class HouseCardAlias extends HouseCard {}
class HouseEditorAlias extends HouseCardEditor {}
for(const [name,Class] of [['eleven-house-styled-card',HouseCard],['eleven-house-card',HouseCardAlias],['eleven-house-styled-card-editor',HouseCardEditor],['eleven-house-card-editor',HouseEditorAlias]])if(!customElements.get(name))customElements.define(name,Class);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='eleven-house-card'))window.customCards.push({type:'eleven-house-card',name:'Eleven House (beta)',description:'Configurable house rendering with live weather',preview:true});
