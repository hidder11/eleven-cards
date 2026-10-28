"""Offline synthetic graph QA: actual local bundles, no HA connections/writes.
GRAPH_OUT controls screenshots/report; CHROME selects an existing Chromium.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('GRAPH_OUT', '/opt/data/cache/scratch/graphs-ready-matrix'))
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get('CHROME', os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH'))
FIXTURE = """async key => {
 customElements.define('ha-card',class extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this.updateComplete=new Promise(resolve=>setTimeout(()=>{this.shadowRoot.innerHTML='<style>:host{display:block;background:var(--ha-card-background);border-radius:12px;height:100%}</style><slot></slot>';resolve();},10));}
 });
 const tags={history:'history-graph-card',bar:'bar-chart',timeline:'timeline-card',energy:'dynamic-energy-price-card'};
 window.card=document.createElement('eleven-'+tags[key]);
 const end=Date.now(),start=end-86400000,midnight=new Date();midnight.setUTCHours(0,0,0,0);
 window.calls=[];
 const config={title:key,show_navigation:false,show_y_grid:true,sync_hover:false,show_grid:false};
 card.setConfig(key==='energy'?{...config,import_source:'tibber',show_cheapest_table:false,show_price_levels:false}: {...config,entities:[key==='timeline'?'switch.test':'sensor.test'],connect_nulls:key==='history'});
 card.hass={locale:{language:'en'},language:'en',config:{time_zone:'UTC',currency:'EUR'},states:{'sensor.test':{state:'17',attributes:{friendly_name:'Temperature',unit_of_measurement:'°C'}},'switch.test':{state:'on',attributes:{friendly_name:'Heating'}}},callApi:async()=>[Array.from({length:24},(_,i)=>({entity_id:key==='timeline'?'switch.test':'sensor.test',state:key==='timeline'?(i%2?'on':'off'):(i===10?'unavailable':String(2+Math.sin(i*.6)*1.8)),last_changed:new Date(start+i*3600000).toISOString()}))],callWS:async msg=>{calls.push(msg);return {response:{prices:{'Demo home':Array.from({length:48},(_,i)=>({start_time:new Date(+midnight+i*3600000).toISOString(),price:.15+Math.sin(i*.4)*.12}))}}};}};
 document.body.append(card);
}"""
MEASURE = """key => {
 const q=s=>card.shadowRoot.querySelector(s), tip=q('.tooltip'),label=q('.tooltip-label'),value=q('.tooltip-value'),grid=[...card.shadowRoot.querySelectorAll('.y-grid-line')];
 const rect=tip.getBoundingClientRect(),chart=q('.chart').getBoundingClientRect();
 return {hidden:tip.hidden,tooltip:{x:rect.x,right:rect.right,width:rect.width},chart:{x:chart.x,right:chart.right},label:label&&getComputedStyle(label).color,value:value&&getComputedStyle(value).color,italic:value&&getComputedStyle(value).fontStyle,grid:grid.map(l=>({stroke:getComputedStyle(l).stroke,width:getComputedStyle(l).strokeWidth,y:l.getAttribute('y1')})),overflow:document.documentElement.scrollWidth>innerWidth,paths:card.shadowRoot.querySelectorAll('path').length,min:card._range?.[0],calls};
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    results = []
    for width in [1280, 390, 320]:
        for dark in [False, True]:
            for key in ['history', 'bar', 'timeline', 'energy']:
                context = browser.new_context(viewport={'width': width, 'height': 800}, reduced_motion='reduce')
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                primary, secondary, divider, surface = ('#eeeeee', '#aaaaaa', '#444444', '#181818') if dark else ('#20252b', '#666666', '#dddddd', '#ffffff')
                secondary_surface = '#303030' if dark else '#eeeeee'
                page.set_content(f'<style>body{{margin:0;padding:12px;font:14px Arial;background:{surface};color:{primary};--secondary-background-color:{secondary_surface};--card-background-color:{surface};--ha-card-background:{surface};--primary-text-color:{primary};--secondary-text-color:{secondary};--divider-color:{divider};--primary-color:#2196f3}}body>eleven-history-graph-card,body>eleven-bar-chart{{display:block;height:350px}}body>eleven-dynamic-energy-price-card{{display:block;height:420px}}body>eleven-timeline-card{{display:block}}</style>')
                page.add_script_tag(path=str(ROOT/'dist/eleven-cards.js'))
                page.add_script_tag(path=str(ROOT/'dist/eleven-cards.js'))
                page.evaluate(FIXTURE, key)
                page.wait_for_function("card._chart || card._status==='ready'")
                page.evaluate("async()=>{await card.shadowRoot.querySelector('ha-card').updateComplete}")
                page.wait_for_timeout(100)
                page.evaluate("key=>key==='energy'?card._showPoint(12,false):card._showTooltip((card._viewStart+card._viewEnd)/2,false)", key)
                actual = page.evaluate(MEASURE, key)
                assert not actual['hidden'] and not actual['overflow'] and actual['paths'] > 0, (key, width, actual)
                assert actual['tooltip']['x'] >= 0 and actual['tooltip']['right'] <= width+.5, (key, width, actual)
                assert actual['label'] == ('rgb(170, 170, 170)' if dark else 'rgb(102, 102, 102)'), actual
                expected_value = ('rgb(243, 244, 246)' if dark else 'rgb(17, 17, 17)') if key in ['history','bar'] else ('rgb(238, 238, 238)' if dark else 'rgb(32, 37, 43)')
                assert actual['value'] == expected_value and actual['italic'] == 'normal', actual
                if key != 'timeline':
                    assert actual['grid'] and all(l['width']=='0.8px' and l['stroke']==('rgb(68, 68, 68)' if dark else 'rgb(221, 221, 221)') for l in actual['grid']), actual
                    assert len({l['y'] for l in actual['grid']}) == len(actual['grid']), actual
                if key in ['history','bar']:
                    assert actual['min'] >= 0, actual
                if key == 'energy':
                    assert len(actual['calls']) == 1 and actual['calls'][0]['domain'] == 'tibber' and actual['calls'][0]['service'] == 'get_prices', actual
                    assert sorted(actual['calls'][0]['service_data']) == ['end','start'], actual
                page.screenshot(path=str(OUT/f'{key}-{width}-{"dark" if dark else "light"}.png'))
                if key != 'timeline':
                    page.evaluate("()=>{card._config.show_y_grid=false;card._render()}")
                    page.evaluate("async()=>{await card.shadowRoot.querySelector('ha-card').updateComplete}")
                    assert page.locator('.y-grid-line').count() == 0
                assert not errors, errors
                results.append({'card':key,'width':width,'dark':dark,'checks':actual,'errors':errors})
                context.close()
    (OUT/'verified.json').write_text(json.dumps({'provenance':'Synthetic data and Tibber API-shaped replay; local combined bundle, not HA integration or native theme QA','browser':browser.version,'results':results},indent=2))
    print(json.dumps({'browser':browser.version,'passed':len(results),'report':str(OUT/'verified.json')}))
    browser.close()
