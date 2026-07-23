---
id: tactic-office-hours-graph-read-cwd-whitespace
kind: tactic
statement: 'Harden office-hours-graph directive parsing so a launch cwd
  containing whitespace is not truncated: `read -r verb a b _ <<<"$directive"`
  word-split the cwd across `b`/`_`; drop the trailing `_` so a 3-var `read -r
  verb a b` assigns the line remainder (spaces intact) to `b`.'
owner: ai
status: codified
parent: null
rationale: 'Deferred review finding from the tactic-office-hours-graph-entry
  terminal review during the 2026-07-07 graph-native router tick. In
  packages/intentionsutil/scripts/office-hours-graph the disposition line is
  parsed with `read -r verb a b _ <<<"$directive"`. With 4 target vars, a
  `launch <node-id> <cwd>` line whose <cwd> contains a space splits the cwd:
  `b` gets the first whitespace-delimited chunk and `_` swallows the rest, so
  the subsequent `cd "$cwd"` would target a truncated path.
  Environment-unreachable in practice: the launch cwd is always
  `<repoRoot>/.claude/worktrees/<nodeId>` or `<repoRoot>`, the repo lives at a
  space-free path, and node ids are path-safe and space-free by convention, so
  no space can actually appear today. Latent only if the repo is relocated
  under a spaced path. This planning round hand-verified (bash repro, not
  committed) that dropping the trailing `_` — `read -r verb a b
  <<<"$directive"` — makes the 3-var `read` assign the entire line remainder
  (spaces preserved) to `b`, and that the `cleared`, `empty`, `empty
  not-parked <id>`, and `launch <id> <cwd with spaces>` directive shapes all
  still parse correctly under the 3-var form. No caller change. Low severity;
  the implement session may batch this into any other office-hours-graph edit
  rather than spending a standalone CI cycle on it alone.'
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

# Harden office-hours-graph directive parsing so a launch cwd containing whitespace is not truncated

## Context

`packages/intentionsutil/scripts/office-hours-graph:142` parses the
freshness-guarded directive with `read -r verb a b _ <<<"$directive"`. With 4
target vars, a `launch <node-id> <cwd>` directive whose `<cwd>` contains a
space word-splits the cwd across `b` and the throwaway `_`: `b` gets only the
first whitespace-delimited chunk, and the subsequent `( cd "$cwd" && ... )`
(line ~176) targets a truncated path, so the launch would silently `cd` into
the wrong (likely nonexistent) directory. This is currently
environment-unreachable — the launch cwd is always
`<repoRoot>/.claude/worktrees/<nodeId>` or `<repoRoot>`, the repo lives at a
space-free path, and node ids are path-safe and space-free by convention (the
store's `assertPathSafeId` rejects `/ \ ..`) — so no space can appear today.
It becomes live the moment the repo is relocated under a spaced path, so it is
worth hardening now while the fix is a one-liner. Deferred from the
`tactic-office-hours-graph-entry` terminal review (2026-07-07 graph-native
router tick); this round finalizes it into an executable plan rather than
leaving it as a bare draft note.

## Unit 1 — drop the trailing throwaway var so `read` captures the cwd remainder intact

**Scope.** `packages/intentionsutil/scripts/office-hours-graph:142`. Change:

```bash
read -r verb a b _ <<<"$directive"
```

to:

```bash
read -r verb a b <<<"$directive"
```

With only 3 target vars, POSIX `read` assigns the *entire* remainder of the
line — spaces intact — to the last var (`b`), instead of splitting it further
into `b` and a discarded `_`. Out of scope: every other `read` call in the
file (e.g. the unrelated 2-var `read -r sel_verb _ <<<"$sel"` at line 104,
which reads a different, single-token directive shape and is not affected by
this bug) — leave those untouched.

**Dependencies.** None.

**Recommended model:** sonnet — a single-line, well-understood shell edit
with no design judgment involved.

## Reuse

No new code or utilities — this is a one-character-class edit (delete a
single trailing `_`) to an existing script. Nothing to reuse beyond the
existing `office-hours-graph` file itself.

## Verification

Prose (no test harness covers this script; verify by hand in the implement
session):

- `bash -n packages/intentionsutil/scripts/office-hours-graph` — confirms the
  edit is syntactically valid.
- Hand-run each directive shape through the new 3-var `read` and confirm
  parsing is unchanged except for the fixed case:
  ```bash
  bash -c '
  read -r verb a b <<<"launch tactic-foo /some/path with spaces/here"
  echo "verb=[$verb] a=[$a] b=[$b]"   # expect b to include the full spaced path

  read -r verb a b <<<"empty not-parked tactic-foo"
  echo "verb=[$verb] a=[$a] b=[$b]"   # expect a=not-parked b=tactic-foo

  read -r verb a b <<<"empty"
  echo "verb=[$verb] a=[$a] b=[$b]"   # expect verb=empty, a and b both empty

  read -r verb a b <<<"cleared tactic-foo"
  echo "verb=[$verb] a=[$a] b=[$b]"   # expect a=tactic-foo (b unused by this verb)
  '
  ```
  This planning round already ran this exact repro by hand (not committed —
  see `rationale`) and confirmed all four shapes parse as expected; the
  implement session should re-run it after applying the edit as a fast
  sanity check, not as a substitute for landing the diff.
- No caller of `office-hours-graph` changes; this is an internal parsing fix
  with no interface change.
