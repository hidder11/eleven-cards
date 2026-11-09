/* No gamma-space blending. Scene-linear float32 RGB -> one display transform. */
const HousePixels={
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
