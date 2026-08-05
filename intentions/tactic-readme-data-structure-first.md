---
id: tactic-readme-data-structure-first
kind: tactic
statement: Rewrite README.md around the data-structure-first framing — new
  headline, intention graph leading, harness as one consumer
owner: ai
status: codified
parent: null
rationale: "The immediate deliverable of the 2026-07-07 /align-strategy
  interview that recorded strategy-data-structure-first: the current README
  headline ('a long-horizon agent orchestrator') is harness-first and must
  invert. Retained as a draft for /align-tactics; the interview's copy
  constraints are carried in the node body."
reading: null
gap: null
serves:
  - strategy-data-structure-first
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-data-structure-first
blocked_by:
  - tactic-readme-copy-approval
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Ratified README copy — re-plan against the 2026-08-04 record

Demoted to draft 2026-08-04: the prior plan implemented the superseded
2026-07-25 copy and README structure. The next /align-tactics round
re-plans this tactic against strategy-data-structure-first's 2026-08-04
clarifications (five sections, target-state doctrine, guard, references
governance) and the ratified copy below, reproduced exactly — the only
permitted pre-publication changes are resolving the reference details
still flagged unverified at tactic-readme-reference-curriculum.

---

# commons.systems

**A data structure for managing project goals and alignment. An agentic
harness that runs on it.**

The **intention graph** is a versioned graph of goals. It is human authored
with AI assistance. The graph is rooted by unconditional *virtues*
(your virtues, your principles) with condition-bearing, persistent
*strategies* as child nodes, and completable, transient *tactics* at the leaves.
The graph is encoded as markdown documents in the repo it governs.
It is AI-native specification tracking — it is designed with AI in mind both:
- as a first-class consumer
- to enable specification tracking at a level of detail not feasible with
  legacy technology.

The intention graph builds on legacy software documentation — such as
architectural decision records — and contemporary methods such as
spec-driven development. It maintains the context
of the *why* for every *what* at a level of specificity not feasible
except with AI. The result is alignment for longer horizon tasks —
alignment between team members, collaborators, and AI.

In addition to the graph, this repo contains a reference harness that
operates on the graph to manage context and orchestrate long horizon
agentic workflows. The harness coordinates between:
- agent activities, the "dispatch" queue: coding, planning,
  documenting, monitoring, sensor-based alignment
- human activities, the "office hours" queue: refining requirements,
  recording knowledge, resolving escalations

## Runbook

Get from idea to a recorded strategy in your own repo:

1. **Install the skills as a plugin.** Add this repo as a Claude Code plugin
   in your own project — the align skill family and the graph tooling come
   with it.
2. **Run `/mount`.** The mounting skill bootstraps your graph:
   it orients you in the data structure (virtues, strategies, tactics,
   delegations), probes what you already believe about goals and alignment,
   and teaches the load-bearing concepts using the same methods the
   graph itself is maintained by. Mechanically, it creates your own
   `intentions/` graph — your virtue roots, your first nodes — and mounts this
   repo's graph as a **delegatee**: a recorded delegation with audited
   divergence and reversibility. Everything you take
   on trust from this project enrolls in your own review curriculum as
   born-parked review items, so all dependencies are tracked and managed.
3. **Run `/align <directive>`.** The mounting skill converges on a
   directive in your own words; `/align` records it as your first strategy
   under interview, and the graph is live.

## Technical summary

One markdown file per node under [`intentions/`](intentions/); the schema is
declared by the graph's own kind nodes —
[`intentions/kind-kind.md`](intentions/kind-kind.md) is the entry point, and
drift between code and kind nodes is a guarded defect. Tooling lives in
[`packages/intentionsutil/`](packages/intentionsutil/).

- **Virtues** are unconditional dispositions — the roots. Virtues serve
  as principles that are fed forward through all graph operations.
  **Strategies** carry the conditions they are contingent on and a
  `success_signal` (observable, sensor, threshold); sensors
  are a feedback mechanism, and a validated signal
  quiets the strategy until a condition or reading changes. **Tactics** are
  PR-sized, completable, and pruned on completion. **Delegations** record
  external attachments with divergence and irreversibility axes; external
  graphs **mount** recursively, with auditable capture and deference.
- **Attention** is authored injection (`boost`/`override`, each with a
  rationale); rank is derived on read, never stored, and is the router's
  outermost ordering axis. Escalating work means authoring a boost.
- **The dispatch router** is a headless, self-perpetuating tick — bash plus
  systemd transient units, no model in the control loop; model tokens are
  spent on work, never on deciding to work. Each tick selects the
  highest-rank eligible node and spawns one bounded agent session per
  selection into an isolated worktree. Work advances through phases — plan,
  implement, qa, review, merge, qa-main — with interventions invoked
  when there is a variance in node progression.
- **Two queues** route every item: autonomous dispatch, and human office
  hours. Parking is first-class node state; success requires a positive
  completion marker, and any failed intervention fails safe to a
  human park.
- **The interview is the audit.** Strategies enter the graph through an
  interview (`/align`); every resolution lands as a dated
  clarification on the node, so provenance is append-only and legible.

## References

The design descends from and differentiates against several bodies of work.

**Harness engineering** — the vocabulary for everything around the model:

- Birgitta Böckeler, ["Harness engineering for coding agent
  users"](https://martinfowler.com/articles/harness-engineering.html)
  (martinfowler.com, 02 Apr 2026) — the Model + Harness split and the
  guides/sensors taxonomy this repo's rules and CI/reviewer fan-out map onto.
- Anthropic, ["Effective harnesses for long-running
  agents"](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
  (26 Nov 2025) — bounded sessions with no memory, state carried in a durable
  on-disk artifact; its one-file progress log is a degenerate intention graph.
- Anthropic, ["Harness design for long-running application
  development"](https://www.anthropic.com/engineering/harness-design-long-running-apps)
  (24 Mar 2026) — the generator/evaluator finding (models praise their own
  mediocre work) that justifies QA and review as separate sessions.
- OpenAI, ["Harness engineering: leveraging Codex in an agent-first
  world"](https://openai.com/index/harness-engineering/) (11 Feb 2026) —
  "manually writing code was treated as a failure mode": the sharpest
  statement of the posture this repo takes.
- Addy Osmani, ["Agent Harness
  Engineering"](https://www.oreilly.com/radar/agent-harness-engineering/)
  (O'Reilly Radar, 15 May 2026) — most agent failures are harness
  configuration, not model limits; names *the ratchet* (every mistake becomes
  a rule), the practice Mitchell Hashimoto demonstrates in ["My AI Adoption
  Journey"](https://mitchellh.com/writing/my-ai-adoption-journey) (05 Feb
  2026) and this repo implements as rule and skill edits fed by review.

**Spec-driven development** — the adjacent mainstream; the graph differs on
hierarchy, state, and scheduling, not on spec persistence:

- GitHub, [Spec Kit](https://github.com/github/spec-kit) (Sep 2025) — the
  category-defining `/specify → /plan → /tasks → /implement` workflow; one
  durable layer above the feature (a "constitution"), no goal hierarchy, no
  signals, nothing a scheduler can rank.
- Amazon, [Kiro](https://kiro.dev) (Jul 2025) — the largest commercial SDD
  bet; steering files are shared context, not a governed goal hierarchy.
- Fission AI, [OpenSpec](https://github.com/Fission-AI/OpenSpec) (Aug 2025) —
  ephemeral by design (propose → apply → archive), the explicit counterpoint
  to a persistent graph.
- BMad Code, [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
  (Apr 2025) — persistent PRD/architecture/story artifacts across the SDLC;
  role-based agents producing documents, not a typed graph with edges and
  attention.
- Tessl, [spec registry and framework](https://tessl.io) (Sep 2025) — specs
  as versioned dependencies; describes what correct code does, not what
  should be worked on next and why.
- Sean Grove (OpenAI), ["The New
  Code"](https://www.youtube.com/watch?v=BIvILtt164I) (AI Engineer World's
  Fair, Jun 2025) — code as "a lossy projection from the specification"; the
  motivation for durable versioned intent, without a structure for it.

**AI-native work tracking** — incumbents attach agents to human-first
schemas; the graph *is* the work item:

- GitHub, [Agent HQ](https://github.blog/news-insights/company-news/welcome-home-agents/)
  (Oct 2025) — mission control over many agents, all still anchored to the
  Issue as the atomic unit: the architecture this project migrated off.
- Linear, [Linear Agent](https://linear.app/docs/linear-agent) (2026) — the
  agent as a special assignee type in an otherwise human-first schema.
- Atlassian, [Rovo agents in
  Jira](https://www.atlassian.com/blog/rovo/ai-agents-in-jira) (Feb 2026) —
  its Teamwork Graph *indexes* work that exists elsewhere; the intention
  graph *is* the work.
- [Hiveship](https://hiveship.app/) (2026) — "issue tracking, rebuilt for the
  agent era"; the same agent-first positioning over a conventional flat issue
  schema in a proprietary store — the differentiation is mechanism, not
  adjective.

**Goal-oriented requirements engineering** — the academic ancestor; the
refinement hierarchy is a solved, named structure, and this project says so:

- Dardenne, van Lamsweerde & Fickas, ["Goal-directed requirements
  acquisition"](https://www.sciencedirect.com/science/article/pii/016764239390021G)
  (*Sci. Comput. Program.* 20, 1993) — KAOS: goals AND/OR-refined until
  assignable to an agent; the strategy → tactic pattern, thirty-three years
  earlier.
- van Lamsweerde, ["Goal-Oriented Requirements Engineering: A Guided
  Tour"](https://webperso.info.ucl.ac.be/~avl/files/RE01.pdf) (RE'01) — why
  goals anchor completeness, traceability, and conflict management; and
  *Requirements Engineering* (Wiley, 2009), whose obstacle analysis is the
  precedent for strategy conditions — analyzed at design time there, held
  open and re-read at runtime here.
- Yu, ["Towards Modelling and Reasoning Support for Early-Phase Requirements
  Engineering"](https://ieeexplore.ieee.org/document/566873) (RE'97) — i*:
  hard goals vs. satisficed softgoals, the precursor of signal/gap semantics;
  with Chung, Nixon & Mylopoulos, *Non-Functional Requirements in Software
  Engineering* (Kluwer, 2000) formalizing graded satisfaction. There the
  labels are analyst-assigned; here a sensor reading drives the gap.
- Yu & Zhao, ["4D-ARE: Bridging the Attribution Gap in LLM Agent Requirements
  Engineering"](https://arxiv.org/abs/2601.04556) (2026) — GORE assumed
  deterministic agents; the probabilistic-agent gap this design occupies.
- What the graph adds to that lineage: agent-executable rather than
  analysis-only; versioned in the working repo beside the code it governs;
  authored attention with derived rank; a live sensor/reading loop; dated
  interview provenance; and a completable, pruned tactic layer.

**Agent memory and context engineering** — the contrast category: those
systems machine-extract *descriptive recall* of what happened; the intention
graph is human-authored and *prescriptive* about what should happen:

- Edge et al., ["From Local to Global: A Graph RAG
  Approach"](https://arxiv.org/abs/2404.16130) (2024); Packer et al.,
  ["MemGPT"](https://arxiv.org/abs/2310.08560) (2023); Rasmussen et al.,
  ["Zep: A Temporal Knowledge Graph Architecture for Agent
  Memory"](https://arxiv.org/abs/2501.13956) (2025) — extracted graphs and
  tiered memory over data that already exists.
- Mei et al., ["A Survey of Context Engineering for Large Language
  Models"](https://arxiv.org/abs/2507.13334) (2025) and Anthropic,
  ["Effective context engineering for AI
  agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  (Sep 2025) — the per-turn context assembly discipline; the graph is the
  durable artifact just-in-time retrieval reads *from*.

**Long-horizon reliability** — why a leave-it-alone workflow needs sensors:

- METR, ["Measuring AI Ability to Complete Long Software
  Tasks"](https://arxiv.org/abs/2503.14499) (2025) and ["Time Horizon
  1.1"](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (Jan 2026) — task
  horizons doubling every ~3–4 months, and accelerating.
- Sinha et al., ["The Illusion of Diminishing
  Returns"](https://arxiv.org/abs/2509.09677) (2025) — long-task failure is
  execution slips, not reasoning gaps, and models self-condition on their own
  errors: the case for bounded fresh-context sessions.
- Khanal et al., ["Beyond pass@1: A Reliability Science Framework for
  Long-Horizon LLM Agents"](https://arxiv.org/abs/2603.29231) (2026) —
  reliability decay is worst in software engineering, and memory scaffolds
  universally hurt long-horizon performance — a finding this design confronts
  rather than omits: the graph is not an in-context scaffold; it is read
  just-in-time, per bounded session.
- Orlanski et al., ["SlopCodeBench"](https://arxiv.org/abs/2603.24755) (v2,
  May 2026) — structural erosion and verbosity growth across iterative edits;
  guidance alone does not prevent degradation, which is why the sensors are
  separate sessions.
- Cemri et al., ["Why Do Multi-Agent LLM Systems Fail?"
  (MAST)](https://arxiv.org/abs/2503.13657) (2025) — the failure taxonomy the
  review/QA fan-out phases exist to cover.

## License

[CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Forking is
encouraged.
