import {CameraSnapshot} from './camera-snapshot.js';

// One authenticated still per camera while the viewer is open; no extra streams.
export class CameraViewerPicker{
 constructor(node){this.node=node;this.rows=new Map();}
 update(hass,cameras,options){
  this.options=options;this.node.setAttribute('aria-label',options.t('Camera kiezen','Choose camera'));this.node.hidden=cameras.length<2;
  const visible=new Set(cameras.map(row=>row.entity));
  for(const [entity,item] of this.rows)if(!visible.has(entity)){item.snapshot.stop();item.button.remove();this.rows.delete(entity);}
  cameras.forEach((row,index)=>{
   let item=this.rows.get(row.entity);
   if(!item){
    const button=document.createElement('button');button.type='button';button.dataset.uiButton='action-choice';button.dataset.cameraViewPick=row.entity;
    const image=document.createElement('span');image.className='camera-viewer-thumbnail';image.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='camera-viewer-camera-name';button.append(image,label);
    item={button,image,label,row};item.snapshot=new CameraSnapshot(image,status=>{image.dataset.state=status;if(status==='error')this.fallback(item);});
    this.rows.set(row.entity,item);
   }
   item.row=row;item.label.textContent=options.name(row.entity);item.button.setAttribute('aria-pressed',String(row.entity===options.selected));item.button.setAttribute('aria-label',options.t('Camera openen: ','Open camera: ')+options.name(row.entity));
   if(this.node.children[index]!==item.button)this.node.insertBefore(item.button,this.node.children[index]??null);
  });
  this.sync(hass,options.active);
 }
 fallback(item){
  const existing=item.image.querySelector('ha-icon'),icon=existing??document.createElement('ha-icon');icon.setAttribute('icon','mdi:cctv');if(!existing)item.image.replaceChildren(icon);
 }
 sync(hass,active){
  for(const item of this.rows.values()){
   const enabled=active&&!this.node.hidden&&!this.options.blocked(item.row)&&typeof hass?.callApiRaw==='function';
   item.snapshot.update(hass,item.row.entity,{interval:0,fit_mode:'cover',alt:'',interactive:false},enabled);
   if(!item.snapshot.picture)this.fallback(item);
  }
 }
 stop(){for(const item of this.rows.values()){item.snapshot.stop();this.fallback(item);}}
}
