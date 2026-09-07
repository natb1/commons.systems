---
question: How are the author's words retained when a ruling is recorded?
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: dfe115405719ce311fa7facaa997f9326b6aef32
  commit: d4ab02834a08930a67d9b5885708f3f23f7a9153
  against: "The disclaim answering Finding 4 is itself a new, unverified assertion about `recording`'s current answer fact and its recommended option's fence content, made in a delta-scoped reading that has no access to `recording`'s file to confirm it. If `recording` in fact carries some form of the promised option under a different name, or its cited fence does not do what this account claims, the repair would be inaccurate rather than merely silent — a stronger defect than the silence it replaces. But this is the same category of cross-node uncertainty the previous reading itself accepted as deferrable to the survey (its Finding 3 on the `commit` field), so treating this disclaim the same way is consistent rather than a double standard."
  survey:
    date: 2026-09-05
    of: 2bc62fd8426b1e3b5af8410c96d37bb154cc3eb1
facts:
  - name: answer
    options:
      - name: ruling-stays-in-node
        source: ai
        ref: "2026-09-03"
      - name: ruling-in-commit-message
        source: ai
        ref: "2026-09-03"
      - name: sittings-graph
        source: ai
        ref: "2026-09-03"
      - name: edited-not-verbatim
        source: author
        ref: "2026-09-03"
      - name: facts-state-the-count
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "a review instruction and not an answer to the question: the facts have stated the count since the re-encoding of 2026-09-04, and the mismatch it found recurred at b95923d7 and is repaired"

      - name: fence-carries-the-ruling
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "a fence is one option's content and carries no ruling; the ruling is recorded on the option, as the viable-options node has it, and the words it rests on are referenced from there"
      - name: one-ruling-for-the-unquoted-stamp
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "there is no stamp to rule for: the class is read off the rulings, and a ruling whose words are not in the record is invalid, so an unquoted ruling is not a class of ruling the record has"
      - name: words-in-a-ledger-on-the-ref
        source: author
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/4
          - words/2026-09-07/14
          - words/2026-09-07/15
      - name: words-under-the-node-they-were-said-on
        source: ai
        ref: "2026-09-07"
      - name: the-quotation-is-copied-onto-every-option
        source: ai
        ref: "2026-09-07"
      - name: words-in-a-ledger-on-its-own-ref
        source: review
        ref: "2026-09-07"
    recommends: words-in-a-ledger-on-the-ref
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
under:
  - commons.systems/disposition-graph/authority
defines:
  - term: ledger
    gloss: "The append-only file of the author's words on the disposition ref, `disposition/words/<date>.md`, each entry verbatim and dated, addressed `words/<date>/<n>` by its date and its ordinal within that date, and referenced by the options a ruling or a divergence rests on."
---

## Facts

### answer

`words-in-a-ledger-on-the-ref` is recommended, on the author's question of 2026-09-07 quoted under `## Disposition` and their words of the same day that the choice is for confirmation: the words are stored once, on the ref, and every option that rests on them or departs from them references them, which is the only arrangement of the three under which the retention rule loses nothing and coverage stays a query. Moderate boldness: the measurement is the AI's, the three options are drawn where the author's question drew them, and the author's phrase "concatenated quotation" reads as naturally on the copy as on the projection.

#### ruling-stays-in-node

The author's verbatim ruling stays in the node, under a Disposition section with its date, and is rolled up at the next sitting; the commit message carries it in addition. This is the option the session moved the recommended marker to after the first review's counter-argument, and it is what every node amended on 2026-09-03 already does. It owes a rule for the roll-up, whose shape no node describes.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The verbatim ruling stays in the node. When a sitting records a ruling, the author's words are quoted in the node's Disposition section with their date, and the message of the commit that lands the node carries them in addition. The rationale restates the ruling in the record's own register; the quotation is what the restatement is of, and is never replaced by it. The section accumulates, and each sitting on the node rolls up the quotations its answer has absorbed, version control holding what the roll-up drops. A ratified stamp whose ruling is not in the node is invalid, and the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp.
```

#### ruling-in-commit-message

No new schema: the ruling goes verbatim into the message of the commit that lands it, the rationale restates it, and a quote appears inline only where the wording itself is the decision. The session withdrew this after the counter-argument that no projection, validator or clean-context reviewer reads commit messages, which would make authority's invalid-stamp rule uncheckable. The second review still argues it has one virtue worth weighing, that verbatim rulings kept in nodes accumulate to nine quotations on purpose and eight on work-loop that the author reads past on every page.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

No new schema: the ruling goes verbatim into the message of the commit that lands it, the rationale restates it, and a quote appears inline only where the wording itself is the decision. The session withdrew this after the counter-argument that no projection, validator or clean-context reviewer reads commit messages, which would make authority's invalid-stamp rule uncheckable. The second review still argues it has one virtue worth weighing, that verbatim rulings kept in nodes accumulate to nine quotations on purpose and eight on work-loop that the author reads past on every page.
```

#### sittings-graph

A sittings graph holds each sitting's record as evidence, cited by the nodes it ruled on, so the verbatim words live in one place and the nodes reach them by citation. It is the highest-boldness of the three options and is neither recommended nor withdrawn.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

A sittings graph holds each sitting's record as evidence, cited by the nodes it ruled on, so the verbatim words live in one place and the nodes reach them by citation. It is the highest-boldness of the three options and is neither recommended nor withdrawn.
```

#### edited-not-verbatim

The author's words carried verbatim on authority state a candidate answer to this node's question: quotes are rarely expected to be recorded as disposition verbatim, the dialogue is expected to edit for clarification and writing quality, and retaining the original quotes as reference is a function that must earn new schema. This node carries those words only as a paraphrase in its account and has no `## Disposition` section of its own, and the option it now recommends — the verbatim ruling stays in the node under Disposition, rolled up at the next sitting — is in tension with the first half of them. (Raised on commons.systems/disposition-graph/authority.)

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The author's words carried verbatim on authority state a candidate answer to this node's question: quotes are rarely expected to be recorded as disposition verbatim, the dialogue is expected to edit for clarification and writing quality, and retaining the original quotes as reference is a function that must earn new schema. This node carries those words only as a paraphrase in its account and has no `## Disposition` section of its own, and the option it now recommends — the verbatim ruling stays in the node under Disposition, rolled up at the next sitting — is in tension with the first half of them. (Raised on commons.systems/disposition-graph/authority.)
```

#### facts-state-the-count

The placement finding proposes that quotes be ruled first after agency, since its resolution is a bar on roughly a third of the frontier: twenty-two of the sixty-two nodes carry no Disposition section and so cannot support a ratified stamp under authority's rule. It proposes that quotes' facts state that count, and it finds that quotes' own Options block still marks as recommended the option its session reply withdrew, so an author taking the recommended option would take the withdrawn one; the marker is to be moved before the author rules. Raised on commons.systems/disposition-graph/recording, commons.systems/disposition-graph/evaluation.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The placement finding proposes that quotes be ruled first after agency, since its resolution is a bar on roughly a third of the frontier: twenty-two of the sixty-two nodes carry no Disposition section and so cannot support a ratified stamp under authority's rule. It proposes that quotes' facts state that count, and it finds that quotes' own Options block still marks as recommended the option its session reply withdrew, so an author taking the recommended option would take the withdrawn one; the marker is to be moved before the author rules. Raised on commons.systems/disposition-graph/recording, commons.systems/disposition-graph/evaluation.
```

#### fence-carries-the-ruling

The answer says what a recommendation fence carries of the author's words, not only what a recorded node carries. Verified that the batch is split three ways on this today: three fences carrying `class: ratified` quote a dated ruling (rationale-edge, quotes, rejected) and eight do not (purpose, hexis, namespaces, projection, traditions-home, forms, second-stop, purpose-criteria), with no rule anywhere deciding which is right. On this alternative a fence recommending ratification carries the ruling it rests on, or names the node that carries it, so that a reader of the alignment page sees the ground of the stamp beside the stamp; it is on the table because the recommended answer settles what the recorded node holds and is silent about the text the author actually reads when ruling.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The answer says what a recommendation fence carries of the author's words, not only what a recorded node carries. Verified that the batch is split three ways on this today: three fences carrying `class: ratified` quote a dated ruling (rationale-edge, quotes, rejected) and eight do not (purpose, hexis, namespaces, projection, traditions-home, forms, second-stop, purpose-criteria), with no rule anywhere deciding which is right. On this alternative a fence recommending ratification carries the ruling it rests on, or names the node that carries it, so that a reader of the alignment page sees the ground of the stamp beside the stamp; it is on the table because the recommended answer settles what the recorded node holds and is silent about the text the author actually reads when ruling.
```

#### one-ruling-for-the-unquoted-stamp

Quotes' answer says what becomes of a node recommending ratification with no ruling quoted in it, and that ruling governs every such node rather than each carrying its own alternative. Verified that the same question is pending under three different names on six nodes — `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, `deferred-not-ratified` on review and persistence — and that twenty-three of sixty-eight nodes carry no '## Disposition' section, so the population is larger than the six that happen to carry an entry. On this alternative quotes' answer states the consequence once, that such a node either gains the ruling it rests on or its recommendation drops to deferred, and the six entries become consequences of it; it is on the table because one question is currently on the author's queue six times under three names, and inconsistently, since seventeen nodes in the same position carry no entry at all.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

Quotes' answer says what becomes of a node recommending ratification with no ruling quoted in it, and that ruling governs every such node rather than each carrying its own alternative. Verified that the same question is pending under three different names on six nodes — `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, `deferred-not-ratified` on review and persistence — and that twenty-three of sixty-eight nodes carry no '## Disposition' section, so the population is larger than the six that happen to carry an entry. On this alternative quotes' answer states the consequence once, that such a node either gains the ruling it rests on or its recommendation drops to deferred, and the six entries become consequences of it; it is on the table because one question is currently on the author's queue six times under three names, and inconsistently, since seventeen nodes in the same position carry no entry at all.
```

#### words-in-a-ledger-on-the-ref

One ledger of the author's words on the `disposition` ref beside the node files, `disposition/words/<date>.md`, each entry stored once, addressed by its date and its ordinal within the date, and referenced from any option on any node; the per-option quotation is a projection.

**AI support.** `dialogue`'s rule is that every part a ruling or a projection needs is in the record, in one place, and that a copy is what drifts. Measured at graph commit `32cd2e18` over all 143 nodes: 288 `## Disposition` entries, 208 distinct texts, 131,688 bytes of which 37,081, 28%, are copies beyond the first, one quotation standing on eight nodes, every copy hand-made and none checked against another. It is the only option of the three under which the retention rule loses nothing, an entry no option carries staying in the ledger unreferenced and addressable for a later sitting to attach, and the only one under which coverage stays a mechanical query, an unreferenced entry being computable from the record. The address is an ordinal and not a hash because a quotation is transcribed by hand and sometimes corrected, and a hash would break every reference on a correction while an ordinal survives both append and correction, the reader recording each entry's own sha so that a reference to text since changed is reportable.

The author's decisions are the one thing re-derivation cannot reconstruct, so they are what the record stores, and a restatement is by construction the AI's wording of them, which is the drift this record exists to resist. Nothing reads commit messages: the browser renders the record, the validator parses it, and the clean-context review reads it, so the words are on the ref where every instrument reads, and they are there once, because a copy is what drifts: measured at graph commit `32cd2e18`, the 288 entries the nodes carried under `## Disposition` were 208 distinct texts, and 37,081 of their 131,688 bytes were copies beyond the first, every copy hand-made and none checked against another. The cost is not paid by a roll-up; it is moved, and what is moved is legibility: a node file no longer holds the words that ground it, and a reader resolves one reference into a second kind of file, which the author accepted on 2026-09-07 on the condition, met here as for an option's content, that the derivation be mechanical. What enforces the append discipline is the validator, which refuses a gap or a repeat in a date's ordinals and reports a reference whose entry's sha has changed. Nothing of this is materialized on 2026-09-07: `disposition/words/` does not exist, the reader `words.mjs` landed on the implementation ref that day, and the migration under the author's grant of that day writes the ledger from the entries the nodes carry and seeds the references from the options' `ref` dates. The author, 2026-09-03, asked for this: author quotes are rarely expected to be recorded as disposition verbatim and the dialogue edits for clarification and writing quality, but "it may make sense to retain original author quotes as reference though - evaluate whether this function earns new schema".

**AI divergence.** It puts a second kind of file on a ref whose rule is that it carries the graphs and only the graphs, which `materialization` must amend; and a node file stops being readable on its own, the words that ground it being one resolution away, which is the second legibility trade this design makes after the named-change form.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The verbatim ruling stays in the record, once. When a sitting records a ruling, the author's words are written as an entry of the ledger, `disposition/words/<date>.md` on the disposition ref beside the graphs, verbatim and dated, addressed `words/<date>/<n>` by its date and its ordinal within the date, the entries of a date appended in order and never inserted, reordered or renumbered, and the option the author ruled on carries the reference to it; nothing else carries the words, and a commit message is not a copy of them. The ledger holds no node — no question, no facts, no options and no class — so it is outside the graph and inside the record, the record being the ref and the graph being the nodes on it. The rationale restates the ruling in the record's own register; the quotation is what the restatement is of, and is never replaced by it. The ledger accumulates and is append-only; what a node carries of it is the references its options hold, and an entry no option anywhere references stays in the ledger unreferenced, addressable by a later sitting rather than dropped. An entry reaches a node only through the references its options carry: an option references an entry where the entry supports it or the option diverges from it, and an entry no option of a node references is not on that node, which is the roll-up rule this answer once owed and could not state, given by the author's words of 2026-09-07 and stated once, here, for the dialogue node to cite. A reference is written by the AI and is a claim about the author's words, so the validator resolves every reference against the ledger, and an entry's sha is recorded so that a reference to text since corrected is reportable. A ruling whose words are not in the record is invalid, and the words a ruling requires are the ones the author gives at that sitting, entered in the ledger then and referenced by the option ruled on; words the author said earlier are the ground a draft rests on and confer no ruling.
```

#### words-under-the-node-they-were-said-on

Entries stay under `## Disposition` of the node where they were said and are referenced across nodes by node id and entry ordinal.

**AI support.** It is the smallest change, it keeps a node readable on its own for its own words, and it needs no amendment to what the ref carries.

**AI divergence.** It keeps `## Disposition` as a section, so the absorption the accumulation asks for is half taken; the node where a word was said is a fact about the sitting and not about the word, so the address of a quotation depends on which node a session happened to record it on first; and it leaves the measured duplication in place for every quotation already copied, since a second node that carries the words either copies them again or points at a node with no better claim to them.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

Entries stay under `## Disposition` of the node where they were said and are referenced across nodes by node id and entry ordinal.
```

#### the-quotation-is-copied-onto-every-option

Each option carries the quotation itself, concatenated in date order, with no ledger and no reference, and a validator check that copies of one entry agree.

**AI support.** It is the plainest reading of the author's phrase that the author's response is concatenated quotation, it needs no resolver, and every option is legible with nothing else open.

**AI divergence.** It multiplies the duplication already measured by the number of options that cite an entry rather than reducing it, so the 28% becomes the smaller share of a larger number; and the record's cure for one text in two places is a check that the copies agree, which is the update anomaly answered rather than avoided. Where the author prefers the copy, this option takes it and the check comes with it.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The verbatim ruling stays in the record, once. When a sitting records a ruling, the author's words are written as an entry of the ledger, `disposition/words/<date>.md` on the disposition ref beside the graphs, verbatim and dated, and the option the author ruled on carries the reference to it; the message of the commit that lands the node carries the words in addition. The ledger holds no node — no question, no facts, no options and no class — so it is outside the graph and inside the record, the record being the ref and the graph being the nodes on it. The rationale restates the ruling in the record's own register; the quotation is what the restatement is of, and is never replaced by it. The ledger accumulates and is append-only; what a node carries of it is the references its options hold, and an entry no option anywhere references stays in the ledger unreferenced, addressable by a later sitting rather than dropped. An entry is retained on a node only where an option of that node supports it or diverges from it, which is the roll-up rule this answer once owed and could not state, given by the author's words of 2026-09-07. A ratified stamp whose ruling is not in the record is invalid, and the ruling a stamp requires is the one the author gives at that sitting, entered in the ledger then and referenced by the option ruled on; words the author said earlier are the ground a draft rests on and bar no stamp.
```

#### words-in-a-ledger-on-its-own-ref

The ledger lives on a ref of its own beside the disposition ref, and options reference it across refs.

**AI support.** It keeps the disposition ref carrying the graphs and only the graphs, as its rule stands, and the words, which no ruling reaches, out of the ref where rulings are recorded.

**AI divergence.** A reference across refs is not resolvable from a checkout of one, so every reader, the validator first, would need two checkouts at pinned commits to validate a node, and a landing on one ref could not be checked against the other in one commit; the record's own rule that every part a ruling needs is in the record in one place puts the words on the ref the rulings are on.

**Content.**

```markdown
---
question: How are the author's words retained when a ruling is recorded?
form: rule
under:
  - commons.systems/disposition-graph/authority
---
## Answer

The ledger lives on a ref of its own beside the disposition ref, and options reference it across refs.
```

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier survey, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-05, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Option adopted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 2daba5dd, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 8895ea94, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the re-reading, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: The term defined, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context re-reading, 2026-09-07, of 8895ea94 (ii), at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the third reading of 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of 8895ea94 (iii)

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `words-in-a-ledger-on-the-ref`.

Findings:

- Account, "### Repaired after the third reading of 2026-09-07": the amendment answers the previous reading's Finding 4 (the dropped `recording` claim) with a definitive disclaim — "It did not, under that name or any other: `recording`'s answer fact carries no such option, and what carries the rule there is its recommended option `the-confirmation-folds-an-already-accumulated-node`, whose fence, repaired for that node's own reading of 2026-09-07, sends the author's words to the ledger as this node decides in every place it names them, so the rule is in that node's recommended text and no separate option is owed." This is a new claim about a sibling node's current facts that this delta-scoped reading cannot verify against `recording`'s own file; it should be checked at the next full reading or by the survey, the same way this node's own prior `commit`-field claim was passed through rather than verified in scope.

On the facts and what they recommend: The diff makes no change to any fact's `recommends`, `boldness`, option list, or the `## Recommendation` fence's content — those were already settled by the prior amendment this brief's "node as it now stands" reflects. The only substantive change is frontmatter: a new `defines` entry glosses the term `ledger` (added in response to a finding from a different reading, of `materialization`), which by the account's own statement moves this node's pin; the three new `## Account` entries narrate that addition and the amendment's disclaim of the `recording` claim, and change nothing else on the node's own facts.

On the viability of the options: The diff neither adds nor removes any option on the answer or authority facts and does not touch the status or reason of any already-passed option (`fence-carries-the-ruling`, `one-ruling-for-the-unquoted-stamp`); every option already on the list remains exactly as viable, passed, or recommended as it stood at the last reading's pin.

Strongest counter-argument (weak): The disclaim answering Finding 4 is itself a new, unverified assertion about `recording`'s current answer fact and its recommended option's fence content, made in a delta-scoped reading that has no access to `recording`'s file to confirm it. If `recording` in fact carries some form of the promised option under a different name, or its cited fence does not do what this account claims, the repair would be inaccurate rather than merely silent — a stronger defect than the silence it replaces. But this is the same category of cross-node uncertainty the previous reading itself accepted as deferrable to the survey (its Finding 3 on the `commit` field), so treating this disclaim the same way is consistent rather than a double standard.

The session's reply: Validated on the main thread against recording's file: its answer fact carries no option mirroring this node's ledger rule, and the rule is in the recommended option's fence at the two places it names the author's words, so the disclaim is true as written.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/quotes stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `words-in-a-ledger-on-the-ref`; 3 `## Disposition` entries became the ledger entries words/2026-09-07/4, words/2026-09-07/14, words/2026-09-07/15, referenced by 3 options the entry's own date names. The content of `ruling-stays-in-node (at c55c9ebb)`, `the-quotation-is-copied-onto-every-option (at 6a4bde73)` was recovered from the commit at which the answer fact recommended it. The record wrote no text of its own for `ruling-in-commit-message`, `sittings-graph`, `edited-not-verbatim`, `facts-state-the-count`, `fence-carries-the-ruling`, `one-ruling-for-the-unquoted-stamp`, `words-under-the-node-they-were-said-on`, `words-in-a-ledger-on-its-own-ref`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `8895ea94ffb09a942f8f7a40c22fd2830dca9d74` is re-computed for the encoding as `dfe115405719ce311fa7facaa997f9326b6aef32`; nothing it read changed. The survey's pin `2bc62fd8426b1e3b5af8410c96d37bb154cc3eb1` was already past the recommendation and is left as it stood.
