---
question: What does a session load, and where does it come from?
stage: ruling
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: 5022100045d3fec87a66697115d238de6eead5cc
  against: "The node's rule is right and its second shim is the counter-example to it. Session-context says a session loads three projections 'and nothing else', and that anything in them no node projects is a prune-by-default proposal — yet the harness configuration that decides the permissions and the worktree base every session runs with is declared as a shim over a file that is not in the checkout, is not on the ref, and no projection reads. The one surface with the most operational force over a session is the one the record cannot see, and the node ratifies that state as a declared interim rather than naming it as the gap it is."
  survey:
    date: 2026-09-09
    of: bf6c88ee6b04e35ad8db8744598ce1471a6076ef
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "09b7b92651a44a1467b5142e9265279297b3ae0f5c119cbad400dbd03e6d6d43"
      answer: "c6a9ec0b048a426d9d6b01abc9f36eaa0c37e97fbf0b53cde9c30c83826018cb"
      options: "9832a05efc5156f8a654479f4ed2e13581d5a9523a88cdd6a486167bbb38c3b4"
      rivals: "3db2b57b27b1f9f44dbb20ef8e0f75c3f591359180dc644ed1a46a1599b4ee47"
      words: "cba3f90a8dce6543d1c1022eece568f34cf6a4d1289be6122ddda037498727d7"
    findings:
      - finding: "Eleven of the twenty-one judged nodes claim terms in `defines` and gloss none of them, including two at the ruling stage. The header lines read, verbatim: \"- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)\" (`growth`); \"- Defines: `confirmation` (no gloss yet); `kickback` (no gloss yet); `steelman` (no gloss yet); `substance` (no gloss yet)\" (`recording`); \"- Defines: `clean-context review` (no gloss yet)\"; \"- Defines: `option` (no gloss yet); `viable` (no gloss yet); `grant` (no gloss yet)\" (`viable-options`); \"`doctrine` (no gloss yet); `proposal` (no gloss yet)\" (`authority`); \"- Defines: `neighbourhood` (no gloss yet)\" (`review-cost`); \"- Defines: `probe` (no gloss yet)\" (`author-questions`, at the ruling stage); \"- Defines: `frontier survey` (no gloss yet)\"; \"- Defines: `reading` (no gloss yet); `tradition` (no gloss yet); `adopted` (no gloss yet); `diverged` (no gloss yet); `chosen over` (no gloss yet)\" (`readings`); \"- Defines: `seam` (no gloss yet)\" (`decomposition`); \"- Defines: `session context` (no gloss yet); `rules` (no gloss yet)\" (`session-context`, at the ruling stage). Two of them are worse than empty. `authority` glosses both its terms in its own answer — \"Doctrine is the ratified answers taken together.\" and \"A proposal is technical vocabulary and is not overloaded\" — so the definition exists everywhere but the entry the term index reads. And `viable-options` claims `grant` while `what-acts-during-bootstrap` defines the same thing under another name: \"`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant.\" The mechanical tier does not reach any of this: `term-without-a-path` reports only a used term \"with no path to it over 'under', 'depends' or 'cites'\", which presupposes a definer and never asks whether the definer said anything."
        kind: "vocabulary"
        status: "new"
        since: "2026-09-09"
        supports:
          - "question"
          - "answer"
          - "options"
          - "rivals"
          - "words"
        discharge: "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it"
        nodes:
          - "commons.systems/disposition-graph/session-context"
          - "commons.systems/disposition-graph/growth"
          - "commons.systems/disposition-graph/recording"
          - "commons.systems/disposition-graph/clean-context-review"
          - "commons.systems/disposition-graph/viable-options"
          - "commons.systems/disposition-graph/authority"
          - "commons.systems/disposition-graph/review-cost"
          - "commons.systems/disposition-graph/author-questions"
          - "commons.systems/disposition-graph/frontier-consistency"
          - "commons.systems/disposition-graph/readings"
          - "commons.systems/disposition-graph/decomposition"
          - "commons.systems/disposition-graph/what-acts-during-bootstrap"
    pairs:
      - with: "commons.systems/disposition-graph/alignment-page"
        keys:
          - "parent:commons.systems/disposition-graph/projection"
      - with: "commons.systems/disposition-graph/attention"
        keys:
          - "term:boost (defines: commons.systems/disposition-graph/attention)"
          - "cites"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/frontier-metrics"
        keys:
          - "parent:commons.systems/disposition-graph/projection"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:propose (defines: commons.systems/disposition-graph/growth)"
          - "cites"
      - with: "commons.systems/disposition-graph/materialization"
        keys:
          - "term:package (defines: commons.systems/disposition-graph/materialization)"
          - "cites"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/purpose"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/session-state"
        keys:
          - "term:staging store (defines: commons.systems/disposition-graph/session-state)"
          - "words:words/2026-09-08/21"
          - "cites"
      - with: "commons.systems/disposition-graph/tier"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/transience"
        keys:
          - "cites"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:ceiling (defines: commons.systems/disposition-graph/under)"
          - "cites"
      - with: "commons.systems/disposition-graph/vocabulary-view"
        keys:
          - "parent:commons.systems/disposition-graph/projection"
      - with: "commons.systems/disposition-graph/web-routing"
        keys:
          - "parent:commons.systems/disposition-graph/projection"
      - with: "commons.systems/disposition-graph/what-acts-during-bootstrap"
        keys:
          - "term:bootstrap authority (defines: commons.systems/disposition-graph/what-acts-during-bootstrap)"
          - "cites"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "cites"
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
        supports:
          - words/2026-09-03/76
      - name: commit-settings-json
        source: review
        ref: "2026-09-03"
      - name: context-moves-here
        source: review
        ref: "2026-09-03"
      - name: strike-ledger-sunset-dependency
        source: review
        ref: "2026-09-03"
      - name: shim-names-an-existing-artifact
        source: review
        ref: "2026-09-03"
      - name: rules-projection-declared-a-shim
        source: commons.systems/disposition-graph/what-acts-during-bootstrap
        ref: "2026-09-05"
      - name: delete-claude-md
        source: ai
        ref: "d078c119"
        status: passed
        reason: "the arriving-session function is real for the audience and costs one projected page"
      - name: operating-rules-in-claude-md
        source: ai
        ref: "d078c119"
        status: passed
        reason: "the projector cannot see them there"
      - name: skills-among-what-a-session-loads
        source: commons.systems/disposition-graph/unit-skills
        ref: "2026-09-07"
      - name: the-harness-memory-is-a-fourth-thing-loaded
        source: commons.systems/disposition-graph/session-state
        ref: "2026-09-08"
        supports:
          - words/2026-09-08/21
    recommends: standing
    boldness: low
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Facts

### answer

#### standing

From three projections and nothing else.

**AI support.** The author's ruling of 2026-09-02 that `CLAUDE.md` must be justified and materialized by disposition like rules and `CLAUDE.local.md`, with the question whether it serves any function rules do not. Evaluated against the harness: rules and `CLAUDE.md` are both always-loaded instructions; rules are scoped to the project root and may be scoped to paths, `CLAUDE.md` is scoped to the working directory and its ancestors and may import files; skills load on invocation; memory is private to one account and one path, so it can carry nothing the record needs. The functions that had accumulated in the bootstrap `CLAUDE.md` map as follows: the token-efficiency rule and the loop to the growth node and the skill; the code-review recipe to the review node's instrument; environment traps to evidence on the node whose instrument they qualify; the round log and the decisions list to git history. Traditions to record as readings: the Unix `README` and `INSTALL` convention, adopted, orientation kept apart from rules; twelve-factor configuration, one home per fact, adopted. The exit conditions this shim carried until 2026-09-03 are the liquidation condition of the reconciliation shim on the work-loop node, where the bootstrap operations now live.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

From three projections and nothing else. Rules, one file per global-tier node under `.claude/rules/`, carry the doctrine every session works under; the projector regenerates them, each headed by the node it projects, and a rule no node projects is unsupported implementation. `CLAUDE.local.md`, written into a bite's worktree at provisioning and never committed, carries the ancestry of the node the bite serves, pinned at a graph commit. `CLAUDE.md`, committed at the root, is the orientation page an AI session reads first: what this repository is, where its record lives, and how a session reads and writes it, projected from the purpose node and from the projection node. It states no rule of its own, because a rule that lives only there is invisible to the projector and to review. The one function `CLAUDE.md` serves that rules do not is orientation: it is the surface an arriving session, or the AI a newcomer arrives with, reads first, and the harness loads it by directory, so a nested checkout inherits it. Anything in any of the three that no node projects is on the frontier as a prune-by-default proposal.
```

#### commit-settings-json

The shim coverage finding verified that this node's declared shim named a settings file on the implementation ref that is not tracked there at all, so the shim named an artifact that does not exist. It gave two fixes: commit `.claude/settings.json` to the ref, which is what the shim said, or restate the artifact as harness configuration held outside the ref with that as part of the liquidation condition. The session took the restatement and the shim now reads that way, so the alternative pending for the author is the first: the harness configuration becomes a projected, committed artifact rather than a file in the author's checkout. It bears on what a session loads, since the settings decide the permissions and the worktree base a session runs with. Raised on commons.systems/disposition-graph/transience.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

The shim coverage finding verified that this node's declared shim named a settings file on the implementation ref that is not tracked there at all, so the shim named an artifact that does not exist. It gave two fixes: commit `.claude/settings.json` to the ref, which is what the shim said, or restate the artifact as harness configuration held outside the ref with that as part of the liquidation condition. The session took the restatement and the shim now reads that way, so the alternative pending for the author is the first: the harness configuration becomes a projected, committed artifact rather than a file in the author's checkout. It bears on what a session loads, since the settings decide the permissions and the worktree base a session runs with. Raised on commons.systems/disposition-graph/transience.
```

#### context-moves-here

The decomposition finding on `under` proposes that the term 'context' move from under's `defines` to this node's, since session-context already answers what a session loads and where it comes from while under answers four questions at once. Verified: under's defines carries under, rank, ceiling and context, and this node's carries session context and rules. Adopting it adds one entry to the frontmatter and lets under be drafted as the edge alone. Raised on commons.systems/disposition-graph/attention, commons.systems/disposition-graph/under.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

The decomposition finding on `under` proposes that the term 'context' move from under's `defines` to this node's, since session-context already answers what a session loads and where it comes from while under answers four questions at once. Verified: under's defines carries under, rank, ceiling and context, and this node's carries session context and rules. Adopting it adds one entry to the frontmatter and lets under be drafted as the edge alone. Raised on commons.systems/disposition-graph/attention, commons.systems/disposition-graph/under.
```

#### strike-ledger-sunset-dependency

Session-context's account carries 'Depends on: ledger-sunset', which names no node; the ledger was liquidated on 2026-09-03, so the dependency is met. The finding proposes striking it, as growth's own two dangling dependencies were struck, since a question that lives only on a page beside the record is what transience rejects. (Raised on commons.systems/disposition-graph/growth.)

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

Session-context's account carries 'Depends on: ledger-sunset', which names no node; the ledger was liquidated on 2026-09-03, so the dependency is met. The finding proposes striking it, as growth's own two dangling dependencies were struck, since a question that lives only on a page beside the record is what transience rejects. (Raised on commons.systems/disposition-graph/growth.)
```

#### shim-names-an-existing-artifact

The harness-configuration shim names an artifact that exists. Verified on 2026-09-03 that `.claude/settings.json` is in neither the implementation ref nor the author's checkout, so the shim as restated names nothing a reader or the frontier can reach, while `.claude/settings.local.json` is present and gitignored. On this alternative the shim's artifact becomes the settings file that exists, with its exclusion from the ref stated as part of the liquidation condition, and CLAUDE.md's sentence about `worktree.baseRef` is reconciled to whatever file actually carries it. The alternative to it is that the author writes the file the shim names, which changes no text; the choice is the author's because it decides whether the harness configuration is a projected artifact of the record or a fact of the author's machine.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

The harness-configuration shim names an artifact that exists. Verified on 2026-09-03 that `.claude/settings.json` is in neither the implementation ref nor the author's checkout, so the shim as restated names nothing a reader or the frontier can reach, while `.claude/settings.local.json` is present and gitignored. On this alternative the shim's artifact becomes the settings file that exists, with its exclusion from the ref stated as part of the liquidation condition, and CLAUDE.md's sentence about `worktree.baseRef` is reconciled to whatever file actually carries it. The alternative to it is that the author writes the file the shim names, which changes no text; the choice is the author's because it decides whether the harness configuration is a projected artifact of the record or a fact of the author's machine.
```

#### rules-projection-declared-a-shim

The rules projection is declared a shim on this node beside `CLAUDE.md` and the
harness configuration: the files under `.claude/rules/` stand in for the
doctrine each node's ruling will supply, so that the rule files every session
loads act as this record's interim doctrine while the nodes they project are
unruled, and each falls away as the node it projects is ruled. It answers, at
the node that owns the projection, the case the `what-acts-during-bootstrap`
node records against its own answer: that nothing that answer names is what the
doctrine the machine is running on is, since nine rule files are projected from
nine nodes no ruling reaches, and by that node's "Nothing else acts by right"
they are neither of the two things that act.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, a shim over nine files
projected from nine unruled nodes is one declaration standing in for the whole
of the record's present operation, which is the thing a shim is least well
shaped to be. The option on that node
which offers the same answer written as a limb of its own text is
`projected-doctrine-acts`, and each names the other, so a ruling for one is not
read as a ruling for both. Raised by the clean-context reading of
`commons.systems/disposition-graph/what-acts-during-bootstrap` on 2026-09-05,
which found that half of that node's option `projected-doctrine-acts` was never
that node's to carry, this node's frontmatter being what would hold the
declaration.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

The rules projection is declared a shim on this node beside `CLAUDE.md` and the
harness configuration: the files under `.claude/rules/` stand in for the
doctrine each node's ruling will supply, so that the rule files every session
loads act as this record's interim doctrine while the nodes they project are
unruled, and each falls away as the node it projects is ruled. It answers, at
the node that owns the projection, the case the `what-acts-during-bootstrap`
node records against its own answer: that nothing that answer names is what the
doctrine the machine is running on is, since nine rule files are projected from
nine nodes no ruling reaches, and by that node's "Nothing else acts by right"
they are neither of the two things that act.
```

#### delete-claude-md

`CLAUDE.md` is deleted and rules carry everything. It was passed over because
the arriving-session function is real for the audience and costs one projected
page.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

`CLAUDE.md` is deleted and rules carry everything. It was passed over because
the arriving-session function is real for the audience and costs one projected
page.
```

#### operating-rules-in-claude-md

Operating rules stay in `CLAUDE.md` beside the orientation. It was passed over
because the projector cannot see them there, so a rule that lives only in that
page is invisible to review.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

Operating rules stay in `CLAUDE.md` beside the orientation. It was passed over
because the projector cannot see them there, so a rule that lives only in that
page is invisible to review.
```

#### skills-among-what-a-session-loads

The standing answer with a fourth projection: the skills under
`.claude/skills/`, one directory per unit or reading, each projected from the
node whose answer it carries and declared a shim until the projector writes it,
are what a session loads when it invokes one, so that the enumeration covers
every file that instructs a session and not only the three it names. Raised on
`unit-skills`, which cites this node for the rule that a rule living only in a
file is invisible while adding five such files.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: What does a session load, and where does it come from?
form: rule
boost: 7
under:
  - commons.systems/disposition-graph/projection
tier: global
defines:
  - session context
  - rules
shims:
  - artifact: "`CLAUDE.md` on the implementation ref, the orientation page, hand-written since 2026-09-03 when the operating rules it carried moved to the alignment and reconciliation skills"
    for: the orientation page this node projects
    liquidation: the projector regenerates the file from the purpose and projection nodes
    declared: 2026-09-02
  - artifact: "`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03, since the harness refuses the session that write: worktrees branch from the checkout's own head, and the permissions a session runs with"
    for: the harness configuration no node yet answers for
    liquidation: a node answers what the harness is configured to, and the projector writes the file
    declared: 2026-09-03
---

## Answer

The standing answer with a fourth projection: the skills under
`.claude/skills/`, one directory per unit or reading, each projected from the
node whose answer it carries and declared a shim until the projector writes it,
are what a session loads when it invokes one, so that the enumeration covers
every file that instructs a session and not only the three it names. Raised on
`unit-skills`, which cites this node for the rule that a rule living only in a
file is invisible while adding five such files.
```

#### the-harness-memory-is-a-fourth-thing-loaded

The standing answer with the harness's own store named: a memory private to one account
and one path is loaded into every session in this checkout, so the enumeration either
names it and says what liquidates it, or the record's own test puts it on the frontier
as a prune-by-default proposal. Raised on `session-state`, where the author proposed
that store as the staging store's mechanism.

**AI support.** It is an observation and not a proposal: the store is loaded today, and
the answer's word is "nothing else". What has changed since the record last looked at
this is what makes re-raising it more than thrashing. `standing`'s own reading examined
the harness's memory in 2026-09-02 and set it aside on the ground that it "is private to
one account and one path, so it can carry nothing the record needs". The author's words
of 2026-09-08 propose it carry something the record does need, their own words while a
sitting has not yet classified them, and that strikes the reason the option was left.

**AI divergence.** The enumeration may be about what projects the instruction a session
works under rather than about every byte that reaches a context, and the harness's memory
projects nothing, in which case this is a category confusion and not a gap. Naming it
also legitimises a store the record cannot see, cannot validate and cannot review, which
is a larger concession than the sentence it adds looks like.

**Content.**

From: standing

```diff
@@ -22,3 +22,9 @@
 ## Answer
 
 From three projections and nothing else. Rules, one file per global-tier node under `.claude/rules/`, carry the doctrine every session works under; the projector regenerates them, each headed by the node it projects, and a rule no node projects is unsupported implementation. `CLAUDE.local.md`, written into a bite's worktree at provisioning and never committed, carries the ancestry of the node the bite serves, pinned at a graph commit. `CLAUDE.md`, committed at the root, is the orientation page an AI session reads first: what this repository is, where its record lives, and how a session reads and writes it, projected from the purpose node and from the projection node. It states no rule of its own, because a rule that lives only there is invisible to the projector and to review. The one function `CLAUDE.md` serves that rules do not is orientation: it is the surface an arriving session, or the AI a newcomer arrives with, reads first, and the harness loads it by directory, so a nested checkout inherits it. Anything in any of the three that no node projects is on the frontier as a prune-by-default proposal.
+
+The enumeration is exclusive and the record checks it against the harness it runs on.
+Where the harness loads a store of its own into every session, a memory private to one
+account and one path among them, that store is a fourth thing a session loads: it is
+named here and liquidated, or it is on the frontier as a prune-by-default proposal
+like anything else no node projects.
```

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Frontmatter, second shim: the artifact is '`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03'. Verified absent from the checkout as well as from the ref: `ls .claude/settings.json` fails, and the only settings file present is `.claude/settings.local.json`, gitignored and last modified long before the stated date. Transience requires a shim to 'name the artifact'; this one names a file that exists nowhere the frontier or a reader can reach. The restatement made on 2026-09-03 moved the shim from an untracked file to a nonexistent one. Suggested edit: name the file that exists, or the author writes the one the shim names.
- The same file is asserted by CLAUDE.md, which this node declares as its first shim: 'a session that isolates itself branches from this checkout's head when `.claude/settings.json` sets `worktree.baseRef` to `head` (written by the author at the transition of 2026-09-03)'. The orientation page an arriving session reads first states a configuration fact that cannot be verified from the checkout.
- Answer, sentence 2: 'Rules, one file per global-tier node under `.claude/rules/`'. Verified true: five nodes carry `tier: global` (authority, delegation, evaluation, materialization, session-context) and `.claude/rules/` holds exactly those five files. The earlier finding is resolved.
- Rationale cites 'The author's ruling of 2026-09-02 that `CLAUDE.md` must be justified and materialized by disposition' but quotes no ruling of that date; the only quotation on the node is the 2026-09-03 one about shims. Same pattern as the other nodes recommending ratified without a quoted ruling.

On the three facts: The frontmatter recommendation (adopts standing, ratified, low) states one class and one value and the pin is current; low is right for a rule close to the author's words. Persistence as stated overstates what exists: the node declares two shims and one of them names an artifact that is not in the checkout, so the record claims an interim materialization that is not there. The prose Facts line still says 'the shim', singular, where the node declares two.

Strongest counter-argument (strong): The node's rule is right and its second shim is the counter-example to it. Session-context says a session loads three projections 'and nothing else', and that anything in them no node projects is a prune-by-default proposal — yet the harness configuration that decides the permissions and the worktree base every session runs with is declared as a shim over a file that is not in the checkout, is not on the ref, and no projection reads. The one surface with the most operational force over a session is the one the record cannot see, and the node ratifies that state as a declared interim rather than naming it as the gap it is.

The session's reply: Forward accepted, with the strong counter-argument standing. Verified on this thread that `.claude/settings.json` exists neither on the ref nor in the checkout, and that the user-level settings carry no worktree base either, so the shim names nothing; the alternative shim-names-an-existing-artifact is recorded and the author rules. CLAUDE.md's sentence is an implementation matter for the reconciliation skill and is reported to the author.

### Frontier finding, 2026-09-03

Kind: coverage.

Two of the record's declared shims fail transience's own requirements, and both failures are new since the last round. Session-context declares '`.claude/settings.json` in the author's checkout and not on the implementation ref, harness configuration the author writes at the transition of 2026-09-03': verified there is no such file anywhere — `ls .claude/settings.json` fails in the author's checkout, `git ls-files .claude/` lists only rules and skills, and the only settings file present is `.claude/settings.local.json`, gitignored and last modified long before the stated date. The restatement made on 2026-09-03, which moved the shim from a file not on the ref to a file 'in the author's checkout', moved it to a file that is not there either, so the shim names no artifact at all. CLAUDE.md, which this same node declares as its other shim, asserts the same file: 'a session that isolates itself branches from this checkout's head when `.claude/settings.json` sets `worktree.baseRef` to `head` (written by the author at the transition of 2026-09-03)'. Separately, materialization's second shim, '`packages/disposition` resolving the `yaml` package it declares from an ancestor `node_modules`, the workspace not installing it', has had its liquidation condition met: `node_modules` now exists at the workspace root and `require.resolve('yaml', {paths:['./packages/disposition']})` returns /home/n8/natb1/commons.systems/node_modules/yaml/dist/index.js, the workspace's own install. Transience: 'a shim whose condition is met and which still exists is a frontier item', and the flagging of a met condition is itself unmaterialized, so neither shows anywhere.

Also named: commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/transience.

Proposed: Transience is the survivor of the shim rule and is unruled; nothing in its text need change for this finding. Session-context's shim either names an artifact that exists — `.claude/settings.local.json`, with its exclusion from the ref as part of the liquidation — or the author writes `.claude/settings.json` and the shim stands as it reads, which is a change to the world and not to the record; the alternative below carries the record branch, and either way CLAUDE.md's claim about the file should be checked before the next session relies on it. Materialization's already-pending `strike-met-yaml-shim` is confirmed by this reading and should be taken rather than left as an option: the condition is met and the declaration is a frontier item by transience's own rule. Transience's `instrument-note-as-a-declared-shim` alternative is what would make both visible, since the note recording that a met condition is not flagged is itself the stand-in transience calls a shim.

Recorded as a pending alternative on this node: `shim-names-an-existing-artifact` (source review, 2026-09-03).

### Boost raised to hold the author's order, 2026-09-03

The boost was raised from six to seven when `alignment-page` was minted under `projection` at the author's direction: the new sibling divided `projection`'s rank one more way and dropped this node to exactly `work-loop`'s rank, which the `order` field on `scope` forbids and the validator refuses. Nothing in the answer, the rationale, or the dialogue changed, and the recommendation is re-pinned to the amended standing text; the earlier review's pin is left as it was, so the frontier flags this node's text as changed since that review, which is true of its frontmatter and of nothing else.

### Stopgap grant on CLAUDE.md, 2026-09-04

The author, 2026-09-04, while the alignment-page sitting was in hand:

> side note: as a stopgap for rule reconciliation, you have bootstrap authority to reconcile the greenfield disposition to CLAUDE.md. This does not require a disposition or shim, it will be fixed when we get to rule reconciliation.

Recorded here and not as an alternative, because the author states it is not a
disposition and asks for no shim. It is a permission shim bypass of the kind
`authority` names, spent on one reconciliation: this node's answer says
`CLAUDE.md` "states no rule of its own, because a rule that lives only there is
invisible to the projector and to review", and the grant authorises exactly
that for the greenfield lens of `evaluation`, on the author's own statement
that rule reconciliation will fix it. What the grant does not authorise is
carried nowhere: it names CLAUDE.md and the greenfield disposition, and no
other file and no other rule.

The liquidation is the author's: when rules are reconciled, the greenfield lens
is projected from `evaluation` like every other rule and the hand-written
paragraph is deleted from CLAUDE.md. Until then the paragraph is unsupported
implementation by this node's own standard, and it says so in its own text so
that the frontier finds it.

Unrelated and still open on this node: the shim asserting `.claude/settings.json`
in the author's checkout, which the review of 2026-09-03 found names no file.
Verified again on 2026-09-04 and it still names no file; CLAUDE.md repeats the
claim. The grant does not reach it and it is left for the ruling.

### An option from what-acts-during-bootstrap's reading, 2026-09-05

That node's option `projected-doctrine-acts` offers two places for its third
limb, the node's own answer or a shim declared here over the rules projection,
and says the option covers both. The second is not that node's to decide: the
shims this node's answer governs are declared in this node's frontmatter, which
carries two, over `CLAUDE.md` and over the harness configuration, and neither
reaches `.claude/rules/`. The alternative is recorded here as
`rules-projection-declared-a-shim` so the author has a row at the node that
would carry the declaration. It is not recommended and nothing is settled by
recording it; adding it moves no pin, this node recommending `standing`, which
carries no subsection.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The answer says a session loads "three projections and nothing else", that `CLAUDE.md` "states no rule of its own", and that "a rule no node projects is unsupported implementation". The committed `CLAUDE.md` at the repository root states one rule of its own, "How a recommendation is made", under a stopgap the author granted on 2026-09-04, and its own shim notice says so: "It states one rule of its own and no other". So the answer is presented for ratification in a state its own text classifies as unsupported implementation, and the node declares no shim covering it. The shim notice names its liquidation; the answer should carry that liquidation as a declared shim, or say why a stopgap on the orientation page needs none.

Strongest counter-argument (strong): The answer's discipline — three projections, no rule outside a node, everything else on the frontier as a prune-by-default proposal — is stated in the present tense about a record that does not meet it: `CLAUDE.md` states a rule of its own by its own admission, and the frontier that would carry the residue as a proposal is the second direction of `work-loop`, which begins only at exit and which no instrument derives. Ratifying it makes a description of an intended state read as a description of the actual one, in the one file every session loads first.

The session's reply: Taken, and the finding is the more precise of the two: the answer describes an intended state in the present tense, in the one file every session loads first, while `CLAUDE.md` states a rule of its own by its own admission and the frontier that would carry the residue does not exist. The session records that the answer must either declare the stopgap as a shim with the liquidation the page already names, or say why the orientation page needs none. The option `rules-projection-declared-a-shim` added on 2026-09-05 is a different question and does not cover this one.

### The rules projection can be checked, 2026-09-05

Under the author's grant of 2026-09-04, `project.mjs --rules <dir> --check`
was added and landed on `greenfield` at `77a45889`. A rule file is a projection
of a `tier: global` node's answer, and the amendment that stales it lands on the
`disposition` ref while the projection lands on `greenfield`, so the
regeneration is owed across a ref boundary and is easy to miss; it was missed
twice on 2026-09-05. The check writes nothing and names each file that is
missing, stale, or projected from a node no longer `tier: global`, exiting
non-zero when any is. The alignment skill runs it in its currency check and
reports what it finds, and the reconciliation skill keeps the write and gains
the read-only form. This is the mechanics of the projection this node's answer
requires and mints no rule of its own.

### `CLAUDE.md` states no rule of its own, 2026-09-05

The stopgap section "How a recommendation is made" met its own liquidation
condition and was deleted, landed on `greenfield` at `87e4b24e` under the
author's grant of 2026-09-04. Its notice named the condition: rules reconciled
and the projector writing the rule from `evaluation` like every other rule.
`evaluation` is `tier: global`, `.claude/rules/evaluation.md` is projected from
it, carries the rule in fuller form, and `--rules --check` reports it current. So
the section had stopped standing in for a projection that does not exist and had
become a second, hand-maintained copy of one that does — invisible to the check
and certain to drift at the next amendment of `evaluation`, which is the failure
this answer's sentence names. The page's shim notice now records the deletion and
the page states no rule of its own.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/session-context stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `standing`; the `## Rationale` its `**AI support.**`; 1 `## Disposition` entry became the ledger entry words/2026-09-03/76, referenced by 0 options the entry's own date names and by the recommended option for 1 the date named none; and `stands` left the answer fact. The record wrote no text of its own for `commit-settings-json`, `context-moves-here`, `strike-ledger-sunset-dependency`, `shim-names-an-existing-artifact`, `rules-projection-declared-a-shim`, `delete-claude-md`, `operating-rules-in-claude-md`, `skills-among-what-a-session-loads`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `5022100045d3fec87a66697115d238de6eead5cc` was already past the recommendation and is left as it stood. The survey's pin `8ade4e832717a6c3bf0fb4b7910f19bad0f1324f` is re-computed for the encoding as `6caaebc0f48522074d2c2b4756dfda8a811afb1c`; nothing it read changed.

### The count was eight and is nine, 2026-09-08

Three sentences on this node said eight rule files are projected from eight unruled
nodes: two in the same paragraph of an option, once in its prose and once inside its
content fence, and one in that option's divergence. The directory holds nine. The
ninth arrived when a global-tier node was minted after the sentences were written, which
is the ordinary way this number moves and will move again.

The count is corrected rather than removed, because it is doing work: the argument is
that the shim covers the whole of the record's present operation, and how many files
that is, is the measure of how much. But a hand-written count of a directory that grows
is a fact of the day dressed as a proposition, and this is the second time in two days
the record has found one stale in its own prose. The durable form is a count the
projector writes, and the projector already knows the number, since it is the projector
that decides which nodes are global-tier and writes one file per node. Recorded here as
an item for whoever answers this node: prose that must carry a count should carry it
from the instrument, or should be written so it does not need one.

The amendment does not stale this node's rule projection, and the sitting checked rather
than assumed. The three sentences are in `rules-projection-declared-a-shim`, which is a
rival; the recommendation on this fact is `standing`, so the projector reads a different
fence and `--rules --check` reports the rules current. The sitting first wrote the
opposite here, on the assumption that a corrected count in a content fence must reach the
projection, and struck it when the check disagreed. Worth keeping as an instance: which
option a fence belongs to decides whether an edit is a projection change or a note in the
dialogue, and the two look identical in a diff.

### An expert arrived at this node's rival from outside the record, 2026-09-08

`rules-projection-declared-a-shim` holds that the projected rule files act as this
record's interim doctrine while the nodes they project are unruled, each falling away as
its node is ruled. It is a rival here, not the recommendation, and it was written by this
record about itself.

On the same day an expert convened on `what-acts-during-bootstrap`, grounded in the
constitution of a founding order and given that node and its neighbourhood, arrived at
the same design without being shown this option. Its argument comes from the other
direction: a transitional body always runs on some norms, so the only choice is whether
they are written, published and reviewable or tacit, and that is what an interim
constitution is for. It found the same nine files, drew the same conclusion that they are
the doctrine in operation, and minted
`interim-doctrine-binds-as-last-seen` on that node, which is
`rules-projection-declared-a-shim`'s proposition plus a pin at the graph commit the
author last saw.

Two nodes now carry the same design from two independent derivations, one from the
record's own operation and one from a tradition outside it. That is the strongest form of
support this record can presently record for anything, and it is worth saying plainly
that it is also thin: two derivations agreeing is not two parties agreeing, since the AI
composed the brief that produced the second. What it does establish is that the option is
not an artifact of how this record happens to describe itself.

What follows is a question, not a move. The two nodes would answer the same question
differently placed -- this one at the projection that writes the files, that one at the
authority that says what acts -- and neither answer references the other. Nothing is
moved here, because a recommendation that changed on this fact would change what the
projector writes for every session, and that is the author's to rule. It is recorded so
that whoever takes either node sees both.

### Frontier survey, 2026-09-09, of bf6c88ee

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The node stands at the ruling stage defining neither of the terms it claims: "- Defines: `session context` (no gloss yet); `rules` (no gloss yet)", while its binding answer uses one of them as a term of art — "From three projections and nothing else. Rules, one file per global-tier node under `.claude/rules/`, carry the doctrine every session works under". The question the author would rule on is "What does a session load, and where does it come from?", and the answer to it turns on a word the node undertakes to define and leaves empty.

Strongest counter-argument (moderate): This is the node closest to a ruling — stage `ruling`, recommending `standing` — and it is the node whose two defined terms are both empty. What the author would confirm is that a session loads three projections and nothing else, where `rules` is one of the three and is defined nowhere the term index can read; a later session reading the projection has the sentence and not the definition. Confirming a load rule whose central term is undefined fixes the boundary of what every session sees without fixing what the boundary is drawn around.

The session's reply: Kept, and it is the sharpest instance of the vocabulary finding because of where this node stands. It is at the ruling stage recommending `standing`, and both terms it claims are empty. What the author would confirm is that a session loads three projections and nothing else, where `rules` is one of the three and is defined nowhere the term index can read. The fill is bookkeeping and no stage moves for it, but it is owed before this node goes to the author rather than after.

### Frontier finding, 2026-09-09

Kind: vocabulary.

Eleven of the twenty-one judged nodes claim terms in `defines` and gloss none of them, including two at the ruling stage. The header lines read, verbatim: "- Defines: `propose` (no gloss yet); `project` (no gloss yet); `ratify` (no gloss yet); `steer` (no gloss yet); `periagogic` (no gloss yet); `maieutic` (no gloss yet); `boldness` (no gloss yet)" (`growth`); "- Defines: `confirmation` (no gloss yet); `kickback` (no gloss yet); `steelman` (no gloss yet); `substance` (no gloss yet)" (`recording`); "- Defines: `clean-context review` (no gloss yet)"; "- Defines: `option` (no gloss yet); `viable` (no gloss yet); `grant` (no gloss yet)" (`viable-options`); "`doctrine` (no gloss yet); `proposal` (no gloss yet)" (`authority`); "- Defines: `neighbourhood` (no gloss yet)" (`review-cost`); "- Defines: `probe` (no gloss yet)" (`author-questions`, at the ruling stage); "- Defines: `frontier survey` (no gloss yet)"; "- Defines: `reading` (no gloss yet); `tradition` (no gloss yet); `adopted` (no gloss yet); `diverged` (no gloss yet); `chosen over` (no gloss yet)" (`readings`); "- Defines: `seam` (no gloss yet)" (`decomposition`); "- Defines: `session context` (no gloss yet); `rules` (no gloss yet)" (`session-context`, at the ruling stage). Two of them are worse than empty. `authority` glosses both its terms in its own answer — "Doctrine is the ratified answers taken together." and "A proposal is technical vocabulary and is not overloaded" — so the definition exists everywhere but the entry the term index reads. And `viable-options` claims `grant` while `what-acts-during-bootstrap` defines the same thing under another name: "`bootstrap authority` — The author's grant, given explicitly in their words for one alignment sitting and reaching every alignment in it; the term is the author's, and the grant is the thing this node calls a grant." The mechanical tier does not reach any of this: `term-without-a-path` reports only a used term "with no path to it over 'under', 'depends' or 'cites'", which presupposes a definer and never asks whether the definer said anything.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/clean-context-review, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/review-cost, commons.systems/disposition-graph/author-questions, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/decomposition, commons.systems/disposition-graph/what-acts-during-bootstrap.

Proposed: Each node fills the glosses it claims, which is a fill and not a redraft, so no stage is owed for it and none is named here except where the answer itself is implicated. The two exceptions: `authority`'s glosses are copied from its own answer, which is bookkeeping; and `viable-options` and `what-acts-during-bootstrap` settle between them who defines the grant, since one claims the term with nothing behind it and the other defines the thing under the name `bootstrap authority` — the survivor is `what-acts-during-bootstrap`, which has the author's own term and a gloss, and `viable-options` drops the claim or points at it. A node that cannot gloss a term it claims is claiming a term it does not own, and dropping the entry is the other way to close it.
