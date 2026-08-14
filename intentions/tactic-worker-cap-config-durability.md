---
id: tactic-worker-cap-config-durability
kind: tactic
statement: dispatch.config/target-workers.json — the fleet's throughput dial —
  is untracked by git, carries no provenance and no expiry, and no detect
  compares it to a standing value, so a deliberately temporary throttle is
  indistinguishable from the intended setting and silently becomes permanent
owner: ai
status: codified
parent: null
rationale: >-
  Confirmed live 2026-08-03. THE DEFECT: git ls-files reports
  dispatch.config/target-workers.json is untracked, so the file has no history,
  no blame, no diff and no review. Its whole content is a max_concurrent_workers
  integer (the loader's own default is 8). Nothing records WHO set the current
  value, WHEN, WHY, or WHETHER it was meant to be temporary; nothing compares it
  to a standing value; and no health read prints it against an expected one. THE
  OCCURRENCE: on 2026-08-01 the cap was deliberately reduced from 3 to 1 as an
  explicitly temporary measure, with a written restoration condition (restore
  once the blocking PR merges and a clean day passes). The blocking PR merged
  2026-08-03T03:00Z. The cap was still 1 at 2026-08-03T13:00Z and was restored
  only because a human happened to re-read a planning document that recorded the
  intent — the graph and the fleet had no representation of it at all. Every
  select-tick decision across that window logged target_n 1 with max_workers
  null, so even the routing log carried no evidence that 1 was a deviation
  rather than the intended value. COST: the fleet ran at one third of its
  intended capacity for roughly two days. It was not idle — 7 PRs merged and 20
  distinct nodes were selected in the window — so no stall detect fires on this;
  the loss is invisible throughput, which is exactly why it needs an explicit
  representation rather than an alarm. This is the same class as the
  containment-undone and rollback-leaves-dirty-state findings already tracked:
  an operator action that the system has no way to remember, verify, or expire.
  GREENFIELD: make the dial self-describing and self-expiring. Track the file in
  git so every change has provenance. Give it a standing value plus an optional
  deviation record carrying reason and expires_at; dispatch-tick reads the
  effective value and, past expires_at, restores the standing value and logs the
  restoration. A deviation with no expiry is rejected at load — a throttle
  nobody scheduled to end is the failure this node records. Emit the effective
  value AND the standing value into each select-tick routing decision so the log
  shows a deviation as a deviation. MIGRATION: tracking the file and adding the
  standing/deviation shape is backwards compatible if a bare
  max_concurrent_workers integer keeps loading as the standing value with no
  deviation, so the loader change can land before any config is rewritten.
  Related to but distinct from tactic-pace-exempt-ceiling-fanout, which concerns
  a lane that reads no ceiling at all; this node concerns the durability and
  provenance of the ceiling's own value.


  2026-08-04 /align-tactics PARK NOTE: an autonomous finalize pass ran the
  two-sided drift review (gather: 3 reuse hunts + corpus + clause-coverage, 6
  subagents, 573734 tokens) and found this node's greenfield depends on three
  design premises the graph already answers differently or leaves undecided —
  see office_hours.reason for the full DECIDE list. Once those are ratified,
  greenfield elements 2-4 (the loader's standing/deviation schema,
  effective-value resolution, and select-tick logging) are fully plannable with
  no further author input; the gather phase already located every reuse site.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Three DECIDE items — provenance home, where the self-expiring throttle
      lives, and may the fleet write the operator's config file?
    answer: "(Ruled 2026-08-04 /align interview.) (1) Git-tracking DESCOPED from
      this node — provenance depends on the recorded
      tactic-dispatch-config-instance-repo migration (the 2026-07-11 decision
      stands): once migrated, the committed value IS the standing value and
      deviation detection is a plain git diff. (2) NO self-expiring deviation
      machinery — author ruling: it is unintentional bloat. A deliberate
      temporary throttle is an INTERVENTION by a session (e.g. a monitor healing
      the automation); the intervening session mints a find-or-create restore
      node carrying the reason and an event-shaped restore signal (the
      2026-08-01 occurrence's condition was an event — the blocking PR merges —
      not a clock), resolved by monitor/office-hours restoring the cap and
      closing the node. Config stays a bare standing value; the loader shape
      does not change. (3) The fleet NEVER writes the operator's config file —
      read-time resolution only, upholding the 2026-07-11 human/machine split.
      Remaining code scope of this node: emit the cap into every select-tick
      routing decision (the 2026-08-01 occurrence logged target_n 1 with
      max_workers null, so the log carried no evidence the value was a
      deviation). Doctrine recorded on strategy-graph-native-dispatch
      (2026-08-04 throttle-as-intervention clarification). Park cleared; re-run
      /align-tactics to plan the narrowed scope."
  - question: Does emitting max_workers on the routing-decision log require a new
      ceiling-resolution site, or can the plan reuse the existing
      `dispatch-target-workers --max` reads already in the code?
    answer: "(Recorded 2026-08-09 /align-tactics tactic-mode drift review, verified
      against dispatch-select-tick at commit 82359a33.) Emitting the ceiling on
      the routing-decision record for the AUTONOMOUS no-arg queue path requires
      a new resolution site: that path resolves only TARGET_N
      (`dispatch-target-workers`, line 686); the absolute ceiling
      (`dispatch-target-workers --max`) is resolved today ONLY inside that
      path's at-cap pace-exempt sub-branch (line 744) and unconditionally in the
      `--manual` branch (line 867). Since the 2026-08-01 occurrence this node
      exists to make visible consisted of ordinary autonomous ticks logging
      target_n 1, the autonomous path's records must carry the ceiling, so the
      plan hoists/adds an unconditional `--max` read there rather than reusing
      only the existing sites. The precedent for an unreadable ceiling is line
      744-763's non-fatal handling (a non-numeric ceiling closes the pace-exempt
      lane with skip_reason `at-cap-ceiling-unreadable` rather than crashing the
      tick): for the LOG field, an unreadable ceiling emits the field as JSON
      null, never aborting the tick — `_dlog_select_emit` (lines 111-142)
      already coerces empty numeric vars to null in-filter for exactly this
      reason. The explicit-single-node lane (NODE_ARG, line 931+, which by its
      own comment at line 933 skips the pace curve and the ceiling entirely)
      keeps emitting the field absent/null, which is correct rather than a gap."
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 10
  rationale: >-
    Author-directed 2026-08-03: prioritize bug-ledger fixes directly BELOW the
    token-efficiency cluster. Boost 12 resolves to 17.33 because an inbound
    distributor adds 5.33 — under that cluster's 20.00 and above the 5.33
    undecomposed baseline. Simulated over the live store before writing: 0 tier
    changes, 0 value drift onto non-target nodes.


    LEVEL MIGRATION 2026-08-14: tier 1 boost snapped from 12 to the closed level
    vocabulary value 10 (low) per strategy-graph-drives-dispatch's
    level-vocabulary clarification; ordering intent unchanged.
phase: done
execution:
  branch: tactic-worker-cap-config-durability
  pr: 3058
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-10T06:52:04Z
    mergeCommitSha: 3fb01db157c13a06ca5b75c4b6f23ac450ae68f1
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# dispatch.config/target-workers.json — the fleet's throughput dial — is untracked by git, carries no provenance and no expiry, and no detect compares it to a standing value, so a deliberately temporary throttle is indistinguishable from the intended setting and silently becomes permanent

## Context

**The occurrence (confirmed live 2026-08-03).** On 2026-08-01 the fleet's
concurrency ceiling (`max_concurrent_workers` in `dispatch.config/target-workers.json`,
loader default 8) was deliberately reduced from 3 to 1 as an explicitly temporary
measure with a written restoration condition (restore once the blocking PR merges
and a clean day passes). The blocking PR merged 2026-08-03T03:00Z. The cap was
still 1 at 2026-08-03T13:00Z and was restored only because a human happened to
re-read a planning document that recorded the intent — the graph and the fleet
had no representation of it at all. The fleet ran at one third of its intended
capacity for roughly two days. It was **not idle** (7 PRs merged, 20 distinct
nodes selected in the window), so no stall detect fires on this class of failure;
the loss is invisible throughput.

**Why the routing log did not catch it.** Every `dispatch-select-tick` run emits
exactly one structured routing-decision record (`_dlog_select_emit`, an EXIT trap,
`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:111-142`) carrying
`ts, site, target, phase, disposition, skip_reason, target_n, effective_live, gap`.
Across the whole window those records logged `target_n: 1` — and there is **no
`max_workers` field at all**. From `target_n: 1` alone an operator cannot tell
whether the 5-hour pace curve happened to compute 1 today (normal, transient,
telemetry-driven) or the absolute ceiling itself had been throttled to 1 (a
deviation). The two bounds are indistinguishable in the log because only one of
them is recorded.

**Ruled scope (2026-08-04 /align interview; see the matching
`throttle-as-intervention` clarification on `strategy-graph-native-dispatch`, and
this node's own `clarifications[0]`).** The original greenfield sketch on this
node — track the config in git, add a standing/deviation schema with `expires_at`,
have the tick restore the standing value on expiry — is **superseded**, on three
author rulings:

1. **Git-tracking of the config file is DESCOPED** to the separate, already-tracked
   `tactic-dispatch-config-instance-repo` migration. Once migrated, the committed
   value IS the standing value and deviation detection is a plain `git diff`.
2. **No self-expiring deviation machinery** — ruled unintentional bloat. A
   deliberate temporary throttle is an *intervention* by a session; the intervening
   session mints a find-or-create restore node carrying the reason and an
   event-shaped restore signal (the 2026-08-01 condition was an event — the
   blocking PR merges — not a clock), resolved by monitor/office-hours restoring
   the cap and closing the node. Config stays a bare standing value; the loader
   shape does not change.
3. **The fleet NEVER writes the operator's config file** — read-time resolution
   only, upholding the 2026-07-11 human/machine config split.

**The greenfield design this plan implements.** A routing-decision record should
be a complete account of the decision it records: every bound the scheduler
actually consulted appears on the line, and a bound it deliberately did not consult
is explicitly `null` rather than absent. Today `target_n` (the pace-curve target)
is on the line and `max_workers` (the absolute ceiling) is not — an asymmetry with
no design reason, only an implementation accident: the autonomous lane resolves
the ceiling *only inside its at-cap sub-branch*, so on an ordinary under-cap tick
(exactly the 2026-08-01 shape) no ceiling value is even in scope when the trap
fires. The fix is to resolve the ceiling once per lane, alongside `target_n`, and
emit it. No migration path is needed: the log is append-only JSONL, its single
reader (`dispatch-fleet-watch`) reads only `.ts`, and the new field is additive.

**Honest bound on what this buys.** Emitting the effective ceiling makes the two
bounds *separable* in the log: a reader sees the ceiling was 1 while the loader's
documented default is 8, which is what "1 was a throttle, not the pace curve"
looks like. It does not by itself diff the running value against a *committed*
standing value — that comparison arrives with `tactic-dispatch-config-instance-repo`.
This node's remaining scope is the log field, and only that.

**Related, distinct nodes** (do not absorb their scope):
`tactic-pace-exempt-ceiling-fanout` concerns a lane that reads no ceiling at all;
`tactic-dispatch-config-instance-repo` owns provenance/git-tracking;
`tactic-config-unreadable-latch` (named in the code comment at
`dispatch-select-tick:757-759`) owns unifying the three config-read failure sites
behind one durable operator-visible latch.

---

## Unit 1 — Resolve the ceiling once per lane and emit it as `max_workers`

**Scope.** One file:
`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`.

- **`_dlog_select_emit` (lines 111-142).** Add one `jq` arg and one object field:
  `--arg max_workers "${MAX_WORKERS:-}"`, and `max_workers: ($max_workers | num),`
  placed immediately after the `target_n` line so the record reads
  `… target_n, max_workers, effective_live, gap`. Read it defensively as
  `${MAX_WORKERS:-}` exactly like `${TARGET_N:-}` — the script runs under
  `set -u` and `MAX_WORKERS` is genuinely unset on every path that never resolves
  it. The existing in-filter `def num: if . == "" then null else (tonumber? // null) end;`
  already coerces empty → JSON null; **do not add a new filter or a second field**.
- **Autonomous no-arg lane (line 686,
  `TARGET_N=$("$SCRIPT_DIR/dispatch-target-workers")`).** Immediately after that
  assignment and **before** the existing non-numeric-`TARGET_N` guard at 687-693,
  hoist the ceiling read that today happens only inside the at-cap sub-branch:
  `MAX_WORKERS=$("$SCRIPT_DIR/dispatch-target-workers" --max 2>/dev/null) || MAX_WORKERS=""`.
  Deliberately **non-fatal**: do NOT add a numeric guard here and do NOT `exit 2`
  on a bad ceiling. Placing it before the `TARGET_N` guard means the
  `internal-error`/`non-numeric-target` record also carries the ceiling.
- **At-cap pace-exempt sub-branch (line 744).** Delete the re-resolution
  `MAX_WORKERS=$("$SCRIPT_DIR/dispatch-target-workers" --max 2>/dev/null) || MAX_WORKERS=""`
  and use the hoisted value. **Everything below it is unchanged and its semantics
  are load-bearing**: the `[[ "$MAX_WORKERS" =~ ^[0-9]+$ ]]` test, `PACE_GAP`
  computation and clamping, `PACE_LANE_CLOSED="at-cap-ceiling-full"` /
  `"at-cap-ceiling-unreadable"`, the stderr `echo` at line 761, and `GAP=$PACE_GAP`
  at 767. An unreadable ceiling must keep failing **closed on the pace-exempt lane
  only**, leaving the `main-broken` probe and the #725 re-seed below it reachable
  (comments at 731-743 and 755-760 explain why nothing heavier may live there).
  Reword the comment at 744 to say the value was resolved once at the top of this
  lane rather than here.
- **`--manual` lane (lines 866-867).** No code change — it already resolves both
  `TARGET_N` and `MAX_WORKERS` unconditionally; the emitter picks the value up
  automatically.
- **`NODE_ARG` explicit-single-node lane (lines 931-937).** No change, by design.
  Its own comment (line 933) records that it "skip[s] the pace-curve throttle and
  the MAX_WORKERS ceiling entirely"; `MAX_WORKERS` stays unset there and the record
  carries `max_workers: null`. **Null there is the correct record, not a gap — do
  not add a ceiling read to this lane.** Same for early exits before line 686
  (`busy`, `usage-error`, `sync-*`), which already emit `target_n: null`.
- **Comments/narrative.** Update the `_dlog_select_emit` header comment (111-118)
  and the header narrative around lines 55-82 to list `max_workers` and state the
  contract: *the field carries the resolved `max_concurrent_workers` ceiling on
  every lane that consults it, and `null` on lanes that deliberately do not.*

**Safety note the implementer must not re-litigate.** Hoisting means
`dispatch-target-workers --max` now runs on autonomous ticks that exit before the
at-cap branch (e.g. `rate-limit-exhausted`). This is confirmed safe:
`--max` mode short-circuits at
`.claude/skills/dispatch-propagate/scripts/dispatch-target-workers:265-270`,
*before* the rate-limit/telemetry load, reading only `dispatch-config-load
target-workers`. It writes no state and has no side effects; the cost is one cheap
config read per tick.

**Out of scope.** `dispatch-target-workers`, `dispatch-config-load`, the config
file itself or its schema; the pace curve; `gap` computation or fan-out width; any
other decision-log emit site (e.g. `dispatch-stop.sh`'s per-worker records); any
`expires_at` / standing-value / restore machinery (author-ruled out); any write to
the operator's config file (forbidden); git-tracking the config (owned by
`tactic-dispatch-config-instance-repo`).

**Recommended model.** opus — it edits the fleet's live concurrency gate, where
the fail-closed ordering around an unreadable ceiling must be preserved exactly.

## Unit 2 — Cover the new field across all four lanes, and document it

**Scope.** Two files.

**A. `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`.**
The fixture needs no new knobs: the fake `dispatch-target-workers` (lines 158-169)
already answers `--max` with `${SEL_MAX_WORKERS:-8}` and count-mode with
`${SEL_TARGET_N:-1}`; `sel_tick_setup` isolates the log to
`$DISPATCH_DECISION_LOG_DIR` (line 263); the established read pattern is
`DLOG_FILE="$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"` then
`assert_eq … "$(tail -n1 "$DLOG_FILE" | jq -r '.field')"` (lines 433-447).
Add/extend:

1. **Autonomous under-cap tick logs the ceiling.** Extend the existing
   "under cap → gap = target − live" test (line 1235; `SEL_LIVE_COUNT=1
   SEL_TARGET_N=4`, ceiling defaults to 8): assert `.target_n` == `4` **and**
   `.max_workers` == `8` on the last record.
2. **The 2026-08-01 shape is now visible.** New test: `SEL_TARGET_N=1
   SEL_MAX_WORKERS=1`, an ordinary under-cap graph selection → the record carries
   `.target_n` `1` **and** `.max_workers` `1`, i.e. the throttled ceiling appears
   on the line instead of being absent. Name it for the occurrence so the
   regression's intent survives.
3. **Fail-closed path unchanged by the hoist.** Extend the existing "at-cap
   non-numeric ceiling" test (line 602, `SEL_MAX_WORKERS="not-a-number"`): assert
   `.max_workers` is `null` **and** `.skip_reason` is still
   `at-cap-ceiling-unreadable` and exit 0. Do the same on the "crashed
   `dispatch-target-workers --max`" test (line 625).
4. **`--manual` lane.** Extend the "gap-clamped-to-headroom" test (line 1418):
   assert `.max_workers` equals the stubbed ceiling that test sets.
5. **Explicit-node lane logs null by design.** Extend "explicit node-id + at-cap
   live count → still selects" (line 1635): assert `.max_workers` is `null`
   (`jq -r` prints the string `null`) — locking in that this lane consults no
   ceiling.
6. **Ceiling resolved before the `TARGET_N` guard.** Extend "non-numeric TARGET_N
   → release + exit 2" (line 1140): assert the `internal-error` record still
   carries `.max_workers` `8`.

*Style constraint:* committed `.sh` files are linted by `lint-prose-rules.sh` —
never pipe a captured JSON variable through `echo` into `jq`. Use the existing
`tail -n1 "$DLOG_FILE" | jq -r '…'` form (a direct pipe, safe) or `jq … <<<"$VAR"`.

**B. `.claude/skills/dispatch-propagate/reference.md`, "Concurrency budgeting"
section (~lines 394-410).** Add one sentence after the existing sentence about
`gap` being carried on the decision line: the per-tick decision line also carries
`max_workers` — the resolved `max_concurrent_workers` ceiling — alongside
`target_n` / `effective_live` / `gap`, and it is `null` on lanes that consult no
ceiling (the explicit-single-node dispatch lane, and any exit before the gate
runs). No other doc carries a field list for this record, so nothing else needs
syncing.

**Out of scope.** No changes to other test files, to the fixture's stub scripts,
or to `dispatch-fleet-watch` (it reads only `.ts`; the field is additive).

**Recommended model.** sonnet — unit-test writing with explicit cases plus a
one-sentence doc addition.

**Dependencies.** Unit 1.

## Reuse

- `decision_log_append` —
  `.claude/skills/dispatch-propagate/scripts/lib-decision-log.sh` (the single
  shared, write-only, always-returns-0 JSONL writer). Unchanged; the new field
  rides the existing record.
- The `def num:` empty→null coercion already inside `_dlog_select_emit` —
  `dispatch-select-tick:128-142`. No new jq logic.
- The `DLOG_*` accumulators + EXIT trap (`dispatch-select-tick:106-146`) — the
  one-record-per-run mechanism the new field joins.
- `dispatch-target-workers --max` —
  `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers:34-36,209,265-270`
  (already the canonical ceiling resolver; side-effect free).
- The existing at-cap fail-closed block —
  `dispatch-select-tick:744-767` (reused as-is, only its input is hoisted).
- Test fixture stubs `SEL_MAX_WORKERS` / `SEL_TARGET_N` / `SEL_LIVE_COUNT` and
  `DISPATCH_DECISION_LOG_DIR` isolation —
  `test-dispatch-select-tick.sh:158-169,263`.
- The `tail -n1 … | jq -r` decision-log assertion pattern —
  `test-dispatch-select-tick.sh:433-447`.

## Verification

The shell suites are auto-discovered by `run-unit-tests.sh` (it globs
`"$SCRIPTS"/test-*.sh`), so the targeted suite and the full dispatch-script sweep
both cover this change.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

Manual confirmation, cheap and optional (the suites above are the authoritative
check — the assertions in Unit 2 cover all four lanes):

- After the branch is checked out, run the tick's autonomous path once in a
  scratch environment (or simply read the newest real record after the change is
  on main) and confirm the field is present and populated:
  `tail -n1 ~/.local/share/commons-dispatch/routing-decisions.jsonl | jq '{ts, disposition, target_n, max_workers, effective_live, gap}'`.
  Expect `max_workers` to equal the standing `max_concurrent_workers` (8 unless
  the operator has deliberately throttled it) — and, critically, to be a number
  rather than absent.
- Judgment check on a record from an explicit single-node dispatch: `max_workers`
  must be `null` there. A number on that lane would mean someone added a ceiling
  read the design explicitly excludes.
