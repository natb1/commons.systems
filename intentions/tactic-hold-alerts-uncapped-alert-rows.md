---
id: tactic-hold-alerts-uncapped-alert-rows
kind: tactic
statement: listUnclaimedHoldAlerts has no cap on the number of alert rows it
  returns, so a backlog of unclaimed manual holds against a few high-attention
  sources scales dispatch-fleet-watch predicate 5's per-pass claim-probe count
  and its pushed alarm-node body without limit — bound it with a probe budget in
  the watcher, not a row cap in the enumerator, because a library cap would sit
  before the watcher's claimed-row filter and could read as a false all-clear
owner: ai
status: codified
parent: null
rationale: >-
  Deferred cost finding from the /review-fix pass on PR #3036
  (tactic-unclaimed-hold-alerting), source lens "cost", ADVISORY — cost findings
  route straight to Deferred per review-fix's disposition table and were never
  adversarially verified.


  FINALIZED 2026-08-20 (/align-tactics per-node round). The serving strategy's
  body section "### Review & QA Disposition" requires the finalizing round to
  validate a deferred finding's provenance against what actually merged; that
  validation ran against origin/main at 8c81b60a and the recorded finding did
  not survive intact.


  CONFIRMED: listUnclaimedHoldAlerts applies no row cap; opts.topK gates which
  SOURCES qualify, never how many ROWS are emitted, so N manual holds against
  one top-K source emit N rows; each emitted row costs a four-rung claim ladder
  in dispatch-fleet-watch predicate 5; and every surviving row is concatenated
  into B_HOLD, the alarm node body written to the graph and pushed to
  origin/main.


  CORRECTED: every path:line anchor in the original finding was stale
  (hold-alerts.ts is 159 lines; the finding cited :156, :139-157 and :159-166,
  the last past EOF). All anchors in the plan body were re-measured — locate by
  symbol.


  PARTLY REFUTED: the finding claimed two of the four claim probes are live
  daemon round-trips. They are not. Two rungs are reservation_exists, a
  filesystem stat; the other two reach _claude_agents_raw_registered, which
  reads the pinned DISPATCH_AGENTS_SNAPSHOT_ALL file — and dispatch-fleet-watch
  always exports it before predicate 5 runs and gates the whole predicate on
  that capture having succeeded. Corrected per-row cost: up to 2 ledger stats
  plus up to 2 snapshot cat+jq passes, short-circuiting. The finding survives on
  its other half (unbounded alarm-body growth) plus real linear per-row parse
  cost.


  DESIGN DIVERGENCE from the finder's recommendation, deliberate: the finder
  proposed maxAlerts on HoldAlertOpts, a --limit flag on
  list-unclaimed-hold-alerts.ts, and an "and N more" alarm-body tail. This plan
  does none of those. A cap inside the enumerator sits BEFORE
  dispatch-fleet-watch's claimed-row filter, so a cap of N could be filled
  entirely by claimed rows and yield zero findings while genuinely-unclaimed
  holds sit below the cut — a false all-clear, which in this predicate does not
  merely suppress but sends --resolve --kind unclaimed-hold and closes an open
  alarm node. And an "and N more" tail carries a count that moves pass-to-pass,
  violating B_HOLD's deliberate identity-only byte-stability contract (a moving
  body pushes to origin/main once per 5-minute pass). The chosen bound is a
  per-pass probe budget in the watcher (DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES)
  plus a truncation-aware verdict that can never read as clear.


  Live magnitude at finalize: 4 holds total / 3 manual-class, and 0 alerting
  rows even at --min-age-seconds 0 --top-k 40 (4x the production default). The
  defect is a real structural property with no live instance, which is what
  sizes this to two units, one behavioral.
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
# Bound the unclaimed-hold alerting pass: a probe budget in `dispatch-fleet-watch`, not a row cap in the enumerator

## Context

### The defect

`listUnclaimedHoldAlerts` (`packages/intentionsutil/src/hold-alerts.ts`) emits one
alert row per qualifying manual hold with no bound on the row count. `opts.topK`
gates which **sources** count as important; it does not bound how many **rows**
are emitted. Several manual holds can name the same top-K source via their
`blocked_by` edge, so N holds against one hot source emit N rows.

The sole consumer, predicate 5 of
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch`, pays two costs
per emitted row:

1. **Claim probes.** Each row runs a four-rung claimed ladder before it can be
   counted.
2. **Alarm body bytes.** Each surviving (unclaimed) row is concatenated into
   `B_HOLD`, which becomes the body of a graph node written and pushed to
   `origin/main`.

A backlog of unclaimed manual holds against a few high-attention sources
therefore scales both the per-pass probe count and the pushed alarm document
without limit.

### Provenance (corrected this round)

Deferred **cost** finding (ADVISORY — cost findings route straight to Deferred
per `/review-fix`'s disposition table and were never routed through the
verify/skeptic stage) from the `/review-fix` pass on
`tactic-unclaimed-hold-alerting`, source PR #3036.

The serving strategy's body section `### Review & QA Disposition` requires the
finalizing round to validate the deferred finding's provenance against what
actually merged. That validation was performed against `origin/main` at
`8c81b60a`. Result:

- **Confirmed.** The absence of any row cap; the top-K-gates-sources-not-rows
  premise; the per-row claim-probe cost; the unbounded alarm body.
- **Corrected — every `path:line` anchor in the original finding was stale.**
  `hold-alerts.ts` is 159 lines total; the finding cited `:156`, `:139-157` and
  `:159-166`, the last of which is past EOF. All anchors in this plan were
  re-measured. Locate by symbol, never by the original finding's line numbers.
- **Partly refuted — the "live daemon round-trips" claim is wrong.** The finding
  said each row costs "up to four claim probes … two of them live daemon
  round-trips". The four-rung count is right; the daemon claim is not. Two rungs
  are `reservation_exists` (`lib-reservation-ledger.sh:445`), a filesystem stat
  in the ledger dir. The other two are `worktree_has_live_session`
  (`lib-claude-agents.sh:1030`) → `worktree_occupancy_state` →
  `claude_agents_list_registered` → `_claude_agents_raw_registered`
  (`lib-claude-agents.sh:579`), which **reads the pinned snapshot file** when
  `DISPATCH_AGENTS_SNAPSHOT_ALL` is set and only falls back to a live
  `claude agents --json --all` when it is not. `dispatch-fleet-watch` always
  exports it before predicate 5 runs (`dispatch-fleet-watch:317-322`), and
  predicate 5 is *gated* on that capture having succeeded
  (`dispatch-fleet-watch:625` — `SNAPSHOT_ALL_OK -ne 1` short-circuits the whole
  predicate to `unknown`). On every path where the ladder executes at all, the
  snapshot is set and readable.

  **Corrected cost model, and the one this plan is sized against:** per row, up
  to 2 ledger stats plus up to 2 × (`cat` the snapshot + a `jq` pass over a
  machine-wide registry array), short-circuiting on `||` so a claimed row costs
  fewer than four. Real per-row work that grows linearly, dominated by `jq`
  process spawns — but **not** a daemon round-trip. Do not reintroduce the
  "live daemon round-trips" phrasing anywhere.

### Live magnitude — latent, not firing

Measured this round against `intentions/` at `8c81b60a`:

- `list-recheckable-holds.ts --dir intentions` → **4 holds total, 3 of them
  `manual`-class** (`tactic-hold-conflict-autonomous-ci-pending-liveness-bound`,
  `tactic-hold-conflict-scope-fingerprint-plan-substance`,
  `tactic-hold-fix-cap-qa-fix-node-terminal-declaration`).
- `list-unclaimed-hold-alerts.ts --dir intentions --min-age-seconds 0 --top-k 40`
  → **0 rows**. With the age gate fully open and top-K at 4× the production
  default, nothing alerts today.
- Production thresholds: `DISPATCH_FLEET_WATCH_HOLD_MIN_AGE=86400`,
  `DISPATCH_FLEET_WATCH_HOLD_TOP_K=10` (`dispatch-fleet-watch:231-232`).

The unbounded growth is a real structural property with no live instance. This
sizes the work: clarification 69 (a legitimate but low-priority requirement
recorded at low rank) and clarification 26 (greenfield relevance) rule out a
large multi-surface refactor against a 3-hold population; clarification 59 makes
cheapness itself a resolve trigger for a bounded fix. The plan below is two
units, one behavioral.

### The correctness trap that decides the design

The original finding recommends capping **inside** `listUnclaimedHoldAlerts` —
i.e. **before** `dispatch-fleet-watch`'s claimed-ladder filter. That is unsafe.
The enumerator sorts by source rank; the watcher then *drops* rows that are
claimed. A library-level cap of N can be filled entirely by claimed rows and
yield **zero** findings while genuinely-unclaimed holds sit below the cut — a
**false all-clear**. That is not a cosmetic risk: predicate 5's verdict is not
just an alarm, it is a *resolve* — a `clear` verdict sends
`--resolve --kind unclaimed-hold` and **closes an already-open alarm node**
(`dispatch-fleet-watch:610-614`). The predicate's own FAIL DIRECTION block
(`dispatch-fleet-watch:598-615`) exists specifically to prevent this, and
clarification 172 rules the same way for out-of-band instruments: an unreadable
input reports UNKNOWN and still emits; it never silently suppresses.

**Do not ship the finder's recommendation verbatim.**

### Greenfield design (chosen)

**One bound, placed where the cost actually is: a per-pass probe budget in
`dispatch-fleet-watch`'s predicate-5 loop, with truncation that can never read
as `clear`.**

Building this from scratch, the bound belongs in the watcher, not the library,
for three reasons:

1. **The library's cost is not row-shaped.** `listUnclaimedHoldAlerts` does one
   whole-graph `resolveAttention(nodes)` (`hold-alerts.ts:102`) and one
   `listHoldCandidates(nodes)` pass (`hold-alerts.ts:121`). The per-row emit is
   an object push into an array. Capping rows in the library saves essentially
   nothing *in the library* — the dominant scan is unaffected. (That scan's own
   cost is the separate, out-of-scope sibling tactic; see Out of scope.)
2. **Both costs the tactic names are downstream.** Probes and alarm bytes are
   both spent in the shell watcher, per row it chooses to process.
3. **A cap in the library sits on the wrong side of the claimed filter** — the
   trap above. Making a library cap safe would require inventing a truncation
   channel across the 7-column TSV contract (an 8th column, or a trailer line
   that the watcher's `IFS=$'\t' read` would mis-parse) — more contract surface,
   more failure modes, for no measured saving.

A probe budget bounds **both** costs at once: `HOLD_COUNT` cannot exceed the
budget, so `B_HOLD` is bounded by the same constant. A second, separate body cap
would be redundant machinery; parsimony says one constant.

Truncation is handled by the fail direction the file already mandates:

| Probed all rows? | Unclaimed found? | Verdict |
| --- | --- | --- |
| yes | yes | `finding` (unchanged) |
| yes | no | `clear` (unchanged) |
| **no (budget exhausted)** | yes | `finding` |
| **no (budget exhausted)** | no | **`unknown`** — never `clear` |

The last row is the whole point: "we did not look at all of them and found none
among those we did look at" is an unread input, not an all-clear. `unknown`
raises `watch-unknown` and issues **no** `--resolve`, so a growing backlog can
never close a live alarm node.

**No brownfield migration path is needed.** The change is a single additive
threshold with a default that is far above the live population (3 holds, 0
alerting rows), so no existing behavior moves on landing and there is nothing to
sequence. That is why this plan proposes no migration section — not because
migration cost shaped the design.

### Byte-stability constraint (load-bearing — do not violate)

`B_HOLD` is deliberately **identity-only and sorted**
(`dispatch-fleet-watch:685-689`, doctrine at `dispatch-fleet-watch:64-82`, alarm
dispatch at `dispatch-fleet-watch:827-840`). Ages and resolved tier/band/score
are excluded *specifically* because they move on essentially every graph commit,
and `dispatch-fleet-alarm` commits a re-detection only when the body differs
from the one on `origin/main` — a body carrying a per-pass number would
fetch/rebase/push to main once per 5-minute pass (~288 pushes a day, each arming
four required CI checks, all during an outage).

Consequence for this plan: **the truncation marker in `B_HOLD` must carry no
count.** Render a fixed sentence naming the threshold *name and value* only
(threshold names already appear in bodies, `dispatch-fleet-watch:836-838`). The
overflow count is a reading and goes to `D_HOLD` (stdout/journald/`--json`)
only. This is a deliberate divergence from the finder's "and N more" suggestion,
which would re-introduce body churn whenever N moved.

### Out of scope

- **`packages/intentionsutil/src/hold-alerts.ts` behavior.** No `maxAlerts` field
  on `HoldAlertOpts`, no truncation in the enumerator. Unit 2 records *why* in
  the module header so the finding is not re-filed. `HoldAlertOpts` keeps exactly
  its three fields (`hold-alerts.ts:40-47`).
- **`packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts` behavior.**
  No `--limit` / `--max-rows` flag. Its 7-column contract
  (`list-unclaimed-hold-alerts.ts:27-34`) does not move.
- **`tactic-hold-alerts-unbounded-scan-cadence`** — the sibling deferred cost
  finding from the same PR #3036 review pass. It targets the *cadence* of the
  whole-graph `resolveAttention` scan (5-minute watcher pass vs. the predicate's
  own 24h threshold). Same file, same caller, **different fix**. Do not fold it
  in; do not "fix" it in passing.
- **`packages/intentionsutil/scripts/list-recheckable-holds.ts` and
  `lib-stale-hold-recheck.sh`.** Near-miss decoy: it looks like the same lane and
  is not. Its four-column TSV is read with a four-variable `read`, and
  `list-unclaimed-hold-alerts.ts:36-38` explicitly warns that appending a column
  there would land inside `cls`. Do not touch it.
- **`packages/intentionsutil/src/hold-sweep.ts` / `holds.ts`.** The candidate
  enumeration and kind/policy tables are upstream of this defect and correct.

### Landing constraint — self-modification

Unit 1 edits `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` and
its test, both under `.claude/**`. Per clarification 41, scope touching
agent-behavior config **cannot be committed by an auto-mode worker**. The PR as a
whole therefore carries that constraint regardless of Unit 2's location. Plan the
landing accordingly; this is a fact about how the work lands, not a blocker.

---

## Unit 1 — Probe budget and truncation-aware verdict in `dispatch-fleet-watch` predicate 5

**Recommended model:** opus

**Scope**

All edits in
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh`. No
other file changes in this unit.

*1. New threshold.* In the threshold block at `dispatch-fleet-watch:228-235`,
alongside `HOLD_MIN_AGE` and `HOLD_TOP_K`:

```
HOLD_MAX_PROBES="${DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES:-50}"
```

Add `"$HOLD_MAX_PROBES"` to the existing non-negative-integer validation loop at
`dispatch-fleet-watch:233-235` (`for t in ... ; do [[ "$t" =~ ^[0-9]+$ ]] || { log ...; exit 64; }; done`)
— do not write a second validator.

Document it in the header threshold block at `dispatch-fleet-watch:137-144`,
matching the style already used for `HOLD_MIN_AGE` / `HOLD_TOP_K`: a COUNT, not
seconds; the maximum number of enumerator rows whose claim ladder predicate 5
will run in one pass; a value of `0` means probe nothing, which with any row
present yields truncated-with-no-finding and therefore `unknown` (never `clear`)
— the fail-safe direction, stated explicitly.

*2. Loop state.* At the predicate-5 state initialization
(`dispatch-fleet-watch:618-621`, the `V_HOLD`/`HOLD_COUNT`/`HOLD_PAIRS`/`HOLD_READINGS`
block) add:

```
HOLD_PROBED=0
HOLD_TRUNCATED=0
HOLD_ROWS_TOTAL=0
```

*3. Total-row reading.* Immediately after the `HOLD_RC != 0` guard passes (i.e.
in the `else` arm opening at `dispatch-fleet-watch:647`, before the `while` loop
at `:655`), count the non-blank rows for the reading only:

```
HOLD_ROWS_TOTAL=$(grep -c '[^[:space:]]' <<<"$HOLD_OUT" || true)
[[ "$HOLD_ROWS_TOTAL" =~ ^[0-9]+$ ]] || HOLD_ROWS_TOTAL=0
```

`grep -c` exits 1 on no match, hence the `|| true` and the shape guard. This
value is a **reading** — it may appear in `D_HOLD`, never in `B_HOLD`.

*4. Budget check.* Inside the `while IFS=$'\t' read ...` loop
(`dispatch-fleet-watch:655-677`), **after** the existing blank/parse/path guards
(`:656-664`) and **before** the claim ladder (`:668-671`):

```
if (( HOLD_PROBED >= HOLD_MAX_PROBES )); then
  HOLD_TRUNCATED=1
  break
fi
HOLD_PROBED=$(( HOLD_PROBED + 1 ))
```

Placement matters: after the guards so a malformed row still trips
`HOLD_PARSE_OK=0` (that check outranks the budget), before the ladder so the
budget genuinely bounds the probes rather than merely the counted rows.

*5. Verdict block* (`dispatch-fleet-watch:678-693`). Preserve the existing
precedence — the `HOLD_PARSE_OK -ne 1` → `unknown` arm stays **first and
unchanged**. Then:

- `elif (( HOLD_COUNT > 0 ))` → `V_HOLD="finding"` as today. When
  `HOLD_TRUNCATED -eq 1`, append to `D_HOLD` a reading naming
  `$HOLD_PROBED` probed of `$HOLD_ROWS_TOTAL` rows, and append to `B_HOLD` the
  **countless** identity sentence, e.g.:
  `"; further enumerator rows went unprobed this pass (probe budget DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES=${HOLD_MAX_PROBES} exhausted)"`.
  Threshold name and value only — no count, per the byte-stability constraint
  above.
- **New arm** `elif (( HOLD_TRUNCATED == 1 ))` → `V_HOLD="unknown"`, with
  `D_HOLD` stating that the probe budget was exhausted before any unclaimed hold
  was seen, so "no unclaimed hold is blocking top-K work" is unproven this pass,
  and `B_HOLD` set to the same budget-exhausted identity string. This arm is the
  false-all-clear guard: it must **not** fall through to `clear`, because `clear`
  sends `--resolve --kind unclaimed-hold` and closes an open alarm node.
- `else` → `V_HOLD="clear"`, unchanged.

Follow the existing convention in this file that an `unknown` verdict still sets
`B_HOLD` (see the enumerator-failure arm at `dispatch-fleet-watch:645-646`).

*6. Rendering is otherwise untouched.* `B_HOLD`'s sorted-pair join at
`dispatch-fleet-watch:689`
(`printf '%s' "$HOLD_PAIRS" | sort | tr '\n' ';' | sed ...`) stays exactly as it
is — truncation must continue to happen on the **sorted** set so the rendered
prefix is deterministic. With the budget in place `HOLD_COUNT ≤ HOLD_MAX_PROBES`,
so the body is bounded without a second cap. Do **not** add an "and N more" tail
to `B_HOLD`.

*7. Tests* in `test-dispatch-fleet-watch.sh`. Reuse the existing predicate-5
scaffolding — the `hold_row` helper (`:512-519`), the `holdalert` stub
(`:112-117`, which prints `STUB_HOLDALERT_OUT` through `printf '%s\n'`, so a
multi-row fixture is built by embedding `$'\n'` between two `hold_row` calls; no
existing case does this yet), the `claude` stub for the registered view, and the
empty `$RESVDIR`. Claim a row by adding an agent named after the row's **source**
to `STUB_AGENTS_JSON`, exactly as Case 20 does (`:545-556`).

Harness plumbing: add
`DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES="${DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES:-50}"`
to `run_case`'s env prefix block (`:160-188`) — pin the default explicitly rather
than passing an empty value, which would fail the integer validation — and add
the variable to `reset_stubs` (`:194-198`).

Add these cases after Case 24, continuing the file's numbering:

- **Case 25 (FALSE-ALL-CLEAR GUARD — the most important case in this unit).**
  Budget 1; two rows; the **first** row's source is claimed (agent registered
  under its worktree basename), the second's is not. Assert: verdict `unknown`,
  **no** `--resolve --kind unclaimed-hold` in `$ALARMS`, no
  `--kind unclaimed-hold --statement` finding, a `watch-unknown` alarm raised,
  exit code 2. Without the truncation arm this case would report `clear` and
  resolve the alarm while a genuinely unclaimed hold sat unprobed.
- **Case 26 (truncation alongside a finding).** Budget 1; two rows; the first
  row's source is **not** claimed. Assert: verdict `finding`, exit 1, exactly one
  `--kind unclaimed-hold --statement` alarm, the emitted body names the first
  hold/source pair, does **not** name the second, and contains the
  `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES` budget-exhausted sentence. Capture the
  body via the existing `ALARM_BODY_DIR` seam used by Case 22 (`:573-611`).
- **Case 27 (BODY-STABILITY RATCHET under truncation).** Budget 1. Two passes
  over the same probed first row but a **different** second (unprobed) row, and
  with the first row's reading fields moved between passes (different age, tier,
  band, score) — mirroring Case 22's construction. Assert the two
  `unclaimed-hold.body` files are byte-identical (`cmp -s`), that the stdout
  readings genuinely differed between the passes (or the comparison is vacuous —
  Case 22 already models this assertion), and that neither body contains a
  numeric overflow count.

Do not weaken or renumber any existing case. Cases 18-24 must keep passing
unchanged under the default budget of 50 — that is the regression evidence that
the default is inert against today's population.

**Out of scope for this unit:** any edit under `packages/`; any change to
predicates 1-4; any change to `HOLD_MIN_AGE` / `HOLD_TOP_K` defaults; any change
to `dispatch-fleet-alarm`.

---

## Unit 2 — Record the deliberate non-decision in the library headers

**Recommended model:** sonnet

**Dependencies:** Unit 1 (the note describes what actually shipped).

**Scope**

Comment-only edits. No behavior, no exported signature, no test changes.

1. `packages/intentionsutil/src/hold-alerts.ts` — extend the module header
   (`hold-alerts.ts:1-21`) or the `HoldAlertOpts` doc block
   (`hold-alerts.ts:40-47`) with a short note: this enumerator deliberately has
   **no row cap**; `topK` gates sources, not rows, and that is intentional; the
   bound on downstream cost lives in the caller as
   `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES` in
   `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch`'s predicate
   5, because a cap here would sit **before** that caller's claimed-row filter
   and could return a set filled entirely by claimed rows — a false all-clear.
   Cite `tactic-hold-alerts-uncapped-alert-rows` as the node holding the
   substance (clarification 28: code comments are pointer-only,
   `TODO(tactic-<id>)`-style — but this is a settled decision, not a TODO, so
   write it as a plain explanatory reference, not a TODO marker).
2. `packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts` — one line in
   the usage/contract header (near `list-unclaimed-hold-alerts.ts:27-38`) noting
   that no `--limit` / `--max-rows` flag exists **by design**, pointing at the
   same reason and the same node id, so the COLUMN CONTRACT block is not later
   widened to carry a truncation signal.

Keep both notes short — a few lines each. Do not restate the whole rationale;
the node carries it.

**Out of scope for this unit:** any executable change in either file;
`HoldAlertOpts`'s field set; the TSV column contract.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh:150-151,275-276`
  — `DISPATCH_HOLD_RECHECK_MAX` (default 3), the sibling sweep's
  per-invocation action cap: env-var-overridable, documented in the header block,
  validated inline before use. This is the established shape for
  `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:228-235` — the
  existing threshold block and its shared `for t in ...` integer validator.
  Extend it; do not add a parallel validator.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:64-82` — the
  "TWO DETAIL STRINGS PER PREDICATE" doctrine comment: `D_<P>` is the reading
  (numbers welcome), `B_<P>` is the condition identity (nothing that moves while
  the condition merely persists). The rule the truncation marker must obey.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:598-615` — the
  FAIL DIRECTION block for this exact predicate, including why a `clear` verdict
  is dangerous (it resolves and closes an open alarm node). The new `unknown` arm
  is an application of this, not an exception to it.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:645-646` — the
  enumerator-failure `unknown` arm: the in-file precedent for setting `B_HOLD` on
  an `unknown` verdict.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:689` — the
  existing `sort | tr | sed` sorted-pair join. Truncation stays downstream of the
  sort.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh:512-519`
  — the `hold_row` TSV helper (7 columns, real tabs, `score` defaulting to 0).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh:545-556`
  (Case 20) — how a row is made "claimed": `jq -c '. + [{sessionId:…, name:"<source-id>", status:"busy", state:"running"}]'`
  onto `agents_json`.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh:573-611`
  (Case 22) — the predicate-5 body-stability ratchet: the `ALARM_BODY_DIR` seam,
  the `cmp -s` assertion, and the "the readings really did differ, or the
  comparison is vacuous" counter-assertion. Case 27 mirrors this structure.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh:112-117,144-198`
  — the `holdalert` stub, `agents_json`, `run_case`'s env prefix block, and
  `reset_stubs`.
- `packages/intentionsutil/src/digest.ts:242,251-273` and `:372,385-407` —
  `NEAR_DUP_LIMIT` / `tableNearDup`, `STORED_DEFAULTS_LIMIT` /
  `tableStoredDefaults`: the canonical in-repo "sort, `slice(0, LIMIT)`, then
  push an `... and N more` tail" idiom, with the limit as a top-of-file
  `const FOO_LIMIT`. **Consulted and deliberately not adopted here** — the "and N
  more" tail is correct for a per-run digest document but violates
  `dispatch-fleet-watch`'s `B_<P>` byte-stability contract, where a moving count
  would push to `origin/main` once per pass. Recorded so the divergence reads as
  a decision rather than an oversight.

## Verification

Both commands below are run from the worktree root. The vitest project name is
the workspace **path** `packages/intentionsutil` (from `vitest.config.ts`'s
`projects: workspaceDirs.map(...)`), and `--root .` must be the worktree root —
never `--root packages/intentionsutil`.

Measured baselines on `8c81b60a` before any edit: `hold-alerts.test.ts` 13/13
passed; `test-dispatch-fleet-watch.sh` 131 passed, 0 failed. The vitest suite
must stay at 13/13 (this plan changes no library behavior — a change there is
evidence the scope slipped). The shell suite must gain the new cases and keep
every existing one green.

```verify
npx vitest run --project packages/intentionsutil --root . packages/intentionsutil/test/hold-alerts.test.ts
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

`test-dispatch-fleet-watch.sh` is already CI-registered — `run-unit-tests.sh:190`
auto-discovers `test-*.sh` in that scripts dir — so no CI wiring is needed for
the new cases.

**Manual / judgment checks:**

1. **The default is inert against today's population.** Confirm the live
   magnitude is unchanged after the edit:
   `node --import tsx/esm packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts --dir intentions --min-age-seconds 0 --top-k 40`
   must still print nothing, and
   `node --import tsx/esm packages/intentionsutil/scripts/list-recheckable-holds.ts --dir intentions`
   must still show 4 holds / 3 manual. With 0 alerting rows the budget of 50 can
   never be reached in production today, so predicate 5's live verdict must be
   byte-identical to its pre-change verdict.
2. **Read the diff against the byte-stability contract by eye.** Confirm no
   number that moves pass-to-pass entered `B_HOLD` — specifically that the
   truncation sentence names only `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES` and its
   value, and carries no probed/unprobed/overflow count. Case 27 ratchets this
   mechanically, but the contract is a reading judgment and the case only covers
   the shapes it was written for.
3. **Confirm the fail direction by inspection of the verdict block.** Walk the
   four rows of the verdict table in Context against the final `if/elif/else`
   chain and confirm there is no path on which `HOLD_TRUNCATED=1` reaches
   `V_HOLD="clear"`. A `clear` here does not merely suppress — it emits
   `--resolve --kind unclaimed-hold` and closes an open alarm node.
4. **Landing.** Per clarification 41, this PR touches `.claude/**` and cannot be
   committed by an auto-mode worker. Confirm the landing path accounts for that
   before opening the PR.
