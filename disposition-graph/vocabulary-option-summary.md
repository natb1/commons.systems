---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
stage: ruling
form: rule
facts:
  - name: answer
    options:
      - name: term-at-the-first-level
        source: author
        ref: "2026-09-04"
      - name: gloss-at-the-first-level
        source: commons.systems/disposition-graph/alignment-page
        ref: "2026-09-05"
        status: passed
        reason: "the author's words of 2026-09-04 strike it by name, asking for the name of the level and nothing more"
      - name: authority-alone
        source: ai
        ref: "2026-09-07"
      - name: term-linked-to-the-definer
        source: ai
        ref: "2026-09-07"
      - name: term-and-a-short-gloss
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "a gloss cut to the width of a row is the record's sentence with its qualification removed, which on ratified is the half saying the author is asked before it changes"
      - name: term-with-the-gloss-on-the-first-node-only
        source: review
        ref: "2026-09-07"
    recommends: term-at-the-first-level
    boldness: low
    against: "On the most repeated decision on the page the author will now read three words, ratified, delegated and deferred, and the sentence saying what confirming each would do sits behind a fold on every one of the 134 nodes that carry the fact. The record's own reason for putting it on the row was that the bare words told the author nothing they did not already have to know, and this answer's reply is that they do already know it, which is true of this author and of no other reader the page may ever have."
    stands: term-at-the-first-level
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
    against: "The author asked for exactly this in their own words, so ratifying it spends their scarcest act on a transcription, and it freezes the row's text against `vocabulary-view`, which asks how a defined term is presented and linked wherever it appears and has not been held. Deferred would let the row act while that question is open, which is where the contested part of this lives."
review:
  verdict: forward
  strength: none
  date: 2026-09-07
  of: 01059350d1d2da037d38b5ada9e1e5e49463203f
  commit: f146f8f44b295c64e47a13bff338748035183d87
  survey:
    date: 2026-09-07
    of: 01059350d1d2da037d38b5ada9e1e5e49463203f
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/what-an-option-row-carries
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Authority fact does not require verbose description of each authority level. Just rename section heading "Who may change an answer?" to "Authority" and hyperlink heading to authority node in the browser. Text summary for each authority option is just the name of the authority level.

## Answer

The option's name, as the term it is, and the gloss one step down.

On a fact whose options are the record's own vocabulary the row leads with the
term and nothing else: `ratified`, `delegated`, `deferred` on the authority fact,
`keep` and `prune` on existence. The gloss, the sentence the defining node carries
beside the term and which says what confirming that choice would mean, is the
first thing in the option's drill-down, under the label the drill-down already
gives the rest of an option's text, credited to the node that holds it. Nothing
is lost; one level is spent.

The reach is two facts and no wider. `authority` and `existence` are the two
whose options are terms; `persistence`'s options are shapes written per node and
`answer`'s are candidate answers written per option, and both keep their sentence
at the first level, where there is no name that says the decision and the sentence
is the decision. That division is `dialogue`'s, in the sentence this answer reads
and does not amend: "An option of the two facts whose options are the record's own
vocabulary, `authority` and `existence`, has no subsection at all: its name is a
term, and its sentence is the gloss on the node that defines the term." That text
is `dialogue`'s recommended text, which no ruling has reached, and this answer
reads it as direction and not as doctrine; the rule stated here holds whichever
way that node rules, because a fact whose options are terms the record defines is
what the rule is about, and `dialogue`'s standing answer already names `authority`
and `existence` as the two facts whose options are the record's own vocabulary.
Nothing is entered in `depends` for that reason. Where the gloss lives and who
writes it are untouched: written once, on the defining node, read from there, and
never carried by the page for itself. What changes is which level of the row it
appears at.

What this does to the sibling's rule is said here and not left to an executor.
`what-an-option-row-carries` holds that a row "carries the option's name nowhere",
and gives the reason: "the name is how a ruling is stored and the sentence is the
decision, and the author's words of 2026-09-04 strike the id-shaped string from
the row"; it holds too that where the record holds no sentence "the row falls
back to the bare name ... so a bare name on the page is a record not yet written
and a defect to be found". Neither reaches a vocabulary fact. On the two facts
whose options are the record's own vocabulary the option's name is not an
id-shaped slug but a term the record defines, and the sentence the record holds
for that option and the name of that option are the same string, so leading with
the term is leading with what the record holds and not with the handle a ruling
is filed under; and a term is not the fallback that node calls a defect, since
the fallback is what the projector prints when the record holds nothing, where
here it holds a gloss and a defined term both. The exception is recorded on that
node as the option `a-term-is-its-own-sentence`, with this node as its source, so
that its two sentences are amended with it rather than left contradicting this
page on 402 rows.

Why the term is enough at the first level, against the record's own reason for
the gloss. The parent's answer holds that the authority class "is the most
repeated decision on the page, and rendered as the two bare words `ratified` and
`delegated` it told the author nothing they did not already have to know". The
author's words of 2026-09-04 answer that in the other direction, and the answer
takes their side with the reason stated: a sentence carried on 134 of the 141
node files of both graphs is read once and skipped thereafter, so the gloss earns
its place on the first node and costs on every node after it, while the term is
what the reader recognises at a glance and is the only thing on the row that
differs between the three choices. What a repeated decision needs at the level the
eye reads is the name; what a first reading needs is the sentence, and one step
down is where the record already keeps what explains a row.

What the author gives up is stated and not argued away. On the first node they
read, three rows saying `ratified`, `delegated` and `deferred` say nothing at all
to a reader who does not already hold the record's vocabulary. Two things answer
that and neither is nothing: the drill-down, which carries the whole gloss under
the label it already carries the rest of an option's text under; and the fact's
own heading, which under `how-a-fact-is-headed` is the fact's name linked to the
node that defines it, so the vocabulary is one click from the row on the line
above it. The row itself carries no link, because whether a defined term is linked
wherever it appears is `commons.systems/disposition-graph/vocabulary-view`'s
question and not this page's to settle.

In the implementation the row's lead is `renderOption`
(`packages/disposition/project.mjs`), which prints the first sentences
of whatever `optionText` returns, and for a vocabulary option `optionText`
(`packages/disposition/derive.mjs`) returns the gloss with the id of the
node that holds it. `optionText` need not change and should not: it is what keeps
the sentence in one place. What changes is the projector, which for an option of a
vocabulary fact prints the term as the row's lead and puts the gloss at the head
of the drill-down. The drill-down's present body is `restOf`, the remainder the
lead did not take, which for a gloss is empty, since a gloss is one sentence and
the lead's cap is `CHOICE_LEAD_CHARS`, 400 characters, in the same file; so the
gloss reaches the drill-down only if the projector is told to put it there, and a
reconciliation that moved the lead and not the body would drop the sentence off
the page entirely.

## Rationale

The author, 2026-09-04, on the alignment page: "Authority fact does not require
verbose description of each authority level. Just rename section heading 'Who may
change an answer?' to 'Authority' and hyperlink heading to authority node in the
browser. Text summary for each authority option is just the name of the authority
level."

The last sentence is this node's, and it is the whole of the recommendation's
first clause. The two before it are `how-a-fact-is-headed`'s and are cited here
only because they are what makes the term legible: the author asked for the
heading to name the fact and to link to the node that defines it, so the reader
who meets a bare term on a row has the definition one line above and one click
away, which is the reply to the record's own reason for the gloss.

Two things in the answer are not in that sentence. The gloss going one step down
rather than off the page, which the record's own rule requires, since a projection
that drops what it stops showing is a fold and the author's words of 2026-09-04
struck the fold. And the reach to `existence`, which the author did not name:
`dialogue` states one rule for the two facts in one sentence, and a page showing a
term on one and a sentence on the other would make the reader learn which fact
they are looking at before they could read a row, so the answer is about
vocabulary facts as a class and says so.

What the answer beat is on the fact: `gloss-at-the-first-level`, the incumbent,
which the author's words strike; `authority-alone`, which is this answer for one
fact; and `term-and-a-short-gloss`, which is the gloss again at the width a row
allows.

## Facts

### answer

Recommended because it is the author's sentence applied where it falls, and
because the division it applies to is the record's own. The first clause is
theirs, verbatim in effect: the summary is the name of the level.

Boldness low, because the recommendation rests on the author's words rather than
against them, which is the measure `dialogue` gives boldness. What is the AI's is
the disposal of the gloss, which the record's rule against a fold decides, and
the reach to the second vocabulary fact, which `dialogue`'s own sentence decides
by naming the two together. Neither is a departure from anything the author has
said, and neither is the AI preferring its own reading of the page's purpose to
theirs, which is what this fact's `against` is about.

The case against is on the fact at full strength: the record wrote the gloss onto
the row for a reason, and this answer removes it on the strength of the one reader
the page has today.

#### gloss-at-the-first-level

Everything the recommended option says, reversed: the row's lead is the gloss of
the term, in the words of the node that defines the fact, which is what the page
prints today for all three authority options on every node. For it, the parent's
own reason, that the bare words told the author nothing they did not already have
to know, and the fact that a reader new to the record can rule from the row
without opening anything. Passed over: the author's words of 2026-09-04 ask for
the name of the level and nothing more, and the parent's clause already records
itself as standing only until this node rules.

#### authority-alone

Everything the recommended option says, for the authority fact alone, with
`existence` keeping the gloss at the first level. For it: the author named
authority, `existence` appears on 6 nodes against authority's 134, so the argument
from repetition is weak there, and `keep` and `prune` are terms whose glosses are
short. Viable and not adopted: `dialogue` states one rule for the two facts in one
sentence, and a row that leads with a term on one fact and with a sentence on
another asks the reader to know which fact they are in before they can read the
row, which is a rule the page would carry and no node would project.

#### term-linked-to-the-definer

Everything the recommended option says, with the term on the row made a link to
the node that defines it. For it: a bare term is the one lead on the page that
tells a new reader nothing, and a link on the term is the shortest route to the
sentence it stands for. Viable and not adopted:
`commons.systems/disposition-graph/vocabulary-view` asks how a defined term is
presented and linked wherever it appears and is unanswered, so a link here would
settle its question from this page; and under `how-a-fact-is-headed` the fact's
own heading already carries that link for the whole fact, so a link per row prints
the same route three times on one fieldset.

#### term-and-a-short-gloss

Everything the recommended option says, with the term at the first level and the
gloss's opening clause beside it. For it: it keeps some of the sentence where the
author reads and still shortens the row. Passed over: it is the gloss again, cut
to the width a row allows, where the author asked for the name and nothing more;
and a gloss with its qualification removed is worse than no gloss, since on
`ratified` the clause that would be cut is the half that says the author is asked
before the answer changes, which is the whole of what distinguishes it from
`delegated`.

#### term-with-the-gloss-on-the-first-node-only

Everything the recommended option says, with one exception: the row leads with
the term everywhere except on the first node of a sitting, or on the first fact
of the page's session, where the gloss is printed once so that a reader who does
not hold the vocabulary meets it before they meet 402 bare terms. For it: it
takes the author's words where the argument for them is strongest, the same
sentence repeated on 134 nodes, and refuses them only where the argument is
weakest, the first reading, which the recommended option's own `against` concedes
it loses; and it costs one condition in the projector, which is less than the
condition `how-a-fact-is-headed` already asks for on the heading. Viable and not
adopted: which node is first in a sitting is no fact of the record — the order
is derived from the frontier and changes with every ruling, and the page has no
session of its own to be first in — so the condition would key the row's text to
something no node projects; and the record already has a device for the first
reading, the fact's own heading linked to the node that defines the term, which
is one click from the row on the line above it and is there on every node rather
than on one.

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test. The other
two are not met and the reading says so. Not expensive: it is the row's lead and
the head of its drill-down, one projector change, with nothing built on it. Not
irreversible: no node's data moves, the gloss stays where `dialogue` keeps it, and
a wrong answer is undone by re-projecting the page.

The capture-shaped limb is met on the most repeated decision the page carries.
This answer decides how much the author is told, at the level they read, about a
choice they make on 134 nodes, and what it decides is that they are told a word
where the record holds a sentence. The party proposing the reduction is the party
whose class the decision confers, since a ruling of `delegated` on any of those
facts is what lets the AI's recommendation act without being asked again; a page
that renders those three choices as three words it expects the reader to already
know is the recommending party setting how legible its own delegation is. That is
the limb, and it is the same one `what-an-option-row-carries` found on the row's
other contents.

Low boldness: the limb is that sibling's recorded reading narrowed to the row's
lead, and the evidence is the page as built and the count of the fact at
`5da05bc4`.

Against it: the author asked for exactly this in their own words, so ratifying it
spends their scarcest act on a transcription; and it freezes the row's text
against `vocabulary-view`, whose question is how a defined term is presented and
linked wherever it appears and which has not been held, so deferred would let the
row act while the part of this that is still open stays open.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence "A reserved fact's options are vocabulary rather than slugs, and their sentence is what confirming that choice would mean, in the words of the node that defines the fact where the choices are the fact's own vocabulary, and of the node's own prose on the fact where they are written per node, as persistence's are; it is projected from there and never carried by the page for itself", together with the reason given for it in the next sentence, "The authority class is the most repeated decision on the page, and rendered as the two bare words `ratified` and `delegated` it told the author nothing they did not already have to know." The author's last sentence reverses that reason for the authority fact, and the same rule governs `existence`, whose `keep` and `prune` are the other vocabulary fact, so the sitting has to say whether the answer is about `authority` alone or about vocabulary facts as a class. This question rests on `what-an-option-row-carries`, which decides that a row leads with a short text summary at all; this one says what that summary is where the option is a term. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `optionText` and the glossary lookup it uses for a vocabulary fact's options, and on `renderOption`, which prints the returned sentence as the row's lead.

Cascades: `commons.systems/disposition-graph/dialogue`, whose recommended text says that "An option of the two facts whose options are the record's own vocabulary, `authority` and `existence`, has no subsection at all: its name is a term, and its sentence is the gloss on the defining node", and whose rule that no projection carries a sentence of its own for an option is what makes the gloss the only text available; `commons.systems/disposition-graph/authority`, which carries the glosses on ratified, delegated and deferred and whose own answer is what the verbose descriptions quote; `commons.systems/disposition-graph/vocabulary-view`, on how a defined term is presented and linked; and `commons.systems/disposition-graph/progressive-disclosure`, since the gloss the row drops has to be reachable one step down or not at all.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at the authority fact of `commons.systems/public/agency` and at a node carrying an existence fact, read against the recommended texts of `alignment-page` and `dialogue`, the glosses on `authority`, and `optionText` in the projector, before anything is changed.

### The maieutic movement, 2026-09-07

The periagogic stage's object was read by the unit of 2026-09-05, whose report is
the sixth of its ten items. It found the author's observation standing whole: the
row's lead for an authority option is the full gloss sentence from the defining
node, printed for all three options on every node, and the bare level name appears
nowhere on those rows since `87e4b24e` struck the handle span, `data-option` on
the radio being the only place it survives. It found the parent's clause amended
on 2026-09-05 to record the author's request and to mark itself as standing only
until this node rules, with the operative sentence unchanged and the projector
implementing it. The stage is passed on the author's words of 2026-09-07 rather
than in dialogue: "before stopping for confirmation, and ensure
alignment-page-observations is progressed up to confirmation and included in the
list of reconciliation for alignment/review/survey/artifact."

No probe is owed. The question the periagoge would have put — does the direction
reach `existence` as well as `authority`? — is a candidate answer to this node's
own question, which under `probe-or-node`'s test makes it an option and not a
probe, and both candidates are already on the fact: `term-at-the-first-level`
reaching the class and `authority-alone` reaching one fact. The author named the
authority fact, `dialogue` states one rule for the two together, and this answer
takes the class; nothing the author has said chooses between them, and the choice
is put to them as the fact's two options.

What the record says. The parent's answer holds two clauses a ruling here reaches,
located by their words: the vocabulary sentence, "A reserved fact's options are
vocabulary rather than slugs, and their sentence is what confirming that choice
would mean", whose second half this answer moves one level down and whose first
half and projection rule it keeps; and the reason beside it, "The authority class
is the most repeated decision on the page, and rendered as the two bare words
`ratified` and `delegated` it told the author nothing they did not already have
to know", which the parent has already marked as standing only until this node
rules and which this answer answers rather than deletes. `dialogue`'s rule that a
vocabulary option's sentence is the gloss on the defining node is cited and not
amended, so nothing here reaches that node's answer and nothing is entered in
`depends` for it. Among the siblings, `what-an-option-row-carries` is in
`depends` and decides that a row leads with a sentence at all and what marks sit
beside it; this answer says what that lead is where the option is a term, and adds
no mark. `how-a-fact-is-headed` is what makes a bare term legible, since the
fact's heading under that answer is the name linked to the node that defines it;
the two are stated as complements and neither depends on the other, since each
holds whichever way the other rules.

The tradition surfaced, and it is one reading, whose `bears` entry on the reading
node already stands and whose relation this amendment moves.
`commons.systems/disposition-graph/progressive-disclosure`, whose recommended
text holds that the tradition has three parts, its shape, an interface showing a
few things first and putting the rest one step away; its criterion, frequency and
importance of use; and its guarantee, that what is deferred stays discoverable
and is never lost. The shape and the guarantee are met exactly here, and the
guarantee is why the gloss goes to the drill-down rather than off the page. The
criterion is not met, and the relation is diverged for that reason. The reading's
recommended text says why it cannot travel: "a decision put to the author is not a
detail whose frequency of use could be measured, the page having one reader." The
measure this answer takes is not frequency of use at all but repetition across
nodes — the same three sentences printed on 134 of the 141 node files of both
graphs — which is a property of the record and not of the reader's habit, so the
answer re-reads the tradition's criterion rather than applying it. The earlier
draft recorded the relation as adopted and claimed the criterion applied
unchanged; the clean-context reading of 2026-09-07 found that it does not, and
the entry at `disposition/disposition-graph/progressive-disclosure.md:50-53`,
written on 2026-09-06 at `8a672c17`, moves from `adopted` to `diverged` with this
amendment.

What the implementation does today, at the loci a ruling here changes.
`optionText` (`packages/disposition/derive.mjs`) returns the gloss of the
term for an option of a vocabulary fact, with the id of the defining node;
`renderOption` (`packages/disposition/project.mjs`) prints
`firstSentences(said.text)` as the row's lead, capped at `CHOICE_LEAD_CHARS`, 400
characters; and the drill-down's body is `restOf`, in the same file, which
returns nothing for a one-sentence gloss, so the gloss appears on the row and
nowhere else. Measured at `5da05bc4`, 134 of the 141 node
files of both graphs carry an authority fact and 6 carry an existence fact, so the
three authority glosses are the most repeated text on the page.

The clean-context reading of this recommendation is owed before the author rules.

### Clean-context review, 2026-09-07, of 2535cb58

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `term-at-the-first-level`.

Findings:

- ## Answer, first paragraph, against `commons.systems/disposition-graph/what-an-option-row-carries`, which this node names in its own `depends`. This answer has the row lead with the option's name; the node that owns what a row carries says the row carries the name nowhere and that a bare name is a defect. Its answer reads "A row leads with what the option would answer, in the sentence the record holds for it, and carries the option's name nowhere", and it goes on: "Where the record holds none for one yet, the row falls back to the bare name, and that fallback is the projector's defence against incomplete data rather than a form this answer or the parent provides for ... so a bare name on the page is a record not yet written and a defect to be found." The parent says the same and gives the reason: "carries the option's name nowhere on the row: the name is how a ruling is stored and the sentence is the decision, and the author's words of 2026-09-04 strike the id-shaped string from the row." Under this answer the page prints the bare name as the lead on three rows of every one of the 134 nodes that carry the authority fact, so an executor holding both texts cannot tell whether those 402 rows are the required form or 402 defects to be found. The Account's reconciliation -- "`what-an-option-row-carries` is in `depends` and decides that a row leads with a sentence at all and what marks sit beside it; this answer says what that lead is where the option is a term" -- does not reach it, because the sibling's clause is about the name and not only about the sentence. The reconciliation is available and this answer should make it in the Answer itself: on a vocabulary fact the option's name is not an id-shaped slug but a term the record defines, so the sentence the record holds for that option and the name of that option are the same string, and the parent's reason for banishing the name -- that it is how a ruling is stored -- does not reach a term. Say that, and record the exception as an option on `what-an-option-row-carries` so its "carries the option's name nowhere" and its "a bare name on the page is a record not yet written and a defect to be found" are amended with it rather than left contradicting this page.
- ## Answer, second paragraph, and ## Account. `dialogue`'s sentence is cited as the record's standing division when it is that node's recommended text alone. The draft says "That division is `dialogue`'s own, in the sentence this answer reads and does not amend", and quotes "An option of the two facts whose options are the record's own vocabulary, `authority` and `existence`, has no subsection at all: its name is a term, and its sentence is the gloss on the node that defines the term." That sentence appears only inside `dialogue`'s `## Recommendation` fence, under the option `every-part-in-the-record`, which no ruling has reached; `dialogue`'s standing answer says of `## Facts` only that it holds "one subsection per fact, in the same order, opening with the reason for its recommendation, and under the answer fact one subsection per option" and draws no vocabulary-fact division at all. The sibling drafted in the same wave marks exactly this status of the same node in terms -- `which-facts-are-listed` writes "That text is `dialogue`'s recommended text, which no ruling has reached, and this answer reads it as direction and not as doctrine" -- so the round cites one node two ways. Suggested edit: say that the division is `dialogue`'s recommended text, read as direction and not as doctrine, and say (as `which-facts-are-listed` does) whether this answer holds whichever way that node rules.
- ## Account, the tradition, against `commons.systems/disposition-graph/progressive-disclosure` as it now recommends. The Account claims "this answer splits by frequency in the tradition's own terms ... That is the one place under this page where the tradition's own criterion applies unchanged", and grounds it on the reading's standing divergence "at `:55` the reading notes that the record splits by boldness rather than by frequency". The reading now recommends `adopted-on-the-levels-diverged-on-the-fold`, whose text drops the boldness divergence entirely and says the opposite of what is claimed here: "The reason the criterion cannot travel here is that a decision put to the author is not a detail whose frequency of use could be measured, the page having one reader." Frequency of *use* by a reader and frequency of *repetition* across 134 nodes are not the same measure, so the tradition is not applying unchanged; the answer is re-reading the criterion, which is permitted but must be recorded as a divergence rather than as an adoption. This is validation 4: a tradition cited must be represented accurately within its recorded support scope. Suggested edit: cite the reading's recommended text, state that the criterion here is repetition across nodes and not frequency of use, and record the relation as diverged, or say why the re-reading is within the tradition's scope.
- ## Account, the `bears` entry. "The tradition surfaced, and it is one reading, recorded here in prose with the `bears` entry on the reading node owed with the ruling." The entry is not owed: it already stands, at `disposition/disposition-graph/progressive-disclosure.md:50-53`, as `- node: commons.systems/disposition-graph/vocabulary-option-summary / fact: answer / option: term-at-the-first-level / relation: adopted`. A finding for the session, on `commons.systems/disposition-graph/progressive-disclosure` and not on this node: that entry stands in the node's own frontmatter but is absent from its `## Recommendation` fence, whose `bears` at `:110-113` carries only `- fact: answer / option: every-fact-every-option / relation: diverged`, so a ruling for that node's recommended option would silently drop both this node's `bears` entry and the one for `three-column-ruling-screen`. The option that would fix it is an amendment to `progressive-disclosure`'s recommended text carrying every `bears` entry the standing frontmatter holds.
- ## Answer, last paragraph, validation 3 (a line cited names what is claimed). Every `packages/disposition/project.mjs` citation in this draft has gone stale: `renderOption`'s lead, cited as `packages/disposition/project.mjs:1490-1492`, is now at `:1502-1505` (the function head is `:1492`); `CHOICE_LEAD_CHARS`, cited as `:1595`, is at `:1607`; `restOf`, cited as `:1607-1613`, is at `:1619-1625`. `packages/disposition/derive.mjs:312-323` for `optionText` is exact and needs no change. The `progressive-disclosure` citations are stale by four: the three-part quote is at `:57`, not `:53`, and the boldness divergence at `:59`, not `:55`. Every one of these was exact at implementation commit `87e4b24e` and at the graph before the `bears` entry above was written; they staled when `cb0e02c6` landed on 2026-09-07. The substance of each claim holds at the corrected line. The same staleness runs through all four drafts of this wave, so it is one reconciliation and not five.
- ## Account, the probe stated as owed. "One periagogic probe is owed and is stated here as a question, to be put when the author is directed to the page: does the direction reach `existence` as well as `authority`?" Under `probe-or-node`'s test that is not a probe but an option: it is a candidate answer to this node's own question, and both candidates are already on the fact, `term-at-the-first-level` reaching the class and `authority-alone` reaching one fact. The rule sends it there in terms -- "it is an **option** where you hold a candidate answer to this node's question viable, whether or not you would recommend it". The record is in the right shape already; what is wrong is the Account calling it a probe owed, which would send a later session to record one and return the node to the maieutic stage for a question the fact already asks. Suggested edit: drop the word probe and say that the question is put to the author as the choice between those two options.
- A finding for the session about the round rather than about this node's text. The four siblings drafted in this wave encode their drafts two different ways. This node and `commons.systems/disposition-graph/which-facts-are-listed` put the draft in `## Answer` with `stands` naming it and no `## Recommendation` fence; `commons.systems/disposition-graph/how-a-fact-is-headed` and `commons.systems/disposition-graph/when-the-kickback-feedback-shows` carry no `## Answer` at all and put the draft in a fence. Both shapes are legal under `dialogue`, but they are not the same on the page the author reads: where an answer stands, `alignment-page` has the column lead with "the edit this ruling would make" and the row carry "the standing the text has", and where none stands it "shows the whole". So four drafts written in one movement on one parent's observations will be presented to the author in two forms, and on two of them the author will meet a standing-text chip on a draft nobody has confirmed. Whichever shape the sitting means, it should be the same on all four.

On the facts and what they recommend: Two facts. The answer fact recommends `term-at-the-first-level` at low boldness among five options, two passed over with reasons that hold and two viable and not adopted, and `stands` names the recommended option, so there is correctly no `## Recommendation` fence and `## Answer` holds the text. Low boldness is right on the measure `dialogue` gives it, since the first clause is the author's own sentence; what is the AI's, the disposal of the gloss and the reach to `existence`, is named as the AI's in the fact's prose. The authority fact recommends `ratified` at low boldness with the three reserved terms and no option prose, and its `### authority` subsection applies `class-recommendation`'s three limbs by name and says which it found, which is what that node requires; the capture-shaped reading it gives -- that the party proposing to shorten the row is the party whose delegation the row confers -- is the strongest authority reading in this wave. No existence or persistence fact, correctly.

On the viability of the options: Every listed option is viable and the two passed over carry reasons that hold: `gloss-at-the-first-level` is struck by the author's words by name, and `term-and-a-short-gloss` is dominated by the argument that a gloss cut to a row's width loses the clause that distinguishes `ratified` from `delegated`, which is exact. One viable option is missing, and it is the one that would answer this reading's counter-argument without spending the author's direction: `term-with-the-gloss-on-the-first-node-only` -- the row leads with the term everywhere except on the first node of a sitting, or on the first fact of the page's session, where the gloss is printed once so that a reader who does not hold the vocabulary meets it before they meet 402 bare terms. It is not dominated by anything on the list: it takes the author's words where the argument for them is strongest (the same sentence repeated on 134 nodes) and refuses them only where the argument is weakest (the first reading, which the answer itself concedes it loses), and it costs one condition in the projector, which is less than the condition `how-a-fact-is-headed` already asks for on the heading. `term-linked-to-the-definer` is correctly kept viable rather than passed over, since it is the one option that would make the term legible without spending a level.

Strongest counter-argument (moderate): The author's sentence -- "Text summary for each authority option is just the name of the authority level" -- was one sentence about one fact, given while reading one node, and this answer generalises it into a rule for a class of facts on every node the record holds. What it takes off the row is the only text on the page that says what confirming `delegated` would do, and that is the most consequential ruling in the record: it is the act by which the AI's recommendation begins to act below a node without the author being asked again. The record's whole guard against capture is that the author reads what they are conferring at the moment they confer it, and this answer's reply -- that the author already knows -- is a claim about one reader on one day, not a property of the record; the answer itself concedes as much in its `against`. The two things it puts in the gap are real but both are one click away, and the nearer of the two, the linked heading, is not yet ruled and belongs to a sibling whose own recommendation leaves two of four headings unlinked.

The session's reply: Accepted on all seven, each verified at its locus on the main thread: what-an-option-row-carries says the row carries the option's name nowhere and a bare name is a defect, and this answer leads 402 rows with one; dialogue's division is its recommended text and is cited as standing; the tradition's criterion is re-read as repetition across nodes and is recorded as adopted; the bears entry stands at progressive-disclosure since 8a672c17; every project.mjs line is stale since cb0e02c6; the probe the account calls owed is the choice between the fact's two options; and the four siblings encode their drafts two ways. The amendments owed: the answer states the reconciliation the reading offers, that on a vocabulary fact the option's name is a term the record defines and its sentence is the same string, so the parent's reason for banishing the name does not reach it, recorded as the option a-term-is-its-own-sentence on what-an-option-row-carries, source this node; dialogue's sentence cited as direction and not doctrine, in which-facts-are-listed's words; the tradition cited to its recommended text, the criterion named as repetition and the relation on progressive-disclosure moved to diverged; the account's bears sentence corrected; citations by function; the probe restated as the choice the options put; and the option term-with-the-gloss-on-the-first-node-only recorded, source review, viable and not adopted, since which node is first in a sitting is no fact of the record and the linked heading is the record's own device for the first reading. The two encodings of the wave's drafts are recorded as an option on dialogue, source review, and no node is re-encoded in this movement. The counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.

### The reading of 2026-09-07 applied, 2026-09-07

The reading forwarded to the author's ruling at moderate strength, with seven
findings and no probes. Its verdict, its strength and the pin of the
recommendation it read are in `review` above, written by the instrument. All
seven were validated on the main thread at the loci they name and all seven are
accepted. The recommendation does not move: `term-at-the-first-level` stands, on
the author's own sentence that the summary is the name of the level.

The one that changes what the answer says is the first. `what-an-option-row-carries`
holds that a row "carries the option's name nowhere" and that a bare name is "a
record not yet written and a defect to be found", and under this answer the page
prints the bare name as the lead on three rows of every one of the 134 nodes that
carry the authority fact, so an executor holding both texts could not tell
whether those 402 rows are the required form or 402 defects. The reconciliation
the reading offers is made in the answer itself: on a vocabulary fact the option's
name is a term the record defines, and the sentence the record holds for it is the
same string, so the parent's reason for banishing the name — that it is how a
ruling is stored — does not reach a term, and a term is not the fallback that
node calls a defect. The exception is recorded on that node as the option
`a-term-is-its-own-sentence`, with this node as its source, so its two sentences
are amended with it rather than left contradicting this page.

Three were checks of the record against itself. `dialogue`'s division of the four
facts is that node's recommended text, which no ruling has reached, and the draft
cited it as the record's standing division while the sibling drafted in the same
wave marked the same node's status in terms; it is now cited as direction and not
as doctrine, in that sibling's words, and the answer says it holds whichever way
that node rules. The tradition on `progressive-disclosure` was cited to its
standing answer and recorded as adopted, when its recommended text says the
criterion cannot travel to a page with one reader; the criterion this answer takes
is repetition across nodes and not frequency of use, so the relation is diverged
and the standing `bears` entry moves with it. And every citation into
`packages/disposition/project.mjs` was exact at implementation commit `87e4b24e`
and staled when `cb0e02c6` landed on 2026-09-07, which is one reconciliation
across the wave, answered by naming the function and not the line.

The `bears` entry the account called owed already stood, written on 2026-09-06 at
`8a672c17`; the sentence is corrected to say so. A second thing the same finding
saw is not this node's to fix and is carried to the node it belongs to: the entry
stands in `progressive-disclosure`'s frontmatter and is absent from that node's
`## Recommendation` fence, whose `bears` carries one entry only, so a ruling for
that node's recommended option would silently drop this node's entry and the one
for `three-column-ruling-screen`.

The account's owed probe is struck, since the question it stated is the choice the
fact's own options put. The option `term-with-the-gloss-on-the-first-node-only` is
recorded from the reading's viability, viable and not adopted: which node is first
in a sitting is no fact of the record, and the linked heading is the record's own
device for the first reading.

Two things about the round rather than about this node. The four siblings drafted
in this wave encode their drafts two ways — this node and `which-facts-are-listed`
in `## Answer` with `stands` naming the draft, `how-a-fact-is-headed` and
`when-the-kickback-feedback-shows` in a `## Recommendation` fence — and the page
presents the two shapes differently, so on two of them the author meets a
standing-text chip on a draft nobody has confirmed. No node is re-encoded in this
movement; the question is recorded as the option `an-unconfirmed-nodes-draft-shape`
on `dialogue`, source `review`. And the reading's counter-argument closes on the
linked heading being "not yet ruled and belong[ing] to a sibling whose own
recommendation leaves two of four headings unlinked"; on the same day
`how-a-fact-is-headed`'s recommendation moved to `glosses-written-with-this-ruling`,
under which no heading falls back, so that clause is overtaken. The
counter-argument is the reader's words and is not edited; the change is recorded
here, where the author reads it beside the row.

The amended answer owes its re-reading, and the node returns to the review stage.

### Clean-context re-reading, 2026-09-07, of 01059350

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `term-at-the-first-level`.

Findings:


On the facts and what they recommend: The diff adds one new viable option to the answer fact, `term-with-the-gloss-on-the-first-node-only` (source review, ref 2026-09-07), without changing `recommends` (still `term-at-the-first-level`), boldness (still low), or `stands`; the answer fact's `against` text is unchanged in substance. The authority fact is untouched: still `recommends: ratified`, boldness low, with a `review` block newly recorded in frontmatter carrying the previous reading's verdict, strength, pin and its own `against`. No existence or persistence fact, unchanged.

On the viability of the options: Every option remains viable. The new option `term-with-the-gloss-on-the-first-node-only` is recorded viable-and-not-adopted with the reasoning the previous reading itself supplied (it is not a fact of the record which node is first in a sitting, and the linked heading already serves the first reading), which I hold sound.

The review found no strong counter-argument.

The session's reply: Forwarded with no finding. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 01059350

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (weak): The answer's reply to the record's own reason for the gloss is the fact's heading, "which under `how-a-fact-is-headed` is the fact's name linked to the node that defines it", and that sibling's recommendation itself turns on two glosses not yet written on dialogue and two bare `defines` entries not yet released on node and transience. This node names the sibling in prose and not in depends, so the row can be ruled bare before the heading it leans on can resolve; in that interval a reader who does not hold the vocabulary meets three words and no route, which is exactly the state the fact's own case against describes.
