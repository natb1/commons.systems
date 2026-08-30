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
office_hours:
  reason: >-
    Requirement ambiguity — the design decision this node's own Scope section
    says must be answered before any code is written is an author call, and
    verification at HEAD (2026-08-19, origin/main cfd3b4f0) shows both of its
    non-retirement options are under-specified as framed.


    WHERE THE CHECK ACTUALLY RUNS (measured, not inferred).
    validateGraphProseRefs has exactly one production call site —
    packages/intentionsutil/scripts/validate-graph.ts:206, four arguments, the
    fifth (batchIds) taking its empty default. validate-graph.ts itself runs in
    production from only three places: the guard job of
    .github/workflows/graph-fast-path.yml (line 32), the graph job of
    .github/workflows/unit-tests.yml (line 162, which declares branches-ignore
    of main and graph/**), and the /align preflight
    .claude/skills/align/scripts/validate-deployment.sh (line 57). graph-commit
    never runs it — there is no callsite in
    packages/intentionsutil/scripts/graph-commit; it pushes each attempt's SHA
    to a throwaway graph/** scratch branch (graph-commit:3762) and waits for the
    CI guard to stamp the four required contexts, every one of which declares
    needs: guard.


    WHY THAT UNDER-SPECIFIES BOTH OPTIONS. The process that enforces the rule is
    a GitHub Actions job seeing only pushed repo content. Option 1 (a --batch
    flag fed by graph-fast-path.yml) cannot work as framed: the workflow can
    enumerate only the current push, and the failure is cross-push by
    construction — /rsi calls dispatch-eval-finding once per finding, one
    graph-commit and one push each. Option 2 (the writer declares it) cannot
    work as framed either: dispatch-eval-finding is a different process from the
    validator and can pass it no argument. Any working version of either
    therefore needs a writer-asserted declaration that TRAVELS WITH THE PUSH — a
    commit trailer, a committed sidecar manifest, or equivalent — which converts
    the graph write path's prose-reference guard from store-verified to
    writer-asserted for the declared ids.


    THE DECISION NEEDED. May the prose-reference guard resolve an id on a
    writer-asserted, push-carried declaration that no store content can verify,
    accepting that the guard is only as strict as the writer for those ids? Or
    is the ratified outcome option 3 of the node body — retire batchIds, keep
    the test that documents why, and record the hand-ordering constraint in /rsi
    step 6 (.claude/skills/rsi/SKILL.md:265, where exit 1 is documented only as
    "the graph write failed and was rolled back", with nothing about diagnosing
    a prose-reference violation)? Option 3 deletes shipped behaviour and changes
    a skill contract, so it is equally an author call. The node body itself
    forbids the third path of leaving the parameter in place unused.


    WHAT IS NOT THE BLOCKER: feasibility. Ledger node ids are deterministic from
    the slug (the id shape tactic-eval-finding-SLUG, dispatch-eval-finding line
    24) and the /rsi caller fixes all top-N slugs before its first invocation,
    so the full id set is knowable up front. batchIds matches by exact id
    membership only (schema.ts:1668) and is complementary to, not overlapping
    with, the mentionsRef planned-reference exemption — which excludes the
    referencing node itself and so can never cover the first-landed member
    naming an unlanded sibling. The constraint is the trust model and the
    channel, not the knowability of the set.


    BOUNDING RISK any push-carried design must answer. An id declared but never
    minted lands a genuinely dangling prose reference on main; the next
    unrelated graph write's guard job validates the whole store, goes red, and —
    because all four required contexts declare needs: guard — blocks every graph
    writer in the repo. That is the 2026-08-14 repo-wide write-denial class
    named at validate-graph.ts:155-165, the same failure the deliberately
    non-fatal sensor check exists to avoid re-arming.


    RECORD-COMPLETENESS GAP (strategy clarification 31 / condition 7 framing).
    strategy-graph-integrity records no premise about whether its integrity
    guards may accept an unverifiable writer assertion. Its reference-integrity
    clarification (2026-07-09, the three-class live/planned/pruned convention)
    settles which references are legal but says nothing about who may assert
    resolvability. That is a gap in the /align round that produced the strategy,
    not something this session should guess at; a per-node /align-tactics
    session may not write the serving strategy, so the proposed clarification
    rides here instead. Proposed clarification for an author /align pass on
    strategy-graph-integrity: "May a graph integrity guard resolve a reference
    on a writer-asserted, push-carried declaration that no store content can
    verify, or must every exemption be derivable from committed store content?"


    Provenance: parked 2026-08-19 by an autonomous /align-tactics per-node
    finalize session. The Workflow's drift review returned proceed: false with
    this as a material unrecorded premise; no plan body was authored. Both reuse
    hunts ran and are reflected above. One gather subagent (the clause-coverage
    agent, which feeds Side-A condition review) died on a structured-output
    retry cap; Side A returned no failed conditions, and none of the strategy's
    four conditions bear on this node's finalize, so the loss does not change
    the disposition — but a re-run would restore that evidence.
  since: 2026-08-19
  recommendation: >-
    Rule the trust question, then re-run this node — it is one ruling away from
    being plannable in a single pass.


    1. Run /align strategy-graph-integrity and answer the proposed
    clarification: may a graph integrity guard resolve a reference on a
    writer-asserted, push-carried declaration that no store content can verify,
    or must every exemption be derivable from committed store content? If you
    would rather not open the strategy question at all, ruling option 3 directly
    on this node is sufficient to unblock it — say so in the clear-park commit
    and skip step 1.


    2. Then re-run /align-tactics tactic-graph-prose-ref-batch-wiring. With the
    ruling in hand the plan is authorable without further author input:
       - YES (assertion permitted) selects a push-carried channel — commit trailer on the graph/** scratch push, or a committed sidecar manifest — read by the graph-fast-path.yml guard step and handed to validate-graph.ts. Use the --batch=<ids> single-token flag form: parseIntentionsDir (validate-graph.ts:93) filters "-"-prefixed args and then requires exactly one positional, so a space-separated --batch <ids> makes <ids> a second positional and exits 2. The plan must also bound the declared-but-never-minted case (see the reason's BOUNDING RISK paragraph), since that is what turns a writer mistake into a repo-wide write denial.
       - NO (store content only) selects option 3: delete the batchIds parameter and its exemption from validateGraphProseRefs, keep the tests at packages/intentionsutil/test/schema.test.ts:2296-2352 rewritten to document why the exemption is not offered, and add the hand-ordering constraint plus the retryable-after-reordering note to /rsi step 6 at .claude/skills/rsi/SKILL.md:265.

    3. Either way, keep the node body's reproduction requirement: mint two
    ledger entries in separate dispatch-eval-finding invocations where the first
    names the second, and confirm the failure before and the intended behaviour
    after. The parameter already shipped once on an argument that sounded right.
  session_type: other
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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions || exit 1
npm test --prefix packages/intentionsutil
```

Beyond the automated checks: reproduce the original failure before fixing it.
Mint two ledger entries in separate `dispatch-eval-finding` invocations where
the first names the second, and confirm the first fails to land. A fix that
cannot be demonstrated against that reproduction has not been demonstrated at
all — the parameter shipped once already on an argument that sounded right.
