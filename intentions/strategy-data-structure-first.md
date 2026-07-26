---
id: strategy-data-structure-first
kind: strategy
statement: Position commons.systems data-structure-first — the intention graph
  is the product; harnesses, ours included, are consumers
owner: human
status: raw
parent: strategy-promote-progressive-detachment
rationale: "The README's harness-first headline ('a long-horizon agent
  orchestrator') sells the consumer and buries the product. The durable artifact
  is the intention graph itself — a data structure for managing intentions and
  alignment that a reader can use with their own project management and agentic
  workflows; the long-horizon coding harness is one consumer of it, the
  reference consumer. Positioning data-structure-first is capability transfer
  stated at the headline level (strategy-open-source-as-gift): the reader is
  offered a structure they can adopt without adopting the author's stack.
  Standalone use is a direction stated honestly, not a current-capability claim
  — separability gaps are tracked as work, never denied in copy. Under this
  framing the project identity is spec plus reference implementation: the
  schema, node kinds, and attention/signal semantics are the adoptable thing;
  this repo is their reference implementation, harness included. 'Not a
  platform' survives; 'not a library' softens — packages/intentionsutil
  effectively becomes one."
reading: null
gap: null
serves:
  - virtue-respect-for-persons
recovers:
  - delegation-anthropic-claude
clarifications:
  - question: Is this a README edit or a positioning strategy?
    answer: A strategy — the requirement inverts the project's public identity from
      harness-first to data-structure-first, which outlives any one surface. The
      README rewrite is its first tactic (tactic-readme-data-structure-first);
      the framing governs all public positioning, with landing/brand aligning as
      each surface is next touched (README now, others follow). Recorded
      2026-07-07 interview.
  - question: What does 'alignment' mean in the headline?
    answer: Both readings, deliberately — agent-alignment (agents act on your
      recorded intent) and the graph's own sense (alignment of attachments and
      intentions with virtues, per virtue-alignment-of-attachments). The same
      structure that aligns agents to your intent is the one that aligns your
      commitments to your virtues; the README supports both without leaning on
      either as jargon. Recorded 2026-07-07 interview.
  - question: Is 'use it with your own project management and agentic workflows' a
      current-capability claim?
    answer: Direction, stated honestly. Standalone use is the intended shape but has
      gaps (tooling assumes this repo's layout, skills assume the harness); copy
      never claims standalone capability beyond what exists, and known
      separability gaps become draft tactics under this strategy
      (tactic-graph-separability-audit retains the audit). Recorded 2026-07-07
      interview.
  - question: What happens to the identity sentence 'not a platform, not a library,
      but a reference setup'?
    answer: "Identity becomes spec + reference implementation: the data structure
      (schema, node kinds, attention/signal semantics) is the adoptable thing
      and the repo is its reference implementation, harness included. 'Not a
      platform' survives; 'not a library' softens since packages/intentionsutil
      effectively becomes one. Recorded 2026-07-07 interview."
  - question: Is the requirement text the binding headline copy?
    answer: A draft the tactic refines — the two sentences fix the framing in
      substance (data structure first; own-workflows and provided-harness as the
      two uses) and must survive in substance, but exact wording is settled at
      README-rewrite time. Recorded 2026-07-07 interview.
  - question: "Why does a positioning strategy carry recovers:
      delegation-anthropic-claude?"
    answer: Partial recovery — a graph adoptable without the harness shrinks what
      the Anthropic delegation covers from 'the product' to 'one consumer of
      it'. The delegation's divergence is low-moderate with
      orchestration-runtime semantics and graph-node drafting among the imports;
      positioning the data structure as harness-independent reduces how much of
      the project's value that import touches. Recorded 2026-07-07 interview.
  - question: Who approves the README copy before it deploys?
    answer: "The author, at office-hours, before implementation:
      tactic-readme-copy-approval (owner: human, parked office_hours) gates
      tactic-readme-data-structure-first via blocked_by. The rewrite cannot be
      selected until the author ratifies or revises the draft headline, subline,
      and identity sentence; the approval outcome is recorded as a dated
      clarification here. This amends the earlier
      draft-refines-at-implementation answer: wording is still settled at
      README-rewrite time, but only within copy the author has approved.
      Recorded 2026-07-07 follow-up to the interview."
  - question: The harness is called 'the most distinctive artifact' elsewhere — does
      that contradict graph-as-product?
    answer: "No — the claims layer, and this entry is the layered claim's one
      auditable home (recorded 2026-07-09): the graph is the product; the
      harness is its reference consumer AND remains the repo's most distinctive
      artifact for practitioner distribution — a showcase implementation whose
      distinctiveness serves distribution of the product, never a rival product
      claim. The four practitioner-distribution nodes
      (strategy-autonomous-execution, strategy-owned-orchestration,
      strategy-progressive-validation, strategy-distribute-workflow) cite this
      entry rather than restating the claim. Recorded 2026-07-09 interview."
  - question: What copy did the author approve for the README front page?
    answer: "Approved at the 2026-07-25 office-hours sitting, completing
      tactic-readme-copy-approval and unblocking
      tactic-readme-data-structure-first. HEADLINE (revised): 'commons.systems: A
      data structure for managing requirements, goals and alignment' — the author
      replaced 'intentions and alignment' with 'requirements, goals and
      alignment'. SUBLINE (ratified as drafted, deliberately): 'Use it with your
      own project management and agentic workflows, or use it with the provided
      long horizon agentic coding harness.' The author was shown that this
      imperative reads as a present-capability claim and so sits in tension with
      the 2026-07-07 'Direction, stated honestly' entry above, and chose to keep
      it — that entry is therefore narrowed on wording, not overturned on
      substance: the imperative stands in the README subline while the known
      separability gaps remain genuinely tracked as work (see
      tactic-graph-separability-audit, filed the same day for exactly this
      reason). IDENTITY SENTENCE (revised from the review candidate): 'Owned and
      self-managed, local-first, built to be forked: the open source artifacts are
      the schema — node kinds, attention and signal semantics — and this repo is
      their reference implementation, harness included. Not a platform.' The
      author replaced 'the adoptable thing' with 'the open source artifacts' and
      cut everything after 'Not a platform', so the 'not a library' clause is
      dropped entirely rather than softened — the spec-plus-reference-
      implementation entry is satisfied by omission on that point. The
      implementing session may settle wording only inside this approved copy."
tooling_goals: []
success_signal:
  observable: public tier-3 surfaces lead with the data-structure framing — a
    first-time reader can state that the intention graph is adoptable with their
    own workflows and the harness is optional
  sensor: owner review of public surfaces at office-hours
  threshold: README leads with the framing; each subsequently touched public
    surface matches it; no surface claims standalone capability beyond what
    exists
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes:
  conditions:
    - separability stays a real direction — schema and intentionsutil
      development does not hard-couple to the harness, and known gaps are
      tracked as work rather than denied in copy
    - the README/landing audience split holds — README remains the tier-3
      practitioner surface, landing the tier-2 user surface
    - standalone-use claims stay matched to actual capability — direction stated
      as direction
    - per strategy-show-not-tell, the framing requires no philosophical buy-in —
      'intentions and alignment' reads as practical vocabulary, not doctrine
---
# Position commons.systems data-structure-first — the intention graph is the product; harnesses, ours included, are consumers
