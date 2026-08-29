# Benchmark explorer (interactive)
**The artifact is the live tool. `benchmark-explorer-src.html` is its committed source; the model it runs lives in `../model/model.mjs`. This changelog is a pointer and is not maintained.**

https://claude.ai/code/artifact/c90fad60-5217-4399-9bb1-17bb1c2a54ad

`benchmark-explorer-src.html` alongside this file is the authored source and the baseline for every change; the live artifact is its deployment. See `.claude/rules/published-artifacts.md` for the loop this follows. The file holds the authored page only — the publish-time `<!doctype html>`/`<head>`/`<body>` wrapper is added by the artifact service and is deliberately not committed.

**The page's model is generated.** `../model/model.mjs` is spliced into this file's `<script>`, and the notes card's tables and figures are written from the same model, by `node model/render.mjs` — which also writes the numbers in `../business-plan.md`, `benchmark-matrix.md` and the pilot and validation docs. Edit the model there and re-render; never edit a figure or the spliced region in this file. `../model/README.md` is the working loop, `node model/verify.mjs` the invariants.

Companion to `benchmark-matrix.md`; calibrated to business-plan.md §5–6. The artifact's notes card documents the model, its calibration, and the correction to the matrix doc's "SN/HT: subtract ~$22K per cell" shortcut.

Aug 29, 2026 (later) — the operations line is built from its components, and the check that used to guard it is deleted. §6 publishes one operations figure per site; the model read both and solved them for a fixed base and a revenue-proportional rate, and the four components that line claimed to contain — utilities, insurance, software, repairs — were words in a comment. The check that vouched for the split ("the fixed base lands identically at both sites", the bullet further down) could not fail: the variable rate was *defined* as the difference in operations over the difference in revenue, which forces the two fixed bases equal for any pair of totals whatsoever. What replaced it can fail, and this is what it says.

- **Every cost is declared once** — the stream it serves, what its amount scales with, an evidence grade (A contracted · B observed · C benchmark · D assumed) and, where it is an estimate rather than a quote, the band it sits in. `../model/evidence.md` is the reading of that registry.
- **Operations is the sum of its components** — a $47.0K fixed base plus 5.5% of gross revenue — and is compared with §6 instead of derived from it: $66.8K against §6's $65K in Little Italy (+2.7%), $63.5K against $62K in SN/HT (+2.4%). `node model/verify.mjs` asserts the two agree within 6%, and a component drifting far enough breaks it.
- **Occupancy gets the same split** — base rent (sf × $/sf) plus a labeled NNN component. Little Italy's implies $9.20/sf and SN/HT's $5.33/sf against a $5–12/sf market band. Still a residual, but a named one with a falsifiable bound, and the spread between the two sites is a lease-negotiation question rather than a rounding difference (open-questions #17).
- **The model publishes what to go verify.** Sweeping each banded input from one end of its range to the other ranks them by what they do to owner comp: the NNN residual $17.5K, insurance $10.0K — both grade D, both larger than any operating lever this page exposes. That ranking is open-questions #20a, and it is adversarial review Finding 1 finally tracked.
- **The notes card carries the P&L grouped by stream** alongside the existing cost-nature table. Shared costs are not absorbed by default: contribution is the honest reading, and the three defensible absorption bases give three different answers to the same question.

Figures that moved, every one a consequence of the model: operations $65K/$62K → $67K/$64K, the fixed base $46.8K → $47.0K, the revenue-proportional rate 5.1% → 5.5%, Little Italy owner comp −$13K → −$15K, SN/HT −$37K → −$38K, the walk-in marginal $1.87K → $1.86K, the session marginal $4.2K → $4.1K.

Aug 29, 2026 — model moved to `../model/model.mjs`, no behavior change to the page. Verified by evaluating the model region over a 1,200-scenario lever grid before and after the move and comparing the results byte for byte. The documents that used to restate the model by hand now read it: §6's pro forma, the sensitivity rows, both site matrices, the club rosters and the wage rungs are generated, and the figures inside authored prose are generated spans. Three published figures moved as a consequence — §6's SN/HT owner comp (−$35K → −$37K, a slip in the printed column), SN/HT revenue ($301K → $300K) and cost of sale ($104K → $101K) — and the matrix doc's per-cell "subtract ~$22K" shortcut is replaced by a second matrix on SN/HT's own cost basis.

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
- **The operations split is derived, not assumed.** §6 gives one operations figure per site ($65K LI / $62K SN). They differ in revenue and nothing else, so the pair solves for a revenue-proportional part (5.1% — card fees ~3% + marketing ~2.5%, the bottom-up lines §6 names) and a fixed base ($46.8K). The check: the fixed base is solved from Little Italy and lands on SN/HT **to the decimal**. *(Retracted Aug 29 — that check could not fail. The revenue-proportional rate was defined as the difference in operations over the difference in revenue, which forces the two fixed bases equal for any pair of published totals, so landing to the decimal said nothing about whether the split was real. The line is now built from declared components and checked against §6 instead; see the entry at the top of this changelog. The figures in this entry are what the Aug 28 revision computed and are left as its record.)*
- Gross revenue across the five streams comes to $360K, §5's total. With labor held at §6's $120K the model returns −$12.9K in Little Italy against a published −$13K — it reproduces the base case without being told the answer.

Two residues worth knowing: SN/HT comes out −$36.9K against §6's printed −$35K, but §6's own SN/HT column arithmetic (301 − 85 − 120 − 62 − 6 − 64) is −$36K, so the printed figure is a slip and the remaining ~$1K is that column's rounding; Little Italy ties exactly. And the plan's $4.4K per filled weekly session is gross — net of card fees and marketing it is $4.2K, which is what reaches owner comp.

Revenue-variable operations had been *declined* in an earlier version on cell-for-cell comparability grounds. That is reversed: reconciling the plan with itself is worth more than comparability with a matrix built on the error.

Re-verified against the independent re-derivation: 34 lever combinations (including the new margin lever), the §6 reproduction at both sites, and all the invariants. All pass.
## Preview artifact (development)

https://claude.ai/code/artifact/ee469004-6be9-4f6f-b87a-7fffda1a9822 — a second,
private artifact that renders the same page. Publish in-progress work here to
look at it in a browser without touching the live artifact above, so several
changes can be staged and reviewed together before one publish goes out.

It is byte-identical to `benchmark-explorer-src.html` except for the `<title>`
(`Benchmark Explorer Preview`, so the two are distinguishable in the artifact
gallery and browser tabs) and its 🚧 favicon.

Working on a change (from a cloud session or locally):

1. Edit `benchmark-explorer-src.html` on a branch, starting from the committed
   file — not from the live page.
2. Build the preview copy and publish it, passing the preview URL so it updates
   in place rather than minting a new artifact:

   ```
   sed 's|<title>Albemarle Benchmark Explorer</title>|<title>Benchmark Explorer Preview</title>|' \
     projects/club/claude/benchmark-explorer-src.html > /tmp/benchmark-explorer-preview.html
   # then: Artifact publish that file with
   #   url: https://claude.ai/code/artifact/ee469004-6be9-4f6f-b87a-7fffda1a9822
   ```

3. Open the PR with the preview URL in the body, so the change can be looked at
   before it ships.
4. After the PR merges, deploy from main: `Artifact read` the live URL as a
   drift check, then publish the unmodified `benchmark-explorer-src.html`
   passing `url: …c90fad60…`, and confirm the returned URL is unchanged. The
   deployed page is expected to match main at all times.

Two changes in flight at the same time share one preview artifact, so whoever
publishes last is what the preview shows. For genuinely parallel work, give each
branch its own preview: publish a copy under a distinct file path and title
(e.g. `<title>Owner-Comp Preview</title>`) with no `url`,
which mints a fresh artifact, and record that URL on the branch's PR. Delete
nothing; unused previews are private and harmless.
