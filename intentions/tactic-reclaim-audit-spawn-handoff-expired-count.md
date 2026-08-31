---
id: tactic-reclaim-audit-spawn-handoff-expired-count
kind: tactic
statement: dispatch-reclaim-audit's RATE section counts reclaim events by
  grepping two hardcoded reason literals -- (dead-session-stranded) and
  (live-worker-redundant) -- so it silently counts nothing for the other two
  reservation_sweep reclaim reasons, spawn-handoff-expired and the
  <origin>-ttl-expired family; replace the hardcoded counters with
  reason-generic bucketing over the ledger's own message shape, plus an explicit
  unparsed bucket, so a rising never-registered-worker rate, a mistuned handoff
  TTL, or any future reclaim reason is reported instead of absent
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: agent-a67cb7cd9bfa78d2b
  pr: 3154
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-31T02:04:45Z
    mergeCommitSha: f8a337cf70ad00d114fb373ebc17c7ff722076a6
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
## Completion record — shipped 2026-08-31

Units 1 and 2 landed as PR #3154, merge `f8a337cf`, an ancestor of
`origin/main`.

**Unit 1** — reason-generic bucketing, not a third literal.
`dispatch-reclaim-audit`'s RATE source now parses the reason token out of each
line matching the existing reason-agnostic `ALL_RECLAIM_RE` and buckets it
as-is, so a reason the ledger adds later is counted without a code change here.
That was the point: the audit was blind to **two** reason families, not one
(`spawn-handoff-expired after <N>s with no live worker` and
`<origin>-ttl-expired after <N>s with no live worker`), both because their
trailing clause sits inside the same parentheses the old closing-paren anchors
matched on. A line whose reason will not parse is counted in the total and
reported as `reclaim_events_reason_unparsed` rather than dropped into no
bucket.

The JSON contract is additive only — `dead_session_stranded_events`,
`live_worker_redundant_events` and `dead_session_stranded_distinct_worktrees`
keep their names, positions and meanings and are now derived from the bucket
table. Exit codes are untouched, CAUSE still apportions `dead-session-stranded`
only, and `lib-reservation-ledger.sh` did not change.

**Unit 2** — the regression coverage in `test-reclaim-audit.sh`, including case
E asserting the new reasons do not leak into the pre-existing buckets.

## Context

`dispatch-reclaim-audit` is the operator instrument that measures the reservation
ledger's reclaim rate — how often `reservation_sweep` takes a worktree's
reservation marker back, and why. Its RATE section is the ground-truth half of
the report (the CAUSE half apportions the rate across transcript evidence).

The RATE section counts reclaim events by grepping **exactly two hardcoded
reason literals**. The reservation ledger emits **four** reason shapes, one of
which is itself parameterized. So the RATE report is blind to two of the four,
and the blindness is silent: an unrecognized reason contributes to no counter
and raises no flag, so a rising never-registered-worker rate — or a handoff TTL
tuned below the host's real worker-registration latency (90s observed
2026-07-30) — shows up nowhere in the report.

That TTL is `DISPATCH_RESERVATION_HANDOFF_TTL_S` (default 300s), read by
`lib-reservation-ledger.sh`'s `reservation_sweep`. It is the knob an operator
would reach for once the new counter makes the never-registered-worker rate
visible; nothing in this plan changes it, and it is named here only so the
report's consumer knows what the number is telling them to tune.

### Provenance

- **Origin**: `/review-fix` code-review finder (`residue-6`), review pass on
  PR #2995 (`tactic-router-spawn-window-duplicate-worker`, the PR that added the
  `spawn-handoff-expired` reclaim reason).
- **Adversarial verdict**: `Deferred` by the residue phase — a real, in-contract
  observation, but not opus-fixable inside that PR's scope. Nothing regressed;
  the signal was simply never wired up.
- **Corroboration that this is live, not hypothetical**:
  `tactic-reclaim-audit-journal-unit-filter` (phase done) counted
  1 `spawn-handoff-expired` among the 14 events it recovered visibility into,
  and `tactic-fleet-alarm-node-park-clobber-loop` quotes two
  `spawn-handoff-expired` reclaims on a single real node within 15 minutes on
  2026-08-04 (11:16:49 and 11:31:48).

### The full reason taxonomy (ground truth, verified on origin/main 04095404)

`.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh`
(724 lines) emits, inside `reservation_sweep`'s dispatch chain:

| ledger line | reason token emitted | RATE-counted today? |
|---|---|---|
| `:662` rule (a) | `live-worker-redundant` | yes |
| `:692` rule (a-handoff) | `spawn-handoff-expired after <N>s with no live worker` | **NO** |
| `:710` rule (c-ttl) | `<origin>-ttl-expired after <N>s with no live worker`, `<origin>` ∈ `standalone` \| `explicit` \| `office-hours` | **NO** |
| `:715` rule (c) | `dead-session-stranded` | yes |

The ledger's own header block at `lib-reservation-ledger.sh:172-231` documents
this four-rule taxonomy and its rule names — reuse that wording rather than
re-deriving it.

There is also a **non-reclaim** ledger line at `:670`,
`keeping malformed reservation %s (no session= line)`, and a follow-up note at
`:716`, `(stranded reclaim of %s — ...)`. Neither is a reclaim event; neither
may be counted as one.

So the filed finding's premise was **incomplete**: two reasons are uncounted,
not one, and the second is variable-cardinality (three origins today, more if a
new claim origin is added).

### The design call this plan makes

The finding as filed recommends one more hardcoded counter for
`spawn-handoff-expired`. Per `.claude/rules/design-proposals.md` the plan leads
with the greenfield design instead: **count reclaim events by parsing the reason
token out of the line, bucketing whatever reasons the log actually contains.**
Rationale:

1. It closes both blind spots, not one, and closes the third one nobody has
   written yet — a future claim origin lands in the report for free.
2. It removes a recurring maintenance obligation this exact instrument has
   already been bitten by twice (the `-u`/`-t` filter bug fixed by
   `tactic-reclaim-audit-journal-unit-filter`, and this one), which bears
   directly on the serving strategy's maintenance-burden-band condition.
3. The script **already contains** the reason-agnostic machinery and the
   admission of the gap. `dispatch-reclaim-audit:200-206` defines:

   ```
   # The ALL-REASONS reclaim pattern. The cross-check must compare the FULL reclaim
   # population, not the two reason-specific patterns this audit buckets: the ledger
   # also emits spawn-handoff-expired and <origin>-ttl-expired reclaims, so a
   # reason-specific comparison against an unfiltered journal probe would false-fire
   # forever.
   ALL_RECLAIM_RE='lib-reservation-ledger: reclaimed reservation '
   ```

   The cross-check was deliberately made reason-agnostic; only the RATE buckets
   were left behind. `ALL_RECLAIM_RE` is the natural denominator for a reason
   breakdown and the strongest reuse anchor in the file.
4. It applies the remediation pattern the sibling fix on this same instrument
   established: a silent fail-open-to-zero becomes an explicit, reported state.
   Today an unrecognized reason is silently excluded; after this change every
   reclaim line is either bucketed by reason or counted in an explicit
   `reason_unparsed` figure that the report prints.

**No brownfield migration path is needed**, and this is a deliberate finding
rather than an omission: the change is single-PR and backwards-compatible. The
three existing JSON keys (`sweep.dead_session_stranded_events`,
`sweep.live_worker_redundant_events`,
`sweep.dead_session_stranded_distinct_worktrees`) are retained and derived from
the new table, so the JSON document only gains keys. `dispatch-reclaim-audit` is
an on-demand operator instrument invoked by no other script in the repo
(grepped; `lib-frozen-session-park.sh:130` merely mentions it in a comment), so
there is no caller to migrate.

### Explicitly out of scope

- **The per-worktree session index and the CAUSE analysis.** `DEAD_EVENTS_FILE`
  (`dispatch-reclaim-audit:293-309`), its downstream consumer loop at `:453`,
  the `BUCKET` cause table at `:396-402`, and the population split all stay
  keyed to `dead-session-stranded` only. A handoff expiry or a TTL expiry has no
  transcript to index — by construction the worker never registered — so it must
  stay a scalar count and must not join the dead-session interval analysis.
- **The ledger itself.** No change to `lib-reservation-ledger.sh`. The message
  shapes are the contract this audit reads; they stay as they are.
- **CI wiring.** `run-unit-tests.sh:190` globs `"$SCRIPTS"/test-*.sh` and runs
  every match (skipping only `test-helpers.sh`), so `test-reclaim-audit.sh` is
  already auto-discovered. No workflow or manifest edit.

## Unit 1 — Reason-generic reclaim-event bucketing in `dispatch-reclaim-audit`

**Recommended model**: `opus`

**File**: `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit`
(597 lines on origin/main 04095404; `set -euo pipefail` at `:139`). Locate the
edit sites by the symbol names below, not by trusting these line numbers if the
file has moved under you.

### Scope

**1a. Replace the two hardcoded counters with a derived reason table.**

Current code at `:287-291`, verbatim:

```
# Event counts for the RATE (count every matching line).
DEAD_EVENTS=$(grep -cE 'lib-reservation-ledger: reclaimed reservation .+ \(dead-session-stranded\)' "$SWEEP_RAW" || true)
REDUNDANT_EVENTS=$(grep -cE 'lib-reservation-ledger: reclaimed reservation .+ \(live-worker-redundant\)' "$SWEEP_RAW" || true)
DEAD_EVENTS=${DEAD_EVENTS:-0}
REDUNDANT_EVENTS=${REDUNDANT_EVENTS:-0}
```

Replace with a table built from `ALL_RECLAIM_RE` (`:206`) plus a reason-token
parse. Shape (verified against real line samples during planning — the sed
expression below was run against all four reclaim shapes plus both non-reclaim
shapes and produced exactly the three reason tokens, excluding the
`keeping malformed reservation` line and the `(stranded reclaim of ...)` note):

```
declare -A REASON_EVENTS=()
RECLAIM_TOTAL=$(grep -cE "$ALL_RECLAIM_RE" "$SWEEP_RAW" || true)
RECLAIM_TOTAL=${RECLAIM_TOTAL:-0}
REASON_UNPARSED=0
while IFS= read -r line; do
  reason=$(printf '%s\n' "$line" \
    | sed -n 's/.*reclaimed reservation [^ ]* (\([a-z][a-z0-9-]*\).*/\1/p')
  if [[ -z "$reason" ]]; then
    REASON_UNPARSED=$(( REASON_UNPARSED + 1 ))
    continue
  fi
  REASON_EVENTS[$reason]=$(( ${REASON_EVENTS[$reason]:-0} + 1 ))
done < <(grep -E "$ALL_RECLAIM_RE" "$SWEEP_RAW" || true)

# Retained named counters, now DERIVED from the table (JSON contract unchanged).
DEAD_EVENTS=${REASON_EVENTS[dead-session-stranded]:-0}
REDUNDANT_EVENTS=${REASON_EVENTS[live-worker-redundant]:-0}
```

Constraints on this block:

- **Pattern shape trap (confirmed).** The two existing patterns anchor on `\)`
  immediately after the reason literal. `spawn-handoff-expired` and
  `<origin>-ttl-expired` carry a trailing ` after <N>s with no live worker`
  clause **inside** the same parentheses, so any `\(<reason>\)` anchor matches
  nothing. The parse above captures the token only and lets `.*` absorb the
  trailing clause — do not reintroduce a closing-paren anchor.
- **The malformed-marker line must not be counted.** `ALL_RECLAIM_RE` matches
  `reclaimed reservation ` and so already excludes both `keeping malformed
  reservation` (`lib-reservation-ledger.sh:670`) and the `(stranded reclaim of
  ...)` follow-up note (`:716`). Do not broaden `ALL_RECLAIM_RE`.
- **`REASON_UNPARSED` is the fail-open closer**, not a defensive fallback: a
  reclaim line whose reason token will not parse is reported, never silently
  dropped. `RECLAIM_TOTAL` must equal the sum of `REASON_EVENTS` values plus
  `REASON_UNPARSED` by construction.
- **`set -u` and empty arrays.** Every read of `REASON_EVENTS[...]` uses the
  `:-0` default. Any iteration over `"${!REASON_EVENTS[@]}"` must be guarded by
  `if (( ${#REASON_EVENTS[@]} > 0 )); then ... fi` so an empty table cannot trip
  `set -u` on older bash.
- **Do not perturb `EXIT_CODE`.** It is decided at `:280-285` from
  `SWEEP_STATUS` / `SWEEP_CROSSCHECK`, **before** the counters. A new counter
  must not feed it: `REASON_UNPARSED > 0` is reported in the text and JSON but
  does **not** change the exit code (the exit contract stays 0 ok / 3 untrusted,
  and case-D in the test suite pins that an established-nothing state is not
  exit 3 either).

**1b. Leave `DEAD_EVENTS_FILE` and everything downstream of it alone.**
`:293-309` (the `<ts>\t<wt>` index loop, `DEAD_BASENAMES`, `DEAD_DISTINCT`)
continues to grep the `dead-session-stranded` literal specifically. Out of scope
per the Context section.

**1c. JSON emit** (`jq -n` at `:466-517`). Additive only:

- Build the by-reason object from the table, e.g. write `<reason>\t<count>` to a
  temp file under the existing `$TMP` and convert with
  `jq -R -s 'split("\n") | map(select(length>0) | split("\t") | {key: .[0], value: (.[1]|tonumber)}) | from_entries'`
  (an empty file yields `{}`). Pass it in as `--argjson reclaim_events_by_reason`.
- New keys under `sweep`, alongside the existing three:
  - `reclaim_events_total` — every line matching `ALL_RECLAIM_RE`.
  - `reclaim_events_by_reason` — object, keys are the reason tokens actually
    present in the window. A reason absent from the window is absent from the
    object; the key set is data, not schema. (Absence is unambiguous because
    `reclaim_events_total` and the two retained scalars are always present.)
  - `reclaim_events_reason_unparsed` — integer, 0 in the healthy case.
- `dead_session_stranded_events`, `live_worker_redundant_events` and
  `dead_session_stranded_distinct_worktrees` keep their names, positions and
  meanings.
- Follow the existing `--argjson`/`--arg` threading style at `:472` — do not
  interpolate values into the jq program text.

**1d. Human-readable RATE block** (`:549-554`). Replace the two fixed
`printf '  dead-session-stranded reclaims (events) ..... %d\n'` lines with a
ranked table over `REASON_EVENTS`, reusing the existing ranked-print idiom from
the CAUSE section (`:565-573`: `printf '%d\t%s\n'` pairs piped through
`sort -rn -k1,1` into the `print_rank` helper defined at `:520-523`). Around it:

- a `reclaim events (all reasons) ....... %d` total line;
- the ranked per-reason lines;
- the existing `dead-session-stranded distinct worktrees` line, unchanged;
- when `REASON_EVENTS` is empty, print `(no reclaim events in window)` rather
  than an empty table;
- when `REASON_UNPARSED > 0`, an explicit
  `NOTE: %d reclaim line(s) had an unrecognized reason token — counted in the
  total, bucketed nowhere. The ledger's message shape has changed; update the
  reason parse.` line;
- keep the existing trailing note `(RATE and CAUSE are both counted in reclaim
  EVENTS ...)` and amend it to say that CAUSE apportions the
  `dead-session-stranded` events only.

**1e. Header doc block** (`:28-34`). The block reads `The exact lines are:`
followed by only the two counted shapes. Extend it to all four reclaim shapes
(citing `lib-reservation-ledger.sh:662`, `:692`, `:710`, `:715` and the rule
names `(a)`, `(a-handoff)`, `(c-ttl)`, `(c)` from that file's header at
`:172-231`), and state that the RATE table is derived from the reason token
rather than enumerated, so a new ledger reason appears in the report without a
code change. Also note there that CAUSE remains `dead-session-stranded`-only and
why.

### Out of scope for this unit

Everything under "Explicitly out of scope" above, plus the test file (Unit 2).
Existing behavior that must be preserved verbatim: the fixture-file path, the
journalctl path, the cross-check probe and its four sentinel states, and the
exit-code contract.

## Unit 2 — Regression coverage in `test-reclaim-audit.sh`

**Recommended model**: `sonnet`

**Dependencies**: Unit 1.

**File**: `.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh`
(388 lines; self-contained, run with `bash <path>`; `set -euo pipefail`).

### Scope

**2a. Extend the existing fixture-path assertion block** (`:148-182`), which
runs against the shared sweep log built in `setup()` at `:80-92` (4
`dead-session-stranded` + 2 `live-worker-redundant`, all stamped
`T="2026-06-01T12:00:00+00:00"` from `:65`). Add, using the existing `assert_eq`
helper (`:38-49`) and the here-string jq idiom already used throughout
(`jq '...' <<<"$OUT"`):

- `.sweep.reclaim_events_total` == `6`
- `.sweep.reclaim_events_by_reason["dead-session-stranded"]` == `4`
- `.sweep.reclaim_events_by_reason["live-worker-redundant"]` == `2`
- `.sweep.reclaim_events_reason_unparsed` == `0`
- the **stays-0-when-absent** assertion the finding asked for:
  `.sweep.reclaim_events_by_reason["spawn-handoff-expired"] // 0` == `0`

**Do not mutate the shared fixture** at `:80-92`. Every existing assertion in
`:148-182` — the two event counts, the distinct-worktree count, every
`cause_buckets` and `populations` value, and the three sweep sentinels — must
stay unchanged and keep passing.

**2b. Add a new case E: reasons with a trailing in-paren clause.** Build a
**separate** sweep-log file under `$ROOT` (do not touch `$SWEEP_LOG`), point
`DISPATCH_RECLAIM_SWEEP_LOG` at it for the duration of the case, and restore
`export DISPATCH_RECLAIM_SWEEP_LOG="$SWEEP_LOG"` afterward. Place the case after
case D (`:355-380`) and before `report_results` (`:386`), and make sure
`DISPATCH_RECLAIM_JOURNALCTL_CMD` is unset so the fixture path is taken (the
file already unsets it at `:384` — do the unset before the case instead, or set
it explicitly).

Fixture lines, same shape as `:84-89`
(`<ISO-ts> host dispatch-tick[pid]: lib-reservation-ledger: reclaimed reservation <wt> (<reason>)`),
all stamped `$T`:

- `2007-ggg (spawn-handoff-expired after 300s with no live worker)`
- `2008-hhh (spawn-handoff-expired after 300s with no live worker)`
- `2009-iii (standalone-ttl-expired after 600s with no live worker)`
- `2010-jjj (explicit-ttl-expired after 600s with no live worker)`
- `2011-kkk (office-hours-ttl-expired after 600s with no live worker)`
- `2012-lll (dead-session-stranded)`
- **plus two lines that must NOT be counted**:
  `lib-reservation-ledger: keeping malformed reservation 2013-mmm (no session= line)`
  and the follow-up note
  `lib-reservation-ledger:   (stranded reclaim of 2012-lll — if retained, inspect tmp/dispatch-launch-2012-lll.log for the launcher last output)`

Assertions:

- `.sweep.reclaim_events_total` == `6` (**not 8** — this is the assertion that
  pins the two non-reclaim lines out)
- `.sweep.reclaim_events_by_reason["spawn-handoff-expired"]` == `2`
- `.sweep.reclaim_events_by_reason["standalone-ttl-expired"]` == `1`
- `.sweep.reclaim_events_by_reason["explicit-ttl-expired"]` == `1`
- `.sweep.reclaim_events_by_reason["office-hours-ttl-expired"]` == `1`
- `.sweep.reclaim_events_by_reason["dead-session-stranded"]` == `1`
- `.sweep.dead_session_stranded_events` == `1` (the retained key still derives
  correctly)
- `.sweep.live_worker_redundant_events` == `0`
- `.sweep.reclaim_events_reason_unparsed` == `0`
- `.sweep.dead_session_stranded_distinct_worktrees` == `1`
- **the out-of-scope guard**: the new-reason lines must not leak into the CAUSE
  analysis. `2012-lll` has no project dir under
  `DISPATCH_RECLAIM_PROJECTS_ROOT`, so assert
  `.cause_buckets["genuine-strand"]` == `1` and the sum of all five
  `cause_buckets` values == `1`. Do not assume this — it is exactly the
  interaction the shared-fixture warning in 2a is about.
- `.sweep.status` == `"ok"`, `.sweep.crosscheck` == `"skipped"`, exit code `0`.

**2c. Add a case F: unparsed reason token.** Same separate-file technique, one
line whose reason token does not match the parse, e.g.
`... reclaimed reservation 2014-nnn (Weird_Reason)`. Assert
`.sweep.reclaim_events_reason_unparsed` == `1`,
`.sweep.reclaim_events_total` == `1`, `.sweep.reclaim_events_by_reason` == `{}`,
and — the point of the case — that the **exit code is still 0**: an unparsed
reason is reported, not graded untrusted.

### Traps this unit must respect

- **Do not add lines to `RECLAIM_FIXTURE_LINES` (`:202-209`) or
  `reclaim_lines()` (`:213-221`).** That array feeds *both* the identifier probe
  and the unfiltered cross-check probe in the journalctl-path cases, so a line
  added there changes `crosscheck_journal_lines` and `crosscheck_filtered_lines`
  on both sides and will flip case A's `crosscheck: "ok"` assertion (`:279`) and
  its exit-code assertion (`:281`). The new reasons need no journalctl-path
  coverage: the counting code is downstream of `$SWEEP_RAW` and is
  path-independent, which cases A–D already exercise.
- **`.claude/rules/shell-json.md` is mechanically enforced** on net-new added
  lines in committed `.sh` files by
  `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` (run from
  `run-lint.sh` in CI). Never write `echo "$OUT" | jq` — use the here-string form
  `jq '...' <<<"$OUT"` that every existing assertion already uses.
- **Reuse `assert_eq` and `report_results` (`:38-57`)**; add no new assertion
  helper. Reuse the existing `teardown` trap (`:127-134`) for cleanup — new
  fixture files live under `$ROOT` so they are removed with it.
- The suite ends `exit $FAIL` (`:387`); keep that.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:206` —
  `ALL_RECLAIM_RE`, the existing all-reasons reclaim pattern, already documented
  at `:200-205` as deliberately reason-agnostic *because* the ledger emits
  `spawn-handoff-expired` and `<origin>-ttl-expired`. Base the new per-reason
  parse on this constant; do not introduce a second all-reasons pattern.
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:520-523,565-573` —
  `print_rank` and the `printf '%d\t%s\n' | sort -rn -k1,1 | while read` ranked-
  print idiom, reused verbatim for the per-reason RATE table.
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:466-517` —
  the `jq -n --argjson` document builder; thread new counters through the same
  way.
- `.claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit:293-309` —
  the `grep | while read | sed`-capture idiom, the shape the new counting loop
  follows (including `|| true` on the grep inside process substitution, required
  under `set -e`).
- `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit:324-329,463-468` —
  the sibling audit's `declare -A BUCKET=(...)` / `BUCKET[$k]=$(( ... + 1 ))`
  counting idiom. Note `BUCKET` is **already taken** in `dispatch-reclaim-audit`
  (`:396-402`, the cause table); name the new array differently
  (`REASON_EVENTS`).
- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:172-231` —
  the authoritative four-rule reclaim taxonomy and its rule names
  `(a)` / `(a-handoff)` / `(c-ttl)` / `(c)`. Reuse this wording in the audit's
  header rather than re-deriving it.
- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:662,692,710,715` —
  the four `printf` sites; the message shapes the parse must handle.
- `.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh:38-57,69-73,75-125,127-134` —
  `assert_eq`, `report_results`, `emit_assistant`, `setup`, `teardown`.

## Verification

The audit is an on-demand operator instrument with no in-repo caller, so the
unit suite is the primary gate.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh
```

Manual / observe-in-production checks:

- Run the audit against the live host journal and confirm the new reasons now
  appear:
  `bash .claude/skills/dispatch-propagate/scripts/dispatch-reclaim-audit --days 14 --json | jq '.sweep'`.
  Expect `reclaim_events_total` to equal the sum of `reclaim_events_by_reason`'s
  values plus `reclaim_events_reason_unparsed`, and expect
  `dead_session_stranded_events` / `live_worker_redundant_events` to match
  `reclaim_events_by_reason`'s corresponding entries. On a host where the ledger
  has recently reclaimed a spawn handoff, `spawn-handoff-expired` should be
  non-zero — the exact signal this tactic exists to surface. If the journal is
  unavailable (sandboxed / no systemd) this check reports
  `status: "unavailable"` and exit 3; that is the expected degraded result, not
  a failure of this change, and the fixture-path suite above covers the logic
  regardless.
- Read the human-readable report (`--days 14`, no `--json`) and confirm the RATE
  section reads as a ranked reason table with a total, that the
  distinct-worktree line is still present, and that the CAUSE section still
  describes itself as apportioning `dead-session-stranded` events only.
- Judgment call left to review, not to implementation: whether
  `reclaim_events_reason_unparsed > 0` should eventually escalate to exit 3. This
  plan deliberately keeps it report-only, because a message-shape change in the
  ledger is a maintenance signal rather than evidence that the counts undercount
  the reclaim population — `reclaim_events_total` is still correct in that case.
