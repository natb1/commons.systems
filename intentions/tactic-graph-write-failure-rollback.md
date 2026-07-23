---
id: tactic-graph-write-failure-rollback
kind: tactic
statement: "Graph-write primitives leave no residue in the shared checkout when
  a write fails to land: roll back on every failure path across all six leaking
  call sites, surface the one silently-swallowed failure, and isolate the
  read-modify-write to scratch cut from origin/main as the target"
owner: ai
status: raw
parent: null
rationale: >-
  Surfaced 2026-07-23 debugging a failed manual dispatch tick, and recorded as a
  standing invariant in strategy-graph-native-dispatch's 2026-07-23 no-residue
  clarification; this draft carries the implementing fix. The shape: a script
  mutates one or more intentions/*.md files in the PRIMARY checkout, calls
  graph-commit, and on failure exits non-zero leaving the mutation on disk with
  no rollback. graph-commit's assert_clean_outside_ids ("refusing to start --
  unrelated dirty tracked file(s) outside this call's node set") then rejects
  every subsequent call for every OTHER node until a human clears it by hand.


  Census corrected 2026-07-23 after the first draft of this tactic named only
  two call sites. That undercount came from grepping the literal phrase "on disk
  but not landed", which the other sites word differently ("plan applied on
  disk, not landed", "content on disk, not landed", or nothing at all).
  Enumerating callers of graph-commit instead gives SIX leaking sites, none of
  which roll back: park-node:98; demote-node-to-implement:78;
  transition-node:154 (the most frequently invoked -- every phase transition);
  reconcile-graph-merged:118 (BULK -- reconcile-graph.ts applies edits to many
  node files before a single graph-commit, so one failure dirties all of them at
  once); dispatch-graph-census:120; and dispatch-graph-main-red-sync:104. The
  .ts mutators (apply-fix-state.ts, apply-node-transition.ts,
  reconcile-graph.ts) do not leak themselves -- they document that the caller
  owns landing -- which is precisely why the leak lives in their callers.


  Two sites amplify beyond the single-file case. dispatch-graph-scope-sweep:122
  calls demote-node-to-implement in a loop that explicitly "continues to the
  next stale node" on failure, so one stray write cascades into every later
  demote in the same sweep. dispatch-graph-main-red-sync:104 is worse: its
  graph-commit runs inside a `( ... ) 1>&2 || true` subshell inside a `while
  read` loop, so a failure is swallowed entirely -- no error surfaced, residue
  left, and the loop continues to the next node, potentially adding another
  dirty file per iteration. That silent-failure variant is a defect in its own
  right and not merely a residue problem.


  Observed blast radius: on 2026-07-23 a park-node failure on
  tactic-flake-fingerprint-stability (itself triggered by a
  provision-node-worktree exit 2) left a stray office_hours write in the primary
  checkout; the next manual tick's two legitimate scope-stale demotions --
  tactic-flake-hook-tests-select-tick and tactic-sync-reader-skill -- were both
  refused before doing any work, and dispatch-graph-execute exited 1. The
  failure was hard to diagnose because the error names a file belonging to a
  node unrelated to the one being worked.


  Neither tactic-flake-park-node-case2-dirty-tree-guard nor
  tactic-flake-park-node-concurrent-write-refusal covers this -- both are scoped
  to the CI test test-park-node.sh tripping the same guard, not to the
  production leak.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-23: boost to top ranking. This node carries
    the amplifier half of the 2026-07-23 manual-dispatch-tick failure. One stray
    uncommitted file in the primary checkout tripped graph-commit's
    assert_clean_outside_ids, and because none of the six graph-commit callers
    roll back, every refused call left its own plan on disk: the dirty set grew
    from 1 file to 7 within a single tick, reconcile-graph-merged and three
    demote-node-to-implement calls all failed, two nodes ended demote-failed, one
    was skipped as stale-selection after reading its own unlanded demotion off
    disk, and dispatch-graph-execute exited 1. Sized at 90, which composes to
    95.33 with the boost 5 inherited from strategy-graph-native-dispatch, placing
    it above the live discretionary composed max (90.33,
    tactic-graph-router-live-worker-read-robust) and below the
    strategy-main-health ceiling (100, author-override-guarded), which it does
    not displace. Paired with tactic-subagent-cwd-worktree-guard, which carries
    the seed half of the same incident."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Graph-write primitives leave no residue in the shared checkout

Implements the standing invariant recorded in `strategy-graph-native-dispatch`'s
2026-07-23 no-residue clarification. Units 1–3 are the stop-the-bleeding fix,
unit 4 is the target design, units 5–6 lock both in.

## The leaking call sites

All six mutate `intentions/*.md` in the primary checkout, call `graph-commit`,
and leave the mutation on disk when it fails:

| Site | Note |
|---|---|
| `packages/intentionsutil/scripts/park-node:98` | the originally-observed case |
| `packages/intentionsutil/scripts/demote-node-to-implement:78` | same shape |
| `.claude/skills/dispatch-propagate/scripts/transition-node:154` | most frequently invoked — every phase transition |
| `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:118` | **bulk** — many node files dirtied by one failure |
| `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census:120` | writes frontmatter + body, then lands |
| `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:104` | failure **silently swallowed** — see unit 3 |

## Unit 1 — Roll back in the two node-scoped primitives

**Scope.** `park-node`, `demote-node-to-implement`.

Both already capture the origin/main blob before mutating — `park-node:70`
(`FRESH_BLOB=$(git rev-parse "origin/main:intentions/$NODE_ID.md")`) — so the
restore point exists; nothing uses it on the failure path. Restore from that blob
on every non-zero exit after the mutation: the `graph-commit` failure at
`park-node:98` / `demote-node-to-implement:78`, and the tsx write failure at
`park-node:93`.

Prefer extending the existing `trap` (`park-node:82` already traps EXIT for the
temp file) over per-branch restore calls — a failure branch added later must not
be able to skip the rollback.

Correct the diagnostic too: it says the write "is on disk but not landed", which
after this unit is false.

## Unit 2 — Roll back in the four remaining call sites

**Scope.** `transition-node:154`, `reconcile-graph-merged:118`,
`dispatch-graph-census:120`, `dispatch-graph-main-red-sync:104`.

`transition-node` and `dispatch-graph-census` are single-node and take unit 1's
shape directly.

`reconcile-graph-merged` is the hard one and should be implemented last: the plan
is applied by `reconcile-graph.ts` across **many** node files before a single
`graph-commit`, so rollback must restore the whole edited set, not one path. The
prune half needs no rollback — deletion happens inside `graph-commit` via
`--prune`. Restoring the edit set from `origin/main` is sufficient and simpler
than tracking per-file backups; confirm that against `reconcile-graph.ts`'s
actual write set during implementation.

`dispatch-graph-main-red-sync` uses a `mktemp -d` for its dump but still runs
`write-node.ts` into the repo's `intentions/`, so its residue lands in the shared
checkout like the rest.

## Unit 3 — Surface the silently-swallowed failure

**Scope.** `dispatch-graph-main-red-sync:104–105`.

Its `graph-commit` runs inside `( ... ) 1>&2 || true` within a `while read` loop,
so a failure produces **no error at all**: nothing is logged, the residue is left,
and the loop proceeds to the next node — potentially adding another dirty file per
iteration.

This unit implements `strategy-graph-native-dispatch`'s 2026-07-23 no-silent-write
clarification, a standing invariant distinct from the no-residue one: every graph
write that fails to land surfaces a diagnostic naming the node and the failure, and
no call site may swallow the error. Satisfying rollback does not satisfy this — a
rollback that exits silently leaves a clean tree and no signal. Audit the other five
sites against it too, not just this one; unit 6 asserts on stderr for that reason.

Decide during implementation whether a failed completion should abort the sweep or
log-and-continue. Log-and-continue matches `dispatch-graph-scope-sweep`'s
precedent, but only once unit 2 guarantees each iteration leaves a clean tree —
`|| true` plus residue is what makes the current form unrecoverable.

## Unit 4 — Target: never use the shared checkout as scratch

Cut scratch from `origin/main`, do the read-modify-write there, and `graph-commit`
from there — so a failure leaves the primary checkout untouched by construction
rather than by remembering to roll back. This is the discipline
`.claude/skills/align-strategy/SKILL.md` Step 0 already binds interactive sessions
to; these six sites are the remaining violators.

Decide between a temp dir and a `graph-tx-*` worktree during implementation. Note
`tactic-graph-commit-cwd-repo-resolution` (qa) is landing exactly the cwd-based
target-repo resolution this would rely on — **sequence unit 4 after that tactic
merges** and re-read its final shape first.

## Unit 5 — Make the refusal diagnosable

**Scope.** `assert_clean_outside_ids` in
`packages/intentionsutil/scripts/graph-commit`.

The message names the offending file but not who likely wrote it, so the reader
sees a node unrelated to the one being worked and has no next step. Add a
remediation line: if the dirty file is an `intentions/*.md` whose only diff is an
`office_hours` or phase/marker block, say it is probably residue from a failed
graph write and name the command that clears it.

Standalone value even if units 1–4 prevent the leak, because the same guard fires
for genuine concurrent-session contention.

## Unit 6 — Test coverage

Per-primitive: `graph-commit` fails → every touched node file is byte-identical to
its pre-call state, and the primitive still exits non-zero. Include the bulk case
(`reconcile-graph-merged` with a multi-node plan) — a rollback that restores only
the first file would pass a single-node test.

Cascade-level: `dispatch-graph-scope-sweep` continuing past a failed demote
(`dispatch-graph-scope-sweep:122`) must not let node N's failure refuse node N+1.

Silent-failure: `dispatch-graph-main-red-sync` must emit a diagnostic when its
`graph-commit` fails (unit 3) — assert on stderr, since the current code produces
none.

Extend the existing suites rather than adding new ones:
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` already
stubs both node-scoped primitives (lines 80–91) and exercises the park path
(Case 8: provision exit 2 → parked; Case 10: park-node failure → failed, exit 1).
`test-park-node.sh` already has a dirty-tree case — see
`tactic-flake-park-node-case2-dirty-tree-guard` and
`tactic-flake-park-node-concurrent-write-refusal`, both of which concern that CI
test tripping the guard rather than this production leak, and neither of which
this tactic subsumes.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual: with a deliberately broken `graph-commit` (or a stale `--base`), run each
of the six call sites and confirm `git status --porcelain` is empty afterward and
the caller exited non-zero with a diagnostic.
