"""Offline Chromium audit: every production card, update bursts and teardown.

Reuses the all-card render/migration suite, and its synthetic HA/assets only.
QA_SCREENSHOTS=0 disables that suite's optional captures. No HA deployment.
"""
import importlib.util
import json
import os
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('all_cards_render', Path(__file__).with_name('browser-all-cards-render.py'))
BASE = importlib.util.module_from_spec(spec)
spec.loader.exec_module(BASE)
if os.environ.get('ELEVEN_AUDIT_ROOT'):
    BASE.ROOT = Path(os.environ['ELEVEN_AUDIT_ROOT'])


class PerformanceStabilityAudit(BASE.AllCardsRender):
    def test_04_update_bursts_reconnects_and_resource_cleanup(self):
        context, page = self.new_page()
        try:
            page.evaluate('''()=>{
              const timeouts=new Set(),intervals=new Set(),frames=new Set(),observers=new Set(),listeners=[];
              const timeout=window.setTimeout,interval=window.setInterval,clearT=window.clearTimeout,clearI=window.clearInterval,raf=window.requestAnimationFrame,caf=window.cancelAnimationFrame;
              window.setTimeout=(fn,ms,...args)=>{let id=timeout(()=>{timeouts.delete(id);fn(...args);},ms);timeouts.add(id);return id;};
              window.clearTimeout=id=>{timeouts.delete(id);intervals.delete(id);clearT(id);};
              window.setInterval=(fn,ms,...args)=>{const id=interval(fn,ms,...args);intervals.add(id);return id;};
              window.clearInterval=id=>{intervals.delete(id);timeouts.delete(id);clearI(id);};
              window.requestAnimationFrame=fn=>{let id=raf(t=>{frames.delete(id);fn(t);});frames.add(id);return id;};
              window.cancelAnimationFrame=id=>{frames.delete(id);caf(id);};
              for(const name of ['ResizeObserver','MutationObserver','IntersectionObserver']){const Native=window[name];window[name]=class extends Native{observe(...args){observers.add(this);return super.observe(...args);}disconnect(){observers.delete(this);return super.disconnect();}};}
              for(const target of [window,document]){const add=target.addEventListener,remove=target.removeEventListener,capture=o=>typeof o==='boolean'?o:!!o?.capture;
                target.addEventListener=function(type,fn,options){if(!listeners.some(x=>x.target===this&&x.type===type&&x.fn===fn&&x.capture===capture(options)))listeners.push({target:this,type,fn,capture:capture(options)});return add.call(this,type,fn,options);};
                target.removeEventListener=function(type,fn,options){const i=listeners.findIndex(x=>x.target===this&&x.type===type&&x.fn===fn&&x.capture===capture(options));if(i>=0)listeners.splice(i,1);return remove.call(this,type,fn,options);};
              }
              window.qaResources=()=>({timeouts:timeouts.size,intervals:intervals.size,frames:frames.size,observers:observers.size,listeners:listeners.length});
            }''')
            self.load(page, BASE.COLLECTION)
            baseline = page.evaluate('qaResources()')
            metrics = []
            for name in BASE.CARDS + ['car-evcc']:
                with self.subTest(card=name):
                    result = page.evaluate('''async name=>{
                      const type=name==='car-evcc'?'car-card':name;
                      await qaMount(type);
                      if(name==='car-evcc')qaCard.setConfig({...qaConfigs[name],type:'custom:eleven-car-card'});
                      await new Promise(r=>setTimeout(r,250));
                      const h=qaCard.hass??qaCard._hass,config=structuredClone(qaConfigs[name]),before=qaCalls.length;
                      const first=qaCard.shadowRoot.querySelector('ha-card'),start=performance.now();
                      for(let i=0;i<200;i++)qaCard.hass={...h,states:{...h.states,'sensor.audit_unrelated':{state:String(i),attributes:{}}}};
                      const elapsed=performance.now()-start,samePanel=first===qaCard.shadowRoot.querySelector('ha-card');
                      await new Promise(r=>setTimeout(r,50));
                      const extraCalls=qaCalls.length-before;
                      for(let i=0;i<3;i++){qaCard.remove();document.querySelector('#mount').append(qaCard);await new Promise(r=>setTimeout(r,30));}
                      qaCard.remove();qaEditor.remove();
                      await new Promise(r=>setTimeout(r,100));
                      return {name,updates:200,elapsed_ms:Math.round(elapsed*100)/100,samePanel,extraCalls,resources:qaResources()};
                    }''', name)
                    metrics.append(result)
                    self.assertEqual(result['resources'], baseline, json.dumps(result))
                    self.assertEqual(result['extraCalls'], 0, json.dumps(result))
                    if name == 'room-card':
                        self.assertTrue(result['samePanel'], 'Unrelated updates replaced Room DOM')
            self.report['performance_stability'] = metrics
            self.assertEqual(self.report['page_errors'], [])
            self.assertEqual(self.report['console_errors'], [])
            print(json.dumps(metrics, indent=2))
        finally:
            context.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
