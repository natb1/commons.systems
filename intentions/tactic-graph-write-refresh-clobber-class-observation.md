---
id: tactic-graph-write-refresh-clobber-class-observation
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-transition-node-needs-main-residue-clobbered: the
  silent-clobber-on-refresh idiom is a four-site class rather than one defect,
  ratified clarification 102 describes a mechanism #2939 made obsolete the day
  after it was recorded, and the /qa-fix Step 3.6 seam has gained a fifth
  concurrent carrier"
owner: human
status: delegated
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
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
  reason: "Observation carrier, not planned work — three immaterial Side-B drift
    observations from the 2026-08-20 /align-tactics tactic-mode round that
    finalized tactic-transition-node-needs-main-residue-clobbered. Per
    clarification 245 (violation V1, which OVERTURNED clarification 118), an
    autonomous per-node session may not write these to the serving strategy's
    clarifications, and a tactic-target session never touches the serving
    strategy's frontmatter at all — so this carrier is their only legal
    destination. proceed stayed true; the round ran on uninterrupted. (1) SCOPE
    / BLAST RADIUS, measured this round: the
    fetch-origin/main-then-overwrite-then-mutate idiom that causes the clobber
    is a FOUR-SITE class, not one defect — transition-node
    (.claude/skills/dispatch-propagate/scripts/transition-node:85-104),
    park-node's restore_node
    (packages/intentionsutil/scripts/park-node:241-333), clear-park (~:279), and
    resolve-hold's clean_node_file
    (packages/intentionsutil/scripts/resolve-hold:271-320). Each captures a
    pre-refresh copy purely for FAILURE-path rollback and discards it on the
    SUCCESS path, so a pre-existing uncommitted edit is destroyed with no
    diagnostic at all four. Only transition-node is reached by /qa-fix's residue
    append, so only it is in the finalized node's scope; the other three are
    recorded here so a later round can consolidate them onto the shared helper
    graph_rollback_node_writes
    (.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:73-198,
    which transition-node does not yet source) rather than re-deriving the
    finding. (2) A DATED CLARIFICATION IS NOW OBSOLETE AND HAS NOT BEEN
    RECONCILED. Clarification 102 (recorded 2026-07-25, RATIFIED AS RECORDED at
    the 2026-07-30 sitting per clarification 141 ruling (1)) measures the
    residue append as landing \"in the SAME graph-commit as the qa to review
    transition\", causing a scope-drift demotion cascade. git log -L 102,102 on
    transition-node returns exactly one commit — c063f490, 2026-07-26, #2939 —
    ONE DAY AFTER that clarification was recorded. Since then the residue lands
    NOWHERE, so the mechanism the ratified clarification describes has not been
    current for the entire period it has been cited. This is a record-accuracy
    observation about a ratified entry; only the author may reconcile it. (3) A
    FIFTH CARRIER LANDED ON THE /qa-fix Step 3.6 SEAM that clarification 111
    already named a semantic-conflict attractor. Verified at origin/main this
    date: tactic-transition-node-stamp-landed-body is phase done (#2973 merged,
    so the chain head clarification 141 ruling (5) reordered to the front has
    landed); tactic-scope-fingerprint-plan-substance is still phase qa on #2974,
    and its new primitives
    (packages/intentionsutil/scripts/append-machinery-section.ts and
    packages/intentionsutil/src/body-substance.ts) are confirmed ABSENT from
    origin/main. #2974 rewrites the same Step 3.6 paragraph and its own diff
    STILL carries the false \"That append rides in the Step-4 transition-node
    commit\" sentence, so it does not fix the defect. The round applied the
    already-recorded serialization doctrine and set blocked_by:
    [tactic-scope-fingerprint-plan-substance] on the finalized node rather than
    editing that paragraph concurrently."
  since: 2026-08-20
  recommendation: "Three dispositions, decide each observation separately — none
    is a plan and none should be dispatched. (1) The four-site clobber class:
    DROP (already named as out-of-scope in the finalized node's Context),
    CLARIFY-ONLY (record the class so a later reader does not re-derive it), or
    MECHANIZE (file a carrier that rewires park-node / clear-park / resolve-hold
    onto lib-graph-rollback.sh). Mechanize is the recommended reading — three
    live silent-data-loss sites remain after the finalized node lands. (2)
    Clarification 102's obsolete mechanism: CLARIFY-ONLY is the only
    autonomous-safe option and it is the recommended one — append a dated
    amendment to clarification 102 noting that #2939 (2026-07-26) superseded its
    measured mechanism the day after it was recorded, so the demotion cascade it
    describes and the routing loss that replaced it are distinct eras.
    Alternatively DROP if the entry is considered self-dating. Do NOT let an
    autonomous lane write this. (3) The Step 3.6 seam serialization:
    CLARIFY-ONLY (confirm the blocked_by this round set is the intended
    sequencing) or DROP (if you would rather the two land concurrently and take
    the textual conflict). No mechanization is proposed."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — 2026-08-20 /align-tactics round on `tactic-transition-node-needs-main-residue-clobbered`

## What this node is

This is an **observation carrier**, not planned work. It has **no plan, no units, and
no verification**, and it must **not** be dispatched to an implement lane. It exists
because the 2026-08-20 `/align-tactics` tactic-mode round that finalized
`tactic-transition-node-needs-main-residue-clobbered` surfaced three
**immaterial** Side-B drift observations, and an autonomous per-node session has
nowhere else to put them:

- Strategy clarification **245** (violation **V1**, ruled 2026-08-14, extended
  2026-08-15) forbids an autonomous lane writing `clarifications` onto a strategy —
  `clarifications` is allowlist member two of `strategyFingerprint`, so such a write
  soft-freezes every open child of that strategy for an observation defined as gating
  nothing, and a model-authored dated clarification is byte-indistinguishable from an
  author-ruled one.
- Clarification **118**, which had permitted exactly that, carries an
  `OVERTURNED 2026-08-15` prefix pointing at 245.
- `references/tactic-target.md` forbids a tactic-target session touching the serving
  strategy's frontmatter at all.

So clarification 245's ruling applies: mint **one** born-parked observation node
serving the strategy, keep `proceed` true, and let the round finish uninterrupted. A
human promotes whichever of these is worth keeping into a real clarification at office
hours, through the attended surface.

The full text of all three observations, plus the dispositions offered for each, is in
this node's `office_hours.reason` and `office_hours.recommendation`. They are
summarized below for a reader scanning the body.

## Observation 1 — the silent clobber is a four-site class, not one defect

The finalized node fixes `transition-node`. The same
fetch-`origin/main` → overwrite → mutate idiom, with the identical
discard-on-success gap, lives at three more sites:

| Site | Anchor |
|---|---|
| `transition-node` | `.claude/skills/dispatch-propagate/scripts/transition-node:85-104` (**in scope** — fixed by the finalized node) |
| `park-node` `restore_node` | `packages/intentionsutil/scripts/park-node:241-333` |
| `clear-park` | `packages/intentionsutil/scripts/clear-park` (~:279) |
| `resolve-hold` `clean_node_file` | `packages/intentionsutil/scripts/resolve-hold:271-320` |

Each captures a pre-refresh copy **purely for failure-path rollback** and discards it
on the success path, so a pre-existing uncommitted edit is destroyed with no
diagnostic at all four. Only `transition-node` is reached by `/qa-fix`'s residue
append, which is why the finalized node scopes to it alone — but three live
silent-data-loss sites remain after it lands. The consolidation target already exists:
`graph_rollback_node_writes` in
`.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:73-198`, which
`transition-node` does not yet source.

## Observation 2 — a ratified clarification describes a mechanism that has been obsolete since the day after it was recorded

Clarification **102** was recorded **2026-07-25** and **ratified as recorded** at the
2026-07-30 office-hours sitting (clarification **141**, ruling (1)). It measures
`/qa-fix`'s residue append as landing *"in the SAME graph-commit as the qa to review
transition"*, and derives the scope-drift demotion cascade from that.

Measured this round:

```
git log -L 102,102:.claude/skills/dispatch-propagate/scripts/transition-node
→ c063f490  2026-07-26  "Graph-write completion recipes: CAS-guard fix-checks and transition-node (#2939)"
```

Exactly one commit, dated **one day after** clarification 102 was recorded. Since
2026-07-26 the residue does not land in that commit at all — it lands **nowhere**.
The demotion cascade clarification 102 describes and the routing loss that replaced it
are two different eras of the same seam, and the ratified entry has not been
reconciled to that in the ~25 days it has been cited since.

This is a **record-accuracy observation about an author-ratified entry**. Only the
author may reconcile it; this round deliberately wrote nothing to the strategy.

## Observation 3 — the /qa-fix Step 3.6 seam has a fifth concurrent carrier

Clarification **111** already identified the `/qa-fix` Step 3.6 paragraph as a
semantic-conflict attractor — two independent tactics once wrote opposite corrections
to that one paragraph, which is what made their merge conflict semantic. Verified at
`origin/main` on 2026-08-20:

- `tactic-transition-node-stamp-landed-body` — **phase `done`** (#2973 merged), so the
  chain head that clarification 141 ruling (5) reordered to the front has landed.
- `tactic-scope-fingerprint-plan-substance` — still **phase `qa`** on **#2974**. Its new
  primitives `packages/intentionsutil/scripts/append-machinery-section.ts` and
  `packages/intentionsutil/src/body-substance.ts` are confirmed **absent** from
  `origin/main` by `git ls-tree`. It rewrites the same Step 3.6 paragraph, and its own
  diff **still carries the false** *"That append rides in the Step-4 transition-node
  commit"* sentence — so it does **not** fix the defect the finalized node fixes. The
  two are complementary.

Applying the already-recorded serialization doctrine (clarification 111, plus commit
`d84eb5b2`'s serialization intent as reordered by clarification 141 ruling (5)), this
round set `blocked_by: [tactic-scope-fingerprint-plan-substance]` on the finalized
node rather than have it edit that paragraph concurrently. That is an application of
existing doctrine, not a new premise — it is recorded here so the sequencing decision
is visible rather than buried in an edge.

## Provenance

- Round: `/align-tactics tactic-transition-node-needs-main-residue-clobbered` (tactic mode, per-node finalize), 2026-08-20.
- Workflow run: `wf_ad132695-270` — 6 agents, 0 errors, 0 empty results; `drift.proceed`
  true, `deviation` false, no parks.
- Base `origin/main`: `f025c668`.
- All three observations returned as `material: false`, `plan_depends: false` — none
  gated the plan, and the finalized node's plan does not depend on any of them.
