---
question: Who is this repository for?
stage: maieutic
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: e666864cb9bb53bfe89acec22f745c3eadbe078e
  against: "Pruning removes the only node whose question is who the repository is for, and purpose answers it in one subordinate clause that purpose-criteria now recommends leaving permanently unguarded. The requirements tradition the record adopts does state the intended audience inside the purpose section, so the prune is well grounded; the residue is that the audience question was where coverage's survey found the most divergence, and after the prune it can be re-asked only at a periagogic sitting the record has not scheduled."
  survey:
    date: 2026-09-07
    of: e666864cb9bb53bfe89acec22f745c3eadbe078e
    commit: edc5af91d942319c12174309e388a244de61fa52
    text:
      question: "136d28621cb313f0bc01f8b440ff150fb0b13039e9bdbe4a33ad70e0c4e4fb7a"
      answer: "7870cc37ea1913d879896909827f5b010233bb18a53799863d641b54eaed1090"
      options: "2a1a79ebb57ef9c3acee38edab353475409398d50ec92728aecff5955d2efeb7"
      rivals: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      words: "97d39ed184127ca320bbed08d884327b1ed7ebf0fdf84d05fb6bc558c7fdf6d7"
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
        supports:
          - words/2026-09-02/2
    recommends: standing
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: prune
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/purpose
---

## Facts

### answer

#### standing

Humans who want to manage the alignment of long-horizon AI agent workflows, or software factories, by something like spec-driven development, and who may arrive here by way of an AI tasked with that goal.

**AI support.** The author's words, 2026-09-02. Purpose, scope, audience, and definitions are the first four things a requirements specification states, in that order, and the onboarding walk of this graph follows the same order (the reading under the purpose node). That the audience may arrive via an AI is why the onboarding pages must be legible to a model as well as to a person: plain statements, defined vocabulary, and stable ids.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Who is this repository for?
form: rule
under:
  - commons.systems/disposition-graph/purpose
---

## Answer

Humans who want to manage the alignment of long-horizon AI agent workflows, or software factories, by something like spec-driven development, and who may arrive here by way of an AI tasked with that goal. Everything onboarding-facing is written for them: the README, the graph browser's opening pages, the repository's description and discovery tags.
```

### existence

Prune: in the author's own words, the question is handled by the purpose node already and can be pruned. Purpose states its readers, as the requirements tradition states them inside its purpose section; the five-audience finding moves to coverage, which carries the author's words on the audience verbatim; and projection no longer names audience as a source of the description and tags. The coverage finding of 2026-09-03 verified that those words are carried verbatim on both audience and coverage, so one disposition is answered twice while audience still stands at the review stage recommending a ratified answer of its own, and proposes the double answer be resolved in coverage's favour. Its persistence is 'not recorded', naming purpose and coverage as the destinations. Raised on commons.systems/disposition-graph/scope.

## Account


The incumbent record addresses at least five audiences, and this answer names one. For the author to rule on with the scope node: practitioners forking the harness into their own repository (the README's runbook, the fork template, the separability audit); the author alone (the morning brief); prospective consulting clients (the public site's About page); the general public downloading a stand-alone plugin (the budget listing); and an unspecified future collaborator (the brand voice guide). Either the answer above covers them by saying the others are served through the primary audience's tooling, or the excluded ones are named and their surfaces become unsupported implementation at the swap.

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified: the prune's destination is now coverage, not scope, and coverage carries the author's words on the audience verbatim, so the '## Disposition' quotation survives the prune. The earlier stale cross-reference is resolved.
- Persistence is 'not recorded', naming purpose and coverage as the destinations — which is right for a node being deleted and is the only node in the batch whose persistence is anything but standing. Nothing else in the record depends on this node: projection's fence now names purpose alone as the source of the README, description and tags.
- The prune leaves the record with no node whose question is 'Who is this repository for?', and coverage — where the question goes — stands at the periagogic stage with two AI-drafted alternatives and no author account. The prune is the author's own word, so this is an ordering note rather than an objection: after the prune the audience question is answerable only through a periagogic sitting on coverage.

On the three facts: The frontmatter recommendation (adopts prune, ratified, low) is right: the author asked for the prune in their own words, quoted on the node with a date, so this is the one node in the batch whose ratified stamp already has its ruling in the record. Persistence 'not recorded' with two named destinations is correct for a deletion and follows from the node's shape.

Strongest counter-argument (weak): Pruning removes the only node whose question is who the repository is for, and purpose answers it in one subordinate clause that purpose-criteria now recommends leaving permanently unguarded. The requirements tradition the record adopts does state the intended audience inside the purpose section, so the prune is well grounded; the residue is that the audience question was where coverage's survey found the most divergence, and after the prune it can be re-asked only at a periagogic sitting the record has not scheduled.

The session's reply: Forward accepted. The prune is the author's own word; the ordering note that the audience question returns at coverage's periagogic sitting is accepted.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The answer duplicates `commons.systems/disposition-graph/purpose`'s third sentence: purpose's answer reads "Its intended readers are humans who want that, and who may arrive here by way of an AI tasked with the same goal", and this node's answer restates it. The `existence` fact recommends `prune` and names no survivor for the sentence, so the prune is a fold whose destination is unrecorded and, if taken as written, would delete text that has to survive somewhere. The independence test of `probe-or-node` reaches this node: its single answer option repeats the parent's sentence, and it would be pruned the moment purpose's recommendation moved. Recorded as the `decomposition` finding.
- The answer fact carries exactly one option, `standing`. `commons.systems/disposition-graph/viable-options` says a fact carries "a list of viable options, possibly one", so this is well formed, but a node recommended for prune whose answer fact was never given an alternative is a node no dialectic has touched.

Strongest counter-argument (moderate): The node asks "Who is this repository for?" and answers it with a sentence `purpose` already carries, and its own existence fact recommends prune. The strongest case against the answer standing is therefore that the answer should not be here at all: keeping a node whose whole content is duplicated one level up is the update anomaly the `codd-update-anomaly` reading names, and the record has already had to correct one such duplicate this week. What survives the prune is the enumeration of onboarding surfaces — README, browser opening pages, description, discovery tags — and that belongs to `projection` or `self-documentation`, not to a node about audience.

### Frontier finding, 2026-09-05

Kind: decomposition.

The independence test of `commons.systems/disposition-graph/probe-or-node`, run across the judged set and reported under this kind as `frontier-consistency`'s sixteenth validation prescribes, finds two nodes and no more; readings are exempt by construction. `commons.systems/disposition-graph/hexis` asks "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?": its only possible answer is a reading of `purpose`'s, its answer options `hexis-first` and `knowledge-store-first` are the two orderings of one of purpose's sentences, `knowledge-store-first` already stands as an option on purpose's own answer fact sourced to this node, and it would be pruned the moment purpose's recommendation moved. `commons.systems/disposition-graph/audience` asks "Who is this repository for?": purpose's answer already carries "Its intended readers are humans who want that, and who may arrive here by way of an AI tasked with the same goal", this node's answer restates it, its answer fact carries the single option `standing`, and it too would fall with a move on purpose. Both nodes already recommend `prune` on their existence facts, so the test confirms a judgment the record has reached and supplies the reason it was missing. `commons.systems/disposition-graph/rejected`'s answer states the principle: "An option is not a page: an answer that was not taken has no standing and earns no node of its own." A third node was tested and survives: `commons.systems/disposition-graph/second-stop`'s three answer options are all edits to `model`, which has the same shape, but its question — what a newcomer reads after purpose — is not a reading of `model`'s question, and its existence fact recommends `keep`, so it is reported in its own node entry and not here. `commons.systems/disposition-graph/which-facts-are-listed` was tested and survives on its own account, which reaches `dialogue`'s reserved-four rule and not only the parent's rendering.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/second-stop.

Proposed: Record the independence test as the reason on each existence fact's `prune` option, on `hexis` and on `audience`, and let the author rule the prune at each node's own row, which is what `probe-or-node`'s answer prescribes for a node already standing. Before `audience` is pruned, its surviving content is named: the sentence itself is already in `purpose`, and the enumeration of onboarding surfaces — README, browser opening pages, repository description, discovery tags — belongs to `projection` or `self-documentation` and moves there rather than being deleted with the node. `hexis` needs no survivor: `purpose` already carries its content as the option `knowledge-store-first`.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/audience stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-02/2, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The draft review's pin `976f4e45cbef5225580dbdc4431b57f47978e215` is re-computed for the encoding as `3bbe247145845ab8e9e2e89b26bd76be2be09839`; nothing it read changed. The survey's pin `976f4e45cbef5225580dbdc4431b57f47978e215` is re-computed for the encoding as `3bbe247145845ab8e9e2e89b26bd76be2be09839`; nothing it read changed.
