---
id: tactic-review-plan-preflight-skill
kind: tactic
statement: Add a /review-plan pre-pass that sets /code-review's effort and gates
  the owned finders from an analysis of the diff
owner: ai
status: codified
parent: null
rationale: Surfaced by the 2026-08-13 /align round on review token usage.
  Carries clarifications 49 (the per-input effort carve-out from the
  no-auto-apply bar, and the author-ruled low-to-max band), 52 (semantic trigger
  gating, never cost or yield cuts) and 53 (the eight analyses and the four
  rules governing how they combine). Deliberately sequenced AFTER
  tactic-review-delta-base-and-blast-radius per clarification 54's divergence,
  so its value is measured against the delta-only baseline rather than against
  today's full re-review, and so it must earn its own cost honestly.
reading: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-review-delta-base-and-blast-radius
  pr: 3087
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-review-delta-base-and-blast-radius
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a /review-plan pre-pass that sets /code-review's effort and gates the owned finders from an analysis of the diff

Draft retained from the 2026-08-13 `/align` round on review token usage. Not
refined to the plan schema — that is `/align-tactics`' job. Authoritative
requirements live in `strategy-token-economy` clarifications 49, 52, 53 and 54.

## Shape

An **Opus subagent** runs a new `/review-plan` skill as the first act of
`/review-fix`, **before** both the detached `/code-review` pre-stage
(`SKILL.md` Step 1b) and the Workflow fan-out (Step 2). It reads the review
delta once and returns a small structured verdict — never prose — carrying:

- an **effort level** for `dispatch-code-review --effort`, and
- a **finder gate set** shaped like what
  `agentFinderSet(surface, app_or_rules, api_call_site)` already consumes
  (`.claude/workflows/review-fix.js:597-609`), plus per-lens on/off **with a
  recorded reason**.

`dispatch-code-review` already exposes `--effort` and `--model` and the caller
currently overrides neither (`SKILL.md:354-362`) — so the effort seam exists and
this node uses it rather than adding one.

## Authority — and its three hard limits

Effort authority is a **per-input** carve-out from the no-auto-apply bar, not a
loosening of it (clarification 49). It holds only while all three hold:

1. The band is **author-set**: `low` … `max`, default `high`. The skill may not
   re-open the band.
2. `high` is what an **absent, failed, or unparseable** verdict gets — the
   fail-open condition.
3. Every deviation **records** the level and the rationale, so the measurement
   clarification 46 requires is stratified rather than confounded.

Gating authority is **semantic triggers only** (clarification 52). The skill may
narrow or widen a lens's trigger on the semantics of the diff. It may **never**
disable a lens for being expensive or low-yield — clarification 18 retained
api-cost at a *measured zero* finding rate and widened its trigger instead.

## The eight analyses

Six mechanical, two Opus-judgment. Full text and rationale in clarification 53.
Analysis 1 is **not built here** — clarification 54 moves it to
`tactic-review-delta-base-and-blast-radius`, which ships first; this skill
consumes its output.

| # | Analysis | Kind | Drives |
|---|---|---|---|
| 1 | Blast radius | mech (elsewhere) | out-of-diff reading list; fan-out raises |
| 2 | Contract delta | Opus | signature/schema/error-path ⇒ raise |
| 3 | Irreversibility surface | mech | **hard `xhigh` floor**, overrides all cheapening |
| 4 | Change-class mix | Opus | primary effort driver **and** finder gate |
| 5 | Prior-finding recurrence | mech | re-touched fixed code ⇒ raise + brief |
| 6 | Test-coverage delta | mech | untested new logic ⇒ raise |
| 7 | Delta provenance | mech | lane-authored CI repairs ⇒ raise |
| 8 | Size and dispersion | mech | **tie-breaker only** — deliberately demoted |

Four governing rules bind the combination and are the part a later editor is
most likely to drop:

- **Fail-open** — error/timeout/unparseable ⇒ `high` + full roster. Never cheaper.
- **Bounded** — reads the delta once plus the mechanical outputs, never the whole
  repo. A pre-pass that grows into a review is the cost it exists to reduce.
- **Asymmetric** — raising is any-of; cheapening requires **all** signals to agree.
- **Recorded** — effort, finder set and rationale are written out.

## Measurement — the honest bar

Its value is measured **against the delta-only baseline** established by
`tactic-review-delta-base-and-blast-radius`, never against today's full
re-review. That sequencing is the whole point of clarification 54's divergence:
the delta-scoping's saving must not be credited to this node.

The comparison that actually prices it —  findings at each effort level for
comparable diffs — is **not computed by any sensor today**. That gap is
`tactic-audit-review-effort-yield-lens`, and by the one-instrument condition the
lens is added to `aggregate-usage.sh`'s shared catalog, never to a second
parallel analysis.

## Unmeasured, and recorded as such

No run of any of this exists. The analysis ordering and the raise/lower
asymmetry are design judgment, not readings. Until the yield lens lands, this
node is an unmeasured throughput bet — the same honest state clarification 46
recorded for the `high` raise.

## Resolved (2026-08-13) — PR #3087, merged e612e50c

Shipped `/review-plan` (`.claude/skills/review-plan/SKILL.md`), `/review-fix`
Step 1a, and the mechanically-enforced gate in `.claude/workflows/review-fix.js`
(the `review plan gate` sentinel region: `reviewPlanEffort`,
`reviewPlanFinderSet`, `reviewPlanDeadline`), covered by
`test-review-plan-gate.sh` (47 rows).

### It shipped ALONGSIDE its blocker, not after it

Clarification 54's sequencing consequence said this tactic "must not be planned as
one PR with" `tactic-review-delta-base-and-blast-radius`, so its value could be
measured against the delta-only baseline. **The author overrode that**, and both
landed in PR #3087. See the dated amendment appended to clarification 54 on
`strategy-token-economy` for the ruling and its measurement consequence: the
delta-only baseline was never established, so the two savings cannot be separated
retrospectively, and clarification 49's requirement (3) now carries that weight
alone.

That is why `recorded` is enforced mechanically rather than left to convention:
`reviewPlanEffort` and `reviewPlanFinderSet` each return a rationale, the
`/review-fix` call site `log()`s both, and the gate suite asserts every verdict
carries a non-empty one.

### A hazard found in implementation that the clarifications did not name

Clarification 49 admitted `max` to the band on the ground that clarification 45
retired the synchronous kill regime. Reading `dispatch-code-review` while wiring
the seam showed the kill is **not** retired — it is *bounded*: the script kills a
run that exceeds its deadline (`:1225-1226`), default 5400 s. And `claude -p`
buffers all output until completion, so a killed run is still a **total loss, not
a partial result**.

So `xhigh` and `max` on today's 5400 s deadline would have reproduced exactly the
zero-bytes outcome clarification 49 reasoned was behind us — every time, by
construction. `REVIEW_PLAN_DEADLINES` therefore scales `--deadline-seconds` *and*
Step 1b's poll cap with the effort level, and every row is an exact multiple of
the script's 540 s await window so `/review-fix`'s `cap × 540 == deadline`
equality holds at every band level rather than only at `high`. That equality is
what makes the script's exit-4 path reachable, and that path is the only thing
that releases the reviewed worktree's `flock`.

The band itself is unchanged and remains author-set; this constrains the *cost of
reaching* its upper half, not the band.
