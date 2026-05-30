---
name: dispatch
description: Manual override for the dispatch chain — runs /dispatch-propagate with the concurrency-cap gate bypassed. Use to force-spawn a worker, ignoring rate-limit pacing.
---

# Dispatch (manual override)

Run `/dispatch-propagate`'s instructions exactly, with one change: when you
reach the materialize-and-spawn call (Section 2), pass `--bypass-cap`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-materialize-spawn <N> <explicit|queue> --bypass-cap
```

`--bypass-cap` skips the `dispatch-target-workers` concurrency gate entirely —
the script does not query the live worker count, never emits `drain
concurrency-cap`, and always calls `dispatch-spawn-worker`.

Use this when you want to dispatch work *now*, ignoring rate-limit pacing. You
typed `/dispatch` because you accepted the cost; the gate that paces the
autonomous chain does not apply to a manual run.

The selection lock (`dispatch-acquire-lock`, acquired inside
`dispatch-select-tick`) is shared with `/dispatch-propagate`, so a manual run
cannot select the same target as an in-flight chain tick.
