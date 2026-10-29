/* Weather is decorative and read-only. See README for mapping/product thresholds. */
export const houseWeatherSchema=[{name:'weather_overlay',selector:{boolean:{}}},{name:'animate_weather',selector:{boolean:{}}},{name:'weather_intensity',selector:{number:{min:0,max:100,step:5,mode:'slider'}}},{name:'wind_threshold',selector:{number:{min:1,max:100,step:1,unit_of_measurement:'m/s'}}}];
const weatherConditions=new Set(['clear-night','cloudy','exceptional','fog','hail','lightning','lightning-rainy','partlycloudy','pouring','rainy','snowy','snowy-rainy','sunny','windy','windy-variant']);
export function windMetersPerSecond(value,unit){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0)return null;
 // Same Beaufort conversion as HA SpeedConverter._beaufort_to_ms.
 if(unit==='Beaufort')return .836*value**1.5;
 const factors={'m/s':1,'km/h':1/3.6,mph:.44704,kn:.5144444444444445,'ft/s':.3048,'in/s':.0254,'m/min':1/60};
 return Object.hasOwn(factors,unit)?value*factors[unit]:null;
}
export function houseWeatherState(config={},entity){
 const none={mode:'none',amount:0,wind:0};
 if(config.weather_overlay===false||!entity||!weatherConditions.has(entity.state))return none;
 const a=entity.attributes||{},speed=windMetersPerSecond(a.wind_speed,a.wind_speed_unit);
 const threshold=typeof config.wind_threshold==='number'&&Number.isFinite(config.wind_threshold)?Math.max(1,Math.min(100,config.wind_threshold)):10.8;
 const windy=['windy','windy-variant','lightning','lightning-rainy'].includes(entity.state)||(speed!==null&&speed>=threshold);
 const rain=['rainy','pouring','lightning-rainy'].includes(entity.state),snow=['snowy','snowy-rainy'].includes(entity.state);
 const mode=snow?'snow':rain?(windy?'storm':'rain'):windy?'wind':'none';
 const amount=typeof config.weather_intensity==='number'&&Number.isFinite(config.weather_intensity)?Math.max(0,Math.min(1,config.weather_intensity/100)):.65;
 return {mode,amount:mode==='none'?0:amount,wind:speed===null?.65:Math.min(1,speed/25)};
}
export const houseWeatherRandom=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const houseWindSpeed=amount=>.35+2.4*amount;
export function houseSnowPosition(i,t,w,h){
 const r=houseWeatherRandom;
 return {x:((r(i+400)*w+t*(.4+r(i+700)*.8)+Math.sin(t*.35+i)*2.5)%(w+70)+w+70)%(w+70)-35,y:((r(i+200)*h+t*(13+r(i+1)*15))%(h+30))-15};
}
export class HouseWeather{
 constructor(host){
  this.host=host;this.clock=0;this.windClock=0;this.last=null;this.frame=0;this.visible=true;this.state={mode:'none',amount:0,wind:0};
  const root=host.shadowRoot,style=document.createElement('style');
  style.textContent=`.house-weather{position:absolute;left:0;top:0;pointer-events:none;z-index:1;overflow:hidden}.house-weather>canvas{position:static!important;display:block!important;width:100%!important;height:100%!important;margin:0!important;aspect-ratio:auto!important;transform:none!important;background:none!important}.stage-caption{position:relative;z-index:2}`;
  root.append(style);this.layer=document.createElement('div');this.layer.className='house-weather';this.layer.setAttribute('aria-hidden','true');this.canvas=document.createElement('canvas');this.layer.append(this.canvas);root.querySelector('.stage').append(this.layer);this.ctx=this.canvas.getContext('2d');
  this.resume=()=>{this.last=null;cancelAnimationFrame(this.frame);this.frame=0;this.paint();if(this.active())this.frame=requestAnimationFrame(now=>this.tick(now));};
 }
 connect(){
  this.disconnect();this.connected=true;this.visible=true;
  this.media=matchMedia('(prefers-reduced-motion: reduce)');this.media.addEventListener('change',this.resume);document.addEventListener('visibilitychange',this.resume);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.host.shadowRoot.querySelector('.stage'));this.resizeObserver.observe(this.host.shadowRoot.querySelector('.stage-caption'));
  this.intersection=new IntersectionObserver(entries=>{this.visible=entries.some(e=>e.isIntersecting);this.resume();});this.intersection.observe(this.host);
  // Window resize also covers moving between monitors with different DPR.
  this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);this.resize();this.update();
 }
 disconnect(){
  this.connected=false;cancelAnimationFrame(this.frame);this.frame=0;this.last=null;this.resizeObserver?.disconnect();this.intersection?.disconnect();this.media?.removeEventListener('change',this.resume);document.removeEventListener('visibilitychange',this.resume);if(this.onResize)window.removeEventListener('resize',this.onResize);
 }
 active(){return this.connected&&this.host.isConnected&&this.visible&&!document.hidden&&!this.media?.matches&&this.host.config?.animate_weather!==false&&this.host._hass?.connected!==false&&this.state.mode!=='none'&&this.state.amount>0&&this.w>0&&this.h>0;}
 update(){
  this.state=houseWeatherState(this.host.config,this.host._hass?.states?.[this.host.config?.weather_entity]);
  // HA updates unrelated entities frequently: never restart an active clock.
  if(this.active()&&this.frame)this.paint();else this.resume();
 }
 resize(){
  const root=this.host.shadowRoot,s=root.querySelector('.stage').getBoundingClientRect(),cap=root.querySelector('.stage-caption').getBoundingClientRect();
  this.w=Math.max(0,s.width);this.h=Math.max(0,Math.min(s.height,cap.top-s.top));const dpr=Math.min(window.devicePixelRatio||1,2);
  const width=Math.round(this.w*dpr),height=Math.round(this.h*dpr);this.layer.style.width=this.w+'px';this.layer.style.height=this.h+'px';
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.ctx?.setTransform(dpr,0,0,dpr,0,0);}this.resume();
 }
 tick(now){
  this.frame=0;if(!this.active()){this.last=null;return;}
  if(this.last!==null){const dt=Math.max(0,Math.min((now-this.last)/1000,.05));this.clock+=dt;this.windClock+=dt*houseWindSpeed(this.state.wind*this.state.amount);}this.last=now;this.paint();this.frame=requestAnimationFrame(time=>this.tick(time));
 }
 paint(t=this.clock,windT=this.windClock){
  const ctx=this.ctx,w=this.w||0,h=this.h||0;if(!ctx)return;
  // Suspended cards retain pixels until visible again; no painting on HA updates.
  if(this.connected===false||this.host.isConnected===false||this.visible===false||globalThis.document?.hidden)return;
  ctx.clearRect(0,0,w,h);
  const {mode,amount}=this.state;if(mode==='none'||amount<=0||h<=0||w<=0)return;
  const dark=this.host._hass?.themes?.darkMode===true,r=houseWeatherRandom,snow=mode==='snow',storm=mode==='storm';ctx.save();
  const fade=ctx.createLinearGradient(0,0,0,h);fade.addColorStop(0,'rgba(255,255,255,1)');fade.addColorStop(.8,'rgba(255,255,255,1)');fade.addColorStop(1,'rgba(255,255,255,0)');
  const count=Math.round((snow?55:85)*amount*w/440);
  if(mode!=='wind')for(let i=0;i<count;i++){
   const seed=r(i+1),p=snow?houseSnowPosition(i,t,w,h):{x:((r(i+400)*w+t*(storm?100:20))%(w+70)+w+70)%(w+70)-35,y:((r(i+200)*h+t*(175+seed*120))%(h+30))-15};
   ctx.beginPath();if(snow){ctx.fillStyle=dark?`rgba(240,247,255,${.45+seed*.4})`:`rgba(204,222,235,${.65+seed*.3})`;ctx.shadowColor='rgba(255,255,255,.3)';ctx.shadowBlur=2;ctx.arc(p.x,p.y,1+seed*1.8,0,Math.PI*2);ctx.fill();}
   else{ctx.strokeStyle=dark?`rgba(157,197,226,${.17+seed*.27})`:`rgba(67,115,148,${.24+seed*.25})`;ctx.lineWidth=.7+seed*.5;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(storm?8:2),p.y+8+seed*8);ctx.stroke();}
  }
  ctx.shadowBlur=0;
  if(mode==='wind'||storm)for(let i=0;i<6;i++){
   const phase=(windT*(.22+r(i+20)*.12)+i*.21)%1,x=-w*.7+phase*w*2,y=h*(.15+r(i+60)*.7),len=w*(.18+r(i+90)*.2);ctx.globalAlpha=Math.sin(phase*Math.PI);ctx.strokeStyle=dark?'rgba(190,214,225,.42)':'rgba(84,119,137,.4)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+len*.3,y-9,x+len*.6,y+10,x+len,y-3);ctx.stroke();if(i%2===0){ctx.beginPath();ctx.moveTo(x+16,y+7);ctx.quadraticCurveTo(x+len*.65,y+13,x+len*.85,y+6);ctx.stroke();}
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);ctx.restore();
 }
}
