---
id: tactic-bounded-work-in-progress
kind: tactic
statement: The selector orders candidates by (tier, rank) with the
  closest-to-done progression ordinal only as a tie-break, so it systematically
  prefers STARTING new work to FINISHING in-flight work — work-in-progress is
  unbounded (measured 123 in-flight tactics against a 3-worker fleet), and
  in-flight PRs age until they no longer merge
owner: ai
status: raw
parent: null
rationale: "Measured live 2026-08-03. THE DEFECT: selectGraphTargets' comparator
  (router.ts, the Order block) sorts candidates by precedence.tier desc, then
  precedence.rank desc, then progressionIndex desc, then id asc. The progression
  ordinal — the 'drain closest-to-done first' bias, whose own doc comment states
  that intent — is the THIRD key, so it orders only WITHIN an exact rank tie and
  never overrides an authored rank difference. This ordering is the one
  tactic-attention-tier-ranking Unit 2 ratified, so amending it is a deliberate
  design change, not a bug fix. MEASURED CONSEQUENCE: of the current top 10
  candidates, only 3 are in-flight (a phase past align-tactics) — the other 7
  are drafts awaiting decomposition, promoted above in-flight work purely by
  authored boost (25.33 and 20.00 vs the 5.33 baseline that most in-flight nodes
  carry). Meanwhile 123 tactics are in flight (implement 74, main-qa 26, qa 18,
  review 5; 33 of them parked) against a fleet of 3 workers — 41 started nodes
  per worker slot. THE HARM: an open PR is a claim on a decaying resource, its
  mergeability against main. main advanced 103 commits in the 48h before this
  was written. A node that is selectable but ranks below the per-tick top-N is
  never provisioned, so its PR rots; and because provision-node-worktree exit 11
  at selection time is the ONLY conflict detector in the graph-native lane, the
  rot is also never observed. Measured 2026-08-03: 15 of 31 open PRs are
  mergeable CONFLICTING, the oldest opened 2026-07-11 — 13 of the 15 predate any
  recent worker-cap deviation, so throttling did not cause them; unbounded WIP
  plus rank-dominated ordering did. Six of the 15 are unparked AND unblocked —
  genuinely selectable for weeks at queue positions 14, 24, 25, 29, 30 and 41,
  never reached. GREENFIELD (recommended): bound WIP in the selector. When the
  count of in-flight tactics is at or above a configured limit, restrict the
  candidate set to in-flight nodes; below the limit, behave exactly as today.
  This names the actual defect (unbounded starting) rather than a symptom,
  preserves the ratified (tier, rank) ordering and the meaning of authored
  boosts in the normal case, and gives one operator dial of the same shape as
  max_concurrent_workers. It MUST fail open: if the restricted set is empty
  (every in-flight node parked or blocked) the selector falls through to normal
  selection, or the fleet deadlocks at the limit with nothing selectable — the
  failure mode this node exists to prevent. ALTERNATIVE (simpler, no new state):
  swap the comparator's second and third keys to (tier, progression, rank, id),
  draining closest-to-done first within a tier. Simulated 2026-08-03 over the
  live store: in-flight share of the top 10 goes 3/10 to 10/10, and the six
  stalled conflicting nodes move from positions 14/24/25/29/30/41 to
  9/5/6/12/13/30. Its cost is that it silently defeats authored boosts on draft
  work until the in-flight backlog drains — with 123 in flight that is a long
  freeze on decomposition — so it needs an author decision, not a quiet landing.
  Under either design, tier remains the preemption escape hatch: genuinely
  urgent new work takes tier 2 and still outranks the in-flight tier-1 set. This
  composes with tactic-graph-router-conflict-routing rather than duplicating it:
  that node routes a conflict once detected, while this one bounds how many
  undetected conflicts can accumulate. Distinct from tactic-pending-merge-phase,
  which changes what the phase ladder contains, not how candidates are ordered."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Design ruling — bound WIP in the selector or swap the comparator
      keys, and does Ruling 17's hold (decide only once the fleet runs at cap)
      still stand?
    answer: "(Ruled 2026-08-04 /align interview, superseding Ruling 17's hold.)
      The WIP bound is ADOPTED: when the count of in-flight tactics is at or
      above a configured limit, the selector restricts the candidate set to
      in-flight nodes; below the limit, behavior is unchanged. Edge-case
      resolutions ratified with it: FAIL OPEN when the restricted set is empty
      (every in-flight node parked or blocked) — fall through to normal
      selection, never deadlock at the limit; tier-2 candidates BYPASS the
      bound (tier remains the preemption escape hatch); parked in-flight nodes
      count toward the WIP number but stay unselectable (each is a live claim
      on decaying mergeability); the pace-exempt lane draws from the restricted
      set. The comparator swap (tier, progression, rank, id) is REJECTED: it
      permanently changes every ranking decision and silently defeats authored
      boosts on draft work until the backlog drains. Ruling 17's re-measure
      (CONFLICTING trend once the fleet demonstrably runs at cap) becomes this
      node's post-landing VERIFICATION, not a decision precondition. blocked_by
      records the mechanical WAIT: the /align-tactics tactic-mode finalize is
      blocked by the workflow drift-gate defect, whose fix is
      tactic-align-tactics-tactic-mode-drift-gate (PR #2982, phase review).
      Park cleared on this ruling."
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
blocked_by:
  - tactic-align-tactics-tactic-mode-drift-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The selector orders candidates by (tier, rank) with the closest-to-done progression ordinal only as a tie-break, so it systematically prefers STARTING new work to FINISHING in-flight work — work-in-progress is unbounded (measured 123 in-flight tactics against a 3-worker fleet), and in-flight PRs age until they no longer merge
