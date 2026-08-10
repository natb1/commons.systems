---
id: tactic-target-workers-max-silent-corrupt-fallback
kind: tactic
statement: dispatch-target-workers --max silently returns the baked-in default 8
  on a corrupt/unreadable dispatch.config/target-workers.json instead of
  surfacing failure, so tactic-pace-exempt-ceiling-fanout's fail-closed guard
  never engages for the realistic config-tamper case
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
# dispatch-target-workers --max silently returns the baked-in default 8 on a corrupt/unreadable dispatch.config/target-workers.json instead of surfacing failure, so tactic-pace-exempt-ceiling-fanout's fail-closed guard never engages for the realistic config-tamper case

## Context

Surfaced by the review-fix pass on PR #3034 (`tactic-pace-exempt-ceiling-fanout`),
a `red-team` finding classified `Deferred` — valid, but out of scope for that
PR because the defect is in `dispatch-target-workers`, not in the caller that
PR changed.

## Finding

**Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers:238-262`
(the `--max` accessor), consumed by
`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:744`.

**Failure scenario:** `dispatch-target-workers --max` reads the ceiling via:

```bash
if CONFIG_OUT=$("$SCRIPT_DIR/dispatch-config-load" target-workers 2>/dev/null); then
  ...
fi
```

`MAX_WORKERS` starts at the baked-in default `8`
(`dispatch-target-workers:227`). If `dispatch-config-load` exits non-zero — a
truncated, schema-invalid, or otherwise corrupt
`dispatch.config/target-workers.json` — its stderr is swallowed by
`2>/dev/null` and the `if` simply doesn't enter the block. `MAX_WORKERS` is
left at its default, `8`, which is a perfectly valid integer, and `--max`
prints `8` on exit 0. `dispatch.config/` is untracked and lives outside every
git worktree (no PR review, no CI, no branch protection covers it), so any
process able to write that one file can truncate or corrupt it.

`tactic-pace-exempt-ceiling-fanout` (PR #3034) added a fail-closed guard in
`dispatch-select-tick`'s at-cap block that closes the pace-exempt lane when
`$MAX_WORKERS` does not match `^[0-9]+$`. That guard is correct for a
non-numeric or empty `--max` output, but it never fires for this corruption
path, because the corrupted config never produces a non-numeric value — it
silently produces the numeric default `8`. An operator who had hardened the
fleet to `max_concurrent_workers: 1` would silently get a ceiling of 8, and
because this is now the sole bound on the at-cap pace-exempt lane, a single
tick could admit up to 8 gate-exempt workers instead of the pre-fix hardcoded
`--top 1`. The routing-decision log would show this as an ordinary
`pace-exempt-bypass-at-cap` with `gap: 8` — nothing flags the tampering, and
`at-cap-ceiling-unreadable` (the skip_reason written to catch exactly this)
never fires.

**Adversarial verdict:** not independently re-verified by a skeptic pass (this
finding classified `Deferred`, not `Required`, so it did not enter
tactic-pace-exempt-ceiling-fanout's adversarial-verify stage); confirmed by
direct reading of `dispatch-target-workers:238-262` during review-fix triage —
the `2>/dev/null` swallow and the pre-set `MAX_WORKERS=8` default are as
described above.

**Source PR:** #3034.

## Relationship to tactic-config-unreadable-latch

Distinct from, and upstream of, `tactic-config-unreadable-latch`. That tactic
assumes the unreadable-config case is already *detected* at each call site and
proposes making the detected signal durable (a find-or-create latch node
instead of a log line). This finding is about detection itself failing for one
of that tactic's three named sites (`dispatch-select-tick:707`'s `--max` read):
a corrupt config never reaches `dispatch-select-tick` as an unreadable value at
all, because `dispatch-target-workers` absorbs the read failure internally and
emits its own numeric default. Fixing detection here (surfacing "config
present but unreadable" distinctly from "config absent, default is
intentional") is likely a prerequisite for `tactic-config-unreadable-latch`'s
MAX_WORKERS site to ever have anything to latch on.

Candidate fix directions (not decided by this node): (a) make
`dispatch-target-workers --max` distinguish "config file present but
unreadable/invalid" from "config absent" — e.g. non-zero exit or a sentinel
value — so `dispatch-select-tick`'s existing `|| MAX_WORKERS=""` fail-closed
branch actually engages; or (b) have `dispatch-select-tick` call
`dispatch-config-load target-workers` directly and close the pace-exempt lane
when it exits non-zero while the file exists.
