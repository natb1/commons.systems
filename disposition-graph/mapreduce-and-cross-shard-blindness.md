---
question: Does MapReduce ground the partition `survey-selection` does not take, and what does that answer keep of it?
form: reading
stage: ruling
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
      - name: diverges-on-the-emit-keys-form
        source: review
        ref: "2026-09-07"
    recommends: as-read
    boldness: high
    against: "The emit-keys discipline the answer keeps is not in the paper: a reader emitting terms, quotations, citations and propositions each with a verbatim locus is the AI's transposition of a machine's key-value contract onto a reader, and the hierarchical and refine reading chains of current practice that would be its descendant carry no primary citation at all, so the half doing the most work here has the least behind it."
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "The paper is the most widely read of the nine sources and its cross-shard limit is not contested, so a deferral queues a check that will confirm the reading and leaves the transposition, which is the contestable part, unchecked either way."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: cbff56cfa25178c111ff32149216b9291a27c75f
  commit: 7f9b25de3b0b74095c1dad1fd76824f5b6b814c5
  against: "All six of the previous reading's findings are answered, most matching the suggested edits verbatim: the rationale/authority class agreement, the question's naming of `survey-selection` in backticks, the `source` field dropping the uncitable descendant strand into the `against` where it already did its work, the second point in `## Answer` reframed to quote the parent's own aggregate-versus-pairwise limb rather than the false whole-node claim, the boldness raised to `high` on the transposition, and the new option recording the divergence the viability assessment flagged as missing. The one item this node's own file cannot close is the sibling half of the second finding — correcting `survey-selection`'s own account text, which still (as far as this reading can see, since it is not given that node) may describe this node as diverged on `several-readers-over-a-partition` — but this node does its own part by recording in its account that the parent's entry was that reader's error and that this node has carried `adopted` on both bearings since it was minted, which is what the suggested edit asked of this node specifically."
under:
  - commons.systems/disposition-graph/survey-selection
source: MapReduce, Dean and Ghemawat, OSDI 2004.
bears:
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---
## Answer

Supports the option the answer does not take, and is read for its limit. The tradition splits a corpus larger than any one reader, computes over each shard independently, and combines; its known weakness is the one that decides this node, that a relation holding between two shards is invisible to both of the readers that hold them and exists afterwards only in what they emitted. The discipline that follows is the tradition's real content here: a mapper emits keys — the terms it defined and used, the quotations it claimed, the nodes it cited, the propositions it asserted, each with its verbatim locus — and never prose summaries, because a combination taken over summaries has already lost the loci a finding must quote. Two things follow for this node. First, the option `several-readers-over-a-partition` is this tradition's shape and is written in its terms, each reader emitting structured claims with verbatim loci and a combining reader running the pairwise validations over the emitted keys; the relation to it is adoption, and it is a tradition adopted on an option the answer did not choose, which is what `chosen over` names. Second, what decides against that option is partly the tradition's own support scope and partly the record's economics, and neither is an objection to it: validations thirteen to sixteen are aggregate over the whole corpus and do not partition, as the option says in its own words, coverage's input is an absence and an absence has no shard, and a split buys context capacity and not tokens, each reader paying again for the context they share, which is the record's economics of a context window and has no counterpart in the tradition. The pairwise validations do shard, and the candidate pair is their shard, which is what the option the answer takes makes the unit. The answer keeps the other half of the tradition inside the design it does take. What crosses between one reading and the next here is keys with their loci and never a summary of what a reader thought: each candidate pair reaches the reader with the key that nominated it, the key is recorded with any finding it produced, and the block the survey leaves on a node carries the hashes, the register and the keys. The nomination itself is `blocking-and-canopies`'; what this tradition adds is the form of what is emitted, which is why the answer's accumulated state is a set of keys and a register of findings with their supports rather than a précis of what an earlier reader concluded. The condition on which the partition would be taken is stated on the option and is the tradition's own: where the brief no longer fits one reader the corpus has exceeded the reader, and the split is then the answer — in the emit-keys form, and not as a chain of summaries.

## Rationale

Recorded under `survey-selection` on 2026-09-07, because the draft's rationale leant on this tradition's cross-shard blindness as its reason for not partitioning the survey while carrying no reading of it, which the clean-context reading of that day named as an unrecorded divergence from `evaluation`. The tradition survey of that date, which is not part of the record, cited it at high confidence and the citation is given as it gave it; the AI validated the relation from its own knowledge of the source. Deferred, because what is queued is not the paper but the transposition of a machine's key-value contract onto a reader.

## Facts

### answer

`as-read` is the only reading of MapReduce on the record and it is recommended because the tradition is read here for its limit and not for its shape, which is the only way a reading can ground an option the answer did not take: both `bears` entries read adopted, one on `several-readers-over-a-partition`, the tradition's own form, which the answer is chosen over, and one on `candidate-pairs-with-their-nominating-key`, which keeps the emit-keys discipline inside the design the answer does take. Boldness high, on the transposition: that a relation between two shards is invisible to both readers is the paper's own, and cross-shard blindness is the paper's own accounting of what a shuffle exists to fix rather than a gloss on it, but the discipline of emitting keys with verbatim loci and never prose summaries, for a reader rather than a machine, is the AI's extension with nothing in the record behind it; the reason the option is not taken is an argument about this record — that the aggregate validations do not partition, that coverage's input is an absence and an absence has no shard, and that a split buys context capacity and not tokens — which any reader can check against `survey-selection`. The case against is on the fact.

#### diverges-on-the-emit-keys-form

The relation on `candidate-pairs-with-their-nominating-key` is diverged rather than adopted. What a mapper emits is a key-value pair produced by a deterministic function over a record, and what the record's reader emits is terms, quotations, citations and propositions it judged worth emitting; the paper's guarantee is that every relation expressible as a key survives the shuffle, and that guarantee is void for an emitter that may simply fail to emit a key it should have, which is the failure mode a reader has and a mapper does not. The relation on `several-readers-over-a-partition` stays adopted.

**AI support.** It is the option the clean-context reading of abb15a3e found missing: the fact's own case against says the emit-keys discipline is not in the paper but the AI's transposition of a machine's contract onto a reader, and the option puts that choice on the row the author reads rather than leaving it as a caveat.

**AI divergence.** The recommended reading holds that the form of what is emitted, keys with their loci and never a summary, is the paper's discipline and is what the record keeps, the reader's fallibility being a fact about the emitter and not a departure from the form; the net relation may stay adopted with the departure in the answer, as `fagan-entry-criteria` records the same shape.

### authority

Deferred, and the thing it queues is not the paper but the transposition. That a relation between two shards is invisible to both readers is the paper's own and is not in dispute; that the discipline following from it, for a reader rather than a machine, is to emit keys with verbatim loci and never prose summaries, is the AI's extension, and this node's `source` says the descendant strand it belongs to carries no primary citation. Delegating would put that extension beyond asking. Boldness moderate: the failing limbs of `class-recommendation`'s test are read off the record, and the judgement that the capture limb does not bite, a paper being openable by the author, is the AI's own. The case against is on the fact.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the combiner's blindness and the form of what a mapper emits, not the scheduling, the fault tolerance or the data locality the tradition is usually named for, none of which the record adopts. This is one of two readings under this node that bear adopted on an option the answer does not recommend, the other being `acceptance-sampling-and-all-or-none`; in both, that pairing is what records that the record's ground for declining the design is the tradition's own account of where it stops working, and not a rejection of the tradition.

### Clean-context review, 2026-09-07, of 1c7265a2

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `as-read`.

Findings:

- The `## Rationale` names a class the node does not recommend. It closes "Delegated, because the relation is the AI's reading of a source the author may check, and the author's ruling on the options it bears on is where the reading has effect.", while the authority fact records `recommends: deferred` and the `### authority` subsection opens "Deferred, and the thing it queues is not the paper but the transposition." and says "Delegating would put that extension beyond asking." The author meets the recommendation twice with two different answers. Suggested edit: in the rationale, replace that sentence with "Deferred, because what is queued is not the paper but the transposition of a machine's key-value contract onto a reader."
- The `bears` relation on `several-readers-over-a-partition` contradicts what the parent's own account records of this node. `disposition/disposition-graph/survey-selection.md`, in `### Clean-context re-reading, 2026-09-07, of 5b7146fa`, says "`mapreduce-and-cross-shard-blindness` adopted on `candidate-pairs-with-their-nominating-key` and diverged on `several-readers-over-a-partition` -- exactly the bearings the Rationale and the account's mint description claim", and this node now carries `relation: adopted` on both. The node is the one that is right, and the parent's own answer says so: `survey-selection`'s `## Answer` reports this node as "adopted on the partition this answer does not take, whose cross-shard blindness is the tradition's own reason for not taking it, and adopted on the pairs", so the parent contradicts itself between its answer and its account. Doctrine agrees with the answer: `readings` holds that a reading records "adopted, where the tradition supports the option" and that "A tradition adopted on an option not chosen is what chosen over names", which is this case exactly, and this node's answer says so in terms. So the parent's account entry is the stale text and it asserts its own corroboration from a rendering that no longer holds. Suggested edit: correct that sentence in `survey-selection`'s account to read adopted on both, and record the relation's move in this node's `## Account` so the change is not silent.
- The answer restates the parent's reason for not partitioning as something the parent does not say, and the substitute does not hold. The answer gives "the validations whose object is a whole node in relation to another do not shard" (and the `### answer` prose repeats it as "the whole-node validations do not shard"), where `survey-selection`'s option says "Validations thirteen to sixteen are aggregate over the whole corpus and do not partition". Aggregate-over-the-corpus is a property of a validation with no unit below the corpus; whole-node-in-relation-to-another is a pairwise property, and a pairwise validation shards perfectly well when the shard is a pair, which is what the recommended option `candidate-pairs-with-their-nominating-key` already makes the unit. As written the reading grounds the refusal on a claim the record contradicts one option away. Suggested edit: quote the parent's own limb, that validations thirteen to sixteen are aggregate over the whole corpus and do not partition.
- The `source` carries a strand with no citation that the answer never uses. It reads "MapReduce, Dean and Ghemawat, OSDI 2004; the hierarchical and refine reading chains of current practice as its informal descendant, which carry no primary citation." Every claim the answer makes is the paper's or the record's; the descendant strand supplies nothing the answer draws on, and `readings` holds that a reading "names the tradition it reads, its sources and loci", which an uncitable strand cannot furnish. The answer fact's `against` treats it as evidence that the transposition is weakly supported, which is the opposite use of a source. Suggested edit: drop the second clause from `source` and leave the point where it already stands, in the `against`.
- The question's demonstrative points outside the node. It asks "Does MapReduce ground the partition this answer does not take, and what does the answer keep of it?", where "this answer" is `survey-selection`'s answer and not this node's, and this node has an answer of its own. The question is what the alignment page shows alone, without the parent beside it. Suggested edit: "Does MapReduce ground the partition `survey-selection` does not take, and what does that answer keep of it?"
- Boldness `moderate` on the answer fact understates what the fact's own `against` says rests on the AI. The three grounds given for moderate are the survey's confidence in Dean and Ghemawat, that cross-shard blindness is "the paper's own accounting of what a shuffle exists to fix rather than a gloss on it", and that the reason for not taking the option "any reader can check against `survey-selection`" — none of which touches the second `bears` entry, whose ground the `against` describes as "the AI's transposition of a machine's key-value contract onto a reader" and "the half doing the most work here has the least behind it". Suggested edit: raise the answer fact's boldness to `high`, naming the transposition as what it is high on.

On the facts and what they recommend: Facts are `answer` and `authority` and no others. On `answer`: one option `as-read` (source ai, ref 2026-09-07), `recommends: as-read`, `stands: as-read`, so no `## Recommendation` fence is due and none is present, correct. On `authority`: the three class options with no source or ref, `recommends: deferred`, no `stands`, correct for a fact no ruling has reached; the `### authority` subsection applies `class-recommendation`'s limbs by name and says which fails and why. Both facts carry a real `against` on the point that most needs one. Two defects: the `## Rationale` recommends `delegated` against the fact's `deferred`, and the answer fact's boldness is `moderate` where the fact's own `against` argues `high`.

On the viability of the options: `as-read` is viable, and both `bears` entries are well formed under `readings`, which provides for adopted on an option the answer does not take. One viable option is missing: `diverges-on-the-emit-keys-form` (source review, ref 2026-09-07) — the relation on `candidate-pairs-with-their-nominating-key` is diverged rather than adopted, because what a mapper emits is a key-value pair produced by a deterministic function over a record, and what the record's reader emits is terms, quotations, citations and propositions it judged worth emitting; the paper's guarantee is that every relation expressible as a key survives the shuffle, and that guarantee is void for an emitter that may simply fail to emit a key it should have, which is the failure mode a reader has and a mapper does not. The net relation may still stand at adopted with the departure in the answer, as `fagan-entry-criteria` records the same shape; the option is what puts the choice on the row the author reads.

Strongest counter-argument (moderate): Cross-shard blindness is not MapReduce's weakness; it is the premise the paper's second half exists to answer, and reading it as a limit reads the paper backwards. A mapper cannot see across shards, and the shuffle is exactly the mechanism that makes every relation expressible as a shared key visible at a reducer that holds both sides. So the tradition does not ground a refusal to partition; at most it grounds a refusal to partition a computation whose relations have no key. Whether the record's have one is a claim about the record, and the record's own recommended option answers it the other way: `candidate-pairs-with-their-nominating-key` is a key that nominates exactly the pairs a validation must see, so the pairwise validations do have a shard and the answer's contrary sentence is the finding above. What is left of the ground for not partitioning is the aggregate validations, which genuinely have no shard, and the cost argument that a split buys context capacity and not tokens — and that one is the record's economics of a context window, with no counterpart in the tradition at all. The node's claim that "what decides against that option is the tradition's own support scope and not an objection to it" therefore holds for one of its three limbs. The disposition survives the objection, but as a different sentence: the tradition supplies the shape and the emit-keys form and the condition on which the split would be taken, and the record's own economics decide against taking it now.

The session's reply: Taken into the answer: the second point now says that the aggregate validations, thirteen to sixteen in the parent's own words, do not partition, that the pairwise ones shard with the candidate pair as their shard, and that the cost of a split is the record's economics of a context window with no counterpart in the tradition; the tradition supplies the shape, the emit-keys form and the condition on which the split would be taken. The parent's account entry that records this node as diverged on `several-readers-over-a-partition` was the reader's error of that day and is left as its record; this node has carried adopted on both entries since it was minted.

### Repaired after the reading of abb15a3e, 2026-09-07

All six findings applied. The rationale's class now matches the authority fact, and the question names `survey-selection` rather than pointing at it with a demonstrative. `source` names the paper alone, the descendant strand that carries no citation being moved to the case against, where it was already doing its work. The answer's second point quotes the parent's own limb, that validations thirteen to sixteen are aggregate over the whole corpus and do not partition, says the pairwise ones shard with the candidate pair as their shard, and names the cost of a split as the record's economics with no counterpart in the tradition; the fact prose follows. The answer fact's boldness is high, on the transposition, and the option `diverges-on-the-emit-keys-form` is recorded from the reading's viability, source review. The parent's account entry that records this node as diverged on `several-readers-over-a-partition` was that reader's error and is left as its record; this node has carried adopted on both entries since it was minted. The reply to the counter is on the reading's entry above. The amendment is the object of the reading this entry owes.

### Clean-context re-reading, 2026-09-07, of cbff56cf

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `as-read`.

Findings:


On the facts and what they recommend: The diff leaves `recommends` unchanged on both facts (`as-read` on answer, `deferred` on authority) and `as-read` still `stands`, so no `## Recommendation` fence is warranted; it raises the answer fact's boldness from `moderate` to `high`, naming the emit-keys transposition as the reason, and adds the viable option `diverges-on-the-emit-keys-form` (source review) with the answer fact's `bears` entries left unchanged, both still `adopted`.

On the viability of the options: Every option remains viable: `as-read` is still a defensible reading, and the new option `diverges-on-the-emit-keys-form` is a genuine second reading of the paper's guarantee rather than a duplicate.

Strongest counter-argument (weak): All six of the previous reading's findings are answered, most matching the suggested edits verbatim: the rationale/authority class agreement, the question's naming of `survey-selection` in backticks, the `source` field dropping the uncitable descendant strand into the `against` where it already did its work, the second point in `## Answer` reframed to quote the parent's own aggregate-versus-pairwise limb rather than the false whole-node claim, the boldness raised to `high` on the transposition, and the new option recording the divergence the viability assessment flagged as missing. The one item this node's own file cannot close is the sibling half of the second finding — correcting `survey-selection`'s own account text, which still (as far as this reading can see, since it is not given that node) may describe this node as diverged on `several-readers-over-a-partition` — but this node does its own part by recording in its account that the parent's entry was that reader's error and that this node has carried `adopted` on both bearings since it was minted, which is what the suggested edit asked of this node specifically.

### The session's reply to the re-reading of cbff56cf, 2026-09-07

Recorded in its own entry because the apply that landed the reading carried no reply, the replies file it was given being another wave's. The parent's account entry is left as the record of its day, as this node's account says; the survey judges the pair, and the parent's own entry is on the reconciliation list as a stale claim that needs no amendment.
