---
id: tactic-hold-conflict-autonomous-ci-pending-liveness-bound
kind: tactic
statement: "hold: provision-conflict on
  `tactic-autonomous-ci-pending-liveness-bound` — a tracked hold blocking the
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
  hold_for: tactic-autonomous-ci-pending-liveness-bound
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-autonomous-ci-pending-liveness-bound

## Resolved 2026-08-30 — the branch was abandoned, not merged

This hold is **discharged**, and the steps below are history. Read this section
before any of them.

The hold tracked a `/dispatch-conflict` Lane 3 failure: `origin/main` could not be
merged into `tactic-autonomous-ci-pending-liveness-bound`'s branch (PR #3002)
because a sibling relocated the hold-kind vocabulary into a module that was not
itself in the conflicted set. The resolution taken was not to resolve the merge.
PR #3002 was closed unmerged and its source node reset to `phase: null`, so the
router re-plans it from its own body on a fresh branch off `origin/main` — where
there is no conflict to resolve at all.

**Steps 1-3 below are superseded.** They tell you which side of each conflicted
file to take; there is no conflict. Their *substance* — where the vocabulary now
lives, and the `KIND_RECHECK` decision the original plan never made — was carried
over, re-verified against current `origin/main`, and now lives on the source node
as its `## Re-landing brief` section. That is the live document; this one is an
archive.

One thing settled here and worth not losing: `ci-pending-stalled`'s `KIND_RECHECK`
entry is ruled **`policy: "manual"`**. The reasoning is in Step 2 below and is
restated, with corrected anchors, in the source node's brief.


## Context

`tactic-autonomous-ci-pending-liveness-bound` hit a mechanical retry state (`provision-conflict`) on 2026-08-09. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-autonomous-ci-pending-liveness-bound`) carries the park, and `tactic-autonomous-ci-pending-liveness-bound` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

`/dispatch-conflict` Lane 3 could not autonomously merge origin/main into this
node's own branch (PR #3002). The merge conflicted in 5 files; 4 are mechanical,
but `packages/intentionsutil/scripts/hold-node-decide.ts` cannot be resolved by
editing the conflicted files alone: a sibling tactic on origin/main
(`tactic-stale-hold-auto-resolve`) relocated the hold-kind vocabulary this
tactic's Unit 1 extends into a new shared module,
`packages/intentionsutil/src/holds.ts`, which is not itself in the conflicted
set and which also added a new mandatory per-kind re-check classification
(`KIND_RECHECK`) this tactic's plan never decided a value for. See the attached
recommendation for the concrete re-landing steps and the specific decision
needed.

## How to resolve

## What is blocking

`/dispatch-conflict` Lane 3 merged `origin/main` into `tactic-autonomous-ci-pending-liveness-bound`'s branch (PR #3002) and aborted: five files conflicted, four are mechanical, and the fifth cannot be resolved by editing conflicted files at all.

The blocker is `packages/intentionsutil/scripts/hold-node-decide.ts`. While this branch was open, a sibling tactic on main (`tactic-stale-hold-auto-resolve`) moved the entire hold-kind vocabulary — `HOLD_KINDS`, `KIND_SLUGS`, `isHoldKind`, `RESERVED_KIND_SLUGS`, `holdIdFor`, `RESOLUTION_SENTENCE` — out of `hold-node-decide.ts` into a new shared module, `packages/intentionsutil/src/holds.ts`. `hold-node-decide.ts` now just imports and re-exports those names (main's lines 34-52).

Main did **not** implement this tactic's hold kind. `HOLD_KINDS` on main today is exactly `["provision-conflict", "fix-attempt-cap", "worktree-residue"]` — no `ci-pending-stalled`. So taking main's side of the `hold-node-decide.ts` conflict, which is the only resolution expressible by editing the five conflicted files (`holds.ts` is not among them — it is new-on-main, so git never marked it conflicted), silently deletes Unit 1: no `ci-pending-stalled` member, no `ci-stalled` slug, `hold-node --kind ci-pending-stalled` exits 2, and the already-reconciled Unit 2/3 hold producers call a kind that does not exist.

## Step 1 — re-land Unit 1 into `holds.ts`, not `hold-node-decide.ts`

Unit 1's edits go to their new home. In `packages/intentionsutil/src/holds.ts` (line numbers are main's):

- `HOLD_KINDS` (line 36) — add `"ci-pending-stalled"`.
- `KIND_SLUGS` (line 44) — add `"ci-pending-stalled": "ci-stalled"`.
- The reserved-slug doc comment above `HOLD_KINDS` (lines 12-35) — add the `ci-stalled` bullet in the style of the existing `conflict` / `fix-cap` / `residue` bullets, marked IMPLEMENTED, saying what the tracked condition is: the PR's CI verdict has stayed pending across `DISPATCH_CI_PENDING_STRIKE_CAP` (8) consecutive observations of the same head SHA.
- The `no-progress` footnote (lines 30-34) — the plan's Unit 1 wanted this reservation note updated so `ci-stalled` and the reserved `no-progress` fuse are not confused for each other. Keep `no-progress` in `RESERVED_KIND_SLUGS` (line 60); `ci-stalled` moves from "reserved namespace" to "implemented producer".

Then take main's side wholesale in `hold-node-decide.ts` — its import/re-export block needs no change — and update only the usage strings, which the plan already scoped:

- `packages/intentionsutil/scripts/hold-node-decide.ts:21` and `:246` — `<provision-conflict|fix-attempt-cap|worktree-residue|ci-pending-stalled>`.
- `packages/intentionsutil/scripts/hold-node:35` and the `USAGE=` at `:64`.
- `packages/intentionsutil/scripts/resolve-hold:78` and the `USAGE=` at `:122` (see step 3 — this file also carries main's new `--hold-id` addition).

## Step 2 — the decision this plan never made: `ci-pending-stalled`'s `KIND_RECHECK` entry

`holds.ts` also added something that did not exist when this tactic was planned: `KIND_RECHECK: Record<HoldKind, HoldRecheck>` (line 117), the per-kind auto-resolve classification. The `Record<HoldKind, …>` type is load-bearing — adding a member to `HOLD_KINDS` without a matching entry fails typecheck. So this is not optional cleanup; step 1 does not compile without it, and the plan gives no answer.

The type offers two shapes:

```ts
type HoldRecheck =
  | { policy: "auto"; predicate: "worktree-clean" }
  | { policy: "manual"; why: string };
```

The reasoning, for you to confirm or refine rather than accept as settled: a `ci-pending-stalled` hold's tracked condition is "the PR's CI verdict is still pending on the same head SHA." That is not the shape of an auto entry. `worktree-residue` is `auto` because "is the worktree clean?" is a local, single-call, network-free predicate the sweep can run on every hold every tick. Deciding whether CI concluded means fetching a live PR verdict from GitHub — a network call, rate-limit-consuming, and one whose answer can legitimately still be "pending" forever, which is the exact condition being held on. It reads much more like the existing manual entries: `provision-conflict`'s ("resolving a content conflict against a moving main is a session's job"), and `fix-attempt-cap`'s ("the cap is exhausted attempts, not an observable external condition; re-checking would mean re-running CI, which is not a predicate"). `ci-pending-stalled` is closest to `fix-attempt-cap` — both fire on an exhausted strike ladder, not on an externally observable state flip.

Two mechanical facts that back this up, and that you should weigh before choosing `auto`:

1. The `auto` arm's `predicate` field is a closed union with exactly one member, `"worktree-clean"`. An `auto` classification for this kind means widening that union with a new predicate and implementing it in the sweep consumer (`packages/intentionsutil/src/hold-sweep.ts`, which gates on `KIND_RECHECK[kind].policy === "auto"` at line 131, and `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh`). That is a second tactic's worth of work, not a line in this merge.
2. `packages/intentionsutil/test/holds.test.ts` asserts `has exactly one auto-re-checkable kind` — `expect(auto).toEqual(["worktree-residue"])`. A `manual` entry keeps that test green as-is. An `auto` entry requires changing that assertion too, which is a deliberate doctrine change, not a merge resolution.

Suggested entry, if you agree with the framing:

```ts
"ci-pending-stalled": {
  policy: "manual",
  why:
    "checking whether CI concluded requires a live PR-verdict fetch, not a " +
    "local predicate the auto-resolve sweep can run without a network call; " +
    "and the hold fires on an exhausted strike ladder, not on a condition " +
    "that flips back on its own",
},
```

Refine the `why` wording if you have a better account — the field is read by humans in the office-hours queue, and `packages/intentionsutil/test/holds.test.ts` only asserts it is non-empty.

One downstream consequence to be aware of, not a blocker: `packages/intentionsutil/src/hold-alerts.ts` alerts on `manual`-policy holds that sit unclaimed while blocking a top-ranked source. A `manual` classification means `ci-pending-stalled` holds will surface in unclaimed-hold alerting alongside `provision-conflict` and `fix-attempt-cap`. That is almost certainly the behavior you want — a stalled-CI hold is exactly the kind of thing that should get noticed if nobody picks it up — but its doc comment at `hold-alerts.ts:12-14` names today's two manual kinds inline and will read stale.

## Step 3 — the other four files are mechanical and do not wait on the decision

All four were reviewed and are cleanly reconcilable. Resolve them as described whenever you pick this up:

1. `.claude/skills/dispatch-propagate/scripts/graph-select-target` — header-comment block; both sides appended a different paragraph. Union both, renumber.
2. `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh` — both sides appended a distinct test block at end-of-file. Keep both.
3. `packages/intentionsutil/scripts/resolve-hold` — usage-string conflict only: the branch added `|ci-pending-stalled` to `--kind`, main added `[--hold-id <hold-node-id>]`. Union: keep both, in both the header comment (`:78-79`) and `USAGE=` (`:122`).
4. `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall` — eight conflict blocks, mechanical but structurally involved. Main (via a third sibling tactic, `tactic-graph-router-conflict-routing`) retired this sweep's conflict-hold route entirely; it is now a deliberate no-op and the sweep's graph-commit budget dropped back to one. The branch's ci-stall route is independent and survives that retirement. Take main's retired-conflict-arm side, drop `CONFLICT_IDS` / `CONFLICT_NOTES` and the conflict half of the shared-slot guard, keep the `CI_STALL_*` arrays and the ci-stall hold block, give that block its own `mktemp` scratch dir (it had been sharing the now-retired conflict block's), and restate the lock-budget comment as "one batched `--set-fix` commit plus at most one ci-stall hold" — it is no longer split between two hold routes.

Verification once merged: `npx vitest run --project intentionsutil --root .` (covers `packages/intentionsutil/test/holds.test.ts`), the repo typecheck (this is what catches a missing `KIND_RECHECK` entry), and `.claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh`. Sanity-check the new kind end to end with `hold-node <some-source> --kind ci-pending-stalled …` deriving `tactic-hold-ci-stalled-<source>`.

## Closing

Once you have resolved this, re-run `/dispatch-conflict` against `tactic-autonomous-ci-pending-liveness-bound`, or resolve the merge by hand on the branch and push. Then resolve **this hold tactic** to `phase: done` and prune it — clearing `office_hours` alone does not unblock the source.

The `blocked_by` edge on `tactic-autonomous-ci-pending-liveness-bound` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

