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
skills. **The orchestration loop for this lands in R3
(`tactic-rsi-implement-skill`) and is not built yet** — until it is, an
execute-class task is hand-orchestrated in this attended session using the
monitor's proven path: claim the node's worktree, spawn the phase skill for its
persisted phase as a **session** via `dispatch-graph-execute` /
`dispatch-spawn-job`, await the terminal disposition, verify the transition off
`origin/main`, repeat. Two rules hold either way:

- **Never hand-merge.** The tick's merge lane runs even while dispatch is
  paused. Let it.
- **Never run a phase skill in an Agent-tool subagent.** `/qa-fix`,
  `/review-fix` and `/align-tactics` depend on the Workflow tool, which a
  subagent cannot use. They must be spawned sessions.

On a park or a non-mechanical blocker, do not push through: conduct the
office-hours engagement here, attended, and record the outcome in the graph.

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
