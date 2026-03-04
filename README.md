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
- Conversation scope is persisted in git commit log, github issues and PR using [dynamic content](https://code.claude.com/docs/en/skills#inject-dynamic-context) in [ref-pr-workflow](.claude/skills/ref-pr-workflow/SKILL.md) skills.

## Agentic Coding Workflow

### Cross Cutting Artifacts
- [ref-pr-workflow skill](.claude/skills/ref-pr-workflow/SKILL.md): manages PR workflow using state stored in git commit log, github issues and PR.
- [ref-memory-management](.claude/skills/ref-memory-management/SKILL.md): smart management of the conversation context using skills and ["plan mode"](https://code.claude.com/docs/en/how-claude-code-works#explore-before-implementing).
- Issue-body-based state persistence via `issue-state-read` / `issue-state-write` scripts for cross-session workflow resumption

### PR Control Flow

| Step | Name | Agent Pattern | Skill | Tooling |
|------|------|---------------|-------|---------|
| 0 | Issue Grooming | Augmented | [ready](.claude/skills/ready/SKILL.md) | |
| 1 | Dev Env Management | Delegated | [worktree](.claude/skills/worktree/SKILL.md) | [nix](nix) |
| 2 | Planning | Delegated + QC | [ref-implement](.claude/skills/ref-implement/SKILL.md) | Claude Code Planning Tool |
| 3 | Implementation | Delegated | [ref-implement](.claude/skills/ref-implement/SKILL.md) | |
| 4 | Unit Tests + Lint | Delegated | [ref-unit-test](.claude/skills/ref-unit-test/SKILL.md) | [unit test framework](.claude/skills/ref-pr-workflow/run-unit-tests.sh) |
| 5 | PR Creation | Delegated | [ref-create-pr](.claude/skills/ref-create-pr/SKILL.md) | |
| 6 | Acceptance Tests | Delegated | [ref-pr-check](.claude/skills/ref-pr-check/SKILL.md) | [e2e test framework](.claude/skills/ref-pr-workflow/run-acceptance-tests.sh) |
| 7 | Smoke Tests | Delegated | [ref-pr-check](.claude/skills/ref-pr-check/SKILL.md) | smoke test framework: [preview deployments](.claude/skills/ref-pr-workflow/run-preview-deploy.sh) [smoke tests](.claude/skills/ref-pr-workflow/run-smoke-tests.sh)) |
| 8 | QA Review | Augmented | [ref-qa](.claude/skills/ref-qa/SKILL.md) | QA server |
| 9 | Code Quality Review | Delegated + QC | [ref-code-quality](.claude/skills/ref-code-quality/SKILL.md) | |
| 10 | Security Review | Delegated + QC | [ref-security](.claude/skills/ref-security/SKILL.md) | |
| 11 | Merge | Augmented | [ref-pr-workflow](.claude/skills/ref-pr-workflow/SKILL.md) | |

**Agent patterns:** *Augmented* = human-in-the-loop, Claude assists. *Delegated* = Claude drives autonomously. *QC* = human quality gate before proceeding.

#### Dispatcher Architecture

```
Entry points               Dispatcher                    Phase skills
─────────────              ──────────                    ────────────
/pr-workflow  ──┐
                ├──>  ref-pr-workflow  ──┬──>  ref-implement     (Steps 1-3)
compaction    ──┘     (resume logic,    ├──>  ref-unit-test     (Step 4, fork)
recovery hook         dispatch table,   ├──>  ref-create-pr     (Step 5)
                      state machine)    ├──>  ref-pr-check      (Steps 6-7, fork)
                                        ├──>  ref-qa            (Step 8)
                                        ├──>  ref-code-quality  (Step 9)
                                        ├──>  ref-security      (Step 10)
                                        └──>  (inline Step 11)
```

#### Control Flow with Fork Boundaries

```
Main context                          Forked context
────────────                          ──────────────
Step 1: Prerequisite Check
Step 2: Planning (plan mode)
Step 3: Implementation
                                      Step 4: Unit Tests + Lint ──── wiggum-loop
Step 5: PR Creation
                                      Step 6: Acceptance Tests ───── wiggum-loop
                                      Step 7: Smoke Tests ────────── wiggum-loop
Step 8: QA Review ──────────────────────────────────────────── wiggum-loop
Step 9: Code Quality Review ────────────────────────────────── wiggum-loop
Step 10: Security Review ───────────────────────────────────── wiggum-loop
Step 11: Mark Ready + Merge
```

#### State Persistence

Workflow state is stored as JSON in the GitHub issue body via `issue-state-write`. This allows any new conversation to resume from the correct step after context loss or auto-compaction. State includes: `step`, `phase`, `active_skills`, and optional `wiggum_step`.

#### Wiggum-Loop Pattern

Six of eleven steps use the [wiggum-loop](.claude/skills/ref-wiggum-loop/SKILL.md) pattern: an evaluate-iterate-terminate cycle where each iteration runs the step's action, evaluates the result, and either iterates (fix + retry) or terminates (advance to next step). Progress reports and termination summaries are posted as PR comments.

## Usage and Contributing
<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged. To better understand the agentic coding artifacts a demo is available as a Claude Code [plugin](https://code.claude.com/docs/en/plugins).

> Plugin distribution is WIP. If you encounter errors you can attempt to clone and load pr-workflow skills from this repo.
```
/plugin marketplace add natb1/commons.systems
/plugin install pr-workflow-bundle@commons-systems
/worktree <issue-number>
```

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
