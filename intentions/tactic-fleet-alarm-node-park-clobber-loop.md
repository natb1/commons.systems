---
id: tactic-fleet-alarm-node-park-clobber-loop
kind: tactic
statement: tactic-fleet-alarm-* nodes are wrongly selectable for /align-tactics,
  and any park landed on one is silently wiped by the next mechanical re-mint
owner: ai
status: raw
parent: null
rationale: Discovered 2026-08-04 during an /align-tactics
  tactic-fleet-alarm-unclaimed-hold session (both by this session's own repo
  reads and independently by that Workflow round's drift-review agent). Not
  auto-created by dispatch-fleet-alarm -- a session-authored finding, landed as
  its own tracked node per this repo's sole-tracker-recording convention (real
  defects land as a tactic, never left in a transcript).
reading: null
gap: null
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
  reason: "packages/intentionsutil/src/router.ts:540-556 emits every
    phase-null/draft tactic with office_hours null and complete blockers as an
    /align-tactics candidate, with no exclusion for the
    tactic-fleet-alarm-<kind> id family -- so a fleet-alarm node (mechanically
    minted/resolved only by dispatch-fleet-alarm, per its own recorded contract
    at intentions/tactic-unclaimed-hold-alerting.md:766-767,799-800 that it must
    remain 'a plain unparked draft tactic, never an office_hours park') gets
    routed into ordinary align-tactics decomposition like any author-authored
    draft. Worse:
    .claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:316-325's
    classify() treats ANY node with office_hours !== null as 'closed' (a
    since-resolved record), and its absent|closed mint branch (line 618)
    unconditionally overwrites the node from a fixed raw template with
    office_hours: null -- so a park landed by an align-tactics session is
    indistinguishable from a resolved alarm and is silently discarded the next
    time dispatch-fleet-watch re-detects the still-live condition. This already
    happened for real: commit 894e653a landed a fully-reasoned office_hours park
    on tactic-fleet-alarm-unclaimed-hold (its text: 'this park breaks that loop
    by removing the node from the router's draft-tactic candidate pool'), and
    the very next mint, commit 7ff0962d (2026-08-04 10:10, ~30min later),
    silently deleted it (35 lines removed, office_hours reset to null),
    returning the node to the candidate pool. `git log --oneline --
    intentions/tactic-fleet-alarm-unclaimed-hold.md` (30 commits total) shows
    this same mint/park cycle repeating roughly 14 times, and 14 of those park
    commits record a worker session that froze at a permission/classifier denial
    and had to be swept by the dispatch-tick frozen-session sweep (never reached
    its own Stop hook to park itself) -- consistent with an unattended
    align-tactics worker hitting a sandbox permission prompt (e.g.
    dangerouslyDisableSandbox, needed for provision-node-worktree's tsx IPC pipe
    under sandbox) with no human present to approve it. This is a live,
    recurring resource drain: every dispatch-tick that selects a fleet-alarm
    node burns a worker session that likely freezes, and even a session that
    completes correctly (declines to write) gains nothing durable because the
    node is re-selected on the very next tick."
  since: 2026-08-04
  recommendation: "Author must ratify one of two fixes (mutually exclusive, either
    resolves this): (a) exclude the tactic-fleet-alarm-<kind> id family (or a
    general mechanically-managed marker, e.g. a dedicated attributes flag) from
    router.ts:540-556's draft/raw candidate emission, so these nodes are never
    selected for /align-tactics at all -- matching the already-recorded contract
    that --resolve is their only terminal; or (b) make
    dispatch-fleet-alarm:316-325's classify() park-aware -- a node with
    office_hours !== null but NOT phase:done should not be treated as
    'closed'/re-mintable, so a legitimate park (once the wrongly-selectable
    problem in (a) is why one gets written in the first place) would survive
    re-detection instead of being silently wiped. (a) is likely sufficient on
    its own and removes the freeze-loop entirely; (b) is a defense-in-depth
    hardening of the mint writer regardless. Recommend: fix (a) first (add the
    exclusion to router.ts's frozen-tactic candidate loop, with a regression
    test asserting a tactic-fleet-alarm-* node is never emitted as an
    align-tactics candidate), then separately evaluate whether (b) is still
    worth doing. Once fixed, verify by confirming
    tactic-fleet-alarm-unclaimed-hold and tactic-fleet-alarm-busy-stall no
    longer appear in selectGraphTargets' candidate list, and that no new 'worker
    session froze' park commits accumulate on any tactic-fleet-alarm-*.md file
    going forward."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-fleet-alarm-* nodes are wrongly selectable for /align-tactics, and any park landed on one is silently wiped by the next mechanical re-mint

## Context

Landed by an `/align-tactics tactic-fleet-alarm-unclaimed-hold` session on 2026-08-04 after that node's own `align-tactics` round determined the target could not be finalized or parked without violating a recorded contract, and traced why: the graph selector has no concept of "mechanically-managed" tactic nodes, so `tactic-fleet-alarm-*` — a family intended to be minted and resolved only by `dispatch-fleet-alarm` — is treated exactly like an author-authored draft. This node exists so that finding survives past this session's transcript.

## Reason

See `office_hours.reason` above for the full evidence chain: the selector's candidate emission (`router.ts:540-556`), the alarm writer's closed-detection (`dispatch-fleet-alarm:316-325`) and unconditional mint-fresh overwrite (`dispatch-fleet-alarm:618`), the concrete clobbered-park commit pair (`894e653a` → `7ff0962d`), and the git history of `intentions/tactic-fleet-alarm-unclaimed-hold.md` showing ~14 repeats of the mint/park-attempt/clobber cycle, 14 of which ended in a frozen worker session rather than a clean disposition.

## How to resolve

See `office_hours.recommendation` above. In short: exclude the `tactic-fleet-alarm-<kind>` id family from `router.ts`'s frozen-tactic candidate loop (fix a), optionally hardening `dispatch-fleet-alarm`'s `classify()` to be park-aware as defense in depth (fix b). This is itself PR-sized work for a future `/align-tactics tactic-fleet-alarm-node-park-clobber-loop` round once an author has picked a direction — this node deliberately stops at diagnosis, since the choice between (a) and (b) is a design decision, not a mechanical one.
