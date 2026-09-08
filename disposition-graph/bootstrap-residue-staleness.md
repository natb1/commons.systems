---
question: What keeps a sitting's record of reconciliation residue from being acted on after the disposition it rests on has changed?
stage: periagogic
form: rule
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
depends:
  - commons.systems/disposition-graph/session-state
  - commons.systems/disposition-graph/work-loop
  - commons.systems/disposition-graph/unconfirmed-accumulation
---

## Account

### Queued, 2026-09-08

Queued from the author's words of 2026-09-08 at `words/2026-09-08/31`, in the
alignment sitting of that day and under the grant at `words/2026-09-08/2` as
refined at `words/2026-09-08/22`. The words state a problem, a constraint and a
scope, and ask the AI for a recommendation; they state no answer. So this node
carries no fact yet and nothing is proposed on it, which is what a node at the
periagogic stage is.

The problem is made by two clauses of the record that are sound apart and
hazardous together. `what-acts-during-bootstrap` holds that the author's grant
runs on rather than once: reconciliation executes as the AI's recommendations
evolve, what is reconciled is applied to the sitting in hand rather than held
for the next, and the sitting is turned back on itself, so alignment already
sequenced in it is re-visited where newly reconciled disposition would change
it. `session-state` holds the sitting's working state in a store outside the
record and outside version control, and the author's words at
`words/2026-09-08/25` put the reconciliation residue in that store, listed
there and reported when the sitting stops. Put together: a residual is written
against the disposition as it stood when the sitting noticed it, the
disposition then moves under it in the same sitting, and nothing between the
noticing and the reconciling reads the residual against the text it now has.
The residual is reconciled against a record that has left.

The scope is the author's and is argued rather than asserted: "This will only
apply to bootstrap reconciliation since only bootstrap reconciliation is
executing reconciliation concurrently with alignment in the same session."
Outside bootstrap the two sittings divide by ref, as `work-loop` has them, and
a reconciliation session reads disposition it did not itself move, so the
window in which residue can go stale under its own author does not exist.

Cheap is a constraint on the answer and part of the question rather than a
preference about it. The residue list is long and is walked at every stop, so a
guard costing a re-derivation per residual is paid on every stop and would cost
more than the errors it catches. What the answer must produce is a test the
sitting can apply to a residual in constant work, that fails safe when it
cannot tell, and that names what to do with a residual it has failed.

The periagogic object, to be read before anything is proposed:
`what-acts-during-bootstrap`, `session-state`, `work-loop`, and
`unconfirmed-accumulation`, whose fold already carries a guard of exactly this
family for a different loss, striking from an account only what is reachable
from `origin/disposition` so that a checkpoint which fails to land destroys
nothing. With them the record's existing pin machinery, which is the one
instrument it has for the question "has the text this was written against
moved since": the `of` pin a review and a ruling carry, the survey's per-key
text hashes, and `a-pin-covers-what-binds-the-node` on `dialogue`, which fixes
what a pin attests to. The implementation the criteria point to is
`packages/disposition/accumulate.mjs` and the hashing in
`packages/disposition/read.mjs`. The instance is this sitting's own residue
list, which is where the author found the problem.
