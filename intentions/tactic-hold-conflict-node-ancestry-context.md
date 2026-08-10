---
id: tactic-hold-conflict-node-ancestry-context
kind: tactic
statement: "hold: provision-conflict on `tactic-node-ancestry-context` — a
  tracked hold blocking the source until the mechanical retry state is resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-node-ancestry-context
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-node-ancestry-context

## Context

`tactic-node-ancestry-context` hit a mechanical retry state (`provision-conflict`) on 2026-08-04. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-node-ancestry-context`) carries the park, and `tactic-node-ancestry-context` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/dispatch-conflict Lane 3: origin/main merge conflict resolved on two files
(.gitignore, .claude/skills/office-hours/SKILL.md — both clean non-overlapping
unions), but the node's own plan verification (dispatch-run-verification)
reported a non-zero exit on verify block 1, which the skill's contract treats
as ambiguous regardless of root cause. Manual re-derivation of every check in
the plan (correcting only two unrelated tooling issues — a nested-cd bug in
block 1's own text, and a tsx -e top-level-await limitation in this
environment) confirms every check passes, including the plan's own
authoritative whole-store assertion (nodes=496 over-cap=0 no-virtue=0
max-bytes=23864). See the attached recommendation for the exact resolution,
the plan-text fix, and the next action.

## How to resolve

# Recommendation — `tactic-node-ancestry-context` (PR #2946)

## Bottom line

This hold is a false positive. There is no real merge conflict and no semantic defect. Both conflicted files were clean non-overlapping additions, and every substantive check in the node's own plan passed against the resolved merge. Two unrelated tooling issues produced the non-zero exit that forced escalation:

1. A pre-existing authoring bug in the node's plan text (verify block 1 uses a nested `cd`).
2. An environment quirk with `npx tsx -e` in this repo.

Neither is caused by the merge or its resolution. The verify block would fail identically on any run of this plan text, merge or no merge.

## The conflict resolution to apply

Both files are pure union merges. Keep every addition from both sides. No renumbering, no reordering, no content changes.

**`.gitignore`** — HEAD and `origin/main` added different ignore lines at the same anchor. Keep all three:

- `/.claude/ancestry-context.md` (from HEAD)
- `/.claude/loop.md` (from `origin/main`)
- `/.claude/output-styles` (from `origin/main`)

**`.claude/skills/office-hours/SKILL.md`** — additions at three separate anchor points in the same numbered list. Keep all of them:

- From HEAD: the new numbered step `3. Surface the ancestry projection...` describing running `node-ancestry.ts` and presenting its output as untrusted data to a human.
- From `origin/main`: the note that the selector resolves park state at `origin/main` rather than the working tree.
- From `origin/main`: the note that the step-2 reservation marker stays in place.

Both branches' shared steps already use identical numbers, so the union needs no renumbering. Verify with `git diff --cached --check` and a grep for `<<<<<<<` / `=======` / `>>>>>>>` after resolving.

Note: the merge commit made during the Lane 3 run (`2c2732f3`) was undone with `git reset --hard HEAD~1` per the ambiguous-path contract, so the worktree sits at its pre-merge tip and the resolution is not preserved anywhere. Whoever picks this up re-resolves it — either by hand as above, or by re-running the Lane 3 process, which will reach the same result.

## Fix the plan's verify block 1

The block body runs as one bash script — both lines execute in the same shell, sequentially, with no `set -e`. Current text:

```
cd packages/intentionsutil && npx vitest run node-ancestry
cd packages/intentionsutil && npx vitest run
```

Line 1 succeeds (23/23 tests pass). Line 2's `cd packages/intentionsutil` then fails — the shell is already inside that directory and there is no nested copy — so `&&` short-circuits, the second `npx vitest run` never runs, and the block's last command is a failed `cd`. That is the entire non-zero exit.

Wrap each line in a subshell so the directory change does not leak:

```verify
(cd packages/intentionsutil && npx vitest run node-ancestry)
(cd packages/intentionsutil && npx vitest run)
```

Equivalently, use the repo-root-rooted form the sandbox rule prefers, which sidesteps `cd` entirely:

```verify
npx vitest run --project packages/intentionsutil --root . node-ancestry
npx vitest run --project packages/intentionsutil --root .
```

Both forms were run manually and pass. Edit the node body's `## Verification` section before re-running verification, or the same false-fail recurs.

## Environment quirk to expect

The whole-store and worst-case blocks use `npx tsx -e "..."`. In this environment that fails with:

```
Top-level await is currently not supported with the 'cjs' output format
```

This is a tsx/esbuild issue, not a code defect. The same script body saved as a real `.mts` file and run with `npx tsx path.mts` works. If a future run hits this, write the script to a temp `.mts` file rather than treating it as a verification failure. Consider changing the plan text to the file-based form so it stops tripping.

## What already passed

Run manually in the merged worktree, correcting only for the two quirks above:

- `npx vitest run node-ancestry` in `packages/intentionsutil` — 23/23 passed.
- Full package suite — 43 files, 843/843 passed.
- Same two via `--project packages/intentionsutil --root .` — identical results.
- CLI smoke test (`node-ancestry.ts tactic-node-ancestry-context --dir intentions`) — exit 0, rendered correctly.
- `--out` write smoke test — exit 0, file written and non-empty.
- Whole-store assertion (the plan calls this "the gate" and says to treat a failure there as authoritative) — `nodes=496 over-cap=0 no-virtue=0 max-bytes=23864`. Cap is 24000; max observed 23864. PASS.
- Worst-case spot check — `node=tactic-attention-surface-collector-config bytes=23864 ancestors=8 truncated=true`, renders a virtue ancestor, under cap. PASS.

## Next action

1. Edit the node's `## Verification` section to fix verify block 1 (subshell or `--project`/`--root` form). Optionally fix the `tsx -e` blocks to write a `.mts` file.
2. Re-run `/dispatch-conflict tactic-node-ancestry-context`. It will re-resolve the same two-file union conflict and verification should now exit 0.
3. Push, and the node leaves its held state and proceeds through `review` on #2946.

If you would rather not edit the plan text first, the alternative is to re-resolve the two files by hand as described above, confirm the checks pass (results already documented above), and push — but then the next verification run false-fails the same way, so fixing the block is the better path.

The `blocked_by` edge on `tactic-node-ancestry-context` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

