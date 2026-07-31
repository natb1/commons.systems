---
id: tactic-align-tactics-target-node-context-dropped
kind: tactic
statement: align-tactics.js's tactic-mode plan phase drops
  target_node.rationale, target_node.body, and target_node.phase entirely —
  buildPlanPrompt only ever sees the bare statement string, so a fresh
  finalize/re-plan round's plan-authoring agent never receives the node's own
  accumulated evidence, and target_node.phase (the documented
  finalize-vs-re-plan discriminator) is never read anywhere in the script
owner: ai
status: raw
parent: null
rationale: "Discovered 2026-07-31 during a tactic-target /align-tactics round on
  tactic-stopped-session-blocks-node, while assembling the Workflow args per
  SKILL.md/references/tactic-target.md's documented shape `target_node: { id,
  statement, rationale, body, phase }`. `grep -n \"target_node\\.\"
  .claude/workflows/align-tactics.js` returns exactly ONE hit, at the
  `targetSummary` line (`... : \"Finalize/re-plan the single tactic
  \\\"${(_a.target_node && _a.target_node.id) || '?'}\\\": ${(_a.target_node &&
  _a.target_node.statement) || ''}\"`). Tracing forward: `planTactics`
  (tactic-mode branch) constructs its one entry from only `t.id` and
  `t.statement`
  (temp_ref/slug_hint/statement/claude_eligible/draft_source_id/existing_id) —
  no rationale, no body. `buildPlanPrompt(strategy, tactic, gather)` embeds that
  object verbatim as the 'Tactic to plan' JSON block, so rationale/body never
  reach the plan agent's prompt, and nothing in the prompt instructs the agent
  to Read the node's own file from the worktree. Separately,
  `references/tactic-target.md` states `target_node.phase` is 'how the
  Workflow's tactic-mode prompts tell finalize from re-plan', and
  `references/write-path.md` repeats the same claim — but no code anywhere in
  align-tactics.js branches on `_a.target_node.phase`; the single grep hit above
  is for `.id`/`.statement` only. The finalize-vs-re-plan distinction the docs
  describe is therefore not implemented in the Workflow at all; whatever
  correctness exists today comes entirely from the SKILL-side apply-result
  writer choosing `phase` per its own documented rule, independent of anything
  the Workflow computed. For the round that discovered this, the gap was
  compensated per-invocation by directing a `reuse_hunts` entry to read the
  target node's own file directly and surface its content as gather-phase
  reuse-candidate notes (which DO reach `buildPlanPrompt` via the `gather`
  argument) — but that is a workaround an args-assembler must remember to add
  every time, not a fix, and a round that omits it silently produces a
  lower-quality plan with no error or park to signal the loss. Filed separately
  per the sole-tracker-recording convention (strategy condition: every defect
  lands as a tactic, never a side channel) rather than folded into the unrelated
  tactic whose round discovered it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Wave B of the bootstrap three-band interim scale (50/20/10): a real,
    verified pipeline-quality gap in /align-tactics' own tactic-mode plan
    authoring, but not a hard block — an args-assembling session can (and, for
    the discovering round, did) compensate per-invocation via an explicit
    reuse_hunt directing an agent to read the target node's own file, and no
    data is lost or corrupted, only silently thinned unless a caller remembers
    the workaround. Contrast Wave A (tactic-stopped-session-blocks-node): that
    gap silently voids a hard containment invariant with no workaround available
    to the affected session; this one degrades plan quality but is
    self-correctable by any competent caller who reads this node before invoking
    the Workflow. status stays raw and phase stays null so the selector emits it
    as a future /align-tactics candidate for planning."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# align-tactics.js tactic-mode drops target_node context

## The gap

`SKILL.md` and `references/tactic-target.md` document the tactic-mode Workflow
args shape as:

```
target_node: { id, statement, rationale, body, phase }
```

`.claude/workflows/align-tactics.js` never reads three of those five fields.

```bash
grep -n "target_node\." .claude/workflows/align-tactics.js
```

returns exactly **one** hit — the `targetSummary` line, which reads only
`_a.target_node.id` and `_a.target_node.statement`:

```js
mode === 'tactic'
  ? `Finalize/re-plan the single tactic "${(_a.target_node && _a.target_node.id) || '?'}": ${(_a.target_node && _a.target_node.statement) || ''}`
  : ...
```

Tracing forward from there:

- The `plan` phase's tactic-mode branch builds its one `planTactics` entry from
  only `t.id` and `t.statement` — `{ temp_ref, slug_hint, statement,
  claude_eligible, draft_source_id, existing_id }`. No `rationale`, no `body`.
- `buildPlanPrompt(strategy, tactic, gather)` embeds that object verbatim as
  the "Tactic to plan" JSON block. `rationale` and `body` — where a mature
  node's accumulated evidence, adjacent-node interaction analysis, and settled
  design questions actually live — never reach the plan agent's prompt.
- Nothing in the prompt tells the plan agent to `Read` the node's own file
  from the worktree, even though it is a `general-purpose` agent with full
  tool access and the node id is right there in the JSON it receives.

Separately, `references/tactic-target.md` states: "`target_node.phase` ...
is how the Workflow's tactic-mode prompts tell finalize from re-plan."
`references/write-path.md` repeats the claim. But the single grep hit above is
the *only* place `target_node` is dereferenced in the whole file — nothing
branches on `.phase`. The finalize-vs-re-plan distinction the docs describe is
not implemented in the Workflow at all. Today's correctness (when it holds)
comes entirely from the SKILL-side apply-result writer choosing `phase` from
its own separately-read copy of the node, independent of anything the Workflow
computed.

## Impact

A tactic-mode round's plan quality depends on the node's `rationale`/`body`
substance reaching the plan-authoring agent. Today it does not, unless the
args-assembling session notices and compensates — e.g. by pointing a
`reuse_hunts` entry at the node's own file so a gather-phase agent transcribes
its content into `gather.reuse` (which *does* reach `buildPlanPrompt`). That
compensation is a per-invocation workaround an author must remember every
time; a round that omits it silently produces a thinner plan with no error,
park, or other signal that context was lost.

## Discovery

Found 2026-07-31 while assembling the Workflow args for a tactic-target
`/align-tactics` round on [[tactic-stopped-session-blocks-node]]. Filed as a
separate node per the sole-tracker-recording convention (every defect lands as
a tactic, never a side channel) rather than folded into that unrelated
round's own node.

## Not yet decided (leave to the planning round)

- Whether to thread `rationale`/`body` through `planTactics`/`buildPlanPrompt`
  directly, or instead have `buildPlanPrompt` instruct the agent to `Read
  intentions/<id>.md` itself (cheaper diff, but relies on the agent actually
  doing it).
- Whether to implement the documented `target_node.phase` finalize-vs-re-plan
  branch inside the Workflow, or formally retire that claim from
  `references/tactic-target.md` / `references/write-path.md` if the
  SKILL-side writer choosing `phase` independently is considered sufficient
  and the docs are simply stale.
- Whether the same gap exists on the `gather`/`drift` phases' `targetSummary`
  usage for strategy mode (out of scope to check here — this node is scoped to
  the tactic-mode `target_node` shape only).
