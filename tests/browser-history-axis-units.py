"""History unit placement in real Chromium; synthetic data, no screenshots."""
import importlib.util
import os
from pathlib import Path
import unittest

os.environ['QA_SCREENSHOTS'] = '0'
os.environ.setdefault('ALL_CARDS_RENDER_OUT', str(Path(__file__).resolve().parents[1] / '.cache' / 'history-axis-units' / os.environ.get('HISTORY_UNITS_ARTIFACT', 'collection')))
spec = importlib.util.spec_from_file_location('render_helpers', Path(__file__).with_name('browser-all-cards-render.py'))
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


class HistoryAxisUnits(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        helpers.AllCardsRender.setUpClass()

    @classmethod
    def tearDownClass(cls):
        helpers.AllCardsRender.tearDownClass()

    def test_units_follow_each_reading_and_stay_inside_the_graph(self):
        harness = helpers.AllCardsRender()
        context, page = harness.new_page()
        try:
            artifact = os.environ.get('HISTORY_UNITS_ARTIFACT', 'collection')
            harness.load(page, helpers.COLLECTION if artifact == 'collection' else 'cards/history-graph-card/dist/eleven-history-graph-card.js')
            cases = 0
            for dark in [False, True]:
                for width in [280, 640]:
                    for units in [['kW'], ['kW', 'kW'], ['kW', '%'], ['kilowatt-hours/m²'], ['<W>'], ['']]:
                        for legend in [False, True]:
                            with self.subTest(dark=dark, width=width, units=units, legend=legend):
                                page.evaluate('''({dark,width,units,legend})=>{
                                  const ids=units.map((_,i)=>'sensor.axis_'+i),hass=qaHass('history-graph-card');
                                  hass.themes={darkMode:dark};hass.language=dark?'nl':'en';hass.locale={language:hass.language};
                                  hass.states=Object.fromEntries(ids.map((id,i)=>[id,{state:'0',attributes:{friendly_name:'Meter '+i,unit_of_measurement:units[i]}}]));
                                  hass.callApi=async()=>ids.map(id=>[0,1,2].map((n)=>({entity_id:id,state:String(n===1?5:0),last_changed:new Date(Date.now()-3600000+n*1800000).toISOString()})));
                                  const card=document.createElement('eleven-history-graph-card');
                                  card.style.cssText='display:block;width:'+width+'px;height:420px';
                                  card.setConfig({entities:ids,show_legend:legend,hours_to_show:1});
                                  card.hass=hass;document.querySelector('#mount').replaceChildren(card);window.qaCard=card;
                                }''', dict(dark=dark, width=width, units=units, legend=legend))
                                page.wait_for_function("qaCard._status==='ready'&&qaCard.shadowRoot.querySelector('.chart')?.style.getPropertyValue('--history-plot-top')")
                                page.evaluate('''()=>document.fonts.ready''')
                                result = page.evaluate('''({units,legend})=>{
                                  const root=qaCard.shadowRoot,chart=root.querySelector('.chart'),box=chart.getBoundingClientRect(),plot=root.querySelector('.plot').getBoundingClientRect();
                                  const labels=[...chart.querySelectorAll('.axis-unit')],expected=[...new Set(units)];
                                  const assert=(ok,message)=>{if(!ok)throw Error(message)};
                                  assert(labels.map(n=>n.textContent).join('|')===expected.filter(Boolean).join('|'),'one label per unit inside chart');
                                  assert(!root.querySelector('.legend .unit')&&!root.querySelector('.data-status'),'no detached unit outside chart');
                                  for(const label of labels){const r=label.getBoundingClientRect();assert(r.left>=box.left&&r.right<=box.right+1&&r.top>=box.top&&r.bottom<=box.bottom,'axis unit inside graph surface');assert(r.bottom<plot.top,'unit stays above plotted readings');}
                                  const readings=[...root.querySelectorAll('.legend-item strong')];
                                  assert(readings.length===(legend?units.length:0),'legend visibility');
                                  readings.forEach((n,i)=>assert(n.textContent==='0'+(units[i]?' '+units[i]:''),'zero reading keeps its own unit'));
                                  assert(root.querySelector('.card-content').scrollWidth<=qaCard.clientWidth,'no card overflow');
                                  assert(plot.width>70&&plot.height>=70,'plot stays usable');
                                  assert(!root.querySelector('W'),'unit text remains escaped');
                                  return {axes:qaCard._axes.length,unitLabels:labels.length};
                                }''', dict(units=units, legend=legend))
                                self.assertEqual(result['axes'], len(set(units)))
                                cases += 1
            self.assertEqual(cases, 48)
            self.assertEqual(harness.report['page_errors'], [])
            self.assertEqual(harness.report['console_errors'], [])
            print(f'PASS: {cases} History unit layouts ({artifact}), no screenshots.')
        finally:
            context.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
