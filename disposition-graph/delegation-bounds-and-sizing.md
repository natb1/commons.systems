---
question: Which parts of the delegation rule must be ratified, and which sizing is the AI's?
stage: review
facts:
  - name: answer
    options:
      - name: ratify-the-bounds-delegate-the-sizing
        source: review
        ref: "2026-09-05"
      - name: one-class-for-the-whole-rule
        source: commons.systems/disposition-graph/delegation
        ref: "2026-09-03"
      - name: sizing-moves-to-its-own-node
        source: review
        ref: "2026-09-05"
    recommends: sizing-moves-to-its-own-node
    boldness: high
    stands: sizing-moves-to-its-own-node
    against: "The division is proposed by the party it benefits, and moving it to a node of its own does not change who proposed it. The AI draws the line between what constrains it and what pays it, writes both enumerations, and expects the author to rule delegated on the half it wrote for itself; splitting the text is a cleaner encoding of the same asking. A single ruling on the parent has the merit that the author sees the whole rule at one moment and can refuse the sizing along with the bounds, where a node of its own lets the sizing drift out of the author's sight one right-sizing at a time, which is the drift the delegation is supposed to make cheap. And the split has a cost the single ruling does not: once the sizing is a node, an amendment to it never passes under the author's eye again."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
review:
  verdict: kickback
  strength: strong
  date: 2026-09-05
  of: 5d4dbbdffd1de883b1f8c052c463aaf5ec0fa1a5
  commit: 9d84af4f142c596b754a573f1d83fd7b9446edd7
  against: "The division's own criterion defeats the half it is drawn to protect. The draft justifies the split by what a wrong answer costs — \"a wrong sizing is paid in tokens and is paid back the next time the AI reads its own measurement\" — but the sizing it hands over includes the model the alignment session's main thread runs on, which the parent's answer sets at \"the most capable model at full effort\", and the alignment interview is the only check the record has on the AI. A wrong choice there is not paid in tokens and is not paid back; it is paid in a weaker dialectic, by the party the dialectic exists to check, which is precisely the capture limb of `class-recommendation`'s test that the draft invokes for the other half. The same holds for the review's model, which `review-model` puts to the author for ratification in the author's own words of 2026-09-04. So the sizing half, described as \"which model each kind of work runs on\", sweeps in the decisions the ratified half exists to keep out of the AI's hands, and the author would be asked to ratify a rule that hands the AI the dial on its own supervision."
form: rule
tier: global
under:
  - commons.systems/disposition-graph/delegation
depends:
  - commons.systems/disposition-graph/class-recommendation
---
## Answer

The sizing leaves the rule. `delegation`'s answer keeps the bounds and is
ratified whole; the clauses that size a unit move to a node of their own beneath
it, carrying their own authority fact, and a ruling of delegated on that fact is
what would make the sizing the AI's.

The bounds are the clauses whose violation writes the record from outside the
dialogue, quoted from `delegation`'s answer as they stand there: "A subagent
never runs state-changing version control, never edits a node or the record's
scaffolding, writes only the files its brief names, and works only in the
worktree it was given"; "Every investigation whose context is verbose is a unit
whatever its size: debugging, driving a browser, reading logs, transcripts, or
diagnostic output, and surveys"; "A unit is one deliverable with a written
contract, inputs, outputs, the files it may write, and its error behaviour, with
a test or a verifiable output; a unit that needs a second contract is two
units"; "The subagent reports a conclusion and the exact commands it ran; the
main thread reads the conclusion and never the context"; "A reconciliation
session is bound toward the record as the work-loop node bounds it, and that
node owns the bound; a subagent never edits a node"; and "The alignment session's
main thread holds the interview and the record ... and it runs on the most
capable model at full effort." The last of those reads as sizing and is not: the
alignment interview is the only check the record has on the AI, so a wrong model
there is not paid in tokens and is not paid back, it is paid in a weaker
dialectic by the party the dialectic exists to check. That is the capture limb,
and it stays with the bounds.

The sizing is what remains, and it is what the author's words of 2026-09-03 and
of 2026-09-04 ask the AI to decide rather than what they have already given it:
which model each kind of work runs on, what effort a brief states, and where the
line between a lookup and a unit falls in a particular case. Those words are
dialogue and not a ruling, and a ruling of delegated on the new node's authority
fact is what would make the decision the AI's. The clause reaches the sizing
clauses of `delegation`'s own answer and no further: a model another node's
answer fixes is that node's and moves by that node's class, which is where
`review-model`'s answer on the readings and `decomposition`'s answer on a
sitting's units live.

Why a node and not a division of one text: a ruling is recorded per fact, and
`delegation` has one answer fact, so there is no act by which the author ratifies
part of it. Nothing may say how far a parent's ruling reached but the parent's
own facts, since authority narrows on the way down and never widens. Moving the
clauses is what makes the division recordable by the machinery the record
already has.

## Rationale

The author's two utterances on sizing are exact and they are about sizing, and
neither confers anything. On 2026-09-03, on `work-loop`: implementation is
delegated, "each bite type gets a skill with 'appropriate' recursive subagents
('appropriate' is open question)". On 2026-09-04, on `viable-options`:
"bootstrap authority granted - delegate to subagents with righ-sized models and
effort level (opus, sonnet) when it would result in token efficiency". The first
says in its own words that the question is open, and `work-loop`'s account reads
it the same way. The second is a bootstrap grant, which `authority` holds is
given for one named reconciliation of one unanswered node and is never carried
over; the author's announcement of the same day scoped it to the nodes of that
sitting. So neither is a delegation, and an earlier draft of this node that
called them one asserted a standing class on words that confer none, which is
the reading `authority` forbids by name. What they are is the best evidence the
record has of what the author would rule, which is why the recommendation is to
put the question to them in a form a ruling can answer.

`class-recommendation` supplies the test, and applied to `delegation`'s answer it
sorts the clauses into two kinds: those whose violation is capture-shaped or
irreversible, and those whose cost is tokens and is paid back the next time the
AI reads its own measurement. The parent's single answer fact cannot record two
classes, and the record has already refused the alternative that would let it:
`authority` passed `clause-level-ratification` over on the ground that the facts
encoding discharges it, a ruling being recorded per fact. A child node naming
which clauses of its parent's ruling reach it is that same idea returning as
prose, and it runs against `ocap-attenuation`, the reading adopted on
`authority`'s recommended option, under which a holder passes on a strictly
weaker reference and never a stronger one. That is why the answer moves the text
instead of dividing the ruling.

The cost is a third node, an amendment to `delegation`'s answer, and a boundary
that has to be read before a clause is written into either. The boundary itself
follows the escalation: a clause that cannot be placed on one side is placed with
the bounds and the question is asked. What the record loses is the single moment
at which the author sees the whole rule, which the case against names and the
alternative option keeps.

## Facts

### answer

`sizing-moves-to-its-own-node` is recommended at high boldness, which in this
record means low confidence. What the option gets right is the encoding: it is
the only one of the three the record can carry, since a ruling is per fact and
nothing below a node may say how far its ruling reached. What it does not get
right is the ground for the delegated half, which is the AI's reading of two
utterances the author made about something else, one of which says in its own
words that the question is open. The enumeration of which clauses are bounds
rests on no words of the author's at all, and the case against is on the fact
and is unanswered: the party that draws the line is the party the ratified half
constrains, and moving the sizing to a node of its own makes an amendment to it
something the author never sees again. `ratify-the-bounds-delegate-the-sizing`
and `one-class-for-the-whole-rule` stay live beside it.

#### ratify-the-bounds-delegate-the-sizing

The division is drawn in prose on this node: `delegation`'s answer keeps both
kinds of clause, this node enumerates which of them a ruling of ratified on the
parent reaches, and the AI moves the rest on its own judgment. It asks for less
change to the record than moving the text, and it keeps the whole rule in one
place where a reader meets both halves together. What it costs is that the
record cannot express it: a ruling is recorded per fact, `delegation` has one
answer fact, and `authority` holds that authority only narrows on the way down,
so a child saying which clauses of its parent's ruling reach it widens from
below. It was this node's recommendation until the reading of 2026-09-05 and it
is kept viable because the author may accept the prose division rather than pay
for a node, in which case the encoding question is the option
`authority-per-clause-by-a-child-node`, recorded on `authority` and unruled.

#### one-class-for-the-whole-rule

One ruling on `delegation`'s authority fact governs the rule entire, as it does
today: the author ratifies all of it or delegates all of it, and the sizing
follows whichever they choose. It keeps the record simpler by one node and puts
the whole rule in front of the author at one moment, which is the merit the case
against this node's answer names. It costs the author the thing their own words
asked for, since ratifying the bounds under it means being asked again about
every model and every effort level, and delegating the sizing under it means
delegating the bounds with them. It is the incumbent and it is kept viable
because the author may prefer one ruling to two.

### authority

Ratified, at low boldness. What this node decides is how much of a global-tier
rule reaches the author at all, and the party that would otherwise decide it is
the party whose work the ratified half constrains, which is the capture limb of
`class-recommendation`'s test read on this node itself. Low boldness because
that reading is the record's own rule applied to its own case and the answer
does not turn on a judgment of the AI's beyond it.

## Account

### Minted, 2026-09-05

By the second clean-context reading of `delegation`, which found that the fact
cannot express the division the author's own words ask for. The reading's words,
which stood under `## Disposition` until the reading of 2026-09-05 pointed out
that the section is rendered to the author as their own and holds none of their
words:

> Beside that, the one ruling on the authority fact covers both the
> capture-shaped bounds, where ratified is plainly right, and the sizing of
> units, models and effort, which the author's own quoted words hand to the AI
> twice ("appropriate" is open question; right-sized models and effort "when it
> would result in token efficiency"), so the author cannot delegate the sizing
> without denying the bounds.

The record's own rule is that a decision the author would rule on separately,
and which is not one of the four facts, is a question, and a question is a node
(`dialogue`, `aspects-are-nodes`). The authority fact carries three options and
one ruling, so the division is not an option on `delegation` and is asked here.
The same rule, applied once more, is what the reading of 2026-09-05 used to move
the recommendation: the sizing is itself such a decision, so it is a node too.

This node answers the reading's counter-argument. No option
is moved off the parent: the parent's authority fact keeps its three options and
its recommendation of ratified, and its `against` now cites this node rather
than telling the author they may ask for a division the record does not carry.
No ruling and no class is written: this node stands unanswered at the review
stage with its own reading owed.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Recommended at this reading: `ratify-the-bounds-delegate-the-sizing`.

Findings:

- `## Answer`, third paragraph, and `## Rationale`, first paragraph (validation 2, doctrine; the kickback ground together with finding 2). "The sizing is what the author's words of 2026-09-03 and their grant of 2026-09-04 already hand to the AI" and "The author gave the sizing away twice". Neither utterance hands anything over in the sense the record gives the word. `authority` holds that "Delegated means the author ruled delegated on the authority fact" and that "A class the AI writes for itself is not a grant"; words recorded under `## Disposition` are not a ruling. The 2026-09-04 words are worse ground than the draft treats them as, because they are a bootstrap grant and the draft calls them one: `authority` says a grant is "given in their words and never assumed, never carried over from an earlier grant, and never read from the announcement of one", and `what-acts-during-bootstrap` says it is "given for one named reconciliation of one unanswered node". The announcement the author gave the same day, on `viable-options`, scopes it: "after compaction you will be granted bootstrap authority to reconcile anything materialized from nodes in this sitting". So the sentence quoted asserts a standing delegation resting on a one-sitting grant, which is the reading the authority node forbids by name. Suggested edit: "The sizing is what the author's words of 2026-09-03 and of 2026-09-04 ask the AI to decide, and a ruling of delegated is what would make that the AI's: which model each kind of work runs on, ..." — put the words to the author as the ground for a ruling rather than as a ruling already given.
- `## Answer`, second and third paragraphs (validation 2, doctrine; the kickback ground). "Those are capture-shaped in the sense `class-recommendation` gives the word, and a ruling of ratified on `delegation` reaches them", followed by "The AI moves those [the sizing] on its own judgment ... and does not return to the author for each one". As encoded these cannot both hold. A ruling on `delegation`'s answer fact ratifies that node's whole answer text, whose sizing clauses are among them ("The model follows the kind of work: the smaller model for mechanical tooling ... The effort is stated in the brief"), and `evaluation` holds that changing a ratified answer "takes an interview with the author". The draft supplies no encoding by which a ruling reaches part of a text, and the record's rule runs the other way: `authority` says "A ruling on an ancestor grants the decisions its scope covers to the nodes beneath it, and authority only narrows on the way down", and the reading `ocap-attenuation`, adopted on `authority`'s recommended option `authority-derived`, states it as "a holder may pass on a strictly weaker reference and never a stronger one" and repeats "so authority narrows on the way down, which is the same rule stated for the graph". This draft is a child widening, below its parent, the AI's authority over text the parent's ruling would ratify. The defect is not clerical: the answer has to be redrawn around an encoding the record already has, which is finding 3.
- `## Facts`, `### answer` (the viability judgment; a viable option is missing, and the draft's own citation points at it). The node's `## Disposition` states the rule that decides this: "a decision the author would rule on separately, and which is not one of the four facts, is a question, and a question is a node (`dialogue`, `aspects-are-nodes`)". The draft applies that rule to mint this node and then stops one step short of applying it to the sizing itself, which is exactly such a decision. The missing option, name `sizing-moves-to-its-own-node`, source review, ref 2026-09-05, with prose to this effect: "The sizing leaves `delegation`'s answer and becomes a node of its own — which model and effort each kind of work gets, and where the line between a lookup and a unit falls — carrying its own authority fact, on which a ruling of delegated confers exactly the class of decision the author's words of 2026-09-03 and 2026-09-04 ask the AI to make. `delegation` then keeps the bounds alone and its ruling of ratified reaches all of what remains, so no ruling has to reach part of a text and no child has to say how far its parent's ruling went. It costs a third node and an amendment to the parent's answer, and it buys the division by the record's own machinery, a ruling per fact, rather than by prose in a sibling." This option dominates the recommended one on the encoding: it delivers the same division the parent's own `against` names ("a ruling that divides the bounds, ratified, from the sizing, delegated") and does not require the record to invent partial ratification.
- `## Answer`, third paragraph (validation 3, and the executor test). "which model each kind of work runs on, what effort a brief states" is unbounded, and read as a rule it reaches model choices other nodes own. `review-model` (stage ruling, question "Which model runs the clean-context review's readings?") recommends `fable-for-both-readings`, sourced to the author on 2026-09-04, and recommends `ratified` on its authority fact; `decomposition`'s recommended answer assigns a model to each unit of a sitting in its own answer text. Under this draft an executor would read the review's model, and each unit's model, as its own to move without asking, which is the opposite of what those nodes put to the author, and the brief this reading was launched with says the model "is fixed by the `review-model` node" and "is not yours to re-decide". Suggested edit: bound the clause — "which model each kind of work runs on and what effort a brief states, within the clauses of `delegation`'s own answer; a model that another node's answer fixes is that node's, and moves by that node's class."
- `## Answer`, second paragraph (validation 3, a quotation that is not exact where exactness is the point). The enumeration is what fixes which clauses a ruling of ratified reaches, so it should quote the parent rather than paraphrase it. "the subagent reports a conclusion and the main thread never reads the context" drops half of the parent's clause, which reads "The subagent reports a conclusion and the exact commands it ran; the main thread reads the conclusion and never the context." The commands the subagent ran are what makes a delegated unit auditable, so dropping them leaves an unplaced clause on the very list whose purpose is to place clauses. Two further clauses of the parent are named on neither side — the unit contract ("A unit is one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour") and "The alignment session's main thread ... runs on the most capable model at full effort" — and the residual rule in `## Rationale` ("A clause the AI cannot place on one side is placed on the ratified side") does not save the second, since by this answer's own definition of sizing it is a model choice and so falls to the AI. See the counter-argument. Suggested edit: quote each bound from `delegation`'s answer verbatim, and place the alignment main thread's model explicitly.
- `## Disposition` (validation 1, and the executor test). The section holds no words of the author's: it holds the second clean-context reading of `delegation` and that reading's quotation, opening "Minted on 2026-09-05 by the second clean-context reading of the `delegation` node". Verified that `packages/disposition/project.mjs` renders this section under "The author's words on this node" (line 1642) and "The author's words" (line 1680), so the panel the alignment page leads with would attribute the AI's reading to the author on a node the author has never spoken to. The node is honest elsewhere — `### answer` says the enumeration "rests on no words of the author's" — and the sibling `class-recommendation` had the identical defect, fixed there on 2026-09-05 with its reading recording "The sibling delegation-bounds-and-sizing has the same defect and it is named there rather than fixed from here." Suggested edit: move this text into `## Account` under `### Minted, 2026-09-05`, where the minting note already partly stands, and leave `## Disposition` absent, as on `bootstrap-exit-conditions`.
- Frontmatter, `tier` absent (validation 5, second limb: what the draft presumes materialized). The node carries `form: rule`, and its `### authority` says "What this node decides is how much of a global-tier rule reaches the author at all". But `packages/disposition/project.mjs` line 177 writes a rule file only for a global-tier node (`if (node.tier !== "global") continue`), and `.claude/rules/` holds exactly the seven `tier: global` nodes: authority, class-recommendation, delegation, evaluation, materialization, session-context, what-acts-during-bootstrap. So on the day this answer is ruled, the session that reads `.claude/rules/delegation.md` — the rule this node divides — is told nothing about the division, and an executor reading only the rules would apply the parent's text undivided. Suggested edit: add `tier: global` and regenerate `.claude/rules/`, as `class-recommendation` did on 2026-09-05; or, if the division is meant to bind only through the parent's own rule file, say so in the answer and have the parent's text carry the citation.
- `## Facts`, `### answer`, and the frontmatter's `boldness: moderate` (validation 3, the boldness). The stated ground is "The two author quotations are exact and they are about sizing, so the delegated half rests on the author's words." The quotations are exact — verified at `disposition/disposition-graph/work-loop.md:97` and `disposition/disposition-graph/viable-options.md:125` — but one of them says the matter is open, not settled: 'each bite type gets a skill with "appropriate " recursive subagents ("appropriate" is open question)'. `work-loop`'s own account reads it the same way: "what makes a subagent, a model, and an effort appropriate is the open question the delegation node's draft answers on the AI's judgment, and the author's words leave it open." Words that leave a question open are not words that answer it, so the delegated half rests on the AI's reading of the author's silence as much as the capture half rests on its reading of `class-recommendation`. Since high boldness is low confidence here, `high` is the honest mark. Suggested edit: `boldness: high`, with the reason restated as the record's own reading of those words.
- Validation 15, merge: the answer is a new answer to a question the record already asks, on another node. `authority` carries the option `clause-level-ratification` (source review, ref 2026-09-03) marked passed with the reason "discharged by the facts encoding, under which a ruling is recorded per fact", and `growth` carries `partial-ratification`, whose prose says "It raises the question whether a clause can carry a stamp separately from its node, which belongs to authority." This draft divides one fact's answer text into two authority regimes, which is that question answered the other way, and neither the answer nor the rationale mentions it. The review proposes and never edits another node; for the session: record on `authority`'s answer fact an option named `authority-per-clause-by-a-child-node`, source commons.systems/disposition-graph/delegation-bounds-and-sizing, ref 2026-09-05, carrying prose to this effect — "A ruling stays per fact, and a child node may name which clauses of its parent's answer that ruling reaches, so a rule whose clauses differ in kind can be ratified in part without a stamp on a clause. Raised by the sizing division the delegation-bounds-and-sizing node draws; it is the case the passed-over `clause-level-ratification` did not consider, since it is a node and not a stamp that does the naming." If the session instead holds the two distinct, this node's rationale should say how, since as it stands the record holds one question answered twice in opposite directions.
- A finding about another node, in prose (the review proposes and never edits). `delegation`'s authority-fact `against` says of this node "a ruling here is on what remains after that one", but `delegation`'s `depends` names only `commons.systems/disposition-graph/viable-options#passed-over-options-stay` and `commons.systems/disposition-graph/work-loop`, so nothing in data holds its ruling behind this one, while `delegation` stands at the ruling stage with a forward pinned on 2026-09-05. Per the `dialogue` node, `depends` is "the ids of nodes still on the frontier whose rulings must come before this node's", and the page is meant to "refuse to put a question before the one it rests on". For the session: add `commons.systems/disposition-graph/delegation-bounds-and-sizing` to `delegation`'s `depends`. The obligation runs one way only, so this node's own `depends` on `class-recommendation` is right as it stands and should not gain the parent.

On the facts and what they recommend: The answer fact recommends `ratify-the-bounds-delegate-the-sizing`, a listed option, which is also what `stands`, so the absence of a `## Recommendation` fence is correct; the node carries no `review` block, so no pin is stale, and `node packages/disposition/validate.mjs disposition` reports ok at 142 nodes. Boldness `moderate` is understated and `high` is the honest mark (finding 8), since the ground given for it — that the author's words settle the delegated half — is the reading the record's own `work-loop` account contradicts. The authority fact recommends `ratified` at low boldness on the capture limb and carries the `### authority` reading `class-recommendation` requires, which is right on its substance; there is no existence and no persistence fact, correctly, since no prune is proposed and the recommendation changes no shape, but the frontmatter is missing `tier` (finding 7).

On the viability of the options: Both listed options are viable and neither is dominated: `ratify-the-bounds-delegate-the-sizing` is the division the parent's own case against asks for, and `one-class-for-the-whole-rule` is the incumbent the author may prefer for putting the whole rule in front of them at one moment. A third is missing and is the one the author will otherwise never rule on: `sizing-moves-to-its-own-node`, which takes the sizing clauses out of `delegation`'s answer into a node of their own with its own authority fact, so that a ruling of delegated confers the class by the record's own machinery instead of by a child's prose about how far the parent's ruling reached; its prose is given in finding 3. On the record's criteria it dominates the recommended option, which asks the author for a division the encoding cannot record.

Strongest counter-argument (strong): The division's own criterion defeats the half it is drawn to protect. The draft justifies the split by what a wrong answer costs — "a wrong sizing is paid in tokens and is paid back the next time the AI reads its own measurement" — but the sizing it hands over includes the model the alignment session's main thread runs on, which the parent's answer sets at "the most capable model at full effort", and the alignment interview is the only check the record has on the AI. A wrong choice there is not paid in tokens and is not paid back; it is paid in a weaker dialectic, by the party the dialectic exists to check, which is precisely the capture limb of `class-recommendation`'s test that the draft invokes for the other half. The same holds for the review's model, which `review-model` puts to the author for ratification in the author's own words of 2026-09-04. So the sizing half, described as "which model each kind of work runs on", sweeps in the decisions the ratified half exists to keep out of the AI's hands, and the author would be asked to ratify a rule that hands the AI the dial on its own supervision.

The session's reply: Kicked back to the maieutic stage at strong strength with ten findings, every one
validated at its locus on this thread and every one accepted. The two that carry
the kickback are right and they are the same defect seen from two sides: the
answer rested a standing delegation on words that confer no class, and asked the
author for a division the encoding cannot record.

Finding 1. Accepted, and it is the more serious of the two. "The sizing is what
the author's words of 2026-09-03 and their grant of 2026-09-04 already hand to the
AI" asserts a delegation the record does not hold. `authority` is explicit twice
over: delegated means the author ruled delegated on the authority fact, and a
class the AI writes for itself is not a grant; words recorded under
`## Disposition` are dialogue and not a ruling. The 2026-09-04 words are worse
ground still, because they are a bootstrap grant and the draft names them one --
"given for one named reconciliation of one unanswered node", "never carried over
from an earlier grant", and the author's own announcement that day scoped it to
the nodes of that sitting. A one-sitting grant read as a standing delegation is
the reading the authority node forbids by name. The answer now puts those words
to the author as the ground for a ruling and never as a ruling already given.

Finding 2. Accepted. A ruling is recorded per fact, and `delegation` has one
answer fact whose text holds both kinds of clause, so there is no act by which the
author ratifies part of it. `authority` passed `clause-level-ratification` over
for exactly this reason -- "discharged by the facts encoding, under which a ruling
is recorded per fact" -- and holds that authority only narrows on the way down,
which `ocap-attenuation`, adopted on its recommended option, states as a holder
passing on a strictly weaker reference and never a stronger one. A child node
saying which clauses of its parent's ruling reach it is a child redistributing
what its parent's ruling did, which is the movement the record forbids. The
finding is right that this is not clerical and the answer had to be redrawn.

Finding 3. Accepted, and the missing option is now the recommendation. The node's
own `## Disposition` cited the rule that decides it -- a decision the author would
rule on separately, which is not one of the four facts, is a question, and a
question is a node -- and then stopped one step short of applying it to the
sizing. `sizing-moves-to-its-own-node` is added with the reading's prose and
recommended: the sizing clauses leave `delegation`'s answer for a node of their
own with its own authority fact, so a ruling of delegated there confers the class
by the record's machinery, `delegation` keeps the bounds alone and its ruling of
ratified reaches all of what remains, and nothing has to reach part of a text. It
delivers the division the parent's own case against asks for at the cost of one
node and an amendment to the parent's answer. Verified that the shape holds under
`authority`'s walk: a ruling of ratified on `delegation`'s authority fact stops an
ancestor's delegation at that node alone and the walk continues past it, so a
ruling of delegated on the child's own authority fact is neither blocked nor a
widening. Nothing is moved on `delegation` here: the recommendation says what a
ruling would do, and an unanswered recommendation acts on nothing.

Finding 4. Accepted. "Which model each kind of work runs on" was unbounded and
reached model choices other nodes own: `review-model`, at the ruling stage,
recommends `fable-for-both-readings` sourced to the author on 2026-09-04 and
recommends ratified on its authority fact, and `decomposition`'s answer assigns a
model to each unit of a sitting. The sizing clause is now bounded to the clauses
of `delegation`'s own answer, and a model another node's answer fixes is that
node's and moves by that node's class.

Finding 5. Accepted. The enumeration is what fixes which clauses a ruling reaches,
so it quotes the parent verbatim now instead of paraphrasing it. The dropped half
mattered most of all the drops: "the exact commands it ran" is what makes a
delegated unit auditable, and losing it on the list whose purpose is to place
clauses left the audit trail unplaced. The two clauses named on neither side are
placed: the unit contract goes with the bounds, and the alignment main thread's
model at full effort goes with the bounds too and not with the sizing, which is
the counter-argument's point and is answered below.

Finding 6. Accepted. `## Disposition` held the second clean-context reading of
`delegation` and not a word of the author's, and `packages/disposition/project.mjs`
renders that section under "The author's words on this node" and "The author's
words", so the panel the alignment page leads with would have attributed the AI's
reading to the author on a node the author has never spoken to. This is the defect
`class-recommendation`'s reading named here rather than fixing from there. The
section is gone and its content stands in `## Account` under the minting section.

Finding 7. Accepted. `tier: global` is added and `.claude/rules/` regenerated.
Verified that `packages/disposition/project.mjs` writes a rule file only where
`node.tier === "global"`, and that the seven files there are exactly the seven
global-tier nodes. A session reading `.claude/rules/delegation.md` and nothing
else would otherwise apply the parent's text undivided, which is the state the
finding describes.

Finding 8. Accepted. Boldness moves to high, which in this record is low
confidence. The ground offered for moderate was that the author's words settle the
delegated half, and `work-loop`'s own account reads the same words the other way:
"what makes a subagent, a model, and an effort appropriate is the open question
the delegation node's draft answers on the AI's judgment, and the author's words
leave it open." Words that leave a question open are not words that answer it.

Finding 9. Accepted. The option `authority-per-clause-by-a-child-node` is recorded
on `authority`'s answer fact, source this node, ref 2026-09-05, with the reading's
prose. It is recorded even though the recommendation no longer needs it, because
`ratify-the-bounds-delegate-the-sizing` stays live on this fact and the author may
rule for it, and that option requires the encoding the option describes. The
option is not recommended, so `authority`'s pin and its ruling stage are unmoved.

Finding 10. Accepted. `commons.systems/disposition-graph/delegation-bounds-and-sizing`
is added to `delegation`'s `depends`, which had nothing in data holding its ruling
behind this one while its own `against` said "a ruling here is on what remains
after that one". `depends` is a dialogue key and is stripped from the standing
hash, so `delegation`'s pin does not move. This node's `depends` is left as it
stands, since the obligation runs one way.

The counter-argument is accepted and is what placed the last unplaced clause. The
model the alignment session's main thread runs on is not sizing in the sense this
answer delegates: a wrong choice there is not paid in tokens and is not paid back,
it is paid in a weaker dialectic by the party the dialectic exists to check, which
is the capture limb itself. It is enumerated with the bounds. The same reasoning
sends the review's model to `review-model`, which is finding 4's boundary and not
this node's to take.

### Redrawn after the reading, 2026-09-05

The reading was accepted whole, and two of its ten findings redrew the answer.

The recommendation moves to `sizing-moves-to-its-own-node`, the option the
reading supplied. The old recommendation asked the author for something the
record cannot record: a ruling is per fact, `delegation` has one answer fact, and
a child node naming which clauses of its parent's ruling reach it widens
authority from below, against the rule that it only narrows on the way down and
against `ocap-attenuation`, adopted on `authority`'s own recommended option. The
new one moves the text instead, so the division is made by a ruling per fact and
by nothing else. Verified that the shape survives the walk: a ruling of ratified
on `delegation`'s authority fact stops an ancestor's delegation at that node
alone and the walk continues past it, so a ruling of delegated on the child's own
authority fact is neither blocked nor a widening. Nothing is moved on
`delegation` here -- the recommendation says what a ruling would do, and an
unanswered recommendation acts on nothing.

The claim that the author's words already handed the sizing over is struck from
the answer and from the rationale. They are dialogue, not a ruling; the second is
a bootstrap grant, which is given for one named reconciliation of one unanswered
node and never carried over, and the author's own announcement that day scoped it
to that sitting. What the words are is the best evidence of what the author would
rule, and the answer now says that and no more.

The bounds are quoted from `delegation`'s answer verbatim rather than
paraphrased, since the enumeration is what fixes which clauses a ruling reaches.
The paraphrase had dropped "the exact commands it ran", which is what makes a
delegated unit auditable, and had left two clauses on neither side. Both are
placed: the unit contract goes with the bounds, and so does the alignment main
thread's model at full effort, which is the counter-argument's point -- a wrong
model there is not paid in tokens and is not paid back, it is paid in a weaker
dialectic by the party the dialectic exists to check, which is the capture limb
itself.

The sizing clause is bounded to `delegation`'s own answer. Read unbounded it
reached model choices other nodes own: `review-model`, at the ruling stage,
recommends `fable-for-both-readings` sourced to the author on 2026-09-04, and
`decomposition`'s answer assigns a model to each unit of a sitting.

Boldness moves to high, which in this record is low confidence. The ground given
for moderate was that the author's words settle the delegated half, and
`work-loop`'s own account reads the same words the other way, as leaving the
question open.

`tier: global` is added and `.claude/rules/` regenerated. Without it a session
reading `.claude/rules/delegation.md` would apply the parent's text undivided,
which is the rule this node divides.

`## Disposition` is gone: it held the second clean-context reading of
`delegation` and no words of the author's, and the projector renders that section
under "The author's words", so the alignment page would have attributed the AI's
reading to the author on a node the author has never spoken to. Its content is in
the minting section above.

Two things are recorded on other nodes and are named here rather than left to be
found. `authority` gains the option `authority-per-clause-by-a-child-node`, the
encoding the passed-over recommendation would need, since that option stays live
and the author may rule for it; it is not recommended, so `authority`'s pin and
its stage are unmoved. And `delegation` gains this node in `depends`, which its
own `against` already assumed and its data did not carry; `depends` is stripped
from the standing hash, so the parent's pin does not move either.

The answer was redrawn, so the node returns to the review stage and owes a fresh
reading.
