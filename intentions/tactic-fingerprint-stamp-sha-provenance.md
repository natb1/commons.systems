---
id: tactic-fingerprint-stamp-sha-provenance
kind: tactic
statement: Fix the strategy_fingerprint sha stamp, which pairs a post-edit
  substance hash with a commit that predates the substance it describes
owner: ai
status: raw
parent: null
rationale: "Found 2026-08-14 by the adversarial draft review. schema.ts defines
  sha as the origin/main commit the hash was computed against, so that a stale
  child can recover the delta via git diff sha..origin/main --
  intentions/<strategy-id>.md. But an align round computes the hash from its
  POST-edit working tree and records the sha it can see, which is origin/main
  BEFORE its own commit — so the pair is {hash: post-edit, sha: pre-edit} and
  the documented recovery returns the aligning round's own delta as if it were
  unabsorbed drift. Measured 2026-08-20 across the whole population: all 5 keyed
  stamps in the graph fail fp(strategy@stamped-sha) == hash and all 5 satisfy
  fp(strategy@stamping-commit) == hash. CORRECTED 2026-08-20: the defect is NOT
  systemic across writers, as this rationale previously claimed — on origin/main
  the align-round hand-stamp path is the only stamp producer, and a router-path
  stamp would be correct because its commit does not edit the strategy. Also
  corrected: the recorded sha is the commit's parent in only 2 of 5 cases; in
  the other 3 it is an arbitrary earlier commit. Candidate fixes: stamp from
  graph-commit after the push, or drop sha and recover the revision with git log
  -S<hash> -- intentions/<tactic-id>.md. PARKED 2026-08-20 — the keep-vs-delete
  choice is unratified and an unmerged sibling is building the opposite answer;
  see office_hours."
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
  reason: "Requirement ambiguity — one author ruling is needed before this node
    can be planned: does `execution.strategy_fingerprint` KEEP its `{hash, sha}`
    object form (fixing sha's VALUE), or is `sha` DELETED in favour of
    recovering the revision on demand with `git log -S<hash> --
    intentions/<tactic-id>.md`? The two answers produce completely different
    unit sets, file scope and tests, and two rounds of this strategy are pulling
    opposite ways with no ruling between them. (a) THIS NODE'S OWN TIEBREAK
    RESOLVES TO DELETE. Its body says 'evaluating (2) [drop sha] first on
    parsimony grounds; (1) if some reader genuinely needs the sha inline' — and
    no reader needs it: every consumer compares only the hash
    (packages/intentionsutil/src/transitions.ts stampHash / isFingerprintStale;
    packages/intentionsutil/scripts/check-node-selection.ts), and
    packages/intentionsutil/test/transitions.test.ts pins that sha is never
    compared. Applied mechanically, the node's own decision rule deletes the
    field. (b) THE UNMERGED SIBLING MOVES THE OPPOSITE WAY.
    tactic-strategy-fingerprint-stamp-coverage is at phase qa on branch
    origin/tactic-strategy-fingerprint-stamp-coverage, unmerged. Verified by
    diff against origin/main this session (20 files, +1571/-90): it adds
    packages/intentionsutil/scripts/lib-strategy-stamp.ts (94 lines) as the
    single home of the `{hash, sha}` fold, whose header states `--strategy-sha`
    is REQUIRED because 'the stamp is meaningless without the origin/main commit
    the hash was computed against — that sha is what lets a stale child recover
    the exact delta via git diff <sha>..origin/main'; it wires TWO NEW stamp
    writers (write-node.ts mint-time, +118; transition-node transition-time,
    +44); and it test-pins the contract with a new 237-line
    test-strategy-stamp-doctrine.sh plus additions to write-node.test.ts and
    compute-freshness.test.ts. Deleting sha would gut a sibling's just-built,
    test-pinned design one merge before it lands; keeping sha overrides this
    node's own recorded preference. Neither side adds a reader of `.sha`, so the
    field stays write-only under BOTH answers — the parsimony argument and the
    mandatory-flag argument are live on the same evidence, and nothing in the
    strategy or either node rules between them. (c) THE SIBLING ALSO PROPAGATES
    THE DEFECT, which makes the ruling time-sensitive. Its new mint-time writer
    takes sha from the same pre-push `git rev-parse origin/main`
    (write-path.md:153 in that branch, 'sha is git rev-parse origin/main'), so
    on merge the off-by-one stops being a prose-only convention and becomes a
    first-class code path, and the align round that stamps at mint time is
    exactly the round that edits the strategy. (d) SECONDARY BLOCKER RIDING THE
    SAME RULING: that sibling replaces the entire writer surface this fix
    targets, so every path:line anchor derived from current origin/main is void
    on its merge. This node's own '### Sequence after' section also misstates
    the reason — it says the two fixes 'land in the same transition-node lines'
    and are 'genuinely independent', but transition-node writes no strategy
    stamp today; the sibling adds one. The ordering conclusion survives, the
    stated mechanism does not, and the nodes are not independent."
  since: 2026-08-20
  recommendation: "Rule the keep-vs-delete question at office hours, then re-plan
    — do NOT send this node to a phase worker as it stands. Concretely: (1)
    DECIDE. Recommended answer is DELETE `sha`, on this node's own recorded
    tiebreak plus the measurement that no code reads it; the honest
    counter-argument is that the sibling has already built and test-pinned the
    opposite, so choosing delete means telling that sibling's author to strip
    lib-strategy-stamp.ts's mandatory `--strategy-sha` and the doctrine test
    rows that pin it. If instead you KEEP sha, the fix is to make its value
    honest, and the only mechanism that can is a post-push rewrite from
    graph-commit — re-cost that first: graph-commit cannot push to main directly
    (main's ruleset needs four checks already green on the exact sha), so each
    land runs commit -> push graph/** -> poll ~30-60s -> push sha:main, and a
    post-push re-stamp is a whole second commit + CI-stamp cycle per align
    round, not one extra write. A cheaper keep-variant worth considering: leave
    sha as the honest base it actually is, rename what it MEANS in the docs (the
    revision the round read, not the revision the hash describes), and publish
    `git log -S<hash>` as the recovery command alongside it. (2) SEQUENCE.
    Whatever you rule, this node should be re-planned only AFTER
    tactic-strategy-fingerprint-stamp-coverage merges — consider setting
    `blocked_by: [tactic-strategy-fingerprint-stamp-coverage]` on this node
    rather than leaving the ordering as prose. blocked_by is author-owned, which
    is why this session recommends it rather than writing it. (3) THEN re-run
    `/align-tactics tactic-fingerprint-stamp-sha-provenance` against the
    post-merge tree. Scope the fix to where the off-by-one actually occurs — the
    align-round hand-stamp path
    (.claude/skills/align-tactics/references/write-path.md, its two duplicates
    in references/tactic-target.md, and .claude/skills/align/SKILL.md's
    materiality re-stamp), plus, after the merge, the sibling's new mint-time
    writer — never to 'every writer'. Reuse rather than re-derive:
    graph-commit's post-push `pushed=<sha>` verdict line (already parsed by
    packages/intentionsutil/scripts/land-align-round) is the landed-sha signal a
    keep-variant needs, and restamp-scope-fingerprint.ts's restampScopeFromRev
    is the existing compute-a-stamp-from-a-named-revision idiom. (4) DISPOSITION
    OF THE 5 EXISTING WRONG STAMPS is a real planning decision, not an
    implementer's: backfill them, leave-and-document them, or scope any new
    correctness check to stamps written after the fix. A check that recomputes
    fp(strategy@sha) == hash over every keyed stamp fails on all 5 today. (5)
    Five immaterial drift observations from this same round — including two
    corrections to this node's own record — are carried on
    tactic-fingerprint-sha-provenance-drift-observations, landed alongside this
    park."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the strategy_fingerprint sha stamp, which pairs a post-edit substance hash with a commit that predates the substance it describes

> **PARKED 2026-08-20 to `office_hours` (requirement ambiguity).** A
> `/align-tactics` tactic-mode round measured the defect across the whole
> stamp population and then declined to author a plan, because the keep-vs-delete
> choice for the `sha` field is unratified and an unmerged sibling is building
> the opposite answer. The park `reason` and `recommendation` carry the full
> decision context; §Measurement and §Corrections below carry what the round
> established. Two sections of the original draft are **superseded** — they are
> kept for provenance and marked inline. Companion observation carrier for this
> round's five immaterial drift observations:
> `tactic-fingerprint-sha-provenance-drift-observations`.

## Draft context (2026-08-14 /align correction round)

Found by the adversarial draft review of the 2026-08-14 node-creation-surface
round.

### The defect

`packages/intentionsutil/src/schema.ts` defines the `sha` half of a
`strategy_fingerprint` stamp as "the `origin/main` commit the hash was computed
against — i.e. the exact revision of `intentions/<strategy-id>.md` the stamp
reflects", so that "a stale child can recover the precise delta via
`git diff <sha>..origin/main`".

But an aligning round computes the `hash` from its **post-edit** working tree and
stamps the `sha` it can see, which is `origin/main` **before** its own commit —
the parent. So the recorded pair is `{hash: post-edit, sha: pre-edit}`, and the
documented recovery command returns the aligning round's own delta as if it were
unabsorbed drift.

### It is systemic, and this round reproduced it knowingly — SUPERSEDED 2026-08-20

**The "systemic" claim in this section is wrong; see §Corrections, item 1.** The
paragraph below is kept for provenance. Its two concrete stamp observations are
correct and are subsumed by the fuller measurement in §Measurement.


The stamp landed by the 2026-08-14 round was
`{hash: e6c91efb…, sha: 2d2e77d4…}`, and `2d2e77d4` is that commit's parent. The
stamp before it had the same shape. **This correction round reproduced it again**
— it stamped `{hash: 48e73a56…, sha: e23fea43…}`, where `e23fea43` is again the
parent — because a writer cannot know its own commit sha before committing, and
no other convention exists yet. Recording that here rather than quietly repeating
it.

Severity is bounded: the `hash` half is authoritative for staleness detection and
is correct. Only the `sha` half, used for delta recovery, is wrong.

### Two candidate fixes

1. **Stamp from `graph-commit` after the push.** It learns the landed sha and can
   rewrite the field in the same push. Keeps the documented recovery path
   working. Costs a second write inside the commit flow.
2. **Drop `sha` entirely** and recover the revision on demand with
   `git log -S<hash> -- intentions/<id>.md`, which is exact and needs no second
   field to keep in sync. Simpler, and removes a field that has been wrong at
   every site since it was introduced.

Recommend evaluating (2) first on parsimony grounds; (1) if some reader genuinely
needs the sha inline.

### Scope note

Correct the `schema.ts` doc comment in the same change — as written it describes
a guarantee the writers do not provide.

### Sequence after `tactic-strategy-fingerprint-stamp-coverage` — MECHANISM SUPERSEDED 2026-08-20

**The ordering conclusion below stands and is now stronger. Its stated reason —
"both fixes land in the same `transition-node` lines" and the two defects being
"genuinely independent" — is wrong; see §Corrections, item 2.** Kept for
provenance.

Added 2026-08-15 by the pre-commit review. That node is at `phase: qa` with an
open PR, and it litigates a **different** sha bug on the same line — blob-vs-commit
— with a verification that asserts `git cat-file -t <sha>` returns `commit`. Note
that check **passes** on the parent-vs-child off-by-one described here, so the
two defects are genuinely independent, but both fixes land in the same
`transition-node` lines. Sequence this one after it to avoid a guaranteed
conflict. No `blocked_by` edge is set: this is ordering advice, not a hard
dependency, and this node is executable alone if the other is abandoned. (This
round deliberately did **not** body-edit that node despite the subject overlap —
editing a `phase: qa` tactic's body from an `/align` round trips the
scope-fingerprint chain-of-custody gate.)

## Measurement (2026-08-20 `/align-tactics` round, against `origin/main` `9f152203`)

The defect was measured across the **whole** stamp population rather than
inferred from two examples. Method, per keyed stamp: recompute
`strategyFingerprint(strategy)` from the strategy file content at the stamped
`sha` (`git show <sha>:intentions/<sid>.md` → `parseNodeRaw` →
`strategyFingerprint`) and compare against the stamped `hash`; then find the
commit that introduced the hash into the **tactic** file
(`git log --reverse --format=%H -S<hash> -- intentions/<tactic-id>.md`) and
recompute there. Re-derive nothing by hand: `strategyFingerprint` lives in
`packages/intentionsutil/src/router.ts` and its single runnable CLI callsite is
`packages/intentionsutil/scripts/strategy-fingerprint.ts` (`--dir`).

| tactic | serving strategy | `fp(strategy@stamped-sha) == hash` | `fp(strategy@stamping-commit) == hash` |
|---|---|---|---|
| `tactic-dispatch-config-template` | `strategy-owned-orchestration` | **false** | **true** |
| `tactic-first-sensor-pass` | `strategy-graph-drives-dispatch` | **false** | **true** |
| `tactic-owner-review-reading-pass-a` | `strategy-graph-drives-dispatch` | **false** | **true** |
| `tactic-strategy-fingerprint-stamp-coverage` | `strategy-graph-native-dispatch` | **false** | **true** |
| `tactic-sync-reader-skill` | `strategy-graph-native-dispatch` | **false** | **true** |

5 of 5 keyed stamps are wrong; 5 of 5 are recoverable from their own stamping
commit. `tactic-owner-review-reading-pass-b` carries the identical stamp to
`pass-a`.

Three further facts the plan will need:

- **No code reads `.sha`.** `stampHash` in
  `packages/intentionsutil/src/transitions.ts` returns `value.hash` and discards
  the rest; `isFingerprintStale` compares hashes only, and
  `packages/intentionsutil/test/transitions.test.ts` pins that `sha` is never
  compared. The field is documentary today — its only stated purpose is the
  recovery command.
- **The recovery command in candidate fix 2 works, with one correction.** It must
  name the **tactic** file, not the strategy file: the substance hash is a hash
  *of* the strategy and never appears *in* it, so
  `-S<hash> -- intentions/<strategy-id>.md` matches nothing. Take the **first**
  hit (`--reverse`, or `| tail -1` without it) — a bare `-1` returns the commit
  that *removed* the hash on a node whose stamp was later replaced. A refresh
  re-stamp that advances `sha` while leaving `hash` unchanged produces no new
  `-S` hit, which is correct but should be stated.
- **Candidate fix 1 costs more than "a second write".** `graph-commit` cannot
  push to `main` directly — `main`'s ruleset requires four checks already green
  on the exact SHA — so each land runs
  `commit → pull --rebase → push HEAD:graph/<id>-<pid> → poll ~30-60s → push
  <sha>:main`. A post-push re-stamp is a whole second commit plus `graph/**`
  CI-stamp cycle per align round, and it briefly leaves `main` holding a stamp
  the fix is about to rewrite. It also cuts against `graph-commit`'s own header
  rule that it "never authors node content itself" (strategy clarifications 86
  and 242).

**Out of scope, do not repair here.** The two flat, un-keyed `{hash, sha}` values
on `tactic-node-toolchain-single-source` and
`tactic-practitioner-support-boundary` are a different defect — the missing
strategy-id key — owned by `tactic-strategy-fingerprint-stamp-shape`
(`serves: strategy-graph-self-description`).

**Decoy, do not conflate.** `demote-node-to-implement` and
`provision-node-worktree` both cite
`git log <stamped-sha>..origin/main -- intentions/<id>.md`. That is the **tactic
scope-custody** stamp — the worktree-local `.claude/worktrees/<id>.scope-fingerprint`
file, format `<fingerprint> <origin-main-sha>` — written locally and never
committed, so it has no equivalent off-by-one.
`tactic-scope-fingerprint-plan-substance` and
`tactic-phase-evidence-fingerprint-bound` own that surface, and
`tactic-transition-node-stamp-landed-body` (phase `done`) already fixed its
content-source defect. Useful as precedent, not as scope.

## Corrections to this node's own record (2026-08-20)

1. **The defect is not systemic across writers.** This node's rationale and the
   superseded §"It is systemic" section both claimed it was. On `origin/main`
   the align-round hand-stamp path is the *only* stamp producer: `transition-node`
   writes no strategy stamp at all (its only fingerprint sites are the scope
   stamp and a freeze message), and `apply-node-transition.ts`'s
   `--strategy-fingerprint` / `--strategy-sha` pair has no runtime caller — the
   only occurrences outside the script are its own tests and prose. A
   router-path stamp would in fact be *correct*, because the transition commit
   does not edit the strategy. The defect is specific to a stamp landed in the
   **same commit** as an edit to the stamped strategy. The rationale is
   corrected; the prose section is marked superseded rather than deleted.
2. **The stamped `sha` is the parent commit in only 2 of the 5 cases.** In the
   other 3 it is an arbitrary earlier commit — whatever `origin/main` pointed at
   when the round ran `git rev-parse origin/main`, which can be many commits
   behind by the time that round's own `graph-commit` rebases and pushes. So the
   true statement is weaker-anchored and worse than a clean off-by-one:
   `git diff <sha>..origin/main` over-reports by the round's own delta *plus* any
   unrelated strategy edits that landed in between. State the defect in these
   terms when planning.
3. **The sequencing note's mechanism is wrong and the independence claim is
   false.** `transition-node` contains no strategy-stamp write today; the sibling
   `tactic-strategy-fingerprint-stamp-coverage` *adds* one. Verified by diffing
   `origin/tactic-strategy-fingerprint-stamp-coverage` against `origin/main` this
   round (20 files, +1571/−90): it adds
   `packages/intentionsutil/scripts/lib-strategy-stamp.ts` as the single home of
   the `{hash, sha}` fold with `--strategy-sha` documented as **required**, wires
   two new stamp writers (`write-node.ts` mint-time +118, `transition-node`
   transition-time +44), adds `strategy-stamp-census.ts`, and test-pins the
   contract with a new 237-line `test-strategy-stamp-doctrine.sh` plus additions
   to `write-node.test.ts` and `compute-freshness.test.ts`. The two nodes are
   therefore **not** independent — the sibling builds and pins the very contract
   this node proposes to delete — and its mint-time writer takes `sha` from the
   same pre-push `git rev-parse origin/main`, so on merge the off-by-one becomes
   a first-class code path rather than a prose convention. The ordering
   conclusion survives and strengthens; every `path:line` anchor derived from
   current `origin/main` is void on that merge.

## Why this round parked instead of planning

The keep-vs-delete choice for `sha` is unratified, and the two answers produce
completely different unit sets, file scope and tests — so no plan can be authored
without reversing one of two live positions. This node's own tiebreak
("evaluating (2) first on parsimony grounds; (1) if some reader genuinely needs
the sha inline") resolves mechanically to *delete*, since no reader needs it. The
unmerged sibling resolves the same question to *keep*, in code, with tests. See
`office_hours.reason` for the full statement of the ambiguity and
`office_hours.recommendation` for the suggested ruling, the sequencing advice
(consider a real `blocked_by` edge onto the sibling — `blocked_by` is
author-owned, so this session recommends rather than writes it), and the
disposition question for the 5 existing wrong stamps.
