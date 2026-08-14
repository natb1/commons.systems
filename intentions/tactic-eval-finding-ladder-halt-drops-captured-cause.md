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
status: raw
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
phase: null
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
# Observed on `tactic-attention-per-tier-boost-migration`, `align-tactics` phase, halt at 2026-08-14T16:54:30Z

`dispatch-ladder-run` captures the advance step's stderr into a scratch file
specifically so the halt reason is not lost — then drops it on the one path
where it is load-bearing.

## The code

`dispatch-ladder-run:1325-1339` — capture, read the last line, replay, delete:

```sh
ADV_ERR_FILE=$(mktemp "$STATE_DIR/.adv-stderr.XXXXXX") || …
ADV_OUT=$("$ADVANCE" "$NODE_ID" 2>"$ADV_ERR_FILE"); adv_rc=$?
ADV_OUT=$(head -n1 <<<"$ADV_OUT")
ADV_ERR_LAST=$(tail -n1 "$ADV_ERR_FILE" 2>/dev/null)
cat "$ADV_ERR_FILE" >&2
rm -f "$ADV_ERR_FILE"
```

`ADV_ERR_LAST` is then referenced **exactly once**, at line 1502, on the
*requeue* event:

```sh
"requeue_budget=$requeue_budget${ADV_ERR_LAST:+; ${ADV_ERR_LAST:0:200}}"
```

The halt branch, line 1539, ignores it:

```sh
11) halt 11 throw "$ADV_OUT" ;;
```

`$ADV_OUT` is `head -n1` of *stdout*, which for this arm
(`dispatch-ladder-advance:454`) is the fixed string
`throw <node-id> execute-failed`. So a terminal halt records a constant, while
the variable holding its cause is in scope one line away.

## What that cost this evaluation

`events.jsonl`'s final line — the run's terminus, the record the closing
cross-phase synthesis reads — is:

```json
{"ts":"2026-08-14T16:54:30Z","event":"halt","phase":"align-tactics",
 "disposition":"throw","detail":"throw tactic-attention-per-tier-boost-migration execute-failed",
 "terminus":"violation"}
```

Nothing in it distinguishes a dirty main checkout from a spawn failure, a
refused park, or a broken script. The real cause —

```
provision-node-worktree: 'git merge --ff-only origin/main' failed in
/home/n8/natb1/commons.systems (the tree is dirty or diverged)
 M intentions/tactic-invalid-state-rc-0b9860b2.md
dispatch-ladder-advance: dispatch-graph-execute exited 1 with
  'failed tactic-attention-per-tier-boost-migration park-failed'
```

— existed only in journald, and was **not** retrievable by the `/rsi` procedure
as written. Two obstacles, both worth naming:

1. **`/rsi` never tells the evaluator to read journald.** Step 1 reads
   `events.jsonl`; Step 3 offers `dispatch-session-digest` for a *session*
   transcript. The driver's own stderr appears in neither.
2. **`journalctl --user -u dispatch-ladder-<node>` does not return these
   lines.** They are emitted by a child PID (1883545) and are reachable only by
   an unfiltered `journalctl --user --since … | grep`. The unit-scoped query an
   operator would naturally run returns the halt with no cause — I ran it first
   and got nothing.

The scratch file is no fallback either: `.adv-stderr.XXXXXX` is `rm -f`'d at
line 1339, and it was already gone between listing the ladder directory and
`cat`-ing it, seconds apart.

## What would have to change

Append `ADV_ERR_LAST` to the halt's `detail` exactly as the requeue event
already does (`${ADV_ERR_LAST:0:200}`), on the `11)`, `13)`, `2)` and `*)` arms
at `dispatch-ladder-run:1539-1542`. The value is already captured, already
truncated for safety elsewhere, and already deemed safe to log. This is the
cheapest fix in the ledger and it is what makes every future halt evaluable at
all — `halt()` is precisely the path that spawns the per-phase evaluator.

Sibling: `tactic-eval-finding-halt-path-emits-no-timing-fields` covers the
*numeric* fields the halt path never emits. This entry is about the `detail`
string dropping a cause the driver already holds; the two would likely be fixed
in the same few lines.
