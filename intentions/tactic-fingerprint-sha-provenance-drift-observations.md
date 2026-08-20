---
id: tactic-fingerprint-sha-provenance-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-fingerprint-stamp-sha-provenance: five immaterial drift
  observations with no legal autonomous destination — the sha off-by-one is not
  systemic, that node's sequencing note misstates its own mechanism, two of this
  strategy's clarifications carry drifted line anchors, and two recorded
  conditions (the PR-title CI guard, the dispatch.config pause field) describe
  mechanisms that are not armed in code"
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
  reason: "Observation carrier, not planned work — five immaterial drift
    observations from the 2026-08-20 /align-tactics tactic-mode round on
    tactic-fingerprint-stamp-sha-provenance. All five are plan_depends: false
    (none of them is why that node parked), and none may be written to the
    serving strategy's clarifications by an autonomous lane (clarification 245 /
    violation V1, which overturned clarification 118); a tactic-target session
    never touches the serving strategy's frontmatter at all, so this born-parked
    node is their destination. (1) THE OFF-BY-ONE IS NOT SYSTEMIC, contrary to
    tactic-fingerprint-stamp-sha-provenance's own rationale. On origin/main the
    only recipe that captures a strategy-stamp sha is the prose one in
    .claude/skills/align-tactics/references/write-path.md (`git rev-parse
    origin/main`), duplicated twice in references/tactic-target.md, and it is
    wrong only because that same round's commit edits the strategy — so the
    captured base does not contain the substance the hash covers.
    transition-node writes no strategy stamp today (its only fingerprint sites
    are the SCOPE stamp and a freeze message), and apply-node-transition.ts's
    --strategy-fingerprint/--strategy-sha pair has no runtime caller — the only
    occurrences outside the script are its own tests and prose. For a
    router-path stamp the pre-push rev-parse is CORRECT provenance, because that
    commit does not edit the strategy. The generalizable form: a defect recorded
    as 'systemic' on the strength of a documented flag pair can be prose-only,
    because a CLI contract with no runtime caller reads exactly like a live
    writer to a grep. (2) THAT NODE'S SEQUENCING NOTE MISSTATES ITS OWN
    MECHANISM. Its '### Sequence after
    tactic-strategy-fingerprint-stamp-coverage' section justifies the ordering
    by 'both fixes land in the same transition-node lines' and calls the two
    defects 'genuinely independent'. Verified against the sibling branch this
    session: transition-node contains no strategy-stamp write at all today; the
    sibling ADDS one (+44 lines) together with lib-strategy-stamp.ts, a
    rewritten write-node.ts (+118) and apply-node-transition.ts (+50), a new
    strategy-stamp-census.ts, and a 237-line doctrine suite. The two nodes are
    therefore NOT independent: the sibling builds and test-pins the very {hash,
    sha} contract the other proposes to delete. The ordering conclusion survives
    and in fact strengthens; the recorded reason does not. Both this and (1) are
    already corrected on that node's own record this round — recorded here only
    for the generalizable form. (3) TWO CLARIFICATION LINE ANCHORS HAVE DRIFTED,
    substance unchanged: clarification 119 cites
    packages/intentionsutil/src/router.ts:80 for strategyFingerprint (now :103)
    and clarification 220 cites packages/intentionsutil/src/transitions.ts:365
    for isFingerprintStale (now :501). Both functions still exist with matching
    behaviour and the measurements those clarifications report are unaffected;
    only the anchors moved. (4) THE PR-TITLE CI GUARD IS NOT ARMED. The PR-title
    condition states that 'a CI guard rejects a title that is non-conforming or
    whose id does not resolve'. No workflow under .github/workflows/ carries a
    title check, .github/scripts/ contains no title checker, and
    dispatch-open-pr passes --title verbatim into `gh pr create` with no format
    validation — the one example invocation in .claude/skills/implement/SKILL.md
    does not even use the `<node id>: <short description>` form. The
    implementing node tactic-pr-title-node-id-convention is status raw, phase
    null. The condition reads as doctrine binding openers going forward rather
    than as an enforced mechanical fact — the same not-yet-armed posture the
    maintenance-burden-band and pace-exempt conditions state explicitly about
    themselves. (5) THE PAUSE-FIELD AMENDMENT IS AHEAD OF THE CODE. The
    paused-scheduling condition's 2026-07-26 amendment names a
    dispatch.config/*.json boolean field as 'the sole mechanism' replacing the
    pause sentinel, phrased as accomplished. The sentinel is still live:
    .claude/skills/dispatch-propagate/scripts/lib-pause-state.sh keys its
    tri-state on DISPATCH_PAUSE_FLAG
    (${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused), and no
    dispatch.config path is tracked in git. The migrating node
    tactic-dispatch-pause-config-field is phase implement, not done. Because the
    amendment says every clause carries over to the field unchanged, the
    condition's substance still holds of the sentinel — only its 'is replaced
    by' tense is ahead of the code. Observations (4) and (5) are orthogonal to
    the node under review and were recorded, not acted on."
  since: 2026-08-20
  recommendation: "Read this at office hours and pick one disposition per
    observation; nothing here is dispatchable as written and this node must
    never be sent to a phase worker. Suggested per item — (1) DROP or
    GENERALIZE: the 'not systemic' correction is already landed on
    tactic-fingerprint-stamp-sha-provenance's rationale and body this round, so
    nothing is owed unless you want the general lesson recorded — that a
    documented CLI flag pair with no runtime caller reads as a live writer to a
    grep, so a 'systemic' claim should be backed by a caller census, not a flag
    census. (2) DROP: also already corrected on that node this round. Worth a
    clarification only if you want the standing rule stated — that a sequencing
    note must name the file state at the time of writing, since 'the same lines'
    is false whenever the blocking sibling is the one that creates those lines.
    (3) MECHANIZE OR IGNORE: two stale path:line anchors inside clarification
    prose, substance unaffected. There is no anchor linter for clarification
    text today; either accept the rot (anchors in dated clarifications are
    provenance, not instructions) or record that clarifications should cite
    symbols rather than line numbers. Cheapest correct action is nothing. (4)
    RECONCILE THE CONDITION or ARM THE GUARD: the PR-title condition asserts an
    enforced CI guard that does not exist. Either amend it to carry the same
    explicit not-yet-armed caveat its two sibling conditions carry, or finalize
    tactic-pr-title-node-id-convention (status raw, phase null) so the guard
    actually lands. Leaving it as-is means the condition reads FALSE to any
    future clause-coverage sweep, which will keep re-surfacing it. (5) RECONCILE
    THE TENSE: amend the paused-scheduling condition so it says the field
    REPLACES the sentinel once tactic-dispatch-pause-config-field lands, rather
    than that it already has — or land that node. Same re-surfacing problem as
    (4). A per-node tactic-target session cannot write the strategy's conditions
    or clarifications, which is why (3), (4) and (5) are owed to you rather than
    done here."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — 2026-08-20 /align-tactics drift sweep on tactic-fingerprint-stamp-sha-provenance

## What this node is

This is an **observation carrier**, not planned work. It has no units, no scope
and no verification, and it must **never** be dispatched to a phase worker. It
exists because the 2026-08-20 `/align-tactics` tactic-mode round on
`tactic-fingerprint-stamp-sha-provenance` surfaced five immaterial drift
observations, and an autonomous lane has nowhere legal to put them: strategy
clarification 245 (violation V1, which overturned clarification 118) forbids an
autonomous lane writing durable-layer substance, and a tactic-target session
never touches the serving strategy's frontmatter at all. All five are
`plan_depends: false` — none of them is why that node parked. The park itself
(requirement ambiguity over keeping vs deleting the `sha` field) lives on that
node's own `office_hours`.

`office_hours.reason` above carries each observation in full and
`office_hours.recommendation` carries a suggested disposition for each. This
body records what a reader needs beyond those: which observations are already
discharged, and which are genuinely owed.

## Already discharged on the reviewed node this round — recorded here only for the generalizable form

**Observation 1 — the off-by-one is not systemic.** The node's rationale claimed
it was. It is confined to the align-round hand-stamp path, where the round's own
commit edits the strategy after the base sha is captured. `transition-node`
writes no strategy stamp on `origin/main`, and `apply-node-transition.ts`'s
`--strategy-fingerprint` / `--strategy-sha` pair has no runtime caller. The
rationale and body are corrected on that node this round, so **nothing is owed
here** unless the general lesson is worth recording: *a documented CLI flag pair
with no runtime caller reads exactly like a live writer to a grep, so a
"systemic" claim should rest on a caller census rather than a flag census.*

**Observation 2 — the sequencing note misstates its own mechanism.** That node's
`### Sequence after` section justified its ordering advice by "both fixes land in
the same `transition-node` lines" and called the two defects "genuinely
independent". Neither holds: `transition-node` has no strategy-stamp write today,
the sibling `tactic-strategy-fingerprint-stamp-coverage` adds one, and that
sibling builds and test-pins the very `{hash, sha}` contract the other node
proposes to delete. The ordering conclusion survives and strengthens. Corrected
on that node this round, so again **nothing is owed** beyond the general form:
*a sequencing note must name the file state at the time of writing, since "the
same lines" is false whenever the blocking sibling is the node that creates those
lines.*

## Genuinely owed to the author — a per-node session cannot write the strategy

**Observation 3 — two clarification line anchors have drifted.** Clarification
119 cites `packages/intentionsutil/src/router.ts:80` for `strategyFingerprint`
(now `:103`); clarification 220 cites
`packages/intentionsutil/src/transitions.ts:365` for `isFingerprintStale` (now
`:501`). Both functions exist with matching behaviour and the measurements those
clarifications report are unaffected — only the anchors moved. There is no anchor
linter for clarification prose today. The cheapest correct action is **nothing**:
anchors inside a dated clarification are provenance, not instructions. The
alternative worth considering is a standing note that clarifications cite symbols
rather than line numbers.

**Observation 4 — the PR-title CI guard is not armed.** The PR-title condition
asserts that "a CI guard rejects a title that is non-conforming or whose id does
not resolve". No workflow under `.github/workflows/` carries a title check,
`.github/scripts/` contains no title checker, and `dispatch-open-pr` passes
`--title` verbatim into `gh pr create` with no format validation — the one
example invocation in `.claude/skills/implement/SKILL.md` does not even use the
`<node id>: <short description>` form. The implementing node
`tactic-pr-title-node-id-convention` is `status: raw`, `phase: null`. Two
dispositions: amend the condition to carry the same explicit not-yet-armed caveat
its maintenance-burden-band and pace-exempt siblings already carry, or finalize
that node so the guard lands. Leaving it as written means the condition reads
FALSE to every future clause-coverage sweep and keeps re-surfacing.

**Observation 5 — the pause-field amendment is ahead of the code.** The
paused-scheduling condition's 2026-07-26 amendment names a
`dispatch.config/*.json` boolean field as "the sole mechanism" replacing the
pause sentinel, phrased as accomplished. The sentinel is still live:
`.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh` keys its tri-state
on `DISPATCH_PAUSE_FLAG`
(`${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused`), and no
`dispatch.config` path is tracked in git. The migrating node
`tactic-dispatch-pause-config-field` is `phase: implement`, not done. Because the
amendment itself says every clause carries over to the field unchanged, the
condition's **substance** still holds of the sentinel — only its "is replaced by"
tense is ahead of the code. Same disposition shape as observation 4: reconcile
the tense, or land the node. Same re-surfacing problem if left.

Observations 4 and 5 are orthogonal to the node under review and were recorded,
not acted on.

## Provenance

Raised by the drift phase of the `/align-tactics` Workflow
(`.claude/workflows/align-tactics.js`, `mode: "tactic"`) during the 2026-08-20
round on `tactic-fingerprint-stamp-sha-provenance`, and verified on the caller
thread against `origin/main` `9f152203` before landing. That round's disposition
was `escalated`: `drift.proceed` false, one park on the reviewed node, no plan
authored. This carrier landed in the same `graph-commit` as that park.
