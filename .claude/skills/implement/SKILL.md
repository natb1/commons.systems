---
name: implement
description: Implement phase — read the persisted plan from the issue's `<!-- dispatch:plan -->` comment, build each unit via /implement-unit, and open a draft PR.
---

# Implement

The `implement` phase of the issue workflow, dispatched by `/dispatch-propagate`.
Reads the plan persisted to the issue's `<!-- dispatch:plan -->` comment by the
`plan` phase, builds each unit, and opens a draft PR. One draft PR with a
`Closes #N` line is the implement→fix-checks transition marker.

**The main thread never edits files.** It delegates: every code change happens in
a subagent. Each unit is built by `/implement-unit`, which launches an
implementation subagent and forks `/commit-merge-push`.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push` and run subagents inline.

## Sandbox

Every `gh`/network call in this skill carries `dangerouslyDisableSandbox: true` —
`gh` needs network and the sandbox blocks it. See `.claude/rules/sandbox.md`.

## Parameters

On the graph-native node lane the front door (below) derives these structured
inputs from the node-id argument this skill is invoked with
(`/implement <node-id>`):

| Parameter | Meaning |
|---|---|
| `node_id` | The intention node id this session implements — the `/implement <node-id>` argument, which also names the current worktree branch. |
| `pr_num` | The open draft PR's number, or **empty**. Unlike the other graph-native phase skills, `implement` tolerates an empty `pr_num`: a missing PR here is the legitimate "first run" case (no PR opened yet), not an error. |

## Idempotency preamble

This skill's terminal artifact is the **draft PR** — there is no owned label.

First resolve the target issue number `<N>` from the worktree branch. `/implement`
operates in place — the **current worktree dictates the target**. The session must
be in a target worktree: the current branch is `<N>-…`, where `<N>` is the issue
number. The router (`/dispatch-propagate`) is responsible for entering a target
worktree; this skill never switches.

```bash
BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$BRANCH" in
  [0-9]*-*)
    # Legacy issue lane: worktree named `<N>-…`.
    N="${BRANCH%%-*}"
    TARGET_KIND=issue
    ;;
  *)
    # Graph-native node lane: worktree named after the intention node id. The
    # shared front door validates the id, confirms it matches the current
    # worktree branch (the consistency check this skill's own preamble text
    # above already asserts), snapshots the node from origin/main, gates on
    # phase, and — with `--pr-mode optional` — resolves the open PR if one
    # exists (a missing PR is the first-run case, never an error, so this
    # skill needs no exit-4 handling).
    NODE_ID="$BRANCH"
    if DERIVED=$(.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target \
        "$NODE_ID" --expect-phase implement --pr-mode optional); then
      rc=0
    else
      rc=$?
    fi
    if [ "$rc" -ne 0 ]; then
      case "$rc" in
        1) echo "/implement: node '$NODE_ID' not found at origin/main (intentions/$NODE_ID.md)" >&2; exit 1 ;;
        2) echo "/implement: '$NODE_ID' is not a valid node id, or does not match the current worktree branch" >&2; exit 1 ;;
        3)
          # The mechanical selection gate rejected the selection (phase/interrupt
          # mismatch, office_hours park, stale serving-strategy fingerprint, no
          # longer align-eligible, or an already-reviewed node re-selected). This
          # is a stale selection, not a defect. End the session; make no graph
          # write and open no PR.
          echo "/implement: node '$NODE_ID' selection no longer valid at origin/main (front door exit 3) — stale selection, not a defect; ending with no graph write and no PR" >&2
          exit 0 ;;
        5)
          # Scope changed since the previous phase ran — the node wants demoting
          # to implement, not a defect. End the session; make no graph write and
          # open no PR.
          echo "/implement: node '$NODE_ID' is scope-stale at origin/main (front door exit 5) — wants demoting to implement, not a defect; ending with no graph write and no PR" >&2
          exit 0 ;;
        *) echo "/implement: dispatch-derive-node-target failed (exit $rc)" >&2; exit 1 ;;
      esac
    fi
    # Parse the front door's stdout: PR line (<num>|none), NODE-JSON section
    # (compact single-line frontmatter JSON), NODE-BODY section (raw markdown).
    PR_NUM=$(printf '%s\n' "$DERIVED" | sed -n 's/^PR: //p' | head -1)
    [ "$PR_NUM" = none ] && PR_NUM=""
    NODE_JSON=$(printf '%s\n' "$DERIVED" | sed -n '/^=== NODE-JSON ===$/,/^=== NODE-BODY ===$/p' | sed '1d;$d')
    NODE_BODY=$(printf '%s\n' "$DERIVED" | sed -n '/^=== NODE-BODY ===$/,$p' | sed '1d')
    N="$NODE_ID"
    TARGET_KIND=node
    ;;
esac
```

`$N` keys the remaining steps' `tmp/` filenames (the issue number on the legacy
lane, the node id on the node lane). `$TARGET_KIND` selects the lane at every
seam below that differs between issue and node targets — context source, plan
source, and completion. **On the node lane no gh issue is ever read or written.**

### Node-target lane (`TARGET_KIND=node`)

On the node lane the four issue-keyed seams below are re-keyed to the graph
(`tactic-phase-skill-node-targets`); every other step runs byte-identically.

- **Context / PR.** Skip the issue-comment slices entirely; never pass `--issue`.
  The node's `execution.pr` is null until this phase's completion writes it (see
  Completion below), so it is NOT a reliable resume-detection signal — a crash
  between opening the PR (Step 4) and the completion transition-node write
  (Step 5) leaves `execution.pr` null even though a PR now exists. The front
  door resolves the PR instead — `dispatch-derive-node-target --pr-mode
  optional` runs the same `gh pr list --head "$BRANCH" --state open` lookup
  `dispatch-sweep` and `/office-hours` use, and binds the result to `PR_NUM`
  (empty on a first run, never an error).
- **Plan source.** The plan is the **node body** of `intentions/<node-id>.md`
  at `origin/main` (already bound by the front door as `$NODE_BODY`), not a
  `<!-- dispatch:plan -->` issue comment. Its ordered `## Unit N` sections with
  their `Recommended model:` tags ARE the unit breakdown Step 2 builds.
- **Completion.** Do not call `dispatch-complete-phase` / `dispatch-mark-complete`
  / `dispatch-finalize-phase` — those edit issue/PR labels. After the draft PR is
  open, invoke the graph-native transition writer instead (it consults the CI
  verdict + freshness gates and lands the `implement → qa` advance, or the
  `implement → fix` interrupt on red CI, plus `execution.pr`, as one state-only
  graph-commit on `origin/main`):

  ```bash
  .claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"
  ```

  The graph-tick worker runs this with the reset-dance a PR-branch worktree needs
  (same constraint as `park-node`); the skill hands it the node id and never
  writes the graph directly.
- **Escalation.** Instead of applying `dispatch:office-hours`, write the
  human-facing reason to `$CLAUDE_JOB_DIR/office-hours-reason` (and the
  best-next-steps to `$CLAUDE_JOB_DIR/office-hours-recommendation`);
  `dispatch-tick`'s `terminal_without_disposition_sweep` parks the node via
  `park-node` (`office_hours` graph write) — see
  `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`. Also write the already-bound `PR_NUM` to
  `$CLAUDE_JOB_DIR/office-hours-pr` (same atomic tempfile+`mv` write as the
  reason/recommendation files) so the park records `execution.pr`
  (tactic-office-hours-pr-custody); skip this write when `PR_NUM` is empty
  (e.g. escalating before Step 4 has opened a PR yet).

Then fetch any prior PR/phase-log context (use `dangerouslyDisableSandbox:
true` — the context pack hits `gh`).

**Node lane (`TARGET_KIND=node`):** the legacy `<N>-…` branch-prefix PR lookup
below does not apply — the branch IS the node id, not an issue-prefixed name.
`PR_NUM` is already bound by the front door (the derivation script's
`--pr-mode optional` ran the `gh pr list --head "$N"` lookup); do not
re-resolve it here.

Empty `PR_NUM` means no PR exists yet (first run) — skip the context-pack call
below entirely (there is nothing to read: no PR, and no phase-log home without
one) and run all steps. A non-empty `PR_NUM` is the re-entry branch — fetch its
PR/phase-log via the pack's PR-number mode:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$PR_NUM" --pr --phase-log --pr-is-number
```

Read the `=== PR ===` and `=== PHASE-LOG #$PR_NUM ===` sections as described
below (the re-entry / `PRIOR_PHASE_LOG` handling is identical to the legacy
lane once `PR_NUM` is known).

**Legacy lane (`TARGET_KIND=issue`):** run the context pack directly with the
issue number. Add `--phase-log` so the same call also returns any prior
cross-phase handoff note:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --pr --phase-log
```

Read the `=== PR ===` section of the output. **CRITICAL: detect no-PR by the
`PR: none` line, NOT by exit code — the pack exits 0 in both cases.** If the
output contains `PR: none`, no PR exists yet — run all steps. If it contains
`PR #<num>`, capture that number as `PR_NUM`.

Read the `=== PHASE-LOG #N ===` section into `PRIOR_PHASE_LOG` — the handoff note
a prior attempt or earlier phase left. Treat the sentinel `phase-log: none` as
empty. When non-empty, feed it into the Step 2 unit-build context so a rebuild or
re-plan sees why a prior attempt diverged. An absent note leaves Step 2 unchanged.

If a PR already exists, the build + PR already happened: this is the **re-entry
branch**. Capture its number as `PR_NUM`, **skip Steps 1–4**, and go straight to
Step 5 — on re-entry only the **marker** write runs; the Step 5 **phase-log write
is skipped** (this covers a same-tick crash between PR-open and marker-write).
Note that the preamble took the re-entry branch (a PR already existed at entry) —
Step 5 keys its phase-log gate on this. If no PR exists, run all steps (the
preamble did NOT take the re-entry branch). (`dispatch-route` normally routes a
PR-bearing issue to fix-checks/qa/review, not implement, so this is a same-tick
crash-recovery edge.)

**Open-blocker re-check (non-re-entry path only).** When the preamble finds
`PR: none` — i.e. this is a fresh run, not a crash recovery — verify that the
target issue has no open blockers before beginning any build work. This catches
the race window between the queue-gate check (in `/dispatch-propagate`) and now.
Skip this check on the re-entry branch (`PR #<num>` already exists): the build
already happened and passed this gate on first run; re-checking would needlessly
re-park a same-tick crash recovery.

Run with `dangerouslyDisableSandbox: true` — `dispatch-check-blockers` calls
`gh` (see `.claude/rules/sandbox.md`). Tolerant capture:

```bash
if out=$(.claude/skills/dispatch-propagate/scripts/dispatch-check-blockers "$N"); then
  rc=0
else
  rc=$?
fi
```

Route on `rc`:

- **`rc == 0`** — no open blocker. Proceed unchanged.
- **`rc == 2`** — `$out` is `blocked:<nums>`. Real open blocker found. Call
  `dispatch-mark-deviation`, then stop (skip the Step 5 completion marker).
  Marker absence triggers Stop hook Branch A (`dispatch:office-hours`).
  `dispatch-mark-deviation` is already one of `/implement`'s two single-named-exit
  terminal actions, so the single-named-exit invariant in `## Steps` still holds:

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
    "/implement: target #$N has an open blocker ($out) - raced past the queue gate; parking"
  ```

- **`rc == 1`** (or any other non-zero) — environment error; blockers unverified.
  Not "no blockers." Call `dispatch-mark-deviation` with a distinct reason
  including `$rc`, then stop (skip the Step 5 completion marker). Never proceed
  on `rc == 1`:

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
    "/implement: could not verify open blockers for #$N (dispatch-check-blockers exit $rc)"
  ```

## Steps

**Single named exit.** Take exactly one terminal action to end the turn: the
final action is a call to `dispatch-mark-complete` (no deviation) or
`dispatch-mark-deviation` (deviation). This is the single named exit.

Whenever the terminal action is a deliberate office-hours park
(`dispatch-mark-deviation`), perform the in-session recommend step BEFORE that
call — see `.claude/skills/dispatch-propagate/escalation-recommend.md`. This
applies to every `dispatch-mark-deviation` site in this skill.

- Any OTHER most-recent tool call — a unit finishing in Step 2, a verification
  run in Step 3, the draft PR opening in Step 4 — means the orchestrator is
  mid-loop, not done.
- Mid-loop, the next message contains the next tool call, never a closing
  summary. Do not end the turn until the named exit fires.

### 1. Read the plan

Read the persisted plan from the issue's `<!-- dispatch:plan -->` comment. Invoke
and capture stdout (use `dangerouslyDisableSandbox: true` — it calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-read-plan <N>
```

The printed body is the ordered unit breakdown (scope + per-unit model +
dependencies) that drives Step 2.

Exit codes:
- **exit 1** — no `<!-- dispatch:plan -->` comment on the issue. This
  should-never-happen for a `dispatch:planned` issue. Escalate via
  `dispatch-mark-deviation` (skip the `phase-completed` marker) and stop.
- **exit 2** — non-numeric arg.

### 2. Build each unit

Before building, create a tracked task list with the harness `TaskCreate` tool:

- one task per planned unit from the Step 1 plan,
- one task for "execute the plan's verification" (Step 3),
- one task for "open the draft PR" (Step 4),
- one task for "write the completion marker" (Step 5).

Mark each task completed via the harness `TaskUpdate` tool as it lands. This
keeps the remaining work durable and visible rather than held in the model's
head, reinforcing the single-named-exit invariant: the turn ends only when every
task — including the marker — is completed.

**Resume from committed units (condition 9).** Commits beyond the branch base
(`git merge-base HEAD origin/main`) are completed units: a resumed build in the
same worktree continues from the first uncommitted unit and never re-implements
a committed one. The re-entry branch (§ above), the durable task-list block, and
the per-unit commit convention are already stated — this is their consequence,
not a new mechanism.

For each unit in the plan read in Step 1, in dependency order, invoke
`/implement-unit` via the Skill tool, passing:

- `model` — the unit's planned model.
- `scope` — the unit's scope.
- `context` — the plan and issue context the unit needs. When `PRIOR_PHASE_LOG`
  (from the preamble) is non-empty, include it here so a rebuild or re-plan sees
  why a prior attempt diverged.
- `commit_intent` — the "why" of this unit's change.

`/implement-unit` launches the implementation subagent, forks `/commit-merge-push`,
and recovers from merge / pre-commit / push errors. This is a normal in-session loop
— **do not clear context between units**. The model is chosen per the
model-selection heuristic in `/implement-unit` — see that skill for the heuristic
(it is the canonical home; do not restate it here).

### 3. Execute the plan's Verification section

After every unit is built, run the plan's auto-runnable checks. The runner reads
the full plan markdown on stdin and routes on its exit code (use
`dangerouslyDisableSandbox: true` — `dispatch-read-plan` calls `gh`). The
runner's own exit-4 check (empty/absent stdin) is the PRIMARY guard against an
upstream `dispatch-read-plan` failure being masked; the `set -o pipefail` prefix
is belt-and-suspenders for the residual case where `dispatch-read-plan` fails
but `dispatch-run-verification` still exits 0 (a bare `pipefail` cannot rescue
the exit-3 mask, since the runner's exit 3 is itself non-zero):

```bash
set -o pipefail
.claude/skills/dispatch-propagate/scripts/dispatch-read-plan <N> \
  | .claude/skills/dispatch-propagate/scripts/dispatch-run-verification
```

Route on the exit code:

- **exit 3** — the plan names no ```verify checks. Proceed to Step 4 and open the
  PR unchanged. This is a clean proceed, not a swallowed error (per
  `.claude/rules/code-style.md`): the runner reports "no checks to run" by design,
  and acceptance criterion 4 requires no false block when the plan defines no
  checks.
- **exit 0** — every ```verify block passed. Proceed to Step 4 and open the PR.
- **exit 1** — a ```verify block failed; the runner reports the failing block
  index on its output. Enter the bounded fix lane: using the failing output, fix
  the defect with one corrective `/implement-unit` (via the Skill tool), then
  re-run the runner above. Cap at **2** fix attempts. This cap bounds an
  **in-session** retry loop — the runner re-run has no other termination
  condition — and is deliberately unrelated to `qa-fix`'s `CAP`, which counts
  durable, re-selected qa **passes** via the `dispatch:qa-fix-attempt-<n>` PR
  label. Different loops, different scopes; do not couple the two numbers.
  If the runner still exits 1 after the cap, do **not** open the PR:
  call `dispatch-mark-deviation` naming the failing check, then **stop** — skip
  the Step 5 completion marker.

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
    "/implement: plan verification failed after 2 fix attempts (check <index>)"
  ```

  This `dispatch-mark-deviation` is one of the two existing single-named-exit
  terminal actions — the only terminal actions remain `dispatch-mark-complete`
  (no deviation) and `dispatch-mark-deviation` (deviation) — so the single-named-exit
  invariant still holds. The Stop hook reads marker-absence as Branch A and parks
  the issue for human review.
- **exit 5** — the plan has an unclosed/malformed ```verify fence (opened inside
  the Verification section but never closed before EOF). This is a
  **plan-authoring error**, not a failing verify block — the worker cannot repair
  the plan comment, so do **not** enter the `/implement-unit` fix lane. Route
  straight to `dispatch-mark-deviation` with an accurate reason and **stop** (skip
  the Step 5 completion marker):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
    "/implement: plan verification could not run — malformed plan (unclosed verify fence)"
  ```

- **any other non-zero exit** — exit **4** (empty/absent plan input: the upstream
  `dispatch-read-plan` failed and the runner refused to emit the exit-3
  "proceed unchanged" signal), or any upstream failure surfaced via `set -o
  pipefail`. This is an environment/upstream error, **not** a verify-block
  failure — do **not** enter the `/implement-unit` fix lane. Route straight to
  `dispatch-mark-deviation` with an accurate reason and **stop** (skip the Step 5
  completion marker):

  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
    "/implement: plan verification could not run — upstream dispatch-read-plan failed or plan input was empty"
  ```

### 4. Open the draft PR

After every unit is committed and pushed, write the PR body prose to
`tmp/pr-body.md`, then open the draft PR with `dispatch-open-pr` (use
`dangerouslyDisableSandbox: true` — the script calls `gh`, which needs network):

```bash
PR_NUM=$(.claude/skills/dispatch-propagate/scripts/dispatch-open-pr \
  <primary-issue> \
  --title "<short summary>" \
  --closes "<sub-issue-or-blocker> ..." \
  --body-file tmp/pr-body.md)
```

`<primary-issue>` is the issue this PR primarily implements; `--closes` lists
any additional implemented sub-issues or blockers (whitespace- or
comma-separated, with or without a leading `#`). The script writes one
`Closes #N` line per issue, appends the prose from `--body-file` (omit the flag
to read prose from stdin), and echoes the created PR number — the only thing it
prints on stdout. This draft PR is the implement→fix-checks transition marker.

The script then verifies GitHub parsed exactly the intended close set, per
`.claude/rules/issue-references.md`: narrative prose can carry a stray closing
keyword that GitHub reads as an extra close directive. On an extra, the script
strips the stray keyword and re-applies the body (bounded retries); on a number
intended-but-missing, or an extra it cannot resolve, it exits non-zero with a
diagnostic naming the offending number. If it exits non-zero, read the
diagnostic and fix the body or `--closes` set rather than opening the PR by
hand.

### 5. Write the handoff note, check for deviation, then write the marker (or skip it), then stop

**Ordering invariant.** The phase-log write must PRECEDE the terminal action so
the terminal action stays last: `dispatch-mark-complete` (no deviation) or
`dispatch-mark-deviation` (deviation) remains the single named exit. On the normal
path, write the phase-log entry once here, before the deviation branch, so both
terminal branches (deviation and no-deviation) share it.

First write the handoff note — **only when Steps 1–4 ran this turn** (i.e. the
preamble did NOT take the re-entry branch). Compose a terse "what-changed" digest
of the implementation to `tmp/phase-log-entry-$N.md` — a one-line summary of what
shipped; on a clean as-planned build the body is a line like `failed: none`.
Compose it **unconditionally** (no "only on failure" branch) — that is the
failure-vs-success axis (always log, even a clean pass), orthogonal to the
re-entry gate below. Then upsert it into the issue's phase-log comment (use
`dangerouslyDisableSandbox: true` — the script calls `gh`):

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log \
  "$N" --phase implement --reentry false < tmp/phase-log-entry-$N.md
```

On the crash-recovery re-entry path (Steps 1–4 skipped this turn), call the
writer with `--reentry true </dev/null` — the script enforces the skip and
preserves the prior `(implement, 1)` entry verbatim (no body needed, exit 0).
**Gate on whether Steps 1–4 ran this turn, not on PR presence:** `PR_NUM` is set
on both paths at Step 5 (the normal path created it in Step 4; re-entry captured
it in the preamble), so a `[ -n "$PR_NUM" ]` gate would skip the write ALWAYS and
break the normal path.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log \
  "$N" --phase implement --reentry true </dev/null
```

No attempt counter — implement is single-pass, so the default `--attempt 1`
applies. On re-entry there is no fresh outcome data: recomposing the digest from
this turn's limited context would OVERWRITE the prior attempt's accurate entry
with a thinner restatement. The script enforces the skip via `--reentry true` —
the prior entry, if any, is already correct and durable; if the original pass
crashed before writing one, skipping still yields an honest absence — never
fabricate content now. This skip-preserves-verbatim behavior is covered by the
behavioral test `.claude/skills/dispatch-propagate/scripts/test-phase-log-reentry.sh`.

Judge whether the implementation deviated from the
persisted plan — scope shifted mid-implementation, or the plan could not be
fully implemented as written. Base this on the `/implement-unit` outcomes
observed in Step 2. On the re-entry path (Steps 1–4 were skipped this pass),
no `/implement-unit` outcomes were observed — treat deviation as false and
proceed to `dispatch-mark-complete`.

**Deviation fires** — skip the `phase-completed` marker. Instead call
`dispatch-mark-deviation` to write the office-hours-reason atomically. If Step 4
already opened a draft PR, it stays open. The Stop hook reads marker-absence as Branch A,
applies `dispatch:office-hours` to the issue (surfacing this reason in the
why-comment), and parks the issue for human review.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
  "/implement: implementation deviated from the persisted plan"
```

Use the default phrasing above, or make it more specific when the nature of
the shift is clear (e.g. `/implement: unit 3 scope expanded to cover
auth; persisted plan did not include auth changes`).

**No deviation** — call `dispatch-mark-complete` as the final action.
`CLAUDE_JOB_DIR` unset = interactive run; the script no-ops with a clear
diagnostic.

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
  --phase implement --pr "$PR_NUM"
```

Stop. The Stop hook reads the marker, spawns the next `/dispatch-propagate`
router, strips `dispatch:office-hours` if present, and self-closes this job.

## Requirement changes mid-session

If the user revises a requirement during this session, invoke `/new-requirement` —
it clarifies, updates remote issues, and revises this plan. Do not handle the
revision inline.
