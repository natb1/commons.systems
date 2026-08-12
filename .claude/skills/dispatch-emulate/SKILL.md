---
name: dispatch-emulate
description: Drive ONE tactic node through the real dispatch phase ladder by hand, one phase at a time, as spawned sessions reusing the dispatch phase skills verbatim — for when the dispatch tick structurally cannot reach the node.
user-invocable: true
---

# Dispatch Emulate

Emulate one dispatch tick's worth of work per phase, for a single node, serially,
until it leaves the ladder. Each phase runs as a real spawned session running the
real dispatch phase skill — nothing here re-implements a phase.

The dispatch router normally owns this. `/dispatch-emulate` is for when it cannot
reach the node — dispatch is paused and the fix is what would unpause it, or any
other bootstrap deadlock the tick has no route into — or when the author wants
one node driven under supervision.

The loop is attended because its callers are — invoked directly by an author, or
by `/rsi`'s execute step. It has no attended or pace-exempt status of its own.

## What this is not

Not a scheduler, not a selector, not a second orchestration surface. Every
eligibility question belongs to the selector; the two scripts decide nothing.

- `dispatch-emulate-advance` takes the phase directive from
  `graph-select-target --node <id>`, read at `origin/main` with **every**
  environmental gate applied — claim safety, the per-phase CI/PR sensor gates,
  the fix and conflict interrupts. `--node` is a selection-**order** override,
  not a gate bypass.
- It hands the launch to `dispatch-graph-execute`, which owns provisioning, the
  phase-skill mapping, the spawn, the reservation handoff, and every park/hold
  disposition.
- `dispatch-emulate-await` takes its verdict from `verify-landed` against
  `origin/main`, never from a session's exit status.

**If a rule about when a node may run ever appears in these scripts, it is in the
wrong place.**

## Argument

`/dispatch-emulate <node-id>` — one **tactic** id.

A strategy id is refused: `dispatch-emulate-advance` gates on the selector's own
`kind` and prints `refused <id> strategy`, exit **2**. An `/align-tactics` pass on
a strategy decomposes it into child tactic ids rather than advancing the strategy
itself, so there is no single node for the loop to follow. Run `/align-tactics
<strategy-id>` directly, then invoke this on a child tactic.

A tactic whose selector rung is `align-tactics` — a draft, raw or frozen tactic —
is a legitimate starting point: `/align-tactics <tactic-id>` finalizes that same
node in place, so the loop launches it normally.

## The ladder

The phase → skill map is `dispatch-graph-execute`'s, read from the persisted
phase and never re-derived:

| phase | skill |
| --- | --- |
| `align-tactics` | `/align-tactics` |
| `implement` | `/implement` |
| `fix` | `/fix-checks` |
| `conflict` | `/dispatch-conflict` |
| `review` | `/review-fix` |
| `qa` | `/qa-fix` |
| `main-qa` | `/qa-main` |

`fix` and `conflict` are **interrupts** the selector injects, not rungs the caller
schedules. The loop starts wherever the node's persisted phase says, and each
`dispatch-emulate-advance` re-reads that phase from `origin/main` — nothing is
threaded between iterations.

## The loop

```bash
.claude/skills/dispatch-emulate/scripts/dispatch-emulate-advance <node-id>          # launch one phase
.claude/skills/dispatch-emulate/scripts/dispatch-emulate-await   <node-id> <phase>  # wait, then verify
```

Both need `dangerouslyDisableSandbox: true` (gh, the Claude daemon Unix socket,
git, direnv — `.claude/rules/sandbox.md`). `dispatch-emulate-advance` prints
`launched <id> <kind> <phase> <skill>`; hand that `<phase>` to
`dispatch-emulate-await` as the from-phase.

1. `dispatch-emulate-advance <id>`. Exit **0** (`launched`) means a session is
   running — go to 2. Exit **10** (`idle`) means there is nothing to launch — not
   selectable, ci-waiting, stale-selection, or scope-stale-demoted; stop the loop
   and read its stderr event lines. Exit **11** (`throw`) — go to step 5. Exit
   **13** (`claimed`) means a live session or an unreclaimed reservation marker
   holds the node; **stop**, and never work around it. Exit **2** is a usage
   error or the strategy refusal above.
2. `dispatch-emulate-await <id> <phase>`. Exit **20** (`running`) means still
   working — this is the **expected** result for any phase longer than the 540s
   `--timeout-s` window; call it again with identical arguments, as many times as
   it takes. Exit **0** means the node `advanced`, or was `pruned` and the loop is
   done. Exit **11** (`throw`: parked, blocked-by, or a held session), **12**
   (`stalled`), and **14** (`unknown-graph-read`) go to step 5.
3. On exit 0, return to 1.
4. Stop when advance reports `idle` or await reports `pruned`. A node that reaches
   `main-qa` and merges leaves through `idle` — the tick's merge lane, not this
   loop, finishes it.
5. On any throw: **do not push through and do not retry blindly.** Stop the loop,
   report, and conduct the engagement in the calling thread, attended. A `stalled`
   (12) means the worker stopped having changed nothing — read its transcript
   before re-running.

## Three rules, none negotiable

- **Never hand-merge.** Neither script makes a merge, a graph write, or a `gh`
  call. The merge belongs to `graph-auto-merge`, which the dispatch tick calls —
  and while dispatch is **paused** that lane does not run: `graph-auto-merge` is
  invoked only inside `dispatch-select-tick`, which sits past the pause
  short-circuit. So a paused run stops with its PR reviewed and unmerged, and an
  operator clears it with `dispatch-tick --manual`. Do not merge it by hand to
  get past this. (`tactic-pause-disables-merge-lane` makes the paused tick drain;
  `tactic-dispatch-emulate-owns-merge` gives this loop its own node-scoped merge
  step, after which this rule is rewritten again.)
- **Never run a phase skill in an Agent-tool subagent.** `/qa-fix`, `/review-fix`
  and `/align-tactics` depend on the Workflow tool, which a subagent cannot use.
  They must be spawned sessions — which is what `dispatch-graph-execute` does.
- **Never work a node dispatch is working.** Exit 13 is the mutual exclusion, not
  an obstacle to route around.

## Report

On exit, state: the node and the phases it traversed this run; the terminal
disposition and which script produced it; what landed at `origin/main` (commits,
PR); and what a next invocation would pick up.
