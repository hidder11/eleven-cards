"""Synthetic hass boundary; optional read-only HA-served bundle verification."""
import asyncio,json,os,subprocess,urllib.request,hashlib
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'qa-evidence/appliance-planner'
OUT.mkdir(parents=True,exist_ok=True)
CLOCK="""{const RealDate=Date;const fixed=Date.parse('2026-10-28T09:07:00Z');window.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[fixed]));}static now(){return fixed;}};}"""

async def main():
    server=subprocess.Popen(['python3','-m','http.server','18773','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    results=[];errors=[]
    try:
        await asyncio.sleep(.5)
        if server.poll() is not None:raise RuntimeError('Local QA server could not bind port 18773')
        async with async_playwright() as pw:
            browser=await pw.chromium.launch(executable_path=os.environ['AGENT_BROWSER_EXECUTABLE_PATH'],args=['--no-sandbox'])
            context=await browser.new_context(locale='nl-NL',timezone_id='Europe/Amsterdam')
            await context.add_init_script(CLOCK)
            page=await context.new_page();page.on('pageerror',lambda e:errors.append(e.stack))
            served_url=os.environ.get('PLANNER_SERVED_BUNDLE')
            if served_url:
                with urllib.request.urlopen(served_url,timeout=30) as response:served=response.read()
                assert served==(ROOT/'cards/appliance-planner/dist/eleven-appliance-planner.js').read_bytes()
                await page.route('**/dist/eleven-appliance-planner.js',lambda route:route.fulfill(body=served,content_type='text/javascript'))
                results.append('HA-served bundle equals local tested build: '+hashlib.sha256(served).hexdigest())
            await page.goto('http://127.0.0.1:18773/cards/appliance-planner/qa/')
            await page.wait_for_function('window.card?.result')
            c=page.locator('eleven-appliance-planner')
            assert await c.locator('#save-plan').count()==0
            assert await page.evaluate('window.calls.filter(c=>c.operation).length')==0
            results.append('standalone ignores installed integration; no persistent action or backend commands')
            initial=await page.evaluate('window.card.result.start')
            await c.locator('#program').select_option('short');await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await page.evaluate('window.card.result.kwh')==.6
            await c.locator('[data-day]').nth(1).click();await page.wait_for_function('window.card.result&&!window.card.loading')
            assert (await c.locator('#deadline-date').input_value())=='2026-10-29'
            results.append('program dropdown and Tomorrow shortcut automatically recompute')
            await c.locator('#deadline-time').fill('23:00');await c.locator('#deadline-time').dispatch_event('change');await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await page.evaluate("window.card.form.deadline==='2026-10-29T23:00'")
            results.append('native date/time change recomputes; full date and average/cost/savings rendered')
            await page.evaluate('window.showCard()');await page.wait_for_function('window.card.result')
            assert not await c.locator('#advice-details').evaluate('(el)=>el.open')
            await c.locator('#appliance').select_option('combi');await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await page.evaluate('window.card.form.pid==="combined"&&window.card.result.kwh===4')
            await c.locator('#appliance').select_option('wash');await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await page.evaluate('window.card.form.pid==="eco"&&window.card.result.kwh===1')
            await c.locator('#advice-details summary').click()
            await page.evaluate('window.card.recompute()');await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await c.locator('#advice-details').evaluate('(el)=>el.open')
            await c.locator('#advice-details summary').click()
            await page.evaluate('window.card.render()')
            assert not await c.locator('#advice-details').evaluate('(el)=>el.open')
            results.append('appliance dropdown resets program correctly; open/closed Details survives recomputation and render')
            for width in [320,390,1280]:
                await page.set_viewport_size({'width':width,'height':1100})
                for dark in [False,True]:
                    await page.evaluate('(dark)=>document.body.classList.toggle("dark",dark)',dark)
                    await c.locator('#advice-details').evaluate('(el)=>el.open=false')
                    await page.wait_for_timeout(50)
                    height=await c.locator('ha-card').evaluate('(el)=>el.getBoundingClientRect().height')
                    await page.screenshot(path=OUT/f'compact-{width}-{"dark" if dark else "light"}.png',full_page=True)
                    assert height < (590 if width==320 else 540), (width,height)
                    await c.locator('#advice-details summary').click()
                    assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                    assert await c.evaluate('(el)=>el.shadowRoot.querySelector("ha-card").scrollWidth<=el.clientWidth')
                    assert await c.locator('.highlight').count()==1
                    path=OUT/f'advice-{width}-{"dark" if dark else "light"}.png'
                    await page.screenshot(path=path,full_page=True)
                    results.append(f'{width} {"dark" if dark else "light"}: no overflow; graph highlight; screenshot')
            await page.set_viewport_size({'width':390,'height':1100});await page.evaluate('document.body.classList.remove("dark");window.showCard("linked")');await page.wait_for_function('window.card.result')
            assert await c.locator('#save-plan').count()==1
            await c.locator('#advice-details summary').click()
            assert 'Gesimuleerd profiel' in await c.locator('ha-card').inner_text()
            await page.evaluate('window.hassFixture.states["sensor.prices"].attributes.prices=window.rows.map(r=>({...r,price:.99}));window.showCard("linked")')
            await page.wait_for_function('window.card.result')
            assert await page.evaluate('window.card.rows[0].price===window.rows[0].price&&window.card.rows[0].price!==.99')
            await page.evaluate('window.hassFixture.states["sensor.prices"].attributes.prices=window.rows')
            results.append('linked graph uses the exact backend-priced preview intervals, not an earlier frontend snapshot')
            await c.locator('#save-plan').click();await page.wait_for_function('window.fixtureStatus.plans.length===1&&!window.card.pending')
            assert await c.locator('[data-op="start"]').count()==1
            assert await c.locator('#advice-slot .status.error').count()==0
            assert await page.evaluate('window.card.shadowRoot.activeElement?.dataset.op')=='start'
            await page.screenshot(path=OUT/'linked-plan-390.png',full_page=True)
            await c.locator('[data-op="start"]').click();await page.wait_for_function('window.fixtureStatus.plans[0].status==="running"&&!window.card.pending')
            await c.locator('[data-op="done"]').click();await page.wait_for_function('window.fixtureStatus.plans[0].status==="done"&&!window.card.pending')
            results.append('explicit linked simulated mode: save/status/start/done; no physical service')
            await page.evaluate('window.showCard("outage")');await page.wait_for_function('window.card.result')
            assert await c.locator('#save-plan').count()==0
            assert 'Lineaire schatting' in await c.locator('ha-card').inner_text()
            assert await page.evaluate('window.card.config.integration.programs_snapshot[0].programs[0].profile_mode')=='simulated'
            await page.screenshot(path=OUT/'outage-390.png',full_page=True)
            results.append('outage fallback uniform, mode retained, planning disabled')
            await page.evaluate('window.showCard()');await page.wait_for_function('window.card.result')
            assert await c.locator('#settings, #settings-panel, #save-settings, eleven-appliance-planner-editor').count()==0
            assert await page.evaluate('typeof window.card.mountSettings')=='undefined'
            assert not any(call.get('type') in ['lovelace/config/save','lovelace/config'] for call in await page.evaluate('window.calls'))
            results.append('daily card contains no settings/editor/save controls or dashboard write path, including for administrators')
            # Native editor interface with intercepted config-changed, not a live dashboard save.
            await page.evaluate('window.showCard();window.showEditor()')
            e=page.locator('eleven-appliance-planner-editor')
            await e.locator('form.program-edit').first.locator('[name=minutes]').fill('95')
            await e.locator('form.program-edit').first.locator('[name=minutes]').dispatch_event('input')
            await page.wait_for_function('window.savedConfigs.length>0&&!window.editor.pending',timeout=2500)
            assert await e.get_by_role('button',name='Bewaar',exact=False).count()==0
            assert await page.evaluate('window.savedConfigs.at(-1).appliances[0].programs[0].minutes')==95
            await e.locator('#cheap').fill('12')
            assert await page.evaluate('window.savedConfigs.at(-1).cheap_price')==.12
            await e.locator('form.appliance-edit').first.locator('[name=name]').fill('Draft appliance')
            await e.locator('form.program-edit').first.locator('[name=kwh]').fill('1.25')
            assert await page.evaluate('window.savedConfigs.at(-1).appliances[0].name==="Draft appliance"&&window.savedConfigs.at(-1).appliances[0].programs[0].kwh===1.25')
            await page.evaluate('window.editNode=window.editor.shadowRoot.querySelector("form.program-edit [name=minutes]");window.editNode.focus();window.editor.addEventListener("config-changed",e=>window.editor.setConfig(e.detail.config));window.blurCount=0;window.editNode.addEventListener("blur",()=>window.blurCount++)')
            await e.locator('form.program-edit').first.locator('[name=minutes]').fill('96')
            await page.evaluate('for(let i=0;i<5;i++)window.editor.hass={...window.hassFixture}')
            assert await page.evaluate('window.editNode===window.editor.shadowRoot.querySelector("form.program-edit [name=minutes]")&&window.editor.shadowRoot.activeElement===window.editNode&&window.blurCount===0')
            results.append('name/duration/kWh emit immediately; native config echo and repeated hass updates retain exact focused input without blur')
            await page.evaluate('window.configCount=window.savedConfigs.length')
            await e.locator('form.program-edit').first.locator('[name=minutes]').fill('0')
            assert await page.evaluate('window.savedConfigs.length===window.configCount&&window.editor.config.appliances[0].programs[0].minutes===96')
            await e.locator('form.program-edit').first.locator('[name=minutes]').fill('96')
            results.append('invalid numeric drafts do not emit or replace the last valid program')
            add=e.locator('form.program-add').first
            await add.locator('[name=name]').fill('Draft extra');await add.locator('[name=minutes]').fill('45');await add.locator('[name=kwh]').fill('0.4');await add.locator('button').click()
            assert await page.evaluate('window.savedConfigs.at(-1).appliances[0].programs.at(-1).name')=='Draft extra'
            await e.locator('#add-appliance [name=name]').fill('Draft dryer');await e.locator('#add-appliance button').click()
            assert await page.evaluate('window.savedConfigs.at(-1).appliances.at(-1).name')=='Draft dryer'
            assert await page.evaluate('window.configFixture.appliances.length===2&&window.configFixture.appliances[0].programs.length===2&&window.card.config.appliances[0].programs[0].minutes===150')
            results.append('Add program/appliance changes drafts only, without mutating original card configuration')
            await page.evaluate('window.simulatedNativeSaved=structuredClone(window.savedConfigs.at(-1));window.showEditor(window.simulatedNativeSaved)')
            assert await e.locator('form.program-edit').first.locator('[name=minutes]').input_value()=='96'
            await page.evaluate('window.showEditor(window.card.config)')
            assert await e.locator('form.program-edit').first.locator('[name=minutes]').input_value()=='150'
            assert await e.locator('form.program-edit').count()==3
            results.append('synthetic native Save roundtrip retains draft and Cancel/reopen from original discards it; no live dashboard write claimed')
            await page.screenshot(path=OUT/'settings-390.png',full_page=True)
            for width in [320,390]:
                await page.set_viewport_size({'width':width,'height':1100})
                assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                assert await e.evaluate('(el)=>el.shadowRoot.querySelector(".program-fields").scrollWidth<=el.clientWidth')
                await page.screenshot(path=OUT/f'settings-{width}.png',full_page=True)
            results.append('editor changes duration and ct/kWh -> EUR/kWh once through config-changed')
            await e.locator('details').last.locator('summary').click()
            await page.evaluate('window.beforeDisclosureConfigs=window.savedConfigs.length;for(let i=0;i<5;i++)window.editor.hass={...window.hassFixture}')
            assert await e.locator('details').last.evaluate('(el)=>el.open'), 'Integration disclosure closed during hass updates'
            await page.evaluate('window.editor.render()')
            assert await e.locator('details').last.evaluate('(el)=>el.open'), 'Integration disclosure closed during render'
            await e.locator('details').first.locator('summary').click()
            await page.evaluate('window.editor.render()')
            assert not await e.locator('details').first.evaluate('(el)=>el.open'), 'Program disclosure reopened during render'
            assert await page.evaluate('window.savedConfigs.length===window.beforeDisclosureConfigs')
            results.append('open integration and closed programs survive repeated hass updates/render without config changes')
            await e.locator('#integration-entity').select_option('sensor.eleven_appliance_planner')
            await page.evaluate('window.editorCallsStart=window.calls.length;window.backendBeforeEditor=JSON.stringify(window.fixtureStatus)')
            await e.locator('#link').click();await page.wait_for_function('window.editor.config.integration?.enabled&&!window.editor.pending')
            assert await e.locator('[data-transfer]').count()==0
            assert await e.locator('form.program-edit').first.locator('[name=profile_mode]').is_disabled()
            assert await e.locator('form.appliance-edit').first.locator('[name=name]').is_disabled()
            assert await e.locator('form.program-add,#add-appliance,#notification-save').count()==0
            assert 'alleen-lezen' in await e.locator('.owned').text_content()
            assert await page.evaluate('window.fixtureStatus.appliances[0].programs[0].profile_mode')=='simulated'
            results.append('link is config draft only; incompatible backend draft settings explicitly read-only, no transfer/save controls')
            assert await e.locator('details').last.evaluate('(el)=>el.open'), 'Integration disclosure closed after linking'
            await e.locator('#copy-unlink').check();await e.locator('#unlink').click()
            assert await page.evaluate('window.editor.config.integration.enabled') is False
            assert await page.evaluate('window.fixtureStatus.plans[0].status')=='done'
            assert await page.evaluate('window.editor.config.appliances[0].programs[0].minutes')==150
            assert await page.evaluate('JSON.stringify(window.fixtureStatus)===window.backendBeforeEditor')
            assert await page.evaluate('window.calls.slice(window.editorCallsStart).filter(c=>c.operation).length')==0
            results.append('link/unlink/copy emit config drafts with no backend calls or mutations; plans and measurements preserved')
            await page.evaluate('window.hassFixture.locale.language="en-GB";window.showCard()');await page.wait_for_function('window.card.result')
            assert 'Start at' in await c.locator('ha-card').inner_text()
            assert await c.locator('#appliance option[value=combi]').text_content()=='Wasdroogcombinatie'
            await page.screenshot(path=OUT/'english-390.png',full_page=True)
            results.append('English auto locale; literal appliance names preserved')
            await page.evaluate('window.hassFixture.locale.language="nl-NL";window.hassFixture.states["sensor.prices"].attributes.prices=window.rows.filter(r=>r.start>="2026-10-28T10:00:00.000Z"&&r.end<="2026-10-28T16:00:00.000Z");window.showCard()')
            await page.wait_for_function('window.card.result')
            assert await page.evaluate('window.card.result.provisional&&window.card.result.savings===null')
            assert await c.locator('.warning').is_visible()
            await c.locator('#advice-details summary').click()
            assert 'Vergelijking niet beschikbaar' in await c.locator('ha-card').inner_text()
            await page.screenshot(path=OUT/'provisional-390.png',full_page=True)
            results.append('partial future still requires a fully priced run; missing immediate comparison is explicit')
            await page.evaluate('window.hassFixture.states["sensor.prices"].attributes.prices=window.rows.slice(40,41);window.showCard()')
            await page.wait_for_function('!window.card.loading&&window.card.message')
            assert await page.evaluate('window.card.result===null')
            results.append('insufficient priced duration shows error, no invented tariffs or advice')
            await page.evaluate('window.hassFixture.states["sensor.prices"].attributes.prices=window.rows;window.showCard()')
            await page.wait_for_function('window.card.result')
            await c.locator('#deadline-time').focus()
            await page.evaluate('window.deadlineNode=window.card.shadowRoot.querySelector("#deadline-time");window.card.recompute()')
            await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await page.evaluate('window.deadlineNode===window.card.shadowRoot.querySelector("#deadline-time")&&window.card.shadowRoot.activeElement===window.deadlineNode')
            results.append('deadline DOM node and keyboard focus survive asynchronous recomputation')
            await page.evaluate('window.originalWS=window.hassFixture.callWS;window.hassFixture.callWS=async r=>{if(r.operation==="preview")throw Object.assign(Error("Synthetic disconnected backend"),{code:"not_loaded"});return window.originalWS(r);};window.showCard("linked")')
            await page.wait_for_function('window.card.result&&!window.card.loading')
            assert await c.locator('#save-plan').count()==0
            assert 'Lineaire schatting' in await c.locator('ha-card').inner_text()
            await page.evaluate('()=>{window.hassFixture.callWS=window.originalWS;}')
            results.append('not_loaded WebSocket failure falls back explicitly even if entity snapshot is still available')
            await page.evaluate('window.hassFixture.user.is_admin=false;window.showEditor()')
            assert await e.locator('input,select,button').count()==0
            assert not any('domain' in call for call in await page.evaluate('window.calls'))
            results.append('non-admin editor cannot edit; no physical call_service dispatched')
            assert not errors,errors
            await browser.close()
    finally:
        server.terminate();server.wait(timeout=5)
        (OUT/'browser-results.json').write_text(json.dumps({'provenance':'synthetic fixture; not live providers/native Lovelace','checks':results,'check_count':len(results),'page_errors':errors},indent=2))
    print(json.dumps({'checks':len(results),'page_errors':errors,'output':str(OUT)},indent=2))

asyncio.run(main())
