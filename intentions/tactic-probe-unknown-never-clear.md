---
id: tactic-probe-unknown-never-clear
kind: tactic
statement: Every fleet and operator probe must report `unknown` when it cannot
  read its input, never `clear` — today that property is a comment in
  dispatch-fleet-watch's own header binding only that script, so everywhere else
  a read that returns empty because it was denied is indistinguishable from a
  true negative, and a monitor acts on a false all-clear
owner: ai
status: raw
parent: null
rationale: "Observed live 2026-08-05 during the iteration-N+3 main-qa drain, and
  it cost real time twice in one session. A background Bash waiter polling `ps
  -p <pid>` ran SANDBOXED, could not see host PIDs at all, found nothing, and
  reported a drain that was still running as exited. Acting on that false
  signal, the monitor started a graph-commit from the same worktree the drain
  was still writing from — which then silently landed nothing (it pushed its
  staging branch and left origin/main unchanged), so one vacuous probe produced
  a second silent failure. THE CLASS IS ALREADY KNOWN AND ALREADY BIT ONCE:
  .claude/rules/sandbox.md records that `claude agents --json` under sandbox
  returns `[]` 'indistinguishable from a genuine no live sessions result', and
  mandates dangerouslyDisableSandbox on every caller — a per-command remedy for
  one command. dispatch-fleet-watch states the general principle and calls it
  THE SECOND MOST IMPORTANT PROPERTY of the script: 'an unreadable input is
  `unknown`, never `clear`. A watcher that reports ok because it could not read
  the thing it watches is worse than no watcher — it manufactures a false
  all-clear.' But that sentence lives in a script header comment and binds that
  script's five predicates only. NOTHING GENERALIZES IT. The nearest recorded
  doctrine is the 2026-07-31 named-instrument clarification ('fail the lane')
  and it does not reach this case: that covers a lane which CANNOT INVOKE its
  named instrument and substitutes an ad-hoc equivalent, whereas here the probe
  invokes the right instrument, gets a well-formed empty answer, and cannot tell
  denial from absence. Note the direction of the hazard is the opposite of
  fail-safe: worktree_has_live_session deliberately folds daemon-UNKNOWN into
  occupied so a node is never double-booked, which is the correct posture; a
  sandboxed probe instead folds unknown into CLEAR, the one direction that
  manufactures permission to act. Fix directions to weigh at planning time: (a)
  a shared probe-result type across the dispatch scripts with three states
  (clear / finding / unknown) so unknown cannot be spelled as an empty result —
  the fleet-watch predicates already return exactly that vocabulary, so this is
  generalizing an existing shape rather than inventing one; (b) making the
  sandbox-denial case detectable at the call site rather than inferred from
  emptiness; (c) a standing strategy condition that binds every probe, including
  operator/monitor tooling, not only owned dispatch lanes."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.04
  override: null
  rationale: >-
    Bootstrap band 2 (50/20/10 interim scale): an observability correctness
    defect that manufactures false all-clears for the monitor — same band as the
    other dispatch-containment fixes.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 20 to 0.04 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked. The defect and its mechanism are established by direct
    observation and need no further diagnosis, but the SCOPE OF THE RULE IS A
    DOCTRINE CALL THE GRAPH DOES NOT RECORD, and it has two limbs. FIRST, does
    unknown-never-clear become a standing condition on this strategy binding
    EVERY probe, or does it stay a per-script property that each instrument
    restates? The graph has a live precedent for the narrow answer — the
    2026-07-31 named-instrument clarification chose a rule binding lanes rather
    than a mechanism — and a live precedent for the broad answer in
    worktree_has_live_session's fail-safe folding. SECOND, and this is the part
    that cannot be settled mechanically: the probe that failed here was a
    harness-level background Bash waiter, NOT owned dispatch code. A condition
    that binds 'every probe' therefore reaches tooling this project does not own
    and cannot change, so it would be a discipline on how the monitor writes
    ad-hoc commands rather than a property any script can enforce — which is
    exactly the kind of prose-enforced rule the mechanical-floor doctrine treats
    as a last resort. Deciding to write an unenforceable condition is a choice
    the author should make deliberately."
  since: 2026-08-05
  recommendation: "Ratify, in a one-question /align-strategy or office-hours
    sitting citing this park: (i) does unknown-never-clear become a standing
    condition binding every probe, or stay per-instrument? and (ii) if standing,
    does it bind operator/monitor tooling that is not owned code — accepting
    that limb is prose-enforced with no mechanical floor — or is it scoped to
    owned dispatch scripts, leaving the monitor's own probes governed by the
    plan's operating invariants instead? Then clear this park and run
    /align-tactics tactic-probe-unknown-never-clear to finalize a plan. STATE A
    FRESH SESSION NEEDS: the principle's canonical statement and the three-state
    vocabulary to generalize are in dispatch-fleet-watch's header (the five
    predicates each return clear | finding | unknown | quiet, and the header's
    two 'MOST IMPORTANT PROPERTY' paragraphs explain why every predicate is
    evaluated on every pass and why unreadable is never clear); the per-command
    precedent and its remedy are in .claude/rules/sandbox.md under 'claude
    agents --json' and 'Network namespace isolation'; the fail-safe
    counter-example is worktree_has_live_session folding daemon-UNKNOWN into
    occupied (lib-claude-agents.sh, cited from graph-select-target's claimed-set
    block); and the adjacent-but-distinct doctrine is the 2026-07-31 'What must
    a dispatch lane do when it cannot invoke its named instrument?'
    clarification on the serving strategy. Tests for anything under
    .claude/skills/dispatch-propagate/scripts/ are picked up by
    run-unit-tests.sh's test-*.sh glob with no CI wiring change."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 20
---
# Every fleet and operator probe must report `unknown` when it cannot read its input, never `clear`
