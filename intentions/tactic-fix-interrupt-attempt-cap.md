---
id: tactic-fix-interrupt-attempt-cap
kind: tactic
statement: "Bound the node-lane CI-fix interrupt with a retry cap: spend
  execution.fix.attempt once per completed /fix-checks pass and park to
  office_hours when the capped attempt concludes red, restoring the escalation
  the legacy dispatch:fix-checks-attempt-<n> label lane provided"
owner: ai
status: codified
parent: null
rationale: "The node-lane fix interrupt has no retry cap: a persistently-red
  tactic PR is re-selected into /fix-checks forever with no office-hours
  escalation, unlike the legacy issue lane's 3-attempt cap. Re-planned
  2026-07-19 against the post-PR-#2905 architecture (the orthogonal
  execution.fix FixState; the prior plan targeted the superseded
  phase-becomes-fix model in transitions.ts/apply-node-transition.ts). Verified
  in this worktree: FixState.attempt exists (schema.ts) but only apply-fix-state
  --set-fix ever writes it (entry / defensive double-call);
  graph-select-target's _gate_fix_active still-red branch re-emits fix
  unconditionally forever; nothing reads attempt to cap retries; and the fix
  worker's no-push outcomes (generic no-repro, flake) make no graph write at
  all, so counting must be a worker-side spend per completed pass, not a
  selector-side sha observation."
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
# Bound the node-lane CI-fix interrupt with a retry cap: spend execution.fix.attempt once per completed /fix-checks pass and park to office_hours when the capped attempt concludes red, restoring the escalation the legacy dispatch:fix-checks-attempt-<n> label lane provided

## Context

The node-lane CI-fix interrupt has no retry cap. A tactic whose PR stays red
across repeated `/fix-checks` passes (a recurring generic no-repro, or fixes
that never green CI) is re-selected and re-dispatched to `/fix-checks` every
tick forever, with no office-hours escalation — a regression from the legacy
issue lane, which caps retries at 3 via `dispatch:fix-checks-attempt-<n>`
labels and escalates through the Stop hook
(`.claude/skills/fix-checks/SKILL.md` Step 5).

This plan was re-authored 2026-07-19 (a per-node `/align-tactics` re-plan)
because the prior plan targeted the pre-PR-#2905 architecture — a
`phase`-becomes-`"fix"` model routed through `transitions.ts`'s
`decideTransition` and `apply-node-transition.ts`. PR #2905 ("Model the CI-fix
interrupt as orthogonal execution state, not a phase value", merged
2026-07-18) replaced that model: `decideTransition` is now CI-blind (its own
header says so), and the interrupt is carried on `execution.fix`
(`FixState { since, attempt, pushed_sha }`, `schema.ts:370-374`), owned by the
selector via `apply-fix-state.ts`.

**Current flow (verified 2026-07-19 in this worktree):**

- Entry: `graph-select-target`'s `_gate_maybe_interrupt`
  (`.claude/skills/dispatch-propagate/scripts/graph-select-target:237`) sees
  CONCLUDED-RED at an interruptible phase and runs
  `apply-fix-state --set-fix`, writing
  `execution.fix = { since, attempt: 1, pushed_sha: null }`
  (`packages/intentionsutil/scripts/apply-fix-state.ts:153-164`). Only a
  defensive double-call ever bumps `attempt` after that.
- Push recording: `/fix-checks`'s node-lane completion seam
  (`.claude/skills/fix-checks/SKILL.md:81-108`) runs
  `apply-fix-state --record-push <sha>` + `graph-commit` **only when the pass
  pushed a commit**. The no-push outcomes (generic no-repro, flake) make **no
  graph write at all** — the seam says so explicitly ("If this iteration
  pushed NOTHING ... make NO graph write").
- Retry loop: `_gate_fix_active` (`graph-select-target:257`) resolves on
  green (`--clear-fix` + re-review reset), holds on a pending recorded push
  (the `pushed_sha == _CI_HEAD` guard, line 276), and on the `*)` still-red
  case re-emits `"fix"` unconditionally forever (line ~283) — **the uncapped
  loop this tactic bounds**. Nothing anywhere reads `execution.fix.attempt`
  to cap retries or write `office_hours`.

**Design: worker-side spend, selector-side enforcement.**

- *Counting must be a worker-side write, once per completed `/fix-checks`
  pass.* A selector-side count (bumping in the `*)` branch per still-red tick)
  overcounts — the selector ticks repeatedly while one fix worker is still
  running, and the dispatcher's occupied-worktree skip happens after the gate.
  Keying the count on the recorded `pushed_sha` concluding red undercounts —
  the no-push outcomes never record a sha, so the recurring generic-no-repro
  loop (the motivating live case) would stay uncounted. The legacy lane counts
  per `/fix-checks` invocation, all outcomes that reach its Step 5; parity
  means the worker spends one budget unit at its completion seam for every
  outcome that reaches Step 9 (i.e. everything except needs-human, which
  stops at Step 4 and parks separately — the exact legacy exclusion).
- *Enforcement belongs in the selector's `*)` branch* — the sole CI-routing
  authority post-#2905. Parking there, at the moment the capped attempt's CI
  has actually CONCLUDED red, means the cap'th attempt's push still gets its
  chance to resolve green (`passing` → `--clear-fix`, budget irrelevant)
  before any park fires. This eliminates the prior plan's accepted tradeoff
  (a good final fix parked before its CI concluded) rather than accepting it.
- *`attempt` semantics (unchanged from `--set-fix`):* `attempt` is the number
  of the attempt currently armed — `--set-fix` writes 1 (first attempt armed),
  and each completed pass's spend increments it (the next attempt's number).
  The cap condition is therefore `attempt > FIX_ATTEMPT_CAP`: with a cap of 3,
  entry=1, spends after each pass make it 2, 3, then 4 — and 4 > 3 parks after
  exactly 3 completed passes, matching the legacy 3-attempt cap.
- *Park leaves the interrupt intact but resets the budget.* The park write
  sets `office_hours` (which alone removes the node from selection —
  `router.ts`'s §3.1 eligibility requires `office_hours` null, lines 197-203;
  no new selection-side gate is needed) and resets `fix.attempt` to 1, so a
  human clearing `office_hours` resumes automated fix-checks with a fresh
  budget instead of instantly re-parking on the next still-red tick. The
  consumed count is preserved in the `office_hours.reason` text.

## Unit 1 — apply-fix-state: `--spend-attempt` and `--park-if-capped` modes, `FIX_ATTEMPT_CAP`

**Scope.**

1. `packages/intentionsutil/src/transitions.ts` — export a new constant next
   to `FIX_INTERRUPTIBLE` (line 98):
   ```ts
   /** Retry-cap parity with the legacy `dispatch:fix-checks-attempt-<n>` label lane (fix-checks SKILL.md Step 5, escalating at 3 attempts). */
   export const FIX_ATTEMPT_CAP = 3;
   ```
   No other transitions.ts change — `decideTransition` stays CI-blind and
   fix-blind.

2. `packages/intentionsutil/scripts/apply-fix-state.ts` — add two modes to the
   existing mutually-exclusive mode set (`--set-fix | --clear-fix |
   --record-push`), following the file's existing `setMode` / `applyFixState`
   structure exactly:
   - **`--spend-attempt`** (mode `"spend"`): errors if `execution.fix` is null
     (mirror the `--record-push` null-interrupt guard, lines 193-197);
     otherwise writes `fix.attempt + 1` preserving `since`/`pushed_sha`.
     Result: `{ "mode": "spend", "id", "attempt": <new>, "wrote": true }`.
     Called by `/fix-checks`'s node-lane completion seam once per completed
     pass (Unit 3).
   - **`--park-if-capped`** (mode `"park-check"`): errors if `execution.fix`
     is null. If `fix.attempt > FIX_ATTEMPT_CAP` (import the constant from
     `../src/transitions.js`): set
     ```ts
     node.office_hours = {
       reason: `/fix-checks retry budget exhausted: ${consumed} attempts concluded with PR #${execution.pr ?? "?"} still red (execution.fix.attempt=${currentFix.attempt}, since ${currentFix.since}) — restoring the legacy dispatch:fix-checks-attempt-<n> escalation.`,
       since: todayUtc(),
       recommendation: `Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted as PR comments) to diagnose why ${FIX_ATTEMPT_CAP} automated attempts did not resolve CI. Clear office_hours to resume automated fix-checks with a fresh retry budget (attempt was reset to 1), or abandon/redesign the tactic if the current approach cannot work.`,
     };
     ```
     where `consumed = currentFix.attempt - 1`, AND reset
     `fix: { ...currentFix, attempt: 1 }` in the same write. Result:
     `{ "mode": "park-check", "id", "parked": true, "attempt": <consumed>, "wrote": true }`.
     If not capped: make **no write**; result
     `{ "mode": "park-check", "id", "parked": false, "wrote": false }`.
     Called by the selector's `*)` still-red branch (Unit 2). The
     `office_hours` shape `{reason, since, recommendation}` matches
     `park-node`'s write (`packages/intentionsutil/scripts/park-node:59-64`)
     and `schema.ts`'s validated field; `todayUtc()` already exists in this
     file (line 66).
   - Extend the header usage/doc comment and the `FixStateResult` interface
     (`parked?: boolean` for the park-check mode; `attempt` is already there).
   - Update `parseArgs`'s mode-required error message to name all five modes.

**Recommended model:** sonnet — insertion points and semantics fully specified;
the work is mechanical.

**Dependencies:** none.

## Unit 2 — graph-select-target: enforce the cap in `_gate_fix_active`'s still-red branch

**Scope.**

`.claude/skills/dispatch-propagate/scripts/graph-select-target`, the `*)` case
of `_gate_fix_active` (line ~283). Replace:

```bash
    *)
      # failing again (a fix attempt did not clear CI) → stay in fix, ready to
      # retry; do NOT re-clear or re-set anything.
      echo "fix"; return 0 ;;
```

with:

```bash
    *)
      # failing again (a fix attempt did not clear CI). Enforce the retry cap
      # before re-arming: once FIX_ATTEMPT_CAP completed passes have concluded
      # red, --park-if-capped writes office_hours (+ budget reset) and this
      # node leaves the eligible set; otherwise stay in fix, ready to retry.
      # Do NOT re-clear or re-set the interrupt itself.
      out=$(_apply_fix "$id" --park-if-capped 2>/dev/null) \
        || { echo "fix-cap-check-failed"; return 1; }
      if [[ "$(jq -r '.parked' <<<"$out" 2>/dev/null)" == "true" ]]; then
        if ! _graph_commit_fix "graph: park $id (fix-attempt cap exhausted)" "$id"; then
          echo "fix-cap-park-commit-failed"; return 1
        fi
        echo "fix-attempt-cap-parked"; return 1
      fi
      echo "fix"; return 0 ;;
```

Notes: `_apply_fix` / `_graph_commit_fix` are this file's existing helpers
(lines 207-216) — the write lands in the `NATIVE_ROOT` main store and the
commit path matches the existing `--set-fix`/`--clear-fix` call sites. A
failed check fails closed (skip with reason, rc 1), consistent with the
sibling `fix-clear-failed` / `fix-write-failed` reasons and
`.claude/rules/code-style.md` (clear error over silent fallback). Also update
the file's header comment (lines 26-30 describe the gate's dispositions) to
mention the cap park.

**Recommended model:** sonnet.

**Dependencies:** Unit 1 (the `--park-if-capped` mode must exist).

## Unit 3 — fix-checks SKILL.md: spend one budget unit per completed node-lane pass

**Scope.**

`.claude/skills/fix-checks/SKILL.md`, node-lane completion seam
(lines 81-108) and Step 9's node-lane paragraph (lines 617-622):

1. Rewrite the completion-seam bullets so **every outcome that reaches Step 9
   spends one budget unit**, replacing the current push/no-push write split:
   - Pushed a commit: run `--spend-attempt`, then `--record-push "$HEAD_SHA"`,
     then ONE `graph-commit` landing both on-disk writes:
     ```bash
     HEAD_SHA=$(git rev-parse HEAD)
     node --import tsx/esm packages/intentionsutil/scripts/apply-fix-state.ts \
       "$N" --spend-attempt
     node --import tsx/esm packages/intentionsutil/scripts/apply-fix-state.ts \
       "$N" --record-push "$HEAD_SHA"
     .claude/skills/dispatch-propagate/scripts/graph-commit \
       -m "graph: record fix attempt + push $HEAD_SHA on $N" "$N"
     ```
   - Pushed nothing (generic no-repro / flake): the "make NO graph write"
     rule is replaced — run `--spend-attempt` + `graph-commit` (message
     `"graph: record fix attempt (no push) on $N"`). This is the change that
     makes the recurring generic-no-repro loop countable at all.
   - Needs-human is unchanged: it stops at Step 4 before this seam and never
     spends (legacy parity — its Step 5 exclusion).
2. Update the seam's framing prose ("This worker's completion duty is only to
   RECORD what this iteration did") to name both records: the spent attempt
   (always) and the pushed sha (push outcomes only), and why the spend is
   worker-side (the selector cannot distinguish a still-running worker from a
   completed no-repro pass — see the tactic node's Context).
3. Update Step 9's node-lane paragraph (lines 617-622) to match: the node
   lane's completion is the `--spend-attempt` (+ `--record-push` when pushed)
   + `graph-commit` write from the completion seam — no longer "or nothing
   (when it pushed nothing)".

**Recommended model:** sonnet.

**Dependencies:** Unit 1 (the `--spend-attempt` mode must exist before the
skill documents it).

## Reuse

- `apply-fix-state.ts`'s existing structure — `setMode` mutual-exclusivity,
  `todayUtc()`, the null-interrupt guards, `FixStateResult`, the
  readNode→writeNode round-trip (`packages/intentionsutil/scripts/apply-fix-state.ts`).
  Both new modes are siblings of the three existing ones, not a new script.
- `graph-select-target`'s `_apply_fix` / `_graph_commit_fix` helpers
  (lines 207-216) — the cap check reuses them verbatim.
- `router.ts`'s existing `office_hours === null` eligibility gate (§3.1,
  comments at lines 197-203) — setting `office_hours` is sufficient to stop
  reselection; no new selection-side gate.
- The `office_hours: {reason, since, recommendation}` shape from `park-node`
  (`packages/intentionsutil/scripts/park-node`) and `schema.ts` — reused
  without calling `park-node` itself (the write folds into `apply-fix-state`'s
  single `writeNode`; the selector's existing `_graph_commit_fix` lands it).
- `FIX_ATTEMPT_CAP`'s value (3) and the spend-per-invocation semantics from
  the legacy lane (`.claude/skills/fix-checks/SKILL.md` Step 5's
  `dispatch:fix-checks-attempt-<n>` handling) — parity restored, not
  re-designed.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

Extend `packages/intentionsutil/test/apply-fix-state.test.ts` (its existing
`describe("applyFixState store round-trip")` / `describe("apply-fix-state
parseArgs")` blocks):

- `--spend-attempt` on an active interrupt increments `attempt` and preserves
  `since`/`pushed_sha`; on `execution.fix: null` it throws (guard parity with
  `--record-push`).
- `--park-if-capped` with `attempt <= FIX_ATTEMPT_CAP` writes nothing and
  returns `parked: false`; with `attempt > FIX_ATTEMPT_CAP` (seed
  `attempt: 4`) it returns `parked: true`, sets `office_hours` with a non-null
  `recommendation` and a `reason` naming the consumed count (3), and resets
  `fix.attempt` to 1; on `execution.fix: null` it throws.
- End-to-end counter walk: `--set-fix` (attempt=1) → 3 × `--spend-attempt`
  (attempt=4) → `--park-if-capped` parks; then `--clear-fix` after a human
  clear nulls `fix` entirely (fresh budget for a future regression —
  existing behavior, assert it still holds with `office_hours` present).
- `parseArgs` accepts the two new modes and still rejects combined modes.

Manual / prose:

- `npx tsx packages/intentionsutil/scripts/validate-graph.ts` passes (no
  schema change is made — `FixState.attempt` and
  `office_hours.recommendation` are already validated fields).
- No bash test harness covers `_gate_fix_active` (checked 2026-07-19:
  `test-dispatch-scripts.sh` has no `_gate_fix_active` cases), so Unit 2 is
  reviewed by reading: confirm the `*)` branch's three exits (cap-check
  failure → `fix-cap-check-failed` rc 1; parked → commit + 
  `fix-attempt-cap-parked` rc 1; not capped → `fix` rc 0) and that
  `passing`/`pending` branches are untouched.
- Re-read the edited fix-checks SKILL.md node-lane seam end to end:
  every Step-9-reaching outcome now spends; needs-human still does not; the
  push case lands spend + record-push in one `graph-commit`.
- Observe in production: the next node-lane tactic that stays red across 3
  completed `/fix-checks` passes lands with `office_hours` set (reason naming
  3 consumed attempts) instead of a 4th dispatch; a tactic whose 3rd push
  goes green resolves via `--clear-fix` with no park.
