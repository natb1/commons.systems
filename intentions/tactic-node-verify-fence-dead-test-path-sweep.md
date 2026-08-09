---
id: tactic-node-verify-fence-dead-test-path-sweep
kind: tactic
statement: "21 non-`done` intention nodes still name the deleted
  `test-dispatch-scripts.sh` in their bodies — 11 of them inside a live
  ` ```verify ` fence — so `dispatch-run-verification` exits 1 with `No such
  file or directory` at each node's own gate, and every phase lane that treats a
  verify failure as ambiguous parks the node rather than judging it; repoint the
  dead path to its successor across all non-`done` nodes in one sweep"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-09 at the office-hours sitting that ratified
  tactic-hold-conflict-manual-path-reservation-sweep. That hold is the FIRST
  CASUALTY of this class, not a one-off, and the class is GROWING rather than
  draining: the park recorded 19 non-`done` nodes carrying the dead path on
  2026-08-03; a re-count at the sitting measured 21. ROOT CAUSE:
  tactic-dispatch-test-monolith-split (now `phase: done`) split the
  `test-dispatch-scripts.sh` monolith and deleted it, but its Unit 3 scoped
  `intentions/*.md` bodies out of the rename as `historical records`. That is
  true for `done` nodes, whose bodies are an archive, and WRONG for non-`done`
  nodes, whose ` ```verify ` fences are executable contracts that a phase lane
  will actually run. MECHANISM: Lane 3 and the other verify-running lanes treat
  ANY non-zero exit from `dispatch-run-verification` as ambiguous with no
  exception, so a dead path in the fence is indistinguishable from a real defect
  in resolved code; the lane reverts its work and parks for a human. Each of the
  21 will hit this at its own gate. MEASURED 2026-08-09 against `origin/main`:
  `test-dispatch-scripts.sh` is absent (`git ls-tree` returns nothing);
  `test-dispatch-select-tick.sh` is present and owns the `sel_tick` fixtures the
  monolith used to hold. Affected nodes span every live phase — 4 at
  `implement`, 4 at `main-qa`, 4 at `qa`, and 9 at `phase: null`. FIX
  DIRECTION: a single mechanical sweep repointing the dead path in every
  non-`done` node, plus whatever guard keeps a future file deletion from
  stranding executable fences again — a deletion that removes a path named
  inside a live verify fence should fail loudly at deletion time, not silently
  at each downstream node's gate. Do NOT rewrite `done` nodes: their bodies are
  the historical record the original scoping decision correctly protected. NOTE
  the one-hop-stale sibling reference the sitting also found: `sel_tick_setup`
  now lives in `test-dispatch-select-tick.sh`, and the `rl_setup`
  dead-session-sweep reference test moved to `test-lib-reservation-ledger.sh` —
  a sweep should catch prose references to both, not only the fenced ones."
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
  rationale: "Band 1 of the bootstrap three-band interim scale (50/20/10),
    author-directed at the 2026-08-09 office-hours sitting ('file it and boost
    it') so this sweep outranks the individual casualties it prevents. Band 1 is
    warranted on blast radius rather than severity-per-node: 21 live nodes each
    carry a latent park, 11 of them in executable fences, and every one of those
    parks costs a full human office-hours sitting to clear — the same cost this
    single node discharges once. It is also strictly upstream of those nodes'
    own progress, so leaving it at baseline would let the casualties it prevents
    outrank their own remedy."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# The deleted test monolith is still named in 21 live node bodies

## What happened

`tactic-dispatch-test-monolith-split` deleted
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` and
distributed its cases into per-subject files. Its Unit 3 deliberately scoped
`intentions/*.md` out of the rename, reasoning that node bodies are historical
records.

That reasoning holds for `done` nodes. It does not hold for nodes still in
flight, because a node body's ` ```verify ` fence is not a record — it is the
contract `dispatch-run-verification` executes when the node reaches a gate.

## Why it parks instead of failing usefully

The verify-running lanes make no distinction between "this command failed
because the code is broken" and "this command failed because the path does not
exist." Lane 3's contract in particular treats any non-zero verify exit as
ambiguous, reverts its merge resolution, and parks the node for a human. So the
failure mode is not a red test — it is a silently reverted piece of correct work
plus a human sitting.

`tactic-hold-conflict-manual-path-reservation-sweep` is the first node to pay
this cost. Its Lane-3 pass had resolved the conflict cleanly, with the ported
suite at 189/189, and threw the resolution away because the fence named a
deleted file.

## The population, measured 2026-08-09 against `origin/main`

21 non-`done` nodes name the dead path; 11 of those name it inside a live
`verify` fence.

| phase | count |
|---|---|
| `implement` | 4 |
| `qa` | 4 |
| `main-qa` | 4 |
| `null` | 9 |

The successor file is
`.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh`, which
is present on `origin/main` and owns the `sel_tick` fixtures.

## Scope intent

Repoint the dead path across every non-`done` node. Leave `done` nodes alone.
Also consider the guard question: a file deletion that orphans a path named in a
live verify fence should fail at deletion time rather than at each downstream
node's gate — that is what turned a one-line rename omission into 21 latent
parks.
