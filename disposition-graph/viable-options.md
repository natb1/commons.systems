---
question: Is authority a projection of the state of a node's viable options?
stage: maieutic
form: rule
under:
  - commons.systems/disposition-graph/authority
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-04:

> Consider this alternative for unanswered node encoding from a greenfield perspective. Is "unanswered" just an authority - as in no authority granted for reconciliation. Or, more precicely, explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority. Each fact on a node, regardless of authority, has viable options list (possibly length 1) with a) AI recommendation/why b) support or divergence from tradition for each option and c) (if answered) the confirmed choice and why. This would also collapse "proposals". Proposals are just nodes with ratified authority and a fact with confirmed choice that deviates from AI recommendation. If recommendation timestamp is after confirmation timestamp for a ratified node then (facts don't change but) the node is projected onto the alignment frontier for re-confirmation. For each fact, the confirmed choice, the AI recommendation and support divergence from tradition as well as any non-chosen option which is categorized as "viable" by the AI - these are all is persisted after confirmation to mitigate regression. This gives a clear mechanical encoding for ADR style "alternatives considered" documentation and more obvious presentation in the graph browser - what's the confirmed choice and (on drilling down) why that choice was made, what the AI said and why, what tradition says.
>
> In this model "delegated" and "deferred" authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains.
>
> This comes close to re-framing authority as a projection of the state of the viable options list. Evaluate this.
>
> Under this model the prior statement that "reconciliation never edits the graph" is incomplete. Whatever persistent state reconciliation requires for reconciliation operations (if any) is stored outside the graph - true. But, AI has the authority record untracked but viable alternative options and to change its recommendation during either reconciliation or rsi. If the recommendation is on ratified node then that triggers the alignment frontier projection described above. Subject to attenuation/breakout controls - if the change of recommendation is on delegated or deffered node then it changes the shape of the reconciliation frontier.
>
> Progress this dialogue through meiutic and stop before adversarial review.

## Account

### Minted from the author's disposition, 2026-09-04

The words above are one model, and the model is a new answer to several
questions the record already asks: `authority` (who may change an answer, and
what the classes mean), `unanswered` (when a disposition is answered, and what
the alignment frontier holds), `dialogue` (what an unanswered node carries),
`recording` (what the recording removes), `rejected` (how rejected alternatives
are recorded), `readings` (how a tradition's support is recorded),
`work-loop` and `delegation` (whether reconciliation writes the graph),
`evaluation` (what an overrule does), and `rsi`. What binds those answers
together is one premise that no node asks: whether a node's authority is a
stamp written on it or a state read off its options. A premise the author
would rule on separately, and whose ruling makes the rest decidable, is a
question, and a question is a node (`dialogue`, `aspects-are-nodes`). It is
placed under `authority`, whose answer it would rewrite, and under `dialogue`,
whose encoding it would replace. The consequences for the other nodes are
recorded on them as alternatives at the maieutic checkpoint, each naming this
node in `depends`, so that one ruling here settles them and the ruling order
counts it.

The periagogic object is those nodes' pages, read at `origin/disposition`
before anything is drafted, and the implementation their criteria point to:
the reader's schema in `packages/disposition/read.mjs` (`FRONTMATTER_KEYS`,
`FACT_NAMES`, `CONFERRABLE_CLASSES`, `deriveStatus`,
`deriveStandingHash`), the projector's frontier and alignment page in
`packages/disposition/project.mjs`, the two skills under `.claude/skills/`,
and the rule projections under `.claude/rules/`.

The author has directed the dialogue to run through the maieutic movement and
stop before the clean-context review. The periagogic probes are therefore put
in this account, each cited to the record by locus, for the author to answer
on the page or in prose; the AI's evaluation is held out of that section and
enters only in the maieutic one that follows it. The named deviation of the
periagogic conduct, the AI's account put before the author's, is the thing to
watch in a sitting run this way, and the separation of the two sections is how
this one watches it.

### The periagogic movement, 2026-09-04

The conduct: the record at `origin/disposition` is the fixed object, and the
author is turned back to it before the AI's account enters. Each probe below
quotes the record by locus and says what the author's new words would do to
it; none carries a verdict. The author directed the dialogue to run through
the maieutic movement, so the probes are put here together rather than one
per turn, for the author to answer on the page or in prose; the AI's
evaluation is held for the next section. Where a probe turns the author back
to their own ruling of an earlier day, it is because the new words would
change it, and the periagogic object of a disposition sitting is exactly the
reasons a thing was recorded, read before it is undone.

**1. What a deferred answer does today, and who writes it.** `authority`,
Answer: "Deferred means the AI decided within the author's rules and owes the
author a review; until the author rules, a deferred answer is unanswered, as
the unanswered node says." `un-aligned-children`, Answer: "What an unanswered
disposition lacks is authority, not standing. It carries none for
reconciliation, and work may not be grounded in it, unless the author grants
bootstrap authority explicitly." The author, 2026-09-03, on `unanswered`:
"Classify all dispositions as unanswered (the actual status)." The reader
implements it: `deriveStatus` in `packages/disposition/derive.mjs` returns
`answered` only for a ratified or delegated stamp, and `CONFERRABLE_CLASSES`
in `read.mjs` excludes deferred with the comment that it "is what the AI
writes without the author and is never what a confirmation confers". The
record today holds forty-six deferred stamps, every one written by the AI
before the dialogue existed, and under these rules not one of them grounds
work. The new words: "'delegated' and 'deferred' authority mean reconciliation
authority is granted for AI recommendation without requiring confirmation."
The probe: who grants it. If the AI writes deferred for itself, as it wrote
those forty-six, then every recommendation acts the moment it is written and
"unanswered" names nothing the AI would ever leave a node in; if the author
grants it, deferred becomes a class the author confers, which today it is not,
and the forty-six stay unanswered as the author classified them. The record
cannot tell from the words which is meant, and the whole of what "unanswered"
means turns on it.

**2. The expiry the author set on the grant.** The author, 2026-09-03, on
`authority`: "also record the concept of bootstrap authority as an alignment
shim - unanswered nodes may be reconciled by alignment with explicit bootstrap
authority, but that authority expires on bootstrap exit." The shim declared
there liquidates "at the swap of the implementation ref with the main branch,
after which the grant expires and an unanswered node is reconciled only
through the dialectic". The new words: "explicit bootstrap authority required
for reconciliation - in this way bootstrap authority is not a shim, but a
persistent disposition about reconciliation authority." The record already
carries the tension the new words resolve, as `bootstrap-authority-as-class`
on `authority` and `two-kinds-of-shim` on `evaluation`: a shim is applied by
default and this one does nothing until invoked. The probe: whether the
expiry goes with the shim. As a persistent disposition the rule reads that an
unanswered node is reconciled only on an explicit grant, at any time; the
earlier words say the grant itself is gone at bootstrap exit, after which an
unanswered node is reconciled only by being answered. Both cannot stand.

**3. The author's own line on reconciliation and the graph.** The author,
2026-09-03, on `work-loop`: "reconsiliation does not edit the graph. That is
alignment only." and "Since reconciliation does not edit the graph it may need
to persist some other metadata to track reconciliation state." The
clean-context review of that day kicked the node back because its answer still
let a reconciliation session write the graph, and the answer was amended to
what it now says: "a reconciliation session writes the implementation ref and
never the graph. A divergence that needs the author is reported by the session
that found it, with its recommendation, and stays on the frontier, derived and
never stored, until the alignment dialogue records it." `delegation` carries
the same rule with the citation: "A reconciliation session is bound the same
way toward the record: it never writes the graph, which is alignment's alone,
as the author ruled on 2026-09-03 on the work-loop node." The reconciliation
skill states it at line 27. The new words: "the prior statement that
'reconciliation never edits the graph' is incomplete." The probe: where the
line now falls. The new words draw it between operational state, which stays
outside the graph, and decision state, an option found viable and a
recommendation moved, which goes in. What the earlier ruling protected was
that a divergence needs the author before it changes the record; under the new
words a divergence changes the record as an option, and what it may not change
is anything the author confirmed. Whether that is the line, and whether the
write belongs to the reconciliation session alone and never to its subagents,
which `delegation` forbids by name, is the author's to say.

**4. The retraction, read against the re-confirmation rule.** The author,
2026-09-03, on `unanswered`: "The flipping of node I suggested from answered
to unanswered pending confirmation feels like a hack." And the same day: "When
an alternative is pending on ANY node with authority ... the previously
confirmed answer keeps its full authority until an alternative is confirmed."
The new words: "If recommendation timestamp is after confirmation timestamp
for a ratified node then (facts don't change but) the node is projected onto
the alignment frontier for re-confirmation." The probe confirms rather than
questions: the parenthesis says the node keeps its class and its confirmed
choice, and what changes is which frontier lists it. Read that way the new
rule is the retraction kept, with the frontier membership that the record
today derives from the stamp derived instead from two states of one node.

**5. The word "proposal".** The author, 2026-09-03, on `authority`: "A
conflicting answer that arises outside of alignment is a proposal. eg. via
some evidence/signal/instrument/criteria or because a conflict is identified
outside of alignment. The term must not be overloaded - it is technical
vocabulary." And on `dialogue`: "A proposal from ouside alignment opens a
dialogue on its node, yes." The answer on `authority` gives the term two
properties: its origin, outside alignment, and what it opens, the node's
dialogue at the periagogic stage. The new words: "This would also collapse
'proposals'. Proposals are just nodes with ratified authority and a fact with
confirmed choice that deviates from AI recommendation." The probe: the new
words define the term by a state of the node and not by where the conflicting
answer came from, so the origin becomes the source recorded on the option, as
it is on an alternative today; and the new words say "re-confirmation" where
the earlier ruling said the dialogue opens at its first movement. Whether the
author means the ruling alone, with the review before it, or the dialogue from
its periagogic movement, is the difference between a proposal the author rules
on and one the author is turned back to the record for.

**6. Alternatives and facts, one structure or two.** `dialogue`'s
recommended answer keeps two: `alternatives`, "the candidate answers to this
node's own question", and `facts`, "the decisions about the answer that are
not questions under it", of which "three names are reserved and no others are
minted without a ruling here". The author, 2026-09-03: "the revised record is
to carry a decision per aspect. each aspect of a disposition may have choices
that require confirmation. each aspect has a recommendation with confidence."
The sitting that answered those words rejected aspects inside the node and
adopted `aspects-are-nodes`: "A textual decision the author wants to rule on
separately is a question, and a question is a node." The new words: "Each fact
on a node, regardless of authority, has viable options list (possibly length
1)." The probe: whether the answer is itself a fact, its options the candidate
answers the record now lists as alternatives, so that the two structures
become one; and whether `aspects-are-nodes` stands with it, so that the facts
remain the answer and the reserved three and a further decision is still a
child node. Nothing in the new words says a fourth fact is minted, and nothing
says it is not.

**7. What the recording removes.** `recording`, recommended answer, third
step: "the dialogue fields are removed, the facts and their rulings among
them, the Disposition section excepted as the quotes ruling decides."
`dialogue`, Answer: "Confirmed dialogue state folds into the node at the
recording, into the answer, into the rationale as a rejected alternative with
the ruling quoted, or into nothing; unconfirmed, it survives only in version
control." The author, 2026-09-03, on `dialogue`: "confirmed dialogue state is
rendered to the questions and otherwise only exists in git history." The new
words: "the confirmed choice, the AI recommendation and support divergence
from tradition as well as any non-chosen option which is categorized as
'viable' by the AI - these are all is persisted after confirmation to mitigate
regression." The probe: which parts persist and which die. The new words name
the options with their recommendation, their tradition, and the confirmed
choice; they do not name the stage, the review's verdict, the account, or the
author's words, which `quotes` holds separately. The reason the earlier words
gave for folding everything was that a stored copy drifts from the answer;
the new words give a reason for keeping the options, regression, and no reason
for keeping the rest. And `rejected`'s question, "How are rejected
alternatives recorded?", whose sitting favoured prose in the rationale once
the projector was found to read a heading, is answered by the new words
without being named: a rejected alternative is a non-chosen viable option, and
the author's own objection there, that prose under the rationale "seems too
ad-hoc", is what the structure answers.

**8. A reading's relation, to the answer or to an option.** `readings`,
Answer: "A reading answers the question what a tradition says about the answer
above it: its source is the primary text and locus, its relation is adopted,
diverged, or chosen over." The author, 2026-09-02: "A disposition in the
greenfield graph may reference tradition as either supporting by or diverging
from disposition. That reference (supporting or diverging) may be ratified ...
delegated ... or deferred." Thirteen readings stand in the record, twelve
adopted, one diverged, none chosen over. The new words: "(b) support or
divergence from tradition for each option." The probe: the reading stays a
node with its own stamp, which the author ruled; its relation today is to the
answer, and under the new words a tradition bears on each option, so that
"chosen over" is a tradition adopted on an option that was not chosen. Whether
the relation moves from the node to the option, with the reading unchanged, is
the question the new words put to `readings`.

**9. What a moved recommendation does on a delegated node.** `evaluation`,
Answer: "Delegated and deferred answers need no interview: the AI may overrule
them on its best judgment, and every such overrule enters the author's review,
a delegated answer overruled becoming deferred and a deferred answer staying
deferred." `authority`, Rationale: "Attenuation: authority only narrows as it
is handed down, never widens, so a breakout would have to be written up the
tree, and nothing writes up." The new words: "Delegated means the node is
removed from the alignment frontier", and "Subject to attenuation/breakout
controls - if the change of recommendation is on delegated or deffered node
then it changes the shape of the reconciliation frontier." The probe: under
`evaluation` a changed recommendation on a delegated node brings it back to
the author as deferred; under the new words it stays off the alignment
frontier and re-shapes the reconciliation frontier instead, within controls
the words name and do not describe. The record's attenuation is that a
delegation covers a class of decision and a change outside that class is not
the AI's to make; whether the controls the author means are that ceiling, so
that a recommendation moves freely inside the delegation and a move that would
leave it returns the node to the author, is what the words leave open.

**10. The pin, by clock or by content.** The author, 2026-09-03, on
`dialogue`: "This probably means we need some sort of pinning of the
recommendation as well (if that's not already recorded)." The record pins by
content: `recommendation.amends` and `review.of` are hashes of the text read,
and a fact's `ruling.of` "the hash of the choice text ruled, so that a later
amendment to the node shows the ruling as given against text that has moved".
The new words: "If recommendation timestamp is after confirmation timestamp".
The probe: whether the timestamp is the pin or a way of saying it. A clock
cannot tell a recommendation re-affirmed after the ruling from one that
changed, and the author delegated the encoding's details on 2026-09-03; the
question is whether "after" means later in time or different in content.

**11. The loop on itself.** `rsi` carries the author's one word and three
alternatives, none recommended, among them `rsi-as-loop-on-itself`, "the work
loop applied to the work loop, its instruments read against itself", and
`bound-by-ratification`, "every change to a node the loop uses to change
itself requires the author's ratification." The new words: "AI has the
authority record untracked but viable alternative options and to change its
recommendation during either reconciliation or rsi." The probe: the words give
rsi the same authority over the record as reconciliation, which reads rsi as
the loop on itself; and under the re-confirmation rule a recommendation moved
on a ratified loop node acts on nothing until the author confirms it, which is
the bound that alternative asks for, while on a delegated loop node it acts.
Whether the author means those loop nodes to be delegated at all is the
question that bound puts.

The classification the `dialogue` node asks a periagogic movement to make,
whether the disposition is a new question or a new answer to one the record
already asks, is given in the minting section above and is not repeated: it
is a new answer to eleven questions bound by one premise no node asks, and the
premise is this node.
