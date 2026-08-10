---
name: rsi
description: Run one recursive-self-improvement iteration over the dispatch harness — claim the serialized rsi worktree, refresh rsi-plan.md via /rsi-plan, judge what the flags mean, and either record harness work in the graph or execute rsi-plan tasks to budget. Attended and author-invoked; one iteration per invocation; fails closed when another rsi session holds the claim.
user-invocable: true
---

# RSI

One iteration of the recursive self-improvement loop over the dispatch harness,
per invocation. Recorded in `intentions/strategy-recursive-self-improvement.md`
— read it at `origin/main` before deciding anything; the nine conditions and
twelve clarifications there are authoritative and this file is their mechanism.

**What this skill is not.** It is not a graph executor and not a second
orchestration surface. The dispatch router owns execution. `/rsi` plans harness
optimization and, where the critical path is genuinely deadlocked, shortcuts one
node through the **existing** dispatch phase skills, reused verbatim. If you
find yourself writing an orchestration rule that dispatch does not already have,
stop — that is the divergence the record forbids.

**Attended, never cron** (strategy condition 9). `/rsi` is author-invoked and
runs with the author present. Do not schedule it, do not wake it up, do not
chain iterations. Unattended recursion is the harness's job; the interactive
limbs below exist precisely because the author is there.

## Step 0 — Claim, fail closed

```bash
.claude/skills/rsi/scripts/rsi-claim
```

Run this **with `dangerouslyDisableSandbox: true`** — it reads the Claude daemon
over a Unix socket the sandbox blocks silently (`.claude/rules/sandbox.md`), and
sandboxed it exits 12 rather than lying.

The `strategy-recursive-self-improvement` worktree IS the claim (worktree-as-
claim, the router's own liveness rule — no lock file, no second detection
mechanism). Outcomes:

- **exit 0** — prints the worktree path. Proceed.
- **exit 11** — another `/rsi` session holds it. **Print the script's message to
  the author and stop.** Do not wait, do not retry in a loop, do not work around
  it. Serialization is the design.
- **exit 12** — the probe could not answer. Also stop: an unanswerable probe is
  held, never free.

On exit 0, enter the worktree — `provision-node-worktree strategy-recursive-self-improvement <phase>`
if it does not exist, otherwise `EnterWorktree` at the printed path followed by
the mandatory `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh`.
A non-zero freshness check means STOP and freshen; never proceed on unverified
state.

## Step 1 — Refresh the plan (subagent)

Invoke `/rsi-plan` in a subagent. It drafts the three queue summaries onto their
owning strategy nodes, runs `render-rsi-plan.ts`, lands `rsi-plan.md`, and
returns the staleness flags.

Rendering is the subagent's whole job. It returns flags; it recommends nothing.

## Step 2 — Judge (main thread, never delegated)

This is the step that makes `/rsi` more than a dashboard, and it is why the loop
is attended. Read the returned flags and `rsi-plan.md`, then decide — in this
thread, with the author reachable:

1. **What does each flag mean?** A `threshold-breach` may be a real regression, a
   sensor measuring the wrong thing, or a threshold that has outlived its
   framing. Say which.
2. **What graph updates are required?** Harness defects become tactic nodes.
   Ambiguities in author intention become office-hours items. Nothing that
   matters is tracked anywhere but the graph.
3. **Harness or rsi?** Default: the harness does the work. Route to an rsi
   shortcut ONLY for a critical-path item the harness structurally cannot reach
   — the bootstrap-deadlock case (dispatch paused, the fix is what would unpause
   it; a node blocked by a park only the author can clear). "It would be faster"
   is not a reason.
4. **Is an `/align` session needed?** When a finding cannot be resolved from
   recorded guidance — the author's intent is genuinely unrecorded — escalate to
   `/align` rather than guessing. That is step 3.
5. **How should the task plan change?** Completed tasks come out, missing
   critical tasks go in. The plan is re-derived every iteration, not appended to.

**Evaluation scope** each iteration, from the recorded requirement:

- bugs inconsistent with documented intention;
- execution inefficiencies — token waste from poorly managed context,
  unoptimized model choice, redundant work, repeated errors;
- ambiguities in author intention, e.g. parked office-hours nodes sitting on the
  critical path;
- technical debt not justified by the current greenfield design.

**The fitness function** (strategy clarification 10) is what all of this
optimizes: the value the combined dispatch + office-hours + rsi system delivers
toward author intentions — closure velocity plus strategy signal progress, per
token, attributed per workflow. Dispatch is expected to dominate spend; a
`spend-deviation` flag is a review trigger, not a datum to note and pass.

## Step 3 — Escalate to `/align` when intent is unrecorded

Only for findings step 2 could not resolve from the record. `/align` runs the
interview and lands the strategy edit; come back here after.

## Step 4 — Act, to budget

**Budget** (strategy condition 6): each session's default budget is **1**. An
rsi-implement task costs **1**; every other task costs **0** unless its node
declares `attributes.rsi_cost`. Execute until the budget is exhausted, then stop
and report — do not overrun because something looks nearly done.

Two kinds of work:

**4a — Record (cost 0).** Draft tactics for the harness optimizations step 2
identified, as graph nodes serving the right strategy. Land via `graph-commit`;
verify by parsing `origin/main`, never by exit code. Most iterations should be
mostly this: the harness does the work, rsi decides what the work is.

**4b — Execute (cost 1 each).** Drive a claimed node through the dispatch phase
skills, one phase at a time, with two scripts:

```bash
.claude/skills/rsi/scripts/rsi-advance <node-id>          # launch one phase
.claude/skills/rsi/scripts/rsi-await   <node-id> <phase>  # wait, then verify
```

Both need `dangerouslyDisableSandbox: true` (gh, the Claude daemon socket, git,
direnv — `.claude/rules/sandbox.md`). `rsi-advance` prints
`launched <id> <kind> <phase> <skill>`; hand that `<phase>` to `rsi-await` as the
from-phase. The loop is:

1. `rsi-advance <id>`. Exit **0** means a session is running — go to 2. Exit
   **10** means there is nothing to launch (not selectable, CI still pending, a
   stale selection); stop the loop and read its stderr. Exit **11** means throw
   — go to step 5 below. Exit **13** means another session holds the node;
   **stop**, and never work around it.
2. `rsi-await <id> <phase>`. Exit **20** means still working — call it again with
   the same arguments, as many times as it takes. Exit **0** means the node
   advanced (or was pruned, and the loop is done). Exit **11**, **12** or **14**
   go to step 5.
3. On exit 0, return to 1. The next `rsi-advance` re-reads the phase from
   `origin/main`, so nothing needs to be threaded between iterations.
4. Stop when `rsi-advance` reports `idle` or `rsi-await` reports `pruned`. A
   node that reaches `main-qa` and merges leaves the loop through `idle` — the
   tick's merge lane, not this loop, finishes it.
5. On any throw: **do not push through and do not retry blindly.** Conduct the
   office-hours engagement here, attended, and record the outcome in the graph.
   A `stalled` (12) in particular means the worker stopped having changed
   nothing — read its transcript before spending budget on a repeat.

**What the scripts do and do not decide.** They decide nothing about
eligibility. `rsi-advance` delegates the phase directive to
`graph-select-target --node <id>` — every environmental gate applied verbatim,
including the CI and PR sensor gates and the fix/conflict interrupts — and the
launch to `dispatch-graph-execute`, which owns provisioning, the phase-skill
mapping, the reservation handoff, and every park/hold disposition. `rsi-await`
takes its verdict from `verify-landed` against `origin/main`, never from a
session's exit status. **If a rule about when a node may run ever appears in
these scripts, it is in the wrong place** — that is the second-orchestration-
surface divergence the record forbids.

Three rules hold, and none of them is negotiable:

- **Never hand-merge.** The tick's merge lane runs even while dispatch is
  paused. Let it. Neither script makes a merge, a graph write, or a `gh` call.
- **Never run a phase skill in an Agent-tool subagent.** `/qa-fix`,
  `/review-fix` and `/align-tactics` depend on the Workflow tool, which a
  subagent cannot use. They must be spawned sessions — which is what
  `dispatch-graph-execute` does.
- **Never work a node dispatch is working.** `rsi-advance` refuses on exit 13
  when a live session or an unreleased ledger marker claims the node, and it
  writes its own marker before spawning so the boot window is covered. Exit 13
  is the mutual exclusion, not an obstacle to route around.

## Pause and resume authority

`/rsi` holds pause/resume authority over the dispatch queue for integrity errors
affecting the stability or correctness of the workflow (strategy condition 4).

- Pause through the **doctrinal** mechanism — the `dispatch.config` boolean once
  `tactic-dispatch-pause-config-field` lands; the sentinel file
  (`${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/paused`) is interim
  practice, read canonically by `lib-pause-state.sh`'s `dispatch_pause_state`.
- **Every pause records explicit, mechanically evaluable resume criteria** as
  structured data, rendered into `rsi-plan.md`. A pause with no recorded
  criterion, or with prose-only criteria no check can evaluate, is a defect.
- **Never lift a pause early without recording why.** Resume when every recorded
  criterion holds, having re-measured each — not when the queue looks quiet.

`/rsi` and its work are pace-exempt: the budget and the serialization are the
throttle, not the pace curve (strategy condition 7).

## Step 5 — Report and stop

One iteration per invocation. Report:

1. the flags and what you judged each to mean;
2. what landed — nodes, `rsi-plan.md`, any pause/resume act, with commits;
3. budget spent and what it bought;
4. what the next iteration should pick up first.

Then stop. Do not start another iteration.
