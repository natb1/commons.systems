---
id: tactic-graph-digest-quality-followups
kind: tactic
statement: "graph-digest.ts quality follow-ups deferred from the
  tactic-graph-digest-tooling review (PR #2865): bound NEAR-DUP and CLOSURE
  below O(n^2), add stop-word filtering to near-dup tokens, tie STORED-DEFAULTS
  to schema defaults, factor the repeated table render/truncation shape, and
  validate DigestInput bodies/rawTexts are keyed 1:1 with nodes"
owner: ai
status: raw
parent: null
rationale: "Deferred residue from the /review-fix review of
  tactic-graph-digest-tooling (PR #2865; in-PR review fixes landed at commit
  3dbaf24f). These are non-blocking quality improvements to
  packages/intentionsutil/src/digest.ts scoped out of the review's applied fixes
  (which covered the correctness plus the cheap reuse/efficiency/conventions
  items). The digest is read-only and the current graph is ~371 nodes, so none
  of these bite at current scale; they are efficiency/maintainability hardening
  for a growing graph. Recorded as a draft by /review-fix on 2026-07-12;
  /align-tactics finalizes and re-validates each finding against what actually
  merged."
reading: null
gap: null
serves:
  - strategy-graph-integrity
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
# graph-digest quality follow-ups (deferred from PR #2865 review)

Non-blocking quality improvements to `packages/intentionsutil/src/digest.ts`
deferred from the `/review-fix` review of `tactic-graph-digest-tooling`
(PR #2865). None bite at the current ~371-node scale; all are read-only-tool
efficiency/maintainability hardening. `/align-tactics` should re-validate each
against the merged code (anchored as of commit 3dbaf24f) and decompose into
PR-sized units.

## Deferred findings

1. **NEAR-DUP-STATEMENTS is O(n^2) pairwise.** `tableNearDup` compares every
   node pair; `NEAR_DUP_LIMIT` caps only the printed rows, not the comparison
   work. Bound it with an inverted token index (token -> node ids), Jaccard-ing
   only pairs that share >=1 token. Log any dropped comparisons rather than
   silently capping.

2. **`tableClosure` memoization only caches at the outermost frame.** The
   cache-write guard `if (result || stack.size === 0)` caches a `false` only at
   the top-level call, so deep unclosed chains are re-derived per fresh root
   (O(n^2)); the output is correct. The comment claims it "mirrors
   computeSignalPath" but does not thread the provisional-false flag
   computeSignalPath uses. Fix by threading that flag, or factor a shared
   cycle-safe `reachability(nodes, edgesOf, isTerminal)` util that both
   `computeSignalPath` (attention.ts) and this table call.

3. **`statementTokens` has no stop-word filter.** Function words (`add`, `a`,
   `for`, `the`, `system`, ...) inflate Jaccard, so unrelated statements sharing
   only scaffolding can exceed the 0.6 near-dup threshold. Add a small stop-word
   list (the table is a human shortlist, so tune conservatively).

4. **STORED-DEFAULTS `isDefaultValue` is a hand-rolled shape heuristic.** It
   treats `null`/`false`/`[]`/`{}` as defaults — accidentally correct today but
   not tied to schema.ts's actual per-field defaults, so it silently drifts if a
   field is ever added defaulting to `true`. Derive the default set from the
   schema/validator instead.

5. **Five table builders duplicate the empty/header/rows shape.** `tableClosure`,
   `tableDonePresent`, `tableDupServes`, `tableNearDup`, and
   `tableStoredDefaults` each hand-roll "empty -> short message, else
   header+rows", and two additionally duplicate the "slice to LIMIT + append
   `... and N more`" trailer. Factor a shared renderer helper — preserve every
   table's exact wording, since the tests assert output strings.

6. **`DigestInput` boundary validation.** `renderPerNode`/`tableDanglingRefs`
   default a missing body via `bodies.get(id) ?? ""`, and `tableStoredDefaults`
   skips a node whose `rawTexts` entry is absent — silent fallbacks vs
   `.claude/rules/code-style.md`. `DigestInput.bodies`/`rawTexts` are documented
   1:1 with `nodes`; validate that invariant at the render entry points and fail
   with a clear error instead. Harden the `gatherInput` path-safety-by-evaluation-order
   in the same pass (graph-digest.ts's second `readFileSync` is protected only
   by the preceding `assertPathSafeId` throw, not an explicit check).

## Provenance

Source review: `/review-fix tactic-graph-digest-tooling`, PR #2865 (in-PR fixes
at commit 3dbaf24f). Recorded 2026-07-12. Informational/by-design items from the
same review (wildcard self-count, fully-pruned-wildcard `(0 members)`,
backtick-span-with-prose) were intentionally NOT deferred here.
