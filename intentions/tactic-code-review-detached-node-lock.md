---
id: tactic-code-review-detached-node-lock
kind: tactic
statement: Lock the node for the detached /code-review run's own lifetime,
  independently of the launching session — a kernel-released flock held by the
  detached child, honored by every worktree-claim path, so a survivor that
  outlives its session cannot have another worker spawned into the tree it is
  still writing
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-13 in the /align round that raised the review
  lane's built-in /code-review from `low` to `high` (strategy-token-economy,
  2026-08-13 clarifications). Raising the effort makes the run outlive its await
  window as a normal outcome rather than a pathological one, and the author
  ruled that the run is never killed and that the node stays locked for the
  run's whole lifetime even if the session that launched it is removed. Nothing
  today provides that. The sibling carrier
  tactic-review-effort-max-detached-resume-poll has a `$CACHE_KEY.lock` mkdir
  mutex, but it guards the RESUME CACHE, not the worktree — grep confirms that
  node carries no occupancy, reservation-sweep or worktree_has_live_session
  content at all. And the ordinary worktree-is-the-claim invariant does not
  cover this case: code-review-invocation.md section 6 measured that the nested
  `claude -p` session does not appear in the registered session view, and a
  supervising session can die for reasons unrelated to the review (a
  frozen-session park, an API error, `claude rm`, a host restart) while its
  child runs on. The failure that follows is a worker spawning into a worktree
  an active `--fix` run is still writing, which corrupts both trees and —
  because dispatch-code-review derives what /code-review actually changed as
  `git diff <before-image>` at completion — makes the run attribute unrelated
  changes to the instrument, breaching condition 6 with a mechanically-derived
  claim that is confidently wrong. Serves both strategies by the artifact-owner
  rule: the effort/review-lane doctrine is strategy-token-economy's, the
  worktree-claim machinery is strategy-graph-native-dispatch's. The effort raise
  must not ship without this — a survivor with no lock is the corruption case."
reading: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: review-lane-code-review-high-detached
  pr: 3078
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    SCOPE ALREADY LANDED IN FULL — this node is a completion record, not a
    draft.

    Parked by the 2026-08-19 /align-tactics per-node run (disposition: no plan

    authored, no phase written). Every bullet of the node's own "What shipped

    (PR #3078)" section was verified present at origin/main, not taken from the

    body's word:


    - Sidecar lock path + suffix: `WORKTREE_CODE_REVIEW_LOCK_SUFFIX` and
      `worktree_code_review_lock_path()` at
      .claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1066-1083,
      deriving `<worktrees-root>/<basename>.code-review-lock` beside the worktree.
    - Lock probed BEFORE the daemon query, with all three reader states as
      described: held -> `live` (lib-claude-agents.sh:1213-1222, reason
      `code-review-lock`), missing `flock` with the file present -> `unknown`
      (:1194-1206), stale file -> falls through unchanged and is never deleted
      (:1224-1226, with the delete-races-a-launcher rationale inline).
    - Kernel-held detached launch: `setsid` + `flock` wrapper at
      dispatch-code-review:1089-1099; `setsid` availability is a hard precondition
      (:369-370) and a missing `flock` inside a dispatch worktree is a hard refusal,
      not a quiet unlocked run (:421-422).
    - New exit 6 on the launcher (dispatch-code-review:1131-1139), and
      review-fix/SKILL.md:715 states exit 6 is not a retryable in-flight state.

    Landed in merge commit fbb9be83 ("review lane: raise the built-in
    /code-review

    to high, detached, node-locked (#3078)", 2026-08-13), confirmed an ancestor
    of

    HEAD. `git log -S worktree_code_review_lock_path` over lib-claude-agents.sh

    returns that commit and no other.


    The carrier was the SIBLING node:
    tactic-review-effort-max-detached-resume-poll

    is `status: codified`, `phase: done`, `execution.pr: 3078`, with a full

    `execution.completion` block (mergedAt 2026-08-13T14:14:07Z, mergeCommitSha

    fbb9be83). This node still reads `status: raw`, `phase: null`, with
    `execution`

    half-stamped — `branch: review-lane-code-review-high-detached` and `pr:
    3078`

    are set, but `completion: null` and `strategy_fingerprint: null`. So the
    record

    already points at the carrying PR while the phase/status fields say the work
    was

    never dispatched, which is why the router keeps re-selecting it:

    check-node-selection returns exit 0 (phase-absent is a legitimate finalize

    candidate) and /align-tactics would otherwise author a plan for merged work.


    NO RESIDUAL DEFECT FOUND. The body's central design claim — that teaching
    the

    one `worktree_occupancy_state` predicate gives every claim path the
    property,

    rather than the four separate insertion points the node's own `rationale`

    proposed — was re-verified rather than assumed: 40 files under .claude/ and

    packages/ call `worktree_has_live_session`/`worktree_occupancy_state`,
    including

    every path the rationale named except `provision-node-worktree`, which does
    not

    consult it directly by design — its caller gates first

    (dispatch-graph-execute:299 names graph-select-target's

    `worktree_has_live_session` check as the upstream gate, and

    provision-node-worktree:96 records that the gate is the caller's, not new
    here).

    The two acknowledged limits in the body (advisory `flock` does not bind a
    human

    entering the worktree by hand; the acquire is gated on the tree sitting
    under a

    `.claude/worktrees` root) are stated design bounds, not open gaps.


    Both serving-strategy citations in the body check out and need no
    correction:

    strategy-token-economy condition 9 (2026-08-13) is the never-killed /

    node-stays-locked-for-the-detached-run's-lifetime condition, and condition 6
    is

    the verified-instrument-attribution condition the body names as the one a

    corrupted `git diff <before-image>` would breach.


    TWO DISPOSITIONS, BOTH AUTHOR CALLS — the graph records no convention for a

    draft whose whole substance shipped under a sibling carrier:

    (a) Stamp `execution.completion` against PR #3078 (the sibling's block is
    the
        template: mergedAt 2026-08-13T14:14:07Z, mergeCommitSha fbb9be83) and
        transition `status: raw`/`phase: null` -> `codified`/`done`. This is a phase
        write against work this node never dispatched, and /align-tactics lands only
        `phase: implement`, so it is not this lane's write to make.
    (b) Re-scope the node to a genuine residual. This run found none, so (b)
    would
        substitute new scope for author-ratified scope.
    Pruning is the wrong third option: it would discard the design record in the

    body — specifically the "one insertion point, not four" finding and the

    rationale-vs-shipped divergence it documents — which is the only place that

    reasoning is written down.


    Identical in shape to tactic-audit-permission-friction, parked 2026-08-18

    (9ced5777) for the same reason and still awaiting the same ruling; deciding

    these two together would establish the convention once.
  since: 2026-08-19
  recommendation: >-
    Take disposition (a): this node is a completion record and the cheapest
    correct

    close is to finish the record. Stamp `execution.completion` with PR #3078's

    merge facts (mergedAt 2026-08-13T14:14:07Z, mergeCommitSha

    fbb9be83c73af02da0eb6920c387f5c29bcd4a3d, graphCommitSha null — copy the
    shape

    from tactic-review-effort-max-detached-resume-poll) and move `status: raw`
    ->

    `codified`, `phase: null` -> `done`. Mechanism: dump-node.ts, jq-patch the

    frontmatter, write-node.ts, land via graph-commit -C <repo-root> — the phase

    ladder has no null->done transition, so transition-node cannot do it. Rule
    on

    tactic-audit-permission-friction (parked 9ced5777) in the same sitting and

    record the outcome as a clarification on strategy-graph-native-dispatch, so
    the

    next draft-shipped-under-a-sibling-carrier node is dispositioned
    mechanically

    instead of parking a third time. Do NOT re-scope and do NOT prune: this run

    verified the shipped design against origin/main bullet by bullet and found
    no

    residual, and the body carries the only written record of the

    one-insertion-point-not-four design finding.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Lock the node for the detached /code-review run's own lifetime, independently of the launching session

## Context

`strategy-token-economy` condition 9 (2026-08-13 /align round) requires that
an overrunning `/code-review` run is never killed, and that the node stays
locked for the detached run's own lifetime independently of whether the
launching session survives. Nothing in the repo's claim invariant provided
that: worktree-is-the-claim is keyed on the REGISTERED session, and the
nested `claude -p` session never appears in that view at all
(`code-review-invocation.md` §6). The launching session can die for reasons
that have nothing to do with the review — a frozen-session park, an API
error, `claude rm`, a host restart — while its child keeps writing. What
follows is a worker spawning into a worktree an active `--fix` run is still
writing: both trees corrupt, and the sibling node's Step 6 mechanical
`git diff <before-image>` attributes the intruder's changes to the review,
breaching condition 6 with a derivation that is confidently wrong. Not
hypothetical: the sibling carrier node
(`tactic-review-effort-max-detached-resume-poll`) was itself parked
office_hours for exactly that failure mode before this round.

## Design finding — one insertion point, not four

This node's own `rationale` originally proposed teaching the lock separately
to `provision-node-worktree`, the reservation sweep, the invalid-state lane
and office-hours select. **Shipped design diverges from that.** Every claim
path already routes through one predicate: `worktree_has_live_session` is a
thin wrapper over `worktree_occupancy_state` (`lib-claude-agents.sh`), whose
`free`/`live`/`terminal`/`unknown` vocabulary already has the right shape to
carry a fifth fact. Teaching that ONE function gives every caller the
property at once, with no call-site enumeration to drift — the four separate
call sites the rationale named would each need their own edit, and any
future new call site would need to remember to add a fifth.

## What shipped (PR #3078)

- **Sidecar lock file**, not a lock inside the worktree:
  `<worktrees-root>/<worktree-basename>.code-review-lock`, beside the
  worktree, following the existing `.scope-fingerprint` / `.ladder`
  convention. Inside the worktree would be wrong twice over — it is the
  reviewed (so attacker-writable) tree, and it would be swept away with the
  worktree itself.
- **Kernel-held, not bookkeeping-held.** The detached child runs under
  `setsid flock -n <sidecar> <child>`. The KERNEL holds the lock for exactly
  the child's lifetime and releases it on any death — clean exit, SIGKILL, or
  a host crash — which is the property no pid-plus-timestamp sidecar or
  heartbeat process can have on its own (a pid-plus-timestamp file needs
  staleness heuristics and carries a pid-reuse window; a heartbeat needs a
  second process that can itself die; a graph-layer lock needs a reaper and
  would strand a node forever when the child dies, besides putting runtime
  machinery in the graph that condition 4 keeps out).
- **Reader states.** `worktree_occupancy_state` probes the lock BEFORE it
  queries the daemon. A held lock returns `live`. A **stale** lock file (the
  child died holding no live flock) falls through **unchanged and is never
  deleted** — deletion would race a launcher taking the lock at that instant.
  A **missing `flock` binary** with the lock file present returns `unknown`,
  which every caller folds toward occupied rather than free.
- **Taken only inside a dispatch worktree.** The lock acquire is gated on the
  reviewed tree's parent directory being a `.claude/worktrees` root — a test
  suite's throwaway repo or a hand-run review in a plain clone has no
  dispatch claim to protect and no worktrees root for a sidecar, so the run
  proceeds unlocked there. That is an explicit, tested condition on the path
  shape, not a swallowed error: a missing `flock` while the condition DOES
  hold is a hard `exit 2`, never a quiet unlocked run.
- **Advisory, not enforced against every actor.** `flock` binds only claimers
  that check it. Enforcement rests on the claim paths being few and
  enumerable (now: the one `worktree_occupancy_state` predicate every one of
  them already calls) — a human entering the worktree by hand bypasses it
  exactly as today, unchanged by this node.
- **New exit 6** on the launching script (`dispatch-code-review`): the lock
  is already held by a different detached run — nothing was launched, no
  review ran. `review-fix/SKILL.md`'s Step 1b treats exit 6 as **not**
  retryable — looping on it would burn attempts waiting on a run this session
  does not own and cannot collect.

Implemented as part of `tactic-review-effort-max-detached-resume-poll`'s
Unit 2 (the `dispatch-code-review` launch path) and `lib-claude-agents.sh`'s
`worktree_occupancy_state` / `worktree_code_review_lock_path`, landed
together in PR #3078 — the effort raise ships with the lock in the same PR,
per condition 9's requirement that a survivor with no lock is the corruption
case.

## Verification (as landed)

Covered by the sibling node's suites: `test-dispatch-code-review.sh`
(115/115) and `test-lib-claude-agents.sh` (266/266), both run via CI's
`RUN_PR_SCRIPTS` path. `flock` and `setsid` availability was measured present
at a fixed `util-linux` Nix store path (`code-review-invocation.md` §9.2)
before this node's design was built on it.
