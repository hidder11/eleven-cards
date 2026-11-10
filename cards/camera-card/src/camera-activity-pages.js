import {cameraActivityGroupKey} from './camera-features.js';

// Browsing older pages freezes the rows, not collection of incoming events.
export class CameraActivityPages{
 reset(){this.index=0;this.snapshot=null;}
 constructor(){this.reset();}
 view(events,size,{since=0}={}){
  if(this.size!==size){this.reset();this.size=size;}
  const keys=new Set(events.map(cameraActivityGroupKey));
  if(this.snapshot)this.snapshot=this.snapshot.filter(event=>event.time>=since&&keys.has(cameraActivityGroupKey(event)));
  let rows=this.snapshot??events,pages=Math.max(1,Math.ceil(rows.length/size));
  this.index=Math.min(this.index,pages-1);
  if(this.index===0&&this.snapshot){this.reset();rows=events;pages=Math.max(1,Math.ceil(rows.length/size));}
  const baseline=new Map((this.snapshot??[]).map(event=>[cameraActivityGroupKey(event),event]));
  const hasNew=!!this.snapshot&&events.some(event=>{
   const old=baseline.get(cameraActivityGroupKey(event));
   return !old||event.time>old.time||event.count>old.count;
  });
  return {events:rows.slice(this.index*size,(this.index+1)*size),page:this.index+1,pages,hasNew};
 }
 move(step,events,size,options){
  const current=this.view(events,size,options),index=Math.max(0,Math.min(current.pages-1,this.index+step));
  if(index===0)this.reset();
  else{this.snapshot??=events.map(event=>({...event}));this.index=index;}
  return this.view(events,size,options);
 }
}
