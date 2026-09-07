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
      - name: existence-asked-persistence-derived
        source: review
        ref: "2026-09-07"
    recommends: all-four-listed-two-derived
    boldness: moderate
    against: "On 123 of the 134 nodes that carry facts the author will read two decisions and two rows that say nothing is proposed, and a row that asks nothing is apparatus in the one column the parent reserves for what the ruling asks. The author's directive was to list all facts; what this answer lists on almost every node is two facts and two sentences reporting that the record has nothing to ask, which is the fold struck and its silence reinstated under a heading."
    stands: all-four-listed-two-derived
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
  of: 49cbcabd7a9eed31b29063d6b2c11d46a17fda10
  commit: f146f8f44b295c64e47a13bff338748035183d87
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - there are only 2 facts listed for commons.systems/public/agency - the answer prose and the authority. Is that because dispositions only have two facts (and all other structured data has been moved under fact options) or does agency node not yet have options for other facts because dialogue is not at confirmation phase yet? I expect instrumentation (eg.) would be a fact. Either way, list all facts - even if options have not yet been established.

## Answer

Every fact the record reserves, on every node that carries facts at all, in the
reserved order, and none folded. Four names are reserved today, `answer`,
`authority`, `existence` and `persistence`, which is `FACT_NAMES` in
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
shape is derived from the node and the row prints it. The existence row derives
nothing and does not say the node is kept. What the absence of an existence fact
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
change its shape." It conditions persistence in terms and leaves existence
unconditioned, so on that text the existence decision is one a ruling asks
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
proposed the node carries an existence fact, and then the row is the live one the
parent's answer describes. The asymmetry between the two texts is real and is not
resolved here: `unanswered`'s sentence conditions one of the pair and not the
other, and an option conditioning existence as persistence is conditioned belongs
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
fact and the same 134 carry an `authority` fact; 6 carry `existence`; 5 carry
`persistence`; and no node carries both of the conditional pair. So on 123 of the
134 nodes that carry facts the page today shows two rows where the record
reserves four decisions, which is what `commons.systems/public/agency` showed the
author and is not particular to it.

## Rationale

The author, 2026-09-04, on the alignment page: "there are only 2 facts listed for
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
that the existence row states that no prune is proposed and where one would be
raised, that both say where a proposal would be made, and that neither takes a
ruling. Boldness moderate, and the second is why: a
row that lists a decision and refuses to take it is a shape the record has not
used before, and whether it reads as completeness or as a fold with a caption is
what the author is best placed to say.

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

#### every-node-carries-four-facts

The encoding end: `dialogue`'s sentence making `existence` and `persistence`
conditional is amended, every node that carries facts carries four, and the page
then lists what the node carries with no derivation at all. For it: this question
closes with nothing derived, the reader and the validator hold the whole shape,
and a fact the author can see is a fact the author can rule on wherever they meet
it. Viable and not adopted. It writes `keep` on 123 nodes where no prune is
proposed, which is a fact stored in a second place and derivable from the first,
the failure `codd-update-anomaly` names; it amends another node's answer to
settle a question about this page, where the page can answer it alone; and
`dialogue`'s own reason for the conditional pair, that a choice nobody has raised
is not a candidate the record lists, is a reason this option has to overturn and
does not address.

#### derived-rows-ask-and-take-a-ruling

Everything the recommended option says, with the two derived rows carrying their
options and a live radio at the ruling stage, so the author may propose a prune or
a change of shape from the page. For it: the author's directive says list all
facts, and a listed fact the author cannot rule on is half a listing; the author
is already reading the node, which is the moment a prune occurs to a reader; and
`existence` exists precisely so a prune is recorded as a fact and not as an option
of a special shape. Viable and not adopted: the page's scope under the author's
rule of 2026-09-06 is the final confirmation of what is recommended, and a prune
nobody has proposed is not a recommendation to confirm, so the radio would collect
a proposal rather than a confirmation, which is the one thing that rule sends to
the interview. It is the option to take if the author reads their own directive as
reaching what the page asks and not only what it shows.

#### derived-rows-on-every-node

Everything the recommended option says, with the derived rows printed on nodes
carrying no facts as well, so that every item on the page shows four rows. Passed
over: a node with no facts is at the periagogic or the maieutic stage and owes no
ruling at all, so four rows reporting that nothing is asked replace one sentence
that already says the whole of it, and the parent's clause that such a node
"offers nothing invented" is the sentence they would replace.

#### a-line-naming-the-facts-not-asked

Everything the recommended option says, with one line beneath the facts the node
carries naming the decisions the ruling does not ask, instead of two rows. Passed
over: it is the fold the author's words strike, written as a sentence rather than
as a hidden row, and it says less than the rows do, since a name without what is
derived for it tells the author that a decision exists and not what the record
holds on it. It also puts the two reserved names into text the page carries for
itself, which the parent's answer refuses as a rule no node projects.

#### instrumentation-listed-as-a-fifth

Everything the recommended option says, with `instrumentation` listed as a fifth
row, on the author's expectation of 2026-09-04 that it would be a fact. Passed
over here and live elsewhere: whether the reserved names are four or five is
`commons.systems/disposition-graph/dialogue`'s question, where the author's same
words are already recorded as the option `instrumentation-is-a-fact` on that
node's answer fact. This answer lists whatever that ruling leaves reserved, so a
ruling there reaches this page with no ruling here, and listing a fifth name the
record does not reserve would be the page deciding the encoding.

#### existence-asked-persistence-derived

Everything the recommended option says, with the two conditional facts split
rather than treated as a pair: the persistence row reports what the record
actually derives from the node's shape, and the existence row carries `keep` and
`prune` as a live decision on every node that carries facts. For it: it takes the
author's directive whole where the record backs it, since `unanswered` names the
node's existence among the decisions a ruling asks with no condition on it and
`dialogue`'s derived enumeration names persistence alone; a prune is the one
decision a reader of a node is best placed to raise at the moment they read it;
`existence` exists precisely so that a prune is recorded as a fact; and it costs
one live radio on 123 nodes rather than 246. Viable and not adopted: a live
existence radio on 123 nodes asks a decision no one has recommended, and the
author's rule of 2026-09-06 keeps that off the page, the page's scope being the
final confirmation of what is recommended and every other movement's preview.
The same day's standing disposition gives the prune of an unratified node to the
AI under the general delegation of graph topology, so on those nodes the radio
would ask the author to confirm what they have said they do not want to be asked
about.

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

### Frontier finding, 2026-09-05

Kind: cross-reference.

`commons.systems/disposition-graph/which-facts-are-listed` stands under `commons.systems/disposition-graph/alignment-page` and is the only one of the ten children minted from the sitting of 2026-09-04 that is absent from the parent's `depends`. The parent's `depends` names nine of them — `alignment-page-observations`, `authors-words-on-the-page`, `how-a-fact-is-headed`, `input-for-an-unfinished-movement`, `the-account-on-the-page`, `vocabulary-option-summary`, `what-an-option-row-carries`, `when-the-kickback-feedback-shows`, `where-a-change-request-goes` — and omits this one. The omission matters because the child's own `## Account` says the amendment it proposes falls on the parent's answer fact and on the sentence in the recommended text that opens the facts: "Then the facts, every one the node carries and none folded: its answer ... the authority class a confirmation would confer; its existence; and its persistence where the recommendation would change its shape." The child records that this sentence and the author's directive come apart on `commons.systems/public/agency`, which carries two facts. So the parent could reach a ruling on the exact sentence the child exists to amend, with nothing in the parent's dialogue state naming the dependency. The child stands at the periagogic stage and the parent at the maieutic; the projector reports the child as settling nothing, since no node depends on it.

Also named: commons.systems/disposition-graph/alignment-page.

Proposed: Add `commons.systems/disposition-graph/which-facts-are-listed` to `alignment-page`'s `depends`, beside its nine siblings, so the parent's ruling order accounts for it and the frontier's `settles` count stops reading zero. The child is not folded: its own account shows the question reaches `commons.systems/disposition-graph/dialogue`'s reserved-four rule as well as the page's rendering, so it has content the parent's recommended option does not carry and survives the independence test on that ground.

### The maieutic movement, 2026-09-07

The periagogic stage's object was read by the unit of 2026-09-05, whose report is
the seventh of its ten items: it found `renderFacts`
(`packages/disposition/project.mjs`) mapping over `n.facts` and
inventing nothing, `commons.systems/public/agency` carrying two facts and the
page rendering two fieldsets for it, and the author's directive met by no
sentence of the parent's recommended text and by no line of the projector. It
found the clause unchanged by the reconciliation of 2026-09-05. The stage is
passed on the author's words of 2026-09-07 rather than in dialogue: "before
stopping for confirmation, and ensure alignment-page-observations is progressed
up to confirmation and included in the list of reconciliation for
alignment/review/survey/artifact."

No probe is owed. The question the periagoge would have put — does "list all
facts" ask that the two conditional decisions be *shown* or that they be *asked*?
— is a candidate answer to this node's own question, which under `probe-or-node`'s
test makes it an option and not a probe, and both candidates are already on the
fact: `all-four-listed-two-derived` and `derived-rows-ask-and-take-a-ruling`. The
author's own words answer the first and are silent on the second, and the two
differ by whether the page will take a prune the author has not been offered; the
choice is put to them as the fact's two options.

What the record says. The parent's answer holds two clauses a ruling here
reaches, located by their words: the facts sentence, "Then the facts, every one
the node carries and none folded", whose enumeration this answer keeps and whose
binding to what the node carries it amends; and the no-facts clause, "A node that
carries no facts offers nothing invented", which this answer leaves exactly as it
stands and cites as its own limit. The parent's marking rule, that a clause
standing only until a child rules says so, was applied at three clauses and not
at the facts clause this answer amends, so a reader of the parent met an
unqualified sentence a ruling here replaces; the clean-context reading of
2026-09-07 named it, and the parent's amendment of this sitting marks it in the
form the other three already take. `dialogue`'s
recommended text is the ground of the derived row and is quoted in the answer;
that node is unanswered, so it is read as direction. `unanswered`'s answer names
the same four decisions as what a ruling asks, which is why the derived row says
what it does rather than nothing. Among the siblings, `what-an-option-row-carries`
decides what a row carries and this decides which rows exist, and the two do not
meet: a derived row carries no option, so nothing on it is a row in that node's
sense. `authors-words-on-the-page` supplies the method this answer takes with a
gap, that a page filling a hole with a plausible render makes the hole
unfindable, which is why the derived row states what is derived rather than
staying silent.

The tradition surfaced, and it is one reading, whose `bears` entry on the reading
node already stands.
`commons.systems/disposition-graph/special-verdict-form`, whose answer at
`disposition/disposition-graph/special-verdict-form.md:35` "Supports asking the
question rather than inferring the answer" and whose next paragraph at `:37`
records that the record already took both halves by putting the authority fact on
every node that carries facts; its entry for this node's recommended option was
written on 2026-09-06 at `8a672c17` and stands at `:28-31`. It bears on the recommended option as adopted, and it carries
its own limit in the same paragraph: "The form supplies no question by itself.
The questions are drafted for the case, and drafting them is the work, which is
why the rules say what happens to a question the court left out." That limit is
exactly the line this answer draws. The tradition supports listing the decisions
the judgment turns on so that a question never put is visibly never answered; it
does not support putting a question nobody drafted, which is why the two derived
rows report and do not ask. The second reading, `codd-update-anomaly`, is cited
in the rationale for the choice of end and bears on the option
`every-node-carries-four-facts` as the reason it is not adopted; its entry stands
there too, `relation: diverged`, written in the same commit. The clean-context
reading of 2026-09-07 held that entry to be owed, and it was already written; the
correction is recorded here rather than left as an obligation a later session
would discharge twice.

What the implementation does today, at the loci a ruling here changes.
`renderFacts` (`packages/disposition/project.mjs`) returns
`NOTHING_PROPOSED` where the node has no facts and otherwise maps over
`n.facts` under the caption `FACTS_LBL`, "What this ruling asks"; it has
no fold branch and no derivation. `renderFact`, in the same file, writes a
`<fieldset class="fact">` with a legend, the ruled line, the option rows and the
kick-back row, all of which a derived row would carry none of. The reserved order
is `FACT_NAMES` in the reader (`packages/disposition/read.mjs`). Measured over
the 141 node files of both graphs at graph commit `5da05bc4`, 134 carry an
`answer` fact and the same 134 an `authority` fact, 6 carry `existence`, 5 carry
`persistence`, and none carries both, so 123 nodes render two fieldsets where
four decisions are reserved.

The clean-context reading of this recommendation is owed before the author rules.

### Clean-context review, 2026-09-07, of 7c9f6943

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `all-four-listed-two-derived`.

Findings:

- ## Answer, second paragraph, validation 2 (doctrine) and the answer's own limit. "A fact the node does not carry is listed as a derived row: the row states what the record derives for it, that the node is kept and that its shape is unchanged". The record derives one of those two and not the other. `dialogue` enumerates what is derived in both its standing answer and its recommended text, and the list runs "the class and the status, the persistence where no fact carries it, the queue and its order" -- `persistence` is named there and `existence` is not. What the absence of an existence fact actually holds is that no prune has been proposed, which is `dialogue`'s own reason for the conditional pair, "a choice nobody has raised is not a candidate the record lists"; it does not hold that `keep` has been derived. A row asserting that the node is kept therefore prints a derivation the record does not make, which is the one thing this answer promises never to do -- "What the page never does is invent a fact." Suggested edit: have the existence row say that no prune is proposed on this node and where one would be, rather than that the node is kept, and keep "derived" for the persistence row alone; or, if `keep` is to be derived, record that as an option on `dialogue` adding `existence` to its derived enumeration, so the derivation this page relies on has a home.
- ## Answer, second paragraph, against `commons.systems/disposition-graph/unanswered`. That node names what a ruling asks without conditioning existence: "A response is given on a node, or on one of the decisions that node's ruling asks, which are its facts: the answer, the authority class a ruling would confer, the node's existence, and its persistence where the recommendation would change its shape." It conditions persistence in terms and leaves existence unconditioned, so on that text the existence decision is one a ruling asks on every node that carries facts, and a row that "carries no option, no radio and no control, at any stage" declines to ask a decision the record says the ruling asks. This does not decide the question -- the author's rule of 2026-09-06 is a real answer on the other side -- but the draft cites `unanswered` as supporting the derived row ("`unanswered`'s answer names the same four decisions as what a ruling asks, which is why the derived row says what it does rather than nothing") when on existence it reads the other way. Suggested edit: quote `unanswered`'s sentence, say that it conditions persistence and not existence, and say why the page still reports rather than asks; or record an option on `unanswered` conditioning existence as persistence is conditioned, so the two texts agree.
- ## Account, the `bears` entry. "The tradition surfaced, and it is one reading, recorded here in prose with the `bears` entry on the reading node owed with the ruling. `commons.systems/disposition-graph/special-verdict-form` ..." That entry is not owed: it already stands at `disposition/disposition-graph/special-verdict-form.md:28-31`, as `- node: commons.systems/disposition-graph/which-facts-are-listed / fact: answer / option: all-four-listed-two-derived / relation: adopted`. The second half of the sentence is right and should stay: `codd-update-anomaly` carries no entry for this node, so that one is genuinely owed on the passed option `every-node-carries-four-facts`. Suggested edit: say that the `special-verdict-form` entry stands and the `codd-update-anomaly` entry is owed.
- ## Answer, ## Rationale and ## Account, validation 3 (a line cited names what is claimed). Every citation into `packages/disposition/project.mjs` and into the two reading nodes has gone stale. `FACTS_LBL`, cited as `packages/disposition/project.mjs:671` for "What this ruling asks", is at `:675`; `NOTHING_PROPOSED`, cited `:672`, is at `:676`; `renderFacts`, cited `:1648-1656`, is at `:1660-1668`; `renderFact`, cited `:1623-1640`, is at `:1635-1652`. `codd-update-anomaly.md:50`, cited for "What has a shape is recorded in the field that has it and projected from there", is at `:54`; `special-verdict-form.md:31`, cited for "Supports asking the question rather than inferring the answer", is at `:35`, and the account line cited `:33` moved with it. `packages/disposition/read.mjs:76` for `FACT_NAMES` is exact and needs no change. Every project.mjs citation was exact at implementation commit `87e4b24e` and staled when `cb0e02c6` landed on 2026-09-07, and the two graph citations staled when the `bears` entries above were written; the same staleness runs through all four drafts of this wave, so it is one reconciliation and not four. Every quotation is exact, and I re-took the measurement: at graph commit `5da05bc4`, 141 node files, 134 with an `answer` fact, the same 134 with an `authority` fact, 6 with `existence`, 5 with `persistence`, none with both, 123 therefore carrying two of four -- and `commons.systems/public/agency` carries exactly `answer` and `authority`.
- ## Account, the probe stated as owed. "One periagogic probe is owed and is stated here as a question, to be put when the author is directed to the page: does 'list all facts' ask that the two conditional decisions be *shown*, which is what this answer gives, or that they be *asked*, which is the option `derived-rows-ask-and-take-a-ruling`?" Under `probe-or-node`'s test that is not a probe: it is a candidate answer to this node's own question and both candidates are already on the fact, `all-four-listed-two-derived` and `derived-rows-ask-and-take-a-ruling`. The rule sends it there in terms -- "it is an **option** where you hold a candidate answer to this node's question viable, whether or not you would recommend it" -- and the Account itself names the option in the same sentence. The record is already in the right shape; calling it a probe owed would send a later session to record one and return this node to the maieutic stage for a question the fact already asks. Suggested edit: drop the word probe and say that the question is put to the author as the choice between those two options.
- A finding about the parent rather than about this node's text, which this draft's Account already names and which the session should carry to `commons.systems/disposition-graph/alignment-page`. That node marks three clauses as standing only until a child rules and does not mark the facts clause this answer amends, "Then the facts, every one the node carries and none folded". The marking rule is the parent's own and it is applied unevenly, so a reader of the parent meets an unqualified clause that a ruling here replaces. The amendment is one phrase on the parent's sentence, in the form the other three already take.

On the facts and what they recommend: Two facts. The answer fact recommends `all-four-listed-two-derived` at moderate boldness among seven options, four passed over with reasons and two viable and not adopted, and `stands` names the recommended option, so there is correctly no `## Recommendation` fence and `## Answer` holds the text. Moderate boldness is right and the fact's prose says why -- the derived row is a shape the record has not used before -- though it understates one thing: the answer also asserts a derivation for `existence` that `dialogue`'s enumeration does not make, which is the first finding above and is more of the AI's own than the prose claims. The authority fact recommends `ratified` at low boldness with the three reserved terms and no option prose, and its `### authority` subsection applies `class-recommendation`'s three limbs by name and says which it found. No existence or persistence fact on this node itself, correctly, which is the state its own answer is about.

On the viability of the options: Every listed option is viable and the four passed over carry reasons that hold: `facts-the-node-carries` is struck by the author's words by name, `derived-rows-on-every-node` is dominated by the parent's own no-facts clause, `a-line-naming-the-facts-not-asked` is the fold in another shape, and `instrumentation-listed-as-a-fifth` is correctly sent to `dialogue` rather than decided here. `derived-rows-ask-and-take-a-ruling` is rightly kept viable and is stronger than the fact's prose allows, since `unanswered` names the node's existence among the decisions a ruling asks without condition. One viable option is missing: `existence-asked-persistence-derived` -- the two conditional facts are split rather than treated as a pair, the persistence row reporting what the record actually derives from the node's shape, and the existence row carrying `keep` and `prune` as a live decision on every node that carries facts, since a prune is the one decision a reader of a node is best placed to raise at the moment they read it and `existence` exists precisely so that a prune is recorded as a fact. It is not dominated by anything on the list: it takes the author's directive whole where the record backs it (`unanswered`'s unconditioned existence, and `dialogue`'s derived enumeration naming persistence alone) and reports only where the record genuinely derives, and it costs one live radio on 123 nodes rather than 246.

Strongest counter-argument (moderate): The tradition this answer adopts is the one that cuts against it. `special-verdict-form` holds that "a special verdict puts each question the judgment needs to the decider separately, so the answers can be read apart, and a question that was never put was never answered", and the derived row is exactly a question printed and not put: on 123 of the 134 nodes carrying facts the author will read the names of two decisions beside two sentences telling them nothing is being asked. `unanswered` names "the node's existence" among the decisions a ruling asks with no condition on it, so what the page declines to ask is a decision the record says a ruling covers, and the answer's ground for declining -- that the page's scope is the final confirmation of what is recommended -- is the same shape of argument the fold used, that the recommending party decides which decisions reach the decider, now applied to two facts rather than to the low-boldness ones. The author's directive was "list all facts - even if options have not yet been established", and its natural reading is that a fact listed is a fact available to rule on; what this answer delivers on almost every node is two rulings and two notices, which is the fold's silence given a heading.

The session's reply: Accepted on all six, each verified at its locus on the main thread: dialogue derives persistence and not existence, so a row saying the node is kept prints a derivation the record does not make; unanswered conditions persistence and not existence and is cited the other way; the special-verdict-form entry stands since 8a672c17 and the codd-update-anomaly entry is owed; every project.mjs and reading line is stale; the probe the account calls owed is the choice between the fact's options; and the parent's facts clause is unmarked, which the parent's amendment of this sitting takes. The amendments owed: the existence row says that no prune is proposed on this node and where one would be, derived kept for the persistence row alone; unanswered quoted, its asymmetry stated, and why the page reports rather than asks, the author's rule of 2026-09-06 that the page collects only the confirmation of what is recommended; the bears sentence corrected; citations by function; the probe restated as the choice the options put; and the option existence-asked-persistence-derived recorded, source review, viable and not adopted, since a live existence radio on 123 nodes asks a decision no one has recommended, which the author's rule of 2026-09-06 keeps off the page. The counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.

### The reading of 2026-09-07 applied, 2026-09-07

The reading forwarded to the author's ruling at moderate strength, with six
findings and no probes. Its verdict, its strength and the pin of the
recommendation it read are in `review` above, written by the instrument. All six
were validated on the main thread at the loci they name and all six are accepted.
The recommendation does not move: `all-four-listed-two-derived` stands, on the
author's directive to list all facts even where options have not been
established.

The one that changes what the answer says is the first, and it is a claim about
the record that the record does not make. `dialogue` enumerates what is derived —
"the class and the status, the persistence where no fact carries it, the queue and
its order" — and names persistence there and not existence. The draft had both
derived rows saying the same kind of thing, that the node is kept and that its
shape is unchanged, and the first half of that is a derivation nobody has made:
what the absence of an existence fact holds is that no prune has been proposed,
which is `dialogue`'s own reason for the conditional pair. So the existence row
now says that no prune is proposed on this node and where one would be raised, and
"derived" is kept for the persistence row alone; "derived row" stays as the name
of the shape, and the answer says as much, so that the name is not read as a
second claim. The answer's own promise, that the page never invents a fact, is
what the correction keeps.

`unanswered` was cited as supporting the derived row when on existence it reads
the other way: it conditions persistence in terms and leaves the node's existence
unconditioned among the decisions a ruling asks. Its sentence is now quoted, the
asymmetry is stated, and the ground for reporting rather than asking is given as
the author's own — the rule of 2026-09-06 fixing the page's scope to the final
confirmation of what is recommended, and the same day's standing disposition
giving the prune of an unratified node to the AI under the general delegation of
graph topology, so that a live radio on 123 nodes would ask the author to confirm
a decision they have said they do not want to be asked about. The asymmetry
itself is not resolved here: an option conditioning existence as persistence is
conditioned belongs on `unanswered`, where that sentence lives.

Two were checks of the record against itself. Both `bears` entries the account
called owed already stand, written on 2026-09-06 at `8a672c17`:
`special-verdict-form`'s at `:28-31` on `all-four-listed-two-derived`, adopted,
and `codd-update-anomaly`'s on `every-node-carries-four-facts`, diverged. The
reading found the first standing and the second owed; the second was written in
the same commit, and the sentence is corrected to say so, so that a later session
does not write it twice. And every citation into `packages/disposition/project.mjs`
was exact at implementation commit `87e4b24e` and staled when `cb0e02c6` landed on
2026-09-07, with the two reading nodes' citations staled by the `bears` entries
themselves; that is one reconciliation across the wave, answered by naming the
function and not the line, and by correcting the two graph line numbers where a
function has no name to take.

The account's owed probe is struck, since the question it stated is the choice the
fact's own options put. The option `existence-asked-persistence-derived` is
recorded from the reading's viability, viable and not adopted, since a live
existence radio on 123 nodes asks a decision no one has recommended. And the
parent's unmarked facts clause, which the reading named, is marked by the parent's
own amendment of this sitting rather than left as this node's finding.

The amended answer owes its re-reading, and the node returns to the review stage.

### Clean-context re-reading, 2026-09-07, of 49cbcabd

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `all-four-listed-two-derived`.

Findings:


On the facts and what they recommend: The diff adds one new viable option to the answer fact, `existence-asked-persistence-derived` (source review, ref 2026-09-07), without changing `recommends` (still `all-four-listed-two-derived`), boldness (still moderate), or `stands`. The authority fact is unchanged (`recommends: ratified`, boldness low); a `review` block is newly recorded in frontmatter carrying the previous reading's verdict, strength, pin and `against`.

On the viability of the options: Every option remains viable. The new option `existence-asked-persistence-derived` is recorded viable-and-not-adopted with the reasoning the previous reading itself supplied (a live existence radio on 123 nodes would ask a decision no one has recommended, which the author's 2026-09-06 scope rule keeps off the page), which I hold sound; I verified the quoted rule against `disposition/disposition-graph/alignment-page.md:315` and it is exact.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding. Nothing on the node changes.
