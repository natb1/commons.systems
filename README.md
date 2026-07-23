# commons.systems: a long-horizon agent orchestrator

A harness for long-horizon autonomous agent workflows, built around one data
structure: the **intention graph**. Intent is recorded as a graph of virtues,
strategies, and tactics in [`intentions/`](intentions/); a **dispatch router**
reads that graph to decide what runs next, launches autonomous agent sessions
to do the work, and writes execution state back into the graph. The human
stays in intent — recording strategy under interview, engaging escalations at
office hours — and the router converts that intent into merged PRs.

Owned and self-managed, local-first, built to be forked: not a platform, not a
library, but a reference setup an individual runs on their own GitHub,
Firebase, and Anthropic accounts.

**Status:** the live router still runs on GitHub issues and labels (the
projection-era implementation documented below); the graph-native router that
replaces it is recorded in
[`intentions/strategy-graph-native-dispatch.md`](intentions/strategy-graph-native-dispatch.md),
with the build-out drafted in the graph itself on
[`intentions/tactic-graph-native-dispatch.md`](intentions/tactic-graph-native-dispatch.md).
The two run concurrently until the GitHub queue drains; then the legacy
router is removed.

## The intention graph

The graph is the orchestrator's state store and the owner's record of intent —
one markdown file per node under [`intentions/`](intentions/), schema and
tooling in [`packages/intentionsutil/`](packages/intentionsutil/SCHEMA.md).
Four kinds:

- **Virtues** — permanent dispositions, the roots (`parent: null`). Never
  complete, never ranked; everything else exists to serve them.
- **Strategies** — the first goal layer. Persistent and conditional: a
  strategy carries the author circumstances it is contingent on
  (`attributes.conditions`), a `success_signal` (observable, sensor,
  threshold), the current `reading`, and the derived `gap`. Strategies
  outlive their tactics — they keep tracking signals after all child work
  completes, and leave the graph only when a condition fails or the author
  retires them.
- **Tactics** — the bottom layer: concrete, completable, delegable. A tactic
  is PR-sized (a leaf tactic maps to exactly one PR) or a subtree of tactics
  (the graph's epic). Tactics are transient — completion prunes them.
- **Delegations** — attachment records for external dependencies, reviewed on
  triggers, recoverable via strategy `recovers` edges.

Two mechanisms make the graph executable:

- **Attention.** Authored injections (`boost`/`override`, each with a
  rationale) live in node frontmatter; rank is derived on read — undecayed,
  undiluted, never stored — and is the router's outermost ordering axis.
  Escalating work means authoring a boost, not applying a label.
- **Signals.** A strategy that has no child tactics and an unvalidated signal
  is itself schedulable work: the router starts a session to break it into
  tactics. Sensors write readings back; validated signals quiet the strategy
  until a condition or reading changes.

Authority doctrine: the graph is the source of truth for all data — intent
*and* execution state. GitHub is a projection the graph emits into and reads
back as a sensor, never the origin.

## The align skill family

Three skills are the human interface to the graph (superseding the
issue-based `/file-issue` and `/plan-issue` — coverage matrix on the draft
tactic [`tactic-graph-native-dispatch`](intentions/tactic-graph-native-dispatch.md)):

- **`/align-init`** — the entrypoint for forks and consuming repos. Orients the
  user in the concepts above, validates the tooling deployment, reviews the
  inherited virtue roots (forks start from this repo's; the harness assumes
  inherited virtues and strategies are preserved), interviews for new or
  clarified virtues, then hands off to `/align-strategy`. Its periodic form —
  the scheduled dialectic review — reassesses priorities against the graph.
- **`/align-strategy <optional requirements>`** — records new strategies or
  edits under a dialectic interview: intent, justification by virtues or
  parent strategies, benefit, signals, and the conditions the strategy is
  contingent on. Disambiguation happens here — edge cases are put to the
  author and resolutions are recorded as dated `clarifications` on the node.
  The interview is the audit; the push to `origin/main` makes the record
  schedulable.
- **`/align-tactics <strategy-node-id>`** — scheduled by the router for an
  eligible strategy (not parked, no child tactics, signal unvalidated). It
  decomposes the strategy into the minimum PR-sized tactics that would
  validate the signal this round, writes each tactic's full clean-session
  plan into the node body (per-unit `sonnet`/`opus` delegation tags — the
  cheapest model that will reliably complete the unit), and parks
  non-claude-eligible work as office-hours tactics chunked to ≤30
  author-minutes. Runs autonomously; parks to office hours on genuine
  ambiguity rather than asking mid-run.

## The dispatch router

The router is a headless, self-perpetuating tick — bash plus systemd transient
units, no model in the control loop. Each tick selects the highest-rank
eligible node, spawns one worker session per selection into an isolated git
worktree, and each worker's exit re-launches the tick. Work advances through
phases — plan (`/align-tactics`), implement, fix, qa, review — with a
multi-agent fan-out at the review and fix phases, and auto-merge on a clean
terminal review.

Two queues route every item:

- **Dispatch queue** — autonomous work the chain advances unattended.
- **Office-hours queue** — human-driven work: strategy interviews, judgment
  calls, escalations. Parking is first-class node state
  (`office_hours: {reason, since}`); an autonomous session that hits a
  user-input boundary parks its node instead of guessing, and the item
  returns to the dispatch queue when the human engages it.

Execution state lives in the graph: a tactic node persists its `phase`,
branch/PR anchors, attempt counters, and parking; the router reads PR/CI
status as sensors before committing a transition, and every state change is a
single-node commit pushed to `main` with a rebase-retry loop. Token spend is
paced against a weekly budget curve, so the fleet spreads work across the
rate-limit window instead of burning early and idling.

The projection-era mechanics that still run today — issue labels as phase
markers, GitHub-derived phase, the selection ladder details — are documented
in
[.claude/skills/dispatch-propagate/reference.md](.claude/skills/dispatch-propagate/reference.md);
their graph-native replacements are drafted on
[`tactic-graph-native-dispatch`](intentions/tactic-graph-native-dispatch.md).

## As a harness

Birgitta Böckeler's framing splits an agent into Model + Harness — the harness
is everything around the model that turns a single call into reliable work.
This repo is the *outer harness*: the half you write and own, on top of the
built-in harness Claude Code ships.

- **Guides (feedforward)** — `.claude/rules/*.md` and the per-skill
  `SKILL.md` files.
- **Sensors (feedback)** — **computational**: CI (lint, type-check, test) and
  the graph's registered signal sensors; **inferential**: the `/review-fix`
  reviewer fan-out and the QA pass — LLM-as-judge over the diff.
- **Steering loop** — the intention graph itself: strategies carry signals,
  sensors write readings back, the dialectic re-derives priorities, and
  lessons feed edits to the rules and skills.

## Design principles

- Intent is explicit and owned: the graph is the single authority for what
  the system is trying to do and where that work stands.
- The system controls the agent, not the agent the workflow: the control
  loop is headless script, phase skills are bounded sessions, and escalation
  is fail-safe — a missing completion marker parks to a human, never to a
  false "done."
- Work flows through two queues — autonomous dispatch and human office
  hours — with well-defined break points for human quality control.
- Prefer [skills](https://code.claude.com/docs/en/skills) over other agentic
  artifacts (system instructions, hooks, sub-agents) for portability and
  ease of maintenance.
- Delegate each unit to the cheapest model that will reliably complete it.

## PR control flow (live implementation)

| Phase | Meaning | Skill |
|-------|---------|-------|
| plan | Unplanned work item | [plan-issue](.claude/skills/plan-issue/SKILL.md) → `/align-tactics` |
| implement | Planned, no PR | [implement](.claude/skills/implement/SKILL.md) |
| fix-checks | Draft PR, CI failed | [fix-checks](.claude/skills/fix-checks/SKILL.md) |
| fix-conflicts | Draft PR, `origin/main` merge conflict | [dispatch-conflict](.claude/skills/dispatch-conflict/SKILL.md) |
| qa | Draft PR, CI green | [qa-fix](.claude/skills/qa-fix/SKILL.md) |
| review | QA passed — terminal code + security review, flips draft→ready | [review-fix](.claude/skills/review-fix/SKILL.md) |

Auto-merge lands a reviewed, green, ready PR; completion prunes the tactic
from the graph (today: closes the issue).

## CI/CD

Seven workflows handle all CI/CD. Change detection determines which apps to
test and deploy.

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
- **Shared package changes** (e.g. `authutil/`) scan every app's
  `package.json` for `@commons-systems/` dependencies referencing the changed
  package and mark all matches
- **Global triggers** (`firebase.json`, `firestore.rules`, `storage.rules`,
  `package.json`, `package-lock.json`) mark all apps

An "app" is any workspace listed in the root `package.json` `workspaces`
array.

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

- **Version Control** (git + GitHub): a repo; during the migration period a
  GitHub [project](https://github.com/users/natb1/projects/2) still backs the
  legacy queue.
- **Agentic Coding Tools** (Claude Code): stand up your own `office-hours-nate` instance flake (template: [examples/office-hours-nate/flake.nix](examples/office-hours-nate/flake.nix)) that imports this framework's `homeManagerModules.default` and sets your identity, then `home-manager switch -b backup --flake <your-instance>#<system>` (evaluates purely on every platform — the `wezterm-windows` Windows binary is fetched at activation runtime via `curl`, not at eval time, so no `--impure` is needed).
- **Infrastructure** (Firebase): hosting and storage for the apps this
  instance of the workflow builds.
- **Intent**: run `/align-init` — it validates the deployment, walks the
  inherited virtue roots, and hands off to `/align-strategy` to record your
  first strategy.

## Where to go next

- **Landing page** — [commons.systems](https://commons.systems): the project
  showcase and overview.
- **Graph schema** — [packages/intentionsutil/SCHEMA.md](packages/intentionsutil/SCHEMA.md):
  node format, layer rules, attention, authority doctrine.
- **Router design** — [intentions/tactic-graph-native-dispatch.md](intentions/tactic-graph-native-dispatch.md):
  the graph-native dispatch draft and migration plan, held in the graph as a
  draft tactic.
- **Design system** — [packages/ds](packages/ds/README.md): tokens,
  components, and the visual language.
- **License** — CC-BY-SA; forking is encouraged.

### Differentiation

This workflow is owned and self-managed, and it is built to be left. The
measure of success is the practitioner's eventual independence from it — the
inverse of a platform's retention metric. The human stays in intent, so intent
is never captured: what is worth keeping is decided by the person, recorded in
the graph, not accumulated by the system.

The individual mechanisms have prior art — worktree isolation, "the system
controls the agent," the self-perpetuating tick, self-hosting. What is
distinctive is the combination:

- **Intent as the state machine.** The orchestrator's authoritative state is
  a human-authored intention graph — virtues → strategies → tactics — in the
  practitioner's own repo, not a task queue, a SQLite store, or a platform
  backlog. Priorities are authored attention with rationales; escalation is a
  graph edit; an unvalidated strategy signal *is* the work request.
- **Office-hours as a symmetric peer escalation queue.** Autonomous work
  parks into a human queue, and human engagement is the de-escalation event
  that hands the item back — a peer queue, not an approval gate.
- **Marker-absence-as-escalation.** Success requires a positive completion
  marker; any abnormal exit fails safe to a human park rather than a false
  "done."
- **Zero-token control loop.** The tick is bash plus `systemd-run` transient
  units; model tokens are spent on work, never on deciding to work.

## Related work / prior art

The "harness" vocabulary this README uses comes from a body of recent writing
on building reliable systems around coding agents.

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
