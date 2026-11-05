"""Focused shared-action QA. Synthetic hass only; no live HA traffic."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-evidence/shared-actions/scene-planner-room/browser'
BASE=os.environ.get('SHARED_ACTION_QA_URL','http://127.0.0.1:56519')
CLOCK="""{const RealDate=Date;const fixed=Date.parse('2026-10-28T09:07:00Z');window.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}};}"""
async def main():
 OUT.mkdir(parents=True,exist_ok=True);results=[];screens=[];errors=[]
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or os.environ.get('AGENT_BROWSER_EXECUTABLE_PATH') or '/opt/hermes/tools/chromium-1208/chrome-linux64/chrome',args=['--no-sandbox'])
  context=await browser.new_context(locale='nl-NL',timezone_id='Europe/Amsterdam')
  await context.add_init_script(CLOCK)
  page=await context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
  for name,url,tag,selector in [
   ('scene','/cards/scene-engine-card/frontend/demo.html?bundle','eleven-scene-engine-card','#reset'),
   ('room','/tests/fixtures/shared-actions-room.html','eleven-room-card','.control'),
   ('planner','/cards/appliance-planner/qa/','eleven-appliance-planner','[data-day]')]:
   await page.goto(BASE+url);await page.wait_for_function('window.card?.shadowRoot?.querySelector("[data-ui-button^=action]")')
   if name=='planner':
    await page.wait_for_function('window.card.result&&!window.card.loading');await page.evaluate('showCard("linked")');await page.wait_for_function('window.card.result&&!window.card.loading')
   card=page.locator(tag)
   await page.evaluate("async()=>{window.applyTheme=(await import('/tests/fixtures/shared-action-theme.js')).applyReviewTheme;document.body.style.padding='0';document.querySelector('main').style.maxWidth='480px'}")
   for width in [320,390,1280]:
    await page.set_viewport_size({'width':width,'height':1000})
    for paint in ['native','material']:
     for dark in [False,True]:
      await page.evaluate("([dark,paint])=>{applyTheme(dark,paint);document.body.style.setProperty('--primary-color','#157f5a');document.body.style.setProperty('--accent-color','#b043cd')}",[dark,paint]);await page.wait_for_timeout(180)
      buttons=await card.locator('[data-ui-button^=action]').evaluate_all("es=>es.filter(e=>e.getBoundingClientRect().width).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {variant:e.dataset.uiButton,text:e.textContent,width:r.width,height:r.height,font:s.fontSize,weight:s.fontWeight,type:e.type,disabled:e.disabled}})")
      assert buttons and all(b['width']>=44 and b['height']>=44 and b['font']=='13px' and b['weight']=='500' for b in buttons),(name,width,paint,dark,buttons)
      assert all(b['type']=='button' for b in buttons),buttons
      overflow=await card.evaluate("e=>({page:document.documentElement.scrollWidth>innerWidth,card:e.shadowRoot.querySelector('ha-card').scrollWidth>e.clientWidth,width:e.getBoundingClientRect().width})")
      assert not overflow['page'] and not overflow['card'],(name,width,paint,dark,overflow)
      await page.keyboard.press('Tab');await card.locator(selector).first.focus()
      focus=await card.locator(selector).first.evaluate("e=>{let p=document.createElement('span');p.style.color='var(--eleven-material-focus-color,color-mix(in srgb,var(--accent-color,var(--primary-color)) 60%,var(--primary-text-color)))';e.getRootNode().append(p);let expected=getComputedStyle(p).color;p.remove();return {visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineColor,width:getComputedStyle(e).outlineWidth,expected}}")
      assert focus['visible'] and focus['width']=='2px' and focus['outline']==focus['expected'],(name,focus)
      path=OUT/f'{name}-{paint}-{"dark" if dark else "light"}-{width}.png';await card.screenshot(path=str(path));screens.append(str(path.relative_to(ROOT)))
      results.append({'card':name,'paint':paint,'dark':dark,'viewport':width,'buttons':buttons,'focus':focus,**overflow})
   await page.set_viewport_size({'width':390,'height':1000})
   if name=='scene':
    await card.locator('#reset').click();assert await card.locator('#cancel').evaluate('e=>e===e.getRootNode().activeElement')
    danger=await card.locator('#confirm').evaluate("e=>{let s=getComputedStyle(e),p=document.createElement('span');p.style.color='var(--error-color)';e.getRootNode().append(p);let error=getComputedStyle(p).color;p.style.color=[...e.getRootNode().querySelector('style').sheet.cssRules].find(r=>r.selectorText?.includes('action-danger')).style.color;let text=getComputedStyle(p).color;p.remove();return {color:s.color,border:s.borderTopColor,radius:s.borderRadius,error,text}}")
    assert danger['color']==danger['text'] and danger['border']==danger['error'] and danger['radius']!='0px',danger
    await card.locator('#cancel').click();assert await page.evaluate('calls.length')==0
    await page.wait_for_timeout(30);assert await card.locator('#reset').evaluate('e=>e===e.getRootNode().activeElement')
    await card.locator('#reset').click();await page.keyboard.press('Escape');assert await page.evaluate('calls.length')==0
    await page.evaluate("serviceMode='pending'");await card.locator('#reset').click();await card.locator('#confirm').click()
    assert await card.locator('#reset').is_disabled();await page.evaluate('card._reset()')
    assert await page.evaluate('calls')==[['button','press',{'entity_id':'button.eleven_scene_engine_woonkamer_reset'}]]
    await page.evaluate('resolveService()');await page.wait_for_function('!card._pending')
    await page.evaluate("load('offline')");assert await card.locator('#reset').is_disabled()
    results.append({'behavior':'Scene cancel/Escape return focus without request; danger border preserved; held exact-target request deduplicated; offline blocks'})
   if name=='room':
    assert await card.locator('.control').get_attribute('aria-pressed') is None
    await card.locator('.control').click();assert await page.evaluate('moreInfo')==[{'entityId':'light.living'}];assert await page.evaluate('calls.length')==0
    await page.evaluate('pending=true');await card.locator('[data-scene]').first.click()
    assert await card.locator('[data-scene]').first.is_disabled();await page.evaluate("card._activateScene('scene.evening')")
    assert await page.evaluate('calls')==[['scene','turn_on',{'entity_id':'scene.evening'}]]
    await page.evaluate('resolveService()');await page.wait_for_function('!card._scenePending')
    await page.evaluate('hass.connected=false;card.hass={...hass}');assert await card.locator('[data-scene]').first.is_disabled()
    results.append({'behavior':'Room lamp opens MoreInfo only; scenes send exact one request while held; offline scenes blocked; no invented pressed semantics'})
   if name=='planner':
    await card.locator('[data-day]').nth(1).click();await page.wait_for_function('card.result&&!card.loading')
    assert await page.evaluate('card.form.day')=='2026-10-29'
    assert await page.evaluate('card.form.deadline')=='2026-10-30T00:00'
    assert await card.locator('[data-day]').nth(1).get_attribute('aria-pressed')=='true'
    assert await card.locator('#deadline-date,#deadline-time').count()==0
    await card.locator('[data-day]').nth(1).focus();await page.evaluate('card.render()')
    assert await card.locator('[data-day]').nth(1).evaluate("e=>e===e.getRootNode().activeElement")
    await card.locator('#program').focus();await page.wait_for_function('card.result&&!card.loading')
    await page.evaluate("()=>{window.originalWS=card._hass.callWS;card._hass.callWS=request=>request.operation==='save'?new Promise(resolve=>{window.releaseSave=()=>resolve(originalWS(request))}):originalWS(request)}")
    await card.locator('#save-plan').click();assert await card.locator('#save-plan').is_disabled(),await page.evaluate('({pending:card.pending,message:card.message,error:card.error,timeDraft:card.timeDraft,deadline:card.form.deadline,calls,release:typeof releaseSave})')
    await page.evaluate("card.act('save')");assert await page.evaluate("calls.filter(c=>c.operation==='save').length")==0
    await page.evaluate('releaseSave()');await page.wait_for_function('fixtureStatus.plans.length===1&&!card.pending')
    saved=await page.evaluate("calls.filter(c=>c.operation==='save')");assert len(saved)==1 and saved[0]['payload']['appliance_id']=='wash' and saved[0]['payload']['program_id']=='eco',saved
    await card.locator('[data-op=start]').click();await page.wait_for_function("fixtureStatus.plans[0].status==='running'&&!card.pending")
    await card.locator('[data-op=done]').click();await page.wait_for_function("fixtureStatus.plans[0].status==='done'&&!card.pending")
    await page.evaluate('showEditor(configFixture)');editor=page.locator('eleven-appliance-planner-editor')
    if not await editor.locator('#programs-section').evaluate('e=>e.open'):await editor.locator('#programs-section summary').click()
    form=editor.locator('#add-appliance');await form.locator('[name=name]').fill('Extra apparaat')
    submitted=await page.evaluate("()=>{window.submitCount=0;editor.shadowRoot.querySelector('#add-appliance').addEventListener('submit',()=>submitCount++);return submitCount}")
    await form.locator('[type=submit]').click();assert await page.evaluate('submitCount')==1
    assert await page.evaluate("editor.config.appliances.some(a=>a.name==='Extra apparaat')")
    results.append({'behavior':'Planner Tomorrow is actual choice; native time draft/focus survives render; held save deduplicates; exact one wash/eco save plus start/done; editor native submit fires once'})
  assert not errors,errors
  (OUT/'results.json').write_text(json.dumps({'results':results,'screenshots':screens,'page_errors':errors},indent=2))
  print(json.dumps({'matrix_cases':sum('viewport' in r for r in results),'behavior_groups':sum('behavior' in r for r in results),'screenshots':len(screens),'errors':errors}))
  await browser.close()
asyncio.run(main())
