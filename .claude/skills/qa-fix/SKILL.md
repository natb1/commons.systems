---
name: qa-fix
description: QA phase — merge origin/main, run the autonomous portion of user-acceptance QA (plan items, machine-verifiable checks, PR-comment summary), apply the dispatch:qa-done label on a clean pass, run the bounded Opus auto-fix lane on opus-fixable residue (per-unit /implement-unit, re-QA via the chain, attempt-capped), and escalate to office-hours on any user-input blocker
---

# QA and Fix

The `qa` phase of the issue workflow, dispatched by `/dispatch-propagate` — the
**autonomous** half of user-acceptance QA, sibling to `/review-fix`. The moment QA
needs a human — a `needs-human` judgment item, an unexpected permission prompt, or
a bounded auto-fix-exhausted bug (cap reached / scope-deviation / planning-failed
on an `opus-fixable` item) — it escalates to office-hours via the standard path
(skip the `phase-completed` marker, write `office-hours-reason`; the Stop hook
applies `dispatch:office-hours` and parks the session).

The Step 3.5 disposition Workflow classifies residue on a **four-class axis**:
`opus-fixable` bugs are auto-fixed (Step 3.7); `needs-main` bugs are filed as
`blocked_by` follow-ups (Step 3.6) and do not escalate; `already-satisfied` items
are **dropped as PASS**; `needs-human` residue runs later via `/office-hours`.

The QA plan (Step 2) is authored by a **single bounded Opus triage subagent**
returning a three-way-classified, ordered item list (`script-verifiable`,
`needs-browser`, `needs-human-judgment`). There are **three** Opus spends: the
Step 2 triage subagent, the Step 3.5 Workflow's classify agent, and its gated
`fix-plan` planner. The qa-fix session itself stays Sonnet — it parses the triage
output and executes it across three lanes (shell-command, single-assertion,
walkthrough), reserving the browser walkthrough for `needs-browser` items only. It
runs in the **caller's thread** (no `context:` key), so it can fork
`/commit-merge-push` and run browser/shell checks inline.

## QA data policy

The QA pass covers **public data only** — documents present in both the QA server and production.

- **Identify public seed items** from `<app>/seeds/firestore.ts`: documents in collection blocks **without** `testOnly: true`. The QA server seeds exactly these. Build the walkthrough around them.
- **Never** run the QA server or any seed step with `SEED_TEST_ONLY=true`, and never re-seed `testOnly` collections by other means — that breaks QA/prod parity, letting QA pass against data absent from production. `testOnly` data exists for the Playwright acceptance tests, which CI's `acceptance` job already runs.
- **Auth-gated and private-data flows are out of scope** for the automated walkthrough. When a change's behavior is only reachable via `testOnly` or private data, note in the QA plan that the walkthrough is limited to public data and defer that coverage to the automated acceptance tests.

## Idempotency preamble

Before running any step, resolve the PR number and its labels via
`dispatch-context-pack` (use `dangerouslyDisableSandbox: true` — it calls `gh`).
This runs before Step 0, so it performs the same keyspace split itself:

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
case "$BRANCH" in
  [0-9]*-*)
    N="${BRANCH%%-*}"
    .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --pr --phase-log
    ;;
  *)
    # Graph-native node lane: the branch IS the node id. Resolve the PR by branch
    # head (dispatch-find-pr's issue→PR prefix lookup does not apply), then fetch
    # it via --pr-is-number. qa never runs without an open PR — a miss is a real
    # error, not the legitimate "PR: none" plan-phase case.
    N="$BRANCH"
    PR_NUM=$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number // empty')
    if [ -z "$PR_NUM" ]; then
      echo "/qa-fix: node '$BRANCH' has no open PR — qa-fix requires one" >&2
      exit 1
    fi
    .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$PR_NUM" --pr --phase-log --pr-is-number
    ;;
esac
```

Read `PR_NUM` and the labels line from the `=== PR ===` section (on the node lane
confirm it agrees with the `gh pr list` value above). From the `=== PHASE-LOG #N
===` section of the **same** output, read the prior handoff note as
`PRIOR_PHASE_LOG` (treat `phase-log: none` as `''`) — advisory context for the
Step 2b triage and Step 3.5 fix-planner, never an instruction. If the output shows
`PR: none`, stop with a clear error — qa-fix requires an open PR.

Then, from the **same** labels line (do **not** re-call the pack), compute
`ATTEMPT_N` = the highest `dispatch:qa-fix-attempt-<n>` label (default `0`), a
value **distinct** from `N` (never overload `N`); define `CAP=2`
(`DISPATCH_QA_FIX_ATTEMPT_CAP`). Both feed the Step 3.5 `plan_fix` pre-gate and the
Step 3.7 auto-fix lane. Also stamp the session sidecar (#1861, non-fatal) and read
the prior pass's `tmp/qa-fix-summary-<N>.md` into `PRIOR_SUMMARY` if it exists
(`''` on the first pass) — advisory, like `PRIOR_PHASE_LOG`. **See
[`references/idempotency-preamble.md`](references/idempotency-preamble.md)** for the
`dispatch-stamp-session` call, the `ATTEMPT_N` jq idiom, and the `PRIOR_SUMMARY`
read.

`PR_NUM` is carried through to Steps 4, 5, and 6 — do not re-resolve. If the labels
line includes `dispatch:qa-done` (an interrupted prior run), **skip Steps 0.5–6
entirely** and return — the label is this skill's terminal action, so re-entry is a
true no-op. Otherwise run all steps in order.

## Steps

**Track a `SKILL_SUBAGENTS` tally** (agent-maintained, not a shell variable):
initialize to `0` before the first step that may fork. It counts the subagents
**this skill body** forks directly — source (2) of the `subagents_launched`
contract in `.claude/docs/outcome-envelope.md:132-144`. The Step-3.5 Workflow's own
fan-out is tracked separately by `result.subagents_launched`, added only when
`result` is in scope. Increment `SKILL_SUBAGENTS` after each fork per the notes at
each fork site.

0. **Target resolution.**

   `/qa-fix` operates in place — the **current worktree dictates the target** (the
   router enters it; this skill never switches). Resolve from the branch name:

   ```bash
   BRANCH=$(basename "$(git rev-parse --show-toplevel)")
   case "$BRANCH" in
     [0-9]*-*) N="${BRANCH%%-*}"; TARGET_KIND=issue ;;   # legacy issue lane
     *)        : ;;   # graph-native node lane — see references/target-resolution.md
   esac
   ```

   - **Legacy lane** (branch `<N>-…`): `N` = issue number, `TARGET_KIND=issue`.
   - **Node lane** (branch is the node id): fetch `intentions/<NODE_ID>.md` at
     `origin/main`, require its `phase` to be `qa` (else error), and apply the
     **parked re-entry guard** — if the node is already parked (first-class
     `office_hours` non-null, OR a non-null `attributes.office_hours` squatter
     block), `exit 0`. Then set `N=NODE_ID`, `TARGET_KIND=node`. **See
     [`references/target-resolution.md`](references/target-resolution.md)** for the
     full `case` block with the frontmatter-parsing bash.

   `$N` keys the remaining steps' `tmp/` filenames. `$TARGET_KIND` selects the lane
   at the seams that differ — see **Node-target lane** below. **On the node lane no
   gh issue is ever read or written.**

   ### Node-target lane (`TARGET_KIND=node`)

   Every step runs unchanged except these re-keyed seams:

   - **Context / PR.** Skip the `--issue` slices; reuse the `PR_NUM` the
     Idempotency preamble resolved (via `gh pr list --head`), do not re-derive.
   - **Completion.** On a clean pass do **not** apply `dispatch:qa-done` or call
     `dispatch-mark-complete` / `dispatch-finalize-phase`. Instead invoke the
     graph-native transition writer, which records the `qa-done` marker and
     advances the phase (`qa → review`, or `qa → main-qa` when a needs-main residue
     section was appended in Step 3.6) as one state-only graph-commit:

     ```bash
     .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"
     ```

   - **Escalation.** Instead of `dispatch:office-hours`, write the reason to
     `$CLAUDE_JOB_DIR/office-hours-reason` (and best-next-steps to
     `$CLAUDE_JOB_DIR/office-hours-recommendation`); the Stop hook parks the node
     via `park-node` (see `.claude/hooks/dispatch-stop.sh`).

0.5. **Merge `origin/main` into the working branch** (use
   `dangerouslyDisableSandbox: true` — git writes + `git push` over HTTPS):

   ```bash
   .claude/skills/dispatch-propagate/scripts/commit-merge-push --merge-only
   ```

   Exit 0 → proceed to Step 1. **Exit 3** (merge conflict) → escalate directly to
   office-hours per the **Escalation** section and stop (do **not** fork, do **not**
   increment `SKILL_SUBAGENTS`). **Any other non-zero exit** → fall back to the fork
   (canonical recipe from `/implement-unit` Step 2, `subagent_type: general-purpose`);
   increment `SKILL_SUBAGENTS` by 1 on the fork path only. If the fork then reports a
   merge conflict, escalate and stop.

1. **Detect whether the implementation has a browser component.** From
   `git diff --name-only origin/main...HEAD`, a browser component exists if any
   changed path is a `vite.config.*`, a frontend template (`index.html`, `src/` of a
   frontend app), or under a known frontend package (`budget`, `fellspiral`,
   `landing`, `print`). This supplies the **app dir** for the QA server (Step 3b) and
   tells the triage subagent whether a browser is available (per-item run is decided
   in Step 3).

   From the same diff: if any changed path is `firestore.rules` or a Firestore query
   module, `Read .claude/docs/firestore.md` for the rules-deploy caveat — on a
   feature branch, smoke tests can fail permission-denied until the standalone rules
   PR merges; treat such a failure as this known caveat, not a product bug. Derive
   `firestore_caveat` = **true** when it applies. Step 3 uses it to tag a
   permission-denied smoke FAIL as `main-gated-fail`; it is passed into the Workflow
   args (Step 3.5).

   If a browser component is detected, identify the **app dir** from the changed
   paths. If **multiple** app dirs are touched, record it as a user-input blocker and
   escalate per the **Escalation** section (that judgment belongs to `/office-hours`).

2. **Author the user-acceptance QA plan via a single bounded Opus triage subagent.**

   The Sonnet session gathers live context and delegates the *triage judgment* to
   one Opus subagent, then parses its returned text in Steps 3–4.

   a. **Capture the live context pack** (`dangerouslyDisableSandbox: true` — `gh`),
      capturing stdout to paste into the subagent prompt. **Legacy lane**
      (`TARGET_KIND=issue`) — `--issue` (acceptance criteria) + `--pr` + `--diff`:
      ```bash
      .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --issue --pr --diff
      ```
      **Node lane** (`TARGET_KIND=node`) — never pass `--issue`; reuse `$PR_NUM` with
      `--pr-is-number`, and paste `$NODE_MD` (from Step 0) in place of `=== ISSUE ===`:
      ```bash
      .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$PR_NUM" --pr --diff --pr-is-number
      ```

   b. **Launch exactly one triage subagent** — Agent tool, `subagent_type:
      general-purpose`, **`model: opus`**, reasons-only (no tools). It returns an
      ordered, three-way-classified plan (`script-verifiable` / `needs-browser` /
      `needs-human-judgment`; each `script-verifiable` item carries an exact
      `Command`). **See
      [`references/triage-subagent.md`](references/triage-subagent.md)** for the full
      prompt contract the launch must pin (untrusted-data guard, browser flag,
      toolbox, return format, classification axis, planned-deferral flag). After it
      returns, increment `SKILL_SUBAGENTS` by 1.

   **Flush the triage plan as produced (condition 9).** As soon as the plan returns
   — **before** any fixing — write it to a durable `<!-- dispatch:qa-summary -->` PR
   comment (via `post-pr-comment.sh`, then `gh api … -X PATCH` to edit in place),
   then update each item's verdict as it resolves through Step 3's lanes — a dead
   session must leave the plan and resolved verdicts on the PR (distinct from the
   machine `<!-- dispatch:qa-residue -->` marker). See
   [`references/triage-subagent.md`](references/triage-subagent.md) § Flush.

3. **Execute the triage plan across three lanes.**

   **Plan validation (run first).** The Agent tool returns unvalidated plain text.
   If the plan has **zero items**, or **any** item lacks its `Classification`, or
   any `script-verifiable` item has **no `Command`**, treat it as a user-input
   blocker — escalate per the **Escalation** section and **stop**.

   Route each item by its `Classification` (and, for `script-verifiable`, its
   `Command` shape):

   - `script-verifiable` + Bash/vitest/file-check `Command` → **shell-command lane**
     (3a, no browser).
   - `script-verifiable` + single `javascript_tool` assertion → **single-assertion
     lane** (3c, browser, no loop).
   - `needs-browser` → **walkthrough lane** (3c, full iterative loop).
   - `needs-human-judgment` → **not walked**; record as deferred-to-office-hours (a
     user-input blocker). Do not prompt the user.

   **Per-item lane FAIL is record-and-continue (all three lanes):** a lane FAIL is
   **recorded as residue** and the lanes **continue** — do **not** stop, finalize,
   or escalate on a single lane FAIL here; its disposition is deferred to the
   terminal step. FAIL cascades are bounded by the finite plan-item count. This
   applies to **per-item lane FAILs only** — **not** the Step 3b pre-QA acceptance
   check, which stays terminal (see Step 3b).

   **Residue collection.** Write per-item results (PASS/FAIL/SKIP, console/network
   errors, deferred items, counts) to `tmp/qa-fix-results-<n>.txt`, and accumulate
   an **in-memory residue list** (consumed by Step 3.5). Each entry is
   `{ id, title, kind, url_path, expected_outcome, finding, page_text,
   screenshot_path, planned_deferral }`; `kind` is exactly **`fail`**,
   **`needs-human-judgment`**, or **`main-gated-fail`** (a permission-denied smoke
   FAIL when `firestore_caveat` from Step 1 applies). SKIPs are **not** residue;
   `planned_deferral` rides an item flagged `Flag: planned-deferral`.

   Run the **shell-command lane first** (cheapest — 3a). Start the QA server **iff
   any item needs the browser** (any `needs-browser`, or any single-`javascript_tool`
   assertion) — else **skip the browser lanes and continue to Step 4** (3b).
   Server-start runs the fixed **pre-QA acceptance check**, which **stays terminal**
   (on failure, finalize + escalate **without** the per-item lanes). Then run the
   browser single-assertion + walkthrough lanes (3c; walkthrough: retry-once →
   **SKIP**, 3-SKIPs → stop-early). **See
   [`references/execution-lanes.md`](references/execution-lanes.md)** for the full
   residue schema, the three-kind detail, and all three lanes — incl. the
   Chrome-unavailable escalation and the `tmp/qa-fix-walkthrough-<n>.gif` export.

3.5. **Invoke the disposition + gated fix-planning Workflow.**

   Run this step only when the in-memory residue list is **non-empty**; if empty,
   skip it and proceed to Step 4 with no dispositions.

   **Build `args`** and **invoke the Workflow tool on
   `.claude/workflows/qa-fix.js`** (a sanctioned caller — no `ultracode` keyword).
   It runs in the background and returns one compact `result`. `args` carries
   `pr_num`, `issue_num`, `app_dir`, `browser_available`, `firestore_caveat`, the
   `residue` list, `plan_fix` (`ATTEMPT_N < CAP` — the read-only pre-gate: false at
   the cap so no Opus plans a fix that can't run), and the advisory
   `acceptance_criteria` / `changed_files` / `prior_attempt_summary` /
   `prior_phase_log` (all already captured — reuse, **no** extra pack call).
   `result` carries `dispositions`, `already_satisfied`, `verify_report`, `fix_plan`
   (`null` when the gated fix-plan phase did not run), and the LIVE `deviation`.
   **See [`references/disposition-workflow.md`](references/disposition-workflow.md)**
   for the full `args` build, the `result` schema, and the four-class axis.

   The Workflow stays **report-only** (acts on nothing): the skill acts — Step 3.6
   files `needs-main` follow-ups, Step 3.7 auto-fixes `opus-fixable`, `needs-human`
   escalates under Step 6, `already-satisfied` drops as PASS. Consume
   `result.dispositions` / `result.verify_report` for the Step 4 comment, and
   `result.fix_plan` / `result.deviation` for Step 3.7.

3.6. **File needs-main follow-ups.**

   Run this step only when Step 3.5 ran **and** `result.dispositions` contains a
   `class === "needs-main"` item; else skip. It runs **before** the Step 3.7
   auto-fix lane, so a mixed fixing pass files its needs-main follow-ups here (the
   Step 4 comment can then list them). Filing here drops a `needs-main` item from
   the Step 6 escalation set on its own account, never suppressing a park caused by
   another class.

   **Node-target lane (`TARGET_KIND=node`):** files **nothing anywhere**. Instead
   append a `## needs-main residue` section to the tactic's **own body**
   (`intentions/<node-id>.md`), one entry per `needs-main` item (`id`, `title`,
   `url_path`, `expected_outcome`, `finding`). That append rides in the Step-4
   `transition-node` commit; the transition writer then picks `qa → main-qa` and
   `tactic-main-qa-phase` owns verification. Skip the rest of this step.

   **Legacy lane (`TARGET_KIND=issue`):** file one `blocked_by` follow-up per
   `needs-main` item (mirrors `/review-fix` Step 5a/5b). Join each disposition back
   to the residue list by `id`; compute a per-item `route` (`autonomous` → `main-qa`
   only, routed to `/qa-main` for objective public-prod checks; `human` → `main-qa` +
   `dispatch:office-hours`; **uncertain → `human`**); compose via
   `dispatch-qa-needs-main-followup`; then fan out one Sonnet subagent per follow-up
   (`dispatch-followup-exists` → `/file-issue` → `blocked_by` issue `$N` via
   `ref-github-issues` → `dispatch-qa-apply-main-qa-labels --route`). Increment
   `SKILL_SUBAGENTS` by the subagents forked; the filing is **idempotent**. **See
   [`references/needs-main-followups.md`](references/needs-main-followups.md)** for
   the full route criteria and per-subagent procedure.

3.7. **Auto-fix lane.**

   Runs only when Step 3.5 ran. Decides whether this pass **fixes** the opus-fixable
   residue or falls through to the terminal disposition (Steps 4/5/6).

   1. Compute `opusFixable = result.dispositions.filter(d => d.class ===
      'opus-fixable')`. If **empty** → skip the auto-fix lane and fall through to
      Step 4 / 5 / 6 (unchanged).

   2. Otherwise (opus-fixable items present), choose exactly one path:

      - **`result.fix_plan === null`** → **escalate finalize path** (below), **no**
        attempt label. Distinguish "cap reached" (`plan_fix` false, `ATTEMPT_N >=
        CAP` — wait for reset) from "planning agent did not return a plan"
        (`plan_fix` true — re-trigger) for the reason.
      - **`result.deviation === true`** → scope-deviation escape → **escalate
        finalize path** with `result.fix_plan.deviation_reason`; **no** attempt
        label (permanent escalation).
      - **`result.fix_plan.units` empty** (not a deviation) → **escalate finalize
        path**, planning-failed reason; no attempt label.
      - **Otherwise (have units):** run the **no-progress short-circuit** — write
        `opusFixable.map(d => d.id)` to `tmp/qa-residue-current.txt`, then
        `dispatch-qa-noprogress "$PR_NUM" tmp/qa-residue-current.txt`. On
        `no-progress` (prior failing set non-empty, this attempt resolves none of
        it) take the escalate finalize path (no attempt label, reason names the
        `dispatch:attempts-<n>` total). On `progress` run the **attempt gate**
        `dispatch-qa-fix-attempt "$PR_NUM"` — it **applies the attempt label itself**
        (this skill NEVER separately applies one). Gate prints `escalate` → escalate
        finalize path; prints `fix` → **fix finalize path**. (All three calls use
        `dangerouslyDisableSandbox: true` — they call `gh`.)

   **Fix finalize path** (gate printed `fix`): loop `result.fix_plan.units` in
   dependency order, invoking `/implement-unit` per unit (map `unit.model` /
   `unit.scope` / `unit.context` / `unit.commit_intent`; fold the "Read before
   Edit" note into `context`; open **NO** new PR). Track `fixes_applied_count`
   (distinct opus-fixable IDs resolved by **landed** units) and increment
   `SKILL_SUBAGENTS` per invocation. If `fixes_applied_count == 0` after the loop →
   take the **escalate finalize path** instead (`fix-pass-landed-nothing`).
   Otherwise run Step 4, Step 5, `dispatch-mark-complete --phase qa` (NO
   `dispatch:qa-done`), emit the outcome envelope (`--disposition
   completed_with_fixes`, `--fixes-applied <fixes_applied_count>`), and **STOP**.

   **Escalate finalize path** (cap / scope-deviation / planning-failed /
   fix-pass-landed-nothing / no-progress / gate said `escalate`): run Step 4, Step
   5, escalate per the **Escalation** section (tailored reason), **STOP**.

   **CRITICAL invariants:** **the fix path HARD-STOPS the skill** — never fall
   through to Step 6 (that would produce both a fix AND an escalation the same
   pass); a mixed case **fixes-first and escalates nothing** that pass; the fix
   commits restart CI so the chain re-QAs (the **attempt cap is enforced HERE**, not
   in the stop hook); a known pre-existing TOCTOU race is flagged — do **NOT** "fix"
   it. **See [`references/auto-fix-lane.md`](references/auto-fix-lane.md)** for the
   full branch detail, the tally definitions, the outcome-envelope emits, and the
   full invariants.

4. **Post the PR-comment summary.**

   Reuse `PR_NUM`. Write a markdown summary to `tmp/qa-fix-summary-<n>.md` with a
   first line of `<!-- dispatch:qa-summary -->` — the same marker the Step-2 flush
   uses, so this **finalizes that comment in place** (via `dispatch_marker_comment_id`:
   edit if present, else `post-pr-comment.sh`; `dangerouslyDisableSandbox: true`). It
   includes items executed, PASS/FAIL/SKIP counts, items **deferred to office-hours**
   (only `needs-human`-class), bugs found, the walkthrough GIF, a **disposition
   triage** section (only when Step 3.5 ran), a **filed follow-ups** sub-list (only
   when Step 3.6 ran, with each route), and an **Assessed by Opus (already
   satisfied)** sub-list. **See
   [`references/pr-comment-summary.md`](references/pr-comment-summary.md)** for the
   full composition, the verify-source join rules, and the finalize bash.

   Then **write the qa phase-log entry** — compose `tmp/phase-log-entry-<n>.md` (a
   one-line-per-finding digest; a clean pass writes `failed: none`) and run (use
   `dangerouslyDisableSandbox: true` — `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log \
     "$N" --phase qa --attempt "$ATTEMPT_N" < tmp/phase-log-entry-<n>.md
   ```

   Tag with the **same** `ATTEMPT_N` from the preamble (the upsert keys on (phase,
   attempt), so a stable number makes a crash-rerun idempotent). **This write is NOT
   terminal** — it must **precede** the `dispatch:qa-done` / completion marker.

5. **Cleanup.**

   If the QA server was started (Step 3b ran), always run on exit (use this script —
   never broad `pkill`); if the server never started, skip cleanup:
   ```bash
   .claude/skills/dispatch-propagate/scripts/run-qa-cleanup.sh
   ```

6. **Terminal disposition.**

   Three outcomes, in **precedence order**:
   1. **Auto-fix applied** (Step 3.7's fix finalize path already STOPPED) — **Step 6
      is not reached on a fixing pass**; a fixing pass escalates nothing.
   2. **Escalate residue** (non-fixing pass, or a Step 3.7 escalate-finalize STOPPED
      before here). The escalation set **excludes** `needs-main` residue (filed as
      follow-ups in Step 3.6) and `already-satisfied` residue (dropped as PASS);
      `opus-fixable` and `needs-human` residue still escalate (see below).
   3. **Clean pass** — no residue (or only `needs-main` / only `already-satisfied`
      residue): `dispatch-complete-phase qa` + `dispatch-mark-complete` (see **Clean
      autonomous pass** below).

   **Escalation set.** Build it directly from **`result.dispositions`** (not by
   re-deriving class from the raw residue list) plus the **non-residue terminal
   blockers** (malformed/empty triage plan [Step 3], `origin/main` merge conflict
   [Step 0.5], Chrome unavailable [Step 3c], multi-app choice [Step 1], failed pre-QA
   acceptance check [Step 3b]). `needs-main` residue (filed in Step 3.6) and
   `already-satisfied` residue (dropped as PASS) are in **neither** part. **See
   [`references/terminal-disposition.md`](references/terminal-disposition.md)** for
   the full set-derivation and the user-input-blocker membership rules.

   **Clean autonomous pass** (escalation set empty — no residue, or only
   `needs-main` / only `already-satisfied` residue): apply `dispatch:qa-done`, the
   completion marker, then finalize (use `dangerouslyDisableSandbox: true`). This
   skill **owns** its `dispatch:qa-done` label (parallel to `/review-fix` owning
   `dispatch:reviewed`); the PR number is expected to differ from the worktree's
   `<issue>-…` branch — do not pause on the mismatch.

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" qa
   .claude/skills/dispatch-propagate/scripts/dispatch-mark-complete --phase qa --pr "$PR_NUM"
   ```

   **Then emit the outcome envelope** (`--disposition completed`, `--fixes-applied
   0`, **omit** `--terminated-reason`; count-sourcing per whether Step 3.5 ran — see
   the reference). **Then, as the ABSOLUTE LAST action** (after the envelope emit,
   which self-closes the session), run `dispatch-finalize-phase` — it strips any
   premature `dispatch:office-hours`, spawns the next tick + sweep, and self-closes.
   This is the clean-pass terminus only (the escalation path below does **not** call it):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-finalize-phase "$N" --pr "$PR_NUM"
   ```

   **User-input blocker** (escalation set non-empty): do **not** apply
   `dispatch:qa-done`; escalate per the **Escalation** section and **stop**. A
   `needs-main` or `already-satisfied` residue item is **not** a member. The
   "unexpected permission prompt" blocker needs no explicit handling —
   `dispatch-input-block.sh` handles it while this session stays blocked.

## Escalation

On a user-input blocker, do **not** write the `phase-completed` marker — this is a
deliberate office-hours park. Before `dispatch-mark-deviation`, perform the
in-session recommend step (see
`.claude/skills/dispatch-propagate/escalation-recommend.md`). Then call
`dispatch-mark-deviation`; the Stop hook reads marker-absence as Branch A and
applies `dispatch:office-hours` to the **issue** (`/office-hours` runs the residue):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/qa-fix: QA needs a human (judgment item, bug, or failed pre-QA check); escalating to office-hours"
```

Tailor the reason to the blocker that fired (malformed/empty triage plan,
`needs-human-judgment` item, `script-verifiable`/`needs-browser` FAIL, failed pre-QA
check, Chrome unavailable, multi-app choice, merge conflict, **attempt cap reached**,
or **planner scope-deviation** — pass `result.fix_plan.deviation_reason` for the latter).

**Then emit the outcome envelope** — `--disposition escalated`,
`--terminated-reason` = the **same tailored reason string** (sandboxed; must fire
**before** the session stops). Count sourcing differs by whether Step 3.5 ran
(`result` in scope on the Step-3.7 escalate-finalize path; absent — pass zeros —
on an early blocker before Step 3.5). **See
[`references/terminal-disposition.md`](references/terminal-disposition.md)** §
Escalation for the full count-sourcing and the `dispatch-emit-outcome` recipe.

Then **stop**.
Marking a deviation is **terminal** for the walkthrough — do not restart the QA
server or re-run the walkthrough after escalating.

## Notes

The skill is idempotent: a re-invocation with `dispatch:qa-done` already on the PR
skips Steps 0.5–6 and returns. The auto-fix lane (Step 3.7) is bounded on
re-invocation by two durable side effects: each `/implement-unit` lands a **durable
commit** (a re-invocation mid-fix re-QAs against landed work), and the
`dispatch-qa-fix-attempt` gate applies **exactly one** attempt label per fixing
pass, hard-capping fixing passes at `CAP` (default 2).

**Resume contract (condition 9).** A re-selected worker treats durable state as
resume input, never an error: items the prior `<!-- dispatch:qa-summary -->` comment
already marks resolved are **not** re-derived (the Step-2 flush persisted them), and
per-unit fix commits are already durable. Diff the worktree against the branch base,
read the prior comment, and continue from there.
