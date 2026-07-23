---
id: tactic-graph-write-failure-rollback
kind: tactic
statement: "Graph-write primitives leave no residue in the shared checkout when
  a write fails to land: roll back on every failure path now, isolate the
  read-modify-write to scratch cut from origin/main as the target"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-23 debugging a failed manual dispatch tick, and
  recorded as a standing invariant in strategy-graph-native-dispatch's
  2026-07-23 no-residue clarification; this draft carries the implementing fix.
  park-node:98 and demote-node-to-implement:78 share one shape: mutate
  intentions/<id>.md in the PRIMARY checkout, call graph-commit, and on failure
  print \"the ... write is on disk but not landed\" and exit 1 -- leaving the
  mutation on disk with no rollback. graph-commit's assert_clean_outside_ids
  (packages/intentionsutil/scripts/graph-commit, \"refusing to start --
  unrelated dirty tracked file(s) outside this call's node set\") then rejects
  every subsequent call for every OTHER node until a human clears it by hand.
  Observed blast radius: on 2026-07-23 a park-node failure on
  tactic-flake-fingerprint-stability (itself triggered by a
  provision-node-worktree exit 2) left a stray office_hours write in the primary
  checkout; the next manual tick's two legitimate scope-stale demotions --
  tactic-flake-hook-tests-select-tick and tactic-sync-reader-skill -- were both
  refused before doing any work, and dispatch-graph-execute exited 1. The
  failure was hard to diagnose because the error names a file belonging to a
  node unrelated to the one being worked. dispatch-graph-scope-sweep:122
  amplifies it: it calls the demote primitive in a loop that explicitly
  \"continues to the next stale node\" on failure, so one stray write cascades
  into every later demote in the same sweep. Neither
  tactic-flake-park-node-case2-dirty-tree-guard nor
  tactic-flake-park-node-concurrent-write-refusal covers this -- both are scoped
  to the CI test test-park-node.sh tripping the same guard, not to the
  production leak."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Graph-write primitives leave no residue in the shared checkout

Implements the standing invariant recorded in `strategy-graph-native-dispatch`'s
2026-07-23 no-residue clarification. Sequenced greenfield-last: units 1 and 3 are
the one-PR stop-the-bleeding fix, unit 2 is the target design, unit 4 locks both
in.

## Unit 1 — Roll back the on-disk write on every failure path

**Scope.** `packages/intentionsutil/scripts/park-node` and
`packages/intentionsutil/scripts/demote-node-to-implement`.

Both already capture the origin/main blob before mutating — `park-node:70`
(`FRESH_BLOB=$(git rev-parse "origin/main:intentions/$NODE_ID.md")`) — so the
restore point exists; nothing uses it on the failure path. Restore the node file
from that blob whenever the primitive exits non-zero after the mutation:
the `graph-commit` failure at `park-node:98` / `demote-node-to-implement:78`,
and the tsx write failure at `park-node:93`.

Prefer extending the existing `trap` (`park-node:82` already traps EXIT to remove
the temp file) over adding restore calls to each branch — a new failure branch
added later must not be able to skip the rollback.

Keep the diagnostic line, but correct it: it currently says the write "is on disk
but not landed", which after this unit is false. It should say the write was
rolled back and the node is unchanged on origin/main.

**Out of scope.** The `graph-commit` refusal itself, and the provisioning failure
that triggered the park.

## Unit 2 — Target: never use the shared checkout as scratch

**Scope.** The same two primitives, plus the shape any future graph-write
primitive follows.

Cut scratch from `origin/main`, do the read-modify-write there, and `graph-commit`
from there — so a failure leaves the primary checkout untouched by construction
rather than by remembering to roll back. This is the discipline
`.claude/skills/align-strategy/SKILL.md` Step 0 already binds interactive sessions
to; the primitives are the remaining violators.

Decide between a temp dir and a `graph-tx-*` worktree during implementation. A
worktree is the established pattern in this repo, but costs a `worktree add` per
park; a temp dir is cheaper if `graph-commit` can be pointed at it — note
`tactic-graph-commit-cwd-repo-resolution` (qa) is landing exactly the cwd-based
target-repo resolution this would rely on, so **sequence unit 2 after that tactic
merges** and re-read its final shape first.

## Unit 3 — Make the refusal diagnosable

**Scope.** `assert_clean_outside_ids` in
`packages/intentionsutil/scripts/graph-commit`.

The current message names the offending file but not who likely wrote it, so the
reader sees a node unrelated to the one being worked and has no next step. Add a
remediation line: if the dirty file is an `intentions/*.md` whose only diff is an
`office_hours` or phase/marker block, say it is probably residue from a failed
park or demote and name the command that clears it.

This unit has standalone value even if units 1–2 fully prevent the leak, because
the same guard fires for genuine concurrent-session contention.

## Unit 4 — Test coverage

Cover, at the primitive level: `graph-commit` fails → node file byte-identical to
its pre-call state, and the primitive still exits non-zero. Cover, at the tick
level, the cascade — `dispatch-graph-scope-sweep` continuing past a failed demote
(`dispatch-graph-scope-sweep:122`) must not let node N's failure refuse node N+1.

Extend the existing suites rather than adding new ones:
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` already
stubs both primitives (lines 80–91) and exercises the park path (Case 8: provision
exit 2 → parked; Case 10: park-node failure → failed, exit 1). `test-park-node.sh`
already has a dirty-tree case — see `tactic-flake-park-node-case2-dirty-tree-guard`
and `tactic-flake-park-node-concurrent-write-refusal`, both of which concern that
CI test tripping the guard rather than this production leak, and neither of which
this tactic subsumes.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual: with a deliberately broken `graph-commit` (or a stale `--base`), run
`park-node` against a node and confirm `git status --porcelain` is empty
afterward and the primitive exited non-zero.
