---
name: dispatch
description: Manual override for the dispatch chain — runs /dispatch-propagate with the concurrency-cap gate bypassed. Use to force-spawn a worker, ignoring rate-limit pacing.
---

# Dispatch (manual override)

Run `/dispatch-propagate`'s instructions exactly, with one change: Step 6
spawns unconditionally. Skip the `dispatch-target-workers` gate — do not
query the live worker count, do not emit `drain concurrency-cap`, always
call `dispatch-spawn-worker` and proceed to Step 7.

Use this when you want to dispatch work *now*, ignoring rate-limit pacing.
You typed `/dispatch` because you accepted the cost; the gate that paces the
autonomous chain does not apply to a manual run.

The Selection lock (`dispatch-acquire-lock`) is shared with
`/dispatch-propagate`, so a manual run cannot select the same target as an
in-flight chain tick.
