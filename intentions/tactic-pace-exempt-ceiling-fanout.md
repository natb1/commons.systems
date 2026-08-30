---
id: tactic-pace-exempt-ceiling-fanout
kind: tactic
statement: Pace-exempt bypass fills to the worker ceiling and never exceeds it
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-31 /align-strategy fleet-scheduling
  exception-lanes round. dispatch-select-tick's autonomous at-cap block diverges
  from the record in two opposite directions at once, and one ratified rule
  fixes both: it admits only ONE pace-exempt worker per gate firing (narrower
  than the amended fill-to-ceiling rule) while consulting no ceiling at all
  (wider than the standing max_concurrent_workers invariant) — and because the
  gate re-evaluates every tick with no memory of a prior bypass, that unbounded
  half can compound across ticks, not just overshoot by one. Both are defects
  against the record, not design choices."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Item-13 — does a persistently unreadable max_concurrent_workers need a
      durable operator-visible signal, and is the TARGET_N/MAX_WORKERS severity
      asymmetry intentional?
    answer: "(Ruled 2026-08-04 /align interview, author-ratified.) Follow-up
      recommended: the durable graph latch — a find-or-create
      tactic-config-unreadable-<key> node with stand-down-once-open semantics
      (the tactic-main-red-* shape) — retained as draft
      tactic-config-unreadable-latch, which owns routing all three config-read
      sites (dispatch-select-tick:643, :707, :814) through one signal path. On
      THIS PR (#3034): option 1 — a comment at :707 documenting that log-only is
      deliberate because the main-broken probe and reseed below the at-cap block
      must stay reachable, pointing at the follow-up node; land item-9's
      crashed-stub test; then qa proceeds with no further residue. Asymmetry
      ruling: the divergence in degradation scope is intentional functionality
      (TARGET_N is load-bearing for the whole tick, so an unreadable value
      halts; MAX_WORKERS bounds one bypass lane, so failing closed on that lane
      alone is proportionate), but the divergence in signal durability is not —
      the latch unifies signaling while each site keeps its own blast radius.
      Park cleared on this ruling."
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.03
  rationale: >-
    Author-directed 2026-08-03: prioritize bug-ledger fixes directly BELOW the
    token-efficiency cluster. Boost 12 resolves to 17.33 because an inbound
    distributor adds 5.33 — under that cluster's 20.00 and above the 5.33
    undecomposed baseline. Simulated over the live store before writing: 0 tier
    changes, 0 value drift onto non-target nodes.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 12 to 0.03 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-pace-exempt-ceiling-fanout
  pr: 3034
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-06T02:00:47Z
    mergeCommitSha: e8f06d1dcfc3a33064d4646f578d9adfc8984582
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: provision-node-worktree failed for this tactic (exit 2)
  since: 2026-08-09
  recommendation: Inspect the provisioning failure (git fetch/worktree add,
    direnv) in the tick journal, fix the environment, and re-run the phase.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 12
---
# Pace-exempt bypass fills to the worker ceiling and never exceeds it

## Context

`dispatch-select-tick`'s autonomous at-cap block diverges from the recorded
fleet-scheduling rule in two opposite directions at once, and one computation
fixes both.

The record (strategy `strategy-graph-native-dispatch`, fleet-scheduling
exception-lanes clarification of 2026-07-31, amending the earlier
"admits ONE gate-exempt worker" entry): **LANE 1** — `pace_exempt` lifts the
pace GATE to the full `max_concurrent_workers` headroom and never past it.
Whenever effective-live >= the pace target and tokens remain, the lane admits
up to `(max_concurrent_workers - effective_live)` workers, not one. The rule is
uniform — not scoped to the paced-to-zero case, so there is no discontinuity at
target 1. **LANE 2** — a deliberate human dispatch (`/dispatch`, or
`dispatch <node-id>`) launches exactly one worker ignoring both the pace curve
and the ceiling; that lane is already implemented and is NOT touched here.
The resulting invariant: `max_concurrent_workers` is ABSOLUTE for all
autonomous scheduling, pace-exempt work included, and only a conscious human
act may exceed it, by exactly one node. The shared floor — genuine token
exhaustion (`dispatch-target-workers --exhausted`) — is the one hard stop on
every lane and is unchanged.

### The two defects, both in one block

`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, the
autonomous at-cap branch — the `if (( LIVE_COUNT >= TARGET_N ))` block at
`dispatch-select-tick:655-713`:

1. **Too narrow.** `dispatch-select-tick:683` probes
   `graph-select-target --pace-exempt-only --top 1` — a hardcoded 1, admitting
   exactly one gate-exempt worker. The ratified rule is fill-to-headroom.
2. **Too wide, and not bounded to "max + 1".** The block never reads
   `MAX_WORKERS` at all — verified: zero occurrences of `MAX_WORKERS` between
   `dispatch-select-tick:628` (`GAP=1`) and the hard-cap exit at
   `dispatch-select-tick:713`, while the `--manual` branch below it does resolve
   `dispatch-target-workers --max` at `dispatch-select-tick:767`. The branch
   fires on `LIVE_COUNT >= TARGET_N` whatever `TARGET_N` is, and admits one more
   worker than whatever is currently live at that instant — not specifically one
   more than `max_concurrent_workers`. Worse, the gate is re-evaluated fresh
   every tick with no memory of a prior bypass: the spawned worker counts as
   busy on the next tick, `LIVE_COUNT` is still `>= TARGET_N` (trivially so at a
   paced-to-zero curve, `0 >= 0`), and the lane fires again. The overage
   compounds across ticks, bounded only by how many distinct selectable
   `pace_exempt` candidates exist — not by `max_concurrent_workers` (this code
   path never reads it) and not by a single "+1".

The two are not independent bugs to fix separately: computing the headroom is
what fixes both at once.

Scope-bounding fact worth knowing before reading the units: the *under-cap*
autonomous fan-out already honors the ceiling implicitly, because
`dispatch-target-workers` clamps the pace-curve target to the configured
ceiling (`dispatch-target-workers:591`, `N = clamp(N, 1, max_workers)`), so
`GAP = TARGET_N - LIVE_COUNT` at `dispatch-select-tick:715` can never exceed it.
The at-cap pace-exempt lane is the ONLY autonomous path that escapes the
ceiling. That is why this fix is confined to one block.

### Intended outcome

After this change, the autonomous at-cap lane computes
`PACE_GAP = max(0, MAX_WORKERS - LIVE_COUNT)` and passes it through as
`--top "$PACE_GAP"`. When `PACE_GAP` is 0 the lane admits nothing and the branch
falls through to the existing main-broken probe and hard cap, so
`max_concurrent_workers` becomes genuinely absolute for autonomous work while
the pace-exempt lane gets its full ratified width.

---

## Unit 1 — Compute the ceiling headroom in the autonomous at-cap block

### Scope

Single file: `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`,
inside the `if (( LIVE_COUNT >= TARGET_N ))` block that spans
`dispatch-select-tick:655-713`. No other file changes in this unit.

Current shape of that block, for orientation:

- `:655` `if (( LIVE_COUNT >= TARGET_N )); then` — `LIVE_COUNT` is
  `BUSY + RESV` (effective live), computed at `:653`.
- `:665` `EXHAUSTED=$("$SCRIPT_DIR/dispatch-target-workers" --exhausted …)`,
  followed by the exhausted hard-stop exit at `:666-675`.
- `:683-684` the pace-exempt probe:
  `GPRIO=$("$SCRIPT_DIR/graph-select-target" --pace-exempt-only --top 1)` with a
  `|| { …; GPRIO="empty"; }` fallback.
- `:685-688` `if emit_graph_selection <<<"$GPRIO"; then
  DLOG_SKIP_REASON="pace-exempt-bypass-at-cap"; exit 0; fi`.
- `:698-706` the main-broken first-detection probe (`repo-health
  --main-broken-sha`), gated on `[[ -z "$OPEN_MAIN_RED" ]]`.
- `:708-713` the hard-cap exit: `release_lock`, `dispatch-schedule-reseed`,
  `DLOG_DISPOSITION="concurrency-cap"`, `DLOG_SKIP_REASON="at-cap-no-priority"`,
  `echo "concurrency-cap"`, `exit 0`.

Changes:

1. **Resolve the ceiling** after the `--exhausted` hard stop (`:675`) and before
   the probe (`:683`). Mirror the `--manual` branch's accessor
   (`dispatch-select-tick:767`) but not its exit-2 posture:

   ```bash
   MAX_WORKERS=$("$SCRIPT_DIR/dispatch-target-workers" --max 2>/dev/null) || MAX_WORKERS=""
   PACE_LANE_CLOSED=""
   if [[ "$MAX_WORKERS" =~ ^[0-9]+$ ]]; then
     PACE_GAP=$(( MAX_WORKERS - LIVE_COUNT ))
     (( PACE_GAP < 0 )) && PACE_GAP=0
     (( PACE_GAP == 0 )) && PACE_LANE_CLOSED="at-cap-ceiling-full"
   else
     echo "dispatch-select-tick: dispatch-target-workers --max returned a non-numeric ceiling ('$MAX_WORKERS'); pace-exempt lane closed rather than admitting an unbounded bypass" >&2
     PACE_GAP=0
     PACE_LANE_CLOSED="at-cap-ceiling-unreadable"
   fi
   GAP=$PACE_GAP
   ```

   Design decisions this pins down, so the implementer decides nothing:

   - **Placement after `--exhausted`.** The exhaustion hard floor stays first
     and unchanged: an exhausted window must not pay a config read and must not
     probe. This ordering is required by the record.
   - **Fail CLOSED on a non-numeric ceiling** (skip the lane), not open. This is
     the pause-evaluation precedent from the strategy's own conditions ("any
     config resolve/read/parse failure is treated as paused, never as
     not-paused") applied to the same `dispatch.config/` family. It deliberately
     DIVERGES from `graph-select-target`'s `--standalone` path, which fails open
     to `TOP=1` (`graph-select-target:364, 378, 405`) — that path is clamping an
     already-bounded selection, whereas here failing open is exactly the
     unbounded-bypass defect being removed. Do not use exit 2 (the `--manual`
     branch's posture at `dispatch-select-tick:768-773`): wedging the whole
     autonomous tick on a config typo would also suppress the main-broken probe
     and the reseed, which are not ceiling-dependent.
   - **`GAP=$PACE_GAP`** makes the routing decision log's `gap` field
     (`dispatch-select-tick:127`, `--arg gap "${GAP:-}"`) record the width this
     lane actually granted instead of the stale `GAP=1` default from
     `dispatch-select-tick:628`. Every at-cap terminal path exits inside this
     block, so `GAP` is never read again by the normal fan-out at
     `dispatch-select-tick:952` on this path.

2. **Gate and widen the probe.** Wrap the existing probe + `emit_graph_selection`
   pair (`:683-688`) in `if (( PACE_GAP > 0 )); then … fi`, and replace the
   hardcoded `--top 1` with `--top "$PACE_GAP"`. Keep the `||
   { …; GPRIO="empty"; }` failure fallback and the `DLOG_SKIP_REASON=
   "pace-exempt-bypass-at-cap"` on a hit exactly as they are.

3. **Distinguish the closed-lane dispositions** at the hard-cap exit
   (`:708-713`). Replace the unconditional
   `DLOG_SKIP_REASON="at-cap-no-priority"` at `:711` with:

   ```bash
   DLOG_SKIP_REASON="${PACE_LANE_CLOSED:-at-cap-no-priority}"
   ```

   so the log tells three cases apart: `at-cap-no-priority` (lane probed, empty),
   `at-cap-ceiling-full` (lane never probed — already at the ceiling), and
   `at-cap-ceiling-unreadable` (lane never probed — config unreadable).
   `PACE_LANE_CLOSED` is initialized to `""` above, so `set -u` is satisfied.

4. **Update the block's own comment prose**, which currently documents the
   behavior being replaced and is load-bearing narrative for clean-session
   readers (repo convention; match the register/detail of the `--manual`
   branch's comment at `dispatch-select-tick:730-761`):
   - `dispatch-select-tick:602-627` — the Step-1b overview, specifically the
     case-2 bullet at `:612-616` ("appends GAP=1 for ONE gate-exempt worker").
   - `dispatch-select-tick:656-664` — the inline "one gate-exempt worker,
     GAP=1" framing.
   - `dispatch-select-tick:675-682` — the comment above the probe ("Whichever
     lane finds an item first admits the ONE gate-exempt worker — at most one
     total"). The surviving true half — the flag bypasses the pace GATE, not the
     COUNT or the rank order — must be kept; a bypassed worker is still counted
     by `claude_agents_count_busy_workers` on later ticks.
   New prose must state: the lane fills to `PACE_GAP = max(0, MAX_WORKERS -
   LIVE_COUNT)`; the ceiling is absolute for autonomous scheduling; a
   non-numeric ceiling closes the lane (fail closed) rather than admitting an
   unbounded bypass; exhaustion remains the hard floor evaluated first.

Explicitly OUT of scope for this unit:

- `graph-select-target` behavior. `--top` and `--pace-exempt-only` already
  compose (`graph-select-target:169` `TOP=1` default, `:193` `--top` parse,
  `:194` `--pace-exempt-only` parse, `:211` only `--node` is mutually exclusive;
  the filter itself is at `:782`). Its `--standalone` headroom clamp
  (`graph-select-target:347-405`) is a different caller path and must not change.
- `emit_graph_selection` (`dispatch-select-tick:227-255`) — it already loops
  over every `node <id> <kind> <phase>` line, writes one reservation per id, and
  emits the joined `graph <n> <specs…>` decision line. A wider grant flows
  through unchanged.
- `dispatch-tick`'s `graph` arm (`dispatch-tick:729-757`) — it already shifts
  and forwards N specs to `dispatch-graph-execute`. No downstream change.
- The `--manual` branch (`dispatch-select-tick:733-830`) and the explicit-node
  branch (`:831+`). Both human lanes keep their exactly-one-node ceiling
  override; the record says no code is owed for lane 2.
- The main-broken at-cap bypass (`:698-706`). It stays reachable when the
  pace-exempt lane is closed, ceiling-full included — a red main must still
  surface its diagnose job. Changing that is a separate question.
- How many nodes are marked `pace_exempt`. This fix computes headroom
  correctly; it does not change the marking discipline.

### Recommended model

opus

---

## Unit 2 — Test the fan-out width and the two closed-lane paths

### Scope

Single file:
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`.

1. **Make the mock observable.** The fake `graph-select-target` at
   `test-dispatch-select-tick.sh:82-91` currently branches on the
   `--pace-exempt-only` substring and writes the literal `called` to
   `logs/graph-select-pace-exempt.log` (`:85`) without recording the arg list,
   so no test can assert the `--top` value. Change `:85` to log the full arg
   list instead, mirroring how the plain-query branch already does it at `:89`:

   ```bash
   echo "\$*" >> "$TMPDIR_TEST/logs/graph-select-pace-exempt.log"
   ```

   (It is inside an unquoted `<<FAKE` heredoc, hence the escaped `\$*`.) This is
   backward-compatible: all six existing assertions on that log test only file
   existence — `:544`, `:559`, `:1103`, `:1253`, `:1423`, `:1463` — so they stay
   green.

2. **New test: the lane fills to headroom.** `SEL_TARGET_N=1
   SEL_LIVE_COUNT=1 SEL_MAX_WORKERS=3` → `PACE_GAP=2`. Set
   `SEL_GRAPH_PACE_EXEMPT` to two node lines
   (`$'node tactic-p1 tactic implement\nnode tactic-p2 tactic qa'`). Assert:
   the probe log's last line contains `--top 2`; the decision line is
   `graph 2 tactic-p1:tactic:implement tactic-p2:tactic:qa`; a reservation
   marker exists for BOTH ids under `$DISPATCH_RESERVATION_DIR`; the lock is
   released; the routing-decision log's last record has
   `.skip_reason == "pace-exempt-bypass-at-cap"` and `.gap == 2`.

3. **New test: at the ceiling the lane never runs.** `SEL_TARGET_N=1
   SEL_LIVE_COUNT=3 SEL_MAX_WORKERS=3` → `PACE_GAP=0`. Set
   `SEL_GRAPH_PACE_EXEMPT="node tactic-p tactic implement"` (available but must
   not be admitted). Assert: `logs/graph-select-pace-exempt.log` does NOT exist;
   the decision line is `concurrency-cap`; the lock is released; the reseed was
   scheduled (`logs/schedule-reseed.log` == `called`); the decision log's last
   record has `.skip_reason == "at-cap-ceiling-full"`. This is the regression
   test for the compounding-overage defect.

4. **New test: a non-numeric ceiling closes the lane, does not wedge the tick.**
   `SEL_TARGET_N=1 SEL_LIVE_COUNT=1 SEL_MAX_WORKERS="not-a-number"` with
   `SEL_GRAPH_PACE_EXEMPT` set. Assert: exit code 0 (not 2); decision line
   `concurrency-cap`; probe log absent; `.skip_reason ==
   "at-cap-ceiling-unreadable"`.

Reuse for all three: the existing fake `dispatch-target-workers`
(`test-dispatch-select-tick.sh:158-169`) already answers `--max` from
`SEL_MAX_WORKERS` (default 8), `--exhausted` from `SEL_EXHAUSTED`, and the
no-arg query from `SEL_TARGET_N`; `SEL_MAX_WORKERS` is already in the per-test
env reset list at `:396-400`, so no harness plumbing is needed. Use
`sel_tick_setup` / `run_sel_tick` / `sel_tick_teardown` (`:22`, `:413`) and
`assert_eq`, and read the routing log at
`"$DISPATCH_DECISION_LOG_DIR/routing-decisions.jsonl"` with
`tail -n1 … | jq -r …`, exactly as the existing tests at `:433-440` and
`:487` do. Model the new tests on the existing at-cap pace-exempt test at
`:517-533`.

Explicitly OUT of scope:

- Modifying the existing at-cap tests. Verified by reading them: every existing
  at-cap case uses `SEL_LIVE_COUNT` of 1, 2, or 3 against the mock's default
  `SEL_MAX_WORKERS=8`, so `PACE_GAP` stays positive and the probe still runs —
  `:517-533`, `:536-548`, `:551-560`, `:1097-1105`, `:1238-1254`,
  `:1411-1425`, `:1455-1465` all stay green unmodified. The mock's
  `--pace-exempt-only` branch ignores `--top` and always prints the whole of
  `SEL_GRAPH_PACE_EXEMPT`, so the single-node expectations at `:526-532` remain
  correct.
- `test-graph-select-target.sh` — `graph-select-target` is unchanged.
- Any change to `lib-test-decision-log-guard.sh`; the suite already redirects
  `DISPATCH_DECISION_LOG_DIR` into a per-run temp dir (`:263`).

### Recommended model

sonnet

### Dependencies

Unit 1.

---

## Unit 3 — Sync the cross-file prose that still documents "exactly ONE"

### Scope

Two comment blocks in other files that assert the superseded single-worker rule
and would contradict Unit 1:

1. `.claude/skills/dispatch-propagate/scripts/dispatch-tick:48-58` — the
   "Pace-exempt/main-broken bypass (autonomous path, at-cap, not exhausted)"
   paragraph, specifically "a hit holds the lock and spawns exactly ONE
   gate-exempt worker (`GAP=1`)". Rewrite to: a hit holds the lock and spawns up
   to `max_concurrent_workers - LIVE_COUNT` gate-exempt workers (0 closes the
   lane); the ceiling is absolute for autonomous scheduling. Keep the surrounding
   true statements — exhaustion is the hard floor for both paths
   (`dispatch-tick:38-47`), and either bypass still counts toward `LIVE_COUNT`
   and suppresses non-pace-exempt fan-out on later ticks.
2. `.claude/skills/dispatch-propagate/scripts/graph-select-target:104-111` — the
   `--pace-exempt-only` usage block, specifically "The caller admits at most one
   gate-exempt worker". Rewrite to: the caller admits up to its computed
   ceiling headroom via `--top`; the flag bypasses the pace GATE, not the worker
   count, the `max_concurrent_workers` ceiling, or the rank order. No behavior
   change in this file.

Explicitly OUT of scope: any executable line in either file; the
`dispatch-tick:110-118` decision-shape table (still accurate — the at-cap
pace-exempt case already emits a `graph` decision, now possibly with a count
above 1, which that table does not contradict); every other `pace_exempt`
mention found in the tree (`dispatch-fleet-alarm:663-670`,
`dispatch-diagnose-main/SKILL.md:151,171`,
`packages/intentionsutil/**`) — those describe the flag's authoring, not the
bypass width.

### Recommended model

sonnet

### Dependencies

Unit 1 (the prose must describe the landed semantics, including the fail-closed
ceiling-unreadable case).

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:766-777` —
  the `--manual` branch's `MAX_WORKERS=$("$SCRIPT_DIR/dispatch-target-workers"
  --max)` accessor plus `HEADROOM=$(( MAX_WORKERS - LIVE_COUNT ))` /
  `(( HEADROOM < 0 )) && HEADROOM=0`. The formula to mirror (its exit-2
  non-numeric posture is deliberately NOT mirrored — see Unit 1).
- `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers:201-270` —
  `--max` is the existing accessor for `max_concurrent_workers` (config-only,
  short-circuits before any telemetry; default 8, config at
  `dispatch.config/target-workers.json`, schema example at
  `.claude/skills/dispatch-propagate/scripts/target-workers.example.json`).
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:227-255` —
  `emit_graph_selection`: while-read over `node <id> <kind> <phase>` lines
  (`:230-239`), per-id `reservation_write` (`:241-248`), joined
  `graph <n> <specs…>` decision line (`:253`). Consumes multi-node grants
  already; no change.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:51-121` —
  `--top <n>` (default 1) composes freely with `--pace-exempt-only`; only
  `--node` is mutually exclusive (`:211`, usage error exit 2). Nothing to change
  on the selector side.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:347-405` — the
  `--standalone` MAX_WORKERS/HEADROOM clamp, cited as the *contrasting*
  precedent (fail OPEN to `TOP=1` on a non-numeric ceiling); Unit 1 fails CLOSED
  and must say why.
- `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:117-141` —
  `_dlog_select_emit`, the routing-decision record; `gap` is already a field
  (`:127`), so recording the granted width needs no schema change.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh:158-169`
  — the arg-aware fake `dispatch-target-workers` (`SEL_MAX_WORKERS` /
  `SEL_EXHAUSTED` / `SEL_TARGET_N`); `:82-91` the fake `graph-select-target`;
  `:22`/`:413` the `sel_tick_setup` / `run_sel_tick` harness; `:517-533` the
  existing at-cap pace-exempt test to model new cases on.
- `.claude/skills/dispatch-propagate/scripts/lib-test-decision-log-guard.sh` —
  already sourced by the shared harness; keeps suite runs out of the developer's
  real routing log. Nothing to add.

## Verification

Targeted suite — the direct regression gate for all three units:

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

Full dispatch-script suite, to catch sibling suites that assert on the at-cap
dispositions or on `graph-select-target`'s usage text:

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

Lint (shellcheck plus the prose-rule linter over net-new added lines):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / observe-in-production checks:

- **The discriminator is the routing decision log, not the flag.** Read
  `${DISPATCH_DECISION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/routing-decisions.jsonl`
  for `site == "select-tick"` records. `skip_reason ==
  "pace-exempt-bypass-at-cap"` with a non-`none` `target` means the lane fired —
  post-fix its `gap` field carries the granted width and `target` may name
  several comma-joined ids. `skip_reason == "at-cap-no-priority"` with `target:
  "none"` means the lane was probed and empty; `at-cap-ceiling-full` means the
  fleet was already at `max_concurrent_workers` and the lane was never probed;
  `at-cap-ceiling-unreadable` means the config read failed and the lane failed
  closed.
- **End-state observation.** Several pace-exempt workers concurrently live with
  the weekly pace curve shut, and `effective_live` never exceeding
  `max_concurrent_workers` across consecutive tick records. Because ticks run
  roughly every 15 minutes and the queue must actually hold multiple selectable
  `pace_exempt` candidates at a moment when the curve is closed, treat this as
  an observe-over-days check rather than a same-session one — the unit tests are
  the gate; this is the confirmation.
- **Hand-probe hazard.** `graph-select-target` appends one JSONL record per
  invocation to the production `graph-selection.jsonl`
  (`${DISPATCH_SELECTION_LOG_FILE:-${DISPATCH_SELECTION_LOG_DIR:-$HOME/.local/share/commons-dispatch}/graph-selection.jsonl}`).
  Redirect `DISPATCH_SELECTION_LOG_DIR` before any hand probe of the
  `--pace-exempt-only` lane, or the evidence you are about to read is
  contaminated by your own probe.
- **Fixture-row tolerance.** Fixture rows have historically leaked into the
  production routing log from suites that set no override; that defect is owned
  by `tactic-test-decision-log-prod-leak` (phase `done`) and the shared harness
  now redirects, but rows written before that landed are still in the file — a
  reading of historical records must tolerate them (filter on plausible node ids
  / timestamps rather than assuming every row is production).
