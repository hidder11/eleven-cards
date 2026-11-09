import {test} from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM bindings only: keep the real setConfig, render and date/range code.
class Node {
 setAttribute(){}
 removeAttribute(){}
 hasAttribute(){return false;}
 addEventListener(){}
 removeEventListener(){}
 querySelector(){return null;}
 querySelectorAll(){return [];}
}
globalThis.window=new Node();
globalThis.document=new Node();
globalThis.HTMLElement=class {
 attachShadow(){
  const tools=new Node(),trigger=new Node(),popup=new Node();
  this.shadowRoot=Object.assign(new Node(),{innerHTML:'',querySelector:selector=>({'.calendar-tools':tools,'[data-info]':trigger,'#calendar-info':popup}[selector]??null)});
 }
};
const {CalendarCard}=await import('../src/calendar-card.js');

for(const view of ['list','columns','month'])test(`${view}: cold configuration renders dates before hass and adopts the later HA day`,t=>{
 // Browser/UTC day differs from HA day, across a month boundary.
 t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-01T00:30:00Z')});
 const card=new CalendarCard();
 t.after(()=>card.disconnectedCallback());
 assert.doesNotThrow(()=>card.setConfig({entities:['calendar.family'],view,days_to_show:3}));
 assert.equal(card._todayKey,'2026-11-01');
 assert.match(card.shadowRoot.innerHTML,/<h2>Calendar<\/h2>/);
 if(view==='list'){
  assert.match(card.shadowRoot.innerHTML,/Today<time datetime="2026-11-01">1 Nov<\/time>/);
  assert.match(card.shadowRoot.innerHTML,/Tomorrow<time datetime="2026-11-02">2 Nov<\/time>/);
 }else if(view==='columns')assert.match(card.shadowRoot.innerHTML,/Sun<time datetime="2026-11-01">1 Nov<\/time>/);
 else assert.match(card.shadowRoot.innerHTML,/<time datetime="2026-11-01" aria-current="date">1<\/time>/);
 card.hass={language:'en',states:{},config:{time_zone:'America/Los_Angeles'}};
 assert.equal(card._todayKey,'2026-10-31');
 assert.equal(card._range().start,new Date(view==='month'?'2026-09-28T07:00:00Z':'2026-10-31T07:00:00Z').getTime());
 if(view==='list'){
  assert.match(card.shadowRoot.innerHTML,/Today<time datetime="2026-10-31">31 Oct<\/time>/);
  assert.match(card.shadowRoot.innerHTML,/Tomorrow<time datetime="2026-11-01">1 Nov<\/time>/);
 }else if(view==='columns')assert.match(card.shadowRoot.innerHTML,/Sat<time datetime="2026-10-31">31 Oct<\/time>/);
 else assert.match(card.shadowRoot.innerHTML,/<time datetime="2026-10-31" aria-current="date">31<\/time>/);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/Invalid Date|NaN/);
});
