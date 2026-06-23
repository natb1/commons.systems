---
id: issue-2371
statement: "Signal and feedback arm: close the alignment loop"
owner: human
status: raw
parent: issue-2100
rationale: >-
  - A `success_signal` spec per node (`observable`, `sensor`, `threshold`,
  `is_proxy`)
    plus the current `reading` and derived `gap`.
  - **Signal identification** at parse time, mirroring the CAN classifier:
    already-observable → wire it in; observable-but-uninstrumented → a sensor
    tooling-goal; proxy-only → pick an explicit, flagged proxy. Gated by the same
    push-down economics (don't build a sensor costlier than the decision it informs).
  - **Five goal-seeking effects:** re-prioritize by gap; falsify proxy goals;
  detect
    codification drift; surface new intention candidates (the practitioner ratifies —
    provenance); confirm push-downs (author-use gate).
  - **Local-first / no-mining:** prefer signals about one's own execution (CI,
  tests,
    own use) over user surveillance; generalize `/roadmap`'s
    `gather-context`/`fetch-analytics`/`fetch-psi` into pluggable per-node sensors.
reading: >-
  - A `success_signal` spec per node (`observable`, `sensor`, `threshold`,
  `is_proxy`)
    plus the current `reading` and derived `gap`.
  - **Signal identification** at parse time, mirroring the CAN classifier:
    already-observable → wire it in; observable-but-uninstrumented → a sensor
    tooling-goal; proxy-only → pick an explicit, flagged proxy. Gated by the same
    push-down economics (don't build a sensor costlier than the decision it informs).
  - **Five goal-seeking effects:** re-prioritize by gap; falsify proxy goals;
  detect
    codification drift; surface new intention candidates (the practitioner ratifies —
    provenance); confirm push-downs (author-use gate).
  - **Local-first / no-mining:** prefer signals about one's own execution (CI,
  tests,
    own use) over user surveillance; generalize `/roadmap`'s
    `gather-context`/`fetch-analytics`/`fetch-psi` into pluggable per-node sensors.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# Signal and feedback arm: close the alignment loop
