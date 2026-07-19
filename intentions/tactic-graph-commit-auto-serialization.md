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
    children)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: 'Cannot finalize: this tactic (from the 2026-07-13
    automatic-serialization clarification of strategy-graph-native-dispatch) and
    the newer raw draft tactic-dispatch-conflict-greenfield (2026-07-18
    clarification 67) both target the SAME behavior -- upgrade graph-commit
    park-on-any-conflict so mechanical conflicts auto-resolve and only genuine
    INTENTION conflicts park -- under two incompatible architectures: (a) a
    5-layer resolution ladder built INTO graph-commit the bash script (this
    tactic), versus (b) a graph-native model-driven skill dispatch-conflict
    renamed from /fix-conflicts (the 07-18 draft, whose clarification-67 text
    verbatim describes it as "upgrading today graph-commit-parks-on-any-conflict
    behavior"). Clarification 67 re-derived the conflict-upgrade requirement and
    retained a fresh draft without referencing or reconciling this 07-13 draft
    -- a record-completeness defect of the 07-18 /align-strategy round
    (clarification 31 framing). Finalizing either draft into an implement plan
    would risk building the same resolution logic twice in two vehicles.
    Compounding it: this tactic layer-4 "scoped model reconciliation inside
    graph-commit" is architecturally infeasible as written -- no bash script in
    the repo performs a scoped model eval (verified across packages/**/scripts
    and .claude/skills/**/scripts); model-resolution steps run only as
    SKILL.md-driven subagents in a skill thread (the fix-conflicts opus-subagent
    resolved/ambiguous pattern), so graph-commit the script cannot host layers
    4-5. Which architecture wins, or how the ladder partitions across script and
    skill, is an author design decision -- not something an autonomous finalize
    should pick.'
  since: 2026-07-19
  recommendation: "Reconcile the two conflict-resolution drafts in an
    /align-strategy pass on strategy-graph-native-dispatch and record the
    partition as a clarification, then re-decompose. Recommended greenfield
    partition (per design-proposals rule, uses each vehicle for what it can do):
    graph-commit the SCRIPT owns the deterministic mechanical layers -- git
    three-way auto-merge (already exists), a structural field-level / list-union
    frontmatter merge (net-new: no merge/field-union helper exists anywhere in
    packages/intentionsutil/src, so this is real code + tests in
    test-graph-commit.sh), and stale --base auto re-read/re-apply. The
    dispatch-conflict SKILL (tactic-dispatch-conflict-greenfield) owns layer-4
    model reconciliation (opus subagent, resolved/ambiguous verdict, scope guard
    limiting the model to mechanical divergence on human-owned doctrine fields)
    and layer-5 true-conflict office_hours park, invoked only when the script
    mechanical layers cannot resolve. Concretely: either (1) narrow
    tactic-graph-commit-auto-serialization to layers 1-3 and fold layers 4-5
    into tactic-dispatch-conflict-greenfield, or (2) supersede this tactic
    entirely into tactic-dispatch-conflict-greenfield (prune this one). Also
    note office_hours.recommendation is now a first-class schema field, so the
    07-13 draft references to condition-6 recommendation-in-reason are stale.
    tactic-claim-dedup-only (node-id claiming narrows to scheduling dedup) is
    orthogonal to conflict resolution and is unaffected by this reconciliation."
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
