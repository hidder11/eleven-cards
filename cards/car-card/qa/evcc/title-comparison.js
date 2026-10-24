// Compare the current card with an isolated range-position proposal.
import './story-concepts.js';
for(const card of window.evccStory.cards){
 {
  const render=card._render.bind(card);
  card._render=()=>{
   render();const root=card.shadowRoot,header=root.querySelector('.car-stage header'),range=root.querySelector('.range');
   if(!header||!range||root.querySelector('[data-title-comparison]'))return;
   if(card.dataset.layout==='range-right')header.append(range);else root.querySelector('.battery-meta').append(range);
   const style=document.createElement('style');style.dataset.titleComparison='';style.textContent='.car-stage header{flex-direction:column;align-items:flex-end;gap:2px}.car-stage header .range{justify-content:flex-end;text-align:right;max-width:100%}';root.append(style);
  };
 }
 card.setConfig({evcc_enabled:true,...card._config,show_session:true});
}
window.evccStory.sync();
