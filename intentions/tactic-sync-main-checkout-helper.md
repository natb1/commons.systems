---
id: tactic-sync-main-checkout-helper
kind: tactic
statement: Collapse the three inlined `git fetch origin main` + `git merge
  --ff-only origin/main` copies into one `sync_main_checkout <path>` helper in
  lib.sh, beside assert_primary_checkout_on_main
owner: ai
status: raw
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Collapse the three inlined `git fetch origin main` + `git merge --ff-only origin/main` copies into one `sync_main_checkout <path>` helper in lib.sh, beside assert_primary_checkout_on_main

Deferred cleanup from the implementation of `tactic-dispatch-ladder-skill`
(PR #3072), where the third copy was added.

**Locations** (verified against `origin/main` at
`c0a66d49844e6ce64eb3224390a64e0d6eade4a3`):

- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:377-382` —
  fetch at `:377`, `merge --ff-only` at `:379`, both into captured stderr temp
  files feeding the `sync_repair_*` escalation ladder.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:585-592` — the
  paused-branch drain's guard chain; fetch at `:587`, `merge --ff-only` at
  `:589`. **Note the reference drift**: `dispatch-ladder-run:517` cites this
  site as `dispatch-tick:569-572`, which was correct when written and is now
  stale. Re-verify before citing.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:523-530` — the
  third copy, added by #3072; fetch at `:523`, `merge --ff-only` at `:527`,
  each failure a `halt 11 throw`.

**Finding**: three hand-rolled copies of the same two-command sequence, each
with its own failure wording and its own escalation. The sequence is
load-bearing in all three: an unsynced checkout merges past a park or an
`execution.conflict` interrupt landed since the caller started, and `--ff-only`
doubles as the dirty/diverged-tree guard.

**Recommended fix**: a `sync_main_checkout <path>` helper in
`.claude/skills/dispatch-propagate/scripts/lib.sh`, placed beside
`assert_primary_checkout_on_main` (`lib.sh:1885-1901`) — whose own header
already names this sync as the caller's job, so the two belong together.
Distinct return codes for fetch-failure vs. merge-failure keep the callers'
different escalations expressible without pushing policy into the helper.

**Why it was deferred out of #3072**: collapsing `dispatch-select-tick`'s copy
drags in its `sync_repair_*` escalation ladder — stderr capture, attempt
counters, and the repair path — which is a materially larger change than the
two-line call sites in `dispatch-tick` and `dispatch-ladder-run`. A first pass
could convert those two and leave `dispatch-select-tick` for a follow-up, but
that leaves the duplication that motivates the node half-standing, so the
sequencing is a judgment for the implementer.

**Source PR**: #3072
