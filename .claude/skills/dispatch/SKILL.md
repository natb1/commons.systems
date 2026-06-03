---
name: dispatch
description: Manual entry point for the dispatch chain — runs one headless dispatch-tick and relays its output live. `/dispatch <N>` targets one issue/PR and skips the concurrency gate; bare `/dispatch` spawns a single worker, exempt from the autonomous bounds (pace curve + `MAX_WORKERS`), never capped.
---

# Dispatch (manual shim)

Run the headless tick and relay its output live:

```bash
# bare /dispatch (single gate-exempt worker):
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
spawned a worker, queue empty, already at cap, CI waiting (reseed scheduled),
conflict-resolver job spawned, etc.

## Cap semantics

`/dispatch <N>` (explicit target): the tick skips the concurrency gate and
processes that one target (gap=1). A human forcing a specific target is never
paced by the autonomous budget.

`/dispatch` (no argument): a bare manual `/dispatch` skips BOTH the pace-curve
budget (`dispatch-target-workers`, which a budget pause can drop to 0) AND the
`MAX_WORKERS` concurrency ceiling, and spawns exactly ONE gate-exempt worker (the
highest-priority queue target), never emitting `concurrency-cap`. Fan-out is the
autonomous chain's behavior only.

## Selection lock

The selection lock (`dispatch-acquire-lock`, acquired inside
`dispatch-select-tick`) is shared with the autonomous chain, so a manual run
cannot select the same target as an in-flight tick. Merge conflicts are handled
by a spawned `/dispatch-resolve-conflict` bg job, not this session.
