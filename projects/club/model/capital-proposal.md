# Making capital an output — a proposal for the model and the explorer

*Authored, not generated. Nothing here is spliced by `render.mjs`; the figures
below are quoted from a run of the model on `main` as of Aug 29 2026 and will go
stale the way any authored figure does.*

The model answers one question well: **at a stabilized Year 2, what does the
owner earn?** It answers a second question badly, and a third not at all:

- **Owner draw** responds to the levers that set it — but not to the deal,
  because the deal has no path into it.
- **Required capital** is never computed. Every capital quantity in the model is
  something the operator types in; nothing is derived. The one number that looks
  like an answer — the G2 "cash at risk" tile — is the sum of two sliders.

This proposal makes required capital a derived output of site geometry, deal
terms and a ramp, and closes the loop so that the capital it derives is the
capital the owner's bar charges a return on. Per `.claude/rules/design-proposals.md`
it leads with the design worth building from scratch and follows with a
migration path, because this is several PRs and one of them moves published
figures.

---

## 1. The headline finding, first

The §6 cash paragraph says venture cash covers "**fit-out, deposits, FF&E,
working capital, and Year-1 ramp**" (business-plan.md:212). The model carries
fit-out and working capital. It carries **no deposit line and no FF&E line at
all**.

At the defaults the G2 tile reads:

```
cash at risk = build 85 + working capital 58 = $143K   against a $150K cap
                                                        headroom: $7K
```

A security deposit at Little Italy's own occupancy figure is 2–3 months ×
$6.5K/mo = **$13–19.5K**. Adding the single line the plan itself names, and
nothing else, takes the lease path to **$156–162K** — through the D7 cap.

That is not a rounding problem. Risk 4 says "if lease-path all-in costs can't fit
~$150K after TI negotiation, that is a G2 stop, not a stretch." The model as it
stands cannot see the stop, because the line that causes it is not in the model.
Everything below is downstream of this: **capital is under-modeled in a plan
whose binding constraint is capital.**

---

## 2. Diagnosis

### 2.1 There are two capital systems and they never speak

`S.equity` reaches exactly two functions:

```js
// model.mjs:305–306
function bandLoK(){ return livingK() + RET_LO*S.equity; }
function bandHiK(){ return livingK() + RET_HI*S.equity; }
```

`S.build`, `S.ti`, `S.grants`, `S.abate`, `S.cash`, `S.runway` reach exactly two
others — `cashK()` and `reserveK()` (model.mjs:337–350). The sets are disjoint.

The consequence: **the owner's bar does not move when the deal moves.** Negotiate
$60K of TI, land $40K of grants, and the capital at risk the return is charged on
stays at $240K, because it is a separate slider. Worse, the two can be set into
direct contradiction — capital at risk $360K alongside cash at risk $85K — and
nothing flags it, because neither knows the other exists.

`verify.mjs:171` enshrines half of this as an invariant:

```js
for (const lever of ["churn","build","ti","abate","grants","cash","runway","equity"])
  check(`${lever} does not move owner comp`, ...)
```

That is right for `comp()` — stabilized Year-2 comp on an all-cash lease path
genuinely should not move with how the fit-out was funded. But the invariant's
silence about the *bar* is the bug. `build`, `ti` and `grants` **must** move
`bandLoK()`, and today they provably don't. There is a failing test waiting to be
written.

### 2.2 Capital is all input and no output

Nine capital quantities, nine sliders: build, TI, abatement, grants, venture
cash, runway, equity, plus the constants `WC_BAND` and `WC_FLOOR`. Not one is
computed from anything else. Compare the cost side, which has a registry, evidence
grades, bands, a residual honestly labeled as one, a built-vs-stated
reconciliation, and a tornado. The capital side has none of that discipline —
which is striking, because on the plan's own account capital is the binding
constraint and operations are not.

Graded on the registry's own A/B/C/D scale, **every capital number in the plan
today is a D**, and several are not estimates at all: $85K is a budget cap, $150K
is a precommitment, $50–65K is an assertion. Putting them in a registry would
make that visible. Right now their absence from the registry reads as confidence.

### 2.3 Fit-out does not move with the site

`SITES` carries `sf` for both candidates — 2,500 (LI) and 3,000 (SN/HT) — and
uses it for base rent and for the sqft absorption basis. `build:85` is flat.

The implied fit-out rate at LI is **$34/sf**. Carried to SN/HT's 3,000 sf that is
**$102K — $17K more cash** for the cheaper site. The site's annual occupancy
saving is $14K/yr, so the trade is real and defensible on a payback basis, but
the model cannot state it: it shows the $14K/yr and hides the $17K. Against a
$7K-headroom cap, the hidden number is the one that decides.

### 2.4 TI is in the wrong units, and the slider can't reach the plan's own ask

Open question #17 states the ask **per square foot**: "TI allowance target
($15–25/sf on 5–7yr)." The model carries a flat `$K` slider capped at $60K
(`benchmark-explorer-src.html:328`). In the plan's own units that ask is:

| | $15/sf | $25/sf |
|---|---|---|
| LI (2,500 sf) | $37.5K | $62.5K |
| SN/HT (3,000 sf) | $45K | **$75K** |

The top of the plan's own range at the larger site is **outside the slider's
range**. Modeling TI as `tiPsf × sf` fixes the units, the cap and the site-linkage
in one change.

### 2.5 Working capital is asserted, not derived — because there is no time

`WC_BAND = [50, 65]` with the comment "as the plan states it." Required working
capital is a cash-flow quantity: the **peak cumulative deficit** on the path from
opening to stabilization, plus an operating buffer. It is a function of how fast
the two engines ramp, how many months of abatement offset the early occupancy,
and how much of the cost base is fixed from month 1 (nearly all of it — labor,
occupancy, utilities, insurance, software, R&M).

The model has no time dimension. `grep -n 'month\|ramp' model.mjs` returns the
cadence labels and `occ/12`. `runway` and `bailComp()` are a proxy for the ramp
model that isn't there: a reserve divided by a horizon the operator picks.

This is the same defect the project already fixed once, on the operations line.
§6's two published totals were treated as authoritative until `OPS_BASIS` split
"built from components" from "stated by §6," and the built line was reconciled
against the stated one rather than derived from it. **Working capital is the last
stated-basis figure in the model.** The fix has a precedent in this directory.

### 2.6 The buy path goes blank

`cashK()`, `reserveK()` and `bailComp()` all `return null` when `S.fin === 'buy'`,
and the explorer prints two tiles reading "SBLP" and "not modeled." Meanwhile the
entire buy path's economics are two constants: `+$2` on occupancy and
`BUY_EQUITY = 10` of principal paydown. There is no price, no LTV, no rate, no
term — so the $10K cannot be checked, the interest/principal split cannot move
over time, and the capital requirement (10% + closing + FF&E) exists only in
prose. D8 calls buy the acceleration case; the model can't price the acceleration.

### 2.7 The sensitivity sweep sees none of this

`INPUTS` is the banded cost registry plus two absorption-geometry constants. The
tornado ranks them against owner comp. Not in it: **any capital input at all**,
and any demand lever. So the ranking that says "go verify this first" cannot say
"go negotiate this first," and there is no ranking whatsoever against required
capital — which is the output under the binding constraint.

### 2.8 "Owner comp" is not "owner draw"

`comp()` is a residual operating margin. A draw is cash the owner can actually
take, which is comp less a tax distribution, less a reserve for replacing fit-out
and FF&E on a 7–10 year life, less principal on the buy path. **There is no
replacement-capex reserve anywhere in the cost registry** — a stabilized year
that never reserves against the capital it consumes overstates the draw, and the
size of that reserve is derived from the capital model this proposal builds.

---

## 3. The greenfield design

Five pieces. Each one reuses a pattern already in this directory rather than
inventing a new one.

### 3.1 A uses-of-cash registry — the same shape as `COSTS`

```js
export var USES = [
  {id:'fitout',      label:'Fit-out (net of TI)',   driver:'sqft',    ev:'D',
   band:[25,45], unit:'psf', amount:function(){ return Math.max(0, fitoutPsf()*sf() - tiK()); }},
  {id:'ffe',         label:'FF&E',                  driver:'sqft',    ev:'D', band:[8,20],  unit:'K'},
  {id:'deposit',     label:'Security deposit',      driver:'months',  ev:'C', band:[2,3],   unit:'mo'},
  {id:'preopen-occ', label:'Occupancy before open', driver:'months',  ev:'C', band:null,
   amount:function(){ return Math.max(0, DEAL.constructionMo - S.abate) * occupancyK()/12; }},
  {id:'preopen-pay', label:'Hiring & training',     driver:'hours',   ev:'D', band:[4,10],  unit:'wk'},
  {id:'licenses',    label:'Licenses, architect, attorney', driver:'fixed', ev:'C', band:[8,20], unit:'K'},
  {id:'inventory',   label:'Opening inventory',     driver:'fixed',   ev:'C', band:[3,8],   unit:'K'},
  {id:'contingency', label:'Contingency',           driver:'hardCost',ev:'D', band:[0.10,0.20], unit:'rate'},
  {id:'working-cap', label:'Working capital',       driver:'ramp',    ev:'D', derived:true, band:null}
];
export function requiredCapitalK(){ /* sum of USES */ }
```

Same four obligations the cost registry already enforces — a driver, a grade, an
amount, and a band where the number is an estimate — so `verify.mjs` can refuse
an under-declared use exactly as it refuses an under-declared cost, and
`evidence.md` can read it into a table without new machinery.

`requiredCapitalK()` against `S.cash` is the G2 test, computed rather than
asserted. `grants` and `ti` become *sources* offsetting uses, not sliders
subtracted inside one function.

### 3.2 Deal terms as a first-class object, beside `SITES`

```js
export var DEAL = {
  tiPsf: 0,            // #17 ask: $15–25/sf — the plan's own units
  abateMo: 0,          // free rent during build-out
  depositMo: 2,        // months of occupancy held
  constructionMo: 4,   // signature to opening
  deliveryCondition: 'as-is',   // 'as-is' | 'vanilla-box' — sets the fit-out rate band
  escalationPct: 3, termYrs: 5
};
```

Site geometry (`sf`, `psf`) and deal terms are then the two inputs required
capital is a function of — which is the shape the question was asked in. `ti`
stops being a $K slider; `S.build` stops being the fit-out budget and becomes a
*scope cap* the derived fit-out is checked against, which is what D7 actually
says it is.

### 3.3 A monthly ramp — the minimum time dimension

Roughly 30 rows, reusing `comp()` unchanged:

```js
export function rampSeries(){
  // util(m), tx(m): piecewise-linear or S-curve from an opening fraction to the
  // stabilized S.util / S.tx over DEAL.rampMo months.
  // monthly margin = comp(util(m), tx(m))/12, with occupancy waived in abated months.
  // returns [{m, util, tx, margin, cumulative}, ...]
}
export function peakDeficitK(){ /* -min(cumulative) */ }
export function monthsToPositive(){ /* first m with margin >= 0 */ }
export function monthsToRecover(){ /* first m with cumulative >= 0 */ }
export var WC_BASIS = 'built';   // 'built' = peak deficit + buffer | 'stated' = §6's $50–65K
```

Working capital stops being an input. Three outputs the model cannot produce
today fall out for free — peak deficit, months to cash-flow positive, months to
recover — and each is a better decision metric than the `runway` slider, which
can then become a derived readout rather than a dial.

`WC_BASIS` mirrors `OPS_BASIS` exactly, including the reason for keeping the
stated basis: reproducing §6 is still worth asserting, and the built figure is
the one that can be wrong.

### 3.4 Close the loop: equity becomes derived

```js
export function capitalAtRiskK(){ return requiredCapitalK() - recoverableK(); }
```

where `recoverableK()` is the deposit plus FF&E at a resale haircut — the part of
committed capital that survives a wind-down. `bandLoK()` / `bandHiK()` charge
their return on that, not on a slider. Keep a manual override for what-if
(`withState({equity: 300}, ...)`) but default to derived.

**This is the change the user's question is really about.** Once it lands, every
lever that moves the deal moves the bar: a harder TI negotiation lowers the bar
the owner has to clear, a bigger site raises it, grants lower it. The two halves
of the tool start arguing with each other, which is the point of a model.

### 3.5 The buy path, priced

```js
export var LOAN = {pricePsf: null, ltv: 0.90, ratePct: 6.5, termYrs: 20};
```

Payment from amortization; the principal share replaces `BUY_EQUITY = 10`;
occupancy on the buy path becomes debt service + taxes + insurance + a structural
reserve rather than "lease + $2K"; required capital becomes down payment +
closing + FF&E + the same derived working capital. The two "not modeled" tiles go
away and the cash gate applies to both paths.

### 3.6 Draw, distinguished from comp

```js
export function replacementReserveK(){ return depreciableBaseK() / USEFUL_LIFE_YRS; }
export function drawK(){ return comp() - replacementReserveK() - taxDistK() - principalK(); }
```

Show both: comp as the operating residual, draw as the cash the owner takes. The
replacement reserve is a new cost-registry entry — a real, currently-missing cost
whose magnitude is derived from §3.1, which is a clean payoff for building it.

### 3.7 Sensitivity, extended to two outputs

Three tornados instead of one:

1. **owner draw** — the existing cost bands, **plus** the demand levers at their
   evidence bands (util and tx are the largest swings in the model and are absent
   from the sweep today);
2. **required capital** — fit-out $/sf, TI $/sf, contingency %, construction
   months, deposit months, ramp length. This is the ranking that says what to
   negotiate first, and it does not exist in any form today;
3. **peak deficit / months to recover** — the ranking that says what most
   threatens survival before the verdict.

---

## 4. The explorer

The model changes are worth little if the page still presents capital as seven
dials and one sum. Six changes, in value order:

1. **A sources-and-uses waterfall.** Uses stacked — fit-out net of TI, FF&E,
   deposit, pre-opening occupancy, hiring, licenses, inventory, contingency,
   working capital — against the **$150K cap drawn as a hard line**, red past it.
   This is the single highest-value addition: it is the picture of required
   capital, and it does not exist in any form today.
2. **A cash curve.** Cumulative cash by month from signature through
   stabilization, with the trough annotated (*that trough is the working-capital
   requirement*), the cap as a horizontal rule, and break-even marked. Move any
   lever, watch the trough move. This is the picture of *how parameters affect*
   required capital, which is precisely what was asked for.
3. **Split the Capital panel in two.** Today it is "Capital & concessions (G2)"
   — inputs only. Make it **Deal terms** (TI $/sf, abatement months, deposit
   months, construction months, delivery condition — what you negotiate) and
   **Capital outcome** (required capital, headroom against the cap, peak deficit,
   months to positive, months to recover — what you get).
4. **Capital at risk becomes a readout with an override toggle**, annotated with
   one line: *this is the sources-and-uses total; the bar moves when the deal
   moves.*
5. **Two tornados side by side** — draw and capital — so "what do I verify
   first" and "what do I negotiate first" are both answered.
6. **The site buttons show their capital consequence.** Today SN/HT advertises
   "cheaper floor, weaker café column" — the annual trade. It should also say
   *+500 sf ≈ +$17K of fit-out cash*, because under a binding cash cap that is
   the half that decides.

One correctness note on the UI: **`venture cash` is a slider from $80K to $220K.**
D7 is a precommitment, not a preference. It should render as a fixed cap line
with an explicit override gesture and a warning, not as a smooth dial that
quietly relaxes the plan's own constraint.

---

## 5. Invariants to add

In the style `verify.mjs` already uses:

- required capital equals the sum of the uses registry *(parallel to "breakdown
  sums to owner comp")*;
- every use declares a driver, a grade and an amount, and a grade-D or derived
  use carries a band *(parallel to the cost-registry gate)*;
- the built working capital reconciles with §6's $50–65K within tolerance
  *(parallel to "built operations reconciles with §6")* — and if it does not,
  that is a finding, not a failure to suppress;
- the peak deficit equals the minimum of the cumulative series *(self-consistency)*;
- **month-24 of the ramp annualizes to `comp()` at the same settings** — the
  invariant that keeps the two views from drifting, and the one that makes adding
  time safe;
- capital levers still do not move `comp()`, **and `build`, `ti`, `grants` and
  `abate` do move `bandLoK()`** — the positive half that fails today;
- buy path: down payment + closing + FF&E + working capital equals required
  capital, and Year-2 principal equals the amortization rather than a constant.

---

## 6. Migration path

Five PRs. The first two are safe, the third is the payoff, the fourth moves
published figures.

| PR | Change | Renders differently? |
|---|---|---|
| 1 | `DEAL` object; TI as `$/sf`; fit-out as `sf × $/sf`. Defaults chosen so today's figures are unchanged. | No — hint text only |
| 2 | `USES` registry, `requiredCapitalK()`, registry invariants, a sources-and-uses table in `evidence.md`, the waterfall in the artifact. Working capital still on the stated basis. | **Yes** — the deposit/FF&E/contingency lines land, and the G2 tile changes. This is the §1 finding, and it deserves its own review |
| 3 | The ramp; `WC_BASIS` built/stated; the reconciliation invariant; the cash curve; months-to-positive. | Yes, if the built WC differs from $50–65K — which is the point |
| 4 | Equity derived from required capital; the bar moves with the deal; the invariant flips to positive. | **Yes** — every bar figure in §6, the matrix and the docs. Wants a decision-log entry |
| 5 | `LOAN`; replacement-capex reserve; draw-vs-comp split; the second and third tornados. | Yes on the buy path and on draw |

**If only one thing gets done:** PR 1 plus the equity derivation from PR 4 — set
`S.equity` to the sources-and-uses total instead of a slider. That is roughly ten
lines and it is a defect fix, not a feature: it makes the owner's bar respond to
the deal terms, which today it does not.

**If only one number gets checked:** put the deposit in. §1 says it takes the
lease path through the D7 cap on the plan's own figures, and risk 4 says that is
a G2 stop.

---

## 7. What this does not change

The stabilized Year-2 P&L, the cost registry, the stream attribution, the
absorption bases, the wage rungs and the two economic-profit tiers all stand.
This proposal adds a capital layer beside them and connects it to the bar; it
does not re-litigate the operating model. The one operating change it implies —
the replacement-capex reserve — is a consequence of taking capital seriously, not
a separate opinion about costs.
