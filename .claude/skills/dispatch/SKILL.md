---
name: dispatch
description: Manual override for the dispatch chain — runs /dispatch-propagate with the concurrency-cap gate bypassed. Use to force-spawn a worker, ignoring rate-limit pacing.
---

# Dispatch (manual override)

Run `/dispatch-propagate`'s instructions exactly, with one change: when you
reach the select-tick call (Section 1), pass `--bypass-cap`:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-select-tick [<N>] --bypass-cap
```

`--bypass-cap` skips the `dispatch-target-workers` concurrency gate entirely —
select-tick does not query the live worker count, never emits
`concurrency-cap`, and forces the run-scoped `<gap>` to 1 so the downstream
materialize-spawn call spawns one worker. The Section 2 materialize call then
carries `--gap 1` (the value the bypassed select-tick emitted on its decision
line) and no `--bypass-cap`.

Use this when you want to dispatch work *now*, ignoring rate-limit pacing. You
typed `/dispatch` because you accepted the cost; the gate that paces the
autonomous chain does not apply to a manual run.

The selection lock (`dispatch-acquire-lock`, acquired inside
`dispatch-select-tick`) is shared with `/dispatch-propagate`, so a manual run
cannot select the same target as an in-flight chain tick.
