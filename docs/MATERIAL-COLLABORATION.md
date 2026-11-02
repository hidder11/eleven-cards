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
