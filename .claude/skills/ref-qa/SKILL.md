---
name: ref-qa
description: QA review loop — user-driven testing with wiggum-loop
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# QA Review Loop

Step 8. Invoke `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- If implementation has a browser component (detect via `vite.config.*`, HTML templates, or frontend framework files):
  1. Check if a QA server from a previous iteration is still running (look for the background task or a listening Vite port). If running, reuse its App URL. If not, start the QA server in background:
     ```bash
     .claude/skills/ref-pr-workflow/scripts/run-qa-server.sh <app-dir>
     ```
  2. Wait for the server to be ready:
     ```bash
     .claude/skills/ref-pr-workflow/scripts/wait-for-url.sh http://localhost:<port>
     ```
  3. Parse the App URL from the script's output (current or previous run)
  4. Run acceptance tests as a smoke check:
     ```bash
     .claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh <app-dir> <url>
     ```
  4. If smoke tests fail → fix issues and re-run before involving the user
  5. Once smoke tests pass, proceed to write the QA testing plan
- Write a comprehensive QA testing plan including:
  - Key behaviors to verify
  - Test steps for each behavior
  - Edge cases to test
  - Expected outcomes
- Write the QA testing plan to `tmp/qa-plan-<N>.txt`
- Present the plan and App URL (if applicable) to the user
- **CRITICAL**: The user performs the actual testing (not Claude)
- Wait for the user to test and report results

**Evaluation instructions:**
- User reports "passed"/"approved" → **Terminate**
- User reports issues/bugs → **Iterate**

**Iterate instructions:**
- Fix all issues reported by the user
- Re-run acceptance tests after fixes to verify no regressions
- Keep the QA server running for the user to retest

**Progress report instructions:**
- Invoke `/pr-workflow-progress-report` with `FILE_PREFIX=qa PR_NUM=<pr-num> ITERATION=<N>`, using `qa-plan-<N>.txt` as the output file

**Termination instructions:**
- Stop the QA server (`run-qa-server.sh`) if started: kill the background Task
- Invoke `/pr-workflow-termination-summary` with `PHASE_NAME="QA" FILE_PREFIX=qa PR_NUM=<pr-num> NEXT_STEP=9 NEXT_PHASE=code-quality ACTIVE_SKILLS='["ref-memory-management","ref-pr-workflow","ref-code-quality"]' CONCLUSION_TEXT="All test cases passed. PR approved for code quality review." EXTRA_HEADER_FIELDS="**Reviewer**: [User name from git config]\n**Tested By**: Human QA with Claude Code facilitation" EXTRA_SECTIONS="## QA Summary\n\n- Total test cycles: [N]\n- Key behaviors verified: [list]\n- Edge cases tested: [list]\n- Total issues found and resolved: [N]"`
- Proceed to Step 9
