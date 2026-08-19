---
id: tactic-audit-review-effort-yield-lens
kind: tactic
statement: Add a review-effort yield lens to the token audit's shared lens
  catalog — findings and applied fixes per built-in /code-review run, bucketed
  by effort level, so the `high` raise can be compared against its own `low`
  baseline
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 in the /align round that raised the review
  lane's built-in /code-review from `low` to `high`. The author ruled that round
  measure-and-record with no thresholds asserted, and named the comparison that
  actually answers whether the raise was worth it: findings at `high` against
  the `low` baseline for comparable diffs. No sensor computes that today — the
  token-economy sensor reads spend and attribution, not per-effort review yield
  — so this is a missing lens rather than a missing query, and until it exists
  the raise is an unmeasured quality bet. Placement is fixed by condition 7
  (recorded 2026-08-12): the token audit is ONE instrument at two scopes, so a
  new lens is added to aggregate-usage.sh's shared catalog, never to a second
  parallel analysis. Sibling to tactic-audit-cache-efficiency-lens and
  tactic-audit-instrument-scoping from the 2026-08-12 round. Report measured
  magnitudes only; assert no dollar or duration threshold, per the same
  discipline that restated clarification 18's range and
  tactic-review-verify-per-file-batching's 3.2x as an upper bound. CORRECTED
  2026-08-18 (/align-tactics tactic-mode drift review, measured in-worktree; the
  text above is retained as the 2026-08-13 record and two of its claims no
  longer hold). (1) The asserted dependency on tactic-audit-instrument-scoping
  is ALREADY SATISFIED: aggregate-usage.sh accepts --session/--node today
  (.claude/skills/rsi-audit/scripts/aggregate-usage.sh:220-249), so no
  blocked_by edge is owed on that ground. (2) The claim that the lens 'is
  meaningful at both scopes and so is not tagged fleet-only' holds for only half
  of it: the per-run figures are any-scope, but the effort-to-yield comparison
  is a pooled cross-run rate and is fleet-only under condition 7. (3) The round
  could not author a plan: there is no source-verified per-run findings count to
  bucket, which is an author decision rather than a design choice this session
  may make. The node is parked with that question; see office_hours and the
  body."
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Requirement ambiguity: the lens has no source-verified per-run findings
    count to bucket, and closing that gap may require write-side instrumentation
    this tactic's own rationale excludes (\"a missing lens rather than a missing
    query\"). Verified in the worktree 2026-08-18: dispatch-code-review already
    prints effort=, model=, wall_clock_s= and touched_files_count= at the source
    (.claude/skills/dispatch-propagate/scripts/dispatch-code-review:1385-1399),
    so the effort, cost and fix-yield terms ARE available and source-verified
    per condition 6. But findings_path= is $OUT_DIR/output.txt (:427), the
    built-in's verbatim free-form prose, and
    .claude/skills/review-fix/references/code-review-invocation.md:133-156
    records that this output has no stable machine-readable shape across runs
    and that the built-in's self-report of what it fixed is not a reliable yield
    signal. The only per-run findings count in the system is produced by the
    Sonnet parse:code-review structuring subagent
    (.claude/workflows/review-fix.js:1863), and its per-source split lands in
    ${result_out_dir}/result.json under the worktree-local tmp/review-result-$N
    (.claude/skills/review-fix/SKILL.md:865-868), which is reaped with the
    worktree. The durable dispatch:outcome:v1 envelope carries findings_surfaced
    / findings_actionable / fixes_applied but has NO effort field and no
    per-source split (dispatch-emit-outcome:168-177), so it cannot answer
    \"findings from the built-in at effort X\" either. AUTHOR RULING NEEDED, (a)
    or (b): (a) extend dispatch:outcome:v1 with an `effort` field and a
    per-source findings split - a coordinated change across
    .claude/docs/outcome-envelope.md, dispatch-emit-outcome, both review-fix
    terminal call sites and aggregate-usage.sh's reader - and rule explicitly
    that a structuring-subagent-parsed findings count clears condition 3's
    \"accounting is verified\" bar and condition 6's instrument-attribution bar,
    with its model-mediated provenance recorded alongside every figure; or (b)
    ship the lens on source-verified figures only - touched_files_count as the
    fix-yield term plus effort, model, wall clock and price proxy - and record
    that the findings half of clarification 46's comparison is not measurable
    today, so the `high` raise stays an unmeasured quality bet on the findings
    axis. Either branch also settles whether making result.json's per-source
    dispositions durable is sanctioned, since its non-durability is currently a
    deliberate design choice. RECORD-COMPLETENESS DEFECT of the 2026-08-13
    /align round that produced clarification 46: it named the comparison without
    recording whether write-side instrumentation is in scope for its carrier,
    and this session is a per-node tactic-target run, which may not write
    clarifications onto the strategy. Two measured drift findings this round
    also belong on the strategy and could not be landed here - the perishable
    `low` baseline (~35 days of rolling transcript retention; oldest surviving
    .jsonl 2026-07-14) and the scope-tag split (the per-run figures are
    any-scope, but the effort-to-yield comparison itself is a pooled cross-run
    rate and is fleet-only under condition 7); both are written in full in this
    node's body. Recommend: an author /align pass on strategy-token-economy that
    rules (a) vs (b), lands the two drift findings in this node's body as
    strategy clarifications, and corrects clarification 46's silence on
    instrumentation scope; then re-run /align-tactics
    tactic-audit-review-effort-yield-lens."
  since: 2026-08-18
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Add a review-effort yield lens to the token audit's shared lens catalog — findings and applied fixes per built-in /code-review run, bucketed by effort level, so the `high` raise can be compared against its own `low` baseline

Born-parked 2026-08-18 by an `/align-tactics` tactic-mode round. No plan was
authored: the round's drift review found a requirement ambiguity that changes
what the lens is, not merely how it is built. The blocking question and the
recommended next step are in `office_hours.reason`. Everything below is
measured, in-worktree, against `dcf1baa6`.

## What is already available, source-verified

`dispatch-code-review` Step 7 prints a summary whose field names are an
explicit parsing contract ("EXTEND this list, never rename a line",
`.claude/skills/dispatch-propagate/scripts/dispatch-code-review:1382-1384`):

- `effort=` and `model=` — `dispatch-code-review:1393-1394`
- `wall_clock_s=` — `:1396`
- `touched_files_count=` — `:1398`, derived from a before/after `git diff`
  rather than from the built-in's self-report

These clear condition 6's instrument-attribution bar: they are checked at the
source, not taken from an agent's account of what it ran. `effort` in
particular must be read from this line rather than assumed from the script
default, because `reviewPlanEffort` (`.claude/workflows/review-fix.js:709-769`)
varies it per run inside the author-set band — cheapening under unanimity, an
`xhigh` irreversibility floor, fail-open to `high`.

## What is missing — the blocker

`findings_path=` is `$OUT_DIR/output.txt`
(`dispatch-code-review:427`), the built-in's verbatim free-form prose.
`.claude/skills/review-fix/references/code-review-invocation.md:133-156`
records that this output has no stable heading set and no guaranteed
machine-readable envelope across runs, and that the built-in's self-report of
what it fixed is not a reliable yield signal.

The only per-run findings count in the system comes from the Sonnet
`parse:code-review` structuring subagent
(`.claude/workflows/review-fix.js:1863`), and its per-source split is written
to `${result_out_dir}/result.json` under the worktree-local
`tmp/review-result-$N` (`.claude/skills/review-fix/SKILL.md:865-868`) — reaped
with the worktree.

The durable `dispatch:outcome:v1` envelope carries `--findings-surfaced`,
`--findings-actionable` and `--fixes-applied` but has **no** `effort` field and
no per-source split (`dispatch-emit-outcome:168-177`), so it cannot answer
"findings from the built-in at effort X" either.

So clarification 46's named comparison — findings at `high` against the `low`
baseline — has no admissible input today, and supplying one is write-side
instrumentation that this node's own rationale places out of scope.

## Drift finding 1 — the `low` baseline is perishable

`aggregate-usage.sh` reads transcripts under `~/.claude/projects` within an
mtime window. Measured on this host 2026-08-18: the oldest surviving `.jsonl`
is dated 2026-07-14 — roughly 35 days of rolling retention, with 7542 files
newer than 2026-07-15 — and `effort=low` runs are still present.

Since the lane default moved to `high` on 2026-08-13, and clarification 49's
band keeps per-run selection inside an author-set range whose default is
`high`, essentially no new `low` runs are expected. The baseline is a fixed
historical window that ages out, not a stream that refills. A lens design
should read that window while it exists and, where the comparison matters, pin
the computed baseline rather than assume it can be recomputed from transcripts
later. Reported as measured retention, not asserted as a deadline.

## Drift finding 2 — the scope tag splits; it is not uniformly any-scope

This node's rationale claims the lens "is meaningful at both scopes and so is
not tagged fleet-only". Measured against condition 7 and
`.claude/skills/rsi-audit/SKILL.md:110-111`, that holds for only half of it:

- **Any-scope** — this run's realized wall clock, price-proxy draw, effort,
  model, touched-files count, and completed-inside-budget vs continued-detached.
  All well-defined at n=1.
- **Fleet-only** — the effort-to-yield comparison itself. It is a pooled
  cross-run rate, the same shape as `baseline_context` and `phase_standup`, so
  under condition 7 it is ABSENT at n=1 and never approximated from a single
  run.

The lens therefore splits the way `cache_efficiency` already does — an
any-scope per-session mirror written onto `.sessions[]`
(`aggregate-usage.sh:1108-1114`, with the per-session ratio at ~`:1095`) plus a
fleet-only pooled block following the `creation_churn` cross-session idiom
(`:1188-1213`) — rather than carrying a single undifferentiated scope tag.

## Corrections to this node's own rationale

- The asserted dependency on `tactic-audit-instrument-scoping` is **already
  satisfied**: `aggregate-usage.sh` accepts `--session ID | --node ID` today
  (`.claude/skills/rsi-audit/scripts/aggregate-usage.sh:220-249`, contract
  documented at `:22-113`). No `blocked_by` edge is owed on that ground. The
  census still classifies that node as `draft`/`phase: null`, which is a
  record-vs-reality mismatch worth a separate look.
- The sibling `tactic-audit-cache-efficiency-lens` has **shipped**
  (`aggregate-usage.sh:1161`), alongside `permission_friction` (`:1215`) and
  `phase_standup` (`:1254`); the catalog is the jq pipeline under
  `# ---- lenses ----` (`:1119`) and the output object is assembled at
  `:1376-1383`.
- The instrument moved home: `.claude/skills/rsi-audit/`, not a
  `dispatch-token-audit` directory. Its tests
  (`.claude/skills/rsi-audit/scripts/test-*.sh`) are CI-wired through
  `run-unit-tests.sh:89,206-224` behind a changed-paths gate.
