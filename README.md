# commons.systems: Nate's Agentic Coding Workflow

A long-horizon coding workflow you own and run yourself — local-first, self-managed, built to be left alone for stretches and to stay aligned with your own intent. Not a platform, not a library: a reference setup for individuals who want to fork and adapt it for their own projects, built to Nate's own specification. Under the hood it is an agent harness wrapping an agent loop, with a multi-agent fan-out at the review and fix phases. The dispatch queue runs autonomously; the office hours queue handles human-driven work.

## As a harness

Birgitta Böckeler's framing splits an agent into Model + Harness — the harness is everything around the model that turns a single call into reliable work. This repo is the *outer harness* (also the *user harness*): the half you write and own, sitting on top of the *built-in harness* (the *builder harness*) that Claude Code ships. The pieces map onto real files here:

- **Guides (feedforward)** — what the agent is told before it acts: `.claude/rules/*.md` and the per-skill `SKILL.md` files. There is no `AGENTS.md`; the guidance lives in the rules and skills.
- **Sensors (feedback)** — what checks the work after it acts. **Computational** sensors are CI: lint, type-check, test. **Inferential** sensors are the `/review-fix` reviewer fan-out and the QA pass — LLM-as-judge over the diff.
- **Steering loop** — the cycle that adjusts the harness itself: lessons feed back into edits to `.claude/rules/*.md` and the `SKILL.md` files, and the two queues route each item between autonomous and human-driven work.

## Table of Contents

- [As a harness](#as-a-harness)
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
  - [Differentiation](#differentiation)
- [Related work / prior art](#related-work--prior-art)
- [Usage and Contributing](#usage-and-contributing)

## Design Principles

- Work flows through two queues: the **dispatch queue** (autonomous, runs unattended) and the **office hours queue** (human-driven, for requirement changes and judgment calls).
- Delegated workflows have well-defined break points for human quality control (QC).
- Prefer [skills](https://code.claude.com/docs/en/skills) over other agentic artifacts (system instructions, hooks, sub-agents, agent teams, etc.) due to portability and ease of maintenance.
- The system controls the agent, not the agent the workflow — a dispatch design principle, shared with harness-engineering practice broadly (not Fowler's or Böckeler's). Workflow state is derived from PR/CI ground truth — no external state machine required.

## Agentic Coding Workflow

### PR Control Flow

| Phase | Meaning | Skill |
|-------|---------|-------|
| plan | No PR, unplanned issue (no `dispatch:planned`) | [plan-issue](.claude/skills/plan-issue/SKILL.md) |
| implement | No PR, `dispatch:planned` | [implement](.claude/skills/implement/SKILL.md) |
| fix-checks | Draft PR, CI failed | [fix-checks](.claude/skills/fix-checks/SKILL.md) |
| fix-conflicts | Draft PR, `origin/main` merge conflict | [fix-conflicts](.claude/skills/fix-conflicts/SKILL.md) |
| waiting | Draft PR, CI in progress | (nothing — wait) |
| qa | Draft PR, CI green, review labels absent | [qa-fix](.claude/skills/qa-fix/SKILL.md) (autonomous) or [office-hours](.claude/skills/office-hours/SKILL.md) (human-driven; see #758) |
| review | Draft PR, QA passed — the single terminal pass: code + security review, applies in-scope fixes, flips draft→ready | [review-fix](.claude/skills/review-fix/SKILL.md) |

These phases are the harness's sensor layer: `fix-checks` consumes the computational CI sensors (lint, type, test), while `qa` and `review` add the inferential LLM-as-judge sensors. The two queues plus the self-perpetuating tick — each worker's Stop-hook re-launching the next — close the steering loop around them.

The `review` phase is the workflow's single terminal review pass. It consolidates
what were three separate phases — code-review, review, and security — into one
pass over a single diff via the [Workflow tool](.claude/skills/review-fix/SKILL.md),
and flips the PR from draft to ready itself once the reviews are clean.

### Two queues, two control paths

Issues and PRs flow through two parallel queues (see #755 for the framing):

- **Dispatch queue** — autonomous work, advanced by the headless `dispatch-tick` script and the phase-skill worker sessions it spawns. Once a target is selected, the chain runs unattended, one phase at a time.
- **Office hours queue** — human-driven work. Items here wait for live human attention: requirement changes, judgment calls during QA, or deviations flagged by phase skills.

The `dispatch:office-hours` label is the transition signal between the two. Input-block hooks apply it when a phase skill requests user input mid-run (see #757); phase skills apply it on a deviation (see #826). The office-hours queue surfaces labeled items for a human; the label clears once the user engages the worktree.

Ground truth lives in PR state (draft vs. ready), CI status, the accumulating `dispatch:*` label set, and `claude agents --json` for the live session list. There is no persisted state machine and no side file — every tick re-derives the world from GitHub and the live agent list.

JIT (just-in-time) reminders seed both queues. Each dispatch tick fires a JIT scan that creates due reminders from `dispatch.config/jit.json` (see #769); some surface as dispatch-queue work that the chain picks up next tick, while others run as office-hours sessions for a human to read.

The mechanics below are documented in present tense in [.claude/skills/dispatch-propagate/reference.md](.claude/skills/dispatch-propagate/reference.md) — the companion to the now-retired `dispatch-propagate` skill. Inline issue references point at the design discussions behind each mechanism.

### Dispatch Queue

#### 1. Entry points

- **`dispatch-tick`** — the autonomous tick. A headless bash script (`.claude/skills/dispatch-propagate/scripts/dispatch-tick`) with no model-decision seam: it runs `dispatch-select-tick` then `dispatch-materialize-spawn` and exits. `dispatch-spawn-tick` launches it as a transient `systemd-run --user` unit (fixed unit name for one-at-a-time dedup).
- **`dispatch`** — the human entry point. Run the `dispatch` terminal command (bare, or `dispatch <N>`) to invoke one tick from a terminal; its stdout streams directly.
- **Workers** — phase-skill sessions, one per in-flight issue, each spawned by `dispatch-launch-worker` into its `worktrees/<N>-…` worktree. A worker runs exactly one phase skill, then its Stop-hook re-launches a tick.

See #839 for the original router/worker split and #849 for its replacement by the headless tick.

#### 2. The chaining procedure

Each tick, holding the per-repo selection lock:

1. Acquires the lock.
2. Runs the JIT engine (see Section 4) and the `origin/main` health gate.
3. Computes the concurrency `gap = TARGET_N − effective_live` (Section 5), then selects up to `gap` targets via the selection ladder (Section 3).
4. For each target: resolves (and, for an `implement`-phase issue, creates) its worktree, writes a reservation marker, and spawns a worker (`dispatch-launch-worker`) with `cwd` set to that worktree.
5. Releases the lock **after** each spawned worker registers (#945) — closing the boot-gap re-selection race — and exits.

This is a **seed once → fan out to `gap`** pattern, replacing the old serial "one tick, one worker, repeat."

Each worker, inside its worktree:

1. Derives the phase from PR/CI state via [`dispatch-phase`](.claude/skills/dispatch-propagate/scripts/dispatch-phase).
2. Runs exactly one phase skill — the skill named in the [PR Control Flow](#pr-control-flow) table for that phase.
3. On exit, its Stop-hook (`.claude/hooks/dispatch-stop.sh`) launches a fresh headless tick via `dispatch-spawn-tick` (deduped to one live tick unit), which fans out again to the newly freed gap. If `dispatch:office-hours` is on the PR, the worker still triggers the tick but stays visible for human review.

When the chain stalls on the concurrency budget rather than a freed slot, the #725 cap-keyed re-seed re-launches the tick when the budget reopens; the #1010 continuation invariant parks a tick that would otherwise leave no continuation, so a terminal stall is visible rather than silently lost.

Workers and phase skills call [`/commit-merge-push`](.claude/skills/commit-merge-push/SKILL.md) inline to commit, merge `origin/main`, and push. See #824, #826, #831 for the worker contract, deviation handling, and lock semantics.

#### 3. Prioritization

The tick runs a single selection ladder, top to bottom. The ladder spans both queues; the [Office Hours Queue](#office-hours-queue) spine cross-references it rather than restating it.

1. **Current-worktree continuation** — if the tick was invoked against an `<N>-…` worktree on an open issue, continue there.
2. **JIT scan** — surface the most-overdue jit-reminder. Bypasses the `origin/main` health gate so reminders fire even when main is red.
3. **`origin/main` health gate** — if main is red, stop; do not start new work. [`/dispatch-diagnose-main`](.claude/skills/dispatch-diagnose-main/SKILL.md) reports the failing checks.
4. **Sweep orphan adoption** — adopt a stray `<N>-…` worktree with no live session (see #847).
5. **Priority × topic-category × phase ladder.** Three tiers nest from outermost to innermost. The **priority bit** is the outermost axis: the selector exhausts every `priority=1` item — across all topics and phases — before any non-priority item, so a `priority` item in a low-ranked topic outranks every non-priority item in a higher-ranked one (`priority` is human-applied; the selector never adds it automatically). Within one priority level, **topic categories**, highest first: `security` → `bug` → `testing infrastructure` → `dispatch` → `landing` → `fellspiral` → `budget` → `print` → `audio` → `other`. Within each `(priority, topic)` bucket, the **phase ladder** runs closest-to-done first: oldest `review` PR → oldest `fix-checks` PR → oldest `help wanted` issue (planned/`implement` before unplanned/`plan`) → oldest `qa` PR. The selector exhausts one bucket's full phase ladder before moving to the next.

Concurrent worker count scales with the rate-limit window (see Section 5).

#### 4. JIT-on-dispatch

Local `dispatch.config/jit.json` declares recurring "just-in-time" issues. The engine runs at every dispatch tick:

1. Debounce by `lastTickAt`.
2. Open-issue guard — skip if the previous jit issue for that key is still open.
3. Create the next issue when its `remindAfterClose` (or `dueAfterCreate`) cadence has elapsed.

Every jit issue carries a `jit:<key>` label and is tracked in its configured GitHub project. Jit-reminders that produce dispatch-queue work surface ahead of the queue ladder; jit-reminders that run as office-hours sessions are covered in the [Office Hours Queue](#office-hours-queue) spine. A jit may carry an optional `skill` field: when selected, the reminder job runs that named skill as an office-hours session instead of only summarizing; absent → summarize-and-stop (unchanged). See #769.

With no `dispatch.config/jit.json` present the engine is a no-op.

#### 5. Token-budget pacing

The tick paces worker spawning against a cumulative weekly token-budget curve (#917, building on #845 and #878). Rather than a flat cap, the weekly target at any moment is proportional to how far through the weekly rate-limit window you are — so token spend is spread smoothly across the week instead of burning early and idling. The controller is more conservative early-week than a simple headroom check: it pauses spawning whenever actual usage runs ahead of the curve, even when the weekly total is still low. A separate 5-hour headroom ramp then maps the remaining budget into a live worker count (0..`max_concurrent_workers`).

Tunables live in `dispatch.config/target-workers.json` (see `dispatch-propagate/reference.md` for the full formula and table). When no telemetry file is present, the tick falls back to spawning one worker per tick.

### Office Hours Queue

The office-hours queue is the human-driven counterpart to the dispatch queue.
Items land here when work needs live human attention: an inbound idea to
triage, a requirement that changed mid-flight, a roadmap reassessment, or a
jit-reminder that runs as a session rather than autonomously. The
`dispatch:office-hours` label is the signal an item belongs here (see [Two
queues, two control paths](#two-queues-two-control-paths)). Prioritization
across both queues is the dispatch router's single selection ladder — see
[Prioritization](#3-prioritization); office-hours items are surfaced by the
label, not by a separate ranking.

#### 1. Entry point

- `office-hours` — the single user entry point to the queue (see #759). It
  resumes a blocked live session for a `dispatch:office-hours`-labeled item if
  one exists, or starts a fresh
  [`/office-hours`](.claude/skills/office-hours/SKILL.md) session for a
  sessionless labeled item.
- [`/office-hours`](.claude/skills/office-hours/SKILL.md) — the body of a fresh
  session. It picks up a labeled item, runs the user-input portion (plan
  approval for an `implement` item, a judgment-call walkthrough for a `qa`
  item, or an accept/reject deviation review for a completed-but-deviating
  item), clears the label on completion, and hands back to the dispatch chain.

#### 2. Pre-dispatch intake

[`/file-issue`](.claude/skills/file-issue/SKILL.md) is the single
issue-filing and issue-improvement chokepoint. It separates multi-topic input
into independent issues, then per issue runs duplicate detection, an eight-category
quality evaluation, a decomposition gate, and type/topic classification —
applying the results directly with no approval gate. Use it to file an inbound
idea or to bring a backlogged issue into ready shape before it competes in the
selection ladder.

#### 3. Mid-flight requirement changes

[`/new-requirement`](.claude/skills/new-requirement/SKILL.md) handles a
requirement introduced or amended mid-flight. It clarifies the change, updates
the remote issues, syncs context, and revises the active plan — keeping the
worktree's open work coherent with the new requirement instead of forcing a
restart.

#### 4. Periodic reassessment

[`/roadmap`](.claude/skills/roadmap/SKILL.md) runs a structured five-persona
roadmap reassessment: each persona analyzes project state, the synthesis is
debated, proposed `ROADMAP.md` edits are produced, and the open backlog is
triaged (add `help wanted`, update body, or close as not planned for each
unlabeled issue). Run it interactively to step back from the queue and ask
whether the priority ladder still matches the project's direction. It also runs
autonomously on a 7-day `roadmap` jit cadence — posting the full report as a
comment on the review issue and closing it to anchor the next cycle.

#### 5. Skill-running JIT reminders

Most jit-reminders surface a summary for a human to read; some instead run a
skill when selected. [`/digest`](.claude/skills/digest/SKILL.md) runs as an
office-hours session (interactive demos require a user present);
[`/roadmap`](.claude/skills/roadmap/SKILL.md) runs as an office-hours
session with no interactive stops — it posts its report and closes the review issue. The jit engine itself
lives in the Dispatch Queue spine's [JIT-on-dispatch](#4-jit-on-dispatch)
subsection — this covers only the office-hours-side surfacing.

### Key design decisions for adopters

- **Ground truth is PR/CI + label state.** No persisted state machine; [`dispatch-phase`](.claude/skills/dispatch-propagate/scripts/dispatch-phase) derives the phase from draft state, CI status, and the accumulating `dispatch:*` labels.
- **Per-worktree concurrency.** N issues in flight equals N concurrent worker sessions in N worktrees. The per-repo selection lock serializes router *selection* only — the worker holds no lock.
- **Self-perpetuating headless chain.** The tick (`dispatch-tick`) is a headless script, not a model session; workers are phase-skill sessions. A worker's Stop-hook re-launches a tick via `dispatch-spawn-tick`. The #725 cap-keyed re-seed resumes the chain when it stalls on the token budget, and the #1010 continuation invariant parks a tick that would otherwise leave no continuation.
- **Transient escalation via `dispatch:office-hours`.** One label, two writers (input-block hooks per #757, phase-skill deviation detection per #826), one reader (the office-hours queue). The label clears when the user engages the worktree.
- **JIT is a reminder layer, not an autonomous executor.** Office-hours jit-reminders are surfaced for a human to read.
- **Local config sits outside every worktree.** `dispatch.config/` lives beside `worktrees/main/` so it is shared across worktrees and physically cannot be committed.

## CI/CD

Seven workflows handle all CI/CD. Change detection determines which apps to test and deploy.

### Workflows

| Trigger | Workflow | Jobs |
|---------|----------|------|
| Push to non-`main` branch | `unit-tests.yml` | `unit-tests`, `lint` |
| PR opened/synchronized | `pr-checks.yml` | `acceptance`, `preview-and-smoke` |
| PR merged to `main` | `prod-deploy.yml` | `deploy-and-smoke`, `cleanup-preview` |
| Push `firestore.rules`/`firestore.indexes.json` to `main` | `firestore-deploy.yml` | deploy rules and indexes |
| Push `functions/**` to `main` (or manual dispatch) | `functions-deploy.yml` | deploy Cloud Functions |
| Push `storage.rules` to `main` | `storage-deploy.yml` | deploy storage rules |
| Push a `budget-etl-v*` tag | `budget-etl-release.yml` | build and publish the `budget-etl` release |

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
- **Design system** — [packages/ds](packages/ds/README.md): tokens, components, and the visual language.
- **License** — CC-BY-SA; forking is encouraged.

### Differentiation

This workflow is owned and self-managed, and it is built to be left. The measure
of success is the practitioner's eventual independence from it — the inverse of a
platform's retention metric. The human stays in planning and design, so intent
is never captured: the parts worth keeping are decided by the person, not
accumulated by the system. Everything below is support for that thesis, not a
claim to have invented any single mechanism.

The individual mechanisms have prior art. Worktree isolation, "the system
controls the agent," the self-perpetuating tick (the "Ralph loop"),
self-hosting, and SCM-as-state-machine are all established practice. What is
distinctive here is the combination and the framing, not any one pattern:

- **The specific combination as a Claude Code harness.** Forkable and
  self-hosted on the practitioner's own GitHub, Firebase, and Anthropic
  accounts, with its state machine being the user's own GitHub issues and labels
  — a multi-phase FSM (plan → implement → fix → qa → review → resolve), not a
  coarse status flag — that self-perpetuates and has a dedicated
  human-escalation queue. We have not seen these assembled together elsewhere.
- **Office-hours as a symmetric peer escalation queue.** Autonomous work parks
  into a human queue, and a human prompt is the de-escalation event that hands
  the item back. This is a framing and design contribution, not an invented
  capability. It differs from "open a PR and hope someone looks" and from
  approval *gates*: a gate blocks forward progress pending sign-off, whereas
  office-hours is a peer queue the work moves into and out of.
- **Marker-absence-as-escalation.** Success requires a positive
  phase-completed marker; the Stop hook fires unconditionally on every exit, so
  any abnormal exit — crash, error, silent stall — fails safe to a human park
  rather than to a false "done." This inverts the usual "the agent decides to
  escalate," and it is grounded in the `dispatch-stop.sh` Stop-hook mechanics
  above.
- **SCM as the only control plane.** The control loop spends zero model tokens:
  the tick is bash plus `systemd-run --user` transient units, not an LLM
  re-prompt. We know of no other harness whose control loop runs without a model
  in it.

The two nearest artifacts differ on the same axes:

- **Code Conductor** coordinates with labels and
  worktrees, like this workflow, but runs a fully autonomous loop with no
  in-loop human-escalation path: its `conductor:blocked` label is defined and
  monitored but is never set by any agent, and `./conductor recover` is
  self-remediation, not a human handoff. Its labels are coarse
  execution-status and health markers, not a multi-phase workflow FSM.
- **Claude Plan Orchestrator** uses human approval
  gates and an approvals queue. Its authoritative state lives in a local SQLite
  store; the status it commits into the git repo is a derived mirror of that
  store. Here there is no authoritative store behind the SCM — the PR, CI, and
  label ground truth *is* the state, re-derived every tick.

### Related work / prior art

The "harness" vocabulary this README uses comes from a body of recent writing on
building reliable systems around coding agents.

- Birgitta Böckeler, ["Harness engineering for coding agent
  users"](https://martinfowler.com/articles/harness-engineering.html) (02 April
  2026, hosted on martinfowler.com) — the Model + Harness split and the
  guides/sensors framing this README borrows.
- Anthropic, ["Effective harnesses for long-running
  agents"](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
  (26 November 2025) and ["Harness design for long-running application
  development"](https://www.anthropic.com/engineering/harness-design-long-running-apps)
  (24 March 2026) — the generator/evaluator harness pattern, which maps onto
  this workflow's QA and review sensor phases.
- OpenAI, ["Harness engineering: leveraging Codex in an agent-first
  world"](https://openai.com/index/harness-engineering/) (11 February 2026) — an
  agent-first repository where the harness, not the human, writes the code.
- LangChain (Vivek Trivedy), ["The Anatomy of an Agent
  Harness"](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) (10
  March 2026) — its articulation of *Agent = Model + Harness*.
- Mitchell Hashimoto, ["My AI Adoption
  Journey"](https://mitchellh.com/writing/my-ai-adoption-journey) (05 February
  2026) — the Ghostty `AGENTS.md` practice of adding one line per past bad agent
  behavior. We call that accumulation a *ratchet*; Hashimoto does not use the
  word.
- METR (Kwa et al.), ["Measuring AI Ability to Complete Long Software
  Tasks"](https://arxiv.org/abs/2503.14499) (arXiv:2503.14499, 18 March 2025) —
  the long-horizon capability trend that makes a leave-it-alone workflow worth
  building. (METR's companion blog post drops "Software" from the title.)
- Addy Osmani, ["Agent Harness
  Engineering"](https://www.oreilly.com/radar/agent-harness-engineering/) (O'Reilly
  Radar, 15 May 2026) — the "skill issue" reframe: most agent failures are
  harness configuration, not model limits.
- [`awesome-harness-engineering`](https://github.com/walkinglabs/awesome-harness-engineering)
  (walkinglabs) — the most-referenced curated index of the field.

The failure modes this workflow's sensors guard against also have names. Khanal
et al., ["Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM
Agents"](https://arxiv.org/abs/2603.29231) (arXiv:2603.29231, 31 March 2026),
describes super-linear reliability decay as tasks lengthen. Orlanski et al.,
["SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon
Iterative Tasks"](https://arxiv.org/abs/2603.24755) (arXiv:2603.24755, 25 March
2026), measures verbosity growth and structural erosion across iterative edits.

## Usage and Contributing
<a href="https://creativecommons.org/licenses/by-sa/4.0/"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" width="117" height="41"></a>

For using and/or extending the artifacts in this repo: forking is encouraged.
