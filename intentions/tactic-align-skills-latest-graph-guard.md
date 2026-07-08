---
id: tactic-align-skills-latest-graph-guard
kind: tactic
statement: Enforce a non-skippable pre-analysis freshness guard for the
  interactive align skills — cut their session worktree from freshly-fetched
  origin/main so analysis cannot begin on a stale checkout
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-08 /align-strategy round (the
  read-side-freshness clarification and condition landed on
  strategy-graph-native-dispatch): the interactive align skills analyzed a
  36-commit-behind local checkout and presented superseded doctrine as current
  until the author caught it. The failure was not an absent method but that
  nothing forced one. Cross-references tactic-align-strategy-alignment-tests,
  whose narrow 'read served-virtue and tradition doctrine at origin/main' clause
  becomes redundant once the whole session checkout is guaranteed fresh — do not
  merge the two here; /align-tactics reconciles them."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-08 (further refined): elevated to the same
    tier as the tactics that directly edit
    .claude/skills/align-strategy/SKILL.md and
    .claude/skills/align-tactics/SKILL.md (boost 3, added on top of the
    strategy's own boost 5, authored 8) — even though this tactic's own fix is a
    freshness-guard mechanism rather than a SKILL.md prose edit, the author has
    directed it ranks alongside the direct skill-edit tactics, above
    curriculum-execution tooling (boost 7) and the rest of
    strategy-graph-native-dispatch's subtree (inherited 5, unboosted)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Enforce a non-skippable pre-analysis freshness guard for the interactive align skills — cut their session worktree from freshly-fetched origin/main so analysis cannot begin on a stale checkout

Retained draft from the 2026-07-08 /align-strategy round — input to a future
/align-tactics pass; not yet a plan.

## Context

The interactive align skills (/align-strategy, /align-tactics, /align-init,
the office-hours review) read the graph before acting: /align-strategy's
step 1.2 overlap grep and readNode of the edited node, /align-tactics'
two-sided drift review, /align-init's orientation. All of these read the
session's local working tree. When that tree lags origin/main, every read is
stale. The 2026-07-08 graph-function round ran against a 36-commit-behind
checkout and presented superseded doctrine (a pre-amendment tradition-plato
that still said "Forms declined") as current — caught only because the author
knew a later reading session had amended it.

The write path was never the problem: graph-commit rebases every write onto
origin/main before it lands. The gap is the *read* path, before any analysis.
The headless router tick already freshens its worktree
(`git fetch origin main && git merge --ff-only origin/main`, per
dispatch-select-tick in .claude/rules/sandbox.md); the interactive skills do
not. And the fix is not "add a fetch step to SKILL.md prose" — that is exactly
the form that failed, since the next session skips a prose step the same way
this one did. The guard must be non-skippable: enforced at a point the flow
cannot proceed past.

## Scope (draft)

Lead mechanism — **fresh-cut worktree provisioning** (author's 2026-07-08
choice): the interactive align skills' session worktree is always created from
freshly-fetched origin/main, so analysis physically cannot begin on a stale
tree. The router's provision primitive
(`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`) already
does this for graph-lane workers; extend or mirror it for the interactive
skills, or have the skills refuse to proceed in a worktree they did not
freshly provision.

Fallback / complementary mechanism — a **preflight hard-fail primitive** the
skill's first step invokes for the case where the author is already in an
existing worktree: fetch origin/main and exit non-zero with a clear message if
HEAD is behind origin/main, forcing the session to freshen before any read.

Both mechanisms share two non-negotiables:

1. **Offline is a hard fail, not a fallback.** A fetch that cannot reach
   origin fails the session rather than proceeding on unverified local state
   (`.claude/rules/code-style.md` — clear errors over defensive fallbacks; the
   sandbox read-only FETCH_HEAD case must run the fetch with
   `dangerouslyDisableSandbox`).
2. **Prose is a backstop only.** SKILL.md documents the guarantee; the
   mechanism lives in owned tooling (the greenfield-delegation lens: push the
   guard out of skippable prose into a script).

Family-wide: the intent (the new condition on strategy-graph-native-dispatch)
covers all four interactive graph-reading skills, even though a first tactic
may target /align-strategy alone.

Reconciliation note: once the whole session checkout is guaranteed fresh, the
narrow "read the served-virtue rationales and tradition records at origin/main"
clause in tactic-align-strategy-alignment-tests (scope point 1) becomes
redundant — those reads can come from the now-known-fresh working tree. Do
**not** merge or rewrite that tactic here; recording the relationship is
/align-strategy's retain contract, reconciling the two is /align-tactics' job.

Out of scope: the doctrinal-consistency and steelman tests themselves
(tactic-align-strategy-alignment-tests); the headless router tick (already
freshens); sibling-skill plan authoring.
