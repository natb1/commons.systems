---
id: tactic-align-tactics-mechanical-floor
kind: tactic
statement: "mechanical floor for the align skills: plan-schema body lint in the
  validate gate, plus child-tactic and strategy-corpus census scripts"
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
  the amendment-completeness doctrine with machinery: a plan-schema body lint on
  the single validate gate, plus census scripts that make child-tactic and
  strategy-corpus enumeration deterministic. Off-path (no validates chain), so
  calculated attention demotes it below round tactics. The provenance lint
  originally scoped here split to tactic-align-provenance-lint-doctrine
  (2026-07-18 re-plan, see clarifications) because enforcing it exposed a
  doctrine-vs-corpus mismatch only the author can resolve."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Unit 1 was parked 2026-07-09 because its combined body+provenance lint
      was unimplementable as specified. How should it be re-spec'd?
    answer: "(Recorded 2026-07-18 /align-tactics per-node re-plan round.) Split in
      two. This node keeps only the plan-schema body lint, rescoped for corpus
      reality found on re-investigation: (1) the marker checks are
      format-tolerant — Context/Verification match by heading prefix so
      'Verification checklist' still counts, and the Recommended-model check
      matches 'recommended model' case-insensitively anywhere in the body, not
      only the literal bold '**Recommended model:**' string, because the live
      corpus already uses several accepted formats (e.g.
      tactic-demo-saas-acceptance.md's '- **Recommended model**: sonnet',
      tactic-node-toolchain-single-source.md's 'Recommended model: opus') that a
      literal-bold match would false-flag. (2) A named exemption from the
      Recommended-model check only (Context and Verification stay required) for
      tactic ids matching tactic-mainqa-* — the 12 legacy main-qa follow-ups
      carry a placeholder phase: implement (schema.ts's Phase enum already has
      main-qa, packages/intentionsutil/src/schema.ts:31, but no live node uses
      it yet) pending tactic-mainqa-first-class-phase's migration to a real
      main-qa phase; until then their phase collides with this lint's
      implement/fix/qa/review trigger set even though they are QA-observation
      parks, not implement plans. (3) Left out of scope, undecided here: the
      second, currently-unlinted main-qa representation (phase: null +
      attributes.phase: main-qa, e.g. tactic-budget-txn-identity,
      tactic-attention-surface-analytics-collector) — whether the body lint
      should ever cover that representation is deferred to
      tactic-mainqa-first-class-phase's phase migration, not decided in this
      round. The provenance half of the original Unit 1 split to a new
      born-parked sibling, tactic-align-provenance-lint-doctrine, rather than
      being decided here: re-investigation confirmed the doctrine the align
      skill docs assert (clarifications[].answer must END with a trailing
      'Recorded YYYY-MM-DD' sentence — align-strategy/SKILL.md and
      align-tactics/SKILL.md) does not match the corpus's actual convention or
      the existing tooling's convention: router.ts's readingDate()
      (packages/intentionsutil/src/router.ts:159-163) already extracts 'the
      newest ISO date mentioned anywhere' in a clarification answer,
      verb-agnostic, and coverage.ts's lastReviewedOf relies on exactly that
      semantics (test fixtures 'Recorded 2026-05-01.' and 'Amended 2026-06-15.',
      packages/intentionsutil/test/coverage.test.ts:223-239). Loosening the two
      SKILL.md doctrine passages to match is an align-layer doctrine edit, not a
      lint tweak an off-path autonomous session should make unilaterally — hence
      the park on the sibling tactic rather than a decision here."
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
phase: review
execution:
  branch: tactic-align-tactics-mechanical-floor
  pr: 2896
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: origin/main does not merge clean into this tactic's branch (provision
    exit 11)
  since: 2026-07-23
  recommendation: Resolve the conflict by hand in the node worktree and re-run the
    phase, or route to /dispatch-conflict once it accepts node targets.
pace_exempt: false
rounds: null
attributes: {}
---
# mechanical floor for the align skills: plan-schema body lint in the validate gate, plus child-tactic and strategy-corpus census scripts

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
- **Unlinted provenance convention.** Every `clarifications[].answer` is
  meant to carry a dated provenance sentence, but `schema.ts` validates
  only the `{question, answer}` shape (`validateClarifications`,
  `packages/intentionsutil/src/schema.ts:443`) — the convention is
  prose-only. **2026-07-18 re-plan:** the first attempt at this tactic
  (parked 2026-07-09) found that lint unimplementable as spec'd — see the
  frontmatter `clarifications` entry above. That half split to a new
  born-parked sibling, `tactic-align-provenance-lint-doctrine`, and is out
  of scope for this node from here on.

The skill-text encoding of the amendment-completeness doctrine itself
(whole-node reconciliation, full-body re-read, the clarification-38
widening to strategy edits) is homed in
`tactic-align-skills-greenfield-gate` Units 1–2, not here.

## Unit 1 — plan-schema body lint in the validate gate

**Recommended model:** opus

Scope:
- New `packages/intentionsutil/src/planlint.ts` exporting
  `lintTacticBodies(dir, nodes)` that throws `IntentionSchemaError`
  (`packages/intentionsutil/src/errors.ts`), matching `validateGraph`'s
  failure style. For every `kind: "tactic"` node whose `phase` is
  `implement`, `fix`, `qa`, or `review` (the post-plan, pre-`done`
  lifecycle — `PHASES` at `packages/intentionsutil/src/schema.ts:33`), read
  the node's raw markdown body and require three plan-schema markers:
  - `## Context` — match `/^##\s+Context\b/im` (heading-prefix, not exact
    string).
  - At least one recommended-model line — match `/recommended model/i`
    **anywhere in the body** (not a heading, not bold-required). The live
    corpus already uses multiple accepted formats for this line — e.g.
    `tactic-demo-saas-acceptance.md`'s `- **Recommended model**: sonnet`
    and `tactic-node-toolchain-single-source.md`'s `Recommended model:
    opus` alongside this node's own `**Recommended model:**` — a literal
    bold-colon match would false-flag both variants; match the phrase
    case-insensitively and leave formatting alone.
  - `## Verification` — match `/^##\s+Verification\b/im` (heading-prefix,
    so `## Verification checklist` — used by the migrated
    `tactic-mainqa-*` nodes, e.g. `tactic-mainqa-budget-pipeline.md` —
    still counts).
  Exempt `phase` null/`draft`/`align-tactics` (not yet planned) and `done`
  (historical).
- **Named exemption — `tactic-mainqa-*` recommended-model check.** Tactic
  ids matching `/^tactic-mainqa-/` are exempt from the recommended-model
  check only (Context and Verification stay required). These 12 nodes are
  legacy-migrated main-qa follow-ups carrying a placeholder `phase:
  implement` — `main-qa` is already a valid `Phase` enum value
  (`packages/intentionsutil/src/schema.ts:31`) but no live node uses it
  yet; `tactic-mainqa-first-class-phase` (currently `phase: null`, `status:
  raw` — itself unplanned) tracks migrating these 12 to a real `main-qa`
  phase, at which point they fall outside this lint's
  implement/fix/qa/review trigger set and the exemption becomes dead code
  — leave a comment in `planlint.ts` pointing at that tactic so the
  exemption is found and removed when it lands. Do **not** extend this
  exemption, or this lint's phase filter, to the *other* live main-qa
  representation (`phase: null` + `attributes.phase: "main-qa"`, e.g.
  `tactic-budget-txn-identity`, `tactic-attention-surface-analytics-collector`)
  — that representation is already outside the phase filter as specified
  (phase is `null`), and whether to bring it into scope is deferred to
  `tactic-mainqa-first-class-phase`, not decided here.
- Body access: `readNode`/`listNodes` deliberately drop the body
  (`packages/intentionsutil/src/store.ts:72`); reuse the fence-splitting
  logic of `extractBody` (`packages/intentionsutil/src/store.ts:58`) —
  export it or a thin `readNodeBody(dir, id)` beside it rather than
  re-parsing ad hoc.
- Wire the call into `packages/intentionsutil/scripts/validate-graph.ts`
  after `validateGraph(nodes)`, so `graph-commit` and the `graph/**` CI
  fast path both enforce it. `schema.ts`'s frontmatter-only contract is
  unchanged — the lint lives beside it, taking the store dir.
- Sweep the live store first: run the lint (with the format-tolerant
  regexes and the `tactic-mainqa-*` exemption above) over `intentions/`
  and fix any violating node in this PR (state follow-through) rather than
  weakening the rule. If a violation is legitimately not a plan (e.g. a
  spec-carrier tactic), bring it to a compliant shape or record the
  exemption as an explicit named rule in `planlint.ts` — never a silent
  skip. Confirmed still-live at spec time: `tactic-office-hours-graph-freshness-guard.md`
  (`phase: review`) has no recommended-model line in any format and is
  **not** a `tactic-mainqa-*` node, so it is a genuine violation — add an
  appropriate `**Recommended model:**` line to it (read its scope and pick
  sonnet/opus per the model-selection heuristic,
  `.claude/skills/implement-unit/SKILL.md` lines 31–39) rather than
  exempting it. Re-run the lint after wiring it in to catch any further
  violations beyond this one instance — the count above was spot-checked,
  not exhaustively enumerated at plan time.
- Tests: new `packages/intentionsutil/test/planlint.test.ts` — accepts a
  compliant body in each accepted format (bold-colon, bold-then-colon,
  unbold), rejects each missing marker (error names the node and the
  marker), exempts each exempt phase, exempts a `tactic-mainqa-*` id from
  the recommended-model check while still requiring its Context/Verification
  markers, and accepts a `## Verification checklist` heading.

Out of scope: enforcing `office_hours.recommendation` presence on parks
(condition 6) — that waits on the field landing in `schema.ts`. **2026-07-18
correction:** that field landed already (`packages/intentionsutil/src/schema.ts:351`,
`OfficeHours.recommendation: string | null`) — this remains out of scope by
choice now, not by schema blocker, since enforcing it is a separate,
unscoped decision about which parks must carry a recommendation.

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

Manual: in a scratch checkout, blank a planned tactic's body sections
(Context, recommended-model line, Verification) and confirm
`validate-graph.ts` exits non-zero naming the node and the missing marker;
confirm a `tactic-mainqa-*` id with no recommended-model line still passes
(exempted) but still fails if its Context or Verification marker is blanked;
confirm the child-tactic census exits non-zero on an unknown strategy id;
confirm the strategy census's unserved-virtues section lists exactly the
virtue ids absent from every strategy's `serves`.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
