# commons.systems: Nate's Agentic Coding Workflow

A reference workflow for individual practitioners who want to fork and adapt an agentic coding setup for their own projects. Built to Nate's own specification — not a platform, not a library. The dispatch queue runs autonomously; the office hours queue handles human-driven work. Fork it, argue with it, discard the parts that don't serve you.

## Table of Contents

- [Design Principles](#design-principles)
- [Agentic Coding Workflow](#agentic-coding-workflow)
  - [PR Control Flow](#pr-control-flow)
  - [Two queues, two control paths](#two-queues-two-control-paths)
  - [Dispatch Queue](#dispatch-queue)
  - [Office Hours Queue](#office-hours-queue)
  - [Key design decisions for adopters](#key-design-decisions-for-adopters)
- [CI/CD](#cicd)
- [Pre-requisites](#pre-requisites)
- [Where to go next](#where-to-go-next)
- [Usage and Contributing](#usage-and-contributing)

## Design Principles

- Work flows through two queues: the **dispatch queue** (autonomous, runs unattended) and the **office hours queue** (human-driven, for requirement changes and judgment calls).
- Delegated workflows have well-defined break points for human quality control (QC).
- Prefer [skills](https://code.claude.com/docs/en/skills) over other agentic artifacts (system instructions, hooks, sub-agents, agent teams, etc.) due to portability and ease of maintenance.
- Workflow state is derived from PR/CI ground truth — no external state machine required.

## Agentic Coding Workflow

### PR Control Flow

| Phase | Meaning | Skill |
|-------|---------|-------|
| implement | No PR on the target | [plan-implement](.claude/skills/plan-implement/SKILL.md) |
| verify | Draft PR, CI failed | [verify-pr](.claude/skills/verify-pr/SKILL.md) |
| waiting | Draft PR, CI in progress | (nothing — wait) |
| qa | Draft PR, CI green | [qa-fix](.claude/skills/qa-fix/SKILL.md) (autonomous) or [office-hours](.claude/skills/office-hours/SKILL.md) (human-driven; see #758) |
| code-review | Post-QA code quality | [code-review-fix](.claude/skills/code-review-fix/SKILL.md) (wraps `/code-review`) |
| review | Post-code-review pass | [review-fix](.claude/skills/review-fix/SKILL.md) (wraps `/review`) |
| security | Post-review security | [security-review-fix](.claude/skills/security-review-fix/SKILL.md) (wraps `/security-review`) |
| ready | All reviews complete | flip draft PR to ready |

### Two queues, two control paths

Issues and PRs flow through two parallel queues (see #755 for the framing):

- **Dispatch queue** — autonomous work, advanced by the `/dispatch-propagate` router and its `/dispatch-worker` background jobs. Once a target is selected, the chain runs unattended, one phase at a time.
- **Office hours queue** — human-driven work. Items here wait for live human attention: requirement changes, judgment calls during QA, or deviations flagged by phase skills.

The `dispatch:office-hours` label is the transition signal between the two. Input-block hooks apply it when a phase skill requests user input mid-run (see #757); phase skills apply it on a deviation (see #826). The office-hours queue surfaces labeled items for a human; the label clears once the user engages the worktree.

Ground truth lives in PR state (draft vs. ready), CI status, the accumulating `dispatch:*` label set, and `claude agents --json` for the live session list. There is no persisted state machine and no side file — every router invocation re-derives the world from GitHub and the live agent list.

JIT (just-in-time) reminders seed both queues. Each dispatch tick fires a JIT scan that creates due reminders from `dispatch.config/jit.json` (see #769); some surface as dispatch-queue work that the chain picks up next tick, while others run as office-hours sessions for a human to read.

This section describes the **target** dispatch model. The current implementation lives in [.claude/skills/dispatch-propagate/SKILL.md](.claude/skills/dispatch-propagate/SKILL.md); inline issue references below mark the open work that ages the README forward as it merges.

### Dispatch Queue

#### 1. Entry points

- [`/dispatch-propagate`](.claude/skills/dispatch-propagate/SKILL.md) — the router. Runs in `worktrees/main`. Selects the next target, resolves its worktree, releases the selection lock, spawns a worker, and exits.
- [`/dispatch-worker <N>`](.claude/skills/dispatch-worker/SKILL.md) — the worker. Runs in `worktrees/<N>-…`, one per in-flight issue. Runs exactly one phase skill, then hands off.

See #839 for the router/worker split.

#### 2. The chaining procedure

Each router tick:

1. Acquires the per-repo selection lock.
2. Runs the JIT engine (see Section 4) and the `origin/main` health gate.
3. Selects a target via the selection ladder (Section 3).
4. Resolves the target's worktree (creating one for an `implement`-phase issue).
5. Releases the lock.
6. Spawns a `/dispatch-worker <N>` background job (`claude --bg`) with `cwd` set to that worktree, and exits.

The worker, inside its worktree:

1. Derives the phase from PR/CI state via [`dispatch-phase`](.claude/skills/dispatch-propagate/scripts/dispatch-phase).
2. Runs exactly one phase skill — the skill named in the [PR Control Flow](#pr-control-flow) table for that phase.
3. Hands off with one of two dispositions:
   - `--phase-completed` — spawns a fresh `/dispatch-propagate` router back in `worktrees/main` and self-deletes (`claude rm`). If `dispatch:office-hours` is on the PR, the worker still spawns the router but **skips** self-delete, so the parked transcript stays visible for human review.
   - `--early-stop` — skips the router spawn and self-deletes. The #725 heartbeat re-seeds the chain when the queue drains.

Workers and phase skills call [`/commit-merge-push`](.claude/skills/commit-merge-push/SKILL.md) inline to commit, merge `origin/main`, and push. See #824, #826, #831 for the worker contract, deviation handling, and lock semantics.

#### 3. Prioritization

The router runs a single selection ladder, top to bottom. The ladder spans both queues; the [Office Hours Queue](#office-hours-queue) spine cross-references it rather than restating it.

1. **Current-worktree continuation** — if the router was started inside an `<N>-…` worktree on an open issue, continue there.
2. **JIT scan** — surface the most-overdue jit-reminder. Bypasses the `origin/main` health gate so reminders fire even when main is red.
3. **`origin/main` health gate** — if main is red, stop; do not start new work. [`/dispatch-diagnose-main`](.claude/skills/dispatch-diagnose-main/SKILL.md) reports the failing checks.
4. **Sweep orphan adoption** — adopt a stray `<N>-…` worktree with no live session (see #847).
5. **Topic-category × priority × phase ladder.** Three tiers nest from outermost to innermost. Topic categories, highest first: `bug` → `testing infrastructure` → `dispatch` → `other`. Within each topic category, items carrying the `priority` label rank above items without it (`priority` is human-applied; the selector never adds it automatically). Within each `(topic, priority)` bucket, the phase ladder is, highest first: `security` → `review` → `code-review` → `qa` → `implement`. The selector exhausts one bucket's full phase ladder before moving to the next.

The QA reorder (`qa` above `implement` rather than at the bottom of the ladder) lands with #758; the README documents the post-#758 target. Concurrent worker count scales with the rate-limit window per #845.

#### 4. JIT-on-dispatch

Local `dispatch.config/jit.json` declares recurring "just-in-time" issues. The engine runs at every router tick:

1. Debounce by `lastTickAt`.
2. Open-issue guard — skip if the previous jit issue for that key is still open.
3. Create the next issue when its `remindAfterClose` (or `dueAfterCreate`) cadence has elapsed.

Every jit issue carries a `jit:<key>` label and is tracked in its configured GitHub project. Jit-reminders that produce dispatch-queue work surface ahead of the queue ladder; jit-reminders that run as office-hours sessions are covered in the [Office Hours Queue](#office-hours-queue) spine. See #769.

With no `dispatch.config/jit.json` present the engine is a no-op.

### Office Hours Queue

*See #858 for the office-hours queue spine.*

### Key design decisions for adopters

- **Ground truth is PR/CI + label state.** No persisted state machine; [`dispatch-phase`](.claude/skills/dispatch-propagate/scripts/dispatch-phase) derives the phase from draft state, CI status, and the accumulating `dispatch:*` labels.
- **Per-worktree concurrency.** N issues in flight equals N concurrent worker sessions in N worktrees. The per-repo selection lock serializes router *selection* only — the worker holds no lock.
- **Self-perpetuating background-job chain.** Each `/dispatch-worker` runs as a `claude --bg` background session that self-deletes on clean completion and spawns its successor router. The #725 heartbeat re-seeds the chain if it drains.
- **Transient escalation via `dispatch:office-hours`.** One label, two writers (input-block hooks per #757, phase-skill deviation detection per #826), one reader (the office-hours queue). The label clears when the user engages the worktree.
- **JIT is a reminder layer, not an autonomous executor.** Office-hours jit-reminders are surfaced for a human to read.
- **Local config sits outside every worktree.** `dispatch.config/` lives beside `worktrees/main/` so it is shared across worktrees and physically cannot be committed.

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

## Pre-requisites

- **Project Management** (github): Created a [project](https://github.com/users/natb1/projects/2).
- **Version Control** (git): Created a repo.
- **Agentic Coding Tools** (Claude Code): `nix flake update && home-manager switch --flake .#default --impure`
- **Infrastructure** (Firebase): Hosting and storage.

## Where to go next

- **Landing page** — [commons.systems](https://commons.systems): the deployed apps and project overview.
- **Charter** — [CHARTER.md](CHARTER.md): audiences, principles, and the philosophy behind the workflow.
- **License** — CC-BY-SA; forking is encouraged.

## Usage and Contributing
<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged.
