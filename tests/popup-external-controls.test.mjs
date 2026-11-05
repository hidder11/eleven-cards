import test from 'node:test';
import assert from 'node:assert/strict';
import {bindUIPopup} from '../shared/ui-popup.js';

for(const native of [true,false])test(`${native?'native manual':'fallback'} popup preserves allowed card controls and dismisses other outside clicks`,t=>{
 const listeners=new Map(),target=()=>({addEventListener(type,fn){listeners.set(this+type,fn);},removeEventListener(){}});
 const previous={window:globalThis.window,document:globalThis.document};
 globalThis.window={...target(),innerWidth:800,innerHeight:600};
 globalThis.document={addEventListener(type,fn){if(type==='pointerdown')listeners.set('outside',fn);},removeEventListener(){}};
 t.after(()=>Object.assign(globalThis,previous));
 let visible=false;
 const trigger={setAttribute(){},getBoundingClientRect:()=>({left:100,right:180,top:200,bottom:240,width:80,height:40})};
 const popup={...target(),style:{},getAttribute:()=> 'manual',querySelector:()=>null,getBoundingClientRect:()=>({height:400}),matches:()=>visible,hasAttribute:()=>visible,setAttribute(){visible=true;},removeAttribute(){visible=false;}};
 if(native){popup.showPopover=()=>{visible=true;};popup.hidePopover=()=>{visible=false;};}
 const control={},controller=bindUIPopup({trigger,popup,topBoundary:()=>220,keepOpenOnOutside:event=>event.composedPath().includes(control)});
 controller.open(false);assert.equal(visible,true);
 assert.equal(popup.style.top,'220px','details stay below the card toolbar');
 assert.equal(popup.style.maxHeight,'372px');
 listeners.get('outside')({composedPath:()=>[control]});assert.equal(visible,true);
 listeners.get('outside')({composedPath:()=>[popup]});assert.equal(visible,true);
 listeners.get('outside')({composedPath:()=>[]});assert.equal(visible,false);
 controller.disconnect();
});
