---
question: Is each unit of a sitting its own skill?
stage: ruling
facts:
  - name: answer
    options:
      - name: a-skill-per-unit-kind
        source: ai
        ref: "2026-09-07"
        supports:
          - words/2026-09-07/10
      - name: surveys-under-one-skill
        source: ai
        ref: "2026-09-07"
      - name: brief-generator-without-skills
        source: ai
        ref: "2026-09-07"
      - name: one-generator-for-every-brief
        source: ai
        ref: "2026-09-07"
      - name: one-skill-with-the-kind-as-an-argument
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "the kinds take different arguments and return different output contracts, so by the analogy review-skills draws from delegation an invocation needing a second contract is two invocations"
      - name: ad-hoc-briefs-under-the-alignment-skill
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "the instructions live in gitignored scratch, where no projector and no reading can see them, and are rewritten every sitting"
      - name: skills-for-the-design-unit-only
        source: ai
        ref: "2026-09-07"
        status: passed
        reason: "a survey's contract decides what the design is given, so an uncodified survey is the same defect one step earlier"
      - name: the-package-first-and-the-skills-after
        source: review
        ref: "2026-09-07"
    recommends: a-skill-per-unit-kind
    boldness: moderate
    against: "The answer creates five more hand-written projections of nodes the projector cannot write, in a record whose own measurement of 2026-09-05 found two such files diverging from each other on the model rule within a day, and it does so while `hand-written-projection-drift`, minted from that measurement, stands at the periagogic stage with no answer; `brief-generator-without-skills` buys the substance the author's words ask for — the instructions leave gitignored scratch and enter the record, generated and not hand-written — at one artifact instead of six, and leaves the count and the names of the skills to be settled after the guard is known."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: low
    against: "The names this ruling fixes are cited by every sitting and every telemetry reading, and that a unit's instructions are codified rather than improvised is the author's own words; under a deferred class a later sitting's recommendation acts, so the family could be renamed or un-codified with the author asked only afterwards, at a frontier they may reach late. And the limb the recommendation rests on is the one `class-recommendation` cannot yet apply: its own probe `which-classes-of-decision-have-you-said` is open, so deferred is chosen because the record holds no enumeration of the classes the author has excused and not because it holds one that excludes this."
  - name: persistence
    options:
      - name: with the six shims
      - name: without them
    recommends: with the six shims
    boldness: low
    against: "The six artifacts project `decomposition`'s list of kinds as much as this node's division of them into skills, and a session that goes to `decomposition` to learn what units a sitting has would find no shim declared there."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: cb880309df7f02481f673294727e43ad417ba7ff
  commit: e6f0b87118fe9410668bf7f8eebef2e69c1ea305
  against: "No defect was found in what this node's own diff shows; the only residual risk is that the amendment's own account of what it did to `review-skills`, `session-context`, `class-recommendation` and `instruments` cannot be checked from this node's file alone, so if any of those four cross-node claims turns out false the amendment would be resting on an unverified premise the last reading had no chance to catch either."
  survey:
    date: 2026-09-07
    of: cb880309df7f02481f673294727e43ad417ba7ff
form: rule
under:
  - commons.systems/disposition-graph/decomposition
depends:
  - commons.systems/disposition-graph/review-skills#two-skills-one-package
---

## Facts

### answer

`a-skill-per-unit-kind` is recommended because it is the option that takes the
author's words as they stand — each subagent's instructions codified in a
skill — and because the record has already answered the same question once, for
the two readings, and answered it this way: `review-skills`' three-part shape,
the per-kind text in one `SKILL.md`, the mechanics in one workspace package,
and the instruction text common to every kind read from the nodes rather than
copied into the files. The division into kinds is `decomposition`'s and is
taken, not minted; the two-contracts test is the analogy `review-skills` draws
from `delegation` and is applied here in both directions, dividing the three
surveys from each other and collapsing the periagogic reading into two of
them; the package convention is `materialization`'s; the rule that the common
text is the node's is `session-context`'s; the shims and their liquidation are
`transience`'s. Moderate boldness: that a unit's instructions belong in a
skill is the author's words, and the count of skills, the names, the collapse
of the periagogic reading, the cut between the two brief generators, and the
placement of this question in a node of its own are the AI's, each on a rule
of the record. What rests on the AI's knowledge alone is the same reading of
the harness's convention `review-skills` names, that a skill is one directory
with one `SKILL.md` invoked by its name, which the repository's four skills
show and no node states.

#### a-skill-per-unit-kind

Each kind of unit `decomposition` names is one skill directory under
`.claude/skills/` with one `SKILL.md`, carrying only what is specific to its
kind; the mechanics of every unit's brief in one workspace package,
`packages/sitting-units/`; the instruction text common to every kind held in
no skill and filled into every brief from one fragment each; the two readings'
skills left exactly as `review-skills` decides them. Five skills are created,
`/align-decompose`, `/align-survey-record`, `/align-survey-tradition`,
`/align-survey-implementation` and `/align-design`, and two stand already.
Adopted by the recommendation and set out in the fence.

**AI support.** The author, 2026-09-07: "it sounds like recommended alignment subagents have extended beyond (or superceded) align-review and align-survey. If so, each subagent have its instructions codified in a skill. And if align-review or align-survey are superceded, they must be liquidated by reconciliation."

Why a node and not an option on `review-skills`. `review-skills` asks whether each reading of the clean-context review is its own skill, and its answer is about the two readings; the author's words reach every kind of unit a sitting launches. A text answering two questions is two nodes, as `node` says, and `probe-or-node`'s four tests each send this question to a node rather than to a probe or an option: a response of "delegated, do not ask me again" would make sense of it, which only a disposition can carry; the response moves recommendations on `decomposition`, on `review-skills` and on the shim `growth` declares for the alignment skill, which is doctrine reaching below one node; every later sitting, every projection of a skill and every reconciliation would read it after the ruling it moved; and its facts do not repeat its parent's, since `decomposition` decides what the units are and this node what carries their instructions. The dependency runs one way, from this node to `review-skills#two-skills-one-package`, and the option recorded there carries no reciprocal `depends`, because two nodes each waiting on the other is a queue that never opens.

Why a skill per kind, beyond the words. `delegation` divides delegated work by contract, and `review-skills` draws from it the analogy that an invocation needing a second contract is two invocations. Applied to the kinds `decomposition` names, it divides them: a decomposition takes the author's bundled words and returns a list of questions with their placement; a design takes a node and the facts that are its and returns options, a recommendation, a boldness, a case against and a fence; the three surveys read three different corpora and return three different shapes, one of them node-shaped readings. Applied the other way it collapses the periagogic reading into the record and implementation surveys, whose corpora it names, because the object is an argument and the contract is unchanged. The test is used in both directions on purpose: a discriminator that only ever multiplies is not a discriminator.

Why the instructions are the record's and not the sitting's. The measurement is the argument, and it prices a scratch directory the record does not keep, so it is pinned and dated rather than asserted: on 2026-09-07, at graph commit 2e1d5e44 and implementation commit cb0e02c6, `tmp/align/` held twenty unit briefs of 109,328 bytes beside one common fragment, every byte gitignored, twenty of the twenty carrying the string `state-changing` and eighteen the string `edit a node`, which are `delegation`'s two bounds restated by hand in brief after brief, and three reading the fragment. An earlier form of this sentence gave fifteen briefs at 77,297 bytes and the reading that checked it measured 74,659 the same day; that the figure cannot be re-taken, and moved twice while the sitting ran, is the argument and not an objection to it. Nothing there is projected from a node, so no reading can find a brief that contradicts the record and no projector can correct one; and none of it survives the sitting, so the next sitting writes it again and differently. That is `session-context`'s rule about a rule living only in a file, in its worst case, and it is what the author's words are about.

Why the common text is fragments and the per-kind text is the skill. `session-context` holds that a rule living only in a file is invisible, so no skill states a rule of its own and each cites the node; but a unit's reader is a subagent given a brief and the record and nothing else, so the primer, the bounds and the report contract must be in the brief, and one file each is the least that holds them until the generator writes them from the nodes. Only the essential common text is factored, which is the bound `the-wrong-abstraction` puts on factoring, already read under `review-skills`.

Why not one generator. The two generators do different jobs and share their common text, which is the distinction `information-hiding` draws and which the record already applied when it kept `apply.mjs` in the readings' package: a reading's brief carries the record, assembled under `review-cost`'s pointer rule, and a unit's brief carries a contract the sitting states. The stricter fold is on the fact and would decide an artifact `review-skills` names as its package's.

The greenfield lens was applied and it caught one thing. The incumbent's names were given no weight, and read as if from scratch the family of seven would be `/align-decompose`, `/align-survey-record`, `/align-survey-tradition`, `/align-survey-implementation`, `/align-design`, `/align-review` and `/align-survey-frontier`, in which no name is a prefix of another and each says its object; the incumbent `/align-survey` is the one name that does not, and the record already carries the vocabulary conflict behind it, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys. The rename is `review-skills`' to decide, since that node fixes the two names, and it is recorded there as the option `align-survey-renamed-for-the-family`; this answer does not depend on it and names the incumbent.

The traditions this answer leans on are the eight already standing as readings under `review-skills` — information hiding, the utility syntax convention, operation naming in telemetry, inspection roles, the multi-call binary and the façade, duplication of knowledge against duplication of text with Codd's update anomaly, literate programming with the content reference, and the wrong abstraction — each of which bears on this answer for the same reasons it bears there. No adoption is claimed here that a reading does not stand behind: the `bears` entries on this node's recommended option are owed from the alignment sitting and are not written by a design or by a reading, and until they are written this rationale names the readings and claims no relation the record cannot see.

**AI divergence.** The answer creates five more hand-written projections of nodes the projector cannot write, in a record whose own measurement of 2026-09-05 found two such files diverging from each other on the model rule within a day, and it does so while `hand-written-projection-drift`, minted from that measurement, stands at the periagogic stage with no answer; `brief-generator-without-skills` buys the substance the author's words ask for — the instructions leave gitignored scratch and enter the record, generated and not hand-written — at one artifact instead of six, and leaves the count and the names of the skills to be settled after the guard is known.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

Yes. Each kind of unit a sitting launches is one skill directory under `.claude/skills/` with one `SKILL.md`, invoked by its name, carrying only what is specific to its kind. `decomposition` names the kinds; this node names the skills that carry them: `/align-decompose`, the decomposition of a bundled disposition into the questions it asks; `/align-survey-record`, what the graph says on a question; `/align-survey-tradition`, the second evaluation, returning readings with their source, their locus and what each bears on; `/align-survey-implementation`, what exists and what a named artifact or command does; `/align-design`, the options on each fact, the recommendation with its boldness and its case against, and the draft text; and, standing already and untouched here, `/align-review`, the reading of one draft, and `/align-survey`, the survey of the frontier, which `review-skills` decides. Seven kinds and seven skills. What a ruling on this node binds is the five it creates: `review-skills` stands under `clean-context-review` and so under `recording`, not under this node, and authority only narrows on the way down, so a ruling here confers nothing on `/align-review` and `/align-survey` any more than a ruling there could confer the general rule — which is the objection this answer records against `two-skills-under-the-general-rule` in the other direction. The two readings' skills are named for the family's shape and are `review-skills`' to decide; the two nodes agree today, and neither governs the other. The author's words are that each subagent's instructions be codified in a skill, and what codified means is fixed by the record's own two rules: `session-context`, under which a rule living only in a file is invisible to the projector and to review, so no skill states a rule of its own; and `materialization`, under which every artifact is the projection of the node whose answer it carries, so each skill is a declared shim on the node it projects until the projector writes it.

The periagogic reading mints no skill. `decomposition`'s movement seam sends the periagogic object — the nodes a disposition would amend and the implementation their criteria point to — to a survey unit, and that object is the record survey's corpus together with the implementation survey's. The object a unit reads is its argument and not a second contract, so the periagogic reading is those two skills run over an object the sitting names, and the same test that divides the three surveys from each other collapses this one into them; a test that only ever multiplies is not a test. The reconciliation unit mints none either, and it is not a sitting's unit: its contract is the reconciliation skill's, which `work-loop` declares as a shim, and a sitting reconciling under the author's grant runs that contract with the bite named by the grant instead of derived from the frontier, which is a difference in how a bite is chosen and not in what the unit is. That a sitting launched three reconciliation units on briefs of its own on 2026-09-07 rather than through that skill is a divergence recorded on `work-loop` and not answered here.

What each `SKILL.md` carries is what is specific to its kind and nothing else, in the shape `review-skills` fixes for the two readings. The object of the unit and what its reader is given, as `decomposition`'s paragraph on the kind of analysis gives them, cited and restated in no part, since a copy of another node's sentence falls behind its source. The currency step: fetch `origin/disposition`, the nested worktree at it with a clean tree but for the sitting's own drafts, `node packages/disposition/validate.mjs disposition`, then the nodes the skill's shim notice names read at their current text, where a node differs from the file the node wins and the difference is recorded on it as an un-aligned disposition. The brief, one command, below. The launch: one subagent of type `general-purpose`, never a fork, at the model `decomposition` names for that kind by its relation and never by a harness name, and at the effort the brief states, told to read and follow the brief exactly, to write only the output file the brief names, and never to run state-changing git; relaunched once with the same brief on a failure, reported on a second with the sitting's stage unchanged. What the main thread does with the conclusion, which is `decomposition`'s integration and is never delegated: it reads the conclusion and never the context, validates what the unit returns at the loci the unit names, and writes the node. And the landing, which for every unit but the two readings is the sitting's own round at its next stage transition, as `checkpoint` says. Each skill's frontmatter carries `name` equal to its directory and a description, and no model's name, which is the harness's and the day's.

A unit's brief is written by a script and never by hand. `node packages/sitting-units/brief.mjs --kind <kind> --node <id> [--fact <name>…] --object <file> [--out <path>]` writes `tmp/align/<kind>-<slug>.brief.md` and names the unit's one output file. The generator fills three fragments into every kind's template: `brief-bounds.md`, the bounds `delegation` puts on a subagent, which are a bound of that node's answer and not sizing, as `delegation-bounds-and-sizing` divides them; `brief-record.md`, the primer on the record's encoding, facts, options, rulings, the derived class, boldness reversed, and what a node is; and `brief-report.md`, the report `decomposition` requires of every unit, the conclusion as data with the exact commands the unit ran and nothing of the unit's context. Each fragment exists in one file in this package, and only the essential common text is factored, since factoring what merely looks the same today re-creates the flag inside the fragment; whether the readings' package shares these files or keeps its own is `review-skills`' to rule, as the fifth paragraph says. None of these files exists yet: every artifact this answer names is declared a shim above and comes into being at the reconciliation this answer names, which lands with the ruling, so the shim rows are a declaration of what is being made and not a reference to what is missing. What is the sitting's own — which nodes the unit reads, the author's words it works from, which facts are its, and the form of its output — is the contract `decomposition` requires of every unit, and the sitting states it in the object file the generator names; the generator writes the frame and never guesses the contract.

The mechanics are code and live where `materialization` puts the graph's own tooling: one workspace package, `packages/sitting-units/`, named `@commons.systems/sitting-units` after the units it briefs, declared like every package by the root manifest's workspaces, holding `brief.mjs`, the five templates, the three fragments, the fixture graph and the tests the root manifest's test script runs, and importing the reader from `packages/disposition` by its workspace name. It is a second generator beside the two readings', deliberately: a reading's generator assembles a neighbourhood out of the graph under `review-cost`'s rule, deciding what is carried whole and what as a pointer, and a unit's generator fills a template with a contract the sitting states, and the two share their common text and not their job. What they share is the three fragments, which live in this package. Whether the readings' package fills `{{bounds}}` and `{{record}}` from here by workspace name, its own `brief-bounds.md` and `brief-record.md` deleted, so that each fragment exists in one file across both packages, is not this answer's to say: `review-skills`' fence names those two files as its package's, and this answer would be moving them on exactly the ground it refuses `one-generator-for-every-brief` two sentences on. It is recorded there as the option `fragments-move-to-the-units-package`, with this node as its source, for that node to rule; until it does, the two fragments stand in both packages and the duplication is this answer's cost and is stated as one. The stricter fold, one generator for every brief in the record, is on this node's answer fact as `one-generator-for-every-brief` and would move an artifact `review-skills`' fence names as its package's, which is that node's to rule and not this one's.

Drift, and what the codification does and does not buy. Six of the seven artifacts are hand-written projections of nodes the projector cannot yet write, declared as shims above, and codification does not make them drift-proof: it moves a unit's instructions out of gitignored scratch, where no projector and no reading can see them and where they are rewritten every sitting, into the record, where a shim notice says the node wins, the currency step reads the nodes at every invocation, and the survey's validations read each skill as an artifact. That is a check and not a construction, and what guards a hand-written projection in the interval between a shim's declaration and its liquidation is not this node's question: it is asked on `hand-written-projection-drift`, minted on 2026-09-05 from the measurement that two hand-written skills had diverged from each other within a day, and this answer multiplies the artifacts standing in that interval from four to nine, which is the cost the case against this recommendation names. What the five directories buy over the package and the generator alone is the harness's listing and the telemetry split, and the telemetry premise is the author's, which `review-skills` records as unverified in this repository; it is load-bearing here as it is there, and it carries the same condition rather than being inherited bare: `brief-generator-without-skills` is not passed over before the first per-skill usage reading the author can produce, an instrument the `instruments` node has yet to record, and on that reading either that option is passed over on evidence or this answer's count of skills is revisited. Skill reconciliation resolves the drift by construction at liquidation and not before, when the projector writes each skill from the nodes its shim notice names, as it writes the rules directory today, one file per node, regenerated whole, with a file it wrote and no node claims deleted.

What this costs, as a consequence and never as a reason. Created: five skill directories with one `SKILL.md` each; `packages/sitting-units/` with `package.json`, `brief.mjs`, the five templates `brief-decompose.md`, `brief-survey-record.md`, `brief-survey-tradition.md`, `brief-survey-implementation.md` and `brief-design.md`, the three fragments, a fixture graph and `brief.test.mjs`. Changed: nothing in `packages/clean-context-review/`, whose two fragments stay where `review-skills`' fence puts them until that node rules on `fragments-move-to-the-units-package`, so that `brief-bounds.md` and `brief-record.md` stand in two packages in the interim, which is a cost of this answer and is named as one; the alignment skill's list of a sitting's units, which names each kind's skill and stops carrying each kind's launch text, and its shim notice; the bullet of `CLAUDE.md` that names the skills; and `decomposition`'s sentence on how its answer is materialized, which is recorded there as an option and not written here. In the harness's listing the author sees seven `align-` skills where three stand today, and the telemetry reports seven populations where it reports one. Nothing is liquidated: neither review skill is superseded, both are invoked at the same two moments and by the same names, and the units this answer codifies are the other units `decomposition` already named.
```

#### surveys-under-one-skill

One skill for the three surveys, `/align-survey-unit <corpus> <node id>`, with
the corpus — the record, the traditions, the implementation — as its argument,
on the ground that all three report what is and never what should be, take the
same argument shape, and differ only in what they read and in the model they
run on. On the table because it is the honest rival to the recommended count:
the collapse of the periagogic reading into two survey skills is made on
exactly this reasoning, and a reader may hold that the reasoning does not stop
where the recommendation stops it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the three outputs are not one
contract. A tradition survey returns candidate readings with their source,
their locus and what each bears on, which are node-shaped and go to the
`readings` encoding; a record survey returns what the graph says with its
contradictions and its redundant seams; an implementation survey returns what
exists and what a named command does. A flag that replaces the output contract
fails the second limb of the utility-syntax test the record adopted on
`review-skills`, and one name would mix three populations of different cost in
the telemetry the author's words of 2026-09-04 asked to separate.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

One skill for the three surveys, `/align-survey-unit <corpus> <node id>`, with
the corpus — the record, the traditions, the implementation — as its argument,
on the ground that all three report what is and never what should be, take the
same argument shape, and differ only in what they read and in the model they
run on. On the table because it is the honest rival to the recommended count:
the collapse of the periagogic reading into two survey skills is made on
exactly this reasoning, and a reader may hold that the reasoning does not stop
where the recommendation stops it.
```

#### brief-generator-without-skills

The brief generator alone: `packages/sitting-units/brief.mjs` writes each
kind's brief from the nodes and the templates, and the launch stays where it
is, in the alignment skill's list of a sitting's units. No new skill directory
is created. On the table because it buys most of what the author's words are
about — the instructions leave gitignored scratch, stop being written by hand,
and become an artifact a node projects and a reading can read — at one new
artifact instead of six, and because it is the shape in which
`hand-written-projection-drift`'s open question is not multiplied by five
before it is answered.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the author's words say codified in a skill,
and the alignment skill would then carry seven launch paragraphs of seven
different contracts in one file, which is the one-file-many-contracts shape the
record's own two-contracts test rejects; the telemetry would report every unit
of every sitting under `/align`. That last count against it rests on the
author's premise that the harness's telemetry names a skill by its directory,
which `review-skills` records as unverified in this repository, so it is held
under the condition that node attached to the same premise: this option is not
passed over before the first per-skill usage reading the author can produce,
and on that reading either it is passed over on evidence or this node's count
of skills is revisited.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

The brief generator alone: `packages/sitting-units/brief.mjs` writes each
kind's brief from the nodes and the templates, and the launch stays where it
is, in the alignment skill's list of a sitting's units. No new skill directory
is created. On the table because it buys most of what the author's words are
about — the instructions leave gitignored scratch, stop being written by hand,
and become an artifact a node projects and a reading can read — at one new
artifact instead of six, and because it is the shape in which
`hand-written-projection-drift`'s open question is not multiplied by five
before it is answered.
```

#### one-generator-for-every-brief

The same as the recommendation except that one script writes every brief in
the record, a reading's and a unit's alike: `packages/clean-context-review/brief.mjs`
is folded into `packages/sitting-units/brief.mjs` and the reading skills call
it with their own templates. On the table because it is the strictest reading
of the author's question about drift and because two files named `brief.mjs`
in one repository invite the reader to think one of them is dead.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it:
the two do different jobs. A reading's generator assembles a neighbourhood out
of the graph under `review-cost`'s rule, deciding what is carried whole and
what as a pointer; a unit's generator fills a template with a contract the
sitting states. What they share is the fragments, and the recommendation shares
exactly those; folding the rest would put one job's rules inside the other's
file, which is the wrong abstraction the readings under `review-skills`
already name. It would also move an artifact `review-skills`' fence names as
its package's, which is that node's to rule.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

The same as the recommendation except that one script writes every brief in
the record, a reading's and a unit's alike: `packages/clean-context-review/brief.mjs`
is folded into `packages/sitting-units/brief.mjs` and the reading skills call
it with their own templates. On the table because it is the strictest reading
of the author's question about drift and because two files named `brief.mjs`
in one repository invite the reader to think one of them is dead.
```

#### one-skill-with-the-kind-as-an-argument

One skill, `/align-unit <kind> <node id>`, with the kind as its first
argument. What it would answer: yes, the instructions are codified, and one
skill carries every kind. Passed over on the record's own test, applied here as
`review-skills` applies it: the kinds take different arguments, a decomposition
taking the author's bundled words where a design takes a node and the facts
that are its, and they return different output contracts, a proposed list of
questions against a set of options with a recommendation and a fence. An
invocation needing a second contract is two invocations, and a flag that
replaces the output contract is a second command wearing a flag's name.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

One skill, `/align-unit <kind> <node id>`, with the kind as its first
argument. What it would answer: yes, the instructions are codified, and one
skill carries every kind. Passed over on the record's own test, applied here as
`review-skills` applies it: the kinds take different arguments, a decomposition
taking the author's bundled words where a design takes a node and the facts
that are its, and they return different output contracts, a proposed list of
questions against a set of options with a recommendation and a fence. An
invocation needing a second contract is two invocations, and a flag that
replaces the output contract is a second command wearing a flag's name.
```

#### ad-hoc-briefs-under-the-alignment-skill

The incumbent, standing: each unit is launched on a brief the sitting writes by
hand under `tmp/align/`, from the alignment skill's list of a sitting's units.
What it would answer: no, a unit's instructions are the sitting's to write each
time. Passed over on the author's words and on `session-context`'s rule that a
rule living only in a file is invisible to the projector and to review, which
holds twice over of a file under `tmp/`. The measure prices a scratch directory
the record does not keep, so it is given as a dated observation with its pins
and its criterion and not as a claim a later session could check: on 2026-09-07,
at graph commit 2e1d5e44 and implementation commit cb0e02c6, `tmp/align/` held
twenty unit briefs of 109,328 bytes beside the one common fragment the sitting
had written, every one of them gitignored; counted by the literal strings,
twenty of the twenty carry `state-changing` and eighteen carry `edit a node`,
which are `delegation`'s two bounds restated by hand in each brief, and three
read the fragment. The figure moved twice inside the day — an earlier form of
this sentence said fifteen briefs at 77,297 bytes and the reading that checked
it measured 74,659 — and none of the three can be re-taken, which is not a
defect in the measuring but the whole of the argument: nothing that steers a
unit is in the record, and nothing that steers a unit survives the sitting.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

The incumbent, standing: each unit is launched on a brief the sitting writes by
hand under `tmp/align/`, from the alignment skill's list of a sitting's units.
What it would answer: no, a unit's instructions are the sitting's to write each
time. Passed over on the author's words and on `session-context`'s rule that a
rule living only in a file is invisible to the projector and to review, which
holds twice over of a file under `tmp/`. The measure prices a scratch directory
the record does not keep, so it is given as a dated observation with its pins
and its criterion and not as a claim a later session could check: on 2026-09-07,
at graph commit 2e1d5e44 and implementation commit cb0e02c6, `tmp/align/` held
twenty unit briefs of 109,328 bytes beside the one common fragment the sitting
had written, every one of them gitignored; counted by the literal strings,
twenty of the twenty carry `state-changing` and eighteen carry `edit a node`,
which are `delegation`'s two bounds restated by hand in each brief, and three
read the fragment. The figure moved twice inside the day — an earlier form of
this sentence said fifteen briefs at 77,297 bytes and the reading that checked
it measured 74,659 — and none of the three can be re-taken, which is not a
defect in the measuring but the whole of the argument: nothing that steers a
unit is in the record, and nothing that steers a unit survives the sitting.
```

#### skills-for-the-design-unit-only

A skill for the design unit alone, the surveys and the decomposition staying as
briefs, on the ground that the design is the unit whose output the author
rules on. Passed over because a survey's contract decides what facts the design
is given, so an uncodified survey is the same defect one step earlier and one
step less visible: a design that reasons from a survey nobody contracted is a
recommendation whose evidence has no rule behind it.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

A skill for the design unit alone, the surveys and the decomposition staying as
briefs, on the ground that the design is the unit whose output the author
rules on. Passed over because a survey's contract decides what facts the design
is given, so an uncodified survey is the same defect one step earlier and one
step less visible: a design that reasons from a survey nobody contracted is a
recommendation whose evidence has no rule behind it.
```

#### the-package-first-and-the-skills-after

The recommendation staged. `packages/sitting-units/` with the generator, the
templates and the three fragments is built now, so that a unit's instructions
leave gitignored scratch and enter the record at once; the five skill
directories are created when `hand-written-projection-drift` is answered or the
projector gains a skill mode, whichever comes first, and the launch stays in
the alignment skill's list until then. Raised by the clean-context reading of
2026-09-07 as the option the answer fact's own `against` describes without
offering. Its case: it is undominated on the draft's own account of the
author's words, buying the whole of what those words are about, without
multiplying from four to nine the artifacts standing in an interval whose guard
the record has not yet decided, and it does not foreclose the five skills.
Viable and not adopted.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it: the author's words are that each subagent
have its instructions codified in a skill, and this option defers exactly what
they asked for while doing the part they did not name; the interim it asks for
has no date, since `hand-written-projection-drift` stands at the periagogic
stage with no answer and nothing in the record fixes when the projector gains a
skill mode, so the stage is bounded by two conditions the record cannot yet
schedule; and in that interim the alignment skill carries seven launch
paragraphs of seven different contracts in one file, which is the shape the
record's own two-contracts test rejects, the same objection that stands against
`brief-generator-without-skills`. It is on the fact for the author, whose words
are the one thing that decides between it and the recommendation.

**Content.**

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: "the projection of the decomposition unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: "the projection of the record survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: "the projection of the tradition survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: "the projection of the implementation survey as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: "the projection of the design unit as a skill of its own, an artifact this answer makes rather than one it names: it comes into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: "the briefs the five skills write for their units, whose common text is three fragments filled into every template; the package and its files are artifacts this answer makes rather than ones it names, coming into being at the reconciliation this answer names, which lands with the ruling"
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

The recommendation staged. `packages/sitting-units/` with the generator, the
templates and the three fragments is built now, so that a unit's instructions
leave gitignored scratch and enter the record at once; the five skill
directories are created when `hand-written-projection-drift` is answered or the
projector gains a skill mode, whichever comes first, and the launch stays in
the alignment skill's list until then. Raised by the clean-context reading of
2026-09-07 as the option the answer fact's own `against` describes without
offering. Its case: it is undominated on the draft's own account of the
author's words, buying the whole of what those words are about, without
multiplying from four to nine the artifacts standing in an interval whose guard
the record has not yet decided, and it does not foreclose the five skills.
Viable and not adopted.
```

### authority

Deferred, at low boldness, on `class-recommendation`'s test applied to its end
rather than stopped halfway. None of the three limbs reaches this node's
subject. Expensive: the packaging of an instrument is a rename and a move, and
the work a wrong answer costs is the rewriting of seven files the record can
rewrite again. Irreversible: nothing is deleted that the ruling does not put
back — the incumbent briefs are scratch and the skills are shims with their
liquidation already named. Capture-shaped: the party that would set the answer
is the AI and the answer instructs the AI's own subagents, which is the limb
that comes nearest, and it does not hold, because a unit's instructions are
read by the author's readings and by the alignment dialogue, and the check the
record has on this AI is the interview and not the packaging of the briefs.
Where none of the three holds the rule sends the class to delegated where the
author has said they do not want to be asked again about that class of
decision, and to deferred otherwise; the record holds no enumeration of what
the author has said that about, which is the open probe
`which-classes-of-decision-have-you-said` on `class-recommendation` itself, so
the answer is deferred. Low boldness: the class is read off the rule and the
one choice left to the AI, deferred over delegated, is made by the absence the
probe names.

Ratified is on the fact and is the rival this node's earlier reading argued
for, in its own words: that a unit's instructions are codified rather than
improvised is the author's own words, and it is what they would want to be
asked before it changes, where a delegation covering the class of decision
below this node would cover un-codifying them; and the names, which every
sitting and every telemetry reading will cite, are fixed by this ruling. That
argument is kept whole because it may be the author's, but it is not the test:
it reasons from what the author would want, which is the definition of the
class, and the test the record adopted asks after the three limbs and then
after what the author has actually said. Recommending ratified on it would be
recommending a class the record's own rule reserves for the cases the test
reaches.

Delegated is on the fact and is not recommended for the same reason deferred
is: it is the limb that turns on the author having said they do not want to be
asked again, and no such saying is in the record. What the classes decide today
is only what the author is asked, since during bootstrap no class acts and the
author's grant carries this reconciliation either way; what a ruling of
deferred settles is that the recommendation acts and the node stays on the
alignment frontier until the author returns to it.

### persistence

Six shims come into being at the reconciliation: five `SKILL.md` files and the
package's templates and fragments. `transience`'s rule declares a shim where
the artifact comes into being, on the node it projects, and this fact asks
whether that node is this one or `decomposition`, which is the same question
`review-skills` and `clean-context-review` met on 2026-09-04 and answered for
the two readings by declaring them on the node whose question the artifact
answers. Low boldness: the rule and that precedent decide the placement. The
fact is present because the recommendation changes the node's shape, which is
`dialogue`'s condition for carrying it; it does not survive the reconciliation
as a live question unless the author would move the shims, and the fence's
frontmatter carries them while the node's own frontmatter does not, since a
shim naming an artifact that does not exist is a finding the survey's
validations would make.

#### with the six shims

This node declares six shims: `.claude/skills/align-decompose/SKILL.md`,
`.claude/skills/align-survey-record/SKILL.md`,
`.claude/skills/align-survey-tradition/SKILL.md`,
`.claude/skills/align-survey-implementation/SKILL.md`,
`.claude/skills/align-design/SKILL.md`, and the templates and fragments under
`packages/sitting-units/`, each with the projector's writing of it from the
nodes as its liquidation.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

#### without them

This node declares nothing and the shims are declared on `decomposition`,
where the units are named; the skills are then described on the node that
decides what a unit is and not on the node that decides what carries it, and
`decomposition`'s frontmatter carries six artifacts its own answer does not
name.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

## Account


An un-aligned disposition, recorded from the author's words the turn they were
said. It is a question of its own and not `review-skills`', because that node's
question is about the two readings of the clean-context review and the author's
words are about every kind of unit a sitting launches; `node`'s rule and
`probe-or-node`'s four tests are applied in the rationale and each sends the
question to a node. The other placement is recorded on `review-skills` as the
option `two-skills-under-the-general-rule`, so the author may rule the question
back there if they hold the readings are the only units that need it.

What the sitting would amend: `decomposition`, whose answer names the kinds and
whose closing sentence says the answer is materialized by the alignment skill's
list of a sitting's units, which this answer moves to the seven skills; that
amendment is recorded on `decomposition` as the option
`units-carried-by-their-own-skills` and is not written here. `review-skills`,
which fixes the two reading skills' names and their package, and which gains
two options with this node as their source. The alignment skill, whose §Model
and delegation carries the units and their models and whose launch text for
each kind would move into that kind's skill, under the shim `growth` declares.
And `work-loop`, where the divergence that a sitting launched three
reconciliation units on briefs of its own rather than through `/reconcile` is
owed as an option; that option is not written by this design.

The periagogic object: the four skills as they stand, the fifteen unit briefs
under `tmp/align/`, the reconciliation skill's §2 contract, and the harness's
convention that a skill is one directory with one `SKILL.md` invoked by its
name.

### Manifest

- Folded: The design unit, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 921e4c32, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of dd941452

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `a-skill-per-unit-kind`.

Findings:

- The amendment answers three of the seven findings partly by asserting changes on other nodes it does not carry the text of, which this delta reading is not given the neighbourhood to verify: (1) the authority-fact rationale's new sentence 'the record holds no enumeration of what the author has said that about, which is the open probe `which-classes-of-decision-have-you-said` on `class-recommendation` itself' asserts a specific open probe on `class-recommendation`; (2) the generator-mechanics paragraph's 'It is recorded there as the option `fragments-move-to-the-units-package`, with this node as its source, for that node to rule' and the session's reply's 'the option fragments-move-to-the-units-package recorded on review-skills, source this node' assert an option was written onto `review-skills`' answer fact; (3) the session's reply's 'the option skills-among-what-a-session-loads recorded on session-context, source this node' asserts an option was written onto `session-context`'s answer fact (whose currently projected rule, `.claude/rules/session-context.md`, still enumerates only three projections and names no skill, which is expected if the option is recorded but not adopted, so this is not itself a contradiction); and (4) the Drift paragraph's new clause 'an instrument the `instruments` node has yet to record' asserts a state of the `instruments` node. Each claim is plausible and none is contradicted by anything in this node's own diff, but their accuracy rests on files this delta's scope excludes; the next full reading or the survey should check `review-skills`, `session-context`, `class-recommendation` and `instruments` for these four claims before the author rules.

On the facts and what they recommend: The diff changes two of the three facts and adds one viable option to the third. Authority: `recommends` moves from `ratified` to `deferred` (boldness stays `low`), with the `##### authority` prose rewritten to run `class-recommendation`'s three-limb test to its conclusion (none of expensive, irreversible, or capture-shaped reaches the subject) before landing on deferred via the open-probe gap, and the old ratified argument is kept as the passed-over rival's own prose rather than driving the recommendation. Answer: `recommends` stays `a-skill-per-unit-kind` (moderate); a new option `the-package-first-and-the-skills-after` (source review, viable and not adopted) is added, and the stale, unpinned `tmp/align/` measurement in `ad-hoc-briefs-under-the-alignment-skill` and in the Rationale is replaced by a pinned, dated one (graph commit 2e1d5e44, implementation commit cb0e02c6, twenty briefs at 109,328 bytes) framed explicitly as unreproducible. Persistence is untouched. The `## Recommendation` fence's six shim `for:` lines are all amended to say the artifact is one this answer makes and comes into being at the reconciliation that lands with the ruling, curing the validation-5 mismatch the review found.

On the viability of the options: The diff leaves every option on all three facts viable: the newly added `the-package-first-and-the-skills-after` is recorded exactly as the previous reading described it (source review, viable and not adopted, with its own case and its own case against), and no existing option is contradicted by the changes.

Strongest counter-argument (weak): No defect was found in what this node's own diff shows; the only residual risk is that the amendment's own account of what it did to `review-skills`, `session-context`, `class-recommendation` and `instruments` cannot be checked from this node's file alone, so if any of those four cross-node claims turns out false the amendment would be resting on an unverified premise the last reading had no chance to catch either.

The session's reply: Forwarded with one finding, verified on the main thread: class-recommendation carries the open probe which-classes-of-decision-have-you-said, review-skills carries the option fragments-move-to-the-units-package and session-context the option skills-among-what-a-session-loads, both with this node as source, and instruments records no instrument for the units package. The counter-argument stands on the row at weak strength. Nothing on the node changes.

### Frontier survey, 2026-09-07, of dd941452

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict. It read the graph at graph commit `e4c87ed083180d8ddd57045a20a5df80704787a5`, which the record carries in no key until `dialogue`'s option `survey-pin-carries-its-commit` is ruled.

Findings:


Strongest counter-argument (moderate): The answer names three of its five new skills `align-survey-*` while the record uses "survey" for two different things, which this node's own rationale calls "the vocabulary conflict behind it, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys." That conflict is recorded on no fact of any node: what is recorded on review-skills is a rename of one skill, not a decision about which sense the word carries. A ruling here multiplies an undecided term from one name to four, in a record whose eleventh validation asks that every term be used with one meaning across the frontier.

### Frontier finding, 2026-09-07

Kind: vocabulary.

"Survey" names two different things across the frontier and no node decides which sense it carries. frontier-consistency defines it for one — its `defines` list holds `frontier survey`, and its recommended answer names "the survey, the frontier survey this node defines, the reading that judges the whole graph against itself". decomposition names three of a sitting's units by the same word: "the record survey, what the graph says on the question", "the tradition survey, the second evaluation", and "the implementation survey, what exists and what a named artifact or command does". delegation's answer uses it a third way, among verbose investigations: "Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys." unit-skills' rationale names the collision — "the record already carries the vocabulary conflict behind it, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys" — and sends only the skill's name to review-skills, where `align-survey-renamed-for-the-family` decides what one skill is called and not what the word means. So the conflict is stated in a rationale, which binds nothing, and recorded on no fact.

Also named: commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/review-skills, commons.systems/disposition-graph/delegation.

Proposed: frontier-consistency's `frontier survey` is the defined term and survives; what moves is decomposition's use of the bare word for a sitting's units, which is where three of the four collisions come from and which unit-skills would multiply into four skill names. The option is recorded on decomposition so the author rules the term once; frontier-consistency, unit-skills and review-skills follow whichever way that ruling goes, and delegation's plural is read as the sitting's units under it.

Recorded as an option on commons.systems/disposition-graph/decomposition's answer fact: `units-are-readings-not-surveys` (source review, 2026-09-07).

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/unit-skills stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `a-skill-per-unit-kind`; 1 `## Disposition` entry became the ledger entry words/2026-09-07/10, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none. The record wrote no text of its own for `surveys-under-one-skill`, `brief-generator-without-skills`, `one-generator-for-every-brief`, `one-skill-with-the-kind-as-an-argument`, `ad-hoc-briefs-under-the-alignment-skill`, `skills-for-the-design-unit-only`, `the-package-first-and-the-skills-after`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `dd941452f4bc7e69dc8c8268bce53c394681479b` is re-computed for the encoding as `cb880309df7f02481f673294727e43ad417ba7ff`; nothing it read changed. The survey's pin `dd941452f4bc7e69dc8c8268bce53c394681479b` is re-computed for the encoding as `cb880309df7f02481f673294727e43ad417ba7ff`; nothing it read changed.
