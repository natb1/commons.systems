---
id: tactic-dispatch-ladder-skill
kind: tactic
statement: Replace /dispatch-emulate with /dispatch-ladder — a detached shell
  driver that walks one node from align-tactics through merge-and-absorb to
  phase done with zero AI sequencing, keeping only throw engagement and the
  closing acceleration review with the caller
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-12 /align interview that recorded the
  replacement requirement on strategy-graph-native-dispatch (the entry 'What
  replaces /dispatch-emulate'). /dispatch-emulate carries its loop's sequencing
  and conditional logic in skill prose, which forces a model turn per phase step
  and — because the Bash tool's 600s ceiling is far below the measured phase
  durations — forces repeated model re-calls of await on exit 20. The author's
  requirement is that the loop's sequencing move into owned code and the AI
  carry as little as possible. This node supersedes
  tactic-dispatch-emulate-owns-merge and
  tactic-rsi-implement-acceleration-review, folding their scope in; both are
  blocked_by this node so neither is worked against a skill this node deletes.
  serves is deliberately two edges: the artifact is this dispatch skill surface
  (artifact-owner rule, clarification 27) and the closing-review requirement
  carried is strategy-recursive-self-improvement's condition 14 — keeping rsi
  preserves the rank the superseded node had rather than granting a new one."
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-graph-auto-merge-main-health-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Replace /dispatch-emulate with /dispatch-ladder — a detached shell driver that walks one node from align-tactics through merge-and-absorb to phase done with zero AI sequencing, keeping only throw engagement and the closing acceleration review with the caller

## Draft context (2026-08-12 /align interview)

Not yet planned — this is retained interview context, not a clean-session plan.
Every ruling below was made by the author in that interview and is **not** to be
re-litigated; the full reasoning is recorded on
`strategy-graph-native-dispatch` under "What replaces /dispatch-emulate — what
is /dispatch-ladder, how much of the loop may the AI carry, and what bounds a
detached driver?", and the four binding conditions landed on that node's
`attributes.conditions` in the same commit.

## Scope

1. **Rename, don't reinvent.** `dispatch-emulate-advance` (273 lines) and
   `dispatch-emulate-await` (312 lines) become `dispatch-ladder-advance` and
   `dispatch-ladder-await`, with their two test files. Their internals are not
   changed by this node — only who calls them. `.claude/skills/dispatch-emulate/`
   is deleted; `/rsi` Step 4b repoints by name.

2. **A shell driver owns the loop.** A new script walks
   advance → await → repeat, branching purely on exit codes. The whole branch
   surface, verified during the interview:

   | script | exit | meaning | driver action |
   |---|---|---|---|
   | advance | 0 | `launched` | await it |
   | advance | 2 | usage error / strategy refused | halt |
   | advance | 10 | `idle` — nothing to launch | halt, run complete |
   | advance | 11 | `throw` | halt, escalate |
   | advance | 13 | `claimed` | halt — never work around it |
   | await | 0 | `advanced` or `pruned` | loop |
   | await | 11 | `throw` (parked, blocked-by, held session) | halt, escalate |
   | await | 12 | `stalled` — worker stopped, nothing changed | halt, escalate |
   | await | 14 | `unknown-graph-read` | halt, escalate |
   | await | 20 | still running | call again, same args |

   Nothing here needs judgment. **NOT** a Workflow-tool script: a Workflow
   script has no filesystem or shell access — its only primitive is `agent()`,
   an AI subagent — so that substrate would *add* an AI layer to a loop that is
   already pure exit-code branching. The precedent is `dispatch-tick` itself.

3. **Detached execution.** A spawn script launches the driver as a transient
   `systemd-run --user` unit logging to journald, exactly as
   `dispatch-spawn-tick` does for the tick, and returns immediately. This is
   forced: measured phase durations (below) put a full ladder at hours against
   the Bash tool's 600s ceiling, and it is that ceiling which makes today's
   skill re-call `await` from the model — the precise AI sequencing being
   removed. A foreground driver would preserve the defect.

4. **Run to terminal state.** The ladder is `align-tactics` → `implement` →
   (`fix`/`conflict` interrupts) → `review` → `qa` → `main-qa`, and then the
   node-scoped **merge-and-absorb** step folded in from
   `tactic-dispatch-emulate-owns-merge`: `graph-auto-merge <node-id>` followed
   by `reconcile-graph-merged <node-id>`. Without the absorb half the node sits
   merged-but-stuck at phase `review` and await reports no advance. Halt only at
   phase `done`, a halt disposition, or a throw.

5. **A status script** the invoking session polls to terminus — the trigger for
   item 6.

6. **The closing acceleration review**, folded in from
   `tactic-rsi-implement-acceleration-review`. `strategy-recursive-self-improvement`
   condition 14 requires it after terminus, never interleaved. A shell driver
   cannot perform it, so the **invoking session** (or a later author-started
   one) polls to terminus and runs it there. It names evidence a later session
   cannot rediscover: phase wall-clock against the await window, launches that
   produced no code change, repeated operator interventions, and CI/fix-lane
   spend. It **records**; it never executes, and it is never a place to invent
   orchestration rules. A report item in the skill's Report section carries its
   findings and the nodes they landed as.

7. **Await-window sizing** — `--timeout-s`, see the measured evidence below.

## Out of scope, explicitly

- Changing the 540s `--timeout-s` **default in the script**. The default serves
  other callers, the flag is sufficient, and loop policy must not accumulate in
  the scripts. (Carried verbatim from the superseded node.)
- Any eligibility rule. `graph-select-target --node` owns every gate; the driver
  may **sequence**, never **gate**.

## Measured evidence for the await window — keep, this is irreplaceable

Carried from `tactic-rsi-implement-acceleration-review`, the first finding of
the 2026-08-11 acceleration review. The await script's default timeout is 540s,
and **every** phase of that iteration ran longer:

| phase | duration | await calls needed |
|---|---|---|
| implement | 14m10s | 2 |
| qa | 15m59s | 2 |
| fix | ~50m (11:21:15 to 12:11:55) | 6 |

Exit 20 is the documented call-again path, so none of this was an error — but
each extra call is a round trip that buys nothing, and **two were lost outright
when the session compacted and the backgrounded await died with it**. ~1800s is
the starting point for implement/qa/fix phases.

That last sentence is also the empirical case for item 3. The superseded node's
operational advice was "prefer a foreground call with a long tool timeout over a
backgrounded one, since a backgrounded await does not survive session teardown
or compaction, and its exit status is then stale rather than absent." That
advice was correct for a model-driven loop and is **superseded** here: a
transient systemd unit survives session teardown and compaction outright, which
removes the failure mode the advice was working around rather than steering
around it.

## Sequencing

`blocked_by: [tactic-graph-auto-merge-main-health-gate]`. The node-scoped merge
can only be delegated once `graph-auto-merge` owns the main-health admission
gate and takes a node-id filter. `tactic-pause-disables-merge-lane` (PR #3068)
precedes that one. Both superseded nodes are `blocked_by` this node so neither
is worked against a skill this node deletes.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

That confirms this node validates; it does **not** check the skill or script
work, and must not be reported as if it did. The real verification is a live
run: `/dispatch-ladder <node-id>` on a real tactic, confirming the ladder
advances between phases with **no model turn in between** (the whole point),
that a throw halts rather than retries, and that the run survives the invoking
session ending.
