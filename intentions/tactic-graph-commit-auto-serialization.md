---
id: tactic-graph-commit-auto-serialization
kind: tactic
statement: "graph-commit auto-serializes mechanical contention (ladder layers
  1-3): structural field-level merge, stale-base auto re-read/re-apply,
  structured mechanical-unresolved exit; model layers are dispatch-conflict's"
owner: ai
status: raw
parent: null
rationale: "Tooling byproduct of the 2026-07-13 automatic-serialization
  interview on strategy-graph-native-dispatch (clarification 58), narrowed
  2026-07-19 by the partition clarification 78: this tactic owns the ladder's
  deterministic mechanical layers 1-3 inside graph-commit the script, exiting
  mechanical-unresolved for the model layers 4-5 owned by
  tactic-dispatch-conflict-greenfield. Parked and cleared 2026-07-19 (two-draft
  collision, resolved by the ratified partition)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 64
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18), following
    the office-hours drain of tactic-review-sitting-skill-generalization (PR
    #2871): that node's needs-main residue was silently dropped by park-node
    reading a stale local checkout (the writer never re-reads origin/main), and
    graph-commit rebased the residue-less body onto main with no textual
    conflict — a genuine instance of exactly the auto-serialization gap this
    node tracks (stale-base re-apply, not a true conflict, should not silently
    clobber). Author will /align-tactics this node in a separate session. Sized
    against the composed selector rank (childless, empty blocked_by: rank =
    boost + 5.33; current max 68.33 on tactic-fix-interrupt-orthogonal-state at
    boost 63), so boost 64 gives 69.33 — strictly top of the selector frontier,
    verified via select-targets. The boost flows nowhere else (no blocked_by, no
    children). Reconfirmed 2026-07-19: still boost 64 / rank 69.33, verified top
    of the actually-selectable candidates against origin/main 9e376105 (412+
    nodes; tactic-align-tactics-workflow was separately boosted to a nominal 75
    the same day, but it is phase:implement and blocked_by
    tactic-align-family-opus-default (still in merge-ready-hold), so it is
    excluded from the candidates list and does not displace this node from #1).
    No boost change made -- already sufficient. Second live incident of the
    tracked gap the same day: an /align-tactics session's trivial office_hours
    wording edit on tactic-dispatch-conflict-greenfield raced a
    concurrently-landing /align-strategy ratification (clarification 78) and
    lost -- graph-commit's rebase hit a textual CONFLICT on the same node and
    fell through to the fail-closed park path, clobbering the just-ratified
    clean office_hours state with the generic 'concurrent-edit conflict' message
    until a manual follow-up commit (d6d371ba) cleared it. Exactly this node's
    layer-3 gap (stale-base auto re-read/re-apply): a fresh re-read would have
    shown the losing writer's delta moot and landed cleanly with no park at all.
    Author will /align-tactics this node in a separate session."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "graph-commit: concurrent-edit conflict — manual merge needed"
  since: 2026-07-19
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit auto-serializes mechanical contention (ladder layers 1-3): structural field-level merge, stale-base auto re-read/re-apply, structured mechanical-unresolved exit; model layers are dispatch-conflict's

**Draft** — narrowed 2026-07-19 by the partition clarification (#78) on
`strategy-graph-native-dispatch`, ratified at the office-hours review that
cleared this node's 2026-07-19 park: this tactic owns the resolution ladder's
deterministic mechanical layers 1-3; layers 4-5 (scoped model reconciliation,
true-conflict park) belong to `tactic-dispatch-conflict-greenfield`, which is
`blocked_by` this tactic. Input to a later `/align-tactics` finalize.

## Scope — the mechanical layers (the contract)

Replace graph-commit's fail-closed conflict path (`land()` mapping any rebase
CONFLICT to an office_hours park, `packages/intentionsutil/scripts/graph-commit`)
with the deterministic half of the ladder; each layer runs only when the one
above could not resolve:

1. **git three-way auto-merge** — the existing `pull --rebase` loop;
   non-overlapping edits land as today. Unchanged.
2. **Structural field-level merge** — on a textual CONFLICT, parse both sides'
   frontmatter (store.ts read semantics) and merge by field: list appends
   union (both writers' clarifications/conditions land), edits to distinct
   fields combine, identical edits collapse. Net-new: no merge/field-union
   helper exists in `packages/intentionsutil/src`; real code plus
   `test-graph-commit.sh` cases.
3. **Stale-base auto re-read/re-apply** — a `--base` mismatch stops being
   `die "re-read the node and retry"`: the tool re-reads fresh origin/main,
   re-applies this writer's field-level delta (computed base→intended), and
   re-enters the ladder. The 2026-07-06 near-miss guard (silent semantic
   clobber without textual conflict) survives as automatic re-application.
   Live instance of the gap: the 2026-07-18 needs-main-residue clobber that
   motivated this node's attention boost — a stale-base re-apply case, not a
   true conflict.

## Structured exit contract (the seam to dispatch-conflict)

Callers get: **landed** / **landed-after-resolution** /
**mechanical-unresolved** / **parked** — no exit asks the author to merge.
`mechanical-unresolved` is the seam: surviving same-scalar-field divergence is
NOT resolved in-script — graph-commit exits with the divergence context and
`dispatch-conflict` (the skill) runs layers 4-5. Until dispatch-conflict
lands, `mechanical-unresolved` falls back to today's office_hours park, now
carrying both divergent values (coordinate with
`tactic-graph-commit-park-context`; `office_hours.recommendation` is a
first-class schema field, so the park carries its recommendation there, not
folded into `reason`).

## Reuse

- `packages/intentionsutil/scripts/graph-commit` — `try_land`/`land`/
  `park_write`/`snapshot`/`--base` machinery; the ladder extends, not
  replaces, the rebase-retry loop.
- `packages/intentionsutil/src/store.ts` (`readNode`/`writeNode`) for
  field-level parse/serialize in layers 2-3.
- `packages/intentionsutil/scripts/test-graph-commit.sh` — the bash harness
  (bare origin + two writer clones) layers 2-3 cases extend.
- `park-node` primitive for the fallback park write.

## Out of scope

- Layers 4-5 — scoped model reconciliation (clarification 58's model scope
  guard) and the true-conflict park decision: `tactic-dispatch-conflict-greenfield`.
- Claim-ledger narrowing: `tactic-claim-dedup-only`.
- Park-record content quality: `tactic-graph-commit-park-context`.
