---
id: tactic-align-tactics-mechanical-floor
kind: tactic
statement: "mechanical floor for the align skills: plan-schema body lint and
  clarification-provenance lint in the validate gate, plus child-tactic and
  strategy-corpus census scripts"
owner: ai
status: codified
parent: null
rationale: "Strategy clarification 32 (2026-07-06): the repeated re-refinement
  of doctrine-encoding tactics was systemic — no mechanical rule defines a
  fully-fleshed-out plan body, and the idempotency classification greps
  false-matched a spec-carrier body during the same rounds. The same-day
  /align-strategy skill evaluation (clarification 38) extended the diagnosis to
  the strategy side: the improvement pass hand-reads a 42-node strategy corpus
  including a pure set-difference (unserved virtues), new-vs-edit overlap
  detection uses keyword grep as the disposition mechanism, and the
  clarification provenance-sentence convention is prose-only. This tactic backs
  the amendment-completeness doctrine with machinery: plan-schema body and
  provenance lints on the single validate gate, plus census scripts that make
  child-tactic and strategy-corpus enumeration deterministic. Off-path (no
  validates chain), so calculated attention demotes it below round tactics."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 (refined): tactics that directly edit
    .claude/skills/align-strategy/SKILL.md or
    .claude/skills/align-tactics/SKILL.md content rank above the rest of
    strategy-graph-native-dispatch's subtree (boost 3, added on top of the
    strategy's own boost 5, authored 8) — above curriculum-execution tooling
    (boost 7) and above every other tactic in this strategy's subtree (inherited
    5, unboosted)."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Unit 1's provenance lint is unimplementable as specified by an
    autonomous off-path worker, and it is one plan / one PR, so the whole node
    parks. Plan spec: every clarifications[].answer must END with a trailing
    \"Recorded YYYY-MM-DD\" sentence (explicitly \"trailing-sentence position,
    not merely anywhere in the string\"), then sweep the live store fixing every
    violation or recording a named exemption. Sweep result over intentions/: 27
    violations, ALL author-owned goal-layer nodes (virtue/strategy/kind), ZERO
    tactics; undated=0 — every answer already carries a dated provenance clause.
    The corpus's actual established convention front-loads provenance as a
    parenthetical with varied verbs (Recorded / Amended / clarified / Reviewed /
    adopted) and ends each answer with its substantive conclusion, not a
    trailing Recorded sentence; both the align SKILL.md doctrine and this plan
    describe a trailing-Recorded convention the corpus never followed (a
    doctrine-vs-corpus mismatch). Enforcing the spec literally means
    autonomously rewriting 27 rich author-owned philosophical dialectic records
    (e.g. virtue-respect-for-persons' Kant/Aristotle clarification,
    strategy-philosophical-grounding's periagoge answers) to append redundant
    trailing dates — out of an off-path worker's remit; loosening the rule to
    \"a date present anywhere\" is an align-layer doctrine decision the plan
    explicitly forbids, not a lint tweak to slip in because it makes the sweep
    green. The Unit 1 body lint (Context + Recommended-model + Verification
    markers) IS sound and tractable: 15 body violations — 13 are main-qa
    follow-up tactics missing **Recommended model:** (a distinct
    needs-main-verification category, a named-exemption candidate) and ~2 are
    genuinely under-specified tactic plans (e.g. tactic-budget-txn-identity
    missing ## Verification) the lint should legitimately catch and fix in-PR.
    Units 2-5 (child-tactic + strategy-corpus census scripts and the two
    SKILL.md census hooks) are unaffected by the defect. Next steps: run
    /align-tactics on tactic-align-tactics-mechanical-floor (serving
    strategy-graph-native-dispatch) to re-spec Unit 1's provenance lint before a
    fresh worker re-implements the whole plan — decide among (a) scope the
    provenance rule to tactic nodes only, (b) split provenance into its own
    tactic so the tractable body lint + census scripts (Units 2-5) ship now, (c)
    sweep goal-layer records only under explicit author review rather than
    autonomously; also decide the body-lint main-qa named exemption vs requiring
    model tags on those 13 follow-ups; and flag the trailing-Recorded
    doctrine-vs-corpus mismatch for possible align-strategy attention. Gate and
    dependency were clean and need no re-litigation: null
    execution.strategy_fingerprint (a null stamp is never stale) and
    blocked_by:[] is legitimate (tactic-align-skills-greenfield-gate #2789
    merged and pruned, dropping the inbound edge). No partial work was committed
    and no PR was opened — the node worktree is clean."
  since: 2026-07-09
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# mechanical floor for the align skills: plan-schema and provenance lints in the validate gate, plus child-tactic and strategy-corpus census scripts

Off-path: no `validates` chain reaches this node, so calculated attention
demotes it below round tactics at read time. One PR.

## Context

Strategy clarification 32 (2026-07-06) diagnosed the repeated same-day
re-refinement of `tactic-align-skills-greenfield-gate` as systemic, not
one-off; the same-day `/align-strategy` skill evaluation (clarification 38)
extended the diagnosis to the strategy side. The causes with mechanical
fixes:

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
- **Hand-run strategy-corpus enumeration.** `/align-strategy`'s
  improvement pass prescribes reading every `strategy-*.md` inline — 42
  nodes / ~3,200 lines at evaluation time — and computing the
  unserved-virtues listing (a pure set difference over `serves` arrays) by
  hand; its Step 1.2 new-vs-edit overlap detection and Step 3 delegation
  sweep use keyword grep as the disposition mechanism, the same
  enumeration-honesty defect clarification 32 named.
- **Unlinted provenance convention.** Every `clarifications[].answer` must
  end with a dated provenance sentence (`"...Recorded YYYY-MM-DD ..."`),
  but `schema.ts` validates only the `{question, answer}` shape
  (`validateClarifications`,
  `packages/intentionsutil/src/schema.ts:443`) — the convention is
  prose-only.

The skill-text encoding of the amendment-completeness doctrine itself
(whole-node reconciliation, full-body re-read, the clarification-38
widening to strategy edits) is homed in
`tactic-align-skills-greenfield-gate` Units 1–2, not here.

## Unit 1 — plan-schema body and provenance lints in the validate gate

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
- Provenance lint, same module and same gate: a second exported rule
  requiring every `clarifications[].answer` on **any** node kind to end
  with a provenance sentence matching `/Recorded \d{4}-\d{2}-\d{2}/`
  (trailing-sentence position, not merely anywhere in the string). Sweep
  the live store the same way — fix violating entries in this PR or record
  an explicit named exemption in `planlint.ts`, never a silent skip.
- Tests: new `packages/intentionsutil/test/planlint.test.ts` — accepts a
  compliant body, rejects each missing marker (error names the node and
  the marker), exempts each exempt phase; accepts a provenance-suffixed
  clarification and rejects an unsuffixed one (error names the node and
  the clarification index).

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

## Unit 4 — strategy-corpus census script

**Recommended model:** sonnet

Scope: new `packages/intentionsutil/scripts/align-strategy-census.ts`,
usage `npx tsx packages/intentionsutil/scripts/align-strategy-census.ts
[intentionsDir]` (dir defaulting to `intentions`, matching
`validate-graph.ts`; no strategy argument — it dumps the whole corpus).
Using `listNodes` (`packages/intentionsutil/src/store.ts:88`), frontmatter
only — no body reader needed:
- For every `kind: strategy` node, print one block: id, `statement`,
  `serves`, `office_hours` (first line of `reason` when parked),
  `attributes.conditions`, `reading`, `gap`, and the `Recorded YYYY-MM-DD`
  dates extracted from each clarification answer (count + date list, not
  full text) — the improvement pass's staleness checks read this dump
  instead of every file.
- **Unserved virtues** section: every `kind: virtue` id appearing in no
  strategy's `serves` — the pure set difference the skill currently asks
  the session to compute by hand.
- **Delegations** section: every `kind: delegation` node's id,
  `statement`, `attributes.delegated`, `attributes.divergence.level`, and
  `attributes.irreversibility.{gated,recovery_cost}` — the Step 3 sweep's
  corpus.
- Enumeration only: no staleness or overlap judgment in the script — that
  stays with the session (same split as Unit 2).

## Unit 5 — /align-strategy SKILL.md census hook

**Recommended model:** sonnet

Depends on: Unit 4. The tactic-level `blocked_by` on
`tactic-align-skills-greenfield-gate` sequences this behind that tactic's
edits to the same file (same arrangement as Unit 3).

Scope: `.claude/skills/align-strategy/SKILL.md`:
- Step 1 improvement-pass branch: replace the "read every
  `intentions/strategy-*.md` node" enumeration prescription with the Unit 4
  census invocation, keeping the staleness-judgment prose (which checks to
  run against the dump, and that shortlisted nodes are read in full before
  disposition).
- Step 1.2 (new-vs-edit overlap): the census statement dump is the
  disposition corpus — keyword grep only shortlists; a match still gets a
  full-node read.
- Step 3 (delegation advice): source the sweep from the census
  delegations section instead of a fresh grep.

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

- `blocked_by: tactic-align-skills-greenfield-gate` — Units 3 and 5 edit
  the same SKILL.md files that tactic rewrites; land the doctrine text
  first.
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

```verify
npx tsx packages/intentionsutil/scripts/align-strategy-census.ts intentions | grep -q "strategy-graph-native-dispatch"
```

Manual: in a scratch checkout, blank a planned tactic's body sections and
confirm `validate-graph.ts` exits non-zero naming the node and the missing
marker; strip a clarification's provenance sentence and confirm the same;
confirm the child-tactic census exits non-zero on an unknown strategy id;
confirm the strategy census's unserved-virtues section lists exactly the
virtue ids absent from every strategy's `serves`.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
