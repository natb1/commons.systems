---
question: Is each unit of a sitting its own skill?
stage: ruling
facts:
  - name: answer
    options:
      - name: a-skill-per-unit-kind
        source: ai
        ref: "2026-09-07"
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
    recommends: a-skill-per-unit-kind
    boldness: moderate
    against: "The answer creates five more hand-written projections of nodes the projector cannot write, in a record whose own measurement of 2026-09-05 found two such files diverging from each other on the model rule within a day, and it does so while `hand-written-projection-drift`, minted from that measurement, stands at the periagogic stage with no answer; `brief-generator-without-skills` buys the substance the author's words ask for — the instructions leave gitignored scratch and enter the record, generated and not hand-written — at one artifact instead of six, and leaves the count and the names of the skills to be settled after the guard is known."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The packaging of an instrument is a rename and a move, and none of `class-recommendation`'s three limbs reaches it, so a delegation covering how a sitting's units are instructed would spare the author every future kind of unit and every rename, which is what the author's own words of 2026-09-04 on right-sizing units already leave to the AI."
  - name: persistence
    options:
      - name: with the six shims
      - name: without them
    recommends: with the six shims
    boldness: low
    against: "The six artifacts project `decomposition`'s list of kinds as much as this node's division of them into skills, and a session that goes to `decomposition` to learn what units a sitting has would find no shim declared there."
review:
  verdict: forward
  strength: strong
  date: 2026-09-07
  of: 921e4c32742fc6d21509f15ba189eb1fc52adfc9
  against: "The answer's own strongest evidence argues against its shape. Its ground for moving a unit's instructions into the record is a measurement of drift among files nobody projects, and its remedy is five more files nobody projects, in a record that measured two hand-written skills diverging from each other on the model rule inside a single day and minted `hand-written-projection-drift` to ask what guards them -- a node still at the periagogic stage with no answer. Everything the author's words name is bought by the package and the generator alone: the instructions leave scratch, stop being rewritten each sitting, become an artifact a node projects and a reading can read. What the five directories add on top is the harness listing and the telemetry split, and the telemetry premise is one `review-skills` itself records as unverified in this repository. So the marginal five artifacts are spent on an unverified premise, in the interval whose danger this record has already measured, and the check the answer offers in exchange -- a currency step that reads the nodes at every invocation -- is the same check that failed to catch the divergence the record found by a reading and not by the step."
form: rule
under:
  - commons.systems/disposition-graph/decomposition
depends:
  - commons.systems/disposition-graph/review-skills#two-skills-one-package
---
## Disposition

The author, 2026-09-07, on the sitting's units and the skills that carry them,
said after the session had launched design, survey and reconciliation units on
ad-hoc briefs beside the two review skills:

> also include this in the list of dispositions we are progressing up to confirmation and reconciling: it sounds like recommended alignment subagents have extended beyond (or superceded) align-review and align-survey. If so, each subagent have its instructions codified in a skill. And if align-review or align-survey are superceded, they must be liquidated by reconciliation.

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

#### surveys-under-one-skill

One skill for the three surveys, `/align-survey-unit <corpus> <node id>`, with
the corpus — the record, the traditions, the implementation — as its argument,
on the ground that all three report what is and never what should be, take the
same argument shape, and differ only in what they read and in the model they
run on. On the table because it is the honest rival to the recommended count:
the collapse of the periagogic reading into two survey skills is made on
exactly this reasoning, and a reader may hold that the reasoning does not stop
where the recommendation stops it. Against it: the three outputs are not one
contract. A tradition survey returns candidate readings with their source,
their locus and what each bears on, which are node-shaped and go to the
`readings` encoding; a record survey returns what the graph says with its
contradictions and its redundant seams; an implementation survey returns what
exists and what a named command does. A flag that replaces the output contract
fails the second limb of the utility-syntax test the record adopted on
`review-skills`, and one name would mix three populations of different cost in
the telemetry the author's words of 2026-09-04 asked to separate.

#### brief-generator-without-skills

The brief generator alone: `packages/sitting-units/brief.mjs` writes each
kind's brief from the nodes and the templates, and the launch stays where it
is, in the alignment skill's list of a sitting's units. No new skill directory
is created. On the table because it buys most of what the author's words are
about — the instructions leave gitignored scratch, stop being written by hand,
and become an artifact a node projects and a reading can read — at one new
artifact instead of six, and because it is the shape in which
`hand-written-projection-drift`'s open question is not multiplied by five
before it is answered. Against it: the author's words say codified in a skill,
and the alignment skill would then carry seven launch paragraphs of seven
different contracts in one file, which is the one-file-many-contracts shape the
record's own two-contracts test rejects; the telemetry would report every unit
of every sitting under `/align`.

#### one-generator-for-every-brief

The same as the recommendation except that one script writes every brief in
the record, a reading's and a unit's alike: `packages/clean-context-review/brief.mjs`
is folded into `packages/sitting-units/brief.mjs` and the reading skills call
it with their own templates. On the table because it is the strictest reading
of the author's question about drift and because two files named `brief.mjs`
in one repository invite the reader to think one of them is dead. Against it:
the two do different jobs. A reading's generator assembles a neighbourhood out
of the graph under `review-cost`'s rule, deciding what is carried whole and
what as a pointer; a unit's generator fills a template with a contract the
sitting states. What they share is the fragments, and the recommendation shares
exactly those; folding the rest would put one job's rules inside the other's
file, which is the wrong abstraction the readings under `review-skills`
already name. It would also move an artifact `review-skills`' fence names as
its package's, which is that node's to rule.

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

#### ad-hoc-briefs-under-the-alignment-skill

The incumbent, standing: each unit is launched on a brief the sitting writes by
hand under `tmp/align/`, from the alignment skill's list of a sitting's units.
What it would answer: no, a unit's instructions are the sitting's to write each
time. Passed over on the author's words and on `session-context`'s rule that a
rule living only in a file is invisible to the projector and to review, which
holds twice over of a file under `tmp/`: measured on 2026-09-07, this sitting's
fifteen unit briefs are 77,297 bytes, every one of them gitignored, seven of
them stating `delegation`'s bound against state-changing git in three different
wordings, thirteen stating the bound against editing a node, eight carrying
their own copy of the primer on how a node's recommended text is read, and
three sharing the one common fragment the sitting wrote for its reconciliation
units. Nothing that steers a unit is in the record, and nothing that steers a
unit survives the sitting.

#### skills-for-the-design-unit-only

A skill for the design unit alone, the surveys and the decomposition staying as
briefs, on the ground that the design is the unit whose output the author
rules on. Passed over because a survey's contract decides what facts the design
is given, so an uncodified survey is the same defect one step earlier and one
step less visible: a design that reasons from a survey nobody contracted is a
recommendation whose evidence has no rule behind it.

### authority

Ratified, at low boldness. `class-recommendation`'s escalation test does not
reach this node's subject: the packaging of an instrument is reversible and
cheap, as `review-skills` says of the same question one level down. Ratified is
recommended on the ground that node's authority fact gives, which holds harder
here: that a unit's instructions are codified rather than improvised is the
author's own words, and it is what they would want to be asked before it
changes, where a delegation covering the class of decision below this node
would cover un-codifying them; and the names, which every sitting and every
telemetry reading will cite, are fixed by this ruling. Deferred is on the fact
because the record's classes are three; it is not recommended, since the author
has granted the reconciliation and the recommendation acts under the grant
either way, and what the ruling settles is whether the rule is doctrine.

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

#### without them

This node declares nothing and the shims are declared on `decomposition`,
where the units are named; the skills are then described on the node that
decides what a unit is and not on the node that decides what carries it, and
`decomposition`'s frontmatter carries six artifacts its own answer does not
name.

## Recommendation

```markdown
---
question: Is each unit of a sitting its own skill?
form: rule
under:
  - commons.systems/disposition-graph/decomposition
shims:
  - artifact: "`.claude/skills/align-decompose/SKILL.md` on the implementation ref, the decomposition of a bundled disposition into the questions it asks, hand-written from this node, `decomposition`, `node`, `probe-or-node` and `recording`"
    for: the projection of the decomposition unit as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-record/SKILL.md` on the implementation ref, the record survey, hand-written from this node, `decomposition`, `frontier-consistency` and `viable-options`"
    for: the projection of the record survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-tradition/SKILL.md` on the implementation ref, the tradition survey, hand-written from this node, `decomposition`, `evaluation` and `readings`"
    for: the projection of the tradition survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-survey-implementation/SKILL.md` on the implementation ref, the implementation survey, hand-written from this node, `decomposition` and `materialization`"
    for: the projection of the implementation survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "`.claude/skills/align-design/SKILL.md` on the implementation ref, the design unit, hand-written from this node, `decomposition`, `dialogue`, `viable-options`, `prose-and-structure` and `evaluation`"
    for: the projection of the design unit as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-07
  - artifact: "the five brief templates and the fragments `brief-bounds.md`, `brief-record.md` and `brief-report.md` under `packages/sitting-units/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the five skills write for their units, whose common text is three fragments filled into every template
    liquidation: the brief generator fills a brief's common and kind-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-07
---
## Answer

Yes. Each kind of unit a sitting launches is one skill directory under `.claude/skills/` with one `SKILL.md`, invoked by its name, carrying only what is specific to its kind. `decomposition` names the kinds; this node names the skills that carry them: `/align-decompose`, the decomposition of a bundled disposition into the questions it asks; `/align-survey-record`, what the graph says on a question; `/align-survey-tradition`, the second evaluation, returning readings with their source, their locus and what each bears on; `/align-survey-implementation`, what exists and what a named artifact or command does; `/align-design`, the options on each fact, the recommendation with its boldness and its case against, and the draft text; and, standing already and untouched here, `/align-review`, the reading of one draft, and `/align-survey`, the survey of the frontier, which `review-skills` decides. Seven kinds and seven skills. The author's words are that each subagent's instructions be codified in a skill, and what codified means is fixed by the record's own two rules: `session-context`, under which a rule living only in a file is invisible to the projector and to review, so no skill states a rule of its own; and `materialization`, under which every artifact is the projection of the node whose answer it carries, so each skill is a declared shim on the node it projects until the projector writes it.

The periagogic reading mints no skill. `decomposition`'s movement seam sends the periagogic object — the nodes a disposition would amend and the implementation their criteria point to — to a survey unit, and that object is the record survey's corpus together with the implementation survey's. The object a unit reads is its argument and not a second contract, so the periagogic reading is those two skills run over an object the sitting names, and the same test that divides the three surveys from each other collapses this one into them; a test that only ever multiplies is not a test. The reconciliation unit mints none either, and it is not a sitting's unit: its contract is the reconciliation skill's, which `work-loop` declares as a shim, and a sitting reconciling under the author's grant runs that contract with the bite named by the grant instead of derived from the frontier, which is a difference in how a bite is chosen and not in what the unit is. That a sitting launched three reconciliation units on briefs of its own on 2026-09-07 rather than through that skill is a divergence recorded on `work-loop` and not answered here.

What each `SKILL.md` carries is what is specific to its kind and nothing else, in the shape `review-skills` fixes for the two readings. The object of the unit and what its reader is given, as `decomposition`'s paragraph on the kind of analysis gives them, cited and restated in no part, since a copy of another node's sentence falls behind its source. The currency step: fetch `origin/disposition`, the nested worktree at it with a clean tree but for the sitting's own drafts, `node packages/disposition/validate.mjs disposition`, then the nodes the skill's shim notice names read at their current text, where a node differs from the file the node wins and the difference is recorded on it as an un-aligned disposition. The brief, one command, below. The launch: one subagent of type `general-purpose`, never a fork, at the model `decomposition` names for that kind by its relation and never by a harness name, and at the effort the brief states, told to read and follow the brief exactly, to write only the output file the brief names, and never to run state-changing git; relaunched once with the same brief on a failure, reported on a second with the sitting's stage unchanged. What the main thread does with the conclusion, which is `decomposition`'s integration and is never delegated: it reads the conclusion and never the context, validates what the unit returns at the loci the unit names, and writes the node. And the landing, which for every unit but the two readings is the sitting's own round at its next stage transition, as `checkpoint` says. Each skill's frontmatter carries `name` equal to its directory and a description, and no model's name, which is the harness's and the day's.

A unit's brief is written by a script and never by hand. `node packages/sitting-units/brief.mjs --kind <kind> --node <id> [--fact <name>…] --object <file> [--out <path>]` writes `tmp/align/<kind>-<slug>.brief.md` and names the unit's one output file. The generator fills three fragments into every kind's template: `brief-bounds.md`, the bounds `delegation` puts on a subagent, which are a bound of that node's answer and not sizing, as `delegation-bounds-and-sizing` divides them; `brief-record.md`, the primer on the record's encoding, facts, options, rulings, the derived class, boldness reversed, and what a node is; and `brief-report.md`, the report `decomposition` requires of every unit, the conclusion as data with the exact commands the unit ran and nothing of the unit's context. Each fragment exists in one file, and only the essential common text is factored, since factoring what merely looks the same today re-creates the flag inside the fragment. What is the sitting's own — which nodes the unit reads, the author's words it works from, which facts are its, and the form of its output — is the contract `decomposition` requires of every unit, and the sitting states it in the object file the generator names; the generator writes the frame and never guesses the contract.

The mechanics are code and live where `materialization` puts the graph's own tooling: one workspace package, `packages/sitting-units/`, named `@commons.systems/sitting-units` after the units it briefs, declared like every package by the root manifest's workspaces, holding `brief.mjs`, the five templates, the three fragments, the fixture graph and the tests the root manifest's test script runs, and importing the reader from `packages/disposition` by its workspace name. It is a second generator beside the two readings', deliberately: a reading's generator assembles a neighbourhood out of the graph under `review-cost`'s rule, deciding what is carried whole and what as a pointer, and a unit's generator fills a template with a contract the sitting states, and the two share their common text and not their job. What they share is the three fragments, which live in this package and which `packages/clean-context-review/brief.mjs` fills from it by workspace name, its own `brief-bounds.md` and `brief-record.md` deleted, so that each fragment exists in one file across both packages. The stricter fold, one generator for every brief in the record, is on this node's answer fact as `one-generator-for-every-brief` and would move an artifact `review-skills`' fence names as its package's, which is that node's to rule and not this one's.

Drift, and what the codification does and does not buy. Six of the seven artifacts are hand-written projections of nodes the projector cannot yet write, declared as shims above, and codification does not make them drift-proof: it moves a unit's instructions out of gitignored scratch, where no projector and no reading can see them and where they are rewritten every sitting, into the record, where a shim notice says the node wins, the currency step reads the nodes at every invocation, and the survey's validations read each skill as an artifact. That is a check and not a construction, and what guards a hand-written projection in the interval between a shim's declaration and its liquidation is not this node's question: it is asked on `hand-written-projection-drift`, minted on 2026-09-05 from the measurement that two hand-written skills had diverged from each other within a day, and this answer multiplies the artifacts standing in that interval from four to nine, which is the cost the case against this recommendation names. Skill reconciliation resolves the drift by construction at liquidation and not before, when the projector writes each skill from the nodes its shim notice names, as it writes the rules directory today, one file per node, regenerated whole, with a file it wrote and no node claims deleted.

What this costs, as a consequence and never as a reason. Created: five skill directories with one `SKILL.md` each; `packages/sitting-units/` with `package.json`, `brief.mjs`, the five templates `brief-decompose.md`, `brief-survey-record.md`, `brief-survey-tradition.md`, `brief-survey-implementation.md` and `brief-design.md`, the three fragments, a fixture graph and `brief.test.mjs`. Changed: `packages/clean-context-review/brief.mjs`, to fill `{{bounds}}` and `{{record}}` from this package by workspace name, with its own two fragments deleted; the alignment skill's list of a sitting's units, which names each kind's skill and stops carrying each kind's launch text, and its shim notice; the bullet of `CLAUDE.md` that names the skills; and `decomposition`'s sentence on how its answer is materialized, which is recorded there as an option and not written here. In the harness's listing the author sees seven `align-` skills where three stand today, and the telemetry reports seven populations where it reports one. Nothing is liquidated: neither review skill is superseded, both are invoked at the same two moments and by the same names, and the units this answer codifies are the other units `decomposition` already named.

## Rationale

The author, 2026-09-07: "it sounds like recommended alignment subagents have extended beyond (or superceded) align-review and align-survey. If so, each subagent have its instructions codified in a skill. And if align-review or align-survey are superceded, they must be liquidated by reconciliation."

Why a node and not an option on `review-skills`. `review-skills` asks whether each reading of the clean-context review is its own skill, and its answer is about the two readings; the author's words reach every kind of unit a sitting launches. A text answering two questions is two nodes, as `node` says, and `probe-or-node`'s four tests each send this question to a node rather than to a probe or an option: a response of "delegated, do not ask me again" would make sense of it, which only a disposition can carry; the response moves recommendations on `decomposition`, on `review-skills` and on the shim `growth` declares for the alignment skill, which is doctrine reaching below one node; every later sitting, every projection of a skill and every reconciliation would read it after the ruling it moved; and its facts do not repeat its parent's, since `decomposition` decides what the units are and this node what carries their instructions. The dependency runs one way, from this node to `review-skills#two-skills-one-package`, and the option recorded there carries no reciprocal `depends`, because two nodes each waiting on the other is a queue that never opens.

Why a skill per kind, beyond the words. `delegation` divides delegated work by contract, and `review-skills` draws from it the analogy that an invocation needing a second contract is two invocations. Applied to the kinds `decomposition` names, it divides them: a decomposition takes the author's bundled words and returns a list of questions with their placement; a design takes a node and the facts that are its and returns options, a recommendation, a boldness, a case against and a fence; the three surveys read three different corpora and return three different shapes, one of them node-shaped readings. Applied the other way it collapses the periagogic reading into the record and implementation surveys, whose corpora it names, because the object is an argument and the contract is unchanged. The test is used in both directions on purpose: a discriminator that only ever multiplies is not a discriminator.

Why the instructions are the record's and not the sitting's. The measurement is the argument. On 2026-09-07 this sitting's fifteen unit briefs were 77,297 bytes under `tmp/align/`, every byte gitignored: `delegation`'s bound against state-changing git appeared in seven of them in three wordings, its bound against editing a node in thirteen, the primer on how a node's recommended text is read in eight, and the one common fragment the sitting wrote covered three. Nothing there is projected from a node, so no reading can find a brief that contradicts the record and no projector can correct one; and none of it survives the sitting, so the next sitting writes it again and differently. That is `session-context`'s rule about a rule living only in a file, in its worst case, and it is what the author's words are about.

Why the common text is fragments and the per-kind text is the skill. `session-context` holds that a rule living only in a file is invisible, so no skill states a rule of its own and each cites the node; but a unit's reader is a subagent given a brief and the record and nothing else, so the primer, the bounds and the report contract must be in the brief, and one file each is the least that holds them until the generator writes them from the nodes. Only the essential common text is factored, which is the bound `the-wrong-abstraction` puts on factoring, already read under `review-skills`.

Why not one generator. The two generators do different jobs and share their common text, which is the distinction `information-hiding` draws and which the record already applied when it kept `apply.mjs` in the readings' package: a reading's brief carries the record, assembled under `review-cost`'s pointer rule, and a unit's brief carries a contract the sitting states. The stricter fold is on the fact and would decide an artifact `review-skills` names as its package's.

The greenfield lens was applied and it caught one thing. The incumbent's names were given no weight, and read as if from scratch the family of seven would be `/align-decompose`, `/align-survey-record`, `/align-survey-tradition`, `/align-survey-implementation`, `/align-design`, `/align-review` and `/align-survey-frontier`, in which no name is a prefix of another and each says its object; the incumbent `/align-survey` is the one name that does not, and the record already carries the vocabulary conflict behind it, `frontier-consistency` defining survey as the reading of the frontier while `decomposition` calls three of a sitting's units surveys. The rename is `review-skills`' to decide, since that node fixes the two names, and it is recorded there as the option `align-survey-renamed-for-the-family`; this answer does not depend on it and names the incumbent.

The traditions this answer leans on are the eight already standing as readings under `review-skills` — information hiding, the utility syntax convention, operation naming in telemetry, inspection roles, the multi-call binary and the façade, duplication of knowledge against duplication of text with Codd's update anomaly, literate programming with the content reference, and the wrong abstraction — each of which bears on this answer for the same reasons it bears there. No adoption is claimed here that a reading does not stand behind: the `bears` entries on this node's recommended option are owed from the alignment sitting and are not written by a design or by a reading, and until they are written this rationale names the readings and claims no relation the record cannot see.
```

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

### The design unit, 2026-09-07

Run on the larger model substituting for the most capable, which was
unavailable, at high effort, from the brief at
`tmp/align/brief-design-unit-skills.md`, at graph head with the author's words
of 2026-09-07 uncommitted on `review-skills` and `decomposition`. This section
is the unit's conclusion; the recommendation on each fact is above, and no
clean-context reading has run on it.

**The three classes of finding.**

Within the graph. `decomposition` names seven kinds of unit and says which
model each runs on, and says nothing about what carries a kind's instructions;
its only sentence on materialization sends the whole of it to the alignment
skill's list, under a shim `growth` declares for that node and its siblings,
which `decomposition`'s own reading of 2026-09-05 already found does not reach
it, since it is `growth`'s grandchild. So the units' instructions are
materialized today by a clause of a shim that does not reach the node it
materializes. `review-skills` answers the same question one level down and
answers it in three parts, the skill, the package and the node-held common
text, and that shape is taken here rather than invented.
`hand-written-projection-drift` stands at the periagogic stage with no answer
and its account already lists the shims standing in the interval this answer
adds five artifacts to; the answer cites it rather than answering it, and the
case against the recommendation is drawn from it.

Between the graph and the AI's knowledge. `.claude/skills/` holds exactly four
directories, `align`, `align-review`, `align-survey` and `reconcile`, each with
one `SKILL.md` and a frontmatter `name` equal to its directory, `reconcile`
alone carrying `model`, `effort` and `disable-model-invocation`; no unit of a
sitting other than the two readings has a skill. `.claude/skills/align/SKILL.md`
invokes `/align-review <node id>` at line 751 and `/align-survey` at line 815,
which is what settles that neither is superseded: the units this sitting
launched sit beside them and do none of their work. The projector has no skill
mode, so the shims' liquidation is unbuilt for these five as for the two
standing ones. The fifteen briefs under `tmp/align/` are 77,297 bytes and every
one is gitignored, `git check-ignore` naming `/tmp/` in `.gitignore`; the
duplication measured across them is in the option
`ad-hoc-briefs-under-the-alignment-skill`.

Redundant seams. The bound against state-changing git is stated in seven briefs
in three wordings, the bound against editing a node in thirteen, and the primer
on how a recommended text is read in eight; the sitting's own attempt to factor
them, `tmp/align/brief-common-2026-09-07.md`, is 42 lines and is read by three
briefs, all three of them reconciliation units. The design's answer to the
seams is that the bounds, the primer and the report contract become three
fragments filled into every template, and that the fragments are shared with
the readings' package by workspace name so each exists in one file across both.

**Evaluated twice.** Fresh judgment gave the answer above: a skill per kind,
because the kinds are seven contracts and a flag that replaces the output
contract is a second command; one package for the units' mechanics, because
they are one body of code; the common text as three fragments and the rules as
the nodes', because a rule living only in a file is invisible; and the
periagogic reading collapsed into two surveys, because the object is an
argument. With reference to tradition, the eight readings standing under
`review-skills` bear here for the same reasons they bear there, and the
`bears` entries are owed from the main thread rather than claimed in the
rationale, which is the defect `decomposition`'s reading of 2026-09-05 found on
that node and which this design does not repeat. Steelman for the incumbent:
a brief written for one unit by the thread that knows what the unit is for is
better fitted than a template filled by a script, and five more hand-written
projections is five more of the failure the record measured on 2026-09-05; the
reply is that the fit is the contract, which stays the sitting's and is passed
as the object file, and that what is codified is the frame the sitting was
rewriting every time, which is where the drift already is.

**The map of decisions to fields.** The division into seven skills and their
names: the answer fact's option `a-skill-per-unit-kind` and the fence's first
paragraph. The periagogic reading and the reconciliation unit: the second.
What each skill carries: the third. The brief command, the fragments and the
contract: the fourth. The package and the two generators: the fifth. What
codification does and does not buy, and the citation of
`hand-written-projection-drift`: the sixth. The cost, as a consequence: the
seventh. The rival counts: `surveys-under-one-skill` and
`one-skill-with-the-kind-as-an-argument`. The rival without skills:
`brief-generator-without-skills`. The stricter fold:
`one-generator-for-every-brief`. The incumbent:
`ad-hoc-briefs-under-the-alignment-skill`. The narrower codification:
`skills-for-the-design-unit-only`. The six shims: the fence's frontmatter and
the persistence fact. The class: the authority fact. The rename of
`/align-survey`: not decided here, recorded on `review-skills`. What the ruling
waits on: `depends`, `review-skills#two-skills-one-package`.

Owed from the main thread at the recording of this recommendation and not
written by the design: the two options on `review-skills` and the one on
`decomposition` set out beside this design; the `bears` entries on the eight
readings under `review-skills`; the option on `work-loop` for the sitting's
reconciliation units launched outside `/reconcile`; this node's `stage: review`;
and the clean-context reading of this draft.

### Clean-context review, 2026-09-07, of 921e4c32

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Recommended at this reading: `a-skill-per-unit-kind`.

Findings:

- ## Facts, `##### authority`: the reading applies `class-recommendation`'s test, finds it fails, and then recommends the class the test reserves for the cases it reaches. The prose says "reach this node's subject: the packaging of an instrument is reversible and" cheap, i.e. that none of the three limbs holds, and the rule as projected says that "Where none of the three holds, the recommendation is delegated where the author has said they do not want to be asked again about that class of decision, and deferred otherwise." Ratified is then recommended on a fourth ground -- that the author would want to be asked -- which is the definition of the class and not a limb of the test. The fact's own `against` states the objection. The boldness of low compounds it: a recommendation that departs from the rule it cites does not rest on the record. Suggested edit: recommend `deferred` on the fact, keeping `ratified` beside it with the present prose as its sentence, so the author is asked whether this is a class they want to keep; or, if `ratified` stands, name the limb it rests on -- capture-shaped, if the argument is that the AI packaging its own instruments is the party the answer checks -- rather than opening with the statement that none reaches it.
- ## Recommendation, the fifth paragraph, against the sibling node it moves files out of. The draft applies its own test in one direction and not the other. It passes over `one-generator-for-every-brief` because that fold "would move an artifact `review-skills`' fence names as its package's, which is that node's to rule and not this one's", and then moves two artifacts that same fence names as that package's: `packages/clean-context-review/brief.mjs` is to fill the fragments from `packages/sitting-units/` with "its own `brief-bounds.md` and `brief-record.md` deleted", while `review-skills`' recommended text enumerates "the fragments `brief-bounds.md`, the reader's bounds, and `brief-record.md`, the primer on the record's encoding, which the generator fills into both templates at `{{bounds}}` and `{{record}}`" among what its package holds. The account's list of what is owed on `review-skills` carries two options, `two-skills-under-the-general-rule` and `align-survey-renamed-for-the-family`, and neither is this one. Suggested edit: record a third option on `review-skills`' answer fact, source `commons.systems/disposition-graph/unit-skills`, named `fragments-move-to-the-units-package`, saying that the two fragments leave the readings' package and are filled from `@commons.systems/sitting-units` by workspace name so each exists in one file across both, with the reason and the cost; or keep the fragments where that node puts them and have the units' generator fill from there.
- ## Recommendation, first paragraph: "Seven kinds and seven skills" states a rule over two skills this node's ruling cannot reach. `review-skills` stands under `clean-context-review` and so under `recording`, not under `decomposition`, and authority only narrows on the way down, which is the very objection the draft writes into `two-skills-under-the-general-rule` in the other direction ("the question the new node asks reaches `decomposition`'s list of kinds, which is not below this node, and authority only narrows on the way down, so a ruling here could not confer it"). The symmetry is not stated: a ruling here confers nothing on `/align-review` and `/align-survey` either. As written a reader could take a ruling on this node as settling the family of seven. Suggested edit: after the list, say that what this ruling binds is the five kinds this node creates, that the two readings' skills are named for the family's shape and are `review-skills`' to decide, and that the two nodes agree today rather than one governing the other.
- ## Recommendation, the frontmatter, and validation 5. The six shims name six artifacts that do not exist: `.claude/skills/align-decompose/SKILL.md` and the four beside it, and `packages/sitting-units/`, are absent from the working tree (`.claude/skills/` holds exactly `align`, `align-review`, `align-survey`, `reconcile`). The draft is the text the recommendation names, so validation 5 as `frontier-consistency` states it -- "Each declared shim names an artifact that exists and a liquidation condition" -- fails on the fence today. The node's persistence prose anticipates the node's own frontmatter and not the fence's: "frontmatter carries them while the node's own frontmatter does not, since a" shim naming an artifact that does not exist is a finding. Suggested edit: say in each shim's `for`, or in one sentence of the fence, that the artifact comes into being at the reconciliation this answer names and that the ruling and the reconciliation land together, so a reader running validation 5 on the fence reads a declaration of what is being made and not a reference to what is missing.
- ## Recommendation, the rationale, and the option `ad-hoc-briefs-under-the-alignment-skill`: a measurement that cannot be re-taken and no longer matches the tree. Both say "On 2026-09-07 this sitting's fifteen unit briefs were 77,297 bytes under `tmp/align/`". `tmp/` is gitignored, so nothing in the record reproduces it, and the directory now holds sixteen `brief-*.md` files totalling 79,410 bytes, of which one is the shared fragment the same sentence counts separately, leaving fifteen briefs at 74,659. The figure is the whole of the argument for the recommendation ("The measurement is the argument"), and it lives in an option row and a rationale that both survive the recording. Suggested edit: pin the measurement -- the graph commit, the implementation commit, and the count and bytes as taken -- and say that it prices a scratch directory the record does not keep, so a later session meets a dated observation rather than a claim it cannot check.
- Validation 15, merge, against `commons.systems/disposition-graph/session-context` (disposition/disposition-graph/session-context.md). The draft rests twice on that node -- "`session-context`, under which a rule living only in a file is invisible to the projector and to review, so no skill states a rule of its own" -- while adding five files to a class that node's answer does not admit: it says a session loads "From three projections and nothing else", enumerates `.claude/rules/`, `CLAUDE.local.md` and `CLAUDE.md`, and names no skill, though a skill is exactly a file a session loads and reads as instruction. Nine skill files would then be materialized implementation that no session-context projection covers. The gap predates this draft and this draft multiplies it. This review proposes and does not merge: record on `session-context`'s answer fact an option named `skills-among-what-a-session-loads`, source `commons.systems/disposition-graph/unit-skills`, ref 2026-09-07, with the prose: "The standing answer with a fourth projection: the skills under `.claude/skills/`, one directory per unit or reading, each projected from the node whose answer it carries and declared a shim until the projector writes it, are what a session loads when it invokes one, so that the enumeration covers every file that instructs a session and not only the three it names. Raised on `unit-skills`, which cites this node for the rule that a rule living only in a file is invisible while adding five such files."
- ## Recommendation, the sixth paragraph, on what the codification actually buys. The paragraph is honest that codification "is a check and not a construction", but the answer's cost is carried by a premise the record says it cannot verify. The five directories, as against the package and the generator alone, buy the harness listing and the telemetry split, and `review-skills`, whose shape this draft takes, records of exactly that premise: "the repository holds no telemetry configuration and no reading of it, so neither is verified here". The draft inherits the premise without inheriting the condition `review-skills` attached to it, which is that the passed-over rival's status is lifted on the first per-skill usage reading the author can produce. Suggested edit: attach the same condition here -- `brief-generator-without-skills`' status is lifted, or the count revisited, on the first per-skill usage reading -- so that the five directories rest on a premise with a stated way of being falsified.

On the facts and what they recommend: Three facts, each recommending a listed option and each carrying an `against`, which is more than most of this record's nodes do and is right. The answer fact recommends `a-skill-per-unit-kind` at moderate boldness with nothing standing, so the `## Recommendation` fence is required and present; moderate is right and well decomposed in the prose, since the author's words carry the codification and the count, the names, the collapse of the periagogic reading and the two generators are the AI's. The persistence fact is correctly present, since the recommendation changes the node's shape by declaring six shims, and `with the six shims` at low boldness follows `transience`'s placement rule and the precedent of 2026-09-04. The authority fact is the one I would move, for the reason in the first finding: its own reading finds `class-recommendation`'s test unmet and then recommends the class that test reserves for the cases it meets.

On the viability of the options: Every option on the answer fact is viable and each of the three passed-over rows carries a reason that holds; `brief-generator-without-skills`, `surveys-under-one-skill` and `one-generator-for-every-brief` are correctly left pending rather than passed over, since each is a live rival and the fact's own `against` argues for the first. One viable option is missing, and it is the one the fact's `against` describes without offering: `the-package-first-and-the-skills-after`, the recommendation staged -- `packages/sitting-units/` with the generator, the templates and the three fragments built now, so that a unit's instructions leave gitignored scratch and enter the record at once, and the five skill directories created when `hand-written-projection-drift` is answered or the projector gains a skill mode, whichever comes first. It is undominated: it buys the whole of what the author's words are about, on the draft's own account of them, without multiplying from four to nine the artifacts standing in an interval whose guard the record has not yet decided, and it does not foreclose the five skills. It should be recorded with source `review`, ref 2026-09-07.

Strongest counter-argument (strong): The answer's own strongest evidence argues against its shape. Its ground for moving a unit's instructions into the record is a measurement of drift among files nobody projects, and its remedy is five more files nobody projects, in a record that measured two hand-written skills diverging from each other on the model rule inside a single day and minted `hand-written-projection-drift` to ask what guards them -- a node still at the periagogic stage with no answer. Everything the author's words name is bought by the package and the generator alone: the instructions leave scratch, stop being rewritten each sitting, become an artifact a node projects and a reading can read. What the five directories add on top is the harness listing and the telemetry split, and the telemetry premise is one `review-skills` itself records as unverified in this repository. So the marginal five artifacts are spent on an unverified premise, in the interval whose danger this record has already measured, and the check the answer offers in exchange -- a currency step that reads the nodes at every invocation -- is the same check that failed to catch the divergence the record found by a reading and not by the step.

The session's reply: Accepted on all seven, each verified at its locus on the main thread: the authority fact finds none of the three limbs and recommends ratified on a fourth ground; the draft moves two fragments review-skills' fence names as its package's while passing another fold over for that reason; seven kinds and seven skills states a rule over two skills a ruling here cannot reach; the six shims name artifacts that do not exist at 660d178d; the measurement cannot be re-taken and the directory now holds sixteen briefs at 79,410 bytes; session-context's three projections name no skill; and the telemetry premise is inherited without review-skills' condition. The amendments owed: the authority fact recommends deferred, ratified kept beside it with its prose; the option fragments-move-to-the-units-package recorded on review-skills, source this node; the sentence after the list saying a ruling here binds the five kinds this node creates and the two readings' skills are review-skills' to decide; each shim's for saying the artifact comes into being at the reconciliation this answer names and the ruling and the reconciliation land together; the measurement pinned to its commits and named as pricing a scratch directory; the option skills-among-what-a-session-loads recorded on session-context, source this node; the condition attached that brief-generator-without-skills' status is lifted on the first per-skill usage reading; and the option the-package-first-and-the-skills-after recorded, source review, viable and not adopted, since the author's words name a skill for each subagent and the staged option defers what they asked for. The counter-argument goes on the row at the strength the reading gave it. The amended answer owes its re-reading.
