---
name: ref-wiggum-loop
description: Complete loop documentation for iterative evaluate-and-converge pattern — resume from any step after context loss
---

# Wiggum Loop Reference

## Instruction Set Interface

Callers provide three instruction sets, plus one optional:

- **Next step instructions**: Generate next steps (e.g., invoke a review skill)
- **Evaluation instructions**: Determine iterate vs terminate (e.g., user classifies review findings)
- **Termination instructions**: Execute when loop ends (e.g., post audit log as PR comment)
- **Progress report instructions** (optional): Execute after each evaluation to report intermediate results (e.g., update a PR comment with current iteration status)

## Rules

Plan mode is mandatory at Steps 0 and 3, regardless of loop complexity.

## State Persistence

Before executing each step, update the issue body state with `wiggum_step` and `wiggum_step_label` set to the current step number and label via `.claude/skills/ref-pr-workflow/scripts/issue-state-write`. Include all existing state fields (`step`, `step_label`, `phase`, `active_skills`) alongside the updated wiggum fields.

```bash
.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":8,"step_label":"QA Review Loop","phase":"qa","active_skills":["ref-memory-management","ref-pr-workflow","ref-qa","ref-wiggum-loop"],"wiggum_step":1,"wiggum_step_label":"Execute Next Step"}'
```

**Plan mode boundary rule:** Steps that exit plan mode (Steps 0 and 3) must advance `wiggum_step` to the next step *before* the exit. Plan mode exits are context-clearing boundaries — if context clears before the next step writes its own state, the session resumes at the stale `wiggum_step` value and re-executes the current step.

## Step 0. Initialize

Enter plan mode. Write a complete new plan from scratch — do not edit or patch any existing plan file. The plan must include all instruction sets: next step, evaluation, termination, and progress report (if provided).

Before exiting plan mode, update issue state to advance `wiggum_step` to 1:

```bash
.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{ ... "wiggum_step":1,"wiggum_step_label":"Execute Next Step"}'
```

## Step 1. Execute Next Step

Execute the next step instructions from the plan.

## Step 2. Evaluate

Execute evaluation instructions against Step 1 output. This may involve user interaction (e.g., presenting findings for classification).

**STOP. If progress report instructions are provided, execute them now before determining outcome.**

Progress report instructions capture the evaluation result for the audit log. They must run before transitioning — regardless of whether the outcome is iterate or terminate.

Determine outcome:
- **Iterate** → proceed to Step 3
- **Terminate** → proceed to Step 4

## Step 3. Iterate

**STOP. Do not implement anything yet.**

User responses and finding classifications from Step 2 are inputs to plan mode — not authorization to skip it. Implement nothing until plan mode is complete.

Enter plan mode. Plan must include:
- Findings from Step 2 (retrieved from persistent storage if needed, e.g., the progress report written in Step 2)
- Steps to address the findings
- Commit instructions (commit after work is done)

Execute plan.

Before returning to Step 0, update issue state to set `wiggum_step` to 0:

```bash
.claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{ ... "wiggum_step":0,"wiggum_step_label":"Initialize"}'
```

Return to Step 0. (Step 0, not Step 1: each iteration requires a fresh plan for the next execution cycle.)

## Step 4. Terminate

**If termination instructions include implementation work** (code changes, file edits), enter plan mode first. Plan must include:
- Findings to implement (from the evaluation written in Step 2)
- Steps to address each finding
- Commit instructions

Execute plan, then continue with remaining termination instructions (summary, PR comment, state update).

**If termination instructions are reporting-only** (no code changes), execute them directly.

Return control to caller.
