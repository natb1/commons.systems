# commons.systems: Agentic Coding Workflow

This repository serves as a monorepo for Nate's agentic coding workflows and proof-of-concept (POC) applications. This can be used as an example for bootstrapping an agentic coding workflow.

> WIP: many of Nate's tools and POC apps are currently being migrated over from rumor-ml/commons.systems

## Table of Contents

- [Pre-requisites](#pre-requisites)
- [Design Principles](#design-principles)
- [Agentic Coding Workflow](#agentic-coding-workflow)
  - [Cross Cutting Artifacts](#cross-cutting-artifacts)
  - [PR Control Flow](#pr-control-flow)
- [CI/CD](#cicd)
- [Usage and Contributing](#usage-and-contributing)

## Pre-requisites

- **Project Management** (github): Created a [project](https://github.com/users/natb1/projects/2).
- **Version Control** (git): Created a repo.
- **Agentic Coding Tools** (Claude Code): `home-manager switch --flake .#default --impure`

## Design Principles

- Agentic patterns for both augmented and delegated coding workflows.
- Augmented workflows focus on requirements management and design, while delegated workflows focus on implementation.
- Delegated workflows have well defined break points for human quality control (QC).
- Prefer [skills](https://code.claude.com/docs/en/skills) over other agentic artifacts (system instructions, hooks, sub-agents, agent teams, etc.) due to portability and ease of maintenance.
- Separate "reference" skills from "task" skills with "ref-" naming convention. This enables more powerful (sub-agent-like) context management for skills when combined with [ref-memory-management](.claude/skills/ref-memory-management/SKILL.md) skill.
- Conversation scope is persisted in git commit log, github issues and PR using [dynamic content](https://code.claude.com/docs/en/skills#inject-dynamic-context) in [pr-workflow](.claude/skills/pr-workflow/SKILL.md) skills.

## Agentic Coding Workflow

### Cross Cutting Artifacts
- [pr-workflow skill](.claude/skills/pr-workflow/SKILL.md): manages PR workflow using state stored in git commit log, github issues and PR.
- [ref-memory-management](.claude/skills/ref-memory-management/SKILL.md): smart management of the conversation context using skills and ["plan mode"](https://code.claude.com/docs/en/how-claude-code-works#explore-before-implementing).
- [compaction recovery hooks](.claude/hooks/): restores active skill and workflow state after auto-compaction

### PR Control Flow

| Step | Agent Pattern | Artifacts |
|------|--------------|-----------|
| 1. Requirement Definition | Augmented | [ready](.claude/skills/ready/SKILL.md) |
| 2. Dev Environment Setup | Delegated + QC | [worktree](.claude/skills/worktree/SKILL.md), [nix/](nix/), [scaffolding/](scaffolding/) |
| 3. Planning | Augmented | [pr-workflow](.claude/skills/pr-workflow/SKILL.md) |
| 4. Implementation | Delegated | [pr-workflow](.claude/skills/pr-workflow/SKILL.md), [wiggum-loop](.claude/skills/wiggum-loop/SKILL.md) |
| 5. Unit Tests + Lint | Delegated | [pr-workflow](.claude/skills/pr-workflow/SKILL.md) |
| 6. PR Creation + CI Verification | Delegated + QC | [pr-workflow](.claude/skills/pr-workflow/SKILL.md), [CI/CD](#cicd) |
| 7. QA Review | Augmented | [pr-workflow](.claude/skills/pr-workflow/SKILL.md) |
| 8. Code Quality Review | Delegated + QC | [pr-workflow](.claude/skills/pr-workflow/SKILL.md) |
| 9. Security Review | Delegated + QC | [pr-workflow](.claude/skills/pr-workflow/SKILL.md) |
| 10. Merge | Augmented | [pr-workflow](.claude/skills/pr-workflow/SKILL.md), [CI/CD](#cicd) |

## CI/CD

Four consolidated workflows handle all CI/CD. Change detection determines which apps to test and deploy.

### Workflows

| Trigger | Workflow | Jobs |
|---------|----------|------|
| Push to non-`main` branch | `unit-tests.yml` | `unit-tests`, `lint` |
| PR opened/synchronized | `pr-checks.yml` | `acceptance`, `preview-and-smoke` |
| PR merged to `main` | `prod-deploy.yml` | `deploy-and-smoke`, `cleanup-preview` |
| Push `firestore.rules` to `main` | `firestore-deploy.yml` | `deploy-rules` |

### Change detection

`get-changed-apps.sh` determines which apps are affected by a change:

- **Direct changes** to `<app>/**` mark that app
- **Shared package changes** (e.g. `authutil/`) scan every app's `package.json` for `file:` references to the changed package and mark all matches
- **Global triggers** (`firebase.json`, `firestore.rules`, CI scripts) mark all apps

An "app" is any top-level directory containing both `package.json` and `package-lock.json`.

### Script call chain

Wrapper scripts delegate to per-app scripts:

```
run-all-acceptance-tests.sh
  get-changed-apps.sh            -> <app1>, <app2>, ...
  run-acceptance-tests.sh <app>     (emulators, seed, playwright)

run-all-preview-deploy-smoke.sh <channel-id>
  get-changed-apps.sh
  run-preview-deploy.sh <app> <channel-id>   -> PREVIEW_URL
  run-smoke-tests.sh <app> <url>

run-all-prod-deploy-smoke.sh
  get-changed-apps.sh --base HEAD~1
  run-prod-deploy.sh <app>
  run-smoke-tests.sh <app> https://<hosting-site>.web.app

run-all-cleanup-preview.sh <pr-number>
  get-changed-apps.sh --base HEAD~1
  run-cleanup-preview.sh <app> <pr-number>
```

### Adding a new app

The scaffold tool (`scaffolding/firebase/`) automatically registers new apps in all consolidated workflows via marker-based path insertion. No manual workflow edits are needed.

## Usage and Contributing
<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged. To better understand the agentic coding artifacts a demo is available as a Claude Code [plugin](https://code.claude.com/docs/en/plugins).

> Plugin distribution is WIP. If you encounter errors you can attempt to clone and load pr-workflow skills from this repo.
```
/plugin marketplace add natb1/commons.systems
/plugin install pr-workflow-bundle@commons-systems
/worktree <issue-number>
```
