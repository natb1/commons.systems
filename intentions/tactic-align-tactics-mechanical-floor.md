---
id: tactic-align-tactics-mechanical-floor
kind: tactic
statement: "mechanical floor for /align-tactics: plan-schema body lint in the
  validate gate and a child-tactic census script"
owner: ai
status: codified
parent: null
rationale: "Strategy clarification 32 (2026-07-06): the repeated re-refinement
  of doctrine-encoding tactics was systemic — no mechanical rule defines a
  fully-fleshed-out plan body, and the idempotency classification greps
  false-matched a spec-carrier body during the same rounds. This tactic backs
  the amendment-completeness doctrine with machinery: a plan-schema body lint on
  phase-set tactics wired into the single validate gate, and a census script
  that makes child-tactic enumeration and classification deterministic. Off-path
  (no validates chain), so calculated attention demotes it below round tactics."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-align-skills-greenfield-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# mechanical floor for /align-tactics: plan-schema body lint in the validate gate and a child-tactic census script

Off-path: no `validates` chain reaches this node, so calculated attention
demotes it below round tactics at read time. One PR.

## Context

Strategy clarification 32 (2026-07-06) diagnosed the repeated same-day
re-refinement of `tactic-align-skills-greenfield-gate` as systemic, not
one-off. Two of its causes have mechanical fixes:

- **No floor for "fully fleshed out".** `validateGraph` never inspects a
  tactic's markdown body (`packages/intentionsutil/src/schema.ts:93` — the
  body is "a cosmetic render"), yet for tactics the body is the
  authoritative plan and the sole carrier into the `implement` phase. A
  `phase: implement` tactic with no `## Context`, no unit model tags, and
  no `## Verification` currently validates clean.
- **Lossy enumeration.** `/align-tactics`'s idempotency step is a hand-run
  grep/classify dance over `serves` block sequences; during the 2026-07-06
  rounds it false-matched a spec-carrier body and shortlisted open tactics
  by keyword, missing an indirectly-affected one. A script makes step 0
  deterministic; the semantic judgment stays with the session.

The skill-text encoding of the amendment-completeness doctrine itself
(whole-node reconciliation, full-body re-read) is homed in
`tactic-align-skills-greenfield-gate` Unit 2, not here.

## Unit 1 — plan-schema body lint in the validate gate

**Recommended model:** opus

Scope:
- New `packages/intentionsutil/src/planlint.ts` exporting
  `lintTacticBodies(dir, nodes)` that throws `IntentionSchemaError`
  (`packages/intentionsutil/src/errors.ts`), matching `validateGraph`'s
  failure style. For every `kind: "tactic"` node whose `phase` is
  `implement`, `fix`, `qa`, or `review` (the post-plan, pre-`done`
  lifecycle — `PHASES` at `packages/intentionsutil/src/schema.ts:33`), read
  the node's raw markdown body and require three plan-schema markers: a
  `## Context` heading, at least one `**Recommended model:**` line, and a
  `## Verification` heading. Exempt `phase` null/`draft`/`align-tactics`
  (not yet planned) and `done` (historical).
- Body access: `readNode`/`listNodes` deliberately drop the body
  (`packages/intentionsutil/src/store.ts:72`); reuse the fence-splitting
  logic of `extractBody` (`packages/intentionsutil/src/store.ts:58`) —
  export it or a thin `readNodeBody(dir, id)` beside it rather than
  re-parsing ad hoc.
- Wire the call into `packages/intentionsutil/scripts/validate-graph.ts`
  after `validateGraph(nodes)`, so `graph-commit` and the `graph/**` CI
  fast path both enforce it. `schema.ts`'s frontmatter-only contract is
  unchanged — the lint lives beside it, taking the store dir.
- Sweep the live store first: run the lint over `intentions/` and fix any
  violating node in this PR (state follow-through) rather than weakening
  the rule. If a violation is legitimately not a plan (e.g. a spec-carrier
  tactic), bring it to a compliant shape or record the exemption as an
  explicit named rule in `planlint.ts` — never a silent skip.
- Tests: new `packages/intentionsutil/test/planlint.test.ts` — accepts a
  compliant body, rejects each missing marker (error names the node and
  the marker), exempts each exempt phase.

Out of scope: enforcing `office_hours.recommendation` presence on parks
(condition 6) — that waits on the field landing in `schema.ts`
(`tactic-office-hours-graph-entry` Unit 1 /
`tactic-phase-skill-node-targets` Unit 2, shared skip-if-present).

## Unit 2 — child-tactic census script

**Recommended model:** sonnet

Depends on: Unit 1 (the shared body reader).

Scope: new `packages/intentionsutil/scripts/align-tactics-census.ts`,
usage `npx tsx packages/intentionsutil/scripts/align-tactics-census.ts
<strategy-id> [intentionsDir]` (dir defaulting to `intentions`, matching
`validate-graph.ts`). Using `listNodes`
(`packages/intentionsutil/src/store.ts:88`):
- Resolve the argument to a `kind: strategy` node; exit non-zero with a
  clear usage/error message on a missing argument or an unknown or
  non-strategy id — no fallback.
- For every `kind: tactic` node whose `serves` includes the strategy id,
  print one block: id, classification, `phase`, the first line of
  `office_hours.reason` when parked, `statement`, and the body's `## `
  headings (via the Unit 1 body reader) — so a re-evaluation pass sees
  each child's actual units, not a keyword match.
- Classification is exactly the skill's idempotency taxonomy: `draft`
  (`phase` absent or `draft`, `office_hours` null), `born-parked` (`phase`
  absent, `office_hours` set), `open` (`phase` set, not `done`), `done`.

## Unit 3 — /align-tactics SKILL.md census hook

**Recommended model:** sonnet

Depends on: Unit 2.

Scope: `.claude/skills/align-tactics/SKILL.md`, Idempotency section —
replace the hand-run grep/classify prescription (the
`grep -rl '^  - <strategy-id>$' intentions/tactic-*.md` dance and the
per-candidate phase reads) with the census invocation, keeping the
taxonomy prose (draft vs born-parked vs open vs done, and what each means
for the round) as the interpretation guide. The tactic-level `blocked_by`
on `tactic-align-skills-greenfield-gate` sequences this behind that
tactic's edits to the same file.

Landing note: `.claude/skills/**` edits are agent-behavior config —
dispatch auto mode blocks the commit (not the edit); if the worker hits
that denial, park for an interactive session to land the PR.

## Reuse

- `listNodes` / `readNode` — `packages/intentionsutil/src/store.ts:88` /
  `:74`.
- `extractBody` fence-splitting — `packages/intentionsutil/src/store.ts:58`.
- `IntentionSchemaError` — `packages/intentionsutil/src/errors.ts`.
- Script shape (positional dir default, throw-propagation, `ok — N nodes`
  style) — `packages/intentionsutil/scripts/validate-graph.ts`.
- Test conventions — `packages/intentionsutil/test/store.test.ts`,
  `packages/intentionsutil/test/schema.test.ts`.

## Dependencies

- `blocked_by: tactic-align-skills-greenfield-gate` — Unit 3 edits the
  same SKILL.md that tactic rewrites; land the doctrine text first.
- `tactic-graph-write-validation-hardening` (PR #2775, at review) touches
  `store.ts` and its tests — no scope overlap; expect at most a trivial
  rebase if it merges first.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
npx tsx packages/intentionsutil/scripts/align-tactics-census.ts strategy-graph-native-dispatch intentions | grep -q "tactic-align-tactics-mechanical-floor"
```

Manual: in a scratch checkout, blank a planned tactic's body sections and
confirm `validate-graph.ts` exits non-zero naming the node and the missing
marker; confirm the census exits non-zero on an unknown strategy id.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
