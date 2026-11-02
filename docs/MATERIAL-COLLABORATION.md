# Eleven Cards — Material samenwerking

Branch: `feat/eleven-material-collaboration`, gebaseerd op develop `5bdd44b`.
Dit is de huidige werkstand, geen afgeronde release. Main/develop en Home Assistant zijn niet gewijzigd.

## Inhoud en start

- `themes/eleven_material.yaml`: optioneel Eleven Material-thema. Zonder dit thema volgen de kaarten normale Home Assistant-styling.
- `shared/card-theme.js`: thema-adapters voor de kaarten; kaartindeling en functionele kleuren blijven apart.
- `cards/`: huidige bronnen, tests en standalonebundels; `dist/eleven-cards.js`: huidige samengestelde previewbundle.
- `review/`: bestaande gedeelde collectiepreview, met synthetische data en actuele goedgekeurd/te-beoordelen-groepen. House is hier bewust uitgesloten.
- `experiments/material-house/`: afzonderlijke goedgekeurde House-pilot, inclusief bron, immutable upstream-inputs en bundle. Niet geïntegreerd in de productie-House of collectie. Herbouw met `python3 experiments/material-house/build.py`.
- `docs/MATERIAL-STYLING-GUIDE.md`: centrale stylingafspraken meegenomen voor samenwerking.
- `docs/MATERIAL-SNAPSHOT.json`: SHA-256 van de oorspronkelijke snapshotbestanden. Alleen de Actions-pariteitstest is daarna overdraagbaar gemaakt; de echte oude bundel staat nu als vaste fixture in `tests/fixtures/actions-before-material-refinement.js` in plaats van in genegeerd lokaal bewijs.

Checkout: `git fetch origin && git switch --track origin/feat/eleven-material-collaboration`.
Preview vanaf de repositoryroot: `python3 -m http.server 8080 --bind 127.0.0.1`, open daarna lokaal `/review/`.
De preview heeft geen Home Assistant-login of verbinding met apparaten nodig. De autoafbeelding is uitsluitend previewmateriaal; geen productieafhankelijkheid.

## Opnieuw gecontroleerd voor overdracht

- `npm run check`: geslaagd.
- Root Node-tests na build: 579 tests, 578 geslaagd, 1 bestaande fout in `tests/collection.test.mjs`: Heatmap sizing zonder shadowRoot (`getCardSize`, querySelector). Niet gerepareerd als onderdeel van deze snapshot.
- Energy: 74 Node-tests en 20 Python-tests geslaagd.
- History: 137 Node-tests geslaagd.
- House-pilot opnieuw gebouwd: exacte oorspronkelijke bundlehash `052c520f4fc2fee3555678a77e62dcf61067e8938dd9ac31cbba598aee376930`.
- `git diff --check`: geslaagd.

Let op: `npm test` bouwt eerst alles, stopt bij de root-testfout en voert daardoor Energy/History niet zelf uit; die zijn hierboven afzonderlijk uitgevoerd.

## Open voor samenwerking

Een volledige rebuild wijzigt momenteel vier bestaande previewbundles: History standalone, Energy Flow standalone/test en de collectie. Voor deze branch zijn bewust de oorspronkelijke previewbytes teruggezet. Dit is een open bron/build-synchronisatiepunt: vervang of publiceer de preview niet blind met een build zonder die verschillen te beoordelen. De bestaande browser-/visuele rapporten beschrijven eerdere lokale controles, niet een nieuwe volledige browsermatrix op deze branch.

Historische documenten en `scripts/verify-*.py` verwijzen soms naar lokale `qa-evidence` of werkmappen. Dat bewijs is niet meegepubliceerd en die verificaties zijn niet allemaal portable. Gebruik de normale bronnen/tests en bovenstaande controles als startpunt.

Respecteer de goedgekeurde House-pilot, het thema en goedgekeurde kaarten. Nog niet goedgekeurde kaartvoorstellen blijven voorstellen; groene tests zijn geen gebruikersgoedkeuring. Geen automatische HA-installatie, release of merge naar develop/main.

## History-popupcorrectie — 2 november 2026

De niet-geselecteerde Standaard-knop gebruikt nu dezelfde thema-eigen controlestijl als de overige periodekeuzes, inclusief hover. Sensorblokken in de informatiepopup krijgen de bestaande well-rol voor inset-schaduw en afronding, met native HA-fallbacks. Selectie, focus, gegevens en configuratie blijven behouden. De mapping geldt alleen voor History; Bar bevat dezelfde basisklasse en is daarom ook opnieuw gebundeld.

Controle: `node tests/browser-history-popup.mjs` (Node 22+, Chrome of `CHROME_PATH`) slaagt voor 12 combinaties van 320/390/1280px, native/Material en licht/donker, inclusief periode kiezen/terugzetten, hover, inset-diepte en toetsenbord/focus. Deze runner maakt geen screenshots. History: 137 Node-tests geslaagd; Energy: 74 Node-tests geslaagd. `npm run check` en `git diff --check` geslaagd. `npm test` blijft steken op de hierboven genoemde bestaande Heatmap-fout (578/579 root-tests); de Python-tests zijn hier niet uitgevoerd.

De collectie is opnieuw samengesteld met de nieuwe History/Bar-bundels. Dit neemt ook de al bestaande History-bron/bundelsynchronisatie mee. De ongerelateerde Energy Flow-buildverschillen zijn beoordeeld en de oorspronkelijke Energy Flow-previewbundels zijn behouden. Alleen lokaal gecontroleerd met voorbeelddata; de openbare preview en Home Assistant zijn niet bijgewerkt.

### Opvolging: informatie-insets en tabbladvoorstellen

Op verzoek geldt de informatie-well nu ook voor Staaf, Tijdlijn en Agenda. De specifieke mapping raakt alleen de sensor-/agendablokken in de informatiepopup. De Standaard-knopcorrectie blijft beperkt tot History. De browserrunner controleert nu 48 popupgevallen: vier kaarten × drie breedtes × native/Material × licht/donker. Alle gevallen slagen. De opnieuw uitgevoerde root-tests hebben dezelfde bestaande Heatmap-fout (578/579); History 137/137 en syntax-/whitespacecontroles slagen.

[Vijf tabbladvarianten](../review/tab-variants.html) zijn afzonderlijke interactieve voorstellen die het bestaande `uiTabs`/`bindUITabs` gebruiken: verbonden strook, dossierlippen, paneelkop, compacte teksttabs en icoon/tekst. Gedeelde productiestijlen en tabbladgedrag zijn hiervoor niet gewijzigd. Start de lokale server zoals hierboven en open `/review/tab-variants.html`. De pagina leest het bestaande themabestand en kan native/Material en licht/donker tonen. DOM-/layoutcontrole slaagt voor alle 60 combinaties van vijf varianten × drie breedtes × twee stijlen × licht/donker, met pijltjestoetsen, Home/End, paneelkoppelingen, 44px-doelen, periodekeuze en overflowcontrole. Geen screenshots gemaakt; visuele gebruikerskeuze staat nog open. De openbare preview is niet bijgewerkt.

Op verzoek zijn zes vervolgvoorstellen toegevoegd: 1A gelijke gecentreerde vakken, 1B gelijke links uitgelijnde vakken, 1C aaneengesloten segmenten, 4A teksttabs over de volle breedte, 4B een compacte tekstgroep en 4C teksttabs met verticale scheidingen. De nieuwe stroken gebruiken gelijke gridkolommen en expliciete tekstuitlijning; bij selectie blijft de tekst op dezelfde hoogte. De eerdere vijf voorstellen blijven uitklapbaar beschikbaar. De 72 nieuwe DOM-/layoutgevallen slagen voor drie breedtes en vier themacombinaties, inclusief gelijke kolommen/hoogte, tekstpassing, toetsenbordbediening en overflow. Alleen de lokale voorstelpagina is aangepast.

De gebruiker kiest 4A als richting. De pagina toont nu vijf subtiele verfijningen (4A-1 t/m 4A-5): evenwichtig, ruimer ritme, compact en stil, zachte scheiding en sterkere teksthiërarchie. Alle vijf behouden gelijke kolommen en gebruiken voor de geselecteerde tab exact dezelfde radius-token als de gewone periodeknoppen. De oorspronkelijke 4A en eerdere voorstellen blijven uitklapbaar beschikbaar. Alle 120 DOM-/layoutgevallen slagen: vijf varianten × drie breedtes × vier themacombinaties × normale/vergrote tabtekst, inclusief radii, tekstpassing, toetsenbordbediening, uitlijning en overflow. Syntax en whitespace gecontroleerd; alleen previewbestanden aangepast, geen productiebundels of screenshots.

### 4A-1 toegepast op goedgekeurde kaarten

Op expliciet verzoek is 4A-1 doorgevoerd in History/Staaf, Tijdlijn, Heatmap, Weer en Auto/EVCC, inclusief eigen voertuig-tabbladen. Het gedeelde `uiBalancedTabsStyles()` is alleen in deze kaarten ingeschakeld. De standaard tabstijl, andere knoppen, laadmodi, configuratie en gegevenslogica zijn behouden. Alle bijbehorende standalone-/testbundels en de collectie zijn herbouwd. De ongerelateerde Energy Flow-previewbundels en House zijn ongewijzigd.

`node tests/browser-history-popup.mjs` slaagt voor 84 tabbladgevallen (zeven kaartvarianten × drie breedtes × vier themacombinaties), inclusief aanvullende controles met vergrote tekst, toetsenbord, paneelkoppelingen, afronding, inset-selectie, ombreken en eigen Auto/EVCC-tabs. Ook alle 48 popupgevallen slagen. `npm test`: dezelfde bestaande Heatmap-fout, 578/579 root-tests; afzonderlijk 137/137 History-tests geslaagd. `npm run check` en `git diff --check` geslaagd. Geen screenshots, openbare publicatie of Home Assistant-installatie; de gewijzigde collectie is lokaal zichtbaar op `/review/`.

### Legenda’s, afzonderlijke tijdknoppen en verbonden tabbladen

Staaf toont de eenheid bij elke legenda-waarde, binnen hetzelfde sensoritem, en gebruikt weer de tweekolomslegenda van History. Tijdlijn toont de toestandslegenda boven de grafiek. History/Staaf, Tijdlijn en Heatmap geven de tijdkiezer en navigatieknoppen ieder hun eigen controlestijl en drukfeedback, met 8px tussenruimte en korte scheidingslijnen. De groep zelf krijgt geen drukschaduw. Gegevens, YAML en periodegedrag blijven behouden.

De lokale voorstelpagina toont vier nieuwe verbonden varianten: A open tab, B verbonden paneel, C zachte uitsparing en D compacte dossierlip. De actieve tab onderbreekt de lijn en sluit direct aan op de inhoud; de eerdere varianten blijven uitklapbaar beschikbaar. Dit zijn voorstellen; de productiekaarten behouden 4A-1 totdat een nieuwe keuze is gemaakt. Alle 144 DOM-/layoutgevallen voor vier varianten, drie selecties, drie breedtes en vier themacombinaties slagen, zonder screenshots.

Validatie van deze opvolging: de browserrunner slaagt voor 48 informatie-/periodepopupgevallen, 84 bestaande tabbladgevallen met vergrote tekst, legenda-eenheden en -positie, en echte muisdruk op de afzonderlijke tijdknoppen van vier grafiektypen. History: 137/137 tests geslaagd na aanpassing van de bestaande Bar-legendaopmaakverwachtingen. `npm run check` en `git diff --check` slagen. `npm test` houdt dezelfde bestaande Heatmap-fout (578/579 root-tests); Python en live Home Assistant zijn niet getest. De gedeelde helper is ook opnieuw ingebed in overige afhankelijke bundels zonder hun opt-in te veranderen. De al gedocumenteerde ongerelateerde Energy Flow-previewbuildverschillen blijven behouden.

Vijf aanvullende A/C-voorstellen staan bovenaan de lokale tabbladpreview: A1 fijne contour, A2 ruimere boog, C1 ondiepe uitsparing, C2 zachte zijwanden en AC1 rustige balans. A–D blijven direct eronder beschikbaar om te vergelijken. Alleen de voorstelpagina en bijbehorende CSS zijn gewijzigd. Alle 360 DOM-/layoutgevallen slagen (vijf varianten × drie selecties × drie breedtes × vier themacombinaties × normale/vergrote tekst), inclusief open aansluiting, paneelkoppelingen, tekstpassing en toetsenbordnavigatie; geen consolefouten of screenshots. Syntax en whitespace gecontroleerd.

Tien extra varianten op A (A3–A12) tonen een klassieke contour, kleinere/rondere/bijna rechte hoeken, compacte en ruimere tabs, tekstbreedte, links uitgelijnde labels, een zachte accentcontour en een steviger neutraal silhouet. De content en actieve tab hebben in deze reeks een transparante achtergrond. De onderste lijn wordt per inactieve tab getekend en blijft open onder de actieve tab, zodat geen gekleurd masker of apart inhoudsvlak nodig is. Eerdere voorstellen blijven uitklapbaar beschikbaar. Alle 720 DOM-/layoutgevallen slagen: tien varianten × drie selecties × drie breedtes × vier themacombinaties × normale/vergrote tekst, plus toetsenbord- en paneelkoppelingen. Geen consolefouten of screenshots; syntax en whitespace gecontroleerd. Alleen preview en dit verslag aangepast.

### A11 doorgevoerd na gebruikerskeuze

A11 vervangt de eerdere 4A-1-opt-in voor History/Staaf, Tijdlijn, Heatmap, Weer en Auto/EVCC, inclusief eigen voertuig-tabbladen. De bovenhoeken volgen nu de gewone knopradiusvariabele (12px in het huidige Material-thema); de onderhoeken zijn recht voor de open aansluiting. De lijn en actieve contour gebruiken de gekozen subtiele accenttint. De tab en het inhoudspaneel blijven transparant. Vier of meer tabs staan in één horizontale rij; de gedeelde selectie houdt de actieve tab zichtbaar zonder paginascroll. De bestaande helpernaam blijft behouden voor compatibiliteit. De A11-preview volgt eveneens de radiusvariabele.

De browserrunner slaagt voor alle 84 goedgekeurde tabbladgevallen en vergrote tekst, waaronder custom Auto/EVCC-tabs, Home/End en pijltjestoetsen, open aansluiting, transparante panelen en een gewijzigde radius van 17px. De 48 popupgevallen en tijdknop-/legendacontroles slagen eveneens. History 137/137; syntax en whitespace geslaagd. De volledige root-testset houdt alleen de bekende Heatmap-fout: 578/579 geslaagd. Geen screenshots, live HA-installatie of publicatie.

Alle afhankelijke bundels zijn opnieuw gegenereerd. Daardoor zijn nu ook de eerder behouden Energy Flow-previewbundels vernieuwd: zij bevatten de gewijzigde gedeelde tabhelper en synchroniseren de al bestaande ingebedde Weather-bronnen. Er zijn geen Energy Flow-bronnen of kaartconfiguraties gewijzigd. De lokale kaartenpreview toont het resultaat op /review/.

### Eén knopbalk met afzonderlijke drukfeedback; Agenda en Weer-voorstellen

De tijdsbalk van History/Staaf, Tijdlijn en Heatmap heeft weer één doorlopende achtergrond en één groepsschaduw. De afzonderlijke native knoppen hebben in rust geen eigen schaduw; alleen het ingedrukte segment krijgt inset-feedback. Scheidingslijnen blijven aanwezig. Dezelfde gedeelde `segmentedControlStyles()` wordt gebruikt voor Agenda-datumnavigatie, met gelijke afronding en minimaal 44px-doelen. De Agenda-legenda gebruikt nu dezelfde rustige tweekolomsindeling als de grafieklegenda’s: plain labels, functionele kleurvlakjes en geen verhoogde/inset-selectie. Verbergen/tonen blijft behouden.

De voorstelpagina toont vijf varianten op de echte Weerkaart: W1 rustiger/lager, W2 compact links, W3 icoon en tekst, W4 zachte inset en W5 gecentreerde groep. Deze erven de productiekaart en wijzigen alleen de tab-CSS; forecasts komen uitsluitend uit synthetische fixturedata. Uur-/dagselectie en themawisseling werken. De productie-Weerkaart houdt de gekozen A11-stijl. De oudere voorstellen blijven uitklapbaar beschikbaar.

Validatie: 240 Weer-layoutgevallen slagen (vijf varianten × twee forecasttypes × drie breedtes × vier thema’s × normale/vergrote tekst), zonder screenshots of consolefouten. De bestaande browserrunner slaagt voor 84 tabgevallen, 48 popups en tijdknopfeedback, aangevuld met 12 Agenda-legenda-/navigatiegevallen met echte muisdruk. De groepsschaduw blijft daarbij stabiel en alleen het actieve segment verandert. Agenda/History 154/154 tests; syntax en whitespace slagen. `npm test` blijft op de bestaande Heatmap-fout (578/579 root-tests). Alle afhankelijke bundels zijn gegenereerd; geen publicatie of live HA-wijziging.

Vijf W4-verfijningen zijn toegevoegd als afzonderlijke Weer-voorstellen: W4-1 dezelfde informatie-inset, W4-2 een 2px-lijn, W4-3 compact links, W4-4 meer ademruimte en W4-5 een iets diepere selectieschaduw. Alle vijf gebruiken `--secondary-background-color` voor de contour en lijn, exact de achtergrondkleur van de informatievlakken. De eerste vier volgen `--eleven-material-well`; de vijfde gebruikt `--eleven-material-selection-well`. Inhoud en tabs behouden hun transparante achtergrond. De bestaande W1–W5 staan uitklapbaar ter vergelijking. Alleen previewbestanden en dit verslag zijn gewijzigd.

Alle 240 DOM-/layoutgevallen slagen (vijf varianten × twee forecasttypes × drie breedtes × vier themacombinaties × normale/vergrote tekst), inclusief gemeten kleur-/schaduwgelijkheid met de informatievlakken, toetsenbordbediening, open aansluiting en forecastwissel. Syntax en whitespace slagen; geen consolefouten of screenshots. De productiekaart is voor deze voorstellen niet gewijzigd.

Vijf extra W4-5-schaduwvoorstellen staan bovenaan: W4-5A evenwichtige inset (bestaand selectierecept), W4-5B strakke bovenrand, W4-5C zachte zijwanden, W4-5D brede zachte inset en W4-5E gelaagde diepte. Alle vijf gebruiken dezelfde duidelijkere 2px-contour in de achtergrondkleur van de informatievlakken. Alleen de schaduw verandert; inhoud blijft transparant en eerdere voorstellen blijven uitklapbaar beschikbaar. Alle 240 DOM-/layoutgevallen slagen voor twee forecasttypes, drie breedtes, vier thema’s en normale/vergrote tekst. De browser bevestigt vijf verschillende insetrecepten per thema, juiste lijnkleur/-dikte, tekstpassing en paneelaansluiting. Syntax en whitespace slagen; geen consolefouten, screenshots of productieaanpassingen.

### Nieuwe ontwerpstart: tien verschillende richtingen

De gebruiker verwerpt de eerdere richting. De lokale vergelijking begint daarom opnieuw met tien verschillende navigatievormen in echte Weerkaarten: schuifschakelaar, onderstreping, zijbalk, losse pillen, dossierlippen, icoontegels, keuzekaarten, typografische selectie, menurijen en een native keuzelijst als alternatief voor tabs. De eerdere studies zijn uit het zicht geplaatst in één ingeklapt archief. Geen productiestijl gewijzigd. De richtingen verschillen in structuur en selectietaal, in plaats van alleen lijn- en schaduwnuances.

Alle 480 DOM-/layoutgevallen slagen voor twee forecasttypes, drie breedtes, vier thema’s en normale/vergrote tekst. Alle tien richtingen slagen ook voor gerichte bediening: pijltjes/Home bij tabs, omhoog/omlaag bij verticale navigatie en behouden focus/forecastwissel bij de native keuzelijst. Syntax en whitespace slagen; geen consolefouten of screenshots.

### 2A-1 doorgevoerd na gebruikerskeuze

2A-1 vervangt A11 in alle goedgekeurde kaarten met tabbladen: History/Staaf, Tijdlijn, Heatmap, Weer en Auto/EVCC, inclusief eigen voertuig-tabbladen. De bestaande gedeelde opt-in levert nu vlakke teksttabs, gelijke breedtes, een neutrale basislijn en een fijne 2px-accentonderstreping voor de selectie. De klikhoogte is minimaal 44px; tekst is 13px/500 en geselecteerd 650. Padding boven 7px, opzij 8px en onder 5px neemt de goedgekeurde optische correctie van 1px naar beneden over. De paneelafstand blijft 16px. Vier of meer tabs blijven horizontaal scrolbaar, met behoud van focus, paneelkoppelingen en bestaande configuratie. De eerdere ontwerpstudies blijven afzonderlijk beschikbaar; de reviewpagina benoemt 2A-1 nu als toegepast.

Alle afhankelijke standalone-/testbundels en de collectie zijn opnieuw gegenereerd. De browserrunner slaagt voor 84 tabbladgevallen (zeven kaartvarianten, drie breedtes en vier themacombinaties), vergrote tekst en toetsenbordnavigatie, plus 48 popups, Agenda-legenda/navigatie en afzonderlijke tijdknopfeedback. De volledige root-testset houdt uitsluitend de bestaande HeatmapCard.getCardSize-fout (578/579 geslaagd); de afzonderlijke History-suite slaagt 137/137. Syntax en whitespace slagen. Geen screenshots, live Home Assistant-test, installatie, commit of publicatie.
