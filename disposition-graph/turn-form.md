---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
stage: ruling
facts:
  - name: answer
    options:
      - name: four-forms
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/18
          - words/2026-09-07/19
      - name: expected-not-required
        source: ai
        ref: "2026-09-07"
      - name: three-forms-no-acknowledgement
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "the acknowledgement is where `recording` requires the session to say which rulings it recorded and that the node moved, so folding it into the direction to the page leaves that notice with no form to take"
      - name: rule-on-growth
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "a rule that governs every turn of every sitting is one question, and the author's words of 2026-09-07 send a persistent intent of theirs to a node of its own"
      - name: a-turn-that-reports-an-impediment
        source: review
        ref: "2026-09-07"
        supports:
          - words/2026-09-06/5
      - name: a-turn-that-reports-a-prune
        source: review
        ref: "2026-09-07"
      - name: a-form-is-not-satisfied-by-its-shape
        source: ai
        ref: "2026-09-08"
    recommends: a-turn-that-reports-an-impediment
    boldness: moderate
    against: "The rule is drawn from a single turn the author disliked, and their own words in that message call the four forms what a prompt is expected to take rather than what every turn must be; the hardening into a bound is the AI's, and its cost is paid where it cannot be seen, in the turns a future session does not make. The impediment turn answers only the sitting that cannot continue: a session that has found something the author would want to know, and that is neither probe nor direction nor acknowledgement, is still told to write it to the record and let the projections carry it, and surviving in a record this size is not the same as reaching the author when it matters."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
review:
  verdict: forward
  strength: moderate
  date: 2026-09-07
  of: df26462f56913b23fc14607921b8c6ee447395d0
  commit: e6f0b87118fe9410668bf7f8eebef2e69c1ea305
  against: "The rule is still drawn from a single turn the author disliked, and their own words call the four forms what a prompt is 'expected to take' rather than a bound; the impediment turn only covers the sitting that cannot continue, so a session that finds something true and interesting but not of the four forms (or the impediment) still has no way to say so and must trust the record's projections to carry it to the author in time."
  survey:
    date: 2026-09-09
    of: df26462f56913b23fc14607921b8c6ee447395d0
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "c500b5af90fd56770f41daad8a08790aaf45fae669d1386338005eee8f27931e"
      answer: "92b08f4cff50dfa8357f724b85371dcef78724a294dc88f927c84ca59caf0daa"
      options: "6169eefd5897fead3b6881291fd3175b8e734a3cedd7b152a1bdcebca2ed7035"
      rivals: "1649be2c6b5c82e05770c72e11487c94f23778a63de50a2fc9bb6c5eecf55880"
      words: "fec759bafc64a9dc49f71b5bda297b63604d10462ae81a040f766a8a29e63279"
    findings: []
    pairs:
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/alignment-target"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/author-questions"
        keys:
          - "words:words/2026-09-06/5"
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/class-recommendation"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/evaluation"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
          - "cites"
      - with: "commons.systems/disposition-graph/fidelity"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/graph-topology"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "words:words/2026-09-06/5"
          - "words:words/2026-09-07/18"
          - "depends"
          - "cites"
      - with: "commons.systems/disposition-graph/movements"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/plato-elenchus"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/plato-maieutics"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
          - "cites"
      - with: "commons.systems/disposition-graph/plato-periagoge"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
          - "cites"
      - with: "commons.systems/disposition-graph/recording"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
          - "cites"
      - with: "commons.systems/disposition-graph/standard-report"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "parent:commons.systems/disposition-graph/growth"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "cites"
under:
  - commons.systems/disposition-graph/growth
---

## Facts

### answer

Recommended because the four forms are the author's own enumeration, given in the
turn that named the breach, and because the record's two conducts already run that
way: the periagogic conduct holds the AI's account back until the author has
committed, and the maieutic conduct draws one thing out at a time, so a turn that
is neither probe nor direction nor acknowledgement is the AI's account put before
the author's. `a-turn-that-reports-an-impediment` and not `four-forms`, because
the rule as first drafted left a sitting that cannot continue no form in which to
say so and then told it that a turn of none of the four means it has nothing to
stop for: the clean-context reading of 2026-09-07 found it, and the exemption it
asks for is of the same kind as the two the answer already carried, a turn that is
not the AI's account put before the author's.

Boldness moderate. The enumeration is the author's: the three surfaces are their
words of 2026-09-06 and the four forms their words of 2026-09-07, close to as
they stand. What is the AI's is the hardening of them into a bound — the author
wrote that dialogue prompts are expected to take the four forms, and this answer
writes that a turn takes one of four forms and no fifth — and that is not an edge
but the whole operative force of the answer, since it is what makes a turn of a
fifth kind a breach rather than a departure. The three exemptions are the AI's
too, the third of them this reading's. `expected-not-required` is the option that
carries the softer reading, and it and the fact's case against are what argue with
the bound.

#### four-forms

The author's four forms with two things outside the rule and no third: everything
the recommended option says, without the turn that reports an impediment. Its text
is the `## Answer` above, as first recorded. Under it a session that cannot
continue has no form in which to say so, and the sentence that a session with none
of the four to give has nothing to stop for tells it to proceed in silence, which
is what the fourth finding of the reading of 2026-09-07 named and what the
recommendation moved for. The reading's three other corrections — the mood of the
sentence that the two nodes cite this node, the scope of the question, and the
tradition pass — are not what separates the two options; they are carried in the
recommended text, which is what a ruling reads.

**AI support.** Four forms and not three because the acknowledgement is doing work the other three
cannot do. `commons.systems/disposition-graph/recording`'s recommended text
requires that the session, having classified a response, "tells the author in the
turn it makes the move that the node has moved and why, since a movement the
author did not ask for spends a sitting they did not budget". That notice is not a
probe and is not a direction to the page; if the acknowledgement did not carry it,
an executor holding both rules could obey neither, and the cheapest way out would
be to stop giving the notice, which is the check the author asked for on the AI's
own classification of their words. So the fourth form is named, and what it
contains is named with it: which rulings were recorded, and where the response
moved the node, that it moved and why.

The two things outside the rule are outside it for different reasons. The author's
express request is outside because a rule about what may be said to the author is
a rule in the author's service, and a rule that overrode their own instruction
would have inverted that; the record has the general shape of this already, in
`commons.systems/disposition-graph/authority`, where what the AI may do narrows and
what the author may ask does not. A reconciliation's output is outside because it
is not a turn of this dialogue: the author's own words say that reconciliation
outputs may diverge from the alignment output disposition, and what those outputs
should look like is a question with a node of its own.

This node exists at all because of the author's sentence of 2026-09-07 on
`probe-or-node`, that a persistent intent of theirs may require a node to be
reconciled into the alignment skill. The rule is persistent, it governs every turn
of every sitting, and by `commons.systems/disposition-graph/node`'s rule that a
text answering two questions is two nodes it cannot be a clause of "How does the
graph grow?" without making that node answer one more question than it already
does. `growth` keeps the loop, the three usages and the two conducts, and cites
this node for the form of a turn.

The tradition pass. The two conducts this rule bounds are named from Plato and are
read under `growth`: `commons.systems/disposition-graph/plato-periagoge`, the
turning of the soul toward what is, and
`commons.systems/disposition-graph/plato-maieutics`, the midwife who brings forth
what is already in the interlocutor and tests it. Both traditions support the rule
and neither is diverged from: the elenchus is conducted in questions, and the
Socratic teacher who reports their own findings to the interlocutor has stopped
turning them and started telling them, which is exactly the deviation the author's
words name as noise. What the traditions do not supply is the third surface and
the fourth form, which belong to a record that keeps its decisions in writing:
Plato's dialogues have no page where a ruling is confirmed and no clerk to
acknowledge one. That is the record's addition and is where this answer goes
beyond what either tradition holds.

What the rule costs is that a session which has found something true and
interesting and not of the four forms has no way to tell the author about it in
the sitting, and must write it to the record instead and let the projections carry
it. That is a consequence of the design and not a reason for it: a record whose
projections the author reads is where such a finding belongs, and a finding that
cannot survive being written down was not worth the author's turn.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Three surfaces bound what reaches the author, and on them every turn addressed to
the author takes one of four forms and no fifth. The periagogic movement
establishes common grounding in the record; the maieutic movement clarifies
ambiguities in the author's intent; the alignment page takes the confirmation of a
disposition's facts. So a turn of the alignment dialogue addressed to the author is
a periagogic probe, which turns them back to the record for the ground of a
question; a maieutic probe, which asks what they intend where the record leaves it
open; a direction to the alignment page, where a disposition's facts stand for
confirmation; or an acknowledgement of a confirmation, which says which rulings
were recorded and, where the response moved the node, that it moved and why, as
`commons.systems/disposition-graph/recording` requires of the turn that makes the
move. A session with none of the four to give has nothing to stop for and
proceeds. The readings and what they return, the instruments the sitting runs, the
measurements it takes, and the mechanical and encoding defects it finds and
repairs are the sitting's own: it corrects them and passes through without asking,
and their appearance in a turn addressed to the author is noise to be minimised
and not thoroughness.

Two things stand outside the rule. A turn the author has expressly asked for takes
the form they asked for: the same words that give the four forms end by asking for
a listing of the AI's recommendations queued for reconciliation, so a rule that
forbade what the author had just requested would be a rule read against the party
it exists to serve. And what a reconciliation session outputs, a listing or a
report included, is outside the rule altogether, which binds the alignment
dialogue and nothing else; what form a reconciliation's own output takes is
`commons.systems/disposition-graph/work-loop`'s question and is not decided here.

The rule is stated once, here, and the two nodes that carry it from one side each
cite this node rather than restating half of it.
`commons.systems/disposition-graph/author-questions` carries the probe's side, as
`the-sitting-stops-only-on-intent`: a sitting stops for the author only where
there is a question about their intent, so a session with no probe to raise has
nothing to stop for. `commons.systems/disposition-graph/alignment-page` carries
the page's side, as `page-collects-only-the-confirmation`: the page collects the
final confirmation and nothing else, and every other thing the author has to say
is given in the interview. Each is this rule seen from one surface, and neither is
the whole of it, since neither says that the three surfaces together bound what
may reach the author at all.

What the author's words ask for, beyond the record of the rule, is that the
alignment skill be reconciled to it, and that reconciliation is what makes the
rule act rather than merely stand: the skill's turns to the author are the four
forms, and what it learns from a reading, an instrument or a repair is written to
the record and not reported to the author.
```

#### expected-not-required

Everything `four-forms` says, with the rule read as a default rather
than a bound: the author wrote that dialogue prompts "are expected to take" the
four forms, and under this option a session may depart from one of them where it
states its reason, the departure being a thing the author can see and correct
rather than a thing the record forbids.

**AI support.** For it: it is what the author's words
literally say, it needs no exemption for a turn they asked for, since such a turn
is simply a departure with the best of reasons, and it leaves the record honest
about a rule whose source broke it in the sentence that gave it.

**AI divergence.** Against it: a
default the session may leave with a reason is the state the record was already
in, since the session that gave the turn the author called noise would have
recorded a reason for it and did not think it noise, and the rule exists precisely
because the AI is the party whose judgment about what is worth the author's
attention was found wrong. It stays viable and is not adopted; where the author
prefers the softer reading, this is the option that carries it.

**Content.**

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Everything `four-forms` says, with the rule read as a default rather
than a bound: the author wrote that dialogue prompts "are expected to take" the
four forms, and under this option a session may depart from one of them where it
states its reason, the departure being a thing the author can see and correct
rather than a thing the record forbids.
```

#### three-forms-no-acknowledgement

Everything `four-forms` says, with the acknowledgement folded into the
direction to the alignment page, so that the confirmation is directed for and the
next direction to the page is the only reply a confirmation gets. Passed over: the
acknowledgement is where `recording` requires the session to say which rulings it
recorded and that the node moved and why, and folding it away leaves that notice
with no form to take.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Everything `four-forms` says, with the acknowledgement folded into the
direction to the alignment page, so that the confirmation is directed for and the
next direction to the page is the only reply a confirmation gets. Passed over: the
acknowledgement is where `recording` requires the session to say which rulings it
recorded and that the node moved and why, and folding it away leaves that notice
with no form to take.
```

#### rule-on-growth

Everything `four-forms` says, kept as a clause of
`commons.systems/disposition-graph/growth`'s answer, where the two conducts are,
and no node minted. Passed over: a rule that governs every turn of every sitting is
its own question, `growth`'s answer already answers more questions than one, and
the author's words of 2026-09-07 send a persistent intent of theirs to a node of
its own to be reconciled into the skill.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Everything `four-forms` says, kept as a clause of
`commons.systems/disposition-graph/growth`'s answer, where the two conducts are,
and no node minted. Passed over: a rule that governs every turn of every sitting is
its own question, `growth`'s answer already answers more questions than one, and
the author's words of 2026-09-07 send a persistent intent of theirs to a node of
its own to be reconciled into the skill.
```

#### a-turn-that-reports-an-impediment

Everything `four-forms` says, with a third thing standing outside the rule beside
the two already there. A turn that reports an impediment is outside it: where the
sitting cannot continue — the landing will not land, the record will not validate,
the instruction contradicts a ruling already given — the session says so in one
line, names what stopped it, and asks nothing. It is viable because the rule as
`four-forms` states it leaves that turn no form and then tells the session that a
turn of none of the four means it has nothing to stop for and proceeds, which is
the one case where proceeding silently is worse than any noise; and because the
two exemptions the answer already carries are of the same kind, things that are
not the AI's account put before the author's. Raised by the clean-context reading
of 2026-09-07 as its fourth finding, and recommended over `four-forms` on it.

**AI support.** Four forms and not three because the acknowledgement is doing work the other three
cannot do. `commons.systems/disposition-graph/recording`'s recommended text
requires that the session, having classified a response, "tells the author in the
turn it makes the move that the node has moved and why, since a movement the
author did not ask for spends a sitting they did not budget". That notice is not a
probe and is not a direction to the page; if the acknowledgement did not carry it,
an executor holding both rules could obey neither, and the cheapest way out would
be to stop giving the notice, which is the check the author asked for on the AI's
own classification of their words. So the fourth form is named, and what it
contains is named with it: which rulings were recorded, and where the response
moved the node, that it moved and why.

The three things outside the rule are outside it for three reasons. The author's
express request is outside because a rule about what may be said to the author is
a rule in the author's service, and a rule that overrode their own instruction
would have inverted that; the record has the general shape of this already, in
`commons.systems/disposition-graph/authority`, where what the AI may do narrows and
what the author may ask does not. A reconciliation's output is outside because it
is not a turn of this dialogue: the author's own words say that reconciliation
outputs may diverge from the alignment output disposition, and what those outputs
should look like is a question with a node of its own. The impediment is outside
because it is not an account at all. The rule bounds what the AI may put before
the author of its own findings, and a sitting that cannot continue is not offering
a finding: it is reporting that there is nothing it can offer, which is the one
thing the author cannot learn from the record later, since the sitting they are
waiting on is the thing that has stopped. That is why the form is one line and
asks nothing: a turn that asked something would be a probe, and a turn that
explained itself would be the account this rule holds back.

This node exists at all because of the author's sentence of 2026-09-07 on
`probe-or-node`, that a persistent intent of theirs may require a node to be
reconciled into the alignment skill. The rule is persistent, it governs every turn
of every sitting, and by `commons.systems/disposition-graph/node`'s rule that a
text answering two questions is two nodes it cannot be a clause of "How does the
graph grow?" without making that node answer one more question than it already
does. `growth` keeps the loop, the three usages and the two conducts, and cites
this node for the form of a turn. The question names the alignment dialogue,
because that is what the answer binds and because what a reconciliation session
outputs is `work-loop`'s question and not this one. The parent's citation, which
sends "what form a turn addressed to the author takes, and what the dialogue may
spend the author's attention on" here, names that one question from its other
side and not a second question: what the dialogue may spend the author's attention
on is what the four forms answer, the forms being the whole of what may be spent
on it and the three surfaces being why. So the citation stands as `growth` writes
it.

The tradition pass. The two conducts this rule bounds are named from Plato and are
read under `growth`: `commons.systems/disposition-graph/plato-periagoge`, the
turning of the soul toward what is, and
`commons.systems/disposition-graph/plato-maieutics`, the midwife who brings forth
what is already in the interlocutor and tests it. Both traditions support the rule
and neither is diverged from: the elenchus is conducted in questions, and the
Socratic teacher who reports their own findings to the interlocutor has stopped
turning them and started telling them, which is exactly the deviation the author's
words name as noise. Both readings are recorded as bearing on this node, on this
fact and on the option recommended here, with the relation adopted, as
`commons.systems/disposition-graph/evaluation` requires of a tradition surfaced,
so the support this paragraph claims is readable from the readings themselves and
not only asserted here. What the traditions do not supply is the third surface and
the fourth form, which belong to a record that keeps its decisions in writing:
Plato's dialogues have no page where a ruling is confirmed and no clerk to
acknowledge one. That is the record's addition and is where this answer goes
beyond what either tradition holds.

What the rule costs is that a session which has found something true and
interesting and not of the four forms has no way to tell the author about it in
the sitting, and must write it to the record instead and let the projections carry
it. That is a consequence of the design and not a reason for it: a record whose
projections the author reads is where such a finding belongs, and a finding that
cannot survive being written down was not worth the author's turn. The impediment
turn does not soften that cost and is not meant to: it is not for a finding the
author would want, but for the sitting that has nothing to give at all.

**AI divergence.** The rule is drawn from a single turn the author disliked, and their own words in that message call the four forms what a prompt is expected to take rather than what every turn must be; the hardening into a bound is the AI's, and its cost is paid where it cannot be seen, in the turns a future session does not make. The impediment turn answers only the sitting that cannot continue: a session that has found something the author would want to know, and that is neither probe nor direction nor acknowledgement, is still told to write it to the record and let the projections carry it, and surviving in a record this size is not the same as reaching the author when it matters.

**Content.**

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---
## Answer

Three surfaces bound what reaches the author, and on them every turn of the
alignment dialogue addressed to the author takes one of four forms and no fifth.
The periagogic movement establishes common grounding in the record; the maieutic
movement clarifies ambiguities in the author's intent; the alignment page takes
the confirmation of a disposition's facts. So such a turn is a periagogic probe,
which turns them back to the record for the ground of a question; a maieutic
probe, which asks what they intend where the record leaves it open; a direction to
the alignment page, where a disposition's facts stand for confirmation; or an
acknowledgement of a confirmation, which says which rulings were recorded and,
where the response moved the node, that it moved and why, as
`commons.systems/disposition-graph/recording` requires of the turn that makes the
move. A session with none of the four to give, and no impediment to report, has
nothing to stop for and proceeds. The readings and what they return, the
instruments the sitting runs, the measurements it takes, and the mechanical and
encoding defects it finds and repairs are the sitting's own: it corrects them and
passes through without asking, and their appearance in a turn addressed to the
author is noise to be minimised and not thoroughness.

Three things stand outside the rule. A turn the author has expressly asked for
takes the form they asked for: the same words that give the four forms end by
asking for a listing of the AI's recommendations queued for reconciliation, so a
rule that forbade what the author had just requested would be a rule read against
the party it exists to serve. What a reconciliation session outputs, a listing or
a report included, is outside the rule altogether, which binds the alignment
dialogue and nothing else; what form a reconciliation's own output takes is
`commons.systems/disposition-graph/work-loop`'s question and is not decided here.
And a turn that reports an impediment is outside it: where the sitting cannot
continue — the landing will not land, the record will not validate, the worktree
is reaped under the session, the instruction contradicts a ruling already recorded
— the session says in one line that it cannot continue and what stopped it, and
asks nothing. It is outside the rule because it is not the AI's account put before
the author's but the sitting's inability to give them any of the four; without it
the session with no turn of the four to give is sent to the sentence above, which
tells it to proceed, and proceeding in silence is the one wrong act there.

The rule is stated here and once. The two nodes that carry it from one side are
amended to cite this node rather than restating half of it.
`commons.systems/disposition-graph/author-questions` carries the probe's side, as
`the-sitting-stops-only-on-intent`: a sitting stops for the author only where
there is a question about their intent, so a session with no probe to raise has
nothing to stop for. That option today restates the three surfaces in full, and
the amendment is recorded on that node as the option
`cites-turn-form-for-the-three-surfaces`, for the author to rule on and not yet
made. `commons.systems/disposition-graph/alignment-page` carries the page's side,
in the page-scope clause of its recommended answer, which the option
`page-collects-only-the-confirmation` records: the page's scope is the final
confirmation and, of every other movement, a preview and a read-only indicator,
and every other thing the author has to say is given in the interview; that clause
is amended in this sitting to cite this node where it states that side. Each is
this rule seen from one surface, and neither is the whole of it, since neither
says that the three surfaces together bound what may reach the author at all.

What the author's words ask for, beyond the record of the rule, is that the
alignment skill be reconciled to it, and that reconciliation is what makes the
rule act rather than merely stand: the skill's turns to the author are the four
forms, and what it learns from a reading, an instrument or a repair is written to
the record and not reported to the author.
```

#### a-turn-that-reports-a-prune

Everything `a-turn-that-reports-an-impediment` says, with a fourth thing standing outside the rule: a turn reporting what the AI has deleted under a delegation — the node, the survivor that keeps its question, and the reason the question was closed — given at the next sitting and asking nothing. It is on the table because graph-topology's option `prunes-reported-to-the-author` proposes exactly that surface and declines to adopt it on the ground that "which surfaces reach the author is `turn-form`'s question for the sitting", and this answer's list of what stands outside the rule is exhaustive and does not reach it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: a prune leaves its trace on the survivor's account, which the browser renders and the frontier lists, so the report may be the noise the rule exists to bound rather than the notice a deletion owes.

**Content.**

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---

## Answer

Everything `a-turn-that-reports-an-impediment` says, with a fourth thing standing outside the rule: a turn reporting what the AI has deleted under a delegation — the node, the survivor that keeps its question, and the reason the question was closed — given at the next sitting and asking nothing. It is on the table because graph-topology's option `prunes-reported-to-the-author` proposes exactly that surface and declines to adopt it on the ground that "which surfaces reach the author is `turn-form`'s question for the sitting", and this answer's list of what stands outside the rule is exhaustive and does not reach it.
```

#### a-form-is-not-satisfied-by-its-shape

Everything `a-turn-that-reports-an-impediment` says, with the rule reaching what a
turn is made of and not its shape alone. Raised from this sitting's own practice on
2026-09-08 and not from the author's words: the sitting divided one pair of units by
the conclusion each was to reach rather than by the tradition each was to read, and
handed each the side it would argue. Every turn that rested on those units was well
formed under the rule as it stands.

**AI support.** The rule's own account says what it is for: it bounds "what the AI may
put before the author of its own findings", and the exemptions are all things that are
not the AI's account. That is a bound on the surface, and the surface is the last place
the AI's account enters. What determines a probe's content is the work behind it, and
the rule reaches none of that. A session that wants a particular answer has no need to
break the four forms; it writes the units that ground the probe, and the probe it then
asks is well formed, is honestly labelled, and carries the conclusion anyway. This is
worse than a fifth form would be, because a fifth form is visible and this is not: the
author reads a turn whose shape is exactly right, and there is nothing in the turn to
read the defect off, the brief being neither shown to them nor kept by the record. The
clause costs a session nothing it should not already be paying — `delegation`'s option
`the-brief-is-bound-as-the-subagent-is` states the same requirement where the work is
divided, and this states its consequence where the work is presented — and it gives
the author's own check something to bite on, since the author cannot audit a brief but
can be told that the rule requires one.

**AI divergence.** The clause is unenforceable by anyone but the session it binds, which
makes it a different kind of clause from the four forms: those are readable off the turn,
and this is readable off nothing. A rule the author cannot check is a rule that reports
the AI's honesty rather than constraining it, and stating it may buy the appearance of a
guard where there is none — which is the failure mode `movements` names, a movement that
is always made being one that can be made nominally. It also generalises from two units
of one sitting, both the AI's own, and the narrower reading is available: what went wrong
was not that the turn's grounding was unbound but that the sitting divided its units badly,
which `delegation` already answers, so this node may be gaining a clause to record a defect
whose home is elsewhere. Against that: the two nodes bound different acts, and a defect
with two homes is recorded in both or found in neither.

```markdown
---
question: What form does a turn of the alignment dialogue addressed to the author take?
form: rule
under:
  - commons.systems/disposition-graph/growth
---
## Answer

Three surfaces bound what reaches the author, and on them every turn of the
alignment dialogue addressed to the author takes one of four forms and no fifth.
The periagogic movement establishes common grounding in the record; the maieutic
movement clarifies ambiguities in the author's intent; the alignment page takes
the confirmation of a disposition's facts. So such a turn is a periagogic probe,
which turns them back to the record for the ground of a question; a maieutic
probe, which asks what they intend where the record leaves it open; a direction to
the alignment page, where a disposition's facts stand for confirmation; or an
acknowledgement of a confirmation, which says which rulings were recorded and,
where the response moved the node, that it moved and why, as
`commons.systems/disposition-graph/recording` requires of the turn that makes the
move. A session with none of the four to give, and no impediment to report, has
nothing to stop for and proceeds. The readings and what they return, the
instruments the sitting runs, the measurements it takes, and the mechanical and
encoding defects it finds and repairs are the sitting's own: it corrects them and
passes through without asking, and their appearance in a turn addressed to the
author is noise to be minimised and not thoroughness.

Three things stand outside the rule. A turn the author has expressly asked for
takes the form they asked for: the same words that give the four forms end by
asking for a listing of the AI's recommendations queued for reconciliation, so a
rule that forbade what the author had just requested would be a rule read against
the party it exists to serve. What a reconciliation session outputs, a listing or
a report included, is outside the rule altogether, which binds the alignment
dialogue and nothing else; what form a reconciliation's own output takes is
`commons.systems/disposition-graph/work-loop`'s question and is not decided here.
And a turn that reports an impediment is outside it: where the sitting cannot
continue — the landing will not land, the record will not validate, the worktree
is reaped under the session, the instruction contradicts a ruling already recorded
— the session says in one line that it cannot continue and what stopped it, and
asks nothing. It is outside the rule because it is not the AI's account put before
the author's but the sitting's inability to give them any of the four; without it
the session with no turn of the four to give is sent to the sentence above, which
tells it to proceed, and proceeding in silence is the one wrong act there.

The rule is stated here and once. The two nodes that carry it from one side are
amended to cite this node rather than restating half of it.
`commons.systems/disposition-graph/author-questions` carries the probe's side, as
`the-sitting-stops-only-on-intent`: a sitting stops for the author only where
there is a question about their intent, so a session with no probe to raise has
nothing to stop for. That option today restates the three surfaces in full, and
the amendment is recorded on that node as the option
`cites-turn-form-for-the-three-surfaces`, for the author to rule on and not yet
made. `commons.systems/disposition-graph/alignment-page` carries the page's side,
in the page-scope clause of its recommended answer, which the option
`page-collects-only-the-confirmation` records: the page's scope is the final
confirmation and, of every other movement, a preview and a read-only indicator,
and every other thing the author has to say is given in the interview; that clause
is amended in this sitting to cite this node where it states that side. Each is
this rule seen from one surface, and neither is the whole of it, since neither
says that the three surfaces together bound what may reach the author at all.

What the author's words ask for, beyond the record of the rule, is that the
alignment skill be reconciled to it, and that reconciliation is what makes the
rule act rather than merely stand: the skill's turns to the author are the four
forms, and what it learns from a reading, an instrument or a repair is written to
the record and not reported to the author.

A turn takes its form in substance and not only in shape. The three surfaces bound
what reaches the author, and nothing here bounds how what reaches them was made:
a probe is a probe because the session does not yet know the answer, so a probe
resting on a unit whose brief was written toward the answer the probe carries has
the shape of the first form and the function of the AI's own account, which is the
one thing the rule exists to keep off these surfaces. The defect is not detectable
in the turn. It is upstream of it, in a brief the author never sees and the record
does not keep, and it is invisible precisely because the turn is well formed. So
the rule reaches the turn's grounding as it reaches its shape: a session may put a
probe before the author only where the work behind it was divided by its object,
and where it was not, what the session has is a finding, and the finding is written
to the record.
```


### authority

Ratified, on the capture-shaped limb of
`commons.systems/disposition-graph/class-recommendation`'s test. The rule fixes
what the AI may say to the author, and the author is the only check the record has
on the AI; a class that let the recommending party set that bound would let it
decide how much of its own work the checking party ever sees. The other two limbs
are not met: the object is the form of a turn, which costs a paragraph of the
alignment skill to get wrong and can be changed back at the next sitting, so a
wrong answer here is neither expensive nor irreversible. Boldness low: the class
follows the stated test, and the rule whose class is in question is in the
author's own words.

## Account

### Manifest

- Folded: Minted from growth's dialogue, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 69fa32a8, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 387386ab

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `a-turn-that-reports-an-impediment`.

Findings:


On the facts and what they recommend: The diff moves the answer fact's `recommends` from `four-forms` to `a-turn-that-reports-an-impediment` (new option, source review), raises `boldness` from low to moderate with a rewritten reason distinguishing the author's enumeration from the AI's hardening of it, and rewrites `against` to state that the impediment turn answers only the sitting that cannot continue and not the sitting with a finding worth reporting; `stands` is unchanged at `four-forms`, so `## Answer` keeps its original (still-uncorrected) text by design while the corrected text lives in the new `## Recommendation` fence.

On the viability of the options: The diff leaves `four-forms`, `expected-not-required`, `three-forms-no-acknowledgement` and `rule-on-growth` viable as before (the first three subsections now open by naming `four-forms` rather than 'the recommended option', a cosmetic consequence of the move) and adds the new viable, recommended option `a-turn-that-reports-an-impediment`; nothing is struck.

Strongest counter-argument (moderate): The rule is still drawn from a single turn the author disliked, and their own words call the four forms what a prompt is 'expected to take' rather than a bound; the impediment turn only covers the sitting that cannot continue, so a session that finds something true and interesting but not of the four forms (or the impediment) still has no way to say so and must trust the record's projections to carry it to the author in time.

The session's reply: Forwarded with no finding; verified on the main thread that author-questions carries cites-turn-form-for-the-three-surfaces and that alignment-page cites turn-form for the three-surfaces rule. The counter-argument stands on the row at moderate strength. Nothing on the node changes.

### Frontier survey, 2026-09-07, of 387386ab

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The rule's force is its exhaustiveness, and the frontier already holds a surface it excludes and does not account for. graph-topology's option `prunes-reported-to-the-author` would have every prune taken under the delegation reported to the author at the next sitting, and says in terms that "which surfaces reach the author is `turn-form`'s question for the sitting"; this node carries no option for it, names that node nowhere, and says "Three things stand outside the rule." So a ruling here forecloses a report another node is holding open on this node's own authority, without the author being shown that the choice was made.

### Frontier finding, 2026-09-07

Kind: cross-reference.

graph-topology holds open a surface that turn-form's rule excludes, and hands the question to turn-form, which carries nothing for it. graph-topology's option `prunes-reported-to-the-author` says "every prune taken under the delegation is reported to the author, the node, the survivor that keeps its question, and the reason the question was closed, at the next sitting and on the alignment page", and gives as its reason for not being adopted that "what it adds is a surface, and which surfaces reach the author is `turn-form`'s question for the sitting and `alignment-page`'s for the page". turn-form's answer says "Three things stand outside the rule" and names them exhaustively; a report of prunes taken is none of the four forms and none of the three exemptions, and turn-form carries no option for it and names graph-topology nowhere.

Also named: commons.systems/disposition-graph/graph-topology.

Proposed: turn-form owns what may reach the author in a sitting and is where the question is decided. The option is recorded on turn-form so that the author rules whether a report of what the AI deleted under a delegation is a form the dialogue admits, rather than having it foreclosed by an exhaustive list that never met it. graph-topology's option stands as it is, since it already names turn-form as the decider.

Recorded as an option on this node's answer fact: `a-turn-that-reports-a-prune` (source review, 2026-09-07).

### Amended after the frontier survey, 2026-09-07

The survey's finding named this node and is recorded as the option `a-turn-that-reports-a-prune`, not adopted: a prune leaves its trace on the survivor's account, which the browser renders and the frontier lists, and a turn that reports it would be the noise the rule bounds. The option stands for the author's ruling. No text moves, both pins hold, and the node returns to ruling.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/turn-form stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `four-forms`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `a-turn-that-reports-an-impediment`; 3 `## Disposition` entries became the ledger entries words/2026-09-06/5, words/2026-09-07/18, words/2026-09-07/19, referenced by 2 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `expected-not-required`, `three-forms-no-acknowledgement`, `rule-on-growth`, `a-turn-that-reports-a-prune`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `387386abd5048685a94a39df8346873c76a4cc04` is re-computed for the encoding as `7443e62c32e1349585432dbfeb53c047785ead32`; nothing it read changed. The survey's pin `387386abd5048685a94a39df8346873c76a4cc04` is re-computed for the encoding as `7443e62c32e1349585432dbfeb53c047785ead32`; nothing it read changed.


### A well-formed turn can carry the AI's account, 2026-09-08

The option `a-form-is-not-satisfied-by-its-shape` was recorded in the sitting of
2026-09-08 under the author's grant of that day, on the AI's own finding and on no
words of the author's; the recommendation was not moved.

The finding is the same one that produced `delegation`'s option
`the-brief-is-bound-as-the-subagent-is`, seen from this node's side. This rule bounds
the surfaces on which the AI may put its own account before the author. The sitting
divided one pair of units by the conclusion each was to reach and handed each the
side it would argue, and every turn resting on those units was well formed under the
rule as it stands. So the bound holds at the surface and the AI's account enters
before it, in the work that grounds the turn, where nothing reaches it.

Why the defect is recorded in two places rather than one: the two nodes bound
different acts, `delegation` the dividing of the work and this node the putting of it
before the author, and a defect with two homes is recorded in both or found in
neither. The option's divergence carries the case against, that a clause readable off
nothing is a different kind of clause from four that are readable off the turn, and
that stating it may buy the appearance of a guard where there is none.

### Frontier survey, 2026-09-09, of df26462f

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (moderate): The fifth form this node adds, the turn that reports an impediment, overlaps the probe without the record saying which carries what. `author-questions` holds that a probe is what the AI puts to the author when it cannot ground a recommendation, and this node's own `against` concedes that "a session that has found something the author would want to know, and that is neither probe nor direction nor acknowledgement, is still told to write it to the record and let the projections carry it". The record therefore gains a second channel to the author with no rule dividing it from the first, at the same moment `author-questions` recommends removing the one number that bounded the first.

The session's reply: The counter-argument is kept and is the right objection. The fifth form and the probe are two channels to the author with no rule dividing them, and this node's own `against` already concedes the overlap. The sharper half is the timing the reading notices: the second channel is added in the same sitting in which `author-questions` removes the one number that bounded the first. That is not an argument against either change on its own and is an argument for settling the division before both land.
