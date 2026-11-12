import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
import {uiButtonStyles} from '../../../shared/ui-button.js';
import {normalizeMediaConfig,mediaDutch,MEDIA_LAYOUTS} from './media-utils.js';
export class MediaPlayerEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});}
 setConfig(input){this._config=normalizeMediaConfig(input);this._render();}
 set hass(value){this._hass=value;this._render();}get hass(){return this._hass;}
 _render(){
  if(!this._config||!this._hass)return;
  const nl=mediaDutch(this._hass),t=(a,b)=>nl?a:b;
  if(!this._form){this.shadowRoot.innerHTML='<style>:host,ha-form{display:block;min-width:0}p{font-size:12px;color:var(--secondary-text-color);line-height:1.5}</style><p></p><ha-form></ha-form>';this._form=this.shadowRoot.querySelector('ha-form');this._form.addEventListener('value-changed',event=>{event.stopPropagation();this._config=normalizeMediaConfig({...this._config,...event.detail.value});this._render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));});}
  this.shadowRoot.querySelector('p').textContent=t('Kies een mediaspeler. Alleen ondersteunde bediening wordt getoond.','Choose a media player. Only supported controls are shown.');
  const labels={entity:t('Mediaspeler','Media player'),title:t('Eigen titel','Custom title'),layout:t('Ontwerp','Layout'),background:t('Achtergrond','Background'),background_strength:t('Achtergrondsterkte','Background intensity'),animate_background:t('Achtergrond animeren','Animate background'),compact:t('Compact','Compact'),radio_mode:t('Radiomodus','Radio mode'),show_artwork:t('Albumhoes tonen','Show artwork'),show_progress:t('Voortgang tonen','Show progress'),show_volume:t('Volume tonen','Show volume'),show_source:t('Bronkeuze tonen','Show source selector'),show_power:t('Aan/uitknop tonen','Show power button')};
  const names=nl?['Klassiek','Poster','Horizontaal','Studio','Minimaal']:['Classic','Poster','Horizontal','Studio','Minimal'];
  Object.assign(this._form,{hass:this._hass,data:this._config,computeLabel:field=>labels[field.name]??field.name,schema:[{name:'general',title:t('Algemeen','General'),type:'expandable',flatten:true,expanded:true,schema:[{name:'entity',selector:{entity:{domain:'media_player'}}},{name:'title',selector:{text:{}}},{name:'layout',selector:{select:{mode:'dropdown',options:MEDIA_LAYOUTS.map((value,i)=>({value,label:names[i]}))}}}]},{name:'appearance',title:t('Weergave','Appearance'),type:'expandable',flatten:true,schema:[{name:'background',selector:{select:{mode:'dropdown',options:headerBackgroundOptions(nl)}}},{name:'background_strength',selector:{number:{min:0,max:100,step:5,mode:'slider',unit_of_measurement:'%'}}},{name:'animate_background',selector:{boolean:{}}},...['radio_mode','compact','show_artwork','show_progress','show_volume','show_source','show_power'].map(name=>({name,selector:{boolean:{}}}))]}]});
  this._renderStations(nl);
 }
 _saveStations(stations){this._config=normalizeMediaConfig({...this._config,stations});this._render();this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(this._config)},bubbles:true,composed:true}));}
 _renderStations(nl){
  const t=(a,b)=>nl?a:b;
  if(!this._stations){
   const style=document.createElement('style');style.textContent=uiButtonStyles()+'.stations{margin-top:16px}.stations h3{font-size:12px;font-weight:600;margin:0 0 8px}.stations p{font-size:12px;line-height:1.4}.station-rows{display:grid;gap:8px}details{border-radius:8px;padding:12px;background:var(--secondary-background-color)}summary{cursor:pointer;font-size:12px;font-weight:600;overflow-wrap:anywhere}.station-rows ha-form{margin-top:12px}.station-actions{display:flex;gap:8px;margin-top:12px}.station-actions [data-ui-button]{padding:4px 8px}.stations>[data-ui-button]{margin-top:8px;padding:4px 8px}';this.shadowRoot.append(style);
   this._stations=document.createElement('section');this._stations.className='stations';this._stations.innerHTML='<h3></h3><p></p><div class="station-rows"></div><button type="button" data-ui-button="text" data-add-station></button>';this.shadowRoot.append(this._stations);
   this._stations.querySelector('[data-add-station]').addEventListener('click',()=>{this._saveStations([...this._config.stations,{name:'',media_content_id:'',media_content_type:'music'}]);this._stations.querySelector('.station-rows').lastElementChild.open=true;});
  }
  const section=this._stations;section.hidden=!this._config.radio_mode;section.querySelector('h3').textContent=t('Radiozenders','Radio stations');section.querySelector('p').textContent=t('Voeg favoriete zenders toe met een stream-URL of Home Assistant media-ID. Het mediatype hangt af van je integratie; muziek is de standaard.','Add favourite stations using a stream URL or Home Assistant media ID. The media type depends on your integration; music is the default.');section.querySelector('[data-add-station]').textContent=t('Zender toevoegen','Add station');
  const container=section.querySelector('.station-rows');while(container.children.length>this._config.stations.length)container.lastElementChild.remove();
  this._config.stations.forEach((station,index)=>{
   let row=container.children[index];if(!row){row=document.createElement('details');row.innerHTML='<summary></summary><ha-form></ha-form><div class="station-actions"><button type="button" data-ui-button="text" data-move="-1"></button><button type="button" data-ui-button="text" data-move="1"></button><button type="button" data-ui-button="text" data-remove></button></div>';container.append(row);
    row.querySelector('ha-form').addEventListener('value-changed',event=>{event.stopPropagation();const i=Number(row.dataset.index);this._saveStations(this._config.stations.map((value,j)=>j===i?{...value,...event.detail.value}:value));});
    row.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;const stations=this._config.stations.map(value=>({...value})),i=Number(row.dataset.index);if(button.hasAttribute('data-remove'))stations.splice(i,1);else{const next=i+Number(button.dataset.move);if(next<0||next>=stations.length)return;[stations[i],stations[next]]=[stations[next],stations[i]];}this._saveStations(stations);});
   }
   row.dataset.index=String(index);row.querySelector('summary').textContent=station.name||t('Nieuwe zender','New station');
   const labels={name:t('Zendernaam','Station name'),media_content_id:t('Stream-URL of media-ID','Stream URL or media ID'),media_content_type:t('Mediatype','Media type')};Object.assign(row.querySelector('ha-form'),{hass:this._hass,data:station,schema:Object.keys(labels).map(name=>({name,selector:{text:{}}})),computeLabel:field=>labels[field.name]});
   const up=row.querySelector('[data-move="-1"]'),down=row.querySelector('[data-move="1"]');up.textContent=t('Omhoog','Move up');up.disabled=index===0;down.textContent=t('Omlaag','Move down');down.disabled=index===this._config.stations.length-1;row.querySelector('[data-remove]').textContent=t('Verwijderen','Remove');
  });
 }
}
