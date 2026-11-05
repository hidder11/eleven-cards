# Eleven Scene Engine Card — lokaal voorstel

Geen installatie uitgevoerd. Geen Home Assistant-verbinding in de demo.

## Inhoud

- `eleven-scene-engine-card.js`: frontend ES-module met bestaande gedeelde Eleven-paint/backgroundhelpers.
- `../dist/eleven-scene-engine-card.js`: zelfstandige bundle, opgebouwd met `node cards/scene-engine-card/scripts/build.mjs` vanuit de repositoryroot.
- `demo.html`: synthetische toestanden en nagebootste `hass.callService`; reset kan hier niets in huis wijzigen.
- `tests/test_card.py`: Playwright Chromium-controles via een tijdelijke HTTP-server op `127.0.0.1`. Server stopt na de test. Externe browserrequests worden geblokkeerd en laten de test falen.

## Lokaal bekijken

Vanuit de repository:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/cards/scene-engine-card/frontend/demo.html` (bron) of voeg `?bundle` toe voor de gebouwde zelfstandige kaart. Stop de server met Ctrl-C. Dit serveert alleen de lokale demo, niet een HA-dashboard.

## Tests uitvoeren

In deze werkomgeving:

```sh
node cards/scene-engine-card/scripts/build.mjs
node --check cards/scene-engine-card/frontend/eleven-scene-engine-card.js
node --check cards/scene-engine-card/dist/eleven-scene-engine-card.js
PYTHONDONTWRITEBYTECODE=1 /opt/data/cache/scratch/shopping-style-venv/bin/python cards/scene-engine-card/frontend/tests/test_card.py
PYTHONDONTWRITEBYTECODE=1 /opt/data/cache/scratch/shopping-style-venv/bin/python cards/scene-engine-card/frontend/tests/test_redesign.py
# Dezelfde twee suites werkelijk tegen de bundle:
SCENE_CARD_BUNDLE=1 PYTHONDONTWRITEBYTECODE=1 /opt/data/cache/scratch/shopping-style-venv/bin/python cards/scene-engine-card/frontend/tests/test_card.py
SCENE_CARD_BUNDLE=1 PYTHONDONTWRITEBYTECODE=1 /opt/data/cache/scratch/shopping-style-venv/bin/python cards/scene-engine-card/frontend/tests/test_redesign.py
```

Elders: Python met Playwright en Chromium nodig. Optioneel `CARD_QA_CHROMIUM` instellen op het pad van de browser. De test gebruikt de aanwezige Chromium-installatie; niets wordt automatisch geïnstalleerd. Screenshots/resultaten gaan uitsluitend naar `qa-evidence/`.

## Kaartconfiguratie — voorbeeld, niet toegepast

```yaml
type: custom:eleven-scene-engine-card
entity: eleven_scene_engine.woonkamer
reset_entity: button.eleven_scene_engine_woonkamer_reset
name: Woonkamer
show_details: true
```

`entity` en `reset_entity` zijn verplicht. Kies de reset-knop van dezelfde engine; de kaart kan dat niet via alleen de aangeleverde state-gegevens bewijzen. Geen afgeleid doel. Het native `getConfigForm()` schema biedt beide entiteitselecties plus naam en details. De daadwerkelijke HA-editor is niet getest; YAML is het expliciete contract. Er is geen resource-registratie, backend frontend-route of deployment toegevoegd.

## Herontwerp

Rustige titel, één inset-scènelezing met volledig leesbare naam en vlak native `ha-icon`, compacte bron/prioriteit en twee vlakke aanvraagtellingen. Het entity-icoon van de gekozen scène gaat voor het engine-icoon; anders `mdi:palette-outline`. Actief accent volgt `--accent-color` (fallback `--primary-color`). Native HA/optioneel Material blijven eigenaar van paint en diepte; geen ingebouwd materiaalpalet. Geen grafiek of wachtrijbetekenis.

Details tonen een rustige lijst per groep Actief/Niet actief: aanvraagnaam met de scène eronder, en alleen het prioriteitsgetal rechts onder Prio. Dubbele entity-ID's, vereisten/eindtijden, revisie/bron en de technische toelichting staan uitsluitend achter het standaard ingeklapte onderdeel Technisch. Beide disclosures behouden open toestand en eigen toetsenbordfocus bij hass-updates. De technische toegang is vlak en ondergeschikt, niet een extra materiaalkaart.

De Details-greep en Reset vormen een losse bedieningsrij; beide behouden hun volledig afgeronde, opgelegde knopvlak wanneer details openen. Alleen de inhoud eronder krijgt een zelfstandig afgerond inset-vlak met8px tussenruimte, nooit de volledige native details-wrapper. Zo loopt de verdiepte achtergrond niet achter Reset door. Als tekstvergroting de bediening laat stapelen, wordt de werkelijk gemeten hoogte van beide knoppen boven de inhoud gereserveerd; Reset verhuist niet naar de onderkant van de aanvraaglijst. Tikdoelen blijven minimaal 44px. ResizeObserver laat scène/icoon en footer alleen bij echte tekstfitproblemen naar volle breedte omslaan en stopt bij disconnect. Lange woorden die zelfs de volledige inhoudsbreedte overschrijden mogen noodgedwongen omlopen; geen clipping of weggelaten tekst. De normale 390px-fixture heeft een <=280px hoogtebudget in plaats van het oude <=180px gecomprimeerde lijstje.

`test_redesign.py` controleert 320/390/480px × native/Material × licht/donker met lange tekst, 200%-tekstvergroting én beide gecombineerd, werkelijke paintrollen, icooninhoud, focus en observer-reconnect. `test_card.py` behoudt de volledige reset-/fout-/watcher-/configuratieveiligheidssuite. Bewijs staat onder `qa-evidence/scene-engine-redesign/`; bron- en bundleruns gescheiden. De demo gebruikt de bestaande review-HA-stub (alleen synthetisch), geen echte HA-glyphloader.

## Gedrag

De backend kiest de winnaar. De kaart toont scene, winnende aanvraag, prioriteit (ook 0), actief/niet-actief en optionele aanvraagdetails inclusief vereiste/eindtijd plus revisie/bron/standaardscene. Niet-actief omvat ook ondersteunende aanvragen zonder scene: dat is niet altijd een wachtrij.

Reset vraagt altijd bevestiging, toont het exacte doel en waarschuwt voor een mogelijke scenewijziging. Alleen `hass.callService('button', 'press', {entity_id: config.reset_entity})` wordt gebruikt. Geen andere servicecalls, geen automatische reset. Dubbele verzending wordt geblokkeerd zolang de servicepromise loopt. Ontbrekende/onbeschikbare entiteiten, ontbrekende service of verbroken verbinding blokkeren reset. Een button met state `unknown` vóór de eerste druk is wel bruikbaar.

'Verzoek bevestigd' is alleen service-acknowledgement. 'Nieuwe status ontvangen' betekent dat de snapshot of `last_updated` veranderde; het is geen bewijs dat alle aanvragen opnieuw opgebouwd zijn. Bij een nooit aflopende servicepromise blijft reset bewust geblokkeerd: de kaart start geen tweede actie op basis van een lokale timeout. Een fout geeft een expliciete, opnieuw bevestigde retry, geen automatische herhaling.

## Beperkingen

Alle QA gebruikt synthetische data en mocks. Geen echte HA runtime, grafische editor, rechtenmodel, echte reset/rebuild of resourcelevering geverifieerd. Licht/donker gecontroleerd met lokale HA-themawaarden, niet met alle mogelijke gebruikersthema's. Chrome/Chromium getest; andere browsers niet. Ontwerp is een voorstel, nog geen gebruikersgoedkeuring.

## Shared card background

The visual editor includes **Card background / Kaartachtergrond** with the shared styles, colour source, transparency, animation and whole-card or fading top-section coverage. The same `card_background` YAML object works across all cards. See [shared configuration](../../../README.md#shared-card-background) for options and legacy compatibility.
