---
id: tactic-align-session-claiming-liveness-correction
kind: tactic
statement: "correct tactic-align-session-claiming Unit 3's recorded
  existence-based claim ('graph-select-target treats ANY existing worktree as a
  held claim') to the shipped liveness rule (reservation marker OR
  worktree_has_live_session), reconciling it with its own Unit 1 and #1474"
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-18 office-hours-concurrency interview:
  verifying the target-state mechanism surfaced that
  tactic-align-session-claiming Unit 3 (phase done, PR 2804) records an
  existence-based claimed-set that diverges from the shipped graph-select-target
  (liveness-keyed), contradicts Unit 1 of the same node (liveness), and
  describes the pre-#1474 worktree-walk that #1474 deliberately replaced.
  Recorded-text hygiene only — the code is already correct; no behavior change."
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
# correct tactic-align-session-claiming Unit 3's recorded existence-based claim ('graph-select-target treats ANY existing worktree as a held claim') to the shipped liveness rule (reservation marker OR worktree_has_live_session), reconciling it with its own Unit 1 and #1474

Finalized by `/align-tactics tactic-align-session-claiming-liveness-correction`
(2026-07-18) from the draft byproduct of the same day's
office-hours-concurrency interview. Recorded-text hygiene only — no code
changes; the shipped code is already correct. Tracked as the correction
vehicle by `strategy-graph-native-dispatch`'s 2026-07-18 clarification
("tracked by draft tactic-align-session-claiming-liveness-correction").

## Context

Verifying the target-state concurrency mechanism during that interview
surfaced an inconsistency in the recorded graph. `tactic-align-session-claiming`
(`phase: done`, PR 2804) Unit 3 prescribes an **existence-based** claimed set:

> "Assert (and if missing, add) that `graph-select-target`'s claimed-set
> derivation treats ANY existing `.claude/worktrees/<node-id>` as a held
> claim … Add a test: create a bare node-id worktree, run selection, assert
> the node is skipped." (`intentions/tactic-align-session-claiming.md`, Unit 3
> — grep `## Unit 3 — selector claimed-set covers human-created worktrees`;
> at finalize time this was lines 126–138.)

This is stale on three counts, each verified directly against the shipped
sources (not re-derived from the draft's citations — those had already
drifted from the growing test file by finalize time):

- **Diverges from shipped code.** `.claude/skills/dispatch-propagate/scripts/graph-select-target`
  (verified at lines 245–255 at finalize time; re-grep the comment
  `# Claimed set: reservation-ledger marker or live node-id session` if the
  file has moved) skips a node only on `reservation_exists` OR
  `worktree_has_live_session` — a bare worktree with no live session is
  **not** skipped.
- **Contradicts its own Unit 1**, which already states the liveness rule:
  "If `<project-root>/.claude/worktrees/<node-id>` exists with a live session
  (`worktree_has_live_session` …), the claim is held" (same file, Unit 1).
- **Describes the pre-#1474 behavior** that was deliberately replaced. The
  actual shipped test —
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
  (verified at finalize time: the `# Test: graph-select-target — a
  human-created node-id worktree is a held claim (tactic-align-session-claiming
  Unit 3)` block, ~line 30408, and its `live_session_claimed_nums (#1474)`
  neighbor, ~line 9752 — re-grep by heading text, not line number, since the
  file grows) — asserts the **opposite** of Unit 3's prescription: Case 1, a
  live-session-owned node-id worktree is skipped; Case 2 (the negative
  control), the *same* worktree with **no** live session (daemon reports `[]`)
  is still **selected** — pinning that bare directory existence alone is
  explicitly NOT a claim.

## Unit 1 — correct `tactic-align-session-claiming.md` Unit 3's recorded text

**Recommended model:** sonnet

Scope:
- `intentions/tactic-align-session-claiming.md`, Unit 3 section only (grep
  `## Unit 3 — selector claimed-set covers human-created worktrees` — do not
  rely on the hardcoded line numbers below without re-grepping first, since
  intervening edits can shift them; at finalize time this was lines 126–138,
  immediately before `## Reuse` at line 140).
- Rewrite the Unit 3 `Scope:` bullet (currently: "Assert (and if missing, add)
  that `graph-select-target`'s claimed-set derivation treats ANY existing
  `.claude/worktrees/<node-id>` as a held claim … Add a test: create a bare
  node-id worktree, run selection, assert the node is skipped.") to instead
  describe the **shipped** liveness-keyed behavior and its actual test
  coverage: the claimed-set gate is `reservation_exists(id)` OR
  `worktree_has_live_session(...)` (not bare directory existence), matching
  Unit 1's own phrasing; the shipped test asserts (a) a live-session-owned
  node-id worktree is skipped, and (b) the same worktree with no live session
  (a "bare"/orphan worktree) is still selected — the negative control proving
  existence alone is not a claim.
- Explicitly out of scope: Unit 1 and Unit 2 of the same node — both already
  state the liveness rule correctly and need no edit. No code changes anywhere
  — `graph-select-target` and its test already implement and cover the correct
  (liveness) behavior; this unit is a recorded-text-only correction of a
  `phase: done` node's stale prose.
- This is a **pre-existing node** on `origin/main` (Unit 3 landed via PR
  2804): dump it through `dump-node.ts` before editing and land the edit
  through `graph-commit --base` per the Reuse section below — the same
  stale-read protection this session used for its own frontmatter write.
- Dependencies: none.

## Reuse

- `packages/intentionsutil/scripts/dump-node.ts` — capture a base manifest for
  `tactic-align-session-claiming` before editing its body (it is
  `phase: done`, i.e. pre-existing on `origin/main`), the same mechanic this
  finalize session used for its own node:
  ```
  BASE=$(npx tsx packages/intentionsutil/scripts/dump-node.ts \
    --out-dir "$TMPDIR/dump" tactic-align-session-claiming)
  ```
  (both `dump-node.ts` and any other `tsx` invocation here need
  `dangerouslyDisableSandbox: true` — the tsx CLI's IPC pipe under
  `$TMPDIR` is blocked by the sandbox's filesystem allowlist.)
- `packages/intentionsutil/scripts/graph-commit --base "$BASE"
  tactic-align-session-claiming` — the sole landing path (per
  `.claude/skills/align-tactics/SKILL.md` Step 5); this is a body-only `Edit`,
  no `write-node.ts` frontmatter change (the node's frontmatter — `status`,
  `phase: done`, `execution`, etc. — is untouched by a text correction to its
  body).
- `.claude/skills/dispatch-propagate/scripts/graph-select-target` and
  `test-dispatch-scripts.sh` — the ground truth the corrected Unit 3 text must
  match; re-read both directly rather than trusting this plan's line numbers,
  which will have drifted further by execution time.

## Verification

Prose (no code changed, so no test suite to run — verify the corrected text
directly):

- Read the corrected `## Unit 3` section of
  `intentions/tactic-align-session-claiming.md` and confirm it no longer
  claims bare/existence-based worktree keying, and instead describes the
  reservation-ledger-marker-OR-live-session gate, consistent with the same
  node's Unit 1.
- Confirm Unit 1 and Unit 2 of the same node are unchanged (whole-node diff
  should touch only the Unit 3 section).

```verify
grep -A20 '## Unit 3 — selector claimed-set covers human-created worktrees' intentions/tactic-align-session-claiming.md | grep -qi 'treats ANY existing' && echo "STALE: existence-keyed phrase still present" && exit 1
grep -A20 '## Unit 3 — selector claimed-set covers human-created worktrees' intentions/tactic-align-session-claiming.md | grep -qi 'live.session' && echo OK
```
