---
name: dispatch-ladder
description: Walk ONE tactic node the whole way up the dispatch phase ladder — align-tactics through main-qa, then the node-scoped reconcile pass (merge, absorb, review-stall route), to phase done — as a detached shell driver with no model turn between phases. For when the dispatch tick structurally cannot reach the node.
user-invocable: true
---

# Dispatch Ladder

Drive one node up the real dispatch ladder until it reaches phase `done` or
halts. Each phase runs as a real spawned session running the real dispatch phase
skill — nothing here re-implements a phase.

The dispatch router normally owns this. `/dispatch-ladder` is for when it cannot
reach the node — dispatch is paused and the fix is what would unpause it, or any
other bootstrap deadlock the tick has no route into — or when the author wants
one node driven under supervision.

**Detached execution, attended judgment.** The driver runs as a transient
systemd unit and outlives the session that launched it. What detaches is the
**waiting**, not the judgment: every halt is unconditional — no retry, no
auto-park, no resume — and stays halted until a person reads it and acts. The
session's job is to launch, poll, engage a halt if there is one, and run the
closing cross-phase synthesis. **Each phase is already evaluated by then** — the
driver spawns `/dispatch-ladder-eval` for every phase at its own boundary, and
for the phase a halted run owes — so what is left for this session is only what
no single phase's evaluator can see.

`/dispatch-ladder` inherits attended and pace-exempt status from whichever
attended thread invokes it (an author directly, or `/rsi` Step 4b). It has none
of its own.

## What this is not

Not a scheduler, not a selector, not a second orchestration surface. **The
driver may sequence; it may never gate.** Every eligibility question belongs to
a script that already owns it:

- `dispatch-ladder-advance` takes the phase directive from
  `graph-select-target --node <id>`, read at `origin/main` with **every**
  environmental gate applied — claim safety, the per-phase CI/PR sensor gates,
  the fix and conflict interrupts. `--node` is a selection-**order** override,
  not a gate bypass.
- It hands the launch to `dispatch-graph-execute`, which owns provisioning, the
  phase-skill mapping, the spawn, the reservation handoff, and every park/hold
  disposition.
- `dispatch-ladder-await` takes its verdict from `verify-landed` against
  `origin/main`, never from a session's exit status.
- `graph-auto-merge --node` owns the merge — the config kill-switch, the
  main-health admission gate, the park gate, the PR/CI sensing and the
  fail-closed scope-fingerprint re-check are all inside it.
- `reconcile-graph-merged --node` owns the absorb and its grace window.

**If a rule about when a node may run ever appears in these scripts, it is in
the wrong place.**

## Argument

`/dispatch-ladder <node-id>` — one **tactic** id.

A strategy id is refused: `dispatch-ladder-advance` gates on the selector's own
`kind` and prints `refused <id> strategy`, exit **2**. An `/align-tactics` pass
on a strategy decomposes it into child tactic ids rather than advancing the
strategy itself, so there is no single node for the loop to follow. Run
`/align-tactics <strategy-id>` directly, then invoke this on a child tactic.

A tactic whose selector rung is `align-tactics` — a draft, raw or frozen tactic
— is a legitimate starting point: `/align-tactics <tactic-id>` finalizes that
same node in place, so the ladder launches it normally.

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

`fix` and `conflict` are **interrupts** the selector injects, not rungs the
caller schedules. The run starts wherever the node's persisted phase says, and
each step re-reads that phase from `origin/main` — nothing is threaded between
iterations.

A clean `/review-fix` deliberately writes no phase — it leaves the node at
`review` and records the `reviewed` marker — so `dispatch-ladder-await` answers
`reviewed <id> review -> pending-merge` (exit 0) and the loop takes another
step. It is not a stall.

When there is nothing left to launch and the node is not yet `done`, the driver
runs one node-scoped **reconcile pass**, then takes another ladder step. The
pass takes the selection lock (`dispatch-acquire-lock` — the same lock
`dispatch-select-tick` holds across these same scripts) and syncs the main
checkout (`git fetch origin main`, then `git merge --ff-only origin/main`;
the reconcilers enumerate their candidates from the local tree, so an unsynced
checkout would merge straight past a park that landed after the run started).
Then it runs three scripts, once each:

- `graph-auto-merge --node <id>` — the merge.
- `reconcile-graph-merged --node <id>` — the absorb.
- `reconcile-graph-review-stall --node <id>` — the only route for a node the
  router classifies `pending-merge` (phase `review` plus the `reviewed`
  marker). Such a node is excluded from selector candidates, so the ordinary
  red-CI fix interrupt never fires on it. This sweep enters `execution.fix`,
  the router re-surfaces the node, and the next `advance` answers `launched
  <id> tactic fix /fix-checks`. **A reviewed node whose CI goes red is routed
  back into the ladder at `/fix-checks`; it does not halt.**

The pass answers `routed | merged | changed | quiet`. The first three are
progress, and the loop steps again. `quiet` is one of the two honest silences —
the reconciler's `GRAPH_RECONCILE_GRACE` window, or a PR whose CI is still
running — and is re-polled under the `--ci-wait-s` budget. No sleep ever happens
inside the pass, so none happens while the lock is held.

The run halts complete when the node is at phase `done` on `origin/main`, or
when it is gone from `origin/main` entirely (`pruned`).

## The per-phase evaluation

At every phase boundary the driver spawns `/dispatch-ladder-eval <node-id>
<phase> --since <launch-epoch>` as its own `claude --bg` job and **does not wait
on it**. The driver waits for the spawn's registration check, seconds; it never
waits for a model turn. A blocking evaluation would reintroduce exactly the
turn-in-the-loop the detached script exists to remove, and would leave the
driver gating on its own review.

`halt()` — the one terminal path, so exits 10, 11, 12, 13 and 21 all pass
through it — spawns the evaluation the run still owes for the phase it launched.
A halted run no longer records nothing; under the old terminus-only rule the
most defect-rich runs were exactly the ones that produced no review. A halt that
never launched a phase (`usage` / `refused`) spawns nothing, and a phase already
evaluated at its own boundary is not evaluated twice.

The spawn's `--name` carries the node id, the phase **and** the phase's launch
epoch. `dispatch-spawn-job` dedups on the name, so a name keyed on the node
alone would evaluate the first phase of a ladder and silently skip every phase
after it — and a name without the epoch would drop the second visit to a
recurring `fix` or `conflict` interrupt. A spawn failure is a logged warning and
never changes the run's exit code.

Model and effort are policy, not a call-site literal: `dispatch-phase-model` /
`dispatch-phase-effort` answer for the pseudo-phase `ladder-eval` (Sonnet today,
matching the sibling one-off jobs). Both events land in `events.jsonl` as
`eval` lines, so what was and was not evaluated is on the record.

## How to run

Every command below needs `dangerouslyDisableSandbox: true`: `gh` TLS, the
Claude daemon's Unix socket, and `systemd-run --user` / `systemctl --user` over
D-Bus (`.claude/rules/sandbox.md`).

**1. Launch. Returns immediately.**

```bash
.claude/skills/dispatch-ladder/scripts/dispatch-ladder-spawn <node-id>
```

Prints `spawned` (a transient unit `dispatch-ladder-<node-id>.service` is now
driving the node) or `deduped` (a ladder for this node is already running —
skip to step 2, do not try to launch a second). Exit **2** is a malformed node
id or driver flag; nothing was launched. Any other non-zero is a `systemd-run`
failure with its stderr passed through.

Pass-through flags, all optional: `--timeout-s <n>` (the await window per phase,
default 1800), `--max-run-s <n>` (whole-run wall clock, default 21600 = 6h),
`--poll-s <n>` (re-poll interval for an expected wait, default 60),
`--ci-wait-s <n>` (how long the driver will keep re-polling a reconcile pass
that changed nothing, default 3600 = 1h). Defaults are sized to measured phase
durations; change them only with a reason.

`--ci-wait-s` is one budget covering both honest silences — the reconciler's
`GRAPH_RECONCILE_GRACE` window and a PR whose CI is still running — logged as
distinct dispositions (`grace-wait` / `ci-wait`) in `events.jsonl`. It never
overrides `GRAPH_RECONCILE_GRACE`, which is the reconciler's policy; it bounds
how long this process polls, which is the driver's own concern. Exhausting it is
the exit 10 halt.

**2. Poll to terminus.**

```bash
.claude/skills/dispatch-ladder/scripts/dispatch-ladder-status <node-id> --wait
```

Prints one line, `<status> <node> <step> <phase> <disposition>`, absent fields
as `-`. Exit **20** means still running — the expected answer for a long
ladder; call again with identical arguments. Exit **0** is terminal. Exit **1**
means no state file yet (or a corrupt one); exit **2** is usage.

`--wait` polls for up to `--timeout-s` (default 540, under the Bash tool's 600s
ceiling) then returns exit 20 rather than being killed mid-poll. Poll from this
thread. Never background the poll — a backgrounded wait dies with the session,
and the whole point of detaching the driver is that the run does not.

Terminal statuses:

| status | meaning |
| --- | --- |
| `complete` | the node reached phase `done`, or was pruned. |
| `halted` | the driver stopped and wrote why — read `<disposition>`. |
| `orphaned` | state says running but the unit is not active: the driver was killed without writing a terminal state. Treat as terminal and read the journal. |

**3. Engage the halt, if there is one.** Then run the closing cross-phase
synthesis, then report.

**Evidence.** Two places, both needed:

```bash
journalctl --user -u dispatch-ladder-<node-id>.service --no-pager
cat <main-root>/.claude/worktrees/<node-id>.ladder/events.jsonl
```

`events.jsonl` is append-only and carries per-phase elapsed seconds, await
re-poll counts and the await window — as numeric `elapsed_s`, `await_repolls`
and `window_s` fields on the phase events, not as text to regex out of `detail`.
These are the evaluation's inputs, and nothing else records them. Its `eval`
lines say which phases were handed to `/dispatch-ladder-eval` and which spawn
failed.

## Halt dispositions

The driver's exit codes are deliberately the primitives' codes, so one
vocabulary spans the whole ladder. `dispatch-ladder-status` reports the
disposition; the journal says which script produced it.

| exit | disposition | what the session does |
| --- | --- | --- |
| 0 | `complete` / `pruned` | run the cross-phase synthesis, report. |
| 2 | `usage` / `refused` | fix the argument, or run `/align-tactics` on a refused strategy id. No phase ran, so nothing is owed. |
| 10 | `idle` | nothing left to launch, and the `--ci-wait-s` budget ran out with the reconcile pass producing no merge, no absorb and no fix route. Most likely the PR's CI is still pending, or a gate is holding it. Read the PR's checks and `dispatch-ladder-advance`'s event lines in the journal. Then the synthesis, over the phases that did run. |
| 11 | `throw` | **engage, attended, in this thread.** Parked, blocked-by, a held session, or a `held <id> (…)` from `graph-auto-merge` (`office-hours`, `missing-stamp`, `scope-stale`). Then the synthesis. |
| 12 | `stalled` | a phase ended with no graph change, or the requeue budget ran out. Read the worker's transcript before re-running. Then the synthesis. |
| 13 | `claimed` | another session holds the node. **Stop.** The synthesis belongs to whoever holds it. |
| 14 | `unknown-graph-read` | `origin/main` could not be read; nothing is claimed either way. Re-run once the read works. Then the synthesis, if a phase ran. |
| 21 | `timeout` | `--max-run-s` exceeded. The ladder is unfinished and nothing was rolled back. Then the synthesis. |
| 1 | `internal` | the driver's own error — an unmapped exit code, an unwritable state dir. Then the synthesis, if a phase ran. |

**A halted run still owes its review.** Every row above except `usage` /
`refused` and `claimed` carries the synthesis, and the driver has already
spawned the per-phase evaluation for the phase it was in. Halting is not an
exemption: the most defect-rich runs are exactly the ones that halt, and a
halted run that recorded nothing was the defect the two-tier review closed.

**Never push through a halt and never re-spawn blindly.** A halt is a person's
call; a re-spawn that has not first addressed the cause spends budget on a
repeat.

## Stepping one phase by hand

The escape hatch, for debugging the ladder itself — not the normal path. These
two primitives are what the driver calls; running them by hand puts the
sequencing back in the model turn, which is exactly what this skill exists to
remove.

```bash
.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance <node-id>          # launch one phase
.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await   <node-id> <phase>  # wait, then verify
```

`dispatch-ladder-advance` prints `launched <id> <kind> <phase> <skill>`; hand
that `<phase>` to `dispatch-ladder-await` as the from-phase. `await` exit **20**
means still running — call again with identical arguments; its default
`--timeout-s` is 540. Both need `dangerouslyDisableSandbox: true`. Their headers
carry the full exit-code contracts; read them there.

The reconcile pass has no hand equivalent here — it is the driver's step. Do not
run `graph-auto-merge` or `reconcile-graph-review-stall` yourself to finish a
halted ladder.

## Three rules, none negotiable

- **Never hand-merge.** The merge is this loop's own node-scoped step:
  `graph-auto-merge --node <id>`, which owns every gate, followed by
  `reconcile-graph-merged --node <id>`. That step runs inside the driver even
  while dispatch is paused, so a paused run no longer stops with its PR reviewed
  and unmerged. A hand `gh pr merge` is still forbidden — it bypasses the
  main-health admission gate, the park gate and the scope-fingerprint re-check,
  and leaves the node merged-but-unabsorbed. When `graph-auto-merge` prints
  `held`, that is the gate doing its job: engage it, never route around it.
  The same pass runs `reconcile-graph-review-stall --node <id>`, so red CI after
  a clean review is the ladder's business too, not an operator's: the sweep
  enters `execution.fix` and the next step launches `/fix-checks`. Do not set
  the fix state by hand, file a fix by hand, or re-run the review to shake it
  loose.
- **Never run a phase skill in an Agent-tool subagent.** `/qa-fix`,
  `/review-fix` and `/align-tactics` depend on the Workflow tool, which a
  subagent cannot use. They must be spawned sessions — which is what
  `dispatch-graph-execute` does.
- **Never work a node dispatch is working.** Exit 13 is the mutual exclusion,
  not an obstacle to route around. The systemd unit name dedups identical
  launches as a convenience; it is never the authority on whether a node is
  held.

## The closing cross-phase synthesis

Required by `strategy-recursive-self-improvement` condition 14 as amended
2026-08-12 — read it at `origin/main`; it is authoritative and this is the
closing half of its mechanism. The per-phase half already ran: see
`/dispatch-ladder-eval`, spawned by the driver at every phase boundary and for
the phase a halted run owes.

Run it **after** the run reaches terminus — complete or halted — never
interleaved: it evaluates observed results, not predictions. The invoking
session runs it, or a later author-started session polls the same node to
terminus and runs it there.

**It covers only what no single phase's evaluator can see.** Everything
phase-local — that phase's errors, round trips, rework counters, permission
friction, its own elapsed-against-window calibration — belongs to
`/dispatch-ladder-eval` and is not re-derived here. What is left is exactly
three things:

- **Rework loops across phases** — the shape the sequence makes: `implement` →
  `qa` → `fix` → `qa` again, a demotion back to `implement`, a `review` that had
  to be re-run. One phase's evaluator sees its own attempt; only the whole run
  shows the loop.
- **The halt-cause taxonomy** — which halt this run took, and whether the cause
  belonged to the node, the gates, or the driver. Over runs this is what
  separates a recurring structural halt from a one-off.
- **End-to-end wall clock against the plan** — total run time against what the
  plan predicted, and where it actually went: phase time against `ci-wait` and
  `grace-wait` time (`events.jsonl` keeps the two silences distinct, and nothing
  can tell them apart afterwards).

**It records; it never executes.** Every finding lands in the graph in this same
session, through the same ledger the per-phase evaluator uses
(`dispatch-eval-finding`: `--list` first, judge whether the finding in hand IS
an existing entry, then record against that slug) — one entry per distinct
finding, never one per occurrence. Findings left in session prose only are a
defect: the graph is the sole tracker, so an unrecorded finding is
indistinguishable from one never made.

It is never a place to invent an orchestration rule. A finding that wants one is
recorded as a node for the author, not applied.

## Report

State:

- the node, and the phases it traversed this run;
- the terminal disposition and which script produced it;
- what landed at `origin/main` (commits, PR, the merge and absorb);
- what a next invocation would pick up;
- the cross-phase synthesis's findings and the ledger entries they landed as;
- which phases the driver handed to `/dispatch-ladder-eval`, from the `eval`
  lines in `events.jsonl` — a phase with no `eval` line is an unevaluated phase,
  and saying so is part of the report.
