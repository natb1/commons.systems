---
id: tactic-review-code-review-invocation-contract
kind: tactic
statement: Make the /code-review invocation actually run — replace the rejected
  Skill-tool call with the claude -p user-turn entry point, restore --fix, adopt
  --comment, and parse findings from text
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-31 review-fix token audit interview and
  corrected by its 2026-07-31 follow-up investigation, which supersedes this
  node's original direction to drop --fix. Measured: all 18 invocations of
  Skill(code-review, 'max --fix') were rejected with disable-model-invocation,
  so the built-in never ran and the finder hand-rolled a review in its place.
  See clarifications 22 and 24 on strategy-token-economy."
reading: null
gap: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---

# Make the /code-review invocation actually run — replace the rejected Skill-tool call with the claude -p user-turn entry point, restore --fix, adopt --comment, and parse findings from text

## Context

This node's original direction — "drop `--fix`, adopt `--comment`, remove the
dead outcome-mapping prose" — was recorded 2026-07-31 believing the built-in
ran and its `--fix` flag silently applied nothing. The follow-up investigation
the same day found otherwise, and **supersedes that direction**.

`/code-review` ships inside the Claude Code CLI bundle (not the
`code-review@claude-plugins-official` marketplace plugin, which is a different
PR-commenting command and is not installed here). Its frontmatter carries
`disable-model-invocation: true`, which blocks the `Skill` tool for any
model-driven agent.

Measured across 18 review-fix runs, 2026-07-27 to 07-31, CLI 2.1.220
throughout:

- 19 of 20 code-review finder transcripts issued
  `Skill(skill: "code-review", args: "max --fix")`. The 20th made no Skill
  call at all.
- **Every one was rejected**:
  `<tool_use_error>Skill code-review cannot be used with Skill tool due to
  disable-model-invocation</tool_use_error>` — 40 rejection events across the
  workflow corpus.
- The finder then wrote *"The built-in `/code-review` skill is not
  model-invocable in this environment. I'll perform the review directly at max
  effort"* and ran ~39 tool calls of its own review.
- The workflow reported that output as the built-in's. Undetected for four
  days; `strategy-token-economy` clarification 21 recorded a divergence on the
  strength of it.

So the built-in **has never run in dispatch**. `--fix` was never the problem:
the flag never reached the skill.

`/security-review` is unaffected — it carries no `disable-model-invocation`
mark and 17 of 18 invocations succeeded.

### Vendor-documented contract

From `https://code.claude.com/docs/en/code-review`, "Review a diff locally":

- Syntax: `/code-review [low|medium|high|xhigh|max|ultra] [--fix] [--comment] [<target>]`
- `--fix` — "applies the findings to your working tree after the review"
- `--comment` — "posts the findings as inline PR comments"
- Since **v2.1.218** the review runs as a background subagent with its own
  context window; its `--fix` edits land outside session checkpoints, so
  `/rewind` does not undo them — use git.
- Scripted entry point, given explicitly by the docs: `claude -p '/code-review ultra'`.
  A `-p` run is a **user turn**, which is why it can invoke a
  `disable-model-invocation` skill where a subagent cannot.
- In a `-p` run findings return **as text**, never through `ReportFindings`.
  Per-finding `outcome` values (`fixed` / `skipped` / `no_change_needed`)
  populate only when findings are *re-reported after being fixed later in the
  same session* — which this lane never does.

## Scope

`.claude/workflows/review-fix.js`, `finderPrompt` lines 454-470 (the
`code-review` branch), plus the `phase('finders')` fan-out at line 540.

### Unit 1 — verify the entry point (GATING)

Nothing below may land until this passes. Confirm, in a real dispatch
worktree:

- `claude -p '/code-review max'` runs and returns findings.
- Whether it needs `dangerouslyDisableSandbox` (`--comment` shells `gh`, which
  needs it per `.claude/rules/sandbox.md`; a nested session may also need
  network beyond the allowlist).
- What the nested session costs, and how it attributes — it is a *separate
  session*, so it interacts directly with `strategy-token-economy`
  condition 2 (attributability) and clarification 23 (the 75% untagged-turn
  breach). Record the reading.

If the entry point does not work, **stop and park**. Do not fall back to an
agent-performed review — that is the exact defect
`tactic-lane-instrument-substitution-guard` exists to prevent.

### Unit 2 — replace the invocation

- Remove the `Skill`-tool instruction from the finder prompt.
- Invoke via a script that shells `claude -p '/code-review max --fix --comment <target>'`
  in the worktree.
- Restore `--fix` (reverses this node's original direction; see
  `strategy-token-economy` clarification 22, amended).
- Verify invocation success at the source: exit status plus absence of the
  rejection string. A failure fails the lane loudly.

### Unit 3 — replace the outcome mapping

- Delete the per-finding `outcome` prose (`fixed` / `no_change_needed` /
  `skipped`). It is structurally unavailable in a `-p` run — **but do not
  merely delete it**: replace it with text parsing of the returned findings.
- Derive `fixed[]` from a **before/after `git diff`** of the working tree
  across the built-in's stage, not from any agent's self-report. This is
  `strategy-token-economy` clarification 25 applied concretely.

## Dependencies

- `tactic-lane-instrument-substitution-guard` should land **first**: it is the
  generic guard that makes a rejected invocation fail loudly instead of being
  silently substituted, and it is what prevents this class of defect
  recurring while the rewiring is in flight.
- Serialized-stage ordering is specified in `strategy-token-economy`
  clarification 24 and is part of this node's Unit 2 — the built-in runs as an
  exclusive stage **before** the owned lenses, never inside the parallel
  finder fan-out, because it writes the working tree.

## Reuse

- `.claude/rules/sandbox.md` — `gh` and nested-network calls need
  `dangerouslyDisableSandbox: true`.
- `.claude/workflows/review-fix.js` `diffContext(args)` (line ~451) already
  computes the target range to pass as `<target>`.

## Verification

- No `Skill` call for `code-review` remains anywhere in the workflow.
- A run's transcript shows the `claude -p` invocation and a zero exit status.
- `fixed[]` is non-empty on at least one run and every entry corresponds to a
  real hunk in the stage's before/after diff.
- Deliberately induce a failure (e.g. rename the command) and confirm the lane
  **fails** rather than producing findings.
