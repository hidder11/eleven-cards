# Eleven Room Card — local beta

Mobile room summary and navigation for a Home Assistant dashboard. Uses inherited Home Assistant theme variables; the HA automatic theme follows the device's system preference. The card never calls a physical service. The room name navigates; the separate light button opens the primary configured light/group's native more-info dialog. Room detail pages contain normal HA controls.

```yaml
type: custom:eleven-room-card
name: Woonkamer
icon: mdi:sofa-outline
lights:
  - light.woonkamer_verlichting
temperature_entity: sensor.luchtmeter_woonkamer_temperature
navigation_path: /nieuw-huis/woonkamer
```

Optional `note` identifies temporary device mappings. `lights` must contain light entity IDs, without both a group and its members. Unknown/missing/unavailable lights are explicitly reported; an unconfigured room says `Nog niet gekoppeld`. Missing temperature data is omitted, never replaced by zero. Native `getConfigForm()` exposes the name, icon, light list, temperature source, local route, and note.

Build and test from repository root:

```sh
node --test cards/room-card/tests/*.test.mjs
node cards/room-card/scripts/build.mjs
node --check cards/room-card/dist/eleven-room-card.js
```

Standalone output: `cards/room-card/dist/eleven-room-card.js`. Installed locally at `/local/eleven-cards/eleven-room-card.js` with a hash query string. Not included in the collection bundle or any published HACS release yet. Do not add a second resource for the same card.

Supported mobile viewport: 360px and wider. Default width is six of twelve section columns, auto height; every interactive target is at least 44px high. Long labels wrap. Native HA light/dark themes tested at 360px, 390px and 1280px. This local beta currently uses Dutch labels; existing cards remain unchanged.
