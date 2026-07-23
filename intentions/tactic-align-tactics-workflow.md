---
id: tactic-align-tactics-workflow
kind: tactic
statement: "Rearchitect /align-tactics into a deterministic Workflow
  (.claude/workflows/align-tactics.js, /review-fix-shaped): Sonnet orchestrator
  + Opus decision subagents + Sonnet gathering subagents, so the model tiering
  is structural rather than a per-callsite model:opus convention"
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview
  (strategy-token-economy clarification 14). Clarification 10's
  Sonnet-orchestrator + Opus-decompose/plan split shipped as an ad-hoc
  per-callsite model:opus addition to /align-tactics' caller-thread Explore/Plan
  subagents (PR #2886, tactic-align-family-opus-default) - a correct but fragile
  subset: any future Plan/Agent call added without model:opus silently regresses
  the highest-stakes act to Sonnet. This tactic makes the tiering structural:
  /align-tactics executes as a real Workflow (.claude/workflows/align-tactics.js
  via the Workflow tool), the same architecture as /review-fix and /qa-fix, with
  all graph side-effects (write-node.ts/dump-node.ts/graph-commit) staying in
  the SKILL caller thread because Workflow scripts have no fs/git access.
  Finalized in the 2026-07-18 /align-tactics per-node round; blocked_by
  tactic-align-family-opus-default so the Workflow replaces #2886's ad-hoc calls
  rather than churning the same Step-3 region twice."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 75
  override: null
  rationale: "Boosted to top of the discretionary frontier by author direction
    (re-boosted 2026-07-18 from the earlier 58). Rearchitecting /align-tactics
    into a structural Workflow makes the Opus-decision / Sonnet-orchestrator
    model tiering unbreakable, closing the #2886 regression surface —
    high-leverage graph-native-dispatch infrastructure the author elevated above
    its ordinary implement-phase backlog rank. The boost is sized against the
    composed selector rank, not the raw-boost column: this node has no inbound
    compounding and is off the signal/capture path, so its derived terms are
    zero and its rank equals its boost exactly (verified via select-targets —
    boost 75 → rank 75). That tops the current discretionary max of 69.33 on
    tactic-graph-commit-auto-serialization (boost 64, itself on the signal path
    so rank = boost + 5.33), which was boosted to the frontier top in a separate
    /align-tactics session; the earlier 58 had fallen below it. 75 clears 69.33
    with ~5.67 margin while staying well below the permanent
    strategy-main-health trunk (rank 101, the sole node above it). The boost
    flows undecayed to the one node this tactic is blocked_by
    (tactic-align-family-opus-default, PR #2886, now reviewed and in
    merge-ready-hold), the intended critical-path prioritization (the blocker
    must merge first to unblock this node); no unrelated node is distorted."
phase: qa
execution:
  branch: tactic-align-tactics-workflow
  pr: 2931
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-07-21
    attempt: 1
    pushed_sha: 73ca41c910228c7eee89f7bee99105be5f635e7e
validates: []
blocked_by:
  - tactic-flake-hook-tests-select-tick
  - tactic-flake-unit-tests-select-tick
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Rearchitect /align-tactics into a deterministic Workflow (Sonnet orchestrator, Opus decision subagents, Sonnet gathering subagents) — /review-fix-shaped

## Context

`strategy-token-economy` clarification 10 fixed *who* runs on which model for the
`/align-tactics` align-family split (Sonnet orchestrator; Opus for the two
high-stakes acts). Clarification 14 (2026-07-18) fixes *how* that split executes:
a deterministic Workflow, not an ad-hoc per-callsite `model: opus` addition.

Today `/align-tactics` runs in the caller's thread with no orchestrator
(`.claude/skills/align-tactics/SKILL.md:371-427`) and fans out the built-in
`Explore`/`Plan` subagents directly. PR #2886 (`tactic-align-family-opus-default`,
at qa) only adds `model: opus` to those ad-hoc calls — a correct but fragile
subset: any future edit that adds a `Plan`/`Agent` call without `model: opus`
silently regresses the highest-stakes act to Sonnet (the motivating bug). The
greenfield target is a real Workflow (`.claude/workflows/align-tactics.js` invoked
through the Workflow tool), the same architecture as `.claude/workflows/review-fix.js`
and `qa-fix.js`, so the tiering is **structural** — a subagent authoring a plan
cannot be launched on the wrong model, because the model is fixed in the workflow
script's `agent()` call, not re-typed at each callsite.

### Three delegation tiers (the invariant to encode)

- **Sonnet top-level orchestrator** (the SKILL caller thread + the workflow script,
  both Sonnet) — node-id reservation, park-field writes, the idempotency/clause-
  coverage walk, `graph-commit`, and assembling node bodies from subagent output.
  Carries no plan substance.
- **Opus subagents (key decisions)** — the two-sided drift-review verdict (which
  `attributes.conditions` failed / material vs immaterial unrecorded premise), the
  decompose-to-signal judgment (which tactic nodes exist, the minimum set), and
  each claude-eligible tactic's plan-body authoring.
- **Sonnet subagents (delegable gathering)** — the `Explore` reuse-hunt / prior-art
  scan (demotable to Sonnet/Haiku per clarifications 4/10), the mechanical drift
  scan (grep the corpus), and clause-coverage evidence gathering.

### CRITICAL architectural constraint (verified — governs the whole split)

Workflow scripts are **plain JavaScript with no filesystem, git, bash, or Node API
access** — only the injected globals `agent()`, `parallel()`, `pipeline()`,
`phase()`, `log()`, `args`, `budget` (`review-fix.js` and `qa-fix.js` have zero
imports). Therefore **all** graph side-effects — `npx tsx
packages/intentionsutil/scripts/write-node.ts`, `dump-node.ts`, `graph-commit`,
`validate-graph.ts`, the Step 0 worktree claim, every git op, and the `date -u`
stamp for parks — MUST stay in the SKILL caller thread, exactly as
`review-fix.js`/`qa-fix.js` leave all git/gh to their SKILLs and the `.js` does
pure subagent fan-out + JS aggregation returning **one structured object**. The
workflow's *subagents* can read files and run tools (the Explore reuse-hunt reads
source); only the top-level script cannot. So the workflow returns structured
decision data (drift verdict + clarifications to add; the tactic set with each
tactic's full frontmatter fields and authored body text; parks) and the SKILL then
does `write-node.ts` per node + body `Edit` + `dump-node.ts --base` + `graph-commit`
+ `validate-graph.ts`.

### Greenfield shape

**One workflow file, `args.mode ∈ {"strategy","tactic"}`** — both invocation shapes
(strategy decomposition; per-node tactic finalize/re-plan, `SKILL.md:80-146`,
`555-606`) route through the same `.js`. In `tactic` mode the `decompose` phase is
skipped (a conditional phase skip exactly as `qa-fix.js:491-492`); the drift and
plan phases run scoped to the one node. One file keeps the Opus tiering defined in
one place and one schema set — splitting would duplicate the Opus plan-authoring
subagent and reopen the exact regression surface (#2886's fragility) this tactic
closes.

**Phases** (`meta.phases` titles map 1:1 to `phase()` calls, per `review-fix.js:43-55`):
`gather` → `drift` → `decompose` → `plan` → `assemble`.

| phase | subagents | model | why |
|---|---|---|---|
| `gather` | `parallel([...])`: ≤3 Explore reuse-hunt agents + 1 mechanical drift/idempotency corpus-scan + 1 clause-coverage evidence agent | **sonnet** | Delegable retrieval/grep, no plan substance. |
| `drift` | 1 agent: two-sided drift verdict (`SKILL.md:225-270`) | **opus** | Which recorded conditions failed (Side A), material vs immaterial unrecorded premise (Side B), what to park. |
| `decompose` | 1 agent (strategy mode only; skipped in tactic mode) | **opus** | Minimum tactic set, subtree shape (leaf = one PR), copy-classification gate, greenfield-relevance gate, `validates` terminals (`SKILL.md:272-369`). |
| `plan` | `parallel(tactics.map(t => () => agent(...)))` — one agent per claude-eligible tactic | **opus** | Per-tactic plan-body authoring, inheriting `/plan-issue`'s plan-quality bar (`SKILL.md:371-418`). This is the fan-out #2886 patched by hand. |
| `assemble` | none — pure JS in the script (Sonnet) | — | Correlate plan bodies to the decomposed set by `temp_ref`, collect parks, compute the outcome-envelope counts, build the return object. |

**The `temp_ref` → node-id seam** (the one genuinely new element): the workflow
cannot reserve node ids (no fs; and the tactic count/slugs are not known until
`decompose` runs *inside* the workflow). So each emitted tactic carries a stable
`temp_ref` + `slug_hint`, and `parent`/`blocked_by` edges are expressed in terms of
`temp_ref`s (or already-real ids for pre-existing draft targets). After the call the
**SKILL** mints the real id per new tactic, builds a `temp_ref → id` map, and
rewrites `parent`/`blocked_by` before `write-node.ts`. A small pure resolver in the
`.js` (`resolveTempRefs()` — rejects dangling refs and `blocked_by` cycles, mirroring
`validateGraph` rules 13/15 early) is the sentinel-sliced tested helper (see Unit 1).

**Autonomy contract holds structurally** — a Workflow *cannot* run an interactive
dialectic, so parking is the only author-input path. Every non-derivable decision
surfaces as a `park` in the workflow return; the **SKILL** writes
`office_hours: {reason, since}` via `write-node.ts` + `graph-commit`, with
`since = date -u +%Y-%m-%d` computed SKILL-side and the recommendation carried as a
trailing `Recommend: <next step>.` sentence inside `reason` (the dedicated
`office_hours.recommendation` field is not yet in `schema.ts`). `/align-strategy`
stays **out** of this workflow (its interview *is* `AskUserQuestion` dialectic) —
scope asymmetry preserved.

### Standup-cost / thin-SKILL resolution (guardrail — clarification 12)

Workflow-ifying `review-fix`/`qa-fix` did **not** thin their SKILLs (1088/1523
lines), which is in tension with clarification 12. `align-tactics` resolves it
favorably: most of the current 642-line SKILL is *decision doctrine* (two-sided
drift `:225-270`, decompose-to-signal `:272-369`, plan schema `:396-418`) that
**moves into the workflow's `agent()` prompts**, not into the SKILL. What remains
SKILL-side is mechanical procedure, extracted to `references/*.md` loaded on demand
(Unit 4). Target SKILL body: orchestration prose only, comfortably **under ~500
lines**.

### Brownfield sequencing (why the units are ordered, and why this stays one PR)

Increment 1 is PR #2886 (the ad-hoc `model: opus` params — a correct subset, kept).
This tactic is increment 2, `blocked_by: tactic-align-family-opus-default` so the
Workflow **replaces** #2886's ad-hoc calls rather than churning the same Step-3
region twice. Within this one tactic/PR, the four units below land as sequential
`/implement-unit` commits: Unit 1 adds the workflow as *not-yet-wired* code (nothing
regresses — the SKILL still runs the caller-thread fan-out), Units 2–3 flip the two
SKILL paths onto the Workflow and delete the caller-thread fan-out *in the same unit
that wires its replacement*, and Unit 4 thins the SKILL. This is a single coherent
migration of one skill; it is authored as one leaf tactic with a multi-unit body
(the graph norm — finalized tactics routinely carry 3–7 units), not a subtree.

## Units of work

### Unit 1 — Author `.claude/workflows/align-tactics.js` (the decision engine) + unit probe

**Scope.** New file `.claude/workflows/align-tactics.js`, structured per
`.claude/workflows/review-fix.js`:
- doc-comment `args IN / return OUT` contract (mirror `review-fix.js:1-40`);
- `export const meta = {name:'align-tactics', description, phases:[{title:'gather'},
  {title:'drift'},{title:'decompose'},{title:'plan'},{title:'assemble'}]}`
  (`review-fix.js:43-55`);
- JSON-Schema object-literal consts, `additionalProperties:false` + `required` on
  every object, enums for constrained fields (`review-fix.js:57-175` convention):
  `EXPLORE_SCHEMA` (gather reuse-hunt), `CORPUS_SCHEMA` (drift/idempotency scan:
  `{existing_children:[{id,phase,on_signal_path}], candidate_premises, corpus_hits}`),
  `DRIFT_SCHEMA` (`{eligibility, side_a_failed_conditions, unrecorded_premises:[{premise,
  material, proposed_clarification, plan_depends}], clarifications_to_add:[{answer}],
  parks:[{target,reason,category}], proceed}`), `DECOMPOSE_SCHEMA` (`{tactics:[{temp_ref,
  slug_hint, kind, owner, status, serves, parent, blocked_by, validates, claude_eligible,
  copy_touching, instrument, statement, office_hours, draft_source_id}], approval_gates,
  prunes, greenfield_drops, parks}`), `PLAN_SCHEMA` (`{temp_ref, body_markdown,
  surfaced_premises, park}`);
- the `UNTRUSTED_GUARD` preamble + `<untrusted>…</untrusted>` wrapping for the
  strategy `statement`/`rationale`/`clarifications` and every retained draft-tactic
  body fed into prompts (copy `qa-fix.js:234-239`);
- prompt builders for gather/drift/decompose/plan that carry the doctrine inline
  (drift `SKILL.md:225-270`; decompose-to-signal + copy gate + greenfield gate
  `:272-369`; plan schema + the `/implement-unit` model-selection heuristic cited by
  reference `SKILL.md:371-418`, `implement-unit/SKILL.md:31-39`);
- the pipeline: `const _a = typeof args === 'string' ? JSON.parse(args) : (args||{})`
  (`review-fix.js:382`), an `args.mode` branch that skips the `decompose` phase in
  `tactic` mode (`qa-fix.js:491-492`), the `gather` and `plan` `parallel()` fan-outs
  (thunks `() => agent(prompt,{model,agentType:'general-purpose',schema,label,phase})`,
  `review-fix.js:416-423`), every result guarded (`.filter(Boolean)`, `res && res.field`,
  `|| []`), a `subagentsLaunched` accumulator, and the single structured return with
  the outcome-envelope counts (`review-fix.js:1021-1040`, per `.claude/docs/outcome-envelope.md`);
- the pure `resolveTempRefs()` helper wrapped in `// >>> … >>>` / `// <<< … <<<`
  sentinels (clone the pattern at `qa-fix.js:222-230`), plus a probe
  `.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs` (clone
  `qa-fix-partition-probe.mjs`) and a driver block in
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.

Model tiering per the table above: `gather` sonnet, `drift`/`decompose`/`plan` opus;
`agentType:'general-purpose'` on every `agent()`; every call sets `model` explicitly
(never omit — `review-fix.js` never does).

**Out of scope:** any SKILL edit; any graph write; `references/*.md` (Unit 4).

**Recommended model:** `opus` — judgment-heavy and cross-cutting; the prompts encode
the plan-quality/decompose-to-signal bar and leave prompt-design decisions to
implementation time.

**Dependencies:** none (this tactic is already gated on #2886 via `blocked_by`).

### Unit 2 — Wire the strategy-target SKILL path to the Workflow + apply-result writer

**Scope.** Rewrite `.claude/skills/align-tactics/SKILL.md` Steps 1–5 (`:225-553`) so
the caller-thread Explore/Plan fan-out (`:371-427`) is **deleted** and replaced by:
(a) read the strategy frontmatter + child tactics (idempotency scan `:203-223`) and
**build `args`** (`mode:'strategy'`, the strategy fields, gathered draft-body text,
the existing-children list); (b) the prose directive *"Invoke the Workflow tool on
`.claude/workflows/align-tactics.js`, passing `args`"* (mirror `qa-fix/SKILL.md:678`,
`review-fix/SKILL.md:403` — no `name:`, no inline `script`, sanctioned caller so no
`ultracode` keyword); (c) the **apply-result writer** — reserve node ids from
`slug_hint` (deduped against the corpus), resolve the `temp_ref` edge map and rewrite
`parent`/`blocked_by`, `write-node.ts --file` per node (`:489-491`), `Edit` each body
(`:493-498`), `dump-node.ts --base` for every pre-existing node (`:454-457`),
`graph-commit --base` handling both exit-1 cases (`:504-525`), `validate-graph.ts`,
report. Keep Step 0 claim (`:54-78`) and the park-write mechanics (`:170-192`) — but
the park now comes from `result.parks` / `result.drift.strategy_park`, written
SKILL-side with `since = date -u +%Y-%m-%d`.

**Out of scope:** the tactic-target path (Unit 3); SKILL thinning to `references/`
(Unit 4).

**Recommended model:** `opus` — cross-cutting rewrite of the write path plus the new
`temp_ref` resolution seam; correctness-critical (graph writes).

**Dependencies:** Unit 1.

### Unit 3 — Wire the tactic-target per-node + re-evaluation path (`mode:'tactic'`)

**Scope.** Rewrite the SKILL "Tactic target — per-node finalize or re-plan"
subsection (`:80-146`) and "Re-evaluation mode" (`:555-606`) to build `args` with
`mode:'tactic'` (the single node's frontmatter + body, the serving-strategy
substance, `frozenTacticSelectable`/`resolveFrozenDescendant` context —
`router.ts:482`, `:453`), invoke the Workflow, and apply the single-node result
through the **same** apply-result writer from Unit 2 (one node, `dump-node.ts --base`,
`graph-commit --base`, `:129-133`). Preserve the invariants: no strategy edit in
tactic mode (`:135-141`); whole-node reconcile (clarification 32); single-strategy
`execution.strategy_fingerprint` re-stamp via `strategyFingerprint` (`router.ts:89`,
`SKILL.md:582-588`); tactic-local parks only.

**Out of scope:** the strategy-target path (Unit 2); SKILL thinning (Unit 4).

**Recommended model:** `opus` — the finalize/re-plan disposition and fingerprint
re-stamp are judgment-heavy and correctness-critical.

**Dependencies:** Units 1, 2 (shares the apply-result writer).

### Unit 4 — Thin the SKILL to `references/*.md` (standup-cost guardrail)

**Scope.** Create `.claude/skills/align-tactics/references/{write-path,tactic-target,
idempotency,autonomy}.md` and trim the SKILL body to orchestration prose + on-demand
pointers, landing **under ~500 lines**:
- `references/write-path.md` — `write-node.ts`/`dump-node.ts`/`graph-commit`/
  `validate-graph.ts` mechanics, the two `graph-commit` exit-1 cases, park-write
  mechanics, fingerprint honesty, round accounting (from `SKILL.md:440-553`);
- `references/tactic-target.md` — per-node finalize/re-plan arg construction +
  re-evaluation mode (`SKILL.md:80-146`, `555-606`);
- `references/idempotency.md` — the `grep -rl '^  - <strategy-id>$'` recipes +
  born-parked detection (`SKILL.md:203-223`);
- `references/autonomy.md` — the three park conditions, park-time recommendation,
  unrecorded-context framing (`SKILL.md:148-200`); the SKILL body keeps a
  one-paragraph summary + pointer.

Follow `.claude/skills/ref-write-instructions` best practices. Verify the SKILL still
names every step a fresh session must run.

**Out of scope:** any behavior change — this is a pure documentation refactor; the
workflow and write loop are unchanged.

**Recommended model:** `sonnet` — mechanical, well-specified extraction with a clear
line-count target and no logic change.

**Dependencies:** Units 2, 3 (the final SKILL shape must be known before extraction).

## Reuse

- **Whole workflow shape** — `.claude/workflows/review-fix.js` (meta/schemas/`parallel`
  fan-out/outcome-envelope return, 1040 lines) and `.claude/workflows/qa-fix.js`
  (conditional phase skip `:491-492`, `UNTRUSTED_GUARD` `:234-239`, sentinel-sliced
  helper `:222-230`, 616 lines).
- **Tested-helper probe** — clone
  `.claude/skills/dispatch-propagate/scripts/qa-fix-partition-probe.mjs` + its driver
  in `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`.
- **SKILL→Workflow invocation prose** — `.claude/skills/qa-fix/SKILL.md:678`,
  `.claude/skills/review-fix/SKILL.md:403`.
- **Graph write toolchain** —
  `packages/intentionsutil/scripts/{dump-node.ts,write-node.ts,graph-commit,validate-graph.ts}`.
- **Fingerprint / frozen-selection helpers** — `strategyFingerprint`
  (`packages/intentionsutil/src/router.ts:89`), `frozenTacticSelectable` (`:482`),
  `resolveFrozenDescendant` (`:453`).
- **Node-id reservation / claim** —
  `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:15`
  (`worktree_has_live_session`, run `dangerouslyDisableSandbox`), `provision-node-worktree`.
- **Plan schema + model heuristic** — `.claude/skills/plan-issue/SKILL.md` (Steps 3–5),
  `.claude/skills/implement-unit/SKILL.md:31-39` (canonical model-selection home — cite,
  do not restate).
- **Outcome-envelope contract** — `.claude/docs/outcome-envelope.md`.

## Verification

Auto-runnable:

```verify
# The sentinel-sliced resolveTempRefs probe runs inside the hook-tests harness
# (no vitest maps to .claude/workflows/*). Added in Unit 1.
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
# intentionsutil suites (schema/validate-graph/router) must stay green.
npx vitest run --project packages/intentionsutil --root .
```

```verify
# Every graph write this skill lands must pass the validator.
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Primary end-to-end (prose — this is an autonomous decomposition skill; its output is
graph state). Re-run `/align-tactics <strategy-id>` against a small strategy with a
null `reading` and confirm:

- Round 1 includes an **instrument** tactic (null-reading requirement); leaves are
  PR-sized; each planned tactic body carries the plan schema with per-unit
  **Recommended model** tags and, where applicable, fenced ` ```verify ` blocks.
- Signal-validating tactics carry `validates: [<strategy-id>]`; off-path tactics carry
  no flag; born-parked / copy-approval-gate tactics carry `office_hours` and omit `phase`.
- All fan-out ran **inside the Workflow** with structural tiering (Opus drift/decompose/
  plan, Sonnet gather) — no per-callsite `model: opus` remains in the SKILL.
- A non-derivable decision reaches a **park** (`office_hours: {reason, since}` with a
  `Recommend:` sentence), never an `AskUserQuestion`.
- The tactics + any strategy frontmatter change land atomically via `graph-commit`
  (visible on `origin/main`) and pass `validate-graph.ts`; **no** `gh issue`/`gh pr`
  command ran anywhere.
- Re-run the same target to confirm **idempotency** (already-`phase:implement` tactics
  are not re-planned).
- Run once with a `tactic-<slug>` target (both draft/raw finalize and soft-frozen
  re-plan) to confirm `mode:'tactic'` skips `decompose`, touches no strategy
  frontmatter, and re-stamps only the re-evaluated strategy's fingerprint entry.
