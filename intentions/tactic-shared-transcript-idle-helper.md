---
id: tactic-shared-transcript-idle-helper
kind: tactic
statement: Extract the shared transcript-idle helper duplicated by
  lib-standdown-recheck.sh's _standdown_session_idle_s and
  lib-frozen-session-park.sh's inline idle measurement into
  lib-claude-agents.sh, so the two UNKNOWN-vs-measured contracts cannot silently
  drift apart
owner: ai
status: raw
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Extract the shared transcript-idle helper duplicated by lib-standdown-recheck.sh's _standdown_session_idle_s and lib-frozen-session-park.sh's inline idle measurement into lib-claude-agents.sh, so the two UNKNOWN-vs-measured contracts cannot silently drift apart

Filed as a review-fix deferred follow-up. Source PR: #2994
(tactic-denied-command-parks-node).

## Location

`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh`
(`_standdown_session_idle_s`) and
`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`
(the inline idle measurement under step (3) of `frozen_session_sweep`).

## Finding

`_standdown_session_idle_s` and the inline idle measurement in
`frozen_session_sweep` are the same code: `find <projects-root> -mindepth 2
-maxdepth 2 -name "<sid>.jsonl"`, newest `stat -c %Y` across matches, empty
result = UNKNOWN = keep.

The duplication was deliberate and sequenced: `lib-standdown-recheck.sh`'s own
comment says the sibling had not yet landed on main, so there was no shared
helper to call and "extracting one is a follow-up once both are on main, not
this unit's job." Both are now on main, so the follow-up is due.

## Failure scenario

Two copies of the same UNKNOWN-vs-measured contract will drift. A change to
transcript discovery applied to one copy (a projects-store layout change,
depth-4 subagent transcripts) silently leaves the other wrong, and the two
sweeps would then disagree about whether the same session is stale — which
matters because the frozen sweep now defers to the stand-down protocol for
exactly these sessions (residue-0 fix landed in this PR).

## Proposed change

- Add `session_transcript_idle_s <sid> <now>` to `lib-claude-agents.sh` (both
  sweeps already source it). Keep the existing contract: validate the sid
  shape at the edge (it feeds a `find -name` glob), take the newest mtime,
  return 1 with no output when unmeasurable.
- Give it ONE documented projects-root override. The two current call sites
  use different names — `DISPATCH_STANDDOWN_PROJECTS_ROOT` and
  `DISPATCH_FROZEN_SESSION_PROJECTS_ROOT` — so decide the single name, update
  both header tables, and update both test fixtures
  (`test-lib-standdown-recheck.sh`, `test-lib-frozen-session-park.sh`) that
  set them.
- Replace both implementations with calls to it, and move the existing
  `_standdown_session_idle_s` tests onto the shared helper in
  `test-lib-claude-agents.sh`.

## Verification

`bash .claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh`,
`test-lib-standdown-recheck.sh`, `test-lib-frozen-session-park.sh`, and
`test-dispatch-tick.sh` all green.

## Adversarial verdict

Not independently adversarially verified — this is a code-review
(`Deferred`/simplification) finding, not a security `Required` finding, so it
did not go through the severity-scaled skeptic gate. The reviewing agent
verified the duplication directly against both source files (see quoted
comment above) before deferring it.
