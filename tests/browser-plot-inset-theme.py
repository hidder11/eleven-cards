"""Synthetic Chromium coverage for theme-owned inset graph surfaces.

Optional ELEVEN_PLOT_THEME_FILE reads a private, read-only captured theme for
local diagnosis. No live configuration is written or included in this test.
"""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

os.environ.setdefault('ALL_CARDS_RENDER_OUT',str(Path(tempfile.gettempdir())/'eleven-plot-inset-browser'))
spec=importlib.util.spec_from_file_location('render_helpers',Path(__file__).with_name('browser-all-cards-render.py'))
assert spec is not None and spec.loader is not None
helpers=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


class PlotInsetTheme(unittest.TestCase):
    def test_graph_wells_follow_existing_theme_inset_and_preserve_overrides(self):
        helpers.AllCardsRender.setUpClass()
        harness=helpers.AllCardsRender()
        context,page=harness.new_page()
        try:
            if os.environ.get('ELEVEN_PLOT_THEME_FILE'):
                legacy=json.loads(Path(os.environ['ELEVEN_PLOT_THEME_FILE']).read_text())
                self.assertNotIn('eleven-material-plot-background',legacy)
            else:
                # Approved public semantic roles, representing the earlier theme contract.
                legacy={'ha-card-border-radius':'22px','eleven-material-radius-well':'15px','modes':{
                    'light':{'card-background-color':'#edf0f6','eleven-material-inset':'#e3e7ef','eleven-material-well':'inset 1px 2px 4px #8490a630,inset -1px -1px 0 #ffffffc0'},
                    'dark':{'card-background-color':'#2c303d','eleven-material-inset':'#262936','eleven-material-well':'inset 1px 2px 4px #08091055,inset -1px -1px 0 #ffffff0b'}}}
            artifact=os.environ.get('PLOT_THEME_ARTIFACT','collection')
            if artifact=='collection':
                harness.load(page,helpers.COLLECTION)
            else:
                for path in sorted(p for p in (helpers.ROOT/'cards').glob('*/dist/eleven-*.js') if not p.name.endswith('-test.js')):
                    harness.load(page,str(path.relative_to(helpers.ROOT)))
            cards=[('dynamic-energy-price-card','.chart'),('history-graph-card','.chart'),('bar-chart','.chart'),
                   ('timeline-card','.timeline-well'),('heatmap-card','.matrix-well'),('car-card','.history-chart'),('appliance-planner','.graph')]
            page.evaluate("qaConfigs['car-card']={...qaConfigs['car-evcc'],type:'custom:eleven-car-card'}")
            initial_style=page.evaluate("document.documentElement.getAttribute('style')||''")
            for dark in [False,True]:
                mode='dark' if dark else 'light'
                material={**{k:v for k,v in legacy.items() if k!='modes'},**legacy['modes'][mode]}
                for name,selector in cards:
                    page.evaluate("style=>document.documentElement.setAttribute('style',style)",initial_style)
                    harness.render(page,name,dark)
                    card=page.locator('eleven-'+name)
                    if name=='car-card':
                        card.locator('[data-ui-tab="session"]').click()
                        card.locator('.history-chart').wait_for(state='visible')
                    if name=='appliance-planner':
                        card.locator('#advice-details summary').click()
                    plot=card.locator(selector).first
                    self.assertTrue(plot.count()>0)
                    page.evaluate('async()=>{for(let i=0;i<3;i++)await new Promise(requestAnimationFrame)}')
                    original=plot.inner_html()
                    bounds=plot.bounding_box()
                    baseline_style=page.evaluate("document.documentElement.getAttribute('style')||''")
                    variants=[('legacy',material,material['eleven-material-inset']),
                              ('modern',{**material,'eleven-material-plot-background':'var(--eleven-material-inset)'},material['eleven-material-inset']),
                              ('override',{**material,'eleven-material-plot-background':'#156a7f'},'#156a7f'),
                              ('transparent',{**material,'eleven-material-plot-background':'transparent'},'transparent'),
                              ('gradient',{**material,'eleven-material-plot-background':'linear-gradient(90deg,#123456,#654321)'},'gradient'),
                              ('native',{},'transparent')]
                    for variant,tokens,expected in variants:
                        label=f'{artifact}-{name}-{mode}-{variant}'
                        with self.subTest(case=label):
                            page.evaluate('''({tokens,baseline})=>{
                                document.documentElement.setAttribute('style',baseline);
                                const style=document.documentElement.style;
                                for(const [key,value] of Object.entries(tokens))style.setProperty('--'+key,value);
                            }''',{'tokens':tokens,'baseline':baseline_style})
                            result=plot.evaluate('''(el,expected)=>{
                                const style=getComputedStyle(el),reference=document.createElement('div');
                                reference.style.background=expected==='gradient'?'transparent':expected;
                                document.body.append(reference);const color=getComputedStyle(reference).backgroundColor;reference.remove();
                                return {background:style.backgroundColor,image:style.backgroundImage,shadow:style.boxShadow,color};
                            }''',expected)
                            harness.report.setdefault('plot_surfaces',[]).append({'case':label,**result})
                            if name=='dynamic-energy-price-card' and variant=='legacy':
                                card.screenshot(path=str(helpers.OUT/(mode+'-energy-inset.png')),animations='disabled')
                            if expected=='gradient':
                                harness.check(label+' explicit gradient preserved',result['image'].startswith('linear-gradient('))
                            else:
                                harness.check(label+' correct graph base colour',result['background']==result['color'])
                            if variant in ['legacy','modern']:
                                harness.check(label+' inset shadow retained',result['shadow']!='none')
                            harness.check(label+' native graph markup retained',plot.inner_html()==original)
                            harness.check(label+' graph geometry retained',plot.bounding_box()==bounds)
            harness.check('no JavaScript errors',harness.report['page_errors']==[])
            harness.check('no external requests',harness.report['blocked_requests']==[])
            harness.check('no device services',page.evaluate("qaCalls.every(c=>c.method!=='callService')"))
        finally:
            context.close()
            helpers.AllCardsRender.tearDownClass()


if __name__=='__main__':
    unittest.main(verbosity=2)
