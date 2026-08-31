---
name: fix-checks
description: Fix-checks phase — single pass that reproduces and fixes one set of failed CI checks on a draft PR
---

# Fix Checks

The `fix-checks` phase of the issue workflow, dispatched by `/dispatch-propagate` only when a
draft PR has **completed-and-failed** CI. This skill is **single-pass — it has no
internal loop**. It fixes one round of failed checks, records the outcome, posts it,
and stops. The `/dispatch-propagate` background-job chain drives iteration: each subsequent
failure is a fresh `/dispatch-propagate` → `/fix-checks` invocation.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
launch subagents and invoke `/implement-unit`.

Cross-iteration memory lives entirely in `tmp/fix-checks-summary.md` (see
[Accumulator](#accumulator) below), not in conversation context.

## Parameters

| Parameter | Meaning |
|---|---|
| `node_id` | The graph-native node id this run targets (node lane) — equals the worktree branch name. On the legacy issue lane there is no node id; the target is the `<N>-…` issue-prefixed branch instead. |
| `pr_num` | The open draft PR number. Required — fix-checks never runs without an open PR. Resolved by the front door (Target resolution below) via `--pr-mode required`, not passed in by the caller. |

## Steps

**Resume from durable state (condition 9).** This is a single-pass phase, so its
mid-phase durable home is the **worktree-local accumulator file**
`tmp/fix-checks-summary.md`, which persists for the worktree's life (Step 8's
post is only the terminal flush — see [Accumulator](#accumulator)). A re-selected
worker rooting in the same worktree treats these as resume input, never an error:
the accumulator file's prior iterations, the `dispatch:fix-checks-attempt-<n>`
attempt counter on the PR (Step 5), and the "main already fixed it" merge-commit
reuse (Step 4) are all durable and carry forward — read them and continue rather
than restarting the pass.

**Target resolution — keyspace split.** The current worktree dictates the
target. Split on its name before Step 1: `[0-9]*-*` is a legacy issue worktree
(unchanged); anything else is a graph-native node id. On the node lane the
shared front-door script `dispatch-derive-node-target` does the whole
derivation: it snapshots `intentions/<id>.md` from `origin/main`, reads it via
the store primitives, gates on an **active CI-fix interrupt** with
`--expect-fix-active` (require `execution.fix != null`), and resolves the open
PR with `--pr-mode required`. Note `phase` is NOT `fix`: a CI-fix interrupt is
carried orthogonally on `execution.fix`, leaving `phase` at its real ladder
position (implement/qa/review), which is exactly why the gate is
`--expect-fix-active` (reads `execution.fix`) and never `--expect-phase fix`
(no node is ever persisted at phase `fix`).

```bash
BRANCH=$(basename "$(git rev-parse --show-toplevel)")
case "$BRANCH" in
  [0-9]*-*)
    N="${BRANCH%%-*}"; TARGET_KIND=issue ;;
  *)
    NODE_ID="$BRANCH"
    # Shared front door: derive + gate + resolve PR in one call. The branch IS
    # the node id on this lane. --expect-fix-active gates on execution.fix != null
    # (the CI-fix interrupt marker); --pr-mode required resolves the open PR.
    # Capture the status on its own line: `if ! cmd; then rc=$?` would read the
    # negated condition status (always 0), collapsing every branch of the case
    # below onto the `*)` arm and making the exit-4 escalation unreachable.
    DERIVE_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target \
      "$NODE_ID" --expect-fix-active --pr-mode required 2>&1)
    DERIVE_RC=$?
    if [ "$DERIVE_RC" -ne 0 ]; then
      case "$DERIVE_RC" in
        4)
          # --pr-mode required found no open PR. fix-checks never runs without an
          # open PR, so this is real — but it is NOT a plain error like the
          # others: it routes to office-hours (never dispatch-mark-deviation,
          # which is issue-only). Print a distinct sentinel and stop this bash;
          # the model then performs the escalation described right below the code
          # block (recommend step + $CLAUDE_JOB_DIR/office-hours-reason write).
          echo "ESCALATE-NO-PR: /fix-checks node '$NODE_ID' has no open PR — escalate to office-hours" >&2
          exit 1 ;;
        3)
          # The mechanical selection gate rejected the selection (phase/interrupt
          # mismatch, office_hours park, stale serving-strategy fingerprint, no
          # longer align-eligible, or an already-reviewed node re-selected). This
          # is a stale selection, not a defect. End the session; make no graph
          # write and open no PR.
          echo "/fix-checks: node '$NODE_ID' selection no longer valid at origin/main (front door exit 3) — stale selection, not a defect; ending with no graph write and no PR" >&2
          exit 0 ;;
        5)
          # Scope changed since the previous phase ran — the node wants demoting
          # to implement, not a defect. End the session; make no graph write and
          # open no PR.
          echo "/fix-checks: node '$NODE_ID' is scope-stale at origin/main (front door exit 5) — wants demoting to implement, not a defect; ending with no graph write and no PR" >&2
          exit 0 ;;
        *)
          # exit 1 (node not found / read failure), exit 2 (branch mismatch /
          # bad node id): real errors for this lane. Stop with a clear message.
          echo "/fix-checks: '$BRANCH' is not an actionable fix-checks node target: $DERIVE_OUT" >&2
          exit 1 ;;
      esac
    fi
    # Parse the front door's stdout. PR: line (`none` -> empty PR_NUM), the
    # NODE-JSON section, and the NODE-BODY section.
    PR_NUM=$(printf '%s\n' "$DERIVE_OUT" | sed -n 's/^PR: //p'); [ "$PR_NUM" = none ] && PR_NUM=""
    NODE_JSON=$(printf '%s\n' "$DERIVE_OUT" | sed -n '/^=== NODE-JSON ===$/{n;p}')
    NODE_BODY=$(printf '%s\n' "$DERIVE_OUT" | sed -n '/^=== NODE-BODY ===$/,$p' | tail -n +2)
    N="$NODE_ID"; TARGET_KIND=node ;;
esac
```

**Exit-4 escalation (no open PR).** When the front door prints the
`ESCALATE-NO-PR` sentinel and exits, do **not** proceed to Step 1 and do **not**
treat it as the generic hard error the other exit codes take. fix-checks never
runs without an open PR, so this is a deliberate office-hours park. Perform the
in-session recommend step first — see
`.claude/skills/dispatch-propagate/escalation-recommend.md`, writing the
best-next-steps markdown to `$CLAUDE_JOB_DIR/office-hours-recommendation` (node
lane — no gh issue, so no `dispatch-write-recommendation` comment) — then write
the park reason to `$CLAUDE_JOB_DIR/office-hours-reason` and **stop**.
`dispatch-tick`'s `terminal_without_disposition_sweep` (in
`.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh`) reads
those files on a later tick and parks the node via `park-node`. Never call
`dispatch-mark-deviation` here (issue-only) and never
write a gh label; on the node lane no gh issue is ever read or written. This is
the same `office-hours-reason` seam the Escalation note below documents.

**Node-target lane (`TARGET_KIND=node`).** Every step runs unchanged except
that `PR_NUM` is already bound by the front door above (its `--pr-mode required`
resolution of the open PR) — no separate branch-head lookup happens. Because the
branch IS the node id, not an issue-prefixed name, the issue-keyed
branch-prefix lookup `dispatch-find-pr` performs does not apply — use
`dispatch-context-pack`'s `--pr-is-number` flag with the already-bound `PR_NUM`
instead (see Step 1 below), and never pass `--issue`. The front door's
`--pr-mode required` already guaranteed a non-empty `PR_NUM`; had none existed,
the exit-4 escalation above would have parked the node on office-hours.

If `.claude/ancestry-context.md` is present in the worktree, read it before
resolving any plan-under-determined judgment call — it is the bounded ancestry
projection (parent chain + served strategies up to virtue roots) for this
node.

This projection is read-only decision context for in-scope, plan-under-determined
judgment calls; the node body remains the sole work contract (a plan that assumes
the projection exists is still an incomplete record), and a perceived plan-vs-ancestry
conflict parks to `office_hours` with a recommendation — never self-expanded or
self-reduced scope.

**Node-lane completion — the fix worker does NOT resolve the interrupt.** The
selector, not this worker, owns clearing `execution.fix` (it decides when CI has
gone green on the pushed sha, on a LATER tick). This worker's completion duty is
to RECORD what this iteration did and stop: **every** outcome that reaches this
seam SPENDS one attempt unit (`apply-fix-state --spend-attempt`), and push
outcomes additionally record the pushed sha (`apply-fix-state --record-push`).
The spend has to happen here, at the worker's completion seam, rather than on
the selector: the selector cannot distinguish a still-running fix worker from a
completed no-repro pass — both look identical from outside (no new sha, no
marker) — so counting an attempt can only happen once, at the point a pass
actually completes.

- **If this iteration pushed a commit** (a real fix, or the Step 4
  "main-already-fixed-it" merge-commit push): spend the attempt, then record the
  pushed sha onto the active interrupt via `apply-fix-state --record-push`, then
  land both state-only writes on `origin/main` in **one** `graph-commit`.
  Recording the sha arms the selector's pending-CI guard, so a pending verdict on
  this exact sha is never misread as a green resolution. Run this from the
  PR-branch worktree with the reset-dance `graph-commit` needs there (same as
  `/implement`'s node-lane completion did with `transition-node`):

  ```bash
  HEAD_SHA=$(git rev-parse HEAD)
  if ! git fetch origin main >&2; then
    echo "fix-checks: could not fetch origin/main to refresh $N before recording push" >&2
    exit 1
  fi
  if ! FRESH_BLOB="$(git rev-parse "origin/main:intentions/$N.md" 2>/dev/null)"; then
    echo "fix-checks: intentions/$N.md does not exist on origin/main — cannot refresh a node that is not landed" >&2
    exit 1
  fi
  if ! git show "origin/main:intentions/$N.md" > "intentions/$N.md"; then
    echo "fix-checks: could not refresh intentions/$N.md from origin/main" >&2
    exit 1
  fi
  node --import tsx/esm packages/intentionsutil/scripts/apply-fix-state.ts \
    "$N" --spend-attempt
  node --import tsx/esm packages/intentionsutil/scripts/apply-fix-state.ts \
    "$N" --record-push "$HEAD_SHA"
  packages/intentionsutil/scripts/graph-commit \
    --base "$N=$FRESH_BLOB" \
    -m "graph: record fix attempt + push $HEAD_SHA on $N" "$N"
  ```

- **If this iteration pushed NOTHING** (the generic-no-repro / flake outcomes
  Step 4 documents as pushing nothing): this is no longer a no-write outcome —
  spend the attempt and land it with `graph-commit`. There is no new sha to
  record, but the pass still consumed one retry, so it must be counted or the
  selector's 3-attempt cap can never trigger for the recurring generic-no-repro
  / flake loops:

  ```bash
  if ! git fetch origin main >&2; then
    echo "fix-checks: could not fetch origin/main to refresh $N before recording the attempt" >&2
    exit 1
  fi
  if ! FRESH_BLOB="$(git rev-parse "origin/main:intentions/$N.md" 2>/dev/null)"; then
    echo "fix-checks: intentions/$N.md does not exist on origin/main — cannot refresh a node that is not landed" >&2
    exit 1
  fi
  if ! git show "origin/main:intentions/$N.md" > "intentions/$N.md"; then
    echo "fix-checks: could not refresh intentions/$N.md from origin/main" >&2
    exit 1
  fi
  node --import tsx/esm packages/intentionsutil/scripts/apply-fix-state.ts \
    "$N" --spend-attempt
  packages/intentionsutil/scripts/graph-commit \
    --base "$N=$FRESH_BLOB" \
    -m "graph: record fix attempt (no push) on $N" "$N"
  ```

  The interrupt otherwise stays exactly as it was; the selector re-launches
  `/fix-checks` next tick (or the flake path files its own issue and the node is
  no longer re-routed to fix — see Step 4), unless this spend now trips the
  3-attempt cap, in which case the selector lands a tracked hold instead (a
  born-parked hold tactic plus a `blocked_by` edge on this node, via
  `packages/intentionsutil/scripts/hold-node` — this node's own `office_hours`
  is never written).

Do NOT call `transition-node` here: after the CI-blind redesign it no longer
knows about `fix` and would force the ladder forward regardless of whether the
fix actually worked. Do NOT clear `execution.fix`, reset `phase`, or write any
completion marker — those are the selector's on a later green tick. The Stop hook
needs nothing from this seam for a clean pass; an escalation hold is landed by
`dispatch-tick`'s `terminal_without_disposition_sweep`, not the Stop hook. Chain
continuation is carried by the systemd heartbeat and the tick's convergence
reseed.

**Disarm auto-merge on every push.** Whenever this worker pushes ANY commit (a
fix or the main-already-fixed-it merge), disarm auto-merge immediately as a
safety action — a past-review node may still carry a stale merge-arm from before
the regression, and the newly pushed code must not merge before it is re-reviewed
(the selector applies the re-review reset when it later resolves the interrupt):

```bash
gh pr ready --undo "$PR_NUM"   # idempotent no-op when the PR was not merge-armed
```

Escalation writes `$CLAUDE_JOB_DIR/office-hours-reason` (+
`office-hours-recommendation`) for `dispatch-tick`'s
`terminal_without_disposition_sweep` to `park-node`, never a gh label.
Also write the already-bound `PR_NUM` to `$CLAUDE_JOB_DIR/office-hours-pr` (same
atomic tempfile+`mv` write) so the park records `execution.pr`
(tactic-office-hours-pr-custody).
**On the node lane no gh issue is ever read or written.**

1. **Resolve the draft PR.** Run the context pack (`dangerouslyDisableSandbox:
   true` — calls `gh`). **Legacy lane** (`TARGET_KIND=issue`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$N" --pr
   ```

   **Node lane** (`TARGET_KIND=node`): `PR_NUM` is already bound by the front
   door (Target resolution above resolved it via `--pr-mode required`) — no
   separate branch-head lookup is needed. Go straight to fetching the PR by that
   already-bound number (never pass `--issue`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-context-pack "$PR_NUM" --pr --pr-is-number
   ```

   This single call resolves the PR and captures its labels and body. From the
   `=== PR ===` section: read `PR_NUM` from the `PR #<num>` line. **Legacy
   lane:** if it prints `PR: none`, fix-checks was dispatched without a PR — a
   router state error — so call `dispatch-mark-deviation '/fix-checks:
   dispatched without a PR — router state error'` and stop. **Node lane:**
   `PR: none` cannot occur here (Target resolution already required a
   non-empty `PR_NUM` before this call); a pack failure here is a genuine `gh`
   error — escalate via `office-hours-reason` per the Escalation note above and
   stop, never `dispatch-mark-deviation` (issue-only). The **labels** line and **body** captured
   here are reused in later steps — Step 4's Flake sub-path reads the PR body for
   the `Closes #N` parse, and Step 5's attempt-counter computation reads the labels
   line — so they need not be re-fetched from GitHub. The `PR_NUM` resolved here is
   used in Steps 3, 5 (the fix-checks-attempt label edit), and 8 — carry it
   forward.

2. **Read the accumulator.** Read `tmp/fix-checks-summary.md` if it exists — it holds the
   prior iterations' records. On the first fix-checks pass the file does not yet exist;
   that is expected.

3. **Read the failed checks.** Run (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/run-pr-checks-wait.sh <pr-num>
   ```

   The checks have already concluded — `/dispatch-propagate` only routes a PR here once CI is
   complete-and-failed — so this returns immediately with a per-check summary:
   name, conclusion, and a failure-log excerpt for each failing check.

   Count the failing check names in this summary as `$FAILED_CHECK_COUNT` — this
   pass's outcome-envelope emit (Step 9, and the needs-human escalation inside
   Step 4) reuses it for `--findings-surfaced` / `--findings-actionable`, so it
   need not be recomputed later.

4. **Reproduce locally and classify.** Launch a `sonnet` subagent with the failing
   check name and failure excerpt. This is the pass's first subagent launch —
   start a running count `$SKILL_SUBAGENTS=1` here; the outcome-envelope emit
   (Step 9, and the needs-human escalation below) reports it as
   `--subagents-launched`, incremented below wherever a later step launches
   another. The subagent maps the check to a local reproduce
   command and runs it (use `dangerouslyDisableSandbox: true` when network or npm
   cache is needed):

   - Unit test check → `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh`
   - Lint check → `.claude/skills/dispatch-propagate/scripts/run-lint.sh`
   - Acceptance test check → `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh`
   - Type-check → `npx tsc --noEmit --project <pkg>`
   - Other → best-effort map from the failing workflow name

   Before running a **bare** `npx tsc` / `npm run build` reproduce command (the type-check path or any *Other* path that resolves to a bare workspace build rather than a `run-*.sh` wrapper), `Read .claude/docs/build.md` for the workspace-build conventions: `npm ci` at the workspace root (never `npm install --prefix <pkg>`, which fails E404 on `@commons-systems/*`), and the `This is not the tsc command you are looking for` stub symptom that means deps were not installed. The `run-*.sh` wrapper paths are already `ensure_deps`-protected and need no read.

   The subagent returns `{ reproduced: bool, reproduce_command, failure_excerpt,
   why_not_caught, is_flake: bool, needs_human: bool, required_action: string }`.
   `why_not_caught` is a free-text diagnosis (missing test, disabled rule, skipped
   hook, env drift, flake, etc.) — human-readable context, not a structured branch
   key. `is_flake` and `needs_human` are the **structured branch keys** — never
   string-matched from `why_not_caught`:

   - `is_flake` is set `true` only when the subagent diagnoses the failure as a
     **flake** — a non-deterministic failure unrelated to the PR's own changes (a
     pre-existing flaky test, a CI-infrastructure hiccup, an upstream timing race).
   - `needs_human` is set `true` only when the subagent diagnoses a **real failure
     unfixable in code** — a deploy/infra/permissions error where no code change
     resolves it (secret/IAM/SA; canonical case a deploy-time GCP Secret Manager
     403 on a renamed secret). `required_action` then names what an owner must do
     (provision the secret, grant the deploy SA access, etc.).

   The branch logic reads these structured keys; it never string-matches
   `why_not_caught`.

   **If the failure does NOT reproduce** (`reproduced == false`), there are four
   mutually exclusive outcomes, in this precedence: `needs_human` → `is_flake` →
   **Main already fixed it** → **Generic no-repro**. Never push a speculative fix —
   an unverified fix is still never pushed.

   - **Needs human / infra** — `needs_human == true`: the failure is real but cannot
     be fixed in code (a deploy/infra/permissions blocker — e.g. a GCP Secret Manager
     403 on a renamed secret). This outcome is **terminal here** and **never touches
     the fix-checks-attempt counter** — retrying fix-checks is pointless, so a human must be
     reached on the **first** run. Push nothing. Do these inline and stop:

     1. **Append the accumulator record** with outcome `needs-human` and a **Required
        action** field naming `required_action` (see [Accumulator](#accumulator)).
     2. **Post the accumulator** — the same `post-pr-comment.sh` command as Step 8:

        ```bash
        .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh <pr-num> tmp/fix-checks-summary.md
        ```

     3. **Write `office-hours-reason`** via `dispatch-mark-deviation`. This is a
        deliberate office-hours park: before the call, perform the in-session
        recommend step — see
        `.claude/skills/dispatch-propagate/escalation-recommend.md`. Name the
        branch in the reason string — `needs-human` — so the outcome-envelope
        emit below can reuse the identical string as `--terminated-reason` and an
        escalation this way is never indistinguishable from a session that
        simply vanished mid-pass:

        ```bash
        .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
          "/fix-checks: needs-human — <required_action>"
        ```

     4. **Emit the outcome envelope** (contract:
        `.claude/docs/outcome-envelope.md`). This is the needs-human branch's
        only emit — it is terminal here, so no separate Step 9 emit follows (the
        next sub-step skips Step 9 entirely). This call runs **sandboxed** —
        `dispatch-emit-outcome` is pure, so do **not** pass
        `dangerouslyDisableSandbox`. Pass `--disposition escalated` and
        `--terminated-reason` set to the **same** string passed to
        `dispatch-mark-deviation` just above. Derive `repo` from the local
        remote (read-only git, sandbox-safe). On the node lane
        (`TARGET_KIND=node`) pass `--node-id "$N"` and omit `--issue`; on the
        legacy issue lane (`TARGET_KIND=issue`) keep `--issue "$N"` and omit
        `--node-id`:

        ```bash
        REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
        if [[ "$TARGET_KIND" == node ]]; then
          id_arg=(--node-id "$N")
        else
          id_arg=(--issue "$N")
        fi
        # tool_denials / denied_commands are always in the record and are DERIVED by
        # the script from this session's transcript — pass no flag for them.
        .claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome \
          --phase fix-checks --repo "$REPO" "${id_arg[@]}" --pr "$PR_NUM" \
          --findings-surfaced "$FAILED_CHECK_COUNT" \
          --findings-actionable "$FAILED_CHECK_COUNT" \
          --fixes-applied 0 \
          --followups-filed 0 \
          --subagents-launched "$SKILL_SUBAGENTS" \
          --disposition escalated \
          --terminated-reason "/fix-checks: needs-human — <required_action>"
        ```

     5. **Do NOT write the `phase=fix-checks` marker** (do not run Step 9).
     6. **Stop.** With the marker absent and `office-hours-reason` present, the Stop
        hook (`.claude/hooks/dispatch-stop.sh`) takes **Branch A** and parks the issue
        on `dispatch:office-hours` on the **first** fix-checks run — no fix-checks-attempt
        cycling, no re-diagnosis. This is the same skip-marker + `office-hours-reason`
        pattern the other phase skills use for a known human-required outcome.

     Every **other** outcome continues to Step 5.

   - **Generic no-repro** — `is_flake == false`, `needs_human == false`, and the
     failure simply does not reproduce, with no identified cause. Record it in the
     accumulator (Step 7), post the accumulator (Step 8), and stop. Push nothing.
   - **Main already fixed it** — `is_flake == false`, `needs_human == false`, and the
     `why_not_caught` diagnosis is that `origin/main` (merged into this worktree by
     the router before spawning this worker) already resolved the failure. Record it
     in the accumulator (Step 7), post the accumulator (Step 8), and then push that
     merge commit **alone** — no fix — so CI re-runs against the merged state.
     What gets pushed is the already-completed, deterministic merge of `main`,
     not a fix. Without this push the stale failed CI keeps routing
     `/dispatch-propagate` back to the `fix-checks` phase forever. The router's
     pre-spawn `dispatch-merge-main` always produces a clean merge — a conflict
     would have aborted the spawn — so the merge commit already exists locally;
     just push it (`git push` runs sandboxed — see `.claude/rules/sandbox.md`):

     ```bash
     git push origin HEAD
     ```

     **Node lane:** this counts as a push — after it, disarm auto-merge
     (`gh pr ready --undo "$PR_NUM"`) and record the pushed sha per the node-lane
     completion seam above (`apply-fix-state --record-push` + `graph-commit`).

   - **Flake** — `is_flake == true`: the failure is an upstream flaky test or a
     CI-infrastructure hiccup, unrelated to this PR's own changes. Re-running
     `/fix-checks` would only re-reach this same outcome, so instead file the flake
     as its own tracking issue and block the PR's tracked issue on it. Push
     nothing — there is no fix to this PR. Follow these sub-steps:

     1. **Capture the failing run id.** The Step 3 checks output lists, for each
        check, a GitHub Actions run URL of the form
        `https://github.com/<owner>/<repo>/actions/runs/<id>` (optionally with a
        `/job/<job-id>` suffix). Parse the URL for the **failing** check and read
        the numeric `<id>` segment immediately after `/actions/runs/` into
        `RUN_ID` — that trailing all-digits run id, not any `/job/<job-id>` that
        may follow it. This is the run whose excerpt sub-step 2 fingerprints, and
        the run id the `dispatch-flake-dedup` guard needs for its CLOSED-path
        stale-head comparison (sub-step 3); without it the guard's closed-issue
        path hard-errors.
     2. **Compute a flake fingerprint (rigid precedence — deterministic across
        runs).** The fingerprint is `<failing-check-name> — <stable-id>`, where
        `<stable-id>` is chosen by this **fixed precedence** (use the first the
        failure excerpt provides):
        1. the failing **test name / assertion label exactly as the suite prints
           it**, verbatim — a Jest/Mocha/vitest/pytest test title, a shell
           test's assertion description, or any comparable human-readable label
           the test runner itself emits. This is **not** a `file:line` pointer.
        2. **only when the excerpt contains no such label**, the failing **file
           path with NO line number** — e.g.
           `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`,
           never `…:412`. Line numbers drift whenever an unrelated edit lands
           above that line in the file, so a line-number-bearing id
           re-fingerprints the *same* failure differently across unrelated
           commits — dedup then misses and mints a second tracking node for one
           flake. That is why the `file:line` form is **disallowed**, not merely
           a different-but-acceptable spelling.
        3. **only when the excerpt provides neither** — the reachable case is a
           CI-infrastructure hiccup (Step 4's "a CI-infrastructure hiccup"
           flake diagnosis) whose log carries no runner-emitted test label and
           names no failing file — the failing **CI workflow / job name exactly
           as CI reports it**. The stable-id half then repeats the check-name
           half; that redundancy is deliberate. It makes every label-less,
           path-less failure under one check collapse to one deterministic
           fingerprint, which is strictly better than leaving the worker to
           improvise a string — improvised strings are the nondeterminism this
           precedence exists to eliminate.

        The precedence is **total**: tier 3 always applies when tiers 1 and 2
        do not, so there is never a case where `<stable-id>` is undefined and
        the worker must invent one.

        **Never** include any of these in `<stable-id>`: a **line number**, a
        **run id**, a **timestamp**, or a **PR number**. Each of them varies
        across recurrences of one defect, so including one defeats dedup by
        construction.

        Worked example (2026-07-22 incident). One assertion failure produced two
        divergent fingerprints under the old rule:
        `hook-tests — .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:22026`
        (keyed on `file:line`) and
        `hook-tests — select-tick on-main but primary checkout off-main → guard halts (exit 2)`
        (keyed on the test name) — dedup missed and two nodes were minted for one
        flake. Under this rule both collapse to the test-name form,
        `hook-tests — select-tick on-main but primary checkout off-main → guard halts (exit 2)`.
        (The quoted path is historical: `test-dispatch-scripts.sh` has since been
        split into per-SUT `test-*.sh` files — that assertion now lives in
        `test-dispatch-select-tick.sh`.)

        Read `<stable-id>` from the excerpt strictly by this precedence and
        **never paraphrase or summarize it** — the same flake must yield a
        byte-identical fingerprint string on every run, or dedup silently fails in
        production (no fixture test exercises the live fingerprint computation, so
        nothing catches a divergent string). This exact string is both (a) the
        dedup key passed to `dispatch-flake-dedup` and (b) the verbatim trailing
        token of the canonical tracking-issue title `Flaky CI: <fingerprint>`. Use
        the **same** fingerprint value for both — do not recompute it.
     3. **Find-or-file the flake issue (deterministic guard before
        `/file-issue`).** A same-fingerprint tracking issue may already exist —
        **open or closed**. Run the deterministic, state-spanning guard FIRST and
        only file fresh when it reports no match. This closes the old leak where a
        closed same-fingerprint issue read as "already resolved, so a recurrence is
        new information" and got re-filed as a duplicate.

        Sub-steps 1 and 2 above (capture `RUN_ID`, compute the fingerprint) are
        `TARGET_KIND`-agnostic and unchanged for both lanes. From here, sub-steps 3
        and 4 branch on `TARGET_KIND`.

        Whichever disposition the guard (or, on the `NONE` path, the filing
        itself) returns, record it as `$FLAKE_DISP` — the outcome-envelope emit
        (Step 9) reads it to compute `--followups-filed`: `1` only when
        `$FLAKE_DISP` is `CREATED` (a tracking record was actually minted this
        run), `0` for `EXISTING`, `REOPENED`, `STALE`, or `STALE-HEAD-SUPPRESSED`
        (nothing new was filed).

        **Legacy lane (`TARGET_KIND=issue`):** In this thread
        (`dangerouslyDisableSandbox: true` — the script calls `gh`):
        1. Write the recurrence body to `tmp/flake-recurrence.md` (git-ignored
           `tmp/`, like the accumulator): the fingerprint, the reproduce command,
           the failure excerpt, and a `recurred on PR #<pr> / run <url>` line.
        2. Run the guard, passing the fingerprint as the dedup key and the failing
           run's id captured in sub-step 1 (`$RUN_ID`):
           ```bash
           DISP=$(.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup \
             "<fingerprint>" --body-file tmp/flake-recurrence.md \
             --run-id "$RUN_ID")
           ```
           It prints exactly one line: `NONE`, `EXISTING <N>`, `REOPENED <N>`, or
           `STALE <N>`.
           Parse it into a disposition and (when present) the issue number `<N>`.
        3. Branch on the disposition:
           - **`EXISTING <N>`** — a same-fingerprint issue is already open and the
             guard appended this recurrence as a comment. Do **not** file. Flake
             issue = `#<N>`, disposition `EXISTING`. Set `$FLAKE_DISP=EXISTING`.
           - **`REOPENED <N>`** — a same-fingerprint issue was closed-as-fixed but
             the flake fired again; the guard reopened it and appended this
             recurrence (the "closed-as-fixed but still firing" signal a human
             should see on one issue, not N dups). Do **not** file. Flake issue =
             `#<N>`, disposition `REOPENED`. Set `$FLAKE_DISP=REOPENED`.
           - **`STALE <N>`** — a same-fingerprint issue was closed-as-fixed and
             the guard determined this triggering run's head does **not** contain
             the closing fix commit (ancestry shows `behind`/`diverged`): the PR
             branch is stale and is still emitting the pre-fix
             signature. The guard fired no comment and no reopen — suppressing the
             oscillation is the point. Do **not** file. Do **not** reopen. Flake
             issue = `#<N>`, disposition `STALE`. Set `$FLAKE_DISP=STALE`.
             **Skip sub-step 4 (block the
             PR's tracked issue)** — wiring a `blocked_by` dependency here is
             deferred by design: the STALE disposition stops the reopen oscillation
             only; a stale PR branch that keeps emitting the pre-fix signature is
             the upstream subagent's "main already fixed it" classification job
             (merge main), tracked separately. Record the accumulator note (sub-step
             5) marking this recurrence as suppressed-stale, then fall through
             directly to sub-step 6 (post accumulator, push nothing).
           - **`NONE`** — no same-fingerprint issue exists; file one via
             `/file-issue` as before. Launch a subagent (`subagent_type:
             general-purpose`, `model: sonnet`) that invokes `/file-issue` via the
             Skill tool — this is a second subagent launch this pass; increment
             `$SKILL_SUBAGENTS` to `2` (Step 4's diagnosis subagent was the
             first) — building its `$INPUT` with a leading `--follow-up` token
             first, then a title hint `Flaky CI: <fingerprint>` on the next line,
             then a body containing the fingerprint, the reproduce command, and the
             failure excerpt. (The `--follow-up` token is a classification no-op
             here — a flake is a `bug`, which suppresses `enhancement` — but is
             passed for consistency.) `/file-issue` runs the full pipeline:
             duplicate detection, 8-category evaluation, decomposition gate,
             type/topic classification, creation (or match of an existing issue),
             `@me` assignment, `help wanted`, type label, and any matched topic
             label. It ends with a `===FILE-ISSUE-RESULTS===` …
             `===FILE-ISSUE-RESULTS-END===` block; the subagent reads the
             `<disposition> <N>` record (a flake is one topic, so normally one
             record) and returns `<N>` with its disposition. Then:
             - **`CREATED <N>`** — `/file-issue` created a fresh issue, but its
               title-improver (`/file-issue` Step 4) may have reworded the title
               and dropped the verbatim fingerprint — which would break a future
               run's match. **Reassert the canonical title** so the fingerprint is
               the literal trailing token regardless of the rewording
               (`dangerouslyDisableSandbox: true`):
               ```bash
               source .claude/skills/dispatch-propagate/scripts/lib.sh
               gh_issue_edit_rest <N> --title "Flaky CI: <fingerprint>"
               ```
               Flake issue = `#<N>`, disposition `CREATED`. Set `$FLAKE_DISP=CREATED`.
             - **`EXISTING <M>`** — `/file-issue`'s fuzzy dedup matched a
               pre-existing (possibly human-filed, differently-titled) issue. Do
               **NOT** reassert its title — re-titling an unrelated issue would
               corrupt it. Flake issue = `#<M>`, disposition `EXISTING`. Set
               `$FLAKE_DISP=EXISTING`.

        **Node lane (`TARGET_KIND=node`):** GitHub Issues are disabled repo-wide
        on the node lane, so this sub-step never calls `gh issue` or `/file-issue`
        — the whole find-or-file-and-block sequence is graph-native, driven by
        Unit 1's `dispatch-flake-dedup-node` (a pure search+decide+print tool —
        it never writes any `intentions/*.md` file and never calls
        `graph-commit` itself; the writes below are this sub-step's own).
        1. Write the recurrence body to `tmp/flake-recurrence.md` (git-ignored
           `tmp/`, like the accumulator and like the legacy lane) — the same
           content shape: the fingerprint, the reproduce command, the failure
           excerpt, and a `recurred on PR #<pr> / run <url>` line. Do this once
           regardless of lane; do not duplicate the write if a prior branch
           already produced it in this run.
        2. Resolve the PR head SHA for the ancestry check (needed only when the
           guard reaches a `phase: done` node, but always safe to resolve):
           ```bash
           HEAD_SHA=$(gh pr view "$PR_NUM" --json headRefOid --jq .headRefOid)
           ```
           (`dangerouslyDisableSandbox: true` — calls `gh`.)
        3. Run the guard:
           ```bash
           DISP=$(.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup-node \
             "<fingerprint>" --body-file tmp/flake-recurrence.md --head-ref "$HEAD_SHA")
           ```
           It prints exactly one line: `NONE`, `EXISTING <tactic-id>`,
           `REOPENED <tactic-id>`, or `STALE <tactic-id>`. Parse it into a
           disposition and (when present) the tactic id.
        4. Branch on the disposition:
           - **`NONE`** — no matching flake tactic exists. **Before filing
             anything, run the stale-head guard.** `dispatch-flake-dedup-node`'s
             own stale-head gate covers the `phase: done` branch ONLY — its
             header states "OPEN/NONE never consult it" — so without this step a
             failure that is deterministic on a head merely missing a fix already
             on `origin/main` gets minted as a brand-new unreproducible flake
             (the 2026-07-22 incident that produced two such nodes, both pruned):
             ```bash
             STALE=$(.claude/skills/dispatch-propagate/scripts/dispatch-flake-stale-head-check \
               --head-ref "$HEAD_SHA" --reproduce-cmd "<reproduce command>")
             ```
             It prints `CURRENT` or `STALE-HEAD`, and exits non-zero **without**
             a disposition on any error — treat a non-zero exit as a hard stop,
             never as `CURRENT`.
             - **`STALE-HEAD`** — the failure does not reproduce at
               `origin/main`. Do **not** write a flake node and do not block the
               PR on one. Record the outcome as `STALE-HEAD-SUPPRESSED` (see the
               accumulator's flake-tracking-id bullet) and note in the accumulator
               that the remedy is to merge `origin/main` into the PR branch and
               re-run CI — the head is simply missing a fix that already landed.
               Set `$FLAKE_DISP=STALE-HEAD-SUPPRESSED`.
             - **`CURRENT`** — proceed with the node write below, unchanged.

             **Near-miss advisory check (`CURRENT` only, never blocks).**
             `dispatch-flake-dedup-node` matched nothing because it greps the
             **full** `Fingerprint: <fingerprint>` line as a fixed string, so a
             stable-id that diverges even slightly from an existing node's
             spelling reads as `NONE` and mints a second node with no signal to
             a human. Before writing, grep for the **mechanical half alone** —
             the failing check name and the ` — ` separator, not the full
             fingerprint. Anchor the glob at the repo root (the same reason
             `dispatch-flake-dedup-node` `cd`s to `git rev-parse
             --show-toplevel`): if cwd is not the worktree root the glob matches
             nothing, zsh aborts the command, `|| true` swallows it, and an
             empty `NEARMISS` is indistinguishable from a genuine no-hit.
             ```bash
             ROOT=$(git rev-parse --show-toplevel)
             NEARMISS=$(grep -rlF -- "Fingerprint: <failing-check-name> — " "$ROOT"/intentions/tactic-*.md 2>/dev/null || true)
             ```
             `NEARMISS` holds absolute paths; take each tactic id from the
             basename with the `.md` suffix stripped. This is a plain `grep`,
             not a new script — this step introduces no script surface and no
             new test file.
             - **No hit** — proceed silently; add no accumulator bullet.
             - **Hit** — before naming any match, **confirm it is actually a
               flake-tracking tactic** (a node whose body records a flake
               fingerprint, reproduce command, and failure excerpt). Matching
               only the mechanical half drops the stable-id anchoring that
               `dispatch-flake-dedup-node` relies on to keep a coincidental
               quote of a `Fingerprint:` line in an unrelated node's prose — a
               planning or meta node, of which this repo has several — from
               reading as a flake tracker. Discard every non-tracker match; if
               none survive, treat it as **No hit**.

               The surviving node(s) share this failing check but carry a
               different stable-id. **Still mint the new node exactly as below** —
               two distinct flakes under one check (e.g. two different assertions
               both failing under `hook-tests`) is a normal, expected case, so
               this must never block or delay filing. The only difference: carry
               an advisory note into the accumulator alongside the flake-tracking
               id bullet (the same mechanism the `STALE-SUPPRESSED` /
               `STALE-HEAD-SUPPRESSED` notes use), naming the matched tactic
               id(s) — e.g. `possible duplicate of <tactic-id>[, <tactic-id>…]:
               same failing check, different stable-id` — so a human reviewing
               flake tracking can judge whether to collapse them by hand.

             On `CURRENT`, write a **new** flake
             tactic node. Construct its frontmatter JSON and pass it to
             `write-node.ts` (same recipe as `align-tactics/SKILL.md`'s
             "Step 5 — Record"; `dangerouslyDisableSandbox: true`, and use an
             explicit `/tmp/claude-<uid>` scratch path for the temp JSON file —
             not `$TMPDIR`, unset under sandbox-off, and not the job's own tmp
             dir, read-only under sandbox):
             `kind: "tactic"`, `owner: "ai"`, `status: "codified"`,
             `phase: "implement"`, `execution: null`, `validates: []`,
             `office_hours: null`, `blocked_by: []`, and `serves` copied
             **verbatim** from the source tactic `$N`'s own `serves` array (read
             `intentions/$N.md`'s frontmatter first) — per `align-tactics`
             clarification 27 ("artifact-owner placement"), a flake tracking
             tactic is an honest byproduct of the strategy(s) the source tactic
             already serves, not a forced default; carry every entry if the
             source has more than one. Give the new node a short, content-derived
             id, e.g. `tactic-flake-<kebab-check-name>` (author's judgment —
             follow existing tactic-id naming in `intentions/`). No `--base` is
             needed (brand-new node):
             ```bash
             node --import tsx/esm packages/intentionsutil/scripts/write-node.ts \
               --dir intentions --file <json>
             ```
             Then `Edit` the new node's body (everything after the closing `---`
             frontmatter fence — `write-node.ts` does not touch it) to carry the
             fingerprint **verbatim** (this exact string is what
             `dispatch-flake-dedup-node`'s grep matches against on future runs —
             it must appear byte-identical), the reproduce command, and the
             failure excerpt/diagnosis — the same fields `tmp/flake-recurrence.md`
             carries. Land the frontmatter write and the body `Edit` together in
             one call:
             ```bash
             packages/intentionsutil/scripts/graph-commit <new-tactic-id>
             ```
             Flake tactic = `<new-tactic-id>`, disposition `CREATED`. Set
             `$FLAKE_DISP=CREATED`.
           - **`EXISTING <tactic-id>` / `REOPENED <tactic-id>`** — a matching
             flake tactic already exists. First dump a `--base` manifest for it
             (pre-existing node — same optimistic-concurrency guard
             `align-tactics` Step 5 uses). Note the `--out-dir`: this dump feeds
             its own `graph-commit`, so it gets its own directory, separate from
             sub-step 4's dump of `$N` below. One out-dir per `graph-commit` —
             sharing one leaves a manifest whose entries the later commit never
             meant to guard:
             ```bash
             BASE=$(node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts \
               --dir intentions \
               --out-dir /tmp/claude-<uid>/dump-flake-tactic <tactic-id>)
             ```
             `Edit` the existing tactic's body to **append** the recurrence
             content (`tmp/flake-recurrence.md`'s content) — never replace the
             existing body. For `REOPENED` **only**, additionally reset the
             frontmatter `phase` from `done` back to `implement`: read the
             node's current full frontmatter (via `dump-node.ts`'s manifest or
             directly from `intentions/<tactic-id>.md`), change only `phase`,
             and re-run `write-node.ts` with the modified JSON. Land whichever of
             the body `Edit` (both dispositions) and the frontmatter rewrite
             (`REOPENED` only) applied, in one call:
             ```bash
             packages/intentionsutil/scripts/graph-commit --base "$BASE" <tactic-id>
             ```
             Flake tactic = `<tactic-id>`, disposition `EXISTING` or `REOPENED`
             per the guard's line. Set `$FLAKE_DISP` to that same value.
           - **`STALE <tactic-id>`** — mirrors the legacy lane's STALE
             suppression exactly: do **nothing** — no create, no body append, no
             reopen, no frontmatter change. Flake tactic = `<tactic-id>`,
             disposition `STALE`. Set `$FLAKE_DISP=STALE`. Skip the node-lane sub-step 4 below entirely
             (the same exception the legacy lane's `STALE` branch carves out).
             Record the accumulator note (sub-step 5) marking this recurrence as
             suppressed-stale — the `<tactic-id> (STALE-SUPPRESSED)` entry — then
             fall through directly to sub-step 6 (post accumulator, push
             nothing).
     4. **Block the PR's tracked issue on the flake issue.**

        **Legacy lane (`TARGET_KIND=issue`):** In this thread, use
        the PR body already captured in Step 1's pack output (`=== PR ===` section)
        and parse its `Closes #N` line(s) for the issue(s) this PR implements. For **each** tracked issue, record a
        `blocked_by` dependency **on that tracked issue, targeting each flake issue
        `<N>`** returned — the PR's own work is blocked by the unrelated flake. Note the
        direction: this is the **reverse** of `/review-fix`,
        which records `blocked_by` on the *new* issue; here the new flake issue is
        the *blocker* and the PR's existing tracked issue is the *blocked* one.
        Use the `ref-github-issues` dependencies API (database-ID resolution with
        `gh api`, `--input` JSON; see `ref-github-issues`, do not restate the
        syntax — all `gh` calls use `dangerouslyDisableSandbox: true`). Idempotent:
        first list the tracked issue's current `blocked_by`, and skip the POST if
        the flake issue is already present, so a re-run against the same
        fingerprint does not re-add the dependency or error. This step consumes
        `<N>` uniformly for every disposition (`CREATED`, `EXISTING`, or
        `REOPENED`) — it makes no open-only assumption about the flake issue's
        state. **`STALE` is the one exception: skip this sub-step entirely** —
        deferred by design (see the `STALE` branch above).

        **Node lane (`TARGET_KIND=node`):** On `NONE`/`EXISTING`/`REOPENED`
        **only** (STALE already skipped straight past this sub-step above), set
        `blocked_by` on the **source tactic** — `$N`, the node this `/fix-checks`
        run targets — to include the flake tactic's id. This replaces the legacy
        lane's GitHub dependencies-API call; no `gh issue`/dependencies-API call
        ever happens on the node lane. Same reverse-direction note as the legacy
        lane: the flake tactic is the *blocker*, the source tactic `$N` is the
        *blocked* one (the reverse of `/review-fix`, which records `blocked_by`
        on the new node).

        Read `$N`'s current `blocked_by` array (`dump-node.ts`/reading
        `intentions/$N.md`'s frontmatter). If the flake tactic's id is already
        present, this is a no-op (idempotent re-run) — skip the write. Otherwise
        append it and land the one-field frontmatter change. This is a second,
        separate `graph-commit`, so it takes its own `--out-dir` — never
        sub-step 3's `dump-flake-tactic` directory, whose entry the flake
        `graph-commit` has already consumed and landed:
        ```bash
        BASE_N=$(node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts --dir intentions \
          --out-dir /tmp/claude-<uid>/dump-source-tactic "$N")
        node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --dir intentions \
          --file <updated-N.json>
        packages/intentionsutil/scripts/graph-commit --base "$BASE_N" "$N"
        ```
        **This must go through `write-node.ts` + `graph-commit`, not
        `transition-node`** — `transition-node` only mutates `phase`/`--set-pr`
        and has no `blocked_by` handling, so this is a deliberate deviation from
        how the rest of this node-lane skill normally advances phase. Do **not**
        escalate to office-hours for this outcome — the node-lane escalation seam
        (`$CLAUDE_JOB_DIR/office-hours-reason`) is not written here; self-blocking
        the source tactic on the flake tactic is a normal, non-escalating action.
     5. **Record a flake iteration in the accumulator** (the skill's top-level
        Step 7) — see [Accumulator](#accumulator); a flake entry is visually
        distinct from a generic no-repro one.
     6. **Post the accumulator (Step 8) and stop (Step 9). Push nothing** — the
        same terminal behavior as the generic no-repro outcome. On the next
        `/dispatch-propagate` run the PR's tracked issue carries a `blocked_by` against the
        flake issue; `/dispatch-propagate`'s queue scan skips blocked issues, so the PR is
        no longer re-routed to the `fix-checks` phase. The flake issue stands on its
        own in the queue for independent triage.

   Of the no-repro outcomes, **needs-human** is the only one that does its
   accumulator-append + post + `office-hours-reason` write **inline and stops before
   Step 5**. The other three (generic, main-fixed, flake) set their own push
   disposition here and then fall through to the shared tail Steps 7→9.

5. **Increment the fix-checks-attempt counter.** From the **labels line already
   captured in Step 1's pack output** (`=== PR ===` section), find the highest
   extant `dispatch:fix-checks-attempt-<n>` label. The preamble labels are valid
   here: between the preamble and Step 5 no `fix-checks-attempt` label is added
   (Step 5 itself adds it), so the preamble's label snapshot is current. Read the
   labels, find the highest `dispatch:fix-checks-attempt-<n>` value (call it `N`; use
   0 if none), then set `NEXT` = N+1 capped at 3 (`N < 3 ? N + 1 : 3`). Substitute
   `N` and `NEXT` as literals in the label-edit commands below.

   This step runs for the `fixed`, `main-fixed`, `flake`, and `generic` outcomes —
   the ones that consume the retry budget. The needs-human outcome already stopped in
   Step 4 and never applies a fix-checks-attempt label.

   The cap at 3 means a fourth entry still leaves the label at `dispatch:fix-checks-attempt-3`.
   `.claude/hooks/dispatch-stop.sh` (Branch C/D) reads this counter: when the re-derived
   phase is still `fix-checks` and the counter is `>= 3`, it escalates to
   `dispatch:office-hours` instead of self-closing.

   Remove the prior label if one exists, then apply the new one. Use the apply-first /
   create-on-"not found" idiom — the label may not exist yet on a fresh repo
   (`dangerouslyDisableSandbox: true` on all `gh` calls):

   ```bash
   # Remove the previous counter label (skip if N=0 — none existed)
   if [[ "$N" -gt 0 ]]; then
     gh pr edit "$PR_NUM" --remove-label "dispatch:fix-checks-attempt-$N"
   fi

   # Apply the new label; create it if missing, then retry
   if ! gh pr edit "$PR_NUM" --add-label "dispatch:fix-checks-attempt-$NEXT" 2>/dev/null; then
     gh label create "dispatch:fix-checks-attempt-$NEXT" \
       --description "dispatch workflow: fix-checks attempt $NEXT of 3"
     gh pr edit "$PR_NUM" --add-label "dispatch:fix-checks-attempt-$NEXT"
   fi
   ```

   Pass no `--color` — same convention as `dispatch:office-hours` (no colour metadata
   here; label colour is owned by the canonical definition, not the writer).

   Note: `dispatch-complete-phase` is not the right vehicle for this label — it handles
   only the two canonical phase-complete labels (`dispatch:qa-done`, `dispatch:reviewed`).
   The fix-checks-attempt label is local to `/fix-checks`.

6. **Apply the outcome's action.** If the failure reproduced, fix it by invoking
   `/implement-unit` via the Skill tool — pass `model` (chosen per
   `/implement-unit`'s heuristic), `scope` (the fix), `context` (the failing check and
   reproduce command), and `commit_intent`. `/implement-unit` builds the fix, commits,
   merges, and pushes it. This invocation is a subagent launch in its own right —
   increment `$SKILL_SUBAGENTS` (the outcome-envelope emit in Step 9 reports the
   running total as `--subagents-launched`). For the no-repro outcomes that reached this step
   (generic, main-fixed, flake), the push disposition was already set by the Step 4
   classification — generic and flake push nothing, main-fixed pushed the merge
   commit — so there is nothing more to do here.

   **Node lane:** immediately after `/implement-unit` pushes the fix, disarm
   auto-merge (`gh pr ready --undo "$PR_NUM"`) and record the pushed HEAD sha per
   the node-lane completion seam (`apply-fix-state --record-push` + `graph-commit`).

   `/implement-unit` returning here is mid-pass, not the end of the turn. Continue
   through Steps 7–9; the pass ends only at the Step 9 `dispatch-mark-complete`
   marker (or the Step 4 needs-human stop). Do not emit a closing summary; the next
   message is the next tool call.

7. **Append a record to the accumulator.** Append one `## Iteration <n>` section to
   `tmp/fix-checks-summary.md` (see [Accumulator](#accumulator)).

8. **Post the accumulator as a PR comment** (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh <pr-num> tmp/fix-checks-summary.md
   ```

9. **Write the phase-completed marker, then stop.** Reached by every outcome
   **except** needs-human (which stopped in Step 4 without a marker).
   `CLAUDE_JOB_DIR` unset = interactive run; the script no-ops with a clear
   diagnostic.

   **Legacy lane only** (`TARGET_KIND=issue`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
     --phase fix-checks --pr "$PR_NUM"
   ```

   **Node lane** (`TARGET_KIND=node`): write NO `dispatch-mark-complete` marker
   (it is a gh-label vehicle, issue-only). Write the node lane's own
   terminal-disposition marker instead:

   ```bash
   packages/intentionsutil/scripts/mark-node-terminal "$N" fix-attempt
   ```

   This is the node lane's terminal-disposition evidence. The completion write
   is still `apply-fix-state --spend-attempt` (+ `--record-push` when this
   iteration pushed) + `graph-commit` from the completion seam above — every
   outcome that reaches Step 9 spends one attempt unit there (retry by design;
   the selector re-routes on a later tick). This marker only tells the Stop hook
   (`.claude/hooks/dispatch-stop.sh`) that the pass *ended*: `Stop` fires on
   every turn yield, not only on terminal exit, so without the marker the hook
   leaves the job alive rather than reaping it mid-flight.

   **Emit the outcome envelope** (contract: `.claude/docs/outcome-envelope.md`),
   before the stop below — every outcome that reaches Step 9 (`fixed`,
   `generic-no-repro`, `main-fixed`, `flake`) emits exactly one record here; the
   needs-human branch already emitted its own in Step 4 and never reaches Step 9.
   This call runs **sandboxed** — `dispatch-emit-outcome` is pure, so do **not**
   pass `dangerouslyDisableSandbox`. Map the outcome recorded in the accumulator
   (Step 7) to `--disposition` and `--fixes-applied`:

   | Outcome | `--disposition` | `--fixes-applied` |
   |---|---|---|
   | `fixed` | `completed_with_fixes` | `1` |
   | `generic-no-repro` | `completed` | `0` |
   | `main-fixed` | `completed` | `0` |
   | `flake` | `completed` | `0` |

   `--followups-filed` is `1` only when this run's flake sub-path set
   `$FLAKE_DISP=CREATED` (a tracking record was actually minted this run), else
   `0` — that covers every non-`flake` outcome as well as a `flake` outcome whose
   disposition was `EXISTING`, `REOPENED`, `STALE`, or `STALE-HEAD-SUPPRESSED`.
   Omit `--terminated-reason` — every outcome reaching Step 9 is non-escalated.
   Derive `repo` from the local remote (read-only git, sandbox-safe). On the node
   lane (`TARGET_KIND=node`) pass `--node-id "$N"` and omit `--issue`; on the
   legacy issue lane (`TARGET_KIND=issue`) keep `--issue "$N"` and omit
   `--node-id`:

   ```bash
   REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
   if [[ "$TARGET_KIND" == node ]]; then
     id_arg=(--node-id "$N")
   else
     id_arg=(--issue "$N")
   fi
   # tool_denials / denied_commands are always in the record and are DERIVED by
   # the script from this session's transcript — pass no flag for them.
   .claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome \
     --phase fix-checks --repo "$REPO" "${id_arg[@]}" --pr "$PR_NUM" \
     --findings-surfaced "$FAILED_CHECK_COUNT" \
     --findings-actionable "$FAILED_CHECK_COUNT" \
     --fixes-applied <1 if outcome is `fixed`, else 0> \
     --followups-filed <1 only if $FLAKE_DISP=CREATED this run, else 0> \
     --subagents-launched "$SKILL_SUBAGENTS" \
     --disposition <completed_with_fixes if outcome is `fixed`, else completed>
   ```

   Then **stop**. The `/dispatch-propagate` background-job chain drives the
   next iteration — the selector observes the pushed sha's CI verdict on a later
   tick and either resolves the interrupt (green) or re-invokes `/fix-checks`
   (still red).

## Accumulator

`tmp/fix-checks-summary.md` is the only cross-iteration memory for the fix-checks phase.

- **First write** — create the file with a header (e.g. `# Fix-checks summary — PR #<n>`).
- **Every invocation** — append a `## Iteration <n>` section containing:
  - **Failed checks** — the check names CI reported failing.
  - **Outcome** — one of `fixed`, `generic-no-repro`, `main-fixed`, `flake`, or
    `needs-human`. This field is what makes a flake iteration visually distinct
    from a generic no-repro one.
  - **Reproduced** — `yes` or `no`.
  - **Reproduce command** — the command the subagent ran.
  - **Failure excerpt** — a short excerpt of the failure log.
  - **Why not caught** — the `why_not_caught` diagnosis.
  - **Fix** — the fix applied and its commit SHA. Include only when **Outcome**
    is `fixed`; omit otherwise.
  - **Flake issue** — *`flake` outcome only* — the canonical tracking record.
    **Legacy lane** (`TARGET_KIND=issue`): the GitHub tracking issue, written
    as `#<N> (CREATED)`, `#<N> (EXISTING)`, `#<N> (REOPENED)`, or
    `#<N> (STALE-SUPPRESSED)` per the `dispatch-flake-dedup` / `/file-issue`
    disposition. **Node lane** (`TARGET_KIND=node`): the flake tracking tactic
    id, written as `<tactic-id> (CREATED)`, `<tactic-id> (EXISTING)`,
    `<tactic-id> (REOPENED)`, or `<tactic-id> (STALE-SUPPRESSED)` per the
    `dispatch-flake-dedup-node` disposition — parallel to the legacy form, just
    a tactic id instead of an issue number. `STALE-SUPPRESSED` marks a
    recurrence suppressed as a stale-head false positive — no reopen was fired.
    A sixth value, bare `STALE-HEAD-SUPPRESSED` with no tactic id, marks the
    `NONE`-path counterpart: `dispatch-flake-stale-head-check` found the failure
    does not reproduce at `origin/main`, so **no node was created at all** and
    there is no id to name. Record alongside it that the remedy is to merge
    `origin/main` and re-run.
    On the node lane's `CREATED` path, the near-miss advisory check (Step 4's
    Flake sub-path) may append a trailing advisory clause to this same bullet:
    `<tactic-id> (CREATED) — possible duplicate of <tactic-id>[, <tactic-id>…]:
    same failing check, different stable-id`. The clause is advisory only — it
    never changes the parenthesized disposition and never suppresses the write.
    Omit for every other outcome.
  - **Fingerprint** — *`flake` outcome only* — the dedupe key computed in the
    Flake sub-path (the failing check name plus the stable identifier). Omit for
    every other outcome.
  - **Required action** — *`needs-human` outcome only* — the owner/infra action
    the subagent reported (the `required_action` string, e.g. provision the
    secret, grant the deploy SA access). Omit for every other outcome.

`tmp/` is git-ignored, so the accumulator never enters a commit; it persists for the
worktree's life.
