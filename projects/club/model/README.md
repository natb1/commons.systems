# The club model — one source, three consumers

Every number this project states about the venture's economics comes from
`model.mjs`. The interactive [benchmark explorer](../claude/benchmark-explorer.md)
and the written documents used to hold two independent copies of the same model,
and they drifted: the matrix doc's cells were built on a café margin the explorer
had since corrected, §6 printed an owner-comp figure its own column arithmetic
contradicted, and the "SN/HT: subtract ~$22K per cell" shortcut survived in one
place after being shown wrong in the other. There is now one model, and the page
and the prose are both generated from it.

## The files

| File | What it is |
|---|---|
| `model.mjs` | The model: the plan's §5/§6 marks, the cost registry, the wage rungs, the derivations, and the levers. The single source of truth. Written in the artifact's own dialect (`var`, ES5 functions, no imports, DOM-free) because it is spliced into the published page verbatim. |
| `figures.mjs` | The reading side: named scalar `FIGURES` and whole-table `BLOCKS` that the documents and the artifact's notes card consume. |
| `render.mjs` | Writes both. `node model/render.mjs` regenerates everything; `--check` fails when anything is stale. |
| `verify.mjs` | The model's invariants — the §6 reproduction on §6's own operations figures, the bottom-up operations line reconciling with those figures, every cost carrying provenance, the occupancy residual staying inside its benchmark band, the P&L tree summing to owner comp under both groupings, the marginals, the levers that must not move owner comp. |
| `evidence.md` | Generated, with an authored frame: every cost with its grade and band, the operations reconciliation against §6, and the ranking of what each estimate is worth if it turns out wrong — then the same reading of the capital layer: the uses of cash against D7's cap, the working-capital reconciliation, and the ranking of what to negotiate first. The document that says what to go verify first. |

## Changing the model

```sh
cd projects/club
$EDITOR model/model.mjs        # or figures.mjs, for how a number is presented
node model/verify.mjs          # the invariants still hold
node model/render.mjs          # rewrite the artifact source and every document
git diff                       # every downstream change, in one review
```

Never edit a generated figure in a document — the next render will overwrite it,
and in the meantime the docs and the page disagree, which is the failure this
directory exists to prevent. `node model/render.mjs --check` is the gate: it
exits non-zero and names the stale files.

## The cost registry, and the two operations bases

Every cost the venture carries is declared once, in the registry near the top of
`model.mjs`: an id, the income stream it serves (`cafe` / `rooms` / `books` /
`shared`), what its amount scales with, an evidence grade — **A** contracted,
**B** observed, **C** benchmark, **D** assumed — an optional band, and a closure
returning the amount in $K. `verify.mjs` refuses a cost missing a stream, a grade
or an amount, and refuses a grade-D cost missing a band, so a new cost cannot be
added without saying how well it is known. `evidence.md` is the reading of the
registry: the table, the operations reconciliation, and the band sweep that ranks
what to go verify.

`OPS_BASIS` selects what the operations line *is*. Under `'built'` — the default,
and what every document and the published page print — it is the sum of the
registry's operations components. Under `'stated'` it is §6's two published
per-site totals solved for a fixed base and a revenue-proportional rate, the way
the model used to do it always. The stated basis survives for exactly one job:
showing that the rest of the model's arithmetic lands on §6 when it is given §6's
own operations figures. `withOpsBasis(basis, fn)` evaluates on either without
disturbing global state — the same shape as `withState` — and `withCost(id, value,
fn)` pins one registry entry, which is how `figures.mjs` sweeps a band.

The check this replaced asserted that the fixed base "lands identically at both
sites." It could not fail: the variable rate was defined as the difference in
operations over the difference in revenue, which forces the two bases equal for
any pair of totals. It is deleted. What replaced it compares the built line
against §6's stated figures — two numbers neither of which is derived from the
other — and can therefore come out wrong.

## The capital layer

The cost registry answers what the venture spends every year. `USES` answers
what it spends once, before the doors open, and it is declared the same way: an
id, what the amount scales with, an evidence grade, a closure returning the
amount in $K, and a band wherever the number is an estimate. `verify.mjs`
applies the cost registry's gate to it — a use missing a driver, a grade or an
amount is refused, and so is a grade-D or derived use with no band.
`requiredCapitalK()` is the sum; `headroomK()` is D7's cash cap less that sum,
which is the G2 test computed instead of asserted. `evidence.md` reads the
registry into the uses table, and `CAP_INPUTS`/`withUse` are `INPUTS`/`withCost`
for the capital side, which is what the second tornado sweeps.

Two entries changed meaning as a consequence. `S.build` is no longer the fit-out
budget — it is D7's **scope cap**, and `fitoutScopeK()` (floor area at
`FITOUT_PSF`) is checked against it by `scopeOverrunK()`, so the larger site's
extra square feet cost what they cost instead of disappearing into a flat
number. `S.ti` is in $/sf, #17's own units, so the plan's own ask can be
expressed at either site.

`rampSeries()` is the model's one time dimension, and the reason working capital
can be derived at all. It runs month by month from **opening** — the
construction months are already carried as the `preopen-occ` use, so starting at
signature would double-count them — to `RAMP_HORIZON_MO`, repricing `comp()` at
each month's own marks and dividing by twelve, with occupancy waived in the
abated months that survive construction. Nothing about the stabilized model is
restated inside it, which is what keeps the ramp and the Year-2 snapshot from
drifting; `verify.mjs` asserts that month 24 of the ramp annualizes back to
`comp()` at that month's own marks. `peakDeficitK()`, `monthsToPositive()` and
`monthsToRecover()` all read the same series. The two month counts return
**`null`**, not a large number, when the curve never turns inside the horizon —
the difference between a month count and "not within the horizon" is itself the
answer, and every consumer renders that null as its own state.

`WC_BASIS` selects what working capital *is*, mirroring `OPS_BASIS` exactly,
including the reason the stated basis survives. Under `'built'` — the default —
it is the ramp's peak cash deficit where the ramp turns, and where it does not
it is `runwayReserveK()`: the reserve that funds `S.runway` months at the
stabilized burn, which is the existing `bailComp()` relation inverted rather
than a new idea. Under `'stated'` it is the midpoint of the band §6 states, carried in `WC_BAND`.
`withWcBasis(basis, fn)` evaluates on either without disturbing global state,
the same shape as `withOpsBasis`. The reconciliation between the two is
`evidence.md`'s, and unlike operations it does not agree everywhere: §6's band
turns out to be a gate-case figure, so `verify.mjs` asserts the structural
invariants and no tolerance the base case cannot pass. The ramp was not tuned
toward the band — that was a rule of the work, and the disagreement is the
finding.

The chain that derives all of this is a DAG, and has to stay one:

```
comp() → rampSeries() → peakDeficitK() → workingCapitalK()
       → requiredCapitalK() → capitalAtRiskK() → bandLoK()/bandHiK()
```

`comp()` reads occupancy, the operations aggregates, labor and the commons
budget. It never reads the bars, never reads `USES` and never reads working
capital, so the capital layer can depend on the operating model without the
operating model depending back. Two changes would close the cycle and must not
be written: putting the replacement-capex reserve inside `comp()` — it lives in
`drawK()`, below the operating model, for exactly this reason — and deriving the
depreciable base from `requiredCapitalK()` rather than from the hard-cost uses.

## The three kinds of generated region

- **The model itself**, spliced into `claude/benchmark-explorer-src.html`
  between `// model:begin` and `// model:end`. The published page's model bytes
  are `model.mjs`'s bytes, re-indented with `export` stripped — nothing else is
  transformed, so a diff between the two is a whitespace-and-keyword diff by
  construction.
- **Blocks** — `<!-- model:begin <name> -->` … `<!-- model:end <name> -->` —
  filled by the matching entry in `BLOCKS`. Whole tables: the pro forma, the
  sensitivity rows, the matrices, the wage rungs, the notes card's mini tables.
  Two families joined them with the cost registry — the stream-margin table, in
  markdown for §6 (`stream-margins`) and in the notes card's HTML idiom
  (`stream-margins-html`); and `evidence.md`'s three, the evidence table, the
  operations reconciliation, and the tornado ranking. Works in markdown and in
  the artifact's HTML.
- **Spans** — `<!--m:<name>-->$43K<!--/m-->` — filled from `FIGURES`. One number
  inside authored prose. The prose stays hand-written; only the number is
  generated, so a sentence's argument is the author's and its arithmetic is the
  model's.

An unknown block or figure name is an error, not a silent no-op: the renderer
names the file and the missing entry.

## What is deliberately not generated

Argument, judgment, and history. The plan's decision log, the notes card's
account of what an earlier revision got wrong, the evidence caveats in
`../validation/` — those are authored, including the numbers inside them that
describe superseded models (the retired $107K site basis, the 60.6% café margin,
the figures §6 printed through v0.3.3). A generated figure states what the model
says today; a historical one states what a document once said, and rewriting it
would erase the record.

## Deploying the artifact

The model reaching the published page is a separate step from the model reaching
the repo — see `.claude/rules/published-artifacts.md`. In short: preview from the
second artifact while the change is in flight, and after the PR merges, deploy
`claude/benchmark-explorer-src.html` from main to the live URL recorded in
`../claude/benchmark-explorer.md`.
