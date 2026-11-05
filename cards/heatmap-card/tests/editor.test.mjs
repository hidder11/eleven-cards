import {test} from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement=class extends EventTarget {
  attachShadow(){
    const form=new EventTarget(),error={hidden:true,textContent:''};
    this.shadowRoot={innerHTML:'',querySelector:selector=>selector==='ha-form'?form:selector==='.error'?error:null};
  }
};
const {HeatmapEditor}=await import('../src/heatmap-card.js');
const fieldList=schema=>schema.flatMap(s=>s.schema?fieldList(s.schema):[s]);
function editor(config={}){
  const instance=new HeatmapEditor(),changes=[];
  instance.setConfig({entity:'sensor.test',...config});instance.hass={language:'nl'};
  instance.addEventListener('config-changed',event=>changes.push(event.detail.config));
  const form=instance._form;
  const change=patch=>form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,...patch}}}));
  return {instance,form,changes,change,error:instance.shadowRoot.querySelector('.error')};
}

test('the native form emits flat configurations and keeps its identity through edits',()=>{
  const {instance,form,changes,change}=editor({custom_option:'preserved'});
  change({title:'Temperature',show_title:false,cell_width:10,aggregation_period:'day'});
  assert.equal(instance._form,form);assert.equal(changes.length,1);
  assert.equal(changes[0].title,'Temperature');assert.equal(changes[0].show_title,false);assert.equal(changes[0].cell_width,10);
  assert.equal(changes[0].aggregation_period,'day');assert.ok(!('data_processing' in changes[0]));
  assert.equal(changes[0].custom_option,'preserved');assert.ok(!('matrix_settings' in changes[0]));
  assert.equal(form.computeLabel({name:'show_title'}),'Titel tonen');
  instance.hass={language:'en'};assert.equal(instance._form,form);assert.equal(form.computeLabel({name:'show_title'}),'Show title');
  assert.equal(form.schema.find(s=>s.name==='matrix_settings').title,'Grid appearance');
});

test('additional sensor native picker persists immutable drafts and empty roundtrips with localized helpers',()=>{
 const extra=Object.freeze(['sensor.extra']),{instance,form,changes,change,error}=editor(Object.freeze({sum_entities:extra}));
 const field=fieldList(form.schema).find(field=>field.name==='sum_entities');
 assert.deepEqual(field?.selector,{entity:{domain:'sensor',multiple:true}});
 assert.equal(form.computeLabel(field),'Sensoren optellen');assert.match(form.computeHelper(field),/hoofdsensor/);
 assert.match(form.computeHelper(field),/eenheid/);assert.match(form.computeHelper(field),/nul/);
 assert.notEqual(form.data.sum_entities,extra);
 instance.addEventListener('config-changed',event=>{Object.freeze(event.detail.config.sum_entities);instance.setConfig(Object.freeze(event.detail.config));});
 change({sum_entities:['sensor.extra','sensor.more'],name:'Total power'});
 assert.deepEqual(changes.at(-1).sum_entities,['sensor.extra','sensor.more']);assert.equal(form.data.name,'Total power');
 change({sum_entities:['']});assert.equal(error.hidden,false);assert.deepEqual(form.data.sum_entities,['']);
 change({sum_entities:[]});assert.equal(error.hidden,true);assert.deepEqual(changes.at(-1).sum_entities,[]);
 instance.hass={language:'en'};assert.equal(form.computeLabel(field),'Add sensors');assert.match(form.computeHelper(field),/primary/);
 assert.match(form.computeHelper(field),/same unit/);assert.match(form.computeHelper(field),/zero/);
});

test('sensor name is an optional top-level text field',()=>{
  const {form,changes,change}=editor();
  const name=fieldList(form.schema).find(field=>field.name==='name');
  assert.deepEqual(name.selector,{text:{}});
  assert.equal(form.computeLabel(name),'Sensornaam');
  change({name:'Woonkamer'});
  assert.equal(changes.at(-1).name,'Woonkamer');
});

test('switching to stops seeds the exact fractional bounds and retains colors when switching back',()=>{
  const low=Object.freeze([1,2,3]),high=Object.freeze([4,5,6]),{form,changes,change}=editor({scale_min:16,scale_max:16.2,low_color:low,high_color:high});
  change({color_mode:'gradient'});
  assert.deepEqual(changes.at(-1).gradient_stops,[{value:16,color:[1,2,3]},{value:16.2,color:[4,5,6]}]);
  assert.notEqual(changes.at(-1).gradient_stops[0].color,low);
  assert.ok(fieldList(form.schema).some(s=>s.name==='gradient_stops'));
  assert.ok(!fieldList(form.schema).some(s=>s.name==='low_color'));
  change({gradient_mode:'steps'});change({color_mode:'scale'});
  assert.ok(fieldList(form.schema).some(s=>s.name==='low_color'));
  assert.deepEqual(changes.at(-1).low_color,[1,2,3]);assert.equal(changes.at(-1).scale_max,16.2);assert.equal(changes.at(-1).gradient_mode,'steps');
  change({color_mode:'gradient'});assert.equal(changes.at(-1).gradient_stops[1].value,16.2);
});

test('incomplete edits show localized validation, preserve values and recover after correction',()=>{
  const {form,changes,change,error}=editor({scale_min:0,scale_max:100});
  change({scale_min:200});assert.equal(error.hidden,false);assert.match(error.textContent,/Minimum moet kleiner/);assert.equal(form.data.scale_min,200);
  change({scale_max:300});assert.equal(error.hidden,true);assert.equal(changes.at(-1).scale_min,200);
  change({scale_min:undefined,scale_max:undefined});assert.ok(!('scale_min' in changes.at(-1)));assert.ok(!('scale_max' in changes.at(-1)));
  change({color_mode:'gradient'});change({gradient_stops:[{value:0,color:[0,0,0]},{color:[255,255,255]}]});
  assert.equal(error.hidden,false);assert.equal(form.data.gradient_stops[1].value,undefined);
  change({gradient_stops:[{value:0,color:[0,0,0]},{value:100,color:[255,255,255]}]});assert.equal(error.hidden,true);
  change({hours_to_show:undefined,cell_width:undefined});assert.equal(form.data.hours_to_show,undefined);assert.equal(form.data.cell_width,undefined);
  change({hours_to_show:48,cell_width:12});assert.equal(form.data.hours_to_show,48);assert.equal(changes.at(-1).cell_width,12);assert.equal(error.hidden,true);
});
