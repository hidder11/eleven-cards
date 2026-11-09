import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveCardConfiguration} from '../src/dashboard-settings.js';
const previous={type:'custom:eleven-appliance-planner',title:'Original'},next={...previous,title:'Updated'};
function fixture(duplicate=false){let dashboard={views:[{sections:[{cards:[previous,...(duplicate?[previous]:[])]}]}]},writes=0;
 const lovelace={mode:'storage',rawConfig:structuredClone(dashboard),urlPath:'test',saveConfig:async c=>{writes++;dashboard=structuredClone(c);}};
 const hass={user:{is_admin:true},callWS:async()=>structuredClone(dashboard)};
 return {host:{parentNode:{lovelace}},hass,lovelace,getWrites:()=>writes,read:()=>dashboard};
}
test('scoped storage save preserves other config and verifies exact card after save',async()=>{
 const f=fixture();await saveCardConfiguration(f.host,f.hass,previous,next,c=>c);
 assert.equal(f.getWrites(),1);assert.equal(f.read().views[0].sections[0].cards[0].title,'Updated');
});
test('no dashboard write for duplicate cards, non-admin, YAML, or concurrent edits',async()=>{
 for(const kind of ['duplicate','permission','yaml','concurrent']){const f=fixture(kind==='duplicate');
  if(kind==='permission')f.hass.user.is_admin=false;if(kind==='yaml')f.lovelace.mode='yaml';if(kind==='concurrent')f.hass.callWS=async()=>({views:[],title:'concurrent'});
  await assert.rejects(()=>saveCardConfiguration(f.host,f.hass,previous,next,c=>c));assert.equal(f.getWrites(),0);
 }
});
test('save is not success until exact target readback agrees',async()=>{
 const f=fixture();f.lovelace.saveConfig=async()=>{};
 await assert.rejects(()=>saveCardConfiguration(f.host,f.hass,previous,next,c=>c),/bevestigd/);
});
