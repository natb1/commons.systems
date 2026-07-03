---
id: strategy-exercise-voice
kind: strategy
statement: Exercise voice toward delegatees — pull alignment toward held
  virtues where exit is expensive
owner: human
status: refining
parent: null
rationale: >-
  virtue-alignment-of-attachments says to actively manage delegatees so their
  virtues stay consistent with mine, but every strategy serving it manages by
  exit-shaped moves — recover (build the owned replacement), realign (swap
  the vendor), drill (keep the path warm). This strategy makes the other
  management move first-class: voice — vendor feedback, upstream
  contributions, standards participation — pressure that pulls a delegatee's
  alignment toward held virtues instead of leaving. Voice earns the most
  exactly where exit costs the most, and that set is defined mechanically
  from the ledger, not by intuition: a delegation is HIGH-COST-OF-EXIT when
  its record shows `irreversibility.gated` other than false, or a
  `recovery_cost` not bounded in days (weeks-plus, unbounded, or unassessed —
  unknown exit cost is treated as high until assessed). New records qualify
  automatically as they enter the ledger. Under this predicate today the set
  is delegation-anthropic-claude (unbounded cost), delegation-mobile-platform,
  delegation-identity-root, delegation-banking, delegation-communications,
  delegation-attention-services, delegation-health-records,
  delegation-knowledge-notes, delegation-media-libraries, and
  delegation-client-income (unassessed). Notably delegation-github drops out —
  its record reads days-bounded and un-gated — so a voice channel there is
  permitted, not required; if that feels wrong, the fix is re-assessing the
  record, never widening this set by hand.


  The guard is the virtue itself: voice must not invert into advocacy.
  Promoting the delegatee's growth is not a virtue held here — a voice
  channel that turns into evangelism, ambassador programs, or identity
  investment in the vendor is the alignment edge running backwards through a
  side door. Voice is exercised as a customer and a contributor, never as a
  partisan.
reading: null
gap: null
serves:
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: Which delegations count as high-cost-of-exit — the threshold
      quantifies over that set but only two records were named in prose?
    answer: "The set is mechanical from ledger fields, never a hand-kept list:
      a record qualifies when irreversibility.gated is not false, or its
      recovery_cost is not bounded in days (weeks-plus, unbounded, or
      unassessed). Disagreement with the predicate's output is resolved by
      re-assessing the record (clarified 2026-07-02)."
tooling_goals: []
success_signal:
  observable: voice actions (feedback filed, upstream contributions, standards
    participation) recorded against delegation records at portfolio review
  sensor: owner review at office-hours over the delegation records
  threshold: each high-cost-of-exit delegation (mechanical set — gated recovery
    or cost not bounded in days, unassessed included) shows a live voice
    channel, exercised within its review window
  is_proxy: true
attributes:
  conditions:
    - delegatees maintain channels where individual-scale voice can land
      (issue trackers, feedback forums, standards bodies)
    - voice stays cheap — hours per review cycle, not a role; where a
      delegatee only hears organized blocs, this strategy is inert
---
# Exercise voice toward delegatees — pull alignment toward held virtues where exit is expensive
