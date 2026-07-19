---
id: tactic-claim-dedup-only
kind: tactic
statement: The claim/worktree liveness check keeps only router spawn-dedup; drop
  the align-strategy and align-tactics Step 0 stop-on-held-claim edit-gate so no
  authoring session is refused or blocked by another session's live claim
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-13 automatic-serialization interview on
  strategy-graph-native-dispatch: the claim/worktree ledger had two jobs --
  spawn-dedup (router never launches a second worker for a node with a live
  claim) and edit-gating (an authoring session stops if the target worktree has
  a live session). This tactic drops only edit-gating; write safety already
  lives at land time via graph-commit's own park-on-conflict fallback
  (packages/intentionsutil/scripts/graph-commit:536-562,689 -- a genuine
  concurrent-edit conflict sets office_hours on the affected node rather than
  losing either writer's content), independent of the unrelated in-flight
  tactic-graph-commit-auto-serialization draft (a smarter conflict-resolution
  ladder, parked as of this writing) -- this tactic does not depend on that
  upgrade landing. Motivating episode: an unrelated diagnose-main background
  session squatting the strategy-graph-native-dispatch worktree blocked the
  automatic-serialization interview itself at align-strategy's
  stop-on-held-claim step, serializing an author with no overlapping work.
  Sequenced behind tactic-align-tactics-self-claim-collision (PR #2897, open at
  plan time): that tactic patches a self-claim false-positive inside the exact
  align-tactics Step 0.2 block this tactic deletes, so landing this tactic first
  would strand or conflict with in-flight work; blocked_by lets the router hold
  this tactic until #2897 merges. The path-clobber bug in
  worktree_has_live_session noted in the original draft is out of scope here --
  it already has its own tracker, tactic-live-session-check-path-clobber, and
  the router-facing spawn-dedup callers of worktree_has_live_session are
  unaffected by this tactic (they are the kept half). The office-hours skill has
  no Step-0-shaped stop-on-held-claim block matching
  align-strategy/align-tactics (checked live: no 'held claim' language in
  .claude/skills/office-hours/SKILL.md), so no office-hours edit is in scope
  despite the draft's 'office-hours skill equivalents' phrasing -- that phrasing
  does not correspond to an existing surface today."
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
# The claim/worktree liveness check keeps only router spawn-dedup; drop the align-strategy and align-tactics Step 0 stop-on-held-claim edit-gate so no authoring session is refused or blocked by another session's live claim

## Context

The claim/worktree ledger has always done two jobs: (1) **spawn-dedup** — the
router will not launch a second worker for a node whose worktree already has
a live session, so duplicate workers never burn tokens on redundant work —
and (2) **edit-gating** — an authoring session (an align interview, a phase
worker, an office-hours entry) checks the same liveness predicate and stops
itself, refusing to proceed, if the target worktree already has a live
session.

Edit-gating is the wrong job for this predicate. It cannot distinguish "an
active authoring session that legitimately owns this worktree" from "an
unrelated squatter session that happens to have its cwd there" — both read as
"held." On 2026-07-13 an unrelated `diagnose-main` background session with
cwd in `.claude/worktrees/strategy-graph-native-dispatch` blocked the
automatic-serialization `/align-strategy` interview itself at exactly this
step, serializing the author against a session with no overlapping work.

Write safety does not depend on edit-gating: a genuine concurrent edit to the
same node is already caught at land time by `graph-commit`'s own
park-on-conflict fallback (`packages/intentionsutil/scripts/graph-commit:536-562,689`
— on a real semantic conflict it sets `office_hours` on the affected node
rather than silently losing either writer's content). Removing the
stop-on-held-claim step therefore does not introduce a write-safety gap; it
removes a serialization point that was never protecting anything the land-time
path doesn't already protect.

This tactic narrows the ledger to job (1) only. Job (2) is dropped from the
two skills that currently implement it.

**Scope boundary — router spawn-dedup untouched.** `worktree_has_live_session`
itself, and every one of its router/spawn-side callers
(`.claude/skills/dispatch-propagate/scripts/graph-select-target`,
`office-hours-select-target`, `dispatch-tick`, `dispatch-sweep`,
`dispatch-graph-scope-sweep`, `dispatch-spawn-sweep`, `dispatch-resolve-worktree`,
`dispatch-preflight.sh`, and the `office-hours` skill's own selection logic),
stay exactly as they are. This tactic touches only the two **edit-gating**
call sites named below — nothing that governs whether the router spawns a
worker.

**Scope boundary — path-clobber bug not in scope here.** The 2026-07-13 draft
noted an incidental defect seen live: `worktree_has_live_session` hit
`command not found: basename` under a zsh `PATH`-clobber and still returned
"held." That bug already has its own dedicated tracker,
`tactic-live-session-check-path-clobber`, and remains relevant regardless of
this tactic (the function is still called by every kept spawn-dedup site).
Do not duplicate that fix here.

**Scope boundary — office-hours has no matching surface.** The original
draft's "Surfaces to change" named "`/align-tactics` and office-hours skill
equivalents of the same step." Checked live against
`.claude/skills/office-hours/SKILL.md`: it contains no "held claim" /
stop-and-report block shaped like align-strategy's or align-tactics' Step 0.2
— its only live-session-related language is its Bucket-1 "fresh item with no
live session" selection framing, which is spawn-side, not an edit-gate on an
authoring session. There is no third surface to edit; do not invent one.

## Unit 1 — drop the stop-on-held-claim step from `align-strategy` Step 0

**Recommended model:** sonnet

Small, mechanical, single-file text edit with no design judgment — the
`model-selection heuristic` (`.claude/skills/implement-unit/SKILL.md` lines
31-39) routes this to sonnet.

Scope:
- `.claude/skills/align-strategy/SKILL.md` Step 0 (currently at or near lines
  51-86 as of this plan; re-locate by heading text `## Step 0 — Claim and
  isolate` if line numbers have drifted). Delete numbered item 2 ("**Check the
  claim.**" — the `worktree_has_live_session <path>` check and its "stop and
  report the held claim to the author... do **not** park the node" text).
  Renumber the remaining items (today's item 1 "Resolve the target node id"
  and item 3 "Enter the worktree") so the list reads 1, 2 with no gap.
- Item 3 ("Enter the worktree — on a verified-fresh checkout...") is
  otherwise unchanged: `provision-node-worktree` preference,
  `assert-worktree-fresh` mandate for native `EnterWorktree`, and the
  never-treat-a-failed-fetch-as-license-to-proceed rule all stay verbatim —
  those are freshness rules, not edit-gating, and are out of scope here.
- Do not touch the "Doctrine-recording rounds pin the pace curve" paragraph
  immediately after Step 0 — unrelated.
- Out of scope: any other Step in `align-strategy/SKILL.md` (Step 1 onward).

Dependencies: none within this tactic; land together with Unit 2 (same
concern, two files) is fine but not required.

## Unit 2 — drop the stop-on-held-claim step from `align-tactics` Step 0

**Recommended model:** sonnet

Same mechanical shape as Unit 1, on the sibling skill.

Scope:
- `.claude/skills/align-tactics/SKILL.md` Step 0 ("## Step 0 — Claim and
  isolate", currently at or near lines 62-90 as of this plan; re-locate by
  heading if drifted). Delete item 2 ("**Check the claim.**" — the
  `worktree_has_live_session <path>` check, "the claim is held by another
  session: stop and report the held claim, then end the run. A held claim is
  **not** an `office_hours` park... and **not** a defect."). Renumber the
  remaining items (1 "Resolve the target node id", 3 "Enter the worktree") to
  1, 2.
- Item 3 ("Enter the worktree — on a verified-fresh checkout...") stays
  unchanged for the same reason as Unit 1 (freshness rules, not edit-gating).
- This skill's own current Step 0 (the copy this plan was written under) is
  the concrete "before" state to diff against — do not re-derive it from
  memory; open the live file.
- Out of scope: everything after Step 0 in this file, including the "Tactic
  target — per-node finalize or re-plan" section (it references Step 0 by
  reference, not by restating it, so no downstream edit is needed there) and
  the "Autonomy contract" section (a held claim was never one of its three
  park conditions and remains so — no change needed).

Dependencies: none within this tactic; may land in the same `graph-commit`
call as Unit 1's change, or separately.

## Reuse

- No new code or shared helper is introduced. Both units are prose deletions
  in existing `SKILL.md` files; the router/spawn-side `worktree_has_live_session`
  implementation (`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:497`)
  is reused unchanged by the callers this tactic does not touch.

## Sequencing note (why `blocked_by` is set)

This tactic is `blocked_by: [tactic-align-tactics-self-claim-collision]`
(PR #2897, open as of this plan). That tactic patches a self-claim
false-positive *inside* the exact `align-tactics` Step 0.2 block Unit 2
deletes. Landing this tactic first would strand or conflict with that
in-flight fix; the router should hold this tactic until
`tactic-align-tactics-self-claim-collision` reaches `phase: done`. If, at
implement time, that tactic has already landed, drop this `blocked_by` edge
as part of the same PR (it will have become inert, not wrong).

## Verification

Both units are documentation-only changes to `.claude/skills/*/SKILL.md` —
there is no test suite or build to run.

- **Read-through check (manual):** after both edits, re-read
  `align-strategy/SKILL.md` Step 0 and `align-tactics/SKILL.md` Step 0 top to
  bottom. Each should read as: resolve the target node id → enter the
  worktree (fresh-checkout rules unchanged) — with no "check the claim" /
  "stop and report" step in between, and no stray reference elsewhere in
  either file to a "held claim" as a reason to stop (grep the two files for
  `held claim` after editing — the string should not appear in either file
  outside a historical/rationale mention, if any).
- **Scope-boundary check (manual):** confirm no other file changed —
  `git diff --stat` for this PR should show exactly the two `SKILL.md` files.
  In particular, `lib-claude-agents.sh` and every `dispatch-propagate/scripts/`
  file listed under "Scope boundary — router spawn-dedup untouched" above
  must be untouched.
- **Prose-lint (auto-runnable):** the repo's committed-script prose linter
  does not apply here (no `.sh` file is touched), but the standard CI lint
  pass should still run clean since no shell script changes.

```verify
git diff --stat origin/main -- .claude/skills/align-strategy/SKILL.md .claude/skills/align-tactics/SKILL.md
```
