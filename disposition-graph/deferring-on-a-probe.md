---
question: What does the author do by deferring or delegating on a probe instead of answering it?
stage: maieutic
probes:
  - id: is-the-question-undecided-or-only-not-yet-worked
    asks: >-
      When you defer on a probe, are you telling the record that the question has
      no answer you hold yet, or that you hold one and cannot get at it in the
      time this sitting has?
    fact: answer
    why: >-
      The two warrant different work and this answer treats them alike. If the
      question is genuinely undetermined, then what the AI does under the
      deferral is make new disposition, which Hart's open texture says is
      law-creating and not discovery, and the record should say so, since an
      answer written as though it recovered what the author already meant is
      then false. If instead the author holds an answer and cannot reach it, the
      AI's job is to make the question reachable and the deferral is a cost the
      record is paying for a probe that was put badly. Lauterpacht's objection
      to non liquet is exactly that a decider cannot tell a gap in the law from a
      gap in themselves, and converts the second into the first; Stone's reply is
      that forcing a decision produces covert legislation, which is worse. The
      record cannot choose between them from the response alone, and only the
      author can say which one they are in.
    discharges: >-
      Whether the AI's account under a deferral is written as new disposition it
      made or as a reading of what the author already holds, and whether a
      deferral is a state the record should try to reduce or a state it should
      treat as settled.
    source: ai
    raised: 2026-09-08
  - id: may-a-deferral-lower-the-class-of-a-node-that-defines-authority
    asks: >-
      Should this mechanism be able to reach the nodes that decide who may decide
      — `authority`, `class-recommendation`, `what-acts-during-bootstrap`, and
      this node itself — or should a deferral on those be refused and the
      question put again?
    fact: answer
    why: >-
      Two traditions with no contact with each other land on the same bound. The
      major-questions doctrine holds that the larger the stake, the more explicit
      the delegation must be, and that ambiguity never carries the biggest
      questions; the capacity literature holds that the threshold of
      understanding required for a valid decision rises with its risk, so the
      same words may be competent consent to one decision and not to another. A
      third, the self-amendment problem, says a rule of change applied to itself
      has no brake after it fires once: a deferral on `authority` lowers the rule
      that governs all lowering. The record's own `class-recommendation` already
      names these nodes without naming them, since deciding who decides is its
      capture-shaped limb; what it does not say is whether its test can be
      overridden by a deferral, and a recommendation cannot bind the author, so
      only the author can put this bound in.
    discharges: >-
      Whether the answer fact recommends `out-of-its-own-reach`, and with it
      whether the sitting that receives a deferral on such a node records it or
      returns the question.
    source: ai
    raised: 2026-09-08
  - id: does-the-mechanism-reach-a-maieutic-probe
    asks: >-
      Your words scope this to "the answer to a periagogic probe". A maieutic probe
      asks what you intend and have not yet articulated. May you defer or delegate on
      one of those too, or is a maieutic probe one only you can answer?
    fact: answer
    why: >-
      The scope clause is the author's own and it names one of the record's two probe
      types, so the narrow reading is available on the face of the words; but the
      record cannot presently tell which type a probe is. No probe in the graph carries
      a type: `PROBE_KEYS` admits none, and the field `author-questions` gains at
      `words/2026-09-08/39` is unmaterialized on the implementation ref. So the seven
      deferrals this mechanism received on the day it was minted rest on the sitting's
      own reading of which kind each probe was, and if the narrow scope is the answer
      then a mark the record does not yet hold is a precondition of a valid deferral,
      which is a dependency worth knowing about before the field is built rather than
      after.

      The two readings differ in what they ask the AI to do, which is why this is not a
      detail. A periagogic probe asks what grounds a question, and ground is the sort
      of thing a record holds, so reading the author's choice back from their recorded
      dispositions is reading the record for what the record is for. A maieutic probe
      asks what the author intends and has not said, and an intention that has not been
      articulated is by construction not in the record; reading it back would be the AI
      inferring the author's intention from the AI's own drafts, which is the capture
      this node's own `against` names, arriving by a route the answer's scope clause
      may already have closed. Against that: many probes the record calls maieutic ask
      the author to choose between two readings of something they have already said,
      and that is a record question in everything but its label, so a bright line at
      the type would refuse the mechanism exactly where it is safest.
    discharges: >-
      Whether the answer's scope clause stands as the author wrote it or widens to any
      probe, and with it whether the `type` field `author-questions` adds becomes a
      precondition of a valid deferral rather than a projection convenience.
    source: ai
    raised: 2026-09-08
facts:
  - name: answer
    options:
      - name: as-the-author-stated-it
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/39
      - name: the-choice-is-the-record-read-back
        source: ai
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/39
      - name: degradation-is-permanent
        source: ai
        ref: "2026-09-08"
      - name: out-of-its-own-reach
        source: ai
        ref: "2026-09-08"
    recommends: the-choice-is-the-record-read-back
    boldness: moderate
    against: "The AI writes the probe, the author's comprehension of it is a function of the AI's own prose, incomprehension is the trigger, and on firing it is the AI's own recommendation that becomes the author's unconfirmed choice. The drafter of the question, the proposer of the answer, and the party that gains by the transfer are one party, which is the structural objection Manning made to deference to an agency's reading of its own rule and which Scalia put as the rule that he who writes a law must not adjudge its violation. It bites harder here than in the tradition it comes from, where the drafter and the deferrer were at least different institutions. The corruption needs no bad faith and would leave no trace: a probe one degree more abstract, one degree less scaffolded, one degree closer to the AI's own vocabulary yields one degree more authority, and there is no independent measure of how clear the probe could have been, so nothing in the record can tell a hard question honestly put from a question put hard. `delegation-bounds-and-sizing` says the alignment interview is the only check this record has on the AI. This mechanism spends that check, one hard node at a time, with the AI holding the meter."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/probe-response-treatment
---

## Facts

### answer

The recommendation is `the-choice-is-the-record-read-back`, at moderate boldness.
The option is the author's own four clauses with three changes, and the boldness is
moderate rather than low because the changes are the AI's and two of them narrow a
grant the author was making to the AI. Narrowing a grant to oneself is the safe
direction to be wrong in, which is why it is not high; that the AI is nonetheless
rewriting the terms of its own authorisation is why it is not low.

The question exists because the author stated a mechanism the record had no node
for. `probe-response-treatment` says a probe response is alignment input and takes
the sequencing of alignment input; it does not say what a response does when it
declines the question rather than answering it. The default reading, and the one a
sitting falls into, is that such a response discharges nothing and the probe stays
open. That reading is wrong twice: it loses a ruling the author made, and it leaves
a node blocked on a question the author has said they will not answer.

Two things the record does not yet hold are needed before this answer can be
recorded as it is written. The first is the mark. `what-an-option-row-carries`
names three marks on an option — that the recommendation adopts it, that a reading
supports or departs from it, and that the author confirmed it — and the author's
words of 2026-09-08 name five, adding the author's choice short of confirmation and
an expert's choice. The unconfirmed choice is the mark this mechanism sets, and the
record has nowhere to put it: `recording`'s ruling responses are `confirm` and
`edit`, and neither records a choice the author has made and not confirmed. The
second is `partial-ratification`, standing unruled on `growth`, which is what would
let the author rule the authority fact while the answer fact is still being drafted
— and that is the shape of every deferral, since the class is settled in the same
turn that leaves the answer to the AI. Until both land, a deferral is recorded here
as a ruling on the authority fact and a sentence in the account, which is the
mechanism's substance without its encoding.

#### as-the-author-stated-it

The author's four clauses as given, placed and not otherwise changed: the deferral
sets an unconfirmed choice and a class, the class is ruled with a reason naming the
probes, whatever else the response says is context for the AI, and the movement is
one way.

**AI support.** It is the author's own, at `words/2026-09-08/39`, and it is
recorded before it is refined so that the refinement can be read against it. Its
merit is that it repairs a real hole rather than an imagined one: seven of the
fourteen responses in the same turn exercise it, so the mechanism is not a proposal
about a case that might arise but the description of what the author had just done
seven times. And it puts the deferral on the right side of the line the traditions
draw. Loper Bright holds that ambiguity is not itself a delegation and that only an
express one transfers authority; the maxim that silence is consent carries its own
condition, that the silent party could have spoken; and informed consent
distinguishes a competent waiver from a defeated one. All three ask that the
transfer be an act the author performs rather than an inference the AI draws, and
the author performed it, in words, in a message that says which probes it answers.

**AI divergence.** Clause one gives the AI more than the record needs and more than
the author's own sentence elsewhere would give it, which is what
`the-choice-is-the-record-read-back` narrows. Clause three calls the rest of the
response "additional context", which reads as a courtesy and is in fact the only
thing bounding the grant. Clause four states a direction without saying whether it
is a description of what a probe does or a cap on the node, and the two readings
differ on whether a deferred node can ever be ratified again.

**Content.**

```markdown
---
question: What does the author do by deferring or delegating on a probe instead of answering it?
form: rule
under:
  - commons.systems/disposition-graph/probe-response-treatment
---

## Answer

The author may defer or delegate on a probe rather than answer it, and that is a
ruling and not a silence. It sets two things in one act. On the node's authority
fact the author rules deferred or delegated, giving a reason that names the probes
the ruling answers. On the answer fact the author's choice, unconfirmed, becomes
the option the main thread supports on its judgment of expert return, tradition,
and the record's internal consistency. Neither half alone is the response: a class
with no choice beneath it leaves the fact empty, and a choice with no class confers
nothing on it.

The response may carry more than the deferral, and a deferral carrying nothing else
is still a deferral. Whatever the author says beside it is further context for the
AI's judgment on the fact.

The movement is one way. A probe answered with a deferral takes a ratified
authority to deferred; a probe answered with a delegation takes a ratified or a
deferred authority to delegated. A probe response never raises a class.
```

#### the-choice-is-the-record-read-back

Three changes to the author's clauses, each narrowing what the deferral hands over.
The AI's choice is the option the author's own recorded dispositions best support,
its own judgment reaching only what the record leaves open. The rest of the
response is the grant's scope and not a courtesy, and where it admits two readings
the one that gives the AI less wins. And the one-way movement is a statement about
what a probe response can do, not a cap on what the node can later become.

**AI support.** The first change is the largest and it is the surrogate tradition's.
Where a decision passes to someone else, the standard is substituted judgment —
decide as the person would have decided, from their known values — and best
interests is reached only where those values are unrecoverable. This record exists
so that the author's values are recoverable; a graph of standing dispositions is
precisely the artifact that makes the preferred standard available, and clause one
as the author wrote it skips to the fallback. The change is also in the author's own
direction rather than against it: their clause already names internal graph
consistency as one of three grounds, and this makes it the first and makes the AI's
own judgment residual to it. What the AI may then decide is what the record leaves
open, which is a smaller thing and a checkable one, because the author can ask of
any deferred answer which recorded disposition it was read from.

The second change makes clause three load-bearing. A delegation with no principle
behind it is not a wide delegation but a void one, which is what the intelligible
principle requires and what Schechter struck a sincere delegation for lacking; and
this record's own `authority` already says a delegation covers the class of decision
it names and no more. So the rest of the response is the scope, and the AI is bound
to it rather than informed by it. The narrower reading rule is the drafting maxim
that an ambiguity is construed against the party that drafted the instrument. It is
brought in because the same party drafts the probe and reads the response, and it is
the only clause here that touches the incentive this fact's `against` names: a probe
drafted to be hard cuts against its drafter at the reading stage. The two are
recommended together because the first is inert without the second — a scope the AI
both writes the question for and reads the answer of is not a bound — and that
bundling is stated rather than hidden.

The third change is a reading and not an addition. Clause four says what a probe
response does; read as a cap it would say that a node once deferred can never be
ratified, and that contradicts `authority`, under which a ratified answer is
changed by an interview with the author and the alignment dialogue is that
interview. Under this reading the ratchet the traditions warn about does not close,
because a probe response is not the only input a node takes: the author may ratify a
deferred node in the ordinary way, at any sitting, by ruling on it. What the clause
then fixes is that the AI can never obtain a raise by asking for one, which is the
attenuation this record already holds — authority narrows on the way down and
nothing writes up — applied to the one direction a probe can push.

**AI divergence.** One argument against the third change survives it and is not
answered here. Even where the class can be raised by an ordinary ruling, the author
who has learnt that saying "I do not fully understand" moves a class will find the
admission is no longer free, and the studied response to a principal who cannot
commit against ratcheting is that the agent stops revealing. The signal suppressed
would be the most valuable one the record has, where the author's understanding
runs out, and it would be suppressed hardest on the nodes where the record most
needs it. Making the raise available does not make it costless, and this option
does nothing further about that.

The first change also has a cost the author should see. Reading the answer off the
recorded dispositions is checkable, and it is checkable only against a record the AI
also wrote most of. Substituted judgment presumes the recorded values are the
person's; here they are the person's words as the record holds them, and the same
sitting that reads them back is the sitting that entered them.

**Content.**

From: as-the-author-stated-it

```diff
@@ -11,15 +11,27 @@
 ruling and not a silence. It sets two things in one act. On the node's authority
 fact the author rules deferred or delegated, giving a reason that names the probes
 the ruling answers. On the answer fact the author's choice, unconfirmed, becomes
-the option the main thread supports on its judgment of expert return, tradition,
-and the record's internal consistency. Neither half alone is the response: a class
-with no choice beneath it leaves the fact empty, and a choice with no class confers
-nothing on it.
+the option the author's own recorded dispositions best support, on the main
+thread's reading of the graph, informed by expert return and by tradition, with the
+AI's own judgment reaching only what the record leaves open. The decision is the
+author's, taken from what the author has already said; it is the AI's only where
+the record is silent, and an answer written under a deferral says which recorded
+disposition it was read from. Neither half alone is the response: a class with no
+choice beneath it leaves the fact empty, and a choice with no class confers nothing
+on it.
 
 The response may carry more than the deferral, and a deferral carrying nothing else
-is still a deferral. Whatever the author says beside it is further context for the
-AI's judgment on the fact.
+is still a deferral. Whatever the author says beside it is the scope of what they
+have handed over and not a courtesy to it: the AI is bound to it, the grant is
+exactly as wide as it, and where it admits two readings the one that leaves the AI
+less room is the one that governs, because the same party drafts the probe and
+reads the answer.
 
-The movement is one way. A probe answered with a deferral takes a ratified
-authority to deferred; a probe answered with a delegation takes a ratified or a
-deferred authority to delegated. A probe response never raises a class.
+The movement is one way, and that is a statement about what a probe response can do
+rather than a cap on what the node can become. A probe answered with a deferral
+takes a ratified authority to deferred; a probe answered with a delegation takes a
+ratified or a deferred authority to delegated; and no probe response ever raises a
+class, so the AI can never obtain a raise by asking for one. The author raises a
+class the way any answer is changed, by ruling on the node in the alignment
+dialogue, and a deferral is therefore a state the author can leave and not a door
+that locks behind them.
```

#### degradation-is-permanent

The strict reading of the author's fourth clause: a class a probe response has
lowered is lowered for good, and re-ratifying a deferred node is not open to the
author.

**AI support.** It is what the word "degraded" most plainly says, and the AI records
it rather than choosing silently between two readings of the author's sentence. It
has a real argument behind it, which is that a class the author can restore at will
is not much of a class, and that the value of the one-way rule is precisely that the
AI cannot campaign for a raise; a restoration the author may grant is a restoration
the AI may ask for.

**AI divergence.** It contradicts `authority`, under which a ratified answer is
changed by an interview with the author and nothing in the record makes a class
alone unreachable by that interview, so adopting it would amend the parent and not
merely refine it. It is also the reading every tradition surveyed warns against, and
they converge from five directions with no contact between them: the integrity
lattice whose labels only fall converges on its floor unless some trusted party may
reset one; a capability system attenuates monotonically and stays recoverable only
because the grantor may revoke and re-issue; the ratchet literature finds that an
irreversible use of a signal destroys the signal; agency law holds a principal's
delegation revocable at will because autonomy is not alienable; and the
precommitment literature settles on devices that make reversal expensive rather than
impossible. The record's own instance of the shape, `ocap-attenuation`, is the
narrower one: attenuation runs down a chain of grants and recovery is revoke and
re-issue, never un-attenuation.

**Content.**

From: as-the-author-stated-it

```diff
@@ -23,3 +23,8 @@
 The movement is one way. A probe answered with a deferral takes a ratified
 authority to deferred; a probe answered with a delegation takes a ratified or a
 deferred authority to delegated. A probe response never raises a class.
+
+A class so lowered is lowered for good. The author does not restore it by a later
+ruling, and the record keeps the lowering as a fact about the node rather than as a
+stage it is passing through, so that the AI can neither obtain a raise nor ask for
+one.
```

#### out-of-its-own-reach

The mechanism does not reach the nodes that decide who may decide. A deferral or a
delegation offered on a probe on `authority`, `class-recommendation`,
`what-acts-during-bootstrap`, or on this node is not recorded; the sitting says so
and puts the question again.

**AI support.** Three traditions with no contact with each other arrive at this
bound. The major-questions doctrine holds that an agency must point to clear
authorisation for decisions of vast significance and that ambiguity never suffices
for the largest ones. The capacity literature holds that the understanding required
for a valid decision rises with its risk, so the same words may be competent consent
to a small decision and not to a large one. And the self-amendment problem is that a
rule of change applied to itself has no brake after it fires once: one deferral on
`authority` would lower the rule that governs all lowering, and the record would
have no position left from which to notice. The bound also costs the record almost
nothing, because `class-recommendation` already recommends ratified on exactly these
nodes under its capture-shaped limb; what this option adds is that the
recommendation is not merely a recommendation here.

**AI divergence.** It puts a limit on the author, which nothing else in this record
does, and the record should be honest that this is its character rather than
present it as bookkeeping. Every other bound here runs against the AI. This one says
that on four nodes the author's own ruling is refused and returned, and the party
that would refuse it is the party the bound is meant to protect the author from. A
refusal the AI administers on its own behalf is a strange guard even when its
content is right, and an author who wanted to defer on `authority` and was told the
mechanism forbade it would be entitled to ask who wrote that.

**Content.**

From: the-choice-is-the-record-read-back

```diff
@@ -35,3 +35,13 @@
 class the way any answer is changed, by ruling on the node in the alignment
 dialogue, and a deferral is therefore a state the author can leave and not a door
 that locks behind them.
+
+The mechanism does not reach the nodes that decide who may decide. A deferral or a
+delegation offered on a probe on `authority`, `class-recommendation`,
+`what-acts-during-bootstrap`, or on this node is not recorded: the sitting says that
+it is refusing it and why, and puts the question again in other terms. The reason is
+that a rule of change applied to itself has no brake after it fires once, and that
+these are the nodes `class-recommendation`'s capture-shaped limb already reaches, so
+the bound adds only that on these four the recommendation is not merely a
+recommendation. What it costs is stated where the option is argued: it is the one
+bound in this node that runs against the author rather than against the AI.
```

### authority

Ratified, on the capture-shaped limb of `class-recommendation`'s test, and the
reading is written here because that node's answer of 2026-09-08 requires one.

Capture-shaped, decisively. This node states the conditions under which authority
over a question moves from the author to the AI, and the AI is the party it moves
to. `class-recommendation` defines the limb as the case where the party that would
set the answer is the party the answer is meant to check, and there is no closer
instance of it in the record: the answer's own `against` is the argument that the AI
drafts the question whose difficulty triggers the transfer, and a class of delegated
or deferred here would let that argument be settled by the party it is about.

Irreversible under one of the four options on the answer fact, and the reading says
so rather than resting on the limb it does not need. Under
`degradation-is-permanent` a class lowered is lowered for good, and a wrong answer
on this node would then not be paid back, since the nodes it had already lowered
would stay lowered. Under the recommended option it is not irreversible, because a
class can be raised by an ordinary ruling. The limb therefore holds conditionally,
and the conditional is itself a reason to ratify: the author should not be handed a
node whose reversibility depends on which of its own options is chosen.

Not expensive. The cost of being wrong is a sitting's work and some re-ruling, not
work the record cannot take back cheaply.

The boldness is low. `class-recommendation` makes delegated the residual, so a
recommendation of ratified is a departure from the default and needs the limb it
names; the limb is named and is the plainest instance of it the record holds. The
recommendation is also the carve-out of `out-of-its-own-reach` applied to this node
by the ordinary rule rather than by that option, which is worth saying: if the
answer fact adopts that option, this node is inside its own scope, and if it does
not, this ruling still keeps the node in front of the author.

## Account

### Minted on the author's new disposition of 2026-09-08

The author, at `words/2026-09-08/39`, in the one new disposition of that turn: "The
author may defer or delegate on the answer to a periagogic probe which means
author's unconfirmed answer choice is the option supported by main thread AI
judgement based on expert return, tradition and internal graph consistency. Author
chooses deferred or delegated authority for the node with reasoning that references
the probe(s). Deferred/delegated probe responses may provide additional author
context for AI judgement. A ratified authority is degrated to deferred with a
deferred probe and a ratified/deferred authority is degraded to delegated with a
delegated probe."

Placed under `probe-response-treatment` because that node says a probe response is
alignment input and takes its sequencing, and this refines it for the response that
declines the question instead of answering it. The slug is new rather than a second
answer on the parent: the parent's question is how a response is treated, and this
one is what a particular kind of response does, which is a narrower question and
takes its own facts.

The disposition was not a proposal about a case that might arise. Seven of the
fourteen responses in the same turn exercise it — three on `movements`, three on
`expert-instructions`, one on `round-termination` — so the node is minted from a
mechanism the author had already used, and those seven are recorded as rulings on
those nodes' authority facts under it.

### What the design changed, and what it left

The tradition pass ran wide, and what it produced was not a single argument but a
set of independent arrivals at three bounds. The bound on how far the grant reaches
was reached by the surrogate standard of substituted judgment, by the intelligible
principle, by interval delegation, and by this record's own rule that a delegation
covers the class of decision it names; that bound is in the recommended option.
The bound on reversibility was reached from integrity lattices, from capability
revocation, from the ratchet effect, from agency law, and from the precommitment
literature; the recommended option meets it by reading the author's fourth clause as
a statement about what a probe does rather than a cap, and the strict reading is
kept beside it as `degradation-is-permanent` so the author can rule for it. The
bound on which nodes the mechanism may reach was arrived at from major questions,
from risk-scaled capacity, and from the self-amendment paradox; it is the option
`out-of-its-own-reach`, and it is not recommended, because the author's ruling on it
is the thing the option is about.

Three readings are minted with this node: `substituted-judgment`, which the first
change rests on; `deference-to-the-drafters-own-text`, which is the fact's
`against`; and `contra-proferentem`, which the second change rests on. Two existing
readings gain a bearing on this node: `non-liquet`, which diverges from it, and
`ocap-attenuation`, which the third change follows. The rest of what the pass
returned is not recorded, and that is a departure from `evaluation`'s rule that
every tradition surfaced is recorded as a reading with the resolution it informed.
The departure is named rather than hidden: the pass returned more than thirty
readings, minting each as a node would have taken the sitting, and what is recorded
is what the recommendation and the case against it actually rest on. The remainder
is a reconciliation item on this node.

### The two things this answer needs and the record does not have

The mark. `what-an-option-row-carries` names three marks and the author's words of
2026-09-08 name five, the two new ones being the author's choice short of
confirmation and an expert's choice. This mechanism's whole product is the first of
those, and `recording` offers `confirm` and `edit` as ruling responses, neither of
which records it. Until that is settled, a deferral is recorded as a ruling on the
authority fact plus a sentence in the account, which carries the substance and not
the encoding. That is a reconciliation item and it is `recording`'s and
`what-an-option-row-carries`', not this node's to decide.

`partial-ratification`, standing unruled on `growth`, is the second. Every deferral
rules the authority fact in the same turn that leaves the answer fact to the AI, so
the mechanism is an instance of ruling one fact while another is still being
drafted. The node exists and the mechanism needs it; nothing here rules it.

The probe schema is a third and smaller one. The author's words of the same turn add
a `target` and a `type` to a probe, and the reader's `PROBE_KEYS` has neither, so
the two probes on this node carry neither field. That widening lands on the
implementation ref and is named in the sitting's report.
