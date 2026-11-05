"""Rendered review seam, synthetic data only; ephemeral server, no HA.
Run: python3 cards/dynamic-energy-price-card/tests/browser_visual_repairs.py --check collision
Then --check ticks / targets / all. Outputs stay in qa-evidence/energy-visual-repairs.
"""
import argparse
import functools
import http.server
import json
from pathlib import Path
import subprocess
import threading
import yaml
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'qa-evidence/energy-visual-repairs'
CARD = ROOT / 'cards/dynamic-energy-price-card'
parser = argparse.ArgumentParser()
parser.add_argument('--check', choices=['collision', 'ticks', 'targets', 'all'], default='all')
parser.add_argument('--label', default='after')
args = parser.parse_args()
OUT.mkdir(parents=True, exist_ok=True)
# Exercise the real build without writing any shared or generated release bundle.
builder = (CARD / 'scripts/build.mjs').read_text()
builder = builder.replace("const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');", f'const root = {json.dumps(str(CARD))};')
builder = builder.replace("const outputPath = resolve(root, 'dist/eleven-dynamic-energy-price-card.js');", f'const outputPath = {json.dumps(str(OUT / "energy-bundle.js"))};')
(OUT / 'build-evidence.mjs').write_text(builder)
subprocess.run(['node', str(OUT / 'build-evidence.mjs')], check=True)
bundle = (OUT / 'energy-bundle.js').read_text() + '\n;\n' + (ROOT / 'dist/eleven-cards.js').read_text()
THEME = yaml.safe_load((ROOT / 'themes/eleven_material.yaml').read_text())['Eleven Material']
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *unused): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
results, failures, errors = [], [], []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome', args=['--no-sandbox'])
        page = browser.new_page(viewport={'width':390,'height':800}, timezone_id='Europe/Amsterdam', reduced_motion='reduce')
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR:', str(e), flush=True)))
        from datetime import datetime, timezone
        page.clock.install(time=datetime(2026, 10, 30, 21, 30, tzinfo=timezone.utc))
        page.route('**/dist/eleven-cards.js', lambda route: route.fulfill(body=bundle, content_type='application/javascript'))
        page.goto(f'http://127.0.0.1:{server.server_port}/tests/fixtures/theme-following.html')
        page.wait_for_function('window.themeFixtureReady===true')
        page.evaluate("""()=>{for(const a of document.querySelectorAll('article'))if(!a.querySelector('[data-card="dynamic-energy-price-card"]'))a.remove(); document.querySelector('main').style.display='block'; window.energy=records.find(r=>r.name==='dynamic-energy-price-card');}""")
        for width in [320,390,1280]:
            page.set_viewport_size({'width':width,'height':800})
            for material in [False, True]:
                for dark in [False, True]:
                    tokens = {'ha-card-border-radius':'12px','ha-card-border-width':'1px','ha-card-box-shadow':'none','primary-color':'#03a9f4','accent-color':'#ab47bc','error-color':'#db4437','warning-color':'#ffa600', **({'primary-background-color':'#111111','card-background-color':'#1c1c1c','primary-text-color':'#e1e1e1','secondary-text-color':'#9b9b9b','secondary-background-color':'#282828','divider-color':'#424242'} if dark else {'primary-background-color':'#fafafa','card-background-color':'#ffffff','primary-text-color':'#212121','secondary-text-color':'#727272','secondary-background-color':'#f2f2f2','divider-color':'#e0e0e0'})}
                    if material:
                        tokens.update({k:v for k,v in THEME.items() if k!='modes'})
                        tokens.update(THEME['modes']['dark' if dark else 'light'])
                    page.evaluate("""({tokens,dark})=>{for(const k of [...document.body.style])document.body.style.removeProperty(k);for(const [k,v] of Object.entries(tokens))document.body.style.setProperty('--'+k,String(v));energy.card.hass={...energy.hass,themes:{darkMode:dark}};}""", {'tokens':tokens,'dark':dark})
                    page.wait_for_timeout(150)
                    geometry = page.evaluate("""()=>{const r=energy.card.shadowRoot,box=n=>{const b=n.getBoundingClientRect();return {text:n.textContent,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}}, visible=s=>[...r.querySelectorAll(s)].filter(n=>!n.hidden&&n.getBoundingClientRect().width>0).map(box);return {now:visible('.now-label'),references:visible('.level-label,.day-label,.average-label'),ticks:visible('.x-label'),targets:visible('.legend-series'),chart:box(r.querySelector('.chart')),overflow:r.querySelector('ha-card').scrollWidth>r.querySelector('ha-card').clientWidth,paint:[...r.querySelectorAll('.level-line,.price-line,.selection-band')].map(n=>({stroke:getComputedStyle(n).stroke,fill:getComputedStyle(n).fill,d:n.getAttribute('d')}))}}""")
                    case = f'{width}-'+('material' if material else 'native')+'-'+('dark' if dark else 'light')
                    page.locator('[data-card="dynamic-energy-price-card"]').screenshot(path=str(OUT / f'{args.label}-{case}.png'))
                    issues=[]
                    if args.check in ['collision','all']:
                        for a in geometry['now']:
                            for b in geometry['references']:
                                if a['x'] < b['right']+4 and a['right']+4 > b['x'] and a['y'] < b['bottom']+4 and a['bottom']+4 > b['y']:
                                    issues.append('Now/reference collision: '+b['text'])
                    if args.check in ['ticks','all']:
                        for a,b in zip(geometry['ticks'], geometry['ticks'][1:]):
                            if b['x']-a['right'] < 12: issues.append('Time tick gap below 12px')
                        if len(geometry['ticks']) < 2: issues.append('Missing time context')
                    if args.check in ['targets','all']:
                        if any(t['height']<44 or t['width']<44 for t in geometry['targets']): issues.append('Series toggle target below 44px')
                    if geometry['overflow']: issues.append('Card overflow')
                    results.append({'case':case,'geometry':geometry,'issues':issues})
                    failures.extend((case,i) for i in issues)
        # Resize the same nodes without a hass setter: density must recover in
        # both directions, including price-only cards with no consumption axis.
        original_chart = page.evaluate("energy.card.shadowRoot.querySelector('.chart').dataset.resizeProbe='same-node'")
        resize_counts=[]
        for width in [320,1280,320]:
            page.set_viewport_size({'width':width,'height':800})
            page.wait_for_timeout(150)
            probe=page.evaluate("""()=>{const c=energy.card.shadowRoot.querySelector('.chart'), ticks=[...c.querySelectorAll('.x-label')].filter(n=>!n.hidden).map(n=>n.getBoundingClientRect());return {same:c.dataset.resizeProbe==='same-node',count:ticks.length,gaps:ticks.slice(1).map((b,i)=>b.left-ticks[i].right)}}""")
            if args.check=='all':
                assert probe['same'] and all(g>=12 for g in probe['gaps']),probe
            resize_counts.append(probe['count'])
        if args.check=='all': assert resize_counts[1]>resize_counts[0] and resize_counts[0]==resize_counts[2],resize_counts
        # Existing keyboard and toggle behavior must survive geometry changes.
        chart=page.locator('[data-card="dynamic-energy-price-card"]').locator('.chart')
        chart.focus();chart.press('ArrowLeft')
        assert page.locator('[data-card="dynamic-energy-price-card"]').locator('.tooltip:not([hidden])').count()==1
        page.evaluate("energy.card.shadowRoot.querySelector('.legend-series').click()")
        assert page.evaluate("energy.card.shadowRoot.querySelector('.legend-series').getAttribute('aria-pressed')")=='false'
        page.evaluate("energy.card.shadowRoot.querySelector('.legend-series').click()")
        assert page.evaluate("energy.card.shadowRoot.querySelector('.legend-series').getAttribute('aria-pressed')")=='true'
        browser.close()
finally:
    server.shutdown();server.server_close()
(OUT / f'{args.label}-{args.check}-results.json').write_text(json.dumps({'results':results,'failures':failures,'page_errors':errors,'interactions':['keyboard tooltip','series hide/show'],'resize_tick_counts':resize_counts}, indent=2))
print(json.dumps({'cases':len(results),'failures':failures,'page_errors':errors}))
assert not errors, errors
assert not failures, failures
