"""Native touch, custom periods, overlay clearances and virtual rows."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-evidence/timeline-heatmap-interactions';OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:56515/JC5klAkxdKA9PmJO7YSGqy76RQb7-mo6C0aJPXHgbsI/cards/review/'
errors=[];results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
 for kind,index in [('timeline',2),('heatmap',5)]:
  context=b.new_context(viewport={'width':390,'height':1200},has_touch=True,is_mobile=True,reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL);page.wait_for_function(f'window.themeFixtureReady&&records[{index}].card._status==="ready"');card=page.locator(f'[data-card={kind}-card]');card.scroll_into_view_if_needed()
  # Full calendar and custom semantics using actual controls and requests.
  card.locator('.period-trigger').click();card.locator('[data-period-tab=calendar]').click();card.locator('[data-period-option=today]').click();page.wait_for_function(f'records[{index}].card._status==="ready"');assert card.evaluate("c=>new Date(c._start).toLocaleString('en-CA',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})==='00:00'")
  card.locator('.period-trigger').click();card.locator('[data-period-tab=custom]').click();card.locator('[data-custom-field=start]').fill('2026-10-28T08:00');card.locator('[data-custom-field=end]').fill('2026-10-29T20:00');card.locator('.period-custom [type=submit]').click();page.wait_for_function(f'records[{index}].card._status==="ready"&&records[{index}].card._end-records[{index}].card._start===129600000');card.screenshot(path=str(OUT/f'{kind}-custom.png'))
  card.locator('.period-trigger').click();card.locator('[data-period-tab=rolling]').click();card.locator('[data-period-option=configured]').click();page.wait_for_function(f'records[{index}].card._status==="ready"');card.scroll_into_view_if_needed()
  # Disclosure panel and info popover must fit the actual card and viewport.
  card.locator('.chart-tools summary').click();panel=card.locator('.chart-tools-panel').bounding_box();box=card.locator('ha-card').bounding_box();assert panel['x']>=box['x'] and panel['x']+panel['width']<=box['x']+box['width']
  card.locator('[data-insight=data]').click();info=card.locator('.insight-popup').bounding_box();assert info['x']>=7 and info['x']+info['width']<=383;card.screenshot(path=str(OUT/f'{kind}-information.png'));page.keyboard.press('Escape');card.locator('.chart-tools summary').focus();page.keyboard.press('Escape')
  session=context.new_cdp_session(page)
  if kind=='timeline':
   # Native touch tracks timestamps against the padded real chart, not its well.
   bounds=card.locator('.chart').bounding_box();y=bounds['y']+bounds['height']/2
   for event,ratio in [('touchStart',.3),('touchMove',.7)]:
    session.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[{'x':bounds['x']+bounds['width']*ratio,'y':y,'id':9}]});page.wait_for_timeout(60)
   native=card.evaluate('c=>({cursor:c._cursor,start:c._viewStart,end:c._viewEnd,touch:c._touchPointer})');assert native['touch'] is not None;assert abs(native['cursor']-(native['start']+.7*(native['end']-native['start'])))<(native['end']-native['start'])/bounds['width'],native
   card.evaluate('''c=>{window.touchNode=c.shadowRoot.querySelector(".chart");c.hass={...c.hass,states:{...c.hass.states,'switch.heating':{...c.hass.states['switch.heating'],attributes:{...c.hass.states['switch.heating'].attributes,friendly_name:'Verwarming bijgewerkt'}}}};c._render();}''');assert card.evaluate('c=>c._touchRenderPending&&c.shadowRoot.querySelector(".chart")===touchNode')
   session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(100);assert card.evaluate('c=>c._touchPointer===null&&c.shadowRoot.querySelector(".chart")!==touchNode&&c._pinned');assert card.locator('.tooltip').is_visible()
   # Tooltip stays inside the viewport after pinned refresh, then drag zoom.
   tip=card.locator('.tooltip').bounding_box();assert tip['x']>=7 and tip['x']+tip['width']<=383;card.screenshot(path=str(OUT/'timeline-native-touch.png'));card.locator('.chart').focus();page.keyboard.press('Escape')
   bounds=card.locator('.track').first.bounding_box();page.mouse.move(bounds['x']+bounds['width']*.2,bounds['y']+bounds['height']/2);page.mouse.down();page.mouse.move(bounds['x']+bounds['width']*.8,bounds['y']+bounds['height']/2,steps=5);page.mouse.up();assert card.evaluate('c=>!!c._viewport')
   # Two categorical series and long functional labels, durations and gaps.
   card.evaluate('''c=>{c._config.entities=['switch.heating','binary_sensor.long'];c._config.series_options=[{entity:'switch.heating',name:'Verwarming woonkamer en alle gebouwen'}];c._config.show_summary=true;c._config.show_state_labels=true;c._config.state_colors=[{state:'on',color:'#008800',label:'Ingeschakeld — verwarming actief'},{state:'off',color:'#888888',label:'Uitgeschakeld'}];c._series=[c._series[0],[{start:c._start,end:c._end,state:'unavailable'}]];c._render()}''');assert card.locator('.row').count()==2;card.screenshot(path=str(OUT/'timeline-multi-summary.png'))
   results.append({'card':kind,'custom_period':True,'calendar_period':True,'overlay_bounds':True,'native_touch':native,'touch_defers_rerender':True,'pinned_tooltip':True,'drag_zoom':True,'two_rows_summary':True})
  else:
   bounds=card.locator('.matrix-scroll').bounding_box();y=bounds['y']+min(70,bounds['height']/2)
   for event,ratio in [('touchStart',.85),('touchMove',.65),('touchMove',.4),('touchMove',.2)]:
    session.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[{'x':bounds['x']+bounds['width']*ratio,'y':y,'id':9}]});page.wait_for_timeout(80)
   session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(250);native=card.locator('.matrix-scroll').evaluate('e=>e.scrollLeft');assert native>0,native;card.screenshot(path=str(OUT/'heatmap-native-swipe.png'))
   # Long real source window exercises virtual rows and row sizing at 200% text.
   card.evaluate('c=>c.setConfig({...c._config,hours_to_show:8760})');page.wait_for_function(f'records[{index}].card._status==="ready"');assert card.evaluate('c=>c._rows.length>80&&c._virtualRows');total=card.evaluate('c=>c._rows.length');card.scroll_into_view_if_needed();sc=card.locator('.matrix-scroll');sc.evaluate('e=>{e.scrollTop=e.scrollHeight;e.scrollLeft=0}');page.wait_for_timeout(150);assert card.evaluate('c=>c._windowRange[1]===c._rows.length');count=card.locator('.virtual-row').count();assert count<60
   card.evaluate('c=>{const s=document.createElement("style");s.textContent=".hours span,.day{font-size:22px!important}";c.shadowRoot.append(s);c._layoutMatrixLabels();c._updateMatrixWindow()}');sc.evaluate('e=>e.scrollTop=e.scrollHeight');page.wait_for_timeout(150)
   geometry=card.locator('.virtual-row').evaluate_all('els=>els.slice(-4).map(e=>({top:parseFloat(e.style.top),height:e.getBoundingClientRect().height}))');assert all(y['top']>=x['top']+x['height'] for x,y in zip(geometry,geometry[1:])),geometry
   assert card.evaluate('c=>c._windowRange[1]===c._rows.length');card.screenshot(path=str(OUT/'heatmap-virtual-text200.png'));results.append({'card':kind,'custom_period':True,'calendar_period':True,'overlay_bounds':True,'native_swipe_scroll_left':native,'source_rows':total,'rendered_rows':count,'virtual_text200_last_rows':geometry})
  context.close()
 assert not errors,errors
 (OUT/'results.json').write_text(json.dumps({'results':results,'errors':errors},indent=2));print(json.dumps({'cards':len(results),'results':results,'errors':errors}));b.close()
