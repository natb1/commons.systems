---
id: tactic-ci-verdict-conclusion-authoritative
kind: tactic
statement: CI-verdict sensing must treat a check-run's non-null conclusion as
  authoritative regardless of its status field — a check left at
  status:in_progress with conclusion:success is concluded-success, not pending
owner: ai
status: codified
parent: null
rationale: "Surfaced from the #2790 (tactic-graph-commit-prune-support) incident
  on the 2026-07-07 emulated router tick: GitHub left the required
  test-integrity check-run at status:in_progress while its conclusion was
  already success (a known GitHub check-runs bug where the status field is not
  always advanced to completed after the conclusion is populated). The emulating
  router read status!=completed as 'CI verdict not present' and wrongly held
  #2790's review->done as CI-gated for the whole tick. The verdict is the
  conclusion; the status field must never be the gate when conclusion is
  non-null. /align-tactics finalize (2026-07-18) found the two originally-named
  sensor sites (graph-select-target, dispatch-ci-ready) already carry this fix:
  both consume dispatch_classify_rollup (lib.sh:692), which PR #2457 (merged
  2026-06-23, predating this tactic's own 07-07 incident) already hardened
  against the desynced-status case, with fixture coverage in
  test-dispatch-scripts.sh:1363-1370 matching this tactic's own Verification
  bar. The 07-07 incident was therefore a bootstrap-emulating session bypassing
  that already-fixed sensor, not a code gap in it. A genuine third site of the
  same bug survives, unrelated to the strategy record:
  packages/intentionsutil/scripts/graph-commit's await_checks() — the
  graph-native landing primitive this very skill depends on — polls check-runs
  with its own inline jq filter requiring status==\"completed\" AND
  conclusion==\"success\", so a desynced check (status stuck in_progress,
  conclusion already success) never counts toward its four-required-checks
  threshold and the poll spins to timeout. This round's plan lands that fix."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-ci-verdict-conclusion-authoritative
  pr: 2909
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# CI-verdict sensing: conclusion is authoritative, status is not the gate

## Context

On the 2026-07-07 emulated graph-native router tick, PR #2790
(`tactic-graph-commit-prune-support`, the `--prune`/`--base` primitive the
owed-prune carry-forward is waiting on) carried a single `test-integrity`
check-run stuck at `status: in_progress` with `conclusion: success` for
hours (unchanged across repeated polls). This is a known GitHub check-runs
bug: the `status` field is not always advanced to `completed` after the
`conclusion` is populated. The rule the graph-native dispatcher must follow:
a non-null `conclusion` is the verdict, whatever `status` says; only
`conclusion == null` is genuinely pending.

**Finalize-round finding (2026-07-18):** the two sensor sites originally named
in this tactic's scope are already fixed. Both
`.claude/skills/dispatch-propagate/scripts/graph-select-target` (via its call
to `dispatch-ci-ready`) and `dispatch-ci-ready` itself (via
`dispatch_ci_verdict_rest`) resolve their verdict through
`dispatch_classify_rollup` (`.claude/skills/dispatch-propagate/scripts/lib.sh:692`),
whose pending check at `lib.sh:736` already reads
`(.conclusion // "") == "" and .status != "COMPLETED"` — a non-null
`conclusion` short-circuits the `and`, so status is never consulted once a
conclusion exists. This was landed in PR #2457 ("Fix dispatch_classify_rollup
so a check-run with a non-null terminal conclusion is classified as concluded
even when status is stuck at in_progress..."), merged 2026-06-23 — twelve days
*before* this tactic's own 07-07 incident — with fixture coverage in
`test-dispatch-scripts.sh:1363-1370` that already exercises exactly the
`{status: in_progress, conclusion: success}` case this tactic's original
Verification section called for. The 07-07 incident was a bootstrap-emulating
session bypassing that already-fixed mechanized sensor (hand-reading
`status`/`conclusion` instead of invoking `dispatch-ci-ready`/
`graph-select-target`), not a code gap in either named site.

A genuine third site of the *same* bug pattern survives, independent of the
strategy record and not previously named in this tactic: **`graph-commit`'s
own `await_checks()`** (`packages/intentionsutil/scripts/graph-commit:397-439`)
— the poll loop that stamps the four branch-protection-required checks
(`acceptance`, `preview-and-smoke`, `lint`, `unit-tests`) before a graph write
can land on `main`. This is the landing primitive `/align-tactics` itself
depends on (see this skill's own Step 5), so the bug is live in the
graph-native dispatch path today. Its inline `--jq` filter
(`graph-commit:409-414`) requires `.status=="completed" and
.conclusion=="success"` for a pass and `.status=="completed" and
.conclusion!="success"` for a fail — so a desynced check-run (`status:
in_progress`, `conclusion: success` already populated) satisfies *neither*
condition, never counts toward the four-of-four threshold, and the poll spins
to the timeout/busy-main error even though the check has already concluded.
This plan lands the fix at that one remaining site.

## Unit 1 — fix `await_checks()`'s classification and its regression coverage

**Recommended model:** sonnet (a single well-scoped jq-condition fix plus a
matching fixture-driven test, in one already-understood function; no design
judgment required).

**Scope:**

- `packages/intentionsutil/scripts/graph-commit:409-414` — the `--jq` filter
  inside `await_checks()`. Change the two `select(...)` predicates from
  requiring `.status=="completed" and .conclusion==...` to keying off
  `.conclusion` alone, mirroring `dispatch_classify_rollup`'s `(.conclusion //
  "")` idiom (`lib.sh:707-720,731-742`) so a JSON `null` conclusion (the only
  genuinely-pending case) is excluded without depending on `status`:
  - success count: `select((.conclusion // "") == "success")`
  - fail count: `select(((.conclusion // "") != "") and (.conclusion !=
    "success"))`
  Do not change the four-required-*names* filter (`.name=="acceptance" or
  ...`) or the surrounding poll/timeout/retry structure in `await_checks()` —
  only the two `select` predicates inside the `--jq` program.
- `packages/intentionsutil/scripts/graph-commit:381-382` and `:406-408` —
  update the two comments that currently describe the classification as
  "completed/success" / "completed/non-success" so they describe the fixed
  conclusion-only semantics (one line each is enough; note the desynced-status
  case it now tolerates, referencing the mirrored fix in
  `dispatch_classify_rollup` for context).
- `packages/intentionsutil/scripts/test-graph-commit.sh` — the `gh` PATH shim
  (`:118-130`) currently ignores its real arguments and returns a hardcoded
  `"4 0"` / `"0 0"` / `"3 1"` string per `$GC_GH_MODE_FILE` mode, so it never
  exercises the real `--jq` filter in `graph-commit` — a bug in that filter
  would not be caught by the existing suite. Rewrite the shim so it runs the
  **actual** `--jq` program `graph-commit` passes (extracted from `"$@"`)
  against a mode-specific fixture JSON file, so the test exercises the real,
  unmodified filter with zero duplication (the same fidelity `lib.sh`'s
  `verdict_rest_case` test helper already gets for `dispatch_ci_verdict_rest`
  by shimming only the raw `gh api` fetch, not the classification):

  ```bash
  # replaces the body of $WORK/bin/gh (lines 118-130)
  #!/usr/bin/env bash
  echo "gh-invocation" >>"$GC_GH_CALL_LOG"
  mode="$(cat "$GC_GH_MODE_FILE")"
  if [[ "$mode" == "hard-fail" ]]; then
    echo "gh: HTTP 403: API rate limit exceeded (harness shim)" >&2
    exit 1
  fi
  jq_program=""
  while [[ $# -gt 0 ]]; do
    if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
    shift
  done
  fixture="$GC_FIXTURE_DIR/$mode.json"
  [[ -f "$fixture" ]] || { echo "gh shim: no fixture for mode $mode" >&2; exit 99; }
  jq -r "$jq_program" "$fixture"
  ```

  Add a `GC_FIXTURE_DIR="$WORK/fixtures"` directory (mkdir it alongside
  `$WORK/bin`) with one `{status,conclusion}`-shaped fixture file per existing
  mode, each a `{"check_runs": [...]}` object with four entries named
  `acceptance`/`preview-and-smoke`/`lint`/`unit-tests` (REST field names are
  lowercase, matching the real API and the filter's literals):
  - `green.json` — all four `{"status": "completed", "conclusion": "success"}`
  - `pending.json` — all four `{"status": "in_progress", "conclusion": null}`
  - `concluded-fail.json` — three `success`, one `{"status": "completed",
    "conclusion": "failure"}`
  Export `GC_FIXTURE_DIR` alongside the existing `GC_GH_MODE_FILE`/
  `GC_GH_CALL_LOG` exports in `run_gc()` (`test-graph-commit.sh:166`).
  Re-run the existing suite once this lands and confirm cases 1-16 still pass
  unchanged — the fixtures must reproduce the same `"4 0"`/`"0 0"`/`"3 1"`
  counts the old hardcoded strings gave, so no other case's assertions move.
- Add one new case to `packages/intentionsutil/scripts/test-graph-commit.sh`,
  placed after Case 7 (pending timeout, ends around line 283) and renumbered
  into the file's own header list (currently cases 1-16 at lines 13-46):
  a `desynced-success.json` fixture — three checks `{"status": "completed",
  "conclusion": "success"}`, one `{"status": "in_progress", "conclusion":
  "success"}` (the exact desync this tactic's rationale describes) — and a new
  seed node id (e.g. `t-desync`, added to the `seed_node` loop at
  `test-graph-commit.sh:93-97`) landed with `set_mode desynced-success; run_gc
  "$A" t-desync`. Assert `rc -eq 0` and that the edit lands on `main`
  (`origin_show t-desync`), proving the fixed filter counts the desynced entry
  as the fourth success and lands immediately rather than spinning to the
  busy-main timeout the pre-fix filter would hit.

**Dependencies:** none — a single self-contained unit.

## Reuse

- `dispatch_classify_rollup`'s `(.conclusion // "")` idiom
  (`.claude/skills/dispatch-propagate/scripts/lib.sh:707-742`) is the pattern
  to mirror for the `--jq` predicate rewrite — do not invent a different null
  check.
- `test-dispatch-scripts.sh`'s `verdict_rest_case` helper (defined at line
  1335) is the precedent for shimming only the raw `gh` fetch and letting the real
  classification code run unmodified — the same fidelity bar the
  `test-graph-commit.sh` shim rewrite above targets.
- Do **not** reuse `dispatch_classify_rollup` itself inside `await_checks()`:
  its "all present entries pass → passing" contract treats an empty rollup as
  `pending` but has no notion of "must have exactly N named entries", so if
  GitHub has only created 3 of the 4 required check-run objects so far (a
  normal transient state early in the ~30-60s fast-path stamp window),
  `dispatch_classify_rollup` would wrongly report `passing` on 3/4. Keep
  `await_checks()`'s own explicit `nsucc -eq 4` count-based gate; only fix its
  per-entry conclusion test.

## Verification

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

Confirms: cases 1-16 (renumbered as needed) still pass with the rewritten
fixture-driven shim, and the new desynced-success case exits 0 and lands the
edit on `main` rather than exhausting `GC_ATTEMPTS` on a busy-main timeout.

Manual cross-check (optional, not required for landing): re-run the fixed
`--jq` program directly against a hand-built desynced fixture —

```bash
echo '{"check_runs":[{"name":"acceptance","status":"in_progress","conclusion":"success"},{"name":"preview-and-smoke","status":"completed","conclusion":"success"},{"name":"lint","status":"completed","conclusion":"success"},{"name":"unit-tests","status":"completed","conclusion":"success"}]}' \
  | jq -r '[.check_runs[] | select(.name=="acceptance" or .name=="preview-and-smoke" or .name=="lint" or .name=="unit-tests")] | "\([.[]|select((.conclusion // "")=="success")]|length) \([.[]|select(((.conclusion // "") != "") and (.conclusion != "success"))]|length)"'
```

should print `4 0` (all four counted as success despite the first entry's
desynced `status`).
