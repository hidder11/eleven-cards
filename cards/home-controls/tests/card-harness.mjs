import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Minimal DOM boundary for exercising the built artifact, not a browser layout fixture.
export function loadCards(){
 const elements=new Map();
 class Element{
  attachShadow(){return this.shadowRoot={innerHTML:'',activeElement:null,querySelectorAll:()=>[],querySelector:()=>null};}
  dispatchEvent(event){(this.events??=[]).push(event);return true;}
 }
 class FixedDate extends Date{
  constructor(...args){super(...(args.length?args:['2026-10-28T12:00:00Z']));}
  static now(){return Date.parse('2026-10-28T12:00:00Z');}
 }
 const context=vm.createContext({
  HTMLElement:Element,structuredClone,Date:FixedDate,
  CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
  customElements:{get:tag=>elements.get(tag),define:(tag,cls)=>elements.set(tag,cls)},
  document:{createElement:tag=>new (elements.get(tag)||Element)()},
  window:{confirm:()=>{throw Error('Unexpected confirmation');}},
  setInterval:()=>1,clearInterval:()=>{}
 });
 vm.runInContext(readFileSync(new URL('../dist/eleven-home-controls-card.js',import.meta.url),'utf8'),context);
 return {elements,context,create:tag=>new (elements.get(tag))()};
}
