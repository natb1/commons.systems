---
id: tactic-readme-reference-curriculum
kind: tactic
statement: Enroll every README reference — new, preserved, and removed — as
  candidate curriculum chunks with validates edges naming the graph areas each
  reference informs
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-04 /align README-practitioner round: the
  references establish credibility, and the author requires each to be tracked
  in the curriculum frontier with the graph areas it reviews. This node is the
  durable carrier of the 2026-08-04 reference research disposition until
  enrollment lands."
reading: null
gap: null
serves:
  - strategy-data-structure-first
  - strategy-complete-grounding
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
# Enroll README references in the review curriculum

## Context

Author requirement (2026-08-04 round): every README reference — new,
preserved, removed — enrolls in the curriculum frontier, tracking the graph
areas it reviews. Mechanism (endorsed 2026-08-04): each reference becomes a
candidate curriculum chunk (strategy-complete-grounding's machinery,
resolved at /reading-review sittings) with `validates` edges naming the
strategies/kinds whose doctrine it informs; the coverage sensor then reads
which graph areas have unexamined references. Batch-author the chunks when
the README rewrite lands; this body is the durable disposition until then.

## Disposition (2026-08-04 research; per-reference validates targets are
starting judgments, refined at enrollment)

**Preserved (with corrections):**

- Böckeler, Harness engineering for coding agent users (martinfowler.com,
  2026-04-02) → validates: strategy-data-structure-first (harness framing),
  strategy-graph-native-dispatch.
- Anthropic, Effective harnesses for long-running agents (2025-11-26) —
  CORRECTED gloss: initializer/coding-agent + durable progress artifact, the
  closer analogue to the dispatch router; generator/evaluator attribution
  removed → validates: strategy-graph-native-dispatch.
- Anthropic, Harness design for long-running application development
  (2026-03-24) — sole owner of the generator/evaluator attribution →
  validates: strategy-graph-native-dispatch (QA/review as separate sessions).
- OpenAI, Harness engineering (2026-02-11) → validates:
  strategy-data-structure-first (human-stays-in-intent posture).
- Osmani, Agent Harness Engineering (O'Reilly Radar, 2026-05-15) — carries
  the "ratchet" coinage (its own section title); Hashimoto supplies the
  practice → validates: strategy-graph-native-dispatch (rules/skills ratchet).
- Hashimoto, My AI Adoption Journey (2026-02-05) → same area, paired with
  Osmani.
- METR, Measuring AI Ability to Complete Long Software Tasks
  (arXiv:2503.14499) — CORRECTED: cite alongside Time Horizon 1.1
  (metr.org, 2026-01-29; doubling 131d since 2023, 89d since 2024) →
  validates: strategy-data-structure-first (why long-horizon workflows).
- Khanal et al., Beyond pass@1 (arXiv:2603.29231) — strengthen gloss:
  software engineering worst-hit domain; "memory scaffolds universally hurt"
  confronted directly (the graph is not an in-context scaffold; read
  just-in-time per bounded session) → validates:
  strategy-graph-native-dispatch (bounded sessions), kind-tactic (fresh
  clean-session plans).
- Orlanski et al., SlopCodeBench — CORRECTED to v2 (2026-05-07, adds
  Nicholas Roberts; 36 problems/196 checkpoints/14.8% best) → validates:
  strategy-graph-native-dispatch (sensors over guides).

**New (from the 2026-08-04 research report; full citations in README):**

- Spec-driven development: GitHub Spec Kit; Amazon Kiro; OpenSpec (the
  explicitly-ephemeral counterpoint); BMAD-METHOD (persistent-artifacts
  precedent); Tessl (versioned spec registry); Sean Grove, The New Code
  (AI Engineer World's Fair, Jun 2025). Differentiation is hierarchy above
  the feature + execution state in the artifact + attention as scheduler
  input — NOT spec persistence (GitHub's own doctrine says specs persist)
  → validates: strategy-data-structure-first, kind-strategy, kind-tactic.
- AI-native work tracking: GitHub Agent HQ (the migrated-off architecture);
  Linear Agent; Atlassian Rovo/Teamwork Graph ("their graph indexes the
  work; this graph is the work"); Hiveship (same "agent-first" positioning —
  differentiate on mechanism, not adjective) → validates:
  strategy-data-structure-first, strategy-graph-drives-dispatch.
- Goal-oriented RE (the honest ancestry): Dardenne/van Lamsweerde/Fickas
  1993 (KAOS — goal refinement to agent-assignable units = strategy→tactic);
  van Lamsweerde 2001 guided tour; van Lamsweerde 2009 (obstacle analysis =
  precedent for attributes.conditions, design-time there vs runtime-open
  here); Yu 1997 (i* — softgoal satisficing = signal/gap precursor);
  Chung/Nixon/Yu/Mylopoulos 2000 (NFR — graded satisfaction formalized);
  Yu & Zhao 2026 (4D-ARE, arXiv:2601.04556 — GORE assumed deterministic
  agents; author list verified 2026-08-04 against arXiv: Bo Yu and Lei
  Zhao, submitted 8 Jan 2026) → validates:
  kind-strategy, kind-tactic, kind-virtue, strategy-explicit-intent.
  Graph's additions stated honestly: agent-executable, versioned-in-repo,
  authored attention w/ derived rank, live sensor loop, dated dialectic
  provenance, pruned tactic layer.
- Agent memory / context engineering (the contrast: machine-extracted
  descriptive recall vs human-authored prescriptive intent): GraphRAG
  (arXiv:2404.16130); MemGPT (arXiv:2310.08560); Zep (arXiv:2501.13956);
  Mei et al. survey (arXiv:2507.13334); Anthropic, Effective context
  engineering (2025-09-29) → validates: strategy-data-structure-first,
  strategy-graph-native-dispatch (graph as what retrieval reads from).
- Long-horizon reliability additions: METR Time Horizon 1.1; Sinha et al.
  (arXiv:2509.09677 — execution slips + self-conditioning: the case for
  bounded fresh-context sessions); Cemri et al. MAST (arXiv:2503.13657 —
  multi-agent failure taxonomy; fan-out phases) → validates:
  strategy-graph-native-dispatch.

**Removed (enroll once to review the removal):**

- LangChain/Trivedy, Anatomy of an Agent Harness — subsumed by Böckeler +
  Osmani.
- walkinglabs/awesome-harness-engineering — stale (last push 2026-05-22)
  inside a ten-repo fork cluster; "most-referenced" superlative not
  defensible.

**Flagged unverified (resolve before README publication):** Sean Grove talk
exact date (use "Jun 2025"); OpenAI Codex product-page bodies (403 to
automated fetch); Lütke/Karpathy tweets (cite Schmid/LangChain secondaries
instead). Resolved: 4D-ARE author list verified 2026-08-04 (Bo Yu, Lei Zhao).

## Scope

- Author one candidate chunk node per reference (or per tight group where a
  group reviews one graph area), born-parked, validates edges as above.
- Same commit as (or immediately after) the README rewrite landing.
- Out of scope: resolving the chunks (that is /reading-review's job over
  time).

## Verification (sketch)

- Coverage sensor lists every README reference with ≥1 validates target;
  removed references carry a removal-review chunk; validate-graph green.
