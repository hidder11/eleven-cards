"""Offline pixel regression: decoration must never paint graph surfaces.

Run in the Playwright environment used by browser-all-cards-render.py.
BROWSER_EXECUTABLE selects an installed Chromium. No Home Assistant access.
"""
import base64
import importlib.util
import math
import os
import tempfile
from pathlib import Path
import unittest

os.environ.setdefault('ALL_CARDS_RENDER_OUT', str(Path(tempfile.gettempdir()) / 'eleven-background-graph-browser'))
spec = importlib.util.spec_from_file_location('render_helpers', Path(__file__).with_name('browser-all-cards-render.py'))
assert spec is not None and spec.loader is not None
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)

PIXEL_DELTA='''async sources=>{
    const read=async source=>{const image=new Image();image.src='data:image/png;base64,'+source;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
    const [a,b]=await Promise.all(sources.map(read));let max=0,changed=0;
    for(let i=0;i<a.length;i+=4){let d=0;for(let c=0;c<3;c++)d=Math.max(d,Math.abs(a[i+c]-b[i+c]));max=Math.max(max,d);if(d>2)changed++;}
    return {max,changed,pixels:a.length/4,sameSize:a.length===b.length};
}'''


class BackgroundGraphExclusion(unittest.TestCase):
    def test_decoration_leaves_graph_pixels_unchanged(self):
        helpers.AllCardsRender.setUpClass()
        harness = helpers.AllCardsRender()
        context, page = harness.new_page()
        try:
            artifact=os.environ.get('BACKGROUND_GRAPH_ARTIFACT','collection')
            if artifact=='collection':
                harness.load(page, helpers.COLLECTION)
            else:
                bundles=sorted(path for path in (helpers.ROOT/'cards').glob('*/dist/eleven-*.js') if not path.name.endswith('-test.js'))
                self.assertEqual(len(bundles),16)
                for path in bundles:
                    harness.load(page,str(path.relative_to(helpers.ROOT)))
            cards = [('dynamic-energy-price-card','.chart'),('history-graph-card','.chart'),
                     ('bar-chart','.chart'),('timeline-card','.timeline-well'),
                     ('heatmap-card','.matrix-well'),('car-card','.history-chart'),
                     ('appliance-planner','.graph'),('overview-card','.spark')]
            for dark in [False,True]:
                for name,selector in cards:
                    if name=='car-card':
                        page.evaluate("qaConfigs['car-card']={...qaConfigs['car-evcc'],type:'custom:eleven-car-card'}")
                    harness.render(page,name,dark)
                    card=page.locator('eleven-'+name)
                    if name=='car-card':
                        card.locator('[data-ui-tab="session"]').click()
                        card.locator('.history-chart').wait_for(state='visible')
                    if name=='appliance-planner':
                        card.locator('#advice-details summary').click()
                    chart=card.locator(selector).first
                    harness.check(name+' graph exists',chart.count()>0)
                    # Change live geometry, not just re-render with a new size.
                    for width in [360,720]:
                        page.set_viewport_size({'width':width+40,'height':1200})
                        page.evaluate('(w)=>{document.querySelector("#mount").style.width=w+"px";qaCard.style.width=w+"px"}',width)
                        # Native cards legitimately replace SVG/graph DOM in resize RAFs.
                        page.evaluate('async()=>{await document.fonts.ready;for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)}')
                        for coverage in ['header','card']:
                            label=f'{name}-{dark}-{width}-{coverage}'
                            with self.subTest(label=label):
                                page.evaluate('qaCard.setCardBackground(false)')
                                whole_before=card.screenshot(animations='disabled')
                                geometry_before=chart.bounding_box()
                                graph_markup=chart.inner_html()
                                # Isolate background paint from SVG antialias/compositing noise.
                                # Opacity keeps layout and clipping geometry intact. Restore it
                                # before full-card screenshots and check the native graph markup.
                                original_opacity=chart.evaluate("el=>{const value=el.style.opacity;el.style.opacity='0';return value}")
                                before=chart.screenshot(animations='disabled')
                                page.evaluate('''coverage=>qaCard.setCardBackground({enabled:true,variant:'isobars',coverage,height:240,transparency:0,animated:false,colorMode:'custom',colors:['#ffb000']})''',coverage)
                                after=chart.screenshot(animations='disabled')
                                chart.evaluate('(el,value)=>el.style.opacity=value',original_opacity)
                                whole_after=card.screenshot(animations='disabled')
                                metrics=page.evaluate(PIXEL_DELTA,[base64.b64encode(before).decode(),base64.b64encode(after).decode()])
                                graph_equal=metrics['sameSize'] and metrics['changed']==0
                                harness.report.setdefault('pixel_comparisons',[]).append({'case':label,**metrics,'passed':graph_equal})
                                if not graph_equal or (name=='dynamic-energy-price-card' and dark and width==360):
                                    (helpers.OUT/(label+'-before.png')).write_bytes(before)
                                    (helpers.OUT/(label+'-enabled.png')).write_bytes(after)
                                    (helpers.OUT/(label+'-card.png')).write_bytes(whole_after)
                                harness.check(label+' graph pixels unchanged',graph_equal)
                                harness.check(label+' decoration remains visible outside graph',whole_before!=whole_after)
                                harness.check(label+' graph geometry unchanged',geometry_before==chart.bounding_box())
                                harness.check(label+' native graph markup unchanged',graph_markup==chart.inner_html())
                                if name=='dynamic-energy-price-card' and not dark and width==360 and coverage=='header':
                                    # Negative control: bypass the cutout, reproducing the original defect.
                                    page.evaluate("qaCard.shadowRoot.querySelector('[data-ui-card-background]').style.clipPath='none'")
                                    chart.evaluate("el=>el.style.opacity='0'")
                                    unsafe=chart.screenshot(animations='disabled')
                                    chart.evaluate('(el,value)=>el.style.opacity=value',original_opacity)
                                    negative=page.evaluate(PIXEL_DELTA,[base64.b64encode(before).decode(),base64.b64encode(unsafe).decode()])
                                    harness.report['negative_control']=negative
                                    harness.check('pixel tolerance rejects original background bleed',negative['changed']>12)
                                    page.evaluate("qaCard.shadowRoot.querySelector('[data-ui-card-background]').style.removeProperty('clip-path')")
                    # Native rerender replaces graph nodes; clipping must follow them.
                    page.evaluate('''()=>{qaCard.setConfig({...qaConfigs[qaCard.localName.slice(7)],title:'Updated header',card_background:{enabled:true,coverage:'card',animated:false}})}''')
                    if name=='appliance-planner':
                        page.evaluate("qaCard.shadowRoot.querySelector('#advice-details').open=true")
                    page.evaluate('async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)}')
                    harness.check(name+' clip restored after native rerender',page.evaluate("!!qaCard.shadowRoot.querySelector('ha-card').style.getPropertyValue('--ui-background-graph-clip')"))
                    previous_clip=page.evaluate("qaCard.shadowRoot.querySelector('ha-card').style.getPropertyValue('--ui-background-graph-clip')")
                    page.evaluate("()=>{document.querySelector('#mount').style.width='500px';qaCard.style.width='500px'}")
                    page.evaluate('async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)}')
                    harness.check(name+' enabled clip tracks live resize',page.evaluate("qaCard.shadowRoot.querySelector('ha-card').style.getPropertyValue('--ui-background-graph-clip')")!=previous_clip)
            # Scroll moves plot bounds without a ResizeObserver notification.
            for name,selector in [('timeline-card','.chart'),('car-card','.history-chart')]:
                if name=='timeline-card':
                    page.evaluate("()=>{const c=qaConfigs['timeline-card'];c.entities=['switch.heating','binary_sensor.review_evcc_connected'];c.series_options=c.entities.map((entity,i)=>({entity,group:i?'Second group':'First group'}));c.row_gap=40;c.bar_height=40}")
                harness.render(page,name,True)
                card=page.locator('eleven-'+name)
                if name=='car-card':
                    card.locator('[data-ui-tab="session"]').click()
                if name=='timeline-card':
                    harness.check('grouped Timeline panels exist',card.locator('.timeline-panel').count()>=2)
                page.evaluate("selector=>{const c=qaCard.shadowRoot.querySelector('.content'),g=qaCard.shadowRoot.querySelector(selector);c.style.height='120px';c.style.maxHeight='120px';c.style.flex='none';c.style.overflow='auto';c.scrollTop=0;qaCard.setCardBackground({enabled:true,coverage:'card',transparency:0,animated:false,colors:['#ffb000'],colorMode:'custom'});c.scrollTop=Math.max(0,g.getBoundingClientRect().top-c.getBoundingClientRect().top-20)}",selector)
                page.evaluate('async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)}')
                old_clip=page.evaluate("qaCard.shadowRoot.querySelector('ha-card').style.getPropertyValue('--ui-background-graph-clip')")
                scrolled=page.evaluate("()=>{const c=qaCard.shadowRoot.querySelector('.content'),before=c.scrollTop;c.scrollTop=Math.min(before+40,c.scrollHeight-c.clientHeight);return c.scrollTop-before}")
                harness.check(name+' internal scroll fixture moves',scrolled>0)
                page.evaluate('async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)}')
                harness.check(name+' clip follows internal scroll',page.evaluate("qaCard.shadowRoot.querySelector('ha-card').style.getPropertyValue('--ui-background-graph-clip')")!=old_clip)
                plot=card.locator(selector).first
                opacity=plot.evaluate("el=>{const value=el.style.opacity;el.style.opacity='0';return value}")
                clip=page.evaluate('''selector=>{
                    const chart=qaCard.shadowRoot.querySelector(selector).getBoundingClientRect(),content=qaCard.shadowRoot.querySelector('.content').getBoundingClientRect();
                    const x=Math.max(chart.left,content.left),y=Math.max(chart.top,content.top);
                    return {x,y,width:Math.min(chart.right,content.right)-x,height:Math.min(chart.bottom,content.bottom)-y};
                }''',selector)
                harness.check(name+' scrolled graph remains visible',clip['width']>20 and clip['height']>20)
                enabled=page.screenshot(clip=clip,animations='disabled')
                page.evaluate('qaCard.setCardBackground(false)')
                disabled=page.screenshot(clip=clip,animations='disabled')
                plot.evaluate('(el,value)=>el.style.opacity=value',opacity)
                delta=page.evaluate(PIXEL_DELTA,[base64.b64encode(disabled).decode(),base64.b64encode(enabled).decode()])
                harness.check(name+' scrolled graph excludes decoration',delta['changed']==0)
            # Oversized header plus CSS zoom/ancestor transform keeps CSS-space cutouts.
            harness.render(page,'dynamic-energy-price-card',True)
            card=page.locator('eleven-dynamic-energy-price-card')
            chart=card.locator('.chart')
            for zoom in [0.8,1.25]:
                page.evaluate("zoom=>{qaCard.style.zoom=zoom;qaCard.style.transform='scale(0.9)';qaCard.style.transformOrigin='top left'}",zoom)
                page.evaluate('async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)}')
                page.evaluate('qaCard.setCardBackground(false)')
                opacity=chart.evaluate("el=>{const value=el.style.opacity;el.style.opacity='0';return value}")
                bounds=chart.bounding_box()
                # Locator screenshots round outward and include pixels outside a
                # fractionally transformed chart. Compare only whole interior pixels.
                x,y=math.ceil(bounds['x']),math.ceil(bounds['y'])
                crop={'x':x,'y':y,'width':math.floor(bounds['x']+bounds['width'])-x,'height':math.floor(bounds['y']+bounds['height'])-y}
                disabled=page.screenshot(clip=crop,animations='disabled')
                page.evaluate("qaCard.setCardBackground({enabled:true,coverage:'header',height:2000,transparency:0,animated:false,colors:['#ffb000'],colorMode:'custom'})")
                enabled=page.screenshot(clip=crop,animations='disabled')
                chart.evaluate('(el,value)=>el.style.opacity=value',opacity)
                delta=page.evaluate(PIXEL_DELTA,[base64.b64encode(disabled).decode(),base64.b64encode(enabled).decode()])
                harness.check('oversized header graph excluded at zoom '+str(zoom),delta['changed']==0)
            lifecycle=page.evaluate('''async()=>{
                const card=qaCard,old=card._elevenBackgroundResize;
                card.remove();const disconnected=card._elevenBackgroundResize===null;
                document.querySelector('#mount').append(card);
                for(let i=0;i<4;i++)await new Promise(requestAnimationFrame);
                return {disconnected,reconnected:!!card._elevenBackgroundResize&&card._elevenBackgroundResize!==old,clip:!!card.shadowRoot.querySelector('ha-card').style.getPropertyValue('--ui-background-graph-clip')};
            }''')
            for key,value in lifecycle.items():
                harness.check('graph clipping observer '+key,value)
            harness.check('no JavaScript errors',harness.report['page_errors']==[])
            harness.check('no console errors',harness.report['console_errors']==[])
            harness.check('no external requests',harness.report['blocked_requests']==[])
            harness.check('no physical service calls',page.evaluate("qaCalls.every(c=>c.method!=='callService')"))
        finally:
            context.close()
            helpers.AllCardsRender.tearDownClass()


if __name__ == '__main__':
    unittest.main(verbosity=2)
