# Benchmark explorer (interactive)
**The artifact is the live tool and the source of truth for the model and its assumptions. This doc is a pointer and is not maintained.**

https://claude.ai/code/artifact/c90fad60-5217-4399-9bb1-17bb1c2a54ad

`benchmark-explorer-src.html` alongside this file is the authored source, mirrored from the live artifact (last synced Aug 28, 2026). It is a snapshot for diffable history, review, and recovery — not the deployment. Before editing, `Artifact read` the URL and build on the live version, then republish and re-sync the file; the artifact can move ahead of this copy. The file holds the authored page only — the publish-time `<!doctype html>`/`<head>`/`<body>` wrapper is added by the artifact service and is deliberately not committed.

Companion to `claude/benchmark-matrix.md`; calibrated to business-plan.md v0.3.3 §5–6. The artifact's notes card documents the model, calibration, and the correction to the matrix doc's "SN/HT: subtract ~$22K per cell" shortcut.

Aug 28, 2026 — owner-comp bar respec applied. The $30K owner-draw bar (the plan's §9 partial-income floor) is retired. Owner comp is now read against two economic-profit tiers, both starting from a living wage (~$48K: 40 hr × 52 × the Wages rung's loaded rate, so it moves with that lever) and adding a return on capital at risk (a new lever defaulted to $240K):

- **The bar** — living wage + 10%, i.e. a living wage at zero opportunity cost. $72K at the default.
- **The economic band** — living wage + 20% or more, the risk-adjusted return. Opens at $96K.

A living wage alone is no longer a marker. The notes card carries the rationale.

Aug 28, 2026 — Wages lever respec. **MIT living is the default rung and the comparison baseline**; the D6 rung is renamed **Living+**. Each rung is now priced bottom-up from three parts rather than asserted as a round loaded rate: the worker's take-home cash wage, the employer payroll load on it (FICA 7.65% + FUTA/MD unemployment ~0.7% on capped bases + workers' comp ~2.0% = 10.35%), and employer-paid benefits. The rail shows that breakdown per hour and per full-time year (2,080 hr) for the selected rung, plus its total-comp delta against MIT living and the owner-comp consequence.

| Rung | Take-home | Payroll | Benefits | Total comp | Labor |
| --- | --- | --- | --- | --- | --- |
| Market | $15.00 | $1.55 | — | $16.55 | ~$86K |
| Market+ | $16.50 | $1.71 | $0.85 | $19.06 | ~$99K |
| MIT living *(default)* | $21.03 | $2.18 | — | $23.21 | ~$121K |
| Living+ | $21.03 | $2.18 | $1.50 | $24.71 | ~$129K |

The respec corrects two things the old rungs hid. The MIT rung was carried "loaded-light" at $21.50 — about 2% above the $21.03 it claimed to pay, less than the employer's payroll taxes alone; properly loaded it is $23.21 and implies ~$121K of labor, not ~$112K. Run backwards on D6, the same arithmetic says $23/hr "fully loaded" buys $20.84 of take-home — *under* MIT's living wage, not over it — so "Living+" is only true of that rung once it is priced at $24.71. The site basis is still calibrated on the plan's own $120K labor line, so the default view now reads ~$1K under the published §6 base case for that reason alone.
