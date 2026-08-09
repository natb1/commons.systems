---
id: tactic-blocked-session-invisible-to-census
kind: tactic
statement: "The reap/health census classifies sessions on `state: done` alone,
  so a session in any other non-`working` state — `blocked`, `stopped` — is
  invisible to every health probe; when such a session sits in the MAIN
  CHECKOUT it holds the shared tree dirty indefinitely, which blocks
  `dispatch-select-tick`'s `--ff-only` sync and every `graph-commit`, stalling
  the whole fleet while `HELD_FOR_DEBUG_COUNT` reads `n=0`"
owner: ai
status: raw
parent: null
rationale: "Confirmed live 2026-08-09 by direct measurement, after the fleet
  produced nothing for ~71 hours (last `origin/main` commit 2026-08-06 11:08
  EDT; commits/day went 168 -> 219 -> 207 -> 20 -> 0 -> 0 -> 0). THE DEFECT:
  background session `f2416fda` (`name: sync-repair`, `cwd:
  /home/n8/natb1/commons.systems` — the MAIN CHECKOUT, not a worktree) entered
  `state: blocked` on 2026-08-06 when its `/commit-merge-push` run died on `API
  Error: Unable to connect to API (ENOTIMP)`. It had already made local commit
  `6886ffa9` and left one tracked file modified. It then sat `blocked` for three
  days with nobody to answer it — a background session in `blocked` has, by
  definition, no interlocutor, so the state is ABSORBING, not transient. THE
  BLIND SPOT: `HELD_FOR_DEBUG_COUNT` counts terminal (`state: done`) sessions
  and correctly read `n=0` for the entire outage, because `blocked` is not
  `done`. Every other health probe agreed. The one symptom that did fire —
  `dispatch-fleet-watch` reporting `busy-stall: finding` — is a KNOWN false
  positive when the pace curve is closed (owned by
  tactic-fleet-watch-busy-stall-pace-blind), so it was discounted; the `note: at
  least one dispatch-fleet-alarm graph write FAILED this pass` line printed
  directly beneath it went unread. A true defect sat inside the blind spot of a
  probe already discounted as noisy. THE CONSEQUENCE: the stale HEAD made
  `graph-commit` CORRECTLY refuse every `dispatch-fleet-alarm` write — `error:
  graph-commit: the resolved repo (/home/n8/natb1/commons.systems) holds
  intentions/tactic-fleet-alarm-busy-stall.md content differing from origin/main
  but has nothing staged to commit` — 3 failed attempts per fleet-watch pass,
  every ~2 minutes, for three days. Nothing was corrupted; the guard did its
  job. What failed is that no probe could SEE the cause. THE FIX DIRECTION
  (greenfield): the reap/health census must classify on the full session state
  space, not on `done` alone. Minimum: count and surface non-`working` sessions
  broken down BY STATE, so `blocked`/`stopped` are visible rather than folded
  into a silent remainder; and treat a non-`working` session whose `cwd` is the
  main checkout as its own alarm, because that session can dirty the tree every
  other path depends on. Reaping policy for `blocked` is a SEPARATE judgment and
  is deliberately not decided here — a blocked session may hold real evidence,
  so surface first, decide second. THE GENERAL LESSON, recorded as invariant
  I22 on the bootstrap plan: `state: done` is the discriminator for REAPING, not
  for HEALTH. A second lesson (I23): a known-noisy alarm does not license
  ignoring the rest of the pass — read the `note:` and `error:` lines even when
  the headline finding is a known false positive."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Band 2 of the bootstrap three-band interim scale (50/20/10). A
    real, measured defect that stranded the entire fleet for 71 hours and was
    invisible to every health probe for its full duration — well above the
    undecomposed baseline. Not band 1: the fleet-stalling condition itself is
    now cleared by hand, and the pace curve (not this defect) governs when work
    resumes, so this is the observability gap that let the outage run
    undetected rather than an active outage."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# A `blocked` session in the main checkout is invisible to every health probe

## What happened

The fleet produced nothing for ~71 hours. Two independent things were in play,
and only one was a defect:

1. **The pace pause was correct.** `seven_day.used_percentage: 91` after the
   08-03/04/05 fan-out; the curve held `target_n: 0` exactly as designed. This
   is not a bug and must never be "fixed".
2. **The main checkout was left dirty and one commit ahead** by a background
   session nobody could see.

Background session `f2416fda` (`name: sync-repair`) ran `/commit-merge-push`
with `cwd` set to the **main checkout** rather than a worktree. Its API call
failed (`ENOTIMP`), the session went `state: blocked`, and it stopped there —
having already written local commit `6886ffa9` and left
`intentions/tactic-fleet-alarm-busy-stall.md` modified in the tree.

A background session in `blocked` has no one to unblock it. The state is
absorbing.

## Why nothing surfaced it

`HELD_FOR_DEBUG_COUNT` read `n=0` for the entire outage. That reading was
*correct* — it counts sessions in `state: done`, and this session was in
`state: blocked`. The census has no term for any other non-`working` state.

The only probe that fired was `dispatch-fleet-watch`:

```
busy-stall:           finding  0 busy workers for 257700s (limit 2700s)
result: finding (1)
note: at least one dispatch-fleet-alarm graph write FAILED this pass
```

`busy-stall` is a known false positive whenever the pace curve is closed —
owned by tactic-fleet-watch-busy-stall-pace-blind — so the finding was
discounted, and the `note:` line beneath it went unread for three days.

## The blast radius

The stale HEAD made `graph-commit` refuse every `dispatch-fleet-alarm` write,
three attempts per pass, every ~2 minutes:

```
error: graph-commit: the resolved repo (/home/n8/natb1/commons.systems) holds
intentions/tactic-fleet-alarm-busy-stall.md content differing from origin/main
but has nothing staged to commit ... refusing to emit a false 'landed'
```

The guard behaved correctly and nothing was corrupted. A dirty tracked file in
the main checkout also blocks `dispatch-select-tick`'s `git merge --ff-only
origin/main` sync, so the autonomous tick's own recovery path was closed at the
same time.

## Fix direction

Classify on the full state space, not on `done`:

- **Count and surface non-`working` sessions broken down by state.** `blocked`
  and `stopped` must appear in the census output rather than falling into a
  silent remainder. An `n=0` held-for-debug count must not read as "no stuck
  sessions".
- **Treat a non-`working` session whose `cwd` is the main checkout as its own
  alarm.** That session can dirty the tree every other path depends on, so its
  blast radius is categorically larger than a worktree-scoped one.

**Reaping policy for `blocked` is a separate judgment and is not decided here.**
A blocked session may hold real evidence — the transcript of `f2416fda` is what
identified the `ENOTIMP` trigger. Surface first, decide second.

## Not a duplicate of

Dedup re-run 2026-08-09 against every session/census node on `origin/main`:

- tactic-stopped-session-blocks-node (`phase: done`) — `done`-but-not-removed
  sessions invisible to the router's **occupancy** path (no `--all`). Occupancy,
  not health; worktree-scoped.
- tactic-frozen-session-debug-count (`phase: done`) — introduced the
  held-for-debug count itself, scoped to terminal sessions. This node is about
  what that count cannot see.
- tactic-park-node-rollback-dirty-tree-blocks-tick-sync (`phase: done`) — a
  *producer* of main-checkout dirt (park-node's rollback). This node is about
  the absence of detection, whatever the producer.
- tactic-provision-residue-live-session-check,
  tactic-standdown-clear-no-worktree-live-session (both `phase: null`) — both
  concern **live** sessions and node worktrees.
- tactic-fleet-watch-duplicate-session-predicate,
  tactic-duplicate-session-mechanical-resolution (both `phase: null`) —
  concurrency/duplicate claims, node-worktree scoped.

None is main-checkout-scoped, and none counts the full session state space.

## Related nodes

- tactic-fleet-watch-busy-stall-pace-blind — the noisy alarm whose known-false
  status is *why* this went unnoticed.
- tactic-session-reap-authorization-durability,
  tactic-terminal-declaration-verified-against-node — two directions of the
  reap-authorization seam; this node is health classification, not reap
  authorization.
