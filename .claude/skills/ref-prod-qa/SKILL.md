---
name: ref-prod-qa
description: Production QA review loop — Claude browser demo against live production URLs with wiggum-loop
---

# Production QA Review Loop

Step 13. Invoke `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Resolve production URLs for changed apps:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/get-pr-prod-urls.sh <pr-num>
  ```
  If the script exits with code 0 and produces no URLs, skip QA (no hostable apps changed). Write a skip note to `tmp/prod-qa-browser-results-<N>.txt` and proceed directly to termination.
- Read the primary issue body to extract acceptance criteria. Derive a QA plan specifically from these criteria — each checklist item must trace back to a specific acceptance criterion. Do NOT use generic smoke tests.
- Write a comprehensive QA testing plan with structured checklist items:
  ```
  ## 1. <Title> (traces to: <acceptance criterion>)
  - **Production URL**: <full production URL>
  - **Steps**: numbered action descriptions
  - **Expected**: what success looks like
  ```
- The QA testing plan is part of the wiggum-loop plan (written in plan mode at Step 0) — do not write it to a temp file

**Claude-driven browser demo** (after writing QA plan):

Claude walks through the QA plan one item at a time in the user's browser against production URLs. For each item, Claude sets up the UI state, checks the output, tells the user what they should see, and waits for the user to confirm before moving on.

1. Load chrome tools via `ToolSearch("select:mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__gif_creator,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__tabs_context_mcp")`
   - If ToolSearch fails or tools are unavailable → skip entire demo, note "Chrome extension unavailable" in results, fall through to user-driven phase
2. Create a new tab via `tabs_create_mcp`, capture `tabId`
3. Navigate to the first production URL
4. Suppress JS dialogs: use `javascript_tool` to override `window.alert`, `window.confirm`, `window.prompt` with no-ops
5. Clear baselines: `read_console_messages` and `read_network_requests` with `clear: true`
6. Start GIF recording: `gif_creator` with `action: "start_recording"`, take initial screenshot
7. **For each QA plan checklist item, iterate this three-step cycle:**
   a. **Set up UI state**: Navigate to the item's production URL path. Execute the item's steps using `computer` (click/type/scroll), `form_input`, `navigate`. Capture extra GIF frames before and after actions.
   b. **Check UI output**: Take a screenshot. Read `get_page_text` to verify expected outcome. Check `read_console_messages` with `pattern` filter for errors. Check `read_network_requests` for 4xx/5xx.
   c. **Prompt user and wait**: Describe what the user should see on screen — what rendered, what changed, what to look for. Ask the user to confirm what they see matches. **Wait for user response before proceeding to the next item.**
   - If user confirms → mark PASS, continue to next item
   - If user reports a problem → mark FAIL, record the issue description, continue to next item
   - On interaction failure: retry once, then mark SKIP and continue
   - If 3 consecutive SKIPs: stop demo early
   - Stay on the production URL domain — do not follow external links
8. Stop GIF recording: `gif_creator` with `action: "stop_recording"`, export to `tmp/prod-qa-walkthrough-<N>.gif`
9. Write results to `tmp/prod-qa-browser-results-<N>.txt` with per-item status (PASS/FAIL/SKIP), console errors, network failures, and summary counts
10. Present final demo summary: items explored, pass/fail/skip counts, GIF filename, any console/network errors found

**Evaluation instructions:**
- All items PASS or SKIP (no FAIL) → **Terminate**
- Any items FAIL → **Iterate**

**Iterate instructions:**
- **Do NOT fix code.** Production is immutable in this loop.
- For each FAIL item, create a follow-up GitHub issue:
  ```bash
  gh issue create --title "Prod QA: <brief description>" \
    --body "$(cat <<'EOF'
  ## Context

  Found during production QA for #<issue-number> (PR #<pr-num>).

  ## Bug Description

  <detailed description from QA>

  ## Steps to Reproduce

  <steps from QA plan item>

  ## Expected Behavior

  <expected from QA plan item>

  ## Actual Behavior

  <what user reported>

  ## Production URL

  <url>
  EOF
  )" \
    --label "bug"
  ```
- After creating follow-up issues for all FAIL items, re-run browser demo on any remaining untested or SKIP items only
- If no remaining items to test, proceed to evaluation (which will terminate since all FAILs now have follow-up issues)

**Progress report instructions:**
- Invoke `/pr-workflow-progress-report` with `FILE_PREFIX=prod-qa PR_NUM=<pr-num> ITERATION=<N>` (no output file — the QA plan lives in plan mode, not a temp file)

**Termination instructions:**
- Invoke `/pr-workflow-termination-summary` with `PHASE_NAME="Production QA" FILE_PREFIX=prod-qa PR_NUM=<pr-num> NEXT_STEP=14 NEXT_PHASE=done ACTIVE_SKILLS='["ref-memory-management","ref-pr-workflow"]' CONCLUSION_TEXT="Production QA complete. [N follow-up issues created / All checks passed]." EXTRA_HEADER_FIELDS="**Reviewer**: [User name from git config]\n**Tested By**: Claude browser demo + Human QA\n**Environment**: Production" EXTRA_SECTIONS="## Production QA Summary\n\n- Total test cycles: [N]\n- Acceptance criteria verified: [list]\n- Production URLs tested: [list]\n- Follow-up issues created: [list with issue numbers, or 'None']\n\n## Browser Exploration Summary\n\n- Items explored: [N]\n- Pass: [N] / Fail: [N] / Skip: [N]\n- GIF recordings: [filenames]"`
