# What the cost base knows, and what it is guessing

Every cost this venture carries is declared once, in the registry at the top of
`model/model.mjs`. A declaration is not just an amount: it names the income
stream the cost serves, what the amount scales with, how well the number is
known, and — where it is an estimate rather than a quote — the range it is
estimated within.

This document is the reading of that registry. Nothing in it is typed by hand;
the tables are written by `node model/render.mjs` from the same model the
business plan and the [benchmark explorer](../claude/benchmark-explorer.md) run
on. The prose around them is authored.

**The grades.** Four, and the distinction that matters is between the first two
and the last one.

- **A — contracted.** A signed or quoted number. The commons budget is A because
  it is a decision the plan makes, not an estimate of the world.
- **B — observed.** Taken from something the project has watched or been told
  directly — the plan's own margins, the review's blended card rate.
- **C — benchmark.** A published figure for comparable operations, correct for
  the class of business but not for this one.
- **D — assumed.** A guess inside a plausible range. Nobody has checked it.

**The bands.** A band is the range the number is believed to sit in, in whatever
unit the cost is declared in — dollars a year, a share of revenue, dollars per
square foot. It is not a confidence interval; it is the width of the argument
that could be had about the number today. Every grade-D cost carries one, because
an assumption with no stated range cannot be argued with or checked.

**One entry is a residual.** NNN — the CAM, taxes and building insurance a lease
adds on top of base rent — is not sourced independently. It is what §6's
occupancy total leaves after base rent, which is why it is marked as a residual.
A residual with a band is still worth having: it can be checked against the
market range, and at Little Italy it lands near the top of that range while
SN/HT lands near the floor. That inconsistency is a lease-negotiation question,
not a rounding difference.

## Every cost, and what is known about it

<!-- model:begin evidence-table -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Cost | Stream | Scales with | Amount | Evidence | Band | Where the number comes from |
|---|---|---|---|---|---|---|
| Cost of sale — café | Café | that stream's revenue | $95.0K | B — observed | — | §6 COGS line, carried as the café-margin lever |
| Cost of sale — catering | Café | that stream's revenue | $2.4K | C — benchmark | — | §5 catering margin |
| Cost of sale — rooms | Rooms | that stream's revenue | $3.0K | C — benchmark | — | §5 room margin — near-zero cost of sale |
| Consignment share | Books | that stream's revenue | $3.6K | B — observed | — | §5: consignment takes 60% |
| Commons budget | Books | nothing — it is a flat annual cost | $6.0K | A — contracted | — | the budgeted philanthropy — a decision, not an estimate |
| Card fees | Every stream | that stream's revenue | $10.8K | B — observed | 2.7–3.3% | adversarial review F1 blended ~2.7%; §6 prose ~3% |
| Marketing | Cross-cutting | gross revenue | $9.0K | D — assumed | 2.0–3.0% | review F15: 2–3% of revenue ($8–13K) |
| Utilities | Cross-cutting | staffed hours | $15.0K | C — benchmark | $12–18K | review F1 |
| Insurance | Cross-cutting | payroll | $15.0K | D — assumed | $10–20K | review F1; open-questions #20 |
| Software & subscriptions | Cross-cutting | nothing — it is a flat annual cost | $4.5K | C — benchmark | $3–6K | review F1 |
| Repairs & misc | Cross-cutting | nothing — it is a flat annual cost | $12.5K | C — benchmark | $10–15K | review F1 — repairs, trash, pest, internet, accounting, licenses |
| Base rent | Cross-cutting | floor area | $55.0K | C — benchmark | — | §6 site line: sf × $/sf |
| NNN — CAM, taxes, insurance *(residual)* | Cross-cutting | floor area | $23.0K | D — assumed | $5–12/sf | the remainder of §6 occupancy after base rent; band is the market range |
| Purchase premium | Cross-cutting | floor area | $0.0K | C — benchmark | — | §6: the buy path runs ≈$2K dearer than the lease |
| Labor | Cross-cutting | staffed hours | $121.1K | B — observed | — | §6 $120K line, repriced as the rung’s rate over the plan’s own staffed grid |

*Amounts are at Little Italy's plan marks on the lease path, which is why the purchase premium reads $0.0K — it applies only to the SN/HT buy case. 7 of these 15 costs carry a band and 3 are graded D; two further banded inputs are not costs at all — the absorption geometry — and are ranked separately in the sweep. A cost marked as a residual is what is left after the others rather than an independently sourced figure, which is exactly why its band matters.*
<!-- model:end evidence-table -->

## Operations: built, then checked against the plan

The operations line used to be a residual too, and a worse one. §6 published one
operations figure per site; the model read both, solved two equations for a fixed
base and a revenue-proportional rate, and printed the components — utilities,
insurance, software, repairs — as a comment. They were words, not quantities. The
check that guarded it could not fail: the fixed base was *defined* so that it
landed identically at both sites.

The line is now built from the four components, each declared and graded, and the
total is compared with what §6 says rather than derived from it.

<!-- model:begin ops-reconciliation -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Site | Built from components | §6 states | Delta |
|---|---|---|---|
| Little Italy | $66.8K | $65K | +$1.8K (+2.7%) |
| Station North / Highlandtown | $63.5K | $62K | +$1.5K (+2.4%) |

The built figure is a $47.0K fixed base — utilities $15.0K, insurance $15.0K, software & subscriptions $4.5K, repairs & misc $12.5K — plus 5.5% of gross revenue for card fees (3.0%) and marketing (2.5%), which comes to $19.8K at Little Italy and $16.5K at Station North / Highlandtown.

§6's figure is a single number per site with nothing behind it. Neither total is derived from the other, so the agreement above is a result and not an identity — the old split was solved *out of* §6's two totals, which meant it reproduced them no matter what the components were. `model/verify.mjs` now asserts the two agree within 6%, and a component drifting far enough breaks it.
<!-- model:end ops-reconciliation -->

## What to go verify first

The ranking below is the useful output of the grades and the bands together. It
sweeps each estimate from one end of its range to the other and asks what that
does to owner comp. A wide band on a small cost does not matter; a modest band on
a large one does. The order is what to go get evidence for, in order.

Read it as a work list, not as a risk assessment. Every line on it is a phone
call, a quote, or an hour with a broker away from being a graded-A number.

<!-- model:begin tornado -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Input | Evidence | Band | Owner comp at the low end | at the high end | Swing |
|---|---|---|---|---|---|
| NNN — CAM, taxes, insurance | D — assumed | $5–12/sf | −$4.7K | −$22.2K | **$17.5K** |
| Insurance | D — assumed | $10–20K | −$10.2K | −$20.2K | **$10.0K** |
| Utilities | C — benchmark | $12–18K | −$12.2K | −$18.2K | **$6.0K** |
| Repairs & misc | C — benchmark | $10–15K | −$12.7K | −$17.7K | **$5.0K** |
| Marketing | D — assumed | 2.0–3.0% | −$13.4K | −$17.0K | **$3.6K** |
| Software & subscriptions | C — benchmark | $3–6K | −$13.7K | −$16.7K | **$3.0K** |
| Card fees | B — observed | 2.7–3.3% | −$14.1K | −$16.3K | **$2.2K** |

*Owner comp at Little Italy's plan marks with labor held at §6's $120K line — the −$15K the pro forma prints — with one input swept end to end and every other held at its declared value. Operating levers are absent on purpose: café margin, wage rung, utilization and walk-ins all move owner comp further than anything here, and the explorer already exposes every one of them. This ranks what is **not** under the operator's control.*

**The two absorption constants are ranked separately, because they move nothing here.**

| Input | Evidence | Band | Basis it drives | Café's share of the cross-cutting row | Rooms' share | Owner comp |
|---|---|---|---|---|---|---|
| Bookable room area | D — assumed | 250–400 sf | floor area | $178.6K → $132.6K | $76.5K → $122.4K | unmoved |
| Staffed hours per session | D — assumed | 2–5 hr | staffed hours | $213.1K → $150.2K | $41.9K → $104.9K | unmoved |

*These two say how the $255K cross-cutting row is **divided** between streams, not how large it is, so sweeping either one moves owner comp by exactly $0.0K. Listed with the costs above they would print as the two best-known numbers in the model, which is the reverse of the truth — both are grade D, and between them they move the café's attributed cost further than any single cost line above moves owner comp. What they put at risk is the answer to "what does the café earn?", not the answer to "what does the owner earn?".*
<!-- model:end tornado -->
