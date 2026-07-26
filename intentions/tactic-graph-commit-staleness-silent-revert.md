---
id: tactic-graph-commit-staleness-silent-revert
kind: tactic
statement: "graph-commit's staleness/freshness check
  (id_files_dirty()/check_base_freshness()-equivalent logic) can silently
  discard a genuine dirty edit under heavy concurrent origin/main activity —
  reverting an already-applied office_hours:null clear-park write back to its
  stale parked value during a rebase retry, or reporting 'landed'/exit 0
  success while leaving the edit uncommitted and unpushed on disk"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-26 by a subagent draining office_hours parks
  across multiple graph nodes under heavy concurrent fleet activity (many
  office-hours drain sessions landing to main at once). While working
  tactic-graph-commit-landing-lock's own park, three separate clear-park
  invocations (one background, two foreground, each from a fresh worktree off
  origin/main) either had their office_hours:null write silently reverted
  back to the stale parked value during a rebase retry — evidenced by an
  intermediate commit that correctly nulled office_hours immediately followed
  by another commit reverting it back to the old parked value, with no
  unresolved-conflict/park output ever printed by graph-commit — or reported
  \"graph-commit: landed ... on main\" / exit 0 while leaving the
  office_hours:null edit uncommitted and un-pushed (git status showed a real
  uncommitted diff, git log showed no new commit). Neither shape is the
  layer-2/3 same-field-conflict path (that path prints an explicit park/
  conflict message); both look like the staleness check itself
  misclassifying a real dirty edit as clean. This is filed as a SEPARATE
  tracked node from tactic-graph-commit-landing-lock (whose own office_hours
  block records the same live symptom as a blocker on clearing THAT node's
  specific park) because the defect is systemic — it threatens the
  reliability of the whole office-hours park/clear-park/graph-commit pipeline
  for every node, not just that one. Author-directed 2026-07-26: filed as a
  new tracked bug tactic and boosted to top ranking, explicitly authorizing
  the >=100 raw boost this requires per schema rule 18 (own boost 173 composes
  with the +5 inherited from strategy-graph-native-dispatch to an authored
  178 — above the current live discretionary composed max of 175.33
  (tactic-graph-commit-landing-lock, itself elevated by backward blocked_by
  inheritance from tactic-graph-ref-split's own boost) — and deliberately
  below strategy-main-health's standing 100 boost value itself, though the
  COMPOSED value exceeds 100, hence the required ACK: main-health-dominance
  below)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 173
  override: null
  rationale: "Author-directed 2026-07-26: boost to top ranking, per explicit
    human authorization for a >=100 boost (ACK: main-health-dominance). This
    is the durable fix for a live reliability defect in the sole write path
    to main (graph-commit) — a silent revert or false-success report on a
    clear-park write undermines every office-hours drain across the whole
    fleet, not just one node. Sized at 173 (own claim) so that composed with
    the +5 inherited from strategy-graph-native-dispatch (authored 178) it
    lands just above the current live discretionary composed max of 175.33
    (tactic-graph-commit-landing-lock, elevated via backward blocked_by
    inheritance from tactic-graph-ref-split), making this tactic the top
    discretionary dispatch/office-hours target — and still below
    strategy-main-health's own standing attention.boost of 100 (this node's
    OWN boost value of 173 numerically exceeds that 100, which is why the
    literal ACK substring is required and is deliberately included here per
    the human's explicit authorization in this filing session; the intent is
    not to claim main-health-dominance's role, only to rank above other
    discretionary graph-tooling work while main-health itself is not
    currently parked)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Reproducible graph-commit tooling bug discovered 2026-07-26 while
    draining office_hours parks under heavy concurrent fleet activity:
    clear-park/graph-commit can silently REVERT an already-applied
    office_hours:null write back to the old parked value during a
    rebase-retry under concurrent-write contention (an intermediate commit
    correctly nulls office_hours, immediately followed by another commit
    reverting it), or can report \"graph-commit: landed ... on main\" / exit
    0 success while leaving the office_hours:null edit uncommitted and
    un-pushed on disk (a real uncommitted git diff, no new commit in git
    log). No unresolved-conflict/park output was printed in the no-op cases,
    ruling out the layer-2/3 same-field-conflict path. This is a systemic
    reliability defect in the sole write primitive to main
    (packages/intentionsutil/scripts/graph-commit), affecting every node's
    park/clear-park cycle, not specific to one node. First observed and
    recorded in detail on tactic-graph-commit-landing-lock's own
    office_hours block (since 2026-07-26), which is blocked on clearing its
    own park by this exact defect; this node tracks the systemic fix
    separately from that node-specific block."
  since: "2026-07-26"
  recommendation: "Audit graph-commit's staleness/freshness detection —
    id_files_dirty(), check_base_freshness(), and
    ensure_intentions_only_base() (packages/intentionsutil/scripts/graph-commit)
    — for a race where a legitimate uncommitted working-tree edit is
    discarded (treated as already-clean / already-landed) rather than
    retried or reapplied, specifically under concurrent origin/main
    activity (many writers landing near-simultaneously). Suspected
    mechanism: a rebase retry re-reads or re-derives \"is this id's file
    dirty relative to base\" against a moving base without correctly
    re-anchoring to the edit this specific invocation is trying to land, so
    a real diff gets classified as no-op. Also examine whether the CAS
    --base token mechanism itself has a gap that lets a stale base get
    treated as fresh under rapid concurrent commits (i.e. the token check
    passing when it should have failed and forced a rebase-and-reapply of
    the local edit instead of silently dropping it). Reproduce against a
    real concurrent-writer scenario if possible (the existing
    test-graph-commit.sh harness's bare-origin + multi-clone shape, per
    tactic-graph-commit-landing-lock's Unit 3, is the right harness to
    extend for a deterministic repro — a case where writer A's edit is
    genuinely dirty relative to a base that origin/main raced past during
    A's own rebase retry). Once root-caused, fix the detection so a real
    dirty edit is always either landed or reported as an explicit
    conflict/park — never silently discarded with a false 'landed' message
    or a silent revert. Cross-reference tactic-graph-commit-landing-lock's
    office_hours block (same symptom, recorded independently) when
    diagnosing — clearing that node's park is itself blocked on this
    defect."
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit's staleness check can silently discard a genuine dirty edit under concurrent origin/main activity

## Context

`packages/intentionsutil/scripts/graph-commit` is the sole write primitive
that lands intention-node edits on `main` (see also
`tactic-graph-commit-landing-lock`, which serializes the rebase→stamp→push
critical section, and `tactic-graph-commit-cwd-repo-resolution`, which fixed
a different silent-wrong-repo defect in the same script). This tactic tracks
a third, distinct defect class in the same script: its staleness/freshness
detection.

While draining `office_hours` parks across multiple graph nodes on
2026-07-26, under heavy concurrent fleet activity (many office-hours drain
sessions landing to `main` at once), a subagent working
`tactic-graph-commit-landing-lock`'s own park ran `clear-park` (which invokes
`graph-commit`) three separate times — once backgrounded, twice in the
foreground, each from a fresh worktree checked out at `origin/main` — trying
to write `office_hours: null` on that node. Each attempt failed silently, in
one of two ways:

1. **Silent revert.** The commit history showed an intermediate commit that
   correctly set `office_hours: null`, immediately followed by ANOTHER
   commit that reverted it back to the old, stale parked value — with no
   unresolved-conflict or park message ever printed by `graph-commit`.
2. **False success.** `graph-commit` printed its normal `landed ... on main`
   success message and exited 0, but `git status` on the invoking worktree
   showed a real, uncommitted diff (the `office_hours: null` edit) and
   `git log` showed no new commit — the edit was never actually staged,
   committed, or pushed.

Neither shape matches the script's existing, already-landed layer-2/3
same-field-conflict path (`tactic-graph-commit-auto-serialization`'s merge
ladder), which prints an explicit park/conflict message when it detects a
genuine content conflict on the same field. Both look instead like the
script's own dirty/staleness check misjudging a real, pending local edit as
already clean or already applied.

## Why this is systemic, not node-specific

`tactic-graph-commit-landing-lock`'s own `office_hours` block records this
exact symptom as the reason clearing THAT node's park is currently blocked.
This tactic is filed separately, deliberately, because the defect is not
scoped to that one node: it lives in `graph-commit`'s general staleness
detection, which every `park-node` / `clear-park` / `graph-commit` write on
every node in the graph depends on. Under the kind of heavy concurrent
fleet activity that triggered it here — many office-hours drain sessions
landing near-simultaneously — any node's clear-park write is exposed to the
same silent-revert or false-success failure mode. That makes this a
reliability defect in the sole write path to `main`, not an incident local
to one tactic.

## Suspected root cause

The reporting subagent's diagnosis, not yet independently confirmed: some
staleness/freshness check in `graph-commit` — the `id_files_dirty()` /
`check_base_freshness()` / `ensure_intentions_only_base()` family of
functions — decides whether a given node id has a real pending edit to land.
Under concurrent `origin/main` motion (the base moving mid-rebase-retry),
this check appears to sometimes conclude "nothing to do" even though the
invoking process is holding a genuine, uncommitted diff for that id. Two
candidate failure shapes worth distinguishing during the audit:

- The dirty check re-derives its answer against a freshly-rebased base on
  each retry without correctly re-anchoring to the specific local edit this
  invocation is trying to land, so a real diff momentarily reads as already
  matching the (new) base.
- The CAS `--base` compare-and-swap token itself has a gap that lets a
  stale token be treated as still-fresh under rapid concurrent commits,
  causing the write to be accepted as a no-op (or silently dropped) instead
  of triggering a rebase-and-reapply of the local edit.

## Recommendation

See the `office_hours.recommendation` field above for the full audit
prescription (same content, kept in sync): audit
`id_files_dirty()`/`check_base_freshness()`/`ensure_intentions_only_base()`
in `packages/intentionsutil/scripts/graph-commit` for the race described
above, ideally reproduced deterministically by extending the existing
`test-graph-commit.sh` bare-origin + multi-clone harness (the same harness
`tactic-graph-commit-landing-lock`'s Unit 3 already extends for its own lock
cases) with a case that forces a writer's rebase retry to race a genuinely
concurrent `origin/main` advance. Once root-caused, the fix must ensure a
real dirty edit is always either landed or surfaced as an explicit
conflict/park — never silently discarded with a false "landed" message or a
silent revert to the pre-edit value.

## Out of scope

This tactic does not itself contain an implementation plan — it is filed
`status: raw`, `phase: null` for a future `/align-tactics` or `/align-init`
round (or a direct office-hours session) to root-cause and plan. It does not
duplicate `tactic-graph-commit-landing-lock` (contention serialization, a
different defect already fully planned) or
`tactic-graph-commit-cwd-repo-resolution` (wrong-repo targeting, already
landed) — this is a third, distinct defect in the same script's staleness
detection.

## Reuse

- `packages/intentionsutil/scripts/test-graph-commit.sh` — the bare-origin +
  multi-clone functional-test harness already used by
  `tactic-graph-commit-landing-lock`'s planned Unit 3; the natural home for a
  new deterministic-contention repro case.
- `tactic-graph-commit-landing-lock`'s `office_hours` block — the
  independently-recorded live incident on that node; cross-reference when
  diagnosing, since it is blocked on this same defect.
