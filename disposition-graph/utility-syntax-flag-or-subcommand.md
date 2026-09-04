---
question: What does the utility syntax convention say about a flag that changes a command's contract, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: The convention separating an option from a command, in POSIX.1-2017, Base Definitions §12.2, the Utility Syntax Guidelines, which frame an option as a modifier of one utility; in the subcommand porcelain of git from 2005, after CVS and Subversion; and in the Command Line Interface Guidelines (clig.dev, 2020), on when a subcommand is warranted. Locus to be checked, the clig.dev section on subcommands, and the two-limb test the answer applies, which is this reading's synthesis of the convention and not a quotable rule from one source.
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---
## Answer

Supports the split, and is the sharpest test the survey found. The convention is that a flag modifies how one operation runs, and that a distinct name is warranted where the operation takes different arguments, produces a different output contract, and needs help of its own. POSIX says nothing about mode selectors because it frames every option as a modifier of a single utility; "one program, many modes" is precisely where that framing breaks, and the subcommand is what the practice reached for when it broke.

The record adopts the test, and the test decides the question rather than colouring it. `--survey` fails on both limbs. It makes the node id forbidden where the other form requires it, so the two invocations do not take the same arguments; and it replaces the output contract wholesale, a frontier's findings with the commit they were read at and the pins they are applied by, against one node's verdict with its findings, its facts check, its viability judgment and its counter-argument. A flag that forbids the argument the other form requires and returns a different document is a second command wearing a flag's name, and naming it as a command is the convention applied and not a preference expressed.

What the tradition does not decide is where the implementation lives. Git's porcelain is dozens of names over one program, and the convention is silent on whether the second name is a second body of code; the split it supports is a split of the invocation surface only. The package is decided on other ground, and this reading grounds no part of it.

Its own condition is loosely met and the reading says so. The two-limb test as stated is a synthesis: POSIX gives the framing, git gives the practice, and the guidelines give the advice, but none of the three states the test in those words, so what the record adopts is a formulation the AI wrote from a convention rather than a rule it can quote. The observation the test is applied to is not in doubt; the crispness of the rule is the AI's.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "The utility syntax convention, POSIX and git's porcelain, adopted for the test the answer applies: a flag modifies one operation, and `--survey` forbids the argument the other form requires and replaces the output contract, failing the test on both limbs." The account gives the adoption alone; a divergence recorded on `one-skill-with-a-flag`, which is the option the test rejects, would be the same reading seen from the other side and is not written here.

## Facts

### answer

The standing text is the only reading of the convention the survey produced,
and no second account of what the record takes from it is on the table. What
is open is the fidelity the source line names, whether the two-limb test is
the convention's or this reading's.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
