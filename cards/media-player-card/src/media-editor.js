import {headerBackgroundOptions} from '../../../shared/header-backgrounds.js';
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
  const labels={entity:t('Mediaspeler','Media player'),title:t('Eigen titel','Custom title'),layout:t('Ontwerp','Layout'),background:t('Achtergrond','Background'),background_strength:t('Achtergrondsterkte','Background intensity'),animate_background:t('Achtergrond animeren','Animate background'),compact:t('Compact','Compact'),show_artwork:t('Albumhoes tonen','Show artwork'),show_progress:t('Voortgang tonen','Show progress'),show_volume:t('Volume tonen','Show volume'),show_source:t('Bronkeuze tonen','Show source selector'),show_power:t('Aan/uitknop tonen','Show power button')};
  const names=nl?['Klassiek','Poster','Horizontaal','Studio','Minimaal']:['Classic','Poster','Horizontal','Studio','Minimal'];
  Object.assign(this._form,{hass:this._hass,data:this._config,computeLabel:field=>labels[field.name]??field.name,schema:[{name:'general',title:t('Algemeen','General'),type:'expandable',flatten:true,expanded:true,schema:[{name:'entity',selector:{entity:{domain:'media_player'}}},{name:'title',selector:{text:{}}},{name:'layout',selector:{select:{mode:'dropdown',options:MEDIA_LAYOUTS.map((value,i)=>({value,label:names[i]}))}}}]},{name:'appearance',title:t('Weergave','Appearance'),type:'expandable',flatten:true,schema:[{name:'background',selector:{select:{mode:'dropdown',options:headerBackgroundOptions(nl)}}},{name:'background_strength',selector:{number:{min:0,max:100,step:5,mode:'slider',unit_of_measurement:'%'}}},{name:'animate_background',selector:{boolean:{}}},...['compact','show_artwork','show_progress','show_volume','show_source','show_power'].map(name=>({name,selector:{boolean:{}}}))]}]});
 }
}
