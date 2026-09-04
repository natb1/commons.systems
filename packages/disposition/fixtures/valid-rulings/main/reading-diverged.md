---
question: Does the tradition bear on the option that was not chosen?
form: reading
source: MADR, the considered options kept beside the decision
bears:
  - node: example.test/main/delegated
    fact: answer
    option: narrower
    relation: diverged
  - node: example.test/main/ratified
    fact: answer
    option: standing
    relation: adopted
under:
  - example.test/main/delegated
  - example.test/main/ratified
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    stands: standing
---

## Answer

Yes: a tradition bears on an option and not on the node, so a reading may
diverge from one option while adopting another, and "chosen over" is derived
rather than stored. This reading has two parents, so every entry names the
node it bears on.
