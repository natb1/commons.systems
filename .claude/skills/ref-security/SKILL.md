---
name: ref-security
description: Security review loop — automated scan with user classification
---

# Security Review Loop

Step 10. Invoke `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run `/security-review` in a background Task (`run_in_background: true`, exists even if not visible in skill list). Note the `output_file` path from the Task result.

**Evaluation instructions:**
- Present findings to user
- User classifies each as: required, false positive, or out of scope
- Any required findings → **Iterate**
- No required findings → **Terminate**

**Progress report instructions:**
- Invoke `/pr-workflow-progress-report` with `FILE_PREFIX=security PR_NUM=<pr-num> ITERATION=<N>`

**Termination instructions:**
- Invoke `/pr-workflow-termination-summary` with `PHASE_NAME="Security" FILE_PREFIX=security PR_NUM=<pr-num> NEXT_STEP=11 NEXT_PHASE=verify ACTIVE_SKILLS='["ref-memory-management","ref-pr-workflow"]' CONCLUSION_TEXT="[Final assessment and next steps]" EXTRA_HEADER_FIELDS="**Reviewer**: Claude Code (via /security-review skill)\n**Outcome**: [Summary of result]" EXTRA_SECTIONS="## User Classification Decisions\n\n[For each finding:]\n- Finding 1: [title] -> [required/false positive/out of scope] - [rationale]\n..."`
- Immediately proceed to Step 11 (final verify) (do not stop or summarize between phases)
