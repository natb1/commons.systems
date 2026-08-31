---
id: tactic-substantiation-edge-migration
kind: tactic
statement: Migrate the graph to the symmetric substantiation edges —
  attributes.traditions → substantiated_by, contradicted_by edges added from
  rationale prose, validate-graph mirror enforcement, and the stamp vocabulary
  sweep (old state names → ratified/deferred/delegated)
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-30 resolution round, which ratified the
  symmetric locus doctrine (strategy-explicit-intent's superseded locus
  clarification): substantiation and contradiction are two typed edges on the
  substantiated node (attributes.substantiated_by / attributes.contradicted_by),
  each REQUIRED to be mirrored by a locus-naming entry on the tradition record
  (adopted ⇔ substantiated_by; diverged/chosen_over ⇔ contradicted_by); prose is
  optional narrative. Scope: (1) rename attributes.traditions → substantiated_by
  on every bearer (the two new virtues already migrated in the resolution-round
  commit; the legacy bearers — virtue-temperance and siblings — remain); (2) add
  contradicted_by edges where contradictions live only in rationale prose; (3)
  land the validate-graph mirror check (edge without matching record entry, or
  vice versa, fails); (4) sweep remaining old-vocabulary stamps
  (delegated-pending-review → deferred, delegated-review-declined → delegated)
  on nodes the resolution-round commit did not touch (e.g.
  tactic-align-indifference-option, tactic-keystone-decomposition-reorg). The
  doctrine is author-ratified; this tactic is the mechanical carry."
reading: null
serves:
  - strategy-explicit-intent
recovers: []
clarifications:
  - question: Is the attributes.traditions rename mechanical (drift review, 2026-08-30)?
    answer: "No — the park reason records the measured counter-case. (Recorded
      2026-08-30 /align-tactics tactic-target drift review; measured baseline
      for this tactic's scope, so a later session does not re-derive it.) On
      origin/main: the new spelling exists on 2 content nodes only
      (virtue-right-livelihood, virtue-knowledge-as-gift) plus the
      kind-tradition spec and this tactic; 10 nodes still carry legacy
      attributes.traditions; 9 files still carry the interim stamp vocabulary
      (delegated-pending-review / delegated-review-declined) —
      delegation-anthropic-claude, kind-virtue, strategy-explicit-intent,
      strategy-graph-mounts, strategy-graph-review-curriculum,
      tactic-align-indifference-option, tactic-keystone-decomposition-reorg,
      tactic-node-review-skill, and this node itself. Code support is zero: grep
      for substantiated_by / contradicted_by across packages/intentionsutil/src
      and scripts returns nothing, so the locus clarification's \"validate-graph
      enforces the mirror\" is aspirational and this tactic is its only carrier.
      Rule numbering: the highest landed validateGraph rule is 23
      (checkAttributesShadowing, wired at
      packages/intentionsutil/src/schema.ts:1884);
      tactic-supersession-edge-and-terminal claims 23 and 24 and has NOT landed,
      so the mirror rule must take a fresh unclaimed number checked at
      implementation time — rule numbers are never reused."
  - question: Is the validate-graph mirror check enforceable against today's
      tradition records?
    answer: "(Recorded 2026-08-30 /align-tactics tactic-target drift review;
      observation about this tactic's scope item (3), not a gate on it.) The
      mirror check this tactic lands is not enforceable against tradition
      records as they are shaped today. attributes.adopted / diverged /
      chosen_over entries are free-form prose strings, and they name the graph
      locus inconsistently: tradition-buddhism's adopted entry names
      virtue-right-livelihood explicitly, while tradition-stoicism's two adopted
      entries name strategy-exercise-recovery-paths in one and no locus at all
      in the other. Enforcing \"edge without matching record entry, or vice
      versa, fails\" therefore requires either an id-substring convention on
      entry text or a structural change to the entries, plus a grandfather
      baseline for pre-existing violations — the prose-ref-baseline.json /
      plan-body-baseline.json rollout pattern at
      packages/intentionsutil/scripts/validate-graph.ts and
      packages/intentionsutil/src/planlint.ts is the reusable precedent.
      Mount-record shape and lint mechanics are delegated to Claude under the
      2026-08-30 resolution round, so this is Claude's to settle by greenfield
      merit in the plan, not an author gate."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Requirement ambiguity in scope item (1), for author ratification: this
    tactic's body calls itself \"the mechanical carry\" of the author-ratified
    symmetric-edge doctrine, but the rename it prescribes is not mechanical
    against the graph as it stands. Measured on origin/main, 10 nodes carry
    legacy attributes.traditions as a bare tradition-id list meaning
    \"traditions engaged here\", and at least one pointer inverts under the
    doctrine: virtue-philosophical-mobility.md:118-123 lists tradition-stoicism,
    whose record is origin: declined with no adopted entry naming that virtue
    and a diverged entry contradicting it by name (\"detachment as telos —
    mobility is recoverability, not retention\"). Renaming that pointer to
    substantiated_by would assert on a virtue node the opposite of what the
    mount record says — a doctrine-bearing edge written at the capture model's
    steepest position price. Proposed clarification for ratification: the
    migration disposes each (node, tradition) pair against the mount record —
    substantiated_by where an adopted entry names the locus, contradicted_by
    where a diverged/chosen_over entry does, dropped where neither does —
    instead of renaming the field wholesale; and the author confirms whether
    Claude may exercise that per-pair disposition under the standing
    greenfield-merit delegation with a deferred stamp, or whether the
    virtue-layer pairs are author-owned. Scope items (2), (3) and (4) are
    unaffected and plannable once this is settled. Two secondary notes recorded
    on this node's clarifications rather than acted on: the mirror check is not
    enforceable against today's free-form tradition-record entries without an id
    convention or a grandfather baseline (delegated, Claude's to settle in the
    plan), and the mirror rule needs a fresh validateGraph rule number since 23
    is taken on main and the unlanded tactic-supersession-edge-and-terminal
    claims 23 and 24. Separately, a record-completeness note for the serving
    strategy that this per-node session cannot write: strategy-explicit-intent's
    condition 4 still names /align-audit as the home of the standing-conditions
    sweep, a home the 2026-08-30 resolution round ordered deprecated and removed
    (tactic-align-audit-retirement, still status: raw, skill file still live and
    unmarked at .claude/skills/align-audit/SKILL.md). That staleness does not
    gate this node's plan; it wants a strategy-target round or an /exetasis
    sitting. Recommend: rule on the per-pair disposition — ratify the proposed
    rule (substantiated_by where an adopted entry names the locus,
    contradicted_by where a diverged/chosen_over entry does, dropped where
    neither does), or claim the virtue-layer pairs as author-owned — then re-run
    /align-tactics tactic-substantiation-edge-migration."
  since: 2026-08-30
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate the graph to the symmetric substantiation edges — attributes.traditions → substantiated_by, contradicted_by edges added from rationale prose, validate-graph mirror enforcement, and the stamp vocabulary sweep (old state names → ratified/deferred/delegated)

## Parked 2026-08-30 — the rename premise is disputed, not the doctrine

The symmetric-edge doctrine itself is author-ratified and unchallenged. What the
drift review measured (and this session independently re-verified) is that scope
item (1) — "rename attributes.traditions → substantiated_by on every bearer" —
is not the mechanical carry the rationale calls it. The legacy field records
traditions ENGAGED at a node, not traditions substantiating it. Counter-case,
verified at origin/main f8a337cf: virtue-philosophical-mobility lists
tradition-stoicism, whose record is origin: declined, has no adopted entry
naming that virtue, and carries a diverged entry contradicting it by name
("detachment as telos — mobility is recoverability, not retention"). A wholesale
rename would write substantiated_by asserting the opposite of the mount record,
on a virtue node — the capture model's steepest position.

The office_hours reason carries the proposed per-pair disposition rule for
ratification; the two clarifications on this node carry the measured migration
baseline and the mirror-check enforceability observation (id-extraction
convention + grandfather baseline + fresh validateGraph rule number — 23 is
taken on main and the unlanded tactic-supersession-edge-and-terminal claims 23
and 24). Scope items (2), (3), (4) are unaffected and plannable once the rule
is ruled.
