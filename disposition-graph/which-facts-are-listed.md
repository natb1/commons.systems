---
question: Which facts does the alignment page list on a node?
stage: ruling
form: rule
facts:
  - name: answer
    options:
      - name: all-four-listed-two-derived
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/28
      - name: facts-the-node-carries
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-05"
        status: passed
        reason: "the author's words of 2026-09-04 strike it by name: the list is to hold every fact even where options have not been established"
      - name: every-node-carries-four-facts
        source: ai
        ref: "2026-09-07"
      - name: derived-rows-ask-and-take-a-ruling
        source: ai
        ref: "2026-09-07"
      - name: derived-rows-on-every-node
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "a node carrying no facts owes no ruling at all, so four rows saying nothing is asked replace one sentence that already says the whole of it"
      - name: a-line-naming-the-facts-not-asked
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "it is the fold the author's words strike, written as one sentence, and it puts two reserved names in text the page carries for itself"
      - name: instrumentation-listed-as-a-fifth
        source: author
        ref: "2026-09-04"
        status: passed
        reason: "whether the reserved names are four or five is the dialogue node's question, where the author's same words are already the option instrumentation-is-a-fact"
        supports:
          - words/2026-09-04/28
      - name: topology-asked-persistence-derived
        source: review
        ref: "2026-09-07"
      - name: topology-radio-waits-on-the-delegations-ruling
        source: commons.systems/disposition-graph/graph-topology
        ref: "2026-09-07"
    recommends: all-four-listed-two-derived
    boldness: moderate
    against: "On 123 of the 134 nodes that carry facts the author will read two decisions and two rows that say nothing is proposed, and a row that asks nothing is apparatus in the one column the parent reserves for what the ruling asks. The author's directive was to list all facts; what this answer lists on almost every node is two facts and two sentences reporting that the record has nothing to ask, which is the fold struck and its silence reinstated under a heading."
  - name: authority
    options:
      - name: ratified
        source: ai
        ref: "2026-09-07"
      - name: delegated
        source: ai
        ref: "2026-09-07"
      - name: deferred
        source: ai
        ref: "2026-09-07"
    recommends: ratified
    boldness: low
    against: "This is which rows a projector prints, undone by re-projecting the page, and the author has already said in their own words that they want all of them; ratifying it spends their scarcest act on a sentence that transcribes them and freezes the derived row's form against every later reading of it. Deferred would let the rows act while the question the answer defers to, how many names the record reserves, is still open on the dialogue node."
review:
  verdict: forward
  strength: none
  date: 2026-09-07
  of: 128aad9b132a46a1b691b8bc3659e1374509daa1
  commit: f146f8f44b295c64e47a13bff338748035183d87
  survey:
    date: 2026-09-07
    of: 128aad9b132a46a1b691b8bc3659e1374509daa1
under:
  - commons.systems/disposition-graph/alignment-page
---

## Facts

### answer

Recommended because it is the author's directive executed where they left it to
the AI to execute, and because the distinction it turns on is the record's own.
The listing is theirs, in the words "list all facts - even if options have not yet
been established". The derived row is `dialogue`'s sentence that the conditional
pair is otherwise derived and asks nothing, printed rather than left implicit.

What rests on the AI is two things and they are named as the AI's. The choice of
the page over the encoding, which the author's "Either way" left open and which
this answer takes on the ground that a derived fact has no second home. And the
form of the two rows: that the persistence row states what the record derives,
that the topology row states that no prune is proposed and where one would be
raised, that both say where a proposal would be made, and that neither takes a
ruling. Boldness moderate, and the second is why: a
row that lists a decision and refuses to take it is a shape the record has not
used before, and whether it reads as completeness or as a fold with a caption is
what the author is best placed to say.

#### all-four-listed-two-derived

Every fact the record reserves, on every node that carries facts at all, in the
reserved order, and none folded.

**AI support.** The author, 2026-09-04, on the alignment page: "there are only 2 facts listed for
commons.systems/public/agency - the answer prose and the authority. Is that
because dispositions only have two facts (and all other structured data has been
moved under fact options) or does agency node not yet have options for other
facts because dialogue is not at confirmation phase yet? I expect instrumentation
(eg.) would be a fact. Either way, list all facts - even if options have not yet
been established."

Their question is answered by the record: the page shows two because two are
recorded, and the other two are recorded only where a prune or a change of shape
is proposed. Their directive is what this answer implements, and it is the clause
"even if options have not yet been established" that fixes the form: a fact
listed where no option exists is a fact listed and not asked, which is a row that
reports rather than a row that decides.

"Either way" is the clause that chooses the end. The author put the amendment on
the page or on the encoding indifferently, and this answer takes the page. The
reason is not what either end would cost, which bears on nothing: it is that the
encoding end would write `keep` on 123 nodes where nobody has proposed a prune,
and a derived value stored in 123 places is the second home
`commons.systems/disposition-graph/codd-update-anomaly` names, whose reading of
this record is that "What has a shape is recorded in the field that has it and
projected from there"
(`disposition/disposition-graph/codd-update-anomaly.md:54`). The record's reason
for making the pair conditional says the same thing from the other side, that a
choice nobody has raised is not a candidate the record lists. The page is where a
derived fact is shown, and the field is where a decided one is kept.

What the answer beat is on the fact: `facts-the-node-carries`, the incumbent,
which the author's words strike by name; `every-node-carries-four-facts`, the
encoding end; and `derived-rows-ask-and-take-a-ruling`, which is this answer with
the derived rows made rulable, and which is the strongest thing the author might
take instead.

**AI divergence.** On 123 of the 134 nodes that carry facts the author will read two decisions and two rows that say nothing is proposed, and a row that asks nothing is apparatus in the one column the parent reserves for what the ruling asks. The author's directive was to list all facts; what this answer lists on almost every node is two facts and two sentences reporting that the record has nothing to ask, which is the fold struck and its silence reinstated under a heading.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Every fact the record reserves, on every node that carries facts at all, in the
reserved order, and none folded. Four names are reserved today, `answer`,
`authority`, `topology` and `persistence`, which is `FACT_NAMES` in
`packages/disposition/read.mjs`, and the page lists whichever names the
record reserves, so a fifth added by a ruling elsewhere appears here without a
ruling here.

Two of the four the node carries and two it usually does not, and the page shows
them differently because the record holds them differently. A fact the node
carries is a decision the ruling asks: it carries its options, the recommendation
among them and its radio, exactly as the parent's answer describes. A fact the
node does not carry is listed as a derived row, which is the name of the shape:
the row carries no option, no radio and no control, at any stage. It is a
read-only indicator, which is what the author's rule of 2026-09-06 leaves the
page free to show of a movement it is not running, and it is not a decision the
ruling asks.

What the two rows say is not the same, because the record holds the two absences
differently, and only one of them is a derivation. The persistence row states what
the record derives: `dialogue` enumerates what is derived and names "the
persistence where no fact carries it", so where no persistence fact stands the
shape is derived from the node and the row prints it. The topology row derives
nothing and does not say the node is kept. What the absence of a topology fact
holds is that no prune has been proposed, which is `dialogue`'s own reason for
making the pair conditional, "a choice nobody has raised is not a candidate the
record lists"; so the row says that no prune is proposed on this node and where
one would be raised, and stops there. Writing `keep` on that row would be the
page inventing a fact, which is the one thing this answer promises never to do.

That division is the record's own and not the page's invention. Of `persistence`
the `dialogue` node says it is "present only where the recommendation would
change its shape and otherwise derived from the shape and asking nothing", so a
derived row prints a fact the record already derives rather than one the page
makes up; and of the conditional pair, that "a prune and a change of shape are
decided only where one is proposed, and a choice nobody has raised is not a
candidate the record lists". A derived row lists no candidate. It says what is
derived, and where a candidate would be raised. That text is `dialogue`'s
recommended text, which no ruling has reached, and this answer reads it as
direction and not as doctrine; the rule stated here holds whichever way that node
rules, because the page lists what the record reserves and derives what the
record derives, and neither clause needs `dialogue` to have ruled. Nothing is
entered in `depends` for that reason.

One text reads the other way and is quoted rather than passed over. `unanswered`
says: "A response is given on a node, or on one of the decisions that node's
ruling asks, which are its facts: the answer, the authority class a ruling would
confer, the node's existence, and its persistence where the recommendation would
change its shape." It conditions persistence in terms and leaves topology
unconditioned, so on that text the topology decision is one a ruling asks
wherever a ruling can be given, and a row that takes no ruling declines to ask it.
The page still reports rather than asks, on the author's own rule of 2026-09-06:
"The scope of alignment artifact is limited to final confirmation and
previews/read only indicators of other phases of the dialogue. All other
information from the author is done via the `/align` session interview." A prune
nobody has proposed is not a recommendation to confirm, so a live radio there
would collect a proposal, which is the one thing that rule sends to the interview;
and the author's standing disposition of the same day gives the prune of an
unratified node to the AI under the general delegation of graph topology, with
two bounds, so on 123 nodes the page would be asking the author to confirm a
decision they have said they do not want to be asked about. Where a prune is
proposed the node carries a topology fact, and then the row is the live one the
parent's answer describes. The asymmetry between the two texts is real and is not
resolved here: `unanswered`'s sentence conditions one of the pair and not the
other, and an option conditioning topology as persistence is conditioned belongs
on that node, where its answer is.

Where the proposal would be made is said on the row, because a row that reports a
decision is not being asked and does not say where it would be is the fold the
author's words strike wearing a different shape. A prune or a change of shape is
proposed in the `/align` interview, which is where the author's rule of
2026-09-06 sends everything but the confirmation, and the stage chip's two
controls are the route the parent's answer already names.

What the page never does is invent a fact. A node carrying no facts at all
carries no derived rows either: it stands at the periagogic or the maieutic
stage, where nothing has been proposed and no ruling is owed, and the column says
that nothing is proposed yet, which is the parent's clause and is untouched here.
The derived rows exist because a node with facts has a ruling to give and the
record reserves four decisions inside it; where there is no ruling there is
nothing for them to complete.

The caption above the list changes with the list. Today it reads "What this
ruling asks", which is `FACTS_LBL` in `packages/disposition/project.mjs`, and
which is false of a derived row; under this answer the caption names the decisions the ruling covers,
and each derived row says on its own face that it asks nothing.

What this answer does not decide is how many names the record reserves. The
author's expectation that instrumentation would be a fact is `dialogue`'s
question, where their same words of 2026-09-04 are already recorded as the option
`instrumentation-is-a-fact` on that node's answer fact, against which that node
holds that the instrument is a field of the node and not a decision the author
rules on separately. This answer adds nothing to that and takes whatever it
leaves reserved.

The size of what the author saw is the size of it everywhere. Measured over the
141 node files of both graphs at graph commit `5da05bc4`: 134 carry an `answer`
fact and the same 134 carry an `authority` fact; 6 carry `topology`; 5 carry
`persistence`; and no node carries both of the conditional pair. So on 123 of the
134 nodes that carry facts the page today shows two rows where the record
reserves four decisions, which is what `commons.systems/public/agency` showed the
author and is not particular to it.
```

#### facts-the-node-carries

Everything the recommended option says, with the page listing only the facts the
node carries and inventing nothing, which is what `renderFacts` does today
(`packages/disposition/project.mjs`) and what the parent's clause
"every one the node carries and none folded" says. Passed over: the author's
words of 2026-09-04 strike it by name, and the fold they struck is not the only
way a decision goes unseen. On 123 of the 134 nodes that carry facts this option
shows two of the four decisions a ruling covers and says nothing about the other
two, which is the state the author read on `commons.systems/public/agency` and
asked about.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the page listing only the facts the
node carries and inventing nothing, which is what `renderFacts` does today
(`packages/disposition/project.mjs`) and what the parent's clause
"every one the node carries and none folded" says. Passed over: the author's
words of 2026-09-04 strike it by name, and the fold they struck is not the only
way a decision goes unseen. On 123 of the 134 nodes that carry facts this option
shows two of the four decisions a ruling covers and says nothing about the other
two, which is the state the author read on `commons.systems/public/agency` and
asked about.
```

#### every-node-carries-four-facts

The encoding end: `dialogue`'s sentence making `topology` and `persistence`
conditional is amended, every node that carries facts carries four, and the page
then lists what the node carries with no derivation at all.

**AI support.** For it: this question
closes with nothing derived, the reader and the validator hold the whole shape,
and a fact the author can see is a fact the author can rule on wherever they meet
it. Viable and not adopted. It writes `keep` on 123 nodes where no prune is
proposed, which is a fact stored in a second place and derivable from the first,
the failure `codd-update-anomaly` names; it amends another node's answer to
settle a question about this page, where the page can answer it alone; and
`dialogue`'s own reason for the conditional pair, that a choice nobody has raised
is not a candidate the record lists, is a reason this option has to overturn and
does not address.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

The encoding end: `dialogue`'s sentence making `topology` and `persistence`
conditional is amended, every node that carries facts carries four, and the page
then lists what the node carries with no derivation at all.
```

#### derived-rows-ask-and-take-a-ruling

Everything the recommended option says, with the two derived rows carrying their
options and a live radio at the ruling stage, so the author may propose a prune or
a change of shape from the page.

**AI support.** For it: the author's directive says list all
facts, and a listed fact the author cannot rule on is half a listing; the author
is already reading the node, which is the moment a prune occurs to a reader; and
`topology` exists precisely so a prune is recorded as a fact and not as an option
of a special shape. Viable and not adopted: the page's scope under the author's
rule of 2026-09-06 is the final confirmation of what is recommended, and a prune
nobody has proposed is not a recommendation to confirm, so the radio would collect
a proposal rather than a confirmation, which is the one thing that rule sends to
the interview. It is the option to take if the author reads their own directive as
reaching what the page asks and not only what it shows.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the two derived rows carrying their
options and a live radio at the ruling stage, so the author may propose a prune or
a change of shape from the page.
```

#### derived-rows-on-every-node

Everything the recommended option says, with the derived rows printed on nodes
carrying no facts as well, so that every item on the page shows four rows. Passed
over: a node with no facts is at the periagogic or the maieutic stage and owes no
ruling at all, so four rows reporting that nothing is asked replace one sentence
that already says the whole of it, and the parent's clause that such a node
"offers nothing invented" is the sentence they would replace.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the derived rows printed on nodes
carrying no facts as well, so that every item on the page shows four rows. Passed
over: a node with no facts is at the periagogic or the maieutic stage and owes no
ruling at all, so four rows reporting that nothing is asked replace one sentence
that already says the whole of it, and the parent's clause that such a node
"offers nothing invented" is the sentence they would replace.
```

#### a-line-naming-the-facts-not-asked

Everything the recommended option says, with one line beneath the facts the node
carries naming the decisions the ruling does not ask, instead of two rows. Passed
over: it is the fold the author's words strike, written as a sentence rather than
as a hidden row, and it says less than the rows do, since a name without what is
derived for it tells the author that a decision exists and not what the record
holds on it. It also puts the two reserved names into text the page carries for
itself, which the parent's answer refuses as a rule no node projects.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with one line beneath the facts the node
carries naming the decisions the ruling does not ask, instead of two rows. Passed
over: it is the fold the author's words strike, written as a sentence rather than
as a hidden row, and it says less than the rows do, since a name without what is
derived for it tells the author that a decision exists and not what the record
holds on it. It also puts the two reserved names into text the page carries for
itself, which the parent's answer refuses as a rule no node projects.
```

#### instrumentation-listed-as-a-fifth

Everything the recommended option says, with `instrumentation` listed as a fifth
row, on the author's expectation of 2026-09-04 that it would be a fact. Passed
over here and live elsewhere: whether the reserved names are four or five is
`commons.systems/disposition-graph/dialogue`'s question, where the author's same
words are already recorded as the option `instrumentation-is-a-fact` on that
node's answer fact. This answer lists whatever that ruling leaves reserved, so a
ruling there reaches this page with no ruling here, and listing a fifth name the
record does not reserve would be the page deciding the encoding.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with `instrumentation` listed as a fifth
row, on the author's expectation of 2026-09-04 that it would be a fact. Passed
over here and live elsewhere: whether the reserved names are four or five is
`commons.systems/disposition-graph/dialogue`'s question, where the author's same
words are already recorded as the option `instrumentation-is-a-fact` on that
node's answer fact. This answer lists whatever that ruling leaves reserved, so a
ruling there reaches this page with no ruling here, and listing a fifth name the
record does not reserve would be the page deciding the encoding.
```

#### topology-asked-persistence-derived

Everything the recommended option says, with the two conditional facts split
rather than treated as a pair: the persistence row reports what the record
actually derives from the node's shape, and the topology row carries `keep` and
`prune` as a live decision on every node that carries facts.

**AI support.** For it: it takes the
author's directive whole where the record backs it, since `unanswered` names the
node's existence among the decisions a ruling asks with no condition on it and
`dialogue`'s derived enumeration names persistence alone; a prune is the one
decision a reader of a node is best placed to raise at the moment they read it;
`topology` exists precisely so that a prune is recorded as a fact; and it costs
one live radio on 123 nodes rather than 246. Viable and not adopted: a live
topology radio on 123 nodes asks a decision no one has recommended, and the
author's rule of 2026-09-06 keeps that off the page, the page's scope being the
final confirmation of what is recommended and every other movement's preview.
The same day's standing disposition gives the prune of an unratified node to the
AI under the general delegation of graph topology, so on those nodes the radio
would ask the author to confirm what they have said they do not want to be asked
about.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with the two conditional facts split
rather than treated as a pair: the persistence row reports what the record
actually derives from the node's shape, and the topology row carries `keep` and
`prune` as a live decision on every node that carries facts.
```

#### topology-radio-waits-on-the-delegations-ruling

Everything the recommended option says, with one of its grounds dated: the page's
reason for deriving the topology row rather than asking it holds only from the
ruling of `delegated` on `commons.systems/disposition-graph/graph-topology`'s
authority fact; until then the author has not been asked to delegate the prune,
and the row is what asks it. Raised on `graph-topology`, whose recommended answer
holds that the delegation acts from that ruling and not before, and which names
this node's answer among the places that already read the delegation as
conferred. Viable and not adopted: the author's rule of 2026-09-06 keeps a
proposal nobody has made off the page whichever way `graph-topology` is ruled,
and that ground does not wait on the ruling; what the ruling settles is whether
the prune is the AI's, not whether the page asks it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Which facts does the alignment page list on a node?
form: rule
under:
  - commons.systems/disposition-graph/alignment-page
---

## Answer

Everything the recommended option says, with one of its grounds dated: the page's
reason for deriving the topology row rather than asking it holds only from the
ruling of `delegated` on `commons.systems/disposition-graph/graph-topology`'s
authority fact; until then the author has not been asked to delegate the prune,
and the row is what asks it. Raised on `graph-topology`, whose recommended answer
holds that the delegation acts from that ruling and not before, and which names
this node's answer among the places that already read the delegation as
conferred. Viable and not adopted: the author's rule of 2026-09-06 keeps a
proposal nobody has made off the page whichever way `graph-topology` is ruled,
and that ground does not wait on the ruling; what the ruling settles is whether
the prune is the AI's, not whether the page asks it.
```

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met and the reading says so. Not expensive: the answer is one
projector function and a caption, and nothing is built on it. Not irreversible:
no node's data changes under it, the derived rows are computed at projection
time, and a wrong answer is undone by re-projecting the page.

The capture-shaped limb is met on the one thing this answer decides: which of the
decisions a ruling covers the author is shown at the moment they rule. A page
listing two of four has had the recommending party decide that the other two are
not being put, and the party whose recommendation the ruling covers is the party
deciding what the decider is asked about. That is the shape the parent's own
authority reading names, where the fold's removal is described as taking away
"the page's one mechanism for deciding what the author sees"; this answer decides
what replaces it for the two facts the fold never reached, so the limb the parent
found is the limb here, narrowed to this node's object.

Low boldness: the limb is the parent's recorded reading applied to a stated fact,
and the fact is the author's own finding of 2026-09-04 measured again at
`5da05bc4`.

Against it: this is which rows a projector prints, and the author has already
given the directive in their own words, so ratification spends their scarcest act
on a transcription and freezes the derived row's form; deferred would let the
rows act while the reserved-names question stays open on `dialogue`, which is
where the contested part of this actually lives.

## Account


What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence that opens the facts, "Then the facts, every one the node carries and none folded: its answer, whose options are the candidate answers to its question, the one that stands among them where one stands; the authority class a confirmation would confer; its existence; and its persistence where the recommendation would change its shape." That sentence enumerates four names and then binds the page to what the node carries, and the two halves come apart on `commons.systems/public/agency`, which carries two. The author's directive, list all facts even where options have not been established, is not answered by the recommended text and is not met by removing a fold, since nothing is folded here: the page shows two because two are recorded. So the amendment is on this page and on the encoding at once, and the sitting has to choose which end takes it. On `commons.systems/disposition-graph/dialogue` the recommended text says that "A node that carries facts at all carries the answer fact and the authority fact", that `existence` and `persistence` are "present only where the recommendation would change its shape", and that this is "a decision and not an accident of the encoding: every ruling decides a class, so the class is asked wherever a ruling can be given, while a prune and a change of shape are decided only where one is proposed, and a choice nobody has raised is not a candidate the record lists". Either the page renders the four reserved names whatever the node carries, deriving the two conditional rows and their default choices, or that sentence of `dialogue` moves and every staged node carries four facts. The neighbouring clause "A node that carries no facts offers what its stage asks and nothing invented" is the same question asked of a node with none. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `renderFacts` and `renderFact`, which map over `n.facts` and invent nothing, and, if the encoding end is taken, on the reader `packages/disposition/read.mjs` and on `packages/disposition/validate.mjs`, which hold the reserved four and the conditions on them.

Cascades: `commons.systems/disposition-graph/dialogue`, the facts model and the validator checks its answer names; `commons.systems/disposition-graph/unanswered`, whose answer says a response is given "on one of the decisions that node's ruling asks, which are its facts: the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape"; `commons.systems/disposition-graph/instruments`, which the author's expectation that instrumentation would be a fact reaches, and which is carried as a probe on `dialogue` rather than as a question here; `commons.systems/disposition-graph/authority`, on the class read off the rulings; and `commons.systems/disposition-graph/prose-and-structure`, on what the page may recover from prose when the structure holds nothing.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at `commons.systems/public/agency`, the node file behind it, the recommended text of `dialogue` on the reserved four, and `renderFacts` in the projector, read before anything is changed.

### Manifest

- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The maieutic movement, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 7c9f6943, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The reading of 2026-09-07 applied, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 49cbcabd

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `all-four-listed-two-derived`.

Findings:


On the facts and what they recommend: The diff adds one new viable option to the answer fact, `topology-asked-persistence-derived` (source review, ref 2026-09-07), without changing `recommends` (still `all-four-listed-two-derived`), boldness (still moderate), or `stands`. The authority fact is unchanged (`recommends: ratified`, boldness low); a `review` block is newly recorded in frontmatter carrying the previous reading's verdict, strength, pin and `against`.

On the viability of the options: Every option remains viable. The new option `topology-asked-persistence-derived` is recorded viable-and-not-adopted with the reasoning the previous reading itself supplied (a live existence radio on 123 nodes would ask a decision no one has recommended, which the author's 2026-09-06 scope rule keeps off the page), which I hold sound; I verified the quoted rule against `disposition/disposition-graph/alignment-page.md:315` and it is exact.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 49cbcabd

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The answer finds a real asymmetry between its rule and another node's and then leaves it where it found it: "an option conditioning existence as persistence is conditioned belongs on that node, where its answer is", and unanswered carries no such option, names this node nowhere, and is not in this node's depends. So the one standing text that reads the other way — unanswered's sentence naming the node's existence among the decisions a ruling asks, unconditioned — is quoted rather than answered, and the author meets it at no row. A ruling here settles the page against a sentence that will still stand after it.

### Frontier finding, 2026-09-07

Kind: coverage.

which-facts-are-listed identifies a standing text that reads against its answer, says where the repair belongs, and the repair is recorded nowhere. Its answer reads "The asymmetry between the two texts is real and is not resolved here: `unanswered`'s sentence conditions one of the pair and not the other, and an option conditioning existence as persistence is conditioned belongs on that node, where its answer is", and its account repeats it. unanswered's file names which-facts-are-listed at no locus and carries no such option; its standing answer still reads that a response is given on "the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape", conditioning one of the pair and not the other. So a decision the record has identified as owed to one node is answered by no node at all.

Also named: commons.systems/disposition-graph/unanswered.

Proposed: unanswered is the survivor and the home: the option conditioning `existence` as `persistence` is conditioned is recorded on its answer fact, sourced to which-facts-are-listed, so the author rules the asymmetry once at the node whose sentence carries it. which-facts-are-listed's answer stands as written, since it declines the question deliberately and says so.

Recorded as an option on commons.systems/disposition-graph/unanswered's answer fact: `topology-conditioned-as-persistence-is` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/which-facts-are-listed stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `all-four-listed-two-derived`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-04/28, referenced by 2 options the entry's own date names; and `stands` left the answer fact. The record wrote no text of its own for `facts-the-node-carries`, `every-node-carries-four-facts`, `derived-rows-ask-and-take-a-ruling`, `derived-rows-on-every-node`, `a-line-naming-the-facts-not-asked`, `instrumentation-listed-as-a-fifth`, `topology-asked-persistence-derived`, `topology-radio-waits-on-the-delegations-ruling`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `49cbcabd7a9eed31b29063d6b2c11d46a17fda10` is re-computed for the encoding as `a1dee4d80854ece8402ff2b1ee82740a88ecd574`; nothing it read changed. The survey's pin `49cbcabd7a9eed31b29063d6b2c11d46a17fda10` is re-computed for the encoding as `a1dee4d80854ece8402ff2b1ee82740a88ecd574`; nothing it read changed.
### The reserved names sentence follows the rename, 2026-09-08

The answer names the four reserved fact names and points at the reader as the
one place the list lives. The third of them is now `topology`, renamed with the
fact under `commons.systems/disposition-graph/graph-topology`'s recommended
answer and the author's grant of 2026-09-08. Nothing else in the sentence moves:
the count is still four, and the reader is still the single home of the list, so
this node still says where to look rather than keeping a second copy.
