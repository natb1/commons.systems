---
id: tactic-statusline-defects-repair
kind: tactic
statement: "Repair the two statusline.sh defects: worktree-safe
  update-rate-limits.sh resolution, and a guarded jq/stdin path so empty or
  malformed input never blanks the visible line"
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-09-02 stop-hook/status-line diagnosis (/align
  disposition round): the author observed the status line failing; the visible
  symptom traces to unguarded jq over stdin, and a second latent defect silently
  kills the statusline's rate-limit telemetry write in worktree sessions.
  Ratified the same day on strategy-graph-native-dispatch: both statusline
  functions are supported; the telemetry has two writers by necessity
  (assumption criterion
  assume-no-supported-headless-subscription-usage-surface), and the headless
  probe dispatch-refresh-rate-limits is the budgeter's primary since #1127 - so
  defect 2 (jq guard) is the visible bug and defect 1 (worktree path) is
  redundancy repair of the secondary writer. Frontier-visible via gap note
  2026-09-02 (statusline defects); this draft retains the repair context for
  /align-tactics."
reading: null
serves:
  - strategy-autonomous-execution
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
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Repair the two statusline.sh defects: worktree-safe update-rate-limits.sh resolution, and a guarded jq/stdin path so empty or malformed input never blanks the visible line

Retained context from the 2026-09-02 diagnosis (read-only transcript + hook
audit; anchors verified at head that day). Two independent defects in
`.claude/hooks/statusline.sh`:

1. **Telemetry path resolution** (`statusline.sh:15`): the rate-limits side
   effect pipes into
   `"$CLAUDE_PROJECT_DIR/.claude/skills/dispatch-propagate/scripts/update-rate-limits.sh"`
   with no fallback when `$CLAUDE_PROJECT_DIR` is unset or points at the wrong
   root. Failure is swallowed by `>/dev/null 2>&1 || true`, so the dispatch
   concurrency budgeter's `rate_limits.json` silently stops updating. The same
   defect class was fixed in `stamp-dispatch-session.sh` on 2026-08-18 (its
   documented cwd-resolution repair) but never ported here — port that
   resolution shape rather than inventing a new one.

2. **Unguarded stdin parse** (`statusline.sh:19-22`): `model`, `cwd_raw`,
   `usage`, and `ctx_size` come from `jq` over raw stdin with no guard. On
   empty or malformed stdin every field is empty, the token branch falls
   through, and the visible line renders as bare escape codes — a blank status
   line, which is the author-observed symptom. The file's own later guards
   (the `current`/`ctx_size` regex checks at :51) show the intended fail-open
   posture; extend it to the initial parse (e.g. a `jq empty`-style validity
   check with a model-only or static fallback render).

Ruling context (ratified 2026-09-02 on strategy-graph-native-dispatch, "Is the
status line's functionality disposition-supported"): both functions are
supported; the telemetry has two writers by necessity — the headless probe
`dispatch-refresh-rate-limits` (run first on every non-paused `dispatch-tick`
since #1127, undocumented OAuth header surface) is the budgeter's primary, and
the statusline writer is the documented, interactive-only secondary. So defect 2
is the visible bug and defect 1 is redundancy repair of the secondary writer:
still worth porting (it is the documented fallback if the probe's surface
breaks), but lower priority than first recorded. Do not delete the piggyback
call — the assumption-class criterion
`assume-no-supported-headless-subscription-usage-surface` records why it stays.

Out of scope: the dispatch-phase segment (migrated correctly in
tactic-dispatch-legacy-rewire Unit 2; reads graph `phase:` frontmatter, no
`gh`), and any stop-hook change (resolved by c06c7295 — see the 2026-09-02
clarifications on strategy-graph-native-dispatch).

Frontier carrier: gap note dated 2026-09-02 under
`intentions/operational/gap-notes/` (created via `createGapNote`,
`packages/intentionsutil/src/gap-note-store.ts`) cites both defects; this
draft is the repair context for a future `/align-tactics` finalize.
Verification sketch: feed representative and degenerate stdin payloads
(full JSON / empty / truncated) to the script and assert a non-blank render
in all three, plus a worktree-session run asserting `rate_limits.json`
freshens.
