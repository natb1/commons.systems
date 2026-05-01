---
name: dispatch-qa
description: Post-implementation user-acceptance QA — single pass, no wiggum-loop, no plan mode
---

# Dispatch: User-Acceptance QA

Invoked by `./dispatch/bin/dispatch <issue-num>` after the implementation phase reports `phase_signal=complete`. The dispatcher launched Claude with `claude -w <branch> "/dispatch-qa #<issue-num>"`, so the WorktreeCreate hook has already placed the session in the correct worktree, written `CLAUDE.local.md`, and exported `DISPATCH_ISSUE_NUM` and `DISPATCH_STATE_FILE`.

This skill is a **single user-acceptance pass**. It does not iterate, does not enter plan mode, does not modify code, and does not commit. The recovery path for any bug found is "re-dispatch the original issue" — this skill records and continues.

## What this skill is NOT

- **No `wiggum-loop`.** Do not invoke `/wiggum-loop`. The QA plan lives in the active conversation, not in plan-mode state.
- **No plan mode.** Do not call `EnterPlanMode`. A plan-mode entry would clear context and break the active demo.
- **No iteration.** When the user reports a bug, record it and move to the next item. Do not attempt fixes.
- **No code changes, commits, or pushes.**

## Steps

1. **Detect whether the implementation has a browser component.**

   Run:
   ```bash
   git diff --name-only origin/main...HEAD
   ```

   The implementation has a browser component if any changed path matches one of:
   - A `vite.config.*` file.
   - A frontend template (e.g. `index.html`, files under `src/` of a frontend app).
   - A path under one of the known frontend packages: `budget`, `fellspiral`, `landing`, `print`.

   Pure-backend PRs (e.g. `dispatch/`-only, `functions/`-only, scripts-only) take the **non-browser path**. Detection is best-effort — if the user explicitly says otherwise, follow the user.

   If a browser component is detected, identify the **app dir** (`budget`, `fellspiral`, `landing`, or `print`) from the changed paths. If multiple app dirs are touched, ask the user which one to demo.

2. **Write the user-acceptance QA plan as a single regular conversation message.**

   Not plan mode. Not a temp file. A regular assistant message in the current conversation.

   For each item:
   ```
   ## <N>. <Title>
   - **URL path**: <relative path or "current">
   - **Steps**: <numbered actions>
   - **Expected outcome**: <what success looks like to the user>
   ```

   The plan must focus on **end-user-visible** outcomes — what the user sees, clicks, expects, or experiences. Cover the golden path and user-visible edge cases.

   The plan must NOT duplicate things already verified by unit tests, lint, or type-check. Do not include items like "type-check passes", "no lint errors", "renders without crashing", "no console errors on load". Those are CI's job.

3. **Browser feature path.** Skip to Step 4 if the non-browser path applies.

   a. **Start the QA server in the background.** Use a Bash tool call with `run_in_background: true`:
      ```bash
      .claude/skills/ref-pr-workflow/scripts/run-qa-server.sh <app-dir>
      ```
      Capture the App URL printed to stdout.

   b. **Wait for the server:**
      ```bash
      .claude/skills/ref-pr-workflow/scripts/wait-for-url.sh <url>
      ```

   c. **Smoke-check via acceptance tests:**
      ```bash
      .claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh <app-dir> <url>
      ```

      - **On smoke fail** → Report the failure to the user. Run `.claude/skills/ref-pr-workflow/scripts/run-qa-cleanup.sh`. Post a brief PR comment summarizing the smoke failure (Step 6). Stop. The user's recovery is to re-dispatch the original issue.
      - **On smoke pass** → Continue to the walkthrough.

   d. **Walk the user through the QA plan via the Chrome extension.** Reuse the per-item three-step cycle from `.claude/skills/ref-qa/SKILL.md`:

      1. Load chrome tools via:
         ```
         ToolSearch("select:mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__gif_creator,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__tabs_context_mcp")
         ```
         If ToolSearch fails or tools are unavailable → skip the browser walkthrough, note "Chrome extension unavailable" in results, and fall through to the non-browser walkthrough (Step 4) for the same plan.
      2. Create a new tab via `tabs_create_mcp`, capture `tabId`.
      3. Navigate to the App URL.
      4. Suppress JS dialogs via `javascript_tool`: override `window.alert`, `window.confirm`, `window.prompt` with no-ops.
      5. Clear baselines: `read_console_messages` and `read_network_requests` with `clear: true`.
      6. Start GIF recording: `gif_creator` with `action: "start_recording"`. Take an initial screenshot.
      7. **For each plan item:**
         a. **Set up state.** Navigate to the item's URL path (if not "current"). Execute the steps using `computer`, `form_input`, `navigate`. Capture extra GIF frames before and after.
         b. **Check output.** Take a screenshot. Read `get_page_text` to verify the expected outcome. Check `read_console_messages` (filter for errors). Check `read_network_requests` for 4xx/5xx.
         c. **Prompt the user and wait.** Describe what should be on screen and ask the user to confirm. Wait for the user response before moving on.
            - User confirms → record **PASS**, continue.
            - User reports a problem → record **FAIL** with the issue text, continue.
            - On interaction failure: retry once, then record **SKIP** and continue.
            - 3 consecutive SKIPs → stop the walkthrough early.
            - Stay on the App URL domain — do not follow external links.
      8. Stop GIF recording: `gif_creator` with `action: "stop_recording"`. Export to `tmp/dispatch-qa-walkthrough-<n>.gif` (where `<n>` is `$DISPATCH_ISSUE_NUM`).
      9. Write per-item results (PASS/FAIL/SKIP, console errors, network failures, summary counts) to `tmp/dispatch-qa-results-<n>.txt`.

4. **Non-browser path.**

   Print the QA plan in the conversation and walk through it one item at a time:
   - Ask the user to perform the steps for the current item.
   - Wait for the user's response.
   - Record **PASS**, **FAIL** (with the issue text), or **SKIP** per item.
   - Continue to the next item.

   Write per-item results to `tmp/dispatch-qa-results-<n>.txt`.

5. **Single pass — no iteration.**

   When the user reports a bug, record it in the results file and continue to the next item. Do NOT attempt a fix. Do NOT loop. Do NOT invoke `/wiggum-loop`. Do NOT enter plan mode.

   If issues are found, the recovery path is for the user to re-dispatch the original issue (with #569's resume-mode work, the dispatcher will pick up at the right step). Surface this to the user when reporting bugs.

6. **Post the PR comment summary.**

   Resolve the PR number (use `dangerouslyDisableSandbox: true` — `gh` needs network):
   ```bash
   gh pr view "$BRANCH" --json number -q .number
   ```
   where `$BRANCH` is the current branch (`git rev-parse --abbrev-ref HEAD`).

   Write a markdown summary to `tmp/dispatch-qa-summary-<n>.md` (where `<n>` is `$DISPATCH_ISSUE_NUM`). Include:
   - Items walked.
   - PASS / FAIL / SKIP counts.
   - List of bugs reported (if any), each with the item title and the user's report.
   - For browser walkthroughs: the GIF filename (`tmp/dispatch-qa-walkthrough-<n>.gif`).

   Post via (use `dangerouslyDisableSandbox: true` — script invokes `gh`):
   ```bash
   .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/dispatch-qa-summary-<n>.md
   ```

7. **Cleanup.**

   On the browser path (server was started), always run on exit:
   ```bash
   .claude/skills/ref-pr-workflow/scripts/run-qa-cleanup.sh
   ```

   Use this script — never broad `pkill`. The user's standing rule (project memory): `run-qa-cleanup.sh` avoids permission errors and worktree conflicts.

   On the non-browser path, no QA server was started — skip cleanup.

8. **Stop.** The dispatcher resumes after this session exits and prompts for the next post-implementation stage.
