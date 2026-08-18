---
id: tactic-graph-prose-ref-batch-wiring
kind: tactic
statement: validateGraphProseRefs takes a batchIds set that no production caller
  ever passes, so the cross-invocation prose-reference failure it was added to
  fix is still live -- validate-graph.ts calls the function with four arguments
  and the fifth parameter takes its empty default on every real run, leaving a
  writer that mints one node per invocation with the hand-ordering constraint
  the parameter exists to remove
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. The validator half shipped
  and is covered by test/schema.test.ts; the caller half was dropped from the
  brief's scope on the reasoning that resolving against the batch under write
  made a caller unnecessary. Post-merge review established that reasoning is
  half right and recorded the correction on the closed ledger entry
  `tactic-eval-finding-eval-finding-forward-crossref-fails-ci`: graph-commit
  already stages every id of a SINGLE invocation, so within-invocation
  cross-references resolved before the change ever landed. The failure that
  entry was filed about is CROSS-invocation -- /rsi calls dispatch-eval-finding
  once per finding, so a sibling minted by a different invocation sits in no
  batch the validator can see. Wiring it is a design decision (which component
  knows the in-flight batch) and was deliberately not made in PR1."
reading: null
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
# Wire `batchIds` to a real caller, or retire the parameter

## Context

PR #3095 added a fifth parameter, `batchIds`, to `validateGraphProseRefs`
(`packages/intentionsutil/src/schema.ts:1628`) so a prose reference naming a
sibling of the write batch currently in flight resolves instead of classifying
`missing`. The library half is correct and covered by
`packages/intentionsutil/test/schema.test.ts`.

**Nothing passes it.** The sole production call site is
`packages/intentionsutil/scripts/validate-graph.ts:206`:

```
validateGraphProseRefs(nodes, bodies, deletedIds, baseline);
```

Four arguments. The fifth takes its empty-set default on every real invocation,
which the doc comment itself describes as leaving the check "exactly as strict
as it was".

The distinction that makes this matter, established in post-merge review of
`tactic-eval-finding-eval-finding-forward-crossref-fails-ci`:

- **Within one invocation** — `graph-commit` already stages every id it is
  given, so a cross-reference between two ids of a single call resolved
  *before* this change and does not need `batchIds`.
- **Across invocations** — `/rsi` calls `dispatch-eval-finding` once per
  finding. A sibling minted by a different invocation is in no batch the
  validator can see. **This is the case the ledger entry was filed about, and
  it is untouched.**

So the parameter, as shipped, resolves a case that already worked and misses
the case that motivated it.

## Scope

The open design question is **which component knows the in-flight batch**, and
it must be answered before any code is written:

1. **`--batch <ids>` on `validate-graph.ts`**, plumbed to the fifth argument at
   `:206`, with the caller in `.github/workflows/graph-fast-path.yml` supplying
   the ids. Straightforward, but the fast-path workflow currently validates one
   pushed commit and has no notion of a multi-commit batch, so something has to
   define the batch boundary.
2. **Make the writer declare it** — `dispatch-eval-finding` knows the full set
   of ids the evaluation intends to mint, and could pass them on every
   invocation of the group. This puts the knowledge where it exists but
   requires the writer to be told the set up front.
3. **Retire the parameter.** Legitimate if (1) and (2) are both judged not
   worth their cost: the honest outcome is then to delete `batchIds`, keep the
   test that documents why, and record the hand-ordering constraint in `/rsi`
   step 6 instead. **Do not leave the parameter in place unused** — an
   unreachable exemption reads as a solved problem.

Out of scope: any change to how `classifyRef` or `mentionsRef` decide
resolution. Only the wiring is at issue.

## Reuse

- `validateGraphProseRefs` — `packages/intentionsutil/src/schema.ts:1628`; the
  `batchIds` semantics (exact id membership only, never shape or prefix) are
  already specified in its doc comment and must not be widened.
- `validate-graph.ts`'s existing positional-argument parsing — the
  `<intentionsDir>` handling added by PR #3095 — is the pattern a `--batch`
  flag should follow, including its usage-error exit 2.
- `packages/intentionsutil/test/schema.test.ts` already exercises `batchIds`
  directly; extend it rather than starting a new file.

## Verification

Whichever direction is chosen, the graph must still validate and the package
suite must stay green:

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
npm test --prefix packages/intentionsutil
```

Beyond the automated checks: reproduce the original failure before fixing it.
Mint two ledger entries in separate `dispatch-eval-finding` invocations where
the first names the second, and confirm the first fails to land. A fix that
cannot be demonstrated against that reproduction has not been demonstrated at
all — the parameter shipped once already on an argument that sounded right.
