---
id: tactic-test-decision-log-prod-leak
kind: tactic
statement: two dispatch test scripts do not override the decision-log path, so
  their fixture records append to the production routing-decisions.jsonl that
  the fleet's own defect detects read as evidence
owner: ai
status: codified
parent: null
rationale: >-
  Found 2026-07-31 during a fleet health read, while running the bootstrap
  plan's bug-N detect. The detect (tail routing-decisions.jsonl | jq
  'select(.effective_live==null or .effective_live>3)') reported three null
  readings at 16:55-16:56Z. Those readings are not router behaviour at all: they
  are test fixtures. The records name node tactic-some-node and session UUIDs
  aaaa1111-1111-1111-1111-111111111111 / bbbb2222-2222-2222-2222-222222222222,
  and they match select(.effective_live==null) only because standdown-declared
  records carry no effective_live field.


  Mechanism, verified at record time. lib-decision-log.sh:68 resolves the log as
  DISPATCH_DECISION_LOG_FILE, else DISPATCH_DECISION_LOG_DIR, else
  $HOME/.local/share/commons-dispatch/routing-decisions.jsonl. 15 fixture
  records were present in the production log at record time, timestamped 07:56Z,
  07:58Z, 13:59Z and 16:55-16:56Z on 2026-07-31.


  Corrected at plan time (2026-07-31/08-01), superseding the record-time
  attribution above: test-dispatch-standdown.sh is the SOLE leaker, not two
  scripts. Dynamically verified by running each suite with HOME redirected to a
  scratch dir: test-dispatch-standdown.sh leaks (3 records + a .lock file appear
  under the fake HOME per run — it drives dispatch-standdown as a subprocess,
  which sources lib-decision-log.sh and appends), while
  test-dispatch-stop-hook.sh does NOT leak (29/29 pass, zero files created under
  the fake HOME; its primary block always fakes dispatch-self-close, and the
  real dispatch-self-close never sources lib-decision-log.sh). Both record
  classes this node originally attributed to two different scripts — the
  aaaa1111 standdown-declared records AND the tactic-some-node records — in fact
  both come from test-dispatch-standdown.sh alone, whose fixture uses node id
  tactic-some-node with winner aaaa1111-1111-1111-1111-111111111111
  (test-dispatch-standdown.sh:82-88). The leak is still active and has grown:
  the production log was 8944 lines at plan time, of which 39 carried
  "node":"tactic-some-node" (up from the 15 fixture rows recorded above).


  Why this is worth a node rather than a cleanup. The production routing log is
  an observability surface the bootstrap plan reads as evidence: it is the sole
  detect for bug N (router effective_live undercounts or reads null) and it
  carries the site records the frozen-session and standdown sweeps are validated
  against. A test run silently appends synthetic rows to it, so a defect detect
  can fire on data no router produced, and a real regression can be dismissed as
  another fixture. This is the same shape as tactic-sweep-timer-unit-dir-leak
  (bug B), where a test run rewrote the live systemd unit ExecStart to a /tmp
  path: a test that does not isolate its environment mutates live state that an
  operator later trusts.


  Design settled at plan time (superseding the record-time "direction for
  planning, not a plan"): the actual defect class is that decision-log isolation
  is opt-in per file (five suites isolate correctly today, each only by
  remembering to), so omission is silent — a minimal per-file override on the
  one active leaker would fix today's instance and leave the omission class
  open, which is how this bug and the cited systemd-unit-dir sibling both
  arrived. The plan instead adds one shared seam module
  (lib-test-decision-log-guard.sh) sourced by both of the repo's shared test
  harnesses (dispatch-test-fixture.sh and test-helpers.sh — there are two, not
  the one the record-time note assumed), so isolation becomes a property of
  sourcing a harness rather than of per-file discipline, plus a ratcheting
  regression test. See the plan body for the full design, the rejected
  alternatives (a dynamic before/after log fingerprint is flaky here because the
  live fleet legitimately appends to the log during a test run), and
  unit-by-unit scope. Purging the ~39 existing fixture rows from the production
  log remains a separate, optional operator cleanup out of scope for this fix;
  see the plan's Verification section for the post-merge check.
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
  branch: tactic-test-decision-log-prod-leak
  pr: 3013
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-01T16:46:03Z
    mergeCommitSha: 0b496cf0364870be7f36f53a18869567e399ee08
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# two dispatch test scripts do not override the decision-log path, so their fixture records append to the production routing-decisions.jsonl that the fleet's own defect detects read as evidence

## Context

`lib-decision-log.sh` resolves the routing-decision log **once**, at source time, inside its load guard (`.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:68`):

```
DECISION_LOG_FILE="${DISPATCH_DECISION_LOG_FILE:-${DISPATCH_DECISION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/routing-decisions.jsonl}"
```

A test that sets neither override falls through to the **production** log — the same file the fleet's own defect detects read as evidence (it is the sole detect for the bootstrap plan's bug N, "router `effective_live` undercounts or reads null", and it carries the site records the frozen-session and standdown sweeps are validated against). Synthetic rows there make a detect fire on data no router produced, and let a real regression be dismissed as "another fixture".

Verified on this worktree at plan time (2026-07-31/08-01), by running each suite with `HOME` redirected to a scratch dir and inspecting `$HOME/.local/share/commons-dispatch/`:

- `test-dispatch-standdown.sh` **leaks**. It drives `dispatch-standdown` as a subprocess (`"$DS_CMD" "$@"`, `.claude/skills/dispatch-propagate/scripts/test-dispatch-standdown.sh:74`); that script sources `lib-decision-log.sh` (`dispatch-standdown:123`) and appends at `dispatch-standdown:208-216`. Three records per run land in the production log.
- `test-dispatch-stop-hook.sh` does **not** leak — dynamically confirmed (29/29 pass, zero files created under the fake `HOME`). A static trace agrees: its primary block always fakes `dispatch-self-close`, and the real `dispatch-self-close` never sources `lib-decision-log.sh`. The node's attribution of the "tactic-some-node" records to this file is a **misattribution** — `test-dispatch-standdown.sh` alone is the source of *both* record classes, because its fixture uses node id "tactic-some-node" (not a real graph node — a fixture placeholder) with winner `aaaa1111-1111-1111-1111-111111111111` (`test-dispatch-standdown.sh:82-88`).

Live production log at plan time: 8944 lines, of which **39** carry "node":"tactic-some-node" (up from the 15 fixture rows recorded in the node's rationale). Real nodes contribute 1–2 rows each, so the fixture rows already dominate that field's distribution.

Four suites *do* isolate correctly today (`test-lib-frozen-session-park.sh`, `test-lib-standdown-recheck.sh`, `test-dispatch-select-tick.sh`, `test-dispatch-tick.sh`), and a fifth (`test-dispatch-fleet-watch.sh:141`) uses the full-path `DISPATCH_DECISION_LOG_FILE` seam inline. Every one of them isolates *by remembering to*. That is the actual defect class: **isolation is opt-in per file, so omission is silent**. Both this leak and the cited prior incident (`tactic-sweep-timer-unit-dir-leak`, where a test run rewrote live systemd unit `ExecStart` to a `/tmp` path) arrived by exactly that omission.

**Intended outcome.** Isolation becomes a property of *sourcing a shared test harness*, not of per-file discipline; omission is caught mechanically instead of by an operator noticing corrupted evidence months later.

**Greenfield design.** One shared seam module, `lib-test-decision-log-guard.sh`, owns the whole concern: it exports a scratch `DISPATCH_DECISION_LOG_DIR` at source time and exposes a guard function that asserts, at suite end, that the decision-log seam is *not* pointed at the production path. Both shared harnesses source it, so every harness consumer is isolated by default. A ratcheting self-test keeps the few files that source neither harness from growing.

**Why not the obvious alternatives.**
- *Per-file overrides only* (the node's minimal direction) fixes today's one leaker and leaves the omission class open — the very way this bug arrived.
- *A dynamic "production log unchanged" fingerprint*, mirroring the systemd guard's before/after snapshot, is **flaky here**: the host's live dispatch fleet legitimately appends to that log on its tick cadence while a suite runs, so an innocent concurrent append would fail the suite. The systemd guard sidesteps this by fingerprinting only a field a legitimate rewrite leaves stable (`WorkingDirectory=`); the decision log has no such stable field, since every legitimate write is an append. The plan therefore asserts the **seam** (which env var the log would resolve through), not the **effect** — deterministic, host-independent, concurrency-proof.
- *Teaching `lib-decision-log.sh` to refuse the production path under a test marker* puts test-awareness in production code and still depends on the marker being set.

No brownfield migration path is needed: there are ~140 shell suites but they all reach the seam through one of two harnesses or an explicit override, so the change is additive and lands in a single PR.

**Explicitly out of scope.** Purging the ~39 existing fixture rows from the production log. The node states this directly: it is a separate, optional cleanup that must not be conflated with the fix, and *the rows are evidence for this node until it lands*. Post-merge operator guidance is in `## Verification` as prose only — no unit performs it, and no code in this PR touches `$HOME/.local/share/commons-dispatch/`.

---

## Unit 1 — One shared decision-log isolation seam, sourced by both test harnesses

**Scope**

There are **two** shared harnesses in `.claude/skills/dispatch-propagate/scripts/`, not one (the node names only `test-helpers.sh`; the actual leaker sources the other):

- `dispatch-test-fixture.sh` — sourced by ~115 suites, including `test-dispatch-standdown.sh:15` and `test-dispatch-stop-hook.sh:8`. Has `set -euo pipefail` (line 11), a `report_results()` (line 50), and an `EXIT` trap (`_dispatch_test_exit_trap`, lines 1389-1400).
- `test-helpers.sh` — sourced by 18 suites. Counters at lines 5-7; `report_results()` at line 76. It has **no** `EXIT` trap, and 13 of its consumers install their own (`test-dispatch-derive-node-target.sh:19`, `test-run-lint.sh:28`, `test-lint-ds-drift.sh:12`, …), so this unit must **not** add a trap there — it would be clobbered.

**A. New file `.claude/skills/dispatch-propagate/scripts/lib-test-decision-log-guard.sh`.**

Name it `lib-*`, not `test-*`: `run-unit-tests.sh:190` globs `"$SCRIPTS"/test-*.sh` and would otherwise execute it as a suite.

At source time, behind an idempotent load guard (`_LIB_TEST_DECISION_LOG_GUARD_LOADED`, mirroring `lib-decision-log.sh:60`), it must:

1. Capture the **production** path *before* overriding anything, so the guard has something to compare against:
   `DISPATCH_TEST_PROD_DECISION_LOG_DIR="$HOME/.local/share/commons-dispatch"` and
   `DISPATCH_TEST_PROD_DECISION_LOG_FILE="$DISPATCH_TEST_PROD_DECISION_LOG_DIR/routing-decisions.jsonl"`.
2. `DISPATCH_TEST_DECISION_LOG_DIR=$(mktemp -d)` and `export DISPATCH_DECISION_LOG_DIR="$DISPATCH_TEST_DECISION_LOG_DIR"` — **unconditional**, no `${VAR:-…}` fallback, exactly mirroring the `DISPATCH_GUARD_BIN_DIR=$(mktemp -d)` / `export PATH=…` prior art at `dispatch-test-fixture.sh:135-148`. Keep the separate `DISPATCH_TEST_DECISION_LOG_DIR` name: Unit 2 needs a stable handle to restore from.
3. Define `dispatch_decision_log_guard_check()`, modelled on `dispatch_host_systemd_guard_check` (`dispatch-test-fixture.sh:154-190`): idempotent via a `_DISPATCH_DECISION_LOG_GUARD_DONE` flag, increments `TOTAL`, increments `PASS`/`FAIL`, prints a `PASS: …` / `FAIL: …` line, returns non-zero on failure, and writes a remediation hint to stderr.

   It **passes** if any of these holds:
   - `DISPATCH_DECISION_LOG_FILE` is set non-empty and `!=` `$DISPATCH_TEST_PROD_DECISION_LOG_FILE`; or
   - `DISPATCH_DECISION_LOG_DIR` is set non-empty and `!=` `$DISPATCH_TEST_PROD_DECISION_LOG_DIR`; or
   - `DECISION_LOG_FILE` is set non-empty and `!=` `$DISPATCH_TEST_PROD_DECISION_LOG_FILE` (the in-process direct-reassignment idiom — see Reuse).

   Otherwise it **fails**, with a message naming the production path and the fix ("export `DISPATCH_DECISION_LOG_DIR` into the suite's tmp sandbox, or source `dispatch-test-fixture.sh` / `test-helpers.sh`").

   Note the semantics: this asserts the **seam**, not the file. Do not read, stat, or hash `$DISPATCH_TEST_PROD_DECISION_LOG_FILE` — the live fleet appends to it concurrently and any before/after comparison would flake (see Context).

   Guard against `set -u`: use `${DISPATCH_DECISION_LOG_FILE:-}` style expansions throughout — `dispatch-test-fixture.sh:11` sets `-u`, and `lib-decision-log.sh:63` sets `-uo pipefail` in whatever shell sources it.

**B. Wire into `dispatch-test-fixture.sh`.**

- Source the new lib immediately **after** `SCRIPT_DIR` is defined (line 18) and **before** the counters at lines 32-34 are used — placing it adjacent to the existing systemd-guard block (lines 62-190) is the natural home. Add `# shellcheck source=lib-test-decision-log-guard.sh`. Sourcing must happen before any suite body runs, since `test-lib-frozen-session-park.sh:33` and `test-lib-standdown-recheck.sh` source `lib-decision-log.sh` into the *same* shell right after the fixture, and its load guard resolves `DECISION_LOG_FILE` exactly once.
- Call `dispatch_decision_log_guard_check || true` in `report_results()` (line 50), immediately after the existing `dispatch_host_systemd_guard_check || true` at line 54, with the same rationale comment.
- Call it in `_dispatch_test_exit_trap` (lines 1389-1399), alongside the existing guard call, so an abort under `set -e` still reports; and `rm -rf "$DISPATCH_TEST_DECISION_LOG_DIR"` next to the existing `rm -rf "$DISPATCH_GUARD_BIN_DIR"` at line 1397.

**C. Wire into `test-helpers.sh`.**

- Source the new lib at the top, resolving its own directory from `${BASH_SOURCE[0]}` (this file defines no `SCRIPT_DIR` of its own — do not assume the consumer's). Place it just after the counters at lines 5-7.
- Call `dispatch_decision_log_guard_check || true` at the top of `report_results()` (line 76), **before** the tally echo, so a failure is included in the printed counts and in the existing `[ "$FAIL" -gt 0 ] && exit 1`.
- Do **not** add an `EXIT` trap here (13 consumers install their own). Clean up the scratch dir at the end of `report_results()` instead, after the tally; an early abort leaves one small `mktemp -d` behind, which is the same behaviour as the many per-test `mktemp -d` calls already in this suite family.

**Out of scope for this unit:** any change to `lib-decision-log.sh` (its precedence rule and load guard are correct and depended on), to `run-unit-tests.sh`, or to any individual `test-*.sh`.

**Recommended model:** opus

---

## Unit 2 — Stop two teardowns from re-exposing the production path at suite end

**Scope**

Two suites use the subprocess-invocation idiom: they `export DISPATCH_DECISION_LOG_DIR` in setup and `unset` it in teardown. After Unit 1 the unset also discards the harness default, leaving the process pointed at the production path for the rest of the run — and failing Unit 1's end-of-suite guard, correctly.

Change both to **restore the harness default** rather than unset:

- `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh:409` — `DISPATCH_DECISION_LOG_DIR` appears in `sel_tick_teardown`'s `unset` list. Remove it from that list and add, after the `unset`, `export DISPATCH_DECISION_LOG_DIR="$DISPATCH_TEST_DECISION_LOG_DIR"`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh:198` — `DISPATCH_DECISION_LOG_DIR` appears in `tick_teardown`'s `unset` list. Same treatment.

Both suites keep their existing per-test `export DISPATCH_DECISION_LOG_DIR="$TMPDIR_TEST/…"` in setup (`test-dispatch-select-tick.sh:263`, `test-dispatch-tick.sh:124`) — those still win inside each test case, and the harness default only covers the windows between a teardown and the next setup.

Two invariants this must not disturb, both verified at plan time:

- `test-dispatch-select-tick.sh:260-263` documents that `mkdir` is *intentionally* not called for `$TMPDIR_TEST/decisionlog`, because the dir's presence proves the lib ran and wrote. The harness default is a different `mktemp -d` path, so it cannot satisfy that presence check by accident. Assertions reading `$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl` (lines 433, 456, 487, 947, 982, 1107) all run inside a setup/teardown pair and are unaffected.
- `test-dispatch-select-tick.sh:1520-1533` (the AC3 non-fatal test) deliberately points `DISPATCH_DECISION_LOG_DIR` at an uncreatable path and asserts the tick still exits 0. It sets the var itself after `sel_tick_setup`, and `sel_tick_teardown` then restores the harness default — unchanged behaviour.

**Explicitly out of scope:** `test-lib-frozen-session-park.sh:109,707` and `test-lib-standdown-recheck.sh:93`, which also unset `DISPATCH_DECISION_LOG_DIR` in teardown. Those are the same-process-source idiom: they directly reassign the already-resolved `DECISION_LOG_FILE` (`test-lib-frozen-session-park.sh:96,694`, `test-lib-standdown-recheck.sh:81`), which survives the unset and is never the production path — so Unit 1's guard passes them on its third clause. Do not touch them.

**Dependencies:** Unit 1 (`DISPATCH_TEST_DECISION_LOG_DIR` and the guard must exist first).

**Recommended model:** sonnet

---

## Unit 3 — Regression test: `test-decision-log-isolation.sh`

**Scope**

New file `.claude/skills/dispatch-propagate/scripts/test-decision-log-isolation.sh`, executable (`chmod +x`), picked up automatically by `run-unit-tests.sh:190`'s `"$SCRIPTS"/test-*.sh` glob. Source `test-helpers.sh` (not `dispatch-test-fixture.sh` — the fixture copies a dozen scripts into a tmp dir on every `setup`, which this test does not need), and end with `report_results`.

**Part A — dynamic: no suite writes to the production path.**

For each of `test-dispatch-standdown.sh` and `test-dispatch-stop-hook.sh` (the two named in this node's statement):

1. `FAKE_HOME=$(mktemp -d)`.
2. Invoke the suite with the production path redirected *and the inherited overrides stripped*:
   `env -u DISPATCH_DECISION_LOG_DIR -u DISPATCH_DECISION_LOG_FILE -u DECISION_LOG_FILE HOME="$FAKE_HOME" "$SCRIPT_DIR/<suite>"`.
   **The `env -u` is load-bearing.** After Unit 1, this test's own process exports `DISPATCH_DECISION_LOG_DIR` (via `test-helpers.sh`), and the child would inherit it — making the check pass vacuously without ever exercising the child's own harness. Strip all three, then let the child's own `dispatch-test-fixture.sh` do the isolating.
3. Capture the exit code without tripping `set -e`: `if out=$(… 2>&1); then rc=0; else rc=$?; fi`.
4. Assert `rc == 0` (the suite still passes under a redirected `HOME` — confirmed at plan time: 25/25 and 29/29).
5. Assert **no** file exists at `$FAKE_HOME/.local/share/commons-dispatch/routing-decisions.jsonl`, and none at `…/routing-decisions.jsonl.lock`. Include the offending file's contents in the failure message.
6. `rm -rf "$FAKE_HOME"`.

This is exactly the check that proved the leak at plan time. Against pre-Unit-1 code it fails on `test-dispatch-standdown.sh` (3 records + a lock file appear) and passes on `test-dispatch-stop-hook.sh`.

Both suites run in ~0.25s each, so the added CI cost is negligible. There is no recursion risk: this test invokes two suites by explicit path, never the `test-*.sh` glob.

**Part B — static ratchet: a new suite cannot regress this by omission.**

Iterate every `test-*.sh` in `$SCRIPT_DIR`, skipping `test-helpers.sh` (a sourced library, mirroring `run-unit-tests.sh:191`) and this file itself. A file is **isolated** if it contains any of: `dispatch-test-fixture.sh`, `test-helpers.sh`, `DISPATCH_DECISION_LOG_DIR`, or `DISPATCH_DECISION_LOG_FILE` (plain `grep -qF`).

Assert every non-isolated file is named in an explicit `KNOWN_UNISOLATED` array, and — so the list cannot rot — assert every entry in that array still exists on disk. The array's exact contents as of plan time (verified by enumeration; every other suite sources one of the two harnesses):

```
test-dispatch-fleet-alarm.sh
test-graph-write-rollback.sh
test-lib-claude-agents-zsh-path-clobber.sh
test-pid-cleanup.sh
test-reclaim-audit.sh
test-run-smoke-tests.sh
test-sanitize-launch-env.sh
```

Note `test-dispatch-fleet-watch.sh` is **not** on this list: it sets the full-path seam inline per invocation (`test-dispatch-fleet-watch.sh:141`), and `lib-decision-log.sh:68` gives `DISPATCH_DECISION_LOG_FILE` precedence over `DISPATCH_DECISION_LOG_DIR`, so it is already isolated and needs no change.

The failure message must say: *add the file to `KNOWN_UNISOLATED` only if it provably cannot reach `lib-decision-log.sh`; otherwise source `dispatch-test-fixture.sh` or `test-helpers.sh`.*

**Explicitly out of scope:** making the seven allowlisted files source a harness (none of them reaches the decision-log lib today), and any new rule in `lint-prose-rules.sh` (that linter scans net-new added lines in committed `.sh` files, which is the wrong shape for a whole-file property).

**Dependencies:** Unit 1, Unit 2.

**Recommended model:** sonnet

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:135-148` — `DISPATCH_GUARD_BIN_DIR=$(mktemp -d)` then `export PATH=…`, unconditional, at fixture **source** time so every subsequent process and subshell inherits it. The pattern Unit 1 mirrors exactly, including the no-fallback style.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:50-60, 62-190, 1384-1400` — the full `tactic-sweep-timer-unit-dir-leak` guard shape: source-time arming, an idempotent `*_guard_check` that counts one assertion into `TOTAL`/`PASS`/`FAIL`, invocation from both `report_results` and the `EXIT` trap, and scratch-dir cleanup in the trap. Unit 1's guard reuses this structure verbatim, changing only what is asserted.
- `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh:60-68` — the `_LIB_DECISION_LOG_LOADED` load-guard idiom and the `_FILE` > `_DIR` > `$HOME` precedence rule. Reuse the load-guard shape for the new lib; do not change the precedence rule.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh:263,409` and `test-dispatch-tick.sh:124,198` — the subprocess-invocation idiom (`export` in setup, teardown cleanup) that Unit 2 amends.
- `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh:92-96,109` and `test-lib-standdown-recheck.sh:77-81,93` — the same-process-source idiom, where `DECISION_LOG_FILE` must be reassigned directly because the load guard already resolved it. This is why Unit 1's guard needs its third `DECISION_LOG_FILE` clause and why Unit 2 leaves these files alone.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh:5-7,76-84` — `PASS`/`FAIL`/`TOTAL` and `report_results`; reused as-is by Unit 3, and extended (guard call only) by Unit 1.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-203` — the `test-*.sh` glob + `test-helpers.sh` skip. Unit 3's new file is picked up with no runner change; Unit 1's new lib is deliberately named `lib-*` so it is not.

## Verification

Reproduce the defect first (must fail before Unit 1, pass after):

```verify
FAKE_HOME=$(mktemp -d) && \
env -u DISPATCH_DECISION_LOG_DIR -u DISPATCH_DECISION_LOG_FILE -u DECISION_LOG_FILE \
    HOME="$FAKE_HOME" \
    .claude/skills/dispatch-propagate/scripts/test-dispatch-standdown.sh >/dev/null && \
if [ -e "$FAKE_HOME/.local/share/commons-dispatch/routing-decisions.jsonl" ]; then \
  echo "FAIL: test-dispatch-standdown.sh still writes the production decision log"; \
  cat "$FAKE_HOME/.local/share/commons-dispatch/routing-decisions.jsonl"; \
  rm -rf "$FAKE_HOME"; exit 1; \
fi; \
echo "PASS: no production decision-log write"; rm -rf "$FAKE_HOME"
```

The new regression suite on its own:

```verify
.claude/skills/dispatch-propagate/scripts/test-decision-log-isolation.sh
```

The two suites named in this node, plus the four that already isolate (Unit 2 touches two of them) — all must stay green:

```verify
for t in \
  test-dispatch-standdown.sh test-dispatch-stop-hook.sh \
  test-dispatch-select-tick.sh test-dispatch-tick.sh \
  test-lib-frozen-session-park.sh test-lib-standdown-recheck.sh \
  test-dispatch-fleet-watch.sh ; do \
    echo "--- $t"; .claude/skills/dispatch-propagate/scripts/"$t" >/dev/null || { echo "FAIL: $t"; exit 1; }; \
  done; echo "all green"
```

The full dispatch shell suite — this is the real blast-radius check, since Unit 1 changes both shared harnesses and every one of ~130 suites now runs one extra guard assertion:

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

Lint (both harnesses and the new lib are committed shell):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / judgment checks.**

- Confirm the guard reports a *seam* failure, not a *file* failure: temporarily add `unset DISPATCH_DECISION_LOG_DIR DISPATCH_DECISION_LOG_FILE DECISION_LOG_FILE` just before the `report_results` call in any harness-consuming suite and confirm the tally gains one `FAIL` naming the production path. Revert the edit.
- Confirm no flake under a live fleet: run `run-unit-tests.sh --pr-scripts` twice while the host's dispatch timers are active. The guard must not read the production log at all, so a concurrent fleet append must have no effect on the result. If a check ever fails because the production log changed, that check reads the file and needs rewriting to assert the seam instead.

**Observe in production (post-merge, operator, out of scope for this PR).**

The ~39 existing "node":"tactic-some-node" fixture rows in `$HOME/.local/share/commons-dispatch/routing-decisions.jsonl` are **not** removed by this PR — the node states they are evidence for it until it lands, and that purging them must not be conflated with the fix. After merge, confirm the count stops growing:

```
grep -c '"node":"tactic-some-node"' ~/.local/share/commons-dispatch/routing-decisions.jsonl
```

Record the count at merge time, run `run-unit-tests.sh --pr-scripts` a few times, and confirm it is unchanged. Only then consider the optional cleanup (filter those rows out of the log with `jq`/`grep -v` against a backup copy), as a separate operator action.

## needs-main residue

- **id 13 — Post-merge: production fixture rows stop growing**
  - URL path: current
  - Expected outcome: the `"node":"tactic-some-node"` fixture-row count in `~/.local/share/commons-dispatch/routing-decisions.jsonl` holds steady (no further growth) some time after this PR merges.
  - Finding: the PR's own Verification section documents this as an explicit out-of-scope post-merge operator observation — it requires elapsed fleet runtime after merge and is not assertable at merge time. During this qa-fix pass (2026-08-01, ~10:54–11:31 EDT) the count was confirmed unchanged at 42 rows across the whole QA run, with the log's mtime showing the live fleet still actively appending non-fixture rows in that window — so the isolation fix is holding at QA time; only the post-merge persistence over elapsed fleet runtime remains unverified.
  - Verifiability: WAIT — awaiting: this PR's merge, plus elapsed fleet runtime afterward, before the count can be re-checked for growth.
  - Check: `grep -c '"node":"tactic-some-node"' ~/.local/share/commons-dispatch/routing-decisions.jsonl` — compare against the 42-row baseline recorded above; count must not increase.
