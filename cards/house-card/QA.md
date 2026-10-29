# House implementation QA

This is offline synthetic component verification, **not native Lovelace / authenticated Home Assistant QA**. No Home Assistant server, household image assets, dashboard configuration, credentials or physical devices are used.

## Automated coverage

- Root `npm test`: builds all standalone cards and the collection, runs root/card Node suites and the existing Energy Python unit suite.
- Root `npm run check`: syntax checks collection and every standalone bundle, including House.
- `tests/browser-smoke.py`: Chromium collection load, duplicate load, picker entries and editor construction, including all twelve picker cards.
- `cards/house-card/tests/browser-house.py`: six offline browser scenarios covering approved defaults, stage/header/caption bounds, unit-aware live weather mapping, both cameras/four phases/both themes, unchanged compositor pixels, more-info and explicit-only light actions, disconnect/reconnect, reduced motion/offscreen/resize/DPR/320px layout, Page Visibility controlled seam and HA connection state, same-phase wind canvas pixel equality, aliases/editors/keyboard/duplicate load.
- House Node suites: actual particle paint commands, 80/20 fade stops, long-session gentle snow, independent integrated wind-clock speed and unrelated HA updates, safe unknown state/unit handling, linear alpha compositor, solar modes, authoritative area binding, escaped known-zone statuses, SHA-256 fallback, manifest pointer/lazy mode loading/cache, corrupt checksum rejection and manifest-owned gzip checksums.

## Visual check

Synthetic screenshots were inspected in Chromium at 460px/dark/snow and 320px/light/storm. Header and metrics remained readable, the overlay excluded caption buttons, and no horizontal overflow was observed. The silhouette is an intentionally generic fixture, not evidence of fidelity against any real house. Screenshots are local scratch artifacts only, not committed.

## Reproduction

Install Playwright in your own Python environment as described in the repository CONTRIBUTING guide. Run:

```sh
npm test
npm run check
python tests/browser-smoke.py
python cards/house-card/tests/browser-house.py
```

An already installed Chromium can be selected using `BROWSER_EXECUTABLE=/path/to/chrome`. The browser test creates an ephemeral loopback HTTP server, generates synthetic float32 assets in memory, and closes the browser/server on completion. The visibility test explicitly overrides the browser's read-only signal as a controlled seam; it is not a claim about authenticated HA or an actual background tab.

## Executed results

- `npm test`: passed — root/card Node batch **511/511**, Energy Node **74/74**, Energy Python **20/20**, History Node **137/137**; zero failures and zero skipped Node tests.
- `npm run check`: passed for the collection and all twelve standalone card bundles.
- Collection browser smoke: **1/1** passed.
- House browser QA: **6/6** passed, no page errors.
- `git diff --check`: passed.

Browser execution used an existing Chromium executable selected through `BROWSER_EXECUTABLE` and an isolated Playwright Python environment. These are local execution results, not CI or native HA claims.

## Still separate

Real household rendering assets, native HA visual editor behavior and native dashboard integration require independent authorized verification. No deployment, resource/config mutation, rendering, automation changes, push, PR or merge is part of this implementation. Holidays are intentionally deferred.
