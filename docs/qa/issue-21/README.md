# Issue #21: Timeline name-to-bar spacing

Synthetic Recorder history for six example switches, with 12 px bars and the new default `label_gap: 2`. No live Home Assistant instance or household data is used.

- [Wide, dark theme (489 px)](wide-dark.png)
- [Narrow, light theme (320 px)](narrow-light.png)

The labels sit directly above their bars. Names retain a minimum 24 px target and wrap for long text. The independent `row_gap` remains 16 px.

Reproduce from the repository root using Node.js 22+ and Chrome:

```powershell
$env:QA_SCREENSHOTS='1'
$env:QA_ISSUE='21'
node tests/browser-timeline-label-spacing.mjs
```

Without `QA_SCREENSHOTS=1`, the runner only checks geometry and interaction. It verifies default/zero/maximum label gaps, independent row spacing, long names, hidden names, narrow/wide layouts, and Shift+Enter isolation/restoration. These are offline browser checks, not live Home Assistant verification.
