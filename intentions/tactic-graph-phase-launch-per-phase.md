---
id: tactic-graph-phase-launch-per-phase
kind: tactic
statement: "graph-native launch-per-phase (Shape B): retire the
  dispatch-graph-tick agent() fan-out; an owned primitive spawns each selected
  phase as its own top-level sonnet orchestrator session (Workflow tool in
  hand), opus subagents only when the work calls for it"
owner: ai
status: codified
parent: null
rationale: Surfaced 2026-07-11 /align-strategy interview revising
  strategy-graph-native-dispatch clarification 24 to Shape B. The
  dispatch-graph-tick agent()-per-node fan-out cannot host a phase whose own
  logic is a workflow (a workflow-spawned subagent lacks the Workflow tool), so
  /review-fix and /qa-fix park every time. This tactic implements the Shape-B
  launch layer and its model routing.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 10
  override: null
  rationale: "Re-boosted 2026-07-12: the 2026-07-11 boost:4/authored:9 tier was
    overtaken by tactic-reading-review-skill's authored 14 — a
    blocked_by-critical-path compounding effect (its own boost 7 plus 7
    inherited backward from tactic-reading-review-candidate-extension), not an
    explicit author priority decision. This tactic resolves the review/qa-phase
    Workflow-tool gap that has repeatedly parked graph-tick review workers (e.g.
    tactic-household-consent-instrument, tactic-ledger-census,
    tactic-intention-store-sensor, tactic-graph-digest-tooling all parked
    office_hours on this same blocker). Own boost 10 added to
    strategy-graph-native-dispatch's inherited boost 5 resolves to authored 15,
    restoring top rank above the current graph max of 14. Re-boosted alone, not
    with its 2026-07-11 companions (tactic-review-phase-trust-builtin-review,
    tactic-graph-frozen-tactic-dispatch): this is the only one of the three
    whose fix directly resolves the Workflow-tool-unavailable park; the
    companions address separate, unrelated concerns from the same interview
    round and were left at their original tier."
phase: review
execution:
  branch: tactic-graph-phase-launch-per-phase
  pr: 2870
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours:
  reason: "review phase reached review-fix Step 2 (the Workflow-tool fan-out of
    .claude/workflows/review-fix.js), but this graph-lane worker session was not
    granted the Workflow tool, so the workflow cannot be invoked and the review
    pass cannot run. This is exactly the pre-Shape-B limitation PR #2870 (the
    node under review) fixes: a phase skill that is itself a workflow cannot run
    inside an agent()-fanned session that lacks the Workflow tool. review-fix
    DOES support node targets (its node lane ran through the preamble and Step 1
    inline scans: surface=code, deps=false, CodeQL 0 open alerts, erosion 0
    findings, prescanned findings empty) — the block is the absent Workflow
    tool, not node-target support, so this is NOT skill-node-target-unsupported.
    Next steps: run /review-fix tactic-graph-phase-launch-per-phase in a full
    interactive session that holds the Workflow tool, land the review via
    transition-node --set-pr 2870, then manually clear office_hours;
    alternatively human-review and merge PR #2870 itself, which makes the
    Shape-B top-level-session-runs-skill-directly path live so future graph
    review phases are granted the Workflow tool."
  since: 2026-07-14
  recommendation: "Run /review-fix tactic-graph-phase-launch-per-phase in a full
    interactive session that holds the Workflow tool, then transition-node
    --set-pr 2870 and manually clear office_hours; or human-review and merge PR
    #2870 to make the Shape-B path live."
pace_exempt: false
rounds: null
attributes: {}
---
# graph-native launch-per-phase (Shape B): retire the dispatch-graph-tick agent() fan-out; an owned primitive spawns each selected phase as its own top-level sonnet orchestrator session (Workflow tool in hand), opus subagents only when the work calls for it

## Context

The graph dispatch lane launches a selected node's phase like this:
`dispatch-select-tick` emits a `graph <count> <id:kind:phase>...` decision;
`dispatch-tick:597` calls `dispatch-graph-execute "$@"`. Today
`dispatch-graph-execute`
(`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`) **already
spawns a top-level `claude --bg` session per node** (via `dispatch-spawn-job`,
`:122-125`), named `<node-id>`, cwd = the main worktree — but its prompt
(`:116-117`) tells that session to "Invoke the Workflow tool with the workflow
script named dispatch-graph-tick". `.claude/workflows/dispatch-graph-tick.js`
then fans out one `agent()` per node (`:154-173`) and tells that subagent to
`INVOKE ${sel.skill} ${sel.node_id}` (`:121`). **A workflow-spawned `agent()`
subagent is not granted the Workflow tool**, so phase skills that are themselves
workflows — `/review-fix` (`review-fix.js`) and `/qa-fix` (`qa-fix.js`) — cannot
run and park at their Step 2 every tick (the graph already carries such parks,
e.g. the 2026-07-11 `tactic-align-strategy-alignment-tests` qa park). This is the
exact structure clarification 24 (Shape B) retires.

**The fix (Shape B, ratified in `strategy-graph-native-dispatch` clarification 24
— do not redesign the intent).** The top-level session already holds the
Workflow tool; it just needs to run the phase skill **directly** instead of
invoking the workflow. So retire the `dispatch-graph-tick.js` `agent()`-per-node
fan-out, and have `dispatch-graph-execute` spawn each phase as a direct top-level
phase-skill session (which builds its own phase-specific fan-out, spawning opus
subagents only when the work calls for it). The orchestrator session runs on
**sonnet** for every phase; opus is reintroduced only inside each phase's own
workflow (e.g. `review-fix.js` already sets `model: 'opus'` for its fix author;
`/implement`'s `/implement-unit` picks per-unit). Outcome is durable graph state
— the phase writes its own `phase` transition via `graph-commit` — so no
structured session return is needed; recovery is next-tick re-selection from
`origin/main`, and independent sessions mean a dead phase session cannot kill
siblings.

**Greenfield shape.** `dispatch-graph-execute` becomes the complete graph-lane
launch primitive — the graph sibling of the legacy issue-lane
`dispatch-launch-worker` (`:130-164`), keyed on `<id:kind:phase>` instead of
`<N> <worktree>`. The behavioral spec to mirror is the current
`dispatch-graph-tick.js` `nodePrompt` (`:96-131`), which already encodes provision
→ route exit codes → INVOKE-skill → park-on-failure; Shape B moves that routing
UP into `dispatch-graph-execute`, handled at zero token cost before any `claude`
session spawns (exactly as `dispatch-launch-worker:141-236` does). Two lanes,
because the phase skills differ in how they take their target:

- **Tactic phases derive their target from the worktree branch**
  (`implement/SKILL.md:36-59`, `review-fix/SKILL.md:41-60`, `fix-checks`,
  `qa-fix`, `qa-main` all split `BRANCH`), so the cwd is load-bearing: tactic
  nodes must be **pre-provisioned** and spawned with `--cwd <worktree>`.
- **`/align-tactics` takes a `strategy-<slug>` argument**
  (`align-tactics/SKILL.md:41-56`), does not parse a branch, and **owns its own
  worktree claim/entry** (its Step 0). A strategy node has no PR/CI/merge gate, so
  it is **not** pre-provisioned: spawn `cwd=PROJECT_ROOT`, prompt
  `/align-tactics <id>`, and let the skill enter its own worktree.

This is one PR (one script rewritten, one file deleted, one new test file, one CI
line). The units below are sequencing within that PR.

## Units

### Unit 1 — Rewrite `dispatch-graph-execute` to the Shape-B launch path

**Recommended model: opus** — a cross-cutting control-flow rewrite (two-lane
split, mechanical exit-code routing moved in from the workflow, revised exit-code
semantics, a prompt/`--name` injection surface on the node id).

**Scope** — `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`:
- Rewrite the header docstring (`:1-42`) to describe the direct-phase-skill
  launch; drop all runner/`dispatch-graph-tick` narrative (`:22-30`).
- Keep the arg guard (`:44-50`) and `PROJECT_ROOT` resolution (`:55-70`, incl.
  the `DISPATCH_GRAPH_MAIN_WORKTREE` test override at `:57`).
- In the per-node loop (`:76-146`):
  - After the spec parse (`:77`), **validate `id`** against the node-id slug
    `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` — it flows into `--name` and the spawn prompt
    (mirror `provision-node-worktree:57`, `dispatch-launch-worker:99`).
  - Keep the `kind:phase` → `SKILL` / `MODEL_PHASE` case map (`:79-93`).
  - **Remove** the `dispatch-phase-model` call (`:97-101`), the `ARGS_JSON` block
    (`:103-113`), and the runner `PROMPT` (`:116-117`). Introduce
    `ORCH_MODEL="claude-sonnet-4-6"`. Keep the `dispatch-phase-effort` call
    (orchestrator effort is orthogonal to the model; `implement`→`medium`).
  - **Strategy lane** (`kind=strategy`): spawn `dispatch-spawn-job --no-verify
    --name "$id" --cwd "$PROJECT_ROOT" --model "$ORCH_MODEL" "/align-tactics
    $id"`; `reservation_clear "$id"` on a successful kick (mirror `:127`); emit
    `launched <id> /align-tactics`.
  - **Tactic lane**: call `provision-node-worktree "$id" "$phase"`, capture stdout
    (`WT`) + rc, and `case` on rc — **no `claude` session** on the non-zero paths
    (mirror `dispatch-graph-tick.js` nodePrompt `:110-125`):
    - **0** → `WT` is the worktree path provision printed on stdout
      (`$PROJECT_ROOT/.claude/worktrees/$id`). Spawn `dispatch-spawn-job
      --no-verify --name "$id" --cwd "$WT" --model "$ORCH_MODEL"
      [--effort "$EFFORT"] "$SKILL $id"` — the phase skill invoked directly.
      `reservation_clear` on a successful kick; on a failed kick leave the marker
      for the sweep. Emit `launched <id> <skill>`.
    - **10 ci-waiting** → leave the reservation; emit `waiting <id>`; no spawn
      (next tick re-selects once the CI verdict lands).
    - **11 merge-conflict** → `park-node <id> "<reason>. Next steps: <...>"`; emit
      `parked <id>`; no spawn. (`/fix-conflicts` does NOT accept node targets —
      `fix-conflicts/SKILL.md:44-52` exits on any non-`[0-9]*-*` branch — so a
      graph node's conflict parks rather than routing to `/fix-conflicts`; routing
      is a future follow-up gated on node-target support. This generalizes the
      `dispatch-graph-tick.js:113` strategy fallback to tactics.)
    - **12 stale-selection** → `reservation_clear <id>`; emit `skipped <id>`; make
      NO graph write; no spawn.
    - **13 scope-stale** → `packages/intentionsutil/scripts/demote-node-to-implement
      <id>`; emit `scope-stale <id>`; no spawn (next tick re-selects at
      `implement`).
    - **2 / other** → `park-node <id> "<reason>. Next steps: <...>"`; emit
      `parked <id>`; no spawn.
    (Note: `provision-node-worktree` currently emits only 0/2/10/11; 12/13 are
    documented-but-not-yet-emitted. Route them anyway, for parity with the current
    `nodePrompt` and forward-compat.)
  - Revise the final exit logic (`:145-146`) and `FAILURES` accounting:
    `launched`, `waiting`, `skipped`, `scope-stale`, and `parked` are all **RC-0**
    dispositions; `FAILURES` increments (→ overall exit 1) only when a node can
    neither launch nor cleanly dispose (spawn kick failed AND could not park, or
    `park-node`/`demote` itself failed). Exit 2 stays usage/config error.
- Confirm the caller `dispatch-tick:589-618` needs **no change**: it echoes stdout
  through and treats only RC≠0 as a tick error. Verify the new RC-0 dispositions
  (esp. `waiting`) do not make the tick exit 2 — today's exit 1 fires only on
  spawn failure; preserve that.

**Dependencies:** none (first unit).

**Reuse:** `dispatch-launch-worker:130-164` (provision→spawn-direct pattern, id
validation, `reservation_clear` on resolve); `provision-node-worktree` (interface
+ exit codes 0/2/10/11, forward 12/13); `dispatch-spawn-job` (`--no-verify --name
--cwd --model --effort`); `packages/intentionsutil/scripts/park-node`
(`<id> "<reason>"` — office_hours graph write, never a label);
`packages/intentionsutil/scripts/demote-node-to-implement`; `dispatch-phase-effort`
(unchanged); `lib-reservation-ledger.sh` (sourced at `:52`, `reservation_clear`).

```verify
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
command -v shellcheck >/dev/null && shellcheck .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute || echo "shellcheck absent, skipped"
! grep -n "dispatch-graph-tick" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
! grep -nE "ARGS_JSON|Invoke the Workflow tool" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
grep -n "claude-sonnet-4-6" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
! grep -n "dispatch-phase-model" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
grep -n "/align-tactics" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
grep -n "provision-node-worktree" .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
```

### Unit 2 — Retire `dispatch-graph-tick.js`

**Recommended model: sonnet** — mechanical deletion once Unit 1 removes the sole
caller.

**Scope:**
- Delete `.claude/workflows/dispatch-graph-tick.js` (its only code caller was
  `dispatch-graph-execute:116`, rewritten in Unit 1).
- Confirm no remaining **code** references (`.js`/`.sh`/`.github/`/`settings*.json`).
  The `intentions/*.md` mentions (`tactic-router-failure-fuses`,
  `tactic-node-ancestry-context`, `tactic-selection-ledger-accounting`,
  `strategy-graph-native-dispatch`, `tactic-graph-native-dispatch`) are other
  nodes' prose bodies — **out of scope**, reconciled when those are worked.

**Dependencies:** Unit 1 (remove the caller first, or land delete+rewrite
together).

```verify
test ! -e .claude/workflows/dispatch-graph-tick.js && echo "workflow deleted"
! grep -rn "dispatch-graph-tick" .claude/skills .claude/workflows .claude/hooks .github 2>/dev/null
```

### Unit 3 — Tests: `test-dispatch-graph-execute.sh` + CI wiring

**Recommended model: sonnet** — localized, follows the established PATH-shim/stub
harness.

**Scope:**
- New `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`,
  mirroring the per-case fixture + `assert_eq` style of
  `test-dispatch-phase-model.sh` and the SCRIPT_DIR-copy/stub-sibling approach of
  `test-dispatch-scripts.sh:44-131`. Copy the SUT + `lib-reservation-ledger.sh`
  into a tmp dir and drop **stub siblings** so `"$SCRIPT_DIR/<name>"` resolves to
  them:
  - `provision-node-worktree` stub — echoes `$WT` and exits a per-case code
    (0/10/11/12/13/2).
  - `dispatch-spawn-job` stub — appends `"$@"` to a call log, exits 0 (or 1 for
    the kick-failure case).
  - `park-node`, `demote-node-to-implement` stubs — log-and-exit-0.
  - Set `DISPATCH_GRAPH_MAIN_WORKTREE` to a tmp project root
    (`dispatch-graph-execute:57` override) to skip `git worktree list`.
- Assert from the call log: the spawn argv carries the **phase skill invoked
  directly** (e.g. `/review-fix <id>`), **not** any "dispatch-graph-tick" /
  "Invoke the Workflow tool" string; `--model claude-sonnet-4-6`; `--cwd
  <worktree>` (tactic) / `--cwd <project-root>` (strategy); `--name <node-id>`;
  per-phase mapping `implement→/implement`, `review→/review-fix`, `qa→/qa-fix`,
  `fix→/fix-checks`, `main-qa→/qa-main`, `strategy→/align-tactics`. Plus the
  no-spawn dispositions: 10→`waiting`, 11→`parked`, 12→`skipped` + reservation
  cleared, 13→`demote` called + `scope-stale`, 2→`parked`. Assert exit codes (0
  for clean dispositions; 1 only on unrecoverable failure).
- Wire the new script into CI as an explicit step next to the other `test-*.sh`
  steps in `.github/workflows/unit-tests.yml` (note `test-dispatch-phase-model.sh`
  is not currently CI-wired, so do not rely on an aggregator — add an explicit
  step).

**Dependencies:** Unit 1 (tests target the rewritten behavior). Independent of
Unit 2.

**Reuse:** `test-dispatch-phase-model.sh` (fixture + `assert_eq` style);
`test-dispatch-scripts.sh:44-131` (SCRIPT_DIR-copy + stub-sibling harness);
`test-helpers.sh` (`assert_eq`); `DISPATCH_GRAPH_MAIN_WORKTREE` override.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
grep -n "test-dispatch-graph-execute.sh" .github/workflows/unit-tests.yml
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh >/dev/null && echo "existing suite OK"
```

## Reuse

| Need | Reuse |
|---|---|
| provision→spawn-direct pattern, id validation, `reservation_clear` on resolve | `dispatch-launch-worker:130-164` |
| worktree provisioning + mechanical exit codes (0/2/10/11; forward 12/13) | `provision-node-worktree` |
| `claude --bg` spawn primitive (`--no-verify --name --cwd --model --effort`) | `dispatch-spawn-job` |
| park disposition (office_hours graph write, not a label) | `packages/intentionsutil/scripts/park-node` |
| scope-stale demotion | `packages/intentionsutil/scripts/demote-node-to-implement` |
| orchestrator effort (`implement`→`medium`) | `dispatch-phase-effort` (unchanged) |
| test harness (fixtures + stub siblings + `DISPATCH_GRAPH_MAIN_WORKTREE`) | `test-dispatch-phase-model.sh`, `test-dispatch-scripts.sh:44-131`, `test-helpers.sh` |

## Design notes for the reviewer

- **Why hardcode sonnet rather than change `dispatch-phase-model`:**
  `dispatch-phase-model` routes **subagent/worker** models and is **shared with
  the legacy `dispatch-launch-worker` lane** (`:151-158`), where `/implement`
  worktree sessions legitimately inherit Opus (empty → Opus). Returning sonnet for
  `implement`/`align-tactics` there would corrupt that shared meaning and break the
  legacy lane. The orchestrator-runs-sonnet rule is a launch-layer concern; a
  hardcoded `--model claude-sonnet-4-6` at the graph spawn matches the
  `dispatch-tick:527-553` aux-spawn precedent and leaves `dispatch-phase-model`
  (and its test) untouched.
- **`/align-tactics` moves Opus → sonnet orchestrator.** Today it is unmapped in
  `dispatch-phase-model` (empty → inherit Opus). Shape B runs its orchestrator on
  sonnet, opus only for its own subagents — following the ratified "orchestrator
  sonnet for all phases" intent. If align-tactics' top-level *decomposition*
  reasoning proves to need Opus, that is a separate follow-up; do not silently keep
  it on Opus here.
- **`/align-tactics` self-claim.** Under Shape B the strategy session is named
  `<id>` (the worktree basename), so align-tactics' own Step 0.2
  `worktree_has_live_session` check may observe its own session. This is a
  pre-existing latent concern surfaced (not created) by Shape B, out of scope here;
  the strategy lane spawns `cwd=PROJECT_ROOT` and lets align-tactics do its own
  claim/entry (the least-surprising handoff). Note for the reviewer.
- **Supersession:** this tactic subsumes the raw draft
  `tactic-tick-worker-unit-model-routing` (premise: "per-unit model routing under
  the workflow-native tick; Workflow subagents cannot spawn subagents") — retired
  by Shape B, since the phase orchestrator is now a top-level session whose
  subagents (`/implement-unit`) pick their own model. That node is pruned in the
  same `/align-tactics` round that finalizes this plan.

## Verification (whole PR)

```verify
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh >/dev/null && echo "dispatch suite OK"
test ! -e .claude/workflows/dispatch-graph-tick.js && echo "workflow retired"
! grep -rn "dispatch-graph-tick" .claude/skills .claude/workflows .claude/hooks .github
```

End-to-end (manual, in a graph-lane context): after merge, a graph tick that
selects a `review`- or `qa`-phase tactic must spawn a top-level phase-skill
session that actually runs the workflow (no Workflow-tool-unavailable park).
Observe the next real `review`/`qa` node selection reach a
`dispatch:reviewed`/`qa-done`-equivalent transition rather than an office_hours
park. Note: `dispatch-phase-model` and `test-dispatch-phase-model.sh` are
intentionally untouched — the legacy `dispatch-launch-worker` lane still depends on
their Opus-for-`/implement` behavior.
