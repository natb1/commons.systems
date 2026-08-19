---
id: tactic-audit-instrument-scoping
kind: tactic
statement: Give aggregate-usage.sh --session/--node scoping so one instrument
  and one lens catalog serve both the per-run session evaluation and the
  periodic fleet audit, with fleet-denominator lenses tagged fleet-only
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-12 /align round. The parsimony finding:
  /dispatch-token-audit and the session evaluation were never two analyses —
  aggregate-usage.sh already emits both per-session rows and window aggregates
  from one pipeline. Collapsing them to one instrument at two scopes removes the
  duplicate lens catalog without losing the fleet-sized denominators that cannot
  exist at n=1."
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
  reason: "PARK 1 of 2 — MAJOR SCOPE DEVIATION. The whole stated scope of this
    node is already merged on origin/main, so there is no plan left to author
    against the drafted body. Verified independently in-checkout by this round
    (three agents, own line anchors): aggregate-usage.sh carries
    --session/--node with mutual exclusion, the unbounded-mtime-window rule and
    the no-Firestore-persist rule
    (.claude/skills/rsi-audit/scripts/aggregate-usage.sh:22-47, 105-129,
    185-265, 1424-1470); .claude/skills/rsi-audit/SKILL.md:15 already frames the
    skill as the fleet-scoped invocation and its step 4 (lines 108-148) tags all
    twelve lenses [fleet-only]/[any-scope]; and the per-phase evaluator this
    node's third bullet names exists as the /rsi skill, invoking
    aggregate-usage.sh --node (.claude/skills/rsi/SKILL.md:90-109, 129). Shipped
    by commit f9af1a69 (2026-08-12 — the SAME DAY the /align round drafted this
    node, which is why the draft was never reconciled against its own
    implementation), then relocated by commit c3c229f0 / PR #3074, which
    collapsed the skill family into /rsi and /rsi-audit and thereby makes every
    `.claude/skills/dispatch-token-audit/...` anchor in this node's body point
    at a directory that no longer exists. Finalizing this node to
    phase:implement as drafted would dispatch a worker to implement
    already-merged work against dead paths.  PARK 2 of 2 — REQUIREMENT
    AMBIGUITY, on the one candidate residual. Lens 1 (`tool_errors`) is tagged
    [fleet-only] wholesale at .claude/skills/rsi-audit/SKILL.md:113, yet /rsi
    reads that same field at --node scope (.claude/skills/rsi/SKILL.md:138, 180)
    with no skip caveat, and aggregate-usage.sh builds it by reducing over the
    scope-filtered $rows (:984-1003) — so a scoped run's tool_errors is that
    node's own errors rather than a pooled statistic. This node's own body
    already draws exactly that split ('cross-session tool_errors signatures'
    fleet-only vs 'tool_errors (per-run)' meaningful at both scopes), but the
    shipped SKILL.md never encodes it. Ruling needed: (a) split the tag —
    per-run tool_errors counts any-scope, cross-session
    recurrence/sessions_affected fleet-only — or (b) keep the monolithic
    fleet-only tag and instead remove the unqualified tool_errors read from /rsi
    Step 5 lens 1. And if (a), whether that re-tag is THIS node's residual scope
    or a new carrier's: the live sibling draft
    tactic-rsi-round-trips-lens-carrier is scoped exclusively to lens 10
    (phase_standup/scriptable_round_trips) and does not cover lens 1, so
    planning either arm autonomously would either invent scope the author never
    recorded or create overlap with that sibling.  RECORD-COMPLETENESS DEFECTS
    OF THE 2026-08-12 /align ROUND, named here rather than written onto the
    strategy (a per-node /align-tactics session never edits the serving
    strategy). (i) strategy-token-economy clarifications 41, 42 and 43 all
    anchor on `.claude/skills/dispatch-token-audit/...`, a path PR #3074
    removed; they read today as `.claude/skills/rsi-audit/...`, and the
    'per-phase evaluator (tactic-ladder-per-phase-evaluation)' clarification 41
    names is now the /rsi skill. (ii) That round's work landed in code ahead of
    its graph bookkeeping across the whole sibling set: aggregate-usage.sh
    self-attributes its shipped lenses to sibling node ids ('# ----
    cache_efficiency lens (tactic-audit-cache-efficiency-lens) ----' at :1161;
    '# ---- permission_friction lens (tactic-audit-permission-friction) ----' at
    :1215) and rsi-audit/SKILL.md:208-214 carries the attended-only
    /fewer-permission-prompts remediation, yet
    intentions/tactic-audit-cache-efficiency-lens.md and
    intentions/tactic-audit-permission-friction.md both still read status:raw,
    phase:null. (iii) tactic-ladder-per-phase-evaluation is blocked_by this
    node, and that blocker is satisfied in code while this node stays
    draft.  Recommend: run an author /align pass on strategy-token-economy that
    (1) resolves or prunes this node as delivered — the default reading, since
    all three of its bullets are merged — or, if the tool_errors split is
    wanted, re-scopes it to that single residual and re-anchors its body onto
    .claude/skills/rsi-audit/; (2) rules on the lens-1 tag question above and
    records the answer as a clarification, deciding at the same time whether it
    lands here or on a new carrier alongside
    tactic-rsi-round-trips-lens-carrier; and (3) sweeps the same bookkeeping for
    tactic-audit-cache-efficiency-lens, tactic-audit-permission-friction and the
    blocked_by edge on tactic-ladder-per-phase-evaluation, and re-anchors
    clarifications 41-43. Do NOT re-run /align-tactics on this node before that
    pass: this round already established there is nothing autonomous left to
    plan, so a repeat run would park again on the same two questions."
  since: 2026-08-19
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Give aggregate-usage.sh --session/--node scoping so one instrument and one lens catalog serve both the per-run session evaluation and the periodic fleet audit, with fleet-denominator lenses tagged fleet-only

Drafted by the 2026-08-12 `/align` round, carrying the parsimony resolution
recorded that day on `strategy-token-economy` ("Can /dispatch-token-audit be
superseded entirely").

## The finding

The session evaluation and `/dispatch-token-audit` were never two analyses.
`aggregate-usage.sh` already computes per-session rows (`.sessions[]`) and
window aggregates from **one** pipeline, and its `by_phase` buckets already
carry `cache_creation` / `cache_read`. What duplicated was the *lens catalog*
and its drift, not the measurement.

## What changes

- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh` — add
  `--session <id>` / `--node <id>` scoping alongside the existing `--days <N>`.
  Same script, same JSON schema, same lens catalog at both scopes.
- `.claude/skills/dispatch-token-audit/SKILL.md` — reframe as the **fleet-scoped
  invocation** of that instrument, and tag each lens by the scope at which it is
  meaningful.
- The per-phase evaluator (`tactic-ladder-per-phase-evaluation`) invokes the
  same script scoped to its session, and never reads a transcript by hand.

## Fleet-only lenses

Absent at n=1, **never approximated** from one run — an n=1 hit-rate is a
category error, not a small sample:

- pooled `by_phase_outcome` rates (the routing-recommendation input)
- `lenses.baseline_context` median/peak
- `lenses.phase_standup`
- cross-session `tool_errors` signatures
- recurrence

Meaningful at both scopes: `tool_errors` (per-run), `payload_bytes`,
`context_over_120k`, cache efficiency (`tactic-audit-cache-efficiency-lens`),
permission friction (`tactic-audit-permission-friction`).

## Why not full supersession

Two reasons, both recorded. The fleet denominators above cannot be reconstructed
from ~5 sessions; and `strategy-token-economy`'s own `success_signal` is
**weekly allowance utilization**, which would be left with no weekly reader.

## Risk

"A scope filter, not a rewrite" is judgment from reading the pipeline's
structure, **not a measured diff** against a ~1000-line jq program. If scoping
turns out to require restructuring the aggregation, re-scope this unit rather
than forcing it.
