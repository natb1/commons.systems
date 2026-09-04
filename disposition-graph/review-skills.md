---
question: Is each reading of the clean-context review its own skill?
stage: review
facts:
  - name: answer
    options:
      - name: one-skill-with-a-flag
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "the author's words of 2026-09-04 ask for two skills so that the telemetry tells the readings apart, and a flag leaves both readings under one name"
      - name: two-skills-one-package
        source: ai
        ref: "2026-09-04"
      - name: two-skills-code-beside-one
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it makes one skill's directory the other's dependency and keeps the graph's own tooling under `.claude/skills/`, where the materialization node's convention puts it under `packages/`"
      - name: split-at-liquidation
        source: ai
        ref: "2026-09-04"
      - name: one-skill-named-operation
        source: ai
        ref: "2026-09-04"
        status: passed
        reason: "it rests on the telemetry attributing usage to something other than the skill's name, which the author's premise denies and the repository cannot verify"
    recommends: two-skills-one-package
    boldness: moderate
    against: "The two readings share the one decision that matters, what a clean-context reading is, and until the projector writes the skills that decision is guarded by two hand-written files with nothing checking that they still agree; the telemetry motive is the observer's need, whose tradition's remedy is to name the operation and not to refactor the program, so the split bends the design to a limitation of a harness the record does not own."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The packaging of an instrument is reversible and cheap, and a delegation covering the class of decision below this node would spare the author a rename or a package move without touching the split their words fixed."
  - name: persistence
    options:
      - name: with the three shims
      - name: without them
    recommends: with the three shims
    boldness: low
    against: "The skills project the parent's mechanics as much as this node's split, and a reader of clean-context-review, where the record has declared the review skill since 2026-09-03, would find no shim there."
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
---
## Disposition

The author, 2026-09-04, in the sitting on the alignment page, after granting
its reconciliation and while its two clean-context reviews were running:

> In parallel, progress these adversarial review dispositions through mieutic then you have bootstrap authority to reconcile them immediately:
> - docompose adversarial review and adversarial review --survey into two skills so that they are differentiated in the telemetry. Recommend how to avoid drift in common instructions (is this resolved naturall by skill reconciliation?)

## Facts

### answer

`two-skills-one-package` is recommended because it is the only option on the
list that honours the author's words as they stand, two skills so that the
telemetry tells the readings apart, and answers the question the author
attached to them, how the common instructions avoid drift, without stating a
mechanism the record does not have. The split rests on the author's words and
on the record's own rule that a unit needing a second contract is two units;
the package rests on the materialization node's convention for the graph's
tooling; the common text held in the node rests on the session-context node's
rule that a rule living only in a file is invisible to the projector and to
review; and the drift answer rests on the one regeneration the record has,
the rules directory, and on the projector's lack of any skill mode. Moderate
boldness: the split and its purpose are the author's words, and the names,
the package, the fragments, the placement of the shims, and the two-sentence
answer on drift are the AI's, each grounded in a rule of the record; what
rests on the AI's knowledge alone is the reading of the harness's convention
for naming a skill, which the repository's three skills show and no node
states, and the author's premise about the telemetry, which the design
carries as a premise and does not verify.

#### one-skill-with-a-flag

The incumbent: one directory, `.claude/skills/align-review/`, whose
`SKILL.md` runs the review of a draft as `/align-review <node id>` and the
survey as `/align-review --survey`, with the scripts, both brief templates,
the fixtures and the tests beside it, as the clean-context-review node's shim
declares and its recommended text's first sentence says. What it would
answer: no, one skill runs both readings, told apart by an argument. Passed
over on the author's words of 2026-09-04, which ask for two skills so that
the telemetry tells the readings apart; one directory gives both readings one
name, and under one name the telemetry reports two populations of different
cost and duration as one.

#### two-skills-one-package

Two skills, `/align-review` for the review of a draft and `/align-survey` for
the survey, each one directory under `.claude/skills/` with one `SKILL.md`
carrying only what is specific to its reading; the mechanics of both readings
held once as the workspace package `packages/clean-context-review/`, the
brief generator, the apply script, the two brief templates with the two
fragments they share, the fixtures and the tests; the instruction text common
to both readings held in neither skill but read from the clean-context-review
node at every invocation; and the answer that skill reconciliation resolves
drift by construction at the shims' liquidation, when the projector writes
both skills from the graph, and not before, the interim being disclosed and
guarded by the currency step and the survey's validations. The split and its
purpose are the author's words of 2026-09-04; the rest is the AI's. Adopted
by the recommendation and set out in the fence.

#### two-skills-code-beside-one

Two directories, with the scripts, the templates, the fixtures and the tests
staying beside `/align-review` as they stand today and the survey's
`SKILL.md` naming them across directories. What it would answer: yes, two
skills, with the code where it is. Passed over because it makes one skill's
directory the other's dependency, so that a change to the draft skill's
directory can break the survey, and because it keeps the graph's own tooling
under `.claude/skills/`, where the materialization node's convention puts it
under `packages/` and where the root manifest's test script does not run it.

#### split-at-liquidation

The author's split honoured when the projector can write both skills from
the graph, and one skill with the flag until then, so that the two files
never exist as two hand-written copies; the telemetry's differentiation waits
on the projector's skill mode. On the table because it is the one shape in
which the drift question answers itself: two projections of one source cannot
drift from each other, and two hand-written files can. Against it: the author
asked for the telemetry now and granted the reconciliation immediately, and
the interval's drift is bounded to each reading's own text, which no other
file duplicates and which the survey's cross-reference validation reads.
Raised by the tradition survey of 2026-09-04.

#### one-skill-named-operation

One skill, with the two readings told apart in the telemetry by something
other than the skill's name, the reviewer subagent's description or a name
the skill emits at launch. What it would answer: no, the readings are told
apart at the operation and the skill stays one. It is the observability
tradition's own remedy, to name the operation rather than refactor the
program. Passed over because it rests on the telemetry attributing usage to
something other than the skill's name, which the author's premise denies and
the repository cannot verify: no telemetry configuration and no reading of it
is in the record, and a design resting on an unverifiable property of an
instrument the record does not own is not the AI's to recommend over the
author's stated premise.

### authority

Ratified, at low boldness. The record escalates toward ratified where being
wrong is expensive, irreversible or capture-shaped, and none of those holds
here: the packaging of an instrument is a rename and a move. Ratified is
recommended on a different ground, that the split is the author's own words
and is what they would want to be asked before it changes, while a
delegation covering the review's instrument would cover un-splitting it, and
that the names the record and the telemetry will cite everywhere are fixed
by this ruling. Deferred is on the fact because the record's classes are
three; it is not recommended because the author has already granted the
reconciliation, so the recommendation acts under the grant either way, and
what the ruling settles is whether the split is doctrine.

### persistence

The recommendation declares three shims on a node that carries none, the two
skill files and the package's templates and fragments, so the node's shape
changes and the fact is on the node. Low boldness: the transience node's
rule, that a shim is declared where it comes into being on the node it
projects, and the alignment page's precedent, whose shim moved to the node
whose question it answers, decide the placement. The parent's shim of
2026-09-03, which names one directory holding the scripts, describes an
artifact this recommendation supersedes; the sitting records its liquidation
as a persistence option on the parent with this node as the source, and the
two nodes rule together.

#### with the three shims

This node declares the three shims: `.claude/skills/align-review/SKILL.md`,
`.claude/skills/align-survey/SKILL.md`, and the brief templates and fragments
under `packages/clean-context-review/`, each with the projector's writing of
it as its liquidation, declared 2026-09-04; the parent's shim of 2026-09-03
is struck there as superseded.

#### without them

This node declares nothing, and the parent's shim is restated to name the
two directories and the package's templates; the skills are then described
on the node whose mechanics they run and not on the node whose question they
answer, and the parent's declaration date of 2026-09-03 stands for artifacts
that come into being on 2026-09-04.

## Recommendation

```markdown
---
question: Is each reading of the clean-context review its own skill?
form: rule
under:
  - commons.systems/disposition-graph/clean-context-review
shims:
  - artifact: "`.claude/skills/align-review/SKILL.md` on the implementation ref, the review of a draft, hand-written from the clean-context-review node, the recording node and this node"
    for: the projection of the review of a draft as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "`.claude/skills/align-survey/SKILL.md` on the implementation ref, the survey, hand-written from the clean-context-review node, the frontier-consistency node and this node"
    for: the projection of the survey as a skill of its own
    liquidation: the projector materializes the skill from ratified nodes and the hand-written file is deleted
    declared: 2026-09-04
  - artifact: "the brief templates `brief-draft.md` and `brief-survey.md` and the fragments `brief-bounds.md` and `brief-record.md` under `packages/clean-context-review/` on the implementation ref, hand-written from the nodes each summarizes"
    for: the briefs the two skills write for their readers, whose common text is one fragment filled into both
    liquidation: the brief generator fills a brief's common and reading-specific text from the nodes' answers and the hand-written templates and fragments are deleted
    declared: 2026-09-04
---
## Answer

Yes. The review of a draft and the survey are two skills, `/align-review` and `/align-survey`, each one directory under `.claude/skills/` with one `SKILL.md`: `.claude/skills/align-review/SKILL.md` runs the review of a draft and `.claude/skills/align-survey/SKILL.md` runs the survey, as the clean-context-review node divides the review by its object and the frontier-consistency node divides the validations between the two. The author's purpose is that the telemetry tells the readings apart, on the premise that the harness attributes a skill's usage to its name, which is its directory; the repository holds no telemetry configuration and no reading of it, so the premise is the author's and is not verified here. The split stands on its own ground as well. The two readings take different arguments, a node id the survey forbids and the review requires; they return different contracts, one node's verdict with its findings against a frontier's findings with the commit they read and the pins they are applied by; and they hide different decisions, what a draft's neighbourhood is against what the frontier's pins and staleness are. By the delegation node's rule that a unit needing a second contract is two units, an invocation needing a second contract is two invocations, and a flag that forbids the argument the other form requires and replaces its output is a second command wearing a flag's name. The names keep both beside `/align` in the harness's listing, since both are the alignment dialogue's review step: review is the parent node's word for the reading of one draft, and survey is the term the frontier-consistency node defines.

What the two readings share is held once, in two places by its kind. The mechanics are code, and code lives where the materialization node puts the graph's own tooling: one workspace package, `packages/clean-context-review/`, named `@commons.systems/clean-context-review` after the node whose answer it implements, declared like every package by the root manifest's workspaces, holding `brief.mjs`, which writes a reader's brief for either reading; `apply.mjs`, which applies what a reading found and reads which reading from the input's own `scope`; the templates `brief-draft.md` and `brief-survey.md`; the fragments `brief-bounds.md`, the reader's bounds, and `brief-record.md`, the primer on the record's encoding, which the generator fills into both templates at `{{bounds}}` and `{{record}}` so that the text common to the two briefs exists in one file; the fixture graph under `fixtures/`; and the tests `brief.test.mjs` and `apply.test.mjs`, which the root manifest's test script runs with every other package's. The package imports the reader from `packages/disposition` by its workspace name, `@commons.systems/disposition`, and declares `yaml`. No skill directory holds code, and neither skill imports from the other.

The instruction text common to the two readings is in neither skill, because it is the clean-context-review node's answer and each skill reads it there: a reading runs in one fresh context that carries nothing of the invoking session and is never a fork, reads the record and writes nothing to it, and its findings are validated by the invoking session on its own thread and never delegated before any is applied, as the author ruled on 2026-09-03. Each skill's first step is the currency step: fetch `origin/disposition`, the nested worktree at it with a clean tree but for a sitting's own drafts, `node packages/disposition/validate.mjs disposition`, then the clean-context-review, frontier-consistency and review-skills nodes read at their current text; where a node differs from the skill, the skill follows the node and records the difference as an un-aligned disposition on it. What each skill states of its own is only what is specific to its reading, and the two files carry no sentence in common that both must keep true.

`/align-review <node id>`, the review of a draft. The sitting invokes it the moment it records or moves a node's recommendation in substance and sets `stage: review`; the author or a session invokes it on any node at that stage; it alone forwards a node to the ruling stage, and two of its runs never wait on each other. Its `SKILL.md` carries: the object and the reader's context as the parent's paragraph on the review of a draft gives them, the node whole, the chain above it and the rules that bind everywhere, its siblings under the same parent, the nodes it names, and the index of every question the record asks, taken from the record and never from a set the session names; the brief, `node packages/clean-context-review/brief.mjs --node <id> [--date YYYY-MM-DD] [--dry]`, which writes `tmp/review/draft-<slug>.brief.md` from `brief-draft.md`, names `tmp/review/draft-<slug>.json` as the reader's output file, and prints the reader's model; the launch, one subagent of type `general-purpose` at high effort, on the model the review-model node decides, stated in this step and never argued in a brief, never a fork, told to read and follow the brief exactly, write only the output file and never run state-changing git, relaunched once with the same brief on a failure and reported on a second with the node left at its stage; the validation, the session's on its own thread, recorded as replies in `tmp/review/replies.json` and overrides in `tmp/review/overrides.json`; the apply, `node packages/clean-context-review/apply.mjs tmp/review/draft-<slug>.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--date YYYY-MM-DD]`, which appends `### Clean-context review, <date>` to the node's account with the verdict, the findings, the facts check, the viability judgment, the counter-argument with its strength and the reply, marks passed over and never removes an option the reader no longer holds viable and adds the viable one it named, and on a forward sets `stage: ruling` and writes `review` with `verdict`, `strength`, `date`, `of`, the pin of the recommendation read, and `against`, the counter-argument, and on a kickback sets the stage the reader named and writes the same; the session's judgment after the apply, amending what the reply accepts and sending an amendment of substance through this reading again; and the landing, `review: <slug> <date>` on the disposition ref, or with the sitting's own round when a sitting invoked it. Its frontmatter carries `name: align-review` and a description, and nothing of the model, which is the reader's and is passed at launch.

`/align-survey`, the survey. It takes no argument; it runs before the author rules, when the frontier shows a survey owed, and whenever a session or the author invokes it; it forwards nothing. Its `SKILL.md` carries: the object and the judged set as the parent's paragraph on the survey and the frontier-consistency node give them, the whole graph read in one context without its accounts, every node at the review or ruling stage whose recommendation has moved since the survey last pinned it judged against every other node on validations seven to fifteen; the brief, `node packages/clean-context-review/brief.mjs --survey [--date YYYY-MM-DD] [--dry]`, which writes `tmp/review/survey.brief.md` from `brief-survey.md`, names `tmp/review/survey.json`, and writes `tmp/review/survey.pins.json`, the graph commit read and the recommendation hash of every node, which the apply step compares against and never a hash the reader copied; the launch, one subagent of type `general-purpose` at high effort on the model the review-model node decides, never a fork, with the same prompt, relaunch and report as the review of a draft, and, when the generator says the brief may exceed what one reader holds, told to report what it could not read, an unread part being a gap and never a finding of nothing; the validation, the session's, in the same two files; the apply, `node packages/clean-context-review/apply.mjs tmp/review/survey.json --replies tmp/review/replies.json [--overrides tmp/review/overrides.json] [--pins tmp/review/survey.pins.json] [--date YYYY-MM-DD]`, which writes `review.survey` with its `date` and `of` on every judged node whose recommendation still matches its pin, discards with a note every finding on a node that moved since the commit read, appends `### Frontier finding, <date>` to every node a finding names and sets each such node's stage to the earliest a finding recommends for it, records each proposed option on the named node's answer fact with `source: review` and its `####` subsection, writes a subtree divergence on the leaves as `<ancestor>#<option>` in `depends` and never on the ancestor, and refuses the whole run where any node would not validate after the write; the session's judgment, a merge, split or fold recorded as an option and never done, a lateral tangle applied on the earlier-recorded node; and the landing, `review: survey <date>`, with the alignment page republished as the alignment skill says. Its frontmatter carries `name: align-survey` and a description.

Drift, and whether skill reconciliation resolves it. Until the projector writes the skills, the two `SKILL.md` files and the templates are hand-written shims, declared above, and can drift from the graph and from each other; reconciliation does not resolve that by itself, and the record does not say it does. Three things catch it in the interim. The skills state no rule of their own that both must keep true, so what can drift is each reading's own text, which no other file duplicates, and the common instructions are read from the nodes at every invocation under the currency step, which is where a stale skill is corrected and the difference recorded. The briefs' common text is one fragment filled into both. And the survey's validations read the skills as artifacts: a file named exists and a command cited runs, a shim names an artifact that exists, and every cross-reference points at what the node still says, so a skill naming a command the package no longer has, or a node naming `/align-review --survey`, is a finding. Skill reconciliation resolves drift by construction at the shims' liquidation and not before: when the projector materializes both skills from the clean-context-review, frontier-consistency, review-skills and review-model nodes, as it writes the rules directory today, one file per node, regenerated whole, with a file it wrote and no node claims deleted, the two skills are two projections of one source and nothing can drift between them. Two hand-written files are the interim the author's words accept for the telemetry's sake, and it is declared as an interim.

What this costs, as a consequence and never as a reason. Created: `.claude/skills/align-survey/SKILL.md`; `packages/clean-context-review/package.json`, `brief-bounds.md` and `brief-record.md`. Moved from `.claude/skills/align-review/` into `packages/clean-context-review/`: `brief.mjs`, `apply.mjs`, `brief-draft.md`, `brief-survey.md`, `brief.test.mjs`, `apply.test.mjs` and `fixtures/frontier/`, their imports of the reader rewritten to the workspace name, the fixture manifest's module renamed with the package, and the fixture nodes given the authority fact the reader requires of every staged node since 2026-09-04, without which thirty-nine of the fifty-seven tests fail today. Rewritten: `.claude/skills/align-review/SKILL.md`, to the review of a draft alone; the alignment skill's first and fifth sections and its section on model and delegation, where `/align-review --survey` becomes `/align-survey`. In the graph: the clean-context-review node's shim, which names one directory holding the scripts, is superseded here, and its supersession is a persistence option the sitting records on that node with this node as its source, for the author to rule on there; that node's recommended text's first sentence, "As a skill of its own, `/align-review`", is amended under the grant to name the two skills and cite this node, its standing text keeping the one-skill form for the author to rule on. Telemetry recorded under `/align-review` before the split mixes both readings.

## Rationale

The author, 2026-09-04, in the sitting on the alignment page: "docompose adversarial review and adversarial review --survey into two skills so that they are differentiated in the telemetry. Recommend how to avoid drift in common instructions (is this resolved naturall by skill reconciliation?)"

Why two skills, beyond the words. A skill is the harness's unit of invocation, and the record's rule for dividing work by contract, on the delegation node, decides the invocation surface as it decides the units: the review of a draft and the survey have different inputs, different outputs and different moments, so that a brief for one carries almost nothing of a brief for the other, twenty identical lines in some hundred and sixty, and a flag that makes the one reading's required argument the other's forbidden one is a second command whatever it is called. Each reading hides a decision the other does not need, the draft's neighbourhood against the frontier's pins, and changes for reasons the other does not share, the first six validations against the last nine; and the record already calls them readings because each is a role with its own checklist. The telemetry is the author's purpose and it is stated as two populations, a draft's reading over a neighbourhood against a survey over the whole graph, whose cost and duration under one name are one mixture no percentile of which is knowable; the tradition that names operations for exactly this reason would rather name the operation than split the program, and that remedy is unavailable only on the author's premise that the harness names by directory, which is why the answer carries the premise as the author's and rests the split on the contracts as well.

Why one package, and why it is named for the node. The mechanics of both readings are one body of code reading one graph and writing one kind of dialogue state, and the shape that keeps one implementation under two names is two names dispatching into one body; the alternative, the code beside one skill and imported across directories by the other, makes one skill the other's dependency for no reason of design. The monorepo convention is the materialization node's, and a package the root manifest's test script runs is how the graph's own tooling is tested; the package is named for the node whose answer it implements so that the projection relationship materialization requires of every artifact is legible from the name.

Why the common instruction text is the node's and not a fragment shared by the skills. A rule that lives in a skill is invisible to the projector and to review, which is the session-context node's reason for letting the orientation page state no rule of its own, and it holds for a skill; the common instructions are the parent's answer, read at every invocation by the currency step, and a shim notice on each file that says the node wins is what the transience node projects from a declaration. The briefs are different: their reader is a subagent given a brief and the record and nothing else, and the primer it needs on the record's encoding is a summary of five nodes that would otherwise be written twice, so one fragment is the least that holds it once until the generator writes it from the nodes; only the essential common text is factored, the reader's bounds and the primer, since factoring what merely looks the same today re-creates the flag inside the fragment.

Why the drift answer is conditional. The one drift-proof mechanism the record has is whole-file regeneration from a node, which exists today for the rules directory and not for skills; the projector has no skill mode, so the shims' liquidation is unbuilt, and saying that reconciliation resolves drift now would state a mechanism the record does not have. Two hand-written projections of one node are the update anomaly the record already suffered once in a hand-maintained enumeration, and the answer does not pretend otherwise: it bounds the anomaly to text no other file duplicates, reads the nodes at every invocation, and names the condition under which it ends. Waiting for that condition before splitting, which is the one shape in which the question answers itself, was passed over only because the author asked for the telemetry now and the interval is bounded and disclosed.

Why the names. Both invocations are the alignment dialogue's review step, so both keep the `align-` prefix the harness lists them under; review is the parent node's word for the reading of one draft, and survey is the term the frontier-consistency node defines, so neither name adds a word the record does not have.
```

## Account

An un-aligned disposition, recorded from the author's words the turn they
were said. It is a question of its own and not `clean-context-review`'s,
because that node's recommended option `per-draft-and-survey` decides that the
review is two readings divided by their object, and this question is about the
instrument: whether the two readings are invoked as two skills, so that the
harness's telemetry, which names a skill by its directory, tells them apart.
The author attaches a second question to it, how the instructions common to
the two readings avoid drift once they are two files, and whether that is
resolved by skill reconciliation, which this node answers with the first.

What the sitting would amend: `clean-context-review`, whose shim declares one
skill, `.claude/skills/align-review/SKILL.md` with the two briefs and the two
scripts beside it, as the projection of both readings; `decomposition`, which
names the review of a draft as one of a sitting's units and the survey as
another; and the alignment skill's §5 and the reconciliation skill, which
invoke the review by one name with a flag. The periagogic object is the skill
directory as it stands, `SKILL.md`, `brief-draft.md`, `brief-survey.md`,
`brief.mjs`, `apply.mjs` and their tests, the harness's convention that a skill
is one directory with one `SKILL.md`, and what the telemetry records of a
skill invocation.

The grant. In the words above the author granted bootstrap authority to
reconcile this disposition immediately after its maieutic movement, before
the clean-context review, which is owed on what is drafted and runs after.

### State at compaction, 2026-09-04

The maieutic movement was opened and divided into units: the tradition
survey is done, at the job's `tmp/review-sitting/traditions.md`, and the
record-and-implementation survey was running, to land at
`tmp/review-sitting/survey.md`; the design unit for this node is briefed at
`tmp/briefs/unit-design-review-skills.md` and not launched, and it runs on both
surveys, drafting the split into two skills and where the shared text lives with its options, their status, the recommendation
and its case against, and a fence. Then the main thread's adversarial reading,
the recommendation recorded here with `stage: review`, the reconciliation the
author granted immediately after maieutic, and the clean-context review.

Two findings of the tradition survey are carried here so the design reads
them. The record's rule that a draft's reviewer is never smaller than the
drafter's cites no tradition, and it reads the reviewer's strength off
boldness, which the drafter sets, so the drafter selects the strength of its
own reviewer, a separation-of-duties failure; that is the strongest argument
for the author's rule and it is nowhere in the record. And the drift question
answers itself conditionally: reconciliation resolves drift between two
skills only once the projector writes both from the graph; while the skill is
a hand-written shim, a split makes two hand-maintained copies.

### The maieutic movement, 2026-09-04

Run after the compaction. The record survey landed at the job's
`tmp/review-sitting/survey.md`, read at graph commit `5de986e6`; the design
unit ran on both surveys and read every node it leans on again at
`0a0bcb9c`, where the passed-options migration of 2026-09-04 had landed on
`clean-context-review` and recorded there the conflict
`moved-draft-re-read-by-the-survey`, moving neither that node's fence nor its
shim. The design ran on the most capable model, as the decomposition node
requires of a draft that touches an ancestor, since the fence supersedes the
parent's shim and its first sentence. This section is the unit's conclusion;
the recommendation on each fact is above, and the clean-context review has
not run on it.

**The three classes of finding.**

Within the graph. The instrument is fixed in a shim and not in an answer: the
parent's recommended text says "As a skill of its own, `/align-review`", with
no count, and the number of directories lives only in its shim's artifact
string, so a second skill falsifies the shim while no sentence of an answer
changes; the recommendation names the directories in an answer and declares
the shims where the question is asked. The division into two readings is
stated in four places, the parent's fence, `frontier-consistency`'s fence,
`decomposition`'s fence and `recording`'s option `review-divided-by-object`,
of which only `frontier-consistency` declines to restate the run mechanics;
the recommendation restates none and cites the parent for the reader's
context. `recording`'s standing answer still sends a round's dispositions to
review "one batch over the whole alignment frontier", which its own option
supersedes; that is not this node's to change and is left to the survey.
This node's account above is wrong on one claim: it names "the
reconciliation skill, which invoke the review by one name with a flag", and
`grep -n "align-review\|--survey" .claude/skills/reconcile/SKILL.md` finds
nothing, since that skill reports conflicts for alignment and never invokes
the review; the sitting amends the alignment skill alone, at its first and
fifth sections and its section on model and delegation, where the invocation
is named seven times. And the skill's mechanics, the brief paths under
`tmp/review/`, the pins sidecar, the replies and overrides files, the
relaunch-once rule and the agent type, are stated in the skill file and in no
node, which the `session-context` and `materialization` nodes make
unsupported implementation; the fence names each, so that what the two skills
carry is the record's and not the file's.

Between the graph and the AI's knowledge. That the harness's telemetry names
a skill by its directory is not determinable from the repository: no
telemetry configuration is in `.claude/settings.local.json` or the user
settings, and no node, script or skill reads per-skill usage; the account
above stated it as fact, and the recommendation states it as the author's
premise, on which the author's purpose rests and the design's other grounds
do not. The harness's convention that a skill is one directory with one
`SKILL.md` invoked as `/<name>` is what the repository's three skills show,
each with a frontmatter `name` equal to its directory, `reconcile` alone
carrying `model`, `effort` and `disable-model-invocation`. The projector has
no skill mode: `project.mjs` takes `--out`, `--rules`, `--ancestry`,
`--local`, `--frontier` and `--alignment`, so the shims' liquidation is
unbuilt, and `writeRules` is the one regeneration the record has, one file
per global-tier node written whole, with any file carrying its notice that no
node claims deleted; the second half of the drift answer is that shape
applied to skills. `node --test .claude/skills/align-review/*.test.mjs`
fails thirty-nine of fifty-seven tests in the working tree: the fixture nodes
under `fixtures/frontier/` carry a stage and no authority fact, which the
reader has required since the reconciliation of 2026-09-04, and one
fixture's `depends` is unresolved, so the count of forty-five passing that
`viable-options` records is stale and the move of the fixtures into the
package carries their repair. The workspace links
`@commons.systems/disposition` under `node_modules/@commons.systems/`, so the
package can import the reader by its workspace name rather than by a relative
path across packages. And `node packages/disposition/project.mjs disposition
--frontier -` runs at this head and lists this node at the periagogic stage, settling
nothing.

Redundant seams, measured on the skill directory. A hundred and ninety-four
of `SKILL.md`'s three hundred and forty-eight lines are common to both
readings, fifty-four of them the shim notice and the rest the currency step,
the frontier command, the launch, the validation discipline, the landing and
the model section; the two brief templates share twenty identical non-blank
lines, about a tenth of their bytes, the reader's bounds and the primer on
the record's encoding, and nothing else; `brief.mjs` is four hundred and
seventy-five shared lines against a hundred and twenty-nine for the draft and
ninety-two for the survey, `apply.mjs` six hundred and forty against a
hundred and twenty-two and seven hundred and twenty, and the two test files
two hundred and thirty-six shared against five hundred and forty-eight and
eight hundred and fifty-eight. The rule on the reader's model is stated
twice in the graph and five times in the implementation; it is
`review-model`'s question, and the fence cites that node for it. The
design's answer to the seams: the common instruction text leaves both skills
for the node that states it, the briefs' common text becomes two fragments,
and the code stays one body.

**Evaluated twice.** Fresh judgment gave the answer above: two skills
because the readings are two contracts and a flag that forbids the argument
the other requires is a second command; one package because the mechanics
are one body; the common text in the node, since a rule that lives in a
skill is invisible to the projector and to review; and drift resolved by
construction only when the projector writes the skills.

With reference to tradition, the tradition survey surfaced nine readings on
this question, and each is owed as a reading node under this one with the
resolution it informed. Information hiding, Parnas, 1972, with the single
responsibility principle, adopted for `two-skills-one-package`: the readings
hide different decisions and change for different reasons. The utility
syntax convention, POSIX and git's porcelain, adopted for the test the
answer applies: a flag modifies one operation, and `--survey` forbids the
argument the other form requires and replaces the output contract, failing
the test on both limbs. Operation naming in telemetry, the OpenTelemetry span
conventions and the RED method, adopted for the author's motive stated
exactly, two populations under one name, and diverged from in its remedy, to
name the operation rather than refactor the program, which the author's
premise makes unavailable. Inspection roles, Fagan, 1976, adopted: a reading
is a named role with its own checklist, and the record already calls them
readings. The multi-call binary and the façade, adopted for the shape of the
recommended option, two names dispatching into one body, and shelved until
now by a pre-agent constraint, that two names needed a dispatcher or a build
step nobody had; this record has a projector. Duplication of knowledge
against duplication of text, Hunt and Thomas, 1999, with Codd's update
anomaly already minted as `codd-update-anomaly` under `prose-and-structure`,
adopted for the drift answer's condition, that a derived copy is no anomaly
while it is never edited by hand and says so on its face, and that two
hand-written copies are one; a `bears` entry on this node's recommended
option is owed on that reading. Literate programming, Knuth, 1984, with the
DITA content reference, adopted for the fragments and shelved until now by a
pre-agent constraint, since a tangler that is a script inverts the cost that
retired it. The wrong abstraction, Metz, 2016, adopted as the bound on what
is factored: only the essential common text, the reader's bounds and the
primer, and nothing that merely looks the same today. The Unix rule of one
tool for one job was surfaced and bears on no option here, since the
readings do not compose and its reason for a split is absent; it is recorded
when the `readings` node's relation vocabulary admits a tradition that
neither supports nor contradicts, the gap the alignment page's tradition pass
found.

The steelman for one skill, from the traditions: the two readings share the
one decision that matters, what a clean-context reading is; split the
directory and that decision lives in two files with nothing checking that
they still agree, while the projector that would make them one is a declared
shim; and the telemetry motive is the observer's need, whose remedy is to
name the operation. It is answered in three parts, and the answer is in the
fence. The shared decision lives in neither skill: it is the parent node's
sentence, read at every invocation, and the skills state nothing of their own
that both must keep true, so the two-copies failure has no text to occur in.
The remedy of naming the operation is the option `one-skill-named-operation`,
passed over because the author's premise denies it and the record cannot
verify it. And the split does not rest on the harness's limitation alone: the
two contracts, the two checklists and the two hidden decisions make it two
invocations on the record's own `delegation` rule, so the design is not bent
to the instrument, though the telemetry, which is the author's purpose, is.
The `evaluation` node's error to hunt, an incumbent fact doing the work of a
design constraint, was looked for: the incumbent's one directory was given no
weight, and the one fact the design leans on that is not the record's, that
the harness names a skill by its directory, is a property of the harness and
not of this implementation, and the fence names it as the author's premise.

**Tested against the record it joins.** The chain above:
`clean-context-review`, `recording`, `growth`, `model`, `purpose` and
`commons.systems/public/agency`, every one unanswered, so the answer
contradicts no doctrine and the grant quoted above is what licenses its
reconciliation. The five rules that bind everywhere: `materialization`,
under which the package is the graph's own tooling under `packages/` and the
two skill files and the templates are declared shims, each naming its
artifact and its liquidation; `session-context`, which the answer leaves
untouched, since a skill is not among the three things a session loads, and
whose rule that a rule living only in a file is invisible to the projector is
why the common text is the node's; `delegation`, whose contract rule is the
ground of the split and whose bounds on a subagent are the reader's;
`evaluation`, whose lens the design was written under; and `authority`,
under which the class is recommended and no ruling is written. Two standing
unanswered texts it contradicts: the parent's recommended text, "As a skill
of its own, `/align-review`", and the parent's shim, which names one
directory holding the scripts. Both are recorded as options on the parent
with this node as their source, `two-skills` on its answer fact and the
shim's move on a persistence fact, and neither is written here as though
settled. The sibling `review-model` is not contradicted: the fence cites it
for each reader's model, and the split is what makes that question decidable
on evidence, since the telemetry then reports each reading's cost apart.
`frontier-consistency`'s rule, that how each reading is run is the parent's
and is not restated there, is honoured the same way here. The alternative
names the design considered and did not take, `/align-review-draft` with
`/align-review-survey` and `/review` with `/survey`, are recorded here and
not as options, since neither changes what the answer decides: the first
lengthens both names for a family the `align-` prefix already shows, and the
second drops the family.

**The map of decisions to fields.** The split, the two names and their
directories: the answer fact's option `two-skills-one-package` and the
fence's first paragraph. The package, its name, its contents and its
dependency: the second paragraph. The common instruction text held in the
node and read by the currency step: the third. What each skill carries: the
fourth and the fifth. Whether reconciliation resolves drift, no during
bootstrap and yes at liquidation: the sixth. The incumbent:
`one-skill-with-a-flag`, passed over with the author's words as its reason.
The code left beside one skill: `two-skills-code-beside-one`, passed over.
The traditions' steelman: `split-at-liquidation`, held viable, and
`one-skill-named-operation`, passed over. The three shims: the fence's
frontmatter and the persistence fact. The class: the authority fact,
ratified at low boldness. What the ruling waits on: `depends`, the parent's
`per-draft-and-survey` and `frontier-consistency`'s
`split-survey-from-per-draft`. The reader's model: not decided here, cited to
`review-model`. The cost, as a consequence: the fence's last paragraph of its
answer. The telemetry premise: the fence's first paragraph and the second
class of finding above.

Owed from the main thread at the recording of this recommendation and not
written by the design: the two options on `clean-context-review` named
above; this node's `stage: review`; the reconciliation the author granted,
on the implementation ref, in the shape the fence's last paragraph lists,
its commit naming the grant and the graph commit; then the review of this
draft, and the survey before any ruling. The clean-context review is owed on
this draft and runs after the reconciliation, as the author's words order it.

### Recorded, 2026-09-04

Recorded at the review stage by the main thread after its adversarial
reading, at graph commit 0a0bcb9c and later. The reading accepted the
design whole, the persistence fact included, since the fence declares shims
on a node that carried none; of the two options the design owes on
clean-context-review, the shim's supersession is recorded there as a
persistence fact with this node as its source, and the first sentence of its
recommended text was amended under the grant to name the two skills and cite
this node rather than recorded as an option, since the recommended text and
the artifact must agree once the reconciliation lands and the standing text
already holds the one-skill form; the fixture repair the fence's cost
paragraph carries was done before the split by the unit reconciling the
review scripts to the new encodings, so the move carries it already done.

At the second compaction of 2026-09-04 the reconciliation unit was briefed at the job's tmp/briefs/unit-split-review-skills.md and not launched, waiting on the unit reconciling the review scripts to the new encodings, since both write the same files; the readings unit for both nodes was running, to tmp/review-sitting/readings/; and the order that remains is on alignment-page's account.
