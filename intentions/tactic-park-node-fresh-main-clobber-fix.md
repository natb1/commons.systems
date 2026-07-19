---
id: tactic-park-node-fresh-main-clobber-fix
kind: tactic
statement: park-node writes office_hours against fresh origin/main (never the
  local stale worktree) and the Stop-hook backstop consumes its marker files
  after a successful park, so a deviation park can neither re-fire every turn
  nor silently clobber newer landed graph state
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-19 while a human picked up the parked node-worker
  job for tactic-graph-review-exclusion-stall-recovery in-session (PR #2920):
  the node's body revision was silently reverted TWICE (park commits a905956a,
  e130a665) before the cause was found. Two orthogonal defects compound. Second
  occurrence of the same class — tactic-align-doc-completeness-over-commit-noise
  hit it too (unpark commit e92d05bb noted the Stop-hook backstop re-parked from
  stale uncleared marker files)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 70
  override: null
  rationale: "Author-directed 2026-07-19: boost to top ranking. Sized above the
    live dispatch composed max (69.33, tactic-graph-commit-auto-serialization)
    so a childless tactic serving strategy-graph-native-dispatch (base 5.33)
    composes to 75.33 once finalized/selected. Silent reversion of landed graph
    state is a data-loss class defect worth fixing before lower-severity queue
    work."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# park-node fresh-origin/main write + one-shot deviation marker

## Context

A deviation park writes `office_hours` onto a node so the router stops
selecting it. Two orthogonal defects in that write path combine into a
silent, repeated clobber of newer landed graph state. Both were observed live
on 2026-07-19 while a human picked up the parked node-worker job for
`tactic-graph-review-exclusion-stall-recovery` (PR #2920): a body revision
that had already landed on `origin/main` was silently reverted twice (park
commits `a905956a`, `e130a665`) before the cause was found. The same class
recurred earlier on `tactic-align-doc-completeness-over-commit-noise` (unpark
commit `e92d05bb`). Recurrence across unrelated nodes makes this systemic,
not node-specific.

The two defects:

1. **The Stop hook never consumes its marker files.**
   `.claude/hooks/dispatch-stop.sh` (lines ~40–75) parks whenever
   `$CLAUDE_JOB_DIR/office-hours-reason` is non-empty (`[ -s ]`), calling
   `park-node "$JOB_NAME" "$_OH_REASON" "$_OH_RECO"`, but never removes the
   marker files afterward. In the pure autonomous flow the job ends right
   after the park, so this is invisible; but when a session keeps producing
   Stop events after its deviation park — exactly the office-hours workflow
   where a human picks up a parked job in-session — it re-parks on *every*
   turn boundary.

2. **`park-node` writes from the local (possibly stale) worktree, not
   origin/main.** `packages/intentionsutil/scripts/park-node` (lines ~31–56)
   sets `INTENTIONS_DIR="$REPO_ROOT/intentions"` and does
   `readNode(intentionsDir, id)` → `node.office_hours = {…}` →
   `writeNode(intentionsDir, node)` → `graph-commit`. It reads the *local*
   node file. Run from a stale PR-branch worktree (which the Stop-hook
   backstop does — its own comment notes it skips the reset-dance),
   `writeNode` preserves the stale on-disk body and `graph-commit` lands it
   over `origin/main`. `graph-commit` rebases, but the file *content* comes
   from park-node's stale write, so newer `origin/main` state (a body
   revision, a transition) is silently reverted. There is no `--base` CAS
   guard, so nothing catches the stale write.

Defect 1 controls how often a re-park fires; defect 2 is why a re-park
corrupts state. Either alone is a bug; together they produce an every-turn
silent clobber.

## Scope

**Unit 1 — one-shot deviation markers (Stop hook).**
`.claude/hooks/dispatch-stop.sh`. After a *successful* `park-node` call,
`rm -f "$CLAUDE_JOB_DIR/office-hours-reason"
"$CLAUDE_JOB_DIR/office-hours-recommendation"` so the park fires at most once
per deviation. A genuinely new deviation rewrites the markers, so consuming
them loses nothing. Guard the delete on park-node's exit status — do not
delete if the park failed (the signal must survive a retry). Out of scope:
the marker *authoring* sites in the phase skills (`/implement` etc.) — they
already write the markers correctly; only the hook's consume-after-use is
missing.

**Unit 2 — fresh-origin/main park write (park-node).**
`packages/intentionsutil/scripts/park-node`. The `office_hours` write must be
computed against fresh `origin/main`, never the invoking worktree's stale
copy. Greenfield: read the node via `git archive origin/main
intentions/<id>.md` (the same fetch-then-read pattern `/implement`'s Step-0
gate and `dispatch-sweep` use), set only `office_hours`, and land a minimal
diff with `graph-commit --base <id>=<blobsha>` so a concurrent edit is
refused mechanically rather than clobbered. Equivalent acceptable
implementation: `git fetch origin main` + sync the worktree to it before the
existing read/write. Either way the invariant is: **a park can never
overwrite newer landed state, regardless of which worktree invokes it.** Out
of scope: changing `graph-commit`'s own conflict handling — `--base` already
exists (used by the align skills); this unit only makes park-node pass it.

## Dependencies

None between the units — they touch different files and either can land
first. Unit 2 is the higher-severity fix (it is the one that actually
corrupts state); Unit 1 reduces the trigger frequency.

## Reuse

- `graph-commit --base <id>=<blobsha>` CAS — already implemented; the align
  skills' `dump-node.ts` path is the worked precedent for producing the base
  manifest.
- `git archive origin/main intentions/<id>.md | tar -xO` — the fresh-node
  read pattern from `.claude/skills/implement/SKILL.md` Step-0 node-lane gate.
- `apply-fix-state.ts` is the sibling precedent for an office_hours-adjacent
  state-only writer that already lands via graph-commit.

## Verification

- Unit 1: after a park, assert the marker files are gone — a follow-up Stop
  event on the same job does not re-park (no second `office_hours` commit).
  Add coverage to `test-dispatch-scripts.sh` if a hook-level harness exists;
  otherwise verify by inspection + a manual two-turn park reproduction.
- Unit 2: from a deliberately-behind worktree, land a body/state change on
  `origin/main` for a node, then invoke `park-node` for that node from the
  stale worktree; assert the landed change survives (office_hours set, body
  intact) rather than being reverted. A stale `--base` must abort the park
  with a clear conflict message, not clobber.
- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes.

## Recommended model

**Unit 1** — `sonnet` (mechanical: add a guarded `rm -f` after a known call
site).
**Unit 2** — `opus` (judgment: CAS/base-manifest wiring and the
fresh-origin/main read against a live landing primitive; get the conflict
posture right).
