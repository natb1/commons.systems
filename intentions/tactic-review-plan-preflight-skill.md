---
id: tactic-review-plan-preflight-skill
kind: tactic
statement: Add a /review-plan pre-pass that sets /code-review's effort and gates
  the owned finders from an analysis of the diff
owner: ai
status: raw
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
phase: null
execution: null
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
