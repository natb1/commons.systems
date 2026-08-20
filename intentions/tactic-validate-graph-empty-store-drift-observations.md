---
id: tactic-validate-graph-empty-store-drift-observations
kind: tactic
statement: "Observation carrier, no plan, do not dispatch: three immaterial
  drift observations from the 2026-08-20 /align-tactics per-node review of
  tactic-validate-graph-empty-store-pass -- exit code 3 is unavailable for any
  new validate-graph guard, the blast radius of rejecting an empty store is
  exactly one test, and strategy-graph-integrity's own success signal has still
  never produced a reading"
owner: human
status: delegated
parent: null
rationale: "Minted 2026-08-20 by the /align-tactics per-node drift review of
  tactic-validate-graph-empty-store-pass. Its Side-B review surfaced one
  material premise (parked on that node) and three immaterial ones. Immaterial
  observations may not be written as clarifications on the serving strategy:
  strategy-graph-native-dispatch clarification 118 permitted that and was
  OVERTURNED 2026-08-15 by violation V1 of the autonomous-substance invariant,
  which routes them to a born-parked observation node instead. The reasons are
  that clarifications is an allowlist member of strategyFingerprint, so an
  autonomous write there soft-freezes every open child of the strategy over
  something defined as gating nothing; that clarifications is a
  requirement-entry surface reserved to the /align interview; and that a
  model-authored dated clarification is byte-indistinguishable from an
  author-ruled one, collapsing provenance in the field that carries doctrine.
  This node is that destination. It carries no plan and must never be
  dispatched. A human promotes whichever entries are worth it into real
  clarifications at office hours and drops the rest."
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
  reason: "Born parked as an observation carrier -- there is no plan here and
    nothing to dispatch. It exists because the 2026-08-20 /align-tactics
    per-node drift review of tactic-validate-graph-empty-store-pass produced
    three immaterial observations that have no other legal destination: an
    autonomous session may not write clarifications onto a serving strategy
    (strategy-graph-native-dispatch clarification 118, OVERTURNED 2026-08-15 by
    violation V1). The three observations are recorded in full in this node's
    body. None of them gated the review; the material premise that did gate it
    is parked separately on tactic-validate-graph-empty-store-pass. Observations
    1 and 2 are planning inputs for that node's eventual ruling and are
    duplicated in its park reason so the ruling sitting is self-contained;
    observation 3 is about this serving strategy's own signal and is recorded
    nowhere else."
  since: 2026-08-20
  recommendation: >-
    Read the three observations in the body and give each ONE of three
    dispositions -- drop, clarify-only, or mechanize -- then resolve this node.
    It is a carrier: once each entry is dispositioned there is nothing left to
    keep it open.


    Suggested dispositions, for the author to accept or override:


    Observation 1 (exit code 3 is taken twice over) -- MECHANIZE is defensible:
    an exit-code registry, or a test asserting the CAS stale-diagnosis meaning
    of 3 across park-node / clear-park / release-wait, would stop the next
    author rediscovering this by collision. CLARIFY-ONLY is the cheaper read,
    since the collision surfaces only when a script mints a new code. Do not
    DROP -- the fact was expensive to establish and the ref-diagnosis-time-cas
    doctrine depends on 3 keeping one meaning.


    Observation 2 (blast radius of an empty-store rejection is one test) --
    CLARIFY-ONLY at most, and only if branch (a) is ruled on
    tactic-validate-graph-empty-store-pass; otherwise DROP. It is a measurement
    about a decision that may never be taken, and it is already recorded in that
    node's park reason where the ruling will happen.


    Observation 3 (strategy-graph-integrity has never produced a reading) --
    this is the one worth a human's eye and does NOT belong to the
    validate-graph question at all. It is a fact about this strategy's own
    health: rounds.count 0, reading null, six weeks after recording, with the
    enabling tactic (tactic-align-audit-skill) sitting at phase qa on an open
    unmerged PR #2879 and .claude/skills/align-audit/ absent from main. Judged
    as pending-its-enabling-tactic rather than a lapsed cadence, so condition 4
    is not failed -- but that judgment has a shelf life. Recommend deciding at
    office hours whether PR #2879 is actually moving; if it is not, condition 4
    ("the audit cadence actually recurs") starts to bite and the honest move is
    a clarification on strategy-graph-integrity saying so, which is an /align
    sitting this session could not perform.


    GENERALIZATION WORTH THE AUTHOR'S EYE, beyond the three entries: this review
    spent its entire budget discovering that the target node's premise was
    contradicted by a test committed in the same PR the node was filed as a
    residual of. The node asserted the gap as settled fact in its rationale, and
    a residual-note reading offering two remedies had been narrowed to one
    somewhere between the note and the node without recording why. Both the
    narrowing and the contradiction were mechanically checkable before any
    planning began -- one git log on the file the Scope proposes to change.
    Consider whether residual-derived nodes should carry the originating note's
    full option set verbatim, and whether a cheap premise-preflight belongs
    ahead of the plan phase rather than inside the reuse hunts.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Drift observations — validate-graph empty-store review, 2026-08-20

**This is an observation carrier. It holds no plan and must never be
dispatched.** It exists because an autonomous `/align-tactics` session may not
write clarifications onto a serving strategy
(`strategy-graph-native-dispatch` clarification 118, **OVERTURNED 2026-08-15**
by violation V1 of the autonomous-substance invariant), and immaterial drift
observations need a legal destination. A human promotes the worthwhile entries
into real clarifications at office hours and drops the rest; see
`office_hours.recommendation` for a suggested disposition per entry.

Provenance: the two-sided drift review of the per-node `/align-tactics` run on
`tactic-validate-graph-empty-store-pass`, 2026-08-20, against origin/main
`4e8f3d31`. That run's **material** premise — that the node's Scope reverses a
contract PR #3095 deliberately established — is parked on that node, not here.
None of the three observations below gated the review.

## Observation 1 — exit code 3 is unavailable for any new validate-graph guard

`validate-graph.ts` uses only exit 0 and exit 2 today (2 being the package-wide
usage/argument-error code). If a guard is ever added that needs a distinct
code, **3 is taken, twice over**:

- **CAS stale-diagnosis** — *"the pinned `--base` no longer matches
  origin/main; re-diagnose and retry, nothing was written"* — at
  `park-node:360-363`, `clear-park:341-343`, and `release-wait:266-268`, named
  as doctrine in the `ref-diagnosis-time-cas` skill and branched on by dispatch
  tooling.
- **A second, unrelated meaning** in the same `scripts/` directory:
  `merge-node.ts:117-124` reserves 3 for a genuine tool failure on inputs,
  under a JSON-emitting output contract.

The codebase-consistent move is to mint a fresh low integer and document its
meaning locally in the file's own header comment block
(`validate-graph.ts:1-33`), exactly as `verify-landed:12-17` does for its
0/1/2/4 vocabulary.

Immaterial because it is contingent on a ruling that has not been made.

## Observation 2 — the blast radius of rejecting an empty store is one test

Caller survey for `validate-graph.ts`, 2026-08-20. Every production invocation
names a real, never-empty store:

- `.github/workflows/graph-fast-path.yml:32` — full checkout's `intentions/`.
- `.github/workflows/unit-tests.yml:162` — same.
- `.claude/skills/align/scripts/validate-deployment.sh:57` — the deployment's
  own `intentions/`, and it already treats any non-zero exit as FATAL.
- `packages/intentionsutil/test/committed-store.test.ts` imports `validateGraph`
  directly and never exercises the CLI guard at all.

So the only caller a zero-node rejection would affect is
`packages/intentionsutil/test/reader-required-dir.test.ts:77-84` — the test
that asserts the opposite contract on purpose. The open question is a pure
contract choice, not a compatibility problem.

Immaterial for the same reason as observation 1, and already duplicated into
the parked node's `office_hours.reason` so the ruling sitting is self-contained.

## Observation 3 — strategy-graph-integrity has still never produced a reading

Not about the validate-graph question at all; a fact about this serving
strategy's own health, recorded nowhere else.

Six weeks after the 2026-07-09 recording, no real `/align-audit` cycle has run:

- `tactic-align-audit-skill` is `status: codified` at `phase: qa`, with PR
  #2879 still **open and unmerged**.
- `.claude/skills/align-audit/` does not exist on `main`.
- The strategy's own `rounds.count` is `0` and `reading` is `null`. The sole
  audit run on record is the *emulated* one in clarification 6.

Read against condition 4 (*"the audit cadence actually recurs"*), this is a
cadence **pending its enabling tactic** rather than a lapsed one, so the
condition is not failed and this is not a Side-A park. The token-bounded
condition's mechanism did land independently: `graph-digest.ts` is on `main`
via `4f12acac` (PR #2865).

That judgment has a shelf life. If PR #2879 is not actually moving, condition 4
starts to bite, and saying so is an `/align` sitting this session could not
perform.

## Generalization worth the author's eye

This review spent its whole budget discovering that the target node's premise
was contradicted by a test committed **in the same PR the node was filed as a
residual of**. The node asserted the gap as settled fact in its `rationale`,
and the originating residual note's two-remedy reading had been narrowed to one
somewhere between note and node, with no record of why.

Both the narrowing and the contradiction were mechanically checkable before any
planning began — one `git log` on the file the Scope proposes to change. Worth
considering: whether residual-derived nodes should carry the originating note's
full option set verbatim, and whether a cheap premise-preflight belongs ahead of
the plan phase rather than buried in the reuse hunts.
