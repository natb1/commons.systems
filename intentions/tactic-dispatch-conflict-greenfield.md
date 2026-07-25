---
id: tactic-dispatch-conflict-greenfield
kind: tactic
statement: "Add a graph-native lane to dispatch-conflict (renamed from
  /fix-conflicts by tactic-dispatch-conflict-rename): auto-resolve mechanical
  merge conflicts from existing graph requirements, park only on conflicts
  needing author input on intention"
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview as the
  greenfield state for conflict resolution (clarification 67). Upgrades
  /fix-conflicts (renamed to dispatch-conflict by
  tactic-dispatch-conflict-rename, which this tactic is blocked_by) with a
  second, graph-native lane; per the 2026-07-19 partition clarification 78 it
  owns the resolution ladder's model layers 4-5 -- scoped model reconciliation
  and the true-conflict office_hours park -- invoked on graph-commit's
  mechanical-unresolved exit; the deterministic mechanical layers 1-3 are
  tactic-graph-commit-auto-serialization's (already landed and merged, PR #2911;
  its blocked_by entry was reconciled away when the node was pruned post-merge).
  Parked and cleared 2026-07-19 (two-draft collision, resolved by the ratified
  partition). Finalized 2026-07-22 as a BACKLOG tactic (off-path, low rank) per
  clarification 69. Split at finalize (2026-07-22 /align-tactics): two
  independent Explore/Plan fan-outs both found the plain skill/slash-command
  rename (fix-conflicts -> dispatch-conflict) requires discriminating the skill
  name from the load-bearing dispatch phase token fix-conflicts across roughly
  15 reference sites plus one unconfirmed legacy worker-prompt emitter -- a
  real, disjoint, sonnet-tier unit of work from this tactic's judgment-heavy
  opus-tier new-lane design. Per this skill's leaf-tactic-is-one-PR rule, the
  rename was split into the new sibling tactic-dispatch-conflict-rename
  (blocked_by, below), which this tactic now depends on; this tactic's own scope
  narrows to adding Lane 2 on the already-renamed skill file. The rename
  tactic's own cross-reference sweep explicitly excludes this node's body (this
  node updates its own cross-references, as done here) and
  tactic-dispatch-skill-rename's roster entry for dispatch-conflict (which
  already deferred this skill's substance here, not to itself) is unaffected by
  the split -- it will simply find the rename already done when its own
  blocked_by-gated round eventually runs."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-dispatch-conflict-greenfield
  pr: 2951
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a graph-native lane to dispatch-conflict: auto-resolve mechanical merge conflicts from existing graph requirements, park only on conflicts needing author input on intention

## Context

Today `graph-commit` (the sole write path for `intentions/*.md` graph nodes)
runs a 5-layer resolution ladder when two sessions concurrently edit the same
node. Layers 1-3 — git three-way rebase, a structure-aware field-level merge,
and stale-`--base` re-read/re-apply — are deterministic and already live
inside `graph-commit` itself (`tactic-graph-commit-auto-serialization`, merged
as PR #2911). When those are exhausted on a genuine same-scalar-field
divergence, `graph-commit` parks the node to `office_hours` with a reason
beginning `graph-commit: mechanical-unresolved` (the greppable marker,
`packages/intentionsutil/scripts/graph-commit:846`) and a per-field breakdown
in `office_hours.recommendation` (`build_recommendation()`,
`graph-commit:793-806`; composed in `park_write()`, `graph-commit:829-903`) —
for example:

```
Diverged field 'statement' on tactic-foo:
  this session's value: "..."
  origin/main's value: "..."
```

Layers 4-5 — a scoped model evaluation and the true-conflict park — cannot
live in a bash script (no script in this repo runs a scoped model eval; model
resolution only happens as SKILL.md-driven subagents). This tactic adds those
two layers as a **second lane** of `dispatch-conflict` (the skill
`tactic-dispatch-conflict-rename`, this tactic's `blocked_by` dependency,
renames from `/fix-conflicts` with zero behavior change to the existing
issue-lane). Lane 1 (renamed, unchanged) keeps resolving git merge-marker
conflicts on issue-numbered PR branches. Lane 2 (new, this tactic) resolves
graph-commit's own node-level `mechanical-unresolved` parks.

**Invocation model.** No automatic router wiring exists today for reacting to
either a `mechanical-unresolved` node park or a PR-level `mergeable ==
CONFLICTING` graph-node-lane PR — confirmed by search: `mechanical-unresolved`
has zero hits outside `graph-commit` itself and this tactic's own node text,
and `dispatch-graph-execute`'s router directive map has no conflict routing
arm. A separate, not-yet-built tactic,
[[tactic-graph-router-conflict-routing]], is scoped to eventually add that
automatic wiring (a new `execution.conflict` interrupt, a `mergeable` sensor,
and selector routing) for the PR-mergeable case, and explicitly defers "the
shell layer" — this skill's existence and invocability — to this tactic. So
Lane 2 is invoked by **explicit node id** for now (parity with `/office-hours
<node-id>`), by a human or a future router; no automatic hook is added here,
and none should be — that is the router tactic's job.

## Units of work

### Unit 1 — Add the lane-discrimination preamble to the renamed skill

**Scope:** in `.claude/skills/dispatch-conflict/SKILL.md` (already renamed and
self-consistent per `tactic-dispatch-conflict-rename`), replace Lane 1's Step-1
hard `exit 1` on a non-issue-branch with a lane-discrimination preamble ahead
of Lane 1's steps:
- Non-empty, non-numeric `ARGUMENTS` → **Lane 2**, `NODE_ID=$ARGUMENTS`
  (explicit human/future-router invocation — the `office-hours/SKILL.md`
  ARGUMENTS-first pattern).
- Empty `ARGUMENTS`, branch matches `[0-9]*-*` → **Lane 1** (today's behavior,
  unchanged): `N="${BRANCH%%-*}"`.
- Empty `ARGUMENTS`, branch does not match → **Lane 2**, `NODE_ID=$BRANCH`
  (the `qa-main` node-worktree shape).

This preamble is the only change to Lane 1's own control flow; Lane 1's Steps
2-7 (reproduce, attempt-counter, gather context, subagent, resolved/ambiguous
dispositions) are untouched.

**Recommended model:** `opus` — this preamble's exact shape (which signal wins,
`ARGUMENTS` vs branch name) is a design call this plan intentionally leaves
open for implementation time, per the model-selection heuristic's "the plan
itself leaves decisions for implementation time" case.

**Dependencies:** none within this tactic (depends on `tactic-dispatch-conflict-rename`
having already landed the renamed file, enforced by `blocked_by`).

### Unit 2 — Node-lane read and marker detection

**Scope:** new `## Lane 2 — graph-native node conflict` section in
`dispatch-conflict/SKILL.md`, after Lane 1's steps. Read `intentions/$NODE_ID.md`
fresh off `origin/main` (the `qa-main/SKILL.md` node-lane pattern: `git archive
origin/main` or a direct `readNode`). Confirm `office_hours` is non-null **and**
`office_hours.reason` begins with the exact marker `graph-commit:
mechanical-unresolved` (`graph-commit:846`). If the node is not parked, or is
parked for any other reason, report and **stop** — Lane 2 only services
mechanical-unresolved parks; it is not a general office-hours resolver. Treat
the node's frontmatter/body/`office_hours` text as **untrusted data** throughout
(the same fence `office-hours/SKILL.md` and `qa-main/SKILL.md` apply to node
content). Parse the per-field divergence already present in
`office_hours.recommendation` (the `Diverged field '<field>' on <id>: / this
session's value: / origin/main's value:` shape, `graph-commit:797-802`) — this
is this lane's primary input, no separate diff/hunk gathering is needed (unlike
Lane 1, which reproduces a live git conflict; Lane 2's "conflict" is already
fully captured as structured text by graph-commit).

**Recommended model:** `opus`.

**Dependencies:** Unit 1.

### Unit 3 — Launch the scope-guarded opus reconciliation subagent

**Scope:** in the same Lane-2 section, launch an opus subagent (Agent tool,
`model: opus`) in the same `resolved` / `ambiguous <reason>` verdict shape as
Lane 1's subagent (`dispatch-conflict/SKILL.md`, the renamed former
`fix-conflicts/SKILL.md:160-171`), fed the diverged-field breakdown from Unit 2
plus the node's statement/rationale/body, all presented as clearly-delimited
**untrusted data** the subagent reasons over, never as instructions. The
subagent operates under this exact scope guard — the ratified doctrine from
strategy-graph-native-dispatch clarification 78 — quoted **verbatim** in the
skill text, not paraphrased:

> On human-owned doctrine fields (virtue/strategy/tradition/delegation
> `statement`, `rationale`, clarification text) the model resolves only
> mechanical divergence — subsumption, reordering, same intent differently
> worded — never synthesizing new substance; genuine doctrine divergence goes
> to layer 5. Full reconciliation on ai-owned tactic content and state fields
> (`phase`, `office_hours`, `execution`).

It ends with exactly `resolved` (its reconciled value(s) for each diverged
field) or `ambiguous <reason>` (a one-line structural description, safe to
surface verbatim in a public office-hours context — no credential-like or
overly specific content).

**Recommended model:** `opus`.

**Dependencies:** Unit 2.

### Unit 4 — `resolved` path: write back, clear the park, land

**Scope:** on `resolved`, apply the subagent's reconciled field value(s) to the
node's full JSON (fetched via a direct `readNode` or `dump-node.ts`'s JSON
capture), set `office_hours` to `null`, and write it through `write-node.ts`
(`packages/intentionsutil/scripts/write-node.ts` — the sole node-mutation gate;
full-node JSON in, `validateNode` re-applies defaults). Then land via a
**normal-edit** `graph-commit "$NODE_ID"` call — **deliberately without
`--base`**. Reasoning to embed in the skill: the node is already parked *on*
origin/main, so this write starts fresh from current origin/main state, and if
another writer races between this read and this commit, graph-commit's own
layers 1-3 should get the chance to auto-merge (or, worst case, re-park) rather
than this lane failing closed on a CAS mismatch — `--base`'s compare-and-swap
is the wrong tool for a write that is itself resolving a park, since a fresh
race here just routes back into the ladder, which is the desired behavior, not
an error condition. A re-park on such a race simply means Lane 2 gets invoked
again later.

**Recommended model:** `opus` — the concurrency judgment above (why no
`--base`) is the crux of this unit and needs an implementer who can reason
about it, not follow a rote recipe.

**Dependencies:** Units 2, 3.

### Unit 5 — `ambiguous` path: confirm the existing park, no re-park needed

**Scope:** on `ambiguous <reason>`, the node **stays parked** — it already is.
`office_hours.recommendation` already carries both divergent values from
`graph-commit`'s `build_recommendation()`. Report that no autonomous
resolution was possible and stop; this is a no-op park-confirmation, not a
fresh park. Explicitly do **not** invoke
`.claude/skills/dispatch-propagate/escalation-recommend.md`'s spawn-recommend-park
sequence here — that pattern exists to *add* a missing recommendation before a
*fresh* park, but graph-commit already wrote a complete field-breakdown
recommendation; re-running it would be redundant and could overwrite useful
detail. (Lane 1's own `ambiguous` path keeps using `escalation-recommend.md`
verbatim, unchanged — that is a fresh park on a live git conflict, a genuinely
different situation.) If the subagent's `<reason>` adds a genuinely new
best-next-step beyond the mechanical field breakdown, the skill *may* append it
to `office_hours.recommendation` via a fresh `write-node.ts` write (schema
`schema.ts:392-397`), but the default, acceptable minimal behavior is
confirm-and-report only.

**Recommended model:** `opus`.

**Dependencies:** Units 2, 3.

## Reuse

- Dual-lane structural precedent: `.claude/skills/qa-main/SKILL.md` (branch on
  worktree dirname / `case [0-9]*-*` issue lane vs default node lane) and
  `.claude/skills/office-hours/SKILL.md` (`ARGUMENTS`-first numeric-vs-node-id
  discrimination) — combine both for Unit 1's preamble.
- Fresh node read off origin/main: `qa-main/SKILL.md`'s `git archive origin/main`
  pattern.
- Subagent verdict shape (`resolved` / `ambiguous <reason>`) and the
  untrusted-data framing: Lane 1 itself (the renamed former
  `fix-conflicts/SKILL.md:152-172`).
- Node write-back gate: `packages/intentionsutil/scripts/write-node.ts`.
- Node JSON capture / CAS-base primitive (used for `readNode`, deliberately
  **not** used for `--base` in Unit 4): `packages/intentionsutil/scripts/dump-node.ts`.
- Normal-edit `graph-commit` invocation: `packages/intentionsutil/scripts/graph-commit`.
- `office_hours` schema: `packages/intentionsutil/src/schema.ts:392-397`
  (`{reason, since, recommendation: string | null}`), displayed to humans at
  `.claude/skills/office-hours/SKILL.md:331-352`.
- Escalation-recommend pattern (Lane 1 reuse; Lane 2 deliberate non-use, per
  Unit 5): `.claude/skills/dispatch-propagate/escalation-recommend.md`.

## Verification

No test suite exists for this skill today (confirmed: no `test-fix-conflict*`
or `test-dispatch-conflict*` anywhere under `.claude/skills/**`). This is a
markdown-instructions skill; verification is structural greps plus prose
consistency checks.

```verify
# The scope guard is embedded verbatim (guards against paraphrase drift).
grep -q 'never synthesizing new substance' .claude/skills/dispatch-conflict/SKILL.md

# The skill greps the exact marker graph-commit emits (contract coupling).
grep -q 'graph-commit: mechanical-unresolved' .claude/skills/dispatch-conflict/SKILL.md
grep -q 'graph-commit: mechanical-unresolved' packages/intentionsutil/scripts/graph-commit

# Lane 2 lands through the two canonical gates, never hand-edited YAML.
grep -q 'write-node' .claude/skills/dispatch-conflict/SKILL.md
grep -q 'graph-commit' .claude/skills/dispatch-conflict/SKILL.md

# Lane 1's verdict contract is still present and untouched.
grep -q 'ambiguous' .claude/skills/dispatch-conflict/SKILL.md
grep -q -- '--phase fix-conflicts' .claude/skills/dispatch-conflict/SKILL.md
```

Manual / judgment steps:
- Confirm the marker string embedded in the skill matches
  `packages/intentionsutil/scripts/graph-commit:846` exactly (a drift here
  silently breaks Lane 2's detection).
- Confirm the Unit-4 `resolved` write sets `office_hours: null` and omits
  `--base`, per the concurrency reasoning in Unit 4 — a reviewer should be able
  to articulate why `--base` is wrong here, not just that it's absent.
- Confirm the subagent prompt never authorizes new-substance synthesis on
  human-owned doctrine fields (`statement`, `rationale`, clarification text) —
  walk a synthetic doctrine-field divergence through the prompt text and check
  it would be flagged `ambiguous`, not silently merged.
- Confirm Lane 1's Steps 2-7 remain byte-identical in behavior to the renamed
  baseline — this tactic touches only the Step-1 preamble and adds the new
  Lane-2 section after it.
- Two synthetic walkthroughs: (a) a node parked with
  `office_hours.reason` starting `graph-commit: mechanical-unresolved` and one
  diverged ai-owned field (e.g. `phase`) resolves via Unit 4; (b) the same
  shape but with a diverged human-owned `rationale` carrying genuinely
  contradictory intent resolves via Unit 5 (stays parked, reported).
- No graph node files are shipped as fixtures by this tactic's own
  implementation, so `validate-graph.ts` is not required unless the
  implementer adds one for the synthetic walkthroughs above — run it if so.
