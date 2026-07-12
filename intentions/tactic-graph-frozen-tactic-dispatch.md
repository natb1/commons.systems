---
id: tactic-graph-frozen-tactic-dispatch
kind: tactic
statement: "frozen-node dispatch: the selector ranks and selects frozen nodes
  (draft/raw + soft-frozen), resolves a strategy entry to its highest-ranked
  frozen descendant with a progression-ordinal tiebreak, claims the resolved
  node, and routes it to /align-tactics <node-id>; /align-tactics is extended to
  accept a tactic target"
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-11 /align-strategy interview recording the
  frozen-tactic-dispatch clarification (clarification 52) on
  strategy-graph-native-dispatch. Implements the selector + /align-tactics
  changes that make a frozen tactic ranked, selectable, and self-decomposing.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 4
  override: null
  rationale: "Author-directed 2026-07-11: top-ranks this draft above every
    existing tactic (current max authored 8) so it decomposes first once
    /align-tactics runs — own boost 4 added to strategy-graph-native-dispatch's
    inherited boost 5 resolves to authored 9. Companion nodes
    tactic-graph-phase-launch-per-phase,
    tactic-review-phase-trust-builtin-review, and
    tactic-graph-frozen-tactic-dispatch were boosted together in the same round
    to the same tier."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# frozen-node dispatch: the selector ranks and selects frozen nodes (draft/raw + soft-frozen), resolves a strategy entry to its highest-ranked frozen descendant with a progression-ordinal tiebreak, claims the resolved node, and routes it to /align-tactics <node-id>; /align-tactics is extended to accept a tactic target

> Draft context retained by `/align-strategy` on 2026-07-11 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

`strategy-graph-native-dispatch` clarification 52 (2026-07-11) makes a **frozen
node** — a draft/raw tactic (never decomposed) or a soft-frozen tactic (a
planned tactic whose strategy substance fingerprint changed, clarification 10)
— first-class: ranked by calculated attention like any node (clarification 11,
derived at read time regardless of phase) and **selectable**. Selecting one runs
`/align-tactics <node-id>` to decompose (draft) or re-plan (soft-frozen) it.
Today the selector excludes frozen nodes (`tactic-graph-native-dispatch` §3.1: a
tactic is eligible only for its phase skill, and only when `phase` is neither
`draft` nor `done`), and `/align-tactics` accepts a **strategy** target only
("never selects its own target"; "the sole argument is the id of the strategy").

## Scope (to be decomposed by /align-tactics)

- **Selector: frozen-node eligibility.** A frozen node (draft/raw tactic, or a
  soft-frozen tactic — fingerprint mismatch per clarification 10) with
  `office_hours` null and `blocked_by` satisfied is eligible for an
  `/align-tactics` session — parallel to the existing strategy eligibility
  (`tactic-graph-native-dispatch` §3.1, which this unit reconciles). Draft tactics
  stay non-blocking for their strategy's own `/align-tactics` eligibility
  (clarification 9 amendment) — the new eligibility is an additive selection path,
  not a change to the blocking rule.
- **Selector: strategy-entry resolution.** A strategy is selectable when it has
  frozen descendants (or is itself undecomposed — zero-tactic initial
  decomposition). Selecting a strategy **descends to the highest-ranked frozen
  node in its subtree** and runs `/align-tactics` on that node. A frozen tactic
  may outrank its parent strategy and be selected directly. A zero-tactic
  strategy resolves to itself → `/align-tactics <strategy-id>` (unchanged).
- **Selector: progression-ordinal tiebreak.** When calculated attention
  (clarification 11) ties, prefer the **more-progressed** node by the phase
  ordinal `draft < align-tactics < implement < fix < qa < review < main-qa <
  done` (review outranks implement; a concrete child tactic outranks its abstract
  parent strategy). Applies generally to selection ties, not only frozen-node
  resolution — finish in-flight work before opening new.
- **Claiming keyed on the resolved node.** The claim / worktree / reservation is
  keyed by the node `/align-tactics` actually runs on (the resolved
  highest-ranked frozen node), not the selection entry — so a strategy-entry and
  a direct-tactic selection landing on the same node dedupe via the uniform
  node-id live-session/worktree rule (clarification 13).
- **`/align-tactics` accepts a tactic target.** Extend the skill (Step 0 target
  resolution, drift review, decompose-to-signal, plan/park, `graph-commit`) to a
  `tactic-<slug>` argument that decomposes/re-plans a frozen tactic into its
  sub-tactic subtree or a planned phase — the decomposition-skill analog of
  `[[tactic-phase-skill-node-targets]]` re-keying the execution phase skills for
  node targets. Preserve autonomous, never-`AskUserQuestion` behavior.

## Reconciliation owed

- `tactic-graph-native-dispatch` §3.1 eligibility and the §"directive per node"
  line (`/align-tactics <id>` for a strategy, phase skill for a tactic) — extend
  to: `/align-tactics <id>` for a strategy OR a frozen tactic; phase skill for a
  planned tactic. `/align-tactics` decomposing this node must amend that spec.
