---
question: Which forms may an answer take?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 2443bdd51f8aad4c8b45db6d5276e12aceebd5e5
under:
  - commons.systems/disposition-graph/node
---

## Proposal

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
