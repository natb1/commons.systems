---
name: wiggum-loop
description: Generic iterative loop pattern with evaluation and convergence
---

# Wiggum Loop

1. Invoke `/ref-memory-management` and `/ref-wiggum-loop`.

2. Update the issue state's `active_skills` to include `ref-wiggum-loop` (if not already present) via `.claude/skills/ref-pr-workflow/scripts/issue-state-write`:
   ```bash
   .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":8,"step_label":"QA Review Loop","phase":"qa","active_skills":["ref-memory-management","ref-pr-workflow","ref-qa","ref-wiggum-loop"]}'
   ```

3. If the current plan has an active step recorded, resume at that step. Otherwise, begin at the step specified by the caller (default: Step 0).
