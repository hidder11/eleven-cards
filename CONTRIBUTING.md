# Contributing to Eleven Cards

Een lichte werkwijze voor twee mensen en hun AI-assistenten.

## Branches

- `main`: stabiele standaardbranch; basis voor releases en HACS.
- `develop`: gezamenlijke ontwikkel- en testversie.
- Korte taakbranches vanaf `origin/develop`: `feat/...`, `fix/...`, `docs/...`, `ci/...`.
- Elke persoon/AI gebruikt een eigen checkout of worktree. Nooit tegelijk dezelfde werkmap wijzigen.

```sh
git fetch origin
git worktree add -b fix/korte-omschrijving ../eleven-fix origin/develop
```

Bestaande lokale wijzigingen eerst inventariseren. Niet resetten, automatisch stashen of als één grote wijziging publiceren.

## Van taak naar develop

1. Maak één afgebakende wijziging; bewerk bronnen, niet rechtstreeks de gegenereerde bundels.
2. Draai `npm test` en `npm run check`. Commit ook de bijbehorende gegenereerde bundels.
3. Bij UI-wijzigingen: controleer de betrokken kaart visueel op een testdashboard, inclusief smal scherm. CI vervangt deze controle niet.
4. Open een PR naar `develop` met wat er verandert, testbewijs en risico's.
5. De check `validate` moet slagen. Squash-merge taakbranches en verwijder ze daarna.

De ander hoeft niet elke kleine PR goed te keuren. Spreek wel een review af bij gedeelde code met breed effect, brekende configuratie, beveiliging, gegevensverlies of aanpassingen aan build/release. Deze menselijke afspraak wordt niet technisch afgedwongen met een verplichte tweede reviewer.

Voor de browser-smoketest, in een eigen Python-venv:

```sh
python -m pip install playwright==1.56.0
python -m playwright install chromium
python tests/browser-smoke.py
```

De smoke test controleert laden, dubbele registratie en editorconstructie in Chromium met een minimale `ha-form`-stub. Het is geen volledige Home Assistant-integratietest. Er zijn geen HA-credentials of productietoegang nodig.

## Een release voorbereiden

1. Test de combinatie op `develop` in een aparte testomgeving. Gebruik nooit het gewone HA-dashboard als automatische deploymentbestemming.
2. Open een PR van `develop` naar `main`, met een korte samenvatting en eventuele migratiestappen.
3. Wacht op groene CI en menselijke controle. Gebruik **Create a merge commit**, niet squash of rebase. Verwijder `develop` nooit.
4. Open GitHub Actions → **Draft release** → **Run workflow**. Kies branch `main`, vul `vMAJOR.MINOR.PATCH` in en laat `dry_run` uit.
5. De workflow controleert en bouwt de exacte geselecteerde main-commit en maakt alleen een **conceptrelease** met `eleven-cards.js` en een bestand met commit/hash.
6. Controleer de release notes en test de bijgevoegde bundel. Publiceer daarna handmatig als stabiele release. Publiceren en HA/HACS bijwerken zijn afzonderlijke menselijke acties.

Er is één versie voor de hele collectie. Bijvoorbeeld `v0.1.0` als eerste versie, `v0.2.0` voor nieuwe functies en `v0.2.1` voor een reparatie. Gebruik tijdens 0.x een minorverhoging voor brekende wijzigingen en vermeld migraties expliciet. Vanaf 1.x: major voor brekend, minor voor nieuwe functies, patch voor reparaties. De tag is de releaseversie; bestaande lokale versies in afzonderlijke kaartpackages zijn geen aparte collectiereleases.

`dry_run` controleert de hele releaseflow zonder tag, release of installatie aan te maken. De workflow weigert ongeldige versies, bestaande tags/releases en andere branches dan main. Er wordt nooit automatisch gepubliceerd of naar Home Assistant uitgerold. Een mislukte conceptrelease niet blind opnieuw uitvoeren: inspecteer en verwijder/herstel de eigen draft bewust, of kies een nieuwe versie. Nooit een gepubliceerde tag verplaatsen.

Tot de eerste stabiele release kan HACS de standaardbranch gebruiken. Na invoering van releases gebruiken stabiele HACS-installaties de gepubliceerde versie. Houd daarom `main` de standaardbranch; maak `develop` niet standaard. Voor handmatige installatie download je `eleven-cards.js` uit de gewenste GitHub Release.

## Spoedfix en teruggaan

Maak een `fix/...`-branch vanaf `origin/main`, test, open een PR naar main en maak na merge een patchrelease. Breng de fix daarna via een gewone merge-PR van main naar develop terug. Gebruik ook hier geen squash tussen de permanente branches.

Bij regressie: installeer bewust de vorige release en herlaad de browser. Bewaar zo nodig ook de eerdere dashboardconfiguratie; een oudere bundel kan nieuwe configuratie niet altijd verwerken. Verplaats geen tags en verwijder geen gepubliceerde geschiedenis.

## Repositoryregels

`main` en `develop` vereisen een PR en de check `validate`. Force-push en verwijderen zijn geblokkeerd. Er is geen verplichte tweede goedkeuring en geen verplichte up-to-date-rebase. Adminregels gelden ook voor de eigenaar. De twee vaste branches worden niet automatisch verwijderd. De eenmalige inrichting kan via een bootstrap-PR naar main worden toegevoegd; daarna loopt normaal werk via develop.
