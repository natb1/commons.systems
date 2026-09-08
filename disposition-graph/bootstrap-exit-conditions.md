---
question: What are the conditions of bootstrap exit?
stage: maieutic
facts:
  - name: answer
    options:
      - name: gathered-and-cited
        source: review
        ref: "2026-09-05"
      - name: left-where-they-stand
        source: commons.systems/disposition-graph/what-acts-during-bootstrap
        ref: "2026-09-05"
      - name: minted-here
        source: ai
        ref: "2026-09-05"
        status: passed
        reason: "a condition minted here would bind the record from a node no ruling reaches, where the conditions that exist are the author's words and the liquidation clauses the record already declares"
      - name: global-tier-ruled-is-a-condition
        source: ai
        ref: "2026-09-05"
      - name: shim-liquidation-is-never-a-condition
        source: review
        ref: "2026-09-05"
      - name: conditions-derived-not-restated
        source: review
        ref: "2026-09-05"
      - name: conditions-projected-as-a-rule
        source: review
        ref: "2026-09-05"
    recommends: gathered-and-cited
    boldness: high
    against: "The list is a copy, and a copy of a set of clauses that are still being amended one node at a time will be stale between one landing and the next; the record's own answer to a restatement is a citation, and a node whose whole content is six citations may be a projection the browser should compute rather than a question the author should rule."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "The conditions are declared on other nodes and change when those nodes are ruled, so ratifying the gathering fixes a list whose members the author will move afterwards; deferred would let it act and keep it on the frontier while the nodes it gathers from are ruled."
review:
  verdict: kickback
  strength: strong
  date: 2026-09-05
  of: 3da73aef94a1688b1fcd1e7cd3713417a59653a8
  commit: e44599b546f90dc6a30049b5ae229f18238f5bef
  against: "The strongest argument against is still that this node stores a derived view as prose, and the fourth reading is the first to see the mechanism fail in the way that argument predicts. The pins are the answer's own guarantee that the copy cannot drift -- \"the `cites` field carries the pins that make that promise checkable\" -- and five of the seven were stale within two commits of the redraw landing, both of them made by the same thread that wrote the pins, neither touching any quoted field. So the mechanism does not fail by a quotation going bad; it fails by producing an alarm that means nothing, since a stale pin here signals only that the cited node was edited somewhere. A reader who follows five pins, finds five mismatches, and finds every quotation intact learns to stop following pins, and that is exactly when the second home goes unchecked -- the harm the node exists to prevent, arrived at through the instrument meant to prevent it. This reading's other findings are the same shape at smaller scale: an ordinal inverted against its field, a field misattributed in one text and corrected in the other, a count contradicted eighteen lines below itself. None is hard to fix; that they recur across four readings, each fix landing where the reading pointed and the next reading finding the same class of slip elsewhere, is the evidence that the copy is the problem and not the copyist -- which is `conditions-derived-not-restated`'s case, and it is stronger now than when that option was raised."
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
depends:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
  - commons.systems/disposition-graph/work-loop
  - commons.systems/disposition-graph/materialization
  - commons.systems/disposition-graph/review
  - commons.systems/disposition-graph/vocabulary-view
  - commons.systems/disposition-graph/attention
  - commons.systems/disposition-graph/alignment-order
  - commons.systems/disposition-graph/transience
---

## Facts

### answer

`gathered-and-cited` is recommended at high boldness, which in this record means low
confidence. The failure it exists to prevent has already happened once: a list
written from memory into a rule file that every session loads, missing two
conditions the author gave and carrying a third that could never be met. A gathering
that cites each condition to its declaring node and quotes it verbatim cannot
drift silently, because the citation is checkable and a reader who follows it
finds the words. The reading of 2026-09-05 found that guarantee undelivered,
three of nine items quoted and six paraphrased, and every clause is now quoted
from the field that carries it; that the promise had to be made good after it was
made is itself evidence for the case against. What
rests on the AI is not a part of this answer but all of it: every line is a sorting
decision, and the reading of 2026-09-05 found the first sorting refused by
`work-loop`'s own rationale, by the author's words quoted on that node, and by the
reading that minted this one. The sorting now runs on one stated rule instead of two
unstated ones, which makes it checkable and does not make it right. The case against
is on the fact and is unanswered.

#### gathered-and-cited

The conditions the record declares, gathered here and minted nowhere.

**AI support.** Minted on 2026-09-05 by the second clean-context reading of
`what-acts-during-bootstrap`, under validation 15: the question is asked by no node
and answered in four places, the reconciliation shim's liquidation on `work-loop`,
the greenfield shim's on `materialization`, the code-review shim's artifact clause
on `review`, and one clause of `what-acts-during-bootstrap`'s own answer, with two
conditions in the author's own words standing outside all four. The reading found
that clause false where it stood, circular in one limb, and short by two, and
proposed the node.

Which node holds the list is the author's to choose, and the record holds the
choice open from both ends. `work-loop` carries the option
`exit-conditions-cited-not-carried`, repointed on 2026-09-05 so that its
destination is this node: under it the shim's exit clauses move here and the shim
cites this node instead of restating them, keeping only the limb that cannot
move, validation in use after the swap. `left-where-they-stand` on this fact is the same choice seen from
this side, the clauses staying on the shims and this node listing none. The parent
is no longer a candidate home for them.

The gathering is a citation and not a copy of authority: every condition here acts
because the node that declares it declares it, and this node acts on nothing until
it is ruled. That is what makes the list safe to write while every node it cites is
itself unanswered. It is not what makes the list safe from going stale, which is the
case against and is unanswered.

**AI divergence.** The list is a copy, and a copy of a set of clauses that are still being amended one node at a time will be stale between one landing and the next; the record's own answer to a restatement is a citation, and a node whose whole content is six citations may be a projection the browser should compute rather than a question the author should rule.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

The conditions the record declares, gathered here and minted nowhere. This node
adds no condition of its own: each one below is quoted verbatim from the field
that carries it and cited to the node that declares it, and a condition struck or
amended there is struck or amended here. The `cites` field carries the pins that
make that promise checkable, one blob hash per node quoted; no instrument checks
them, `read.mjs` validating only that a hash is forty hex characters and the
projector warning only on an unknown id, so what the promise rests on is the
sitting that writes it and not the machine.

Two rules sort them, and they are applied to every clause alike. A condition of
exit is anything that must be true before `greenfield` is swapped with `main`;
what can only be observed after that swap is no condition of the moment it
conditions, and the swap itself is what happens at exit and is no condition of
it, as the node above this one says. And where the record puts a thing "at exit",
it is owed before the swap and is on the list; only what the record puts after
the swap is off it.

The author's words set four, and two of the four are declared a second time by
`work-loop`'s shim below. On `vocabulary-view`, 2026-09-02: "Before bootstrap
exit technical repo vocabulary like 'disposition', 'ratified', 'doctine' will
need to be recorded on the onboarding path of the graph and clearly identified
with appropriate layout in the documentation projection. References to tradition
also need to be clearly called out with appropriate layout." On `attention`, and
in the same words on `alignment-order`, 2026-09-03: the reconciliation process,
"shimmed as a skill, but codified before bootstrap exit". And twice on
`work-loop`, 2026-09-03, quoted in that node's `## Disposition`: of the second
direction, "\"Resolves in both directions\" this is required for bootstrap exit,
but not transition. Disposition must me answered before this is shimmed or
materialized . Only resolved from graph to implementation"; and of the drain,
"\"All legacy tactic nodes are drained during bootstrap\" also required for exit
but not transition".

`work-loop`'s reconciliation shim carries three clauses in its `liquidation`
field, taken here in the field's own order and cited by their opening words
rather than by an ordinal, since the first of the three carries two conditions.

"the orchestrator and the bite skills are materialized from ratified nodes":
this is the author's condition on `attention` and `alignment-order` with a
requirement added, that the nodes those artifacts are materialized from be
ratified. The author's words and this clause declare one condition, counted
once, and the stronger form governs.

"every landing made under this shim has passed the validation it skipped,
functional validation against its node's criteria, the review instrument's
assessment", which is the rest of that same clause. Only its remaining limb,
"validation in use after the implementation ref is swapped with the main
branch", is excluded, by the first rule above and by nothing else.

"every rule this project runs under is a node or a declared shim, dispatch
selects from this graph, the alignment skill is the only path by which a node is
recorded, and nothing live reads the legacy record".

"the second direction, every artifact on the implementation ref that no node
justifies supported by a disposition or pruned, and the drain of every legacy
tactic node, transcribed to this graph or pruned, are complete, neither begun
before the disposition that states them is answered". The shim and the author
declare this one together: it is the author's two sentences on `work-loop`
above, and the trailing words are a condition too, and a narrower one than the
ruling of the whole global tier, since the nodes that state the second direction
and the drain are answered before either begins, and so before exit.
`work-loop`'s answer opens "By reconciliation in both directions, the second
begun only at exit", which would make this completion begin at the moment it
gates; the author's own words on that node say the direction "is required for
bootstrap exit, but not transition", with "Only resolved from graph to
implementation" as the interim, which is what the shim's trailing clause says.
The divergence is that node's answer against the author's words, it is recorded
there as the option `second-direction-begins-when-its-disposition-is-answered`,
and this list follows the shim and the words.

`materialization`'s greenfield shim declares two, quoted from its `liquidation`
field: "the coverage node has been ruled on what the record covers, which is a
condition of bootstrap exit and not of the swap alone"; and "`greenfield` is
swapped with `main` at bootstrap exit, after whatever on `main` is to survive has
been reconciled into `greenfield` under a supporting disposition". The second is
marked a condition of the swap, and the swap is the act of exit, so it is here;
`materialization`'s own case against calls it a deletion whose scope no one has
ruled, which is a reason to put it in front of the author and not a reason to
leave it off.

`review`'s code-review shim declares no condition of its own. Its `artifact`
field says the instrument runs "at bootstrap exit for every landing made under
the reconciliation shim", which is the same assessment, on the same landings, at
the same moment, as `work-loop`'s fourth clause requires: one condition declared
in two places, counted once, with both loci named. What is owed is the assessment
and not the instrument, since the instrument that node describes is not yet
materialized and the shim stands in for it.

The list is seven. Eleven declarations reduce to it, and each reduction is one
condition declared twice: the author's words on the second direction and on the
drain with the shim clause that carries both; the author's words on `attention`
and `alignment-order` with the shim's orchestrator clause; and `review`'s
`artifact` field with the shim's assessment clause. What is left is the
onboarding vocabulary and the tradition callouts; the codification of the
reconciliation process, materialized from ratified nodes; every rule a node or a
declared shim, with dispatch, the alignment skill and the legacy record as that
clause states them; the second direction and the drain complete, neither begun
before the dispositions that state them are answered; every landing under the
reconciliation shim assessed and validated against its node's criteria; the
coverage node ruled; and the swap made after whatever on `main` is to survive
has been reconciled into `greenfield`.

Whether the ruling of the global tier is an exit condition is declared by no
node. The `what-acts-during-bootstrap` node's gloss implied it, by making
bootstrap the state until the global tier is ruled, and that gloss was withdrawn
on 2026-09-05; the narrower ratification requirement `work-loop`'s second clause
carries is on the list above, and the wider one is not. It is on the frontier as
the option `global-tier-ruled-is-a-condition`.

Two of these conditions are what `transience` calls a criterion rather than a
gathering: that node's answer names "Review every landing before exit" and "drain
the legacy record" as standing obligations belonging as criteria on the nodes
they serve, derived onto the frontier and never written. This gathering diverges
from that shape, and the divergence is recorded rather than left to be found:
no instrument derives an unmet exit condition today, and `transience`'s own
instrument `ref` concedes the nearer case, that "the flagging of a met condition
is not yet materialized", and a shape with no instrument would leave the conditions where
they were, reachable from no node that names exit. The criterion shape is on this
fact as `conditions-derived-not-restated` and it is the author's to take.

These conditions are read from the graph and are not projected into
`.claude/rules/`. That is a decision and not an omission. What every session needs
of this question is the citation the parent's rule already carries, and the failure
this node exists to close was a list in a rule file going stale under the sessions
that loaded it; a list of clauses that live on six other nodes, copied into a file
every session reads, is that same second home multiplied by every context it enters.
The rival is on the fact as `conditions-projected-as-a-rule`, where the author can
rule for it.
```

#### left-where-they-stand

The conditions are read where the record declares them and this node lists none:
three nodes declare them in their own fields, `work-loop`, `materialization` and
`review`, and the author's words stand on four more, `vocabulary-view`, `attention`,
`alignment-order` and `work-loop` itself; a session that needs to know whether exit
is reachable reads those six. It is what the record does today, and it is not dominated: it keeps each
condition beside the shim whose liquidation it is, where the person amending that
shim will see it, and it mints no seventh place to fall stale, which is the case
against this node's answer. What it costs is that the conditions in the author's
words are reachable from no node that names exit, which is how they came to be
missing from the list this node replaces. Raised on
`commons.systems/disposition-graph/what-acts-during-bootstrap`, whose answer carried
the list until 2026-09-05, and named there as `conditions-cited-not-listed`; the
same choice seen from `work-loop`'s side is `exit-conditions-cited-not-carried`.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

The conditions are read where the record declares them and this node lists none:
three nodes declare them in their own fields, `work-loop`, `materialization` and
`review`, and the author's words stand on four more, `vocabulary-view`, `attention`,
`alignment-order` and `work-loop` itself; a session that needs to know whether exit
is reachable reads those six. It is what the record does today, and it is not dominated: it keeps each
condition beside the shim whose liquidation it is, where the person amending that
shim will see it, and it mints no seventh place to fall stale, which is the case
against this node's answer. What it costs is that the conditions in the author's
words are reachable from no node that names exit, which is how they came to be
missing from the list this node replaces. Raised on
`commons.systems/disposition-graph/what-acts-during-bootstrap`, whose answer carried
the list until 2026-09-05, and named there as `conditions-cited-not-listed`; the
same choice seen from `work-loop`'s side is `exit-conditions-cited-not-carried`.
```

#### minted-here

This node states the conditions in its own voice and the other nodes cite it.
Passed over on 2026-09-05: a condition minted here would bind the record from a
node no ruling reaches, and the conditions that exist are the author's words and
the liquidation clauses the record already declares, which is authority this node
does not have and does not need.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

This node states the conditions in its own voice and the other nodes cite it.
Passed over on 2026-09-05: a condition minted here would bind the record from a
node no ruling reaches, and the conditions that exist are the author's words and
the liquidation clauses the record already declares, which is authority this node
does not have and does not need.
```

#### global-tier-ruled-is-a-condition

The ruling of the global tier is added to the list. The withdrawn gloss on
`what-acts-during-bootstrap` implied it, by making bootstrap the state until the
global tier is ruled, and it is the condition a reader would expect the record to
declare; against it, no node declares it, and the record's own answer to what the
state is has moved to bootstrap exit, so writing it into the list on the AI's own
judgment would be minting a condition, which the passed option above says this
node may not do. That bar binds the AI and not the author: a condition the author
declares in ruling for this option is the author's own and is not minted here,
which is why the option stands on the fact rather than beside `minted-here`.
Raised by the sitting of 2026-09-05 as the condition the withdrawn gloss implied
and the record does not declare, and redrawn after the reading of the same day,
which found its prose arguing it off the list.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

The ruling of the global tier is added to the list. The withdrawn gloss on
`what-acts-during-bootstrap` implied it, by making bootstrap the state until the
global tier is ruled, and it is the condition a reader would expect the record to
declare; against it, no node declares it, and the record's own answer to what the
state is has moved to bootstrap exit, so writing it into the list on the AI's own
judgment would be minting a condition, which the passed option above says this
node may not do. That bar binds the AI and not the author: a condition the author
declares in ruling for this option is the author's own and is not minted here,
which is why the option stands on the fact rather than beside `minted-here`.
Raised by the sitting of 2026-09-05 as the condition the withdrawn gloss implied
and the record does not declare, and redrawn after the reading of the same day,
which found its prose arguing it off the list.
```

#### shim-liquidation-is-never-a-condition

No clause of a shim's liquidation is a condition of exit, whatever the shim says:
a shim liquidates when the thing it stands in for exists, which is its own event
and not the record's, so the conditions of exit are the author's words on four
nodes and `materialization`'s coverage limb, which its own clause marks a
condition of exit and not of the swap. What survives the strike is more than the
list this option first named: the author's words on `work-loop`, at that node's
`## Disposition`, make the completion of the second direction and the drain of
the legacy record conditions of exit in the author's own voice, so those two
stand whatever becomes of the shim clause that also carries them. It is the
position this node held until the reading of
2026-09-05, and it is the shortest list the record can be read to support. Against
it stands `work-loop`'s rationale, which calls the batched validation "the
bootstrap exit criteria" in those words, and the author's words on that node, which
call it "bootstrap/shim exit criteria"; a list drawn this way strikes the author's
own sentence. Recorded so that the author sees the rival the recommendation moved
away from, and not only the list it moved to.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

No clause of a shim's liquidation is a condition of exit, whatever the shim says:
a shim liquidates when the thing it stands in for exists, which is its own event
and not the record's, so the conditions of exit are the author's words on four
nodes and `materialization`'s coverage limb, which its own clause marks a
condition of exit and not of the swap. What survives the strike is more than the
list this option first named: the author's words on `work-loop`, at that node's
`## Disposition`, make the completion of the second direction and the drain of
the legacy record conditions of exit in the author's own voice, so those two
stand whatever becomes of the shim clause that also carries them. It is the
position this node held until the reading of
2026-09-05, and it is the shortest list the record can be read to support. Against
it stands `work-loop`'s rationale, which calls the batched validation "the
bootstrap exit criteria" in those words, and the author's words on that node, which
call it "bootstrap/shim exit criteria"; a list drawn this way strikes the author's
own sentence. Recorded so that the author sees the rival the recommendation moved
away from, and not only the list it moved to.
```

#### conditions-derived-not-restated

The conditions are the shim liquidation clauses and the author's quotations as
the fields that carry them hold them, and this node names the declaring loci and
carries no clause of its own, an instrument deriving the list from those fields
onto the frontier. Nothing is restated in prose, and a clause struck or amended
at its source changes the list by construction rather than by an editor noticing.
It is the shape this node's own case against names as what would answer it, and
`transience`'s standing answer already prescribes it for two of these very
clauses, the review of every landing before exit and the drain of the legacy
record, which it calls criteria on the nodes they serve.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: no such
derivation exists today, and `transience`'s own instrument note concedes that the
flagging of a met condition is not yet materialized, so the node would stand
meanwhile on citations alone and name the instrument as owed -- which is how the
author's two conditions came to be reachable from no node that names exit, the
failure this node was minted to close. Raised by the clean-context reading of
2026-09-05.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

The conditions are the shim liquidation clauses and the author's quotations as
the fields that carry them hold them, and this node names the declaring loci and
carries no clause of its own, an instrument deriving the list from those fields
onto the frontier. Nothing is restated in prose, and a clause struck or amended
at its source changes the list by construction rather than by an editor noticing.
It is the shape this node's own case against names as what would answer it, and
`transience`'s standing answer already prescribes it for two of these very
clauses, the review of every landing before exit and the drain of the legacy
record, which it calls criteria on the nodes they serve.
```

#### conditions-projected-as-a-rule

The same gathering with `tier: global`, so the conditions are projected into
`.claude/rules/` beside the parent's rule and the session that rule points at
this node loads the text it is pointed at, instead of being told where to look.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, the second home the answer's last paragraph argues against,
multiplied by every session's context: a list of clauses living on six other
nodes, copied into a file every session reads. Where the conditions are read is a
decision the answer argued in prose with its rival named and no row to rule it
on, which the `dialogue` node holds is a fact's option or a node and not a
paragraph; nothing above settles it either, `tier` standing at the maieutic stage
with no answer. Raised by the clean-context reading of 2026-09-05.

**Content.**

```markdown
---
question: What are the conditions of bootstrap exit?
form: rule
cites:
  - id: commons.systems/disposition-graph/work-loop
    hash: 7d568f0ce07adf37623f69d140d547af54eb8241
  - id: commons.systems/disposition-graph/materialization
    hash: 14d4bc68bb3860cd5657b5fec088020e3dc8eae4
  - id: commons.systems/disposition-graph/review
    hash: 5b376ac3d4f02c470e7767fc1b2101bf0f3f1afe
  - id: commons.systems/disposition-graph/vocabulary-view
    hash: 861a710ed6a4903d9df8e4c68503fbb093e8d058
  - id: commons.systems/disposition-graph/attention
    hash: f03f75cced351fe59bae8dc6903326eeb5b16ffe
  - id: commons.systems/disposition-graph/alignment-order
    hash: 41c66b660af20cbd84ad6a0666db25466530ad7d
  - id: commons.systems/disposition-graph/transience
    hash: 22d7e322281a6951bdde89c2870745acfe0de3e6
under:
  - commons.systems/disposition-graph/what-acts-during-bootstrap
---

## Answer

The same gathering with `tier: global`, so the conditions are projected into
`.claude/rules/` beside the parent's rule and the session that rule points at
this node loads the text it is pointed at, instead of being told where to look.
```

### authority

Ratified. What this node fixes is when the record stops being provisional, which
is the moment every stopgap in it dates itself by; a wrong answer here declares
exit reachable while conditions the author set stand unmet, which is what the
draft it replaces did and what this draft did on its first reading. It is not
capture-shaped, since the conditions are other nodes' and this one only gathers
them, but being wrong is expensive and is not caught by reading the node, only by
following its citations; and it is irreversible, which is the limb that most
plainly holds and which the first reading of this fact left out: what the list
gates is the swap of `greenfield` with `main` and the pruning `materialization`'s
shim makes at it, a deletion and a swap, which is `class-recommendation`'s
irreversible limb in its own words. Moderate boldness: the escalation follows the record's
own rule and what rests on the AI is the judgment about the shim clauses. The case
against is on the fact.

## Account


Minted 2026-09-05 in the sitting that applied the clean-context reading of
`what-acts-during-bootstrap`, which kicked that node back to the maieutic stage
at strong strength. The maieutic work was done on the alignment thread and this
node is its product; it owes its own clean-context reading before the author
rules on it.

The four declaring loci were read at their text, not from the reading's report:
`work-loop`'s liquidation field, `materialization`'s liquidation field,
`review`'s instrument note and shim, and the author's words quoted on
`vocabulary-view`, `attention` and `alignment-order`. The circular limb was
confirmed by reading `work-loop`'s clause and `materialization`'s swap clause
together.

Open for the author: whether `work-loop`'s shim keeps its exit clauses or hands
them here and cites this node, which is the option
`exit-conditions-cited-not-carried` on `work-loop`, repointed the same day so that
its destination is this node and no longer the node that defines the term, and
which is `left-where-they-stand` on this fact seen from the other side; and whether
the ruling of the global tier is a condition, which no node declares and which the
withdrawn gloss implied.

### Manifest

- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Redrawn after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The second reading's kickback taken, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The third kickback taken, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-05, of 9fdaf700

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `gathered-and-cited`.

Findings:

- ## Answer, third paragraph, first sentence (line 95): "The author's words set four, and two of the four are declared a second time by `work-loop`'s shim below." Three of the four are, by this same answer's own text. Lines 114-118 say of the codification pair that it "is the author's condition on `attention` and `alignment-order` with a requirement added" and that "The author's words and this clause declare one condition, counted once"; the reduction paragraph at lines 165-169 then lists "three reductions, each ... one condition declared twice", of which the second direction, the drain and the codification are the three. The count is wrong by one, in the sentence that opens the enumeration, on a node whose last kickback was for a count. Suggested edit: "three of the four", and check the sentence against the reduction paragraph rather than against the shim's clause count.
- Frontmatter `cites`: five of the seven pins do not name the blob of the file they cite. In the disposition worktree at HEAD with a clean tree (`git status --porcelain` empty), `git hash-object` gives work-loop.md 6b76a28f (pinned 7d568f0c), materialization.md da241e98 (pinned 14d4bc68), review.md 5054faa1 (pinned 5b376ac3), attention.md fd053ec5 (pinned f03f75cc), transience.md 2d85632a (pinned 22d7e322); only vocabulary-view and alignment-order match. All seven were exact at 022448f5, the commit that landed this redraw, and were staled by a3e0ae10 and 0d8d47d6. No quotation is falsified -- I checked every quoted clause at its field and each is still exact -- but the answer's first paragraph offers the pins as what "make that promise checkable", and at the moment the node would go to the author five of them do not, which is the defect the third reading raised at one pin. Suggested edit: re-pin all seven immediately before the node is put to the author, and say in the answer or the account that a pin stales on any edit to the cited node and not only on an edit to the quoted field, so that a mismatch is not by itself evidence a quotation moved.
- ## Answer, the `materialization` paragraph (lines 147-155): the two limbs are quoted in the reverse of the field's order and then referred to by ordinal. The paragraph gives the coverage clause first and the swap clause second, then says "The second is marked a condition of the swap"; but materialization.md:66 holds the swap clause first and the coverage clause second, so a reader resolving "the second" at the field lands on the coverage clause, of which the sentence is false. This is the defect finding 8 of the last reading named on `work-loop`'s ordinals; the fix taken there (lines 110-112, "taken here in the field's own order and cited by their opening words rather than by an ordinal") was not applied here. Suggested edit: take materialization's limbs in the field's own order too, or drop "the second" and name the clause by its opening words.
- ## Facts, `#### conditions-derived-not-restated` (line 322): "`transience`'s own instrument note concedes that the flagging of a met condition is not yet materialized". The concession is in transience.md:83, the instrument `ref`; transience.md:84, the instrument `note`, asserts the opposite -- "a shim whose condition is met is flagged" -- and concedes nothing. The answer at line 192 was corrected to `ref`; this was not, so the node's two texts still disagree with each other about which field carries the concession, which is what finding 6 of the last reading named, and the ## Account's reply to it says "Both are corrected." Suggested edit: `ref` here as well, and correct the account's reply so it does not record a correction that was half made.
- ## Answer: one of the seven conditions is on the list by neither of the two rules the answer states, and carries no reason at all. The second paragraph promises "Two rules sort them, and they are applied to every clause alike", and every item is then given its ground -- the author's words, or `work-loop`'s rationale calling the batched validation "the bootstrap exit criteria", or a clause that puts itself at exit -- except the clause at lines 126-128, "every rule this project runs under is a node or a declared shim, dispatch selects from this graph, the alignment skill is the only path by which a node is recorded, and nothing live reads the legacy record", which is quoted and nothing more. No locus puts that clause at or before exit, and `work-loop`'s own rationale (work-loop.md:136) distinguishes within the very same field "all batched validation together with the bootstrap exit criteria", so membership in the field settles nothing. It is a load-bearing condition -- it would require that dispatch select from this graph and that nothing live read the legacy record before exit -- and it is precisely the item the rival `shim-liquidation-is-never-a-condition` strikes, so the one item that option takes unopposed is the one the answer never argues for. Suggested edit: state the ground on which this clause is a condition of exit, or state membership in the reconciliation shim's liquidation as a third sorting rule and defend it, or strike the clause and carry six.
- ## Facts, `#### shim-liquidation-is-never-a-condition` (lines 294-298): the premise defeats the clause the option keeps. "No clause of a shim's liquidation is a condition of exit, whatever the shim says: a shim liquidates when the thing it stands in for exists, which is its own event and not the record's, so the conditions of exit are the author's words on four nodes and `materialization`'s coverage limb, which its own clause marks a condition of exit and not of the swap." The coverage limb is a clause of a shim's liquidation (materialization.md:66) kept on the strength of what that shim says, which the first half of the sentence says is never enough. The list the option names is explicit, so the author is not left guessing what they would rule for, but the reason offered for it contradicts itself inside one sentence. Suggested edit: state the premise as the narrower one the option actually applies -- a liquidation clause is a condition of exit only where the clause itself says so, a shim's mere liquidating being its own event -- and keep the coverage limb on that ground.
- Frontmatter `depends`: `tier` is not declared, though the option `conditions-projected-as-a-rule` turns on it and says so in its own prose -- "nothing above settles it either, `tier` standing at the maieutic stage with no answer" (line 339). tier.md:2 asks "What gives a rule its scope?" at stage maieutic, and a ruling there would move this node's recommendation between `gathered-and-cited` and `conditions-projected-as-a-rule`, which is the test the last reading applied when it had `transience` added. Suggested edit: add `commons.systems/disposition-graph/tier` to `depends`, or say in the last paragraph why the choice of where the conditions are read does not wait on it.
- ## Answer, eighth paragraph (line 157): "`review`'s code-review shim declares no condition of its own." True of the shim, but `review`'s standing answer at review.md:91 declares one the list does not carry: "During bootstrap, review is required once the disposition a landing materializes is ratified, and for everything before exit; until then functional validation, tests and use, suffices." That is wider than item five, which is scoped to "every landing under the reconciliation shim", and it is `transience`'s own worked example, which this answer quotes as "Review every landing before exit" and not as the shim's landings. The paragraph surveys `review`'s shim fields and never its answer, so the reader cannot tell whether the narrower form was chosen or the wider one was missed. Suggested edit: either widen item five to `review`'s own words and cite the answer beside the artifact clause, or say that the two are one condition on the same landings because during bootstrap every implementation landing is made under the reconciliation shim, and why the narrower wording governs.

On the facts and what they recommend: Two facts, both well formed. `answer` recommends `gathered-and-cited` with `stands: gathered-and-cited` -- so the fence is closed and no unstated choice is acting -- at high boldness, which is right for a list assembled by the AI's own reading of eleven clauses across six nodes and which the findings above bear out. `authority` recommends `ratified` at moderate boldness with a `### authority` reading that names expensive and irreversible and argues capture-shaped away; the irreversible limb holds plainly (the list gates the swap and the pruning made at it) and moderate is the right boldness, since the escalation follows `class-recommendation`'s own rule and only the shim-clause judgment rests on the AI.

On the viability of the options: Every option on the answer fact is viable and undominated as drawn -- `left-where-they-stand` on its own terms, `global-tier-ruled-is-a-condition` now that its prose stops arguing itself off the list, `shim-liquidation-is-never-a-condition` as the shortest defensible list (subject to the premise defect above), `conditions-derived-not-restated` and `conditions-projected-as-a-rule` as the two shapes the case against points at -- and `minted-here` is correctly passed, its reason checking against `authority`'s rule that a node no ruling reaches confers nothing. One viable option is missing, the middle position that the answer's own two rules produce when applied as it promises: the list is the author's words on the four nodes plus only those liquidation clauses the record itself puts at or before exit -- `materialization`'s coverage limb, which its clause marks "a condition of bootstrap exit and not of the swap alone", `materialization`'s survivors limb, which gates the swap, and `work-loop`'s batched validation, which that node's rationale calls "the bootstrap exit criteria" and the author's words "bootstrap/shim exit criteria" -- so that `work-loop`'s "every rule this project runs under is a node or a declared shim..." clause falls, no locus having put it at exit; against it, that it strikes a clause of the very shim bootstrap runs on, and the author may hold that the reconciliation shim's whole liquidation is exit's by construction.

Strongest counter-argument (strong): The strongest argument against is still that this node stores a derived view as prose, and the fourth reading is the first to see the mechanism fail in the way that argument predicts. The pins are the answer's own guarantee that the copy cannot drift -- "the `cites` field carries the pins that make that promise checkable" -- and five of the seven were stale within two commits of the redraw landing, both of them made by the same thread that wrote the pins, neither touching any quoted field. So the mechanism does not fail by a quotation going bad; it fails by producing an alarm that means nothing, since a stale pin here signals only that the cited node was edited somewhere. A reader who follows five pins, finds five mismatches, and finds every quotation intact learns to stop following pins, and that is exactly when the second home goes unchecked -- the harm the node exists to prevent, arrived at through the instrument meant to prevent it. This reading's other findings are the same shape at smaller scale: an ordinal inverted against its field, a field misattributed in one text and corrected in the other, a count contradicted eighteen lines below itself. None is hard to fix; that they recur across four readings, each fix landing where the reading pointed and the next reading finding the same class of slip elsewhere, is the evidence that the copy is the problem and not the copyist -- which is `conditions-derived-not-restated`'s case, and it is stronger now than when that option was raised.

The session's reply: All eight findings are taken, each validated at its locus on the main thread and none delegated.

The count is wrong and the reading has it exactly: the codification is the third of the four author's-words conditions that `work-loop`'s shim declares a second time, and the answer's own reduction paragraph says so eighteen lines below the sentence that miscounts. Five of the seven pins are stale — `git hash-object` at a clean HEAD gives work-loop 6b76a28f against 7d568f0c, materialization da241e98 against 14d4bc68, review 5054faa1 against 5b376ac3, attention fd053ec5 against f03f75cc, transience 2d85632a against 22d7e322, with only vocabulary-view and alignment-order matching — and no quotation is falsified, which is the point the answer must state: a pin stales on any edit to the cited node and not only on an edit to the quoted field. `materialization`'s field carries the swap clause first and the coverage clause second, so "the second" resolves at the field to the clause of which the sentence is false; the fix `work-loop`'s ordinals got in the last round is owed here too. The `ref`/`note` correction was half made: line 192 says `ref` and line 322 still says `note`, and the account's reply to the last round claims both were corrected.

The three substantive findings are the ones that make this a kickback and not an amendment. The clause at lines 126-128 is on the list by neither sorting rule and carries no ground at all, and `work-loop`'s own `#### split-the-shim` distinguishes "all batched validation together with the bootstrap exit criteria" inside the very field it sits in, so membership settles nothing — and it is precisely the item `shim-liquidation-is-never-a-condition` strikes, so the one clause that rival takes unopposed is the one the answer never argues for. That option's own premise then defeats the clause it keeps: no clause of a shim's liquidation is a condition of exit "whatever the shim says", and `materialization`'s coverage limb is kept on the strength of what that shim says. And `review`'s standing answer declares "review is required ... for everything before exit", which is wider than item five's scoping to landings under the reconciliation shim; the paragraph surveys that node's shim fields and never its answer, so the reader cannot tell which was chosen. `tier` belongs in `depends`: `conditions-projected-as-a-rule` says in its own prose that nothing above settles where the conditions are read because `tier` stands at maieutic with no answer.

The redraw is owed at the maieutic stage and this sitting does not take it. This is the fourth reading of this node, and each of the four has found the same class of defect — a derived list stored as prose drifting from the fields it copies between one landing and the next — which is the reading's own case against, and `prose-and-structure`'s rule that prose carries never a list a field also carries. Four readings of one question is evidence about the shape and not only about the draft, so what goes to the author is the question the evidence raises: whether this node is a gathering to be ratified at all, or `conditions-derived-not-restated`, or `left-where-they-stand`. Redrawing a fifth time inside this sitting would spend another reading on a shape the author has not yet chosen. The mechanical five and the substantive three are recorded here so the redraw, whenever it is taken, starts from them and not from a re-reading.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/bootstrap-exit-conditions stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `gathered-and-cited`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `left-where-they-stand`, `minted-here`, `global-tier-ruled-is-a-condition`, `shim-liquidation-is-never-a-condition`, `conditions-derived-not-restated`, `conditions-projected-as-a-rule`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `9fdaf700285363f7bd41256bdf6246b58933a875` is re-computed for the encoding as `4c2b49fa3b6d838aec346d4eb834c8daf2520611`; nothing it read changed.
