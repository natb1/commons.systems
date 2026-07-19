---
id: tactic-align-doc-completeness-over-commit-noise
kind: tactic
statement: In the align skills, record documentation where it is materially
  correct even when doing so enlarges the commit — never downgrade a warranted
  strategy clarification to a draft-tactic to keep the commit small; and measure
  any freeze/re-stamp cost via the authoritative predicate, not a grep
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-19: during the /align-strategy round recording the
  subagent-cwd invariant, Claude recommended draft-tactic-only over a strategy
  clarification to avoid a 'noisy' ~15-node re-stamp commit. The author
  corrected the priority: correct documentation on the strategy (where the
  subagent-worker contract is defined) outweighs commit tidiness. Compounding
  the misjudgement, the ~15-child re-stamp cost was itself a miscount — a grep
  of the strategy_fingerprint field key overcounted null stamps; the
  authoritative freeze predicate (readNode + isFingerprintStale) showed every
  child null-stamped, so the clarification actually froze nothing. Both lessons
  belong in /align-strategy so future rounds neither trade documentation
  correctness for commit size nor misjudge the trade on a bad measurement."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-align-doc-completeness-over-commit-noise
  pr: 2913
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours:
  reason: '/qa-fix: disposition triage classified the sole residue item (a
    prose-clarity/faithfulness judgment call on the inserted lessons) as
    opus-fixable, but the gated fix-planner returned zero fix units for it — not
    a scope-deviation, but "planning produced nothing usable." Per the qa-fix
    contract this escalates with a planning-failed reason rather than
    auto-passing, even though direct inspection (5/5 script-verifiable checks
    passed, and 2/2 adversarial skeptics refuted the "needs human" call)
    strongly suggests the prose already satisfies the criterion and no fix is
    needed.'
  since: 2026-07-19
  recommendation: >-
    ## Recommendation: very likely a false escalation — no defect in the PR


    This park is almost certainly a disposition-pipeline artifact, not a real
    problem with PR #2913. The QA pass verified all 5 script-checkable claims,
    and the fix-planner returned zero fix units — meaning it found nothing to
    change. The skill's contract treats "empty plan" as a planning failure, but
    here it just reflects that the prose already meets the bar.


    ### What to check (fast path, ~2 minutes)


    Open `.claude/skills/align-strategy/SKILL.md`, lines ~550–570 (the new
    subsection just before "**Materiality-scoped freeze**"). Confirm the prose
    states both lessons accurately:


    - (a) Never downgrade a warranted strategy clarification to a
    draft-tactic-only, or omit it, just to keep a commit small or dodge a
    re-stamp.

    - (b) Measure freeze/re-stamp cost via the authoritative predicate
    `isFingerprintStale`/`strategyFingerprint`, never a grep over
    `strategy_fingerprint`.


    If it reads correctly (it was verified word-for-word against the diff during
    QA, so it almost certainly does), approve and unpark the tactic so it
    proceeds to the next phase. No code change needed.


    ### Tooling note (not for this reviewer to fix now)


    For whoever owns the qa-fix disposition workflow: an item both skeptics
    agree needs no human judgment, and whose fix-planner finds nothing to fix,
    should resolve to "already-satisfied" (drop as PASS) rather than
    "opus-fixable with empty units," which forces this planning-failed
    escalation.


    PR #2913
pace_exempt: false
rounds: null
attributes: {}
---
# Record documentation where it is materially correct, even when that enlarges the commit

## Context

Surfaced 2026-07-19 during the `/align-strategy` round that recorded the
subagent-cwd invariant (`tactic-subagent-cwd-worktree-guard`). Two linked
misjudgements the author corrected:

1. **Traded documentation correctness for commit tidiness.** Claude recommended
   recording the invariant as a *draft tactic only* — omitting the strategy
   clarification — to avoid a "noisy" commit that (it believed) would re-stamp
   ~15 orthogonal children. The author corrected the priority: the invariant
   belongs on `strategy-graph-native-dispatch`, where the subagent-worker
   contract is defined, and **correct documentation there outweighs a larger
   commit.** A warranted strategy clarification must never be downgraded to a
   draft tactic merely to keep the commit small.

2. **Misjudged the cost on a bad measurement.** The "~15 stamped children" figure
   was itself wrong — a `grep -c 'strategy_fingerprint'` counted the field *key*
   line (`strategy_fingerprint: null`) and so overcounted **null** stamps as real
   ones. The authoritative freeze predicate (`readNode` +
   `isFingerprintStale`, `packages/intentionsutil/src/transitions.ts`) showed
   **every** candidate child null-stamped, so `isFingerprintStale(null, …)`
   returns `false` and the clarification actually froze **nothing**. The commit
   was never noisy. (Memory `freeze-stamp-coverage-verify-via-selector` already
   recorded "verify freeze blast-radius via the selector, never grep; stamp
   coverage may be zero" — it predicted this exactly and was not applied.)

Both lessons belong in `/align-strategy` (the skill whose Step 5 makes exactly
this record-vs-defer, cost-weighing decision) so future rounds neither trade
documentation correctness for commit size nor misjudge that trade on a bad
measurement.

## Unit 1 — Fold both rules into `align-strategy/SKILL.md` Step 5

**Scope.** `.claude/skills/align-strategy/SKILL.md`, Step 5. Insert one new
subsection immediately before the existing `**Materiality-scoped freeze —
classify each open child.**` paragraph, currently at
`.claude/skills/align-strategy/SKILL.md:477`. That bold lead-in string is the
authoritative anchor — locate it by text match, not by line number, since an
intervening "If `graph-commit` exits 1 having printed a parking message..."
paragraph sits between it and the earlier "Bundle any draft tactic nodes..."
paragraph, and line numbers will drift as the file changes. Insert the new
subsection directly above the matched paragraph (matching the file's existing
bold-lead-in bullet style used by the surrounding Step 5 prose):

```markdown
**Documentation completeness over commit size.** When an interview outcome is
materially a property of the strategy under edit (an invariant of its
contract, a resolved edge case, a doctrine correction), record it as a
strategy clarification on that strategy — never relocate it to a draft tactic,
or omit it, to keep the commit small or to avoid a re-stamp. Commit size is
never a reason to put documentation in the wrong place; the materiality-scoped
freeze below is what keeps a warranted clarification's *blast radius* small —
it is not a reason to avoid recording the clarification itself.

**Measure freeze/re-stamp cost via the authoritative predicate, never a
grep.** If a recording or materiality decision turns on how many open children
a clarification would freeze, compute the actual set with `readNode` +
`isFingerprintStale` (`packages/intentionsutil/src/transitions.ts`) — or
`strategyFingerprint` (`packages/intentionsutil/src/router.ts`) plus the same
per-child stamp read the router's selector uses — never a text `grep` over
`strategy_fingerprint`. A `grep -c` (or similar) over that field counts the
key line itself, so a null-valued stamp (`strategy_fingerprint: null` — not
stale, per `isFingerprintStale`) is indistinguishable from a real one in the
grep count and inflates the estimate. A cost estimate that drives a recording
or materiality decision must come from the same predicate the router uses, not
a text search.
```

Out of scope for this unit: no change to the *behavior* of the
materiality-scoped freeze classification (the three buckets at
`.claude/skills/align-strategy/SKILL.md:491-506`) — only the new prose
directly above it, and only within Step 5. No other skill file changes.

**Recommended model:** sonnet — a single well-specified prose insertion at a
named anchor, no design judgment beyond matching the file's existing bullet
style.

**Dependencies:** none.

## Reuse

- `packages/intentionsutil/src/router.ts` — `strategyFingerprint` (hashes
  `clarifications`, so adding one changes the fingerprint).
- `packages/intentionsutil/src/transitions.ts` — `isFingerprintStale`
  (`null` → not stale; bare string → stale iff `!==`; map → stale iff the
  strategy key's hash `!==`).
- `.claude/skills/align-strategy/SKILL.md:477-520` — the existing
  materiality-scoped-freeze / re-stamp section this unit's insertion sits
  directly above; reuse its bold-lead-in bullet prose style rather than
  inventing a new one.
- Memory `freeze-stamp-coverage-verify-via-selector` — the pre-existing
  "verify via selector, never grep" rule this round's incident failed to
  apply; this unit is that rule's first landing inside a skill file rather
  than only in memory.

## Verification

Prose only — this is a documentation-only change with no runtime surface:

- `.claude/skills/align-strategy/SKILL.md` Step 5 names both rules
  (documentation-completeness over commit size; measure freeze/re-stamp cost
  via the authoritative predicate, never a grep) in a subsection immediately
  before the materiality-scoped-freeze paragraph.
- The inserted prose does not alter the three-bucket classification logic
  (orthogonal / materially affected / must-land-first migration) that follows
  it — read the diff to confirm only the new subsection was added, no
  surrounding text changed meaning.
- A subsequent `/align-strategy` round recording a strategy-level invariant
  records it as a clarification on the strategy without shrinking it to a
  draft tactic to save commit size, and if it needs to weigh re-stamp cost,
  does so via `isFingerprintStale`/`strategyFingerprint`, not `grep`.
