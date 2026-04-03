---
name: ref-qa
description: QA review loop — Claude browser demo + user-driven testing with wiggum-loop
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
  5. If smoke tests fail → fix issues and re-run before involving the user
  6. Once smoke tests pass, proceed to write the QA testing plan
- Write a comprehensive QA testing plan with structured checklist items:
  ```
  ## 1. <Title>
  - **URL path**: <relative path or "current">
  - **Steps**: numbered action descriptions
  - **Expected**: what success looks like
  ```
  Include key behaviors to verify, edge cases, and expected outcomes.
- Write the QA testing plan to `tmp/qa-plan-<N>.txt`

**Claude-driven browser demo** (after writing QA plan):

Claude walks through the QA plan one item at a time in the user's browser. For each item, Claude sets up the UI state, checks the output, tells the user what they should see, and waits for the user to confirm before moving on.

1. Load chrome tools via `ToolSearch("select:mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__gif_creator,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__tabs_context_mcp")`
   - If ToolSearch fails or tools are unavailable → skip entire demo, note "Chrome extension unavailable" in results, fall through to user-driven phase
2. Create a new tab via `tabs_create_mcp`, capture `tabId`
3. Navigate to the App URL
4. Suppress JS dialogs: use `javascript_tool` to override `window.alert`, `window.confirm`, `window.prompt` with no-ops
5. Clear baselines: `read_console_messages` and `read_network_requests` with `clear: true`
6. Start GIF recording: `gif_creator` with `action: "start_recording"`, take initial screenshot
7. **For each QA plan checklist item, iterate this three-step cycle:**
   a. **Set up UI state**: Navigate to the item's URL path (if not "current"). Execute the item's steps using `computer` (click/type/scroll), `form_input`, `navigate`. Capture extra GIF frames before and after actions.
   b. **Check UI output**: Take a screenshot. Read `get_page_text` to verify expected outcome. Check `read_console_messages` with `pattern` filter for errors. Check `read_network_requests` for 4xx/5xx.
   c. **Prompt user and wait**: Describe what the user should see on screen — what rendered, what changed, what to look for. Ask the user to confirm what they see matches. **Wait for user response before proceeding to the next item.**
   - If user confirms → mark PASS, continue to next item
   - If user reports a problem → mark FAIL, record the issue, continue to next item
   - On interaction failure: retry once, then mark SKIP and continue
   - If 3 consecutive SKIPs: stop demo early
   - Stay on the QA App URL domain — do not follow external links
8. Stop GIF recording: `gif_creator` with `action: "stop_recording"`, export to `tmp/qa-walkthrough-<N>.gif`
9. Write results to `tmp/qa-browser-results-<N>.txt` with per-item status (PASS/FAIL/SKIP), console errors, network failures, and summary counts
10. Present final demo summary: items explored, pass/fail/skip counts, GIF filename, any console/network errors found

**Evaluation instructions:**
- User reports "passed"/"approved" → **Terminate**
- User reports issues/bugs → **Iterate**

**Iterate instructions:**
- Fix all issues reported by the user
- Re-run acceptance tests after fixes to verify no regressions
- Re-run browser demo on affected checklist items to verify fixes before presenting to user for retest
- Keep the QA server running for the user to retest

**Progress report instructions:**
- Invoke `/pr-workflow-progress-report` with `FILE_PREFIX=qa PR_NUM=<pr-num> ITERATION=<N>`, using `qa-plan-<N>.txt` as the output file

**Termination instructions:**
- Stop the QA server (`run-qa-server.sh`) if started: kill the background Task
- Invoke `/pr-workflow-termination-summary` with `PHASE_NAME="QA" FILE_PREFIX=qa PR_NUM=<pr-num> NEXT_STEP=9 NEXT_PHASE=code-quality ACTIVE_SKILLS='["ref-memory-management","ref-pr-workflow","ref-code-quality"]' CONCLUSION_TEXT="All test cases passed. PR approved for code quality review." EXTRA_HEADER_FIELDS="**Reviewer**: [User name from git config]\n**Tested By**: Claude browser demo + Human QA" EXTRA_SECTIONS="## QA Summary\n\n- Total test cycles: [N]\n- Key behaviors verified: [list]\n- Edge cases tested: [list]\n- Total issues found and resolved: [N]\n\n## Browser Exploration Summary\n\n- Items explored: [N]\n- Pass: [N] / Fail: [N] / Skip: [N]\n- GIF recordings: [filenames]"`
- Immediately proceed to Step 9 (do not stop or summarize between phases)
