# Thema-volgende Eleven Cards — lokale verificatie

## Actueel: EVCC matte-flow vervangt witte sweep — 1 november 2026
Witte sweep expliciet afgewezen, hieronder uitsluitend historische verificatie. Nieuwe EVCC-only matte diagonale accent-/theme-inktextuur met constante opacity en naadloze achtergrondverschuiving; SOC-edge/accent/layout blijven stil en waarheidsgetrouw. Bestaande power-duration/delay/play-state ongewijzigd, reduced-motion verwijdert de textuur. 66/66 gerichte Node-tests, syntax/diffchecks; echte lokale gallery12 thema/breedtegevallen en echte publieke gallery4 thema/modegevallen, 48 fasebeelden, actieve tijd, power-snelheid/nul/onbeschikbaar/offline/reconnect en alle batterijstyles. Vier gewone-Auto computed-paint/geometry-paren exact; geen page errors. Persoonlijk bekeken: volledige fasecontactmatrix en vier publieke mobiele kaartbeelden. Vier productieoutputs exact terug te draaien naar verse task-entry door alleen het EVCC-vervangingsblok te herstellen; twaalf collectieslices exact, alleen Car gewijzigd. Lokale/publieke allowlist-byte/MIME-readbacks in `qa-evidence/evcc-matte/delivery.json`; browserresultaten en screenshots in dezelfde map. Historische evidence blijft ongewijzigd. Gebruikersgoedkeuring EVCC en echte HA/Safari/deviceacceptatie blijven apart; geen HA-write/deployment/commit/push.

## Historisch: EVCC-laadanimatie follow-up — 1 november 2026
Alleen bestaande EVCC-batterijsweep duidelijker: band 42→56%, bredere witte kern, subtiel contrast aan de voorrand en EVCC-only opheffen van geërfde `filter:opacity(.45)`. Geen glow/blur/shadow of extra animatie; timing, SOC, pauzeren, reduced-motion en gewone Auto intact. Vier productieoutputs (één CSS-bron +twee Car-bundles +collectie) zijn exact naar follow-up entry terug te draaien door uitsluitend de nieuwe scoped regel te verwijderen. 66/66 gerichte Node-tests; bestaande Chromium 71+241 en testmodule/reduced-motion groen. Echte lokale én publieke gallery elk12 native/Material licht/donker ×320/390/dashboard motiongevallen met36 zichtbare fasecaptures, actieve tijdsvooruitgang, nul/onbeschikbaar-vermogenpauze en reduced-motion removal; geen page errors. Bestaande lokale layoutmatrix12+60 en gewone Auto12 computed-pariteitsparen opnieuw groen; 18 exacte lokale/publieke HTTP-bytes/MIME-readbacks en originele538-bestandenverifier groen zonder allowlistuitbreiding. Collection SHA256 `37896f8b0ee4c84756f82de29509d28d3924be4bc7dfeb4c8690273e878ccb84`. Details/scope/samples: `qa-evidence/evcc-animation/REPORT.md`. Gewone Auto approved, EVCC pending; geen HA-deployment.

## Eerdere layoutverificatie: Auto EVCC — 1 november 2026
Gewone Auto expliciet goedgekeurd; EVCC blijft pending. Canonieke gallery: 18 voorbeelden, 10 approved /8 pending, House apart. Alleen EVCC-bron en Car standalone/test/collectieslice gewijzigd, plus EVCC-reviewfixture/goedkeuringsstatus/tests/documentatie. 65 gerichte Node-tests; Chromium 71 functionele en 241 Gallery-controles, aparte testmodule en reduced-motion groen. Lokale én echte publieke gallery elk 12 native/Material licht/donker ×320/390/dashboard en60 SOC/200%-tekst/focussets; nul page errors of overflow. Eenheden expliciet mee vergroot, native accent bewust anders dan primary; 44px mode/tab/sliderdoelen, zichtbare focus zonder clip, sessiegraph en echte tabinteracties. Gewone Auto 12 baseline/current paint+geometry-paren ongewijzigd; bron bytegelijk. Exacte allowlisted HTML/JS/PNG readbacks lokaal/publiek (18), image/png apart; twaalf collectieonderdelen exact samengesteld, alleen Car gewijzigd. Bewijs en finale hashes: `qa-evidence/evcc-refinement/delivery.json`; browser- en pariteitsrapporten in dezelfde map. `npm run check` en `git diff --check` groen. Geen full-suiteclaim of nieuwe Heatmap-bewering; de oude EVCC-browserbaseline reproduceerde wel zijn bestaande onjuiste capsuleverwachting. Geen HA-write/install/deploy, commit/push/release; gebruikersreview EVCC en echte HA/Safari/fysieke-device-acceptatie open.

## Actuele Actions-verificatie — 1 november 2026
Weather is expliciet door de gebruiker goedgekeurd; gallery nu acht approved/tien pending (18 voorbeelden, House apart). Actions is lokaal verfijnd maar **pending review**. Source target is `cards/home-controls/src/standalone-cards.js`, uitsluitend Actions-pad; Home Controls-bundle gericht gebouwd, collectie/andere approved bundles/shared/theme exact onveranderd. Details/contract in bestaande design/plan/fixrecords. Werkelijk geserveerde browser: 12 HA/Material licht/donker × 320/390/dashboard matrix, 36 stress/enlarged en drie interactiebreedtes; zes aanvullende reconnect/touch/gradientcontrast/live-focuschecks; nul page errors. Focused Node 24/24, syntax/diff groen. Collection smoke 3/4: alleen bestaande Heatmap shadowRoot-sizingfout, niet aangepakt. Verifier beschermt 386 source/shared/theme/collectiebestanden en leest alle acht publieke outputs lokaal én publiek bytegelijk terug (16 HTTP200). Bewijs, hashes en exact bestandsmanifest: `qa-evidence/actions-refinement/`. Werkelijke screenshots bekeken; geen volledige accessibility/native HA/Safari/physical-device-acceptatie of nieuwe groene full-suiteclaim. Geen installatie/deploy/HA-write, commit of release.


## Resultaat en afbakening
Werkende geïsoleerde implementatie op branch `feat/theme-following-cards`, werkmap `/opt/data/workspace/eleven-theme-following`, basis `origin/develop` commit `5bdd44b`. **Geen push, publicatie, installatie, HA-login/API, dashboard- of integratiewijziging.** De goedgekeurde House-pilot, zijn bundle en het geïnstalleerde/thema-bronbestand zijn niet aangepast. De centrale stylingguide is niet aangeraakt.

17 andere kaarttypen zijn geïnventariseerd én gemigreerd/gecontroleerd. Daarnaast is de EVCC-variant van Car getest. De drie lokale, nog niet getrackte kaartdirectories zijn vanuit de dirty hoofdwerkmap gekopieerd naar deze geïsoleerde worktree; de afzonderlijke Scene Engine frontend is als snapshot opgenomen. Originele bestanden blijven behouden en worden met SHA-256 opnieuw gecontroleerd. De snapshots worden niet stilzwijgend aan de twaalf-kaarten-collectie toegevoegd.

| Kaart | Herkomst | Lokale implementatie en browsercontrole |
|---|---|---|
| History Graph | develop | kaart, plot, bediening, tooltip/popups, keyboardcursor |
| Bar Chart | develop | geërfde History-themarollen; eigen standalone build en datakleuren |
| Timeline | develop | kaart, plot, bediening, tooltip/popups, keyboardcursor |
| Dynamic Energy Price | develop | kaart, current-reading, plot, tooltip; embedded variant blijft onaangeroerd transparant |
| Overview | develop | kaart, readings, sparklines, More Info |
| Heatmap | develop | kaart, matrix-scroll als plot, bediening en popups; celkleuren behouden |
| Calendar | develop | kaart, navigatie, informatieknop en popups |
| Weather | develop | kaart, reading/status-wells, geselecteerde tabs; forecastscroll en weersillustratie behouden |
| Car | develop | generiek én EVCC: kaart, reading-wells, plot, bediening en geselecteerde tabs; accukleur behouden |
| Energy Flow | develop | kaart, metrics/nodes, bediening en popups; functionele tintlagen behouden |
| Shopping | develop | kaart, editvelden en opslaanknop; bron/bundle-regressies op mutaties, focus en touch |
| Actions | lokale `home-controls` snapshot | kaart en expliciete action-controls |
| Controls | lokale `home-controls` snapshot | kaart en expliciete bediening; actieve toggle-kleuren niet overschreven |
| Waste | lokale `home-controls` snapshot | kaart erft HA-oppervlak; afvalkleuren onaangeroerd |
| Room | lokale snapshot | kaart, niet-actieve bediening en selected depth; actieve lampkleur behouden |
| Appliance Planner | lokale snapshot | kaart, formvelden en niet-geselecteerde opties; donkere native date/time controls volgen color-scheme |
| Scene Engine | afzonderlijke frontend-snapshot, broncommit `c634fcb` | kaart, reset/annuleren en dialogshadow; bevestigings-/foutkleur en resetgedrag behouden; geen backendwijziging |
| House | expliciet uitgesloten | geen source-/standalonewijziging; alleen bestaande collectieregressies, geen nieuwe House-proef/deploy |

## Thema-contract
- Nieuw: `shared/card-theme.js`. Alleen door iedere kaart expliciet opgegeven semantische selectors in de eigen shadow root. Geen document-/globale selector, geen algemene buttonoverride, geen services, observers, timings of datawijzigingen.
- Normaal HA: achtergrond, tekst, radius en buitenste shadow volgen de HA-variabelen; geen materiaalgradient, palet of materiaaldepth als fallback. De oude onvoorwaardelijke controls/metric-shadows worden op de gemigreerde rollen door optionele themadepth vervangen.
- Materiaal: `themes/eleven_material.yaml` behoudt **alle** goedgekeurde House-velden inclusief EM_*-recipes ongewijzigd en voegt vijf CSS-ready rollen toe: control-background, control-hover-background, control-shadow, surface-shadow, plot-background. Public HA-tokens bepalen buitenoppervlak, de bestaande public material-rollen bepalen de interne diepte. Geen achtergrondafbeeldingen.
- Reading-wells behouden hun functionele tint/gradient; alleen diepte/radius verandert. Geselecteerde/actieve controls behouden hun oorspronkelijke functionele kleuren. Plotpixels, sensorkleuren, statuskleuren en SVG fill/stroke worden niet door de helper overschreven.
- CSS-only wisselen en terugschakelen werkt zonder hass-update, remount of JS-adapter. Bestaande House-recipe-adapter blijft ongemoeid.

## Echte uitgevoerde tests
Bewijs onder `qa-evidence/theme-following/`:

| Commando / suite | Uitkomst | Log |
|---|---|---|
| `npm test` | 552 + 74 + 137 tests geslaagd, nul failures | `npm-test.log` |
| `npm run check` | alle collectie/standalone JS syntaxchecks geslaagd, inclusief snapshots | `npm-check.log` |
| `git diff --check` | geslaagd | `diff-check.log` |
| Python `tests/browser-theme-following.py` | 12 viewport/thema-combinaties × 18 renderfixtures = 216 kaartcontroles, nul page errors | `browser-final.log`, `browser-results.json` |
| bestaande `tests/browser-smoke.py` | 1 test geslaagd: duplicate bundle loading, alle twaalf bestaande registraties en editors | `browser-smoke.log` |
| bestaande Shopping `browser_test.py`, source | 24 tests geslaagd | `shopping-source.log` |
| dezelfde Shopping suite met `BUILT=1` | 24 tests geslaagd | `shopping-built.log` |
| bestaande Planner `browser_qa.py` | 28 controles, nul page errors | `planner-browser.log` |
| gekopieerde bestaande Scene frontend `test_card.py` | 18 controles, nul page/console errors en nul externe requests | `scene-browser.log` |

Browsermatrix: native HA licht/donker + Eleven Material licht/donker, elk op 320/390/1280 px. Controleert berekende buitenpaint/radius/shadow, reading/plotdepth, native vlakke controls, scrollbreedtes en datumveld-color-scheme. Extra: vier CSS-only themawissels met behoud van dezelfde kaartnodes; forced-colors zonder kaartshadow; gelijkblijvende ingestelde grafiek-, sparkline- en heatmapkleuren; echte keyboard-tooltipreactie op vier grafiekkaarten, More Info en zichtbare Weather/EVCC-tabselectie. Shopping en Scene behouden hun bestaande uitgebreide loading/error/pending/focus-/touch-/confirmationchecks. Er is **geen** claim dat alle mogelijke configuraties en toestanden in alle themacombinaties zijn afgedekt.

TDD-bewijs: `tdd-red.log` → `tdd-green.log`, `adoption-red.log`, `local-cards-red.log`, `controls-red.log`, `planner-scheme-red.log`, `sensor-tint-red.log`, `heatmap-red.log`, `scene-red.log`; de finale groene suites staan hierboven. Initiële testharnasproblemen (oude browserlocatie, onjuiste synthetic config, ontbrekende source-fixture dependency en niet-in-beeld keyboardtarget) zijn opgelost, niet als productfout of fictieve testpass verhuld. Source-fixtures gebruiken de echte gedeelde helper, geen mock die gedrag wegtest.

## Screenshots en visuele controle
Iedere finale renderfixture heeft een screenshot: `qa-evidence/theme-following/<kaart>-<ha|material>-<light|dark>-<320|390|1280>.png`. Vier collectiebeelden heten `collection-<ha|material>-<light|dark>-1280.png`.

Daadwerkelijk visueel bekeken: collectie native licht en materiaal licht op desktop; Weather native licht 320 en materiaal donker 320; Controls materiaal licht 320; Heatmap materiaal donker 390; Scene Engine materiaal licht 390; History materiaal donker 320; Planner materiaal donker 320, na correctie van native datum/tijd-iconen. Geen nieuwe layoutclipping op deze bekeken kaarten. Forecast/heatmap hebben hun bestaande bedoelde horizontale scrollers.

**Dit zijn lokale synthetische HA-fixtures met een vereenvoudigde ha-card-shell, geen geauthenticeerde Home Assistant-tests.** HA's native ha-icon-lader is niet nagebootst; native iconmarkup blijft aanwezig maar sommige control-iconen zijn in de screenshots leeg. Grafiek-SVG en weersillustraties zijn echt uit de bundles. Geen echte telefoon/softwaretoetsenbordtest of volledige accessibilitycertificering.

## Levering en exacte bestanden
- Alle gewijzigde/getrackte paden, nieuw aangemaakte bestanden, verschillen tegenover de drie snapshotbronnen en de Scene-bron, plus bewijs van behouden originelen: `docs/THEME-FOLLOWING-FILES.json`.
- Productiecentrale helpers: `shared/card-theme.js`, `themes/eleven_material.yaml`.
- Kaartadapters: betreffende `cards/*/src/*.js`; Scene zit onder `cards/scene-engine-card/frontend/`. Builders nemen de helper privé op in hun eigen standalone. Bestaande gedeelde primitives zijn niet aangepast, zodat House ook indirect niet verandert.
- Verificatie/zipgenerator: `scripts/verify-theme-delivery.py`; uitkomst `qa-evidence/theme-following/delivery-verification.json`.
- Reviewartifact: `artifacts/eleven-theme-following-local.zip`: **15 zelfstandige bundles voor 17 niet-House-kaarttypen**, optioneel thema en verificatiedocumenten; geen House-bundle en geen gecombineerde collectie. Zip wordt teruggelezen en iedere entry-hash wordt tegen de echte output gecontroleerd.

## Open / niet uitgevoerd
Geen kaart-specifieke implementatieblokker in de lokale geteste scope. Wel nog open: review/merge met de actuele werkbranches, gezamenlijke native HA-acceptatie met echte data en volledige editors/statusvarianten, aparte toestemming voor publicatie/installatie. De dirty hoofdwerkmap is niet de basis voor directe artifactinstallatie; dit werk is bewust op de nieuw opgehaalde develop gebouwd. De lokale snapshotkaarten blijven als zodanig herkenbaar; de Scene Engine backend hoort bij zijn eigen project. Gebruik de House-vrije standalone-zip voor review, niet de gecombineerde collectiebundle om de goedgekeurde House te vervangen.
