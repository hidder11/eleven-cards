"""Local synthetic fixture; native CDP touch, not real-phone verification.
Run with a Python environment containing Playwright. CHROME overrides Chromium.
TOUCH_CARDS=history or timeline narrows the RED/GREEN tracer bullet.
"""
import json, os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = pathlib.Path(os.environ.get('TOUCH_OUT', '/opt/data/cache/scratch/eleven-touch-drag'))
OUT.mkdir(parents=True, exist_ok=True)
CHROME = os.environ.get('CHROME', os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH'))
CARDS = os.environ.get('TOUCH_CARDS', 'history,timeline').split(',')
FIXTURE = """() => {
 customElements.define('ha-card',class extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this.updateComplete=new Promise(resolve=>setTimeout(()=>{this.shadowRoot.innerHTML='<slot></slot>';resolve();},10));}
 });
 const end=Date.now(),start=end-86400000;
 window.cards={}; window.touchLog=[];
 for(const [key,tag,id] of [['history','eleven-history-graph-card','sensor.test'],['timeline','eleven-timeline-card','switch.test']]){
  const card=document.createElement(tag);card.setConfig({entities:[id],title:key,show_navigation:false});
  card.hass={locale:{language:'en'},config:{time_zone:'UTC'},states:{[id]:{state:'1',attributes:{friendly_name:key,unit_of_measurement:key==='history'?'°C':undefined}}},callApi:async()=>[Array.from({length:8},(_,i)=>({entity_id:id,state:key==='history'?String(10+i):i%2?'on':'off',last_changed:new Date(start+i*10800000).toISOString()}))]};
  for(const type of ['pointerdown','pointermove'])card.addEventListener(type,e=>card._testX=e.clientX,true);
  document.querySelector('#cards').append(card);cards[key]=card;
 }
 window.refreshCard=key=>{const c=cards[key],id=c._config.entities[0],state=c._hass.states[id];c._testUpdate=(c._testUpdate||0)+1;c.hass={...c._hass,states:{...c._hass.states,[id]:{...state,attributes:{...state.attributes,friendly_name:key+' '+c._testUpdate}}}};};
 window.snap=key=>{const c=cards[key],q=s=>c.shadowRoot.querySelector(s),r=q('.chart').getBoundingClientRect(),p=(q('.plot')||q('.chart')).getBoundingClientRect(),t=q('.tooltip'),b=t.getBoundingClientRect();return {pointerX:c._testX,cursor:c._cursor,pinned:c._pinned,hidden:t.hidden,guide:parseFloat(q('.guide').style.left),start:c._viewStart,end:c._viewEnd,viewport:c._viewport,scroll:scrollY,height:r.height,box:{x:p.x,y:p.y,width:p.width,height:p.height},tooltip:{x:b.x,right:b.right,width:b.width}};};
}"""

def touch(client, kind, x=None, y=None):
    client.send('Input.dispatchTouchEvent', {'type':kind,'touchPoints':[] if x is None else [{'x':x,'y':y,'id':1}]})

def close(a,b,tolerance=2.0):
    return abs(a-b)<=tolerance

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROME,args=['--no-sandbox'])
    results=[]
    for width in [390,320]:
      for key in CARDS:
        context=browser.new_context(viewport={'width':width,'height':850},has_touch=True,is_mobile=True)
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font:14px Arial;background:#f4f5f7;--ha-card-background:#fff;--primary-text-color:#20252b;--secondary-text-color:#666;--divider-color:#ddd;--primary-color:#2196f3}#cards{padding-top:180px}eleven-history-graph-card{display:block;height:320px}eleven-timeline-card{display:block;margin-top:20px}.spacer{height:1600px}</style><div id="cards"></div><div class="spacer"></div>')
        for slug in ['history-graph-card','timeline-card']:
            page.add_script_tag(content=(ROOT/f'cards/{slug}/dist/eleven-{slug}.js').read_text())
        page.evaluate(FIXTURE)
        page.wait_for_function("Object.values(cards).every(c=>c._status==='ready')")
        page.evaluate("async()=>{await Promise.all(Object.values(cards).map(c=>c.shadowRoot.querySelector('ha-card').updateComplete));scrollTo(0,150)}")
        page.wait_for_timeout(150)
        client=context.new_cdp_session(page)
        def snap(): return page.evaluate('snap',key)
        def hide(): page.evaluate("()=>Object.values(cards).forEach(c=>c._hideTooltip())")
        hide();before=snap();box=before['box'];y=box['y']+box['height']*.6
        # Avoid tooltip interception at start; native implicit capture must keep moves working.
        x=box['x']+box['width']*.16
        touch(client,'touchStart',x,y);first=snap()
        assert not first['hidden'],(key,'touchStart hidden',first)
        moves=[];current=first
        if key=='timeline':page.evaluate("()=>cards.timeline._testActiveChart=cards.timeline.shadowRoot.querySelector('.chart')")
        for ratio in [.35,.61,.83,.55]*(4 if key=='timeline' else 1):
            if key=='timeline':
                # Sustained native drag with repeated metadata updates that require rendering.
                page.evaluate("async()=>{const c=cards.timeline;refreshCard('timeline');await c.shadowRoot.querySelector('ha-card').updateComplete;}")
                page.wait_for_timeout(150)
            x=box['x']+box['width']*ratio
            touch(client,'touchMove',x,y);page.wait_for_timeout(25)
            current=snap();expected=current['start']+(current['pointerX']-box['x'])/box['width']*(current['end']-current['start'])
            assert current['cursor'] is not None and close(current['cursor'],expected), (key,width,'finger move must follow exact timestamp',current,expected,first)
            assert not current['hidden'] and current['pinned'] and current['viewport'] is None
            assert close(current['scroll'],before['scroll']) and close(current['height'],before['height'],.1)
            assert current['tooltip']['x']>=0 and current['tooltip']['right']<=width+.5
            receiver='timeline' if key=='history' else 'history'
            assert close(page.evaluate('snap',receiver)['cursor'],current['cursor']), 'sync must publish each move'
            moves.append({'pointerX':current['pointerX'],'expected_timestamp':expected,'actual_timestamp':current['cursor'],'guide':current['guide']})
        touch(client,'touchEnd');page.wait_for_timeout(100);ended=snap()
        assert close(ended['cursor'],current['cursor']) and ended['pinned'] and not ended['hidden'], ('release/focus must preserve exact timestamp',ended,current)
        if key=='timeline':
            assert page.evaluate("()=>{const c=cards.timeline;return c._touchPointer==null&&!c._touchRenderPending&&c._testActiveChart!==c.shadowRoot.querySelector('.chart')}"),'release must flush queued render'
        page.evaluate("async key=>{const c=cards[key];refreshCard(key);await c.shadowRoot.querySelector('ha-card').updateComplete;}",key)
        page.wait_for_timeout(40);restored=snap()
        assert close(restored['cursor'],ended['cursor']) and close(restored['guide'],ended['guide'],.1) and not restored['hidden'],('hass rerender',restored,ended)
        page.screenshot(path=str(OUT/f'{key}-{width}-drag.png'))
        touch(client,'touchStart',2,2);touch(client,'touchEnd');assert snap()['hidden'],'outside touch dismissal'
        # A tap pins and mouse hover afterwards must not move it.
        touch(client,'touchStart',box['x']+box['width']*.47,y);touch(client,'touchEnd');page.wait_for_timeout(50)
        tapped=snap();assert not tapped['hidden'] and tapped['pinned']
        expected=tapped['start']+(tapped['pointerX']-box['x'])/box['width']*(tapped['end']-tapped['start'])
        assert close(tapped['cursor'],expected),('native tap focus must not snap to segment start',tapped,expected)
        page.mouse.move(box['x']+box['width']*.9,y);assert snap()['cursor']==tapped['cursor']
        chart=page.locator('eleven-'+('history-graph-card' if key=='history' else 'timeline-card')+' .chart')
        chart.focus();page.keyboard.press('End');assert snap()['cursor']==snap()['end']
        page.keyboard.press('Escape');assert snap()['hidden']
        # Desktop drag selection remains separate from touch scrubbing.
        page.mouse.move(box['x']+box['width']*.2,y);page.mouse.down();page.mouse.move(box['x']+box['width']*.7,y,steps=8);page.mouse.up()
        assert snap()['viewport'] is not None,'mouse drag zoom'
        page.evaluate("async key=>{cards[key]._zoom(0);await cards[key].shadowRoot.querySelector('ha-card').updateComplete}",key)
        page.wait_for_timeout(30);box=snap()['box'];y=box['y']+box['height']*.6
        # Vertical native gesture must scroll and cancel hover, never zoom.
        touch(client,'touchStart',box['x']+box['width']*.3,y)
        if key=='timeline':
            page.evaluate("()=>{const c=cards.timeline;c._testActiveChart=c.shadowRoot.querySelector('.chart');refreshCard('timeline')}")
        for dy in [10,30,65,110]:
            touch(client,'touchMove',box['x']+box['width']*.3,y-dy);page.wait_for_timeout(25)
        touch(client,'touchEnd');page.wait_for_timeout(250)
        after=snap();assert after['scroll']>before['scroll']+20,('vertical scrolling',before,after)
        assert after['hidden'] and after['viewport'] is None,('scroll dismissal',after)
        if key=='timeline':
            assert page.evaluate("()=>{const c=cards.timeline;return c._touchPointer==null&&!c._touchRenderPending&&c._testActiveChart!==c.shadowRoot.querySelector('.chart')}"),'scroll cancellation must flush queued render'
            # Return to chart, then recover from explicit cancellation and removal.
            page.evaluate('scrollTo(0,150)');page.wait_for_timeout(50)
            box=snap()['box'];y=box['y']+box['height']*.6
            touch(client,'touchStart',box['x']+box['width']*.3,y)
            page.evaluate("()=>{const c=cards.timeline;refreshCard('timeline')}")
            touch(client,'touchCancel');page.wait_for_timeout(50)
            assert snap()['hidden']
            assert page.evaluate("()=>cards.timeline._touchPointer==null&&!cards.timeline._touchRenderPending")
            touch(client,'touchStart',box['x']+box['width']*.3,y)
            page.evaluate("()=>{const c=cards.timeline;refreshCard('timeline');c.remove();document.querySelector('#cards').append(c)}")
            touch(client,'touchEnd');page.wait_for_timeout(100)
            assert page.evaluate("()=>cards.timeline._touchPointer==null&&!cards.timeline._touchRenderPending&&cards.timeline._status==='ready'")
        assert not errors,errors
        results.append({'card':key,'width':width,'native_touch_drag':True,'exact_release_and_focus':True,'hass_rerender':True,'sync_each_move':True,'tap_pin':True,'outside_dismiss':True,'keyboard':True,'desktop_zoom':True,'vertical_scroll':True,'scroll_before':before['scroll'],'scroll_after':after['scroll'],'moves':moves,'errors':errors})
        print('PASS',json.dumps(results[-1]),flush=True)
        context.close()
    (OUT/'verified.json').write_text(json.dumps({'provenance':'Local standalone bundles, synthetic data, emulated native CDP touch; not a real phone','browser':browser.version,'results':results},indent=2))
    browser.close()
