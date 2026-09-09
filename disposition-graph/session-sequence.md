---
question: In what order does a sitting take up the dispositions it has decomposed from the author's input?
stage: periagogic
probes:
  - id: are-the-grounds-closed
    asks: >-
      Your words name resolving dependencies and avoiding redundant graph or
      reconciliation work, and give supersession and optimizing later work as cases of
      the second. Is that list closed, so that an ordering made on any other ground is
      one the sitting may not make, or are they the grounds you had in hand?
    fact: answer
    why: >-
      The grammar of the sentence carries both readings and the record cannot choose
      between them. Read one way there are two grounds and the "such as" introduces two
      instances of the second; read the other there are three grounds in a list. It
      matters because the report prints a reason for every ordering, and a closed list
      makes those reasons a fixed vocabulary an author can scan while an open one makes
      them prose the sitting writes. Nothing else in the record bears on it: no node
      presently states any ground for a session-local order at all.
    discharges: >-
      Whether the answer's grounds are exhaustive, and whether the reason the report
      prints beside each ordering is drawn from a fixed vocabulary or written freely.
    source: ai
    raised: 2026-09-09
    target: author
    type: maieutic
    rank: 2
  - id: does-re-sequencing-reach-a-disposition-already-landed
    asks: >-
      When input arrives mid-sitting and changes the order, does the re-ordering reach
      only what the sitting has not yet taken up, or may it reopen a disposition the
      sitting has already recorded and landed?
    fact: answer
    why: >-
      The record answers this for one case and not in general.
      `what-acts-during-bootstrap` says that under a grant "alignment already sequenced
      in that sitting is re-visited where newly reconciled disposition would change it",
      which reaches back over landed work, and it says so as a thing the grant adds
      rather than as the ordinary rule. So outside a grant the record does not say, and
      a sitting that reopens what it has landed and one that does not are both consistent
      with everything written.
    discharges: >-
      Whether this answer states a rule of its own for re-visiting landed work or defers
      to the grant, and therefore whether the order the report prints is the order the
      sitting ended in or the order it took things up in.
    source: ai
    raised: 2026-09-09
    target: author
    type: periagogic
    rank: 1
facts:
  - name: answer
    options:
      - name: sequenced-within-the-sitting-on-stated-grounds
        source: author
        ref: "2026-09-09"
        supports:
          - words/2026-09-09/2
      - name: the-frontier-order-governs-and-there-is-no-session-order
        source: ai
        ref: "2026-09-09"
        status: passed
        reason: "the frontier's rank is computed over the graph from settle counts, so it cannot see input that has not landed, and the author's words have the sitting order what it has decomposed from input in hand"
      - name: the-session-order-is-derived-from-the-dependency-edges
        source: ai
        ref: "2026-09-09"
    recommends: sequenced-within-the-sitting-on-stated-grounds
    boldness: low
    against: "The order is the sitting's, its grounds are the sitting's to apply, and the only check on it is the author reading the reason the report prints beside each placement. A sitting that took the hard disposition last and ran out of context before reaching it would print a reason that reads exactly like a good one, since every ordering can be described as optimizing the work of the others, and nothing in the record could tell the two apart. The record has no measure of what a sitting could have taken up, so the ground of avoiding redundant work is unfalsifiable in the only direction that matters."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/alignment-order
depends:
  - commons.systems/disposition-graph/decomposition
  - commons.systems/disposition-graph/session-state
  - commons.systems/disposition-graph/standard-report
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Facts

### answer

The recommendation is `sequenced-within-the-sitting-on-stated-grounds`, at low boldness.
Low because the option is the author's own at `words/2026-09-09/2` and the AI adds the
placement, the naming of the grounds as grounds, and the requirement that each ordering
carry its reason, which follows from the report printing the order and is not an addition
to what the order is.

The question exists because the record has one order and needs two. `alignment-order`
computes the frontier's rank from the graph, and its recommended option counts settles
over nodes; `decomposition` says the main thread integrates the questions of one
decomposition in their ruling order, which is that same derived rank. Neither can order
what a sitting is holding, because what a sitting is holding has not landed and the graph
cannot see it. The record already knows the two are different and says so in
`session-state`'s own option text, that `alignment-order`'s rank stays derived and what the
store holds is the sitting's departure from it under the input in hand. A departure with
grounds is a standing answer to a question, and this is the question.

Why a node and not a clause in `alignment-order`'s answer. A ruling is recorded per fact,
so a text that carries two rules in one answer fact is a text the author cannot rule on in
parts, which is the reason `delegation-bounds-and-sizing` gives for moving clauses to a
node of their own rather than dividing one answer. The derived rank and the sitting's own
order would be two rules on one fact. Placed beneath, the sitting's order refines the
frontier's order in the ordinary way, authority narrows on the way down, and the author can
rule on one without ruling on the other. It is the first node placed beneath
`alignment-order`, which is itself a small piece of evidence for the placement: the record
has never before had a question about ordering that was not about the derived rank.

Why the order is the sitting's and not derived. The rival that would derive it from the
`depends` edges is recorded and not recommended. What it gets right is that dependency is
one of the author's grounds and is the one a graph could compute. What it cannot reach is
the other ground: whether one disposition supersedes another, or would make the later
ones cheaper, is a judgment about work that has not been done, and no edge in the graph
holds it. A rule that derived what it could and left the rest to the sitting would be two
rules again, and the sitting would still have to say which had applied.

Every ordering carries its reason, and that is the AI's addition. The report prints the
order, and an order printed without its ground is an announcement the author cannot check.
The record's own instrument against this shape of thing is that a claim is checkable, and
the reason is the only part of an ordering that can be checked at all, since the
counterfactual, what the sitting would have done in the other order, is not recoverable.
The node's case against says why that check is weak, and it is recorded there rather than
softened here.

#### sequenced-within-the-sitting-on-stated-grounds

The sitting orders the dispositions it has decomposed, in an order it sets and re-sets as
input arrives, on the grounds the author names, and every ordering carries the ground it
was made on. The order is the sitting's own working state, held in the store and not on
the ref, and it does not displace the frontier's derived rank.

**AI support.** It is the author's at `words/2026-09-09/2`, and it is what the alignment
sequencing report needs in order to have anything to be an order of. It also names a thing
the record has been doing without a rule: every sitting that has taken the author's input
in the order the author gave it, or in some other order, made this decision and recorded
nothing about it.

**AI divergence.** The order is stored, and this record's answer on
`event-sourcing-derived-view` holds that a view is never stored because a second
implementation of the fold is a second truth. What is said for the option is
`session-state`'s answer, that this is not a fold of the ref at all, being a departure from
the derived order under input the ref does not hold. What is said against it is that the
departure becomes a copy the moment the input lands, and neither that node nor this one
strikes it then.

**Content.**

```markdown
---
question: In what order does a sitting take up the dispositions it has decomposed from the author's input?
form: rule
under:
  - commons.systems/disposition-graph/alignment-order
---

## Answer

In an order the sitting sets and re-sets as input arrives, and not in the frontier's. An
alignment sitting may be given more than one input and may be given some of them after it
has started; the alignment dialogue decomposes each input into dispositions, and then
orders the dispositions it holds. The order is the sitting's own. Nothing rules on it, it
binds no later sitting, and it dies with the sitting, which is why it is held in the
session store and not on the ref, as `session-state` says.

It does not displace the record's order and is not a second copy of it. `alignment-order`
computes the frontier's rank from the graph and that rank stays derived; what this order
is, is the sitting's departure from that rank under input the graph does not yet hold,
which is a thing the frontier cannot compute because the input has not landed.

The sitting orders on the author's grounds. The first is dependency: where the answer one
disposition would take turns on the answer another takes, the second is sequenced first,
and the design of the first waits on the recommendation of the second and not on its
ruling, which is the rule `decomposition` already states for the units of one
decomposition. The second is avoiding redundant graph and reconciliation work, of which
the author names two cases: where one disposition supersedes another, so that taking the
superseded one first spends an amendment the later one strikes; and where taking one
disposition first makes the graph or reconciliation work of the later ones smaller.

Every ordering carries the ground it was made on, and the report the sitting prints when
it stops prints the order. An order printed without its ground is an announcement rather
than a decision the author can check, and the ground is the only part of an ordering that
can be checked at all, since what the sitting would have found in the other order is not
recoverable.

The order is re-set and not only set once. Input that arrives mid-sitting is decomposed
and sequenced against what the sitting already holds. Under a bootstrap grant the sitting
also revisits alignment it has already sequenced where newly reconciled disposition would
change it, which is `what-acts-during-bootstrap`'s clause and is not restated as a rule of
its own here.
```

#### the-frontier-order-governs-and-there-is-no-session-order

The sitting takes its dispositions in the frontier's derived rank order and there is no
session-local order to state.

**AI support.** It is the position the record held until this entry, and it has the
strongest property any ordering rule can have: it is computed from the graph, so it is the
same for any two sittings and no sitting can arrange its own convenience under it. It also
needs no store, which removes the whole tension `may-the-store-direct-what-it-may-not-authorize`
names.

**AI divergence.** It cannot order what a sitting holds. The frontier's rank is a settle
count over landed nodes, and a disposition decomposed from input given ten minutes ago has
no settle count and no node the count could reach. So the rule is not merely worse, it is
undefined on exactly the set the sitting has to order. Passed for that reason.

**Content.**

From: sequenced-within-the-sitting-on-stated-grounds

```diff
@@ -7,12 +7,11 @@
 
 ## Answer
 
-In an order the sitting sets and re-sets as input arrives, and not in the frontier's. An
-alignment sitting may be given more than one input and may be given some of them after it
-has started; the alignment dialogue decomposes each input into dispositions, and then
-orders the dispositions it holds. The order is the sitting's own. Nothing rules on it, it
-binds no later sitting, and it dies with the sitting, which is why it is held in the
-session store and not on the ref, as `session-state` says.
+In the frontier's order. `alignment-order` computes a rank over the graph and a sitting
+takes the dispositions it holds in that rank's order, so that two sittings given the same
+work do it in the same order and no sitting arranges its own sequence. A disposition the
+graph does not yet hold takes the rank of the node it was recorded under when it was
+minted, which the queue rule requires at once.
 
 It does not displace the record's order and is not a second copy of it. `alignment-order`
 computes the frontier's rank from the graph and that rank stays derived; what this order
```

#### the-session-order-is-derived-from-the-dependency-edges

The sitting does not choose an order; the order is computed from the `depends` edges among
the dispositions it holds, and the sitting records nothing but the result.

**AI support.** It answers the divergence the recommended option carries, that a stored
order is a stored view, by making the order a fold like any other. It also makes the report
checkable in a way the recommended option is not: a reader with the graph can recompute the
order and see whether the sitting followed it.

**AI divergence.** It reaches one of the author's grounds and not the other. Dependency is
in the edges; supersession and the cheapening of later work are judgments about work not
yet done, and no edge holds them. A rule that computed what it could and left the rest to
the sitting would be two rules on one fact, and the sitting would still have to say which
had applied, which is the reason the recommended option is not written that way. It is
recorded rather than passed over because the author's answer on `viable-options` holds that
an option entertained in the dialogue is kept for the record of why the choice was made,
and because it is the option the AI would return to if the grounds turn out to be closed
and computable.

**Content.**

From: sequenced-within-the-sitting-on-stated-grounds

```diff
@@ -19,20 +19,11 @@
 is, is the sitting's departure from that rank under input the graph does not yet hold,
 which is a thing the frontier cannot compute because the input has not landed.
 
-The sitting orders on the author's grounds. The first is dependency: where the answer one
-disposition would take turns on the answer another takes, the second is sequenced first,
-and the design of the first waits on the recommendation of the second and not on its
-ruling, which is the rule `decomposition` already states for the units of one
-decomposition. The second is avoiding redundant graph and reconciliation work, of which
-the author names two cases: where one disposition supersedes another, so that taking the
-superseded one first spends an amendment the later one strikes; and where taking one
-disposition first makes the graph or reconciliation work of the later ones smaller.
-
-Every ordering carries the ground it was made on, and the report the sitting prints when
-it stops prints the order. An order printed without its ground is an announcement rather
-than a decision the author can check, and the ground is the only part of an ordering that
-can be checked at all, since what the sitting would have found in the other order is not
-recoverable.
+The order is computed and not chosen. The dispositions a sitting holds carry `depends`
+among themselves as any nodes do, and the order is a topological order of those edges,
+with the frontier's rank breaking ties. The sitting records the result and no reason,
+because a computed order has no reason to record beyond the edges it was computed from,
+which are on the ref and are readable.
 
 The order is re-set and not only set once. Input that arrives mid-sitting is decomposed
 and sequenced against what the sitting already holds. Under a bootstrap grant the sitting
```

### authority

The recommendation is `ratified`, at low boldness.

The reading `class-recommendation` calls for: the capture-shaped limb. The party that sets
the order is the party the order disciplines. A sitting chooses which of the author's
inputs it takes up first and therefore which of them the author sees answered and which
one it runs out of context before reaching, and it writes the reason for that choice
itself. The check the record has is the author reading the report, which is the same check
`delegation-bounds-and-sizing` calls the only check this record has on the AI, and a rule
that lets the AI set the order of the author's own questions spends it. The expensive limb
is touched and is not the ground: a badly ordered sitting spends graph work it has to
redo, which is real and is recoverable.

## Account

### Queued, 2026-09-09

Minted in the alignment sitting of 2026-09-09 under the grant at `words/2026-09-08/2` as
refined at `words/2026-09-08/22`, from the parenthesis of the author's words at
`words/2026-09-09/2`, which were given while the sitting was in hand and are queued as
`movements` and the alignment skill's queue rule require. The entry answers more than one
question, so the sitting's first unit was the decomposition the queue rule calls for. That
unit found three questions in the entry: the shape of the alignment sequencing report,
which is `standard-report`'s; what the session store must hold for the report to be
printable, which is `session-state`'s; and this one, which nothing in the record asks.

Placed under `alignment-order` because that node owns what orders alignment work, and this
is an order for the case the derived rank cannot reach. It is the first node placed beneath
it. The alternative placements were considered and rejected with their reasons.
`decomposition` states the rule this one departs from, that the main thread integrates the
questions in their ruling order, but its question is how a complex disposition is
decomposed and how the results are integrated, and an order over dispositions from several
different inputs is not inside it. `standard-report` prints the order and does not set it.
Writing it into `alignment-order`'s own answer fact was rejected because a ruling is
recorded per fact and two rules on one fact are not separately rulable, which is the
reason `delegation-bounds-and-sizing` gives for the same move.

Its `depends` names four nodes. `decomposition`, because what is ordered is what its
decomposition produces and because its ruling-order clause is the rule this one departs
from. `session-state`, because the order lives in the store and nowhere else, and because
that node's own option text already draws the distinction this node's answer rests on.
`standard-report`, because the order is printed there and what must be printable is what
fixes how much of the order is written down. `what-acts-during-bootstrap`, because its
clause that alignment already sequenced in a sitting is re-visited where newly reconciled
disposition would change it is the re-sequencing rule from the bootstrap side, and a node
that stated re-sequencing without naming it would state one rule in two places.

The periagogic object is `alignment-order` and its derived rank; `decomposition` and its
dependency seam; `session-state`, whose option already names the departure this node is
about; `standard-report`, which prints it; `what-acts-during-bootstrap` on re-visiting;
and `event-sourcing-derived-view`, whose adopted reading that a view is never stored is
the strongest thing standing against the answer.

Its place in this sitting's sequence was fourth, after the two dispositions on
`standard-report` and the one on `author-questions`, on the ground of a dependency to
resolve: what this node must answer is fixed by what the report must print, so minting it
first would have set its scope by guess and amended it by the end of the same sitting.
