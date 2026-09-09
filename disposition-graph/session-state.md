---
question: Where does a sitting's own working state live while it is not yet in the record?
stage: maieutic
probes:
  - id: is-the-staging-store-a-fourth-thing-a-session-loads
    target: author
    type: periagogic
    asks: >-
      The session-context node says a session loads three projections and
      nothing else. Is the staging store a fourth, or is it reached through one
      of the three?
    fact: answer
    why: >-
      The author named the harness's own session-scoped memory tools as a
      candidate mechanism, `words/2026-09-08/21`. Those tools are loaded by the
      harness and not by a projection of the graph, so on
      `commons.systems/disposition-graph/session-context`'s answer they are a
      fourth thing a session loads, which that answer puts on the frontier as a
      prune-by-default proposal. The record cannot answer which way the author
      wants that read: either the staging store is an exception
      `session-context` must name, or the store is reached through the rules
      projection, which is what this node recommends, and the harness's tools
      are not the mechanism.
    discharges: >-
      Which option this fact recommends, and whether `session-context`'s answer
      gains a fourth term or keeps its three.
    source: ai
    raised: 2026-09-08
    rank: 1
  - id: what-does-a-dead-sitting-owe-the-next
    target: author
    type: periagogic
    asks: >-
      When a sitting dies without stopping, compacted, killed, or ended by an
      error, what does the next sitting owe what the dead one left in the store?
    fact: answer
    why: >-
      The answer says the store does not outlive the sitting and names no
      reader, no scan, no staleness test and no sweeper, and the author's
      refinement of 2026-09-08 attaches the standard report to the moment the
      sitting stops. Crash-only software (Candea and Fox, HotOS IX, 2003) holds
      that correctness lives on the recovery path and that a path taken only on
      an orderly exit is wrong when it is finally needed; the failures this
      store exists for are exactly the ones that never reach a stop. The same
      tradition's instruments read at open rather than sweep at close, as
      LevelDB reconciles its manifest against the directory at open and an XA
      participant enumerates its own in-doubt branches on restart. The record
      cannot choose between a report obligated at the stop and one obligated at
      the start, and only the second survives the failure the store is for.
    discharges: >-
      Whether the store is a recovery log or a diary, and with it whether the
      standard report is printed when a sitting stops, when a sitting starts, or
      both; and whether the store needs a sitting identity, a liveness test and
      a sweeper.
    source: ai
    raised: 2026-09-08
    status: discharged
    reason: >-
      Answered by the author at `words/2026-09-08/39`: "The session local store is a
      recovery log specifically to supplement the compaction record to recover from
      compaction. Other error recovery states are handled by the harness. The session
      local store just formalizes state that must be retained across compaction." A
      recovery log and not a diary, so the first limb is settled; its one failure is
      compaction, so the third is settled the other way from what the probe expected,
      no sitting identity, no liveness test and no sweeper, because the reader is the
      sitting that wrote it and a sitting that died is the harness's to answer for. The
      second limb goes with them: the report stays at the stop, since nothing is
      obliged to read a store left behind. The probe's crash-only argument is answered
      and not adopted, and the answer's content now carries the answer.
  - id: is-the-ledger-rule-admission-or-citation
    target: author
    type: periagogic
    asks: >-
      Is the ledger's rule about what may be admitted to the record, or about
      what may be cited from it?
    fact: answer
    why: >-
      The whole concession rests on reading it as admission: because the ledger
      takes only a quotation that bears on a disposition fact, an unclassified
      word cannot go on the ref and must wait in a store off it. Git's object
      store makes the other reading available and the record has never been
      asked for it: `git add` writes the blob to `.git/objects` before the index
      records anything, so content is durable while unreferenced, and is reaped
      only by a later collection. On that reading the author's words reach the
      ref the turn they are said, uncited and prunable, the store holds only the
      open classification, and the concession this node apologises for does not
      exist. The record passed `no-store-and-the-ledger-takes-everything`, and
      the reason it passed answers a ledger that takes everything as entries; it
      does not answer a ref that holds bytes nothing cites, which is what
      `commons.systems/disposition-graph/evaluation` requires be struck before
      the position is re-raised.
    discharges: >-
      Which option the answer fact recommends, and whether the one-checkpoint
      window in which the record does not hold the author's words exists at all.
    source: ai
    raised: 2026-09-08
    status: discharged
    reason: >-
      the author answered it on 2026-09-08, in the words at `words/2026-09-08/28`.
      The rule is admission, and it is admission to the ledger alone: "keeps a
      quotation only where it bears on a disposition fact" is a rule for what is
      kept in the disposition quotation store on the disposition ref, and other
      quotations may be kept for other reasons in other stores, including a
      compaction-safe session store, either by rule or by the AI's judgement. So
      the concession this node apologises for is real and the author holds it
      deliberately rather than as a defect: the ledger stays narrow, and breadth
      is bought in a store the ledger's rule does not reach. The git-object
      reading is not taken and is not refuted; what the answer settles is that
      the ledger's admission rule governs the ledger and nothing else, which is
      what the probe asked and is enough to close it.
  - id: where-does-an-unpaid-residual-go
    target: author
    type: periagogic
    asks: >-
      When the sitting that owed it is gone, who is a reconciliation residual
      owed to?
    fact: answer
    why: >-
      Three positions stand and the record has no arbiter among them. The
      author's refinement of 2026-09-08 puts residuals in the store; this
      answer says the store dies with the sitting; and the parent,
      `commons.systems/disposition-graph/transience`, forbids by name any
      artifact recording a unit of work, a plan, a task, or a step list, and
      authority narrows on the way down. Two traditions say the same thing about
      the shape: Robert's Rules carries what a body did not finish as Unfinished
      Business on the parent's agenda, by rule and not by anyone's memory, and
      Dynamo's hinted handoff makes owed work a durable object held by a third
      party with a discharge and a sweeper, the one thing it may never be being
      scoped to the life of the party that owes it.
    discharges: >-
      Whether residuals belong in this node at all, or are a frontier the
      reconciliation instrument derives, which is `work-loop`'s second direction
      and is held back by that node's declared shim.
    source: ai
    raised: 2026-09-08
    rank: 3
  - id: what-shows-that-a-classification-happened
    target: author
    type: periagogic
    asks: >-
      When a sitting judges that something you said was direction to it and not
      disposition, what should the record show about that having happened?
    fact: answer
    why: >-
      The answer says the record keeps nothing, which speaks to content and is
      silent about existence, so a classification never made and a
      classification made wrongly leave identical evidence. The file-drawer
      problem (Rosenthal, Psychological Bulletin 86:638, 1979) is the finding
      that selection by an interested party distorts a corpus even where every
      individual decision is honest, and its remedy is registration before the
      outcome is known, as ICMJE has required of trials since 2005. Here the
      party that classifies the author's words is the party the classification
      benefits, it classifies on its own judgment with no schedule, immediately,
      and with no hold by which a contested classification could suspend the
      destruction. The write-through discipline this answer offers bounds the
      latency of entry and does not touch the selection.
    discharges: >-
      Whether a struck word leaves a stub, a count, or a dated null entry, and
      whether the standard report must list what the sitting did not enter.
    source: ai
    raised: 2026-09-08
    rank: 4
  - id: may-the-store-direct-what-it-may-not-authorize
    target: author
    type: periagogic
    asks: >-
      What may a sitting do on the strength of the store alone?
    fact: answer
    why: >-
      This answer says nothing in the store has any authority; the author's
      refinement of 2026-09-08 puts the sitting's sequencing there precisely in
      order to direct the alignment dialogue. Both cannot be read flatly, and
      the distinction the record lacks is one the transcript tradition already
      has: an uncertified realtime rough may not be cited and nonetheless
      properly governs the conduct of the proceeding, having no authority in the
      record and full authority over the proceeding. Against that stands the
      record's own adopted reading in
      `commons.systems/disposition-graph/event-sourcing-derived-view`, that a
      view is never stored because a second implementation of the fold is a
      second truth, and `--frontier` already derives stage and rank order.
    discharges: >-
      Whether the no-authority sentence divides in two, and how much of the
      sequencing is stored at all rather than derived, the residue being which
      nodes this sitting touched and which probes are not yet on their nodes.
    source: ai
    raised: 2026-09-08
    rank: 2
facts:
  - name: answer
    options:
      - name: a-compaction-store-the-ai-shapes
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/28
          - words/2026-09-08/21
          - words/2026-09-08/24
          - words/2026-09-08/25
          - words/2026-09-08/39
      - name: a-file-a-global-rule-fixes
        source: ai
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/21
        status: passed
        reason: "the author's refinement of 2026-09-08 delegates the store's implementation and states the requirement as surviving compaction rather than as being found by a later session, so the rule this option fixes a path by is a rule the author struck, and the reason the option gave for fixing it, that a store a session names is a store the next session cannot find, describes a boundary the store no longer crosses"
      - name: harness-session-memory
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/21
      - name: the-record-carries-it-at-the-checkpoint
        source: commons.systems/disposition-graph/checkpoint
        ref: "2026-09-02"
      - name: no-store-and-the-ledger-takes-everything
        source: commons.systems/disposition-graph/quotes
        ref: "2026-09-07"
        status: passed
        reason: "the author's refinement of 2026-09-08 admits to the ledger only what bears on a disposition fact, so a ledger that takes everything is the position that refinement left"
      - name: the-store-is-written-verbatim-and-holds-the-sequencing
        source: author
        ref: "2026-09-09"
        supports:
          - words/2026-09-08/36
          - words/2026-09-09/2
    recommends: a-compaction-store-the-ai-shapes
    boldness: low
    against: "The answer records a requirement and delegates the mechanism, which is what the author asked for and is also the shape in which a rule can be satisfied by nothing in particular. Compaction survival is not observable from inside the sitting that needs it: a store the AI judged adequate and that turns out not to have survived is discovered by a session that no longer has the thing it would have compared against, so the delegation hands the AI a choice whose failure it is structurally unable to see. The displaced option was worse in its reason and better in this one respect, that a fixed path is checkable by anyone at any time. What would close the gap is a test the sitting can run rather than a mechanism the rule names, and the record does not have one."
  - name: authority
    options:
      - name: ratified
      - name: delegated
        source: author
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/28
      - name: deferred
    recommends: delegated
    boldness: low
review:
  survey:
    date: 2026-09-09
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "ac4476e037245848de881a6b68eeecf30179339aa999a78509f2b08c785b1a38"
      answer: "fb8a7dfa09596868d3f743464648548a4424af6787fdfc696a5bf3a1c91e6fef"
      options: "300908b55c0a8a94f6c4ef6fdeb4989215934c0229d6a5a198c56e62dd4491cf"
      rivals: "d8fce682ababcc3149d4277fbfe24c4efdb790e6d72ef18aa5070fc930b8f530"
      words: "9d4b69be9613c3992ae11e593617070f5908b4a20800faa983068fd2df3203ec"
form: rule
under:
  - commons.systems/disposition-graph/transience
tier: global
defines:
  - term: staging store
    gloss: "The store outside the record and outside version control in which a sitting holds the author's words and its own working state until the record can take them; it must survive compaction, it must survive nothing else, and its shape is the AI's to choose."
---

## Facts

### answer

The recommendation is `a-compaction-store-the-ai-shapes`, at low boldness. Low
because the answer is the author's own words of 2026-09-08 and the AI is transcribing
a delegation rather than choosing under one; what the AI adds is the reasoning that
connects the requirement to the mechanism's release, and the divergence that says
what the release costs.

The question exists because the author's refinement of 2026-09-08 created something
the record had not had. `commons.systems/disposition-graph/quotes` now admits to the
ledger only a quotation that bears on a disposition fact, and holds everything else,
the sitting's directives among them, in a store that is not on the ref. That store
was named there and never given a mechanism, and the author named a candidate on the
same day and asked for it early, because a sitting that compacts loses whatever only
its context held.

What changed on 2026-09-08, and why the AI's own first answer was struck. The node
first recommended `a-file-a-global-rule-fixes`, a path fixed by this rule, on the
reason that a store a session names is a store the next session cannot find. The
author's refinement states the requirement instead: the store must survive a
compaction boundary, and must survive no other — not a session, not a sitting,
therefore not a network, therefore not version control. That strikes the AI's reason
rather than contradicting its conclusion. The boundary the reason turned on is one
the store never crosses, so the argument that a rule must fix the path has nothing
left to rest on, and with it goes the argument that made the harness's memory a
fourth thing a session loads: the store is state the sitting writes, not context it
is given, whatever holds the bytes. The author then delegates the mechanism in terms.
The AI records the option passed rather than amended because its name states the rule
the author struck.

Two sentences of the landed answer were falsified and are struck here, and the record
says so rather than quietly replacing them. The first is the fixed path with its
reason. The second is that a sitting "resolves them at the next checkpoint rather
than at the sitting's end, so the window in which the record does not have them is
one checkpoint wide": the author's fourth bullet stages a word until the sitting is
finished, so the window is a sitting wide. What survives the strike is the property
that made the sentence worth writing — the store is write-through, the words are
written the turn they are said, and nothing is ever held only in a context — because
what the author moved is when the resolution happens and not when the writing does.

What the option it displaces bought, said before it is displaced. The record's
incumbent position is `the-record-carries-it-at-the-checkpoint`, and what it bought
is the strongest guarantee on offer: `commons.systems/disposition-graph/checkpoint`
holds that the record is the dialogue's memory and that nothing the author said is
held only in a context, and under it there is no store to lose because there is
nothing outside the record to keep. It is on the list, not passed over, and the case
for it is that this whole question is the cost of the exception the author's
refinement opened. The refinement of 2026-09-08 widens that cost rather than
narrowing it, since a word now waits a sitting and not a checkpoint, and the author
holds the wider concession knowingly.

`no-store-and-the-ledger-takes-everything` is passed over rather than argued with:
the author's refinement of the same day settles it directly, admitting to the ledger
only what bears on a fact.

#### a-compaction-store-the-ai-shapes

A store outside the record and outside version control whose one requirement is that
it survive compaction, and whose shape — a local memory, a local file, one store or
several — is the AI's to choose. The record fixes the requirement and delegates the
mechanism, which is the author's refinement of 2026-09-08. The store keeps anything
that could plausibly be an articulation of a disposition fact, staged, until the
sitting is finished; the ledger's narrower rule governs the ledger alone.

**AI support.** It is what the author said, and what the author said dissolves the
question the node was minted to decide rather than answering it. The AI had put a
fixed path against the harness's memory and argued the choice on which a forgetful
session would find; the author's requirement is compaction survival, which both
mechanisms meet, and the boundary the AI's reason turned on — a later session finding
the store — is a boundary the store never crosses, because it does not outlive the
sitting. With the reason struck the argument has no work left to do, and what remains
is a requirement the record can state and a mechanism it has no reason to fix. The
wider admission rule follows the same logic from the other side: a word staged and
later discarded costs a line, and a word not staged and later needed is gone, so the
store errs toward keeping and the ledger errs toward narrowness, each where its error
is cheap.

**AI divergence.** A delegated mechanism is a mechanism no reading can check. The
displaced option was wrong in its reason and right in one property this one gives up:
a path fixed by a rule is verifiable by anyone, and "whatever the AI judged adequate"
is verifiable by nobody, including the session that would need to know. The failure
mode is silent by construction — a store that did not survive compaction is noticed,
if at all, by a session that has already lost what it would have compared against —
so this answer records a requirement it cannot test. The AI also notes that it is the
beneficiary of the delegation, and that the delegation was given in a parenthesis
inside a message the author prefaced with not following all of these details.

**Content.**

```markdown
---
question: Where does a sitting's own working state live while it is not yet in the record?
form: rule
under:
  - commons.systems/disposition-graph/transience
tier: global
defines:
  - term: staging store
    gloss: "The store outside the record and outside version control in which a sitting holds the author's words and its own working state until the record can take them; it must survive compaction, it must survive nothing else, and its shape is the AI's to choose."
---

## Answer

In a store outside the record and outside version control, whose one requirement is
that it survive compaction. That requirement is narrow, and it is what fixes
everything else: the sitting's working state must cross a compaction boundary and it
must cross no other. It does not reach another session or another sitting, so it does
not cross a network, so it has no business in version control; a local memory or a
local temporary file is enough. What the store holds is what the sitting has not yet
been able to put in the record: the author's words whose relation to a disposition
fact is unresolved, and the sitting's own working state. Nothing in it has any
authority, it is not on the disposition ref, and it does not outlive the sitting.

The store is a recovery log and not a diary, and the one failure it recovers from is
compaction. Every other way a sitting can end, killed, crashed, or stopped by an
error, is the harness's to handle, and the store owes such an ending nothing. It is
read on the far side of a compaction by the sitting that wrote it, so it carries no
sitting identity, needs no liveness test and no sweeper, and no later sitting is
obliged to look for one left behind; a store whose sitting died is not a thing the
record recovers, it is a thing the record never had. The crash-only reading, that a
recovery path taken only on an orderly exit is wrong when it is finally needed, is
answered here rather than adopted: compaction is not a crash. It is a scheduled event
inside a sitting that continues across it, so this store lies on the ordinary path and
not the exceptional one, and the instruments that would make a recovery log correct in
the crash-only sense, an identity, a scan at open, a sweeper for what no one claims,
buy nothing when the reader is the writer and the writer has not gone away.

The mechanism is the AI's to choose, and different state may be held by different
tools or in different files as the AI judges best. What this rule fixes is the
requirement, because a requirement is what a later sitting can be held to, and a
mechanism is a fact of the harness that will change under the record. Where the AI's
choice is a file, `tmp/staging/<date>.md` at the root of the implementation checkout
is the one this record has used, and that is an instance and not the rule. Whatever
its shape, the store is not a fourth thing a session loads: what a session loads is
this rule, which is one of the three projections `session-context` allows, and the
store is state the sitting writes and reads rather than context it is given.

The store's admission rule is not the ledger's, and confusing the two is the error
this paragraph exists to prevent. The ledger keeps a quotation only where it bears on
a disposition fact. The store keeps anything that could plausibly be an articulation
of one, staged, and keeps it staged until the alignment sitting is finished, when the
relationships between the quotations and the disposition facts are resolved and
recorded on the ref. The wider admission is deliberate and the asymmetry is the
reason: staging a word that turns out to have directed the sitting alone costs the
line it occupies, and failing to stage one that turns out to bear on a fact costs the
word. Quotations may also be kept in other stores for other reasons, by rule or by
the AI's judgement; the ledger's rule governs the ledger.

A word leaves the store in one of two directions and never sits there. Where the
sitting resolves that the words bear on a disposition fact, they are entered in the
ledger and the store's copy is struck, which is the graduation the quotes node's
answer names. The strike waits on the landing and not on the writing: a copy is
struck only where the entry that replaces it is reachable from `origin/disposition`,
because a checkpoint that writes the entry into a worktree and then fails to land it
would otherwise strike the only copy there is, and the worktree dies with the
session. That is the guard the unconfirmed-accumulation node's fold already carries,
held for the same reason and against the same loss: text that is not on the ref is
not moved to the history by striking it, it is ended. Where the sitting resolves that
the words directed the sitting alone, they stay in the store and die with it, and the
record keeps nothing.

The store is a concession and the record says what it costs. The checkpoint node
holds that the record is the dialogue's memory and that nothing the author said is
held only in a context; a store outside the record is exactly that for as long as a
word sits in it unresolved, and under the author's refinement that is until the
sitting ends and not until the next checkpoint. What bounds the concession is that
the store is write-through and not a cache: a sitting writes the author's words to it
the turn they are said, so what waits is the resolution and never the writing, and no
word is ever held only in a context.
```

#### a-file-a-global-rule-fixes

One file, at a path fixed by the rule this node projects, holding the author's words
that a sitting has not yet classified and the sitting's own working state; reached
through the rules projection, which is one of the three things
`session-context` says a session loads, so the store is not a fourth. It is not on
the disposition ref, it does not outlive the sitting, and an entry leaves it when the
record takes the words.

**AI support.** It satisfies what `quotes` requires of the store — survives
compaction, is off the ref, graduates an entry when a fact reference is recorded —
without adding anything to what a session loads, because a rule already names it and
rules are already loaded. It couples the record to nothing outside itself, which for
a store holding the author's words is the point rather than a preference.

**AI divergence.** It is a discipline and not a mechanism. Nothing makes a session
read the file; the rule tells it the file is there, and a session that has lost the
thread has also lost the reason to look. The author's option does not have that
weakness, and the AI is recommending against the author's own candidate on an
argument the author has not heard.

**Content.**

```markdown
---
question: Where does a sitting's own working state live while it is not yet in the record?
form: rule
under:
  - commons.systems/disposition-graph/transience
tier: global
defines:
  - term: staging store
    gloss: "The store outside the record and outside version control in which a sitting holds the author's words and its own working state until the record can take them; it must survive compaction, it must survive nothing else, and its shape is the AI's to choose."
---

## Answer

In one file, the staging store, `tmp/staging/<date>.md` at the root of the
implementation checkout, gitignored and named by the sitting's own date: it holds what
the sitting has not yet been able to put in the record, the author's words whose
classification is unresolved and the sitting's own working state. The path is fixed
here rather than chosen by a session, because a store a session names is a store the
next session cannot find. It is at the checkout's root and not in a worktree, since a
worktree is deleted with the session that made it. It is reached through the rules
projection and is therefore not a fourth thing a session loads, as the session-context
node's answer allows only three. It is not on the disposition ref, nothing in it has
any authority, and it does not outlive the sitting.

A word leaves the store in one of two directions and never sits there. Where the
sitting resolves that the words bear on a disposition fact, they are entered in the
ledger at the next checkpoint and the store's copy is struck, which is the graduation
the quotes node's answer names. The strike waits on the landing and not on the
writing: a copy is struck only where the entry that replaces it is reachable from
`origin/disposition`, because a checkpoint that writes the entry into a worktree and
then fails to land it would otherwise strike the only copy there is, and the worktree
dies with the session. That is the guard the unconfirmed-accumulation node's fold
already carries, held for the same reason and against the same loss: text that is not
on the ref is not moved to the history by striking it, it is ended. Where the sitting resolves that they direct the
sitting alone, they stay in the store and die with it, and the record keeps nothing,
which is what the author's refinement of 2026-09-08 intends.

The store is a concession and the record says what it costs. The checkpoint node
holds that the record is the dialogue's memory and that nothing the author said is
held only in a context; a store outside the record is exactly that, for as long as a
word sits in it unclassified. What bounds the concession is that the store is
write-through and not a cache: a sitting writes the author's words to it the turn
they are said, and resolves them at the next checkpoint rather than at the sitting's
end, so the window in which the record does not have them is one checkpoint wide.
```

#### harness-session-memory

The harness's own session-scoped memory tools carry the store: the sitting writes what
it must not lose through the tool the harness provides, and the harness restores it
into a compacted context without the session having to know where to look.

**AI support.** It is the only candidate that does not depend on the session
remembering, which is the failure the store exists to prevent, and the author named it
for that reason. It costs the record no mechanism of its own.

**AI divergence.** It is a fourth thing a session loads, which `session-context`'s
answer allows only three of, so taking it obliges that node to grow a term or puts
this store on the frontier as a prune-by-default proposal. It couples the record to
one harness's feature set for the storage of the author's words. And the tools the
harness offers here are not scoped as the store needs: what this record has is a
project-scoped memory that outlives the sitting, and words that die with the sitting
would have to be deleted by the same discipline this option is meant to replace.

**Content.**

From: a-file-a-global-rule-fixes

```diff
@@ -11,16 +11,14 @@
 
 ## Answer
 
-In one file, the staging store, `tmp/staging/<date>.md` at the root of the
-implementation checkout, gitignored and named by the sitting's own date: it holds what
-the sitting has not yet been able to put in the record, the author's words whose
-classification is unresolved and the sitting's own working state. The path is fixed
-here rather than chosen by a session, because a store a session names is a store the
-next session cannot find. It is at the checkout's root and not in a worktree, since a
-worktree is deleted with the session that made it. It is reached through the rules
-projection and is therefore not a fourth thing a session loads, as the session-context
-node's answer allows only three. It is not on the disposition ref, nothing in it has
-any authority, and it does not outlive the sitting.
+In the harness's own session-scoped memory, the staging store, holding what the
+sitting has not yet been able to put in the record: the author's words whose
+classification is unresolved, and the sitting's own working state. The harness
+restores it into a compacted context without the session having to know where to
+look, which is why the author named it and which is the whole of its advantage: no
+path has to be fixed, because no session has to find one. It is not on the
+disposition ref, nothing in it has any authority, and it does not outlive the
+sitting.
 
 A word leaves the store in one of two directions and never sits there. Where the
 sitting resolves that the words bear on a disposition fact, they are entered in the
```

#### the-record-carries-it-at-the-checkpoint

There is no store. Everything the author says goes into the record at the next
checkpoint, on the node it bears on or in that node's account where its fact is not
yet known, and the classification the author's refinement asks for happens in the
record rather than before it.

**AI support.** It is what `commons.systems/disposition-graph/checkpoint` already
says: the record is the dialogue's memory and nothing the author said is held only in
a context. It cannot lose a word to compaction because there is nowhere outside the
record for a word to be. It needs no mechanism, no path and no rule, and it is the
only option on this list that adds nothing to the record's surface.

**AI divergence.** It puts words the author may have meant only for the sitting into
the record, which is what the refinement of 2026-09-08 was given to stop. Its reply
is that a node's account is not the ledger and that a directive recorded there is
labelled as one, but that reply asks the author to accept a second place where their
words accumulate, and the record has not asked them.

**Content.**

From: a-file-a-global-rule-fixes

```diff
@@ -11,16 +11,11 @@
 
 ## Answer
 
-In one file, the staging store, `tmp/staging/<date>.md` at the root of the
-implementation checkout, gitignored and named by the sitting's own date: it holds what
-the sitting has not yet been able to put in the record, the author's words whose
-classification is unresolved and the sitting's own working state. The path is fixed
-here rather than chosen by a session, because a store a session names is a store the
-next session cannot find. It is at the checkout's root and not in a worktree, since a
-worktree is deleted with the session that made it. It is reached through the rules
-projection and is therefore not a fourth thing a session loads, as the session-context
-node's answer allows only three. It is not on the disposition ref, nothing in it has
-any authority, and it does not outlive the sitting.
+Nowhere: there is no store. What the author says goes into the record at the next
+checkpoint, on the node it bears on, or in that node's account where the fact it
+bears on is not yet known, and the classification the author's refinement asks for
+happens in the record rather than before it. The checkpoint node's rule stands
+unqualified, and nothing the author said is held only in a context.
 
 A word leaves the store in one of two directions and never sits there. Where the
 sitting resolves that the words bear on a disposition fact, they are entered in the
```

#### no-store-and-the-ledger-takes-everything

The ledger takes every word the author says, and the sitting sorts them later. This is
what the record did until 2026-09-08.

**AI support.** It has no gate for the AI to operate, which is the divergence `quotes`
records against its own recommended answer: an entry never written leaves no trace,
where an unreferenced entry at least sits there being counted.

**AI divergence.** The author refined it away on 2026-09-08, saying that a quotation
needs persisting only where it bears on a disposition fact.

**Content.**

From: a-file-a-global-rule-fixes

```diff
@@ -11,16 +11,9 @@
 
 ## Answer
 
-In one file, the staging store, `tmp/staging/<date>.md` at the root of the
-implementation checkout, gitignored and named by the sitting's own date: it holds what
-the sitting has not yet been able to put in the record, the author's words whose
-classification is unresolved and the sitting's own working state. The path is fixed
-here rather than chosen by a session, because a store a session names is a store the
-next session cannot find. It is at the checkout's root and not in a worktree, since a
-worktree is deleted with the session that made it. It is reached through the rules
-projection and is therefore not a fourth thing a session loads, as the session-context
-node's answer allows only three. It is not on the disposition ref, nothing in it has
-any authority, and it does not outlive the sitting.
+Nowhere: the ledger takes every word the author says and the sitting sorts them
+later, so there is nothing outside the record to keep and nothing to lose. This is
+what the record did until the author's refinement of 2026-09-08.
 
 A word leaves the store in one of two directions and never sits there. Where the
 sitting resolves that the words bear on a disposition fact, they are entered in the
```

#### the-store-is-written-verbatim-and-holds-the-sequencing

The author's words go to the store verbatim, whatever their relation to a disposition
fact turns out to be, and the sitting's re-evaluated alignment sequencing is among the
working state the store holds.

**AI support.** Both additions are the author's own at `words/2026-09-08/36`, steps 2
and 3, and both follow from what this answer already requires rather than adding
weight to it. Verbatim follows from the store being write-through: what waits is the
resolution and never the writing, and a reading written in place of the words has
resolved something the sitting said it had not, so the copy that reaches the ledger
would be the sitting's and not the author's. The sequencing follows from the store's
own definition of working state as what does not outlive the sitting: a sitting that
re-orders what it will take up has produced exactly such a thing, and of the two
places it could go, this one and the ref, the ref is closed to it because nothing
rules on it.

**AI divergence.** Writing the sequencing down is a stored view, and this record's
answer on `event-sourcing-derived-view` holds that a view is never stored, a second
implementation of the fold being a second truth; `--frontier` already derives the
ruling order from the graph, and an ordering held beside it is the second
implementation that answer refuses. This node's own probe already names that tension
and the option does not resolve it. What is said for the option is that the sequencing
is not a fold of the ref at all, being the sitting's departure from the derived order
under input the ref does not yet hold, so there is nothing for it to be a stale copy
of. What is said against it is that the departure becomes a copy the moment the input
lands, and nothing here strikes it then.

**Content.**

From: a-compaction-store-the-ai-shapes

```diff
@@ -17,9 +17,11 @@
 must cross no other. It does not reach another session or another sitting, so it does
 not cross a network, so it has no business in version control; a local memory or a
 local temporary file is enough. What the store holds is what the sitting has not yet
-been able to put in the record: the author's words whose relation to a disposition
-fact is unresolved, and the sitting's own working state. Nothing in it has any
-authority, it is not on the disposition ref, and it does not outlive the sitting.
+been able to put in the record: the author's words, written verbatim the turn they
+are said and whatever their relation to a disposition fact turns out to be, and the
+sitting's own working state, of which the sitting's alignment sequencing is one part.
+Nothing in it has any authority, it is not on the disposition ref, and it does not
+outlive the sitting.
 
 The store is a recovery log and not a diary, and the one failure it recovers from is
 compaction. Every other way a sitting can end, killed, crashed, or stopped by an
@@ -56,6 +58,31 @@
 word. Quotations may also be kept in other stores for other reasons, by rule or by
 the AI's judgement; the ledger's rule governs the ledger.
 
+Two of the things the store holds are named because the record depends on their being
+there. The author's words are written verbatim: the store holds the record's one copy
+of them until the ledger takes it, and a paraphrase cannot be promoted, since what the
+ledger keeps is the words and not the sitting's reading of them. And the sitting's
+alignment sequencing is working state like any other. A sitting re-evaluates what it
+will take up next each time alignment input arrives, and that ordering is the
+sitting's own: nothing rules on it, it binds no later sitting, and it dies with this
+one, so it is held here and not on the ref. It is not a second copy of the record's
+order. `alignment-order`'s rank is derived from the graph by `--frontier` and stays
+derived; what the store holds is this sitting's departure from that order under the
+input in hand.
+
+How much of the sequencing is held is fixed by what the sitting must be able to print
+when it stops, which is `standard-report`'s question and is answered there. For each
+disposition the sitting has sequenced, the store holds its place in the order, the
+ground it was placed on, and the sitting's paraphrase of the author's inputs that
+decomposed into it. The paraphrase is held here and nowhere else, being the sitting's
+own reading and not the author's words, which are in the ledger and are addressed from
+the options they support. Two things a reader might expect here are not here. The
+disposition's id and its question are on the node and are read from it, since a
+disposition is a node. And the rank the sitting assigns a probe is recorded on the
+probe and not in the store, which is `author-questions`' answer, so what the store
+holds of the ordering is the order of the dispositions and never the order of the
+questions inside one.
+
 A word leaves the store in one of two directions and never sits there. Where the
 sitting resolves that the words bear on a disposition fact, they are entered in the
 ledger and the store's copy is struck, which is the graduation the quotes node's
```

### authority

Delegated, on the author's words of 2026-09-08, which say in terms that "session
state implementation is delegated". The AI had recommended ratified on the
irreversible limb of `commons.systems/disposition-graph/class-recommendation`'s test,
and the reading is kept here because the author's word does not refute it: a word
lost from the store is not recoverable, there being no second copy, the session that
heard it being the thing that failed, and the author having to say it again without
knowing they had to. Neither of the other two limbs carried it. The cost of being
wrong is small in work, since changing the mechanism is changing a path; and it is
not capture-shaped, since the store confers no authority on anything in it.

What the author's delegation does to that reading is divide it. The irreversibility
is in the requirement and not in the mechanism: what cannot be taken back is losing
the word, and every mechanism that survives compaction keeps it. So the limb the AI
found is real and lands on the requirement, which this node states and does not
delegate, while the mechanism the author released is the part whose error is cheap.
The AI records this as a recommendation and not as a ruling: the delegation was given
in a parenthesis, in a message the author prefaced with not following all of these
details, and against no pinned recommendation, so it is not the act
`commons.systems/disposition-graph/authority` requires. The author rules or corrects
it.

## Account

### Minted on the author's words of 2026-09-08

The author named the harness's own session-scoped memory tools as a candidate for the
staging store `commons.systems/disposition-graph/quotes` created the day before it,
and asked that it be sequenced early in the sitting so that the sitting's own
cross-compaction context is managed. The words are `words/2026-09-08/21`.

Why a node and not a probe or an option on `quotes`. All four of
`commons.systems/disposition-graph/probe-or-node`'s tests point the same way. The
author's response would be an answer that has to stand and not a ruling conferring a
class. It reaches past `quotes`: the author's own words say "and other compaction
survival records", and the answer binds `checkpoint` and `session-context` as much as
it binds the ledger. Something needs the answer long after any recommendation it
moved is ruled on, since every sitting after this one has to know where its own state
lives. And its answer is not a reading of `transience`'s: where a sitting's working
state lives is not settled by what a persistence class is.

The periagogic finding, which is the substance of this node and not its packaging.
The author's option collides with a disposition the record already holds and the
author may not have had in view. `session-context`'s answer is that a session loads
three projections and nothing else, and that anything else it loads is on the
frontier as a prune-by-default proposal. The harness's memory is loaded by the
harness. So the author's candidate is a fourth thing, and the record cannot take it
without either naming an exception in `session-context` or moving that node's answer.
That collision is this node's first probe, and it is put to the author open rather
than as a choice between drafted answers, because which way it goes is theirs.

The same finding read the other way, which the record owes itself. This checkout
already loads a harness memory index into every session, and by `session-context`'s
own test that is a fourth thing a session loads and therefore unsupported
implementation on the frontier. The record did not notice it because nothing looks;
it is recorded here as the option
`the-harness-memory-is-already-a-fourth-thing-loaded` on `session-context` rather
than left as an observation in an account that node's reader will never see.

What the sitting did in the meantime, disclosed rather than presented as the answer.
This sitting held its staging store as a plain file outside the worktree, at
`tmp/staging/2026-09-08-sitting.md` in the checkout, gitignored. That is the
recommended option in practice and without the rule that would make it findable, so
it is evidence of the shape working and not evidence that the mechanism is right; a
later session would not know the path, which is the whole of what the recommendation
adds and the whole of what the case against says it does not add enough of.

### Amended on the author's refinement of 2026-09-08

The author answered the node's own probes with maieutic context rather than with a
ruling, in `words/2026-09-08/28`, prefaced "I do not follow all of these details".
Four things followed.

The requirement was restated and the AI's reason for its recommendation was struck.
The store must survive compaction and must survive nothing else; it does not reach
another session or sitting, therefore not a network, therefore not version control.
The recommendation had been `a-file-a-global-rule-fixes`, argued on the ground that a
store a session names is a store the next session cannot find, and that ground names
a boundary the store does not cross. The option is passed rather than amended,
because its name states the rule the author struck, and the recommendation moved to
`a-compaction-store-the-ai-shapes`. This is the evaluation node's re-raising clause
running in the ordinary way: the AI lifted a status it wrote, and said what struck
it.

The mechanism was delegated and the requirement was not. The authority fact's
recommendation moved from ratified to delegated on the author's parenthesis, and the
reading under it divides the AI's original irreversibility finding: the irreversible
thing is losing the word, which is the requirement, and the mechanism's error is
cheap. The move is recorded as a recommendation and not as a ruling, because the
author's words answered no pinned recommendation and `authority` requires that they
do.

Two probes were discharged. `is-the-ledger-rule-admission-or-citation` is answered:
the ledger's rule is admission, and it governs the ledger alone, other stores being
free to keep other quotations by rule or by the AI's judgement. The concession the
node apologises for is therefore held deliberately by the author rather than
tolerated as a defect. The object-store reading that probe raised is neither taken
nor refuted, and is left on the probe for whoever needs it.

One landed sentence was falsified and the strike is recorded rather than performed
quietly. The answer had said a sitting "resolves them at the next checkpoint rather
than at the sitting's end, so the window in which the record does not have them is
one checkpoint wide". The author's fourth bullet stages a word until the sitting is
finished, so the window is a sitting wide and the record's exposure is larger than
the sentence claimed. What survives is the write-through property, since what moved
is when the resolution happens and not when the writing does.

This node is `tier: global`, so this amendment stales `.claude/rules/session-state.md`
on the implementation ref. The two land on different refs and nothing about landing
the amendment regenerates the projection; the regeneration is named in the sitting's
report and lands in its own commit.

### The words the answer already rested on, cited, 2026-09-08

The validator reports a ledger entry that no option references, and on 2026-09-08 it
reported twenty-three, nine of them from that day. Two of the nine were this node's.
The answer's clause that the store holds "the sitting's own working state" was written
from the author's words of that day putting the sitting's sequenced alignment in a
session-scoped store, `words/2026-09-08/24`, and putting reconciliation residuals
there beside it, `words/2026-09-08/25`; the node's probes cite both as the author's
refinement, and no option carried either. The addresses were added to
`a-compaction-store-the-ai-shapes`, whose content is what they back. Nothing moved:
the recommendation, the boldness and the answer's text are unchanged, and what changed
is that the words the answer was already written from are now reachable from the
option that rests on them.

One half of `words/2026-09-08/25` is not discharged by this. The entry carries a
second disposition, that a sitting prints a standard report whenever it stops,
carrying the sequencing summary where it is an alignment sitting and the residuals
where it is a reconciliation sitting. No option on any node answers that, here or
elsewhere; it is held on this node as the probe asking when the report is printed,
which is a legitimate state and is not a citation. So the entry is now referenced, and
the reference covers the store and not the report, which the record should not be read
as having settled.

The other seven of the day are left where they are, and the reason is worth stating
because attaching them would have been the easier act. `words/2026-09-08/2` is the
sitting's bootstrap grant, which is authority for a sitting and not a disposition on a
fact, so it has no option to attach to by its nature and the validator's rule does not
fit it. `words/2026-09-08/17` is the model-sizing direction whose withdrawal from the
ledger the author proposed on `quotes`, so it is deliberately uncited. Entries `23`,
`26`, `27` and `30` are the objects of alignments this sitting has sequenced and not
finished, and `29` is answered on `movements` in a probe's discharge and not yet on an
option; each will be cited by the option its alignment produces, and citing them now
would claim the author's words back a recommendation the record has not yet made.
Fourteen entries from the sittings of 2026-09-02 and 2026-09-03 stand unreferenced
too, so the pattern is the record's and not this day's, and whether the validator's
rule should except a grant is a question this node does not own.

### The verbatim copy and the sequencing, 2026-09-08

The option `the-store-is-written-verbatim-and-holds-the-sequencing` was recorded
in the alignment sitting of 2026-09-08 under the grant at `words/2026-09-08/2`
as refined at `words/2026-09-08/22`, from steps 2 and 3 of
`words/2026-09-08/36`. No recommendation was moved at the recording, and the
reason this account first gave was wrong: it said the author had given the seven
steps as an option and not as a settled answer, and `words/2026-09-08/37` denies
it -- they are "an option, but also current author choice", unconfirmed. What
the correction changed on this fact is in the account below.

The decomposition of that entry named `a-file-a-global-rule-fixes` as the option the
named change should be written against. This fact recommends
`a-compaction-store-the-ai-shapes`, and the recommended option is what was used, so
that a reader compares the addition against the answer the record currently proposes
and against the text `.claude/rules/session-state.md` projects. The discrepancy is
written down because it is the third of its kind in this sitting, after a summary
count that disagreed with its own enumeration and an omission from a unit's list, and
the three together are the sitting's standing finding: a count or a name written by
hand into a unit's report should be derived from the record instead.

This node is `tier: global`. Recording an option stales no rule projection, since the
rule file follows the option the answer fact recommends and that did not change.

### The mark held, and why, 2026-09-08

`words/2026-09-08/37` corrects the reading this sitting made of `words/2026-09-08/36`:
the seven steps are "an option, but also current author choice", unconfirmed, and not
an option alone. The sitting recorded only the first of those and wrote the wrong
reason into this account, where it is struck above.

The mark on this fact does not move, and the reason is structural rather than a claim
about what the author intended. The option this entry put here, `the-store-is-written-verbatim-and-holds-the-sequencing`, is compatible with `a-compaction-store-the-ai-shapes` rather than a rival of it: the incumbent fixes the requirement and delegates the mechanism, which is itself the author's refinement of the same day, and the author's option adds that the words go to the store verbatim whatever their relation turns out to be and that the sitting's re-evaluated sequencing is among the working state. Neither contains the other as written, so the mark cannot express both, and moving it would drop the delegation the author made first.

That is a defect in how the entry was recorded and not in the author's words, and it is
put to the author as such: an alignment input whose steps are additions rather than
rivals cannot be marked as the author's choice without dropping what the incumbent
holds, and the record has no mark for an option the author currently chooses short of
confirming it. `viable-options` carries the option that would mint one, and the mark
moved to it in this sitting.

### The probe on what a dead sitting owes the next, discharged, 2026-09-08

The author, at `words/2026-09-08/39`: "The session local store is a recovery log
specifically to supplement the compaction record to recover from compaction. Other
error recovery states are handled by the harness. The session local store just
formalizes state that must be retained across compaction."

The probe put a binary and the answer takes the first term while narrowing it. A
recovery log, then, and not a diary; but the failure it recovers from is compaction
alone, and the probe had assumed the class was wider. That narrowing reverses the
probe's own expectation on its third limb. The probe reasoned from crash-only software
that the store would need a sitting identity, a liveness test and a sweeper, because
the failures the store exists for are the ones that never reach a stop. The author's
answer says those failures are not the store's: they are the harness's. What is left
for the store is a boundary inside one sitting, with the same sitting on both sides of
it, and none of the three instruments has anything to do there.

Why the tradition does not bind here is worth recording, since the probe cited it
correctly and the answer still goes the other way. Candea and Fox's argument is about
a path that is exercised only in the failure it exists for and is therefore never
tested until it is needed. Compaction is not that: it is scheduled, it is frequent, it
happens inside a sitting that carries on across it, and the store is read on the
ordinary path every time. The tradition's force is proportional to how rare the
recovery is, and here it is not rare at all. The second limb follows: the standard
report stays at the stop, because nothing is obliged to read a store a dead sitting
left, and a report obligated at the start would be a reader for a thing the record has
just said it does not keep.

This node is `tier: global`, so its rule projection under `.claude/rules/session-state.md`
is stale from this amendment. The projection lands on the implementation ref and is
named in this sitting's report.

### What the report requires of the store, 2026-09-09

The author's words at `words/2026-09-09/2` open with a rider, that the disposition on
local session state support the alignment sequencing report the rest of the entry fixes.
Recorded against the standing option `the-store-is-written-verbatim-and-holds-the-sequencing`
rather than as a new one, because that option already holds that the sitting's
re-evaluated sequencing is among the working state and this says what of it is held; and
because a third option compatible with both of the two already here would make the
problem this node's account records worse, that the mark cannot express two compatible
positions and moving it would drop the delegation the author made first. The option's
`ref` moves to the date of its newest words, as `ref` is read across the record.

What the report demands is what the store must hold, and running the demand backwards is
what fixes the contents. The report prints, per disposition, an id, a question, a
paraphrase of the author's inputs, and a probe list in rank order. The id and the question
are on the node. The rank is on the probe, under `author-questions`' answer, since the
author's words of the same turn say the main thread records it and that what is recorded
goes on the ref. So what is left for the store is the order itself, the ground each
placement was made on, and the paraphrase, and the paraphrase is here because it is the
sitting's reading rather than the author's words and there is nowhere on the ref for a
reading of words that are already in the ledger.

The rider bears on the recommendation and does not move it here. The recommended option is
`a-compaction-store-the-ai-shapes`, which fixes the requirement and delegates the
mechanism and says nothing about the sequencing; under it the store is not required to
hold what the report must print, so the author's rider is not satisfied by the answer this
node recommends, only by the option beside it. That is the same defect the account of
2026-09-08 recorded from the other side, and this entry is a second author input weighing
on it. It is recorded and not acted on, because moving the mark would drop the delegation
and because the author's words ask for the disposition to support the report rather than
for a different option to be recommended.

What this settles of the probe `may-the-store-direct-what-it-may-not-authorize`, and what
it does not. The probe's discharge has two limbs. The second, how much of the sequencing
is stored at all rather than derived, is answered: the paraphrase and the order with its
grounds are stored, the id and the question are read from the node, and the probe rank is
on the ref, so the stored part is smaller than the probe assumed. The first limb, whether
the no-authority sentence divides in two, is untouched and is now sharper than it was. The
report a sitting prints at its stop is drawn from the store alone, and it directs the
author's attention to some questions and not others while authorizing nothing, which is
exactly the uncertified realtime rough the probe's reason names, no longer as an analogy
but as a thing this record now does at every stop. The probe stands.
