# Consistentiecontrole van de kaarten — 2 november 2026

Scope: de 18 voorbeelden in het lokale kaartenoverzicht (17 kaarttypen, inclusief Auto met en zonder EVCC): 11 goedgekeurde en 7 nog te beoordelen voorbeelden. House staat niet in dit overzicht en is niet opnieuw visueel beoordeeld. De controle gebruikt synthetische gegevens, DOM, berekende stijlen en muis-/toetsenbordinvoer; geen screenshots of live Home Assistant. Kaartbreedtes 320, 390 en 1280px, licht/donker en Material/native geven 216 layoutgevallen. De gecontroleerde hoofdvlakken hebben daarin geen horizontale overloop. Niet alle mogelijke configuraties of fout-/offline-toestanden zijn hiermee getest.

## In deze wijziging hersteld

- Tijd- en Agenda-balken: lichtere scheidingslijnen over de volle hoogte; drukvlakken vullen het segment met alleen aan de buitenrand ronde hoeken.
- Zoom en geschiedenis/informatie in het optiemenu: hetzelfde gedeelde balkrecept en afzonderlijke drukfeedback. De oude oudergroep-`:active`-stijl is uitgesloten, zodat de groepsschaduw blijft staan.
- Geselecteerde tabs: de accentlijn blijft bij echte hover zichtbaar, ook bij Auto/EVCC. Tekst volgt de primaire themakleur van informatiewaarden. Toetsenbordbediening, paneelkoppelingen en horizontaal in beeld houden blijven werken.

## Afgehandelde bevindingen

Alle zeven bevindingen zijn op verzoek gelijkgetrokken. Nieuwe extra correcties: disabled knoppen houden dezelfde scheidingslijnkleur; informatiepopupvlakken gebruiken dezelfde secundaire achtergrondkleur als de weer-/autoinformatie, met dezelfde inset en afronding. De decoratieve kleurtint in de hoek van metriekvlakken blijft behouden.

| Nr. | Kaarten | Oorspronkelijke bevinding | Afhandeling |
| --- | --- | --- | --- |
| 1 | Staaf, Tijdlijn, Heatmap | De niet-geselecteerde knop **Standaard** week af van andere periodeknoppen. | De gedeelde chart-stijl neemt Standaard nu altijd mee; dezelfde rust-/hover-/drukstijl en radius in alle vier grafiektypen. |
| 2 | Heatmap | Het informatieblok had een verhoogde schaduw en 8px radius. | Hetzelfde well-recept als Historie, Staaf, Tijdlijn en Agenda: inset en 15px radius in Material, plus dezelfde achtergrondbasis als de weerinformatie. |
| 3 | Tijdlijn | Kleine sensornamen en smalle toestandssegmenten waren lastig aan te raken. | Sensornamen zijn minimaal 44px hoog. De extra Vorige/Volgende-knoppen zijn op verzoek verwijderd. Bediening via de grafiek en pijltjestoetsen blijft behouden, evenals de nauwkeurige segmentgeometrie en YAML-instellingen. Smalle intervallen blijven hun werkelijke tijdsbreedte houden. |
| 4 | Auto/EVCC | De klikbare actieradius was kleiner dan overige knoppen. | Interactieve ondertitels in het gedeelde primary-value-component hebben nu minimaal 44px hoogte/breedte, ook in andere gebruikers van dit component. Niet-interactieve ondertitels blijven compact. |
| 5 | Bediening, Afvalinzameling, Apparatenplanner, Scene Engine | Titelgroottes en -gewichten weken af. | Kaarttitels gebruiken nu 16px/600, net als de goedgekeurde referenties. Dit wijzigt hun eerdere algemene goedkeuringsstatus niet. |
| 6 | Meerdere kaarten | Binnenruimte varieerde per kaart en schermbreedte. | De 18 voorbeelden gebruiken standaard 16px rondom. Ook mobiele overrides in Bediening/Afval/Planner en de desktop-override in Boodschappen zijn gelijkgetrokken. |
| 7 | Gedeelde tabstijlen en Auto/EVCC | Oude tabregels overlapten de gedeelde opt-in. | De oude Material-tabregels uit de periodehelper, Weather en Auto/EVCC zijn verwijderd. Laadmodusknoppen houden hun eigen actiestijl. |

## Validatie

De browserrunner slaagt voor 84 tabbladgevallen, inclusief echte geselecteerde-hover, vergrote tekst en toetsenbordbediening, plus 60 popups en de afzonderlijke muisdruk in tijd-, zoom-, geschiedenis/informatie- en Agenda-balken. Ook Standaard-pariteit, gelijke informatiekleuren, disabled-lijnen zijn gecontroleerd. De 216 layoutgevallen slagen voor gelijke padding, titeltypografie, klikbare ondertitels en het ontbreken van overloop in de gecontroleerde hoofdvlakken. Na verwijdering van de extra Tijdlijn-knoppen zijn bestaande toetsenbordnavigatie, Escape en de afwezigheid van die knoppen opnieuw gecontroleerd.

De bekende HeatmapCard.getCardSize-fout is hersteld met een guard voor een ontbrekende shadow root. `npm test` slaagt: 579 root-tests, 74 Energy Node-tests, 20 Energy Python-tests en 137 History-tests. Na de laatste desktop-padding- en focuscorrecties slagen bovendien 5 gerichte collectie/Shopping-tests en 31 Tijdlijn-tests. Syntaxcontrole en whitespacecontrole slagen. Alle betrokken bundels zijn gegenereerd; geen dashboardinstallatie, commit of publicatie uitgevoerd.
