# Eleven Room Card — local beta

Mobile room summary and navigation for a Home Assistant dashboard. The room title uses the graph-card typography, without a decorative room icon. The optional note subtitle matches the Car card subtitle, including its short Home Assistant accent-colour line. Uses inherited Home Assistant theme variables; the HA automatic theme follows the device's system preference. Configured scene buttons call Home Assistant scene.turn_on; light controls only open more-info. The room name navigates; the separate light button opens the primary configured light/group's native more-info dialog. Room detail pages contain normal HA controls.

```yaml
type: custom:eleven-room-card
name: Woonkamer
scenes:
  - scene.avond
  - scene.film
  - scene.lezen
lights:
  - light.woonkamer_verlichting
temperature_entity: sensor.luchtmeter_woonkamer_temperature
humidity_entity: sensor.luchtmeter_woonkamer_humidity
navigation_path: /nieuw-huis/woonkamer
```

Optional `note` identifies temporary device mappings. `lights` must contain light entity IDs, without both a group and its members. Unknown/missing/unavailable lights are explicitly reported; an unconfigured room says `Nog niet gekoppeld`. Optional `humidity_entity` shows relative humidity beside the temperature, using the same compact text style. Missing or non-numeric readings are omitted, never replaced by zero; valid 0% humidity remains visible. Humidity outside 0-100% is omitted. Native `getConfigForm()` exposes the name, icon, scene list, light list, temperature and humidity sources, local route, and note.

Build and test from repository root:

```sh
node --test cards/room-card/tests/*.test.mjs
node cards/room-card/scripts/build.mjs
node --check cards/room-card/dist/eleven-room-card.js
```

Standalone output: `cards/room-card/dist/eleven-room-card.js`. Installed locally at `/local/eleven-cards/eleven-room-card.js` with a hash query string. Not included in the collection bundle or any published HACS release yet. Do not add a second resource for the same card.

Supported mobile viewport: 360px and wider. Default width is six of twelve section columns, auto height; navigation targets are at least 44px high; scene and light buttons share the compact 36px size, 16px icons and theme button radius. Buttons with optional scene names expand horizontally. Long labels wrap. Native HA light/dark themes tested at 360px, 390px and 1280px. This local beta currently uses Dutch labels; existing cards remain unchanged.

## Shared card background

The visual editor includes **Card background / Kaartachtergrond** with the shared styles, colour source, transparency, animation and whole-card or fading top-section coverage. The same `card_background` YAML object works across all cards. See [shared configuration](../../README.md#shared-card-background) for options and legacy compatibility.

## Configuration examples

The [room detail gallery](../../review/detail.html?card=room-card) shows five working configurations: a living room with two lights, a bedroom with temperature and humidity, a compact office, a kitchen with an unavailable light, and an unconfigured guest room. All reuse the production card and shared theme, with Atmospheric flow in a fading 240 px top section. The examples use fictitious entities.

Optional `scenes` is an ordered list of scene entity IDs, shown in a row above the light-status row, with `Scenes` on the left and compact icon buttons aligned right. Icons use each scene entity's icon, falling back to `mdi:palette-outline`. Set `show_scene_names: true` to also display the friendly names; names remain available as tooltips and accessible labels when hidden. Missing, unavailable and disconnected scenes cannot be activated. An in-flight request disables the row to prevent duplicate calls; failed calls show a retry message. Without scenes the row is omitted.
