"""Offline Chromium regression for production decorative-background defaults.

Requires the same Playwright environment as browser-all-cards-render.py.
BROWSER_EXECUTABLE selects an installed browser. No Home Assistant access.
"""
import importlib.util
import os
import tempfile
from pathlib import Path
import unittest

os.environ.setdefault('ALL_CARDS_RENDER_OUT', str(Path(tempfile.gettempdir()) / 'eleven-background-default-browser'))
spec = importlib.util.spec_from_file_location('render_helpers', Path(__file__).with_name('browser-all-cards-render.py'))
assert spec is not None and spec.loader is not None
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


class BackgroundDefault(unittest.TestCase):
    def test_defaults_editors_and_explicit_opt_in(self):
        helpers.AllCardsRender.setUpClass()
        harness = helpers.AllCardsRender()
        try:
            for artifact in ['collection', 'standalones']:
                context, page = harness.new_page()
                try:
                    if artifact == 'collection':
                        paths = [helpers.COLLECTION]
                    else:
                        paths = ['cards/' + folder + '/dist/' + bundle for folder, bundle in [
                            ('dynamic-energy-price-card', 'eleven-dynamic-energy-price-card.js'),
                            ('history-graph-card', 'eleven-history-graph-card.js'),
                            ('timeline-card', 'eleven-timeline-card.js'),
                            ('overview-card', 'eleven-overview-card.js'),
                            ('bar-chart', 'eleven-bar-chart.js'),
                            ('heatmap-card', 'eleven-heatmap-card.js'),
                            ('calendar-card', 'eleven-calendar-card.js'),
                            ('car-card', 'eleven-car-card.js'),
                            ('weather-card', 'eleven-weather-card.js'),
                            ('energy-flow-card', 'eleven-energy-flow-card.js'),
                            ('shopping-card', 'eleven-shopping-card.js'),
                            ('house-card', 'eleven-house-card.js'),
                            ('home-controls', 'eleven-home-controls-card.js'),
                            ('appliance-planner', 'eleven-appliance-planner.js'),
                            ('room-card', 'eleven-room-card.js'),
                            ('scene-engine-card', 'eleven-scene-engine-card.js')]]
                    for path in paths:
                        harness.load(page, path)
                    # Remove preview overrides: verify the real production default.
                    page.evaluate('''()=>{for(const c of Object.values(qaConfigs)){
                        for(const key of ['card_background','background','background_strength','animate_background'])delete c[key];
                    }}''')
                    for dark in [False, True]:
                        for name in helpers.CARDS[:-1]:  # Material House has a separate, unchanged contract.
                            with self.subTest(artifact=artifact, dark=dark, card=name):
                                harness.render(page, name, dark)
                                label = f'{artifact} {name} {dark}'
                                result = page.evaluate('''()=>{
                                    const card=qaCard, root=card.shadowRoot, host=root.querySelector('ha-card');
                                    const box=qaEditor.shadowRoot.querySelector('[data-bg=enabled]');
                                    const surface=getComputedStyle(host).background;
                                    const absent=!root.querySelector('[data-ui-card-background]');
                                    const legacyHidden=[...root.querySelectorAll('.header-background,.scene-background')].every(el=>getComputedStyle(el).display==='none');
                                    const stub=card.constructor.getStubConfig?.(card._hass??card.hass);
                                    const stubDefault=!stub || (stub.card_background===undefined && stub.background===undefined);
                                    const unchecked=box && !box.checked;
                                    let emitted;
                                    qaEditor.addEventListener('config-changed',e=>emitted=e.detail.config);
                                    const change=checked=>{box.checked=checked;box.dispatchEvent(new Event('change',{bubbles:true}));};
                                    change(true);
                                    card.setConfig(emitted);
                                    const enabled=!!root.querySelector('[data-ui-card-background]');
                                    const checked=box.checked && emitted.card_background.enabled===true;
                                    change(false);
                                    card.setConfig(emitted);
                                    const disabled=!root.querySelector('[data-ui-card-background]') && emitted.card_background.enabled===false;
                                    const sameSurface=getComputedStyle(root.querySelector('ha-card')).background===surface;
                                    return {absent,legacyHidden,stubDefault,unchecked,enabled,checked,disabled,sameSurface};
                                }''')
                                for key, value in result.items():
                                    harness.check(label+' '+key, value)
                                if artifact == 'collection' and name in ['weather-card', 'controls-card']:
                                    page.locator('eleven-'+name).screenshot(path=str(helpers.OUT/(name+('-dark' if dark else '-light')+'.png')))
                    aliases = page.evaluate('''()=>{
                        const results=[];
                        for(const tag of ['eleven-house-card','eleven-house-styled-card']){
                            for(const background of [undefined,'isobars','prism-glass','none']){
                                const card=document.createElement(tag);
                                const config={...qaConfigs['house-card']};
                                if(background!==undefined)config.background=background;
                                card.setConfig(config);card.hass=qaHass('house-card');
                                document.querySelector('#mount').append(card);
                                const root=card.shadowRoot;
                                const shared=!!root.querySelector('[data-ui-card-background]');
                                const native=[...root.querySelectorAll('.scene-background')].some(el=>getComputedStyle(el).display!=='none');
                                const expected=background==='isobars' ? shared&&!native : background==='prism-glass' ? !shared&&native : !shared&&!native;
                                results.push({tag,background:background??'absent',passed:expected});card.remove();
                            }
                        }
                        return results;
                    }''')
                    for result in aliases:
                        harness.check(artifact+' House alias '+result['tag']+' '+result['background'],result['passed'])
                    harness.check(artifact+' no physical service calls', page.evaluate("qaCalls.every(c=>c.method!=='callService')"))
                finally:
                    context.close()
            harness.check('no JavaScript errors', harness.report['page_errors']==[])
            harness.check('no console errors', harness.report['console_errors']==[])
            harness.check('no external requests', harness.report['blocked_requests']==[])
        finally:
            helpers.AllCardsRender.tearDownClass()


if __name__ == '__main__':
    unittest.main(verbosity=2)
