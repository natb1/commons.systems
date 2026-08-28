---
id: tactic-fleet-alarm-node-park-clobber-loop
kind: tactic
statement: tactic-fleet-alarm-* nodes are wrongly selectable for /align-tactics,
  and any park landed on one is silently wiped by the next mechanical re-mint
owner: ai
status: raw
parent: null
rationale: Discovered 2026-08-04 during an /align-tactics
  tactic-fleet-alarm-unclaimed-hold session (both by this session's own repo
  reads and independently by that Workflow round's drift-review agent). Not
  auto-created by dispatch-fleet-alarm -- a session-authored finding, landed as
  its own tracked node per this repo's sole-tracker-recording convention (real
  defects land as a tactic, never left in a transcript).
reading: null
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
# tactic-fleet-alarm-* nodes are wrongly selectable for /align-tactics, and any park landed on one is silently wiped by the next mechanical re-mint

## Context

Landed by an `/align-tactics tactic-fleet-alarm-unclaimed-hold` session on 2026-08-04 after that node's own `align-tactics` round determined the target could not be finalized or parked without violating a recorded contract, and traced why: the graph selector has no concept of "mechanically-managed" tactic nodes, so `tactic-fleet-alarm-*` — a family intended to be minted and resolved only by `dispatch-fleet-alarm` — is treated exactly like an author-authored draft. This node exists so that finding survives past this session's transcript.

## Reason

See `office_hours.reason` above for the full evidence chain: the selector's candidate emission (`router.ts:540-556`), the alarm writer's closed-detection (`dispatch-fleet-alarm:316-325`) and unconditional mint-fresh overwrite (`dispatch-fleet-alarm:618`), the concrete clobbered-park commit pair (`894e653a` → `7ff0962d`), and the git history of `intentions/tactic-fleet-alarm-unclaimed-hold.md` showing ~14 repeats of the mint/park-attempt/clobber cycle, 14 of which ended in a frozen worker session rather than a clean disposition.

## How to resolve

See `office_hours.recommendation` above. In short: exclude the `tactic-fleet-alarm-<kind>` id family from `router.ts`'s frozen-tactic candidate loop (fix a), optionally hardening `dispatch-fleet-alarm`'s `classify()` to be park-aware as defense in depth (fix b). This is itself PR-sized work for a future `/align-tactics tactic-fleet-alarm-node-park-clobber-loop` round once an author has picked a direction — this node deliberately stops at diagnosis, since the choice between (a) and (b) is a design decision, not a mechanical one.

## New severity evidence 2026-08-09 — the diagnosis is unchanged

The diagnosis above and the choice between fixes (a) and (b) are untouched. This
section records only that the loop's measured cost is higher than the original
2026-08-04 filing showed, so the author's ratification is worth more than it
looked.

The loop recurred on `tactic-fleet-alarm-busy-stall` (a different `<kind>` than
the 2026-08-04 evidence, which was `unclaimed-hold` — the family behaviour, not
one node's). Journal facts, `journalctl --user`, 2026-08-09:

| time (EDT) | event |
|---|---|
| 10:56:43 | `dispatch-fleet-alarm: landed new alarm node tactic-fleet-alarm-busy-stall` |
| 11:01:55 | `dispatch-tick: graph 1 tactic-fleet-alarm-busy-stall:tactic:align-tactics` |
| 11:01:56 | `dispatch-tick: launched tactic-fleet-alarm-busy-stall /align-tactics` |
| 11:16:49 | `lib-reservation-ledger: reclaimed reservation tactic-fleet-alarm-busy-stall (spawn-handoff-expired after 300s with no live worker)` |
| 11:16:52 | selected and launched a **second** time |
| 11:17:16 | the node's worktree checkout fast-forwarded to `origin/main` |
| 11:31:48 | reclaimed again — `spawn-handoff-expired after 300s with no live worker` |

Three findings, each new relative to the 2026-08-04 filing:

1. **The selections fired at `target_n: 0`.** The pace curve was fully closed for
   the entire window (`dispatch-target-workers` → `0`, `--exhausted` → `ok`), and
   the loop still consumed two graph-lane spawn slots. Whatever gates unattended
   callers against the pace ceiling did not gate this path. Recording as an
   observation, not a diagnosis — it may be that the graph lane is intentionally
   exempt, in which case the exemption is being spent on a node that can never
   produce a durable write.

2. **Neither spawn reached a live worker.** Both reservations died
   `spawn-handoff-expired after 300s with no live worker`, so the cost is not the
   "worker session freezes at a permission prompt" shape recorded on 2026-08-04 —
   it is worse and cheaper to observe: nothing ran at all. The 300s handoff
   window is burned per selection, and the node returns to the candidate pool
   immediately after.

3. **A worktree persists across the cycle and is re-synced by it.** The branch
   `tactic-fleet-alarm-busy-stall` was created 2026-08-06 10:02:10 from
   `origin/main`, and its checkout at
   `.claude/worktrees/tactic-fleet-alarm-busy-stall` was fast-forwarded to
   `origin/main` at 11:17:16 during the second of the two selections above. So
   each selection does not merely waste a spawn — it provisions or re-syncs a
   checkout that no session ever uses. Verified 0-ahead of `origin/main`, clean,
   and with no live session, and removed by the monitor on 2026-08-09 under the
   author's 2026-08-06 prune grant. It will come back on the next selection.

Note for whoever implements the ratified fix: the disposition that closes this
node should also cover the worktree, i.e. a fleet-alarm node that is never
emitted as a candidate (fix a) never gets a checkout provisioned either, which
makes (a) strictly better than (b) on this axis. That is an argument for the
already-recommended ordering, not a new option.
