---
question: What orders the unanswered frontier for alignment?
stage: maieutic
probes:
  - id: rank-second-reading-frontier
    asks: >-
      Does attention's second reading of rank, "frontier attention, where work
      goes first", distinguish an alignment frontier from a reconciliation
      frontier at all, and whose attention does the record say the word names
      there?
    fact: answer
    why: >-
      attention's answer names rank as "one fact with three readings" and names
      the second as "frontier attention, where work goes first" without saying
      which frontier or whose attention; the alignment frontier did not exist
      when the sentence was written, and nothing in attention, alignment-target
      or scope settles it.
    discharges: >-
      whether rank orders the alignment frontier at all, which decides whether
      this node's answer replaces rank or refines it. It moved this node's
      answer fact from `rank-as-the-alignment-order` and raised
      `rank-orders-reconciliation-only` on attention.
    source: ai
    raised: 2026-09-03
    status: discharged
    reason: >-
      the author answered it on 2026-09-03, in the words recorded under this
      node's `## Disposition` — "It originally referred to the reconciliation
      frontier, but that predated the alignment frontier. attention 'for where
      work goes first' refers to the reconciliation process (shimmed as a skill,
      but codified before bootstrap exit)."
facts:
  - name: answer
    options:
      - name: draft
        source: ai
        ref: "2026-09-03"
      - name: settle-counts-nodes-only
        source: ai
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/1
          - words/2026-09-03/2
          - words/2026-09-03/3
          - words/2026-09-03/4
          - words/2026-09-03/5
          - words/2026-09-03/6
          - words/2026-09-03/7
          - words/2026-09-03/8
          - words/2026-09-03/9
          - words/2026-09-03/10
          - words/2026-09-03/11
          - words/2026-09-03/12
          - words/2026-09-03/13
          - words/2026-09-03/14
          - words/2026-09-03/15
          - words/2026-09-04/1
      - name: rank-as-the-alignment-order
        source: author
        ref: "a9ce7218"
        status: passed
        reason: "the author's words of 2026-09-03 reconsider every statement applying rank to alignment"
      - name: order-computed-in-session
        source: ai
        ref: "a9ce7218"
        status: passed
        reason: "the transience node forbids computing an order from findings no tangle records"
      - name: author-states-the-order
        source: ai
        ref: "a9ce7218"
        status: passed
        reason: "`/align <node id>` already is the author stating the order"
      - name: divergence-named-on-the-ancestor
        source: ai
        ref: "a9ce7218"
        status: passed
        reason: "the pins would live on what moves and the ancestor would be re-reviewed at every finding"
      - name: review-names-the-survivor
        source: ai
        ref: "a9ce7218"
        status: passed
        reason: "the earlier-recorded node stands, the rule the queue already applies to the author's words"
      - name: node-nearer-the-root-stands
        source: ai
        ref: "a9ce7218"
        status: passed
        reason: "the earlier-recorded node stands, the rule the queue already applies to the author's words"
      - name: strike-rank-from-this-frontier
        source: ai
        ref: "a9ce7218"
        status: passed
        reason: "the tie-break costs nothing and keeps one scalar for the page to fall back on"
      - name: ancestor-screen-as-rows-to-rule-from
        source: author
        ref: "a9ce7218"
        status: passed
        reason: "it lays a second ordering over nodes this order has already placed"
    recommends: settle-counts-nodes-only
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
review:
  survey:
    date: 2026-09-07
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "4fa36454c0bb9860a0f274fc58884a3599079d5833f688a2550040db63025482"
      answer: "234a057c4b4e673429466e1d638394b68a73c8e165b67ff771ae17f7ff211f0e"
      options: "01135a1b7284a026dcb98e9b4d22a786c2562fd4b0b1bdde20f99e561c4b665e"
      rivals: "7d5d85d514dee6f5f07f0c8e1a14ba6fc126c8537e8fffacd43c7ccd8dde0321"
      words: "2863328a5b853f62aa43eb735803c50fa80fdb85979e787da674f5c564874632"
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
---

## Facts

### answer

#### draft

The recommended text answers the question with the ruling order in place of rank: tangles between unanswered nodes recorded as alternatives on the earlier-recorded survivor, divergences between subtrees recorded on the leaves in `depends` and derived at the ancestor, a ruling settling every node it makes mechanically decidable, and the order putting first the node whose ruling settles the most, rank breaking ties. The node as it stands has no answer, so there is no standing text to adopt. Its distinguishing term, once `settle-counts-nodes-only` was raised beside it, is that it counts the alternatives pending on the ruled node into the settling count; the recommendation no longer adopts it, for the reasons the account of 2026-09-03 gives.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The recommended text answers the question with the ruling order in place of rank: tangles between unanswered nodes recorded as alternatives on the earlier-recorded survivor, divergences between subtrees recorded on the leaves in `depends` and derived at the ancestor, a ruling settling every node it makes mechanically decidable, and the order putting first the node whose ruling settles the most, rank breaking ties. The node as it stands has no answer, so there is no standing text to adopt. Its distinguishing term, once `settle-counts-nodes-only` was raised beside it, is that it counts the alternatives pending on the ruled node into the settling count; the recommendation no longer adopts it, for the reasons the account of 2026-09-03 gives.
```

#### settle-counts-nodes-only

The draft, with one change, and the alternative the recommendation adopts as of 2026-09-03: a ruling's settling count is the
count of nodes it makes mechanically decidable and nothing else, the
alternatives it closes no longer added into the same scalar. Raised against
the recommended text by the reconciliation of 2026-09-03, which measured the
order the text produces and found it puts a node ahead of its own ancestor:
`agency`, the graph's sole root, settles sixty-nine unanswered nodes and
carries two alternatives, seventy-one; `purpose`, its only child, settles
sixty-six and carries six, seventy-two. Counting nodes alone puts `agency`
first, sixty-nine against sixty-six, and restores the draft's own sentence
that ancestors come before descendants by the count and not by hand. What it
gives up is the draft's reason for adding them: an alternative is something a
ruling closes, and a node thick with alternatives is genuinely more entangled
than a bare one. A third answer is open to the author and not drafted here:
keep the sum and order ancestors before descendants outright, the count
deciding only between nodes neither of which is under the other.

Refined by the author's question of 2026-09-03, which named the criterion as
not pulling the rug from a confirmed node by altering the node under it. On
that criterion the two terms are different relations. Reach is what a ruling
makes decidable elsewhere, the unanswered nodes under it and the nodes naming
it in `depends`, and it is the rug-pulling measure exactly. Load is what is
unresolved at the node, its pending alternatives, which the ruling closes on
itself and which make no other node decidable. Reach is monotone up the
`under` tree, an ancestor's unanswered-descendant set containing its child's
and the child besides, so ordering on reach alone makes ancestor-before-
descendant a theorem rather than the claim the recommended text makes and
does not deliver, and it makes the third answer above unnecessary. The
alternatives count stays on the page as a displayed fact, since it is what
tells the author how much a sitting will cost, and orders nothing.

**AI support.** The author's words of 2026-09-03, quoted in the dialogue that produced this node: attention's second reading of rank, "where work goes first", referred to the reconciliation frontier and predates the alignment frontier; rank was "the only order the record had to hand" when alignment-target was ruled, and every statement applying it to alignment is reconsidered; the alignment frontier "has no confirmed authority, so all mutations of the alignment frontier potentially supercede or modify all other nodes on the alignment frontier", and "a greedy rank based approach isn't necessarily optimal for untangling" it; the examples are recording the opposite of an unconfirmed disposition, or the same one again, which with authority on one side "could be mechanically rejected or recorded as an alternative"; the frontier is a graph, so adjacent nodes may merge and whole subtrees may diverge; and, choosing between naming a divergence on the ancestor and on the leaves, the author chose the leaves, with the divergence derived at the ancestor, then took the survivor rule, the name, and rank as tie-break as recommended. Greedy-by-rank fails on this frontier because rank is importance and the frontier's problem is dependency: an important leaf ruled before its ground is reopened when the ground is ruled. The settling count is dependency-first with importance as the tie-break, and ancestor-first falls out of it, since a ruling's reach by the authority node's scope rule is its whole unanswered subtree; the record's three orphaned devices for the same problem, the heuristics alignment-target rejected on the premise that rank was already the order, the `depends` field dialogue defined and no node carried, and the placement validation frontier-consistency runs and nothing consumed, become one mechanism. The divergence is named on the leaves and not the ancestor because an alternative is a candidate answer to its own node's question and a divergence answers nothing, because an ancestor edited at every review finding is re-reviewed at every round, because the pins would live on what moves, and because the subtree under a node is structure and derived; only the judgment which side a leaf stands under is not derivable, and that is what the leaf records. Readings owed as nodes under this one: Aristotle, Posterior Analytics I.2, 71b33 to 72a5, prior by nature against prior to us, the ruling order taking what is prior by nature first where rank took what is nearest to us; and the three-way merge, which resolves a divergence relative to the merge base, the lowest common ancestor, and never leaf against leaf. Both support the answer and neither is diverged from. What the answer amends elsewhere is recorded as an alternative of source author on each node: alignment-target's choice by rank, attention's second reading, dialogue's `depends` target, the page order on unanswered and growth, which the sitting of 2026-09-04 resolves instead by moving those descriptions to the alignment-page node entirely, and the consumer of frontier-consistency's placement validation; the projector, the alignment page, and the alignment skill's no-argument usage follow at reconciliation.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The ruling order, derived from the tangle the record carries, and not rank. The alignment frontier is a set of nodes none of which has authority over another, so a recording on it may contradict, duplicate, or diverge from any other and nothing can reject it; the order's work is to untangle it, by asking for the rulings that settle the most first. A tangle is recorded, never computed in a session. A lateral tangle between unanswered nodes, the same idea twice, its opposite, or adjacent nodes that would merge, is recorded as an alternative on the earlier-recorded node, which stands by that rule alone, with the later one as the alternative carrying its source and date. A divergence between subtrees is recorded on the leaves: each node the review finds to stand under one side names, in `depends`, the ancestor and the alternative on it that it stands under; the page inverts that at the ancestor, showing beside each alternative the nodes a ruling for it keeps and the nodes it discards, which then liquidate by the standing rules, each a proposal against its ratified ancestor and its implementation unsupported; the ancestor's screen shows that subtree as context for the ruling in hand and never as rows to rule from, since every node is ruled in its own turn in this one order. A ruling settles a node when it makes that node mechanically decidable: every unanswered node under the ruled node, and every node naming it in `depends`. What a ruling closes on the node it rules, the alternatives pending there, is not settling and is not counted: it is the ruling's own content and makes no other node decidable, and an alternative that does bear on another node bears on it through that node's `depends`, where it is already counted. The alternatives pending on a node are shown beside its settling count, since they are what tells the author what a sitting will cost, and they order nothing. The ruling order puts first the node whose ruling settles the most; an ancestor therefore comes before its descendants, its unanswered subtree containing theirs and the descendant besides, and the order does not have to force it; rank breaks ties and orders nothing else on this frontier. The order is one order over the whole alignment frontier, the manifest's graphs taken together: the frontier's dependencies cross them, so the graph a node belongs to is a label on the node and never a precedence over another node's ground, and the alignment page presents the frontier in this one order with no second ordering laid over it, showing each node's graph beside it as a label; what else that page shows of a node is the alignment-page node's question. `/align` with nothing takes the first node of the ruling order; `/align <node id>` is the author's order and needs no boost. Rank remains what the attention node says it is for the reconciliation frontier and the onboarding path.
```

#### rank-as-the-alignment-order

Rank orders the alignment frontier, which is what alignment-target and
attention's second reading standingly answer. It was passed over on the
author's words of 2026-09-03: rank was the only order the record had to hand,
and a greedy rank-based approach is not necessarily optimal for untangling
this frontier.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

Rank orders the alignment frontier, which is what alignment-target and
attention's second reading standingly answer. It was passed over on the
author's words of 2026-09-03: rank was the only order the record had to hand,
and a greedy rank-based approach is not necessarily optimal for untangling
this frontier.
```

#### order-computed-in-session

The order is computed in a session from the review's findings, with no tangle
recorded. It was passed over because the transience node forbids it: a tangle
is recorded, never computed.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The order is computed in a session from the review's findings, with no tangle
recorded. It was passed over because the transience node forbids it: a tangle
is recorded, never computed.
```

#### author-states-the-order

The author states the order of the alignment frontier. It was passed over
because `/align <node id>` already is that, so the answer would add nothing.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The author states the order of the alignment frontier. It was passed over
because `/align <node id>` already is that, so the answer would add nothing.
```

#### divergence-named-on-the-ancestor

A divergence between subtrees is named on the ancestor rather than on the
leaves. It was passed over because an alternative is a candidate answer to its
own node's question and a divergence answers nothing, because an ancestor
edited at every review finding is re-reviewed at every round, and because the
pins would live on what moves.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

A divergence between subtrees is named on the ancestor rather than on the
leaves. It was passed over because an alternative is a candidate answer to its
own node's question and a divergence answers nothing, because an ancestor
edited at every review finding is re-reviewed at every round, and because the
pins would live on what moves.
```

#### review-names-the-survivor

The review names which node survives a lateral tangle. It was passed over in
favour of the earlier-recorded node standing, the rule the queue already
applies to the author's words.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The review names which node survives a lateral tangle. It was passed over in
favour of the earlier-recorded node standing, the rule the queue already
applies to the author's words.
```

#### node-nearer-the-root-stands

The node nearer the root survives a lateral tangle. It was passed over in
favour of the earlier-recorded node standing, the rule the queue already
applies to the author's words.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

The node nearer the root survives a lateral tangle. It was passed over in
favour of the earlier-recorded node standing, the rule the queue already
applies to the author's words.
```

#### strike-rank-from-this-frontier

Rank is struck from the alignment frontier entirely and ties are broken by
date. It was passed over because the tie-break costs nothing and keeps one
scalar for the page to fall back on.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

Rank is struck from the alignment frontier entirely and ties are broken by
date. It was passed over because the tie-break costs nothing and keeps one
scalar for the page to fall back on.
```

#### ancestor-screen-as-rows-to-rule-from

An ancestor's screen offers its unanswered subtree as rows the author may rule
from. The author passed it over on 2026-09-04 on the ground that it lays a
second ordering over nodes this order has already placed.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What orders the unanswered frontier for alignment?
form: rule
under:
  - commons.systems/disposition-graph/alignment-target
  - commons.systems/disposition-graph/attention
defines:
  - ruling order
  - settle
---
## Answer

An ancestor's screen offers its unanswered subtree as rows the author may rule
from. The author passed it over on 2026-09-04 on the ground that it lays a
second ordering over nodes this order has already placed.
```

## Account

### Reconciled to the flat cross-graph order, 2026-09-03

A third bootstrap grant, in the author's words quoted above, for the same
three artifacts and the recommendation as amended again. Recorded as its own
grant for the reason the second was: the first was spent on the draft that
counted alternatives, the second on the amended count, and this skill reads
no grant as standing. It answers this node no more than the others did; the
stamp stays absent, the stage stays `review`, and the clean-context review
and the ruling are both owed on the recommendation as it now stands.

The reconciliation drops the alignment page's grouping by graph from its
ordering: the page pages in one ruling order across the manifest's graphs
and shows each node's graph as a label beside it, and the alignment skill's
no-argument rule loses "this project's graph before the public graph". It
landed on `greenfield` as 7801286e873b6340b1af5b94ddc26a1cc6483c31 against
this node at graph commit cee9a117f2e1713f90df3fe7b820cee63ad5232a. The page
now opens with `commons.systems/public/agency`, then
`commons.systems/disposition-graph/purpose`, then
`commons.systems/disposition-graph/model`, which is the frontier's ruling
order exactly; the two graphs survive on the page as a header naming each
with its count of open items, and on each node as a label.

### The page's graph grouping contradicted the order, 2026-09-03

Reported by the author, in the words above, from the page itself after the
first reconciliation: it still listed `purpose` first. The cause is not the
count. The page grouped by graph before it ordered, the manifest's order,
this project's graph before the public graph, so `commons.systems/public/agency`
sat in the second section whatever it settled, and the page's order and the
frontier's ruling order disagreed at their heads. The first reconciliation
kept the grouping deliberately, as the conservative reading, on the ground
that `alignment-target` says "this project's graph before the public graph"
and `unanswered` says "the purpose node first" and the draft amended neither
in terms. That call was wrong, and the disclosure of it in this account did
not make it right: a second order over one frontier can only fight the
first, and here it fought it at the one place that matters, the node the
author is asked about before any other. `agency` is the graph's sole root
and `purpose` its only child, so the grouping put a descendant's ruling
before its own ancestor's, which is the rug-pull the criterion exists to
prevent.

The recommended text now says the order is one order over the whole
alignment frontier, the manifest's graphs together, the graph a label and
not a precedence, and the alignment page pages in it flat. The alternatives
raised on `alignment-target` and `unanswered` are widened to say that they
amend the graph-precedence clause and the purpose-first clause too, the
latter having become false on the amended count. Class ratified, boldness
low: this follows from the answer already recommended rather than adding to
it, and the author's report is what surfaced it.

### Reconciled to the amended recommendation, 2026-09-03

A second bootstrap grant, in the author's words quoted above, for the same
three artifacts and the recommendation as amended. It is a separate grant
from the first and is recorded as one: the first was spent on the draft that
counted alternatives, and this skill reads no grant as standing. It answers
this node no more than the first did. The stamp stays absent, the stage stays
`review`, and the clean-context review and the ruling are both still owed on
the recommendation as it now stands.

The reconciliation drops the alternatives term from the settling count in the
reader's derivation, leaves the count of alternatives in the breakdown as a
displayed fact on the frontier line and beside the settling count on the
alignment page, and restates the settle rule and the ancestor rule in the
alignment skill. It landed on `greenfield` as
a136b57c759faced4dbfcdeba7214e59b643e447 against this node at graph commit
0e2e0624b9fed7756f5b32b2e6d539fff722ef1b.

The property the amended count buys was verified on the record and not only
argued: across the seventy nodes there is none whose settling count reaches
its own parent's, so an ancestor precedes every unanswered descendant without
the order forcing it. The ruling order now opens with
`commons.systems/public/agency`, the graph's sole root, at sixty-nine, and
`commons.systems/disposition-graph/purpose`, its only child, at sixty-six;
under the earlier count purpose led by one on the strength of four extra
alternatives. Two order tests in the implementation went vacuous under the
change, their settling differences having come entirely from a node's own
alternatives; both were given real reach differences rather than deleted,
which is itself evidence for the change, since a difference that disappears
when the alternatives stop counting was never a difference in reach.

### Recommendation changed to settle-counts-nodes-only, 2026-09-03

At the author's question above, and before their ruling. The recommendation
adopted `draft` and now adopts `settle-counts-nodes-only`; the class stays
ratified, the boldness moderate, and the persistence standing, since what
changed is one term of the count and not what kind of answer this is. The
`## Recommendation` fence is rewritten to match: the settling count is
reach, the ancestor rule follows from it instead of being asserted beside
it, and the alternatives count is named as a displayed fact that orders
nothing. Three reasons, in the order they weigh. The draft asserted that
ancestors come before descendants by its count and defined a count that
does not produce it, where reach makes the sentence a consequence rather
than a hope. The alternatives term is redundant where it matters, since the
draft already built the route by which an alternative reaches the order and
the raw list counts the ones that carry a divergence twice and the ones that
do not at all. And it is the draft's own rule turned on itself: a computed
proxy for an unrecorded tangle is what the rule that a tangle is recorded
and never computed forbids, and the draft used that rule against the
heuristics it rejected.

What the change gives up is stated for the ruling: the raw count was
insurance against the review failing to notice a divergence, and with it
gone the order is only as good as that noticing. This session judges silent
inaccuracy the worse failure, a proxy moving the author's queue for reasons
no one can audit, but the insurance is the honest reason to rule the other
way. The clean-context review, still owed, reads the recommendation as
amended, since the amendment landed before the review ran; the
implementation on `greenfield` still computes the earlier count and trails
this recommendation by that one term, which reconciliation follows once the
author has ruled or granted it.

### How alternatives fit the rug-pulling criterion, 2026-09-03

The author's question above, answered in the sitting and recorded here
because the answer is the alternative's rationale. The steelman for counting
alternatives is not weak and is stated first: on a frontier with no
authority, an unresolved fork at a node can pull the rug even where nobody
recorded it, since confirming its second alternative undermines everything
written while the first was assumed, whether or not the review noticed the
divergence and wrote it down; the raw count is then a proxy for unrecorded
divergence risk. What answers it is the recommended text's own rule, that a
tangle is recorded and never computed in a session. The route by which an
alternative reaches the order already exists and is `depends`: a leaf
standing under `<ancestor>#<alternative>` is the rug itself, and it enters
the count as that leaf's reach on the ancestor. A bare alternative no leaf
stands under is a fork nothing has been built on, with no rug beneath it.
Counting the raw list therefore double-counts the alternatives that carry a
divergence and inflates for the ones that do not. That the anomaly is at its
largest today follows: no node carries `depends`, so the whole alternatives
term is load with no dependency content in it, and it decides the head of the
queue by one point.

The trade the author rules on is whether to rely on the recorded divergence,
which is exact but only as complete as the review's noticing, or on the raw
count, which is inexact but needs no one to notice. This session's judgment
is the first, on the recommended text's own ground.

### Ancestor overtaken at the head of the order, 2026-09-03

Measured on the graph at the reconciliation, not argued from the text: the
ruling order the recommended answer produces puts `purpose` first and
`commons.systems/public/agency` second, and `purpose` is `agency`'s only
child. `agency` is the graph's sole root, so its sixty-nine unanswered
descendants are every other node in the record, `purpose` among them; it
carries two alternatives, for seventy-one. `purpose` has sixty-six
unanswered descendants and six alternatives, for seventy-two. The
recommended answer says "ancestors come before descendants by that count
and not by hand", and on this graph the count does not deliver it: nodes and
alternatives are summed into one scalar, and four extra alternatives outweigh
three extra descendants. The margin is one, so one alternative recorded
anywhere moves the head of the queue.

This is a defect in the recommendation and not in the implementation, which
computes what the text says. It is recorded as the alternative
`settle-counts-nodes-only` rather than fixed under the grant: the grant is to
reconcile the implementation to this disposition, not to redraft the
disposition, and which of the three answers is right is the author's ruling.
The clean-context review, still owed, reads the recommendation as it stands.

The alignment page shows `purpose` first for a second and independent
reason, which no ruling here changes: the page groups by graph, this
project's before the public graph, as `alignment-target` and `unanswered`
fix and this draft does not amend, so `agency` is in the second group
whatever its count. The two compete directly only in the flat `## Ruling
order` section of the frontier projection.

### Reconciled under the author's bootstrap grant, 2026-09-03

The author granted bootstrap authority in the words quoted above, for a
named reconciliation: the alignment skill, the align-review skill if
necessary, and the alignment page, brought to the unanswered recommendation
on this node and to the alternatives it raised on its siblings. The grant
also directed that the review not run. This node is therefore not answered
by it: the grant names implementation artifacts as what is reconciled and
this unanswered disposition as what they are reconciled to, so no
`## Answer` is written here, the stamp stays absent, the stage stays
`review`, and the clean-context review and the author's ruling are still
owed on the recommendation as it stands. Nothing in the implementation
acquires authority from having been built; if the ruling changes the
recommendation, the implementation follows it and not the reverse.

What the reconciliation covers, and what it therefore reaches beyond the
three artifacts the grant names: the reader, because the divergence device
the recommendation defines is recorded in `depends` as an ancestor together
with the alternative on it, which the reader must parse and the validator
must accept before any review can record one; and the projector, because the
alignment page is written by it. That widening is disclosed here rather than
assumed: it is the least that makes the three named artifacts work, and the
author may strike it at the ruling.

What was reconciled, landed on `greenfield` as
c6046115e2b45a9022d95d06aeaa44b94d619fcc against this node at graph commit
6ca8da2679591c5dad61a664338d48062230d808. The alignment skill: the three
usages, the frontier reading, the ruling stage's account of the page, the
queue, the `depends` clause of the dialogue state, the no-argument rule,
and a new clause stating the ruling order whole. The align-review skill:
validation 13 no longer asks the reviewer to recommend an order but to
record the tangle, with an explicit test for which of two unanswered nodes
was recorded earlier; `ruling_order` in the reviewer's output is replaced
by `subtree_divergences`, which the apply step writes into the leaves'
`depends` and records on the ancestor and the leaves; the brief indexes the
batch in the ruling order. The alignment page pages in the ruling order
within each graph, carries each node's settling count, and inverts a
divergence at the ancestor into what a ruling for each alternative keeps
and what it discards. The reader parses `<id>#<alternative>` and validates
it, and `deriveSettles` computes the count. The reconciliation session's
tests: 246 pass, and the graph validates at seventy nodes.

What the reconciliation did not do, and what a ruling for the standing
recommendation would still leave open: no node in the record carries
`depends` yet, so the divergence device is implemented and unexercised, as
the frontier finding of 2026-09-03 on `dialogue` says of the field itself,
and the twenty-three nodes carrying the `Depends on:` prose convention are
unmigrated. The alternatives this draft raised on `alignment-target`,
`attention`, `dialogue`, `unanswered`, `growth`, and `frontier-consistency`
are still pending the author's ruling; the implementation follows this
node's recommendation, which those alternatives would amend, and it follows
the ruling if the ruling differs.

An un-aligned disposition, recorded at its sitting's opening on 2026-09-03 and not yet answered. The question it asks is distinct from its parents': alignment-target says what a session given nothing takes up, and attention says how rank is computed and read; this node asks whether rank is the right order for the alignment frontier at all, and if not, what is, and whether the dialogue's state should carry something the order can be derived from.

What the sitting would amend, read before anything is changed:

- `alignment-target`, at the ruling stage: the answer takes the first unanswered node in rank order and rejects choosing by the oldest stage or the fewest movements owed; its clean-context review's strongest counter-argument, twice, is that rank today is the AI's unratified boosts and not the author's attention.
- `attention`, at the review stage: rank's second reading, frontier attention, "where work goes first", which reads alignment and reconciliation as one frontier with one order; its review's counter-argument is that one scalar cannot carry two orders, and the scope node's `order` field is the record's admission.
- `dialogue`, at the review stage: the `depends` part of the dialogue's state, the open questions a ruling waits on, "so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on". No node in the record carries the field, and the projector does not read it; the coverage node carries "Depends on: `audience`" in prose instead.
- `frontier-consistency`, at the review stage: validation 13, placement and order, under which "the review recommends the order in which the author rules"; the review of 2026-09-03 did so once, in its placement finding, recommending quotes after agency, and nothing consumed the recommendation.
- `unanswered`, at the ruling stage, and `growth`, at the maieutic stage: the alignment page lists every unanswered node in rank order, the purpose node first, and the queue of un-aligned dispositions is the set of such nodes in rank order.

The implementation their criteria point to: the frontier projection of `packages/disposition/project.mjs`, one rank order across both graphs; the alignment page's ordering, which groups by graph and then by rank; and the no-argument usage of the alignment skill, hand-materialized from alignment-target.

The periagogic object of this sitting is those five nodes and that implementation. The movement owed is periagogic: the author's account of what the record says rank is, and of what the alignment frontier is for, before the AI's account enters.

### Review owed, 2026-09-03

The author's words above announce a bootstrap-authority grant to follow the compaction, for a named reconciliation: the alignment skill, the align-review skill if necessary, and the alignment page. They are not the grant. Under the authority node's shim a grant is in force only when given in the author's words for the named reconciliation, so the resumed session waits for those words before it reconciles anything, and never reads this announcement as the grant.

The clean-context review has not run on this recommendation: the author stopped the sitting before it, at the checkpoint, to prepare for compaction. A session resuming this node invokes `/align-review` on the batch at the review stage, this node among it, and applies its verdict; nothing else is owed before the ruling. The alternatives this draft raises on alignment-target, attention, dialogue, unanswered, growth, and frontier-consistency were recorded in the same landing, each of source author and dated 2026-09-03.

### Maieutic movement closed, 2026-09-03

Drafted over four turns from the author's words above. The three classes of finding: within the graph, alignment-target, attention's second reading, and the page order on unanswered and growth apply rank to alignment and the draft contradicts each, recorded as alternatives of source author on those nodes; between the graph and the AI's knowledge, none the draft does not state; redundant seams, the three orphaned devices named in the rationale, folded into one mechanism, and `depends` needing a target beyond a node id, an alternative on dialogue. Evaluated twice: best judgment, dependency before importance; tradition, the two readings named in the rationale, both supporting. Tested against the record it joins: nothing above it is ratified, so nothing is doctrine, and it contradicts no global-tier node; it amends the projector, the alignment page, and the alignment skill's no-argument usage, which is reconciliation's work after the ruling. Facts: authority ratified, capture-shaped since it decides what the author is asked first; boldness moderate, the problem, the lack of authority, the greedy failure, and the leaf-recording choice being the author's and the survivor rule, the settling count, and rank as tie-break the AI's; persistence standing. Stage review.

### Periagogic movement closed, 2026-09-03

The periagogic movement ran over three probes, on attention's second reading of rank, on alignment-target's answer, and on the relation `depends` names, and closed with the author's account in the record: attention's "where work goes first" is the reconciliation frontier and predates the alignment frontier; rank was the only order the record had to hand when alignment-target was ruled, and every statement applying it to alignment is reconsidered; the alignment frontier has no confirmed authority, so any recording on it may supersede or duplicate any other, which authority's mechanism (a conflicting answer recorded as an alternative on the node it conflicts with) resolves mechanically only where one side has authority; whether `under` order settles that is open. The stage advances to maieutic.

### Probe outstanding, 2026-09-03 (closed above)

The periagogic movement is open on one probe, put to the author and not yet answered, and the sitting stands behind the sitting on dialogue by the author's choice. The probe, on attention's answer alone: it says rank is "one fact with three readings" and names the second as "frontier attention, where work goes first"; as that sentence stands, does it distinguish an alignment frontier from a reconciliation frontier at all, and whose attention does the record say the word names there, the author's, the session's, or the newcomer's. The AI's findings on the record are held back until the author commits to it.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Merge analysis of the author's words: 2026-09-03, own-question: Asks whether rank is the best signal for alignment priority, given that the unanswered alignment frontier has different properties from the reconciliation frontier and no authority to attenuate it, and whether greedy rank order is the right way to untangle a frontier whose unanswered nodes may conflict with each other. 2026-09-03, own-question: Refines the same question: whether there is better unanswered-alignment state that would help prioritise alignment.
The census unit's note: Nothing is pending on this node. It is an un-aligned disposition opened at its sitting, at the periagogic stage with one probe outstanding to the author and the AI's findings deliberately held back until the author commits, so there is no candidate answer to record. Its account names five nodes the sitting would amend — alignment-target, attention, dialogue, frontier-consistency, unanswered and growth — but proposes no change to any of them; that is scoping, not a finding, so I minted no elsewhere entries from it. I checked the redundancy question against both its parents: alignment-target answers what a session given nothing takes up and attention answers how rank is computed, while this node asks whether rank is the right order for the alignment frontier at all, so no fold is proposed.

### Frontier finding, 2026-09-03

Kind: coverage.

Dialogue's answer makes `depends` the seventh part of the dialogue state — 'the ids of unanswered nodes that must be answered before this node can be, so the page can order the author's queue, show what a ruling here would unblock, and refuse to put a question before the one it rests on' — and the validator enforces it ('every `depends` entry must resolve within this graph, must not repeat'). Verified that no node in the graph carries the field: `grep -rl '^depends:' disposition/` returns nothing, while twenty-three node files still carry the `Depends on:` prose convention the field was added to replace, and every batch node in this brief reports 'Depends: none'. Verified further that the projector reads the field nowhere: `depends` appears in project.mjs only in a comment listing the dialogue's own state, so the frontier emits nothing for it. Dialogue's own account says the consequence is disclosed — 'the field is recorded before its instrument exists, which the frontier will show' — and the frontier shows nothing, so the disclosure is itself false. Alignment-order, at the periagogic stage, records the same fact independently: 'No node in the record carries the field, and the projector does not read it; the coverage node carries "Depends on: `audience`" in prose instead.'

Also named: commons.systems/disposition-graph/dialogue.

Proposed: Dialogue is the survivor of what an unanswered node carries and nothing moves; what is owed is that the node say what it in fact has. Either the migration of the twenty-three prose conventions is named as part of what a confirmation orders, with the projector and the alignment page reading the field, or the answer says the field is defined and unused and that the prose conventions stand until the migration is ruled — which is the honest reading of the record today. The claim that the frontier will show the gap should be struck or made true, since it is the only thing standing between this gap and invisibility.

Recorded as a pending alternative on commons.systems/disposition-graph/dialogue: `depends-migration-named` (source review, 2026-09-03).

### Frontier finding, 2026-09-07

Kind: contradiction.

growth's recommended text orders the same frontier two ways. Its third usage reads "given nothing, it takes up the highest-ranked unanswered node, as the alignment-target node says", while its queue sentence in the same paragraph reads "the queue of un-aligned dispositions is therefore the set of such nodes, taken in the ruling order as the alignment-order node says and surviving every session, and the author's naming of a node is their order and needs no boost"; and the rationale of the same fence still opens "The loop is the alignment interview made incremental: one page, one ruling. The author's choice of what to propose next is itself a ranking act, recorded as boost." alignment-order, which growth names in depends, recommends "`/align` with nothing takes the first node of the ruling order; `/align <node id>` is the author's order and needs no boost." growth's own option `queue-in-ruling-order` was passed over on 2026-09-07 as "absorbed by the recommendation, whose queue sentence takes `alignment-order`'s ruling order and drops the boost", so the absorption reached one sentence of three.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/alignment-target.

Proposed: growth is the node whose text must change: the third usage and the rationale sentence are brought into line with the queue sentence and with alignment-order's recommended answer, so that one order governs the whole fence. alignment-order survives as the owner of the order and is cited rather than contradicted; alignment-target already carries the matching option `ruling-order-not-rank`, sourced to the author, and needs no change from this finding.

Recorded as an option on commons.systems/disposition-graph/growth's answer fact: `third-usage-in-the-ruling-order` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/alignment-order stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `settle-counts-nodes-only`; 17 `## Disposition` entries became the ledger entries words/2026-09-03/1, words/2026-09-03/2, words/2026-09-03/3, words/2026-09-03/4, words/2026-09-03/5, words/2026-09-03/6, words/2026-09-03/7, words/2026-09-03/8, words/2026-09-03/9, words/2026-09-03/10, words/2026-09-03/11, words/2026-09-03/12, words/2026-09-03/13, words/2026-09-03/14, words/2026-09-03/15, words/2026-09-03/14, words/2026-09-04/1, referenced by 0 options the entry's own date names and by the recommended option for 17 the date named none. The record wrote no text of its own for `draft`, `rank-as-the-alignment-order`, `order-computed-in-session`, `author-states-the-order`, `divergence-named-on-the-ancestor`, `review-names-the-survivor`, `node-nearer-the-root-stands`, `strike-rank-from-this-frontier`, `ancestor-screen-as-rows-to-rule-from`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it.

### Frontier finding, 2026-09-07

Kind: contradiction.

alignment-target's standing answer: 'Given no disposition and no node id, the session reads the frontier and takes the first unanswered node in rank order, this project\'s graph, read from the frontier by its id prefix, before the public graph, and so the purpose node first while it is unanswered'. alignment-order's standing answer: 'The ruling order, derived from the tangle the record carries, and not rank.' alignment-target carries '`ruling-order-not-rank` — source author' and does not recommend it.

Also named: commons.systems/disposition-graph/alignment-target.

Proposed: alignment-order survives; alignment-target's recommendation moves to its existing author-sourced option `ruling-order-not-rank`, and the sentence naming the purpose node first is re-derived from the ruling order or struck.
