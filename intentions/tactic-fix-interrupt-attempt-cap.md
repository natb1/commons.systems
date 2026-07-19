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

- `decideTransition` (`packages/intentionsutil/src/transitions.ts:173-223`)
  is the pure phase-ladder decision. Its `phase === "fix"` branch (lines
  202-210) either resumes forward on green CI or "stays in fix" on
  anything else (`unknown`/`failing`) — unconditionally, with no attempt
  accounting. Its strategy-soft-freeze branch (branch 2, lines 189-192) also
  returns `phase: prevPhase` unchanged when `strategyStale` — so a hold at
  `fix` for a soft-freeze and a hold at `fix` for genuine still-red CI are
  **not** distinguishable from `decision.phase` alone.
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

**A live-CI-verdict read cannot drive the spend decision — it is structurally
unreliable at the one call site that matters.** An earlier draft of this unit
tried keying the spend on `decideTransition`'s live `args.ci` (spend only on a
*concluded* `"failing"` verdict, to avoid counting a still-`"unknown"`/pending
push as a wasted attempt). That is wrong in the opposite, more damaging
direction: `/fix-checks`'s node-lane Step 9 calls `transition-node`
**immediately** after pushing a fix — `run-pr-checks-wait.sh` (SKILL.md Step 3)
only waited on the *pre-fix* checks that routed the tactic into `fix-checks` in
the first place; nothing waits for the *new* commit's checks before Step 9.
GitHub check runs do not conclude within the same session turn
(`lib.sh:683-736`'s `dispatch_ci_verdict_rest` explicitly documents `pending` —
"no verdict yet: empty rollup, in-progress checks..." — as the expected
just-after-push state), so `dispatch_ci_verdict_rest` on the fresh head sha
reads `pending` → `CI="unknown"` (`transition-node:111-115`) at essentially
every Step-9 call that follows a push (the `fixed` and `main-fixed` outcomes).
Gating the spend on `args.ci === "failing"` therefore means the counter
**almost never increments** for a tactic that keeps producing (bad) fixes each
round — exactly reintroducing this tactic's own bug, just relocated. Only the
no-push outcomes (`generic`, `flake` — nothing changed since Step 3's
already-concluded read) would ever supply a reliable `"failing"` verdict at
Step 9, so a chain of unsuccessful-but-pushing attempts would run unboundedly
uncounted.

The fix: decouple "was a retry budget unit spent" from any live CI read
entirely, mirroring how the **legacy** lane actually works — its Step 5
increments the `dispatch:fix-checks-attempt-<n>` label **before** Step 6's
push, unconditionally, for every outcome that reaches it (`SKILL.md:352-364`).
Parity means the same here: the *caller* (`/fix-checks`'s node-lane Step 9)
explicitly signals "this run consumed a retry" via a new CLI flag, independent
of whatever CI verdict happens to be live at that instant. See Unit 1 item 2
below.

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
   - Add two flags to `parseArgs` (alongside the `--strategy-stale`/`--set-pr`
     cases): `--date <YYYY-MM-DD>` (`case "--date": out.date = argv[++i];
     break;`) and `--fix-attempt-spent` (a bare boolean flag, same shape as
     the existing `--scope-stale`/`--strategy-stale` cases: `case
     "--fix-attempt-spent": out.fixAttemptSpent = true; break;`). Add
     `date: string | null` (default `null`) and `fixAttemptSpent: boolean`
     (default `false`) to the `Args` interface and `parseArgs`'s initial `out`.
   - In `applyNodeTransition` (after the `const decision = decideTransition(...)`
     call at line 184, before the existing marker-writing block at line 196),
     insert the fix-attempt accounting:
     ```ts
     let parked = false;
     if (prevPhase === "fix" && !args.strategyStale) {
       if (decision.phase === "fix") {
         if (args.fixAttemptSpent) {
           execution = incrementAttempt(execution, "fix");
           if ((execution.attempts.fix ?? 0) >= FIX_ATTEMPT_CAP) {
             if (args.date === null) {
               throw new Error("apply-node-transition: --date is required to park at the fix-attempt cap");
             }
             parked = true;
           }
         }
       } else {
         // Resumed onto the forward ladder (ci concluded passing) — clear the
         // spent retry budget for the tactic's next CI regression.
         execution = { ...execution, attempts: { ...execution.attempts, fix: 0 } };
       }
     }
     ```
     **Why `--fix-attempt-spent` is an explicit flag, not derived from
     `args.ci`:** the live CI verdict at this call site is structurally
     unreliable for the spend decision (see the Context section above) —
     `/fix-checks` calls this immediately after pushing a fix, before that
     push's own checks have had any chance to conclude. The flag lets the
     *caller* (Unit 1 item 4, which classifies the outcome directly) say "one
     retry was consumed this run" independent of the live-read noise, exactly
     mirroring legacy Step 5's before-the-push, unconditional-per-outcome
     increment. The RESUME/reset branch (`else`, `decision.phase !== "fix"`)
     stays keyed on `decision.phase`/live CI as before — that *is* reliable,
     because resume only ever fires once CI has genuinely concluded passing at
     whatever later dispatch cycle observes it; there is no "immediately after
     a push" race on the resume path the way there is on the spend path.
     `prevPhase === "fix"` still guards the whole block so the *first* fix
     interrupt entry (fired from a non-fix phase's own completion, branch 3,
     `prevPhase !== "fix"` by construction of `FIX_INTERRUPTIBLE`) never spends
     or resets budget it was never asked to touch. `!args.strategyStale`
     excludes a strategy-soft-freeze hold — branch 2 returns `phase: prevPhase`
     (`"fix"` when `prevPhase === "fix"`) *before* branch 4 ever runs, and a
     soft-freeze is not a fix-checks completion at all (`--fix-attempt-spent`
     would never be passed alongside `--strategy-stale` in practice, since
     they come from different call sites, but the guard makes the invariant
     explicit rather than relying on caller discipline).

     **Accepted tradeoff:** because the spend is unconditional-per-run (not
     gated on that run's own push having concluded), a genuinely-good fix
     pushed on the cap'th attempt can hit the cap and park before its CI has
     a chance to conclude green — the same outcome the legacy lane also
     produces (its Stop-hook escalation reads the durable phase-label state
     immediately at session end too, not a freshly-concluded verdict). This is
     self-correcting and cheap: the office_hours reason names the PR, a human
     glancing at its CI tab sees it went green and clears `office_hours`
     (`intentions/tactic-graph-native-dispatch.md` §1.3 — any interactive
     commit touching the node clears the park). The alternative (gating the
     spend on a concluded verdict) is not a smaller-cost tradeoff — it is a
     correctness bug (see Context above): the counter would almost never
     advance for a repeatedly-pushing tactic, silently reintroducing this
     tactic's own bug.
   - After the existing `if (decision.demote) {...} else if (!decision.hold) {...}`
     block (lines 211-216), add the office_hours write:
     ```ts
     if (parked) {
       node.office_hours = {
         reason: `/fix-checks: ${FIX_ATTEMPT_CAP} fix-checks attempts consumed (execution.attempts.fix=${execution.attempts.fix}) with the tactic still in fix — retry budget exhausted, restoring the dispatch:fix-checks-attempt-<n> escalation.`,
         since: args.date as string,
         recommendation: `Check the PR's current CI status first — the cap can trip on a just-pushed fix before its checks conclude, in which case this may already be resolved. If CI is still red, review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree) to diagnose why ${FIX_ATTEMPT_CAP} automated attempts did not resolve it. Clear office_hours to resume automated fix-checks, or abandon/redesign the tactic if the current approach cannot work.`,
       };
     }
     ```
     Placement note: this does not conflict with the existing `demote`/`hold`
     branches — on the still-in-fix path `decision.hold` is `true`, so
     `node.phase` is correctly left unchanged (still `"fix"`); the router's
     eligibility gate (`router.ts:292`, `t.office_hours !== null`) is what
     actually removes the node from selection, no phase change needed.
   - Extend the `ApplyResult` interface (line 147) with `parked: boolean` and
     return it from `applyNodeTransition`.

3. `.claude/skills/dispatch-propagate/scripts/transition-node`:
   - Add `"--date" "$(date -u +%Y-%m-%d)"` to the `APPLY_FLAGS` array
     (unconditionally — harmless when no park fires). Add a new optional CLI
     flag on `transition-node` itself, `--fix-attempt-spent`, that the caller
     (Unit 1 item 4) passes through: parse it alongside the existing `--set-pr`
     handling, and when present append `"--fix-attempt-spent"` to
     `APPLY_FLAGS`.
   - After reading `HOLD` from `$RESULT` (line 157), also read
     `PARKED="$(jq -r '.parked' <<<"$RESULT")"`.
   - Before the existing `if [[ "$HOLD" == "true" ]]` block (line 184), add:
     ```bash
     if [[ "$PARKED" == "true" ]]; then
       echo "parked $NODE_ID at fix (attempt-cap exhausted)"
       exit 0
     fi
     ```
   - Cosmetic but worth doing while touching this code: the existing
     `graph-commit -m "graph: transition $NODE_ID to $NEW_PHASE" "$NODE_ID"`
     call (line 167) runs unconditionally, before the `PARKED` check — on a
     parked outcome `NEW_PHASE` is still `"fix"`, so the landed commit message
     would misleadingly read `graph: transition <id> to fix` for what is
     actually an office-hours park. Compute the commit message conditionally:
     `graph: park <id> at fix (attempt-cap)` when `$PARKED == true`, else the
     existing `graph: transition <id> to $NEW_PHASE` message.
   - Update the header's usage/doc comments (the `Usage:` line at 34 and the
     "Stdout" doc comment at lines 36-41) to document the new
     `--fix-attempt-spent` flag and the new `parked <id> at fix (attempt-cap
     exhausted)` outcome line.

4. `.claude/skills/fix-checks/SKILL.md`:
   - Rewrite the node-lane preamble (lines 58-80). Remove the fenced
     ```bash
     .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"
     ```
     command block at lines 73-75 entirely (convert that paragraph to prose
     only, with no executable command) — Step 9 below becomes the **sole**
     `transition-node` call site for the node lane. Leaving both the preamble's
     command and Step 9's new command as live call sites would run
     `transition-node` twice per pass on a clean fix, double-incrementing (or
     double-resetting) `execution.attempts.fix` in one run. Replace the "on a
     clean fix (CI green after the push) the completion seam invokes ...
     instead of `dispatch-mark-complete`" framing with prose describing what
     Step 9 now does (below) — the completion seam calls `transition-node`
     **unconditionally, on every outcome that reaches Step 9** (not gated on
     CI verdict — `transition-node` reads the live CI verdict itself and
     either resumes the ladder or, when `--fix-attempt-spent` is passed,
     records a spent fix-attempt) — **in addition to** Step 9's
     `dispatch-mark-complete` call, not instead of it (that marker is the Stop
     hook's silent-death backstop signal, unrelated to graph state, per
     `.claude/hooks/dispatch-stop.sh`'s header comment — leave it untouched).
   - Update Step 9 (lines 419-428) to add the node-lane branch: after the
     existing `dispatch-mark-complete` call, for `TARGET_KIND=node` only, add:
     ```bash
     .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM" --fix-attempt-spent
     ```
     This is the **sole** node-lane `transition-node` call site (the
     preamble's is removed per above) and runs for every outcome that reaches
     Step 9 — i.e. every outcome except needs-human, matching legacy Step 5's
     exclusion (needs-human parks separately via the job-dir
     `office-hours-reason` sentinel before Step 9 and never touches the retry
     counter, unchanged by this unit). `--fix-attempt-spent` is passed
     unconditionally here because Step 9 is, by construction, never reached by
     needs-human — every outcome that gets this far is one of the four
     budget-consuming outcomes (`fixed`, `main-fixed`, `flake`, `generic`),
     exactly legacy Step 5's set.

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
  (`packages/intentionsutil/scripts/park-node:46`) — reused for the `since`
  format and the reason/recommendation split, without calling `park-node`
  itself (the write folds into `apply-node-transition.ts`'s existing single
  `writeNode` + the wrapper's existing single `graph-commit`, avoiding a
  second write).
- Legacy Step 5's exact outcome-set semantics
  (`.claude/skills/fix-checks/SKILL.md:352-364`) as the model for which
  outcomes pass `--fix-attempt-spent` — re-derived directly from that text
  rather than re-guessed, since the whole point of this unit is restoring
  that lane's parity.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

The typecheck run is required, not optional: `vitest` transpiles TypeScript via
esbuild (type-stripping, not type-checking), so adding a required `date`/
`fixAttemptSpent` field to the `Args` interface would NOT be caught by the
vitest run alone if the existing test file's `baseArgs` object (see below)
isn't updated to match — only `tsc` catches that.

Manual / prose:

- Confirm `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes
  (no schema regressions from the `Execution`/`ApplyResult` shape changes —
  `attempts` was already `Record<string, number>`, so no schema.ts edit is
  needed).
- `packages/intentionsutil/test/apply-node-transition.test.ts`'s `baseArgs`
  object (lines 46-60) has an explicit inline type annotation listing exactly
  `id, ci, scopeStale, strategyStale, setPr, strategyFingerprint` — every
  existing test spreads `{ ...baseArgs, dir, ... }`. Add `date: string | null`
  and `fixAttemptSpent: boolean` to that annotation and set `date: null,
  fixAttemptSpent: false` in the object literal, so the new required-shaped
  fields don't silently default to `undefined` at every existing call site.
- Add/extend `apply-node-transition.test.ts` cases (parity with the file's
  existing `applyNodeTransition` walk-the-ladder style, using
  `seedTactic(dir, "fix", ...)` to start directly in `fix`):
  - Three consecutive `applyNodeTransition({..., ci: "failing", date:
    "2026-01-01", fixAttemptSpent: true})` calls from a `fix`-phase seed
    increment `execution.attempts.fix` 1, 2, 3, and the third call's result
    has `parked: true` with `node.office_hours` set (`reason`, `since` ===
    `"2026-01-01"`, non-null `recommendation`).
  - The same three-call sequence but with `ci: "unknown"` instead of
    `"failing"` (simulating a just-pushed, not-yet-concluded check) still
    increments identically and still parks on the third call — proving the
    spend is driven by `fixAttemptSpent`, not by the live CI verdict.
  - Calling `applyNodeTransition({..., ci: "failing", fixAttemptSpent:
    false})` from a `fix`-phase seed leaves `execution.attempts` untouched —
    a `transition-node` call that doesn't originate from `/fix-checks`'s Step
    9 (the flag omitted) never spends budget.
  - The *first* interrupt entry (`seedTactic(dir, "review", ...)` +
    `ci: "failing", fixAttemptSpent: true`) leaves `execution.attempts` empty
    — entering `fix` for the first time never spends budget regardless of the
    flag, because `prevPhase !== "fix"`.
  - A resume (`ci: "passing"` while already `phase: "fix"` with a nonzero
    `attempts.fix`) resets `attempts.fix` to `0`, with or without
    `fixAttemptSpent` set (resume is not itself a spend).
  - `applyNodeTransition({..., phase: "fix" seed, strategyStale: true, ci:
    "failing", fixAttemptSpent: true})` leaves `execution.attempts`
    untouched — a soft-freeze hold is excluded from spend accounting.
  - `parseArgs` accepts `--date <YYYY-MM-DD>` and the bare `--fix-attempt-spent`
    flag.
- Interactively re-read the edited `.claude/skills/fix-checks/SKILL.md`
  node-lane section end to end once, confirming: the preamble's old fenced
  `transition-node` command block is gone (prose only), Step 9's new
  node-lane branch is the sole call site and reads correctly alongside the
  existing `dispatch-mark-complete` call, and the needs-human exclusion
  (Step 4) is undisturbed.
- Observe in production: the next real node-lane tactic that regresses CI
  across 3 `/fix-checks` passes should land with `office_hours` set instead of
  being re-selected a 4th time — confirm via `graph-selection.jsonl`'s
  `skipped` entries citing that node id once parked (no code change needed if
  this is not directly observable pre-merge; note it as a production
  observation, not a blocking check). Also watch for the accepted tradeoff
  named above (a good late fix parked before its CI concludes) — if that
  proves to happen often in practice rather than being a rare edge case, that
  is a signal for a follow-up unit, not a defect in this one.
