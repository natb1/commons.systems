---
id: tactic-fix-interrupt-attempt-cap
kind: tactic
statement: "Bound the node-lane CI-fix interrupt with a retry cap: increment
  execution.attempts.fix per /fix-checks iteration and park to office_hours once
  it exceeds a threshold, restoring the escalation the legacy
  dispatch:fix-checks-attempt-<n> label lane provided"
owner: ai
status: codified
parent: null
rationale: The node-lane fix interrupt's attempt counter
  (execution.attempts.fix, via the already-unit-tested but never-called
  incrementAttempt helper) was dead code carried over from a pre-router-v2
  module (apply-fix-state.ts) that no longer exists. Without it, a
  persistently-red tactic PR is re-selected into /fix-checks forever with no
  office-hours escalation, unlike the legacy issue lane's 3-attempt cap.
  Verified 2026-07-19 against the current router-v2 architecture (transitions.ts
  / apply-node-transition.ts / transition-node) that the bug is real and unfixed
  in its new location, not superseded by tactic-router-failure-fuses (a distinct
  silent-worker-death fuse, not a live-retry-loop cap).
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Bound the node-lane CI-fix interrupt with a retry cap: increment execution.attempts.fix per /fix-checks iteration and park to office_hours once it exceeds a threshold, restoring the escalation the legacy dispatch:fix-checks-attempt-<n> label lane provided

## Context

The node-lane CI-fix interrupt (`fix` phase, `strategy clarification 18`) has no
retry cap. A tactic whose PR stays red across repeated `/fix-checks` passes
(a recurring "generic no-repro", or a fix that never actually greens CI) is
re-selected and re-dispatched to `/fix-checks` every tick forever, with no
office-hours escalation — a regression from the legacy issue lane, which caps
retries at 3 via `dispatch:fix-checks-attempt-<n>` labels and escalates through
the Stop hook (`.claude/skills/fix-checks/SKILL.md` Step 5).

This finding originates from `/review-fix` on PR #2905
(`tactic-fix-interrupt-orthogonal-state`), which located the gap in a
now-superseded module (`apply-fix-state.ts` / `_gate_fix_active`,
`graph-select-target:283`) that no longer exists — the router v2 rewrite
(`tactic-graph-router-transitions`) relocated the fix-interrupt decision to
`packages/intentionsutil/src/transitions.ts`'s `decideTransition` /
`incrementAttempt` and the `execution.attempts: Record<string, number>` map
(`schema.ts`'s `Execution` type). The underlying bug carried over unchanged
into the new location: `incrementAttempt` is defined and unit-tested
(`transitions.test.ts:207-211`) but has **zero** production callers —
`apply-node-transition.ts` never calls it — and nothing anywhere reads
`execution.attempts.fix` to bound retries. This unit re-locates the fix to the
current architecture.

**Current flow (verified 2026-07-19 against this worktree):**

- `decideTransition` (`packages/intentionsutil/src/transitions.ts:173-212`)
  is the pure phase-ladder decision. Its `phase === "fix"` branch (lines
  202-210) either resumes forward on green CI or "stays in fix" on
  anything else (`unknown`/`failing`) — unconditionally, with no attempt
  accounting.
- `applyNodeTransition` (`packages/intentionsutil/scripts/apply-node-transition.ts:163-230`)
  is the impure mutation layer: it calls `decideTransition`, applies marker
  writes, and calls `writeNode`. It never touches `execution.attempts`.
- `.claude/skills/dispatch-propagate/scripts/transition-node` is the shell
  wrapper that reads the CI verdict via `gh` and invokes
  `apply-node-transition.ts`, then lands the result via `graph-commit`.
- `.claude/skills/fix-checks/SKILL.md`'s node-target lane (lines 58-80) calls
  `transition-node "$N" --set-pr "$PR_NUM"` **only on a clean fix (CI green
  after the push)** — "instead of `dispatch-mark-complete`". On every other
  outcome (generic no-repro, flake, main-already-fixed, or an actual fix that
  doesn't green CI), Step 9 (lines 419-428) runs unchanged: it writes only the
  `dispatch-mark-complete --phase fix-checks` job-dir marker (the Stop hook's
  silent-death backstop signal — unrelated to graph state) and stops.
  `transition-node` is never invoked on a still-red outcome, so
  `execution.attempts.fix` never advances and the node just sits at
  `phase: fix`, endlessly re-selectable (`graph-select-target`'s `fix|qa|review`
  sensor gate only checks CI *readiness*, not attempt count).

## Unit 1 — increment and cap the fix-attempt counter, call transition-node on every fix-checks completion

**Scope.**

1. `packages/intentionsutil/src/transitions.ts` — export a new constant next to
   `FIX_INTERRUPTIBLE` (line 95):
   ```ts
   /** Retry-cap parity with the legacy `dispatch:fix-checks-attempt-<n>` label lane (SKILL.md Step 5's `N < 3 ? N + 1 : 3`, escalating at >= 3). */
   export const FIX_ATTEMPT_CAP = 3;
   ```
   No change to `decideTransition` itself — the cap check reads `prevPhase`
   plus `decision.phase`, both already available to the caller, so the pure
   ladder decision does not need to know about attempts.

2. `packages/intentionsutil/scripts/apply-node-transition.ts`:
   - Import `incrementAttempt` and `FIX_ATTEMPT_CAP` from `../src/transitions.js`
     (extend the existing import block at lines 42-48).
   - Add a `--date <YYYY-MM-DD>` flag to `parseArgs` (alongside `--strategy-sha`
     at line 114): `case "--date": out.date = argv[++i]; break;`. Add
     `date: string | null` to the `Args` interface, defaulting to `null` in
     `parseArgs`'s initial `out`.
   - In `applyNodeTransition` (after the `const decision = decideTransition(...)`
     call at line 184, before the existing marker-writing block at line 196),
     insert the fix-attempt accounting. This is keyed on `prevPhase === "fix"`
     — that condition is true **only** when this call is itself the completion
     of an actual `/fix-checks` worker run (the *first* entry into `fix`, fired
     from `decideTransition`'s branch 3, always has `prevPhase !== "fix"` by
     construction of `FIX_INTERRUPTIBLE`, so it correctly never spends budget):
     ```ts
     let parked = false;
     if (prevPhase === "fix") {
       if (decision.phase === "fix") {
         // Still not green after this fix-checks worker's push — one attempt spent.
         execution = incrementAttempt(execution, "fix");
         if ((execution.attempts.fix ?? 0) >= FIX_ATTEMPT_CAP) {
           if (args.date === null) {
             throw new Error("apply-node-transition: --date is required to park at the fix-attempt cap");
           }
           parked = true;
         }
       } else {
         // Resumed onto the forward ladder — clear the spent retry budget.
         execution = { ...execution, attempts: { ...execution.attempts, fix: 0 } };
       }
     }
     ```
   - After the existing `if (decision.demote) {...} else if (!decision.hold) {...}`
     block (lines 211-216), add the office_hours write:
     ```ts
     if (parked) {
       node.office_hours = {
         reason: `/fix-checks: CI still ${args.ci} after ${FIX_ATTEMPT_CAP} fix-checks attempts (execution.attempts.fix=${execution.attempts.fix}) — retry budget exhausted, restoring the dispatch:fix-checks-attempt-<n> escalation.`,
         since: args.date as string,
         recommendation: `Review the PR's CI failures and the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree) to diagnose why ${FIX_ATTEMPT_CAP} automated attempts did not resolve it. Clear office_hours to resume automated fix-checks, or abandon/redesign the tactic if the current approach cannot work.`,
       };
     }
     ```
     Placement note: this does not conflict with the existing `demote`/`hold`
     branches — `decision.hold` is already `true` on the still-red path, so
     `node.phase` is correctly left unchanged (still `"fix"`); the router's
     eligibility gate (`router.ts:292`, `t.office_hours !== null`) is what
     actually removes the node from selection, no phase change needed.
   - Extend the `ApplyResult` interface (line 147) with `parked: boolean` and
     return it from `applyNodeTransition`.

3. `.claude/skills/dispatch-propagate/scripts/transition-node`:
   - Add `"--date" "$(date -u +%Y-%m-%d)"` to the `APPLY_FLAGS` array
     (unconditionally — harmless when no park fires).
   - After reading `HOLD` from `$RESULT` (line 157), also read
     `PARKED="$(jq -r '.parked' <<<"$RESULT")"`.
   - Before the existing `if [[ "$HOLD" == "true" ]]` block (line 184), add:
     ```bash
     if [[ "$PARKED" == "true" ]]; then
       echo "parked $NODE_ID at fix (attempt-cap exhausted)"
       exit 0
     fi
     ```
   - Update the header's "Stdout" doc comment (lines 36-41) to list the new
     `parked <id> at fix (attempt-cap exhausted)` outcome line.

4. `.claude/skills/fix-checks/SKILL.md`:
   - Rewrite the node-lane preamble (lines 58-80): replace the "on a clean fix
     (CI green after the push) the completion seam invokes ... instead of ...
     `dispatch-mark-complete`" framing with: the completion seam calls
     `transition-node "$N" --set-pr "$PR_NUM"` **unconditionally, on every
     outcome that reaches Step 9** (not gated on CI verdict — `transition-node`
     reads the live CI verdict itself and either resumes the ladder or records
     a spent fix-attempt) — **in addition to** Step 9's `dispatch-mark-complete`
     call, not instead of it (that marker is the Stop hook's silent-death
     backstop signal, unrelated to graph state, per
     `.claude/hooks/dispatch-stop.sh`'s header comment — leave it untouched).
   - Update Step 9 (lines 419-428) to add the node-lane branch: after the
     existing `dispatch-mark-complete` call, for `TARGET_KIND=node` only, add:
     ```bash
     .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"
     ```
     This runs for every outcome that reaches Step 9 — i.e. every outcome
     except needs-human, matching legacy Step 5's exclusion (needs-human
     parks separately via the job-dir `office-hours-reason` sentinel before
     Step 9 and never touches the retry counter, unchanged by this unit).

**Recommended model:** sonnet — the design and exact insertion points are fully
specified above; the remaining work is mechanical (apply the edits, run tests).

**Dependencies:** none.

## Reuse

- `incrementAttempt` (`packages/intentionsutil/src/transitions.ts:242-245`) —
  already exists, already unit-tested; this unit is what finally calls it.
- `router.ts`'s existing `office_hours !== null` eligibility gate
  (`packages/intentionsutil/src/router.ts:292`) — no new selection-side gate
  needed; setting `office_hours` is sufficient to stop reselection.
- The `office_hours: {reason, since, recommendation}` shape and the
  `park-node` script's `date -u +%Y-%m-%d` convention
  (`packages/intentionsutil/scripts/park-node:38`) — reused for the `since`
  format and the reason/recommendation split, without calling `park-node`
  itself (the write folds into `apply-node-transition.ts`'s existing single
  `writeNode` + the wrapper's existing single `graph-commit`, avoiding a
  second write).

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

Manual / prose:

- Confirm `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes
  (no schema regressions from the `Execution`/`ApplyResult` shape changes —
  `attempts` was already `Record<string, number>`, so no schema.ts edit is
  needed).
- Add/extend `packages/intentionsutil/test/apply-node-transition.test.ts` cases
  (parity with the file's existing `applyNodeTransition` walk-the-ladder style,
  using `seedTactic(dir, "fix", ...)` to start directly in `fix`):
  - Three consecutive `applyNodeTransition({..., ci: "failing"})` calls from a
    `fix`-phase seed increment `execution.attempts.fix` 1, 2, 3, and the third
    call's result has `parked: true` with `node.office_hours` set (`reason`,
    `since` matching the passed `--date`, non-null `recommendation`).
  - The *first* interrupt entry (`seedTactic(dir, "review", ...)` +
    `ci: "failing"`) leaves `execution.attempts` empty — entering `fix` never
    spends budget.
  - A resume (`ci: "passing"` while already `phase: "fix"` with a nonzero
    `attempts.fix`) resets `attempts.fix` to `0`.
  - `parseArgs` accepts `--date <YYYY-MM-DD>`.
- Interactively re-read the edited `.claude/skills/fix-checks/SKILL.md`
  node-lane section end to end once, confirming Step 9's new node-lane branch
  reads correctly alongside the existing `dispatch-mark-complete` call and the
  needs-human exclusion (Step 4) is undisturbed.
- Observe in production: the next real node-lane tactic that regresses CI
  across 3 `/fix-checks` passes should land with `office_hours` set instead of
  being re-selected a 4th time — confirm via `graph-selection.jsonl`'s
  `skipped` entries citing that node id once parked (no code change needed if
  this is not directly observable pre-merge; note it as a production
  observation, not a blocking check).
