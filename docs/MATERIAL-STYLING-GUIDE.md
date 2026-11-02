# Eleven Cards — Material Light

Status: goedgekeurde stylingbasis voor de gehele Eleven Cards-collectie. Vastgelegd naar aanleiding van de goedgekeurde selectiepreview. Dit is een ontwerpspecificatie, geen toestemming om bestaande cards, functionaliteit of dashboards te wijzigen.

## Actueel thema-eigenaarschap — gebruikersbesluit 30 oktober 2026

De materiaalstijl is een optioneel Home Assistant-thema, niet de standaard ingebakken uitstraling van Eleven Cards. Met het normale HA-thema volgen kaarten de normale HA-kleuren, oppervlakken, radius en schaduwen. Met Eleven Material krijgen zowel standaardkaarten als Eleven Cards de goedgekeurde materiaalbasis. Onderstaande materiaalrecepten beschrijven die optionele themaweergave, niet verplichte fallbackwaarden in kaartcode.

De kaart bepaalt indeling en bediening; het actieve thema bepaalt basispaint en diepte. Behoud functionele sensor-, grafiek-, status- en gebruikerskleuren. Voeg geen achtergrondafbeeldingen toe. De goedgekeurde House Card blijft referentie; de gebruiker heeft deze zelf op zijn dashboard gezet en daar goedgekeurd. Overige kaarten migreren lokaal/geïsoleerd; installatie en publicatie blijven afzonderlijke stappen.

## 1. Centrale referentie en reikwijdte

Dit document is de centrale bron voor stylingbesluiten. Het vervangt eerdere, tegenstrijdige ontwerpregels voor Liquid Light en de materiaalstudies. De naam Material Light beschrijft de ingetogen materiaalwerking, niet alleen het lichte thema.

Goedgekeurde visuele referentie (selectieregels hieronder zijn bijgewerkt naar optie 1 uit de latere knopstudie):
- `../eleven-selection-preview/preview.png`
- `../eleven-selection-preview/index.html`

De eerdere house- en collectievoorbeelden geven functionele context, maar bepalen niet opnieuw de selectiestijl. Deze afspraken gelden voor alle Eleven Cards, niet alleen de house card. Implementatie gebeurt later, per card en op expliciet verzoek. Geen nieuwe functionaliteit of wijziging van bestaande configuratie door een stylingmigratie.

## 2. Ontwerpkarakter

Rustig, modern en vloeiend, maar niet plat, braaf of generiek. Diepte en materiaalgevoel zijn de basis: matte panelen, zachte contactschaduwen en beheerste lichtvangende randen. Selectieve gradients, kleur en schaal mogen karakter toevoegen. Geen algemeen glazen dashboard, sterke gloed, dikke sokkels of bolle toetsen.

Rust ontstaat door gedeeld materiaal, lichtrichting, ritme en hiërarchie; niet door alle diepte weg te halen. De goedgekeurde selectiepreview is het ijkpunt voor de sterkte van de effecten, niet de eerdere zwaardere material-preview.

## 3. Diepte heeft betekenis

| Rol | Materiaalregel |
| --- | --- |
| Card | Tastbaar, mat paneel boven de dashboardachtergrond. |
| Actuele waarden | Ondiepe uitsparing; samenhangende waarden delen één meetvlak. |
| Grafiek | Verdiept plotgebied; scherpe data zonder blur of reliëf op lijnen. |
| Titel en titelicoon | Direct op het cardoppervlak; geen eigen tegel, uitsparing of reliëfschaduw. |
| Knop of echte keuzebediening | Licht opgelegd, met korte zachte contactschaduw. |
| Geselecteerd | Blijvend ondiep ingedrukt: optie 1 uit `../eleven-button-alternatives/index.html`, zonder lichteffecten. |
| Ingedrukt | Tijdelijke activering; een niet-geselecteerde knop keert na loslaten terug omhoog. |

Diepte beschrijft de rol, niet het belang. Een grote meetwaarde wordt geen uitstekende knop. Vermijd geneste uitsparingen en stapels panelen. Niet ieder label of cijfer krijgt een eigen vakje.

Eén lichtbron linksboven. Slagschaduw valt naar rechtsonder. Uitsparingen zijn donkerder aan de boven-/linkerbinnenrand en vangen licht aan de onder-/rechterrand. Het effect blijft subtiel, ook op mobiel.

## 4. Selectie — collectiebrede regel

Selectie voelt fysiek ingedrukt: een ondiepe uitsparing met binnenschaduw en 1 px neerwaartse verplaatsing. Gebruik de inset-basiskleur met 32% van de eerste accenttint aan het gradienteinde en leesbare accenttekst/-iconen. De gewone fijne materiaalrand blijft gelijk. Dit vervangt de eerdere verhoogde, getinte selectie; goedgekeurd als optie 1 in de knopstudie.

Geen onderstreping, lijntje onder de knop, bottom-accent, extra selectierand, zware kleurvulling, gloed, oplichtende letters of controlelampje. Focus is iets anders dan selectie en krijgt alleen bij toetsenbordbediening een duidelijke eigen contour. Een open uitklapkop is geen selectie: de goedgekeurde greeprand blijft verhoogd.

Pas dezelfde taal toe op filters, perioden, weergaven, scènes en andere keuzebedieningen. Niet-interactieve statusbadges worden daarmee geen knoppen. Actieve apparaatstatus en selectie blijven verschillende betekenissen: behoud functionele statuskleuren en de bestaande aan/uit-logica.

Gebruik passende toegankelijke semantiek voor de bestaande bediening, bijvoorbeeld `aria-pressed` bij toggleknoppen of `aria-selected` bij echte tabs; verander het interactiemodel niet uitsluitend voor styling. Maak status ook begrijpelijk uit label/context en waar nodig een tekstuele status of vinkje, nooit met een nieuwe selectie-onderstreping. De preview is geen bewijs dat alle toekomstige keuzepatronen toegankelijk zijn.

## 5. Bedieningsstaten

- Rust: licht opgelegd, mat, korte contactschaduw.
- Hover: kleine verandering in helderheid; geen grote sprong of gloed. Alleen voor beschikbare bediening.
- Focus-visible: afzonderlijke contour met ruimte rondom; niet gebruiken als permanente selectierand.
- Ingedrukt: circa 1 px naar binnen, kortere/vervangen contactschaduw en subtiele binnenschaduw.
- Geselecteerd: ondiep ingedrukt, accenttekst/-icoon, geen buitenste slagschaduw of lichteffecten.
- Geselecteerd + ingedrukt: blijft op dezelfde diepte; geen dubbele neerwaartse beweging. Na loslaten blijft de selectie ingedrukt.
- Uitgeschakeld: herkenbaar maar ingetogen; geen actieve hover of indrukbeweging. Blijft leesbaar.
- Schakelaar: verdiept spoor, licht opgelegde schuifknop; toestand niet alleen met kleur aangeven. In de aan-stand verandert het spoor duidelijk mee, met minimaal 3:1 contrast tussen spoor en schuifknop én tussen actief spoor en het omringende oppervlak. De zachte selectietint alleen is hiervoor onvoldoende. Positie en aan/uit-aanduiding blijven nodig; functionele apparaatkleuren blijven leidend.

Selectie toont de bevestigde toestand, niet ongecontroleerd een geslaagde apparaatactie. Behoud bestaande wacht-, fout- en offlinefeedback.

## 6. Kleur en materiaal per thema

Materiaalkleuren en selectieaccent staan los van sensor-, reeks-, drempel- en statuskleuren. Bewust gekozen datakleuren blijven behouden. Het paarse selectieaccent uit de referentie recolort dus niet alle grafieken of apparaten. Bestaande kleurconfiguratie blijft leidend voor functionele kleuren. Labels hebben eigen tekstkleuren, onafhankelijk van grafiekverf.

Goedgekeurde accentinstelling: volg standaard de Home Assistant-themawaarde `--accent-color`. Een optionele eigen accentkleur per card overschrijft alleen selectie en algemene focus/accéntrollen. Leid bijpassende zachte oppervlaktetinten en leesbare accenttekst afzonderlijk af voor licht en donker; alleen de tekstkleur vervangen terwijl de geselecteerde achtergrond paars blijft is onvoldoende. Bewaak tekst- en focuscontrast op het werkelijke oppervlak. Bestaande expliciete materiaaltokens blijven leidend voor geavanceerde thema-overrides; zulke overrides vereisen eigen contrastcontrole.

In de geïsoleerde House Card-pilot heet deze nieuwe instelling `accent_color` (optionele hexkleur; leeg = thema). De bestaande `color`-paletkeuze blijft de decoratieve huisachtergrond sturen en wordt niet hergebruikt of gemigreerd. Sensor-, grafiek-, lamp- en statuskleuren veranderen niet mee. De instelling is hiermee nog niet in bestaande cards geïnstalleerd.

Licht en donker delen dezelfde rollen, maar hebben afzonderlijke tokens; geen simpele inversie. In donker komt diepte ook uit oppervlakverschillen en lichtranden. In licht blijven panelen, uitsparingen en tekst duidelijk van elkaar te onderscheiden.

Onderstaande waarden zijn rechtstreeks overgenomen uit de goedgekeurde selectiepreview. Zij vormen de gedeelde implementatiebasis, geen aanleiding om bestaande gebruikerskleuren te overschrijven.

| Token / rol | Donker | Licht |
| --- | --- | --- |
| Referentie-achtergrond rond cards | `#20232e` | `#dfe4ed` |
| `--surface` cardoppervlak | `#2c303d` | `#edf0f6` |
| `--inset` meetvlak | `#262936` | `#e3e7ef` |
| `--fg` hoofdtekst | `#f5f3fc` | `#252b3e` |
| `--muted` ondersteunende tekst | `#bfc1d2` | `#566076` |
| `--accent` selectietekst/-icoon | `#ded0ff` | `#67448e` |
| `--tint1` geselecteerd begin | `#514765` | `#e9def7` |
| `--tint2` geselecteerd einde | `#443e57` | `#ded3ed` |
| `--edge` materiaalrand | `#ffffff12` | `#8993a324` |
| `--face1` gewone knop begin | `#363b49` | `#fafbfe` |
| `--face2` gewone knop einde | `#303440` | `#e9edf5` |
| `--shadow` slagschaduwkleur | `#090b1240` | `#64748a30` |

Ondiepe uitsparing (`--well`):

```css
/* Donker */
--well: inset 1px 2px 4px #08091055,
        inset -1px -1px 0 #ffffff0b;
/* Licht */
--well: inset 1px 2px 4px #8490a630,
        inset -1px -1px 0 #ffffffc0;
```

Gedeelde materiaalrecepten uit de referentie:

```css
/* Card */
background: linear-gradient(145deg, var(--surface),
  color-mix(in srgb, var(--surface), black 2%));
border: 1px solid var(--edge);
box-shadow: inset 0 1px 0 #ffffff17,
  4px 7px 12px var(--shadow), 12px 16px 26px var(--shadow);

/* Gewone knop */
background: linear-gradient(155deg, var(--face1), var(--face2));
box-shadow: inset 0 1px 0 #ffffff16, 0 2px 3px var(--shadow);

/* Geselecteerde knop — optie 1: gewone rand behouden */
background: linear-gradient(150deg, var(--inset),
  color-mix(in srgb, var(--inset), var(--tint1) 32%));
color: var(--accent);
transform: translateY(1px);
/* Donker */
box-shadow: inset 1px 2px 4px #08091070, inset -1px -1px 0 #ffffff13;
/* Licht */
box-shadow: inset 1px 2px 4px #8490a645, inset -1px -1px 0 #ffffffdd;
```

Dit zijn recepten, geen globaal te injecteren selectors. Scope implementaties binnen de betrokken card en koppel ze aan gedeelde tokens; geen losse CSS-override per kaart. Bewaar ondersteuning voor bestaande thema-/kleurinstellingen. Een noodzakelijke afwijking wordt expliciet gedocumenteerd en visueel beoordeeld, niet stilzwijgend als nieuwe stijl ingevoerd.

## 7. Vorm, typografie en ritme

Referentiematen: cardradius 22 px; knopradius 12 px; meetvlakradius 15 px. Cardpadding 22 px op desktop en 18 px op smal formaat. Tussen titelicoon en titel 10 px; titelicoon 20 × 20 px. Dit zijn componentmaten; de 28 px buitenrand van het vergelijkingspaneel is geen cardtoken.

Titels: systeemlettertype, 16 px en gewicht 600. Knoptekst: 13 px en gewicht 500. Grote meetwaarde in de referentie: 34 px; eenheid kleiner en rustiger. Gebruik een heldere titel–waarde–eenheid-hiërarchie; geen tekstschaduw. Referentie-captions van 11 px zijn geen verplicht minimum voor alle cards: maak labels leesbaar in de echte context.

Bediening heeft in de referentie minimaal 44 px hoogte. Laat rijen bij ruimtegebrek omslaan of stapelen, zonder afgekorte belangrijke labels, horizontale paginaoverflow of verkleinde tikvlakken. Behoud bruikbaarheid bij lange vertalingen en tekstvergroting. Een compact bestaande-cardprofiel vereist afzonderlijke beoordeling, geen automatische verkleining van alles.

## 8. Grafieken en inhoud

Plaats titels en gewone legenda op het cardoppervlak, het plot zelf in het meetvlak. Een gezamenlijke uitsparing voor actuele waarde en bijbehorende grafiek mag. Data, assen, eenheden en legenda blijven scherp en leesbaar; materiaal mag geen extra reeks, grens of trend suggereren. Geen blur, decoratieve dikke outlines of merkaccent over alle reeksen. Materiaalgradients veranderen geen databetekenis.

Grafieken zijn compact en plotgericht: maximaliseer het bruikbare plot binnen de card en vermijd loze ruimte boven en onder. Houd titel, periodekeuze en actuele waarden compact; plaats samenhangende waarden waar mogelijk naast elkaar, ook op mobiel. Geen extra zichtbare regel om de al herkenbare periodekeuze te herhalen. Behoud leesbare assen, voldoende ruimte voor lijnuiteinden en bruikbare tikvlakken; compactheid mag geen clipping of misleidende schaal opleveren.

Een huisbeeld of andere illustratie behoudt zijn ruimte en functies; geen nieuwe panelen over essentiële bediening leggen. De gekozen stijl is geen toestemming om functies weg te laten of voorbeeldfuncties aan productie toe te voegen.

Een grafiekvoorbeeld moet de uiteindelijke leesbaarheid toetsbaar maken: geloofwaardige voorbeelddata, tijdas, waardeschaal en eenheden, betekenisvolle periodewisseling en uitlezen van meetpunten. Alleen enkele decoratieve lijnsegmenten zijn geen uitgewerkte grafiekreferentie. Voor nieuwe contrastoplossingen geldt eerst visueel beoordelen; geen stilzwijgende wijziging van bestaande reeks- of gebruikerskleuren.

## 9. Beweging en toegankelijkheid

Kort, vloeiend en zonder veerachtige sprongen. Referentie: 160 ms voor achtergrond/kleur, 120 ms voor indrukbeweging van 1 px. Respecteer reduced-motion en maak status nooit afhankelijk van animatie. Geen geanimeerde gloed op gewone meetwaarden.

Interne acceptatiedoelen: tekstcontrast minimaal 4,5:1, grote tekst minimaal 3:1; essentiële bediening, focus en betekenisdragende grafische details minimaal 3:1 tegen aangrenzende vlakken. Test op de werkelijke achtergronden, inclusief gradients en verschillende staten. Behoud van datakleur ontslaat niet van leesbaarheid: gebruik zo nodig labels, lijnpatronen of markers zonder de kleurbetekenis te veranderen. Schaduw alleen mag nooit de enige aanwijzing voor bediening of status zijn.

Dit document legt doelen vast; er is hiermee geen volledige toegankelijkheidsconformiteit aangetoond. Disabled-opaciteit uit het voorbeeld is geen garantie voor leesbaarheid in productie.

## 10. Verificatie bij latere implementatie

Controleer elke aangepaste card naast de goedgekeurde referentie, in licht en donker en op smal mobiel, mobiel en desktop. Beoordeel minimaal:

- Cardoppervlak, vlak titelicoon, actuele waarde en grafiekuitsparing.
- Rust, hover, toetsenbordfocus, ingedrukt, geselecteerd, geselecteerd+ingedrukt en uitgeschakeld waar relevant.
- Selectie ondiep ingedrukt, zonder onderstreping, extra rand of lichteffecten; controleer ook hover, deselectie en disabled.
- Lange labels, tekstvergroting, tikvlakken en overflow.
- Contrast per tekstrol en echte achtergrond; betekenisvolle grafiekdetails en functionele kleuren.
- Reduced-motion, toetsenbordbediening en toegankelijke statussemantiek.
- Bestaande functies, configuratie, fouten en offline→online-herstel zonder regressie.

Een fixture met voorbeelddata is geen bewijs van een werkende geïnstalleerde card. Lever echte browserbeelden en interactietests bij implementatie, en benoem de testscope. Productieaanpassingen blijven apart goed te keuren.

## 11. Vastgelegde besluiten

Goedgekeurd: tastbaar maar ingetogen 2.5D-materiaal; subtiele verdiepingen voor waarden en grafieken; vlakke titeliconen; licht opgelegde gewone knoppen; geselecteerd ondiep ingedrukt volgens optie 1, met accenttekst/-icoon zonder lijntje of lichteffecten; behoud van functionele kleuren; dezelfde taal voor de hele collectie.

Niet meer open als ontwerprichting: terug naar platte cards, verdiepte titeliconen, zware knopreliëfs of selectie via onderstreping. Card-specifieke indeling en integratie met bestaande themaconfiguratie worden pas bij implementatie uitgewerkt binnen deze regels.
