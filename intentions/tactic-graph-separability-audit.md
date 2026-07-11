---
id: tactic-graph-separability-audit
kind: tactic
statement: Audit separability — enumerate what breaks when the intention-graph
  data structure is used without the harness, and track each gap as work
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-07 interview: 'use it with your own project
  management and agentic workflows' was recorded as a direction stated honestly,
  not a current-capability claim, with known separability gaps to become draft
  tactics under the strategy. This audit is where those gaps get enumerated."
reading: null
gap: null
serves:
  - strategy-data-structure-first
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-graph-separability-audit
  pr: 2828
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Audit separability — enumerate what breaks when the intention-graph data structure is used without the harness, and track each gap as work

## Context

strategy-data-structure-first positions the intention graph as a data
structure a reader can adopt with their own project management and agentic
workflows. The interview recorded "use it with your own workflows" as a
**direction stated honestly**, not a current-capability claim: the tooling
assumes this repo's layout and the skills assume the harness, so there are real
separability gaps between the claim and the code. This audit makes the honesty
operational — it enumerates, with evidence, what breaks when the graph data
structure and its tooling (`packages/intentionsutil`) are used **without** the
dispatch harness, so the README (tactic-readme-data-structure-first) can state
standalone use as direction rather than capability, and so each confirmed gap
is tracked rather than denied in copy.

This is **off the minimum signal path** for the strategy's round: it does not
produce the strategy's reading (owner review of the README does). It carries no
`validates` edge. It runs as ordinary tracked work; calculated attention
demotes it relative to the on-path README rewrite.

## Unit 1 — Enumerate the separability gaps into an audit document

**Recommended model:** opus. The audit requires reading across
`packages/intentionsutil` (source, scripts, `SCHEMA.md`), the `graph-commit`
tooling, and the align skill family, and judging what constitutes a genuine
separability gap for a standalone adopter versus a harness-only concern. That
is cross-cutting architectural judgment, not a mechanical sweep.

**Scope — deliverable:** a new markdown audit document at
`packages/intentionsutil/SEPARABILITY.md` (the package is the standalone-
consumable unit, so the audit lives with it). The document enumerates each
confirmed gap with:

- a short name and a one-line statement of what breaks;
- `path:line` evidence anchoring the coupling in the code;
- the standalone adopter's expectation it violates;
- a severity/blocker note (does this **prevent** standalone use, or merely
  degrade it?).

**Scope — areas to investigate (candidate gaps surfaced in the interview,
each to be confirmed or dismissed with evidence):**

- **`packages/intentionsutil` layout assumptions** — the store and scripts
  resolve the `intentions/` directory relative to the package/script location
  (e.g. `write-node.ts` computes `repoRoot` as three dirs up from the script
  and joins `intentions/`). Enumerate every assumption that the graph lives at
  `<repo-root>/intentions/` and that the package sits at
  `packages/intentionsutil/`, and what a consumer with a different layout must
  override.
- **`graph-commit` CI coupling** — `graph-commit` stamps the repo's `graph/**`
  branch-protection fast path and expects this repo's required checks. A
  consumer repo has neither the ruleset nor the workflow. Enumerate what
  `graph-commit` assumes about the hosting repo's CI/branch protection.
- **align skill family harness assumptions** — the align skills assume
  worktrees, `phase`/`execution` fields, and router semantics. Separate what a
  standalone adopter actually needs (schema + `validate-graph` + `write-node` +
  an interview pattern) from what only the dispatch harness needs.
- **Documentation sufficiency** — assess whether
  `packages/intentionsutil/SCHEMA.md` alone lets an adopter author a valid
  graph with no harness context, or what it is missing.

**Scope — out of scope (important):**

- **No code changes.** This tactic only *enumerates* gaps; it does not fix any
  coupling, refactor `intentionsutil`, or decouple anything.
- **No graph-node authoring.** The interview's "each confirmed gap becomes its
  own tactic" is a **future `/align-tactics` round** on
  strategy-data-structure-first, driven by reading this audit — it is **not**
  part of this tactic's implement phase. Do not create `tactic-*.md` nodes
  here; the deliverable is the audit document only.
- No changes to README, landing, or brand surfaces.

**Reuse:** `packages/intentionsutil/SCHEMA.md` (the existing schema doc — the
audit assesses its sufficiency and cites it), `packages/intentionsutil/src/`
and `packages/intentionsutil/scripts/` (the code whose coupling is being
audited; cite by `path:line`). No new dependencies.

## Verification

Prose — the deliverable is an enumeration, not runnable behavior:

- `packages/intentionsutil/SEPARABILITY.md` exists and lists each confirmed gap
  with `path:line` evidence and a blocker/degrade severity note.
- Every candidate area above is either confirmed as a gap (with evidence) or
  explicitly dismissed (with the reason it is not a standalone blocker).
- No source file under `packages/intentionsutil/src` or `scripts` is modified
  (audit makes no code changes); no `intentions/*.md` node is created.

Acceptance is a documentation review — there is no automated signal for the
audit's completeness.
