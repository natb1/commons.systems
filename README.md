# commons.systems: Agentic Coding Workflow

This repository serves as a monorepo for Nate's agentic coding workflows and proof-of-concept (POC) applications. This can be used as an example for bootstrapping an agentic coding workflow.

## Pre-requisites

- **Project Management** (github): Created a [project](https://github.com/users/natb1/projects/2).
- **Version Control** (git): Created a repo.
- **Agentic Coding Tools** (Claude Code): Manually Installed TODO([Bootstrap Claude Code with nix home manager #2](https://github.com/natb1/commons.systems/issues/2))

## Design Principles

- Agentic patterns for both augmented and delegated coding workflows.
- Augmented workflows focus on requirements management and design, while delegated workflows focus on implementation.
- Delegated workflows have well defined break points for human quality control (QC).
- Prefer [skills](https://code.claude.com/docs/en/skills) over other agentic artifacts (system instructions, hooks, sub-agents, agent teams, etc.) due to portability and ease of maintenance.
- Separate "reference" skills from "task" skills with "ref-" naming convention. This enables more powerful (sub-agent-like) context management for skills when combined with [ref-memory-management](.claude/skills/ref-memory-management/SKILL.md) skill.
- Conversation scope is persisted in git commit log, github issues and PR using [dynamic content](https://code.claude.com/docs/en/skills#inject-dynamic-context) in [pr-workflow](.claude/skills/ref-pr-workflow) skills.

## Agentic Coding Workflow

| Step | Agent Pattern | Artifacts |
|------|--------------|-----------|
| 1. Functional Requirement Definition & Prioritization | Augmented | [functional requirement tracking skill #3](https://github.com/natb1/commons.systems/issues/3) |
| 2. Dev Environment Management | Delegated + QC | [Declarative dev env #5](https://github.com/natb1/commons.systems/issues/5) [worktree skill #6](https://github.com/natb1/commons.systems/issues/6) [wiggum agent team #7](https://github.com/natb1/commons.systems/issues/7) [app scaffolding #18](https://github.com/natb1/commons.systems/issues/18) |
| 3. Implementation Planning | Delegated + QC | [planning skill #8](https://github.com/natb1/commons.systems/issues/8) [batching skill #9](https://github.com/natb1/commons.systems/issues/9) |
| 4. Implementation | Delegated | [implementation skills #10](https://github.com/natb1/commons.systems/issues/10) [implementation tracking skill #20](https://github.com/natb1/commons.systems/issues/20) [unit testing skill #11](https://github.com/natb1/commons.systems/issues/11) [unit test tooling #16](https://github.com/natb1/commons.systems/issues/16) [acceptance testing skill #15](https://github.com/natb1/commons.systems/issues/15) [acceptance test tooling #17](https://github.com/natb1/commons.systems/issues/17) |
| 5. QA (functional review of pull request) | Augmented | [QA CICD tooling #21](https://github.com/natb1/commons.systems/issues/21) [qa-prep skill #12](https://github.com/natb1/commons.systems/issues/12) [smoke test tooling #19](https://github.com/natb1/commons.systems/issues/19) |
| 6. Code Quality Review | Delegated + QC | [pr review skills #13](https://github.com/natb1/commons.systems/issues/13) [out of scope tracking skill #14](https://github.com/natb1/commons.systems/issues/14) |
| 7. Security Review | Delegated + QC | [security review skill #22](https://github.com/natb1/commons.systems/issues/22) |
| 8. Merge | Augmented | [merge skill #23](https://github.com/natb1/commons.systems/issues/23) [Prod CICD tooling #24](https://github.com/natb1/commons.systems/issues/24) [smoke test tooling #19](https://github.com/natb1/commons.systems/issues/19) |

## Cross Cutting Artifacts
- [agent shell multiplexing #26](https://github.com/natb1/commons.systems/issues/26)
- [context management with CLAUDE.local.md #36](https://github.com/natb1/commons.systems/issues/36)

## Usage and Contributing
<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged. To better understand the agentic coding artifacts a demo is available as a Claude Code [plugin](https://code.claude.com/docs/en/plugins).

```
/plugin install pr-workflow-bundle@commons-systems
/worktree <issue-number>
```
