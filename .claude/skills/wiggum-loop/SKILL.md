---
name: wiggum-loop
description: Generic iterative loop pattern with evaluation and convergence
---

# Wiggum Loop

Generic iterative loop pattern. The calling agent provides three instruction sets:

- **Next step instructions**: Instructions to generate next steps (e.g., invoke a review skill)
- **Evaluation instructions**: How to determine iterate vs terminate (e.g., required user approved recommendations after review)
- **Termination instructions**: What to execute when the loop ends (e.g., post a PR comment)

## Loop Algorithm

Invoke `/tracking` skill to load commit and context sync guidelines.

### Step 0 — Initialize

Enter plan mode. The plan must include:
- The generate next step instructions

### Step 1 — Execute Next Step

Execute the generate next step instructions from the plan.

### Step 2 — Evaluate

Execute the evaluation instructions against the output from step 1. This may involve user interaction (e.g., presenting findings for the user to classify).

Determine outcome:
- **Iterate** — evaluation says to continue
- **Terminate** — evaluation says to stop

### Step 3 — Iterate

Enter plan mode. The plan must include:
- Output from step 1, as modified by evaluation in step 2
- The generate next step instructions
- Commit instructions (to commit after work is done)

Return to step 1.

### Step 4 — Terminate

Execute the termination instructions. Return control.
