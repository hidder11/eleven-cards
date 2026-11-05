# Consistentiecontrole kaarten

Gecontroleerd op 23 oktober 2026, na het doorvoeren van optie 1 voor de energiekaart.

## Doorgevoerd

Bij een kaartbreedte tot en met 480 px blijven de energiebediening en tijdvakselectie rechts naast de hoofdwaarde staan, onder elkaar. Vorige/nu/volgende staan dan in de bestaande generieke tijdvakpopup. Op brede kaarten blijft de horizontale bediening behouden. Dezelfde gedeelde navigatiehandlers bedienen beide plaatsen; de verborgen knoppen doen niet mee aan de tabvolgorde.

## Aanvullend doorgevoerd

- De editors noemen een verborgen titel nu Kaartnaam (toegankelijkheid); Energy noemt de zichtbare tekst Onderschrift hoofdwaarde. De bestaande titelvelden blijven geldig.
- De Car-hulptekst plaatst het bereik onder het percentage.
- Car en EVCC tonen bij een enkel tabblad alleen een benoemde sectie met de inhoud. Meerdere tabs behouden de gedeelde toetsenbordbediening.
- Alle drie configureerbare gegevensvelden in Car en Weather hebben een icoonkiezer.
- Een informatievlak met een enkele bronentiteit is als geheel klikbaar. EVCC-vlakken met meerdere entiteiten behouden afzonderlijke knoppen. Er zijn geen geneste knoppen.
- Compacte weergave staat in Weergave. Calendar accepteert compact als alias en bewaart density om bestaande dashboards compatibel te houden. Car, Weather, Energy en legacy EVCC accepteren density: compact als alias; een expliciete compact-instelling heeft voorrang.
- Energy kan de drie informatievlakken onafhankelijk verbergen met show_field_1/2/3; lege onderste rasters vervallen.
- Energy ondersteunt sync_timeframe en hover_sync_group (ook timeframe_sync_group). Alleen Historisch luistert en publiceert. Actueel blijft onafhankelijk; teruggaan naar Historisch neemt het laatste groepstijdvak over. Afmelden en verwijderen ruimen de luisteraar op. Cosmetische wijzigingen behouden geladen statistieken.
- Alle nieuwe headers starten met lanes en dezelfde sterkte. background_strength (0-100, standaard 100) regelt de gedeelde achtergrondlaag en laat de inhoud leesbaar. Bestaande expliciet gekozen achtergronden blijven behouden.
- Calendar en Timeline houden net als de andere kaarten 16 px buitenruimte, ook compact en smal. De gedeelde header en kaarten gebruiken dezelfde CSS-paddingvariabele; Timeline reageert op de kaartbreedte.

## Reikwijdte en verificatie

De bronnen en configuratoren van alle elf gebundelde kaarttypen zijn vergeleken: Dynamic Energy Price, History Graph, Timeline, Overview, Bar Chart, Heatmap, Calendar, Weather, Car, Energy Flow en de afzonderlijke legacy EVCC-kaart. Climate is niet opgenomen: die staat niet in de collectiebuild.

De bestaande synthetische browservoorbeelden zijn zonder screenshots bekeken. Voor Weather, Car en Energy Flow zijn bovendien 48 configuraties automatisch gecontroleerd op drie smalle breedtes en beide thema's. De energiecontroles dekken ook een brede kaart, de generieke popup en navigatie. Dit is geen test met een echte Home Assistant-installatie.

## Bevindingen uit de vergelijking (inmiddels opgelost)

| Prioriteit | Onderwerp | Bevinding | Voorstel |
| --- | --- | --- | --- |
| Hoog | Betekenis van Titel | Weather en Car tonen de titel niet meer in de header; ze gebruiken hem wel voor toegankelijkheid en bij Car ook als afbeeldingsbeschrijving. De editor noemt het veld nog gewoon Titel. Energy Flow gebruikt Titel juist als zichtbaar onderschrift bij de hoofdwaarde. De grafiekkaarten hebben een afzonderlijke Titel tonen-optie. | Geef de instellingen een label en toelichting die hun werkelijke functie beschrijven. Behoud bestaande YAML-sleutels. |
| Hoog | Verouderde configuratiehulp | De Car-editor zegt bij actieradius nog dat die onder de titel staat. De actieradius staat inmiddels onder het percentage. | Actualiseer de Nederlandse en Engelse hulptekst. |
| Midden | Eén zichtbaar tabblad | Weather verbergt de tabknop automatisch als slechts één verwachting zichtbaar is. Car en EVCC renderen ook bij één tab nog een tabknop. Dit is zichtbaar bij Compact met eigen tabblad en Compact laden in de galerij. | Toon bij één tab alleen de inhoud, met behoud van de sectienaam voor toegankelijkheid. |
| Midden | Icoonkeuze per gegevensveld | De brede gegevensvelden van Weather en Car hebben een icoonkiezer. Bij links en rechts ontbreekt die in beide editors, hoewel de renderers ook voor die posities een icoon gebruiken. | Bied dezelfde icoonkiezer bij alle configureerbare gegevensvelden. |
| Midden | Klikgebied bij sensoren | Car gebruikt voor de eigen gegevensvelden het volledige vlak als knop. EVCC heeft een vlak met een losse sensor-knop rond de waarde. Bij Weather is het brede vlak klikbaar; ingebouwde weerattributen links en rechts zijn gewone vlakken en eigen entiteiten zijn wel klikbaar. | Gebruik voor velden met één bronentiteit consequent het hele vlak. Behoud afzonderlijke knoppen wanneer een vlak meerdere bronentiteiten bevat. Berekende energiewaarden hebben geen vanzelfsprekende bronentiteit en mogen informatief blijven. |
| Midden | Instellingen voor compacte weergave | Weather, Car en Energy Flow gebruiken compact: true/false. Calendar gebruikt density: compact/expanded. De andere grafiekkaarten sturen dichtheid via eigen afmetingen, zonder dezelfde algemene compactschakelaar. | Maak de labels en groepen in de editor gelijk; voeg eventuele YAML-aliassen toe zonder bestaande configuraties te breken. |
| Midden | Zichtbaarheid van informatievlakken | Weather en Car kunnen de brede, linker en rechter informatievlakken afzonderlijk verbergen en configureren. Energy Flow heeft drie vaste vlakken voor opwek, afname en teruglevering. | Overweeg dezelfde zichtbaarheidsschakelaars voor Energy Flow, met behoud van de vaste betekenis van de energiewaarden. |
| Midden | Tijdvak synchroniseren | History, Bar Chart, Timeline, Heatmap, Overview en Dynamic Energy Price ondersteunen gedeelde tijdvaksynchronisatie. Energy Flow gebruikt dezelfde tijdvakselectie, maar is niet aangesloten op die synchronisatie en biedt de instelling niet aan. | Voeg optionele synchronisatie toe voor de historische energieweergave; bepaal expliciet hoe de actuele weergave daarmee omgaat. |
| Laag | Achtergrondsterkte en standaard | Weather en Car starten standaard met lanes; Energy Flow met ribbon. Het achtergrondvlak van Energy Flow heeft bovendien opacity .55 tegenover 1 bij Weather en Car. De fade zelf is wel hetzelfde gedeelde component. | Kies bewust of de rustigere energieachtergrond een gewenste uitzondering blijft. Eventueel dezelfde intensiteitsinstelling aanbieden. |
| Laag | Buitenruimte en responsive regels | Weather, Car en Energy Flow houden 16 px buitenruimte. Calendar schakelt op smalle kaarten naar 12 px en gebruikt in compact 12/14 px. Timeline gebruikt eveneens andere verticale/brede marges en heeft een viewport-mediaquery waar de nieuwe kaarten containerqueries gebruiken. | Gebruik gedeelde buitenmarges en kaartbreedte als uitgangspunt voor responsive gedrag, zonder de verschillende grafiekindelingen gelijk te trekken. |

## Verschillen die bewust behouden zijn

- De hoofdwaarde van Energy Flow wordt op smalle kaarten kleiner om de bediening ernaast te laten passen. Actueel en historisch gebruiken bij dezelfde kaartbreedte dezelfde lettergrootte. De gedeelde hoofdwaardecomponent blijft behouden.
- Header-informatievlakken gebruiken 24 px waarden of 20 px in compact. De dichter bezette EVCC-sessie- en detailrijen gebruiken 18 px. Dit zijn verschillende informatieniveaus; ze hoeven niet automatisch dezelfde grootte te krijgen.
- De grafiekkaarten, Overview en Calendar gebruiken niet de nieuwe gekleurde header-informatievlakken. Ze hebben andere taken en gebruiken wel delen van dezelfde knoppen-, popup-, legenda- en grafiekcomponenten. Een volledige migratie is een ontwerpkeuze, geen noodzakelijke correctie.
- De losse EVCC-kaart bestaat naast de nieuwe Car-kaart voor bestaande dashboards. De configuratie verschilt: de nieuwe Car-kaart heeft onder meer de EVCC-keuzeschakelaar en eigen tabbladen. Verwijder de oude kaart niet zonder migratiepad.

## Bronverwijzingen

- Titel, actieradius, icooninstellingen: [Car-editor](../cards/car-card/src/car-editor.js), [Weather-editor](../cards/weather-card/src/weather-editor.js), [Energy-editor](../cards/energy-flow-card/src/energy-flow-editor.js).
- Eén-tabgedrag en sensoracties: [Weather](../cards/weather-card/src/weather-card.js), [Car](../cards/car-card/src/car-card.js), [EVCC](../cards/car-card/src/evcc/evcc-card.js).
- Dichtheid en marges: [Calendar](../cards/calendar-card/src/calendar-styles.js), [Timeline](../cards/timeline-card/src/timeline-view.js), [Energy](../cards/energy-flow-card/src/energy-flow-styles.js).
- Energieconfiguratie en synchronisatie: [Energy-data](../cards/energy-flow-card/src/energy-flow-data.js), [gedeelde perioden](../shared/periods.js), [tijdvakselectie](../shared/period-controls.js).

Alle tien bovenstaande voorstellen zijn vervolgens doorgevoerd. De tabel bewaart de oorspronkelijke bevindingen ter onderbouwing.

## Verificatie na implementatie

- 568 Node-tests geslaagd, serieel uitgevoerd om gelijktijdige Windows-builds van dezelfde bundel te vermijden.
- 4435 controles over de 48 galerijconfiguraties en 2016 vergelijkingen van informatievlakken geslaagd, zonder screenshots of opnames.
- 368 energiecontroles inclusief alle zichtbaarheidcombinaties, achtergrondsterkte, behoud van statistieken bij cosmetische wijzigingen en historische synchronisatie geslaagd.
- 326 Car-controles, 374 Weather-controles met aanvullende uitlijning/animatie/lifecycle-controles, en de EVCC-bedienings- en Gallery-controles geslaagd.
- Calendar-kaart en editoraudits, compacte alias en marges op 260/380/640 px geslaagd; Timeline-containerbreedte en marges eveneens gecontroleerd.
- Normale collectie en afzonderlijke Home Assistant-testcollectie opnieuw gebouwd. 16 gegenereerde modules doorstaan de syntaxcontrole. git diff --check is schoon.
- Dit zijn synthetische lokale controles. Er is geen echte Home Assistant-installatie bijgewerkt of getest. De aanvullende Python-suite is niet uitgevoerd: Python is niet beschikbaar in de shell.

## Latere opschoning

De losse EVCC-kaart en het Climate-prototype zijn op verzoek verwijderd. De hierboven genoemde legacy-verschillen beschrijven de eerdere audit. EVCC-functionaliteit, tests en voorbeelden zijn ondergebracht in Car. De collectie en testcollectie bevatten nu tien kaarttypen. Oude EVCC-dashboards moeten overstappen op custom:eleven-car-card met evcc_enabled: true.
