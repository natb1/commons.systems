---
id: tactic-validate-graph-empty-store-pass
kind: tactic
statement: "validate-graph exits 0 on an intentions directory that exists and
  holds zero nodes, printing an ok line with a zero count -- which the node was
  filed to call a defect against the contract three lines above its own guard,
  but which PR #3095 itself deliberately tested as correct; whether a
  caller-named empty store is a legitimate empty graph or a vacuous pass is an
  unruled requirement question, so this node is parked for an author ruling
  rather than planned"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. PR1 made the
  intentions-directory argument required and made a MISSING directory exit 2. It
  did not add a zero-node guard. AMENDED 2026-08-20 (/align-tactics per-node
  drift review, whole-node reconciliation): the original framing of that as an
  unclosed gap does not survive verification. The same merged PR landed
  packages/intentionsutil/test/reader-required-dir.test.ts:77-84, a passing test
  asserting exit 0 and 'ok -- 0 nodes' for a caller-named empty directory, with
  the recorded rationale that an empty store the caller NAMED is a legitimate
  empty graph and the defect was reporting that verdict for a directory nobody
  named. The originating residual note
  (intentions/tactic-explicit-ref-graph-reads.md:112-120) offers TWO resolutions
  -- add the guard, or narrow the docstring to the contract the code actually
  keeps -- and this node's Scope silently picked the first. So the specification
  is NOT simply present with the code one check short of meeting it: the two
  artifacts that record an intent record opposite intents, and no clarification
  anywhere in the graph rules between them. The node is parked for that ruling.
  AMENDED 2026-08-31: the premise in the sentence above is REFUTED.
  graph-commit's --base is a per-id opt-in, not a whole-batch mode.
  check_base_freshness returns early on an empty manifest and otherwise
  iterates only the manifest's own keys, so a positional id absent from the
  manifest is simply not CAS-checked; and the ordinary-id guard asks only
  that intentions/<id>.md exist on disk, never on origin/main. The header
  documents --prune as mixable with ordinary positional ids. One invocation
  can therefore carry creates, edits and prunes together. Only the stated
  REASON was wrong: the decision it explains -- filing PR1's residuals as
  their own nodes rather than folding them into that batch -- stands on its
  own merits and is not disturbed by this correction."
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
    Requirement ambiguity the plan cannot resolve on its own authority: this
    node's Scope reverses a contract the same merged PR deliberately
    established, and nothing in the graph rules which of the two is intended.


    VERIFIED AT HEAD (2026-08-20, origin/main 4e8f3d31):


    1. packages/intentionsutil/test/reader-required-dir.test.ts:77-84 is a
    currently-PASSING test named "validates a directory the caller named, even
    an empty one". It asserts `expect(run.status).toBe(0)` and
    `expect(run.stdout).toContain("ok - 0 nodes")`, carrying the inline
    rationale: "An empty store the caller NAMED is a legitimate (if empty)
    graph; the defect was reporting that verdict for a directory nobody named."
    `git log` on that file returns exactly one commit -- fe0b1c4d, "pr1: graph
    write-path integrity (#3095)", merged 2026-08-15. That is the very PR this
    node is filed as a residual of. The empty-store exit 0 is therefore a
    deliberate, tested, commented decision of that PR, not a case it overlooked.


    2. The originating residual note,
    intentions/tactic-explicit-ref-graph-reads.md:112-120, closes: "A follow-up
    should either add that guard or narrow the docstring to the contract the
    code actually keeps." Two resolutions. This node's Scope takes the first and
    records no reason for rejecting the second.


    3. The governing clarifications on strategy-graph-native-dispatch (194 R3,
    2026-08-05; 242, 2026-08-15) adopt only the required-explicit-argument shape
    and the four-file partition. Neither rules on the named-but-empty case. No
    clarification or node in intentions/** or .claude/** decides the direction.


    WHY THIS BLOCKS PLANNING RATHER THAN BEING PLANNED AROUND: implementing the
    Scope as written requires inverting the assertions of a
    deliberately-authored passing test. Under .claude/rules/test-integrity.md a
    test may be updated when the underlying contract is intentionally changing
    -- but declaring that intent is the author's call, and the only artifact on
    record that declares an intent declares the opposite one. An autonomous
    session cannot ratify that reversal for itself.


    PROPOSED CLARIFICATION, VERBATIM AND PASTE-READY FOR THE RULING:


    "Is a caller-named intentions directory holding zero nodes a legitimate
    empty graph (exit 0) or a vacuous pass to reject (non-zero)? PR #3095
    (fe0b1c4d) landed reader-required-dir.test.ts:77-84 asserting the former
    with an explicit rationale, while validate-graph.ts:107-112's docstring
    ('Validating \"nothing\" is never a pass') states the latter; the residual
    note on tactic-explicit-ref-graph-reads offers both fixes (add the guard, or
    narrow the docstring). Rule the direction: (a) add a zero-node guard and
    update that test's expectations as a deliberate contract change, or (b)
    narrow the docstring to the existence/is-a-directory contract the code
    actually keeps and close the residual with no behavior change."


    NOTE ON WHERE THE RULING LANDS: the clarification that settles this belongs
    on strategy-graph-native-dispatch, whose clarifications 194/242 own the
    required-explicit-tree contract. A per-node /align-tactics session may not
    write the serving strategy (strategy-graph-native-dispatch clarification
    118, OVERTURNED 2026-08-15 by violation V1 of the autonomous-substance
    invariant). So this needs an author sitting, not a re-plan.


    PLANNING INPUTS ALREADY GATHERED, so the ruling is the only remaining
    blocker and either branch is a small PR: (i) blast radius of branch (a) is
    exactly one test block -- every production caller names a real, never-empty
    store (.github/workflows/graph-fast-path.yml:32,
    .github/workflows/unit-tests.yml:162,
    .claude/skills/align/scripts/validate-deployment.sh:57, which already treats
    any non-zero exit as FATAL;
    packages/intentionsutil/test/committed-store.test.ts imports validateGraph
    directly and never touches the CLI). (ii) If branch (a) is ruled, exit code
    3 is NOT available for the new guard -- it already carries the CAS
    stale-diagnosis meaning (park-node:360-363, clear-park:341-343,
    release-wait:266-268, doctrine in the ref-diagnosis-time-cas skill) plus an
    unrelated meaning at merge-node.ts:117-124. validate-graph.ts uses only 0
    and 2 today; mint a fresh low integer documented in its own header block,
    the verify-landed:12-17 pattern. These two observations are carried in full
    on tactic-validate-graph-empty-store-drift-observations.
  since: 2026-08-20
  recommendation: >-
    Rule ONE question at office hours, then unpark: is a caller-named intentions
    directory holding zero nodes a legitimate empty graph (exit 0), or a vacuous
    pass to reject (non-zero)? Record the ruling as a dated clarification on
    strategy-graph-native-dispatch alongside clarifications 194/242, which own
    the required-explicit-tree contract -- an /align sitting, since a per-node
    /align-tactics session may not write a serving strategy. Then re-run
    /align-tactics tactic-validate-graph-empty-store-pass, which can plan either
    branch in a single PR once the ruling exists.


    BRANCH (a) -- REJECT THE EMPTY STORE (the node's current Scope). Add the
    zero-node guard in validate-graph.ts after store enumeration and before the
    ok lines at :208, naming the resolved absolute path as assertIsDirectory
    (:113-131) already does. This is a deliberate contract change, so it must
    ALSO rewrite packages/intentionsutil/test/reader-required-dir.test.ts:77-84
    -- renaming the test, inverting its assertions, and replacing its inline
    rationale comment with the new ruling and its date. That rewrite is
    legitimate only under an explicit ruling; without one it is the
    test-weakening .claude/rules/test-integrity.md forbids. Do NOT use exit 3
    (taken: CAS stale-diagnosis, plus merge-node.ts:117-124); mint a fresh low
    integer documented in validate-graph.ts's own header, per
    verify-landed:12-17. Blast radius is that one test -- no production caller
    validates an empty store.


    BRANCH (b) -- ACCEPT THE EMPTY STORE (narrow the docstring). No behavior
    change: amend validate-graph.ts:107-112's docstring so it claims only the
    existence/is-a-directory contract the code actually keeps, and state
    positively that a caller-NAMED zero-node store is a legitimate empty graph,
    citing the test that pins it. Also amend the residual note at
    intentions/tactic-explicit-ref-graph-reads.md:112-120, which currently
    asserts the docstring 'overstates what landed' as though the guard were
    owed. Cheapest branch and the one the existing recorded intent points at.


    BRANCH (c) -- SPLIT THE DIFFERENCE, worth considering before ruling (a) or
    (b): the real risk the node names is a run from an unexpected working
    directory silently reporting a clean graph. That is arguably better
    addressed by making CALLERS assert a nonzero node count than by making an
    empty store globally illegal -- an empty store is legitimate for the
    scratch-repo fixtures that reader-required-dir.test.ts itself builds. If
    this is ruled, the node is re-scoped away from validate-graph.ts entirely
    and branch (b)'s docstring narrowing still applies.


    If the ruling is (b) or (c), say so explicitly on the node -- under (b) this
    tactic is complete at the docstring amendment and should not be left open as
    though code work were owed.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Empty store: pass or vacuous pass? — parked for an author ruling

## Parked 2026-08-20 — the premise is disputed, not settled

This node was filed as though `validate-graph.ts` had a specification its code
was one check short of meeting. Verification at HEAD (origin/main `4e8f3d31`)
does not support that framing, so the node is parked for a ruling instead of
planned. **Do not implement the Scope below as written** — it is one of two
candidate branches, not a decided direction.

What the review found:

- `packages/intentionsutil/test/reader-required-dir.test.ts:77-84` is a
  **currently-passing** test, `it("validates a directory the caller named, even
  an empty one")`, asserting `status === 0` and stdout containing
  `ok — 0 nodes`. Its inline rationale: *"An empty store the caller NAMED is a
  legitimate (if empty) graph; the defect was reporting that verdict for a
  directory nobody named."*
- `git log` on that file returns exactly one commit — `fe0b1c4d`,
  *"pr1: graph write-path integrity (#3095)"*, merged 2026-08-15. **That is the
  same PR this node is a residual of.** The exit-0-on-empty behavior is a
  deliberate, tested, commented decision of that PR, not a case it missed.
- The originating residual note
  (`intentions/tactic-explicit-ref-graph-reads.md:112-120`) offers **two**
  resolutions — *"either add that guard or narrow the docstring to the contract
  the code actually keeps"*. This node's Scope took the first and recorded no
  reason for rejecting the second.
- Clarifications 194 (2026-08-05) and 242 (2026-08-15) on
  `strategy-graph-native-dispatch` adopt only the required-explicit-argument
  shape and the four-file partition. Neither rules on the named-but-empty case,
  and no other node or clarification in the store decides it.

So the two artifacts that record an intent record **opposite** intents. Under
`.claude/rules/test-integrity.md` a test may be rewritten when the underlying
contract is intentionally changing — but declaring that intent is the author's
call, and the only recorded intent points the other way. See this node's
`office_hours.recommendation` for the ruling question and the three candidate
branches.

## Context

`validate-graph.ts` carries a docstring at `:111`:

> Validating "nothing" is never a pass.

`assertIsDirectory` (`:113`) enforces the part it was written for. A path that
does not exist exits 2 with a message saying nothing was validated. A path that
exists but is **not** a directory exits 2 as well.

A directory that exists and contains zero nodes is unguarded. It runs the whole
validator over an empty list and reaches `:208`:

```
process.stdout.write(`ok — ${nodes.length} nodes\n`);
```

which prints `ok — 0 nodes` and exits **0**. Measured on `main` at `063b3df2`
against an empty directory: exit 0, three `ok` lines, no diagnostic. Still true
at `4e8f3d31`.

Two readings of that fact are live, and the ruling has to pick one. Either the
docstring states the real contract and the code is one guard short of it (the
node's original reading), or the docstring overstates a contract deliberately
narrowed in review and a caller-named empty store is a legitimate empty graph
(the reading `reader-required-dir.test.ts` records).

The risk the node was filed against is real either way and is worth keeping in
view: every `verify` fence in the serialized graph write-path plan runs
`validate-graph.ts intentions` as a path relative to a repo root, so a run from
an unexpected working directory reports a clean graph rather than failing. Note
that this is an argument about *callers pointing somewhere unintended*, which
branch (c) in the recommendation addresses without making an empty store
globally illegal.

## Scope — CONDITIONAL on branch (a) being ruled

Retained as the candidate scope for one of three branches, not as agreed work.
If the ruling is (b) or (c) this section does not apply at all and should be
replaced when the node is re-planned.

In `packages/intentionsutil/scripts/validate-graph.ts`, after store enumeration
and before the `ok` lines at `:208`: exit non-zero when the store resolved to
zero nodes. The message must name the **resolved absolute path**, as
`assertIsDirectory` already does — the failure mode is a caller who believes
they pointed at a different directory than they did.

Use an exit code distinct from the existing usage errors. **Not `3`** — that
code already carries the CAS stale-diagnosis meaning (`park-node:360-363`,
`clear-park:341-343`, `release-wait:266-268`, doctrine in the
`ref-diagnosis-time-cas` skill) and a second, unrelated meaning at
`merge-node.ts:117-124`. `validate-graph.ts` uses only 0 and 2 today; mint a
fresh low integer and document it in the file's own header block, the pattern
`verify-landed:12-17` already follows.

Branch (a) **must also** rewrite `reader-required-dir.test.ts:77-84` — rename
the test, invert its assertions, and replace its inline rationale comment with
the ruling and its date. That rewrite is legitimate only under an explicit
ruling; absent one it is the test-weakening `.claude/rules/test-integrity.md`
forbids.

Out of scope in every branch: the graph rules themselves, and the sensor and
prose-ref sections.

## Dependencies

Blocked on an author ruling (see `office_hours`). Once ruled, independent of
the other PR #3095 residuals and can land alone in a single PR on any branch.

## Reuse

- `assertIsDirectory` (`validate-graph.ts:113-131`) — the message shape, the
  `resolve()` call that prints the absolute path, and the "Nothing was
  validated — this is NOT a clean graph" phrasing are established there and
  should be matched, not re-invented, if branch (a) is ruled.
- `reader-required-dir.test.ts:77-84` — the test that pins the current
  contract. Branch (a) rewrites it; branch (b) cites it.
- `verify-landed:12-17` — the precedent for a script documenting its own
  exit-code vocabulary in its header.

## Verification

No `verify` fence is recorded while the node is parked: the only assertion
worth fencing is the one under dispute, and fencing it would encode the
unruled direction as fact. The blast-radius measurement below is what a
re-plan starts from.

Blast radius of branch (a), measured 2026-08-20: exactly one test block. Every
production caller names a real, never-empty store —
`.github/workflows/graph-fast-path.yml:32`,
`.github/workflows/unit-tests.yml:162`, and
`.claude/skills/align/scripts/validate-deployment.sh:57` (which already treats
any non-zero exit as FATAL). `packages/intentionsutil/test/committed-store.test.ts`
imports `validateGraph` directly and never exercises the CLI guard. So this is
a pure contract choice, not a compatibility problem.

Whichever branch is ruled, the real graph must keep passing
(`validate-graph.ts intentions` exits 0) and
`npm test --prefix packages/intentionsutil` must be green — including whatever
`reader-required-dir.test.ts` asserts after the ruling.
