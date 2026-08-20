---
id: tactic-hold-alerts-unbounded-scan-cadence
kind: tactic
statement: list-unclaimed-hold-alerts.ts's full-graph resolveAttention scan runs
  on dispatch-fleet-watch's 5-minute timer cadence even though the predicate's
  own threshold is a 24-hour age bound, adding ~288 redundant full-store
  scans/day that grow with the graph
owner: ai
status: codified
parent: null
rationale: "Deferred cost finding from the /review-fix pass on PR #3036
  (tactic-unclaimed-hold-alerting), source lens \"cost\", ADVISORY — not
  adversarially verified (cost findings route straight to Deferred per
  review-fix's disposition table). dispatch-fleet-watch's predicate 5 answers a
  question whose own timescale is a 24-hour age bound (HOLD_MIN_AGE, default
  86400) but is evaluated on the fleet watchdog's 5-minute systemd cadence
  (lib.sh's ensure_watcher_units writes OnUnitActiveSec=5min), so it spawns a
  Node process that reads and parses the whole intentions/ store about 288 times
  per 24-hour threshold window, and the cost grows with the graph. Re-measured
  2026-08-20 against origin/main a0bd6c82 at 738 nodes / 11 MB (the finding was
  filed at 491 nodes / 6.1 MB): ~0.6s wall / ~0.9s CPU per pass, about 4.3
  CPU-minutes/day. AMENDED THIS ROUND — the finder proposed two remedies and
  only one survives measurement. Timed in-process at 737 nodes, one pass splits
  as read+parse 382ms, hold-candidate enumeration 1ms, resolveAttention 14ms; so
  the \"prefilter before the full resolve rather than recomputing attention in a
  second process\" half is DROPPED as immaterial (resolveAttention is 14ms of a
  ~600ms pass, and the top-K cutoff is a function of all nodes, which must be
  read before anything can be prefiltered). The cost is process start plus
  reading 11 MB of markdown, so the only lever that matters is invocation
  frequency. The plan therefore implements the cadence half alone: a
  per-predicate scan interval held in the watcher's existing cross-pass state
  file, with a not-due pass reporting the script's existing `quiet` verdict —
  never `clear`, which would resolve and close an already-open unclaimed-hold
  alarm nobody looked at. Stale anchors from the original filing
  (list-unclaimed-hold-alerts.ts:104, attention.ts:312, hold-alerts.ts:119-124,
  dispatch-fleet-watch:606) are superseded by the re-verified set in the node
  body. Source PR: #3036."
reading: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# list-unclaimed-hold-alerts.ts's full-graph scan runs on dispatch-fleet-watch's 5-minute timer cadence even though the predicate's own threshold is a 24-hour age bound, adding ~288 redundant full-store scans/day that grow with the graph

## Context

`dispatch-fleet-watch` predicate 5 (`unclaimed-hold`) answers a question whose
own timescale is a **24-hour** age bound (`HOLD_MIN_AGE`, default `86400`), but
it is evaluated on the fleet watchdog's **5-minute** systemd cadence. Every one
of those passes spawns a Node process that reads and parses the entire
`intentions/` store and resolves attention over it. That is ~288 full-store
scans per day to answer a question that changes on a daily boundary, and the
cost grows with the graph.

### Provenance

Deferred **cost** finding (ADVISORY — not adversarially verified; cost findings
route straight to Deferred per `/review-fix`'s disposition table) from the
`/review-fix` pass on `tactic-unclaimed-hold-alerting`, source PR #3036.
Adversarial verdict: none.

### Anchors and measurements (re-verified 2026-08-20 against origin/main a0bd6c82)

The `path:line` anchors carried in the original finding were stale; these are
current. A fresh session should still spot-check them before editing, since the
files move.

- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:587-695` —
  predicate 5 (its comment block opens at `:587`, FAIL DIRECTION at `:598-615`).
  `:618` is `V_HOLD="unknown"; D_HOLD=""; B_HOLD=""`; `:622` is
  `HOLD_ROOT="$(resolve_main_worktree 2>/dev/null)" || HOLD_ROOT=""`; `:623`
  opens the `if [[ -z "$HOLD_ROOT" ]]` verdict chain; `:695` is the `fi` that
  closes it. The default (non-seam) enumerator spawn is at `:636-641`
  (`node --import tsx/esm .../list-unclaimed-hold-alerts.ts`).
- `dispatch-fleet-watch:228-235` — the threshold block:
  `HOLD_MIN_AGE="${DISPATCH_FLEET_WATCH_HOLD_MIN_AGE:-86400}"` (`:231`),
  `HOLD_TOP_K` (`:232`), and the `for t in ...` non-negative-integer validation
  loop that exits 64 (`:233-235`).
- `dispatch-fleet-watch:241` — `STATE_FILE`, overridable via
  `DISPATCH_FLEET_WATCH_STATE_FILE`; `:248-286` — the cross-pass state contract
  and the `state_get` / `state_set` helpers.
- `dispatch-fleet-watch:1-186` — the header (predicate list `:26-33`, PAUSE
  block `:107-121`, exit codes `:128-135`, thresholds `:136-144`, paths and the
  `STATE_FILE` note `:145-166`).
- `dispatch-fleet-watch:187-189` — the script is `set -uo pipefail`, **not**
  `set -e`: every risky step is guarded explicitly so the pass always reaches
  reporting. New code must keep that property.
- `packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts:105-119` —
  `main()`; `:112` is `listNodesStrict(dir)`. File is 129 lines.
- `packages/intentionsutil/src/hold-alerts.ts:91-159` —
  `listUnclaimedHoldAlerts`; `:102` `resolveAttention(nodes)`; `:104-115` the
  top-K pool pass.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:3735-3736` — the timer body
  written by `ensure_watcher_units`: `OnBootSec=3min` / `OnUnitActiveSec=5min`.
  86400 / 300 = **288 passes per threshold window**. All five predicates share
  this one timer/service pair; there is no per-predicate cadence today.

Measured on this host, 2026-08-20, against the real store (**738 nodes /
11 MB**; the finding was filed at 491 nodes / 6.1 MB):

- End-to-end enumerator runs: `0.84s user 0.11s sys 156% cpu 0.609 total` and
  `0.82s user 0.09s sys 155% cpu 0.582 total` — ~0.6s wall / ~0.9s CPU per pass,
  ~288 passes/day ≈ **4.3 CPU-minutes/day**, growing with the graph. Real but
  modest in absolute terms: this is a cost finding, not an outage, and the fix
  is sized accordingly.
- Cost split inside one run (`listNodesStrict` vs `listHoldCandidates` vs
  `resolveAttention`, timed in-process at 737 nodes):
  **read+parse 382ms, hold-candidate enumeration 1ms, resolveAttention 14ms.**

### That measurement amends the recorded remedy

The finder recommended two things: (a) decouple predicate 5's cadence from the
watchdog's, and (b) "prefilter before the full resolve rather than recomputing
attention in a second process". **(b) is dropped as immaterial and this body
supersedes it**: `resolveAttention` is 14ms of a ~600ms pass. The cost is
process start plus reading and parsing 11 MB of markdown — neither of which a
prefilter avoids, because the top-K cutoff is a function of *all* nodes and the
nodes must be read before anything can be prefiltered. **Any fix that keeps
invoking the CLI pays essentially the full cost per invocation, so the only
lever that matters is invocation frequency.** That is (a), and (a) alone is
what this plan implements.

### Intended outcome

Predicate 5 performs at most one full scan per its own declared interval
(default hourly), and reports `quiet` — the script's existing "not evaluated
this pass" verdict — on every pass in between. 288 scans/day becomes 24, a ~92%
reduction that also removes ~92% of the predicate's Node cold starts, with alert
latency bounded at one interval on a signal whose own threshold is 24 hours.

### The trap in this change (read before editing)

A pass that skips the scan **must** emit `quiet`.

- It must **not** emit `clear`. `dispatch_predicate` (`dispatch-fleet-watch:770-775`)
  routes `clear` to `resolve_alarm`, which sends `--resolve --kind unclaimed-hold`
  and **closes an already-open alarm node** — a pass that did not look would
  silently retract a live alarm.
- It must **not** emit `unknown`. That raises the `watch-unknown` alarm and
  forces exit 2 on every skipped pass.
- `quiet` is already the right primitive and needs no new plumbing: the header
  enumerates `clear | finding | unknown | quiet` (`:26`), predicates 1 and 3
  already use it under pause (`:348`, `:415`), `note_verdict` (`:717-722`)
  ignores it so it never counts toward `FINDING_COUNT`/`UNKNOWN_COUNT`,
  `dispatch_predicate` matches only `finding`/`clear` so `quiet` raises nothing
  **and resolves nothing**, and the header records that exit 0 means "every
  EVALUATED predicate is clear (quiet predicates do not count)" (`:130`). The
  stdout table (`:909`) and the `--json` object (`:896`) are generic over the
  verdict string.

Predicate 5's whole FAIL DIRECTION doctrine is written out at
`dispatch-fleet-watch:598-615`. Read it before touching the verdict.

### Greenfield design, and why it is also the brownfield path

The ideal design is what this plan builds: **cadence is a property of the
predicate, expressed where the predicate lives**. The watcher stays a one-shot
that the timer re-fires (its header's stated design), each predicate decides for
itself whether its own question is due, and a not-due predicate uses the
script's existing "not evaluated" verdict so no reporting, exit-code, or alarm
plumbing changes.

The rejected alternative is a second systemd timer/service pair for predicate 5.
It would split one watcher into two units and duplicate `ensure_watcher_units`'s
four newline/space/quote/backslash path guards and the paired
`cleanup_stale_watcher_units` machinery, for no benefit over an in-process
stamp — and it would break the header's single most important property (every
predicate evaluated on every pass, one report over the complete set).

No migration path is owed: the change is a single-PR, backwards-compatible
addition inside one script plus its test suite. Losing the stamp costs at most
one extra scan, which is exactly what happens on every pass today.

---

## Unit 1 — cadence gate on predicate 5, plus its header documentation

**Recommended model:** opus

**Scope**

Edit exactly two files.

**A. `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch`**

1. **New threshold.** In the threshold block at `:228-235`, add
   `HOLD_SCAN_INTERVAL="${DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL:-3600}"`
   beside `HOLD_MIN_AGE`/`HOLD_TOP_K`, and add `"$HOLD_SCAN_INTERVAL"` to the
   `for t in ...` validation loop at `:233-235` so a non-numeric value exits 64.
   Follow that existing idiom exactly; invent no new validation.
   Default 3600 (hourly): 1/24th of `HOLD_MIN_AGE`, matching the sibling
   precedent `DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL` (default 3600) at
   `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:145-152`. It
   is a plain independent tunable, deliberately **not** derived from
   `HOLD_MIN_AGE` at runtime.

2. **The gate.** Immediately before `:622`
   (`HOLD_ROOT="$(resolve_main_worktree ...)"`), read the stamp and decide
   whether the scan is due. Under `set -u` every variable must be initialized:

   ```
   HOLD_SCAN_DUE=1
   HOLD_SCAN_LAST=""
   HOLD_SCAN_AGE=""
   if ! HOLD_SCAN_LAST="$(state_get hold_scan_last)"; then
     HOLD_SCAN_LAST=""
     log "cannot read hold_scan_last from $STATE_FILE — scanning this pass"
   elif [[ -n "$HOLD_SCAN_LAST" && "$HOLD_SCAN_LAST" -le "$NOW" ]]; then
     HOLD_SCAN_AGE=$(( NOW - HOLD_SCAN_LAST ))
     (( HOLD_SCAN_AGE < HOLD_SCAN_INTERVAL )) && HOLD_SCAN_DUE=0
   fi
   ```

   Then guard the `HOLD_ROOT` resolution so a skipped pass does no work at all —
   `if (( HOLD_SCAN_DUE == 1 )); then HOLD_ROOT="$(resolve_main_worktree 2>/dev/null)" || HOLD_ROOT=""; fi`
   (keep `HOLD_ROOT=""` initialized for `set -u`) — and make the not-due case the
   **first branch of the existing verdict chain** at `:623`, so the rest of the
   block is not re-indented:

   ```
   if (( HOLD_SCAN_DUE == 0 )); then
     V_HOLD="quiet"
     D_HOLD="scan interval not yet elapsed (last full scan ${HOLD_SCAN_AGE}s ago, interval ${HOLD_SCAN_INTERVAL}s) — not evaluated this pass"
   elif [[ -z "$HOLD_ROOT" ]]; then
     ...unchanged...
   ```

   Leave `V_HOLD="unknown"; D_HOLD=""; B_HOLD=""` at `:618` as the initializer,
   and leave `HOLD_COUNT=0` as-is (a `quiet` pass reports `candidate_count: 0`
   in `--json`, meaning "not counted", which the detail string states).

3. **The stamp write.** After the predicate-5 chain closes (the `fi` at `:695`),
   stamp **only a completed evaluation**:

   ```
   if [[ "$V_HOLD" == "clear" || "$V_HOLD" == "finding" ]]; then
     state_set hold_scan_last "$NOW" || log "cannot persist hold_scan_last to $STATE_FILE — predicate 5 will re-scan next pass"
   fi
   ```

   An `unknown` deliberately does **not** stamp, so the next pass retries rather
   than sitting on an unresolved unreadable input for an hour. A failed write is
   logged and changes no verdict.

4. **Fail direction of the stamp — document it in-line, loudly.** The comment
   must say why this key's fail direction is the **inverse** of `busy_zero_since`
   / `suppression_since`: those stamps are predicate *inputs* (the span IS the
   verdict), so unreadable ⇒ `unknown`. `hold_scan_last` is a **brake, never an
   input** — it can only suppress an evaluation, never produce one — so
   unreadable, unwritable, absent, or a corrupt future value all mean **scan**,
   which is precisely today's behaviour and costs at most one extra scan. A
   future editor "fixing" this to `unknown` for consistency would make an
   unwritable `$HOME` raise a `watch-unknown` alarm every 5 minutes forever.
   Note explicitly that a stamp **in the future** (clock step, corrupt value)
   reads as due via the `-le "$NOW"` guard, rather than being clamped to 0 the
   way `dispatch-fleet-alarm:762-778` clamps — a clamp here would suppress the
   predicate for a full interval.

5. **Header updates** (all inside `:1-186`):
   - Thresholds block (`:136-144`): document
     `DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL default 3600 (1h)` — how often
     predicate 5 runs its full-store scan, versus the 5-minute timer that fires
     the pass; note it is a COUNT of seconds between scans, that `0` means
     "every pass" (the pre-change behaviour, and what the test harness uses),
     and that the ceiling on alert latency is one interval against a 24h age
     bound.
   - `STATE_FILE` block (`:150-166`): add `hold_scan_last` to the key list and
     record the inverted fail direction from point 4 in one sentence, so the
     header's blanket "a state read/write failure makes the affected predicate
     `unknown`" is no longer read as covering this key.
   - Add a short CADENCE paragraph after the PAUSE block (`:107-121`) stating
     that predicate 5 is `quiet` when its own scan interval has not elapsed;
     that `quiet` neither raises nor resolves, so a skipped pass can never
     retract an open `unclaimed-hold` alarm; and that alarm *resolution* is
     therefore also delayed by up to one interval — an accepted trade against a
     24h age bound.
   - Predicate list at `:26-33`: no change needed — `quiet` is already
     enumerated as a possible verdict for every predicate.
   - Adjacent stale comment, optional and not required by this plan: the
     `DISPATCH_FLEET_WATCH_HOLDALERT_CMD` doc block (`:174-179`) still says the
     seam's stdout "must carry the same 6-column TSV", but the contract has been
     seven columns since `score` was appended (see `:649-655`). Correcting that
     one word while in the file is welcome; leaving it is not a defect of this
     unit.

**B. `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh` (keeping the existing suite green)**

Add one line to the `run_case` env block (`:158-193`, beside the other
`DISPATCH_FLEET_WATCH_*` injections at `:170-176`):

```
DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL="${DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL:-0}" \
```

This is **load-bearing, not cosmetic**. Several existing cases call `run_case`
twice inside one `new_env` (so, one `$STATEFILE`) — case 22 at `:573-608` is the
body-stability ratchet that runs two predicate-5 passes and compares bodies
byte-for-byte. With a non-zero default the second pass would go `quiet`, emit no
body, and the ratchet would fail (correctly reporting itself vacuous). Defaulting
the harness to `0` preserves every pre-existing case's behaviour exactly, and
lets the new cases in Unit 2 opt into a real interval explicitly.

**Out of scope for this unit**

- Any change to `packages/intentionsutil/` — `list-unclaimed-hold-alerts.ts`,
  `hold-alerts.ts`, `attention.ts`, `store.ts`. See "That measurement amends the
  recorded remedy": the prefilter idea is dropped, and the CLI's own contract
  (7-column TSV, `listNodesStrict`, exit 2 on a bad store) is unchanged.
- Any new systemd unit, or any edit to `ensure_watcher_units`
  (`lib.sh:3637-3780`). The 5-minute timer stays exactly as it is; only
  predicate 5's own evaluation frequency changes.
- The other four predicates. Their cadence is untouched.
- Any change to `note_verdict`, `dispatch_predicate`, `raise_alarm`,
  `resolve_alarm`, the `--json` shape, or the stdout table.

**Decoy — do NOT touch** `packages/intentionsutil/scripts/list-recheckable-holds.ts`.
It is a deliberately separate CLI whose 4-column TSV is consumed by
`lib-stale-hold-recheck.sh` with a four-variable `read`; the header of
`list-unclaimed-hold-alerts.ts` (`:36-38`) says so.

---

## Unit 2 — test cases pinning the cadence gate and its fail direction

**Recommended model:** sonnet

**Dependencies:** Unit 1.

**Scope**

One file: `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh`.
Append new cases after case 24 (`:633-654`), before the case-17 doctrine ratchet
at `:656` that closes the file. Reuse the harness as-is: `assert_eq` /
`assert_contains` / `assert_not_contains` (`:46-54`), `reset_stubs` / `new_env` /
`fresh_log` (`:195-215`), `agents_json` (`:144-152`), `hold_row` (`:517-519`). No
new infrastructure is needed — `new_env` already gives each case its own
`$STATEFILE` (`:208`).

1. **Instrument the enumerator stub so "was it spawned?" is assertable.** The
   `holdalert` stub is defined at `:110-117`. Add a call-log line to it:

   ```
   [[ -n "${HOLDALERT_CALL_LOG:-}" ]] && printf 'call\n' >> "$HOLDALERT_CALL_LOG"
   ```

   and export `HOLDALERT_CALL_LOG="${HOLDALERT_CALL_LOG:-}"` from `run_case`'s env
   block alongside `ALARM_LOG`. Cases that do not set it are unaffected. Set it
   per case to a path under `$CASEDIR` and count lines with
   `wc -l < "$HOLDALERT_CALL_LOG"`.

2. **Case 25 — THE THROTTLE.** `new_env`, `fresh_log`,
   `DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL=3600`, a candidate row via
   `hold_row`. Pass 1: verdict `finding`, exactly one
   `--kind unclaimed-hold --statement` alarm, enumerator call count 1. Then
   `reset_stubs` (NOT `new_env`, so the stamp persists) and run pass 2 with the
   same stubs. Assert on pass 2:
   - `assert_contains "unclaimed-hold:       quiet"` in `$RUN_OUT` (note the
     column alignment: the verdict is `%-8s`-padded, `dispatch-fleet-watch:909`);
   - `assert_not_contains "--resolve --kind unclaimed-hold"` in `$ALARMS`
     — **this is the load-bearing assertion**: a skipped pass must never retract
     the open alarm;
   - `assert_not_contains "--kind unclaimed-hold --statement"` in `$ALARMS`;
   - enumerator call count still **1** — the full scan did not run;
   - `assert_eq` exit code `0` (no finding, no unknown; `quiet` does not count).

   `$ALARMS` is per-`run_case` (a fresh `$ALARM_LOG` each call, `:159`), so these
   assertions are per-pass with no cross-pass bleed.

3. **Case 26 — DUE AGAIN.** Same shape, but pre-seed the state file before the
   only pass: `printf '{"hold_scan_last":%s}' "$((NOW - 7200))" > "$STATEFILE"`
   with interval 3600. Assert the enumerator WAS spawned (call count 1) and the
   verdict is the stub's real reading (`finding`), i.e. an elapsed interval scans
   normally. This case is what keeps case 25 from passing vacuously.

4. **Case 27 — UNREADABLE STATE FAILS OPEN (scan), not quiet, not unknown.**
   Write garbage to `$STATEFILE` (`printf 'not json\n' > "$STATEFILE"`) with
   interval 3600 and a candidate row. Assert the enumerator WAS spawned and
   `unclaimed-hold` is `finding` — explicitly `assert_not_contains` both
   `"unclaimed-hold:       quiet"` and `"unclaimed-hold:       unknown"`. Note in
   a comment that predicates 3 and 4 legitimately go `unknown` on the same
   corrupt file (their stamps ARE inputs), so this case asserts only on
   predicate 5's verdict and never on the pass exit code.

5. **Case 28 — A FUTURE STAMP DOES NOT WEDGE THE PREDICATE.** Seed
   `{"hold_scan_last": $((NOW + 99999))}` with interval 3600. Assert the
   enumerator WAS spawned and the verdict is `finding` — a clock step or a
   corrupt value must not suppress the scan for an interval.

6. **Case 29 — AN `unknown` DOES NOT STAMP.** Interval 3600, `STUB_HOLDALERT_RC=2`
   on pass 1: verdict `unknown`, no stamp written. Then `reset_stubs` and pass 2
   with a good candidate row in the same `$CASEDIR`: assert the enumerator was
   spawned again (call count 2) and the verdict is `finding` — an unresolved
   unreadable input retries next pass rather than being throttled.

7. **Case 30 — THRESHOLD VALIDATION.** Following case 12's usage-exit pattern
   (`:387-391`), run with `DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL=abc` and
   assert exit code 64.

**Out of scope**

- Editing existing cases 18-24 (`:521-654`). With Unit 1's harness default of
  `0` they must pass unchanged; if any of them turns red, the bug is in Unit 1,
  not in the case — fix the script, never the case
  (`.claude/rules/test-integrity.md`).
- CI wiring: `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:190`
  glob-discovers `"$SCRIPTS"/test-*.sh`, so this suite already runs in CI. No
  new wiring is owed.

---

## Reuse

- `state_get` / `state_set` — `dispatch-fleet-watch:261-286`. The existing
  cross-pass JSON state object at `$STATE_FILE` (`:241`, overridable via
  `DISPATCH_FLEET_WATCH_STATE_FILE`), already holding `busy_zero_since` and
  `suppression_since` for predicates 3 and 4. `state_get` returns empty for an
  ABSENT file (not an error), exit 1 for unreadable/unparseable/non-numeric;
  `state_set` writes atomically (tmp + `mv -f`). An epoch stamp fits with **no
  schema change** and no new file.
- The `quiet` verdict — `dispatch-fleet-watch:26` (contract), `:348` / `:415`
  (predicates 1 and 3 under pause, with a fixed detail string), `:717-722`
  (`note_verdict` ignores it), `:770-775` (`dispatch_predicate` raises and
  resolves nothing), `:130` (exit-code contract). Reused verbatim: **no dispatch,
  reporting, or exit-code change is needed by this plan.**
- The threshold convention — `dispatch-fleet-watch:136-144` (documentation) and
  `:228-235` (`${VAR:-default}` plus the shared non-negative-integer validation
  loop exiting 64).
- `DISPATCH_FLEET_ALARM_MIN_REFRESH_INTERVAL` / `refresh_stamp_read` /
  `refresh_stamp_write` — `dispatch-fleet-alarm:145-152, 274-282, 762-778`. The
  already-shipped precedent for "skip this pass, my own threshold has not
  elapsed", including the 3600s default and the doc wording "a stamp is
  host-local scratch, deliberately NOT graph state: losing it costs at most one
  extra …". Borrow the shape and the wording; do **not** reuse its state
  directory (that stamp governs alarm-body refresh churn, a different concern),
  and do **not** copy its negative-clamp, which would suppress here.
- `DISPATCH_FLEET_WATCH_HOLDALERT_CMD` — the existing dependency-injection seam
  (`dispatch-fleet-watch:174-179`, spawn at `:636-641`, stub at
  `test-dispatch-fleet-watch.sh:110-117`). It stubs the whole enumerator
  invocation with no args appended, so "was the scan spawned this pass?" is
  directly observable.
- The test harness — `assert_eq` / `assert_contains` / `assert_not_contains`
  (`test-dispatch-fleet-watch.sh:46-54`), `run_case` (`:158-193`), `reset_stubs`
  / `new_env` / `fresh_log` (`:195-215`), `hold_row` (`:517-519`),
  `agents_json` (`:144-152`). The two-sided non-assertion pattern for "neither
  raised nor resolved" already exists at case 3 (`:252-270`) and case 23
  (`:611-630`); copy it.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:36-49`
  — existing in-repo vocabulary for "the timer's cadence is unrelated to the
  tick's". Use the same framing in the new header prose.

## Verification

Green baseline measured this round on `a0bd6c82`: **131 passed, 0 failed**. After
Unit 2 the count rises by the number of new assertions; **zero pre-existing
assertions may change or disappear**.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

```verify
grep -q 'DISPATCH_FLEET_WATCH_HOLD_SCAN_INTERVAL' .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch
```

Manual / judgment checks, not auto-runnable:

- **Lint** runs in CI through
  `.claude/skills/dispatch-propagate/scripts/run-lint.sh`; run it locally before
  pushing. It is deliberately not an auto-runnable fence here because it diffs
  against `origin/main` and needs a fresh fetch. The rule it will apply to these
  additions is `.claude/rules/shell-json.md` (never `echo` a captured JSON
  variable into `jq`) — the new test cases must use `printf '%s'` or a
  here-string when seeding `$STATEFILE`.
- **Read the diff against the fail-direction doctrine** at
  `dispatch-fleet-watch:598-615` and against the trap section above. The single
  question to ask of every new line: *can a pass that did not look end up
  emitting `clear`?* If yes, the change is wrong regardless of test colour.
- **Observe in production, after merge to main.** `ensure_watcher_units`
  (`lib.sh:3674`) points the systemd unit at the **main checkout's** copy of the
  script, so the change takes effect only once merged, not from the worktree.
  Then, on the author's host:
  - `systemctl --user list-timers dispatch-fleet-watch.timer` — the timer is
    unchanged (still 5-minute).
  - `journalctl --user -t dispatch-fleet-watch --since -90m` — most passes report
    `unclaimed-hold: quiet …`, with at most one non-quiet predicate-5 evaluation
    per hour.
  - `jq . "${XDG_DATA_HOME:-$HOME/.local/share}/commons-dispatch/fleet-watch-state.json"`
    — a `hold_scan_last` key is present beside the existing keys and advances
    about hourly.
  - Confirm the other four predicates still report on every pass: the header's
    single most important property is that no predicate is skipped, and this
    change deliberately makes an exception for exactly one predicate on exactly
    one axis (its own scan interval).

## Sibling nodes — overlap, and what this session must not touch

A tactic-target round writes only its own node. Do not edit any node below.

- `tactic-fleet-watch-predicate5-cold-start` (draft, phase null, same source
  PR #3036) records its own remedy as "reduce predicate 5's cadence (see the
  companion finding), or run the enumerator from prebuilt JS". This plan
  **largely subsumes it**: the measurement above shows the pass cost is process
  start plus read/parse, and cutting 288 passes to 24 removes ~92% of both. That
  node's remaining content after this lands is the residual per-scan cold start,
  which is ~200ms × 24/day. A future round should re-read it in that light rather
  than treating it as untouched.
- `tactic-fleet-watch-alarm-noop-overhead` (draft, phase null) is the *second*
  per-pass Node cold start — `resolve_alarm` exec'ing `dispatch-fleet-alarm` on a
  `clear` verdict. Interaction worth recording: a `quiet` pass resolves nothing,
  so this change also removes that spawn on every skipped pass. Distinct node,
  distinct fix; do not absorb it.
- `tactic-hold-alerts-uncapped-alert-rows` (draft, phase null) is an unrelated
  row-cap concern inside `listUnclaimedHoldAlerts`. Out of scope.
- `tactic-unclaimed-hold-alerting` (phase main-qa) is the source that shipped
  predicate 5.

## Placement

This is a pure cost finding on machinery this strategy owns. Clarification 203
diverged from routing a cost-framed concern to `strategy-token-economy` when the
underlying fault was correctness; here the artifact-owner rule (clarification 27)
is what keeps `serves` on `strategy-graph-native-dispatch` —
`dispatch-fleet-watch` and `list-unclaimed-hold-alerts.ts` are this strategy's
own machinery. Flag it rather than silently re-homing if you disagree.
