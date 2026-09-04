---
question: Which forms may an answer take?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 52159a4998c58c1bfd23568bddb5537f47afe196
facts:
  - name: answer
    options:
      - name: rule-beside-disposition
        source: ai
        ref: "2026-09-03"
      - name: all-five-forms
        source: ai
        ref: "2026-09-03"
      - name: mint-assumption-question
        source: review
        ref: "2026-09-03"
      - name: authors-form-questions
        source: author
        ref: "2026-09-02"
      - name: assumption-is-instrumentation
        source: author
        ref: "2026-09-02"
    recommends: rule-beside-disposition
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
under:
  - commons.systems/disposition-graph/node
---
## Facts

### answer

#### rule-beside-disposition

Keep rule as a form beside disposition and migrate nothing, which is where the recommendation moved after the first review's strong counter-argument. The merge it replaced rested on a carrier no criterion has: nothing in the graph says whether an answer is to be achieved or maintained, almost every node is unguarded, and instruments' operational reading of a failure as work or as a variance would lose its class. Nothing migrates under it, which the second review verified is the strongest fact in its favour.

#### all-five-forms

Keep all five forms, target, rule, assumption, archē and reading, of low boldness. The second review's counter-argument argues for it: the author asked three separate questions and the recommended option answers only the second, while assumption as a form is still doing work, two nodes carrying form assumption today and their drafts keeping it, so the recommended option leaves the record with assumption as a form and instruments' draft calling it a criterion kind.

#### mint-assumption-question

Take the recommended option and mint the author's unanswered question, whether assumption is a form at all, as its own question under this node rather than letting instruments' draft carry it. The session's reply offers this to the author beside the third option, and the contradiction finding recorded here proposes the same.

#### authors-form-questions

Three of the five author quotations carried on node are the ground of forms' whole sitting, which paraphrases them as the author asking whether target is synonymous with disposition, what rule adds, and whether assumption is a form at all. The last, whether this is correctly encoded as form assumption against form disposition with unvalidated instrumentation, is carried verbatim on capture, knowledge-store and purpose and on no node that answers it, while forms carries no Disposition section of its own and stands at the ruling stage recommending ratified, which authority makes invalid without the ruling in the record. The candidate is that forms carry these words as its ground, node keeping them as context on the part it answers. Raised on commons.systems/disposition-graph/node, commons.systems/disposition-graph/capture.

#### assumption-is-instrumentation

The author's words carried on instruments state that assumption is not a form but instrumentation, the condition under which an answer stays valid. Forms' option that carried this was withdrawn after its review, and its surviving recommendation, keeping rule beside disposition, leaves the question the author asked unanswered, as forms' own reply and the contradiction finding both say. The author's leaning is therefore a candidate answer with no option representing it. (Raised on commons.systems/disposition-graph/instruments.) Also raised on commons.systems/disposition-graph/purpose.

## Recommendation

```markdown
---
question: Which forms may an answer take?
form: rule
under:
  - commons.systems/disposition-graph/node
---
## Answer

One of five: a target, something that should become true; a rule, something that must stay true while working; an assumption, something about the world the answer relies on; an arche, a first principle held and never derived; and a reading, what a tradition says about the answer above it. Rule stays beside target rather than merging with it into a single disposition form, because the difference between them is what a failing check means: a target's failing check is work, and a rule's failing check is a variance that gates the work that broke it. That difference has no other carrier, since no criterion says whether its answer is to be achieved or maintained and an unguarded node has no criterion at all, so a merge would leave a failure with no class for the frontier to read. Nothing migrates under this answer: the five names stand as the validator already accepts them, and no node is rewritten. Whether assumption is a form at all is not settled here; it stands as its own question under this node.

## Rationale

The author asked what a rule adds that a target does not, and the answer is the reading of its failure: work in the one case, a variance that gates work in the other, which is how the frontier decides what to do next. The merge that would have dissolved the question rests on a carrier the record does not have, and almost every node is unguarded, so the distinction it removes would have nowhere to live. Keeping the names also costs nothing, where the merge would make twenty-two nodes non-conforming at once and change the validator's accepted set. Rejected: four forms with target and rule merged as disposition and assumption made a criterion kind, because the distinction it removes has no carrier and the migration touches twenty-two nodes and the validator; and keeping all five forms as a bare status quo, because it records no reason and leaves the author's question about rule unanswered. The goal-oriented requirements tradition, which carries achieve and maintain on the goal's criterion rather than on its kind, is owed as a reading here.
```

## Account

### Sitting on purpose, 2026-09-03

**Forms**

Today the schema has five forms: target, rule, assumption, archē, reading. The author asked whether target is synonymous with disposition, what rule adds, and whether assumption is a form at all. The goal-oriented requirements tradition carries achieve and maintain on the goal's criterion, not on its kind, and the requirements tradition records domain assumptions beside the specification as conditions, not goals.

Options:
- Four forms, target and rule merged as disposition, assumption a criterion kind, tradition added — authority ratified; boldness high; persistence standing; withdrawn after the review below
- (recommended) Keep rule as a form beside disposition; nothing migrates — authority ratified; boldness moderate; persistence standing
- Keep all five forms — authority ratified; boldness low; persistence standing

Feeds: `node`, `instruments`, `purpose`, `knowledge-store`, `capture`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The recommended option merges target and rule on the ground that achieve or maintain is carried by the criterion, but no criterion in the graph carries that marker, including the four drafted at this sitting, and instruments' draft mandates the marker without naming a field. The merge removes a distinction the record can express and replaces it with one it cannot. Suggested edit: name the field in the option.
- The option adds a fourth form, tradition, while readings' draft puts traditions in a separate graph as root nodes. Neither says whether such a root carries 'form: tradition'. Suggested edit: state it.
- Taking option 1 makes every node carrying 'form: rule' or 'form: target' non-conforming at once: twenty-two nodes today, five of them forwarded in this same batch as they stand (growth, transience, materialization, session-context, delegation). The migration is not named in the option, so the author would rule without seeing its size.

On the three facts: Ratified is right, this is the author's own question. Boldness should be high rather than moderate for option 1: abolishing two forms and moving assumption into criteria is the AI's construction and touches twenty-two nodes.

Strongest counter-argument (strong): The merge depends on a carrier most of the graph does not have. Instruments' draft says 'A ratified answer with no criterion is unguarded, and the record says so', so an unguarded disposition carries no criterion and therefore no achieve-or-maintain at all; today almost every node is unguarded. The distinction is load-bearing: instruments' current text says 'A target's failing check is work. A rule's failing check is a variance that gates the work that broke it', which is how the frontier decides what to do with a failure. Under the merge, an unguarded node's failure has no class, so the frontier cannot tell work from a variance. Option 2, keeping rule beside disposition, preserves that at the cost of the redundancy the author noticed, and the redundancy is cheaper than the loss.

The session's reply: The counter-argument wins. The recommendation changes to the second option, rule kept beside disposition: the merge rested on a carrier no criterion has, an unguarded node could express neither achieve nor maintain, and the frontier's reading of a failure as work or as a variance would lose its class. The migration the first option hid, twenty-two nodes, is the measure of what the second option saves. Whether a tradition carries a form of its own is put to the readings ruling.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The Options block still marks option 1 '(recommended) Four forms, target and rule merged as disposition, assumption a criterion kind, tradition added', while the session's reply below says 'The counter-argument wins. The recommendation changes to the second option, rule kept beside disposition.' The ruling this node opens is 'take the recommended option'. Suggested edit: move the '(recommended)' marker to option 2 before the author rules.
- Node's draft still states the withdrawn merge as the schema, and node's Proposal summary still presents it as recommended. The two nodes now recommend opposite answers to one question. Suggested edit: strike the merge from node's draft in the same landing.
- Instruments' draft still carries the achieve-or-maintain sentence that option 1 rested on, although instruments' own reply withdrew it. Three nodes, one decision, three states.
- Option 1's migration cost is stated only in the review ('twenty-two nodes today'). Verified: FORMS in read.mjs is target, rule, assumption, arche, reading, and 'form: disposition' is not accepted, so option 1 is also a validator change. Under option 2 nothing migrates, which is the strongest fact in its favour and is not in the option's own text.

On the three facts: The frontmatter recommendation (ratified, moderate) matches option 2's stated boldness, so the data and the reply agree and only the '(recommended)' marker is stale — evidence that this is a clerical omission to fix rather than a disagreement to rule on. Option 1's boldness should have been high, which is now moot.

Strongest counter-argument (moderate): Option 3, keeping all five forms, deserves a line the node does not give it. The author's questions were whether target is synonymous with disposition, what rule adds, and whether assumption is a form at all — three separate questions, and option 2 answers only the second. Assumption as a form is still doing work: two nodes (knowledge-store, capture) carry 'form: assumption' today and their drafts keep it, so option 2 leaves the record with assumption as a form and instruments' draft calling it a criterion kind. The question the author asked about assumption is not settled by either surviving option.

The session's reply: Validated. Amended tonight: the recommended marker moves to the second option, rule kept beside disposition, and instruments' draft drops the sentence the merged option rested on; node's draft reverts at its sitting. Under the second option nothing migrates, which the option now says. The question whether assumption is a form at all is not settled by it; the author may take the third option or have the question minted under this node. Stage ruling.

### Frontier finding, 2026-09-03

Kind: contradiction.

One schema question is in three states inside one batch. Forms' session reply: 'The counter-argument wins. The recommendation changes to the second option, rule kept beside disposition.' Node's draft says the opposite: 'the current position in one of four forms: a disposition, something that should become or stay true ... An assumption is not a form but a criterion', and node's Proposal summary still reads 'Four forms: disposition (target and rule merged ...)'. Instruments' draft still carries the sentence the merge rested on — 'A criterion also says whether the answer is to be achieved ... or maintained' — although instruments' own reply says it 'is withdrawn at the recording'. Forms' Options block meanwhile still marks the withdrawn option '(recommended)'.

Also named: commons.systems/disposition-graph/node, commons.systems/disposition-graph/instruments.

Proposed: Forms is the survivor and is ruled first: move the '(recommended)' marker to option 2. Node's draft then reverts to five forms with the un-aligned-disposition sentence restored, and its Proposal summary is rewritten. Instruments' draft strikes the achieve-or-maintain sentence and keeps the three criterion kinds without it. The assumption question the author actually asked ('Is assumption a form at all?') is left unanswered by option 2 and should be minted as its own question under forms rather than carried by instruments' draft.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `rule-beside-disposition` (ai); `all-five-forms` (ai); `mint-assumption-question` (review, 2026-09-03); `authors-form-questions` (author, 2026-09-02, from commons.systems/disposition-graph/node); `assumption-as-form-question` (author, 2026-09-02, from commons.systems/disposition-graph/capture); `assumption-is-instrumentation` (author, 2026-09-02, from commons.systems/disposition-graph/instruments).
The recommendation adopts `rule-beside-disposition` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
The census unit's note: No Answer and no Draft; the recommendation attaches to the option now marked recommended, keeping rule beside disposition. I excluded the four-form merge, since the Options block records it as withdrawn after the review and the session's reply says the counter-argument wins; if the author is to take it back it should be re-minted deliberately rather than inferred. The contradiction finding's two proposals for other nodes are in different states: node's draft still states the withdrawn merge, carried as an alternative on node itself, while instruments' draft no longer carries the achieve-or-maintain sentence. Three of the author's quotations on node ground this node's ruling and are moved here from there.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `authors-form-questions` absorbs `assumption-as-form-question`. The merge unit's note: assumption-as-form-question also restated the coverage finding's proposal that capture, knowledge-store and purpose cite forms, which is an alternative on those three nodes and not a change to forms, and it restated forms' second review's ask that the assumption half be minted under this node, which mint-assumption-question already carries and which stays separate. assumption-is-instrumentation is a different candidate answer (assumption is instrumentation, not a form) and stays.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified fixed since the last review: the Options block marks option 2 '(recommended)' and option 1 'withdrawn after the review below', and the frontmatter recommendation adopts `rule-beside-disposition`, so the data and the prose agree. The same hazard is unresolved on rejected.
- Recommendation fence, Answer, last sentence: 'Whether assumption is a form at all is not settled here; it stands as its own question under this node.' Verified no such node exists: the graph carries no child of forms asking it, and the question lives instead as the author's words carried verbatim on knowledge-store, capture and purpose. The fence asserts a node the record does not have. Suggested edit: mint it in the same landing, which is what `mint-assumption-question` proposes, or say the question is open and unminted.
- The node carries no '## Disposition' section — verified — although three of the author's five quotations on `node` are the ground of this whole sitting, including the assumption question. The `authors-form-questions` alternative would move them here; until then the node that rules on the forms carries none of the author's words on them.
- Recommendation fence, Rationale: 'Rejected: four forms with target and rule merged as disposition and assumption made a criterion kind, because the distinction it removes has no carrier and the migration touches twenty-two nodes and the validator.' Verified the migration count is right in kind: FORMS in read.mjs is target, rule, assumption, arche, reading, and 'disposition' is not accepted, so option 1 was a validator change. Nothing migrates under the recommended option, which is the strongest fact in its favour and is now in the fence.
- Node's recommended text still states the withdrawn four-form merge, and node stands at the maieutic stage with `five-forms-restored` pending. The two nodes recommend opposite answers to one question and only node's side is flagged; forms is the survivor and its fence does not say so.

On the three facts: The frontmatter recommendation (adopts rule-beside-disposition, ratified, moderate) states one class and one value, matches the option now marked recommended, and the pin is current. Ratified is right, since this is the author's own question; the fence carries no quoted ruling and the node no '## Disposition', so the stamp waits on the quotes ruling like the rest. Persistence standing follows from the node's shape.

Strongest counter-argument (moderate): Option 3, keeping all five forms, deserves the line the node does not give it. The author asked three questions — whether target is synonymous with disposition, what rule adds, and whether assumption is a form at all — and the recommended option answers only the second. Assumption as a form is still doing work: knowledge-store and capture carry `form: assumption` today and both recommended texts keep it, while instruments' recommended text calls assumption a criterion kind, so the record after this ruling holds assumption as a form and as a criterion kind at once. The question the author actually asked is settled by neither surviving option.

The session's reply: Forward accepted, and the finding on the missing child taken: the node assumption-form is minted under forms at this landing, at the periagogic stage, carrying the author's words of 2026-09-02 that knowledge-store, capture, and purpose carry, so the fence's sentence is true. The authors-form-questions alternative stays open.

### Frontier finding, 2026-09-03

Kind: placement.

Authority holds that 'a ratified stamp whose ruling is not in the record is invalid', and quotes rules on what that requires. Measured against the graph as it now stands: eleven recommendation fences in this batch carry `class: ratified`, and eight of them quote no ruling of any date anywhere in the fence — purpose, hexis, namespaces, projection, traditions-home, forms, second-stop and purpose-criteria — while three do: rationale-edge, quotes and rejected. Separately, twenty-three of the sixty-eight nodes carry no '## Disposition' section at all (`validate.mjs` reports 'ok: 68 nodes'; the count of nodes with no such section is 23), among them evaluation, persistence, legacy, validation-order, review, recording, forms, traditions-home, purpose-criteria, second-stop and all three public nodes. Quotes' own recommended answer unbars them in one clause — 'the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp' — so the whole question of whether eight fences and twenty-three nodes can carry a ratified stamp turns on a node that is itself unruled and in this batch. The counts recorded on the batch's own findings are stale against the graph: 'twenty-two of the sixty-two nodes' was measured when the graph held 62.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose-criteria.

Proposed: Quotes is the survivor and is ruled first among the nodes of this batch, after the periagogic sitting on public/agency that every one of them descends from. Nothing in the eight fences need change before that ruling, because quotes' recommended answer sanctions them; what must not happen is that any of the eight is recorded with a ratified stamp before quotes is ruled, since under the losing option each such stamp is invalid on landing. Quotes' own facts should state the measured size of the bar at the moment of ruling rather than a count fixed in prose, since the count has already moved once.

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `fence-carries-the-ruling` (source review, 2026-09-03).
