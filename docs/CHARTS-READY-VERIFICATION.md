# Charts-ready integration verification

Verified locally on October 28, 2026, on `feat/charts-ready` in the dedicated
`eleven-charts-ready` checkout. This checks the **combined** summed-sensor and
graph-improvements branch, not just either original feature branch.

## Publication revalidation against current develop

Before publication, merged `origin/develop` at `e311aab` (Shopping PR #6)
into the task branch without conflicts. Rebuilt the collection from source;
the incoming Shopping implementation, build scripts, tests and CI remain
unchanged relative to develop.

Reran successfully on this integrated tree:

- `npm test`, `npm run check` and `git diff --check`.
- Graph improvements matrix: 24 width/theme/card cases.
- Summed series: six width/theme cases covering Graph, Bar and Heatmap.
- Native touch regressions: standalone and combined bundles, both widths.
- Updated collection browser smoke test, Bar hover/touch and tooltip scrolling.

Local reports/captures are under `/opt/data/cache/scratch/charts-develop/`;
the root test log is `/opt/data/cache/scratch/charts-develop-npm-test.log`.
These remain synthetic browser checks, not live Home Assistant integration.
The no-publication statements below describe the earlier preparation phase;
remote CI and the PR merge are verified separately during publication.

## Integrated scope and review fix

The starting branch contains `3de2c1d`, `773f6b7`, `8412b10` and `10d62cc`
on develop base `671cd0f`. Existing feature evidence remains in
[SUMMED-SENSORS-VERIFICATION.md](SUMMED-SENSORS-VERIFICATION.md) and
[GRAPH-IMPROVEMENTS-VERIFICATION.md](GRAPH-IMPROVEMENTS-VERIFICATION.md).
The results below were rerun against their integrated source and bundles.

The P2 blocker was reproduced **before changing production source**: extending
`tests/browser-touch-drag.py` to update History's friendly-name metadata during
native CDP touch scrubbing failed its visible/pinned assertion (exit 1).
Previously only Timeline received those during-gesture updates.

The fix in `cards/history-graph-card/src/history-graph-card.js`:

- Tracks the active touch pointer on the card, separately from a pinned tooltip.
- Defers chart replacement during that gesture and flushes the queued render on
  release, cancel or lost capture. Cancellation dismisses the tooltip; release
  preserves the selected timestamp and pin.
- Clears gesture/pending/tooltip state on reconfiguration and detach, preventing
  stranded deferral or stale local selection on reconnect.
- Retains the local cursor/pin across rendering even with `sync_hover: false`,
  and restores tooltips after the current `ha-card.updateComplete`, guarded by
  exact chart identity.
- Removes the outgoing chart's blur handler immediately before DOM replacement.
  Replacing a focused chart fires blur before disconnection; otherwise a deferred
  release can erase the pin. The new chart retains normal user-blur dismissal.
- Preserves History's mouse-only drag zoom and Bar's inherited pointer-time and
  snapped interval adapters. Timeline production source is unchanged.

The Bar browser fixture initially failed its old linear-coordinate assumption
on both the unchanged starting bundle and the candidate. Its mouse checks now
use the actual painted bar geometry, retaining the same stable-guide assertion.
Its additional active-metadata touch regression exposed the focused-chart blur
case above; it now passes, including real focus-loss dismissal. No production
Bar geometry was changed.

Rebuilt and committed artifacts are History's standalone bundle, Bar's
standalone bundle (which embeds History), and `dist/eleven-cards.js`.

## Executed gates

| Gate | Actual result |
| --- | --- |
| `npm run build` | Passed; root build regenerates the standalone and combined artifacts. |
| `npm test` | Passed: 707 Node tests (496 root/companions, 74 Energy, 137 History), plus 20 Energy Python tests. No failed, cancelled or skipped Node tests. |
| `npm run check` | Passed for combined and all ten production standalone bundles. |
| `git diff --check` | Passed. |
| Independent repeat build | All 14 tracked dist JavaScript files retained their SHA-256 values after another root build. |
| `tests/browser-graph-improvements.py` | Passed 24 combined-bundle cases: History/Bar/Timeline/Energy × 1280/390/320px × light/dark fixture variables; duplicate loading, grid toggles/tick geometry, value/label colors, nonnegative axes, tooltip bounds/no page overflow, synthetic built-in Tibber request contract. |
| `tests/browser-summed-series.py` | Passed six width/theme cases, each including Graph, Bar and Heatmap: correct totals, gaps, one-series presentation, controls and tooltips. Combined bundle loaded. |
| `tests/browser-touch-drag.py` | Passed four standalone and four combined-bundle cases: History/Timeline × 390/320px. Each case includes 16 actual friendly-name updates during native touch moves, exact coordinate timestamps, retained chart/capture and pin, per-move sync, release/render flush, post-release metadata update, tap pin, mouse pin isolation, keyboard/Escape, outside dismissal, mouse drag zoom, vertical scrolling/cancellation from a nonzero offset, explicit cancel and detach/reconnect. History also checks sync-disabled local pinning, explicit lost capture and reconfiguration. |
| `tests/browser-smoke.py` | Passed: duplicate combined loading, ten card registrations, card/editor construction and no page errors, with a minimal `ha-form` stub. |
| `tests/browser-bar-hover.py` | Passed seven aggregation periods, keyboard, mouse guide stability, incoming sync, native tap and active-metadata touch drag with snapped values, deferred release, real blur dismissal and six responsive/theme tooltip-bounds views. |
| `tests/browser-tooltip-scroll.py` | Passed nested-shadow scrolling, offscreen sync rejection, hass-refresh non-resurrection, recovery, page-scroll dismissal, tooltip internal-scroll exemption and disconnect cleanup. |

Browser: Chromium `145.0.7632.6`. Python used for every browser fixture:
`/opt/data/cache/scratch/eleven-sum-qa-venv/bin/python`.
Existing browser executable:
`/opt/hermes/tools/chromium-1208/chrome-linux64/chrome`.
No browser/package installation was necessary; `uv` was not required.

## Reproduction and local evidence

Executed from the repository root with
`AGENT_BROWSER_EXECUTABLE_PATH` pointing to the existing browser:

```sh
PY=/opt/data/cache/scratch/eleven-sum-qa-venv/bin/python
EVIDENCE=/opt/data/cache/scratch/charts-ready-final
export AGENT_BROWSER_EXECUTABLE_PATH=/opt/hermes/tools/chromium-1208/chrome-linux64/chrome

npm run build
npm test
npm run check
git diff --check

GRAPH_OUT="$EVIDENCE/matrix" "$PY" tests/browser-graph-improvements.py
"$PY" tests/browser-summed-series.py --output "$EVIDENCE/sum"
TOUCH_OUT="$EVIDENCE/touch" "$PY" tests/browser-touch-drag.py
TOUCH_BUNDLE=combined TOUCH_OUT="$EVIDENCE/touch-combined" "$PY" tests/browser-touch-drag.py

"$PY" "$EVIDENCE/run-browser.py" tests/browser-smoke.py
"$PY" "$EVIDENCE/run-browser.py" tests/browser-bar-hover.py
"$PY" "$EVIDENCE/run-browser.py" tests/browser-tooltip-scroll.py
```

The local `run-browser.py` helper only overrides Playwright's sync/async launch
executable to the existing Chromium (and supplies `--no-sandbox` when absent).
It runs the named repository script via `runpy`; no assertions, fixture data,
application bytes or browser results are substituted. It avoids the older
hardcoded/missing browser paths in these three scripts.

Machine-readable reports and genuine captures are retained locally under the
above evidence directory (`matrix/verified.json`, `sum/report.json`,
`touch/verified.json`, `touch-combined/verified.json`, `bundle-sha256.json`).
Bar captures/report are in ignored `qa-evidence/bar-hover/`.
Execution logs are `/opt/data/cache/scratch/charts-ready-final-*.log`;
the initial History RED log is
`/opt/data/cache/scratch/charts-ready-touch-red.log`.
No screenshots or household evidence are included in this commit.

Visually inspected contact sheets covering all 24 graph-matrix captures, six
sum captures, four combined touch captures and six Bar hover captures. Charts,
light/dark surfaces, selected guides/markers, totals and tooltip bounds render
as expected in these fixtures. The previously documented **320px Energy
Today/Tomorrow heading collision/clipping remains visible**; it predates this
integration and this lifecycle fix, and was not silently changed or called
verified by the no-overflow assertion.

## Limits and remaining work

No remaining blocker was found for the reviewed History gesture fix or local
combined-branch gates. The pre-existing narrow Energy heading issue above
remains outside this fix's scope.

These are credential-free synthetic fixtures, including API-shaped Tibber
replies, emulated native CDP touch and stubbed Home Assistant elements. They
are **not** live Home Assistant/editor/provider integration, actual native HA
theme verification, real-phone testing or cross-browser certification.

No push, PR, merge, release, deployment, Home Assistant write or install was
performed. Other original dirty worktrees were not modified. Human review,
remote CI after an explicitly authorized push, and any live integration/device
checks remain separate steps.
