---
question: How is a response to a probe treated?
stage: periagogic
facts:
  - name: answer
    options:
      - name: common-treatment-with-alignment-input
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/33
          - words/2026-09-08/36
    recommends: common-treatment-with-alignment-input
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Facts

### answer

The recommendation is `common-treatment-with-alignment-input`, at low boldness.
Low because the option is the author's own words of 2026-09-08 at
`words/2026-09-08/33` and the AI adds nothing to them but the placement; the
content the option would carry is owed and is what the node's design must write,
which is why this node stands at the periagogic stage with the option recorded
and its content not.

The question exists because the record has a sequencing for alignment input and
had no statement that a probe response is one. `author-questions` says where a
probe is asked and when it is worked; `alignment-order` says what order input is
taken in; `movements` says what a sitting does with input once it has it, the
periagogic movement establishing grounding and the maieutic eliciting what the
author means. None of them says which of those an answer to a probe gets. The
default reading, and the one a sitting falls into, is that a probe response is a
discharge: it closes the probe, the sitting writes the discharge reason, and the
input is consumed by the closing. That reading loses the disposition inside the
response, which is the defect this node exists to fix.

#### common-treatment-with-alignment-input

A response to a probe is alignment input and takes the same sequencing as
alignment input arriving any other way: it is recorded, and the disposition
articulated in it is grounded periagogically and understood maieutically in its
own right, recursively, so that a disposition first stated in a probe response is
not left standing only as a reason for closing a probe. Alignment input via
`/align` and alignment input via a probe response have one treatment.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is
owed.

**Content.**

```markdown
---
question: How is a response to a probe treated?
form: rule
under:
  - commons.systems/disposition-graph/author-questions
---

## Answer

A response to a probe is alignment input and takes the same sequencing as
alignment input arriving any other way.
```

### authority

The recommendation is `ratified`, at low boldness.

The reading `class-recommendation` calls for: the capture-shaped limb. The party
that would set this answer is the AI, and the answer decides whether the AI must
carry a disposition of the author's through the full sequencing or may consume it
as a discharge reason. Consuming is cheaper for the AI in every case and the
author has no view of the difference from the outside, since a closed probe looks
the same either way. That is the shape the limb names. The irreversible limb is
touched and is not the ground: a disposition lost in a discharge reason can be
recovered from the ledger by a later reading, so what is lost is the sequencing
and not the words.

## Account

### Queued, 2026-09-08

Minted in the alignment sitting of 2026-09-08 under the grant at
`words/2026-09-08/2` as refined at `words/2026-09-08/22`, from the author's words
at `words/2026-09-08/33`. Placed under `author-questions` because that node owns
the probe: what one is, what it carries, where it is asked, and when it is worked.
What happens to the answer is the next question down from what happens to the
question, so it refines that node rather than `movements`, which owns the
sequencing this answer invokes but not the object it applies it to.

The words are given as an observation about the sitting and a rule for the record:
"This session seems to be doing that implicitly, but note that alignment input via
`/align` has common treatment to alignment input via probe response." The
observation is accurate for this sitting and is exactly why the rule is needed.
Doing it implicitly means doing it when the sitting notices, and the sitting had
already failed to notice once on this record: the author's words of 2026-09-08 at
`words/2026-09-08/29` were a probe response carrying a disposition on what ends a
round, and they were recorded only inside the discharge reason of the probe they
answered, where nothing could be ruled on them and the validator reported them as
referenced by no option. `round-termination` was minted at `38dd0464` to correct
that, one node and one sitting after the loss. Under this node's recommendation
the correction would not have been a correction; it would have been the treatment.

The recursion the words name is the substance and not a flourish. A probe response
articulates a disposition; that disposition needs its own periagogic grounding and
its own maieutic understanding; establishing them raises probes of its own; those
probes get responses; and the responses are alignment input again. The record has
no clause bounding that recursion and needs none, for the reason the author gives
at `words/2026-09-08/32`: the exchange blocks on the author, so it cannot run
away, and a disposition that is accumulating probes is a disposition to refine
rather than a list to cap.

The periagogic object, to be read before anything is proposed: `author-questions`,
`movements`, `alignment-order`, `dialogue`, and `recording`, with `round-termination`
as the worked instance of the failure and the ledger entries of 2026-09-08 as the
evidence.

### The sitting's own alignment inputs, sequenced, 2026-09-08

The account above names "the ledger entries of 2026-09-08 as the evidence" and does
not say which. That pointer is worth no more than the search it saves, and the
sitting that could make it is ending, so the population is enumerated here. Eight
entries of that day are alignment input in this node's sense: four are probe
responses and four are dispositions the author stated while the sitting was in hand,
which this node's rule treats alike. For each, where its own periagogic and maieutic
sequencing stands is what the rule demands be visible, so it is given.

`words/2026-09-08/28`, answering a probe on `quotes` about what the admission rule
governs. It articulated a disposition on the sitting's own working store, which is
recorded as `session-state`, at the maieutic stage. Sequenced.

`words/2026-09-08/29`, answering `movements`' probe
`does-expert-dialogue-carry-the-verdict`. It articulated a disposition on what ends
a round, recorded as `round-termination`, now at the review stage. Sequenced, and
this is the worked instance of the failure the section above describes: the words
were first recorded only inside the discharge reason of the probe they answered,
and the node was minted at `38dd0464` to correct that. The entry also carries the
author's own question back, whether the disposition on termination is consistent
with tradition, which is what convened the tradition survey.

`words/2026-09-08/30`, answering a periagogic probe on what standardizing the
expert's instructions is for. Recorded as `expert-instructions`, at the periagogic
stage with no survey run. Sequencing owed.

`words/2026-09-08/31`, stated in the sitting, on reconciliation residue going stale
under a bootstrap grant that reconciles while alignment is still moving. Recorded as
`bootstrap-residue-staleness`, at the periagogic stage with no survey run and, alone
among the eight, with no fact on its node at all, the words stating a problem and
asking for a recommendation rather than giving an answer. Sequencing owed.

`words/2026-09-08/32`, stated in the sitting rather than answering a probe, striking
three clauses of this node's parent. It is supported on `author-questions`,
`dialogue` and `recording`, each carrying the amendment the strike forces, the first
at the review stage and the other two at the maieutic. Sequenced.

`words/2026-09-08/33`, stated in the sitting, which is this node's own source. It is
recorded here, at the periagogic stage with no survey run. Sequencing owed, and the
node that states the rule is one of the nodes that owes it.

`words/2026-09-08/34`, answering `round-termination`'s probe
`where-does-reframing-the-question-fall`. It articulated a disposition on
termination that the node's recommendation moved to carry, and it is supported on
`author-questions` and `recording` as well, both of which the same words reach.
Sequenced.

`words/2026-09-08/35`, stated in the sitting, naming the expert's exhausted budget.
Recorded as `unreached-traditions`, at the periagogic stage; its first tracked set
is enumerated in that node's account, and no survey has run on the node itself.
Sequencing owed.

So four of eight are sequenced and four are not, and the four unsequenced are
exactly the four nodes this sitting minted and left at the periagogic stage:
`expert-instructions`, `bootstrap-residue-staleness`, this node, and
`unreached-traditions`. Exactly half. That is the measurement this node's rule
exists to make possible, and it says something the prose above does not: the
treatment does not fail on the responses a sitting acts on, it fails on the ones it
mints a node for and then runs out of sitting. The implicit practice the author
observed catches the first kind and not the second.

How this enumeration was first drawn wrong is itself the finding, and is kept rather
than tidied away. The first drawing counted seven and put the split at five and two,
because it walked the entries that nodes cite as supports on their options. Entry 31
is cited only in an account, since `bootstrap-residue-staleness` carries no fact and
therefore no option to support, so a support-walk cannot see it -- and the validator
sees the same hole from the other side, reporting that entry as referenced by no
option. The method was therefore biased against precisely the inputs it was convened
to find: an input not yet sequenced far enough to have a fact is the one an
option-keyed search misses, and the further behind an input is, the more invisible it
is to the instrument that would report it. An enumeration of what is owed cannot be
drawn from what has already been recorded. The correction was made in the sitting
that made the error, from the ledger itself rather than from the graph's references
to it, which is the only source that carries every entry by construction.

Whether the enumeration belongs here at all is open, since this node's account is
folded at its own recording and a list of what is owed is not reconstructed by
re-running a reading, which is the same placement question `unreached-traditions`
records against its own tracked set.

### The option restated as a step, 2026-09-08

`words/2026-09-08/36` states the shape of alignment dialogue orchestration in seven
steps, and step 1 has alignment input arrive either by an `/align` invocation or as a
response to a probe, with no branch between them thereafter. That is this node's
recommended option stated as a step of the orchestration rather than as a rule about
probes, and it is the same disposition: a probe response is alignment input and is
treated as any other is.

Recorded as a `supports` reference. The entry adds nothing this node does not already
recommend and takes nothing away. What it does add is a second reading of why the
option is right, which the node's own account did not have: with the treatment common,
step 1 is one clause instead of two, and every step after it is written once. A rule
that divided them would have had to be carried through steps 2, 3 and 7 as a branch
each time.

### The enumeration above is dated, and the date is the point, 2026-09-08

The section "The sitting's own alignment inputs, sequenced" enumerates eight entries of
2026-09-08 and finds four of them sequenced, "exactly half". The ledger of that day now
holds thirty-seven entries. The enumeration is a measurement of a population that was
still growing when it was taken, made by a sitting that described itself as ending and
then ran on for another twenty-nine entries under the same grant.

The arithmetic is not corrected here, because correcting it would produce another
measurement with the same defect: the sitting is still running and the author is still
writing into it. What is corrected is the claim's scope. "Exactly half" describes the
population as it stood at the eighth entry, and the re-measurement over the full day is
owed to whichever sitting can take it after the day closes.

That this node's own account carries a stale count of the thing it exists to count is the
sharpest evidence it has for its own rule. The rule asks that a response's sequencing be
visible; what the sitting found is that visibility taken once decays, because the
population is open for as long as the sitting is. Any instrument this node's answer calls
for has to be re-runnable rather than transcribed, and the account above is what
transcription looks like a day later.
