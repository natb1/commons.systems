---
id: tactic-eval-finding-qa-fix-workflow-named-by-path
kind: tactic
statement: qa-fix/SKILL.md tells the worker to invoke the Workflow tool on the
  PATH .claude/workflows/qa-fix.js, but the tool resolves a registry NAME, so
  every qa worker reaching the triage step gets a not-found error whose own
  message lists the right value and burns a turn recovering
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
    - metric: workflow_not_found_errors
      value: 2
      unit: occurrences
      window: tactic-attention-namespaced-rank qa attempts 1 and 4, 2026-08-13
      sensor: transcript grep
      measured: 2026-08-13
    - metric: qa_workers_reaching_step4_affected
      value: 2
      unit: of 2 sessions
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13
      sensor: transcript grep
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## What was observed

Every `/qa-fix` worker that reaches the disposition-triage step invokes the
Workflow tool with a **file path** where the tool wants a registry **name**, gets
a hard `not found` error naming the correct value in its own message, and burns a
turn retrying.

The error, verbatim from the transcripts:

```
<tool_use_error>Workflow ".claude/workflows/qa-fix.js" not found.
Available: deep-research, code-review, align-tactics, qa-fix, review-fix</tool_use_error>
```

The workflow the worker wants — `qa-fix` — is in the "Available" list of the very
error that rejects it.

## Where it comes from

`.claude/skills/qa-fix/SKILL.md:339-340`:

> **Build `args`** and **invoke the Workflow tool on
> `.claude/workflows/qa-fix.js`** (a sanctioned caller — no `ultracode` keyword).

The Workflow tool resolves `name` against the workflow registry and takes a path
only via the separate `scriptPath` input. A worker following that sentence
literally passes the path as the name. The instruction is the defect; the workers
are complying with it.

## Recurrence

Measured on node `tactic-attention-namespaced-rank`, whose ladder ran `/qa-fix`
four times:

| session | phase attempt | hit |
| --- | --- | --- |
| `17e4bf6c-9ed4-440f-9cbb-ccc0f5ad9089` | qa attempt 1 (2026-08-13T02:18Z) | yes |
| `801bd0c6-ce82-42d8-a2db-28106c862648` | qa attempt 3 (04:08Z) | no — halted before this step |
| `72d549c3-2cf7-4dbc-b26e-e603364b81fa` | qa attempt 4 (14:05Z) | yes |

Both `/qa-fix` sessions that reached step 4 hit it; neither that reached it
escaped it. Counted with `grep -c 'qa-fix.js.. not found'` over each session
`.jsonl` under
`~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/`.

**A note for whoever re-measures this**: the transcript stores the message with a
JSON-escaped quote, so a naive `grep 'qa-fix.js" not found'` returns 0 on a file
that contains it. That false negative was hit and corrected during this
evaluation. Match the quote as `..` or search the unescaped fragment.

## Cost and severity

One wasted tool call plus one recovery turn per qa worker — small in tokens
(≈1 turn of a 171-turn session), but it is a *deterministic* error on the
documented happy path of a phase skill, and the recovery depends on the model
noticing that the rejection message contains the answer. A worker that instead
concluded "the qa-fix workflow does not exist" would skip the triage step
silently.

## What would have to change

One line in `.claude/skills/qa-fix/SKILL.md:339-340`: name the workflow `qa-fix`
(the registry name), or say `scriptPath: .claude/workflows/qa-fix.js` if the path
form is wanted. Sibling skills should be checked for the same phrasing —
`review-fix` and `align-tactics` are also registry entries reached by name.
