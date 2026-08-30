---
id: tactic-dispatch-test-monolith-split
kind: tactic
statement: Decompose test-dispatch-scripts.sh into per-script test files so
  parallel feature branches stop manufacturing merge conflicts on one shared
  31.5k-line file
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-25 concurrency/serialization review. The
  recurring provision-exit-11 merge-conflict parks trace disproportionately to
  this one file: every parallel dispatch-script feature adds cases to it, so
  branches conflict on test text rather than on genuinely contended behavior.
  Every intention node that references the file today proposes ADDING to it;
  none proposes splitting it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-dispatch-test-monolith-split
  pr: 2971
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-31T00:45:40Z
    mergeCommitSha: 58e5bc3476ef11e0b628a4bb788198eb4e89bf29
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Decompose test-dispatch-scripts.sh into per-script test files so parallel feature branches stop manufacturing merge conflicts on one shared 31.5k-line file

## Context

`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` is 31,514
lines and is the single append target for every dispatch-script feature branch.
Concurrent branches therefore conflict on test text rather than on contended
behavior, and those conflicts surface as provision-exit-11 parks (PR #2918
conflicted on this file, was resolved, and re-conflicted within minutes). The
repo already has 22 focused sibling `test-*.sh` files in the same directory,
all auto-discovered by `run-unit-tests.sh`'s glob — the monolith is the
outlier, not the norm. Every intention node that references the file today
proposes ADDING to it (`tactic-provision-worktree-script-tests`,
`tactic-graph-select-target-node-tests`, `tactic-graph-ref-split`); none
proposes splitting it, so the conflict rate is structurally increasing.

This tactic moves all 116 sections out into ~88 per-SUT sibling files plus one
shared fixture, deletes the monolith, and proves the move is lossless by line-
multiset equality. Per `.claude/rules/test-integrity.md` this is a MOVE, never
a prune: no test may be dropped, weakened, skipped, or rewritten. It lands as
ONE PR against a quiesced fleet, because a partial split would conflict with
every branch still touching the unsplit remainder — this pairs naturally with
landing PR #2918 (whose recurring conflict is on this same file).

All line numbers below were verified against the current monolith at plan
time (2026-07-25); a fresh implementation session should re-run the Step-1
section-boundary algorithm below and assert it still yields 116 sections
starting at line 1326 before trusting the manifest, in case the file drifted
between planning and implementation.

## Target shared-harness design

### Decision: a new fixture file, NOT an extension of `test-helpers.sh`

Create `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh`.

Three reasons:

1. **`test-helpers.sh` is a generic 85-line library** shared by unrelated
   suites (`test-dispatch-derive-node-target.sh`, `test-dispatch-phase-model.sh`,
   `test-run-typecheck.sh`, …). Bolting on a 1,300-line dispatch-specific
   fixture — whose `setup()` copies ~20 dispatch scripts plus
   `lib.sh`/`lib-claude-agents.sh`/`lib-reservation-ledger.sh` into a tmp dir
   and installs fake `gh`/`git` PATH shims — would make every unrelated suite
   inherit dispatch-specific globals and the extremely generic names
   `setup`/`teardown`. That is dead abstraction for them
   (`.claude/rules/code-style.md`).
2. **Behavior preservation requires verbatim moves.** The monolith's
   `assert_eq` (`:21-33`) uses `[[ "$expected" == "$actual" ]]` and prints
   `expected: '…'` with quotes; `test-helpers.sh`'s (`:9-21`) uses
   `[ … = … ]` and prints unquoted. Its `report_results` (`:76-85`) calls
   `exit 1`; the monolith's (`:35-41`) returns a boolean. Both are
   *compatible* at every call site, but reusing test-helpers.sh's variants
   would mean the split also silently rewrites failure-output text. Moving
   the monolith's own definitions verbatim into the fixture makes the whole
   change provable by byte-level line equality (see Verification).
3. **The name must sit outside the runner's glob.** `run-unit-tests.sh:186-204`
   globs `"$SCRIPTS"/test-*.sh` and skips only `test-helpers.sh`. Naming the
   fixture `dispatch-test-fixture.sh` (no `test-` prefix) keeps it out of the
   glob with **zero change to the runner** and protects it from any other
   future globber. Do not name it `test-dispatch-fixture.sh`.

### What goes in the fixture

Everything used by **two or more** output files. Everything used by exactly
one output file stays in that file. That single rule resolves every case.

**Block A — the monolith preamble, moved verbatim (lines 7–1325):**

| Content | Monolith lines |
|---|---|
| `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"` | `:8` |
| `HOOK_SCRIPT_DIR="$SCRIPT_DIR/../../../hooks"` + comment | `:10-13` |
| `PASS=0 FAIL=0 TOTAL=0` | `:17-19` |
| `assert_eq()` | `:21-33` |
| `report_results()` | `:35-41` |
| `SAVED_PATH` / `TMPDIR_TEST` / `STUB_DIR` | `:45-47` |
| global `setup()` (1,163 lines) | `:49-1211` |
| global `teardown()` | `:1213-1232` |
| `trap '… rm -rf "$TMPDIR_TEST"' EXIT` | `:1233` |
| `write_rest_check_runs()` | `:1236-1252` |
| `make_pr()` / `make_pr_union()` / `make_pr_union_mergeable()` / `make_pr_mergeable()` / `pr_list_tmpfile()` | `:1254-1312` |
| `GREEN_ROLLUP` / `FAILING_ROLLUP` / `PENDING_ROLLUP` / `MIXED_ROLLUP` / `EMPTY_ROLLUP` / `NO_LABELS` | `:1314-1324` |

**Keep `$0`, not `${BASH_SOURCE[0]}`, on `:8`.** `$0` is the *invoking test
file*, which is a sibling of the fixture, so `SCRIPT_DIR` resolves to the same
directory either way — and keeping the line byte-identical is what lets the
multiset check pass unmodified. `run-unit-tests.sh` invokes each test by
absolute path, so `dirname "$0"` is always the scripts directory.

**Block B — seven promotions, each used by 2+ output files.** These were
derived from a full cross-section symbol audit (every top-level `foo() {`
definition and every `^[A-Z_]*=` assignment, cross-referenced against which of
the 116 sections reference it). They are the *complete* set of cross-section
helpers beyond Block A:

| Promoted symbols | Monolith lines | Defined in section | Consumed by |
|---|---|---|---|
| `select_target_fake_claude`, `office_hours_fake_claude`, `office_hours_fresh_fake_claude`, `office_hours_state_fake_claude` | `:3675-3858` (tail of the dispatch-resolve-arg section, starting at the comment block above `select_target_fake_claude()` at `:3684`, ending at the `}` at `:3857`) | 15 | 16, 17, 26 |
| `log_state()` | `:5791-5794` | 22 | 23, 24 |
| `lock_setup()` / `lock_teardown()` | `:8460-8482` | 32 | 64 |
| `TW_NOW=1000000` + `tw_resets_for_x()` (with their comments) | `:11944-11956` | 37 | 86b |
| entire "retained fake-`claude` writer" section: `write_fake_spawn_router_claude()` + `SPAWN_ROUTER_*` | `:15172-15271` | 45 | 56 |
| `merge_main_setup()` / `merge_main_teardown()` (with comments) | `:21130-21155` | 68 | 108 |
| `assert_contains_local()` / `assert_not_contains_local()` (with comment) | `:24840-24864` | 84 | 112 |

Note: section 45 is **not** a dead stub — `write_fake_spawn_router_claude` and
`SPAWN_ROUTER_REGISTRY`/`SPAWN_ROUTER_RM_LOG` are live and consumed by the
`dispatch-self-close` section (`:17272-17543`). Do not delete it.

Every other cross-section coupling is resolved by **merging the two sections
into one output file** (they share a SUT or a theme) rather than promoting:
30+31, 47+48+49+50, 54+55, 60+102. Those merges are in the manifest below.

### What each generated file looks like

Modeled on `test-dispatch-derive-node-target.sh` (`:11-15`), with
`set -euo pipefail` (the monolith's setting, `:6`) rather than that file's
`set -uo pipefail`:

```bash
#!/usr/bin/env bash
# Tests for <SUT> — moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: <lines>.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
<verbatim section lines, unmodified>
# <<< END MOVED <<<

report_results
```

The two sentinel comments are load-bearing: they delimit the region that must
be byte-identical to the monolith, and everything outside them is boilerplate
excluded from the parity diff. `chmod +x` every generated file (the runner
executes them directly). The fixture itself carries the same sentinels around
Blocks A and B so its moved content participates in the same check.

## File-by-file target shape

**Naming rule (in priority order):**

1. If the section's SUT is a script in `.claude/skills/dispatch-propagate/scripts/`,
   the file is `test-<script-basename>.sh` (e.g. `dispatch-ci-ready` →
   `test-dispatch-ci-ready.sh`, `repo-health` → `test-repo-health.sh`,
   `office-hours` → `test-office-hours.sh`).
2. If a test file for that script **already exists**, append into it — never
   create a colliding second file.
3. If the SUT is a `lib.sh` (or sibling library) function rather than a
   script, the file is `test-lib-<function-or-family>.sh`.
4. Multi-script fixtures that genuinely exercise one orchestration get the
   orchestrator's name; multi-script helper trios get a descriptive grouped
   name.

**Collision cases.** The four prefix-dropped scripts (`dispatch-write-phase-log`,
`dispatch-flake-stale-head-check`, `dispatch-emit-outcome`,
`dispatch-reclaim-audit`) are **moot** — verified `grep -c` for all four names
across the monolith returns 0. No monolith section tests them.

There is, however, **one real collision**: section 52 (`:16508-16552`,
`# dispatch-phase-model tests`) collides with the existing
`test-dispatch-phase-model.sh` (91 lines, verified). Handle it as
**append-into-existing**: insert the section body, wrapped in the same
sentinels, immediately **before** that file's final `report_results` call
(its last line). This is safe without edits — the body uses only `assert_eq`
and `$SCRIPT_DIR`, both already provided there via `test-helpers.sh` (`:14`)
and `:12`. Do **not** make it source `dispatch-test-fixture.sh`.

### Manifest

Section indices and line ranges below are canonical (verified: the boundary
algorithm in "Mechanical extraction approach" below yields exactly 116
sections, first at line 1326, last at line 31511). Re-derive and assert they
still match before using this table, in case the file drifted since planning.

| § | Lines | Output file |
|---|---|---|
| 1–7 | 1326–2807 | `test-lib-gh-rest.sh` (lib.sh REST layer: `dispatch_ci_verdict_rest`, `gh_issue_list_rest`, `gh_pr_list_rest`, `gh_issue_view_rest`/`gh_pr_view_rest`, REST read helpers, mutation REST helpers, REST-bucket consumption) |
| 8 | 2808–2955 | `test-dispatch-ci-ready.sh` |
| 9 | 2956–3129 | `test-dispatch-find-pr.sh` |
| 10 | 3130–3220 | `test-dispatch-main-qa-triage.sh` |
| 11 | 3221–3414 | `test-dispatch-epic-resolved-candidate.sh` |
| 12 | 3415–3439 | `test-dispatch-epic-labels.sh` |
| 13 | 3440–3491 | `test-issue-sub-issues.sh` |
| 14 | 3492–3591 | `test-dispatch-close-resolved.sh` |
| 15 | 3592–3674 | `test-dispatch-resolve-arg.sh` (tail 3675–3858 promoted to fixture) |
| 16 | 3859–4661 | `test-office-hours-select-target.sh` |
| 17 | 4662–5156 | `test-office-hours.sh` |
| 18 | 5157–5283 | `test-lib-gh-retry.sh` |
| 19 | 5284–5598 | `test-lib-playwright-install.sh` |
| 20 | 5599–5674 | `test-lib-wait-for-dpkg-lock.sh` |
| 21 | 5675–5784 | `test-dispatch-complete-phase.sh` |
| 22 | 5785–5936 | `test-dispatch-apply-office-hours.sh` (minus 5791–5794) |
| 23 | 5937–5992 | `test-dispatch-apply-planned.sh` |
| 24 | 5993–6192 | `test-dispatch-qa-apply-main-qa-labels.sh` |
| 25 | 6193–6255 | `test-dispatch-plan-finalize.sh` |
| 26 | 6256–6702 | `test-dispatch-resolve-worktree.sh` |
| 27–29 | 6703–6857 | `test-lib-worktree-records.sh` (`list_worktree_records`, `split_worktree_record`, `resolve_project_root`) |
| 30+31 | 6858–8445 | `test-dispatch-sweep.sh` (merged: sweep + age-gated not-in-sync reap; §31 uses §30's `sweep_setup`/`sweep_teardown`/`sweep_register_wt`/`sweep_path_key`/`sweep_fake_claude_sessions_by_name`) |
| 32 | 8446–9414 | `test-dispatch-acquire-lock.sh` (minus 8460–8482) |
| 33 | 9415–10044 | `test-lib-claude-agents.sh` |
| 34 | 10045–10456 | `test-lib-reservation-ledger.sh` |
| 35 | 10457–11753 | `test-dispatch-config-load.sh` |
| 36 | 11754–11900 | `test-ingest-downloads.sh` |
| 37 | 11901–12976 | `test-dispatch-target-workers.sh` (minus 11944–11956) |
| 38 | 12977–13859 | `test-dispatch-schedule-reseed.sh` |
| 39 | 13860–14112 | `test-dispatch-schedule-convergence-reseed.sh` |
| 40 | 14113–14389 | `test-dispatch-schedule-target-reseed.sh` |
| 41 | 14390–14617 | `test-dispatch-qa-fix-attempt.sh` |
| 42 | 14618–14814 | `test-dispatch-attempt-count.sh` |
| 43 | 14815–14952 | `test-dispatch-qa-noprogress.sh` |
| 44 | 14953–15171 | `test-dispatch-project-helpers.sh` (`dispatch-project-item-add` / `-status-read` / `-status-write`, one shared fixture) |
| 45 | 15172–15271 | → **fixture** (whole section) |
| 46 | 15272–15492 | `test-dispatch-spawn-tick.sh` |
| 47+48+49+50 | 15493–15989 | `test-dispatch-spawn-sweep.sh` (merged: spawn-sweep + the three `ensure_sweep_timer` sections, which install the timer spawn-sweep drives; §50 uses §47's `sw_setup`/`sw_teardown`) |
| 51 | 15990–16507 | `test-dispatch-tick-recover.sh` |
| 52 | 16508–16552 | **append into existing** `test-dispatch-phase-model.sh` |
| 53 | 16553–16612 | `test-dispatch-phase-effort.sh` |
| 54+55 | 16613–17271 | `test-dispatch-spawn-job.sh` (merged: §54 is the shared fake-`claude` harness §55 consumes) |
| 56 | 17272–17543 | `test-dispatch-self-close.sh` |
| 57 | 17544–18526 | `test-dispatch-jit-engine.sh` |
| 58 | 18527–19160 | `test-dispatch-statements-scan.sh` |
| 59 | 19161–19339 | `test-dispatch-office-hours-strip-hook.sh` (uses `HOOK_SCRIPT_DIR`) |
| 60+102 | 19340–19551, 29463–29552 | `test-dispatch-stop-hook.sh` (merged: same SUT `.claude/hooks/dispatch-stop.sh`; uses `HOOK_SCRIPT_DIR`) |
| 61 | 19552–19699 | `test-dispatch-finalize-phase.sh` |
| 62 | 19700–19801 | `test-lib-ensure-deps.sh` |
| 63 | 19802–19923 | `test-npm-ci-with-retry.sh` |
| 64 | 19924–20135 | `test-dispatch-finalize-selection.sh` |
| 65 | 20136–20193 | `test-dispatch-chain-worktree-ratchet.sh` (repo-wide grep ratchet for #839, no single SUT) |
| 66 | 20194–20266 | `test-dispatch-check-blockers.sh` |
| 67 | 20267–21117 | `test-dispatch-jit-calendar-import.sh` (integration with `dispatch-config-load` + `dispatch-project-item-add`) |
| 68 | 21118–21231 | `test-dispatch-merge-main.sh` (minus 21130–21155) |
| 69 | 21232–21364 | `test-dispatch-provision-worktree.sh` |
| 70 | 21365–22707 | `test-dispatch-select-tick.sh` (multi-script orchestration integration) |
| 71 | 22708–22979 | `test-dispatch-escalate-sync-broken.sh` |
| 72 | 22980–23618 | `test-dispatch-tick.sh` (headless orchestrator vs. fakes) |
| 73 | 23619–23818 | `test-dispatch-security-surface.sh` |
| 74 | 23819–23958 | `test-dispatch-changed-files.sh` |
| 75 | 23959–24095 | `test-dispatch-security-followup.sh` |
| 76 | 24096–24174 | `test-dispatch-qa-needs-main-followup.sh` |
| 77 | 24175–24244 | `test-dispatch-review-finders.sh` |
| 78 | 24245–24313 | `test-dispatch-review-dedup.sh` |
| 79 | 24314–24343 | `test-dispatch-review-verify-drop.sh` |
| 80 | 24344–24413 | `test-dispatch-qa-disposition.sh` |
| 81 | 24414–24477 | `test-qa-fix-partition.sh` (slices `.claude/workflows/qa-fix.js` via `qa-fix-partition-probe.mjs`) |
| 82 | 24478–24687 | `test-dispatch-jit-skill.sh` |
| 83 | 24688–24825 | `test-dispatch-digest-window.sh` |
| 84 | 24826–25114 | `test-dispatch-drift-scan.sh` (minus 24840–24864) |
| 85a | 25115–25798 | `test-dispatch-followup-exists.sh` |
| 85b | 25799–25970 | `test-dispatch-mark-complete.sh` (covers `dispatch-mark-complete` + `dispatch-mark-deviation`) |
| 85c | 25971–26022 | `test-dispatch-mark-deferred.sh` |
| 85d | 26023–26072 | `test-dispatch-mark-parse-job-done.sh` |
| 86a | 26073–26261 | `test-dispatch-open-pr.sh` (with §104) |
| 86b | 26262–26450 | `test-dispatch-refresh-rate-limits.sh` |
| 86c | 26451–26842 | `test-dispatch-sample-usage.sh` (`dispatch-sample-usage` + `usage-sample-writer.mjs --dry-run`) |
| 87–92 | 26843–27311 | `test-lib-systemd-units.sh` (`ensure_recover_unit` ×5 + `ensure_heartbeat_units`) |
| 93 | 27312–27756 | `test-dispatch-plan-io.sh` (`dispatch-write-plan` + `dispatch-read-plan`) |
| 94a | 27757–27873 | `test-dispatch-write-recommendation.sh` |
| 94b | 27874–27928 | `test-lib-gh-repo-from-remote.sh` |
| 95 | 27929–28065 | `test-lib-claim-fixed-vite-port.sh` |
| 96 | 28066–28307 | `test-dispatch-reconcile-ready.sh` |
| 97 | 28308–28642 | `test-commit-merge-push.sh` |
| 98 | 28643–28791 | `test-dispatch-detect-transient-death.sh` |
| 99 | 28792–28969 | `test-dispatch-recover-dispatched-phase.sh` |
| 100 | 28970–29109 | `test-dispatch-resume-worker.sh` |
| 101 | 29110–29462 | `test-dispatch-schedule-rate-limit-resume.sh` |
| 103 | 29553–29957 | `test-dispatch-stamp-session.sh` |
| 104 | 29958–30039 | → `test-dispatch-open-pr.sh` (with §86a; self-contained, defines its own `open_pr_backfill_gh_stub`) |
| 105 | 30040–30141 | `test-lib-resolve-dirty-apps.sh` |
| 106 | 30142–30410 | `test-dispatch-review-erosion.sh` |
| 107 | 30411–30559 | `test-dispatch-run-verification.sh` |
| 108 | 30560–30653 | `test-dispatch-preflight.sh` |
| 109 | 30654–30737 | `test-lib-marker-comment-id.sh` |
| 110 | 30738–30839 | `test-dispatch-recover-session-id.sh` |
| 111 | 30840–31030 | `test-lib-firebase-deploy-retry.sh` |
| 112 | 31031–31267 | `test-dispatch-find-owning-pr.sh` |
| 113 | 31268–31348 | `test-graph-select-target.sh` |
| 114 | 31349–31418 | `test-assert-worktree-fresh.sh` |
| 115 | 31419–31510 | `test-repo-health.sh` |
| 116 | 31511–31514 | boilerplate (`# summary` banner + `report_results`) — becomes each file's trailing `report_results`; excluded from the parity range |

That is **88 new files + 1 fixture + 1 append**. There is **no junk-drawer
`test-misc.sh`** — a shared catch-all would reintroduce exactly the conflict
magnet this tactic removes.

One naming collision inside the monolith resolves itself: `tr_setup`/`tr_teardown`
is defined twice with different bodies (`:14132`/`:14201` in §40 and
`:16027`/`:16115` in §51). They land in `test-dispatch-schedule-target-reseed.sh`
and `test-dispatch-tick-recover.sh` respectively and are never co-sourced again.

## Mechanical extraction approach

**Do not hand-edit.** 31.5k lines and ~90 outputs is script work. Write a
**throwaway** Python extractor (not committed — run it, commit its output,
delete it) driven by an explicit manifest.

### Step 1 — derive and assert the section index

The section-header shape is inconsistent across the file (four variants:
`title` + banner; banner + `title` + banner; multi-line comment blocks). This
single algorithm yields exactly 116 sections and is verified against the
current file:

```
for every line matching ^# ={4,}$:
    s = that line number
    while line[s-1] starts with '#':  s -= 1     # walk up over the whole comment block
    record s as a section start
dedupe; sort  →  must be exactly 116 starts, first = 1326, last = 31511
```

Assert `len(starts) == 116` and `starts[0] == 1326` before doing anything
else. Section *end* = next start − 1.

### Step 2 — apply the sub-splits

Seven sections contain more than one SUT, demarcated only by the idiom
`echo ""` immediately followed by `echo "=== <name> ==="` more than ~10 lines
after the section start. The complete set is already resolved in the manifest
above (§85 → 4, §86 → 3, §94 → 2). Assert those exact split lines exist:

```
25799, 25971, 26023, 26262, 26451, 27874
```

Every other hit of that idiom (sections 37, 38, 39, 40, 41, 42, 43, 49, 50,
64, 100, 101, 102, 104, 105, 106, 110) is the section's *own* opening banner
sitting below a long header comment — not a split. Do not split on those.

### Step 3 — build the manifest

A literal list of `(output_file, [(start,end), …], mode)` transcribed from the
table above, where `mode ∈ {new, append, fixture}`. Ranges within one output
file must stay in ascending original order (tests inside a section depend on
earlier ones).

### Step 4 — generate

For each entry: emit the header template (shebang, purpose comment naming the
SUT and the original line range, `set -euo pipefail`, `FIXTURE_DIR`, `source`,
`# >>> MOVED FROM test-dispatch-scripts.sh >>>`), then the verbatim lines from
every range, then `# <<< END MOVED <<<` and `report_results`.
`os.chmod(f, 0o755)`. For `mode == append`, splice the sentinel-wrapped body
into `test-dispatch-phase-model.sh` immediately above its final
`report_results` line.

**Hard rule: the extractor never modifies a body line.** No re-indenting, no
renaming, no trailing-whitespace stripping, no adding a missing `export`. If a
generated file fails at runtime because it depended on state a neighboring
section produced, the fix is to **move more existing lines** (widen the range,
or promote the producing lines into the fixture) — never to add a net-new
line. Any genuinely unavoidable net-new line must be listed explicitly in the
PR description and must show up as exactly that one line in the parity diff.

### Step 5 — parity verification (the exact method)

Two independent checks. **Line-multiset equality is the primary one** — it is
byte-exact and proves the *text* of every test survived, which a case count
alone cannot.

**Check A — line multiset (primary).** Because extraction is purely
range-based, the union of all sentinel-delimited bodies must be a permutation
of monolith lines 7–31510 (lines 1–6 are shebang/header/`set`; 31511–31514 are
the summary banner + `report_results`, both boilerplate):

```bash
LC_ALL=C sort <(sed -n '7,31510p' "$BASELINE") > /tmp/parity-before.txt
for f in .claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh \
         .claude/skills/dispatch-propagate/scripts/test-*.sh; do
  awk '/^# >>> MOVED FROM test-dispatch-scripts\.sh >>>$/{i=1;next}
       /^# <<< END MOVED <<<$/{i=0} i' "$f"
done | LC_ALL=C sort > /tmp/parity-after.txt
diff /tmp/parity-before.txt /tmp/parity-after.txt   # MUST be empty
```

This catches: any dropped line, any duplicated line (so copy-instead-of-move
fails), any edited assertion, any silently rewritten label.

**Check B — runtime assertion count (secondary, catches "moved but never
executed").** Check A cannot detect a test whose text survived but which no
longer *runs* (e.g. a section body copied but its `setup` never reached). The
monolith's `report_results` prints `Results: $PASS/$TOTAL passed, $FAIL
failed`, and `TOTAL` is incremented by `assert_eq`, `assert_contains_local`,
`assert_not_contains_local`, and ~30 hand-rolled inline `TOTAL=$((TOTAL + 1))`
sites. Compare the **aggregate across the whole `--pr-scripts` group** before
and after — pre-existing sibling files contribute identically to both sides,
so the delta is exactly `Σ(new files) − monolith`:

```bash
sum_totals() {  # stdin = a run log
  grep -oE '^Results: [0-9]+/[0-9]+ passed, [0-9]+ failed' \
    | awk -F'[ /,]' '{p+=$2; t+=$3} END{printf "%d %d\n", p, t}'
}
```
Require: `total_after == total_before` **and** `pass_after == total_after`.
For orientation, the monolith's static assertion-call count is ~2,510
`assert_eq` + 23/10 `assert_contains_local`/`assert_not_contains_local` (both
figures slightly inflated by prose mentions in comments) — use the runtime
number, not the grep, as the gate.

## Units

### Unit 1 — Extract the shared fixture; monolith sources it

**Scope.** Create `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh`
containing Block A (monolith `:7-1325`, verbatim) and Block B (the seven
promotions listed above, verbatim, each cut from its home section), wrapped in
the `>>> MOVED` / `<<< END MOVED` sentinels. Rewrite `test-dispatch-scripts.sh`
to: shebang + header comment + `set -euo pipefail` + `FIXTURE_DIR=…` +
`source "$FIXTURE_DIR/dispatch-test-fixture.sh"` + the remaining body
(`:1326-31514` minus the seven promoted sub-ranges).

**Why first.** After this unit the monolith still runs end-to-end and must
still print the identical `Results:` line. That proves the fixture is correct
against all ~2,543 assertions in one shot, before any file-splitting risk is
introduced. Do not collapse this into Unit 2.

**Out of scope.** Creating any new `test-*.sh`; deleting the monolith;
touching `.github/workflows/`; touching `test-helpers.sh`; trimming the global
`setup()` (it copies ~20 scripts on every call — leave it exactly as is;
slimming is a separate optimization and would change behavior).

**Anchors.** `test-dispatch-scripts.sh:7-1325`, `:3675-3858`, `:5791-5794`,
`:8460-8482`, `:11944-11956`, `:15172-15271`, `:21130-21155`, `:24840-24864`.

**Verify.** `bash .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
exits 0 and its `Results:` line matches the origin/main baseline exactly;
Check A with the after-side being `dispatch-test-fixture.sh` body +
`test-dispatch-scripts.sh` lines 7–31510-equivalent.

**Recommended model.** `sonnet` — the promotion set and every line range is
enumerated above; no classification judgment remains.

**Dependencies.** None.

### Unit 2 — Generate the ~88 per-SUT files and delete the monolith

**Scope.** Write the throwaway extractor + manifest (Steps 1–4 above). Run
it. Produce all 88 new `test-*.sh` files, splice §52 into the existing
`test-dispatch-phase-model.sh`, `chmod +x` everything new, `git rm`
`test-dispatch-scripts.sh`. Delete the extractor and manifest before
committing (they are single-use; a committed one-shot script is dead
abstraction).

**Out of scope.** CI wiring (Unit 3). Any change to `run-unit-tests.sh` — the
fixture's name keeps it out of the `test-*.sh` glob, so the runner needs no
edit. Any change to the four existing prefix-dropped test files (nothing in
the monolith targets those scripts). Any behavioral fix to a failing test.

**Anchors.** The manifest table above; `run-unit-tests.sh:186-204` (the glob
that will auto-discover the new files); `test-dispatch-phase-model.sh` last
line (`report_results`) as the splice point.

**Recommended model.** `sonnet` for the mechanical run. Escalate to `opus`
only if Unit 4 surfaces a coupling not in the audit above — i.e. a generated
file fails with an unbound variable or "command not found" — since deciding
*merge vs. promote to fixture* for a newly discovered coupling is a judgment
call.

**Dependencies.** Unit 1.

### Unit 3 — CI wiring and stale filename references

**Scope.**
- `.github/workflows/unit-tests.yml:198-199`: **remove** the
  `- name: Run dispatch script tests` / `run: …/test-dispatch-scripts.sh` step
  from the `hook-tests` job. Do **not** add the 88 new files to `hook-tests`
  — it is a hand-picked always-run subset (~9 of the 23 existing test files);
  the `unit-tests` job (`:13-44`) runs `run-unit-tests.sh` with no flags,
  whose glob (`run-unit-tests.sh:186-204`) picks up every new file with zero
  further wiring.
- Update prose references to the deleted filename so docs stay accurate:
  `.claude/skills/dispatch-propagate/reference.md:662`,
  `.claude/workflows/review-fix.js:36`, `.claude/workflows/qa-fix.js:222`,
  `.claude/skills/dispatch-propagate/scripts/qa-fix-partition-probe.mjs:7,28`,
  `usage-sample-writer.mjs:66`, `dispatch-flake-stale-head-check:24`, and the
  "mirrors test-dispatch-scripts.sh" header comments in
  `test-dispatch-daemon-liveness.sh:13`, `test-dispatch-graph-execute.sh:11`,
  `.claude/skills/budget/scripts/test-budget-config-load.sh:8`,
  `.claude/skills/budget-parse-job/scripts/test-parse-job-extract.sh:5`,
  `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh:664`.

  Care with the two `qa-fix` ones: `qa-fix.js:222` and
  `qa-fix-partition-probe.mjs:28` contain a **marker string that is matched at
  runtime** (verified: `// >>> partitionDispositions: sliced + eval'd by
  test-dispatch-scripts.sh (#1844) >>>` appears byte-identical in both files
  today). If you change the comment text in `qa-fix.js`, you must change the
  matching literal in `qa-fix-partition-probe.mjs:28` identically, or the §81
  test breaks. Safest: leave that marker pair byte-identical and update only
  `qa-fix-partition-probe.mjs:7`'s prose.
- Do **not** edit `intentions/*.md` node bodies that reference the old path —
  those are historical records.

**Out of scope.** `.github/scripts/check-test-integrity.sh` — it only
inspects `*.test.ts|tsx` / `*.spec.ts|tsx` (`TEST_GLOBS` at `:31-36`), so
deleting a `.sh` test file does not trip it. No change needed there.

**Recommended model.** `sonnet`.

**Dependencies.** Unit 2.

### Unit 4 — Verification and fixups

**Scope.** Run the full verification block below. Fix any failure by
adjusting the split (widening a range, promoting a helper to the fixture, or
correcting a sub-split boundary) and re-running the extractor from Unit 2's
manifest. Re-run Check A after every fixup.

**Out of scope, categorically.** Editing, weakening, skipping, deleting, or
"fixing" any test to make a generated file pass
(`.claude/rules/test-integrity.md`). A red generated file means the split is
wrong, not the test.

**Recommended model.** `sonnet`; escalate to `opus` if a failure requires
re-classifying a section's home.

**Dependencies.** Unit 3.

## Reuse

- **`test-dispatch-derive-node-target.sh:11-15`** — the canonical per-file
  template shape (`set` line, `SCRIPT_DIR="$(cd "$(dirname "$0")" &&
  pwd…)"`, `source` of a shared helper, `SUT=` binding, trailing
  `report_results`). The generated header follows it, substituting
  `set -euo pipefail` (the monolith's setting) and the new fixture.
- **`test-helpers.sh`** — reused unchanged by `test-dispatch-phase-model.sh`
  for the §52 append (its `assert_eq` and `report_results` are call-site-
  compatible with the moved body). Not extended, not modified.
- **`run-unit-tests.sh:186-204`** — the existing `test-*.sh` glob; every new
  file is discovered by it with no runner edit, because the fixture is
  deliberately named outside the glob.
- **`run-unit-tests.sh --pr-scripts`** — the standalone, no-setup entry point
  for the whole directory's suite; use it as the CI-equivalent verification
  command.
- **The monolith's own `assert_eq`/`report_results`/`setup`/`teardown`/`make_pr*`/`pr_list_tmpfile`/`write_rest_check_runs`**
  — moved, not rewritten, so all ~2,543 call sites keep working with zero
  call-site edits.
- **`test-pid-cleanup.sh` / `packages/intentionsutil/scripts/test-graph-commit.sh`**
  — precedent that a test file may carry its own counters instead of sharing a
  helper. Explicitly *not* followed here: consistency across 88 sibling files
  matters more than matching those two outliers.

## Verification

Capture the baseline from `origin/main`, before any edit — either checked out
in a scratch clone, or by recording the two integers below from a clean
`origin/main` run and pasting them into the PR description as
`BEFORE_PASS`/`BEFORE_TOTAL`:

```verify
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git fetch origin main --quiet
git show origin/main:.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh \
  > /tmp/monolith-baseline.sh
wc -l /tmp/monolith-baseline.sh   # expect 31514
```

**V1 — every new test file passes when invoked directly (mirrors how the
runner invokes them):**

```verify
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
S=.claude/skills/dispatch-propagate/scripts
fail=0
for f in "$S"/test-*.sh; do
  [[ "$(basename "$f")" == "test-helpers.sh" ]] && continue
  if ! "$f" >/tmp/out.$$ 2>&1; then echo "FAIL: $f"; tail -30 /tmp/out.$$; fail=1; fi
done
[ "$fail" -eq 0 ] && echo "V1 OK: all test-*.sh exit 0"
exit "$fail"
```

**V2 — the monolith is gone and the fixture is not globbed as a test:**

```verify
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
S=.claude/skills/dispatch-propagate/scripts
test ! -e "$S/test-dispatch-scripts.sh" || { echo "FAIL: monolith still present"; exit 1; }
test -f "$S/dispatch-test-fixture.sh"    || { echo "FAIL: fixture missing"; exit 1; }
case "$(basename "$S/dispatch-test-fixture.sh")" in
  test-*) echo "FAIL: fixture matches the test-*.sh glob"; exit 1 ;;
esac
for f in "$S"/test-*.sh; do
  [[ "$(basename "$f")" == "test-helpers.sh" ]] && continue
  test -x "$f" || { echo "FAIL: not executable: $f"; exit 1; }
done
echo "V2 OK"
```

**V3 — line-multiset parity (the test-integrity gate):**

```verify
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
S=.claude/skills/dispatch-propagate/scripts
sed -n '7,31510p' /tmp/monolith-baseline.sh | LC_ALL=C sort > /tmp/parity-before.txt
{
  awk '/^# >>> MOVED FROM test-dispatch-scripts\.sh >>>$/{i=1;next}
       /^# <<< END MOVED <<<$/{i=0} i' "$S/dispatch-test-fixture.sh"
  for f in "$S"/test-*.sh; do
    awk '/^# >>> MOVED FROM test-dispatch-scripts\.sh >>>$/{i=1;next}
         /^# <<< END MOVED <<<$/{i=0} i' "$f"
  done
} | LC_ALL=C sort > /tmp/parity-after.txt
if diff -u /tmp/parity-before.txt /tmp/parity-after.txt > /tmp/parity.diff; then
  echo "V3 OK: line multiset identical ($(wc -l < /tmp/parity-before.txt) lines moved)"
else
  echo "V3 FAIL: $(grep -c '^-' /tmp/parity.diff) lines lost, $(grep -c '^+' /tmp/parity.diff) lines added"
  head -60 /tmp/parity.diff; exit 1
fi
```

**V4 — every `test-*.sh` in the directory is actually globbed and run by the
runner, and the group passes:**

```verify
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
S=.claude/skills/dispatch-propagate/scripts
"$S/run-unit-tests.sh" --pr-scripts 2>&1 | tee /tmp/pr-scripts.log
for f in "$S"/test-*.sh; do
  n=$(basename "$f")
  [[ "$n" == "test-helpers.sh" ]] && continue
  grep -qF -- "--- $n ---" /tmp/pr-scripts.log || { echo "FAIL: never globbed: $n"; exit 1; }
done
grep -q '^FAIL: ' /tmp/pr-scripts.log && { echo "FAIL: a suite failed"; exit 1; }
echo "V4 OK: $(grep -c -- '^--- ' /tmp/pr-scripts.log) suites globbed and green"
```

**V5 — runtime assertion-count parity across the group (`BEFORE_PASS`/`BEFORE_TOTAL`
are the two integers recorded from origin/main above):**

```verify
set -euo pipefail
read -r AFTER_PASS AFTER_TOTAL < <(
  grep -oE '^Results: [0-9]+/[0-9]+ passed, [0-9]+ failed' /tmp/pr-scripts.log \
  | awk -F'[ /,]' '{p+=$2; t+=$3} END{printf "%d %d\n", p, t}')
echo "after: $AFTER_PASS/$AFTER_TOTAL   before(origin/main): $BEFORE_PASS/$BEFORE_TOTAL"
[ "$AFTER_TOTAL" -eq "$BEFORE_TOTAL" ] || { echo "FAIL: assertion count changed by $((AFTER_TOTAL-BEFORE_TOTAL))"; exit 1; }
[ "$AFTER_PASS"  -eq "$AFTER_TOTAL"  ] || { echo "FAIL: $((AFTER_TOTAL-AFTER_PASS)) assertions failing"; exit 1; }
echo "V5 OK: assertion count preserved exactly"
```

**V6 — no executable reference to the deleted file survives:**

```verify
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1
hits=$(LC_ALL=C git grep -an 'test-dispatch-scripts\.sh' -- \
  '.github/*.yml' '.github/*.yaml' '.github/*.sh' \
  '.claude/*.yml' '.claude/*.yaml' '.claude/*.sh'); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
if [ -n "$hits" ]; then
  echo "Remaining references (each must be a PROSE comment, never a run: / exec):"
  printf '%s\n' "$hits"
  # Strip git grep's leading `path:line:` before applying the ^-anchored
  # executable shapes: without this the anchors can never match and the guard
  # is dead.
  execs=$(printf '%s\n' "$hits" | LC_ALL=C sed 's/^[^:]*:[0-9]*://' \
    | LC_ALL=C grep -nE 'run:[[:space:]]|^[[:space:]]*(bash|sh|source|\.)[[:space:]]|^[[:space:]]*\./')
  if [ -n "$execs" ]; then printf '%s\n' "$execs"; echo "FAIL: executable reference"; exit 1; fi
fi
test -f .github/workflows/unit-tests.yml || { echo "FAIL: .github/workflows/unit-tests.yml missing"; exit 1; }
wf=$(LC_ALL=C git grep -an 'test-dispatch-scripts' -- .github/workflows/unit-tests.yml); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$wf" ] || { printf '%s\n' "$wf"; echo "FAIL: workflow still invokes it"; exit 1; }
echo "V6 OK"
```

### Manual / prose verification

V3 proves every line survived byte-for-byte, and V5 proves every assertion
still executes — together those are close to complete. What they cannot prove
is that each test landed in a file whose *name and header* describe it
correctly. Recommended human review, roughly 30–45 minutes:

1. **Read the diffstat, not the diff.** `git diff --stat origin/main...HEAD`
   should show one ~31.5k-line deletion, one ~1.3k-line fixture addition, and
   ~88 additions whose line counts sum to ~30.2k. Any file whose added line
   count does not match its manifest range width (± the ~10-line boilerplate
   header) is a boundary error — chase it.
2. **Spot-check the seven fixture promotions.** For each of the seven Block-B
   entries, confirm the symbol appears exactly once in the fixture and zero
   times in any `test-*.sh`, and that both its producer and its consumer file
   pass:
   `grep -rn 'lock_setup\|log_state\|tw_resets_for_x\|merge_main_setup\|select_target_fake_claude\|write_fake_spawn_router_claude\|assert_contains_local' .claude/skills/dispatch-propagate/scripts/`.
3. **Spot-check the seven sub-splits** (§85a–d, §86a–c, §94a–b) by opening
   each pair of adjacent generated files and confirming the first file ends
   on a complete teardown and the second begins on its own
   `echo ""` / `echo "=== … ==="` banner with no orphaned `fi`/`done`/`}`.
4. **Spot-check three merged files** (`test-dispatch-sweep.sh`,
   `test-dispatch-spawn-sweep.sh`, `test-dispatch-spawn-job.sh`) to confirm
   the helper-defining section precedes its consumer section in file order.
5. **Sample five random new files** and read the header comment: does the
   named SUT match what the body actually invokes
   (`grep -o '\$SCRIPT_DIR/[a-z-]*' <file> | sort -u`)? A mismatch is a
   naming bug, not a correctness bug, but it is the whole point of the tactic
   — a wrongly-named file will attract the wrong future edits and re-create
   the conflict problem in miniature.
6. **Confirm the `qa-fix` marker pair** (`.claude/workflows/qa-fix.js:222`
   and `qa-fix-partition-probe.mjs:28`) are still byte-identical to each
   other, since §81 matches that literal at runtime.
