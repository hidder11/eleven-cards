// Pure color derivation for an explicit selection accent, never sensor/status paint.
export function parseColor(value){
 const s=String(value||'').trim();
 if(/^#[\da-f]{3}$/i.test(s))return [...s.slice(1)].map(c=>parseInt(c+c,16));
 if(/^#[\da-f]{6}$/i.test(s))return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 const m=s.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
 return m&&m.slice(1).every(n=>+n<=255)?m.slice(1).map(Number):null;
}
const hex=a=>'#'+a.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>a.map((n,i)=>Math.round(n*(1-t)+b[i]*t));
const luminance=a=>a.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
export function contrast(a,b){const x=luminance(parseColor(a)),y=luminance(parseColor(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function materialAccent(value,dark=false,surface=dark?'#2c303d':'#edf0f6',additionalSurfaces=[],minFocusContrast=3){
 const rgb=parseColor(value);if(!rgb)return null;
 const base=parseColor(surface)||parseColor(dark?'#2c303d':'#edf0f6');
 const tint1=hex(mix(base,rgb,dark?.27:.12)),tint2=hex(mix(base,rgb,dark?.19:.20));
 const towards=dark?[255,255,255]:[0,0,0];
 let accent=hex(rgb),focus=hex(rgb);
 const backgrounds=[tint1,tint2,...additionalSurfaces.filter(v=>parseColor(v))];
 for(let i=0;i<=100;i++){accent=hex(mix(rgb,towards,i/100));if(backgrounds.every(background=>contrast(accent,background)>=4.5))break;}
 for(let i=0;i<=100;i++){focus=hex(mix(rgb,towards,i/100));if(contrast(focus,hex(base))>=minFocusContrast)break;}
 return {accent,tint1,tint2,focus};
}
