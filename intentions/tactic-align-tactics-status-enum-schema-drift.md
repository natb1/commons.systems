---
id: tactic-align-tactics-status-enum-schema-drift
kind: tactic
statement: "align-tactics.js's DECOMPOSE_SCHEMA status enum disagrees with the
  graph in both directions — it admits `draft`, which rule 16 rejects because
  kind-tactic's status_vocabulary has no such key, and omits `refining`, which
  is a declared key in live use — so the workflow can emit a tactic the store
  refuses; align the workflow's enum (and the adjacent owner enum, broken the
  same way) to the kind node's declared vocabulary"
owner: ai
status: raw
parent: null
rationale: >-
  Filed 2026-08-31 from a read-only sweep of `origin/main` at `2d5faa71`. The
  defect is a duplicated vocabulary: `packages/intentionsutil/src/schema.ts`
  treats the kind node's `attributes.status_vocabulary` as the single authority
  (its header says so at `:20` — "not a central enum in code"), while
  `.claude/workflows/align-tactics.js` carries its own hand-written copy in the
  structured-output schema it hands the decompose subagent. The two copies have
  drifted apart in both directions at once, which is why neither a
  validate-graph run nor a workflow run surfaces it on its own: the workflow
  never emits `refining` because its schema forbids it, and it emits `draft`
  only on the rarely-taken fully-superseded path, where the failure lands as a
  write-time validation error far from its cause.


  Filed as a node rather than fixed in place because the fix is a code change to
  a workflow with its own test surface, and the sweep that found it was a
  graph-body landing carrying no code diff. Folding a schema repair into that
  batch would have widened a zero-round graph landing into a reviewed PR.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Is `status` the only field of DECOMPOSE_SCHEMA that disagrees with
      the graph's own vocabulary?
    answer: "No — `owner` is broken the same way, one line above. Measured
      2026-08-31 at `origin/main` `2d5faa71`: `.claude/workflows/align-tactics.js:247`
      declares `owner: { enum: ['claude', 'human'] }`, while
      `packages/intentionsutil/src/schema.ts:15` declares `OWNERS = [\"human\",
      \"ai\", \"procedure\"]` and enforces it at `:1118` via
      `requireOneOf(value.owner, OWNERS, \"owner\")`. So the workflow admits
      `claude`, which the store rejects, and omits `ai` and `procedure`, which
      it accepts. A frontmatter census of all 676 tactic nodes under
      `intentions/` at the same sha gives `owner` = 541 `ai` / 135 `human` and
      zero `claude`, and `status` = 354 `codified` / 241 `raw` / 79 `delegated`
      / 2 `refining` and zero `draft` — both enums are inverted against actual
      use. `SKILL.md` documents no translation layer between the workflow's
      return value and the node write (`.claude/skills/align-tactics/SKILL.md:349-353`
      lists `kind/owner/status/...` as passed through), so nothing downstream
      repairs either value. Both fields are in this node's scope; do not fix one
      and leave the other."
  - question: Is `draft` simply a legal value the graph forgot to declare?
    answer: "No. Measured 2026-08-31 at `origin/main` `2d5faa71`: `draft` is
      legal as a **phase** and illegal as a **status**, and the workflow
      conflates them. The phase vocabulary is documented in the
      workflow itself at `.claude/workflows/align-tactics.js:544-545` — `draft |
      align-tactics | implement | qa | review | main-qa | done` — and read at
      `:553` (`const isFinalize = phase === '' || phase === 'draft'`). That usage
      is correct and must not be touched. What is wrong is the STATUS enum at
      `:248` and the prose at `:884` that drives it (\"a FULLY superseded tactic
      demotes to draft (status \\\"draft\\\")\"). Fixing the enum without fixing
      that sentence leaves the workflow instructing an agent to produce a value
      its own schema now forbids, which converts a store-level rejection into a
      structured-output rejection — no better."
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
# align-tactics.js's DECOMPOSE_SCHEMA status enum disagrees with the graph in both directions — it admits `draft`, which rule 16 rejects because kind-tactic's status_vocabulary has no such key, and omits `refining`, which is a declared key in live use — so the workflow can emit a tactic the store refuses; align the workflow's enum (and the adjacent owner enum, broken the same way) to the kind node's declared vocabulary

## Context

The graph keeps each kind's legal `status` values on the kind node, not in code.
`packages/intentionsutil/src/schema.ts:20` states the doctrine outright — the
vocabulary lives in "the kind node's `attributes.status_vocabulary`, not a
central enum in code" — and graph rule 16 enforces it:

- implementation: `packages/intentionsutil/src/schema.ts:1330`
  (`/** Rule 16: status must be a key in the kind node's status_vocabulary. */`),
  reading `kindNode.attributes.status_vocabulary` at `:1338`;
- failure message at `:1343`:
  `<id>: status "<v>" is not declared in kind-<kind>'s status_vocabulary`;
- documented in the rule list at `:1750-1751`; dispatched at `:1872`.

`intentions/kind-tactic.md:121` declares exactly four keys:

```
status_vocabulary:
  raw: not yet dialectically examined
  refining: under active dialectic
  delegated: Claude-authored on trust; the decisions remain the author's
  codified: the plan is written and the tactic is ready to dispatch — the author
    has settled its execution plan
```

`.claude/workflows/align-tactics.js:248` declares a second, hand-written copy:

```js
status: { enum: ['codified', 'delegated', 'draft', 'raw'] },
```

It is wrong on **both** sides:

- **It admits `draft`.** `draft` is not a key of `status_vocabulary`, so any
  node the workflow emits with `status: "draft"` is rejected by rule 16 at write
  time.
- **It omits `refining`.** `refining` is a declared key and is in live use, so
  the decompose subagent is structurally unable to return it — the workflow
  cannot express a tactic that is under active dialectic.

The bad value has a producer, not just a permission: the decomposition prompt at
`.claude/workflows/align-tactics.js:884` instructs the agent that "a FULLY
superseded tactic demotes to draft (status \"draft\") instead of landing
implement." The enum at `:248` is what lets that instruction through.

The enum is load-bearing rather than documentary. `DECOMPOSE_SCHEMA` is declared
at `:216` and passed as the structured-output schema of the decompose subagent at
`:1187` (`schema: DECOMPOSE_SCHEMA`), and `.claude/skills/align-tactics/SKILL.md:349-353`
shows the returned `kind/owner/status/serves/...` fields flowing straight to the
node write with no translation layer.

`owner` on the line above (`:247`) is broken identically — see clarification 1.

**Why it has not fired loudly.** The two directions hide each other. The omitted
value can never be emitted, so its absence is invisible; the admitted value is
emitted only on the fully-superseded demotion path, where it surfaces as a
write-time validation failure a long way from the schema that permitted it.

## Unit 1 — align the two enums to the graph's declared vocabulary

**Recommended model: sonnet.** Two enum literals and one prose sentence, each
with a measured target value; no design judgment.

**Scope.** `.claude/workflows/align-tactics.js` only.

- `:248` — replace the `status` enum with the four keys `kind-tactic.md:121`
  declares: `['codified', 'delegated', 'raw', 'refining']`. `draft` goes,
  `refining` arrives.
- `:247` — replace the `owner` enum with `OWNERS` from
  `packages/intentionsutil/src/schema.ts:15`: `['human', 'ai', 'procedure']`.
  `claude` goes.
- `:884` — rewrite the demotion sentence so it no longer names a status the
  schema forbids. The behaviour it describes (a fully superseded tactic is not
  landed as `implement`) is correct; only the status it names is wrong. Pick the
  replacement from the vocabulary — `raw` is the "not yet dialectically
  examined" state and is what a demoted, undecomposed tactic is.
- Sweep the rest of the file for any other prose naming `status "draft"` before
  concluding `:884` is the only producer.

**Out of scope.** The `phase` vocabulary and every read of it — `:544-545`,
`:553` (`phase === 'draft'`) — are correct and must not be touched. `draft` is a
legal phase. Do not change `packages/intentionsutil/src/schema.ts` or
`intentions/kind-tactic.md`: the kind node is the authority and it is right.

**Anchors drift.** Re-derive `:247`, `:248`, `:884` against `origin/main` before
editing; they were measured at `2d5faa71`.

## Dependencies

None.

## Reuse

- `packages/intentionsutil/src/schema.ts:15` — `OWNERS`, the owner authority.
- `intentions/kind-tactic.md:121-126` — `status_vocabulary`, the status
  authority.
- `packages/intentionsutil/src/schema.ts:1330-1343` — rule 16, the enforcement
  this aligns to.
- `.claude/skills/align-tactics/references/tactic-target.md` — the draft/raw
  finalize doctrine `:539` splices, for the wording of the `:884` rewrite.

## Verification

The enums now match the graph's declared vocabularies exactly:

```verify
grep -n "status: { enum: \['codified', 'delegated', 'raw', 'refining'\] }" .claude/workflows/align-tactics.js || exit 1
grep -n "owner: { enum: \['human', 'ai', 'procedure'\] }" .claude/workflows/align-tactics.js || exit 1
if grep -n "'draft'" .claude/workflows/align-tactics.js | grep -n "enum"; then echo "FAIL: a schema enum still admits draft"; exit 1; fi
```

The file still parses and the graph still validates:

```verify
node --check .claude/workflows/align-tactics.js || exit 1
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions || exit 1
npx vitest run --project packages/intentionsutil --root .
```

The workflow's own suites still pass:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-align-tactics-target-context.sh
```

Manual: the phase reads at `:544-545` and `:553` still say `draft`, unchanged —
confirm by eye that the diff touches no `phase` comparison.
