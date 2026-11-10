// Synthetic replacement for the native HA alarm-panel card, only used by QA pages.
export function alarmFixture(config){
 const card=document.createElement('section');card.config=config;card.dataset.alarmFixture='';
 card.style.cssText='padding:16px;font:12px/1.5 system-ui;color:var(--primary-text-color)';
 let hass;
 Object.defineProperty(card,'hass',{set(value){
  hass=value;const state=value.states?.[config.entity]?.state;
  card.replaceChildren();const header=document.createElement('div');header.style.cssText='display:flex;justify-content:space-between;gap:12px;margin-bottom:12px';
  const title=document.createElement('strong');title.textContent='Alarm';const status=document.createElement('span');status.textContent=state==='disarmed'?'Uitgeschakeld':state==='armed_home'?'Thuis ingeschakeld':state==='armed_away'?'Afwezig ingeschakeld':'Onbekend';header.append(title,status);card.append(header);
  const buttons=document.createElement('div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
  for(const [label,next] of state==='disarmed'?[['Thuis inschakelen','armed_home'],['Afwezig inschakelen','armed_away']]:[['Uitschakelen','disarmed']]){
   const button=document.createElement('button');button.textContent=label;button.style.cssText='font:inherit;min-height:36px;border:0;border-radius:6px;padding:8px 12px;background:var(--primary-color);color:var(--ha-card-background);cursor:pointer';
   button.disabled=['unavailable','unknown'].includes(state)||hass.connected===false;
   button.onclick=()=>card.dispatchEvent(new CustomEvent('qa-alarm-change',{detail:{entity:config.entity,state:next},bubbles:true,composed:true}));buttons.append(button);
  }
  card.append(buttons);
 }});
 return card;
}
