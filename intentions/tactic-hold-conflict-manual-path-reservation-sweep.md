---
id: tactic-hold-conflict-manual-path-reservation-sweep
kind: tactic
statement: "hold: provision-conflict on `tactic-manual-path-reservation-sweep` —
  a tracked hold blocking the source until the mechanical retry state is
  resolved"
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
  hold_for: tactic-manual-path-reservation-sweep
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-manual-path-reservation-sweep

## Context

`tactic-manual-path-reservation-sweep` hit a mechanical retry state (`provision-conflict`) on 2026-08-03. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-manual-path-reservation-sweep`) carries the park, and `tactic-manual-path-reservation-sweep` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/dispatch-conflict Lane 3: origin/main merge conflict resolved and independently
verified (both files clean, no conflict markers, ported test suite 189/189
passing), but the node's own `## Verification` block (read fresh off
origin/main per Lane 3's contract) still names the deleted test-file monolith
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` (removed
upstream by the test-file-split commit), so dispatch-run-verification exits 1
("No such file or directory") — a stale plan reference, not a defect in the
resolved code. Per Lane 3's protocol this verify failure is treated as
ambiguous with no exception carved out, so the merge commit was reverted
(safe — local, unpushed) and this node is parked for human review rather than
having the "just a stale path" judgment made unilaterally. See the
recommendation for the exact fix (which must land on origin/main's copy of
the node body, not the branch's) and the already-worked-out resolution to
re-apply once it does.

## How to resolve

Verified the claims against the repo before writing: the monolith is absent from `origin/main`'s tree, `test-dispatch-select-tick.sh` is present and owns the `sel_tick` fixtures, Lane 3 pipes the **fresh `origin/main`** copy of the node body into `dispatch-run-verification`, and 11 other non-done nodes carry the same dead path inside a live `verify` fence.

# Recommendation — `tactic-manual-path-reservation-sweep` (PR #2964), Lane 3 provision-conflict hold

## Assessment: plan staleness, confirmed — not a defect

The park is correct protocol and the diagnosis is right. The node's `## Verification` fence names `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, which `origin/main` no longer has: `58e5bc34` split the monolith into ~99 per-SUT files, and `test-dispatch-select-tick.sh` is now the home for this SUT (it carries `sel_tick_setup` and the whole `sel_tick` group). The verify block fails on `No such file or directory` — a dead path, not a failing assertion. Nothing in the branch's own change (one `reservation_sweep 1>&2 || true` call ahead of the count) is implicated.

**One correction that changes the fix's target.** Lane 3 does not run the branch's copy of the node body — it pipes `NODE_MD`, read fresh from `origin/main`, into `dispatch-run-verification`. So editing the verify path on the branch will **not** fix the re-run. The edit has to land on `origin/main`'s copy of `intentions/tactic-manual-path-reservation-sweep.md` via `graph-commit` before the lane is re-entered.

That edit is merge-safe. The branch's only own change to that file is the appended `## needs-main residue` H2 (item 16); `origin/main` separately re-scaled `attention.boost` 90 → 10. Different regions, so a main-side verify-path edit auto-merges cleanly. Do **not** carry the branch's `boost: 90` or its residue section into main's copy, and do not use `write-node` for the body — edit the file directly.

## The resolution itself is settled and just needs re-applying

Both halves were already worked out and independently checked; the revert was protocol, not a retraction. `dispatch-select-tick`: keep `origin/main`'s single unconditional sweep call ahead of the reservation count, drop the auto-merged duplicate, and keep the merged comment documenting both rationales (paused+manual reaper dormancy, and spawn-handoff double-counting from `3ddf7858`). `test-dispatch-scripts.sh`: accept upstream's deletion and keep both ported tests in `test-dispatch-select-tick.sh` at their original relative position after the `manual-daemon-unknown` group — including the orphan-saturated-ledger test, which is the real regression discriminator for the 2026-07-23 incident. That port ran 189/189. No CI wiring is needed for the ported tests: `run-unit-tests.sh`'s glob over the scripts dir picks the file up automatically, and the hand-wired list in `unit-tests.yml` is only for SUTs living outside that directory.

## Actions

1. In a scratch worktree at `origin/main`, edit `intentions/tactic-manual-path-reservation-sweep.md`: change the path inside the `## Verification` fenced `verify` block to `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`. Leave the `## Verification` H2 where it sits (between Unit 1 and Unit 2 — unusual placement, but the heading level is what's load-bearing and it is correct).
2. In the same edit, update Unit 2's **Scope** line, which still names the monolith, to the same per-SUT file. Its **Reuse** line is also stale by one hop: `sel_tick_setup` is in `test-dispatch-select-tick.sh`, and the `rl_setup` dead-session-sweep reference test is now in `test-lib-reservation-ledger.sh`. Prose only — non-blocking, but fix it while you are here.
3. Land that with `graph-commit` (run the worktree-local copy of the script). Clear the provision-conflict hold / `office_hours` park in the same pass; `phase` stays `qa`.
4. Re-run `/dispatch-conflict tactic-manual-path-reservation-sweep`. The merge is now mechanical: re-apply the two resolutions described above.
5. Confirm the lane's verify step exits 0 this time. It runs in the merged node worktree, so `test-dispatch-select-tick.sh` should reproduce 189/189 with both ported tests present.
6. Push, so GitHub recomputes `mergeable` on PR #2964.

## Follow-up worth filing separately

This node is the first casualty of a class, not a one-off. 19 non-done intention nodes on `origin/main` still name the deleted monolith, and 11 of them carry it **inside a `verify` fence** — including in-flight nodes at `implement` (`tactic-graph-ref-split`, `tactic-office-hours-drain-claim`, `tactic-worker-self-close-configurable`, `tactic-legacy-office-hours-entry-removal`, `tactic-graph-auto-merge-up-to-date-gate`), `qa` (`tactic-qa-main-park-base-cas`, `tactic-graph-select-target-node-tests`), `review` (`tactic-align-tactics-tactic-mode-drift-gate`), and `main-qa` (`tactic-explicit-node-reservation-sweep-policy`, `tactic-graph-tick-node-lane-auto-merge`). Each will park the same way at its own merge or QA gate.

The root cause is a scoping call in `tactic-dispatch-test-monolith-split`'s Unit 3, which declared `intentions/*.md` bodies out of scope as "historical records." That holds for `done` nodes; it is wrong for non-done ones, whose `verify` fences are executable contracts, not history. A sweep tactic that repoints the dead path in every non-done node's verify block would clear the remaining 10. Out of scope for this hold — do not widen this pass.

The `blocked_by` edge on `tactic-manual-path-reservation-sweep` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

