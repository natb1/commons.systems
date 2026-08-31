---
id: kind-delegation
kind: kind
statement: Delegation — an attachment record; where capture is detected and
  recovery kept real
owner: human
status: codified
parent: null
rationale: >-
  To act at any altitude I must delegate the altitudes below. Atrophy of
  delegated skills is the price of strategic attention and is expected — I
  cannot smelt copper or forage wild grains, and that is the system working.
  What must never atrophy is the path back.


  Every delegation grafts the delegatee's virtues onto this graph as
  constraints. Two axes measure the graft. DIVERGENCE: do the imported virtues
  contradict the virtues held here? (Governed by
  virtue-alignment-of-attachments.) IRREVERSIBILITY: what does recovering the
  capability cost, and is the recovery knowledge gated by the party I would
  recover from? (Governed by virtue-progressive-detachment.) A recovery path
  that has never been exercised is a hope, not a path — `last_exercised` is
  load-bearing, and recovered artifacts decay at the rate their substrate
  drifts, so recovery cost grows with time.


  Classification is derived from the axes. A TOOL sits low on both: separable,
  its outputs outlive access to it, its virtues inert or optional. A PLATFORM
  demands buy-in: acceptable in principle while the vendor's virtues stay
  consistent with mine, but platforms are generally engineered to charge the
  service against virtue buy-in. CAPTURED is both axes high at once: I must hold
  virtues that are not mine and cannot afford to stop — the alignment edge
  running backwards; the delegatee sets the problem. Canonical specimen:
  delegation-attention-services. The derivation rule (2026-07-09): captured =
  high divergence OR gated/prohibitive recovery; platform = moderate divergence
  OR high recovery cost; tool = otherwise — mechanical once the axes are enums
  (tactic-delegation-classification-derivation), so classification can never
  again contradict the axes it claims to derive from.


  Attachments are audited however acquired: an inherited edge (born into, never
  chosen — `origin: inherited`) gets the same two-axis review as a chosen one. A
  DECLINED delegation (`origin: declined`) was deliberately never entered: the
  record documents the standing alternative and why it is refused, so the
  avoidance stays auditable instead of tacit. Maintaining an abstention is not
  unwinding: a declined record is never a recovers target — recovers means
  unwinding an ENTERED delegation, and the guard relationship a strategy has to
  a declined alternative lives in both rationales and the record's
  review_trigger. This sentence is the abstention doctrine's one auditable home
  (2026-07-09); nodes stating it cite here. A record with `status: raw` is a
  future-candidate capture — named before any recovery strategy exists, awaiting
  selection (see strategy-domain-selection). Delegations are records, not goals:
  they are reviewed on their `review_trigger`, never completed. The reverse edge
  lives on strategies: a strategy's `recovers` field names the delegation
  records its work unwinds.
reading: null
gap: null
serves: []
recovers: []
clarifications:
  - question: How are delegation records reviewed, absent a review_window cadence?
    answer: "Event-based, never cron: review_window is retired (2026-07-09 —
      declared by this kind and read by strategy-exercise-recovery-paths, yet
      carried by zero of 21 records; a cron-style delegation review is flaky and
      impractical). review_trigger is the sole mechanism; standard triggers
      include reading-program rounds whose broadening context touches the
      delegatee's domain, and requirement refinement touching the delegated
      capability. Ad-hoc prioritization is served by capture visibility —
      records ranked by divergence × irreversibility and last_assessed age on
      the office-hours goals page (tactic-delegation-capture-visibility).
      strategy-exercise-recovery-paths' portfolio review reads the same surface.
      Recorded 2026-07-09 interview."
  - question: What does a delegation node's markdown body carry?
    answer: The audit narrative — assessment detail and evidence behind the axes
      (the prose nuance the enum-ized axes no longer hold), per kind-kind's
      body-function rule. Recorded 2026-07-09 interview.
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
attributes:
  fields:
    - "delegatee: the entity delegated to (tool vendor, institution, industry)"
    - "delegated: the capability handed over"
    - "origin: chosen | inherited | declined — declined records a delegation
      deliberately never entered"
    - "divergence: {level: low|moderate|high, imported: [virtues the delegatee
      makes me hold], contradictions: [virtue ids they conflict with]}"
    - "irreversibility: {recovery_path: rebuild|re-host|substitute|relearn +
      description, recovery_cost: bounded description, gated: whether recovery
      knowledge is held by the delegatee, last_exercised: date the path was last
      actually walked, or null}"
    - "classification: tool | platform | captured — derived from the two axes by
      the rule in the rationale; greenfield derived-on-read, never stored
      (tactic-delegation-classification-derivation)"
    - "non_delegable_floor: the meta-capability that must not atrophy for the
      recovery path to stay real"
    - "review_trigger: what prompts reassessment"
    - "last_assessed: date of the last review"
    - "household: {shared: boolean, basis: <evidence for the marking>, consent:
      [{date, move, decision}], preferences: [<household-voiced platform
      preferences or objections>]} — optional; an absent block means the record
      is not yet assessed for household sharing. shared marks a delegation the
      household jointly holds (a migration or re-alignment would change family
      members' access or workflow); basis cites the record's own evidence.
      consent and preferences entries carry only the household's own voice,
      recorded at office-hours — never seeded or inferred by a session
      (tactic-household-consent-instrument seeds shared/basis proposals only;
      ratification is tactic-household-consent-offering)."
  status_vocabulary:
    raw: a future-candidate capture named before any recovery strategy exists,
      awaiting selection
    refining: under active dialectic
    codified: the author has personally settled this attachment record
    superseded: the intent moved to another node — abandoned, not completed;
      superseded_by names the successor
---
# Delegation — an attachment record; where capture is detected and recovery kept real
