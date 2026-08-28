# Benchmark explorer (interactive)
**The artifact is the live tool and the source of truth for the model and its assumptions. This doc is a pointer and is not maintained.**

https://claude.ai/code/artifact/c90fad60-5217-4399-9bb1-17bb1c2a54ad

`benchmark-explorer-src.html` alongside this file is the authored source, mirrored from the live artifact (last synced Aug 28, 2026). It is a snapshot for diffable history, review, and recovery — not the deployment. Before editing, `Artifact read` the URL and build on the live version, then republish and re-sync the file; the artifact can move ahead of this copy. The file holds the authored page only — the publish-time `<!doctype html>`/`<head>`/`<body>` wrapper is added by the artifact service and is deliberately not committed.

Companion to `claude/benchmark-matrix.md`; calibrated to business-plan.md v0.3.3 §5–6. The artifact's notes card documents the model, calibration, and the correction to the matrix doc's "SN/HT: subtract ~$22K per cell" shortcut.

Aug 28, 2026 — owner-comp bar respec applied. The $30K owner-draw bar (the plan's §9 partial-income floor) is retired. Owner comp is now read against two economic-profit tiers, both starting from a living wage (~$48K: 40 hr × 52 × the Wages rung's loaded rate, so it moves with that lever) and adding a return on capital at risk (a new lever defaulted to $240K):

- **The bar** — living wage + 10%, i.e. a living wage at zero opportunity cost. $72K at the default.
- **The economic band** — living wage + 20% or more, the risk-adjusted return. Opens at $96K.

A living wage alone is no longer a marker. The notes card carries the rationale.

## Preview artifact (development)

https://claude.ai/code/artifact/ee469004-6be9-4f6f-b87a-7fffda1a9822 — a second,
private artifact that renders the same page. Publish in-progress work here to
look at it in a browser without touching the live artifact above, so several
changes can be staged and reviewed together before one publish goes out.

It is byte-identical to `benchmark-explorer-src.html` except for the `<title>`
(`Benchmark Explorer Preview`, so the two are distinguishable in the artifact
gallery and browser tabs) and its 🚧 favicon.

Working on a change (from a cloud session or locally):

1. `Artifact read` the live URL and reconcile `benchmark-explorer-src.html` with
   it — the live artifact can move ahead of the committed file.
2. Edit `benchmark-explorer-src.html` on a branch.
3. Build the preview copy and publish it, passing the preview URL so it updates
   in place rather than minting a new artifact:

   ```
   sed 's|<title>Albemarle Benchmark Explorer</title>|<title>Benchmark Explorer Preview</title>|' \
     projects/club/claude/benchmark-explorer-src.html > /tmp/benchmark-explorer-preview.html
   # then: Artifact publish that file with
   #   url: https://claude.ai/code/artifact/ee469004-6be9-4f6f-b87a-7fffda1a9822
   ```

4. When the change is accepted, publish the same content to the live URL
   (`c90fad60-…`) from the unmodified `benchmark-explorer-src.html`, and merge
   the branch.

Two changes in flight at the same time share one preview artifact, so whoever
publishes last is what the preview shows. For genuinely parallel work, give each
branch its own preview: publish a copy under a distinct file path and title
(e.g. `<title>Owner-Comp Preview</title>`) with no `url`,
which mints a fresh artifact, and record that URL on the branch's PR. Delete
nothing; unused previews are private and harmless.
