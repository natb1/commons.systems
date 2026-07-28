---
id: tactic-graph-commit-staleness-silent-revert
kind: tactic
statement: clear-park and resolve-park invoked graph-commit WITHOUT -C
  "$REPO_ROOT" while deriving REPO_ROOT from their own script location; since
  graph-commit resolves its repo from cwd when -C is absent, invoking either
  script by absolute path from a different checkout wrote the office_hours edit
  into one repo while graph-commit inspected another, took its benign equal-blob
  branch, printed "landed" and exited 0 having committed nothing — leaving the
  park silently in place and the edit dirty and unpushed
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-26 by a subagent draining office_hours parks across
  multiple graph nodes under heavy concurrent fleet activity, and ORIGINALLY
  MISDIAGNOSED as a concurrency race in graph-commit's staleness/freshness
  detection (id_files_dirty() / check_base_freshness()) discarding a genuine
  dirty edit against a moving base. That diagnosis was wrong. Corrected
  2026-07-28 by an office-hours drain session that root-caused the defect
  deterministically with a SINGLE writer and no concurrency at all: the defect
  is caller-side repo targeting, not a race. clear-park and resolve-park derive
  REPO_ROOT from their own on-disk location (SCRIPT_DIR) and write the
  office_hours clear into the intentions directory under THAT repo, but both
  invoked graph-commit without -C, and graph-commit resolves its repo from -C
  when given and otherwise from cwd
  (packages/intentionsutil/scripts/graph-commit:1337). A session invoking the
  main checkout's copy of either script by absolute path from inside a worktree
  therefore addressed two different checkouts at once: the edit landed in the
  script's repo while graph-commit inspected the caller's cwd repo, where
  nothing was staged for the id and the HEAD blob already equalled origin/main.
  That is the benign equal-blob branch (graph-commit:1477) — it printed \"landed
  ... on main\", exited 0, and committed nothing, leaving the real edit dirty
  and unpushed in the other checkout and the park silently in place. The fix
  adds -C \"$REPO_ROOT\" at both call sites, mirroring park-node:263 and
  demote-node-to-implement:115 which already pass it for exactly this reason;
  landed via PR #2978. The separately-observed \"silent revert\" shape (a commit
  nulling office_hours immediately followed by one restoring the stale value) is
  the same family — a writer operating from a stale checkout landing an outdated
  blob — and not a race inside graph-commit's staleness detection; no such race
  was found, and test-graph-commit.sh's existing -C-targeting and
  fail-loud-guard cases pass 43/43 against the fix. This node stays filed
  separately from tactic-graph-commit-landing-lock (contention serialization, a
  different defect) and from tactic-graph-commit-cwd-repo-resolution (the
  earlier wrong-repo fix inside graph-commit itself); this one is the
  caller-side half of the same wrong-repo hazard."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: This node records a defect whose fix has already shipped — what is its
      disposition, and why is the authorized boost 173 being retired?
    answer: "(Recorded 2026-07-28 /align-strategy round.) Closed as shipped. The
      2026-07-28 office-hours drain session root-caused this deterministically
      as caller-side repo targeting (clear-park and resolve-park invoking
      graph-commit without -C) and its fix landed in PR #2978, merged as
      29952532; the separately-observed silent-revert shape was dispositioned in
      the same pass as the same family (a writer operating from a stale checkout
      landing an outdated blob), with no race found in graph-commit staleness
      detection and test-graph-commit.sh passing 43/43 against the fix. phase is
      therefore set to done and the record retained rather than pruned: the
      misdiagnosis-and-correction history is itself worth keeping, and
      tactic-graph-commit-noop-landing-false-failure cross-references this node
      by id, so pruning would dangle that prose reference. The attention boost
      of 173 — authored 2026-07-26 under explicit human authorization with the
      ACK: main-health-dominance substring, when the defect was believed live
      and systemic — is cleared to null because the WORK IS COMPLETE, not
      because the defect was reassessed as unimportant; leaving a top-rank claim
      on shipped work would have distorted the next /align-tactics round on
      strategy-graph-native-dispatch into planning a fix that already exists.
      The live remainder of this defect family is tracked separately as
      tactic-graph-commit-noop-landing-false-failure: the inverse failure
      through the same nothing-staged / land-current-HEAD fallback, where an
      absent edit is reported as a hard failure rather than a lost edit reported
      as success."
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-graph-commit-staleness-silent-revert
  pr: 2978
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# clear-park and resolve-park invoked graph-commit without -C, targeting the wrong repo and reporting a false "landed"

## Context

`packages/intentionsutil/scripts/graph-commit` is the sole write primitive
that lands intention-node edits on `main` (see also
`tactic-graph-commit-landing-lock`, which serializes the rebase→stamp→push
critical section, and `tactic-graph-commit-cwd-repo-resolution`, which fixed
the wrong-repo defect *inside* `graph-commit` itself). This tactic tracks the
**caller-side half** of that same wrong-repo hazard: two callers that never
told `graph-commit` which repo to act on.

While draining `office_hours` parks across multiple graph nodes on
2026-07-26, under heavy concurrent fleet activity, a subagent working
`tactic-graph-commit-landing-lock`'s own park ran `clear-park` (which invokes
`graph-commit`) three separate times — once backgrounded, twice in the
foreground — trying to write `office_hours: null` on that node. Each attempt
failed silently, in one of two ways:

1. **Silent revert.** The commit history showed an intermediate commit that
   correctly set `office_hours: null`, immediately followed by ANOTHER
   commit that reverted it back to the old, stale parked value — with no
   unresolved-conflict or park message ever printed by `graph-commit`.
2. **False success.** `graph-commit` printed its normal `landed ... on main`
   success message and exited 0, but `git status` on the invoking worktree
   showed a real, uncommitted diff (the `office_hours: null` edit) and
   `git log` showed no new commit — the edit was never staged, committed,
   or pushed.

## Confirmed root cause

The original filing (2026-07-26) blamed a **concurrency race** in
`graph-commit`'s staleness/freshness detection —
`id_files_dirty()` / `check_base_freshness()` / `ensure_intentions_only_base()`
misclassifying a real dirty edit as clean against a moving base. **That
diagnosis was wrong.** It was corrected on 2026-07-28 by an office-hours drain
session that reproduced the failure deterministically with a **single writer
and no concurrency at all**.

The actual defect is caller-side repo targeting:

- `clear-park` and `resolve-park` derive `REPO_ROOT` from their own on-disk
  location (`SCRIPT_DIR`), and write the `office_hours` clear into the
  intentions directory under **that** repo.
- Both then invoked `graph-commit` **without** `-C`. `graph-commit` resolves
  its repo from `-C` when given, and otherwise from **cwd**
  (`packages/intentionsutil/scripts/graph-commit:1337`).

So a session that invokes the main checkout's copy of either script by
absolute path from inside a worktree addresses two different checkouts at
once. The edit lands in the script's repo while `graph-commit` inspects the
caller's cwd repo, where nothing is staged for the node id and the HEAD blob
already equals `origin/main`. That is the **benign equal-blob branch**
(`graph-commit:1477`): it prints `landed ... on main`, exits 0, and commits
nothing — leaving the real edit dirty and unpushed in the other checkout and
the park silently in place.

The separately-observed *silent revert* shape belongs to the same family — a
writer operating from a stale checkout landing an outdated blob — and not to
a race inside `graph-commit`'s staleness detection. No such race was found.

## Fix

Both call sites now pass `-C "$REPO_ROOT"`, mirroring `park-node:263` and
`demote-node-to-implement:115`, which already do so for exactly this reason.
Each site carries a comment recording why the flag is mandatory rather than
cosmetic, so a later edit does not drop it as noise.

- `packages/intentionsutil/scripts/clear-park:181`
- `packages/intentionsutil/scripts/resolve-park:188`

Landed via PR #2978.

## Verification

- `bash -n` clean on both scripts.
- `packages/intentionsutil/scripts/test-graph-commit.sh` — 43 passed, 0
  failed. The suite already covers the targeting contract directly (`-C
  targeting: script physically inside w16, targeting w17 via -C from an
  unrelated cwd, lands in w17's repo`) and both fail-loud guards around the
  equal-blob branch.
- `packages/intentionsutil/scripts/test-park-node.sh` — 14 passed, 1 failed.
  The single failure, `demote-node-to-implement byte-identical restore`
  (an `ERR_MODULE_NOT_FOUND` in a helper import), is **pre-existing on clean
  `origin/main`** and unrelated to this change. It is left failing
  deliberately — it is signal, not an obstacle.

## Reuse

- `packages/intentionsutil/scripts/test-graph-commit.sh` — the bare-origin +
  multi-clone functional-test harness; its existing `-C targeting` case is the
  regression guard for this defect class.
- `packages/intentionsutil/scripts/park-node` and
  `demote-node-to-implement` — the two callers that already passed `-C`, and
  the pattern the fix mirrors.
