---
id: tactic-eval-finding-worktree-isolation-guard-refuses-worker-commands
kind: tactic
statement: Claude Code built-in worktree-isolation guard hard-refused 6 worker
  commands in one align-tactics phase — 75 percent of the phase non-schema tool
  errors and all 6 of its policy_blocks, at 0.84 usd of retry price proxy —
  because .claude/rules/sandbox.md documents the too-complex-to-verify variant
  only as a passing clause under a git -C heading and frames the cd-and-command
  variant as a permission-prompt cost rather than a hard refusal, so the guard
  has no section of its own for a worker to find
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
  first_seen: 2026-08-14
  measured_impact:
    - metric: isolation_guard_refusals
      value: 6
      unit: occurrences
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: policy_blocks
      value: 6
      unit: events
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: retry_price_proxy_usd
      value: 0.84
      unit: usd
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: retry_share_of_measured_price_proxy
      value: 0.013
      unit: fraction
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed on `tactic-attention-per-tier-boost-migration`, `align-tactics` phase, 2026-08-14

The largest tool-error class in this phase is Claude Code's built-in
worktree-isolation guard refusing commands the workers wrote, and it is a
documentation problem rather than a worker problem.

## The measurement

`aggregate-usage.sh --session adaffcf8-1144-41bf-b038-e0cddc37f89e`,
`.tool_errors` (six subagents; the orchestrator turn is unmeasurable, see
`tactic-eval-finding-align-tactics-worker-transcript-unscanned`, so this is a
floor):

| signature | count | sessions |
| --- | --- | --- |
| `This session is isolated in the worktree PATH, but this command is too complex to verify that it stays inside the worktr…` | 5 | 3 |
| `This session is isolated in the worktree PATH, but this command changes directory to the shared checkout (PATH) before r…` | 1 | 1 |
| `InputValidationError: StructuredOutput was called with input that could not be parsed as JSON` | 1 | 1 |
| `Output does not match required schema: root: must have required property 'reuse_candidates'…` | 1 | 1 |

**6 isolation refusals across 4 of 6 subagents** — 75 % of the phase's
non-schema tool errors. They line up one-for-one with the `permission_friction`
rows: `policy_blocks` totals **6** across the same sessions, with
`user_rejections: 0` and `automode_denials: 0`.

Cost of the retries: `retry_price_proxy_usd` summed across the six rows is
**$0.84**, against $65.92 measured phase price proxy — **1.3 %**. Small in this
phase; the reason to record it is that it is deterministic and free to prevent.

## Why this is the rule's fault, not the worker's

Lens 7's own doctrine: a rule violated repeatedly is usually a rule written
badly. `.claude/rules/sandbox.md` is the file a worker would consult, and its
treatment of this guard is scattered and partial:

- Under **"`git -C /path` is auto-approved for worktrees"** it documents the
  `-C`-flag refusal and mentions in passing that "a second variant refuses
  compound commands as too complex to verify; break those into plain separate
  commands." That one clause is the *only* mention of the variant responsible
  for 5 of the 6 refusals here, and it is filed under a heading about `git -C`,
  which is not what a worker writing a shell loop is looking up.
- The `cd <dir> && command` refusal is documented under **"Command pattern
  matching" → "Avoid `cd && command`"**, but framed as a *permission-prompt*
  problem ("misses rules like `Bash(npx vitest:*)`"), not as a hard refusal in
  an isolated session. A worker reading it would conclude the cost is a prompt,
  not a blocked call.

Neither the isolation guard's two refusal variants nor its remedy (one plain
command per call, or `Write` a script and run it) has a heading of its own.

## What would have to change

Give the worktree-isolation guard its own section in `.claude/rules/sandbox.md`,
stating both refusal variants (`-C` redirect; "too complex to verify" for
compound commands, loops, and redirects) and the two remedies, and cross-link it
from the `cd && command` entry. Recorded for the author.

Distinct from `tactic-eval-finding-unattended-worker-tool-use-rejected-midflight`:
that entry is the *permission gate* asking a non-existent human for approval
mid-flight (`user_rejections`). This one is the isolation guard's own hard
refusal, which never reaches the permission gate — `automode_denials` and
`user_rejections` are both 0 here.
