---
question: How is the record read?
stage: review
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: d83b91ee4a1a885cca639b03a3227acecda335bd
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-02
boost: 5
under:
  - commons.systems/disposition-graph/model
defines:
  - projection
  - graph browser
shims:
  - artifact: the graph browser published as the private page https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933, regenerated from the record each round
    for: the human projection this node names
    liquidation: the browser is recorded as a node with its published address, and the page is published from the implementation ref
    declared: 2026-09-02
---
## Disposition

The author, 2026-09-02:
> I do not like how the artifact UI has "how to read this" and "vocabulary" sections. These do not seem to be materialized from the graph and so are prone to drift. "how to read this" as well as vocabulary should follow naturally from the onboarding progression of graph review.

The author, 2026-09-02:
> The artifact does not need to track bootstrapping concerns - those are transient concerns managed by the AI and do not need to be included in greenfield documentation.

The author, 2026-09-02:
> An authority section projected into the documentation (with notes on pending ratification for deferred authority) would make more sense than a "rejected" section which seems ad-hoc. Notes on deferred ratification could also feed the `/align` dialogue.

The author, 2026-09-02:
> Projecting "cites" relationships will aid onboarding navigation.

The author, 2026-09-03:
> general disposition is that all materialized implementation (including the browser) is a projection of the graph - anything not justified by the graph is subject to liquidation through reconciliation.

The author, 2026-09-03:
> The url in the artifact is not updated on navigation between nodes. This could cause navigation confusion. Record reference to web app routing tradition for disposition. Edit the browser shim to reconcile the disposition.

The author, 2026-09-03:
> "Tier" (as in global-tier) needs a disposition. As a disposition references in the projected documentation must be hyperlinked.

## Answer

Through projections, never by opening node files, except in alignment sessions. The graph browser is the human projection: one page that renders every node lazily, opens on the purpose node, links every defined term to the node that defines it, and sets readings of tradition apart from the answers they ground. It shows no un-aligned disposition, a node with no answer; every other unanswered node it shows as the draft it is, with its stage, and the alignment page, the projection of the open dialogue that the growth node describes, lists every unanswered node, of both kinds, for the author's ruling. Every node has an address, its id, which the browser writes as the reader moves and reopens when the reader arrives by it; the page keeps the reader's place and shows the address of the node in view, because a viewer that frames the page cannot show it. The README on the main branch is a projection of the purpose node, and the repository's description and discovery tags are projections of the purpose and audience nodes. An implementation session never reads the graph: the global-tier rules it works under are materialized into the repository's rules, the ancestry of the node it serves is materialized into its worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit, and the orientation page it reads first, `CLAUDE.md`, is projected from the purpose node and this one; what a session loads and where each part comes from is the session-context node under this one. Such a session writes back only through narrow verbs, propose, answer as deferred, record evidence.

## Rationale

The author's ruling of 2026-09-02 that bite sessions read projections, not the worktree. It keeps context focused, keeps legacy vocabulary out of working sessions, and makes the graph commit a session read from a pinned fact. The address rule was recorded at the author's direction on 2026-09-03, after the address was seen not to change on navigation in the framed viewer; the routing tradition is the reading under this node. The author, 2026-09-03: "The url in the artifact is not updated on navigation between nodes. This could cause navigation confusion. Record reference to web app routing tradition for disposition. Edit the browser shim to reconcile the disposition." And, the same day, that unanswered nodes are hidden from the browser and listed by the alignment page, quoted on the transience node. A hosted README cannot embed a live page, so the README renders the purpose page statically or links the browser at the purpose node; that bite on the main branch is unbuilt work, not a disposition.


## Draft

```markdown
---
question: How is the record read?
form: rule
authority:
  class: ratified
  by: Nathan Buesgens
  date: <the date of the ruling>
under:
  - commons.systems/disposition-graph/model
defines:
  - projection
  - graph browser
shims:
  - artifact: the graph browser published as the private page https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933, regenerated from the record each round
    for: the human projection this node names
    liquidation: the browser is recorded as a node with its published address, and the page is published from the implementation ref
    declared: 2026-09-02
---
## Answer

Through projections, never by opening node files, except in alignment sessions. The graph browser is the human projection, and it states nothing of its own: one page that renders every node lazily and opens on the purpose node, each page showing the question, the answer, the criteria or the word unguarded, the readings under the node set apart from the answer they ground, the nodes it cites and the nodes that cite it, and an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected, and, for a deferred node, what is pending for the author. It shows no un-aligned disposition, a node with no answer; every other unanswered node it shows as the draft it is, with its stage, and the alignment page, the projection of the open dialogue that the growth node describes, lists every unanswered node, of both kinds, for the author's ruling. Every defined term and every tradition's name links to the node that defines it. Every node has an address, its id, which the browser writes as the reader moves and reopens when the reader arrives by it; the page keeps the reader's place and shows the address of the node in view, because a viewer that frames the page cannot show it. The README on the main branch, the repository's description, and its discovery tags are projections of the purpose node. An implementation session never reads the graph: the global-tier rules it works under are materialized into the repository's rules, the ancestry of the node it serves is materialized into its worktree's `CLAUDE.local.md` at provisioning, pinned at a graph commit, and the orientation page it reads first, `CLAUDE.md`, is projected from the purpose node and this one; what a session loads and where each part comes from is the session-context node under this one. Such a session writes back only through narrow verbs, propose, answer as deferred, record evidence.

## Rationale

The author's ruling of 2026-09-02 that bite sessions read projections, not the worktree, and of the same date that the browser must carry nothing the graph does not, since hand-written orientation and vocabulary drift and the onboarding walk is the orientation. Rejected: a how-to-read page and a vocabulary page in the browser; a rejected-alternatives section apart from authority, because what was rejected is part of how the answer came to stand.
```

## Proposal

### Sitting on purpose, 2026-09-03

**The projection node, whole; the browser states nothing of its own**

Every node has an address and the page keeps the reader's place (recorded today at the author's direction, deferred; the framed viewer cannot show or receive the address, which the reading under this node records as the host's divergence). Every field name and value on a page links to its defining node (q15). The browser states nothing of its own; each page shows the question, the answer, the criteria or the word unguarded, the readings under the node, the nodes it cites and that cite it, and an authority section projected from the stamp, the ruling, the rejected alternatives, and what is pending for a deferred node. Every defined term and every tradition name links. The README, description, and tags project from purpose alone, since audience is pruned. The session-context part is unchanged. The browser shim declared today stays.

Facts: authority ratified; boldness moderate; persistence standing.

Rejected:
- Keep a rejected-alternatives section apart from authority. — What was rejected is part of how the answer came to stand, and the author found the separate section ad hoc.

Depends on: `instruments`, `readings`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer drops the sentence the current node carries on the author's own direction of 2026-09-03: 'It shows no un-aligned disposition and nothing of an open sitting; those are listed by the alignment page.' The author's words are quoted on transience: 'Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact.' The removal is not announced. Suggested edit: restore the sentence.
- Draft Answer: 'the nodes it cites and the nodes that cite it.' No node carries a cites field and the schema has none, so the projection is vacuous today. The author asked for it ('Projecting cites relationships will aid onboarding navigation'), so it should be presented as owed work, not as a standing answer already met.
- Draft Answer: 'and so does every field name and value on a page' presumes the recommended option on tier (q15), which is not in 'Depends on'. At least fifteen field names and sub-keys in current use (defines, tier, source, relation, kind, ref, note, class, by, date, artifact, for, declared, criteria, cites) are named by no node's defines, so the rule cannot be met as written.
- Draft Answer: 'projections of the purpose node' alone presumes the audience prune, which is not in 'Depends on'.

On the three facts: Ratified, moderate boldness, standing is right for the browser rule the author stated, and the browser shim should be named among the facts with its liquidation condition. The field-link sentence is contingent on tier and must be presented as such.

Strongest counter-argument (weak): A browser that states nothing of its own is only as navigable as the node text, and the two surfaces the author had it remove, how-to-read and vocabulary, were the affordances a newcomer used. The record's answer is that the onboarding walk is the orientation, which is sound, but the walk is currently one 816-word growth answer and a model node still being rewritten. Worth one line: the rule is right and the walk is not yet good enough to carry it alone.

### Clean-context review of the amendment, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, the author's words, and the amendment named in the brief, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The amendment is not carried into the node's own draft. The Proposal's 'Proposed text' still has no sentence about un-aligned dispositions or stages at all — the omission the previous clean-context review flagged ('Draft Answer drops the sentence the current node carries on the author's own direction of 2026-09-03 ... Suggested edit: restore the sentence'). The amendment fixes the node and leaves the draft as it was, and since 'as shown' means the draft, a confirmation would delete the author's own direction of 2026-09-03 from the answer. This is the sharpest defect among the four amendments. Suggested edit: put the amended sentence into the draft before the author rules.
- Amended sentence, 'with its stage': the browser does not render stage. The string does not occur in packages/disposition/browser-template.html; the page's pill comes from STATUS_WORD, which has ratified, delegated, deferred, proposal and un-aligned and no stage. The node's browser shim's liquidation condition does not cover it either, so nothing will surface the gap. Suggested edit: state it as owed, or add it to the shim.
- Amended sentence, 'It shows no un-aligned disposition, a node with no answer': verified against the implementation. excludeUnaligned drops nodes whose derived status is 'unaligned', and deriveStatus returns that only when there is no '## Answer'. Accurate as written, and it is the right test — the same one transience and the validator use.
- Amended sentence, 'lists them all for the author's ruling': the nearest antecedent is 'every other unanswered node', while the intended referent is both kinds. Suggested edit: 'lists every unanswered node, of both kinds, for the author's ruling.'

On the three facts: The Facts line ('authority ratified; boldness moderate; persistence standing') predates the amendment, does not mention it, and still omits the browser shim, which the previous review already asked for. The amended sentence is the AI's reading of an author ruling it partly reverses, so it is moderate to high boldness and must be presented to the author as a change to what they said, not as a restatement of it.

Strongest counter-argument (strong): The amendment reverses the author's ruling while appearing to record it. The author said 'Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact' (quoted on transience); the record now hides only the subset with no '## Answer' and shows the other fifty-odd as drafts. The reason given on unanswered — that hiding them all 'would empty the browser of the record it documents' — is a good argument that the ruling was made under a narrower sense of 'unanswered' than the one adopted hours later. But the effect is that the browser, which this node calls the record's own documentation and the newcomer's first surface, now presents fifty-odd unratified AI drafts as the record, with no stage shown to mark them as drafts, because the stage this very sentence promises is not rendered. Until the author rules, their literal instruction is the safer reading.

The session's reply: The counter-argument is the strongest reading of the author's earlier words, and the author rules between the two. The session's reading: the ruling that unanswered nodes are hidden was made when unanswered meant a node with no answer, before the author classified every node unanswered the same day with the instruction that nothing of the encoding be lost, and self-documentation through the browser stands second in the author's order; hiding fifty-odd nodes would leave the browser with nothing to document. The stage the sentence promises is rendered by the browser since the same afternoon, so a draft shows as a draft. Accepted: the draft text carries the amended sentence, and it says every unanswered node of both kinds is listed for the ruling.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer: 'and so does every field name and value on a page'. This is tier's recommended option, which tier's own reviewer kicked back to the maieutic stage and whose session reply withdrew it: 'The cites edge is defined by no node, and the recommendation that rested on it is withdrawn.' The clause survives here, on a node at the ruling stage. Verified unmeetable today: at least fifteen field names and sub-keys in use (defines, tier, source, relation, kind, ref, note, class, by, date, artifact, for, liquidation, criteria, cites) are named by no node's defines. Suggested edit: strike the clause.
- Draft Answer: 'the nodes it cites and the nodes that cite it'. Verified: 'cites' is a schema key (FRONTMATTER_KEYS in read.mjs) and citesSection exists in browser-template.html, but no node in the graph carries a cites field, so the projection is vacuous. The author asked for it, so it is owed work rather than a standing answer already met.
- Draft Answer: 'each page showing the question, the answer, the criteria or the word unguarded ... and an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected'. Verified against packages/disposition/browser-template.html: neither 'criteria' nor 'unguarded' occurs, and there is no authority section; the page renders an instrument section, a cites section, and a '.rejected' block matched from a rationale heading (/^rejected\b/i at line 439). Three of the draft's four projection promises are unmaterialized and nothing on the node says so.
- The file ends with a bare 'null' on its own line, where the session's reply to the amendment review belongs. Four nodes share this defect (authority, growth, projection, transience). It parses as prose but reads as a serialization failure.

On the three facts: The frontmatter recommendation (ratified, moderate) is right. The prose Facts line ('authority ratified; boldness moderate; persistence standing') predates the amendment, omits the browser shim with its liquidation condition, which growth's presentation rule requires and which two previous reviews asked for, and does not mark the field-link clause as resting on tier, which was withdrawn.

Strongest counter-argument (moderate): The amendment reverses the author's literal instruction while appearing to record it: the author said unanswered nodes are hidden from the browser and listed by the alignment page, and the record now hides only the twenty with no '## Answer' and shows the other forty-two as drafts. The session's defence — that the ruling was made when unanswered meant a node with no answer, and that hiding fifty-odd nodes would empty the browser — is sound, and the stage is now genuinely rendered (browser-template.html line 622 builds 'unanswered · <stage>'). So the reversal is disclosed and mitigated; what remains is that the author should be told this is a change to what they said, which the Facts line still does not do.

The session's reply: Validated. Amended tonight: the clause linking every field name and value is struck, since tier's recommendation was withdrawn; the bare null is gone. Rejected: the cites projection is not owed work but an implemented edge no node yet uses; it fills as nodes cite. Accepted: the criteria, the word unguarded, and the authority section are promised by the draft and not rendered by the browser; they are owed by the browser shim declared on this node, whose liquidation names them at the sitting. On the counter-argument: the amendment narrows the author's earlier words on hiding unanswered nodes, the sitting says so plainly, and the stage is rendered. Stage review: the draft changed.

### Frontier finding, 2026-09-03

Kind: contradiction.

Projection's draft Answer: 'Every defined term and every tradition's name links to the node that defines it, and so does every field name and value on a page.' The second clause is tier's recommended option, which tier's reviewer kicked back and whose session reply withdrew it: 'The cites edge is defined by no node, and the recommendation that rested on it is withdrawn.' Verified unmeetable: at least fifteen field names and sub-keys in use are named by no node's defines, and no node carries a 'cites' field although the schema and the browser both support one. Projection stands at the ruling stage carrying a clause the record has withdrawn at the maieutic stage.

Also named: commons.systems/disposition-graph/tier.

Proposed: Tier is the survivor of the question and it is unanswered. Projection's draft strikes 'and so does every field name and value on a page' and keeps the defined-term and tradition-name links, which are the author's own request and are implemented. The field-link rule returns with tier whenever tier is answered.

### Frontier finding, 2026-09-03

Kind: supersession.

The author, quoted on transience: 'Unanswered nodes are hidden from the browser artifact and listed by the alignment artifact.' Later the same day the author classified every disposition as unanswered ('Classify all dispositions as unanswered ... There should be no loss of disposition encoding'), which makes the earlier words, applied literally, empty the browser. Projection's amendment records the reconciliation and its counter-argument names it squarely; transience still carries the earlier rule as its own ('hidden from the browser and listed by the alignment page') with no note that its scope was narrowed by the later ruling; unanswered argues the narrowing in its rationale under 'Rejected'. The superseded words are answered by transience and the superseding words by two other nodes.

Also named: commons.systems/disposition-graph/transience, commons.systems/disposition-graph/unanswered.

Proposed: Unanswered is the survivor of the classification and projection of the browser rule. Transience's un-aligned paragraph cites unanswered for the status and projection for what the browser shows, and drops its own restatement of the hiding rule; projection's answer keeps the amended sentence and adds one clause saying it narrows the author's earlier words, which is what projection's own counter-argument asks for and what the author must rule on.

### Frontier finding, 2026-09-03

Kind: redundancy.

Form-vocabulary's proposal is 'No new nodes. Each term is defined by the node that owns it, through the defines field ... the term index links every use in prose to that node, and a term no node defines is not linked, which is how drift shows.' That is what readings' draft already says for traditions ('Prose reaches a tradition through the name it defines') and what projection's draft already says for terms ('Every defined term and every tradition's name links to the node that defines it'), and what the browser already implements. Form-vocabulary restates two other nodes' answers and adds one decision — that no node per form is created — which is a rejected alternative rather than a question.

Also named: commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/readings.

Proposed: Projection is the survivor for the linking rule and readings for the tradition rule. Form-vocabulary is folded into node's rationale as a rejected alternative ('one node per form, rejected because each would restate the definition its owning node already carries') and the node is pruned, which is what its own facts already say ('persistence not recorded'). The author's quote it carries is already carried verbatim on node.

### Frontier finding, 2026-09-03

Kind: coverage.

Three of projection's children are at the periagogic or maieutic stage holding author words that projection's own draft partly answers. Vocabulary-view holds 'technical repo vocabulary ... will need to be recorded on the onboarding path ... References to tradition also need to be clearly called out with appropriate layout', and projection's draft answers half of it ('Every defined term and every tradition's name links to the node that defines it'). Frontier-metrics holds the heading-metrics disposition, whose metrics 'are signals/instruments/criteria of some disposition' and would amend projection. Self-documentation holds the author's own placement of self-documentation as a section equal with scope, which scope's order field has already mapped to projection. Ruling projection settles parts of all three before their own dialogues have run.

Also named: commons.systems/disposition-graph/frontier-metrics, commons.systems/disposition-graph/vocabulary-view, commons.systems/disposition-graph/self-documentation.

Proposed: Rule projection with one clause saying which of the three questions it does not settle, or hold projection until self-documentation is answered, since that answer decides whether projection is the self-documentation section at all and scope's order field encodes the mapping. The cheapest sequence is: answer self-documentation (maieutic, one question to the author), then rule scope and projection together, then run the two periagogic sittings on frontier-metrics and vocabulary-view against a settled projection node.

### Frontier finding, 2026-09-03

Kind: coverage.

Four node files end with a bare 'null' on its own line, where a session's reply to a review belongs: authority, growth, projection and transience. On authority and transience the missing reply is to the amendment review, so four findings and a counter-argument stand unanswered on each, and the author would rule on a review nobody answered. The word parses as prose and passes the validator ('ok: 62 nodes'), so nothing catches it. Three of the four are among the record's most load-bearing nodes.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/growth, commons.systems/disposition-graph/transience.

Proposed: Write the four missing replies, or state on each that the review's findings are accepted, and strike the 'null'. The pattern is a serialization defect in whatever applied the reviews rather than four independent omissions, so the apply step should be checked: .claude/skills/align-review/apply.mjs is the script that writes replies, and a reply of JavaScript null being stringified into the file is the likely cause. Until it is fixed, every future review round will leave the same trace.
