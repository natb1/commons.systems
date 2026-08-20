---
id: tactic-hold-conflict-strategy-fingerprint-stamp-coverage
kind: tactic
statement: "hold: provision-conflict on
  `tactic-strategy-fingerprint-stamp-coverage` — a tracked hold blocking the
  source until the mechanical retry state is resolved"
owner: ai
status: codified
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
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-strategy-fingerprint-stamp-coverage
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-strategy-fingerprint-stamp-coverage

## Context

`tactic-strategy-fingerprint-stamp-coverage` hit a mechanical retry state (`provision-conflict`) on 2026-08-09. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-strategy-fingerprint-stamp-coverage`) carries the park, and `tactic-strategy-fingerprint-stamp-coverage` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

provision-conflict: origin/main does not merge clean into tactic-strategy-fingerprint-stamp-coverage's own branch (provision-node-worktree exit 11). The two textual git conflicts (test-graph-write-rollback.sh, unit-tests.yml) were resolved cleanly (keep-both, additive on both sides), but the merged tree then failed its own plan verification: dispatch-run-verification block 6 (test-strategy-stamp-doctrine.sh, assertion 9) fails because origin/main's align-strategy → align consolidation (commit c845d50f) dropped this branch's own mint-time-flags doctrine addition (commit ad47f8d2) during a clean rename-merge. See the recommendation for the fix.

## How to resolve

# Office-hours recommendation — `tactic-strategy-fingerprint-stamp-coverage` (PR #3023), Lane 3 provision-conflict park

## Why this parked

The origin/main merge on this node's branch resolved cleanly, but the required post-merge plan verification failed. `dispatch-run-verification` block 6 — `.claude/skills/dispatch-propagate/scripts/test-strategy-stamp-doctrine.sh`, this tactic's own doctrine-coverage guard — failed assertion 9 of 11:

```
FAIL: align-strategy/SKILL.md mentions the mint-time flags: file missing: .claude/skills/align-strategy/SKILL.md
Results: 10/11 passed, 1 failed
```

This is a real content loss, not a stale-path false-fail. This branch's commit `ad47f8d2` added a mint-time-flags doctrine passage to `.claude/skills/align-strategy/SKILL.md` (~lines 654-700; key sentence at line 658: "minting: `write-node.ts`'s `--strategy-fingerprint`/`--strategy-sha` flags"). Independently, `origin/main` commit `c845d50f` ("Consolidate /align-strategy + /align-init into /align") renamed that file to `.claude/skills/align/SKILL.md` and restructured it. Git detected the rename and auto-merged without a textual conflict, but the two sides had diverged too far for 3-way content merge to carry the new passage across. Verified by inspection: `origin/main:.claude/skills/align/SKILL.md` contains `write-node.ts` many times and one incidental `--strategy-sha` at line 704, but no `--strategy-fingerprint` and no occurrence of `mint-time stamp`. The doctrine Unit 3 added is genuinely absent from the post-consolidation file.

The merge was rolled back (`git reset --hard HEAD~1`) per the ambiguous-outcome procedure, so the worktree is at pre-merge state.

## The merge itself is already solved — redo it, don't re-derive it

Run `git merge origin/main` in the node's worktree. It will conflict identically on exactly two files; both resolutions are keep-both:

1. `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — both sides added independent, non-overlapping `cp` lines to the same test-fixture-seeding function. Keep both `cp` blocks.
2. `.github/workflows/unit-tests.yml` — both sides added independent, non-overlapping CI step entries. Keep all three steps.

No other file needs conflict work. The remaining fix is the doctrine gap below, applied either on top of the redone merge or as part of it.

## Step 1 — Port the mint-time doctrine passage into `align/SKILL.md`

Source: this branch's `.claude/skills/align-strategy/SKILL.md`, lines ~654-700 (from commit `ad47f8d2`). Target: `origin/main`'s `.claude/skills/align/SKILL.md`.

Adapt, do not copy verbatim — the target's structure changed substantially in `c845d50f`. Place the passage wherever it fits the post-consolidation organization. The content that must land:

- The `write-node.ts` `--strategy-fingerprint` / `--strategy-sha` mint-time seeding mechanism.
- The "child minted before this mechanism" case.
- The "live router still SEEDS via transition-node" doctrine.

Cross-references: this same commit landed equivalent doctrine reconciliations in `tactic-target.md` and `write-path.md` on this branch — useful for seeing how the passage was phrased for other homes and where it fits the current doc structure.

## Step 2 — Repoint assertion 9 at the new path

In `.claude/skills/dispatch-propagate/scripts/test-strategy-stamp-doctrine.sh`:

- `ALIGN_STRATEGY_SKILL` variable, ~line 41 -> `.claude/skills/align/SKILL.md`
- The check block, ~lines 214-231 (asserts the file mentions `write-node.ts` and either `--strategy-fingerprint` or `mint-time stamp`) -- update the failure message text away from `align-strategy/SKILL.md`.

Do Step 1 first. Repointing alone turns a file-missing failure into a content-missing failure, since `align/SKILL.md` today satisfies neither half of the assertion's second clause.

## Done when

`dispatch-run-verification` passes all blocks on the merged tree, verify block 6 reporting 11/11.

The `blocked_by` edge on `tactic-strategy-fingerprint-stamp-coverage` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

