---
name: qa-fix
description: QA phase — merge origin/main, run the autonomous portion of user-acceptance QA (plan items, machine-verifiable checks, PR-comment summary), apply the dispatch:qa-done label on a clean pass, and escalate to office-hours on any user-input blocker
---

# QA and Fix

The `qa` phase of the issue workflow, dispatched by `/dispatch-propagate`. This is
the **autonomous** half of user-acceptance QA — sibling to `/code-review-fix`,
`/review-fix`, and `/security-review-fix`.

QA was historically a single user-triggered skill (`/dispatch-qa`) that bundled
two responsibilities: the autonomous part (select target, plan items, run
machine-verifiable checks, post the PR-comment summary, apply `dispatch:qa-done`)
and the user-input part (walk the user through judgment-call items; on the first
bug, enter plan mode and fix it in-session). This skill runs **only the
autonomous part**. The moment QA needs a human — a judgment-call walkthrough
item, an unexpected permission prompt, or a bug that needs an in-session
plan-mode fix — it escalates to the office-hours queue via the standard path
(skip the `phase-completed` marker, write `office-hours-reason`; the Stop hook
applies `dispatch:office-hours` to the issue and parks the session). The
user-input residue runs later via `/office-hours`.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push` and run browser/shell checks inline.

## QA data policy

The QA pass covers **public data only** — documents present in both the QA server and production.

- **Identify public seed items** from `<app>/seeds/firestore.ts`: documents in collection blocks **without** `testOnly: true`. The QA server seeds exactly these. Build the walkthrough around them.
- **Never** run the QA server or any seed step with `SEED_TEST_ONLY=true`, and never re-seed `testOnly` collections by other means — that breaks QA/prod parity, letting QA pass against data absent from production. `testOnly` data exists for the Playwright acceptance tests, which CI's `acceptance` job already runs.
- **Auth-gated and private-data flows are out of scope** for the automated walkthrough. When a change's behavior is only reachable via `testOnly` or private data, note in the QA plan that the walkthrough is limited to public data and defer that coverage to the automated acceptance tests.

## Idempotency preamble

Before running any step, resolve the PR number, its labels, and its body from the
current branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is carried through to Steps 5, 6, and 7 — do not
re-resolve. If the PR already carries the `dispatch:qa-done` label — an
interrupted prior run — **skip Steps 0.5–7 entirely** and return; the label is
this skill's terminal action and is already applied, so re-entry is a true no-op.
Otherwise run all steps in order.

## Steps

0. **Target resolution.**

   `/qa-fix` operates in place — the **current worktree dictates the target**.
   The session must be in a target worktree: the current branch is `<N>-…`, where
   `<N>` is the issue number. The router (`/dispatch-propagate`) is responsible
   for entering a target worktree; this skill never switches.

   ```bash
   BRANCH=$(basename "$(git rev-parse --show-toplevel)")
   case "$BRANCH" in
     [0-9]*-*) N="${BRANCH%%-*}" ;;
     *)
       echo "/qa-fix: current branch '$BRANCH' is not a target worktree (expected '<N>-…')" >&2
       exit 1
       ;;
   esac
   ```

   `<N>` is the issue number used by the remaining steps for their `tmp/`
   filenames.

0.5. **Merge `origin/main` into the working branch.** Fork `/commit-merge-push`
   via the Agent tool so the QA pass runs against a branch current with `main`
   rather than stale state. This invocation runs with no pending working-tree
   changes — `/commit-merge-push` tolerates that and creates no commit. If it
   reports a **merge conflict**, surface it and **stop** — do not begin the QA
   walkthrough. A merge conflict needs a human, so escalate to office-hours: skip
   the `phase-completed` marker and write `office-hours-reason` per the
   **Escalation** section, then stop.

1. **Detect whether the implementation has a browser component.**

   Run:
   ```bash
   git diff --name-only origin/main...HEAD
   ```

   The implementation has a browser component if any changed path matches one of:
   - A `vite.config.*` file.
   - A frontend template (e.g. `index.html`, files under `src/` of a frontend app).
   - A path under one of the known frontend packages: `budget`, `fellspiral`, `landing`, `print`.

   Pure-backend PRs (e.g. `functions/`-only, scripts-only) take the **non-browser path**.

   If a browser component is detected, identify the **app dir** (`budget`,
   `fellspiral`, `landing`, or `print`) from the changed paths. If multiple app
   dirs are touched, this is a judgment call needing a human — record it as a
   user-input blocker and escalate per the **Escalation** section (do not ask the
   user which one to demo; that residue belongs to `/office-hours`).

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
     network responses, console output, or a shell command / file check. This
     skill verifies these itself.
   - **Needs human judgment** — success depends on visual layout, subjective UX,
     or a "does this look right" call. These are **not** walked here; each is
     recorded as deferred-to-office-hours and is a user-input blocker (see
     terminal disposition).

   The plan must focus on **end-user-visible** outcomes — what the user sees,
   clicks, expects, or experiences. Cover the golden path and user-visible edge
   cases. The plan must NOT duplicate things already verified by unit tests, lint,
   or type-check (those are CI's job). Build the plan around public seed data (see
   [QA data policy](#qa-data-policy)).

3. **Browser feature path.** Skip to Step 4 if the non-browser path applies.

   a. **Start the QA server in the background.** Use a Bash tool call with `run_in_background: true`:
      ```bash
      .claude/skills/dispatch-propagate/scripts/run-qa-server.sh <app-dir>
      ```
      Capture the App URL printed to stdout. The QA server seeds public data only — do not re-run it or any seed step with `SEED_TEST_ONLY=true` (see [QA data policy](#qa-data-policy)).

   b. **Wait for the server:**
      ```bash
      .claude/skills/dispatch-propagate/scripts/wait-for-url.sh <url>
      ```

   c. **Pre-QA acceptance check:**
      ```bash
      .claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh <app-dir> <url>
      ```

      - **If the check fails** → a failed pre-QA acceptance check is a bug. A bug
        needs an in-session plan-mode fix, which is a user-input blocker. Record
        it, finalize the QA session (post the Step 5 summary including the bug,
        run cleanup Step 6), and escalate per the **Escalation** section.
      - **If the check passes** → continue to the walkthrough.

   d. **Walk through only the machine-verifiable QA-plan items via the Chrome
      extension.** Needs-human-judgment items are **not** walked — they are
      recorded as deferred-to-office-hours.

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
      7. **For each machine-verifiable plan item:**
         a. **Set up state.** Navigate to the item's URL path (if not "current"). Execute the steps using `computer`, `form_input`, `navigate`. Capture extra GIF frames before and after.
         b. **Check output.** Take a screenshot. Read `get_page_text` to verify the expected outcome. Check `read_console_messages` (filter for errors). Check `read_network_requests` for 4xx/5xx.
         c. **Record the result** — **PASS** or **FAIL**, directly from this
            skill's own checks. **No user prompt.**
            - On interaction failure: retry once, then record **SKIP** and continue.
            - 3 consecutive SKIPs → stop the walkthrough early.
            - Stay on the App URL domain — do not follow external links.
            - **On the first FAIL** → a bug. Stop the walkthrough, finalize the QA
              session (Steps 5 and 6), and escalate per the **Escalation** section.
      8. Stop GIF recording: `gif_creator` with `action: "stop_recording"`. Export to `tmp/qa-fix-walkthrough-<n>.gif` (where `<n>` is the Step-0-resolved issue number `<N>`).
      9. Write per-item results (PASS/FAIL/SKIP, console errors, network failures, deferred judgment items, summary counts) to `tmp/qa-fix-results-<n>.txt`.

4. **Non-browser path.**

   Print the QA plan in the conversation and walk through only the
   machine-verifiable items one at a time:
   - **Item verifiable by a command or file inspection** → run the command or
     inspect the file and record **PASS** or **FAIL** from the result. No user
     prompt.
   - **Item needing a manual action this skill cannot script** → this is a
     needs-human-judgment item: record it as deferred-to-office-hours; do not
     prompt the user.
   - **On the first FAIL** → a bug. Stop the walkthrough, finalize (Steps 5/6),
     and escalate per the **Escalation** section.
   - Otherwise continue to the next item.

   Write per-item results to `tmp/qa-fix-results-<n>.txt`.

5. **Post the PR-comment summary.**

   `PR_NUM` was resolved in the idempotency preamble — reuse it; do not
   re-resolve.

   Write a markdown summary to `tmp/qa-fix-summary-<n>.md` (where `<n>` is the
   Step-0-resolved issue number `<N>`). Include:
   - Items walked.
   - PASS / FAIL / SKIP counts.
   - **Deferred to office-hours** — each needs-human-judgment item, listed so the
     `/office-hours` walkthrough can pick them up.
   - List of bugs found (if any), each with the item title and the finding.
   - For browser walkthroughs: the GIF filename (`tmp/qa-fix-walkthrough-<n>.gif`).

   Post via (use `dangerouslyDisableSandbox: true` — the script invokes `gh`):
   ```bash
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/qa-fix-summary-<n>.md
   ```

6. **Cleanup.**

   On the browser path (server was started), always run on exit:
   ```bash
   .claude/skills/dispatch-propagate/scripts/run-qa-cleanup.sh
   ```

   Use this script — never broad `pkill`. On the non-browser path, no QA server
   was started — skip cleanup.

7. **Terminal disposition.**

   **Clean autonomous pass** — every machine-verifiable item PASSed, zero
   needs-human-judgment items were recorded, and no bug was found:

   Apply the `dispatch:qa-done` label via `dispatch-complete-phase` (use
   `dangerouslyDisableSandbox: true` — it invokes `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" qa
   ```

   The PR number passed here is **expected** to differ from the worktree's
   `<issue>-…` branch issue number — the PR↔issue linkage was established earlier
   in the tick, so this session must **not** pause to re-confirm the mismatch.
   This skill **owns** its `dispatch:qa-done` label — parallel to how
   `/code-review-fix` owns `dispatch:code-reviewed` — so `/dispatch-propagate`
   does not apply the label after this skill returns.

   Then write the `phase-completed` marker as the final action. Atomic via
   tempfile + mv. `CLAUDE_JOB_DIR` unset = interactive run; skip.

   ```bash
   if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
     printf 'phase=qa\npr=%s\n' "$PR_NUM" \
       > "$CLAUDE_JOB_DIR/phase-completed.tmp"
     mv "$CLAUDE_JOB_DIR/phase-completed.tmp" \
        "$CLAUDE_JOB_DIR/phase-completed"
   fi
   ```

   Then **stop**. The Stop hook reads the marker and advances the chain.

   **User-input blocker** — any needs-human-judgment item was recorded, OR a
   machine-verifiable item FAILed, OR the pre-QA acceptance check failed (a bug
   needing a plan-mode fix), OR a multi-app demo choice arose (Step 1), OR the
   `origin/main` merge conflicted (Step 0.5):

   Do **not** apply `dispatch:qa-done`. Escalate per the **Escalation** section
   below and **stop**.

   The "unexpected permission prompt" blocker needs no explicit handling — if one
   fires mid-run, `dispatch-input-block.sh` already applies `dispatch:office-hours`
   to the issue and parks the session.

## Escalation

On a user-input blocker, do **not** write the `phase-completed` marker. Instead
write a one-line reason so the Stop hook can surface it in the office-hours
comment. The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads marker-absence as
Branch A and applies `dispatch:office-hours` to the **issue**, parking it for the
office-hours queue (`/office-hours` runs the user-input residue).

```bash
if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
  printf '%s\n' "/qa-fix: QA needs a human (judgment item, bug, or failed pre-QA check); escalating to office-hours" \
    > "$CLAUDE_JOB_DIR/office-hours-reason.tmp"
  mv "$CLAUDE_JOB_DIR/office-hours-reason.tmp" \
     "$CLAUDE_JOB_DIR/office-hours-reason"
fi
```

Tailor the reason text to the blocker that actually fired (judgment item, machine
FAIL, failed pre-QA check, multi-app choice, merge conflict). Then **stop**.

## Notes

The skill is idempotent: a re-invocation with `dispatch:qa-done` already on the
PR skips Steps 0.5–7 and returns. The label is this skill's terminal action and
is already applied, so re-entry is a true no-op.
