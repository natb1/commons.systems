---
id: tactic-eval-finding-ladder-halt-drops-captured-cause
kind: tactic
statement: dispatch-ladder-run captures the advance step stderr into
  ADV_ERR_LAST and folds it into the requeue event only, so the exit-11 halt
  branch records the fixed string throw <node> execute-failed with the cause it
  already holds one line away discarded — and the real cause survives nowhere
  the /rsi procedure reads, since events.jsonl omits it, the scratch file is
  rm-fed immediately, and a unit-scoped journalctl query does not return the
  child-PID lines that carry it
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
    - metric: halt_events_carrying_a_cause
      value: 0
      unit: events
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: unit_scoped_journalctl_lines_naming_the_cause
      value: 0
      unit: lines
      window: journalctl --user -u
        dispatch-ladder-tactic-attention-per-tier-boost-migration
        2026-08-14T16:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Finding: the advance halt records a constant and drops the cause it holds

## Context

### What was observed

Node `tactic-attention-per-tier-boost-migration`, `align-tactics` phase, halt at
`2026-08-14T16:54:30Z`. The run's terminus record in `events.jsonl` — the line
the closing cross-phase synthesis reads — was:

```json
{"ts":"2026-08-14T16:54:30Z","event":"halt","phase":"align-tactics",
 "disposition":"throw","detail":"throw tactic-attention-per-tier-boost-migration execute-failed",
 "terminus":"violation"}
```

Nothing in it distinguishes a dirty main checkout from a spawn failure, a
refused park, or a broken script. The real cause was:

```
provision-node-worktree: 'git merge --ff-only origin/main' failed in
/home/n8/natb1/commons.systems (the tree is dirty or diverged)
 M intentions/tactic-invalid-state-rc-0b9860b2.md
dispatch-ladder-advance: dispatch-graph-execute exited 1 with
  'failed tactic-attention-per-tier-boost-migration park-failed'
```

### Root cause (verified against the working tree, 2026-08-18 — the code is unchanged)

`dispatch-ladder-run` captures the advance step's stderr into a scratch file
*specifically so the reason is not lost* — then drops it on the one path where
it is load-bearing.

`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1325-1338` — capture,
read the last line, replay to the driver's own stderr, delete:

```sh
ADV_ERR_FILE=$(mktemp "$STATE_DIR/.adv-stderr.XXXXXX") || {
  echo "dispatch-ladder-run: mktemp failed in $STATE_DIR" >&2; exit 1; }
ADV_OUT=$("$ADVANCE" "$NODE_ID" 2>"$ADV_ERR_FILE"); adv_rc=$?
ADV_OUT=$(head -n1 <<<"$ADV_OUT")
ADV_ERR_LAST=$(tail -n1 "$ADV_ERR_FILE" 2>/dev/null)
cat "$ADV_ERR_FILE" >&2
rm -f "$ADV_ERR_FILE"
```

`ADV_ERR_LAST` is a plain global (not `local`), assigned unconditionally on
every loop pass, so it is live and *fresh* everywhere below. It is referenced
**exactly once**, at `dispatch-ladder-run:1501-1502`, on the *requeue* event:

```sh
log_event idle "$PHASE" "$REASON" \
  "requeue_budget=$requeue_budget${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}"
```

The four halt arms of the same `case "$adv_rc"` block, at
`dispatch-ladder-run:1539-1542`, ignore it:

```sh
11) halt 11 throw "$ADV_OUT" ;;
13) halt 13 claimed "$ADV_OUT — a node is never worked by dispatch and dispatch-ladder at once" ;;
2)  halt 2 refused "$ADV_OUT" ;;
*)  halt 1 internal "dispatch-ladder-advance exited an unmapped $adv_rc with '$ADV_OUT'" ;;
```

`$ADV_OUT` is `head -n1` of *stdout*, which for the exit-11 arm
(`dispatch-ladder-advance:448-455`) is the fixed string
`throw <node-id> execute-failed`. So a terminal halt records a constant while
the variable holding its cause sits in scope ten lines away.

### Why the cause survived nowhere the evaluator reads

Three independent sinks, all closed:

1. **`events.jsonl` omits it** — the defect above.
2. **The scratch file is gone.** `.adv-stderr.XXXXXX` is `rm -f`'d at
   `dispatch-ladder-run:1338`; in the observed episode it had already vanished
   between listing the ladder directory and `cat`-ing it, seconds apart.
3. **journald is not reachable by the query an operator runs.** The lines are
   emitted by a child PID (1883545 in the observed case) and are returned only
   by an unfiltered `journalctl --user --since … | grep`. The natural
   unit-scoped query `journalctl --user -u dispatch-ladder-<node>` returns the
   halt with no cause. Separately, `/rsi` never instructs the evaluator to read
   journald at all: `.claude/skills/rsi/SKILL.md:63-84` Step 1 reads
   `events.jsonl`, and Step 3 offers `dispatch-session-digest` for a *session*
   transcript — the driver's own stderr appears in neither.

### Intended outcome

Every halt off the advance step records, in `events.jsonl`, the cause the
driver already captured — so a halted run is evaluable from the ledger alone,
with no journald trawl. `halt()` is precisely the path that spawns the
per-phase evaluator (`dispatch-ladder-run:730` calls `spawn_phase_eval`), so
this is the record the evaluator is handed for the most defect-rich runs.

### Design: fold into `detail`, not into `fields` — and this is the greenfield answer, not the cheap one

`log_event` (`dispatch-ladder-run:558-570`) takes `detail` as its 4th
positional argument and an optional 5th `fields` JSON object. Its own header
reserves `fields` for the figures an evaluator *ranks on* — `elapsed_s`,
`window_s`, `await_repolls` — so they are read as numbers rather than regexed
out of prose. A captured stderr tail is free text with no schema and no
ranking use; promoting it to a typed field would put unstructured prose in the
one place that exists to be structured. Building from scratch, the captured
cause belongs in `detail` — which is exactly where the requeue path at
`:1502` already puts the same variable, and exactly how both downstream
consumers read a halt: `.claude/skills/rsi/SKILL.md:77-84` ("the halt line's
`detail` says why", read as prose) and the closing cross-phase synthesis at
`.claude/skills/dispatch-ladder/SKILL.md:393-397` (attributes a halt's cause
from `disposition` + `detail`). No consumer regexes `detail` — SKILL.md:69-70's
"never a regex over `detail`" warning is about the *numeric* fields, a
different concern.

**No brownfield migration path is needed.** The change is a pure suffix append
to one string in an append-only JSONL file: old lines stay parseable, no
consumer's contract changes, no reader needs updating, and the value is already
truncated to 200 chars by the established idiom and already deemed safe to log
(it is replayed verbatim to the driver's stderr at `:1337` today).

### Deliberately out of scope

- **Numeric halt fields.** The sibling node
  `tactic-eval-finding-halt-path-emits-no-timing-fields` covers the
  `elapsed_s` / `await_repolls` / `window_s` fields the halt path never emits.
  That is the `fields` argument; this is the `detail` string. Do not implement
  it here — but they touch the same few lines, so if that sibling is already in
  flight, coordinate rather than conflict.
- **The await step.** `dispatch-ladder-run:1380` calls `"$AWAIT"` with **no**
  stderr redirection at all, so no `AW_ERR_LAST` exists to fold into the
  exit-21 grace halt (`:1454`) or exit-11 halt (`:1461`). Covering await needs a
  *new* capture mirroring `:1325-1329`, not a reuse — a larger, differently
  shaped change.
- **The other `halt 11 throw` sites** (`:1083, 1115, 1119, 1134, 1138, 1167,
  1201`). None of their `out=$(cmd)` calls (`:1079, 1130, 1163, 1197`) redirect
  stderr to a scratch file either, and each already explicitly tells the reader
  to consult the journal. The `ADV_ERR_FILE` treatment is specific to the
  advance call; the fix's honest scope is that one `case`.
- **`check_deadline`** (`:736-739`) runs no subprocess; its detail is a
  synthetic string built from `$MAX_RUN_S`. Nothing to fold.
- **Any `SKILL.md` edit.** `.claude/skills/rsi/SKILL.md` is not touched. Adding
  a journald step there is a separate judgment call, and committing a
  `SKILL.md` is denied to an autonomous worker by the auto-mode
  self-modification guard (only `SKILL.md` and `.claude/hooks/**` are blocked;
  `.claude/skills/**/scripts/` — where this whole change lives — commits fine).
  This unit must therefore **not** be parked as a protected-path change.

---

## Unit 1 — Fold the captured advance stderr into all four advance-halt details, with a regression test

### Scope

**Changes — `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1539-1542`.**
Append the existing `ADV_ERR_LAST` to the `detail` argument of each of the four
halt calls, using the truncation idiom already established at
`dispatch-ladder-run:1502` verbatim: `${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}`.
The `${VAR:+…}` guard is load-bearing — it omits the whole clause (including the
`; ` separator) when the variable is empty, so a halt with no captured stderr
reads exactly as it does today. There is no dedicated truncate/sanitize helper
anywhere in `dispatch-ladder-run` or its siblings; this inline idiom **is** the
convention, not a stub for one.

**The fold always goes at the END of the detail string**, after any existing
trailing prose, so the four arms become:

```sh
11) halt 11 throw "$ADV_OUT${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}" ;;
13) halt 13 claimed "$ADV_OUT — a node is never worked by dispatch and dispatch-ladder at once${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}" ;;
2)  halt 2 refused "$ADV_OUT${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}" ;;
*)  halt 1 internal "dispatch-ladder-advance exited an unmapped $adv_rc with '$ADV_OUT'${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}" ;;
```

Add a short comment above the `case` arms explaining *why* the fold is there —
mirror the tone and content of the existing comment at
`dispatch-ladder-run:1498-1501` ("advance's own stderr diagnosis, when it wrote
one, folded into the detail so it lands in `events.jsonl` instead of being
visible only via a journalctl trawl … truncated so one pathological line cannot
bloat the event log"), stating additionally that `halt()` is the path that
spawns the per-phase evaluator, so this is the one record it gets.

**No other edit to `dispatch-ladder-run`.** Do not touch the capture block at
`:1325-1338` (it already does the right thing, including the deliberate
`cat "$ADV_ERR_FILE" >&2` replay at `:1337` *before* the `rm -f` at `:1338` —
the journal keeps the full text either way, so the fold adds a sink rather than
moving one). Do not touch `log_event` (`:558-570`), `halt()` (`:708-733`), or
`dispatch-ladder-advance` (the producer at `:448-455` is correct as written —
the defect is entirely in the consumer).

**Adds a test — `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`.**
Insert a new block immediately **before** the final `make_seq_fake
"$LADDER/dispatch-ladder-advance" advance` restore line and `report_results` at
the end of the file (currently the last ~4 lines). Model it directly on the
existing block at `test-dispatch-ladder-run.sh:1554-1588` ("advance's stderr
diagnosis reaching events.jsonl"), which is the same shape for the *requeue*
path:

- `reset_seqs` first.
- `make_seq_fake` only ever writes stdout (`:124-140`), so it **cannot** be
  used here. Write a bespoke one-off stub over `"$LADDER/dispatch-ladder-advance"`
  — exactly as `:1565-1571` does — that writes `throw tactic-fixture-node
  execute-failed` to stdout, a recognizable diagnostic line to stderr (e.g.
  `dispatch-ladder-advance: dispatch-graph-execute exited 1 with 'failed
  tactic-fixture-node park-failed'`), and exits 11.
- `run_ladder --max-run-s 600`, then `assert_eq` that `$RC` is `11`. Note
  `run_ladder` (`:278-288`) discards the driver's own stderr with `2>/dev/null`
  — assert on `events.jsonl`, never on `$OUT`/stderr.
- Assert via the established pattern (used at `:728`, `:902`, `:1575`) that the
  halt event's detail carries the cause:
  `jq -r 'select(.event == "halt") | .detail' "$STATE_DIR/events.jsonl" | grep -q 'park-failed'`
  — with the `TOTAL`/`PASS`/`FAIL` counter shape those blocks use, including the
  diagnostic `echo` on failure.
- Assert the **existing** text is still present too (`grep -q 'execute-failed'`),
  so the fold is proven additive rather than a replacement.
- Add a second case in the same block proving the empty-stderr guard: a stub
  that exits 11 with the same stdout and writes **nothing** to stderr, then
  assert the halt detail equals `throw tactic-fixture-node execute-failed`
  exactly (no trailing `; `). Use `assert_eq` for this one — an exact-equality
  assertion is what pins the `${VAR:+…}` guard.
- **Restore the sequence-driven fake** with `make_seq_fake
  "$LADDER/dispatch-ladder-advance" advance` when the block is done, exactly as
  `:1588` does — unconditionally, even though nothing follows today.

Do **not** modify `make_seq_fake` to grow a stderr field: only two call sites
would ever use it, and the file's own precedent (the hand-written lock fake at
`:167-183`) is to write a bespoke stub when the call shape differs.

**Out of scope for this unit:** every item in "Deliberately out of scope"
above; `test-dispatch-ladder-advance.sh` (its coverage at `:239-247` checks
advance's own stdout/exit mapping and is unaffected — leave it alone).

### Recommended model

`sonnet`

---

## Reuse

- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1329` —
  `ADV_ERR_LAST`, the already-captured last stderr line. A plain global,
  reassigned unconditionally every loop pass, live in the `case` block at
  `:1539-1542`. **No new capture code is needed**; the unit only wires an
  existing variable into branches that ignore it.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1502` —
  `${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}`, the truncation-and-guard idiom.
  Copy it verbatim; it is the only such idiom in the script family.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:1498-1501` — the
  explanatory comment to mirror in tone and content for the new one.
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:558-570` —
  `log_event`. `detail` (4th positional) is passed through `jq --arg` as an
  opaque string, so appending arbitrary prose is safe and needs no escaping.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:1554-1588`
  — the directly reusable test template (bespoke stderr-writing stub → run →
  `jq` assertion on the event's `.detail` → restore the fake).
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:167-183` —
  the hand-written lock fake, precedent for a bespoke stub over `make_seq_fake`.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:188-195,
  254, 278-288` — `set_seq`, `reset_seqs`, `run_ladder` helpers.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:728, 902` —
  the `jq -r 'select(.event == "halt") | .detail'` halt-detail assertion pattern.
- `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh:1105-1135`
  — existing coverage of these exact four arms (`2` refused, `13` claimed, `11`
  throw straight off the first advance). The new test must not break it; those
  cases assert exit codes and `spawnjob` call counts, not detail text.

---

## Verification

Baseline measured on this worktree at plan time: `291/291 passed, 0 failed`.
After the change the suite must be green with a **strictly larger** total — the
new assertions add to it; a total that does not grow means the new block never
ran.

```verify
bash -n .claude/skills/dispatch-ladder/scripts/dispatch-ladder-run
```

```verify
bash -n .claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
```

This suite is the same one CI runs (`.github/workflows/unit-tests.yml:309`), so
a local pass is the CI signal. It takes several minutes; run it to completion
rather than timing it out.

### Manual / judgment checks

- **Read the four rewritten arms side by side with `:1502`.** The idiom must be
  character-identical, and the fold must be the *last* thing in each detail
  string — after the `13)` arm's trailing "a node is never worked by dispatch
  and dispatch-ladder at once" clause, not spliced before it.
- **Confirm the change is scripts-only.** `git diff --name-only` must list
  exactly the two files under `.claude/skills/dispatch-ladder/scripts/`. Any
  `SKILL.md` in the diff means the scope slipped and the commit will be denied
  by the auto-mode self-modification guard.
- **Observe in production.** The next real ladder halt off the advance step
  (exit 10/11/12/13/21 are all spawn-the-evaluator paths; this fix covers the
  advance-sourced 11/13/2/1) should show a `halt` line in
  `<main-root>/.claude/worktrees/<node-id>.ladder/events.jsonl` whose `detail`
  names an actual cause rather than the bare `throw <node> execute-failed`. The
  observed failure mode to look for is a dirty-main `provision-node-worktree`
  refusal — previously indistinguishable from a spawn failure, a refused park,
  or a broken script.
- **Judgment: 200 chars is inherited, not re-derived.** If a real halt's cause
  is visibly truncated mid-sentence, that is a signal to revisit the shared
  constant at both `:1502` and the new sites together — not to widen one site.
