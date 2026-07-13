---
id: tactic-graph-node-lane-write-hardening
kind: tactic
statement: 'Harden the graph node-authoring and transition convention, four gaps
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
  review->merge arming point fails closed with "held ... (missing-stamp)" even
  though the stamp is valid (scope fingerprint covers statement+body, unchanged
  by a park). Worked around live on PR #2863 by copying the stamp to the
  worktree-nested path and re-running. Fix: resolve the stamp against the shared
  main project root (git common dir), not the invoking worktree, so provision
  and transition-node agree on the path.'
owner: ai
status: raw
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
# Harden the graph node-authoring and transition convention

Four gaps in the node-lane node-authoring/transition convention, surfaced by
`/review-fix`. The full gap list is the frontmatter `statement`; this body
carries the per-gap provenance and fix detail.

## Provenance

Gaps (a)–(c) surfaced by `/review-fix` (`/code-review max`) on PR #2859 — the
main-qa phase adoption: a real missing-field defect (a), a systemic
body-provenance gap shared with the already-merged review-fix node lane (b), and
a latent scope-stale demotion gap made reachable when that PR activates the
phase (c). Gap (d) surfaced completing PR #2863's node-lane review — the
first-ever node-lane `review` completion driven from a worktree, which is why
its transition-node stamp-path mismatch had never been exercised before.

### (a) qa-main SKILL.md broken-path node omits the required `status` field (in PR diff)

- The broken-path bug-node field list documents `kind`/`phase`/`owner`/`serves`
  but omits `status`. `validateNode` (packages/intentionsutil/src/schema.js)
  requires `status` with no default, so following the doc literally makes
  `write-node.ts` throw `IntentionSchemaError`.
- Fix: add `status: raw` to the documented field list, as the sibling
  `/review-fix` node lane already names.

### (b) Documented `body` provenance is unachievable via write-node.ts (in diff; SYSTEMIC)

- `store.ts writeNode` generates a brand-new node's body as `# ${statement}`, and
  `validateNode` drops unknown keys, so a `body` field passed to `write-node.ts`
  is silently discarded — the documented provenance is lost.
- Present in BOTH the qa-main node lane (this PR) and the already-merged
  `/review-fix` node lane, so this is a systemic convention issue, not unique to
  #2859.
- Fix across both lanes: carry provenance in the `statement`, or append the body
  to `intentions/<id>.md` after `write-node.ts` (store.ts preserves an existing
  hand-authored tactic body on subsequent writes).

### (c) transition-node scope-stale demotion is not phase-gated (out of scope; pre-existing, newly reachable)

- `.claude/skills/dispatch-propagate/scripts/transition-node:130` demotes ANY
  scope-stale node to `implement`; `compute-freshness` has no main-qa exclusion.
- A scope-stale `main-qa` node — now reachable because this PR activates the
  phase — would be wrongly demoted to `implement`, re-running the ladder on
  already-merged work, contradicting `decideTransition`'s contract and
  `check-node-selection`'s main-qa exclusion.
- Low trigger probability (provisioning writes a fresh stamp) but a real latent
  gap; phase-gate the demotion.

### (d) transition-node reads the phase-start stamp at the wrong root from a worktree (pre-existing; first exercised on PR #2863)

- `transition-node` resolves `REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"`
  from its own script location. Run from inside a `.claude/worktrees/<id>`
  worktree (as `/review-fix`'s node-lane completion does), that resolves to the
  **worktree** root, so it reads the phase-start scope-fingerprint stamp at
  `<worktree>/.claude/worktrees/<id>.scope-fingerprint`.
- But `provision-node-worktree` (`STAMP_PATH="$PROJECT_ROOT/.claude/worktrees/<id>.scope-fingerprint"`)
  writes that stamp at the **main** project root. The two paths diverge because
  the graph worktrees are nested under the main repo's `.claude/worktrees/`, so
  the stamp the provisioner wrote is invisible to the worktree-run reader.
- Effect: `compute-freshness` reports `stampMissing:true`, and the review→merge
  arming point fails **closed** (`held <id> at review (missing-stamp)`) even
  though the stamp is valid — the scope fingerprint covers `statement + body`,
  which a park does not change. So a clean review cannot arm merge.
- First hit completing PR #2863's node-lane review (the first-ever node-lane
  `review` completion, so never previously exercised). Worked around live by
  copying the stamp to the worktree-nested path and re-running `transition-node`
  — the freshness comparison still ran for real; only the false `stampMissing`
  was corrected.
- Fix: resolve the stamp against the shared main project root (the git common
  dir), not the invoking worktree, so `provision-node-worktree` and
  `transition-node` agree on the path. (Alternative — running transition-node
  from a main-based checkout so `REPO_ROOT`=main — mutates the user's main
  checkout tree and is riskier under a background job.)
