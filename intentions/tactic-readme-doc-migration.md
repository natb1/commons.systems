---
id: tactic-readme-doc-migration
kind: tactic
statement: Migrate the README's technical documentation — CI/CD workflows and
  requirements, router design, harness framing detail, PR control flow,
  prerequisites — into the bodies of the graph nodes that own those artifacts
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-04 /align README-practitioner round: the
  five-section README structure displaces all technical documentation; per
  strategy-graph-self-description's body-function doctrine (strategy bodies
  carry settled design and mechanism notes), the displaced content lands in the
  owning nodes' bodies, and the README links into the graph."
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
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate README technical documentation into owning graph-node bodies

## Context

The 2026-08-04 round fixes the README at five sections; everything else
migrates into the graph per strategy-graph-self-description's body-function
doctrine (strategy bodies carry settled design and mechanism notes; kind
bodies carry normative schema detail). The README then links into the graph —
the node bodies are the documentation.

## Migration map (refine owners at plan time)

| README content (pre-rewrite) | Destination body |
|---|---|
| "The intention graph" schema tour | already owned by `kind-kind.md` and the kind-* nodes — README links, no migration needed beyond deletion |
| "The align skill family" details | `strategy-graph-native-dispatch` body (align family is its human interface) |
| "The dispatch router" internals + two-queue design | `strategy-graph-native-dispatch` body |
| "As a harness" framing (Böckeler mapping, guides/sensors/steering) | `strategy-data-structure-first` body (positioning material) or compressed into README technical summary only — decide at plan time |
| Design principles | compressed into README technical summary; extended form to `strategy-graph-native-dispatch` body |
| PR control flow table (live implementation) | `strategy-graph-native-dispatch` body (or retired: implementation status does not belong in target-state docs; phases are self-describing in the graph) |
| CI/CD workflows, change detection, script call chain | `strategy-main-health` body (owns the continuously releasable trunk) |
| Pre-requisites | README runbook (compressed) + `strategy-distribute-workflow` body for the full deployment detail |
| "Where to go next" | dropped; links distributed into the five sections |
| Differentiation | absorbed into abstract + references (differentiation-on-mechanism) |
| Status paragraph / migration-period notes | deleted (target-state doctrine) |

## Scope

- README.md: deletion side handled by the readme rewrite tactic
  (tactic-readme-data-structure-first re-planned); this tactic owns the
  destination-body writes and link integrity.
- Node body edits via direct Edit after frontmatter-preserving dump/write —
  bodies are authoritative for their declared function.
- Out of scope: inventing new doc content; only migration and light
  adaptation.

## Verification (sketch)

- Every migrated section reachable from the README technical summary via a
  graph-node link; tactic-readme-graph-guard's CI floor passes on the result.
- No CI/CD or router-internals prose remains in README.md.
