---
question: Which facts does the alignment page list on a node?
stage: review
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
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - there are only 2 facts listed for commons.systems/public/agency - the answer prose and the authority. Is that because dispositions only have two facts (and all other structured data has been moved under fact options) or does agency node not yet have options for other facts because dialogue is not at confirmation phase yet? I expect instrumentation (eg.) would be a fact. Either way, list all facts - even if options have not yet been established.

## Answer

Every fact the record reserves, on every node that carries facts at all, in the
reserved order, and none folded. Four names are reserved today, `answer`,
`authority`, `existence` and `persistence`
(`packages/disposition/read.mjs:76`), and the page lists whichever names the
record reserves, so a fifth added by a ruling elsewhere appears here without a
ruling here.

Two of the four the node carries and two it usually does not, and the page shows
them differently because the record holds them differently. A fact the node
carries is a decision the ruling asks: it carries its options, the recommendation
among them and its radio, exactly as the parent's answer describes. A fact the
node does not carry is listed as a derived row: the row states what the record
derives for it, that the node is kept and that its shape is unchanged, says that
no change to either is proposed on this node, and carries no option, no radio and
no control, at any stage. It is a read-only indicator, which is what the author's
rule of 2026-09-06 leaves the page free to show of a movement it is not running,
and it is not a decision the ruling asks.

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
ruling asks" (`packages/disposition/project.mjs:671`), which is false of a
derived row; under this answer the caption names the decisions the ruling covers,
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
(`disposition/disposition-graph/codd-update-anomaly.md:50`). The record's reason
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
form of the derived row: that it states what is derived, says where a proposal
would be made, and takes no ruling. Boldness moderate, and the second is why: a
row that lists a decision and refuses to take it is a shape the record has not
used before, and whether it reads as completeness or as a fold with a caption is
what the author is best placed to say.

#### facts-the-node-carries

Everything the recommended option says, with the page listing only the facts the
node carries and inventing nothing, which is what `renderFacts` does today
(`packages/disposition/project.mjs:1648-1656`) and what the parent's clause
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
(`packages/disposition/project.mjs:1648-1656`) mapping over `n.facts` and
inventing nothing, `commons.systems/public/agency` carrying two facts and the
page rendering two fieldsets for it, and the author's directive met by no
sentence of the parent's recommended text and by no line of the projector. It
found the clause unchanged by the reconciliation of 2026-09-05. The stage is
passed on the author's words of 2026-09-07 rather than in dialogue: "before
stopping for confirmation, and ensure alignment-page-observations is progressed
up to confirmation and included in the list of reconciliation for
alignment/review/survey/artifact."

One periagogic probe is owed and is stated here as a question, to be put when the
author is directed to the page: does "list all facts" ask that the two conditional
decisions be *shown*, which is what this answer gives, or that they be *asked*,
which is the option `derived-rows-ask-and-take-a-ruling`? The author's own words
answer the first and are silent on the second, and the two differ by whether the
page will take a prune the author has not been offered.

What the record says. The parent's answer holds two clauses a ruling here
reaches, located by their words: the facts sentence, "Then the facts, every one
the node carries and none folded", whose enumeration this answer keeps and whose
binding to what the node carries it amends; and the no-facts clause, "A node that
carries no facts offers nothing invented", which this answer leaves exactly as it
stands and cites as its own limit. The parent's marking rule, that a clause
standing only until a child rules says so, is applied at three clauses and not at
these, which is the parent's bookkeeping and is corrected there. `dialogue`'s
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

The tradition surfaced, and it is one reading, recorded here in prose with the
`bears` entry on the reading node owed with the ruling.
`commons.systems/disposition-graph/special-verdict-form`, whose answer at
`disposition/disposition-graph/special-verdict-form.md:31` "Supports asking the
question rather than inferring the answer" and whose account at `:33` records that
the record already took both halves by putting the authority fact on every node
that carries facts. It bears on the recommended option as adopted, and it carries
its own limit in the same paragraph: "The form supplies no question by itself.
The questions are drafted for the case, and drafting them is the work, which is
why the rules say what happens to a question the court left out." That limit is
exactly the line this answer draws. The tradition supports listing the decisions
the judgment turns on so that a question never put is visibly never answered; it
does not support putting a question nobody drafted, which is why the two derived
rows report and do not ask. The second reading, `codd-update-anomaly`, is cited
in the rationale for the choice of end and bears on the passed option
`every-node-carries-four-facts` as the reason it is passed; its entry is owed
there too.

What the implementation does today, at the loci a ruling here changes.
`renderFacts` (`packages/disposition/project.mjs:1648-1656`) returns
`NOTHING_PROPOSED` (`:672`) where the node has no facts and otherwise maps over
`n.facts` under the caption `FACTS_LBL`, "What this ruling asks" (`:671`); it has
no fold branch and no derivation. `renderFact` (`:1623-1640`) writes a
`<fieldset class="fact">` with a legend, the ruled line, the option rows and the
kick-back row, all of which a derived row would carry none of. The reserved order
is `FACT_NAMES` in the reader (`packages/disposition/read.mjs:76`). Measured over
the 141 node files of both graphs at graph commit `5da05bc4`, 134 carry an
`answer` fact and the same 134 an `authority` fact, 6 carry `existence`, 5 carry
`persistence`, and none carries both, so 123 nodes render two fieldsets where
four decisions are reserved.

The clean-context reading of this recommendation is owed before the author rules.
