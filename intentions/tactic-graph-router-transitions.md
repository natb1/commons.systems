---
id: tactic-graph-router-transitions
kind: tactic
statement: "router v2 (b): persisted phase transitions, attempt counters and
  markers as graph writes, reconciler sweep, completion pruning"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Second half of the router migration (clarification 1): the router
  transitions the persisted phase — PR and CI demoted from ground truth to
  sensors — absorbs out-of-band gh events with a reconciler sweep, and prunes
  completed tactics, stamping the strategy's round accounting."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-graph-router-transitions
  pr: 2813
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
# router v2 (b): persisted phase transitions, attempt counters and markers as graph writes, reconciler sweep, completion pruning

## Context

Router v2, second half (strategy clarification 1): phase is persisted and
written, never re-derived — PR draft state and CI are demoted from ground
truth to sensors consulted before a transition commits. Out-of-band gh
events are absorbed by a reconciler sweep. Spec:
`intentions/tactic-graph-native-dispatch.md` §1.1 and §2.4.

The transition write is the scheduling mechanism (legacy parity): selection
reads `origin/main`, so the write that ends a phase is what makes the next
phase worker — fix, qa, review — selectable, exactly as
`dispatch-complete-phase`'s label edits do today. Until this tactic lands,
sessions completing a phase on a graph-native tactic apply the
bootstrap-transition doctrine by hand (strategy clarification 15: the
completing session writes the transition to main as a state-only commit,
never on the work PR branch); that doctrine retires here.

## Unit 1 — phase transitions and execution state as graph writes

**Recommended model:** opus

Scope: at the seams where the legacy flow edits labels —
`.claude/skills/dispatch-propagate/scripts/dispatch-complete-phase` and
`dispatch-finalize-phase` — graph-native tactics instead graph-commit:
- the `phase` transition: the `implement → qa → review → [main-qa] →
  done` ladder (`main-qa` only when needs-main residue is recorded on
  the node — strategy clarification 22, spec §1.1), plus the `fix`
  interrupt — any of implement/qa/review transitions to `fix` when the
  PR's CI verdict is failing, and back to the ladder's resumption point
  once CI is green (spec §1.1, strategy clarification 18; legacy parity
  with dispatch-phase's CI-verdict-before-labels ordering).
  qa-fix/review-fix content-fix loops stay internal to the qa and review
  phases and never write a `fix` transition,
- `execution.attempts` counters (formerly `dispatch:*-attempt` labels),
- `execution.markers` (formerly `dispatch:planned` / `qa-done` /
  `reviewed`),
- `execution.pr` when the PR opens.
Sensor consultation before each commit: CI verdict and PR mergeability via
read-only gh calls (the read side of
`.claude/skills/dispatch-propagate/scripts/dispatch-phase` survives as this
sensor layer; its derivation-to-phase logic does not apply to graph-native
tactics).

Merge-when-ready parity: a clean review completion arms gh auto-merge on
the PR (same config gate as today, `dispatch-auto-merge` conventions
unchanged — spec §2.4's carried-over phase-skill internals); the merge
itself lands out-of-band and Unit 2's sweep absorbs it into `done`. No
graph-side merge step exists.

Freshness gate at the transition write (closes the soft-freeze merge
race): before any forward transition commit — and specifically before
arming auto-merge at clean review completion — recompute the serving
strategy's substance fingerprint (same derivation as the selector's,
strategy clarification 10) and compare it against
`execution.strategy_fingerprint`. On mismatch: write no forward
transition and arm no merge — leave the tactic at its completed phase;
the selector's frozen-subtree state queues the re-evaluation, and a
confirm re-stamps the fingerprint so the held transition proceeds on the
next tick. Without this gate the freeze binds only selection, so a
strategy edit landing while a tactic is mid-review would let a clean
review arm auto-merge against the outdated spec — the transition writer
is the last graph-side actor before the merge, so the check lives here.
A tactic hand-merged against an already-stale fingerprint is out-of-band
human action: Unit 2's sweep still absorbs it, main-qa verifies against
the node's (re-evaluated) intent. (Recorded 2026-07-06 from the
/align-strategy concurrency review.)

The same gate carries a second term — the **tactic-scope fingerprint**
(strategy scope-fingerprint and chain-of-custody clarifications,
2026-07-06): before any forward transition write, and before arming
auto-merge at clean review completion, recompute `tacticScopeFingerprint`
(statement + body hash, exported by
`packages/intentionsutil/src/router.ts` —
`tactic-worker-start-revalidation` Unit 1) against current `origin/main`
and compare it to the phase-start stamp the worker-start gate saved at
`<project-root>/.claude/worktrees/<node-id>.scope-fingerprint`
(`tactic-worker-start-revalidation` Unit 2; format
`<fingerprint> <origin-main-sha>`). On mismatch: write no forward
transition and arm no merge — write the **backward transition
`phase := implement`** instead (the demotion; supersedes the earlier
same-day stay-at-completed-phase behavior). Together with the
worker-start gate's chain comparison (a fix/qa/review worker starts only
if the current scope equals the previous phase's stamp), this makes
merge require an unbroken implement → qa → review chain all executed
against the merge-time scope: the re-selected implement worker roots in
the same worktree, treats the current node body as the whole target
state, and implements only the delta, then qa and review re-run in
order. The demotion is delivered as an owned primitive,
**`demote-node-to-implement <node-id>`** (beside `park-node`;
graph-commit under the hood), also invoked by tick workers on the start
gate's exit 13 — it records provenance in the demotion commit message
and, when `execution.pr` exists, as a PR comment: the
`git log <stamped-sha>..origin/main -- intentions/<node-id>.md` range is
exactly the set of scope edits being absorbed, so the routed-back worker
opens with the delta named, not archaeology (the current body alone is
sufficient for correctness; the range is the focus aid and audit trail).
Demotion is pre-merge only (implement/qa/review/fix); post-merge
staleness routes per main-qa parity (strategy clarification 22), never
an un-merge. After every transition it writes, the writer **refreshes
the stamp** to the post-write fingerprint of the node it just committed
plus the new `origin/main` SHA — residue sections and other machinery
body appends DO change the hash, and the refresh is what keeps them from
breaking custody, leaving only author and re-evaluation edits able to
demote. Frontmatter state writes (attempts, markers, parks) never enter
the hash at all. A missing stamp file (legacy launch, hand-run phase,
recreated worktree) fails open with a logged warning during the
bootstrap and fails closed once `tactic-worker-start-revalidation`
lands — the arming point then requires the stamp. Depends on
`tactic-worker-start-revalidation` Units 1–2 for the helper and the
stamp; sequencing note added 2026-07-06, chain-of-custody amendment
2026-07-06.

## Unit 2 — reconciler sweep and completion pruning

**Recommended model:** opus

Depends on: Unit 1.

Scope: graph-native analog of
`.claude/skills/dispatch-propagate/scripts/dispatch-reconcile-merged`:
- Sweep open graph-native tactics whose PR merged or closed out-of-band:
  merged with a needs-main residue section on the node → transition to
  `main-qa` (strategy clarification 22; `tactic-main-qa-phase` supplies
  the phase value and handler); merged without residue, or closed →
  transition to `done`.
- `done` prunes the node and its edges in the same commit (the
  transient-tactic rule).
- When a strategy's last non-draft child prunes: `rounds.count += 1`,
  `rounds.last_completed` stamped, in that same commit — for a
  residue-bearing tactic this fires only after `main-qa` completes, so
  round accounting means verified-in-prod.

## Dependencies

- `tactic-graph-router-selector` — the selection side these transitions
  complete.
- `tactic-graph-commit` — every write goes through the primitive; no
  direct git in this tactic's scripts.
- `tactic-worker-start-revalidation` — Unit 1's scope-fingerprint term
  verifies the phase-start stamp that tactic's gate writes and uses its
  `tacticScopeFingerprint` export (edge added 2026-07-06).

## Reuse

- `dispatch-write-phase-log` for the transition log line (the sensor input
  format).
- graph-commit for atomic multi-node writes (prune + rounds stamp).

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual staged lifecycle: on a scratch branch of the store, a synthetic
tactic walks implement → qa → review → done, each transition one commit;
include one `fix` interrupt (simulate a failing CI verdict at qa or
review, confirm the transition to `fix` and the return to the interrupted
ladder position once the verdict is green); hand-merge its PR mid-flow and
confirm the sweep absorbs it; confirm the final commit prunes the node and
stamps the strategy's rounds. Repeat with a needs-main residue section on
the node: the sweep routes merged → `main-qa` instead of `done`, and the
rounds stamp waits for the `main-qa → done` transition.

## Implementation notes

One subagent per unit, `model: opus`; constrain to working-tree edits.
