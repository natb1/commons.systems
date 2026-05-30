---
name: office-hours
description: Office-hours queue worker — selects one sessionless dispatch:office-hours item and runs its user-input residue: the plan-approval portion of /plan-implement for an implement item, the interactive QA walkthrough and first-bug plan-mode fix for a qa item, or an accept/reject deviation review for a completed-but-deviating item
---

# Office Hours

The office-hours counterpart of `/dispatch` — the user-facing entry into the
**office-hours queue**, the set of items blocked on a human. An item lands here
two ways:

1. **Mid-phase input block** — a dispatch phase reached a user-input point
   (`/plan-implement` plan approval, a QA judgment-call walkthrough item or
   first-found bug, an unexpected permission prompt). The input-block hook
   (`dispatch-input-block.sh`) applied `dispatch:office-hours` to the issue and
   parked the session.
2. **Completion-time deviation** — a phase ran to completion but surfaced a
   deviation from the approved plan or the acceptance criteria. The phase skill
   skipped its `phase-completed` marker and wrote `office-hours-reason`; the Stop
   hook (`dispatch-stop.sh`) applied `dispatch:office-hours` to the issue.

This skill runs the **user-input residue** that the autonomous dispatch queue
could not: it walks judgment-call items, approves plans, fixes first-found bugs
in plan mode, or reviews a surfaced deviation. It is the human half of work whose
autonomous half ran as a dispatch-queue phase skill (`/plan-implement`,
`/qa-fix`, …).

## Label clearing is automatic

When you submit your first prompt inside an `<N>-*` worktree, the
`dispatch-office-hours-strip.sh` hook (`UserPromptSubmit`) removes
`dispatch:office-hours` from the item's PR and issue — a human is now driving it.
So engaging an item here clears the label automatically; this skill does **not**
clear it itself, and on completion the item is dispatch-eligible again. The
session simply ends; the next `/dispatch-propagate` router (re-seeded by the
heartbeat) returns the de-labeled item to the dispatch chain. There is no in-skill
hand-off and no Stop-hook action — the Stop hook ignores non-`<N>-` session names.

## Steps

0. **Select and locate the target.**

   Run the selection script (use `dangerouslyDisableSandbox: true` — it queries
   `gh` and `claude agents --json`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/office-hours-select-target
   ```

   It prints one line:

   - `empty` — no sessionless office-hours item exists. Report that and **stop**.
   - `office-hours <N> <phase> <pr-or-dash>` — the selected issue `<N>`, its
     phase, and its PR number (or `-`). Carry `<N>`, `<phase>`, and the PR
     through the rest of the skill.

   **Enter the item's worktree.** If the current branch is already `<N>-…`, you
   are in place — proceed. Otherwise resolve the worktree (use
   `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-resolve-worktree <N> explicit
   ```

   - `enter <path>` → `cd` into `<path>` and proceed.
   - `conflict <path>` → a live session owns the worktree; it should be resumed,
     not picked up fresh. Report the conflict and **stop**.
   - `create <branch>` → no worktree exists yet. Materializing one is the
     dispatch router's job, not this skill's; report it and **stop**.

1. **Branch on the item's phase.** `<phase>` (from Step 0) discriminates the
   three residue kinds:

   - `implement` (no PR) → **plan-approval residue** (Step 2).
   - `qa` (draft PR, CI green, no `dispatch:qa-done`) → **QA residue** (Step 3).
   - anything else (`verify`, `code-review`, `review`, `security`, `done`) →
     **deviation-review** (Step 4). The autonomous phase already ran; the
     office-hours label means a surfaced deviation or an unexpected input block
     during an autonomous phase, not unfinished autonomous work.

2. **Plan-approval residue (`implement`).**

   The autonomous `/plan-implement` run parked at plan approval. Run
   `/plan-implement <N>` via the Skill tool: it re-plans (or restores the
   in-context plan), you approve it interactively, and its build loop and
   draft-PR open proceed normally. This is the same skill the dispatch queue runs
   — here it runs with you in the loop for the approval the autonomous run could
   not give itself. When it finishes, **stop**.

3. **QA residue (`qa`).**

   The autonomous `/qa-fix` run completed its machine-verifiable checks and
   escalated because QA needs a human — a needs-human-judgment walkthrough item,
   or a bug. Run the **interactive** portion of QA the autonomous pass deferred.

   a. **Recover the deferred items.** The `/qa-fix` run posted a PR-comment
      summary listing the machine results and the **deferred-to-office-hours**
      judgment items (and any bug it found). Read the latest such comment to
      recover them (use `dangerouslyDisableSandbox: true` — `gh` needs network):

      ```bash
      gh pr view <pr> --json comments \
        -q '.comments | map(select(.body | contains("qa-fix"))) | last.body'
      ```

      If a browser walkthrough is needed for the judgment items, start the QA
      server (`run-qa-server.sh <app>`, `wait-for-url.sh`) and drive it via the
      Chrome extension exactly as `/qa-fix` Step 3 does — but here you **prompt
      the user** for each needs-human-judgment item: describe what should be on
      screen, wait for the user's confirmation, and record PASS (user confirms)
      or FAIL (user reports a problem). Honor the [QA data policy] — public seed
      data only; never `SEED_TEST_ONLY=true`.

   b. **On the first bug** — a user-reported FAIL or a bug already named in the
      `/qa-fix` summary — finalize the QA session (stop/export any GIF, run
      `run-qa-cleanup.sh`), then fix it in-session:

      1. **Plan the fix.** Follow `/plan-implement` Step 1: `EnterPlanMode` and
         produce an ordered list of logical units (each with Scope, Model,
         Dependencies) plus the `ref-memory-management` Clean Context Planning
         preface (active workflow step: the `qa` phase of `/dispatch-propagate`).
      2. **Build the fix.** Follow `/plan-implement` Step 2: for each approved
         unit in dependency order, invoke `/implement-unit` via the Skill tool.
         A normal in-session loop — do not clear context between units. **Skip
         `/plan-implement` Step 3** — the draft PR already exists.
      3. **Do not** apply `dispatch:qa-done`. The fix commits change the PR; the
         dispatch chain re-derives the phase (→ `verify`/`waiting` while CI runs,
         → `qa` once green) and re-QAs the fixed build on the next tick.

   c. **Clean walkthrough — every judgment item PASSed, no bug.** QA is now
      complete and the item should advance. Apply `dispatch:qa-done` to the PR so
      the dispatch chain moves it to code-review (use
      `dangerouslyDisableSandbox: true`):

      ```bash
      .claude/skills/dispatch-propagate/scripts/dispatch-complete-phase <pr> qa
      ```

      Run `run-qa-cleanup.sh` if a server was started, then **stop**.

4. **Deviation-review (`code-review` / `review` / `security` / `done`).**

   The phase already ran; the office-hours label marks a surfaced deviation from
   the approved plan or the acceptance criteria. **Do not re-run a phase skill.**
   Present the deviation and take the user's decision.

   a. **Surface the deviation.** Read `$CLAUDE_JOB_DIR/office-hours-reason` if it
      is still reachable; otherwise read the latest dispatch PR comment for the
      phase that parked the item (use `dangerouslyDisableSandbox: true`):

      ```bash
      gh pr view <pr> --json comments -q '.comments | last.body'
      ```

      Show the user the surfaced deviation in plain terms — what the phase did,
      and how it diverged from the plan or the acceptance criteria.

   b. **Take the decision.**

      - **Accept** — the deviation is fine. Nothing more to do: your engagement
        already cleared the label (see [Label clearing is automatic]), so the
        item is dispatch-eligible and re-enters the chain on the next router.
        **Stop.**
      - **Reject** — the deviation must be corrected. The user's correction
        drives the fix: plan it (`/plan-implement` Step 1 in plan mode) and build
        it (`/implement-unit` per unit), in-session. Do **not** re-apply any
        `dispatch:*` phase label — the corrected build re-enters the chain and
        re-runs the affected phase on the next tick. **Stop.**

[QA data policy]: ../qa-fix/SKILL.md
[Label clearing is automatic]: #label-clearing-is-automatic
