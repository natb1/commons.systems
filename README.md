# commons.systems: Agentic Coding Workflow

This repository serves as a monorepo for Nate's agentic coding workflows and proof-of-concept (POC) applications.

## Pre-requisites

- **Project Management** (github): Created a project.
- **Version Control** (git): Created a repo.
- **Agentic Coding Tools** (Claude Code): Manually Installed TODO([Bootstrap Claude Code with nix home manager #2](https://github.com/natb1/commons.systems/issues/2))

## Design Principles

- Agentic patterns for both augmented and delegated coding workflows.
- Augmented workflows focus on requirements management and design, while delegated workflows focus on implementation.
- Delegated workflows have well defined break points for human quality control (QC).

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

## Usage and Contributing
For using and/or extending the artifacts in this repo: forking is encouraged. To better understand the agentic coding artifacts a demo is available as a Claude Code marketplace.

### Adding this Marketplace

To add this marketplace to your Claude Code installation, use the GitHub repository as the marketplace source. The skills will then be available via the `/plugin` command.

For example, to use the issue-workflow skill:
```bash
/plugin install issue-workflow@commons-systems
```
