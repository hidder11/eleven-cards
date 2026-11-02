# Eleven Cards — visuele audit losse kaarten

## Actuele Actions-follow-up — 1 november 2026
De audit hieronder is historische baseline, geen actueel oordeel over alle latere verfijningen. De gebruiker heeft Weather expliciet goedgekeurd en kiest nu Scènes en acties (niet Auto/Scene Engine). Verse echte browserinspectie vond een 18px/650 kop en één verticale 84px actie in een vaste derde kolom. Alleen Actions lokaal verfijnd: rustige kop, 56px horizontale doelen met 12px glyphruimte, één responsieve groep en gemeten volledige-woordfit bij grotere tekst. Pending-focusverlies, te smalle vergrote labels en observer-reconnect eerst rood gereproduceerd en gerepareerd. Bron: Home Controls `standalone-cards.js`; Controls/Waste-markup exact beschermd. Bewijs en grenzen: `qa-evidence/actions-refinement/` en bovenaan `VISUAL-FIXES.md`. Gallery: 18 voorbeelden / acht goedgekeurd / tien pending, Weather approved en Actions pending. House apart goedgekeurd/uitgesloten. Geen HA-deployment; authentieke HA/Safari/fysieke acceptatie en gebruikersreview van Actions blijven open.


Opvolging: de oorspronkelijke waarnemingen hieronder blijven als auditbaseline bewaard. Gerichte reparaties, hertests en de nog open ontwerpobservatie VIS-06 staan in `VISUAL-FIXES.md`. Dit is geen gebruikersgoedkeuring van de ontwerpen.

Datum: 2026-10-30T20:47+01:00

Status: uitsluitend onderzoek en vastlegging. Geen kaartbron, build, thema, previewbestand of Home Assistant-configuratie gewijzigd. Geen goedkeuring van afzonderlijke kaartontwerpen impliceren.

## Reikwijdte en oordeel

Alle 18 voorbeelden gecontroleerd: 17 kaarttypen, Auto en EVCC apart. 108 individuele viewportopnamen: 1280, 390 en 320px breed, steeds licht en donker. Iedere kaart is vóór de definitieve opname in beeld gescrold; er is niet alleen op full-page captures vertrouwd.

16 vastgelegde bevindingen: 11 medium, 3 low, 2 high. Ontwerp-/UX-observaties en previewproblemen staan expliciet los van harde kaartfouten.

De twee hoge prioriteiten zijn de botsende prijsannotaties en overlap van het auto-icoon op smal mobiel. Daarna: uniforme selectie, accentafhandeling, bediening en responsieve labels. Geen herstel uitgevoerd.

Bronnen: de centrale STYLING-GUIDE.md in eleven-liquid-refined en de bestaande reviewfixture. De share-server serveert /cards/ uit exact deze worktree; zie eleven-share/server.py. De definitieve audit is lokaal uitgevoerd op diezelfde bestanden via een tijdelijke localhost-server. Er is geen echte HA-runtime of live sensorverbinding gebruikt. De drie vastgelegde bronhashes zijn na afloop ongewijzigd.

## Wat expliciet niet als fout is meegeteld

De Heatmap is niet leeg en Energiestromen blijft niet aantoonbaar hangen op laden. Bij het daadwerkelijk in beeld scrollen verschijnen de data. Vroege full-page beelden waren hiervoor niet betrouwbaar. Ook de schijnbare rechterrandafsnijding in eerste contactvellen was een scrollbar-/captureartefact; die beelden zijn niet als definitief bewijs gebruikt.

Een focusring na toetsenbordbediening is niet hetzelfde als een geselecteerde toestand. Functionele grafiek-, status- en categoriekleuren hoeven niet het selectieaccent te volgen. Native datum/tijdweergave hangt mede van browserlocale af. Voor contrast is geen numerieke WCAG-meting uitgevoerd; visuele indrukken worden niet als meetresultaat gepresenteerd.

## Kaart voor kaart

### 1. Historie (history-graph-card)

Bevindingen: VIS-01, VIS-03, VIS-04, VIS-05, VIS-06

Periodepopup daadwerkelijk geopend en apart vastgelegd. Zoom-/navigatieknoppen beoordeeld op uiterlijk; niet alle zoom- en exportflows functioneel uitgeput.

Beeld: [390 licht](../qa-evidence/visual-audit/history-graph-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/history-graph-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/history-graph-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/history-graph-card-1280-dark.png)

### 2. Staafgrafiek (bar-chart)

Bevindingen: VIS-01, VIS-03, VIS-04, VIS-07

Het afwijkende tijdbereik is een previewbevinding; pas met representatieve data een ontwerpbesluit nemen.

Beeld: [390 licht](../qa-evidence/visual-audit/bar-chart-390-light.png) · [390 donker](../qa-evidence/visual-audit/bar-chart-390-dark.png) · [320 licht](../qa-evidence/visual-audit/bar-chart-320-light.png) · [desktop donker](../qa-evidence/visual-audit/bar-chart-1280-dark.png)

### 3. Tijdlijn (timeline-card)

Bevindingen: VIS-01, VIS-03, VIS-04, VIS-05, VIS-08

De grote lege onderruimte is mede door de reviewcontainer veroorzaakt, niet als bewezen eigen kaarthoogtefout in HA behandelen.

Beeld: [390 licht](../qa-evidence/visual-audit/timeline-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/timeline-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/timeline-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/timeline-card-1280-dark.png)

### 4. Energieprijzen (dynamic-energy-price-card)

Bevindingen: VIS-03, VIS-09, VIS-10

Drempel-/reeks-/waarschuwingskleuren zijn functionele kleuren. Ze niet automatisch naar de selectieaccentkleur omzetten. Geen numerieke contrastclaim gedaan.

Beeld: [390 licht](../qa-evidence/visual-audit/dynamic-energy-price-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/dynamic-energy-price-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/dynamic-energy-price-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/dynamic-energy-price-card-1280-dark.png)

### 5. Sensoroverzicht (overview-card)

Bevindingen: VIS-11

De meetvlakken en sparklines zijn zichtbaar in beide modi. Buiten de smalle titelkop geen duidelijke blokkerende visuele fout gevonden in deze fixture.

Beeld: [390 licht](../qa-evidence/visual-audit/overview-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/overview-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/overview-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/overview-card-1280-dark.png)

### 6. Heatmap (heatmap-card)

Bevindingen: VIS-01, VIS-03, VIS-04, VIS-12

Matrix toont wel data na scrollen in beeld. De eerdere lege matrix in een volledige paginascreenshot is verworpen als capture-/lazy-renderartefact. Horizontaal scrollen is niet als dataverlies aangemerkt.

Beeld: [390 licht](../qa-evidence/visual-audit/heatmap-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/heatmap-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/heatmap-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/heatmap-card-1280-dark.png)

### 7. Agenda (calendar-card)

Bevindingen: VIS-03

De basisagenda toont complete voorbeeldafspraken. Kleine bediening valt onder VIS-03; geen extra overlap gevonden. Kalenderkleuren zijn functioneel en niet gelijk aan selectieaccent.

Beeld: [390 licht](../qa-evidence/visual-audit/calendar-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/calendar-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/calendar-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/calendar-card-1280-dark.png)

### 8. Weer (weather-card)

Bevindingen: VIS-01, VIS-02, VIS-03, VIS-13

Ook Per dag bekeken. De hero-layout en hoeveelheid witruimte blijven ontwerpbeoordeling, niet automatisch een fout. Langere toekomstige weersomschrijvingen niet volledig geïnventariseerd.

Beeld: [390 licht](../qa-evidence/visual-audit/weather-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/weather-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/weather-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/weather-card-1280-dark.png)

### 9. Auto (car-card)

Bevindingen: VIS-14, VIS-15

Het grijze autosymbool is preview-/placeholderbeeld, geen bewijs van ontbrekende productieafbeelding. De cijfers en labels zijn synthetisch; de smalle overlap en getalbreuk zijn wel zichtbaar.

Beeld: [390 licht](../qa-evidence/visual-audit/car-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/car-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/car-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/car-card-1280-dark.png)

### 10. Energiestromen (energy-flow-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Het stroomdiagram is na daadwerkelijk in beeld scrollen gevuld. De eerdere laadweergave op een full-page capture is verworpen. In deze toestand geen duidelijke blokkerende visuele fout aangetoond. Langere entiteitsnamen en extra stromen nog niet getest.

Beeld: [390 licht](../qa-evidence/visual-audit/energy-flow-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/energy-flow-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/energy-flow-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/energy-flow-card-1280-dark.png)

### 11. Scene Engine (scene-engine-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Standaardweergave en open Details bekeken. Geen duidelijke blokkerende visuele fout in deze fixture. De technische detailvelden zijn een inhoudelijk UX-bespreekpunt, niet als stylingbug geteld. Reset niet uitgevoerd.

Beeld: [390 licht](../qa-evidence/visual-audit/scene-engine-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/scene-engine-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/scene-engine-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/scene-engine-card-1280-dark.png)

### 12. Scènes en acties (actions-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Standaardweergave bekeken in alle zes weergavecombinaties. Geen duidelijke blokkerende visuele fout aangetoond. Geen scènes of acties uitgevoerd; de individuele styling is daarmee niet goedgekeurd.

Beeld: [390 licht](../qa-evidence/visual-audit/actions-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/actions-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/actions-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/actions-card-1280-dark.png)

### 13. Bediening (controls-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Standaardweergave bekeken; de hoofdknoppen hebben in de fixture 44px hoogte. Aan/Uit-labels bij de huidige toestand zijn niet zonder bewijs als fout bestempeld. Geen echte bediening getest.

Beeld: [390 licht](../qa-evidence/visual-audit/controls-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/controls-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/controls-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/controls-card-1280-dark.png)

### 14. Afvalinzameling (waste-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Standaardweergave bekeken in alle zes combinaties. Geen duidelijke blokkerende visuele fout aangetoond. Afvalkleuren zijn categoriekleuren en hoeven niet het selectieaccent te volgen.

Beeld: [390 licht](../qa-evidence/visual-audit/waste-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/waste-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/waste-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/waste-card-1280-dark.png)

### 15. Woonkamer (room-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Standaardweergave bekeken; geen duidelijke blokkerende visuele fout aangetoond. Geen lange kamernamen, uitgebreide states of extra sensoren doorgelicht.

Beeld: [390 licht](../qa-evidence/visual-audit/room-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/room-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/room-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/room-card-1280-dark.png)

### 16. Apparatenplanner (appliance-planner)

Bevindingen: VIS-16

Details open bekeken. De browser toont native datum/tijd in een Engelstalig browserprofiel (o.a. AM/PM); dit is als omgevingsafhankelijk aandachtspunt genoteerd, niet als bewezen HA-lokalisatiefout. Geen planning opgeslagen.

Beeld: [390 licht](../qa-evidence/visual-audit/appliance-planner-390-light.png) · [390 donker](../qa-evidence/visual-audit/appliance-planner-390-dark.png) · [320 licht](../qa-evidence/visual-audit/appliance-planner-320-light.png) · [desktop donker](../qa-evidence/visual-audit/appliance-planner-1280-dark.png)

### 17. Auto met EVCC (car-evcc)

Bevindingen: VIS-01, VIS-02, VIS-03

Ook Laadsessie bekeken. Onbekend/Geen laadsessie is een fixturestatus, geen bewezen productiefout. Onderstreping, primary/accent en kleine controls zijn wel gemeten. Geen laadmodus geschakeld.

Beeld: [390 licht](../qa-evidence/visual-audit/car-evcc-390-light.png) · [390 donker](../qa-evidence/visual-audit/car-evcc-390-dark.png) · [320 licht](../qa-evidence/visual-audit/car-evcc-320-light.png) · [desktop donker](../qa-evidence/visual-audit/car-evcc-1280-dark.png)

### 18. Boodschappen (shopping-card)

Geen duidelijke blokkerende visuele fout aangetoond in de gecontroleerde toestanden.

Ook bewerkrij voor Melk geopend. Velden en opslaan/verwijderen blijven in beeld op de vastgelegde mobiele toestand. Native checkboxvormgeving is een mogelijk ontwerpbespreekpunt, niet zonder accent-/targetmeting als fout geteld. Niets toegevoegd, verwijderd of opgeslagen.

Beeld: [390 licht](../qa-evidence/visual-audit/shopping-card-390-light.png) · [390 donker](../qa-evidence/visual-audit/shopping-card-390-dark.png) · [320 licht](../qa-evidence/visual-audit/shopping-card-320-light.png) · [desktop donker](../qa-evidence/visual-audit/shopping-card-1280-dark.png)

## Bevindingenregister

### VIS-01 — Selecties gebruiken nog onderstrepingen en harde randen

Prioriteit: medium · Soort: styling · Kaarten: history-graph-card, bar-chart, timeline-card, heatmap-card, weather-card, car-evcc

Waargenomen: De geopende periodekiezer gebruikt een cyaan selectierechthoek en onderstreepte tab. Weer en EVCC gebruiken een onderstreepte actieve tab.

Verwacht / beoordelingsbasis: Volgens de goedgekeurde basis: selectie via tint en accenttekst/-icoon, zonder onderlijntje. De afzonderlijke kaartontwerpen zijn nog niet goedgekeurd.

Reproduceren: Open Tijdvak bij een grafiek; bekijk Per uur bij Weer en Bediening bij EVCC.

Bewijs: [menu-history-graph-card-light.png](../qa-evidence/visual-audit/menu-history-graph-card-light.png) · [menu-bar-chart-dark.png](../qa-evidence/visual-audit/menu-bar-chart-dark.png) · [menu-timeline-card-light.png](../qa-evidence/visual-audit/menu-timeline-card-light.png) · [menu-heatmap-card-dark.png](../qa-evidence/visual-audit/menu-heatmap-card-dark.png) · [weather-card-390-light.png](../qa-evidence/visual-audit/weather-card-390-light.png) · [car-evcc-390-dark.png](../qa-evidence/visual-audit/car-evcc-390-dark.png)

### VIS-02 — Actieve tabs volgen primary in plaats van accent

Prioriteit: medium · Soort: theme · Kaarten: weather-card, car-evcc

Waargenomen: Bij een tijdelijke accentoverride naar #a86ae0 blijven actieve tekst en 2px onderrand rgb(3,169,244), gelijk aan primary #03a9f4. Gereproduceerd in licht en donker.

Verwacht / beoordelingsbasis: De overeengekomen selectieaccenten volgen accent-color. Functionele status- en datakleuren blijven apart.

Reproduceren: Wijzig uitsluitend --accent-color in de synthetische fixture; lees de berekende stijl van aria-selected=true.

Bewijs: [interactions.json](../qa-evidence/visual-audit/interactions.json)

### VIS-03 — Bediening heeft uiteenlopende, vaak kleine doelvlakken

Prioriteit: medium · Soort: interaction-sizing · Kaarten: history-graph-card, bar-chart, timeline-card, heatmap-card, calendar-card, weather-card, car-evcc, dynamic-energy-price-card

Waargenomen: Gemeten elementhoogtes omvatten 32px grafiekbediening, 36px Weertabs, ongeveer 37,6px EVCC-tabs en 34px EVCC-modusknoppen. Grafieklegenda's en agendafilter zijn nog kleiner. Andere kaarten gebruiken wel 44px knoppen.

Verwacht / beoordelingsbasis: De stylingguide noemt 44px als basis voor bediening. Een kleiner zichtbaar icoon kan wel, als het werkelijke klikdoel voldoende groot is. Hier zijn de elementrectangles gemeten; geen algemene WCAG-afkeur op basis van alleen de hoogte.

Reproduceren: Vergelijk controls in measurements.json bij width_class 390; bekijk bijbehorende screenshots.

Bewijs: [measurements.json](../qa-evidence/visual-audit/measurements.json) · [weather-card-390-light.png](../qa-evidence/visual-audit/weather-card-390-light.png) · [car-evcc-390-light.png](../qa-evidence/visual-audit/car-evcc-390-light.png) · [calendar-card-390-dark.png](../qa-evidence/visual-audit/calendar-card-390-dark.png)

### VIS-04 — Periodelabel wordt op smal mobiel afgekapt

Prioriteit: medium · Soort: responsive · Kaarten: history-graph-card, bar-chart, timeline-card, heatmap-card

Waargenomen: Op 320px vensterbreedte verliest de knop zichtbaar een deel van Standaard (24 uur) of Standaard (168 uur). De huidige duur is daardoor niet meer direct leesbaar.

Verwacht / beoordelingsbasis: Een compacte maar herkenbare periodeweergave, zonder de essentiële duur weg te ellipseren.

Reproduceren: Open de preview op 320px breedte en bekijk de gesloten periodeknoppen.

Bewijs: [history-graph-card-320-light.png](../qa-evidence/visual-audit/history-graph-card-320-light.png) · [bar-chart-320-dark.png](../qa-evidence/visual-audit/bar-chart-320-dark.png) · [timeline-card-320-light.png](../qa-evidence/visual-audit/timeline-card-320-light.png) · [heatmap-card-320-dark.png](../qa-evidence/visual-audit/heatmap-card-320-dark.png)

### VIS-05 — Tijdas maakt de daggrens onvoldoende duidelijk

Prioriteit: medium · Soort: information · Kaarten: history-graph-card, timeline-card

Waargenomen: Bij het getoonde 24-uursbereik hebben het begin en einde hetzelfde tijdstip zonder datum op de as. Het gesloten periodelabel noemt de duur, niet de concrete begindag.

Verwacht / beoordelingsbasis: De grens tussen twee dagen moet herkenbaar blijven zonder de periodepopup te openen.

Reproduceren: Bekijk de x-as van Historie en Tijdlijn in de standaard 24-uursstand.

Bewijs: [history-graph-card-390-light.png](../qa-evidence/visual-audit/history-graph-card-390-light.png) · [timeline-card-390-dark.png](../qa-evidence/visual-audit/timeline-card-390-dark.png)

### VIS-06 — Veel bediening vóór de eigenlijke grafiek

Prioriteit: low · Soort: design-observation · Kaarten: history-graph-card

Waargenomen: Periode/navigatie en zoom-/actieknoppen vormen aparte regels; daaronder staan opnieuw legenda en waarden. Vooral op smal mobiel is de kop relatief druk.

Verwacht / beoordelingsbasis: Compacte grafiekkaarten moeten de plotruimte prioriteit geven. Dit is een ontwerpobservatie, geen bewezen functionele fout of automatisch akkoord op een nieuw ontwerp.

Reproduceren: Vergelijk de verhouding tussen kop/bediening en plot op 320px en 390px.

Bewijs: [history-graph-card-320-light.png](../qa-evidence/visual-audit/history-graph-card-320-light.png) · [history-graph-card-390-dark.png](../qa-evidence/visual-audit/history-graph-card-390-dark.png)

### VIS-07 — Staafgrafiekdemo toont een ander tijdbereik dan de periodeknop

Prioriteit: medium · Soort: preview-data · Kaarten: bar-chart

Waargenomen: De periodeknop zegt Standaard (24 uur), terwijl de zichtbare x-as ongeveer één uur bestrijkt. Dit is aangetoond in de synthetische preview; de precieze oorzaak in fixture of kaartverwerking is nog niet vastgesteld.

Verwacht / beoordelingsbasis: Voorbeelddata en ingestelde tijdsduur moeten overeenstemmen voordat het grafiekontwerp wordt beoordeeld. Niet bewezen dat dit met echte HA-data ook optreedt.

Reproduceren: Vergelijk periodeknop met de begin- en eindtijd onder de staven.

Bewijs: [bar-chart-390-light.png](../qa-evidence/visual-audit/bar-chart-390-light.png) · [menu-bar-chart-light.png](../qa-evidence/visual-audit/menu-bar-chart-light.png)

### VIS-08 — Tijdlijn krijgt onnodig veel lege kaarthoogte

Prioriteit: medium · Soort: preview-layout · Kaarten: timeline-card

Waargenomen: Onder de ene tijdlijn en legenda blijft een groot leeg vlak staan. De reviewpagina forceert voor data-chart-kaarten 440px hoogte.

Verwacht / beoordelingsbasis: Een kaart met één tijdlijn moet compact beoordeeld kunnen worden. De vaste hoogte is aantoonbaar een previewkeuze; niet als intrinsieke HA-kaartfout rapporteren.

Reproduceren: Bekijk Tijdlijn en de CSS article>[data-chart]{height:440px} in review/index.html.

Bewijs: [timeline-card-1280-light.png](../qa-evidence/visual-audit/timeline-card-1280-light.png) · [timeline-card-390-dark.png](../qa-evidence/visual-audit/timeline-card-390-dark.png)

### VIS-09 — Nu-label botst met prijsreferentie

Prioriteit: high · Soort: label-collision · Kaarten: dynamic-energy-price-card

Waargenomen: Rechtsboven in het plot staan Nu en 40,00 ct op of zeer dicht tegen elkaar bij de kruising van de huidige-tijdlijn en prijsreferentie. Daardoor zijn beide annotaties niet rustig apart leesbaar.

Verwacht / beoordelingsbasis: Annotaties moeten elkaar vermijden of met voldoende afstand worden geplaatst.

Reproduceren: Bekijk de rechterbovenhoek van het prijsplot met de huidige fixture.

Bewijs: [dynamic-energy-price-card-390-light.png](../qa-evidence/visual-audit/dynamic-energy-price-card-390-light.png) · [dynamic-energy-price-card-390-dark.png](../qa-evidence/visual-audit/dynamic-energy-price-card-390-dark.png) · [dynamic-energy-price-card-320-light.png](../qa-evidence/visual-audit/dynamic-energy-price-card-320-light.png)

### VIS-10 — Tijdlabels op de smalle prijsas staan te dicht op elkaar

Prioriteit: medium · Soort: responsive · Kaarten: dynamic-energy-price-card

Waargenomen: Op 320px zijn opeenvolgende tijdlabels nauwelijks van elkaar gescheiden; de as leest als een druk doorlopend lint.

Verwacht / beoordelingsbasis: Op smalle kaarten minder ticks of een andere labelverdeling, zonder nieuwe overlap.

Reproduceren: Vergelijk de x-as op 320px met 390px en desktop.

Bewijs: [dynamic-energy-price-card-320-light.png](../qa-evidence/visual-audit/dynamic-energy-price-card-320-light.png) · [dynamic-energy-price-card-320-dark.png](../qa-evidence/visual-audit/dynamic-energy-price-card-320-dark.png)

### VIS-11 — Periode in overzichtskop breekt op onrustige wijze af

Prioriteit: low · Soort: responsive · Kaarten: overview-card

Waargenomen: Bij de lange titel Sensoroverzicht (beta) komt 24 uur op smal mobiel op twee regels te staan aan de rechterkant.

Verwacht / beoordelingsbasis: Een bewust ingedeelde compacte kop. De beta-toevoeging is fixture-/titelinhoud, dus ook met een gebruikelijke productietitel opnieuw beoordelen.

Reproduceren: Bekijk de kop op 320px breedte.

Bewijs: [overview-card-320-light.png](../qa-evidence/visual-audit/overview-card-320-light.png) · [overview-card-320-dark.png](../qa-evidence/visual-audit/overview-card-320-dark.png)

### VIS-12 — Het volledige etmaal is alleen via horizontaal scrollen te zien

Prioriteit: low · Soort: ux-observation · Kaarten: heatmap-card

Waargenomen: Alleen de eerste uurkolommen zijn direct zichtbaar op mobiel en de laatste zichtbare kolom loopt tegen de rand. In beeld staat geen expliciete veegindicatie. Er is geen bewijs van dataverlies; horizontale navigatie kan een geldige ontwerpkeuze zijn.

Verwacht / beoordelingsbasis: Het moet begrijpelijk zijn hoe de overige uren bereikbaar zijn. Dit is een beoordeelpunt, geen claim dat de matrix niet werkt.

Reproduceren: Bekijk Heatmap op 320/390px en vergelijk de zichtbare uren met een volledig etmaal.

Bewijs: [heatmap-card-320-light.png](../qa-evidence/visual-audit/heatmap-card-320-light.png) · [heatmap-card-390-dark.png](../qa-evidence/visual-audit/heatmap-card-390-dark.png)

### VIS-13 — Weermetrics vallen op smal mobiel onrustig uiteen

Prioriteit: medium · Soort: responsive · Kaarten: weather-card

Waargenomen: De lange weersstatus wordt over regels verdeeld; ook waarden en eenheden in de smalle metricvakken krijgen een andere regelindeling. Hierdoor hebben de drie vakken geen rustige gemeenschappelijke hiërarchie.

Verwacht / beoordelingsbasis: Labels, waarden en eenheden moeten bij een smalle kaart herkenbaar gegroepeerd blijven. Horizontaal scrollende weersverwachting is niet op zichzelf als fout geteld.

Reproduceren: Vergelijk de drie metricvakken onder de temperatuur op 320px en 390px.

Bewijs: [weather-card-320-light.png](../qa-evidence/visual-audit/weather-card-320-light.png) · [weather-card-320-dark.png](../qa-evidence/visual-audit/weather-card-320-dark.png) · [weather-card-390-light.png](../qa-evidence/visual-audit/weather-card-390-light.png)

### VIS-14 — Auto-icoon overlapt samenvatting op smal mobiel

Prioriteit: high · Soort: overlap · Kaarten: car-card

Waargenomen: Op 320px ligt het grote auto-icoon over het tekstgebied onder de accuwaarde; in de smalle kaart is de tekst daardoor niet vrij leesbaar.

Verwacht / beoordelingsbasis: De hero-afbeelding en samenvatting moeten een eigen, niet-overlappend gebied houden.

Reproduceren: Open Auto op 320px vensterbreedte en bekijk het gebied direct onder de 62.

Bewijs: [car-card-320-light.png](../qa-evidence/visual-audit/car-card-320-light.png) · [car-card-320-dark.png](../qa-evidence/visual-audit/car-card-320-dark.png)

### VIS-15 — Kilometergetal breekt midden in de waarde af

Prioriteit: medium · Soort: responsive · Kaarten: car-card

Waargenomen: Het grote getal in het onderste linker metricvak wordt op 320px midden in de cijfers over twee regels gebroken. Daarnaast is de demo semantisch verwarrend: een kilometerstandachtig getal wordt als Actieradius getoond.

Verwacht / beoordelingsbasis: Getallen niet midden in de waarde afbreken; fixtures moeten kilometerstand en actieradius correct onderscheiden. De databetekenis is hier een previewprobleem, geen bewezen verkeerde HA-sensorbinding.

Reproduceren: Bekijk het onderste linker metricvak op 320px.

Bewijs: [car-card-320-light.png](../qa-evidence/visual-audit/car-card-320-light.png) · [car-card-320-dark.png](../qa-evidence/visual-audit/car-card-320-dark.png)

### VIS-16 — Geselecteerde dag gebruikt afwijkende tekstselectie

Prioriteit: medium · Soort: styling · Kaarten: appliance-planner

Waargenomen: Morgen is aria-pressed=true, maar blijft secundair gekleurd en is onderstreept. Andere kaartselecties gebruiken cyaan en/of een ingedrukt vlak.

Verwacht / beoordelingsbasis: De gekozen dag moet dezelfde overeengekomen selectiehiërarchie volgen: tint plus accent, zonder onderstreping.

Reproduceren: Bekijk Vandaag/Morgen in de Apparatenplanner en vergelijk de berekende stijlen in measurements.json.

Bewijs: [appliance-planner-390-light.png](../qa-evidence/visual-audit/appliance-planner-390-light.png) · [appliance-planner-390-dark.png](../qa-evidence/visual-audit/appliance-planner-390-dark.png) · [measurements.json](../qa-evidence/visual-audit/measurements.json)

## Testgrenzen en vervolg

Naast de 108 basisopnamen zijn negen soorten aanvullende UI-toestanden in beide thema’s bekeken: vier periodepopups, Weer Per dag, EVCC Laadsessie, Scene Engine Details, Apparatenplanner Details en Boodschappen bewerken. De vier periodepopups zijn opnieuw apart opgenomen met expliciete zichtbaarheidscontrole (8 van 8 zichtbaar), omdat vroege interactieopnamen soms tijdens een rerender sloten. Die vroege menuopnamen zijn niet het definitieve menubewijs.

Playwright registreerde tijdens de capture-run geen pageerror. Dit is geen volledige console-/netwerk-/functionele testdekking en geen vervanging voor visuele inspectie. Geen productie-HA, mobiele fysieke apparaten, schermlezer, 200% tekstvergroting, alle configuratievarianten, alle entiteitsnamen of alle kaarteditors getest. Geen acties, lampen of laadtoestanden aangestuurd.

Volgende implementatievolgorde als daarvoor opdracht komt: eerst gedeelde selectie/knopbasis; daarna Historie afzonderlijk beoordelen; vervolgens per kaart de aangetoonde problemen aanpakken en opnieuw tonen. Dit rapport machtigt geen implementatie en keurt geen nieuwe layouts goed.

## Bestanden

Bevindingen: ../qa-evidence/visual-audit/findings.json
Metingen: ../qa-evidence/visual-audit/measurements.json
Menus met zichtbaarheidassertie: ../qa-evidence/visual-audit/menus-verified.json
Samenvatting en bronhashes: ../qa-evidence/visual-audit/summary.json
Herhaalbare capture: ../artifacts/visual-audit/capture.py
Gerichte menucontrole: ../artifacts/visual-audit/check-menus.py
