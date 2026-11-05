# Eleven Scene Engine Card — lokaal voorstel

Geen installatie uitgevoerd. Geen Home Assistant-verbinding in de demo.

## Inhoud

- `eleven-scene-engine-card.js`: zelfstandige ES-module, zonder build of runtime-dependencies.
- `demo.html`: synthetische toestanden en nagebootste `hass.callService`; reset kan hier niets in huis wijzigen.
- `tests/test_card.py`: Playwright Chromium-controles via een tijdelijke HTTP-server op `127.0.0.1`. Server stopt na de test. Externe browserrequests worden geblokkeerd en laten de test falen.

## Lokaal bekijken

Vanuit de repository:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory frontend
```

Open `http://127.0.0.1:8765/demo.html`. Stop de server met Ctrl-C. Dit serveert alleen de lokale demo, niet een HA-dashboard.

## Tests uitvoeren

In deze werkomgeving:

```sh
PYTHONDONTWRITEBYTECODE=1 /opt/data/cache/scratch/planner-qa-venv/bin/python frontend/tests/test_card.py
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

## Gedrag

De backend kiest de winnaar. De kaart toont scene, winnende aanvraag, prioriteit (ook 0), actief/niet-actief en optionele aanvraagdetails inclusief vereiste/eindtijd plus revisie/bron/standaardscene. Niet-actief omvat ook ondersteunende aanvragen zonder scene: dat is niet altijd een wachtrij.

Reset vraagt altijd bevestiging, toont het exacte doel en waarschuwt voor een mogelijke scenewijziging. Alleen `hass.callService('button', 'press', {entity_id: config.reset_entity})` wordt gebruikt. Geen andere servicecalls, geen automatische reset. Dubbele verzending wordt geblokkeerd zolang de servicepromise loopt. Ontbrekende/onbeschikbare entiteiten, ontbrekende service of verbroken verbinding blokkeren reset. Een button met state `unknown` vóór de eerste druk is wel bruikbaar.

'Verzoek bevestigd' is alleen service-acknowledgement. 'Nieuwe status ontvangen' betekent dat de snapshot of `last_updated` veranderde; het is geen bewijs dat alle aanvragen opnieuw opgebouwd zijn. Bij een nooit aflopende servicepromise blijft reset bewust geblokkeerd: de kaart start geen tweede actie op basis van een lokale timeout. Een fout geeft een expliciete, opnieuw bevestigde retry, geen automatische herhaling.

## Beperkingen

Alle QA gebruikt synthetische data en mocks. Geen echte HA runtime, grafische editor, rechtenmodel, echte reset/rebuild of resourcelevering geverifieerd. Licht/donker gecontroleerd met lokale HA-themawaarden, niet met alle mogelijke gebruikersthema's. Chrome/Chromium getest; andere browsers niet. Ontwerp is een voorstel, nog geen gebruikersgoedkeuring.

## Shared card background

The visual editor includes **Card background / Kaartachtergrond** with the shared styles, colour source, transparency, animation and whole-card or fading top-section coverage. The same `card_background` YAML object works across all cards. See [shared configuration](../../../README.md#shared-card-background) for options and legacy compatibility.
