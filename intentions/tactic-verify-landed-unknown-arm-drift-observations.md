---
id: tactic-verify-landed-unknown-arm-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-verify-landed-unknown-arm-untested: this strategy's stored
  reading no longer reproduces (backlog re-derived at 102/305 = 33.4% against a
  stored 58/236 = 24.6%, so its non-increasing claim fails on that pair),
  several conditions assert enforcement in present tense while their sole
  carrier is an unplanned draft, and the round's two node-local premise
  corrections recorded for their generalizable form"
owner: human
status: delegated
parent: null
rationale: Born parked. A per-node /align-tactics tactic-target session may not
  write the serving strategy's frontmatter, and clarification 245 (violation V1,
  ruled 2026-08-14 and extended 2026-08-15) overturned clarification 118,
  closing the strategy-clarifications path for an autonomous lane. The autonomy
  contract's three park conditions -- requirement ambiguity, major scope
  deviation, unverifiable blocker -- do not fit an observation that gates
  nothing, so an escalation park on the target was also not available. A
  born-parked observation node serving the strategy is the destination
  clarification 245 designates, with a human promoting the worthwhile entries
  into clarifications at office hours.
reading: null
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
office_hours:
  reason: "Observation carrier, not planned work -- do not dispatch it. It holds
    the four immaterial Side-B drift observations from the 2026-08-20
    /align-tactics tactic-mode round that finalized
    tactic-verify-landed-unknown-arm-untested. Two of them (the target node's
    stale headline premise, and its dead ```verify fence) were absorbed into
    that node's own amended record and are carried here only for their
    generalizable form. The other two are strategy-level record observations
    with no legal autonomous destination: a per-node tactic-target session may
    never write the serving strategy's frontmatter, and clarification 245 /
    violation V1 overturned clarification 118, so an autonomous lane may not
    append them to this strategy's clarifications either -- `clarifications` is
    an allowlist member of strategyFingerprint, so such a write would
    soft-freeze every open child of this strategy for observations defined as
    gating nothing. This carrier is their destination. OBSERVATION 3 is the one
    most likely to matter: this strategy's stored `reading` (stamped 2026-08-10:
    backlog 58/236 = 24.6%, series described as non-increasing) no longer
    reproduces. Re-derived this round with align-tactics-census.ts against the
    current store: 305 tactics serve this strategy -- 106 draft, 29 born-parked,
    73 open, 97 done -- so backlog is 102/305 = 33.4%. Still inside the declared
    35% band, but the ratio ROSE across the 2026-08-10 to 2026-08-20 pair, so
    the reading's own 'non-increasing across consecutive samples' claim does not
    hold on that pair, and the denominator grew roughly 29% in ten days. This is
    deliberately NOT recorded as the maintenance-burden condition failing --
    that condition reserves failure for a burden 'growing without bound', its
    band still holds, and its remedy is an author decision parking the STRATEGY,
    which this session cannot write. See the body for all four observations in
    full, with their verbatim proposed clarification texts."
  since: 2026-08-20
  recommendation: "Read the body's four observations and pick a disposition for
    EACH; they are not one decision. Suggested split. (1) OBSERVATION 3 (stale
    strategy `reading`) -- MECHANIZE or CLARIFY. The cheap fix is to re-stamp
    `reading` from align-tactics-census.ts at the next strategy-target
    /align-tactics round on strategy-graph-native-dispatch and record the
    re-derived series; the durable fix is to stop storing a figure that goes
    stale silently, the way `gap` already avoids it (derived on read via
    deriveGap, packages/intentionsutil/src/sensors.ts). Decide which. (2)
    OBSERVATION 4 (conditions asserting enforcement in present tense while their
    sole carrier is an unplanned draft; the PR-title CI guard has no
    implementation at all) -- CLARIFY-ONLY, at a strategy-target round: extend
    to those conditions the not-yet-armed caveat posture two conditions already
    carry, rather than weakening any requirement. Or, if the PR-title guard is
    wanted, file it as its own tactic. (3) OBSERVATIONS 1 and 2 -- likely DROP
    as already-discharged: both were absorbed into
    tactic-verify-landed-unknown-arm-untested's amended rationale and plan in
    the same round. Promote them only if you want the generalization recorded as
    doctrine, namely that a node filed as a residual of a PR should have its 'X
    has no test / X is unreachable' premise re-measured before planning, because
    here the premise was false five days before the PR that supposedly produced
    it. tactic-align-tactics-premise-preflight is the existing draft carrier for
    that mechanism -- fold it there rather than minting a new node."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Drift observations from the 2026-08-20 `tactic-verify-landed-unknown-arm-untested` round

## What this node is

An **observation carrier**. It holds no plan, and **must not be dispatched** —
there is nothing here for an implement session to build. It exists because the
2026-08-20 `/align-tactics` tactic-mode round that finalized
`tactic-verify-landed-unknown-arm-untested` surfaced four **immaterial** Side-B
drift observations, and a per-node tactic-target session has no legal
autonomous destination for them:

- It may **never** write the serving strategy's frontmatter — that is the
  tactic-target contract, not a soft preference.
- It may **not** append them to the strategy's `clarifications` either.
  Clarification 118 once allowed that and carries an `OVERTURNED 2026-08-15`
  prefix; clarification 245 (violation V1) binds instead. `clarifications` is
  an allowlist member of `strategyFingerprint`, so an autonomous write there
  would soft-freeze **every** open child of this strategy on account of
  observations defined as gating nothing — and a model-authored dated
  clarification is byte-indistinguishable from an author-ruled one, which
  collapses provenance in the one field that carries doctrine.
- The autonomy contract's three park conditions — requirement ambiguity, major
  scope deviation, unverifiable blocker — do not fit an observation that gates
  nothing, so an escalation park on the target was not available either.

Every observation below is `material: false` and `plan_depends: false`: none
gated the round, and the round completed without interruption. Observations 1
and 2 were **absorbed** into the target node's amended `rationale` and plan in
the same round and are reproduced here only for their generalizable form.
Observations 3 and 4 have no other home and are the reason this node exists.

Each section carries the drift agent's verbatim premise, followed by the
verbatim clarification text it proposed, so a human promoting one into a real
strategy clarification can paste rather than re-derive it.

## Observation 1 — the target node's headline premise was false, and was false five days before the PR it was filed as a residual of

**Premise (verbatim, `material: false`, `plan_depends: false`):**

> The target node's headline premise is factually stale against origin/main: verify-landed's exit-1 `unknown` arm DOES have a test, and it IS reachable read-only. test-verify-landed.sh case 5 (:127-137) clones the scratch origin, repoints origin at a nonexistent path, and asserts exit 1, verdict=unknown, and that the word 'not-landed' appears nowhere — the exact fetch-failure route (verify-landed:201-213) the node's Scope names as its minimum deliverable. It uses no PATH shim, contradicting the node's Reuse section which pins the test-graph-commit.sh shim convention as the required mechanism. The suite is CI-registered at .github/workflows/unit-tests.yml:307 and was run this round: 25 passed, 0 failed. This does not gate the plan and needs no author ratification — clarification 115 standingly directs a round to correct a node's record to match reality rather than defer, the node is phase null so no demotion is at stake, and clarification 26's per-unit doomed-drop (preserved by clarification 239) makes a partially-superseded node a scope narrowing rather than a supersession park. The node's core intent — pinning the any-unknown-wins reduction property — is untouched and its residual scope is real.

**Proposed clarification text (verbatim — paste-ready if promoted):**

> (Recorded 2026-08-20 /align-tactics per-node round on tactic-verify-landed-unknown-arm-untested.) The node's headline premise is STALE and was corrected in-round rather than deferred, per clarification 115's standing rule that the graph always reflects target state. The node asserts that verify-landed's exit-1 `unknown` arm 'has no test' and that the arm 'is not reachable from a read-only verification pass'. Both halves are false against origin/main as of this date. packages/intentionsutil/scripts/test-verify-landed.sh case 5 (:127-137) drives a real fetch failure — clone the scratch origin, then `git remote set-url origin` to a nonexistent path — and asserts exit 1, verdict=unknown, AND that the word 'not-landed' appears nowhere in the output, which is precisely the collapse the arm exists to prevent. That is the fetch-failure route (verify-landed:201-213) the node's own Scope names as its minimum deliverable. It needs no PATH shim, which also retires the node's Reuse section: it pinned the test-graph-commit.sh shim convention as the required mechanism, and the mechanism is unnecessary. The suite is CI-registered at .github/workflows/unit-tests.yml:307 and was executed this round: 25 passed, 0 failed. The node is therefore PARTIALLY superseded by already-shipped work — one unit of its intended scope is done — which under clarification 26's per-unit doomed-drop, preserved unchanged by clarification 239, is a scope narrowing rather than a supersession park. The residual is real and is what the finalized plan should cover: (a) the any-unknown-wins REDUCTION property at verify-landed:217, :292 and :296-297, which the node's own Scope calls 'the property to pin' and which no test drives — case 11 mixes landed with unsatisfied only, never landed with unknown; (b) the jq-error route at :277-283, reachable with no shim by passing a charset-legal but syntactically broken filter such as '.foo[' (measured this round: `jq -e` exits 3, so the `*` case fires and status becomes unknown); (c) the node_json_at_main / readNodeAtRef failure route at :267-269, reachable with no shim by seeding a schema-invalid node at origin/main; and (d) the unresolvable origin/main rev-parse sub-branch at :211-213, which the node's Scope does not enumerate separately though it reports through the same `report unknown` path as the fetch failure.

## Observation 2 — the target node's ```verify fence was a dead test path, and its CI-registration caution was already discharged

**Premise (verbatim, `material: false`, `plan_depends: false`):**

> The target node's Verification section is mechanically wrong in a way that would have produced a vacuous pass. Its ```verify fence runs `npm test --prefix packages/intentionsutil`, which resolves to `vitest run` (packages/intentionsutil/package.json:13) and never executes a .sh file — none of the new assertions would run. Separately, its closing caution to 'confirm the new suite is actually invoked by a CI job' is already satisfied for this suite (.github/workflows/unit-tests.yml:307), so appending cases to the existing file inherits CI coverage with no registration step owed. Both are in-round corrections requiring no author judgment.

**Proposed clarification text (verbatim — paste-ready if promoted):**

> (Recorded 2026-08-20 /align-tactics per-node round on tactic-verify-landed-unknown-arm-untested.) Two mechanical defects in that node's own Verification section, corrected in-round. FIRST, its ```verify fence ran `npm test --prefix packages/intentionsutil`, which resolves to `vitest run` (packages/intentionsutil/package.json:13) and never executes a .sh file — the fence would have passed without running a single one of the new assertions, the dead-verify-path class tactic-node-verify-fence-dead-test-path-sweep exists for. The correct command is the shell suite invoked directly: packages/intentionsutil/scripts/test-verify-landed.sh. SECOND, the node's closing caution — 'the new shell suite is not auto-discovered by CI ... confirm the new suite is actually invoked by a CI job before calling this node done' — is already satisfied for this suite: .github/workflows/unit-tests.yml:307 registers test-verify-landed.sh explicitly, so cases appended to that existing file inherit CI coverage and no registration step is owed. The caution remains true as a general rule for a NEW file under packages/intentionsutil/scripts/, which this plan does not create — appending to the existing harness is also what the file's own design note (:9-13, 'nothing is shimmed and nothing is copied into the scratch tree') keeps intact, since all four remaining unknown routes are reachable through seeded content and plain git/jq behavior rather than shimmed binaries.

## Observation 3 — this strategy's stored `reading` no longer reproduces, and its non-increasing claim fails on the latest pair

**Premise (verbatim, `material: false`, `plan_depends: false`):**

> strategy-graph-native-dispatch's stored `reading` is ten days stale and its arithmetic no longer reproduces. Re-run this round via align-tactics-census.ts: 305 tactics serve this strategy (106 draft, 29 born-parked, 73 open, 97 done), so backlog = 102/305 = 33.4% against a stored reading of 58/236 = 24.6% stamped 2026-08-10. Still inside the declared 35% band, but the ratio ROSE on this pair, so the reading's own 'non-increasing' series claim does not hold on the 2026-08-10 to 2026-08-20 sample, and the denominator grew about 29% in ten days. This is immaterial to the target node's plan (which reduces the backlog rather than depending on it), it is not a Side A failure — the condition's declared band still holds and its remedy is an author decision on the STRATEGY, which a per-node session cannot write — and tactic mode explicitly excludes the strategy's reading/gap state from evaluation.

**Proposed clarification text (verbatim — paste-ready if promoted):**

> (Observed 2026-08-20 during an /align-tactics per-node round on tactic-verify-landed-unknown-arm-untested; immaterial to that node's plan and recorded without interrupting it, so a future strategy-target round does not trust the stored figure.) This strategy's stored `reading` is stamped 2026-08-10 and reports backlog 58/236 = 24.6% with a 28-day series of 47.6% to 38.2% to 31.4% to 24.6% described as non-increasing. Re-derived this round with packages/intentionsutil/scripts/align-tactics-census.ts against the current store: 305 tactics serve this strategy — 106 draft, 29 born-parked, 73 open, 97 done — so backlog is 102/305 = 33.4%. That is still inside the declared 35% band of the maintenance-burden condition, but the ratio ROSE across the 2026-08-10 to 2026-08-20 pair, so the reading's 'non-increasing across consecutive samples' claim does not hold on that pair, and the denominator grew roughly 29% in ten days. This is NOT recorded here as the maintenance-burden condition failing: that condition's own text reserves failure for a burden 'growing without bound', its declared band still holds, and its remedy is an author decision that parks the STRATEGY — which a per-node tactic session cannot write. It is recorded so the next round re-derives the series at read time rather than reading it off the node: `gap` is derived by deriveGap (packages/intentionsutil/src/sensors.ts) and is therefore always current, but `reading` is stored frontmatter and goes stale silently.

## Observation 4 — conditions asserting enforcement in present tense whose sole carrier is an unplanned draft

**Premise (verbatim, `material: false`, `plan_depends: false`):**

> A cross-cutting record observation surfaced by this round's gather pass and spot-verified: several conditions assert enforcement in confident present tense while their sole implementing tactic is still an unplanned draft. Verified in this worktree — tactic-pr-title-node-id-convention, tactic-router-failure-fuses, tactic-claim-containment-durable-anchor, tactic-terminal-declaration-verified-against-node, tactic-scope-stamp-in-graph and tactic-finding-search-all-producers are all phase null; tactic-node-ancestry-context is phase implement, not done. For the PR-title condition specifically, a grep of .github/workflows and .github/scripts for PR-title or node-id checking returns nothing, so the 'a CI guard rejects a title that is non-conforming' clause has no implementation. None of this gates the target node's plan, and none of it is a dead premise the plan rests on.

**Proposed clarification text (verbatim — paste-ready if promoted):**

> (Observed 2026-08-20 during an /align-tactics per-node round on tactic-verify-landed-unknown-arm-untested; immaterial to that node's plan, recorded for a future strategy-target round to reconcile.) A cross-cutting gap between condition language and carrier state, surfaced by this round's clause-coverage pass and spot-verified against this worktree: several conditions describe enforcement in confident present tense while the sole tactic implementing them is still an unplanned draft. Verified phases — tactic-pr-title-node-id-convention, tactic-router-failure-fuses, tactic-claim-containment-durable-anchor, tactic-terminal-declaration-verified-against-node, tactic-scope-stamp-in-graph and tactic-finding-search-all-producers are all phase null; tactic-node-ancestry-context is phase implement, not done. The sharpest instance is the PR-titling condition, whose text states without exemption that 'a CI guard rejects a title that is non-conforming or whose id does not resolve': a grep of .github/workflows and .github/scripts for PR-title or node-id checking returns no hits, so that clause has no implementation today and the convention rests on opener discipline alone. Two conditions already carry their own caveat for this shape — the pace-exempt set-size condition says outright it 'reads as not-yet-armed', and the router-failure-containment condition says it 'holds only where two containment properties hold' and names the two draft tactics tracking them — so the reconciliation wanted is to extend that caveat posture to the conditions that assert enforcement flatly, not to weaken any requirement. None of this gates the target node's plan, and no listed condition is a premise that plan rests on.

## Provenance

Produced by the `/align-tactics` tactic-mode round of 2026-08-20 targeting
`tactic-verify-landed-unknown-arm-untested`, landed in the same
`land-align-round` call as that node's finalize. The round's disposition was
`completed_with_fixes`; `parks` was empty and `deviation` was false. The
serving strategy was read as context and **not** written.

Two measurements in this node were taken by the caller thread and re-taken by
the round's own agents, and are the load-bearing ones:

- `packages/intentionsutil/scripts/test-verify-landed.sh` runs **25 passed, 0
  failed** on `origin/main` as of 2026-08-20, and is CI-registered at
  `.github/workflows/unit-tests.yml` under the step "Run verify-landed tests".
- `align-tactics-census.ts` against the current store: **305** tactics serve
  `strategy-graph-native-dispatch` — 106 draft, 29 born-parked, 73 open, 97
  done — giving backlog **102/305 = 33.4%**, against the stored `reading`'s
  58/236 = 24.6% stamped 2026-08-10.
