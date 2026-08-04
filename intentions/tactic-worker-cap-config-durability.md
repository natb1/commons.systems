---
id: tactic-worker-cap-config-durability
kind: tactic
statement: dispatch.config/target-workers.json — the fleet's throughput dial —
  is untracked by git, carries no provenance and no expiry, and no detect
  compares it to a standing value, so a deliberately temporary throttle is
  indistinguishable from the intended setting and silently becomes permanent
owner: ai
status: raw
parent: null
rationale: >-
  Confirmed live 2026-08-03. THE DEFECT: git ls-files reports
  dispatch.config/target-workers.json is untracked, so the file has no history,
  no blame, no diff and no review. Its whole content is a max_concurrent_workers
  integer (the loader's own default is 8). Nothing records WHO set the current
  value, WHEN, WHY, or WHETHER it was meant to be temporary; nothing compares it
  to a standing value; and no health read prints it against an expected one. THE
  OCCURRENCE: on 2026-08-01 the cap was deliberately reduced from 3 to 1 as an
  explicitly temporary measure, with a written restoration condition (restore
  once the blocking PR merges and a clean day passes). The blocking PR merged
  2026-08-03T03:00Z. The cap was still 1 at 2026-08-03T13:00Z and was restored
  only because a human happened to re-read a planning document that recorded the
  intent — the graph and the fleet had no representation of it at all. Every
  select-tick decision across that window logged target_n 1 with max_workers
  null, so even the routing log carried no evidence that 1 was a deviation
  rather than the intended value. COST: the fleet ran at one third of its
  intended capacity for roughly two days. It was not idle — 7 PRs merged and 20
  distinct nodes were selected in the window — so no stall detect fires on this;
  the loss is invisible throughput, which is exactly why it needs an explicit
  representation rather than an alarm. This is the same class as the
  containment-undone and rollback-leaves-dirty-state findings already tracked:
  an operator action that the system has no way to remember, verify, or expire.
  GREENFIELD: make the dial self-describing and self-expiring. Track the file in
  git so every change has provenance. Give it a standing value plus an optional
  deviation record carrying reason and expires_at; dispatch-tick reads the
  effective value and, past expires_at, restores the standing value and logs the
  restoration. A deviation with no expiry is rejected at load — a throttle
  nobody scheduled to end is the failure this node records. Emit the effective
  value AND the standing value into each select-tick routing decision so the log
  shows a deviation as a deviation. MIGRATION: tracking the file and adding the
  standing/deviation shape is backwards compatible if a bare
  max_concurrent_workers integer keeps loading as the standing value with no
  deviation, so the loader change can land before any config is rewritten.
  Related to but distinct from tactic-pace-exempt-ceiling-fanout, which concerns
  a lane that reads no ceiling at all; this node concerns the durability and
  provenance of the ceiling's own value.


  2026-08-04 /align-tactics PARK NOTE: an autonomous finalize pass ran the
  two-sided drift review (gather: 3 reuse hunts + corpus + clause-coverage, 6
  subagents, 573734 tokens) and found this node's greenfield depends on three
  design premises the graph already answers differently or leaves undecided —
  see office_hours.reason for the full DECIDE list. Once those are ratified,
  greenfield elements 2-4 (the loader's standing/deviation schema,
  effective-value resolution, and select-tick logging) are fully plannable with
  no further author input; the gather phase already located every reuse site.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 12
  override: null
  rationale: "Author-directed 2026-08-03: prioritize bug-ledger fixes directly
    BELOW the token-efficiency cluster. Boost 12 resolves to 17.33 because an
    inbound distributor adds 5.33 — under that cluster's 20.00 and above the
    5.33 undecomposed baseline. Simulated over the live store before writing: 0
    tier changes, 0 value drift onto non-target nodes."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Requirement ambiguity — three design premises this finalize depends on
    are answered differently, or not at all, by recorded graph substance, and
    none is autonomously resolvable. (1) PROVENANCE HOME. The node's greenfield
    says \"Track the file in git so every change has provenance\", but
    strategy-owned-orchestration's 2026-07-11 clarification
    (intentions/strategy-owned-orchestration.md:70-82) already decided that
    human-edited fleet-behavior config — target-workers.json named explicitly —
    migrates into natb1/office-hours-nate's dispatch.config/ under version
    control, located by a host symlink, and strategy-graph-native-dispatch's
    2026-07-26 XDG clarification rests its whole divergence on that symlink
    being the source of reviewable history. The remaining half is
    tactic-dispatch-config-instance-repo (owner human, status delegated,
    office_hours since 2026-07-11, blocked_by tactic-dispatch-config-template at
    phase implement), whose recommendation is literally to copy the live
    target-workers.json into the private instance repo and place the symlink.
    Planning git-tracking here would duplicate decided human-owned work, cross
    into another strategy's owned artifact shape, and put private operator
    config in the public monorepo. DECIDE: descope git-tracking from this node
    and depend on that migration, or amend the 2026-07-11 decision. (2) WHERE
    THE SELF-EXPIRING THROTTLE LIVES. The 2026-07-26 steelman clarification
    distinguishes a self-clearing throttle (the pace-curve pin) from a standing
    operating mode (the config field) and put pause in config because pause must
    NOT self-clear; this node proposes a self-clearing deviation inside that
    standing-mode surface. The strategy also already declined a bare
    blocked_until timestamp for the WAIT-node shape precisely because a
    timestamp \"carries NO attempt counter, NO cap and NO escalation path\" — a
    deviation record disciplined only by expires_at is that declined shape — and
    records a binding boundary that where a cheap readable signal already
    exists, reaching for the clock is the retreat (the 2026-08-01 occurrence's
    restore condition was \"the blocking PR merged\", an event, not a clock).
    DECIDE: config deviation record, pace-curve pin, or a graph WAIT node — and
    whether the deviation must name a restore signal plus a finite cap that
    escalates to a park. (3) MAY THE FLEET WRITE THE OPERATOR'S CONFIG FILE?
    \"past expires_at, restores the standing value\" reads as dispatch-tick
    rewriting target-workers.json, which converts a human-edited tracked file
    into a machine-written one (against the same 2026-07-11 split) and races
    across worktrees on the single shared config path (lib.sh:1867). The clean
    alternative is read-time resolution — return the standing value once the
    deviation has expired and log the restoration, never writing. DECIDE:
    read-time effective value, or a fleet-written restore. OBSERVATION, no
    decision needed: load-time rejection of an expiry-less deviation halts
    autonomous scheduling rather than falling back to 8 workers, because every
    consumer fails closed (pause's any-read-failure-is-paused; the 2026-08-04
    at-cap pace-exempt lane's select-nothing posture) — the intended direction,
    recorded here because a tactic-target round may not write clarifications
    onto the strategy (references/tactic-target.md:135-141). SCOPE THAT IS NOT
    BLOCKED: greenfield elements 2-4 minus the above ambiguities — the loader's
    standing/deviation schema, effective-value resolution, and emitting
    effective + standing values into each select-tick decision — are fully
    plannable, and the gather phase already located every reuse site
    (dispatch-config-load's target-workers case arm and schema block,
    _dlog_select_emit as the single decision-record builder,
    dispatch-target-workers --max's config-only short-circuit, and
    reservation_sweep's ISO-timestamp expiry idiom). Recommend: at one sitting
    answer the three DECIDE items above (descope-vs-amend; config-deviation vs
    pace-pin vs graph WAIT node, with or without a named restore signal and cap;
    read-time vs fleet-written restore), record them as clarifications on the
    owning strategies, then clear this park — a re-run of /align-tactics
    tactic-worker-cap-config-durability can plan the remaining units with no
    further author input."
  since: 2026-08-04
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# dispatch.config/target-workers.json — the fleet's throughput dial — is untracked by git, carries no provenance and no expiry, and no detect compares it to a standing value, so a deliberately temporary throttle is indistinguishable from the intended setting and silently becomes permanent
