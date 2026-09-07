---
question: Do verifying traces and early cutoff ground the delta survey's selection on section hashes?
form: reading
stage: review
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
    recommends: as-read
    boldness: moderate
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
under:
  - commons.systems/disposition-graph/survey-selection
source: Mokhov, Mitchell and Peyton Jones, Build systems à la carte, ICFP 2018, on verifying traces and early cutoff; Shake's and Bazel's rebuild rules as the practice.
bears:
  - fact: answer
    option: the-delta-survey-with-a-periodic-whole
    relation: adopted
  - node: commons.systems/disposition-graph/dialogue
    fact: answer
    option: the-survey-block-carries-what-the-next-survey-selects-on
    relation: adopted
---
## Answer

Supports, whole. The tradition holds that a task is rerun only when an input it actually read has changed in content, which a verifying trace records as the hash of each input at the last run, and that a recomputation whose output is unchanged propagates nothing further, which is early cutoff. The answer takes both: the five section hashes the survey writes on a node are the verifying trace, the delta reruns the survey's judgment on a node only where one of those hashes moved, and the cutoff is what stops an edit to a fact's reason, to an option's accumulated support, to an account, or the fold itself, from pulling a node back into the judged set, since none of those is an input the validations read. The dialogue option this reading also bears on is where the trace is stored, on the node's own survey block, which is the tradition's rule that the trace lives with the artifact it verifies and not in a history walk.

## Rationale

Recorded in the maieutic movement on `survey-selection`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the trace and the cutoff, not the build system's scheduling, which the record does not adopt.
