---
id: tactic-eval-finding-unattended-worker-tool-use-rejected-midflight
kind: tactic
statement: A detached ladder worker with no human attached had a Bash tool use
  rejected by the permission gate 65 seconds INTO execution and was told to stop
  and wait for a user who does not exist, killing the review phase; the same
  rejection signature is the nodes largest non-exit-code tool-error class at 6
  occurrences across 5 sessions and hits read-only inspection commands too
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: permission_rejections_in_phase
      value: 3
      unit: count
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: sessions_with_a_rejection_in_phase
      value: 3
      unit: count
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rejection_signature_occurrences_node_scope
      value: 6
      unit: count
      window: tactic-attention-namespaced-rank all sessions
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rejection_signature_sessions_node_scope
      value: 5
      unit: count
      window: tactic-attention-namespaced-rank all sessions
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rejection_latency_after_tool_use_emitted_s
      value: 65
      unit: s
      window: tactic-attention-namespaced-rank review 2026-08-13T21:48:33Z..21:49:38Z
      sensor: session-transcript
      measured: 2026-08-13
    - metric: worker_sandbox_overrides_in_phase
      value: 13
      unit: count
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
# An unattended ladder worker's tool use is rejected mid-flight with no human present

## What was observed

`tactic-attention-namespaced-rank`, `review` phase, ladder launch
`2026-08-13T21:42:01Z` (`--since 1786657321`).

The review-fix worker `e68cfcc4-f3b7-4e99-875a-1363aeedcb9e` — a detached
`claude --bg` ladder worker with no human attached — issued its Step 1b Bash
tool use at `21:48:33.717Z`. The command **began executing** (the
`code-review-lock` sidecar was written at `21:48:35Z`, the child session at
`21:48:36.314Z`). Then, **65 seconds into execution**, at `21:49:38.668Z`, the
transcript records:

```
toolUseResult: "User rejected tool use"
tool_result: "The user doesn't want to proceed with this tool use. …
              STOP what you are doing and wait for the user to tell you how to proceed."
[Request interrupted by user for tool use]
```

The worker obeyed and stopped. The ladder halted 2m20s later
(`21:51:58Z`, exit 12) with `stalled — the worker stopped with no graph
change; read its transcript before re-running`. That halt verdict was
**accurate about the worker**: the defect is upstream of it.

No human was present. The mechanism behind the rejection is not established by
this evidence — it is either the auto-mode classifier arriving late on an
already-running call, or an interrupt delivered to the worker — but the effect
is recorded by `aggregate-usage.sh` as `permission_friction.user_rejections`,
so it is indistinguishable from an attended refusal in every downstream figure.

## It is not isolated

Two of the three subagents in this phase window carry the same signature:

| session | rejections | note |
| --- | --- | --- |
| `e68cfcc4-…` (worker) | 1 | the Step 1b `dispatch-code-review` launch |
| `agent-a79a2c3f3c15e889b` (code-review angle) | 1 | rejected while doing read-only inspection (`wc -l` over six `packages/intentionsutil/src/*.ts` paths, `Read` of `attention.ts`) |
| `agent-a34ac99010b84a930` (code-review angle) | 1 | — |

At node scope across the whole ladder, `aggregate-usage.sh` reports the
signature `The user doesn't want to proceed with this tool use` **6 times
across 5 sessions** — the single largest non-`Exit code N` tool-error class on
this node. Adjacent signatures in the same table are the shell analyzer giving
up rather than a policy decision: `Contains simple_expansion`,
`IFS assignment changes word-splitting — cannot model statically`,
`This Bash command contains multiple operations. The following part requires
approval: …`.

## The shape of the rejected command

The Step 1b command the review-fix skill prescribes begins with a bare `cd`
into the worktree and then runs a multi-statement body with command
substitution and a stderr redirect:

```
cd /home/n8/natb1/commons.systems/.claude/worktrees/tactic-attention-namespaced-rank
N="tactic-attention-namespaced-rank"
…
CR_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-code-review \
  --target "$REVIEW_BASE..HEAD" … 2>"tmp/code-review-$N.err")
```

`.claude/rules/sandbox.md` §"Avoid `cd && command` for write/execute commands"
documents exactly this hazard: `allowedTools` rules match from the start of the
command string, so a `cd`-prefixed compound never matches a static allow and
falls through to the classifier. The skill's own prescribed command violates
the repo's own documented rule, which is why the call is classifier-gated at
all rather than statically allowed. (Note the *preceding* Bash in the same
session — also `cd`-prefixed, but a plain heredoc plus one script call — was
allowed; the failing one adds `$( )` and `2>`.)

## Why it matters

An unattended worker that is told "STOP … and wait for the user to tell you how
to proceed" has no user. It cannot proceed and cannot escalate; it simply dies,
and the ladder sees an unexplained stall requiring a human to read the
transcript. The measured price of this one occurrence is **$37.75 price proxy
($9.25 cost) for zero graph change**, plus the destroyed detached review (see
`detached-code-review-dies-with-launcher`).

## What would have to change

Two independent levers, both outside this evaluator's authority to apply:

1. Make the Step 1b launch statically allowable — drop the `cd` prefix and the
   compound body in favour of a single script invocation that takes the
   worktree as an argument, so it matches an `allowedTools` prefix rule and is
   never classifier-gated. This is what `.claude/rules/sandbox.md` already
   prescribes.
2. Give an unattended worker somewhere to go on a rejection. Today the
   rejection text's instruction ("wait for the user") is unfollowable in a
   `--bg` session and the worker's only exit is silent death with a null
   `outcome` record.

Evidence a later session cannot rediscover: the worker transcript's rejection
record is at `21:49:38.668Z` in
`~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/e68cfcc4-f3b7-4e99-875a-1363aeedcb9e.jsonl`,
and `dispatch-session-digest --session e68cfcc4-…` surfaces it as
`last_user_request: "[Request interrupted by user for tool use]"`.
