// Native card animation and synthetic readings; only the progress track varies.
import './story-concepts.js';
const shared=`
 .content{height:auto;min-height:0;--solid-tile:color-mix(in srgb,var(--secondary-background-color) 80%,var(--ha-card-background))}
 .header-scene .status-line{background:var(--secondary-background-color);border:0;box-shadow:none}
 .battery-track{isolation:isolate}.target-marker{z-index:3;pointer-events:none}
`;
const variants={
 'capsule-soft':`.battery-track{height:10px;border-radius:20px;background:var(--solid-tile)}.battery-fill{border-radius:20px;background:var(--primary-color)}.target-marker{top:-4px;height:18px;width:2px;border-radius:2px}`,
 'capsule-glass':`.battery-track{height:18px;border-radius:20px;background:var(--solid-tile);box-shadow:inset 0 1px 3px #0002}.battery-fill{border-radius:20px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 65%,#fff),var(--primary-color) 65%);box-shadow:inset 0 1px 0 #ffffff55,inset 0 -2px 3px #0002}.target-marker{top:-3px;height:24px;width:2px;border-radius:2px}`,
 'capsule-outline':`.battery-track{height:10px;border-radius:20px;background:var(--solid-tile);outline:1px solid color-mix(in srgb,var(--primary-color) 35%,var(--divider-color));outline-offset:3px;margin-top:4px;margin-bottom:4px}.battery-fill{border-radius:20px;background:var(--primary-color)}.target-marker{top:-6px;height:22px;width:2px;border-radius:2px}`,
 'scale-ruler':`.battery-track{height:5px;margin-bottom:29px;background:var(--solid-tile)}.battery-track::after{content:'';position:absolute;left:0;right:0;top:9px;height:5px;background:repeating-linear-gradient(90deg,var(--secondary-text-color) 0 1px,transparent 1px 10%);opacity:.55;pointer-events:none}.target-marker{top:-6px;height:0;width:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--primary-text-color);background:none;transform:translateX(-4px)}.ruler-labels{position:absolute;top:17px;left:0;right:0;display:flex;justify-content:space-between;font-size:9px;line-height:12px;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}`,
 'scale-inset':`.battery-track{height:12px;border-radius:3px;background:var(--solid-tile)}.battery-fill{border-radius:3px}.battery-track::after{content:'';position:absolute;inset:3px 0;z-index:2;background:repeating-linear-gradient(90deg,var(--ha-card-background) 0 1px,transparent 1px 5%);opacity:.7;pointer-events:none}.target-marker{top:-7px;height:0;width:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--primary-text-color);background:none;transform:translateX(-4px)}`,
 'scale-rail':`.battery-track{height:4px;border-radius:0;background:var(--solid-tile);margin-top:6px;margin-bottom:12px}.battery-fill{border-radius:0}.battery-track::after{content:'';position:absolute;left:0;right:0;top:8px;height:4px;background:repeating-linear-gradient(90deg,var(--secondary-text-color) 0 1px,transparent 1px 5%);opacity:.4;pointer-events:none}.target-marker{top:-5px;height:14px;width:1px}.target-marker::before{content:'';position:absolute;left:50%;top:-3px;width:5px;height:5px;border-radius:50%;background:var(--primary-text-color);transform:translateX(-50%)}`,
 original:'',
 segmented:`.battery-track{height:8px;border-radius:2px;background:var(--solid-tile)}.battery-fill{border-radius:2px}.battery-track::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(5% - 2px),var(--ha-card-background) calc(5% - 2px) 5%);z-index:2;pointer-events:none}.target-marker{top:-4px;height:16px}`,
 capsule:`.battery-track{height:14px;border-radius:12px;background:var(--solid-tile);box-shadow:inset 0 0 0 1px var(--divider-color)}.battery-fill{border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary-color) 80%,#fff),var(--primary-color))}.target-marker{top:-3px;height:20px;width:2px}`,
 scale:`.battery-track{height:5px;margin-bottom:9px;background:var(--solid-tile)}.battery-track::after{content:'';position:absolute;left:0;right:0;top:9px;height:4px;background:repeating-linear-gradient(90deg,var(--secondary-text-color) 0 1px,transparent 1px 10%);opacity:.5;pointer-events:none}.target-marker{top:-6px;height:0;width:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--primary-text-color);background:none;transform:translateX(-4px)}`,
 glow:`.battery-track{height:7px;border-radius:8px;background:var(--solid-tile)}.battery-fill{position:relative;background:linear-gradient(90deg,color-mix(in srgb,var(--primary-color) 60%,var(--ha-card-background)),var(--primary-color));box-shadow:0 0 9px color-mix(in srgb,var(--primary-color) 28%,transparent)}.battery-fill::after{content:'';position:absolute;right:0;top:50%;width:11px;height:11px;transform:translate(50%,-50%);border-radius:50%;background:var(--primary-color);border:2px solid var(--ha-card-background);box-sizing:border-box}.target-marker{top:-3px;height:13px}`
};
const cards=window.evccStory.cards;
for(const card of cards){
 const render=card._render.bind(card);
 card._render=()=>{render();const root=card.shadowRoot;if(!root.querySelector('.car-stage')||root.querySelector('[data-battery-demo]'))return;const style=document.createElement('style');style.dataset.batteryDemo='';style.textContent=shared+variants[card.dataset.bar];root.append(style);if(card.dataset.bar==='scale-ruler'){const labels=document.createElement('div');labels.className='ruler-labels';labels.setAttribute('aria-hidden','true');labels.innerHTML='<span>0</span><span>50</span><span>100 %</span>';root.querySelector('.battery-track').append(labels);}};
 card.setConfig({evcc_enabled:true,...card._config,show_session:true,background:'lanes'});
}
function sync(){
 window.evccStory.sync();
 const state=document.getElementById('visual-state').value,power=Number(document.getElementById('demo-power').value),soc=Number(document.getElementById('demo-soc').value);
 document.getElementById('power-value').textContent=new Intl.NumberFormat('nl').format(power)+' kW';
 document.getElementById('soc-value').textContent=(state==='done'?80:soc)+' %';
 for(const card of cards){
  const states={...card.hass.states};const set=(id,value)=>states[id]={...states[id],state:String(value)};
  set('binary_sensor.demo_connected',state==='disconnected'?'off':'on');set('binary_sensor.demo_charging',state==='charging'?'on':'off');
  set('sensor.demo_soc',state==='done'?80:soc);set('sensor.demo_power',state==='charging'?power:0);set('sensor.demo_current',state==='charging'?power*1000/690:0);set('sensor.demo_remaining_duration',state==='charging'?45:0);
  card.hass={...card.hass,states};card._historyRevision++;card._render();
 }
}
document.getElementById('visual-state').onchange=sync;
for(const id of ['demo-power','demo-soc'])document.getElementById(id).oninput=sync;
document.getElementById('theme').onclick=event=>{const light=document.body.classList.toggle('light');event.currentTarget.textContent=light?'Donker thema':'Licht thema';sync();};
sync();window.evccBattery={cards,sync};
