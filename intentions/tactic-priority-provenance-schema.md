---
id: tactic-priority-provenance-schema
kind: tactic
statement: Document and validate the delegated-priority machinery —
  attributes.priority_log and attributes.rsi_task on kind-tactic,
  ownership-boundary and marks-asymmetry lint in validate-graph
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-11 /align interview: the priority-delegation
  boundary is node-ownership-based (no attention schema change), but the two new
  attributes need kind-tactic documentation and the boundary deserves a
  mechanical lint."
reading: null
serves:
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications: []
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
attributes: {}
---
# Document and validate the delegated-priority machinery — attributes.priority_log and attributes.rsi_task on kind-tactic, ownership-boundary and marks-asymmetry lint in validate-graph
## Draft context (2026-08-11 /align interview)

- kind-tactic documents attributes.priority_log ({date, old→new, rationale}
  entries, append-only, capped ~10) and attributes.rsi_task ({type,
  reasoning, cost?}) as model-writable, fingerprint-exempt fields (the
  queue_summary precedent). Document that the anti-thrash rule binds within
  the log's retained window (an entry scrolled off the cap no longer
  constrains). Document rsi_task.cost semantics: implementation type ⇒
  derived cost 1, declared cost ignored/flagged; other types default 0.
  The legacy standalone attributes.rsi_cost is retired (carriers repointed
  by tactic-rsi-plan-priority-render); a standalone rsi_cost is a lint
  violation thereafter.
- Verify (and if needed make) both fields exempt from the substance
  fingerprints: strategyFingerprint for strategies and the tactic scope
  fingerprint, so an iteration's reprioritization/re-derivation never
  freezes open children or trips scope custody.
- validate-graph lint candidates: a priority_log on a strategy/virtue node
  or on an owner: human tactic is a boundary violation (model priority
  writes are only legal on owner: ai tactics); a log entry without date or
  rationale; rsi_task.type=implementation on a node whose declared
  rsi_task.cost contradicts the derived cost 1; a standalone legacy
  rsi_cost field (retired — repoint to rsi_task.cost).
- SUPERSEDED 2026-08-11 (second /align round): the within-tier ordering
  verification below moved to tactic-attention-namespaced-rank, which owns
  the resolver change that makes namespaced rank structural. What stays
  here is the lint half — the boundary and marks-asymmetry checks above,
  plus a new check flagging a delegated attention write whose composed
  value inverts cross-strategy order within a tier. Land the two together
  or state why not. Retained for context:
- VERIFY within-tier ordering semantics against the recorded doctrine
  (strategy-recursive-self-improvement, 2026-08-11 tier/rank-composition
  clarification): tier takes precedence globally; within a tier, tactics of
  higher-ranked strategies order before tactics of lower-ranked strategies.
  attention.ts's tier-isolation filter (~lines 531–534) appears to drop a
  lower-tier distributing strategy's contribution from a higher-tier
  node's value, which would break the within-tier ordering. If confirmed,
  that is a defect against the recorded semantics: draft a bug_fix tactic
  (it is itself the queue-integrity class the fitness function
  front-loads).
- The marks asymmetry (bug_fix/security may be added, never
  removed/downgraded, by model priority writes) is behavioral doctrine on
  strategy-recursive-self-improvement; lint what is mechanically checkable
  (e.g. a diff-time check is out of scope for validate-graph — note where
  it could live, e.g. graph-commit review or CI diff lint).

### Ownership — why this node serves only the prioritization child

Recorded 2026-08-11 after adversarial review. When this node was repointed to
`strategy-rsi-delegated-prioritization`, it also **lost** its
`strategy-graph-drives-dispatch` edge, and nothing said so — while the
identical decision on the sibling `tactic-attention-namespaced-rank` (keep
both edges) *was* recorded two lines away in the same round. Silence on a
`serves` removal is not neutral: the parent's own classification-escape
clarification notes that removing a `serves` edge "would be a demotion act —
whether it extends there is not decided here," so the round performed an act
of undecided ownership without a record.

**The removal stands, and here is the reason it was owed.** Everything this
node builds — the `attributes.priority_log` and `attributes.rsi_task` schema,
the ownership-boundary lint, the marks-asymmetry lint — exists to bound the
*model's* delegated priority authority. That is `strategy-rsi-delegated-prioritization`'s
whole subject, and this node is half of its success signal (the integrity
half: cross-strategy inversions and attention writes carrying no
`priority_log` entry). `strategy-graph-drives-dispatch` wants rank derived on
read at all; it is indifferent to who is permitted to author a boost.

Keeping both edges would also have been mechanically costly: `resolveAttention`
**sums** a node's authored inheritance across every distributor rather than
taking the maximum, so a second `serves` edge inflates this node's value out
of its band — the defect `tactic-attention-namespaced-rank` is scoped to fix.
Single-edge is the conservative choice until that lands. The cross-cutting
edge on `tactic-attention-namespaced-rank` was kept deliberately for the
opposite reason: that node changes the resolver itself, which both strategies
genuinely own.
