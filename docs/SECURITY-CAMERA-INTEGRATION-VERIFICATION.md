# Security Camera integration verification

Verified on 2026-11-09 while merging develop 7a6a7ae into feat/security-camera-ui.

The merge retains develop's current cards, shared rendering wrappers, theme fixes,
release workflows and immutable House provenance. The Camera bundle now includes
the detail surface's new ui-bar dependency and uses develop's shared tab component.
The generic background editor exposes the four new animated styles and extended
header fade without adding a second wrapper to existing cards.

## Passing checks

- npm test: 803 collection/component tests, 76 price tests, 20 Python tests,
  and 137 History tests (1,016 JavaScript tests and 20 Python tests total).
- npm run check; git diff --check; generated collection rebuilt.
- The source-only reproducibility test rebuilds all bundles in a temporary copy.
- Camera Chromium checks: 123 card, 426 theme, 7 activity checks.
- New animated backgrounds: 330 integration checks across the original eleven cards.
- Production background Chromium suite: 18 review examples plus House aliases,
  light/dark/mobile, editors, animations, graph clipping and native actions.
- Playwright collection smoke: 2 tests, including repeated loading and editor state.
- Playwright all cards: 148 assertions, 46 renders and 46 editor instances across
  twenty cards, both themes, three standalone/collection migration scenarios;
  zero runtime/console errors and zero unmocked requests.
- Playwright production defaults: 809 assertions, 76 renders and editors across
  nineteen cards in both themes, for collection and standalone bundles.
- Calendar compact and legend browser regressions pass.

## Existing standalone QA failures

The optional browser-weather, browser-energy-flow, browser-car-evcc and
browser-configuration-gallery runners still assert older native background,
rounding or battery-track DOM. Each fails identically when the fixture server
serves the unchanged develop bundles. These runners were not weakened or used
as evidence of passing functionality. The current collection/background suites
above exercise the merged production implementations instead.

## Scope

Windows, Node.js 22.15.0, Python 3.13, Playwright 1.56.0 and installed Chrome.
Synthetic fixtures only; no live Home Assistant/device commands. No screenshots
were captured. QA_SCREENSHOTS=0 disables evidence capture in the all-card and
background-default runners while keeping their DOM/runtime assertions active.
