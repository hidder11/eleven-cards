# Summed sensors: local push preparation

## Scope

Prepared from fetched `origin/develop` (`671cd0f`) on `feat/summed-sensors-ready`.
Graph/Bar and Heatmap summed-sensor commits were cherry-picked in that order.
No push, PR, permanent-branch merge, release, deployment or Home Assistant installation was performed.

`sum_entities` is opt-in: Graph/Bar use it on a `series_options` row;
Heatmap uses it beside `entity`. A primary sensor plus at most seven additional
sensors with exactly matching units produce one named series. Missing readings
remain gaps, not zeroes. See the individual card READMEs for source and aggregation constraints.

## Review corrections

- Preserve develop's live statistics legend when resolving the Graph cherry-pick
  conflict, and sum all live contributors rather than showing only the primary.
  Contributor-only state changes now invalidate the legend render signature;
  unavailable contributors produce an unavailable total.
- Snapshot the summed-source context at refresh start, not only in the `hass`
  setter. When `hass` precedes `setConfig`, a first pending W request must be
  invalidated if both sensors change to kW together. Otherwise its old W values
  can be accepted under new kW metadata.
- Both corrections have test-first regressions for History and inherited Bar.
  The unit lifecycle tests failed 2/2 before the context fix, then passed.
  The live legend tests failed with `2 !== 4` before the legend correction.
- The summed browser fixture now scrolls its chosen Heatmap cell into view before
  asserting tooltip visibility. Offscreen cells intentionally cannot show a tooltip.
- The existing Bar browser fixture now waits for the delayed single-click legend
  toggle (double-click isolation support). Its immediate count assertion failed
  against both the develop baseline bundle and the candidate; retrying assertions
  retain the same expected counts and pass.

## Executed gates

- `npm test`: PASS, including its root build. Root Node suite 492/492;
  Energy Node suite 67/67; Energy Python suite 20/20;
  History Node suite 129/129. No failures, skips or cancellations.
- `npm run check`: PASS for the combined bundle and all ten standalone bundles.
- `git diff --check`: PASS.
- Generated Graph, Bar, Heatmap, Timeline and combined bundles are included.
  Timeline changes only because it embeds the shared summed-series insight-name
  helper; its source has no task-specific changes.

## Synthetic browser evidence

Playwright 1.56.0 with existing Chromium 145.0.7632.6; entirely offline synthetic
fixtures, with stubbed `ha-form`. No Home Assistant credentials or live writes.

- Summed fixture: PASS at 1280, 390 and 320 px, light and dark (six views).
  Each view checks Graph, Bar and Heatmap totals, gaps, one Graph/Bar legend row,
  no card-level horizontal overflow, visible tooltips, frozen editor feedback and
  config reopen. It also changes both contributors W -> kW and verifies freshly
  scaled totals without stale old-unit values. Zero page errors.
- Collection smoke: PASS, one test verifying ten card/editor registrations,
  duplicate loading and unique picker entries, with zero page errors.
- Existing standalone Bar fixture: PASS across six width/theme views; tooltip
  bounds, legend hide/recovery, keyboard/Escape, zoom/raw-cache retention and
  stacked gradients. Zero page errors.
- Desktop and mobile captures were visually inspected: totals and deliberate
  gaps render correctly, headers wrap on narrow cards, and Heatmap retains its
  intentional internal horizontal scrolling. Narrow period controls truncate
  their labels; no new outer overflow was observed.

Evidence is local scratch data, intentionally not committed as screenshots:
`$TMPDIR/eleven-sum-ready-browser/` (summed report and captures),
`$TMPDIR/eleven-sum-ready-bar-browser/` (Bar report and captures), and
`$TMPDIR/eleven-sum-ready-npm-test.log`.
The Bar/smoke scratch launcher only substitutes the installed Chromium path and
Bar evidence destination; it does not change test assertions.

## Remaining limits and review

This is not native HA integration testing. Native entity selectors, real Recorder
history/statistics, real sensor unit transitions, phone touch behavior and
installation remain unverified. No breaking YAML migration is intended. Shared
history loading, insight naming and independent/combined bundle interactions
still deserve human review before push. No unrelated worktree modifications
were copied or reverted.
