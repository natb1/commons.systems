---
question: By what rule is a split, a merge or a reparent decided?
stage: periagogic
facts:
  - name: answer
    options:
      - name: three-tests-read-off-the-act-of-ruling
        source: ai
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/14
      - name: a-computed-projection-decides
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/14
      - name: the-heuristics-the-record-already-carries
        source: ai
        ref: "2026-09-08"
    recommends: three-tests-read-off-the-act-of-ruling
    boldness: moderate
    against: "The three tests are sharp on the cases the record has already decided, which is the sample they were read off, and none of them has been run against a case the record decided the other way. A test that reproduces every past verdict and has failed none is not yet known to be a test. The split test is the sharpest and is also the narrowest: it says when a node must be split and says nothing about when a node may be, so a node carrying two questions the author would happily rule in one act stays whole under it, which is the case the author called heuristic. And the tests are the AI's reading of what the record's own acts mean, offered on a question the author raised about determinism, so the party proposing the criterion is the party the criterion is meant to constrain."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "`commons.systems/disposition-graph/graph-topology`'s authority fact recommends `delegated`, and a ruling of `ratified` here stops that delegation from reaching this node, which costs the author a ruling on a question they raised as a request for a recommendation rather than as one they wanted to keep. If the criterion is read as part of the shape the delegation already covers, this recommendation is wrong and `delegated` follows the parent."
under:
  - commons.systems/disposition-graph/graph-topology
---

## Facts

### answer

`three-tests-read-off-the-act-of-ruling` is recommended, at moderate boldness. The
question is the author's, who called the incumbent guidance a rough heuristic and
asked whether a parallel projection would make it deterministic. The answer is the
AI's, and it turns the question around: what makes a topology rule deterministic is
not the projection that proposes the move but the test that decides it, and the
record already contains three such tests, each read off what an act of ruling is
rather than off anyone's judgment of similarity.

The turn the periagoge asks the author to take is to the record's own acts. The
split test is already written, in `commons.systems/disposition-graph/delegation-bounds-and-sizing`:
"a ruling is recorded per fact, and `delegation` has one answer fact, so there is
no act by which the author ratifies part of it." That is not a heuristic about
size or subject; it is a statement about what the author can and cannot record,
and it decides. The merge test is already written too, as the independence
validation the survey runs: a node whose only possible answer is a reading of
another node's answer asks no question of its own. And the reparent test is
written in `commons.systems/disposition-graph/under`, which says the edge carries
attention, context and authority at once: a node is under the question whose
ruling would change what it may answer. The author's word "heuristic" is fair
about the prose that surrounds these three and unfair to the three themselves,
which were used to decide real cases in this record and would decide them the same
way again.

What the projection is for is the second half of the answer and the half the
author's question reaches directly. A computed projection does not decide, and a
vector space in particular cannot: its numbers come from weights that are not in
the record, so a verdict resting on them is unauditable and not reproducible from
what the ref holds, which `commons.systems/disposition-graph/authority` and
`commons.systems/disposition-graph/evaluation` both forbid of anything that acts.
What a projection can do is raise the candidate, and the record already computes
one: the survey's `pairs` blocks give typed adjacency between nodes, the terms one
defines and another uses, the citations, the shared parent, the `depends` edges
and the shared ledger entries, all of it derived from the ref and checkable by
re-derivation. That projection is the right supply for the three tests, and
widening it is worth more than adding a second projection of a different kind.

`a-computed-projection-decides` carries the author's question as an answer, and is
live: if the author wants the verdict itself computed, the way to have it is to
compute it from the record's own structure rather than from an embedding, and the
`pairs` projection is where that would be built. `the-heuristics-the-record-already-carries`
is the record as it stands, live because it is what the instruments do today and
because the case that the three tests are already the criterion, merely scattered,
is a real reading of the same evidence.

#### three-tests-read-off-the-act-of-ruling

Each topology move has a test, and each test is read off what an act of ruling is
rather than off a judgment of similarity: a node is split when the author cannot
record their ruling on it in one act, merged when its only possible answer is a
reading of another node's answer, and reparented to the question whose ruling
would change what it may answer. A computed projection of the record proposes the
candidates and decides nothing.

**AI support.** The author, 2026-09-08: "The incumbent guidance on topology of the graph - when to split, merge, reparent etc. disposition - is a rough heuristic. Would some parallel projection like a vector space produce more deterministic rules for graph topology?"

Each of the three tests has already decided a case in this record, which is the evidence that they are tests and not restatements. The split test decided `delegation-bounds-and-sizing`, where the reason given for a node rather than a division of one text was that the author had no act by which to ratify half an answer. The merge test decided the independence finding against `hexis`, whose question "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?" has no possible answer that is not a reading of `purpose`'s answer. The reparent test is what `commons.systems/disposition-graph/under` already says the edge means, and it is why a global-tier node has an `under` like any other.

Why the projection proposes and does not decide. A verdict must be reproducible from what the ref holds, since the ref is the record and the author's check on the AI is reading it. An embedding's verdict is reproducible only with the model that produced it, which is not in the ref and does not stay fixed, so a merge taken on its say-so could not be re-derived by the author or by a later session. The `pairs` projection has the opposite property: it is computed from the terms, citations, edges and ledger references the ref already holds, so a candidate it raises can be re-raised and a candidate it misses can be shown to have been missed.

**AI divergence.** The three tests were read off the cases the record decided, and every one of them agrees with the verdict already reached, which is what a test fitted to its own sample does. None has been run against a case decided the other way, so none is yet known to discriminate. And the split test decides only when a split is compulsory: it is silent on the node that carries two questions the author would rule in one act without minding, which is exactly the case the author's word "heuristic" was about.

**Content.**

```markdown
---
question: By what rule is a split, a merge or a reparent decided?
form: rule
under:
  - commons.systems/disposition-graph/graph-topology
---
## Answer

Each topology move has a test, and each test is read off what an act of ruling is rather than off a judgment of what two nodes have in common.

A node is split when the author cannot record their ruling on it in one act. A ruling is recorded per fact, so a node whose single answer fact carries a text the author would want to accept in part and send back in part offers them no act by which to do it; the part they would rule separately is the node that must be minted, and it is minted beneath the node it came from, since authority narrows on the way down.

A node is merged into another when its only possible answer is a reading of that other node's answer. Such a node asks no question of its own: it would be re-answered by every move of the other's recommendation and could never be answered against it. The survivor is the node that keeps the question, and what moves to it is the account and the author's words, which `commons.systems/disposition-graph/graph-topology` requires of any prune.

A node is reparented to the question whose ruling would change what it may answer. `commons.systems/disposition-graph/under` says the edge carries attention, context and authority at once, and the authority reading is the one that decides: a node draws its ceiling from its parent, so the parent is the question whose settlement constrains this one. Where more than one question does that, the node refines both and draws rank and context from each.

A computed projection of the record raises the candidates and decides none of them. The projection is derived from what the ref holds, the terms one node defines and another uses, the citations, the shared parents, the `depends` edges and the shared ledger entries, so a candidate it raises can be re-derived by the author or by a later session and a candidate it misses can be shown to have been missed. A projection whose verdict cannot be re-derived from the ref, an embedding above all, may not decide a topology move, because the record is the author's check on the AI and a verdict that is not in the record is not checkable.
```

#### a-computed-projection-decides

The author's question of 2026-09-08 taken as an answer: a parallel projection of
the graph, such as a vector space, produces the topology rules, and a split, a
merge or a reparent is decided by where the projection puts the node rather than
by a stated test. Viable, and the answer the record carries if the author judges
that a rule stated in prose will always be applied loosely and that a computed
verdict, even one resting on weights outside the ref, is worth more than an
auditable one.

**AI support.** The author, 2026-09-08: "The incumbent guidance on topology of the graph - when to split, merge, reparent etc. disposition - is a rough heuristic. Would some parallel projection like a vector space produce more deterministic rules for graph topology?" The complaint the question rests on is fair: the guidance about when to split or merge is spread across `commons.systems/disposition-graph/probe-or-node`, the survey's validations and the alignment skill's prose, no one place states it, and a rule no one place states is applied differently by each session that reads it. Whether the remedy is a projection or a written test, the diagnosis stands and this node exists because of it.

**AI divergence.** A vector space decides by distance in a space whose coordinates are not in the ref, so its verdict cannot be re-derived from the record, and the author's check on the AI is reading the record. The verdict would also move when the model moved, so the same graph would merge differently in two sittings with nothing in the ref having changed, which is the opposite of the determinism the question asks for. And similarity is not the relation any of the three moves turns on: two nodes may share every term and ask different questions, which is the ordinary case of a parent and a child.

#### the-heuristics-the-record-already-carries

No new rule: the criterion stays where it is, distributed across
`commons.systems/disposition-graph/probe-or-node`'s four tests for when an open
question is a probe, an option or a node, the survey's merge and independence
validations, and the alignment skill's prose. Viable, because those are the tests
the instruments actually run and because the case that the criterion is already
written and merely scattered is a fair reading of the same evidence the
recommended option reads.

**AI support.** The record wrote no case for this option beyond the instruments themselves; its support is the fact that every topology move this record has taken was taken under one of those tests.

**AI divergence.** A criterion that is nowhere stated whole is applied differently by each session that reconstructs it, which is what the author observed. And the three moves are not covered evenly: `probe-or-node` states the mint sharply, the survey states the merge, and no locus states the reparent at all, so the edge that carries attention, context and authority is drawn by judgment alone.

## Account

### Minted in the sitting on the topology authority, 2026-09-08

The author's second question of the day on graph topology, `words/2026-09-08/14`,
asks by what rule a split, a merge or a reparent is decided and whether a parallel
projection would make that rule deterministic.
`commons.systems/disposition-graph/graph-topology` does not ask it: that node asks
what the recorder may do without asking, which is authority, where this asks by
what test the recorder decides, which is criterion, and a node may hold a
delegation without holding the rule the delegate applies.
`commons.systems/disposition-graph/probe-or-node`'s four tests return a node on
three of them: the response is a rule and not a reading of another node's answer;
it bears on the survey's validations, on the alignment skill and on every session
that mints or folds anything, which is doctrine reaching below any node that would
have carried it as a clause; and it has live rivals, the author's own projection
among them.

The mint was taken in this sitting under the author's grant of `words/2026-09-08/2`
and their direction of `words/2026-09-08/16` that the sitting reconcile on its own
recommendation rather than wait for a ruling. It is recorded here rather than
assumed: `commons.systems/disposition-graph/graph-topology`'s delegation acts from
a ruling on its authority fact and has none, so the mint rests on the grant and not
on the delegation.

The authority fact recommends `ratified` against the parent's `delegated`, and the
reading `commons.systems/disposition-graph/class-recommendation` requires is this:
the criterion decides merges, a merge is a prune of the node folded away, and a
prune is a deletion, which that node names irreversible; and the party that would
set this answer is the party the answer exists to constrain, which is its capture
limb. Two limbs fire, so the test returns ratified, and a ruling of ratified here
stops the parent's delegation for this node alone while leaving it to reach the
nodes beneath, as `commons.systems/disposition-graph/authority` provides.
### Whether a parallel projection would make the rules deterministic, 2026-09-08

The author asked whether some parallel projection, such as a vector space, would
produce more deterministic rules for graph topology, `words/2026-09-08/14`.
Measured against the record's own findings at graph commit `5cacddde`, the
answer is no, and the reason is not accuracy.

Determinism comes from the predicate this node's answer states, read off the act
of ruling. A coordinate is a free parameter, and a verdict resting on one cannot
be re-derived from the ref by a second party, because the coordinates are not in
the ref. Similarity is also not the relation the three acts turn on: a split is
one node answering two questions, a merge is two nodes answering one, and a
reparent is a node under the wrong question, and two nodes may be near
neighbours in any embedding while raising none of those between them.

The measurement bears it out. The instrument the record already runs nominates
candidate pairs by key; against the 278 pairs the record's own survey findings
name, it recalls 139, half of them, or 69.5 per cent once the
stale-recommendation findings are set aside, at 10.6 per cent precision. The 92
stale-recommendation pairs it misses are found by comparing a pin against a
commit, which no embedding would find, and one key, the shared parent, is the
sole ground of 554 of the pairs it nominates. So nomination is suggestion, and
suggestion is legitimate and already runs; what the record refuses is a verdict
from a projection it cannot re-derive. The divergence this node already records
on its recommended option is the same one, and this entry is its measurement.
