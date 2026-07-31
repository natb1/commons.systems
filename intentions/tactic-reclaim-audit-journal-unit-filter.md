---
id: tactic-reclaim-audit-journal-unit-filter
kind: tactic
statement: dispatch-reclaim-audit reads reclaim events with `journalctl --user -u
  dispatch-tick`, but ticks that emit those events run under transient systemd
  units and land under user@1000.service with SYSLOG_IDENTIFIER=dispatch-tick, so
  the unit filter matches nothing and the audit reports zero reclaims against a
  true count of 14 — and it fails OPEN to zero counts rather than erroring, so the
  vacuous result reads as a clean healthy ledger
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-31 while machine-verifying the needs-main residue on
  tactic-router-spawn-window-duplicate-worker, whose own park recommendation names
  dispatch-reclaim-audit as the tool for the item-10 ledger-health check.
  Following that recommendation as written returns `live-worker-redundant reclaims
  (events) ..... 0` while the true post-merge count is 12 live-worker-redundant, 1
  dead-session-stranded and 1 spawn-handoff-expired — 14 events the audit cannot
  see. The mechanism: dispatch-reclaim-audit:179 runs `journalctl --user -u
  dispatch-tick -o short-iso`, and `-u` matches the systemd UNIT. Reclaim lines
  are emitted by tick processes spawned as transient units (dispatch-reseed-*.service)
  or as children of the heartbeat, and those records carry _SYSTEMD_UNIT=user@1000.service
  with SYSLOG_IDENTIFIER=dispatch-tick. So the unit filter excludes exactly the
  records the audit exists to count. Verified by comparing `journalctl --user -u
  dispatch-tick --since '2026-07-30' | grep -c 'reclaimed reservation'` (0)
  against the same grep over the unfiltered user journal (14). What makes this
  worse than an ordinary bug is the failure direction: :182 and :187 print a
  warning and then `continuing with zero sweep counts`, so a journal that cannot
  be read is indistinguishable in the output from a fleet with no reclaims at
  all. An operator reading the audit sees a clean ledger. This is the third
  instance of one class in this pipeline — a health check whose failure mode is a
  silent PASS on the signal that matters. The others: the Monitor tool runs
  sandboxed, where `claude agents --json` returns [] and a duplicate-worker check
  reports green (recorded in the bootstrap plan's monitoring section); and
  graph-commit's exit 0 is not evidence anything landed, which is invariant I2.
  Direction for planning, not a plan: match on SYSLOG_IDENTIFIER=dispatch-tick
  rather than `-u dispatch-tick`, and change the read failure from fail-open-to-zero
  into an explicit UNKNOWN that the caller must handle — a count of zero and an
  unreadable journal must not render identically. The repo's code-style rule
  already says this: prefer clear errors over defensive fallbacks. Cross-check the
  same `-u` pattern across the other audit and liveness scripts before fixing only
  this one site. Interim attention scaffolding only — tactic-attention-tier-ranking
  replaces the numeric scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
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
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is a monitoring instrument that reports healthy while blind, which is worse
    than no instrument, and it is the tool a sibling node's own verification
    recommendation names. blocked_by is empty, so this promotion lifts no blocker
    and cannot compound. status stays raw and phase stays null so the selector
    emits it as an /align-tactics candidate for planning, not as an implement
    candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
---

# tactic-reclaim-audit-journal-unit-filter

## Evidence

Measured 2026-07-31, against `origin/main`.

```bash
# what the audit does (dispatch-reclaim-audit:179)
journalctl --user -u dispatch-tick -o short-iso --no-pager --since '2026-07-30' \
  | grep -c 'reclaimed reservation'
# -> 0

# the same events, without the unit filter
journalctl --user --no-pager -o short-iso --since '2026-07-30' \
  | grep -c 'reclaimed reservation'
# -> 14   (12 live-worker-redundant, 1 dead-session-stranded, 1 spawn-handoff-expired)
```

The audit's own output on that data:

```
live-worker-redundant reclaims (events) ..... 0
```

## Why the failure direction matters

`dispatch-reclaim-audit:182` and `:187` handle an unreadable journal by printing
a warning to stderr and then `continuing with zero sweep counts`. So three
distinct states collapse into one rendered result:

| actual state | audit output |
|---|---|
| no reclaims occurred | `0` |
| journal unreadable (no systemd, sandboxed) | `0` |
| journal readable but the unit filter excludes every record | `0` |

Only the first is healthy. The third is the live case.

## Scope sketch — direction only, not a plan

- Match `SYSLOG_IDENTIFIER=dispatch-tick` instead of `-u dispatch-tick`, so
  records from transient tick units are included.
- Distinguish "read zero events" from "could not read". A failed read must
  surface as UNKNOWN and force the caller to decide, not silently become `0`.
  This follows the repo's code-style rule preferring clear errors over defensive
  fallbacks, and mirrors the treatment `dispatch-graph-main-red-sync` already
  gives an unreadable graph (it emits `UNKNOWN` and is treated as unhealthy).
- Audit the other scripts for the same `-u` assumption before fixing one site.

## Verification

- With the filter corrected, the audit's reclaim count must equal the count from
  an unfiltered journal grep over the same window.
- A deliberately unreadable journal must produce UNKNOWN, not `0`.
- Regression: the count must remain correct for ticks started by the heartbeat
  unit as well as by transient reseed units, since both paths emit these lines.
