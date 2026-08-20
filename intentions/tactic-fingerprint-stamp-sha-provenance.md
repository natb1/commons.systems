---
id: tactic-fingerprint-stamp-sha-provenance
kind: tactic
statement: Fix the strategy_fingerprint sha stamp, which records the pre-commit
  HEAD and so pairs a post-edit hash with the commit that does not produce it
owner: ai
status: raw
parent: null
rationale: "Found 2026-08-14 by the adversarial draft review. schema.ts defines
  sha as the origin/main commit the hash was computed against, so that a stale
  child can recover the delta via git diff sha..origin/main. But a writer stamps
  before it pushes and cannot know its own commit sha, so it records HEAD — the
  PARENT of the commit carrying the new substance. The documented recovery path
  therefore returns the aligning round's own delta as if it were unabsorbed
  drift. Systemic, not round-introduced: prior stamps have the same off-by-one.
  Fix by stamping from graph-commit after the push, or by dropping sha and
  recovering the revision with git log -S over the hash."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix the strategy_fingerprint sha stamp, which records the pre-commit HEAD and so pairs a post-edit hash with the commit that does not produce it

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

### It is systemic, and this round reproduced it knowingly

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

### Sequence after `tactic-strategy-fingerprint-stamp-coverage`

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
