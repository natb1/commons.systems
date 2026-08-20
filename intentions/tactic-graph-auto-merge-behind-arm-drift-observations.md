---
id: tactic-graph-auto-merge-behind-arm-drift-observations
kind: tactic
statement: "Observation carrier, no plan, do not dispatch: two immaterial drift
  observations from the 2026-08-20 /align-tactics per-node round on
  tactic-graph-auto-merge-behind-arm-out-of-band — the up-to-date-gate doctrine
  records nothing for compare status `behind` (only the stale-base `diverged`
  case), and graph-auto-merge's shipped comment claims an absorption by
  reconcile-graph-merged that is conditional on a GitHub PR-state transition
  nobody has measured"
owner: human
status: delegated
parent: null
rationale: "Minted 2026-08-20 by the /align-tactics per-node round on
  tactic-graph-auto-merge-behind-arm-out-of-band. That round's Side-B drift
  review surfaced two premises, both judged immaterial (neither gated the plan;
  drift.proceed stayed true and no park was written). Immaterial observations
  may not be written as clarifications on the serving strategy:
  strategy-graph-native-dispatch clarification 118 permitted that and was
  OVERTURNED 2026-08-15 by violation V1 of the autonomous-substance invariant,
  which routes them to a born-parked observation node instead. The reasons are
  that clarifications is an allowlist member of strategyFingerprint, so an
  autonomous write there soft-freezes every open child of the strategy over
  something defined as gating nothing; that clarifications is a
  requirement-entry surface reserved to the /align interview; and that a
  model-authored dated clarification is byte-indistinguishable from an
  author-ruled one, collapsing provenance in the field that carries doctrine. A
  tactic-target session additionally never touches the serving strategy's
  frontmatter at all. This node is that destination. It carries no plan and must
  never be dispatched. A human promotes whichever entries are worth it into real
  clarifications at office hours and drops the rest."
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
  reason: "Born parked as an observation carrier — there is no plan here and
    nothing to dispatch. It exists because the 2026-08-20 /align-tactics
    per-node round on tactic-graph-auto-merge-behind-arm-out-of-band produced
    two immaterial Side-B drift observations with no other legal destination: an
    autonomous session may not write clarifications onto a serving strategy
    (strategy-graph-native-dispatch clarification 118, OVERTURNED 2026-08-15 by
    violation V1), and a tactic-target session never edits the serving
    strategy's frontmatter. Observation 1: the recorded up-to-date-gate doctrine
    (clarification 83) covers only the stale-base case GitHub reports as
    `diverged`, and records nothing for `behind` — a head already an ancestor of
    main because its commits landed out of band — which is the corner the
    finalized plan operates in. Observation 2: graph-auto-merge's in-arm comment
    asserts reconcile-graph-merged absorbs the already-merged case on a later
    tick, but that reconciler admits only CLOSED|MERGED and no-ops on OPEN, so
    the absorption is contingent on GitHub itself transitioning the PR out of
    OPEN — a behaviour this round did NOT measure. Neither gated the plan; both
    are recorded in full in this node's body. The finalized node needs no park."
  since: 2026-08-20
  recommendation: >-
    Read the two observations in the body and give each ONE of three
    dispositions — drop, clarify-only, or mechanize — then resolve this node. It
    is a carrier: once each entry is dispositioned there is nothing left to keep
    it open.


    Suggested dispositions, for the author to accept or override:


    Observation 1 (the doctrine records `diverged` but not `behind`) —
    CLARIFY-ONLY is the likely read: the finalized plan now names the `behind`
    case explicitly in the script and its stdout protocol, so the code says it
    even if the strategy record does not. Promote it to a real clarification
    only if you want the merge-admission doctrine to be complete on its own
    terms. Do not MECHANIZE — there is nothing to enforce.


    Observation 2 (the absorption claim is contingent and unmeasured) —
    MECHANIZE is defensible IF anyone later takes up the greenfield half named
    in the finalized plan (widening reconcile-graph-merged to admit an
    ancestor-of-main head): that work must first measure whether GitHub reliably
    transitions such a PR out of OPEN, rather than inheriting the comment's
    claim. Until then CLARIFY-ONLY is enough — the finalized plan already
    deletes the false comment. Do not DROP: the claim is load-bearing wherever
    someone reasons that this state self-resolves.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
## What this node is

An **observation carrier**. It holds two immaterial drift observations produced
by the 2026-08-20 `/align-tactics` per-node round that finalized
`tactic-graph-auto-merge-behind-arm-out-of-band`. There is no plan here, no
unit of work, and nothing for a phase worker to do.

**Do not dispatch it.** It is born parked (`owner: human`, `status: delegated`,
`phase: null`) and resolves at office hours, when a human gives each observation
one of three dispositions — **drop**, **clarify-only**, or **mechanize** — and
then resolves the node.

Why the observations live here rather than on the serving strategy:
`strategy-graph-native-dispatch` clarification 118 once permitted an autonomous
per-node session to append `clarifications` to its serving strategy, and was
**OVERTURNED 2026-08-15** by violation V1 of the autonomous-substance invariant
(clarification 245). `clarifications` is an allowlist member of
`strategyFingerprint`, so an autonomous write there soft-freezes every open child
of the strategy over something defined as gating nothing; it is a
requirement-entry surface reserved to the `/align` interview; and a
model-authored dated clarification is byte-indistinguishable from an
author-ruled one. Separately, a tactic-target `/align-tactics` session never
touches the serving strategy's frontmatter at all.

Neither observation gated the round. `drift.proceed` stayed true, no park was
written, and the target node was finalized to `phase: implement` in the same
landing as this carrier.

## Observation 1 — the up-to-date-gate doctrine records `diverged`, not `behind`

`strategy-graph-native-dispatch` clarification 83 (2026-07-19) is the recorded
origin of the up-to-date gate. It resolves the **stale-base** case: a PR whose
green CI ran on a base main has since moved past, which GitHub's compare
endpoint reports as `diverged`. Its remediation — `gh api update-branch`, skip
this tick, merge on a later tick once checks pass on the fresh base — is written
for exactly that condition.

It records **nothing** for the distinct compare status `behind`, where the PR
head is already an *ancestor* of the main tip because its commits landed out of
band.

Measured this round against the shipped code at `origin/main` f114df8c:
`graph-auto-merge` grouped `behind` with `diverged` into one sync-and-defer arm
(`case "$CMP"`, the `behind|diverged)` pattern), so an unrecorded condition was
being handled as a degenerate case of a recorded one. The finalized plan on
`tactic-graph-auto-merge-behind-arm-out-of-band` splits it into its own arm and
names it in the script's normative stdout-protocol header — so the code will
state the distinction even though the strategy record does not.

**Why it is immaterial.** The target node's own statement and rationale already
carried the author's framing of what was open, so the plan did not depend on a
strategy premise the author had not supplied. This changes nothing about the
single merge-admission decision of clarification 198 (extended by 225).

**Generalizable form worth a human's eye:** a doctrine entry written for one
value of a multi-valued sensor silently becomes the doctrine for every value the
code groups with it. The grouping is in the script; the record only names one
member.

## Observation 2 — the absorption claim is conditional, and its condition is unmeasured

`graph-auto-merge`'s in-arm comment asserted that `reconcile-graph-merged`
"absorbs the genuinely-already-merged case on a later tick", and the target
node's filed rationale leaned on that assertion to justify scoping the issue as
low severity.

Verified this round: `reconcile-graph-merged`'s PR-state case admits only
`CLOSED|MERGED` and treats `OPEN` as an explicit no-op
(`reconcile-graph-merged:176-190`), keyed purely on PR state and never on
compare status. So the absorption depends **entirely** on GitHub itself
transitioning the out-of-band-landed PR out of `OPEN`.

While such a PR stays `OPEN`, no sweep in the fleet acts on it:

- `graph-auto-merge` either skips it silently at the mergeable gate or routes it
  into the sync arm (which of the two is itself unresolved — see the target
  node's plan);
- `reconcile-graph-merged` declines it as `OPEN`;
- `reconcile-graph-review-stall` sees a healthy green pending-merge candidate
  (its header, `:23-36`).

**Whether GitHub reliably auto-closes a PR whose head SHA becomes reachable from
main was NOT measured this round.** It is plausible and widely assumed; it is
not established here, and no fixture or recorded production observation exists.

**Why it is immaterial.** The observability decision the target node makes is
correct under either reading — a named stdout line is right whether or not the
state self-resolves — so no branch of the plan turned on it. The finalized plan
also deletes the false comment.

**Where it becomes material:** any later work that routes `behind` toward
terminal *resolution* — in particular the greenfield half named in the target
node's plan, widening `reconcile-graph-merged`'s landed predicate to admit a head
that is an ancestor of `origin/main` — must **measure** that GitHub transition
first rather than inheriting the comment's claim.

**Generalizable form worth a human's eye:** a code comment asserting that some
other component "handles it later" is a claim about that component's admission
predicate, and it decays silently when that predicate is narrower than the
comment's author believed. Nothing tests a cross-script hand-off that is only
described in prose.

## Provenance

- Round: `/align-tactics tactic-graph-auto-merge-behind-arm-out-of-band`,
  2026-08-20, tactic mode, against `origin/main` f114df8c.
- Serving strategy: `strategy-graph-native-dispatch` (read-only context for that
  round; unedited by it).
- Drift verdict: `proceed: true`, no failed Side-A conditions, no parks, two
  Side-B premises both `material: false` / `plan_depends: false`.
