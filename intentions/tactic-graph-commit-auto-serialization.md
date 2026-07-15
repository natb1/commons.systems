---
id: tactic-graph-commit-auto-serialization
kind: tactic
statement: "graph-commit serializes contended node edits automatically:
  structural field-level merge, auto re-read/re-apply on stale base, scoped
  model reconciliation; only true conflicts park"
owner: ai
status: raw
parent: null
rationale: "Tooling byproduct of the 2026-07-13 automatic-serialization
  interview on strategy-graph-native-dispatch: implements the amended contention
  doctrine (resolution ladder, true-conflict-only parks) in graph-commit and its
  callers."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# graph-commit serializes contended node edits automatically: structural field-level merge, auto re-read/re-apply on stale base, scoped model reconciliation; only true conflicts park

**Draft** — tooling byproduct of the 2026-07-13 automatic-serialization
interview (see that date's clarification on `strategy-graph-native-dispatch`,
the doctrine this implements); input to a later `/align-tactics
strategy-graph-native-dispatch` round.

## Resolution ladder (the contract)

Replace graph-commit's fail-closed conflict path (land() mapping any rebase
CONFLICT to an office_hours park, `packages/intentionsutil/scripts/graph-commit`)
with an ordered ladder; each layer runs only when the one above could not
resolve:

1. **git three-way auto-merge** — the existing `pull --rebase` loop;
   non-overlapping edits land as today. Unchanged.
2. **Structural field-level merge** — on a textual CONFLICT, parse both sides'
   frontmatter (store.ts read semantics) and merge by field: list appends
   union (both writers' clarifications/conditions land), edits to distinct
   fields combine, identical edits collapse. Script tooling, no model.
3. **Stale-base auto re-read/re-apply** — a `--base` mismatch stops being
   `die "re-read the node and retry"`: the tool re-reads fresh origin/main,
   re-applies this writer's field-level delta (computed base→intended), and
   re-enters the ladder. The 2026-07-06 near-miss guard (silent semantic
   clobber without textual conflict) survives as automatic re-application.
4. **Scoped model reconciliation** — surviving same-scalar-field divergence
   goes to a model evaluation (fix-conflicts shape: resolve or escalate).
   Scope guard: on human-owned doctrine fields (virtue/strategy/tradition/
   delegation statement, rationale, clarification text) the model resolves
   only mechanical divergence — subsumption, reordering, same intent
   differently worded — never synthesizing new substance; genuine doctrine
   divergence skips to layer 5. Full reconciliation on ai-owned tactic
   content and state fields (phase, office_hours, execution).
5. **True-conflict park** — contrary author intentions the model cannot
   reconcile: office_hours park carrying BOTH divergent values plus a
   recommendation (condition 6; coordinate with
   `tactic-graph-commit-park-context`, whose park-content findings apply to
   this now-narrower park surface).

Callers get a structured exit contract: landed / landed-after-resolution /
parked-true-conflict — no exit asks the author to merge.

## Reuse

- `packages/intentionsutil/scripts/graph-commit` — `try_land`/`land`/
  `park_write`/`snapshot`/`--base` machinery; the ladder extends, not
  replaces, the rebase-retry loop.
- `packages/intentionsutil/src/store.ts` (`readNode`/`writeNode`) for
  field-level parse/serialize in layer 2/3.
- `.claude/skills/fix-conflicts/SKILL.md` — the resolve-or-escalate shape
  layer 4 mirrors.
- `park-node` primitive for the layer-5 recommendation-bearing park write.

## Out of scope

Claim-ledger narrowing is `tactic-claim-dedup-only`. Park-record content
quality is `tactic-graph-commit-park-context`.
