/* No gamma-space blending. Scene-linear float32 RGB -> one display transform. */
globalThis.HousePixels={
 // sun.sun is a read-only render selector; never infer illumination from the HA theme.
 solarPhase(hass){
  const sun=hass?.states?.['sun.sun'],a=sun?.attributes,e=a?.elevation;
  if(!sun||['unknown','unavailable'].includes(sun.state)||typeof e!=='number'||!Number.isFinite(e))return null;
  if(e < -6)return 'night';
  if(e >= 20)return 'afternoon';
  const rising=typeof a.rising==='boolean'?a.rising:typeof a.azimuth==='number'&&Number.isFinite(a.azimuth)?((a.azimuth%360+360)%360)<180:null;
  return rising===null?'afternoon':rising?'morning':'evening';
 },
 resolveMode(requested,arrays,hass){
  const solar=['morning','afternoon','evening','night'].every(m=>Object.hasOwn(arrays,m));
  let mode=requested||'auto';
  if(mode==='auto'){
   const phase=this.solarPhase(hass);
   mode=solar?(phase||'afternoon'):phase?(phase==='night'?'dark':'light'):(hass?.themes?.darkMode?'dark':'light');
  }
  if(solar)mode=({light:'afternoon',dark:'night'})[mode]||mode;
  else mode=({morning:'light',afternoon:'light',evening:'light',night:'dark'})[mode]||mode;
  return mode;
 },
 state(value){return {known:value==='on'||value==='off',on:value==='on'};},
 lightLevel(entity){
  const s=this.state(entity?.state),b=entity?.attributes?.brightness;
  return {...s,level:s.on?(typeof b==='number'&&Number.isFinite(b)?Math.min(1,Math.max(0,b/255)):1):0};
 },
 compose(base,layers,on,alpha=null){
  if(alpha&&(alpha.length!==base.length/3||!alpha.every(a=>Number.isFinite(a)&&a>=0&&a<=1)))throw Error('Invalid alpha coverage');
  const out=new Uint8ClampedArray(base.length/3*4);
  const weights=layers.map((_,i)=>on[i]===true?1:typeof on[i]==='number'&&Number.isFinite(on[i])?Math.min(1,Math.max(0,on[i])):0);
  for(let p=0,q=0;p<base.length;p+=3,q+=4){
   for(let c=0;c<3;c++){
    let x=base[p+c];
    for(let i=0;i<layers.length;i++)if(weights[i])x+=layers[i][p+c]*weights[i];
    if(alpha)x=alpha[q/4]>0?x/alpha[q/4]:0;
    x=Math.max(0,x);x=x/(1+x);x=x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
    out[q+c]=Math.floor(Math.min(1,Math.max(0,x))*255+.5);
   }
   out[q+3]=alpha?Math.floor(alpha[q/4]*255+.5):255;
  }
  return out;
 },
 async json(url,cache='no-store'){
  const r=await fetch(url,{cache});if(!r.ok)throw Error('HTTP '+r.status);return r.json();
 },
 // Web Crypto needs a secure context; LAN HTTP still verifies every supplied checksum.
 async sha256(data){
  if(globalThis.crypto?.subtle)return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
  const bytes=ArrayBuffer.isView(data)?new Uint8Array(data.buffer,data.byteOffset,data.byteLength):new Uint8Array(data);
  const padded=new Uint8Array(Math.ceil((bytes.length+9)/64)*64);padded.set(bytes);padded[bytes.length]=0x80;
  const input=new DataView(padded.buffer),bits=bytes.length*8;
  input.setUint32(padded.length-8,Math.floor(bits/0x100000000));input.setUint32(padded.length-4,bits>>>0);
  const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
   0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
   0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
   0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
   0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
   0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
   0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
   0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64);
  const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let offset=0;offset<padded.length;offset+=64){
   for(let i=0;i<16;i++)w[i]=input.getUint32(offset+i*4);
   for(let i=16;i<64;i++){
    const x=w[i-15],y=w[i-2],s0=rotate(x,7)^rotate(x,18)^(x>>>3),s1=rotate(y,17)^rotate(y,19)^(y>>>10);
    w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
   }
   let [a,b,c,d,e,f,g,z]=h;
   for(let i=0;i<64;i++){
    const t1=(z+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0;
    const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
    z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
   }
   const block=[a,b,c,d,e,f,g,z];for(let i=0;i<8;i++)h[i]=(h[i]+block[i])>>>0;
  }
  return Array.from(h,n=>n.toString(16).padStart(8,'0')).join('');
 },
 // Bounded shared cache: deduplicate downloads, hashing and float validation across cards.
 assetCache:new Map(),assetBytes:0,assetBudget:96*1024*1024,
 async asset(url,kind,manifest,file=String(url)){
  const metadata=manifest.files?.[file],gzip=typeof globalThis.DecompressionStream==='function'?metadata?.gzip:null;
  const key=String(url)+'|'+(metadata?.sha256||'')+'|'+JSON.stringify(gzip?[gzip.file,gzip.sha256,gzip.bytes]:null)+'|'+kind+'|'+manifest.width+'x'+manifest.height;
  let entry=this.assetCache.get(key);
  if(entry){this.assetCache.delete(key);this.assetCache.set(key,entry);return entry.promise;}
  entry={bytes:0};
  entry.promise=(async()=>{
   const response=await fetch(gzip?new URL(gzip.file,url):url);if(!response.ok)throw Error('Onvolledige beeldset: '+file);
   let data=await response.arrayBuffer();const channels=kind==='alpha'?1:3;
   if(gzip){
    if(gzip.bytes!==undefined&&data.byteLength!==gzip.bytes)throw Error('Gzip-afmetingen ongelijk');
    const digest=await this.sha256(data);
    if(digest!==gzip.sha256)throw Error('Gzip-checksum wijkt af');
    data=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   }
   if(data.byteLength!==manifest.width*manifest.height*channels*4)throw Error('Laagafmetingen ongelijk');
   if(metadata){
    const digest=await this.sha256(data);
    if(digest!==metadata.sha256)throw Error('Checksum wijkt af');
   }
   const a=new Float32Array(data);if(!a.every(v=>Number.isFinite(v)&&(kind!=='alpha'||v>=0&&v<=1)))throw Error('Ongeldige pixels');
   entry.bytes=data.byteLength;this.assetBytes+=entry.bytes;
   for(const [k,e] of this.assetCache){if(this.assetBytes<=this.assetBudget)break;if(e.bytes){this.assetCache.delete(k);this.assetBytes-=e.bytes;}}
   return a;
  })().catch(e=>{if(this.assetCache.get(key)===entry)this.assetCache.delete(key);throw e;});
  this.assetCache.set(key,entry);return entry.promise;
 },
 async ensureMode(loaded,mode){
  if(loaded.arrays[mode])return loaded.arrays[mode];
  if(!loaded.view.modes[mode])throw Error('Ongeldige modus');
  loaded.modeRequests??={};if(loaded.modeRequests[mode])return loaded.modeRequests[mode];
  const spec=loaded.view.modes[mode];
  const request=Promise.all([spec.base,...spec.layers].map(file=>this.asset(new URL(file,loaded.url),'rgb',loaded.manifest,file)))
   .then(values=>{const value={base:values[0],layers:values.slice(1)};for(const [name,s] of Object.entries(loaded.view.modes))if(s.base===spec.base&&JSON.stringify(s.layers)===JSON.stringify(spec.layers))loaded.arrays[name]=value;return value;})
   .finally(()=>{delete loaded.modeRequests[mode];});
  loaded.modeRequests[mode]=request;return request;
 },
 async load(url,viewId,options=null){
  const origin=new URL(url,document.baseURI);let manifest=await this.json(origin);
  const manifestURL=manifest.manifest?new URL(manifest.manifest,origin):origin;
  if(manifest.manifest)manifest=await this.json(manifestURL,'default');
  if(manifest.schema!==1||manifest.dtype!=='float32-le'||manifest.channels!==3)throw Error('Onbekend beeldformaat');
  if(this.previewCompressionURL&&typeof globalThis.DecompressionStream==='function'){
   // App-only optional overlay. Refresh even successful indexes so new assets and
   // repaired/missing sidecars can be retried without pinning a stale lookup.
   let index;try{index=await this.json(new URL(this.previewCompressionURL,document.baseURI));}catch(e){}
   if(index?.schema===1&&index.assets&&typeof index.assets==='object'&&!Array.isArray(index.assets)){
    const files={...manifest.files};
    for(const [file,metadata] of Object.entries(files)){
     const gzip=index.assets[metadata?.sha256];
     if(metadata&&!metadata.gzip&&gzip)files[file]={...metadata,gzip:{...gzip,file:new URL(gzip.file,document.baseURI).href}};
    }
    manifest={...manifest,files};
   }
  }
  const view=manifest.views.find(v=>v.id===viewId);if(!view)throw Error('Aanzicht ontbreekt');
  const arrays=Object.fromEntries(Object.keys(view.modes).map(mode=>[mode,null]));
  const loaded={manifest,view,arrays,alpha:null,url:manifestURL};
  const modes=options?[this.resolveMode(options.mode,arrays,options.hass)]:Object.keys(view.modes);
  await Promise.all([
   ...modes.map(mode=>this.ensureMode(loaded,mode)),
   view.alpha?this.asset(new URL(view.alpha,manifestURL),'alpha',manifest,view.alpha).then(a=>{loaded.alpha=a;}):Promise.resolve()
  ]);
  return loaded;
 }
};
class HouseLightCard extends HTMLElement{
 constructor(){
  super();this.attachShadow({mode:'open'});
  this.shadowRoot.innerHTML=`<style>:host{display:block}canvas{display:block;width:100%;height:auto;border-radius:6px}p{font:13px system-ui;color:var(--secondary-text-color,#516158);margin:8px 0}p[data-error="true"]{color:#9e3b20}</style><canvas aria-label="Huis met vooraf berekende verlichting" role="img"></canvas><p role="status">Beeldset laden…</p>`;
 }
 setConfig(config){
  if(!config.manifest)throw Error('manifest is verplicht');
  this.config={view:'cam-iso',mode:'auto',...config};this.loadGeneration=(this.loadGeneration||0)+1;this.loading=false;this.load();
 }
 set hass(value){this._hass=value;this.draw();}
 getCardSize(){return 5;}
 connectedCallback(){if(this.config)this.load();this.timer=setInterval(()=>this.load(),30000);}
 disconnectedCallback(){clearInterval(this.timer);}
 async load(){
  if(!this.config||this.loading)return;this.loading=true;const generation=this.loadGeneration;
  try{
   const next=await HousePixels.load(this.config.manifest,this.config.view,{mode:this.config.mode,hass:this._hass});
   if(generation!==this.loadGeneration)return;
   this.loaded=next;this.failure=null;this.draw();this.dispatchEvent(new CustomEvent('house-ready',{detail:next}));
  }catch(e){if(generation===this.loadGeneration){this.failure=e.message;this.draw();}}
  finally{if(generation===this.loadGeneration)this.loading=false;}
 }
 draw(){
  const status=this.shadowRoot.querySelector('p');
  if(!this.loaded){status.textContent=this.failure||'Beeldset laden…';status.dataset.error=String(!!this.failure);return;}
  const {manifest,arrays}=this.loaded;
  const mode=HousePixels.resolveMode(this.config.mode,arrays,this._hass);
  if(!arrays[mode]){
   // Keep the last canvas while a newly selected phase downloads.
   if(this.modeLoad?.loaded===this.loaded&&this.modeLoad.mode===mode)return;
   if(this.failure){status.textContent='Nieuwe set niet geladen; vorige set blijft zichtbaar: '+this.failure;status.dataset.error='true';return;}
   const current=this.loaded,generation=this.loadGeneration,request={loaded:current,mode};this.modeLoad=request;
   status.textContent='Aanzicht laden…';
   HousePixels.ensureMode(current,mode).then(()=>{
    if(this.loaded!==current||generation!==this.loadGeneration)return;
    this.failure=null;this.draw();
   }).catch(e=>{
    if(this.loaded!==current||generation!==this.loadGeneration)return;
    this.failure=e.message;status.textContent='Nieuwe set niet geladen; vorige set blijft zichtbaar: '+e.message;status.dataset.error='true';
   }).finally(()=>{if(this.modeLoad===request)this.modeLoad=null;});
   return;
  }
  const states=manifest.lights.map(l=>HousePixels.state(Object.hasOwn(l,'area_id')?this._hass?.houseAreaStates?.[l.area_id]:this._hass?.states?.[l.entity]?.state));
  const key=manifest.release+this.loaded.view.id+mode+states.map(s=>s.on?1:0).join('');
  if(key!==this.drawKey){
   const canvas=this.shadowRoot.querySelector('canvas');if(canvas.style)canvas.style.imageRendering=manifest.render_style==='habbo'?'pixelated':'auto';canvas.width=manifest.width;canvas.height=manifest.height;
   canvas.getContext('2d').putImageData(new ImageData(HousePixels.compose(arrays[mode].base,arrays[mode].layers,states.map(s=>s.on),this.loaded.alpha),manifest.width,manifest.height),0,0);this.drawKey=key;
  }
  const missing=manifest.lights.filter((_,i)=>!states[i].known).map(l=>l.name);
  const warning=missing.length?'Status onbekend; als uit getoond: '+missing.join(', '):'';
  status.textContent=[this.failure?'Nieuwe set niet geladen; vorige set blijft zichtbaar: '+this.failure:warning,`${({light:'Lichte',dark:'Donkere',morning:'Ochtend',afternoon:'Middag',evening:'Avond',night:'Nacht'})[mode]||mode} modus · set ${manifest.release.slice(0,8)}`].filter(Boolean).join(' — ');
  status.dataset.error=String(!!this.failure||!!missing.length);
 }
}
if(!customElements.get('house-light-card'))customElements.define('house-light-card',HouseLightCard);
