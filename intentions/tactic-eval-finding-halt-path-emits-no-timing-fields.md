---
id: tactic-eval-finding-halt-path-emits-no-timing-fields
kind: tactic
statement: dispatch-ladder-run writes the awaited event carrying elapsed_s,
  await_repolls and window_s on the clean aw_rc=0 branch only, so a phase ending
  in throw, stalled or unknown-graph-read emits launched and halt and nothing
  else — and halt() is exactly the path that spawns the per-phase evaluator,
  handing it the one phase whose numeric inputs were never recorded
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: phases_launched
      value: 1
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: awaited_events_written
      value: 0
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: evals_spawned_for_phases_with_no_timing_fields
      value: 1
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: phase_elapsed_s_recoverable_only_from_timestamps
      value: 964
      unit: seconds
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl launched-to-halt delta
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: events.jsonl
      measured: 2026-08-14
---

# A phase that halts emits no timing fields, so the evaluator the halt spawns is measured blind

## Context

`dispatch-ladder-run` is the detached ladder driver. It records everything an
evaluator later reads into an append-only `events.jsonl` beside the node's
ladder state directory. Three numeric fields — `elapsed_s`, `await_repolls`,
`window_s` — are the evaluation's inputs for the calibration-and-waiting lens,
and `.claude/skills/dispatch-ladder/SKILL.md:286-288` states of them: "These are
the evaluation's inputs, and nothing else records them."

**The defect.** Those three fields are written on exactly one branch of the
await result switch — `aw_rc == 0`, the clean `awaited` branch
(`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1394-1397`).
Every halting branch below it returns straight to `halt()` with no event of its
own:

```
11) halt 11 throw   "$AW_OUT" ;;
12) halt 12 stalled "$AW_OUT — the worker stopped with no graph change; …" ;;
14) halt 14 unknown-graph-read "$AW_OUT" ;;
```

(`dispatch-ladder-run:1461-1465`, plus the sibling post-launch halts at
`:1454` — held past `HELD_GRACE_S` — and `:1494` — requeue budget drained — and
the exit-21 deadline halt reached through `check_deadline` at `:735-738`.)

So a run whose phase ends in `throw`, `stalled` or `unknown-graph-read`
produces an `events.jsonl` containing `launched` and `halt` and nothing else.
The observed file for the 2026-08-14 `tactic-align-review-skill` ladder is
exactly that — four lines, `start` / `launched` / `halt` / `eval`, with no
`elapsed_s`, no `window_s` and no `await_repolls` anywhere in it.

**Why that is load-bearing rather than cosmetic.** `halt()` deliberately spawns
the per-phase evaluation the run still owes
(`spawn_phase_eval "$EVAL_LAUNCH_PHASE" "$EVAL_LAUNCH_EPOCH"`,
`dispatch-ladder-run:730`), and the skill's own argument for that call is that
"the most defect-rich runs are exactly the ones that halt, and a halted run that
recorded nothing was the defect the two-tier review closed." The two halves are
inconsistent: the halt path now spawns the evaluator, and the halt path is also
the one path that writes the evaluator's numeric inputs nowhere. The evaluator
spawned for a halted phase is handed precisely the phase whose figures were
never written — and the fire-and-forget spawn means nothing notices.

An evaluator can still reconstruct elapsed seconds by subtracting the `launched`
timestamp from the `halt` timestamp, but that is the "regex it out of prose"
reconstruction the structured fields were introduced to end (`log_event`'s own
header, `dispatch-ladder-run:548-558`), it is at whole-second ISO granularity
rather than the epoch arithmetic `elapsed_s` uses, and `await_repolls` and
`window_s` are not recoverable from the file at all.

**Scope of the defect — version-independent.** The branch is identical in
`de347430~1`, the revision the observed ladder actually ran, and at HEAD;
`de347430` added the terminus classification and did not touch the await switch.
Re-verified at HEAD `dcf1baa6` (2026-08-18): the defect still holds exactly as
described.

**Not the same finding as `fix-phase-emits-no-outcome-record`.** That one is a
phase skill omitting a `dispatch-emit-outcome` call, fixed in `fix-checks`.
This is the driver's halt path skipping its own timing emission, fixed in
`dispatch-ladder-run`. Different site, different mechanism, disjoint fix.

**Intended outcome.** Every halt that interrupts an in-flight phase carries
`elapsed_s`, `await_repolls` and `window_s` as numeric fields on its own `halt`
record; a halt with no phase in flight carries none of them (omitted, never
zeroed); and no phase ever gets two differently-measured `elapsed_s` values in
the same ledger. `/rsi` lens 6 then has a mechanical carrier on the halt path,
which is what condition 7's 2026-08-14 amendment requires of every lens.

## Greenfield design

`halt()` is the single terminal path — by its own design comment, "ONE call
covers them all" — and it already builds a structured fifth-argument fields
object for `log_event` (`{terminus: …}`, built inline at
`dispatch-ladder-run:724-726`). The fields object is the mechanism; it just
needs to be bigger. So the fix lives entirely inside `halt()`: zero edits at the
~15 halt call sites, and `timing_fields()` (`:572-593`) is reused verbatim
rather than a second field-builder being invented.

Two guards decide whether the timing keys appear at all:

1. **A phase actually launched.** `LAUNCH_EPOCH` is stamped only at `:1349`.
   A halt before any launch (a `usage`/`refused` halt, the unmapped-`*`
   internal case, a first-advance `idle`) must not claim `elapsed_s: 0` — that
   reads as "measured, and it was instant", a different claim from "not
   measured". This is `timing_fields()`' own omit-don't-zero doctrine, stated
   in its header for `reap_lag_s` and applied here to all three keys. **All
   three are omitted together**: `window_s` alone is a configured constant, not
   a measurement, and emitting it beside an absent `elapsed_s` invites a ratio
   against nothing.

2. **The phase has not already recorded its own figures.** After the clean
   `awaited` branch fires at `:1395-1397`, the phase's figures are in the
   ledger. A later terminus halt (`halt 0 complete` at `:1509`, `halt 0 pruned`
   at `:1420`, `halt 10 idle` at `:1530`, `halt 12 stalled` at `:1494`) would
   otherwise attach a *second*, differently-measured `elapsed_s` to the same
   `phase` — the exact ambiguity that makes a ledger unreadable. So the halt
   record carries timing only for a phase that was **in flight** when the run
   halted.

Both guards are expressed the way the file already expresses this kind of
state: an empty-string global initialized at the top level, mirroring
`EVAL_LAUNCH_PHASE` / `EVAL_LAUNCH_EPOCH` at `:626-627`. That matters because
the script runs `set -uo pipefail` (`:353`) and `LAUNCH_EPOCH` / `REPOLLS` are
currently **assigned only inside the launch branch** — a bare reference from
`halt()` on a pre-launch call site would abort with an unbound-variable error.

No brownfield migration path is needed: `events.jsonl` is append-only and
`log_event` merges the fields object into the record, so older lines keep
parsing and every existing consumer keeps working. The change is purely
additive at the field level.

## Units of work

### Unit 1 — `halt()` carries the phase's timing fields when a phase was in flight

**Scope.** `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` only.

1. At the top-level state block beside `PHASE=""`
   (`dispatch-ladder-run:505-510`), add three initializations so `halt()` may
   reference them plainly under `set -u`:
   - `LAUNCH_EPOCH=""` — empty until the first phase launches. Note in a
     comment that this is the same idiom as `EVAL_LAUNCH_EPOCH` (`:627`) and
     that its emptiness is what makes a pre-launch `usage`/`refused` halt omit
     timing entirely.
   - `REPOLLS=0`
   - `AWAITED_LOGGED=0` — 1 once the current phase's `awaited` event has been
     written, so a terminus halt does not re-report a figure the ledger already
     carries.
2. In the launch branch, alongside `REPOLLS=0` and `HELD_S=0`
   (`dispatch-ladder-run:1369-1370`), reset `AWAITED_LOGGED=0`. `LAUNCH_EPOCH`
   keeps its existing assignment at `:1349` — do **not** move it, and do not
   change what it is stamped from (the comment at `:1350-1365` explains at
   length why `EVAL_LAUNCH_EPOCH` is seeded from `PASS_SINCE` and
   `LAUNCH_EPOCH` is not; leave that intact).
3. Immediately after the `awaited` `log_event` call at
   `dispatch-ladder-run:1395-1397` (before the `spawn_phase_eval` at `:1418`,
   so the `halt 0 pruned` at `:1420` sees it), set `AWAITED_LOGGED=1`.
4. In `halt()` (`dispatch-ladder-run:708-733`), replace the terminus-only
   fields build at `:724-726` with a build that merges timing into it:
   - when `[[ -n "$LAUNCH_EPOCH" && "$AWAITED_LOGGED" == 0 ]]`, compute
     `ELAPSED_S=$(( $(now_epoch) - LAUNCH_EPOCH ))` and take
     `timing=$(timing_fields "$ELAPSED_S" "$REPOLLS" "$TIMEOUT_S")` — the
     fourth argument (`reap_lag_s`) is deliberately left off: a halt is never
     an early-sighting reap;
   - otherwise `timing='{}'`;
   - merge with `jq -nc --argjson t "$timing" --arg terminus "$TERMINUS"
     '$t + {terminus: $terminus}'`, keeping the existing
     `|| fields="{\"terminus\":\"unknown\"}"` fallback so nothing `jq` does can
     prevent the halt record from being written. `TIMEOUT_S` is set
     unconditionally at `:372` (overridable via `--timeout-s` at `:391`), so it
     needs no guard.
5. Leave `DETAIL` untouched. Unlike the `awaited` event, which spells its
   figures in `detail` as well, a halt's `detail` is a causal message an
   operator reads (and two existing tests match substrings of it —
   `test-dispatch-ladder-run.sh:1015-1023`, `:728-733`). State this asymmetry
   in a short comment at the new build so the next reader does not "fix" it.
6. Keep the ordering in `halt()` exactly as it is: `classify_terminus` →
   `write_state` → build fields → `log_event halt` → `spawn_phase_eval` →
   stderr line → `exit`. The new computation is pure arithmetic plus one `jq`
   and must not move `write_state` or the spawn.

**Out of scope.** No call-site edits. No change to `timing_fields()`,
`log_event()`, `spawn_phase_eval()`, or `write_state`/`state.json`'s shape. No
change to any exit code, disposition string, or the stderr line at `:731-732`.

**Recommended model.** opus.

### Unit 2 — the `held-sweep` event carries the same structured fields

**Scope.** `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1447-1449`
only — the exit-21 `held-observing` arm.

Today that event builds only a text `detail`
(`"held_s=${HELD_S}s of ${HELD_GRACE_S}s elapsed_s=$(( $(now_epoch) - LAUNCH_EPOCH ))"`)
and passes no fields argument, so the grace-wait seconds it measures exist only
as prose. `/rsi` lens 6 owes "`ci-wait` / `grace-wait` seconds burned" as a
named mechanical carrier, and this is the only place `grace-wait` on the held
path is recorded at all.

1. Hoist the inline arithmetic into `ELAPSED_S=$(( $(now_epoch) - LAUNCH_EPOCH ))`
   on its own line above the `log_event` call, and reference `$ELAPSED_S` in
   the existing `detail` string — the detail text stays byte-identical in shape.
2. Pass a fifth argument merging the standard timing object with the two
   held-specific figures:
   `"$(jq -nc --argjson t "$(timing_fields "$ELAPSED_S" "$REPOLLS" "$TIMEOUT_S")" --argjson held "$HELD_S" --argjson grace "$HELD_GRACE_S" '$t + {held_s: $held, held_grace_s: $grace}')"`.
   Both are integers by construction (`HELD_S` at `:1370`/`:1447`,
   `HELD_GRACE_S` at `:381`), so `--argjson` is safe, matching
   `timing_fields()`' own justification for `--argjson`.

This arm is unconditionally post-launch (it is inside the await loop), so no
guard is needed here.

**Out of scope.** The `HELD_GRACE_S` budget check and the `halt 11 throw` at
`:1450-1454` — that halt is already covered by Unit 1's `halt()` change and
needs no edit of its own. Do not add fields to `idle` / `absorb` / `launched`
events; they are a separate question.

**Recommended model.** sonnet.

**Dependencies.** Unit 1 (shares the `ELAPSED_S`/`timing_fields` idiom and must
not conflict with its edits in the same file).

### Unit 3 — tests pinning both halves of the contract

**Scope.** `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`
only. The suite is sequence-driven fakes — no daemon, no gh, no git, no network
(header at `:1-36`); `run_ladder` invokes the driver with
`--poll-s 1 --timeout-s 3 --ci-wait-s 5` (`:278-281`), which is why existing
assertions expect `window_s == 3`. Follow the existing `TOTAL`/`PASS`/`FAIL`
bookkeeping shape exactly; reuse `events_have` (`:283-290`), `reset_seqs`,
`set_seq`, `calls`. Do **not** pipe a captured variable through `echo` into
`jq` — `.claude/rules/shell-json.md` is mechanically linted on added `.sh`
lines; use `jq -e … "$STATE_DIR/events.jsonl"` directly, as every existing
assertion here does.

Add four assertions:

1. **A halting await writes timing on the halt record.** Extend the existing
   table-driven block "every halting exit code owes it — one halt() edit, not
   five call sites" (`test-dispatch-ladder-run.sh:1108-1119`, which already
   iterates `11|throw …` and `14|throw … unknown-graph-read`) — add
   `12|stalled tactic-fixture-node qa` to its pair list if absent, and inside
   the loop assert
   `jq -e 'select(.event == "halt") | (.elapsed_s | type == "number") and (.await_repolls | type == "number") and (.window_s == 3)'`.
   Model it on the closest precedent, the `reap_lag_s` test at `:385-402`.
2. **A pre-launch halt omits the keys entirely, never zeroes them.** New block:
   `reset_seqs; set_seq advance '2|refused tactic-fixture-node strategy'; run_ladder`
   → assert exit 2 and
   `jq -e 'select(.event == "halt") | (has("elapsed_s") | not) and (has("window_s") | not) and (has("await_repolls") | not)'`.
   Precedent for the omitted-not-zeroed shape is at `:405-421`.
3. **A terminus halt does not re-report a phase already recorded.** In the
   clean-complete case that already asserts the `awaited` event carries
   `elapsed_s` (`:361-368`), add: the `halt` event for the same run omits
   `elapsed_s` (`has("elapsed_s") | not`), and the `awaited` event still carries
   it. This is the assertion that pins the no-double-record rule; without it a
   later simplification to "emit whenever `LAUNCH_EPOCH` is set" passes.
4. **The `held-sweep` event carries `held_s`, `held_grace_s` and the timing
   trio** (Unit 2). Add it to the existing held-grace case near
   `test-dispatch-ladder-run.sh:1015-1023` — assert
   `jq -e 'select(.event == "held-sweep") | (.held_s | type == "number") and (.held_grace_s | type == "number") and (.window_s == 3)'`.

Also confirm the existing "events.jsonl is valid JSON lines" assertion
(`:370-376`) still passes — a malformed merged fields object would surface
there first.

**Out of scope.** No new test file. No change to the fixture tree, the fakes,
or `dispatch-test-fixture.sh`. Do not weaken or delete any existing assertion
(`.claude/rules/test-integrity.md`) — if one goes red, the driver change is
wrong, not the test.

**Recommended model.** sonnet.

**Dependencies.** Units 1 and 2.

### Unit 4 — the two docs that describe the field's coverage

**Scope.** Two files, prose only.

1. `.claude/skills/rsi/SKILL.md`:
   - **Step 1, `:69-73`** — the sentence "the phase events (`awaited`,
     `await-repoll`) also carry `elapsed_s`, `await_repolls` and `window_s` as
     **numeric fields**" must gain `halt` (and `held-sweep`) to the
     enumeration, and must state the condition: the halt record carries them
     **only when a phase was in flight** — a halt before any launch, or a
     terminus halt whose phase already recorded its own `awaited` event, omits
     them, and in the latter case the figures are on that `awaited` line.
   - **Step 1 dispositions table, the `stalled` / `throw` → `halt` row
     (`:83`)** — today it promises only "the halt line's `detail` says why".
     Add that the line also carries the numeric timing fields when the phase
     was in flight.
   - **Step 5, lens 6 "Calibration and waiting" (`:193-197`)** — it currently
     routes around the gap, asking for "`elapsed_s` against the configured
     `window_s`, plus … and, on a halt, the halt-to-engagement latency." Rewrite
     so the halt case reads the same `elapsed_s`/`window_s` fields off the
     `halt` record rather than substituting latency for them; keep
     halt-to-engagement latency as an *additional* figure, and keep the lens's
     existing obligation to return a concrete recommended default for
     `--timeout-s` / `--poll-s` / `--ci-wait-s` rather than an observation.
     Name `held_s` / `held_grace_s` on the `held-sweep` event as the carrier for
     grace-wait seconds burned.
2. `.claude/skills/dispatch-ladder/SKILL.md:286-288` — the paragraph claiming
   `events.jsonl` carries the three figures "on the phase events". It is not
   false today only because it never enumerates which events; make the claim
   accurate rather than accidentally so by naming the events that carry them
   and the in-flight condition on the halt record.

**Out of scope.** No change to `/rsi`'s bounds section (`:44-60`), its Step 6
write-surface instructions (`:203-254`), or any other lens. Do not touch the
`dispatch-ladder` SKILL's halt-disposition table or exit-code vocabulary. Do not
edit any intention node.

**Recommended model.** sonnet.

**Dependencies.** Unit 1 (the docs must not describe behavior before it exists).

## Reuse

- `timing_fields()` —
  `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:572-593`. Already
  builds `{elapsed_s, await_repolls, window_s[, reap_lag_s]}` from positional
  args, and its header states the omit-don't-zero doctrine this plan extends to
  all three keys. Call it; do not write a second field-builder.
- `log_event()` — same file, `:548-570`. Its optional fifth argument is a JSON
  object merged into the record via `+ $fields` at `:569`. This is the exact
  plumbing timing fields already travel through; no new plumbing is needed.
- `halt()` — same file, `:708-733`. The single terminal path; already builds a
  fifth-argument fields object at `:724-726`. One edit here covers all ~15 halt
  call sites (`:738`, `:816`, `:1082-1083`, `:1115`, `:1119`, `:1133-1134`,
  `:1138`, `:1166-1167`, `:1200-1201`, `:1420`, `:1454`, `:1461-1465`, `:1494`,
  `:1509`, `:1530`, `:1539-1542`).
- The `awaited` branch's compute-and-pass pattern — same file, `:1394-1397`.
  Copy its `ELAPSED_S=$(( $(now_epoch) - LAUNCH_EPOCH ))` idiom verbatim.
- The empty-string-global idiom — `EVAL_LAUNCH_PHASE` / `EVAL_LAUNCH_EPOCH` /
  `EVAL_SPAWNED_KEY` at `:626-628`, with the design note at `:600-625`
  explaining why emptiness is the "nothing launched yet" signal. Unit 1's
  `LAUNCH_EPOCH=""` mirrors it.
- `events_have()` — `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:283-290`.
  Reuse for any count assertion rather than a new grep/jq snippet.
- The numeric-field assertion precedent — same test file, `:385-402`
  (`reap_lag_s` present as a number *and* in detail) and `:405-421`
  (`has("key") | not` when unmeasured). Unit 3's assertions follow these shapes.
- The existing halting-exit-code tables — same file, `:909-918` (await
  passthrough over 11/12/14) and `:1108-1119` (halt-eval over 11/14). Extend
  one of these rather than writing a fresh fixture; the fakes and `set_seq`
  lines for all three dispositions already exist there.

## Verification

The driver's whole test suite is faked end to end and is what CI runs for this
file (`.github/workflows/unit-tests.yml:309`), so the suite is the end-to-end
check:

```verify
bash -n .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The suite must report zero failures, and the count of PASS lines must be
strictly greater than before the change (Unit 3 adds assertions; a rename that
silently drops one would otherwise be invisible). Every pre-existing assertion
must still pass unchanged — in particular "complete: the awaited event carries
`elapsed_s`" (`:361-368`), "eval: the awaited event carries structured numeric
timing fields" (`:1034-1044`), "halt() spawns the evaluation a mid-run halt
still owes" (`:1092-1107`), and "complete: events.jsonl is valid JSON lines"
(`:370-376`).

`run-lint.sh` is included because it runs `lint-prose-rules.sh`, which
mechanically enforces `.claude/rules/shell-json.md` on net-new added lines in
committed `.sh` files — the new `jq` assertions in Unit 3 are exactly the shape
that rule polices.

**Manual / judgment checks (not auto-runnable):**

- Read one halted run's `events.jsonl` after this lands and confirm the `halt`
  line parses with `elapsed_s`, `await_repolls` and `window_s` present, and that
  `elapsed_s` is within a second or two of `halt.ts - launched.ts`. Any real
  halted ladder will do; the first one to occur naturally is enough, and no run
  should be forced for this.
- Confirm the beneficiary: read `/rsi` lens 6's output for a halted phase and
  check it now reports a measured `elapsed_s` against `window_s` instead of
  falling back to halt-to-engagement latency alone. This is the concrete
  consumer the fix exists for.
- Judgment call left to the implementer: whether the `halt` record's `detail`
  should also spell the figures the way `awaited`'s does. This plan says **no**
  (halt `detail` is a causal operator message, and two existing tests match
  substrings of it). If review disagrees, appending is safe — the existing
  assertions are substring matches, not equality — but it must be a deliberate
  decision recorded in a comment, not a drift.

## Measured impact (frontmatter `attributes.measured_impact` carries the summary)

`phases_launched` 1; `awaited_events_written` 0;
`evals_spawned_for_phases_with_no_timing_fields` 1;
`phase_elapsed_s_recoverable_only_from_timestamps` 964; `recurrence_count` 1
(all-time). Window: `tactic-align-review-skill` ladder 2026-08-14, sensor
`events.jsonl`.

This node is a merged ledger entry: a recurrence updates
`attributes.measured_impact` and mints nothing.

