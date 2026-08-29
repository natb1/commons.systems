# What the cost base knows, and what it is guessing

Every cost this venture carries is declared once, in the registry at the top of
`model/model.mjs`. A declaration is not just an amount: it names the income
stream the cost serves, what the amount scales with, how well the number is
known, and — where it is an estimate rather than a quote — the range it is
estimated within.

There is a second registry beside it, in the same shape, for the money the
venture spends once rather than every year: the uses of cash it takes to open
the doors. The last three sections of this document read that one.

This document is the reading of those registries. Nothing in it is typed by hand;
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

## What it costs to open, against what the venture has

The registry above says what the venture spends every year. It says nothing
about what the venture spends once, before there is any revenue to spend it
from — and on the plan's own account that, not the operating line, is the
binding constraint.

The uses registry is the same declaration in the same shape: an id, what the
amount scales with, an evidence grade, an amount, and a band wherever the number
is an estimate. `model/verify.mjs` refuses an under-declared use with the gate
it already applies to costs. One line is derived rather than sourced — working
capital, which is an output of the ramp, and which the next section reconciles.

Three things fall out of writing it down, and none of them was visible while
capital was a row of sliders.

**The plan names lines it does not carry.** §6's cash paragraph says venture
cash covers fit-out, deposits, FF&E, working capital and the Year-1 ramp. The
model carried fit-out and working capital. Deposits and FF&E were named and
absent — and once the registry existed, so were the occupancy owed during
construction, the payroll spent hiring and training before the doors open, the
licensing and professional fees, the opening inventory, and the contingency a
first build-out always needs. The deposit is the omission that prompted this
work; each of the largest of the others is comparable to it in size.

**Fit-out now has a scope and a cap, and they are different numbers.** D7's
build-out figure was carried as the fit-out budget. It is a cap on scope, which
is what D7 says it is; the scope itself is floor area at a rate per square foot,
so it moves with the site. At the larger site the derived scope runs past the
cap, and the table below says by how much. Under a binding cash constraint that
is the half of the site trade-off the plan never printed — it published the
annual occupancy saving and left the one-time cash cost out.

**The plan contradicts itself, in the same model.** The grant-free cash-to-open
range the model has carried all along — the range the owner's bar has been
charging its return on — sits well above the cap D7 puts on venture cash.
Required capital lands inside that range and outside that cap. Nothing surfaced
the contradiction because the two capital systems never spoke: the bar read one
number, the cash tile read another, and neither was derived from what it
actually costs to open. The breach in the table below is reported, not
engineered away. No input was adjusted to make the plan look consistent.

<!-- model:begin uses-table -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

**Little Italy** — required capital $218.9K against the $150K cap (−$68.9K — over the cap).

| Use | Scales with | Amount | Evidence | Band | Where the number comes from |
|---|---|---|---|---|---|
| Fit-out (net of TI and grants) | floor area | $85.0K | D — assumed | $25–45/sf | D7’s $85K over LI’s 2,500 sf is $34/sf; the band is the as-is to vanilla-box range |
| FF&E | floor area | $14.0K | D — assumed | $8–20K | §6 names FF&E in the cash paragraph and carries no line for it |
| Security deposit | months of occupancy | $13.0K | C — benchmark | 2–3 mo | 2–3 months of occupancy is the market term; the plan names deposits and carries no line |
| Down payment | the purchase price | $0.0K | D — assumed | $60–150/sf | no price in the plan — the band is the SN/HT small-commercial range; closing and property tax read the same price |
| Closing costs | the purchase price | $0.0K | C — benchmark | 2.0–5.0% | title, transfer and recordation, appraisal, legal — 2–5% of price |
| Occupancy before opening | months of occupancy | $26.0K | C — benchmark | — | construction months less the abatement they consume, at the site’s own occupancy |
| Hiring & training | staffed hours | $14.0K | D — assumed | 4–10 wk | staffed weeks off the plan’s own grid before revenue starts |
| Licenses, architect, attorney | nothing — it is a flat annual cost | $14.0K | C — benchmark | $8–20K | liquor and food licensing, permit drawings, lease and entity counsel |
| Opening inventory | nothing — it is a flat annual cost | $5.5K | C — benchmark | $3–8K | first fill of café, catering and consignment stock |
| Contingency | hard cost (fit-out + FF&E) | $14.9K | D — assumed | 10.0–20.0% | a rate on hard cost (fit-out + FF&E) — the line a first build-out always needs |
| Working capital *(derived)* | the monthly cash ramp | $32.5K | D — assumed | $50–65K | the ramp’s peak cash deficit; the band is §6’s stated $50–65K, which it is reconciled against |
| **Required capital** | | **$218.9K** | | | |

**Station North / Highlandtown** — required capital $280.9K against the $150K cap (−$130.9K — over the cap).

| Use | Scales with | Amount | Evidence | Band | Where the number comes from |
|---|---|---|---|---|---|
| Fit-out (net of TI and grants) | floor area | $102.0K | D — assumed | $25–45/sf | D7’s $85K over LI’s 2,500 sf is $34/sf; the band is the as-is to vanilla-box range |
| FF&E | floor area | $16.8K | D — assumed | $8–20K | §6 names FF&E in the cash paragraph and carries no line for it |
| Security deposit | months of occupancy | $10.7K | C — benchmark | 2–3 mo | 2–3 months of occupancy is the market term; the plan names deposits and carries no line |
| Down payment | the purchase price | $0.0K | D — assumed | $60–150/sf | no price in the plan — the band is the SN/HT small-commercial range; closing and property tax read the same price |
| Closing costs | the purchase price | $0.0K | C — benchmark | 2.0–5.0% | title, transfer and recordation, appraisal, legal — 2–5% of price |
| Occupancy before opening | months of occupancy | $21.3K | C — benchmark | — | construction months less the abatement they consume, at the site’s own occupancy |
| Hiring & training | staffed hours | $14.0K | D — assumed | 4–10 wk | staffed weeks off the plan’s own grid before revenue starts |
| Licenses, architect, attorney | nothing — it is a flat annual cost | $14.0K | C — benchmark | $8–20K | liquor and food licensing, permit drawings, lease and entity counsel |
| Opening inventory | nothing — it is a flat annual cost | $5.5K | C — benchmark | $3–8K | first fill of café, catering and consignment stock |
| Contingency | hard cost (fit-out + FF&E) | $17.8K | D — assumed | 10.0–20.0% | a rate on hard cost (fit-out + FF&E) — the line a first build-out always needs |
| Working capital *(derived)* | the monthly cash ramp | $78.8K | D — assumed | $50–65K | the ramp’s peak cash deficit; the band is §6’s stated $50–65K, which it is reconciled against |
| **Required capital** | | **$280.9K** | | | |

*Amounts are at each site's plan marks on the lease path. 10 of these 11 uses carry a band and 6 are graded D. Working capital is the one derived line — the ramp's peak cash deficit, or the runway reserve where the ramp does not turn within its horizon (see the working-capital reconciliation) — everything else above it is an independently sourced estimate.*
<!-- model:end uses-table -->

## Working capital: built from a ramp, then checked against the plan

Working capital was the last stated-basis figure in the model — a band §6
asserts, carried because §6 asserts it. It is a cash-flow quantity: the deepest
the cumulative cash position gets on the way from opening to stabilization. To
derive it the model needs a time dimension, and now has the smallest one that
does the job — a monthly ramp that reprices the same `comp()` at each month's
marks and divides by twelve, starting at opening, with occupancy waived in the
abated months that survive construction. The trough of that curve *is* the
requirement.

The rule this section was written under: build the ramp from opening fractions
and a closing period chosen on their own merits, then look at where the answer
lands. Never tune the ramp to hit the band §6 states. What follows is where it
landed.

**At the base case there is no trough to measure.** Stabilized owner comp at the
plan's own marks is negative, so the cumulative curve never turns inside the
horizon — it is still falling when the horizon is cut. There is no finite
working-capital requirement, because the business as the base case describes it
does not stop needing capital. What the model reports instead is a *runway
choice*: the reserve that funds the operator's chosen verdict horizon at the
stabilized burn. That is the existing bail-line relation inverted, and it is an
answer to a different question than the one §6's band answers. The two month
counts — to cash-flow positive, and to recovery — carry a distinct
never-within-the-horizon state rather than a large number, because rounding that
distinction into a figure would bury the finding.

**The band reconciles at the gate case, not at the base case.** Swept to the
gate marks — the case the G1 bars are written against — the built figure lands
inside §6's stated band at Station North / Highlandtown and near it at Little
Italy, and Little Italy falls inside the band too once abatement runs past the
construction months into the operating ones. So §6's working-capital figure is a
gate-case number printed in a section whose pro forma is the base case. That is
a finding of the same family as the operations-line finding above: a published
total that turns out to have been measured somewhere other than where it is
quoted. It is not a failure to suppress, and `model/verify.mjs` asserts only the
structural invariants — that the peak deficit is the minimum of the cumulative
series, and that the ramp's stabilized month annualizes back to `comp()` — and
no reconciliation tolerance the base case cannot pass.

<!-- model:begin wc-reconciliation -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Site — scenario | Built (ramp peak deficit, or the runway reserve where the ramp never turns) | §6 stated (the $50–65K band's midpoint) | Delta |
|---|---|---|---|
| Little Italy — Base (the marks above) | $32.5K | $58K | −$25.5K (−43.9%) |
| Little Italy — Gate-clearing (110 walk-ins/day, 55% evening utilization) | $71.0K | $58K | +$13.0K (22.4%) |
| Station North / Highlandtown — Base (the marks above) | $78.8K | $58K | +$20.8K (35.9%) |
| Station North / Highlandtown — Gate-clearing (110 walk-ins/day, 55% evening utilization) | $55.3K | $58K | −$2.7K (−4.7%) |

The base case — the marks §6's pro forma prints — does not reconcile at either site. Little Italy's own ramp (opening at 35% utilization / 50% of the café mark, closing to plan over 18 months) never turns cash-flow positive within the 60-month horizon at all — cumulative cash is still −$168.8K and falling at month 60, so working capital falls back to funding 24 months of the stabilized burn instead ($32.5K), and "months to positive" / "months to recover" are both **never, within the horizon**, not a number. The gate case is where the stated band was actually measured: it reconciles within −4.7% at Station North / Highlandtown.

`model/verify.mjs` asserts the structural invariants that hold regardless of scenario — the peak deficit equals the minimum of the cumulative series, month 24 of the ramp annualizes to `comp()` at the same settings — and does not assert a reconciliation tolerance the base case cannot pass.
<!-- model:end wc-reconciliation -->

### The buy path's occupancy, and the price that would reproduce it

The plan gives the buy path no purchase price. It gives one relation: buy
occupancy runs a little dearer than the lease. The model now prices the path —
a loan at a declared price per square foot, the payment its amortization
implies, Baltimore City's real property tax, the insurance the owner carries
directly, and the structural reserve the landlord carries on the lease path —
and the total comes out *cheaper* than §6 states, not dearer. Solved backwards,
the price that would reproduce §6's figure sits well outside the defensible
range for small commercial in these submarkets.

That reconciliation fails, and it is reported rather than forced. Occupancy
stays on §6's stated basis on both paths, so owner comp is unmoved and every
published figure that rides on it stands; the derived figure is carried beside
it as evidence about the price, which is the number nobody has. The honest
reading is that §6's buy occupancy is not reproducible from any price the
submarket supports — either the relation is wrong, or it assumes terms (a
below-market price, a subsidized rate, the SBLP structure D8 names) that the
plan has not written down. Both readings point at the same next step, and it is
the cheapest one in this document: get a price on a real building.

## What to negotiate first

The ranking above says what to go verify, against owner comp. This one says what
to go negotiate, against required capital — the output under the binding
constraint, which until now had no sensitivity ranking in any form. It sweeps
each banded use end to end and asks what that does to the total the cap is
tested against.

Read it before a term sheet, not after. The top of it is where a lease
negotiation has the most room, and the bottom of it — the purchase terms, which
swing nothing at all on the lease path — is the reminder that the levers
available depend on which path the venture is on.

<!-- model:begin capital-tornado -->
*Generated from `model/model.mjs` — edit the model, then `node model/render.mjs`.*

| Deal term / use | Evidence | Band | Required capital at the low end | at the high end | Swing |
|---|---|---|---|---|---|
| Fit-out (net of TI and grants) | D — assumed | $25–45/sf | $193.0K | $250.5K | **$57.5K** |
| Hiring & training | D — assumed | 4–10 wk | $214.2K | $228.2K | **$14.0K** |
| FF&E | D — assumed | $8–20K | $212.0K | $225.8K | **$13.8K** |
| Licenses, architect, attorney | C — benchmark | $8–20K | $212.9K | $224.9K | **$12.0K** |
| Contingency | D — assumed | 10.0–20.0% | $213.9K | $223.8K | **$9.9K** |
| Security deposit | C — benchmark | 2–3 mo | $218.9K | $225.4K | **$6.5K** |
| Opening inventory | C — benchmark | $3–8K | $216.4K | $221.4K | **$5.0K** |
| Down payment | D — assumed | $60–150/sf | $218.9K | $218.9K | **$0.0K** |
| Closing costs | C — benchmark | 2.0–5.0% | $218.9K | $218.9K | **$0.0K** |

*Required capital at Little Italy's plan marks on the lease path — $218.9K at the declared values (the uses table above) — with one banded use swept end to end and every other held at its declared value. The purchase-price terms (down payment, closing) swing nothing here because they apply only on the buy path; that absence is itself the finding — a lease negotiation cannot move them. The largest lever is Fit-out (net of TI and grants), worth $57.5K across its $25–45/sf band — that is what to negotiate first.*
<!-- model:end capital-tornado -->
