---
id: tactic-eval-finding-ledger-has-no-retirement-actor
kind: tactic
statement: dispatch-eval-finding --retire is invoked by nothing — the per-phase
  evaluator is explicitly forbidden from calling it, rsi-audit never mentions it
  and no office-hours step reads the ledger — so an entry stays open after its
  fix lands or its claim is falsified, and the doctrine own
  does-not-grow-faster-than-entries-retire bound stands at 19 findings recorded
  in two days against 0 retirements through the mechanism
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
    - metric: retirements_via_mechanism
      value: 0
      unit: entries
      window: ledger inception 2026-08-12 through 2026-08-13, origin/main 039bbe11
      sensor: rsi
      measured: 2026-08-13
    - metric: finding_nodes_recorded
      value: 19
      unit: nodes
      window: ledger inception 2026-08-12 through 2026-08-13, origin/main 039bbe11
      sensor: rsi
      measured: 2026-08-13
    - metric: open_entries_that_should_be_closed
      value: 2
      unit: entries
      window: origin/main 039bbe11, 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: listed_open_entries
      value: 16
      unit: entries
      window: origin/main 039bbe11, 2026-08-13
      sensor: dispatch-eval-finding
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## Nothing in the harness ever retires a ledger entry

Observed 2026-08-13 while re-evaluating the four findings recorded from the `qa`
phase of `tactic-attention-namespaced-rank`, at `origin/main` `039bbe11`.

`dispatch-eval-finding --retire` exists, is tested (case 7 in
`test-dispatch-eval-finding.sh:355`), and is invoked by nothing:

```
$ grep -rn -- '--retire' .claude packages
.claude/skills/rsi/SKILL.md:264            "Never call --retire."
.../scripts/test-dispatch-eval-finding.sh  the test itself
```

Those are the only two hits outside the script's own source. The two skills that
write to the ledger both decline the judgment:

- `rsi` (the per-phase evaluator, the only automatic writer) is forbidden:
  "Never call `--retire`. Retirement is a judgment about a landed fix, not about
  one phase's observation."
- `rsi-audit` describes minting and recurrence at length and never mentions
  retirement at all.
- No `office-hours` step reads the ledger; `office-hours/SKILL.md`'s only
  "ledger" hit is an unrelated `resolve_project_root` note at :370.

So the ledger has a write path with no close path. Every entry is open until a
human happens to look, and nothing surfaces which entries are candidates.

### What that already costs, measured

`tactic-eval-finding-ladder-gate-stale-main-checkout-halt` was fixed by
`43d13914` (#3079, "provision: fast-forward the main checkout before the
selection gate") on 2026-08-13. The entry is still `open`, `recurrence_count: 2`,
and will keep accruing rank as if unaddressed.

`tactic-eval-finding-conflict-lane-registered-phantom` is `open` while its own
statement opens with "FALSIFIED (2026-08-13, see body)" and names the two entries
that supersede it. A falsified entry has the same problem as a fixed one: the
ledger can say a finding recurred, and cannot say it stopped.

So 2 of the 16 listed entries should not be open, and no actor is permitted to
say so.

### The doctrine's own bound is unmeasurable in this state

`tactic-eval-finding-ledger`'s Done-when reads: "open ledger-entry count does not
grow faster than entries retire, across at least two evaluation windows. This is
the bound adopted from the steelman on `strategy-recursive-self-improvement`, and
it is currently a design expectation, not a measurement."

Measured now: **19** finding nodes recorded between 2026-08-12 and 2026-08-13,
**0** retired through the mechanism. (`tactic-eval-finding-lock-wait` carries
`phase: done`, but its `attributes` are `{}` — it was hand-written and shipped as
ordinary work, never a script-managed entry, so it is not a retirement of this
mechanism.) A denominator of zero means the bound is not merely unmet, it cannot
be evaluated; the ratio only ever grows.

### The narrower version of the same gap

Every `--slug` record call increments `recurrence_count` — the update path at
`dispatch-eval-finding:~762` reads the previous value and adds one
unconditionally. That is correct for an occurrence and leaves no way to correct a
body, revise a figure, or note "the fix for this landed in #NNNN" without
fabricating an occurrence of the finding. The only non-counting write the script
offers is `--retire`, which is the one thing the automatic writer may not call.
This re-evaluation hit that wall directly: it could confirm #3079 resolves an
entry and had no sanctioned way to write it down.

### What would have to change

An actor and a trigger, neither of which this record invents or applies. Some
plausible homes, for the author to choose between: a retirement sweep at
office-hours that proposes candidates from entries whose cited fix is an ancestor
of `origin/main`; a `--resolved-by <commit>` argument that records the claim
without counting an occurrence and leaves the retirement judgment separate; or a
`--note` update path that touches the body and metrics without the increment.
Until one exists, the ledger's open count is a write-only number.
