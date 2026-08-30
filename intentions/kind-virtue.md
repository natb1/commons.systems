---
id: kind-virtue
kind: kind
statement: Virtue — a disposition held and exercised, never completed
owner: human
status: codified
parent: null
rationale: >-
  The roots of the graph are the virtues actually held (`parent: null`); there
  may be several — the root layer is a forest, not a single apex. A virtue is a
  disposition: it has no completion state, and it is exercised through its
  constituent virtues, not worked on directly.


  Edges. A virtue's `parent` edge is CONSTITUTIVE, not means-end: the child is a
  component the parent consists in, not a step toward it. Constitutive edges are
  non-monotonic — advancing one child is not automatically progress on the
  parent. Sibling virtues under one parent are held in tension
  (`attributes.tension_with`): they are balanced, not summed, and maximizing one
  against its partner is failure, not progress. Whatever consumes this graph
  must never total virtue children into a parent completion score. Virtues never
  carry attention injections and are never conduits for rank flow.


  A virtue applied to present conditions generates strategies (kind-strategy);
  that edge — `serves`, pointing back at the virtue — is where disposition
  becomes state, the graph's one phase change.


  Virtues are the layer that must never be imported unexamined: every delegation
  grafts the delegatee's virtues onto this graph as constraints
  (kind-delegation). The virtue/goal test, for deciding where the virtue layer
  stops: a virtue is a disposition you always hold but can never complete; a
  goal is a state you can reach and check off.
reading: null
serves: []
recovers: []
clarifications:
  - question: What must a new root record about its placement?
    answer: "A rooting argument: every root states, in its rationale, why it is not
      a child of its nearest existing sibling. No root is exempt — there is no
      ranking among roots. This captures the discipline the retired kinship
      field was accidentally providing (kinship retired 2026-07-09: it had no
      mechanical consumer, its definition matched only one of its uses, and its
      substance already lived in rationale prose). Where two roots share a
      deeper commitment — virtue-philosophical-mobility and
      virtue-respect-for-persons' 'two faces of one commitment' — that insight
      lives as prose at one auditable home (virtue-respect-for-persons'
      rationale); a second such pair emerging is the trigger to design structure
      for it, and the apex question stays open on virtue-philosophical-mobility.
      Recorded 2026-07-09 interview."
  - question: What does a virtue node's markdown body carry?
    answer: The extended articulation of the disposition — exposition beyond the
      rationale's argument, per kind-kind's body-function rule (the body is
      authoritative for its declared function, never a shadow of frontmatter).
      Recorded 2026-07-09 interview.
  - question: Does 'a disposition held and exercised, never completed' survive the
      NE II.5 hexis reading? (chunk 2)
    answer: "Ratified at chunk 2 (NE II.1-7), 2026-07-13. II.5 (1105b19-1106a13)
      gives the genus: virtue is a hexis, neither pathos nor dynamis — we are
      not praised or blamed for feelings or bare capacities, virtues are
      decisions or involve decision, and by feelings we are moved while by
      virtues we are disposed. 'Never completed' is grounded against the
      apparent counter-text: II.4's 'firm and unchanging state' (1105a33) is
      counterfactual stability of the disposition, not task-completion, and
      II.1-4's doctrine that states are produced, preserved, and destroyed from
      and through the same activities means the hexis persists only in exercise
      — there is no reachable check-off state; the virtue/goal test survives
      intact. The author's articulation, mapping II.4's three conditions
      (1105a26-b9) onto the graph: intention and action must come from a state —
      (1) knowledge of the good (the graph records both intentions and
      knowledge), (2) decision to do the good (author and delegatees make
      decisions from the hexis and its record), (3) from a firm and unchanging
      state (virtue nodes are persistent and unconditional — exceptionless in
      application, amendable only by deliberate dialectic). The graph records
      and externalizes the three conditions and is the instrument of the second;
      it is the model of the internal hexis, never the hexis itself (see the
      synchronization clarification on strategy-explicit-intent, same sitting).
      Recorded 2026-07-13 /reading-review chunk 2."
  - question: Is tension_with grounded in Aristotle's doctrine of the mean? (chunk 2)
    answer: "Amended at chunk 2 (NE II.1-7), 2026-07-13: no — the mean is
      intra-virtue. II.6 defines virtue as a mean between two vices, one of
      excess and one of deficiency (1107a2-3), relative to us, fixed by the
      reason by which the phronimos would fix it (1106b36-1107a2); II.7's table
      individuates virtues by field of feeling and action and balances none
      against another — the author verified this against II.7 directly. The
      graph's rendering is requalified accordingly. Each virtue carries its own
      mean: its named excess and deficiency live in its rationale (the mobility
      children now state their triples explicitly), and II.7's
      field-individuation licenses those children as virtues in their own right
      — distinct fields, the irreversibility and divergence axes, not poles of
      one continuum. tension_with is a graph-native device, not Aristotle's
      doctrine: it records the cross-guard between sibling virtues whose
      excess-directions fall in each other's fields (alignment maximized drifts
      toward capture on the irreversibility axis, the sibling's field;
      detachment forced into dogma is rebutted by alignment's managed-adoption
      doctrine), borrowing the mean's shape — ruin from two directions, balanced
      not summed, maximizing one against its partner is failure. Inter-virtue
      conflict outside a recorded cross-guard is adjudicated at application, not
      by standing edges (virtue-respect-for-persons carries no tension_with by
      explicit doctrine; its floor is inviolable, never balanced). Divergence
      recorded on tradition-aristotle in the same commit; the cross-guard
      articulation is Claude-drafted and deferred
      (delegation-philosophical-articulation), reviewed at
      tactic-reading-chunk-5-aristotle-phronesis — NE VI's phronesis is
      Aristotle's own inter-virtue coordinator. Recorded 2026-07-13
      /reading-review chunk 2."
  - question: Why does the status vocabulary now carry 'delegated'?
    answer: "Added 2026-08-30 (sustenance round, via the legacy-null migration's
      adjacent-doctrine path). The three-state decision model legalizes
      delegated virtue substance — priced by the capture model, no longer
      forbidden by the retired floor — so the kind needs a status for a virtue
      whose articulation the author has not settled. First bearer:
      virtue-knowledge-as-gift, minted delegated-pending-review as the tension
      sibling of the ratified virtue-right-livelihood. codified keeps its
      meaning; delegated is the stamp-visible interim."
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
    - "tension_with: sibling virtue id this one is balanced against"
    - "governs: which delegation axis this virtue governs (divergence |
      irreversibility), when it governs one"
    - "delegable: never — set on the non-delegable core; see
      virtue-philosophical-mobility"
    - "calibration: how the virtue's own judgment is checked from outside itself"
    - "traditions: ids of tradition records (kind-tradition) that inform this
      virtue; the alignment/divergence detail lives on the tradition record, not
      here"
    - "inviolable: prose marking a prohibition layer as a side-constraint —
      exceptionless, never balanced or summed; set where a virtue carries a
      floor the tension machinery must not touch (see
      virtue-respect-for-persons)"
  status_vocabulary:
    codified: the author has personally settled this virtue's articulation
    delegated: the virtue's substance is Claude-drafted and held
      delegated-pending-review or delegated-review-declined under the
      three-state decision model (strategy-explicit-intent, 2026-08-30) — not
      yet author-settled; flips to codified when an /exetasis sitting or an
      adjacent /align round ratifies it
---
# Virtue — a disposition held and exercised, never completed
