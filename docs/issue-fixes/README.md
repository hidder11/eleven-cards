# Issues 53–56

Screenshots show the built production collection with fictional Home Assistant
data in `review/issues-53-56.html`. They do not show a live dashboard.

- #53: identical Car image proportions and alignment in regular and EVCC mode,
  including compact density; image scale and offsets use the same coordinates.
- #54: Energy detail bars use the shared 12 px rounded Car track. Energy colors,
  percentages and static informational behavior are preserved.
- #55: diagram readings keep their unit on the same line with an explicit 4 px
  gap, including narrow cards.
- #56: 4 px after navigation, a 28 px pointer legend row and 8 px before events.
  Touch targets remain 44 px; long names wrap and keyboard filtering remains.

Run `python tests/browser-issues-53-56.py` for rendered checks at 300, 360, 489
and 640 px, compact/standard density, native/Material and light/dark themes.
The test also checks touch targets, keyboard toggling and isolation. It is part
of CI. Existing card browser suites cover interactions and unavailable data.

To regenerate `issue-53.png` through `issue-56.png`, explicitly authorize
screenshots first and then set `ISSUE_SCREENSHOTS=1` when running this test.
The default run never captures screenshots.

## Issue 57

Compact header metric surfaces now use the shared density geometry for Weather,
Energy and Car, including EVCC: 8px padding, 11px labels, 20px numbers and a 2px
title/value gap. Standard density, themed paint, data and entity actions remain.
Optional detail text and wrapped labels can still increase the surface height.

`python tests/browser-issue-57.py` checks the four cards at four widths in both
themes and light/dark modes with system and monospace fonts, plus keyboard
actions, zero and unavailable data. Height comparisons account for wrapped title
rows shared by CSS subgrid; padding, value geometry and density must still match.
Long labels must grow without horizontal overflow.
With explicit screenshot authorization, `ISSUE_SCREENSHOTS=1` captures
`issue-57.png`: the actual compact reading rows, with unrelated header areas
hidden for comparison, using fictional data. The default run captures nothing.
