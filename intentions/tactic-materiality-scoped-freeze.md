---
id: tactic-materiality-scoped-freeze
kind: tactic
statement: "Materiality-scoped strategy-edit freeze: widen the strategy
  fingerprint stamp to {hash, sha} and move child classification with
  same-commit re-stamp into the editing round"
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview on scope-change
  tracking (the materiality-scoped-freeze and migration-sequencing
  clarifications). Today's soft-freeze conflates two separable judgments —
  materiality (does an edit affect this child's plan at all?) and urgency (when
  must an affected child reconcile?) — so a strategy edit stales every stamped
  open child regardless of relevance, and the bare-hash stamp carries no delta
  provenance for recovering what changed. Adopted greenfield design: widen the
  per-strategy stamp to {hash, sha} (sha = the origin/main commit the hash was
  taken against, so a stale child recovers the delta via git diff
  <sha>..origin/main -- intentions/<strategy-id>.md), and move child
  classification (orthogonal -> same-commit re-stamp so no freeze fires;
  materially affected -> left stale, re-evaluates at its own rank;
  must-land-first migration -> additionally blocked_by the carrier) into the
  editing /align-strategy round. The author's rank-gate alternative was DIVERGED
  (rank is not a proxy for materiality). Boosted to top ranking by author
  direction (2026-07-18). This PR ships the additive migration steps 1-3 plus
  the align-strategy/align-tactics doctrine; step 4 (drop the bare-string form)
  is sequenced future work gated on opportunistic conversion of the ~80 extant
  legacy bare-hash stamps, whose sha is lost and so cannot be bulk-migrated."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 46
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18
    /align-tactics finalize). The materiality-scoped freeze is high-leverage
    infrastructure — it removes the orthogonal-child re-evaluation tax paid on
    every strategy edit across the whole graph — so the author elevated it above
    the ordinary off-path/backlog rank its lack of a signal-path edge would
    otherwise give it. The boost is sized against the composed selector rank,
    not the raw-boost column: backward blocked_by compounding lifts other nodes'
    raw boosts well past their face value (the current max composed rank among
    selectable work is ~45, on tactic-phase-standup-audit-lens whose own boost
    is only 15). With no blocked_by/subtree of its own, this node's rank is
    exactly boost + 5.33, so boost 46 yields rank ~51.3 — the top of the
    discretionary frontier, below only the permanent strategy-main-health trunk
    signal (rank 101). The boost flows nowhere else (empty blocked_by, no
    children), so it distorts no other node's rank."
phase: review
execution:
  branch: tactic-materiality-scoped-freeze
  pr: 2892
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Materiality-scoped strategy-edit freeze: widen the strategy fingerprint stamp to {hash, sha} and move child classification with same-commit re-stamp into the editing round

## Context

**Greenfield end-state.** Every serving-strategy soft-freeze stamp on a tactic
is `{hash, sha}`, where `hash = strategyFingerprint(strategy)`
(`packages/intentionsutil/src/router.ts:89-99`, recipe UNCHANGED) and `sha` is
the origin/main commit whose strategy content that hash was taken against —
mirroring the tactic scope-custody stamp (`ScopeStamp`,
`packages/intentionsutil/src/transitions.ts:323-327`). A stale child then
recovers the exact delta via
`git diff <sha>..origin/main -- intentions/<strategy-id>.md` instead of
dated-clarification archaeology. At edit time, `/align-strategy` classifies each
stamped open child — orthogonal → re-stamp in the same `graph-commit` (no freeze
fires); materially affected → left stale (freezes, re-evaluates at its own rank
as today); must-land-first migration → additionally `child.blocked_by +=
[carrier]` — with **no rank gate** (the author's rank-gate alternative was
DIVERGED: rank is not a proxy for materiality). The problem this kills is the
orthogonal-child tax: today every stamped open child pays a re-evaluation
session for any strategy edit, however irrelevant, and a bare hash gives no way
to recover what changed.

**This PR ships the additive brownfield increment** — migration steps 1–3 plus
the skill doctrine — leaving the corpus's ~80 non-null legacy bare-hash stamps
(whose `sha` is lost and cannot be reconstructed) valid, converting them
opportunistically at each re-stamp. **Migration step 4 — drop the bare-string
form and make `validate-graph` REJECT bare strings — is explicitly OUT OF
SCOPE**: it is gated on full opportunistic-conversion coverage of those legacy
stamps and is sequenced future work, not this leaf. This PR keeps accepting bare
strings as deprecated-but-valid.

**Settled design (sha provenance).** `sha` is passed as an explicit arg by the
caller, NOT shelled from within the writer. `apply-node-transition.ts` is
documented "Pure of git/gh — the wrapper owns those"
(`packages/intentionsutil/scripts/apply-node-transition.ts:139`); shelling
`git rev-parse` inside it would violate that boundary and invite a silent
default. Per `.claude/rules/code-style.md` ("Prefer clear errors over defensive
fallbacks"), a `--strategy-fingerprint` given without a `--strategy-sha` must
ERROR, never default. The internal `args.strategyFingerprint` widens from
`Record<string, string>` to `Record<string, { hash: string; sha: string }>`; a
single new `--strategy-sha <sha>` flag supplies the shared origin/main sha for
every `<sid>=<hash>` entry in one invocation (all entries in one invocation are
stamped against one origin/main snapshot). Bootstrap-interim reality: until a
live router exists, re-stamps are hand-authored via `write-node.ts` with JSON
built by hand, so the skill doctrine tells the author to compute `sha` with
`git rev-parse origin/main`.

## Units of work

### Unit 1: Widen the schema type and validation to accept `{hash, sha}` map values

- **Scope** — `packages/intentionsutil/src/schema.ts`. Introduce and export a
  type alias `StrategyStampValue = string | { hash: string; sha: string }`.
  Change the `Execution.strategy_fingerprint` field (`schema.ts:344`) from
  `string | Record<string, string> | null` to
  `string | Record<string, StrategyStampValue> | null`. In
  `validateStrategyFingerprint` (`schema.ts:404-420`): keep the null pass
  (`:408`) and the deprecated bare top-level string pass (`:409`) UNCHANGED; in
  the map loop (`:416-418`) accept a value that is either a string
  (existing/legacy) OR a plain object `{hash, sha}` with both members validated
  via `requireString` — reject a non-string, or an object missing `hash`/`sha`
  or with a non-string member, with an `IntentionSchemaError`. Update the doc
  comments at `schema.ts:323-338` and `:399-403` to describe the `{hash, sha}`
  value and its provenance (do NOT state bare strings are rejected — they remain
  valid). OUT OF SCOPE: any top-level bare-string rejection; `validate-graph.ts`
  needs no direct edit (it reaches this via
  `validateGraph → validateExecution → validateStrategyFingerprint`).
- **Recommended model** — sonnet.

### Unit 2: Staleness reads `.hash` from the object form via a shared extractor

- **Scope** — `packages/intentionsutil/src/transitions.ts`. Add a small exported
  helper co-located with `ScopeStamp`/`isFingerprintStale` (e.g.
  `stampHash(value: StrategyStampValue): string` returning `value` when a string
  else `value.hash`) — the single home of the value-shape discrimination, reused
  by any reader rather than duplicated. Widen `isFingerprintStale`
  (`transitions.ts:366-375`): its `stamp` param type widens to
  `string | Record<string, StrategyStampValue> | null`; keep null→false
  (`:371`), keep the top-level bare-string compare (`:372`), keep absent-key→false
  (`:373`); at `:374` compare `stampHash(stamp[strategyId]) !== currentFingerprint`
  instead of the raw value. Widen `isStrategyStale` (`transitions.ts:384-391`)
  param type transitively (it delegates at `:390`, no logic change). Update docs
  at `transitions.ts:353-364`. `router.ts` needs NO change (`router.ts:269,276`
  pass `strategyFingerprint(s): string` and delegate through `isStrategyStale`);
  `compute-freshness.ts:101` is covered transitively.
- **Recommended model** — sonnet.
- **Dependencies** — Unit 1.

### Unit 3: Writer emits/merges the `{hash, sha}` form

- **Scope** — `packages/intentionsutil/scripts/apply-node-transition.ts`. Widen
  the `Args.strategyFingerprint` type (`:53`) from `Record<string, string> | null`
  to `Record<string, { hash: string; sha: string }> | null`. In `parseArgs`
  (`:92-105`): keep `--strategy-fingerprint <sid>=<hash>` parsing and its
  bare-hash rejection; add a `--strategy-sha <sha>` flag storing a scalar; after
  the arg loop, if `strategyFingerprint` entries were collected, require a
  non-empty `--strategy-sha` and ERROR clearly if absent (no default), then fold
  the shared sha into each entry as `{ hash, sha }`. In the re-stamp merge
  (`:152-159`): widen the `base` type to `Record<string, StrategyStampValue>`;
  keep the "existing top-level legacy string is dropped" behavior (`:156-158`
  comment) and keep pre-existing map entries (which may still be bare strings —
  opportunistic conversion means ONLY re-stamped keys migrate); overwrite only
  the keys present in `args.strategyFingerprint` with the new object form.
  `defaultExecution` (`:121`) stays `strategy_fingerprint: null`. OUT OF SCOPE:
  bulk migration of untouched keys.
- **Recommended model** — sonnet.
- **Dependencies** — Unit 1.

### Unit 4: Reader preserves object-form map values

- **Scope** — `packages/intentionsutil/scripts/check-node-selection.ts`. Widen
  `readStrategyFingerprint` return type (`:101`) to
  `string | Record<string, StrategyStampValue> | null`. First-class path
  (`:102-103`) already returns the schema-validated value unchanged — fine.
  Squatter object-coercion loop (`:108-116`) currently keeps ONLY string values
  (`:113-114`), silently dropping object values; extend it to also keep
  well-formed `{hash, sha}` object values (drop only genuinely malformed
  entries). The downstream `isFingerprintStale` call (`:226`) already handles
  both forms after Unit 2 — no change there.
- **Recommended model** — sonnet.
- **Dependencies** — Units 1, 2.

### Unit 5: Test coverage for the widened value form

- **Scope** — add cases (do not delete existing legacy/map/null cases):
  - `test/schema.test.ts` — alongside bare-string (`:60,79,131-140`) and map
    (`:110-129`) cases: accept a map whose value is `{hash, sha}` (both strings);
    accept a MIXED map (one bare-string value, one object value); reject a map
    object value missing `hash`, missing `sha`, or with a non-string member
    (extend the reject block at `:143-159`); leave the top-level bare-string
    acceptance intact.
  - `test/transitions.test.ts` — alongside legacy-string (`:301-307`) / map
    (`:310-319`) / raw-form (`:322-328`) cases: object-form staleness reads
    `.hash` (fresh when `.hash` matches, stale when it differs); mixed map
    (object-form entry + bare-string entry) evaluated per-key; add a direct
    `stampHash` unit assertion.
  - `test/router.test.ts` — add an object-form map stamp in a soft-freeze
    scenario (mirror the map stamps at `:445-461`): fresh `.hash` does not
    freeze, stale `.hash` freezes.
  - `test/check-node-selection.test.ts` — add an object-form map stamp (mirror
    `:193,219,246`) exercising the reader + staleness path; a squatter
    object-form value.
  - `test/apply-node-transition.test.ts` — widen the arg-type usage (`:52`);
    assert `--strategy-sha` + `--strategy-fingerprint` writes `{hash, sha}`;
    assert a re-stamp MERGES the object form while preserving an untouched
    pre-existing bare-string sibling key (opportunistic conversion); assert
    `--strategy-fingerprint` WITHOUT `--strategy-sha` errors; keep the
    legacy-drop assertion (`:134-137`).
- **Recommended model** — sonnet.
- **Dependencies** — Units 1–4.

### Unit 6: Skill doctrine — materiality-scoped classification and `{hash, sha}` re-stamp

- **Scope** — two doctrine files (no code):
  - `.claude/skills/align-strategy/SKILL.md` — replace the indiscriminate
    "Soft-freeze warning" (`:467-474`) with a **classification-and-re-stamp**
    step for the edit path: when the edited strategy has open (non-draft,
    non-`done`) child tactics, classify EACH stamped open child against the
    actual edit delta — orthogonal → re-stamp its entry to
    `{hash: strategyFingerprint(strategy), sha: <origin/main>}` in the SAME
    `graph-commit` as the edit (so no freeze fires); materially affected → leave
    its stamp stale (it freezes and re-evaluates at its own rank as today);
    must-land-first migration → additionally `child.blocked_by += [<carrier>]`.
    State explicitly there is NO rank gate — rank is not a proxy for materiality.
    Tell the author to compute `sha` with `git rev-parse origin/main` for the
    bootstrap-interim hand-stamp path (`write-node.ts` hand-authored JSON), and
    that the live-router path passes it via
    `apply-node-transition.ts --strategy-sha`.
  - `.claude/skills/align-tactics/SKILL.md` — update "Fingerprint honesty"
    (`:538-553`), Re-evaluation-mode item 3 (`:582-588`), and the per-node
    re-plan branch (`:114-123`) so every re-stamp writes the `{hash, sha}` object
    form (`hash = strategyFingerprint(strategy)` from `router.ts` — unchanged
    helper; `sha = git rev-parse origin/main`), keeping "bare-string form is
    deprecated-legacy — never emit it." Note that untouched sibling-strategy
    entries are left as-is (opportunistic conversion, not bulk).
  - Both: add a one-line pointer that dropping the bare-string form /
    `validate-graph` rejection is sequenced future work (step 4), NOT this
    change.
- **Recommended model** — opus.
- **Dependencies** — Units 1–4 (doctrine must match the shipped arg/value shapes).

## Reuse

- `strategyFingerprint(strategy)` — `packages/intentionsutil/src/router.ts:89-99`.
  Recipe UNCHANGED; the sole hash producer. Skills reference it, never a
  hand-computed hash.
- New `stampHash` extractor in `packages/intentionsutil/src/transitions.ts`
  (added Unit 2) — the single value-shape discriminator; reused by
  `isFingerprintStale` and any reader instead of duplicating the
  `string | {hash,sha}` branch.
- `ScopeStamp` / `parseScopeStamp` / `isScopeStale` —
  `packages/intentionsutil/src/transitions.ts:323-351` — the existing
  `{fingerprint, sha}` scope-custody stamp this change mirrors; follow its shape
  and error discipline.
- `requireString` / `isPlainObject` / `IntentionSchemaError` —
  `packages/intentionsutil/src/schema.ts` — reuse for the `{hash, sha}` member
  validation (as `validateStrategyFingerprint` already does at `:417`).
- `StrategyStampValue` type alias (added Unit 1 in `schema.ts`) — import into
  `transitions.ts` and the two scripts rather than re-spelling the union.

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

```verify
npx tsc -p packages/intentionsutil/tsconfig.json --noEmit
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual / judgment checks:

- Confirm no existing legacy/bare-string/null test case was deleted or made to
  fail — backward compatibility is the whole point; run the suite before and
  after and diff which tests are new vs. changed. (Weakening or deleting a test
  to go green is forbidden — `.claude/rules/test-integrity.md`.)
- Grep the corpus for a real legacy bare-hash stamp
  (`grep -rn "strategy_fingerprint" intentions/*.md`) and confirm the schema
  still accepts it unchanged (validate-graph must NOT reject bare strings).
  Spot-check that `validate-graph.ts` was not edited.
- Re-read `.claude/skills/align-strategy/SKILL.md` step 5 and
  `.claude/skills/align-tactics/SKILL.md` after Unit 6: verify the classification
  has NO rank gate, that `{hash, sha}` is the emitted form, that
  `git rev-parse origin/main` is the interim sha source, and that step 4 is
  explicitly named as future/out-of-scope.
- Trace one live path by eye: `check-node-selection.ts:220-226` with an
  object-form squatter stamp — confirm the reader now surfaces the object value
  and staleness reads `.hash`.
