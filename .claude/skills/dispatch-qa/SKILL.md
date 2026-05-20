---
name: dispatch-qa
description: Post-implementation user-acceptance QA — single self-verifying pass; on the first bug, enters plan mode and fixes it in-session
---

# Dispatch: User-Acceptance QA

Runs a single user-acceptance QA pass on an implemented PR. Invoked three ways:

- By the `/dispatch` skill — the session is already inside the target worktree.
- Standalone with no argument — `/dispatch-qa` self-selects the highest-priority
  QA-phase PR.
- Standalone with an explicit `#<issue>` argument.

**Step 0** resolves the target issue and its worktree for all three paths. The
remaining steps use the Step-0-resolved issue number `<N>`.

This skill is a **single QA pass** — the QA walkthrough runs once, with no
iteration. (Step 5's bug-fix build loop iterates over plan units; that is a
build loop, not a re-run of the walkthrough.)
It self-verifies every QA item it can check on its own (page text, DOM state,
console, network, shell commands, file inspection) and prompts the user only for
items needing human judgment. On the **first** bug found — whether Claude detects
it or the user reports it — the walkthrough stops; the skill finalizes the QA
session, enters plan mode, and fixes the bug in-session via `/plan-implement`'s
planning and `/implement-unit`'s build procedure.

**Idempotency guard — check this first.** If an approved bug-fix plan for this
dispatch is already present in context (typical after
`showClearContextOnPlanAccept` fires — the user accepted the bug-fix plan and the
context was cleared, causing `restore-dispatch-skill.sh` to re-enter `/dispatch`
→ `/dispatch-qa`), **skip the QA walkthrough** — Step 0.5 and Steps 1–4 — and
resume directly at the build loop (Step 5, sub-step 3: build each unit via
`/implement-unit`). Step 0 (target resolution) still runs: it re-establishes the
issue number `<N>` and confirms the worktree from the current branch. The plan
persists across context clears, so the unit list remains visible even though the
planning conversation is gone.

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
      is the target. This overrides the `dispatch-select-target --qa`
      prioritization below.
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
     proceed to Step 0.5.
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

0.5. **Merge `origin/main` into the working branch.**

   Before the QA walkthrough begins, invoke `/commit-merge-push` via the Skill tool
   so the QA pass runs against a branch current with `main` rather than stale state.

   - With no pending working-tree changes, `/commit-merge-push` creates no commit —
     it only fetches, merges `origin/main`, and pushes.
   - If `/commit-merge-push` reports a **merge conflict**, surface it to the user
     and **stop** — do not begin the QA walkthrough.

   This step runs on all three invocation paths. Skip it only when the idempotency
   guard fires (a bug-fix plan is already in context).

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
   - **Verification**: machine-verifiable | needs human judgment
   ```

   Classify each item's expected outcome:
   - **Machine-verifiable** — success is determined by page text, DOM state,
     network responses, console output, or a shell command / file check. Claude
     verifies these itself.
   - **Needs human judgment** — success depends on visual layout, subjective UX,
     or a "does this look right" call. Only these prompt the user.

   The plan must focus on **end-user-visible** outcomes — what the user sees, clicks, expects, or experiences. Cover the golden path and user-visible edge cases.

   The plan must NOT duplicate things already verified by unit tests, lint, or type-check. Do not include items like "type-check passes", "no lint errors", "renders without crashing", "no console errors on load". Those are CI's job.

   Build the plan around public seed data (see [QA data policy](#qa-data-policy)). When target behavior is only reachable via `testOnly` or private data, do not create a walkthrough item for it — note the limitation in the plan instead.

3. **Browser feature path.** Skip to Step 4 if the non-browser path applies.

   a. **Start the QA server in the background.** Use a Bash tool call with `run_in_background: true`:
      ```bash
      .claude/skills/dispatch/scripts/run-qa-server.sh <app-dir>
      ```
      Capture the App URL printed to stdout. The QA server seeds public data only — do not re-run it or any seed step with `SEED_TEST_ONLY=true` (see [QA data policy](#qa-data-policy)).

   b. **Wait for the server:**
      ```bash
      .claude/skills/dispatch/scripts/wait-for-url.sh <url>
      ```

   c. **Pre-QA acceptance check:**
      ```bash
      .claude/skills/dispatch/scripts/run-acceptance-tests.sh <app-dir> <url>
      ```

      - **If the check fails** → A failed pre-QA acceptance check is a bug. Go to
        Step 5 and treat the check failure as the first bug found.
      - **If the check passes** → Continue to the walkthrough.

   d. **Walk through the QA plan via the Chrome extension.** Use the per-item
      three-step cycle below. Machine-verifiable items are recorded from
      Claude's own checks with no user prompt.

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
         c. **Record the result:**
            - **Machine-verifiable item** → record **PASS** or **FAIL** directly
              from Claude's own checks (the screenshot, `get_page_text`,
              `read_console_messages`, `read_network_requests`). **No user
              prompt** — continue to the next item.
            - **Needs-human-judgment item** → describe what should be on screen and
              ask the user to confirm. **Wait** for the user response before moving
              on. User confirms → record **PASS**; user reports a problem → record
              **FAIL** with the issue text.
            - On interaction failure: retry once, then record **SKIP** and continue.
            - 3 consecutive SKIPs → stop the walkthrough early.
            - Stay on the App URL domain — do not follow external links.
            - **On the first FAIL** (Claude-detected or user-reported) → stop the
              walkthrough and go to Step 5.
      8. Stop GIF recording: `gif_creator` with `action: "stop_recording"`. Export to `tmp/dispatch-qa-walkthrough-<n>.gif` (where `<n>` is the Step-0-resolved issue number `<N>`).
      9. Write per-item results (PASS/FAIL/SKIP, console errors, network failures, summary counts) to `tmp/dispatch-qa-results-<n>.txt`.

4. **Non-browser path.**

   Print the QA plan in the conversation and walk through it one item at a time:
   - **Item verifiable by a command or file inspection** → Claude runs the command
     or inspects the file itself and records **PASS** or **FAIL** from the result.
     No user prompt.
   - **Item needing manual action Claude cannot script** → ask the user to perform
     the steps, wait for the user's response, and record **PASS**, **FAIL** (with
     the issue text), or **SKIP**.
   - **On the first FAIL** (Claude-detected or user-reported) → stop the walkthrough
     and go to Step 5.
   - Otherwise continue to the next item.

   Write per-item results to `tmp/dispatch-qa-results-<n>.txt`.

5. **First bug found — finalize the QA session, then fix the bug.**

   When the **first** bug is found — a FAIL Claude detected on its own, a
   user-reported FAIL, or a failed pre-QA acceptance check — stop the walkthrough
   and fix it.
   Proceed in order:

   1. **Finalize the QA session before plan mode.** Entering plan mode clears
      context and ends the browser session, so finish the session first:
      - **Browser path** — if GIF recording was started (Step 3d.7), stop and
        export it (`gif_creator` with `action: "stop_recording"` →
        `tmp/dispatch-qa-walkthrough-<n>.gif`). A pre-QA acceptance check failure
        (Step 3c) occurs before recording starts — skip this bullet in that case.
      - Write QA results so far — **including the bug** — to
        `tmp/dispatch-qa-results-<n>.txt`.
      - **Browser path** — run `run-qa-cleanup.sh` (see Step 7).
      - Post the PR-comment summary (Step 6), covering the items walked plus the
        bug.
   2. **Plan the fix.** Follow `/plan-implement` Step 1: invoke `EnterPlanMode` and
      produce an ordered list of logical units of work — each with **Scope**,
      **Model** (per `/implement-unit`'s model-selection heuristic), and
      **Dependencies**. Include the `ref-memory-management` Clean Context Planning
      preface (the plan assumes a clean context and records that the active
      workflow step is the `qa` phase of `/dispatch`). The idempotency guard at the top of
      this skill resumes here after the plan is accepted and context is cleared.
   3. **Build the fix.** Follow `/plan-implement` Step 2: for each approved unit, in
      dependency order, invoke `/implement-unit` via the Skill tool, passing
      `model`, `scope`, `context`, and `commit_intent`. This is a normal in-session
      loop — do not clear context between units. **Skip `/plan-implement` Step 3** —
      the draft PR already exists; no new PR is created.
   4. **Stop without labeling.** Do **not** apply `dispatch:qa-done`. The fix
      commits change the PR; the user re-runs `/dispatch`, which re-derives the
      phase from CI/labels (→ `waiting`/`verify` while CI runs, → `qa` once green)
      and re-QAs the fixed build. The skill ends here — Steps 6 and 7 already ran
      inline in sub-step 1, and Step 8 does not run on the bug-fix path.

6. **Post the PR comment summary.**

   Resolve the PR number (use `dangerouslyDisableSandbox: true` — `gh` needs network):
   ```bash
   gh pr view "$BRANCH" --json number -q .number
   ```
   where `$BRANCH` is the current branch (`git rev-parse --abbrev-ref HEAD`).

   Write a markdown summary to `tmp/dispatch-qa-summary-<n>.md` (where `<n>` is the Step-0-resolved issue number `<N>`). Include:
   - Items walked.
   - PASS / FAIL / SKIP counts.
   - List of bugs found (if any), each with the item title and the report (the
     user's words, or Claude's own finding for a self-detected FAIL).
   - For browser walkthroughs: the GIF filename (`tmp/dispatch-qa-walkthrough-<n>.gif`).

   Post via (use `dangerouslyDisableSandbox: true` — script invokes `gh`):
   ```bash
   .claude/skills/dispatch/scripts/post-pr-comment.sh <pr-num> tmp/dispatch-qa-summary-<n>.md
   ```

7. **Cleanup.**

   On the browser path (server was started), always run on exit:
   ```bash
   .claude/skills/dispatch/scripts/run-qa-cleanup.sh
   ```

   Use this script — never broad `pkill`. The user's standing rule (project memory): `run-qa-cleanup.sh` avoids permission errors and worktree conflicts.

   On the non-browser path, no QA server was started — skip cleanup.

8. **Clean pass — apply the `dispatch:qa-done` label, then stop.**

   This step runs **only on a clean pass** — the walkthrough completed with no bug
   found. On the bug-fix path (Step 5), the skill has already stopped and this step
   does **not** run.

   First, **surface any unresolved SKIP items** to the user — list each SKIP item
   so the user can decide whether to accept it before the PR advances.

   Then apply the `dispatch:qa-done` label to the PR via `dispatch-complete-phase`
   (run with `dangerouslyDisableSandbox: true` — it invokes `gh`):

   ```bash
   .claude/skills/dispatch/scripts/dispatch-complete-phase <pr-num> qa
   ```

   The script applies the label, creating it first only if it does not yet exist
   (e.g. on a fork where it has not been created).

   Then **stop**. `/loop /dispatch` advances to the next phase.
