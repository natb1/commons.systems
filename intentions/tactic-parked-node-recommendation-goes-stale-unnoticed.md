---
id: tactic-parked-node-recommendation-goes-stale-unnoticed
kind: tactic
statement: "Observation carrier (no plan, do not dispatch): a parked node's
  office_hours.recommendation can decay to un-actionable while the node sits in
  the queue — tactic-attention-per-tier-boost-migration's cites a job dir
  deleted five days later — and no lane owns re-checking or correcting it"
owner: human
status: delegated
parent: null
rationale: Born-parked observation carrier minted by the 2026-08-19
  /align-tactics tactic-mode round on
  tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir. Carries that
  round's immaterial Side-B drift observations, which a tactic-target session
  may not write onto the serving strategy as clarifications. No plan; not
  claude-executable; awaits an office-hours sitting.
reading: null
serves:
  - strategy-recursive-self-improvement
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
  reason: "Observation carrier, not work. The 2026-08-19 /align-tactics round
    finalizing tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir
    surfaced two immaterial premises its drift review could not land as strategy
    clarifications (a per-node tactic-target session never writes the serving
    strategy's frontmatter). Neither gated that plan; both want an author's eye.
    (1) THE PREDICTED LOSS IS REALIZED. The finding's own closing claim — \"the
    patch still existed at the time of this evaluation, this is a live
    opportunity to preserve it, not a post-mortem\" — is false as of 2026-08-19:
    job dir 09888b78 is absent, no unit4-deferred.patch exists anywhere under
    /home/n8/.claude or /home/n8/natb1, and PR #3093 is still open on branch
    tactic-attention-per-tier-boost-migration carrying only 2827ca00, 868a66a6,
    afb3d8b7 and 1fe90deb — no Unit 4 commit and no revert, so git carries no
    copy either. attributes.measured_impact.at_risk_patch_size 36973 should be
    read as a realized loss, not an exposure. (2) THE STALE PARK RECOMMENDATION
    HAS NO OWNER. tactic-attention-per-tier-boost-migration is still parked at
    phase implement, office_hours.since 2026-08-14, and its recommendation step
    2 still directs a future session to \"recover from that session's job dir if
    needed\". That step is now dead; only its fallback (re-run /implement-unit
    against the Unit 4 scope text in that node's plan body) survives. Correcting
    a parked node's recommendation is an office-hours act, so the finalized
    sibling deliberately left it standing — which means a recommendation that
    decayed to un-actionable is sitting in the queue with nothing scheduled to
    notice. That is the generalizable half: park recommendations are written
    once and never re-validated, and their premises rot at the rate the harness
    deletes its scratch. (3) SCOPE NOTE, recorded so a later round does not
    re-derive it: /implement/SKILL.md and /implement-unit/SKILL.md contain no
    \"defer\" language at all, so the durable channel the sibling plan authors
    is net-new rather than an amendment; and the adjacent sibling
    tactic-node-lane-escalate-park-unconsumed (phase done) covered marker
    LANDING, not work-product custody, so no duplicate-finding hazard fires."
  since: 2026-08-19
  recommendation: "Three dispositions, pick one. (a) DROP — rule that a stale park
    recommendation is acceptable: office-hours re-reads HEAD before
    dispositioning anyway, so a decayed recommendation costs a re-read rather
    than a wrong act, and no mechanism is owed. If so, resolve this node and
    correct tactic-attention-per-tier-boost-migration's recommendation in the
    same sitting. (b) CLARIFY-ONLY — promote observation (2) to a clarification
    on strategy-recursive-self-improvement or strategy-graph-native-dispatch
    stating that a park recommendation is a point-in-time artifact and that
    office-hours must re-verify its cited paths before acting, with no code
    change. (c) MECHANIZE — spawn a tactic that re-validates cited paths on the
    parked population, e.g. extend the sibling's ephemeral-citation detector to
    a sweep over office_hours.recommendation across intentions/, reporting parks
    whose recommendation cites a path that no longer resolves. Note (c) is only
    worth its cost if (a) is judged false. Independently of the choice:
    tactic-attention-per-tier-boost-migration needs its recommendation corrected
    by hand — its Unit 4 must be re-implemented from the scope text in its own
    plan body, not recovered."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
## This is an observation carrier, not work

It has no plan and no units. **Do not dispatch it.** It exists because a
per-node `/align-tactics <tactic-id>` session may not write clarifications onto
its serving strategy (`.claude/skills/align-tactics/references/tactic-target.md`,
"There is **no strategy edit** in either case"), so the immaterial Side-B
observations that round surfaced need somewhere durable to sit until a human
rules on them. `office_hours.recommendation` carries three explicit dispositions;
pick one at an office-hours sitting and resolve this node.

Minted 2026-08-19 by the round that finalized
`tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir` to
`phase: implement`.

## Observation 1 — the predicted loss is realized, and the finding's own text said otherwise

The finding node closed with: "The patch still existed at the time of this
evaluation — this is a live opportunity to preserve it, not a post-mortem."
Measured 2026-08-19, that is false:

- `ls /home/n8/.claude/jobs/09888b78` → `No such file or directory`. The whole
  job directory is gone, not just `tmp/`. No file named `unit4-deferred.patch`
  exists anywhere under `/home/n8/.claude` or `/home/n8/natb1`.
- Git carries no copy either. `git log --oneline
  origin/tactic-attention-per-tier-boost-migration` shows Units 1–3 only
  (`2827ca00`, `868a66a6`, `afb3d8b7`, `1fe90deb`) plus two `origin/main`
  merges — no Unit 4 commit and no revert commit. `legacyTierKey` is still live
  at `packages/intentionsutil/src/schema.ts:388`; validateGraph has no rule 22.
  PR #3093 is still open.

So `attributes.measured_impact.at_risk_patch_size: 36973` on the finding node
should be read as a **realized loss**, not an exposure, and
`durable_copies_of_deferred_unit: 0` is now permanent. The finalized sibling's
plan is forward-looking mechanism work; it recovers nothing, and no unit in it
can.

## Observation 2 — the generalizable half: a park recommendation is written once and never re-validated

`tactic-attention-per-tier-boost-migration` is still parked — `phase: implement`,
`office_hours.since: 2026-08-14` — and step 2 of its recommendation still directs
whoever picks it up to "recover from that session's job dir if needed". That step
is dead. Only its fallback survives: re-run `/implement-unit` against the Unit 4
scope text in that node's own plan body.

Correcting a parked node's disposition is an office-hours act, so the finalized
sibling deliberately left it standing rather than editing another node's park.
The consequence is the observation worth a human's eye: **a recommendation that
has decayed to un-actionable is sitting in the queue with nothing scheduled to
notice.** Park recommendations are point-in-time artifacts whose premises rot at
the rate the harness deletes its scratch, and no lane owns re-checking them.

## Observation 3 — scope note, recorded so a later round does not re-derive it

- `/implement/SKILL.md` and `/implement-unit/SKILL.md` contain **no** "defer"
  language at all (grep, 2026-08-19). The worker improvised the patch-file
  deferral. The durable channel the sibling plan authors is therefore net-new,
  not an amendment of an existing path.
- `tactic-node-lane-escalate-park-unconsumed` (phase done, serving
  `strategy-graph-native-dispatch`) covered the escalation **marker-landing**
  path — `dispatch-mark-node-park` writing `office-hours-{reason,recommendation,pr}`
  into `$CLAUDE_JOB_DIR` and the sweep that lands them — which is a distinct
  mechanism from custody of a work-product diff. No duplicate-finding hazard
  fires against the serving strategy's "no two tactics recording the same
  root-cause defect" threshold.

## Provenance

Recorded from `result.drift.unrecorded_premises` / `clarifications_to_add` of
the 2026-08-19 `/align-tactics` tactic-mode round (run `wf_93af79b9-704`), both
entries `material: false`, `plan_depends: false`, `drift.proceed: true`. Neither
gated the sibling's plan.
