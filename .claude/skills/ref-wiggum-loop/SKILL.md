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

Determine outcome:
- **Iterate** → proceed to Step 3
- **Terminate** → proceed to Step 4

If progress report instructions are provided, execute them now (regardless of outcome).

## Step 3. Iterate

Enter plan mode. The plan must include:
- Output from Step 1, as modified by evaluation in Step 2
- Commit instructions (commit after work is done)
- The next step instructions

Return to Step 1.

## Step 4. Terminate

Execute termination instructions. Return control to caller.
