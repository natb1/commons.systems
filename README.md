# commons.systems: Nate's Agentic Coding Workflow

This repository serves as a monorepo for Nate's agentic coding workflows and proof-of-concept (POC) applications. This is built to my own specification and it is not intended to be a platform or a distributed library. This can be used as a reference for bootstrapping your own agentic coding workflow.

- [commons.systems](https://commons.systems): More info about this project.
- [budget.commons.systems](https://budget.commons.systems): Personal finance demo.
- [print.commons.systems](https://print.commons.systems): Print media reader and library.

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
- **Agentic Coding Tools** (Claude Code): `nix flake update && home-manager switch --flake .#default --impure`
- **Infrastructure** (Firebase): Hosting and storage.

## Design Principles

- Agentic patterns for both augmented and delegated coding workflows.
- Augmented workflows focus on requirements management and design, while delegated workflows focus on implementation.
- Delegated workflows have well defined break points for human quality control (QC).
- Prefer [skills](https://code.claude.com/docs/en/skills) over other agentic artifacts (system instructions, hooks, sub-agents, agent teams, etc.) due to portability and ease of maintenance.
- Keep [focused context windows](.claude/skills/ref-memory-management/SKILL.md) with frequent planning and QC steps.
- Workflow state is derived from PR/CI ground truth — no external state machine required.

## Agentic Coding Workflow

### Cross Cutting Artifacts
- [dispatch skill](.claude/skills/dispatch/SKILL.md): orchestrates the issue workflow — selects the next task, derives the phase from PR/CI status, and dispatches exactly one phase skill per invocation.
- [ref-memory-management](.claude/skills/ref-memory-management/SKILL.md): smart management of the conversation context using skills and ["plan mode"](https://code.claude.com/docs/en/how-claude-code-works#explore-before-implementing).

### PR Control Flow

| Phase | Meaning | Skill |
|-------|---------|-------|
| implement | No PR on the target | [plan-implement](.claude/skills/plan-implement/SKILL.md) |
| verify | Draft PR, CI failed | [verify-pr](.claude/skills/verify-pr/SKILL.md) |
| waiting | Draft PR, CI in progress | (nothing — wait) |
| qa | Draft PR, CI green | [dispatch-qa](.claude/skills/dispatch-qa/SKILL.md) |
| simplify | Post-QA code quality | `/simplify` (built-in) |
| review | Post-simplify review | `/review` (built-in) |
| security | Post-review security | `/security-review` (built-in) |
| ready | All reviews complete | flip draft PR to ready |

**Agent patterns:** *Augmented* = human-in-the-loop, Claude assists. *Delegated* = Claude drives autonomously. *QC* = human quality gate before proceeding.

#### Dispatch Architecture

```
Entry points               Dispatcher                    Phase skills
─────────────              ──────────                    ────────────
/dispatch     ──────────>  dispatch        ──────────>  plan-implement  (implement)
(re-invoked                (derives phase               verify-pr       (verify)
 each phase)               from PR/CI                   dispatch-qa     (qa)
                           ground truth)                simplify        (simplify)
                                                        review          (review)
                                                        security-review (security)
                                                        gh pr ready     (ready)
```

#### Phase Derivation

`/dispatch` derives the current phase from live PR/CI status — no persisted state machine:

1. No PR → `implement`
2. Draft PR + CI failed → `verify`
3. Draft PR + CI running → `waiting`
4. Draft PR + CI green + no label → `qa`
5. Draft PR + `dispatch:qa-done` label → `simplify`
6. Draft PR + `dispatch:refactored` label → `review`
7. Draft PR + `dispatch:reviewed` label → `security`
8. Draft PR + `dispatch:security-reviewed` label → `ready`
9. Non-draft (ready) PR → `done`

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
- **Shared package changes** (e.g. `authutil/`) scan every app's `package.json` for `@commons-systems/` dependencies referencing the changed package and mark all matches
- **Global triggers** (`firebase.json`, `firestore.rules`, `storage.rules`, `package.json`, `package-lock.json`) mark all apps

An "app" is any workspace listed in the root `package.json` `workspaces` array.

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

## Usage and Contributing
<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged.
