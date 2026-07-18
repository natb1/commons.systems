---
id: tactic-qa-fix-office-hours-reentry-guard
kind: tactic
statement: qa-fix node-lane Step 0 bails cleanly when the node is already
  office_hours-parked at origin/main, closing the in-session ScheduleWakeup
  re-entry gap the selector's office_hours gate does not cover
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-18 investigating a /qa-fix run on
  tactic-align-family-opus-default (PR #2886): the session escalated
  (scope-deviation on QA item 7), wrote office-hours-reason, and the Stop hook
  parked the node (office_hours set, commit 32c8e424, 18:03:01) -- confirmed
  correct. But a stale self-scheduled ScheduleWakeup from earlier in the same
  session then re-fired with a resume prompt for the same qa-fix pass. In this
  instance the resumed turn recognized the work was already complete and took no
  further action, so no damage landed -- but qa-fix's node-lane Step 0
  (.claude/skills/qa-fix/SKILL.md) has no guard against this: it checks only
  NODE_PHASE == \"qa\", never whether office_hours is already non-null. The
  selector (router.ts eligibility rule, tactic-graph-native-dispatch spec:
  office_hours null required) gates fresh dispatch correctly, but that gate is
  never consulted by an in-session resume -- a ScheduleWakeup re-fire resumes
  the same conversation directly, bypassing the selector entirely. Had the stale
  prompt instead read like a fresh /qa-fix re-invocation rather than a
  Workflow-status check, the skill would have re-merged, re-triaged, and
  re-posted the QA summary against a node already handed to a human. This is a
  distinct, narrower defect from strategy-token-economy's 2026-07-16
  ScheduleWakeup clarification, which covers only the wasted-round cost of a
  redundant fallback firing after harness auto-notification -- it does not cover
  a resume racing past a just-applied terminal park. Author-directed boost to
  top rank 2026-07-18 (same round as the diagnostic session): this is the
  fix-of-record for that re-entry gap."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 61
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18
    /align-strategy round investigating the tactic-align-family-opus-default
    park). Sized against the composed selector rank per the materiality
    precedent set by tactic-align-skills-latest-graph-guard and
    tactic-freeze-resurface-stale-children-only (childless, empty blocked_by:
    rank = boost + 5.33; then-max 66.33), so boost 61 ties the top of the
    discretionary frontier."
phase: review
execution:
  branch: tactic-qa-fix-office-hours-reentry-guard
  pr: 2893
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# qa-fix node-lane Step 0 bails cleanly when the node is already office_hours-parked at origin/main, closing the in-session ScheduleWakeup re-entry gap the selector's office_hours gate does not cover

## Context

`.claude/skills/qa-fix/SKILL.md` Step 0's node-target lane already fetches the
node body from `origin/main` to check `NODE_PHASE`:

```bash
NODE_MD=$(git archive origin/main "intentions/$NODE_ID.md" 2>/dev/null | tar -xO 2>/dev/null) || { ... }
NODE_PHASE=$(printf '%s\n' "$NODE_MD" | sed -n 's/^phase: *//p' | head -1)
if [ "$NODE_PHASE" != "qa" ]; then
  echo "/qa-fix: node '$NODE_ID' phase is '$NODE_PHASE' at origin/main, not 'qa'" >&2
  exit 1
fi
```

It never reads `office_hours` from that same `$NODE_MD`. The selector
(`packages/intentionsutil/src/router.ts:292` and siblings: "A tactic is
eligible for its phase skill iff `office_hours` is null...") gates *fresh*
dispatch correctly, but that gate lives in the selector, not in the skill —
an in-session resume (a self-scheduled `ScheduleWakeup` re-firing with a
continuation prompt) never goes through the selector. It resumes the same
conversation directly, so any code path that re-enters Step 0's checks from
scratch sees `NODE_PHASE == "qa"` (parking never changes `phase`) and
proceeds, blind to `office_hours` already being set.

Observed live 2026-07-18 on `tactic-align-family-opus-default` / PR #2886: a
`/qa-fix` session escalated (scope-deviation on a QA finding), and the Stop
hook parked the node (`office_hours` set, commit `32c8e424`). A stale
`ScheduleWakeup` from earlier in the same session then re-fired with a
resume prompt for the same qa-fix pass. That particular resume recognized
the work was already done and took no further action, so nothing broke —
but the skill itself has no mechanical guard that would have stopped a
less-conservative resume (or a differently-worded stale prompt) from
re-running Steps 0.5-6 against an already-parked node: re-merging, re-triaging,
and re-posting the QA summary over a node a human has already been handed.

The legacy issue-branch lane already has the analogous guard one paragraph
below in the Idempotency preamble: `dispatch:qa-done` on the labels line
skips Steps 0.5-6 entirely. The node lane has no equivalent for
`office_hours`.

## Unit 1 — add the office_hours guard to qa-fix Step 0's node lane

**Recommended model:** sonnet — small, mechanical addition to an existing,
already-fetched value; no design judgment.

Scope:
- `.claude/skills/qa-fix/SKILL.md`, Step 0's node-target lane (the case-branch
  fetching `$NODE_MD` / `$NODE_PHASE`): after the existing `NODE_PHASE` check,
  parse `office_hours` from the same `$NODE_MD` (a YAML block; a simple
  presence check — e.g. does the `office_hours:` key have a non-`null` value —
  is sufficient, mirroring the plain `sed`-based `NODE_PHASE` extraction
  already there). If non-null, print a clear message
  (`"/qa-fix: node '$NODE_ID' is already office_hours-parked at origin/main —
  nothing to do"`) and exit 0 (a clean no-op skip, not an error — mirrors the
  `dispatch:qa-done` skip's "true no-op" framing in the Idempotency preamble).
- Do not touch the legacy issue-branch lane — its `dispatch:qa-done` guard
  already covers the equivalent case.

Reuse:
- The existing `$NODE_MD` fetch and `NODE_PHASE` parsing pattern in Step 0 —
  this unit adds one more field read from the same already-fetched text, not
  a second `git archive` call.
- The Idempotency preamble's `dispatch:qa-done` skip as the precedent for
  "skip Steps 0.5-6 entirely and return" phrasing and behavior.

## Verification

Prose only — this is a shell-script guard inside a skill body, with no
automated test harness for skill markdown:

- Dry-run: hand-construct a `$NODE_MD` fixture with `phase: qa` and a non-null
  `office_hours` block (copy the shape from any currently-parked node, e.g.
  `intentions/tactic-align-family-opus-default.md` at the time of this
  writing) and confirm the new guard exits 0 with the skip message before
  Step 0.5 runs.
- Confirm a `phase: qa`, `office_hours: null` fixture still proceeds normally
  (no regression on the common case).
- Confirm the legacy issue-branch lane is untouched — its own
  `dispatch:qa-done` label check still governs that lane exclusively.

