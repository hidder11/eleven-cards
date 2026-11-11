# Performance and stability audit — 2026-11-11

Audited all 20 collection card types and Car's EVCC mode, starting at fetched
develop (`d51e7e5`). The earlier issue fixes in PR #49 remain a separate change.
No Home Assistant installation, credentials, household data or live services
were used. This is component and synthetic Chromium verification, not a live
Home Assistant integration certification.

## Changes and evidence

- **Room, Shopping, Scene Engine and Energy Flow:** skip unrelated HA state
  updates while keeping the latest HA object for actions. Tests also change
  relevant entity values/metadata, source preferences, language, permissions,
  themes and connection state, including in-place mutations. Energy includes automatically discovered power
  sources and custom-tab entities. Scene Engine includes scenes named in its
  requests. Relevant entity values and mutable connection flags are snapshotted.
- **Car/EVCC:** stop the one-second clock and history requests while the document
  is hidden or the card is outside the viewport. Resume through the existing
  visibility observer. Plain Car mode does not start the EVCC clock.
- **Waste:** calendar reads have a 15-second deadline. A stalled read no longer
  locks refreshing forever; explicit retry works and late answers are ignored.
  Changing the HA connection invalidates old requests and cached responses.
- **Camera:** a 15-second snapshot deadline covers the request, response body
  and image decoding. Timeout aborts the HTTP request, releases temporary blob
  URLs/handlers and allows scheduled recovery. Activity history also times out
  and resumes its existing polling rather than staying in its loading state.
- **Appliance Planner:** tariff reads and integration preview reads have a
  15-second deadline. Errors release loading and the cached tariff promise;
  subsequent computation can recover. Write operations retain their existing
  acknowledgement semantics and are never automatically retried.
- **Timeline:** computing the earliest recorder timestamp no longer spreads
  an unbounded history array into `Math.min`. A 200,000-reading regression
  verifies successful processing and preserved initial missing coverage.
- **Heatmap:** scale and summary calculations use bounded accumulators instead
  of several flattened arrays and unbounded function arguments. A 200,000-cell
  regression verifies extrema, average, count, missing coverage and total.
- **Calendar, Weather and Shopping:** subscription teardown tolerates both
  thrown errors and rejected promises, including late subscription completion.
  A failed unsubscribe no longer interrupts other cleanup or escapes as an
  unhandled rejection.

The shared HA read deadline releases the caller; HA WebSocket requests cannot
be physically cancelled through this helper. Late responses cannot overwrite
the timed-out read's result. Camera HTTP requests use an AbortController.

## Coverage by card

Every row received source review plus real Chromium cold-start/render/editor,
update-burst and removal/reconnection checks. “No change” means no additional
confirmed defect was selected for this patch, not proof that none can exist.

| Card | Audit focus / outcome |
| --- | --- |
| Dynamic Energy Price | Tibber/consumption caches, read deadlines, connection listeners, retry clocks; no additional change |
| History Graph | Request generations, refresh deadlines/backoff, aggregation/decimation, hover and popup cleanup; no additional change |
| Bar Chart | Inherited request lifecycle, aggregation, dense bars and interval geometry; no additional change |
| Timeline | Large history response argument overflow fixed |
| Overview | History deadline/generation, reading animation and resize cleanup; no additional change |
| Heatmap | Large-cell scale/summary allocation and argument overflow fixed |
| Calendar | Subscription error isolation and late cleanup fixed |
| Weather | Subscription error isolation fixed; forecast clock/cache/DOM patching reviewed |
| Car | Entity/media-image request generations, retries, image reuse and expiry reviewed |
| Car EVCC mode | Invisible clock and history work paused; registry cache and action acknowledgements reviewed |
| Energy Flow | Unrelated update work removed; read versions, details, history refresh and dependency changes reviewed |
| Camera | Hung snapshot/decode and activity-history recovery fixed; blob, polling, player and alarm cleanup reviewed |
| Shopping | Unrelated update work and unsubscribe errors fixed; FIFO writes retain original targets and are not retried automatically |
| House | Shared 96 MiB asset cache, lazy modes, checksums, render identity and animation cleanup reviewed; no change |
| Material House | Immutable upstream closure/provenance, detached-load guards and adapter cleanup reviewed; no change |
| Actions | Fingerprint, resize observers and pending service actions reviewed; no change |
| Controls | Fingerprint, range changes and service acknowledgements reviewed; no change |
| Waste | Stalled reads, stale connection responses and retry recovery fixed |
| Appliance Planner | Stalled tariff/preview reads and cached promise recovery fixed |
| Room | Unrelated update DOM replacement removed |
| Scene Engine | Unrelated update DOM/layout work removed; reset permissions and fresh-snapshot feedback preserved |

## Browser stress results

The repeatable test sends **200 unrelated state updates per scenario**, then
removes and reconnects each card **three times** before final removal. It tracks
timeouts, intervals, animation frames, active observers and document/window
event listeners. All 21 scenarios returned to zero tracked resources and made
zero extra HA requests during the update burst. The combined runner also passed
46 light/dark render cases, 46 editor configurations and three migration/load
orders; there were no page errors, console errors or unexpected network calls.

Representative timings on the same local Chrome, in milliseconds for each
200-update burst:

| Card | Before | After |
| --- | ---: | ---: |
| Energy Flow | 376.0 | 4.4 |
| Scene Engine | 373.9 | 4.4 |
| Shopping | 162.7 | 1.6 |
| Room | 138.1 | 1.7 |

Before uses commit `5fa8ce3` (PR #49), whose prior visual issue fixes are
independent of these optimizations. The same browser regression fails there
because unrelated updates replace Room's DOM. These timings are observations
from synthetic fixtures, not dashboard-wide speed guarantees or CI thresholds.

## Validation and reproduction

- Node.js 22.15.0; Python 3.13; installed Chrome; offline synthetic fixtures.
- `npm test`: 1,061 Node tests and 20 Energy Python unit tests passed.
- `npm run check`, `git diff --check`, and generated bundle review.
- `QA_SCREENSHOTS=0 python tests/browser-performance-stability.py`: all-card
  render/migration/editor suite plus update/resource stress. Set
  `BROWSER_EXECUTABLE` when selecting an installed Chromium.
- `python tests/browser-smoke.py`: duplicate registration/editor smoke.
- `node tests/browser-camera.mjs` and
  `node tests/browser-calendar-compact.mjs`: targeted rendered checks.
- Shopping's built-module browser suite: 26 tests passed. Scene disclosure
  scroll regressions passed in source, standalone and collection modes.
- On Windows, use `PYTHONUTF8=1` for older Python runners that read bundles
  without an explicit encoding. The first local Shopping run exposed two
  in-place dependency regressions, now fixed and covered; its other five text
  failures came from default Windows decoding. The corrected final run passes.
- CI retains the existing all-card render/migration command and adds the new
  update/resource stress case as a separate step.

The optional older `browser-energy-flow.mjs`, `browser-car-evcc.mjs` and
`browser-weather.mjs` runners encountered pre-existing visual/selector
expectation failures. They are not counted as passing. The same failures were
reproduced on the baseline: Energy's `nodes share metric rounding`, EVCC's null
`getAttribute` selector, and Weather's `background lanes fades on a shared layer
before clipping`. Required CI uses the maintained all-card suite and Camera
runner instead.

## Limits

- Synthetic Chromium is not native Lovelace, a real HA reconnect test, or a
  Safari/Firefox test. HA forms and camera players use fixture boundaries.
- Resource counters cover the APIs listed above, not a heap snapshot or proof
  of bounded total memory over weeks. Real large House render assets, prolonged
  media streaming and backend/Recorder performance require separate profiling.
- House and the immutable Material House loader still rely on browser network
  failure behavior for asset downloads; this audit does not add application
  deadlines to those legacy HTTP loaders. Artificially stalled asset downloads
  remain a follow-up stability concern.
- No breaking YAML/editor change, release, merge or live deployment is made.
