# AI working agreements

Read `CONTRIBUTING.md` before working. Keep the process small and explicit.

- Work on one scoped task branch from fetched `origin/develop`, in your own checkout/worktree. Never share a working directory with another agent. Hotfixes may start from main as documented.
- Inspect status first. Preserve all unrelated local modifications. Never reset, stash, discard or commit somebody else's work without explicit permission.
- Inspect existing source, tests and documentation before choosing APIs or changing behavior. Do not invent configuration or claim unexecuted tests passed.
- Edit source files; run `npm test` and `npm run check`, and commit the affected generated bundles with the source. Run the browser smoke test when changing collection packaging. Visually verify UI changes where possible; state missing checks plainly.
- Open task PRs against `develop`; squash only short-lived task branches. Use merge commits for `develop` → `main` and hotfix synchronization between permanent branches. Never delete main/develop.
- Ask for explicit human authorization before merging, creating/publishing releases, changing repository security/settings or installing anything in Home Assistant. A request to implement the initial repository setup authorizes that setup only, not future autonomous releases or deployments.
- No secrets, tokens, private addresses, household evidence or personal screenshots in commits or logs. Actions must not need Home Assistant credentials.
- Call out breaking configuration changes and any security/data-loss implications; request human review of risky/shared/release changes. Do not silently broaden scope or disable checks to get green CI.
- Report what changed, which tests actually ran and what remains unverified. Never claim a browser smoke test is a full HA integration test.
