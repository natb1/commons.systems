---
name: dispatch
description: Manual entry point for the dispatch chain — runs one headless dispatch-tick and relays its output live. `/dispatch <N>` targets one issue/PR and skips the concurrency gate; bare `/dispatch` runs an ungated fan-out, exempt from the autonomous bounds — it fans out over the eligible queue and is never capped.
---

# Dispatch (manual shim)

Run the headless tick and relay its output live:

```bash
# bare /dispatch (manual fan-out):
.claude/skills/dispatch-propagate/scripts/dispatch-tick --manual
# /dispatch <N> (explicit target):
.claude/skills/dispatch-propagate/scripts/dispatch-tick <N>
```

Run with `dangerouslyDisableSandbox: true` and `timeout: 600000` — the tick's
lock acquisition uses `--wait`, which can block up to ~300 s under contention,
and the sub-scripts need `gh`, the local Claude daemon, and tmp state.

Relay each stdout line to the user as it arrives: the jit:/calendar: passthrough
lines, the decision line, and the materialize detail plus terminal token. The
audit record for autonomous ticks is journald + worker transcripts + GitHub side
effects; a human-typed run wants live UX, and relay is this shim's entire
purpose.

After the tick exits, report the terminal disposition — what the tick did:
spawned a worker, fanned out N workers, queue empty, already at cap, CI
waiting (reseed scheduled), conflict-resolver job spawned, etc.

## Cap semantics

`/dispatch <N>` (explicit target): the tick skips the concurrency gate and
processes that one target (gap=1). A human forcing a specific target is never
paced by the autonomous budget.

`/dispatch` (no argument): a bare manual `/dispatch` is exempt from BOTH the
pace-curve budget (`dispatch-target-workers`, which a budget pause can drop to 0)
AND the `MAX_WORKERS` concurrency ceiling — it fans out one worker per eligible
distinct target until the queue is exhausted and NEVER emits `concurrency-cap`.
The only bound is queue availability.

## Selection lock

The selection lock (`dispatch-acquire-lock`, acquired inside
`dispatch-select-tick`) is shared with the autonomous chain, so a manual run
cannot select the same target as an in-flight tick. Merge conflicts are handled
by a spawned `/dispatch-resolve-conflict` bg job, not this session.
