---
question: In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 99d93a890181feb0a8ae23d834505b07cb0bcc9a
facts:
  - name: answer
    options:
      - name: hexis-first
        source: ai
        ref: "2026-09-03"
      - name: knowledge-store-first
        source: ai
        ref: "2026-09-03"
      - name: sub-ruling-of-purpose
        source: review
        ref: "2026-09-03"
    recommends: hexis-first
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: keep
    boldness: moderate
under:
  - commons.systems/disposition-graph/purpose
---
## Facts

### answer

#### hexis-first

State the hexis claim first in the purpose answer with the knowledge store as its gloss, so that the record is a projection of its author's hexis, which is what a knowledge store would hold. Aristotle makes hexis the settled state itself and the record the projection of it, and a store is what would hold that projection. The wording is already in purpose's draft, and the reading that grounds it is delegated rather than ratified because the author has not read the loci.

#### knowledge-store-first

Keep the order the page had, a knowledge store, a projection of its author's hexis, of low boldness. The reviews' counter-argument backs it: purpose is the onboarding entry point and the README's source, no node's defines carries hexis so the browser cannot link it, and the apposition teaches the term instead of assuming it, the philosophical precision belonging on knowledge-store where the hypothesis and its reading live.

#### sub-ruling-of-purpose

Hexis decides a clause purpose's recommended text already contains, that the record is a projection of its author's hexis, which is what a knowledge store would hold. The finding proposes hexis carry one line saying it is a sub-ruling of purpose's text and must be ruled first, or be folded into purpose's account as an alternative, since confirming purpose as shown would decide hexis by that act. (Raised on commons.systems/disposition-graph/purpose.)

### existence

Prune: The redundancy finding notes that this node decides a clause purpose's draft already contains, so a confirmation of purpose as shown decides it by that act and a contrary ruling here would reopen purpose's draft. Its alternative to keeping the option-node is to fold the option into purpose's Proposal as an explicit alternative, which is what the first option on rejected would make structural, that decision being itself unruled.

## Recommendation

```markdown
---
question: In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?
form: rule
under:
  - commons.systems/disposition-graph/purpose
---
## Answer

Yes. The purpose answer states the hexis claim first and glosses it with the store: the record is a projection of its author's hexis, which is what a knowledge store would hold. Aristotle makes hexis the settled state itself, so what is projected is the state and not its container, and a store is what would hold the projection. The apposition stays in the sentence, so the term is taught where it is first used rather than assumed of the reader. The term is defined by the knowledge-store node, whose defines carries it, so the browser links its first use and a newcomer can follow it. What stands ratified here is the wording; the reading of Aristotle it rests on is delegated until the author reads the loci.

## Rationale

Hexis names the settled state, and this record is a projection of that state, so leading with the store would put the container before the claim it holds and make the gloss the assertion. The apposition answers the onboarding cost of a Greek term in the first paragraph a newcomer reads: the sentence teaches the word where it stands, and the knowledge-store node defines it so the browser can link it. Rejected: the knowledge store first, as the page had it, because it states the container as the claim and demotes the state to a qualifier, which is the reverse of what the reading supports. The ground is Aristotle, Nicomachean Ethics II.5, read by the AI and not yet by the author, which is why the reading under this wording is delegated while the wording itself is ratified.
```

## Account

### Sitting on purpose, 2026-09-03

**Hexis first**

The page said "a knowledge store, a projection of its author's hexis". The draft says "a projection of its author's hexis, which is what a knowledge store would hold". Aristotle, Nicomachean Ethics II.5, makes hexis the settled state itself, and the record is the projection of it; a store is what would hold that projection.

Options:
- (recommended) Hexis first, knowledge store as its gloss — authority ratified; boldness moderate; persistence standing
- Knowledge store first, as the page had it — authority ratified; boldness low; persistence standing

Feeds: `purpose`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- No node carries 'hexis' in its defines. Projection's draft in this batch requires every defined term to link to the node that defines it, so putting an unglossed Greek term in the first sentence a newcomer reads leaves a term the browser cannot link, which is the drift the author objected to. Suggested edit: if hexis goes first, add it to the defines of the node that explains it in the same landing.
- The reading that grounds the claim, aristotle-hexis, is deferred and says 'deferred until the author reads them'. The option asks the author to ratify a wording that rests on a reading they have not read; evaluation says work under an answer that cites a tradition is grounded in the tradition 'within its recorded support scope'. Suggested edit: present it as ratified on the wording and deferred on the ground.

On the three facts: Ratified is right, and moderate boldness is right since the reason is the AI's reading of a text the author has not read. The facts should say that what is ratified is one clause of another node's answer.

Strongest counter-argument (weak): Purpose is the onboarding entry point and the README's source, written for 'humans who want to manage the alignment of long-horizon AI agent workflows'. Leading with a Greek term the reader cannot yet look up spends the newcomer's attention on vocabulary rather than on the claim. The order the page had, 'a knowledge store, a projection of its author's hexis', teaches the term by apposition instead of assuming it, and the philosophical precision the recommendation buys belongs on knowledge-store, where the hypothesis and its reading actually live.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The decision this node puts as an option is already embodied in purpose's draft, which reads 'a projection of its author's hexis, which is what a knowledge store would hold'. If the author confirms purpose as shown, this node is decided by that act; if they then take option 2 here, purpose's draft must be reopened. Suggested edit: say on the node that it is a sub-ruling of purpose's draft and must be ruled first, and put it before purpose in the order.
- No node's defines carries 'hexis'. Verified against the parsed graph: 88 defined terms, none of them hexis. Projection's draft requires every defined term to link to the node that defines it, so the first Greek word a newcomer meets in purpose is one the browser cannot link. Suggested edit: add it to knowledge-store's defines in the same landing.
- The reading that grounds the choice, aristotle-hexis, is recommended delegated because the author has not read the loci. The option asks the author to ratify a wording resting on a reading they have not read; evaluation grounds work in a tradition only 'within its recorded support scope'.
- The node has no '## Answer' and no '## Draft': a confirmation takes 'the recommended option', and the answer must then be written after the ruling. That is sanctioned by recording, but it means eight nodes in this batch will need a maieutic act after the author has ruled.

On the three facts: Frontmatter ratified/moderate is right, and moderate is right because the reason is the AI's reading of a text the author has not read. The facts should say that what is ratified is one clause of another node's answer, and that the clause is already in purpose's draft.

Strongest counter-argument (moderate): Purpose is the onboarding entry point and the README's source, written for humans who want to manage the alignment of long-horizon AI workflows. Leading with a Greek term the reader cannot look up spends the newcomer's attention on vocabulary rather than on the claim, and the term is defined by no node, so the browser will not link it. The order the page had, 'a knowledge store, a projection of its author's hexis', teaches the term by apposition; the philosophical precision the recommendation buys belongs on knowledge-store, where the hypothesis and its reading live.

The session's reply: Validated. This node is a sub-ruling of purpose's draft, which already carries the recommended wording, and the ruling order puts it before purpose; the term is added to knowledge-store's defines at that node's recording, where the sentence that carries it lives. The reading it rests on is delegated because the author has not read the loci, which is why the option's boldness is moderate. On the counter-argument: the order the page had taught the term by apposition, and the option keeps that apposition in purpose's draft. Stage ruling.

### Frontier finding, 2026-09-03

Kind: redundancy.

Three option-nodes decide clauses that a sibling's draft already contains. Hexis asks whether the hexis claim comes first, and purpose's draft already reads 'a projection of its author's hexis, which is what a knowledge store would hold'. Purpose-criteria asks whether purpose carries criteria, and purpose's draft already carries them. Second-stop asks whether the model node is rewritten, and model's draft is that rewrite. If the author confirms the parent draft as shown, the option-node is decided by that act; if they then rule the option the other way, the parent's draft must be reopened, and the alignment page offers both on one screen with no ordering shown.

Also named: commons.systems/disposition-graph/purpose-criteria, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/model.

Proposed: Keep the option-nodes as the survivors of their questions, since each is a real decision the author should make separately, and add one line to each saying it is a sub-ruling of the named parent's draft and must be ruled first. Correspondingly, each parent's Proposal names the option-nodes its draft presumes. Alternatively fold each option into its parent's Proposal as an explicit alternative, which is what rejected's option 1 would make structural — but that decision is itself unruled.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `hexis-first` (ai); `knowledge-store-first` (ai); `fold-into-purpose` (review, 2026-09-03); `sub-ruling-of-purpose` (review, 2026-09-03, from commons.systems/disposition-graph/purpose).
The recommendation adopts `hexis-first` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
Moved to other nodes as alternatives: `define-hexis` on commons.systems/disposition-graph/knowledge-store.
The census unit's note: No Answer and no Draft, only an Options block with a recommendation, so the recommended option is what it adopts and the second option is pending, backed by both counter-arguments. The redundancy finding's own alternative, folding the option into purpose, is minted as a third. The ordering findings, that this is a sub-ruling of purpose and must be ruled first, are stated in the session's reply and are not candidate answers. The proposal that each parent's Proposal name the option-nodes its draft presumes is already recorded on purpose, purpose-criteria, second-stop and model, so the only entry elsewhere is the defines gap on knowledge-store, which carries no trace of it.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Recommendation fence, Answer: 'The term is defined by the knowledge-store node, whose defines carries it, so the browser links its first use.' Verified false today: `grep -rn '^  - hexis$' disposition/` returns nothing, so no node's `defines` carries 'hexis' and the browser cannot link it. The fence states as a present fact something the record does not yet do; the `define-hexis` alternative on knowledge-store is what would make it true. Suggested edit: say the term is added to knowledge-store's defines in the same landing, or the claim is false the moment it is ratified.
- The node decides one clause of purpose's recommended text, which already reads 'a projection of its author's hexis, which is what a knowledge store would hold'. Confirming purpose as shown decides this node by that act. The session's reply says the ruling order puts hexis first; nothing in the node's own text says so, and the alignment page shows both on one screen. The `sub-ruling-of-purpose` and `fold-into-purpose` alternatives are the two vehicles.
- Recommendation fence: 'The ground is Aristotle, Nicomachean Ethics II.5, read by the AI and not yet by the author, which is why the reading under this wording is delegated while the wording itself is ratified.' The reading it names, aristotle-hexis, stands at the ruling stage with `logos-not-hexis` pending — a counter-argument that the record's move (the record is both a projection of the hexis and part of how it is formed) is where the claim stops being Aristotle's. Ratifying the wording before that reading is ruled fixes the wording on a reading the record may yet diverge from.

On the three facts: The frontmatter recommendation (adopts hexis-first, ratified, moderate) states one class and one value and the pin is current; moderate is right because the reason is the AI's reading of a text the author has not read. What is missing from the facts is that what is ratified here is one clause of another node's answer, and that the fence's claim about knowledge-store's `defines` is not true of the record as it stands.

Strongest counter-argument (moderate): Purpose is the onboarding entry point and the README's source, and leading with a Greek term the browser cannot link spends a newcomer's attention on vocabulary rather than on the claim. The apposition the recommendation keeps does teach the word where it stands, which mitigates it; the deeper cost is that the precision bought is the AI's reading of a text the author has not read, on a node whose own reading has a strong pending alternative saying the mapping fails. The order the page had — 'a knowledge store, a projection of its author's hexis' — asserts less and loses nothing the record can currently support.

The session's reply: Forward accepted. The fence's claim that knowledge-store's defines carries hexis is verified false today and is left to the define-hexis alternative on knowledge-store, since adding the term changes that node's standing text; the coupling with purpose is carried by the ruling order.

### Frontier finding, 2026-09-03

Kind: placement.

Authority holds that 'a ratified stamp whose ruling is not in the record is invalid', and quotes rules on what that requires. Measured against the graph as it now stands: eleven recommendation fences in this batch carry `class: ratified`, and eight of them quote no ruling of any date anywhere in the fence — purpose, hexis, namespaces, projection, traditions-home, forms, second-stop and purpose-criteria — while three do: rationale-edge, quotes and rejected. Separately, twenty-three of the sixty-eight nodes carry no '## Disposition' section at all (`validate.mjs` reports 'ok: 68 nodes'; the count of nodes with no such section is 23), among them evaluation, persistence, legacy, validation-order, review, recording, forms, traditions-home, purpose-criteria, second-stop and all three public nodes. Quotes' own recommended answer unbars them in one clause — 'the ruling a stamp requires is the one the author gives at that sitting, quoted then; words the author said earlier are the ground a draft rests on and bar no stamp' — so the whole question of whether eight fences and twenty-three nodes can carry a ratified stamp turns on a node that is itself unruled and in this batch. The counts recorded on the batch's own findings are stale against the graph: 'twenty-two of the sixty-two nodes' was measured when the graph held 62.

Also named: commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/forms, commons.systems/disposition-graph/second-stop, commons.systems/disposition-graph/purpose-criteria.

Proposed: Quotes is the survivor and is ruled first among the nodes of this batch, after the periagogic sitting on public/agency that every one of them descends from. Nothing in the eight fences need change before that ruling, because quotes' recommended answer sanctions them; what must not happen is that any of the eight is recorded with a ratified stamp before quotes is ruled, since under the losing option each such stamp is invalid on landing. Quotes' own facts should state the measured size of the bar at the moment of ruling rather than a count fixed in prose, since the count has already moved once.

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `fence-carries-the-ruling` (source review, 2026-09-03).
