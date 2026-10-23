// Styling proposals only; the shared demo supplies synthetic readings and history.
import './story-concepts.js';
const shared=`
 .content{--surface:var(--ha-card-background,var(--card-background-color));--tile:color-mix(in srgb,var(--secondary-background-color) 80%,var(--surface));overflow:hidden}
 .header-scene .status-line{position:relative;z-index:3;background:var(--secondary-background-color);border:0;border-radius:10px;box-shadow:none;margin-top:12px}
 .status-line p{color:var(--secondary-text-color)}.status-symbol{background:color-mix(in srgb,var(--tone) 14%,var(--tile))}
 .live-readings{gap:10px}.live-readings>div{background:var(--tile);border-radius:10px;padding:12px}.live-readings .live-value{font-size:26px;font-weight:600}.live-readings .live-sub{line-height:20px;min-height:20px}
 .header-scene{isolation:isolate}.header-scene::before,.header-scene::after{display:none}.gallery-top{background:none!important}.car-stage{min-height:272px}.car-stage::before,.car-stage::after{display:none}.vehicle-motion{opacity:.35}.battery-value{font-size:70px;font-weight:500;letter-spacing:-.065em}.battery-meta{margin-top:2px}.battery-track{height:4px;background:var(--tile)}.battery-fill{background:var(--tone)}.picture img{filter:drop-shadow(0 14px 8px #0004)}
 .visual-art{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}.visual-art::before,.visual-art::after{content:'';position:absolute}.session-summary{padding-top:2px}.metrics dd{font-size:20px;font-weight:600}.metrics dt{font-size:11px}.history{border-top-color:var(--divider-color)}
 /* One continuous scene behind the car, battery and solid status tile. */
 .header-scene:has(.status-line)::before{display:block;inset:0;background:var(--scene-art,none);mask-image:linear-gradient(180deg,#000 0%,#000 calc(100% - 40px),transparent 100%);border:0;box-shadow:none;transform:none}
 @container(max-width:320px){.battery-value{font-size:60px}.car-stage{min-height:254px}.live-readings .live-value{font-size:22px}}
`;
const looks={
 pass:`
 .header-scene{background:linear-gradient(125deg,color-mix(in srgb,var(--tone) 16%,var(--surface)),var(--surface) 70%);border-bottom:1px solid color-mix(in srgb,var(--tone) 25%,var(--divider-color))}
 .car-stage{min-height:280px}.battery-value{font-size:86px;line-height:1}.picture{bottom:3px}.picture img{width:92%;height:150px}.battery-row{padding-top:5px}.visual-art{background:repeating-linear-gradient(125deg,transparent 0 40px,color-mix(in srgb,var(--tone) 4%,transparent) 41px 42px)}
 .design-tag{position:absolute;right:0;top:4px;border:1px solid var(--tone);border-radius:5px;padding:5px 8px;font-size:10px;letter-spacing:.12em;color:var(--tone);text-transform:uppercase;z-index:3}
 .header-scene .status-line{border-radius:7px;border-left:3px solid var(--tone)}.live-readings{margin-top:14px}
 @container(max-width:320px){.battery-value{font-size:72px}.design-tag{top:0;font-size:9px}}
 `,
 rail:`
 .hero{padding-left:42px}.car-stage{min-height:282px}.battery-row{padding-top:3px}.battery-value{font-size:76px}.hero>.battery-track{position:absolute;left:16px;top:12px;bottom:20px;width:9px;height:auto;border-radius:10px}.battery-fill{position:absolute;bottom:0;width:100%!important;height:var(--rail-soc);border-radius:10px}.target-marker{left:50%!important;top:auto;bottom:80%;width:17px;height:2px}.picture img{width:104%;height:146px}.picture{left:-16px;width:calc(100% + 16px)}
 .visual-art{inset:0 -16px 0 0;background:linear-gradient(90deg,color-mix(in srgb,var(--tone) 9%,transparent),transparent)}.header-scene .status-line{border-left:3px solid var(--tone)}
 @container(max-width:320px){.hero{padding-left:30px}.hero>.battery-track{left:13px;width:7px}.battery-value{font-size:63px}}
 `,
 core:`
 .car-stage{min-height:324px}.battery-row{position:absolute;left:0;right:0;bottom:4px;align-items:center;text-align:center;z-index:3}.battery-meta{display:flex;justify-content:center}.battery-value{font-size:62px}.picture{bottom:103px;top:0}.picture img{width:96%;height:146px}.visual-art{inset:4px 0 90px;display:grid;place-items:center}.visual-art::before{width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--tone) 24%,var(--surface)) 0 48%,color-mix(in srgb,var(--tone) 45%,var(--surface)) 49%,var(--surface) 50% 59%,color-mix(in srgb,var(--tone) 12%,var(--surface)) 60%,transparent 61%);box-shadow:0 0 55px color-mix(in srgb,var(--tone) 10%,transparent)}.battery-track{margin-top:8px}
 .header-scene .status-line{justify-content:center}.live-readings>div{text-align:center}.live-readings .live-sub{justify-content:center}
 @container(max-width:320px){.car-stage{min-height:310px}.battery-value{font-size:58px}.visual-art::before{width:200px;height:200px}.picture img{height:132px}}
 `,
 timeline:`
 .car-stage{min-height:230px}.battery-value{font-size:64px}.picture img{height:126px;width:82%}.visual-art{background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--tone) 8%,transparent));border-bottom:1px solid color-mix(in srgb,var(--tone) 40%,transparent)}
 .live-readings{margin-top:16px}.timeline-focus{margin:14px 0 0;padding:14px 0 0;border-top:1px solid var(--divider-color)}.timeline-focus .history{margin:0;padding:0;border:0}.timeline-focus .plot{height:100px}.timeline-caption{font-size:10px;color:var(--secondary-text-color);margin-bottom:8px;letter-spacing:.08em;text-transform:uppercase}.header-scene .status-line{border-left:3px solid var(--tone)}
 @container(max-width:320px){.car-stage{min-height:224px}.battery-value{font-size:58px}.picture img{height:112px}}
 `,
 split:`
 .car-stage{min-height:250px;display:grid;grid-template-columns:42% 58%;align-items:center}.battery-row{position:relative;z-index:3;align-self:center;padding-bottom:12px}.battery-value{font-size:64px}.picture{left:39%;width:66%;top:22px;bottom:38px;overflow:hidden}.picture img{width:125%;height:128px;bottom:12px}.visual-art{inset:0 -16px 0 39%;background:linear-gradient(150deg,color-mix(in srgb,var(--tone) 21%,var(--surface)),color-mix(in srgb,var(--tone) 4%,var(--surface)));border-left:1px solid color-mix(in srgb,var(--tone) 24%,transparent);border-radius:90px 0 0 0}.header-scene .status-line{border-radius:9px;border-bottom:2px solid var(--tone)}.live-readings{gap:1px;overflow:hidden;border-radius:9px;background:var(--divider-color)}.live-readings>div{border-radius:0}
 @container(max-width:320px){.car-stage{min-height:226px}.battery-value{font-size:49px}.picture img{height:108px}.range{font-size:10px}}
 `,
 studio:`
 .header-scene{--scene-art:radial-gradient(ellipse at 65% 48%,color-mix(in srgb,var(--tone) 16%,transparent),transparent 75%),linear-gradient(180deg,transparent 15%,color-mix(in srgb,var(--tone) 7%,transparent) 85%)}
 .visual-art::before{left:8%;right:3%;bottom:12px;height:70px;border-radius:50%;background:radial-gradient(ellipse,color-mix(in srgb,var(--tone) 26%,transparent),transparent 70%);transform:scaleY(.5)}
 .visual-art::after{left:8%;right:3%;bottom:18px;height:46px;border:1px solid color-mix(in srgb,var(--tone) 24%,transparent);border-radius:50%;transform:scaleY(.45)}
 .status-line{border-left:3px solid var(--tone)}
 `,
 orbit:`
 .visual-art{inset:2px 0 6px 18%}.visual-art svg{width:100%;height:100%;overflow:visible}.orbit-track,.orbit-progress{fill:none;stroke-width:2;vector-effect:non-scaling-stroke}.orbit-track{stroke:color-mix(in srgb,var(--tone) 13%,var(--surface))}.orbit-progress{stroke:var(--tone);stroke-linecap:round;filter:drop-shadow(0 0 5px color-mix(in srgb,var(--tone) 30%,transparent))}
 .header-scene{--scene-art:radial-gradient(ellipse at 70% 50%,color-mix(in srgb,var(--tone) 15%,transparent),transparent 78%),linear-gradient(180deg,transparent 20%,color-mix(in srgb,var(--tone) 6%,transparent) 85%)}
 .status-line{border-color:color-mix(in srgb,var(--tone) 35%,var(--divider-color))}
 `,
 contour:`
 .header-scene{--scene-art:repeating-radial-gradient(ellipse at 100% 48%,transparent 0 18px,color-mix(in srgb,var(--tone) 12%,transparent) 19px 20px,transparent 21px 36px),radial-gradient(ellipse at 84% 62%,color-mix(in srgb,var(--tone) 8%,transparent),transparent 75%)}
 .visual-art{inset:0 -16px 0 24%;opacity:.6;background:none}
 .visual-art::after{inset:auto 0 7px 0;height:7px;background:repeating-linear-gradient(90deg,var(--tone) 0 1px,transparent 1px 18px);opacity:.45}
 .status-line{border-radius:7px}.live-readings>div{border-radius:7px;border-top:2px solid color-mix(in srgb,var(--tone) 40%,var(--tile))}
 `,
 horizon:`
 .header-scene{--scene-art:linear-gradient(165deg,transparent 15%,color-mix(in srgb,var(--tone) 5%,transparent) 32%,color-mix(in srgb,var(--tone) 15%,transparent) 75%,color-mix(in srgb,var(--tone) 9%,transparent) 100%)}
 .visual-art{inset:0 -16px}.visual-art::before{left:0;right:0;bottom:38px;height:86px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--tone) 20%,transparent));clip-path:polygon(0 30%,100% 0,100% 100%,0 100%)}
 .visual-art::after{left:0;right:0;bottom:37px;height:1px;background:linear-gradient(90deg,transparent,var(--tone),transparent);box-shadow:0 4px 16px color-mix(in srgb,var(--tone) 30%,transparent)}
 .status-line{border-left:3px solid var(--tone)}.live-readings{gap:1px;background:var(--divider-color);border-radius:10px;overflow:hidden}.live-readings>div{border-radius:0}
 `
};
const cards=window.evccStory.cards;
for(const card of cards){
 const render=card._render.bind(card);
 card._render=()=>{
  render();const root=card.shadowRoot;
  if(!root.querySelector('.car-stage')||root.querySelector('[data-visual]'))return;
  const style=document.createElement('style');style.dataset.visual='';style.textContent=shared+looks[card.dataset.look];root.append(style);
  const art=document.createElement('div');art.className='visual-art';art.setAttribute('aria-hidden','true');
  if(card.dataset.look==='orbit'){
   const soc=Number(card.hass.states['sensor.demo_soc'].state);
   art.innerHTML=`<svg viewBox="0 0 300 270" preserveAspectRatio="xMidYMid meet"><path class="orbit-track" pathLength="100" d="M50 220 A110 110 0 1 1 250 220"/><path class="orbit-progress" pathLength="100" stroke-dasharray="${soc} 100" d="M50 220 A110 110 0 1 1 250 220"/></svg>`;
  }
  root.querySelector('.car-stage').prepend(art);
  if(card.dataset.look==='pass'){
   const tag=document.createElement('span');tag.className='design-tag';tag.textContent='EV / Smart';root.querySelector('.car-stage').append(tag);
  }
  if(card.dataset.look==='rail')root.querySelector('.content').style.setProperty('--rail-soc',`${card.hass.states['sensor.demo_soc'].state}%`);
  if(card.dataset.look==='timeline'){
   const history=root.querySelector('.history');
   if(history){const focus=document.createElement('div');focus.className='timeline-focus';focus.innerHTML='<div class="timeline-caption">Laadverloop · hele sessie</div>';focus.append(history);root.querySelector('.header-scene').after(focus);}
  }
 };
 card.setConfig({evcc_enabled:true,...card._config,show_session:true});
}
function sync(){
 window.evccStory.sync();
 const state=document.getElementById('visual-state').value;
 for(const card of cards){
  const states={...card.hass.states};
  const set=(id,value)=>states[id]={...states[id],state:String(value)};
  set('binary_sensor.demo_connected',state==='disconnected'?'off':'on');
  set('binary_sensor.demo_charging',state==='charging'?'on':'off');
  set('sensor.demo_soc',state==='done'?80:62);
  set('sensor.demo_power',state==='charging'?7.1:0);
  set('sensor.demo_current',state==='charging'?10.3:0);
  set('sensor.demo_remaining_duration',state==='charging'?45:0);
  card.hass={...card.hass,states};card._historyRevision++;card._render();
 }
}
document.getElementById('visual-state').onchange=sync;
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';sync();};
sync();window.evccVisual={cards,sync};
