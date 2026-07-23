---
id: tactic-main-health-signal-attribution
kind: tactic
statement: main-health must fail closed on an empty check set and ignore
  check-runs attributable to another branch's workflow
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-23 /align-strategy round on the wezterm
  pin. Two verified defects in the same read path: repo-health's
  main_broken_sha() counts FAILING checks, so zero checks reads as green
  (fail-open); and graph-commit fast-forwards a graph/** scratch sha onto main,
  so Graph Fast Path check-runs attach to main's sha and are read as main's
  health (false attribution, in both directions). Diagnosis and live evidence:
  strategy-main-health's 2026-07-23 clarifications. Hard constraint:
  success_signal.threshold is compared for EXACT string equality against
  readMainHealth()'s return value by deriveGap, so the two must change in one
  commit or the node acquires a permanent false red at attention boost 100.
  Finalized by a 2026-07-23 /align-tactics per-node pass: the plan below leaves
  the confirmed-green literal byte-identical (no strategy edit needed) and
  signals the new indeterminate empty/misattributed state via a non-zero exit
  code, which the three existing bash callers (dispatch-select-tick,
  dispatch-graph-main-red-sync) already treat as 'not confirmed green' without
  deadlocking the auto-heal completion path."
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-main-health-signal-attribution
  pr: 2954
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# main-health must fail closed on an empty check set and ignore check-runs attributable to another branch's workflow

## Context

`main-health` is the sensor behind `strategy-main-health` (attention boost
100). Its probe, `.claude/skills/dispatch-propagate/scripts/repo-health`'s
`main_broken_sha()`, has two verified defects in one read path: (1) it only
prints the HEAD sha when a *failing* check count exceeds zero, so a HEAD with
**zero** checks reads as green (fail-open); (2) it reads
`/commits/{sha}/check-runs`, which returns every check-run posted against a
sha regardless of the branch that triggered it — and `graph-commit`
fast-forwards a `graph/**` scratch sha (carrying Graph Fast Path check-runs)
directly onto `main`, so those foreign check-runs are read as main's health
(false attribution, verified 2026-07-23: 18 foreign check-runs, 2
`guard: failure`, falsely red). This tactic fixes both: attribute check-runs
to their triggering branch via the check-suites API, keep only main's own,
and fail **closed** when the attributable set is empty.

**Threshold-coupling determination (firm): `intentions/strategy-main-health.md`'s
`success_signal.threshold` does NOT need editing.** `deriveGap`
(`packages/intentionsutil/src/sensors.ts:98-111`) compares the threshold for
trimmed/case-insensitive equality against `readMainHealth()`'s return value.
This plan leaves the "confirmed green" case byte-identical (empty probe
stdout + exit 0 → the existing green literal, unchanged) and only *adds* a
new non-matching string for the new indeterminate state. Per the hard
constraint, adding new distinct non-matching strings requires no strategy
edit; those strings keep `gap` non-null by construction (fail closed). The
existing test `main-health-sensor.test.ts:39-46` (which asserts the green
literal equals the strategy's recorded threshold read from disk) stays valid
and guards this.

**Protocol design decision (the load-bearing choice).** The new
"empty/misattributed check set" state is signalled by **exit code 3 with the
token `NO_ATTRIBUTABLE_CHECKS` on stdout** — *not* by an exit-0 stdout
sentinel. Reason: three bash callers gate on `repo-health --main-broken-sha`
and all treat *non-empty stdout at exit 0* as "main is broken":
- `dispatch-graph-main-red-sync:75` (`if ! MB_SHA=$(...); then
  MB_SHA=UNKNOWN`) — auto-heal completer.
- `dispatch-select-tick:632` and `:853` (`MB=$(...) && [[ -n "$MB" ]]`) —
  main-broken diagnose bypass.

An exit-0 stdout sentinel would make `dispatch-select-tick` spawn
`diagnose-main` and write a `tactic-main-red-*` node on *every benign empty
set* — and since empty sets are the common steady state (the strategy
clarifications note graph-only/nix-only commits to main trigger no workflow
at all), that node could **never auto-heal** (completion requires empty
stdout = confirmed green, which a persistently-empty main never returns) → a
permanent auto-merge gate. Exiting **non-zero** makes every caller's
`&&`/`if !` short-circuit to "indeterminate": the sensor fails *closed* (gap
non-null) while the dispatch gate does not deadlock. This asymmetry is
deliberate and correct — the tactic constrains the *signal* ("fail closed on
an empty check set"), not the work-start gate, which must not halt the whole
chain whenever main's HEAD is a graph commit. The `set -e` in the mode
dispatch already aborts before the latch write on a non-zero probe, so the
durable `main_broken` latch is left untouched on the indeterminate reading
(never a fake-sha latch, never a spurious clear). Verified live against both
callers (`dispatch-select-tick:632,853`, `dispatch-graph-main-red-sync:75`):
each already treats a non-zero exit as "not confirmed green" without
deadlocking.

Final stdout/exit protocol for `repo-health --main-broken-sha`:

| condition | stdout | exit |
|---|---|---|
| confirmed green (attributable checks present, none failing) | *(empty)* | 0 |
| confirmed red (≥1 **attributable** failing check) | `<sha>` | 0 |
| empty / all-misattributed set | `NO_ATTRIBUTABLE_CHECKS` | 3 |
| probe error (gh failed) | *(empty)* | 1 |

`readMainHealth()` maps: empty+0 → green literal (unchanged); sha+0 → red
phrase (unchanged); throw with `err.stdout` trimming to
`NO_ATTRIBUTABLE_CHECKS` → a new distinct "unknown: empty/misattributed set"
string; any other throw → `"unknown"` (unchanged). All non-green strings ≠
threshold → gap non-null.

## Unit 1 — Attribution + fail-closed in `main_broken_sha()` and the `--main-broken-sha` mode dispatch

**Scope.** `.claude/skills/dispatch-propagate/scripts/repo-health` only.

- Rewrite `main_broken_sha()` (`:178-201`):
  - After fetching `sha` (`:183`) and the raw check-runs (`:185-187`), add an
    **attribution filter**. Extract the distinct `check_suite.id`s from
    `.check_runs[]`; for each distinct id, resolve its triggering branch via a
    new `gh_retry gh api "repos/{owner}/{repo}/check-suites/$id"` call reading
    `.head_branch`; keep an id only when `head_branch == "main"`. Then count
    only check-runs whose `.check_suite.id` is in that kept set. CodeQL
    default-setup analyses carry `head_branch: main` (kept, correct); Graph
    Fast Path suites carry `head_branch: graph/...` (dropped, correct); a
    `null`/other branch is dropped (conservative — unknown attribution never
    counts as main's own).
  - Compute `cr_fail` = attributable check-runs with conclusion in the
    existing `$fail` set; `cr_items` = attributable check-runs of any
    conclusion (the "an item exists" count per Defect 1's "zero total items"
    definition — this preserves the current "only in-progress → green"
    contract for attributable in-progress checks).
  - The workflow-runs half (`:192-196`) is already correctly
    `--branch main`-filtered — leave its failure logic, but also compute
    `wf_items` = runs matching `headSha == sha` (any conclusion).
  - Decision: `cr_fail>0 || wf_fail>0` → `printf '%s\n' "$sha"; return 0`
    (red). Else if `cr_items + wf_items == 0` → `return 3` (empty/misattributed
    → fail closed; no stdout). Else → `return 0`, print nothing (green).
- Rewrite the `--main-broken-sha` mode block (`:234-249`) so the exit-3 case
  is handled without `set -e` swallowing it: capture `SHA=$(main_broken_sha)
  || rc=$?`; on `rc==3` print the `NO_ATTRIBUTABLE_CHECKS` token and `exit 3`
  **without** touching the latch; on any other non-zero `rc` `exit 1` (latch
  untouched, existing probe-error contract); on `rc==0` run the existing latch
  reconcile (`:240-246`) + print sha + `exit 0` unchanged.
- Update the header doc block: the `--main-broken-sha` description (`:59-67`),
  the two-source comment (`:169-177`), and the exit-codes list (`:92-96`) to
  document exit 3 / the `NO_ATTRIBUTABLE_CHECKS` token / the new check-suites
  round-trip. Define the token as a single constant.

**Out of scope.** `graph-commit`'s fast-forward mechanic (`:674-752`) is
*not* changed — the sha-sharing is intended; this tactic corrects the
*reader*, not the writer. No edits to `dispatch-select-tick`,
`dispatch-graph-main-red-sync`, or `dispatch-tick` (their empty-vs-nonempty /
`if !` handling is already correct for a non-zero exit — verified above).

**Recommended model.** `opus` — judgment-heavy: the four-state exit/stdout
protocol, `set -e`-safe latch semantics, an unfamiliar second gh round-trip,
and the attribution edge cases (null/foreign `head_branch`).

## Unit 2 — Map the indeterminate token in `readMainHealth()`

**Scope.** `packages/intentionsutil/scripts/read-sensors.ts`,
`readMainHealth()` (`:169-180`) only. In the `catch` block, inspect the
thrown error's captured `stdout` (`execFileSync` with
`stdio:["ignore","pipe","ignore"]` + `encoding:"utf8"` attaches `err.stdout`
as a string): if it trims to `NO_ATTRIBUTABLE_CHECKS`, return a new fixed
phrase, e.g. `"unknown: no check on the current origin/main HEAD is
attributable to main's own workflow (empty or misattributed check set) —
cannot confirm green"`; otherwise return `"unknown"` (unchanged). The success
path (empty→green literal, sha→red phrase) is unchanged. Narrow `err` without
an `as` cast (mirror the file's `isPlainObject` predicate style at `:222`).
Update the doc comment (`:138-161`) to record the third reading and that the
green literal remains the frozen threshold-matching case.

**Out of scope.** No change to the green literal (`:177`), the red phrase
(`:179`), `deriveGap`, or the registry.

**Dependencies.** Unit 1 (must agree on the `NO_ATTRIBUTABLE_CHECKS` token).

**Recommended model.** `sonnet` — small, well-specified branch addition with
a clear diff shape.

## Unit 3 — Real `main_broken_sha` coverage in the bash harness

**Scope.** `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.

- Add a **new gh-stub case** for the check-suites round-trip, alongside the
  existing three at `:960-982`: match `api\ repos/*/check-suites/*)`, parse
  the id, serve `$STUB_DIR/main-check-suite-<id>.json` or default to
  `{"head_branch":null}`. (Same `$args`-pattern + `$STUB_DIR/<fixture>.json`
  shape as the existing branches.)
- Add a dedicated test section (own `setup`/`teardown`, like the `gh_retry` /
  assert-worktree-fresh sections) that exercises the **real** binary at
  `"$SCRIPT_DIR/repo-health" --main-broken-sha` — *not* the whole-binary fake
  at `:21298`. `setup` already puts the stub `gh` first on `PATH` and copies
  `lib.sh`; set `REPO_HEALTH_STATE_FILE="$TMPDIR_TEST/rh.json"` to sandbox the
  latch write. Write the now-live fixtures (`main-commit.json`,
  `main-check-runs.json`, `main-run-list.json`, `main-check-suite-<id>.json`)
  per case and assert stdout + exit code:
  1. **Empty set** — check-runs `{"check_runs":[]}`, run-list `[]` → stdout
     `NO_ATTRIBUTABLE_CHECKS`, exit 3.
  2. **All-misattributed** — check-runs all with `check_suite.id: 999` incl.
     a `guard: failure`; `check-suites/999` → `{"head_branch":"graph/foo"}` →
     dropped → stdout `NO_ATTRIBUTABLE_CHECKS`, exit 3 (regression guard for
     the live 2026-07-23 false-red).
  3. **Attributable green** — check-runs `check_suite.id: 111` all `success`;
     `check-suites/111` → `{"head_branch":"main"}` → empty stdout, exit 0.
  4. **Attributable red** — an attributable (`suite 111`, `head_branch main`)
     check with `conclusion: failure` → stdout = the fixture sha, exit 0.
  5. **Workflow-run red** — check-runs empty but `main-run-list.json` carries
     a `failure` run matching the sha → stdout = sha, exit 0 (the
     already-correctly-filtered half still trips).
  6. (Optional) **Mixed** — one `main` suite `success` + one `graph/**` suite
     `failure` → the foreign failure is ignored → empty stdout, exit 0.

**Out of scope.** Do not convert existing `dispatch-select-tick` tests or the
whole-binary fake at `:21298`. (A regression test that `dispatch-select-tick`
does not bypass on exit 3 would require adding a return-code knob to that
fake — noted as a possible follow-up, not required here.)

**Dependencies.** Unit 1.

**Recommended model.** `sonnet` — unit-test writing with explicit cases
against a documented stub, once Unit 1 fixes the protocol.

## Unit 4 — Sentinel mapping test in `main-health-sensor.test.ts`

**Scope.** `packages/intentionsutil/test/main-health-sensor.test.ts`. Extend
`fakeBinary` (`:17-29`) with an `"empty"` behavior emitting the token and
exiting non-zero (`#!/bin/sh\necho NO_ATTRIBUTABLE_CHECKS\nexit 3\n`). Add a
`readMainHealth` case asserting that binary maps to the new indeterminate
string and that the string `!==` `GREEN_READING` (so `deriveGap` would keep
`gap` non-null). Keep the existing green/red/unknown cases and the
threshold-equality assertion (`:39-46`) intact — the latter continues to
prove the green literal still equals the strategy's recorded threshold (i.e.
no strategy edit was needed).

**Dependencies.** Unit 2.

**Recommended model.** `sonnet` — mechanical test addition mirroring the
existing three cases.

## Reuse

- `gh_retry` — `.claude/skills/dispatch-propagate/scripts/lib.sh:125` — wrap
  the new `gh api check-suites/{id}` call (transient-retry, consistent with
  the other two probes).
- `deriveGap` — `packages/intentionsutil/src/sensors.ts:98` — unchanged; the
  plan relies on its exact `reading === threshold` equality so new
  non-matching strings yield a non-null gap.
- The dead-but-wired gh-stub fixture branches —
  `test-dispatch-scripts.sh:960-982` — activated by Unit 3; the new
  check-suites case is added in the same `$args`-pattern +
  `$STUB_DIR/<fixture>.json` style.
- `assert_eq` / `setup` / `teardown` harness —
  `test-dispatch-scripts.sh:21-41, 49, 1204` — the new section reuses them
  (stub `gh` already first on `PATH`, `lib.sh` already copied,
  `GH_RETRY_BASE_DELAY=0`).
- `fakeBinary` fixture helper — `main-health-sensor.test.ts:17` — extended
  for the token case.
- `isPlainObject`-style non-`as` narrowing — `read-sensors.ts:222` — pattern
  to narrow the caught error for `err.stdout`.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Run both from the repo root. The first covers Units 2 and 4 (`readMainHealth`
green/red/unknown/empty-set mappings, threshold equality, registry). The
second covers Units 1 and 3 (the real `main_broken_sha` protocol across the
six fixture cases) and must show no regressions across the existing
dispatch-select-tick/graph-main-red-sync suites.

Manual/observe-in-production (not auto-runnable — needs live gh + real
check-suites): after merge, run
`.claude/skills/dispatch-propagate/scripts/repo-health --main-broken-sha`
against a HEAD known to be a graph-only fast-forward (only Graph Fast Path
check-runs) and confirm it exits 3 with `NO_ATTRIBUTABLE_CHECKS` rather than
empty stdout; then against a HEAD carrying a real failing merge-gating check
and confirm the sha prints. Then run
`npx tsx packages/intentionsutil/scripts/read-sensors.ts` and confirm
`strategy-main-health`'s `reading` shows the new "empty or misattributed
check set" phrase (not a vacuous green) with `gap` non-null, and that the
durable `repo-health` state file's `main_broken` latch was left unchanged by
the indeterminate read.
