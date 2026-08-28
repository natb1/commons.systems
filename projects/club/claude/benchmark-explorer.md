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

Aug 28, 2026 — consistency audit of the whole model, prompted by the re-pricing. Three accounting changes, then a full check:

- **Labor is stated as hours × rate.** The plan's $120K line at its own $23/hr is ~5,217 staffed hr/yr (~100/wk), and that grid is what the rung re-prices. `STAFF_HRS` is now an explicit constant rather than a `120 × rate ÷ 23` ratio to a rate no rung carries any more.
- **The site-basis calibration names what it holds fixed.** The basis is back-solved so plan marks reproduce §6, and that solve uses §6's own $120K labor and $6K commons rather than the live lever settings. It has to: if the basis moved with the Wages lever the two would cancel and the lever would do nothing. So the basis is a per-site constant ($107K in Little Italy, $93K in SN/HT), and the default view's −$14K against §6's published −$13K is exactly the $1.1K by which a properly loaded MIT living wage exceeds the $120K line. Nothing is double-counted; a new notes section explains it.
- **The owner's wage-equivalent is no longer the staff rate.** An owner drawing from the LLC carries the SE tax — 15.3% on 92.35% of the draw makes a draw of `cash × 1.0755` the equal of a wage of `cash`, so the employer FICA half is the right uplift — and buys their own benefits, but unemployment insurance and workers' comp cover employees, not the member-owner. Pricing the owner's year at the full staff rate over-counted those two lines. At the default the owner's hour is $22.64 rather than $23.21, so the living wage reads $47.1K and the bar $71.1K.

Verified by driving the page headlessly against an independent re-derivation of the model from the plan's constants: 30 lever combinations plus the §6 calibration at both sites, and the invariants — the breakdown rows reproduce every part and sum to the net; the sidebar sums match; both bars match; the stated marginals ($1.80K per walk-in/day, $4.4K per filled weekly session) are the actual marginals; catering can never attach to more sessions than exist; a matrix cell equals the readout at the same point; and the eight levers that must not touch owner comp (churn, build-out, TI, abatement, grants, venture cash, runway, capital at risk) do not. All pass.

Aug 28, 2026 — the back-solved site basis is retired. It didn't survive a sniff test: it read $107K where §6's occupancy + operations for Little Italy is $143K. The $36K gap was two things the label never said — the day-room and print lines the tool didn't model (~$14K of contribution), and a **$22K café-margin error**. The old 60.6% margin was reverse-engineered from the plan's stated marginal ($8.25 × 360 × 0.606 = $1,800/walk-in/day) and then used to compute a *level*; a marginal rate is not an average rate, and the gap went into the plug.

Both of the plan's numbers turn out to be right. §6's $104K COGS on a $297K café is a 32% cost of sale — a **68% gross contribution margin**. The $1.8K marginal is **net** of the operating costs that ride on revenue. Break those out and they reconcile: 8.25 × 360 × (68% − 5.1%) = $1.87K.

So the model is now a line per §5/§6 quantity, with no catch-all:

| Little Italy at plan marks | |
| --- | --- |
| Café — walk-ins ($297K × 68%) | +$202K |
| Café — catering attach (60%) | +$4K |
| Rooms — evenings (94%) | +$36K |
| Rooms — day (94%) + prints (40%) | +$14K |
| Card fees & marketing (5.1% of $360K) | −$18K |
| Operations — fixed | −$47K |
| Occupancy | −$78K |
| Labor (the Wages rung) | −$121K |
| Commons / books | −$6K |
| **Owner compensation** | **−$14K** |

- **The café contribution margin is now a market-hypothesis lever**, defaulted to 68%.
- **The operations split is derived, not assumed.** §6 gives one operations figure per site ($65K LI / $62K SN). They differ in revenue and nothing else, so the pair solves for a revenue-proportional part (5.1% — card fees ~3% + marketing ~2.5%, the bottom-up lines §6 names) and a fixed base ($46.8K). The check: the fixed base is solved from Little Italy and lands on SN/HT **to the decimal**. That is what says the split is real rather than fitted.
- Gross revenue across the five streams comes to $360K, §5's total. With labor held at §6's $120K the model returns −$12.9K in Little Italy against a published −$13K — it reproduces the base case without being told the answer.

Two residues worth knowing: SN/HT comes out −$36.9K against §6's printed −$35K, but §6's own SN/HT column arithmetic (301 − 85 − 120 − 62 − 6 − 64) is −$36K, so the printed figure is a slip and the remaining ~$1K is that column's rounding; Little Italy ties exactly. And the plan's $4.4K per filled weekly session is gross — net of card fees and marketing it is $4.2K, which is what reaches owner comp.

Revenue-variable operations had been *declined* in an earlier version on cell-for-cell comparability grounds. That is reversed: reconciling the plan with itself is worth more than comparability with a matrix built on the error.

Re-verified against the independent re-derivation: 34 lever combinations (including the new margin lever), the §6 reproduction at both sites, and all the invariants. All pass.
