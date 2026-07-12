---
id: tactic-graph-node-lane-write-hardening
kind: tactic
statement: "Harden the graph node-authoring and transition convention, three
  gaps surfaced by /review-fix on PR #2859 (serves
  strategy-graph-native-dispatch). (a) The qa-main SKILL.md broken-path bug-node
  field list (kind/phase/owner/serves) omits the schema-required status field;
  validateNode requires status with no default, so following the doc literally
  makes write-node.ts throw IntentionSchemaError -- add status: raw, matching
  the sibling review-fix node lane. (b) Both the qa-main and review-fix node
  lanes document a body field that records provenance, but store.ts writeNode
  renders a new node body from the statement as a single heading and
  validateNode drops unknown keys, so a passed body field is silently discarded
  and the documented provenance is lost; resolve this body-provenance gap across
  BOTH lanes (carry provenance in the statement, or append the body to
  intentions/<id>.md after write-node.ts runs). (c)
  .claude/skills/dispatch-propagate/scripts/transition-node line 130 demotes ANY
  scope-stale node to implement, and compute-freshness has no main-qa exclusion,
  so a scope-stale main-qa node -- now reachable because PR #2859 activates the
  phase -- would be wrongly demoted to implement and re-run the ladder on
  already-merged work, contradicting decideTransition's contract and
  check-node-selection's main-qa exclusion; phase-gate the demotion. Low trigger
  probability (provisioning writes a fresh stamp) but a real latent gap."
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
# Harden the graph node-authoring and transition convention, three gaps surfaced by /review-fix on PR #2859 (serves strategy-graph-native-dispatch). (a) The qa-main SKILL.md broken-path bug-node field list (kind/phase/owner/serves) omits the schema-required status field; validateNode requires status with no default, so following the doc literally makes write-node.ts throw IntentionSchemaError -- add status: raw, matching the sibling review-fix node lane. (b) Both the qa-main and review-fix node lanes document a body field that records provenance, but store.ts writeNode renders a new node body from the statement as a single heading and validateNode drops unknown keys, so a passed body field is silently discarded and the documented provenance is lost; resolve this body-provenance gap across BOTH lanes (carry provenance in the statement, or append the body to intentions/<id>.md after write-node.ts runs). (c) .claude/skills/dispatch-propagate/scripts/transition-node line 130 demotes ANY scope-stale node to implement, and compute-freshness has no main-qa exclusion, so a scope-stale main-qa node -- now reachable because PR #2859 activates the phase -- would be wrongly demoted to implement and re-run the ladder on already-merged work, contradicting decideTransition's contract and check-node-selection's main-qa exclusion; phase-gate the demotion. Low trigger probability (provisioning writes a fresh stamp) but a real latent gap.

## Provenance

Surfaced by `/review-fix` (`/code-review max`) on PR #2859 — the main-qa phase
adoption. Three node-lane node-authoring/transition gaps: a real missing-field
defect (a), a systemic body-provenance gap shared with the already-merged
review-fix node lane (b), and a latent scope-stale demotion gap now reachable
because this PR activates the phase (c).

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
