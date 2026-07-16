---
id: tactic-graph-node-lane-write-hardening
kind: tactic
statement: "Harden the graph node-authoring and transition convention, five gaps
  surfaced by /review-fix (serves strategy-graph-native-dispatch): (a)-(c) on PR
  #2859 (the main-qa phase adoption), (d) on PR #2863 (the first-ever node-lane
  review completion). (a) The qa-main SKILL.md broken-path bug-node field list
  (kind/phase/owner/serves) omits the schema-required status field; validateNode
  requires status with no default, so following the doc literally makes
  write-node.ts throw IntentionSchemaError -- add status: raw, matching the
  sibling review-fix node lane. (b) Both the qa-main and review-fix node lanes
  document a body field that records provenance, but store.ts writeNode renders
  a new node body from the statement as a single heading and validateNode drops
  unknown keys, so a passed body field is silently discarded and the documented
  provenance is lost; resolve this body-provenance gap across BOTH lanes (carry
  provenance in the statement, or append the body to intentions/<id>.md after
  write-node.ts runs). (c)
  .claude/skills/dispatch-propagate/scripts/transition-node line 130 demotes ANY
  scope-stale node to implement, and compute-freshness has no main-qa exclusion,
  so a scope-stale main-qa node -- now reachable because PR #2859 activates the
  phase -- would be wrongly demoted to implement and re-run the ladder on
  already-merged work, contradicting decideTransition contract and
  check-node-selection main-qa exclusion; phase-gate the demotion. Low trigger
  probability (provisioning writes a fresh stamp) but a real latent gap. (d)
  transition-node resolves REPO_ROOT from its own script location
  (SCRIPT_DIR/../../../..), so run from inside a .claude/worktrees/<id> worktree
  it reads the phase-start scope-fingerprint stamp at
  <worktree>/.claude/worktrees/<id>.scope-fingerprint, but
  provision-node-worktree writes that stamp at the MAIN project root
  .claude/worktrees/<id>.scope-fingerprint; the paths diverge because graph
  worktrees are nested under the main repo .claude/worktrees/, so a node-lane
  review completion driven from the worktree gets stampMissing=true and the
  review->merge arming point fails closed with \"held ... (missing-stamp)\" even
  though the stamp is valid (scope fingerprint covers statement+body, unchanged
  by a park). Worked around live on PR #2863 by copying the stamp to the
  worktree-nested path and re-running. Fix: resolve the stamp against the shared
  main project root (git common dir), not the invoking worktree, so provision
  and transition-node agree on the path. (e) on PR #2869
  (tactic-dispatch-legacy-rewire, the first rewire-then-delete node-lane review
  completion): review-fix's node-lane Completion section defines no
  re-entry/idempotency check analogous to the issue-lane preamble's
  dispatch:reviewed GH-label check -- transition-node's node-lane arm records
  completion as the reviewed execution marker (not a label), and the phase can
  legitimately sit at review with that marker already set while the PR awaits
  merge (see tactic-graph-tick-node-lane-auto-merge), so a session re-invoked on
  such a node/PR has no documented signal to skip Steps 1-6 and must reconstruct
  the check by hand (read execution.markers, cross-reference the PR's
  already-finalized review comment) instead of following a specified re-entry
  seam. Fix: add a node-lane re-entry check to the preamble/Completion section
  keyed on reviewed already present in execution.markers (paralleling the label
  check), skipping Steps 1-6 straight to the terminal flush."
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 11
  override: null
  rationale: "Author-directed 2026-07-16: top-ranks this node-lane hardening
    tactic above the current working max (the token-economy trio, resolved 15)
    so it is selected and lands before other work -- own boost 11 added to
    strategy-graph-native-dispatch's inherited boost 5 resolves to 16, clearing
    the max. Finalized to phase: implement 2026-07-16 (per-node /align-tactics
    finalize; single leaf, no subtree). Triggered by a /review-fix session on PR
    #2869 (tactic-dispatch-legacy-rewire) that discovered gap (e): no node-lane
    re-entry check, requiring the session to hand-verify an already-completed
    review via execution.markers instead of following a documented skip."
phase: review
execution:
  branch: tactic-graph-node-lane-write-hardening
  pr: 2882
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Harden the graph node-lane authoring/transition convention

## Context

Five gaps in the graph node-lane authoring/transition convention, surfaced by
`/review-fix` across three node-lane PRs: #2859 (main-qa phase adoption), #2863
(first-ever node-lane `review` completion), #2869 (first rewire-then-delete
node-lane `review` completion). Each is a real latent defect in the skills and
scripts that drive graph-native dispatch:

- **(a)** The `qa-main` broken-path bug-node field list omits the
  schema-required `status`, so following the doc literally makes `write-node.ts`
  throw `IntentionSchemaError`.
- **(b)** Both the `qa-main` and `review-fix` node lanes tell the author to pass
  a `body` field to `write-node.ts` for provenance, but `validateNode` drops
  unknown keys and `store.ts` regenerates a new node's body from `statement`, so
  the documented provenance is silently discarded — systemic across both lanes.
- **(c)** `transition-node` demotes ANY scope-stale node to `implement` before
  the pure `decideTransition` layer runs; `decideTransition` and
  `check-node-selection` deliberately exclude `main-qa` (post-merge), so a
  scope-stale main-qa node would be wrongly demoted and re-run the ladder on
  already-merged work.
- **(d)** `transition-node` resolves the phase-start scope-fingerprint stamp
  path off its own `SCRIPT_DIR`, so run from inside a `.claude/worktrees/<id>`
  worktree it reads the stamp at the worktree root while `provision-node-worktree`
  wrote it at the main project root — the paths diverge (graph worktrees nest
  under the main repo), yielding a false `stampMissing:true` that fails the
  review→merge arming closed.
- **(e)** The `review-fix` node lane records completion as a `reviewed` marker in
  `execution.markers` (not a gh label), but its Completion section defines no
  re-entry check reading that marker; a session re-invoked on an already-reviewed
  node/PR (the marker can sit set for a long window while the PR awaits a human
  merge) would redo the whole finder/verify/fix/comment pipeline.

The full gap list is also the frontmatter `statement`. No node elsewhere in the
graph supersedes any of these (greenfield-relevance sweep, 2026-07-16). This is a
single leaf tactic (one PR); the three units below are organized by file to
minimize cross-unit churn.

## Units of work

### Unit 1 — `qa-main` SKILL.md: add `status` to the broken-path node + fix its provenance instruction (gaps a, b)

- **Recommended model:** sonnet
- **Scope.** Edits only `.claude/skills/qa-main/SKILL.md`.
  - **(a)** At the broken-path bug-node field list —
    `.claude/skills/qa-main/SKILL.md:133-134` (documents `kind: tactic`,
    `phase: implement`, `owner: ai`, and `serves`) — add `status: raw` as a
    documented field. `validateNode`
    (`packages/intentionsutil/src/schema.ts:468-534`) requires `status` with no
    default, so the current list makes `write-node.ts` throw. This is an *active*
    bug node — keep `phase: implement`; only the missing required `status` is
    added. The sibling `review-fix` lane already names `status: raw`
    (`.claude/skills/review-fix/SKILL.md:533-534`), but for an inert draft with
    no `phase` — match the field, not the no-phase shape.
  - **(b)** At the provenance instruction —
    `.claude/skills/qa-main/SKILL.md:139-141` ("The body records the regression
    provenance…") — the body cannot be passed to `write-node.ts` (it discards
    unknown keys and regenerates the body from `statement`). Rewrite the
    instruction to a two-step: (1) run `write-node.ts` with the frontmatter,
    then (2) write the provenance as the node body by editing
    `intentions/<id>.md` (replacing the generated `# <statement>` placeholder
    after the frontmatter fence), then (3) `graph-commit`. `store.ts`
    (`readExistingTacticBody`, `store.ts:47,84-88`) preserves a hand-authored
    tactic body across later frontmatter-only writes, so the appended body is
    durable — cite this so the author understands why the append survives. Keep
    the same provenance fields (`expected_outcome`, observed-on-prod behavior,
    `url_path`, source PR `execution.pr`, source node id).
- **Out of scope.** The `review-fix` side of gap (b) (Unit 2); any
  `transition-node` change.

### Unit 2 — `review-fix` SKILL.md: fix its provenance instruction + add a node-lane re-entry check (gaps b, e)

- **Recommended model:** opus
- **Scope.** Edits only `.claude/skills/review-fix/SKILL.md`.
  - **(b)** At the draft-provenance instruction —
    `.claude/skills/review-fix/SKILL.md:536-538` ("Each draft's body records the
    finding provenance…") — apply the SAME fix pattern as Unit 1: the body must
    be written by editing `intentions/<id>.md` after `write-node.ts` (which
    discards a `body` key), before `graph-commit`; `store.ts` preserves it. Keep
    the provenance fields (`file:line`, failure scenario, adversarial verdict,
    source PR `execution.pr`). Keep the wording consistent with Unit 1's
    qa-main rewrite so both lanes describe one mechanism.
  - **(e)** Add a node-lane re-entry / idempotency check paralleling the
    issue-lane label check at `.claude/skills/review-fix/SKILL.md:162-173` ("If
    the labels line already includes `dispatch:reviewed` … skip Steps 1–6 and go
    straight to Step 7"). The node lane has no equivalent: it writes the
    `reviewed` marker to `execution.markers`
    (`.claude/skills/review-fix/SKILL.md:133`) but never reads it back. Add a
    check — in the Node-target lane section
    (`.claude/skills/review-fix/SKILL.md:126-150`), naturally after the
    Completion bullet (~line 143), or as a node-lane clause on the 162–173 block
    — keyed on `reviewed` present in `execution.markers` of the already-fetched
    `NODE_MD` (parsed from origin/main at preamble line 51) for the resolved
    `PR_NUM` (the node lane resolves it at line 80:
    `gh pr list --head "$BRANCH" …`). On a hit, skip Steps 1–6 and go straight to
    Step 7's terminal flush, exactly as the label check routes the issue lane.
    Ensure Step 7 handles the node-lane re-entry (no Workflow ran) the same way
    it handles the label re-entry (skip the phase-log write and outcome-envelope
    emit).
- **Out of scope.** The `qa-main` side of gap (b) (Unit 1); `transition-node`.
- **Dependencies.** None functional (different file from Unit 1); ordering not
  required.

### Unit 3 — `transition-node`: phase-gate the scope-stale demotion + resolve the stamp at the shared root (gaps c, d)

- **Recommended model:** opus
- **Scope.** Edits only `.claude/skills/dispatch-propagate/scripts/transition-node`.
  - **(c)** At the scope-stale demotion branch — `transition-node:130`
    (`if [[ "$SCOPE_STALE" == "true" ]]; then` → calls `demote-node-to-implement`
    at `:131`) — gate it on phase so a `main-qa` node is NOT demoted. `PHASE` is
    already read at `transition-node:98` (`jq -r '.phase // "implement"'`). Add
    the guard (e.g. `if [[ "$SCOPE_STALE" == "true" && "$PHASE" != "main-qa" ]]`).
    This matches the contract the pure layer already encodes but the shell
    pre-empts: `check-node-selection.ts:60`
    (`SCOPE_CHAINED_PHASES = {"fix","qa","review"}`, main-qa excluded —
    "post-merge by definition", `:213-215`) and `transitions.ts:176-179`
    (`decideTransition`'s scope-stale branch: "pre-merge only; the caller must
    not invoke this on a merged tactic — post-merge staleness routes via
    main-qa"). When gated out, let `transition-node` proceed with the normal
    transition (do not demote). *Greenfield note:* the ideal home for this
    decision is the pure `decideTransition` layer that already owns the contract,
    rather than the shell pre-empting it with a direct `demote-node-to-implement`
    call; the targeted bash guard is the in-scope fix matching this gap's intent
    (the pure layer stays authoritative). Moving demotion wholly into the pure
    layer is a separate refactor, out of scope here.
  - **(d)** Resolve the scope-fingerprint stamp path against the shared main
    project root (git common dir), not the SCRIPT_DIR-relative `REPO_ROOT`.
    `transition-node:47` sets `REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"`,
    used for the stamp at `:82` and `:93` (refresh_stamp WRITE) and `:121` (READ,
    passed to `compute-freshness` via `--stamp`). Run from a worktree, `REPO_ROOT`
    resolves to the worktree root; but `provision-node-worktree` writes the stamp
    at the main root (`provision-node-worktree:86`
    `STAMP_PATH="$PROJECT_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"`,
    `PROJECT_ROOT` = the main-checkout worktree, `:63-64`). Use the shared helper
    `resolve_project_root` (`.claude/skills/dispatch-propagate/scripts/lib.sh:1731-1735`
    — `git rev-parse --path-format=absolute --git-common-dir` → `dirname`; lib.sh
    is already sourced by `transition-node` at `:46`) to derive a MAIN-root path
    for ALL THREE stamp references (`:82`, `:93`, `:121`) so provision (write)
    and transition-node (read/refresh) agree on the file. Keep `REPO_ROOT` for
    its other uses; introduce a distinct variable (e.g.
    `MAIN_ROOT="$(resolve_project_root)"`) used for the stamp path only.
- **Out of scope.** Any SKILL.md; `compute-freshness.ts` (needs no change — it
  stays phase-agnostic; the fix is that transition-node reads the correct stamp
  path and does not demote main-qa); `provision-node-worktree` (already writes at
  the main root).
- **Dependencies.** None; independent of Units 1–2.

## Reuse

- `resolve_project_root` — `.claude/skills/dispatch-propagate/scripts/lib.sh:1731-1735`
  (git-common-dir → main project root). Already sourced by `transition-node` at
  `:46`. Use for gap (d)'s stamp path.
- `readExistingTacticBody` / body preservation —
  `packages/intentionsutil/src/store.ts:47,84-88`. The substrate that makes gap
  (b)'s post-write body append durable; cite it in the rewritten skill
  instructions so authors understand why the append survives.
- The sibling `status: raw` field convention —
  `.claude/skills/review-fix/SKILL.md:533-534` — the pattern gap (a) matches (the
  field, not the no-phase draft shape).
- The issue-lane re-entry check — `.claude/skills/review-fix/SKILL.md:162-173` —
  the exact pattern gap (e)'s node-lane check parallels.

## Verification

The pure transition/selection layer (which gaps c/d interact with) is covered by
TS tests; keep them green as a regression guard (baseline: 76 passing as of
2026-07-16):

```verify
npx vitest run --project packages/intentionsutil --root . transitions check-node-selection apply-node-transition write-node
```

The rest is docs + bash with no automated harness — verify functionally:

- **(a)** Following the corrected `qa-main` field list, a `write-node.ts` call
  with `kind`/`status`/`phase`/`owner`/`serves` succeeds (no
  `IntentionSchemaError`). Construct a throwaway node JSON with exactly the
  documented fields, confirm `write-node.ts` accepts it, then discard it (do NOT
  `graph-commit`).
- **(b)** After `write-node.ts` writes a tactic's frontmatter, editing
  `intentions/<id>.md`'s body and re-running a frontmatter-only `write-node.ts`
  preserves the hand-authored body (`store.ts` behavior, already covered by
  `write-node.test.ts`); confirm the rewritten skill prose matches that behavior.
- **(c)** Trace the branch: a scope-stale node at `phase: main-qa` is NOT demoted
  by `transition-node` (the guard skips the `demote-node-to-implement` call); a
  scope-stale node at `implement`/`fix`/`qa`/`review` still demotes.
- **(d)** Reproduce PR #2863's scenario: from inside `.claude/worktrees/<id>`,
  run `transition-node` on a provisioned node and confirm it reads the stamp that
  `provision-node-worktree` wrote at the MAIN root — `compute-freshness` reports
  the real freshness, not a false `stampMissing:true` /
  `held … (missing-stamp)`.
- **(a), (b), (e)** skill-prose changes: review against the
  `ref-write-instructions` skill (CLAUDE-config editing rules) and CI
  `run-lint.sh`.
