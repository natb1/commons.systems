---
name: dispatch-qa
description: Post-implementation user-acceptance QA — single pass, no wiggum-loop, no plan mode
---

# Dispatch: User-Acceptance QA

Runs a single user-acceptance QA pass on an implemented PR. Invoked three ways:

- By the `/dispatch` skill — the session is already inside the target worktree.
- Standalone with no argument — `/dispatch-qa` self-selects the highest-priority
  QA-phase PR.
- Standalone with an explicit `#<issue>` argument.

**Step 0** resolves the target issue and its worktree for all three paths. The
remaining steps use the Step-0-resolved issue number `<N>`.

This skill is a **single user-acceptance pass**. It does not iterate, does not enter plan mode, does not modify code, and does not commit. The recovery path for any bug found is "re-dispatch the original issue" — this skill records and continues.

## What this skill is NOT

- **No `wiggum-loop`.** Do not invoke `/wiggum-loop`. The QA plan lives in the active conversation, not in plan-mode state.
- **No plan mode.** Do not call `EnterPlanMode`. A plan-mode entry would clear context and break the active demo.
- **No iteration.** When the user reports a bug, record it and move to the next item. Do not attempt fixes.
- **No code changes, commits, or pushes.**

## QA data policy

The QA pass covers **public data only** — documents present in both the QA server and production.

- **Identify public seed items** from `<app>/seeds/firestore.ts`: documents in collection blocks **without** `testOnly: true`. The QA server seeds exactly these. Build the walkthrough around them.
- **Never** run the QA server or any seed step with `SEED_TEST_ONLY=true`, and never re-seed `testOnly` collections by other means — that breaks QA/prod parity, letting QA pass against data absent from production. `testOnly` data exists for the Playwright acceptance tests, which CI's `acceptance` job already runs.
- **Auth-gated and private-data flows are out of scope** for the automated walkthrough. If one must be verified, the user does so in a preview deployment — avoid this where possible.
- When a change's behavior is only reachable via `testOnly` or private data, note in the QA plan that the walkthrough is limited to public data and defer that coverage to the automated acceptance tests.

## Steps

0. **Target resolution.**

   Establish the target issue number `<N>` and ensure the session is in the
   target's worktree. Precedence:

   1. **An issue/PR number argument is given** (leading `#` optional) → that issue
      is the target.
   2. **Else the current branch matches `<issue>-*`** (the session is already inside
      a target worktree) → use that issue number.
   3. **Else** (standalone: no argument, not in a target worktree) → run:
      ```bash
      .claude/skills/dispatch/scripts/dispatch-select-target --qa
      ```
      It prints `pr <num> <branch>` (the highest-priority QA-phase PR) or `empty`.
      On `empty`, report that there is no QA-phase work and **stop**. Otherwise the
      printed PR's issue number is the target.

   Then, **when the session is not already in the target's worktree**, resolve or
   create it via `EnterWorktree`, matching `/dispatch` Step 3. `EnterWorktree`
   accepts exactly one of `path` (switch to an existing worktree) or `name`
   (create a new one):

   - **Already in the target's worktree** (current branch starts with `<issue>-`) →
     proceed to Step 1.
   - **An existing worktree matches** `<issue>-*` (parse `git worktree list
     --porcelain` as blank-line-delimited records) → `EnterWorktree` with `path:`
     set to that path.
   - **No existing worktree** → generate a sanitized branch name `<issue>-<slug>`:
     lowercase the issue title, replace non-alphanumeric runs with `-`, collapse
     repeated `-`, strip leading/trailing `-`, and truncate so the full branch name
     is ≤ 32 characters. `EnterWorktree` with `name:` set to that branch name.
     Creating via `name:` fires the `WorktreeCreate` hook, which runs
     `sync-issue-context` and populates `CLAUDE.local.md` with full issue context.

   Step 0 establishes the issue number `<N>` that the remaining steps use for their
   `tmp/` filenames.

1. **Detect whether the implementation has a browser component.**

   Run:
   ```bash
   git diff --name-only origin/main...HEAD
   ```

   The implementation has a browser component if any changed path matches one of:
   - A `vite.config.*` file.
   - A frontend template (e.g. `index.html`, files under `src/` of a frontend app).
   - A path under one of the known frontend packages: `budget`, `fellspiral`, `landing`, `print`.

   Pure-backend PRs (e.g. `functions/`-only, scripts-only) take the **non-browser path**. Detection is best-effort — if the user explicitly says otherwise, follow the user.

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

   Build the plan around public seed data (see [QA data policy](#qa-data-policy)). When target behavior is only reachable via `testOnly` or private data, do not create a walkthrough item for it — note the limitation in the plan instead.

3. **Browser feature path.** Skip to Step 4 if the non-browser path applies.

   a. **Start the QA server in the background.** Use a Bash tool call with `run_in_background: true`:
      ```bash
      .claude/skills/ref-pr-workflow/scripts/run-qa-server.sh <app-dir>
      ```
      Capture the App URL printed to stdout. The QA server seeds public data only — do not re-run it or any seed step with `SEED_TEST_ONLY=true` (see [QA data policy](#qa-data-policy)).

   b. **Wait for the server:**
      ```bash
      .claude/skills/ref-pr-workflow/scripts/wait-for-url.sh <url>
      ```

   c. **Pre-QA acceptance check:**
      ```bash
      .claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh <app-dir> <url>
      ```

      - **If the check fails** → Report the failure to the user. Run `.claude/skills/ref-pr-workflow/scripts/run-qa-cleanup.sh`. Post a brief PR comment summarizing the failure (Step 6). Stop. The user's recovery is to re-dispatch the original issue.
      - **If the check passes** → Continue to the walkthrough.

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
      8. Stop GIF recording: `gif_creator` with `action: "stop_recording"`. Export to `tmp/dispatch-qa-walkthrough-<n>.gif` (where `<n>` is the Step-0-resolved issue number `<N>`).
      9. Write per-item results (PASS/FAIL/SKIP, console errors, network failures, summary counts) to `tmp/dispatch-qa-results-<n>.txt`.

4. **Non-browser path.**

   Print the QA plan in the conversation and walk through it one item at a time:
   - Ask the user to perform the steps for the current item.
   - Wait for the user's response.
   - Record **PASS**, **FAIL** (with the issue text), or **SKIP** per item.
   - Continue to the next item.

   Write per-item results to `tmp/dispatch-qa-results-<n>.txt`.

5. **Recovery path when bugs are reported.**

   The constraints in "What this skill is NOT" still apply: record the bug in the results file and continue to the next item. The recovery path is for the user to re-dispatch the original issue. Surface this to the user when reporting bugs.

6. **Post the PR comment summary.**

   Resolve the PR number (use `dangerouslyDisableSandbox: true` — `gh` needs network):
   ```bash
   gh pr view "$BRANCH" --json number -q .number
   ```
   where `$BRANCH` is the current branch (`git rev-parse --abbrev-ref HEAD`).

   Write a markdown summary to `tmp/dispatch-qa-summary-<n>.md` (where `<n>` is the Step-0-resolved issue number `<N>`). Include:
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

8. **Stop.** `/loop /dispatch` advances to the next phase.
