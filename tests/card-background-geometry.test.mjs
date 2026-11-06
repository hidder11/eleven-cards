import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.HTMLElement??=class{};
const {withCardBackground,cardBackgroundSettings,cardBackgroundCutoutRects}=await import('../shared/card-background.js');

const rect=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
function fixture(t,rectangles,{box=rect(0,0,100,100),width=100,height=100}={}){
 const properties=new Map(),listeners=new Map(),frames=new Map(),observers=[];
 let nextFrame=0,measurements=0;
 const root={
  querySelector:selector=>selector==='ha-card'?host:{},
  addEventListener(type,listener,options){assert.equal(type,'scroll');listeners.set(listener,options);},
  removeEventListener(type,listener,options){assert.equal(type,'scroll');assert.equal(options===true||options?.capture,true);listeners.delete(listener);},
 };
 const plots=rectangles.map(bounds=>({contains:()=>false,getBoundingClientRect:()=>bounds}));
 const host={
  style:{getPropertyValue:key=>properties.get(key)??'',setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key)},
  querySelectorAll:()=>plots,querySelector:()=>null,setAttribute(){},removeAttribute(){},
 };
 const layer={parentElement:host,parentNode:host,getBoundingClientRect(){measurements++;return box;},remove(){this.parentElement=null;this.parentNode=null;}};
 for(const [name,value] of Object.entries({
  getComputedStyle:()=>({width:String(width),height:String(height),getPropertyValue:()=>''}),
  requestAnimationFrame:callback=>{const id=++nextFrame;frames.set(id,callback);return id;},
  cancelAnimationFrame:id=>frames.delete(id),
  ResizeObserver:class{constructor(callback){this.callback=callback;this.nodes=[];observers.push(this);}observe(node){this.nodes.push(node);}disconnect(){this.disconnected=true;}},
 })){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
  t.after(()=>descriptor?Object.defineProperty(globalThis,name,descriptor):delete globalThis[name]);
 }
 const card=new (withCardBackground(class{}))();
 Object.assign(card,{isConnected:true,shadowRoot:root,_elevenBackgroundLayer:layer});
 return {card,host,layer,plots,listeners,frames,observers,properties,get measurements(){return measurements;},
  scroll(){for(const listener of listeners.keys())listener({target:{className:'content'}});},
  flush(){const callbacks=[...frames.values()];frames.clear();for(const callback of callbacks)callback();},
  clip:()=>properties.get('--ui-background-graph-clip')??'',
 };
}
// The outer path winds clockwise (+1); each hole subtracts one. Any nonzero
// winding paints decoration, so overlapping holes must never subtract twice.
function clipWinding(clip,x,y){
 const paths=[...clip.matchAll(/M([\d.-]+) ([\d.-]+)(H([\d.-]+)V([\d.-]+)H([\d.-]+)|V([\d.-]+)H([\d.-]+)V([\d.-]+))Z/g)];
 assert.ok(paths.length,'expected rectangular clip subpaths');
 let winding=0;
 for(const match of paths){
  const left=Number(match[1]),top=Number(match[2]),outer=match[4]!==undefined;
  const right=Number(outer?match[4]:match[8]),bottom=Number(outer?match[5]:match[7]);
  if(x>left&&x<right&&y>top&&y<bottom)winding+=outer?1:-1;
 }
 return winding;
}

test('overlapping sibling plots exclude decoration exactly once throughout their union',t=>{
 const f=fixture(t,[rect(10,10,60,60),rect(40,40,90,90),rect(45,45,55,55)]);
 f.card._syncElevenBackgroundClip();
 for(const [x,y] of [[20,20],[50,50],[80,80],[42,58]])assert.equal(clipWinding(f.clip(),x,y),0,`plot at ${x},${y}`);
 for(const [x,y] of [[5,5],[80,20],[20,80]])assert.equal(clipWinding(f.clip(),x,y),1,`decoration at ${x},${y}`);
});

test('internal scroll captures passively and refreshes moved plots once per frame',t=>{
 const f=fixture(t,[rect(10,40,90,80)]);
 f.card._syncElevenBackgroundClip();
 assert.equal(f.listeners.size,1);
 assert.deepEqual([...f.listeners.values()],[{capture:true,passive:true}]);
 f.plots[0].getBoundingClientRect=()=>rect(10,10,90,50);
 const before=f.clip(),measurements=f.measurements;
 f.scroll();f.scroll();f.scroll();
 assert.equal(f.frames.size,1);
 assert.equal(f.measurements,measurements,'scroll handlers do not force layout');
 assert.equal(f.clip(),before,'geometry waits for frame');
 f.flush();
 assert.equal(f.measurements,measurements+1);
 assert.equal(clipWinding(f.clip(),50,20),0,'new plot position is excluded');
 assert.equal(clipWinding(f.clip(),50,70),1,'old plot position no longer cuts decoration');
 f.scroll();assert.equal(f.frames.size,1);f.flush();
 assert.equal(f.measurements,measurements+2,'subsequent frames still refresh');
});

test('pure cutout geometry unions siblings without erasing the gaps around an L shape',()=>{
 const input=[rect(10,10,60,60),rect(40,40,90,90)];
 const expected=[{left:10,top:10,right:60,bottom:40},{left:10,top:40,right:90,bottom:60},{left:40,top:60,right:90,bottom:90}];
 assert.deepEqual(cardBackgroundCutoutRects(input,rect(0,0,100,100),100,100),expected);
 assert.deepEqual(cardBackgroundCutoutRects(input.toReversed(),rect(0,0,100,100),100,100),expected);
});

test('pure cutout geometry scales to CSS pixels, rounds outward and clamps all card edges',()=>{
 assert.deepEqual(cardBackgroundCutoutRects([rect(90,190,161,241),rect(280,290,330,330)],rect(100,200,300,300),100,100),[
  {left:0,top:0,right:31,bottom:41},{left:90,top:90,right:100,bottom:100},
 ]);
 assert.deepEqual(cardBackgroundCutoutRects([rect(0.2,0.3,100.8,100.7)],rect(0,0,100,100),99.5,99.5),[
  {left:0,top:0,right:99.5,bottom:99.5},
 ]);
});

test('pure cutout geometry ignores invalid, empty and wholly out-of-bounds rectangles',()=>{
 const invalid=[rect(1,1,1,10),rect(10,10,2,2),rect(-20,-20,-10,-10),rect(110,110,120,120),rect(NaN,1,10,10),rect(1,1,Infinity,10)];
 assert.deepEqual(cardBackgroundCutoutRects(invalid,rect(0,0,100,100),100,100),[]);
 assert.deepEqual(cardBackgroundCutoutRects([],rect(0,0,100,100),100,100),[]);
 for(const box of [rect(0,0,0,100),rect(0,0,100,0),rect(NaN,0,100,100)])assert.deepEqual(cardBackgroundCutoutRects([rect(1,1,10,10)],box,100,100),[]);
 for(const size of [0,-1,NaN,Infinity])assert.deepEqual(cardBackgroundCutoutRects([rect(1,1,10,10)],rect(0,0,100,100),size,100),[]);
});

test('deterministic rectangle sets preserve union coverage with no overlapping cutout interiors',()=>{
 const sets=[
  [rect(1,1,9,9),rect(2,2,8,8),rect(1,1,9,9)],
  [rect(1,1,5,5),rect(5,1,9,5),rect(1,5,9,9)],
  [rect(-2,-2,4,4),rect(6,6,12,12),rect(4,2,8,7)],
 ];
 let seed=12345;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%16-3;};
 for(let i=0;i<40;i++)sets.push(Array.from({length:8},()=>{const x=next(),y=next();return rect(x,y,x+1+Math.abs(next()),y+1+Math.abs(next()));}));
 for(const input of sets){
  const holes=cardBackgroundCutoutRects(input,rect(0,0,10,10),10,10);
  assert.deepEqual(cardBackgroundCutoutRects(input.toReversed(),rect(0,0,10,10),10,10),holes);
  for(const a of holes){
   assert.ok(a.left>=0&&a.top>=0&&a.right<=10&&a.bottom<=10&&a.right>a.left&&a.bottom>a.top);
   for(const b of holes)if(a!==b)assert.ok(Math.min(a.right,b.right)<=Math.max(a.left,b.left)||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top),'cutout interiors are disjoint');
  }
  for(let y=0.5;y<10;y++)for(let x=0.5;x<10;x++){
   const covers=r=>x>r.left&&x<r.right&&y>r.top&&y<r.bottom;
   assert.equal(holes.filter(covers).length,input.some(covers)?1:0,`union coverage at ${x},${y}`);
  }
 }
});

test('disconnect cancels queued geometry and reconnect installs just one fresh listener',t=>{
 const f=fixture(t,[rect(10,10,90,90)]);
 f.card._elevenBackgroundConfig={card_background:true};
 f.card._elevenBackgroundSignature=JSON.stringify([cardBackgroundSettings(f.card._elevenBackgroundConfig),'']);
 f.card.connectedCallback();
 const oldListener=[...f.listeners.keys()][0],observer=f.observers[0];
 f.scroll();assert.equal(f.frames.size,1);
 f.card.isConnected=false;f.card.disconnectedCallback();
 assert.equal(f.listeners.size,0);assert.equal(f.frames.size,0);assert.equal(observer.disconnected,true);
 assert.equal(f.card._elevenBackgroundPlots,null);
 const measurements=f.measurements;f.flush();assert.equal(f.measurements,measurements);
 f.card.isConnected=true;f.card.connectedCallback();f.card._syncElevenBackgroundClip();
 assert.equal(f.listeners.size,1);assert.notEqual([...f.listeners.keys()][0],oldListener);
 assert.equal(f.observers.length,2);assert.equal(f.observers[1].disconnected,undefined);
 f.scroll();assert.equal(f.frames.size,1);f.flush();
 assert.equal(f.measurements,measurements+3,'reconnect, explicit sync and scroll each refresh');
});

for(const [name,config] of [['off',{card_background:false}],['legacy',{background:'prism-glass'}]]){
 test(`${name} transition removes the scroll listener, resize observer and queued frame`,t=>{
  const f=fixture(t,[rect(10,10,90,90)]);
  f.card._syncElevenBackgroundClip();f.scroll();
  assert.equal(f.frames.size,1);
  f.card._elevenBackgroundConfig=config;f.card._syncElevenBackground();
  assert.equal(f.card._elevenBackgroundLayer,null);assert.equal(f.listeners.size,0);assert.equal(f.frames.size,0);
  assert.equal(f.observers[0].disconnected,true);assert.equal(f.card._elevenBackgroundPlots,null);
  const measurements=f.measurements;f.scroll();f.flush();assert.equal(f.measurements,measurements);
 });
}

test('scroll tracking is independent of ResizeObserver and cleans up if its layer disappears',t=>{
 const f=fixture(t,[rect(10,10,90,90)]);
 delete globalThis.ResizeObserver;
 f.card._syncElevenBackgroundClip();
 assert.equal(f.observers.length,0);assert.equal(f.listeners.size,1);
 f.scroll();assert.equal(f.frames.size,1);
 f.card._elevenBackgroundLayer=null;f.card._syncElevenBackgroundClip();
 assert.equal(f.listeners.size,0);assert.equal(f.frames.size,0);
});

test('wrapper clipping uses CSS-scaled, card-clamped geometry and clears holes when plots leave',t=>{
 const f=fixture(t,[rect(90,190,161,241)],{box:rect(100,200,300,300)});
 f.card._syncElevenBackgroundClip();
 assert.equal(clipWinding(f.clip(),30,40),0);assert.equal(clipWinding(f.clip(),32,42),1);
 f.plots[0].getBoundingClientRect=()=>rect(400,400,500,500);
 f.scroll();f.flush();assert.equal(f.clip(),'');
});
