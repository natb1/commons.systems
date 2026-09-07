---
question: Does the web-routing tradition support addressing every node of the browser?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 959920e40b4beda31e84fb1a01067d695f1112ed
  against: "The reading adopts 'addresses do not change' and the record then declares two exceptions to it: the public graph's prefix rewrite, now recorded, and the framed viewer's inability to show or receive an address, recorded as a clause in the answer. A principle with two live exceptions, one of which the record imposes on itself and one of which is a stand-in with no liquidation condition anything reads, is adopted more strongly than the record can honour. The honest form is a relation of diverged with both exceptions named, which is what the sibling readings' `relation-diverged` alternatives propose for the same shape."
  survey:
    date: 2026-09-05
    of: 959920e40b4beda31e84fb1a01067d695f1112ed
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/88
      - name: narrow-fielding-citation
        source: review
        ref: "2026-09-03"
      - name: split-the-sources
        source: review
        ref: "2026-09-03"
      - name: divergence-as-shim
        source: review
        ref: "2026-09-03"
    recommends: standing
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Facts

### answer

#### standing

Supports.

**AI support.** Recorded at the author's direction on 2026-09-03 after the address was seen not to change on navigation in the framed viewer, and tested the same day: the viewer neither passes a fragment in nor reflects one out. Validated by the AI from its own knowledge of the sources; deferred until the author reads them.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Does the web-routing tradition support addressing every node of the browser?
form: reading
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Answer

Supports. The tradition holds that everything a reader can reach has an address, that moving between things changes the address shown, that an address reopens what it names, and that addresses do not change. The browser adopts all four: a node's address is its id, written into the page's fragment as the reader moves, read back when the reader arrives by it, and stable because ids are import paths. One divergence is the record's own: the public graph's ids are rewritten by prefix when it moves to natb1.com, and the namespaces node's shim carries the redirect obligation that principle imposes. One divergence is imposed by the host and not chosen: a page framed by a viewer can neither show its address in the viewer's own bar nor receive one through it, so until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view.
```

#### narrow-fielding-citation

The source field is rewritten so that Fielding chapter 5 is cited for the principle of identification by address only, and the fragment mechanism is cited to the HTML Living Standard's History interface and fragment navigation. A fragment is resolved client-side and is never seen by a server, so citing Fielding for a fragment scheme is loose. The session accepted the narrowing twice and the frontmatter still lists Fielding first among four sources unchanged.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Does the web-routing tradition support addressing every node of the browser?
form: reading
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Answer

The source field is rewritten so that Fielding chapter 5 is cited for the principle of identification by address only, and the fragment mechanism is cited to the HTML Living Standard's History interface and fragment navigation. A fragment is resolved client-side and is never seen by a server, so citing Fielding for a fragment scheme is loose. The session accepted the narrowing twice and the frontmatter still lists Fielding first among four sources unchanged.
```

#### split-the-sources

The node's four sources under one relation of adopted are split into separate readings, or the answer states that the single relation covers the group. Readings speaks of a reading's source, locus and relation in the singular, so if one of the four were later diverged from, one relation could not say so.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Does the web-routing tradition support addressing every node of the browser?
form: reading
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Answer

The node's four sources under one relation of adopted are split into separate readings, or the answer states that the single relation covers the group. Readings speaks of a reading's source, locus and relation in the singular, so if one of the four were later diverged from, one relation could not say so.
```

#### divergence-as-shim

The host's divergence, that a framed page can neither show nor receive its address so the page keeps the reader's place itself, leaves this answer and becomes part of projection's browser shim with a liquidation condition. As a clause in an answer it is a stand-in for an unmade materialization that the frontier cannot read, which transience makes a shim.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Does the web-routing tradition support addressing every node of the browser?
form: reading
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
bears:
  - fact: answer
    option: standing
    relation: adopted
---

## Answer

The host's divergence, that a framed page can neither show nor receive its address so the page keeps the reader's place itself, leaves this answer and becomes part of projection's browser shim with a liquidation condition. As a clause in an answer it is a stand-in for an unmade materialization that the frontier cannot read, which transience makes a shim.
```

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified applied since the last review: the answer now records the record's own divergence — 'the public graph's ids are rewritten by prefix when it moves to natb1.com, and the namespaces node's shim carries the redirect obligation that principle imposes' — and namespaces' shim carries the redirect clause. The unrecorded conflict the counter-argument named is closed on both sides.
- Frontmatter `source` still lists Fielding chapter 5 first among four sources under one `relation: adopted`. A fragment is resolved client-side and is never seen by a server, so citing Fielding for a fragment scheme is loose; the session accepted the narrowing twice and the field is unchanged. The `narrow-fielding-citation` alternative is the vehicle.
- Four sources under one relation: readings speaks of a reading's source, locus and relation in the singular, so if one of the four were later diverged from, one relation could not say so. The `split-the-sources` alternative is the vehicle and the session left it to the sitting.
- Answer, last clause: 'until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view'. This is a stand-in for a materialization not yet made, which transience makes a shim with a liquidation condition; here it is a clause in an answer that the frontier cannot read. Verified that projection's browser shim's liquidation names the publication but not this divergence. The `divergence-as-shim` alternative is the vehicle and it changes projection's shim, which projection does not carry.

On the three facts: The frontmatter recommendation (adopts standing, delegated, moderate) states one class and one value and the pin is current; delegated is the class readings' rule requires for a source the author has not read, and this node is one of the four corrected. The prose Facts line still says 'authority deferred until the author reads the sources', which names a third class beside the recommendation's. Persistence standing follows from the node's shape, though the framed-viewer clause is a shim in all but name.

Strongest counter-argument (moderate): The reading adopts 'addresses do not change' and the record then declares two exceptions to it: the public graph's prefix rewrite, now recorded, and the framed viewer's inability to show or receive an address, recorded as a clause in the answer. A principle with two live exceptions, one of which the record imposes on itself and one of which is a stand-in with no liquidation condition anything reads, is adopted more strongly than the record can honour. The honest form is a relation of diverged with both exceptions named, which is what the sibling readings' `relation-diverged` alternatives propose for the same shape.

The session's reply: Forward accepted. The Fielding narrowing and the source split stay as pending alternatives; the framed-viewer clause is accepted as a stand-in the frontier cannot read, for the author.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Alternatives discharged, 2026-09-03

At the clean-context review of 2026-09-03 the session struck the alternatives the record had already discharged: `delegated-not-ratified` dropped, the recommendation already reads delegated, as readings' rule requires.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (moderate): The reading adopts four principles and then breaks the fourth twice in the same paragraph: once by the record's own prefix rewrite when the public graph moves, and once by the host, which cannot give a framed page an address. A principle adopted with both of its known applications recorded as divergences has not been adopted in any sense that binds a future decision. What the tradition would actually say here is that a record whose ids are import paths and whose public half is going to be re-prefixed has not yet chosen its addressing scheme, and that is `namespaces`' question, unruled.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/web-routing stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-03/88, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `narrow-fielding-citation`, `split-the-sources`, `divergence-as-shim`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `b2f24269ce14ca0e05593e53ba7d04ca2a21807f` is re-computed for the encoding as `959920e40b4beda31e84fb1a01067d695f1112ed`; nothing it read changed. The survey's pin `b2f24269ce14ca0e05593e53ba7d04ca2a21807f` is re-computed for the encoding as `959920e40b4beda31e84fb1a01067d695f1112ed`; nothing it read changed.
