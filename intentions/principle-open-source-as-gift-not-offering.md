---
id: principle-open-source-as-gift-not-offering
statement: Open Source as Gift, Not Offering
owner: human
status: codified
parent: null
rationale: >-
  Open source got captured because it optimized for *code* portability while
  leaving *user* portability unaddressed. Artifacts moved freely between
  institutions; users did not gain mobility. The license guaranteed that the
  code could be forked, but said nothing about whether the people running the
  code on your behalf had any interest aligned with yours. The lesson: optimize
  for human freedom, not code freedom.


  Gifts in this project are designed to transfer *capability*, not just tools.
  The budget tool's progressive disclosure — easy (analyze locally), medium
  (write a parser), hard (fork and host) — is structured so that each level
  increases the user's autonomy rather than their dependency on the project.


  Forkability is central to this, but forkability without documentation is a
  hollow gift — a fork becomes a maintenance burden if the recipient cannot
  understand the architectural decisions behind it. The project has an ongoing
  obligation to maintain enough documentation that shallow forks (taking one
  component without understanding the whole) are viable. The composable,
  skill-based architecture supports this: someone forking the budget tool does
  not need to understand the PR workflow skills, and vice versa. The shared
  visual language is documented the same way, at `packages/ds/README.md`, so a
  fork can keep or replace it without reverse-engineering the styling. And
  because the tools are built with coding agents, the maintenance burden of a
  fork is lower than traditional software — you can point an agent at your fork
  and iterate in a way that was not feasible before.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# Open Source as Gift, Not Offering
