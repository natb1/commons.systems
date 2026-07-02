---
id: kind-delegation
kind: kind
statement: Delegation — an attachment record; where capture is detected and recovery kept real
owner: human
status: codified
parent: null
serves: []
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


  Classification is derived from the axes. A TOOL sits low on both:
  separable, its outputs outlive access to it, its virtues inert or optional.
  A PLATFORM demands buy-in: acceptable in principle while the vendor's
  virtues stay consistent with mine, but platforms are generally engineered
  to charge the service against virtue buy-in. CAPTURED is both axes high at
  once: I must hold virtues that are not mine and cannot afford to stop —
  the alignment edge running backwards; the delegatee sets the problem.
  Canonical specimen: delegation-attention-services.


  Attachments are audited however acquired: an inherited edge (born into,
  never chosen — `origin: inherited`) gets the same two-axis review as a
  chosen one. A DECLINED delegation (`origin: declined`) was deliberately
  never entered: the record documents the standing alternative and why it is
  refused, so the avoidance stays auditable instead of tacit. A record with
  `status: raw` is a future-candidate capture — named before any recovery
  strategy exists, awaiting selection (see strategy-domain-selection).
  Delegations are records, not goals: they are reviewed on their
  `review_trigger`, never completed. The reverse edge lives on strategies:
  a strategy's `recovers` field names the delegation records its work
  unwinds.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  fields:
    - "delegatee: the entity delegated to (tool vendor, institution, industry)"
    - "delegated: the capability handed over"
    - "origin: chosen | inherited | declined — declined records a delegation deliberately never entered"
    - "divergence: {level: low|moderate|high, imported: [virtues the delegatee makes me hold], contradictions: [virtue ids they conflict with]}"
    - "irreversibility: {recovery_path: rebuild|re-host|substitute|relearn + description, recovery_cost: bounded description, gated: whether recovery knowledge is held by the delegatee, last_exercised: date the path was last actually walked, or null}"
    - "classification: tool | platform | captured — derived from the two axes"
    - "non_delegable_floor: the meta-capability that must not atrophy for the recovery path to stay real"
    - "review_trigger: what prompts reassessment"
    - "last_assessed: date of the last review"
---
# Delegation — an attachment record; where capture is detected and recovery kept real
