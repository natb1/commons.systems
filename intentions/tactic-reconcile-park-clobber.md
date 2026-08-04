---
id: tactic-reconcile-park-clobber
kind: tactic
statement: The terminal-tactic reconciler must never destroy a live office_hours
  park it did not author — it stays ungated on office_hours for its phase/merge
  decisions (Ruling 31) but writes office_hours only under a compare-and-swap
  against the blob it read, so a park landed concurrently by another writer
  survives the reconcile
owner: ai
status: raw
parent: null
rationale: "Bug X in the bootstrap ledger, carried for weeks as 'unfiled, quiet,
  unfixed' with no reproduction. Reproduced with hard evidence 2026-08-04: a
  main-qa pass parked tactic-terminal-disposition-sweep-park-without-cas on a
  WAIT at 17:14:51Z (commit 09027d03); 22 seconds later commit d2c53f79 'graph:
  reconcile terminal tactics (record completion)' replaced the entire
  office_hours block with `office_hours: null` and left `phase: main-qa`
  untouched — a pure park erasure with no phase advance and no recorded human
  disposition. The node was then re-selected and the same WAIT re-derived at
  full main-qa token cost, which is how the defect was found. Ruling 31
  ratified that the reconcilers stay UNGATED on office_hours — they must not
  skip a merge or a phase advance because a park is live — and this node does
  not reopen that: the defect is not that the reconciler read a park and acted
  anyway, it is that the reconciler WROTE office_hours from a stale in-memory
  node, clobbering a write that landed between its read and its write. That is
  the same lost-update shape tactic-terminal-disposition-sweep-park-without-cas
  (bug AI, PR #3042) fixed for the frozen-session sweep, so the remedy is
  already precedented: pin --base to the blob actually read and let graph-commit
  refuse on exit 3 rather than overwrite. Load-bearing because the whole
  bootstrap plan leans on parks as durable state: office-hours parks, WAIT
  parks, and the invalid-state lane's office-hours fallback are all silently
  reversible while this stands."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# The terminal-tactic reconciler must never destroy a live office_hours park it did not author

Bug X, reproduced 2026-08-04. Detect fingerprint: a commit whose subject is
`graph: reconcile terminal tactics (record completion)` (or a sibling reconcile
subject) whose diff sets `office_hours: null` on a node whose `phase` it does
**not** change, with no corresponding human disposition recorded.

Confirmed instance:

- `09027d03` (2026-08-04T17:14:51Z) — a main-qa pass parks
  `tactic-terminal-disposition-sweep-park-without-cas` on a WAIT.
- `d2c53f79` (2026-08-04T17:15:13Z, +22s) — `graph: reconcile terminal tactics
  (record completion)` removes the whole `office_hours:` block
  (28 deletions, 1 insertion), `phase: main-qa` unchanged.

Scope boundary against Ruling 31 (`tactic-graph-auto-merge-office-hours-gate`):
that ruling is about the reconciler's **read** side — it does not gate its
merge/advance decisions on `office_hours`, and done-but-parked is a valid state.
This node is about the **write** side only. Both must hold at once: the
reconciler keeps advancing parked nodes, and it stops erasing parks.

Reuse: the compare-and-swap plumbing already exists — `park-node`/`clear-park`
`--base <id>=<blobsha>`, `graph-commit`'s `--base` manifest and its exit-3
`stale-diagnosis` refusal, and the diagnosis-time CAS contract documented in
`.claude/skills/dispatch-propagate/skills/ref-diagnosis-time-cas` (see also
`packages/intentionsutil/scripts/resolve-hold`, which splits writes precisely so
a dropped list removal is caught by a post-land re-read).
