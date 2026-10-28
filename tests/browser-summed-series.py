"""Offline synthetic browser QA. ha-form is a stub, not native HA integration."""
import argparse
import json
import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--cards', default='history-graph,bar-chart,heatmap')
parser.add_argument('--output', default=str(Path(tempfile.gettempdir()) / 'eleven-sum-browser'))
args = parser.parse_args()
NAMES = {'history-graph':'eleven-history-graph-card','bar-chart':'eleven-bar-chart','heatmap':'eleven-heatmap-card'}
selected = [NAMES[key] for key in args.cards.split(',')]
output = Path(args.output)
output.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH'))
    try:
        for width in (1280, 390, 320):
            for dark in (False, True):
                page = browser.new_page(viewport={'width':width,'height':1200}, reduced_motion='reduce')
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.set_content('''<!doctype html><style>body{margin:12px;font:14px Arial;background:var(--primary-background-color)} main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,430px),1fr));gap:16px}main>*{height:330px;min-width:0;display:block}ha-card{display:block;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px}</style><main></main>''')
                page.add_script_tag(content="customElements.define('ha-form',class extends HTMLElement {});")
                page.add_script_tag(path=str(ROOT / 'dist/eleven-cards.js'))
                page.evaluate('''({names,dark})=>{
                  const vars=dark?{'primary-background-color':'#101114','card-background-color':'#202127','primary-text-color':'#eeeeee','secondary-text-color':'#aaaaaa','divider-color':'#444650','secondary-background-color':'#303138'}:{'primary-background-color':'#f3f4f6','card-background-color':'#ffffff','primary-text-color':'#20252b','secondary-text-color':'#676b73','divider-color':'#dddddd','secondary-background-color':'#f0f1f3'};
                  for(const [name,value] of Object.entries(vars))document.body.style.setProperty('--'+name,value);
                  document.body.style.setProperty('--primary-color','#2196f3');
                  const end=Date.now(),start=end-24*3600000;
                  window.sumStart=start;window.sumEnd=end;
                  const row=(id,h,v)=>({entity_id:id,last_updated:new Date(start+h*3600000).toISOString(),state:String(v),attributes:{unit_of_measurement:'W'}});
                  window.fixtureHass={language:'en',locale:{language:'en'},config:{time_zone:'UTC'},themes:{darkMode:dark},states:Object.fromEntries(['a','b'].map(id=>['sensor.'+id,{entity_id:'sensor.'+id,state:id==='a'?'150':'35',attributes:{friendly_name:id==='a'?'Kitchen':'Office',unit_of_measurement:'W'}}])),callWS:async()=>{throw Error('Synthetic history-only fixture');},callApi:async()=>[[row('sensor.a',0,100),row('sensor.a',4,150),row('sensor.a',10,'unavailable'),row('sensor.a',12,150)],[row('sensor.b',0,25),row('sensor.b',6,35)]]};
                  window.sumCards=names.map(name=>{const card=document.createElement(name);card.setConfig(name==='eleven-heatmap-card'?{type:'custom:'+name,entity:'sensor.a',sum_entities:['sensor.b'],name:'Total power',title:'Heatmap · Total',hours_to_show:24}:{type:'custom:'+name,entities:['sensor.a'],series_options:[{entity:'sensor.a',sum_entities:['sensor.b'],name:'Total power',color:'#2196f3'}],hours_to_show:24,data_source:'history',title:(name.includes('bar')?'Bar':'Graph')+' · Total'});card.hass=window.fixtureHass;document.querySelector('main').append(card);return card;});
                }''', {'names':selected,'dark':dark})
                page.wait_for_function("sumCards.every(c=>c._status==='ready')")
                summary = page.evaluate('''()=>sumCards.map(c=>{
                  const root=c.shadowRoot;
                  if(c._series){
                    if(c._series.length!==1)throw Error('Expected one total series');
                    const values=c._series[0].points.map(p=>p.v).filter(Number.isFinite);
                    if(!values.includes(125)||!values.includes(185))throw Error('Wrong summed values: '+values);
                    if(!c._rawSeries[0].points.some(p=>p.v===null))throw Error('Missing gap');
                    if(root.querySelectorAll('[data-series="sensor.a"]').length!==1)throw Error('Expected one legend entry');
                  }else{
                    const values=c._rows.flatMap(r=>r.cells).map(cell=>cell.value).filter(Number.isFinite);
                    if(!values.some(v=>Math.abs(v-125)<1e-8)||!values.some(v=>Math.abs(v-185)<1e-8))throw Error('Wrong heatmap totals');
                  }
                  const box=c.getBoundingClientRect();if(box.right>innerWidth+1)throw Error('Horizontal overflow');
                  return {type:c.localName,status:c._status,width:box.width};
                })''')
                for index, name in enumerate(selected):
                    page.evaluate('(i)=>sumCards[i].scrollIntoView({block:"center"})', index)
                    page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                    if name == 'eleven-heatmap-card':
                        page.evaluate('''(i)=>{const c=sumCards[i];const cell=c._rows.flatMap(r=>r.cells).find(x=>x.value!=null);window.sumTooltipKey=cell.key;c.shadowRoot.querySelector(`[data-cell="${cell.key}"]`).scrollIntoView({block:'nearest',inline:'center'});}''', index)
                        page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                        page.evaluate('(i)=>sumCards[i]._showTooltip(sumTooltipKey)', index)
                    else:
                        page.evaluate('(i)=>{const c=sumCards[i];c._showTooltip(sumStart+3600000)}', index)
                    tooltip = page.evaluate('(i)=>{const t=sumCards[i].shadowRoot.querySelector(".tooltip");return {hidden:t.hidden,text:t.textContent}}', index)
                    assert not tooltip['hidden'], {'card':name,'width':width,'dark':dark,**tooltip}
                    if name != 'eleven-heatmap-card':
                        assert '125' in tooltip['text'] and 'Total power' in tooltip['text'], tooltip
                    page.evaluate('(i)=>sumCards[i]._hideTooltip()', index)
                image = output / f'sum-{width}-{"dark" if dark else "light"}.png'
                page.screenshot(path=str(image), full_page=True)
                # Real editor objects and frozen feedback; native controls are stubbed.
                edits = page.evaluate('''async()=>{
                  const out=[];
                  const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
                  for(const card of sumCards){
                    const editor=await card.constructor.getConfigElement();editor.setConfig(freeze(structuredClone(card._config)));editor.hass=fixtureHass;document.body.append(editor);
                    let saved;editor.addEventListener('config-changed',e=>{saved=e.detail.config;editor.setConfig(freeze(structuredClone(saved)));});
                    const form=editor.shadowRoot.querySelector('.sensor-form')??editor.shadowRoot.querySelector('ha-form');
                    if(!form.schema.some(s=>s.name==='sum_entities'))throw Error('Missing multi-sensor selector');
                    form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...form.data,sum_entities:['sensor.b'],name:'Renamed total'}},bubbles:true,composed:true}));
                    const option=saved.series_options?.[0]??saved;
                    if(option.name!=='Renamed total'||option.sum_entities.join()!=='sensor.b')throw Error('Editor lost sum');
                    const reopened=await card.constructor.getConfigElement();reopened.setConfig(freeze(structuredClone(saved)));reopened.hass=fixtureHass;
                    out.push({type:card.localName,saved:true});editor.remove();
                  }return out;
                }''')
                # Both units change together: discard old-unit values, not just mismatched contributors.
                page.evaluate('''()=>{
                  const old=fixtureHass;
                  const states=Object.fromEntries(Object.entries(old.states).map(([id,s])=>[id,{...s,attributes:{...s.attributes,unit_of_measurement:'kW'}}]));
                  window.unitHass={...old,states,callApi:async()=>{
                    const data=await old.callApi();return data.map(rows=>rows.map(row=>({...row,state:Number.isFinite(Number(row.state))?String(Number(row.state)/1000):row.state,attributes:{...row.attributes,unit_of_measurement:'kW'}})));
                  }};
                  sumCards.forEach(c=>{c.hass=unitHass;});
                }''')
                page.wait_for_function("sumCards.every(c=>c._status==='ready')")
                unit_checks=page.evaluate('''()=>sumCards.map(c=>{
                  const values=c._series?c._series[0].points.map(p=>p.v):c._rows.flatMap(r=>r.cells).map(cell=>cell.value);
                  const finite=values.filter(Number.isFinite);
                  if(!finite.some(v=>Math.abs(v-0.185)<1e-8)||finite.some(v=>v>1))throw Error('Stale old-unit sum: '+finite);
                  return {type:c.localName,unit:'kW',staleValues:false};
                })''')
                assert errors == [], errors
                results.append({'width':width,'dark':dark,'cards':summary,'editors':edits,'unitChanges':unit_checks,'screenshot':str(image)})
                page.close()
        (output / 'report.json').write_text(json.dumps({'provenance':'synthetic offline; ha-form stub; not native HA integration','cases':results},indent=2))
        print(json.dumps({'passed':True,'cases':len(results),'cards':selected,'report':str(output/'report.json')}))
    finally:
        browser.close()
