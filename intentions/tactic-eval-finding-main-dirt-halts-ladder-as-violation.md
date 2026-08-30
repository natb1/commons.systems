---
id: tactic-eval-finding-main-dirt-halts-ladder-as-violation
kind: tactic
statement: One unrelated modified intentions file in the main checkout made
  provision-node-worktree refuse its git merge --ff-only, dispatch-graph-execute
  return park-failed, and dispatch-ladder-advance route that through its failed
  catch-all arm to exit 11 — ending a 102-minute run at its first SUCCESSFUL
  phase boundary with terminus violation, the classification reserved for a
  contract breach, on a transient environment state that a restart 17 minutes
  later cleared in 37 seconds
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: dirty_files_blocking_main_checkout
      value: 2
      unit: files
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T16:54:30Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: main_checkout_commits_behind_origin
      value: 9
      unit: commits
      window: 2026-08-14T16:54Z main checkout
      sensor: rsi
      measured: 2026-08-14
    - metric: run_wall_clock_seconds_ended_by_halt
      value: 6152
      unit: seconds
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: phases_completed_before_halt
      value: 1
      unit: phases
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---

# One unrelated dirty file in the main checkout ends a ladder run as `violation`

## Context

### The incident this node records

Observed on `tactic-attention-per-tier-boost-migration`, at the `align-tactics`
phase boundary, 2026-08-14T16:54:30Z.

The `align-tactics` phase **succeeded** — `verify-landed` saw `advanced` at
`origin/main`, the node moved to `phase: implement`, and a four-unit plan landed
in the node body. Seven seconds later the run halted:

```
halt align-tactics throw | throw tactic-attention-per-tier-boost-migration execute-failed
dispatch-ladder-run: halted … (exit 11, terminus violation)
```

`terminus: violation` — the classification reserved for a run that broke a
contract — on a run that did nothing wrong, at its **first successful phase
boundary**, 102 minutes in.

The actual cause, recovered from journald (it is *not* in `events.jsonl`; that
half is owned by `tactic-eval-finding-ladder-halt-drops-captured-cause`, still
open at `phase: implement` — **do not re-plan it here**):

```
provision-node-worktree: 'git merge --ff-only origin/main' failed in
/home/n8/natb1/commons.systems (the tree is dirty or diverged) — this checkout
needs a person before anything may be read from or written into it
 M intentions/tactic-invalid-state-rc-0b9860b2.md
dispatch-ladder-advance: dispatch-graph-execute exited 1 with
  'failed tactic-attention-per-tier-boost-migration park-failed'
```

One modified node file in the shared main checkout ended the run. The chain:
`provision-node-worktree` exit 2 → `dispatch-graph-execute`'s generic `*)`
catch-all arm calls `park-node` → the park write **itself** could not land (the
graph write path refuses on the same main dirt) → `failed <id> park-failed` →
`dispatch-ladder-advance`'s `failed|*)` catch-all → exit 11 →
`dispatch-ladder-run` → `halt 11 throw` → terminus `violation`.

### Why the classification is provably wrong

While this evaluation was still being written, the driver was restarted:

```json
{"ts":"2026-08-14T17:11:29Z","event":"start","phase":null,"disposition":"running"}
{"ts":"2026-08-14T17:12:06Z","event":"launched","phase":"implement","disposition":"launched","detail":"kind=tactic skill=/implement"}
```

Nothing about the node changed between the halt and the restart — it sat at
`phase: implement` both times. The only thing that changed was the main
checkout's cleanliness. **37 seconds of restart recovered what the halt had
classified as a contract breach.**

Two aggravating facts recorded at the time and still relevant:

- **The residue was pre-existing and long-lived.**
  `intentions/tactic-invalid-state-rc-0b9860b2.md` was already `M` when the run
  started at 15:11:58Z and was still `M` at 16:54Z — it blocked the checkout for
  the run's entire life. The checkout was also **9 commits behind `origin/main`**
  at halt time, so the `--ff-only` had real work to do.
- **The residue set churns while the guard is armed.** Minutes apart the dirty
  set went from `tactic-eval-finding-ledger-has-no-retirement-actor.md` +
  `tactic-invalid-state-rc-0b9860b2.md` to
  `tactic-eval-finding-fix-phase-emits-no-outcome-record.md` +
  `tactic-invalid-state-rc-0b9860b2.md`. Other graph writers leave and clear
  residue in the shared checkout continuously, so a ladder run's advance step is
  racing a window it cannot see.

### Why this is a separate entry from its neighbours (unchanged judgment)

- `tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt` (`phase: done`)
  is about `graph-commit` refusing, costing the *evaluator* its write.
- `tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes`
  (`phase: done`) is about the writer that *creates* the residue.
- `tactic-eval-finding-ladder-gate-stale-main-checkout-halt` (`phase: done`) is
  a fourth relative not named in the original write-up: same
  `provision-node-worktree` area, but exit 12 `stalled` from
  `check-node-selection` reading an un-fast-forwarded tree — a different
  mechanism and a different exit path.

Here the refusing guard is `provision-node-worktree`'s `git merge --ff-only`, and
the victim is the **ladder's forward progress**. The shared root cause argues for
one fix; the distinct scripts, exit paths and blast radius argue for distinct
entries. Merge them if the author reads it the other way.

### Verified state of the code (re-checked 2026-08-19; all still true)

- `provision-node-worktree:161-170` calls `sync_main_checkout "$PROJECT_ROOT"`
  and collapses rc 1 (fetch) and rc 2 (dirty/diverged merge) into a bare
  `exit 2`. Its header exit table documents that choice deliberately: the
  dirty main checkout is *not* exit 14, because 14 is about **this node's**
  worktree residue and its evidence capture would serialize the MAIN checkout's
  status into a hold node.
- `sync_main_checkout` is `lib.sh:2109-2113`:
  `git -C "$root" fetch origin main || return 1; git -C "$root" merge --ff-only origin/main || return 2`.
  Its header states plainly: "`--ff-only` doubles as the dirty/diverged-tree
  guard".
- `dispatch-graph-execute:481-487` — the `*)` arm calls `park-node` with a
  generic "fix the environment" recommendation and emits `parked $id`, or
  `failed $id park-failed` when the park write itself fails. Its neighbours
  `11)` / `12)` / `13)` / `14)` all have bespoke, non-park handling.
- `dispatch-ladder-advance:452-456` — the `failed|*)` arm: `throw $NODE_ID
  execute-failed`, `exit 11`. The arms above it that reach exit 10 (`idle`) are
  `waiting)`, `skipped)` and `scope-stale)`.
- **Correction to this node's original causal claim.** The first write-up said
  "`dispatch-ladder-run:1539` maps exit 11 to `halt 11 throw`, terminus
  `violation`". Exit 11 does map to `halt 11 throw`, but `violation` is **not**
  derived from the exit code. `classify_terminus`
  (`dispatch-ladder-run:889-956`) reads the node at `origin/main` and asks, in
  order: absent? → `pruned`/`not-a-node`; `.phase == "done"` → `done`;
  `.office_hours != null` → `excused-parked`; `(.blocked_by|length) > 0` →
  `excused-blocked`; otherwise it falls through to `printf 'violation'`.
  `halt()` (`:709-735`) calls it on **every** halt, whatever the exit code.
  So `violation` is the DEFAULT for "the run halted while the node is healthy
  and mid-ladder" — the normal state of any interrupted run. **This makes the
  finding stronger, and it means re-routing the disposition to exit 10 does not
  by itself fix the classification.** Both halves have to change.
- **A second site with the identical defect, in the same driver.**
  `dispatch-ladder-run:1110-1120` (the reconcile pass's own main-checkout sync)
  calls `sync_main_checkout` and, on either failure, `halt 11 throw
  "main-sync-failed: …"`. The same environment condition therefore halts the
  ladder at exit 11 from **two** independent sites. Both are in scope below.
- **The key asymmetry.** `dispatch-select-tick:307-450` (Step 1) faces the
  *identical* `git merge --ff-only origin/main` failure and does **not** treat it
  as a violation. It defers while a live `sync-repair` session is mutating the
  checkout; checks a durable latch; reads a bounded attempt counter; under a cap
  of 3 bumps the counter and emits `sync-failed`, which `dispatch-tick:878-888`
  turns into a deduped `/commit-merge-push` bg job; at the cap it sets the latch
  and files a find-or-create human-visibility issue and stops respawning; and on
  any later clean ff-merge it resets the counter and clears the latch so a human
  who tidies the tree auto-recovers. Every primitive already exists and is
  already tested. **The ladder lane reuses none of it.**

### The three candidates this node recorded, and their disposition

1. *Scope the dirty-tree gate to the paths the fast-forward touches.*
   **Refused, and refuted by this incident's own evidence.** The dirty file was
   `intentions/tactic-invalid-state-rc-0b9860b2.md` — inside the very directory
   the operation reads (`check-node-selection.ts --dir "$PROJECT_ROOT/intentions"`,
   and the reconcilers enumerate the whole store from that tree). Path-scoping
   would not have helped here, and a fast-forward cannot be partially applied
   anyway. Recorded so no future round re-proposes it without new evidence.
2. *Give the disposition its own arm instead of the `failed|*)` catch-all.*
   **Adopted, and extended** — necessary but not sufficient, per correction D
   above. Adopted together with the terminus fix (Unit 5) and the graded retry
   (Units 1-4), so the run first *retries* rather than halting at all.
3. *Have something sweep or report stale `intentions/*.md` residue in the main
   checkout.* **Subsumed.** The repair actor already exists — the deduped
   `/commit-merge-push` job — and the reporting actor already exists — the
   durable `repo-health` latch plus `dispatch-escalate-sync-broken`'s
   find-or-create issue. This plan wires the ladder lane into both instead of
   building a third mechanism.

### Greenfield design

**A dirty or diverged main checkout is an environment condition external to the
node, so every dispatch driver answers it with the same graded ladder — defer
while a repair is live, spawn a bounded repair, latch and escalate to a human at
the cap, auto-recover on the next clean sync — and no driver ever spends the
ladder's most severe terminus on it.** There is exactly one implementation of
that ladder, invoked by every caller that must read from or write into the shared
checkout. The node's own `office_hours` is never written for it, for the same
reason `dispatch-graph-execute`'s case 14 refuses to: the node is intact and
correctly positioned; the shared tree is what needs a person.

### Brownfield migration path

The graded ladder exists today, but welded into `dispatch-select-tick`'s Step 1
and reachable only from the tick. This plan lifts it into one script
(`dispatch-sync-main`), converts the two ladder call sites to it (Units 1-4),
gives the halt an honest terminus (Unit 5), and converts the tick's own Step 1
last (Unit 6) — conditionally, because `tactic-select-tick-main-sync-gated-on-caller-cwd`
(`phase: implement`, open) is editing exactly that region right now. Until Unit 6
lands, the tick keeps its inline copy; that is the deliberate interim state, not
an oversight.

**Out of scope for the whole plan:** the events.jsonl cause-capture gap (owned by
`tactic-eval-finding-ladder-halt-drops-captured-cause`); redirecting graph writes
off the shared checkout onto private worktrees (the greenfield note on
`tactic-select-tick-main-sync-gated-on-caller-cwd`); the `violation` terminus on
the CI-wait-budget halt at `dispatch-ladder-run:1530`, which has a different
cause and needs its own finding; any automatic discard, stash or commit of a
person's uncommitted file.

---

## Unit 1 — `dispatch-sync-main`: the lane-agnostic graded main-checkout sync

**Recommended model: opus.**

### Scope

New file: `.claude/skills/dispatch-propagate/scripts/dispatch-sync-main`
(executable, `#!/usr/bin/env bash`, `set -uo pipefail`, matching its siblings'
style).

It is a faithful lift of `dispatch-select-tick:330-450`'s decision logic, minus
everything tick-specific (the selection lock, `dispatch-schedule-reseed`, the
`DLOG_*` decision-log variables, and the job spawn itself — **the caller
spawns**, exactly as `dispatch-tick` does today for the tick lane).

Usage: `dispatch-sync-main [--root <path>]`. With no `--root`, resolve via
`resolve_main_worktree` (from `lib-graph-worktree.sh`), falling back to nothing —
an unresolvable root is `exit 2` with a message, never a silent skip
(`.claude/rules/code-style.md`).

Behavior, in this order:

1. `assert_primary_checkout_on_main "$ROOT"` (`lib.sh`) — on failure, `exit 2`.
   Same prevent-at-source guard `dispatch-select-tick:341-347` applies.
2. **Live-repair deference.** `claude_sessions_under "$ROOT"`
   (`lib-claude-agents.sh`); if a row's name is `sync-repair` and its status is
   not `stopped`, print `repair-pending` and `exit 5` **without touching the tree
   and without bumping the counter**. `claude_sessions_under` rc 1 (daemon
   unanswerable) falls **through** to the probe — the same fail-open choice
   `dispatch-select-tick:353-364` documents.
3. **Probe.** `sync_main_checkout "$ROOT"` (`lib.sh:2109`). Capture its stderr to
   a temp and replay it to this script's stderr, so nothing is swallowed. rc 0 =
   clean, 1 = fetch failed, 2 = merge failed.
4. **Clean (rc 0).** `sync_repair_reset_attempts`;
   `"$SCRIPT_DIR/repo-health" --clear-sync-broken || true`; close any open
   `dispatch:sync-broken` issues via `gh_issue_list_rest` / `gh_issue_close_rest`
   (both already in `lib.sh`), best-effort. Print `ok`, `exit 0`. This recovery
   half is **load-bearing for the ladder lane specifically**: dispatch is
   currently paused, so `dispatch-select-tick` is not running and would never
   clear a latch the ladder set.
5. **Failure.** Let `REASON` be `fetch-failed` when the fetch failed, else
   `merge-failed`.
   - If `"$SCRIPT_DIR/repo-health" --sync-broken-latched` prints `latched`:
     print `sync-broken latched`, `exit 6`. Spawn nothing, bump nothing.
   - Else if `sync_repair_read_attempts` ≥ `SYNC_REPAIR_CAP`
     (`${DISPATCH_SYNC_REPAIR_CAP:-3}`): `repo-health --set-sync-broken --reason
     "$REASON"`, then `dispatch-escalate-sync-broken --reason "$REASON"` with the
     captured stderr **plus** `git -C "$ROOT" status --porcelain
     --untracked-files=no` on stdin (the status is what a human actually needs;
     the tick passes stderr alone). Both best-effort (`|| true`). Print
     `sync-broken attempt-cap`, `exit 6`. This branch does **not** bump.
   - Else: `sync_repair_bump_attempts`; print `repair-needed <REASON>`, `exit 5`.

Exit codes — documented in a header table in the sibling style:
`0` ok · `5` retry later (`repair-pending` or `repair-needed <reason>`; the
caller may spawn the repair job — `dispatch-spawn-job`'s name-keyed dedup makes a
spawn during `repair-pending` a no-op) · `6` a person owns the tree
(`sync-broken <latched|attempt-cap>`) · `2` usage/environment.

Header must record: requires `dangerouslyDisableSandbox: true` (tree-updating
`git merge` across the read-only `.claude/**` carve-outs, the Claude daemon Unix
socket, and `gh`) per `.claude/rules/sandbox.md`.

**Do not add any new `source` line to `lib.sh`.** The new script sources
`lib.sh` / `lib-claude-agents.sh` / `lib-graph-worktree.sh` itself. A new
`source` inside `lib.sh` breaks the ~17 copy-based CI fixtures that copy
`lib.sh` alone into a scratch dir (`lib.sh:2024` documents that convention).

New file: `.claude/skills/dispatch-propagate/scripts/test-dispatch-sync-main.sh`,
modelled on `test-dispatch-select-tick.sh`'s override/fixture pattern —
`DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE` and `REPO_HEALTH_STATE_FILE` env overrides,
a fake `claude` binary behind `CLAUDE_AGENTS_CMD` for the session probe
(`test-dispatch-select-tick.sh:237-247,1345-1351`), and `advance_origin_main`
from `dispatch-test-fixture.sh` to build the diverged precondition. Cases: clean
sync resets + clears; dirty tree under cap bumps and prints `repair-needed
merge-failed` / exit 5; at cap sets latch, invokes the escalate stub, prints
`sync-broken attempt-cap` / exit 6; already-latched prints `sync-broken latched`
/ exit 6 without bumping; a live `sync-repair` session prints `repair-pending` /
exit 5 without bumping; failed fetch reports `fetch-failed`.

Register the suite in `.github/workflows/unit-tests.yml`, in the `hook-tests`
job, next to the other `dispatch-propagate/scripts/test-*.sh` steps (insert near
line 284, `Run provision-node-worktree tests`). **This is mandatory:**
`run-unit-tests.sh:171-183` globs only `dispatch-propagate/scripts/test-*.sh`
locally and the ladder suites are not in it at all; CI coverage comes solely from
these explicit steps. An unregistered suite silently never runs.

**Out of scope:** editing `dispatch-select-tick` (Unit 6), and any change to
`sync_main_checkout`'s own contract.

## Unit 2 — `provision-node-worktree` reports the graded verdict instead of `exit 2`

**Recommended model: sonnet.**

**Dependencies:** Unit 1.

### Scope

File: `.claude/skills/dispatch-propagate/scripts/provision-node-worktree`.

At `:156-170`, replace the direct `sync_main_checkout "$PROJECT_ROOT"` call with
`"$SCRIPT_DIR/dispatch-sync-main" --root "$PROJECT_ROOT"`, capturing its stdout
token, and propagate:

- rc 0 → continue exactly as today.
- rc 5 → print the token to stdout and `exit 5`.
- rc 6 → print the token to stdout and `exit 6`.
- rc 2 → keep today's hard refusal shape: an explanatory stderr line and
  `exit 2`.

Codes 5 and 6 are free in this script's table (`0, 2, 10, 11, 12, 13, 14`) and
free in `intentions/tactic-dispatch-ladder-exit-code-space.md`'s table, which
claims `3/15/16/17` and lists `5, 6, 8, 18, 19, 22+` as remaining. Add a comment
naming that node so the two tables stay reconciled.

Extend the header exit-code table (`:75-90`) with the two new rows, and **rewrite
the paragraph that currently justifies routing a dirty main checkout to exit 2**
— it now states the opposite policy. Keep the existing explanation of why this
is not exit 14 (the evidence capture would serialize the MAIN checkout's status
into a hold node); that reasoning still holds.

Tests: `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`.
Cases 15 and 16 (`:583-630`) already build the dirty and diverged main checkout
precondition and assert `exit 2` plus the old stderr substring — update them to
the new codes/tokens rather than adding a parallel fixture; they are already
proven to reproduce the `merge --ff-only` failure end to end. Add a case that a
second consecutive dirty provision bumps the shared counter, and one that at the
cap the exit becomes 6.

**Out of scope:** the worker-start re-validation gate below the sync, the
pushed-tip alignment, and every other provisioning step.

## Unit 3 — `dispatch-graph-execute` answers with a repair, never a park

**Recommended model: opus.**

**Dependencies:** Unit 2.

### Scope

File: `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`.

At `:228-229`, rename the capture (`PROV_OUT=$(… provision-node-worktree …)`) and
immediately assign `WT="$PROV_OUT"` so every existing use of `WT` is untouched;
`PROV_OUT` carries the discriminator token on the new codes.

Add two arms to the `case "$prov_rc"` block, **before** the `*)` arm at `:469`:

- `5)` — the checkout is being repaired or needs a repair. `reservation_clear
  "$id" || true` (mirroring case 12: the node was never provisioned, so the claim
  must not be held). Then spawn the repair with the same call `dispatch-tick`
  uses at `:878-888`:
  `"$SCRIPT_DIR/dispatch-spawn-job" --name sync-repair --cwd "$PROJECT_ROOT" --model sonnet "/commit-merge-push"`,
  best-effort with a WARNING on failure. The `--name sync-repair` dedup key is
  what makes a spawn during `repair-pending` a no-op and what prevents racing the
  tick's own repair. Emit `sync-repairing $id`. Do **not** increment `FAILURES`.
- `6)` — a person owns the tree. `reservation_clear "$id" || true`; emit
  `sync-broken $id`; do **not** increment `FAILURES`.

**Neither arm calls `park-node`.** Write the reason into the comment explicitly,
citing case 14's precedent (`:417-467`): the node is intact and correctly at its
next phase, the condition is external to it, and its own `office_hours` is the
wrong instrument. This is the direct repair of the observed cascade — the failed
park write is what produced `failed … park-failed`.

Tests: `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`.
Case 8 (`:325-332`) already stubs `provision-node-worktree` through a `PROV_RC`
env var (stub-writing pattern at `:65-80`; the `park-node`/`hold-node` argv-log
stub pattern at `:81-98`). Add: `PROV_RC=5` emits `sync-repairing <id>`, exits 0,
invokes the `dispatch-spawn-job` stub once with `--name sync-repair`, and leaves
the `park-node` log **empty**; `PROV_RC=6` emits `sync-broken <id>`, exits 0, and
likewise never calls `park-node`.

**Out of scope:** the `*)` arm's behavior for every other non-zero code — it
keeps parking, which remains right for a bad node id or an unresolvable root.

## Unit 4 — the ladder retries instead of halting, at both sites

**Recommended model: opus.**

**Dependencies:** Unit 3.

### Scope

File: `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance`.
In the `case "$DISPOSITION"` block (`:399-456`, disposition parsed at `:398` as
field 1 of `dispatch-graph-execute`'s stdout), add two arms **before**
`parked|held)`:

- `sync-repairing)` → `echo "idle $NODE_ID main-sync-repairing"; exit 10`.
- `sync-broken)` → `echo "throw $NODE_ID main-sync-broken"; echo "$EXEC_OUT" >&2; exit 11`.

No new exit code is minted here. `main-sync-repairing`'s caller action is
identical to `ci-waiting`'s — sleep and retry — and
`tactic-dispatch-ladder-exit-code-space`'s governing rule is "a distinct exit
code is warranted iff the caller must take a distinct action". Add a comment
recording that, for that node's benefit, `main-sync-repairing` belongs on
whatever code `ci-waiting` ends up carrying (its plan proposes `15 idle-wait`).
Update the header's `idle`/`throw` stdout documentation (`:68-79`) and the exit
code notes (`:91-113`) with the two new reasons.

File: `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`.

- **Exit-10 arm** (`:1471-1479`): widen the `ci-waiting)` pattern to
  `ci-waiting|main-sync-repairing)`, and log the actual `$REASON` rather than the
  hardcoded `ci-waiting` token so the two stay distinguishable in
  `events.jsonl`. The run is bounded three ways already: `--max-run-s`
  (`check_deadline`), the attempt cap that turns a persistent condition into
  `sync-broken` after 3 spawned repairs, and the latch. Do not add a fourth
  budget.
- **Exit-11 arm** (`:1539`): parse field 3 of `$ADV_OUT`; when it is
  `main-sync-broken`, pass the terminus hint added in Unit 5 —
  `halt 11 throw "$ADV_OUT" excused-environment`. Otherwise unchanged.
- **The second site — the reconcile pass's own sync** (`:1110-1120`): replace the
  `sync_main_checkout` call and its two halts with
  `"$DISPATCH_SCRIPTS/dispatch-sync-main" --root "$PROJECT_ROOT"`, and map:
  rc 0 → continue; rc 5 → `release_lock`, spawn the deduped repair job (same
  `dispatch-spawn-job --name sync-repair` call as Unit 3), set
  `RECONCILE_RESULT=quiet` and `QUIET_REASON=main-sync-repairing`, and return —
  the caller then logs an idle event, `poll_wait`s and retries, exactly as it
  does for a pending PR; rc 6 → `release_lock`, `halt 11 throw "main-sync-broken:
  …" excused-environment`; rc 2 → `release_lock`, `halt 2 usage "…"`.
  Preserve the existing comment's reasoning about *why* the reconcilers must not
  drain into an unsynced tree — it is still true; only the response to failure
  changes.

Tests: `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh`
drives stubbed sibling stdout and asserts the disposition-mapping table (see its
header, `:1-16`) — add `sync-repairing tactic-fixture-node` → exit 10 /
`idle … main-sync-repairing`, and `sync-broken tactic-fixture-node` → exit 11 /
`throw … main-sync-broken`, beside the existing parked/held cases at `:234-238`.
`.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh` uses
sequence-driven stub scripts under `$FAKE_BIN` — add a case where advance answers
`10|idle tactic-fixture-node main-sync-repairing` twice and then `0|launched …`,
asserting the run re-polls and reaches the launch rather than halting; and a case
where advance answers `11|throw tactic-fixture-node main-sync-broken`, asserting
the halt's `terminus` field (Unit 5).

**Out of scope:** `dispatch-ladder-await`, and any renumbering of existing exit
codes (that is `tactic-dispatch-ladder-exit-code-space`'s job).

## Unit 5 — `excused-environment`: stop spending `violation` on the environment

**Recommended model: opus.**

**Dependencies:** Unit 4 (they land together; Unit 4's exit-11 arm is the only
caller that passes the hint).

### Scope

File: `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`.

- `halt()` (`:709-735`) gains an optional 4th positional argument, the terminus
  hint. After `classify_terminus` runs and its answer is normalized against the
  closed vocabulary, **if and only if** the computed terminus is `violation` and
  the hint is exactly `excused-environment`, replace it with the hint. Every
  other computed answer wins over the hint — `done`, `excused-parked`,
  `excused-blocked`, `pruned`, `not-a-node` and `unknown` are all reads of
  reality and a caller may not overrule them, and `unknown` in particular must
  never be upgraded (the "could not tell is not a verdict" doctrine at `:844-847`).
  Add `excused-environment` to the vocabulary `case` at `:715-718`.
- `classify_terminus`'s header block (`:820-846`) documents the closed
  vocabulary — add the token there with one sentence: *the run stopped because
  the shared environment was wedged, not because the node's contract was
  breached; the node is intact, correctly positioned, and re-runnable the moment
  a person clears the tree.* State plainly that it is the one token `halt()` may
  set from its call site rather than read from the graph, and why: the question
  "was stopping here legitimate" is answered by the halt's cause, which no read
  of the node can see. Record the measured evidence: the 2026-08-14 run resumed
  17 minutes later, unchanged, in 37 seconds.
- Header block `THE EXIT CODE AND THE TERMINUS ARE ORTHOGONAL` — add the token to
  its enumeration.

Documentation surfaces that enumerate the vocabulary and must all be updated in
this same unit (a rename that orphans one of these is the recurring failure mode):

- `.claude/skills/dispatch-ladder/SKILL.md:256-261` and `:419-425`.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-status:38-42` (header
  comment; the script itself just prints `.terminus` and needs no code change).

Tests: `test-dispatch-ladder-run.sh` — assert that the `main-sync-broken` halt
writes `terminus: excused-environment` into `state.json` and into the `halt`
event's `terminus` field, and, critically, a negative case: a hint passed on a
halt where the node reads `phase: done` still classifies `done`, and a halt with
no hint on a healthy mid-ladder node still classifies `violation`. The suite
already stubs `verify-landed`'s 0/4/1 answers for `classify_terminus` (see
`:742`).

**Out of scope:** the terminus of the CI-wait-budget halt at `:1530`, the
`stalled` and `claimed` halts, and any change to which exit code a halt uses.

## Unit 6 — retire the tick's inline copy (conditional)

**Recommended model: sonnet.**

**Dependencies:** Units 1-5.

### Scope

**Gate — evaluate this first and mechanically.** Read
`intentions/tactic-select-tick-main-sync-gated-on-caller-cwd.md` at
`origin/main`. If its `phase` is **not** `done`, **skip this unit entirely**:
that node's Unit 1 rewrites `dispatch-select-tick:316` and `:379` — the exact
region this unit replaces — and racing it produces a guaranteed conflict for no
behavioral gain. On skip, record the residual through the single find-or-recur
write surface (`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`)
so the duplication is a tracked entry rather than silent debt, and note the skip
in the PR body.

If the gate passes: file
`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, Step 1
(`:307-450`). Replace the inline probe/latch/counter/escalate logic with one call
to `dispatch-sync-main --root "$MAIN_WORKTREE"` and a token switch that preserves
**every** existing observable byte-for-byte: `sync-repair-pending`,
`sync-failed`, `sync-broken` on stdout; the same `DLOG_DISPOSITION` /
`DLOG_SKIP_REASON` values; the same `release_lock` and
`dispatch-schedule-reseed` ordering on each path; `dispatch-tick` still spawning
the repair on `sync-failed`. Map rc 5/`repair-pending` → `sync-repair-pending`,
rc 5/`repair-needed` → `sync-failed`, rc 6 → `sync-broken` (with
`DLOG_SKIP_REASON` `latched` or `attempt-cap` from the token), rc 0 → fall
through to Step 1c, rc 2 → today's `internal-error` exit 2.

Behavior-preserving by construction: `test-dispatch-select-tick.sh` already
covers the sync-repair, latch, attempt-cap and `sync-failed` dispositions and
must pass **unmodified**. If a test needs changing, the refactor changed behavior
— stop and reconsider rather than editing the test
(`.claude/rules/test-integrity.md`).

**Out of scope:** Decision A's fail-open semantics, the `assert_primary_checkout_on_main`
guard's position, and every other step of `dispatch-select-tick`.

---

## Reuse

- `sync_main_checkout` — `.claude/skills/dispatch-propagate/scripts/lib.sh:2109`.
  The shared fetch + ff-only-merge primitive (0 clean / 1 fetch failed / 2 merge
  failed). `dispatch-sync-main` wraps it; nothing anywhere re-opens the git
  calls.
- `sync_repair_attempts_file` / `sync_repair_read_attempts` /
  `sync_repair_bump_attempts` / `sync_repair_reset_attempts` — `lib.sh:2146-2183`.
  The bounded attempt counter at `<project-root>/tmp/sync-repair-attempts`,
  overridable with `DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE`. One counter shared by
  both lanes — do not add a second.
- `repo-health --sync-broken-latched | --set-sync-broken --reason
  <merge-failed|fetch-failed> | --clear-sync-broken` —
  `.claude/skills/dispatch-propagate/scripts/repo-health:283-371`. Durable,
  label-free, gh-free latch at `<project-root>/tmp/repo-health.json`
  (`REPO_HEALTH_STATE_FILE`).
- `dispatch-escalate-sync-broken --reason <merge-failed|fetch-failed>` (stderr on
  stdin) — `.claude/skills/dispatch-propagate/scripts/dispatch-escalate-sync-broken:1-58`.
  Find-or-create human-visibility issue; exit 0 with the issue number on stdout.
- `dispatch-spawn-job --name sync-repair --cwd <main> --model sonnet
  "/commit-merge-push"` — the exact call at
  `.claude/skills/dispatch-propagate/scripts/dispatch-tick:878-888`. Dedup is
  keyed on the session name, which is what makes concurrent spawns safe.
  `/commit-merge-push`'s own conflict recovery already escalates to an Opus
  subagent internally.
- `dispatch-select-tick:306-449` — the complete reference wiring being lifted.
  Read it before writing Unit 1; it is the specification.
- `claude_sessions_under` — `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`.
  Needs `dangerouslyDisableSandbox: true`; a sandboxed `claude agents --json`
  returns `[]` indistinguishably from "no sessions".
- `assert_primary_checkout_on_main`, `resolve_main_worktree`, `resolve_project_root`,
  `gh_issue_list_rest` (`lib.sh:383`), `gh_issue_close_rest` (`lib.sh:1361`).
- `dispatch-graph-execute:417-467` (case 14) — the in-ladder precedent for
  "transient/environment condition, the source node's own `office_hours` is the
  wrong instrument". Imitate its reasoning, not its hold-node mechanism: a wedged
  *shared* checkout is not this node's residue and must not be serialized into a
  per-node hold.
- `dispatch-test-fixture.sh` — `assert_eq` / `assert_contains` /
  `report_results`, the decision-log and host-systemd leak guards, and
  `advance_origin_main` (used at `test-provision-node-worktree.sh:596,618`) for
  building a diverged checkout.
- `test-provision-node-worktree.sh:583-630` (Cases 15/16) — the proven dirty and
  diverged main-checkout fixtures. Extend; do not invent a second dirtying
  pattern.
- `test-dispatch-select-tick.sh:237-247,1345-1351` — the canonical
  `CLAUDE_AGENTS_CMD` fake-`claude` pattern and the
  `DISPATCH_SYNC_REPAIR_ATTEMPTS_FILE` / `REPO_HEALTH_STATE_FILE` override
  pattern.
- `test-dispatch-graph-execute.sh:65-98` — the `PROV_RC` provision stub and the
  argv-logging stubs for `park-node` / `hold-node` / `dispatch-spawn-job`.
- `intentions/tactic-dispatch-ladder-exit-code-space.md` — the exit-code table
  and its governing rule. Check every code this plan mints against it.

## Verification

All six shell suites below are already registered as explicit steps in
`.github/workflows/unit-tests.yml`'s `hook-tests` job (`:265-313`); the new
`test-dispatch-sync-main.sh` must be added there in Unit 1 or it will never run
in CI (`run-unit-tests.sh:171-183` does not reach it, and no glob discovers
skill-local `test-*.sh`). Run them from the repo/worktree root.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-sync-main.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

The new suite is registered in CI (this grep fails today, which is the point):

```verify
grep -q 'test-dispatch-sync-main.sh' .github/workflows/unit-tests.yml
```

The new terminus token reaches all four surfaces that enumerate the vocabulary
(each grep fails today):

```verify
grep -q 'excused-environment' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run || exit 1
grep -q 'excused-environment' .claude/skills/dispatch-ladder/scripts/dispatch-ladder-status || exit 1
grep -q 'excused-environment' .claude/skills/dispatch-ladder/SKILL.md || exit 1
grep -q 'excused-environment' .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

No new `source` line entered `lib.sh` (the copy-fixture constraint; this
compares against `origin/main` and fails if the count grew):

```verify
test "$(grep -c '^ *source ' .claude/skills/dispatch-propagate/scripts/lib.sh)" -le "$(git show origin/main:.claude/skills/dispatch-propagate/scripts/lib.sh | grep -c '^ *source ')"
```

Lint (runs the type-safety and prose-rule checks that gate CI):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

### Manual and judgment checks

- **End-to-end reproduction, by hand, sandbox off.** In a scratch clone (never
  the live main checkout): dirty one tracked `intentions/*.md` file, advance
  `origin/main` past it with `advance_origin_main`, then run
  `dispatch-ladder-run` against a fixture node. Expected: the run logs an
  `idle … main-sync-repairing` event and re-polls instead of halting; after the
  repair job (or a manual `git restore`) clears the tree, the next advance
  launches the phase. Then repeat with the latch pre-set
  (`repo-health --set-sync-broken --reason merge-failed`): expected a single
  `halt 11 throw` whose `state.json` and `halt` event both carry
  `terminus: excused-environment`, and **no** `office_hours` written on the node.
  Every command here needs `dangerouslyDisableSandbox: true` — the ff-only merge
  is a tree-updating git op across the read-only `.claude/**` carve-outs, the
  session probe reaches the Claude daemon over a Unix socket, and the escalation
  calls `gh` (`.claude/rules/sandbox.md`).
- **The node is never parked for an environment condition.** Inspect the two new
  `dispatch-graph-execute` arms and confirm neither reaches `park-node`, and that
  the `park-node` argv log stays empty in the two new test cases. This is the
  precise regression the incident produced (`failed … park-failed`), so it is
  worth reading, not just asserting.
- **Termination.** Reason through the retry loop once explicitly: the counter
  bumps only on `repair-needed`, never on `repair-pending`, and at the cap the
  disposition flips to `sync-broken` → exit 11 → halt. With `POLL_S` 60 and the
  cap 3, a persistently wedged tree costs at most a few minutes before it reaches
  a human, and `check_deadline` (`--max-run-s`, default 21600) is the outer
  bound. Confirm no path can spin without bumping.
- **Composition with the two open siblings.** Before opening the PR, re-read
  `intentions/tactic-dispatch-ladder-exit-code-space.md` (`phase: implement`) and
  `intentions/tactic-select-tick-main-sync-gated-on-caller-cwd.md`
  (`phase: implement`) at `origin/main`. This plan deliberately mints no code in
  the ladder's shared space and adds only reasons/dispositions, so it composes in
  either order; Unit 6 is gated on the second node. If either has landed, merge
  `origin/main` first and re-verify the anchors before editing.
- **Observe in production.** After merge, the next `/dispatch-ladder` run that
  meets a dirty main checkout should show `main-sync-repairing` in
  `events.jsonl` and reach its next phase. A halt on this condition should carry
  `excused-environment`, never `violation`. If a `violation` on a healthy
  mid-ladder node recurs from this cause, record the recurrence on **this** node
  through `dispatch-eval-finding` (updating `attributes.measured_impact`), never
  as a new node.
