import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),directory=new URL('.cache/home-assistant-test/',root);
let source=await readFile(new URL('dist/eleven-cards.js',root),'utf8');
const names=['eleven-energy-flow-card','eleven-energy-flow-editor','eleven-car-card','eleven-car-editor','eleven-dynamic-energy-price-card','eleven-history-graph-card','eleven-timeline-card','eleven-overview-card','eleven-bar-chart','eleven-heatmap-card','eleven-calendar-card','eleven-weather-card','eleven-weather-editor','eleven-energy-editor','eleven-history-graph-editor','eleven-timeline-editor','eleven-overview-editor','eleven-heatmap-editor','eleven-calendar-editor'];
for(const name of names)source=source.replaceAll(name,name+'-test');
// Bar Chart's editor contains its card name and was renamed with it above.
source=source.replaceAll("name:'Eleven ","name:'Eleven Test ").replaceAll("name: 'Eleven ","name: 'Eleven Test ");
await mkdir(directory,{recursive:true});
await writeFile(new URL('eleven-cards-test.js',directory),'// Local test collection with separate card/editor names.\n'+source);
await writeFile(new URL('LEESMIJ.md',directory),'# Eleven Cards lokaal testen\n\nLees LEESMIJ-TIJDVAK.md voor de actuele testcollectie met tien kaarten en de installatie-instructies.\n');
await writeFile(new URL('LEESMIJ-TIJDVAK.md',directory),`# Tijdvaksynchronisatie testen

1. Kopieer eleven-cards-test.js naar /config/www/eleven-cards-test.js in Home Assistant.
2. Voeg /local/eleven-cards-test.js?v=energy-flow-3 toe als JavaScript-module bij de dashboardbronnen. Bestaat deze resource al, wijzig alleen de versie achter ?v=.
3. Herlaad met Ctrl+F5. Dupliceer de te testen kaarten en gebruik de testtypes hieronder. De normale Eleven-resource kan blijven staan.

    custom:eleven-history-graph-card-test
    custom:eleven-bar-chart-test
    custom:eleven-timeline-card-test
    custom:eleven-heatmap-card-test
    custom:eleven-car-card-test
    custom:eleven-energy-flow-card-test
    custom:eleven-weather-card-test
    custom:eleven-calendar-card-test
    custom:eleven-overview-card-test
    custom:eleven-dynamic-energy-price-card-test

4. Zet bij de grafiekkaarten Tijdvak synchroniseren aan en vul dezelfde Synchronisatiegroep in, bijvoorbeeld energie. In YAML:

    sync_timeframe: true
    hover_sync_group: energie

5. Kies in History, Bar Chart, Timeline of Heatmap een tijdvak. Controleer dat alle gekoppelde kaarten volgen. Test vorige/volgende/Nu ook vanuit een andere kaart.
6. Controleer dat zoom en aggregatie lokaal blijven. Zet synchronisatie op één kaart uit of geef deze een andere groep: die kaart moet zelfstandig blijven werken.
7. Open het tabblad Eigen bereik in het tijdvakmenu, vul Begin en Einde in en klik Toepassen. Gebruik de getoonde Home Assistant-tijdzone. Alle gekoppelde kaarten moeten exact dit bereik volgen. Test ook een ongeldige volgorde; de kaart moet dan een melding tonen en het vorige bereik behouden. Maximaal 366 dagen.
8. Geef kaarten verschillende standaarduren, bijvoorbeeld History 24 en Heatmap 168. Kies een gedeelde periode en daarna Standaard: elke kaart moet weer zijn eigen ingestelde uren tonen. Overview toont weer actuele waarden en Energy het normale prijsvenster.

De tijdvakpopup heeft de tabbladen Afgelopen, Kalender en Eigen bereik. Standaard blijft erboven bereikbaar. Tabbladen wisselen verandert de gekozen periode niet; ingevulde datums blijven behouden. De tijdvakselectie en vorige/Nu/volgende vormen één groep. Zoom heeft een eigen groep. Geschiedenis en info staan samen in een groep. Op smalle kaarten blijven de knoppen binnen elke groep bij elkaar.

De samengevoegde autokaart is beschikbaar als custom:eleven-car-card-test. Zonder EVCC-koppeling kies je een percentage-entiteit of vaste waarde en drie eigen gegevensvelden met labels. Met evcc_enabled: true kies je het laadpunt en de zichtbare tabs (controls, session, technical). Een lege tabs-lijst verbergt alle tabs. Compact past alleen de afmetingen aan. Beide instellingenreeksen blijven bewaard bij het omschakelen. De configuratie is verdeeld in inklapbare secties. Kies optioneel default_tab voor het standaardtabblad. Eigen velden kunnen apart worden verborgen en ondersteunen attributen, een eigen eenheid en decimalen. Bij non-EVCC kies je onder Actieradius voor niet tonen, een resterende-afstandsensor of een schatting uit range_full maal het percentage. De actieradius staat onder de titel; berekende waarden zijn als geschat bereik herkenbaar. Eigen tabbladen met eigen entiteiten werken met en zonder EVCC. De editor biedt toevoegen, verwijderen en ordenen van tabs en entiteiten. image_offset_x verschuift de auto horizontaal. Onder Weergave staan vier balkstijlen, animation_speed en animation_max_kw; Zacht licht (8 px) is de standaardbalk en 11 kW het standaardmaximum voor de animatie. Aurora sky, Cloud layers en Atmospheric flow zijn ook op de autokaart beschikbaar, met animate_background om de achtergrondanimatie uit te zetten. Het oude EVCC-type blijft werken.

De weerkaart zit in dezelfde testcollectie als EVCC. Gebruik custom:eleven-weather-card-test met entity: weather.jouw_weerentiteit. De editor gebruikt inklapbare secties zoals de autokaart. Kies per gegevensveld een weerwaarde of eigen entiteit met eigen label, attribuut, eenheid en decimalen. Onder Tabbladen kies je Per uur, Per dag, beide of geen; een expliciete tabs-lijst geldt ook in compact. Bestaande compact_forecast-configuraties blijven werken. Onder Weergave > Achtergrond staan ook Aurora sky (aurora), Cloud layers (clouds) en Atmospheric flow (isobars). Onder Weergave > Icoonstijl kies je Klassiek (classic), Liquid glass (glass) of Neon (neon). De nieuwe sets ondersteunen alle 15 weerstatussen, met een neutraal icoon bij ontbrekende data. Alle achtergronden houden dezelfde headerafmetingen en vervagen binnen de header tot vóór de tabinhoud, ook in compact. Bij slechts een verwachting verdwijnt de tabbediening. Onder Weersverwachting kies je forecast_fields: condition, temperature, templow, precipitation_probability, precipitation, wind_speed, wind_gust_speed, humidity of uv_index. De waarden komen uit je weerintegratie. Onder Verwachting per uur en Verwachting per dag kies je nu aparte velden en decimalen; onder Volgorde wijzig je hun positie. forecast_hourly_fields en forecast_daily_fields overschrijven desgewenst forecast_fields. animate_background en animate_icons werken onafhankelijk. Uiterlijke wijzigingen behouden de verbinding en gekozen tab. Meetwaarden werken bij zonder de afbeelding of scrollpositie te vervangen. Oude uren worden elke minuut verwijderd; dagverwachtingen volgen de kalenderdag in je HA-tijdzone. Animaties pauzeren buiten beeld en in verborgen browsertabbladen, ook op de auto- en EVCC-kaart. De animaties volgen de animatieknop, verbinding en voorkeur voor minder beweging. Laad deze collectie zonder de losse EVCC- of Weather-testmodule.

De energieverdelingskaart is beschikbaar als custom:eleven-energy-flow-card-test. Deze leest automatisch energy/get_prefs en Recorder-statistieken uit Home Assistant. Actueel gebruikt Energy-vermogenssensoren; ontbrekende sensoren kunnen in de editor worden ingesteld. Historisch heeft een eigen periodekiezer, zonder tabs of extra verbruikers.


De EVCC-kaart toont actuele laadgegevens van ha-evcc. Kies de laadvermogensensor van het juiste laadpunt en optioneel een image-entiteit van de auto. Controleer accu, laaddoel, status, sessie, zonne-aandeel en technische details; klik op waarden voor entiteitdetails. Gebruik bij afwijkende namen de entiteitkeuzes onder Entiteiten aanpassen. Deze kaart heeft geen tijdvaksynchronisatie.

De nieuwe Agenda-kaart heeft een eigen kalendernavigatie. Kies in de configurator een of meer calendar-entiteiten, optioneel een weather-entiteit, de weergave (Daglijst, Dagkolommen of Maand), Compact of Uitgebreid en 1–14 dagen. De kaart toont alleen de gekozen weergave. Klik in de legenda op een agenda om die afspraken tijdelijk te verbergen of weer te tonen. Dubbelklik op een agenda om alleen die agenda te tonen; nogmaals dubbelklikken toont alles. Dit moet in alle drie weergaven werken. Compact toont minder details en in Maand twee afspraken per dag; de afspraak-popup blijft volledig. De maand toont een volledige kalender, onafhankelijk van het aantal dagen. Controleer ook de RGB-kleuren per agenda en afspraken die tijdens het bekijken worden bijgewerkt. Deze kaart neemt de grafiektijdvaksynchronisatie niet over.

Zet bij Agenda onder Weergave de optie Lege dagen verbergen in daglijst aan. De kolommen en maand houden hun volledige kalenderstructuur. De eerstvolgende afspraak heeft een subtiele markering die automatisch doorschuift. Bij een laadfout of niet-beschikbare agenda verschijnt een waarschuwing bij dat legenda-item.

Open de Gegevens-popup van Agenda: per agenda staan Afspraken en Eerstvolgende naast elkaar, zonder algemene periode- of weersinformatie. Meerdaagse afspraken tellen één keer. De gekleurde markering naast de naam hoort ook bij de sensoren in de grafiekgegevenspopups. Controleer dat het sluitkruisje in alle popups midden in de knop staat. Open daarna een afspraak: de popup toont een datum- en tijdblok en, indien beschikbaar, aparte velden voor locatie en beschrijving. Controleer ook een hele dag en een afspraak over meerdere dagen.

Open voor elk van de tien testkaarten het tabblad Indeling en pas het aantal rijen aan. Controleer een kleine en een grote hoogte, ook op een smalle kaart. De kaart moet binnen de toegewezen ruimte blijven en zo nodig intern scrollen. Test Agenda ook in Dagkolommen en Maand, compact en uitgebreid.

Scroll op de dashboardpagina met de muis boven een kaart die zelf niet kan scrollen, en boven een kaart waarvan de interne scrollbalk bovenaan of onderaan staat. De pagina moet door kunnen scrollen. Binnen een hoge agenda of heatmap blijft intern scrollen werken. De Agenda-infopopup toont de gekozen periode, aantallen, status per agenda en de eerstvolgende afspraak. Geef bij Heatmap een Sensornaam op en controleer die in de hoverpopup en de infopopup.

Overview volgt het gekozen bereik en toont de laatst vastgelegde waarde bij het einde ervan. De prijskaart volgt met de prijsintervallen die de bron beschikbaar heeft; een periode zonder bronprijzen krijgt een melding. De actuele prijs blijft als actuele prijs gelden. Deze twee kaarten hebben zelf geen tijdvakmenu.

Standaard staat synchronisatie uit. Een lege groepssleutel gebruikt de standaardgroep. De keuze wordt alleen gedeeld in deze geopende pagina; YAML blijft gelijk. Later toegevoegde kaarten volgen de laatste groepskeuze. Browser verversen wist de tijdelijke keuze.

Het losse heatmap-testbestand is niet daarnaast nodig: deze testcollectie bevat de heatmap al. Verwijder een eventueel geladen losse heatmap-testresource om dubbele versies van hetzelfde testtype te voorkomen.

Opruimen: verwijder de testkaarten en testresource. De normale kaarten blijven hun bestaande types gebruiken.
`);
console.log('Built ten test cards and LEESMIJ-TIJDVAK.md.');
