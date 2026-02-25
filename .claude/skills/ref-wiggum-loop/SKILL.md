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

## Step 0. Initialize

Enter plan mode. Write a complete new plan from scratch — do not edit or patch any existing plan file. The plan must include the next step instructions.

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

Return to Step 0. (Step 0, not Step 1: each iteration requires a fresh plan for the next execution cycle.)

## Step 4. Terminate

Execute termination instructions. Return control to caller.
