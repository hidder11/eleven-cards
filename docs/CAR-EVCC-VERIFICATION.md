# EVCC card verification

EVCC charging is now part of custom:eleven-car-card with evcc_enabled: true. The standalone EVCC card and Climate prototype have been removed. The Car test build uses custom:eleven-car-card-test; see the root README and Car documentation for installation.

## Current scope

The selected Gallery design is now the dashboard card: large SOC and range, full header glow, a bright charging sweep inside a 12px battery capsule driven by 0-11 kW, static vehicle area and rounded status icon, equal metric tiles with 12px padding and matching secondary-text spacing, and shared Controls/Session/Details tabs. The opaque status tile is borderless and the header background continues behind it. The header omits visible vehicle name, target text and duplicate status; the battery bar retains its target marker. Session solar percentage is a regular label/value under duration; its former bar and energy-split block are removed.

Zonnevoorkeur is borderless, has a custom native range track and short description, and appears in raw modes pv, minpv and smart. Mode buttons preserve actual available raw select options, presenting pv/minpv as one Smart button. Service calls retain confirmation, failure, timeout and offline handling. Hiding charging controls removes the entire tab, including solar preference. Entity detection and overrides, image entity updates, accessibility labels, keyboard tabs, focus retention and internal scrolling remain in use.

Power history is requested lazily for the visible Session tab, at most once a minute, for the selected loadpoint's complete latest connection session. Invalid intervals remain gaps. Missing Recorder data and request failures show an availability message. The shared stepped graph retains pointer and keyboard interaction. Session metrics use 11px labels and 18px values.

Charging status uses explicit connection/charging entities. Missing power is distinct from zero; both pause the battery sweep. W and kW units are supported, with animation speed clamped to 0-11 kW. Only charging and explicitly planned charging show the sweep; waiting, completed and disconnected states are static. Reduced-motion preferences disable all animations. Charging-only finish estimates use the remaining-duration timestamp and HA timezone. Vehicle-area animations are removed and status icons stay static.

Charging planning is removed and obsolete configuration is stripped. No plans on EVCC are modified.

## Checks

- 36 EVCC unit tests pass, including power conversion/clamping, fixed state symbols, detection, solar confirmation/errors, history gaps and stale responses.
- Six collection/packaging tests pass.
- 68 rendered Chrome checks cover service actions, history, offline recovery, images, editor, focus and constrained light/dark layouts.
- 187 additional dashboard Gallery checks cover power speed, zero/unknown pause, conditional solar preference, uniform tiles and secondary-text gaps at 280/360/420px, static status symbols, and top-right title alignment with SOC across image scales and card widths.
- The separately named test card/editor render alongside the regular card. Reduced-motion is checked separately.
- Standalone, collection and separate-name test artifacts are built and syntax checked.

Browser checks inspect rendered DOM and computed styles with fictitious entities and a ha-form fixture. No screenshots or recordings are taken. Historical design alternatives are no longer part of the browser regression suite; qa/index.html tests the current dashboard implementation.

## Live verification

No live Home Assistant instance or car settings were modified. Actual entity names, vehicle image, installed solar-share entity and service responses need verification on the user's dashboard. Buttons and sliders on the installed test card send real EVCC commands. If solar share is not detected, select its number entity in the editor's entity overrides.

## Existing unrelated failure

The unchanged energy card's Python suite previously passed 19 of 20 tests. test_status_only_appears_for_incomplete_price_data expects a literal condition absent from its source at HEAD. This EVCC change does not touch that source or test.

Plan status: only the selected loadpoint's explicit plan_active signal plus actual charging selects an indigo tone and the subtitle Volgens laadplanning below Laden. Absent, off or unavailable plan signals retain the gold Laden state. No plan_active_alt/time fallback is used. EVCC source confirms planActive indicates a currently active slot: https://github.com/evcc-io/evcc/blob/master/core/loadpoint.go . ha-evcc exposes it as a binary sensor: https://github.com/marq24/ha-evcc/blob/main/custom_components/evcc_intg/const.py . No planning controls are added.

Smart-mode visibility now supports pv/minpv/smart, with the resolved number entity still required. The editor replaces vehicle_name with image_scale (50-150%, default 100%). Normalization strips old vehicle_name values and validates scale bounds. Browser checks cover all three modes, editor persistence and image layout at 50/100/150% at 280/420px without battery overlap.

Full session history resolves the latest on/off interval from Recorder connection history, caches its boundaries per connection, and requests power from connect to disconnect/now. Pauses stay in the window. Connection changes invalidate pending power results. Recorder gaps and unknown boundaries are not filled with a fabricated hourly range. Three additional unit tests cover session windows, full-range requests and stale responses after reconnect; the browser verifies a three-hour session and modern Off/Smart/Snel buttons.

Remaining energy and CO2 are removed from the Session tab; it ends with the full-session power graph. The browser layout check confirms both metrics and their former enclosing block are absent.

The production editor now offers five backgrounds: Energy Lanes (default), Halo, Silk Flow, Prism Glass and Eclipse. Normalization validates the background identifier and defaults older configurations to lanes. Native markup groups the hero and status tile in one fading background scene. Colors follow the explicit presentation tone and HA darkMode; unknown data remains neutral. Waiting no longer infers solar shortage or a tariff pause from enabled/smartCostActive.

Browser verification covers dropdown persistence for every design, native light/dark colors and scene layout at 280/420px, all seven status examples across all five designs, and existing services/history/focus/image checks. The separate preview remains available. Installation resource version: galerie-25.

Image containment fix: intrinsic image sizing could expand the implicit grid row below the 145px picture box (observed at 201px). The image is now absolutely contained with object-fit: contain; the picture clips overflow and reserves an 8px gap above the battery track. Stage height includes that gap. Rendered checks measure the actual img element at 260/280/320/420/700px and 50/100/150%, asserting a fixed viewport and separation from the battery text and track.

Image scale now zooms the image inside that fixed viewport rather than increasing stage height. Browser checks assert that stage, header-scene and viewport heights remain identical at 50/100/150%, while the image grows and clipping keeps the visible image above the track at all five tested widths.

The session graph now uses the shared step path, a 2px non-scaling stroke and a vertical gradient area. Each known segment closes independently, preserving Recorder gaps. Hover markers use a fixed 10px HTML circle over the responsive SVG, avoiding non-uniform SVG scaling; browser checks assert roundness and point alignment at 260/420/700px and retain keyboard/focus checks. The stepped area has a unit test covering gaps, singleton readings and zero power.

Image zoom range extended to 50?300% in normalization and editor. The image viewport now spans the fixed vehicle stage above the battery track, centers the image horizontally and layers it in front of the percentage. It clips outside the stage and does not intercept pointer input. Rendered checks cover 50/100/150/200/300% at 260/280/320/420/700px, assert horizontal centering and fixed header height, and verify overlap/layering at 200/300%.

Vertical image offset is configurable via a -150..150px slider and image_offset_y YAML (default 0, negative up). Validation covers bounds and invalid values; rendered checks cover both endpoints and zero at 260/420px and 100/300% zoom, editor persistence, fixed height, centering, precise 150px movement and clipped battery-track clearance.

Removal verification: standalone EVCC registration/builds and the Climate prototype are removed. The EVCC engine and its regression tests now belong to Car. Browser checks cover 326 general Car cases, 71 charging-interaction cases and 214 charging-gallery cases, plus Weather/Car alignment and the configuration gallery. No live Home Assistant installation was changed.
