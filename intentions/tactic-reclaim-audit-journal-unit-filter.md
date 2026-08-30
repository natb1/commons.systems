---
id: tactic-reclaim-audit-journal-unit-filter
kind: tactic
statement: dispatch-reclaim-audit reads reclaim events with `journalctl --user
  -u dispatch-tick`, but ticks that emit those events run under transient
  systemd units and land under user@1000.service with
  SYSLOG_IDENTIFIER=dispatch-tick, so the unit filter matches nothing and the
  audit reports zero reclaims against a true count of 14 — and it fails OPEN to
  zero counts rather than erroring, so the vacuous result reads as a clean
  healthy ledger
owner: ai
status: codified
parent: null
rationale: "Found 2026-07-31 while machine-verifying the needs-main residue on
  tactic-router-spawn-window-duplicate-worker, whose own park recommendation
  names dispatch-reclaim-audit as the tool for the item-10 ledger-health check.
  Following that recommendation as written returns `live-worker-redundant
  reclaims (events) ..... 0` while the true post-merge count is 12
  live-worker-redundant, 1 dead-session-stranded and 1 spawn-handoff-expired —
  14 events the audit cannot see. The mechanism: dispatch-reclaim-audit:179 runs
  `journalctl --user -u dispatch-tick -o short-iso`, and `-u` matches the
  systemd UNIT. Reclaim lines are emitted by tick processes spawned as transient
  units (dispatch-reseed-*.service) or as children of the heartbeat, and those
  records carry _SYSTEMD_UNIT=user@1000.service with
  SYSLOG_IDENTIFIER=dispatch-tick. So the unit filter excludes exactly the
  records the audit exists to count. Verified by comparing `journalctl --user -u
  dispatch-tick --since '2026-07-30' | grep -c 'reclaimed reservation'` (0)
  against the same grep over the unfiltered user journal (14). What makes this
  worse than an ordinary bug is the failure direction: :182 and :187 print a
  warning and then `continuing with zero sweep counts`, so a journal that cannot
  be read is indistinguishable in the output from a fleet with no reclaims at
  all. An operator reading the audit sees a clean ledger. This is the third
  instance of one class in this pipeline — a health check whose failure mode is
  a silent PASS on the signal that matters. The others: the Monitor tool runs
  sandboxed, where `claude agents --json` returns [] and a duplicate-worker
  check reports green (recorded in the bootstrap plan's monitoring section); and
  graph-commit's exit 0 is not evidence anything landed, which is invariant I2.
  Direction for planning, not a plan: match on SYSLOG_IDENTIFIER=dispatch-tick
  rather than `-u dispatch-tick`, and change the read failure from
  fail-open-to-zero into an explicit UNKNOWN that the caller must handle — a
  count of zero and an unreadable journal must not render identically. The
  repo's code-style rule already says this: prefer clear errors over defensive
  fallbacks. Cross-check the same `-u` pattern across the other audit and
  liveness scripts before fixing only this one site. Interim attention
  scaffolding only — tactic-attention-tier-ranking replaces the numeric scheme
  with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is a monitoring instrument that reports healthy while blind, which is worse
    than no instrument, and it is the tool a sibling node's own verification
    recommendation names. blocked_by is empty, so this promotion lifts no
    blocker and cannot compound. Finalized 2026-07-31 /align-tactics
    tactic-target round: status is now codified and phase implement with a full
    clean-session plan landed in the node body, so the selector emits it as an
    /implement candidate rather than an /align-tactics candidate."
phase: done
execution:
  branch: tactic-reclaim-audit-journal-unit-filter
  pr: 3003
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-31T18:30:44Z
    mergeCommitSha: a7b9ddccde086c970f4c10eb3f789b4e059c1806
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# tactic-reclaim-audit-journal-unit-filter

## Context

`dispatch-reclaim-audit` is the report-only diagnostic that measures the reservation
sweep's reclaim RATE from the systemd user journal. It reads the sweep's own stderr
lines with a **unit** filter:

```
journalctl --user -u dispatch-tick -o short-iso --no-pager --since "$SINCE"
```

`-u` matches `_SYSTEMD_UNIT`. But almost every tick that emits reclaim lines runs
either as a transient `dispatch-reseed-<epoch>.service` (spawned by
`dispatch-schedule-reseed` via `systemd-run --user`) or as a child of the durable
daemon — and those journal records carry `_SYSTEMD_UNIT=user@1000.service` with
`SYSLOG_IDENTIFIER=dispatch-tick`. So the unit filter excludes exactly the records
the audit exists to count.

Measured live on the host on 2026-07-31 (this is a fresh repro, not the filing
measurement):

```
journalctl --user -u dispatch-tick    --since '7 days ago' | grep -cE 'lib-reservation-ledger: reclaimed reservation '   ->  3
journalctl --user -t dispatch-tick    --since '7 days ago' | grep -cE 'lib-reservation-ledger: reclaimed reservation '   -> 46
journalctl --user --grep 'lib-reservation-ledger: reclaimed reservation' --since '7 days ago' | wc -l                    -> 46
```

Over a 2-day window `-u` returns **0** against a true 29. Every one of those 29
records has `SYSLOG_IDENTIFIER=dispatch-tick` and `_SYSTEMD_UNIT=user@1000.service`
(verified with `-o json`). `-t dispatch-tick` (the `SYSLOG_IDENTIFIER` match) recovers
the full set exactly — 46 == 46 — and is a strict superset of what `-u` sees, so it
also keeps the heartbeat-unit-emitted records (the 3 above). `-u` and `-t` cannot be
combined: journalctl ANDs matches across different fields, so `-u X -t X` matches
nothing.

What makes this worse than an ordinary undercount is the **failure direction**. The
script already handles "journalctl missing / errored" by setting `SWEEP_AVAILABLE=0`,
printing a warning, and continuing with zero counts — and the report prints a
`NOTE: sweep log unavailable` line in that case. But in *this* bug's case journalctl
succeeds and simply returns no matching records, so `SWEEP_AVAILABLE` stays `1`, no
NOTE prints, and the output is byte-identical to a genuinely healthy zero-reclaim
fleet. An operator (or an agent following a park recommendation that names this tool)
reads a clean ledger. `.claude/rules/code-style.md` — "prefer clear errors over
defensive fallbacks" — is the governing rule.

**Intended outcome.** (1) The audit counts the reclaim records that actually exist.
(2) A count of zero and an unreadable/under-read journal never render identically:
the report carries an explicit status the caller must branch on, following the
`OPEN_MAIN_RED=UNKNOWN` sentinel shape already used in
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync` (a distinct
status value, never silently coerced to a clean/zero state). (3) The journalctl
invocation itself becomes testable, so a future revert to a wrong filter fails CI
rather than silently zeroing the ledger.

**Cross-check on scope (re-run at plan time, 2026-07-31, current HEAD `2a4ed519`).**
`grep -rn "journalctl" .claude/` returns hits in exactly two files:
`dispatch-reclaim-audit` (lines 24, 78, 79, 156, 173, 174, 179, 182, 187) and
`dispatch-tick:120`, whose hit is a `#`-prefixed operator doc-comment, not executable
code. There is **no other functional `journalctl -u dispatch-tick` site in the repo** —
the "cross-check the same `-u` pattern across other audit and liveness scripts" item
resolves to "no other functional site found". Do not re-derive this; a confirming
`grep -rn 'journalctl' .claude/` at implementation time is enough.

**Explicitly out of scope for this whole plan.** The audit counts only the
`dead-session-stranded` and `live-worker-redundant` reclaim reasons.
`lib-reservation-ledger.sh` also emits `spawn-handoff-expired`
(lib-reservation-ledger.sh:626) and `<origin>-ttl-expired`
(lib-reservation-ledger.sh:641) reasons that the audit never counts. That gap is a
separate tactic (`tactic-reclaim-audit-spawn-handoff-expired-count`) — **do not add
new reason buckets here.** This matters concretely for Unit 2's cross-check design:
the cross-check must compare *all-reasons reclaim lines* on both sides, or the
uncounted reasons would trip a permanent false mismatch.

---

### Unit 1 — Match the syslog identifier, and make the journalctl call testable

**Scope**

Files that change:

- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit`
  - `:173` — `SWEEP_SOURCE="journalctl --user -u dispatch-tick -o short-iso"` →
    `SWEEP_SOURCE="journalctl --user -t dispatch-tick -o short-iso"`.
  - `:179` — the live read
    `if journalctl --user -u dispatch-tick -o short-iso --no-pager --since "$SINCE" >"$SWEEP_RAW" 2>/dev/null; then`
    → invoke `"$JOURNALCTL" --user -t dispatch-tick ...` with the same remaining
    flags and the same `>"$SWEEP_RAW" 2>/dev/null` capture-so-`set -e`-cannot-kill-us
    shape.
  - `:174` — `command -v journalctl` → `command -v "$JOURNALCTL"`.
  - `:182` — the stderr warning text mentions `journalctl --user -u dispatch-tick`;
    update to the corrected form so the warning matches what was actually run.
  - Introduce, near the other env overrides (the `PROJECTS_ROOT` assignment at the top
    of the arg-parsing block, ~`:119`, is the placement precedent):
    `JOURNALCTL="${DISPATCH_RECLAIM_JOURNALCTL_CMD:-journalctl}"`. This is the same
    override shape `dispatch-schedule-reseed:479` uses for `systemd-run`
    (`SYSTEMD_RUN_CMD="${DISPATCH_SCHEDULE_RESEED_SYSTEMD_RUN_CMD:-systemd-run}"`) —
    reuse that shape, do not invent a new one.
  - Doc comments that quote the old command, all of which must be updated to
    `-t dispatch-tick`: `:24` (the RATE-vs-CAUSE design block) and `:78` (WHAT IT
    SCANS). Add one sentence at `:24` recording *why* the identifier match is used —
    reclaim lines are emitted by ticks running under transient
    `dispatch-reseed-*.service` units and under `user@1000.service`, whose
    `_SYSTEMD_UNIT` is not `dispatch-tick`, so a `-u` match drops them.
  - Document `DISPATCH_RECLAIM_JOURNALCTL_CMD` in the `Env overrides:` list at `:94-96`
    alongside `DISPATCH_RECLAIM_SWEEP_LOG` / `DISPATCH_RECLAIM_PROJECTS_ROOT`.

- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:120` — the operator
  doc-comment `#   journalctl --user -u dispatch-tick` → `#   journalctl --user -t dispatch-tick`.
  Comment-only; no functional change in this file.

- `.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh` — add a new test
  case that exercises the journalctl invocation itself. The existing
  `DISPATCH_RECLAIM_SWEEP_LOG` fixture path (`dispatch-reclaim-audit:163-171`) reads a
  file with `cat` and **never invokes journalctl at all**, so it cannot regression-test
  the filter. Add a second run that leaves `DISPATCH_RECLAIM_SWEEP_LOG` unset and
  points `DISPATCH_RECLAIM_JOURNALCTL_CMD` at a stub script written into the test's
  temp dir. The stub must model the real host:
  - if its argv contains `-u dispatch-tick`, print nothing and exit 0 (this is what the
    real host does — the transient-unit records are invisible to `-u`);
  - if its argv contains `-t dispatch-tick`, print the same six fixture reclaim lines
    `setup()` writes at `:83-90` and exit 0;
  - record its full argv to a log file so the test can also assert the constructed
    command.

  Assert, via the existing `assert_eq` helper (`:38-50`) on a `--json` run parsed with
  `jq ... <<<"$OUT"` (the existing pattern at `:148-173`):
  `.sweep.dead_session_stranded_events == 4` and
  `.sweep.live_worker_redundant_events == 2` **through the journalctl path**. With the
  old `-u` filter this assertion returns 0 and fails — that is the regression lock.
  Also assert `.sweep.source` contains `-t dispatch-tick`.

  The stub script must be built into `$ROOT` (the existing `mktemp -d` at `:76`) and
  torn down by the existing `teardown()` (`:127-132`) — do not add a second
  `trap ... EXIT`, the file already installs one at `:134`. Follow the stub-authoring
  precedent at `test-dispatch-schedule-target-reseed.sh:45-51` (heredoc a small
  `#!/usr/bin/env bash` script, `chmod +x`, point the env override at it).

Out of scope for this unit: any change to `SWEEP_AVAILABLE` semantics, the output
NOTE lines, the JSON schema, or exit codes — all of that is Unit 2. No new reclaim
reason buckets (see the plan-level scope note).

**Recommended model** — sonnet

---

### Unit 2 — Make "could not measure" impossible to read as "zero reclaims"

**Scope**

Single file: `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit`.

Replace the boolean `SWEEP_AVAILABLE` (initialized `1` at `:160`; set `0` at `:169`,
`:183`, `:188`) with a status string following the
`dispatch-graph-main-red-sync:71-84` sentinel shape — a distinct value the caller must
branch on, never coerced to a clean/zero state:

- `SWEEP_STATUS` ∈ `ok` | `unavailable`
  - `ok` — the sweep source was read successfully.
  - `unavailable` — fixture file unreadable (`:169`), journalctl errored (`:183`), or
    journalctl not found (`:188`). Keep the three existing stderr warnings; keep their
    wording, minus the misleading `-u dispatch-tick` already corrected in Unit 1.
- `SWEEP_CROSSCHECK` ∈ `ok` | `mismatch` | `unavailable` | `skipped`
  - `skipped` — the `DISPATCH_RECLAIM_SWEEP_LOG` fixture path was used (no journal to
    cross-check against). Set it on the `:163-171` branch.
  - Otherwise, immediately after a successful journalctl read, run a second,
    identifier-**un**filtered probe over the same window:
    `"$JOURNALCTL" --user --no-pager -o cat --since "$SINCE" --grep 'lib-reservation-ledger: reclaimed reservation'`
    Count its lines; count the same pattern in `$SWEEP_RAW`. **Both sides must count
    all-reasons reclaim lines** (`grep -cE 'lib-reservation-ledger: reclaimed reservation '`),
    *not* the two reason-specific patterns at `:198-199` — the ledger emits
    `spawn-handoff-expired` and `<origin>-ttl-expired` reasons the audit deliberately
    does not bucket, and a reason-specific comparison would false-fire forever. Use
    `|| true` on every `grep -c` (the file's existing convention at `:198-201`,
    `:215`) so `set -euo pipefail` cannot kill the script on a zero match.
    - unfiltered > filtered → `SWEEP_CROSSCHECK=mismatch`, plus a stderr warning naming
      both counts.
    - probe itself fails (old journalctl without `--grep`, no PCRE) →
      `SWEEP_CROSSCHECK=unavailable` and a stderr note; do **not** silently treat it as
      `ok`. The cross-check being unrunnable is itself a fact the report states.
    - else `ok`.
  - Measured cost of this probe on the live host: ~0.1s for a 7-day window; it is not
    a performance concern.

Surface the status in both output modes:

- Human report, in the existing block at `:426-430` (the only place the flag currently
  reaches the human output), immediately after `printf 'source: %s\n' "$SWEEP_SOURCE"`:
  - keep the existing `NOTE: sweep log unavailable — rate counts are zero (not measured).`
    for `SWEEP_STATUS != ok`;
  - add a **visually distinct** second NOTE for `SWEEP_CROSSCHECK == mismatch`, e.g.
    `NOTE: sweep filter UNDERCOUNT — journal holds <U> reclaim lines in this window, the identifier filter matched <F>. Rate counts below are a LOWER BOUND, not a measurement.`
    The two failure modes must never render as the same line;
  - add a third NOTE for `SWEEP_CROSSCHECK == unavailable` stating the cross-check
    could not run, so a mismatch would not have been detected.

- JSON mode, in the `jq -n` call at `:371-411`: replace
  `--argjson sweep_available "$SWEEP_AVAILABLE"` with `--arg sweep_status "$SWEEP_STATUS"`
  and `--arg sweep_crosscheck "$SWEEP_CROSSCHECK"`, and in the `sweep` object at `:390`
  emit `status: $sweep_status`, `crosscheck: $sweep_crosscheck`, and keep
  `available: ($sweep_status == "ok")` so the existing key does not vanish. On
  `crosscheck == "mismatch"`, also emit the two integer counts
  (`crosscheck_journal_lines`, `crosscheck_filtered_lines`) so the undercount is
  machine-readable. No other JSON key changes.

- Exit contract: the script's `EXIT CODES` block at `:104-107` documents `0 ok` /
  `2 usage error`. Add `3 sweep counts are not trustworthy (SWEEP_STATUS != ok or
  SWEEP_CROSSCHECK == mismatch) — the report was still emitted in full`. The full
  report (human or JSON) prints first; the exit code changes only at the end. Note the
  `--json` branch currently hard-codes `exit 0` at `:410` — that becomes the computed
  code. This is the "the caller must handle it" half of the fix: an agent that shells
  out and checks `$?` can no longer mistake an unmeasurable ledger for a clean one.
  `SWEEP_CROSSCHECK == unavailable` and `skipped` do **not** trigger exit 3 (the
  fixture path and a `--grep`-less journalctl are not evidence of an undercount).

  Update the `BEHAVIOR CONTRACT` bullet at `:101-104` — it currently promises
  "clear stderr note + clean continue, never a crash" for missing journalctl; it now
  promises a clear note, a full report, and a non-zero status.

Extend `.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh` with cases
covering, each using the Unit 1 journalctl stub or the existing
`DISPATCH_RECLAIM_SWEEP_LOG` fixture as appropriate, and the existing
`assert_eq` + `jq <<<"$OUT"` pattern:

1. fixture path (the existing default run) → `.sweep.status == "ok"`,
   `.sweep.crosscheck == "skipped"`, `.sweep.available == true`, exit 0.
2. journalctl stub that exits non-zero → `.sweep.status == "unavailable"`,
   `.sweep.available == false`, counts 0, exit 3.
3. journalctl stub where the `-t dispatch-tick` read returns 2 reclaim lines but the
   unfiltered `--grep` probe returns 6 → `.sweep.crosscheck == "mismatch"`,
   `.sweep.crosscheck_journal_lines == 6`, `.sweep.crosscheck_filtered_lines == 2`,
   exit 3. This is the direct regression lock for the reported bug's failure mode.
4. the healthy case: stub where both sides return the same 6 lines →
   `.sweep.crosscheck == "ok"`, exit 0. This is what distinguishes "genuinely zero
   reclaims" from case 3 and must be asserted explicitly.

Because the test runs the audit and asserts on a non-zero exit, capture it as
`OUT=$(bash "$SCRIPT_DIR/dispatch-reclaim-audit" ... --json) || RC=$?` — the file is
`set -euo pipefail` (`:28`) and a bare command substitution on a failing command would
abort the suite. Use `jq ... <<<"$OUT"` here-strings, never `echo "$OUT" | jq`
(`.claude/rules/shell-json.md`; this is mechanically linted for net-new added lines in
committed `.sh` files by `lint-prose-rules.sh` via `run-lint.sh --prose`, and
`test-reclaim-audit.sh` is a `.sh` file, so a violation fails CI).

Out of scope: reclaim-reason buckets, the CAUSE classification, the transcript
scanner, and `dispatch-tick` (Unit 1 already made its only edit).

**Recommended model** — opus

**Dependencies** — Unit 1 (introduces `$JOURNALCTL`, the corrected filter, and the
journalctl stub harness this unit's cases build on; both units edit the same
`:156-190` read block).

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:28-35,71-84` —
  the `OPEN_MAIN_RED=UNKNOWN` / `MB_SHA="UNKNOWN"` sentinel pattern and its stated
  contract ("never silently treat main as healthy on a transient read error"; the
  caller branches on the sentinel). Unit 2's `SWEEP_STATUS` / `SWEEP_CROSSCHECK`
  mirrors this shape — a distinct status value, never coerced to a clean zero. Do not
  invent a different status representation.
- `.claude/skills/dispatch-propagate/scripts/dispatch-schedule-reseed:479` —
  `SYSTEMD_RUN_CMD="${DISPATCH_SCHEDULE_RESEED_SYSTEMD_RUN_CMD:-systemd-run}"`: the
  binary-override-for-testability shape Unit 1 copies for
  `DISPATCH_RECLAIM_JOURNALCTL_CMD`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-schedule-target-reseed.sh:45-51` —
  the executable-stub-in-tempdir pattern (heredoc a tiny bash script, `chmod +x`,
  record argv to a log, point the env override at it). Unit 1's journalctl stub copies
  this directly.
- `.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh:38-57` (`assert_eq`,
  `report_results`), `:75-125` (`setup()` fixture builder, `mktemp -d` root, env
  exports), `:127-134` (`teardown()` + the single `trap ... EXIT`), `:140-175` (the
  `--json` run + `jq <<<"$OUT"` assertions, `exit $FAIL`). Extend this harness; do not
  create a second test file. It is auto-discovered by
  `run-unit-tests.sh:190` (`for test_script in "$SCRIPTS"/test-*.sh`) and is already
  mode `0755`, so no CI wiring is needed for new cases.
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:163-171` — the
  existing `DISPATCH_RECLAIM_SWEEP_LOG` fixture-file branch. Keep it exactly as the
  bypass it is; Unit 2 only tags it `SWEEP_CROSSCHECK=skipped`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:198-201,215` — the
  established `grep -c ... || true` + `${VAR:-0}` idiom for counting under
  `set -euo pipefail`. Unit 2's cross-check counts use it.
- `.claude/rules/code-style.md` — "prefer clear errors over defensive fallbacks", the
  rule this fix is enforcing.
- `.claude/rules/shell-json.md` — `jq <<<` / `--jq`, never `echo | jq`; enforced by
  `run-lint.sh --prose` for net-new lines in `.sh` files.

## Verification

Both units:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

Confirm no functional `-u dispatch-tick` site survives anywhere (this should print
nothing):

```verify
raw=$(LC_ALL=C git grep -an 'journalctl.*-u dispatch-tick' -- .claude); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
hits=$(printf '%s\n' "$raw" | LC_ALL=C grep -av ':[[:space:]]*#' | LC_ALL=C grep -av '`')
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: functional -u dispatch-tick journal sites remain under .claude/"; exit 1; }
echo OK
```

Manual, on the live host (requires systemd and `dangerouslyDisableSandbox: true` — a
sandboxed Bash call has no journal and will legitimately report `unavailable`):

- **The load-bearing check.** The audit's all-reasons reclaim count must equal an
  unfiltered journal grep over the same window. Run
  `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit --days 7 --json`
  and compare `.sweep.dead_session_stranded_events + .sweep.live_worker_redundant_events`
  plus the two out-of-scope reasons against
  `journalctl --user --no-pager -o cat --since '7 days ago' --grep 'lib-reservation-ledger: reclaimed reservation' | wc -l`.
  Equivalently and more simply, assert `.sweep.crosscheck == "ok"` — that field *is*
  this equality, computed in-process. Before the fix the same run reported
  `live-worker-redundant reclaims (events) ..... 0`; after it, a non-zero count matching
  the journal. As of 2026-07-31 the 7-day figures on this host were: `-u` 3, `-t` 46,
  unfiltered 46.
- **Both spawn paths.** Confirm the count includes reclaims from ticks started by the
  durable heartbeat *and* by transient `dispatch-reseed-*.service` units. Check with
  `journalctl --user -t dispatch-tick --since '7 days ago' -o json | jq -r 'select(.MESSAGE|type=="string") | select(.MESSAGE|test("reclaimed reservation")) | ._SYSTEMD_UNIT' | sort | uniq -c`
  — the `-t` match must cover every unit that appears, and its total must equal the
  unfiltered count. (Measured 2026-07-31: 29 of 29 records over 2 days were
  `user@1000.service`, which is exactly the population `-u dispatch-tick` was dropping.)
- **Unreadable journal still reports UNKNOWN, not zero.** Run the audit with
  `DISPATCH_RECLAIM_JOURNALCTL_CMD=/bin/false`; it must print the existing
  `sweep log unavailable` NOTE, report `status: "unavailable"` / `available: false`,
  and exit 3 — never a silent clean `0`.
- **Judgment call for the implementer.** Exit code 3 is new. No automated caller of
  `dispatch-reclaim-audit` exists in the repo (verified: `grep -rn 'dispatch-reclaim-audit' .claude/`
  returns only the script itself, its test, and a prose reference at
  `dispatch-tick:298`), so nothing breaks — but if that grep turns up a new caller at
  implementation time, wire it to branch on the exit code rather than dropping the
  code.

