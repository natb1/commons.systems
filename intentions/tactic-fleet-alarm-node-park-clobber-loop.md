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
phase: done
execution:
  branch: pr18-durable-write-fence
  pr: 3134
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-29T22:46:37Z
    mergeCommitSha: 478cc3242048cfdee675dceda46a6e59827f1d10
    graphCommitSha: null
  lane_pass: null
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

## The (a)/(b) decision — ruled and shipped 2026-08-29

This node deliberately stopped at diagnosis because the choice between fix (a)
and fix (b) was a design decision. **Both shipped**, as PR18 Unit 4 of the
dispatch/RSI serialized window (`plans/dispatch-rsi-serialized-pr-plan.md`
§ PR18), merged as `478cc324` (#3134). (a) is the fix; (b) is defense in depth,
exactly the ordering this body already recommended.

**(a) — `router.ts` no longer emits the family as `/align-tactics` candidates.**
The exclusion is keyed on a **closed enum**, `FLEET_ALARM_KINDS`, exported from
`packages/intentionsutil/src/router.ts` and asserted equal to the `KINDS=(...)`
array in `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm` by a
drift guard in `router.test.ts` (with a second test pinning that parse as
non-vacuous, so the guard cannot go quiet if the bash array is reshaped).

The enum is not an implementation detail — it is the correction of a real defect
found in review. The unit first shipped an id-*shape* regex
(`^tactic-fleet-alarm-[a-z0-9]+(?:-[a-z0-9]+)*$`), which anchors the prefix but
matches any slug after it. Of the eight `tactic-fleet-alarm-*` nodes in the
store only four name a machine-managed kind; the other four are hand-authored
drafts. The shape form made **all eight** permanently unselectable — including
this node, the one the unit closes. Membership, not shape, is the property that
distinguishes a mechanically-minted alarm from a draft that happens to share the
prefix.

**(b) — `classify()` is park-aware.** It dropped its `office_hours` disjunct, so
a node that is parked but not `done` now reads `open` and re-detection routes
through the CAS refresh path that preserves frontmatter, instead of the
mint-fresh path that overwrote it. That is the clobber this node is named for.

**(b) needed a guard it did not originally have.** Making a parked node classify
`open` interacts with `--resolve`, which only no-ops when the state is *not*
`open` — so on its own, (b) would let a mechanical `--resolve` land `phase: done`
on a node a human had parked with an unanswered question. That trades one silent
overwrite for another. `--resolve` now refuses on a non-null `office_hours`,
checked after the `dump-node` read and before any mutation, and prints `noop`.

**A note on this body's own cross-references.** The sections above say "See
`office_hours.reason` above" and "See `office_hours.recommendation` above". This
node's `office_hours` is `null` — the park was cleared before this closure — so
those pointers no longer resolve. The evidence they point at is the anchor list
in the "Reason" section and the (a)/(b) framing in "How to resolve", both of
which are intact; nothing was lost, but a reader should not go looking for
frontmatter that is not there.

**Worktree residue.** The 2026-08-09 note predicted that a node never emitted as
a candidate never gets a checkout provisioned, making (a) strictly better than
(b) on that axis. That holds with (a) shipped. It does not retroactively remove
checkouts already on disk from earlier cycles; those are ordinary reap work, not
part of this closure.
