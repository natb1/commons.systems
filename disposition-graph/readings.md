---
question: How are references to tradition recorded?
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 4834c4be234dccbbf1282986e89ff2ab585e1ea7
  commit: abb15a3e8dbf6291b4a07db98466c158ac0acbbe
  against: "The previous reading's own weak counter-argument -- that the account entry \"Repaired after the re-reading, 2026-09-07\" still states unqualified that the authority fact's case against no longer claims every reading recommends delegated for itself, when that exact sentence was never itself corrected or flagged as imprecise -- remains true of the node after this amendment: nothing in this diff touches that sentence. It is carried forward here rather than re-raised as a new finding, since the previous reading already surfaced it as a weak counter-argument and not as a blocking finding, and this amendment did not purport to address it."
  survey:
    date: 2026-09-05
    of: 4d59b849501c0abb7bd5648ed67732e57bc94e0b
facts:
  - name: answer
    options:
      - name: relation-on-the-node
        source: ai
        ref: "2026-09-02"
      - name: traditions-as-mounts
        source: ai
        ref: "2026-09-03"
      - name: incomplete-enumeration-in-facts
        source: review
        ref: "2026-09-03"
      - name: one-ruling-for-the-reading-class
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "the four entries it would strike went in the re-encoding of 2026-09-04, and the class rule the answer states covers every reading"
      - name: hold-for-traditions-home
        source: review
        ref: "2026-09-03"
      - name: relation-per-option
        source: author
        ref: "2026-09-04"
        supports:
          - words/2026-09-04/33
      - name: re-pointing-checked
        source: review
        ref: "2026-09-05"
      - name: relation-per-holding
        source: commons.systems/disposition-graph/progressive-disclosure
        ref: "2026-09-05"
      - name: the-relation-is-projected-onto-the-option-as-one-of-three
        source: commons.systems/disposition-graph/dialogue
        ref: "2026-09-07"
        supports:
          - words/2026-09-02/31
          - words/2026-09-02/32
          - words/2026-09-02/33
          - words/2026-09-07/4
      - name: a-readings-class-is-deferred-until-the-author-reads
        source: review
        ref: "2026-09-07"
    recommends: the-relation-is-projected-onto-the-option-as-one-of-three
    boldness: moderate
    against: "The projection is only as complete as the `bears` entries are: a tradition read under one node and bearing on an option of another reaches that option only where the reading's author remembered the cross-node entry, which no validator can check, so the traditions' accumulation the author's words require is exact where it exists and silent where it does not, and a row showing no tradition cannot be told from a row no reading reached; the per-option relation beneath it still binds a verdict to option names that move under it, and a reading per node still multiplies files."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "Delegated is live: the relations are the AI's readings, each reading node recommends its own class for itself, and the author may hold the rule of how tradition binds the record as loosely."
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
depends:
  - commons.systems/disposition-graph/viable-options
  - commons.systems/disposition-graph/traditions-home
---

## Facts

### answer

`the-relation-is-projected-onto-the-option-as-one-of-three` is recommended since 2026-09-07: it is `relation-per-option` with one sentence extended, that the derived inverse of what the readings bear is what the projections show on the option as the traditions' support and divergence, one of the three accumulations the author's words of that day require, `bears` staying on the reading. Its own support and divergence are under its subsection, and what follows is the reason the text it amends was recommended on, which the amendment carries except where it says otherwise.

`relation-per-option` was recommended before the amendment because it is the author's words of 2026-09-04, quoted above, it is what the reader and the fifty-nine readings on the record already carry, and it is what makes chosen over derivable rather than stored. Boldness moderate: the relation per option is the author's, while the derivation of chosen over, the reading as a node with its own class, and the deferral of the mount to the traditions-home node are the AI's. The case against is twofold. A reading per node multiplies files, and the queue effect of that is the cost the author will feel: every reading is a node with a stage, and the frontier grows by the readings owed. And the per-option relation binds a tradition's verdict to option names, which are the AI's handles and move under it as options are added, renamed, and composed, so that the option the author confirms can show no tradition beside it while a rival shows one; the answer meets that with the duty to re-point on every move and the review's finding where a recommended option stands unread.

#### relation-on-the-node

The answer as it stood from 2026-09-02: a reading is a node under the disposition it bears on, with a source, a locus, and one relation to the answer, adopted, diverged, or chosen over, and a stamp like any node. Viable if the author prefers one relation per reading.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

The answer as it stood from 2026-09-02: a reading is a node under the disposition it bears on, with a source, a locus, and one relation to the answer, adopted, diverged, or chosen over, and a stamp like any node. Viable if the author prefers one relation per reading.
```

#### traditions-as-mounts

The Draft distinguishes tradition from reading where the standing answer runs them together: a tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references, and a reading is a node under the disposition it bears on, naming the tradition it reads with its source, locus and relation. It adds that many questions reading one tradition are many readings naming one tradition, that the tradition's page shows every reading citing it, that prose reaches a tradition through the name it defines, and that a rationale never repeats its readings. Its own reviews record that ratifying it makes fourteen existing rationales non-conforming at once, that the reading nodes name no tradition node and no traditions graph exists in the manifest, and that no migration is named; measured again on 2026-09-05, fifty-nine readings, none naming a tradition node, and no traditions graph in the manifest.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

The Draft distinguishes tradition from reading where the standing answer runs them together: a tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references, and a reading is a node under the disposition it bears on, naming the tradition it reads with its source, locus and relation. It adds that many questions reading one tradition are many readings naming one tradition, that the tradition's page shows every reading citing it, that prose reaches a tradition through the name it defines, and that a rationale never repeats its readings. Its own reviews record that ratifying it makes fourteen existing rationales non-conforming at once, that the reading nodes name no tradition node and no traditions graph exists in the manifest, and that no migration is named; measured again on 2026-09-05, fifty-nine readings, none naming a tradition node, and no traditions graph in the manifest.
```

#### incomplete-enumeration-in-facts

The same finding proposes that readings' facts say the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier; readings' standing answer rests its rule that a rationale never repeats its readings on that enumeration being the remedy. Measured on 2026-09-05, by the marker phrases the record actually uses and not by one of them: nine rationales carry a prose tradition list, five more carry one only in an account, and `stub-traditions` stands at the maieutic stage with a hand-maintained enumeration naming twelve, which its own `regenerate-enumeration` option already calls stale. That is the size of what the rule puts on the frontier, and it is a hand count of a moving target, which is the option's whole point. (Raised on commons.systems/disposition-graph/audience.)

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

The same finding proposes that readings' facts say the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier; readings' standing answer rests its rule that a rationale never repeats its readings on that enumeration being the remedy. Measured on 2026-09-05, by the marker phrases the record actually uses and not by one of them: nine rationales carry a prose tradition list, five more carry one only in an account, and `stub-traditions` stands at the maieutic stage with a hand-maintained enumeration naming twelve, which its own `regenerate-enumeration` option already calls stale. That is the size of what the rule puts on the frontier, and it is a hand count of a moving target, which is the option's whole point. (Raised on commons.systems/disposition-graph/audience.)
```

#### one-ruling-for-the-reading-class

Passed over on 2026-09-05: the four entries it would strike went in the re-encoding of 2026-09-04, no node carries an option of that name, and the class rule the answer states covers every reading, so it had nothing left to discharge. As raised: readings' answer says that the class rule it states governs every reading node without each carrying its own alternative for it. Verified as raised on 2026-09-03, that all four nodes then carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing — already recommended a class other than ratified, three of them delegated and srs-introduction deferred, so those four entries stood for a change the record had made and would put a settled question in front of the author four times. On this alternative the four entries are struck as discharged and readings' answer says that a reading's class follows from whether the author has read the source, so no reading needs an alternative to say it; it is on the table because the record currently carries four pending rulings on a rule it has already applied.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

Passed over on 2026-09-05: the four entries it would strike went in the re-encoding of 2026-09-04, no node carries an option of that name, and the class rule the answer states covers every reading, so it had nothing left to discharge. As raised: readings' answer says that the class rule it states governs every reading node without each carrying its own alternative for it. Verified as raised on 2026-09-03, that all four nodes then carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing — already recommended a class other than ratified, three of them delegated and srs-introduction deferred, so those four entries stood for a change the record had made and would put a settled question in front of the author four times. On this alternative the four entries are struck as discharged and readings' answer says that a reading's class follows from whether the author has read the source, so no reading needs an alternative to say it; it is on the table because the record currently carries four pending rulings on a rule it has already applied.
```

#### hold-for-traditions-home

Readings says on the node that its tradition-as-mount rule rests on traditions-home, which is unruled, and is not confirmed before it. Measured on 2026-09-05: readings stands at review and traditions-home at ruling with four options, recommending `one-traditions-graph`, and the manifest carries no traditions graph; the answer now cites traditions-home for where a tradition lives rather than stating it, and names it in `depends`, which is this option's ask. It is on the table because frontier-consistency requires a node not to rest silently on unruled ground and because the placement finding of 2026-09-03 proposed exactly this for readings and recorded an alternative on every other node it named but this one.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

Readings says on the node that its tradition-as-mount rule rests on traditions-home, which is unruled, and is not confirmed before it. Measured on 2026-09-05: readings stands at review and traditions-home at ruling with four options, recommending `one-traditions-graph`, and the manifest carries no traditions graph; the answer now cites traditions-home for where a tradition lives rather than stating it, and names it in `depends`, which is this option's ask. It is on the table because frontier-consistency requires a node not to rest silently on unruled ground and because the placement finding of 2026-09-03 proposed exactly this for readings and recorded an alternative on every other node it named but this one.
```

#### relation-per-option

A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer: adopted on the options the tradition supports, diverged on those it contradicts, so that "chosen over" becomes a tradition adopted on an option not chosen. The tradition's page still shows every reading that cites it, and the projections show on each option what tradition says. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

**AI support.** The author's disposition of 2026-09-02 that tradition references carry authority classes. Making them nodes rather than field entries buys four things: one reading of a shared source is stored once and refined under each node it grounds; readings nest, which is what recursion needs; a reading has its own hash and pin, so a changed reading is distinguishable from a changed answer; and there is one write path, one queue, and one stamp vocabulary. The alternative, stamped entries in a field with a derived reading frontier, is workable and was the author's framing; the difference is parsimony of mechanism against parsimony of files.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Each fact on a node ... has viable options list ... with ... b) support or divergence from tradition for each option". The reading stays a node with its own class, as the author's disposition of 2026-09-02 asks, and its relation moves from the node to the options it bears on, so that a tradition can support one option and contradict another on the same fact, and so that chosen over is derived rather than stored. The answer as it stood is kept as the option `relation-on-the-node`, and `traditions-as-mounts` is that answer with the mount, which this one includes. The review of this text is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

As readings under the node that refers, and traditions they refer to. A tradition is a mount: a philosophical tradition, a body of research, or another repository, which could be a disposition graph of its own with its own archē and its own readings, and where it lives until it is articulated, carrying the name it defines and its primary references, is the traditions-home node's question; until that is ruled a reading names its tradition in its source alone, and the tradition node is owed, and with it the tradition's page and the defined name by which prose reaches it, both of which two clauses below presume. A reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent; it names the tradition it reads, its sources and loci, and what it bears on: for each option of a fact that the tradition speaks to, adopted, where the tradition supports the option, or diverged, where the option departs from it and the reading's own answer says why. A move of a recommendation re-points the readings that bear on the option it leaves, and that a recommended option stands unread beside a rival that does not is a finding the review should make, which the frontier-consistency node's validation 4 does not yet ask for and which is recorded there as an option; until it is ruled the check is owed and no instrument performs it, and the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures. A tradition adopted on an option not chosen is what chosen over names, and it is derived and never stored; the option's readings are the derived inverse of what the readings bear on. A reading has a class like any node, read from the rulings on its own facts: ratified when the author has read the primary source or understands the mounted graph and confirms the relations, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it. Many questions that read one tradition are many readings naming that tradition, and the tradition's page shows every reading that cites it, as each option shows every reading that bears on it. Prose reaches a tradition through the name it defines, and the rationale of a node never repeats its readings.
```

#### re-pointing-checked

The recommended answer with the duty made checkable: a `bears` entry carries the
pin of the recommendation it was written against, the validator reports an entry
whose fact has moved since, and "chosen over" is derived only from an entry that
is current. It answers the case against this node's own recommendation, which is
that option names move under the relation and the duty to re-point is stated and
unenforced; measured at this commit, the record carries 59 readings with 109
`bears` entries and a large minority of them name an option their fact no longer
recommends, so the duty is already unmet and every one of those entries reads,
under the answer's own definition, as a judgment of "chosen over" that nobody
made. What it costs is a pin on every entry and a validator that fails on drift
the author has not been asked about, which is the reason it is an option and not
the recommendation. Raised by the second clean-context reading of 2026-09-05, in
its viability field.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

The recommended answer with the duty made checkable: a `bears` entry carries the
pin of the recommendation it was written against, the validator reports an entry
whose fact has moved since, and "chosen over" is derived only from an entry that
is current. It answers the case against this node's own recommendation, which is
that option names move under the relation and the duty to re-point is stated and
unenforced; measured at this commit, the record carries 59 readings with 109
`bears` entries and a large minority of them name an option their fact no longer
recommends, so the duty is already unmet and every one of those entries reads,
under the answer's own definition, as a judgment of "chosen over" that nobody
made. What it costs is a pin on every entry and a validator that fails on drift
the author has not been asked about, which is the reason it is an option and not
the recommendation. Raised by the second clean-context reading of 2026-09-05, in
its viability field.
```

#### relation-per-holding

The relation attaches to the holding of the tradition and not to the option
alone, so a reading may be adopted on one part of what a tradition says and
diverged on another without either verdict swallowing the other. Under the rule
as it stands the relation is one value per option, and a reading whose tradition
is adopted in part must pick a net verdict and carry the nuance in prose, where
no projection reaches it; the alternative the record has actually reached for is
two entries on one option with opposite relations, which the second reading of
`commons.systems/disposition-graph/progressive-disclosure` found on that node's
draft, which `readBears` does not forbid, and which would put "supports" and
"departs" on the same row from one reading. What a ruling for it would cost is a
name for each holding, which is a second vocabulary the record does not have and
would have to keep stable across a reading's redrawings. Raised by that reading
on 2026-09-05, as the gap the double entry was reaching for; recorded as an
option and not taken, the double entry being struck for a net `diverged` in the
same landing.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

The relation attaches to the holding of the tradition and not to the option
alone, so a reading may be adopted on one part of what a tradition says and
diverged on another without either verdict swallowing the other. Under the rule
as it stands the relation is one value per option, and a reading whose tradition
is adopted in part must pick a net verdict and carry the nuance in prose, where
no projection reaches it; the alternative the record has actually reached for is
two entries on one option with opposite relations, which the second reading of
`commons.systems/disposition-graph/progressive-disclosure` found on that node's
draft, which `readBears` does not forbid, and which would put "supports" and
"departs" on the same row from one reading. What a ruling for it would cost is a
name for each holding, which is a second vocabulary the record does not have and
would have to keep stable across a reading's redrawings. Raised by that reading
on 2026-09-05, as the gap the double entry was reaching for; recorded as an
option and not taken, the double entry being struck for a net `diverged` in the
same landing.
```

#### the-relation-is-projected-onto-the-option-as-one-of-three

What the readings bear on an option is projected onto it as the traditions' accumulated support and divergence, one of the three accumulations beside the AI's and the author's own; `bears` stays on the reading and nothing is stored twice.

**AI support.** This node's answer already puts the relation on the reading and derives the option's readings as the inverse; the author's words of 2026-09-07 ask that references to tradition be recorded as support and divergence per option, and the projection of that inverse, headed support or divergence, is that record without a second copy. One reading of a shared source stays stored once and refined under each node it grounds.

The author's disposition of 2026-09-02 that tradition references carry authority classes. Making them nodes rather than field entries buys four things: one reading of a shared source is stored once and refined under each node it grounds; readings nest, which is what recursion needs; a reading has its own hash and pin, so a changed reading is distinguishable from a changed answer; and there is one write path, one queue, and one stamp vocabulary. The alternative, stamped entries in a field with a derived reading frontier, is workable and was the author's framing; the difference is parsimony of mechanism against parsimony of files.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Each fact on a node ... has viable options list ... with ... b) support or divergence from tradition for each option". The reading stays a node with its own class, as the author's disposition of 2026-09-02 asks, and its relation moves from the node to the options it bears on, so that a tradition can support one option and contradict another on the same fact, and so that chosen over is derived rather than stored. The answer as it stood is kept as the option `relation-on-the-node`, and `traditions-as-mounts` is that answer with the mount, which this one includes. The review of this text is owed.

**AI divergence.** A projection is only as complete as the `bears` entries are, and a tradition read under one node and bearing on an option of another is recorded only where the reading's author remembered to add the cross-node entry, which the validator cannot check; the derived inverse is exact and the coverage is not.

The projection is only as complete as the `bears` entries are: a tradition read under one node and bearing on an option of another reaches that option only where the reading's author remembered the cross-node entry, which no validator can check, so the traditions' accumulation the author's words require is exact where it exists and silent where it does not, and a row showing no tradition cannot be told from a row no reading reached; the per-option relation beneath it still binds a verdict to option names that move under it, and a reading per node still multiplies files.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---
## Answer

As readings under the node that refers, and traditions they refer to. A tradition is a mount: a philosophical tradition, a body of research, or another repository, which could be a disposition graph of its own with its own archē and its own readings, and where it lives until it is articulated, carrying the name it defines and its primary references, is the traditions-home node's question; until that is ruled a reading names its tradition in its source alone, and the tradition node is owed, and with it the tradition's page and the defined name by which prose reaches it, both of which two clauses below presume. A reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent; it names the tradition it reads, its sources and loci, and what it bears on: for each option of a fact that the tradition speaks to, adopted, where the tradition supports the option, or diverged, where the option departs from it and the reading's own answer says why. A move of a recommendation re-points the readings that bear on the option it leaves, and that a recommended option stands unread beside a rival that does not is a finding the review should make, which the frontier-consistency node's validation 4 does not yet ask for and which is recorded there as an option; until it is ruled the check is owed and no instrument performs it, and the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures. A tradition adopted on an option not chosen is what chosen over names, and it is derived and never stored; the option's readings are the derived inverse of what the readings bear on, and that inverse is what the projections show on the option as the traditions' accumulated support and divergence, one of the three the author's words of 2026-09-07 require beside the AI's and the author's own. `bears` stays on the reading, so one reading of a shared source is stored once and refined under each node it grounds, and what reaches the option is a projection and never a second copy. A reading has a class like any node, read from the rulings on its own facts: ratified when the author has read the primary source or understands the mounted graph and confirms the relations, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it. Many questions that read one tradition are many readings naming that tradition, and the tradition's page shows every reading that cites it, as each option shows every reading that bears on it. Prose reaches a tradition through the name it defines, and the rationale of a node never repeats its readings.
```

#### a-readings-class-is-deferred-until-the-author-reads

The class the AI recommends on every reading's authority fact is deferred until words of the author delegate the reading of traditions, the derivation being this node's and recorded once rather than on each reading: on `class-recommendation`'s three limbs a tradition reading is neither expensive nor irreversible, since a reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds and nothing acts under an unanswered parent, and is not capture-shaped, since its claim is about a text outside the record, fixed, public, and openable by the author, which is what the `source` field exists to name; the residual therefore governs, delegated needs words of the author saying they do not want to be asked again about the AI's account of a source, and no such words are on the record.

**AI support.** The sentence every reading of 2026-09-07 offered for delegating, that the relation is the AI's reading of a source the author may check, is a reason for deferring and not for delegating, as the clean-context reading of `regression-test-selection` found in terms; this node's own answer describes deferred as the class of a reading the author accepts for now while queueing the primary reading, which is what each of those readings is. The nine readings under `survey-selection` now recommend deferred with a node-specific reason each, and the derivation lives here because the class of a tradition reading is one question and not nine, and because nine copies of one passage would fail the mechanical tier's byte-identity check. The census in `progressive-disclosure`'s authority reason, fifty-seven of fifty-nine readings recommending delegated, `srs-introduction` deferred and `npm-committed-lockfile` carrying no recommendation, is on this derivation a reconciliation item of this node's, to be moved as one act and not swept node by node.

**AI divergence.** The capture limb may bite: a check the checked party writes and may move without being asked is captured whether or not the source is public, and the record has watched it happen, `progressive-disclosure` having been redrawn three times in two days, each time fitted to whatever the page's text said, which its own review calls the pattern a delegated class makes cheap and a deferred class exists to stop; on that reading the class is ratified and not deferred. And the option is a rule about the readings' class beside options that decide how a relation is encoded, so it competes with none of them, and under the content encoding it is a named change to the recommended text rather than a replacement for it.

**Content.**

```markdown
---
question: How are references to tradition recorded?
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
---

## Answer

The class the AI recommends on every reading's authority fact is deferred until words of the author delegate the reading of traditions, the derivation being this node's and recorded once rather than on each reading: on `class-recommendation`'s three limbs a tradition reading is neither expensive nor irreversible, since a reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds and nothing acts under an unanswered parent, and is not capture-shaped, since its claim is about a text outside the record, fixed, public, and openable by the author, which is what the `source` field exists to name; the residual therefore governs, delegated needs words of the author saying they do not want to be asked again about the AI's account of a source, and no such words are on the record.
```

### authority

Ratified is recommended because the rule fixes how tradition binds the record, which is the capture-shaped case the record's escalation rule names: a divergence recorded as the author's decision cannot be overruled by the tradition, and a rule that decides what a divergence is decides that for every reading after it. Boldness moderate: the classes a reading may carry are the author's words of 2026-09-02, the rule that a reading is a node and the per-option relation's consequences are the AI's. The case against is delegated: the relations are the AI's readings, each reading node recommends its own class for itself, and the author may hold the rule as loosely as its instances.

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Amended after the second reading, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 9849bdfe, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 428e3065, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the second re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 1558b74a, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option recorded, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 1558b74a (ii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `the-relation-is-projected-onto-the-option-as-one-of-three`.

Findings:


On the facts and what they recommend: The diff lands the previous re-reading's own result (review block moves from verdict kickback/moderate/of 428e3065/commit d35b0014/against the F3-F4 residue text, to verdict forward/weak/of 1558b74a/commit d9c2e3be/against the self-report-sentence text) and appends that reading's own account entry verbatim, then separately records a new answer-fact option, `a-readings-class-is-deferred-until-the-author-reads` (source review, ref 2026-09-07), with its own account entry. `recommends` (the-relation-is-projected-onto-the-option-as-one-of-three), `stands` (relation-per-option), and boldness (moderate) on the answer fact are unchanged, so the `## Recommendation` fence stays present and correctly targets the same recommended option; the authority fact is untouched by this diff.

On the viability of the options: The diff only adds one new answer-fact option and leaves every existing option's status untouched; the new option is not recommended and not passed over, so it sits viable alongside the others without contradicting any of them, and no option is removed or newly dominated.

Strongest counter-argument (weak): The previous reading's own weak counter-argument -- that the account entry "Repaired after the re-reading, 2026-09-07" still states unqualified that the authority fact's case against no longer claims every reading recommends delegated for itself, when that exact sentence was never itself corrected or flagged as imprecise -- remains true of the node after this amendment: nothing in this diff touches that sentence. It is carried forward here rather than re-raised as a new finding, since the previous reading already surfaced it as a weak counter-argument and not as a blocking finding, and this amendment did not purport to address it.

The session's reply: An account entry is the record of what its day did and is not rewritten after it; the sentence the counter names stands as the account of that repair, and what the accumulation folds it will fold. The authority fact's case against was corrected in the same landing, which is what the entry reports.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/readings stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `relation-per-option`; the `## Rationale` its `**AI support.**`; the `## Recommendation` fence became the content of `the-relation-is-projected-onto-the-option-as-one-of-three`; 5 `## Disposition` entries became the ledger entries words/2026-09-02/31, words/2026-09-02/32, words/2026-09-02/33, words/2026-09-04/33, words/2026-09-07/4, referenced by 1 option the entry's own date names and by the recommended option for 4 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `relation-on-the-node`, `traditions-as-mounts`, `incomplete-enumeration-in-facts`, `one-ruling-for-the-reading-class`, `hold-for-traditions-home`, `re-pointing-checked`, `relation-per-holding`, `a-readings-class-is-deferred-until-the-author-reads`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `1558b74a9a1199765bdee07abf825ac9313bfde1` is re-computed for the encoding as `4834c4be234dccbbf1282986e89ff2ab585e1ea7`; nothing it read changed. The survey's pin `4d59b849501c0abb7bd5648ed67732e57bc94e0b` was already past the recommendation and is left as it stood.
